import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
