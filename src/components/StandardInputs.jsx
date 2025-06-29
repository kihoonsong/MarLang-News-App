import styled from 'styled-components';
import { TextField as MuiTextField, Select as MuiSelect, FormControl, InputLabel, OutlinedInput } from '@mui/material';
import { designTokens, getColor, getBorderRadius } from '../utils/designTokens';

// 표준 텍스트 필드
export const StandardTextField = styled(MuiTextField)`
  && {
    .MuiOutlinedInput-root {
      border-radius: ${getBorderRadius('medium')};
      background: ${getColor('background.paper')};
      
      &:hover {
        .MuiOutlinedInput-notchedOutline {
          border-color: ${getColor('primaryLight')};
        }
      }
      
      &.Mui-focused {
        .MuiOutlinedInput-notchedOutline {
          border-color: ${getColor('primary')};
          border-width: 2px;
        }
      }
      
      &.Mui-error {
        .MuiOutlinedInput-notchedOutline {
          border-color: ${getColor('error')};
        }
      }
    }
    
    .MuiInputLabel-root {
      color: ${getColor('text.secondary')};
      
      &.Mui-focused {
        color: ${getColor('primary')};
      }
      
      &.Mui-error {
        color: ${getColor('error')};
      }
    }
    
    .MuiFormHelperText-root {
      margin-left: 4px;
      
      &.Mui-error {
        color: ${getColor('error')};
      }
    }
  }
`;

// 검색 입력 필드
export const SearchInput = styled(StandardTextField)`
  && {
    width: 100%;
    
    .MuiOutlinedInput-root {
      padding-right: 48px;
      
      .MuiInputBase-input {
        padding: 12px 14px;
        
        &::placeholder {
          color: ${getColor('text.hint')};
          opacity: 1;
        }
      }
    }
    
    @media (max-width: ${designTokens.breakpoints.mobile}) {
      .MuiOutlinedInput-root {
        .MuiInputBase-input {
          padding: 10px 12px;
          font-size: 0.9rem;
        }
      }
    }
  }
`;

// 패스워드 입력 필드
export const PasswordField = styled(StandardTextField)`
  && {
    .MuiOutlinedInput-root {
      .MuiInputAdornment-root {
        .MuiIconButton-root {
          color: ${getColor('text.secondary')};
          
          &:hover {
            color: ${getColor('primary')};
            background: ${getColor('primaryLight')};
          }
        }
      }
    }
  }
`;

// 큰 텍스트 영역
export const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: ${designTokens.spacing.sm};
  border: 2px solid ${designTokens.colors.background.grey};
  border-radius: ${getBorderRadius('medium')};
  background: ${getColor('background.paper')};
  color: ${getColor('text.primary')};
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.5;
  resize: vertical;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${getColor('primary')};
  }
  
  &::placeholder {
    color: ${getColor('text.hint')};
  }
  
  &:disabled {
    background: ${designTokens.colors.background.grey};
    color: ${getColor('text.disabled')};
    cursor: not-allowed;
  }
  
  @media (max-width: ${designTokens.breakpoints.mobile}) {
    padding: ${designTokens.spacing.xs};
    font-size: 0.9rem;
  }
`;

// 셀렉트 박스
export const StandardSelect = styled(MuiSelect)`
  && {
    border-radius: ${getBorderRadius('medium')};
    background: ${getColor('background.paper')};
    
    .MuiOutlinedInput-notchedOutline {
      border-color: ${designTokens.colors.background.grey};
    }
    
    &:hover {
      .MuiOutlinedInput-notchedOutline {
        border-color: ${getColor('primaryLight')};
      }
    }
    
    &.Mui-focused {
      .MuiOutlinedInput-notchedOutline {
        border-color: ${getColor('primary')};
        border-width: 2px;
      }
    }
    
    .MuiSelect-select {
      padding: 12px 14px;
      
      @media (max-width: ${designTokens.breakpoints.mobile}) {
        padding: 10px 12px;
        font-size: 0.9rem;
      }
    }
  }
`;

// 체크박스 컨테이너
export const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${designTokens.spacing.xs};
  cursor: pointer;
  user-select: none;
  
  .MuiCheckbox-root {
    color: ${getColor('text.secondary')};
    
    &.Mui-checked {
      color: ${getColor('primary')};
    }
    
    &:hover {
      background: ${getColor('primaryLight')};
    }
  }
`;

// 라디오 버튼 그룹
export const RadioGroup = styled.div`
  display: flex;
  gap: ${designTokens.spacing.md};
  
  @media (max-width: ${designTokens.breakpoints.mobile}) {
    flex-direction: column;
    gap: ${designTokens.spacing.sm};
  }
`;

export const RadioOption = styled.label`
  display: flex;
  align-items: center;
  gap: ${designTokens.spacing.xs};
  cursor: pointer;
  user-select: none;
  
  input[type="radio"] {
    width: 18px;
    height: 18px;
    margin: 0;
    accent-color: ${getColor('primary')};
  }
  
  span {
    color: ${getColor('text.primary')};
    font-size: 0.9rem;
  }
`;

// 파일 업로드
export const FileUpload = styled.div`
  position: relative;
  display: inline-block;
  cursor: pointer;
  
  input[type="file"] {
    position: absolute;
    opacity: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
  }
`;

export const FileUploadButton = styled.div`
  display: flex;
  align-items: center;
  gap: ${designTokens.spacing.xs};
  padding: 12px 24px;
  border: 2px dashed ${getColor('primary')};
  border-radius: ${getBorderRadius('medium')};
  background: ${getColor('primaryLight')};
  color: ${getColor('primary')};
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    border-style: solid;
    background: ${getColor('primary')};
    color: white;
  }
  
  @media (max-width: ${designTokens.breakpoints.mobile}) {
    padding: 10px 20px;
    font-size: 0.9rem;
  }
`;

// 입력 그룹
export const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${designTokens.spacing.xs};
  margin-bottom: ${designTokens.spacing.md};
`;

export const InputLabel = styled.label`
  font-weight: 500;
  color: ${getColor('text.primary')};
  font-size: 0.9rem;
  
  .required {
    color: ${getColor('error')};
    margin-left: 4px;
  }
`;

export const InputHint = styled.span`
  font-size: 0.8rem;
  color: ${getColor('text.hint')};
  margin-top: 4px;
`;

export const InputError = styled.span`
  font-size: 0.8rem;
  color: ${getColor('error')};
  margin-top: 4px;
  font-weight: 500;
`;

// 검색 컨테이너
export const SearchContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 500px;
  
  .search-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: ${getColor('text.secondary')};
    pointer-events: none;
    z-index: 1;
  }
  
  .clear-button {
    position: absolute;
    right: 40px;
    top: 50%;
    transform: translateY(-50%);
    color: ${getColor('text.secondary')};
    cursor: pointer;
    z-index: 1;
    
    &:hover {
      color: ${getColor('primary')};
    }
  }
`;

// 폼 컨테이너
export const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${designTokens.spacing.md};
  max-width: 500px;
  margin: 0 auto;
  
  @media (max-width: ${designTokens.breakpoints.mobile}) {
    gap: ${designTokens.spacing.sm};
    max-width: 100%;
  }
`;

// 슬라이더 컨테이너
export const SliderContainer = styled.div`
  padding: 0 ${designTokens.spacing.sm};
  
  .MuiSlider-root {
    color: ${getColor('primary')};
  }
  
  .MuiSlider-track {
    background: ${getColor('primary')};
  }
  
  .MuiSlider-thumb {
    background: ${getColor('primary')};
    
    &:hover, &.Mui-focusVisible {
      box-shadow: 0 0 0 8px ${getColor('primaryLight')};
    }
  }
  
  .MuiSlider-markLabel {
    color: ${getColor('text.secondary')};
    font-size: 0.75rem;
  }
`; 