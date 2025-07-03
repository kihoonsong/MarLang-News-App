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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
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
          role: 'user', // 기본 역할
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
      await firebaseSignOut(auth);
      setUser(null);
    } catch (err) {
      console.error("Firebase 로그아웃 실패:", err);
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
