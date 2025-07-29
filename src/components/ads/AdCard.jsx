import React from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import AdFitUnit from './AdFitUnit';

// 스타일된 카드 컴포넌트 (ArticleCard와 동일한 스타일)
const StyledAdCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  background: '#fff',
  cursor: 'default',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
  },
  
  [theme.breakpoints.down('sm')]: {
    borderRadius: 8,
  }
}));

const AdLabel = styled(Typography)(({ theme }) => ({
  fontSize: 12,
  color: '#666',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  marginBottom: 8,
  opacity: 0.8,
  fontWeight: 500,
  textAlign: 'center'
}));

const AdCard = ({ 
  className = '', 
  lazy = true, 
  index = 0,
  size = '300x250'
}) => {
  // 실제 카카오 애드핏 광고 단위 ID
  const adUnitId = import.meta.env.VITE_ADFIT_CARD_AD_UNIT || 'DAN-kXEIw2QcPNjJJ79V';
  // 각 카드마다 고유한 컨테이너 ID 생성
  const containerId = `adcard-${index}-${Date.now()}`;
  
  console.log('🎯 AdCard 렌더링:', { adUnitId, containerId, index, lazy, size });

  const handleAdLoad = () => {
    console.log(`✅ AdCard loaded: ${containerId}`);
  };

  const handleAdError = (error) => {
    console.error(`❌ AdCard error: ${containerId}`, error);
  };

  return (
    <StyledAdCard className={`ad-card ${className}`}>
      <CardContent sx={{ 
        p: 2, 
        '&:last-child': { pb: 2 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      }}>
        <AdLabel>광고</AdLabel>
        
        <Box sx={{ 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <AdFitUnit
            unitId={adUnitId}
            containerId={containerId}
            size={size}
            lazy={lazy}
            onLoad={handleAdLoad}
            onError={handleAdError}
            fallback={<AdCardSkeleton />}
          />
        </Box>
      </CardContent>
    </StyledAdCard>
  );
};

// 광고 카드 스켈레톤 컴포넌트
const AdCardSkeleton = () => (
  <Box sx={{ 
    width: 300,
    height: 250,
    maxWidth: '100%',
    bgcolor: 'grey.100',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 1,
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
    <Typography variant="body2" color="text.secondary">
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

export default AdCard;