export const adsenseConfig = {
  // 구글 애드센스 클라이언트 ID
  CLIENT_ID: 'ca-pub-6930662244421305',
  
  // 광고 슬롯 설정
  adSlots: {
    // 기사 사이 배너 광고
    articleBanner: {
      slot: 'YOUR_SLOT_ID_1',
      format: 'horizontal',
      responsive: true,
    },
    // 사이드바 광고
    sidebar: {
      slot: 'YOUR_SLOT_ID_2', 
      format: 'vertical',
      responsive: true,
    },
    // 검색 결과 광고
    searchResults: {
      slot: 'YOUR_SLOT_ID_3',
      format: 'auto',
      responsive: true,
    },
    // 단어장 페이지 광고
    wordbook: {
      slot: 'YOUR_SLOT_ID_4',
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
    // 개발 모드에서 애드센스 활성화 (실제 클라이언트 ID 설정됨)
    enabled: true,
    // 테스트 광고 사용 여부
    useTestAds: false,
  }
};

// 환경별 설정 함수
export const getAdsenseConfig = () => {
  const isDevelopment = import.meta.env.MODE === 'development' || import.meta.env.DEV;
  
  return {
    ...adsenseConfig,
    enabled: isDevelopment ? adsenseConfig.development.enabled : true,
    clientId: isDevelopment && adsenseConfig.development.useTestAds 
      ? 'ca-pub-TEST_CLIENT_ID' 
      : adsenseConfig.CLIENT_ID,
  };
};

// 광고 로드 함수 (보안 강화)
export const loadAdsenseScript = () => {
  return new Promise((resolve, reject) => {
    if (window.adsbygoogle) {
      resolve();
      return;
    }
    
    const config = getAdsenseConfig();
    
    // 클라이언트 ID 검증
    if (!config.clientId || !config.clientId.startsWith('ca-pub-')) {
      reject(new Error('Invalid AdSense client ID'));
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
      document.head.removeChild(script);
      reject(new Error('AdSense script loading timeout (10s)'));
    }, 10000);
    
    script.onload = () => {
      clearTimeout(timeoutId);
      console.log('✅ AdSense script loaded successfully');
      resolve();
    };
    
    script.onerror = () => {
      clearTimeout(timeoutId);
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      reject(new Error('AdSense script loading failed - likely blocked by ad blocker or CSP'));
    };
    
    document.head.appendChild(script);
  });
}; 