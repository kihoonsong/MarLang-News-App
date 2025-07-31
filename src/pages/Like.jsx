import React, { useState, useEffect, useRef, useMemo } from 'react';
import styled from 'styled-components';
import { 
  useMediaQuery, useTheme, Button, Select, FormControl, MenuItem, Chip, Typography, Alert,
  InputLabel, CircularProgress
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useArticles } from '../contexts/ArticlesContext';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import ArticleCard from '../components/ArticleCard';
import { AdCard } from '../components/ads';
import { useAdInjector } from '../hooks/useAdInjector';
import { designTokens } from '../utils/designTokens';

const Like = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, isAuthenticated, signInWithGoogle } = useAuth() || {};
  const { likedArticles } = useData();
  const articlesContext = useArticles();
  const { getArticleById = () => null } = articlesContext || {};
  
  const [sortBy, setSortBy] = useState('dateLiked');
  const [refreshKey, setRefreshKey] = useState(0);
  const isNavigatingRef = useRef(false);

  // 페이지네이션 상태 추가
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = isMobile ? 5 : 10; // 모바일 5개, 데스크톱 10개

  // 좋아요 상태 변경 감지
  useEffect(() => {
    const handleLikeUpdate = (event) => {
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('likeUpdated', handleLikeUpdate);
    
    return () => {
      window.removeEventListener('likeUpdated', handleLikeUpdate);
    };
  }, []);

  // 페이지 이동 감지 및 Observer 정리
  useEffect(() => {
    const handleBeforeUnload = () => {
      isNavigatingRef.current = true;
    };

    const handlePopState = () => {
      isNavigatingRef.current = true;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // 좋아요한 기사 데이터 가져오기 - ArticlesContext와 병합
  const getLikedArticlesData = () => {
    if (!likedArticles || likedArticles.length === 0) return [];
    
    return likedArticles.map(likedItem => {
      // ArticlesContext에서 최신 기사 데이터 가져오기
      const originalArticle = getArticleById ? getArticleById(likedItem.id || likedItem.articleId) : null;
      
      // 원본 기사 데이터가 있으면 그것을 우선 사용, 없으면 저장된 데이터 사용
      return {
        id: likedItem.id || likedItem.articleId,
        title: originalArticle?.title || likedItem.title,
        summary: originalArticle?.summary || originalArticle?.description || likedItem.summary || 'Read this interesting article for more details.',
        image: originalArticle?.image || likedItem.image,
        category: originalArticle?.category || likedItem.category,
        publishedAt: originalArticle?.publishedAt || likedItem.publishedAt || likedItem.likedAt,
        likedAt: likedItem.likedAt || new Date().toISOString()
    };
  });
  };

  // 정렬된 기사 목록 가져오기
  const getSortedArticles = () => {
    const articles = getLikedArticlesData();
    
    switch (sortBy) {
      case 'dateLiked':
        return articles.sort((a, b) => new Date(b.likedAt) - new Date(a.likedAt));
      case 'publishedDate':
        return articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      case 'title':
        return articles.sort((a, b) => a.title.localeCompare(b.title));
      case 'category':
        return articles.sort((a, b) => a.category.localeCompare(b.category));
      default:
        return articles;
    }
  };

  // likedArticles 객체가 렌더마다 새 참조가 되어도 길이가 변하지 않으면 무한 재계산을 방지하기 위해 length만 의존성으로 사용
  const sortedArticles = useMemo(() => getSortedArticles(), [likedArticles, sortBy, refreshKey]);

  // 페이지네이션 계산
  const totalArticles = sortedArticles.length;
  const totalPages = Math.ceil(totalArticles / articlesPerPage);
  const startIndex = (currentPage - 1) * articlesPerPage;
  const endIndex = startIndex + articlesPerPage;
  const currentPageArticles = sortedArticles.slice(startIndex, endIndex);

  // 현재 페이지 기사들에 광고 주입
  const hasContent = isAuthenticated && currentPageArticles && currentPageArticles.length > 0;
  const { itemsWithAds: currentPageItems } = useAdInjector(hasContent ? currentPageArticles : []);

  // 페이지 변경 함수
  const handlePageChange = (page, event) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    setCurrentPage(page);
    // 페이지 변경 시 스크롤을 맨 위로 이동
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 화면 크기 변경 시 페이지 범위 조정
  useEffect(() => {
    const newTotalPages = Math.ceil(totalArticles / articlesPerPage);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(1);
    }
  }, [isMobile, totalArticles, articlesPerPage, currentPage]);

  // 정렬 변경 시에만 페이지를 1로 리셋하는 useRef 추가
  const prevSortBy = useRef(sortBy);
  
  useEffect(() => {
    // 정렬이 변경된 경우에만 첫 페이지로 이동
    if (prevSortBy.current !== sortBy) {
      setCurrentPage(1);
      prevSortBy.current = sortBy;
    }
  }, [sortBy]);

  // 안전한 네비게이션 함수
  const safeNavigate = (path) => {
    isNavigatingRef.current = true;
    navigate(path);
  };

  // 로그인하지 않은 경우
  if (!isAuthenticated) {
    return (
      <>
        <MobileNavigation />
        <MobileContentWrapper>
          <ContentContainer>
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
              <div style={{ marginBottom: '3rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❤️</div>
                <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#333', margin: '0 0 0.5rem 0' }}>좋아요한 기사</h2>
                <p style={{ fontSize: '1.1rem', color: '#666', margin: '0' }}>관심 있는 기사를 모아보는 개인 컬렉션</p>
              </div>
              
              <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                  <div style={{ padding: '1.5rem', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e9ecef' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔖</div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: '0 0 0.5rem 0', color: '#333' }}>기사 저장</h3>
                    <p style={{ fontSize: '0.9rem', color: '#666', margin: '0' }}>흥미로운 기사를 좋아요로 저장하고 나중에 다시 읽어보세요</p>
                  </div>
                  
                  <div style={{ padding: '1.5rem', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e9ecef' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📚</div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: '0 0 0.5rem 0', color: '#333' }}>개인 컬렉션</h3>
                    <p style={{ fontSize: '0.9rem', color: '#666', margin: '0' }}>저장한 기사들을 카테고리별로 정리하고 체계적으로 관리하세요</p>
                  </div>
                  
                  <div style={{ padding: '1.5rem', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e9ecef' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: '0 0 0.5rem 0', color: '#333' }}>빠른 검색</h3>
                    <p style={{ fontSize: '0.9rem', color: '#666', margin: '0' }}>저장한 기사들을 제목, 카테고리, 날짜별로 쉽게 찾아보세요</p>
                  </div>
                  
                  <div style={{ padding: '1.5rem', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e9ecef' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📱</div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: '0 0 0.5rem 0', color: '#333' }}>언제든 접근</h3>
                    <p style={{ fontSize: '0.9rem', color: '#666', margin: '0' }}>모바일과 데스크톱에서 언제든지 저장한 기사에 접근할 수 있습니다</p>
                  </div>
                </div>
                
                <div style={{ background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem' }}>
                  <p style={{ fontSize: '1rem', color: '#856404', margin: '0 0 1rem 0' }}>
                    <strong>좋아요 기능을 사용하려면 로그인이 필요합니다</strong>
                  </p>
                  <p style={{ fontSize: '0.9rem', color: '#856404', margin: '0' }}>
                    로그인하면 기사를 좋아요로 저장하고 개인 컬렉션을 만들 수 있습니다.
                  </p>
                </div>
                
                <Button
                  variant="contained"
                  onClick={signInWithGoogle}
                  sx={{
                    backgroundColor: '#4285f4',
                    color: 'white',
                    padding: '12px 24px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    borderRadius: '8px',
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: '#3367d6'
                    }
                  }}
                >
                  Google로 로그인하기
                </Button>
              </div>
            </div>
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
          <CategorySection>
            <CategoryHeader>
              <div>
                {/* 빈 공간 */}
              </div>
              
              <SortControls>
                <FilterListIcon sx={{ mr: 1, color: '#666' }} />
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Sort by</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort by"
                    onChange={(e) => setSortBy(e.target.value)}
                >
                    <MenuItem value="dateLiked">Date Liked</MenuItem>
                    <MenuItem value="publishedDate">Published</MenuItem>
                    <MenuItem value="title">Title A-Z</MenuItem>
                    <MenuItem value="category">Category</MenuItem>
                  </Select>
                </FormControl>
              </SortControls>
            </CategoryHeader>
          
          {sortedArticles.length === 0 ? (
            <EmptyState>
                <EmptyIcon>💭</EmptyIcon>
                <EmptyText>No liked articles yet</EmptyText>
                <EmptySubtext>Like articles while reading to save them here!</EmptySubtext>
            </EmptyState>
          ) : (
              <>
                {/* 페이지네이션 적용된 기사 목록 */}
                <ArticleGrid>
                  {currentPageItems.map((item, index) => {
                    if (item.type === 'ad') {
                      return (
                        <ArticleGridItem key={item.id}>
                          <AdCard 
                            adSlot={item.adSlot || 'articleBanner'}
                            minHeight="360px"
                            showLabel={true}
                          />
                        </ArticleGridItem>
                      );
                    }
                    
                    return (
                      <ArticleGridItem key={item.id}>
                        <ArticleCard {...item} navigate={safeNavigate} />
                      </ArticleGridItem>
                    );
                  })}
                </ArticleGrid>
                
                {/* 페이지네이션 */}
                {isAuthenticated && totalArticles > 0 && totalPages > 1 && (
                  <PaginationContainer>
                    <PaginationInfo>
                      Showing {startIndex + 1}-{Math.min(endIndex, totalArticles)} of {totalArticles} articles (Page {currentPage} of {totalPages})
                    </PaginationInfo>
                    <PaginationControls>
                      <PageButton 
                        onClick={(e) => handlePageChange(currentPage - 1, e)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </PageButton>
                      
                      {[...Array(totalPages)].map((_, index) => {
                        const pageNum = index + 1;
                        const isCurrentPage = pageNum === currentPage;
                        
                        if (pageNum <= 3 || Math.abs(pageNum - currentPage) <= 1 || pageNum === totalPages) {
                          return (
                            <PageNumber
                              key={pageNum}
                              onClick={(e) => handlePageChange(pageNum, e)}
                              $isActive={isCurrentPage}
                            >
                              {pageNum}
                            </PageNumber>
                          );
                        } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                          return <PageEllipsis key={pageNum}>...</PageEllipsis>;
                        }
                        return null;
                      })}
                      
                      <PageButton 
                        onClick={(e) => handlePageChange(currentPage + 1, e)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </PageButton>
                    </PaginationControls>
                  </PaginationContainer>
                )}
              </>
          )}
          </CategorySection>
        </ContentContainer>
      </MobileContentWrapper>
    </>
  );
};

// 홈 페이지와 완전히 동일한 스타일드 컴포넌트들
const ContentContainer = styled.div`
  padding: 0 1rem 2rem 1rem;
  
  @media (min-width: 768px) {
    padding: 0 2rem 2rem 2rem;
  }
`;

const CategorySection = styled.div`
  margin-bottom: 3rem;
  scroll-margin-top: 80px;
`;

const CategoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const SortControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ArticleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const ArticleGridItem = styled.div`
  /* 이 Wrapper는 이제 그리드 아이템 역할을 하므로 별도 스타일이 필요 없습니다. */
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
  grid-column: 1 / -1; /* 그리드 전체 너비 차지 */
`;

const EmptyAuthState = styled.div`
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

const EmptyText = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.5rem 0;
`;

const EmptySubtext = styled.p`
  font-size: 1rem;
  color: #666;
  margin: 0;
  max-width: 400px;
`;

// 페이지네이션 관련 스타일드 컴포넌트들
const PaginationContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1rem;
`;

const PaginationInfo = styled.div`
  color: #666;
  font-size: 0.9rem;
  text-align: center;
`;

const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const PageButton = styled.button`
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  color: #333;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: #f5f5f5;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageNumber = styled.button`
  padding: 8px 12px;
  border: 1px solid #ddd;
  background: ${props => props.$isActive ? '#007bff' : 'white'};
  color: ${props => props.$isActive ? 'white' : '#333'};
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: ${props => props.$isActive ? '#0056b3' : '#f5f5f5'};
  }
`;

const PageEllipsis = styled.span`
  padding: 8px 4px;
  color: #666;
`;

export default Like; 