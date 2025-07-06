import React, { useState } from 'react';
import {
  Typography, Grid, Box, Card, CardContent, Button, TextField, Select, 
  MenuItem, FormControl, InputLabel, Dialog, DialogTitle, DialogContent, 
  DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, Chip, IconButton, Tabs, Tab, RadioGroup, Radio, 
  FormControlLabel, FormLabel, Alert
} from '@mui/material';
import {
  Article, Add, Edit, Delete, Save, Cancel, Preview, Publish, 
  Visibility, CloudUpload, Image
} from '@mui/icons-material';
import { ActionButton } from './DashboardStyles';

const ArticleManagement = ({ 
  articles,
  allArticles,
  totalArticles,
  currentPage,
  totalPages,
  onPageChange,
  onAddArticle,
  onUpdateArticle, 
  onDeleteArticle,
  onRefreshArticles,
  editableCategories,
  setSnackbar 
}) => {
  // 기사 편집 상태
  const [articleDialog, setArticleDialog] = useState(false);
  const [draftDialog, setDraftDialog] = useState(false);
  const [savedDrafts, setSavedDrafts] = useState([]);
  const [editingArticle, setEditingArticle] = useState(null);
  const [activeContentTab, setActiveContentTab] = useState(0);
  const [articleStats, setArticleStats] = useState({});
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

  // 기사 폼 초기화
  const resetArticleForm = () => {
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
      category: (editableCategories && editableCategories.length > 0) ? editableCategories[0] : 'Technology',
      image: '',
      imageFile: null,
      publishType: 'immediate',
      publishedAt: now.toISOString().slice(0, 16),
      status: 'published'
    });
    setEditingArticle(null);
    setActiveContentTab(0);
  };

  // 이미지 파일 업로드 처리
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
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

  // 임시저장 목록 불러오기
  const loadSavedDrafts = () => {
    const drafts = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('article_draft_')) {
        try {
          const draftData = JSON.parse(localStorage.getItem(key));
          drafts.push({ key, ...draftData });
        } catch (error) {
          console.error('임시저장 데이터 파싱 오류:', error);
        }
      }
    }
    setSavedDrafts(drafts.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt)));
  };

  // 기사별 실제 통계 계산
  const calculateArticleStats = () => {
    const stats = {};
    
    allArticles.forEach(article => {
      // 기본 성과 지표 계산
      const engagementRate = article.views > 0 ? (article.likes / article.views * 100).toFixed(1) : 0;
      const publishDate = new Date(article.publishedAt);
      const daysSincePublish = Math.floor((new Date() - publishDate) / (1000 * 60 * 60 * 24));
      const avgViewsPerDay = daysSincePublish > 0 ? (article.views / daysSincePublish).toFixed(1) : article.views;
      
      // 카테고리별 평균과 비교
      const categoryArticles = allArticles.filter(a => a.category === article.category);
      const categoryAvgViews = categoryArticles.reduce((sum, a) => sum + (a.views || 0), 0) / categoryArticles.length;
      const categoryAvgLikes = categoryArticles.reduce((sum, a) => sum + (a.likes || 0), 0) / categoryArticles.length;
      
      const viewsVsCategory = categoryAvgViews > 0 ? ((article.views - categoryAvgViews) / categoryAvgViews * 100).toFixed(1) : 0;
      const likesVsCategory = categoryAvgLikes > 0 ? ((article.likes - categoryAvgLikes) / categoryAvgLikes * 100).toFixed(1) : 0;
      
      stats[article.id] = {
        engagementRate: parseFloat(engagementRate),
        avgViewsPerDay: parseFloat(avgViewsPerDay),
        daysSincePublish,
        viewsVsCategory: parseFloat(viewsVsCategory),
        likesVsCategory: parseFloat(likesVsCategory),
        performance: article.views > categoryAvgViews ? 'high' : article.views > categoryAvgViews * 0.5 ? 'medium' : 'low'
      };
    });
    
    setArticleStats(stats);
  };

  // 컴포넌트 마운트 시 통계 계산
  React.useEffect(() => {
    if (allArticles && allArticles.length > 0) {
      calculateArticleStats();
    }
  }, [allArticles]);

  // 기사 추가 핸들러
  const handleAddArticle = async () => {
    if (!articleForm.title.trim()) {
      setSnackbar({ open: true, message: '제목을 입력해주세요.', severity: 'error' });
      return;
    }

    if (!articleForm.summary.trim()) {
      setSnackbar({ open: true, message: '요약을 입력해주세요.', severity: 'error' });
      return;
    }

    if (!articleForm.content?.beginner?.trim() || !articleForm.content?.intermediate?.trim() || !articleForm.content?.advanced?.trim()) {
      setSnackbar({ open: true, message: '모든 난이도의 본문을 입력해주세요.', severity: 'error' });
      return;
    }

    try {
      console.log('🔄 기사 추가 시작...');
      console.log('📝 기사 폼 데이터:', articleForm);
      
      const newArticleData = {
        title: articleForm.title,
        summary: articleForm.summary,
        content: {
          beginner: articleForm.content?.beginner || '',
          intermediate: articleForm.content?.intermediate || '',
          advanced: articleForm.content?.advanced || ''
        },
        category: articleForm.category,
        image: articleForm.image || '/placeholder-image.svg',
        publishedAt: articleForm.publishType === 'immediate' ? new Date().toISOString() : articleForm.publishedAt,
        author: 'Admin',
        views: 0,
        likes: 0,
        wordCount: (articleForm.content?.intermediate || '').split(' ').filter(word => word.trim()).length,
        readingTime: Math.ceil(((articleForm.content?.intermediate || '').split(' ').filter(word => word.trim()).length) / 200) || 1,
        level: 'intermediate',
        tags: articleForm.category ? [articleForm.category] : [],
        status: articleForm.status,
        isCustom: true
      };

      console.log('📋 전송할 기사 데이터:', newArticleData);
      
      const articleId = await onAddArticle(newArticleData);
      
      console.log('✅ 기사 추가 결과:', articleId);
      
      if (articleId) {
        setSnackbar({ open: true, message: '새 기사가 성공적으로 추가되었습니다!', severity: 'success' });
        setArticleDialog(false);
        resetArticleForm();
      } else {
        console.error('❌ 기사 추가 실패: articleId가 null');
        setSnackbar({ open: true, message: '기사 추가 중 오류가 발생했습니다.', severity: 'error' });
      }
    } catch (error) {
      console.error('🚨 기사 추가 중 예외 발생:', error);
      console.error('🚨 에러 스택:', error.stack);
      
      // 업로드 실패 시 임시저장
      const draftKey = `article_draft_${Date.now()}`;
      const draftData = {
        ...articleForm,
        savedAt: new Date().toISOString(),
        errorMessage: error.message
      };
      
      try {
        localStorage.setItem(draftKey, JSON.stringify(draftData));
        setSnackbar({ 
          open: true, 
          message: `업로드 실패했습니다. 작성한 내용이 임시저장되었습니다. (${error.message})`, 
          severity: 'warning' 
        });
      } catch (storageError) {
        console.error('임시저장 실패:', storageError);
        setSnackbar({ 
          open: true, 
          message: `기사 추가 중 오류가 발생했습니다: ${error.message}`, 
          severity: 'error' 
        });
      }
    }
  };

  // 기사 편집 핸들러
  const handleEditArticle = (article) => {
    setEditingArticle(article);
    setArticleForm({
      title: article.title,
      summary: article.summary,
      content: article.content || {
        beginner: article.summary,
        intermediate: article.summary,
        advanced: article.summary
      },
      category: article.category,
      image: article.image,
      imageFile: null,
      publishType: 'immediate',
      publishedAt: new Date(article.publishedAt).toISOString().slice(0, 16),
      status: article.status || 'published'
    });
    setArticleDialog(true);
  };

  // 임시저장된 내용 불러오기
  const handleLoadDraft = (draftKey) => {
    try {
      const draftData = JSON.parse(localStorage.getItem(draftKey));
      setArticleForm({
        title: draftData.title || '',
        summary: draftData.summary || '',
        content: draftData.content || {
          beginner: '',
          intermediate: '',
          advanced: ''
        },
        category: draftData.category || 'Technology',
        image: draftData.image || '',
        imageFile: null,
        publishType: draftData.publishType || 'immediate',
        publishedAt: draftData.publishedAt || new Date().toISOString().slice(0, 16),
        status: draftData.status || 'published'
      });
      setEditingArticle(null);
      setActiveContentTab(0);
      setDraftDialog(false);
      setArticleDialog(true);
    } catch (error) {
      console.error('임시저장 불러오기 오류:', error);
      setSnackbar({ 
        open: true, 
        message: '임시저장 불러오기 중 오류가 발생했습니다.', 
        severity: 'error' 
      });
    }
  };

  // 기사 업데이트 핸들러
  const handleUpdateArticle = async () => {
    if (!articleForm.title.trim()) {
      setSnackbar({ open: true, message: '제목을 입력해주세요.', severity: 'error' });
      return;
    }

    try {
      const updatedData = {
        title: articleForm.title,
        summary: articleForm.summary,
        content: articleForm.content,
        category: articleForm.category,
        image: articleForm.image,
        status: articleForm.status,
        publishedAt: articleForm.publishType === 'immediate' ? editingArticle.publishedAt : articleForm.publishedAt,
        wordCount: (articleForm.content?.intermediate || '').split(' ').filter(word => word.trim()).length,
        readingTime: Math.ceil(((articleForm.content?.intermediate || '').split(' ').filter(word => word.trim()).length) / 200) || 1,
        tags: articleForm.category ? [articleForm.category] : []
      };

      const success = await onUpdateArticle(editingArticle.id, updatedData);
      
      if (success) {
        setSnackbar({ open: true, message: '기사가 성공적으로 수정되었습니다!', severity: 'success' });
        setArticleDialog(false);
        resetArticleForm();
      } else {
        setSnackbar({ open: true, message: '기사 수정 중 오류가 발생했습니다.', severity: 'error' });
      }
    } catch (error) {
      console.error('Error updating article:', error);
      setSnackbar({ open: true, message: '기사 수정 중 오류가 발생했습니다.', severity: 'error' });
    }
  };

  const handleDeleteArticle = async (articleId) => {
    try {
      const success = await onDeleteArticle(articleId);
      if (success) {
        setSnackbar({ open: true, message: '기사가 성공적으로 삭제되었습니다!', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: '기사 삭제 중 오류가 발생했습니다.', severity: 'error' });
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      setSnackbar({ open: true, message: '기사 삭제 중 오류가 발생했습니다.', severity: 'error' });
    }
  };

  // 임시저장 삭제
  const handleDeleteDraft = (draftKey) => {
    try {
      localStorage.removeItem(draftKey);
      loadSavedDrafts();
      setSnackbar({ 
        open: true, 
        message: '임시저장이 삭제되었습니다.', 
        severity: 'success' 
      });
    } catch (error) {
      console.error('임시저장 삭제 오류:', error);
      setSnackbar({ 
        open: true, 
        message: '임시저장 삭제 중 오류가 발생했습니다.', 
        severity: 'error' 
      });
    }
  };

  return (
    <Box>
      {/* 액션 버튼들 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <ActionButton onClick={() => { resetArticleForm(); setArticleDialog(true); }}>
            <Add fontSize="large" />
            <Typography variant="h6" sx={{ mt: 1 }}>새 기사 작성</Typography>
          </ActionButton>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ActionButton onClick={onRefreshArticles}>
            <Article fontSize="large" />
            <Typography variant="h6" sx={{ mt: 1 }}>기사 새로고침</Typography>
          </ActionButton>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ActionButton onClick={() => { loadSavedDrafts(); setDraftDialog(true); }}>
            <Save fontSize="large" />
            <Typography variant="h6" sx={{ mt: 1 }}>임시저장 목록</Typography>
          </ActionButton>
        </Grid>
      </Grid>

      {/* 성과 요약 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, borderRadius: '12px', bgcolor: '#f8f9fa' }}>
            <Typography variant="h6" fontWeight="bold" color="success.main">
              {Object.values(articleStats).filter(stat => stat.performance === 'high').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              고성과 기사
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, borderRadius: '12px', bgcolor: '#f8f9fa' }}>
            <Typography variant="h6" fontWeight="bold" color="primary">
              {Object.values(articleStats).length > 0 ? 
                (Object.values(articleStats).reduce((sum, stat) => sum + stat.engagementRate, 0) / Object.values(articleStats).length).toFixed(1) 
                : 0}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              평균 참여율
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, borderRadius: '12px', bgcolor: '#f8f9fa' }}>
            <Typography variant="h6" fontWeight="bold" color="warning.main">
              {Object.values(articleStats).length > 0 ? 
                (Object.values(articleStats).reduce((sum, stat) => sum + stat.avgViewsPerDay, 0) / Object.values(articleStats).length).toFixed(1) 
                : 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              일평균 조회수
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, borderRadius: '12px', bgcolor: '#f8f9fa' }}>
            <Typography variant="h6" fontWeight="bold" color="info.main">
              {allArticles.filter(article => {
                const publishDate = new Date(article.publishedAt);
                const today = new Date();
                const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                return publishDate >= weekAgo;
              }).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              최근 7일 발행
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* 기사 목록 테이블 */}
      <Card sx={{ borderRadius: '16px' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold">
              📰 기사 관리 ({totalArticles}개)
            </Typography>
            <Button onClick={onRefreshArticles} startIcon={<Article />} variant="outlined">
              새로고침
            </Button>
          </Box>
          
          <TableContainer component={Paper} sx={{ borderRadius: '12px' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                  <TableCell><strong>제목</strong></TableCell>
                  <TableCell><strong>카테고리</strong></TableCell>
                  <TableCell><strong>조회수</strong></TableCell>
                  <TableCell><strong>좋아요</strong></TableCell>
                  <TableCell><strong>참여율</strong></TableCell>
                  <TableCell><strong>일평균 조회</strong></TableCell>
                  <TableCell><strong>성과</strong></TableCell>
                  <TableCell><strong>발행일</strong></TableCell>
                  <TableCell><strong>상태</strong></TableCell>
                  <TableCell><strong>작업</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(articles || []).map((article) => (
                  <TableRow key={article.id} hover>
                    <TableCell>
                      <Box sx={{ maxWidth: 200 }}>
                        <Typography variant="body2" fontWeight="bold" noWrap>
                          {article.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {article.summary?.substring(0, 50)}...
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={article.category} size="small" />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Visibility fontSize="small" color="action" />
                        {article.views || 0}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        ❤️ {article.likes || 0}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="primary" fontWeight="bold">
                        {articleStats[article.id]?.engagementRate || 0}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {articleStats[article.id]?.avgViewsPerDay || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={articleStats[article.id]?.performance || 'low'}
                        color={
                          articleStats[article.id]?.performance === 'high' ? 'success' :
                          articleStats[article.id]?.performance === 'medium' ? 'warning' : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(article.publishedAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={article.status || 'published'} 
                        color={article.status === 'published' ? 'success' : 'warning'}
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditArticle(article)}
                          color="primary"
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        {article.isCustom && (
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteArticle(article.id)}
                            color="error"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" alignItems="center" gap={1} sx={{ mt: 3 }}>
              {/* 이전 */}
              <Button 
                variant="outlined" 
                size="small" 
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
              >
                ← 이전
              </Button>
              {/* 페이지 번호 */}
              {Array.from({ length: totalPages || 0 }, (_, idx) => idx + 1).map(page => (
                <Button 
                  key={page}
                  variant={currentPage === page ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </Button>
              ))}
              {/* 다음 */}
              <Button 
                variant="outlined" 
                size="small" 
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
              >
                다음 →
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 기사 추가/편집 다이얼로그 */}
      <Dialog open={articleDialog} onClose={() => setArticleDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Typography variant="h5" fontWeight="bold">
            {editingArticle ? '✏️ 기사 수정' : '📝 새 기사 작성'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              {/* 기본 정보 */}
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="제목 *"
                  value={articleForm.title}
                  onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                  sx={{ mb: 3 }}
                  placeholder="매력적이고 명확한 제목을 작성하세요"
                />
                
                <TextField
                  fullWidth
                  label="요약 *"
                  value={articleForm.summary}
                  onChange={(e) => setArticleForm({ ...articleForm, summary: e.target.value })}
                  multiline
                  rows={3}
                  sx={{ mb: 3 }}
                  placeholder="기사의 핵심 내용을 2-3줄로 요약해주세요"
                />

                {/* 본문 탭 */}
                <Box sx={{ mb: 3 }}>
                  <Tabs 
                    value={activeContentTab} 
                    onChange={(e, newValue) => setActiveContentTab(newValue)}
                    sx={{ mb: 2 }}
                  >
                    <Tab label="🟢 초급자용" />
                    <Tab label="🟡 중급자용" />
                    <Tab label="🔴 고급자용" />
                  </Tabs>
                  
                  {activeContentTab === 0 && (
                    <TextField
                      fullWidth
                      label="초급자용 본문 *"
                      value={articleForm.content.beginner}
                      onChange={(e) => setArticleForm({ 
                        ...articleForm, 
                        content: { ...articleForm.content, beginner: e.target.value }
                      })}
                      multiline
                      rows={8}
                      placeholder="쉬운 단어와 짧은 문장으로 작성해주세요"
                    />
                  )}
                  
                  {activeContentTab === 1 && (
                    <TextField
                      fullWidth
                      label="중급자용 본문 *"
                      value={articleForm.content.intermediate}
                      onChange={(e) => setArticleForm({ 
                        ...articleForm, 
                        content: { ...articleForm.content, intermediate: e.target.value }
                      })}
                      multiline
                      rows={8}
                      placeholder="표준적인 어휘와 문장 구조로 작성해주세요"
                    />
                  )}
                  
                  {activeContentTab === 2 && (
                    <TextField
                      fullWidth
                      label="고급자용 본문 *"
                      value={articleForm.content.advanced}
                      onChange={(e) => setArticleForm({ 
                        ...articleForm, 
                        content: { ...articleForm.content, advanced: e.target.value }
                      })}
                      multiline
                      rows={8}
                      placeholder="고급 어휘와 복잡한 문장 구조를 사용해주세요"
                    />
                  )}
                </Box>
              </Grid>

              {/* 설정 */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>카테고리</InputLabel>
                  <Select
                    value={articleForm.category}
                    label="카테고리"
                    onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })}
                  >
                    {(editableCategories || []).map((category) => (
                      <MenuItem key={category} value={category}>{category}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>상태</InputLabel>
                  <Select
                    value={articleForm.status}
                    label="상태"
                    onChange={(e) => setArticleForm({ ...articleForm, status: e.target.value })}
                  >
                    <MenuItem value="published">✅ 발행됨</MenuItem>
                    <MenuItem value="draft">📄 초안</MenuItem>
                    <MenuItem value="scheduled">⏰ 예약됨</MenuItem>
                  </Select>
                </FormControl>

                {/* 발행 옵션 */}
                <Box sx={{ mb: 3 }}>
                  <FormLabel component="legend" sx={{ mb: 2 }}>발행 설정</FormLabel>
                  <RadioGroup
                    value={articleForm.publishType}
                    onChange={(e) => setArticleForm({ ...articleForm, publishType: e.target.value })}
                  >
                    <FormControlLabel value="immediate" control={<Radio />} label="즉시 발행" />
                    <FormControlLabel value="scheduled" control={<Radio />} label="예약 발행" />
                  </RadioGroup>
                  
                  {articleForm.publishType === 'scheduled' && (
                    <TextField
                      fullWidth
                      label="발행 예정일"
                      type="datetime-local"
                      value={articleForm.publishedAt}
                      onChange={(e) => setArticleForm({ ...articleForm, publishedAt: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      sx={{ mt: 2 }}
                    />
                  )}
                </Box>

                {/* 이미지 업로드 */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>대표 이미지</Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUpload />}
                    sx={{ mb: 2, width: '100%' }}
                  >
                    이미지 업로드
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </Button>
                  
                  {articleForm.image && (
                    <Box sx={{ textAlign: 'center' }}>
                      <img 
                        src={articleForm.image} 
                        alt="Preview" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '200px', 
                          borderRadius: '8px',
                          objectFit: 'cover'
                        }} 
                      />
                    </Box>
                  )}
                </Box>

                <Alert severity="info" sx={{ mb: 2 }}>
                  💡 <strong>작성 팁:</strong><br/>
                  • 각 난이도별로 적절한 어휘 수준을 맞춰주세요<br/>
                  • 초급: 기본 단어, 간단한 문장<br/>
                  • 중급: 일반적 단어, 표준 문장<br/>
                  • 고급: 전문 용어, 복잡한 구조
                </Alert>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setArticleDialog(false)} startIcon={<Cancel />}>
            취소
          </Button>
          <Button 
            onClick={editingArticle ? handleUpdateArticle : handleAddArticle}
            variant="contained" 
            startIcon={<Save />}
            size="large"
          >
            {editingArticle ? '수정 완료' : '기사 발행'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 임시저장 목록 다이얼로그 */}
      <Dialog open={draftDialog} onClose={() => setDraftDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>📝 임시저장 목록</DialogTitle>
        <DialogContent>
          {savedDrafts.length === 0 ? (
            <Alert severity="info">저장된 임시저장이 없습니다.</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>제목</TableCell>
                    <TableCell>저장일</TableCell>
                    <TableCell>에러 메시지</TableCell>
                    <TableCell>작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {savedDrafts.map((draft) => (
                    <TableRow key={draft.key}>
                      <TableCell>{draft.title || '제목 없음'}</TableCell>
                      <TableCell>
                        {new Date(draft.savedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="error">
                          {draft.errorMessage || '알 수 없음'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Button 
                            size="small" 
                            onClick={() => handleLoadDraft(draft.key)}
                            startIcon={<Edit />}
                          >
                            불러오기
                          </Button>
                          <Button 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteDraft(draft.key)}
                            startIcon={<Delete />}
                          >
                            삭제
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDraftDialog(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ArticleManagement; 