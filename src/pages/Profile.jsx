import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  AppBar, Toolbar, Typography, IconButton, Tabs, Tab, Box, Card, CardContent,
  Avatar, Menu, MenuItem, ListItemIcon, ListItemText, useMediaQuery, useTheme, Button, Grid
} from '@mui/material';
import { 
  AccountCircle, Settings, ExitToApp, Edit, MenuBook, Favorite
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthGuard from '../components/AuthGuard';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import AuthModal from '../components/AuthModal';
import SearchDropdown from '../components/SearchDropdown';
import PageContainer from '../components/PageContainer';

const navigationTabs = ['Home', 'Date', 'Wordbook', 'Like', 'Profile'];

const Profile = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, signOut, isAuthenticated, isModalOpen, setIsModalOpen } = useAuth();
  const [navTab, setNavTab] = useState(4); // Profile 탭 활성화
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
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
    return (
      <AuthGuard feature="your profile">
        <MobileNavigation />
        <MobileContentWrapper>
          {/* 상단바 - 데스크톱만 */}
          {!isMobile && (
            <AppBar position="static" color="default" elevation={1}>
              <Toolbar>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    flexGrow: 1, 
                    fontWeight: 'bold', 
                    color: '#23408e',
                    cursor: 'pointer',
                    '&:hover': {
                      color: '#1976d2'
                    }
                  }}
                  onClick={() => navigate('/')}
                >
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
                  <AccountCircle sx={{ mr: 0.5 }} />
                  Login
                </IconButton>
              </Toolbar>
            </AppBar>
          )}
          
          {/* 네비게이션 바 - 데스크톱만 */}
          {!isMobile && (
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
              <Tabs 
                value={navTab} 
                onChange={(_, v) => setNavTab(v)}
                sx={{
                  '& .MuiTab-root': {
                    minWidth: 'auto',
                    padding: '12px 16px'
                  }
                }}
              >
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
                          // 현재 페이지이므로 아무것도 하지 않음
                          break;
                        default:
                          break;
                      }
                    }}
                  />
                ))}
              </Tabs>
            </Box>
          )}

          {/* 빈 컨테이너 - 로그인 필요 메시지 */}
          <PageContainer>
            <EmptyAuthState>
              <EmptyIcon>👤</EmptyIcon>
              <EmptyText>Please sign in to view your profile</EmptyText>
              <EmptySubtext>Track your learning progress and manage your account!</EmptySubtext>
            </EmptyAuthState>
          </PageContainer>

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
        {/* 상단바 - 데스크톱만 */}
        {!isMobile && (
          <AppBar position="static" color="default" elevation={1}>
            <Toolbar>
              <Typography 
                variant="h6" 
                sx={{ 
                  flexGrow: 1, 
                  fontWeight: 'bold', 
                  color: '#23408e',
                  cursor: 'pointer',
                  '&:hover': {
                    color: '#1976d2'
                  }
                }}
                onClick={() => navigate('/')}
              >
                MarLang Eng News
              </Typography>
              <SearchDropdown placeholder="Search articles..." />
              
              {/* 사용자 프로필 메뉴 */}
              <IconButton
                size="large"
                onClick={handleUserMenuOpen}
                color="inherit"
              >
                <Avatar 
                  src={user?.picture} 
                  alt={user?.name}
                  sx={{ width: 32, height: 32 }}
                >
                  {!user?.picture && <AccountCircle />}
                </Avatar>
              </IconButton>
              
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleUserMenuClose}
                onClick={handleUserMenuClose}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                    mt: 1.5,
                    '& .MuiAvatar-root': {
                      width: 32,
                      height: 32,
                      ml: -0.5,
                      mr: 1,
                    },
                    '&:before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 0,
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={() => navigate('/profile')}>
                  <ListItemIcon>
                    <Avatar src={user?.picture} sx={{ width: 24, height: 24 }}>
                      <AccountCircle fontSize="small" />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {user?.name || 'Guest User'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user?.email || 'guest@marlang.com'}
                    </Typography>
                  </ListItemText>
                </MenuItem>
                
                <MenuItem onClick={() => navigate('/settings')}>
                  <ListItemIcon>
                    <Settings fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Settings</ListItemText>
                </MenuItem>
                
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <ExitToApp fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Logout</ListItemText>
                </MenuItem>
              </Menu>
            </Toolbar>
          </AppBar>
        )}
        
        {/* 네비게이션 바 - 데스크톱만 */}
        {!isMobile && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
            <Tabs 
              value={navTab} 
              onChange={(_, v) => setNavTab(v)}
              sx={{
                '& .MuiTab-root': {
                  minWidth: 'auto',
                  padding: '12px 16px'
                }
              }}
            >
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
                        // 현재 페이지이므로 아무것도 하지 않음
                        break;
                      default:
                        break;
                    }
                  }}
                />
              ))}
            </Tabs>
          </Box>
        )}

        {/* 프로필 내용 */}
        <PageContainer>
          <ProfileHeader>
            <ProfileImageSection>
              <ProfileAvatar 
                src={user?.picture} 
                alt={user?.name}
              >
                {!user?.picture && <AccountCircle sx={{ fontSize: 60 }} />}
              </ProfileAvatar>
              <EditButton>
                <Edit sx={{ fontSize: 18 }} />
              </EditButton>
            </ProfileImageSection>
            
            <ProfileInfo>
              <UserName>{user?.name || 'Guest User'}</UserName>
              <UserEmail>{user?.email || 'guest@marlang.com'}</UserEmail>
              <UserStats>
                <StatItem>
                  <StatNumber>{stats.savedWordsCount}</StatNumber>
                  <StatLabel>Saved Words</StatLabel>
                </StatItem>
                <StatItem>
                  <StatNumber>{stats.likedArticlesCount}</StatNumber>
                  <StatLabel>Liked Articles</StatLabel>
                </StatItem>
                <StatItem>
                  <StatNumber>42</StatNumber>
                  <StatLabel>Days Active</StatLabel>
                </StatItem>
              </UserStats>
            </ProfileInfo>
          </ProfileHeader>

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
        </PageContainer>

        {/* 인증 모달 */}
        <AuthModal 
          open={isModalOpen || false} 
          onClose={() => setIsModalOpen && setIsModalOpen(false)} 
        />
      </MobileContentWrapper>
    </AuthGuard>
  );
};

// 스타일 컴포넌트들
const ProfileHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 2rem;
  
  @media (min-width: 768px) {
    flex-direction: row;
    text-align: left;
  }
`;

const ProfileImageSection = styled.div`
  position: relative;
  margin-bottom: 1rem;
  
  @media (min-width: 768px) {
    margin-bottom: 0;
    margin-right: 2rem;
  }
`;

const ProfileAvatar = styled(Avatar)`
  width: 120px !important;
  height: 120px !important;
  border: 4px solid #fff;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
`;

const EditButton = styled.button`
  position: absolute;
  bottom: 0;
  right: 0;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  
  &:hover {
    background: #1565c0;
  }
`;

const ProfileInfo = styled.div`
  flex: 1;
`;

const UserName = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  margin: 0 0 0.5rem 0;
  color: #333;
`;

const UserEmail = styled.p`
  color: #666;
  margin: 0 0 1.5rem 0;
  font-size: 1.1rem;
`;

const UserStats = styled.div`
  display: flex;
  gap: 2rem;
  justify-content: center;
  
  @media (min-width: 768px) {
    justify-content: flex-start;
  }
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #1976d2;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
`;

const StatsGrid = styled(Grid)`
  margin-bottom: 2rem !important;
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
  flex-direction: column;
  
  @media (min-width: 768px) {
    flex-direction: row;
  }
`;

const AccountButton = styled(Button)`
  flex: 1;
`;

const EmptyAuthState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
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