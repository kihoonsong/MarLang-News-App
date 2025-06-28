import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  IconButton,
  Tab,
  Tabs,
  Alert,
  Link,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GoogleIcon from '@mui/icons-material/Google';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

const AuthModal = ({ open, onClose }) => {
  const [tabValue, setTabValue] = useState(0); // 0: 로그인, 1: 회원가입, 2: 비밀번호 찾기
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 로그인 폼 상태
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  
  // 회원가입 폼 상태
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
    agreePrivacy: false
  });
  
  // 비밀번호 찾기 폼 상태
  const [resetForm, setResetForm] = useState({
    email: ''
  });

  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, signInWithNaver } = useAuth();

  const handleClose = () => {
    setTabValue(0);
    setError('');
    setSuccess('');
    setLoginForm({ email: '', password: '', rememberMe: false });
    setSignupForm({ name: '', email: '', password: '', confirmPassword: '', agreeTerms: false, agreePrivacy: false });
    setResetForm({ email: '' });
    onClose();
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError('');
    setSuccess('');
  };

  // 로그인 처리
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await signInWithEmail(loginForm.email, loginForm.password, loginForm.rememberMe);
      // handleClose()는 AuthContext에서 자동으로 처리됨
    } catch (error) {
      setError(error.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 회원가입 처리
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // 유효성 검사
    if (signupForm.password !== signupForm.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }
    
    if (!signupForm.agreeTerms || !signupForm.agreePrivacy) {
      setError('이용약관과 개인정보처리방침에 동의해주세요.');
      setLoading(false);
      return;
    }
    
    try {
      await signUpWithEmail(signupForm);
      setSuccess('회원가입이 완료되었습니다. 로그인해주세요.');
      setTimeout(() => setTabValue(0), 2000);
    } catch (error) {
      setError(error.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 비밀번호 찾기 처리
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await resetPassword(resetForm.email);
      setSuccess('비밀번호 재설정 이메일을 발송했습니다.');
    } catch (error) {
      setError(error.message || '비밀번호 재설정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Google 로그인
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      await signInWithGoogle();
      // handleClose()는 AuthContext에서 자동으로 처리됨
    } catch (error) {
      setError(error.message || 'Google 로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 네이버 로그인
  const handleNaverLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      await signInWithNaver();
      handleClose();
    } catch (error) {
      setError(error.message || '네이버 로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '500px'
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ position: 'relative' }}>
          {/* 닫기 버튼 */}
          <IconButton
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              zIndex: 1,
              bgcolor: 'rgba(0,0,0,0.04)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.08)' }
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* 헤더 */}
          <Box sx={{ textAlign: 'center', pt: 3, pb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>
              MarLang
            </Typography>
            <Typography variant="body2" color="text.secondary">
              영어 뉴스와 함께 학습하세요
            </Typography>
          </Box>

          {/* 탭 메뉴 */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mx: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  fontWeight: 'medium'
                }
              }}
            >
              <Tab label="로그인" />
              <Tab label="회원가입" />
              <Tab label="비밀번호 찾기" />
            </Tabs>
          </Box>

          {/* 에러/성공 메시지 */}
          {error && (
            <Alert severity="error" sx={{ mx: 3, mt: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mx: 3, mt: 2 }}>
              {success}
            </Alert>
          )}

          <Box sx={{ p: 3 }}>
            {/* 로그인 탭 */}
            {tabValue === 0 && (
              <Box component="form" onSubmit={handleLogin}>
                <TextField
                  fullWidth
                  label="이메일"
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    )
                  }}
                  sx={{ mb: 2 }}
                  required
                />
                
                <TextField
                  fullWidth
                  label="비밀번호"
                  type={showPassword ? 'text' : 'password'}
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{ mb: 2 }}
                  required
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={loginForm.rememberMe}
                        onChange={(e) => setLoginForm({...loginForm, rememberMe: e.target.checked})}
                      />
                    }
                    label="로그인 상태 유지"
                  />
                  <Link
                    component="button"
                    type="button"
                    onClick={() => setTabValue(2)}
                    sx={{ fontSize: '0.875rem' }}
                  >
                    비밀번호 찾기
                  </Link>
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ mb: 2, py: 1.5 }}
                >
                  {loading ? <CircularProgress size={24} /> : '로그인'}
                </Button>

                <Divider sx={{ my: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    또는
                  </Typography>
                </Divider>

                {/* 소셜 로그인 버튼들 */}
                <SocialButton
                  fullWidth
                  variant="outlined"
                  startIcon={<GoogleIcon />}
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  sx={{ mb: 1 }}
                >
                  Google로 로그인
                </SocialButton>

                <NaverButton
                  fullWidth
                  variant="outlined"
                  onClick={handleNaverLogin}
                  disabled={loading}
                >
                  <NaverIcon>N</NaverIcon>
                  네이버로 로그인
                </NaverButton>
              </Box>
            )}

            {/* 회원가입 탭 */}
            {tabValue === 1 && (
              <Box component="form" onSubmit={handleSignup}>
                <TextField
                  fullWidth
                  label="이름"
                  value={signupForm.name}
                  onChange={(e) => setSignupForm({...signupForm, name: e.target.value})}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    )
                  }}
                  sx={{ mb: 2 }}
                  required
                />

                <TextField
                  fullWidth
                  label="이메일"
                  type="email"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({...signupForm, email: e.target.value})}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    )
                  }}
                  sx={{ mb: 2 }}
                  required
                />

                <TextField
                  fullWidth
                  label="비밀번호"
                  type={showPassword ? 'text' : 'password'}
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({...signupForm, password: e.target.value})}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{ mb: 2 }}
                  helperText="8자 이상, 영문/숫자/특수문자 포함"
                  required
                />

                <TextField
                  fullWidth
                  label="비밀번호 확인"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={signupForm.confirmPassword}
                  onChange={(e) => setSignupForm({...signupForm, confirmPassword: e.target.value})}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                          {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{ mb: 2 }}
                  error={signupForm.confirmPassword && signupForm.password !== signupForm.confirmPassword}
                  helperText={signupForm.confirmPassword && signupForm.password !== signupForm.confirmPassword ? '비밀번호가 일치하지 않습니다' : ''}
                  required
                />

                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={signupForm.agreeTerms}
                        onChange={(e) => setSignupForm({...signupForm, agreeTerms: e.target.checked})}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        <Link href="#" onClick={(e) => e.preventDefault()}>이용약관</Link>에 동의합니다 (필수)
                      </Typography>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={signupForm.agreePrivacy}
                        onChange={(e) => setSignupForm({...signupForm, agreePrivacy: e.target.checked})}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        <Link href="#" onClick={(e) => e.preventDefault()}>개인정보처리방침</Link>에 동의합니다 (필수)
                      </Typography>
                    }
                  />
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ py: 1.5 }}
                >
                  {loading ? <CircularProgress size={24} /> : '회원가입'}
                </Button>
              </Box>
            )}

            {/* 비밀번호 찾기 탭 */}
            {tabValue === 2 && (
              <Box component="form" onSubmit={handleResetPassword}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
                </Typography>

                <TextField
                  fullWidth
                  label="이메일"
                  type="email"
                  value={resetForm.email}
                  onChange={(e) => setResetForm({...resetForm, email: e.target.value})}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    )
                  }}
                  sx={{ mb: 3 }}
                  required
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ mb: 2, py: 1.5 }}
                >
                  {loading ? <CircularProgress size={24} /> : '비밀번호 재설정 이메일 발송'}
                </Button>

                <Button
                  fullWidth
                  variant="text"
                  onClick={() => setTabValue(0)}
                >
                  로그인으로 돌아가기
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

const SocialButton = styled(Button)`
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

const NaverButton = styled(Button)`
  padding: 12px 24px !important;
  border: 2px solid #03c75a !important;
  color: #03c75a !important;
  font-weight: 500 !important;
  text-transform: none !important;
  border-radius: 8px !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  
  &:hover {
    background-color: #03c75a !important;
    color: white !important;
  }
`;

const NaverIcon = styled.div`
  width: 20px;
  height: 20px;
  background: #03c75a;
  color: white;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
`;

export default AuthModal; 