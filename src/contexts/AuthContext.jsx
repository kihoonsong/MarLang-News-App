import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithRedirect, signInWithPopup, getRedirectResult, signOut as firebaseSignOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithCustomToken } from 'firebase/auth';
import { auth, googleProvider, db } from '../config/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 초기 로드 시 네이버 서버 인증 사용자 확인
  useEffect(() => {
    const checkNaverServerAuth = () => {
      const naverAuthUser = localStorage.getItem('naverAuthUser');
      
      if (naverAuthUser) {
        try {
          const naverUserData = JSON.parse(naverAuthUser);
          console.log('🔍 네이버 서버 인증 사용자 발견:', naverUserData.email);
          
          setUser({
            id: naverUserData.uid,
            uid: naverUserData.uid,
            email: naverUserData.email,
            name: naverUserData.name,
            picture: naverUserData.picture,
            provider: naverUserData.provider,
            role: 'user',
            isServerAuth: true
          });
          setIsLoading(false);
          return true;
        } catch (err) {
          console.error('네이버 서버 인증 사용자 처리 오류:', err);
          localStorage.removeItem('naverAuthUser');
        }
      }
      
      // 더 이상 사용하지 않는 게스트 관련 로컬 저장소 데이터 정리
      localStorage.removeItem('guestNaverUser');
      localStorage.removeItem('tempNaverUser');
      localStorage.removeItem('pendingNaverUser');
      
      return false;
    };

    // 네이버 서버 인증 사용자 체크
    const hasNaverUser = checkNaverServerAuth();
    
    // 네이버 사용자가 없을 때만 Firebase 인증 체크 시작
    if (!hasNaverUser) {
      setIsLoading(true);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // 네이버 서버 인증 사용자가 있으면 Firebase 인증 무시
      const naverAuthUser = localStorage.getItem('naverAuthUser');
      if (naverAuthUser) {
        console.log('🔍 네이버 서버 인증 사용자 있음, Firebase 인증 건너뜀');
        return;
      }
      
      console.log('🔍 인증 상태 변경:', firebaseUser?.email || '로그아웃 상태');
      
      if (firebaseUser) {
        await handleUser(firebaseUser);
      } else {
        setUser(null);
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
  }, []);

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
          const marlangUser = {
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
          
          await setDoc(userDocRef, marlangUser, { merge: true });
          setUser(marlangUser);
          
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
      
      let marlangUser;
      if (userDoc.exists()) {
        marlangUser = { id: userDoc.id, ...userDoc.data() };
        console.log('👤 기존 사용자 정보 로드:', marlangUser.email);
      } else {
        console.log('✨ 새로운 사용자, Firestore에 정보 저장:', firebaseUser.email);
        marlangUser = {
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || 'New User',
          picture: firebaseUser.photoURL,
          provider: firebaseUser.providerData[0]?.providerId || 'password',
          role: 'user',
          createdAt: serverTimestamp(),
        };
        await setDoc(userDocRef, marlangUser);
      }
      
      setUser(marlangUser);
    } catch (err) {
      console.error('🚨 사용자 정보 처��� 오류:', err);
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

  const signUpWithEmail = async (email, password, displayName) => {
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
      // 네이버 서버 인증 사용자 로그아웃
      const naverAuthUser = localStorage.getItem('naverAuthUser');
      if (naverAuthUser) {
        localStorage.removeItem('naverAuthUser');
        console.log('✅ 네이버 서버 인증 사용자 로그아웃');
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
