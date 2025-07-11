// 음성 합성 관련 유틸리티 함수들

// TTS 지원 여부 확인
export const isSpeechSynthesisSupported = () => {
  return 'speechSynthesis' in window;
};

// 모바일 및 플랫폼 감지
const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

// 음성 목록 캐시 및 리스너 관리
let _cachedVoices = null;
let _voicesListeners = new Set();

// 음성 목록 변경 이벤트 리스너 추가
export const addVoicesChangedListener = (callback) => {
  _voicesListeners.add(callback);
  
  // 리스너 제거 함수 반환
  return () => {
    _voicesListeners.delete(callback);
  };
};

// 음성 목록 변경 알림
const notifyVoicesChanged = (voices) => {
  _cachedVoices = voices;
  _voicesListeners.forEach(callback => {
    try {
      callback(voices);
    } catch (error) {
      console.error('음성 변경 콜백 오류:', error);
    }
  });
};

// 사용 가능한 음성 목록 가져오기 (개선된 이벤트 처리)
export const getAvailableVoices = () => {
  if (!isSpeechSynthesisSupported()) {
    console.warn('⚠️ Speech Synthesis가 지원되지 않습니다');
    return Promise.resolve([]);
  }
  
  return new Promise((resolve) => {
    let voices = speechSynthesis.getVoices();
    
    if (voices.length > 0) {
      console.log('✅ 음성 목록 즉시 로드됨:', voices.length, '개');
      notifyVoicesChanged(voices);
      resolve(voices);
      return;
    }
    
    // 모바일 환경에서는 더 많은 재시도와 긴 간격 필요
    let attempts = 0;
    const maxAttempts = isMobile ? 40 : 20;
    const retryInterval = isMobile ? 300 : 150;
    
    const checkVoices = () => {
      voices = speechSynthesis.getVoices();
      console.log(`🔄 음성 로딩 시도 ${attempts + 1}/${maxAttempts}, 발견된 음성: ${voices.length}개`);
      
      if (voices.length > 0) {
        console.log('✅ 음성 목록 로드 완료:', voices.length, '개');
        notifyVoicesChanged(voices);
        resolve(voices);
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(checkVoices, retryInterval);
      } else {
        console.warn('⚠️ 음성 로딩 실패: 최대 재시도 횟수 초과');
        resolve([]);
      }
    };
    
    // onvoiceschanged 이벤트 등록 (영구 리스너)
    if (!speechSynthesis.onvoiceschanged) {
      speechSynthesis.onvoiceschanged = () => {
        const newVoices = speechSynthesis.getVoices();
        if (newVoices.length > 0) {
          console.log('🔄 음성 목록 업데이트됨:', newVoices.length, '개');
          notifyVoicesChanged(newVoices);
        }
      };
    }
    
    // 즉시 체크 수행
    const initialDelay = isMobile ? 500 : 200;
    setTimeout(checkVoices, initialDelay);
  });
};

// 캐시된 음성 목록 가져오기
export const getCachedVoices = () => {
  return _cachedVoices || [];
};

// 영어 발음에 적합한 음성 찾기 (사용자 설정 우선 적용)
export const getEnglishVoice = () => {
  try {
    // 매번 실시간으로 음성 목록 조회 (시스템 변경 즉시 반영)
    const voices = window.speechSynthesis.getVoices();
    
    if (!voices || voices.length === 0) {
      console.warn('⚠️ 사용 가능한 음성이 없습니다');
      return null;
    }
    
    // 사용자 설정 확인
    const userSettings = getUserTTSSettings();
    console.log('🔍 사용자 TTS 설정:', userSettings);
    console.log('🎵 사용 가능한 음성 목록:', voices.map(v => `${v.name} (${v.lang}) [default: ${v.default}]`));
    
    // 1단계: 사용자가 설정한 음성 찾기 (최우선)
    if (userSettings.preferredTTSVoice) {
      const preferredVoice = voices.find(v => v.name === userSettings.preferredTTSVoice);
      if (preferredVoice) {
        console.log('✅ 사용자 설정 음성 발견:', preferredVoice.name, preferredVoice.lang);
        return preferredVoice;
      } else {
        console.warn('⚠️ 사용자 설정 음성을 찾을 수 없음:', userSettings.preferredTTSVoice);
      }
    }
    
    // 2단계: 시스템 기본값이면서 미국 영어인 음성 찾기
    const defaultUSVoice = voices.find(v => 
      v.default === true && v.lang.startsWith('en-US')
    );
    if (defaultUSVoice) {
      console.log('✅ 시스템 기본 미국 음성 발견:', defaultUSVoice.name, defaultUSVoice.lang);
      return defaultUSVoice;
    }
    
    // 3단계: 미국 영어 음성 찾기 (기본값 아니어도 됨)
    const usVoice = voices.find(v => v.lang.startsWith('en-US'));
    if (usVoice) {
      console.log('✅ 미국 영어 음성 발견:', usVoice.name, usVoice.lang);
      return usVoice;
    }
    
    // 4단계: 다른 영어 음성 찾기 (우선순위 순서)
    const preferredVoices = ['en-GB', 'en-AU', 'en-CA', 'en'];
    for (const langCode of preferredVoices) {
      const voice = voices.find(v => v.lang.startsWith(langCode));
      if (voice) {
        console.log('✅ 대체 영어 음성 발견:', voice.name, voice.lang);
        return voice;
      }
    }
    
    // 5단계: 어떤 영어 음성이든 찾기
    const anyEnglishVoice = voices.find(v => v.lang.toLowerCase().includes('en'));
    if (anyEnglishVoice) {
      console.log('✅ 일반 영어 음성 발견:', anyEnglishVoice.name, anyEnglishVoice.lang);
      return anyEnglishVoice;
    }
    
    // 6단계: 기본 음성 사용
    const defaultVoice = voices[0];
    console.log('⚠️ 기본 음성 사용:', defaultVoice ? defaultVoice.name : 'none');
    return defaultVoice || null;
    
  } catch (error) {
    console.error('❌ getEnglishVoice 오류:', error);
    return null;
  }
};

// 사용자 설정 가져오기 함수
const getUserTTSSettings = () => {
  try {
    // localStorage에서 사용자 설정 가져오기
    const authData = localStorage.getItem('haru_auth_data');
    if (authData) {
      const parsedAuth = JSON.parse(authData);
      if (parsedAuth.user?.uid) {
        const userSettingsKey = `haru_${parsedAuth.user.uid}_settings`;
        const userSettings = localStorage.getItem(userSettingsKey);
        if (userSettings) {
          const settings = JSON.parse(userSettings);
          return {
            ttsSpeed: settings.ttsSpeed || 0.8,
            preferredTTSVoice: settings.preferredTTSVoice || null
          };
        }
      }
    }
    // 게스트 사용자 설정 확인
    const guestSettings = localStorage.getItem('haru_guest_settings');
    if (guestSettings) {
      const settings = JSON.parse(guestSettings);
      return {
        ttsSpeed: settings.ttsSpeed || 0.8,
        preferredTTSVoice: settings.preferredTTSVoice || null
      };
    }
    return { ttsSpeed: 0.8, preferredTTSVoice: null };
  } catch (error) {
    console.warn('Failed to get user TTS settings:', error);
    return { ttsSpeed: 0.8, preferredTTSVoice: null };
  }
};

// 텍스트 읽기 함수
export const speakText = async (text, options = {}) => {
  if (!isSpeechSynthesisSupported()) {
    console.warn('Speech Synthesis not supported in this browser');
    return false;
  }

  // 오프라인 상태에서도 로컬 TTS 허용 - 오프라인 차단 로직 제거
  // Web Speech API의 로컬 음성 엔진은 오프라인에서도 동작 가능

  // 기존 음성 중단
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // 사용자 설정에서 TTS 속도 가져오기
  const userTTSSettings = getUserTTSSettings();
  
  // 기본 설정
  const settings = {
    rate: userTTSSettings.ttsSpeed,
    pitch: 1.0,
    volume: 1.0,
    ...options
  };

  utterance.rate = settings.rate;
  utterance.pitch = settings.pitch;
  utterance.volume = settings.volume;

  // 영어 음성 설정 (실시간 조회)
  try {
    const englishVoice = getEnglishVoice();
    if (englishVoice) {
      utterance.voice = englishVoice;
      utterance.lang = englishVoice.lang;
    } else {
      utterance.lang = 'en-US'; // 기본값
    }
  } catch (error) {
    console.warn('Failed to get English voice:', error);
    utterance.lang = 'en-US';
  }

  return new Promise((resolve) => {
    utterance.onend = () => resolve(true);
    utterance.onerror = (error) => {
      console.error('Speech synthesis error:', error);
      resolve(false);
    };

    speechSynthesis.speak(utterance);
  });
};

// 단어 발음 함수 (단어장용)
export const speakWord = async (word, options = {}) => {
  const userTTSSettings = getUserTTSSettings();
  const wordSettings = {
    rate: userTTSSettings.ttsSpeed,
    pitch: 1.0,
    volume: 1.0,
    ...options
  };

  return await speakText(word, wordSettings);
};

// 문장 발음 함수 (예문용)
export const speakSentence = async (sentence, options = {}) => {
  const userTTSSettings = getUserTTSSettings();
  const sentenceSettings = {
    rate: userTTSSettings.ttsSpeed,
    pitch: 1.0,
    volume: 1.0,
    ...options
  };

  return await speakText(sentence, sentenceSettings);
};

// 음성 설정 저장/로드
export const saveVoiceSettings = (settings) => {
  try {
    localStorage.setItem('marlang_voice_settings', JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save voice settings:', error);
  }
};

export const loadVoiceSettings = () => {
  try {
    const saved = localStorage.getItem('marlang_voice_settings');
    return saved ? JSON.parse(saved) : {
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      autoPlay: false
    };
  } catch (error) {
    console.error('Failed to load voice settings:', error);
    return {
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      autoPlay: false
    };
  }
};

// 음성 상태 관리
let _currentUtterance = null;
let isPlaying = false;
let globalTTSController = null;

export const getCurrentPlayingStatus = () => isPlaying;

export const stopCurrentSpeech = () => {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
    isPlaying = false;
  }
  
  // 전역 컨트롤러가 있으면 중지
  if (globalTTSController) {
    globalTTSController.stop();
    globalTTSController = null;
  }
};

// TTS 컨트롤러 클래스 (모바일 환경 개선)
class TTSController {
  constructor() {
    this.isActive = true;
    this.currentUtterance = null;
    this.isMobile = isMobile;
    this.isIOS = isIOS;
  }
  
  stop() {
    this.isActive = false;
    if (this.currentUtterance) {
      speechSynthesis.cancel();
      this.currentUtterance = null;
    }
    
    // 모바일에서는 추가적인 정리 작업 필요
    if (this.isMobile) {
      setTimeout(() => {
        speechSynthesis.cancel();
      }, 100);
    }
  }
  
  isRunning() {
    // 모바일에서는 speechSynthesis.speaking 상태도 확인
    if (this.isMobile) {
      return this.isActive && !speechSynthesis.paused;
    }
    return this.isActive;
  }
  
  // 모바일 환경에서 TTS 재개 함수
  resume() {
    if (this.isMobile && speechSynthesis.paused) {
      speechSynthesis.resume();
    }
  }
}

// 전역 함수로 노출 (App.jsx TTSManager에서 사용)
if (typeof window !== 'undefined') {
  window.stopCurrentSpeech = stopCurrentSpeech;
  window.createTTSController = () => {
    if (globalTTSController) {
      globalTTSController.stop();
    }
    globalTTSController = new TTSController();
    return globalTTSController;
  };
  
  // 모바일 환경 정보 노출
  window.isMobileTTS = isMobile;
  window.isIOSTTS = isIOS;
}

// 향상된 발음 함수 (상태 관리 포함)
export const speakWithStatus = async (text, options = {}) => {
  if (isPlaying) {
    stopCurrentSpeech();
    return false;
  }

  isPlaying = true;
  
  try {
    const result = await speakText(text, options);
    isPlaying = false;
    return result;
  } catch (error) {
    isPlaying = false;
    throw error;
  }
};

// iPhone TTS 테스트 함수 (디버깅용)
export const testTTSOnIPhone = () => {
  console.log('🧪 iPhone TTS 테스트 시작...');
  
  // 기본 정보 확인
  console.log('📱 User Agent:', navigator.userAgent);
  console.log('🔊 Speech Synthesis 지원:', 'speechSynthesis' in window);
  
  if (!window.speechSynthesis) {
    console.error('❌ speechSynthesis 미지원');
    return;
  }
  
  // 음성 목록 확인
  const voices = window.speechSynthesis.getVoices();
  console.log('🎵 총 음성 개수:', voices.length);
  
  if (voices.length === 0) {
    console.warn('⚠️ 음성 목록이 비어있음. voiceschanged 이벤트 대기 중...');
    window.speechSynthesis.onvoiceschanged = () => {
      const newVoices = window.speechSynthesis.getVoices();
      console.log('🔄 음성 목록 로드됨:', newVoices.length, '개');
      logVoiceDetails(newVoices);
    };
  } else {
    logVoiceDetails(voices);
  }
  
  // 간단한 TTS 테스트
  const utterance = new SpeechSynthesisUtterance('Hello iPhone TTS test');
  utterance.onstart = () => console.log('▶️ TTS 시작됨');
  utterance.onend = () => console.log('⏹️ TTS 종료됨');
  utterance.onerror = (e) => console.error('❌ TTS 오류:', e);
  
  window.speechSynthesis.speak(utterance);
};

// 음성 목록 상세 로그
const logVoiceDetails = (voices) => {
  voices.forEach((voice, index) => {
    console.log(`${index + 1}. ${voice.name} (${voice.lang}) [기본값: ${voice.default}]`);
  });
};

// 전역 노출 (개발자 도구에서 테스트용)
if (typeof window !== 'undefined') {
  window.testTTSOnIPhone = testTTSOnIPhone;
} 