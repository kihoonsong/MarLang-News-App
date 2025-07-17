import React, { useEffect } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { DataProvider } from './contexts/DataContext';
import { AuthProvider } from './contexts/AuthContext';
import { ArticlesProvider } from './contexts/ArticlesContext';
import { CustomThemeProvider } from './contexts/ThemeContext';
import { setupVoicesChangedListener, addVoicesChangedListener } from './utils/speechUtils';

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
const CategoryPage = React.lazy(() => import('./pages/CategoryPage'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const Contact = React.lazy(() => import('./pages/Contact'));
const NaverCallback = React.lazy(() => import('./pages/NaverCallback'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

// 전역 TTS 관리 컴포넌트 (향상됨)
const TTSManager = () => {
  const location = useLocation();
  const { isOnline } = useNetworkStatus();
  const { warning } = useEnhancedToast();

  useEffect(() => {
    // 가장 확실한 방법으로 TTS를 중지하는 함수
    const forceStopTTS = () => {
      if (window.speechSynthesis) {
        // 진행 중인 발화를 즉시 중단
        window.speechSynthesis.cancel();
      }
      
      // 전역 TTS 중지 함수 호출
      if (window.stopCurrentSpeech) {
        window.stopCurrentSpeech();
      }
      
      // 다른 컴포넌트에서 실행 중인 TTS도 중지
      if (window.stopCurrentTTS) {
        window.stopCurrentTTS();
      }
    };

    // location이 변경될 때마다 TTS를 중지
    forceStopTTS();
    
    // 전역 중지 함수 등록
    window.globalStopTTS = forceStopTTS;

    // 컴포넌트가 언마운트될 때도 TTS 중지
    return () => {
      forceStopTTS();
    };
  }, [location]); // 라우트 경로가 변경될 때마다 이 효과를 재실행합니다.

  // TTS 기능 향상: 실제 사용 시에만 오프라인 경고 표시
  useEffect(() => {
    // 전역 TTS 함수에 오프라인 체크 기능 추가
    window.checkTTSAvailability = () => {
      if (!isOnline) {
        warning('TTS may not work properly while offline', {
          group: 'tts-offline',
          duration: 4000
        });
        return false;
      }
      return true;
    };

    // TTS 시작 시 호출할 함수
    window.startTTSWithCheck = (text, options = {}) => {
      if (window.checkTTSAvailability() && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        Object.assign(utterance, options);
        window.speechSynthesis.speak(utterance);
        return true;
      }
      return false;
    };
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
    if (import.meta.env.DEV) {
      console.log('🛡️ Global error handling initialized');
    }
  }, [error]);

  return null;
};

// 네트워크 상태 모니터링 컴포넌트
const NetworkMonitor = () => {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const { warning } = useEnhancedToast();

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

// 음성 목록 관리 컴포넌트 (실시간 조회 방식으로 변경)
const VoiceManager = () => {
  useEffect(() => {
    // voiceschanged 이벤트 영구 구독 설정
    const removeVoicesListener = setupVoicesChangedListener();

    // 음성 변경 이벤트 리스너 등록
    const removeAppListener = addVoicesChangedListener((voices) => {
      console.log('🔄 앱 레벨 음성 설정 변경 감지됨:', voices.length, '개');
    });

    return () => {
      removeVoicesListener && removeVoicesListener();
      removeAppListener();
    };
  }, []);

  return null;
};



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
      <CustomThemeProvider>
        <EnhancedToastProvider>
          <AuthProvider>
            <DataProvider>
              <ArticlesProvider>
                <BrowserRouter>
                  {/* 전역 시스템 컴포넌트들 */}
                  <GlobalErrorHandler />
                  <NetworkMonitor />
                  <VoiceManager />
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
                    
                    {/* 단어장 페이지 (로그인 선택사항) */}
                    <Route 
                      path="/wordbook" 
                      element={
                        <PageWrapper pageName="Wordbook">
                          <Wordbook />
                        </PageWrapper>
                      } 
                    />
                    
                    {/* 인증이 필요한 페이지 */}
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
                        <PageWrapper pageName="Profile">
                          <Profile />
                        </PageWrapper>
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
                    <Route 
                      path="/privacy" 
                      element={
                        <PageWrapper pageName="Privacy Policy">
                          <PrivacyPolicy />
                        </PageWrapper>
                      } 
                    />
                    <Route 
                      path="/contact" 
                      element={
                        <PageWrapper pageName="Contact">
                          <Contact />
                        </PageWrapper>
                      } 
                    />
                    
                    {/* 네이버 로그인 콜백 */}
                    <Route 
                      path="/auth/naver/callback" 
                      element={
                        <PageWrapper pageName="Naver Login">
                          <NaverCallback />
                        </PageWrapper>
                      } 
                    />
                    
                    {/* 카테고리 페이지 - 마지막에 배치하여 다른 라우트와 충돌 방지 */}
                    <Route 
                      path="/:categorySlug" 
                      element={
                        <PageWrapper pageName="Category">
                          <CategoryPage />
                        </PageWrapper>
                      } 
                    />
                    
                    {/* 404 페이지 - 맨 마지막에 배치 */}
                    <Route 
                      path="*" 
                      element={
                        <PageWrapper pageName="Not Found">
                          <NotFound />
                        </PageWrapper>
                      } 
                    />
                  </Routes>
                </BrowserRouter>
              </ArticlesProvider>
            </DataProvider>
          </AuthProvider>
        </EnhancedToastProvider>
      </CustomThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
