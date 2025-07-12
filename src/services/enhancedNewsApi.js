// 향상된 뉴스 API 서비스
// 에러 처리, 재시도 로직, 네트워크 상태 감지 포함

const NEWS_API_ENDPOINTS = {
  // NewsAPI.org (무료 계정: 100 requests/day)
  newsapi: 'https://newsapi.org/v2/everything',
  // The Guardian API (무료)
  guardian: 'https://content.guardianapis.com/search',
  // New York Times API (무료 계정: 1000 requests/day)
  nytimes: 'https://api.nytimes.com/svc/search/v2/articlesearch.json',
};

// 환경 변수에서 API 키 가져오기
const API_KEYS = {
  newsapi: import.meta.env.VITE_NEWS_API_KEY,
  guardian: import.meta.env.VITE_GUARDIAN_API_KEY,
  nytimes: import.meta.env.VITE_NYTIMES_API_KEY,
};

// 카테고리 매핑
const CATEGORY_MAPPING = {
  'Technology': ['technology', 'tech', 'artificial intelligence', 'AI', 'software'],
  'Science': ['science', 'research', 'medicine', 'health', 'environment'],
  'Business': ['business', 'economy', 'finance', 'startup', 'market'],
  'Culture': ['culture', 'arts', 'entertainment', 'music', 'film'],
  'Sports': ['sports', 'football', 'basketball', 'soccer', 'olympics'],
  'Education': ['education', 'university', 'school', 'learning', 'academic']
};

// 난이도별 키워드
const DIFFICULTY_KEYWORDS = {
  'Beginner': ['basic', 'simple', 'introduction', 'guide', 'how to'],
  'Intermediate': ['analysis', 'development', 'research', 'study'],
  'Advanced': ['sophisticated', 'complex', 'comprehensive', 'theoretical', 'methodology']
};

// 에러 타입 분류
const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  API_LIMIT: 'API_LIMIT_EXCEEDED',
  INVALID_KEY: 'INVALID_API_KEY',
  TIMEOUT: 'REQUEST_TIMEOUT',
  SERVER: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// API 에러 분류 함수
const classifyError = (error, response) => {
  if (!navigator.onLine) {
    return { type: ERROR_TYPES.NETWORK, message: 'No internet connection' };
  }

  if (error.name === 'TypeError' || error.message.includes('fetch')) {
    return { type: ERROR_TYPES.NETWORK, message: 'Network connection failed' };
  }

  if (response) {
    switch (response.status) {
      case 401:
        return { type: ERROR_TYPES.INVALID_KEY, message: 'Invalid API key' };
      case 429:
        return { type: ERROR_TYPES.API_LIMIT, message: 'API rate limit exceeded' };
      case 408:
      case 504:
        return { type: ERROR_TYPES.TIMEOUT, message: 'Request timeout' };
      case 500:
      case 502:
      case 503:
        return { type: ERROR_TYPES.SERVER, message: 'Server error' };
      default:
        return { type: ERROR_TYPES.UNKNOWN, message: `HTTP ${response.status}: ${response.statusText}` };
    }
  }

  return { type: ERROR_TYPES.UNKNOWN, message: error.message || 'Unknown error' };
};

// 향상된 fetch 함수 (재시도 로직 포함)
const enhancedFetch = async (url, options = {}, maxRetries = 3, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const fetchOptions = {
    ...options,
    signal: controller.signal
  };

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (import.meta.env.DEV) {
        console.log(`📡 API Request (attempt ${attempt + 1}/${maxRetries + 1}):`, url);
      }
      
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (attempt < maxRetries && (response.status >= 500 || response.status === 408)) {
          if (import.meta.env.DEV) {
            console.warn(`⚠️ Server error ${response.status}, retrying...`);
          }
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (import.meta.env.DEV) {
        console.log('✅ API Request successful');
      }
      return response;

    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;

      if (attempt < maxRetries && (error.name === 'TypeError' || error.name === 'AbortError')) {
        if (import.meta.env.DEV) {
          console.warn(`🔄 Network error, retrying...`);
        }
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
    }
  }

  if (import.meta.env.DEV) {
    console.error('❌ All retry attempts failed');
  }
  throw lastError;
};

class EnhancedNewsApiService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30분 캐시
    this.requestQueue = new Map(); // 중복 요청 방지
    this.errorLog = [];
    this.apiStatus = {
      newsapi: 'unknown',
      guardian: 'unknown',
      nytimes: 'unknown'
    };
  }

  // 에러 로깅
  logError(error, context = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        type: error.type || 'unknown',
        stack: error.stack
      },
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      online: navigator.onLine
    };

    this.errorLog.unshift(errorEntry);
    
    // 최대 100개의 에러 로그만 유지
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(0, 100);
    }

    if (import.meta.env.DEV) {
      console.error('📝 Error logged:', errorEntry);
    }
  }

  // API 상태 확인
  async checkApiStatus(apiName) {
    try {
      const testUrl = this.getTestUrl(apiName);
      if (!testUrl) return 'disabled';

      await enhancedFetch(testUrl, {}, 1, 5000); // 1회만 시도, 5초 타임아웃
      this.apiStatus[apiName] = 'healthy';
      return 'healthy';
    } catch (error) {
      console.warn(`API health check failed for ${apiName}:`, error);
      this.apiStatus[apiName] = 'unhealthy';
      return 'unhealthy';
    }
  }

  getTestUrl(apiName) {
    switch (apiName) {
      case 'newsapi':
        return API_KEYS.newsapi ? 
          `${NEWS_API_ENDPOINTS.newsapi}?q=test&pageSize=1&apiKey=${API_KEYS.newsapi}` : 
          null;
      case 'guardian':
        return API_KEYS.guardian ? 
          `${NEWS_API_ENDPOINTS.guardian}?page-size=1&api-key=${API_KEYS.guardian}` : 
          null;
      default:
        return null;
    }
  }

  // 캐시된 데이터 확인
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      if (import.meta.env.DEV) {
        console.log('💾 Using cached data for:', key);
      }
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  // 데이터 캐시
  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    if (import.meta.env.DEV) {
      console.log('💾 Data cached for:', key);
    }
  }

  // 중복 요청 방지
  async deduplicateRequest(key, requestFn) {
    if (this.requestQueue.has(key)) {
      if (import.meta.env.DEV) {
        console.log('⏳ Waiting for existing request:', key);
      }
      return await this.requestQueue.get(key);
    }

    const promise = requestFn();
    this.requestQueue.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.requestQueue.delete(key);
    }
  }

  // NewsAPI에서 기사 가져오기 (향상됨)
  async fetchFromNewsAPI(category = 'technology', pageSize = 20) {
    if (!API_KEYS.newsapi) {
      throw new Error('NewsAPI key not configured');
    }

    const keywords = CATEGORY_MAPPING[category] || [category];
    const query = keywords.join(' OR ');
    
    const url = new URL(NEWS_API_ENDPOINTS.newsapi);
    url.searchParams.append('q', query);
    url.searchParams.append('language', 'en');
    url.searchParams.append('sortBy', 'publishedAt');
    url.searchParams.append('pageSize', pageSize.toString());
    url.searchParams.append('apiKey', API_KEYS.newsapi);

    try {
      const response = await enhancedFetch(url.toString());
      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(`NewsAPI error: ${data.message}`);
      }

      if (import.meta.env.DEV) {
        console.log(`📰 NewsAPI returned ${data.articles?.length || 0} articles`);
      }
      return this.transformNewsAPIData(data.articles || [], category);
    } catch (error) {
      this.logError(error, { api: 'newsapi', category, pageSize });
      throw error;
    }
  }

  // Guardian API에서 기사 가져오기 (향상됨)
  async fetchFromGuardian(category = 'technology', pageSize = 20) {
    if (!API_KEYS.guardian) {
      throw new Error('Guardian API key not configured');
    }

    const url = new URL(NEWS_API_ENDPOINTS.guardian);
    url.searchParams.append('section', category.toLowerCase());
    url.searchParams.append('page-size', pageSize.toString());
    url.searchParams.append('show-fields', 'thumbnail,bodyText,standfirst');
    url.searchParams.append('api-key', API_KEYS.guardian);

    try {
      const response = await enhancedFetch(url.toString(), {}, 3, 15000);
      const data = await response.json();
      
      if (data.response?.status === 'error') {
        throw new Error(`Guardian API error: ${data.response.message}`);
      }

      if (import.meta.env.DEV) {
        console.log(`📰 Guardian returned ${data.response?.results?.length || 0} articles`);
      }
      return this.transformGuardianData(data.response?.results || [], category);
    } catch (error) {
      this.logError(error, { api: 'guardian', category, pageSize });
      throw error;
    }
  }

  // 폴백용 샘플 데이터 (기존과 동일)
  getFallbackData(category = 'Technology') {
    if (import.meta.env.DEV) {
      console.log('🔄 Using fallback data for category:', category);
    }
    
    const fallbackArticles = [
      {
        id: 'fallback-1',
        title: 'The Future of AI in Everyday Life',
        category: 'Technology',
        publishedAt: new Date().toISOString(),
        summary: 'How AI is changing our daily routines.',
        content: 'AI technologies are becoming part of our lives...',
        image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
        level: 'Intermediate',
        readingTime: 5,
        wordCount: 650,
        source: 'NEWStep',
        tags: ['AI', 'Technology']
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
        source: 'NEWStep',
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
        source: 'NEWStep',
        tags: ['Economy', 'Business', 'Digital', 'Technology']
      }
    ];

    return fallbackArticles.filter(article => 
      !category || article.category === category
    );
  }

  // 데이터 변환 함수들 (기존과 동일하지만 에러 처리 추가)
  transformNewsAPIData(articles, category) {
    try {
      return articles
        .filter(article => article.title && article.description)
        .map((article, index) => ({
          id: `newsapi-${Date.now()}-${index}`,
          title: this.cleanTitle(article.title),
          category: category,
          publishedAt: article.publishedAt,
          summary: article.description,
          content: article.content || article.description,
          image: article.urlToImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80',
          level: 'Intermediate',
          readingTime: 5,
          wordCount: this.countWords(article.content || article.description),
          source: article.source?.name || 'News Source',
          url: article.url,
          tags: [category, 'News']
        }));
    } catch (error) {
      this.logError(error, { function: 'transformNewsAPIData', category });
      return [];
    }
  }

  transformGuardianData(articles, category) {
    try {
      return articles
        .filter(article => article.webTitle && article.fields?.standfirst)
        .map((article, index) => ({
          id: `guardian-${Date.now()}-${index}`,
          title: this.cleanTitle(article.webTitle),
          category: category,
          publishedAt: article.webPublicationDate,
          summary: article.fields.standfirst,
          content: this.generateContent(article.fields.standfirst, article.fields.bodyText),
          image: article.fields.thumbnail || `https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80`,
          level: this.determineDifficulty(article.webTitle + ' ' + article.fields.standfirst),
          readingTime: this.calculateReadingTime(article.fields.bodyText || article.fields.standfirst),
          wordCount: this.countWords(article.fields.bodyText || article.fields.standfirst),
          source: 'The Guardian',
          url: article.webUrl,
          tags: this.extractTags(article.webTitle + ' ' + article.fields.standfirst, category)
        }));
    } catch (error) {
      this.logError(error, { function: 'transformGuardianData', category });
      return [];
    }
  }

  // 유틸리티 함수들 (기존과 동일)
  cleanTitle(title) {
    return title
      .replace(/ - [^-]*$/, '')
      .replace(/^\[.*?\]\s*/, '')
      .trim();
  }

  determineDifficulty(text) {
    const lowerText = text.toLowerCase();
    let scores = { 'Beginner': 0, 'Intermediate': 0, 'Advanced': 0 };

    Object.entries(DIFFICULTY_KEYWORDS).forEach(([level, keywords]) => {
      keywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
          scores[level] += 1;
        }
      });
    });

    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;

    if (avgWordsPerSentence > 20) scores['Advanced'] += 2;
    else if (avgWordsPerSentence > 15) scores['Intermediate'] += 2;
    else scores['Beginner'] += 2;

    return Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b)[0];
  }

  calculateReadingTime(text) {
    if (!text) return 1;
    const wordsPerMinute = 200;
    const wordCount = this.countWords(text);
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }

  countWords(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).length;
  }

  extractTags(text, category) {
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.includes(word));

    const wordCounts = {};
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    const tags = Object.entries(wordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));

    return [category, ...tags];
  }

  generateContent(summary, fullContent) {
    const baseContent = fullContent || summary || '';
    const sentences = baseContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // 헬퍼 함수: 문장들을 연결하고 마침표 하나만 추가
    const joinSentences = (sentenceArray) => {
      if (sentenceArray.length === 0) return '';
      const joined = sentenceArray.join('. ');
      return joined + '.';
    };
    
    return {
      1: {
        title: 'Level 1 - Beginner',
        content: this.simplifyContent(joinSentences(sentences.slice(0, 3)))
      },
      2: {
        title: 'Level 2 - Intermediate', 
        content: joinSentences(sentences.slice(0, 5))
      },
      3: {
        title: 'Level 3 - Advanced',
        content: joinSentences(sentences.slice(0, 8))
      }
    };
  }

  simplifyContent(text) {
    return text
      .replace(/\b(sophisticated|comprehensive|methodology|theoretical)\b/gi, 'advanced')
      .replace(/\b(utilize|implement|facilitate)\b/gi, 'use')
      .replace(/\b(consequently|furthermore|nevertheless)\b/gi, 'so')
      .replace(/\b(approximately|essentially|particularly)\b/gi, 'about');
  }

  // 향상된 메인 API 호출 함수
  async fetchArticles(category = 'Technology', limit = 20) {
    const cacheKey = `articles-${category}-${limit}`;
    
    // 캐시 확인
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    // 중복 요청 방지
    return await this.deduplicateRequest(cacheKey, async () => {
      if (import.meta.env.DEV) {
        console.log(`🔍 Fetching articles for category: ${category}, limit: ${limit}`);
      }
      
      let articles = [];
      const errors = [];

      // 1차 시도: NewsAPI
      if (API_KEYS.newsapi) {
        try {
          const newsApiArticles = await this.fetchFromNewsAPI(category, Math.ceil(limit / 2));
          articles = [...articles, ...newsApiArticles];
          if (import.meta.env.DEV) {
            console.log(`✅ NewsAPI: ${newsApiArticles.length} articles`);
          }
        } catch (error) {
          errors.push({ api: 'NewsAPI', error: error.message });
          if (import.meta.env.DEV) {
            console.warn('❌ NewsAPI failed:', error.message);
          }
        }
      }

      // 2차 시도: Guardian API (추가)
      if (API_KEYS.guardian && articles.length < limit) {
        try {
          const guardianArticles = await this.fetchFromGuardian(category, limit - articles.length);
          articles = [...articles, ...guardianArticles];
          if (import.meta.env.DEV) {
            console.log(`✅ Guardian: ${guardianArticles.length} articles`);
          }
        } catch (error) {
          errors.push({ api: 'Guardian', error: error.message });
          if (import.meta.env.DEV) {
            console.warn('❌ Guardian API failed:', error.message);
          }
        }
      }

      // 3차 시도: 폴백 데이터
      if (articles.length === 0) {
        if (import.meta.env.DEV) {
          console.warn('🔄 All APIs failed, using fallback data');
        }
        articles = this.getFallbackData(category);
        
        // 모든 API가 실패한 경우 에러 로그
        this.logError(new Error('All news APIs failed'), {
          category,
          limit,
          errors,
          fallbackUsed: true
        });
      }

      // 중복 제거 및 제한
      const uniqueArticles = this.removeDuplicates(articles).slice(0, limit);
      
      // 캐시 저장 (폴백 데이터의 경우 짧은 캐시)
      const cacheTime = articles.length > 0 && !articles[0].id.includes('fallback') ? 
        this.cacheExpiry : 5 * 60 * 1000; // 폴백 데이터는 5분만 캐시
      
      this.cache.set(cacheKey, {
        data: uniqueArticles,
        timestamp: Date.now(),
        expires: Date.now() + cacheTime
      });
      
      if (import.meta.env.DEV) {
        console.log(`📊 Final result: ${uniqueArticles.length} articles`);
      }
      return uniqueArticles;
    });
  }

  // 중복 기사 제거
  removeDuplicates(articles) {
    const seen = new Set();
    return articles.filter(article => {
      const key = article.title.toLowerCase().replace(/\s+/g, '');
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // 검색 기능 (향상됨)
  async searchArticles(query, filters = {}) {
    const { category, level, sortBy = 'relevance', limit = 20 } = filters;
    
    const searchKey = `search-${query}-${JSON.stringify(filters)}`;
    
    return await this.deduplicateRequest(searchKey, async () => {
      try {
        if (import.meta.env.DEV) {
          console.log(`🔍 Searching for: "${query}"`);
        }
        
        const categories = category ? [category] : Object.keys(CATEGORY_MAPPING);
        let allArticles = [];
        
        for (const cat of categories) {
          try {
            const articles = await this.fetchArticles(cat, Math.ceil(limit / categories.length));
            allArticles = [...allArticles, ...articles];
          } catch (error) {
            if (import.meta.env.DEV) {
              console.warn(`Failed to fetch articles for category ${cat}:`, error.message);
            }
          }
        }

        // 검색어로 필터링
        const filteredArticles = allArticles.filter(article => {
          const searchText = (article.title + ' ' + article.summary + ' ' + article.tags.join(' ')).toLowerCase();
          return searchText.includes(query.toLowerCase());
        });

        // 레벨 필터링
        let results = level ? filteredArticles.filter(article => article.level === level) : filteredArticles;

        // 정렬
        results = this.sortArticles(results, sortBy, query);

        if (import.meta.env.DEV) {
          console.log(`🔍 Search results: ${results.length} articles found`);
        }
        return results.slice(0, limit);

      } catch (error) {
        this.logError(error, { function: 'searchArticles', query, filters });
        if (import.meta.env.DEV) {
          console.error('Search failed:', error);
        }
        return [];
      }
    });
  }

  // 정렬 함수 (기존과 동일)
  sortArticles(articles, sortBy, query = '') {
    switch (sortBy) {
      case 'date':
        return articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      case 'title':
        return articles.sort((a, b) => a.title.localeCompare(b.title));
      case 'readingTime':
        return articles.sort((a, b) => a.readingTime - b.readingTime);
      case 'relevance':
      default:
        if (query) {
          return articles.sort((a, b) => {
            const aScore = this.calculateRelevanceScore(a, query);
            const bScore = this.calculateRelevanceScore(b, query);
            return bScore - aScore;
          });
        }
        return articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    }
  }

  calculateRelevanceScore(article, query) {
    const lowerQuery = query.toLowerCase();
    let score = 0;
    
    if (article.title.toLowerCase().includes(lowerQuery)) score += 3;
    if (article.summary.toLowerCase().includes(lowerQuery)) score += 2;
    article.tags.forEach(tag => {
      if (tag.toLowerCase().includes(lowerQuery)) score += 1;
    });
    
    return score;
  }

  // 기타 함수들
  async getArticleById(id) {
    for (const [key, cached] of this.cache.entries()) {
      if (key.startsWith('articles-')) {
        const article = cached.data.find(a => a.id === id);
        if (article) return article;
      }
    }

    const fallbackData = this.getFallbackData();
    return fallbackData.find(article => article.id === id) || null;
  }

  async getTrendingArticles(limit = 10) {
    const cacheKey = `trending-${limit}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const articles = await this.fetchArticles('Technology', limit * 2);
      const trending = articles
        .sort((a, b) => b.wordCount - a.wordCount)
        .slice(0, limit);

      this.setCachedData(cacheKey, trending);
      return trending;

    } catch (error) {
      this.logError(error, { function: 'getTrendingArticles', limit });
      if (import.meta.env.DEV) {
        console.error('Failed to fetch trending articles:', error);
      }
      return this.getFallbackData().slice(0, limit);
    }
  }

  // 디버그 정보
  getDebugInfo() {
    return {
      cacheSize: this.cache.size,
      errorCount: this.errorLog.length,
      apiStatus: this.apiStatus,
      queueSize: this.requestQueue.size,
      recentErrors: this.errorLog.slice(0, 5)
    };
  }

  // 캐시 정리
  clearCache() {
    this.cache.clear();
    if (import.meta.env.DEV) {
      console.log('🧹 Cache cleared');
    }
  }

  // 에러 로그 정리
  clearErrorLog() {
    this.errorLog = [];
    if (import.meta.env.DEV) {
      console.log('🧹 Error log cleared');
    }
  }
}

// 싱글톤 인스턴스 생성
const enhancedNewsApiService = new EnhancedNewsApiService();

export default enhancedNewsApiService;

// 유틸리티 함수들 export
export {
  CATEGORY_MAPPING,
  DIFFICULTY_KEYWORDS,
  ERROR_TYPES,
  classifyError
}; 