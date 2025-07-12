// 성능 모니터링 유틸리티
// Web Vitals 및 커스텀 성능 메트릭 측정

import { reportPerformance } from './errorReporting';

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.isSupported = 'performance' in window;
    
    if (this.isSupported) {
      this.initializeObservers();
    }
  }

  // 성능 옵저버 초기화
  initializeObservers() {
    // Largest Contentful Paint (LCP)
    this.observeLCP();
    
    // First Input Delay (FID)
    this.observeFID();
    
    // Cumulative Layout Shift (CLS)
    this.observeCLS();
    
    // First Contentful Paint (FCP)
    this.observeFCP();
    
    // Time to First Byte (TTFB)
    this.observeTTFB();
    
    // Long Tasks
    this.observeLongTasks();
  }

  // LCP 측정
  observeLCP() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.recordMetric('LCP', lastEntry.startTime);
        reportPerformance('LCP', lastEntry.startTime, {
          element: lastEntry.element?.tagName,
          url: lastEntry.url
        });
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('LCP', observer);
    } catch (e) {
      console.warn('LCP observer failed:', e);
    }
  }

  // FID 측정
  observeFID() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.recordMetric('FID', entry.processingStart - entry.startTime);
          reportPerformance('FID', entry.processingStart - entry.startTime, {
            name: entry.name,
            target: entry.target?.tagName
          });
        });
      });
      
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.set('FID', observer);
    } catch (e) {
      console.warn('FID observer failed:', e);
    }
  }

  // CLS 측정
  observeCLS() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        
        this.recordMetric('CLS', clsValue);
        reportPerformance('CLS', clsValue);
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('CLS', observer);
    } catch (e) {
      console.warn('CLS observer failed:', e);
    }
  }

  // FCP 측정
  observeFCP() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            this.recordMetric('FCP', entry.startTime);
            reportPerformance('FCP', entry.startTime);
          }
        });
      });
      
      observer.observe({ entryTypes: ['paint'] });
      this.observers.set('FCP', observer);
    } catch (e) {
      console.warn('FCP observer failed:', e);
    }
  }

  // TTFB 측정
  observeTTFB() {
    if (!this.isSupported) return;
    
    try {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        const ttfb = navigation.responseStart - navigation.requestStart;
        this.recordMetric('TTFB', ttfb);
        reportPerformance('TTFB', ttfb);
      }
    } catch (e) {
      console.warn('TTFB measurement failed:', e);
    }
  }

  // Long Tasks 측정
  observeLongTasks() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.recordMetric('LongTask', entry.duration);
          reportPerformance('LongTask', entry.duration, {
            name: entry.name,
            startTime: entry.startTime
          });
        });
      });
      
      observer.observe({ entryTypes: ['longtask'] });
      this.observers.set('LongTask', observer);
    } catch (e) {
      console.warn('Long task observer failed:', e);
    }
  }

  // 커스텀 타이밍 측정 시작
  startTiming(name) {
    if (!this.isSupported) return;
    
    const startTime = performance.now();
    this.metrics.set(`${name}_start`, startTime);
    performance.mark(`${name}_start`);
    
    return startTime;
  }

  // 커스텀 타이밍 측정 종료
  endTiming(name) {
    if (!this.isSupported) return;
    
    const endTime = performance.now();
    const startTime = this.metrics.get(`${name}_start`);
    
    if (startTime) {
      const duration = endTime - startTime;
      this.recordMetric(name, duration);
      reportPerformance(name, duration);
      
      performance.mark(`${name}_end`);
      performance.measure(name, `${name}_start`, `${name}_end`);
      
      return duration;
    }
    
    return null;
  }

  // 메트릭 기록
  recordMetric(name, value) {
    this.metrics.set(name, value);
    
    if (import.meta.env.DEV) {
      console.log(`⚡ Performance Metric - ${name}:`, `${value.toFixed(2)}ms`);
    }
  }

  // 리소스 로딩 성능 측정
  measureResourceTiming() {
    if (!this.isSupported) return;
    
    const resources = performance.getEntriesByType('resource');
    const resourceStats = {
      scripts: [],
      stylesheets: [],
      images: [],
      other: []
    };
    
    resources.forEach(resource => {
      const duration = resource.responseEnd - resource.startTime;
      const size = resource.transferSize || 0;
      
      const resourceInfo = {
        name: resource.name,
        duration: duration,
        size: size,
        type: resource.initiatorType
      };
      
      // 리소스 타입별 분류
      if (resource.name.includes('.js')) {
        resourceStats.scripts.push(resourceInfo);
      } else if (resource.name.includes('.css')) {
        resourceStats.stylesheets.push(resourceInfo);
      } else if (resource.name.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) {
        resourceStats.images.push(resourceInfo);
      } else {
        resourceStats.other.push(resourceInfo);
      }
    });
    
    // 가장 느린 리소스들 로깅
    const slowResources = resources
      .filter(r => (r.responseEnd - r.startTime) > 1000)
      .sort((a, b) => (b.responseEnd - b.startTime) - (a.responseEnd - a.startTime));
    
    if (slowResources.length > 0) {
      reportPerformance('SlowResources', slowResources.length, {
        slowest: slowResources[0].name,
        duration: slowResources[0].responseEnd - slowResources[0].startTime
      });
    }
    
    return resourceStats;
  }

  // 메모리 사용량 측정
  measureMemoryUsage() {
    if (!('memory' in performance)) return null;
    
    const memory = performance.memory;
    const memoryInfo = {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit
    };
    
    reportPerformance('MemoryUsage', memoryInfo.used, {
      total: memoryInfo.total,
      limit: memoryInfo.limit,
      percentage: (memoryInfo.used / memoryInfo.total * 100).toFixed(2)
    });
    
    return memoryInfo;
  }

  // 네트워크 정보 측정
  measureNetworkInfo() {
    if (!('connection' in navigator)) return null;
    
    const connection = navigator.connection;
    const networkInfo = {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
    
    reportPerformance('NetworkInfo', connection.downlink, networkInfo);
    
    return networkInfo;
  }

  // 모든 메트릭 가져오기
  getAllMetrics() {
    return Object.fromEntries(this.metrics);
  }

  // 성능 요약 리포트
  getPerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: this.getAllMetrics(),
      resources: this.measureResourceTiming(),
      memory: this.measureMemoryUsage(),
      network: this.measureNetworkInfo()
    };
    
    return report;
  }

  // 정리 함수 - 메모리 누수 방지
  cleanup() {
    // 모든 옵저버 정리
    this.observers.forEach((observer, key) => {
      try {
        observer.disconnect();
        if (import.meta.env.DEV) {
          console.log(`🧹 Performance observer cleaned up: ${key}`);
        }
      } catch (e) {
        console.warn(`Failed to cleanup observer ${key}:`, e);
      }
    });
    
    this.observers.clear();
    this.metrics.clear();
    
    if (import.meta.env.DEV) {
      console.log('🧹 Performance monitor cleaned up');
    }
  }

  // 페이지 언로드 시 정리
  setupCleanup() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });
    }
  }
}

// 싱글톤 인스턴스 생성
const performanceMonitor = new PerformanceMonitor();

// 페이지 로드 완료 후 초기 측정
window.addEventListener('load', () => {
  setTimeout(() => {
    performanceMonitor.measureResourceTiming();
    performanceMonitor.measureMemoryUsage();
    performanceMonitor.measureNetworkInfo();
    
    // 전체 성능 리포트 생성
    if (import.meta.env.DEV) {
      console.group('📊 Performance Report');
      console.log(performanceMonitor.getPerformanceReport());
      console.groupEnd();
    }
  }, 1000);
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
  performanceMonitor.cleanup();
});

export { performanceMonitor };
export default performanceMonitor;