// Member Management Component

import React, { useState, useEffect } from 'react';
import {
  Typography, Grid, Box, Card, CardContent, Button, TextField, 
  Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton,
  FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
  Alert, LinearProgress
} from '@mui/material';
import {
  People, Edit, Delete, Save, Cancel, Warning, CheckCircle,
  Visibility, Book
} from '@mui/icons-material';
import { ActionButton } from './DashboardStyles';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

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
  getAllUsers,
  updateUserRole,
  deleteUser,
  setSnackbar 
}) => {
  // 회원 관리 상태
  const [memberDialog, setMemberDialog] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [roleChangeDialog, setRoleChangeDialog] = useState({ open: false, member: null, newRole: '' });
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userActivity, setUserActivity] = useState({});
  const [memberForm, setMemberForm] = useState({
    name: '',
    email: '',
    role: 'User',
    status: 'active'
  });

  // 회원 폼 초기화
  const resetMemberForm = () => {
    setMemberForm({
      name: '',
      email: '',
      role: 'User',
      status: 'active'
    });
    setEditingMember(null);
  };

  // 사용자 활동 데이터 계산
  const calculateUserActivity = async (userList) => {
    const activityData = {};
    
    for (const user of userList) {
      try {
        // 사용자별 데이터 수집
        const userDataRef = collection(db, 'users', user.id, 'data');
        const userDataSnap = await getDocs(userDataRef);
        
        let savedWords = 0;
        let likedArticles = 0;
        let viewRecords = 0;
        let lastActivity = user.createdAt;
        
        userDataSnap.docs.forEach(doc => {
          const data = doc.data();
          if (doc.id === 'savedWords' && data.words) {
            savedWords = data.words.length;
          }
          if (doc.id === 'likedArticles' && data.articles) {
            likedArticles = data.articles.length;
          }
          if (doc.id === 'viewRecords' && data.records) {
            viewRecords = data.records.length;
            // 최근 활동 시간 찾기
            const latestView = data.records.reduce((latest, record) => {
              const recordDate = new Date(record.viewedAt);
              return recordDate > latest ? recordDate : latest;
            }, new Date(user.createdAt));
            lastActivity = latestView;
          }
        });

        // 활동 점수 계산 (0-100)
        const activityScore = Math.min(100, 
          (viewRecords * 2) + (savedWords * 1.5) + (likedArticles * 3)
        );
        
        // 참여 수준 결정
        const engagementLevel = activityScore > 50 ? 'high' : 
                              activityScore > 20 ? 'medium' : 'low';
        
        // 가입 후 경과 일수
        const daysSinceJoin = Math.floor(
          (new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)
        );
        
        // 마지막 활동 후 경과 일수
        const daysSinceLastActivity = Math.floor(
          (new Date() - lastActivity) / (1000 * 60 * 60 * 24)
        );

        activityData[user.id] = {
          savedWords,
          likedArticles,
          viewRecords,
          activityScore: Math.round(activityScore),
          engagementLevel,
          daysSinceJoin,
          daysSinceLastActivity,
          lastActivity,
          isActive: daysSinceLastActivity < 7,
          learningRate: daysSinceJoin > 0 ? (savedWords / daysSinceJoin).toFixed(1) : 0
        };
        
      } catch (error) {
        console.error(`사용자 ${user.id} 활동 데이터 로딩 실패:`, error);
        activityData[user.id] = {
          savedWords: 0,
          likedArticles: 0,
          viewRecords: 0,
          activityScore: 0,
          engagementLevel: 'low',
          daysSinceJoin: 0,
          daysSinceLastActivity: 999,
          lastActivity: new Date(user.createdAt),
          isActive: false,
          learningRate: 0
        };
      }
    }
    
    setUserActivity(activityData);
  };

  // 사용자 목록 로드
  const loadMembers = async () => {
    setLoading(true);
    try {
      const userList = await getAllUsers();
      setMembers(userList);
      await calculateUserActivity(userList);
    } catch (error) {
      console.error('회원 목록 로딩 실패:', error);
      setSnackbar({ open: true, message: '회원 목록을 불러오는데 실패했습니다.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 사용자 목록 로드
  useEffect(() => {
    loadMembers();
  }, []);

  // 새 회원 추가 (실제로는 Firebase에서 사용자가 등록되므로 이 기능은 사용되지 않음)
  const handleAddMember = () => {
    setSnackbar({ 
      open: true, 
      message: '회원은 실제 가입 과정을 통해서만 추가할 수 있습니다.', 
      severity: 'info' 
    });
    setMemberDialog(false);
    resetMemberForm();
  };

  // 회원 편집
  const handleEditMember = (member) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name,
      email: member.email,
      role: member.role || 'User'
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
  const confirmRoleChange = async () => {
    const { member, newRole } = roleChangeDialog;
    
    try {
      const success = await updateUserRole(member.id, newRole);
      
      if (success) {
        // 로컬 상태 업데이트
        setMembers(prev => prev.map(m => 
          m.id === member.id ? { ...m, role: newRole } : m
        ));
        
        setSnackbar({ 
          open: true, 
          message: `${member.name}님의 권한이 ${newRole}으로 변경되었습니다.`, 
          severity: 'success' 
        });
        
        setRoleChangeDialog({ open: false, member: null, newRole: '' });
      } else {
        setSnackbar({ open: true, message: '권한 변경 중 오류가 발생했습니다.', severity: 'error' });
      }
    } catch (error) {
      console.error('Error changing role:', error);
      setSnackbar({ open: true, message: '권한 변경 중 오류가 발생했습니다.', severity: 'error' });
    }
  };

  // 회원 정보 업데이트
  const handleUpdateMember = async () => {
    if (!memberForm.name.trim() || !memberForm.email.trim()) {
      setSnackbar({ open: true, message: '이름과 이메일을 입력해주세요.', severity: 'error' });
      return;
    }

    try {
      // Firebase의 실제 사용자 데이터 업데이트는 제한적이므로 role만 업데이트
      if (editingMember.role !== memberForm.role) {
        const success = await updateUserRole(editingMember.id, memberForm.role);
        if (success) {
          // 로컬 상태 업데이트
          setMembers(prev => prev.map(m => 
            m.id === editingMember.id ? { ...m, role: memberForm.role } : m
          ));
          setSnackbar({ open: true, message: `${editingMember.name}님의 권한이 ${memberForm.role}으로 변경되었습니다.`, severity: 'success' });
        } else {
          setSnackbar({ open: true, message: '권한 변경 중 오류가 발생했습니다.', severity: 'error' });
          return;
        }
      }
      
      setMemberDialog(false);
      resetMemberForm();
    } catch (error) {
      console.error('Error updating member:', error);
      setSnackbar({ open: true, message: '회원 정보 수정 중 오류가 발생했습니다.', severity: 'error' });
    }
  };

  // 회원 삭제
  const handleDeleteMember = async (memberId) => {
    try {
      const success = await deleteUser(memberId);
      
      if (success) {
        // 로컬 상태에서 제거
        setMembers(prev => prev.filter(m => m.id !== memberId));
        setSnackbar({ open: true, message: '회원이 삭제되었습니다.', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: '회원 삭제 중 오류가 발생했습니다.', severity: 'error' });
      }
    } catch (error) {
      console.error('Error deleting member:', error);
      setSnackbar({ open: true, message: '회원 삭제 중 오류가 발생했습니다.', severity: 'error' });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ py: 4 }}>
        <Typography>회원 목록을 불러오는 중...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* 회원 활동 통계 요약 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, borderRadius: '12px', bgcolor: '#f8f9fa' }}>
            <Typography variant="h6" fontWeight="bold" color="success.main">
              {Object.values(userActivity).filter(activity => activity.isActive).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              활성 사용자 (7일 내)
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, borderRadius: '12px', bgcolor: '#f8f9fa' }}>
            <Typography variant="h6" fontWeight="bold" color="primary">
              {Object.values(userActivity).length > 0 ? 
                Math.round(Object.values(userActivity).reduce((sum, activity) => sum + activity.activityScore, 0) / Object.values(userActivity).length)
                : 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              평균 활동 점수
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, borderRadius: '12px', bgcolor: '#f8f9fa' }}>
            <Typography variant="h6" fontWeight="bold" color="warning.main">
              {Object.values(userActivity).filter(activity => activity.engagementLevel === 'high').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              고참여 사용자
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, borderRadius: '12px', bgcolor: '#f8f9fa' }}>
            <Typography variant="h6" fontWeight="bold" color="info.main">
              {Object.values(userActivity).length > 0 ? 
                Math.round(Object.values(userActivity).reduce((sum, activity) => sum + activity.savedWords, 0) / Object.values(userActivity).length)
                : 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              회원당 평균 저장 단어
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* 액션 버튼 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <ActionButton onClick={loadMembers}>
            <People fontSize="large" />
            <Typography variant="h6" sx={{ mt: 1 }}>회원 목록 새로고침</Typography>
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
                  <TableCell><strong>활동 점수</strong></TableCell>
                  <TableCell><strong>학습 데이터</strong></TableCell>
                  <TableCell><strong>참여도</strong></TableCell>
                  <TableCell><strong>가입일</strong></TableCell>
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
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h6" fontWeight="bold" 
                          color={
                            (userActivity[member.id]?.activityScore || 0) > 50 ? 'success.main' :
                            (userActivity[member.id]?.activityScore || 0) > 20 ? 'warning.main' : 'text.secondary'
                          }>
                          {userActivity[member.id]?.activityScore || 0}
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={userActivity[member.id]?.activityScore || 0}
                          sx={{ width: 50, height: 6, borderRadius: 3 }}
                          color={
                            (userActivity[member.id]?.activityScore || 0) > 50 ? 'success' :
                            (userActivity[member.id]?.activityScore || 0) > 20 ? 'warning' : 'inherit'
                          }
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Visibility fontSize="small" />
                          {userActivity[member.id]?.viewRecords || 0}회 조회
                        </Typography>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Book fontSize="small" />
                          {userActivity[member.id]?.savedWords || 0}단어 저장
                        </Typography>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          ❤️ {userActivity[member.id]?.likedArticles || 0}개 좋아요
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Chip 
                          label={userActivity[member.id]?.engagementLevel || 'low'}
                          color={
                            userActivity[member.id]?.engagementLevel === 'high' ? 'success' :
                            userActivity[member.id]?.engagementLevel === 'medium' ? 'warning' : 'default'
                          }
                          size="small"
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          {userActivity[member.id]?.isActive ? '🟢 활성' : '🔴 비활성'}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {userActivity[member.id]?.daysSinceLastActivity}일 전 활동
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {member.createdAt ? new Date(member.createdAt.toDate?.() || member.createdAt).toLocaleDateString() : '-'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {userActivity[member.id]?.daysSinceJoin || 0}일 경과
                      </Typography>
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
                        {plan.name} {plan.price > 0 && `(₩${(plan.price || 0).toLocaleString()}/월)`}
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
 