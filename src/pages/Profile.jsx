import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  AppBar, Toolbar, Typography, IconButton, InputBase, Tabs, Tab, Box, 
  Card, CardContent, Avatar, Button, LinearProgress, Grid, Paper,
  List, ListItem, ListItemText, ListItemIcon, Chip
} from '@mui/material';
import { 
  Search as SearchIcon, Person,
  TrendingUp, MenuBook, Favorite, CalendarToday, School,
  Star, EmojiEvents, LocalFireDepartment, Edit
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import AuthGuard from '../components/AuthGuard';

const navigationTabs = ['Home', 'Date', 'Wordbook', 'Like', 'Profile'];

const Profile = () => {
  const navigate = useNavigate();
  const [navTab, setNavTab] = useState(4); // Profile 탭 활성화

  // 사용자 데이터 (실제로는 API에서 가져옴)
  const userData = {
    name: "John Doe",
    email: "john@example.com",
    joinDate: "2024-01-15",
    totalWordsLearned: 1,
    articlesRead: 47,
    consecutiveDays: 12,
    totalReadingTime: 245, // 분
    currentLevel: "Intermediate",
    favoriteCategory: "Technology"
  };

  // 최근 학습 활동
  const recentActivity = [
    {
      type: "article",
      title: "AI Revolution in Healthcare",
      date: "Jun-25-24",
      wordsLearned: 8
    },
    {
      type: "vocabulary",
      title: "15 new words added to wordbook",
      date: "Jun-24-24",
      wordsLearned: 15
    },
    {
      type: "achievement",
      title: "Completed 10 articles milestone!",
      date: "Jun-23-24",
      wordsLearned: 0
    }
  ];

  // 학습 목표 및 진행률
  const goals = {
    dailyWords: { current: 5, target: 10 },
    weeklyArticles: { current: 3, target: 7 },
    monthlyGoal: { current: 187, target: 300 }
  };

  // 레벨별 진행률 (현재 Intermediate)
  const levelProgress = {
    current: 67, // 67% 완료
    wordsNeeded: 98, // 다음 레벨까지 필요한 단어 수
    totalWords: 300 // 다음 레벨 달성에 필요한 총 단어 수
  };

  // 카테고리별 학습 통계
  const categoryStats = [
    { name: 'Technology', articles: 18, words: 245, percentage: 38 },
    { name: 'Science', articles: 12, words: 189, percentage: 25 },
    { name: 'Business', articles: 10, words: 156, percentage: 21 },
    { name: 'Health', articles: 7, words: 98, percentage: 16 }
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'article': return <MenuBook color="primary" />;
      case 'vocabulary': return <School color="success" />;
      case 'achievement': return <EmojiEvents color="warning" />;
      default: return <Star />;
    }
  };

  const formatReadingTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <AuthGuard feature="your profile">
      {/* 상단바 */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold', color: '#23408e' }}>
            MarLang Eng News
          </Typography>
          <InputBase
            placeholder="Search articles..."
            startAdornment={<SearchIcon sx={{ mr: 1 }} />}
            sx={{ background: '#f5f5f5', borderRadius: 2, px: 2, mr: 2 }}
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

      {/* 프로필 내용 */}
      <Container>
        {/* 프로필 헤더 */}
        <ProfileHeader>
          <UserInfo>
            <Avatar 
              sx={{ width: 80, height: 80, mr: 3, bgcolor: '#1976d2' }}
            >
              {userData.name.charAt(0)}
            </Avatar>
            <UserDetails>
              <UserName>
                {userData.name}
                <IconButton size="small" sx={{ ml: 1 }}>
                  <Edit />
                </IconButton>
              </UserName>
              <UserEmail>{userData.email}</UserEmail>
              <UserStats>
                <StatBadge>
                  <LocalFireDepartment sx={{ mr: 0.5, fontSize: '1rem' }} />
                  {userData.consecutiveDays} days streak
                </StatBadge>
                <StatBadge>
                  <School sx={{ mr: 0.5, fontSize: '1rem' }} />
                  {userData.currentLevel}
                </StatBadge>
              </UserStats>
            </UserDetails>
          </UserInfo>
          <LevelProgress>
            <LevelCard>
              <Typography variant="h6" gutterBottom>Level Progress</Typography>
              <LinearProgress 
                variant="determinate" 
                value={levelProgress.current} 
                sx={{ height: 8, borderRadius: 4, mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                {levelProgress.wordsNeeded} more words to Advanced level
              </Typography>
            </LevelCard>
          </LevelProgress>
        </ProfileHeader>

        {/* 통계 카드들 */}
        <StatsGrid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard>
              <StatIcon>📚</StatIcon>
              <StatContent>
                <StatNumber>{userData.totalWordsLearned}</StatNumber>
                <StatLabel>Words Learned</StatLabel>
              </StatContent>
            </StatCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard>
              <StatIcon>📰</StatIcon>
              <StatContent>
                <StatNumber>{userData.articlesRead}</StatNumber>
                <StatLabel>Articles Read</StatLabel>
              </StatContent>
            </StatCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard>
              <StatIcon>⏱️</StatIcon>
              <StatContent>
                <StatNumber>{formatReadingTime(userData.totalReadingTime)}</StatNumber>
                <StatLabel>Reading Time</StatLabel>
              </StatContent>
            </StatCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard>
              <StatIcon>🎯</StatIcon>
              <StatContent>
                <StatNumber>{userData.favoriteCategory}</StatNumber>
                <StatLabel>Favorite Topic</StatLabel>
              </StatContent>
            </StatCard>
          </Grid>
        </StatsGrid>

        {/* 목표 및 활동 */}
        <ContentGrid container spacing={3}>
          {/* 학습 목표 */}
          <Grid item xs={12} md={6}>
            <SectionCard>
              <CardContent>
                <SectionTitle>
                  <TrendingUp sx={{ mr: 1 }} />
                  Learning Goals
                </SectionTitle>
                <GoalsList>
                  <GoalItem>
                    <GoalInfo>
                      <GoalName>Daily Words</GoalName>
                      <GoalNumbers>{goals.dailyWords.current}/{goals.dailyWords.target}</GoalNumbers>
                    </GoalInfo>
                    <LinearProgress 
                      variant="determinate" 
                      value={(goals.dailyWords.current / goals.dailyWords.target) * 100}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </GoalItem>
                  <GoalItem>
                    <GoalInfo>
                      <GoalName>Weekly Articles</GoalName>
                      <GoalNumbers>{goals.weeklyArticles.current}/{goals.weeklyArticles.target}</GoalNumbers>
                    </GoalInfo>
                    <LinearProgress 
                      variant="determinate" 
                      value={(goals.weeklyArticles.current / goals.weeklyArticles.target) * 100}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </GoalItem>
                  <GoalItem>
                    <GoalInfo>
                      <GoalName>Monthly Words</GoalName>
                      <GoalNumbers>{goals.monthlyGoal.current}/{goals.monthlyGoal.target}</GoalNumbers>
                    </GoalInfo>
                    <LinearProgress 
                      variant="determinate" 
                      value={(goals.monthlyGoal.current / goals.monthlyGoal.target) * 100}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </GoalItem>
                </GoalsList>
              </CardContent>
            </SectionCard>
          </Grid>

          {/* 최근 활동 */}
          <Grid item xs={12} md={6}>
            <SectionCard>
              <CardContent>
                <SectionTitle>
                  <CalendarToday sx={{ mr: 1 }} />
                  Recent Activity
                </SectionTitle>
                <List>
                  {recentActivity.map((activity, index) => (
                    <ActivityItem key={index}>
                      <ListItemIcon>
                        {getActivityIcon(activity.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.title}
                        secondary={activity.date}
                      />
                      {activity.wordsLearned > 0 && (
                        <ActivityBadge>
                          +{activity.wordsLearned} words
                        </ActivityBadge>
                      )}
                    </ActivityItem>
                  ))}
                </List>
              </CardContent>
            </SectionCard>
          </Grid>

          {/* 카테고리별 통계 */}
          <Grid item xs={12}>
            <SectionCard>
              <CardContent>
                <SectionTitle>
                  <MenuBook sx={{ mr: 1 }} />
                  Learning by Category
                </SectionTitle>
                <CategoryGrid>
                  {categoryStats.map((category) => (
                    <CategoryCard key={category.name}>
                      <CategoryName>{category.name}</CategoryName>
                      <CategoryStats>
                        <CategoryStat>{category.articles} articles</CategoryStat>
                        <CategoryStat>{category.words} words</CategoryStat>
                      </CategoryStats>
                      <LinearProgress 
                        variant="determinate" 
                        value={category.percentage}
                        sx={{ height: 4, borderRadius: 2, mt: 1 }}
                      />
                    </CategoryCard>
                  ))}
                </CategoryGrid>
              </CardContent>
            </SectionCard>
          </Grid>
        </ContentGrid>
      </Container>
    </AuthGuard>
  );
};

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const ProfileHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 2rem;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
`;

const UserDetails = styled.div``;

const UserName = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
`;

const UserEmail = styled.p`
  color: #666;
  margin: 0 0 1rem 0;
`;

const UserStats = styled.div`
  display: flex;
  gap: 1rem;
`;

const StatBadge = styled.div`
  display: flex;
  align-items: center;
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
`;

const LevelProgress = styled.div`
  min-width: 250px;
`;

const LevelCard = styled(Card)`
  padding: 1rem;
`;

const StatsGrid = styled(Grid)`
  margin-bottom: 2rem;
`;

const StatCard = styled(Card)`
  padding: 1.5rem;
  display: flex;
  align-items: center;
  height: 100px;
`;

const StatIcon = styled.div`
  font-size: 2rem;
  margin-right: 1rem;
`;

const StatContent = styled.div``;

const StatNumber = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #1976d2;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.25rem;
`;

const ContentGrid = styled(Grid)``;

const SectionCard = styled(Card)`
  height: 100%;
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: #333;
`;

const GoalsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const GoalItem = styled.div``;

const GoalInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const GoalName = styled.div`
  font-weight: 500;
`;

const GoalNumbers = styled.div`
  color: #1976d2;
  font-weight: bold;
`;

const ActivityItem = styled(ListItem)`
  padding: 0.5rem 0;
`;

const ActivityBadge = styled(Chip)`
  background: #e8f5e8 !important;
  color: #2e7d32 !important;
  font-size: 0.75rem !important;
`;

const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
`;

const CategoryCard = styled.div`
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
`;

const CategoryName = styled.div`
  font-weight: bold;
  margin-bottom: 0.5rem;
`;

const CategoryStats = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
`;

const CategoryStat = styled.div`
  font-size: 0.9rem;
  color: #666;
`;

export default Profile; 