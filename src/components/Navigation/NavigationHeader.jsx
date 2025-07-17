import React, { useState } from 'react';
import styled from 'styled-components';
import { AppBar, Toolbar, IconButton, Typography, Avatar, useMediaQuery, useTheme } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useNavigate } from 'react-router-dom';
import UserMenu from './UserMenu';
import SearchDropdown from '../SearchDropdown';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';
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
  // ThemeContext 안전하게 사용
  let isDarkMode = false;
  let toggleDarkMode = () => {};
  
  try {
    const themeContext = useCustomTheme();
    isDarkMode = themeContext?.isDarkMode || false;
    toggleDarkMode = themeContext?.toggleDarkMode || (() => {});
    
    // 디버깅을 위한 로그
    console.log('NavigationHeader - isDarkMode:', isDarkMode, 'toggleDarkMode:', toggleDarkMode);
  } catch (error) {
    console.error('ThemeContext 에러:', error);
  }
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
              <MobileLogoText>
                NEWStep
              </MobileLogoText>
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
          
          {/* 다크모드 토글 버튼 - 임시 비활성화 */}
          {/* <DarkModeToggle
            onClick={() => {
              console.log('다크 모드 버튼 클릭됨!');
              toggleDarkMode();
            }}
            aria-label="다크 모드 전환"
            title="다크 모드 전환"
          >
            {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </DarkModeToggle> */}
          
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
  background: ${props => props.theme.palette.background.paper} !important;
  color: ${props => props.theme.palette.text.primary} !important;
  box-shadow: ${props => props.theme.palette.mode === 'dark' 
    ? '0 1px 3px rgba(255, 255, 255, 0.1)' 
    : '0 1px 3px rgba(0, 0, 0, 0.1)'} !important;
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

const MobileLogoText = styled(Typography)`
  font-weight: bold !important;
  font-size: 1.2rem !important;
  color: ${props => props.theme.palette.mode === 'dark' ? '#90caf9' : '#23408e'} !important;
  cursor: pointer;
  transition: color 0.2s ease;
  
  &:hover {
    color: ${props => props.theme.palette.primary.main} !important;
  }
`;

const LogoText = styled(Typography)`
  font-weight: bold !important;
  font-size: 1.5rem !important;
  color: ${props => props.theme.palette.mode === 'dark' ? '#90caf9' : '#23408e'} !important;
  cursor: pointer;
  
  &:hover {
    color: ${props => props.theme.palette.primary.main} !important;
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
  
  /* 모바일에서 로고와 동일한 크기로 조정 */
  @media (max-width: 767px) {
    width: 32px !important;
    height: 32px !important;
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

const DarkModeToggle = styled(IconButton)`
  color: inherit !important;
  transition: all 0.2s ease !important;
  
  &:hover {
    background-color: rgba(25, 118, 210, 0.04) !important;
    transform: scale(1.1);
  }
  
  /* 모바일에서 크기 조정 */
  @media (max-width: 767px) {
    padding: 6px !important;
    
    & .MuiSvgIcon-root {
      font-size: 1.2rem;
    }
  }
`;

export default NavigationHeader;