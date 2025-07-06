const functions = require("firebase-functions");
const { TextToSpeechClient } = require("@google-cloud/text-to-speech");
const admin = require("firebase-admin");
const axios = require("axios");

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'marlang-app'
  });
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

// 네이버 소셜 로그인 인증 함수
exports.naverAuth = functions.https.onRequest(async (req, res) => {
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
    const { code, state } = req.body;
    
    if (!code || !state) {
      res.status(400).json({ error: 'Missing code or state parameter' });
      return;
    }

    // 네이버 환경 변수 (환경 변수에서 가져옴)
    const naverClientId = process.env.NAVER_CLIENT_ID || 'Y4ldejPFJ6JxAp95HtpR';
    const naverClientSecret = process.env.NAVER_CLIENT_SECRET || 'dz0e72Lrva';
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

    // 4. 커스텀 토큰 생성 (대체 방법 사용)
    let customToken = null;
    let tokenType = 'none';
    
    try {
      customToken = await admin.auth().createCustomToken(uid, {
        provider: 'naver'
      });
      tokenType = 'custom';
      console.log('커스텀 토큰 생성 성공');
    } catch (tokenError) {
      console.log('커스텀 토큰 생성 실패, 임시 토큰 생성:', tokenError.message);
      
      // 대체 방법: 임시 Firebase Auth 토큰 생성
      // 실제로는 사용자 정보와 함께 클라이언트에서 익명 로그인 후 연결하도록 함
      customToken = `temp_${uid}_${Date.now()}`;
      tokenType = 'temp';
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

    // 6. 클라이언트에 커스텀 토큰과 사용자 정보 반환
    res.json({ 
      success: true,
      customToken: customToken,
      tokenType: tokenType,
      user: {
        uid: uid,
        email: naverUser.email || null,
        name: naverUser.name || naverUser.nickname || 'Unknown',
        picture: naverUser.profile_image || null,
        provider: 'naver',
        naverAccessToken: access_token
      }
    });

  } catch (error) {
    console.error('Naver auth error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
});
