import React from 'react';
import styled from 'styled-components';
import { Tabs, Tab, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const navigationTabs = [
  { label: 'Home', path: '/' },
  { label: 'Date', path: '/date' },
  { label: 'Wordbook', path: '/wordbook' },
  { label: 'Like', path: '/like' },
  { label: 'Profile', path: '/profile' }
];

const DesktopTabs = ({ tabValue, onTabChange, isAuthenticated, onAuthModalOpen }) => {
  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    const tab = navigationTabs[newValue];
    
    // 인증이 필요한 탭 확인
    const requiresAuth = ['/wordbook', '/like', '/profile'].includes(tab.path);
    
    if (requiresAuth && !isAuthenticated) {
      onAuthModalOpen();
      return;
    }
    
    onTabChange(newValue);
    navigate(tab.path);
  };

  return (
    <TabsContainer>
      <StyledTabs
        value={tabValue}
        onChange={handleTabChange}
      >
        {navigationTabs.map((tab, index) => {
          const requiresAuth = ['/wordbook', '/like', '/profile'].includes(tab.path);
          const isDisabled = requiresAuth && !isAuthenticated;
          
          return (
            <StyledTab 
              key={index}
              label={tab.label}
              $disabled={isDisabled}
            />
          );
        })}
      </StyledTabs>
    </TabsContainer>
  );
};

const TabsContainer = styled(Box)`
  border-bottom: 1px solid #e0e0e0;
  padding: 0 16px;
`;

const StyledTabs = styled(Tabs)`
  min-height: 48px !important;
  height: 48px !important;
`;

const StyledTab = styled(Tab)`
  min-height: 48px !important;
  height: 48px !important;
  text-transform: none !important;
  font-weight: 500 !important;
  transition: all 0.2s ease !important;
  opacity: ${props => props.$disabled ? '0.6' : '1'};
`;

export default DesktopTabs;