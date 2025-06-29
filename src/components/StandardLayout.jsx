import styled from 'styled-components';
import { designTokens } from '../utils/designTokens';

// 기존 PageContainer와 호환되는 표준 레이아웃
// 모든 기존 스타일을 유지하면서 토큰 시스템 적용
const StandardLayout = styled.div`
  padding: 0 ${designTokens.spacing.sm} ${designTokens.spacing.lg} ${designTokens.spacing.sm};
  width: 100%;
  box-sizing: border-box;
  
  @media (min-width: ${designTokens.breakpoints.mobile}) {
    padding: 0 ${designTokens.spacing.lg} ${designTokens.spacing.lg} ${designTokens.spacing.lg};
  }
  
  @media (min-width: ${designTokens.breakpoints.desktop}) {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 ${designTokens.spacing.lg} ${designTokens.spacing.lg} ${designTokens.spacing.lg};
  }
`;

// 기존 PageContainer와 완전히 동일한 스타일 (하위 호환성)
export const LegacyPageContainer = styled.div`
  padding: 0 1rem 2rem 1rem;
  width: 100%;
  box-sizing: border-box;
  
  @media (min-width: 768px) {
    padding: 0 2rem 2rem 2rem;
  }
  
  @media (min-width: 1200px) {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem 2rem 2rem;
  }
`;

// Settings 페이지용 확장 레이아웃 (기존 넓은 패딩 유지하면서 표준화)
export const WideLayout = styled.div`
  padding: 0 ${designTokens.spacing.sm} ${designTokens.spacing.lg} ${designTokens.spacing.sm};
  
  @media (min-width: ${designTokens.breakpoints.mobile}) {
    padding: 0 ${designTokens.spacing.xxl} ${designTokens.spacing.lg} ${designTokens.spacing.xxl};
  }
  
  @media (min-width: ${designTokens.breakpoints.desktop}) {
    padding: 0 8rem ${designTokens.spacing.lg} 8rem;
  }
  
  @media (min-width: ${designTokens.breakpoints.wide}) {
    padding: 0 12rem ${designTokens.spacing.lg} 12rem;
  }
  
  @media (min-width: 2000px) {
    padding: 0 16rem ${designTokens.spacing.lg} 16rem;
  }
`;

// 대시보드용 전체 높이 레이아웃
export const FullHeightLayout = styled.div`
  min-height: 100vh;
  background: ${designTokens.colors.gradient.dashboard};
`;

// Home 페이지용 컨테이너 (기존 스타일 완전 유지)
export const HomeContentContainer = styled.div`
  padding: 0 1rem 2rem 1rem;
  
  @media (min-width: 768px) {
    padding: 0 2rem 2rem 2rem;
  }
`;

export default StandardLayout; 