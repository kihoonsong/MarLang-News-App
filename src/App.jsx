import React, { useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { DataProvider } from './contexts/DataContext';
import { AuthProvider } from './contexts/AuthContext';
import { ArticlesProvider } from './contexts/ArticlesContext';

// 향상된 에러 처리 시스템 import
import ErrorBoundary from './components/ErrorBoundary';
import { 
  EnhancedToastProvider, 
  useEnhancedToast, 
  setupGlobalErrorHandling 
} from './components/EnhancedToastProvider';
import { 
  OfflineBanner, 
  NetworkStatusIndicator 
} from './components/EnhancedLoadingComponents';
import { useNetworkStatus } from './hooks/useNetworkStatus';

import AuthGuard from './components/AuthGuard';

// 페이지 컴포넌트들을 동적 import로 변경 (코드 스플리팅)
const Home = React.lazy(() => import('./pages/Home'));
const ArticleDetail = React.lazy(() => import('./pages/ArticleDetail'));
const Search = React.lazy(() => import('./pages/Search'));
const Wordbook = React.lazy(() => import('./pages/Wordbook'));
const Like = React.lazy(() => import('./pages/Like'));
const DatePage = React.lazy(() => import('./pages/Date'));
const Profile = React.lazy(() => import('./pages/Profile'));
const BlogStyleDashboard = React.lazy(() => import('./pages/BlogStyleDashboard'));
const Settings = React.lazy(() => import('./pages/Settings'));

// 전역 TTS 관리 컴포넌트 (향상됨)
const TTSManager = () => {
  const location = useLocation();
  const { isOnline } = useNetworkStatus();
  const { warning } = useEnhancedToast();

  useEffect(() => {
    // 강력한 전역 TTS 중지 함수
    const forceStopTTS = () => {
      try {
        // Speech Synthesis API 강제 중지
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
          // 브라우저별 추가 중지 시도
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
          window.speechSynthesis.cancel();
        }

        // 기존 전역 TTS 중지 함수가 있으면 호출
        if (typeof window.stopCurrentTTS === 'function') {
          window.stopCurrentTTS();
        }

        console.log('🔇 전역 TTS 강제 중지됨');
      } catch (error) {
        console.error('TTS 중지 중 오류:', error);
      }
    };

    // 페이지 변경 시 TTS 중지
    forceStopTTS();

    // 페이지 가시성 변경 감지
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('🔇 페이지 숨김 - TTS 중지');
        forceStopTTS();
      }
    };

    // 브라우저 탭 변경/닫기 감지
    const handleBeforeUnload = () => {
      console.log('🔇 페이지 떠남 - TTS 중지');
      forceStopTTS();
    };

    // 브라우저 포커스 잃음 감지
    const handleBlur = () => {
      console.log('🔇 브라우저 포커스 잃음 - TTS 중지');
      forceStopTTS();
    };

    // 이벤트 리스너 등록
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('blur', handleBlur);

    // 전역 TTS 중지 함수 등록
    window.globalStopTTS = forceStopTTS;

    return () => {
      // 이벤트 리스너 제거
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('blur', handleBlur);
    };
  }, [location]); // location이 바뀔 때마다 실행

  // 오프라인 상태에서 TTS 사용 시 경고
  useEffect(() => {
    if (!isOnline) {
      warning('TTS may not work properly while offline', {
        group: 'tts-offline',
        duration: 5000
      });
    }
  }, [isOnline, warning]);

  return null; // 렌더링하지 않음
};

// 전역 에러 처리 초기화 컴포넌트
const GlobalErrorHandler = () => {
  const { error } = useEnhancedToast();

  useEffect(() => {
    // 전역 에러 핸들링 설정
    setupGlobalErrorHandling(error);

    // 개발 환경에서만 추가 로깅
    if (process.env.NODE_ENV === 'development') {
      console.log('🛡️ Global error handling initialized');
    }
  }, [error]);

  return null;
};

// 네트워크 상태 모니터링 컴포넌트
const NetworkMonitor = () => {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const { warning, info } = useEnhancedToast();

  useEffect(() => {
    if (isSlowConnection) {
      warning('Slow network detected. Loading may take longer than usual.', {
        group: 'network-speed',
        duration: 6000
      });
    }
  }, [isSlowConnection, warning]);

  useEffect(() => {
    if (!isOnline) {
      console.log('📱 App went offline');
    } else {
      console.log('🌐 App back online');
    }
  }, [isOnline]);

  return null;
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Suspense 로딩 컴포넌트
const PageLoadingFallback = ({ pageName }) => (
  <div style={{ 
    padding: '2rem', 
    textAlign: 'center',
    minHeight: '50vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  }}>
    <div style={{ marginBottom: '1rem' }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #1976d2',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
    </div>
    <p>Loading {pageName}...</p>
    <style>
      {`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}
    </style>
  </div>
);

// 향상된 페이지 래퍼 컴포넌트 (Suspense + ErrorBoundary)
const PageWrapper = ({ children, pageName }) => {
  return (
    <ErrorBoundary 
      fallback={(props) => (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center',
          minHeight: '50vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <h2>Oops! Something went wrong in {pageName}</h2>
          <p>We're sorry for the inconvenience. Please try refreshing the page.</p>
          <div style={{ marginTop: '1rem' }}>
            <button 
              onClick={props.retry}
              style={{
                padding: '0.5rem 1rem',
                marginRight: '0.5rem',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
            <button 
              onClick={props.goHome}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#f5f5f5',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Go Home
            </button>
          </div>
          <NetworkStatusIndicator showDetails style={{ marginTop: '1rem' }} />
        </div>
      )}
    >
      <React.Suspense fallback={<PageLoadingFallback pageName={pageName} />}>
        {children}
      </React.Suspense>
    </ErrorBoundary>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <EnhancedToastProvider>
          <AuthProvider>
            <DataProvider>
              <ArticlesProvider>
                <BrowserRouter>
                  {/* 전역 시스템 컴포넌트들 */}
                  <GlobalErrorHandler />
                  <NetworkMonitor />
                  <TTSManager />
                  
                  {/* 오프라인 알림 배너 */}
                  <OfflineBanner />
                  
                  <Routes>
                    {/* 공개 페이지 */}
                    <Route 
                      path="/" 
                      element={
                        <PageWrapper pageName="Home">
                          <Home />
                        </PageWrapper>
                      } 
                    />
                    <Route 
                      path="/article/:id" 
                      element={
                        <PageWrapper pageName="Article">
                          <ArticleDetail />
                        </PageWrapper>
                      } 
                    />
                    <Route 
                      path="/search" 
                      element={
                        <PageWrapper pageName="Search">
                          <Search />
                        </PageWrapper>
                      } 
                    />
                    <Route 
                      path="/date" 
                      element={
                        <PageWrapper pageName="Date">
                          <DatePage />
                        </PageWrapper>
                      } 
                    />
                    
                    {/* 인증이 필요한 페이지 */}
                    <Route 
                      path="/wordbook" 
                      element={
                        <AuthGuard>
                          <PageWrapper pageName="Wordbook">
                            <Wordbook />
                          </PageWrapper>
                        </AuthGuard>
                      } 
                    />
                    <Route 
                      path="/like" 
                      element={
                        <PageWrapper pageName="Liked Articles">
                          <Like />
                        </PageWrapper>
                      } 
                    />
                    <Route 
                      path="/profile" 
                      element={
                        <AuthGuard>
                          <PageWrapper pageName="Profile">
                            <Profile />
                          </PageWrapper>
                        </AuthGuard>
                      } 
                    />
                    <Route 
                      path="/settings" 
                      element={
                        <AuthGuard>
                          <PageWrapper pageName="Settings">
                            <Settings />
                          </PageWrapper>
                        </AuthGuard>
                      } 
                    />
                    <Route 
                      path="/dashboard" 
                      element={
                        <AuthGuard requireAdmin={true}>
                          <PageWrapper pageName="Dashboard">
                            <BlogStyleDashboard />
                          </PageWrapper>
                        </AuthGuard>
                      } 
                    />
                  </Routes>
                </BrowserRouter>
              </ArticlesProvider>
            </DataProvider>
          </AuthProvider>
        </EnhancedToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
