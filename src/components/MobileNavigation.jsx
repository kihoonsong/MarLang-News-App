import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useMediaQuery, useTheme } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Navigation 컴포넌트들
import NavigationHeader from './Navigation/NavigationHeader';
import DesktopTabs from './Navigation/DesktopTabs';
import MobileBottomNav from './Navigation/MobileBottomNav';
import AuthModal from './AuthModal';

const MobileNavigation = ({ 
  showBackButton = false, 
  title, 
  _showCategoryTabs = false, 
  children, 
  _searchCompact = true 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isAdmin, signOut } = useAuth() || {};
  
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // 네이버/구글 사용자 통일된 처리를 위한 정규화
  const normalizedUser = user ? {
    ...user,
    displayName: user.name || user.displayName,
    photoURL: user.picture || user.photoURL,
    provider: user.provider || (user.isServerAuth ? 'naver' : 'unknown'),
    isServerAuth: user.isServerAuth || false
  } : null;

  // 현재 경로에 따른 네비게이션 값 설정
  const getCurrentNavValue = () => {
    const path = location.pathname;
    if (path === '/') return 0;
    if (path === '/date') return 1;
    if (path === '/wordbook') return 2;
    if (path === '/like') return 3;
    if (path === '/profile') return 4;
    return 0;
  };

  const [navValue, setNavValue] = useState(getCurrentNavValue());
  const [tabValue, setTabValue] = useState(getCurrentNavValue());

  // 경로 변경 시 네비게이션 값 업데이트
  useEffect(() => {
    const newValue = getCurrentNavValue();
    setNavValue(newValue);
    setTabValue(newValue);
  }, [location.pathname]);

  // 인증 모달 핸들러
  const handleAuthModalOpen = () => {
    setAuthModalOpen(true);
  };

  const handleAuthModalClose = () => {
    setAuthModalOpen(false);
  };

  // 로그아웃 핸들러
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <>
      <NavigationHeader
        showBackButton={showBackButton}
        title={title}
        user={normalizedUser}
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
        onSignOut={handleSignOut}
        onAuthModalOpen={handleAuthModalOpen}
      />

      {!isMobile && (
        <DesktopTabs
          tabValue={tabValue}
          onTabChange={setTabValue}
          isAuthenticated={isAuthenticated}
          onAuthModalOpen={handleAuthModalOpen}
        />
      )}

      {isMobile && (
        <MobileBottomNav
          navValue={navValue}
          onNavChange={setNavValue}
          isAuthenticated={isAuthenticated}
          onAuthModalOpen={handleAuthModalOpen}
        />
      )}

      <AuthModal
        open={authModalOpen}
        onClose={handleAuthModalClose}
      />

      {children}
    </>
  );
};

// 모바일 콘텐츠 래퍼 (기존과 동일)
export const MobileContentWrapper = styled.div`
  padding-bottom: ${props => props.theme?.spacing ? props.theme.spacing(10) : '80px'};
  min-height: calc(100vh - 120px);
  
  @media (max-width: 767px) {
    padding-bottom: 100px; /* 네비게이션 높이 + 여백 */
    min-height: auto; /* 높이 제한 해제 */
  }
  
  @media (min-width: 768px) {
    padding-bottom: 0;
    min-height: calc(100vh - 120px);
  }
`;

export default MobileNavigation;