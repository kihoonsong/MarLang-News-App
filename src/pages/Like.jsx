import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  useMediaQuery, useTheme, Button, Select, FormControl, MenuItem, Chip, Typography, Alert,
  InputLabel
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useArticles } from '../contexts/ArticlesContext';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import ArticleCard from '../components/ArticleCard';
import { designTokens } from '../utils/designTokens';

const Like = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, isAuthenticated, signInWithGoogle } = useAuth() || {};
  const { likedArticles } = useData();
  const { getArticleById } = useArticles();
  
  const [sortBy, setSortBy] = useState('dateLiked');
  const [refreshKey, setRefreshKey] = useState(0);

  // 좋아요 상태 변경 감지
  useEffect(() => {
    const handleLikeUpdate = (event) => {
      console.log('좋아요 상태 변경 감지:', event.detail);
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('likeUpdated', handleLikeUpdate);
    
    return () => {
      window.removeEventListener('likeUpdated', handleLikeUpdate);
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

  const sortedArticles = getSortedArticles();

  // 디버깅 정보
  const debugInfo = {
    isAuthenticated,
    userId: user?.id,
    userName: user?.name,
    likedArticlesRaw: likedArticles,
    likedArticlesCount: likedArticles?.length || 0,
    sortedArticlesCount: sortedArticles?.length || 0,
    sortBy,
    firstArticle: sortedArticles[0] || null,
    refreshKey
  };
  
  console.log('🔍 Like 페이지 상세 디버깅:');
  console.log('📊 인증 상태:', debugInfo.isAuthenticated);
  console.log('👤 사용자:', debugInfo.userName, '(ID:', debugInfo.userId, ')');
  console.log('❤️ 원본 좋아요 데이터:', debugInfo.likedArticlesRaw);
  console.log('📝 좋아요 개수:', debugInfo.likedArticlesCount);
  console.log('📋 정렬된 기사 개수:', debugInfo.sortedArticlesCount);
  console.log('🔧 정렬 기준:', debugInfo.sortBy);
  
  // 각 기사별 상세 데이터 확인
  if (debugInfo.likedArticlesRaw && debugInfo.likedArticlesRaw.length > 0) {
    console.log('🔍 각 좋아요 기사 상세:');
    debugInfo.likedArticlesRaw.forEach((article, index) => {
      console.log(`📰 기사 ${index + 1}:`, {
        id: article.id,
        title: article.title,
        summary: article.summary,
        image: article.image,
        category: article.category,
        publishedAt: article.publishedAt,
        likedAt: article.likedAt
      });
    });
  }
  
  // 정렬된 기사 데이터도 확인
  if (sortedArticles && sortedArticles.length > 0) {
    console.log('🔍 정렬된 기사 상세:');
    sortedArticles.forEach((article, index) => {
      console.log(`📋 정렬된 기사 ${index + 1}:`, {
        id: article.id,
        title: article.title,
        summary: article.summary,
        image: article.image,
        category: article.category,
        publishedAt: article.publishedAt,
        likedAt: article.likedAt
      });
    });
  }

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
              
              <div style={{ display: 'grid', gap: '2rem', marginBottom: '3rem', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e9ecef' }}>
                  <div style={{ fontSize: '2rem', flexShrink: 0 }}>📖</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#333', margin: '0 0 0.5rem 0' }}>기사 북마크</h3>
                    <p style={{ fontSize: '0.95rem', color: '#666', margin: '0', lineHeight: '1.5' }}>기사를 읽으며 마음에 드는 내용에 좋아요를 눌러 나만의 컬렉션을 만들 수 있습니다</p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e9ecef' }}>
                  <div style={{ fontSize: '2rem', flexShrink: 0 }}>🔄</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#333', margin: '0 0 0.5rem 0' }}>나중에 읽기</h3>
                    <p style={{ fontSize: '0.95rem', color: '#666', margin: '0', lineHeight: '1.5' }}>지금 당장 읽기 어려운 기사들을 저장해두고 나중에 편리하게 찾아볼 수 있습니다</p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e9ecef' }}>
                  <div style={{ fontSize: '2rem', flexShrink: 0 }}>🏷️</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#333', margin: '0 0 0.5rem 0' }}>스마트 정렬</h3>
                    <p style={{ fontSize: '0.95rem', color: '#666', margin: '0', lineHeight: '1.5' }}>좋아요한 날짜, 기사 제목, 카테고리별로 정렬하여 원하는 기사를 빠르게 찾을 수 있습니다</p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e9ecef' }}>
                  <div style={{ fontSize: '2rem', flexShrink: 0 }}>📊</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#333', margin: '0 0 0.5rem 0' }}>읽기 통계</h3>
                    <p style={{ fontSize: '0.95rem', color: '#666', margin: '0', lineHeight: '1.5' }}>좋아요한 기사 수와 선호하는 주제를 파악하여 개인 맞춤 추천을 받을 수 있습니다</p>
                  </div>
                </div>
              </div>
              
              <div style={{ padding: '2rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '16px', color: 'white', textAlign: 'center' }}>
                <p style={{ fontSize: '1.1rem', margin: '0 0 1.5rem 0', opacity: '0.9' }}>좋아요한 기사를 보려면 로그인이 필요합니다</p>
                <button 
                  onClick={signInWithGoogle}
                  style={{
                    background: 'white',
                    color: '#333',
                    border: 'none',
                    padding: '12px 32px',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = '#f8f9fa';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'white';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  Google로 로그인하기
                </button>
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
                    onChange={(e) => {
                      console.log('정렬 옵션 변경:', e.target.value);
                      setSortBy(e.target.value);
                  }}
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
              <ArticleGrid>
                {sortedArticles.map((article, index) => {
                  console.log(`🎨 렌더링 중: ${index + 1}번째 기사`, article.title);
                  console.log(`📝 summary 확인:`, article.summary);
                  
                  return (
                    <ArticleGridItem key={article.id}>
                      <ArticleCard {...article} navigate={navigate} />
                    </ArticleGridItem>
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

export default Like; 