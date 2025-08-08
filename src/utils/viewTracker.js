// 조회수 추적 유틸리티 - 비로그인 사용자 포함

// 세션 기반 중복 조회 방지 (같은 세션에서 같은 기사 중복 조회 방지)
const SESSION_VIEWED_KEY = 'marlang_session_viewed_articles';

// 세션에서 이미 조회한 기사인지 확인
export const isAlreadyViewedInSession = (articleId) => {
  try {
    const viewedArticles = JSON.parse(sessionStorage.getItem(SESSION_VIEWED_KEY) || '[]');
    return viewedArticles.includes(articleId);
  } catch (error) {
    console.warn('세션 조회 기록 확인 실패:', error);
    return false;
  }
};

// 세션에 조회한 기사 기록
export const markAsViewedInSession = (articleId) => {
  try {
    const viewedArticles = JSON.parse(sessionStorage.getItem(SESSION_VIEWED_KEY) || '[]');
    if (!viewedArticles.includes(articleId)) {
      viewedArticles.push(articleId);
      // 최대 100개 기사만 기록 (메모리 절약)
      const limitedArticles = viewedArticles.slice(-100);
      sessionStorage.setItem(SESSION_VIEWED_KEY, JSON.stringify(limitedArticles));
      return true; // 새로운 조회
    }
    return false; // 이미 조회함
  } catch (error) {
    console.warn('세션 조회 기록 저장 실패:', error);
    return true; // 에러 시 조회수 증가 허용
  }
};

// 봇 감지 (간단한 방식)
export const isBot = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const botPatterns = [
    'bot', 'crawler', 'spider', 'scraper', 'facebook', 'twitter',
    'linkedin', 'whatsapp', 'telegram', 'googlebot', 'bingbot'
  ];
  
  return botPatterns.some(pattern => userAgent.includes(pattern)) ||
         navigator.webdriver ||
         window.phantom ||
         window._phantom;
};

// 실제 사용자 조회인지 확인
export const isRealUserView = (articleId) => {
  // 봇 감지
  if (isBot()) {
    if (import.meta.env.DEV) {
      console.log('🤖 봇 감지 - 조회수 증가 안함');
    }
    return false;
  }

  // 세션 중복 확인
  if (isAlreadyViewedInSession(articleId)) {
    if (import.meta.env.DEV) {
      console.log('🔄 세션 중복 조회 - 조회수 증가 안함');
    }
    return false;
  }

  return true;
};

// 조회수 추적 (로그인/비로그인 사용자 모두)
export const trackArticleView = async (articleId, incrementViewsFunction) => {
  if (!articleId || typeof incrementViewsFunction !== 'function') {
    console.warn('❌ trackArticleView: 잘못된 매개변수');
    return false;
  }

  // 실제 사용자 조회인지 확인
  if (!isRealUserView(articleId)) {
    return false;
  }

  try {
    // 조회수 증가
    const success = await incrementViewsFunction(articleId);
    
    if (success) {
      // 세션에 조회 기록
      markAsViewedInSession(articleId);
      
      if (import.meta.env.DEV) {
        console.log(`✅ 조회수 증가 성공: ${articleId}`);
      }
      
      return true;
    }
  } catch (error) {
    console.error('조회수 추적 실패:', error);
  }
  
  return false;
};

// 개발용 - 세션 조회 기록 초기화
export const clearSessionViewHistory = () => {
  try {
    sessionStorage.removeItem(SESSION_VIEWED_KEY);
    console.log('🧹 세션 조회 기록 초기화됨');
  } catch (error) {
    console.warn('세션 조회 기록 초기화 실패:', error);
  }
};

// 개발용 - 현재 세션 조회 기록 확인
export const getSessionViewHistory = () => {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_VIEWED_KEY) || '[]');
  } catch (error) {
    console.warn('세션 조회 기록 확인 실패:', error);
    return [];
  }
};

// 개발 환경에서 전역 함수로 노출
if (import.meta.env.DEV) {
  window.marlangViewTracker = {
    getSessionHistory: getSessionViewHistory,
    clearSessionHistory: clearSessionViewHistory,
    isBot: isBot,
    checkIfViewed: isAlreadyViewedInSession
  };
  
  console.log('🔧 개발자 도구에서 window.marlangViewTracker 사용 가능');
}