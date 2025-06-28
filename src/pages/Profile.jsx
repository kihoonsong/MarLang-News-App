import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  AppBar, Toolbar, Typography, IconButton, InputBase, Tabs, Tab, Box, 
  Card, CardContent, Avatar, Button, Grid, Paper,
  List, ListItem, ListItemText, ListItemIcon, Chip, Divider
} from '@mui/material';
import { 
  Search as SearchIcon, Person, AccountCircle, Email, CalendarToday,
  TrendingUp, MenuBook, Favorite, School, Settings, Edit, ExitToApp
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthGuard from '../components/AuthGuard';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import AuthModal from '../components/AuthModal';
import SearchDropdown from '../components/SearchDropdown';

const navigationTabs = ['Home', 'Date', 'Wordbook', 'Like', 'Profile'];

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut, isAuthenticated, isModalOpen, setIsModalOpen } = useAuth();
  const [navTab, setNavTab] = useState(4); // Profile 탭 활성화

  const handleLogout = () => {
    signOut();
    navigate('/');
  };



  const formatJoinDate = (dateString) => {
    if (!dateString) return 'Recently';
    try {
      return new Date(dateString).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long'
      });
    } catch {
      return 'Recently';
    }
  };

  // 로컬 스토리지에서 사용자 활동 데이터 가져오기
  const getUserStats = () => {
    try {
      const savedWords = JSON.parse(localStorage.getItem('marlang_saved_words') || '[]');
      const likedArticles = JSON.parse(localStorage.getItem('marlang_liked_articles') || '[]');
      
      return {
        savedWordsCount: savedWords.length,
        likedArticlesCount: likedArticles.length
      };
    } catch {
      return {
        savedWordsCount: 0,
        likedArticlesCount: 0
      };
    }
  };

  const stats = getUserStats();

  // 비로그인 상태에서는 빈 화면 표시
  if (!isAuthenticated) {
    console.log('Profile: 비로그인 상태 감지, 빈 화면 표시');
    return (
      <AuthGuard feature="your profile">
        <MobileNavigation />
        <MobileContentWrapper>
          {/* 상단바 */}
          <AppBar position="static" color="default" elevation={1}>
            <Toolbar>
              <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold', color: '#23408e' }}>
                MarLang Eng News
              </Typography>
              <SearchDropdown placeholder="Search articles..." />
              <IconButton
                size="large"
                onClick={() => setIsModalOpen && setIsModalOpen(true)}
                color="inherit"
                sx={{ 
                  border: '1px solid #1976d2', 
                  borderRadius: 2,
                  padding: '6px 12px',
                  fontSize: '0.875rem'
                }}
              >
                <AccountCircleIcon sx={{ mr: 0.5 }} />
                Login
              </IconButton>
            </Toolbar>
          </AppBar>
          
          {/* 네비게이션 바 */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
            <Tabs value={navTab} onChange={(_, v) => setNavTab(v)}>
              {navigationTabs.map((nav, idx) => (
                <Tab 
                  key={nav} 
                  label={nav} 
                  onClick={() => {
                    setNavTab(idx);
                    switch(nav) {
                      case 'Home':
                        navigate('/');
                        break;
                      case 'Date':
                        navigate('/date');
                        break;
                      case 'Wordbook':
                        navigate('/wordbook');
                        break;
                      case 'Like':
                        navigate('/like');
                        break;
                      case 'Profile':
                        navigate('/profile');
                        break;
                      default:
                        break;
                    }
                  }}
                />
              ))}
            </Tabs>
          </Box>

          {/* Home 페이지 카테고리 탭과 동일한 높이 유지 */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, height: '48px' }}>
          </Box>

          {/* 빈 컨테이너 - 로그인 필요 메시지 */}
          <Container>
            <EmptyAuthState>
              <EmptyIcon>👤</EmptyIcon>
              <EmptyText>Please sign in to view your profile</EmptyText>
              <EmptySubtext>Track your learning progress and manage your account!</EmptySubtext>
            </EmptyAuthState>
          </Container>

          {/* 인증 모달 */}
          <AuthModal 
            open={isModalOpen || false} 
            onClose={() => setIsModalOpen && setIsModalOpen(false)} 
          />
        </MobileContentWrapper>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard feature="your profile">
      <MobileNavigation />
      <MobileContentWrapper>
        {/* 상단바 */}
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold', color: '#23408e' }}>
              MarLang Eng News
            </Typography>
            <InputBase
              placeholder="Search articles..."
              onClick={() => navigate('/search')}
              startAdornment={<SearchIcon sx={{ mr: 1 }} />}
              sx={{ background: '#f5f5f5', borderRadius: 2, px: 2, mr: 2, cursor: 'pointer' }}
            />
          </Toolbar>
        </AppBar>
        
        {/* 네비게이션 바 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs value={navTab} onChange={(_, v) => setNavTab(v)}>
            {navigationTabs.map((nav, idx) => (
              <Tab 
                key={nav} 
                label={nav} 
                onClick={() => {
                  setNavTab(idx);
                  switch(nav) {
                    case 'Home':
                      navigate('/');
                      break;
                    case 'Date':
                      navigate('/date');
                      break;
                    case 'Wordbook':
                      navigate('/wordbook');
                      break;
                    case 'Like':
                      navigate('/like');
                      break;
                    case 'Profile':
                      navigate('/profile');
                      break;
                    default:
                      break;
                  }
                }}
              />
            ))}
          </Tabs>
        </Box>

        {/* Home 페이지 카테고리 탭과 동일한 높이 유지 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, height: '48px' }}>
        </Box>

        {/* 프로필 내용 */}
        <Container>
          {/* 프로필 헤더 */}
          <ProfileCard>
            <CardContent sx={{ p: 3 }}>
              <ProfileHeader>
                <UserInfo>
                  <Avatar 
                    src={user?.picture}
                    sx={{ width: 80, height: 80, mr: 3, bgcolor: '#1976d2' }}
                  >
                    {user?.name?.charAt(0) || 'U'}
                  </Avatar>
                  <UserDetails>
                    <UserName>{user?.name || 'User'}</UserName>
                    <UserEmail>{user?.email || 'user@example.com'}</UserEmail>
                    <UserMeta>
                      <MetaItem>
                        <CalendarToday sx={{ fontSize: 16, mr: 0.5 }} />
                        Joined {formatJoinDate(user?.createdAt)}
                      </MetaItem>
                      <MetaItem>
                        <AccountCircle sx={{ fontSize: 16, mr: 0.5 }} />
                        {user?.provider === 'google' ? 'Google Account' : 
                         user?.provider === 'naver' ? 'Naver Account' : 
                         'Email Account'}
                      </MetaItem>
                    </UserMeta>
                  </UserDetails>
                </UserInfo>
              </ProfileHeader>
            </CardContent>
          </ProfileCard>

          {/* 통계 카드들 */}
          <StatsGrid container spacing={2}>
            <Grid item xs={6} sm={4}>
              <StatCard>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <StatIcon>📚</StatIcon>
                  <StatNumber>{stats.savedWordsCount}</StatNumber>
                  <StatLabel>Saved Words</StatLabel>
                </CardContent>
              </StatCard>
            </Grid>
            <Grid item xs={6} sm={4}>
              <StatCard>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <StatIcon>❤️</StatIcon>
                  <StatNumber>{stats.likedArticlesCount}</StatNumber>
                  <StatLabel>Liked Articles</StatLabel>
                </CardContent>
              </StatCard>
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <StatIcon>🎯</StatIcon>
                  <StatNumber>Learning</StatNumber>
                  <StatLabel>Status</StatLabel>
                </CardContent>
              </StatCard>
            </Grid>
          </StatsGrid>

          {/* 빠른 액션 */}
          <ActionsCard>
            <CardContent>
              <SectionTitle>Quick Actions</SectionTitle>
              <ActionsList>
                <ActionItem onClick={() => navigate('/wordbook')}>
                  <ActionIcon>
                    <MenuBook color="primary" />
                  </ActionIcon>
                  <ActionContent>
                    <ActionTitle>My Wordbook</ActionTitle>
                    <ActionSubtitle>Review saved words</ActionSubtitle>
                  </ActionContent>
                </ActionItem>
                
                <ActionItem onClick={() => navigate('/like')}>
                  <ActionIcon>
                    <Favorite color="error" />
                  </ActionIcon>
                  <ActionContent>
                    <ActionTitle>Liked Articles</ActionTitle>
                    <ActionSubtitle>Read saved articles</ActionSubtitle>
                  </ActionContent>
                </ActionItem>
                
                <ActionItem onClick={() => navigate('/settings')}>
                  <ActionIcon>
                    <Settings color="action" />
                  </ActionIcon>
                  <ActionContent>
                    <ActionTitle>Settings</ActionTitle>
                    <ActionSubtitle>App preferences</ActionSubtitle>
                  </ActionContent>
                </ActionItem>
              </ActionsList>
            </CardContent>
          </ActionsCard>

          {/* 계정 관리 */}
          <AccountCard>
            <CardContent>
              <SectionTitle>Account</SectionTitle>
              <AccountActions>
                <AccountButton 
                  variant="outlined" 
                  onClick={() => navigate('/settings')}
                  startIcon={<Settings />}
                >
                  Account Settings
                </AccountButton>
                <AccountButton 
                  variant="contained" 
                  color="error"
                  onClick={handleLogout}
                  startIcon={<ExitToApp />}
                >
                  Sign Out
                </AccountButton>
              </AccountActions>
            </CardContent>
          </AccountCard>
        </Container>

        {/* 인증 모달 */}
        <AuthModal 
          open={isModalOpen || false} 
          onClose={() => setIsModalOpen && setIsModalOpen(false)} 
        />
      </MobileContentWrapper>
    </AuthGuard>
  );
};

const Container = styled.div`
  padding: 0 1rem 2rem 1rem;
  
  @media (min-width: 768px) {
    padding: 0 2rem 2rem 2rem;
  }
  
  max-width: 1200px;
  margin: 0 auto;
`;

const ProfileCard = styled(Card)`
  margin-bottom: 2rem;
  border-radius: 16px !important;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08) !important;
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  
  @media (max-width: 600px) {
    flex-direction: column;
    text-align: center;
    
    & > div:first-child {
      margin-right: 0 !important;
      margin-bottom: 1rem;
    }
  }
`;

const UserDetails = styled.div`
  flex: 1;
`;

const UserName = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0 0 0.5rem 0;
  color: #333;
`;

const UserEmail = styled.p`
  color: #666;
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
`;

const UserMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  @media (max-width: 600px) {
    align-items: center;
  }
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  color: #888;
  font-size: 0.85rem;
`;

const StatsGrid = styled(Grid)`
  margin-bottom: 2rem;
`;

const StatCard = styled(Card)`
  border-radius: 12px !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const StatIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`;

const StatNumber = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #1976d2;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.85rem;
  color: #666;
`;

const ActionsCard = styled(Card)`
  margin-bottom: 2rem;
  border-radius: 16px !important;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08) !important;
`;

const SectionTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: bold;
  margin: 0 0 1.5rem 0;
  color: #333;
`;

const ActionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ActionItem = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
  border-radius: 12px;
  background: #f8f9fa;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #e9ecef;
  }
`;

const ActionIcon = styled.div`
  margin-right: 1rem;
`;

const ActionContent = styled.div`
  flex: 1;
`;

const ActionTitle = styled.div`
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const ActionSubtitle = styled.div`
  font-size: 0.85rem;
  color: #666;
`;

const AccountCard = styled(Card)`
  border-radius: 16px !important;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08) !important;
`;

const AccountActions = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const AccountButton = styled(Button)`
  flex: 1;
  min-width: 140px;
  padding: 12px 24px !important;
  border-radius: 8px !important;
  text-transform: none !important;
  font-weight: 500 !important;
`;

const EmptyAuthState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const EmptyText = styled.h3`
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
  color: #666;
`;

const EmptySubtext = styled.p`
  font-size: 1rem;
  color: #888;
  margin: 0;
`;

export default Profile; 