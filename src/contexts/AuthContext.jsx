import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithRedirect, signInWithPopup, getRedirectResult, signOut as firebaseSignOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider, db } from '../config/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  USER: 'user'
};

const adminAccounts = [
  {
    id: 'admin_001',
    email: 'admin@marlang.com',
    password: 'admin123',
    name: 'MarLang Super Admin',
    role: ROLES.SUPER_ADMIN,
  }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔄 AuthContext 초기화 시작...');
    console.log('🔥 Firebase Auth 인스턴스:', auth);
    console.log('🌐 현재 도메인:', window.location.origin);
    
    // 1. 리디렉션 결과 처리
    getRedirectResult(auth)
      .then(async (result) => {
        if (result) {
          console.log('✅ 리디렉션 결과 있음:', result.user?.email);
          console.log('🔑 인증 토큰:', result.credential);
          const firebaseUser = result.user;
          await handleUser(firebaseUser);
        } else {
          console.log('ℹ️ 리디렉션 결과 없음');
        }
      })
      .catch((err) => {
        console.error("🚨 리디렉션 결과 처리 오류:", err);
        console.error("🚨 에러 상세 정보:", {
          code: err.code,
          message: err.message,
          customData: err.customData,
          stack: err.stack
        });
        
        // 구체적인 에러 메시지 설정
        let errorMessage = '';
        switch(err.code) {
          case 'auth/operation-not-allowed':
            errorMessage = 'Google 로그인이 활성화되지 않았습니다. 관리자에게 문의하세요.';
            break;
          case 'auth/unauthorized-domain':
            errorMessage = '허용되지 않은 도메인입니다. 관리자에게 문의하세요.';
            break;
          case 'auth/popup-blocked':
            errorMessage = '팝업��� 차단되었습니다. 팝업을 허용하고 다시 시도하세요.';
            break;
          default:
            errorMessage = `인증 오류: ${err.message} (${err.code})`;
        }
        setError(errorMessage);
      })
      .finally(() => {
        // 2. 인증 상태 리스너 설정
        console.log('👂 인증 상태 리스너 설정...');
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          console.log('🔍 인증 상태 변경:', firebaseUser?.email || 'null');
          if (firebaseUser) {
            handleUser(firebaseUser);
          } else {
            const storedUser = JSON.parse(localStorage.getItem('marlang_user') || 'null');
            if (storedUser && storedUser.provider === 'admin') {
              console.log('📋 로컬 관리자 계정 복원:', storedUser.email);
              setUser(storedUser);
            } else {
              setUser(null);
              localStorage.removeItem('marlang_user');
            }
          }
          setIsLoading(false);
        });
        return unsubscribe;
      });
  }, []);

  const handleUser = async (firebaseUser) => {
    if (!firebaseUser) return;
    
    try {
      console.log('👤 사용자 정보 처리 시작:', firebaseUser.email);
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      const role = userDoc.exists() ? userDoc.data().role : 'user';

      const marlangUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        picture: firebaseUser.photoURL,
        provider: 'google',
        role: role,
      };
      
      console.log('💾 Firestore에 사용자 정보 저장...');
      await upsertUserInFirestore(marlangUser);
      
      console.log('✅ 사용자 정보 설정 완료:', marlangUser.email);
      setUser(marlangUser);
      localStorage.setItem('marlang_user', JSON.stringify(marlangUser));
    } catch (err) {
      console.error('🚨 사용자 정보 처리 오류:', err);
      setError(`사용자 정보 처리 오류: ${err.message}`);
    }
  };

  const upsertUserInFirestore = async (userData) => {
    try {
      const userDocRef = doc(db, "users", userData.id);
      const dataToSave = {
        uid: userData.id,
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        provider: userData.provider,
        role: userData.role || 'user',
        lastLogin: serverTimestamp(),
      };
      await setDoc(userDocRef, dataToSave, { merge: true });
      console.log('✅ Firestore 저장 완���');
    } catch (err) {
      console.error('🚨 Firestore 저장 오류:', err);
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🚀 Google 로그인 시작...');
      console.log('🔧 Google Provider 설정:', googleProvider);
      console.log('🌐 Auth 도메인:', auth.config.authDomain);
      
      // 팝업 방식으로 먼저 시도
      try {
        console.log('🪟 팝업 방식으로 시도 중...');
        const result = await signInWithPopup(auth, googleProvider);
        console.log('✅ 팝업 로그인 성공:', result.user.email);
        await handleUser(result.user);
      } catch (popupError) {
        console.log('❌ 팝업 실패, 리디렉션 방식으로 시도:', popupError.code);
        
        if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/popup-closed-by-user') {
          console.log('🔄 리디렉션 방식으로 전환...');
          await signInWithRedirect(auth, googleProvider);
        } else {
          throw popupError;
        }
      }
    } catch (err) {
      console.error('🚨 Google sign-in error:', err);
      console.error('🚨 Google 로그인 에러 상세:', {
        code: err.code,
        message: err.message,
        credential: err.credential,
        customData: err.customData
      });
      
      // 구체적인 에러 메시지 설정
      let errorMessage = '';
      switch(err.code) {
        case 'auth/operation-not-allowed':
          errorMessage = 'Google 로그인이 Firebase에서 활성화되지 않았습니다.';
          break;
        case 'auth/unauthorized-domain':
          errorMessage = '현재 도메인이 OAuth 설정에서 허용되지 않았습니다.';
          break;
        case 'auth/popup-blocked':
          errorMessage = '팝업이 차단되었습니다. 팝업을 허용하고 다시 시도하세요.';
          break;
        case 'auth/network-request-failed':
          errorMessage = '네트워크 오류입니다. 인터넷 연결을 확인하고 다시 시도하세요.';
          break;
        default:
          errorMessage = `Google 로그인 오류: ${err.message} (${err.code})`;
      }
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. 먼저 로컬 관리자 계정 확인
      const adminAccount = adminAccounts.find(a => a.email === email && a.password === password);
      if (adminAccount) {
        console.log('👤 로컬 관리자 로그인 성���');
        const adminUser = { ...adminAccount, provider: 'admin' };
        await upsertUserInFirestore(adminUser);
        setUser(adminUser);
        localStorage.setItem('marlang_user', JSON.stringify(adminUser));
        return;
      }

      // 2. Firebase 이메일/비밀번호 로그인 시도
      console.log('🔥 Firebase 이메일 로그인 시도...');
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase 이메일 로그인 성공:', result.user.email);
      await handleUser(result.user);
      
    } catch (err) {
      console.error('🚨 이메일 로그인 오류:', err);
      
      let errorMessage = '';
      switch(err.code) {
        case 'auth/user-not-found':
          errorMessage = '등록되지 않은 이메일입니다.';
          break;
        case 'auth/wrong-password':
          errorMessage = '비밀번호가 올바르지 않습니다.';
          break;
        case 'auth/invalid-email':
          errorMessage = '이메일 형식이 올바르지 않습니다.';
          break;
        case 'auth/too-many-requests':
          errorMessage = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도하세요.';
          break;
        default:
          errorMessage = err.message || "관리자 정보가 일��하지 않습니다.";
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Firebase 이메일 회원가입 함수 추가
  const signUpWithEmail = async (email, password, displayName) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('📝 Firebase 이메일 회원가입 시도...');
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // 사용자 프로필 업데이트
      const userData = {
        id: result.user.uid,
        email: result.user.email,
        name: displayName || 'User',
        picture: null,
        provider: 'email',
        role: 'user',
      };
      
      await upsertUserInFirestore(userData);
      setUser(userData);
      localStorage.setItem('marlang_user', JSON.stringify(userData));
      
      console.log('✅ Firebase 이메일 회원가입 성공:', result.user.email);
    } catch (err) {
      console.error('🚨 이메일 회원가입 오류:', err);
      
      let errorMessage = '';
      switch(err.code) {
        case 'auth/email-already-in-use':
          errorMessage = '이미 사용 중인 이메일입니다.';
          break;
        case 'auth/weak-password':
          errorMessage = '비밀번호가 너무 약합니다. 6자 이상 입력하세���.';
          break;
        case 'auth/invalid-email':
          errorMessage = '이메일 형식이 올바르지 않습니다.';
          break;
        default:
          errorMessage = err.message || "회원가입 중 오류가 발생했습니다.";
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    setUser(null);
    localStorage.removeItem('marlang_user');
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error("Firebase 로그아웃 실패:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 모든 사용자 조회
  const getAllUsers = async () => {
    try {
      const usersCol = collection(db, 'users');
      const userSnapshot = await getDocs(usersCol);
      const userList = userSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return userList;
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error);
      return [];
    }
  };

  // 사용자 정보 업데이트
  const updateUserRole = async (userId, newRole) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, { role: newRole });
      console.log('사용자 권��� 변경 성공:', userId, newRole);
      return true;
    } catch (error) {
      console.error('사용자 권한 변경 실패:', error);
      return false;
    }
  };

  // 사용자 삭제
  const deleteUser = async (userId) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      await deleteDoc(userDocRef);
      console.log('사용자 삭제 성공:', userId);
      return true;
    } catch (error) {
      console.error('사용자 삭제 실패:', error);
      return false;
    }
  };

  const value = {
    user,
    isLoading,
    error,
    signInWithGoogle,
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