import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Container,
  Card,
  CardContent,
  CardActions,
  Divider,
  Alert
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';

const AuthGuard = ({ children, feature = 'this feature', requireAdmin = false, requiredPermission = null }) => {
  const { 
    isAuthenticated, 
    user, 
    isLoading, 
    setIsModalOpen, 
    hasPermission, 
    isAdmin,
    PERMISSIONS 
  } = useAuth();
  const navigate = useNavigate();
  const modalTriggeredRef = useRef(false);

  console.log('AuthGuard:', { 
    isAuthenticated, 
    user: user?.name, 
    role: user?.role,
    isLoading, 
    feature,
    requireAdmin,
    requiredPermission,
    isAdmin
  });

  // 비로그인 상태에서 모달 자동 표시 (관리자 권한이 필요하지 않은 경우만)
  useEffect(() => {
    if (!requireAdmin && !requiredPermission && !isLoading && !isAuthenticated && !modalTriggeredRef.current && setIsModalOpen) {
      const timer = setTimeout(() => {
        setIsModalOpen(true);
        modalTriggeredRef.current = true;
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, setIsModalOpen, requireAdmin, requiredPermission]);

  // 로딩 중일 때는 로딩 표시
  if (isLoading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h6">🔄 인증 확인 중...</Typography>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // 비로그인 상태 처리
  if (!isAuthenticated) {
    if (requireAdmin || requiredPermission) {
      // 관리자 권한이 필요한 페이지는 바로 접근 차단 메시지
      return (
        <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
          <Card elevation={3} sx={{ borderRadius: 3, border: '2px solid #f44336' }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <SecurityIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
              <Typography variant="h5" fontWeight="bold" color="error" gutterBottom>
                🔒 관리자 인증 필요
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                이 페이지는 관리자만 접근할 수 있습니다.
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  관리자 계정:
                </Typography>
                <Typography variant="body2">
                  • admin@marlang.com / admin123<br/>
                  • manager@marlang.com / Manager2024!@#
                </Typography>
              </Alert>
              
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<LoginIcon />}
                  onClick={() => setIsModalOpen && setIsModalOpen(true)}
                  size="large"
                >
                  관리자 로그인
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/')}
                  size="large"
                >
                  홈으로 돌아가기
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Container>
      );
    }
    
    // 일반 기능은 기존과 동일 (모달 자동 표시)
    return children;
  }

  // 로그인은 되어 있지만 권한 부족
  if (requireAdmin && !isAdmin) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
        <Card elevation={3} sx={{ borderRadius: 3, border: '2px solid #ff9800' }}>
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <LockIcon sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" color="warning.main" gutterBottom>
              ⚠️ 권한 부족
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              안녕하세요, <strong>{user?.name}</strong>님!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              이 페이지는 관리자 권한이 필요합니다.<br/>
              현재 권한: <strong>{user?.role || 'user'}</strong>
            </Typography>
            
            <Alert severity="warning" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2">
                관리자 권한이 필요한 경우 시스템 관리자에게 문의하세요.
              </Typography>
            </Alert>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={() => navigate('/')}
                size="large"
              >
                홈으로 돌아가기
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/profile')}
                size="large"
              >
                프로필 보기
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // 특정 권한 확인
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
        <Card elevation={3} sx={{ borderRadius: 3, border: '2px solid #ff9800' }}>
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <LockIcon sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" color="warning.main" gutterBottom>
              🚫 접근 권한 없음
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              안녕하세요, <strong>{user?.name}</strong>님!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              이 기능을 사용하기 위한 권한이 없습니다.<br/>
              필요 권한: <strong>{requiredPermission}</strong>
            </Typography>
            
            <Button
              variant="contained"
              onClick={() => navigate('/')}
              size="large"
            >
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // 모든 권한 확인 통과 - children 렌더링
  return children;
};

export default AuthGuard;