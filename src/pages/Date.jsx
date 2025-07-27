import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  Typography, Box, Chip, IconButton, Card, CardContent, 
  CardMedia, Select, MenuItem, FormControl, InputLabel,
  useMediaQuery, useTheme, Grid
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useNavigate } from 'react-router-dom';
import { useArticles } from '../contexts/ArticlesContext';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import PageContainer from '../components/PageContainer';
import ArticleCard from '../components/ArticleCard';
import HorizontalArticleScroll from '../components/HorizontalArticleScroll';
import CompactCalendarBar from '../components/CompactCalendarBar';
import CalendarBottomSheet from '../components/CalendarBottomSheet';

const categories = ['All', 'Technology', 'Science', 'Business', 'Health', 'Culture'];
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// 날짜별로 기사를 그룹핑하는 함수 (로컬 시간 기준)
const groupArticlesByDate = (articles) => {
  if (!Array.isArray(articles)) return {};
  
  const grouped = {};
  articles.forEach(article => {
    if (!article || !article.publishedAt) return;
    
    try {
      const date = new Date(article.publishedAt);
      if (isNaN(date.getTime())) return; // 유효하지 않은 날짜 건너뛰기
      
      // 로컬 시간 기준으로 날짜 문자열 생성 (UTC 변환 문제 해결)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      if (!grouped[dateStr]) {
        grouped[dateStr] = [];
      }
      grouped[dateStr].push(article);
    } catch (error) {
      console.warn('날짜 파싱 오류:', article.publishedAt, error);
    }
  });
  return grouped;
};

const DatePage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentArticles, setCurrentArticles] = useState([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  
  // 기사 데이터 가져오기
  const { 
    allArticles, 
    loading: articlesLoading
  } = useArticles();
  const [articlesByDate, setArticlesByDate] = useState({});

  // 기사 데이터가 로드되면 날짜별로 그룹핑 (published 기사만)
  useEffect(() => {
    if (!articlesLoading && Array.isArray(allArticles) && allArticles.length > 0) {
      // published 상태인 기사만 필터링 (scheduled 기사 제외)
      const publishedArticles = allArticles.filter(article => {
        const isPublished = article.status === 'published';
        
        // 추가 안전장치: scheduled 상태면 무조건 제외
        if (article.status === 'scheduled') {
          console.log('🚫 예약 기사 제외 (Date 페이지):', article.title, article.status);
          return false;
        }
        
        // 애드센스 정책 준수: 유효한 콘텐츠만 포함
        const hasValidContent = article && 
          article.title && 
          (article.content || article.summary || article.description);
        
        return isPublished && hasValidContent;
      });
      
      const grouped = groupArticlesByDate(publishedArticles);
      setArticlesByDate(grouped);
      
      // 기사가 있는 가장 최근 날짜를 기본 선택
      const dates = Object.keys(grouped || {}).sort().reverse();
      if (dates.length > 0) {
        setSelectedDate(dates[0]);
        setCurrentArticles(grouped[dates[0]]);
      }
    }
  }, [articlesLoading, allArticles]);
  
  // 선택된 날짜의 기사 필터링 (안전한 버전)
  useEffect(() => {
    if (selectedDate && articlesByDate[selectedDate] && Array.isArray(articlesByDate[selectedDate])) {
      let filtered = articlesByDate[selectedDate];
      if (selectedCategory !== 'All') {
        filtered = (filtered || []).filter(article => article && article.category === selectedCategory);
      }
      setCurrentArticles(filtered || []);
    } else {
      setCurrentArticles([]);
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
      const weekend = isWeekend(dayOfWeek);
      
      calendarDays.push(
        <CalendarDay 
          key={day}
          $hasArticles={hasData}
          $isSelected={isSelected}
          $isClickable={hasData}
          $isWeekend={weekend}
          onClick={() => handleDateClick(dateKey)}
        >
          <DayNumber 
            $isWeekend={weekend}
            $isSunday={dayOfWeek === 0}
          >
            {day}
          </DayNumber>
          {hasData && (
            <Box sx={{ position: 'absolute', bottom: 4, left: 0, right: 0, textAlign: 'center' }}>
              <Box
                sx={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isSelected ? '#f57c00' : '#1976d2',
                  display: 'inline-block'
                }}
              />
            </Box>
          )}
        </CalendarDay>
      );
    }
    
    return calendarDays;
  };
  
  const formatDisplayDate = (dateString) => {
    // dateString이 YYYY-MM-DD 형식이므로 로컬 시간으로 파싱
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day); // 로컬 시간으로 생성
    
    // 수동으로 날짜 포맷 (요일 완전 제거)
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };
  
  // 기사가 있는 날짜들 목록 생성
  const availableDates = Object.keys(articlesByDate).filter(dateKey => 
    articlesByDate[dateKey] && articlesByDate[dateKey].length > 0
  );
  
  const handleDateSelect = (dateKey) => {
    setSelectedDate(dateKey);
    setSheetOpen(false);
  };
  
  const handleCalendarOpen = () => {
    setSheetOpen(true);
  };

  return (
    <>
      <MobileNavigation />
      <MobileContentWrapper>
        <PageContainer>
          {/* 로딩 상태 표시 */}
          {articlesLoading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography>Loading articles...</Typography>
            </Box>
          )}

          {/* 헤더 */}
          <Header>
            <HeaderContent>
              {/* 빈 공간 - 심플하게 유지 */}
            </HeaderContent>
            <div>
              {/* 빈 공간 - 다른 페이지의 정렬 기능과 동일한 위치 */}
            </div>
          </Header>

          {/* 모바일: 달력을 하단으로, 데스크톱: 기존 위치 */}
          {!isMobile && (
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
                  <DayLabel 
                    key={day} 
                    $isWeekend={isWeekend(index)}
                    $isSunday={index === 0}
                  >
                    {day}
                  </DayLabel>
                ))}
              </DayLabels>
              
              <CalendarGrid>
                {renderCalendar()}
              </CalendarGrid>
            </CalendarSection>
          )}

          {/* 선택된 날짜의 기사들 */}
          {selectedDate && (
            <ArticlesSection $isMobile={isMobile}>
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
                
                {!isMobile && (
                  <FilterContainer>
                    <FilterListIcon sx={{ mr: 1, color: '#666' }} />
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={selectedCategory}
                        label="Category"
                        onChange={(e) => setSelectedCategory(e.target.value)}
                      >
                        {(categories || []).map(category => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </FilterContainer>
                )}
              </ArticlesHeader>

              {currentArticles.length > 0 ? (
                isMobile ? (
                  <HorizontalScrollContainer>
                    <ArticleRow>
                      {(currentArticles || []).map(article => {
                        if (!article || !article.id) return null;
                        return (
                          <ArticleCardWrapper key={article.id}>
                            <ArticleCard 
                              {...article}
                              publishedAt={article.publishedAt}
                              navigate={navigate}
                            />
                          </ArticleCardWrapper>
                        );
                      }).filter(Boolean)}
                    </ArticleRow>
                  </HorizontalScrollContainer>
                ) : (
                  <ArticleGrid>
                    {(currentArticles || []).map(article => {
                      if (!article || !article.id) return null;
                      return (
                        <ArticleGridWrapper key={article.id}>
                          <ArticleCard 
                            {...article}
                            publishedAt={article.publishedAt}
                            navigate={navigate}
                          />
                        </ArticleGridWrapper>
                      );
                    }).filter(Boolean)}
                  </ArticleGrid>
                )
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
          
          {/* 모바일 하단 달력 */}
          {isMobile && (
            <MobileCalendarWrapper>
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
                    <DayLabel 
                      key={day} 
                      $isWeekend={isWeekend(index)}
                      $isSunday={index === 0}
                    >
                      {day}
                    </DayLabel>
                  ))}
                </DayLabels>
                
                <CalendarGrid>
                  {renderCalendar()}
                </CalendarGrid>
              </CalendarSection>
            </MobileCalendarWrapper>
          )}
        </PageContainer>
      </MobileContentWrapper>
    </>
  );
};

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
`;

const CalendarSection = styled(Card)`
  margin-bottom: 2rem;
  padding: 1.5rem;
  
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
  color: ${props => {
    if (props.$isSunday) return '#d32f2f'; // 일요일은 빨간색
    if (props.$isWeekend) return '#1976d2';
    return '#666';
  }};
  
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
    if (props.$isSelected) return '#ffeb3b'; // 노란 형광색
    if (props.$hasArticles) return '#f3f4f6';
    return 'transparent';
  }};
  
  border: ${props => {
    if (props.$isSelected) return '2px solid #fbc02d'; // 노란색 테두리
    if (props.$hasArticles) return '2px solid #e0e7ff';
    return '2px solid transparent';
  }};
  
  &:hover {
    ${props => props.$isClickable && `
      background: ${props.$isSelected ? '#fff176' : '#e3f2fd'};
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `}
  }
  
  @media (min-width: 768px) {
    min-height: 80px;
  }
`;

const DayNumber = styled.div`
  font-weight: 500;
  font-size: 1rem;
  color: ${props => {
    if (props.$isSunday) return '#d32f2f'; // 일요일은 빨간색
    if (props.$isWeekend) return '#1976d2';
    return '#333';
  }};
  
  @media (min-width: 768px) {
    font-size: 1.125rem;
  }
`;



const ArticlesSection = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
  padding: 1.5rem;
  padding-bottom: 0; /* 하단 패딩 제거하여 스크롤 컨테이너가 끝까지 갈 수 있도록 */
  
  ${props => props.$isMobile && `
    flex: 1;
    min-height: 0;
    margin-bottom: 1rem;
    padding-left: 0; /* 모바일에서 좌측 패딩 제거 */
    padding-right: 0; /* 모바일에서 우측 패딩 제거 */
  `}
  
  @media (min-width: 768px) {
    padding: 2rem;
    padding-bottom: 0; /* 데스크톱에서도 하단 패딩 제거 */
  }
`;

const ArticlesHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 0 1.5rem; /* 모바일에서 헤더에 패딩 추가 */
  
  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
    padding: 0; /* 데스크톱에서는 패딩 제거 (부모에서 처리) */
  }
`;

const FilterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const HorizontalScrollContainer = styled.div`
  overflow-x: auto;
  padding-bottom: 1rem;
  cursor: grab;
  
  &:active {
    cursor: grabbing;
  }
  
  /* 모바일에서 스크롤 스냅 적용 */
  @media (max-width: 768px) {
    scroll-snap-type: x mandatory;
    padding-left: 2vw; /* 여백 조정 */
  }
  
  &::-webkit-scrollbar {
    height: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
    
    &:hover {
      background: #a8a8a8;
    }
  }
`;

const ArticleRow = styled.div`
  display: flex;
  gap: 1.5rem;
  min-width: max-content;
  padding: 0.5rem 0;
  
  /* 모바일에서 간격 조정 */
  @media (max-width: 768px) {
    gap: 0.375rem; /* 기존 0.75rem의 절반 */
  }
`;

const ArticleCardWrapper = styled.div`
  flex: 0 0 320px;
  width: 320px;
  
  /* 모바일에서 카드 폭 조정하여 다음 카드 1/10 정도 보이도록 */
  @media (max-width: 768px) {
    flex: 0 0 85vw;
    width: 85vw;
    scroll-snap-align: start; /* 스크롤 스냅 추가 */
  }
`;

const ArticleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const ArticleGridWrapper = styled.div`
  /* 데스크톱 그리드용 래퍼 */
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
`;

// 모바일 하단 달력 래퍼
const MobileCalendarWrapper = styled.div`
  margin-top: 1rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
`;

export default DatePage;