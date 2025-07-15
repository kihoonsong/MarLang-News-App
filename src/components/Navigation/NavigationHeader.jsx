import React, { useState } from 'react';
import styled from 'styled-components';
import { AppBar, Toolbar, IconButton, Typography, Avatar, useMediaQuery, useTheme } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import UserMenu from './UserMenu';
import SearchDropdown from '../SearchDropdown';
import logoImage from '../../assets/logo.png';

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
            {isMobile ? (
              <LogoImage 
                src={logoImage}
                alt="NEWStep"
                title="NEWStep"
              />
            ) : (
              <LogoText>
                {title || 'NEWStep Eng News'}
              </LogoText>
            )}
            <BetaLabel>beta</BetaLabel>
          </LogoSection>
        </LeftSection>

        <CenterSection>
          {/* 모바일에서는 검색창을 센터에 배치 */}
          {isMobile && <SearchDropdown />}
        </CenterSection>

        <RightSection>
          {/* 데스크톱에서만 검색창 표시 */}
          {!isMobile && <SearchDropdown />}
          
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
  min-height: 48px !important;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  /* 모바일에서 로고 영역 축소 */
  @media (max-width: 767px) {
    flex: 0 0 auto;
    min-width: fit-content;
  }
`;

const CenterSection = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  
  /* 모바일에서 센터 섹션을 검색창으로 활용 */
  @media (max-width: 767px) {
    flex: 1;
    max-width: 65%;
    margin: 0 1rem;
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  justify-content: flex-end;
  
  /* 스마트폰에서 우측 영역 최소화 */
  @media (max-width: 767px) {
    flex: 0 0 auto;
    min-width: fit-content;
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

const LogoImage = styled.img`
  height: 40px;
  cursor: pointer;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 0.8;
  }
  
  /* 모바일에서 로고 크기 조정 */
  @media (max-width: 767px) {
    height: 32px;
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
  
  /* 모바일에서 배타 숨김 */
  @media (max-width: 767px) {
    display: none;
  }
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
  border-radius: 25px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-height: 36px;
  box-sizing: border-box;
  
  &:hover {
    background: #1976d2;
    color: white;
  }
  
  /* 모바일에서 검색창과 동일한 높이 */
  @media (max-width: 767px) {
    border-radius: 25px;
    min-height: 36px;
  }
`;

export default NavigationHeader;