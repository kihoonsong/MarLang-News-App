import React, { useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { DataProvider } from './contexts/DataContext';
import { AuthProvider } from './contexts/AuthContext';
import { ArticlesProvider } from './contexts/ArticlesContext';
import { ToastProvider } from './components/ToastProvider';
import ErrorBoundary from './components/ErrorBoundary';
import AuthGuard from './components/AuthGuard';
import Home from './pages/Home';
import ArticleDetail from './pages/ArticleDetail';
import Search from './pages/Search';
import Wordbook from './pages/Wordbook';
import Like from './pages/Like';
import DatePage from './pages/Date';
import Profile from './pages/Profile';
import Dashboard from './pages/FullDashboard';
import ModernDashboard from './pages/ModernDashboard';
import BlogStyleDashboard from './pages/BlogStyleDashboard';
import SimpleDashboardTest from './pages/SimpleDashboardTest';
import Settings from './pages/Settings';

// 전역 TTS 관리 컴포넌트
const TTSManager = () => {
  const location = useLocation();

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

  return null; // 렌더링하지 않음
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

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ToastProvider>
          <AuthProvider>
            <DataProvider>
              <ArticlesProvider>
                <BrowserRouter>
                  <TTSManager />
                  <Routes>
                    {/* 공개 페이지 */}
                    <Route path="/" element={<Home />} />
                    <Route path="/article/:id" element={<ArticleDetail />} />
                    <Route path="/search" element={<Search />} />
                    <Route 
                      path="/date" 
                      element={
                        <ErrorBoundary>
                          <DatePage />
                        </ErrorBoundary>
                      } 
                    />
                    
                    {/* 인증이 필요한 페이지 */}
                    <Route 
                      path="/wordbook" 
                      element={
                        <AuthGuard>
                          <Wordbook />
                        </AuthGuard>
                      } 
                    />
                    <Route 
                      path="/like" 
                      element={<Like />} 
                    />
                    <Route 
                      path="/profile" 
                      element={
                        <AuthGuard>
                          <Profile />
                        </AuthGuard>
                      } 
                    />
                    <Route 
                      path="/settings" 
                      element={
                        <AuthGuard>
                          <Settings />
                        </AuthGuard>
                      } 
                    />
                    <Route 
                      path="/dashboard" 
                      element={
                        <AuthGuard requireAdmin={true}>
                          <BlogStyleDashboard />
                        </AuthGuard>
                      } 
                    />
                    <Route 
                      path="/dashboard-new" 
                      element={
                        <AuthGuard requireAdmin={true}>
                          <ModernDashboard />
                        </AuthGuard>
                      } 
                    />
                    <Route 
                      path="/admin" 
                      element={
                        <AuthGuard requireAdmin={true}>
                          <Dashboard />
                        </AuthGuard>
                      } 
                    />
                  </Routes>
                </BrowserRouter>
              </ArticlesProvider>
            </DataProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
