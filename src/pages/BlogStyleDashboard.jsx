import React, { useState, useEffect } from 'react';
import {
  Box, Tabs, Tab, Container, Snackbar, Alert, CircularProgress, Typography
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useArticles } from '../contexts/ArticlesContext';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import DashboardStats from '../components/DashboardStats';
import ArticleManagement from '../components/ArticleManagement';
import CategoryManagement from '../components/CategoryManagement';
import MemberManagement from '../components/MemberManagement';
import { DashboardContainer } from '../components/DashboardStyles';

const BlogStyleDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, getAllUsers, updateUserRole, deleteUser } = useAuth();
  const {
    allArticles,
    categories,
    loading: articlesLoading,
    error: articlesError,
    refreshArticles,
    addArticle,
    updateArticle,
    deleteArticle,
    updateCategories,
  } = useArticles();
  
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 10;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const getCurrentPageArticles = () => {
    const startIndex = (currentPage - 1) * articlesPerPage;
    return allArticles.slice(startIndex, startIndex + articlesPerPage);
  };

  const totalPages = Math.ceil(allArticles.length / articlesPerPage);

  const renderTabContent = () => {
    if (authLoading || articlesLoading) {
      return <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>;
    }
    if (articlesError) {
      return <Alert severity="error" sx={{ m: 3 }}>{articlesError}</Alert>;
    }
    switch (activeTab) {
      case 0:
        return <DashboardStats 
          user={user}
          stats={{ 
            totalArticles: allArticles.length,
            categories: categories.length
          }} 
          categoryStats={[]}
          userAnalytics={{}}
          lastUpdate={new Date()}
        />;
      case 1:
        return <ArticleManagement 
          articles={getCurrentPageArticles()} 
          allArticles={allArticles}
          totalArticles={allArticles.length} 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
          onAddArticle={addArticle} 
          onUpdateArticle={updateArticle} 
          onDeleteArticle={deleteArticle} 
          onRefreshArticles={refreshArticles} 
          editableCategories={(categories || []).filter(c => c.type === 'category').map(c => c.name)} 
          setSnackbar={setSnackbar} 
        />;
      case 2:
        return <CategoryManagement allEditableCategories={categories || []} onUpdateCategories={updateCategories} setSnackbar={setSnackbar} />;
      case 3:
        return <MemberManagement 
          getAllUsers={getAllUsers}
          updateUserRole={updateUserRole}
          deleteUser={deleteUser}
          setSnackbar={setSnackbar}
        />;
      default:
        return null;
    }
  };

  return (
    <>
      <MobileNavigation />
      <MobileContentWrapper>
        <Container maxWidth="xl">
          <DashboardContainer>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} variant="scrollable" scrollButtons="auto">
                <Tab label="📊 대시보드" />
                <Tab label="📰 기사 관리" />
                <Tab label="📂 카테고리" />
                <Tab label="👥 회원 관리" />
              </Tabs>
            </Box>
            {renderTabContent()}
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
              <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
            </Snackbar>
          </DashboardContainer>
        </Container>
      </MobileContentWrapper>
    </>
  );
};

export default BlogStyleDashboard;