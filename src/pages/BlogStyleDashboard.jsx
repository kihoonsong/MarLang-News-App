import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  AppBar, Toolbar, Typography, Button, Card, CardContent, Grid, TextField, 
  Select, MenuItem, FormControl, InputLabel, Box, Tabs, Tab, Container,
  IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions, 
  Snackbar, Alert, Avatar, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Switch, FormControlLabel, Divider, Badge,
  List, ListItem, ListItemText, ListItemIcon, Accordion, AccordionSummary,
  AccordionDetails, Tooltip, Fab, RadioGroup, Radio, FormLabel
} from '@mui/material';
import {
  Dashboard as DashboardIcon, Article, Add, Edit, Delete, Save, Cancel,
  Preview, Publish, Visibility, ThumbUp, TrendingUp, People, Settings,
  Refresh, Star, CheckCircle, Warning, Schedule, CloudUpload, Image,
  ExpandMore, Category, DragIndicator, ArrowUpward, ArrowDownward
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useArticles } from '../contexts/ArticlesContext';
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
    publishType: 'immediate', // 'immediate' | 'scheduled'
    publishedAt: new Date().toISOString().slice(0, 16),
    status: 'published' // 'draft' | 'published' | 'scheduled'
  });

  // 카테고리 관리 상태
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [editableCategories, setEditableCategories] = useState(() => {
    // 로컬스토리지에서 카테고리 로드
    const saved = localStorage.getItem('marlang_categories');
    if (saved) {
      try {
        const categories = JSON.parse(saved);
        return categories.filter(cat => cat.type === 'category').map(cat => cat.name);
      } catch {
        // 파싱 실패 시 기본 카테고리 사용
        return homeCategories.filter(cat => cat.type === 'category').map(cat => cat.name);
      }
    }
    // 로컬스토리지가 없으면 기본 카테고리 사용
    return homeCategories.filter(cat => cat.type === 'category').map(cat => cat.name);
  });
  const [newCategoryName, setNewCategoryName] = useState('');

  // 카테고리 변경사항을 로컬스토리지에 저장하고 홈페이지에 알림
  const updateCategoriesAndNotify = (newCategories) => {
    setEditableCategories(newCategories);
    
    // 전체 카테고리 구조 생성 (Recent, Popular는 고정)
    const fullCategories = [
      { id: 'recent', name: 'Recent', type: 'recent' },
      ...newCategories.map((name, index) => ({
        id: name.toLowerCase().replace(/\s+/g, ''),
        name: name,
        type: 'category'
      })),
      { id: 'popular', name: 'Popular', type: 'popular' }
    ];
    
    // 로컬스토리지에 저장
    localStorage.setItem('marlang_categories', JSON.stringify(fullCategories));
    
    // 홈페이지에 알림 이벤트 발송
    window.dispatchEvent(new CustomEvent('categoriesUpdated'));
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
          const categoryNames = categories.filter(cat => cat.type === 'category').map(cat => cat.name);
          setEditableCategories(categoryNames);
        } catch (e) {
          console.error('Failed to parse categories:', e);
        }
      }
    };

    // 커스텀 이벤트 리스너 등록
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
      // 파일 크기 체크 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({ open: true, message: '이미지 파일은 5MB 이하로 업로드해주세요.', severity: 'error' });
        return;
      }

      // 이미지 파일 타입 체크
      if (!file.type.startsWith('image/')) {
        setSnackbar({ open: true, message: '이미지 파일만 업로드 가능합니다.', severity: 'error' });
        return;
      }

      // FileReader로 이미지 미리보기 생성
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

  // 통계 계산
  const getStats = () => {
    const totalViews = allArticles.reduce((sum, article) => sum + (article.views || 0), 0);
    const totalLikes = allArticles.reduce((sum, article) => sum + (article.likes || 0), 0);
    const todayArticles = allArticles.filter(article => {
      const today = new Date().toDateString();
      const articleDate = new Date(article.publishedAt).toDateString();
      return today === articleDate;
    }).length;

    return {
      totalArticles: allArticles.length,
      totalViews,
      totalLikes,
      todayArticles,
      categories: editableCategories.length
    };
  };

  const stats = getStats();

  // 카테고리별 기사 수 계산
  const getCategoryStats = () => {
    // 현재 로컬스토리지의 카테고리 구조 사용
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
        totalLikes: articles.reduce((sum, a) => sum + (a.likes || 0), 0)
      };
    });
  };

  // 기사 폼 초기화
  const resetArticleForm = () => {
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
      publishedAt: new Date().toISOString().slice(0, 16),
      status: 'published'
    });
    setEditingArticle(null);
    setActiveContentTab(0);
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

    // 발행 날짜 처리
    const publishDate = articleForm.publishType === 'immediate' 
      ? new Date() 
      : new Date(articleForm.publishedAt);
    
    // 상태 결정
    let status = articleForm.status;
    if (articleForm.publishType === 'scheduled' && publishDate > new Date()) {
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
      likes: 0, // 좋아요 자동 생성 제거
      views: 0  // 조회수 자동 생성 제거
    };

    const updatedArticles = [newArticle, ...allArticles];
    updateArticles(updatedArticles);
    
    // 홈페이지에 실시간 알림 (실제 연동)
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

        // 발행 날짜 처리
    const publishDate = articleForm.publishType === 'immediate' 
      ? new Date() 
      : new Date(articleForm.publishedAt);
    
    // 상태 결정
    let status = articleForm.status;
    if (articleForm.publishType === 'scheduled' && publishDate > new Date()) {
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

    if (editableCategories.includes(newCategoryName)) {
      setSnackbar({ open: true, message: '이미 존재하는 카테고리입니다.', severity: 'warning' });
      return;
    }

    const newCategories = [...editableCategories, newCategoryName];
    updateCategoriesAndNotify(newCategories);
    setSnackbar({ open: true, message: `"${newCategoryName}" 카테고리가 추가되었습니다! 홈페이지에 반영됩니다.`, severity: 'success' });
    setNewCategoryName('');
  };

  // 카테고리 삭제
  const handleDeleteCategory = (categoryName) => {
    // 해당 카테고리의 기사들을 "Technology"로 변경
    const updatedArticles = allArticles.map(article =>
      article.category === categoryName ? { ...article, category: 'Technology' } : article
    );
    updateArticles(updatedArticles);
    
    const newCategories = editableCategories.filter(cat => cat !== categoryName);
    updateCategoriesAndNotify(newCategories);
    setSnackbar({ 
      open: true, 
      message: `"${categoryName}" 카테고리가 삭제되고 기사들이 Technology로 이동되었습니다. 홈페이지에 반영됩니다.`, 
      severity: 'info' 
    });
  };

  // 카테고리 순서 변경
  const moveCategoryUp = (index) => {
    if (index > 0) {
      const newOrder = [...editableCategories];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      updateCategoriesAndNotify(newOrder);
      setSnackbar({ open: true, message: '카테고리 순서가 변경되었습니다! 홈페이지에 반영됩니다.', severity: 'success' });
    }
  };

  const moveCategoryDown = (index) => {
    if (index < editableCategories.length - 1) {
      const newOrder = [...editableCategories];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      updateCategoriesAndNotify(newOrder);
      setSnackbar({ open: true, message: '카테고리 순서가 변경되었습니다! 홈페이지에 반영됩니다.', severity: 'success' });
    }
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
          </Box>
          <Avatar src={user?.picture} sx={{ width: 60, height: 60 }} />
        </Box>
      </WelcomeCard>

      {/* 통계 카드 */}
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
        <Grid item xs={12} sm={6} md={3}>
          <StatCard>
            <StatIcon>📈</StatIcon>
            <StatInfo>
              <StatNumber>{stats.todayArticles}</StatNumber>
              <StatLabel>오늘 발행</StatLabel>
            </StatInfo>
          </StatCard>
        </Grid>
      </Grid>

      {/* 빠른 액션 */}
      <Card sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          ⚡ 빠른 작업
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <ActionButton onClick={() => {
              resetArticleForm();
              setArticleDialog(true);
            }}>
              <Add sx={{ fontSize: 30, mb: 1 }} />
              <Typography variant="body2" fontWeight="bold">새 기사 작성</Typography>
            </ActionButton>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <ActionButton onClick={() => setActiveTab(1)}>
              <Article sx={{ fontSize: 30, mb: 1 }} />
              <Typography variant="body2" fontWeight="bold">기사 관리</Typography>
            </ActionButton>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <ActionButton onClick={() => setActiveTab(2)}>
              <Category sx={{ fontSize: 30, mb: 1 }} />
              <Typography variant="body2" fontWeight="bold">카테고리 관리</Typography>
            </ActionButton>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <ActionButton onClick={() => navigate('/')}>
              <Preview sx={{ fontSize: 30, mb: 1 }} />
              <Typography variant="body2" fontWeight="bold">홈페이지 보기</Typography>
            </ActionButton>
          </Grid>
        </Grid>
      </Card>

      {/* 카테고리별 현황 */}
      <Card sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
          📊 카테고리별 현황 (홈페이지와 동일)
        </Typography>
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
                  <Typography variant="body2" color="text.secondary">
                    👀 {category.totalViews.toLocaleString()} 조회 • ❤️ {category.totalLikes} 좋아요
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
              <TableCell>발행일</TableCell>
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
                    label={article.status === 'published' ? '발행됨' : article.status === 'draft' ? '초안' : '예약됨'} 
                    color={article.status === 'published' ? 'success' : article.status === 'draft' ? 'default' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(article.publishedAt).toLocaleDateString()}
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
          🏷️ 카테고리 관리
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
        💡 카테고리 순서는 홈페이지 네비게이션에 바로 반영됩니다. 화살표 버튼으로 순서를 조정하세요.
      </Alert>

      <Grid container spacing={2}>
        {editableCategories.map((category, index) => {
          const articleCount = allArticles.filter(a => a.category === category).length;
          return (
            <Grid item xs={12} sm={6} md={4} key={category}>
              <CategoryManagementCard>
                <Box sx={{ p: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Box display="flex" alignItems="center">
                      <DragIndicator sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="h6" fontWeight="bold">{category}</Typography>
                    </Box>
                    <Chip label={`#${index + 1}`} size="small" color="primary" />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    📚 {articleCount}개 기사
                  </Typography>
                  
                  <Box display="flex" justifyContent="space-between">
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
                          disabled={index === editableCategories.length - 1}
                        >
                          <ArrowDownward />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteCategory(category)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>
              </CategoryManagementCard>
            </Grid>
          );
        })}
      </Grid>
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
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
              <Tab label="📊 대시보드" />
              <Tab label="📝 기사 관리" />
              <Tab label="🏷️ 카테고리 관리" />
            </Tabs>
          </Box>

          {/* 탭 내용 */}
          {activeTab === 0 && renderDashboard()}
          {activeTab === 1 && renderArticleManagement()}
          {activeTab === 2 && renderCategoryManagement()}
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

                    {/* 예약 발행 시 날짜/시간 선택 */}
                    {articleForm.publishType === 'scheduled' && (
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="발행 날짜 및 시간"
                          type="datetime-local"
                          value={articleForm.publishedAt}
                          onChange={(e) => setArticleForm({ ...articleForm, publishedAt: e.target.value })}
                          InputLabelProps={{ shrink: true }}
                          helperText="미래 날짜와 시간을 선택하세요"
                        />
                      </Grid>
                    )}

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