import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

const AuthGuard = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isLoading, isAdmin, user } = useAuth();
  const location = useLocation();

  console.log('🛡️ AuthGuard 체크:', {
    path: location.pathname,
    requireAdmin,
    isLoading,
    isAuthenticated,
    isAdmin,
    userRole: user?.role,
    userEmail: user?.email
  });

  if (isLoading) {
    console.log('⏳ 인증 로딩 중...');
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    console.log('❌ 미인증 사용자 - 홈으로 리디렉션');
    return <Navigate to="/" state={{ from: location, requestLogin: true }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    console.log('🚫 관리자 권한 없음 - 홈으로 리디렉션');
    console.log('👤 현재 사용자:', { role: user?.role, email: user?.email });
    return <Navigate to="/" state={{ from: location, adminRequired: true }} replace />;
  }

  console.log('✅ AuthGuard 통과 - 접근 허용');
  return children;
};

export default AuthGuard;
