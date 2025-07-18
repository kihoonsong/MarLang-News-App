// 음성 합성 관련 유틸리티 함수들

// TTS 지원 여부 확인
export const isSpeechSynthesisSupported = () => {
  return 'speechSynthesis' in window;
};

// 모바일 및 플랫폼 감지
const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

import { getVoiceManager } from './VoiceManager';

// VoiceManager 편의 함수들 재내보내기
export const getAvailableVoices = () => {
  return getVoiceManager().getVoices();
};

export const addVoiceChangeListener = (callback) => {
  return getVoiceManager().addListener(callback);
};

// 영어 발음에 적합한 음성 찾기 (VoiceManager 사용)
export const getEnglishVoice = () => {
  try {
    const userSettings = getUserTTSSettings();
    const voiceManager = getVoiceManager();
    
    // VoiceManager를 통해 최적의 영어 음성 선택
    const selectedVoice = voiceManager.getBestEnglishVoice(userSettings.preferredTTSVoice);
    
    if (selectedVoice && import.meta.env.DEV) {
      console.log('✅ VoiceManager 음성 선택:', selectedVoice.name, selectedVoice.lang);
    }
    
    return selectedVoice;
  } catch (error) {
    console.error('❌ getEnglishVoice 오류:', error);
    return null;
  }
};

// 사용자 설정 가져오기 함수 (실시간 업데이트)
const getUserTTSSettings = () => {
  try {
    // localStorage에서 사용자 설정 가져오기 (매번 실시간 조회)
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

  // VoiceManager를 통한 영어 음성 설정
  try {
    const englishVoice = getEnglishVoice();
    if (englishVoice) {
      utterance.voice = englishVoice;
      utterance.lang = englishVoice.lang;
      if (import.meta.env.DEV) {
        console.log('🎵 TTS 음성 설정:', englishVoice.name, englishVoice.lang);
      }
    } else {
      utterance.lang = 'en-US'; // 기본값
      if (import.meta.env.DEV) {
        console.warn('⚠️ 영어 음성을 찾을 수 없어 기본 언어 사용');
      }
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