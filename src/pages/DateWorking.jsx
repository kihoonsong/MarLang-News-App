import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  AppBar, Toolbar, Typography, InputBase, Tabs, Tab, Box, 
  IconButton, Avatar, Menu, MenuItem, ListItemIcon, ListItemText,
  useMediaQuery, useTheme, Chip,
  Select, FormControl, InputLabel
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useArticles } from '../contexts/ArticlesContext';
// import { useToast } from '../components/ToastProvider';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';

const navigationTabs = ['Home', 'Date', 'Wordbook', 'Like', 'Profile', 'Dashboard'];
const categories = ['All', 'Technology', 'Science', 'Business', 'Health', 'Culture'];
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];


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

const DateWorking = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth() || {};
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  // const toast = useToast(); // 필요시 사용
  
  // Use shared articles context
  const { 
    loading: articlesLoading, 
    getArticlesByDate, 
    getArticlesForDate,
    allArticles 
  } = useArticles();
  
  const [navTab, setNavTab] = useState(1); // Date 탭 활성화
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentArticles, setCurrentArticles] = useState([]);
  const [articlesByDate, setArticlesByDate] = useState({});

  // 컴포넌트 마운트 시 실제 데이터 설정
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
    return dayOfWeek === 0 || dayOfWeek === 6;
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
        <CalendarDay key={`empty-${i}`} />
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
            <ArticleDot $isSelected={isSelected}>
              <span>{articlesByDate[dateKey]?.length || 0}</span>
            </ArticleDot>
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

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <>
      {/* 모바일 네비게이션 */}
      <MobileNavigation />
      
      <MobileContentWrapper>
        {/* 상단바 - 데스크톱만 표시 */}
        {!isMobile && (
          <AppBar position="static" color="default" elevation={1}>
            <Toolbar>
              <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold', color: '#23408e' }}>
                MarLang Eng News
              </Typography>
              <InputBase
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
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
                  slotProps={{
                    paper: {
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
                    }
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
        )}
        
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

        {/* 달력 헤더 */}
        <SectionTitle>
          <CalendarTodayIcon sx={{ mr: 1 }} />
          News Calendar
          {!articlesLoading && allArticles && (
            <Chip 
              label={`${allArticles.length} total articles`} 
              size="small" 
              sx={{ ml: 2 }} 
            />
          )}
        </SectionTitle>

        {/* 로딩 상태 표시 */}
        {articlesLoading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>Loading articles...</Typography>
          </Box>
        )}

        {/* 달력 섹션 */}
        <CalendarContainer>
          <CalendarHeader>
            <IconButton onClick={() => navigateMonth(-1)} size="small">
              <ArrowBackIcon />
            </IconButton>
            <MonthYearDisplay>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </MonthYearDisplay>
            <IconButton onClick={() => navigateMonth(1)} size="small">
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
        </CalendarContainer>

        {/* 선택된 날짜의 기사들 */}
        {selectedDate && (
          <>
            <ArticleHeader>
              <div>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {formatDisplayDate(selectedDate)}
                </Typography>
                <Chip 
                  label={`${currentArticles.length} articles`} 
                  size="small" 
                />
              </div>
              
              <FilterContainer>
                <FilterListIcon sx={{ mr: 1, color: '#666', fontSize: '1.2rem' }} />
                <FormControl size="small" sx={{ minWidth: 120 }}>
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
            </ArticleHeader>

            {/* 카드형 뉴스 그리드 */}
            <ArticleGrid>
              {currentArticles.map(article => (
                <NewsCard key={article.id} {...article} navigate={navigate} />
              ))}
              {currentArticles.length === 0 && (
                <Empty>
                  <Typography variant="h6" color="text.secondary">
                    No articles found
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {selectedCategory !== 'All' 
                      ? `No ${selectedCategory} articles for this date`
                      : 'No articles available for this date'
                    }
                  </Typography>
                </Empty>
              )}
            </ArticleGrid>
          </>
        )}
      </MobileContentWrapper>
    </>
  );
};

// Home과 동일한 스타일 적용
const SectionTitle = styled.h2`
  font-size: 1.3rem;
  font-weight: bold;
  margin: 2rem 0 1rem 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CalendarContainer = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  margin: 0 2rem 2rem 2rem;
  padding: 2rem;
`;

const CalendarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
`;

const MonthYearDisplay = styled.div`
  font-weight: bold;
  font-size: 1.5rem;
  color: #1976d2;
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
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
`;

const CalendarDay = styled.div`
  position: relative;
  min-height: 70px;
  border-radius: 12px;
  cursor: ${props => props.$isClickable ? 'pointer' : 'default'};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  background: ${props => {
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
`;

const DayNumber = styled.div`
  font-weight: ${props => props.$isToday ? 'bold' : '500'};
  font-size: 1rem;
  color: ${props => {
    if (props.$isToday) return '#4caf50';
    if (props.$isWeekend) return '#1976d2';
    return '#333';
  }};
`;

const ArticleDot = styled.div`
  position: absolute;
  bottom: 6px;
  right: 6px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: ${props => props.$isSelected ? 'white' : '#1976d2'};
  color: ${props => props.$isSelected ? '#1976d2' : 'white'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: bold;
`;

const ArticleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin: 0 2rem 1rem 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ArticleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
  padding: 0 2rem 2rem 2rem;
`;

const Empty = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  grid-column: 1 / -1;
`;

// Home과 동일한 NewsCard 컴포넌트
const NewsCard = ({ id, image, title, category, level, readingTime, summary, publishedAt, source, navigate }) => {
  const handleClick = () => {
    navigate(`/article/${id}`);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recent';
    }
  };

  // const getLevelColor = (level) => {
  //   switch (level) {
  //     case 'Beginner': return '#4caf50';
  //     case 'Intermediate': return '#ff9800';
  //     case 'Advanced': return '#f44336';
  //     default: return '#757575';
  //   }
  // };

  return (
    <CardBox onClick={handleClick}>
      <Thumb 
        src={image} 
        alt={title}
        onError={(e) => {
          e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80';
        }}
      />
      <CardContent>
        <CardHeader>
          <CategoryChip>{category}</CategoryChip>
          <MetaInfo>
            {readingTime && <ReadingTime>{readingTime} min read</ReadingTime>}
          </MetaInfo>
        </CardHeader>
        
        <CardTitle>{title}</CardTitle>
        
        {summary && (
          <CardSummary>
            {summary.length > 120 ? `${summary.substring(0, 120)}...` : summary}
          </CardSummary>
        )}
        
        <CardFooter>
          <FooterLeft>
            {level && (
              <LevelBadge $level={level}>
                {level}
              </LevelBadge>
            )}
            <PublishDate>{formatDate(publishedAt)}</PublishDate>
          </FooterLeft>
          {source && (
            <Source>{source}</Source>
          )}
        </CardFooter>
      </CardContent>
    </CardBox>
  );
};

const CardBox = styled.div`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s;
  cursor: pointer;
  &:hover {
    box-shadow: 0 4px 24px rgba(0,0,0,0.13);
  }
`;

const Thumb = styled.img`
  width: 100%;
  height: 180px;
  object-fit: cover;
`;

const CardContent = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const CategoryChip = styled.span`
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const MetaInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ReadingTime = styled.span`
  font-size: 0.75rem;
  color: #757575;
`;

const CardTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: bold;
  margin: 0 0 0.75rem 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardSummary = styled.p`
  font-size: 0.9rem;
  color: #666;
  line-height: 1.5;
  margin: 0 0 1rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 0.5rem;
`;

const FooterLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LevelBadge = styled.span`
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
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

const PublishDate = styled.span`
  font-size: 0.75rem;
  color: #999;
`;

const Source = styled.span`
  font-size: 0.75rem;
  color: #1976d2;
  font-weight: 500;
`;

export default DateWorking;