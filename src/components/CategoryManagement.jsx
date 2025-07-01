import React, { useState } from 'react';
import {
  Typography, Grid, Box, Card, CardContent, Button, TextField, 
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  List, ListItem, ListItemText, ListItemIcon, Chip, Alert
} from '@mui/material';
import {
  Category, Add, Edit, Delete, Save, Cancel, DragIndicator,
  ArrowUpward, ArrowDownward
} from '@mui/icons-material';
import { ActionButton, CategoryManagementCard } from './DashboardStyles';

const CategoryManagement = ({ 
  allEditableCategories,
  onUpdateCategories,
  setSnackbar 
}) => {
  // 카테고리 관리 상태
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [editingCategoryIndex, setEditingCategoryIndex] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  // 편집 가능한 카테고리 목록 (기존 호환성 유지)
  const editableCategories = allEditableCategories
    .filter(cat => cat.type === 'category')
    .map(cat => cat.name);

  // 새 카테고리 추가
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      setSnackbar({ open: true, message: '카테고리 이름을 입력해주세요.', severity: 'error' });
      return;
    }

    // 중복 확인
    if (editableCategories.includes(newCategoryName.trim())) {
      setSnackbar({ open: true, message: '이미 존재하는 카테고리입니다.', severity: 'error' });
      return;
    }

    try {
      const newCategory = {
        id: newCategoryName.toLowerCase().replace(/\s+/g, '_'),
        name: newCategoryName.trim(),
        type: 'category'
      };

      const updatedCategories = [...allEditableCategories, newCategory];
      onUpdateCategories(updatedCategories);
      
      setSnackbar({ open: true, message: `"${newCategoryName}" 카테고리가 추가되었습니다!`, severity: 'success' });
      setCategoryDialog(false);
      setNewCategoryName('');
    } catch (error) {
      console.error('Error adding category:', error);
      setSnackbar({ open: true, message: '카테고리 추가 중 오류가 발생했습니다.', severity: 'error' });
    }
  };

  // 카테고리 삭제
  const handleDeleteCategory = (categoryId) => {
    const categoryToDelete = allEditableCategories.find(cat => cat.id === categoryId);
    
    if (categoryToDelete && categoryToDelete.type === 'category') {
      const updatedCategories = allEditableCategories.filter(cat => cat.id !== categoryId);
      onUpdateCategories(updatedCategories);
      setSnackbar({ 
        open: true, 
        message: `"${categoryToDelete.name}" 카테고리가 삭제되었습니다.`, 
        severity: 'success' 
      });
    }
  };

  // 카테고리 순서 변경 (위로)
  const moveCategoryUp = (index) => {
    if (index > 0) {
      const newCategories = [...allEditableCategories];
      [newCategories[index], newCategories[index - 1]] = [newCategories[index - 1], newCategories[index]];
      onUpdateCategories(newCategories);
    }
  };

  // 카테고리 순서 변경 (아래로)
  const moveCategoryDown = (index) => {
    if (index < allEditableCategories.length - 1) {
      const newCategories = [...allEditableCategories];
      [newCategories[index], newCategories[index + 1]] = [newCategories[index + 1], newCategories[index]];
      onUpdateCategories(newCategories);
    }
  };

  // 카테고리 이름 편집 시작
  const handleEditCategoryName = (index) => {
    setEditingCategoryIndex(index);
    setEditingCategoryName(allEditableCategories[index].name);
  };

  // 카테고리 이름 저장
  const handleSaveCategoryName = () => {
    if (!editingCategoryName.trim()) {
      setSnackbar({ open: true, message: '카테고리 이름을 입력해주세요.', severity: 'error' });
      return;
    }

    // 중복 확인 (자기 자신 제외)
    const isDuplicate = allEditableCategories.some((cat, index) => 
      index !== editingCategoryIndex && 
      cat.name === editingCategoryName.trim() && 
      cat.type === 'category'
    );

    if (isDuplicate) {
      setSnackbar({ open: true, message: '이미 존재하는 카테고리 이름입니다.', severity: 'error' });
      return;
    }

    try {
      const updatedCategories = allEditableCategories.map((category, index) => 
        index === editingCategoryIndex 
          ? { 
              ...category, 
              name: editingCategoryName.trim(),
              id: editingCategoryName.toLowerCase().replace(/\s+/g, '_')
            }
          : category
      );

      onUpdateCategories(updatedCategories);
      setSnackbar({ 
        open: true, 
        message: `카테고리가 "${editingCategoryName}"으로 수정되었습니다!`, 
        severity: 'success' 
      });
      handleCancelEdit();
    } catch (error) {
      console.error('Error updating category:', error);
      setSnackbar({ open: true, message: '카테고리 수정 중 오류가 발생했습니다.', severity: 'error' });
    }
  };

  // 편집 취소
  const handleCancelEdit = () => {
    setEditingCategoryIndex(null);
    setEditingCategoryName('');
  };

  return (
    <Box>
      {/* 액션 버튼 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <ActionButton onClick={() => setCategoryDialog(true)}>
            <Add fontSize="large" />
            <Typography variant="h6" sx={{ mt: 1 }}>새 카테고리</Typography>
          </ActionButton>
        </Grid>
      </Grid>

      {/* 카테고리 목록 */}
      <Card sx={{ borderRadius: '16px', mb: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            📂 카테고리 관리 ({allEditableCategories.length}개)
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            💡 카테고리 순서를 변경하거나 이름을 수정할 수 있습니다. 
            홈페이지에서도 동일한 순서로 표시됩니다.
          </Alert>

          <Grid container spacing={2}>
            {allEditableCategories.map((category, index) => (
              <Grid item xs={12} sm={6} md={4} key={category.id}>
                <CategoryManagementCard>
                  <CardContent sx={{ p: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Chip 
                        label={category.type === 'recent' ? '최신' : 
                              category.type === 'popular' ? '인기' : '카테고리'}
                        size="small"
                        color={category.type === 'category' ? 'primary' : 'default'}
                      />
                      <Box display="flex" gap={1}>
                        <IconButton 
                          size="small" 
                          onClick={() => moveCategoryUp(index)}
                          disabled={index === 0}
                          color="primary"
                        >
                          <ArrowUpward fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => moveCategoryDown(index)}
                          disabled={index === allEditableCategories.length - 1}
                          color="primary"
                        >
                          <ArrowDownward fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    {editingCategoryIndex === index ? (
                      <Box>
                        <TextField
                          fullWidth
                          value={editingCategoryName}
                          onChange={(e) => setEditingCategoryName(e.target.value)}
                          size="small"
                          sx={{ mb: 2 }}
                          autoFocus
                        />
                        <Box display="flex" gap={1}>
                          <Button 
                            size="small" 
                            onClick={handleSaveCategoryName}
                            variant="contained"
                            startIcon={<Save />}
                          >
                            저장
                          </Button>
                          <Button 
                            size="small" 
                            onClick={handleCancelEdit}
                            startIcon={<Cancel />}
                          >
                            취소
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {category.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          ID: {category.id}
                        </Typography>
                        <Box display="flex" gap={1}>
                          {category.type === 'category' && (
                            <>
                              <IconButton 
                                size="small" 
                                onClick={() => handleEditCategoryName(index)}
                                color="primary"
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={() => handleDeleteCategory(category.id)}
                                color="error"
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </>
                          )}
                          {category.type !== 'category' && (
                            <Typography variant="caption" color="text.secondary">
                              시스템 카테고리 (편집 불가)
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </CategoryManagementCard>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* 카테고리 추가 다이얼로그 */}
      <Dialog open={categoryDialog} onClose={() => setCategoryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h5" fontWeight="bold">
            📂 새 카테고리 추가
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            💡 새로운 카테고리를 추가하면 홈페이지와 기사 작성 시 선택할 수 있습니다.
          </Alert>
          <TextField
            fullWidth
            label="카테고리 이름 *"
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
    </Box>
  );
};

export default CategoryManagement; 