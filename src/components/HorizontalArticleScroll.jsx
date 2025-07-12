import React, { useRef, useState, useEffect } from 'react';
import styled from 'styled-components';
import { useMediaQuery } from '@mui/material';
import ArticleCard from './ArticleCard';
import AdCard from './AdCard';
import { designTokens } from '../utils/designTokens';
import { useAdInjector } from '../hooks/useAdInjector';

const HorizontalArticleScroll = ({ 
  articles = [], 
  navigate,
  showAds = true,
  cardWidth = "85vw", // 카드 폭 커스터마이징 가능
  autoPlay = true,
  delay = 3000,       // ms (기본값 3초로 변경)
  pauseAfterTouch = 3000
}) => {
  // 광고 삽입 (5번째마다)
  const { itemsWithAds } = useAdInjector(showAds ? articles : []);
  
  const finalItems = showAds ? itemsWithAds : articles;
  
  // 무한 루프를 위한 아이템 배열 생성 (첫 번째와 마지막 아이템 복제)
  const infiniteItems = finalItems.length > 1 ? [
    { ...finalItems[finalItems.length - 1], id: `clone-last-${finalItems[finalItems.length - 1].id}` },
    ...finalItems,
    { ...finalItems[0], id: `clone-first-${finalItems[0].id}` }
  ] : finalItems;
  
  // 자동 슬라이드 관련 상태 및 참조
  const containerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(finalItems.length > 1 ? 1 : 0); // 실제 첫 번째 아이템부터 시작
  const timerRef = useRef(null);
  const isVisibleRef = useRef(true);
  const isTransitioning = useRef(false);
  
  // 접근성: prefers-reduced-motion 사용자는 자동 슬라이드 비활성화
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  // 자동 슬라이드 시작 함수
  const startAutoPlay = () => {
    if (!autoPlay || prefersReducedMotion || finalItems.length <= 1) return;
    
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (isVisibleRef.current && !isTransitioning.current) {
        setCurrentIndex((prev) => prev + 1);
      }
    }, delay);
  };

  // 자동 슬라이드 일시 중지 함수
  const pauseAutoPlay = () => {
    clearInterval(timerRef.current);
    // pauseAfterTouch 시간 후 다시 재생
    timerRef.current = setTimeout(startAutoPlay, pauseAfterTouch);
  };

  // 인덱스 변경 시 실제 스크롤 수행
  useEffect(() => {
    const container = containerRef.current;
    if (!container || finalItems.length === 0) return;
    
    const cardWidth = container.children[0]?.offsetWidth || 0;
    const gap = parseInt(getComputedStyle(container).gap) || 0;
    const scrollLeft = currentIndex * (cardWidth + gap);
    
    isTransitioning.current = true;
    
    container.scrollTo({
      left: scrollLeft,
      behavior: 'smooth'
    });

    // 무한 루프 처리
    if (finalItems.length > 1) {
      const handleTransitionEnd = () => {
        if (currentIndex === 0) {
          // 복제된 마지막 아이템에서 실제 마지막 아이템으로 점프
          container.scrollTo({
            left: finalItems.length * (cardWidth + gap),
            behavior: 'auto'
          });
          setCurrentIndex(finalItems.length);
        } else if (currentIndex === infiniteItems.length - 1) {
          // 복제된 첫 번째 아이템에서 실제 첫 번째 아이템으로 점프
          container.scrollTo({
            left: (cardWidth + gap),
            behavior: 'auto'
          });
          setCurrentIndex(1);
        }
        isTransitioning.current = false;
      };

      // 스크롤 완료 후 무한 루프 처리
      setTimeout(handleTransitionEnd, 300);
    } else {
      setTimeout(() => {
        isTransitioning.current = false;
      }, 300);
    }
  }, [currentIndex, finalItems.length, infiniteItems.length]);

  // 자동 재생 시작/정지 관리
  useEffect(() => {
    startAutoPlay();
    return () => clearInterval(timerRef.current);
  }, [delay, autoPlay, prefersReducedMotion, finalItems.length]);

  // 사용자 상호작용 감지
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleUserInteraction = () => {
      pauseAutoPlay();
    };

    const events = ['touchstart', 'mousedown', 'wheel'];
    events.forEach(evt => container.addEventListener(evt, handleUserInteraction, { passive: true }));

    return () => {
      events.forEach(evt => container.removeEventListener(evt, handleUserInteraction));
    };
  }, [pauseAfterTouch]);

  // IntersectionObserver로 화면에 보이는 상태 감지 (배터리 절약)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
        if (!entry.isIntersecting) {
          clearInterval(timerRef.current);
        } else if (autoPlay && !prefersReducedMotion) {
          startAutoPlay();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [autoPlay, prefersReducedMotion]);

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
      <ScrollContainer ref={containerRef}>
        {infiniteItems.map((item, index) => {
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