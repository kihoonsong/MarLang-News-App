import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { membershipConfig } from '../config/membershipConfig';

// 랜덤 광고 배치를 위한 유틸리티 함수들
const generateRandomSeed = (items) => {
  // 아이템 수와 현재 시간을 기반으로 시드 생성
  const seed = items.length * Math.floor(Date.now() / (1000 * 60 * 60)); // 1시간마다 변경
  return seed;
};

const seededRandom = (seed) => {
  // 시드 기반 의사 랜덤 생성기 (일관된 결과를 위해)
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const generateAdPositions = (itemCount, seed) => {
  const positions = [];
  
  if (itemCount < 3) return positions; // 최소 3개 이상의 아이템이 있어야 광고 삽입
  
  // 광고 밀도 설정 (아이템 4-6개당 광고 1개)
  const adDensity = Math.max(1, Math.floor(itemCount / (4 + seededRandom(seed) * 3))); // 4-7개당 1개
  const maxAds = Math.min(adDensity, Math.floor(itemCount / 3)); // 최대 아이템/3 개
  
  if (maxAds === 0) return positions;
  
  // 첫 번째 광고는 3-7번째 위치 중 랜덤
  const firstAdMin = 3;
  const firstAdMax = Math.min(7, Math.floor(itemCount * 0.3));
  const firstAdPosition = firstAdMin + Math.floor(seededRandom(seed + 1) * (firstAdMax - firstAdMin + 1));
  positions.push(firstAdPosition);
  
  // 나머지 광고들은 균등하지만 랜덤한 간격으로 배치
  if (maxAds > 1) {
    const remainingItems = itemCount - firstAdPosition;
    const interval = Math.floor(remainingItems / (maxAds - 1));
    
    for (let i = 1; i < maxAds; i++) {
      const variance = Math.floor(interval * 0.3); // 30% 범위 내에서 변동
      const randomOffset = Math.floor(seededRandom(seed + i + 10) * (variance * 2 + 1)) - variance;
      const basePosition = firstAdPosition + (interval * i);
      const finalPosition = Math.max(
        firstAdPosition + 2, 
        Math.min(itemCount - 1, basePosition + randomOffset)
      );
      
      // 중복 위치 방지
      if (!positions.includes(finalPosition) && finalPosition > positions[positions.length - 1] + 1) {
        positions.push(finalPosition);
      }
    }
  }
  
  return positions.sort((a, b) => a - b);
};

export const useAdInjector = (items) => {
  const { user } = useAuth();
  
  // TODO: 나중에 실제 구독 상태로 교체
  const isPremium = false;
  
  // 광고 표시 여부 결정 (카카오 애드핏)
  const shouldShowAds = useMemo(() => {
    // 프리미엄 사용자에게 광고 표시 안함
    if (isPremium) {
      return false;
    }
    
    // 기본적으로 광고 표시 (카카오 애드핏)
    return true;
  }, [user, isPremium]);

  const itemsWithAds = useMemo(() => {
    const config = membershipConfig.ads;
    const minThreshold = config.minContentThreshold || 3;
    
    // 광고를 표시하지 않거나, 아이템이 없거나, 아이템이 최소 임계값 미만인 경우
    if (!shouldShowAds || !items || items.length === 0 || items.length < minThreshold) {
      // 안전한 복사본 반환 (참조 문제 해결)
      return items ? [...items] : [];
    }

    // 실제 유효한 콘텐츠만 필터링 (애드센스 정책 준수)
    const validItems = items.filter(item => 
      item && 
      item.title && 
      (item.content || item.summary || item.description) &&
      item.status === 'published'
    );
    
    // 유효한 콘텐츠가 최소 임계값 미만이면 광고 표시 안함
    if (validItems.length < minThreshold) {
      return items ? [...items] : [];
    }

    // 랜덤 시드 생성 및 광고 위치 결정
    const seed = generateRandomSeed(items);
    const adPositions = generateAdPositions(items.length, seed);
    
    console.log('🎯 광고 배치 정보:', {
      itemCount: items.length,
      seed,
      adPositions,
      adDensity: `${adPositions.length}개/${items.length}개 아이템`
    });

    const newItems = [];
    let adCount = 0;
    
    items.forEach((item, index) => {
      const position = index + 1; // 1-based position
      
      // 현재 위치가 광고 위치인지 확인
      if (adPositions.includes(position)) {
        newItems.push({ 
          type: 'ad', 
          id: `ad-${adCount}`,
          adSlot: 'articleBanner',
          position: position,
          seed: seed + adCount // 고유한 시드로 다양한 광고 스타일 가능
        });
        adCount++;
      }
      
      newItems.push(item);
    });
    
    return newItems;
  }, [items, shouldShowAds]);

  return {
    itemsWithAds,
    shouldShowAds,
    adsConfig: { type: 'kakao-adfit' } // 카카오 애드핏 사용
  };
};

// 특정 위치에 광고 삽입을 위한 훅
export const useAdPlacement = (position = 'articleBanner', hasContent = false) => {
  const { user } = useAuth();
  const isPremium = false; // TODO: 실제 구독 상태로 교체
  
  const shouldShowAd = useMemo(() => {
    // 프리미엄 사용자에게 광고 표시 안함
    if (isPremium) return false;
    
    // 콘텐츠가 없는 경우 광고 표시 안함
    if (!hasContent) return false;
    
    // 기본적으로 광고 표시 (카카오 애드핏)
    return true;
  }, [user, isPremium, hasContent]);
  
  return {
    shouldShowAd,
    adSlot: position,
    adsConfig: { type: 'kakao-adfit' } // 카카오 애드핏 사용
  };
};

// 수직 리스트용 광고 삽입 훅
export const useVerticalAdInjector = (items, injectEvery = 3) => {
  const { user } = useAuth();
  const adsenseConfig = getAdsenseConfig();
  const isPremium = false; // TODO: 실제 구독 상태로 교체
  
  // 광고 표시 여부 결정 (카카오 애드핏)
  const shouldShowAds = useMemo(() => {
    // 프리미엄 사용자에게 광고 표시 안함
    if (isPremium) return false;
    
    // 기본적으로 광고 표시 (카카오 애드핏)
    return true;
  }, [user, isPremium]);

  const itemsWithAds = useMemo(() => {
    // 광고를 표시하지 않거나, 아이템이 없거나, 최소 임계값 미만인 경우
    if (!shouldShowAds || !items || items.length === 0 || items.length < injectEvery) {
      return items ? [...items] : [];
    }

    // 실제 유효한 콘텐츠만 필터링 (애드센스 정책 준수)
    const validItems = items.filter(item => 
      item && 
      item.title && 
      (item.content || item.summary || item.description) &&
      item.status === 'published'
    );
    
    // 유효한 콘텐츠가 최소 임계값 미만이면 광고 표시 안함
    if (validItems.length < injectEvery) {
      return items ? [...items] : [];
    }

    const newItems = [];
    let adCount = 0;
    
    items.forEach((item, index) => {
      // 기사 추가
      newItems.push(item);
      
      // 매 injectEvery 번째마다 광고 삽입 (마지막 아이템 제외)
      if ((index + 1) % injectEvery === 0 && index < items.length - 1) {
        newItems.push({ 
          type: 'ad', 
          id: `vertical-ad-${adCount}`,
          adSlot: 'inFeedBanner',
          position: index + 1,
          injectionType: 'vertical'
        });
        adCount++;
      }
    });
    
    console.log('🎯 수직 광고 배치 정보:', {
      itemCount: items.length,
      injectEvery,
      adCount,
      totalItems: newItems.length
    });
    
    return newItems;
  }, [items, shouldShowAds, injectEvery]);

  return {
    itemsWithAds,
    shouldShowAds,
    adCount: itemsWithAds.filter(item => item.type === 'ad').length,
    adsConfig: adsenseConfig
  };
};
