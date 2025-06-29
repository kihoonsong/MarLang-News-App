import React, { createContext, useContext, useState, useEffect } from 'react';

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
      addWord: () => false,
      removeWord: () => {},
      sortWords: () => {},
      toggleLike: () => false,
      isArticleLiked: () => false,
      sortLikedArticles: () => {},
      updateSettings: () => {},
      getStats: () => ({ totalWords: 0, totalLikedArticles: 0, wordsThisWeek: 0, favoriteCategory: {} })
    };
  }
  return context;
};

export const DataProvider = ({ children }) => {
  // 단어장 상태
  const [savedWords, setSavedWords] = useState([]);
  
  // 좋아요 상태
  const [likedArticles, setLikedArticles] = useState([]);
  
  // 사용자 설정
  const [userSettings, setUserSettings] = useState({
    language: 'en',
    translationLanguage: 'ko', // 번역 대상 언어 (기본: 한국어)
    ttsSpeed: 0.8,
    lastVisited: new Date().toISOString()
  });

  // 로컬 스토리지에서 데이터 불러오기
  useEffect(() => {
    const loadFromStorage = (key, setter) => {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          setter(JSON.parse(stored));
        }
      } catch (error) {
        console.error(`Error loading ${key} from localStorage:`, error);
      }
    };

    loadFromStorage('marlang_saved_words', setSavedWords);
    loadFromStorage('marlang_liked_articles', setLikedArticles);
    loadFromStorage('marlang_user_settings', setUserSettings);
  }, []);

  // 로컬 스토리지에 데이터 저장
  const saveToStorage = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  };

  // 단어 추가 - 뜻과 번역을 모두 저장
  const addWord = (word, definition, articleId, articleTitle, translation = null) => {
    const newWord = {
      id: Date.now(),
      word: word.toLowerCase(),
      definition, // 영어 정의
      meaning: definition, // 호환성을 위해 meaning 필드도 추가
      translation, // 번역된 뜻 (선택사항)
      articleId,
      articleTitle,
      addedAt: new Date().toISOString(),
      savedDate: new Date().toISOString() // 호환성을 위해 savedDate도 추가
    };
    
    // 이미 존재하는 단어인지 확인
    const exists = savedWords.some(w => w.word === newWord.word);
    if (!exists) {
      const updatedWords = [...savedWords, newWord];
      setSavedWords(updatedWords);
      saveToStorage('marlang_saved_words', updatedWords);
      return true;
    }
    return false;
  };

  // 단어 삭제
  const removeWord = (wordId) => {
    // 삭제할 단어 찾기
    const wordToRemove = savedWords.find(w => w.id === wordId);
    
    if (wordToRemove) {
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
    saveToStorage('marlang_saved_words', updatedWords);
  };

  // 기사 좋아요 토글
  const toggleLike = (article) => {
    const isLiked = likedArticles.some(a => a.id === article.id);
    let updatedLikes;
    
    if (isLiked) {
      updatedLikes = likedArticles.filter(a => a.id !== article.id);
    } else {
      const likedArticle = {
        ...article,
        likedAt: new Date().toISOString()
      };
      updatedLikes = [...likedArticles, likedArticle];
    }
    
    setLikedArticles(updatedLikes);
    saveToStorage('marlang_liked_articles', updatedLikes);
    return !isLiked;
  };

  // 기사가 좋아요되었는지 확인
  const isArticleLiked = (articleId) => {
    return likedArticles.some(a => a.id === articleId);
  };

  // 사용자 설정 업데이트
  const updateSettings = (newSettings) => {
    const updated = { ...userSettings, ...newSettings };
    setUserSettings(updated);
    saveToStorage('marlang_user_settings', updated);
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

  const value = {
    // 상태
    savedWords,
    likedArticles,
    userSettings,
    
    // 단어 관련 함수
    addWord,
    removeWord,
    sortWords,
    
    // 좋아요 관련 함수
    toggleLike,
    isArticleLiked,
    sortLikedArticles,
    
    // 설정 관련 함수
    updateSettings,
    
    // 통계 함수
    getStats
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export default DataContext; 