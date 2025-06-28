import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.warn('useAuth used outside of AuthProvider, returning default values');
    return {
      user: null,
      isLoading: false,
      error: null,
      signInWithGoogle: () => {},
      signOut: () => {},
      signInAsGuest: () => {},
      updateUserProfile: () => {},
      isAuthenticated: false,
      isGuest: false
    };
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 초기화 - 로컬 스토리지에서 사용자 정보 로드
  useEffect(() => {
    console.log('🔄 AuthContext 초기화');
    
    try {
      const storedUser = localStorage.getItem('marlang_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        console.log('📋 저장된 사용자:', userData.name);
        setUser(userData);
      }
    } catch (error) {
      console.error('❌ 사용자 정보 로드 실패:', error);
      localStorage.removeItem('marlang_user');
    }
    
    // 로딩 상태 해제
    setIsLoading(false);
    console.log('✅ AuthContext 초기화 완료');
  }, []);

  // 간단한 Google 로그인 (시뮬레이션)
  const signInWithGoogle = () => {
    console.log('🚀 Google 로그인 (임시 모드)');
    
    setError(null);
    setIsLoading(true);
    
    // 1초 후 자동 로그인
    setTimeout(() => {
      const testUser = {
        id: 'test_' + Date.now(),
        email: 'test@gmail.com',
        name: '테스트 사용자',
        picture: 'https://images.unsplash.com/photo-1494790108755-2616b612b5e5?w=150',
        given_name: '테스트',
        family_name: '사용자',
        loginTime: new Date().toISOString(),
        provider: 'test'
      };
      
      setUser(testUser);
      localStorage.setItem('marlang_user', JSON.stringify(testUser));
      setIsLoading(false);
      
      console.log('✅ 로그인 완료:', testUser.name);
    }, 1000);
  };

  // 로그아웃
  const signOut = () => {
    console.log('🚪 로그아웃');
    setUser(null);
    localStorage.removeItem('marlang_user');
  };

  // 게스트 로그인
  const signInAsGuest = () => {
    console.log('👤 게스트 로그인');
    
    const guestUser = {
      id: 'guest_' + Date.now(),
      email: 'guest@marlang.com',
      name: 'Guest User',
      picture: 'https://via.placeholder.com/40',
      given_name: 'Guest',
      family_name: 'User',
      loginTime: new Date().toISOString(),
      isGuest: true
    };

    setUser(guestUser);
    localStorage.setItem('marlang_user', JSON.stringify(guestUser));
  };

  // 사용자 프로필 업데이트
  const updateUserProfile = (updates) => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('marlang_user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    isLoading,
    error,
    signInWithGoogle,
    signOut,
    signInAsGuest,
    updateUserProfile,
    isAuthenticated: !!user,
    isGuest: user?.isGuest || false
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};