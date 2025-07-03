import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const { user } = useAuth();

  const [savedWords, setSavedWords] = useState([]);
  const [likedArticles, setLikedArticles] = useState([]);
  const [userSettings, setUserSettings] = useState({
    language: 'en',
    translationLanguage: 'ko',
    ttsSpeed: 0.8,
    autoSaveWords: true,
    autoPlay: false,
    highlightSavedWords: true,
  });
  const [viewRecords, setViewRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Firebase & LocalStorage 데이터 관리 ---

  useEffect(() => {
    const manageUserData = async () => {
      setIsLoading(true);
      setError(null);

      if (user) {
        // --- 로그인 사용자: Firebase에서 데이터 로드 ---
        console.log(`🔥 Firebase에서 사용자 데이터 로드 중: ${user.uid}`);
        try {
          const wordsRef = doc(db, 'users', user.uid, 'data', 'savedWords');
          const likesRef = doc(db, 'users', user.uid, 'data', 'likedArticles');
          const settingsRef = doc(db, 'users', user.uid, 'data', 'settings');
          const viewsRef = doc(db, 'users', user.uid, 'data', 'viewRecords');

          const [wordsSnap, likesSnap, settingsSnap, viewsSnap] = await Promise.all([
            getDoc(wordsRef),
            getDoc(likesRef),
            getDoc(settingsRef),
            getDoc(viewsRef),
          ]);

          const words = wordsSnap.exists() ? wordsSnap.data().words : [];
          const likes = likesSnap.exists() ? likesSnap.data().articles : [];
          const settings = settingsSnap.exists() ? settingsSnap.data().settings : userSettings;
          const views = viewsSnap.exists() ? viewsSnap.data().records : [];

          setSavedWords(words);
          setLikedArticles(likes);
          setUserSettings(settings);
          setViewRecords(views);

          console.log(`✅ Firebase 데이터 로드 완료: 단어 ${words.length}개, 좋아요 ${likes.length}개`);
        } catch (err) {
          console.error('❌ Firebase 데이터 로드 실패:', err);
          setError('데이터��� 불러오는 데 실패했습니다. 인터넷 연결을 확인해주세요.');
        }
      } else {
        // --- 비로그인 사용자: LocalStorage에서 데이터 로드 ---
        console.log('👤 게스트 모드: 로컬 저장소에서 데이터 로드');
        try {
          const localWords = JSON.parse(localStorage.getItem('marlang_guest_words') || '[]');
          const localLikes = JSON.parse(localStorage.getItem('marlang_guest_likes') || '[]');
          const localSettings = JSON.parse(localStorage.getItem('marlang_guest_settings') || JSON.stringify(userSettings));
          const localViews = JSON.parse(localStorage.getItem('marlang_guest_views') || '[]');
          
          setSavedWords(localWords);
          setLikedArticles(localLikes);
          setUserSettings(localSettings);
          setViewRecords(localViews);
        } catch (e) {
          console.error("로컬 데이터 파싱 오류", e);
        }
      }
      setIsLoading(false);
    };

    manageUserData();
  }, [user]);

  // --- 데이터 변경 함수들 ---

  const saveData = async (dataType, data) => {
    if (user) {
      // 로그인 사용자는 Firebase에 저장
      const ref = doc(db, 'users', user.uid, 'data', dataType);
      const payload = dataType === 'savedWords' ? { words: data } :
                      dataType === 'likedArticles' ? { articles: data } :
                      dataType === 'settings' ? { settings: data } :
                      { records: data };
      await setDoc(ref, { ...payload, updatedAt: serverTimestamp() }, { merge: true });
    } else {
      // 게스트는 LocalStorage에 저장
      const key = `marlang_guest_${dataType === 'savedWords' ? 'words' : dataType === 'likedArticles' ? 'likes' : dataType === 'settings' ? 'settings' : 'views'}`;
      localStorage.setItem(key, JSON.stringify(data));
    }
  };

  const addWord = async (word, definition, articleId, articleTitle, secondaryDefinition, example, partOfSpeech) => {
    if (savedWords.some(w => w.word.toLowerCase() === word.toLowerCase())) {
      return false;
    }
    const newWord = {
      id: `word_${Date.now()}`,
      word, definition, articleId, articleTitle, secondaryDefinition, example, partOfSpeech,
      addedAt: new Date().toISOString(),
    };
    const updatedWords = [...savedWords, newWord];
    setSavedWords(updatedWords);
    await saveData('savedWords', updatedWords);
    return true;
  };

  const removeWord = async (wordId) => {
    const updatedWords = savedWords.filter(w => w.id !== wordId);
    setSavedWords(updatedWords);
    await saveData('savedWords', updatedWords);
  };

  const toggleLike = async (article) => {
    const isLiked = likedArticles.some(a => a.id === article.id);
    let updatedLikes;
    if (isLiked) {
      updatedLikes = likedArticles.filter(a => a.id !== article.id);
    } else {
      updatedLikes = [...likedArticles, { ...article, likedAt: new Date().toISOString() }];
    }
    setLikedArticles(updatedLikes);
    await saveData('likedArticles', updatedLikes);
    return !isLiked;
  };
  
  const addViewRecord = async (articleData) => {
    const newRecord = {
      articleId: articleData.id,
      title: articleData.title,
      category: articleData.category,
      viewedAt: new Date().toISOString(),
      summary: articleData.summary,
    };
    const updatedRecords = [newRecord, ...viewRecords.filter(r => r.articleId !== articleData.id)].slice(0, 100);
    setViewRecords(updatedRecords);
    await saveData('viewRecords', updatedRecords);
  };

  const updateSettings = async (newSettings) => {
    const updatedSettings = { ...userSettings, ...newSettings, lastUpdated: new Date().toISOString() };
    setUserSettings(updatedSettings);
    await saveData('settings', updatedSettings);
  };

  const getStats = () => {
    const totalWords = savedWords.length;
    const totalLikedArticles = likedArticles.length;
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const wordsThisWeek = savedWords.filter(word => 
      new Date(word.addedAt) > weekAgo
    ).length;

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
    error,
    addWord,
    removeWord,
    isWordSaved: (word) => savedWords.some(w => w.word.toLowerCase() === word.toLowerCase()),
    toggleLike,
    isArticleLiked: (articleId) => likedArticles.some(a => a.id === articleId),
    addViewRecord,
    updateSettings,
    getStats,
    // 복원된 다른 함수들 (필요 시 여기에 추가)
    updateActivityTime: () => updateSettings({ lastActivityTime: new Date().toISOString() }),
    getArticleById: (articleId) => viewRecords.find(r => r.articleId === articleId) || null,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};