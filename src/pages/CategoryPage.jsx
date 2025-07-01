import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { 
  useMediaQuery, useTheme, Select, FormControl, MenuItem, Typography, Alert,
  InputLabel, Breadcrumbs, Link, Chip
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import HomeIcon from '@mui/icons-material/Home';
import CategoryIcon from '@mui/icons-material/Category';
import { useNavigate, useParams } from 'react-router-dom';
import { useArticles } from '../contexts/ArticlesContext';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import ArticleCard from '../components/ArticleCard';
import { ArticleListSkeleton } from '../components/LoadingComponents';
import ErrorBoundary from '../components/ErrorBoundary';
import { findCategoryBySlug, isValidCategory } from '../utils/categoryUtils';

const CategoryPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { categorySlug } = useParams();
  
  const { 
    loading, 
    error, 
    getArticlesByCategory, 
    getAllArticles,
    refreshArticles 
  } = useArticles();
  
  const [sortBy, setSortBy] = useState('publishedDate');
  const [categories, setCategories] = useState([]);

  // 카테고리 데이터 로드
  useEffect(() => {
    const savedCategories = localStorage.getItem('marlang_categories');
    if (savedCategories) {
      try {
        const parsedCategories = JSON.parse(savedCategories);
        setCategories(parsedCategories);
      } catch (e) {
        console.error('Failed to parse categories:', e);
        setCategories([]);
      }
    }
  }, []);

  // 현재 카테고리 찾기
  const currentCategory = useMemo(() => {
    if (!categorySlug || !categories.length) return null;
    
    const category = findCategoryBySlug(categorySlug, categories);
    
    // 유효한 카테고리인지 확인
    if (!category || !isValidCategory(category)) {
      return null;
    }
    
    return category;
  }, [categorySlug, categories]);

  // 카테고리별 기사 데이터 가져오기
  const categoryArticles = useMemo(() => {
    if (!currentCategory) return [];
    
    try {
      // ArticlesContext에서 해당 카테고리의 모든 기사 가져오기
      return getArticlesByCategory(currentCategory.name, 50); // 최대 50개
    } catch (error) {
      console.error('Failed to get category articles:', error);
      return [];
    }
  }, [currentCategory, getArticlesByCategory]);

  // 정렬된 기사 목록
  const getSortedArticles = () => {
    if (!categoryArticles.length) return [];
    
    const articles = [...categoryArticles];
    
    switch (sortBy) {
      case 'publishedDate':
        return articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      case 'title':
        return articles.sort((a, b) => a.title.localeCompare(b.title));
      case 'oldest':
        return articles.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
      default:
        return articles;
    }
  };

  const sortedArticles = getSortedArticles();

  // 카테고리를 찾지 못한 경우
  if (!loading && (!currentCategory || !categorySlug)) {
    return (
      <>
        <MobileNavigation />
        <MobileContentWrapper>
          <ContentContainer>
            <ErrorState>
              <ErrorIcon>❌</ErrorIcon>
              <ErrorTitle>Category Not Found</ErrorTitle>
              <ErrorText>
                The category "{categorySlug}" doesn't exist or has been removed.
              </ErrorText>
              <ErrorActions>
                <button 
                  onClick={() => navigate('/')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Go to Home
                </button>
              </ErrorActions>
            </ErrorState>
          </ContentContainer>
        </MobileContentWrapper>
      </>
    );
  }

  // 로딩 중
  if (loading) {
    return (
      <>
        <MobileNavigation />
        <MobileContentWrapper>
          <ContentContainer>
            <ArticleListSkeleton count={6} />
          </ContentContainer>
        </MobileContentWrapper>
      </>
    );
  }

  // 에러 발생
  if (error) {
    return (
      <>
        <MobileNavigation />
        <MobileContentWrapper>
          <ContentContainer>
            <Alert 
              severity="error" 
              sx={{ mb: 2 }}
              action={
                <button 
                  onClick={() => {
                    refreshArticles();
                    window.location.reload();
                  }}
                  style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: 'transparent',
                    color: '#d32f2f',
                    border: '1px solid #d32f2f',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Retry
                </button>
              }
            >
              Failed to load articles: {error}
            </Alert>
          </ContentContainer>
        </MobileContentWrapper>
      </>
    );
  }

  return (
    <>
      <MobileNavigation />
      <MobileContentWrapper>
        <ContentContainer>
          {/* 브레드크럼 네비게이션 */}
          <BreadcrumbContainer>
            <Breadcrumbs separator="›" sx={{ mb: 2 }}>
              <Link 
                color="inherit" 
                href="/" 
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/');
                }}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Home
              </Link>
              <Typography 
                color="text.primary" 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  fontWeight: 600
                }}
              >
                <CategoryIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                {currentCategory?.name}
              </Typography>
            </Breadcrumbs>
          </BreadcrumbContainer>

          <CategorySection>
            <CategoryHeader>
              <HeaderLeft>
                <CategoryTitle>
                  {currentCategory?.name}
                  <Chip 
                    label={`${sortedArticles.length} articles`} 
                    size="small" 
                    sx={{ ml: 2 }}
                    color="primary"
                    variant="outlined"
                  />
                </CategoryTitle>
              </HeaderLeft>
              
              <SortControls>
                <FilterListIcon sx={{ mr: 1, color: '#666' }} />
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Sort by</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort by"
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <MenuItem value="publishedDate">Latest</MenuItem>
                    <MenuItem value="oldest">Oldest</MenuItem>
                    <MenuItem value="title">Title A-Z</MenuItem>
                  </Select>
                </FormControl>
              </SortControls>
            </CategoryHeader>
            
            {sortedArticles.length === 0 ? (
              <EmptyState>
                <EmptyIcon>📰</EmptyIcon>
                <EmptyTitle>No articles in {currentCategory?.name}</EmptyTitle>
                <EmptyText>
                  There are no articles available in this category yet.
                  Check back later for new content!
                </EmptyText>
                <EmptyActions>
                  <button 
                    onClick={() => navigate('/')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#1976d2',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    Browse All Articles
                  </button>
                </EmptyActions>
              </EmptyState>
            ) : (
              <ArticleGrid>
                {sortedArticles.map((article) => (
                  <ArticleGridItem key={article.id}>
                    <ArticleCard {...article} navigate={navigate} />
                  </ArticleGridItem>
                ))}
              </ArticleGrid>
            )}
          </CategorySection>
        </ContentContainer>
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

const BreadcrumbContainer = styled.div`
  margin: 1rem 0;
`;

const CategorySection = styled.div`
  margin-bottom: 3rem;
`;

const CategoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
`;

const CategoryTitle = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #1976d2;
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
    justify-content: center;
  }
`;

const SortControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const ArticleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-top: 24px;
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
  }
`;

const ArticleGridItem = styled.div`
  /* 그리드 아이템이므로 별도 스타일 없음 */
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f9f9f9;
  border-radius: 16px;
  border: 2px dashed #ddd;
  text-align: center;
  padding: 4rem 2rem;
  margin: 2rem 0;
  min-height: 300px;
`;

const ErrorState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rem 2rem;
  text-align: center;
  min-height: 400px;
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const ErrorIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const EmptyTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.5rem 0;
`;

const ErrorTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.5rem 0;
`;

const EmptyText = styled.p`
  font-size: 1rem;
  color: #666;
  margin: 0 0 2rem 0;
  max-width: 400px;
  line-height: 1.5;
`;

const ErrorText = styled.p`
  font-size: 1rem;
  color: #666;
  margin: 0 0 2rem 0;
  max-width: 500px;
  line-height: 1.5;
`;

const EmptyActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
`;

const ErrorActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
`;

export default CategoryPage; 