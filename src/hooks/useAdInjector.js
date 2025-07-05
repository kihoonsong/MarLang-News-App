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
    
    if (config.randomPlacement) {
      // 랜덤 배치 로직
      const { minGap, maxGap } = config;
      let nextAdPosition = Math.floor(Math.random() * (maxGap - minGap + 1)) + minGap;
      let adCount = 0;
      
      items.forEach((item, index) => {
        newItems.push(item);
        
        // 다음 광고 위치에 도달하고 충분한 기사가 있는 경우
        if (index + 1 === nextAdPosition && index < items.length - 1) {
          newItems.push({ 
            type: 'ad', 
            id: `ad-${adCount}`,
            adSlot: 'articleBanner',
            position: index + 1
          });
          adCount++;
          
          // 다음 광고 위치 계산
          nextAdPosition = index + 1 + Math.floor(Math.random() * (maxGap - minGap + 1)) + minGap;
        }
      });
    } else {
      // 기존 고정 빈도 배치 로직
      const frequency = config.frequency;
      
      items.forEach((item, index) => {
        newItems.push(item);
        
        if ((index + 1) % frequency === 0) {
          newItems.push({ 
            type: 'ad', 
            id: `ad-${index}`,
            adSlot: 'articleBanner',
            position: index + 1
          });
        }
      });
    }
    
    return newItems;
  }, [items, shouldShowAds]);

  return {
    itemsWithAds,
    shouldShowAds,
    adsConfig: adsenseConfig
  };
};

// 특정 위치에 광고 삽입을 위한 훅
export const useAdPlacement = (position = 'articleBanner', hasContent = true) => {
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
