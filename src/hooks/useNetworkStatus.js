import { useState, useEffect } from 'react';

// 네트워크 상태 감지 Hook
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkStrength, setNetworkStrength] = useState('unknown');
  const [connectionType, setConnectionType] = useState('unknown');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('🌐 Network: Back online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('🔌 Network: Gone offline');
    };

    // 기본 온라인/오프라인 이벤트
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Network Information API (실험적 - Chrome/Edge)
    const updateNetworkInfo = () => {
      if ('connection' in navigator) {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (connection) {
          setConnectionType(connection.effectiveType || 'unknown');
          
          // 연결 강도 추정
          const downlink = connection.downlink;
          if (downlink >= 10) {
            setNetworkStrength('excellent');
          } else if (downlink >= 1.5) {
            setNetworkStrength('good');
          } else if (downlink >= 0.5) {
            setNetworkStrength('fair');
          } else {
            setNetworkStrength('poor');
          }
        }
      }
    };

    updateNetworkInfo();

    // 연결 변경 감지
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection && connection.addEventListener) {
        connection.addEventListener('change', updateNetworkInfo);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('connection' in navigator) {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection && connection.removeEventListener) {
          connection.removeEventListener('change', updateNetworkInfo);
        }
      }
    };
  }, []);

  return {
    isOnline,
    networkStrength,
    connectionType,
    isSlowConnection: networkStrength === 'poor' || connectionType === 'slow-2g'
  };
};

// 네트워크 요청 재시도 Hook
export const useRetryableRequest = (requestFn, maxRetries = 3, delay = 1000) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const { isOnline } = useNetworkStatus();

  const executeRequest = async (retryNumber = 0) => {
    if (!isOnline) {
      setError(new Error('No internet connection'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await requestFn();
      setData(result);
      setRetryCount(0);
    } catch (err) {
      console.error(`Request failed (attempt ${retryNumber + 1}):`, err);
      
      // 네트워크 오류인지 확인
      const isNetworkError = err.name === 'TypeError' || 
                            err.message.includes('fetch') || 
                            err.message.includes('network') ||
                            err.code === 'NETWORK_ERROR';

      if (isNetworkError && retryNumber < maxRetries) {
        // 지수 백오프로 재시도
        const retryDelay = delay * Math.pow(2, retryNumber);
        console.log(`⏱️ Retrying in ${retryDelay}ms...`);
        
        setTimeout(() => {
          setRetryCount(retryNumber + 1);
          executeRequest(retryNumber + 1);
        }, retryDelay);
      } else {
        setError(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const retry = () => {
    executeRequest();
  };

  const reset = () => {
    setData(null);
    setError(null);
    setIsLoading(false);
    setRetryCount(0);
  };

  return {
    data,
    error,
    isLoading,
    retryCount,
    executeRequest,
    retry,
    reset
  };
};

export default useNetworkStatus; 