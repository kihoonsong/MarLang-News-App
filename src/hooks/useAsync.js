import { useState, useEffect, useCallback, useRef } from 'react';

// 비동기 작업을 위한 커스텀 훅
const useAsync = (asyncFunction, dependencies = []) => {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null
  });
  
  const mountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  // 컴포넌트 언마운트 시 플래그 업데이트
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const execute = useCallback(async (...args) => {
    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 새 AbortController 생성
    abortControllerRef.current = new AbortController();

    setState(prevState => ({
      ...prevState,
      loading: true,
      error: null
    }));

    try {
      // signal은 asyncFunction이 지원하는 경우에만 전달
      const data = await asyncFunction(...args);
      
      if (mountedRef.current) {
        setState({
          data,
          loading: false,
          error: null
        });
      }
    } catch (error) {
      if (mountedRef.current && error.name !== 'AbortError') {
        setState({
          data: null,
          loading: false,
          error: error.message || 'An error occurred'
        });
      }
    }
  }, [asyncFunction]);

  // dependencies가 변경될 때 자동 실행
  useEffect(() => {
    execute();
  }, [execute, ...dependencies]);

  const retry = useCallback(() => {
    execute();
  }, [execute]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null
    });
  }, []);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    execute,
    retry,
    reset
  };
};

// 뉴스 데이터를 위한 특화된 훅
export const useNews = (category = 'Technology', limit = 20) => {
  const [newsService, setNewsService] = useState(null);
  
  useEffect(() => {
    import('../services/enhancedNewsApi.js').then(module => {
      setNewsService(module.default);
    });
  }, []);

  const asyncFn = useCallback(async () => {
    if (!newsService) {
      // 폴백 데이터 직접 반환
      const fallbackData = [
        {
          id: 'fallback-1',
          title: 'The Future of Artificial Intelligence in Everyday Life',
          category: 'Technology',
          publishedAt: new Date().toISOString(),
          summary: 'Exploring how AI technologies are becoming integrated into our daily routines and what this means for the future.',
          content: 'Artificial intelligence is no longer a concept confined to science fiction. Today, AI technologies are becoming increasingly integrated into our everyday lives...',
          image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
          level: 'Intermediate',
          readingTime: 5,
          wordCount: 650,
          source: 'NewStep',
          tags: ['AI', 'Technology', 'Future', 'Innovation']
        },
        {
          id: 'fallback-2',
          title: 'Climate Change Solutions: Renewable Energy Advances',
          category: 'Science',
          publishedAt: new Date(Date.now() - 86400000).toISOString(),
          summary: 'Recent breakthroughs in renewable energy technology offer new hope for addressing climate change challenges.',
          content: 'Scientists and engineers around the world are developing innovative solutions to combat climate change through renewable energy...',
          image: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=800&q=80',
          level: 'Beginner',
          readingTime: 4,
          wordCount: 520,
          source: 'NewStep',
          tags: ['Climate', 'Energy', 'Environment', 'Science']
        },
        {
          id: 'fallback-3',
          title: 'Global Economic Trends: Digital Transformation Impact',
          category: 'Business',
          publishedAt: new Date(Date.now() - 172800000).toISOString(),
          summary: 'How digital transformation is reshaping global economies and creating new business opportunities.',
          content: 'The digital transformation has fundamentally altered the landscape of global business and economics...',
          image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
          level: 'Advanced',
          readingTime: 6,
          wordCount: 780,
          source: 'NewStep',
          tags: ['Economy', 'Business', 'Digital', 'Technology']
        },
        {
          id: 'fallback-4',
          title: 'Machine Learning Breakthrough in Medical Diagnosis',
          category: 'Technology',
          publishedAt: new Date(Date.now() - 259200000).toISOString(),
          summary: 'New machine learning algorithms are revolutionizing medical diagnosis with unprecedented accuracy.',
          content: 'Medical professionals are increasingly turning to machine learning tools to assist in complex diagnoses...',
          image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=800&q=80',
          level: 'Intermediate',
          readingTime: 7,
          wordCount: 890,
          source: 'NewStep',
          tags: ['Medicine', 'AI', 'Healthcare', 'Technology']
        },
        {
          id: 'fallback-5',
          title: 'Sustainable Transportation: Electric Vehicle Revolution',
          category: 'Technology',
          publishedAt: new Date(Date.now() - 345600000).toISOString(),
          summary: 'Electric vehicles are transforming the automotive industry and paving the way for sustainable transportation.',
          content: 'The electric vehicle revolution is reshaping not just the automotive industry, but our entire approach to transportation...',
          image: 'https://images.unsplash.com/photo-1593941707882-a5bac6861d75?auto=format&fit=crop&w=800&q=80',
          level: 'Beginner',
          readingTime: 5,
          wordCount: 670,
          source: 'NewStep',
          tags: ['Electric', 'Transportation', 'Environment', 'Innovation']
        }
      ];
      return fallbackData.filter(article => !category || category === 'All' || article.category === category);
    }
    return await newsService.fetchArticles(category, limit);
  }, [newsService, category, limit]);

  return useAsync(asyncFn, [newsService, category, limit]);
};

// 검색을 위한 훅
export const useSearch = () => {
  const [newsService, setNewsService] = useState(null);
  
  useEffect(() => {
    import('../services/enhancedNewsApi.js').then(module => {
      setNewsService(module.default);
    });
  }, []);

  const searchFn = useCallback(async (query, filters = {}) => {
    if (!newsService) throw new Error('News service not loaded');
    if (!query || query.trim().length === 0) return [];
    return await newsService.searchArticles(query, filters);
  }, [newsService]);

  const { data, loading, error, execute } = useAsync(searchFn, []);

  const search = useCallback((query, filters) => {
    execute(query, filters);
  }, [execute]);

  return {
    results: data || [],
    loading,
    error,
    search
  };
};

// 단일 기사를 위한 훅
export const useArticle = (articleId) => {
  const [newsService, setNewsService] = useState(null);
  
  useEffect(() => {
    import('../services/enhancedNewsApi.js').then(module => {
      setNewsService(module.default);
    });
  }, []);

  const asyncFn = useCallback(async () => {
    if (!newsService || !articleId) return null;
    return await newsService.getArticleById(articleId);
  }, [newsService, articleId]);

  return useAsync(asyncFn, [articleId]);
};

// 트렌딩 기사를 위한 훅
export const useTrending = (limit = 10) => {
  const [newsService, setNewsService] = useState(null);
  
  useEffect(() => {
    import('../services/enhancedNewsApi.js').then(module => {
      setNewsService(module.default);
    });
  }, []);

  const asyncFn = useCallback(async () => {
    if (!newsService) throw new Error('News service not loaded');
    return await newsService.getTrendingArticles(limit);
  }, [newsService, limit]);

  return useAsync(asyncFn, [limit]);
};

export default useAsync;