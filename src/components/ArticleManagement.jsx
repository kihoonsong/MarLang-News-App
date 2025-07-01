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
  allArticles, 
  onUpdateArticles, 
  onDeleteArticle,
  onRefreshArticles,
  editableCategories,
  setSnackbar 
}) => {
  // 기사 편집 상태
  const [articleDialog, setArticleDialog] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [activeContentTab, setActiveContentTab] = useState(0);
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

  // 기사 추가 핸들러
  const handleAddArticle = () => {
    if (!articleForm.title.trim()) {
      setSnackbar({ open: true, message: '제목을 입력해주세요.', severity: 'error' });
      return;
    }

    if (!articleForm.summary.trim()) {
      setSnackbar({ open: true, message: '요약을 입력해주세요.', severity: 'error' });
      return;
    }

    if (!articleForm.content.beginner.trim() || !articleForm.content.intermediate.trim() || !articleForm.content.advanced.trim()) {
      setSnackbar({ open: true, message: '모든 난이도의 본문을 입력해주세요.', severity: 'error' });
      return;
    }

    try {
      const newArticle = {
        id: 'custom_' + Date.now(),
        title: articleForm.title,
        summary: articleForm.summary,
        content: {
          beginner: articleForm.content.beginner,
          intermediate: articleForm.content.intermediate,
          advanced: articleForm.content.advanced
        },
        category: articleForm.category,
        image: articleForm.image || 'https://via.placeholder.com/400x200?text=No+Image',
        publishedAt: articleForm.publishType === 'immediate' ? new Date().toISOString() : articleForm.publishedAt,
        author: 'Admin',
        views: 0,
        likes: 0,
        wordCount: articleForm.content.intermediate.split(' ').length,
        readingTime: Math.ceil(articleForm.content.intermediate.split(' ').length / 200),
        level: 'intermediate',
        tags: [articleForm.category],
        status: articleForm.status,
        isCustom: true
      };

      const updatedArticles = [newArticle, ...allArticles];
      onUpdateArticles(updatedArticles);
      
      setSnackbar({ open: true, message: '새 기사가 성공적으로 추가되었습니다!', severity: 'success' });
      setArticleDialog(false);
      resetArticleForm();
    } catch (error) {
      console.error('Error adding article:', error);
      setSnackbar({ open: true, message: '기사 추가 중 오류가 발생했습니다.', severity: 'error' });
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

  // 기사 업데이트 핸들러
  const handleUpdateArticle = () => {
    if (!articleForm.title.trim()) {
      setSnackbar({ open: true, message: '제목을 입력해주세요.', severity: 'error' });
      return;
    }

    try {
      const updatedArticles = allArticles.map(article => 
        article.id === editingArticle.id 
          ? {
              ...article,
              title: articleForm.title,
              summary: articleForm.summary,
              content: articleForm.content,
              category: articleForm.category,
              image: articleForm.image,
              status: articleForm.status,
              publishedAt: articleForm.publishType === 'immediate' ? article.publishedAt : articleForm.publishedAt
            }
          : article
      );

      onUpdateArticles(updatedArticles);
      setSnackbar({ open: true, message: '기사가 성공적으로 수정되었습니다!', severity: 'success' });
      setArticleDialog(false);
      resetArticleForm();
    } catch (error) {
      console.error('Error updating article:', error);
      setSnackbar({ open: true, message: '기사 수정 중 오류가 발생했습니다.', severity: 'error' });
    }
  };

  const handleDeleteArticle = (articleId) => {
    onDeleteArticle(articleId);
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
      </Grid>

      {/* 기사 목록 테이블 */}
      <Card sx={{ borderRadius: '16px' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold">
              📰 기사 관리 ({allArticles.length}개)
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
                  <TableCell><strong>발행일</strong></TableCell>
                  <TableCell><strong>상태</strong></TableCell>
                  <TableCell><strong>작업</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allArticles.slice(0, 10).map((article) => (
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
          
          {allArticles.length > 10 && (
            <Box textAlign="center" sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                총 {allArticles.length}개 기사 중 10개만 표시됩니다.
              </Typography>
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
                    {editableCategories.map((category) => (
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
    </Box>
  );
};

export default ArticleManagement; 