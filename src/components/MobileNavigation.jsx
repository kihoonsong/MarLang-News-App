import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  BottomNavigation, BottomNavigationAction, Drawer, List, ListItem,
  ListItemIcon, ListItemText, IconButton, Box, Typography, Avatar,
  Divider, useMediaQuery, useTheme
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import BookIcon from '@mui/icons-material/Book';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MobileNavigation = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth() || {};
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 현재 경로에 따른 네비게이션 값 설정
  const getCurrentNavValue = () => {
    const path = location.pathname;
    if (path === '/') return 0;
    if (path === '/date') return 1;
    if (path === '/search') return 2;
    if (path === '/wordbook') return 3;
    if (path === '/like') return 4;
    return 0;
  };

  const [navValue, setNavValue] = useState(getCurrentNavValue());

  // 경로 변경 시 네비게이션 값 업데이트
  useEffect(() => {
    setNavValue(getCurrentNavValue());
  }, [location.pathname]);

  const handleNavChange = (event, newValue) => {
    setNavValue(newValue);
    
    const routes = ['/', '/date', '/search', '/wordbook', '/like'];
    navigate(routes[newValue]);
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleMenuItemClick = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleLogout = () => {
    signOut();
    setDrawerOpen(false);
  };

  // 모바일이 아닌 경우 렌더링하지 않음
  if (!isMobile) {
    return null;
  }

  return (
    <>
      {/* 모바일 상단 헤더 */}
      <MobileHeader>
        <IconButton
          color="inherit"
          onClick={toggleDrawer}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          MarLang Eng News
        </Typography>
        
        <Avatar 
          src={user?.picture} 
          alt={user?.name}
          sx={{ width: 32, height: 32 }}
          onClick={toggleDrawer}
        />
      </MobileHeader>

      {/* 사이드 드로어 메뉴 */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
        PaperProps={{
          sx: { width: 280 }
        }}
      >
        <DrawerContent>
          {/* 드로어 헤더 */}
          <DrawerHeader>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar 
                src={user?.picture} 
                alt={user?.name}
                sx={{ width: 48, height: 48 }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {user?.name || 'Guest User'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email || 'guest@marlang.com'}
                </Typography>
              </Box>
            </Box>
            
            <IconButton onClick={toggleDrawer}>
              <CloseIcon />
            </IconButton>
          </DrawerHeader>

          <Divider />

          {/* 메뉴 리스트 */}
          <List sx={{ flex: 1 }}>
            <ListItem button onClick={() => handleMenuItemClick('/')}>
              <ListItemIcon>
                <HomeIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Home" />
            </ListItem>

            <ListItem button onClick={() => handleMenuItemClick('/search')}>
              <ListItemIcon>
                <SearchIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Search" />
            </ListItem>

            <ListItem button onClick={() => handleMenuItemClick('/wordbook')}>
              <ListItemIcon>
                <BookIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Wordbook" />
            </ListItem>

            <ListItem button onClick={() => handleMenuItemClick('/like')}>
              <ListItemIcon>
                <FavoriteIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Favorites" />
            </ListItem>

            <ListItem button onClick={() => handleMenuItemClick('/date')}>
              <ListItemIcon>
                <CalendarTodayIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Calendar" />
            </ListItem>

            <ListItem button onClick={() => handleMenuItemClick('/profile')}>
              <ListItemIcon>
                <PersonIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Profile" />
            </ListItem>

            {/* 대시보드 메뉴 (모든 로그인 사용자) */}
            <ListItem button onClick={() => handleMenuItemClick('/dashboard')}>
              <ListItemIcon>
                <DashboardIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
          </List>

          <Divider />

          {/* 하단 메뉴 */}
          <List>
            <ListItem button onClick={() => handleMenuItemClick('/profile')}>
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItem>

            <ListItem button onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </DrawerContent>
      </Drawer>

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
            label="Search" 
            icon={<SearchIcon />} 
          />
          <BottomNavigationAction 
            label="Words" 
            icon={<BookIcon />} 
          />
          <BottomNavigationAction 
            label="Likes" 
            icon={<FavoriteIcon />} 
          />
        </BottomNavigation>
      </MobileBottomNav>
    </>
  );
};

const MobileHeader = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: #1976d2;
  color: white;
  display: flex;
  align-items: center;
  padding: 0 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 1100;
  
  @media (min-width: 960px) {
    display: none;
  }
`;

const DrawerContent = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const DrawerHeader = styled.div`
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 80px;
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
`;

export default MobileNavigation; 