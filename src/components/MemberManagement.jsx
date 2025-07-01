// Member Management Component

import React, { useState } from 'react';
import {
  Typography, Grid, Box, Card, CardContent, Button, TextField, 
  Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton,
  FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
  Alert
} from '@mui/material';
import {
  People, PersonAdd, Edit, Delete, Save, Cancel, Warning, CheckCircle
} from '@mui/icons-material';
import { ActionButton } from './DashboardStyles';

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

const MemberManagement = ({ 
  getMembers,
  setSnackbar 
}) => {
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

  // 회원 폼 초기화
  const resetMemberForm = () => {
    setMemberForm({
      name: '',
      email: '',
      role: 'User',
      status: 'active',
      subscriptionPlan: 'Free',
      subscriptionStatus: 'active',
      subscriptionExpiry: '',
      monthlyArticleLimit: 10,
      monthlyWordLimit: 50,
      hasAITranslation: false,
      hasOfflineAccess: false,
      hasPrioritySupport: false
    });
    setEditingMember(null);
  };

  // 새 회원 추가
  const handleAddMember = () => {
    if (!memberForm.name.trim() || !memberForm.email.trim()) {
      setSnackbar({ open: true, message: '이름과 이메일을 입력해주세요.', severity: 'error' });
      return;
    }

    try {
      const newMember = {
        id: 'admin_' + Date.now(),
        name: memberForm.name.trim(),
        email: memberForm.email.trim(),
        role: memberForm.role,
        status: memberForm.status,
        joinDate: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        likedArticles: [],
        savedWords: [],
        readArticles: 0,
        subscriptionPlan: memberForm.subscriptionPlan,
        subscriptionStatus: memberForm.subscriptionStatus,
        subscriptionExpiry: memberForm.subscriptionExpiry,
        monthlyArticleLimit: memberForm.monthlyArticleLimit,
        monthlyWordLimit: memberForm.monthlyWordLimit,
        hasAITranslation: memberForm.hasAITranslation,
        hasOfflineAccess: memberForm.hasOfflineAccess,
        hasPrioritySupport: memberForm.hasPrioritySupport
      };

      localStorage.setItem(`marlang_user_${newMember.id}`, JSON.stringify(newMember));
      
      setSnackbar({ open: true, message: `${newMember.name}님이 추가되었습니다!`, severity: 'success' });
      setMemberDialog(false);
      resetMemberForm();
    } catch (error) {
      console.error('Error adding member:', error);
      setSnackbar({ open: true, message: '회원 추가 중 오류가 발생했습니다.', severity: 'error' });
    }
  };

  // 회원 편집
  const handleEditMember = (member) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name,
      email: member.email,
      role: member.role || 'User',
      status: member.status || 'active',
      subscriptionPlan: member.subscriptionPlan || 'Free',
      subscriptionStatus: member.subscriptionStatus || 'active',
      subscriptionExpiry: member.subscriptionExpiry || '',
      monthlyArticleLimit: member.monthlyArticleLimit || 10,
      monthlyWordLimit: member.monthlyWordLimit || 50,
      hasAITranslation: member.hasAITranslation || false,
      hasOfflineAccess: member.hasOfflineAccess || false,
      hasPrioritySupport: member.hasPrioritySupport || false
    });
    setMemberDialog(true);
  };

  // 구독 플랜 변경 시 자동 설정
  const handleSubscriptionPlanChange = (planName) => {
    const plan = SUBSCRIPTION_PLANS[planName];
    setMemberForm({
      ...memberForm,
      subscriptionPlan: planName,
      monthlyArticleLimit: plan.monthlyArticleLimit,
      monthlyWordLimit: plan.monthlyWordLimit,
      hasAITranslation: plan.hasAITranslation,
      hasOfflineAccess: plan.hasOfflineAccess,
      hasPrioritySupport: plan.hasPrioritySupport
    });
  };

  // 권한 변경 요청
  const handleRoleChangeRequest = (member, newRole) => {
    if (member.role === newRole) {
      setSnackbar({ open: true, message: '이미 동일한 권한입니다.', severity: 'info' });
      return;
    }
    
    setRoleChangeDialog({
      open: true,
      member: member,
      newRole: newRole
    });
  };

  // 권한 변경 확정
  const confirmRoleChange = () => {
    const { member, newRole } = roleChangeDialog;
    
    try {
      const updatedMember = {
        ...member,
        role: newRole,
        lastModified: new Date().toISOString()
      };

      localStorage.setItem(`marlang_user_${member.id}`, JSON.stringify(updatedMember));
      
      setSnackbar({ 
        open: true, 
        message: `${member.name}님의 권한이 ${newRole}으로 변경되었습니다.`, 
        severity: 'success' 
      });
      
      setRoleChangeDialog({ open: false, member: null, newRole: '' });
    } catch (error) {
      console.error('Error changing role:', error);
      setSnackbar({ open: true, message: '권한 변경 중 오류가 발생했습니다.', severity: 'error' });
    }
  };

  // 회원 정보 업데이트
  const handleUpdateMember = () => {
    if (!memberForm.name.trim() || !memberForm.email.trim()) {
      setSnackbar({ open: true, message: '이름과 이메일을 입력해주세요.', severity: 'error' });
      return;
    }

    try {
      const updatedMember = {
        ...editingMember,
        name: memberForm.name.trim(),
        email: memberForm.email.trim(),
        role: memberForm.role,
        status: memberForm.status,
        subscriptionPlan: memberForm.subscriptionPlan,
        subscriptionStatus: memberForm.subscriptionStatus,
        subscriptionExpiry: memberForm.subscriptionExpiry,
        monthlyArticleLimit: memberForm.monthlyArticleLimit,
        monthlyWordLimit: memberForm.monthlyWordLimit,
        hasAITranslation: memberForm.hasAITranslation,
        hasOfflineAccess: memberForm.hasOfflineAccess,
        hasPrioritySupport: memberForm.hasPrioritySupport,
        lastModified: new Date().toISOString()
      };

      localStorage.setItem(`marlang_user_${editingMember.id}`, JSON.stringify(updatedMember));
      
      setSnackbar({ open: true, message: `${updatedMember.name}님의 정보가 수정되었습니다!`, severity: 'success' });
      setMemberDialog(false);
      resetMemberForm();
    } catch (error) {
      console.error('Error updating member:', error);
      setSnackbar({ open: true, message: '회원 정보 수정 중 오류가 발생했습니다.', severity: 'error' });
    }
  };

  // 회원 삭제
  const handleDeleteMember = (memberId) => {
    try {
      localStorage.removeItem(`marlang_user_${memberId}`);
      localStorage.removeItem(`marlang_liked_articles_${memberId}`);
      localStorage.removeItem(`marlang_saved_words_${memberId}`);
      setSnackbar({ open: true, message: '회원이 삭제되었습니다.', severity: 'success' });
    } catch (error) {
      console.error('Error deleting member:', error);
      setSnackbar({ open: true, message: '회원 삭제 중 오류가 발생했습니다.', severity: 'error' });
    }
  };

  const members = getMembers();

  return (
    <Box>
      {/* 액션 버튼 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <ActionButton onClick={() => { resetMemberForm(); setMemberDialog(true); }}>
            <PersonAdd fontSize="large" />
            <Typography variant="h6" sx={{ mt: 1 }}>새 회원 추가</Typography>
          </ActionButton>
        </Grid>
      </Grid>

      {/* 회원 목록 테이블 */}
      <Card sx={{ borderRadius: '16px' }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            👥 회원 관리 ({members.length}명)
          </Typography>
          
          <TableContainer component={Paper} sx={{ borderRadius: '12px' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                  <TableCell><strong>회원 정보</strong></TableCell>
                  <TableCell><strong>권한</strong></TableCell>
                  <TableCell><strong>구독</strong></TableCell>
                  <TableCell><strong>활동</strong></TableCell>
                  <TableCell><strong>가입일</strong></TableCell>
                  <TableCell><strong>상태</strong></TableCell>
                  <TableCell><strong>작업</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {member.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {member.email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={member.role || 'User'}
                        color={
                          member.role === 'super_admin' ? 'error' : 
                          member.role === 'admin' ? 'warning' : 
                          'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Chip 
                          label={member.subscriptionPlan || 'Free'}
                          color={SUBSCRIPTION_PLANS[member.subscriptionPlan || 'Free'].color}
                          size="small"
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          {member.subscriptionStatus || 'active'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          📖 {member.readArticles}개
                        </Typography>
                        <Typography variant="body2">
                          📝 {member.savedWords.length}단어
                        </Typography>
                        <Typography variant="body2">
                          ❤️ {member.likedArticles.length}개
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(member.joinDate).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={member.status || 'active'}
                        color={member.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditMember(member)}
                          color="primary"
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteMember(member.id)}
                          color="error"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {members.length === 0 && (
            <Box textAlign="center" sx={{ py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                등록된 회원이 없습니다
              </Typography>
              <Typography variant="body2" color="text.secondary">
                새 회원을 추가해보세요
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

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
    </Box>
  );
};

export default MemberManagement;
