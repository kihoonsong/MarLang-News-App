import React, { useState, useEffect } from 'react';
import {
  Box, Tabs, Tab, Container, Snackbar, Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useArticles } from '../contexts/ArticlesContext';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';

// 분리된 컴포넌트들 import
import DashboardStats from '../components/DashboardStats';
import ArticleManagement from '../components/ArticleManagement';
import CategoryManagement from '../components/CategoryManagement';
import MemberManagement from '../components/MemberManagement';
import { DashboardContainer } from '../components/DashboardStyles';

// 기본 카테고리 구조
const homeCategories = [
  { id: 'recent', name: 'Recent', type: 'recent' },
  { id: 'technology', name: 'Technology', type: 'category' },
  { id: 'science', name: 'Science', type: 'category' },
  { id: 'business', name: 'Business', type: 'category' },
  { id: 'culture', name: 'Culture', type: 'category' },
  { id: 'society', name: 'Society', type: 'category' },
  { id: 'popular', name: 'Popular', type: 'popular' }
];

const BlogStyleDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const {
    allArticles,
    setAllArticles,
    loading,
    getRecentArticles,
    getPopularArticles,
    getArticlesByCategory,
    refreshArticles,
    deleteArticle,
    updateArticles
  } = useArticles();
  
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // 카테고리 관리 상태
  const [allEditableCategories, setAllEditableCategories] = useState(() => {
    const saved = localStorage.getItem('marlang_categories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return homeCategories;
      }
    }
    return homeCategories;
  });

  // 편집 가능한 카테고리 목록
  const editableCategories = allEditableCategories
    .filter(cat => cat.type === 'category')
    .map(cat => cat.name);

  // 페이지네이션 상태 추가
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 10;

  // 현재 페이지에 표시할 기사들 계산
  const getCurrentPageArticles = () => {
    const startIndex = (currentPage - 1) * articlesPerPage;
    const endIndex = startIndex + articlesPerPage;
    return allArticles.slice(startIndex, endIndex);
  };

  // 전체 페이지 수 계산
  const totalPages = Math.ceil(allArticles.length / articlesPerPage);

  // 페이지 변경 함수
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 실시간 통계 업데이트 (30초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // 인증 확인
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // 카테고리 변경 감지 및 동기화
  useEffect(() => {
    const handleCategoryUpdate = () => {
      const saved = localStorage.getItem('marlang_categories');
      if (saved) {
        try {
          const categories = JSON.parse(saved);
          setAllEditableCategories(categories);
        } catch (e) {
          console.error('Failed to parse categories:', e);
        }
      }
    };

    window.addEventListener('categoriesUpdated', handleCategoryUpdate);
    return () => {
      window.removeEventListener('categoriesUpdated', handleCategoryUpdate);
    };
  }, []);

  // 세션 추적
  useEffect(() => {
    sessionStorage.setItem('marlang_session', 'active');
    
    const handleBeforeUnload = () => {
      sessionStorage.removeItem('marlang_session');
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // 회원 데이터 가져오기
  const getMembers = () => {
    const users = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('marlang_user_')) {
        try {
          const userData = JSON.parse(localStorage.getItem(key));
          if (userData && userData.email) {
            const userId = key.replace('marlang_user_', '');
            const userLikedArticles = JSON.parse(localStorage.getItem(`marlang_liked_articles_${userId}`) || '[]');
            const userSavedWords = JSON.parse(localStorage.getItem(`marlang_saved_words_${userId}`) || '[]');
            
            const viewHistory = JSON.parse(localStorage.getItem(`marlang_view_history_${userId}`) || '[]');
            const uniqueReadArticles = new Set([
              ...userLikedArticles.map(a => a.id),
              ...viewHistory
            ]).size;
            
            users.push({
              ...userData,
              id: userId,
              likedArticles: userLikedArticles,
              savedWords: userSavedWords,
              readArticles: uniqueReadArticles,
              joinDate: userData.createdAt || new Date().toISOString(),
              lastActive: userData.lastLogin || userData.lastActivity || new Date().toISOString(),
              status: 'active'
            });
          }
        } catch (e) {
          console.error('Failed to parse user data:', e);
        }
      }
    }
    
    return users;
  };

  // 현재 접속자 수 계산
  const getCurrentUsers = () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const members = getMembers();
    
    const activeUsers = members.filter(member => 
      new Date(member.lastActive) > oneHourAgo
    ).length;
    
    let currentSessionUsers = 0;
    try {
      if (sessionStorage.getItem('marlang_session')) {
        currentSessionUsers = 1;
      }
    } catch (e) {
      console.error('Error checking session:', e);
    }
    
    const totalActive = Math.max(activeUsers, isAuthenticated ? 1 : 0, currentSessionUsers);
    return Math.min(totalActive, members.length);
  };

  // 실제 총 좋아요 수 계산
  const getTotalActualLikes = () => {
    let totalLikes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('marlang_liked_articles_')) {
        try {
          const likedArticles = JSON.parse(localStorage.getItem(key) || '[]');
          totalLikes += likedArticles.length;
        } catch (e) {
          console.error('Failed to parse liked articles:', e);
        }
      }
    }
    return totalLikes;
  };

  // 실제 총 조회수 계산
  const getTotalActualViews = () => {
    let totalViews = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('marlang_view_history_')) {
        try {
          const viewHistory = JSON.parse(localStorage.getItem(key) || '[]');
          totalViews += viewHistory.length;
        } catch (e) {
          console.error('Failed to parse view history:', e);
        }
      }
    }
    return totalViews;
  };

  // 고급 통계 계산
  const getAdvancedStats = () => {
    const members = getMembers();
    const totalActualLikes = getTotalActualLikes();
    const totalActualViews = getTotalActualViews();
    
    const articleViews = allArticles.reduce((sum, article) => sum + (article.views || 0), 0);
    const articleLikes = allArticles.reduce((sum, article) => sum + (article.likes || 0), 0);
    
    const todayArticles = allArticles.filter(article => {
      const today = new Date().toDateString();
      const articleDate = new Date(article.publishedAt).toDateString();
      return today === articleDate;
    }).length;

    const todayMembers = members.filter(member => {
      const today = new Date().toDateString();
      const joinDate = new Date(member.joinDate).toDateString();
      return today === joinDate;
    }).length;

    return {
      totalArticles: allArticles.length,
      totalViews: Math.max(totalActualViews, articleViews),
      totalLikes: Math.max(totalActualLikes, articleLikes),
      todayArticles,
      totalMembers: members.length,
      todayMembers,
      currentUsers: getCurrentUsers(),
      categories: editableCategories.length,
      totalWords: members.reduce((sum, member) => sum + member.savedWords.length, 0),
      avgReadArticles: members.length > 0 ? Math.round(members.reduce((sum, member) => sum + member.readArticles, 0) / members.length) : 0,
      avgSavedWords: members.length > 0 ? Math.round(members.reduce((sum, member) => sum + member.savedWords.length, 0) / members.length) : 0
    };
  };

  // 카테고리별 통계 계산
  const getCategoryStats = () => {
    const saved = localStorage.getItem('marlang_categories');
    let currentCategories = homeCategories;
    
    if (saved) {
      try {
        currentCategories = JSON.parse(saved);
      } catch {
        currentCategories = homeCategories;
      }
    }
    
    return currentCategories.map(category => {
      let articles = [];
      if (category.type === 'recent') {
        articles = getRecentArticles(10);
      } else if (category.type === 'popular') {
        articles = getPopularArticles(10);
      } else if (category.type === 'category') {
        articles = getArticlesByCategory(category.name);
      }
      
      return {
        ...category,
        count: articles.length,
        totalViews: articles.reduce((sum, a) => sum + (a.views || 0), 0),
        totalLikes: articles.reduce((sum, a) => sum + (a.likes || 0), 0),
        avgEngagement: articles.length > 0 ? 
          Math.round((articles.reduce((sum, a) => sum + (a.likes || 0), 0) / articles.reduce((sum, a) => sum + Math.max(a.views || 1, 1), 0)) * 100) : 0
      };
    });
  };

  // 사용자 행동 분석
  const getUserAnalytics = () => {
    const members = getMembers();
    
    const usersByReadingFrequency = {
      high: members.filter(m => m.readArticles >= 15).length,
      medium: members.filter(m => m.readArticles >= 5 && m.readArticles < 15).length,
      low: members.filter(m => m.readArticles < 5).length
    };

    const usersByLearningActivity = {
      active: members.filter(m => m.savedWords.length >= 20).length,
      moderate: members.filter(m => m.savedWords.length >= 5 && m.savedWords.length < 20).length,
      passive: members.filter(m => m.savedWords.length < 5).length
    };

    const topLearners = members
      .map(member => ({
        ...member,
        learningScore: (member.readArticles * 2) + (member.savedWords.length * 3) + (member.likedArticles.length * 1)
      }))
      .sort((a, b) => b.learningScore - a.learningScore)
      .slice(0, 10);

    return {
      usersByReadingFrequency,
      usersByLearningActivity,
      topLearners,
      totalLearningActivities: members.reduce((sum, m) => sum + m.readArticles + m.savedWords.length + m.likedArticles.length, 0)
    };
  };

  // 카테고리 업데이트 핸들러
  const updateCategoriesAndNotify = (newCategories) => {
    setAllEditableCategories(newCategories);
    localStorage.setItem('marlang_categories', JSON.stringify(newCategories));
    window.dispatchEvent(new CustomEvent('categoriesUpdated'));
  };

  // 기사 삭제 핸들러
  const handleDeleteArticle = (articleId) => {
    if (window.confirm('정말로 이 기사를 삭제하시겠습니까?')) {
      const updatedArticles = allArticles.filter(article => article.id !== articleId);
      setAllArticles(updatedArticles);
      localStorage.setItem('marlang_articles', JSON.stringify(updatedArticles));

      // 현재 페이지가 마지막 페이지이고 해당 페이지에 기사가 하나뿐이었다면 이전 페이지로 이동
      const newTotalPages = Math.ceil(updatedArticles.length / articlesPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }

      toast.success('기사가 삭제되었습니다');
      
      // 브라우저 이벤트 발송
    window.dispatchEvent(new CustomEvent('articleUpdated', {
        detail: { type: 'delete', article: { id: articleId } }
      }));
    }
  };

  // handleAddArticle 함수 수정
  const handleAddArticle = () => {
    // ... existing validation code ...

    const newArticle = {
      id: Date.now(),
      title: newArticleData.title,
      summary: newArticleData.summary,
      category: newArticleData.category,
      image: newArticleData.image,
      content: newArticleData.content || newArticleData.summary,
      publishedAt: newArticleData.publishTime ? new Date(newArticleData.publishTime).toISOString() : new Date().toISOString(),
      date: newArticleData.publishTime ? new Date(newArticleData.publishTime).toISOString() : new Date().toISOString(),
      status: newArticleData.publishType === 'immediate' ? 'published' : 'scheduled',
      views: 0
    };

    const updatedArticles = [newArticle, ...allArticles];
    setAllArticles(updatedArticles);
    localStorage.setItem('marlang_articles', JSON.stringify(updatedArticles));

    // 새 기사 추가 후 첫 번째 페이지로 이동
    setCurrentPage(1);
    
    // ... rest of the function ...
  };

  const stats = getAdvancedStats();
  const categoryStats = getCategoryStats();
  const userAnalytics = getUserAnalytics();

  // 탭별 컨텐츠 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <DashboardStats
            user={user}
            stats={stats}
            categoryStats={categoryStats}
            userAnalytics={userAnalytics}
            lastUpdate={lastUpdate}
          />
        );
      case 1:
        return (
          <ArticleManagement
            allArticles={allArticles}
            onUpdateArticles={updateArticles}
            onDeleteArticle={handleDeleteArticle}
            onRefreshArticles={refreshArticles}
            editableCategories={editableCategories}
            setSnackbar={setSnackbar}
          />
        );
      case 2:
        return (
          <CategoryManagement
            allEditableCategories={allEditableCategories}
            onUpdateCategories={updateCategoriesAndNotify}
            setSnackbar={setSnackbar}
          />
        );
      case 3:
          return (
          <MemberManagement
            getMembers={getMembers}
            setSnackbar={setSnackbar}
          />
        );
      case 4:
    return (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <h2>분석</h2>
            <p>분석 컴포넌트는 개발 중입니다.</p>
      </Box>
    );
      case 5:
    return (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <h2>공지사항 관리</h2>
            <p>공지사항 관리 컴포넌트는 개발 중입니다.</p>
      </Box>
    );
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
          {/* 탭 네비게이션 */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={activeTab} 
                onChange={(e, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="📊 대시보드" />
                <Tab label="📰 기사 관리" />
                <Tab label="📂 카테고리" />
              <Tab label="👥 회원 관리" />
                <Tab label="📈 분석" />
                <Tab label="📢 공지사항" />
            </Tabs>
          </Box>

            {/* 탭 컨텐츠 */}
            {renderTabContent()}

        {/* 스낵바 */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
          </DashboardContainer>
        </Container>
      </MobileContentWrapper>
    </>
  );
};

export default BlogStyleDashboard; 
