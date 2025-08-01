import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { 
  useMediaQuery, Select, FormControl, MenuItem,
  InputLabel
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useParams, useNavigate } from 'react-router-dom';
import { useArticles } from '../contexts/ArticlesContext';
import { findCategoryBySlug, isValidCategory } from '../utils/categoryUtils';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import VerticalArticleList from '../components/VerticalArticleList';
import ArticleCard from '../components/ArticleCard';
import { AdCard } from '../components/ads';
import SimpleSEO from '../components/SimpleSEO';
import CategorySocialMeta from '../components/CategorySocialMeta';
import { useAdInjector } from '../hooks/useAdInjector';
import { designTokens } from '../utils/designTokens';
import CategoryPageErrorBoundary from '../components/CategoryPageErrorBoundary';

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
  
  // 안전한 기본값 설정
  const [sortBy, setSortBy] = useState('publishedDate');
  const [pageError, setPageError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});
  
  // ArticlesContext 안전하게 사용
  const articlesContext = useArticles();
  const categories = articlesContext?.categories || [];
  const getArticlesByCategory = articlesContext?.getArticlesByCategory || (() => []);
  const loading = articlesContext?.loading ?? true;
  const error = articlesContext?.error || null;
  const refreshArticles = articlesContext?.refreshArticles || (() => Promise.resolve());
  
  const isMobile = useMediaQuery('(max-width: 768px)');

  // 실시간 디버깅 정보 수집
  useEffect(() => {
    const info = {
      timestamp: new Date().toISOString(),
      categorySlug,
      categoriesCount: categories?.length || 0,
      categoriesData: categories?.map(c => ({ id: c.id, name: c.name, type: c.type })) || [],
      loading,
      error: error?.toString() || null,
      pageError: pageError?.toString() || null,
      articlesContextExists: !!articlesContext,
      isMobile,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    setDebugInfo(info);
    
    if (import.meta.env.DEV) {
      console.log('🔍 CategoryPage 디버깅 정보:', info);
    }
  }, [categorySlug, categories, loading, error, pageError, articlesContext, isMobile]);

  // 안전한 카테고리 찾기
  const currentCategory = useMemo(() => {
    try {
      if (import.meta.env.DEV) {
        console.log('🔍 카테고리 찾기 시작:', {
          categorySlug,
          categoriesLength: categories?.length,
          loading,
          categories: categories?.map(c => ({ id: c?.id, name: c?.name }))
        });
      }

      if (!categorySlug) {
        setPageError('카테고리 슬러그가 없습니다.');
        return null;
      }
      
      if (!Array.isArray(categories) || categories.length === 0) {
        if (!loading) {
          setPageError('카테고리 목록을 불러올 수 없습니다.');
        }
        return null;
      }
      
      // findCategoryBySlug 함수 안전하게 호출
      let category = null;
      try {
        category = findCategoryBySlug(categorySlug, categories);
      } catch (findError) {
        console.error('findCategoryBySlug 오류:', findError);
        setPageError('카테고리 검색 중 오류가 발생했습니다.');
        return null;
      }
      
      if (!category) {
        setPageError(`카테고리 "${categorySlug}"를 찾을 수 없습니다.`);
        return null;
      }
      
      // isValidCategory 함수 안전하게 호출
      let isValid = false;
      try {
        isValid = isValidCategory(category);
      } catch (validError) {
        console.error('isValidCategory 오류:', validError);
        setPageError('카테고리 유효성 검사 중 오류가 발생했습니다.');
        return null;
      }
      
      if (!isValid) {
        setPageError(`"${categorySlug}"는 유효하지 않은 카테고리입니다.`);
        return null;
      }
      
      setPageError(null);
      return category;
    } catch (error) {
      console.error('🚨 카테고리 찾기 치명적 오류:', error);
      setPageError('카테고리를 처리하는 중 치명적 오류가 발생했습니다.');
      return null;
    }
  }, [categorySlug, categories, loading]);

  const categoryArticles = useMemo(() => {
    try {
      if (!currentCategory) return [];
      if (!getArticlesByCategory || typeof getArticlesByCategory !== 'function') {
        console.warn('getArticlesByCategory 함수가 사용할 수 없습니다.');
        return [];
      }
      return getArticlesByCategory(currentCategory.name, 50); // 최대 50개
    } catch (error) {
      console.error('카테고리 기사 로드 오류:', error);
      return [];
    }
  }, [currentCategory, getArticlesByCategory]);

  const sortedArticles = useMemo(() => {
    try {
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
    } catch (error) {
      console.error('기사 정렬 오류:', error);
      return categoryArticles;
    }
  }, [sortBy, categoryArticles]);

  // 데스크톱용 광고 삽입 (5번째마다)
  const { itemsWithAds } = useAdInjector(sortedArticles);

  // 모바일에서 카테고리 페이지 로딩 시 추가 디버깅
  useEffect(() => {
    if (isMobile && import.meta.env.DEV) {
      console.log('📱 CategoryPage 모바일 디버깅:', {
        categorySlug,
        categoriesLength: categories.length,
        loading,
        error,
        pageError,
        currentCategory: currentCategory?.name,
        articlesCount: categoryArticles.length
      });
    }
  }, [isMobile, categorySlug, categories.length, loading, error, pageError, currentCategory, categoryArticles.length]);

  // 로딩 상태 처리 (모바일 최적화)
  if (loading) {
    return (
      <>
        <MobileNavigation />
        <MobileContentWrapper>
          <ContentContainer>
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem',
              minHeight: '50vh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid #f3f3f3',
                  borderTop: '4px solid #1976d2',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              </div>
              <p style={{ color: '#666', fontSize: '0.9rem' }}>
                카테고리 로딩 중...
              </p>
              
              {/* 개발 환경에서 디버깅 정보 표시 */}
              {import.meta.env.DEV && (
                <details style={{ 
                  marginTop: '2rem', 
                  textAlign: 'left',
                  background: '#f8f9fa',
                  padding: '1rem',
                  borderRadius: '8px',
                  maxWidth: '400px',
                  width: '100%'
                }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                    디버깅 정보
                  </summary>
                  <pre style={{ 
                    fontSize: '0.8rem', 
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    marginTop: '0.5rem'
                  }}>
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </details>
              )}
              
              <style>
                {`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}
              </style>
            </div>
          </ContentContainer>
        </MobileContentWrapper>
      </>
    );
  }

  // 에러 상태 처리 (개선된 UI)
  if (error || pageError) {
    return (
      <>
        <MobileNavigation />
        <MobileContentWrapper>
          <ContentContainer>
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem',
              minHeight: '50vh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                maxWidth: '400px',
                width: '100%'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                <h3 style={{ color: '#dc3545', marginBottom: '1rem' }}>
                  카테고리 로딩 오류
                </h3>
                <p style={{ color: '#6c757d', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                  {pageError || error || '카테고리를 불러오는 중 오류가 발생했습니다.'}
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      setPageError(null);
                      refreshArticles();
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}
                  >
                    다시 시도
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}
                  >
                    홈으로 이동
                  </button>
                </div>
              </div>
            </div>
          </ContentContainer>
        </MobileContentWrapper>
      </>
    );
  }

  // 자동 리다이렉트 처리 (안전하게)
  useEffect(() => {
    if (!loading && !currentCategory) {
      const timer = setTimeout(() => {
        console.log('🔄 카테고리를 찾을 수 없어 홈으로 자동 리다이렉트');
        navigate('/', { replace: true });
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [loading, currentCategory, navigate]);

  // 카테고리를 찾을 수 없는 경우
  if (!loading && !currentCategory) {

    return (
      <>
        <MobileNavigation />
        <MobileContentWrapper>
          <ContentContainer>
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem',
              minHeight: '50vh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                maxWidth: '400px',
                width: '100%'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
                <h3 style={{ color: '#dc3545', marginBottom: '1rem' }}>
                  카테고리를 찾을 수 없습니다
                </h3>
                <p style={{ color: '#6c757d', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                  "{categorySlug}" 카테고리가 존재하지 않거나 삭제되었습니다.
                  <br />
                  <small style={{ color: '#999' }}>3초 후 자동으로 홈으로 이동합니다...</small>
                </p>
                
                {/* 개발 환경에서 디버깅 정보 표시 */}
                {import.meta.env.DEV && (
                  <details style={{ 
                    marginBottom: '1.5rem',
                    textAlign: 'left',
                    background: '#f8f9fa',
                    padding: '1rem',
                    borderRadius: '8px'
                  }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                      디버깅 정보
                    </summary>
                    <pre style={{ 
                      fontSize: '0.8rem', 
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap',
                      marginTop: '0.5rem'
                    }}>
                      {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                  </details>
                )}
                
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => navigate('/', { replace: true })}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}
                  >
                    지금 홈으로 이동
                  </button>
                  
                  <button
                    onClick={() => {
                      setPageError(null);
                      refreshArticles();
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}
                  >
                    다시 시도
                  </button>
                </div>
              </div>
            </div>
          </ContentContainer>
        </MobileContentWrapper>
      </>
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

// CategoryPage를 ErrorBoundary로 감싸서 export
const SafeCategoryPage = () => {
  const { categorySlug } = useParams();
  
  return (
    <CategoryPageErrorBoundary categorySlug={categorySlug}>
      <CategoryPage />
    </CategoryPageErrorBoundary>
  );
};

export default SafeCategoryPage;