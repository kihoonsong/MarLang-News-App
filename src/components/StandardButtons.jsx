import styled from 'styled-components';
import { Button as MuiButton, IconButton as MuiIconButton } from '@mui/material';
import { designTokens, getColor, getBorderRadius, getShadow } from '../utils/designTokens';

// 기본 버튼 (Material-UI와 호환)
export const PrimaryButton = styled(MuiButton)`
  && {
    background: ${getColor('primary')};
    color: white;
    border-radius: ${getBorderRadius('medium')};
    padding: 12px 24px;
    font-weight: 600;
    text-transform: none;
    box-shadow: ${getShadow('card')};
    
    &:hover {
      background: ${getColor('primaryDark')};
      box-shadow: ${getShadow('cardHover')};
      transform: translateY(-1px);
    }
    
    &:disabled {
      background: ${designTokens.colors.background.grey};
      color: ${getColor('text.disabled')};
      transform: none;
    }
    
    @media (max-width: ${designTokens.breakpoints.mobile}) {
      padding: 10px 20px;
      font-size: 0.9rem;
    }
  }
`;

// 보조 버튼
export const SecondaryButton = styled(MuiButton)`
  && {
    background: transparent;
    color: ${getColor('primary')};
    border: 2px solid ${getColor('primary')};
    border-radius: ${getBorderRadius('medium')};
    padding: 10px 22px;
    font-weight: 600;
    text-transform: none;
    
    &:hover {
      background: ${getColor('primaryLight')};
      border-color: ${getColor('primaryDark')};
      transform: translateY(-1px);
    }
    
    &:disabled {
      border-color: ${designTokens.colors.background.grey};
      color: ${getColor('text.disabled')};
      transform: none;
    }
    
    @media (max-width: ${designTokens.breakpoints.mobile}) {
      padding: 8px 18px;
      font-size: 0.9rem;
    }
  }
`;

// 텍스트 버튼
export const TextButton = styled(MuiButton)`
  && {
    background: transparent;
    color: ${getColor('primary')};
    border: none;
    border-radius: ${getBorderRadius('small')};
    padding: 8px 16px;
    font-weight: 500;
    text-transform: none;
    min-width: auto;
    
    &:hover {
      background: ${getColor('primaryLight')};
      transform: none;
    }
    
    &:disabled {
      color: ${getColor('text.disabled')};
    }
  }
`;

// 위험 버튼
export const DangerButton = styled(MuiButton)`
  && {
    background: ${getColor('error')};
    color: white;
    border-radius: ${getBorderRadius('medium')};
    padding: 12px 24px;
    font-weight: 600;
    text-transform: none;
    box-shadow: ${getShadow('card')};
    
    &:hover {
      background: #d32f2f;
      box-shadow: ${getShadow('cardHover')};
      transform: translateY(-1px);
    }
    
    &:disabled {
      background: ${designTokens.colors.background.grey};
      color: ${getColor('text.disabled')};
      transform: none;
    }
  }
`;

// 성공 버튼
export const SuccessButton = styled(MuiButton)`
  && {
    background: ${getColor('success')};
    color: white;
    border-radius: ${getBorderRadius('medium')};
    padding: 12px 24px;
    font-weight: 600;
    text-transform: none;
    box-shadow: ${getShadow('card')};
    
    &:hover {
      background: #388e3c;
      box-shadow: ${getShadow('cardHover')};
      transform: translateY(-1px);
    }
    
    &:disabled {
      background: ${designTokens.colors.background.grey};
      color: ${getColor('text.disabled')};
      transform: none;
    }
  }
`;

// 그라디언트 버튼 (기존 스타일 유지)
export const GradientButton = styled.button`
  background: ${designTokens.colors.gradient.button};
  color: white;
  border: none;
  border-radius: ${getBorderRadius('medium')};
  padding: 12px 24px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${getShadow('card')};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${getShadow('cardHover')};
  }
  
  &:disabled {
    background: ${designTokens.colors.background.grey};
    color: ${getColor('text.disabled')};
    cursor: not-allowed;
    transform: none;
  }
  
  @media (max-width: ${designTokens.breakpoints.mobile}) {
    padding: 10px 20px;
    font-size: 0.9rem;
  }
`;

// 아이콘 버튼
export const StandardIconButton = styled(MuiIconButton)`
  && {
    color: ${getColor('text.secondary')};
    padding: 8px;
    border-radius: ${getBorderRadius('medium')};
    transition: all 0.2s ease;
    
    &:hover {
      background: ${getColor('primaryLight')};
      color: ${getColor('primary')};
      transform: scale(1.05);
    }
    
    &:disabled {
      color: ${getColor('text.disabled')};
      transform: none;
    }
  }
`;

// 플로팅 액션 버튼
export const FloatingButton = styled.button`
  position: fixed;
  bottom: ${designTokens.spacing.lg};
  right: ${designTokens.spacing.lg};
  width: 56px;
  height: 56px;
  border-radius: ${getBorderRadius('circle')};
  background: ${getColor('primary')};
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: ${getShadow('large')};
  z-index: ${designTokens.zIndex.tooltip};
  transition: all 0.3s ease;
  
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 8px 25px rgba(25, 118, 210, 0.4);
  }
  
  @media (max-width: ${designTokens.breakpoints.mobile}) {
    width: 48px;
    height: 48px;
    bottom: ${designTokens.spacing.md};
    right: ${designTokens.spacing.md};
  }
`;

// 버튼 그룹
export const ButtonGroup = styled.div`
  display: flex;
  gap: ${designTokens.spacing.sm};
  align-items: center;
  
  @media (max-width: ${designTokens.breakpoints.mobile}) {
    flex-direction: column;
    width: 100%;
    
    button {
      width: 100%;
    }
  }
`;

// 스위치 버튼 (토글)
export const ToggleButton = styled.button`
  background: ${props => props.active ? getColor('primary') : 'transparent'};
  color: ${props => props.active ? 'white' : getColor('text.secondary')};
  border: 2px solid ${props => props.active ? getColor('primary') : designTokens.colors.background.grey};
  border-radius: ${getBorderRadius('medium')};
  padding: 8px 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${getColor('primary')};
    color: ${props => props.active ? 'white' : getColor('primary')};
  }
  
  &:disabled {
    background: ${designTokens.colors.background.grey};
    color: ${getColor('text.disabled')};
    border-color: ${designTokens.colors.background.grey};
    cursor: not-allowed;
  }
`; 