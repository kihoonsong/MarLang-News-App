import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { useAdFit } from '../../contexts/AdFitContext';

// 광고 크기 매핑
const AD_SIZES = {
  '300x250': { width: 300, height: 250 },
  '728x90': { width: 728, height: 90 },
  '320x50': { width: 320, height: 50 },
  '320x250': { width: 320, height: 250 },
  '250x250': { width: 250, height: 250 }
};

const AdFitUnit = ({ 
  unitId, 
  containerId = null,
  size = '300x250', 
  className = '', 
  lazy = true, 
  fallback = null,
  onLoad = null,
  onError = null 
}) => {
  const { 
    displayAd, 
    registerAdUnit, 
    unregisterAdUnit, 
    isAdBlocked,
    isAdFitLoaded 
  } = useAdFit();
  
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(!lazy);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isDisplayed, setIsDisplayed] = useState(false);

  const adSize = AD_SIZES[size] || AD_SIZES['300x250'];
  const finalContainerId = containerId || unitId;
  
  // 개발 환경에서만 로깅
  if (import.meta.env.DEV) {
    console.log('🎯 AdFitUnit 렌더링:', { 
      unitId, 
      containerId: finalContainerId,
      size, 
      lazy, 
      isAdBlocked, 
      isAdFitLoaded,
      isVisible,
      isLoading,
      hasError,
      isDisplayed
    });
  }

  // Intersection Observer를 이용한 지연 로딩
  useEffect(() => {
    if (!lazy || isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, isVisible]);

  // 광고 단위 등록
  useEffect(() => {
    registerAdUnit({
      id: finalContainerId,
      size,
      position: 'unknown' // 상위 컴포넌트에서 설정
    });

    return () => {
      unregisterAdUnit(finalContainerId);
    };
  }, [finalContainerId, size, registerAdUnit, unregisterAdUnit]);

  // 안정적인 광고 로딩 (Context 사용)
  useEffect(() => {
    if (!isVisible || isDisplayed || hasError || isAdBlocked) {
      return;
    }

    const loadAd = async () => {
      try {
        // AdFitContext를 통한 스크립트 로드
        await displayAd(unitId);
        
        // 모바일 최적화: 500ms로 단축
        setTimeout(() => {
          setIsLoading(false);
          setIsDisplayed(true);
          onLoad && onLoad();
          if (import.meta.env.DEV) {
            console.log(`✅ AdFitUnit displayed: ${unitId}`);
          }
        }, 500);
        
      } catch (error) {
        console.error(`Failed to load ad: ${unitId}`, error);
        setHasError(true);
        setIsLoading(false);
        onError && onError(error);
      }
    };

    loadAd();
  }, [isVisible, isDisplayed, hasError, isAdBlocked, displayAd, unitId, onLoad, onError]);

  // 광고 차단기 감지 시 처리
  if (isAdBlocked) {
    return fallback || (
      <Box
        ref={containerRef}
        className={`adfit-unit adfit-blocked ${className}`}
        sx={{
          width: adSize.width,
          height: adSize.height,
          maxWidth: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.50',
          border: '1px dashed',
          borderColor: 'grey.300',
          borderRadius: 1
        }}
      >
        <Typography variant="caption" color="text.secondary">
          광고 차단기가 감지되었습니다
        </Typography>
      </Box>
    );
  }

  // 에러 상태
  if (hasError) {
    return fallback || (
      <Box
        ref={containerRef}
        className={`adfit-unit adfit-error ${className}`}
        sx={{
          width: adSize.width,
          height: adSize.height,
          maxWidth: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.50',
          border: '1px solid',
          borderColor: 'grey.300',
          borderRadius: 1
        }}
      >
        <Typography variant="caption" color="text.secondary">
          광고를 불러올 수 없습니다
        </Typography>
      </Box>
    );
  }

  // 광고 영역 (항상 표시)
  return (
    <Box
      ref={containerRef}
      className={`adfit-unit adfit-${size} ${className}`}
      sx={{
        width: adSize.width,
        height: adSize.height,
        maxWidth: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderRadius: 1,
        position: 'relative',
        bgcolor: isLoading ? 'grey.100' : 'transparent',
        ...(isLoading && {
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            animation: 'loading 1.5s infinite',
            zIndex: 1
          }
        })
      }}
    >
      {/* 카카오 애드핏 광고 영역 - 항상 DOM에 존재 */}
      <div 
        id={finalContainerId}
        style={{
          width: '100%',
          height: '100%',
          minHeight: adSize.height
        }}
      >
        <ins 
          className="kakao_ad_area" 
          style={{ display: 'block' }}
          data-ad-unit={unitId}
          data-ad-width={adSize.width}
          data-ad-height={adSize.height}
        />
      </div>
      
      {/* 로딩 오버레이 */}
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(245, 245, 245, 0.8)',
            zIndex: 2
          }}
        >
          <Typography variant="caption" color="text.secondary">
            광고 로딩 중...
          </Typography>
        </Box>
      )}
      
      <style>
        {`
          @keyframes loading {
            0% { left: -100%; }
            100% { left: 100%; }
          }
        `}
      </style>
    </Box>
  );


};

export default AdFitUnit;