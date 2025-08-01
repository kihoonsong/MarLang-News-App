import adLogger from './AdLogger';

// 광고 로딩 상태 관리
export const AdLoadingStates = {
  IDLE: 'idle',
  LOADING: 'loading',
  LOADED: 'loaded',
  SUCCESS: 'success',
  ERROR: 'error',
  TIMEOUT: 'timeout',
  FALLBACK: 'fallback'
};

// 실제 광고 로딩을 수행하는 매니저 클래스
class AdLoadingManager {
  constructor(options = {}) {
    this.adUnitId = options.adUnitId;
    this.maxRetries = options.maxRetries || 3;
    this.loadTimeout = options.loadTimeout || 10000;
    this.width = options.width || 320;
    this.height = options.height || 100;
    this.debug = options.debug || false;
    
    // 콜백 함수들
    this.onStateChange = options.onStateChange || (() => {});
    this.onError = options.onError || (() => {});
    this.onSuccess = options.onSuccess || (() => {});
    
    // 상태 관리
    this.currentState = AdLoadingStates.IDLE;
    this.retryCount = 0;
    this.loadStartTime = null;
    this.timeoutId = null;
    this.isDestroyed = false;
  }

  // 상태 변경
  setState(newState) {
    if (this.isDestroyed) return;
    
    const oldState = this.currentState;
    this.currentState = newState;
    
    if (this.debug) {
      adLogger.log(`상태 변경: ${oldState} -> ${newState}`, { adUnitId: this.adUnitId });
    }
    
    this.onStateChange({ 
      oldState, 
      newState, 
      retryCount: this.retryCount,
      adUnitId: this.adUnitId 
    });
  }

  // 카카오 애드핏 스크립트 로드
  async loadAdFitScript() {
    return new Promise((resolve, reject) => {
      // 이미 로드된 스크립트가 있는지 확인
      const existingScript = document.querySelector('script[src*="kas/static/ba.min.js"]');
      if (existingScript) {
        // 스크립트가 완전히 로드되었는지 확인
        if (window.adfit || document.querySelector('.kakao_ad_area')) {
          resolve();
          return;
        }
      }

      const script = document.createElement('script');
      script.src = '//t1.daumcdn.net/kas/static/ba.min.js';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        // 스크립트 로드 후 초기화 대기
        setTimeout(() => {
          resolve();
        }, 100);
      };
      
      script.onerror = () => {
        reject(new Error('AdFit 스크립트 로드 실패'));
      };
      
      document.head.appendChild(script);
    });
  }

  // 광고 컨테이너 생성
  createAdContainer(parentElement) {
    if (!parentElement) {
      throw new Error('부모 엘리먼트가 필요합니다');
    }

    // 기존 광고 컨테이너 제거
    const existingAd = parentElement.querySelector('.kakao_ad_area');
    if (existingAd) {
      existingAd.remove();
    }

    // 새 광고 컨테이너 생성
    const adContainer = document.createElement('ins');
    adContainer.className = 'kakao_ad_area';
    adContainer.style.display = 'none';
    adContainer.setAttribute('data-ad-unit', this.adUnitId);
    adContainer.setAttribute('data-ad-width', this.width.toString());
    adContainer.setAttribute('data-ad-height', this.height.toString());
    
    parentElement.appendChild(adContainer);
    
    if (this.debug) {
      adLogger.log('광고 컨테이너 생성됨', { 
        adUnitId: this.adUnitId,
        width: this.width,
        height: this.height 
      });
    }
    
    return adContainer;
  }

  // 광고 로딩 실행
  async loadAd(parentElement) {
    if (this.isDestroyed) return false;
    
    try {
      this.loadStartTime = Date.now();
      this.setState(AdLoadingStates.LOADING);
      
      // 타임아웃 설정
      this.timeoutId = setTimeout(() => {
        if (!this.isDestroyed) {
          this.setState(AdLoadingStates.TIMEOUT);
          this.handleError(new Error('광고 로딩 타임아웃'));
        }
      }, this.loadTimeout);

      // 1. 스크립트 로드
      await this.loadAdFitScript();
      
      // 2. 광고 컨테이너 생성
      const adContainer = this.createAdContainer(parentElement);
      
      // 3. 광고 초기화 대기
      await this.waitForAdInitialization();
      
      // 4. 광고 표시
      adContainer.style.display = 'block';
      
      // 5. 성공 처리
      const loadTime = Date.now() - this.loadStartTime;
      this.setState(AdLoadingStates.SUCCESS);
      
      this.onSuccess({ 
        loadTime, 
        retryCount: this.retryCount,
        adUnitId: this.adUnitId 
      });
      
      if (this.debug) {
        adLogger.log('광고 로딩 성공', { 
          adUnitId: this.adUnitId,
          loadTime,
          retryCount: this.retryCount 
        });
      }
      
      return true;
      
    } catch (error) {
      this.handleError(error);
      return false;
    } finally {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
    }
  }

  // 광고 초기화 대기
  async waitForAdInitialization() {
    return new Promise((resolve) => {
      const maxAttempts = 30; // 3초 최대 대기
      let attempts = 0;
      
      const checkInitialization = () => {
        attempts++;
        
        // 카카오 애드핏이 초기화되었는지 확인
        if (window.adfit || window.kakaoAdFit) {
          resolve();
          return;
        }
        
        if (attempts >= maxAttempts) {
          // 타임아웃이어도 resolve (광고가 안 나와도 페이지는 동작해야 함)
          resolve();
          return;
        }
        
        setTimeout(checkInitialization, 100);
      };
      
      checkInitialization();
    });
  }

  // 에러 처리
  handleError(error) {
    if (this.isDestroyed) return;
    
    this.retryCount++;
    
    if (this.debug) {
      adLogger.error('광고 로딩 에러', { 
        error: error.message,
        adUnitId: this.adUnitId,
        retryCount: this.retryCount,
        maxRetries: this.maxRetries 
      });
    }
    
    this.onError({ 
      error, 
      retryCount: this.retryCount,
      adUnitId: this.adUnitId 
    });
    
    if (this.retryCount >= this.maxRetries) {
      this.setState(AdLoadingStates.FALLBACK);
    } else {
      this.setState(AdLoadingStates.ERROR);
    }
  }

  // 재시도
  async retry(parentElement) {
    if (this.isDestroyed || this.retryCount >= this.maxRetries) {
      return false;
    }
    
    // 잠시 대기 후 재시도
    await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount));
    
    return this.loadAd(parentElement);
  }

  // 정리
  cleanup() {
    this.isDestroyed = true;
    
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    if (this.debug) {
      adLogger.log('AdLoadingManager 정리됨', { adUnitId: this.adUnitId });
    }
  }
}

export default AdLoadingManager;