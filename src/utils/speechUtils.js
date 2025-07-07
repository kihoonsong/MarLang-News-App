// 음성 합성 관련 유틸리티 함수들

// TTS 지원 여부 확인
export const isSpeechSynthesisSupported = () => {
  return 'speechSynthesis' in window;
};

// 모바일 및 플랫폼 감지
const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

// 사용 가능한 음성 목록 가져오기 (안정성 개선)
export const getAvailableVoices = () => {
  if (!isSpeechSynthesisSupported()) {
    console.warn('⚠️ Speech Synthesis가 지원되지 않습니다');
    return Promise.resolve([]);
  }
  
  return new Promise((resolve) => {
    let voices = speechSynthesis.getVoices();
    
    if (voices.length > 0) {
      console.log('✅ 음성 목록 즉시 로드됨:', voices.length, '개');
      resolve(voices);
      return;
    }
    
    // 모바일 환경에서는 더 많은 재시도와 긴 간격 필요
    let attempts = 0;
    const maxAttempts = isMobile ? 40 : 20; // 모바일에서 재시도 횟수 증가
    const retryInterval = isMobile ? 300 : 150; // 모바일에서 재시도 간격 증가
    
    const checkVoices = () => {
      voices = speechSynthesis.getVoices();
      console.log(`🔄 음성 로딩 시도 ${attempts + 1}/${maxAttempts}, 발견된 음성: ${voices.length}개`);
      
      if (voices.length > 0) {
        console.log('✅ 음성 목록 로드 완료:', voices.length, '개');
        // onvoiceschanged 이벤트 리스너 제거
        speechSynthesis.onvoiceschanged = null;
        resolve(voices);
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(checkVoices, retryInterval);
      } else {
        // 최대 재시도 후에도 음성이 없으면 빈 배열 반환
        console.warn('⚠️ 음성 로딩 실패: 최대 재시도 횟수 초과');
        speechSynthesis.onvoiceschanged = null;
        resolve([]);
      }
    };
    
    // onvoiceschanged 이벤트 등록 (모바일 환경 고려)
    speechSynthesis.onvoiceschanged = checkVoices;
    
    // 즉시 체크 수행 (모바일에서 더 긴 대기 시간)
    const initialDelay = isMobile ? 500 : 200;
    setTimeout(checkVoices, initialDelay);
  });
};

// 영어 발음에 적합한 음성 찾기 (안정성 개선)
export const getEnglishVoice = async () => {
  try {
    const voices = await getAvailableVoices();
    
    if (!voices || voices.length === 0) {
      console.warn('⚠️ 사용 가능한 음성이 없습니다');
      return null;
    }
    
    // 우선순위: 미국 영어 -> 영국 영어 -> 기타 영어 -> 기본값
    const preferredVoices = [
      'en-US',
      'en-GB', 
      'en-AU',
      'en-CA',
      'en'
    ];
    
    // 1단계: 선호 언어와 성별 조건 모두 만족하는 음성 찾기
    for (const langCode of preferredVoices) {
      const voice = voices.find(v => 
        v.lang.startsWith(langCode) && 
        (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('male'))
      );
      if (voice) {
        console.log('✅ 선호 음성 발견:', voice.name, voice.lang);
        return voice;
      }
    }
    
    // 2단계: 선호 언어만 만족하는 음성 찾기
    for (const langCode of preferredVoices) {
      const voice = voices.find(v => v.lang.startsWith(langCode));
      if (voice) {
        console.log('✅ 대체 음성 발견:', voice.name, voice.lang);
        return voice;
      }
    }
    
    // 3단계: 어떤 영어 음성이든 찾기
    const anyEnglishVoice = voices.find(v => v.lang.toLowerCase().includes('en'));
    if (anyEnglishVoice) {
      console.log('✅ 일반 영어 음성 발견:', anyEnglishVoice.name, anyEnglishVoice.lang);
      return anyEnglishVoice;
    }
    
    // 4단계: 기본 음성 사용
    const defaultVoice = voices[0];
    console.log('⚠️ 기본 음성 사용:', defaultVoice ? defaultVoice.name : 'none');
    return defaultVoice || null;
    
  } catch (error) {
    console.error('❌ getEnglishVoice 오류:', error);
    return null;
  }
};

// 텍스트 읽기 함수
export const speakText = async (text, options = {}) => {
  if (!isSpeechSynthesisSupported()) {
    console.warn('Speech Synthesis not supported in this browser');
    return false;
  }

  // 오프라인 상태 체크 (App.jsx TTSManager에서 제공)
  if (typeof window.checkTTSAvailability === 'function') {
    if (!window.checkTTSAvailability()) {
      return false; // 오프라인 시 TTS 사용 중단
    }
  }

  // 기존 음성 중단
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // 기본 설정
  const settings = {
    rate: 0.8, // 조금 느리게 (단어 학습용)
    pitch: 1.0,
    volume: 1.0,
    ...options
  };

  utterance.rate = settings.rate;
  utterance.pitch = settings.pitch;
  utterance.volume = settings.volume;

  // 영어 음성 설정
  try {
    const englishVoice = await getEnglishVoice();
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
  const wordSettings = {
    rate: 0.7, // 단어는 더 천천히
    pitch: 1.0,
    volume: 1.0,
    ...options
  };

  return await speakText(word, wordSettings);
};

// 문장 발음 함수 (예문용)
export const speakSentence = async (sentence, options = {}) => {
  const sentenceSettings = {
    rate: 0.8,
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
      rate: 0.8,
      pitch: 1.0,
      volume: 1.0,
      autoPlay: false
    };
  } catch (error) {
    console.error('Failed to load voice settings:', error);
    return {
      rate: 0.8,
      pitch: 1.0,
      volume: 1.0,
      autoPlay: false
    };
  }
};

// 음성 상태 관리
let currentUtterance = null;
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