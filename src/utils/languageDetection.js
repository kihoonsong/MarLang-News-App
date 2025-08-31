export const detectUserLanguage = () => {
  // 브라우저 언어 감지 (우선순위: navigator.language > navigator.languages[0] > 기본값)
  const browserLanguage = navigator.language || navigator.languages?.[0] || 'en';
  
  // 언어 코드 정규화 (예: 'ko-KR' -> 'ko', 'en-US' -> 'en')
  const normalizedLanguage = browserLanguage.toLowerCase().split('-')[0];
  
  // 지원하는 언어 목록
  const supportedLanguages = ['ko', 'ja', 'zh', 'en'];
  
  // 지원하는 언어인지 확인
  if (supportedLanguages.includes(normalizedLanguage)) {
    return normalizedLanguage;
  }
  
  // 특별한 경우 처리
  if (normalizedLanguage === 'zh' || browserLanguage.includes('cn')) {
    return 'zh';
  }
  
  // 기본값은 영어
  return 'en';
};

export const getDefaultLanguageSettings = () => {
  const detectedLanguage = detectUserLanguage();
  
  return {
    language: detectedLanguage,
    translationLanguage: detectedLanguage
  };
};