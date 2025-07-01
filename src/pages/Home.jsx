import React, { useState, useEffect } from 'react';
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
import { useEnhancedToast } from '../components/EnhancedToastProvider';
import { ArticleListSkeleton, LoadingSpinner } from '../components/LoadingComponents';
import ErrorBoundary, { NewsListErrorFallback } from '../components/ErrorBoundary';
import MainNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import AuthModal from '../components/AuthModal';
import PageContainer from '../components/PageContainer';
import SearchDropdown from '../components/SearchDropdown';
import ArticleCard from '../components/ArticleCard';
import { designTokens, getColor, getBorderRadius, getShadow } from '../utils/designTokens';
import { useIsMobile, ResponsiveGrid } from '../components/ResponsiveHelpers';
import { getCategoryPageUrl, isValidCategory } from '../utils/categoryUtils';

const Home = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth() || {};
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const toast = useEnhancedToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [allNewsData, setAllNewsData] = useState({});
  
  // 공지사항 상태
  const [notices, setNotices] = useState(() => {
    const saved = localStorage.getItem('marlang_notices');
    return saved ? JSON.parse(saved).filter(notice => notice.active) : [];
  });
  
  // 동적 카테고리 관리
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('marlang_categories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
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
  useEffect(() => {
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

    const handleNoticesUpdate = (event) => {
      const updatedNotices = event.detail || [];
      const activeNotices = updatedNotices.filter(notice => notice.active);
      setNotices(activeNotices);
    };

    const handleArticleUpdate = (event) => {
      const { type, article } = event.detail;
      
      if (type === 'add') {
        toast.success(`새 기사가 추가되었습니다: ${article.title}`);
        refreshArticles();
      } else if (type === 'update') {
        toast.info(`기사가 수정되었습니다: ${article.title}`);
        refreshArticles();
      } else if (type === 'delete') {
        toast.info(`기사가 삭제되었습니다: ${article.title}`);
        refreshArticles();
      }
    };

    window.addEventListener('categoriesUpdated', handleCategoryUpdate);
    window.addEventListener('articleUpdated', handleArticleUpdate);
    window.addEventListener('noticesUpdated', handleNoticesUpdate);
    
    return () => {
      window.removeEventListener('categoriesUpdated', handleCategoryUpdate);
      window.removeEventListener('articleUpdated', handleArticleUpdate);
      window.removeEventListener('noticesUpdated', handleNoticesUpdate);
    };
  }, [refreshArticles, toast]);

  // Load category data from context
  useEffect(() => {
    if (!loading) {
      const categoryData = {};

      categoryData.recent = getRecentArticles(10);
      categoryData.popular = getPopularArticles(10);

      categories.forEach((category) => {
        if (category.type === 'category') {
          categoryData[category.id] = getArticlesByCategory(category.name, 5);
        }
      });

      setAllNewsData(categoryData);
    }
  }, [loading, getRecentArticles, getPopularArticles, getArticlesByCategory, categories]);

  const handleCategoryClick = (category) => {
    // Recent, Popular 카테고리는 기존처럼 스크롤
    if (category.type === 'recent' || category.type === 'popular') {
      const element = document.getElementById(`category-${category.id}`);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
      return;
    }
    
    // 다른 카테고리는 전용 페이지로 이동
    if (isValidCategory(category)) {
      const categoryUrl = getCategoryPageUrl(category);
      if (categoryUrl) {
        navigate(categoryUrl);
      }
    }
  };

  const retryNews = () => {
    refreshArticles();
    toast.info('Refreshing articles...');
  };
  
  return (
    <>
      {/* 통합 네비게이션 */}
      <MainNavigation 
        showCategoryTabs={true}
      >
        {/* 카테고리 탭 */}
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
                onClick={() => handleCategoryClick(category)}
                sx={{ 
                  fontWeight: 'medium',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.04)'
                  }
                }}
              />
            ))}
          </Tabs>
        </Box>
      </MainNavigation>
      
      <MobileContentWrapper>
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
            {/* 공지사항 영역 */}
            {notices.length > 0 && (
              <NoticeSection>
                {notices.map((notice, index) => (
                  <Alert 
                    key={notice.id || index}
                    severity={notice.type || 'info'} 
                    sx={{ mb: 1 }}
                    onClose={() => {
                      const updatedNotices = notices.filter((_, i) => i !== index);
                      setNotices(updatedNotices);
                      
                      // 로컬스토리지 업데이트
                      const allNotices = JSON.parse(localStorage.getItem('marlang_notices') || '[]');
                      const noticeToUpdate = allNotices.find(n => n.id === notice.id);
                      if (noticeToUpdate) {
                        noticeToUpdate.active = false;
                        localStorage.setItem('marlang_notices', JSON.stringify(allNotices));
                      }
                    }}
                  >
                    {notice.message}
                  </Alert>
                ))}
              </NoticeSection>
            )}

            {categories.map((category) => (
              <CategorySection key={category.id} id={`category-${category.id}`}>
                <CategoryHeader>
                  <CategoryTitle>
                    {category.name}
                  </CategoryTitle>
                </CategoryHeader>
                
                <HorizontalScrollContainer id={`scroll-${category.id}`}>
                  <ArticleRow>
                    {allNewsData[category.id]?.map(article => (
                      <ArticleCardWrapper key={article.id}>
                        <ArticleCard {...article} navigate={navigate} />
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

// 스타일드 컴포넌트들
const ContentContainer = styled.div`
  padding: 0 1rem 2rem 1rem;
  
  @media (min-width: 768px) {
    padding: 0 2rem 2rem 2rem;
  }
`;

const CategorySection = styled.div`
  margin-bottom: 3rem;
  scroll-margin-top: 80px; /* 탭 바 높이 고려 */
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
  
const NoticeSection = styled.div`
  margin-bottom: ${designTokens.spacing.md};
`;

const HorizontalScrollContainer = styled.div`
  overflow-x: auto;
  padding-bottom: 1rem;
  cursor: grab;
  
  &:active {
    cursor: grabbing;
  }
  
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

export default Home;