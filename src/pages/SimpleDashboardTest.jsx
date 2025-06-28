import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Card, CardContent,
  Grid, Box, Chip
} from '@mui/material';
import { Dashboard as DashboardIcon, ExitToApp } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useArticles } from '../contexts/ArticlesContext';

const SimpleDashboardTest = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  const { allArticles } = useArticles();

  if (!isAuthenticated) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column'
      }}>
        <Typography variant="h5" gutterBottom>
          로그인이 필요합니다
        </Typography>
        <Button variant="contained" onClick={() => navigate('/login')}>
          로그인하기
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* 상단 앱바 */}
      <AppBar position="static">
        <Toolbar>
          <DashboardIcon sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            테스트 대시보드
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">
              안녕하세요, {user?.name || '사용자'}님!
            </Typography>
            <Button color="inherit" onClick={() => signOut()}>
              <ExitToApp />
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 메인 컨텐츠 */}
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          🎯 대시보드 테스트
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary">
                  {allArticles ? allArticles.length : 0}
                </Typography>
                <Typography variant="body2">
                  총 기사 수
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="success.main">
                  ✅
                </Typography>
                <Typography variant="body2">
                  대시보드 정상 작동
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="warning.main">
                  🏷️
                </Typography>
                <Typography variant="body2">
                  카테고리 관리
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="error.main">
                  👥
                </Typography>
                <Typography variant="body2">
                  사용자 관리
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📊 시스템 정보
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip label={`사용자: ${user?.name || 'Unknown'}`} />
              <Chip label={`인증 상태: ${isAuthenticated ? '로그인됨' : '로그아웃됨'}`} />
              <Chip label={`기사 수: ${allArticles ? allArticles.length : 0}`} />
              <Chip label="테스트: 성공" color="success" />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🔧 테스트 액션
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button 
                variant="contained" 
                onClick={() => navigate('/')}
              >
                홈으로 이동
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => window.location.reload()}
              >
                페이지 새로고침
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => console.log('Articles:', allArticles)}
              >
                콘솔에 기사 정보 출력
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default SimpleDashboardTest;