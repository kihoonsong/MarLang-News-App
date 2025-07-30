import React from 'react';
import styled from 'styled-components';
import ArticleCard from './ArticleCard';
import { AdCard } from './ads';
import { designTokens } from '../utils/designTokens';
import { useVerticalAdInjector } from '../hooks/useAdInjector';

const VerticalArticleList = ({ 
  articles = [], 
  injectEvery = 3,
  navigate,
  showAds = true 
}) => {
  // 수직 광고 삽입 훅 사용
  const { itemsWithAds } = useVerticalAdInjector(
    showAds ? articles : [], 
    injectEvery
  );

  if (!articles || articles.length === 0) {
    return (
      <EmptyState>
        <EmptyIcon>📰</EmptyIcon>
        <EmptyTitle>No articles available</EmptyTitle>
        <EmptyText>Please check back later for new content.</EmptyText>
      </EmptyState>
    );
  }

  return (
    <Container>
      <ListContainer role="list">
        {itemsWithAds.map((item, _index) => {
          if (item.type === 'ad') {
            return (
              <AdItemWrapper key={item.id} role="listitem" aria-label="스폰서 콘텐츠">
                <AdCard 
                  adSlot={item.adSlot || 'inFeedBanner'}
                  minHeight="200px"
                  showLabel={true}
                />
              </AdItemWrapper>
            );
          }
          
          return (
            <ArticleItemWrapper key={item.id} role="listitem">
              <ArticleCard {...item} navigate={navigate} />
            </ArticleItemWrapper>
          );
        })}
      </ListContainer>
    </Container>
  );
};

// 스타일드 컴포넌트들
const Container = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${designTokens.spacing.sm};
  
  @media (min-width: ${designTokens.breakpoints.tablet}) {
    padding: 0 ${designTokens.spacing.lg};
  }
`;

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${designTokens.spacing.md};
  
  @media (min-width: ${designTokens.breakpoints.desktop}) {
    gap: ${designTokens.spacing.lg};
  }
`;

const ArticleItemWrapper = styled.div`
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
  
  /* 스크롤 마진 - 앵커 링크 대비 */
  scroll-margin-top: 80px;
`;

const AdItemWrapper = styled.div`
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
  
  /* 광고 영역 스크롤 마진 */
  scroll-margin-top: 80px;
  
  /* 광고 뷰어빌리티를 위한 최소 여백 */
  margin-top: ${designTokens.spacing.sm};
  margin-bottom: ${designTokens.spacing.sm};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: ${designTokens.spacing.xxl};
  min-height: 300px;
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: ${designTokens.spacing.md};
  opacity: 0.5;
`;

const EmptyTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 ${designTokens.spacing.sm} 0;
  color: ${designTokens.colors.text.primary};
`;

const EmptyText = styled.p`
  color: ${designTokens.colors.text.secondary};
  margin: 0;
  max-width: 400px;
`;

export default VerticalArticleList;