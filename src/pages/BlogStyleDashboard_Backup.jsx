import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  AppBar, Toolbar, Typography, Button, Card, CardContent, Grid, TextField, 
  Select, MenuItem, FormControl, InputLabel, Box, Tabs, Tab, Container,
  IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions, 
  Snackbar, Alert, Avatar, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Switch, FormControlLabel, Divider, Badge,
  List, ListItem, ListItemText, ListItemIcon, Accordion, AccordionSummary,
  AccordionDetails, Tooltip, Fab, RadioGroup, Radio, FormLabel, LinearProgress,
  CircularProgress
} from '@mui/material';
import {
  Dashboard as DashboardIcon, Article, Add, Edit, Delete, Save, Cancel,
  Preview, Publish, Visibility, ThumbUp, TrendingUp, People, Settings,
  Refresh, Star, CheckCircle, Warning, Schedule, CloudUpload, Image,
  ExpandMore, Category, DragIndicator, ArrowUpward, ArrowDownward,
  Analytics, School, PersonAdd, Announcement, EmojiEvents, AccessTime
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useArticles } from '../contexts/ArticlesContext';
import { useData } from '../contexts/DataContext';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';

// 홈페이지와 동일한 카테고리 구조
const homeCategories = [
  { id: 'recent', name: 'Recent', type: 'recent' },
  { id: 'technology', name: 'Technology', type: 'category' },
  { id: 'science', name: 'Science', type: 'category' },
  { id: 'business', name: 'Business', type: 'category' },
  { id: 'culture', name: 'Culture', type: 'category' },
  { id: 'society', name: 'Society', type: 'category' },
  { id: 'popular', name: 'Popular', type: 'popular' }
];

// 구독 플랜 정의
const SUBSCRIPTION_PLANS = {
  Free: {
    name: 'Free',
    price: 0,
    monthlyArticleLimit: 10,
    monthlyWordLimit: 50,
    hasAITranslation: false,
    hasOfflineAccess: false,
    hasPrioritySupport: false,
    color: 'default'
  },
  Premium: {
    name: 'Premium',
    price: 9900,
    monthlyArticleLimit: 100,
    monthlyWordLimit: 500,
    hasAITranslation: true,
    hasOfflineAccess: false,
    hasPrioritySupport: false,
    color: 'warning'
  },
  Pro: {
    name: 'Pro',
    price: 19900,
    monthlyArticleLimit: -1, // 무제한
    monthlyWordLimit: -1, // 무제한
    hasAITranslation: true,
    hasOfflineAccess: true,
    hasPrioritySupport: true,
    color: 'success'
  }
};

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
  const { likedArticles, savedWords } = useData();
  
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // 기사 편집 상태
  const [articleDialog, setArticleDialog] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [articleForm, setArticleForm] = useState({
    title: '',
    summary: '',
    content: {
      beginner: '',
      intermediate: '',
      advanced: ''
    },
    category: 'Technology',
    image: '',
    imageFile: null,
    publishType: 'immediate',
    publishedAt: new Date().toISOString().slice(0, 16),
    status: 'published'
  });

  // 카테고리 관리 상태
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [editingCategoryIndex, setEditingCategoryIndex] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [allEditableCategories, setAllEditableCategories] = useState(() => {
    const saved = localStorage.getItem('marlang_categories');
    if (saved) {
      try {
        const categories = JSON.parse(saved);
        return categories;
      } catch {
        return homeCategories;
      }
    }
    return homeCategories;
  });
  const [newCategoryName, setNewCategoryName] = useState('');

  // 편집 가능한 카테고리 목록 (기존 호환성 유지)
  const editableCategories = allEditableCategories
    .filter(cat => cat.type === 'category')
    .map(cat => cat.name);

  // 회원 관리 상태
  const [memberDialog, setMemberDialog] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [roleChangeDialog, setRoleChangeDialog] = useState({ open: false, member: null, newRole: '' });
  const [memberForm, setMemberForm] = useState({
    name: '',
    email: '',
    role: 'User',
    status: 'active',
    // 유료 서비스 관련 필드
    subscriptionPlan: 'Free',
    subscriptionStatus: 'active',
    subscriptionExpiry: '',
    monthlyArticleLimit: 10,
    monthlyWordLimit: 50,
    hasAITranslation: false,
    hasOfflineAccess: false,
    hasPrioritySupport: false
  });

  // 공지사항 관리 상태
  const [noticeDialog, setNoticeDialog] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    type: 'info',
    active: true
  });
  const [notices, setNotices] = useState(() => {
    const saved = localStorage.getItem('marlang_notices');
    return saved ? JSON.parse(saved) : [];
  });

  // 실시간 통계 업데이트 (30초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // 회원 데이터 가져오기 (실제 localStorage 사용자들)
  const getMembers = () => {
    const users = [];
    
    // localStorage에서 실제 사용자들 찾기
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('marlang_user_')) {
        try {
          const userData = JSON.parse(localStorage.getItem(key));
          if (userData && userData.email) {
            const userId = key.replace('marlang_user_', '');
            const userLikedArticles = JSON.parse(localStorage.getItem(`marlang_liked_articles_${userId}`) || '[]');
            const userSavedWords = JSON.parse(localStorage.getItem(`marlang_saved_words_${userId}`) || '[]');
            
            // 실제 읽은 기사 수 계산 (좋아요한 기사 + 조회 기록)
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
              readArticles: uniqueReadArticles, // 실제 읽은 기사 수
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

  // 현재 접속자 수 계산 (실제 기준: 최근 1시간 내 활동 + 현재 세션)
  const getCurrentUsers = () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const members = getMembers();
    
    // 최근 1시간 내 활동한 사용자 수
    const activeUsers = members.filter(member => 
      new Date(member.lastActive) > oneHourAgo
    ).length;
    
    // 현재 세션 사용자들 추가 확인 (sessionStorage 기반)
    let currentSessionUsers = 0;
    try {
      // 현재 브라우저 세션이 활성화되어 있으면 +1
      if (sessionStorage.getItem('marlang_session')) {
        currentSessionUsers = 1;
      }
    } catch (e) {
      console.error('Error checking session:', e);
    }
    
    // 실제 활성 사용자 수 (최소 현재 로그인한 사용자가 있으면 1명)
    const totalActive = Math.max(activeUsers, isAuthenticated ? 1 : 0, currentSessionUsers);
    
    // 최대 사용자 수 제한 (현실적인 범위)
    return Math.min(totalActive, members.length);
  };

  // 세션 추적 시작
  useEffect(() => {
    // 페이지 방문 시 세션 기록
    sessionStorage.setItem('marlang_session', 'active');
    
    // 페이지 떠날 때 세션 정리
    const handleBeforeUnload = () => {
      sessionStorage.removeItem('marlang_session');
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // 실제 총 좋아요 수 계산 (모든 사용자의 좋아요 합계)
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

  // 실제 총 조회수 계산 (모든 사용자의 조회 기록 합계)
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

  // 카테고리 변경사항을 로컬스토리지에 저장하고 홈페이지에 알림
  const updateCategoriesAndNotify = (newCategories) => {
    setAllEditableCategories(newCategories);
    localStorage.setItem('marlang_categories', JSON.stringify(newCategories));
    window.dispatchEvent(new CustomEvent('categoriesUpdated'));
  };

  // 공지사항 저장
  const saveNotices = (newNotices) => {
    setNotices(newNotices);
    localStorage.setItem('marlang_notices', JSON.stringify(newNotices));
    // 홈페이지에 공지사항 업데이트 알림
    window.dispatchEvent(new CustomEvent('noticesUpdated', { detail: newNotices }));
  };

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

  // 3개 본문 탭 상태
  const [activeContentTab, setActiveContentTab] = useState(0);

  // 이미지 파일 업로드 처리
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({ open: true, message: '이미지 파일은 5MB 이하로 업로드해주세요.', severity: 'error' });
        return;
      }

      if (!file.type.startsWith('image/')) {
        setSnackbar({ open: true, message: '이미지 파일만 업로드 가능합니다.', severity: 'error' });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setArticleForm(prev => ({
          ...prev,
          image: e.target.result,
          imageFile: file
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // 고급 통계 계산 (실제 데이터 기반)
  const getAdvancedStats = () => {
    const members = getMembers();
    
    // 실제 좋아요와 조회수 계산
    const totalActualLikes = getTotalActualLikes();
    const totalActualViews = getTotalActualViews();
    
    // ArticlesContext의 데이터도 함께 고려 (기본 조회수/좋아요)
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
      totalViews: Math.max(totalActualViews, articleViews), // 실제 조회수와 기본 조회수 중 큰 값
      totalLikes: Math.max(totalActualLikes, articleLikes), // 실제 좋아요와 기본 좋아요 중 큰 값
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

  const stats = getAdvancedStats();

  // 카테고리별 기사 수 계산
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

  // 기사 폼 초기화
  const resetArticleForm = () => {
    // 현재 시간을 기본값으로 설정 (분 단위는 5분 단위로 반올림)
    const now = new Date();
    const roundedMinutes = Math.round(now.getMinutes() / 5) * 5;
    now.setMinutes(roundedMinutes);
    now.setSeconds(0);
    
    setArticleForm({
      title: '',
      summary: '',
      content: {
        beginner: '',
        intermediate: '',
        advanced: ''
      },
      category: 'Technology',
      image: '',
      imageFile: null,
      publishType: 'immediate',
      publishedAt: now.toISOString().slice(0, 16),
      status: 'published'
    });
    setEditingArticle(null);
    setActiveContentTab(0);
  };

  // 회원 폼 초기화
  const resetMemberForm = () => {
    const defaultPlan = SUBSCRIPTION_PLANS.Free;
    setMemberForm({
      name: '',
      email: '',
      role: 'User',
      status: 'active',
      subscriptionPlan: 'Free',
      subscriptionStatus: 'active',
      subscriptionExpiry: '',
      monthlyArticleLimit: defaultPlan.monthlyArticleLimit,
      monthlyWordLimit: defaultPlan.monthlyWordLimit,
      hasAITranslation: defaultPlan.hasAITranslation,
      hasOfflineAccess: defaultPlan.hasOfflineAccess,
      hasPrioritySupport: defaultPlan.hasPrioritySupport
    });
    setEditingMember(null);
  };

  // 공지사항 폼 초기화
  const resetNoticeForm = () => {
    setNoticeForm({
      title: '',
      content: '',
      type: 'info',
      active: true
    });
    setEditingNotice(null);
  };

  // 새 기사 추가
  const handleAddArticle = () => {
    if (!articleForm.title.trim()) {
      setSnackbar({ open: true, message: '제목을 입력해주세요.', severity: 'error' });
      return;
    }

    if (!articleForm.content.beginner.trim() && !articleForm.content.intermediate.trim() && !articleForm.content.advanced.trim()) {
      setSnackbar({ open: true, message: '내용을 입력해주세요.', severity: 'error' });
      return;
    }

    // 발행 날짜 결정
    let publishDate;
    if (articleForm.publishType === 'immediate') {
      // 즉시 발행: 사용자가 날짜를 선택했으면 그 날짜, 아니면 현재 시간
      publishDate = articleForm.publishedAt ? new Date(articleForm.publishedAt) : new Date();
    } else {
      // 예약 발행: 선택한 날짜
      publishDate = new Date(articleForm.publishedAt);
    }
    
    // 상태 결정
    let status = articleForm.status;
    if (articleForm.publishType === 'scheduled' && publishDate > new Date()) {
      status = 'scheduled';
    } else if (publishDate > new Date()) {
      // 즉시 발행이지만 미래 날짜를 선택한 경우
      status = 'scheduled';
    }

    const newArticle = {
      id: `article-${Date.now()}`,
      title: articleForm.title.trim(),
      summary: articleForm.summary.trim(),
      content: {
        beginner: articleForm.content.beginner.trim(),
        intermediate: articleForm.content.intermediate.trim(),
        advanced: articleForm.content.advanced.trim()
      },
      category: articleForm.category,
      image: articleForm.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80',
      source: 'MarLang News',
      author: user?.name || 'Admin',
      publishType: articleForm.publishType,
      publishedAt: publishDate.toISOString(),
      status: status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likes: 0,
      views: 0
    };

    const updatedArticles = [newArticle, ...allArticles];
    updateArticles(updatedArticles);
    
    window.dispatchEvent(new CustomEvent('articleUpdated', {
      detail: { type: 'add', article: newArticle }
    }));
    
    const successMessage = status === 'scheduled' 
      ? `기사가 ${new Date(publishDate).toLocaleString()}에 발행 예약되었습니다! 📅`
      : '새 기사가 성공적으로 발행되었습니다! 🎉';
    
    setSnackbar({ open: true, message: successMessage, severity: 'success' });
    resetArticleForm();
    setArticleDialog(false);
  };

  // 기사 수정
  const handleEditArticle = (article) => {
    setEditingArticle(article);
    setArticleForm({
      title: article.title,
      summary: article.summary,
      content: {
        beginner: article.content?.beginner || '',
        intermediate: article.content?.intermediate || '',
        advanced: article.content?.advanced || ''
      },
      category: article.category,
      image: article.image,
      imageFile: null,
      publishType: article.publishType || 'immediate',
      publishedAt: article.publishedAt ? new Date(article.publishedAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      status: article.status || 'published'
    });
    setActiveContentTab(0);
    setArticleDialog(true);
  };

  // 기사 업데이트
  const handleUpdateArticle = () => {
    if (!articleForm.title.trim()) {
      setSnackbar({ open: true, message: '제목을 입력해주세요.', severity: 'error' });
      return;
    }

    if (!articleForm.content.beginner.trim() && !articleForm.content.intermediate.trim() && !articleForm.content.advanced.trim()) {
      setSnackbar({ open: true, message: '내용을 입력해주세요.', severity: 'error' });
      return;
    }

        // 발행 날짜 결정
    let publishDate;
    if (articleForm.publishType === 'immediate') {
      // 즉시 발행: 사용자가 날짜를 선택했으면 그 날짜, 아니면 현재 시간
      publishDate = articleForm.publishedAt ? new Date(articleForm.publishedAt) : new Date();
    } else {
      // 예약 발행: 선택한 날짜
      publishDate = new Date(articleForm.publishedAt);
    }
    
    // 상태 결정
    let status = articleForm.status;
    if (articleForm.publishType === 'scheduled' && publishDate > new Date()) {
      status = 'scheduled';
    } else if (publishDate > new Date()) {
      // 즉시 발행이지만 미래 날짜를 선택한 경우
      status = 'scheduled';
    }

    const updatedArticle = {
      ...editingArticle,
      title: articleForm.title.trim(),
      summary: articleForm.summary.trim(),
      content: {
        beginner: articleForm.content.beginner.trim(),
        intermediate: articleForm.content.intermediate.trim(),
        advanced: articleForm.content.advanced.trim()
      },
      category: articleForm.category,
      image: articleForm.image,
      publishType: articleForm.publishType,
      publishedAt: publishDate.toISOString(),
      status: status,
      updatedAt: new Date().toISOString()
    };

    const updatedArticles = allArticles.map(article => 
      article.id === editingArticle.id ? updatedArticle : article
    );
    updateArticles(updatedArticles);

    setSnackbar({ open: true, message: '기사가 성공적으로 수정되었습니다! ✨', severity: 'success' });
    resetArticleForm();
    setArticleDialog(false);
  };

  // 기사 삭제
  const handleDeleteArticle = (articleId) => {
    deleteArticle(articleId);
    setSnackbar({ open: true, message: '기사가 삭제되었습니다.', severity: 'info' });
  };

  // 카테고리 추가
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      setSnackbar({ open: true, message: '카테고리 이름을 입력해주세요.', severity: 'error' });
      return;
    }

    if (allEditableCategories.some(cat => cat.name === newCategoryName.trim())) {
      setSnackbar({ open: true, message: '이미 존재하는 카테고리입니다.', severity: 'warning' });
      return;
    }

    const newCategory = {
      id: newCategoryName.trim().toLowerCase().replace(/\s+/g, ''),
      name: newCategoryName.trim(),
      type: 'category'
    };

    const updatedCategories = [...allEditableCategories, newCategory];
    updateCategoriesAndNotify(updatedCategories);
    setSnackbar({ open: true, message: `"${newCategoryName}" 카테고리가 추가되었습니다! 홈페이지에 반영됩니다.`, severity: 'success' });
    setNewCategoryName('');
    setCategoryDialog(false);
  };

  // 카테고리 삭제 (최신/인기 탭은 삭제 불가)
  const handleDeleteCategory = (categoryId) => {
    const category = allEditableCategories.find(cat => cat.id === categoryId);
    
    if (category.type === 'recent' || category.type === 'popular') {
      setSnackbar({ 
        open: true, 
        message: '최신/인기 탭은 삭제할 수 없습니다.', 
        severity: 'warning' 
      });
      return;
    }

    const updatedArticles = allArticles.map(article =>
      article.category === category.name ? { ...article, category: 'Technology' } : article
    );
    updateArticles(updatedArticles);
    
    const newCategories = allEditableCategories.filter(cat => cat.id !== categoryId);
    updateCategoriesAndNotify(newCategories);
    setSnackbar({ 
      open: true, 
      message: `"${category.name}" 카테고리가 삭제되고 기사들이 Technology로 이동되었습니다. 홈페이지에 반영됩니다.`, 
      severity: 'info' 
    });
  };

  // 전체 카테고리 순서 변경
  const moveCategoryUp = (index) => {
    if (index > 0) {
      const newOrder = [...allEditableCategories];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      updateCategoriesAndNotify(newOrder);
      setSnackbar({ open: true, message: '카테고리 순서가 변경되었습니다! 홈페이지에 반영됩니다.', severity: 'success' });
    }
  };

  const moveCategoryDown = (index) => {
    if (index < allEditableCategories.length - 1) {
      const newOrder = [...allEditableCategories];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      updateCategoriesAndNotify(newOrder);
      setSnackbar({ open: true, message: '카테고리 순서가 변경되었습니다! 홈페이지에 반영됩니다.', severity: 'success' });
    }
  };

  // 카테고리 이름 편집
  const handleEditCategoryName = (index) => {
    setEditingCategoryIndex(index);
    setEditingCategoryName(allEditableCategories[index].name);
  };

  const handleSaveCategoryName = () => {
    if (!editingCategoryName.trim()) {
      setSnackbar({ open: true, message: '카테고리 이름을 입력해주세요.', severity: 'error' });
      return;
    }

    if (allEditableCategories.some((cat, index) => 
      cat.name === editingCategoryName.trim() && index !== editingCategoryIndex
    )) {
      setSnackbar({ open: true, message: '이미 존재하는 카테고리 이름입니다.', severity: 'warning' });
      return;
    }

    const updatedCategories = [...allEditableCategories];
    const oldName = updatedCategories[editingCategoryIndex].name;
    
    // 카테고리 이름 업데이트
    updatedCategories[editingCategoryIndex] = {
      ...updatedCategories[editingCategoryIndex],
      name: editingCategoryName.trim(),
      id: editingCategoryName.trim().toLowerCase().replace(/\s+/g, '')
    };

    // 해당 카테고리를 사용하는 기사들도 업데이트
    const updatedArticles = allArticles.map(article =>
      article.category === oldName ? { ...article, category: editingCategoryName.trim() } : article
    );
    updateArticles(updatedArticles);

    updateCategoriesAndNotify(updatedCategories);
    setEditingCategoryIndex(null);
    setEditingCategoryName('');
    setSnackbar({ 
      open: true, 
      message: `카테고리 이름이 "${oldName}"에서 "${editingCategoryName.trim()}"으로 변경되었습니다!`, 
      severity: 'success' 
    });
  };

  const handleCancelEdit = () => {
    setEditingCategoryIndex(null);
    setEditingCategoryName('');
  };

  // 회원 추가
  const handleAddMember = () => {
    if (!memberForm.name.trim() || !memberForm.email.trim()) {
      setSnackbar({ open: true, message: '이름과 이메일을 입력해주세요.', severity: 'error' });
      return;
    }

    const newMember = {
      id: `user-${Date.now()}`,
      name: memberForm.name.trim(),
      email: memberForm.email.trim(),
      role: memberForm.role,
      status: memberForm.status,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      isEmailVerified: true
    };

    localStorage.setItem(`marlang_user_${newMember.id}`, JSON.stringify(newMember));
    setSnackbar({ open: true, message: '새 회원이 추가되었습니다!', severity: 'success' });
    resetMemberForm();
    setMemberDialog(false);
  };

  // 회원 편집
  const handleEditMember = (member) => {
    const plan = SUBSCRIPTION_PLANS[member.subscriptionPlan || 'Free'];
    setEditingMember(member);
    setMemberForm({
      name: member.name || '',
      email: member.email || '',
      role: member.role || 'User',
      status: member.status || 'active',
      subscriptionPlan: member.subscriptionPlan || 'Free',
      subscriptionStatus: member.subscriptionStatus || 'active',
      subscriptionExpiry: member.subscriptionExpiry || '',
      monthlyArticleLimit: member.monthlyArticleLimit || plan.monthlyArticleLimit,
      monthlyWordLimit: member.monthlyWordLimit || plan.monthlyWordLimit,
      hasAITranslation: member.hasAITranslation || plan.hasAITranslation,
      hasOfflineAccess: member.hasOfflineAccess || plan.hasOfflineAccess,
      hasPrioritySupport: member.hasPrioritySupport || plan.hasPrioritySupport
    });
    setMemberDialog(true);
  };

  // 구독 플랜 변경 시 자동 설정
  const handleSubscriptionPlanChange = (planName) => {
    const plan = SUBSCRIPTION_PLANS[planName];
    if (plan) {
      setMemberForm(prev => ({
        ...prev,
        subscriptionPlan: planName,
        monthlyArticleLimit: plan.monthlyArticleLimit,
        monthlyWordLimit: plan.monthlyWordLimit,
        hasAITranslation: plan.hasAITranslation,
        hasOfflineAccess: plan.hasOfflineAccess,
        hasPrioritySupport: plan.hasPrioritySupport,
        subscriptionExpiry: planName !== 'Free' && !prev.subscriptionExpiry 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) // 30일 후
          : prev.subscriptionExpiry
      }));
    }
  };

  // 권한 변경 확인
  const handleRoleChangeRequest = (member, newRole) => {
    if (newRole === member.role) return;
    
    setRoleChangeDialog({
      open: true,
      member,
      newRole
    });
  };

  // 권한 변경 확정
  const confirmRoleChange = () => {
    const { member, newRole } = roleChangeDialog;
    
    // 기존 사용자 데이터 업데이트
    const updatedMember = {
      ...member,
      role: newRole,
      updatedAt: new Date().toISOString(),
      roleChangedBy: user?.name || 'Admin',
      roleChangedAt: new Date().toISOString()
    };

    localStorage.setItem(`marlang_user_${member.id}`, JSON.stringify(updatedMember));
    
    // 권한 변경 로그 저장
    const roleChangeLog = {
      id: `role_change_${Date.now()}`,
      userId: member.id,
      userName: member.name,
      userEmail: member.email,
      oldRole: member.role,
      newRole: newRole,
      changedBy: user?.name || 'Admin',
      changedAt: new Date().toISOString(),
      reason: `관리자 대시보드에서 권한 변경`
    };
    
    const existingLogs = JSON.parse(localStorage.getItem('marlang_role_change_logs') || '[]');
    existingLogs.unshift(roleChangeLog);
    localStorage.setItem('marlang_role_change_logs', JSON.stringify(existingLogs.slice(0, 100))); // 최근 100개만 보관

    setRoleChangeDialog({ open: false, member: null, newRole: '' });
    setSnackbar({ 
      open: true, 
      message: `${member.name}님의 권한이 ${member.role}에서 ${newRole}로 변경되었습니다!`, 
      severity: 'success' 
    });
  };

  // 회원 정보 업데이트
  const handleUpdateMember = () => {
    if (!memberForm.name.trim() || !memberForm.email.trim()) {
      setSnackbar({ open: true, message: '이름과 이메일을 입력해주세요.', severity: 'error' });
      return;
    }

    const updatedMember = {
      ...editingMember,
      ...memberForm,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.name || 'Admin'
    };

    localStorage.setItem(`marlang_user_${editingMember.id}`, JSON.stringify(updatedMember));
    setSnackbar({ open: true, message: '회원 정보가 업데이트되었습니다!', severity: 'success' });
    resetMemberForm();
    setMemberDialog(false);
  };

  // 회원 삭제
  const handleDeleteMember = (memberId) => {
    localStorage.removeItem(`marlang_user_${memberId}`);
    localStorage.removeItem(`marlang_liked_articles_${memberId}`);
    localStorage.removeItem(`marlang_saved_words_${memberId}`);
    setSnackbar({ open: true, message: '회원이 삭제되었습니다.', severity: 'info' });
  };

  // 공지사항 추가
  const handleAddNotice = () => {
    if (!noticeForm.title.trim() || !noticeForm.content.trim()) {
      setSnackbar({ open: true, message: '제목과 내용을 입력해주세요.', severity: 'error' });
      return;
    }

    const newNotice = {
      id: `notice-${Date.now()}`,
      title: noticeForm.title.trim(),
      content: noticeForm.content.trim(),
      type: noticeForm.type,
      active: noticeForm.active,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedNotices = editingNotice 
      ? notices.map(notice => notice.id === editingNotice.id ? newNotice : notice)
      : [newNotice, ...notices];

    saveNotices(updatedNotices);
    setSnackbar({ open: true, message: editingNotice ? '공지사항이 수정되었습니다!' : '새 공지사항이 추가되었습니다!', severity: 'success' });
    resetNoticeForm();
    setNoticeDialog(false);
  };

  // 공지사항 수정
  const handleEditNotice = (notice) => {
    setEditingNotice(notice);
    setNoticeForm({
      title: notice.title,
      content: notice.content,
      type: notice.type,
      active: notice.active
    });
    setNoticeDialog(true);
  };

  // 공지사항 삭제
  const handleDeleteNotice = (noticeId) => {
    const updatedNotices = notices.filter(notice => notice.id !== noticeId);
    saveNotices(updatedNotices);
    setSnackbar({ open: true, message: '공지사항이 삭제되었습니다.', severity: 'info' });
  };

  // 공지사항 활성화/비활성화
  const toggleNoticeActive = (noticeId) => {
    const updatedNotices = notices.map(notice => 
      notice.id === noticeId ? { ...notice, active: !notice.active } : notice
    );
    saveNotices(updatedNotices);
    setSnackbar({ open: true, message: '공지사항 상태가 변경되었습니다.', severity: 'success' });
  };

  // 대시보드 메인 화면
  const renderDashboard = () => (
    <DashboardContainer>
      {/* 환영 섹션 */}
      <WelcomeCard>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>
              📰 MarLang 뉴스 관리센터
            </Typography>
            <Typography variant="body1" color="text.secondary">
              안녕하세요, {user?.name || 'Admin'}님! 현재 {stats.totalArticles}개의 기사가 발행되었습니다.
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              🕒 마지막 업데이트: {lastUpdate.toLocaleTimeString()} (30초마다 자동 갱신)
            </Typography>
          </Box>
          <Avatar src={user?.picture} sx={{ width: 60, height: 60 }} />
        </Box>
      </WelcomeCard>

      {/* 실시간 통계 카드 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard>
            <StatIcon>📚</StatIcon>
            <StatInfo>
              <StatNumber>{stats.totalArticles}</StatNumber>
              <StatLabel>총 기사</StatLabel>
            </StatInfo>
          </StatCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard>
            <StatIcon>👥</StatIcon>
            <StatInfo>
              <StatNumber>{stats.totalMembers}</StatNumber>
              <StatLabel>총 회원</StatLabel>
            </StatInfo>
          </StatCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard>
            <StatIcon>👀</StatIcon>
            <StatInfo>
              <StatNumber>{stats.totalViews.toLocaleString()}</StatNumber>
              <StatLabel>총 조회수</StatLabel>
            </StatInfo>
          </StatCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard>
            <StatIcon>❤️</StatIcon>
            <StatInfo>
              <StatNumber>{stats.totalLikes}</StatNumber>
              <StatLabel>총 좋아요</StatLabel>
            </StatInfo>
          </StatCard>
        </Grid>
      </Grid>

      {/* 오늘 통계 */}
      <Card sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
          📅 오늘의 통계
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#e3f2fd', borderRadius: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                {stats.todayArticles}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                오늘 발행 기사
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#e8f5e8', borderRadius: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                {stats.todayMembers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                오늘 가입 회원
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fff3e0', borderRadius: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#f57c00' }}>
                {stats.currentUsers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                현재 접속자
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fce4ec', borderRadius: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#c2185b' }}>
                {stats.totalWords}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                총 저장된 단어
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* 빠른 액션 */}
      <Card sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
          ⚡ 빠른 작업
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2}>
            <ActionButton onClick={() => {
              resetArticleForm();
              setArticleDialog(true);
            }}>
              <Add sx={{ fontSize: 30, mb: 1 }} />
              <Typography variant="body2" fontWeight="bold">새 기사 작성</Typography>
            </ActionButton>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <ActionButton onClick={() => setActiveTab(1)}>
              <Article sx={{ fontSize: 30, mb: 1 }} />
              <Typography variant="body2" fontWeight="bold">기사 관리</Typography>
            </ActionButton>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <ActionButton onClick={() => setActiveTab(2)}>
              <Category sx={{ fontSize: 30, mb: 1 }} />
              <Typography variant="body2" fontWeight="bold">카테고리 관리</Typography>
            </ActionButton>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <ActionButton onClick={() => setActiveTab(3)}>
              <People sx={{ fontSize: 30, mb: 1 }} />
              <Typography variant="body2" fontWeight="bold">회원 관리</Typography>
            </ActionButton>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <ActionButton onClick={() => setActiveTab(4)}>
              <Analytics sx={{ fontSize: 30, mb: 1 }} />
              <Typography variant="body2" fontWeight="bold">고급 분석</Typography>
            </ActionButton>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <ActionButton onClick={() => navigate('/')}>
              <Preview sx={{ fontSize: 30, mb: 1 }} />
              <Typography variant="body2" fontWeight="bold">홈페이지 보기</Typography>
            </ActionButton>
          </Grid>
        </Grid>
      </Card>

      {/* 카테고리별 현황 */}
      <Card sx={{ p: 3, borderRadius: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            📊 카테고리별 현황 (홈페이지와 동일)
          </Typography>
          <Chip 
            label={`총 ${getCategoryStats().length}개 카테고리`} 
            color="primary" 
            size="small"
          />
        </Box>
        <Grid container spacing={2}>
          {getCategoryStats().map((category) => (
            <Grid item xs={12} sm={6} md={4} key={category.id}>
              <CategoryCard>
                <Box sx={{ p: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="h6" fontWeight="bold">
                      {category.name}
                    </Typography>
                    <Chip 
                      label={category.type} 
                      size="small" 
                      color={category.type === 'category' ? 'primary' : 'secondary'}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    📚 {category.count}개 기사
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    👀 {category.totalViews.toLocaleString()} 조회 • ❤️ {category.totalLikes} 좋아요
                  </Typography>
                  <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                    📈 참여율: {category.avgEngagement}%
                  </Typography>
                </Box>
              </CategoryCard>
            </Grid>
          ))}
        </Grid>
      </Card>
    </DashboardContainer>
  );

  // 기사 관리 화면
  const renderArticleManagement = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          📝 기사 관리
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            resetArticleForm();
            setArticleDialog(true);
          }}
        >
          새 기사 추가
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>제목</TableCell>
              <TableCell>카테고리</TableCell>
              <TableCell>조회수</TableCell>
              <TableCell>좋아요</TableCell>
                                    <TableCell>상태</TableCell>
                      <TableCell>발행 날짜</TableCell>
              <TableCell>작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allArticles.map((article) => (
              <TableRow key={article.id} hover>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {article.title}
                    </Typography>
                    {article.summary && (
                      <Typography variant="caption" color="text.secondary">
                        {article.summary.length > 50 ? `${article.summary.substring(0, 50)}...` : article.summary}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={article.category} size="small" />
                </TableCell>
                <TableCell>{article.views || 0}</TableCell>
                <TableCell>{article.likes || 0}</TableCell>
                <TableCell>
                  <Chip 
                    icon={
                      article.status === 'published' ? <CheckCircle sx={{ fontSize: 16 }} /> :
                      article.status === 'draft' ? <Edit sx={{ fontSize: 16 }} /> :
                      <Schedule sx={{ fontSize: 16 }} />
                    }
                    label={article.status === 'published' ? '발행됨' : article.status === 'draft' ? '초안' : '예약됨'} 
                    color={article.status === 'published' ? 'success' : article.status === 'draft' ? 'default' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {new Date(article.publishedAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(article.publishedAt).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleEditArticle(article)}
                    color="primary"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteArticle(article.id)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/article/${article.id}`)}
                    color="info"
                  >
                    <Preview />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  // 카테고리 관리 화면
  const renderCategoryManagement = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          🏷️ 카테고리 관리 (전체 순서 포함)
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCategoryDialog(true)}
        >
          새 카테고리 추가
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        💡 모든 카테고리(최신, 인기 포함)의 순서를 조정할 수 있습니다. 순서는 홈페이지 네비게이션에 바로 반영됩니다.
      </Alert>

      <Grid container spacing={2}>
        {allEditableCategories.map((category, index) => {
          const articleCount = category.type === 'category' 
            ? allArticles.filter(a => a.category === category.name).length
            : category.type === 'recent' 
              ? allArticles.length
              : category.type === 'popular'
                ? allArticles.filter(a => (a.likes || 0) > 10).length
                : 0;
          
          const isEditing = editingCategoryIndex === index;
          
          return (
            <Grid item xs={12} sm={6} md={4} key={category.id}>
              <CategoryManagementCard>
                <Box sx={{ p: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Box display="flex" alignItems="center" sx={{ flex: 1 }}>
                      <DragIndicator sx={{ mr: 1, color: 'text.secondary' }} />
                      
                      {isEditing ? (
                        <TextField
                          size="small"
                          value={editingCategoryName}
                          onChange={(e) => setEditingCategoryName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSaveCategoryName()}
                          sx={{ mr: 1, flex: 1 }}
                          autoFocus
                        />
                      ) : (
                        <Typography variant="h6" fontWeight="bold" sx={{ flex: 1 }}>
                          {category.name}
                        </Typography>
                      )}
                    </Box>
                    
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip 
                        label={`#${index + 1}`} 
                        size="small" 
                        color="primary" 
                      />
                      <Chip 
                        label={
                          category.type === 'recent' ? '최신' :
                          category.type === 'popular' ? '인기' :
                          category.type === 'category' ? '카테고리' : '기타'
                        }
                        size="small"
                        color={
                          category.type === 'recent' ? 'success' :
                          category.type === 'popular' ? 'warning' :
                          'default'
                        }
                      />
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    📚 {articleCount}개 기사
                    {category.type === 'recent' && ' (전체 최신)'}
                    {category.type === 'popular' && ' (좋아요 10+)'}
                  </Typography>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Tooltip title="위로 이동">
                        <IconButton
                          size="small"
                          onClick={() => moveCategoryUp(index)}
                          disabled={index === 0}
                        >
                          <ArrowUpward />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="아래로 이동">
                        <IconButton
                          size="small"
                          onClick={() => moveCategoryDown(index)}
                          disabled={index === allEditableCategories.length - 1}
                        >
                          <ArrowDownward />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    
                    <Box>
                      {isEditing ? (
                        <>
                          <Tooltip title="저장">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={handleSaveCategoryName}
                            >
                              <Save />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="취소">
                            <IconButton
                              size="small"
                              color="default"
                              onClick={handleCancelEdit}
                            >
                              <Cancel />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        <>
                          {category.type === 'category' && (
                            <Tooltip title="이름 편집">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleEditCategoryName(index)}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title={category.type === 'category' ? '삭제' : '기본 탭은 삭제할 수 없습니다'}>
                            <span>
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleDeleteCategory(category.id)}
                                disabled={category.type !== 'category'}
                              >
                                <Delete />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </Box>
                </Box>
              </CategoryManagementCard>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );

  // 회원 관리 화면
  const renderMemberManagement = () => {
    const members = getMembers();
    
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight="bold">
            👥 회원 관리
          </Typography>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => {
              resetMemberForm();
              setMemberDialog(true);
            }}
          >
            새 회원 추가
          </Button>
        </Box>

        {/* 회원 통계 요약 */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#e3f2fd' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                {members.length}
              </Typography>
              <Typography variant="body2">총 회원</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e8' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                {members.filter(m => (m.subscriptionPlan || 'Free') !== 'Free').length}
              </Typography>
              <Typography variant="body2">유료 회원</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#fff3e0' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#f57c00' }}>
                {members.filter(m => m.role === 'admin' || m.role === 'super_admin').length}
              </Typography>
              <Typography variant="body2">관리자</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#fce4ec' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#c2185b' }}>
                {stats.currentUsers}
              </Typography>
              <Typography variant="body2">현재 접속자</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#f3e5f5' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#7b1fa2' }}>
                ₩{members.filter(m => (m.subscriptionPlan || 'Free') !== 'Free')
                  .reduce((sum, m) => sum + (SUBSCRIPTION_PLANS[m.subscriptionPlan || 'Free']?.price || 0), 0)
                  .toLocaleString()}
              </Typography>
              <Typography variant="body2">월 예상 수익</Typography>
            </Card>
          </Grid>
        </Grid>

        {/* 회원 목록 테이블 */}
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>회원 정보</TableCell>
                <TableCell>권한 & 구독</TableCell>
                <TableCell>학습 현황</TableCell>
                <TableCell>구독 상세</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((member) => {
                const subscriptionPlan = member.subscriptionPlan || 'Free';
                const planInfo = SUBSCRIPTION_PLANS[subscriptionPlan];
                const isExpired = member.subscriptionExpiry && new Date(member.subscriptionExpiry) < new Date();
                
                return (
                  <TableRow key={member.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2 }}>
                          {member.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {member.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {member.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexDirection="column" gap={1}>
                        <Box display="flex" gap={1} alignItems="center">
                          <Chip 
                            label={member.role || 'User'} 
                            size="small"
                            color={
                              member.role === 'super_admin' ? 'error' : 
                              member.role === 'admin' ? 'warning' : 
                              'default'
                            }
                            onClick={() => handleRoleChangeRequest(member, 
                              member.role === 'User' ? 'admin' : 
                              member.role === 'admin' ? 'super_admin' : 'User'
                            )}
                            sx={{ cursor: 'pointer' }}
                          />
                          {(member.role === 'super_admin' || member.role === 'admin') && (
                            <Typography variant="caption" sx={{ color: 'warning.main' }}>
                              👑
                            </Typography>
                          )}
                        </Box>
                        <Chip 
                          label={subscriptionPlan}
                          size="small"
                          color={planInfo?.color || 'default'}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          📚 {member.readArticles}개 기사 읽음
                        </Typography>
                        <Typography variant="body2">
                          📝 {member.savedWords.length}개 단어 저장
                        </Typography>
                        <Typography variant="body2">
                          ❤️ {member.likedArticles.length}개 좋아요
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {subscriptionPlan !== 'Free' && (
                          <>
                            <Typography variant="body2">
                              💰 ₩{planInfo?.price?.toLocaleString()}/월
                            </Typography>
                            {member.subscriptionExpiry && (
                              <Typography 
                                variant="body2" 
                                sx={{ color: isExpired ? 'error.main' : 'success.main' }}
                              >
                                📅 {isExpired ? '만료됨' : '만료일'}: {new Date(member.subscriptionExpiry).toLocaleDateString()}
                              </Typography>
                            )}
                          </>
                        )}
                        <Box display="flex" gap={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                          {(member.hasAITranslation || planInfo?.hasAITranslation) && (
                            <Chip label="🤖 AI번역" size="small" color="info" />
                          )}
                          {(member.hasOfflineAccess || planInfo?.hasOfflineAccess) && (
                            <Chip label="📱 오프라인" size="small" color="success" />
                          )}
                          {(member.hasPrioritySupport || planInfo?.hasPrioritySupport) && (
                            <Chip label="🎧 우선지원" size="small" color="warning" />
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexDirection="column" gap={0.5}>
                        <Chip 
                          label={member.status === 'active' ? '활성' : '비활성'} 
                          color={member.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                        {subscriptionPlan !== 'Free' && (
                          <Chip 
                            label={member.subscriptionStatus === 'active' ? '구독중' : '중지됨'} 
                            color={member.subscriptionStatus === 'active' ? 'success' : 'error'}
                            size="small"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexDirection="column" gap={0.5}>
                        <Tooltip title="회원 정보 편집">
                          <IconButton
                            size="small"
                            onClick={() => handleEditMember(member)}
                            color="primary"
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="회원 삭제">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteMember(member.id)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  // 고급 분석 화면
  const renderAnalytics = () => {
    const analytics = getUserAnalytics();
    const categoryStats = getCategoryStats();
    
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight="bold">
            📈 고급 분석
          </Typography>
          <Chip 
            label={`마지막 업데이트: ${lastUpdate.toLocaleTimeString()}`} 
            color="primary" 
            size="small"
          />
        </Box>

        {/* 카테고리 성과 분석 */}
        <Card sx={{ p: 3, mb: 4, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
            🏆 TOP 카테고리 성과 분석
          </Typography>
          <Grid container spacing={3}>
            {categoryStats
              .sort((a, b) => b.totalViews - a.totalViews)
              .slice(0, 3)
              .map((category, index) => (
                <Grid item xs={12} md={4} key={category.id}>
                  <Card sx={{ p: 2, bgcolor: index === 0 ? '#fff3e0' : index === 1 ? '#f3e5f5' : '#e8f5e8' }}>
                    <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                      <Typography variant="h4" sx={{ mr: 2 }}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </Typography>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {category.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          #{index + 1} 인기 카테고리
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      📚 기사 수: {category.count}개
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      👀 총 조회수: {category.totalViews.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      ❤️ 총 좋아요: {category.totalLikes}
                    </Typography>
                    <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                      📈 참여율: {category.avgEngagement}%
                    </Typography>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </Card>

        {/* 사용자 행동 분석 */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                📖 독서 패턴 분석
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="body2">🔥 고빈도 독자 (15+ 기사)</Typography>
                  <Chip label={analytics.usersByReadingFrequency.high} color="error" size="small" />
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(analytics.usersByReadingFrequency.high / stats.totalMembers) * 100} 
                  sx={{ height: 8, borderRadius: 4, bgcolor: '#ffcdd2' }}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="body2">📚 중빈도 독자 (5-14 기사)</Typography>
                  <Chip label={analytics.usersByReadingFrequency.medium} color="warning" size="small" />
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(analytics.usersByReadingFrequency.medium / stats.totalMembers) * 100} 
                  sx={{ height: 8, borderRadius: 4, bgcolor: '#fff3e0' }}
                />
              </Box>
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="body2">📖 저빈도 독자 (5미만 기사)</Typography>
                  <Chip label={analytics.usersByReadingFrequency.low} color="default" size="small" />
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(analytics.usersByReadingFrequency.low / stats.totalMembers) * 100} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                🎓 학습 활동 분석
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="body2">🚀 적극적 학습자 (20+ 단어)</Typography>
                  <Chip label={analytics.usersByLearningActivity.active} color="success" size="small" />
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(analytics.usersByLearningActivity.active / stats.totalMembers) * 100} 
                  color="success"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="body2">📚 보통 학습자 (5-19 단어)</Typography>
                  <Chip label={analytics.usersByLearningActivity.moderate} color="info" size="small" />
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(analytics.usersByLearningActivity.moderate / stats.totalMembers) * 100} 
                  color="info"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="body2">😴 소극적 학습자 (5미만 단어)</Typography>
                  <Chip label={analytics.usersByLearningActivity.passive} color="default" size="small" />
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(analytics.usersByLearningActivity.passive / stats.totalMembers) * 100} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* 참여도 지표 */}
        <Card sx={{ p: 3, mb: 4, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
            📊 전체 참여도 지표
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#e3f2fd', borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                  {stats.avgReadArticles}
                </Typography>
                <Typography variant="body2">평균 읽은 기사 수</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#e8f5e8', borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                  {stats.avgSavedWords}
                </Typography>
                <Typography variant="body2">평균 저장 단어 수</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fff3e0', borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#f57c00' }}>
                  {analytics.totalLearningActivities}
                </Typography>
                <Typography variant="body2">총 학습 활동</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fce4ec', borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#c2185b' }}>
                  {Math.round((stats.totalLikes / Math.max(stats.totalViews, 1)) * 100)}%
                </Typography>
                <Typography variant="body2">전체 좋아요율</Typography>
              </Box>
            </Grid>
          </Grid>
        </Card>

        {/* 우수 학습자 랭킹 */}
        <Card sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
            🏆 우수 학습자 TOP 10
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>순위</TableCell>
                  <TableCell>학습자</TableCell>
                  <TableCell>학습 점수</TableCell>
                  <TableCell>상세 활동</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analytics.topLearners.map((learner, index) => (
                  <TableRow key={learner.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Typography variant="h6" sx={{ mr: 1 }}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: index < 3 ? '#ffd700' : '#e0e0e0' }}>
                          {learner.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {learner.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {learner.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${learner.learningScore}점`}
                        color={index < 3 ? 'warning' : 'default'}
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        📚 {learner.readArticles}개 읽음 • 📝 {learner.savedWords.length}개 저장 • ❤️ {learner.likedArticles.length}개 좋아요
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
    );
  };

  // 공지사항 관리 화면
  const renderNoticeManagement = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          📢 공지사항 관리
        </Typography>
        <Button
          variant="contained"
          startIcon={<Announcement />}
          onClick={() => {
            resetNoticeForm();
            setNoticeDialog(true);
          }}
        >
          새 공지사항 추가
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        💡 활성화된 공지사항은 홈페이지 상단에 자동으로 표시됩니다. 변경사항은 즉시 반영됩니다.
      </Alert>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>제목</TableCell>
              <TableCell>타입</TableCell>
              <TableCell>상태</TableCell>
              <TableCell>생성일</TableCell>
              <TableCell>작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {notices.map((notice) => (
              <TableRow key={notice.id} hover>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {notice.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {notice.content.length > 50 ? `${notice.content.substring(0, 50)}...` : notice.content}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={notice.type}
                    color={notice.type === 'error' ? 'error' : notice.type === 'warning' ? 'warning' : notice.type === 'success' ? 'success' : 'info'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notice.active}
                        onChange={() => toggleNoticeActive(notice.id)}
                        color="primary"
                      />
                    }
                    label={notice.active ? '활성' : '비활성'}
                  />
                </TableCell>
                <TableCell>
                  {new Date(notice.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleEditNotice(notice)}
                    color="primary"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteNotice(notice.id)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <>
      <MobileNavigation />
      <MobileContentWrapper>
        {/* 상단바 */}
        <AppBar position="static" sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <Toolbar>
            <DashboardIcon sx={{ mr: 2 }} />
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              MarLang 관리자 대시보드
            </Typography>
            <Button color="inherit" onClick={() => navigate('/')}>
              🏠 홈페이지로
            </Button>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
          {/* 탭 네비게이션 */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={activeTab} 
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="📊 대시보드" />
              <Tab label="📝 기사 관리" />
              <Tab label="🏷️ 카테고리 관리" />
              <Tab label="👥 회원 관리" />
              <Tab label="📈 고급 분석" />
              <Tab label="📢 공지사항 관리" />
            </Tabs>
          </Box>

          {/* 탭 내용 */}
          {activeTab === 0 && renderDashboard()}
          {activeTab === 1 && renderArticleManagement()}
          {activeTab === 2 && renderCategoryManagement()}
          {activeTab === 3 && renderMemberManagement()}
          {activeTab === 4 && renderAnalytics()}
          {activeTab === 5 && renderNoticeManagement()}
        </Container>

        {/* 기사 추가/편집 다이얼로그 - 모든 필드를 한 페이지에 */}
        <Dialog open={articleDialog} onClose={() => setArticleDialog(false)} maxWidth="lg" fullWidth>
          <DialogTitle>
            <Typography variant="h5" fontWeight="bold">
              {editingArticle ? '✏️ 기사 편집' : '✨ 새 기사 추가'}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              {/* 기본 정보 섹션 */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" fontWeight="bold">📝 기본 정보</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="제목 *"
                        value={articleForm.title}
                        onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                        placeholder="독자의 관심을 끌 수 있는 제목을 작성해주세요"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="요약"
                        value={articleForm.summary}
                        onChange={(e) => setArticleForm({ ...articleForm, summary: e.target.value })}
                        multiline
                        rows={2}
                        placeholder="기사의 핵심 내용을 2-3문장으로 요약해주세요"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>카테고리 *</InputLabel>
                        <Select
                          value={articleForm.category}
                          onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })}
                        >
                          {editableCategories.map((cat) => (
                            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* 발행 설정 섹션 */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" fontWeight="bold">📅 발행 설정</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl>
                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                          발행 방식 선택 *
                        </Typography>
                        <RadioGroup
                          value={articleForm.publishType}
                          onChange={(e) => setArticleForm({ ...articleForm, publishType: e.target.value })}
                          row
                        >
                          <FormControlLabel
                            value="immediate"
                            control={<Radio />}
                            label="📱 즉시 발행"
                          />
                          <FormControlLabel
                            value="scheduled"
                            control={<Radio />}
                            label="⏰ 예약 발행"
                          />
                        </RadioGroup>
                      </FormControl>
                    </Grid>

                    {/* 발행 날짜/시간 선택 */}
                    <Grid item xs={12} sm={articleForm.publishType === 'immediate' ? 12 : 6}>
                      <TextField
                        fullWidth
                        label={articleForm.publishType === 'immediate' ? "발행 날짜 및 시간 (선택사항)" : "발행 날짜 및 시간"}
                        type="datetime-local"
                        value={articleForm.publishedAt}
                        onChange={(e) => setArticleForm({ ...articleForm, publishedAt: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                        helperText={
                          articleForm.publishType === 'immediate' 
                            ? "비워두면 현재 시간으로 발행됩니다" 
                            : "미래 날짜와 시간을 선택하세요"
                        }
                        sx={{ 
                          '& .MuiInputBase-input': {
                            fontSize: '0.95rem'
                          }
                        }}
                      />
                    </Grid>

                    {/* 기사 상태 */}
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>기사 상태</InputLabel>
                        <Select
                          value={articleForm.status}
                          label="기사 상태"
                          onChange={(e) => setArticleForm({ ...articleForm, status: e.target.value })}
                        >
                          <MenuItem value="published">✅ 발행됨</MenuItem>
                          <MenuItem value="draft">📝 초안</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* 이미지 업로드 섹션 */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" fontWeight="bold">🖼️ 이미지</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Box sx={{ mb: 2 }}>
                        <input
                          accept="image/*"
                          style={{ display: 'none' }}
                          id="image-upload"
                          type="file"
                          onChange={handleImageUpload}
                        />
                        <label htmlFor="image-upload">
                          <Button
                            variant="outlined"
                            component="span"
                            startIcon={<CloudUpload />}
                            fullWidth
                            sx={{ mb: 2 }}
                          >
                            이미지 파일 업로드 (최대 5MB)
                          </Button>
                        </label>
                      </Box>
                      
                      <TextField
                        fullWidth
                        label="또는 이미지 URL 입력"
                        value={articleForm.image}
                        onChange={(e) => setArticleForm({ ...articleForm, image: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                      />
                      
                      {articleForm.image && (
                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                          <img 
                            src={articleForm.image} 
                            alt="미리보기" 
                            style={{ 
                              maxWidth: '300px', 
                              maxHeight: '200px', 
                              borderRadius: '8px',
                              border: '1px solid #e0e0e0'
                            }}
                            onError={(e) => { 
                              e.target.style.display = 'none';
                              setSnackbar({ open: true, message: '이미지를 불러올 수 없습니다.', severity: 'warning' });
                            }}
                          />
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* 본문 내용 섹션 - 3개 탭 */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" fontWeight="bold">📖 본문 내용 (3종류 작성)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ mb: 2 }}>
                    <Alert severity="info" sx={{ mb: 3 }}>
                      💡 하나의 기사에 대해 초급자, 중급자, 고급자용 3가지 버전의 본문을 작성해주세요.
                    </Alert>
                    
                    {/* 본문 작성 탭 */}
                    <Tabs 
                      value={activeContentTab} 
                      onChange={(_, newValue) => setActiveContentTab(newValue)}
                      variant="fullWidth"
                      sx={{ mb: 3 }}
                    >
                      <Tab 
                        label="🟢 초급자용 본문" 
                        sx={{ 
                          color: articleForm.content.beginner.length > 0 ? 'success.main' : 'text.secondary',
                          fontWeight: 'bold'
                        }}
                      />
                      <Tab 
                        label="🟡 중급자용 본문" 
                        sx={{ 
                          color: articleForm.content.intermediate.length > 0 ? 'warning.main' : 'text.secondary',
                          fontWeight: 'bold'
                        }}
                      />
                      <Tab 
                        label="🔴 고급자용 본문" 
                        sx={{ 
                          color: articleForm.content.advanced.length > 0 ? 'error.main' : 'text.secondary',
                          fontWeight: 'bold'
                        }}
                      />
                    </Tabs>

                    {/* 초급자용 본문 */}
                    {activeContentTab === 0 && (
                      <Box>
                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'success.main' }}>
                          🟢 초급자용 본문 작성
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          쉬운 단어와 짧은 문장을 사용하여 기본 개념 위주로 작성해주세요.
                        </Typography>
                        <TextField
                          fullWidth
                          label="초급자용 본문 내용 *"
                          value={articleForm.content.beginner}
                          onChange={(e) => setArticleForm({ 
                            ...articleForm, 
                            content: { ...articleForm.content, beginner: e.target.value } 
                          })}
                          multiline
                          rows={12}
                          placeholder="초급자도 쉽게 이해할 수 있는 내용으로 작성해주세요..."
                          sx={{
                            '& textarea': {
                              fontFamily: 'monospace',
                              fontSize: '14px',
                              lineHeight: 1.6
                            }
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          현재 글자 수: {articleForm.content.beginner.length}자
                        </Typography>
                      </Box>
                    )}

                    {/* 중급자용 본문 */}
                    {activeContentTab === 1 && (
                      <Box>
                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'warning.main' }}>
                          🟡 중급자용 본문 작성
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          적당한 수준의 어휘와 세부 내용을 포함하여 실용적인 정보를 제공해주세요.
                        </Typography>
                        <TextField
                          fullWidth
                          label="중급자용 본문 내용 *"
                          value={articleForm.content.intermediate}
                          onChange={(e) => setArticleForm({ 
                            ...articleForm, 
                            content: { ...articleForm.content, intermediate: e.target.value } 
                          })}
                          multiline
                          rows={12}
                          placeholder="중급자 수준에 맞는 상세한 내용으로 작성해주세요..."
                          sx={{
                            '& textarea': {
                              fontFamily: 'monospace',
                              fontSize: '14px',
                              lineHeight: 1.6
                            }
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          현재 글자 수: {articleForm.content.intermediate.length}자
                        </Typography>
                      </Box>
                    )}

                    {/* 고급자용 본문 */}
                    {activeContentTab === 2 && (
                      <Box>
                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'error.main' }}>
                          🔴 고급자용 본문 작성
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          전문 용어와 복잡한 구조를 사용하여 심화 분석과 고급 개념을 포함해주세요.
                        </Typography>
                        <TextField
                          fullWidth
                          label="고급자용 본문 내용 *"
                          value={articleForm.content.advanced}
                          onChange={(e) => setArticleForm({ 
                            ...articleForm, 
                            content: { ...articleForm.content, advanced: e.target.value } 
                          })}
                          multiline
                          rows={12}
                          placeholder="고급자 수준에 맞는 전문적인 내용으로 작성해주세요..."
                          sx={{
                            '& textarea': {
                              fontFamily: 'monospace',
                              fontSize: '14px',
                              lineHeight: 1.6
                            }
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          현재 글자 수: {articleForm.content.advanced.length}자
                        </Typography>
                      </Box>
                    )}

                    {/* 작성 진행상황 표시 */}
                    <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                        📊 작성 진행상황
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={4}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ color: articleForm.content.beginner.length > 0 ? 'success.main' : 'text.secondary' }}>
                              🟢 초급자: {articleForm.content.beginner.length}자
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={4}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ color: articleForm.content.intermediate.length > 0 ? 'warning.main' : 'text.secondary' }}>
                              🟡 중급자: {articleForm.content.intermediate.length}자
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={4}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ color: articleForm.content.advanced.length > 0 ? 'error.main' : 'text.secondary' }}>
                              🔴 고급자: {articleForm.content.advanced.length}자
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setArticleDialog(false)} startIcon={<Cancel />}>
              취소
            </Button>
            <Button 
              onClick={editingArticle ? handleUpdateArticle : handleAddArticle} 
              variant="contained" 
              startIcon={editingArticle ? <Save /> : <Publish />}
              size="large"
            >
              {editingArticle ? '수정 완료' : '기사 발행'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* 카테고리 추가 다이얼로그 */}
        <Dialog open={categoryDialog} onClose={() => setCategoryDialog(false)}>
          <DialogTitle>🏷️ 새 카테고리 추가</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="카테고리 이름"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              margin="normal"
              autoFocus
              placeholder="예: Health, Sports, Entertainment"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCategoryDialog(false)}>취소</Button>
            <Button onClick={handleAddCategory} variant="contained">추가</Button>
          </DialogActions>
        </Dialog>

        {/* 회원 추가/편집 다이얼로그 */}
        <Dialog open={memberDialog} onClose={() => setMemberDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Typography variant="h5" fontWeight="bold">
              {editingMember ? '✏️ 회원 정보 수정' : '👥 새 회원 추가'}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                {/* 기본 정보 */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                    👤 기본 정보
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="이름 *"
                    value={memberForm.name}
                    onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                    placeholder="회원 이름을 입력하세요"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="이메일 *"
                    type="email"
                    value={memberForm.email}
                    onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                    placeholder="이메일 주소를 입력하세요"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>권한</InputLabel>
                    <Select
                      value={memberForm.role}
                      label="권한"
                      onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                    >
                      <MenuItem value="User">👤 User</MenuItem>
                      <MenuItem value="admin">👑 Admin</MenuItem>
                      <MenuItem value="super_admin">🔥 Super Admin</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>상태</InputLabel>
                    <Select
                      value={memberForm.status}
                      label="상태"
                      onChange={(e) => setMemberForm({ ...memberForm, status: e.target.value })}
                    >
                      <MenuItem value="active">✅ 활성</MenuItem>
                      <MenuItem value="inactive">⚠️ 비활성</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* 구독 정보 */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 2, mb: 2, color: 'primary.main' }}>
                    💳 구독 정보
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>구독 플랜</InputLabel>
                    <Select
                      value={memberForm.subscriptionPlan}
                      label="구독 플랜"
                      onChange={(e) => handleSubscriptionPlanChange(e.target.value)}
                    >
                      {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
                        <MenuItem key={key} value={key}>
                          {plan.name} {plan.price > 0 && `(₩${plan.price.toLocaleString()}/월)`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>구독 상태</InputLabel>
                    <Select
                      value={memberForm.subscriptionStatus}
                      label="구독 상태"
                      onChange={(e) => setMemberForm({ ...memberForm, subscriptionStatus: e.target.value })}
                    >
                      <MenuItem value="active">✅ 활성</MenuItem>
                      <MenuItem value="paused">⏸️ 일시정지</MenuItem>
                      <MenuItem value="cancelled">❌ 취소됨</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                {memberForm.subscriptionPlan !== 'Free' && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="구독 만료일"
                      type="date"
                      value={memberForm.subscriptionExpiry}
                      onChange={(e) => setMemberForm({ ...memberForm, subscriptionExpiry: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                )}

                {/* 사용 제한 */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 2, mb: 2, color: 'primary.main' }}>
                    ⚙️ 사용 제한 (커스텀 설정)
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="월간 기사 제한"
                    type="number"
                    value={memberForm.monthlyArticleLimit}
                    onChange={(e) => setMemberForm({ ...memberForm, monthlyArticleLimit: parseInt(e.target.value) || 0 })}
                    helperText="-1은 무제한"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="월간 단어 저장 제한"
                    type="number"
                    value={memberForm.monthlyWordLimit}
                    onChange={(e) => setMemberForm({ ...memberForm, monthlyWordLimit: parseInt(e.target.value) || 0 })}
                    helperText="-1은 무제한"
                  />
                </Grid>

                {/* 기능 권한 */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 2, mb: 2, color: 'primary.main' }}>
                    🎯 기능 권한
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={memberForm.hasAITranslation}
                        onChange={(e) => setMemberForm({ ...memberForm, hasAITranslation: e.target.checked })}
                        color="primary"
                      />
                    }
                    label="🤖 AI 번역"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={memberForm.hasOfflineAccess}
                        onChange={(e) => setMemberForm({ ...memberForm, hasOfflineAccess: e.target.checked })}
                        color="primary"
                      />
                    }
                    label="📱 오프라인 접근"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={memberForm.hasPrioritySupport}
                        onChange={(e) => setMemberForm({ ...memberForm, hasPrioritySupport: e.target.checked })}
                        color="primary"
                      />
                    }
                    label="🎧 우선 지원"
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setMemberDialog(false)} startIcon={<Cancel />}>
              취소
            </Button>
            <Button 
              onClick={editingMember ? handleUpdateMember : handleAddMember} 
              variant="contained" 
              startIcon={<Save />}
              size="large"
            >
              {editingMember ? '수정 완료' : '회원 추가'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* 권한 변경 확인 다이얼로그 */}
        <Dialog 
          open={roleChangeDialog.open} 
          onClose={() => setRoleChangeDialog({ open: false, member: null, newRole: '' })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <Warning color="warning" />
              <Typography variant="h6" fontWeight="bold">
                권한 변경 확인
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              회원의 권한을 변경하면 접근 가능한 기능이 달라집니다.
            </Alert>
            
            {roleChangeDialog.member && (
              <Box>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>{roleChangeDialog.member.name}</strong>님의 권한을 변경하시겠습니까?
                </Typography>
                
                <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
                  <Box textAlign="center">
                    <Typography variant="caption" color="text.secondary">현재 권한</Typography>
                    <Chip 
                      label={roleChangeDialog.member.role || 'User'}
                      color={
                        roleChangeDialog.member.role === 'super_admin' ? 'error' : 
                        roleChangeDialog.member.role === 'admin' ? 'warning' : 
                        'default'
                      }
                      sx={{ display: 'block', mt: 0.5 }}
                    />
                  </Box>
                  
                  <Box sx={{ fontSize: '1.5rem' }}>→</Box>
                  
                  <Box textAlign="center">
                    <Typography variant="caption" color="text.secondary">새 권한</Typography>
                    <Chip 
                      label={roleChangeDialog.newRole}
                      color={
                        roleChangeDialog.newRole === 'super_admin' ? 'error' : 
                        roleChangeDialog.newRole === 'admin' ? 'warning' : 
                        'default'
                      }
                      sx={{ display: 'block', mt: 0.5 }}
                    />
                  </Box>
                </Box>

                <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {roleChangeDialog.newRole === 'super_admin' && '🔥 슈퍼 관리자 권한:'}
                    {roleChangeDialog.newRole === 'admin' && '👑 관리자 권한:'}
                    {roleChangeDialog.newRole === 'User' && '👤 일반 사용자 권한:'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {roleChangeDialog.newRole === 'super_admin' && 
                      '• 모든 관리 기능 접근\n• 다른 관리자 권한 관리\n• 시스템 설정 변경\n• 모든 데이터 접근'
                    }
                    {roleChangeDialog.newRole === 'admin' && 
                      '• 기사 및 카테고리 관리\n• 회원 관리 (제한적)\n• 통계 및 분석 접근\n• 공지사항 관리'
                    }
                    {roleChangeDialog.newRole === 'User' && 
                      '• 기사 읽기 및 좋아요\n• 단어 저장 및 학습\n• 기본 사용자 기능만 접근'
                    }
                  </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={() => setRoleChangeDialog({ open: false, member: null, newRole: '' })}
              startIcon={<Cancel />}
            >
              취소
            </Button>
            <Button 
              onClick={confirmRoleChange}
              variant="contained"
              color="warning"
              startIcon={<CheckCircle />}
            >
              권한 변경 확정
            </Button>
          </DialogActions>
        </Dialog>

        {/* 공지사항 추가/편집 다이얼로그 */}
        <Dialog open={noticeDialog} onClose={() => setNoticeDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Typography variant="h5" fontWeight="bold">
              {editingNotice ? '✏️ 공지사항 수정' : '📢 새 공지사항 추가'}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="제목 *"
                    value={noticeForm.title}
                    onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                    placeholder="공지사항 제목을 입력하세요"
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="내용 *"
                    value={noticeForm.content}
                    onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                    multiline
                    rows={4}
                    placeholder="공지사항 내용을 상세히 작성해주세요"
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>공지 타입</InputLabel>
                    <Select
                      value={noticeForm.type}
                      label="공지 타입"
                      onChange={(e) => setNoticeForm({ ...noticeForm, type: e.target.value })}
                    >
                      <MenuItem value="info">ℹ️ 정보</MenuItem>
                      <MenuItem value="success">✅ 성공</MenuItem>
                      <MenuItem value="warning">⚠️ 경고</MenuItem>
                      <MenuItem value="error">❌ 오류</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={noticeForm.active}
                        onChange={(e) => setNoticeForm({ ...noticeForm, active: e.target.checked })}
                        color="primary"
                      />
                    }
                    label="즉시 활성화"
                    sx={{ mt: 2 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    💡 활성화된 공지사항은 홈페이지 상단에 즉시 표시됩니다. 
                    여러 공지사항이 활성화되어 있으면 최신 것부터 순서대로 표시됩니다.
                  </Alert>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setNoticeDialog(false)} startIcon={<Cancel />}>
              취소
            </Button>
            <Button 
              onClick={handleAddNotice} 
              variant="contained" 
              startIcon={editingNotice ? <Save /> : <Announcement />}
              size="large"
            >
              {editingNotice ? '수정 완료' : '공지사항 발행'}
            </Button>
          </DialogActions>
        </Dialog>

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
      </MobileContentWrapper>
    </>
  );
};

// 스타일드 컴포넌트
const DashboardContainer = styled.div`
  padding: 0;
`;

const WelcomeCard = styled(Card)`
  padding: 2rem;
  margin-bottom: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 16px !important;
`;

const StatCard = styled(Card)`
  padding: 1.5rem;
  border-radius: 16px !important;
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  border-left: 4px solid #1976d2 !important;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1) !important;
  transition: all 0.3s ease !important;
  display: flex;
  align-items: center;
  height: 120px;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0,0,0,0.15) !important;
  }
`;

const StatIcon = styled.div`
  font-size: 2.5rem;
  margin-right: 1rem;
`;

const StatInfo = styled.div`
  flex: 1;
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #1976d2;
  line-height: 1;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.5rem;
`;

const ActionButton = styled(Button)`
  width: 100% !important;
  height: 100px !important;
  flex-direction: column !important;
  border-radius: 12px !important;
  border: 2px dashed #e0e0e0 !important;
  transition: all 0.3s ease !important;
  
  &:hover {
    border-color: #1976d2 !important;
    background-color: #f5f5f5 !important;
    transform: translateY(-2px) !important;
  }
`;

const CategoryCard = styled(Card)`
  border-radius: 12px !important;
  transition: all 0.3s ease !important;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
  }
`;

const CategoryManagementCard = styled(Card)`
  border-radius: 12px !important;
  transition: all 0.3s ease !important;
  border: 1px solid #e0e0e0;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
    border-color: #1976d2;
  }
`;

export default BlogStyleDashboard; 