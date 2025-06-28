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
  Rating, Slider, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import {
  Dashboard as DashboardIcon, Article, Category, People, BarChart,
  Add, Edit, Delete, Upload, Schedule, Analytics, TrendingUp,
  Visibility, ThumbUp, GetApp, Refresh, NotificationsActive,
  Settings, Timeline, PieChart, CalendarToday, Search, FilterList,
  ExitToApp, CloudUpload, Image, AccessTime, Star, Flag,
  Assignment, Language, Psychology, Speed, PlayArrow, Pause,
  Stop, SkipNext, Notifications, Email, Phone, LocationOn,
  Work, School, Verified, Block, AdminPanelSettings, Person
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const EnhancedDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [articleDialog, setArticleDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('date');

  // 실시간 통계 데이터 (5초마다 업데이트)
  const [realTimeStats, setRealTimeStats] = useState({
    totalArticles: 234,
    totalUsers: 1567,
    totalViews: 45678,
    activeUsers: 89,
    todaySignups: 12,
    currentOnline: 23,
    monthlyGrowth: 15.3,
    avgReadTime: 4.2,
    completionRate: 82.7,
    lastUpdate: new Date().toLocaleTimeString()
  });

  // 5초마다 실시간 데이터 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeStats(prev => ({
        ...prev,
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 6) - 3,
        currentOnline: Math.max(1, prev.currentOnline + Math.floor(Math.random() * 8) - 4),
        totalViews: prev.totalViews + Math.floor(Math.random() * 10),
        todaySignups: prev.todaySignups + (Math.random() > 0.85 ? 1 : 0),
        lastUpdate: new Date().toLocaleTimeString()
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // 새 기사 폼 데이터
  const [newArticle, setNewArticle] = useState({
    title: '',
    content: '',
    category: '',
    level: 1,
    metaDescription: '',
    tags: [],
    thumbnail: null,
    featured: false,
    publishDate: '',
    publishTime: '',
    author: user?.name || 'Admin',
    status: 'Draft'
  });

  // 실시간 활동 데이터
  const [recentActivities, setRecentActivities] = useState([
    { id: 1, user: 'Alice Kim', action: 'completed', article: 'AI Healthcare Revolution', time: '2 min ago', type: 'completion', avatar: '👩' },
    { id: 2, user: 'Bob Lee', action: 'saved word', word: 'algorithm', time: '3 min ago', type: 'word', avatar: '👨' },
    { id: 3, user: 'Carol Park', action: 'liked', article: 'Climate Solutions', time: '5 min ago', type: 'like', avatar: '👩' },
    { id: 4, user: 'David Jung', action: 'viewed', article: 'Remote Work Future', time: '7 min ago', type: 'view', avatar: '👨' },
    { id: 5, user: 'Eve Choi', action: 'shared', article: 'Quantum Computing', time: '10 min ago', type: 'share', avatar: '👩' }
  ]);

  // 인기 기사 순위 (상위 5개)
  const topArticles = [
    { rank: 1, title: 'AI Revolution in Healthcare', views: 3847, likes: 234, category: 'Technology', growth: '+12%' },
    { rank: 2, title: 'Climate Change Solutions', views: 2963, likes: 189, category: 'Science', growth: '+8%' },
    { rank: 3, title: 'Future of Remote Work', views: 2456, likes: 156, category: 'Business', growth: '+15%' },
    { rank: 4, title: 'Quantum Computing Basics', views: 2134, likes: 128, category: 'Technology', growth: '+6%' },
    { rank: 5, title: 'Sustainable Energy', views: 1897, likes: 97, category: 'Science', growth: '+3%' }
  ];

  // 카테고리별 성과 분석
  const categoryPerformance = [
    { name: 'Technology', articles: 56, views: 18750, growth: 18.3, percentage: 85 },
    { name: 'Science', articles: 42, views: 14320, growth: 12.7, percentage: 72 },
    { name: 'Business', articles: 38, views: 12890, growth: 15.2, percentage: 78 },
    { name: 'Health', articles: 34, views: 11460, growth: 9.4, percentage: 65 },
    { name: 'Culture', articles: 29, views: 8970, growth: -2.1, percentage: 45 }
  ];

  // 기사 목록 (향상된 데이터)
  const [articles, setArticles] = useState([
    {
      id: 1,
      title: 'AI Revolution in Healthcare: Transforming Patient Care with Machine Learning',
      category: 'Technology',
      level: 3,
      status: 'Published',
      publishDate: '2025-06-25',
      publishTime: '09:00',
      views: 3847,
      likes: 234,
      words: 1250,
      readTime: '5.2 min',
      featured: true,
      author: 'Dr. Sarah Kim',
      thumbnail: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300',
      tags: ['AI', 'Healthcare', 'Machine Learning'],
      metaDescription: 'Explore how artificial intelligence is revolutionizing healthcare...'
    },
    {
      id: 2,
      title: 'Climate Change Impact on Global Food Security',
      category: 'Science',
      level: 2,
      status: 'Scheduled',
      publishDate: '2025-06-28',
      publishTime: '14:30',
      views: 0,
      likes: 0,
      words: 980,
      readTime: '4.1 min',
      featured: false,
      author: 'Prof. Michael Chen',
      thumbnail: 'https://images.unsplash.com/photo-1574263867128-b20b55d1b5f0?w=300',
      tags: ['Climate', 'Food Security', 'Environment'],
      metaDescription: 'Understanding the complex relationship between climate change...'
    },
    {
      id: 3,
      title: 'The Future of Remote Work: Trends and Predictions for 2025',
      category: 'Business',
      level: 1,
      status: 'Draft',
      publishDate: '',
      publishTime: '',
      views: 0,
      likes: 0,
      words: 756,
      readTime: '3.2 min',
      featured: false,
      author: 'Jessica Park',
      thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300',
      tags: ['Remote Work', 'Business Trends', 'Future'],
      metaDescription: 'Discover the latest trends shaping the future of remote work...'
    }
  ]);

  // 사용자 관리 데이터
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
      avatar: '👩'
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
      avatar: '👨'
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
      avatar: '👩'
    }
  ]);

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

  const handleArticleSubmit = (e) => {
    e.preventDefault();
    const newId = Math.max(...articles.map(a => a.id)) + 1;
    const wordCount = newArticle.content.split(' ').length;
    const readTime = (wordCount / 200).toFixed(1);
    
    const articleToAdd = {
      id: newId,
      ...newArticle,
      words: wordCount,
      readTime: `${readTime} min`,
      views: 0,
      likes: 0,
      status: newArticle.publishDate ? 'Scheduled' : 'Draft',
      thumbnail: newArticle.thumbnail || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=300'
    };
    
    setArticles([...articles, articleToAdd]);
    setNewArticle({
      title: '', content: '', category: '', level: 1,
      metaDescription: '', tags: [], thumbnail: null, featured: false,
      publishDate: '', publishTime: '', author: user?.name || 'Admin', status: 'Draft'
    });
    setArticleDialog(false);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm.type === 'article') {
      setArticles(articles.filter(a => a.id !== deleteConfirm.id));
    } else if (deleteConfirm.type === 'user') {
      setUsers(users.filter(u => u.id !== deleteConfirm.id));
    }
    setDeleteConfirm({ open: false, id: null, type: '' });
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'completion': return '✅';
      case 'word': return '📚';
      case 'like': return '❤️';
      case 'view': return '👁️';
      case 'share': return '🔗';
      default: return '📄';
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || article.category === filterCategory;
    const matchesStatus = !filterStatus || article.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // 메인 개요 렌더링
  const renderAdvancedOverview = () => (
    <Box>
      {/* 실시간 통계 카드 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <RealTimeStatCard>
            <StatHeader>
              <StatIcon>📰</StatIcon>
              <Box>
                <StatNumber>{realTimeStats.totalArticles}</StatNumber>
                <StatLabel>Total Articles</StatLabel>
              </Box>
              <LiveIndicator />
            </StatHeader>
            <TrendIndicator positive={true}>
              <TrendingUp fontSize="small" />
              +{realTimeStats.monthlyGrowth}% this month
            </TrendIndicator>
          </RealTimeStatCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <RealTimeStatCard>
            <StatHeader>
              <StatIcon>👥</StatIcon>
              <Box>
                <StatNumber>{realTimeStats.totalUsers.toLocaleString()}</StatNumber>
                <StatLabel>Total Users</StatLabel>
              </Box>
              <LiveIndicator />
            </StatHeader>
            <TrendIndicator positive={true}>
              <People fontSize="small" />
              +{realTimeStats.todaySignups} today
            </TrendIndicator>
          </RealTimeStatCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <RealTimeStatCard>
            <StatHeader>
              <StatIcon>👀</StatIcon>
              <Box>
                <StatNumber>{realTimeStats.totalViews.toLocaleString()}</StatNumber>
                <StatLabel>Total Views</StatLabel>
              </Box>
              <LiveIndicator />
            </StatHeader>
            <TrendIndicator positive={true}>
              <AccessTime fontSize="small" />
              {realTimeStats.avgReadTime} min avg
            </TrendIndicator>
          </RealTimeStatCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <RealTimeStatCard>
            <StatHeader>
              <StatIcon>⚡</StatIcon>
              <Box>
                <StatNumber>{realTimeStats.currentOnline}</StatNumber>
                <StatLabel>Online Now</StatLabel>
              </Box>
              <LiveIndicator />
            </StatHeader>
            <TrendIndicator positive={true}>
              <Notifications fontSize="small" />
              {realTimeStats.completionRate}% completion
            </TrendIndicator>
          </RealTimeStatCard>
        </Grid>
      </Grid>

      {/* 실시간 활동 및 인기 기사 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={7}>
          <EnhancedCard sx={{ height: '500px' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <NotificationsActive color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">실시간 활동 모니터링</Typography>
                <Badge badgeContent={realTimeStats.currentOnline} color="success" sx={{ ml: 'auto' }}>
                  <Typography variant="caption">현재 접속</Typography>
                </Badge>
                <Typography variant="caption" sx={{ ml: 2, color: 'text.secondary' }}>
                  Updated: {realTimeStats.lastUpdate}
                </Typography>
              </Box>
              
              <ActivityList sx={{ maxHeight: 400, overflow: 'auto' }}>
                {recentActivities.map((activity) => (
                  <ActivityItem key={activity.id}>
                    <ActivityAvatar>
                      {activity.avatar} {getActivityIcon(activity.type)}
                    </ActivityAvatar>
                    <ActivityContent>
                      <ActivityText>
                        <strong>{activity.user}</strong> {activity.action}
                        {activity.article && <em> "{activity.article}"</em>}
                        {activity.word && <em> "{activity.word}"</em>}
                      </ActivityText>
                      <ActivityTime>{activity.time}</ActivityTime>
                    </ActivityContent>
                  </ActivityItem>
                ))}
              </ActivityList>
            </CardContent>
          </EnhancedCard>
        </Grid>
        
        <Grid item xs={12} lg={5}>
          <EnhancedCard sx={{ height: '500px' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BarChart color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">인기 기사 순위</Typography>
              </Box>
              
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {topArticles.map((article) => (
                  <RankingItem key={article.rank}>
                    <RankingBadge rank={article.rank}>
                      {getRankIcon(article.rank)}
                    </RankingBadge>
                    <Box sx={{ flex: 1, ml: 2 }}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {article.title}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Visibility fontSize="small" sx={{ mr: 0.5 }} />
                          {article.views.toLocaleString()}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ThumbUp fontSize="small" sx={{ mr: 0.5 }} />
                          {article.likes}
                        </Box>
                        <Chip label={article.category} size="small" variant="outlined" />
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}>
                          <TrendingUp fontSize="small" sx={{ mr: 0.5 }} />
                          {article.growth}
                        </Box>
                      </Box>
                    </Box>
                  </RankingItem>
                ))}
              </List>
            </CardContent>
          </EnhancedCard>
        </Grid>
      </Grid>

      {/* 카테고리별 성과 분석 */}
      <EnhancedCard>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <PieChart color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">카테고리별 성과 분석</Typography>
          </Box>
          
          <Grid container spacing={3}>
            {categoryPerformance.map((category) => (
              <Grid item xs={12} sm={6} md={4} lg={2.4} key={category.name}>
                <CategoryCard>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">
                      {category.name}
                    </Typography>
                    <TrendIndicator positive={category.growth > 0}>
                      {category.growth > 0 ? '↗' : '↘'} {Math.abs(category.growth)}%
                    </TrendIndicator>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {category.articles}개 기사 • {category.views.toLocaleString()} 조회
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">성과</Typography>
                      <Typography variant="body2">{category.percentage}%</Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={category.percentage} 
                      sx={{ height: 8, borderRadius: 4, mt: 0.5 }}
                    />
                  </Box>
                </CategoryCard>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </EnhancedCard>
    </Box>
  );

  // 향상된 기사 관리 렌더링
  const renderEnhancedArticleManagement = () => (
    <Box>
      <SectionHeader>
        <SectionTitle>
          <Article sx={{ mr: 1 }} />
          기사 관리 시스템
        </SectionTitle>
        <Box>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => setArticleDialog(true)}
            sx={{ mr: 1 }}
          >
            새 기사 작성
          </Button>
          <Button variant="outlined" startIcon={<GetApp />}>
            내보내기
          </Button>
        </Box>
      </SectionHeader>

      {/* 검색 및 필터 */}
      <EnhancedCard sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
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
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>카테고리</InputLabel>
                <Select 
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <MenuItem value="">전체</MenuItem>
                  <MenuItem value="Technology">Technology</MenuItem>
                  <MenuItem value="Science">Science</MenuItem>
                  <MenuItem value="Business">Business</MenuItem>
                  <MenuItem value="Health">Health</MenuItem>
                  <MenuItem value="Culture">Culture</MenuItem>
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
                  <MenuItem value="Published">발행됨</MenuItem>
                  <MenuItem value="Draft">임시저장</MenuItem>
                  <MenuItem value="Scheduled">예약됨</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>정렬</InputLabel>
                <Select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="date">날짜순</MenuItem>
                  <MenuItem value="views">조회수순</MenuItem>
                  <MenuItem value="likes">좋아요순</MenuItem>
                  <MenuItem value="title">제목순</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button variant="outlined" startIcon={<Refresh />} fullWidth>
                새로고침
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </EnhancedCard>

      {/* 기사 테이블 */}
      <EnhancedCard>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>기사 정보</TableCell>
                <TableCell>카테고리</TableCell>
                <TableCell>레벨</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>성과 지표</TableCell>
                <TableCell>발행 일정</TableCell>
                <TableCell>액션</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredArticles.map((article) => (
                <TableRow key={article.id} hover>
                  <TableCell>
                    <ArticleInfo>
                      <ArticleThumbnail src={article.thumbnail} alt={article.title} />
                      <Box sx={{ ml: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {article.title}
                          </Typography>
                          {article.featured && (
                            <Chip label="대표" size="small" color="warning" sx={{ ml: 1 }} />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {article.words}단어 • {article.readTime} • {article.author}
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          {article.tags.map(tag => (
                            <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />
                          ))}
                        </Box>
                      </Box>
                    </ArticleInfo>
                  </TableCell>
                  <TableCell>
                    <Chip label={article.category} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={`Level ${article.level}`} 
                      size="small"
                      color={
                        article.level === 1 ? 'success' :
                        article.level === 2 ? 'warning' : 'error'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={article.status} 
                      size="small"
                      color={
                        article.status === 'Published' ? 'success' : 
                        article.status === 'Scheduled' ? 'warning' : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Visibility fontSize="small" />
                        <Typography variant="body2">{article.views.toLocaleString()}</Typography>
                        <ThumbUp fontSize="small" />
                        <Typography variant="body2">{article.likes}</Typography>
                      </Box>
                      {article.status === 'Published' && article.views > 0 && (
                        <LinearProgress 
                          variant="determinate" 
                          value={Math.min(100, (article.likes / article.views) * 100)} 
                          sx={{ height: 4, borderRadius: 2 }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {article.publishDate ? (
                      <Box>
                        <Typography variant="body2">
                          {new Date(article.publishDate).toLocaleDateString()}
                        </Typography>
                        {article.publishTime && (
                          <Typography variant="caption" color="text.secondary">
                            {article.publishTime}
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        미예약
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="편집">
                        <IconButton size="small">
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="삭제">
                        <IconButton 
                          size="small"
                          onClick={() => setDeleteConfirm({ 
                            open: true, 
                            id: article.id, 
                            type: 'article' 
                          })}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="미리보기">
                        <IconButton size="small" onClick={() => navigate(`/article/${article.id}`)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </EnhancedCard>
    </Box>
  );

  // 사용자 관리 렌더링
  const renderUserManagement = () => (
    <Box>
      <SectionHeader>
        <SectionTitle>
          <People sx={{ mr: 1 }} />
          사용자 관리
        </SectionTitle>
        <Box>
          <Button variant="outlined" startIcon={<GetApp />}>
            사용자 내보내기
          </Button>
        </Box>
      </SectionHeader>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <UserStatCard>
            <Typography variant="h4" color="primary">{users.length}</Typography>
            <Typography variant="body2">총 사용자</Typography>
          </UserStatCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <UserStatCard>
            <Typography variant="h4" color="success.main">
              {users.filter(u => u.status === 'Active').length}
            </Typography>
            <Typography variant="body2">활성 사용자</Typography>
          </UserStatCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <UserStatCard>
            <Typography variant="h4" color="warning.main">
              {users.filter(u => u.role === 'Premium').length}
            </Typography>
            <Typography variant="body2">프리미엄 사용자</Typography>
          </UserStatCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <UserStatCard>
            <Typography variant="h4" color="error.main">
              {users.filter(u => u.role === 'Admin').length}
            </Typography>
            <Typography variant="body2">관리자</Typography>
          </UserStatCard>
        </Grid>
      </Grid>

      <EnhancedCard>
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
                      <Avatar sx={{ mr: 2, bgcolor: '#f5f5f5' }}>
                        {user.avatar}
                      </Avatar>
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
                  <TableCell>{user.lastActive}</TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        📚 {user.articlesRead}개 기사
                      </Typography>
                      <Typography variant="body2">
                        📝 {user.wordsLearned}개 단어
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="편집">
                        <IconButton size="small">
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="차단">
                        <IconButton size="small">
                          <Block />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="삭제">
                        <IconButton 
                          size="small"
                          onClick={() => setDeleteConfirm({ 
                            open: true, 
                            id: user.id, 
                            type: 'user' 
                          })}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </EnhancedCard>
    </Box>
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardContainer>
      <AppBar position="static" elevation={0} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Toolbar>
          <DashboardIcon sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            MarLang Eng News - 관리자 대시보드
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Badge badgeContent={realTimeStats.currentOnline} color="success">
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" sx={{ display: 'block' }}>접속자</Typography>
                <Typography variant="caption">{realTimeStats.lastUpdate}</Typography>
              </Box>
            </Badge>
            
            <Avatar src={user?.picture} sx={{ width: 32, height: 32 }} />
            
            <Tooltip title="로그아웃">
              <IconButton color="inherit" onClick={handleLogout}>
                <ExitToApp />
              </IconButton>
            </Tooltip>
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
            대시보드 개요
          </SidebarItem>
          <SidebarItem 
            $active={activeTab === 'articles'}
            onClick={() => setActiveTab('articles')}
          >
            <Article sx={{ mr: 1 }} />
            기사 관리
            <Badge 
              badgeContent={articles.filter(a => a.status === 'Draft').length} 
              color="warning" 
              sx={{ ml: 'auto' }} 
            />
          </SidebarItem>
          <SidebarItem 
            $active={activeTab === 'users'}
            onClick={() => setActiveTab('users')}
          >
            <People sx={{ mr: 1 }} />
            사용자 관리
            <Badge 
              badgeContent={users.filter(u => u.status === 'Active').length} 
              color="success" 
              sx={{ ml: 'auto' }} 
            />
          </SidebarItem>
          <SidebarItem 
            $active={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
          >
            <Analytics sx={{ mr: 1 }} />
            고급 분석
          </SidebarItem>
          <SidebarItem 
            $active={activeTab === 'categories'}
            onClick={() => setActiveTab('categories')}
          >
            <Category sx={{ mr: 1 }} />
            카테고리 관리
          </SidebarItem>
          <SidebarItem 
            $active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
          >
            <Settings sx={{ mr: 1 }} />
            시스템 설정
          </SidebarItem>
        </Sidebar>

        <MainContent>
          {activeTab === 'overview' && renderAdvancedOverview()}
          {activeTab === 'articles' && renderEnhancedArticleManagement()}
          {activeTab === 'users' && renderUserManagement()}
          {activeTab === 'analytics' && (
            <ComingSoonSection>
              <Analytics sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h4" color="text.secondary" gutterBottom>
                고급 분석 도구
              </Typography>
              <Typography variant="body1" color="text.secondary">
                상세한 차트, 리포트, 인사이트가 곧 추가됩니다
              </Typography>
            </ComingSoonSection>
          )}
          {activeTab === 'categories' && (
            <ComingSoonSection>
              <Category sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h4" color="text.secondary" gutterBottom>
                카테고리 관리
              </Typography>
              <Typography variant="body1" color="text.secondary">
                카테고리 생성, 편집, 관리 기능이 곧 추가됩니다
              </Typography>
            </ComingSoonSection>
          )}
          {activeTab === 'settings' && (
            <ComingSoonSection>
              <Settings sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h4" color="text.secondary" gutterBottom>
                시스템 설정
              </Typography>
              <Typography variant="body1" color="text.secondary">
                시스템 환경설정 및 관리 도구가 곧 추가됩니다
              </Typography>
            </ComingSoonSection>
          )}
        </MainContent>
      </Content>

      {/* 기사 작성 다이얼로그 */}
      <Dialog open={articleDialog} onClose={() => setArticleDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>새 기사 작성</DialogTitle>
        <DialogContent>
          <form onSubmit={handleArticleSubmit}>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="기사 제목"
                  value={newArticle.title}
                  onChange={(e) => setNewArticle({...newArticle, title: e.target.value})}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>카테고리</InputLabel>
                  <Select
                    value={newArticle.category}
                    onChange={(e) => setNewArticle({...newArticle, category: e.target.value})}
                  >
                    <MenuItem value="Technology">Technology</MenuItem>
                    <MenuItem value="Science">Science</MenuItem>
                    <MenuItem value="Business">Business</MenuItem>
                    <MenuItem value="Health">Health</MenuItem>
                    <MenuItem value="Culture">Culture</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>난이도 레벨</InputLabel>
                  <Select
                    value={newArticle.level}
                    onChange={(e) => setNewArticle({...newArticle, level: e.target.value})}
                  >
                    <MenuItem value={1}>Level 1 (Beginner)</MenuItem>
                    <MenuItem value={2}>Level 2 (Intermediate)</MenuItem>
                    <MenuItem value={3}>Level 3 (Advanced)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={newArticle.featured}
                      onChange={(e) => setNewArticle({...newArticle, featured: e.target.checked})}
                    />
                  }
                  label="대표 기사로 설정"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="메타 설명"
                  value={newArticle.metaDescription}
                  onChange={(e) => setNewArticle({...newArticle, metaDescription: e.target.value})}
                  helperText="검색 엔진용 설명 (최대 160자)"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={['AI', 'Healthcare', 'Technology', 'Science', 'Business']}
                  value={newArticle.tags}
                  onChange={(e, newValue) => setNewArticle({...newArticle, tags: newValue})}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="태그"
                      helperText="엔터키로 태그 추가"
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={10}
                  label="기사 내용"
                  value={newArticle.content}
                  onChange={(e) => setNewArticle({...newArticle, content: e.target.value})}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="date"
                  label="발행 날짜"
                  InputLabelProps={{ shrink: true }}
                  value={newArticle.publishDate}
                  onChange={(e) => setNewArticle({...newArticle, publishDate: e.target.value})}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="time"
                  label="발행 시간"
                  InputLabelProps={{ shrink: true }}
                  value={newArticle.publishTime}
                  onChange={(e) => setNewArticle({...newArticle, publishTime: e.target.value})}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="thumbnail-upload"
                  type="file"
                  onChange={(e) => setNewArticle({...newArticle, thumbnail: e.target.files[0]})}
                />
                <label htmlFor="thumbnail-upload">
                  <Button 
                    variant="outlined" 
                    component="span" 
                    startIcon={<CloudUpload />}
                    fullWidth
                  >
                    썸네일 업로드
                  </Button>
                </label>
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArticleDialog(false)}>취소</Button>
          <Button onClick={handleArticleSubmit} variant="contained">
            기사 저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null, type: '' })}>
        <DialogTitle>삭제 확인</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            정말로 이 {deleteConfirm.type === 'article' ? '기사' : '사용자'}를 삭제하시겠습니까? 
            이 작업은 되돌릴 수 없습니다.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ open: false, id: null, type: '' })}>
            취소
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            삭제
          </Button>
        </DialogActions>
      </Dialog>

      {/* 플로팅 액션 버튼 */}
      <SpeedDial
        ariaLabel="빠른 액션"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          icon={<Add />}
          tooltipTitle="새 기사"
          onClick={() => setArticleDialog(true)}
        />
        <SpeedDialAction
          icon={<Refresh />}
          tooltipTitle="새로고침"
          onClick={() => window.location.reload()}
        />
        <SpeedDialAction
          icon={<GetApp />}
          tooltipTitle="데이터 내보내기"
        />
      </SpeedDial>
    </DashboardContainer>
  );
};

// 스타일드 컴포넌트
const DashboardContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
`;

const Content = styled.div`
  display: flex;
  min-height: calc(100vh - 64px);
`;

const Sidebar = styled.div`
  width: 300px;
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
  border-right: 1px solid #e0e0e0;
  padding: 1.5rem 0;
  box-shadow: 4px 0 20px rgba(0,0,0,0.1);
`;

const SidebarItem = styled.div`
  display: flex;
  align-items: center;
  padding: 1.2rem 2rem;
  cursor: pointer;
  background: ${props => props.$active ? 'linear-gradient(90deg, #e3f2fd 0%, #bbdefb 100%)' : 'transparent'};
  color: ${props => props.$active ? '#1976d2' : '#666'};
  font-weight: ${props => props.$active ? '600' : 'normal'};
  border-left: ${props => props.$active ? '4px solid #1976d2' : '4px solid transparent'};
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(90deg, #f5f5f5 0%, #eeeeee 100%);
    transform: translateX(2px);
  }
`;

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  background: transparent;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  font-size: 2rem;
  font-weight: bold;
  color: #1976d2;
`;

const EnhancedCard = styled(Card)`
  border-radius: 20px !important;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1) !important;
  border: 1px solid rgba(255,255,255,0.2) !important;
  backdrop-filter: blur(10px) !important;
  background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.8) 100%) !important;
  transition: all 0.3s ease !important;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0,0,0,0.15) !important;
  }
`;

const RealTimeStatCard = styled(Card)`
  padding: 2rem;
  height: 160px;
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  border-radius: 20px !important;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1) !important;
  border: 1px solid rgba(255,255,255,0.2) !important;
  transition: all 0.3s ease !important;
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0,0,0,0.15) !important;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  }
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  position: relative;
`;

const StatIcon = styled.div`
  font-size: 3rem;
  margin-right: 1.5rem;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
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
  margin-top: 0.5rem;
  font-weight: 500;
`;

const LiveIndicator = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  width: 12px;
  height: 12px;
  background: #4caf50;
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.3);
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.2); opacity: 0.7; }
    100% { transform: scale(1); opacity: 1; }
  }
`;

const TrendIndicator = styled.div`
  display: flex;
  align-items: center;
  color: ${props => props.positive ? '#4caf50' : '#f44336'};
  font-size: 0.9rem;
  font-weight: 600;
  gap: 0.5rem;
`;

const ActivityList = styled(List)`
  padding: 0 !important;
`;

const ActivityItem = styled(ListItem)`
  padding: 1rem 0 !important;
  border-bottom: 1px solid #f0f0f0;
  display: flex !important;
  align-items: flex-start !important;
`;

const ActivityAvatar = styled.div`
  font-size: 1.5rem;
  margin-right: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityText = styled.div`
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
`;

const ActivityTime = styled.div`
  font-size: 0.75rem;
  color: #999;
`;

const RankingItem = styled(ListItem)`
  padding: 1rem 0 !important;
  border-bottom: 1px solid #f0f0f0;
  display: flex !important;
  align-items: center !important;
`;

const RankingBadge = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => {
    switch(props.rank) {
      case 1: return 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)';
      case 2: return 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)';
      case 3: return 'linear-gradient(135deg, #CD7F32 0%, #A0522D 100%)';
      default: return 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: ${props => props.rank <= 3 ? '1.2rem' : '0.9rem'};
  color: ${props => props.rank <= 3 ? '#fff' : '#666'};
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
`;

const CategoryCard = styled(Card)`
  padding: 1.5rem;
  border-radius: 16px !important;
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  }
`;

const ArticleInfo = styled.div`
  display: flex;
  align-items: flex-start;
  max-width: 400px;
`;

const ArticleThumbnail = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
`;

const UserStatCard = styled(Card)`
  padding: 1.5rem;
  text-align: center;
  border-radius: 16px !important;
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  }
`;

const ComingSoonSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  text-align: center;
`;

export default EnhancedDashboard;