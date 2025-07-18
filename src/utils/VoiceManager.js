/**
 * 통합 음성 관리자 - iOS/Android 모든 플랫폼 지원
 * 음성 로딩, 설정 저장/로드, 실시간 반영 통합 관리
 */

const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isAndroid = /Android/i.test(navigator.userAgent);

class VoiceManager {
  constructor() {
    this.voices = [];
    this.isLoaded = false;
    this.isLoading = false;
    this.listeners = new Set();
    this.loadTimeout = null;
    
    // 플랫폼 정보
    this.platform = this.detectPlatform();
    
    if (import.meta.env.DEV) {
      console.log('🎵 VoiceManager 초기화 - 플랫폼:', this.platform);
    }
    
    this.initializeVoices();
  }

  /**
   * 플랫폼 감지
   */
  detectPlatform() {
    if (isIOS) return 'iOS';
    if (isAndroid) return 'Android';
    if (isMobile) return 'Mobile';
    return 'Desktop';
  }

  /**
   * 음성 초기화 - 플랫폼별 최적화
   */
  async initializeVoices() {
    if (!window.speechSynthesis) {
      console.warn('⚠️ Speech Synthesis not supported');
      return;
    }

    this.isLoading = true;

    if (this.platform === 'iOS') {
      await this.loadVoicesForIOS();
    } else {
      await this.loadVoicesForOthers();
    }
  }

  /**
   * iOS 전용 음성 로딩 (voiceschanged 이벤트 대기)
   */
  async loadVoicesForIOS() {
    return new Promise((resolve) => {
      // 즉시 확인
      const immediateVoices = window.speechSynthesis.getVoices();
      if (immediateVoices.length > 0) {
        this.processVoices(immediateVoices);
        resolve();
        return;
      }

      // voiceschanged 이벤트 대기
      const handleVoicesChanged = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
          if (this.loadTimeout) {
            clearTimeout(this.loadTimeout);
          }
          this.processVoices(voices);
          resolve();
        }
      };

      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

      // 5초 타임아웃 (iOS에서 이벤트가 발생하지 않을 경우 대비)
      this.loadTimeout = setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        const fallbackVoices = window.speechSynthesis.getVoices();
        this.processVoices(fallbackVoices);
        if (import.meta.env.DEV) {
          console.warn('⏰ iOS 음성 로딩 타임아웃 - 폴백 사용');
        }
        resolve();
      }, 5000);
    });
  }

  /**
   * Android/Desktop 음성 로딩
   */
  async loadVoicesForOthers() {
    return new Promise((resolve) => {
      // 즉시 시도
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        this.processVoices(voices);
        resolve();
        return;
      }

      // voiceschanged 이벤트 대기 (폴백)
      const handleVoicesChanged = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
          this.processVoices(voices);
          resolve();
        }
      };

      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

      // 3초 타임아웃
      setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        const fallbackVoices = window.speechSynthesis.getVoices();
        this.processVoices(fallbackVoices);
        resolve();
      }, 3000);
    });
  }

  /**
   * 음성 목록 처리 및 필터링
   */
  processVoices(allVoices) {
    // 영어 음성만 필터링
    this.voices = allVoices.filter(voice => 
      voice.lang.toLowerCase().startsWith('en')
    );

    // 우선순위 정렬 (en-US > en-GB > en-AU > 기타)
    this.voices.sort((a, b) => {
      const getPriority = (lang) => {
        if (lang.startsWith('en-US')) return 1;
        if (lang.startsWith('en-GB')) return 2;
        if (lang.startsWith('en-AU')) return 3;
        if (lang.startsWith('en-CA')) return 4;
        return 5;
      };

      const priorityA = getPriority(a.lang);
      const priorityB = getPriority(b.lang);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // 같은 우선순위면 기본값 우선
      if (a.default !== b.default) {
        return b.default ? 1 : -1;
      }
      
      // 이름순 정렬
      return a.name.localeCompare(b.name);
    });

    this.isLoaded = true;
    this.isLoading = false;

    if (import.meta.env.DEV) {
      console.log(`✅ [${this.platform}] 음성 로딩 완료:`, this.voices.length, '개');
      console.log('🎵 영어 음성 목록:', this.voices.map(v => `${v.name} (${v.lang})`));
    }

    // 리스너들에게 알림
    this.notifyListeners();
  }

  /**
   * 음성 목록 변경 리스너 추가
   */
  addListener(callback) {
    this.listeners.add(callback);
    
    // 이미 로드된 경우 즉시 호출
    if (this.isLoaded) {
      callback(this.voices);
    }
    
    // 리스너 제거 함수 반환
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * 리스너들에게 알림
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.voices);
      } catch (error) {
        console.error('음성 리스너 콜백 오류:', error);
      }
    });
  }

  /**
   * 모든 영어 음성 반환
   */
  getVoices() {
    return this.voices;
  }

  /**
   * 로딩 상태 확인
   */
  isVoicesLoaded() {
    return this.isLoaded;
  }

  /**
   * 로딩 중 상태 확인
   */
  isVoicesLoading() {
    return this.isLoading;
  }

  /**
   * 특정 음성 찾기 (fuzzy matching 지원)
   */
  findVoice(voiceName) {
    if (!voiceName || !this.voices.length) {
      return null;
    }

    // 1단계: 정확한 이름 매칭
    let voice = this.voices.find(v => v.name === voiceName);
    if (voice) return voice;

    // 2단계: 부분 매칭 (iOS 음성 이름 변경 대응)
    voice = this.voices.find(v => 
      v.name.startsWith(voiceName) || voiceName.startsWith(v.name)
    );
    if (voice) return voice;

    // 3단계: 포함 관계 매칭
    voice = this.voices.find(v => 
      v.name.toLowerCase().includes(voiceName.toLowerCase()) ||
      voiceName.toLowerCase().includes(v.name.toLowerCase())
    );
    
    return voice || null;
  }

  /**
   * 최적의 영어 음성 선택
   */
  getBestEnglishVoice(preferredVoiceName = null) {
    if (!this.voices.length) {
      return null;
    }

    // 사용자 선호 음성이 있으면 찾기
    if (preferredVoiceName) {
      const preferredVoice = this.findVoice(preferredVoiceName);
      if (preferredVoice) {
        return preferredVoice;
      }
    }

    // 기본값이면서 미국 영어인 음성
    let voice = this.voices.find(v => v.default && v.lang.startsWith('en-US'));
    if (voice) return voice;

    // 미국 영어 음성
    voice = this.voices.find(v => v.lang.startsWith('en-US'));
    if (voice) return voice;

    // 첫 번째 영어 음성 (이미 우선순위 정렬됨)
    return this.voices[0] || null;
  }

  /**
   * 플랫폼 정보 반환
   */
  getPlatform() {
    return this.platform;
  }

  /**
   * 정리 (메모리 누수 방지)
   */
  destroy() {
    if (this.loadTimeout) {
      clearTimeout(this.loadTimeout);
    }
    this.listeners.clear();
    this.voices = [];
    this.isLoaded = false;
    this.isLoading = false;
  }
}

// 싱글톤 인스턴스
let voiceManagerInstance = null;

/**
 * VoiceManager 싱글톤 인스턴스 반환
 */
export const getVoiceManager = () => {
  if (!voiceManagerInstance) {
    voiceManagerInstance = new VoiceManager();
  }
  return voiceManagerInstance;
};

/**
 * 편의 함수들
 */
export const getAvailableVoices = () => {
  return getVoiceManager().getVoices();
};

export const findVoiceByName = (voiceName) => {
  return getVoiceManager().findVoice(voiceName);
};

export const getBestEnglishVoice = (preferredVoiceName) => {
  return getVoiceManager().getBestEnglishVoice(preferredVoiceName);
};

export const addVoiceChangeListener = (callback) => {
  return getVoiceManager().addListener(callback);
};

export default VoiceManager;