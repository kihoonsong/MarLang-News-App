import React from 'react';
import styled from 'styled-components';
import AdCard from './AdCard';
import { useAdPlacement } from '../hooks/useAdInjector';

// 사이드바 광고 컴포넌트
const SidebarAd = styled.div`
  width: 100%;
  max-width: 300px;
  margin: 1rem 0;
  
  @media (max-width: 768px) {
    display: none; /* 모바일에서는 숨김 */
  }
`;

export const SidebarAdComponent = ({ hasContent = false }) => {
  const { shouldShowAd } = useAdPlacement('sidebar', hasContent);
  
  if (!shouldShowAd) return null;
  
  return (
    <SidebarAd>
      <AdCard 
        adSlot="sidebar"
        minHeight="250px"
        showLabel={true}
      />
    </SidebarAd>
  );
};

// 검색 결과 광고 컴포넌트
const SearchResultAd = styled.div`
  width: 100%;
  margin: 1rem 0;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
`;

export const SearchResultAdComponent = ({ hasContent = false }) => {
  const { shouldShowAd } = useAdPlacement('searchResults', hasContent);
  
  if (!shouldShowAd) return null;
  
  return (
    <SearchResultAd>
      <AdCard 
        adSlot="searchResults"
        minHeight="120px"
        showLabel={true}
      />
    </SearchResultAd>
  );
};

// 기사 상세 페이지 광고 컴포넌트
const ArticleDetailAd = styled.div`
  width: 100%;
  margin: 2rem 0;
  padding: 1rem;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

export const ArticleDetailAdComponent = ({ hasContent = false }) => {
  const { shouldShowAd } = useAdPlacement('articleBanner', hasContent);
  
  if (!shouldShowAd) return null;
  
  return (
    <ArticleDetailAd>
      <AdCard 
        adSlot="articleBanner"
        minHeight="200px"
        showLabel={true}
      />
    </ArticleDetailAd>
  );
};

// 인라인 광고 컴포넌트 (기사 목록 사이에 삽입)
const InlineAd = styled.div`
  width: 100%;
  margin: 1.5rem 0;
  padding: 1rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  border: 1px dashed #007bff;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #007bff, #0056b3);
  }
`;

export const InlineAdComponent = ({ className, style, hasContent = false }) => {
  const { shouldShowAd } = useAdPlacement('articleBanner', hasContent);
  
  if (!shouldShowAd) return null;
  
  return (
    <InlineAd className={className} style={style}>
      <AdCard 
        adSlot="articleBanner"
        minHeight="150px"
        showLabel={true}
      />
    </InlineAd>
  );
};

// 모바일 전용 광고 컴포넌트
const MobileAd = styled.div`
  width: 100%;
  margin: 1rem 0;
  padding: 0.5rem;
  
  @media (min-width: 769px) {
    display: none; /* 데스크톱에서는 숨김 */
  }
`;

export const MobileAdComponent = ({ hasContent = false }) => {
  const { shouldShowAd } = useAdPlacement('articleBanner', hasContent);
  
  if (!shouldShowAd) return null;
  
  return (
    <MobileAd>
      <AdCard 
        adSlot="articleBanner"
        minHeight="100px"
        showLabel={false}
      />
    </MobileAd>
  );
};

// 광고 배너 컴포넌트 (페이지 상단)
const TopBannerAd = styled.div`
  width: 100%;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

export const TopBannerAdComponent = ({ hasContent = false }) => {
  const { shouldShowAd } = useAdPlacement('articleBanner', hasContent);
  
  if (!shouldShowAd) return null;
  
  return (
    <TopBannerAd>
      <AdCard 
        adSlot="articleBanner"
        minHeight="90px"
        showLabel={true}
      />
    </TopBannerAd>
  );
};

// 광고 래퍼 컴포넌트 (조건부 렌더링을 위한)
export const AdWrapper = ({ children, position = 'articleBanner', hasContent = false }) => {
  const { shouldShowAd } = useAdPlacement(position, hasContent);
  
  if (!shouldShowAd) return null;
  
  return <>{children}</>;
};

export default {
  SidebarAdComponent,
  SearchResultAdComponent,
  ArticleDetailAdComponent,
  InlineAdComponent,
  MobileAdComponent,
  TopBannerAdComponent,
  AdWrapper
}; 