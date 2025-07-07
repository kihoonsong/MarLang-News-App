import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Paper, Typography, Box } from '@mui/material';
import { getAdsenseConfig, loadAdsenseScript } from '../config/adsenseConfig';

const AdCardContainer = styled(Paper)`
  padding: 1rem;
  border-radius: 12px;
  background-color: #f5f5f5;
  border: 1px dashed #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  min-height: 200px; /* ArticleCard와 유사한 높이 */
  box-sizing: border-box;
`;

const AdLabel = styled(Typography)`
  font-size: 0.75rem;
  color: #999;
  margin-bottom: 0.5rem;
  border: 1px solid #ddd;
  padding: 2px 8px;
  border-radius: 12px;
`;

const AdPlaceholderText = styled(Typography)`
  font-size: 1rem;
  color: #777;
  font-weight: 500;
`;

const AdCard = ({ 
  adSlot = 'articleBanner', 
  minHeight = '200px', 
  showLabel = true,
  style = {},
  className = ''
}) => {
  const adRef = useRef(null);
  const adsenseConfig = getAdsenseConfig();
  
  useEffect(() => {
    // 애드센스가 비활성화된 경우 플레이스홀더 표시
    if (!adsenseConfig.enabled) {
      return;
    }

    const loadAd = async () => {
      try {
        await loadAdsenseScript();
        
        if (window.adsbygoogle && adRef.current) {
          // 기존 광고가 있다면 제거
          const existingAd = adRef.current.querySelector('.adsbygoogle');
          if (existingAd) {
            existingAd.remove();
          }
          
          // 새 광고 요소 생성
          const adElement = document.createElement('ins');
          adElement.className = 'adsbygoogle';
          adElement.style.display = 'block';
          adElement.setAttribute('data-ad-client', adsenseConfig.clientId);
          
          // 슬롯별 설정 적용
          const slotConfig = adsenseConfig.adSlots[adSlot];
          if (slotConfig) {
            adElement.setAttribute('data-ad-slot', slotConfig.slot);
            adElement.setAttribute('data-ad-format', slotConfig.format);
            
            if (slotConfig.responsive) {
              adElement.setAttribute('data-full-width-responsive', 'true');
            }
          }
          
          adRef.current.appendChild(adElement);
          
          // 광고 로드
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (error) {
        console.error('AdSense 로드 실패:', error);
      }
    };

    loadAd();
  }, [adSlot, adsenseConfig]);

  // 애드센스가 비활성화된 경우 플레이스홀더 표시
  if (!adsenseConfig.enabled) {
    return (
      <AdCardContainer 
        variant="outlined" 
        style={{ minHeight, ...style }} 
        className={className}
      >
        {showLabel && <AdLabel>Advertisement</AdLabel>}
        <AdPlaceholderText>
          Ad content will be displayed here.
        </AdPlaceholderText>
      </AdCardContainer>
    );
  }

  return (
    <AdCardContainer 
      variant="outlined" 
      style={{ minHeight, ...style }} 
      className={className}
      ref={adRef}
    >
      {showLabel && <AdLabel>Advertisement</AdLabel>}
    </AdCardContainer>
  );
};

export default AdCard;
