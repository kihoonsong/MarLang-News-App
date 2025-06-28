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
  Tabs, Tab, Container, Stack, CardActions, CardMedia
} from '@mui/material';
import {
  Dashboard as DashboardIcon, Article, Category, People, BarChart,
  Add, Edit, Delete, Upload, Schedule, Analytics, TrendingUp,
  Visibility, ThumbUp, GetApp, Refresh, NotificationsActive,
  Settings, Timeline, PieChart, CalendarToday, Search, FilterList,
  ExitToApp, CloudUpload, Save, Cancel, Person, AdminPanelSettings,
  Star, Block, VerifiedUser, Email, Phone, LocationOn
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useArticles } from '../contexts/ArticlesContext';

const FullDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  const { allArticles, setAllArticles } = useArticles();
  const [activeTab, setActiveTab] = useState('overview');
  const [articleDialog, setArticleDialog] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, type: '', data: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // 실시간 통계
  const [realTimeStats, setRealTimeStats] = useState({
    totalArticles: allArticles?.length || 0,
    totalUsers: 1567,
    totalViews: 45678,
    activeUsers: 89,
    todaySignups: 12,
    currentOnline: 23,
    monthlyGrowth: 15.3,
    lastUpdate: new Date().toLocaleTimeString()
  });

  // 실시간 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeStats(prev => ({
        ...prev,
        totalArticles: allArticles?.length || 0,
        activeUsers: Math.max(1, prev.activeUsers + Math.floor(Math.random() * 6) - 3),
        currentOnline: Math.max(1, prev.currentOnline + Math.floor(Math.random() * 8) - 4),
        totalViews: prev.totalViews + Math.floor(Math.random() * 10),
        lastUpdate: new Date().toLocaleTimeString()
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, [allArticles]);

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
    author: 'Admin',
    source: 'MarLang',
    readingTime: 5,
    likes: 0,
    views: 0,
    featured: false
  });

  // 카테고리 관리
  const [categories, setCategories] = useState([
    'Technology', 'Science', 'Business', 'Health', 'Culture', 'Sports', 'Education'
  ]);

  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

  // 사용자 관리
  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'Alice Kim',
      email: 'alice@example.com',
      role: 'User',
      status: 'Active',
      joinDate: '2025-01-15',
      lastActive: '2 hours ago',
      articlesRead: 45,
      wordsLearned: 1234,
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5e5?w=150'
    },
    {
      id: 2,
      name: 'Bob Lee',
      email: 'bob@example.com',
      role: 'Premium',
      status: 'Active',
      joinDate: '2025-02-20',
      lastActive: '1 day ago',
      articlesRead: 78,
      wordsLearned: 2156,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    },
    {
      id: 3,
      name: 'Carol Park',
      email: 'carol@example.com',
      role: 'Admin',
      status: 'Active',
      joinDate: '2024-12-10',
      lastActive: '5 min ago',
      articlesRead: 156,
      wordsLearned: 3892,
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'
    }
  ]);

  const [userForm, setUserForm] = useState({
    id: null,
    name: '',
    email: '',
    role: 'User',
    status: 'Active'
  });

  // 기사 관리 함수들
  const handleArticleSubmit = (e) => {
    e.preventDefault();
    
    if (articleForm.id) {
      // 수정
      const updatedArticles = allArticles.map(article => 
        article.id === articleForm.id ? { ...articleForm } : article
      );
      setAllArticles(updatedArticles);
    } else {
      // 새 기사 추가
      const newArticle = {
        ...articleForm,
        id: Math.max(...(allArticles?.map(a => a.id) || [0])) + 1,
        publishedAt: new Date(articleForm.publishedAt).toISOString()
      };
      setAllArticles([...(allArticles || []), newArticle]);
    }
    
    resetArticleForm();
    setArticleDialog(false);
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
      publishedAt: new Date().toISOString().split('T')[0],
      author: 'Admin',
      source: 'MarLang',
      readingTime: 5,
      likes: 0,
      views: 0,
      featured: false
    });
  };

  const handleEditArticle = (article) => {
    setArticleForm({
      ...article,
      publishedAt: new Date(article.publishedAt).toISOString().split('T')[0]
    });
    setArticleDialog(true);
  };

  const handleDeleteArticle = (id) => {
    const updatedArticles = allArticles.filter(article => article.id !== id);
    setAllArticles(updatedArticles);
    setDeleteConfirm({ open: false, id: null, type: '' });
  };

  // 카테고리 관리 함수들
  const handleAddCategory = () => {
    if (categoryForm.name && !categories.includes(categoryForm.name)) {
      setCategories([...categories, categoryForm.name]);
      setCategoryForm({ name: '', description: '' });
    }
  };

  const handleDeleteCategory = (categoryName) => {
    setCategories(categories.filter(cat => cat !== categoryName));
  };

  // 사용자 관리 함수들
  const handleUserSubmit = (e) => {
    e.preventDefault();
    
    if (userForm.id) {
      // 수정
      const updatedUsers = users.map(user => 
        user.id === userForm.id ? { ...user, ...userForm } : user
      );
      setUsers(updatedUsers);
    } else {
      // 새 사용자 추가
      const newUser = {
        ...userForm,
        id: Math.max(...users.map(u => u.id)) + 1,
        joinDate: new Date().toISOString().split('T')[0],
        lastActive: 'Just now',
        articlesRead: 0,
        wordsLearned: 0,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
      };
      setUsers([...users, newUser]);
    }
    
    resetUserForm();
    setEditDialog({ open: false, type: '', data: null });
  };

  const resetUserForm = () => {
    setUserForm({
      id: null,
      name: '',
      email: '',
      role: 'User',
      status: 'Active'
    });
  };

  const handleEditUser = (user) => {
    setUserForm({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    });
    setEditDialog({ open: true, type: 'user', data: user });
  };

  const handleDeleteUser = (id) => {
    setUsers(users.filter(user => user.id !== id));
    setDeleteConfirm({ open: false, id: null, type: '' });
  };

  // 필터링된 기사들
  const filteredArticles = (allArticles || []).filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || article.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // 개요 탭 렌더링
  const renderOverview = () => (
    <Box>
      {/* 통계 카드 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard>
            <Typography variant="h3" color="primary">
              {realTimeStats.totalArticles}
            </Typography>
            <Typography variant="h6">총 기사</Typography>
            <LinearProgress variant="determinate" value={75} sx={{ mt: 1 }} />
          </StatCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard>
            <Typography variant="h3" color="primary">
              {realTimeStats.totalUsers.toLocaleString()}
            </Typography>
            <Typography variant="h6">총 사용자</Typography>
            <LinearProgress variant="determinate" value={60} sx={{ mt: 1 }} />
          </StatCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard>
            <Typography variant="h3" color="primary">
              {realTimeStats.totalViews.toLocaleString()}
            </Typography>
            <Typography variant="h6">총 조회수</Typography>
            <LinearProgress variant="determinate" value={85} sx={{ mt: 1 }} />
          </StatCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard>
            <Typography variant="h3" color="success.main">
              {realTimeStats.currentOnline}
            </Typography>
            <Typography variant="h6">현재 접속</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <TrendingUp color="success" sx={{ mr: 0.5 }} />
              <Typography variant="body2" color="success.main">
                실시간 업데이트
              </Typography>
            </Box>
          </StatCard>
        </Grid>
      </Grid>

      {/* 최근 활동 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            실시간 활동 모니터링
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            마지막 업데이트: {realTimeStats.lastUpdate}
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="h4">📚</Typography>
                <Typography variant="body2">새 기사 {Math.floor(Math.random() * 5) + 1}개</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="h4">👥</Typography>
                <Typography variant="body2">신규 가입 {realTimeStats.todaySignups}명</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="h4">❤️</Typography>
                <Typography variant="body2">오늘 좋아요 {Math.floor(Math.random() * 50) + 10}개</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="h4">🎯</Typography>
                <Typography variant="body2">완료율 {Math.floor(Math.random() * 20) + 75}%</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );

  // 기사 관리 탭 렌더링
  const renderArticleManagement = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">기사 관리</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setArticleDialog(true)}>
          새 기사 추가
        </Button>
      </Box>

      {/* 검색 및 필터 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="기사 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
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
            <Grid item xs={12} md={3}>
              <Button variant="outlined" startIcon={<Refresh />} fullWidth>
                새로고침
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 기사 목록 */}
      <Grid container spacing={3}>
        {filteredArticles.map((article) => (
          <Grid item xs={12} sm={6} md={4} key={article.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="140"
                image={article.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400'}
                alt={article.title}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h6" component="div">
                  {article.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {article.summary || '요약이 없습니다.'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Chip label={article.category} size="small" />
                  <Chip label={article.level} size="small" color="primary" />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {new Date(article.publishedAt).toLocaleDateString()} • {article.author}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" startIcon={<Edit />} onClick={() => handleEditArticle(article)}>
                  편집
                </Button>
                <Button 
                  size="small" 
                  startIcon={<Delete />} 
                  color="error"
                  onClick={() => setDeleteConfirm({ open: true, id: article.id, type: 'article' })}
                >
                  삭제
                </Button>
                <Button size="small" startIcon={<Visibility />}>
                  {article.views || 0}
                </Button>
                <Button size="small" startIcon={<ThumbUp />}>
                  {article.likes || 0}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  // 카테고리 관리 탭 렌더링
  const renderCategoryManagement = () => (
    <Box>
      <Typography variant="h5" gutterBottom>카테고리 관리</Typography>
      
      {/* 새 카테고리 추가 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>새 카테고리 추가</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="카테고리 이름"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="설명"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button variant="contained" onClick={handleAddCategory} fullWidth>
                추가
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 카테고리 목록 */}
      <Grid container spacing={2}>
        {categories.map((category) => (
          <Grid item xs={12} sm={6} md={4} key={category}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">{category}</Typography>
                  <Box>
                    <IconButton size="small">
                      <Edit />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteCategory(category)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {(allArticles || []).filter(a => a.category === category).length}개 기사
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  // 사용자 관리 탭 렌더링
  const renderUserManagement = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">사용자 관리</Typography>
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
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="primary">{users.length}</Typography>
            <Typography variant="body1">총 사용자</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="success.main">
              {users.filter(u => u.status === 'Active').length}
            </Typography>
            <Typography variant="body1">활성 사용자</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="warning.main">
              {users.filter(u => u.role === 'Premium').length}
            </Typography>
            <Typography variant="body1">프리미엄</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="error.main">
              {users.filter(u => u.role === 'Admin').length}
            </Typography>
            <Typography variant="body1">관리자</Typography>
          </Card>
        </Grid>
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
                <TableCell>학습 통계</TableCell>
                <TableCell>액션</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar src={user.avatar} sx={{ mr: 2 }} />
                      <Box>
                        <Typography variant="subtitle2">{user.name}</Typography>
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
                      📚 {user.articlesRead} • 📝 {user.wordsLearned}
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
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            MarLang 관리자 대시보드
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Badge badgeContent={realTimeStats.currentOnline} color="success">
              <Typography variant="caption">접속: {realTimeStats.lastUpdate}</Typography>
            </Badge>
            
            <Avatar src={user?.picture} sx={{ width: 32, height: 32 }} />
            
            <IconButton color="inherit" onClick={() => signOut()}>
              <ExitToApp />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Content>
        <Sidebar>
          <SidebarItem 
            $active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
          >
            <DashboardIcon sx={{ mr: 1 }} />
            대시보드
          </SidebarItem>
          <SidebarItem 
            $active={activeTab === 'articles'}
            onClick={() => setActiveTab('articles')}
          >
            <Article sx={{ mr: 1 }} />
            기사 관리
            <Badge badgeContent={filteredArticles.length} color="primary" sx={{ ml: 'auto' }} />
          </SidebarItem>
          <SidebarItem 
            $active={activeTab === 'categories'}
            onClick={() => setActiveTab('categories')}
          >
            <Category sx={{ mr: 1 }} />
            카테고리
            <Badge badgeContent={categories.length} color="secondary" sx={{ ml: 'auto' }} />
          </SidebarItem>
          <SidebarItem 
            $active={activeTab === 'users'}
            onClick={() => setActiveTab('users')}
          >
            <People sx={{ mr: 1 }} />
            사용자 관리
            <Badge badgeContent={users.length} color="success" sx={{ ml: 'auto' }} />
          </SidebarItem>
          <SidebarItem 
            $active={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
          >
            <Analytics sx={{ mr: 1 }} />
            통계 분석
          </SidebarItem>
        </Sidebar>

        <MainContent>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'articles' && renderArticleManagement()}
          {activeTab === 'categories' && renderCategoryManagement()}
          {activeTab === 'users' && renderUserManagement()}
          {activeTab === 'analytics' && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Analytics sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h4" color="text.secondary">
                통계 분석 도구
              </Typography>
              <Typography variant="body1" color="text.secondary">
                상세한 분석 차트가 곧 추가됩니다
              </Typography>
            </Box>
          )}
        </MainContent>
      </Content>

      {/* 기사 추가/편집 다이얼로그 */}
      <Dialog open={articleDialog} onClose={() => setArticleDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{articleForm.id ? '기사 편집' : '새 기사 추가'}</DialogTitle>
        <DialogContent>
          <form onSubmit={handleArticleSubmit}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="제목"
                  value={articleForm.title}
                  onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>카테고리</InputLabel>
                  <Select
                    value={articleForm.category}
                    onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })}
                  >
                    {categories.map(category => (
                      <MenuItem key={category} value={category}>{category}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>난이도</InputLabel>
                  <Select
                    value={articleForm.level}
                    onChange={(e) => setArticleForm({ ...articleForm, level: e.target.value })}
                  >
                    <MenuItem value="Beginner">초급</MenuItem>
                    <MenuItem value="Intermediate">중급</MenuItem>
                    <MenuItem value="Advanced">고급</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="요약"
                  value={articleForm.summary}
                  onChange={(e) => setArticleForm({ ...articleForm, summary: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="내용"
                  value={articleForm.content}
                  onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                  multiline
                  rows={6}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="이미지 URL"
                  value={articleForm.image}
                  onChange={(e) => setArticleForm({ ...articleForm, image: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="발행일"
                  InputLabelProps={{ shrink: true }}
                  value={articleForm.publishedAt}
                  onChange={(e) => setArticleForm({ ...articleForm, publishedAt: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="작성자"
                  value={articleForm.author}
                  onChange={(e) => setArticleForm({ ...articleForm, author: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={articleForm.featured}
                      onChange={(e) => setArticleForm({ ...articleForm, featured: e.target.checked })}
                    />
                  }
                  label="추천 기사"
                />
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArticleDialog(false)}>취소</Button>
          <Button onClick={handleArticleSubmit} variant="contained">
            {articleForm.id ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 사용자 편집 다이얼로그 */}
      <Dialog 
        open={editDialog.open && editDialog.type === 'user'} 
        onClose={() => setEditDialog({ open: false, type: '', data: null })}
      >
        <DialogTitle>{userForm.id ? '사용자 편집' : '새 사용자 추가'}</DialogTitle>
        <DialogContent>
          <form onSubmit={handleUserSubmit}>
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
          </form>
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
        <DialogTitle>삭제 확인</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            정말로 이 {deleteConfirm.type === 'article' ? '기사' : '사용자'}를 삭제하시겠습니까?
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ open: false, id: null, type: '' })}>취소</Button>
          <Button 
            onClick={() => {
              if (deleteConfirm.type === 'article') {
                handleDeleteArticle(deleteConfirm.id);
              } else {
                handleDeleteUser(deleteConfirm.id);
              }
            }}
            color="error" 
            variant="contained"
          >
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContainer>
  );
};

// 스타일드 컴포넌트들
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
  background: white;
  border-right: 1px solid #e0e0e0;
  padding: 1rem 0;
  box-shadow: 2px 0 10px rgba(0,0,0,0.1);
`;

const SidebarItem = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  cursor: pointer;
  background: ${props => props.$active ? '#e3f2fd' : 'transparent'};
  color: ${props => props.$active ? '#1976d2' : '#666'};
  font-weight: ${props => props.$active ? '600' : 'normal'};
  border-left: ${props => props.$active ? '4px solid #1976d2' : '4px solid transparent'};
  
  &:hover {
    background: #f5f5f5;
  }
`;

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
`;

const StatCard = styled(Card)`
  padding: 1.5rem;
  text-align: center;
  border-radius: 12px !important;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important;
  transition: transform 0.2s ease !important;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

export default FullDashboard;