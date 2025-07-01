import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    console.error('useData must be used within a DataProvider');
    // 기본값 반환하여 에러 방지
    return {
      savedWords: [],
      likedArticles: [],
      userSettings: {},
      viewRecords: [],
      addWord: () => false,
      removeWord: () => {},
      sortWords: () => {},
      toggleLike: () => false,
      isArticleLiked: () => false,
      addLikedArticle: () => false,
      removeLikedArticle: () => false,
      sortLikedArticles: () => {},
      addViewRecord: () => {},
      updateActivityTime: () => {},
      getArticleById: () => null,
      updateSettings: () => {},
      getStats: () => ({ totalWords: 0, totalLikedArticles: 0, wordsThisWeek: 0, favoriteCategory: {} })
    };
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  
  // 단어장 상태
  const [savedWords, setSavedWords] = useState([]);
  
  // 좋아요 상태
  const [likedArticles, setLikedArticles] = useState([]);
  
  // 조회 기록 상태 추가
  const [viewRecords, setViewRecords] = useState([]);
  
  // 사용자 설정
  const [userSettings, setUserSettings] = useState({
    language: 'en',
    translationLanguage: 'ko', // 번역 대상 언어 (기본: 한국어)
    ttsSpeed: 0.8, // TTS 속도 (실제 작동)
    autoSaveWords: true, // 자동 단어 저장 (실제 작동)
    autoPlay: false, // TTS 자동 재생 (실제 작동) 
    highlightSavedWords: true, // 저장된 단어 하이라이트 (실제 작동)
    lastVisited: new Date().toISOString(),
    lastActivityTime: new Date().toISOString()
  });

  // 사용자별 localStorage 키 생성
  const getUserKey = (baseKey) => {
    if (!user?.id) return null;
    return `${baseKey}_${user.id}`;
  };

  // 사용자가 변경될 때마다 해당 사용자의 데이터 로드
  useEffect(() => {
    const loadFromStorage = (key, setter) => {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          setter(JSON.parse(stored));
        } else {
          setter([]); // 데이터가 없으면 빈 배열로 초기화
        }
      } catch (error) {
        console.error(`Error loading ${key} from localStorage:`, error);
        setter([]); // 오류 발생시 빈 배열로 초기화
      }
    };

    const currentUser = user || window.tempUser;
    
    if (currentUser?.id || window.enableGuestMode) {
      // 로그인한 사용자 또는 게스트 모드의 데이터 로드
      const userLabel = user?.name || 'Guest User';
      console.log('👤 사용자별 데이터 로드:', userLabel);
      
      const wordsKey = currentUser?.id 
        ? `marlang_saved_words_${currentUser.id}`
        : 'marlang_saved_words_guest';
      const likedKey = currentUser?.id 
        ? `marlang_liked_articles_${currentUser.id}`
        : 'marlang_liked_articles_guest';
      const settingsKey = currentUser?.id 
        ? `marlang_user_settings_${currentUser.id}`
        : 'marlang_user_settings_guest';
      const viewRecordsKey = currentUser?.id 
        ? `marlang_view_records_${currentUser.id}`
        : 'marlang_view_records_guest';
      
      loadFromStorage(wordsKey, setSavedWords);
      loadFromStorage(likedKey, setLikedArticles);
      loadFromStorage(settingsKey, setUserSettings);
      loadFromStorage(viewRecordsKey, setViewRecords);
    } else {
      // 로그아웃 상태일 때 모든 데이터 초기화
      console.log('🚪 로그아웃 - 데이터 초기화');
      setSavedWords([]);
      setLikedArticles([]);
      setViewRecords([]);
      setUserSettings({
        language: 'en',
        translationLanguage: 'ko',
        ttsSpeed: 0.8,
        autoSaveWords: true,
        autoPlay: false,
        highlightSavedWords: true,
        lastVisited: new Date().toISOString(),
        lastActivityTime: new Date().toISOString()
      });
    }
  }, [user?.id, user?.name, window.enableGuestMode]);

  // 로컬 스토리지에 데이터 저장
  const saveToStorage = (key, data) => {
    if (!key) return; // 키가 없으면 저장하지 않음
    
    try {
      localStorage.setItem(key, JSON.stringify(data));
      console.log('💾 localStorage 저장:', key, data.length || 'object');
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  };

  // 단어 추가 - 뜻, 번역, 예문을 모두 저장
  const addWord = (word, definition, articleId, articleTitle, translation = null, example = null, partOfSpeech = null) => {
    // 게스트 모드 또는 로그인 상태 확인
    const currentUser = user || window.tempUser;
    if (!currentUser?.id && !window.enableGuestMode) {
      console.warn('로그인이 필요합니다');
      return false;
    }

    const newWord = {
      id: Date.now(),
      word: word.toLowerCase(),
      definition, // 영어 정의
      meaning: definition, // 호환성을 위해 meaning 필드도 추가
      translation, // 번역된 뜻 (선택사항)
      example, // 예문 추가
      partOfSpeech, // 품사 추가
      articleId,
      articleTitle,
      addedAt: new Date().toISOString(),
      savedDate: new Date().toISOString(), // 호환성을 위해 savedDate도 추가
      savedAt: new Date().toISOString() // Wordbook에서 사용하는 필드
    };
    
    // 이미 존재하는 단어인지 확인
    const exists = savedWords.some(w => w.word === newWord.word && w.articleId === articleId);
    if (!exists) {
      const updatedWords = [...savedWords, newWord];
      setSavedWords(updatedWords);
      
      // 게스트 모드일 경우 임시 키 사용
      const storageKey = currentUser?.id 
        ? `marlang_saved_words_${currentUser.id}`
        : 'marlang_saved_words_guest';
      
      saveToStorage(storageKey, updatedWords);
      
      console.log('✅ 단어 저장 성공:', newWord.word, '(게스트 모드:', !!window.enableGuestMode, ')');
      return true;
    }
    
    console.log('⚠️ 이미 저장된 단어:', newWord.word);
    return false;
  };

  // 단어 삭제
  const removeWord = (wordId) => {
    const currentUser = user || window.tempUser;
    if (!currentUser?.id && !window.enableGuestMode) return;

    // 삭제할 단어 찾기
    const wordToRemove = savedWords.find(w => w.id === wordId);
    
    if (wordToRemove) {
      console.log('🗑️ 단어 삭제:', wordToRemove.word);
      
      // 해당 기사의 하이라이트에서도 제거
      const highlightKey = `marlang_highlights_${wordToRemove.articleId}`;
      try {
        const stored = localStorage.getItem(highlightKey);
        if (stored) {
          const highlights = JSON.parse(stored);
          const updatedHighlights = highlights.filter(word => word !== wordToRemove.word);
          localStorage.setItem(highlightKey, JSON.stringify(updatedHighlights));
          
          // 같은 탭 내에서 하이라이트 변경 알림
          window.dispatchEvent(new CustomEvent('highlightUpdated', {
            detail: { articleId: wordToRemove.articleId, highlights: updatedHighlights }
          }));
        }
      } catch (error) {
        console.error('Error removing highlight:', error);
      }
    }
    
    const updatedWords = savedWords.filter(w => w.id !== wordId);
    setSavedWords(updatedWords);
    
    // 게스트 모드일 경우 임시 키 사용
    const storageKey = currentUser?.id 
      ? `marlang_saved_words_${currentUser.id}`
      : 'marlang_saved_words_guest';
    
    saveToStorage(storageKey, updatedWords);
  };

  // 단어가 저장되었는지 확인
  const isWordSaved = (word, articleId = null) => {
    if (articleId) {
      return savedWords.some(w => w.word.toLowerCase() === word.toLowerCase() && w.articleId === articleId);
    }
    return savedWords.some(w => w.word.toLowerCase() === word.toLowerCase());
  };

  // 기사 좋아요 토글
  const toggleLike = (article) => {
    if (!user?.id) {
      console.warn('좋아요는 로그인 후 이용 가능합니다');
      return false;
    }

    console.log('🔄 좋아요 토글:', article.id, article.title);

    const isLiked = likedArticles.some(a => a.id === article.id);
    let updatedLikes;
    
    if (isLiked) {
      updatedLikes = likedArticles.filter(a => a.id !== article.id);
      console.log('💔 좋아요 제거:', article.id);
    } else {
      // 간단하고 일관된 데이터 구조로 저장
      const likedArticle = {
        id: article.id,
        title: article.title,
        summary: article.summary || '',
        image: article.image,
        category: article.category,
        publishedAt: article.publishedAt || article.date || new Date().toISOString(),
        likedAt: new Date().toISOString()
      };
      updatedLikes = [...likedArticles, likedArticle];
      console.log('❤️ 좋아요 추가:', article.id, likedArticle);
    }
    
    setLikedArticles(updatedLikes);
    
    const storageKey = getUserKey('marlang_liked_articles');
    saveToStorage(storageKey, updatedLikes);
    
    console.log('💾 좋아요 목록 저장됨:', updatedLikes.length, '개', updatedLikes);
    
    return !isLiked;
  };

  // 기사가 좋아요되었는지 확인
  const isArticleLiked = (articleId) => {
    if (!user?.id) return false;
    return likedArticles.some(a => a.id === articleId);
  };

  // 좋아요 추가 (toggleLike와 별도로)
  const addLikedArticle = (article) => {
    if (!user?.id) return false;
    
    const isAlreadyLiked = likedArticles.some(a => a.id === article.id);
    if (!isAlreadyLiked) {
      const likedArticle = {
        ...article,
        likedAt: new Date().toISOString()
      };
      const updatedLikes = [...likedArticles, likedArticle];
      setLikedArticles(updatedLikes);
      saveToStorage(getUserKey('marlang_liked_articles'), updatedLikes);
      return true;
    }
    return false;
  };

  // 좋아요 제거 (toggleLike와 별도로)
  const removeLikedArticle = (articleId) => {
    if (!user?.id) return false;
    
    const updatedLikes = likedArticles.filter(a => a.id !== articleId);
    setLikedArticles(updatedLikes);
    saveToStorage(getUserKey('marlang_liked_articles'), updatedLikes);
    return true;
  };

  // 조회 기록 추가
  const addViewRecord = (articleId) => {
    if (!user?.id) return;
    
    const viewRecord = {
      articleId,
      viewedAt: new Date().toISOString(),
      userId: user.id
    };
    
    // 중복 방지 - 최근 1시간 내 같은 기사 조회는 기록하지 않음
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const recentView = viewRecords.find(record => 
      record.articleId === articleId && 
      new Date(record.viewedAt) > oneHourAgo
    );
    
    if (!recentView) {
      const updatedRecords = [...viewRecords, viewRecord];
      setViewRecords(updatedRecords);
      saveToStorage(getUserKey('marlang_view_records'), updatedRecords);
    }
  };

  // 활동 시간 업데이트
  const updateActivityTime = () => {
    if (!user?.id) return;
    
    const updatedSettings = {
      ...userSettings,
      lastActivityTime: new Date().toISOString()
    };
    setUserSettings(updatedSettings);
    saveToStorage(getUserKey('marlang_user_settings'), updatedSettings);
  };

  // 기사 ID로 기사 찾기 (만약 allArticles가 전역에서 접근 가능하다면)
  const getArticleById = (articleId) => {
    // 이 함수는 실제로는 ArticlesContext에서 제공되어야 하지만
    // 임시로 여기에 추가합니다
    console.warn('getArticleById should be provided by ArticlesContext');
    return null;
  };

  // 사용자 설정 업데이트
  const updateSettings = (newSettings) => {
    if (!user?.id) return;

    const updated = { ...userSettings, ...newSettings };
    setUserSettings(updated);
    saveToStorage(getUserKey('marlang_user_settings'), updated);
  };

  // 단어장 정렬
  const sortWords = (sortBy) => {
    const sorted = [...savedWords].sort((a, b) => {
      switch (sortBy) {
        case 'alphabetical':
          return a.word.localeCompare(b.word);
        case 'recent':
          return new Date(b.addedAt) - new Date(a.addedAt);
        case 'article':
          return a.articleTitle.localeCompare(b.articleTitle);
        default:
          return 0;
      }
    });
    setSavedWords(sorted);
  };

  // 좋아요 기사 정렬
  const sortLikedArticles = (sortBy) => {
    const sorted = [...likedArticles].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.likedAt) - new Date(a.likedAt);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });
    setLikedArticles(sorted);
  };

  // 학습 통계 계산
  const getStats = () => {
    return {
      totalWords: savedWords.length,
      totalLikedArticles: likedArticles.length,
      wordsThisWeek: savedWords.filter(w => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(w.addedAt) > weekAgo;
      }).length,
      favoriteCategory: likedArticles.length > 0 
        ? likedArticles.reduce((acc, article) => {
            acc[article.category] = (acc[article.category] || 0) + 1;
            return acc;
          }, {})
        : {}
    };
  };

  // 데이터 내보내기 (JSON)
  const exportData = () => {
    if (!user?.id) return null;
    
    const exportData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      savedWords,
      likedArticles,
      userSettings,
      viewRecords,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `marlang_data_${user.name}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  };

  // 모든 데이터 삭제
  const clearAllData = () => {
    if (!user?.id) return false;
    
    try {
      // 상태 초기화
      setSavedWords([]);
      setLikedArticles([]);
      setViewRecords([]);
      setUserSettings({
        language: 'en',
        translationLanguage: 'ko',
        ttsSpeed: 0.8,
        autoSaveWords: true,
        autoPlay: false,
        highlightSavedWords: true,
        lastVisited: new Date().toISOString(),
        lastActivityTime: new Date().toISOString()
      });
      
      // localStorage에서 모든 사용자 데이터 삭제
      const keysToRemove = [
        `marlang_saved_words_${user.id}`,
        `marlang_liked_articles_${user.id}`,
        `marlang_user_settings_${user.id}`,
        `marlang_view_records_${user.id}`
      ];
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // 하이라이트 데이터도 삭제 (패턴 매칭으로)
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (key.startsWith('marlang_highlights_')) {
          localStorage.removeItem(key);
        }
      });
      
      console.log('🗑️ 모든 데이터 삭제 완료');
      return true;
    } catch (error) {
      console.error('데이터 삭제 중 오류:', error);
      return false;
    }
  };

  const value = {
    // 상태
    savedWords,
    likedArticles,
    userSettings,
    viewRecords,
    
    // 단어 관련 함수
    addWord,
    removeWord,
    isWordSaved,
    sortWords,
    
    // 좋아요 관련 함수
    toggleLike,
    isArticleLiked,
    addLikedArticle,
    removeLikedArticle,
    sortLikedArticles,
    
    // 조회 기록 관련 함수
    addViewRecord,
    
    // 활동 시간 관련 함수
    updateActivityTime,
    
    // 기사 관련 함수
    getArticleById,
    
    // 설정 관련 함수
    updateSettings,
    
    // 통계 함수
    getStats,

    // 데이터 내보내기 (JSON)
    exportData,

    // 모든 데이터 삭제
    clearAllData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export default DataContext; 