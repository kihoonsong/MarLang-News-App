import React, { useEffect } from 'react';
import { useEnhancedToast } from './EnhancedToastProvider';
import { reportMobileError, isMobileDevice, collectDebugInfo } from '../utils/mobileDebugUtils';

const MobileErrorHandler = () => {
  const { error: showError } = useEnhancedToast();

  useEffect(() => {
    // 모바일 환경에서만 추가 에러 핸들링 활성화
    if (!isMobileDevice()) return;

    // 카테고리 페이지 로딩 에러 특별 처리
    const handleCategoryPageError = (error) => {
      const currentPath = window.location.pathname;
      const isCategoryPage = currentPath.match(/^\/[a-z-]+$/);
      
      if (isCategoryPage) {
        console.error('카테고리 페이지 에러:', error);
        showError('카테고리 페이지 로딩 중 오류가 발생했습니다. 홈으로 이동합니다.', {
          duration: 3000,
          group: 'category-error'
        });
        
        // 3초 후 홈으로 자동 이동
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    };

    // 터치 이벤트 에러 핸들링
    const handleTouchError = (event) => {
      try {
        if (event.target && event.target.tagName) {
          console.warn('Touch event error on:', event.target.tagName, event.target.className);
        }
      } catch (error) {
        reportMobileError(error, { context: 'touch-event-handler' });
      }
    };

    // 스크롤 에러 핸들링
    const handleScrollError = (event) => {
      try {
        // 스크롤 관련 에러 처리
        if (event.target && event.target.scrollTop !== undefined) {
          // 스크롤 위치가 비정상적인 경우 복구
          if (event.target.scrollTop < 0) {
            event.target.scrollTop = 0;
          }
        }
      } catch (error) {
        reportMobileError(error, { context: 'scroll-event-handler' });
      }
    };

    // 리사이즈 에러 핸들링
    const handleResizeError = () => {
      try {
        // 뷰포트 변경 시 레이아웃 재계산
        if (window.innerWidth !== document.documentElement.clientWidth) {
          // 뷰포트 불일치 해결
          document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
        }
      } catch (error) {
        reportMobileError(error, { context: 'resize-event-handler' });
      }
    };

    // 네트워크 에러 핸들링
    const handleNetworkError = () => {
      if (!navigator.onLine) {
        showError('Network connection lost. Please check your internet connection.', {
          duration: 5000,
          group: 'network-error'
        });
      }
    };

    // 메모리 부족 경고
    const checkMemoryUsage = () => {
      if (performance.memory) {
        const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
        if (memoryUsage > 0.9) {
          console.warn('High memory usage detected:', memoryUsage);
          showError('High memory usage detected. Consider refreshing the page.', {
            duration: 8000,
            group: 'memory-warning'
          });
        }
      }
    };

    // 이벤트 리스너 등록
    document.addEventListener('touchstart', handleTouchError, { passive: true });
    document.addEventListener('scroll', handleScrollError, { passive: true });
    window.addEventListener('resize', handleResizeError, { passive: true });
    window.addEventListener('online', () => showError.dismiss('network-error'));
    window.addEventListener('offline', handleNetworkError);

    // 메모리 사용량 주기적 체크 (30초마다)
    const memoryCheckInterval = setInterval(checkMemoryUsage, 30000);

    // 전역 에러 핸들러에 카테고리 페이지 처리 추가
    const originalErrorHandler = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      if (error) {
        handleCategoryPageError(error);
      }
      if (originalErrorHandler) {
        return originalErrorHandler(message, source, lineno, colno, error);
      }
    };

    // Promise rejection 핸들러에도 카테고리 페이지 처리 추가
    const originalUnhandledRejection = window.onunhandledrejection;
    window.onunhandledrejection = (event) => {
      if (event.reason) {
        handleCategoryPageError(event.reason);
      }
      if (originalUnhandledRejection) {
        return originalUnhandledRejection(event);
      }
    };

    // 초기 디버그 정보 수집
    if (import.meta.env.DEV) {
      console.log('📱 Mobile Error Handler initialized:', collectDebugInfo());
    }

    // 정리 함수
    return () => {
      document.removeEventListener('touchstart', handleTouchError);
      document.removeEventListener('scroll', handleScrollError);
      window.removeEventListener('resize', handleResizeError);
      window.removeEventListener('online', () => showError.dismiss('network-error'));
      window.removeEventListener('offline', handleNetworkError);
      clearInterval(memoryCheckInterval);
      
      // 전역 에러 핸들러 복원
      window.onerror = originalErrorHandler;
      window.onunhandledrejection = originalUnhandledRejection;
    };
  }, [showError]);

  return null; // 렌더링하지 않음
};

export default MobileErrorHandler;