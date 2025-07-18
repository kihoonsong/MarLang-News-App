import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert, Button } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router-dom';
import { useArticles } from '../contexts/ArticlesContext';
import { useEnhancedToast } from '../components/EnhancedToastProvider';
import { ArticleListSkeleton } from '../components/LoadingComponents';
import MainNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import SimpleSEO from '../components/SimpleSEO';

const SafeHome = () => {
  const navigate = useNavigate();
  const toast = useEnhancedToast();
  const [homeError, setHomeError] = useState(null);

  // Context 안전하게 가져오기
  const articlesContext = useArticles();
  const { 
    loading = true, 
    error = null, 
    refreshArticles = () => {}
  } = articlesContext || {};

  const retryNews = () => {
    try {
      refreshArticles();
      toast.info('Refreshing articles...');
    } catch (err) {
      console.error('Refresh failed:', err);
      setHomeError('Failed to refresh articles');
    }
  };

  return (
    <>
      <SimpleSEO />
      
      <MainNavigation showCategoryTabs={false}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            NEWStep Eng News
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Safe Home Page - Testing Phase
          </Typography>
        </Box>
      </MainNavigation>
      
      <MobileContentWrapper>
        {/* 에러 상태 처리 */}
        {(error || homeError) && (
          <Box sx={{ p: 2 }}>
            <Alert 
              severity="warning" 
              action={
                <Button color="inherit" size="small" onClick={retryNews} startIcon={<RefreshIcon />}>
                  Retry
                </Button>
              }
              sx={{ mb: 2 }}
            >
              Failed to load news: {error || homeError}
            </Alert>
          </Box>
        )}
        
        {/* 로딩 상태 */}
        {loading ? (
          <ArticleListSkeleton count={3} />
        ) : (
          <Box sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>
              Welcome to NEWStep Eng News
            </Typography>
            <Typography variant="body1" paragraph>
              This is a safe version of the home page. The full version is being debugged.
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Available Features:
              </Typography>
              <ul>
                <li>Search articles</li>
                <li>Browse by date</li>
                <li>Personal wordbook</li>
                <li>User profile</li>
              </ul>
            </Box>
            
            <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button 
                variant="contained" 
                onClick={() => navigate('/search')}
              >
                Go to Search
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/wordbook')}
              >
                My Wordbook
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/date')}
              >
                Browse by Date
              </Button>
            </Box>
          </Box>
        )}
      </MobileContentWrapper>
    </>
  );
};

export default SafeHome;