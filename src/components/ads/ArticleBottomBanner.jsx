import React from 'react';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import AdFitUnit from './AdFitUnit';

const BottomBannerContainer = styled(Box)(({ theme }) => ({
  margin: '32px 0 24px 0',
  padding: '16px 0',
  borderTop: '1px solid #e0e0e0',
  borderBottom: '1px solid #e0e0e0',
  background: '#fafafa',
  
  [theme.breakpoints.down('md')]: {
    margin: '24px 0 16px 0',
    padding: '12px 0',
  }
}));

const AdLabel = styled(Typography)(({ theme }) => ({
  textAlign: 'center',
  marginBottom: 12,
  fontSize: 11,
  color: '#888',
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontWeight: 500
}));

const BannerAdWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: 90, // 데스크톱 기준
  
  [theme.breakpoints.down('md')]: {
    minHeight: 50, // 모바일 배너 높이
  }
}));

const ArticleBottomBanner = ({ 
  articleId = 'default', 
  className = '' 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const bannerSize = isMobile ? '320x50' : '728x90';
  
  // React 페이지 전용 광고 단위 ID 사용 (크롤링 페이지와 분리)
  const unitId = isMobile 
    ? (import.meta.env.VITE_ADFIT_REACT_BANNER_MOBILE || 'DAN-ks07LuYMpBfOqPPa')
    : (import.meta.env.VITE_ADFIT_BANNER_DESKTOP_AD_UNIT || 'DAN-JVIJRJhlqIMMpiLm');
  
  // 렌더링 상태 디버깅 로그 추가 (React 전용 광고 단위)
  console.log('🎯 ArticleBottomBanner 렌더링 시작 (React 전용):', {
    articleId,
    isMobile,
    bannerSize,
    unitId,
    reactMobileUnit: import.meta.env.VITE_ADFIT_REACT_BANNER_MOBILE,
    desktopUnit: import.meta.env.VITE_ADFIT_BANNER_DESKTOP_AD_UNIT,
    timestamp: new Date().toISOString(),
    location: window.location.href
  });

  // 컴포넌트가 실제로 렌더링되는지 확인
  React.useEffect(() => {
    console.log('🎯 ArticleBottomBanner useEffect 실행됨:', articleId);
    return () => {
      console.log('🎯 ArticleBottomBanner 언마운트됨:', articleId);
    };
  }, [articleId]);
  
  // 고유한 컨테이너 ID 생성 (안정적인 ID)
  const containerId = `article-banner-${articleId}`;

  const handleAdLoad = () => {
    console.log(`✅ Article bottom banner loaded: ${containerId}`);
  };

  const handleAdError = (error) => {
    console.error(`❌ Article bottom banner error: ${containerId}`, error);
  };

  return (
    <BottomBannerContainer className={`bottom-banner-container ${className}`}>
      <AdLabel>광고</AdLabel>
      
      <BannerAdWrapper className="banner-ad-wrapper">
        <AdFitUnit
          unitId={unitId}
          containerId={containerId}
          size={bannerSize}
          lazy={false}
          onLoad={handleAdLoad}
          onError={handleAdError}
          fallback={<BannerAdSkeleton size={bannerSize} />}
        />
      </BannerAdWrapper>
    </BottomBannerContainer>
  );
};

// 배너 광고 스켈레톤 컴포넌트
const BannerAdSkeleton = ({ size }) => {
  const [width, height] = size.split('x').map(Number);
  
  return (
    <Box sx={{ 
      width: width,
      height: height,
      maxWidth: '100%',
      bgcolor: 'grey.100',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 1,
      mx: 'auto',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
        animation: 'loading 1.5s infinite'
      }
    }}>
      <Typography variant="caption" color="text.secondary">
        광고 로딩 중...
      </Typography>
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

export default ArticleBottomBanner;