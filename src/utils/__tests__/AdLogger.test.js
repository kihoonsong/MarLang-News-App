/**
 * AdLogger 유닛 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import adLogger, { LogLevels, EventTypes, ErrorCategories, AdLogger } from '../AdLogger';

// localStorage mock
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// console mock
const consoleMock = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  log: vi.fn()
};

Object.defineProperty(global, 'console', {
  value: consoleMock,
  writable: true
});

// navigator mock
Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Test Browser)'
  },
  writable: true
});

// window mock
Object.defineProperty(global, 'window', {
  value: {
    location: {
      href: 'https://test.example.com'
    }
  },
  writable: true
});

describe('AdLogger', () => {
  let logger;

  beforeEach(() => {
    vi.clearAllMocks();
    logger = new AdLogger({
      enabled: true,
      logLevel: LogLevels.DEBUG,
      enableConsole: true,
      enableStorage: false
    });
  });

  afterEach(() => {
    if (logger) {
      logger.clearLogs();
    }
  });

  describe('Constructor', () => {
    it('should initialize with default options', () => {
      const defaultLogger = new AdLogger();
      
      expect(defaultLogger.enabled).toBe(true);
      expect(defaultLogger.logLevel).toBe(LogLevels.INFO);
      expect(defaultLogger.maxLogs).toBe(1000);
      expect(defaultLogger.enableConsole).toBe(true);
      expect(defaultLogger.enableStorage).toBe(false);
    });

    it('should initialize with custom options', () => {
      const customLogger = new AdLogger({
        enabled: false,
        logLevel: LogLevels.ERROR,
        maxLogs: 500,
        enableConsole: false,
        enableStorage: true
      });
      
      expect(customLogger.enabled).toBe(false);
      expect(customLogger.logLevel).toBe(LogLevels.ERROR);
      expect(customLogger.maxLogs).toBe(500);
      expect(customLogger.enableConsole).toBe(false);
      expect(customLogger.enableStorage).toBe(true);
    });
  });

  describe('logLoadStart', () => {
    it('should log load start event', () => {
      const adUnitId = 'test-ad-unit';
      const options = { width: 320, height: 100 };
      
      logger.logLoadStart(adUnitId, options);
      
      expect(logger.metrics.totalAttempts).toBe(1);
      expect(logger.performanceData.has(adUnitId)).toBe(true);
      expect(consoleMock.info).toHaveBeenCalledWith(
        '[AdLogger] 🚀 광고 로딩 시작',
        expect.objectContaining({
          eventType: EventTypes.LOAD_START,
          adUnitId,
          ...options
        })
      );
    });
  });

  describe('logLoadSuccess', () => {
    it('should log load success event', () => {
      const adUnitId = 'test-ad-unit';
      const loadTime = 1500;
      
      logger.logLoadSuccess(adUnitId, loadTime);
      
      expect(logger.metrics.successCount).toBe(1);
      expect(logger.metrics.averageLoadTime).toBe(loadTime);
      expect(consoleMock.info).toHaveBeenCalledWith(
        '[AdLogger] ✅ 광고 로딩 성공',
        expect.objectContaining({
          eventType: EventTypes.LOAD_SUCCESS,
          adUnitId,
          loadTime
        })
      );
    });

    it('should update average load time correctly', () => {
      const adUnitId = 'test-ad-unit';
      
      logger.logLoadSuccess(adUnitId, 1000);
      logger.logLoadSuccess(adUnitId, 2000);
      
      expect(logger.metrics.successCount).toBe(2);
      expect(logger.metrics.averageLoadTime).toBe(1500);
    });
  });

  describe('logLoadError', () => {
    it('should log load error event', () => {
      const adUnitId = 'test-ad-unit';
      const error = new Error('Test error');
      const retryCount = 1;
      
      logger.logLoadError(adUnitId, error, retryCount);
      
      expect(logger.metrics.errorCount).toBe(1);
      expect(consoleMock.error).toHaveBeenCalledWith(
        '[AdLogger] ❌ 광고 로딩 에러',
        expect.objectContaining({
          eventType: EventTypes.LOAD_ERROR,
          adUnitId,
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name
          },
          retryCount
        })
      );
    });

    it('should categorize errors correctly', () => {
      const adUnitId = 'test-ad-unit';
      
      // Script error
      const scriptError = new Error('Script load failed');
      logger.logLoadError(adUnitId, scriptError);
      expect(logger.metrics.errorsByCategory[ErrorCategories.SCRIPT_ERROR]).toBe(1);
      
      // Network error
      const networkError = new Error('Network connection failed');
      logger.logLoadError(adUnitId, networkError);
      expect(logger.metrics.errorsByCategory[ErrorCategories.NETWORK_ERROR]).toBe(1);
      
      // Timeout error
      const timeoutError = new Error('Request timeout');
      logger.logLoadError(adUnitId, timeoutError);
      expect(logger.metrics.errorsByCategory[ErrorCategories.TIMEOUT_ERROR]).toBe(1);
    });
  });

  describe('logLoadRetry', () => {
    it('should log retry event', () => {
      const adUnitId = 'test-ad-unit';
      const retryCount = 2;
      const delay = 1000;
      const reason = 'Script load failed';
      
      logger.logLoadRetry(adUnitId, retryCount, delay, reason);
      
      expect(logger.metrics.retryCount).toBe(1);
      expect(consoleMock.warn).toHaveBeenCalledWith(
        '[AdLogger] 🔄 광고 로딩 재시도',
        expect.objectContaining({
          eventType: EventTypes.LOAD_RETRY,
          adUnitId,
          retryCount,
          delay,
          reason
        })
      );
    });
  });

  describe('logLoadTimeout', () => {
    it('should log timeout event', () => {
      const adUnitId = 'test-ad-unit';
      const timeout = 10000;
      
      logger.logLoadTimeout(adUnitId, timeout);
      
      expect(consoleMock.error).toHaveBeenCalledWith(
        '[AdLogger] ⏰ 광고 로딩 타임아웃',
        expect.objectContaining({
          eventType: EventTypes.LOAD_TIMEOUT,
          adUnitId,
          timeout
        })
      );
    });
  });

  describe('logFallback', () => {
    it('should log fallback event', () => {
      const adUnitId = 'test-ad-unit';
      const finalError = new Error('Final error');
      
      logger.logFallback(adUnitId, finalError);
      
      expect(consoleMock.warn).toHaveBeenCalledWith(
        '[AdLogger] 🔄 폴백 표시',
        expect.objectContaining({
          eventType: EventTypes.LOAD_FALLBACK,
          adUnitId,
          finalError: {
            message: finalError.message,
            stack: finalError.stack
          }
        })
      );
    });
  });

  describe('logScriptLoad', () => {
    it('should log successful script load', () => {
      const success = true;
      const src = '//t1.daumcdn.net/kas/static/ba.min.js';
      const loadTime = 500;
      
      logger.logScriptLoad(success, src, loadTime);
      
      expect(consoleMock.info).toHaveBeenCalledWith(
        '[AdLogger] 📜 스크립트 로드 성공',
        expect.objectContaining({
          eventType: EventTypes.SCRIPT_LOAD,
          success,
          src,
          loadTime
        })
      );
    });

    it('should log failed script load', () => {
      const success = false;
      const src = '//t1.daumcdn.net/kas/static/ba.min.js';
      const loadTime = 0;
      
      logger.logScriptLoad(success, src, loadTime);
      
      expect(consoleMock.error).toHaveBeenCalledWith(
        '[AdLogger] ❌ 스크립트 로드 실패',
        expect.objectContaining({
          eventType: EventTypes.SCRIPT_LOAD,
          success,
          src,
          loadTime
        })
      );
    });
  });

  describe('logAdRender', () => {
    it('should log successful ad render', () => {
      const adUnitId = 'test-ad-unit';
      const success = true;
      const renderInfo = { width: 320, height: 100 };
      
      logger.logAdRender(adUnitId, success, renderInfo);
      
      expect(consoleMock.info).toHaveBeenCalledWith(
        '[AdLogger] 🎨 광고 렌더링 성공',
        expect.objectContaining({
          eventType: EventTypes.AD_RENDER,
          adUnitId,
          success,
          renderInfo
        })
      );
    });

    it('should log failed ad render', () => {
      const adUnitId = 'test-ad-unit';
      const success = false;
      const renderInfo = { error: 'Render failed' };
      
      logger.logAdRender(adUnitId, success, renderInfo);
      
      expect(consoleMock.warn).toHaveBeenCalledWith(
        '[AdLogger] ⚠️ 광고 렌더링 실패',
        expect.objectContaining({
          eventType: EventTypes.AD_RENDER,
          adUnitId,
          success,
          renderInfo
        })
      );
    });
  });

  describe('logAdValidation', () => {
    it('should log successful validation', () => {
      const adUnitId = 'test-ad-unit';
      const isValid = true;
      const validationDetails = { hasContent: true, layoutStable: true };
      
      logger.logAdValidation(adUnitId, isValid, validationDetails);
      
      expect(consoleMock.debug).toHaveBeenCalledWith(
        '[AdLogger] ✅ 광고 유효성 검사 통과',
        expect.objectContaining({
          eventType: EventTypes.AD_VALIDATION,
          adUnitId,
          isValid,
          validationDetails
        })
      );
    });

    it('should log failed validation', () => {
      const adUnitId = 'test-ad-unit';
      const isValid = false;
      const validationDetails = { hasContent: false, reason: 'No content' };
      
      logger.logAdValidation(adUnitId, isValid, validationDetails);
      
      expect(consoleMock.warn).toHaveBeenCalledWith(
        '[AdLogger] ⚠️ 광고 유효성 검사 실패',
        expect.objectContaining({
          eventType: EventTypes.AD_VALIDATION,
          adUnitId,
          isValid,
          validationDetails
        })
      );
    });
  });

  describe('categorizeError', () => {
    it('should categorize script errors', () => {
      const error = new Error('Script load failed');
      const category = logger.categorizeError(error);
      expect(category).toBe(ErrorCategories.SCRIPT_ERROR);
    });

    it('should categorize network errors', () => {
      const error = new Error('Network connection failed');
      const category = logger.categorizeError(error);
      expect(category).toBe(ErrorCategories.NETWORK_ERROR);
    });

    it('should categorize timeout errors', () => {
      const error = new Error('Request timeout');
      const category = logger.categorizeError(error);
      expect(category).toBe(ErrorCategories.TIMEOUT_ERROR);
    });

    it('should categorize DOM errors', () => {
      const error = new Error('DOM element not found');
      const category = logger.categorizeError(error);
      expect(category).toBe(ErrorCategories.DOM_ERROR);
    });

    it('should categorize render errors', () => {
      const error = new Error('Render failed');
      const category = logger.categorizeError(error);
      expect(category).toBe(ErrorCategories.RENDER_ERROR);
    });

    it('should categorize validation errors', () => {
      const error = new Error('Validation failed');
      const category = logger.categorizeError(error);
      expect(category).toBe(ErrorCategories.VALIDATION_ERROR);
    });
  });

  describe('Log Level Filtering', () => {
    it('should respect log level filtering', () => {
      const errorLogger = new AdLogger({
        enabled: true,
        logLevel: LogLevels.ERROR,
        enableConsole: true
      });
      
      // Should log error
      errorLogger.log(LogLevels.ERROR, 'Error message', {});
      expect(consoleMock.error).toHaveBeenCalled();
      
      // Should not log info
      consoleMock.info.mockClear();
      errorLogger.log(LogLevels.INFO, 'Info message', {});
      expect(consoleMock.info).not.toHaveBeenCalled();
    });
  });

  describe('Log Storage', () => {
    it('should store logs in memory', () => {
      logger.log(LogLevels.INFO, 'Test message', { test: true });
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        level: LogLevels.INFO,
        message: 'Test message',
        data: { test: true }
      });
    });

    it('should limit log storage to maxLogs', () => {
      const limitedLogger = new AdLogger({ maxLogs: 2 });
      
      limitedLogger.log(LogLevels.INFO, 'Message 1', {});
      limitedLogger.log(LogLevels.INFO, 'Message 2', {});
      limitedLogger.log(LogLevels.INFO, 'Message 3', {});
      
      const logs = limitedLogger.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].message).toBe('Message 2');
      expect(logs[1].message).toBe('Message 3');
    });

    it('should save to localStorage when enabled', () => {
      const storageLogger = new AdLogger({
        enableStorage: true
      });
      
      localStorageMock.getItem.mockReturnValue('[]');
      
      storageLogger.log(LogLevels.INFO, 'Test message', {});
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'adLogger_logs',
        expect.stringContaining('Test message')
      );
    });
  });

  describe('Log Filtering', () => {
    beforeEach(() => {
      // Add some test logs
      logger.log(LogLevels.INFO, 'Info message', { eventType: EventTypes.LOAD_START, adUnitId: 'unit1' });
      logger.log(LogLevels.ERROR, 'Error message', { eventType: EventTypes.LOAD_ERROR, adUnitId: 'unit2' });
      logger.log(LogLevels.WARN, 'Warning message', { eventType: EventTypes.LOAD_RETRY, adUnitId: 'unit1' });
    });

    it('should filter logs by level', () => {
      const errorLogs = logger.getLogs({ level: LogLevels.ERROR });
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].level).toBe(LogLevels.ERROR);
    });

    it('should filter logs by event type', () => {
      const startLogs = logger.getLogs({ eventType: EventTypes.LOAD_START });
      expect(startLogs).toHaveLength(1);
      expect(startLogs[0].data.eventType).toBe(EventTypes.LOAD_START);
    });

    it('should filter logs by ad unit ID', () => {
      const unit1Logs = logger.getLogs({ adUnitId: 'unit1' });
      expect(unit1Logs).toHaveLength(2);
      unit1Logs.forEach(log => {
        expect(log.data.adUnitId).toBe('unit1');
      });
    });

    it('should filter logs by timestamp', () => {
      const now = Date.now();
      const recentLogs = logger.getLogs({ since: now - 1000 });
      expect(recentLogs.length).toBeGreaterThan(0);
    });
  });

  describe('Metrics', () => {
    it('should calculate success rate correctly', () => {
      logger.logLoadStart('unit1');
      logger.logLoadSuccess('unit1', 1000);
      logger.logLoadStart('unit2');
      logger.logLoadError('unit2', new Error('Test error'));
      
      const metrics = logger.getMetrics();
      expect(metrics.successRate).toBe('50.00%');
      expect(metrics.errorRate).toBe('50.00%');
    });

    it('should handle zero attempts', () => {
      const metrics = logger.getMetrics();
      expect(metrics.successRate).toBe('0%');
      expect(metrics.errorRate).toBe('0%');
    });
  });

  describe('Export Functions', () => {
    beforeEach(() => {
      logger.log(LogLevels.INFO, 'Test message 1', { eventType: EventTypes.LOAD_START, adUnitId: 'unit1' });
      logger.log(LogLevels.ERROR, 'Test message 2', { eventType: EventTypes.LOAD_ERROR, adUnitId: 'unit2' });
    });

    it('should export logs as JSON', () => {
      const jsonExport = logger.exportLogs('json');
      const parsed = JSON.parse(jsonExport);
      
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
    });

    it('should export logs as CSV', () => {
      const csvExport = logger.exportLogs('csv');
      const lines = csvExport.split('\n');
      
      expect(lines[0]).toContain('timestamp,level,message,eventType,adUnitId');
      expect(lines).toHaveLength(3); // Header + 2 data rows
    });

    it('should handle empty logs for CSV export', () => {
      logger.clearLogs();
      const csvExport = logger.exportLogs('csv');
      expect(csvExport).toBe('');
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      logger.updateConfig({
        enabled: false,
        logLevel: LogLevels.ERROR
      });
      
      expect(logger.enabled).toBe(false);
      expect(logger.logLevel).toBe(LogLevels.ERROR);
    });
  });

  describe('Clear Logs', () => {
    it('should clear all logs and metrics', () => {
      logger.log(LogLevels.INFO, 'Test message', {});
      logger.logLoadStart('unit1');
      
      expect(logger.getLogs()).toHaveLength(2); // log() + logLoadStart() both create log entries
      expect(logger.metrics.totalAttempts).toBe(1);
      
      logger.clearLogs();
      
      expect(logger.getLogs()).toHaveLength(0);
      expect(logger.metrics.totalAttempts).toBe(0);
    });
  });

  describe('Singleton Instance', () => {
    it('should use singleton instance', () => {
      expect(adLogger).toBeInstanceOf(AdLogger);
      
      // Test that it works
      adLogger.logLoadStart('test-unit');
      expect(adLogger.metrics.totalAttempts).toBe(1);
    });
  });
});