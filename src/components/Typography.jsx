import styled from 'styled-components';
import { designTokens } from '../utils/designTokens';

// 기존 디자인을 유지하면서 통일성 제공하는 타이포그래피 시스템

// 페이지 제목 (기존 스타일 유지)
export const PageTitle = styled.h1`
  font-size: 1.8rem;
  font-weight: bold;
  margin: 0;
  color: ${designTokens.colors.text.primary};
  
  @media (max-width: ${designTokens.breakpoints.mobile}) {
    font-size: 1.5rem;
  }
`;

// 섹션 제목
export const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: ${designTokens.colors.text.primary};
`;

// 카드 제목
export const CardTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: ${designTokens.colors.text.primary};
  line-height: 1.4;
`;

// 본문 텍스트
export const BodyText = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  margin: 0 0 1rem 0;
  color: ${designTokens.colors.text.primary};
`;

// 보조 텍스트 
export const SecondaryText = styled.span`
  font-size: 0.875rem;
  color: ${designTokens.colors.text.secondary};
  line-height: 1.5;
`;

// 힌트 텍스트
export const HintText = styled.span`
  font-size: 0.75rem;
  color: ${designTokens.colors.text.hint};
  line-height: 1.4;
`;

// 레벨 배지 (기존 스타일 완전 유지)
export const LevelBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  
  ${props => {
    switch(props.level?.toLowerCase()) {
      case 'beginner':
        return `
          background-color: ${designTokens.colors.level.beginner.bg};
          color: ${designTokens.colors.level.beginner.text};
        `;
      case 'intermediate':
        return `
          background-color: ${designTokens.colors.level.intermediate.bg};
          color: ${designTokens.colors.level.intermediate.text};
        `;
      case 'advanced':
        return `
          background-color: ${designTokens.colors.level.advanced.bg};
          color: ${designTokens.colors.level.advanced.text};
        `;
      default:
        return `
          background-color: ${designTokens.colors.background.grey};
          color: ${designTokens.colors.text.secondary};
        `;
    }
  }}
`;

// 링크 텍스트
export const LinkText = styled.a`
  color: ${designTokens.colors.primary};
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
  
  &:visited {
    color: ${designTokens.colors.primaryDark};
  }
`;

// 에러 텍스트
export const ErrorText = styled.span`
  color: ${designTokens.colors.error};
  font-size: 0.875rem;
  font-weight: 500;
`;

// 성공 텍스트  
export const SuccessText = styled.span`
  color: ${designTokens.colors.success};
  font-size: 0.875rem;
  font-weight: 500;
`;

// 경고 텍스트
export const WarningText = styled.span`
  color: ${designTokens.colors.warning};
  font-size: 0.875rem;
  font-weight: 500;
`;

// 강조 텍스트
export const HighlightText = styled.span`
  background-color: ${designTokens.colors.primaryLight};
  color: ${designTokens.colors.primaryDark};
  padding: 2px 4px;
  border-radius: 4px;
  font-weight: 500;
`; 