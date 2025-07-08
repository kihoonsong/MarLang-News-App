import React, { useState } from 'react';
import styled from 'styled-components';
import { AppBar, Toolbar, IconButton, Typography, Avatar, useMediaQuery, useTheme } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import UserMenu from './UserMenu';
import SearchDropdown from '../SearchDropdown';

const NavigationHeader = ({ 
  showBackButton = false, 
  title, 
  user, 
  isAuthenticated, 
  isAdmin,
  onSignOut,
  onAuthModalOpen 
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState(null);

  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <StyledAppBar position="sticky">
      <StyledToolbar>
        <LeftSection>
          {showBackButton && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleBackClick}
              sx={{ mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <LogoSection onClick={() => navigate('/')}>
            <LogoText>
              {isMobile ? 'MarLang' : (title || 'MarLang Eng News')}
            </LogoText>
            <BetaLabel>beta</BetaLabel>
          </LogoSection>
        </LeftSection>

        <CenterSection>
          {/* 센터에는 별도 타이틀 표시하지 않음 */}
        </CenterSection>

        <RightSection>
          <SearchDropdown />
          
          {isAuthenticated ? (
            <UserAvatar
              onClick={handleUserMenuOpen}
              src={user?.photoURL || user?.picture}
              alt={user?.displayName || user?.name}
            >
              {!user?.photoURL && !user?.picture && 
                (user?.displayName || user?.name)?.charAt(0)}
            </UserAvatar>
          ) : (
            <LoginButton onClick={onAuthModalOpen}>
              Login
            </LoginButton>
          )}

          <UserMenu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleUserMenuClose}
            user={user}
            isAdmin={isAdmin}
            onSignOut={onSignOut}
          />
        </RightSection>
      </StyledToolbar>
    </StyledAppBar>
  );
};

const StyledAppBar = styled(AppBar)`
  background: white !important;
  color: #333 !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
`;

const StyledToolbar = styled(Toolbar)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem !important;
  min-height: 64px !important;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CenterSection = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  justify-content: flex-end;
  
  /* 스마트폰에서 검색창 영역 확대 */
  @media (max-width: 767px) {
    flex: 3;
    gap: 0.5rem;
  }
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 0.8;
  }
`;

const LogoText = styled(Typography)`
  font-weight: bold !important;
  font-size: 1.5rem !important;
  color: #23408e !important;
  cursor: pointer;
  
  &:hover {
    color: #1976d2 !important;
  }
`;

const BetaLabel = styled.span`
  background: #dc3545;
  color: white;
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 0.5rem;
  font-weight: bold;
  text-transform: uppercase;
  line-height: 1.2;
  margin-left: 0.4rem;
`;

const TitleText = styled(Typography)`
  font-weight: 600 !important;
  font-size: 1.1rem !important;
  color: #23408e !important;
`;

const UserAvatar = styled(Avatar)`
  cursor: pointer !important;
  transition: transform 0.2s ease !important;
  
  &:hover {
    transform: scale(1.1);
  }
`;

const LoginButton = styled.button`
  background: transparent;
  color: inherit;
  border: 1px solid #1976d2;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  &:hover {
    background: #1976d2;
    color: white;
  }
`;

export default NavigationHeader;