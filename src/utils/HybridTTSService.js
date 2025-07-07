// 하이브리드 TTS 서비스 - 모바일/데스크톱 분리 전략
// 모바일: 외부 TTS API + Web Audio API
// 데스크톱: Web Speech API (기존 유지)

import { createTTSService } from './TTSService';

// 환경 감지
const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isAndroid = /Android/i.test(navigator.userAgent);

// 외부 TTS API 설정
const TTS_API_CONFIG = {
  // OpenAI TTS API (우선순위 1)
  openai: {
    url: 'https://api.openai.com/v1/audio/speech',
    model: 'tts-1',
    voice: 'alloy',
    speed: 1.0
  },
  // Google Cloud TTS (우선순위 2)
  google: {
    url: 'https://texttospeech.googleapis.com/v1/text:synthesize',
    voice: {
      languageCode: 'en-US',
      name: 'en-US-Neural2-D'
    },
    audioConfig: {
      audioEncoding: 'MP3'
    }
  },
  // ElevenLabs (우선순위 3)
  elevenlabs: {
    url: 'https://api.elevenlabs.io/v1/text-to-speech',
    voice_id: 'pNInz6obpgDQGcFmaJgB', // Adam voice
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.5
    }
  }
};

class HybridTTSService {
  constructor() {
    this.isActive = false;
    this.isPlaying = false;
    this.currentAudioContext = null;
    this.currentAudioSource = null;
    this.audioQueue = [];
    this.currentIndex = 0;
    this.onProgress = null;
    this.onComplete = null;
    this.onError = null;
    this.onStart = null;
    
    // 모바일 감지 결과
    this.isMobile = isMobile;
    this.preferredAPI = this.selectTTSAPI();
    
    console.log(`🎵 HybridTTSService 초기화: ${this.isMobile ? '모바일' : '데스크톱'} 모드`);
    console.log(`🔧 선택된 TTS API: ${this.preferredAPI}`);
    
    // Web Audio API 초기화
    if (this.isMobile) {
      this.initializeWebAudio();
    }
  }

  /**
   * 사용할 TTS API 선택
   */
  selectTTSAPI() {
    if (!this.isMobile) {
      return 'webspeech'; // 데스크톱은 Web Speech API 유지
    }

    // 모바일에서는 외부 API 우선
    // 실제 구현에서는 API 키 존재 여부로 결정
    if (window.OPENAI_API_KEY) return 'openai';
    if (window.GOOGLE_TTS_API_KEY) return 'google';
    if (window.ELEVENLABS_API_KEY) return 'elevenlabs';
    
    // 폴백: Web Speech API (하지만 강화된 버전)
    return 'webspeech-enhanced';
  }

  /**
   * Web Audio API 초기화
   */
  async initializeWebAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // iOS에서 오디오 컨텍스트 활성화
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      console.log('🔊 Web Audio Context 초기화 완료');
    } catch (error) {
      console.error('❌ Web Audio Context 초기화 실패:', error);
    }
  }

  /**
   * 텍스트를 문장으로 분할
   */
  splitIntoSentences(text) {
    if (!text || text.trim().length === 0) return [];

    const sentences = text
      .split(/(?<=[.!?])\s+(?=[A-Z])/)
      .filter(s => s.trim().length > 0)
      .map((sentence, index) => ({
        text: sentence.trim(),
        index: index,
        wordCount: sentence.split(/\s+/).length
      }));

    console.log(`📝 문장 분할: ${sentences.length}개 문장`);
    return sentences;
  }

  /**
   * 외부 TTS API를 통한 음성 생성 (모의 구현)
   */
  async generateAudioFromExternalAPI(text, apiType) {
    console.log(`🌐 외부 TTS API 호출: ${apiType}`);
    
    try {
      // 실제 구현에서는 각 API별 실제 호출
      switch (apiType) {
        case 'openai':
          return await this.callOpenAITTS(text);
        case 'google':
          return await this.callGoogleTTS(text);
        case 'elevenlabs':
          return await this.callElevenLabsTTS(text);
        default:
          throw new Error(`지원하지 않는 API: ${apiType}`);
      }
    } catch (error) {
      console.error(`❌ ${apiType} TTS API 호출 실패:`, error);
      // 폴백: Web Speech API
      return null;
    }
  }

  /**
   * OpenAI TTS API 호출 (모의 구현)
   */
  async callOpenAITTS(text) {
    // 실제 구현에서는 OpenAI API 호출
    console.log('📞 OpenAI TTS API 호출 (모의)');
    
    // 모의 지연시간
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 실제로는 OpenAI API에서 받은 오디오 데이터 반환
    return null; // 현재는 모의 구현
  }

  /**
   * Google Cloud TTS API 호출 (모의 구현)
   */
  async callGoogleTTS(text) {
    console.log('📞 Google TTS API 호출 (모의)');
    await new Promise(resolve => setTimeout(resolve, 800));
    return null;
  }

  /**
   * ElevenLabs API 호출 (모의 구현)
   */
  async callElevenLabsTTS(text) {
    console.log('📞 ElevenLabs API 호출 (모의)');
    await new Promise(resolve => setTimeout(resolve, 1200));
    return null;
  }

  /**
   * Web Audio API를 통한 오디오 재생
   */
  async playAudioBuffer(audioBuffer) {
    if (!this.audioContext || !audioBuffer) return false;

    try {
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      return new Promise((resolve) => {
        source.onended = () => {
          console.log('🔊 오디오 재생 완료');
          resolve(true);
        };
        
        source.start(0);
        this.currentAudioSource = source;
      });
    } catch (error) {
      console.error('❌ 오디오 재생 실패:', error);
      return false;
    }
  }

  /**
   * 강화된 Web Speech API (모바일 폴백용)
   */
  async playWithEnhancedWebSpeech(sentences, options = {}) {
    console.log('🎵 강화된 Web Speech API 사용');
    
    // 기존 TTSService를 사용하되 더 안정적인 설정 적용
    const ttsService = createTTSService();
    
    // 모바일 전용 안정화 설정
    const mobileOptions = {
      rate: Math.min(options.rate || 0.8, 0.7), // 더 느리게
      pitch: options.pitch || 1.0,
      volume: options.volume || 1.0
    };

    // 이벤트 리스너 연결
    ttsService.setEventListeners({
      onStart: this.onStart,
      onProgress: (chunkIndex, totalChunks, chunkText, chunkInfo) => {
        if (this.onProgress) {
          // 원본 문장 인덱스 전달
          this.onProgress(chunkIndex, totalChunks, chunkText, chunkInfo);
        }
      },
      onComplete: this.onComplete,
      onError: this.onError
    });

    // 전체 텍스트를 하나로 합쳐서 재생 (문장별 분할은 TTSService에서 처리)
    const fullText = sentences.map(s => s.text).join(' ');
    return await ttsService.play(fullText, mobileOptions);
  }

  /**
   * 메인 TTS 재생 함수
   */
  async play(text, options = {}) {
    if (!text || text.trim().length === 0) {
      console.warn('⚠️ 재생할 텍스트가 없습니다');
      return false;
    }

    this.stop(); // 기존 재생 중지
    this.isActive = true;
    this.isPlaying = true;

    const sentences = this.splitIntoSentences(text);
    if (sentences.length === 0) {
      console.warn('⚠️ 분할된 문장이 없습니다');
      return false;
    }

    try {
      if (this.onStart) this.onStart();

      if (this.preferredAPI === 'webspeech' || this.preferredAPI === 'webspeech-enhanced') {
        // Web Speech API 사용 (데스크톱 또는 모바일 폴백)
        return await this.playWithEnhancedWebSpeech(sentences, options);
      } else {
        // 외부 TTS API 사용 (모바일 우선)
        return await this.playWithExternalAPI(sentences, options);
      }
    } catch (error) {
      console.error('❌ TTS 재생 실패:', error);
      this.isPlaying = false;
      if (this.onError) this.onError(error);
      return false;
    }
  }

  /**
   * 외부 API를 통한 재생
   */
  async playWithExternalAPI(sentences, options = {}) {
    console.log('🌐 외부 TTS API를 통한 재생 시작');
    
    for (let i = 0; i < sentences.length; i++) {
      if (!this.isActive) break;

      const sentence = sentences[i];
      console.log(`📢 문장 ${i + 1}/${sentences.length}: ${sentence.text.substring(0, 50)}...`);

      if (this.onProgress) {
        this.onProgress(i, sentences.length, sentence.text, sentence);
      }

      try {
        // 외부 API로 오디오 생성
        const audioBuffer = await this.generateAudioFromExternalAPI(sentence.text, this.preferredAPI);
        
        if (audioBuffer) {
          // Web Audio API로 재생
          await this.playAudioBuffer(audioBuffer);
        } else {
          // API 실패 시 Web Speech API 폴백
          console.log('🔄 외부 API 실패, Web Speech API 폴백');
          await this.playWithEnhancedWebSpeech([sentence], options);
        }

        // 문장 간 자연스러운 간격
        if (i < sentences.length - 1 && this.isActive) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`❌ 문장 ${i + 1} 재생 실패:`, error);
        // 다음 문장 계속 진행
      }
    }

    this.isPlaying = false;
    if (this.onComplete) this.onComplete();
    return true;
  }

  /**
   * TTS 중지
   */
  stop() {
    console.log('🛑 HybridTTS 정지');
    
    this.isActive = false;
    this.isPlaying = false;

    // Web Audio API 정지
    if (this.currentAudioSource) {
      try {
        this.currentAudioSource.stop();
        this.currentAudioSource = null;
      } catch (error) {
        console.warn('오디오 소스 정지 실패:', error);
      }
    }

    // Web Speech API 정지
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }

    this.audioQueue = [];
    this.currentIndex = 0;
  }

  /**
   * 현재 상태 확인
   */
  isRunning() {
    return this.isActive && this.isPlaying;
  }

  /**
   * 이벤트 리스너 설정
   */
  setEventListeners({ onStart, onProgress, onComplete, onError }) {
    this.onStart = onStart;
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.onError = onError;
  }

  /**
   * 환경 정보 반환
   */
  static getEnvironmentInfo() {
    return {
      isMobile,
      isIOS,
      isAndroid,
      supportsWebAudio: !!(window.AudioContext || window.webkitAudioContext),
      supportsWebSpeech: 'speechSynthesis' in window,
      preferredStrategy: isMobile ? 'hybrid' : 'webspeech'
    };
  }
}

// 전역 인스턴스 관리
let globalHybridTTSService = null;

export const createHybridTTSService = () => {
  if (globalHybridTTSService) {
    globalHybridTTSService.stop();
  }
  globalHybridTTSService = new HybridTTSService();
  return globalHybridTTSService;
};

export const getCurrentHybridTTSService = () => {
  return globalHybridTTSService;
};

export const stopCurrentHybridTTS = () => {
  if (globalHybridTTSService) {
    globalHybridTTSService.stop();
  }
};

// 전역 함수 노출
if (typeof window !== 'undefined') {
  window.createHybridTTSService = createHybridTTSService;
  window.getCurrentHybridTTSService = getCurrentHybridTTSService;
  window.stopCurrentHybridTTS = stopCurrentHybridTTS;
  window.HybridTTSService = HybridTTSService;
  
  // 환경 정보 노출
  window.TTSEnvironmentInfo = HybridTTSService.getEnvironmentInfo();
  console.log('🌍 TTS 환경 정보:', window.TTSEnvironmentInfo);
}

export default HybridTTSService;