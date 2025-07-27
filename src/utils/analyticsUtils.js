// 정확한 사용자 행동 추적을 위한 유틸리티

// 실제 사용자 클릭만 추적
export const trackRealUserClick = (eventName, parameters = {}) => {
  // 봇 감지
  const isBot = navigator.webdriver || 
                window.phantom || 
                window._phantom ||
                /bot|crawler|spider|crawling/i.test(navigator.userAgent);
  
  if (!isBot && window.gtag) {
    window.gtag('event', eventName, {
      ...parameters,
      user_type: 'human',
      timestamp: Date.now()
    });
  }
};

// 페이지 체류 시간 추적 (실제 사용자 판별)
export const trackEngagement = (pageName) => {
  let startTime = Date.now();
  let isActive = true;
  
  // 페이지 이탈 시 체류 시간 계산
  const handleBeforeUnload = () => {
    const engagementTime = Date.now() - startTime;
    
    // 3초 이상 체류한 경우만 실제 사용자로 간주
    if (engagementTime > 3000 && isActive) {
      trackRealUserClick('page_engagement', {
        page_name: pageName,
        engagement_time: Math.round(engagementTime / 1000)
      });
    }
  };
  
  // 사용자 활동 감지
  const handleUserActivity = () => {
    isActive = true;
    startTime = Date.now();
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('click', handleUserActivity);
  window.addEventListener('scroll', handleUserActivity);
  window.addEventListener('keydown', handleUserActivity);
  
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('click', handleUserActivity);
    window.removeEventListener('scroll', handleUserActivity);
    window.removeEventListener('keydown', handleUserActivity);
  };
};

// 실제 아티클 읽기 추적
export const trackArticleRead = (articleId, title) => {
  let readStartTime = Date.now();
  let scrollDepth = 0;
  
  const handleScroll = () => {
    const scrollPercent = Math.round(
      (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
    );
    scrollDepth = Math.max(scrollDepth, scrollPercent);
  };
  
  const handleReadComplete = () => {
    const readTime = Date.now() - readStartTime;
    
    // 30초 이상 읽고 50% 이상 스크롤한 경우만 실제 읽기로 간주
    if (readTime > 30000 && scrollDepth > 50) {
      trackRealUserClick('article_read', {
        article_id: articleId,
        article_title: title,
        read_time: Math.round(readTime / 1000),
        scroll_depth: scrollDepth
      });
    }
  };
  
  window.addEventListener('scroll', handleScroll);
  window.addEventListener('beforeunload', handleReadComplete);
  
  return () => {
    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener('beforeunload', handleReadComplete);
  };
};