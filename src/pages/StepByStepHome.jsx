import React, { useState } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router-dom';
import SimpleSEO from '../components/SimpleSEO';
import MainNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import { useArticles } from '../contexts/ArticlesContext';
import { useEnhancedToast } from '../components/EnhancedToastProvider';
import { ArticleListSkeleton } from '../components/LoadingComponents';

const StepByStepHome = () => {
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
            Step-by-Step Testing with Navigation
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
          <Box sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
            <Typography variant="h3" component="h1" gutterBottom color="primary">
              NEWStep Eng News
            </Typography>
            
            <Typography variant="h5" gutterBottom>
              Step-by-Step Testing with useArticles Hook
            </Typography>
            
            <Box sx={{ 
              backgroundColor: 'white', 
              p: 3, 
              borderRadius: 2, 
              mt: 2,
              boxShadow: 1
            }}>
              <Typography variant="h6" gutterBottom>
                ✅ Articles Context Status
              </Typography>
              <ul>
                <li>✅ useArticles hook: {articlesContext ? 'Working' : 'Not available'}</li>
                <li>✅ Loading state: {loading ? 'Loading...' : 'Loaded'}</li>
                <li>✅ Error state: {error ? `Error: ${error}` : 'No errors'}</li>
                <li>✅ Toast notifications: Working</li>
              </ul>
            </Box>
      
      <Box sx={{ 
        backgroundColor: 'white', 
        p: 3, 
        borderRadius: 2, 
        mt: 2,
        boxShadow: 1
      }}>
        <Typography variant="h6" gutterBottom>
          ✅ Status Check
        </Typography>
        <ul>
          <li>✅ React is working</li>
          <li>✅ Material-UI is working</li>
          <li>✅ React Router is working</li>
        </ul>
        
        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button 
            variant="contained" 
            onClick={() => alert('Material-UI Button works!')}
          >
            Test MUI Button
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={() => navigate('/search')}
          >
            Go to Search
          </Button>
          
          <Button 
            variant="text" 
            onClick={() => navigate('/wordbook')}
          >
            Go to Wordbook
          </Button>
        </Box>
      </Box>
      
      <Box sx={{ 
        backgroundColor: 'white', 
        p: 3, 
        borderRadius: 2, 
        mt: 2,
        boxShadow: 1
      }}>
        <Typography variant="h6" gutterBottom>
          🔍 Next Steps
        </Typography>
        <Typography variant="body1" paragraph>
          If this page works, we can gradually add:
        </Typography>
        <ol>
          <li>SEOHelmet component</li>
          <li>MainNavigation component</li>
          <li>useArticles hook</li>
          <li>Toast notifications</li>
          <li>Complex UI components</li>
        </ol>
      </Box>
          </Box>
        )}
      </MobileContentWrapper>
    </>
  );
};

export default StepByStepHome;