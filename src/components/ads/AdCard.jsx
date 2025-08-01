import React from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import BasicAdFitBanner from './BasicAdFitBanner';

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
  index = 0
}) => {
  // 광고 단위 ID를 인덱스에 따라 선택
  const getAdUnitId = (adIndex) => {
    switch (adIndex) {
      case 0:
        return import.meta.env.VITE_ADFIT_CARD_AD_UNIT || 'DAN-kXEIw2QcPNjJJ79V';
      case 1:
        return import.meta.env.VITE_ADFIT_CARD_AD_UNIT_2 || 'DAN-030uinq3qqa7C0Zr';
      default:
        return import.meta.env.VITE_ADFIT_CARD_AD_UNIT || 'DAN-kXEIw2QcPNjJJ79V';
    }
  };

  const adUnitId = getAdUnitId(index);
  
  console.log('🎯 AdCard 렌더링:', { adUnitId, index });

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
        <Box sx={{ 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <BasicAdFitBanner
            adUnitId={adUnitId}
            width={300}
            height={250}
            className="ad-card-banner"
          />
        </Box>
      </CardContent>
    </StyledAdCard>
  );
};

export default AdCard;