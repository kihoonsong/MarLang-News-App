import React, { useEffect } from 'react';
import styled from 'styled-components';
import { SwipeableDrawer, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { designTokens } from '../utils/designTokens';

const CalendarBottomSheet = ({ 
  open, 
  onClose, 
  onOpen,
  selectedDate,
  onDateSelect,
  availableDates = [],
  currentMonth = new Date()
}) => {
  // BottomSheet가 열렸을 때 배경 스크롤 잠금
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);
  
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  // 달력 생성 로직
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const firstDayOfWeek = firstDay.getDay(); // 0=일요일
  
  // 달력 셀 생성 (이전 달 마지막 날들 + 현재 달 + 다음 달 첫 날들)
  const calendarCells = [];
  
  // 이전 달 마지막 날들
  const prevMonth = new Date(year, month - 1, 0);
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonth.getDate() - i;
    calendarCells.push({
      day,
      date: new Date(year, month - 1, day),
      isCurrentMonth: false,
      isOtherMonth: true
    });
  }
  
  // 현재 달
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateKey = date.toISOString().split('T')[0];
    
    calendarCells.push({
      day,
      date,
      dateKey,
      isCurrentMonth: true,
      isToday: date.toDateString() === new Date().toDateString(),
      isSelected: dateKey === selectedDate,
      hasArticles: availableDates.includes(dateKey)
    });
  }
  
  // 다음 달 첫 날들 (6주 완성을 위해)
  const remainingCells = 42 - calendarCells.length; // 6주 * 7일
  for (let day = 1; day <= remainingCells; day++) {
    calendarCells.push({
      day,
      date: new Date(year, month + 1, day),
      isCurrentMonth: false,
      isOtherMonth: true
    });
  }
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const handleDateClick = (cellInfo) => {
    if (cellInfo.isCurrentMonth && cellInfo.dateKey) {
      onDateSelect(cellInfo.dateKey);
      onClose();
    }
  };

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={onOpen}
      disableSwipeToOpen={true}
      ModalProps={{
        keepMounted: false, // 성능 최적화
      }}
      PaperProps={{
        sx: {
          maxHeight: '60vh',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }
      }}
    >
      <Container>
        <Header>
          <HeaderContent>
            <MonthTitle>
              {monthNames[month]} {year}
            </MonthTitle>
            <CloseButton onClick={onClose} aria-label="캘린더 닫기">
              <CloseIcon />
            </CloseButton>
          </HeaderContent>
          
          <WeekHeader>
            {weekDays.map(day => (
              <WeekDay key={day}>{day}</WeekDay>
            ))}
          </WeekHeader>
        </Header>
        
        <CalendarGrid>
          {calendarCells.map((cellInfo, index) => (
            <CalendarCell
              key={index}
              $isCurrentMonth={cellInfo.isCurrentMonth}
              $isToday={cellInfo.isToday}
              $isSelected={cellInfo.isSelected}
              $hasArticles={cellInfo.hasArticles}
              onClick={() => handleDateClick(cellInfo)}
              role={cellInfo.isCurrentMonth ? "button" : undefined}
              tabIndex={cellInfo.isCurrentMonth ? 0 : -1}
              aria-label={cellInfo.isCurrentMonth ? 
                `${cellInfo.day}일 ${cellInfo.hasArticles ? '기사 있음' : '기사 없음'}` : 
                undefined
              }
              onKeyDown={(e) => {
                if (cellInfo.isCurrentMonth && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  handleDateClick(cellInfo);
                }
              }}
            >
              <DateNumber>{cellInfo.day}</DateNumber>
              {cellInfo.hasArticles && cellInfo.isCurrentMonth && <ArticleDot />}
            </CalendarCell>
          ))}
        </CalendarGrid>
      </Container>
    </SwipeableDrawer>
  );
};

// 스타일드 컴포넌트들
const Container = styled.div`
  padding: ${designTokens.spacing.md};
  background: white;
  
  /* 모션을 줄이고 싶은 사용자를 위한 설정 */
  @media (prefers-reduced-motion: reduce) {
    * {
      transition: none !important;
      animation: none !important;
    }
  }
`;

const Header = styled.div`
  margin-bottom: ${designTokens.spacing.md};
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${designTokens.spacing.md};
`;

const MonthTitle = styled(Typography)`
  && {
    font-size: 1.25rem;
    font-weight: 600;
    color: ${designTokens.colors.text.primary};
  }
`;

const CloseButton = styled(IconButton)`
  && {
    color: ${designTokens.colors.text.secondary};
  }
`;

const WeekHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: ${designTokens.spacing.xs};
  margin-bottom: ${designTokens.spacing.sm};
`;

const WeekDay = styled.div`
  text-align: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${designTokens.colors.text.secondary};
  padding: ${designTokens.spacing.xs} 0;
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: ${designTokens.spacing.xs};
`;

const CalendarCell = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  border-radius: 8px;
  cursor: ${props => props.$isCurrentMonth ? 'pointer' : 'default'};
  transition: all 0.2s ease;
  position: relative;
  min-height: 44px; /* 터치 접근성 */
  
  /* 다른 달 날짜들 */
  ${props => !props.$isCurrentMonth && `
    color: ${designTokens.colors.text.disabled};
    cursor: default;
  `}
  
  /* 현재 달 날짜들 */
  ${props => props.$isCurrentMonth && `
    color: ${props.$hasArticles ? designTokens.colors.text.primary : designTokens.colors.text.secondary};
    
    &:hover {
      background-color: ${designTokens.colors.background.paper};
    }
  `}
  
  /* 선택된 날짜 */
  ${props => props.$isSelected && `
    background-color: ${designTokens.colors.primary} !important;
    color: white !important;
  `}
  
  /* 오늘 날짜 */
  ${props => props.$isToday && !props.$isSelected && `
    background-color: ${designTokens.colors.primary}20;
    color: ${designTokens.colors.primary};
    font-weight: 600;
  `}
  
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
  bottom: 4px;
`;

export default CalendarBottomSheet;