/**
 * ScriptLoader - 카카오 애드핏 스크립트 로딩 유틸리티
 * 중복 로드 방지, 상태 추적, 에러 핸들링 기능 포함
 */

// 스크립트 로드 상태
const ScriptLoadStates = {
  NOT_LOADED: 'not_loaded',
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error'
};

class ScriptLoader {
  constructor() {
    this.scriptState = ScriptLoadStates.NOT_LOADED;
    this.loadPromise = null;
    this.loadError = null;
    this.debug = false;
  }

  /**
   * 카카오 애드핏 스크립트 로드
   * @param {boolean} force - 강제 재로드 여부
   * @returns {Promise<boolean>} - 로드 성공 여부
   */
  async loadKakaoAdFit(force = false) {
    // 이미 로드된 경우
    if (this.scriptState === ScriptLoadStates.LOADED && !force) {
      this.log('✅ 스크립트 이미 로드됨');
      return true;
    }

    // 현재 로딩 중인 경우
    if (this.scriptState === ScriptLoadStates.LOADING && this.loadPromise) {
      this.log('⏳ 스크립트 로딩 중 - 기존 Promise 반환');
      return await this.loadPromise;
    }

    // 새로운 로드 시작
    this.scriptState = ScriptLoadStates.LOADING;
    this.loadPromise = this.performScriptLoad(force);

    try {
      const result = await this.loadPromise;
      this.scriptState = result ? ScriptLoadStates.LOADED : ScriptLoadStates.ERROR;
      return result;
    } catch (error) {
      this.scriptState = ScriptLoadStates.ERROR;
      this.loadError = error;
      throw error;
    }
  }

  /**
   * 실제 스크립트 로드 수행
   * @param {boolean} force 
   * @returns {Promise<boolean>}
   */
  async performScriptLoad(force) {
    return new Promise((resolve, reject) => {
      try {
        // 기존 스크립트 확인
        const existingScript = this.findExistingScript();
        
        if (existingScript && !force) {
          // 기존 스크립트가 정상적으로 로드되었는지 확인
          if (this.validateScriptLoad()) {
            this.log('✅ 기존 스크립트 유효함');
            resolve(true);
            return;
          }
        }

        // 강제 재로드 또는 기존 스크립트가 유효하지 않은 경우
        if (existingScript && force) {
          this.removeExistingScript(existingScript);
        }

        // 새 스크립트 생성 및 로드
        this.createAndLoadScript()
          .then(resolve)
          .catch(reject);

      } catch (error) {
        this.log('❌ 스크립트 로드 중 예외 발생', { error: error.message });
        reject(error);
      }
    });
  }

  /**
   * 기존 스크립트 찾기
   * @returns {HTMLScriptElement|null}
   */
  findExistingScript() {
    const scripts = [
      document.querySelector('script[src*="kas/static/ba.min.js"]'),
      document.querySelector('script[src*="t1.daumcdn.net/kas"]'),
      document.querySelector('script[data-kakao-adfit="true"]')
    ];

    return scripts.find(script => script !== null) || null;
  }

  /**
   * 스크립트 로드 유효성 검사
   * @returns {boolean}
   */
  validateScriptLoad() {
    try {
      // 1. DOM에서 스크립트 태그 확인
      const scriptExists = this.findExistingScript() !== null;
      
      // 2. 전역 객체 확인 (카카오 애드핏 관련)
      const globalObjectExists = typeof window !== 'undefined' && 
        (window.adsbygoogle || window.kakaoAd || document.querySelector('.kakao_ad_area'));

      // 3. 스크립트 실행 상태 확인
      const scriptExecuted = document.readyState === 'complete' || 
        document.readyState === 'interactive';

      this.log('🔍 스크립트 유효성 검사', {
        scriptExists,
        globalObjectExists,
        scriptExecuted
      });

      return scriptExists && scriptExecuted;
    } catch (error) {
      this.log('❌ 스크립트 유효성 검사 실패', { error: error.message });
      return false;
    }
  }

  /**
   * 기존 스크립트 제거
   * @param {HTMLScriptElement} script 
   */
  removeExistingScript(script) {
    try {
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
        this.log('🗑️ 기존 스크립트 제거됨');
      }
    } catch (error) {
      this.log('⚠️ 스크립트 제거 실패', { error: error.message });
    }
  }

  /**
   * 새 스크립트 생성 및 로드
   * @returns {Promise<boolean>}
   */
  createAndLoadScript() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      
      // 스크립트 속성 설정
      script.type = 'text/javascript';
      script.src = '//t1.daumcdn.net/kas/static/ba.min.js';
      script.async = true;
      script.setAttribute('data-kakao-adfit', 'true');
      script.setAttribute('data-load-time', Date.now().toString());

      // 로드 성공 핸들러
      script.onload = () => {
        this.log('✅ 카카오 애드핏 스크립트 로드 성공');
        
        // 추가 검증
        setTimeout(() => {
          if (this.validateScriptLoad()) {
            resolve(true);
          } else {
            this.log('⚠️ 스크립트 로드됐지만 유효성 검사 실패');
            resolve(false);
          }
        }, 100);
      };

      // 로드 실패 핸들러
      script.onerror = (event) => {
        const error = new Error(`Script load failed: ${event.message || 'Unknown error'}`);
        this.log('❌ 스크립트 로드 실패', { 
          error: error.message,
          src: script.src 
        });
        reject(error);
      };

      // 타임아웃 설정 (10초)
      const timeout = setTimeout(() => {
        this.log('⏰ 스크립트 로드 타임아웃');
        reject(new Error('Script load timeout'));
      }, 10000);

      // 성공/실패 시 타임아웃 해제
      const originalOnload = script.onload;
      const originalOnerror = script.onerror;

      script.onload = (event) => {
        clearTimeout(timeout);
        originalOnload(event);
      };

      script.onerror = (event) => {
        clearTimeout(timeout);
        originalOnerror(event);
      };

      // DOM에 추가
      try {
        document.head.appendChild(script);
        this.log('📜 새 스크립트 추가됨', { src: script.src });
      } catch (error) {
        clearTimeout(timeout);
        this.log('❌ 스크립트 DOM 추가 실패', { error: error.message });
        reject(error);
      }
    });
  }

  /**
   * 스크립트 로드 상태 확인
   * @returns {boolean}
   */
  isScriptLoaded() {
    return this.scriptState === ScriptLoadStates.LOADED && this.validateScriptLoad();
  }

  /**
   * 스크립트 로딩 중인지 확인
   * @returns {boolean}
   */
  isLoading() {
    return this.scriptState === ScriptLoadStates.LOADING;
  }

  /**
   * 스크립트 로드 에러 확인
   * @returns {boolean}
   */
  hasError() {
    return this.scriptState === ScriptLoadStates.ERROR;
  }

  /**
   * 마지막 에러 반환
   * @returns {Error|null}
   */
  getLastError() {
    return this.loadError;
  }

  /**
   * 상태 초기화
   */
  reset() {
    this.scriptState = ScriptLoadStates.NOT_LOADED;
    this.loadPromise = null;
    this.loadError = null;
    this.log('🔄 ScriptLoader 상태 초기화');
  }

  /**
   * 디버그 모드 설정
   * @param {boolean} enabled 
   */
  setDebug(enabled) {
    this.debug = enabled;
  }

  /**
   * 현재 상태 반환
   * @returns {object}
   */
  getState() {
    return {
      scriptState: this.scriptState,
      isLoaded: this.isScriptLoaded(),
      isLoading: this.isLoading(),
      hasError: this.hasError(),
      lastError: this.loadError?.message || null,
      scriptExists: this.findExistingScript() !== null
    };
  }

  /**
   * 로그 출력
   * @param {string} message 
   * @param {object} data 
   */
  log(message, data = {}) {
    if (this.debug) {
      console.log(`[ScriptLoader] ${message}`, data);
    }
  }

  /**
   * 정리 작업
   */
  cleanup() {
    if (this.loadPromise) {
      this.loadPromise = null;
    }
    this.log('🧹 ScriptLoader 정리 완료');
  }
}

// 싱글톤 인스턴스
const scriptLoader = new ScriptLoader();

// 정적 메서드들
ScriptLoader.loadKakaoAdFit = (force = false) => scriptLoader.loadKakaoAdFit(force);
ScriptLoader.isScriptLoaded = () => scriptLoader.isScriptLoaded();
ScriptLoader.isLoading = () => scriptLoader.isLoading();
ScriptLoader.hasError = () => scriptLoader.hasError();
ScriptLoader.getLastError = () => scriptLoader.getLastError();
ScriptLoader.reset = () => scriptLoader.reset();
ScriptLoader.setDebug = (enabled) => scriptLoader.setDebug(enabled);
ScriptLoader.getState = () => scriptLoader.getState();
ScriptLoader.cleanup = () => scriptLoader.cleanup();

export default ScriptLoader;
export { ScriptLoadStates };