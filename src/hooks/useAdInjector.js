import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { membershipConfig } from '../config/membershipConfig';
import { getAdsenseConfig } from '../config/adsenseConfig';

export const useAdInjector = (items) => {
  const { user } = useAuth();
  const adsenseConfig = getAdsenseConfig();
  
  // TODO: 나중에 실제 구독 상태로 교체
  const isPremium = false;
  
  // 광고 표시 여부 결정
  const shouldShowAds = useMemo(() => {
    // 애드센스가 비활성화된 경우
    if (!adsenseConfig.enabled) return false;
    
    // 프리미엄 사용자에게 광고 표시 안함
    if (isPremium && !adsenseConfig.displayRules.showToPremiumUsers) {
      return false;
    }
    
    // 로그인 사용자에게 광고 표시 여부 확인
    if (user && !adsenseConfig.displayRules.showToLoggedInUsers) {
      return false;
    }
    
    return true;
  }, [user, isPremium, adsenseConfig]);

  const itemsWithAds = useMemo(() => {
    const config = membershipConfig.ads;
    const minThreshold = config.minContentThreshold || 3;
    
    // 광고를 표시하지 않거나, 아이템이 없거나, 아이템이 최소 임계값 미만인 경우
    if (!shouldShowAds || !items || items.length === 0 || items.length < minThreshold) {
      return items || [];
    }

    const newItems = [];
    
    // 소수 생성 함수
    const isPrime = (num) => {
      if (num < 2) return false;
      for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) return false;
      }
      return true;
    };
    
    // 소수 자리에 광고 배치
    let adCount = 0;
    
    items.forEach((item, index) => {
      newItems.push(item);
      
      // 현재 위치가 소수인지 확인 (1-based index)
      const position = index + 1;
      if (isPrime(position) && position >= 3 && index < items.length - 1) {
        newItems.push({ 
          type: 'ad', 
          id: `ad-${adCount}`,
          adSlot: 'articleBanner',
          position: position
        });
        adCount++;
      }
    });
    
    return newItems;
  }, [items, shouldShowAds]);

  return {
    itemsWithAds,
    shouldShowAds,
    adsConfig: adsenseConfig
  };
};

// 특정 위치에 광고 삽입을 위한 훅
export const useAdPlacement = (position = 'articleBanner', hasContent = false) => {
  const { user } = useAuth();
  const adsenseConfig = getAdsenseConfig();
  const isPremium = false; // TODO: 실제 구독 상태로 교체
  
  const shouldShowAd = useMemo(() => {
    if (!adsenseConfig.enabled) return false;
    if (isPremium && !adsenseConfig.displayRules.showToPremiumUsers) return false;
    if (user && !adsenseConfig.displayRules.showToLoggedInUsers) return false;
    
    // 콘텐츠가 없는 경우 광고 표시 안함
    if (!hasContent) return false;
    
    return true;
  }, [user, isPremium, adsenseConfig, hasContent]);
  
  return {
    shouldShowAd,
    adSlot: position,
    adsConfig: adsenseConfig
  };
};
