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
import AdCard from '../components/AdCard';
import SimpleSEO from '../components/SimpleSEO';
import HomeSocialMeta from '../components/HomeSocialMeta';
import { designTokens, getColor, getBorderRadius, getShadow } from '../utils/designTokens';
import { useIsMobile, ResponsiveGrid } from '../components/ResponsiveHelpers';
import { useAdInjector } from '../hooks/useAdInjector';
import { getCategoryPageUrl, isValidCategory } from '../utils/categoryUtils';

const CategoryDisplay = ({ category, articles, navigate }) => {
  // 기사가 있을 때만 광고 표시
  const hasContent = articles && articles.length > 0;
  const { itemsWithAds } = useAdInjector(hasContent ? articles : []);

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
          {articles.length > 0 ? itemsWithAds.map(item => {
            if (item.type === 'ad') {
              return (
                <ArticleCardWrapper key={item.id}>
                  <AdCard 
                    adSlot={item.adSlot || 'articleBanner'}
                    minHeight="360px"
                    showLabel={true}
                  />
                </ArticleCardWrapper>
              );
            }
            return <ArticleCardWrapper key={item.id}><ArticleCard {...item} navigate={navigate} /></ArticleCardWrapper>;
          }) : (
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
  
  // Context가 null인 경우 기본값 설정
  const { 
    loading = true, 
    error = null, 
    categories: contextCategories = [],
    getRecentArticles = () => [], 
    getPopularArticles = () => [], 
    getArticlesByCategory = () => [], 
    refreshArticles = () => {}
  } = articlesContext || {};

  // 카테고리 동기화
  const categories = Array.isArray(contextCategories) && contextCategories.length > 0 
    ? contextCategories 
    : localCategories;

  // 카테고리 변경 감지 및 동기화
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

  // Load category data from context with proper guards
  useEffect(() => {
    const loadCategoryData = async () => {
      try {
        setHomeError(null);
        
        if (!loading && Array.isArray(categories)) {
          const categoryData = {};

          // 안전한 기사 데이터 로드
          if (getRecentArticles && typeof getRecentArticles === 'function') {
            categoryData.recent = getRecentArticles(10) || [];
          }
          
          if (getPopularArticles && typeof getPopularArticles === 'function') {
            categoryData.popular = getPopularArticles(10) || [];
          }

          categories.forEach((category) => {
            if (category && category.type === 'category' && category.id && category.name) {
              if (getArticlesByCategory && typeof getArticlesByCategory === 'function') {
                categoryData[category.id] = getArticlesByCategory(category.name, 5) || [];
              }
            }
          });

          setAllNewsData(categoryData);
        }
      } catch (error) {
        console.error('🚨 Home 컴포넌트 데이터 로드 오류:', error);
        setHomeError(error.message || 'Failed to load home data');
        setAllNewsData({});
      }
    };

    loadCategoryData();
  }, [loading, getRecentArticles, getPopularArticles, getArticlesByCategory, categories]);
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
            {Array.isArray(categories) && categories.map((category) => (
              <Tab 
                key={category?.id || 'unknown'} 
                label={category?.name || 'Unknown'}
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
        {(error || homeError) && (
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
                Failed to load news: {error || homeError}
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
                {Array.isArray(notices) && notices.map((notice, index) => {
                  if (!notice) return null;
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

            {Array.isArray(categories) && categories.map((category) => {
              if (!category || !category.id || !category.name) return null;
              const articles = allNewsData[category.id] || [];
              return <CategoryDisplay key={category.id} category={category} articles={articles} navigate={navigate} />;
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
  
  /* 모바일에서 스크롤 스냅 적용 */
  @media (max-width: 768px) {
    scroll-snap-type: x mandatory;
    padding-left: 2vw; /* 여백 조정 */
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
  
  /* 모바일에서 카드 폭 조정하여 다음 카드 1/10 정도 보이도록 */
  @media (max-width: 768px) {
    flex: 0 0 85vw;
    width: 85vw;
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

export default Home;