import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { designTokens } from '../utils/designTokens';

// 반응형 훅
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState('desktop');

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      if (width < parseInt(designTokens.breakpoints.mobile)) {
        setBreakpoint('mobile');
      } else if (width < parseInt(designTokens.breakpoints.tablet)) {
        setBreakpoint('tablet');
      } else if (width < parseInt(designTokens.breakpoints.desktop)) {
        setBreakpoint('desktop');
      } else {
        setBreakpoint('wide');
      }
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  return breakpoint;
};

// 모바일 여부 체크 훅 (기존 코드와 호환)
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < parseInt(designTokens.breakpoints.mobile));
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

// 반응형 컨테이너
export const ResponsiveContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${designTokens.spacing.sm};
  
  @media (min-width: ${designTokens.breakpoints.mobile}) {
    padding: 0 ${designTokens.spacing.md};
  }
  
  @media (min-width: ${designTokens.breakpoints.tablet}) {
    padding: 0 ${designTokens.spacing.lg};
  }
  
  @media (min-width: ${designTokens.breakpoints.desktop}) {
    padding: 0 ${designTokens.spacing.xl};
  }
`;

// 반응형 그리드
export const ResponsiveGrid = styled.div`
  display: grid;
  gap: ${designTokens.spacing.sm};
  
  /* 모바일: 1열 */
  grid-template-columns: 1fr;
  
  /* 태블릿: 2열 */
  @media (min-width: ${designTokens.breakpoints.mobile}) {
    grid-template-columns: repeat(2, 1fr);
    gap: ${designTokens.spacing.md};
  }
  
  /* 데스크톱: 3열 */
  @media (min-width: ${designTokens.breakpoints.tablet}) {
    grid-template-columns: repeat(3, 1fr);
    gap: ${designTokens.spacing.lg};
  }
  
  /* 와이드: 4열 */
  @media (min-width: ${designTokens.breakpoints.desktop}) {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
`;

// 숨김/표시 유틸리티
export const HideOnMobile = styled.div`
  @media (max-width: ${designTokens.breakpoints.mobile}) {
    display: none;
  }
`;

export const ShowOnMobile = styled.div`
  @media (min-width: ${designTokens.breakpoints.mobile}) {
    display: none;
  }
`;

export const HideOnTablet = styled.div`
  @media (max-width: ${designTokens.breakpoints.tablet}) {
    display: none;
  }
`;

export const ShowOnTablet = styled.div`
  @media (min-width: ${designTokens.breakpoints.tablet}) {
    display: none;
  }
`;

// 반응형 Flexbox
export const ResponsiveFlex = styled.div`
  display: flex;
  gap: ${designTokens.spacing.sm};
  
  ${props => props.direction === 'column' ? `
    flex-direction: column;
    
    @media (min-width: ${designTokens.breakpoints.mobile}) {
      flex-direction: row;
    }
  ` : ''}
  
  ${props => props.wrap ? 'flex-wrap: wrap;' : ''}
  
  ${props => props.justify ? `justify-content: ${props.justify};` : ''}
  ${props => props.align ? `align-items: ${props.align};` : ''}
`;

// 반응형 간격
export const ResponsiveSpacing = styled.div`
  margin: ${props => designTokens.spacing[props.mobile] || designTokens.spacing.sm};
  
  @media (min-width: ${designTokens.breakpoints.mobile}) {
    margin: ${props => designTokens.spacing[props.tablet] || designTokens.spacing.md};
  }
  
  @media (min-width: ${designTokens.breakpoints.tablet}) {
    margin: ${props => designTokens.spacing[props.desktop] || designTokens.spacing.lg};
  }
`; 