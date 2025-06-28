import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, IconButton, Slide } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const SlideTransition = (props) => {
  return <Slide {...props} direction="up" />;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, severity = 'info', options = {}) => {
    const id = Date.now() + Math.random();
    const duration = options.duration || (severity === 'error' ? 6000 : 4000);
    
    const toast = {
      id,
      message,
      severity,
      duration,
      action: options.action,
      autoHide: options.autoHide !== false,
      ...options
    };

    setToasts(prev => [...prev, toast]);

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

  // 편의 함수들
  const success = useCallback((message, options) => addToast(message, 'success', options), [addToast]);
  const error = useCallback((message, options) => addToast(message, 'error', options), [addToast]);
  const warning = useCallback((message, options) => addToast(message, 'warning', options), [addToast]);
  const info = useCallback((message, options) => addToast(message, 'info', options), [addToast]);

  const contextValue = {
    addToast,
    removeToast,
    removeAllToasts,
    success,
    error,
    warning,
    info
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* 토스트 렌더링 */}
      {toasts.map((toast, index) => (
        <Snackbar
          key={toast.id}
          open={true}
          anchorOrigin={{ 
            vertical: 'bottom', 
            horizontal: 'right' 
          }}
          sx={{
            bottom: `${(index * 70) + 24}px !important`,
            transition: 'bottom 0.3s ease-in-out'
          }}
          TransitionComponent={SlideTransition}
          onClose={() => removeToast(toast.id)}
        >
          <Alert
            severity={toast.severity}
            variant="filled"
            action={
              <>
                {toast.action}
                <IconButton
                  size="small"
                  aria-label="close"
                  color="inherit"
                  onClick={() => removeToast(toast.id)}
                  sx={{ ml: 1 }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </>
            }
            sx={{
              minWidth: '300px',
              maxWidth: '500px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              '& .MuiAlert-message': {
                wordBreak: 'break-word'
              }
            }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </ToastContext.Provider>
  );
};