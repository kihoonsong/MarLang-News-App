import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  Box, Paper, Typography, Button, Divider, CircularProgress, Alert,
  Container, Avatar
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Login = () => {
  const { user, isLoading, error, signInWithGoogle, signInAsGuest } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // 리디렉션 URL 확인 (로그인 후 이동할 페이지)
  const redirectPath = location.state?.from?.pathname || '/';

  // 이미 로그인된 경우 리디렉션
  useEffect(() => {
    if (user) {
      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate, redirectPath]);

  const handleGoogleSignIn = () => {
    console.log('=== Google 로그인 버튼 클릭 ===');
    signInWithGoogle();
  };

  const handleGuestSignIn = () => {
    signInAsGuest();
  };

  if (isLoading) {
    return (
      <LoadingContainer>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          로그인 중...
        </Typography>
      </LoadingContainer>
    );
  }

  return (
    <LoginContainer>
      <Container maxWidth="sm">
        <LoginCard elevation={8}>
          {/* 로고 및 헤더 */}
          <HeaderSection>
            <LogoSection>
              <SchoolIcon sx={{ fontSize: 48, color: '#1976d2', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                Haru
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'normal', color: '#666' }}>
                Eng News
              </Typography>
            </LogoSection>
            
            <Typography variant="h6" sx={{ mt: 2, mb: 1, color: '#333' }}>
              영어 뉴스와 함께 학습하세요
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', textAlign: 'center' }}>
              Pinterest 스타일의 뉴스 카드로 재미있게 영어를 배워보세요
            </Typography>
          </HeaderSection>

          {/* 에러 메시지 */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* 로그인 섹션 */}
          <LoginSection>
            <Typography variant="h6" sx={{ mb: 3, textAlign: 'center', fontWeight: 'bold' }}>
              로그인하여 시작하기
            </Typography>

            {/* Google 로그인 버튼 */}
            <GoogleLoginContainer>
              {/* 항상 대체 버튼 사용 (DOM 에러 방지) */}
              <GoogleButton
                variant="outlined"
                fullWidth
                startIcon={<GoogleIcon />}
                onClick={handleGoogleSignIn}
                size="large"
              >
                Google로 로그인
              </GoogleButton>
              {/* 숨겨진 Google 버튼 컨테이너 */}
              <div 
                id="google-signin-button" 
                style={{ 
                  width: '100%', 
                  display: 'none',
                  justifyContent: 'center' 
                }}
              />
            </GoogleLoginContainer>

            {/* 구분선 */}
            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                또는
              </Typography>
            </Divider>

            {/* 게스트 로그인 버튼 */}
            <GuestButton
              variant="contained"
              fullWidth
              startIcon={<PersonIcon />}
              onClick={handleGuestSignIn}
              size="large"
            >
              게스트로 시작하기
            </GuestButton>

            {/* 게스트 로그인 설명 */}
            <Typography variant="caption" sx={{ mt: 2, display: 'block', textAlign: 'center', color: '#666' }}>
              게스트 모드에서는 일부 기능이 제한될 수 있습니다
            </Typography>

            {/* 회원가입 링크 */}
            <Typography variant="body2" sx={{ mt: 3, textAlign: 'center', color: '#666' }}>
              계정이 없으신가요?{' '}
              <Button 
                variant="text" 
                onClick={() => navigate('/signup')}
                sx={{ color: '#1976d2', fontWeight: 'bold' }}
              >
                회원가입
              </Button>
            </Typography>
          </LoginSection>

          {/* 기능 미리보기 */}
          <FeatureSection>
            <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', fontWeight: 'bold' }}>
              주요 기능
            </Typography>
            
            <FeatureGrid>
              <FeatureItem>
                <Avatar sx={{ bgcolor: '#1976d2', mb: 1 }}>📰</Avatar>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  난이도별 뉴스
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Level 1~3 단계별 기사
                </Typography>
              </FeatureItem>

              <FeatureItem>
                <Avatar sx={{ bgcolor: '#2e7d32', mb: 1 }}>🔊</Avatar>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  TTS 읽기
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  음성으로 듣고 따라 읽기
                </Typography>
              </FeatureItem>

              <FeatureItem>
                <Avatar sx={{ bgcolor: '#ed6c02', mb: 1 }}>📚</Avatar>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  단어장
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  클릭으로 단어 저장
                </Typography>
              </FeatureItem>

              <FeatureItem>
                <Avatar sx={{ bgcolor: '#d32f2f', mb: 1 }}>❤️</Avatar>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  북마크
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  좋아하는 기사 저장
                </Typography>
              </FeatureItem>
            </FeatureGrid>
          </FeatureSection>
        </LoginCard>
      </Container>
    </LoginContainer>
  );
};

const LoginContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  padding: 2rem 0;
`;

const LoginCard = styled(Paper)`
  padding: 3rem;
  border-radius: 20px !important;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1) !important;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95) !important;
`;

const HeaderSection = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const LogoSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const LoginSection = styled.div`
  margin: 2rem 0;
`;

const GoogleLoginContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`;

const GoogleButton = styled(Button)`
  padding: 12px 24px !important;
  border: 2px solid #dadce0 !important;
  color: #3c4043 !important;
  font-weight: 500 !important;
  text-transform: none !important;
  border-radius: 8px !important;
  
  &:hover {
    border-color: #1976d2 !important;
    background-color: #f8f9fa !important;
  }
`;

const GuestButton = styled(Button)`
  padding: 12px 24px !important;
  background: linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%) !important;
  font-weight: 600 !important;
  text-transform: none !important;
  border-radius: 8px !important;
  box-shadow: 0 3px 5px 2px rgba(255, 105, 135, .3) !important;
  
  &:hover {
    background: linear-gradient(45deg, #FE6B8B 60%, #FF8E53 100%) !important;
  }
`;

const FeatureSection = styled.div`
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #e0e0e0;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
`;

const FeatureItem = styled.div`
  text-align: center;
  padding: 1rem;
  border-radius: 12px;
  background: #f8f9fa;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const LoadingContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
`;

export default Login; 