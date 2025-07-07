// 통합 TTS 서비스 - 모바일 최적화 및 사용자 제스처 컨텍스트 보존
// 기존 speechUtils.js, simpleTTS.js, mobileTTS.js 통합

// 모바일 환경 감지
const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isAndroid = /Android/i.test(navigator.userAgent);

// 사용자 제스처 컨텍스트 보존을 위한 오디오 컨텍스트 전역 관리
let audioContextInitialized = false;
let globalVoiceReady = false;

class TTSService {
  constructor() {
    this.isActive = false;
    this.isPlaying = false;
    this.currentUtterance = null;
    this.chunks = [];
    this.currentChunkIndex = 0;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.totalOperations = 0;
    this.maxOperations = 1000;
    this.onProgress = null;
    this.onComplete = null;
    this.onError = null;
    this.onStart = null;
    this.voiceLoadingPromise = null;
    this.currentVoice = null;
    
    console.log('🎵 TTSService 초기화됨');
    this.initializeVoiceLoading();
  }

  /**
   * 음성 로딩 초기화 - iOS Safari 안정성 개선
   */
  initializeVoiceLoading() {
    if (this.voiceLoadingPromise) {
      return this.voiceLoadingPromise;
    }

    this.voiceLoadingPromise = new Promise((resolve) => {
      if (!this.isSpeechSupported()) {
        console.warn('⚠️ Speech Synthesis 지원되지 않음');
        resolve(null);
        return;
      }

      let voices = speechSynthesis.getVoices();
      
      if (voices.length > 0) {
        console.log('✅ 음성 목록 즉시 로드됨:', voices.length, '개');
        this.currentVoice = this.selectBestVoice(voices);
        globalVoiceReady = true;
        resolve(this.currentVoice);
        return;
      }

      // iOS Safari를 위한 개선된 onvoiceschanged 처리
      let attempts = 0;
      const maxAttempts = isIOS ? 50 : 30;
      const checkInterval = isIOS ? 400 : 200;
      let voiceschangedHandled = false;

      const checkVoices = () => {
        voices = speechSynthesis.getVoices();
        attempts++;
        
        console.log(`🔄 음성 로딩 시도 ${attempts}/${maxAttempts}, 발견된 음성: ${voices.length}개`);
        
        if (voices.length > 0) {
          console.log('✅ 음성 목록 로드 완료:', voices.length, '개');
          this.currentVoice = this.selectBestVoice(voices);
          globalVoiceReady = true;
          
          // 이벤트 리스너 정리
          speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
          resolve(this.currentVoice);
        } else if (attempts < maxAttempts) {
          setTimeout(checkVoices, checkInterval);
        } else {
          console.warn('⚠️ 음성 로딩 실패: 최대 재시도 횟수 초과');
          speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
          resolve(null);
        }
      };

      const onVoicesChanged = () => {
        if (!voiceschangedHandled) {
          voiceschangedHandled = true;
          console.log('📢 onvoiceschanged 이벤트 발생');
          setTimeout(checkVoices, 100);
        }
      };

      // onvoiceschanged 이벤트 한 번만 등록
      speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
      
      // 초기 체크
      setTimeout(checkVoices, isIOS ? 800 : 300);
    });

    return this.voiceLoadingPromise;
  }

  /**
   * 최적 음성 선택
   */
  selectBestVoice(voices) {
    if (!voices || voices.length === 0) return null;

    // 우선순위: 미국 영어 -> 영국 영어 -> 기타 영어 -> 기본값
    const preferredVoices = ['en-US', 'en-GB', 'en-AU', 'en-CA', 'en'];
    
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
    
    for (const langCode of preferredVoices) {
      const voice = voices.find(v => v.lang.startsWith(langCode));
      if (voice) {
        console.log('✅ 대체 음성 발견:', voice.name, voice.lang);
        return voice;
      }
    }
    
    const anyEnglishVoice = voices.find(v => v.lang.toLowerCase().includes('en'));
    if (anyEnglishVoice) {
      console.log('✅ 일반 영어 음성 발견:', anyEnglishVoice.name, anyEnglishVoice.lang);
      return anyEnglishVoice;
    }
    
    const defaultVoice = voices[0];
    console.log('⚠️ 기본 음성 사용:', defaultVoice ? defaultVoice.name : 'none');
    return defaultVoice || null;
  }

  /**
   * 사용자 제스처 컨텍스트 보존 - 핵심 개선 사항
   */
  async initializeAudioContext() {
    if (audioContextInitialized) return true;

    try {
      // 사용자 클릭 이벤트 내에서 호출되어야 함
      // 무음 발화로 오디오 컨텍스트 활성화
      const silentUtterance = new SpeechSynthesisUtterance('');
      silentUtterance.volume = 0;
      silentUtterance.rate = 10; // 빠르게 처리
      
      const contextPromise = new Promise((resolve) => {
        silentUtterance.onend = () => {
          console.log('✅ 오디오 컨텍스트 활성화 완료');
          audioContextInitialized = true;
          resolve(true);
        };
        
        silentUtterance.onerror = () => {
          console.log('⚠️ 오디오 컨텍스트 활성화 실패, 계속 진행');
          resolve(false);
        };
      });

      speechSynthesis.speak(silentUtterance);
      
      // 최대 2초 대기
      const timeoutPromise = new Promise(resolve => 
        setTimeout(() => resolve(false), 2000)
      );
      
      await Promise.race([contextPromise, timeoutPromise]);
      return true;
    } catch (error) {
      console.warn('오디오 컨텍스트 초기화 실패:', error);
      return false;
    }
  }

  /**
   * 텍스트를 청크로 분할 - 모바일 안정성 우선
   */
  splitIntoChunks(text) {
    if (!text || text.trim().length === 0) return [];

    // 텍스트 전처리
    const processedText = this.preprocessText(text);

    // 모바일에서는 단순한 문장 분할만 사용 (안정성 우선)
    const sentences = processedText
      .split(/(?<=[.!?])\s+(?=[A-Z])/)
      .filter(s => s.trim().length > 0);

    const chunks = sentences.map((sentence, index) => ({
      text: sentence.trim(),
      index: index,
      wordCount: sentence.split(/\s+/).length,
      isSentence: true,
      originalSentenceIndex: index
    }));

    // 모바일에서는 추가 분할 없이 단순하게 유지
    if (isMobile) {
      console.log(`📱 모바일 간단 분할: ${chunks.length}개 문장 (안정성 우선)`);
      
      // 너무 긴 문장만 간단히 반으로 분할
      const finalChunks = [];
      chunks.forEach(chunk => {
        if (chunk.wordCount > 100) { // 100단어 이상만 분할
          const words = chunk.text.split(/\s+/);
          const mid = Math.floor(words.length / 2);
          
          finalChunks.push({
            text: words.slice(0, mid).join(' '),
            index: finalChunks.length,
            wordCount: mid,
            isSentence: true,
            originalSentenceIndex: chunk.originalSentenceIndex
          });
          
          finalChunks.push({
            text: words.slice(mid).join(' '),
            index: finalChunks.length,
            wordCount: words.length - mid,
            isSentence: false,
            originalSentenceIndex: chunk.originalSentenceIndex
          });
        } else {
          finalChunks.push({
            ...chunk,
            index: finalChunks.length
          });
        }
      });
      
      return finalChunks;
    } else {
      console.log(`🖥️ 데스크톱 문장 분할: ${chunks.length}개 문장`);
      return chunks;
    }
  }

  /**
   * 텍스트 전처리 - TTS 엔진 최적화
   */
  preprocessText(text) {
    return text
      .replace(/\s+/g, ' ') // 여러 공백을 하나로
      .replace(/[^\w\s.,!?;:'"()-]/g, '') // 특수 문자 제거
      .replace(/\d+/g, (match) => { // 숫자를 영어로 변환 (간단한 경우만)
        const num = parseInt(match);
        if (num >= 0 && num <= 20) {
          const numbers = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
          return numbers[num] || match;
        }
        return match;
      })
      .trim();
  }

  /**
   * TTS 재생 시작 - 통합된 엔트리 포인트
   */
  async play(text, options = {}) {
    if (!text || text.trim().length === 0) {
      console.warn('⚠️ 재생할 텍스트가 없습니다');
      return false;
    }

    // 기존 재생 중지
    this.stop();
    
    this.isActive = true;
    this.isPlaying = true;
    this.totalOperations = 0;

    try {
      // 사용자 제스처 컨텍스트 보존
      await this.initializeAudioContext();
      
      // 음성 로딩 대기
      if (!this.currentVoice) {
        console.log('🔄 음성 로딩 대기 중...');
        await this.initializeVoiceLoading();
      }

      // 텍스트 청크 분할
      this.chunks = this.splitIntoChunks(text);
      this.currentChunkIndex = 0;
      this.retryCount = 0;

      if (this.chunks.length === 0) {
        console.warn('⚠️ 생성된 청크가 없습니다');
        this.isPlaying = false;
        return false;
      }

      console.log(`🎵 TTS 재생 시작: ${this.chunks.length}개 청크`);

      // 시작 콜백
      if (this.onStart) {
        this.onStart();
      }

      // 청크 재생 시작
      this.playNextChunk(options);
      
      return true;
    } catch (error) {
      console.error('❌ TTS 재생 에러:', error);
      this.isPlaying = false;
      if (this.onError) this.onError(error);
      return false;
    }
  }

  /**
   * 다음 청크 재생 (단순화된 버전)
   */
  playNextChunk(options = {}) {
    // 무한 루프 방지
    this.totalOperations++;
    if (this.totalOperations > this.maxOperations) {
      console.error('❌ 최대 작업 수 초과! TTS 강제 종료');
      this.stop();
      return;
    }

    if (!this.isActive || !this.isPlaying || this.currentChunkIndex >= this.chunks.length) {
      console.log('🛑 TTS 재생 완료');
      this.isPlaying = false;
      if (this.onComplete) this.onComplete();
      return;
    }

    const chunk = this.chunks[this.currentChunkIndex];
    if (!chunk || !chunk.text) {
      console.warn('⚠️ 유효하지 않은 청크, 다음으로 이동');
      this.currentChunkIndex++;
      setTimeout(() => this.playNextChunk(options), 100);
      return;
    }

    console.log(`📢 청크 ${this.currentChunkIndex + 1}/${this.chunks.length}: ${chunk.text.substring(0, 50)}...`);

    // 진행 상황 콜백 (청크 정보 포함)
    if (this.onProgress) {
      this.onProgress(this.currentChunkIndex, this.chunks.length, chunk.text, chunk);
    }

    const utterance = new SpeechSynthesisUtterance(chunk.text);
    
    // 음성 설정
    utterance.rate = options.rate || 0.8;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 1.0;
    
    if (this.currentVoice) {
      utterance.voice = this.currentVoice;
      utterance.lang = this.currentVoice.lang;
    } else {
      utterance.lang = 'en-US';
    }

    let hasStarted = false;
    let hasEnded = false;
    let timeoutId = null;
    let forceNextTimeout = null;

    // 성공 처리 함수
    const handleSuccess = () => {
      if (hasEnded) {
        console.log('⚠️ handleSuccess 중복 호출 방지');
        return;
      }
      hasEnded = true;
      
      // 타이머들 정리
      if (timeoutId) clearTimeout(timeoutId);
      if (forceNextTimeout) clearTimeout(forceNextTimeout);
      
      console.log(`✅ 청크 ${this.currentChunkIndex + 1}/${this.chunks.length} 완료`);
      this.retryCount = 0;
      this.currentChunkIndex++;
      
      if (this.isActive && this.currentChunkIndex < this.chunks.length) {
        console.log(`➡️ 다음 청크 재생 예정: ${this.currentChunkIndex + 1}/${this.chunks.length}`);
        
        // 모바일에서는 안정성을 위해 더 긴 대기시간 적용
        const delay = isMobile ? 800 : 300;
        
        setTimeout(() => {
          // 다중 상태 체크로 안정성 확보
          if (this.isActive && !speechSynthesis.speaking && this.currentChunkIndex < this.chunks.length) {
            console.log(`🔄 speechSynthesis 상태 확인: speaking=${speechSynthesis.speaking}, pending=${speechSynthesis.pending}`);
            this.playNextChunk(options);
          } else {
            console.log(`⚠️ 다음 청크 재생 조건 불만족: isActive=${this.isActive}, speaking=${speechSynthesis.speaking}`);
          }
        }, delay);
      } else {
        console.log('🏁 모든 청크 재생 완료');
        this.isPlaying = false;
        if (this.onComplete) this.onComplete();
      }
    };

    // 에러 처리 함수
    const handleError = (error) => {
      if (hasEnded) {
        console.log('⚠️ handleError 중복 호출 방지');
        return;
      }
      hasEnded = true;
      
      // 타이머들 정리
      if (timeoutId) clearTimeout(timeoutId);
      if (forceNextTimeout) clearTimeout(forceNextTimeout);
      
      console.error('❌ 청크 재생 에러:', error, `청크 ${this.currentChunkIndex + 1}/${this.chunks.length}`);

      if (isMobile && this.retryCount < this.maxRetries && error !== 'canceled' && error !== 'timeout') {
        this.retryCount++;
        console.log(`🔄 청크 재시도 ${this.retryCount}/${this.maxRetries}`);
        
        setTimeout(() => {
          if (this.isActive && !speechSynthesis.speaking) {
            console.log(`🔄 재시도 시작: 청크 ${this.currentChunkIndex + 1}`);
            hasEnded = false; // 재시도를 위해 리셋
            this.playNextChunk(options);
          }
        }, isMobile ? 1500 : 500); // 모바일 재시도는 더 안전하게
      } else {
        this.retryCount = 0;
        this.currentChunkIndex++;
        
        console.log(`⏭️ 다음 청크로 이동: ${this.currentChunkIndex}/${this.chunks.length}`);
        
        if (this.currentChunkIndex < this.chunks.length && this.isActive) {
          const errorDelay = isMobile ? 1000 : 500; // 에러 시에는 더 긴 대기
          setTimeout(() => {
            if (this.isActive && !speechSynthesis.speaking) {
              console.log(`🔄 에러 후 재생 재개: 청크 ${this.currentChunkIndex + 1}`);
              this.playNextChunk(options);
            }
          }, errorDelay);
        } else {
          console.log('🏁 에러로 인한 재생 종료');
          this.isPlaying = false;
          if (this.onComplete) this.onComplete();
        }
      }
    };

    // 이벤트 리스너
    utterance.onstart = () => {
      hasStarted = true;
      console.log(`🎵 청크 ${this.currentChunkIndex + 1}/${this.chunks.length} 재생 시작`);
      console.log(`📄 재생 텍스트: "${chunk.text}"`);
    };

    utterance.onend = () => {
      console.log(`🏁 청크 ${this.currentChunkIndex + 1}/${this.chunks.length} onend 이벤트 발생`);
      console.log(`⏰ hasEnded 상태: ${hasEnded}`);
      console.log(`🔄 다음 청크 존재: ${this.currentChunkIndex + 1 < this.chunks.length}`);
      console.log(`✅ isActive 상태: ${this.isActive}`);
      handleSuccess();
    };
    
    utterance.onerror = (event) => {
      console.error(`❌ 청크 ${this.currentChunkIndex + 1}/${this.chunks.length} onerror 이벤트:`, event.error);
      handleError(event.error);
    };

    // 모바일 타임아웃 (대폭 단축)
    const timeoutDuration = isMobile ? 8000 : 5000; // 모바일 8초, 데스크톱 5초
    timeoutId = setTimeout(() => {
      if (!hasStarted && !hasEnded) {
        console.warn(`⏰ 청크 ${this.currentChunkIndex + 1} 재생 타임아웃 (${timeoutDuration}ms)`);
        handleError('timeout');
      }
    }, timeoutDuration);
    
    // 추가: 강제 진행 타이머 (문장이 시작되었지만 끝나지 않는 경우)
    forceNextTimeout = setTimeout(() => {
      if (hasStarted && !hasEnded) {
        console.warn(`🚨 청크 ${this.currentChunkIndex + 1} 강제 종료 - 다음 문장으로 진행`);
        handleSuccess();
      }
    }, timeoutDuration + 3000); // 타임아웃 + 3초 후 강제 진행

    // 재생 실행 (모바일 안정화)
    this.currentUtterance = utterance;
    
    // 모바일에서는 더 안전한 재생 로직 적용
    const executeSpeech = () => {
      if (!this.isActive) {
        console.log('⚠️ TTS 비활성 상태로 재생 취소');
        return;
      }
      
      console.log(`🎬 speechSynthesis.speak() 호출: 청크 ${this.currentChunkIndex + 1}`);
      console.log(`📊 현재 speechSynthesis 상태: speaking=${speechSynthesis.speaking}, pending=${speechSynthesis.pending}`);
      
      try {
        speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('❌ speechSynthesis.speak() 에러:', error);
        handleError(error);
      }
    };
    
    if (speechSynthesis.speaking) {
      console.log('🔇 기존 음성 재생 중지 후 새 음성 재생');
      speechSynthesis.cancel();
      
      // 모바일에서는 cancel 후 더 충분한 대기시간
      const cancelDelay = isMobile ? 300 : 100;
      setTimeout(executeSpeech, cancelDelay);
    } else {
      // 즉시 재생 가능한 상태
      executeSpeech();
    }
  }

  /**
   * TTS 중지 (강화된 완전 정지)
   */
  stop() {
    console.log('🛑 TTS 완전 정지 시작');
    
    this.isActive = false;
    this.isPlaying = false;
    
    // 즉시 speechSynthesis 정지
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      console.log('🔇 speechSynthesis.cancel() 호출');
    }
    
    // 현재 utterance 정리
    if (this.currentUtterance) {
      this.currentUtterance.onstart = null;
      this.currentUtterance.onend = null;
      this.currentUtterance.onerror = null;
      this.currentUtterance = null;
      console.log('🗑️ currentUtterance 정리 완료');
    }

    // 상태 초기화
    this.currentChunkIndex = 0;
    this.chunks = [];
    this.retryCount = 0;
    this.totalOperations = 0;
    
    console.log('✅ TTS 완전 정지 완료');

    // 모바일에서 추가 정리 (더 적극적)
    if (isMobile) {
      setTimeout(() => {
        speechSynthesis.cancel();
        console.log('📱 모바일 추가 정리 완료');
      }, 100);
      
      // 한번 더 확실히
      setTimeout(() => {
        speechSynthesis.cancel();
      }, 300);
    }
  }

  /**
   * 현재 상태 확인
   */
  isRunning() {
    return this.isActive && this.isPlaying;
  }

  /**
   * 진행률 반환
   */
  getProgress() {
    if (this.chunks.length === 0) return 0;
    return this.currentChunkIndex / this.chunks.length;
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
   * Speech Synthesis 지원 여부 확인
   */
  isSpeechSupported() {
    return 'speechSynthesis' in window;
  }

  /**
   * 모바일 환경 정보
   */
  static getEnvironmentInfo() {
    return {
      isMobile,
      isIOS,
      isAndroid,
      isSpeechSupported: 'speechSynthesis' in window,
      audioContextInitialized,
      globalVoiceReady
    };
  }
}

// 전역 인스턴스 관리
let globalTTSService = null;

export const createTTSService = () => {
  if (globalTTSService) {
    globalTTSService.stop();
  }
  globalTTSService = new TTSService();
  return globalTTSService;
};

export const getCurrentTTSService = () => {
  return globalTTSService;
};

export const stopCurrentTTS = () => {
  if (globalTTSService) {
    globalTTSService.stop();
  }
};

// 단순 API 호환성 유지
export const speakText = async (text, options = {}) => {
  if (!globalTTSService) {
    globalTTSService = new TTSService();
  }
  return await globalTTSService.play(text, options);
};

export const speakWord = async (word, options = {}) => {
  return await speakText(word, { rate: 0.7, ...options });
};

export const speakSentence = async (sentence, options = {}) => {
  return await speakText(sentence, { rate: 0.8, ...options });
};

// 전역 함수 노출
if (typeof window !== 'undefined') {
  window.createTTSService = createTTSService;
  window.getCurrentTTSService = getCurrentTTSService;
  window.stopCurrentTTS = stopCurrentTTS;
  window.TTSService = TTSService;
}

export default TTSService;