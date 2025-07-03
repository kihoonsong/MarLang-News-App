import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
      isLoading: false,
      syncError: null,
      isOnline: true,
      addWord: () => false,
      removeWord: () => {},
      sortWords: () => {},
      isWordSaved: () => false,
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
  
  // 동기화 상태 관리
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  
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

  // Firebase에서 사용자 데이터 로드
  const loadUserData = async () => {
    setIsLoading(true);
    setSyncError(null);
    
    if (!user?.uid) {
      console.log('사용자가 로그인하지 않음 - 로컬 데이터 사용');
      loadLocalData();
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔥 Firebase에서 사용자 데이터 로드 중...', user.uid);
      
      // 단어장 데이터 로드
      const savedWordsRef = doc(db, 'users', user.uid, 'data', 'savedWords');
      const savedWordsSnap = await getDoc(savedWordsRef);
      if (savedWordsSnap.exists()) {
        const data = savedWordsSnap.data();
        setSavedWords(data.words || []);
        console.log('✅ 단어장 데이터 로드됨:', data.words?.length || 0, '개');
      } else {
        setSavedWords([]);
      }

      // 좋아요 데이터 로드
      const likedArticlesRef = doc(db, 'users', user.uid, 'data', 'likedArticles');
      const likedArticlesSnap = await getDoc(likedArticlesRef);
      if (likedArticlesSnap.exists()) {
        const data = likedArticlesSnap.data();
        setLikedArticles(data.articles || []);
        console.log('✅ 좋아요 데이터 로드됨:', data.articles?.length || 0, '개');
      } else {
        setLikedArticles([]);
      }

      // 사용자 설정 로드
      const settingsRef = doc(db, 'users', user.uid, 'data', 'settings');
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        setUserSettings(prev => ({
          ...prev,
          ...data.settings
        }));
        console.log('✅ 사용자 설정 로드됨');
      }

      // 조회 기록 로드
      const viewRecordsRef = doc(db, 'users', user.uid, 'data', 'viewRecords');
      const viewRecordsSnap = await getDoc(viewRecordsRef);
      if (viewRecordsSnap.exists()) {
        const data = viewRecordsSnap.data();
        setViewRecords(data.records || []);
        console.log('✅ 조회 기록 로드됨:', data.records?.length || 0, '개');
      } else {
        setViewRecords([]);
      }

      setIsLoading(false);
      console.log('✅ 모든 사용자 데이터 로드 완료');
      
    } catch (error) {
      console.error('❌ Firebase 데이터 로드 실패:', error);
      setSyncError(`데이터 동기화 실패: ${error.message}`);
      setIsOnline(false);
      
      // 오류 시 로컬 데이터로 폴백
      console.log('🔄 로컬 데이터로 폴백...');
      loadLocalData();
      setIsLoading(false);
    }
  };

  // 로컬 스토리지에서 데이터 로드 (게스트 모드 또는 오류 시)
  const loadLocalData = () => {
    try {
      const userKey = user?.uid || 'guest';
      
      const savedWordsKey = `marlang_saved_words_${userKey}`;
      const storedWords = localStorage.getItem(savedWordsKey);
      if (storedWords) {
        setSavedWords(JSON.parse(storedWords));
      }

      const likedArticlesKey = `marlang_liked_articles_${userKey}`;
      const storedLiked = localStorage.getItem(likedArticlesKey);
      if (storedLiked) {
        setLikedArticles(JSON.parse(storedLiked));
      }

      const settingsKey = `marlang_user_settings_${userKey}`;
      const storedSettings = localStorage.getItem(settingsKey);
      if (storedSettings) {
        setUserSettings(prev => ({
          ...prev,
          ...JSON.parse(storedSettings)
        }));
      }

      const viewRecordsKey = `marlang_view_records_${userKey}`;
      const storedRecords = localStorage.getItem(viewRecordsKey);
      if (storedRecords) {
        setViewRecords(JSON.parse(storedRecords));
      }
    } catch (error) {
      console.error('❌ 로컬 데이터 로드 실패:', error);
    }
  };

  // Firebase에 단어장 저장
  const saveSavedWordsToFirebase = async (words) => {
    if (!user?.uid) {
      // 게스트 모드는 로컬 저장
      localStorage.setItem(`marlang_saved_words_guest`, JSON.stringify(words));
      return;
    }

    try {
      const savedWordsRef = doc(db, 'users', user.uid, 'data', 'savedWords');
      await setDoc(savedWordsRef, {
        words: words,
        updatedAt: serverTimestamp()
      });
      console.log('✅ 단어장 Firebase 저장 완료');
      setIsOnline(true);
      setSyncError(null);
    } catch (error) {
      console.error('❌ 단어장 Firebase 저장 실패:', error);
      setSyncError('단어장 동기화 실패');
      setIsOnline(false);
      // 오류 시 로컬 저장으로 폴백
      localStorage.setItem(`marlang_saved_words_${user.uid}`, JSON.stringify(words));
    }
  };

  // Firebase에 좋아요 저장
  const saveLikedArticlesToFirebase = async (articles) => {
    if (!user?.uid) {
      // 게스트 모드는 로컬 저장
      localStorage.setItem(`marlang_liked_articles_guest`, JSON.stringify(articles));
      return;
    }

    try {
      const likedArticlesRef = doc(db, 'users', user.uid, 'data', 'likedArticles');
      await setDoc(likedArticlesRef, {
        articles: articles,
        updatedAt: serverTimestamp()
      });
      console.log('✅ 좋아요 Firebase 저장 완료');
    } catch (error) {
      console.error('❌ 좋아요 Firebase 저장 실패:', error);
      // 오류 시 로컬 저장으로 폴백
      localStorage.setItem(`marlang_liked_articles_${user.uid}`, JSON.stringify(articles));
    }
  };

  // Firebase에 사용자 설정 저장
  const saveSettingsToFirebase = async (settings) => {
    if (!user?.uid) {
      // 게스트 모드는 로컬 저장
      localStorage.setItem(`marlang_user_settings_guest`, JSON.stringify(settings));
      return;
    }

    try {
      const settingsRef = doc(db, 'users', user.uid, 'data', 'settings');
      await setDoc(settingsRef, {
        settings: settings,
        updatedAt: serverTimestamp()
      });
      console.log('✅ 사용자 설정 Firebase 저장 완료');
    } catch (error) {
      console.error('❌ 사용자 설정 Firebase 저장 실패:', error);
      // 오류 시 로컬 저장으로 폴백
      localStorage.setItem(`marlang_user_settings_${user.uid}`, JSON.stringify(settings));
    }
  };

  // Firebase에 조회 기록 저장
  const saveViewRecordsToFirebase = async (records) => {
    if (!user?.uid) {
      // 게스트 모드는 로컬 저장
      localStorage.setItem(`marlang_view_records_guest`, JSON.stringify(records));
      return;
    }

    try {
      const viewRecordsRef = doc(db, 'users', user.uid, 'data', 'viewRecords');
      await setDoc(viewRecordsRef, {
        records: records,
        updatedAt: serverTimestamp()
      });
      console.log('✅ 조회 기록 Firebase 저장 완료');
    } catch (error) {
      console.error('❌ 조회 기록 Firebase 저장 실패:', error);
      // 오류 시 로컬 저장으로 폴백
      localStorage.setItem(`marlang_view_records_${user.uid}`, JSON.stringify(records));
    }
  };

  // 사용자 변경 시 데이터 로드
  useEffect(() => {
    loadUserData();
  }, [user?.uid]);

  // 단어 저장 여부 확인
  const isWordSaved = (word) => {
    if (!word) return false;
    return savedWords.some(savedWord => 
      savedWord.word?.toLowerCase() === word.toLowerCase()
    );
  };

  // 단어 추가 (ArticleDetail에서 사용하는 시그니처)
  const addWord = async (word, definition, articleId, articleTitle, secondaryDefinition, example, partOfSpeech) => {
    try {
      // 기존 단어 체크
      const wordExists = savedWords.find(w => 
        w.word?.toLowerCase() === word?.toLowerCase()
      );
      
      if (wordExists) {
        console.log('단어가 이미 존재합니다:', word);
        return false;
      }

      const newWord = {
        id: `word_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        word: word,
        definition: definition,
        secondaryDefinition: secondaryDefinition || '',
        example: example || '',
        partOfSpeech: partOfSpeech || '',
        articleId: articleId,
        articleTitle: articleTitle,
        addedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      const updatedWords = [...savedWords, newWord];
      setSavedWords(updatedWords);
      await saveSavedWordsToFirebase(updatedWords);
      
      console.log('✅ 단어 추가 완료:', newWord.word);
      return true;
    } catch (error) {
      console.error('❌ 단어 추가 실패:', error);
      return false;
    }
  };

  // 단어 제거
  const removeWord = async (wordId) => {
    try {
      const updatedWords = savedWords.filter(word => word.id !== wordId);
      setSavedWords(updatedWords);
      await saveSavedWordsToFirebase(updatedWords);
      console.log('✅ 단어 제거 완료');
    } catch (error) {
      console.error('❌ 단어 제거 실패:', error);
    }
  };

  // 단어 정렬
  const sortWords = (sortBy = 'addedAt', order = 'desc') => {
    const sorted = [...savedWords].sort((a, b) => {
      if (order === 'desc') {
        return new Date(b[sortBy]) - new Date(a[sortBy]);
      } else {
        return new Date(a[sortBy]) - new Date(b[sortBy]);
      }
    });
    setSavedWords(sorted);
  };

  // 좋아요 토글
  const toggleLike = async (article) => {
    try {
      const isLiked = likedArticles.some(liked => liked.id === article.id);
      
      if (isLiked) {
        await removeLikedArticle(article.id);
        return false;
      } else {
        await addLikedArticle(article);
        return true;
      }
    } catch (error) {
      console.error('❌ 좋아요 토글 실패:', error);
      return false;
    }
  };

  // 기사 좋아요 여부 확인
  const isArticleLiked = (articleId) => {
    return likedArticles.some(article => article.id === articleId);
  };

  // 좋아요 기사 추가
  const addLikedArticle = async (article) => {
    try {
      const alreadyLiked = likedArticles.find(liked => liked.id === article.id);
      if (alreadyLiked) {
        console.log('이미 좋아요한 기사입니다:', article.id);
        return false;
      }

      const likedArticle = {
        ...article,
        likedAt: new Date().toISOString()
      };

      const updatedLiked = [...likedArticles, likedArticle];
      setLikedArticles(updatedLiked);
      await saveLikedArticlesToFirebase(updatedLiked);
      
      console.log('✅ 좋아요 추가 완료:', article.title);
      return true;
    } catch (error) {
      console.error('❌ 좋아요 추가 실패:', error);
      return false;
    }
  };

  // 좋아요 기사 제거
  const removeLikedArticle = async (articleId) => {
    try {
      const updatedLiked = likedArticles.filter(article => article.id !== articleId);
      setLikedArticles(updatedLiked);
      await saveLikedArticlesToFirebase(updatedLiked);
      console.log('✅ 좋아요 제거 완료');
    } catch (error) {
      console.error('❌ 좋아요 제거 실패:', error);
    }
  };

  // 좋아요 기사 정렬
  const sortLikedArticles = (sortBy = 'likedAt', order = 'desc') => {
    const sorted = [...likedArticles].sort((a, b) => {
      if (order === 'desc') {
        return new Date(b[sortBy]) - new Date(a[sortBy]);
      } else {
        return new Date(a[sortBy]) - new Date(b[sortBy]);
      }
    });
    setLikedArticles(sorted);
  };

  // 조회 기록 추가
  const addViewRecord = async (articleData) => {
    try {
      const viewRecord = {
        articleId: articleData.id,
        title: articleData.title,
        category: articleData.category,
        viewedAt: new Date().toISOString(),
        summary: articleData.summary
      };

      // 중복 제거 (같은 기사의 최근 조회 기록만 유지)
      const filteredRecords = viewRecords.filter(record => record.articleId !== articleData.id);
      const updatedRecords = [viewRecord, ...filteredRecords].slice(0, 100); // 최대 100개 유지

      setViewRecords(updatedRecords);
      await saveViewRecordsToFirebase(updatedRecords);
      console.log('✅ 조회 기록 추가 완료');
    } catch (error) {
      console.error('❌ 조회 기록 추가 실패:', error);
    }
  };

  // 활동 시간 업데이트
  const updateActivityTime = async () => {
    try {
      const updatedSettings = {
        ...userSettings,
        lastActivityTime: new Date().toISOString()
      };
      setUserSettings(updatedSettings);
      await saveSettingsToFirebase(updatedSettings);
    } catch (error) {
      console.error('❌ 활동 시간 업데이트 실패:', error);
    }
  };

  // ID로 기사 찾기 (조회 기록에서)
  const getArticleById = (articleId) => {
    return viewRecords.find(record => record.articleId === articleId) || null;
  };

  // 설정 업데이트
  const updateSettings = async (newSettings) => {
    try {
      const updatedSettings = {
        ...userSettings,
        ...newSettings,
        lastUpdated: new Date().toISOString()
      };
      setUserSettings(updatedSettings);
      await saveSettingsToFirebase(updatedSettings);
      console.log('✅ 설정 업데이트 완료');
    } catch (error) {
      console.error('❌ 설정 업데이트 실패:', error);
    }
  };

  // 통계 데이터 계산
  const getStats = () => {
    const totalWords = savedWords.length;
    const totalLikedArticles = likedArticles.length;
    
    // 이번 주에 추가된 단어 수
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const wordsThisWeek = savedWords.filter(word => 
      new Date(word.addedAt) > weekAgo
    ).length;

    // 선호 카테고리 계산
    const categoryCount = {};
    likedArticles.forEach(article => {
      if (article.category) {
        categoryCount[article.category] = (categoryCount[article.category] || 0) + 1;
      }
    });
    
    const favoriteCategory = Object.keys(categoryCount).reduce((a, b) => 
      categoryCount[a] > categoryCount[b] ? a : b, 
      Object.keys(categoryCount)[0] || ''
    );

    return {
      totalWords,
      totalLikedArticles,
      wordsThisWeek,
      favoriteCategory: {
        name: favoriteCategory,
        count: categoryCount[favoriteCategory] || 0
      }
    };
  };

  const value = {
    savedWords,
    likedArticles,
    userSettings,
    viewRecords,
    isLoading,
    syncError,
    isOnline,
    addWord,
    removeWord,
    sortWords,
    isWordSaved,
    toggleLike,
    isArticleLiked,
    addLikedArticle,
    removeLikedArticle,
    sortLikedArticles,
    addViewRecord,
    updateActivityTime,
    getArticleById,
    updateSettings,
    getStats
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
