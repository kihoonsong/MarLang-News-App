import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useArticles } from '../contexts/ArticlesContext';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import ArticleCard from '../components/ArticleCard';

// 간단한 카테고리 페이지 (오류 방지용)
const CategoryPageSimple = () => {
  const navigate = useNavigate();
  const { categorySlug } = useParams();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryName, setCategoryName] = useState('');

  // ArticlesContext 안전하게 사용
  const articlesContext = useArticles();

  useEffect(() => {
    const loadCategoryData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 카테고리 슬러그가 없으면 홈으로 리다이렉트
        if (!categorySlug) {
          navigate('/', { replace: true });
          return;
        }

        // ArticlesContext가 없으면 에러
        if (!articlesContext) {
          throw new Error('Articles context not available');
        }

        const { categories, getArticlesByCategory, loading: contextLoading } = articlesContext;

        // ArticlesContext가 아직 로딩 중이면 대기
        if (contextLoading) {
          console.log('⏳ ArticlesContext 로딩 중...');
          setError('데이터를 불러오는 중입니다...');
          // 5초 후 다시 시도
          setTimeout(() => {
            loadCategoryData();
          }, 1000);
          return;
        }

        // 카테고리 목록이 없으면 대기
        if (!categories || categories.length === 0) {
          console.log('⚠️ 카테고리 목록이 비어있음');
          setError('카테고리 목록을 불러오는 중입니다...');
          // 2초 후 다시 시도
          setTimeout(() => {
            loadCategoryData();
          }, 2000);
          return;
        }

        // 디버깅: 사용 가능한 카테고리 목록 출력
        console.log('🔍 사용 가능한 카테고리들:', categories.map(cat => ({
          id: cat?.id,
          name: cat?.name,
          type: cat?.type,
          slug: cat?.name ? cat.name.toLowerCase().replace(/\s+/g, '-') : 'no-name'
        })));
        console.log('🎯 찾고 있는 카테고리 슬러그:', categorySlug);

        // 카테고리 찾기 (더 관대한 방식)
        let foundCategory = null;
        
        // 1차: 정확한 매칭
        for (const cat of categories) {
          if (cat && cat.name) {
            const catSlug = cat.name.toLowerCase().replace(/\s+/g, '-');
            if (catSlug === categorySlug.toLowerCase()) {
              foundCategory = cat;
              console.log('✅ 정확 매칭 성공:', cat.name);
              break;
            }
          }
        }
        
        // 2차: 부분 매칭 (특수문자 제거)
        if (!foundCategory) {
          for (const cat of categories) {
            if (cat && cat.name) {
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
        
        // 3차: 포함 관계 매칭
        if (!foundCategory) {
          for (const cat of categories) {
            if (cat && cat.name) {
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

        // 카테고리를 찾지 못하면 홈으로 리다이렉트
        if (!foundCategory) {
          console.log('❌ 모든 매칭 실패. 사용 가능한 카테고리:', 
            categories.map(c => c?.name).filter(Boolean));
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 3000); // 3초로 연장
          setError(`"${categorySlug}" 카테고리를 찾을 수 없습니다. 3초 후 홈으로 이동합니다...`);
          return;
        }

        // 카테고리가 유효한지 확인 (간단한 방식)
        if (foundCategory.type !== 'category') {
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 2000);
          setError('유효하지 않은 카테고리입니다. 홈으로 이동합니다...');
          return;
        }

        setCategoryName(foundCategory.name);

        // 기사 가져오기
        if (getArticlesByCategory && typeof getArticlesByCategory === 'function') {
          const categoryArticles = getArticlesByCategory(foundCategory.name, 50);
          setArticles(Array.isArray(categoryArticles) ? categoryArticles : []);
        } else {
          setArticles([]);
        }

        setLoading(false);
      } catch (err) {
        console.error('카테고리 페이지 로딩 오류:', err);
        setError('카테고리를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
        
        // 3초 후 홈으로 리다이렉트
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      }
    };

    loadCategoryData();
  }, [categorySlug, articlesContext, navigate]);

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
              <button onClick={() => navigate('/')}>홈으로 이동</button>
            </ErrorContainer>
          </Container>
        </MobileContentWrapper>
      </>
    );
  }

  // 정상 렌더링
  return (
    <>
      <MobileNavigation />
      <MobileContentWrapper>
        <Container>
          <Header>
            <Title>{categoryName}</Title>
            <Subtitle>{articles.length}개의 기사</Subtitle>
          </Header>
          
          <ArticlesGrid>
            {articles.map((article) => (
              <ArticleCard 
                key={article.id} 
                {...article} 
                navigate={navigate} 
              />
            ))}
          </ArticlesGrid>
          
          {articles.length === 0 && (
            <EmptyState>
              <p>이 카테고리에는 아직 기사가 없습니다.</p>
            </EmptyState>
          )}
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
  }
  
  button {
    padding: 0.75rem 1.5rem;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
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

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #666;
`;

export default CategoryPageSimple;