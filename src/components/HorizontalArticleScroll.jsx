import React from 'react';
import styled from 'styled-components';
import ArticleCard from './ArticleCard';
import AdCard from './AdCard';
import { designTokens } from '../utils/designTokens';
import { useAdInjector } from '../hooks/useAdInjector';

const HorizontalArticleScroll = ({ 
  articles = [], 
  navigate,
  showAds = true,
  cardWidth = "85vw" // 카드 폭 커스터마이징 가능
}) => {
  // 광고 삽입 (5번째마다)
  const { itemsWithAds } = useAdInjector(showAds ? articles : []);
  
  const finalItems = showAds ? itemsWithAds : articles;

  if (!articles || articles.length === 0) {
    return (
      <EmptyState>
        <EmptyIcon>📅</EmptyIcon>
        <EmptyTitle>No articles for this date</EmptyTitle>
        <EmptyText>Try selecting a different date to see articles.</EmptyText>
      </EmptyState>
    );
  }

  return (
    <Container>
      <ScrollContainer>
        {finalItems.map((item, index) => {
          if (item.type === 'ad') {
            return (
              <CardWrapper key={item.id} $cardWidth={cardWidth}>
                <AdCard 
                  adSlot={item.adSlot || 'articleBanner'}
                  minHeight="360px"
                  showLabel={true}
                />
              </CardWrapper>
            );
          }
          
          return (
            <CardWrapper key={item.id} $cardWidth={cardWidth}>
              <ArticleCard {...item} navigate={navigate} />
            </CardWrapper>
          );
        })}
      </ScrollContainer>
    </Container>
  );
};

// 스타일드 컴포넌트들
const Container = styled.div`
  width: 100%;
  padding: 0; /* 홈 화면과 동일하게 패딩 제거 */
`;

const ScrollContainer = styled.div`
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  gap: 0.375rem; /* 홈 화면과 동일한 간격 */
  padding: 0.5rem 0;
  padding-left: 1rem; /* 홈 화면과 동일한 여백 */
  
  /* 스크롤바 스타일 */
  &::-webkit-scrollbar {
    height: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
    
    &:hover {
      background: #a8a8a8;
    }
  }
  
  /* 터치 디바이스 최적화 */
  @media (hover: none) and (pointer: coarse) {
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
  }
`;

const CardWrapper = styled.div`
  flex: 0 0 ${props => props.$cardWidth};
  width: ${props => props.$cardWidth};
  scroll-snap-align: start;
  
  /* 카드 내부 요소도 스냅에 맞춤 */
  > * {
    width: 100%;
    height: 100%;
  }
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
  max-width: 300px;
`;

export default HorizontalArticleScroll;