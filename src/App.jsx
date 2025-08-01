import React, { useEffect } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { DataProvider } from './contexts/DataContext';
import { AuthProvider } from './contexts/AuthContext';
import { ArticlesProvider } from './contexts/ArticlesContext';
import { CustomThemeProvider } from './contexts/ThemeContext';
import { AdFitProvider } from './components/ads';

// 향상된 에러 처리 시스템 import
import ErrorBoundary from './components/ErrorBoundary';
import {
  EnhancedToastProvider,
  useEnhancedToast,
  setupGlobalErrorHandling
} from './components/EnhancedToastProvider';
import {
  NetworkStatusIndicator
} from './components/EnhancedLoadingComponents';
import { useNetworkStatus } from './hooks/useNetworkStatus';

import AuthGuard from './components/AuthGuard';
import SafePageWrapper from './components/SafePageWrapper';
// SocialShareMeta는 각 페이지에서 개별적으로 사용

// 페이지 컴포넌트들을 동적 import로 변경 (코드 스플리팅)
const Home = React.lazy(() => import('./pages/Home'));
const ArticleDetail = React.lazy(() => import('./pages/ArticleDetail'));
const Search = React.lazy(() => import('./pages/Search'));
const Wordbook = React.lazy(() => import('./pages/Wordbook'));
const Like = React.lazy(() => import('./pages/Like'));
const DatePage = React.lazy(() => import('./pages/Date'));
const Profile = React.lazy(() => import('./pages/Profile'));
const BlogStyleDashboard = React.lazy(() => import('./pages/BlogStyleDashboard'));
const CategoryPage = React.lazy(() => import('./pages/CategoryPageFixed'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = React.lazy(() => import('./pages/TermsOfService'));
const Contact = React.lazy(() => import('./pages/Contact'));
const NaverCallback = React.lazy(() => import('./pages/NaverCallback'));
const LineCallback = React.lazy(() => import('./pages/LineCallback'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const TTSTest = React.lazy(() => import('./pages/TTSTest'));
const SocialMetaTest = React.lazy(() => import('./pages/SocialMetaTest'));
const SocialMetaDebug = React.lazy(() => import('./pages/SocialMetaDebug'));
const SocialMetricsDashboard = React.lazy(() => import('./pages/SocialMetricsDashboard'));

// 전역 TTS 관리 컴포넌트 (향상됨)
const TTSManager = () => {
  const location = useLocation();
  const { isOnline } = useNetworkStatus();
  const { warning } = useEnhancedToast();

  useEffect(() => {
    // 가장 확실한 방법으로 TTS를 중지하는 함수
    const forceStopTTS = () => {
      try {
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

        // UnifiedTTS 인스턴스들 정리
        if (window.unifiedTTSInstances) {
          window.unifiedTTSInstances.forEach(instance => {
            try {
              if (instance && instance.stop) {
                instance.stop();
              }
            } catch (error) {
              console.warn('UnifiedTTS 인스턴스 정리 실패:', error);
            }
          });
          window.unifiedTTSInstances = [];
        }

        // DOM에서 활성 문장 하이라이트 제거
        try {
          const activeElements = document.querySelectorAll('.active-sentence');
          activeElements.forEach(el => {
            el.classList.remove('active-sentence');
          });
        } catch (domError) {
          console.warn('DOM 정리 실패:', domError);
        }

        if (import.meta.env.DEV) {
          console.log('🔇 전역 TTS 강제 중지 완료');
        }
      } catch (error) {
        console.error('TTS 강제 중지 중 오류:', error);
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
      // 오프라인 TTS 경고 제거
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
    // 네트워크 상태 로깅 제거
  }, [isOnline]);

  return null;
};

// VoiceManager 초기화 컴포넌트
const VoiceManagerInitializer = () => {
  useEffect(() => {
    // VoiceManager 싱글톤 인스턴스 초기화
    import('./utils/VoiceManager').then(({ getVoiceManager }) => {
      const manager = getVoiceManager();
      if (import.meta.env.DEV) {
        console.log('🎵 VoiceManager 초기화 완료');
      }
    });
  }, []);

  return null;
};

// Prefetch frequently visited routes to improve perceived speed
const RoutePrefetcher = () => {
  useEffect(() => {
    const prefetchArticle = () => import('./pages/ArticleDetail');
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(prefetchArticle);
    } else {
      setTimeout(prefetchArticle, 2000);
    }
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

// Social → Article 경로 클라이언트 리다이렉트 (SPA 내 이동 문제 해결)
const SocialArticleRedirect = () => {
  const { articleId } = useParams();
  return <Navigate to={`/article/${articleId}`} replace />;
};

// 기존 PageWrapper는 SafePageWrapper로 대체됨

// 라우터 에러 핸들러
const RouterErrorHandler = () => {
  const location = useLocation();
  
  useEffect(() => {
    // 라우트 변경 시 전역 상태 정리
    try {
      if (window.globalStopTTS) {
        window.globalStopTTS();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } catch (error) {
      console.warn('라우트 변경 시 정리 작업 실패:', error);
    }
  }, [location.pathname]);

  return null;
};

function App() {
  return (
    <ErrorBoundary>
      <CustomThemeProvider>
        <EnhancedToastProvider>
          <AuthProvider>
            <DataProvider>
              <ArticlesProvider>
                <AdFitProvider>
                <BrowserRouter>
                  {/* 전역 시스템 컴포넌트들 */}
                  <GlobalErrorHandler />
                  <NetworkMonitor />
                  <VoiceManagerInitializer />
                  <TTSManager />
                  <RouterErrorHandler />
                  <RoutePrefetcher />



                  <Routes>
                    {/* 공개 페이지 */}
                    <Route
                      path="/"
                      element={
                        <SafePageWrapper pageName="Home">
                          <Home />
                        </SafePageWrapper>
                      }
                    />
                    <Route
                      path="/article/:id"
                      element={
                        <SafePageWrapper pageName="Article">
                          <ArticleDetail />
                        </SafePageWrapper>
                      }
                    />
                    <Route
                      path="/search"
                      element={
                        <SafePageWrapper pageName="Search">
                          <Search />
                        </SafePageWrapper>
                      }
                    />
                    <Route
                      path="/date"
                      element={
                        <SafePageWrapper pageName="Date">
                          <DatePage />
                        </SafePageWrapper>
                      }
                    />

                    {/* 단어장 페이지 (로그인 선택사항) */}
                    <Route
                      path="/wordbook"
                      element={
                        <SafePageWrapper pageName="Wordbook">
                          <Wordbook />
                        </SafePageWrapper>
                      }
                    />

                    {/* 인증이 필요한 페이지 */}
                    <Route
                      path="/like"
                      element={
                        <SafePageWrapper pageName="Liked Articles">
                          <Like />
                        </SafePageWrapper>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <SafePageWrapper pageName="Profile">
                          <Profile />
                        </SafePageWrapper>
                      }
                    />
                    <Route
                      path="/dashboard"
                      element={
                        <AuthGuard requireAdmin={true}>
                          <SafePageWrapper pageName="Dashboard">
                            <BlogStyleDashboard />
                          </SafePageWrapper>
                        </AuthGuard>
                      }
                    />
                    <Route
                      path="/privacy"
                      element={
                        <SafePageWrapper pageName="Privacy Policy">
                          <PrivacyPolicy />
                        </SafePageWrapper>
                      }
                    />
                    <Route
                      path="/terms"
                      element={
                        <SafePageWrapper pageName="Terms of Service">
                          <TermsOfService />
                        </SafePageWrapper>
                      }
                    />
                    <Route
                      path="/contact"
                      element={
                        <SafePageWrapper pageName="Contact">
                          <Contact />
                        </SafePageWrapper>
                      }
                    />

                    {/* 소셜 로그인 콜백 */}
                    <Route
                      path="/auth/naver/callback"
                      element={
                        <SafePageWrapper pageName="Naver Login">
                          <NaverCallback />
                        </SafePageWrapper>
                      }
                    />
                    <Route
                      path="/auth/line/callback"
                      element={
                        <SafePageWrapper pageName="Line Login">
                          <LineCallback />
                        </SafePageWrapper>
                      }
                    />

                    {/* 소셜 메트릭 대시보드 (관리자 전용) */}
                    <Route
                      path="/social/article/:articleId"
                      element={<SocialArticleRedirect />}
                    />

                    <Route
                      path="/social-metrics"
                      element={
                        <AuthGuard requireAdmin={true}>
                          <SafePageWrapper pageName="Social Metrics">
                            <SocialMetricsDashboard />
                          </SafePageWrapper>
                        </AuthGuard>
                      }
                    />

                    {/* 개발 환경 전용 페이지들 */}
                    {import.meta.env.DEV && (
                      <>
                        <Route
                          path="/tts-test"
                          element={
                            <SafePageWrapper pageName="TTS Test">
                              <TTSTest />
                            </SafePageWrapper>
                          }
                        />
                        <Route
                          path="/social-meta-test"
                          element={
                            <SafePageWrapper pageName="Social Meta Test">
                              <SocialMetaTest />
                            </SafePageWrapper>
                          }
                        />
                        <Route
                          path="/social-meta-debug"
                          element={
                            <SafePageWrapper pageName="Social Meta Debug">
                              <SocialMetaDebug />
                            </SafePageWrapper>
                          }
                        />
                      </>
                    )}

                    {/* 카테고리 페이지 - 마지막에 배치하여 다른 라우트와 충돌 방지 */}
                    <Route
                      path="/:categorySlug"
                      element={
                        <SafePageWrapper pageName="Category">
                          <CategoryPage />
                        </SafePageWrapper>
                      }
                    />

                    {/* 404 페이지 - 맨 마지막에 배치 */}
                    <Route
                      path="*"
                      element={
                        <SafePageWrapper pageName="Not Found">
                          <NotFound />
                        </SafePageWrapper>
                      }
                    />
                  </Routes>
                </BrowserRouter>
                </AdFitProvider>
              </ArticlesProvider>
            </DataProvider>
          </AuthProvider>
        </EnhancedToastProvider>
      </CustomThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
