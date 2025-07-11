import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc, setDoc, collection, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { startScheduledArticleChecker } from '../utils/scheduledArticleChecker';
import { isAfterKoreanTime } from '../utils/timeUtils';

const ArticlesContext = createContext();

export const useArticles = () => useContext(ArticlesContext);

const defaultCategories = [
  { id: 'recent', name: 'Recent', type: 'recent' },
  { id: 'technology', name: 'Technology', type: 'category' },
  { id: 'science', name: 'Science', type: 'category' },
  { id: 'business', name: 'Business', type: 'category' },
  { id: 'culture', name: 'Culture', type: 'category' },
  { id: 'society', name: 'Society', type: 'category' },
  { id: 'popular', name: 'Popular', type: 'popular' }
];

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
      console.error("🚨 Firebase 기사 추가 실패:", e);
      console.error("🚨 에러 코드:", e.code);
      console.error("🚨 에러 메시지:", e.message);
      console.error("🚨 에러 스택:", e.stack);
      setError("기사 추가에 실패했습니다.");
      return null;
    }
  }, []);

  const updateArticle = useCallback(async (articleId, updatedData) => {
    const articleDocRef = doc(db, 'articles', articleId);
    try {
      await updateDoc(articleDocRef, { ...updatedData, updatedAt: new Date().toISOString() });
      
      const updatedArticle = { ...updatedData, id: articleId };
      setAllArticles(prev => prev.map(a => a.id === articleId ? { ...a, ...updatedData } : a));
      
      // 전역 이벤트 발생
      window.dispatchEvent(new CustomEvent('articleUpdated', {
        detail: { type: 'update', article: updatedArticle }
      }));
      
      return true;
    } catch (e) {
      console.error("기사 수정 실패:", e);
      setError("기사 수정에 실패했습니다.");
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

  useEffect(() => {
    const loadData = async () => {
      await fetchCategories();
      await fetchArticles();
    };
    loadData();
    
    // 예약 기사 자동 발행 체크 시작
    const stopScheduledChecker = startScheduledArticleChecker();
    
    return () => {
      // 컴포넌트 언마운트 시 체크 중지
      stopScheduledChecker();
    };
  }, [fetchCategories, fetchArticles]);

  const getArticlesByCategory = useCallback((categoryName, limit = null) => {
    const filtered = allArticles.filter(article => {
      // published 상태이고 발행 시간이 지난 기사만 표시 (한국 시간 기준)
      const isPublished = article.status === 'published';
      const isTimeToPublish = isAfterKoreanTime(article.publishedAt);
      return article.category === categoryName && isPublished && isTimeToPublish;
    });
    return limit ? filtered.slice(0, limit) : filtered;
  }, [allArticles]);

  const getRecentArticles = useCallback((limit = 10) => {
    return [...allArticles]
      .filter(article => {
        // published 상태이고 발행 시간이 지난 기사만 표시 (한국 시간 기준)
        const isPublished = article.status === 'published';
        const isTimeToPublish = isAfterKoreanTime(article.publishedAt);
        return isPublished && isTimeToPublish;
      })
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, limit);
  }, [allArticles]);

  const getPopularArticles = useCallback((limit = 10) => {
    // 지난 이틀 (48시간) 기준으로 변경
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    
    return [...allArticles]
      .filter(article => {
        // published 상태이고 발행 시간이 지난 기사만 표시 (한국 시간 기준)
        const isPublished = article.status === 'published';
        const isTimeToPublish = isAfterKoreanTime(article.publishedAt);
        const isRecent = new Date(article.publishedAt) >= twoDaysAgo;
        return isPublished && isTimeToPublish && isRecent;
      })
      .sort((a, b) => {
        // 좋아요 + 조회수를 합산한 인기도 점수로 정렬
        const scoreA = (a.likes || 0) + (a.views || 0);
        const scoreB = (b.likes || 0) + (b.views || 0);
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }, [allArticles]);

  const getArticleById = useCallback((articleId) => {
    return allArticles.find(article => article.id === articleId) || null;
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

  const value = useMemo(() => ({
    allArticles,
    categories,
    loading,
    error,
    getArticlesByCategory,
    getRecentArticles,
    getPopularArticles,
    getArticleById,
    refreshArticles: fetchArticles,
    addArticle,
    updateArticle,
    deleteArticle,
    updateCategories,
    incrementArticleViews,
    incrementArticleLikes,
  }), [allArticles, categories, loading, error, getArticlesByCategory, getRecentArticles, getPopularArticles, getArticleById, fetchArticles, addArticle, updateArticle, deleteArticle, updateCategories, incrementArticleViews, incrementArticleLikes]);

  return (
    <ArticlesContext.Provider value={value}>
      {children}
    </ArticlesContext.Provider>
  );
};
