import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { CssBaseline } from '@mui/material';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#333333',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#58a6ff',
    },
    secondary: {
      main: '#79c0ff',
    },
    background: {
      default: '#0d1117',
      paper: '#21262d',
    },
    text: {
      primary: '#e1e1e1',
      secondary: '#b3b3b3',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#21262d',
          color: '#e1e1e1',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
          borderBottom: '1px solid #30363d',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#21262d',
          borderColor: '#30363d',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          color: '#e1e1e1',
        },
      },
    },
  },
});

export const CustomThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // 다크모드 비활성화 - 항상 false 반환
    // const saved = localStorage.getItem('marlang_dark_mode');
    // const darkMode = saved ? JSON.parse(saved) : false;
    const darkMode = false;
    // 초기 로드 시 CSS 변수 설정
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    return darkMode;
  });

  useEffect(() => {
    localStorage.setItem('marlang_dark_mode', JSON.stringify(isDarkMode));
    // CSS 변수와 동기화
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    // 다크모드 토글 비활성화
    // setIsDarkMode(prev => !prev);
    console.log('다크모드 기능이 비활성화되었습니다.');
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      <ThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </StyledThemeProvider>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};