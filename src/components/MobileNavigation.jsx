import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  BottomNavigation, BottomNavigationAction, IconButton, Typography, Avatar,
  useMediaQuery, useTheme
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import BookIcon from '@mui/icons-material/Book';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import SearchDropdown from './SearchDropdown';

const MobileNavigation = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, signOut } = useAuth() || {};
  const [authModalOpen, setAuthModalOpen] = useState(false);

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

  // 경로 변경 시 네비게이션 값 업데이트
  useEffect(() => {
    setNavValue(getCurrentNavValue());
  }, [location.pathname]);

  // 인증이 필요한 경로 체크
  const requiresAuth = (path) => {
    return ['/wordbook', '/like', '/profile', '/dashboard', '/settings'].includes(path);
  };

  const handleNavChange = (event, newValue) => {
    const routes = ['/', '/date', '/wordbook', '/like', '/profile'];
    const targetRoute = routes[newValue];
    
    // 인증이 필요한 경로인데 로그인하지 않은 경우
    if (requiresAuth(targetRoute) && !isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    
    setNavValue(newValue);
    navigate(targetRoute);
  };


  const handleAvatarClick = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
    } else {
      navigate('/profile');
    }
  };

  // 모바일이 아닌 경우 렌더링하지 않음
  if (!isMobile) {
    return null;
  }

  return (
    <>
      {/* 모바일 상단 헤더 */}
      <MobileHeader>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 'bold', 
            color: '#23408e', 
            mr: 2,
            cursor: 'pointer',
            '&:hover': {
              color: '#1976d2'
            }
          }}
          onClick={() => navigate('/')}
        >
          MarLang
        </Typography>
        
        <SearchDropdown 
          placeholder="Search articles..."
          compact={true}
          style={{ 
            flexGrow: 1,
            marginRight: '16px',
            maxWidth: 'none'
          }}
        />
        
        {isAuthenticated ? (
          <Avatar 
            src={user?.picture} 
            alt={user?.name}
            sx={{ width: 32, height: 32, cursor: 'pointer' }}
            onClick={handleAvatarClick}
          />
        ) : (
          <IconButton
            color="inherit"
            onClick={() => setAuthModalOpen(true)}
            sx={{ 
              border: '1px solid #1976d2', 
              borderRadius: 2,
              padding: '4px 8px',
              fontSize: '0.75rem'
            }}
          >
            <PersonIcon sx={{ fontSize: 20 }} />
          </IconButton>
        )}
      </MobileHeader>


      {/* 하단 네비게이션 */}
      <MobileBottomNav>
        <BottomNavigation
          value={navValue}
          onChange={handleNavChange}
          showLabels
          sx={{
            height: 80,
            '& .MuiBottomNavigationAction-root': {
              minWidth: 0,
              padding: '6px 12px 8px',
              '&.Mui-selected': {
                color: '#1976d2',
              }
            }
          }}
        >
          <BottomNavigationAction 
            label="Home" 
            icon={<HomeIcon />} 
          />
          <BottomNavigationAction 
            label="Date" 
            icon={<CalendarTodayIcon />} 
          />
          <BottomNavigationAction 
            label="Words" 
            icon={<BookIcon />} 
            sx={!isAuthenticated ? { opacity: 0.6 } : {}}
          />
          <BottomNavigationAction 
            label="Likes" 
            icon={<FavoriteIcon />} 
            sx={!isAuthenticated ? { opacity: 0.6 } : {}}
          />
          <BottomNavigationAction 
            label="Profile" 
            icon={<PersonIcon />} 
            sx={!isAuthenticated ? { opacity: 0.6 } : {}}
          />
        </BottomNavigation>
      </MobileBottomNav>

      {/* 인증 모달 */}
      <AuthModal 
        open={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />
    </>
  );
};

const MobileHeader = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: white;
  color: #333;
  display: flex;
  align-items: center;
  padding: 0 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  z-index: 1100;
  
  @media (min-width: 960px) {
    display: none;
  }
`;


const MobileBottomNav = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1100;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
  background: white;
  
  @media (min-width: 960px) {
    display: none;
  }
`;

// 모바일 컨텐츠 래퍼 (상단/하단 네비게이션 공간 확보)
export const MobileContentWrapper = styled.div`
  @media (max-width: 959px) {
    padding-top: 64px;
    padding-bottom: 80px;
    min-height: 100vh;
  }
  
  @media (min-width: 960px) {
    min-height: 100vh;
  }
`;

export default MobileNavigation; 