import React, { useState } from 'react';
import styled from 'styled-components';
import {
  Paper, Typography, Button, TextField, Divider, Alert,
  Container, IconButton, InputAdornment
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const { signInWithGoogle, signInAsGuest } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 기본 유효성 검사
    if (!formData.name || !formData.email || !formData.password) {
      setError('모든 필드를 입력해주세요.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      setLoading(false);
      return;
    }

    try {
      // 임시로 로컬 스토리지에 사용자 정보 저장 (실제로는 서버 API 호출)
      const userData = {
        id: 'email_' + Date.now(),
        email: formData.email,
        name: formData.name,
        picture: '/placeholder-avatar.svg',
        given_name: formData.name.split(' ')[0],
        family_name: formData.name.split(' ').slice(1).join(' ') || '',
        loginTime: new Date().toISOString(),
        signupMethod: 'email'
      };

      localStorage.setItem('marlang_user', JSON.stringify(userData));
      
      // 홈으로 이동
      window.location.href = '/';
      
    } catch (error) {
      console.error('Signup error:', error);
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignupContainer>
      <Container maxWidth="sm">
        <SignupCard elevation={8}>
          {/* 헤더 */}
          <HeaderSection>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/login')}
              sx={{ alignSelf: 'flex-start', mb: 2, color: '#666' }}
            >
              로그인으로 돌아가기
            </Button>
            
            <LogoSection>
              <SchoolIcon sx={{ fontSize: 48, color: '#1976d2', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                NEWStep
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'normal', color: '#666' }}>
                Eng News
              </Typography>
            </LogoSection>
            
            <Typography variant="h6" sx={{ mt: 2, mb: 1, color: '#333' }}>
              계정을 만들어 시작하세요
            </Typography>
          </HeaderSection>

          {/* 에러 메시지 */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* 회원가입 폼 */}
          <SignupForm onSubmit={handleEmailSignup}>
            <TextField
              fullWidth
              label="이름"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
              required
            />

            <TextField
              fullWidth
              label="이메일"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
              required
            />

            <TextField
              fullWidth
              label="비밀번호"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
              required
            />

            <TextField
              fullWidth
              label="비밀번호 확인"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
              required
            />

            <SignupButton
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
            >
              {loading ? '회원가입 중...' : '회원가입'}
            </SignupButton>
          </SignupForm>

          {/* 구분선 */}
          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              또는
            </Typography>
          </Divider>

          {/* 소셜 로그인 */}
          <SocialSection>
            <GoogleButton
              variant="outlined"
              fullWidth
              startIcon={<GoogleIcon />}
              onClick={signInWithGoogle}
              size="large"
            >
              Google로 회원가입
            </GoogleButton>

            <GuestButton
              variant="outlined"
              fullWidth
              startIcon={<PersonIcon />}
              onClick={signInAsGuest}
              size="large"
              sx={{ mt: 2 }}
            >
              게스트로 시작하기
            </GuestButton>
          </SocialSection>

          {/* 로그인 링크 */}
          <Typography variant="body2" sx={{ mt: 3, textAlign: 'center', color: '#666' }}>
            이미 계정이 있으신가요?{' '}
            <Button 
              variant="text" 
              onClick={() => navigate('/login')}
              sx={{ color: '#1976d2', fontWeight: 'bold' }}
            >
              로그인
            </Button>
          </Typography>
        </SignupCard>
      </Container>
    </SignupContainer>
  );
};

const SignupContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  padding: 2rem 0;
`;

const SignupCard = styled(Paper)`
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

const SignupForm = styled.form`
  margin: 2rem 0;
`;

const SignupButton = styled(Button)`
  padding: 12px 24px !important;
  background: linear-gradient(45deg, #1976d2 30%, #42a5f5 90%) !important;
  font-weight: 600 !important;
  text-transform: none !important;
  border-radius: 8px !important;
  box-shadow: 0 3px 5px 2px rgba(25, 118, 210, .3) !important;
  
  &:hover {
    background: linear-gradient(45deg, #1565c0 30%, #1976d2 90%) !important;
  }

  &:disabled {
    background: #ccc !important;
    box-shadow: none !important;
  }
`;

const SocialSection = styled.div`
  margin: 1rem 0;
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
  border: 2px solid #FF8E53 !important;
  color: #FF8E53 !important;
  font-weight: 500 !important;
  text-transform: none !important;
  border-radius: 8px !important;
  
  &:hover {
    border-color: #FE6B8B !important;
    background-color: rgba(255, 105, 135, 0.04) !important;
  }
`;

export default Signup;