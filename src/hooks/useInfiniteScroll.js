import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 클라이언트 사이드 무한 스크롤 훅
 * 배열 데이터를 받아서 페이지네이션 처리
 */
export const useInfiniteScroll = (
  allItems = [], 
  itemsPerPage = 20,
  initialLoad = 20
) => {
  const [visibleItems, setVisibleItems] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const currentPageRef = useRef(0);
  const loadingRef = useRef(false);
  const observerRef = useRef(null);
  const isUnmountedRef = useRef(false);

  // 초기 로드 및 데이터 변경 시 리셋
  useEffect(() => {
    if (!Array.isArray(allItems)) {
      setError('Invalid data format');
      return;
    }

    setError(null);
    currentPageRef.current = 0;
    loadingRef.current = false;
    
    const initialItems = allItems.slice(0, initialLoad);
    setVisibleItems(initialItems);
    setHasMore(allItems.length > initialLoad);
  }, [allItems, initialLoad]);

  // 더 많은 아이템 로드
  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore || !Array.isArray(allItems) || isUnmountedRef.current) {
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // 인위적 딜레이 (UX 향상)
      await new Promise(resolve => setTimeout(resolve, 300));

      // 컴포넌트가 언마운트되었는지 다시 확인
      if (isUnmountedRef.current) {
        return;
      }

      const nextPage = currentPageRef.current + 1;
      const startIndex = nextPage * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      
      const newItems = allItems.slice(startIndex, endIndex);
      
      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setVisibleItems(prev => [...prev, ...newItems]);
        currentPageRef.current = nextPage;
        setHasMore(endIndex < allItems.length);
      }
    } catch (err) {
      if (!isUnmountedRef.current) {
        setError(err.message || 'Failed to load more items');
      }
    } finally {
      if (!isUnmountedRef.current) {
        setLoading(false);
      }
      loadingRef.current = false;
    }
  }, [allItems, itemsPerPage, hasMore]);

  // Intersection Observer 설정
  const lastItemRef = useCallback((node) => {
    if (loading || !hasMore || isUnmountedRef.current) return;
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current && !isUnmountedRef.current) {
          loadMore();
        }
      },
      {
        rootMargin: '100px', // 100px 전에 미리 로드
        threshold: 0.1
      }
    );
    
    if (node && !isUnmountedRef.current) {
      observerRef.current.observe(node);
    }
  }, [loading, hasMore, loadMore]);

  // 컴포넌트 언마운트 시 observer 정리
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      loadingRef.current = false;
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  // 수동 새로고침
  const refresh = useCallback(() => {
    currentPageRef.current = 0;
    loadingRef.current = false;
    const initialItems = allItems.slice(0, initialLoad);
    setVisibleItems(initialItems);
    setHasMore(allItems.length > initialLoad);
    setError(null);
  }, [allItems, initialLoad]);

  return {
    visibleItems,
    hasMore,
    loading,
    error,
    loadMore,
    lastItemRef,
    refresh,
    totalItems: allItems.length,
    visibleCount: visibleItems.length
  };
};

export default useInfiniteScroll;