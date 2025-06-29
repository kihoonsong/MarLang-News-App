import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  AppBar, Toolbar, Typography, IconButton, InputBase, Tabs, Tab, Box, 
  Select, MenuItem, FormControl, InputLabel, Avatar, Menu, ListItemIcon, 
  ListItemText, useMediaQuery, useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import AuthGuard from '../components/AuthGuard';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import AuthModal from '../components/AuthModal';
import SearchDropdown from '../components/SearchDropdown';
import PageContainer from '../components/PageContainer';

const navigationTabs = ['Home', 'Date', 'Wordbook', 'Like', 'Profile', 'Dashboard'];

const Like = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, isAuthenticated, signOut, isModalOpen, setIsModalOpen } = useAuth() || {};
  const { likedArticles, toggleLike, sortLikedArticles } = useData();
  const [navTab, setNavTab] = useState(3);
  const [sortBy, setSortBy] = useState('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);

  // 샘플 데이터 (실제로는 useData에서 가져옴)
  const sampleLikedArticles = [
    {
      id: 1,
      title: 'AI Revolution in Healthcare',
      category: 'Technology',
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=400&q=80',
      likedAt: '2024-06-25T10:00:00Z'
    },
    {
      id: 2,
      title: 'Climate Change Research',
      category: 'Science',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
      likedAt: '2024-06-24T10:00:00Z'
    }
  ];



  const handleSort = (value) => {
    setSortBy(value);
    if (sortLikedArticles) sortLikedArticles(value);
  };

  const handleRemoveLike = (article) => {
    if (toggleLike) toggleLike(article);
  };

  const handleGoToArticle = (articleId) => {
    navigate(`/article/${articleId}`);
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

  const handleLoginClick = () => {
    if (setIsModalOpen) {
      setIsModalOpen(true);
    }
  };

  const displayArticles = likedArticles || sampleLikedArticles;

  // 비로그인 상태에서는 빈 화면 표시
  if (!isAuthenticated) {
    return (
      <AuthGuard feature="your liked articles">
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
              
              <IconButton size="large" onClick={handleLoginClick} color="inherit" 
                sx={{ border: '1px solid #1976d2', borderRadius: 2, padding: '6px 12px', fontSize: '0.875rem' }}>
                <AccountCircleIcon sx={{ mr: 0.5 }} />
                Login
              </IconButton>
            </Toolbar>
          </AppBar>
          )}
          
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

          {/* 빈 컨테이너 - 로그인 필요 메시지 */}
          <PageContainer>
            <EmptyAuthState>
              <EmptyIcon>❤️</EmptyIcon>
              <EmptyText>Please sign in to access your liked articles</EmptyText>
              <EmptySubtext>Like articles while reading and find them here!</EmptySubtext>
            </EmptyAuthState>
          </PageContainer>

          {/* 인증 모달 */}
          <AuthModal 
            open={isModalOpen || false} 
            onClose={() => setIsModalOpen && setIsModalOpen(false)} 
          />
        </MobileContentWrapper>
      </AuthGuard>
    );
  }

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
          <Header>
            <Title>❤️ Liked Articles</Title>
            <SortContainer>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort by"
                  onChange={(e) => handleSort(e.target.value)}
                >
                  <MenuItem value="title">Title</MenuItem>
                  <MenuItem value="date">Date Liked</MenuItem>
                  <MenuItem value="category">Category</MenuItem>
                </Select>
              </FormControl>
            </SortContainer>
          </Header>

          <ArticleGrid>
            {displayArticles.map(article => (
              <ArticleCard key={article.id}>
                <CardImage 
                  src={article.image} 
                  alt={article.title}
                  onClick={() => handleGoToArticle(article.id)}
                />
                <CardContent>
                  <CardHeader>
                    <CategoryTag>{article.category}</CategoryTag>
                    <LikeButton onClick={() => handleRemoveLike(article)}>
                      <FavoriteIcon sx={{ fontSize: 18, color: '#f44336' }} />
                    </LikeButton>
                  </CardHeader>
                  
                  <CardTitle onClick={() => handleGoToArticle(article.id)}>
                    {article.title}
                  </CardTitle>
                  
                  <CardMeta>
                    <PublishDate>Article #{article.id}</PublishDate>
                    <LikedDate>Liked: {new Date(article.likedAt).toLocaleDateString()}</LikedDate>
                  </CardMeta>
                </CardContent>
              </ArticleCard>
            ))}
          </ArticleGrid>

          {displayArticles.length === 0 && (
            <EmptyState>
              <EmptyIcon>💔</EmptyIcon>
              <EmptyText>No liked articles yet.</EmptyText>
              <EmptySubtext>Start reading and liking articles to see them here!</EmptySubtext>
            </EmptyState>
          )}
        </PageContainer>
      </MobileContentWrapper>
      {/* 인증 모달 */}
      <AuthModal 
        open={isModalOpen || false} 
        onClose={() => setIsModalOpen && setIsModalOpen(false)} 
      />
    </>
  );
};

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 1.8rem;
  font-weight: bold;
  margin: 0;
`;

const SortContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ArticleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
`;

const ArticleCard = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  overflow: hidden;
  transition: box-shadow 0.2s;
  
  &:hover {
    box-shadow: 0 4px 24px rgba(0,0,0,0.15);
  }
`;

const CardImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover {
    transform: scale(1.02);
  }
`;

const CardContent = styled.div`
  padding: 1.5rem;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const CategoryTag = styled.span`
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.3rem 0.8rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const LikeButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background 0.2s;
  
  &:hover {
    background: #f5f5f5;
  }
`;

const CardTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: bold;
  margin: 0 0 1rem 0;
  cursor: pointer;
  line-height: 1.4;
  
  &:hover {
    color: #1976d2;
  }
`;

const CardMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: #888;
`;

const PublishDate = styled.span`
  color: #666;
`;

const LikedDate = styled.span`
  color: #f44336;
  font-weight: 500;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const EmptyText = styled.h3`
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
  color: #666;
`;

const EmptySubtext = styled.p`
  font-size: 1rem;
  color: #888;
  margin: 0;
`;

const EmptyAuthState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
`;

export default Like; 