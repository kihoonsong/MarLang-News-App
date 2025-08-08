import React, { useState, useEffect } from 'react';
import {
  Box, Tabs, Tab, Container, Snackbar, Alert, CircularProgress, Typography, Button, IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useArticles } from '../contexts/ArticlesContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import DashboardStats from '../components/DashboardStats';
import DataValidationInfo from '../components/DataValidationInfo';
import ArticleManagement from '../components/ArticleManagement';
import CategoryManagement from '../components/CategoryManagement';
import MemberManagement from '../components/MemberManagement';
import SitemapManagement from '../components/SitemapManagement';
import { DashboardContainer } from '../components/DashboardStyles';
import LogoutIcon from '@mui/icons-material/Logout';

const BlogStyleDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, getAllUsers, updateUserRole, deleteUser, signOut } = useAuth();
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
  } = useArticles() || {};
  
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 10;
  const [dashboardStats, setDashboardStats] = useState({
    totalArticles: 0,
    totalViews: 0,
    totalLikes: 0,
    totalMembers: 0,
    todayArticles: 0,
    todayMembers: 0,
    totalWords: 0,
    avgReadArticles: 0,
    avgSavedWords: 0,
    categories: 0
  });
  const [categoryStats, setCategoryStats] = useState([]);
  const [userAnalytics, setUserAnalytics] = useState({
    usersByReadingFrequency: { high: 0, medium: 0, low: 0 },
    usersByLearningActivity: { active: 0, moderate: 0, passive: 0 }
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Real data aggregation functions
  const calculateRealStats = async () => {
    try {
      // Get all users
      const allUsers = await getAllUsers();
      
      // Calculate today's data
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const todayArticles = allArticles.filter(article => {
        const publishedDate = new Date(article.publishedAt);
        return publishedDate >= todayStart;
      }).length;
      
      const todayMembers = allUsers.filter(user => {
        const createdDate = user.createdAt?.toDate?.() || new Date(user.createdAt);
        return createdDate >= todayStart;
      }).length;

      // Calculate aggregated statistics
      let totalLikes = 0;
      let totalWords = 0;
      let totalViewRecords = 0;
      let totalArticleViews = 0; // 실제 기사 조회수 합계
      let userReadingStats = { high: 0, medium: 0, low: 0 };
      let userLearningStats = { active: 0, moderate: 0, passive: 0 };

      // 실제 기사 조회수 계산 (정확한 데이터)
      allArticles.forEach(article => {
        totalArticleViews += article.views || 0;
      });

      // Get user data for analytics
      for (const userData of allUsers) {
        try {
          // Get user's liked articles
          const likesRef = collection(db, 'users', userData.id, 'data');
          const likesSnap = await getDocs(likesRef);
          let userLikes = 0;
          let userWords = 0;
          let userViews = 0;

          likesSnap.docs.forEach(doc => {
            const data = doc.data();
            if (doc.id === 'likedArticles' && data.articles) {
              userLikes = data.articles.length;
              totalLikes += userLikes;
            }
            if (doc.id === 'savedWords' && data.words) {
              userWords = data.words.length;
              totalWords += userWords;
            }
            if (doc.id === 'viewRecords' && data.records) {
              userViews = data.records.length;
              totalViewRecords += userViews;
            }
          });

          // Categorize users by reading frequency
          if (userViews >= 15) userReadingStats.high++;
          else if (userViews >= 5) userReadingStats.medium++;
          else userReadingStats.low++;

          // Categorize users by learning activity
          if (userWords >= 50) userLearningStats.active++;
          else if (userWords >= 20) userLearningStats.moderate++;
          else userLearningStats.passive++;
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }

      // Calculate category statistics
      const categoryStatsMap = {};
      allArticles.forEach(article => {
        const category = article.category || 'Uncategorized';
        if (!categoryStatsMap[category]) {
          categoryStatsMap[category] = {
            id: category,
            name: category,
            count: 0,
            totalViews: 0,
            totalLikes: 0
          };
        }
        categoryStatsMap[category].count++;
        categoryStatsMap[category].totalViews += article.views || 0;
        categoryStatsMap[category].totalLikes += article.likes || 0;
      });

      const categoryStatsArray = Object.values(categoryStatsMap).map(cat => ({
        ...cat,
        avgEngagement: cat.count > 0 ? Math.round((cat.totalLikes / cat.count) * 100) / 100 : 0
      }));

      setDashboardStats({
        totalArticles: allArticles.length,
        totalViews: totalArticleViews, // 실제 기사 조회수 사용
        totalLikes: totalLikes,
        totalMembers: allUsers.length,
        todayArticles: todayArticles,
        todayMembers: todayMembers,
        totalWords: totalWords,
        avgReadArticles: allUsers.length > 0 ? Math.round(totalViewRecords / allUsers.length) : 0,
        avgSavedWords: allUsers.length > 0 ? Math.round(totalWords / allUsers.length) : 0,
        categories: categories.length,
        // 디버깅을 위한 추가 정보
        _debug: {
          totalArticleViews: totalArticleViews,
          totalUserViewRecords: totalViewRecords,
          viewsDataSource: 'articles.views' // 데이터 소스 명시
        }
      });

      setCategoryStats(categoryStatsArray);
      setUserAnalytics({
        usersByReadingFrequency: userReadingStats,
        usersByLearningActivity: userLearningStats
      });

    } catch (error) {
      console.error('Error calculating dashboard stats:', error);
      
      // 에러 발생 시에도 기본 통계 제공
      const fallbackArticleViews = allArticles.reduce((sum, article) => sum + (article.views || 0), 0);
      setDashboardStats({
        totalArticles: allArticles.length,
        totalViews: fallbackArticleViews,
        totalLikes: 0,
        totalMembers: 0,
        todayArticles: 0,
        todayMembers: 0,
        totalWords: 0,
        avgReadArticles: 0,
        avgSavedWords: 0,
        categories: categories.length,
        _debug: {
          totalArticleViews: fallbackArticleViews,
          totalUserViewRecords: 0,
          viewsDataSource: 'articles.views (fallback)',
          error: 'Data calculation failed, using fallback'
        }
      });
    }
  };

  useEffect(() => {
    if (!authLoading && !articlesLoading && isAuthenticated && allArticles.length > 0) {
      calculateRealStats();
    }
  }, [authLoading, articlesLoading, isAuthenticated, allArticles, categories]);

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
        return (
          <>
            <DataValidationInfo stats={dashboardStats} />
            <DashboardStats 
              user={user}
              stats={dashboardStats} 
              categoryStats={categoryStats}
              userAnalytics={userAnalytics}
              lastUpdate={new Date()}
            />
          </>
        );
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
      case 4:
        return <SitemapManagement 
          setSnackbar={setSnackbar}
        />;
      default:
        return null;
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  return (
    <>
      <MobileNavigation />
      <MobileContentWrapper>
        <Container maxWidth="xl">
          <DashboardContainer>
            {/* 대시보드 헤더 */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 2,
              p: 2,
              backgroundColor: 'background.paper',
              borderRadius: 1,
              boxShadow: 1
            }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                📊 관리자 대시보드
              </Typography>
              <Button
                variant="outlined"
                color="error"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 'bold'
                }}
              >
                로그아웃
              </Button>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} variant="scrollable" scrollButtons="auto">
                <Tab label="📊 대시보드" />
                <Tab label="📰 기사 관리" />
                <Tab label="📂 카테고리" />
                <Tab label="👥 회원 관리" />
                <Tab label="🗺️ 사이트맵" />
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