import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EnhancedNewsAPI } from '../enhancedNewsApi';

// Mock fetch globally
global.fetch = vi.fn();

// Mock environment variables
vi.stubEnv('VITE_NEWS_API_KEY', 'test-news-api-key');
vi.stubEnv('VITE_GUARDIAN_API_KEY', 'test-guardian-api-key');

describe('EnhancedNewsAPI', () => {
  let newsAPI;

  beforeEach(() => {
    newsAPI = new EnhancedNewsAPI();
    vi.clearAllMocks();
    
    // Mock console methods to reduce noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('initializes with default configuration', () => {
      expect(newsAPI).toBeInstanceOf(EnhancedNewsAPI);
      expect(newsAPI.cache).toBeInstanceOf(Map);
      expect(newsAPI.apiStatus).toEqual({
        newsapi: 'unknown',
        guardian: 'unknown'
      });
    });

    it('sets up rate limiting', () => {
      expect(newsAPI.rateLimiter).toBeDefined();
      expect(newsAPI.rateLimiter.newsapi).toBeDefined();
      expect(newsAPI.rateLimiter.guardian).toBeDefined();
    });
  });

  describe('fetchNews', () => {
    const mockNewsResponse = {
      articles: [
        {
          title: 'Test Article 1',
          description: 'Test description 1',
          url: 'https://example.com/article1',
          urlToImage: 'https://example.com/image1.jpg',
          publishedAt: '2024-01-15T10:00:00Z',
          source: { name: 'Test Source' }
        }
      ],
      totalResults: 1
    };

    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockNewsResponse)
      });
    });

    it('fetches news successfully', async () => {
      const result = await newsAPI.fetchNews();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('handles API errors gracefully', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      });

      const result = await newsAPI.fetchNews();
      
      expect(result).toEqual([]);
    });

    it('uses cache for repeated requests', async () => {
      // First request
      await newsAPI.fetchNews({ category: 'technology' });
      
      // Second request with same parameters
      await newsAPI.fetchNews({ category: 'technology' });
      
      // Should only make one actual fetch call due to caching
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('respects rate limiting', async () => {
      const promises = [];
      
      // Make multiple rapid requests
      for (let i = 0; i < 5; i++) {
        promises.push(newsAPI.fetchNews({ q: `query${i}` }));
      }
      
      await Promise.all(promises);
      
      // Should handle rate limiting without throwing errors
      expect(fetch).toHaveBeenCalled();
    });

    it('handles network errors', async () => {
      fetch.mockRejectedValue(new Error('Network error'));

      const result = await newsAPI.fetchNews();
      
      expect(result).toEqual([]);
    });
  });

  describe('fetchNewsByCategory', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          articles: [
            {
              title: 'Tech Article',
              description: 'Technology news',
              url: 'https://example.com/tech',
              publishedAt: '2024-01-15T10:00:00Z',
              source: { name: 'Tech Source' }
            }
          ]
        })
      });
    });

    it('fetches news by category', async () => {
      const result = await newsAPI.fetchNewsByCategory('technology');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('handles invalid categories', async () => {
      const result = await newsAPI.fetchNewsByCategory('invalid-category');
      
      expect(result).toEqual([]);
    });

    it('applies category-specific parameters', async () => {
      await newsAPI.fetchNewsByCategory('business', { pageSize: 20 });
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('category=business'),
        expect.any(Object)
      );
    });
  });

  describe('searchNews', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          articles: [
            {
              title: 'Search Result',
              description: 'Search description',
              url: 'https://example.com/search',
              publishedAt: '2024-01-15T10:00:00Z',
              source: { name: 'Search Source' }
            }
          ]
        })
      });
    });

    it('searches news with query', async () => {
      const result = await newsAPI.searchNews('artificial intelligence');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('handles empty search query', async () => {
      const result = await newsAPI.searchNews('');
      
      expect(result).toEqual([]);
    });

    it('applies search parameters correctly', async () => {
      await newsAPI.searchNews('AI', { 
        sortBy: 'publishedAt',
        pageSize: 10 
      });
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('q=AI'),
        expect.any(Object)
      );
    });
  });

  describe('caching mechanism', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ articles: [] })
      });
    });

    it('caches successful responses', async () => {
      const cacheKey = 'test-cache-key';
      
      await newsAPI.fetchNews({ category: 'technology' });
      
      expect(newsAPI.cache.size).toBeGreaterThan(0);
    });

    it('respects cache TTL', async () => {
      // Mock Date.now to control time
      const originalNow = Date.now;
      let currentTime = 1000000;
      Date.now = vi.fn(() => currentTime);

      await newsAPI.fetchNews({ category: 'technology' });
      
      // Advance time beyond cache TTL
      currentTime += newsAPI.cacheTTL + 1000;
      
      await newsAPI.fetchNews({ category: 'technology' });
      
      // Should make two fetch calls due to cache expiration
      expect(fetch).toHaveBeenCalledTimes(2);
      
      Date.now = originalNow;
    });

    it('clears expired cache entries', () => {
      // Add expired cache entry
      const expiredEntry = {
        data: [],
        timestamp: Date.now() - newsAPI.cacheTTL - 1000
      };
      newsAPI.cache.set('expired-key', expiredEntry);
      
      newsAPI.clearExpiredCache();
      
      expect(newsAPI.cache.has('expired-key')).toBe(false);
    });
  });

  describe('API status monitoring', () => {
    it('checks API status', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ articles: [] })
      });

      const status = await newsAPI.checkApiStatus('newsapi');
      
      expect(status).toBe('healthy');
      expect(newsAPI.apiStatus.newsapi).toBe('healthy');
    });

    it('handles API failures in status check', async () => {
      fetch.mockRejectedValue(new Error('API Error'));

      const status = await newsAPI.checkApiStatus('newsapi');
      
      expect(status).toBe('error');
      expect(newsAPI.apiStatus.newsapi).toBe('error');
    });

    it('returns disabled status for missing API keys', async () => {
      vi.stubEnv('VITE_NEWS_API_KEY', '');
      
      const status = await newsAPI.checkApiStatus('newsapi');
      
      expect(status).toBe('disabled');
    });
  });

  describe('error handling and resilience', () => {
    it('handles malformed JSON responses', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      const result = await newsAPI.fetchNews();
      
      expect(result).toEqual([]);
    });

    it('handles timeout errors', async () => {
      fetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      const result = await newsAPI.fetchNews();
      
      expect(result).toEqual([]);
    });

    it('handles partial API failures gracefully', async () => {
      // Mock one API to fail, another to succeed
      fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ articles: [] })
        });

      const result = await newsAPI.fetchNews();
      
      // Should still return results from working APIs
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('data transformation', () => {
    it('normalizes article data structure', async () => {
      const mockResponse = {
        articles: [
          {
            title: 'Test Article',
            description: 'Test description',
            url: 'https://example.com/test',
            urlToImage: 'https://example.com/image.jpg',
            publishedAt: '2024-01-15T10:00:00Z',
            source: { name: 'Test Source' }
          }
        ]
      };

      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await newsAPI.fetchNews();
      
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('summary');
      expect(result[0]).toHaveProperty('url');
      expect(result[0]).toHaveProperty('image');
      expect(result[0]).toHaveProperty('publishedAt');
      expect(result[0]).toHaveProperty('source');
    });

    it('handles missing or null fields gracefully', async () => {
      const mockResponse = {
        articles: [
          {
            title: 'Test Article',
            description: null,
            url: 'https://example.com/test',
            urlToImage: null,
            publishedAt: '2024-01-15T10:00:00Z',
            source: { name: 'Test Source' }
          }
        ]
      };

      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await newsAPI.fetchNews();
      
      expect(result[0].summary).toBeDefined();
      expect(result[0].image).toBeDefined();
    });
  });

  describe('performance and optimization', () => {
    it('handles concurrent requests efficiently', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ articles: [] })
      });

      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(newsAPI.fetchNews({ q: `query${i}` }));
      }

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
    });

    it('provides debug information', () => {
      const debugInfo = newsAPI.getDebugInfo();
      
      expect(debugInfo).toHaveProperty('cacheSize');
      expect(debugInfo).toHaveProperty('apiStatus');
      expect(debugInfo).toHaveProperty('rateLimiter');
      expect(typeof debugInfo.cacheSize).toBe('number');
    });
  });
});