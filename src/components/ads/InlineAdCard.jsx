import React from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import AdFitUnit from './AdFitUnit';

const InlineAdContainer = styled(Box)(({ theme }) => ({
  margin: '24px 0',
  display: 'flex',
  justifyContent: 'center',
  
  [theme.breakpoints.down('md')]: {
    margin: '16px 0',
  }
}));

const InlineAdCard = styled(Card)(({ theme }) => ({
  border: '1px solid #e0e0e0',
  background: '#fafafa',
  borderRadius: 8,
  maxWidth: 350,
  width: '100%',
  
  [theme.breakpoints.down('sm')]: {
    maxWidth: '100%',
    margin: '0 16px'
  }
}));

const AdLabel = styled(Typography)(({ theme }) => ({
  textAlign: 'center',
  marginBottom: 12,
  fontSize: 12,
  color: '#666',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  fontWeight: 500
}));

const InlineAd = ({ 
  position = 'middle', 
  articleId = 'default' 
}) => {
  const unitId = `inline-${position}-${articleId}`;

  const handleAdLoad = () => {
    console.log(`✅ Inline ad loaded: ${unitId}`);
  };

  const handleAdError = (error) => {
    console.error(`❌ Inline ad error: ${unitId}`, error);
  };

  return (
    <InlineAdContainer className="inline-ad-container">
      <InlineAdCard className="inline-ad-card">
        <CardContent sx={{ 
          p: 2, 
          '&:last-child': { pb: 2 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <AdLabel>광고</AdLabel>
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <AdFitUnit
              unitId={unitId}
              size="300x250"
              lazy={false}
              onLoad={handleAdLoad}
              onError={handleAdError}
              fallback={<InlineAdSkeleton />}
            />
          </Box>
        </CardContent>
      </InlineAdCard>
    </InlineAdContainer>
  );
};

// 인라인 광고 스켈레톤 컴포넌트
const InlineAdSkeleton = () => (
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

export default InlineAd;