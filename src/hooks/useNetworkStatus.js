import React, { useState, useEffect } from 'react';

// 전역 네트워크 상태 캐시 (중복 요청 방지)
let globalNetworkCache = {
  lastCheck: 0,
  isOnline: true,
  checkInProgress: false
};

// 네트워크 상태 감지 Hook
export const useNetworkStatus = () => {
  // 더 관용적인 초기값 - 기본적으로 온라인으로 가정
  const [isOnline, setIsOnline] = useState(true);
  const [networkStrength, setNetworkStrength] = useState('unknown');
  const [connectionType, setConnectionType] = useState('unknown');

  // 실제 네트워크 연결 확인 함수 - 요청 빈도 제한 및 최적화
  const checkActualConnection = async () => {
    const now = Date.now();
    const CACHE_DURATION = 5000; // 5초 캐시
    
    // 캐시된 결과가 있고 최근 것이면 재사용
    if (now - globalNetworkCache.lastCheck < CACHE_DURATION) {
      return globalNetworkCache.isOnline;
    }
    
    // 이미 확인 중이면 대기
    if (globalNetworkCache.checkInProgress) {
      return globalNetworkCache.isOnline;
    }
    
    globalNetworkCache.checkInProgress = true;
    
    try {
      // 더 가벼운 리소스 사용 및 캐시 허용으로 리소스 부족 방지
      const response = await fetch('/favicon.png', { 
        method: 'HEAD',
        cache: 'force-cache', // 캐시 사용으로 네트워크 요청 최소화
        signal: AbortSignal.timeout(2000) // 타임아웃 단축
      });
      
      const result = response.ok;
      globalNetworkCache.isOnline = result;
      globalNetworkCache.lastCheck = now;
      return result;
    } catch (error) {
      // ERR_INSUFFICIENT_RESOURCES 오류 시 더 관용적으로 처리
      if (error.message.includes('INSUFFICIENT_RESOURCES') || 
          error.message.includes('ERR_INSUFFICIENT_RESOURCES')) {
        console.log('🔗 Resource limit reached, assuming online');
        globalNetworkCache.isOnline = true;
        globalNetworkCache.lastCheck = now;
        return true; // 리소스 부족 시 온라인으로 가정
      }
      console.log('🔗 Actual connection check failed:', error.message);
      globalNetworkCache.isOnline = false;
      globalNetworkCache.lastCheck = now;
      return false;
    } finally {
      globalNetworkCache.checkInProgress = false;
    }
  };

    // 초기 네트워크 상태 확인 및 디버깅
  React.useEffect(() => {
    console.log('🔍 Network Status Debug:', {
      navigatorOnline: navigator.onLine,
      userAgent: navigator.userAgent,
      connection: navigator.connection || navigator.mozConnection || navigator.webkitConnection
    });

    // 초기 상태를 navigator.onLine 기반으로 설정
    setIsOnline(navigator.onLine);

    // 실제 연결 상태 확인 (초기 로드 시에만)
    if (globalNetworkCache.lastCheck === 0) {
      checkActualConnection().then(actuallyOnline => {
        console.log('🌐 Actual connection status:', actuallyOnline);
        
        if (!navigator.onLine && actuallyOnline) {
          console.warn('⚠️ navigator.onLine is false but actual connection works - fixing state');
          setIsOnline(true);
        } else if (navigator.onLine && !actuallyOnline) {
          console.warn('⚠️ navigator.onLine is true but actual connection failed');
          // navigator.onLine이 true이면 일단 믿어보기 (개발 환경에서는 false positive 많음)
          setIsOnline(true);
        } else {
          setIsOnline(actuallyOnline);
        }
      }).catch(() => {
        // 연결 확인 실패 시 navigator.onLine 기반으로 결정
        console.log('🔗 Connection check failed, using navigator.onLine');
        setIsOnline(navigator.onLine);
      });
    } else {
      // 캐시된 상태 사용
      setIsOnline(globalNetworkCache.isOnline);
    }

    // 전역 디버그 함수 등록
    window.debugNetworkStatus = () => {
      console.log('🔍 Current Network Status:', {
        navigatorOnline: navigator.onLine,
        reactState: isOnline,
        networkStrength,
        connectionType
      });
      
      checkActualConnection().then(actuallyOnline => {
        console.log('🌐 Actual connection test:', actuallyOnline);
      });
    };

    window.forceOnlineStatus = () => {
      console.log('🔧 Forcing online status...');
      setIsOnline(true);
    };

    window.disableNetworkCheck = () => {
      console.log('🔧 Disabling network checks...');
      globalNetworkCache.lastCheck = Date.now();
      globalNetworkCache.isOnline = true;
      setIsOnline(true);
    };
  }, [isOnline, networkStrength, connectionType]);

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