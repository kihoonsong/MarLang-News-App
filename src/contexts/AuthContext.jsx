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
      signInWithEmail: () => {},
      signUpWithEmail: () => {},
      signInWithNaver: () => {},
      resetPassword: () => {},
      changePassword: () => {},
      signOut: () => {},
      signInAsGuest: () => {},
      updateUserProfile: () => {},
      isAuthenticated: false,
      isGuest: false,
      isModalOpen: false,
      setIsModalOpen: () => {}
    };
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // 이메일 로그인
  const signInWithEmail = async (email, password, rememberMe = false) => {
    console.log('📧 이메일 로그인 시도:', email);
    setError(null);
    setIsLoading(true);
    
    try {
      // 실제 구현에서는 API 호출
      // 현재는 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 테스트용 계정 추가
      if (email === 'test@test.com' && password === 'test123') {
        const testUser = {
          id: 'test_user',
          name: '테스트 사용자',
          email: 'test@test.com',
          picture: 'https://ui-avatars.com/api/?name=Test&background=1976d2&color=fff',
          provider: 'email',
          createdAt: new Date().toISOString(),
          loginTime: new Date().toISOString(),
          rememberMe
        };
        
        setUser(testUser);
        localStorage.setItem('marlang_user', JSON.stringify(testUser));
        setIsModalOpen(false); // 로그인 성공 시 모달 닫기
        
        console.log('✅ 테스트 로그인 성공:', testUser.name);
        return;
      }
      
      // 저장된 사용자 정보 확인 (시뮬레이션)
      const storedUsers = JSON.parse(localStorage.getItem('marlang_users') || '[]');
      const foundUser = storedUsers.find(u => u.email === email);
      
      if (!foundUser) {
        throw new Error('등록되지 않은 이메일입니다. 테스트용: test@test.com / test123');
      }
      
      if (foundUser.password !== password) {
        throw new Error('비밀번호가 일치하지 않습니다.');
      }
      
      const loginUser = {
        ...foundUser,
        loginTime: new Date().toISOString(),
        rememberMe
      };
      
      setUser(loginUser);
      localStorage.setItem('marlang_user', JSON.stringify(loginUser));
      setIsModalOpen(false); // 로그인 성공 시 모달 닫기
      
      console.log('✅ 이메일 로그인 성공:', loginUser.name);
    } catch (error) {
      console.error('❌ 이메일 로그인 실패:', error.message);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 회원가입
  const signUpWithEmail = async (signupData) => {
    console.log('📝 회원가입 시도:', signupData.email);
    setError(null);
    setIsLoading(true);
    
    try {
      // 실제 구현에서는 API 호출
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 기존 사용자 확인
      const storedUsers = JSON.parse(localStorage.getItem('marlang_users') || '[]');
      const existingUser = storedUsers.find(u => u.email === signupData.email);
      
      if (existingUser) {
        throw new Error('이미 가입된 이메일입니다.');
      }
      
      // 비밀번호 유효성 검사
      if (signupData.password.length < 8) {
        throw new Error('비밀번호는 8자 이상이어야 합니다.');
      }
      
      // 새 사용자 생성
      const newUser = {
        id: 'user_' + Date.now(),
        name: signupData.name,
        email: signupData.email,
        password: signupData.password, // 실제로는 해시화 필요
        picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(signupData.name)}&background=1976d2&color=fff`,
        provider: 'email',
        createdAt: new Date().toISOString(),
        emailVerified: false
      };
      
      // 사용자 목록에 추가
      storedUsers.push(newUser);
      localStorage.setItem('marlang_users', JSON.stringify(storedUsers));
      
      console.log('✅ 회원가입 완료:', newUser.email);
    } catch (error) {
      console.error('❌ 회원가입 실패:', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 네이버 로그인
  const signInWithNaver = async () => {
    console.log('🟢 네이버 로그인 시도');
    setError(null);
    setIsLoading(true);
    
    try {
      // 실제 구현에서는 네이버 OAuth API 호출
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const naverUser = {
        id: 'naver_' + Date.now(),
        email: 'user@naver.com',
        name: '네이버 사용자',
        picture: 'https://ssl.pstatic.net/static/pwe/address/img_profile.png',
        provider: 'naver',
        loginTime: new Date().toISOString()
      };
      
      setUser(naverUser);
      localStorage.setItem('marlang_user', JSON.stringify(naverUser));
      setIsModalOpen(false); // 로그인 성공 시 모달 닫기
      
      console.log('✅ 네이버 로그인 성공:', naverUser.name);
    } catch (error) {
      console.error('❌ 네이버 로그인 실패:', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 비밀번호 재설정
  const resetPassword = async (email) => {
    console.log('🔄 비밀번호 재설정 요청:', email);
    setError(null);
    
    try {
      // 실제 구현에서는 API 호출
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const storedUsers = JSON.parse(localStorage.getItem('marlang_users') || '[]');
      const userIndex = storedUsers.findIndex(u => u.email === email);
      
      if (userIndex === -1) {
        throw new Error('등록되지 않은 이메일입니다.');
      }
      
      // 임시 비밀번호 생성 (8자리)
      const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
      
      // 사용자 비밀번호 업데이트
      storedUsers[userIndex].password = tempPassword;
      storedUsers[userIndex].tempPassword = true; // 임시 비밀번호 플래그
      localStorage.setItem('marlang_users', JSON.stringify(storedUsers));
      
      // 실제로는 이메일 발송, 여기서는 alert로 임시 비밀번호 표시
      setTimeout(() => {
        alert(`임시 비밀번호가 생성되었습니다: ${tempPassword}\n\n로그인 후 반드시 비밀번호를 변경해주세요.`);
      }, 500);
      
      console.log('📧 비밀번호 재설정 완료 - 임시 비밀번호:', tempPassword);
    } catch (error) {
      console.error('❌ 비밀번호 재설정 실패:', error.message);
      throw error;
    }
  };

  // 비밀번호 변경
  const changePassword = async (currentPassword, newPassword) => {
    console.log('🔒 비밀번호 변경 시도');
    setError(null);
    
    try {
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }
      
      // 실제 구현에서는 API 호출
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 현재 비밀번호 확인 (시뮬레이션)
      const storedUsers = JSON.parse(localStorage.getItem('marlang_users') || '[]');
      const userIndex = storedUsers.findIndex(u => u.id === user.id);
      
      if (userIndex === -1 || storedUsers[userIndex].password !== currentPassword) {
        throw new Error('현재 비밀번호가 일치하지 않습니다.');
      }
      
      // 비밀번호 업데이트
      storedUsers[userIndex].password = newPassword;
      localStorage.setItem('marlang_users', JSON.stringify(storedUsers));
      
      console.log('✅ 비밀번호 변경 완료');
    } catch (error) {
      console.error('❌ 비밀번호 변경 실패:', error.message);
      throw error;
    }
  };

  // 간단한 Google 로그인 (기존 유지)
  const signInWithGoogle = async () => {
    console.log('🚀 Google 로그인 (임시 모드)');
    
    setError(null);
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const testUser = {
        id: 'google_' + Date.now(),
        email: 'test@gmail.com',
        name: 'Google 사용자',
        picture: 'https://images.unsplash.com/photo-1494790108755-2616b612b5e5?w=150',
        given_name: 'Google',
        family_name: '사용자',
        loginTime: new Date().toISOString(),
        provider: 'google'
      };
      
      setUser(testUser);
      localStorage.setItem('marlang_user', JSON.stringify(testUser));
      setIsModalOpen(false); // 로그인 성공 시 모달 닫기
      
      console.log('✅ Google 로그인 완료:', testUser.name);
    } catch (error) {
      console.error('❌ Google 로그인 실패:', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 로그아웃
  const signOut = () => {
    console.log('🚪 로그아웃');
    setUser(null);
    localStorage.removeItem('marlang_user');
  };

  // 게스트 로그인 (제거됨 - 더 이상 사용하지 않음)
  const signInAsGuest = () => {
    console.log('👤 게스트 로그인 (deprecated)');
    // 게스트 로그인은 더 이상 지원하지 않음
  };

  // 사용자 프로필 업데이트
  const updateUserProfile = (updates) => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('marlang_user', JSON.stringify(updatedUser));
    
    // 사용자 목록도 업데이트
    const storedUsers = JSON.parse(localStorage.getItem('marlang_users') || '[]');
    const userIndex = storedUsers.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      storedUsers[userIndex] = { ...storedUsers[userIndex], ...updates };
      localStorage.setItem('marlang_users', JSON.stringify(storedUsers));
    }
  };

  const value = {
    user,
    isLoading,
    error,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInWithNaver,
    resetPassword,
    changePassword,
    signOut,
    signInAsGuest, // deprecated
    updateUserProfile,
    isAuthenticated: !!user,
    isGuest: user?.isGuest || false,
    isModalOpen,
    setIsModalOpen
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};