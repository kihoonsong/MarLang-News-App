export const adsenseConfig = {
  // 구글 애드센스 클라이언트 ID
  CLIENT_ID: 'ca-pub-6930662244421305',
  
  // 광고 슬롯 설정 (애드센스 승인 후 설정 예정)
  adSlots: {
    // 기사 사이 배너 광고
    articleBanner: {
      slot: null, // 애드센스 승인 후 설정
      format: 'horizontal',
      responsive: true,
    },
    // 사이드바 광고
    sidebar: {
      slot: null, // 애드센스 승인 후 설정
      format: 'vertical',
      responsive: true,
    },
    // 검색 결과 광고
    searchResults: {
      slot: null, // 애드센스 승인 후 설정
      format: 'auto',
      responsive: true,
    },
    // 단어장 페이지 광고
    wordbook: {
      slot: null, // 애드센스 승인 후 설정
      format: 'auto',
      responsive: true,
    }
  },
  
  // 광고 표시 제어
  displayRules: {
    // 로그인 사용자에게 광고 표시 여부
    showToLoggedInUsers: true,
    // 프리미엄 사용자에게 광고 표시 여부
    showToPremiumUsers: false,
    // 모바일에서 광고 표시 여부
    showOnMobile: true,
  },
  
  // 개발 환경 설정
  development: {
    // 개발 모드에서 애드센스 비활성화 (애드센스 승인 전이므로)
    enabled: false,
    // 테스트 광고 사용 여부
    useTestAds: false,
  }
};

// 환경별 설정 함수
export const getAdsenseConfig = () => {
  const isDevelopment = import.meta.env.MODE === 'development' || import.meta.env.DEV;
  
  return {
    ...adsenseConfig,
    // 애드센스 승인 전까지는 완전히 비활성화 (애드센스 정책 준수)
    enabled: false, // 승인 후 true로 변경
    clientId: isDevelopment && adsenseConfig.development.useTestAds 
      ? 'ca-pub-TEST_CLIENT_ID' 
      : adsenseConfig.CLIENT_ID,
  };
};

// 광고 로드 상태 관리
let adsenseTried = false;
let adsensePromise = null;
let lastErrorTime = 0;
const ERROR_THROTTLE = 10000; // 10초

// 에러 로그 throttle 함수
const logErrorThrottled = (error) => {
  const now = Date.now();
  if (now - lastErrorTime > ERROR_THROTTLE) {
    console.error('AdSense 로드 실패:', error);
    lastErrorTime = now;
  }
};

// 광고 로드 함수 (보안 강화 및 무한 재시도 방지)
export const loadAdsenseScript = () => {
  // 이미 시도했거나 진행 중인 경우
  if (adsenseTried && adsensePromise) {
    return adsensePromise;
  }
  
  if (adsenseTried) {
    return Promise.reject(new Error('AdSense loading already attempted'));
  }
  
  // 첫 번째 시도 마킹
  adsenseTried = true;
  
  adsensePromise = new Promise((resolve, reject) => {
    if (window.adsbygoogle) {
      resolve();
      return;
    }
    
    const config = getAdsenseConfig();
    
    // 클라이언트 ID 검증
    if (!config.clientId || !config.clientId.startsWith('ca-pub-')) {
      const error = new Error('Invalid AdSense client ID');
      logErrorThrottled(error);
      reject(error);
      return;
    }
    
    const script = document.createElement('script');
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.clientId}`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    
    // CSP 호환성을 위한 nonce 설정 (있을 경우)
    const nonce = document.querySelector('meta[name="csp-nonce"]')?.getAttribute('content');
    if (nonce) {
      script.nonce = nonce;
    }
    
    // 타임아웃 설정으로 무한 대기 방지
    const timeoutId = setTimeout(() => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      const error = new Error('AdSense script loading timeout (10s)');
      logErrorThrottled(error);
      reject(error);
    }, 10000);
    
    script.onload = () => {
      clearTimeout(timeoutId);
      if (import.meta.env.DEV) {
        console.log('✅ AdSense script loaded successfully');
      }
      resolve();
    };
    
    script.onerror = () => {
      clearTimeout(timeoutId);
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      const error = new Error('AdSense script loading failed - likely blocked by ad blocker or CSP');
      logErrorThrottled(error);
      reject(error);
    };
    
    document.head.appendChild(script);
  });
  
  return adsensePromise;
};

// 광고 차단 감지 함수
export const isAdBlockerActive = () => {
  return adsenseTried && !window.adsbygoogle;
}; 