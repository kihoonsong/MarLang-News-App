import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { 
  Snackbar, 
  Alert, 
  IconButton, 
  Slide, 
  Button, 
  Box, 
  Collapse,
  Typography
} from '@mui/material';
import {
  Close as CloseIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  // WifiOff as WifiOffIcon
} from '@mui/icons-material';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const EnhancedToastContext = createContext();

export const useEnhancedToast = () => {
  const context = useContext(EnhancedToastContext);
  if (!context) {
    throw new Error('useEnhancedToast must be used within an EnhancedToastProvider');
  }
  return context;
};

const SlideTransition = (props) => {
  return <Slide {...props} direction="up" />;
};

// 에러 타입 분류
const getErrorType = (error) => {
  if (!error) return 'unknown';
  
  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('fetch') || message.includes('network')) {
    return 'network';
  }
  if (message.includes('timeout')) {
    return 'timeout';
  }
  if (message.includes('401') || message.includes('unauthorized')) {
    return 'auth';
  }
  if (message.includes('403') || message.includes('forbidden')) {
    return 'permission';
  }
  if (message.includes('404') || message.includes('not found')) {
    return 'notfound';
  }
  if (message.includes('500') || message.includes('server')) {
    return 'server';
  }
  
  return 'unknown';
};

// 사용자 친화적 에러 메시지 변환
const getFriendlyErrorMessage = (error, errorType) => {
  switch (errorType) {
    case 'network':
      return 'Connection problem. Please check your internet and try again.';
    case 'timeout':
      return 'Request timed out. The server might be busy.';
    case 'auth':
      return 'Authentication required. Please log in again.';
    case 'permission':
      return 'You don\'t have permission to perform this action.';
    case 'notfound':
      return 'The requested resource was not found.';
    case 'server':
      return 'Server error. Please try again later.';
    default:
      return error?.message || 'An unexpected error occurred.';
  }
};

export const EnhancedToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [errorLog, setErrorLog] = useState([]);
  const { isOnline } = useNetworkStatus();
  const toastsRef = useRef([]);
  
  // toasts가 변경될 때마다 ref 업데이트
  useEffect(() => {
    toastsRef.current = toasts;
  }, [toasts]);

  // 에러 로깅
  const logError = useCallback((error, context = {}) => {
    const errorEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      error: {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      },
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    setErrorLog(prev => [errorEntry, ...prev.slice(0, 49)]); // 최대 50개 유지
    
    // 개발 환경에서는 콘솔에도 출력
    if (import.meta.env.DEV) {
      console.group('🚨 Enhanced Toast Error Log');
      console.error('Error:', error);
      console.log('Context:', context);
      console.log('Full Log Entry:', errorEntry);
      console.groupEnd();
    }
  }, []);

  const addToast = useCallback((message, severity = 'info', options = {}) => {
    const id = Date.now() + Math.random();
    const duration = options.duration || (severity === 'error' ? 8000 : 4000);
    
    const toast = {
      id,
      message,
      severity,
      duration,
      action: options.action,
      autoHide: options.autoHide !== false,
      priority: options.priority || 'normal', // low, normal, high
      group: options.group,
      expandable: options.expandable && options.details,
      details: options.details,
      onRetry: options.onRetry,
      ...options
    };

    setToasts(prev => {
      // 우선순위에 따라 정렬
      const newToasts = [...prev, toast].sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
      
      // 같은 그룹의 토스트가 있으면 교체
      if (toast.group) {
        return newToasts.filter((t, index) => 
          t.group !== toast.group || newToasts.findIndex(nt => nt.group === toast.group) === index
        );
      }
      
      return newToasts;
    });

    // 자동 제거
    if (toast.autoHide) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const removeAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // 향상된 에러 처리
  const handleError = useCallback((error, options = {}) => {
    const errorType = getErrorType(error);
    const friendlyMessage = getFriendlyErrorMessage(error, errorType);
    
    // 에러 로깅
    logError(error, { errorType, ...options.context });

    // 네트워크 에러의 경우 특별 처리
    if (errorType === 'network' && !isOnline) {
      return addToast(
        'You are currently offline. Please check your connection.',
        'error',
        {
          group: 'network',
          priority: 'high',
          action: (
            <Button 
              color="inherit" 
              size="small"
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
          ),
          ...options
        }
      );
    }

    // 일반 에러 처리
    const toastOptions = {
      expandable: import.meta.env.DEV,
      details: import.meta.env.DEV ? error?.stack : null,
      group: errorType,
      ...options
    };

    // 재시도 버튼 추가
    if (options.onRetry) {
      toastOptions.action = (
        <Button 
          color="inherit" 
          size="small"
          startIcon={<RefreshIcon />}
          onClick={options.onRetry}
        >
          Retry
        </Button>
      );
    }

    return addToast(friendlyMessage, 'error', toastOptions);
  }, [addToast, logError, isOnline]);

  // 편의 함수들
  const success = useCallback((message, options) => addToast(message, 'success', options), [addToast]);
  const warning = useCallback((message, options) => addToast(message, 'warning', options), [addToast]);
  const info = useCallback((message, options) => addToast(message, 'info', options), [addToast]);

  // 네트워크 상태 변경 감지
  useEffect(() => {
    if (isOnline) {
      // 온라인 복구 시 알림
      const offlineToasts = toastsRef.current.filter(t => t.group === 'network');
      if (offlineToasts.length > 0) {
        setTimeout(() => {
          success('Connection restored!', { group: 'network', duration: 3000 });
        }, 500);
      }
    }
  }, [isOnline, success]);

  const contextValue = {
    addToast,
    removeToast,
    removeAllToasts,
    success,
    error: handleError, // 향상된 에러 처리
    warning,
    info,
    errorLog,
    clearErrorLog: () => setErrorLog([])
  };

  return (
    <EnhancedToastContext.Provider value={contextValue}>
      {children}
      
      {/* 토스트 렌더링 */}
      {toasts.map((toast, index) => (
        <EnhancedToast
          key={toast.id}
          toast={toast}
          index={index}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </EnhancedToastContext.Provider>
  );
};

// 개별 토스트 컴포넌트
const EnhancedToast = ({ toast, index, onClose }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Snackbar
      open={true}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      sx={{
        bottom: `${(index * 80) + 24}px !important`,
        transition: 'bottom 0.3s ease-in-out',
        zIndex: 9999 - index // 최신 토스트가 위에 오도록
      }}
      TransitionComponent={SlideTransition}
      onClose={onClose}
    >
      <Alert
        severity={toast.severity}
        variant="filled"
        action={
          <Box display="flex" alignItems="center">
            {toast.action}
            {toast.expandable && (
              <IconButton
                size="small"
                color="inherit"
                onClick={() => setExpanded(!expanded)}
                sx={{ ml: 0.5 }}
              >
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            )}
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={onClose}
              sx={{ ml: 0.5 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        }
        sx={{
          minWidth: '320px',
          maxWidth: '500px',
          boxShadow: toast.priority === 'high' 
            ? '0 8px 32px rgba(244, 67, 54, 0.3)'
            : '0 4px 20px rgba(0,0,0,0.15)',
          border: toast.priority === 'high' ? '2px solid rgba(244, 67, 54, 0.5)' : 'none',
          '& .MuiAlert-message': {
            wordBreak: 'break-word',
            width: '100%'
          }
        }}
      >
        <Box>
          <Typography variant="body2" component="div">
            {toast.message}
          </Typography>
          
          {toast.expandable && (
            <Collapse in={expanded}>
              <Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 1 }}>
                <Typography variant="caption" component="pre" sx={{ 
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.7rem',
                  fontFamily: 'monospace'
                }}>
                  {toast.details}
                </Typography>
              </Box>
            </Collapse>
          )}
        </Box>
      </Alert>
    </Snackbar>
  );
};

// 전역 에러 핸들러 설정
export const setupGlobalErrorHandling = (toastError) => {
  // 처리되지 않은 Promise 거부
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
    toastError(event.reason, {
      context: { type: 'unhandledrejection' },
      group: 'global'
    });
  });

  // 일반 JavaScript 에러
  window.addEventListener('error', (event) => {
    console.error('Global Error:', event.error);
    toastError(event.error, {
      context: { 
        type: 'javascript',
        filename: event.filename,
        line: event.lineno,
        column: event.colno
      },
      group: 'global'
    });
  });

  // Fetch 요청 인터셉트 (기본적인 네트워크 에러 처리)
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.response = response;
      throw error;
    }
    
    return response;
  };
};

export default EnhancedToastProvider; 