import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { 
  useMediaQuery, useTheme, Select, FormControl, MenuItem, Typography, Alert,
  InputLabel
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useParams, useNavigate } from 'react-router-dom';
import { useArticles } from '../contexts/ArticlesContext';
import { findCategoryBySlug, isValidCategory } from '../utils/categoryUtils';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import PageContainer from '../components/PageContainer';
import VerticalArticleList from '../components/VerticalArticleList';
import ArticleCard from '../components/ArticleCard';
import { AdCard } from '../components/ads';
import SimpleSEO from '../components/SimpleSEO';
import CategorySocialMeta from '../components/CategorySocialMeta';
import { ArticleListSkeleton } from '../components/LoadingComponents';
import { useAdInjector } from '../hooks/useAdInjector';
import { designTokens } from '../utils/designTokens';

// 카테고리별 이모지 매핑
const getCategoryEmoji = (categoryName) => {
  const emojiMap = {
    'Technology': '💻',
    'Science': '🔬',
    'Business': '💼',
    'Culture': '🎨',
    'Society': '🏛️',
    'Politics': '🗣️',
    'Sports': '⚽',
    'Health': '🏥',
    'Entertainment': '🎬'
  };
  return emojiMap[categoryName] || '📰';
};

const CategoryPage = () => {
  const navigate = useNavigate();
  const { categorySlug } = useParams();
  const articlesContext = useArticles();
  const { 
    categories = [], 
    getArticlesByCategory = () => [], 
    loading = true, 
    error = null, 
    refreshArticles = () => Promise.resolve() 
  } = articlesContext || {};
  const isMobile = useMediaQuery('(max-width: 768px)');
  
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

  // 데스크톱용 광고 삽입 (5번째마다)
  const { itemsWithAds } = useAdInjector(sortedArticles);

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
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <h3>Category Not Found</h3>
          <p>The category "{categorySlug}" doesn't exist or has been removed.</p>
          <button onClick={() => navigate('/')}>Go to Home</button>
        </div>
      </ContentContainer>
    );
  }

  return (
    <>
      {/* SEO 메타데이터 */}
      <SimpleSEO 
        category={currentCategory}
      />
      
      {/* 카테고리 소셜 메타데이터 */}
      <CategorySocialMeta category={currentCategory} />
      
      <MobileNavigation />
      <MobileContentWrapper>
        <ContentContainer>

          <CategorySection>
            <CategoryHeader>
              <CategoryTitleSection>
                <CategoryTitle>
                  {currentCategory.name} {getCategoryEmoji(currentCategory.name)}
                </CategoryTitle>
                <CategorySubtitle>
                  {sortedArticles.length} articles available
                </CategorySubtitle>
              </CategoryTitleSection>
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
            
            {/* 모바일에서는 수직 리스트, 데스크톱/태블릿에서는 그리드 */}
            {isMobile ? (
              <VerticalArticleList 
                articles={sortedArticles}
                injectEvery={3}
                navigate={navigate}
                showAds={true}
              />
            ) : (
              // 데스크톱/태블릿: 그리드 레이아웃 + 카드형 광고
              <ArticleGrid>
                {itemsWithAds.map((item) => {
                  if (item.type === 'ad') {
                    return (
                      <AdCard
                        key={item.id}
                        adSlot={item.adSlot || 'articleBanner'}
                        minHeight="360px"
                        showLabel={true}
                      />
                    );
                  }
                  return (
                    <ArticleCard key={item.id} {...item} navigate={navigate} />
                  );
                })}
              </ArticleGrid>
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
const CategoryTitle = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  color: #1976d2;
  margin: 0;
  @media (max-width: 768px) { font-size: 1.5rem; }
`;
const SortControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CategoryTitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const CategorySubtitle = styled.p`
  font-size: 0.875rem;
  color: ${designTokens.colors.text.secondary};
  margin: 0;
  font-weight: 400;
`;

const ArticleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: ${designTokens.spacing.md};
`;

export default CategoryPage;