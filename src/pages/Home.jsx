import React, { useState, useEffect, useCallback } from 'react';
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
import { useNavigate, useLocation } from 'react-router-dom';
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
import { AdCard, ContentWithAds } from '../components/ads';
import SimpleSEO from '../components/SimpleSEO';
import HomeSocialMeta from '../components/HomeSocialMeta';
import { designTokens, getColor, getBorderRadius, getShadow } from '../utils/designTokens';
import { useIsMobile, ResponsiveGrid } from '../components/ResponsiveHelpers';
import { useAdInjector } from '../hooks/useAdInjector';
import { getCategoryPageUrl, isValidCategory } from '../utils/categoryUtils';

const CategoryDisplay = ({ category, articles, navigate, showAds = false }) => {
  console.log('🏠 CategoryDisplay:', {
    categoryId: category.id,
    articlesCount: articles.length,
    showAds
  });

  return (
    <CategorySection id={`category-${category.id}`}>
      <CategoryHeader>
        <CategoryTitle onClick={() => {
          if (category.type === 'category' && isValidCategory(category)) {
            const categoryUrl = getCategoryPageUrl(category);
            if (categoryUrl) {
              navigate(categoryUrl);
            }
          }
        }} style={{ cursor: 'pointer' }}>
          {category.name}
          {category.type === 'category' && isValidCategory(category) && (
            <AllLabel>All</AllLabel>
          )}
        </CategoryTitle>
      </CategoryHeader>

      <HorizontalScrollContainer id={`scroll-${category.id}`}>
        <ArticleRow>
          {articles.length > 0 ? (
            showAds ? (
              <ContentWithAds
                articles={articles}
                adInterval={3}
                maxAds={2}
                layout="horizontal"
                categoryId={category.id}
                renderArticle={(article, index) => (
                  <ArticleCardWrapper key={article.id}>
                    <ArticleCard {...article} navigate={navigate} />
                  </ArticleCardWrapper>
                )}
              />
            ) : (
              // 광고 없이 기사만 표시
              articles.map((article, index) => (
                <ArticleCardWrapper key={article.id}>
                  <ArticleCard {...article} navigate={navigate} />
                </ArticleCardWrapper>
              ))
            )
          ) : (
            <EmptyCategory>
              <Typography variant="body2" color="text.secondary">
                No {category.name.toLowerCase()} articles available
              </Typography>
            </EmptyCategory>
          )}
        </ArticleRow>
      </HorizontalScrollContainer>
    </CategorySection>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, signOut } = useAuth() || {};
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const toast = useEnhancedToast();

  // 오류 상태 추가
  const [homeError, setHomeError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [allNewsData, setAllNewsData] = useState({});

  // 공지사항 상태
  const [notices, setNotices] = useState(() => {
    const saved = localStorage.getItem('marlang_notices');
    return saved ? JSON.parse(saved).filter(notice => notice.active) : [];
  });

  // 기본 카테고리 정의
  const defaultCategories = [
    { id: 'recent', name: 'Recent', type: 'recent' },
    { id: 'technology', name: 'Technology', type: 'category' },
    { id: 'science', name: 'Science', type: 'category' },
    { id: 'business', name: 'Business', type: 'category' },
    { id: 'culture', name: 'Culture', type: 'category' },
    { id: 'society', name: 'Society', type: 'category' },
    { id: 'popular', name: 'Popular', type: 'popular' }
  ];

  // 동적 카테고리 관리 - ArticlesContext에서 가져오기
  const [localCategories, setLocalCategories] = useState(defaultCategories);

  // Use shared articles context with null check
  const articlesContext = useArticles();

  // Context가 null인 경우 기본값 설정 (더 안전한 기본값)
  const {
    loading = true,
    error = null,
    categories: contextCategories = [],
    getRecentArticles = () => [],
    getPopularArticles = () => [],
    getArticlesByCategory = () => [],
    refreshArticles = () => Promise.resolve()
  } = articlesContext || {};

  // 카테고리 동기화
  const categories = Array.isArray(contextCategories) && contextCategories.length > 0
    ? contextCategories
    : localCategories;

  // 카테고리 동기화
  useEffect(() => {
    const handleCategoryUpdate = (event) => {
      if (import.meta.env.DEV) {
        console.log('🏠 Home 컴포넌트: 카테곣0리 업데이트 이벤트 수신', event.detail);
      }
      if (event.detail && Array.isArray(event.detail.categories)) {
        setLocalCategories(event.detail.categories);
        toast.info('카테고리가 업데이트되었습니다!');
        // 새로운 카테고리 기반으로 기사 데이터 다시 로드
        refreshArticles();
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

  // 데이터 로딩 로직 개선 (더 안전한 버전)
  const loadCategoryData = useCallback(async () => {
    try {
      setHomeError(null);

      // 로딩 중이거나 필수 데이터가 없으면 대기
      if (loading || !Array.isArray(categories)) {
        return;
      }

      const categoryData = {};

      // 각 함수 호출을 개별 try-catch로 보호
      try {
        if (getRecentArticles && typeof getRecentArticles === 'function') {
          const recentArticles = getRecentArticles(10);
          categoryData.recent = Array.isArray(recentArticles) ? recentArticles : [];
        }
      } catch (recentError) {
        console.warn('Recent articles 로드 실패:', recentError);
        categoryData.recent = [];
      }

      // Popular articles 로드 추가
      try {
        if (getPopularArticles && typeof getPopularArticles === 'function') {
          const popularArticles = getPopularArticles(10);
          categoryData.popular = Array.isArray(popularArticles) ? popularArticles : [];
          console.log('📈 Popular articles 로드됨:', popularArticles.length);
        }
      } catch (popularError) {
        console.warn('Popular articles 로드 실패:', popularError);
        categoryData.popular = [];
      }

      // 카테고리별 기사도 개별 보호
      categories.forEach((category) => {
        try {
          if (category && category.type === 'category' && category.id && category.name) {
            if (getArticlesByCategory && typeof getArticlesByCategory === 'function') {
              const categoryArticles = getArticlesByCategory(category.name, 5);
              categoryData[category.id] = Array.isArray(categoryArticles) ? categoryArticles : [];
            }
          }
        } catch (categoryError) {
          console.warn(`카테고리 ${category?.name} 로드 실패:`, categoryError);
          if (category?.id) {
            categoryData[category.id] = [];
          }
        }
      });

      setAllNewsData(categoryData);
    } catch (error) {
      console.error('🚨 Home 컴포넌트 데이터 로드 오류:', error);
      setHomeError(error.message || 'Failed to load home data');
      setAllNewsData({});
    }
  }, [loading, categories, getRecentArticles, getPopularArticles, getArticlesByCategory]);

  // Load category data from context with enhanced error handling
  useEffect(() => {
    // 비동기 함수 호출을 안전하게 처리
    loadCategoryData().catch((error) => {
      console.error('🚨 loadCategoryData 실행 오류:', error);
      setHomeError('Failed to initialize home data');
    });

  }, [loadCategoryData]);
  const handleCategoryClick = (category) => {
    const element = document.getElementById(`category-${category.id}`);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // 카테고리 제목 클릭 시 카테고리 페이지로 이동
  const handleCategoryTitleClick = (category) => {
    if (category.type === 'category' && isValidCategory(category)) {
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
      {/* SEO 메타데이터 */}
      <SimpleSEO />

      {/* 홈페이지 소셜 메타데이터 */}
      <HomeSocialMeta />

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
            {Array.isArray(categories) && categories.map((category) => {
              // 더 엄격한 null/undefined 체크
              if (!category || typeof category !== 'object' || !category.id || !category.name) {
                console.warn('Invalid category in tabs:', category);
                return null;
              }
              
              return (
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
              );
            })}
          </Tabs>
        </Box>
      </MainNavigation>

      <MobileContentWrapper>
        {/* 에러 상태 처리 */}
        {(error || homeError) && (
          <Box sx={{ p: 2 }}>
            <Alert
              severity="warning"
              action={
                <Button color="inherit" size="small" onClick={retryNews} startIcon={<RefreshIcon />}>
                  Retry
                </Button>
              }
              sx={{ mb: 2 }}
            >
              Failed to load news: {error || homeError}
            </Alert>
          </Box>
        )}

        {/* 로딩 상태 */}
        {loading ? (
          <ArticleListSkeleton count={6} />
        ) : (
          /* 카테고리별 기사 섹션들 */
          <ContentContainer>
            {/* 공지사항 영역 */}
            {Array.isArray(notices) && notices.length > 0 && (
              <NoticeSection>
                {notices.map((notice, index) => {
                  // 더 엄격한 null/undefined 체크
                  if (!notice || typeof notice !== 'object') {
                    console.warn('Invalid notice found:', notice);
                    return null;
                  }
                  
                  return (
                    <Alert
                      key={notice.id || index}
                      severity={notice.type || 'info'}
                      sx={{ mb: 1 }}
                      onClose={() => {
                        const updatedNotices = notices.filter((_, i) => i !== index);
                        setNotices(updatedNotices);

                        // 로컬스토리지 업데이트
                        try {
                          const allNotices = JSON.parse(localStorage.getItem('marlang_notices') || '[]');
                          const noticeToUpdate = allNotices.find(n => n.id === notice.id);
                          if (noticeToUpdate) {
                            noticeToUpdate.active = false;
                            localStorage.setItem('marlang_notices', JSON.stringify(allNotices));
                          }
                        } catch (error) {
                          if (import.meta.env.DEV) {
                            console.error('공지사항 업데이트 중 오류:', error);
                          }
                        }
                      }}
                    >
                      {notice.message}
                    </Alert>
                  );
                })}
              </NoticeSection>
            )}

            {Array.isArray(categories) && categories.map((category, categoryIndex) => {
              // 더 엄격한 null/undefined 체크
              if (!category || typeof category !== 'object' || !category.id || !category.name) {
                console.warn('Invalid category found:', category);
                return null;
              }
              
              const articles = allNewsData[category.id] || [];
              // Recent 카테고리에서만 광고 표시
              const showAds = (categoryIndex === 0 && category.id === 'recent');
              
              return (
                <CategoryDisplay 
                  key={category.id} 
                  category={category} 
                  articles={articles} 
                  navigate={navigate}
                  showAds={showAds}
                />
              );
            })}
          </ContentContainer>
        )}
      </MobileContentWrapper>
    </>
  );
};

// 스타일드 컴포넌트들
const ContentContainer = styled.div`
  padding: 0 1rem 2rem 1rem;
  background-color: ${props => props.theme.palette.background.default};
  color: ${props => props.theme.palette.text.primary};
  min-height: 100vh;
  
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
  color: ${props => props.theme.palette.primary.main};
  margin: 0;
`;

const AllLabel = styled.span`
  font-size: 0.6rem;
  font-weight: bold;
  background-color: ${props => props.theme.palette.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(0, 0, 0, 0.08)'};
  color: ${props => props.theme.palette.text.secondary};
  padding: 2px 4px;
  border-radius: 6px;
  margin-left: 6px;
  display: inline-flex;
  align-items: center;
  height: 12px;
  line-height: 1;
  pointer-events: none;
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
  
  /* 모바일에서 스크롤 스냅 적용 - 부드럽게 */
  @media (max-width: 768px) {
    scroll-snap-type: x proximity; /* mandatory에서 proximity로 변경 */
    padding-left: 2vw; /* 여백 조정 */
    scroll-behavior: smooth; /* 부드러운 스크롤 */
  }
  
  &::-webkit-scrollbar {
    height: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => props.theme.palette.mode === 'dark' ? '#2e2e2e' : '#f1f1f1'};
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.palette.mode === 'dark' ? '#555' : '#c1c1c1'};
    border-radius: 3px;
    
    &:hover {
      background: ${props => props.theme.palette.mode === 'dark' ? '#777' : '#a8a8a8'};
    }
  }
`;

const ArticleRow = styled.div`
  display: flex;
  gap: 1.5rem;
  min-width: max-content;
  padding: 0.5rem 0;
  
  /* 모바일에서 간격 조정 */
  @media (max-width: 768px) {
    gap: 0.375rem; /* 기존 0.75rem의 절반 */
  }
`;

const ArticleCardWrapper = styled.div`
  flex: 0 0 320px;
  width: 320px;
  scroll-snap-align: start; /* 스크롤 스냅 정렬 */
  
  /* 모바일에서 카드 폭 조정하여 다음 카드 1/10 정도 보이도록 */
  @media (max-width: 768px) {
    flex: 0 0 85vw;
    width: 85vw;
    scroll-snap-align: center; /* 모바일에서는 중앙 정렬 */
  }
`;

const EmptyCategory = styled.div`
  flex: 0 0 320px;
  width: 320px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.palette.mode === 'dark' ? '#2e2e2e' : '#f9f9f9'};
  border-radius: 16px;
  border: 2px dashed ${props => props.theme.palette.mode === 'dark' ? '#555' : '#ddd'};
`;

// Home 컴포넌트를 ErrorBoundary로 감싸서 export
const SafeHome = () => {
  return (
    <ErrorBoundary fallback={({ error, resetError }) => (
      <PageContainer>
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom color="error">
            Oops! Something went wrong in Home
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            We're sorry for the inconvenience. Please try refreshing the page.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="contained" onClick={resetError}>
              Try Again
            </Button>
            <Button variant="outlined" onClick={() => window.location.href = '/'}>
              Go Home
            </Button>
          </Box>
          {import.meta.env.DEV && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="caption" color="error">
                Dev Error: {error?.message}
              </Typography>
            </Box>
          )}
        </Box>
      </PageContainer>
    )}>
      <Home />
    </ErrorBoundary>
  );
};

export default SafeHome;