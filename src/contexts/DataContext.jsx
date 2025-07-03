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
  const [userSettings, setUserSettings] = useState({ language: 'en' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFirebaseData = async (uid) => {
      console.log(`🔥 Loading data for user ${uid} from Firebase...`);
      setIsLoading(true);
      setError(null);
      try {
        const wordsRef = doc(db, 'users', uid, 'data', 'savedWords');
        const likesRef = doc(db, 'users', uid, 'data', 'likedArticles');
        const settingsRef = doc(db, 'users', uid, 'data', 'settings');

        const [wordsSnap, likesSnap, settingsSnap] = await Promise.all([
          getDoc(wordsRef),
          getDoc(likesRef),
          getDoc(settingsRef),
        ]);

        const words = wordsSnap.exists() ? wordsSnap.data().words : [];
        const likes = likesSnap.exists() ? likesSnap.data().articles : [];
        const settings = settingsSnap.exists() ? settingsSnap.data().settings : { language: 'en' };

        setSavedWords(words);
        setLikedArticles(likes);
        setUserSettings(settings);

        console.log(`✅ Firebase data loaded: ${words.length} words, ${likes.length} likes.`);
      } catch (err) {
        console.error('❌ Failed to load Firebase data:', err);
        setError('Failed to load your data. Please check your internet connection.');
        setSavedWords([]);
        setLikedArticles([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadFirebaseData(user.uid);
    } else {
      // 비로그인 시 모든 데이터를 초기화
      setSavedWords([]);
      setLikedArticles([]);
      setUserSettings({ language: 'en' });
      setIsLoading(false);
    }
  }, [user]);

  const addWord = async (wordData) => {
    if (!user) return false;
    if (savedWords.some(w => w.word.toLowerCase() === wordData.word.toLowerCase())) return false;

    const newWord = { ...wordData, id: `word_${Date.now()}`, savedAt: new Date().toISOString() };
    const updatedWords = [...savedWords, newWord];
    setSavedWords(updatedWords);

    await setDoc(doc(db, 'users', user.uid, 'data', 'savedWords'), { words: updatedWords, updatedAt: serverTimestamp() }, { merge: true });
    return true;
  };

  const removeWord = async (wordId) => {
    if (!user) return;
    const updatedWords = savedWords.filter(w => w.id !== wordId);
    setSavedWords(updatedWords);
    await setDoc(doc(db, 'users', user.uid, 'data', 'savedWords'), { words: updatedWords, updatedAt: serverTimestamp() });
  };

  const toggleLike = async (articleData) => {
    if (!user) return false;
    const isLiked = likedArticles.some(a => a.id === articleData.id);
    const updatedLikes = isLiked
      ? likedArticles.filter(a => a.id !== articleData.id)
      : [...likedArticles, { ...articleData, likedAt: new Date().toISOString() }];
    
    setLikedArticles(updatedLikes);
    await setDoc(doc(db, 'users', user.uid, 'data', 'likedArticles'), { articles: updatedLikes, updatedAt: serverTimestamp() });
    return !isLiked;
  };

  const isArticleLiked = (articleId) => likedArticles.some(a => a.id === articleId);
  const isWordSaved = (word) => savedWords.some(w => w.word.toLowerCase() === word.toLowerCase());

  const value = {
    savedWords,
    likedArticles,
    userSettings,
    isLoading,
    error,
    addWord,
    removeWord,
    isWordSaved,
    toggleLike,
    isArticleLiked,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};