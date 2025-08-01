/**
 * ScriptLoader 유닛 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ScriptLoader, { ScriptLoadStates } from '../ScriptLoader';

// DOM 환경 설정
const mockScript = {
  type: '',
  src: '',
  async: false,
  onload: null,
  onerror: null,
  setAttribute: vi.fn(),
  remove: vi.fn()
};

Object.defineProperty(global, 'document', {
  value: {
    querySelector: vi.fn(),
    createElement: vi.fn().mockReturnValue(mockScript),
    head: {
      appendChild: vi.fn()
    }
  },
  writable: true
});

Object.defineProperty(global, 'window', {
  value: {
    adsbygoogle: undefined,
    kakaoAd: undefined
  },
  writable: true
});

describe('ScriptLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ScriptLoader.reset();
    
    // Mock script element 초기화
    mockScript.type = '';
    mockScript.src = '';
    mockScript.async = false;
    mockScript.onload = null;
    mockScript.onerror = null;
    
    // 타이머 mock
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    ScriptLoader.cleanup();
  });

  describe('loadKakaoAdFit', () => {
    it('should return true if script is already loaded', async () => {
      // Mock existing script
      const existingScript = { ...mockScript };
      global.document.querySelector.mockReturnValue(existingScript);
      
      // Mock script validation to return true
      ScriptLoader.prototype = {
        ...ScriptLoader.prototype,
        validateScriptLoad: vi.fn().mockReturnValue(true)
      };

      const result = await ScriptLoader.loadKakaoAdFit();
      expect(result).toBe(true);
    });

    it('should load new script if none exists', async () => {
      global.document.querySelector.mockReturnValue(null);
      
      const loadPromise = ScriptLoader.loadKakaoAdFit();
      
      // Simulate script load success
      setTimeout(() => {
        if (mockScript.onload) {
          mockScript.onload();
        }
      }, 100);
      
      vi.advanceTimersByTime(100);
      
      const result = await loadPromise;
      
      expect(global.document.createElement).toHaveBeenCalledWith('script');
      expect(mockScript.src).toBe('//t1.daumcdn.net/kas/static/ba.min.js');
      expect(mockScript.async).toBe(true);
      expect(global.document.head.appendChild).toHaveBeenCalledWith(mockScript);
    });

    it('should remove existing script when force reload', async () => {
      const existingScript = { ...mockScript, remove: vi.fn() };
      global.document.querySelector.mockReturnValue(existingScript);
      
      const loadPromise = ScriptLoader.loadKakaoAdFit(true);
      
      // Simulate script load success
      setTimeout(() => {
        if (mockScript.onload) {
          mockScript.onload();
        }
      }, 100);
      
      vi.advanceTimersByTime(100);
      
      await loadPromise;
      
      expect(existingScript.remove).toHaveBeenCalled();
    });

    it('should handle script load error', async () => {
      global.document.querySelector.mockReturnValue(null);
      
      const loadPromise = ScriptLoader.loadKakaoAdFit();
      
      // Simulate script load error
      setTimeout(() => {
        if (mockScript.onerror) {
          mockScript.onerror(new Error('Script load failed'));
        }
      }, 100);
      
      vi.advanceTimersByTime(100);
      
      await expect(loadPromise).rejects.toThrow('Script load failed');
    });

    it('should handle script load timeout', async () => {
      global.document.querySelector.mockReturnValue(null);
      
      const loadPromise = ScriptLoader.loadKakaoAdFit();
      
      // Advance timer to trigger timeout (10 seconds)
      vi.advanceTimersByTime(10000);
      
      await expect(loadPromise).rejects.toThrow('Script load timeout');
    });

    it('should not load duplicate scripts simultaneously', async () => {
      global.document.querySelector.mockReturnValue(null);
      
      // Start two simultaneous loads
      const loadPromise1 = ScriptLoader.loadKakaoAdFit();
      const loadPromise2 = ScriptLoader.loadKakaoAdFit();
      
      // Simulate script load success
      setTimeout(() => {
        if (mockScript.onload) {
          mockScript.onload();
        }
      }, 100);
      
      vi.advanceTimersByTime(100);
      
      const [result1, result2] = await Promise.all([loadPromise1, loadPromise2]);
      
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      // Should only create one script element
      expect(global.document.createElement).toHaveBeenCalledTimes(1);
    });
  });

  describe('validateScriptLoad', () => {
    it('should return true when script exists and is executed', () => {
      const mockExistingScript = { ...mockScript };
      global.document.querySelector.mockReturnValue(mockExistingScript);
      
      // Mock document ready state
      Object.defineProperty(global.document, 'readyState', {
        value: 'complete',
        writable: true
      });
      
      const scriptLoader = new ScriptLoader();
      const result = scriptLoader.validateScriptLoad();
      
      expect(result).toBe(true);
    });

    it('should return false when no script exists', () => {
      global.document.querySelector.mockReturnValue(null);
      
      const scriptLoader = new ScriptLoader();
      const result = scriptLoader.validateScriptLoad();
      
      expect(result).toBe(false);
    });

    it('should return false when document is not ready', () => {
      const mockExistingScript = { ...mockScript };
      global.document.querySelector.mockReturnValue(mockExistingScript);
      
      // Mock document not ready
      Object.defineProperty(global.document, 'readyState', {
        value: 'loading',
        writable: true
      });
      
      const scriptLoader = new ScriptLoader();
      const result = scriptLoader.validateScriptLoad();
      
      expect(result).toBe(false);
    });
  });

  describe('findExistingScript', () => {
    it('should find script by kas/static/ba.min.js URL', () => {
      const mockExistingScript = { ...mockScript };
      global.document.querySelector.mockImplementation((selector) => {
        if (selector.includes('kas/static/ba.min.js')) {
          return mockExistingScript;
        }
        return null;
      });
      
      const scriptLoader = new ScriptLoader();
      const result = scriptLoader.findExistingScript();
      
      expect(result).toBe(mockExistingScript);
    });

    it('should find script by t1.daumcdn.net/kas URL', () => {
      const mockExistingScript = { ...mockScript };
      global.document.querySelector.mockImplementation((selector) => {
        if (selector.includes('t1.daumcdn.net/kas')) {
          return mockExistingScript;
        }
        return null;
      });
      
      const scriptLoader = new ScriptLoader();
      const result = scriptLoader.findExistingScript();
      
      expect(result).toBe(mockExistingScript);
    });

    it('should find script by data-kakao-adfit attribute', () => {
      const mockExistingScript = { ...mockScript };
      global.document.querySelector.mockImplementation((selector) => {
        if (selector.includes('data-kakao-adfit')) {
          return mockExistingScript;
        }
        return null;
      });
      
      const scriptLoader = new ScriptLoader();
      const result = scriptLoader.findExistingScript();
      
      expect(result).toBe(mockExistingScript);
    });

    it('should return null if no script found', () => {
      global.document.querySelector.mockReturnValue(null);
      
      const scriptLoader = new ScriptLoader();
      const result = scriptLoader.findExistingScript();
      
      expect(result).toBeNull();
    });
  });

  describe('removeExistingScript', () => {
    it('should remove script from DOM', () => {
      const mockExistingScript = {
        ...mockScript,
        parentNode: {
          removeChild: vi.fn()
        }
      };
      
      const scriptLoader = new ScriptLoader();
      scriptLoader.removeExistingScript(mockExistingScript);
      
      expect(mockExistingScript.parentNode.removeChild).toHaveBeenCalledWith(mockExistingScript);
    });

    it('should handle script without parent node', () => {
      const mockExistingScript = {
        ...mockScript,
        parentNode: null
      };
      
      const scriptLoader = new ScriptLoader();
      
      // Should not throw error
      expect(() => {
        scriptLoader.removeExistingScript(mockExistingScript);
      }).not.toThrow();
    });

    it('should handle null script', () => {
      const scriptLoader = new ScriptLoader();
      
      // Should not throw error
      expect(() => {
        scriptLoader.removeExistingScript(null);
      }).not.toThrow();
    });
  });

  describe('State Management', () => {
    it('should return correct state information', () => {
      const state = ScriptLoader.getState();
      
      expect(state).toHaveProperty('scriptState');
      expect(state).toHaveProperty('isLoaded');
      expect(state).toHaveProperty('isLoading');
      expect(state).toHaveProperty('hasError');
      expect(state).toHaveProperty('lastError');
      expect(state).toHaveProperty('scriptExists');
    });

    it('should reset state correctly', () => {
      ScriptLoader.reset();
      
      const state = ScriptLoader.getState();
      
      expect(state.scriptState).toBe('not_loaded');
      expect(state.isLoaded).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.hasError).toBe(false);
      expect(state.lastError).toBeNull();
    });
  });

  describe('Debug Mode', () => {
    it('should enable debug mode', () => {
      ScriptLoader.setDebug(true);
      
      // Debug mode should be enabled (no direct way to test, but should not throw)
      expect(() => ScriptLoader.setDebug(true)).not.toThrow();
    });

    it('should disable debug mode', () => {
      ScriptLoader.setDebug(false);
      
      // Debug mode should be disabled (no direct way to test, but should not throw)
      expect(() => ScriptLoader.setDebug(false)).not.toThrow();
    });
  });

  describe('Static Methods', () => {
    it('should provide static access to instance methods', () => {
      expect(typeof ScriptLoader.loadKakaoAdFit).toBe('function');
      expect(typeof ScriptLoader.isScriptLoaded).toBe('function');
      expect(typeof ScriptLoader.isLoading).toBe('function');
      expect(typeof ScriptLoader.hasError).toBe('function');
      expect(typeof ScriptLoader.getLastError).toBe('function');
      expect(typeof ScriptLoader.reset).toBe('function');
      expect(typeof ScriptLoader.setDebug).toBe('function');
      expect(typeof ScriptLoader.getState).toBe('function');
      expect(typeof ScriptLoader.cleanup).toBe('function');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources', () => {
      ScriptLoader.cleanup();
      
      // Should not throw error
      expect(() => ScriptLoader.cleanup()).not.toThrow();
    });
  });
});