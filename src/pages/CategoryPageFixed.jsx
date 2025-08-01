import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { 
  useMediaQuery, Select, FormControl, MenuItem, InputLabel
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useParams, useNavigate } from 'react-router-dom';
import { useArticles } from '../contexts/ArticlesContext';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import ArticleCard from '../components/ArticleCard';
import { AdCard } from '../components/ads';
import VerticalArticleList from '../components/VerticalArticleList';
import SimpleSEO from '../components/SimpleSEO';
import CategorySocialMeta from '../components/CategorySocialMeta';
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

// 완전히 수정된 카테고리 페이지
const CategoryPageFixed = () => {
  const navigate = useNavigate();
  const { categorySlug } = useParams();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [currentCategory, setCurrentCategory] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');
  const [sortBy, setSortBy] = useState('publishedDate');
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 20; // 페이지당 기사 수 (광고 포함)

  const isMobile = useMediaQuery('(max-width: 768px)');

  // ArticlesContext 안전하게 사용
  const articlesContext = useArticles();

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 10; // 최대 10번 재시도

    const loadCategoryData = async () => {
      try {
        console.log(`🔄 카테고리 로딩 시도 ${retryCount + 1}/${maxRetries}`);
        
        // 카테고리 슬러그가 없으면 홈으로 리다이렉트
        if (!categorySlug) {
          console.log('❌ 카테고리 슬러그가 없음');
          navigate('/', { replace: true });
          return;
        }

        // ArticlesContext가 없으면 재시도
        if (!articlesContext) {
          console.log('⚠️ ArticlesContext가 없음, 재시도...');
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(loadCategoryData, 1000);
            setDebugInfo(`ArticlesContext 로딩 중... (${retryCount}/${maxRetries})`);
            return;
          } else {
            throw new Error('ArticlesContext를 불러올 수 없습니다.');
          }
        }

        const { categories, getArticlesByCategory, loading: contextLoading } = articlesContext;

        // Context가 아직 로딩 중이면 재시도
        if (contextLoading) {
          console.log('⏳ Context 로딩 중, 재시도...');
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(loadCategoryData, 1000);
            setDebugInfo(`데이터 로딩 중... (${retryCount}/${maxRetries})`);
            return;
          }
        }

        // 카테고리 목록이 없으면 재시도
        if (!categories || categories.length === 0) {
          console.log('⚠️ 카테고리 목록이 비어있음, 재시도...');
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(loadCategoryData, 1000);
            setDebugInfo(`카테고리 목록 로딩 중... (${retryCount}/${maxRetries})`);
            return;
          } else {
            throw new Error('카테고리 목록을 불러올 수 없습니다.');
          }
        }

        // 디버깅: 사용 가능한 카테고리 목록 출력
        console.log('📋 사용 가능한 카테고리들:', categories.map(cat => ({
          id: cat?.id,
          name: cat?.name,
          type: cat?.type,
          slug: cat?.name ? cat.name.toLowerCase().replace(/\s+/g, '-') : 'no-name'
        })));
        console.log('🎯 찾고 있는 카테고리 슬러그:', categorySlug);

        // 카테고리 찾기 - 모든 가능한 방법 시도
        let foundCategory = null;
        
        // 방법 1: 정확한 slug 매칭
        for (const cat of categories) {
          if (cat && cat.name && cat.type === 'category') {
            const catSlug = cat.name.toLowerCase().replace(/\s+/g, '-');
            if (catSlug === categorySlug.toLowerCase()) {
              foundCategory = cat;
              console.log('✅ 정확 매칭 성공:', cat.name);
              break;
            }
          }
        }
        
        // 방법 2: 이름 직접 매칭 (대소문자 무시)
        if (!foundCategory) {
          for (const cat of categories) {
            if (cat && cat.name && cat.type === 'category') {
              if (cat.name.toLowerCase() === categorySlug.toLowerCase()) {
                foundCategory = cat;
                console.log('✅ 이름 직접 매칭 성공:', cat.name);
                break;
              }
            }
          }
        }
        
        // 방법 3: 부분 매칭 (특수문자 제거)
        if (!foundCategory) {
          for (const cat of categories) {
            if (cat && cat.name && cat.type === 'category') {
              const catName = cat.name.toLowerCase().replace(/[^a-z0-9]/g, '');
              const targetSlug = categorySlug.toLowerCase().replace(/[^a-z0-9]/g, '');
              if (catName === targetSlug) {
                foundCategory = cat;
                console.log('✅ 부분 매칭 성공:', cat.name);
                break;
              }
            }
          }
        }
        
        // 방법 4: 포함 관계 매칭
        if (!foundCategory) {
          for (const cat of categories) {
            if (cat && cat.name && cat.type === 'category') {
              const catName = cat.name.toLowerCase();
              const targetSlug = categorySlug.toLowerCase();
              if (catName.includes(targetSlug) || targetSlug.includes(catName)) {
                foundCategory = cat;
                console.log('✅ 포함 매칭 성공:', cat.name);
                break;
              }
            }
          }
        }

        // 방법 5: ID 기반 매칭 (마지막 수단)
        if (!foundCategory) {
          for (const cat of categories) {
            if (cat && cat.id && cat.type === 'category') {
              if (cat.id.toLowerCase() === categorySlug.toLowerCase()) {
                foundCategory = cat;
                console.log('✅ ID 매칭 성공:', cat.name);
                break;
              }
            }
          }
        }

        // 여전히 카테고리를 찾지 못하면
        if (!foundCategory) {
          console.log('❌ 모든 매칭 실패');
          console.log('사용 가능한 카테고리:', 
            categories.filter(c => c?.type === 'category').map(c => ({
              id: c.id,
              name: c.name,
              slug: c.name?.toLowerCase().replace(/\s+/g, '-')
            }))
          );
          
          setError(`"${categorySlug}" 카테고리를 찾을 수 없습니다. 5초 후 홈으로 이동합니다...`);
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 5000);
          setLoading(false);
          return;
        }

        console.log('🎉 카테고리 찾기 성공:', foundCategory);
        setCategoryName(foundCategory.name);
        setCurrentCategory(foundCategory);

        // 기사 가져오기 (더 많은 기사 로드)
        if (getArticlesByCategory && typeof getArticlesByCategory === 'function') {
          const categoryArticles = getArticlesByCategory(foundCategory.name, 100); // 더 많은 기사 로드
          console.log('📰 기사 개수:', categoryArticles?.length || 0);
          setArticles(Array.isArray(categoryArticles) ? categoryArticles : []);
        } else {
          console.log('⚠️ getArticlesByCategory 함수가 없음');
          setArticles([]);
        }

        setLoading(false);
        setError(null);
        setDebugInfo('');
        
      } catch (err) {
        console.error('🚨 카테고리 페이지 로딩 오류:', err);
        setError(`오류: ${err.message}`);
        setLoading(false);
        
        // 5초 후 홈으로 리다이렉트
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 5000);
      }
    };

    loadCategoryData();
  }, [categorySlug, navigate]); // articlesContext 의존성 제거

  // 정렬된 기사 목록
  const sortedArticles = useMemo(() => {
    if (!articles.length) return [];
    
    const sorted = [...articles];
    switch (sortBy) {
      case 'publishedDate':
        return sorted.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return sorted;
    }
  }, [articles, sortBy]);

  // 데스크톱용 광고 삽입 (5번째마다)
  const { itemsWithAds } = useAdInjector(sortedArticles);

  // 페이지네이션 계산
  const totalPages = Math.ceil(sortedArticles.length / articlesPerPage);
  const startIndex = (currentPage - 1) * articlesPerPage;
  const endIndex = startIndex + articlesPerPage;
  const currentArticles = sortedArticles.slice(startIndex, endIndex);

  // 모바일용 광고가 삽입된 현재 페이지 기사들
  const currentItemsWithAds = useMemo(() => {
    if (isMobile) {
      // 모바일에서는 5개마다 광고 삽입
      const result = [];
      currentArticles.forEach((article, index) => {
        result.push(article);
        if ((index + 1) % 5 === 0 && index < currentArticles.length - 1) {
          result.push({
            type: 'ad',
            id: `ad-${currentPage}-${index}`,
            adSlot: 'categoryMobile'
          });
        }
      });
      return result;
    } else {
      // 데스크톱에서는 useAdInjector 사용
      return itemsWithAds.slice(startIndex, endIndex);
    }
  }, [currentArticles, itemsWithAds, isMobile, currentPage, startIndex, endIndex]);

  // 로딩 중
  if (loading) {
    return (
      <>
        <MobileNavigation />
        <MobileContentWrapper>
          <Container>
            <LoadingContainer>
              <Spinner />
              <p>카테고리 로딩 중...</p>
              {debugInfo && <DebugInfo>{debugInfo}</DebugInfo>}
            </LoadingContainer>
          </Container>
        </MobileContentWrapper>
      </>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <>
        <MobileNavigation />
        <MobileContentWrapper>
          <Container>
            <ErrorContainer>
              <h2>오류 발생</h2>
              <p>{error}</p>
              <button onClick={() => navigate('/')}>지금 홈으로 이동</button>
            </ErrorContainer>
          </Container>
        </MobileContentWrapper>
      </>
    );
  }

  // 정상 렌더링
  return (
    <>
      {/* SEO 메타데이터 */}
      {currentCategory && <SimpleSEO category={currentCategory} />}
      
      {/* 카테고리 소셜 메타데이터 */}
      {currentCategory && <CategorySocialMeta category={currentCategory} />}
      
      <MobileNavigation />
      <MobileContentWrapper>
        <Container>
          <CategorySection>
            <CategoryHeader>
              <CategoryTitleSection>
                <CategoryTitle>
                  {categoryName} {getCategoryEmoji(categoryName)}
                </CategoryTitle>
                <CategorySubtitle>
                  {sortedArticles.length}개의 기사
                </CategorySubtitle>
              </CategoryTitleSection>
              
              <SortControls>
                <FilterListIcon sx={{ mr: 1, color: '#666' }} />
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>정렬</InputLabel>
                  <Select 
                    value={sortBy} 
                    label="정렬" 
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setCurrentPage(1); // 정렬 변경 시 첫 페이지로
                    }}
                  >
                    <MenuItem value="publishedDate">최신순</MenuItem>
                    <MenuItem value="oldest">오래된순</MenuItem>
                    <MenuItem value="title">제목순</MenuItem>
                  </Select>
                </FormControl>
              </SortControls>
            </CategoryHeader>

            {/* 모바일에서는 간단한 리스트, 데스크톱에서는 그리드 */}
            {isMobile ? (
              // 모바일: 간단한 기사 리스트 (광고 없이)
              <MobileArticlesList>
                {currentArticles.map((article, index) => (
                  <MobileArticleItem key={article.id}>
                    <ArticleCard {...article} navigate={navigate} />
                    {/* 5개마다 간단한 광고 */}
                    {(index + 1) % 5 === 0 && index < currentArticles.length - 1 && (
                      <MobileAdContainer>
                        <AdCard
                          adSlot="categoryMobile"
                          minHeight="200px"
                          showLabel={true}
                        />
                      </MobileAdContainer>
                    )}
                  </MobileArticleItem>
                ))}
              </MobileArticlesList>
            ) : (
              // 데스크톱: 그리드 레이아웃
              <ArticlesGrid>
                {currentItemsWithAds.map((item, index) => {
                  if (item.type === 'ad') {
                    return (
                      <AdCard
                        key={item.id}
                        adSlot={item.adSlot || 'categoryDesktop'}
                        minHeight="360px"
                        showLabel={true}
                      />
                    );
                  }
                  return (
                    <ArticleCard 
                      key={item.id} 
                      {...item} 
                      navigate={navigate} 
                    />
                  );
                })}
              </ArticlesGrid>
            )}

            {/* 페이지네이션 - 모바일에서는 간소화 */}
            {totalPages > 1 && (
              <PaginationContainer>
                {isMobile ? (
                  // 모바일: 간단한 페이지네이션
                  <>
                    <PaginationButton 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      ← 이전
                    </PaginationButton>
                    
                    <PageInfo>
                      {currentPage}/{totalPages}
                    </PageInfo>
                    
                    <PaginationButton 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      다음 →
                    </PaginationButton>
                  </>
                ) : (
                  // 데스크톱: 전체 페이지네이션
                  <>
                    <PaginationButton 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      이전
                    </PaginationButton>
                    
                    <PageInfo>
                      {currentPage} / {totalPages} 페이지
                    </PageInfo>
                    
                    <PaginationButton 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      다음
                    </PaginationButton>
                  </>
                )}
              </PaginationContainer>
            )}
            
            {articles.length === 0 && (
              <EmptyState>
                <p>이 카테고리에는 아직 기사가 없습니다.</p>
                <button onClick={() => navigate('/')}>홈으로 돌아가기</button>
              </EmptyState>
            )}
          </CategorySection>
        </Container>
      </MobileContentWrapper>
    </>
  );
};

// 스타일드 컴포넌트
const Container = styled.div`
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const DebugInfo = styled.p`
  color: #666;
  font-size: 0.9rem;
  margin-top: 1rem;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
  
  h2 {
    color: #dc3545;
    margin-bottom: 1rem;
  }
  
  p {
    margin-bottom: 2rem;
    color: #666;
    max-width: 400px;
    line-height: 1.5;
  }
  
  button {
    padding: 0.75rem 1.5rem;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    
    &:hover {
      background-color: #0056b3;
    }
  }
`;

const Header = styled.div`
  margin-bottom: 2rem;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #1976d2;
  margin-bottom: 0.5rem;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Subtitle = styled.p`
  color: #666;
  font-size: 1rem;
`;

const ArticlesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const MobileArticlesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MobileArticleItem = styled.div`
  width: 100%;
`;

const MobileAdContainer = styled.div`
  margin: 1rem 0;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
`;

const CategorySection = styled.div`
  margin-bottom: 3rem;
`;

const CategoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
`;

const CategoryTitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const CategoryTitle = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  color: #1976d2;
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
    text-align: center;
  }
`;

const CategorySubtitle = styled.p`
  font-size: 0.875rem;
  color: ${designTokens.colors.text.secondary};
  margin: 0;
  font-weight: 400;
  
  @media (max-width: 768px) {
    text-align: center;
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

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 3rem;
  padding: 2rem 0;
`;

const PaginationButton = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: ${props => props.disabled ? '#e9ecef' : '#007bff'};
  color: ${props => props.disabled ? '#6c757d' : 'white'};
  border: none;
  border-radius: 6px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  font-size: 1rem;
  transition: background-color 0.2s;
  
  &:hover:not(:disabled) {
    background-color: #0056b3;
  }
`;

const PageInfo = styled.span`
  font-size: 1rem;
  color: #666;
  font-weight: 500;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #666;
  
  p {
    margin-bottom: 2rem;
    font-size: 1.1rem;
  }
  
  button {
    padding: 0.75rem 1.5rem;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    
    &:hover {
      background-color: #0056b3;
    }
  }
`;

export default CategoryPageFixed;