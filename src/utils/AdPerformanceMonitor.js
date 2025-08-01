/**
 * AdPerformanceMonitor - 광고 성능 모니터링 및 최적화 유틸리티
 * 메모리 사용량, 로딩 시간, 성능 메트릭 추적
 */

import adLogger from './AdLogger.js';

class AdPerformanceMonitor {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.maxMetrics = options.maxMetrics || 100;
    this.memoryCheckInterval = options.memoryCheckInterval || 30000; // 30초
    this.debug = options.debug || false;
    
    // 성능 메트릭 저장소
    this.metrics = {
      loadTimes: [],
      memoryUsage: [],
      errorRates: [],
      retryRates: [],
      successRates: []
    };
    
    // 타이머 참조
    this.memoryCheckTimer = null;
    this.performanceObserver = null;
    
    // 메모리 누수 감지
    this.activeInstances = new Set();
    this.cleanupCallbacks = new Set();
    
    // 성능 임계값
    this.thresholds = {
      maxLoadTime: options.maxLoadTime || 10000, // 10초
      maxMemoryUsage: options.maxMemoryUsage || 50 * 1024 * 1024, // 50MB
      maxErrorRate: options.maxErrorRate || 0.3, // 30%
      maxRetryRate: options.maxRetryRate || 0.5 // 50%
    };
    
    this.initialize();
  }

  /**
   * 모니터 초기화
   */
  initialize() {
    if (!this.enabled) return;

    this.log('🚀 AdPerformanceMonitor 초기화');
    
    // 메모리 사용량 주기적 체크
    this.startMemoryMonitoring();
    
    // Performance Observer 설정 (지원되는 경우)
    this.setupPerformanceObserver();
    
    // 페이지 언로드 시 정리
    this.setupUnloadHandler();
  }

  /**
   * 메모리 모니터링 시작
   */
  startMemoryMonitoring() {
    if (this.memoryCheckTimer) {
      clearInterval(this.memoryCheckTimer);
    }

    this.memoryCheckTimer = setInterval(() => {
      this.checkMemoryUsage();
      this.detectMemoryLeaks();
    }, this.memoryCheckInterval);
  }

  /**
   * Performance Observer 설정
   */
  setupPerformanceObserver() {
    if (typeof PerformanceObserver === 'undefined') {
      this.log('⚠️ PerformanceObserver 지원되지 않음');
      return;
    }

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name.includes('adfit') || entry.name.includes('kas')) {
            this.recordResourceTiming(entry);
          }
        });
      });

      this.performanceObserver.observe({ entryTypes: ['resource', 'measure'] });
      this.log('✅ PerformanceObserver 설정 완료');
    } catch (error) {
      this.log('❌ PerformanceObserver 설정 실패', { error: error.message });
    }
  }

  /**
   * 페이지 언로드 핸들러 설정
   */
  setupUnloadHandler() {
    const handleUnload = () => {
      this.cleanup();
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    
    // 정리 콜백에 추가
    this.cleanupCallbacks.add(() => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    });
  }

  /**
   * 광고 로딩 시작 기록
   * @param {string} adUnitId 
   * @param {object} options 
   */
  recordLoadStart(adUnitId, options = {}) {
    if (!this.enabled) return;

    const startTime = performance.now();
    const memoryBefore = this.getCurrentMemoryUsage();
    
    const loadRecord = {
      adUnitId,
      startTime,
      memoryBefore,
      options,
      timestamp: Date.now()
    };

    // 활성 인스턴스에 추가
    this.activeInstances.add(loadRecord);
    
    this.log('📊 광고 로딩 시작 기록', { adUnitId, memoryBefore });
    
    return loadRecord;
  }

  /**
   * 광고 로딩 완료 기록
   * @param {object} loadRecord 
   * @param {boolean} success 
   * @param {object} result 
   */
  recordLoadEnd(loadRecord, success, result = {}) {
    if (!this.enabled || !loadRecord) return;

    const endTime = performance.now();
    const memoryAfter = this.getCurrentMemoryUsage();
    const loadTime = endTime - loadRecord.startTime;
    
    const completedRecord = {
      ...loadRecord,
      endTime,
      loadTime,
      memoryAfter,
      memoryDelta: memoryAfter - loadRecord.memoryBefore,
      success,
      result
    };

    // 활성 인스턴스에서 제거
    this.activeInstances.delete(loadRecord);
    
    // 메트릭에 추가
    this.addMetric('loadTimes', {
      adUnitId: loadRecord.adUnitId,
      loadTime,
      success,
      timestamp: Date.now()
    });

    this.addMetric('memoryUsage', {
      adUnitId: loadRecord.adUnitId,
      memoryBefore: loadRecord.memoryBefore,
      memoryAfter,
      memoryDelta: completedRecord.memoryDelta,
      timestamp: Date.now()
    });

    // 성능 임계값 체크
    this.checkPerformanceThresholds(completedRecord);
    
    this.log('📊 광고 로딩 완료 기록', {
      adUnitId: loadRecord.adUnitId,
      loadTime: `${loadTime.toFixed(2)}ms`,
      success,
      memoryDelta: `${completedRecord.memoryDelta}bytes`
    });

    return completedRecord;
  }

  /**
   * 에러 발생 기록
   * @param {string} adUnitId 
   * @param {Error} error 
   * @param {number} retryCount 
   */
  recordError(adUnitId, error, retryCount = 0) {
    if (!this.enabled) return;

    this.addMetric('errorRates', {
      adUnitId,
      error: error.message,
      retryCount,
      timestamp: Date.now()
    });

    if (retryCount > 0) {
      this.addMetric('retryRates', {
        adUnitId,
        retryCount,
        timestamp: Date.now()
      });
    }

    this.log('📊 에러 발생 기록', { adUnitId, error: error.message, retryCount });
  }

  /**
   * 성공률 기록
   * @param {string} adUnitId 
   * @param {boolean} success 
   */
  recordSuccess(adUnitId, success) {
    if (!this.enabled) return;

    this.addMetric('successRates', {
      adUnitId,
      success,
      timestamp: Date.now()
    });
  }

  /**
   * 리소스 타이밍 기록
   * @param {PerformanceEntry} entry 
   */
  recordResourceTiming(entry) {
    if (!this.enabled) return;

    const timing = {
      name: entry.name,
      duration: entry.duration,
      transferSize: entry.transferSize || 0,
      encodedBodySize: entry.encodedBodySize || 0,
      decodedBodySize: entry.decodedBodySize || 0,
      timestamp: Date.now()
    };

    this.log('📊 리소스 타이밍 기록', timing);
    
    // 성능 로그에 기록
    adLogger.log('debug', '광고 리소스 타이밍', timing);
  }

  /**
   * 메트릭 추가
   * @param {string} type 
   * @param {object} data 
   */
  addMetric(type, data) {
    if (!this.metrics[type]) {
      this.metrics[type] = [];
    }

    this.metrics[type].push(data);

    // 최대 메트릭 수 제한
    if (this.metrics[type].length > this.maxMetrics) {
      this.metrics[type].shift();
    }
  }

  /**
   * 현재 메모리 사용량 조회
   * @returns {number}
   */
  getCurrentMemoryUsage() {
    try {
      if (performance.memory) {
        return performance.memory.usedJSHeapSize;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 메모리 사용량 체크
   */
  checkMemoryUsage() {
    const currentMemory = this.getCurrentMemoryUsage();
    
    if (currentMemory > this.thresholds.maxMemoryUsage) {
      this.log('⚠️ 메모리 사용량 임계값 초과', {
        current: `${(currentMemory / 1024 / 1024).toFixed(2)}MB`,
        threshold: `${(this.thresholds.maxMemoryUsage / 1024 / 1024).toFixed(2)}MB`
      });

      // 메모리 정리 시도
      this.performMemoryCleanup();
    }

    // 메모리 사용량 기록
    this.addMetric('memoryUsage', {
      usage: currentMemory,
      timestamp: Date.now()
    });
  }

  /**
   * 메모리 누수 감지
   */
  detectMemoryLeaks() {
    const activeCount = this.activeInstances.size;
    const now = Date.now();
    
    // 5분 이상 활성 상태인 인스턴스 체크
    const staleInstances = Array.from(this.activeInstances).filter(
      instance => now - instance.timestamp > 300000 // 5분
    );

    if (staleInstances.length > 0) {
      this.log('⚠️ 메모리 누수 의심 인스턴스 감지', {
        count: staleInstances.length,
        instances: staleInstances.map(i => i.adUnitId)
      });

      // 오래된 인스턴스 정리
      staleInstances.forEach(instance => {
        this.activeInstances.delete(instance);
      });
    }

    if (activeCount > 10) {
      this.log('⚠️ 활성 인스턴스 수 과다', { count: activeCount });
    }
  }

  /**
   * 성능 임계값 체크
   * @param {object} record 
   */
  checkPerformanceThresholds(record) {
    // 로딩 시간 체크
    if (record.loadTime > this.thresholds.maxLoadTime) {
      this.log('⚠️ 로딩 시간 임계값 초과', {
        adUnitId: record.adUnitId,
        loadTime: `${record.loadTime.toFixed(2)}ms`,
        threshold: `${this.thresholds.maxLoadTime}ms`
      });
    }

    // 메모리 증가량 체크
    if (record.memoryDelta > this.thresholds.maxMemoryUsage / 10) {
      this.log('⚠️ 메모리 증가량 과다', {
        adUnitId: record.adUnitId,
        memoryDelta: `${record.memoryDelta}bytes`
      });
    }
  }

  /**
   * 메모리 정리 수행
   */
  performMemoryCleanup() {
    try {
      // 오래된 메트릭 정리
      const cutoffTime = Date.now() - 3600000; // 1시간 전
      
      Object.keys(this.metrics).forEach(type => {
        this.metrics[type] = this.metrics[type].filter(
          metric => metric.timestamp > cutoffTime
        );
      });

      // 가비지 컬렉션 힌트 (Chrome에서만 작동)
      if (window.gc && typeof window.gc === 'function') {
        window.gc();
        this.log('🧹 가비지 컬렉션 실행');
      }

      this.log('🧹 메모리 정리 완료');
    } catch (error) {
      this.log('❌ 메모리 정리 실패', { error: error.message });
    }
  }

  /**
   * 성능 통계 조회
   * @returns {object}
   */
  getPerformanceStats() {
    if (!this.enabled) return {};

    const stats = {};

    // 로딩 시간 통계
    if (this.metrics.loadTimes.length > 0) {
      const loadTimes = this.metrics.loadTimes.map(m => m.loadTime);
      stats.loadTimes = {
        average: loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length,
        min: Math.min(...loadTimes),
        max: Math.max(...loadTimes),
        count: loadTimes.length
      };
    }

    // 성공률 통계
    if (this.metrics.successRates.length > 0) {
      const successes = this.metrics.successRates.filter(m => m.success).length;
      stats.successRate = (successes / this.metrics.successRates.length * 100).toFixed(2) + '%';
    }

    // 에러율 통계
    if (this.metrics.errorRates.length > 0) {
      stats.errorRate = (this.metrics.errorRates.length / 
        (this.metrics.successRates.length || 1) * 100).toFixed(2) + '%';
    }

    // 재시도율 통계
    if (this.metrics.retryRates.length > 0) {
      const totalRetries = this.metrics.retryRates.reduce((sum, m) => sum + m.retryCount, 0);
      stats.averageRetries = (totalRetries / this.metrics.retryRates.length).toFixed(2);
    }

    // 메모리 사용량 통계
    if (this.metrics.memoryUsage.length > 0) {
      const memoryUsages = this.metrics.memoryUsage
        .filter(m => m.usage)
        .map(m => m.usage);
      
      if (memoryUsages.length > 0) {
        stats.memoryUsage = {
          current: this.getCurrentMemoryUsage(),
          average: memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length,
          peak: Math.max(...memoryUsages)
        };
      }
    }

    // 활성 인스턴스 수
    stats.activeInstances = this.activeInstances.size;

    return stats;
  }

  /**
   * 성능 보고서 생성
   * @returns {object}
   */
  generatePerformanceReport() {
    const stats = this.getPerformanceStats();
    const recommendations = this.generateRecommendations(stats);
    
    return {
      timestamp: new Date().toISOString(),
      stats,
      recommendations,
      thresholds: this.thresholds,
      metrics: {
        loadTimesCount: this.metrics.loadTimes.length,
        errorRatesCount: this.metrics.errorRates.length,
        successRatesCount: this.metrics.successRates.length,
        memoryUsageCount: this.metrics.memoryUsage.length
      }
    };
  }

  /**
   * 성능 개선 권장사항 생성
   * @param {object} stats 
   * @returns {Array}
   */
  generateRecommendations(stats) {
    const recommendations = [];

    // 로딩 시간 권장사항
    if (stats.loadTimes && stats.loadTimes.average > 5000) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: '평균 로딩 시간이 5초를 초과합니다. 스크립트 최적화를 고려하세요.',
        metric: `평균 로딩 시간: ${stats.loadTimes.average.toFixed(2)}ms`
      });
    }

    // 성공률 권장사항
    if (stats.successRate && parseFloat(stats.successRate) < 80) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        message: '광고 로딩 성공률이 낮습니다. 에러 핸들링을 개선하세요.',
        metric: `성공률: ${stats.successRate}`
      });
    }

    // 메모리 사용량 권장사항
    if (stats.memoryUsage && stats.memoryUsage.current > this.thresholds.maxMemoryUsage) {
      recommendations.push({
        type: 'memory',
        priority: 'medium',
        message: '메모리 사용량이 높습니다. 정리 작업을 수행하세요.',
        metric: `현재 메모리: ${(stats.memoryUsage.current / 1024 / 1024).toFixed(2)}MB`
      });
    }

    // 재시도율 권장사항
    if (stats.averageRetries && parseFloat(stats.averageRetries) > 1.5) {
      recommendations.push({
        type: 'stability',
        priority: 'medium',
        message: '평균 재시도 횟수가 높습니다. 초기 로딩 안정성을 개선하세요.',
        metric: `평균 재시도: ${stats.averageRetries}회`
      });
    }

    return recommendations;
  }

  /**
   * 메트릭 내보내기
   * @param {string} format 
   * @returns {string}
   */
  exportMetrics(format = 'json') {
    const data = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      stats: this.getPerformanceStats()
    };

    if (format === 'csv') {
      return this.convertToCSV(data);
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * CSV 형식으로 변환
   * @param {object} data 
   * @returns {string}
   */
  convertToCSV(data) {
    const rows = [];
    
    // 헤더
    rows.push('timestamp,type,adUnitId,value,unit');
    
    // 로딩 시간 데이터
    data.metrics.loadTimes.forEach(metric => {
      rows.push(`${new Date(metric.timestamp).toISOString()},loadTime,${metric.adUnitId},${metric.loadTime},ms`);
    });
    
    // 메모리 사용량 데이터
    data.metrics.memoryUsage.forEach(metric => {
      if (metric.usage) {
        rows.push(`${new Date(metric.timestamp).toISOString()},memoryUsage,system,${metric.usage},bytes`);
      }
    });
    
    return rows.join('\n');
  }

  /**
   * 로그 출력
   * @param {string} message 
   * @param {object} data 
   */
  log(message, data = {}) {
    if (this.debug) {
      console.log(`[AdPerformanceMonitor] ${message}`, data);
    }
  }

  /**
   * 정리 작업
   */
  cleanup() {
    this.log('🧹 AdPerformanceMonitor 정리 시작');

    // 타이머 정리
    if (this.memoryCheckTimer) {
      clearInterval(this.memoryCheckTimer);
      this.memoryCheckTimer = null;
    }

    // Performance Observer 정리
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }

    // 정리 콜백 실행
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        this.log('❌ 정리 콜백 실행 실패', { error: error.message });
      }
    });
    this.cleanupCallbacks.clear();

    // 활성 인스턴스 정리
    this.activeInstances.clear();

    // 메트릭 정리
    Object.keys(this.metrics).forEach(key => {
      this.metrics[key] = [];
    });

    this.log('✅ AdPerformanceMonitor 정리 완료');
  }

  /**
   * 설정 업데이트
   * @param {object} options 
   */
  updateConfig(options) {
    Object.assign(this, options);
    
    if (options.thresholds) {
      Object.assign(this.thresholds, options.thresholds);
    }
  }
}

// 싱글톤 인스턴스
const adPerformanceMonitor = new AdPerformanceMonitor();

export default adPerformanceMonitor;
export { AdPerformanceMonitor };