import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  AppBar, Toolbar, Typography, IconButton, Button, Card, CardContent,
  Grid, TextField, Select, MenuItem, FormControl, InputLabel, Box,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Chip, Switch, FormControlLabel, Avatar, LinearProgress, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, Badge,
  List, ListItem, ListItemText, ListItemAvatar, Tooltip, Fab,
  SpeedDial, SpeedDialAction, SpeedDialIcon, Autocomplete,
  Tabs, Tab, Container, Stack, CardActions, CardMedia, Snackbar,
  TextareaAutosize, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
  Dashboard as DashboardIcon, Article, Category, People, BarChart,
  Add, Edit, Delete, Upload, Schedule, Analytics, TrendingUp,
  Visibility, ThumbUp, GetApp, Refresh, NotificationsActive,
  Settings, Timeline, PieChart, CalendarToday, Search, FilterList,
  ExitToApp, CloudUpload, Save, Cancel, Person, AdminPanelSettings,
  Star, Block, VerifiedUser, Email, Phone, LocationOn, ExpandMore,
  Preview, Featured, Update, Info, Warning, CheckCircle,
  KeyboardArrowUp, KeyboardArrowDown, DragIndicator
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useArticles } from '../contexts/ArticlesContext';

const ImprovedDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  const { allArticles, setAllArticles } = useArticles();
  const [activeTab, setActiveTab] = useState('overview');
  const [articleDialog, setArticleDialog] = useState(false);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, type: '', data: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [editTab, setEditTab] = useState('basic'); // 기사 편집 탭 상태

  // 실제 통계 데이터 (실시간 계산)
  const [realTimeStats, setRealTimeStats] = useState({
    lastUpdate: new Date().toLocaleTimeString()
  });

  // 실제 통계 계산
  const getActualStats = () => {
    const articles = allArticles || [];
    const totalViews = articles.reduce((sum, article) => sum + (article.views || 0), 0);
    const totalLikes = articles.reduce((sum, article) => sum + (article.likes || 0), 0);
    const publishedArticles = articles.filter(a => new Date(a.publishedAt) <= new Date()).length;
    const scheduledArticles = articles.filter(a => new Date(a.publishedAt) > new Date()).length;
    const draftArticles = 0; // 임시저장은 별도 상태로 관리하거나 현재는 예약 기사가 draft 역할
    
    return {
      totalArticles: articles.length,
      publishedArticles,
      scheduledArticles,
      draftArticles,
      totalViews,
      totalLikes,
      categories: [...new Set(articles.map(a => a.category))].length,
      avgReadTime: articles.length > 0 ? (articles.reduce((sum, a) => sum + (a.readingTime || 5), 0) / articles.length).toFixed(1) : 0
    };
  };

  const actualStats = getActualStats();

  // 실시간 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeStats({
        lastUpdate: new Date().toLocaleTimeString()
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // 기사 폼 데이터
  const [articleForm, setArticleForm] = useState({
    id: null,
    title: '',
    summary: '',
    content: '',
    category: '',
    level: 'Beginner',
    image: '',
    publishedAt: new Date().toISOString().split('T')[0],
    author: user?.name || 'Admin',
    source: 'MarLang News',
    readingTime: 5,
    likes: 0,
    views: 0,
    featured: false,
    scheduledPublication: false,
    publishImmediately: true
  });

  // 실제 카테고리 관리 (홈페이지와 동기화) - 순서 포함
  const [categories, setCategories] = useState(() => {
    const articleCategories = [...new Set((allArticles || []).map(a => a.category).filter(Boolean))];
    const defaultCategories = ['Technology', 'Science', 'Business', 'Health', 'Culture'];
    return [...new Set([...defaultCategories, ...articleCategories])];
  });

  // 카테고리 순서 관리
  const [categoryOrder, setCategoryOrder] = useState(() => {
    const saved = localStorage.getItem('marlang_category_order');
    return saved ? JSON.parse(saved) : [];
  });

  // 카테고리 순서 저장
  const saveCategoryOrder = (newOrder) => {
    setCategoryOrder(newOrder);
    localStorage.setItem('marlang_category_order', JSON.stringify(newOrder));
    
    // Emit custom event for same-tab communication
    window.dispatchEvent(new CustomEvent('categoryOrderChanged', { 
      detail: { newOrder } 
    }));
  };

  // 정렬된 카테고리 목록 반환
  const getOrderedCategories = () => {
    if (categoryOrder.length === 0) return categories;
    
    const ordered = [];
    const unordered = [...categories];
    
    // 저장된 순서대로 추가
    categoryOrder.forEach(catName => {
      const index = unordered.indexOf(catName);
      if (index !== -1) {
        ordered.push(catName);
        unordered.splice(index, 1);
      }
    });
    
    // 남은 카테고리 추가
    return [...ordered, ...unordered];
  };

  const [categoryForm, setCategoryForm] = useState({ 
    id: null,
    name: '', 
    description: '',
    color: '#1976d2',
    icon: '📰'
  });

  // 실제 사용자 데이터 (확장 가능)
  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'Alice Kim',
      email: 'alice@marlang.com',
      role: 'User',
      status: 'Active',
      joinDate: '2025-01-15',
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      articlesRead: Math.floor(Math.random() * 50) + 10,
      wordsLearned: Math.floor(Math.random() * 1000) + 500,
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5e5?w=150',
      preferences: { language: 'Korean', notifications: true }
    },
    {
      id: 2,
      name: 'Bob Lee',
      email: 'bob@marlang.com',
      role: 'Premium',
      status: 'Active',
      joinDate: '2025-02-20',
      lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      articlesRead: Math.floor(Math.random() * 100) + 50,
      wordsLearned: Math.floor(Math.random() * 2000) + 1000,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      preferences: { language: 'English', notifications: true }
    },
    {
      id: 3,
      name: user?.name || 'Admin User',
      email: user?.email || 'admin@marlang.com',
      role: 'Admin',
      status: 'Active',
      joinDate: '2024-12-10',
      lastActive: new Date().toISOString(),
      articlesRead: Math.floor(Math.random() * 200) + 100,
      wordsLearned: Math.floor(Math.random() * 5000) + 2000,
      avatar: user?.picture || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      preferences: { language: 'Korean', notifications: true }
    }
  ]);

  const [userForm, setUserForm] = useState({
    id: null,
    name: '',
    email: '',
    role: 'User',
    status: 'Active',
    preferences: { language: 'Korean', notifications: true }
  });

  // 개선된 기사 관리 함수들
  const handleArticleSubmit = (e) => {
    e.preventDefault();
    
    try {
      if (articleForm.id) {
        // 수정
        const updatedArticles = (allArticles || []).map(article => 
          article.id === articleForm.id ? {
            ...articleForm,
            publishedAt: new Date(articleForm.publishedAt).toISOString(),
            updatedAt: new Date().toISOString()
          } : article
        );
        setAllArticles(updatedArticles);
        setSnackbar({ open: true, message: '기사가 성공적으로 수정되었습니다.', severity: 'success' });
      } else {
        // 새 기사 추가
        const newArticle = {
          ...articleForm,
          id: `article-${Date.now()}`,
          publishedAt: new Date(articleForm.publishedAt).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setAllArticles([newArticle, ...(allArticles || [])]);
        setSnackbar({ open: true, message: '새 기사가 성공적으로 추가되었습니다.', severity: 'success' });
      }
      
      // 카테고리 자동 추가
      if (articleForm.category && !categories.includes(articleForm.category)) {
        setCategories(prev => [...prev, articleForm.category]);
      }
      
      resetArticleForm();
      setArticleDialog(false);
    } catch (error) {
      setSnackbar({ open: true, message: '오류가 발생했습니다.', severity: 'error' });
    }
  };

  const resetArticleForm = () => {
    setArticleForm({
      id: null,
      title: '',
      summary: '',
      content: '',
      category: '',
      level: 'Beginner',
      image: '',
      publishedAt: new Date().toISOString().split('T')[0] + 'T' + new Date().toTimeString().slice(0,5),
      author: user?.name || 'Admin',
      source: 'MarLang News',
      readingTime: 5,
      likes: 0,
      views: 0,
      featured: false,
      scheduledPublication: false,
      publishImmediately: true
    });
  };

  const handleEditArticle = (article) => {
    setArticleForm({
      ...article,
      publishedAt: new Date(article.publishedAt).toISOString().split('T')[0]
    });
    setEditTab('basic'); // 편집시 첫 번째 탭으로 초기화
    setArticleDialog(true);
  };

  const handleDeleteArticle = (id) => {
    try {
      const updatedArticles = (allArticles || []).filter(article => article.id !== id);
      setAllArticles(updatedArticles);
      setSnackbar({ open: true, message: '기사가 삭제되었습니다.', severity: 'info' });
      setDeleteConfirm({ open: false, id: null, type: '' });
    } catch (error) {
      setSnackbar({ open: true, message: '삭제 중 오류가 발생했습니다.', severity: 'error' });
    }
  };

  // 개선된 카테고리 관리
  const handleCategorySubmit = (e) => {
    e.preventDefault();
    
    try {
      if (categoryForm.id) {
        // 카테고리 이름 변경시 기사의 카테고리도 업데이트
        const oldName = categories.find(cat => cat === categoryForm.id);
        if (oldName && oldName !== categoryForm.name) {
          const updatedArticles = (allArticles || []).map(article => 
            article.category === oldName ? { ...article, category: categoryForm.name } : article
          );
          setAllArticles(updatedArticles);
        }
        
        setCategories(prev => prev.map(cat => cat === categoryForm.id ? categoryForm.name : cat));
        setSnackbar({ open: true, message: '카테고리가 수정되었습니다.', severity: 'success' });
        
        // Trigger homepage update
        window.dispatchEvent(new CustomEvent('categoryOrderChanged', { 
          detail: { action: 'edit', category: categoryForm.name } 
        }));
      } else {
        // 새 카테고리 추가
        if (categoryForm.name && !categories.includes(categoryForm.name)) {
          setCategories(prev => [...prev, categoryForm.name]);
          setSnackbar({ open: true, message: '새 카테고리가 추가되었습니다.', severity: 'success' });
          
          // Trigger homepage update
          window.dispatchEvent(new CustomEvent('categoryOrderChanged', { 
            detail: { action: 'add', category: categoryForm.name } 
          }));
        }
      }
      
      resetCategoryForm();
      setCategoryDialog(false);
    } catch (error) {
      setSnackbar({ open: true, message: '카테고리 처리 중 오류가 발생했습니다.', severity: 'error' });
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({ 
      id: null,
      name: '', 
      description: '',
      color: '#1976d2',
      icon: '📰'
    });
  };

  const handleEditCategory = (categoryName) => {
    setCategoryForm({
      id: categoryName,
      name: categoryName,
      description: '',
      color: '#1976d2',
      icon: '📰'
    });
    setCategoryDialog(true);
  };

  // 카테고리 순서 변경 (드래그 앤 드롭)
  const handleCategoryDragStart = (e, categoryName) => {
    e.dataTransfer.setData('text/plain', categoryName);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCategoryDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleCategoryDrop = (e, targetCategory) => {
    e.preventDefault();
    const draggedCategory = e.dataTransfer.getData('text/plain');
    
    if (draggedCategory && draggedCategory !== targetCategory) {
      const orderedCats = getOrderedCategories();
      const draggedIndex = orderedCats.indexOf(draggedCategory);
      const targetIndex = orderedCats.indexOf(targetCategory);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newOrder = [...orderedCats];
        // 드래그된 항목을 제거하고 타겟 위치에 삽입
        newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, draggedCategory);
        
        saveCategoryOrder(newOrder);
        setSnackbar({ open: true, message: '카테고리 순서가 변경되었습니다.', severity: 'success' });
      }
    }
  };

  // 카테고리 위아래 이동
  const moveCategoryUp = (categoryName) => {
    const orderedCats = getOrderedCategories();
    const index = orderedCats.indexOf(categoryName);
    
    if (index > 0) {
      const newOrder = [...orderedCats];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      saveCategoryOrder(newOrder);
      setSnackbar({ open: true, message: '카테고리가 위로 이동되었습니다.', severity: 'success' });
    }
  };

  const moveCategoryDown = (categoryName) => {
    const orderedCats = getOrderedCategories();
    const index = orderedCats.indexOf(categoryName);
    
    if (index < orderedCats.length - 1) {
      const newOrder = [...orderedCats];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      saveCategoryOrder(newOrder);
      setSnackbar({ open: true, message: '카테고리가 아래로 이동되었습니다.', severity: 'success' });
    }
  };

  const handleDeleteCategory = (categoryName) => {
    try {
      // 해당 카테고리의 기사들을 "Uncategorized"로 변경
      const updatedArticles = (allArticles || []).map(article => 
        article.category === categoryName ? { ...article, category: 'Uncategorized' } : article
      );
      setAllArticles(updatedArticles);
      setCategories(prev => prev.filter(cat => cat !== categoryName));
      
      // Uncategorized 카테고리가 없으면 추가
      if (!categories.includes('Uncategorized')) {
        setCategories(prev => [...prev, 'Uncategorized']);
      }
      
      setSnackbar({ open: true, message: '카테고리가 삭제되고 기사들이 미분류로 이동되었습니다.', severity: 'info' });
      setDeleteConfirm({ open: false, id: null, type: '' });
    } catch (error) {
      setSnackbar({ open: true, message: '삭제 중 오류가 발생했습니다.', severity: 'error' });
    }
  };

  // 사용자 관리 함수들
  const handleUserSubmit = (e) => {
    e.preventDefault();
    
    try {
      if (userForm.id) {
        const updatedUsers = users.map(user => 
          user.id === userForm.id ? { ...user, ...userForm, updatedAt: new Date().toISOString() } : user
        );
        setUsers(updatedUsers);
        setSnackbar({ open: true, message: '사용자 정보가 수정되었습니다.', severity: 'success' });
      } else {
        const newUser = {
          ...userForm,
          id: Math.max(...users.map(u => u.id)) + 1,
          joinDate: new Date().toISOString().split('T')[0],
          lastActive: new Date().toISOString(),
          articlesRead: 0,
          wordsLearned: 0,
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
          createdAt: new Date().toISOString()
        };
        setUsers([...users, newUser]);
        setSnackbar({ open: true, message: '새 사용자가 추가되었습니다.', severity: 'success' });
      }
      
      resetUserForm();
      setEditDialog({ open: false, type: '', data: null });
    } catch (error) {
      setSnackbar({ open: true, message: '사용자 처리 중 오류가 발생했습니다.', severity: 'error' });
    }
  };

  const resetUserForm = () => {
    setUserForm({
      id: null,
      name: '',
      email: '',
      role: 'User',
      status: 'Active',
      preferences: { language: 'Korean', notifications: true }
    });
  };

  const handleEditUser = (user) => {
    setUserForm({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      preferences: user.preferences || { language: 'Korean', notifications: true }
    });
    setEditDialog({ open: true, type: 'user', data: user });
  };

  const handleDeleteUser = (id) => {
    try {
      setUsers(users.filter(user => user.id !== id));
      setSnackbar({ open: true, message: '사용자가 삭제되었습니다.', severity: 'info' });
      setDeleteConfirm({ open: false, id: null, type: '' });
    } catch (error) {
      setSnackbar({ open: true, message: '삭제 중 오류가 발생했습니다.', severity: 'error' });
    }
  };

  // 필터링된 기사들
  const filteredArticles = (allArticles || []).filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || article.category === filterCategory;
    const matchesStatus = !filterStatus || 
      (filterStatus === 'published' && new Date(article.publishedAt) <= new Date()) ||
      (filterStatus === 'draft' && new Date(article.publishedAt) > new Date()) ||
      (filterStatus === 'scheduled' && new Date(article.publishedAt) > new Date());
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // 카테고리별 통계
  const getCategoryStats = () => {
    return categories.map(category => {
      const categoryArticles = (allArticles || []).filter(a => a.category === category);
      const totalViews = categoryArticles.reduce((sum, a) => sum + (a.views || 0), 0);
      const totalLikes = categoryArticles.reduce((sum, a) => sum + (a.likes || 0), 0);
      
      return {
        name: category,
        articles: categoryArticles.length,
        views: totalViews,
        likes: totalLikes,
        percentage: actualStats.totalArticles > 0 ? Math.round((categoryArticles.length / actualStats.totalArticles) * 100) : 0
      };
    }).sort((a, b) => b.articles - a.articles);
  };

  // 개선된 개요 탭 렌더링
  const renderImprovedOverview = () => (
    <Box>
      {/* 실제 통계 카드 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <EnhancedStatCard>
            <StatIcon>📚</StatIcon>
            <StatContent>
              <StatNumber>{actualStats.totalArticles}</StatNumber>
              <StatLabel>총 기사</StatLabel>
              <StatDetail>발행: {actualStats.publishedArticles} | 예약: {actualStats.scheduledArticles}</StatDetail>
            </StatContent>
          </EnhancedStatCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <EnhancedStatCard>
            <StatIcon>📂</StatIcon>
            <StatContent>
              <StatNumber>{actualStats.categories}</StatNumber>
              <StatLabel>카테고리</StatLabel>
              <StatDetail>활성 카테고리 수</StatDetail>
            </StatContent>
          </EnhancedStatCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <EnhancedStatCard>
            <StatIcon>👀</StatIcon>
            <StatContent>
              <StatNumber>{actualStats.totalViews.toLocaleString()}</StatNumber>
              <StatLabel>총 조회수</StatLabel>
              <StatDetail>평균 조회: {Math.round(actualStats.totalViews / Math.max(actualStats.totalArticles, 1))}</StatDetail>
            </StatContent>
          </EnhancedStatCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <EnhancedStatCard>
            <StatIcon>❤️</StatIcon>
            <StatContent>
              <StatNumber>{actualStats.totalLikes.toLocaleString()}</StatNumber>
              <StatLabel>총 좋아요</StatLabel>
              <StatDetail>평균 독서시간: {actualStats.avgReadTime}분</StatDetail>
            </StatContent>
          </EnhancedStatCard>
        </Grid>
      </Grid>

      {/* 카테고리별 성과 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <PieChart sx={{ mr: 1 }} />
            카테고리별 성과 분석
            <Chip 
              label={`업데이트: ${realTimeStats.lastUpdate}`} 
              size="small" 
              sx={{ ml: 'auto' }} 
            />
          </Typography>
          
          <Grid container spacing={2}>
            {getCategoryStats().map((stat, index) => (
              <Grid item xs={12} sm={6} md={4} key={stat.name}>
                <CategoryStatCard rank={index + 1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" fontWeight="bold">
                      {stat.name}
                    </Typography>
                    <Chip 
                      label={`${stat.percentage}%`} 
                      size="small" 
                      color={index < 3 ? 'primary' : 'default'}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {stat.articles}개 기사 • {stat.views.toLocaleString()} 조회 • {stat.likes} 좋아요
                  </Typography>
                  
                  <LinearProgress 
                    variant="determinate" 
                    value={stat.percentage} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      backgroundColor: '#f0f0f0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: index < 3 ? '#1976d2' : '#999'
                      }
                    }}
                  />
                </CategoryStatCard>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* 최근 활동 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            시스템 정보
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <InfoCard>
                <Typography variant="h4">👥</Typography>
                <Typography variant="h6">{users.length}</Typography>
                <Typography variant="body2">총 사용자</Typography>
              </InfoCard>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InfoCard>
                <Typography variant="h4">✅</Typography>
                <Typography variant="h6">{users.filter(u => u.status === 'Active').length}</Typography>
                <Typography variant="body2">활성 사용자</Typography>
              </InfoCard>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InfoCard>
                <Typography variant="h4">⭐</Typography>
                <Typography variant="h6">{users.filter(u => u.role === 'Premium').length}</Typography>
                <Typography variant="body2">프리미엄 사용자</Typography>
              </InfoCard>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InfoCard>
                <Typography variant="h4">🛡️</Typography>
                <Typography variant="h6">{users.filter(u => u.role === 'Admin').length}</Typography>
                <Typography variant="body2">관리자</Typography>
              </InfoCard>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );

  // 개선된 기사 관리 탭
  const renderImprovedArticleManagement = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
          <Article sx={{ mr: 1 }} />
          기사 관리
          <Chip label={`${filteredArticles.length}개`} sx={{ ml: 2 }} />
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={() => {
            resetArticleForm();
            setEditTab('basic');
            setArticleDialog(true);
          }}
          size="large"
        >
          새 기사 작성
        </Button>
      </Box>

      {/* 개선된 검색 및 필터 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                placeholder="기사 제목으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>카테고리</InputLabel>
                <Select 
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <MenuItem value="">전체</MenuItem>
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>상태</InputLabel>
                <Select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="">전체</MenuItem>
                  <MenuItem value="published">발행됨</MenuItem>
                  <MenuItem value="draft">임시저장</MenuItem>
                  <MenuItem value="scheduled">예약발행</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<Refresh />} 
                  onClick={() => {
                    setSearchTerm('');
                    setFilterCategory('');
                    setFilterStatus('');
                  }}
                >
                  초기화
                </Button>
                <Button variant="outlined" startIcon={<GetApp />}>
                  내보내기
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 개선된 기사 그리드 */}
      <Grid container spacing={3}>
        {filteredArticles.map((article) => (
          <Grid item xs={12} sm={6} lg={4} key={article.id}>
            <ImprovedArticleCard>
              <CardMedia
                component="img"
                height="160"
                image={article.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400'}
                alt={article.title}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Chip 
                    label={article.category} 
                    size="small" 
                    color="primary"
                    variant="outlined"
                  />
                  <Chip 
                    label={article.level} 
                    size="small" 
                    color={
                      article.level === 'Beginner' ? 'success' :
                      article.level === 'Intermediate' ? 'warning' : 'error'
                    }
                  />
                </Box>
                
                <Typography gutterBottom variant="h6" component="div" sx={{ 
                  fontWeight: 'bold',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {article.title}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ 
                  mb: 2,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {article.summary || '요약이 없습니다.'}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Visibility sx={{ fontSize: 16, mr: 0.5 }} />
                    <Typography variant="caption">{article.views || 0}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ThumbUp sx={{ fontSize: 16, mr: 0.5 }} />
                    <Typography variant="caption">{article.likes || 0}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Schedule sx={{ fontSize: 16, mr: 0.5 }} />
                    <Typography variant="caption">{article.readingTime || 5}분</Typography>
                  </Box>
                </Box>
                
                <Typography variant="caption" color="text.secondary">
                  {new Date(article.publishedAt).toLocaleDateString()} • {article.author}
                  {new Date(article.publishedAt) > new Date() && 
                    <Chip label="예약됨" size="small" color="warning" sx={{ ml: 1 }} />
                  }
                </Typography>
              </CardContent>
              
              <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                <Box>
                  <Button 
                    size="small" 
                    startIcon={<Edit />} 
                    onClick={() => handleEditArticle(article)}
                  >
                    편집
                  </Button>
                  <Button 
                    size="small" 
                    startIcon={<Preview />}
                    onClick={() => navigate(`/article/${article.id}`)}
                  >
                    미리보기
                  </Button>
                </Box>
                <Button 
                  size="small" 
                  startIcon={<Delete />} 
                  color="error"
                  onClick={() => setDeleteConfirm({ open: true, id: article.id, type: 'article' })}
                >
                  삭제
                </Button>
              </CardActions>
            </ImprovedArticleCard>
          </Grid>
        ))}
      </Grid>

      {filteredArticles.length === 0 && (
        <EmptyState>
          <Article sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            {searchTerm || filterCategory || filterStatus ? '검색 결과가 없습니다' : '기사가 없습니다'}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {searchTerm || filterCategory || filterStatus 
              ? '다른 검색어나 필터를 시도해보세요' 
              : '첫 번째 기사를 작성해보세요'
            }
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setArticleDialog(true)}>
            새 기사 작성
          </Button>
        </EmptyState>
      )}
    </Box>
  );

  // 개선된 카테고리 관리 탭
  const renderImprovedCategoryManagement = () => {
    const orderedCategories = getOrderedCategories();
    const categoryStats = getCategoryStats();
    
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
            <Category sx={{ mr: 1 }} />
            카테고리 관리
            <Chip label={`${categories.length}개`} sx={{ ml: 2 }} />
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => {
                saveCategoryOrder([]);
                setSnackbar({ open: true, message: '카테고리 순서가 초기화되었습니다.', severity: 'info' });
              }}
            >
              순서 초기화
            </Button>
            <Button 
              variant="contained" 
              startIcon={<Add />}
              onClick={() => setCategoryDialog(true)}
            >
              새 카테고리 추가
            </Button>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            💡 카테고리를 드래그하여 순서를 변경하거나, 화살표 버튼을 사용하세요. 홈페이지 탭 순서에도 즉시 반영됩니다.
          </Typography>
        </Alert>
        
        <Grid container spacing={3}>
          {orderedCategories.map((categoryName, index) => {
            const stat = categoryStats.find(s => s.name === categoryName) || {
              name: categoryName,
              articles: 0,
              views: 0,
              likes: 0,
              percentage: 0
            };
            
            return (
              <Grid item xs={12} sm={6} md={4} key={stat.name}>
                <CategoryCard
                  draggable
                  onDragStart={(e) => handleCategoryDragStart(e, stat.name)}
                  onDragOver={handleCategoryDragOver}
                  onDrop={(e) => handleCategoryDrop(e, stat.name)}
                  sx={{
                    cursor: 'grab',
                    '&:active': { cursor: 'grabbing' },
                    '&:hover': { 
                      boxShadow: '0 4px 20px rgba(25, 118, 210, 0.15)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DragIndicator sx={{ mr: 1, color: 'text.secondary', cursor: 'grab' }} />
                        <Typography variant="h6" fontWeight="bold">
                          {stat.name}
                        </Typography>
                        <Chip 
                          label={`#${index + 1}`} 
                          size="small" 
                          sx={{ ml: 1 }}
                          color="primary"
                        />
                      </Box>
                      <Box>
                        <Tooltip title="위로 이동">
                          <IconButton 
                            size="small" 
                            onClick={() => moveCategoryUp(stat.name)}
                            disabled={index === 0}
                          >
                            <KeyboardArrowUp />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="아래로 이동">
                          <IconButton 
                            size="small" 
                            onClick={() => moveCategoryDown(stat.name)}
                            disabled={index === orderedCategories.length - 1}
                          >
                            <KeyboardArrowDown />
                          </IconButton>
                        </Tooltip>
                        <IconButton size="small" onClick={() => handleEditCategory(stat.name)}>
                          <Edit />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => setDeleteConfirm({ open: true, id: stat.name, type: 'category' })}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        📚 {stat.articles}개 기사
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        👀 {stat.views.toLocaleString()} 조회수
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ❤️ {stat.likes} 좋아요
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">비중</Typography>
                        <Typography variant="body2">{stat.percentage}%</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={stat.percentage} 
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  </CardContent>
                </CategoryCard>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  };

  // 개선된 사용자 관리 탭 (이전과 동일하지만 스타일 개선)
  const renderImprovedUserManagement = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
          <People sx={{ mr: 1 }} />
          사용자 관리
          <Chip label={`${users.length}명`} sx={{ ml: 2 }} />
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={() => setEditDialog({ open: true, type: 'user', data: null })}
        >
          새 사용자 추가
        </Button>
      </Box>

      {/* 사용자 통계 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { label: '총 사용자', value: users.length, color: 'primary', icon: '👥' },
          { label: '활성 사용자', value: users.filter(u => u.status === 'Active').length, color: 'success', icon: '✅' },
          { label: '프리미엄', value: users.filter(u => u.role === 'Premium').length, color: 'warning', icon: '⭐' },
          { label: '관리자', value: users.filter(u => u.role === 'Admin').length, color: 'error', icon: '🛡️' }
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4">{stat.icon}</Typography>
              <Typography variant="h4" color={`${stat.color}.main`}>
                {stat.value}
              </Typography>
              <Typography variant="body2">{stat.label}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 사용자 목록 */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>사용자</TableCell>
                <TableCell>역할</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>가입일</TableCell>
                <TableCell>마지막 활동</TableCell>
                <TableCell>학습 통계</TableCell>
                <TableCell>액션</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar src={user.avatar} sx={{ mr: 2 }} />
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {user.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={user.role} 
                      size="small"
                      color={
                        user.role === 'Admin' ? 'error' :
                        user.role === 'Premium' ? 'warning' : 'default'
                      }
                      icon={
                        user.role === 'Admin' ? <AdminPanelSettings /> :
                        user.role === 'Premium' ? <Star /> : <Person />
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={user.status} 
                      size="small"
                      color={user.status === 'Active' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{user.joinDate}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(user.lastActive).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      📚 {user.articlesRead}개 • 📝 {user.wordsLearned}개
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleEditUser(user)}>
                      <Edit />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => setDeleteConfirm({ open: true, id: user.id, type: 'user' })}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );

  return (
    <DashboardContainer>
      <AppBar position="static" sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Toolbar>
          <DashboardIcon sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            MarLang 관리자 대시보드
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip 
              label={`업데이트: ${realTimeStats.lastUpdate}`}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
            />
            
            <Avatar src={user?.picture} sx={{ width: 32, height: 32 }} />
            
            <IconButton color="inherit" onClick={() => signOut()}>
              <ExitToApp />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Content>
        <Sidebar>
          {[
            { id: 'overview', label: '대시보드', icon: DashboardIcon, badge: null },
            { id: 'articles', label: '기사 관리', icon: Article, badge: actualStats.totalArticles },
            { id: 'categories', label: '카테고리', icon: Category, badge: categories.length },
            { id: 'users', label: '사용자 관리', icon: People, badge: users.length },
            { id: 'analytics', label: '통계 분석', icon: Analytics, badge: null }
          ].map((item) => (
            <SidebarItem 
              key={item.id}
              $active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon sx={{ mr: 1 }} />
              {item.label}
              {item.badge && (
                <Badge badgeContent={item.badge} color="primary" sx={{ ml: 'auto' }} />
              )}
            </SidebarItem>
          ))}
        </Sidebar>

        <MainContent>
          {activeTab === 'overview' && renderImprovedOverview()}
          {activeTab === 'articles' && renderImprovedArticleManagement()}
          {activeTab === 'categories' && renderImprovedCategoryManagement()}
          {activeTab === 'users' && renderImprovedUserManagement()}
          {activeTab === 'analytics' && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Analytics sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h4" color="text.secondary">
                고급 분석 도구
              </Typography>
              <Typography variant="body1" color="text.secondary">
                상세한 분석 차트와 리포트가 곧 추가됩니다
              </Typography>
            </Box>
          )}
        </MainContent>
      </Content>

      {/* 개선된 기사 편집 다이얼로그 - 탭 기반 UI */}
      <Dialog 
        open={articleDialog} 
        onClose={() => setArticleDialog(false)} 
        maxWidth="xl" 
        fullWidth
        PaperProps={{ sx: { height: '90vh', maxHeight: '90vh' } }}
      >
        <DialogTitle sx={{ pb: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {articleForm.id ? <Edit sx={{ mr: 1 }} /> : <Add sx={{ mr: 1 }} />}
              <Typography variant="h6">
                {articleForm.id ? '기사 편집' : '새 기사 작성'}
              </Typography>
              {articleForm.title && (
                <Chip 
                  label={articleForm.title.substring(0, 30) + (articleForm.title.length > 30 ? '...' : '')} 
                  sx={{ ml: 2 }} 
                  size="small"
                />
              )}
            </Box>
            <Box>
              <Button size="small" onClick={() => console.log('자동저장')}>
                자동저장: 활성화
              </Button>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0, height: '100%' }}>
          <Tabs value={editTab} onChange={(e, newValue) => setEditTab(newValue)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="기본 정보" value="basic" />
            <Tab label="내용 작성" value="content" />
            <Tab label="설정 및 발행" value="publish" />
            <Tab label="미리보기" value="preview" />
          </Tabs>
          
          <Box sx={{ p: 3, height: 'calc(100% - 48px)', overflow: 'auto' }}>
            {/* 기본 정보 탭 */}
            {editTab === 'basic' && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="기사 제목"
                    value={articleForm.title}
                    onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                    required
                    size="large"
                    helperText="독자의 관심을 끌 수 있는 매력적인 제목을 작성하세요"
                    InputProps={{
                      sx: { fontSize: '1.1rem' }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="기사 요약"
                    value={articleForm.summary}
                    onChange={(e) => setArticleForm({ ...articleForm, summary: e.target.value })}
                    multiline
                    rows={3}
                    helperText="기사의 핵심 내용을 2-3문장으로 요약하세요 (SNS 공유시 사용됩니다)"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    freeSolo
                    options={categories}
                    value={articleForm.category}
                    onChange={(e, newValue) => setArticleForm({ ...articleForm, category: newValue || '' })}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="카테고리"
                        required
                        helperText="기존 카테고리 선택 또는 새 카테고리 입력"
                      />
                    )}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>난이도 레벨</InputLabel>
                    <Select
                      value={articleForm.level}
                      onChange={(e) => setArticleForm({ ...articleForm, level: e.target.value })}
                    >
                      <MenuItem value="Beginner">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Chip label="초급" color="success" size="small" sx={{ mr: 1 }} />
                          쉬운 어휘, 간단한 문장구조
                        </Box>
                      </MenuItem>
                      <MenuItem value="Intermediate">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Chip label="중급" color="warning" size="small" sx={{ mr: 1 }} />
                          일반적인 어휘, 중간 복잡도
                        </Box>
                      </MenuItem>
                      <MenuItem value="Advanced">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Chip label="고급" color="error" size="small" sx={{ mr: 1 }} />
                          전문 어휘, 복잡한 문장구조
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="썸네일 이미지 URL"
                    value={articleForm.image}
                    onChange={(e) => setArticleForm({ ...articleForm, image: e.target.value })}
                    helperText="고해상도 이미지 URL을 입력하세요 (권장 크기: 800x600)"
                  />
                  {articleForm.image && (
                    <Box sx={{ mt: 2 }}>
                      <img 
                        src={articleForm.image} 
                        alt="미리보기" 
                        style={{ maxWidth: '300px', maxHeight: '200px', borderRadius: '8px' }}
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    </Box>
                  )}
                </Grid>
              </Grid>
            )}
            
            {/* 내용 작성 탭 */}
            {editTab === 'content' && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">기사 본문</Typography>
                    <Box>
                      <Button size="small" startIcon={<Upload />} sx={{ mr: 1 }}>
                        이미지 삽입
                      </Button>
                      <Button size="small" startIcon={<Preview />}>
                        실시간 미리보기
                      </Button>
                    </Box>
                  </Box>
                  
                  <TextField
                    fullWidth
                    multiline
                    rows={20}
                    value={articleForm.content}
                    onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                    placeholder="기사 내용을 작성하세요..."
                    required
                    helperText="마크다운 문법을 지원합니다. **굵게**, *기울임*, [링크](URL) 등을 사용할 수 있습니다"
                    InputProps={{
                      sx: { 
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        lineHeight: 1.6
                      }
                    }}
                  />
                  
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    글자 수: {articleForm.content.length} | 예상 독서시간: {Math.ceil(articleForm.content.length / 200)}분
                  </Typography>
                </Grid>
              </Grid>
            )}
            
            {/* 설정 및 발행 탭 */}
            {editTab === 'publish' && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="예상 독서시간 (분)"
                    value={articleForm.readingTime}
                    onChange={(e) => setArticleForm({ ...articleForm, readingTime: parseInt(e.target.value) || 5 })}
                    inputProps={{ min: 1, max: 60 }}
                    helperText="독자가 이 기사를 읽는데 필요한 시간"
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="작성자"
                    value={articleForm.author}
                    onChange={(e) => setArticleForm({ ...articleForm, author: e.target.value })}
                    helperText="기사 작성자 이름"
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="출처"
                    value={articleForm.source}
                    onChange={(e) => setArticleForm({ ...articleForm, source: e.target.value })}
                    helperText="기사 출처 또는 매체명"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, bgcolor: 'background.paper' }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <Schedule sx={{ mr: 1 }} />
                      발행 일정 설정
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch 
                              checked={articleForm.publishImmediately}
                              onChange={(e) => {
                                const immediate = e.target.checked;
                                setArticleForm({ 
                                  ...articleForm, 
                                  publishImmediately: immediate,
                                  publishedAt: immediate 
                                    ? new Date().toISOString().split('T')[0] + 'T' + new Date().toTimeString().slice(0,5)
                                    : articleForm.publishedAt
                                });
                              }}
                            />
                          }
                          label="즉시 발행"
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4 }}>
                          활성화하면 저장과 동시에 기사가 발행됩니다
                        </Typography>
                      </Grid>
                      
                      {!articleForm.publishImmediately && (
                        <>
                          <Grid item xs={12} md={8}>
                            <TextField
                              fullWidth
                              type="datetime-local"
                              label="예약 발행 일시"
                              InputLabelProps={{ shrink: true }}
                              value={articleForm.publishedAt}
                              onChange={(e) => setArticleForm({ ...articleForm, publishedAt: e.target.value })}
                              helperText="설정한 날짜와 시간에 자동으로 발행됩니다"
                            />
                          </Grid>
                          
                          <Grid item xs={12} md={4}>
                            <Typography variant="body2" gutterBottom>빠른 설정</Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                              <Button 
                                size="small" 
                                variant="outlined"
                                onClick={() => {
                                  const tomorrow = new Date();
                                  tomorrow.setDate(tomorrow.getDate() + 1);
                                  tomorrow.setHours(9, 0, 0, 0);
                                  setArticleForm({ 
                                    ...articleForm, 
                                    publishedAt: tomorrow.toISOString().slice(0, 16)
                                  });
                                }}
                              >
                                내일 오전 9시
                              </Button>
                              <Button 
                                size="small" 
                                variant="outlined"
                                onClick={() => {
                                  const nextWeek = new Date();
                                  nextWeek.setDate(nextWeek.getDate() + 7);
                                  nextWeek.setHours(10, 0, 0, 0);
                                  setArticleForm({ 
                                    ...articleForm, 
                                    publishedAt: nextWeek.toISOString().slice(0, 16)
                                  });
                                }}
                              >
                                다음주
                              </Button>
                              <Button 
                                size="small" 
                                variant="outlined"
                                onClick={() => {
                                  const nextMonth = new Date();
                                  nextMonth.setMonth(nextMonth.getMonth() + 1);
                                  nextMonth.setHours(10, 0, 0, 0);
                                  setArticleForm({ 
                                    ...articleForm, 
                                    publishedAt: nextMonth.toISOString().slice(0, 16)
                                  });
                                }}
                              >
                                다음달
                              </Button>
                            </Stack>
                          </Grid>
                          
                          {new Date(articleForm.publishedAt) > new Date() && (
                            <Grid item xs={12}>
                              <Alert severity="info" icon={<Schedule />}>
                                <Typography variant="body2">
                                  📅 예약 발행: {new Date(articleForm.publishedAt).toLocaleString('ko-KR')}
                                  <br />
                                  ⏰ 남은 시간: {Math.ceil((new Date(articleForm.publishedAt) - new Date()) / (1000 * 60 * 60 * 24))}일 후
                                </Typography>
                              </Alert>
                            </Grid>
                          )}
                        </>
                      )}
                    </Grid>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={articleForm.featured || false}
                        onChange={(e) => setArticleForm({ ...articleForm, featured: e.target.checked })}
                      />
                    }
                    label="추천 기사로 설정"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    추천 기사는 홈페이지 상단에 우선 표시됩니다
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>발행 미리보기</Typography>
                    <Typography variant="body2" color="text.secondary">
                      카테고리: {articleForm.category || '미지정'} | 
                      난이도: {articleForm.level} | 
                      독서시간: {articleForm.readingTime}분 | 
                      작성자: {articleForm.author}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            )}
            
            {/* 미리보기 탭 */}
            {editTab === 'preview' && (
              <Box>
                <Typography variant="h4" gutterBottom>{articleForm.title || '제목을 입력하세요'}</Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip label={articleForm.category} color="primary" size="small" />
                  <Chip label={articleForm.level} color="secondary" size="small" />
                  <Chip label={`${articleForm.readingTime}분`} variant="outlined" size="small" />
                </Box>
                {articleForm.image && (
                  <img 
                    src={articleForm.image} 
                    alt="썸네일" 
                    style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '8px', marginBottom: '16px' }}
                  />
                )}
                <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3, fontStyle: 'italic' }}>
                  {articleForm.summary || '요약을 입력하세요'}
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    lineHeight: 1.8,
                    whiteSpace: 'pre-wrap',
                    '& p': { mb: 2 }
                  }}
                >
                  {articleForm.content || '내용을 입력하세요'}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider', justifyContent: 'space-between' }}>
          <Box>
            <Button onClick={() => setArticleDialog(false)} startIcon={<Cancel />}>
              취소
            </Button>
            <Button sx={{ ml: 1 }} startIcon={<Save />}>
              임시저장
            </Button>
          </Box>
          <Box>
            {editTab !== 'preview' && (
              <Button onClick={() => setEditTab('preview')} sx={{ mr: 1 }}>
                미리보기
              </Button>
            )}
            <Button 
              onClick={handleArticleSubmit} 
              variant="contained" 
              startIcon={articleForm.id ? <Update /> : <Save />}
              size="large"
            >
              {articleForm.id ? '수정 완료' : '기사 발행'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* 카테고리 추가/편집 다이얼로그 */}
      <Dialog open={categoryDialog} onClose={() => setCategoryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {categoryForm.id ? '카테고리 편집' : '새 카테고리 추가'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="카테고리 이름"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="설명"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialog(false)}>취소</Button>
          <Button onClick={handleCategorySubmit} variant="contained">
            {categoryForm.id ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 사용자 편집 다이얼로그 */}
      <Dialog 
        open={editDialog.open && editDialog.type === 'user'} 
        onClose={() => setEditDialog({ open: false, type: '', data: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{userForm.id ? '사용자 편집' : '새 사용자 추가'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="이름"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="이메일"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>역할</InputLabel>
                <Select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                >
                  <MenuItem value="User">사용자</MenuItem>
                  <MenuItem value="Premium">프리미엄</MenuItem>
                  <MenuItem value="Admin">관리자</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>상태</InputLabel>
                <Select
                  value={userForm.status}
                  onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                >
                  <MenuItem value="Active">활성</MenuItem>
                  <MenuItem value="Inactive">비활성</MenuItem>
                  <MenuItem value="Banned">차단</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, type: '', data: null })}>취소</Button>
          <Button onClick={handleUserSubmit} variant="contained">
            {userForm.id ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null, type: '' })}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <Warning sx={{ mr: 1, color: 'warning.main' }} />
          삭제 확인
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            정말로 이 {
              deleteConfirm.type === 'article' ? '기사' : 
              deleteConfirm.type === 'category' ? '카테고리' : '사용자'
            }를 삭제하시겠습니까?
          </Alert>
          {deleteConfirm.type === 'category' && (
            <Typography variant="body2" color="text.secondary">
              카테고리를 삭제하면 해당 카테고리의 모든 기사가 "미분류"로 이동됩니다.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ open: false, id: null, type: '' })}>
            취소
          </Button>
          <Button 
            onClick={() => {
              if (deleteConfirm.type === 'article') {
                handleDeleteArticle(deleteConfirm.id);
              } else if (deleteConfirm.type === 'category') {
                handleDeleteCategory(deleteConfirm.id);
              } else {
                handleDeleteUser(deleteConfirm.id);
              }
            }}
            color="error" 
            variant="contained"
            startIcon={<Delete />}
          >
            삭제
          </Button>
        </DialogActions>
      </Dialog>

      {/* 성공/오류 메시지 스낵바 */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardContainer>
  );
};

// 향상된 스타일드 컴포넌트들
const DashboardContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
`;

const Content = styled.div`
  display: flex;
  min-height: calc(100vh - 64px);
`;

const Sidebar = styled.div`
  width: 280px;
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
  border-right: 1px solid #e0e0e0;
  padding: 1.5rem 0;
  box-shadow: 4px 0 20px rgba(0,0,0,0.08);
`;

const SidebarItem = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem 2rem;
  cursor: pointer;
  background: ${props => props.$active ? 'linear-gradient(90deg, #e3f2fd 0%, #bbdefb 100%)' : 'transparent'};
  color: ${props => props.$active ? '#1976d2' : '#666'};
  font-weight: ${props => props.$active ? '600' : 'normal'};
  border-left: ${props => props.$active ? '4px solid #1976d2' : '4px solid transparent'};
  transition: all 0.3s ease;
  margin: 0.2rem 0;
  
  &:hover {
    background: linear-gradient(90deg, #f5f5f5 0%, #eeeeee 100%);
    transform: translateX(4px);
  }
`;

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  background: transparent;
`;

const EnhancedStatCard = styled(Card)`
  padding: 2rem;
  border-radius: 16px !important;
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  border: 1px solid rgba(255,255,255,0.2);
  box-shadow: 0 8px 32px rgba(0,0,0,0.1) !important;
  transition: all 0.3s ease !important;
  display: flex;
  align-items: center;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0,0,0,0.15) !important;
  }
`;

const StatIcon = styled.div`
  font-size: 3rem;
  margin-right: 1.5rem;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatNumber = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: #1976d2;
  line-height: 1;
`;

const StatLabel = styled.div`
  font-size: 1rem;
  color: #666;
  margin: 0.5rem 0;
  font-weight: 500;
`;

const StatDetail = styled.div`
  font-size: 0.8rem;
  color: #999;
`;

const CategoryStatCard = styled(Card)`
  padding: 1.5rem;
  border-radius: 12px !important;
  background: ${props => {
    if (props.rank === 1) return 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)';
    if (props.rank === 2) return 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)';
    if (props.rank === 3) return 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)';
    return 'linear-gradient(135deg, #fff 0%, #f5f5f5 100%)';
  }};
  border: 1px solid ${props => {
    if (props.rank === 1) return '#ff9800';
    if (props.rank === 2) return '#9c27b0';
    if (props.rank === 3) return '#4caf50';
    return '#e0e0e0';
  }};
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  }
`;

const ImprovedArticleCard = styled(Card)`
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 16px !important;
  overflow: hidden;
  transition: all 0.3s ease !important;
  border: 1px solid #e0e0e0;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0,0,0,0.15) !important;
    border-color: #1976d2;
  }
`;

const CategoryCard = styled(Card)`
  border-radius: 12px !important;
  transition: all 0.3s ease;
  border: 1px solid #e0e0e0;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    border-color: #1976d2;
  }
`;

const InfoCard = styled(Card)`
  padding: 1.5rem;
  text-align: center;
  border-radius: 12px !important;
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  text-align: center;
`;

export default ImprovedDashboard;