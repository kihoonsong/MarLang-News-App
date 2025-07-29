import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LineCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('처리 중...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleLineCallback = async () => {
      try {
        console.log('🔍 라인 콜백 처리 시작');
        
        // URL에서 파라미터 추출
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const errorParam = urlParams.get('error');
        
        console.log('📋 콜백 파라미터:', { code: !!code, state, error: errorParam });
        
        // 에러 체크
        if (errorParam) {
          throw new Error(`라인 로그인 오류: ${errorParam}`);
        }
        
        if (!code) {
          throw new Error('인증 코드가 없습니다.');
        }
        
        // 상태값 검증 (모바일 환경 고려)
        const savedState = sessionStorage.getItem('lineOAuthState');
        console.log('🔍 상태값 검증:', { savedState, receivedState: state });
        
        if (!savedState) {
          console.warn('⚠️ 저장된 상태값이 없음 - 모바일 환경에서 sessionStorage 손실 가능');
          // 모바일에서 sessionStorage가 손실될 수 있으므로 경고만 출력하고 계속 진행
        } else if (savedState !== state) {
          console.warn('⚠️ 상태값 불일치:', { saved: savedState, received: state });
          // 개발 환경에서만 엄격하게 검증, 프로덕션에서는 경고만
          if (import.meta.env.DEV) {
            throw new Error('상태값이 일치하지 않습니다. 보안상 로그인을 중단합니다.');
          }
        }
        
        setStatus('라인 서버에서 사용자 정보를 가져오는 중...');
        
        // Firebase Functions를 통해 라인 OAuth 처리
        const response = await fetch(`${import.meta.env.VITE_FIREBASE_FUNCTIONS_URL || 'https://us-central1-marlang-app.cloudfunctions.net'}/lineAuth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            redirectUri: `${window.location.origin}/auth/line/callback`
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`서버 오류: ${response.status} - ${errorData}`);
        }
        
        const data = await response.json();
        console.log('✅ 라인 인증 성공:', data);
        
        if (!data.success) {
          throw new Error(data.error || '라인 인증에 실패했습니다.');
        }
        
        // 사용자 정보를 localStorage에 저장 (서버 인증 방식)
        const lineUserData = {
          uid: `line_${data.user.userId}`,
          email: data.user.email || `${data.user.userId}@line.local`,
          name: data.user.displayName || 'Line User',
          picture: data.user.pictureUrl,
          provider: 'line',
          lineUserId: data.user.userId,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken
        };
        
        localStorage.setItem('lineAuthUser', JSON.stringify(lineUserData));
        
        setStatus('로그인 완료! 메인 페이지로 이동합니다...');
        
        // 세션 스토리지 정리
        sessionStorage.removeItem('lineOAuthState');
        const preLoginPath = sessionStorage.getItem('preLineLoginPath') || '/';
        sessionStorage.removeItem('preLineLoginPath');
        
        console.log('🔄 리디렉션 준비:', { preLoginPath });
        
        // 모바일 환경에서 더 빠른 리디렉션
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const redirectDelay = isMobile ? 800 : 1500;
        
        setTimeout(() => {
          console.log('🚀 페이지 리디렉션 실행:', preLoginPath);
          navigate(preLoginPath, { replace: true });
          
          // 모바일에서 추가 보장을 위해 window.location도 사용
          if (isMobile && preLoginPath === '/') {
            setTimeout(() => {
              window.location.href = '/';
            }, 500);
          }
        }, redirectDelay);
        
      } catch (err) {
        console.error('🚨 라인 콜백 처리 오류:', err);
        console.error('🚨 에러 상세:', {
          message: err.message,
          stack: err.stack,
          url: window.location.href,
          userAgent: navigator.userAgent
        });
        
        setError(`로그인 처리 중 오류가 발생했습니다: ${err.message}`);
        setStatus('로그인 실패');
        
        // 모바일에서 더 빠른 리디렉션
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const redirectDelay = isMobile ? 2000 : 3000;
        
        setTimeout(() => {
          console.log('🔄 에러 후 홈으로 리디렉션');
          navigate('/', { replace: true });
          
          // 모바일에서 추가 보장
          if (isMobile) {
            setTimeout(() => {
              window.location.href = '/';
            }, 500);
          }
        }, redirectDelay);
      }
    };

    handleLineCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            라인 로그인
          </h2>
          
          <p className="text-gray-600 mb-4">
            {status}
          </p>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
              <p className="text-red-500 text-xs mt-1">
                잠시 후 홈페이지로 이동합니다...
              </p>
            </div>
          )}
          
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LineCallback;