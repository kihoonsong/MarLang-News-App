import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  AppBar, Toolbar, Typography, IconButton, Tabs, Tab, Box,
  Avatar, Menu, MenuItem, ListItemIcon, ListItemText, useMediaQuery, useTheme
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useArticles } from '../contexts/ArticlesContext';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import AuthModal from '../components/AuthModal';
import SearchDropdown from '../components/SearchDropdown';
import PageContainer from '../components/PageContainer';
import ArticleCard from '../components/ArticleCard';

const navigationTabs = ['Home', 'Date', 'Wordbook', 'Like', 'Profile', 'Dashboard'];

const Like = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, isAuthenticated, signOut, isModalOpen, setIsModalOpen } = useAuth() || {};
  const { likedArticles } = useData();
  const [navTab, setNavTab] = useState(3);
  const [anchorEl, setAnchorEl] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(0);

  // 좋아요 상태 변경 감지
  useEffect(() => {
    const handleLikeUpdate = (event) => {
      // 강제 리렌더링으로 최신 데이터 반영
      setForceUpdate(prev => prev + 1);
    };

    window.addEventListener('likeUpdated', handleLikeUpdate);
    return () => {
      window.removeEventListener('likeUpdated', handleLikeUpdate);
    };
  }, []);

  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    if (signOut) signOut();
    handleUserMenuClose();
  };

  const handleLoginClick = () => {
    if (setIsModalOpen) {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <MobileNavigation />
      <MobileContentWrapper>
        {/* 상단바 - 데스크톱만 표시 */}
        {!isMobile && (
          <AppBar position="static" color="default" elevation={1}>
            <Toolbar>
              <Typography 
                variant="h6" 
                sx={{ 
                  flexGrow: 1, 
                  fontWeight: 'bold', 
                  color: '#23408e',
                  cursor: 'pointer',
                  '&:hover': {
                    color: '#1976d2'
                  }
                }}
                onClick={() => navigate('/')}
              >
                MarLang Eng News
              </Typography>
              <SearchDropdown placeholder="Search articles..." />
              
              {isAuthenticated ? (
                <IconButton size="large" onClick={handleUserMenuOpen} color="inherit">
                  <Avatar src={user?.picture} alt={user?.name} sx={{ width: 32, height: 32 }}>
                    {!user?.picture && <AccountCircleIcon />}
                  </Avatar>
                </IconButton>
              ) : (
                <IconButton size="large" onClick={handleLoginClick} color="inherit" 
                  sx={{ border: '1px solid #1976d2', borderRadius: 2, padding: '6px 12px', fontSize: '0.875rem' }}>
                  <AccountCircleIcon sx={{ mr: 0.5 }} />
                  Login
                </IconButton>
              )}
              
              {isAuthenticated && (
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleUserMenuClose}>
                  <MenuItem onClick={() => navigate('/profile')}>
                    <ListItemIcon><AccountCircleIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{user?.name || 'Guest User'}</Typography>
                      <Typography variant="caption" color="text.secondary">{user?.email || 'guest@marlang.com'}</Typography>
                    </ListItemText>
                  </MenuItem>
                  <MenuItem onClick={() => navigate('/settings')}>
                    <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Settings</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Logout</ListItemText>
                  </MenuItem>
                </Menu>
              )}
            </Toolbar>
          </AppBar>
        )}
        
        {/* 네비게이션 탭 - 데스크톱만 */}
        {!isMobile && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
            <Tabs 
              value={navTab} 
              onChange={(_, v) => setNavTab(v)}
              sx={{
                '& .MuiTab-root': {
                  minWidth: 'auto',
                  padding: '12px 16px'
                }
              }}
            >
              {navigationTabs.map((nav, idx) => (
                <Tab 
                  key={nav} 
                  label={nav} 
                  onClick={() => {
                    setNavTab(idx);
                    switch(nav) {
                      case 'Home': navigate('/'); break;
                      case 'Date': navigate('/date'); break;
                      case 'Wordbook': navigate('/wordbook'); break;
                      case 'Like': break;
                      case 'Profile': navigate('/profile'); break;
                      case 'Dashboard': navigate('/dashboard'); break;
                      default: break;
                    }
                  }}
                />
              ))}
            </Tabs>
          </Box>
        )}

        <PageContainer>
          <Title>❤️ Liked Articles</Title>
          
          {likedArticles.length === 0 ? (
            <EmptyState>
              <EmptyIcon>💙</EmptyIcon>
              <EmptyText>No liked articles yet.</EmptyText>
              <EmptySubtext>Start exploring articles and heart the ones you love!</EmptySubtext>
            </EmptyState>
          ) : (
            <CardsContainer>
              {likedArticles.map(article => (
                <CardWrapper key={article.id}>
                  <ArticleCard 
                    id={article.id}
                    title={article.title}
                    category={article.category}
                    summary={article.summary}
                    image={article.image}
                    publishedAt={article.publishedAt}
                  />
                </CardWrapper>
              ))}
            </CardsContainer>
          )}
        </PageContainer>
      </MobileContentWrapper>
      
      {/* 인증 모달 */}
      {isModalOpen && (
        <AuthModal 
          open={isModalOpen} 
          onClose={() => setIsModalOpen && setIsModalOpen(false)} 
        />
      )}
    </>
  );
};

const Title = styled.h1`
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 2rem;
  color: #333;
`;

const CardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  padding-bottom: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  @media (min-width: 769px) and (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: 1025px) {
    grid-template-columns: repeat(3, 1fr);
  }
  
  @media (min-width: 1400px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const CardWrapper = styled.div`
  width: 100%;
  max-width: 400px;
  justify-self: center;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const EmptyText = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
`;

const EmptySubtext = styled.p`
  font-size: 1rem;
  color: #666;
  max-width: 400px;
`;

export default Like; 