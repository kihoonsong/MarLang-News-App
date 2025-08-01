/**
 * AdErrorHandler 유닛 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import AdErrorHandler, { AdErrorTypes, RecoveryStrategies, ErrorSeverity } from '../AdErrorHandler';

// Mock AdLogger
vi.mock('../AdLogger', () => ({
  default: {
    log: vi.fn()
  }
}));

describe('AdErrorHandler', () => {
  let errorHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    errorHandler = new AdErrorHandler({
      maxRetries: 3,
      baseRetryDelay: 1000,
      debug: true
    });
  });

  describe('Constructor', () => {
    it('should initialize with default options', () => {
      const handler = new AdErrorHandler();
      
      expect(handler.maxRetries).toBe(3);
      expect(handler.baseRetryDelay).toBe(1000);
      expect(handler.debug).toBe(false);
    });

    it('should initialize with custom options', () => {
      const options = {
        maxRetries: 5,
        baseRetryDelay: 2000,
        debug: true
      };
      
      const handler = new AdErrorHandler(options);
      
      expect(handler.maxRetries).toBe(5);
      expect(handler.baseRetryDelay).toBe(2000);
      expect(handler.debug).toBe(true);
    });
  });

  describe('categorizeError', () => {
    it('should categorize script load errors', () => {
      const error = new Error('Script load failed');
      const category = errorHandler.categorizeError(error);
      expect(category).toBe(AdErrorTypes.SCRIPT_LOAD_ERROR);
    });

    it('should categorize network errors', () => {
      const error = new Error('Network connection failed');
      const category = errorHandler.categorizeError(error);
      expect(category).toBe(AdErrorTypes.NETWORK_ERROR);
    });

    it('should categorize timeout errors', () => {
      const error = new Error('Request timeout');
      const category = errorHandler.categorizeError(error);
      expect(category).toBe(AdErrorTypes.TIMEOUT_ERROR);
    });

    it('should categorize DOM errors', () => {
      const error = new Error('DOM element not found');
      const category = errorHandler.categorizeError(error);
      expect(category).toBe(AdErrorTypes.DOM_ERROR);
    });

    it('should categorize render errors', () => {
      const error = new Error('Render failed');
      const category = errorHandler.categorizeError(error);
      expect(category).toBe(AdErrorTypes.AD_RENDER_ERROR);
    });

    it('should categorize validation errors', () => {
      const error = new Error('Validation failed');
      const category = errorHandler.categorizeError(error);
      expect(category).toBe(AdErrorTypes.VALIDATION_ERROR);
    });

    it('should categorize unknown errors', () => {
      const error = new Error('Some unknown error');
      const category = errorHandler.categorizeError(error);
      expect(category).toBe(AdErrorTypes.UNKNOWN_ERROR);
    });

    it('should handle errors without message', () => {
      const error = new Error();
      const category = errorHandler.categorizeError(error);
      expect(category).toBe(AdErrorTypes.UNKNOWN_ERROR);
    });

    it('should handle null/undefined errors', () => {
      const category1 = errorHandler.categorizeError(null);
      const category2 = errorHandler.categorizeError(undefined);
      expect(category1).toBe(AdErrorTypes.UNKNOWN_ERROR);
      expect(category2).toBe(AdErrorTypes.UNKNOWN_ERROR);
    });
  });

  describe('assessErrorSeverity', () => {
    it('should return CRITICAL for max retries exceeded', () => {
      const error = new Error('Test error');
      const severity = errorHandler.assessErrorSeverity(error, AdErrorTypes.SCRIPT_LOAD_ERROR, 3);
      expect(severity).toBe(ErrorSeverity.CRITICAL);
    });

    it('should assess script load error severity correctly', () => {
      const error = new Error('Script load failed');
      
      const severity0 = errorHandler.assessErrorSeverity(error, AdErrorTypes.SCRIPT_LOAD_ERROR, 0);
      expect(severity0).toBe(ErrorSeverity.MEDIUM);
      
      const severity2 = errorHandler.assessErrorSeverity(error, AdErrorTypes.SCRIPT_LOAD_ERROR, 2);
      expect(severity2).toBe(ErrorSeverity.HIGH);
    });

    it('should assess network error severity correctly', () => {
      const error = new Error('Network failed');
      
      const severity0 = errorHandler.assessErrorSeverity(error, AdErrorTypes.NETWORK_ERROR, 0);
      expect(severity0).toBe(ErrorSeverity.LOW);
      
      const severity1 = errorHandler.assessErrorSeverity(error, AdErrorTypes.NETWORK_ERROR, 1);
      expect(severity1).toBe(ErrorSeverity.MEDIUM);
    });

    it('should assess DOM error as HIGH severity', () => {
      const error = new Error('DOM error');
      const severity = errorHandler.assessErrorSeverity(error, AdErrorTypes.DOM_ERROR, 0);
      expect(severity).toBe(ErrorSeverity.HIGH);
    });
  });

  describe('determineRecoveryStrategy', () => {
    it('should return FALLBACK_DISPLAY when max retries exceeded', () => {
      const strategy = errorHandler.determineRecoveryStrategy(AdErrorTypes.SCRIPT_LOAD_ERROR, 3, {});
      expect(strategy).toBe(RecoveryStrategies.FALLBACK_DISPLAY);
    });

    it('should determine script load error recovery strategy', () => {
      const strategy0 = errorHandler.determineRecoveryStrategy(AdErrorTypes.SCRIPT_LOAD_ERROR, 0, {});
      expect(strategy0).toBe(RecoveryStrategies.SCRIPT_RELOAD);
      
      const strategy1 = errorHandler.determineRecoveryStrategy(AdErrorTypes.SCRIPT_LOAD_ERROR, 1, {});
      expect(strategy1).toBe(RecoveryStrategies.DELAYED_RETRY);
      
      const strategy2 = errorHandler.determineRecoveryStrategy(AdErrorTypes.SCRIPT_LOAD_ERROR, 2, {});
      expect(strategy2).toBe(RecoveryStrategies.FALLBACK_DISPLAY);
    });

    it('should determine network error recovery strategy', () => {
      const strategy0 = errorHandler.determineRecoveryStrategy(AdErrorTypes.NETWORK_ERROR, 0, {});
      expect(strategy0).toBe(RecoveryStrategies.DELAYED_RETRY);
      
      const strategy2 = errorHandler.determineRecoveryStrategy(AdErrorTypes.NETWORK_ERROR, 2, {});
      expect(strategy2).toBe(RecoveryStrategies.FALLBACK_DISPLAY);
    });

    it('should determine DOM error recovery strategy', () => {
      const strategy0 = errorHandler.determineRecoveryStrategy(AdErrorTypes.DOM_ERROR, 0, {});
      expect(strategy0).toBe(RecoveryStrategies.DOM_RESET);
      
      const strategy1 = errorHandler.determineRecoveryStrategy(AdErrorTypes.DOM_ERROR, 1, {});
      expect(strategy1).toBe(RecoveryStrategies.FALLBACK_DISPLAY);
    });

    it('should determine render error recovery strategy', () => {
      const strategy0 = errorHandler.determineRecoveryStrategy(AdErrorTypes.AD_RENDER_ERROR, 0, {});
      expect(strategy0).toBe(RecoveryStrategies.IMMEDIATE_RETRY);
      
      const strategy2 = errorHandler.determineRecoveryStrategy(AdErrorTypes.AD_RENDER_ERROR, 2, {});
      expect(strategy2).toBe(RecoveryStrategies.FALLBACK_DISPLAY);
    });
  });

  describe('createRecoveryPlan', () => {
    it('should create immediate retry plan', () => {
      const plan = errorHandler.createRecoveryPlan(
        RecoveryStrategies.IMMEDIATE_RETRY,
        AdErrorTypes.AD_RENDER_ERROR,
        0,
        {}
      );
      
      expect(plan.strategy).toBe(RecoveryStrategies.IMMEDIATE_RETRY);
      expect(plan.delay).toBe(0);
      expect(plan.actions).toContain('retry_load');
      expect(plan.description).toBe('즉시 재시도');
    });

    it('should create delayed retry plan', () => {
      const plan = errorHandler.createRecoveryPlan(
        RecoveryStrategies.DELAYED_RETRY,
        AdErrorTypes.NETWORK_ERROR,
        1,
        {}
      );
      
      expect(plan.strategy).toBe(RecoveryStrategies.DELAYED_RETRY);
      expect(plan.delay).toBeGreaterThan(0);
      expect(plan.actions).toContain('wait');
      expect(plan.actions).toContain('retry_load');
    });

    it('should create script reload plan', () => {
      const plan = errorHandler.createRecoveryPlan(
        RecoveryStrategies.SCRIPT_RELOAD,
        AdErrorTypes.SCRIPT_LOAD_ERROR,
        0,
        {}
      );
      
      expect(plan.strategy).toBe(RecoveryStrategies.SCRIPT_RELOAD);
      expect(plan.delay).toBe(500);
      expect(plan.actions).toContain('clear_script');
      expect(plan.actions).toContain('reload_script');
      expect(plan.actions).toContain('retry_load');
    });

    it('should create DOM reset plan', () => {
      const plan = errorHandler.createRecoveryPlan(
        RecoveryStrategies.DOM_RESET,
        AdErrorTypes.DOM_ERROR,
        0,
        {}
      );
      
      expect(plan.strategy).toBe(RecoveryStrategies.DOM_RESET);
      expect(plan.delay).toBe(200);
      expect(plan.actions).toContain('clear_dom');
      expect(plan.actions).toContain('recreate_elements');
      expect(plan.actions).toContain('retry_load');
    });

    it('should create fallback display plan', () => {
      const plan = errorHandler.createRecoveryPlan(
        RecoveryStrategies.FALLBACK_DISPLAY,
        AdErrorTypes.SCRIPT_LOAD_ERROR,
        3,
        {}
      );
      
      expect(plan.strategy).toBe(RecoveryStrategies.FALLBACK_DISPLAY);
      expect(plan.delay).toBe(0);
      expect(plan.actions).toContain('show_fallback');
      expect(plan.description).toBe('폴백 콘텐츠 표시');
    });
  });

  describe('shouldRetry', () => {
    it('should return false when max retries exceeded', () => {
      const shouldRetry = errorHandler.shouldRetry(3, AdErrorTypes.SCRIPT_LOAD_ERROR, ErrorSeverity.MEDIUM);
      expect(shouldRetry).toBe(false);
    });

    it('should return false for CRITICAL severity', () => {
      const shouldRetry = errorHandler.shouldRetry(1, AdErrorTypes.SCRIPT_LOAD_ERROR, ErrorSeverity.CRITICAL);
      expect(shouldRetry).toBe(false);
    });

    it('should return false for DOM error after 1 retry', () => {
      const shouldRetry = errorHandler.shouldRetry(1, AdErrorTypes.DOM_ERROR, ErrorSeverity.HIGH);
      expect(shouldRetry).toBe(false);
    });

    it('should return true for valid retry conditions', () => {
      const shouldRetry = errorHandler.shouldRetry(1, AdErrorTypes.NETWORK_ERROR, ErrorSeverity.MEDIUM);
      expect(shouldRetry).toBe(true);
    });
  });

  describe('calculateRetryDelay', () => {
    it('should calculate delay with exponential backoff', () => {
      const delay0 = errorHandler.calculateRetryDelay(AdErrorTypes.NETWORK_ERROR, 0);
      const delay1 = errorHandler.calculateRetryDelay(AdErrorTypes.NETWORK_ERROR, 1);
      const delay2 = errorHandler.calculateRetryDelay(AdErrorTypes.NETWORK_ERROR, 2);
      
      expect(delay1).toBeGreaterThan(delay0);
      expect(delay2).toBeGreaterThan(delay1);
    });

    it('should apply error type multipliers', () => {
      const networkDelay = errorHandler.calculateRetryDelay(AdErrorTypes.NETWORK_ERROR, 1);
      const scriptDelay = errorHandler.calculateRetryDelay(AdErrorTypes.SCRIPT_LOAD_ERROR, 1);
      
      expect(scriptDelay).toBeGreaterThan(networkDelay);
    });

    it('should cap delay at maximum value', () => {
      const delay = errorHandler.calculateRetryDelay(AdErrorTypes.SCRIPT_LOAD_ERROR, 10);
      expect(delay).toBeLessThanOrEqual(30000);
    });

    it('should handle unknown error types', () => {
      const delay = errorHandler.calculateRetryDelay('UNKNOWN_TYPE', 1);
      expect(delay).toBeGreaterThan(0);
    });
  });

  describe('handleError', () => {
    it('should return complete error response', () => {
      const error = new Error('Test error');
      const response = errorHandler.handleError(error, 0, { adUnitId: 'test-unit' });
      
      expect(response).toHaveProperty('errorType');
      expect(response).toHaveProperty('severity');
      expect(response).toHaveProperty('strategy');
      expect(response).toHaveProperty('recoveryPlan');
      expect(response).toHaveProperty('shouldRetry');
      expect(response).toHaveProperty('retryDelay');
      expect(response).toHaveProperty('fallbackRequired');
    });

    it('should update error statistics', () => {
      const error = new Error('Script load failed');
      
      errorHandler.handleError(error, 0, {});
      
      expect(errorHandler.errorStats.totalErrors).toBe(1);
      expect(errorHandler.errorStats.errorsByType[AdErrorTypes.SCRIPT_LOAD_ERROR]).toBe(1);
    });

    it('should handle error processing exceptions', () => {
      // Mock an error in categorizeError
      const originalCategorize = errorHandler.categorizeError;
      errorHandler.categorizeError = vi.fn().mockImplementation(() => {
        throw new Error('Categorization failed');
      });
      
      const error = new Error('Test error');
      const response = errorHandler.handleError(error, 0, {});
      
      // Should return emergency recovery plan
      expect(response.errorType).toBe(AdErrorTypes.UNKNOWN_ERROR);
      expect(response.severity).toBe(ErrorSeverity.CRITICAL);
      expect(response.strategy).toBe(RecoveryStrategies.FALLBACK_DISPLAY);
      expect(response.fallbackRequired).toBe(true);
      
      // Restore original method
      errorHandler.categorizeError = originalCategorize;
    });
  });

  describe('updateRecoveryStats', () => {
    it('should track recovery success rates', () => {
      const strategy = RecoveryStrategies.DELAYED_RETRY;
      
      errorHandler.updateRecoveryStats(strategy, true);
      errorHandler.updateRecoveryStats(strategy, false);
      errorHandler.updateRecoveryStats(strategy, true);
      
      const stats = errorHandler.getErrorStats();
      const strategyStats = stats.recoverySuccessRate[strategy];
      
      expect(strategyStats.attempts).toBe(3);
      expect(strategyStats.successes).toBe(2);
      expect(strategyStats.successRate).toBe('66.67%');
    });

    it('should handle new strategies', () => {
      const strategy = RecoveryStrategies.IMMEDIATE_RETRY;
      
      errorHandler.updateRecoveryStats(strategy, true);
      
      const stats = errorHandler.getErrorStats();
      expect(stats.recoverySuccessRate[strategy]).toBeDefined();
      expect(stats.recoverySuccessRate[strategy].attempts).toBe(1);
      expect(stats.recoverySuccessRate[strategy].successes).toBe(1);
    });
  });

  describe('createEmergencyRecoveryPlan', () => {
    it('should create emergency plan for critical failures', () => {
      const error = new Error('Critical failure');
      const plan = errorHandler.createEmergencyRecoveryPlan(error, 2);
      
      expect(plan.errorType).toBe(AdErrorTypes.UNKNOWN_ERROR);
      expect(plan.severity).toBe(ErrorSeverity.CRITICAL);
      expect(plan.strategy).toBe(RecoveryStrategies.FALLBACK_DISPLAY);
      expect(plan.shouldRetry).toBe(false);
      expect(plan.fallbackRequired).toBe(true);
    });
  });

  describe('getErrorStats', () => {
    it('should return comprehensive error statistics', () => {
      // Generate some test data
      const error1 = new Error('Script load failed');
      const error2 = new Error('Network failed');
      
      errorHandler.handleError(error1, 0, {});
      errorHandler.handleError(error2, 0, {});
      errorHandler.updateRecoveryStats(RecoveryStrategies.DELAYED_RETRY, true);
      
      const stats = errorHandler.getErrorStats();
      
      expect(stats.totalErrors).toBe(2);
      expect(stats.errorsByType).toBeDefined();
      expect(stats.errorsByStrategy).toBeDefined();
      expect(stats.recoverySuccessRate).toBeDefined();
    });

    it('should calculate success rates correctly', () => {
      const strategy = RecoveryStrategies.SCRIPT_RELOAD;
      
      errorHandler.updateRecoveryStats(strategy, true);
      errorHandler.updateRecoveryStats(strategy, true);
      errorHandler.updateRecoveryStats(strategy, false);
      
      const stats = errorHandler.getErrorStats();
      const strategyStats = stats.recoverySuccessRate[strategy];
      
      expect(strategyStats.successRate).toBe('66.67%');
    });

    it('should handle zero attempts', () => {
      const stats = errorHandler.getErrorStats();
      
      // Should not crash with empty stats
      expect(stats).toBeDefined();
      expect(stats.totalErrors).toBe(0);
    });
  });

  describe('resetStats', () => {
    it('should reset all statistics', () => {
      // Generate some test data
      const error = new Error('Test error');
      errorHandler.handleError(error, 0, {});
      errorHandler.updateRecoveryStats(RecoveryStrategies.DELAYED_RETRY, true);
      
      expect(errorHandler.errorStats.totalErrors).toBe(1);
      
      errorHandler.resetStats();
      
      expect(errorHandler.errorStats.totalErrors).toBe(0);
      expect(Object.keys(errorHandler.errorStats.errorsByType)).toHaveLength(0);
      expect(Object.keys(errorHandler.errorStats.errorsByStrategy)).toHaveLength(0);
      expect(Object.keys(errorHandler.errorStats.recoverySuccessRate)).toHaveLength(0);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration options', () => {
      const newConfig = {
        maxRetries: 5,
        baseRetryDelay: 2000,
        debug: false
      };
      
      errorHandler.updateConfig(newConfig);
      
      expect(errorHandler.maxRetries).toBe(5);
      expect(errorHandler.baseRetryDelay).toBe(2000);
      expect(errorHandler.debug).toBe(false);
    });

    it('should partially update configuration', () => {
      const originalMaxRetries = errorHandler.maxRetries;
      
      errorHandler.updateConfig({ debug: false });
      
      expect(errorHandler.maxRetries).toBe(originalMaxRetries);
      expect(errorHandler.debug).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very high retry counts', () => {
      const error = new Error('Test error');
      const response = errorHandler.handleError(error, 100, {});
      
      expect(response.shouldRetry).toBe(false);
      expect(response.strategy).toBe(RecoveryStrategies.FALLBACK_DISPLAY);
    });

    it('should handle negative retry counts', () => {
      const error = new Error('Test error');
      const response = errorHandler.handleError(error, -1, {});
      
      expect(response).toBeDefined();
      expect(response.shouldRetry).toBe(true);
    });

    it('should handle empty context', () => {
      const error = new Error('Test error');
      const response = errorHandler.handleError(error, 0, {});
      
      expect(response).toBeDefined();
      expect(response.recoveryPlan).toBeDefined();
    });

    it('should handle null context', () => {
      const error = new Error('Test error');
      const response = errorHandler.handleError(error, 0, null);
      
      expect(response).toBeDefined();
      expect(response.recoveryPlan).toBeDefined();
    });
  });
});