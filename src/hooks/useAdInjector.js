import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { membershipConfig } from '../config/membershipConfig';

export const useAdInjector = (items) => {
  const { user } = useAuth(); // 지금은 user 존재 여부만으로 광고를 제어 (로그인 시 광고 없음)
  
  const isPremium = false; // TODO: 나중에 실제 구독 상태로 교체

  const itemsWithAds = useMemo(() => {
    if (isPremium) {
      return items;
    }
    
    if (!items || items.length === 0) {
      return [];
    }

    const newItems = [];
    items.forEach((item, index) => {
      newItems.push(item);
      if ((index + 1) % membershipConfig.ads.frequency === 0) {
        newItems.push({ type: 'ad', id: `ad-${index}` });
      }
    });
    return newItems;

  }, [items, isPremium]);

  return itemsWithAds;
};
