import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { 
  useMediaQuery, useTheme, Select, FormControl, MenuItem, Typography, Alert,
  InputLabel, Breadcrumbs, Link, Chip
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import HomeIcon from '@mui/icons-material/Home';
import CategoryIcon from '@mui/icons-material/Category';
import { useParams, useNavigate } from 'react-router-dom';
import { useArticles } from '../contexts/ArticlesContext';
import { findCategoryBySlug, isValidCategory } from '../utils/categoryUtils';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import PageContainer from '../components/PageContainer';
import ArticleCard from '../components/ArticleCard';
import { ArticleListSkeleton } from '../components/LoadingComponents';
import { SidebarAdComponent, InlineAdComponent } from '../components/AdComponents';

const CategoryPage = () => {
  const navigate = useNavigate();
  const { categorySlug } = useParams();
  const { categories, getArticlesByCategory, loading, error, refreshArticles } = useArticles();
  
  const [sortBy, setSortBy] = useState('publishedDate');

  const currentCategory = useMemo(() => {
    if (!categorySlug || !categories.length) return null;
    return findCategoryBySlug(categorySlug, categories);
  }, [categorySlug, categories]);

  const categoryArticles = useMemo(() => {
    if (!currentCategory) return [];
    return getArticlesByCategory(currentCategory.name, 50); // 최대 50개
  }, [currentCategory, getArticlesByCategory]);

  const sortedArticles = useMemo(() => {
    if (!categoryArticles.length) return [];
    const articles = [...categoryArticles];
    switch (sortBy) {
      case 'publishedDate':
        return articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      case 'oldest':
        return articles.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
      case 'title':
        return articles.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return articles;
    }
  }, [sortBy, categoryArticles]);

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

  if (error) {
    return (
      <ContentContainer>
        <Alert severity="error" action={<button onClick={refreshArticles}>Retry</button>}>
          Failed to load articles: {error}
        </Alert>
      </ContentContainer>
    );
  }

  if (!currentCategory || !isValidCategory(currentCategory)) {
    return (
      <ContentContainer>
        <ErrorState>
          <ErrorIcon>❌</ErrorIcon>
          <ErrorTitle>Category Not Found</ErrorTitle>
          <ErrorText>The category "{categorySlug}" doesn't exist or has been removed.</ErrorText>
          <button onClick={() => navigate('/')}>Go to Home</button>
        </ErrorState>
      </ContentContainer>
    );
  }

  return (
    <>
      <MobileNavigation />
      <MobileContentWrapper>
        <ContentContainer>
          <BreadcrumbContainer>
            <Breadcrumbs separator="›">
              <Link href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
                <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Home
              </Link>
              <Typography color="text.primary">
                <CategoryIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                {currentCategory.name}
              </Typography>
            </Breadcrumbs>
          </BreadcrumbContainer>

          {/* 사이드바 광고 - 기사가 있을 때만 표시 */}
          <SidebarAdComponent hasContent={sortedArticles.length > 0} />

          <CategorySection>
            <CategoryHeader>
              <HeaderLeft>
                <CategoryTitle>
                  {currentCategory.name}
                  <Chip label={`${sortedArticles.length} articles`} size="small" sx={{ ml: 2 }} />
                </CategoryTitle>
              </HeaderLeft>
              <SortControls>
                <FilterListIcon sx={{ mr: 1, color: '#666' }} />
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Sort by</InputLabel>
                  <Select value={sortBy} label="Sort by" onChange={(e) => setSortBy(e.target.value)}>
                    <MenuItem value="publishedDate">Latest</MenuItem>
                    <MenuItem value="oldest">Oldest</MenuItem>
                    <MenuItem value="title">Title A-Z</MenuItem>
                  </Select>
                </FormControl>
              </SortControls>
            </CategoryHeader>
            
            {sortedArticles.length > 0 ? (
              <>
                {/* 기사가 있을 때만 광고 표시 */}
                <InlineAdComponent hasContent={true} />
                <ArticleGrid>
                  {sortedArticles.map((article) => (
                    <ArticleCard key={article.id} {...article} navigate={navigate} />
                  ))}
                </ArticleGrid>
              </>
            ) : (
              <>
                {/* 기사가 없을 때는 광고 표시 안함 */}
                <InlineAdComponent hasContent={false} />
                <EmptyState>
                  <EmptyIcon>📰</EmptyIcon>
                  <EmptyTitle>No articles in {currentCategory.name}</EmptyTitle>
                </EmptyState>
              </>
            )}
          </CategorySection>
        </ContentContainer>
      </MobileContentWrapper>
    </>
  );
};

// Styles
const ContentContainer = styled.div`
  padding: 0 1rem 2rem 1rem;
  @media (min-width: 768px) { padding: 0 2rem 2rem 2rem; }
`;
const BreadcrumbContainer = styled.div` margin: 1rem 0; `;
const CategorySection = styled.div` margin-bottom: 3rem; `;
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
const HeaderLeft = styled.div` display: flex; align-items: center; `;
const CategoryTitle = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  color: #1976d2;
  margin: 0;
  @media (max-width: 768px) { font-size: 1.5rem; }
`;
const SortControls = styled.div` display: flex; align-items: center; gap: 0.5rem; `;
const ArticleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;
const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
`;
const ErrorState = styled(EmptyState)``;
const EmptyIcon = styled.div` font-size: 4rem; margin-bottom: 1rem; `;
const ErrorIcon = styled(EmptyIcon)``;
const EmptyTitle = styled.h3` font-size: 1.25rem; font-weight: 600; `;
const ErrorTitle = styled.h2` font-size: 1.5rem; font-weight: 600; `;
const ErrorText = styled.p` color: #666; `;

export default CategoryPage;