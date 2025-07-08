// JWT 토큰 자동 갱신 유틸리티

let refreshTimer = null;

// 토큰 갱신 함수
export const refreshToken = async () => {
  try {
    const response = await fetch('https://us-central1-marlang-app.cloudfunctions.net/refreshJWTToken', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ 토큰 자동 갱신 성공:', data.user.email);
      return data.user;
    } else {
      console.log('❌ 토큰 갱신 실패:', response.status);
      return null;
    }
  } catch (error) {
    console.error('토큰 갱신 중 오류:', error);
    return null;
  }
};

// 토큰 갱신 타이머 시작 (13분마다 갱신 - 15분 만료 전에)
export const startTokenRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }

  refreshTimer = setInterval(async () => {
    console.log('🔄 자동 토큰 갱신 시도...');
    const user = await refreshToken();
    
    if (!user) {
      console.log('토큰 갱신 실패, 타이머 중지');
      stopTokenRefresh();
      // 로그아웃 처리 (무한 새로고침 방지)
      localStorage.removeItem('naverAuthUser');
      sessionStorage.setItem('authError', 'token_refresh_failed');
      window.location.href = '/';
    }
  }, 13 * 60 * 1000); // 13분

  console.log('🔄 토큰 자동 갱신 타이머 시작');
};

// 토큰 갱신 타이머 중지
export const stopTokenRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
    console.log('🛑 토큰 자동 갱신 타이머 중지');
  }
};

// 토큰 검증 함수
export const verifyToken = async () => {
  try {
    const response = await fetch('https://us-central1-marlang-app.cloudfunctions.net/verifyJWTToken', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.user;
    } else {
      return null;
    }
  } catch (error) {
    console.error('토큰 검증 중 오류:', error);
    return null;
  }
};