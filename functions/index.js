const functions = require("firebase-functions");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { TextToSpeechClient } = require("@google-cloud/text-to-speech");
const admin = require("firebase-admin");
const axios = require("axios");
const jwt = require("jsonwebtoken");

// Import security middleware
const { errorHandler, asyncErrorHandler } = require("./middleware/errorHandler");
const { rateLimiters, applyRateLimit } = require("./middleware/rateLimiter");

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp();
}

const client = new TextToSpeechClient();

exports.synthesizeSpeech = functions.https.onCall(async (data, context) => {
  const text = data.text;
  if (!text) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with one argument 'text'."
    );
  }

  let ssmlText = '';
  const words = text.split(' ');
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    ssmlText += `${word}<mark name="${i}"/> `;
  }
  const ssml = `<speak>${ssmlText.trim()}</speak>`;

  const request = {
    input: { ssml },
    // 목소리를 WaveNet 기반의 여성 음성으로 변경
    voice: { languageCode: "en-US", name: "en-US-Wavenet-F" },
    audioConfig: { audioEncoding: "MP3" },
    enableTimePointing: ["SSML_MARK"],
  };

  try {
    const [response] = await client.synthesizeSpeech(request);

    const timepoints = response.timepoints
      .map(point => ({
        markName: parseInt(point.markName, 10),
        timeSeconds: point.timeSeconds,
      }))
      .sort((a, b) => a.markName - b.markName);

    const result = {
      audioContent: response.audioContent.toString("base64"),
      timepoints: timepoints,
    };

    return result;

  } catch (error) {
    console.error("ERROR:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to synthesize speech.",
      error
    );
  }
});

// 라인 소셜 로그인 인증 함수
exports.lineAuth = functions.https.onRequest(applyRateLimit(rateLimiters.auth), async (req, res) => {
  // CORS 헤더 설정
  res.set('Access-Control-Allow-Origin', 'https://marlang-app.web.app');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { code, redirectUri } = req.body;

    if (!code || !redirectUri) {
      res.status(400).json({ error: 'Missing code or redirectUri parameter' });
      return;
    }

    // 라인 환경 변수
    const lineClientId = process.env.LINE_CLIENT_ID;
    const lineClientSecret = process.env.LINE_CLIENT_SECRET;

    if (!lineClientId || !lineClientSecret) {
      console.error('🚨 Missing Line OAuth credentials');
      res.status(500).json({
        error: 'Server configuration error',
        message: 'OAuth credentials not configured'
      });
      return;
    }

    console.log('라인 OAuth 요청 시작:', { hasCode: !!code, redirectUri });

    // 1. 라인 액세스 토큰 요청
    const tokenResponse = await axios.post('https://api.line.me/oauth2/v2.1/token', 
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: lineClientId,
        client_secret: lineClientSecret
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    console.log('라인 토큰 응답:', tokenResponse.data);
    const { access_token, refresh_token, id_token } = tokenResponse.data;

    if (!access_token) {
      throw new Error(`Failed to get access token from Line: ${JSON.stringify(tokenResponse.data)}`);
    }

    // 2. 라인 사용자 정보 요청
    const userResponse = await axios.get('https://api.line.me/v2/profile', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    console.log('라인 사용자 정보 응답:', userResponse.data);
    const lineUser = userResponse.data;

    if (!lineUser || !lineUser.userId) {
      throw new Error(`Failed to get user info from Line: ${JSON.stringify(userResponse.data)}`);
    }

    // 3. Firebase Auth에 라인 사용자 등록/업데이트
    const uid = `line_${lineUser.userId}`;

    try {
      // 기존 사용자 확인
      await admin.auth().getUser(uid);
      console.log('기존 Firebase 사용자 발견:', uid);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // 새 사용자 생성
        console.log('새 Firebase 사용자 생성:', uid);
        await admin.auth().createUser({
          uid: uid,
          email: `${uid}@line.local`, // 라인은 이메일을 제공하지 않을 수 있음
          displayName: lineUser.displayName || 'Line User',
          photoURL: lineUser.pictureUrl || null
        });
      } else {
        throw error;
      }
    }

    // 4. Firestore에 사용자 정보 저장/업데이트
    const userDoc = {
      uid: uid,
      email: `${uid}@line.local`,
      name: lineUser.displayName || 'Line User',
      picture: lineUser.pictureUrl || null,
      provider: 'line',
      role: 'user',
      lineUserId: lineUser.userId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // 기존 사용자인지 확인
    const userRef = admin.firestore().collection('users').doc(uid);
    const existingUser = await userRef.get();

    if (!existingUser.exists) {
      userDoc.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }

    await userRef.set(userDoc, { merge: true });

    // 5. 응답 데이터 구성
    const responseData = {
      success: true,
      user: {
        userId: lineUser.userId,
        displayName: lineUser.displayName,
        pictureUrl: lineUser.pictureUrl,
        email: `${uid}@line.local`
      },
      accessToken: access_token,
      refreshToken: refresh_token
    };

    console.log('📤 라인 인증 응답:', {
      success: responseData.success,
      userId: responseData.user.userId
    });

    res.json(responseData);

  } catch (error) {
    console.error('Line auth error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 네이버 소셜 로그인 인증 함수 (업데이트됨)
exports.naverAuth = functions.https.onRequest(applyRateLimit(rateLimiters.auth), async (req, res) => {
  // CORS 헤더 설정
  res.set('Access-Control-Allow-Origin', 'https://marlang-app.web.app');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { code, state } = req.body;

    if (!code || !state) {
      res.status(400).json({ error: 'Missing code or state parameter' });
      return;
    }

    // 네이버 환경 변수 (process.env에서 가져옴)
    const naverClientId = process.env.NAVER_CLIENT_ID;
    const naverClientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!naverClientId || !naverClientSecret) {
      console.error('🚨 Missing Naver OAuth credentials');
      res.status(500).json({
        error: 'Server configuration error',
        message: 'OAuth credentials not configured'
      });
      return;
    }

    // 디버깅용 로그 (실제 값은 로그에 남기지 않음)
    console.log('환경변수 확인:', {
      hasClientId: !!naverClientId,
      hasClientSecret: !!naverClientSecret,
      envKeys: Object.keys(process.env).filter(key => key.includes('NAVER') || key.includes('JWT'))
    });
    const redirectUri = 'https://marlang-app.web.app/auth/naver/callback';

    // 1. 네이버 액세스 토큰 요청
    console.log('토큰 요청 파라미터:', {
      grant_type: 'authorization_code',
      client_id: naverClientId,
      client_secret: naverClientSecret.substring(0, 3) + '***',
      code: code.substring(0, 10) + '***',
      state: state,
      redirect_uri: redirectUri
    });

    const tokenResponse = await axios.post('https://nid.naver.com/oauth2.0/token', null, {
      params: {
        grant_type: 'authorization_code',
        client_id: naverClientId,
        client_secret: naverClientSecret,
        code: code,
        state: state,
        redirect_uri: redirectUri
      }
    });

    console.log('네이버 토큰 응답:', tokenResponse.data);
    const { access_token } = tokenResponse.data;

    if (!access_token) {
      console.error('네이버 토큰 응답 전체:', tokenResponse.data);
      throw new Error(`Failed to get access token from Naver: ${JSON.stringify(tokenResponse.data)}`);
    }

    // 2. 네이버 사용자 정보 요청
    const userResponse = await axios.get('https://openapi.naver.com/v1/nid/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    console.log('네이버 사용자 정보 응답:', userResponse.data);
    const naverUser = userResponse.data.response;

    if (!naverUser) {
      console.error('네이버 사용자 정보 응답 전체:', userResponse.data);
      throw new Error(`Failed to get user info from Naver: ${JSON.stringify(userResponse.data)}`);
    }

    // 3. Firebase Auth에 네이버 사용자 등록/업데이트
    const uid = `naver_${naverUser.id}`;

    try {
      // 기존 사용자 확인
      await admin.auth().getUser(uid);
      console.log('기존 Firebase 사용자 발견:', uid);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // 새 사용자 생성
        console.log('새 Firebase 사용자 생성:', uid);
        await admin.auth().createUser({
          uid: uid,
          email: naverUser.email || `${uid}@naver.temp`,
          displayName: naverUser.name || naverUser.nickname || 'Unknown',
          photoURL: naverUser.profile_image || null
        });
      } else {
        throw error;
      }
    }

    // 4. 커스텀 토큰 생성
    let customToken = null;
    let tokenType = 'server_auth'; // 기본적으로 서버 인증 모드

    try {
      // 커스텀 토큰 생성 시도
      customToken = await admin.auth().createCustomToken(uid, {
        provider: 'naver',
        naverUserId: naverUser.id
      });
      tokenType = 'custom';
      console.log('✅ 커스텀 토큰 생성 성공');
    } catch (tokenError) {
      console.log('⚠️ 커스텀 토큰 생성 실패, 서버 인증 모드 사용:', tokenError.message);
      // IAM 권한 문제가 있어도 서버 인증 모드로 계속 진행
      customToken = null;
      tokenType = 'server_auth';
    }

    // 5. Firestore에 사용자 정보 저장/업데이트
    console.log('네이버 사용자 상세 정보:', {
      id: naverUser.id,
      email: naverUser.email,
      name: naverUser.name,
      nickname: naverUser.nickname,
      profile_image: naverUser.profile_image
    });

    const userDoc = {
      uid: uid,
      email: naverUser.email || null,
      name: naverUser.name || naverUser.nickname || 'Unknown',
      picture: naverUser.profile_image || null,
      provider: 'naver',
      role: 'user',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // 기존 사용자인지 확인
    const userRef = admin.firestore().collection('users').doc(uid);
    const existingUser = await userRef.get();

    if (!existingUser.exists) {
      userDoc.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }

    await userRef.set(userDoc, { merge: true });

    // 6. 기존 localStorage 방식 응답
    const responseData = {
      success: true,
      tokenType: 'server_auth',
      user: {
        uid: uid,
        email: naverUser.email || null,
        name: naverUser.name || naverUser.nickname || 'Unknown',
        picture: naverUser.profile_image || null,
        provider: 'naver',
        isServerAuth: true
      }
    };

    console.log('📤 서버 인증 응답:', {
      success: responseData.success,
      tokenType: responseData.tokenType,
      userEmail: responseData.user.email
    });

    res.json(responseData);

  } catch (error) {
    console.error('Naver auth error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 사용자 데이터 저장 함수
exports.saveUserData = functions.https.onRequest(applyRateLimit(rateLimiters.data), async (req, res) => {
  // CORS 헤더 설정
  res.set('Access-Control-Allow-Origin', 'https://marlang-app.web.app');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { userId, dataType, data, userInfo } = req.body;

    if (!userId || !dataType || !data) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }

    // Firestore에 데이터 저장
    const userDataRef = admin.firestore().collection('users').doc(userId).collection('data').doc(dataType);

    const payload = {
      [dataType === 'savedWords' ? 'words' :
        dataType === 'likedArticles' ? 'articles' :
          dataType === 'settings' ? 'settings' : 'records']: data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await userDataRef.set(payload, { merge: true });

    // 사용자 정보도 업데이트
    if (userInfo) {
      const userRef = admin.firestore().collection('users').doc(userId);
      await userRef.set({
        ...userInfo,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }

    console.log(`✅ 사용자 ${userId}의 ${dataType} 데이터 저장 완료`);

    res.json({
      success: true,
      message: `${dataType} data saved successfully`
    });

  } catch (error) {
    console.error('Save user data error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 사용자 데이터 로드 함수
exports.getUserData = functions.https.onRequest(async (req, res) => {
  // CORS 헤더 설정
  res.set('Access-Control-Allow-Origin', 'https://marlang-app.web.app');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const userId = req.query.userId;

    if (!userId) {
      res.status(400).json({ error: 'Missing userId parameter' });
      return;
    }

    // Firestore에서 모든 사용자 데이터 로드
    const userDataCollection = admin.firestore().collection('users').doc(userId).collection('data');
    const snapshot = await userDataCollection.get();

    const userData = {
      savedWords: [],
      likedArticles: [],
      settings: {},
      viewRecords: []
    };

    snapshot.forEach(doc => {
      const docId = doc.id;
      const docData = doc.data();

      if (docId === 'savedWords' && docData.words) {
        userData.savedWords = docData.words;
      } else if (docId === 'likedArticles' && docData.articles) {
        userData.likedArticles = docData.articles;
      } else if (docId === 'settings' && docData.settings) {
        userData.settings = docData.settings;
      } else if (docId === 'viewRecords' && docData.records) {
        userData.viewRecords = docData.records;
      }
    });

    console.log(`✅ 사용자 ${userId}의 데이터 로드 완료`);

    res.json(userData);

  } catch (error) {
    console.error('Get user data error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// JWT 토큰 생성 함수
exports.createJWTToken = functions.https.onRequest(applyRateLimit(rateLimiters.auth), async (req, res) => {
  res.set('Access-Control-Allow-Origin', 'https://marlang-app.web.app');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { userId, userInfo } = req.body;

    if (!userId || !userInfo) {
      res.status(400).json({ error: 'Missing userId or userInfo' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('🚨 JWT_SECRET environment variable is required');
      res.status(500).json({
        error: 'Server configuration error',
        message: 'JWT_SECRET not configured'
      });
      return;
    }
    const accessTokenExpiry = '15m'; // 15분
    const refreshTokenExpiry = '7d'; // 7일

    // Access Token 생성
    const accessToken = jwt.sign(
      {
        userId: userId,
        email: userInfo.email,
        provider: userInfo.provider,
        type: 'access'
      },
      jwtSecret,
      { expiresIn: accessTokenExpiry }
    );

    // Refresh Token 생성
    const refreshToken = jwt.sign(
      {
        userId: userId,
        type: 'refresh'
      },
      jwtSecret,
      { expiresIn: refreshTokenExpiry }
    );

    // HttpOnly 쿠키 설정
    const isProduction = req.get('host')?.includes('cloudfunctions.net');
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 15 * 60 * 1000, // 15분
      path: '/'
    };

    res.cookie('accessToken', accessToken, cookieOptions);

    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
    });

    res.json({
      success: true,
      message: 'JWT tokens created successfully',
      user: {
        uid: userId,
        email: userInfo.email,
        name: userInfo.name,
        provider: userInfo.provider
      }
    });

  } catch (error) {
    console.error('Create JWT token error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// JWT 토큰 검증 함수
exports.verifyJWTToken = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', 'https://marlang-app.web.app');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    console.log('🔍 쿠키 확인:', req.cookies);
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      console.log('❌ Access token이 쿠키에 없음');
      res.status(401).json({ error: 'No access token found' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('🚨 JWT_SECRET environment variable is required');
      res.status(500).json({
        error: 'Server configuration error',
        message: 'JWT_SECRET not configured'
      });
      return;
    }

    try {
      const decoded = jwt.verify(accessToken, jwtSecret);
      console.log('✅ JWT 토큰 검증 성공:', decoded.userId);

      if (decoded.type !== 'access') {
        res.status(401).json({ error: 'Invalid token type' });
        return;
      }

      // Firestore에서 최신 사용자 정보 가져오기
      const userRef = admin.firestore().collection('users').doc(decoded.userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        res.status(401).json({ error: 'User not found' });
        return;
      }

      const userInfo = userDoc.data();

      res.json({
        success: true,
        user: {
          uid: decoded.userId,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          provider: userInfo.provider
        }
      });

    } catch (jwtError) {
      console.error('JWT 검증 오류:', jwtError);
      if (jwtError.name === 'TokenExpiredError') {
        res.status(401).json({ error: 'Token expired' });
      } else {
        res.status(401).json({ error: 'Invalid token' });
      }
    }

  } catch (error) {
    console.error('Verify JWT token error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// JWT 토큰 갱신 함수
exports.refreshJWTToken = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', 'https://marlang-app.web.app');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ error: 'No refresh token found' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('🚨 JWT_SECRET environment variable is required');
      res.status(500).json({
        error: 'Server configuration error',
        message: 'JWT_SECRET not configured'
      });
      return;
    }

    try {
      const decoded = jwt.verify(refreshToken, jwtSecret);

      if (decoded.type !== 'refresh') {
        res.status(401).json({ error: 'Invalid token type' });
        return;
      }

      // 사용자 정보 다시 가져오기
      const userRef = admin.firestore().collection('users').doc(decoded.userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        res.status(401).json({ error: 'User not found' });
        return;
      }

      const userInfo = userDoc.data();

      // 새 Access Token 생성
      const newAccessToken = jwt.sign(
        {
          userId: decoded.userId,
          email: userInfo.email,
          provider: userInfo.provider,
          type: 'access'
        },
        jwtSecret,
        { expiresIn: '15m' }
      );

      // 새 Access Token 쿠키 설정
      const isProduction = req.get('host')?.includes('cloudfunctions.net');
      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 15 * 60 * 1000, // 15분
        path: '/'
      });

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        user: {
          uid: decoded.userId,
          email: userInfo.email,
          name: userInfo.name,
          provider: userInfo.provider
        }
      });

    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        res.status(401).json({ error: 'Refresh token expired' });
      } else {
        res.status(401).json({ error: 'Invalid refresh token' });
      }
    }

  } catch (error) {
    console.error('Refresh JWT token error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 사용자 로그아웃 함수
exports.logoutUser = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', 'https://marlang-app.web.app');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    // 쿠키 삭제
    const isProduction = req.get('host')?.includes('cloudfunctions.net');
    const clearOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/'
    };

    res.clearCookie('accessToken', clearOptions);
    res.clearCookie('refreshToken', clearOptions);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 예약 기사 자동 발행 함수 (시간 처리 로직 수정)
exports.publishScheduledArticles = functions.https.onRequest(async (req, res) => {
  // CORS 헤더 설정
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    console.log('⏰ 예약 기사 자동 발행 체크 시작');

    // 현재 UTC 시간 (Firestore에 저장된 시간과 동일한 기준)
    const nowUTC = new Date();
    const nowUTCISO = nowUTC.toISOString();

    // 한국 시간으로 표시용
    const nowKST = new Date(nowUTC.getTime() + (9 * 60 * 60 * 1000));

    console.log(`현재 시간 - UTC: ${nowUTCISO}, KST: ${nowKST.toLocaleString('ko-KR')}`);

    // scheduled 상태이면서 발행 시간이 지난 기사들 조회 (UTC 기준)
    const articlesRef = admin.firestore().collection('articles');
    const query = articlesRef
      .where('status', '==', 'scheduled')
      .where('publishedAt', '<=', nowUTCISO);

    const querySnapshot = await query.get();

    if (querySnapshot.empty) {
      console.log('📅 발행할 예약 기사가 없습니다.');
      res.json({ success: true, publishedCount: 0, message: '발행할 예약 기사가 없습니다.' });
      return;
    }

    let publishedCount = 0;
    const batch = admin.firestore().batch();
    const publishedArticles = [];

    querySnapshot.forEach((doc) => {
      const articleData = doc.data();

      // 발행 시간 확인 (UTC 기준)
      const articlePublishTime = new Date(articleData.publishedAt);

      console.log(`기사 "${articleData.title}" - 예약시간: ${articlePublishTime.toISOString()}, 현재시간: ${nowUTCISO}`);

      if (nowUTC >= articlePublishTime) {
        // 배치 업데이트 추가
        batch.update(doc.ref, {
          status: 'published',
          actualPublishedAt: nowUTCISO, // 실제 발행된 시간 기록 (UTC)
          updatedAt: nowUTCISO
        });

        publishedArticles.push({
          id: doc.id,
          title: articleData.title,
          scheduledTime: articlePublishTime.toISOString(),
          publishedTime: nowUTCISO
        });

        console.log(`✅ 예약 기사 발행 예정: ${articleData.title}`);
        publishedCount++;
      }
    });

    if (publishedCount > 0) {
      // 배치 커밋
      await batch.commit();
      console.log(`🚀 총 ${publishedCount}개의 예약 기사가 자동 발행되었습니다.`);

      // 발행된 기사 목록 로그
      publishedArticles.forEach(article => {
        console.log(`📰 발행완료: ${article.title} (ID: ${article.id})`);
      });
    }

    res.json({
      success: true,
      publishedCount,
      message: `${publishedCount}개의 예약 기사가 자동 발행되었습니다.`,
      publishedArticles: publishedArticles,
      timestamp: nowUTCISO
    });

  } catch (error) {
    console.error('🚨 예약 기사 자동 발행 중 오류 발생:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 기사 프리렌더링 함수 (SEO 최적화)
const { prerenderArticle } = require('./prerenderArticle');
exports.prerenderArticle = prerenderArticle;

// 소셜 미디어 프리렌더링 함수
const { socialPrerender } = require('./socialPrerender');
exports.socialPrerender = socialPrerender;

// 사이트맵 서빙 함수
const { serveSitemap } = require('./serveSitemap');
exports.serveSitemap = serveSitemap;

// 자동 사이트맵 업데이트 시스템
const { updateSitemap, analyzeAllArticles } = require('./sitemapGenerator');

// Firestore 트리거: 기사 생성/수정/삭제 시 사이트맵 자동 업데이트
exports.onArticleWrite = onDocumentWritten('articles/{articleId}', async (event) => {
  try {
    const articleId = event.params.articleId;
    const before = event.data.before ? event.data.before.data() : null;
    const after = event.data.after ? event.data.after.data() : null;

    // 변경 유형 판단
    let changeType = 'unknown';
    let shouldUpdateSitemap = false;

    if (!before && after) {
      // 새 기사 생성
      changeType = 'created';
      shouldUpdateSitemap = after.status === 'published';
      console.log(`📝 새 기사 생성: ${articleId} (상태: ${after.status})`);
    } else if (before && after) {
      // 기사 수정
      changeType = 'updated';

      // 발행 상태 변경 확인
      const statusChanged = before.status !== after.status;
      const becamePublished = after.status === 'published' && before.status !== 'published';
      const becameUnpublished = before.status === 'published' && after.status !== 'published';

      shouldUpdateSitemap = statusChanged && (becamePublished || becameUnpublished);

      if (shouldUpdateSitemap) {
        console.log(`📝 기사 상태 변경: ${articleId} (${before.status} → ${after.status})`);
      }
    } else if (before && !after) {
      // 기사 삭제
      changeType = 'deleted';
      shouldUpdateSitemap = before.status === 'published';
      console.log(`🗑️ 기사 삭제: ${articleId} (이전 상태: ${before.status})`);
    }

    // 사이트맵 업데이트 필요 시 실행
    if (shouldUpdateSitemap) {
      console.log(`🔄 사이트맵 자동 업데이트 트리거 (이유: article_${changeType})`);
      console.log(`📊 기사 정보: ID=${articleId}, 제목=${after?.title || before?.title || 'Unknown'}`);

      // 비동기로 사이트맵 업데이트 (응답 지연 방지)
      setImmediate(async () => {
        try {
          const result = await updateSitemap(`article_${changeType}_${articleId}`);
          console.log(`✅ 사이트맵 자동 업데이트 완료 (${changeType})`);
          console.log(`� 업데이이트 후 통계:`, result.stats);
        } catch (error) {
          console.error(`🚨 사이트맵 자동 업데이트 실패 (${changeType}):`, error);
        }
      });
    } else {
      console.log(`ℹ️ 사이트맵 업데이트 불필요 (${changeType}, 발행 상태 아님)`);
      console.log(`📊 기사 상태: before=${before?.status || 'null'}, after=${after?.status || 'null'}`);
    }

  } catch (error) {
    console.error('🚨 기사 변경 트리거 처리 실패:', error);
  }
});

// 사이트맵 상태 확인 함수 (디버깅용)
exports.checkSitemapStatus = functions.https.onRequest(async (req, res) => {
  // CORS 헤더 설정
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const db = admin.firestore();
    
    // 현재 사이트맵 데이터 확인
    const sitemapDoc = await db.collection('system').doc('sitemap').get();
    
    // 발행된 기사 수 확인
    const articlesSnapshot = await db.collection('articles')
      .where('status', '==', 'published')
      .get();
    
    const publishedCount = articlesSnapshot.size;
    
    let sitemapInfo = null;
    if (sitemapDoc.exists) {
      const data = sitemapDoc.data();
      const articleUrlCount = (data.xml.match(/\/article\//g) || []).length;
      
      sitemapInfo = {
        exists: true,
        lastUpdated: data.lastUpdated,
        stats: data.stats,
        articleUrlsInSitemap: articleUrlCount,
        xmlLength: data.xml.length
      };
    }
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      publishedArticlesInDB: publishedCount,
      sitemapInfo: sitemapInfo || { exists: false },
      needsUpdate: sitemapInfo ? sitemapInfo.articleUrlsInSitemap !== publishedCount : true
    });
    
  } catch (error) {
    console.error('🚨 사이트맵 상태 확인 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 수동 사이트맵 업데이트 함수 (관리자용)
exports.updateSitemapManual = functions.https.onRequest(async (req, res) => {
  // CORS 헤더 설정 (강화)
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://marlang-app.web.app',
    'https://marlang-app.firebaseapp.com',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  } else {
    res.set('Access-Control-Allow-Origin', 'https://marlang-app.web.app');
  }
  
  res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, User-Agent');
  res.set('Access-Control-Allow-Credentials', 'false');
  res.set('Access-Control-Max-Age', '3600');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // GET 요청 처리 (연결 테스트용)
  if (req.method === 'GET') {
    console.log('🧪 연결 테스트 요청 수신');
    console.log('📡 Origin:', origin);
    console.log('📡 User-Agent:', req.headers['user-agent']);
    
    res.json({
      success: true,
      message: 'Sitemap update function is running',
      timestamp: new Date().toISOString(),
      endpoint: 'updateSitemapManual',
      origin: origin,
      method: 'GET'
    });
    return;
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    res.status(405).json({
      success: false,
      error: 'Method Not Allowed',
      message: `${req.method} method is not allowed. Use POST.`
    });
    return;
  }

  try {
    console.log('🔧 수동 사이트맵 업데이트 요청');
    console.log('📡 Request method:', req.method);
    console.log('📡 Request origin:', origin);
    console.log('📡 Request timestamp:', new Date().toISOString());
    console.log('📡 Request body:', req.body);

    // 요청 유효성 검사
    const requestData = req.body || {};
    console.log('📦 Request data:', {
      timestamp: requestData.timestamp,
      source: requestData.source,
      hasUserAgent: !!requestData.userAgent
    });

    // 관리자 권한 확인 (선택적)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decodedToken = await admin.auth().verifyIdToken(token);
        console.log(`👤 인증된 사용자: ${decodedToken.email}`);
      } catch (authError) {
        console.warn('⚠️ 토큰 검증 실패, 익명 요청으로 처리:', authError.message);
      }
    } else {
      console.log('ℹ️ 익명 요청으로 처리 (인증 헤더 없음)');
    }

    // 사이트맵 업데이트 실행
    console.log('🔄 사이트맵 수동 업데이트 시작...');
    const result = await updateSitemap('manual_request');
    console.log('✅ 사이트맵 수동 업데이트 완료:', result.stats);
    
    // 업데이트 후 Firestore에서 확인
    const db = admin.firestore();
    const sitemapDoc = await db.collection('system').doc('sitemap').get();
    const verificationData = sitemapDoc.exists ? sitemapDoc.data() : null;
    
    if (verificationData) {
      const verificationArticleCount = (verificationData.xml.match(/\/article\//g) || []).length;
      console.log('🔍 Firestore 검증 - 기사 개수:', verificationArticleCount);
      console.log('🔍 Firestore 검증 - 마지막 업데이트:', verificationData.lastUpdated);
    }

    res.json({
      success: true,
      message: '사이트맵이 성공적으로 업데이트되었습니다.',
      timestamp: new Date().toISOString(),
      stats: result.stats,
      sitemapUrl: result.sitemapUrl,
      debug: {
        articlesFound: result.stats.articles,
        totalUrls: result.stats.totalUrls,
        lastUpdated: result.timestamp,
        firestoreVerification: verificationData ? {
          articles: (verificationData.xml.match(/\/article\//g) || []).length,
          lastUpdated: verificationData.lastUpdated,
          forceUpdate: verificationData.forceUpdate
        } : null
      }
    });

  } catch (error) {
    console.error('🚨 수동 사이트맵 업데이트 실패:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 기사 분석 함수 (디버깅용)
exports.analyzeArticles = functions.https.onRequest(async (req, res) => {
  // CORS 헤더 설정
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    console.log('🔍 기사 분석 시작...');
    
    const analysis = await analyzeAllArticles();
    
    if (analysis) {
      console.log('✅ 기사 분석 완료');
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        analysis: analysis
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Analysis failed'
      });
    }
    
  } catch (error) {
    console.error('🚨 기사 분석 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Firestore 사이트맵 데이터 직접 확인 함수 (디버깅용)
exports.checkFirestoreSitemap = functions.https.onRequest(async (req, res) => {
  // CORS 헤더 설정
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    console.log('🔍 Firestore 사이트맵 데이터 확인 시작...');
    
    const db = admin.firestore();
    const sitemapDoc = await db.collection('system').doc('sitemap').get();
    
    if (!sitemapDoc.exists) {
      res.json({
        success: false,
        error: 'Sitemap document not found in Firestore'
      });
      return;
    }
    
    const sitemapData = sitemapDoc.data();
    const xml = sitemapData.xml || '';
    
    // XML에서 기사 개수 계산
    const articleMatches = xml.match(/\/article\//g) || [];
    const articleCount = articleMatches.length;
    
    // XML 길이 및 기본 정보
    const xmlLength = xml.length;
    const lastUpdated = sitemapData.lastUpdated;
    const forceUpdate = sitemapData.forceUpdate;
    
    // XML 샘플 (처음 1000자)
    const xmlSample = xml.substring(0, 1000);
    
    console.log(`📊 Firestore 사이트맵 분석:`);
    console.log(`  - XML 길이: ${xmlLength}`);
    console.log(`  - 기사 개수: ${articleCount}`);
    console.log(`  - 마지막 업데이트: ${lastUpdated}`);
    console.log(`  - 강제 업데이트: ${forceUpdate}`);
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      firestore: {
        exists: true,
        xmlLength: xmlLength,
        articleCount: articleCount,
        lastUpdated: lastUpdated,
        forceUpdate: forceUpdate,
        stats: sitemapData.stats,
        xmlSample: xmlSample
      }
    });
    
  } catch (error) {
    console.error('🚨 Firestore 사이트맵 확인 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 스케줄된 사이트맵 업데이트 (일일 1회)
exports.updateSitemapScheduled = onSchedule('0 2 * * *', async (event) => {
  try {
    console.log('⏰ 스케줄된 사이트맵 업데이트 시작');

    const result = await updateSitemap('scheduled_daily');

    console.log('✅ 스케줄된 사이트맵 업데이트 완료');
    console.log('📊 업데이트 통계:', result.stats);

    return;
  } catch (error) {
    console.error('🚨 스케줄된 사이트맵 업데이트 실패:', error);
    throw error;
  }
});

// 수동 예약 기사 발행 함수 (관리자용) - UTC 기준으로 통일
exports.publishScheduledArticlesManual = functions.https.onRequest(async (req, res) => {
  // CORS 헤더 설정
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    console.log('🔧 예약 기사 수동 발행 체크 시작 (관리자용)');

    // 현재 UTC 시간 (자동 발행과 동일한 로직)
    const nowUTC = new Date();
    const nowUTCISO = nowUTC.toISOString();

    // 한국 시간으로 표시용
    const nowKST = new Date(nowUTC.getTime() + (9 * 60 * 60 * 1000));

    console.log(`현재 시간 - UTC: ${nowUTCISO}, KST: ${nowKST.toLocaleString('ko-KR')}`);

    // scheduled 상태이면서 발행 시간이 지난 기사들 조회 (UTC 기준)
    const articlesRef = admin.firestore().collection('articles');
    const query = articlesRef
      .where('status', '==', 'scheduled')
      .where('publishedAt', '<=', nowUTCISO);

    const querySnapshot = await query.get();

    if (querySnapshot.empty) {
      console.log('📅 발행할 예약 기사가 없습니다.');
      res.json({ success: true, publishedCount: 0, message: '발행할 예약 기사가 없습니다.' });
      return;
    }

    let publishedCount = 0;
    const batch = admin.firestore().batch();
    const publishedArticles = [];

    querySnapshot.forEach((doc) => {
      const articleData = doc.data();

      // 발행 시간 확인 (UTC 기준)
      const articlePublishTime = new Date(articleData.publishedAt);

      console.log(`기사 "${articleData.title}" - 예약시간: ${articlePublishTime.toISOString()}, 현재시간: ${nowUTCISO}`);

      if (nowUTC >= articlePublishTime) {
        // 배치 업데이트 추가
        batch.update(doc.ref, {
          status: 'published',
          actualPublishedAt: nowUTCISO, // 실제 발행된 시간 기록 (UTC)
          updatedAt: nowUTCISO
        });

        publishedArticles.push({
          id: doc.id,
          title: articleData.title,
          scheduledTime: articlePublishTime.toISOString(),
          publishedTime: nowUTCISO
        });

        console.log(`✅ 예약 기사 수동 발행 예정: ${articleData.title}`);
        publishedCount++;
      }
    });

    if (publishedCount > 0) {
      // 배치 커밋
      await batch.commit();
      console.log(`🚀 총 ${publishedCount}개의 예약 기사가 수동 발행되었습니다.`);

      // 발행된 기사 목록 로그
      publishedArticles.forEach(article => {
        console.log(`📰 수동발행완료: ${article.title} (ID: ${article.id})`);
      });
    }

    res.json({
      success: true,
      publishedCount,
      message: `${publishedCount}개의 예약 기사가 수동 발행되었습니다.`,
      publishedArticles: publishedArticles,
      timestamp: nowUTCISO,
      type: 'manual'
    });

  } catch (error) {
    console.error('🚨 예약 기사 수동 발행 중 오류 발생:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
