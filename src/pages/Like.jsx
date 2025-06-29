import React, { useState } from 'react';
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
  const [navTab, setNavTab] = useState(3);
  const [anchorEl, setAnchorEl] = useState(null);

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

  // 간단한 테스트 데이터
  const testArticles = [
    {
      id: 'test-1',
      title: 'AI Technology Breakthrough in Healthcare',
      category: 'Technology',
      summary: 'Revolutionary AI systems are transforming medical diagnosis and treatment procedures.',
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
      publishedAt: '2024-06-28T12:00:00Z'
    },
    {
      id: 'test-2',
      title: 'Climate Change Research Shows Promising Results',
      category: 'Science',
      summary: 'New environmental technologies offer hope for sustainable future solutions.',
      image: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=800&q=80',
      publishedAt: '2024-06-27T12:00:00Z'
    },
    {
      id: 'test-3',
      title: 'Global Economic Markets Show Recovery Signs',
      category: 'Business',
      summary: 'Market analysis reveals positive trends in global economic recovery.',
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
      publishedAt: '2024-06-26T12:00:00Z'
    }
  ];

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
          
          <CardsContainer>
            {testArticles.map(article => (
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
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  padding-bottom: 1rem;
`;

const CardWrapper = styled.div`
  flex: 0 0 320px;
  width: 320px;
`;

export default Like; 