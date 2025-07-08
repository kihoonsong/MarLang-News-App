import React, { useEffect, useRef, useState } from 'react';
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
  
  /* 단어장에서 사용될 때 WordCard와 동일한 스타일 */
  &.wordbook-ad {
    background-color: transparent !important;
    border: none !important;
    border-radius: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    box-shadow: none !important;
    min-height: 180px !important;
    height: 180px !important;
    max-height: 180px !important;
    width: 100% !important;
    transition: none !important;
    overflow: hidden !important;
    
    /* 모든 내부 요소도 크기 고정 */
    * {
      max-height: 180px !important;
      overflow: hidden !important;
    }
    
    /* AdSense 광고가 크기를 벗어나지 않도록 강제 */
    .adsbygoogle,
    ins {
      width: 100% !important;
      height: 180px !important;
      max-height: 180px !important;
      min-height: 180px !important;
      overflow: hidden !important;
      display: block !important;
    }
  }
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
  const [adLoadFailed, setAdLoadFailed] = useState(false);
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
          
          // 광고 로드 시도
          try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            setAdLoadFailed(false);
          } catch (pushError) {
            console.error('AdSense 광고 푸시 실패:', pushError);
            setAdLoadFailed(true);
          }
        }
      } catch (error) {
        console.error('AdSense 로드 실패:', error);
        setAdLoadFailed(true);
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
      style={{ 
        minHeight, 
        ...style,
        // AdSense 로드 실패 시 고정 크기 유지로 레이아웃 시프트 방지
        height: className?.includes('wordbook-ad') ? '180px' : (adLoadFailed ? minHeight : 'auto'),
        overflow: 'hidden'
      }} 
      className={className}
      ref={adRef}
    >
      {showLabel && <AdLabel>Advertisement</AdLabel>}
      {adLoadFailed && (
        <AdPlaceholderText>
          광고를 불러올 수 없습니다.
        </AdPlaceholderText>
      )}
    </AdCardContainer>
  );
};

export default AdCard;
