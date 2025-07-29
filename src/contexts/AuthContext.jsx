import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithRedirect, signInWithPopup, getRedirectResult, signOut as firebaseSignOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithCustomToken as _signInWithCustomToken } from 'firebase/auth';
import { auth, googleProvider, db } from '../config/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [naverAuthInitialized, setNaverAuthInitialized] = useState(false);

  // 초기 로드 시 인증 확인 (localStorage 방식만 사용)
  useEffect(() => {
    const checkAuth = () => {
      console.log('🔍 AuthContext 초기 인증 확인 시작');
      
      // 소셜 인증 사용자 확인 (네이버, 라인)
      const naverAuthUser = localStorage.getItem('naverAuthUser');
      const lineAuthUser = localStorage.getItem('lineAuthUser');
      
      if (naverAuthUser) {
        try {
          const naverUserData = JSON.parse(naverAuthUser);
          console.log('🔍 네이버 서버 인증 사용자 발견:', naverUserData.email);
          console.log('🔍 네이버 사용자 데이터:', naverUserData);
          
          const userObj = {
            id: naverUserData.uid,
            uid: naverUserData.uid,
            email: naverUserData.email,
            name: naverUserData.name,
            picture: naverUserData.picture,
            provider: naverUserData.provider,
            role: 'user',
            isServerAuth: true
          };
          
          console.log('✅ 네이버 사용자 상태 설정:', userObj);
          setUser(userObj);
          setNaverAuthInitialized(true);
          setIsLoading(false);
          return true;
        } catch (err) {
          console.error('네이버 인증 사용자 처리 오류:', err);
          localStorage.removeItem('naverAuthUser');
        }
      }
      
      if (lineAuthUser) {
        try {
          const lineUserData = JSON.parse(lineAuthUser);
          console.log('🔍 라인 서버 인증 사용자 발견:', lineUserData.email);
          console.log('🔍 라인 사용자 데이터:', lineUserData);
          
          const userObj = {
            id: lineUserData.uid,
            uid: lineUserData.uid,
            email: lineUserData.email,
            name: lineUserData.name,
            picture: lineUserData.picture,
            provider: lineUserData.provider,
            role: 'user',
            isServerAuth: true
          };
          
          console.log('✅ 라인 사용자 상태 설정:', userObj);
          setUser(userObj);
          setNaverAuthInitialized(true);
          setIsLoading(false);
          return true;
        } catch (err) {
          console.error('라인 인증 사용자 처리 오류:', err);
          localStorage.removeItem('lineAuthUser');
        }
      }
      
      // 더 이상 사용하지 않는 게스트 관련 로컬 저장소 데이터 정리
      localStorage.removeItem('guestNaverUser');
      localStorage.removeItem('tempNaverUser');
      localStorage.removeItem('pendingNaverUser');
      
      console.log('🔍 소셜 인증 사용자 없음, 로딩 완료');
      setNaverAuthInitialized(true);
      setIsLoading(false);
      return false;
    };

    checkAuth();
  }, []);

  useEffect(() => {
    // 네이버 인증 초기화가 완료된 후에만 Firebase 인증 상태 감지 시작
    if (!naverAuthInitialized) return;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔍 Firebase 인증 상태 변경:', firebaseUser?.email || '로그아웃 상태');
      
      // 소셜 서버 인증이 이미 설정된 경우 Firebase 인증 무시
      const naverAuthUser = localStorage.getItem('naverAuthUser');
      const lineAuthUser = localStorage.getItem('lineAuthUser');
      if (naverAuthUser || lineAuthUser) {
        console.log('🔍 소셜 인증이 이미 설정됨, Firebase 인증 변경 무시');
        console.log('🔍 현재 user 상태:', user?.email || 'null');
        
        // 소셜 사용자가 설정되지 않았다면 다시 설정
        if (!user || !user.isServerAuth) {
          try {
            let socialUserData = null;
            let provider = '';
            
            if (naverAuthUser) {
              socialUserData = JSON.parse(naverAuthUser);
              provider = 'naver';
            } else if (lineAuthUser) {
              socialUserData = JSON.parse(lineAuthUser);
              provider = 'line';
            }
            
            if (socialUserData) {
              const userObj = {
                id: socialUserData.uid,
                uid: socialUserData.uid,
                email: socialUserData.email,
                name: socialUserData.name,
                picture: socialUserData.picture,
                provider: socialUserData.provider,
                role: 'user',
                isServerAuth: true
              };
              console.log(`🔄 ${provider} 사용자 상태 재설정:`, userObj);
              setUser(userObj);
            }
          } catch (err) {
            console.error('소셜 사용자 재설정 오류:', err);
          }
        }
        
        setIsLoading(false);
        return;
      }
      
      if (firebaseUser) {
        console.log('✅ Firebase 사용자 처리');
        await handleUser(firebaseUser);
      } else {
        console.log('❌ Firebase 로그아웃 처리');
        // 소셜 사용자가 없는 경우에만 setUser(null) 호출
        const naverAuthUserCheck = localStorage.getItem('naverAuthUser');
        const lineAuthUserCheck = localStorage.getItem('lineAuthUser');
        if (!naverAuthUserCheck && !lineAuthUserCheck) {
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    getRedirectResult(auth).then(async (result) => {
      if (result) {
        console.log('✅ 리디렉션 결과로 로그인:', result.user?.email);
        await handleUser(result.user);
      }
    }).catch((err) => {
      console.error("🚨 리디렉션 결과 처리 오류:", err);
      setError(`인증 오류: ${err.message}`);
    });

    return () => unsubscribe();
  }, [naverAuthInitialized, user]); // user 의존성 추가

  const handleUser = async (firebaseUser) => {
    if (!firebaseUser) return;
    
    try {
      // Anonymous 로그인 후 네이버 사용자 정보가 있는지 확인
      const pendingNaverUser = localStorage.getItem('pendingNaverUser');
      
      if (firebaseUser.isAnonymous && pendingNaverUser) {
        console.log('🔗 Anonymous 사용자에 네이버 정보 연결');
        
        try {
          const naverUserData = JSON.parse(pendingNaverUser);
          
          // Firestore에 네이버 사용자 정보로 저장
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const haruUser = {
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: naverUserData.email,
            name: naverUserData.name,
            picture: naverUserData.picture,
            provider: naverUserData.provider,
            role: 'user',
            naverUserId: naverUserData.uid.replace('naver_', ''),
            isNaverUser: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          
          await setDoc(userDocRef, haruUser, { merge: true });
          setUser(haruUser);
          
          console.log('✅ 네이버 사용자 정보가 성공적으로 Firebase에 저장됨');
          
          // 처리 완료 후 임시 데이터 제거
          localStorage.removeItem('pendingNaverUser');
          return;
        } catch (err) {
          console.error('❌ 네이버 사용자 정보 연결 실패:', err);
          // 실패해도 기본 사용자로 진행
        }
      }
      
      // 기존 로직
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      let haruUser;
      if (userDoc.exists()) {
        haruUser = { id: userDoc.id, ...userDoc.data() };
        console.log('👤 기존 사용자 정보 로드:', haruUser.email);
      } else {
        console.log('✨ 새로운 사용자, Firestore에 정보 저장:', firebaseUser.email);
        haruUser = {
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || 'New User',
          picture: firebaseUser.photoURL,
          provider: firebaseUser.providerData[0]?.providerId || 'password',
          role: 'user',
          createdAt: serverTimestamp(),
        };
        await setDoc(userDocRef, haruUser);
      }
      
      setUser(haruUser);
    } catch (err) {
      console.error('🚨 사용자 정보 처리 오류:', err);
      setError(`사용자 정보 처리 중 오류가 발생했습니다: ${err.message}`);
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
        await signInWithRedirect(auth, googleProvider);
      } else {
        console.error('🚨 Google 로그인 오류:', err);
        setError(`Google 로그인 오류: ${err.message}`);
        setIsLoading(false);
      }
    }
  };

  const signInWithNaver = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 네이버 로그인 리디렉션 방식
      const naverClientId = import.meta.env.VITE_NAVER_CLIENT_ID;
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth/naver/callback`);
      const state = Math.random().toString(36).substring(2, 15);
      
      // 상태값과 원래 페이지 정보 저장
      sessionStorage.setItem('naverOAuthState', state);
      sessionStorage.setItem('preNaverLoginPath', window.location.pathname);
      
      const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${naverClientId}&redirect_uri=${redirectUri}&state=${state}`;
      
      // 현재 페이지에서 직접 리디렉션
      window.location.href = naverAuthUrl;
      
    } catch (err) {
      console.error('🚨 네이버 로그인 초기화 오류:', err);
      setError(`네이버 로그인 오류: ${err.message}`);
      setIsLoading(false);
    }
  };

  const signInWithLine = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 라인 로그인 리디렉션 방식
      const lineClientId = import.meta.env.VITE_LINE_CLIENT_ID;
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth/line/callback`);
      const state = Math.random().toString(36).substring(2, 15);
      
      // 상태값과 원래 페이지 정보 저장
      sessionStorage.setItem('lineOAuthState', state);
      sessionStorage.setItem('preLineLoginPath', window.location.pathname);
      
      const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${lineClientId}&redirect_uri=${redirectUri}&state=${state}&scope=profile%20openid`;
      
      // 현재 페이지에서 직접 리디렉션
      window.location.href = lineAuthUrl;
      
    } catch (err) {
      console.error('🚨 라인 로그인 초기화 오류:', err);
      setError(`라인 로그인 오류: ${err.message}`);
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      let errorMessage = '로그인 실패. 이메일 또는 비밀번호를 확인하세요.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
      }
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (email, password, _displayName) => {
    setIsLoading(true);
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged가 새 사용자 생성을 감지하고 handleUser를 호출할 것임
    } catch (err) {
      let errorMessage = '회원가입 중 오류가 발생했습니다.';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = '이미 사용 중인 이메일입니다.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = '비밀번호가 너무 약합니다. 6자 이상 입력하세요.';
      }
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      // 소셜 서버 인증 사용자 로그아웃
      if (user && user.isServerAuth) {
        console.log(`✅ ${user.provider} 서버 인증 사용자 로그아웃`);
        if (user.provider === 'naver') {
          localStorage.removeItem('naverAuthUser');
        } else if (user.provider === 'line') {
          localStorage.removeItem('lineAuthUser');
        }
      }
      
      // Firebase 로그아웃
      await firebaseSignOut(auth);
      setUser(null);
    } catch (err) {
      console.error("로그아웃 실패:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 관리자 기능 (필요 시 사용)
  const getAllUsers = async () => {
    const usersCol = collection(db, 'users');
    const userSnapshot = await getDocs(usersCol);
    return userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  const updateUserRole = async (userId, newRole) => {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, { role: newRole });
  };

  const deleteUser = async (userId) => {
    const userDocRef = doc(db, 'users', userId);
    await deleteDoc(userDocRef);
  };

  const value = {
    user,
    isLoading,
    error,
    signInWithGoogle,
    signInWithNaver,
    signInWithLine,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
    getAllUsers,
    updateUserRole,
    deleteUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
