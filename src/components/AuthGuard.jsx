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
  Divider
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LockIcon from '@mui/icons-material/Lock';

const AuthGuard = ({ children, feature = 'this feature' }) => {
  const { isAuthenticated, user, isLoading, setIsModalOpen } = useAuth();
  const navigate = useNavigate();
  const modalTriggeredRef = useRef(false);

  console.log('AuthGuard:', { isAuthenticated, user, isLoading, feature });

  // 비로그인 상태에서 모달 자동 표시
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !modalTriggeredRef.current && setIsModalOpen) {
      const timer = setTimeout(() => {
        setIsModalOpen(true);
        modalTriggeredRef.current = true;
      }, 300); // 0.3초 후에 모달 표시

      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, setIsModalOpen]);

  // 로딩 중일 때는 로딩 표시
  if (isLoading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h6">Loading...</Typography>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // 로그인된 상태이거나 비로그인 상태 모두 children을 렌더링
  // 비로그인 상태에서는 위의 useEffect에서 모달을 자동으로 표시
  return children;
};

export default AuthGuard;