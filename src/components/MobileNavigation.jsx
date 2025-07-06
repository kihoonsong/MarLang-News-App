import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  BottomNavigation, BottomNavigationAction, IconButton, Typography, Avatar,
  useMediaQuery, useTheme, AppBar, Toolbar, Tabs, Tab, Box, Menu, MenuItem,
  ListItemIcon, ListItemText
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import BookIcon from '@mui/icons-material/Book';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import SearchDropdown from './SearchDropdown';
import { designTokens, getColor, getShadow } from '../utils/designTokens';

const navigationTabs = ['Home', 'Date', 'Wordbook', 'Like', 'Profile'];

const MainNavigation = ({ showBackButton = false, title, showCategoryTabs = false, children, searchCompact = true }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isAdmin, signOut } = useAuth() || {};
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

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

  const getCurrentTabValue = () => {
    const path = location.pathname;
    if (path === '/') return 0;
    if (path === '/date') return 1;
    if (path === '/wordbook') return 2;
    if (path === '/like') return 3;
    if (path === '/profile') return 4;
    return 0;
  };

  const [navValue, setNavValue] = useState(getCurrentNavValue());
  const [tabValue, setTabValue] = useState(getCurrentTabValue());

  // 경로 변경 시 네비게이션 값 업데이트
  useEffect(() => {
    setNavValue(getCurrentNavValue());
    setTabValue(getCurrentTabValue());
  }, [location.pathname]);

  // 인증이 필요한 경로 체크
  const requiresAuth = (path) => {
    return ['/wordbook', '/like', '/profile', '/dashboard', '/settings'].includes(path);
  };

  const handleNavChange = (event, newValue) => {
    // 네비게이션 전 TTS 중지
    if (typeof window.globalStopTTS === 'function') {
      window.globalStopTTS();
    }
    
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

  const handleTabChange = (event, newValue) => {
    // 네비게이션 전 TTS 중지
    if (typeof window.globalStopTTS === 'function') {
      window.globalStopTTS();
    }
    
    const routes = ['/', '/date', '/wordbook', '/like', '/profile'];
    const targetRoute = routes[newValue];
    
    // 인증이 필요한 경우인데 로그인하지 않은 경우
    if (requiresAuth(targetRoute) && !isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    
    setTabValue(newValue);
    navigate(targetRoute);
  };

  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    signOut();
    handleUserMenuClose();
  };

  const handleAvatarClick = () => {
    // 네비게이션 전 TTS 중지
    if (typeof window.globalStopTTS === 'function') {
      window.globalStopTTS();
    }
    
    if (!isAuthenticated) {
      setAuthModalOpen(true);
    } else {
      navigate('/profile');
    }
  };

  // 뒤로가기 버튼 핸들러
  const handleBackClick = () => {
    // 뒤로가기 전 TTS 중지
    if (typeof window.globalStopTTS === 'function') {
      window.globalStopTTS();
    }
    navigate(-1);
  };

  // 로고 클릭 핸들러
  const handleLogoClick = () => {
    // 홈으로 이동 전 TTS 중지
    if (typeof window.globalStopTTS === 'function') {
      window.globalStopTTS();
  }
    navigate('/');
  };

  return (
    <>
      {/* 모바일 네비게이션 */}
      {isMobile && (
    <>
      {/* 모바일 상단 헤더 */}
      <MobileHeader>
            {showBackButton && (
              <IconButton 
                color="inherit" 
                onClick={handleBackClick}
                sx={{ mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, flexShrink: 0 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 'bold', 
              color: '#23408e', 
              cursor: 'pointer',
              '&:hover': {
                color: '#1976d2'
              }
            }}
            onClick={handleLogoClick}
          >
            {title || 'MarLang'}
          </Typography>
          <Box
            sx={{
              ml: 1,
              backgroundColor: '#dc3545',
              borderRadius: '12px',
              padding: '2px 6px',
              fontSize: '0.5rem',
              fontWeight: 'bold',
              color: 'white',
              textTransform: 'uppercase',
              lineHeight: 1.2
            }}
          >
            beta
          </Box>
        </Box>
        
        <SearchDropdown 
          placeholder="Search articles..."
          compact={searchCompact}
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
                  padding: '6px 8px 8px',
              '&.Mui-selected': {
                color: '#1976d2',
              }
            }
          }}
        >
              <BottomNavigationAction label="Home" icon={<HomeIcon />} />
              <BottomNavigationAction label="Date" icon={<CalendarTodayIcon />} />
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
        </>
      )}

      {/* 데스크톱 네비게이션 */}
      {!isMobile && (
        <>
          {/* 상단바 */}
          <AppBar position="static" color="default" elevation={1}>
            <Toolbar>
              {showBackButton && (
                <IconButton color="inherit" onClick={handleBackClick} sx={{ mr: 1 }}>
                  <ArrowBackIcon />
                </IconButton>
              )}
              
              <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: '#23408e',
                    cursor: 'pointer',
                    '&:hover': { color: '#1976d2' }
                  }}
                  onClick={handleLogoClick}
                >
                  {title || 'MarLang Eng News'}
                </Typography>
                <Box
                  sx={{
                    ml: 1,
                    backgroundColor: '#dc3545',
                    borderRadius: '12px',
                    padding: '2px 8px',
                    fontSize: '0.625rem',
                    fontWeight: 'bold',
                    color: 'white',
                    textTransform: 'uppercase',
                    lineHeight: 1.2
                  }}
                >
                  beta
                </Box>
              </Box>
              
              <SearchDropdown placeholder="Search articles..." />
              
              {isAuthenticated ? (
                <IconButton size="large" onClick={handleUserMenuOpen} color="inherit">
                  <Avatar src={user?.picture} sx={{ width: 32, height: 32 }}>
                    {!user?.picture && <AccountCircleIcon />}
                  </Avatar>
                </IconButton>
              ) : (
                <IconButton
                  size="large"
                  onClick={() => setAuthModalOpen(true)}
                  color="inherit"
                  sx={{ 
                    border: '1px solid #1976d2', 
                    borderRadius: 2,
                    padding: '6px 12px',
                    fontSize: '0.875rem'
                  }}
                >
                  <AccountCircleIcon sx={{ mr: 0.5 }} />
                  Login
                </IconButton>
              )}
              
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleUserMenuClose}
                onClick={handleUserMenuClose}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                    mt: 1.5,
                    '&:before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 0,
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={() => {
                  if (typeof window.globalStopTTS === 'function') {
                    window.globalStopTTS();
                  }
                  navigate('/profile');
                }}>
                  <ListItemIcon>
                    <Avatar src={user?.picture} sx={{ width: 24, height: 24 }}>
                      <AccountCircleIcon fontSize="small" />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {user?.name || 'Guest User'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user?.email || 'guest@marlang.com'}
                    </Typography>
                  </ListItemText>
                </MenuItem>
                
                {isAdmin && (
                  <MenuItem onClick={() => {
                    if (typeof window.globalStopTTS === 'function') {
                      window.globalStopTTS();
                    }
                    setAnchorEl(null);
                    navigate('/dashboard');
                  }}>
                    <ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Dashboard</ListItemText>
                  </MenuItem>
                )}
                
                <MenuItem onClick={() => {
                  if (typeof window.globalStopTTS === 'function') {
                    window.globalStopTTS();
                  }
                  setAnchorEl(null);
                  navigate('/settings');
                }}>
                  <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>Settings</ListItemText>
                </MenuItem>
                
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>Logout</ListItemText>
                </MenuItem>
              </Menu>
            </Toolbar>
          </AppBar>
          
          {/* 네비게이션 탭 */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              {navigationTabs.map((nav, idx) => (
                <Tab 
                  key={nav} 
                  label={nav}
                  sx={(!isAuthenticated && requiresAuth(`/${nav.toLowerCase()}`)) ? { opacity: 0.6 } : {}}
                />
              ))}
            </Tabs>
          </Box>
          
          {/* 카테고리 탭 영역 (선택적) */}
          {showCategoryTabs && children}
        </>
      )}

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
  background: ${getColor('background.paper')};
  color: ${getColor('text.primary')};
  display: flex;
  align-items: center;
  padding: 0 ${designTokens.spacing.sm};
  box-shadow: ${getShadow('bottom')};
  z-index: ${designTokens.zIndex.appBar};
  
  @media (min-width: ${designTokens.breakpoints.tablet}) {
    display: none;
  }
`;

const MobileBottomNav = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: ${designTokens.zIndex.appBar};
  box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
  background: ${getColor('background.paper')};
  
  @media (min-width: ${designTokens.breakpoints.tablet}) {
    display: none;
  }
`;

// 모바일 컨텐츠 래퍼 (상단/하단 네비게이션 공간 확보)
export const MobileContentWrapper = styled.div`
  @media (max-width: calc(${designTokens.breakpoints.tablet} - 1px)) {
    padding-top: 64px;
    padding-bottom: 80px;
    min-height: 100vh;
  }
  
  @media (min-width: ${designTokens.breakpoints.tablet}) {
    min-height: 100vh;
  }
`;

export default MainNavigation; 