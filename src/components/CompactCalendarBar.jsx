import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { IconButton } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { designTokens } from '../utils/designTokens';

const CompactCalendarBar = ({ 
  selectedDate, 
  onDateSelect, 
  onCalendarOpen,
  availableDates = [],
  visibleRange = 10 // 좌우로 보이는 날짜 수
}) => {
  const [visibleStartIndex, setVisibleStartIndex] = useState(0);
  const scrollRef = useRef(null);
  
  // 현재 월의 모든 날짜 생성
  const currentMonth = selectedDate ? new Date(selectedDate) : new Date();
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const allDates = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(year, month, i + 1);
    return {
      date,
      dateKey: date.toISOString().split('T')[0],
      day: i + 1,
      isToday: date.toDateString() === new Date().toDateString(),
      hasArticles: availableDates.includes(date.toISOString().split('T')[0])
    };
  });
  
  // 선택된 날짜가 변경될 때 뷰 범위 조정
  useEffect(() => {
    if (selectedDate) {
      const selectedDay = new Date(selectedDate).getDate();
      const selectedIndex = selectedDay - 1;
      
      // 선택된 날짜가 현재 보이는 범위에 없으면 조정
      if (selectedIndex < visibleStartIndex || selectedIndex >= visibleStartIndex + visibleRange) {
        const newStartIndex = Math.max(0, Math.min(
          selectedIndex - Math.floor(visibleRange / 2),
          allDates.length - visibleRange
        ));
        setVisibleStartIndex(newStartIndex);
      }
    }
  }, [selectedDate, visibleRange, allDates.length, visibleStartIndex]);
  
  // 보이는 날짜들
  const visibleDates = allDates.slice(visibleStartIndex, visibleStartIndex + visibleRange);
  
  const handlePrevious = () => {
    const newStart = Math.max(0, visibleStartIndex - 1);
    setVisibleStartIndex(newStart);
    
    // 부드러운 스크롤
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: 0,
        behavior: 'smooth'
      });
    }
  };
  
  const handleNext = () => {
    const newStart = Math.min(allDates.length - visibleRange, visibleStartIndex + 1);
    setVisibleStartIndex(newStart);
    
    // 부드러운 스크롤
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollWidth,
        behavior: 'smooth'
      });
    }
  };
  
  const canGoPrevious = visibleStartIndex > 0;
  const canGoNext = visibleStartIndex < allDates.length - visibleRange;

  return (
    <Container>
      <CalendarButton 
        onClick={onCalendarOpen}
        aria-label="전체 캘린더 열기"
      >
        <CalendarTodayIcon />
      </CalendarButton>
      
      <DateScrollContainer>
        {canGoPrevious && (
          <NavButton 
            onClick={handlePrevious}
            aria-label="이전 날짜들 보기"
            size="small"
          >
            <ChevronLeftIcon />
          </NavButton>
        )}
        
        <DatesList ref={scrollRef}>
          {visibleDates.map((dateInfo) => (
            <DateItem
              key={dateInfo.dateKey}
              $isSelected={selectedDate === dateInfo.dateKey}
              $isToday={dateInfo.isToday}
              $hasArticles={dateInfo.hasArticles}
              onClick={() => onDateSelect(dateInfo.dateKey)}
              role="button"
              tabIndex={0}
              aria-label={`${dateInfo.day}일 ${dateInfo.hasArticles ? '기사 있음' : '기사 없음'}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onDateSelect(dateInfo.dateKey);
                }
              }}
            >
              <DateNumber>{dateInfo.day}</DateNumber>
              {dateInfo.hasArticles && <ArticleDot />}
            </DateItem>
          ))}
        </DatesList>
        
        {canGoNext && (
          <NavButton 
            onClick={handleNext}
            aria-label="다음 날짜들 보기"
            size="small"
          >
            <ChevronRightIcon />
          </NavButton>
        )}
      </DateScrollContainer>
    </Container>
  );
};

// 스타일드 컴포넌트들
const Container = styled.div`
  display: flex;
  align-items: center;
  height: 48px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0 ${designTokens.spacing.sm};
  gap: ${designTokens.spacing.sm};
  border-top: 1px solid ${designTokens.colors.border};
  
  /* 모션을 줄이고 싶은 사용자를 위한 설정 */
  @media (prefers-reduced-motion: reduce) {
    * {
      transition: none !important;
      animation: none !important;
    }
  }
`;

const CalendarButton = styled(IconButton)`
  && {
    width: 40px;
    height: 40px;
    color: ${designTokens.colors.primary};
    
    &:hover {
      background-color: ${designTokens.colors.primary}20;
    }
  }
`;

const DateScrollContainer = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  gap: ${designTokens.spacing.xs};
`;

const NavButton = styled(IconButton)`
  && {
    width: 32px;
    height: 32px;
    color: ${designTokens.colors.text.secondary};
    
    &:hover {
      background-color: ${designTokens.colors.background.paper};
    }
    
    &:disabled {
      color: ${designTokens.colors.text.disabled};
    }
  }
`;

const DatesList = styled.div`
  display: flex;
  gap: 0.25rem;
  flex: 1;
  overflow: hidden;
  padding: 0 ${designTokens.spacing.xs};
`;

const DateItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  
  /* 선택된 상태 */
  ${props => props.$isSelected && `
    background-color: ${designTokens.colors.primary};
    color: white;
  `}
  
  /* 오늘 날짜 */
  ${props => props.$isToday && !props.$isSelected && `
    background-color: ${designTokens.colors.primary}20;
    color: ${designTokens.colors.primary};
    font-weight: 600;
  `}
  
  /* 기본 상태 */
  ${props => !props.$isSelected && !props.$isToday && `
    color: ${props.$hasArticles ? designTokens.colors.text.primary : designTokens.colors.text.secondary};
    
    &:hover {
      background-color: ${designTokens.colors.background.paper};
    }
  `}
  
  /* 터치 디바이스 최적화 */
  @media (hover: none) and (pointer: coarse) {
    min-width: 36px;
    height: 36px;
  }
  
  /* 포커스 상태 */
  &:focus {
    outline: 2px solid ${designTokens.colors.primary};
    outline-offset: 2px;
  }
`;

const DateNumber = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1;
`;

const ArticleDot = styled.div`
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: ${props => props.theme?.isSelected ? 'white' : designTokens.colors.primary};
  margin-top: 2px;
  position: absolute;
  bottom: 2px;
`;

export default CompactCalendarBar;