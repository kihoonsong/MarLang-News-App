import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  AppBar, Toolbar, Typography, IconButton, Button, Card, CardContent,
  Grid, Box, Chip, Avatar, LinearProgress, Badge
} from '@mui/material';
import {
  Dashboard as DashboardIcon, Article, People, Visibility,
  TrendingUp, ExitToApp, Add, Refresh
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SimpleDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // 실시간 통계 데이터
  const [stats, setStats] = useState({
    totalArticles: 234,
    totalUsers: 1567,
    totalViews: 45678,
    activeUsers: 89,
    lastUpdate: new Date().toLocaleTimeString()
  });

  // 5초마다 실시간 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 6) - 3,
        totalViews: prev.totalViews + Math.floor(Math.random() * 10),
        lastUpdate: new Date().toLocaleTimeString()
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

  // 임시로 인증 체크 비활성화 (테스트용)
  if (!isAuthenticated && false) {
    return (
      <Container>
        <Typography variant="h4" gutterBottom>Dashboard Access</Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          로그인이 필요합니다. 테스트를 위해 게스트 로그인을 하세요.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={() => navigate('/login')}>
            로그인 페이지로
          </Button>
          <Button variant="outlined" onClick={() => navigate('/')}>
            홈으로 돌아가기
          </Button>
        </Box>
        <Typography variant="caption" sx={{ mt: 2, display: 'block' }}>
          홈페이지에서 "게스트로 시작하기"를 클릭한 후 다시 시도하세요.
        </Typography>
      </Container>
    );
  }

  return (
    <DashboardContainer>
      <AppBar position="static" sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Toolbar>
          <DashboardIcon sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            MarLang Dashboard
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Badge badgeContent={stats.activeUsers} color="success">
              <Typography variant="caption">Active: {stats.lastUpdate}</Typography>
            </Badge>
            
            <Avatar src={user?.picture} sx={{ width: 32, height: 32 }} />
            
            <IconButton color="inherit" onClick={handleLogout}>
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
            Overview
          </SidebarItem>
          <SidebarItem 
            $active={activeTab === 'articles'}
            onClick={() => setActiveTab('articles')}
          >
            <Article sx={{ mr: 1 }} />
            Articles
          </SidebarItem>
          <SidebarItem 
            $active={activeTab === 'users'}
            onClick={() => setActiveTab('users')}
          >
            <People sx={{ mr: 1 }} />
            Users
          </SidebarItem>
        </Sidebar>

        <MainContent>
          <Typography variant="h4" gutterBottom>
            Dashboard Overview
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard>
                <Typography variant="h3" color="primary">
                  {stats.totalArticles}
                </Typography>
                <Typography variant="h6">Articles</Typography>
                <LinearProgress variant="determinate" value={75} sx={{ mt: 1 }} />
              </StatCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <StatCard>
                <Typography variant="h3" color="primary">
                  {stats.totalUsers.toLocaleString()}
                </Typography>
                <Typography variant="h6">Users</Typography>
                <LinearProgress variant="determinate" value={60} sx={{ mt: 1 }} />
              </StatCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <StatCard>
                <Typography variant="h3" color="primary">
                  {stats.totalViews.toLocaleString()}
                </Typography>
                <Typography variant="h6">Views</Typography>
                <LinearProgress variant="determinate" value={85} sx={{ mt: 1 }} />
              </StatCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <StatCard>
                <Typography variant="h3" color="success.main">
                  {stats.activeUsers}
                </Typography>
                <Typography variant="h6">Active Now</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TrendingUp color="success" sx={{ mr: 0.5 }} />
                  <Typography variant="body2" color="success.main">
                    Live Updates
                  </Typography>
                </Box>
              </StatCard>
            </Grid>
          </Grid>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Real-time Activity
              </Typography>
              <Typography variant="body1">
                Dashboard is working! Real-time updates every 5 seconds.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last update: {stats.lastUpdate}
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Button variant="contained" startIcon={<Add />} sx={{ mr: 1 }}>
                  Add Article
                </Button>
                <Button variant="outlined" startIcon={<Refresh />}>
                  Refresh Data
                </Button>
              </Box>
            </CardContent>
          </Card>
        </MainContent>
      </Content>
    </DashboardContainer>
  );
};

const DashboardContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 1rem;
`;

const Content = styled.div`
  display: flex;
  min-height: calc(100vh - 64px);
`;

const Sidebar = styled.div`
  width: 250px;
  background: white;
  border-right: 1px solid #e0e0e0;
  padding: 1rem 0;
`;

const SidebarItem = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  cursor: pointer;
  background: ${props => props.$active ? '#e3f2fd' : 'transparent'};
  color: ${props => props.$active ? '#1976d2' : '#666'};
  font-weight: ${props => props.$active ? '600' : 'normal'};
  
  &:hover {
    background: #f5f5f5;
  }
`;

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
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

export default SimpleDashboard;