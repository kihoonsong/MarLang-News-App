import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog, DialogContent, Box, Typography, Button, Divider, IconButton, Alert, CircularProgress, Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GoogleIcon from '@mui/icons-material/Google';
import LanguageIcon from '@mui/icons-material/Language';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { detectUserLanguage } from '../utils/languageDetection';

import loginImage from '../assets/login-image.png';

// 네이버 아이콘 컴포넌트
const NaverIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.6 0H20V20H13.6L6.4 7.975V20H0V0H6.4L13.6 12.025V0Z" fill="#03C75A"/>
  </svg>
);

// 라인 아이콘 컴포넌트
const LineIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.8 8.5c0-4.4-4.4-8-9.8-8S-0.8 4.1-0.8 8.5c0 3.9 3.5 7.2 8.2 7.9.3.1.8.2 1 .5.1.2.1.6.1.8 0 0 .1.6.1.7.1.4.3.5.6.3.4-.2 2.1-1.2 2.9-1.7 1.5-1 2.7-2.2 3.7-3.8.7-1.1 1-2.3 1-3.7z" fill="#00B900"/>
    <path d="M15.1 10.9H13c-.1 0-.2-.1-.2-.2V7.4c0-.1.1-.2.2-.2h2.1c.1 0 .2.1.2.2v.6c0 .1-.1.2-.2.2h-1.3v.5h1.3c.1 0 .2.1.2.2v.6c0 .1-.1.2-.2.2h-1.3v.5h1.3c.1 0 .2.1.2.2v.5c0 .1-.1.2-.2.2z" fill="white"/>
    <path d="M11.8 10.9h-.6c-.1 0-.2-.1-.2-.2V8.4h-.9c-.1 0-.2-.1-.2-.2v-.6c0-.1.1-.2.2-.2h2.8c.1 0 .2.1.2.2v.6c0 .1-.1.2-.2.2h-.9v2.3c0 .1-.1.2-.2.2z" fill="white"/>
    <path d="M8.9 10.9h-.6c-.1 0-.2-.1-.2-.2V7.4c0-.1.1-.2.2-.2h.6c.1 0 .2.1.2.2v3.3c0 .1-.1.2-.2.2z" fill="white"/>
    <path d="M7.5 10.9H5.4c-.1 0-.2-.1-.2-.2V7.4c0-.1.1-.2.2-.2h.6c.1 0 .2.1.2.2v2.7h1.3c.1 0 .2.1.2.2v.6c0 .1-.1.2-.2.2z" fill="white"/>
  </svg>
);

// 다국어 번역 데이터
const translations = {
  ko: {
    title: '로그인',
    googleLogin: 'Google 계정으로 시작하기',
    naverLogin: '네이버 계정으로 시작하기',
    lineLogin: 'LINE 계정으로 시작하기',
    or: '또는',
    guestNotice: '로그인 없이 둘러볼 수 있지만, 단어장 등 개인화 기능은 제한됩니다.',
    loginImage: 'NEWStep 로그인'
  },
  en: {
    title: 'Sign In',
    googleLogin: 'Continue with Google',
    naverLogin: 'Continue with Naver',
    lineLogin: 'Continue with LINE',
    or: 'or',
    guestNotice: 'You can browse without signing in, but personalized features like vocabulary will be limited.',
    loginImage: 'NEWStep Login'
  }
};

const AuthModal = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('ko');
  const { signInWithGoogle, signInWithNaver, signInWithLine, isAuthenticated } = useAuth();

  // 브라우저 언어 감지
  useEffect(() => {
    const detectedLanguage = detectUserLanguage();
    setLanguage(detectedLanguage);
  }, []);

  // 현재 언어의 번역 텍스트
  const t = translations[language] || translations.ko;

  // 언어 변경 핸들러
  const toggleLanguage = () => {
    setLanguage(prevLang => prevLang === 'ko' ? 'en' : 'ko');
  };

  useEffect(() => {
    if (isAuthenticated && open) {
      setTimeout(onClose, 500);
    }
  }, [isAuthenticated, open, onClose]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    await signInWithGoogle();
  };

  const handleNaverLogin = async () => {
    setLoading(true);
    setError('');
    await signInWithNaver();
  };

  const handleLineLogin = async () => {
    setLoading(true);
    setError('');
    await signInWithLine();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ position: 'relative', p: 4 }}>
          <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
          
          {/* 언어 변경 버튼 */}
          <Box sx={{ position: 'absolute', left: 8, top: 8 }}>
            <Chip
              icon={<LanguageIcon />}
              label={language === 'ko' ? '한국어' : 'English'}
              onClick={toggleLanguage}
              variant="outlined"
              size="small"
              sx={{ 
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'primary.light',
                  color: 'white'
                }
              }}
            />
          </Box>
          
          {/* 제목 */}
          <Typography variant="h5" fontWeight="bold" textAlign="center" sx={{ mb: 2, mt: 2 }}>
            {t.title}
          </Typography>
          
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <img src={loginImage} alt={t.loginImage} style={{ maxWidth: '80%', height: 'auto' }} />
          </Box>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <SocialButton fullWidth variant="outlined" startIcon={<GoogleIcon />} onClick={handleGoogleLogin} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : t.googleLogin}
          </SocialButton>

          <Box sx={{ my: 2 }}>
            <Divider>
              <Typography variant="body2" color="text.secondary">
                {t.or}
              </Typography>
            </Divider>
          </Box>

          <NaverButton fullWidth variant="outlined" startIcon={<NaverIcon />} onClick={handleNaverLogin} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : t.naverLogin}
          </NaverButton>

          <Box sx={{ mt: 2 }}>
            <LineButton fullWidth variant="outlined" startIcon={<LineIcon />} onClick={handleLineLogin} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : t.lineLogin}
            </LineButton>
          </Box>

          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 3 }}>
            {t.guestNotice}
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

AuthModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

const SocialButton = styled(Button)`
  padding: 12px 24px !important;
  border: 1px solid #dadce0 !important;
  color: #3c4043 !important;
  font-weight: 500 !important;
  text-transform: none !important;
  border-radius: 8px !important;
`;

const NaverButton = styled(Button)`
  padding: 12px 24px !important;
  border: 1px solid #03C75A !important;
  color: #03C75A !important;
  font-weight: 500 !important;
  text-transform: none !important;
  border-radius: 8px !important;
  
  &:hover {
    background-color: #03C75A !important;
    color: white !important;
    border-color: #03C75A !important;
  }
`;

const LineButton = styled(Button)`
  padding: 12px 24px !important;
  border: 1px solid #00B900 !important;
  color: #00B900 !important;
  font-weight: 500 !important;
  text-transform: none !important;
  border-radius: 8px !important;
  
  &:hover {
    background-color: #00B900 !important;
    color: white !important;
    border-color: #00B900 !important;
  }
`;

export default AuthModal;