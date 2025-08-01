/**
 * AdLogger - 광고 로딩 이벤트 로깅 유틸리티
 * 구조화된 로깅, 에러 분류, 성능 메트릭 추적 기능 포함
 */

// 로그 레벨 정의
const LogLevels = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

// 이벤트 타입 정의
const EventTypes = {
  LOAD_START: 'load_start',
  LOAD_SUCCESS: 'load_success',
  LOAD_ERROR: 'load_error',
  LOAD_RETRY: 'load_retry',
  LOAD_TIMEOUT: 'load_timeout',
  LOAD_FALLBACK: 'load_fallback',
  SCRIPT_LOAD: 'script_load',
  SCRIPT_ERROR: 'script_error',
  AD_RENDER: 'ad_render',
  AD_VALIDATION: 'ad_validation'
};

// 에러 카테고리 정의
const ErrorCategories = {
  SCRIPT_ERROR: 'script_error',
  NETWORK_ERROR: 'network_error',
  TIMEOUT_ERROR: 'timeout_error',
  DOM_ERROR: 'dom_error',
  RENDER_ERROR: 'render_error',
  VALIDATION_ERROR: 'validation_error'
};

class AdLogger {
  constructor(options = {}) {
    this.enabled = options.enabled !== false; // 기본값: true
    this.logLevel = options.logLevel || LogLevels.INFO;
    this.maxLogs = options.maxLogs || 1000;
    this.enableConsole = options.enableConsole !== false; // 기본값: true
    this.enableStorage = options.enableStorage || false;
    
    // 로그 저장소
    this.logs = [];
    this.metrics = {
      totalAttempts: 0,
      successCount: 0,
      errorCount: 0,
      retryCount: 0,
      averageLoadTime: 0,
      errorsByCategory: {}
    };

    // 성능 추적
    this.performanceData = new Map();
  }

  /**
   * 광고 로딩 시작 로그
   * @param {string} adUnitId 
   * @param {object} options 
   */
  logLoadStart(adUnitId, options = {}) {
    const logData = {
      eventType: EventTypes.LOAD_START,
      adUnitId,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...options
    };

    this.metrics.totalAttempts++;
    this.performanceData.set(adUnitId, { startTime: Date.now() });

    this.log(LogLevels.INFO, '🚀 광고 로딩 시작', logData);
  }

  /**
   * 광고 로딩 성공 로그
   * @param {string} adUnitId 
   * @param {number} loadTime 
   * @param {object} options 
   */
  logLoadSuccess(adUnitId, loadTime, options = {}) {
    const logData = {
      eventType: EventTypes.LOAD_SUCCESS,
      adUnitId,
      loadTime,
      timestamp: Date.now(),
      ...options
    };

    this.metrics.successCount++;
    this.updateAverageLoadTime(loadTime);

    this.log(LogLevels.INFO, '✅ 광고 로딩 성공', logData);
  }

  /**
   * 광고 로딩 에러 로그
   * @param {string} adUnitId 
   * @param {Error} error 
   * @param {number} retryCount 
   * @param {object} options 
   */
  logLoadError(adUnitId, error, retryCount = 0, options = {}) {
    const errorCategory = this.categorizeError(error);
    const logData = {
      eventType: EventTypes.LOAD_ERROR,
      adUnitId,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      errorCategory,
      retryCount,
      timestamp: Date.now(),
      ...options
    };

    this.metrics.errorCount++;
    this.updateErrorMetrics(errorCategory);

    this.log(LogLevels.ERROR, '❌ 광고 로딩 에러', logData);
  }

  /**
   * 광고 재시도 로그
   * @param {string} adUnitId 
   * @param {number} retryCount 
   * @param {number} delay 
   * @param {string} reason 
   */
  logLoadRetry(adUnitId, retryCount, delay, reason) {
    const logData = {
      eventType: EventTypes.LOAD_RETRY,
      adUnitId,
      retryCount,
      delay,
      reason,
      timestamp: Date.now()
    };

    this.metrics.retryCount++;

    this.log(LogLevels.WARN, '🔄 광고 로딩 재시도', logData);
  }

  /**
   * 광고 로딩 타임아웃 로그
   * @param {string} adUnitId 
   * @param {number} timeout 
   */
  logLoadTimeout(adUnitId, timeout) {
    const logData = {
      eventType: EventTypes.LOAD_TIMEOUT,
      adUnitId,
      timeout,
      timestamp: Date.now()
    };

    this.log(LogLevels.ERROR, '⏰ 광고 로딩 타임아웃', logData);
  }

  /**
   * 폴백 표시 로그
   * @param {string} adUnitId 
   * @param {Error} finalError 
   */
  logFallback(adUnitId, finalError) {
    const logData = {
      eventType: EventTypes.LOAD_FALLBACK,
      adUnitId,
      finalError: {
        message: finalError.message,
        stack: finalError.stack
      },
      timestamp: Date.now()
    };

    this.log(LogLevels.WARN, '🔄 폴백 표시', logData);
  }

  /**
   * 스크립트 로드 로그
   * @param {boolean} success 
   * @param {string} src 
   * @param {number} loadTime 
   */
  logScriptLoad(success, src, loadTime) {
    const logData = {
      eventType: EventTypes.SCRIPT_LOAD,
      success,
      src,
      loadTime,
      timestamp: Date.now()
    };

    const level = success ? LogLevels.INFO : LogLevels.ERROR;
    const message = success ? '📜 스크립트 로드 성공' : '❌ 스크립트 로드 실패';

    this.log(level, message, logData);
  }

  /**
   * 광고 렌더링 로그
   * @param {string} adUnitId 
   * @param {boolean} success 
   * @param {object} renderInfo 
   */
  logAdRender(adUnitId, success, renderInfo = {}) {
    const logData = {
      eventType: EventTypes.AD_RENDER,
      adUnitId,
      success,
      renderInfo,
      timestamp: Date.now()
    };

    const level = success ? LogLevels.INFO : LogLevels.WARN;
    const message = success ? '🎨 광고 렌더링 성공' : '⚠️ 광고 렌더링 실패';

    this.log(level, message, logData);
  }

  /**
   * 광고 유효성 검사 로그
   * @param {string} adUnitId 
   * @param {boolean} isValid 
   * @param {object} validationDetails 
   */
  logAdValidation(adUnitId, isValid, validationDetails = {}) {
    const logData = {
      eventType: EventTypes.AD_VALIDATION,
      adUnitId,
      isValid,
      validationDetails,
      timestamp: Date.now()
    };

    const level = isValid ? LogLevels.DEBUG : LogLevels.WARN;
    const message = isValid ? '✅ 광고 유효성 검사 통과' : '⚠️ 광고 유효성 검사 실패';

    this.log(level, message, logData);
  }

  /**
   * 에러 분류
   * @param {Error} error 
   * @returns {string}
   */
  categorizeError(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('script') || message.includes('load')) {
      return ErrorCategories.SCRIPT_ERROR;
    } else if (message.includes('network') || message.includes('fetch')) {
      return ErrorCategories.NETWORK_ERROR;
    } else if (message.includes('timeout')) {
      return ErrorCategories.TIMEOUT_ERROR;
    } else if (message.includes('dom') || message.includes('element')) {
      return ErrorCategories.DOM_ERROR;
    } else if (message.includes('render') || message.includes('display')) {
      return ErrorCategories.RENDER_ERROR;
    } else {
      return ErrorCategories.VALIDATION_ERROR;
    }
  }

  /**
   * 평균 로딩 시간 업데이트
   * @param {number} loadTime 
   */
  updateAverageLoadTime(loadTime) {
    const currentAverage = this.metrics.averageLoadTime;
    const successCount = this.metrics.successCount;
    
    this.metrics.averageLoadTime = 
      ((currentAverage * (successCount - 1)) + loadTime) / successCount;
  }

  /**
   * 에러 메트릭 업데이트
   * @param {string} category 
   */
  updateErrorMetrics(category) {
    if (!this.metrics.errorsByCategory[category]) {
      this.metrics.errorsByCategory[category] = 0;
    }
    this.metrics.errorsByCategory[category]++;
  }

  /**
   * 로그 출력
   * @param {string} level 
   * @param {string} message 
   * @param {object} data 
   */
  log(level, message, data) {
    if (!this.enabled) return;

    // 로그 레벨 체크
    if (!this.shouldLog(level)) return;

    const logEntry = {
      level,
      message,
      data,
      timestamp: Date.now(),
      id: this.generateLogId()
    };

    // 메모리에 저장
    this.addToStorage(logEntry);

    // 콘솔 출력
    if (this.enableConsole) {
      this.outputToConsole(logEntry);
    }

    // 로컬 스토리지 저장 (옵션)
    if (this.enableStorage) {
      this.saveToLocalStorage(logEntry);
    }
  }

  /**
   * 로그 레벨 체크
   * @param {string} level 
   * @returns {boolean}
   */
  shouldLog(level) {
    const levels = [LogLevels.DEBUG, LogLevels.INFO, LogLevels.WARN, LogLevels.ERROR];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * 메모리 저장소에 추가
   * @param {object} logEntry 
   */
  addToStorage(logEntry) {
    this.logs.push(logEntry);
    
    // 최대 로그 수 제한
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // 가장 오래된 로그 제거
    }
  }

  /**
   * 콘솔 출력
   * @param {object} logEntry 
   */
  outputToConsole(logEntry) {
    const { level, message, data } = logEntry;
    
    switch (level) {
      case LogLevels.DEBUG:
        console.debug(`[AdLogger] ${message}`, data);
        break;
      case LogLevels.INFO:
        console.info(`[AdLogger] ${message}`, data);
        break;
      case LogLevels.WARN:
        console.warn(`[AdLogger] ${message}`, data);
        break;
      case LogLevels.ERROR:
        console.error(`[AdLogger] ${message}`, data);
        break;
      default:
        console.log(`[AdLogger] ${message}`, data);
    }
  }

  /**
   * 로컬 스토리지 저장
   * @param {object} logEntry 
   */
  saveToLocalStorage(logEntry) {
    try {
      const storageKey = 'adLogger_logs';
      const existingLogs = JSON.parse(localStorage.getItem(storageKey) || '[]');
      existingLogs.push(logEntry);
      
      // 최대 100개 로그만 저장
      if (existingLogs.length > 100) {
        existingLogs.shift();
      }
      
      localStorage.setItem(storageKey, JSON.stringify(existingLogs));
    } catch (error) {
      console.warn('[AdLogger] 로컬 스토리지 저장 실패:', error);
    }
  }

  /**
   * 로그 ID 생성
   * @returns {string}
   */
  generateLogId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 로그 조회
   * @param {object} filters 
   * @returns {Array}
   */
  getLogs(filters = {}) {
    let filteredLogs = [...this.logs];

    if (filters.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filters.level);
    }

    if (filters.eventType) {
      filteredLogs = filteredLogs.filter(log => 
        log.data.eventType === filters.eventType
      );
    }

    if (filters.adUnitId) {
      filteredLogs = filteredLogs.filter(log => 
        log.data.adUnitId === filters.adUnitId
      );
    }

    if (filters.since) {
      filteredLogs = filteredLogs.filter(log => 
        log.timestamp >= filters.since
      );
    }

    return filteredLogs;
  }

  /**
   * 메트릭 조회
   * @returns {object}
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalAttempts > 0 
        ? (this.metrics.successCount / this.metrics.totalAttempts * 100).toFixed(2) + '%'
        : '0%',
      errorRate: this.metrics.totalAttempts > 0
        ? (this.metrics.errorCount / this.metrics.totalAttempts * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * 로그 내보내기
   * @param {string} format - 'json' | 'csv'
   * @returns {string}
   */
  exportLogs(format = 'json') {
    if (format === 'csv') {
      return this.exportToCSV();
    } else {
      return JSON.stringify(this.logs, null, 2);
    }
  }

  /**
   * CSV 형식으로 내보내기
   * @returns {string}
   */
  exportToCSV() {
    if (this.logs.length === 0) return '';

    const headers = ['timestamp', 'level', 'message', 'eventType', 'adUnitId'];
    const csvRows = [headers.join(',')];

    this.logs.forEach(log => {
      const row = [
        new Date(log.timestamp).toISOString(),
        log.level,
        `"${log.message}"`,
        log.data.eventType || '',
        log.data.adUnitId || ''
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * 로그 초기화
   */
  clearLogs() {
    this.logs = [];
    this.metrics = {
      totalAttempts: 0,
      successCount: 0,
      errorCount: 0,
      retryCount: 0,
      averageLoadTime: 0,
      errorsByCategory: {}
    };
    this.performanceData.clear();
  }

  /**
   * 설정 업데이트
   * @param {object} options 
   */
  updateConfig(options) {
    Object.assign(this, options);
  }
}

// 싱글톤 인스턴스
const adLogger = new AdLogger();

export default adLogger;
export { LogLevels, EventTypes, ErrorCategories, AdLogger };