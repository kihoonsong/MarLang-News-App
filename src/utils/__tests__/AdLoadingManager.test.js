/**
 * AdLoadingManager 유닛 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import AdLoadingManager, { AdLoadingStates } from '../AdLoadingManager';

// Mock dependencies
vi.mock('../ScriptLoader.js', () => ({
  default: {
    loadKakaoAdFit: vi.fn(),
    setDebug: vi.fn(),
    cleanup: vi.fn(),
    reset: vi.fn()
  }
}));

vi.mock('../AdErrorHandler.js', () => ({
  default: vi.fn().mockImplementation(() => ({
    handleError: vi.fn().mockReturnValue({
      errorType: 'SCRIPT_LOAD_ERROR',
      severity: 'medium',
      strategy: 'DELAYED_RETRY',
      recoveryPlan: {
        strategy: 'DELAYED_RETRY',
        delay: 1000,
        actions: ['wait', 'retry_load'],
        description: '1000ms 후 재시도'
      },
      shouldRetry: true,
      retryDelay: 1000,
      fallbackRequired: false
    }),
    updateRecoveryStats: vi.fn(),
    getErrorStats: vi.fn().mockReturnValue({})
  }))
}));

vi.mock('../AdLogger.js', () => ({
  default: {
    logLoadStart: vi.fn(),
    logLoadSuccess: vi.fn(),
    logLoadError: vi.fn(),
    logLoadRetry: vi.fn(),
    logLoadTimeout: vi.fn(),
    logFallback: vi.fn(),
    logScriptLoad: vi.fn(),
    logAdRender: vi.fn(),
    logAdValidation: vi.fn(),
    updateConfig: vi.fn()
  }
}));

// DOM 환경 설정
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    display: 'block',
    visibility: 'visible',
    backgroundImage: 'none'
  })
});

describe('AdLoadingManager', () => {
  let adManager;
  let mockContainer;

  beforeEach(() => {
    // Mock container 생성
    mockContainer = {
      querySelector: vi.fn(),
      appendChild: vi.fn(),
      getBoundingClientRect: () => ({ width: 320, height: 100 }),
      style: {}
    };

    // document.contains mock
    global.document = {
      ...global.document,
      contains: vi.fn().mockReturnValue(true),
      readyState: 'complete',
      createElement: vi.fn().mockReturnValue({
        className: '',
        style: {},
        setAttribute: vi.fn(),
        getBoundingClientRect: () => ({ width: 320, height: 100 }),
        children: [],
        textContent: '',
        querySelector: vi.fn(),
        hasAttribute: vi.fn().mockReturnValue(true)
      }),
      head: {
        appendChild: vi.fn()
      }
    };

    // AdLoadingManager 인스턴스 생성
    adManager = new AdLoadingManager({
      adUnitId: 'test-ad-unit',
      maxRetries: 2,
      loadTimeout: 5000,
      debug: true
    });

    // 타이머 mock
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    if (adManager) {
      adManager.cleanup();
    }
  });

  describe('Constructor', () => {
    it('should initialize with default options', () => {
      const manager = new AdLoadingManager();
      
      expect(manager.adUnitId).toBe('DAN-RNzVkjnBfLSGDxqM');
      expect(manager.maxRetries).toBe(3);
      expect(manager.loadTimeout).toBe(10000);
      expect(manager.currentState).toBe(AdLoadingStates.IDLE);
    });

    it('should initialize with custom options', () => {
      const options = {
        adUnitId: 'custom-ad-unit',
        maxRetries: 5,
        loadTimeout: 15000,
        width: 728,
        height: 90
      };
      
      const manager = new AdLoadingManager(options);
      
      expect(manager.adUnitId).toBe('custom-ad-unit');
      expect(manager.maxRetries).toBe(5);
      expect(manager.loadTimeout).toBe(15000);
      expect(manager.width).toBe(728);
      expect(manager.height).toBe(90);
    });
  });

  describe('loadAd', () => {
    it('should throw error if container is not provided', async () => {
      await expect(adManager.loadAd(null)).rejects.toThrow('Ad container is required');
    });

    it('should set loading state when starting', async () => {
      const onStateChange = vi.fn();
      adManager.onStateChange = onStateChange;

      // Mock successful script loading
      const ScriptLoader = await import('../ScriptLoader.js');
      ScriptLoader.default.loadKakaoAdFit.mockResolvedValue(true);

      // Mock successful ad rendering
      adManager.isAdRendered = vi.fn().mockReturnValue(true);

      await adManager.loadAd(mockContainer);

      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          newState: AdLoadingStates.LOADING
        })
      );
    });

    it('should handle successful ad loading', async () => {
      const onSuccess = vi.fn();
      const onStateChange = vi.fn();
      adManager.onSuccess = onSuccess;
      adManager.onStateChange = onStateChange;

      // Mock successful script loading
      const ScriptLoader = await import('../ScriptLoader.js');
      ScriptLoader.default.loadKakaoAdFit.mockResolvedValue(true);

      // Mock successful ad rendering
      adManager.isAdRendered = vi.fn().mockReturnValue(true);

      const result = await adManager.loadAd(mockContainer);

      expect(result).toBe(true);
      expect(onSuccess).toHaveBeenCalled();
      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          newState: AdLoadingStates.SUCCESS
        })
      );
    });
  });

  describe('validateContainer', () => {
    it('should return false for null container', () => {
      const result = adManager.validateContainer(null);
      expect(result).toBe(false);
    });

    it('should return false for non-HTMLElement', () => {
      const result = adManager.validateContainer({});
      expect(result).toBe(false);
    });

    it('should return false if container is not in DOM', () => {
      global.document.contains.mockReturnValue(false);
      const result = adManager.validateContainer(mockContainer);
      expect(result).toBe(false);
    });

    it('should return false if container has zero size', () => {
      mockContainer.getBoundingClientRect = () => ({ width: 0, height: 0 });
      const result = adManager.validateContainer(mockContainer);
      expect(result).toBe(false);
    });

    it('should return true for valid container', () => {
      const result = adManager.validateContainer(mockContainer);
      expect(result).toBe(true);
    });
  });

  describe('createAdElement', () => {
    it('should create ad element with correct attributes', () => {
      const mockAdElement = {
        className: '',
        style: {},
        setAttribute: vi.fn(),
        getBoundingClientRect: () => ({ width: 320, height: 100 })
      };

      global.document.createElement.mockReturnValue(mockAdElement);
      mockContainer.querySelector.mockReturnValue(null);

      const result = adManager.createAdElement(mockContainer);

      expect(global.document.createElement).toHaveBeenCalledWith('ins');
      expect(mockAdElement.className).toBe('kakao_ad_area');
      expect(mockAdElement.setAttribute).toHaveBeenCalledWith('data-ad-unit', 'test-ad-unit');
      expect(mockAdElement.setAttribute).toHaveBeenCalledWith('data-ad-width', '320');
      expect(mockAdElement.setAttribute).toHaveBeenCalledWith('data-ad-height', '100');
      expect(mockContainer.appendChild).toHaveBeenCalledWith(mockAdElement);
    });

    it('should remove existing ad element before creating new one', () => {
      const existingAd = { remove: vi.fn() };
      mockContainer.querySelector.mockReturnValue(existingAd);

      adManager.createAdElement(mockContainer);

      expect(existingAd.remove).toHaveBeenCalled();
    });
  });

  describe('isAdRendered', () => {
    let mockAdElement;

    beforeEach(() => {
      mockAdElement = {
        getBoundingClientRect: () => ({ width: 320, height: 100 }),
        children: [{}],
        textContent: 'Ad content',
        className: 'kakao_ad_area',
        hasAttribute: vi.fn().mockReturnValue(true),
        querySelector: vi.fn().mockReturnValue(null)
      };
    });

    it('should return false if element is null', () => {
      const result = adManager.isAdRendered(null);
      expect(result).toBe(false);
    });

    it('should return false if element is not in DOM', () => {
      global.document.contains.mockReturnValue(false);
      const result = adManager.isAdRendered(mockAdElement);
      expect(result).toBe(false);
    });

    it('should return false if element has zero size', () => {
      mockAdElement.getBoundingClientRect = () => ({ width: 0, height: 0 });
      const result = adManager.isAdRendered(mockAdElement);
      expect(result).toBe(false);
    });

    it('should return true for valid rendered ad', () => {
      const result = adManager.isAdRendered(mockAdElement);
      expect(result).toBe(true);
    });
  });

  describe('validateAdContent', () => {
    let mockAdElement;

    beforeEach(() => {
      mockAdElement = {
        children: [{}],
        textContent: 'Ad content',
        className: 'kakao_ad_area',
        hasAttribute: vi.fn().mockReturnValue(true),
        querySelector: vi.fn()
      };
    });

    it('should return true if element has children', () => {
      const result = adManager.validateAdContent(mockAdElement);
      expect(result).toBe(true);
    });

    it('should return true if element has iframe', () => {
      mockAdElement.children = [];
      mockAdElement.textContent = '';
      mockAdElement.querySelector.mockImplementation((selector) => {
        if (selector === 'iframe') return {};
        return null;
      });

      const result = adManager.validateAdContent(mockAdElement);
      expect(result).toBe(true);
    });

    it('should return true if element has ad-related attributes', () => {
      mockAdElement.children = [];
      mockAdElement.textContent = '';
      mockAdElement.querySelector.mockReturnValue(null);
      mockAdElement.hasAttribute.mockReturnValue(true);

      const result = adManager.validateAdContent(mockAdElement);
      expect(result).toBe(true);
    });

    it('should return false if element has no content', () => {
      mockAdElement.children = [];
      mockAdElement.textContent = '';
      mockAdElement.className = '';
      mockAdElement.hasAttribute.mockReturnValue(false);
      mockAdElement.querySelector.mockReturnValue(null);

      const result = adManager.validateAdContent(mockAdElement);
      expect(result).toBe(false);
    });
  });

  describe('handleLoadError', () => {
    it('should call error handler and execute recovery plan', async () => {
      const error = new Error('Test error');
      const onError = vi.fn();
      adManager.onError = onError;

      // Mock error handler response
      const mockErrorResponse = {
        errorType: 'SCRIPT_LOAD_ERROR',
        severity: 'medium',
        strategy: 'DELAYED_RETRY',
        recoveryPlan: {
          strategy: 'DELAYED_RETRY',
          delay: 1000,
          actions: ['wait', 'retry_load'],
          description: '1000ms 후 재시도'
        },
        shouldRetry: true,
        retryDelay: 1000,
        fallbackRequired: false
      };

      adManager.errorHandler.handleError.mockReturnValue(mockErrorResponse);
      adManager.executeRecoveryPlan = vi.fn().mockResolvedValue(false);

      const result = await adManager.handleLoadError(error, mockContainer);

      expect(adManager.errorHandler.handleError).toHaveBeenCalledWith(
        error,
        0,
        expect.objectContaining({
          adUnitId: 'test-ad-unit',
          containerExists: true
        })
      );
      expect(adManager.executeRecoveryPlan).toHaveBeenCalledWith(
        mockErrorResponse.recoveryPlan,
        mockContainer
      );
    });

    it('should set fallback state when max retries exceeded', async () => {
      const error = new Error('Test error');
      const onStateChange = vi.fn();
      adManager.onStateChange = onStateChange;
      adManager.retryCount = 3; // Exceed max retries

      const mockErrorResponse = {
        shouldRetry: false,
        errorType: 'SCRIPT_LOAD_ERROR'
      };

      adManager.errorHandler.handleError.mockReturnValue(mockErrorResponse);

      const result = await adManager.handleLoadError(error, mockContainer);

      expect(result).toBe(false);
      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          newState: AdLoadingStates.FALLBACK
        })
      );
    });
  });

  describe('executeRecoveryActions', () => {
    it('should execute clear_script action', async () => {
      const ScriptLoader = await import('../ScriptLoader.js');
      
      await adManager.executeRecoveryActions(['clear_script'], mockContainer);
      
      expect(ScriptLoader.default.reset).toHaveBeenCalled();
    });

    it('should execute reload_script action', async () => {
      const ScriptLoader = await import('../ScriptLoader.js');
      
      await adManager.executeRecoveryActions(['reload_script'], mockContainer);
      
      expect(ScriptLoader.default.loadKakaoAdFit).toHaveBeenCalledWith(true);
    });

    it('should execute clear_dom action', async () => {
      const mockExistingAd = { remove: vi.fn() };
      mockContainer.querySelectorAll = vi.fn().mockReturnValue([mockExistingAd]);
      
      await adManager.executeRecoveryActions(['clear_dom'], mockContainer);
      
      expect(mockContainer.querySelectorAll).toHaveBeenCalledWith('.kakao_ad_area');
      expect(mockExistingAd.remove).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should clear all timers and cleanup dependencies', () => {
      adManager.loadTimeoutTimer = setTimeout(() => {}, 1000);
      adManager.retryTimer = setTimeout(() => {}, 1000);

      adManager.cleanup();

      expect(adManager.loadTimeoutTimer).toBeNull();
      expect(adManager.retryTimer).toBeNull();
    });
  });

  describe('getState', () => {
    it('should return current state information', () => {
      adManager.currentState = AdLoadingStates.LOADING;
      adManager.retryCount = 1;
      adManager.lastError = new Error('Test error');
      adManager.loadStartTime = Date.now();

      const state = adManager.getState();

      expect(state).toEqual({
        currentState: AdLoadingStates.LOADING,
        retryCount: 1,
        lastError: expect.any(Error),
        loadStartTime: expect.any(Number),
        loadEndTime: null,
        errorStats: {}
      });
    });
  });
});