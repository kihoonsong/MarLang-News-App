import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { signInWithCustomToken } from 'firebase/auth';
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

        // 상태값 검증
        const savedState = sessionStorage.getItem('naverOAuthState');
        if (state !== savedState) {
          throw new Error('보안 검증에 실패했습니다. 다시 시도해주세요.');
        }

        // Firebase Cloud Function에서 네이버 토큰 교환 및 사용자 정보 획득
        const response = await fetch('https://us-central1-marlang-app.cloudfunctions.net/naverAuth', {
          method: 'POST',
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

        if (!data.customToken) {
          console.log('🚨 토큰이 없습니다. tokenType:', data.tokenType);
          throw new Error('인증 토큰을 받지 못했습니다. 관리자에게 문의하세요.');
        }

        // Firebase 커스텀 토큰으로 로그인
        if (data.tokenType === 'custom') {
          console.log('✅ 커스텀 토큰으로 로그인');
          await signInWithCustomToken(auth, data.customToken);
        } else if (data.tokenType === 'temp') {
          // 임시 토큰의 경우 익명 로그인 후 Firestore에서 사용자 정보 연결
          console.log('✅ 임시 토큰 사용, 사용자 정보 저장');
          
          // 임시적으로 로컬 스토리지에 사용자 정보 저장
          localStorage.setItem('tempNaverUser', JSON.stringify(data.user));
          
          // 홈페이지로 리디렉션하여 AuthContext에서 처리하도록 함
          window.location.href = '/';
          return;
        } else {
          console.log('🚨 지원되지 않는 토큰 타입:', data.tokenType);
          throw new Error(`지원되지 않는 토큰 타입입니다: ${data.tokenType}`);
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
        
        // 3초 후 홈으로 이동
        setTimeout(() => {
          navigate('/');
        }, 3000);
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