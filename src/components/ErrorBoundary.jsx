import React from 'react';
import styled from 'styled-components';
import { Button, Typography, Box, Card, Alert } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import BugReportIcon from '@mui/icons-material/BugReport';
import HomeIcon from '@mui/icons-material/Home';
import { reportError } from '../utils/errorReporting';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // 에러 리포팅 시스템으로 전송
    reportError(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { fallback: FallbackComponent } = this.props;
      
      // 커스텀 폴백 컴포넌트가 있으면 사용
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={this.state.error}
            retry={this.handleRetry}
            goHome={this.handleGoHome}
          />
        );
      }

      // 기본 에러 UI
      return (
        <ErrorContainer>
          <ErrorCard>
            <BugReportIcon sx={{ fontSize: 64, color: '#f44336', mb: 2 }} />
            
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
              Oops! Something went wrong
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary', textAlign: 'center' }}>
              We encountered an unexpected error. Don't worry, it's not your fault.
            </Typography>

            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>Error:</strong> {this.state.error?.message || 'Unknown error occurred'}
              </Typography>
              {import.meta.env.DEV && this.state.error?.stack && (
                <details style={{ marginTop: 8 }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                    Technical Details (Dev Mode)
                  </summary>
                  <pre style={{ 
                    marginTop: 8, 
                    fontSize: '0.8rem', 
                    overflow: 'auto',
                    background: '#f5f5f5',
                    padding: 8,
                    borderRadius: 4
                  }}>
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </Alert>

            <ActionButtons>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleRetry}
                sx={{ mr: 2 }}
              >
                Try Again
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<HomeIcon />}
                onClick={this.handleGoHome}
              >
                Go Home
              </Button>
            </ActionButtons>

            {/* 도움말 섹션 */}
            <HelpSection>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                If this problem persists, try:
              </Typography>
              <Typography variant="body2" color="text.secondary" component="ul" sx={{ textAlign: 'left', pl: 2 }}>
                <li>Refreshing the page</li>
                <li>Clearing your browser cache</li>
                <li>Checking your internet connection</li>
                <li>Using a different browser</li>
              </Typography>
            </HelpSection>
          </ErrorCard>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

// 특정 컴포넌트용 에러 폴백들
export const ArticleErrorFallback = ({ error, retry }) => (
  <ErrorCard sx={{ m: 2 }}>
    <Typography variant="h6" sx={{ mb: 2 }}>
      Failed to load article
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
      {error?.message || 'Unable to fetch article content'}
    </Typography>
    <Button variant="outlined" onClick={retry} size="small">
      Retry
    </Button>
  </ErrorCard>
);

export const SearchErrorFallback = ({ error, retry }) => (
  <Box sx={{ textAlign: 'center', py: 4 }}>
    <Alert severity="warning" sx={{ mb: 2 }}>
      <Typography variant="body2">
        Search failed: {error?.message || 'Unable to search articles'}
      </Typography>
    </Alert>
    <Button variant="outlined" onClick={retry}>
      Try Again
    </Button>
  </Box>
);

export const NewsListErrorFallback = ({ error, retry }) => (
  <ErrorCard sx={{ m: 2, textAlign: 'center' }}>
    <Typography variant="h6" sx={{ mb: 1 }}>
      Unable to load news
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
      {error?.message || 'Failed to fetch the latest articles'}
    </Typography>
    <Button variant="contained" onClick={retry} startIcon={<RefreshIcon />}>
      Reload News
    </Button>
  </ErrorCard>
);

// 네트워크 오류 전용 컴포넌트
export const NetworkErrorFallback = ({ retry }) => (
  <ErrorCard sx={{ m: 2, textAlign: 'center' }}>
    <Typography variant="h6" sx={{ mb: 1, color: 'warning.main' }}>
      🌐 Connection Issue
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
      Please check your internet connection and try again.
    </Typography>
    <Button variant="contained" onClick={retry} startIcon={<RefreshIcon />}>
      Retry
    </Button>
  </ErrorCard>
);

// HOC로 컴포넌트 래핑
export const withErrorBoundary = (Component, fallback) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// 스타일드 컴포넌트들
const ErrorContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
`;

const ErrorCard = styled(Card)`
  max-width: 600px !important;
  padding: 3rem !important;
  text-align: center !important;
  border-radius: 16px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin: 2rem 0;
`;

const HelpSection = styled.div`
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e0e0e0;
`;

export default ErrorBoundary;