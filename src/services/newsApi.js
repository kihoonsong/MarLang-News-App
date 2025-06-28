// 뉴스 API 서비스
// 무료 뉴스 API들을 활용한 실제 기사 데이터 제공

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

// 난이도별 키워드 (더 복잡한 기사일수록 고급)
const DIFFICULTY_KEYWORDS = {
  'Beginner': ['basic', 'simple', 'introduction', 'guide', 'how to'],
  'Intermediate': ['analysis', 'development', 'research', 'study'],
  'Advanced': ['sophisticated', 'complex', 'comprehensive', 'theoretical', 'methodology']
};

class NewsApiService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30분 캐시
  }

  // 캐시된 데이터 확인
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
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
  }

  // NewsAPI에서 기사 가져오기
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

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status}`);
    }

    const data = await response.json();
    return this.transformNewsAPIData(data.articles, category);
  }

  // Guardian API에서 기사 가져오기
  async fetchFromGuardian(category = 'technology', pageSize = 20) {
    if (!API_KEYS.guardian) {
      throw new Error('Guardian API key not configured');
    }

    const url = new URL(NEWS_API_ENDPOINTS.guardian);
    url.searchParams.append('section', category.toLowerCase());
    url.searchParams.append('page-size', pageSize.toString());
    url.searchParams.append('show-fields', 'thumbnail,bodyText,standfirst');
    url.searchParams.append('api-key', API_KEYS.guardian);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Guardian API error: ${response.status}`);
    }

    const data = await response.json();
    return this.transformGuardianData(data.response.results, category);
  }

  // 폴백용 샘플 데이터
  getFallbackData(category = 'Technology') {
    const fallbackArticles = [
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
        source: 'MarLang News',
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
        source: 'MarLang News',
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
        source: 'MarLang News',
        tags: ['Economy', 'Business', 'Digital', 'Technology']
      }
    ];

    return fallbackArticles.filter(article => 
      !category || article.category === category
    );
  }

  // NewsAPI 데이터 변환
  transformNewsAPIData(articles, category) {
    return articles
      .filter(article => article.title && article.description && article.urlToImage)
      .map((article, index) => ({
        id: `newsapi-${Date.now()}-${index}`,
        title: this.cleanTitle(article.title),
        category: category,
        publishedAt: article.publishedAt,
        summary: article.description,
        content: this.generateContent(article.description, article.content),
        image: article.urlToImage,
        level: this.determineDifficulty(article.title + ' ' + article.description),
        readingTime: this.calculateReadingTime(article.content || article.description),
        wordCount: this.countWords(article.content || article.description),
        source: article.source?.name || 'News Source',
        url: article.url,
        tags: this.extractTags(article.title + ' ' + article.description, category)
      }));
  }

  // Guardian 데이터 변환
  transformGuardianData(articles, category) {
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
  }

  // 제목 정리 (뉴스 소스 제거 등)
  cleanTitle(title) {
    return title
      .replace(/ - [^-]*$/, '') // 마지막 대시 이후 제거 (보통 소스명)
      .replace(/^\[.*?\]\s*/, '') // 앞쪽 대괄호 제거
      .trim();
  }

  // 난이도 결정
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

    // 텍스트 복잡도 분석
    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;

    if (avgWordsPerSentence > 20) scores['Advanced'] += 2;
    else if (avgWordsPerSentence > 15) scores['Intermediate'] += 2;
    else scores['Beginner'] += 2;

    // 가장 높은 점수의 난이도 반환
    return Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b)[0];
  }

  // 읽기 시간 계산 (분 단위)
  calculateReadingTime(text) {
    if (!text) return 1;
    const wordsPerMinute = 200;
    const wordCount = this.countWords(text);
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }

  // 단어 수 계산
  countWords(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).length;
  }

  // 태그 추출
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

  // 컨텐츠 생성 (3단계 난이도별)
  generateContent(summary, fullContent) {
    const baseContent = fullContent || summary || '';
    const sentences = baseContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    return {
      1: {
        title: 'Level 1 - Beginner',
        content: this.simplifyContent(sentences.slice(0, 3).join('. ') + '.')
      },
      2: {
        title: 'Level 2 - Intermediate',
        content: sentences.slice(0, 5).join('. ') + '.'
      },
      3: {
        title: 'Level 3 - Advanced',
        content: sentences.slice(0, 8).join('. ') + '.'
      }
    };
  }

  // 텍스트 단순화
  simplifyContent(text) {
    return text
      .replace(/\b(sophisticated|comprehensive|methodology|theoretical)\b/gi, 'advanced')
      .replace(/\b(utilize|implement|facilitate)\b/gi, 'use')
      .replace(/\b(consequently|furthermore|nevertheless)\b/gi, 'so')
      .replace(/\b(approximately|essentially|particularly)\b/gi, 'about');
  }

  // 메인 API 호출 함수
  async fetchArticles(category = 'Technology', limit = 20) {
    const cacheKey = `articles-${category}-${limit}`;
    
    // 캐시 확인
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      let articles = [];

      // 1차 시도: NewsAPI
      if (API_KEYS.newsapi) {
        try {
          articles = await this.fetchFromNewsAPI(category, Math.ceil(limit / 2));
        } catch (error) {
          console.warn('NewsAPI failed:', error.message);
        }
      }

      // 2차 시도: Guardian API (추가)
      if (API_KEYS.guardian && articles.length < limit) {
        try {
          const guardianArticles = await this.fetchFromGuardian(category, limit - articles.length);
          articles = [...articles, ...guardianArticles];
        } catch (error) {
          console.warn('Guardian API failed:', error.message);
        }
      }

      // 3차 시도: 폴백 데이터
      if (articles.length === 0) {
        console.info('Using fallback data');
        articles = this.getFallbackData(category);
      }

      // 중복 제거 및 제한
      const uniqueArticles = this.removeDuplicates(articles).slice(0, limit);
      
      // 캐시 저장
      this.setCachedData(cacheKey, uniqueArticles);
      
      return uniqueArticles;

    } catch (error) {
      console.error('All news APIs failed:', error);
      return this.getFallbackData(category);
    }
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

  // 검색 기능
  async searchArticles(query, filters = {}) {
    const { category, level, sortBy = 'relevance', limit = 20 } = filters;
    
    try {
      // 모든 카테고리에서 검색하거나 특정 카테고리에서 검색
      const categories = category ? [category] : Object.keys(CATEGORY_MAPPING);
      
      let allArticles = [];
      for (const cat of categories) {
        const articles = await this.fetchArticles(cat, Math.ceil(limit / categories.length));
        allArticles = [...allArticles, ...articles];
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

      return results.slice(0, limit);

    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  // 기사 정렬
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

  // 관련성 점수 계산
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

  // 특정 기사 상세 정보 가져오기
  async getArticleById(id) {
    // 캐시에서 찾기
    for (const [key, cached] of this.cache.entries()) {
      if (key.startsWith('articles-')) {
        const article = cached.data.find(a => a.id === id);
        if (article) return article;
      }
    }

    // 캐시에 없으면 폴백 데이터에서 찾기
    const fallbackData = this.getFallbackData();
    return fallbackData.find(article => article.id === id) || null;
  }

  // 트렌딩 기사 가져오기
  async getTrendingArticles(limit = 10) {
    const cacheKey = `trending-${limit}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const articles = await this.fetchArticles('Technology', limit * 2);
      const trending = articles
        .sort((a, b) => b.wordCount - a.wordCount) // 긴 기사일수록 트렌딩으로 간주
        .slice(0, limit);

      this.setCachedData(cacheKey, trending);
      return trending;

    } catch (error) {
      console.error('Failed to fetch trending articles:', error);
      return this.getFallbackData().slice(0, limit);
    }
  }
}

// 싱글톤 인스턴스 생성
const newsApiService = new NewsApiService();

export default newsApiService;

// 유틸리티 함수들 export
export {
  CATEGORY_MAPPING,
  DIFFICULTY_KEYWORDS
};