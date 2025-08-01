/**
 * AdErrorHandler - 광고 로딩 에러 처리 및 복구 유틸리티
 * 에러 분류, 복구 전략, 폴백 시스템 포함
 */

import adLogger from './AdLogger';

// 에러 타입 정의
export const AdErrorTypes = {
  SCRIPT_LOAD_ERROR: 'SCRIPT_LOAD_ERROR',
  AD_RENDER_ERROR: 'AD_RENDER_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  DOM_ERROR: 'DOM_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// 복구 전략 타입
export const RecoveryStrategies = {
  IMMEDIATE_RETRY: 'IMMEDIATE_RETRY',
  DELAYED_RETRY: 'DELAYED_RETRY',
  SCRIPT_RELOAD: 'SCRIPT_RELOAD',
  DOM_RESET: 'DOM_RESET',
  FALLBACK_DISPLAY: 'FALLBACK_DISPLAY',
  NO_RECOVERY: 'NO_RECOVERY'
};

// 에러 심각도
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

class AdErrorHandler {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseRetryDelay = options.baseRetryDelay || 1000;
    this.debug = options.debug || false;
    
    // 에러 통계
    this.errorStats = {
      totalErrors: 0,
      errorsByType: {},
      errorsByStrategy: {},
      recoverySuccessRate: {}
    };
  }

  /**
   * 에러 처리 및 복구 전략 결정
   * @param {Error} error 
   * @param {number} retryCount 
   * @param {object} context 
   * @returns {object} 복구 계획
   */
  handleError(error, retryCount = 0, context = {}) {
    try {
      // 에러 분류
      const errorType = this.categorizeError(error);
      const severity = this.assessErrorSeverity(error, errorType, retryCount);
      
      // 복구 전략 결정
      const strategy = this.determineRecoveryStrategy(errorType, retryCount, context);
      
      // 에러 로깅
      this.logError(error, errorType, severity, strategy, retryCount, context);
      
      // 통계 업데이트
      this.updateErrorStats(errorType, strategy);
      
      // 복구 계획 생성
      const recoveryPlan = this.createRecoveryPlan(strategy, errorType, retryCount, context);
      
      return {
        errorType,
        severity,
        strategy,
        recoveryPlan,
        shouldRetry: this.shouldRetry(retryCount, errorType, severity),
        retryDelay: this.calculateRetryDelay(errorType, retryCount),
        fallbackRequired: strategy === RecoveryStrategies.FALLBACK_DISPLAY
      };
    } catch (handlingError) {
      console.error('에러 처리 중 오류 발생:', handlingError);
      return this.createEmergencyRecoveryPlan(error, retryCount);
    }
  }

  /**
   * 에러 분류
   * @param {Error} error 
   * @returns {string}
   */
  categorizeError(error) {
    if (!error || !error.message) {
      return AdErrorTypes.UNKNOWN_ERROR;
    }

    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // 스크립트 로딩 에러
    if (message.includes('script') || 
        message.includes('load') ||
        message.includes('404') ||
        message.includes('network error') ||
        stack.includes('script')) {
      return AdErrorTypes.SCRIPT_LOAD_ERROR;
    }

    // 타임아웃 에러
    if (message.includes('timeout') || 
        message.includes('time out') ||
        message.includes('timed out')) {
      return AdErrorTypes.TIMEOUT_ERROR;
    }

    // 네트워크 에러
    if (message.includes('network') ||
        message.includes('fetch') ||
        message.includes('connection') ||
        message.includes('cors') ||
        message.includes('blocked')) {
      return AdErrorTypes.NETWORK_ERROR;
    }

    // DOM 관련 에러
    if (message.includes('dom') ||
        message.includes('element') ||
        message.includes('container') ||
        message.includes('node') ||
        stack.includes('dom')) {
      return AdErrorTypes.DOM_ERROR;
    }

    // 렌더링 에러
    if (message.includes('render') ||
        message.includes('display') ||
        message.includes('visibility') ||
        message.includes('layout')) {
      return AdErrorTypes.AD_RENDER_ERROR;
    }

    // 유효성 검사 에러
    if (message.includes('validation') ||
        message.includes('invalid') ||
        message.includes('missing') ||
        message.includes('required')) {
      return AdErrorTypes.VALIDATION_ERROR;
    }

    return AdErrorTypes.UNKNOWN_ERROR;
  }

  /**
   * 에러 심각도 평가
   * @param {Error} error 
   * @param {string} errorType 
   * @param {number} retryCount 
   * @returns {string}
   */
  assessErrorSeverity(error, errorType, retryCount) {
    // 재시도 횟수에 따른 심각도 증가
    if (retryCount >= this.maxRetries) {
      return ErrorSeverity.CRITICAL;
    }

    // 에러 타입별 기본 심각도
    switch (errorType) {
      case AdErrorTypes.SCRIPT_LOAD_ERROR:
        return retryCount >= 2 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM;
      
      case AdErrorTypes.NETWORK_ERROR:
        return retryCount >= 1 ? ErrorSeverity.MEDIUM : ErrorSeverity.LOW;
      
      case AdErrorTypes.TIMEOUT_ERROR:
        return retryCount >= 2 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM;
      
      case AdErrorTypes.DOM_ERROR:
        return ErrorSeverity.HIGH; // DOM 에러는 심각
      
      case AdErrorTypes.AD_RENDER_ERROR:
        return retryCount >= 1 ? ErrorSeverity.MEDIUM : ErrorSeverity.LOW;
      
      case AdErrorTypes.VALIDATION_ERROR:
        return ErrorSeverity.MEDIUM;
      
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * 복구 전략 결정
   * @param {string} errorType 
   * @param {number} retryCount 
   * @param {object} context 
   * @returns {string}
   */
  determineRecoveryStrategy(errorType, retryCount, context) {
    // 최대 재시도 횟수 초과 시 폴백
    if (retryCount >= this.maxRetries) {
      return RecoveryStrategies.FALLBACK_DISPLAY;
    }

    // 에러 타입별 복구 전략
    switch (errorType) {
      case AdErrorTypes.SCRIPT_LOAD_ERROR:
        if (retryCount === 0) {
          return RecoveryStrategies.SCRIPT_RELOAD;
        } else if (retryCount === 1) {
          return RecoveryStrategies.DELAYED_RETRY;
        } else {
          return RecoveryStrategies.FALLBACK_DISPLAY;
        }

      case AdErrorTypes.NETWORK_ERROR:
        return retryCount < 2 ? RecoveryStrategies.DELAYED_RETRY : RecoveryStrategies.FALLBACK_DISPLAY;

      case AdErrorTypes.TIMEOUT_ERROR:
        return retryCount < 2 ? RecoveryStrategies.DELAYED_RETRY : RecoveryStrategies.FALLBACK_DISPLAY;

      case AdErrorTypes.DOM_ERROR:
        if (retryCount === 0) {
          return RecoveryStrategies.DOM_RESET;
        } else {
          return RecoveryStrategies.FALLBACK_DISPLAY;
        }

      case AdErrorTypes.AD_RENDER_ERROR:
        return retryCount < 2 ? RecoveryStrategies.IMMEDIATE_RETRY : RecoveryStrategies.FALLBACK_DISPLAY;

      case AdErrorTypes.VALIDATION_ERROR:
        return retryCount < 1 ? RecoveryStrategies.DOM_RESET : RecoveryStrategies.FALLBACK_DISPLAY;

      default:
        return retryCount < 1 ? RecoveryStrategies.DELAYED_RETRY : RecoveryStrategies.FALLBACK_DISPLAY;
    }
  }

  /**
   * 복구 계획 생성
   * @param {string} strategy 
   * @param {string} errorType 
   * @param {number} retryCount 
   * @param {object} context 
   * @returns {object}
   */
  createRecoveryPlan(strategy, errorType, retryCount, context) {
    const basePlan = {
      strategy,
      errorType,
      retryCount,
      timestamp: Date.now()
    };

    switch (strategy) {
      case RecoveryStrategies.IMMEDIATE_RETRY:
        return {
          ...basePlan,
          delay: 0,
          actions: ['retry_load'],
          description: '즉시 재시도'
        };

      case RecoveryStrategies.DELAYED_RETRY:
        return {
          ...basePlan,
          delay: this.calculateRetryDelay(errorType, retryCount),
          actions: ['wait', 'retry_load'],
          description: `${this.calculateRetryDelay(errorType, retryCount)}ms 후 재시도`
        };

      case RecoveryStrategies.SCRIPT_RELOAD:
        return {
          ...basePlan,
          delay: 500,
          actions: ['clear_script', 'reload_script', 'retry_load'],
          description: '스크립트 재로드 후 재시도'
        };

      case RecoveryStrategies.DOM_RESET:
        return {
          ...basePlan,
          delay: 200,
          actions: ['clear_dom', 'recreate_elements', 'retry_load'],
          description: 'DOM 초기화 후 재시도'
        };

      case RecoveryStrategies.FALLBACK_DISPLAY:
        return {
          ...basePlan,
          delay: 0,
          actions: ['show_fallback'],
          description: '폴백 콘텐츠 표시'
        };

      default:
        return {
          ...basePlan,
          delay: 0,
          actions: ['no_action'],
          description: '복구 불가'
        };
    }
  }

  /**
   * 재시도 여부 결정
   * @param {number} retryCount 
   * @param {string} errorType 
   * @param {string} severity 
   * @returns {boolean}
   */
  shouldRetry(retryCount, errorType, severity) {
    // 최대 재시도 횟수 초과
    if (retryCount >= this.maxRetries) {
      return false;
    }

    // 심각도가 CRITICAL인 경우 재시도 안함
    if (severity === ErrorSeverity.CRITICAL) {
      return false;
    }

    // DOM 에러는 1회만 재시도
    if (errorType === AdErrorTypes.DOM_ERROR && retryCount >= 1) {
      return false;
    }

    return true;
  }

  /**
   * 재시도 지연 시간 계산
   * @param {string} errorType 
   * @param {number} retryCount 
   * @returns {number}
   */
  calculateRetryDelay(errorType, retryCount) {
    const baseDelay = this.baseRetryDelay;
    const exponentialFactor = Math.pow(2, retryCount);
    
    // 에러 타입별 지연 시간 조정
    const typeMultiplier = {
      [AdErrorTypes.NETWORK_ERROR]: 1.5,
      [AdErrorTypes.SCRIPT_LOAD_ERROR]: 2.0,
      [AdErrorTypes.TIMEOUT_ERROR]: 1.8,
      [AdErrorTypes.DOM_ERROR]: 0.5,
      [AdErrorTypes.AD_RENDER_ERROR]: 1.0,
      [AdErrorTypes.VALIDATION_ERROR]: 0.8
    };

    const multiplier = typeMultiplier[errorType] || 1.0;
    const delay = baseDelay * exponentialFactor * multiplier;
    
    // 최대 지연 시간 제한 (30초)
    return Math.min(delay, 30000);
  }

  /**
   * 에러 로깅
   * @param {Error} error 
   * @param {string} errorType 
   * @param {string} severity 
   * @param {string} strategy 
   * @param {number} retryCount 
   * @param {object} context 
   */
  logError(error, errorType, severity, strategy, retryCount, context) {
    const logData = {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      errorType,
      severity,
      strategy,
      retryCount,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: Date.now()
    };

    // 심각도에 따른 로그 레벨 결정
    const logLevel = {
      [ErrorSeverity.LOW]: 'info',
      [ErrorSeverity.MEDIUM]: 'warn',
      [ErrorSeverity.HIGH]: 'error',
      [ErrorSeverity.CRITICAL]: 'error'
    }[severity] || 'warn';

    adLogger.log(logLevel, `광고 에러 처리: ${errorType}`, logData);
  }

  /**
   * 에러 통계 업데이트
   * @param {string} errorType 
   * @param {string} strategy 
   */
  updateErrorStats(errorType, strategy) {
    this.errorStats.totalErrors++;
    
    if (!this.errorStats.errorsByType[errorType]) {
      this.errorStats.errorsByType[errorType] = 0;
    }
    this.errorStats.errorsByType[errorType]++;
    
    if (!this.errorStats.errorsByStrategy[strategy]) {
      this.errorStats.errorsByStrategy[strategy] = 0;
    }
    this.errorStats.errorsByStrategy[strategy]++;
  }

  /**
   * 복구 성공률 업데이트
   * @param {string} strategy 
   * @param {boolean} success 
   */
  updateRecoveryStats(strategy, success) {
    if (!this.errorStats.recoverySuccessRate[strategy]) {
      this.errorStats.recoverySuccessRate[strategy] = { attempts: 0, successes: 0 };
    }
    
    this.errorStats.recoverySuccessRate[strategy].attempts++;
    if (success) {
      this.errorStats.recoverySuccessRate[strategy].successes++;
    }
  }

  /**
   * 긴급 복구 계획 생성
   * @param {Error} error 
   * @param {number} retryCount 
   * @returns {object}
   */
  createEmergencyRecoveryPlan(error, retryCount) {
    return {
      errorType: AdErrorTypes.UNKNOWN_ERROR,
      severity: ErrorSeverity.CRITICAL,
      strategy: RecoveryStrategies.FALLBACK_DISPLAY,
      recoveryPlan: {
        strategy: RecoveryStrategies.FALLBACK_DISPLAY,
        delay: 0,
        actions: ['show_fallback'],
        description: '긴급 폴백 표시'
      },
      shouldRetry: false,
      retryDelay: 0,
      fallbackRequired: true
    };
  }

  /**
   * 에러 통계 조회
   * @returns {object}
   */
  getErrorStats() {
    const stats = { ...this.errorStats };
    
    // 복구 성공률 계산
    Object.keys(stats.recoverySuccessRate).forEach(strategy => {
      const data = stats.recoverySuccessRate[strategy];
      stats.recoverySuccessRate[strategy] = {
        ...data,
        successRate: data.attempts > 0 ? (data.successes / data.attempts * 100).toFixed(2) + '%' : '0%'
      };
    });
    
    return stats;
  }

  /**
   * 통계 초기화
   */
  resetStats() {
    this.errorStats = {
      totalErrors: 0,
      errorsByType: {},
      errorsByStrategy: {},
      recoverySuccessRate: {}
    };
  }

  /**
   * 설정 업데이트
   * @param {object} options 
   */
  updateConfig(options) {
    Object.assign(this, options);
  }
}

export default AdErrorHandler;