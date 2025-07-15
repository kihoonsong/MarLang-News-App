export const detectUserLanguage = () => {
  const browserLanguage = navigator.language || navigator.languages?.[0] || 'en';
  
  if (browserLanguage.startsWith('ko')) {
    return 'ko';
  } else if (browserLanguage.startsWith('ja')) {
    return 'ja';
  } else {
    return 'en';
  }
};

export const getDefaultLanguageSettings = () => {
  const detectedLanguage = detectUserLanguage();
  
  return {
    language: detectedLanguage,
    translationLanguage: detectedLanguage
  };
};