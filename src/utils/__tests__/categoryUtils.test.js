import { describe, it, expect } from 'vitest';
import { 
  getCategoryPageUrl, 
  isValidCategory, 
  findCategoryBySlug,
  getCategorySlug,
  formatCategoryName
} from '../categoryUtils';

describe('categoryUtils', () => {
  const mockCategories = [
    { id: 'technology', name: 'Technology', type: 'category', slug: 'technology' },
    { id: 'science', name: 'Science', type: 'category', slug: 'science' },
    { id: 'business', name: 'Business', type: 'category', slug: 'business' },
    { id: 'recent', name: 'Recent', type: 'recent' },
    { id: 'popular', name: 'Popular', type: 'popular' }
  ];

  describe('getCategoryPageUrl', () => {
    it('returns correct URL for valid category', () => {
      const category = { id: 'technology', name: 'Technology', type: 'category' };
      const url = getCategoryPageUrl(category);
      
      expect(url).toBe('/technology');
    });

    it('returns null for non-category types', () => {
      const recentCategory = { id: 'recent', name: 'Recent', type: 'recent' };
      const url = getCategoryPageUrl(recentCategory);
      
      expect(url).toBeNull();
    });

    it('handles category with custom slug', () => {
      const category = { 
        id: 'tech-news', 
        name: 'Technology News', 
        type: 'category',
        slug: 'tech-news'
      };
      const url = getCategoryPageUrl(category);
      
      expect(url).toBe('/tech-news');
    });

    it('returns null for invalid category object', () => {
      expect(getCategoryPageUrl(null)).toBeNull();
      expect(getCategoryPageUrl(undefined)).toBeNull();
      expect(getCategoryPageUrl({})).toBeNull();
    });

    it('handles category name with spaces', () => {
      const category = { 
        id: 'world-news', 
        name: 'World News', 
        type: 'category'
      };
      const url = getCategoryPageUrl(category);
      
      expect(url).toBe('/world-news');
    });
  });

  describe('isValidCategory', () => {
    it('returns true for valid category type', () => {
      const category = { id: 'technology', name: 'Technology', type: 'category' };
      
      expect(isValidCategory(category)).toBe(true);
    });

    it('returns false for non-category types', () => {
      const recentCategory = { id: 'recent', name: 'Recent', type: 'recent' };
      const popularCategory = { id: 'popular', name: 'Popular', type: 'popular' };
      
      expect(isValidCategory(recentCategory)).toBe(false);
      expect(isValidCategory(popularCategory)).toBe(false);
    });

    it('returns false for invalid category object', () => {
      expect(isValidCategory(null)).toBe(false);
      expect(isValidCategory(undefined)).toBe(false);
      expect(isValidCategory({})).toBe(false);
      expect(isValidCategory({ name: 'Test' })).toBe(false);
      expect(isValidCategory({ type: 'category' })).toBe(false);
    });

    it('returns false for category without required fields', () => {
      const incompleteCategory = { id: 'test', type: 'category' }; // missing name
      
      expect(isValidCategory(incompleteCategory)).toBe(false);
    });
  });

  describe('findCategoryBySlug', () => {
    it('finds category by exact slug match', () => {
      const category = findCategoryBySlug('technology', mockCategories);
      
      expect(category).toEqual(mockCategories[0]);
    });

    it('finds category by name-based slug', () => {
      const category = findCategoryBySlug('science', mockCategories);
      
      expect(category).toEqual(mockCategories[1]);
    });

    it('returns null for non-existent slug', () => {
      const category = findCategoryBySlug('nonexistent', mockCategories);
      
      expect(category).toBeNull();
    });

    it('returns null for empty categories array', () => {
      const category = findCategoryBySlug('technology', []);
      
      expect(category).toBeNull();
    });

    it('returns null for invalid parameters', () => {
      expect(findCategoryBySlug(null, mockCategories)).toBeNull();
      expect(findCategoryBySlug('technology', null)).toBeNull();
      expect(findCategoryBySlug('', mockCategories)).toBeNull();
    });

    it('handles case-insensitive matching', () => {
      const category = findCategoryBySlug('TECHNOLOGY', mockCategories);
      
      expect(category).toEqual(mockCategories[0]);
    });
  });

  describe('getCategorySlug', () => {
    it('returns existing slug if present', () => {
      const category = { 
        id: 'tech', 
        name: 'Technology', 
        slug: 'custom-tech-slug' 
      };
      
      expect(getCategorySlug(category)).toBe('custom-tech-slug');
    });

    it('generates slug from name when slug is missing', () => {
      const category = { id: 'tech', name: 'Technology News' };
      
      expect(getCategorySlug(category)).toBe('technology-news');
    });

    it('falls back to id when both name and slug are missing', () => {
      const category = { id: 'tech-category' };
      
      expect(getCategorySlug(category)).toBe('tech-category');
    });

    it('handles special characters in name', () => {
      const category = { 
        id: 'special', 
        name: 'Science & Technology!' 
      };
      
      expect(getCategorySlug(category)).toBe('science-technology');
    });

    it('handles empty or whitespace names', () => {
      const category1 = { id: 'test', name: '' };
      const category2 = { id: 'test', name: '   ' };
      
      expect(getCategorySlug(category1)).toBe('test');
      expect(getCategorySlug(category2)).toBe('test');
    });

    it('returns null for invalid category', () => {
      expect(getCategorySlug(null)).toBeNull();
      expect(getCategorySlug(undefined)).toBeNull();
      expect(getCategorySlug({})).toBeNull();
    });
  });

  describe('formatCategoryName', () => {
    it('formats category name for display', () => {
      expect(formatCategoryName('technology')).toBe('Technology');
      expect(formatCategoryName('world-news')).toBe('World News');
      expect(formatCategoryName('science_and_tech')).toBe('Science And Tech');
    });

    it('handles already formatted names', () => {
      expect(formatCategoryName('Technology')).toBe('Technology');
      expect(formatCategoryName('World News')).toBe('World News');
    });

    it('handles empty or invalid input', () => {
      expect(formatCategoryName('')).toBe('');
      expect(formatCategoryName(null)).toBe('');
      expect(formatCategoryName(undefined)).toBe('');
    });

    it('handles special characters', () => {
      expect(formatCategoryName('tech&science')).toBe('Tech&science');
      expect(formatCategoryName('news-24/7')).toBe('News 24/7');
    });

    it('handles multiple separators', () => {
      expect(formatCategoryName('world-news-today')).toBe('World News Today');
      expect(formatCategoryName('tech_and_science_news')).toBe('Tech And Science News');
    });
  });

  describe('edge cases and error handling', () => {
    it('handles malformed category objects gracefully', () => {
      const malformedCategories = [
        { id: null, name: 'Test', type: 'category' },
        { id: 'test', name: null, type: 'category' },
        { id: 'test', name: 'Test', type: null },
        'not-an-object',
        123,
        []
      ];

      malformedCategories.forEach(category => {
        expect(() => isValidCategory(category)).not.toThrow();
        expect(() => getCategoryPageUrl(category)).not.toThrow();
        expect(() => getCategorySlug(category)).not.toThrow();
      });
    });

    it('handles empty arrays and null values', () => {
      expect(findCategoryBySlug('test', [])).toBeNull();
      expect(findCategoryBySlug('test', null)).toBeNull();
      expect(findCategoryBySlug('test', undefined)).toBeNull();
    });

    it('handles unicode characters in category names', () => {
      const unicodeCategory = { 
        id: 'korean', 
        name: '한국 뉴스', 
        type: 'category' 
      };
      
      expect(isValidCategory(unicodeCategory)).toBe(true);
      expect(getCategorySlug(unicodeCategory)).toBe('한국-뉴스');
    });

    it('handles very long category names', () => {
      const longName = 'A'.repeat(1000);
      const category = { 
        id: 'long', 
        name: longName, 
        type: 'category' 
      };
      
      expect(isValidCategory(category)).toBe(true);
      expect(getCategorySlug(category)).toBe(longName.toLowerCase());
    });
  });
});