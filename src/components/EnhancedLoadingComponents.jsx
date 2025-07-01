import React from 'react';
import { 
  Box, 
  CircularProgress, 
  LinearProgress, 
  Alert, 
  Button, 
  Typography, 
  Chip,
  Card,
  CardContent,
  Skeleton,
  Fade
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  WifiOff as WifiOffIcon,
  SignalWifi4Bar as SignalWifi4BarIcon,
  SignalWifi2Bar as SignalWifi2BarIcon,
  SignalWifi1Bar as SignalWifi1BarIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

// 네트워크 상태 표시 컴포넌트
export const NetworkStatusIndicator = ({ showDetails = false }) => {
  const { isOnline, networkStrength, connectionType } = useNetworkStatus();

  const getNetworkIcon = () => {
    if (!isOnline) return <WifiOffIcon />;
    
    switch (networkStrength) {
      case 'excellent':
      case 'good':
        return <SignalWifi4BarIcon />;
      case 'fair':
        return <SignalWifi2BarIcon />;
      case 'poor':
        return <SignalWifi1BarIcon />;
      default:
        return <SignalWifi4BarIcon />;
    }
  };

  const getNetworkColor = () => {
    if (!isOnline) return 'error';
    
    switch (networkStrength) {
      case 'excellent':
        return 'success';
      case 'good':
        return 'success';
      case 'fair':
        return 'warning';
      case 'poor':
        return 'error';
      default:
        return 'info';
    }
  };

  if (!showDetails && isOnline && networkStrength !== 'poor') {
    return null; // 양호한 연결일 때는 표시하지 않음
  }

  return (
    <Chip
      icon={getNetworkIcon()}
      label={
        isOnline 
          ? `${networkStrength} ${connectionType ? `(${connectionType})` : ''}`
          : 'Offline'
      }
      color={getNetworkColor()}
      size="small"
      variant={isOnline ? 'outlined' : 'filled'}
    />
  );
};

// 오프라인 알림 배너
export const OfflineBanner = () => {
  const { isOnline } = useNetworkStatus();
  const [dismissed, setDismissed] = React.useState(false);

  // 온라인 상태가 되면 dismissed 상태 리셋
  React.useEffect(() => {
    if (isOnline) {
      setDismissed(false);
    }
  }, [isOnline]);

  if (isOnline || dismissed) return null;

  return (
    <Fade in={!isOnline && !dismissed}>
      <Alert 
        severity="warning" 
        icon={<WifiOffIcon />}
        onClose={() => setDismissed(true)}
        sx={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          zIndex: 9999,
          borderRadius: 0
        }}
        action={
          <Button 
            color="inherit" 
            size="small" 
            onClick={() => {
              console.log('🔧 Forcing online status from banner');
              window.forceOnlineStatus?.();
              setDismissed(true);
            }}
          >
            I'm Online
          </Button>
        }
      >
        <Typography variant="body2">
          You're currently offline. Some features may not be available.
        </Typography>
      </Alert>
    </Fade>
  );
};

// 향상된 로딩 컴포넌트
export const SmartLoading = ({ 
  type = 'circular', 
  message = 'Loading...', 
  showNetworkStatus = true,
  size = 'medium',
  timeout = 10000 // 10초 후 경고 표시
}) => {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const [showTimeoutWarning, setShowTimeoutWarning] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeoutWarning(true);
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout]);

  const getSize = () => {
    switch (size) {
      case 'small': return 24;
      case 'large': return 60;
      default: return 40;
    }
  };

  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center" 
      sx={{ py: 4 }}
    >
      {type === 'linear' ? (
        <Box sx={{ width: '100%', maxWidth: 400, mb: 2 }}>
          <LinearProgress />
        </Box>
      ) : (
        <CircularProgress size={getSize()} sx={{ mb: 2 }} />
      )}
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {message}
      </Typography>

      {isSlowConnection && (
        <Typography variant="caption" color="warning.main" sx={{ mb: 1 }}>
          Slow connection detected. This may take a while.
        </Typography>
      )}

      {showNetworkStatus && <NetworkStatusIndicator />}

      {showTimeoutWarning && (
        <Alert severity="info" sx={{ mt: 2, maxWidth: 400 }}>
          <Typography variant="body2">
            This is taking longer than expected. 
            {!isOnline && ' Please check your internet connection.'}
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

// 스켈레톤 로더들
export const ArticleCardSkeleton = () => (
  <Card sx={{ mb: 2 }}>
    <CardContent>
      <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
      <Skeleton variant="text" height={32} sx={{ mb: 1 }} />
      <Skeleton variant="text" height={20} width="60%" sx={{ mb: 2 }} />
      <Box display="flex" gap={1}>
        <Skeleton variant="rounded" width={60} height={24} />
        <Skeleton variant="rounded" width={80} height={24} />
      </Box>
    </CardContent>
  </Card>
);

export const ArticleListSkeleton = ({ count = 3 }) => (
  <Box>
    {Array.from({ length: count }).map((_, index) => (
      <ArticleCardSkeleton key={index} />
    ))}
  </Box>
);

export const DashboardSkeleton = () => (
  <Box sx={{ p: 3 }}>
    {/* 헤더 */}
    <Skeleton variant="text" height={40} width="30%" sx={{ mb: 3 }} />
    
    {/* 통계 카드들 */}
    <Box display="flex" gap={2} sx={{ mb: 4 }}>
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} sx={{ flex: 1 }}>
          <CardContent>
            <Skeleton variant="text" height={24} width="60%" />
            <Skeleton variant="text" height={36} width="40%" />
          </CardContent>
        </Card>
      ))}
    </Box>
    
    {/* 차트 영역 */}
    <Card>
      <CardContent>
        <Skeleton variant="rectangular" height={300} />
      </CardContent>
    </Card>
  </Box>
);

// 네트워크 에러 컴포넌트
export const NetworkError = ({ 
  error, 
  onRetry, 
  showDetails = false,
  customMessage 
}) => {
  const { isOnline, isSlowConnection } = useNetworkStatus();

  const getErrorMessage = () => {
    if (!isOnline) {
      return 'No internet connection. Please check your network settings.';
    }
    
    if (isSlowConnection) {
      return 'Your connection seems slow. The request may have timed out.';
    }

    if (customMessage) {
      return customMessage;
    }

    // 일반적인 네트워크 에러 메시지들
    if (error?.message?.includes('fetch')) {
      return 'Failed to fetch data. Please try again.';
    }
    
    if (error?.message?.includes('timeout')) {
      return 'Request timed out. Please check your connection and try again.';
    }

    return error?.message || 'Something went wrong. Please try again.';
  };

  return (
    <Card sx={{ m: 2, textAlign: 'center' }}>
      <CardContent>
        <WarningIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
        
        <Typography variant="h6" sx={{ mb: 1 }}>
          Connection Problem
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {getErrorMessage()}
        </Typography>

        <NetworkStatusIndicator showDetails />

        {showDetails && error?.stack && (
          <details style={{ marginTop: 16, textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Technical Details
            </summary>
            <pre style={{ 
              marginTop: 8, 
              fontSize: '0.8rem', 
              overflow: 'auto',
              background: '#f5f5f5',
              padding: 8,
              borderRadius: 4
            }}>
              {error.stack}
            </pre>
          </details>
        )}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button 
            variant="contained" 
            startIcon={<RefreshIcon />}
            onClick={onRetry}
            disabled={!isOnline}
          >
            Try Again
          </Button>
          
          {!isOnline && (
            <Button 
              variant="outlined"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          )}
        </Box>

        {!isOnline && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Retry will be available when you're back online
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

// 로딩 상태가 있는 컴포넌트 래퍼
export const withLoadingState = (Component) => {
  return ({ isLoading, error, onRetry, ...props }) => {
    if (error) {
      return <NetworkError error={error} onRetry={onRetry} />;
    }

    if (isLoading) {
      return <SmartLoading message="Loading content..." />;
    }

    return <Component {...props} />;
  };
};

export default SmartLoading; 