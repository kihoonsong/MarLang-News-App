import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog, DialogContent, Box, Typography, Button, Divider, IconButton, Alert, CircularProgress,
  TextField, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GoogleIcon from '@mui/icons-material/Google';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

const AuthModal = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showSignUp, setShowSignUp] = useState(false);
  const [signUpName, setSignUpName] = useState('');
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && open) {
      setTimeout(onClose, 500);
    }
  }, [isAuthenticated, open, onClose]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    // signInWithRedirect는 페이지를 이동시키므로, 별도의 에러 처리가 필요 없음
    await signInWithGoogle();
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (showSignUp) {
        await signUpWithEmail(adminEmail, adminPassword, signUpName);
      } else {
        await signInWithEmail(adminEmail, adminPassword);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ position: 'relative', p: 4 }}>
          <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>MarLang</Typography>
            <Typography variant="body1" color="text.secondary">Eng News</Typography>
          </Box>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <SocialButton fullWidth variant="outlined" startIcon={<GoogleIcon />} onClick={handleGoogleLogin} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Google 계정으로 시작하기'}
          </SocialButton>

          <Divider sx={{ my: 3 }}><Typography variant="caption" color="text.secondary">또는</Typography></Divider>

          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AdminPanelSettingsIcon />
                <Typography variant="body2">{showSignUp ? '회원가입' : '이메일 로그인'}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box component="form" onSubmit={handleAdminLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {showSignUp && (
                  <TextField
                    size="small"
                    label="이름"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="홍길동"
                    required
                  />
                )}
                <TextField
                  size="small"
                  label="이메일"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder={showSignUp ? "your@email.com" : "admin@marlang.com"}
                  required
                />
                <TextField
                  size="small"
                  label="비밀번호"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder={showSignUp ? "6자 이상" : "admin123"}
                  required
                />
                <Button 
                  type="submit" 
                  variant="contained" 
                  size="small"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={16} /> : <AdminPanelSettingsIcon />}
                >
                  {loading ? (showSignUp ? '가입 중...' : '로그인 중...') : (showSignUp ? '회원가입' : '로그인')}
                </Button>
                <Button 
                  type="button"
                  variant="text" 
                  size="small"
                  onClick={() => {
                    setShowSignUp(!showSignUp);
                    setError('');
                  }}
                >
                  {showSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
                </Button>
              </Box>
            </AccordionDetails>
          </Accordion>

          <Typography variant="body2" color="text.secondary" textAlign="center">
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

export default AuthModal;