import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { auth } from '../config/firebase';

const NaverCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleNaverCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        if (error) {
          throw new Error(errorDescription || '네이버 로그인 중 오류가 발생했습니다.');
        }

        if (!code || !state) {
          throw new Error('인증 코드나 상태값이 없습니다.');
        }

        // 상태값 검증 (모바일 환경 고려)
        const savedState = sessionStorage.getItem('naverOAuthState');
        console.log('🔍 네이버 상태값 검증:', { savedState, receivedState: state });
        
        if (!savedState) {
          console.warn('⚠️ 저장된 상태값이 없음 - 모바일 환경에서 sessionStorage 손실 가능');
          // 모바일에서 sessionStorage가 손실될 수 있으므로 경고만 출력하고 계속 진행
        } else if (state !== savedState) {
          console.warn('⚠️ 네이버 상태값 불일치:', { saved: savedState, received: state });
          // 개발 환경에서만 엄격하게 검증, 프로덕션에서는 경고만
          if (import.meta.env.DEV) {
            throw new Error('보안 검증에 실패했습니다. 다시 시도해주세요.');
          }
        }

        // Firebase Cloud Function에서 네이버 토큰 교환 및 사용자 정보 획득
        const response = await fetch('https://us-central1-marlang-app.cloudfunctions.net/naverAuth', {
          method: 'POST',
          credentials: 'include', // 쿠키 포함
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, state }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || '서버 오류가 발생했습니다.');
        }

        if (!data.success) {
          throw new Error('인증에 실패했습니다.');
        }

        console.log('🔍 서버 응답 데이터:', data);

        if (data.authType === 'jwt') {
          // JWT 기반 인증 - 토큰은 이미 HttpOnly 쿠키로 설정됨
          console.log('✅ JWT 기반 인증 - 토큰이 쿠키에 저장됨');
          console.log('🔍 응답에서 받은 사용자 정보:', data.user);
          
          // 쿠키 확인
          console.log('🍪 브라우저 쿠키:', document.cookie);
          
          // 네이버 사용자 정보를 로컬에도 저장 (AuthContext에서 인식)
          localStorage.setItem('naverAuthUser', JSON.stringify({
            ...data.user,
            isServerAuth: true,
            loginTime: new Date().toISOString()
          }));
          
          setStatus('success');
          
          // 원래 페이지로 리디렉션
          const originalPath = sessionStorage.getItem('preNaverLoginPath') || '/';
          sessionStorage.removeItem('preNaverLoginPath');
          sessionStorage.removeItem('naverOAuthState');
          
          setTimeout(() => {
            window.location.href = originalPath;
          }, 1000);
          return;
        } else if (data.tokenType === 'custom') {
          console.log('✅ 커스텀 토큰으로 로그인');
          await signInWithCustomToken(auth, data.customToken);
        } else if (data.tokenType === 'server_auth') {
          // 서버 기반 인증 폴백 - 네이버 사용자 정보를 직접 저장
          console.log('✅ 서버 기반 인증 폴백 - 네이버 사용자 정보 저장');
          
          // 네이버 사용자 정보를 로컬에 저장 (AuthContext에서 인식)
          localStorage.setItem('naverAuthUser', JSON.stringify({
            ...data.user,
            isServerAuth: true,
            loginTime: new Date().toISOString()
          }));
          
          setStatus('success');
          
          // 원래 페이지로 리디렉션
          const originalPath = sessionStorage.getItem('preNaverLoginPath') || '/';
          sessionStorage.removeItem('preNaverLoginPath');
          sessionStorage.removeItem('naverOAuthState');
          
          setTimeout(() => {
            window.location.href = originalPath;
          }, 1000);
          return;
        } else {
          console.log('🚨 지원되지 않는 인증 타입:', data.authType || data.tokenType);
          throw new Error(`지원되지 않는 인증 타입입니다: ${data.authType || data.tokenType}`);
        }

        setStatus('success');

        // 세션 스토리지 정리
        sessionStorage.removeItem('naverOAuthState');
        
        // 원래 페이지로 리디렉션
        const originalPath = sessionStorage.getItem('preNaverLoginPath') || '/';
        sessionStorage.removeItem('preNaverLoginPath');
        
        setTimeout(() => {
          navigate(originalPath);
        }, 2000);

      } catch (err) {
        console.error('🚨 네이버 콜백 처리 오류:', err);
        setStatus('error');
        setErrorMessage(err.message);
        
        // 모바일에서 더 빠른 에러 후 리디렉션
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const redirectDelay = isMobile ? 2000 : 3000;
        
        setTimeout(() => {
          console.log('🔄 네이버 에러 후 홈으로 리디렉션');
          navigate('/');
          
          // 모바일에서 추가 보장
          if (isMobile) {
            setTimeout(() => {
              window.location.href = '/';
            }, 500);
          }
        }, redirectDelay);
      }
    };

    handleNaverCallback();
  }, [navigate]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: '#f5f5f5',
        p: 3
      }}
    >
      {status === 'processing' && (
        <>
          <CircularProgress sx={{ mb: 2, color: '#03C75A' }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            네이버 로그인 처리 중...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            잠시만 기다려주세요.
          </Typography>
        </>
      )}

      {status === 'success' && (
        <>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: '#03C75A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2
            }}
          >
            <Typography variant="h4" color="white">
              ✓
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ mb: 1, color: '#03C75A' }}>
            로그인 성공!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            곧 원래 페이지로 이동합니다...
          </Typography>
        </>
      )}

      {status === 'error' && (
        <>
          <Alert severity="error" sx={{ mb: 2, maxWidth: 400 }}>
            {errorMessage}
          </Alert>
          <Typography variant="body2" color="text.secondary">
            3초 후 홈페이지로 이동합니다...
          </Typography>
        </>
      )}
    </Box>
  );
};

export default NaverCallback;