import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getDefaultLanguageSettings } from '../utils/languageDetection';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const { user } = useAuth();

  const [savedWords, setSavedWords] = useState([]);
  const [likedArticles, setLikedArticles] = useState([]);
  const getInitialSettings = () => {
    const defaultLanguage = getDefaultLanguageSettings();
    return {
      language: defaultLanguage.language,
      translationLanguage: defaultLanguage.translationLanguage,
      ttsSpeed: 1.0,
      ttsPause: 200,
      autoSaveWords: true,
      autoPlay: false,
      highlightSavedWords: true,
    };
  };

  const [userSettings, setUserSettings] = useState(getInitialSettings());
  const [viewRecords, setViewRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Firebase & LocalStorage 데이터 관리 ---

  useEffect(() => {
    const manageUserData = async () => {
      setIsLoading(true);
      setError(null);

      if (user) {
        if (user.isServerAuth) {
          // --- 네이버 서버 인증 사용자: HTTP API에서 데이터 로드 ---
          console.log(`🌐 서버 API에서 사용자 데이터 로드 중: ${user.uid}`);
          try {
            const response = await fetch(`https://us-central1-marlang-app.cloudfunctions.net/getUserData?userId=${user.uid}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              const serverData = await response.json();
              
              const sanitizedWords = Array.isArray(serverData.savedWords) ? 
                serverData.savedWords.filter(w => w && typeof w.word === 'string') : [];
              const sanitizedLikes = Array.isArray(serverData.likedArticles) ? 
                serverData.likedArticles.filter(a => a && typeof a.id === 'string') : [];
              const settings = serverData.settings || getInitialSettings();
              const views = Array.isArray(serverData.viewRecords) ? serverData.viewRecords : [];

              setSavedWords(sanitizedWords);
              setLikedArticles(sanitizedLikes);
              setUserSettings(settings);
              setViewRecords(views);

              console.log(`✅ 서버 데이터 로드 완료: 단어 ${sanitizedWords.length}개, 좋아요 ${sanitizedLikes.length}개`);
            } else {
              throw new Error(`서버 데이터 로드 실패: ${response.status}`);
            }
          } catch (err) {
            console.error('❌ 서버 데이터 로드 실패, 로컬에서 로드:', err);
            // 서버 실패 시 로컬 저장소에서 로드
            const localWords = JSON.parse(localStorage.getItem(`haru_${user.uid}_savedWords`) || '[]');
            const localLikes = JSON.parse(localStorage.getItem(`haru_${user.uid}_likedArticles`) || '[]');
            const localSettings = JSON.parse(localStorage.getItem(`haru_${user.uid}_settings`) || JSON.stringify(getInitialSettings()));
            const localViews = JSON.parse(localStorage.getItem(`haru_${user.uid}_viewRecords`) || '[]');
            
            setSavedWords(localWords);
            setLikedArticles(localLikes);
            setUserSettings(localSettings);
            setViewRecords(localViews);
          }
        } else {
          // --- Firebase 인증 사용자: Firebase에서 데이터 로드 ---
        console.log(`🔥 Firebase에서 사용자 데이터 로드 중: ${user.uid}`);
        try {
          const wordsRef = doc(db, 'users', user.uid, 'data', 'savedWords');
          const likesRef = doc(db, 'users', user.uid, 'data', 'likedArticles');
          const settingsRef = doc(db, 'users', user.uid, 'data', 'settings');
          const viewsRef = doc(db, 'users', user.uid, 'data', 'viewRecords');

          const wordsSnap = await getDoc(wordsRef);
          const likesSnap = await getDoc(likesRef);
          const settingsSnap = await getDoc(settingsRef);
          const viewsSnap = await getDoc(viewsRef);

          // 데이터 로딩 시 '정제(Sanitization)' 로직 추가
          const rawWords = wordsSnap.exists() ? wordsSnap.data().words : [];
          const sanitizedWords = [];
          if (Array.isArray(rawWords)) {
            rawWords.forEach((w, index) => {
              if (w && typeof w.word === 'string' && w.word.trim() !== '') {
                sanitizedWords.push(w);
              } else {
                console.error(`[Data Sanitization] Firebase에서 잘못된 단어 데이터를 발견하여 폐기합니다. Index: ${index}`, w);
              }
            });
          }

          const rawLikes = likesSnap.exists() ? likesSnap.data().articles : [];
          const sanitizedLikes = Array.isArray(rawLikes) ? rawLikes.filter(a => a && typeof a.id === 'string') : [];

          const settings = settingsSnap.exists() ? settingsSnap.data().settings : getInitialSettings();
          const views = viewsSnap.exists() ? viewsSnap.data().records : [];

          setSavedWords(sanitizedWords);
          setLikedArticles(sanitizedLikes);
          setUserSettings(settings);
          setViewRecords(views);

          console.log(`✅ Firebase 데이터 정제 및 로드 완료: 단어 ${sanitizedWords.length}개, 좋아요 ${sanitizedLikes.length}개`);
          } catch (err) {
            console.error('❌ Firebase 데이터 로드 실패:', err);
            setError('데이터를 불러오는 데 실패했습니다. 인터넷 연결을 확인해주세요.');
          }
        }
      } else {
        // --- 비로그인 사용자: 기본 LocalStorage에서 데이터 로드 ---
        console.log('👤 비로그인 모드: 로컬 저장소에서 데이터 로드');
        try {
          const rawWords = JSON.parse(localStorage.getItem('haru_guest_words') || '[]');
          const sanitizedWords = Array.isArray(rawWords) ? rawWords.filter(w => w && typeof w.word === 'string') : [];

          const rawLikes = JSON.parse(localStorage.getItem('haru_guest_likes') || '[]');
          const sanitizedLikes = Array.isArray(rawLikes) ? rawLikes.filter(a => a && typeof a.id === 'string') : [];

          const localSettings = JSON.parse(localStorage.getItem('haru_guest_settings') || JSON.stringify(getInitialSettings()));
          const localViews = JSON.parse(localStorage.getItem('haru_guest_views') || '[]');
          
          setSavedWords(sanitizedWords);
          setLikedArticles(sanitizedLikes);
          setUserSettings(localSettings);
          setViewRecords(localViews);
        } catch (e) {
          console.error("비로그인 로컬 데이터 파싱 오류", e);
        }
      }
      setIsLoading(false);
    };

    manageUserData();
  }, [user]);

  // (공지사항 로드 로직 제거)

  // --- 데이터 변경 함수들 ---

  const saveData = async (dataType, data) => {
    if (user) {
      if (user.isServerAuth) {
        // 네이버 서버 인증 사용자: HTTP API를 통해 서버에 저장
        try {
          const response = await fetch('https://us-central1-marlang-app.cloudfunctions.net/saveUserData', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.uid,
              dataType: dataType,
              data: data,
              userInfo: {
                email: user.email,
                name: user.name,
                provider: user.provider
              }
            }),
          });

          if (response.ok) {
            console.log(`✅ ${dataType} 데이터 서버 API에 저장 완료`);
            
            // TTS 음성 설정의 실시간 반영을 위해 localStorage도 동기화
            if (dataType === 'settings') {
              const key = `haru_${user.uid}_settings`;
              localStorage.setItem(key, JSON.stringify(data));
              console.log(`✅ ${dataType} 데이터 localStorage에도 동기화 완료`);
            }
          } else {
            throw new Error(`서버 저장 실패: ${response.status}`);
          }
        } catch (error) {
          console.error('서버 API 저장 실패, 로컬 저장소로 fallback:', error);
          // 서버 실패 시 로컬 저장소 사용
          const key = `haru_${user.uid}_${dataType}`;
          localStorage.setItem(key, JSON.stringify(data));
        }
      } else {
        // Firebase 인증 사용자: Firestore에 저장
        try {
          const ref = doc(db, 'users', user.uid, 'data', dataType);
          const payload = dataType === 'savedWords' ? { words: data } :
                          dataType === 'likedArticles' ? { articles: data } :
                          dataType === 'settings' ? { settings: data } :
                          { records: data };
          await setDoc(ref, { ...payload, updatedAt: serverTimestamp() }, { merge: true });
          console.log(`✅ ${dataType} 데이터 Firebase에 저장 완료`);
          
          // TTS 음성 설정의 실시간 반영을 위해 localStorage도 동기화
          if (dataType === 'settings') {
            const key = `haru_${user.uid}_settings`;
            localStorage.setItem(key, JSON.stringify(data));
            console.log(`✅ ${dataType} 데이터 localStorage에도 동기화 완료`);
          }
        } catch (error) {
          console.error('Firestore 저장 실패, 로컬 저장소로 fallback:', error);
          // Firestore 실패 시 로컬 저장소 사용
          const key = `haru_${user.uid}_${dataType}`;
          localStorage.setItem(key, JSON.stringify(data));
        }
      }
    } else {
      // 비로그인 사용자는 LocalStorage에 저장
      const key = `haru_guest_${dataType}`;
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

  const toggleLike = async (article, incrementArticleLikes = null) => {
    const isLiked = likedArticles.some(a => a.id === article.id);
    let updatedLikes;
    if (isLiked) {
      updatedLikes = likedArticles.filter(a => a.id !== article.id);
    } else {
      updatedLikes = [...likedArticles, { ...article, likedAt: new Date().toISOString() }];
    }
    setLikedArticles(updatedLikes);
    await saveData('likedArticles', updatedLikes);
    
    // 기사 좋아요 수 업데이트 (함수가 제공된 경우)
    if (incrementArticleLikes && typeof incrementArticleLikes === 'function') {
      await incrementArticleLikes(article.id, !isLiked);
    }
    
    return !isLiked;
  };
  
  const addViewRecord = async (articleData) => {
    if (!articleData) {
      console.error('❌ addViewRecord: articleData가 없습니다');
      return;
    }
    
    const newRecord = {
      articleId: articleData.id || '',
      title: articleData.title || '',
      category: articleData.category || '',
      viewedAt: new Date().toISOString(),
      summary: articleData.summary || '',
    };
    
    // undefined 값 체크
    if (!newRecord.articleId) {
      console.error('❌ addViewRecord: articleId가 없습니다', articleData);
      return;
    }
    
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

  // 공지사항 관련 함수들
  const getAnnouncements = async (limitCount = 10) => {
    try {
      console.log('🔍 공지사항 로드 시작');
      
      // 가장 안전한 방법: 전체 컬렉션을 가져와서 클라이언트에서 필터링/정렬
      try {
        // 먼저 간단한 쿼리 시도
        const collectionRef = collection(db, 'announcements');
        const querySnapshot = await getDocs(collectionRef);
        console.log(`📊 전체 공지사항 문서 개수: ${querySnapshot.size}`);
        const announcements = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log(`📋 공지사항 문서 발견: ${doc.id}, 상태: ${data.status}`, data);
          // published 상태인 것만 필터링
          if (data.status === 'published') {
            announcements.push({
              id: doc.id,
              ...data
            });
          }
        });
        
        // 클라이언트에서 정렬: 고정된 것 먼저, 그 다음 날짜순
        announcements.sort((a, b) => {
          // 먼저 isSticky로 정렬 (true가 먼저)
          if (a.isSticky !== b.isSticky) {
            return b.isSticky ? 1 : -1;
          }
          // 그 다음 createdAt으로 정렬 (최신이 먼저)
          const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return bDate - aDate;
        });
        
        console.log(`✅ 공지사항 ${announcements.length}개 로드 완료`);
        return announcements.slice(0, limitCount);
        
      } catch (firestoreError) {
        console.error('Firestore 쿼리 실패:', firestoreError);
        // 백업: 빈 배열 반환
        return [];
      }
    } catch (error) {
      console.error('공지사항 로드 실패:', error);
      return [];
    }
  };

  const createAnnouncement = async (announcementData) => {
    try {
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        throw new Error('관리자 권한이 필요합니다.');
      }

      // 이미지 업로드 처리
      let imageUrls = [];
      if (announcementData.images && announcementData.images.length > 0) {
        try {
          const { uploadMultipleImages } = await import('../utils/imageUpload');
          const imageFiles = announcementData.images.filter(img => img.file);
          
          if (imageFiles.length > 0) {
            const uploadResults = await uploadMultipleImages(
              imageFiles.map(img => img.file),
              'announcements'
            );
            imageUrls = uploadResults.map(result => ({
              url: result.url,
              fileName: result.fileName,
              originalName: result.originalName,
              size: result.size,
              type: result.type
            }));
          }
        } catch (uploadError) {
          console.error('이미지 업로드 실패:', uploadError);
          throw new Error('이미지 업로드 중 오류가 발생했습니다.');
        }
      }

      const newAnnouncement = {
        title: announcementData.title,
        content: announcementData.content,
        type: announcementData.type || 'general',
        isSticky: announcementData.isSticky || false,
        images: imageUrls,
        status: 'published',
        author: user.name || user.email,
        authorId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'announcements'), newAnnouncement);
      return docRef.id;
    } catch (error) {
      console.error('공지사항 생성 실패:', error);
      throw error;
    }
  };

  const updateAnnouncement = async (announcementId, updates) => {
    try {
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        throw new Error('관리자 권한이 필요합니다.');
      }

      const announcementRef = doc(db, 'announcements', announcementId);
      await updateDoc(announcementRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('공지사항 업데이트 실패:', error);
      throw error;
    }
  };

  const deleteAnnouncement = async (announcementId) => {
    try {
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        throw new Error('관리자 권한이 필요합니다.');
      }

      const announcementRef = doc(db, 'announcements', announcementId);
      await deleteDoc(announcementRef);
    } catch (error) {
      console.error('공지사항 삭제 실패:', error);
      throw error;
    }
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
    isWordSaved: (word) => {
      if (!word) return false;
      return savedWords.some(w => 
        w && typeof w.word === 'string' && w.word.toLowerCase() === word.toLowerCase()
      );
    },
    toggleLike,
    isArticleLiked: (articleId) => likedArticles.some(a => a.id === articleId),
    addViewRecord,
    updateSettings,
    getStats,
    // 복원된 다른 함수들 (필요 시 여기에 추가)
    updateActivityTime: () => updateSettings({ lastActivityTime: new Date().toISOString() }),
    getArticleById: (articleId) => viewRecords.find(r => r.articleId === articleId) || null,
    // 공지사항 관련 함수들
    getAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};