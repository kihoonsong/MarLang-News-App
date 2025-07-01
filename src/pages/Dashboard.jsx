import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  AppBar, Toolbar, Typography, IconButton, Button, Card, CardContent, 
  Grid, TextField, Select, MenuItem, FormControl, InputLabel, Box,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Chip, Switch, FormControlLabel, Avatar, LinearProgress, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, Badge,
  List, ListItem, ListItemText, ListItemAvatar, Tooltip
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, Article, Category, People, BarChart,
  Add, Edit, Delete, Upload, Schedule, DragIndicator, Analytics,
  TrendingUp, Visibility, ThumbUp, BookmarkBorder, GetApp,
  Refresh, NotificationsActive, Settings, Timeline, PieChart,
  CalendarToday, Search, FilterList, ExitToApp
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, type: '' });
  const [realTimeData, setRealTimeData] = useState({
    currentUsers: 42,
    todaySignups: 8,
    activeNow: 15
  });

  // 관리자 권한 체크 강화
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    
    // 추가 권한 체크 (이중 보안)
    if (!user?.role || (user.role !== 'super_admin' && user.role !== 'admin')) {
      console.warn('대시보드 접근 거부: 관리자 권한 없음', user?.role);
      navigate('/');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  // 실시간 데이터 업데이트 시뮬레이션
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        currentUsers: prev.currentUsers + Math.floor(Math.random() * 3) - 1,
        todaySignups: prev.todaySignups + (Math.random() > 0.9 ? 1 : 0),
        activeNow: prev.activeNow + Math.floor(Math.random() * 5) - 2
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const [newArticle, setNewArticle] = useState({
    title: '',
    category: '',
    content: '',
    level: 1,
    publishDate: '',
    publishTime: '',
    thumbnail: null,
    tags: '',
    metaDescription: '',
    featured: false
  });

  // 확장된 통계 데이터
  const stats = {
    totalArticles: 156,
    totalUsers: 1234,
    totalWords: 5678,
    todayViews: 892,
    monthlyGrowth: 12.5,
    avgReadTime: '3.2 min',
    popularCategory: 'Technology',
    completionRate: 78.3
  };

  // 실시간 활동 데이터
  const recentActivity = [
    { id: 1, user: 'John Doe', action: 'completed article', article: 'AI in Healthcare', time: '2 min ago', type: 'completion' },
    { id: 2, user: 'Jane Smith', action: 'added to wordbook', word: 'algorithm', time: '5 min ago', type: 'word' },
    { id: 3, user: 'Mike Johnson', action: 'liked article', article: 'Climate Change', time: '8 min ago', type: 'like' },
    { id: 4, user: 'Sarah Wilson', action: 'started reading', article: 'Future of Work', time: '12 min ago', type: 'view' }
  ];

  // 인기 기사 순위
  const topArticles = [
    { id: 1, title: 'AI Revolution in Healthcare', views: 2450, likes: 189, category: 'Technology' },
    { id: 2, title: 'Climate Change Solutions', views: 1876, likes: 145, category: 'Science' },
    { id: 3, title: 'Future of Remote Work', views: 1654, likes: 132, category: 'Business' },
    { id: 4, title: 'Quantum Computing Basics', views: 1432, likes: 98, category: 'Technology' },
    { id: 5, title: 'Sustainable Energy', views: 1298, likes: 87, category: 'Science' }
  ];

  // 확장된 기사 데이터
  const [articles, setArticles] = useState([
    {
      id: 1,
      title: 'AI Revolution in Healthcare: Transforming Patient Care',
      category: 'Technology',
      level: 'Advanced',
      status: 'Published',
      publishDate: 'Jun-25-24',
      views: 2450,
      likes: 189,
      words: 856,
      readTime: '4.2 min',
      featured: true,
      author: 'Dr. Smith'
    },
    {
      id: 2,
      title: 'Climate Change Impact on Global Food Security',
      category: 'Science',
      level: 'Intermediate',
      status: 'Scheduled',
      publishDate: 'Jun-27-24',
      views: 0,
      likes: 0,
      words: 724,
      readTime: '3.8 min',
      featured: false,
      author: 'Prof. Johnson'
    },
    {
      id: 3,
      title: 'The Future of Remote Work: Trends and Predictions',
      category: 'Business',
      level: 'Beginner',
      status: 'Draft',
      publishDate: '',
      views: 0,
      likes: 0,
      words: 642,
      readTime: '3.2 min',
      featured: false,
      author: 'Maria Garcia'
    }
  ]);

  // 카테고리별 통계
  const categoryStats = [
    { name: 'Technology', articles: 45, views: 12540, growth: 15.2 },
    { name: 'Science', articles: 32, views: 8760, growth: 8.7 },
    { name: 'Business', articles: 28, views: 7320, growth: 12.1 },
    { name: 'Health', articles: 24, views: 6890, growth: 6.3 },
    { name: 'Culture', articles: 27, views: 5420, growth: -2.1 }
  ];

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

  const handleArticleSubmit = (e) => {
    e.preventDefault();
    const newId = Math.max(...articles.map(a => a.id)) + 1;
    const articleToAdd = {
      id: newId,
      ...newArticle,
      status: newArticle.publishDate ? 'Scheduled' : 'Draft',
      views: 0,
      likes: 0,
      words: newArticle.content.split(' ').length,
      readTime: `${(newArticle.content.split(' ').length / 250).toFixed(1)} min`,
      author: user?.name || 'Admin'
    };
    
    setArticles([...articles, articleToAdd]);
    setNewArticle({
      title: '', category: '', content: '', level: 1,
      publishDate: '', publishTime: '', thumbnail: null,
      tags: '', metaDescription: '', featured: false
    });
    setDialogOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm.type === 'article') {
      setArticles(articles.filter(a => a.id !== deleteConfirm.id));
    }
    setDeleteConfirm({ open: false, id: null, type: '' });
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'completion': return '✅';
      case 'word': return '📚';
      case 'like': return '❤️';
      case 'view': return '👁️';
      default: return '📄';
    }
  };

  const renderAdvancedOverview = () => (
    <Box>
      {/* 주요 통계 카드 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <EnhancedStatCard>
            <StatCardHeader>
              <StatIcon>📰</StatIcon>
              <Box>
                <StatNumber>{stats.totalArticles}</StatNumber>
                <StatLabel>Total Articles</StatLabel>
              </Box>
            </StatCardHeader>
            <TrendIndicator positive={true}>
              <TrendingUp fontSize="small" />
              +12 this month
            </TrendIndicator>
          </EnhancedStatCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <EnhancedStatCard>
            <StatCardHeader>
              <StatIcon>👥</StatIcon>
              <Box>
                <StatNumber>{stats.totalUsers}</StatNumber>
                <StatLabel>Total Users</StatLabel>
              </Box>
            </StatCardHeader>
            <TrendIndicator positive={true}>
              <TrendingUp fontSize="small" />
              +{stats.monthlyGrowth}% growth
            </TrendIndicator>
          </EnhancedStatCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <EnhancedStatCard>
            <StatCardHeader>
              <StatIcon>📚</StatIcon>
              <Box>
                <StatNumber>{stats.totalWords}</StatNumber>
                <StatLabel>Words Learned</StatLabel>
              </Box>
            </StatCardHeader>
            <TrendIndicator positive={true}>
              <TrendingUp fontSize="small" />
              {stats.completionRate}% completion
            </TrendIndicator>
          </EnhancedStatCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <EnhancedStatCard>
            <StatCardHeader>
              <StatIcon>👀</StatIcon>
              <Box>
                <StatNumber>{stats.todayViews}</StatNumber>
                <StatLabel>Today's Views</StatLabel>
              </Box>
            </StatCardHeader>
            <TrendIndicator positive={true}>
              <Timeline fontSize="small" />
              {stats.avgReadTime} avg read
            </TrendIndicator>
          </EnhancedStatCard>
        </Grid>
      </Grid>

      {/* 실시간 활동 및 인기 기사 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '400px' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <NotificationsActive color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Real-time Activity</Typography>
                <Badge badgeContent={realTimeData.activeNow} color="success" sx={{ ml: 'auto' }}>
                  <Typography variant="caption">Active Now</Typography>
                </Badge>
              </Box>
              
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {recentActivity.map((activity) => (
                  <ListItem key={activity.id} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: '#f5f5f5', fontSize: '1rem' }}>
                        {getActivityIcon(activity.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box>
                          <strong>{activity.user}</strong> {activity.action}
                          {activity.article && (
                            <> "<em>{activity.article}</em>"</>
                          )}
                          {activity.word && (
                            <> "<em>{activity.word}</em>"</>
                          )}
                        </Box>
                      }
                      secondary={activity.time}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '400px' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BarChart color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Top Articles</Typography>
              </Box>
              
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {topArticles.map((article, index) => (
                  <ListItem key={article.id} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: index < 3 ? '#gold' : '#f5f5f5', color: '#333' }}>
                        #{index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={article.title}
                      secondary={
                        <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Visibility fontSize="small" sx={{ mr: 0.5 }} />
                            {article.views}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ThumbUp fontSize="small" sx={{ mr: 0.5 }} />
                            {article.likes}
                          </Box>
                          <Chip label={article.category} size="small" variant="outlined" />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 카테고리별 통계 */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PieChart color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Category Performance</Typography>
          </Box>
          
          <Grid container spacing={2}>
            {categoryStats.map((category) => (
              <Grid item xs={12} sm={6} md={4} key={category.name}>
                <CategoryStatCard>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {category.name}
                    </Typography>
                    <TrendIndicator positive={category.growth > 0} small>
                      {category.growth > 0 ? '↗' : '↘'} {Math.abs(category.growth)}%
                    </TrendIndicator>
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {category.articles} articles • {category.views.toLocaleString()} views
                    </Typography>
                  </Box>
                  
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(100, (category.views / 15000) * 100)} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </CategoryStatCard>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );

  const renderEnhancedArticleManagement = () => (
    <Box>
      <SectionHeader>
        <SectionTitle>
          <Article sx={{ mr: 1 }} />
          Article Management
        </SectionTitle>
        <Box>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => setDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Add Article
          </Button>
          <Button variant="outlined" startIcon={<GetApp />}>
            Export
          </Button>
        </Box>
      </SectionHeader>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search articles..."
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select defaultValue="">
                  <MenuItem value="">All Categories</MenuItem>
                  <MenuItem value="Technology">Technology</MenuItem>
                  <MenuItem value="Science">Science</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select defaultValue="">
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="Published">Published</MenuItem>
                  <MenuItem value="Draft">Draft</MenuItem>
                  <MenuItem value="Scheduled">Scheduled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button variant="outlined" startIcon={<FilterList />} fullWidth>
                Filter
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button variant="outlined" startIcon={<Refresh />} fullWidth>
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Article</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Performance</TableCell>
              <TableCell>Publish Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {articles.map((article) => (
              <TableRow key={article.id} hover>
                <TableCell>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {article.title}
                      </Typography>
                      {article.featured && (
                        <Chip label="Featured" size="small" color="warning" sx={{ ml: 1 }} />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {article.words} words • {article.readTime} • by {article.author}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={article.category} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={article.level} 
                    size="small"
                    color={
                      article.level === 'Beginner' ? 'success' :
                      article.level === 'Intermediate' ? 'warning' : 'error'
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Visibility fontSize="small" />
                      <Typography variant="body2">{article.views}</Typography>
                      <ThumbUp fontSize="small" />
                      <Typography variant="body2">{article.likes}</Typography>
                    </Box>
                    {article.status === 'Published' && (
                      <LinearProgress 
                        variant="determinate" 
                        value={(article.likes / article.views) * 100} 
                        sx={{ mt: 0.5, height: 4 }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>{article.publishDate || 'Not scheduled'}</TableCell>
                <TableCell>
                  <Tooltip title="Edit">
                    <IconButton size="small">
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
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
                  <Tooltip title="View">
                    <IconButton size="small" onClick={() => navigate(`/article/${article.id}`)}>
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Article Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Article</DialogTitle>
        <DialogContent>
          <form onSubmit={handleArticleSubmit}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  value={newArticle.title}
                  onChange={(e) => setNewArticle({...newArticle, title: e.target.value})}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
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
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Level</InputLabel>
                  <Select
                    value={newArticle.level}
                    onChange={(e) => setNewArticle({...newArticle, level: e.target.value})}
                  >
                    <MenuItem value="Beginner">Beginner</MenuItem>
                    <MenuItem value="Intermediate">Intermediate</MenuItem>
                    <MenuItem value="Advanced">Advanced</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Meta Description"
                  value={newArticle.metaDescription}
                  onChange={(e) => setNewArticle({...newArticle, metaDescription: e.target.value})}
                  helperText="Brief description for search engines (max 160 characters)"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tags"
                  value={newArticle.tags}
                  onChange={(e) => setNewArticle({...newArticle, tags: e.target.value})}
                  helperText="Comma-separated tags (e.g., AI, healthcare, technology)"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={8}
                  label="Content"
                  value={newArticle.content}
                  onChange={(e) => setNewArticle({...newArticle, content: e.target.value})}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="date"
                  label="Publish Date"
                  InputLabelProps={{ shrink: true }}
                  value={newArticle.publishDate}
                  onChange={(e) => setNewArticle({...newArticle, publishDate: e.target.value})}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="time"
                  label="Publish Time"
                  InputLabelProps={{ shrink: true }}
                  value={newArticle.publishTime}
                  onChange={(e) => setNewArticle({...newArticle, publishTime: e.target.value})}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={newArticle.featured}
                      onChange={(e) => setNewArticle({...newArticle, featured: e.target.checked})}
                    />
                  }
                  label="Featured Article"
                />
              </Grid>
              
              <Grid item xs={12}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="thumbnail-upload"
                  type="file"
                  onChange={(e) => setNewArticle({...newArticle, thumbnail: e.target.files[0]})}
                />
                <label htmlFor="thumbnail-upload">
                  <Button variant="outlined" component="span" startIcon={<Upload />}>
                    Upload Thumbnail
                  </Button>
                </label>
                {newArticle.thumbnail && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Selected: {newArticle.thumbnail.name}
                  </Typography>
                )}
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleArticleSubmit} variant="contained">
            Add Article
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null, type: '' })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            Are you sure you want to delete this {deleteConfirm.type}? This action cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ open: false, id: null, type: '' })}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardContainer>
      <AppBar position="static" color="primary" elevation={2}>
        <Toolbar>
          <DashboardIcon sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            MarLang Eng News - Admin Dashboard
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Badge badgeContent={realTimeData.activeNow} color="success">
              <Typography variant="body2">Active Users</Typography>
            </Badge>
            
            <Avatar src={user?.picture} sx={{ width: 32, height: 32 }} />
            
            <Tooltip title="Logout">
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
            Overview
          </SidebarItem>
          <SidebarItem 
            $active={activeTab === 'articles'}
            onClick={() => setActiveTab('articles')}
          >
            <Article sx={{ mr: 1 }} />
            Articles
            <Badge badgeContent={articles.filter(a => a.status === 'Draft').length} color="warning" sx={{ ml: 'auto' }} />
          </SidebarItem>
          <SidebarItem 
            $active={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
          >
            <Analytics sx={{ mr: 1 }} />
            Analytics
          </SidebarItem>
          <SidebarItem 
            $active={activeTab === 'categories'}
            onClick={() => setActiveTab('categories')}
          >
            <Category sx={{ mr: 1 }} />
            Categories
          </SidebarItem>
          <SidebarItem 
            $active={activeTab === 'users'}
            onClick={() => setActiveTab('users')}
          >
            <People sx={{ mr: 1 }} />
            Users
          </SidebarItem>
          <SidebarItem 
            $active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
          >
            <Settings sx={{ mr: 1 }} />
            Settings
          </SidebarItem>
        </Sidebar>

        <MainContent>
          {activeTab === 'overview' && renderAdvancedOverview()}
          {activeTab === 'articles' && renderEnhancedArticleManagement()}
          {activeTab === 'analytics' && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Analytics sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" color="text.secondary">
                Advanced Analytics Coming Soon
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Detailed charts and insights will be available here
              </Typography>
            </Box>
          )}
          {activeTab === 'categories' && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Category sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" color="text.secondary">
                Category Management
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage article categories and organization
              </Typography>
            </Box>
          )}
          {activeTab === 'users' && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <People sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" color="text.secondary">
                User Management
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage users and permissions
              </Typography>
            </Box>
          )}
          {activeTab === 'settings' && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Settings sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" color="text.secondary">
                System Settings
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Configure system preferences and settings
              </Typography>
            </Box>
          )}
        </MainContent>
      </Content>
    </DashboardContainer>
  );
};

// Enhanced Styled Components
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
  background: ${props => props.$active ? 'linear-gradient(90deg, #e3f2fd 0%, #bbdefb 100%)' : 'transparent'};
  color: ${props => props.$active ? '#1976d2' : '#666'};
  font-weight: ${props => props.$active ? '600' : 'normal'};
  border-left: ${props => props.$active ? '4px solid #1976d2' : '4px solid transparent'};
  
  &:hover {
    background: linear-gradient(90deg, #f5f5f5 0%, #eeeeee 100%);
  }
`;

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
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
  font-size: 1.8rem;
  font-weight: bold;
  color: #1976d2;
`;

const EnhancedStatCard = styled(Card)`
  padding: 1.5rem;
  height: 140px;
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  border: 1px solid #e0e0e0;
  border-radius: 16px !important;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important;
  transition: transform 0.2s ease !important;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0,0,0,0.15) !important;
  }
`;

const StatCardHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
`;

const StatIcon = styled.div`
  font-size: 2.5rem;
  margin-right: 1rem;
`;

const StatNumber = styled.div`
  font-size: 2.2rem;
  font-weight: bold;
  color: #1976d2;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.5rem;
`;

const TrendIndicator = styled.div`
  display: flex;
  align-items: center;
  color: ${props => props.positive ? '#4caf50' : '#f44336'};
  font-size: ${props => props.small ? '0.75rem' : '0.85rem'};
  font-weight: 500;
  gap: 0.25rem;
`;

const CategoryStatCard = styled(Box)`
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  background: white;
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    transform: translateY(-1px);
  }
`;

export default Dashboard; 