/**
 * 기기 감지 유틸리티
 * iPadOS 13+ 데스크톱 UA 문제 해결 및 정확한 기기 감지
 */

/**
 * iPad 데스크톱 UA 감지 (iPadOS 13+ 문제 해결)
 * iPadOS 13부터 Safari는 데스크톱 UA를 사용하므로 터치 지원 여부로 판단
 */
export const isIPadDesktopUA = 
  /Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;

/**
 * 향상된 iOS 기기 감지
 */
export const isIPhone = /iPhone/.test(navigator.userAgent);
export const isIPad = /iPad/.test(navigator.userAgent) || isIPadDesktopUA;
export const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || isIPadDesktopUA;

/**
 * 기타 기기 감지
 */
export const isAndroid = /Android/i.test(navigator.userAgent);
export const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || isIPadDesktopUA;

/**
 * 플랫폼별 TTS 최적화 설정값 반환
 * @returns {Object} - 플랫폼별 최적화 설정
 */
export const getTTSOptimizationSettings = () => {
  const platform = (() => {
    if (isIPhone) return 'iPhone';
    if (isIPad) return 'iPad';
    if (isIOS) return 'iOS';
    if (isAndroid) return 'Android';
    return 'Desktop';
  })();

  // 플랫폼별 최적화 설정
  const settings = {
    iPhone: {
      sentenceGapMs: 100,
      enableIOSPatch: true,
      enableLongSentenceSplit: true,
      maxWordsPerSentence: 25
    },
    iPad: {
      sentenceGapMs: 150,
      enableIOSPatch: true,
      enableLongSentenceSplit: true,
      maxWordsPerSentence: 30
    },
    iOS: {
      sentenceGapMs: 120,
      enableIOSPatch: true,
      enableLongSentenceSplit: true,
      maxWordsPerSentence: 28
    },
    Android: {
      sentenceGapMs: 80,
      enableIOSPatch: false,
      enableLongSentenceSplit: true,
      maxWordsPerSentence: 35
    },
    Desktop: {
      sentenceGapMs: 50,
      enableIOSPatch: false,
      enableLongSentenceSplit: false,
      maxWordsPerSentence: 40
    }
  };

  return {
    platform,
    ...settings[platform]
  };
};

/**
 * 현재 기기 정보 및 권장 설정 반환 (디버깅용)
 * @returns {Object} - 기기 정보 및 설정
 */
export const getDeviceInfo = () => {
  const optimizationSettings = getTTSOptimizationSettings();
  
  return {
    userAgent: navigator.userAgent,
    deviceDetection: {
      isIPhone,
      isIPad,
      isIOS,
      isAndroid,
      isMobile,
      isIPadDesktopUA
    },
    optimizationSettings,
    hasTouch: 'ontouchend' in document,
    screenSize: {
      width: window.screen.width,
      height: window.screen.height
    }
  };
};

/**
 * 디버깅용: 기기 정보 콘솔 출력
 */
export const debugDeviceInfo = () => {
  if (import.meta.env.DEV) {
    console.group('🔍 기기 감지 정보');
    console.table(getDeviceInfo());
    console.groupEnd();
  }
};

// 개발 환경에서 자동으로 기기 정보 출력
if (import.meta.env.DEV) {
  console.log('📱 기기 감지 유틸리티 로드됨');
  debugDeviceInfo();
}