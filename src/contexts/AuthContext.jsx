import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithRedirect, signInWithPopup, getRedirectResult, signOut as firebaseSignOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider, db } from '../config/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔄 AuthContext 초기화 시작...');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔍 인증 상태 변경:', firebaseUser?.email || 'null');
      if (firebaseUser) {
        await handleUser(firebaseUser);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    getRedirectResult(auth).then(async (result) => {
      if (result) {
        console.log('✅ 리디렉션 결과 있음:', result.user?.email);
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
      console.log('👤 사용자 정보 처리 시작:', firebaseUser.email);
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      let userData;
      if (userDoc.exists()) {
        userData = userDoc.data();
      } else {
        // 새로운 사용자일 경우 Firestore에 문서 생성
        userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || 'New User',
          picture: firebaseUser.photoURL,
          provider: firebaseUser.providerData[0]?.providerId || 'password',
          role: 'user', // 기본 역할
          createdAt: serverTimestamp(),
        };
      }
      
      const marlangUser = {
        id: firebaseUser.uid,
        ...userData
      };
      
      await upsertUserInFirestore(marlangUser);
      
      console.log('✅ 사용자 정보 설정 완료:', marlangUser.email);
      setUser(marlangUser);
    } catch (err) {
      console.error('🚨 사용자 정보 처리 오류:', err);
      setError(`사용자 정보 처리 오류: ${err.message}`);
    }
  };

  const upsertUserInFirestore = async (userData) => {
    try {
      const userDocRef = doc(db, "users", userData.id);
      const dataToSave = {
        ...userData,
        lastLogin: serverTimestamp(),
      };
      await setDoc(userDocRef, dataToSave, { merge: true });
      console.log('✅ Firestore 저장 완료');
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
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('🚨 Google sign-in error:', err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
        await signInWithRedirect(auth, googleProvider);
      } else {
        setError(`Google 로그인 오류: ${err.message}`);
        setIsLoading(false);
      }
    }
  };

  const signInWithEmail = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🔥 Firebase 이메일 로그인 시도...');
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error('🚨 이메일 로그인 오류:', err);
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
      console.log('📝 Firebase 이메일 회원가입 시도...');
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      const userData = {
        id: result.user.uid,
        uid: result.user.uid,
        email: result.user.email,
        name: displayName || 'User',
        picture: null,
        provider: 'email',
        role: 'user',
        createdAt: serverTimestamp(),
      };
      
      await upsertUserInFirestore(userData);
      setUser(userData);
      
      console.log('✅ Firebase 이메일 회원가입 성공:', result.user.email);
    } catch (err) {
      console.error('🚨 이메일 회원가입 오류:', err);
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
      await firebaseSignOut(auth);
      setUser(null);
    } catch (err) {
      console.error("Firebase 로그아웃 실패:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getAllUsers = async () => {
    try {
      const usersCol = collection(db, 'users');
      const userSnapshot = await getDocs(usersCol);
      return userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error);
      return [];
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, { role: newRole });
      console.log('사용자 권한 변경 성공:', userId, newRole);
      return true;
    } catch (error) {
      console.error('사용자 권한 변경 실패:', error);
      return false;
    }
  };

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
