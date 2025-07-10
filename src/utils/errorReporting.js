// 에러 리포팅 유틸리티
// 프로덕션 환경에서 Sentry 등의 서비스 연동 가능

class ErrorReporter {
  constructor() {
    this.isProduction = import.meta.env.PROD;
    this.isDevelopment = import.meta.env.DEV;
    this.errorQueue = [];
    this.maxQueueSize = 100;
  }

  // 에러 로깅 (콘솔 + 저장)
  logError(error, context = {}) {
    const errorData = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      context: context,
      level: 'error'
    };

    // 개발 환경에서는 콘솔에 상세 출력
    if (this.isDevelopment) {
      console.group('🚨 Error Report');
      console.error('Error:', error);
      console.log('Context:', context);
      console.log('Full Error Data:', errorData);
      console.groupEnd();
    }

    // 프로덕션 환경에서는 간략하게 로그
    if (this.isProduction) {
      console.error('Error:', error.message);
    }

    // 에러 큐에 추가
    this.addToQueue(errorData);

    // 여기서 외부 서비스로 전송 가능
    // this.sendToExternalService(errorData);
  }

  // 경고 로깅
  logWarning(message, context = {}) {
    const warningData = {
      timestamp: new Date().toISOString(),
      message: message,
      url: window.location.href,
      context: context,
      level: 'warning'
    };

    if (this.isDevelopment) {
      console.warn('⚠️ Warning:', message, context);
    }

    this.addToQueue(warningData);
  }

  // 정보 로깅
  logInfo(message, context = {}) {
    const infoData = {
      timestamp: new Date().toISOString(),
      message: message,
      url: window.location.href,
      context: context,
      level: 'info'
    };

    if (this.isDevelopment) {
      console.info('ℹ️ Info:', message, context);
    }

    this.addToQueue(infoData);
  }

  // 성능 이슈 로깅
  logPerformance(metric, value, context = {}) {
    const perfData = {
      timestamp: new Date().toISOString(),
      metric: metric,
      value: value,
      url: window.location.href,
      context: context,
      level: 'performance'
    };

    if (this.isDevelopment) {
      console.log(`⚡ Performance - ${metric}:`, value, context);
    }

    this.addToQueue(perfData);
  }

  // 사용자 액션 로깅
  logUserAction(action, data = {}) {
    const actionData = {
      timestamp: new Date().toISOString(),
      action: action,
      data: data,
      url: window.location.href,
      level: 'user_action'
    };

    if (this.isDevelopment) {
      console.log(`👤 User Action - ${action}:`, data);
    }

    this.addToQueue(actionData);
  }

  // 큐에 추가
  addToQueue(data) {
    this.errorQueue.push(data);
    
    // 큐 크기 제한
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }

    // 로컬 스토리지에 저장 (개발 환경에서만)
    if (this.isDevelopment) {
      try {
        localStorage.setItem('haru_error_logs', JSON.stringify(this.errorQueue.slice(-20)));
      } catch (e) {
        console.warn('Failed to save error logs to localStorage:', e);
      }
    }
  }

  // 에러 큐 가져오기
  getErrorQueue() {
    return this.errorQueue;
  }

  // 에러 큐 클리어
  clearErrorQueue() {
    this.errorQueue = [];
    if (this.isDevelopment) {
      localStorage.removeItem('haru_error_logs');
    }
  }

  // 에러 통계
  getErrorStats() {
    const stats = {
      total: this.errorQueue.length,
      errors: this.errorQueue.filter(item => item.level === 'error').length,
      warnings: this.errorQueue.filter(item => item.level === 'warning').length,
      performance: this.errorQueue.filter(item => item.level === 'performance').length,
      userActions: this.errorQueue.filter(item => item.level === 'user_action').length
    };

    return stats;
  }

  // 외부 서비스로 전송 (예: Sentry, LogRocket 등)
  sendToExternalService(_errorData) {
    // 실제 구현시에는 여기서 Sentry.captureException() 등 호출
    if (this.isProduction) {
      // fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorData)
      // }).catch(e => console.error('Failed to send error to server:', e));
    }
  }
}

// 글로벌 에러 핸들러 설정
const setupGlobalErrorHandling = (reporter) => {
  // 일반 JavaScript 에러
  window.addEventListener('error', (event) => {
    reporter.logError(event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      type: 'javascript_error'
    });
  });

  // Promise rejection 에러
  window.addEventListener('unhandledrejection', (event) => {
    reporter.logError(new Error(event.reason), {
      type: 'unhandled_promise_rejection'
    });
  });

  // 리소스 로딩 에러
  window.addEventListener('error', (event) => {
    if (event.target !== window) {
      reporter.logError(new Error('Resource loading failed'), {
        element: event.target.tagName,
        source: event.target.src || event.target.href,
        type: 'resource_error'
      });
    }
  }, true);
};

// 싱글톤 인스턴스 생성
const errorReporter = new ErrorReporter();

// 글로벌 에러 핸들링 설정
setupGlobalErrorHandling(errorReporter);

// React 에러 바운더리용 헬퍼
export const reportError = (error, errorInfo = {}) => {
  errorReporter.logError(error, {
    componentStack: errorInfo.componentStack,
    type: 'react_error'
  });
};

export const reportWarning = (message, context) => {
  errorReporter.logWarning(message, context);
};

export const reportPerformance = (metric, value, context) => {
  errorReporter.logPerformance(metric, value, context);
};

export const reportUserAction = (action, data) => {
  errorReporter.logUserAction(action, data);
};

export { errorReporter };
export default errorReporter;