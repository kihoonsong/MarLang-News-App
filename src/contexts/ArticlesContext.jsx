import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc, setDoc, collection, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { isAfterKoreanTime } from '../utils/timeUtils';

const ArticlesContext = createContext();

const defaultCategories = [
  { id: 'recent', name: 'Recent', type: 'recent' },
  { id: 'technology', name: 'Technology', type: 'category', color: '#d6eaff' },
  { id: 'science', name: 'Science', type: 'category', color: '#e0f0ff' },
  { id: 'business', name: 'Business', type: 'category', color: '#ffe2c6' },
  { id: 'culture', name: 'Culture', type: 'category', color: '#ffd6ec' },
  { id: 'society', name: 'Society', type: 'category', color: '#e6ffe6' },
  { id: 'popular', name: 'Popular', type: 'popular' }
];

export const useArticles = () => {
  const context = useContext(ArticlesContext);
  
  // Context가 null이거나 undefined인 경우 안전한 기본값 반환
  if (!context) {
    console.warn('⚠️ ArticlesContext가 초기화되지 않았습니다. 기본값을 사용합니다.');
    return {
      allArticles: [],
      categories: defaultCategories,
      loading: true,
      error: null,
      getArticlesByCategory: () => [],
      getRecentArticles: () => [],
      getPopularArticles: () => [],
      getArticleById: () => null,
      getScheduledArticles: () => [],
      getDraftArticles: () => [],
      refreshArticles: () => Promise.resolve(),
      addArticle: () => Promise.reject(new Error('Context not initialized')),
      updateArticle: () => Promise.reject(new Error('Context not initialized')),
      deleteArticle: () => Promise.reject(new Error('Context not initialized')),
      updateCategories: () => Promise.reject(new Error('Context not initialized')),
      incrementArticleViews: () => Promise.reject(new Error('Context not initialized')),
      incrementArticleLikes: () => Promise.reject(new Error('Context not initialized')),
      publishArticleManually: () => Promise.reject(new Error('Context not initialized')),
    };
  }
  
  return context;
};

export const ArticlesProvider = ({ children }) => {
  const [allArticles, setAllArticles] = useState([]);
  const [categories, setCategories] = useState(defaultCategories);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async () => {
    const catDocRef = doc(db, 'config', 'categories');
    try {
      const docSnap = await getDoc(catDocRef);
      if (docSnap.exists() && docSnap.data().list) {
        setCategories(docSnap.data().list);
      } else {
        await setDoc(catDocRef, { list: defaultCategories });
      }
    } catch (e) {
      console.error("카테고리 로딩 실패:", e);
      setError("카테고리를 불러오는 데 실패했습니다.");
    }
  }, []);

  const updateCategories = useCallback(async (newCategories) => {
    const catDocRef = doc(db, 'config', 'categories');
    try {
      if (import.meta.env.DEV) {
        console.log('🏷️ 카테고리 업데이트 시작:', newCategories);
      }
      await setDoc(catDocRef, { list: newCategories });
      setCategories(newCategories);
      
      // 전역 이벤트 발생으로 다른 컴포넌트에 알림
      window.dispatchEvent(new CustomEvent('categoriesUpdated', {
        detail: { categories: newCategories }
      }));
      
      if (import.meta.env.DEV) {
        console.log('✅ 카테고리 업데이트 완료');
      }
      return true;
    } catch (e) {
      console.error("🚨 카테고리 업데이트 실패:", e);
      setError("카테고리 업데이트에 실패했습니다.");
      return false;
    }
  }, []);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const articlesCol = collection(db, 'articles');
      const articleSnapshot = await getDocs(articlesCol);
      const articleList = articleSnapshot.docs.map(doc => ({...doc.data(), id: doc.id }));
      articleList.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      setAllArticles(articleList);
    } catch (e) {
      setError('기사를 불러오는 데 실패했습니다.');
      console.error("기사 로딩 실패:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const addArticle = useCallback(async (articleData) => {
    try {
      if (import.meta.env.DEV) {
        console.log('🔥 Firebase addArticle 시작...');
        console.log('📊 전달받은 데이터:', articleData);
        console.log('🗃️ DB 인스턴스:', db);
      }
      
      const articlesCol = collection(db, 'articles');
      if (import.meta.env.DEV) {
        console.log('📝 Articles 컬렉션 참조:', articlesCol);
      }
      
      const dataToAdd = { ...articleData, createdAt: new Date().toISOString() };
      if (import.meta.env.DEV) {
        console.log('💾 Firebase에 저장할 데이터:', dataToAdd);
      }
      
      const docRef = await addDoc(articlesCol, dataToAdd);
      if (import.meta.env.DEV) {
        console.log('✅ Firebase 문서 생성 성공:', docRef.id);
      }
      
      const newArticle = { ...articleData, id: docRef.id };
      setAllArticles(prev => {
        const updated = [newArticle, ...prev];
        if (import.meta.env.DEV) {
          console.log('📱 로컬 상태 업데이트 완료. 총 기사 수:', updated.length);
        }
        return updated;
      });
      
      // 전역 이벤트 발생으로 다른 컴포넌트에 알림
      window.dispatchEvent(new CustomEvent('articleUpdated', {
        detail: { type: 'add', article: newArticle }
      }));
      
      return docRef.id;
    } catch (e) {
      console.error("🚨 Firebase addArticle 실패:", e);
      console.error("🚨 에러 코드:", e.code);
      console.error("🚨 에러 메시지:", e.message);
      console.error("🚨 articleData:", articleData);
      
      let errorMessage = "기사 추가에 실패했습니다";
      if (e.code === 'permission-denied') {
        errorMessage = "권한이 없습니다. 관리자 권한으로 로그인해 주세요.";
      } else if (e.code === 'unavailable') {
        errorMessage = "서버에 연결할 수 없습니다. 인터넷 연결을 확인해 주세요.";
      } else if (e.message) {
        errorMessage = `${errorMessage}: ${e.message}`;
      }
      
      setError(errorMessage);
      throw e;
    }
  }, []);

  const updateArticle = useCallback(async (articleId, updatedData) => {
    const articleDocRef = doc(db, 'articles', articleId);
    try {
      await updateDoc(articleDocRef, { 
        ...updatedData, 
        updatedAt: new Date().toISOString() 
      });
      
      // 로컬 상태 업데이트
      setAllArticles(prev => prev.map(article => 
        article.id === articleId 
          ? { ...article, ...updatedData, updatedAt: new Date().toISOString() }
          : article
      ));
      
      // 전역 이벤트 발생
      window.dispatchEvent(new CustomEvent('articleUpdated', {
        detail: { type: 'update', article: { id: articleId, ...updatedData } }
      }));
      
      return true;
    } catch (e) {
      console.error("🚨 기사 수정 실패:", e);
      console.error("🚨 에러 코드:", e.code);
      console.error("🚨 에러 메시지:", e.message);
      console.error("🚨 articleId:", articleId);
      console.error("🚨 updatedData:", updatedData);
      
      let errorMessage = "기사 수정에 실패했습니다";
      if (e.code === 'permission-denied') {
        errorMessage = "권한이 없습니다. 관리자 권한으로 로그인해 주세요.";
      } else if (e.code === 'not-found') {
        errorMessage = "수정하려는 기사를 찾을 수 없습니다.";
      } else if (e.code === 'unavailable') {
        errorMessage = "서버에 연결할 수 없습니다. 인터넷 연결을 확인해 주세요.";
      } else if (e.message) {
        errorMessage = `${errorMessage}: ${e.message}`;
      }
      
      setError(errorMessage);
      return false;
    }
  }, []);

  const deleteArticle = useCallback(async (articleId) => {
    const articleDocRef = doc(db, 'articles', articleId);
    try {
      // 삭제 전에 기사 정보 저장
      const articleToDelete = allArticles.find(a => a.id === articleId);
      
      await deleteDoc(articleDocRef);
      setAllArticles(prev => prev.filter(a => a.id !== articleId));
      
      // 전역 이벤트 발생
      if (articleToDelete) {
        window.dispatchEvent(new CustomEvent('articleUpdated', {
          detail: { type: 'delete', article: articleToDelete }
        }));
      }
      
      return true;
    } catch (e) {
      console.error("기사 삭제 실패:", e);
      setError("기사 삭제에 실패했습니다.");
      return false;
    }
  }, [allArticles]);

  const getArticlesByCategory = useCallback((categoryName, limit = null) => {
    try {
      if (!Array.isArray(allArticles) || !categoryName) {
        return [];
      }
      
      const filtered = allArticles.filter(article => {
        if (!article || typeof article !== 'object') {
          return false;
        }
        
        // published 상태인 기사만 표시 (scheduled 기사는 제외)
        const isPublished = article.status === 'published';
        
        // 추가 안전장치: scheduled 상태면 무조건 제외
        if (article.status === 'scheduled') {
          if (import.meta.env.DEV) {
            console.log('🚫 예약 기사 제외:', article.title, article.status);
          }
          return false;
        }
        
        return article.category === categoryName && isPublished;
      });
      
      return limit && typeof limit === 'number' ? filtered.slice(0, limit) : filtered;
    } catch (error) {
      console.error('getArticlesByCategory 오류:', error);
      return [];
    }
  }, [allArticles]);

  const getRecentArticles = useCallback((limit = 10) => {
    try {
      if (!Array.isArray(allArticles)) {
        return [];
      }
      
      return [...allArticles]
        .filter(article => {
          if (!article || typeof article !== 'object') {
            return false;
          }
          
          // published 상태인 기사만 표시 (scheduled 기사는 제외)
          const isPublished = article.status === 'published';
          
          // 추가 안전장치: scheduled 상태면 무조건 제외
          if (article.status === 'scheduled') {
            if (import.meta.env.DEV) {
              console.log('🚫 예약 기사 제외 (Recent):', article.title, article.status);
            }
            return false;
          }
          
          return isPublished;
        })
        .sort((a, b) => {
          try {
            return new Date(b.publishedAt) - new Date(a.publishedAt);
          } catch (sortError) {
            return 0;
          }
        })
        .slice(0, typeof limit === 'number' ? limit : 10);
    } catch (error) {
      console.error('getRecentArticles 오류:', error);
      return [];
    }
  }, [allArticles]);

  const getPopularArticles = useCallback((limit = 10) => {
    // 지난 이틀 (48시간) 기준으로 변경
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    
    const recentPopular = [...allArticles]
      .filter(article => {
        // published 상태인 기사만 표시 (scheduled 기사는 제외)
        const isPublished = article.status === 'published';
        
        // 추가 안전장치: scheduled 상태면 무조건 제외
        if (article.status === 'scheduled') {
          console.log('🚫 예약 기사 제외 (Popular):', article.title, article.status);
          return false;
        }
        
        const isRecent = new Date(article.publishedAt) >= twoDaysAgo;
        return isPublished && isRecent;
      })
      .sort((a, b) => {
        // 좋아요 + 조회수를 합산한 인기도 점수로 정렬
        const scoreA = (a.likes || 0) + (a.views || 0);
        const scoreB = (b.likes || 0) + (b.views || 0);
        return scoreB - scoreA;
      })
      .slice(0, limit);

    // 최근 2일간 데이터가 부족하면 일주일 통계로 대체
    if (recentPopular.length < limit) {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const weeklyPopular = [...allArticles]
        .filter(article => {
          const isPublished = article.status === 'published';
          if (article.status === 'scheduled') {
            return false;
          }
          
          const isRecent = new Date(article.publishedAt) >= oneWeekAgo;
          return isPublished && isRecent;
        })
        .sort((a, b) => {
          const scoreA = (a.likes || 0) + (a.views || 0);
          const scoreB = (b.likes || 0) + (b.views || 0);
          return scoreB - scoreA;
        })
        .slice(0, limit - recentPopular.length);

      return [...recentPopular, ...weeklyPopular];
    }

    return recentPopular;
  }, [allArticles]);

  const getArticleById = useCallback((articleId) => {
    try {
      if (!Array.isArray(allArticles) || !articleId) {
        return null;
      }
      return allArticles.find(article => article.id === articleId) || null;
    } catch (error) {
      console.error('getArticleById 오류:', error);
      return null;
    }
  }, [allArticles]);

  const getScheduledArticles = useCallback(() => {
    try {
      if (!Array.isArray(allArticles)) {
        return [];
      }
      return allArticles.filter(article => article.status === 'scheduled');
    } catch (error) {
      console.error('getScheduledArticles 오류:', error);
      return [];
    }
  }, [allArticles]);

  const getDraftArticles = useCallback(() => {
    try {
      if (!Array.isArray(allArticles)) {
        return [];
      }
      return allArticles.filter(article => article.status === 'draft');
    } catch (error) {
      console.error('getDraftArticles 오류:', error);
      return [];
    }
  }, [allArticles]);

  // 기사 조회수 증가
  const incrementArticleViews = useCallback(async (articleId) => {
    try {
      const articleDocRef = doc(db, 'articles', articleId);
      const articleDoc = await getDoc(articleDocRef);
      
      if (articleDoc.exists()) {
        const currentViews = articleDoc.data().views || 0;
        
        await updateDoc(articleDocRef, { 
          views: currentViews + 1,
          updatedAt: new Date().toISOString()
        });
        
        // 로컬 상태 업데이트
        setAllArticles(prev => prev.map(article => 
          article.id === articleId 
            ? { ...article, views: currentViews + 1 }
            : article
        ));
        
        if (import.meta.env.DEV) {
          console.log(`✅ 기사 ${articleId} 조회수 증가: ${currentViews} → ${currentViews + 1}`);
        }
        return true;
      }
    } catch (error) {
      console.error('기사 조회수 증가 실패:', error);
      return false;
    }
  }, []);

  // 기사 좋아요 수 증가/감소
  const incrementArticleLikes = useCallback(async (articleId, increment = true) => {
    try {
      const articleDocRef = doc(db, 'articles', articleId);
      const articleDoc = await getDoc(articleDocRef);
      
      if (articleDoc.exists()) {
        const currentLikes = articleDoc.data().likes || 0;
        const newLikes = increment ? currentLikes + 1 : Math.max(0, currentLikes - 1);
        
        await updateDoc(articleDocRef, { 
          likes: newLikes,
          updatedAt: new Date().toISOString()
        });
        
        // 로컬 상태 업데이트
        setAllArticles(prev => prev.map(article => 
          article.id === articleId 
            ? { ...article, likes: newLikes }
            : article
        ));
        
        if (import.meta.env.DEV) {
          console.log(`✅ 기사 ${articleId} 좋아요 ${increment ? '증가' : '감소'}: ${currentLikes} → ${newLikes}`);
        }
        return true;
      }
    } catch (error) {
      console.error('기사 좋아요 업데이트 실패:', error);
      return false;
    }
  }, []);

  // 수동 발행 기능 (예약 기사를 즉시 발행) - UTC 기준으로 수정
  const publishArticleManually = useCallback(async (articleId) => {
    try {
      const articleDocRef = doc(db, 'articles', articleId);
      const nowUTC = new Date();
      const nowUTCISO = nowUTC.toISOString();
      
      console.log(`🔧 수동 발행 시작: ${articleId} at ${nowUTCISO}`);
      
      await updateDoc(articleDocRef, {
        status: 'published',
        actualPublishedAt: nowUTCISO, // 실제 발행 시간 (UTC)
        publishedAt: nowUTCISO, // 발행 시간을 현재 시간으로 업데이트 (UTC)
        updatedAt: nowUTCISO
      });

      // 로컬 상태 업데이트
      setAllArticles(prev => prev.map(article => 
        article.id === articleId 
          ? { 
              ...article, 
              status: 'published', 
              actualPublishedAt: nowUTCISO, 
              publishedAt: nowUTCISO,
              updatedAt: nowUTCISO
            }
          : article
      ));

      console.log(`✅ 수동 발행 완료: ${articleId}`);
      return true;
    } catch (error) {
      console.error('🚨 수동 발행 실패:', error);
      return false;
    }
  }, []);

  const contextValue = useMemo(() => {
    return {
      allArticles,
      categories,
      loading,
      error,
      getArticlesByCategory,
      getRecentArticles,
      getPopularArticles,
      getArticleById,
      getScheduledArticles,
      getDraftArticles,
      refreshArticles: fetchArticles,
      addArticle,
      updateArticle,
      deleteArticle,
      updateCategories,
      incrementArticleViews,
      incrementArticleLikes,
      publishArticleManually,
    };
  }, [allArticles, categories, loading, error, getArticlesByCategory, getRecentArticles, getPopularArticles, getArticleById, getScheduledArticles, getDraftArticles, fetchArticles, addArticle, updateArticle, deleteArticle, updateCategories, incrementArticleViews, incrementArticleLikes, publishArticleManually]);

  useEffect(() => {
    const loadData = async () => {
      await fetchCategories();
      await fetchArticles();
    };
    loadData();
  }, [fetchCategories, fetchArticles]);

  return (
    <ArticlesContext.Provider value={contextValue}>
      {children}
    </ArticlesContext.Provider>
  );
};
