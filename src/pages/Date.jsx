import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  Typography, Box, Chip, IconButton, Card, CardContent, 
  CardMedia, Select, MenuItem, FormControl, InputLabel,
  useMediaQuery, useTheme, Grid, Badge, AppBar, Toolbar, 
  InputBase, Tabs, Tab, Avatar, Menu, ListItemIcon, 
  ListItemText
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate } from 'react-router-dom';
import { useArticles } from '../contexts/ArticlesContext';
import { useAuth } from '../contexts/AuthContext';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';

const categories = ['All', 'Technology', 'Science', 'Business', 'Health', 'Culture'];
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const navigationTabs = ['Home', 'Date', 'Wordbook', 'Like', 'Profile', 'Dashboard'];

// 날짜별로 기사를 그룹핑하는 함수
const groupArticlesByDate = (articles) => {
  const grouped = {};
  articles.forEach(article => {
    const date = new Date(article.publishedAt);
    const dateStr = date.toISOString().split('T')[0];
    if (!grouped[dateStr]) {
      grouped[dateStr] = [];
    }
    grouped[dateStr].push(article);
  });
  return grouped;
};

const DatePage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, isAuthenticated, signOut } = useAuth() || {};
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentArticles, setCurrentArticles] = useState([]);
  const [navTab, setNavTab] = useState(1); // Date 탭이 선택된 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  
  // 기사 데이터 가져오기
  const { 
    allArticles, 
    loading: articlesLoading, 
    getArticlesByDate 
  } = useArticles();
  const [articlesByDate, setArticlesByDate] = useState({});
  

  // 기사 데이터가 로드되면 날짜별로 그룹핑
  useEffect(() => {
    if (!articlesLoading && allArticles && allArticles.length > 0) {
      const grouped = getArticlesByDate();
      setArticlesByDate(grouped);
      
      // 기사가 있는 가장 최근 날짜를 기본 선택
      const dates = Object.keys(grouped).sort().reverse();
      if (dates.length > 0) {
        setSelectedDate(dates[0]);
        setCurrentArticles(grouped[dates[0]]);
      }
    }
  }, [articlesLoading, allArticles, getArticlesByDate]);
  
  // 선택된 날짜의 기사 필터링
  useEffect(() => {
    if (selectedDate && articlesByDate[selectedDate]) {
      let filtered = articlesByDate[selectedDate];
      if (selectedCategory !== 'All') {
        filtered = filtered.filter(article => article.category === selectedCategory);
      }
      setCurrentArticles(filtered);
    }
  }, [selectedDate, selectedCategory, articlesByDate]);
  
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };
  
  const formatDateKey = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };
  
  const hasArticles = (dateKey) => {
    return articlesByDate[dateKey] && articlesByDate[dateKey].length > 0;
  };
  
  const handleDateClick = (dateKey) => {
    if (hasArticles(dateKey)) {
      setSelectedDate(dateKey);
    }
  };
  
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };
  
  const isWeekend = (dayOfWeek) => {
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  };
  
  const isToday = (year, month, day) => {
    const today = new Date();
    return today.getFullYear() === year && 
           today.getMonth() === month && 
           today.getDate() === day;
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    
    const calendarDays = [];
    
    // 빈 셀 (이전 달)
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(
        <CalendarDay key={`empty-${i}`} $isEmpty>
          {/* Empty cell */}
        </CalendarDay>
      );
    }
    
    // 실제 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(year, month, day);
      const dayOfWeek = new Date(year, month, day).getDay();
      const hasData = hasArticles(dateKey);
      const isSelected = dateKey === selectedDate;
      const isCurrentDay = isToday(year, month, day);
      const weekend = isWeekend(dayOfWeek);
      
      calendarDays.push(
        <CalendarDay 
          key={day}
          $hasArticles={hasData}
          $isSelected={isSelected}
          $isClickable={hasData}
          $isWeekend={weekend}
          $isToday={isCurrentDay}
          onClick={() => handleDateClick(dateKey)}
        >
          <DayNumber $isWeekend={weekend} $isToday={isCurrentDay}>
            {day}
          </DayNumber>
          {hasData && (
            <Badge 
              badgeContent={articlesByDate[dateKey]?.length || 0} 
              color="primary" 
              sx={{ 
                position: 'absolute', 
                bottom: 4, 
                right: 4,
                '& .MuiBadge-badge': {
                  fontSize: '0.6rem',
                  height: '14px',
                  minWidth: '14px'
                }
              }}
            >
              <ArticleDot $isSelected={isSelected} />
            </Badge>
          )}
        </CalendarDay>
      );
    }
    
    return calendarDays;
  };
  
  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  // 네비게이션 바 관련 함수들
  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    signOut();
    handleUserMenuClose();
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <>
      <MobileNavigation />
      <MobileContentWrapper>
        {/* 상단바 - 항상 표시 */}
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold', color: '#23408e' }}>
              MarLang Eng News
            </Typography>
            <InputBase
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              onClick={() => navigate('/search')}
              startAdornment={<SearchIcon sx={{ mr: 1 }} />}
              sx={{ background: '#f5f5f5', borderRadius: 2, px: 2, mr: 2, cursor: 'pointer' }}
            />
            
            {/* 사용자 프로필 메뉴 또는 로그인 버튼 */}
            {isAuthenticated ? (
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
                  {!user?.picture && <AccountCircleIcon />}
                </Avatar>
              </IconButton>
            ) : (
              <IconButton
                size="large"
                onClick={handleLoginClick}
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
            )}
            
            {isAuthenticated && (
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
                      <AccountCircleIcon fontSize="small" />
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
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Settings</ListItemText>
                </MenuItem>
                
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Logout</ListItemText>
                </MenuItem>
              </Menu>
            )}
          </Toolbar>
        </AppBar>
        
        {/* 네비게이션 바 - 데스크톱만 */}
        {!isMobile && (
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
                        // 현재 페이지이므로 아무것도 하지 않음
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
                      case 'Dashboard':
                        navigate('/dashboard');
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
        
        {/* Home과 높이 맞추기 위한 빈 공간 */}
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider', 
          px: 2, 
          height: '64px',
          display: 'flex',
          alignItems: 'center'
        }}>
          {/* 빈 공간 - Home의 카테고리 탭과 동일한 높이 */}
        </Box>

        <Container>
          {/* 헤더 */}
          <Header>
            <HeaderContent>
              <CalendarTodayIcon sx={{ mr: 1, fontSize: '2rem', color: '#1976d2' }} />
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                News Calendar
              </Typography>
            </HeaderContent>
            <Typography variant="body1" color="text.secondary">
              Browse articles by publication date
            </Typography>
          </Header>

          {/* 로딩 상태 표시 */}
          {articlesLoading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography>Loading articles...</Typography>
            </Box>
          )}

          {/* 달력 섹션 */}
          <CalendarSection>
            <CalendarHeader>
              <IconButton onClick={() => navigateMonth(-1)}>
                <ArrowBackIcon />
              </IconButton>
              <MonthYearDisplay>
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </MonthYearDisplay>
              <IconButton onClick={() => navigateMonth(1)}>
                <ArrowForwardIcon />
              </IconButton>
            </CalendarHeader>
            
            <DayLabels>
              {dayNames.map((day, index) => (
                <DayLabel key={day} $isWeekend={isWeekend(index)}>
                  {day}
                </DayLabel>
              ))}
            </DayLabels>
            
            <CalendarGrid>
              {renderCalendar()}
            </CalendarGrid>
          </CalendarSection>

          {/* 선택된 날짜의 기사들 */}
          {selectedDate && (
            <ArticlesSection>
              <ArticlesHeader>
                <div>
                  <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {formatDisplayDate(selectedDate)}
                  </Typography>
                  <Chip 
                    label={`${currentArticles.length} articles`} 
                    color="primary" 
                    size="small" 
                  />
                </div>
                
                <FilterContainer>
                  <FilterListIcon sx={{ mr: 1, color: '#666' }} />
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={selectedCategory}
                      label="Category"
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      {categories.map(category => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </FilterContainer>
              </ArticlesHeader>

              {currentArticles.length > 0 ? (
                <Grid container spacing={3}>
                  {currentArticles.map(article => (
                    <Grid item xs={12} sm={6} md={4} key={article.id}>
                      <NewsCard onClick={() => navigate(`/article/${article.id}`)}>
                        <CardMedia
                          component="img"
                          height="200"
                          image={article.image}
                          alt={article.title}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80';
                          }}
                        />
                        <CardContent>
                          <CategoryChip>
                            {article.category}
                          </CategoryChip>
                          <Typography variant="h6" component="h3" sx={{ 
                            fontWeight: 'bold', 
                            mb: 1,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {article.title}
                          </Typography>
                          {article.summary && (
                            <Typography variant="body2" color="text.secondary" sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                              {article.summary}
                            </Typography>
                          )}
                          <ArticleFooter>
                            {article.level && (
                              <LevelBadge $level={article.level}>
                                {article.level}
                              </LevelBadge>
                            )}
                            {article.readingTime && (
                              <Typography variant="caption" color="text.secondary">
                                {article.readingTime} min read
                              </Typography>
                            )}
                          </ArticleFooter>
                        </CardContent>
                      </NewsCard>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <EmptyState>
                  <Typography variant="h6" color="text.secondary">
                    No articles found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedCategory !== 'All' 
                      ? `No ${selectedCategory} articles for this date`
                      : 'No articles available for this date'
                    }
                  </Typography>
                </EmptyState>
              )}
            </ArticlesSection>
          )}
        </Container>
      </MobileContentWrapper>
    </>
  );
};

const Container = styled.div`
  padding: 0 1rem 2rem 1rem;
  
  @media (min-width: 768px) {
    padding: 0 2rem 2rem 2rem;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem 0;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
`;

const CalendarSection = styled(Card)`
  margin-bottom: 2rem;
  padding: 1.5rem;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  
  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const CalendarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
`;

const MonthYearDisplay = styled(Typography)`
  font-weight: bold !important;
  font-size: 1.5rem !important;
  color: #1976d2 !important;
  
  @media (min-width: 768px) {
    font-size: 1.8rem !important;
  }
`;

const DayLabels = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
  margin-bottom: 0.5rem;
`;

const DayLabel = styled.div`
  text-align: center;
  font-weight: 600;
  padding: 0.75rem 0.5rem;
  font-size: 0.875rem;
  color: ${props => props.$isWeekend ? '#1976d2' : '#666'};
  
  @media (min-width: 768px) {
    padding: 1rem;
    font-size: 1rem;
  }
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
  
  @media (min-width: 768px) {
    gap: 0.5rem;
  }
`;

const CalendarDay = styled.div`
  position: relative;
  min-height: 60px;
  border-radius: 12px;
  cursor: ${props => props.$isClickable ? 'pointer' : 'default'};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  background: ${props => {
    if (props.$isEmpty) return 'transparent';
    if (props.$isSelected) return '#1976d2';
    if (props.$isToday) return '#e8f5e9';
    if (props.$hasArticles) return '#f3f4f6';
    return 'transparent';
  }};
  
  border: ${props => {
    if (props.$isToday) return '2px solid #4caf50';
    if (props.$hasArticles) return '2px solid #e0e7ff';
    return '2px solid transparent';
  }};
  
  &:hover {
    ${props => props.$isClickable && `
      background: ${props.$isSelected ? '#1565c0' : '#e3f2fd'};
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `}
  }
  
  @media (min-width: 768px) {
    min-height: 80px;
  }
`;

const DayNumber = styled.div`
  font-weight: ${props => props.$isToday ? 'bold' : '500'};
  font-size: 1rem;
  color: ${props => {
    if (props.$isToday) return '#4caf50';
    if (props.$isWeekend) return '#1976d2';
    return '#333';
  }};
  
  @media (min-width: 768px) {
    font-size: 1.125rem;
  }
`;

const ArticleDot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${props => props.$isSelected ? 'white' : '#1976d2'};
`;

const ArticlesSection = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
  padding: 1.5rem;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  
  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const ArticlesHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
  
  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const NewsCard = styled(Card)`
  cursor: pointer;
  transition: all 0.3s ease;
  height: 100%;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
  }
`;

const CategoryChip = styled(Chip)`
  margin-bottom: 0.75rem !important;
  background: #e3f2fd !important;
  color: #1976d2 !important;
  font-size: 0.75rem !important;
  font-weight: 500 !important;
`;

const ArticleFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f0f0f0;
`;

const LevelBadge = styled.span`
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${props => {
    switch (props.$level) {
      case 'Beginner': return '#e8f5e8';
      case 'Intermediate': return '#fff3e0';
      case 'Advanced': return '#ffebee';
      default: return '#f5f5f5';
    }
  }};
  color: ${props => {
    switch (props.$level) {
      case 'Beginner': return '#2e7d32';
      case 'Intermediate': return '#ef6c00';
      case 'Advanced': return '#c62828';
      default: return '#757575';
    }
  }};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #666;
  max-width: 1200px;
  margin: 0 auto;
`;

export default DatePage;