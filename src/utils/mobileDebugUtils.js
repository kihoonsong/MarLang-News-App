// 모바일 환경에서 디버깅을 위한 유틸리티 함수들

// 모바일 환경 감지
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// 터치 이벤트 지원 여부 확인
export const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// 모바일 브라우저 정보 수집
export const getMobileInfo = () => {
  return {
    userAgent: navigator.userAgent,
    isMobile: isMobileDevice(),
    isTouch: isTouchDevice(),
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1
  };
};

// 카테고리 클릭 이벤트 디버깅
export const debugCategoryClick = (category, event, action = 'click') => {
  if (import.meta.env.DEV) {
    console.group(`🔍 Category ${action} Debug`);
    console.log('Category:', category);
    console.log('Event:', event);
    console.log('Mobile Info:', getMobileInfo());
    console.log('Event Type:', event?.type);
    console.log('Target:', event?.target);
    console.log('Current Target:', event?.currentTarget);
    console.log('Touch Points:', event?.touches?.length || 0);
    console.log('Timestamp:', event?.timeStamp);
    console.log('Is Trusted:', event?.isTrusted);
    console.log('Cancelable:', event?.cancelable);
    console.log('Default Prevented:', event?.defaultPrevented);
    console.groupEnd();
  }
};

// 에러 리포팅 (모바일 환경에서 발생하는 에러 추적)
export const reportMobileError = (error, context = {}) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    mobileInfo: getMobileInfo(),
    context
  };
  
  if (import.meta.env.DEV) {
    console.error('🚨 Mobile Error Report:', errorInfo);
  }
  
  // 프로덕션에서는 에러 리포팅 서비스로 전송 가능
  // 예: Sentry, LogRocket 등
  
  return errorInfo;
};

// 성능 모니터링
export const measurePerformance = (name, fn) => {
  const start = performance.now();
  
  try {
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const end = performance.now();
        if (import.meta.env.DEV) {
          console.log(`⏱️ ${name} took ${end - start} milliseconds`);
        }
      });
    } else {
      const end = performance.now();
      if (import.meta.env.DEV) {
        console.log(`⏱️ ${name} took ${end - start} milliseconds`);
      }
      return result;
    }
  } catch (error) {
    const end = performance.now();
    reportMobileError(error, { 
      operation: name, 
      duration: end - start 
    });
    throw error;
  }
};

// 메모리 사용량 모니터링 (지원되는 브라우저에서만)
export const getMemoryInfo = () => {
  if (performance.memory) {
    return {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
    };
  }
  return null;
};

// 네트워크 상태 확인
export const getNetworkInfo = () => {
  if (navigator.connection) {
    return {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt,
      saveData: navigator.connection.saveData
    };
  }
  return null;
};

// 터치 이벤트 디바운싱 (중복 이벤트 방지)
export const createTouchDebouncer = (delay = 300) => {
  let lastTouchTime = 0;
  
  return (callback) => {
    return (event) => {
      const now = Date.now();
      if (now - lastTouchTime > delay) {
        lastTouchTime = now;
        return callback(event);
      }
    };
  };
};

// 스크롤 상태 감지
export const isScrolling = (() => {
  let scrolling = false;
  let scrollTimer = null;
  
  const handleScroll = () => {
    scrolling = true;
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      scrolling = false;
    }, 150);
  };
  
  // 스크롤 이벤트 리스너 등록
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', handleScroll, { passive: true });
  }
  
  return () => scrolling;
})();

// 안전한 네비게이션 함수 (모바일 최적화)
export const safeNavigate = (navigate, url, delay = 0) => {
  try {
    if (delay > 0) {
      setTimeout(() => {
        navigate(url);
      }, delay);
    } else {
      navigate(url);
    }
  } catch (error) {
    reportMobileError(error, { action: 'navigation', url });
    // 폴백: 직접 페이지 이동
    window.location.href = url;
  }
};

// 종합 디버그 정보 수집
export const collectDebugInfo = () => {
  return {
    mobile: getMobileInfo(),
    memory: getMemoryInfo(),
    network: getNetworkInfo(),
    timestamp: new Date().toISOString(),
    url: window.location.href,
    isScrolling: isScrolling()
  };
};