// 디자인 토큰 시스템 - 기존 디자인을 유지하면서 통일성 제공
export const designTokens = {
  colors: {
    // 기존 사용 중인 색상들 정리
    primary: '#1976d2',
    primaryLight: '#e3f2fd',
    primaryDark: '#1565c0',
    secondary: '#dc004e',
    
    // 텍스트 색상 (기존 값 유지)
    text: {
      primary: '#333',
      secondary: '#666',
      disabled: '#999',
      hint: '#888'
    },
    
    // 배경 색상
    background: {
      default: '#ffffff',
      paper: '#ffffff',
      grey: '#f5f5f5',
      light: '#f8f9fa'
    },
    
    // 상태 색상
    success: '#4caf50',
    warning: '#ff9800', 
    error: '#f44336',
    info: '#2196f3',
    
    // 레벨 배지 색상 (기존 유지)
    level: {
      beginner: {
        bg: '#e8f5e8',
        text: '#2e7d32'
      },
      intermediate: {
        bg: '#fff3e0', 
        text: '#ef6c00'
      },
      advanced: {
        bg: '#ffebee',
        text: '#c62828'
      }
    },
    
    // 그라디언트 (기존 유지)
    gradient: {
      login: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      dashboard: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      button: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)'
    }
  },
  
  spacing: {
    xs: '0.5rem',   // 8px
    sm: '1rem',     // 16px (기존 모바일 패딩)
    md: '1.5rem',   // 24px
    lg: '2rem',     // 32px (기존 데스크톱 패딩)
    xl: '3rem',     // 48px
    xxl: '4rem'     // 64px
  },
  
  breakpoints: {
    mobile: '768px',
    tablet: '960px',  // Material-UI 기본값 유지
    desktop: '1200px',
    wide: '1600px'
  },
  
  borderRadius: {
    small: '8px',
    medium: '12px',   // 기존 카드 반지름
    large: '16px',    // 기존 큰 카드 반지름
    xl: '20px',
    circle: '50%'
  },
  
  shadows: {
    // 기존 사용 중인 그림자 값들
    card: '0 2px 12px rgba(0,0,0,0.1)',
    cardHover: '0 4px 24px rgba(0,0,0,0.15)',
    large: '0 8px 32px rgba(0,0,0,0.1)',
    bottom: '0 -2px 8px rgba(0,0,0,0.1)'
  },
  
  zIndex: {
    modal: 1300,
    drawer: 1200,
    appBar: 1100,
    tooltip: 1500
  }
};

// 기존 스타일에서 사용할 수 있는 헬퍼 함수들
export const getSpacing = (size) => designTokens.spacing[size] || size;
export const getColor = (path) => {
  // Material-UI 테마 기반 색상 매핑
  const colorMap = {
    'background.paper': 'var(--color-background)',
    'background.default': 'var(--color-background)',
    'background.grey': 'var(--color-background-grey)',
    'text.primary': 'var(--color-text-primary)',
    'text.secondary': 'var(--color-text-secondary)',
    'text.hint': 'var(--color-text-hint)',
    'primary.main': 'var(--color-primary)',
    'primary.light': 'var(--color-primary-light)',
    'primary.dark': 'var(--color-primary-dark)',
    'warning.main': 'var(--color-warning)',
    'success.main': 'var(--color-success)',
    'error.main': 'var(--color-error)',
    'border': 'var(--color-border)',
    'shadow.card': 'var(--shadow-card)',
    'shadow.large': 'var(--shadow-large)'
  };
  
  // CSS 변수 매핑이 있으면 사용
  if (colorMap[path]) {
    return colorMap[path];
  }
  
  // 기존 로직 유지
  const keys = path.split('.');
  let result = designTokens.colors;
  for (const key of keys) {
    result = result[key];
    if (!result) return path; // 경로가 없으면 원본 반환
  }
  return result;
};

export const getBreakpoint = (size) => designTokens.breakpoints[size] || size;
export const getBorderRadius = (size) => designTokens.borderRadius[size] || size;
export const getShadow = (type) => designTokens.shadows[type] || type;

// 기존 Material-UI 테마와 호환되는 확장
export const createExtendedTheme = (baseTheme) => ({
  ...baseTheme,
  custom: designTokens
}); 