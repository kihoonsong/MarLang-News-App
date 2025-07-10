import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog, DialogContent, Box, Typography, Button, Divider, IconButton, Alert, CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GoogleIcon from '@mui/icons-material/Google';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

import loginImage from '../assets/login-image.png';

// 네이버 아이콘 컴포넌트
const NaverIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.6 0H20V20H13.6L6.4 7.975V20H0V0H6.4L13.6 12.025V0Z" fill="#03C75A"/>
  </svg>
);

const AuthModal = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signInWithGoogle, signInWithNaver, isAuthenticated } = useAuth();

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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ position: 'relative', p: 4 }}>
          <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <img src={loginImage} alt="Marlang Login" style={{ maxWidth: '80%', height: 'auto' }} />
          </Box>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <SocialButton fullWidth variant="outlined" startIcon={<GoogleIcon />} onClick={handleGoogleLogin} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Google 계정으로 시작하기'}
          </SocialButton>

          <Box sx={{ my: 2 }}>
            <Divider>
              <Typography variant="body2" color="text.secondary">
                또는
              </Typography>
            </Divider>
          </Box>

          <NaverButton fullWidth variant="outlined" startIcon={<NaverIcon />} onClick={handleNaverLogin} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : '네이버 계정으로 시작하기'}
          </NaverButton>

          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 3 }}>
            로그인 없이 둘러볼 수 있지만, 단어장 등 개인화 기능은 제한됩니다.
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

export default AuthModal;