import styled from 'styled-components';
import { Card, Button } from '@mui/material';

// 메인 컨테이너
export const DashboardContainer = styled.div`
  padding: 0;
`;

// 환영 카드
export const WelcomeCard = styled(Card)`
  padding: 2rem;
  margin-bottom: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 16px !important;
`;

// 통계 카드
export const StatCard = styled(Card)`
  padding: 1.5rem;
  border-radius: 16px !important;
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  border-left: 4px solid #1976d2 !important;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1) !important;
  transition: all 0.3s ease !important;
  display: flex;
  align-items: center;
  height: 120px;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0,0,0,0.15) !important;
  }
`;

// 통계 아이콘
export const StatIcon = styled.div`
  font-size: 2.5rem;
  margin-right: 1rem;
`;

// 통계 정보 컨테이너
export const StatInfo = styled.div`
  flex: 1;
`;

// 통계 숫자
export const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #1976d2;
  line-height: 1;
`;

// 통계 라벨
export const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.5rem;
`;

// 액션 버튼
export const ActionButton = styled(Button)`
  width: 100% !important;
  height: 100px !important;
  flex-direction: column !important;
  border-radius: 12px !important;
  border: 2px dashed #e0e0e0 !important;
  transition: all 0.3s ease !important;
  
  &:hover {
    border-color: #1976d2 !important;
    background-color: #f5f5f5 !important;
    transform: translateY(-2px) !important;
  }
`;

// 카테고리 카드
export const CategoryCard = styled(Card)`
  border-radius: 12px !important;
  transition: all 0.3s ease !important;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
  }
`;

// 카테고리 관리 카드
export const CategoryManagementCard = styled(Card)`
  border-radius: 12px !important;
  transition: all 0.3s ease !important;
  border: 1px solid #e0e0e0;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
    border-color: #1976d2;
  }
`; 