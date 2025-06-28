import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  AppBar, Toolbar, Typography, Button, Card, CardContent,
  Grid, TextField, Select, MenuItem, FormControl, InputLabel, Box,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Chip, Switch, FormControlLabel, Dialog, DialogTitle, DialogContent, 
  DialogActions, Alert, IconButton, Tabs, Tab, Container, Snackbar
} from '@mui/material';
import {
  Dashboard as DashboardIcon, Article, Add, Edit, Delete, 
  TrendingUp, Visibility, ThumbUp, People, Category,
  Save, Cancel, ArrowUpward, ArrowDownward
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useArticles } from '../contexts/ArticlesContext';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';

const ModernDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { allArticles, setAllArticles } = useArticles();
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // 기사 관리 상태
  const [articleDialog, setArticleDialog] = useState(false);
  const [articleForm, setArticleForm] = useState({
    id: null,
    title: '',
    summary: '',
    content: '',
    category: '',
    level: 'Beginner',
    image: '',
    author: user?.name || 'Admin',
    readingTime: 5
  });

  // 카테고리 관리 상태
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [categories, setCategories] = useState(() => {
    const articleCategories = [...new Set((allArticles || []).map(a => a.category).filter(Boolean))];
    const defaultCategories = ['Technology', 'Science', 'Business', 'Health', 'Culture'];
    return [...new Set([...defaultCategories, ...articleCategories])];
  });
  const [newCategoryName, setNewCategoryName] = useState('');

  // 인증 확인
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // 통계 계산
  const getStats = () => {
    const articles = allArticles || [];
    const totalViews = articles.reduce((sum, article) => sum + (article.views || 0), 0);
    const totalLikes = articles.reduce((sum, article) => sum + (article.likes || 0), 0);
    
    return {
      totalArticles: articles.length,
      totalViews,
      totalLikes,
      categories: categories.length
    };
  };

  const stats = getStats();

  // 기사 폼 초기화
  const resetArticleForm = () => {
    setArticleForm({
      id: null,
      title: '',
      summary: '',
      content: '',
      category: '',
      level: 'Beginner',
      image: '',
      author: user?.name || 'Admin',
      readingTime: 5
    });
  };

  // 기사 추가/수정
  const handleArticleSubmit = () => {
    if (!articleForm.title.trim()) {
      setSnackbar({ open: true, message: '제목을 입력해주세요.', severity: 'error' });
      return;
    }
    
    if (!articleForm.category) {
      setSnackbar({ open: true, message: '카테고리를 선택해주세요.', severity: 'error' });
      return;
    }

    const articleData = {
      ...articleForm,
      publishedAt: new Date().toISOString(),
      views: articleForm.id ? (allArticles.find(a => a.id === articleForm.id)?.views || 0) : Math.floor(Math.random() * 100),
      likes: articleForm.id ? (allArticles.find(a => a.id === articleForm.id)?.likes || 0) : Math.floor(Math.random() * 20),
      updatedAt: new Date().toISOString()
    };

    if (articleForm.id) {
      // 수정
      const updatedArticles = (allArticles || []).map(article => 
        article.id === articleForm.id ? { ...articleData } : article
      );
      setAllArticles(updatedArticles);
      setSnackbar({ open: true, message: '기사가 수정되었습니다!', severity: 'success' });
    } else {
      // 새 기사 추가
      const newArticle = {
        ...articleData,
        id: `article-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      setAllArticles([newArticle, ...(allArticles || [])]);
      setSnackbar({ open: true, message: '새 기사가 추가되었습니다!', severity: 'success' });
    }

    // 새 카테고리 자동 추가
    if (!categories.includes(articleForm.category)) {
      setCategories(prev => [...prev, articleForm.category]);
    }

    resetArticleForm();
    setArticleDialog(false);
  };

  // 기사 편집
  const handleEditArticle = (article) => {
    setArticleForm({
      ...article,
      publishedAt: new Date(article.publishedAt).toISOString().slice(0, 16)
    });
    setArticleDialog(true);
  };

  // 기사 삭제
  const handleDeleteArticle = (id) => {
    const updatedArticles = (allArticles || []).filter(article => article.id !== id);
    setAllArticles(updatedArticles);
    setSnackbar({ open: true, message: '기사가 삭제되었습니다.', severity: 'info' });
  };

  // 카테고리 추가
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      setSnackbar({ open: true, message: '카테고리 이름을 입력해주세요.', severity: 'error' });
      return;
    }

    if (categories.includes(newCategoryName)) {
      setSnackbar({ open: true, message: '이미 존재하는 카테고리입니다.', severity: 'warning' });
      return;
    }

    setCategories(prev => [...prev, newCategoryName]);
    setSnackbar({ open: true, message: `"${newCategoryName}" 카테고리가 추가되었습니다!`, severity: 'success' });
    setNewCategoryName('');
    setCategoryDialog(false);
  };

  // 카테고리 삭제
  const handleDeleteCategory = (categoryName) => {
    // 해당 카테고리의 기사들을 "Uncategorized"로 변경
    const updatedArticles = (allArticles || []).map(article =>
      article.category === categoryName ? { ...article, category: 'Uncategorized' } : article
    );
    setAllArticles(updatedArticles);
    
    setCategories(prev => prev.filter(cat => cat !== categoryName));
    
    // "Uncategorized" 카테고리 추가
    if (!categories.includes('Uncategorized')) {
      setCategories(prev => [...prev, 'Uncategorized']);
    }

    setSnackbar({ 
      open: true, 
      message: `"${categoryName}" 카테고리가 삭제되고 기사들이 미분류로 이동되었습니다.`, 
      severity: 'info' 
    });
  };

  // 개요 탭
  const renderOverview = () => (
    <Grid container spacing={3}>
      {/* 통계 카드들 */}
      <Grid item xs={12} sm={6} md={3}>
        <StatsCard>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  총 기사 수
                </Typography>
                <Typography variant="h4">
                  {stats.totalArticles}
                </Typography>
              </Box>
              <Article color="primary" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </StatsCard>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <StatsCard>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  총 조회수
                </Typography>
                <Typography variant="h4">
                  {stats.totalViews.toLocaleString()}
                </Typography>
              </Box>
              <Visibility color="primary" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </StatsCard>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <StatsCard>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  총 좋아요
                </Typography>
                <Typography variant="h4">
                  {stats.totalLikes.toLocaleString()}
                </Typography>
              </Box>
              <ThumbUp color="primary" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </StatsCard>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <StatsCard>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  카테고리 수
                </Typography>
                <Typography variant="h4">
                  {stats.categories}
                </Typography>
              </Box>
              <Category color="primary" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </StatsCard>
      </Grid>

      {/* 최근 기사 목록 */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              최근 기사 (최근 5개)
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>제목</TableCell>
                    <TableCell>카테고리</TableCell>
                    <TableCell>조회수</TableCell>
                    <TableCell>좋아요</TableCell>
                    <TableCell>작성일</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(allArticles || []).slice(0, 5).map((article) => (
                    <TableRow key={article.id}>
                      <TableCell>{article.title}</TableCell>
                      <TableCell>
                        <Chip label={article.category} size="small" />
                      </TableCell>
                      <TableCell>{article.views || 0}</TableCell>
                      <TableCell>{article.likes || 0}</TableCell>
                      <TableCell>
                        {new Date(article.publishedAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // 기사 관리 탭
  const renderArticleManagement = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">기사 관리</Typography>
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

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>제목</TableCell>
                  <TableCell>카테고리</TableCell>
                  <TableCell>레벨</TableCell>
                  <TableCell>조회수</TableCell>
                  <TableCell>좋아요</TableCell>
                  <TableCell>작성일</TableCell>
                  <TableCell>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(allArticles || []).map((article) => (
                  <TableRow key={article.id}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {article.title}
                      </Typography>
                      {article.summary && (
                        <Typography variant="caption" color="textSecondary">
                          {article.summary.length > 50 ? `${article.summary.substring(0, 50)}...` : article.summary}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={article.category} size="small" />
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
                    <TableCell>{article.views || 0}</TableCell>
                    <TableCell>{article.likes || 0}</TableCell>
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  // 카테고리 관리 탭
  const renderCategoryManagement = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">카테고리 관리</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCategoryDialog(true)}
        >
          새 카테고리 추가
        </Button>
      </Box>

      <Grid container spacing={2}>
        {categories.map((category, index) => (
          <Grid item xs={12} sm={6} md={4} key={category}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6">{category}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {(allArticles || []).filter(a => a.category === category).length}개 기사
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteCategory(category)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  return (
    <>
      <MobileNavigation />
      <MobileContentWrapper>
        {/* 상단바 */}
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <DashboardIcon sx={{ mr: 2 }} />
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              MarLang 관리자 대시보드
            </Typography>
            <Button onClick={() => navigate('/')}>
              홈으로 돌아가기
            </Button>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
          {/* 탭 네비게이션 */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
              <Tab label="개요" />
              <Tab label="기사 관리" />
              <Tab label="카테고리 관리" />
            </Tabs>
          </Box>

          {/* 탭 내용 */}
          {activeTab === 0 && renderOverview()}
          {activeTab === 1 && renderArticleManagement()}
          {activeTab === 2 && renderCategoryManagement()}
        </Container>

        {/* 기사 추가/편집 다이얼로그 */}
        <Dialog open={articleDialog} onClose={() => setArticleDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {articleForm.id ? '기사 편집' : '새 기사 추가'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="제목"
                value={articleForm.title}
                onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="요약"
                value={articleForm.summary}
                onChange={(e) => setArticleForm({ ...articleForm, summary: e.target.value })}
                margin="normal"
                multiline
                rows={2}
              />
              
              <TextField
                fullWidth
                label="내용"
                value={articleForm.content}
                onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                margin="normal"
                multiline
                rows={6}
              />
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>카테고리</InputLabel>
                    <Select
                      value={articleForm.category}
                      onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })}
                    >
                      {categories.map((cat) => (
                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>레벨</InputLabel>
                    <Select
                      value={articleForm.level}
                      onChange={(e) => setArticleForm({ ...articleForm, level: e.target.value })}
                    >
                      <MenuItem value="Beginner">Beginner</MenuItem>
                      <MenuItem value="Intermediate">Intermediate</MenuItem>
                      <MenuItem value="Advanced">Advanced</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <TextField
                fullWidth
                label="이미지 URL"
                value={articleForm.image}
                onChange={(e) => setArticleForm({ ...articleForm, image: e.target.value })}
                margin="normal"
              />
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="작성자"
                    value={articleForm.author}
                    onChange={(e) => setArticleForm({ ...articleForm, author: e.target.value })}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="읽기 시간 (분)"
                    type="number"
                    value={articleForm.readingTime}
                    onChange={(e) => setArticleForm({ ...articleForm, readingTime: parseInt(e.target.value) || 5 })}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setArticleDialog(false)} startIcon={<Cancel />}>
              취소
            </Button>
            <Button onClick={handleArticleSubmit} variant="contained" startIcon={<Save />}>
              {articleForm.id ? '수정' : '추가'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* 카테고리 추가 다이얼로그 */}
        <Dialog open={categoryDialog} onClose={() => setCategoryDialog(false)}>
          <DialogTitle>새 카테고리 추가</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="카테고리 이름"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              margin="normal"
              autoFocus
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
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </MobileContentWrapper>
    </>
  );
};

const StatsCard = styled(Card)`
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  
  .MuiCardContent-root {
    color: white;
  }
  
  .MuiTypography-root {
    color: white;
  }
`;

export default ModernDashboard;