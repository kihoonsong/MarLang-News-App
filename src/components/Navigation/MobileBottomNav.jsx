import React from 'react';
import styled from 'styled-components';
import { BottomNavigation, BottomNavigationAction } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BookIcon from '@mui/icons-material/Book';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate } from 'react-router-dom';

const navigationItems = [
  { label: 'Home', icon: <HomeIcon />, path: '/' },
  { label: 'Date', icon: <CalendarTodayIcon />, path: '/date' },
  { label: 'Wordbook', icon: <BookIcon />, path: '/wordbook' },
  { label: 'Like', icon: <FavoriteIcon />, path: '/like' },
  { label: 'Profile', icon: <PersonIcon />, path: '/profile' }
];

const MobileBottomNav = ({ navValue, onNavChange, isAuthenticated, onAuthModalOpen }) => {
  const navigate = useNavigate();

  const handleNavChange = (event, newValue) => {
    const item = navigationItems[newValue];
    
    // 인증이 필요한 페이지 확인
    const requiresAuth = ['/wordbook', '/like', '/profile'].includes(item.path);
    
    if (requiresAuth && !isAuthenticated) {
      onAuthModalOpen();
      return;
    }
    
    onNavChange(newValue);
    navigate(item.path);
  };

  return (
    <StyledBottomNavigation
      value={navValue}
      onChange={handleNavChange}
      showLabels
    >
      {navigationItems.map((item, index) => {
        const requiresAuth = ['/wordbook', '/like', '/profile'].includes(item.path);
        const isDisabled = requiresAuth && !isAuthenticated;
        
        return (
          <StyledBottomNavigationAction
            key={index}
            label={item.label}
            icon={item.icon}
            $disabled={isDisabled}
          />
        );
      })}
    </StyledBottomNavigation>
  );
};

const StyledBottomNavigation = styled(BottomNavigation)`
  position: fixed !important;
  bottom: 0 !important;
  width: 100% !important;
  z-index: 1000 !important;
  background: white !important;
  border-top: 1px solid #e0e0e0 !important;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1) !important;
  height: 80px !important;
  
  @media (min-width: 768px) {
    display: none !important;
  }
  
  .MuiBottomNavigationAction-root {
    min-width: 0;
    padding: 6px 8px 8px;
    
    &.Mui-selected {
      color: #1976d2 !important;
    }
  }
`;

const StyledBottomNavigationAction = styled(BottomNavigationAction)`
  opacity: ${props => props.$disabled ? '0.6' : '1'};
  
  &.Mui-selected {
    color: #1976d2 !important;
    
    .MuiBottomNavigationAction-label {
      font-weight: bold !important;
    }
  }
  
  .MuiBottomNavigationAction-label {
    font-size: 0.75rem !important;
    margin-top: 4px !important;
  }
`;

export default MobileBottomNav;