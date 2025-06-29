import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  AppBar, Toolbar, Typography, IconButton, Tabs, Tab, Box,
  Avatar, Menu, MenuItem, ListItemIcon, ListItemText, useMediaQuery, useTheme,
  Button, Select, FormControl, InputLabel
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import SortIcon from '@mui/icons-material/Sort';
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
  const { likedArticles, sortLikedArticles } = useData();
  const { allArticles } = useArticles(); // 전체 기사 데이터 가져오기
  const [navTab, setNavTab] = useState(3);
  const [anchorEl, setAnchorEl] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [sortBy, setSortBy] = useState('date'); // 기본 정렬: 좋아요한 날짜순
  const [sortMenuAnchor, setSortMenuAnchor] = useState(null);

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

  // 좋아요한 기사들을 최신 데이터로 보강
  const enrichedLikedArticles = likedArticles.map(likedArticle => {
    // 전체 기사에서 해당 기사 찾기
    const fullArticle = allArticles.find(article => article.id === likedArticle.id);
    
    if (fullArticle) {
      // 전체 기사 데이터로 보강
      return {
        ...fullArticle,
        likedAt: likedArticle.likedAt // 좋아요한 시간은 유지
      };
    }
    
    // 전체 기사에서 찾지 못한 경우 기본값 제공
    return {
      ...likedArticle,
      summary: likedArticle.summary || 'No summary available for this article.',
      publishedAt: likedArticle.publishedAt || likedArticle.likedAt || new Date().toISOString(),
      image: likedArticle.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80',
      category: likedArticle.category || 'General'
    };
  });

  // 정렬된 기사 목록
  const sortedArticles = [...enrichedLikedArticles].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.likedAt || b.publishedAt) - new Date(a.likedAt || a.publishedAt);
      case 'title':
        return a.title.localeCompare(b.title);
      case 'category':
        return a.category.localeCompare(b.category);
      case 'published':
        return new Date(b.publishedAt) - new Date(a.publishedAt);
      default:
        return 0;
    }
  });

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

  const handleSortMenuOpen = (event) => {
    setSortMenuAnchor(event.currentTarget);
  };

  const handleSortMenuClose = () => {
    setSortMenuAnchor(null);
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    handleSortMenuClose();
  };

  const getSortLabel = (sortType) => {
    switch (sortType) {
      case 'date': return '좋아요한 날짜순';
      case 'title': return '제목순';
      case 'category': return '카테고리순';
      case 'published': return '발행일순';
      default: return '좋아요한 날짜순';
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
          <TitleContainer>
            <TitleSection>
              <Title>❤️ Liked Articles</Title>
              {isAuthenticated && (
                <ArticleCount>
                  {sortedArticles.length} article{sortedArticles.length !== 1 ? 's' : ''}
                </ArticleCount>
              )}
            </TitleSection>
            
            {isAuthenticated && sortedArticles.length > 0 && (
              <SortSection>
                <SortButton 
                  variant="outlined" 
                  startIcon={<SortIcon />}
                  onClick={handleSortMenuOpen}
                  size="small"
                >
                  {getSortLabel(sortBy)}
                </SortButton>
                
                <Menu
                  anchorEl={sortMenuAnchor}
                  open={Boolean(sortMenuAnchor)}
                  onClose={handleSortMenuClose}
                  PaperProps={{
                    style: {
                      minWidth: 180,
                    },
                  }}
                >
                  <MenuItem 
                    onClick={() => handleSortChange('date')}
                    selected={sortBy === 'date'}
                  >
                    좋아요한 날짜순
                  </MenuItem>
                  <MenuItem 
                    onClick={() => handleSortChange('published')}
                    selected={sortBy === 'published'}
                  >
                    발행일순
                  </MenuItem>
                  <MenuItem 
                    onClick={() => handleSortChange('title')}
                    selected={sortBy === 'title'}
                  >
                    제목순 (A-Z)
                  </MenuItem>
                  <MenuItem 
                    onClick={() => handleSortChange('category')}
                    selected={sortBy === 'category'}
                  >
                    카테고리순
                  </MenuItem>
                </Menu>
              </SortSection>
            )}
          </TitleContainer>
          
          {!isAuthenticated ? (
            <EmptyState>
              <EmptyIcon>🔐</EmptyIcon>
              <EmptyText>로그인이 필요합니다</EmptyText>
              <EmptySubtext>좋아요한 기사를 확인하려면 먼저 로그인해주세요.</EmptySubtext>
              <LoginButton 
                variant="contained" 
                color="primary"
                onClick={handleLoginClick}
                sx={{ mt: 2 }}
              >
                로그인하기
              </LoginButton>
            </EmptyState>
          ) : sortedArticles.length === 0 ? (
            <EmptyState>
              <EmptyIcon>💙</EmptyIcon>
              <EmptyText>No liked articles yet.</EmptyText>
              <EmptySubtext>Start exploring articles and heart the ones you love!</EmptySubtext>
            </EmptyState>
          ) : (
            <CardsContainer>
              {sortedArticles.map(article => (
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

const TitleContainer = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 2rem;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
`;

const TitleSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  
  @media (max-width: 768px) {
    justify-content: space-between;
  }
`;

const SortSection = styled.div`
  display: flex;
  align-items: center;
  
  @media (max-width: 768px) {
    justify-content: flex-end;
  }
`;

const Title = styled.h1`
  font-size: 1.8rem;
  font-weight: bold;
  margin: 0;
  color: #333;
`;

const ArticleCount = styled.span`
  font-size: 0.9rem;
  color: #666;
  background: #f5f5f5;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-weight: 500;
  white-space: nowrap;
`;

const SortButton = styled(Button)`
  && {
    min-width: 140px;
    color: #666;
    border-color: #ddd;
    background: white;
    
    &:hover {
      background: #f8f9fa;
      border-color: #1976d2;
      color: #1976d2;
    }
    
    .MuiButton-startIcon {
      margin-right: 0.5rem;
    }
  }
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

const LoginButton = styled(Button)`
  && {
    min-width: 140px;
    color: #666;
    border-color: #ddd;
    background: white;
    
    &:hover {
      background: #f8f9fa;
      border-color: #1976d2;
      color: #1976d2;
    }
    
    .MuiButton-startIcon {
      margin-right: 0.5rem;
    }
  }
`;

export default Like; 