// 음성 합성 관련 유틸리티 함수들

// TTS 지원 여부 확인
export const isSpeechSynthesisSupported = () => {
  return 'speechSynthesis' in window;
};

// 사용 가능한 음성 목록 가져오기
export const getAvailableVoices = () => {
  if (!isSpeechSynthesisSupported()) return [];
  
  return new Promise((resolve) => {
    let voices = speechSynthesis.getVoices();
    
    if (voices.length > 0) {
      resolve(voices);
    } else {
      // 일부 브라우저에서는 비동기적으로 로드됨
      speechSynthesis.onvoiceschanged = () => {
        voices = speechSynthesis.getVoices();
        resolve(voices);
      };
    }
  });
};

// 영어 발음에 적합한 음성 찾기
export const getEnglishVoice = async () => {
  const voices = await getAvailableVoices();
  
  // 우선순위: 미국 영어 -> 영국 영어 -> 기타 영어 -> 기본값
  const preferredVoices = [
    'en-US',
    'en-GB', 
    'en-AU',
    'en-CA',
    'en'
  ];
  
  for (const langCode of preferredVoices) {
    const voice = voices.find(v => 
      v.lang.startsWith(langCode) && 
      (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('male'))
    );
    if (voice) return voice;
  }
  
  // 대안: 첫 번째 영어 음성
  return voices.find(v => v.lang.startsWith('en')) || voices[0] || null;
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

export const getCurrentPlayingStatus = () => isPlaying;

export const stopCurrentSpeech = () => {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
    isPlaying = false;
  }
};

// 전역 함수로 노출 (App.jsx TTSManager에서 사용)
if (typeof window !== 'undefined') {
  window.stopCurrentSpeech = stopCurrentSpeech;
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