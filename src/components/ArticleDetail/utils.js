// ArticleDetail 관련 유틸리티 함수들

/**
 * 기사 내용에서 3개 레벨 생성 (개선된 버전)
 */
export const generateLevelsFromContent = (article) => {
  console.log('🔧 기사 레벨 생성:', article.title);
  console.log('🔧 원본 content 타입:', typeof article.content);
  console.log('🔧 원본 content:', article.content);
  
  // 안전한 null 체크 추가
  if (!article) {
    console.error('❌ article 객체가 없습니다');
    return {
      1: { title: 'Level 1 - Beginner', content: 'No content available' },
      2: { title: 'Level 2 - Intermediate', content: 'No content available' },
      3: { title: 'Level 3 - Advanced', content: 'No content available' }
    };
  }

  // 새로운 3개 버전 구조를 그대로 사용
  if (article.content && typeof article.content === 'object') {
    const levels = {
      1: {
        title: 'Level 1 - Beginner',
        content: article.content.beginner || ''
      },
      2: {
        title: 'Level 2 - Intermediate', 
        content: article.content.intermediate || ''
      },
      3: {
        title: 'Level 3 - Advanced',
        content: article.content.advanced || ''
      }
    };
    console.log('✅ 객체 형태 레벨 생성 완료:', levels);
    return levels;
  } else {
    // 기존 단일 문자열 구조인 경우 모든 소스에서 콘텐츠 찾기
    const baseContent = article.content || article.summary || article.description || 'No content available';
    console.log('📝 기본 콘텐츠 사용:', baseContent.substring(0, 100), '...');
    
    const levels = {
      1: {
        title: 'Level 1 - Beginner',
        content: baseContent
      },
      2: {
        title: 'Level 2 - Intermediate',
        content: baseContent
      },
      3: {
        title: 'Level 3 - Advanced',
        content: baseContent
      }
    };
    console.log('✅ 단일 형태 레벨 생성 완료:', Object.keys(levels).map(k => ({level: k, contentLength: levels[k].content.length})));
    return levels;
  }
};

/**
 * 단어 정리 (구두점 제거)
 */
export const cleanWord = (word) => {
  if (!word) return '';
  return word.replace(/[^\w']/g, '').toLowerCase();
};

/**
 * 단어가 하이라이트되어 있는지 확인
 */
export const isWordHighlighted = (word, highlightedWords) => {
  const clean = cleanWord(word);
  return highlightedWords.some(hw => hw.word.toLowerCase() === clean);
};

/**
 * 읽기 시간 계산
 */
export const calculateReadingTime = (content, wordsPerMinute = 200) => {
  if (!content) return 0;
  
  const wordCount = content.split(/\s+/).filter(word => word.trim()).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
};

/**
 * 단어 수 계산
 */
export const calculateWordCount = (content) => {
  if (!content) return 0;
  return content.split(/\s+/).filter(word => word.trim()).length;
};

/**
 * 날짜 포맷팅
 */
export const formatPublishDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('날짜 포맷 에러:', error);
    return dateString;
  }
};

/**
 * 카테고리별 색상 매핑
 */
export const getCategoryColor = (category) => {
  const colors = {
    'Technology': 'primary',
    'Science': 'success',
    'Business': 'warning',
    'Culture': 'secondary',
    'Sports': 'error',
    'Education': 'info'
  };
  return colors[category] || 'default';
};

/**
 * 레벨별 색상 매핑
 */
export const getLevelColor = (level) => {
  const levelStr = typeof level === 'string' ? level : String(level);
  
  switch(levelStr.toLowerCase()) {
    case '1':
    case 'beginner':
      return 'success';
    case '2':
    case 'intermediate':
      return 'warning';
    case '3':
    case 'advanced':
      return 'error';
    default:
      return 'default';
  }
};

/**
 * TTS 상태 관리를 위한 초기 상태
 */
export const initialTTSState = {
  isPlaying: false,
  isLoading: false,
  currentSentence: -1,
  totalSentences: 0
};

/**
 * 언어 설정 매핑
 */
export const languageLabels = {
  'en': 'English',
  'ko': '한국어',
  'ja': '日本語',
  'zh': '中文',
  'es': 'Español',
  'fr': 'Français',
  'de': 'Deutsch',
  'it': 'Italiano',
  'pt': 'Português',
  'ru': 'Русский'
};

/**
 * 단어장에 추가할 데이터 생성
 */
export const createWordbookEntry = (word, definition, language) => {
  return {
    word: word.toLowerCase().trim(),
    definition: definition.definition || '',
    translation: definition.translation || '',
    partOfSpeech: definition.partOfSpeech || '',
    examples: definition.examples || [],
    pronunciation: definition.pronunciation || '',
    language: language || 'en',
    addedAt: new Date().toISOString(),
    reviewCount: 0,
    masteryLevel: 0
  };
};

/**
 * 로컬 스토리지 키 상수
 */
export const STORAGE_KEYS = {
  HIGHLIGHTED_WORDS: 'highlightedWords',
  ARTICLE_PROGRESS: 'articleProgress',
  USER_PREFERENCES: 'userPreferences',
  TTS_SETTINGS: 'ttsSettings'
};

/**
 * 에러 메시지 매핑
 */
export const ERROR_MESSAGES = {
  ARTICLE_NOT_FOUND: 'Article not found',
  CONTENT_LOADING_FAILED: 'Failed to load article content',
  TTS_NOT_SUPPORTED: 'Text-to-speech is not supported in this browser',
  WORD_DEFINITION_FAILED: 'Failed to fetch word definition',
  NETWORK_ERROR: 'Network connection error'
};

/**
 * 브라우저 지원 여부 확인
 */
export const checkBrowserSupport = () => {
  return {
    speechSynthesis: 'speechSynthesis' in window,
    webAudio: 'AudioContext' in window || 'webkitAudioContext' in window,
    localStorage: 'localStorage' in window,
    clipboard: 'clipboard' in navigator,
    share: 'share' in navigator
  };
};