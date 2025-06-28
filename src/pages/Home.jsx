import React from 'react';
import styled from 'styled-components';
import { 
  AppBar, Toolbar, Typography, InputBase, Tabs, Tab, Box, 
  IconButton, Avatar, Menu, MenuItem, ListItemIcon, ListItemText,
  useMediaQuery, useTheme, Alert, Button, Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useArticles } from '../contexts/ArticlesContext';
import { useToast } from '../components/ToastProvider';
import { ArticleListSkeleton, LoadingSpinner } from '../components/LoadingComponents';
import ErrorBoundary, { NewsListErrorFallback } from '../components/ErrorBoundary';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';

const navigationTabs = ['Home', 'Date', 'Wordbook', 'Like', 'Profile', 'Dashboard'];

const Home = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth() || {};
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const toast = useToast();
  
  const [navTab, setNavTab] = React.useState(0);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [allNewsData, setAllNewsData] = React.useState({});
  
  // 동적 카테고리 관리
  const [categories, setCategories] = React.useState(() => {
    const saved = localStorage.getItem('marlang_categories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // 기본 카테고리로 폴백
        return [
          { id: 'recent', name: 'Recent', type: 'recent' },
          { id: 'technology', name: 'Technology', type: 'category' },
          { id: 'science', name: 'Science', type: 'category' },
          { id: 'business', name: 'Business', type: 'category' },
          { id: 'culture', name: 'Culture', type: 'category' },
          { id: 'society', name: 'Society', type: 'category' },
          { id: 'popular', name: 'Popular', type: 'popular' }
        ];
      }
    }
    // 기본 카테고리
    return [
      { id: 'recent', name: 'Recent', type: 'recent' },
      { id: 'technology', name: 'Technology', type: 'category' },
      { id: 'science', name: 'Science', type: 'category' },
      { id: 'business', name: 'Business', type: 'category' },
      { id: 'culture', name: 'Culture', type: 'category' },
      { id: 'society', name: 'Society', type: 'category' },
      { id: 'popular', name: 'Popular', type: 'popular' }
    ];
  });
  
  // Use shared articles context
  const { 
    loading, 
    error, 
    getRecentArticles, 
    getPopularArticles, 
    getArticlesByCategory, 
    refreshArticles 
  } = useArticles();

  // 카테고리 변경 감지 및 로컬스토리지 동기화
  React.useEffect(() => {
    const handleCategoryUpdate = () => {
      const saved = localStorage.getItem('marlang_categories');
      if (saved) {
        try {
          const newCategories = JSON.parse(saved);
          setCategories(newCategories);
        } catch (e) {
          console.error('Failed to parse categories:', e);
        }
      }
    };

    // 커스텀 이벤트 리스너 등록
    window.addEventListener('categoriesUpdated', handleCategoryUpdate);
    
    return () => {
      window.removeEventListener('categoriesUpdated', handleCategoryUpdate);
    };
  }, []);

  // Load category data from context
  React.useEffect(() => {
    if (!loading) {
      const categoryData = {};

      // Recent: 발행일 기준 최신순
      categoryData.recent = getRecentArticles(10);

      // Popular: 좋아요 기준 내림차순 (최근 일주일)
      categoryData.popular = getPopularArticles(10);

      // 카테고리별 기사
      categories.forEach((category) => {
        if (category.type === 'category') {
          categoryData[category.id] = getArticlesByCategory(category.name, 5);
        }
      });

      setAllNewsData(categoryData);
    }
  }, [loading, getRecentArticles, getPopularArticles, getArticlesByCategory, categories]);

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
    navigate('/login');
  };

  const scrollToCategory = (categoryId) => {
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const retryNews = () => {
    refreshArticles();
    toast.info('Refreshing articles...');
  };
  
  return (
    <>
      {/* 모바일 네비게이션 */}
      <MobileNavigation />
      
      <MobileContentWrapper>
        {/* 상단바 - 항상 표시 */}
        <AppBar position="static" color="default" elevation={1}>
            <Toolbar>
              <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold', color: '#23408e' }}>
                MarLang Eng News
              </Typography>
              <InputBase
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
                onClick={() => navigate('/search')}
                startAdornment={<SearchIcon sx={{ mr: 1 }} />}
                sx={{ background: '#f5f5f5', borderRadius: 2, px: 2, mr: 2, cursor: 'pointer' }}
              />
              
              {/* 사용자 프로필 메뉴 또는 로그인 버튼 */}
              {isAuthenticated ? (
                <IconButton
                  size="large"
                  onClick={handleUserMenuOpen}
                  color="inherit"
                >
                  <Avatar 
                    src={user?.picture} 
                    alt={user?.name}
                    sx={{ width: 32, height: 32 }}
                  >
                    {!user?.picture && <AccountCircleIcon />}
                  </Avatar>
                </IconButton>
              ) : (
                <IconButton
                  size="large"
                  onClick={handleLoginClick}
                  color="inherit"
                  sx={{ 
                    border: '1px solid #1976d2', 
                    borderRadius: 2,
                    padding: '6px 12px',
                    fontSize: '0.875rem'
                  }}
                >
                  <AccountCircleIcon sx={{ mr: 0.5 }} />
                  Login
                </IconButton>
              )}
              
              {isAuthenticated && (
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleUserMenuClose}
                  onClick={handleUserMenuClose}
                  PaperProps={{
                    elevation: 0,
                    sx: {
                      overflow: 'visible',
                      filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                      mt: 1.5,
                      '& .MuiAvatar-root': {
                        width: 32,
                        height: 32,
                        ml: -0.5,
                        mr: 1,
                      },
                      '&:before': {
                        content: '""',
                        display: 'block',
                        position: 'absolute',
                        top: 0,
                        right: 14,
                        width: 10,
                        height: 10,
                        bgcolor: 'background.paper',
                        transform: 'translateY(-50%) rotate(45deg)',
                        zIndex: 0,
                      },
                    },
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <MenuItem onClick={() => navigate('/profile')}>
                    <ListItemIcon>
                      <Avatar src={user?.picture} sx={{ width: 24, height: 24 }}>
                        <AccountCircleIcon fontSize="small" />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {user?.name || 'Guest User'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user?.email || 'guest@marlang.com'}
                      </Typography>
                    </ListItemText>
                  </MenuItem>
                  
                  <MenuItem onClick={() => navigate('/settings')}>
                    <ListItemIcon>
                      <SettingsIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Settings</ListItemText>
                  </MenuItem>
                  
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Logout</ListItemText>
                  </MenuItem>
                </Menu>
              )}
            </Toolbar>
          </AppBar>
        
        {/* 네비게이션 바 - 데스크톱만 */}
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
                      case 'Home':
                        navigate('/');
                        break;
                      case 'Date':
                        navigate('/date');
                        break;
                      case 'Wordbook':
                        navigate('/wordbook');
                        break;
                      case 'Like':
                        navigate('/like');
                        break;
                      case 'Profile':
                        navigate('/profile');
                        break;
                      case 'Dashboard':
                        navigate('/dashboard');
                        break;
                      default:
                        break;
                    }
                  }}
                />
              ))}
            </Tabs>
          </Box>
        )}
        
        {/* 카테고리 탭 - 항상 표시 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs 
            value={false} 
            variant="scrollable" 
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                minWidth: 'auto',
                padding: '12px 16px'
              }
            }}
          >
            {categories.map((category) => (
              <Tab 
                key={category.id} 
                label={category.name}
                onClick={() => scrollToCategory(category.id)}
                sx={{ 
                  fontWeight: 'medium',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.04)'
                  }
                }}
              />
            ))}
          </Tabs>
        </Box>
        
        {/* 에러 상태 처리 */}
        {error && (
          <Box sx={{ p: 2 }}>
            <ErrorBoundary fallback={NewsListErrorFallback}>
              <Alert 
                severity="warning" 
                action={
                  <Button color="inherit" size="small" onClick={retryNews} startIcon={<RefreshIcon />}>
                    Retry
                  </Button>
                }
                sx={{ mb: 2 }}
              >
                Failed to load news: {error}
              </Alert>
            </ErrorBoundary>
          </Box>
        )}
        
        {/* 로딩 상태 */}
        {loading ? (
          <ArticleListSkeleton count={6} />
        ) : (
          /* 카테고리별 기사 섹션들 */
          <ContentContainer>
            {categories.map((category) => (
              <CategorySection key={category.id} id={`category-${category.id}`}>
                <CategoryHeader>
                  <CategoryTitle>
                    {category.name}
                    <Chip 
                      label={`${allNewsData[category.id]?.length || 0} articles`} 
                      size="small" 
                      sx={{ ml: 2 }} 
                    />
                  </CategoryTitle>
                </CategoryHeader>
                
                <HorizontalScrollContainer id={`scroll-${category.id}`}>
                  <ArticleRow>
                    {allNewsData[category.id]?.map(article => (
                      <ArticleCardWrapper key={article.id}>
                        <NewsCard {...article} navigate={navigate} />
                      </ArticleCardWrapper>
                    ))}
                    {(!allNewsData[category.id] || allNewsData[category.id].length === 0) && (
                      <EmptyCategory>
                        <Typography variant="body2" color="text.secondary">
                          No {category.name.toLowerCase()} articles available
                        </Typography>
                      </EmptyCategory>
                    )}
                  </ArticleRow>
                </HorizontalScrollContainer>
              </CategorySection>
            ))}
          </ContentContainer>
        )}
        
      </MobileContentWrapper>
    </>
  );
};

const ContentContainer = styled.div`
  padding: 0 1rem 2rem 1rem;
  
  @media (min-width: 768px) {
    padding: 0 2rem 2rem 2rem;
  }
`;

const CategorySection = styled.div`
  margin-bottom: 3rem;
  scroll-margin-top: 80px; /* 탭 바 높이 고려 */
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
`;

const CategoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const CategoryTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #1976d2;
  margin: 0;
`;

const HorizontalScrollContainer = styled.div`
  overflow-x: auto;
  padding-bottom: 1rem;
  
  &::-webkit-scrollbar {
    height: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
    
    &:hover {
      background: #a8a8a8;
    }
  }
`;

const ArticleRow = styled.div`
  display: flex;
  gap: 1.5rem;
  min-width: max-content;
  padding: 0.5rem 0;
`;

const ArticleCardWrapper = styled.div`
  flex: 0 0 320px;
  width: 320px;
`;

const EmptyCategory = styled.div`
  flex: 0 0 320px;
  width: 320px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9f9f9;
  border-radius: 16px;
  border: 2px dashed #ddd;
`;

const NewsCard = ({ id, image, title, category, level, readingTime, summary, publishedAt, source, likes, navigate }) => {
  const handleClick = () => {
    navigate(`/article/${id}`);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return 'Recent';
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Beginner': return '#4caf50';
      case 'Intermediate': return '#ff9800';
      case 'Advanced': return '#f44336';
      default: return '#757575';
    }
  };

  return (
    <CardBox onClick={handleClick}>
      <Thumb 
        src={image} 
        alt={title}
        onError={(e) => {
          e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80';
        }}
      />
      <CardContent>
        <CardHeader>
          <CategoryChip>{category}</CategoryChip>
          <MetaInfo>
            {readingTime && <ReadingTime>{readingTime} min read</ReadingTime>}
          </MetaInfo>
        </CardHeader>
        
        <CardTitle>{title}</CardTitle>
        
        {summary && (
          <CardSummary>
            {summary.length > 120 ? `${summary.substring(0, 120)}...` : summary}
          </CardSummary>
        )}
        
        <CardFooter>
          <FooterLeft>
            {level && (
              <LevelBadge $level={level}>
                {level}
              </LevelBadge>
            )}
            <PublishDate>{formatDate(publishedAt)}</PublishDate>
            {likes && (
              <LikesCount>❤️ {likes}</LikesCount>
            )}
          </FooterLeft>
          {source && (
            <Source>{source}</Source>
          )}
        </CardFooter>
      </CardContent>
    </CardBox>
  );
};

const CardBox = styled.div`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s;
  cursor: pointer;
  &:hover {
    box-shadow: 0 4px 24px rgba(0,0,0,0.13);
  }
`;

const Thumb = styled.img`
  width: 100%;
  height: 180px;
  object-fit: cover;
`;

const CardContent = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const CategoryChip = styled.span`
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const MetaInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ReadingTime = styled.span`
  font-size: 0.75rem;
  color: #757575;
`;

const CardTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: bold;
  margin: 0 0 0.75rem 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardSummary = styled.p`
  font-size: 0.9rem;
  color: #666;
  line-height: 1.5;
  margin: 0 0 1rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 0.5rem;
`;

const FooterLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LevelBadge = styled.span`
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${props => {
    switch (props.$level) {
      case 'Beginner': return '#e8f5e8';
      case 'Intermediate': return '#fff3e0';
      case 'Advanced': return '#ffebee';
      default: return '#f5f5f5';
    }
  }};
  color: ${props => {
    switch (props.$level) {
      case 'Beginner': return '#2e7d32';
      case 'Intermediate': return '#ef6c00';
      case 'Advanced': return '#c62828';
      default: return '#757575';
    }
  }};
`;

const PublishDate = styled.span`
  font-size: 0.75rem;
  color: #999;
`;

const LikesCount = styled.span`
  font-size: 0.75rem;
  color: #e91e63;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 2px;
`;

const Source = styled.span`
  font-size: 0.75rem;
  color: #1976d2;
  font-weight: 500;
`;

export default Home;