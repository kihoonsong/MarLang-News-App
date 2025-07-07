// 통합 TTS 엔진 - 모든 기능을 하나로 통합
// 밑줄 하이라이팅, 배속 조절, 정지 등 모든 기존 기능 유지

const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isAndroid = /Android/i.test(navigator.userAgent);

class UnifiedTTS {
  constructor(options = {}) {
    // 기본 설정
    this.options = {
      rate: 0.8,
      pitch: 1.0,
      volume: 1.0,
      ...options
    };
    
    // 상태 관리
    this.isActive = false;
    this.isPlaying = false;
    this.isPaused = false;
    this.sentences = [];
    this.currentIndex = 0;
    this.currentUtterance = null;
    this.voice = null;
    this.retryCount = 0; // iOS 재시도 카운터
    
    // 타이머 관리
    this.playTimer = null;
    this.backupTimer = null;
    this.earlyDetectionTimer = null; // iOS 조기 감지 타이머
    
    // 이벤트 콜백
    this.onStart = options.onStart || null;
    this.onProgress = options.onProgress || null;
    this.onComplete = options.onComplete || null;
    this.onError = options.onError || null;
    this.onPause = options.onPause || null;
    this.onResume = options.onResume || null;
    
    console.log('🎵 UnifiedTTS 초기화 - 플랫폼:', this.getPlatform());
    this.initializeVoice();
  }

  /**
   * 플랫폼 감지
   */
  getPlatform() {
    if (isIOS) return 'iOS';
    if (isAndroid) return 'Android';
    if (isMobile) return 'Mobile';
    return 'Desktop';
  }

  /**
   * 음성 초기화
   */
  async initializeVoice() {
    try {
      let voices = speechSynthesis.getVoices();
      
      // 음성이 로드되지 않은 경우 대기
      if (voices.length === 0) {
        await new Promise((resolve) => {
          const checkVoices = () => {
            voices = speechSynthesis.getVoices();
            if (voices.length > 0) {
              resolve();
            } else {
              setTimeout(checkVoices, 100);
            }
          };
          
          speechSynthesis.onvoiceschanged = checkVoices;
          checkVoices();
        });
      }
      
      // 영어 음성 우선순위 선택
      const allVoices = speechSynthesis.getVoices();
      this.voice = allVoices.find(v => v.lang.startsWith('en-US')) || 
                   allVoices.find(v => v.lang.startsWith('en-GB')) || 
                   allVoices.find(v => v.lang.startsWith('en')) || 
                   allVoices[0];
      
      if (this.voice) {
        console.log('✅ 선택된 음성:', this.voice.name, this.voice.lang);
      }
    } catch (error) {
      console.warn('음성 초기화 실패:', error);
    }
  }

  /**
   * 텍스트를 문장으로 분할 (모든 TTS 파일에서 동일하게 사용)
   */
  splitIntoSentences(text) {
    if (!text || text.trim().length === 0) return [];

    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 0)
      .map((sentence, index) => ({
        text: sentence.trim(),
        index: index
      }));

    console.log(`📝 ${sentences.length}개 문장으로 분할`);
    return sentences;
  }

  /**
   * 예상 재생 시간 계산
   */
  calculatePlayTime(text, rate = this.options.rate) {
    const words = text.split(/\s+/).length;
    const characters = text.length;
    
    // 모든 플랫폼에서 동일한 계산 (데스크톱 방식 적용)
    const baseWPM = 100;
    const wordsPerMinute = baseWPM * rate;
    const wordBasedTime = (words / wordsPerMinute) * 60;
    const charBasedTime = characters * 0.08;
    
    // 더 긴 시간 선택 (안전한 타이머)
    const estimatedTime = Math.max(wordBasedTime, charBasedTime);
    const finalTime = Math.max(Math.min(estimatedTime, 30), 2);
    
    console.log(`⏱️ 예상 재생 시간: ${finalTime.toFixed(1)}초`);
    return finalTime * 1000;
  }

  /**
   * TTS 재생 시작
   */
  async play(text) {
    if (!text || text.trim().length === 0) {
      console.warn('⚠️ 재생할 텍스트가 없습니다');
      return false;
    }

    // 기존 재생 중지
    this.stop();
    
    // 문장 분할
    this.sentences = this.splitIntoSentences(text);
    if (this.sentences.length === 0) {
      console.warn('⚠️ 분할된 문장이 없습니다');
      return false;
    }

    // 상태 초기화
    this.isActive = true;
    this.isPlaying = true;
    this.isPaused = false;
    this.currentIndex = 0;
    this.retryCount = 0; // 재시도 카운터 초기화

    console.log(`🎵 TTS 재생 시작: ${this.sentences.length}개 문장`);

    // 시작 이벤트 호출
    if (this.onStart) {
      this.onStart();
    }

    // 첫 번째 문장부터 재생
    this.playNextSentence();
    return true;
  }

  /**
   * 다음 문장 재생 (핵심 로직)
   */
  playNextSentence() {
    // 상태 확인
    if (!this.isActive || !this.isPlaying || this.isPaused || this.currentIndex >= this.sentences.length) {
      if (this.currentIndex >= this.sentences.length && this.isActive) {
        this.handleComplete();
      }
      return;
    }

    const sentence = this.sentences[this.currentIndex];
    
    // 새 문장 시작할 때 재시도 카운터 초기화
    if (this.retryCount === 0) {
      console.log(`📢 문장 ${this.currentIndex + 1}/${this.sentences.length}: ${sentence.text}`);
    } else {
      console.log(`🔄 [${this.getPlatform()}] 문장 ${this.currentIndex + 1} 재시도 ${this.retryCount}회`);
    }

    // 진행률 콜백 (밑줄 하이라이팅용)
    if (this.onProgress) {
      console.log(`🎯 [${this.getPlatform()}] Progress callback: sentence ${this.currentIndex + 1}/${this.sentences.length}`);
      this.onProgress(this.currentIndex, this.sentences.length, sentence.text, sentence);
    }

    // 음성 합성 객체 생성
    const utterance = new SpeechSynthesisUtterance(sentence.text);
    
    // 음성 설정 (배속 포함)
    utterance.rate = this.options.rate;
    utterance.pitch = this.options.pitch;
    utterance.volume = this.options.volume;
    
    if (this.voice) {
      utterance.voice = this.voice;
      utterance.lang = this.voice.lang;
    } else {
      utterance.lang = 'en-US';
    }

    // 재생 시작 시간 기록
    const startTime = Date.now();
    
    // 이벤트 핸들러 설정
    utterance.onstart = () => {
      console.log(`▶️ 문장 ${this.currentIndex + 1} 재생 시작`);
    };

    utterance.onend = () => {
      const actualDuration = Date.now() - startTime;
      console.log(`✅ [${this.getPlatform()}] 문장 ${this.currentIndex + 1} 재생 완료 (${actualDuration}ms)`);
      console.log(`🔍 [${this.getPlatform()}] onend 상태: isActive=${this.isActive}, isPlaying=${this.isPlaying}, isPaused=${this.isPaused}`);
      
      // 타이머 정리
      this.clearTimers();
      
      // 상태 확인 후 다음 문장으로 이동
      if (this.isActive && this.isPlaying && !this.isPaused) {
        console.log(`➡️ [${this.getPlatform()}] onend에서 다음 문장으로 이동`);
        this.moveToNextSentence();
      } else {
        console.log(`❌ [${this.getPlatform()}] onend 이동 취소: isActive=${this.isActive}, isPlaying=${this.isPlaying}, isPaused=${this.isPaused}`);
      }
    };

    utterance.onerror = (event) => {
      console.error(`❌ [${this.getPlatform()}] 문장 ${this.currentIndex + 1} 재생 에러:`, event.error);
      
      // interrupted 에러는 중지 명령에 의한 것이므로 무시
      if (event.error === 'interrupted') {
        console.log(`🛑 [${this.getPlatform()}] 중지 명령에 의한 interrupted 에러`);
        return;
      }
      
      // iOS의 canceled 에러 처리 - 재시도 우선
      if (event.error === 'canceled' && this.getPlatform() === 'iOS') {
        // 조기 감지에서 온 경우 _startTime 사용, 아니면 실제 startTime 사용
        const actualStartTime = this.currentUtterance?._startTime || startTime;
        const elapsedTime = Date.now() - actualStartTime;
        const maxRetries = 2; // 최대 2회 재시도
        
        console.log(`🍎 [iOS] canceled 에러 감지 - 경과 시간: ${elapsedTime}ms, 재시도: ${this.retryCount}/${maxRetries}`);
        
        // 재시도 횟수가 남아있으면 재시도
        if (this.retryCount < maxRetries) {
          this.retryCount++;
          console.log(`🔄 [iOS] 음성 재시도 시작 (${this.retryCount}/${maxRetries})`);
          
          // 타이머 정리
          this.clearTimers();
          
          // speechSynthesis 완전 초기화 후 재시도
          if (speechSynthesis.speaking || speechSynthesis.pending) {
            speechSynthesis.cancel();
          }
          
          // iOS에서 초고속 재시도
          setTimeout(() => {
            if (this.isActive && this.isPlaying && !this.isPaused) {
              console.log(`🔄 [iOS] speechSynthesis 초기화 후 재시도`);
              this.playNextSentence();
            }
          }, 100);
          return;
        }
        
        // 최대 재시도 횟수 초과 - 다음 문장으로 진행
        console.log(`🍎 [iOS] 최대 재시도 횟수 초과 - 다음 문장으로 진행`);
        this.retryCount = 0; // 재시도 카운터 초기화
        this.clearTimers();
        if (this.isActive && this.isPlaying && !this.isPaused) {
          setTimeout(() => {
            if (this.isActive && this.isPlaying) {
              this.moveToNextSentence();
            }
          }, 100);
        }
        return;
      }
      
      // 타이머 정리
      this.clearTimers();
      
      // 에러 콜백 호출
      if (this.onError) {
        this.onError(event.error);
      }
      
      // 다음 문장으로 계속 진행
      if (this.isActive && this.isPlaying && !this.isPaused) {
        console.log(`🔄 [${this.getPlatform()}] 에러 후 다음 문장으로 진행`);
        this.moveToNextSentence();
      } else {
        console.log(`❌ [${this.getPlatform()}] 에러 후 이동 취소: isActive=${this.isActive}, isPlaying=${this.isPlaying}, isPaused=${this.isPaused}`);
      }
    };

    // 현재 utterance 저장
    this.currentUtterance = utterance;

    // 플랫폼별 안전한 재생 시작
    try {
      // iOS에서 더 안정적인 speechSynthesis 상태 관리
      if (speechSynthesis.speaking || speechSynthesis.pending) {
        console.log(`🔄 [${this.getPlatform()}] 기존 재생 중지 후 새 문장 시작 (speaking: ${speechSynthesis.speaking}, pending: ${speechSynthesis.pending})`);
        speechSynthesis.cancel();
        
        // iOS에서는 cancel 후 초고속 정리
        const waitTime = this.getPlatform() === 'iOS' ? 100 : 50;
        
        // iOS에서 speechSynthesis 상태가 완전히 정리될 때까지 기다림
        const waitForClear = () => {
          if (!speechSynthesis.speaking && !speechSynthesis.pending) {
            if (this.isActive && this.currentUtterance === utterance) {
              console.log(`🎵 [${this.getPlatform()}] 문장 ${this.currentIndex + 1} 재생 시작 (상태 정리 후)`);
              speechSynthesis.speak(utterance);
            }
          } else {
            // 아직 정리되지 않았으면 조금 더 기다림
            setTimeout(waitForClear, 50);
          }
        };
        
        setTimeout(waitForClear, waitTime);
      } else {
        console.log(`🎵 [${this.getPlatform()}] 문장 ${this.currentIndex + 1} 재생 시작 (즉시)`);
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error(`❌ [${this.getPlatform()}] 재생 실행 에러:`, error);
      if (this.isActive && this.isPlaying) {
        this.moveToNextSentence();
      }
      return;
    }

    // 백업 타이머 설정 (onend 이벤트 실패 대비)
    const expectedDuration = this.calculatePlayTime(sentence.text);
    // iOS에서는 조기 감지 타이머가 있으므로 백업 타이머 대폭 단축
    const bufferTime = this.getPlatform() === 'iOS' ? 500 : 500;
    const timerDuration = expectedDuration + bufferTime;
    
    console.log(`⏰ [${this.getPlatform()}] 백업 타이머 설정: ${timerDuration}ms (예상: ${expectedDuration}ms + 여유: ${bufferTime}ms)`);
    this.backupTimer = setTimeout(() => {
      if (this.isActive && this.isPlaying && !this.isPaused) {
        console.log(`⏰ [${this.getPlatform()}] 백업 타이머 실행: 문장 ${this.currentIndex + 1} 강제 완료`);
        this.moveToNextSentence();
      } else {
        console.log(`⏰ [${this.getPlatform()}] 백업 타이머 취소: TTS 중지됨`);
      }
    }, timerDuration);
    
    // iOS에서 조기 감지 타이머 (무음 재생 빠른 감지)
    if (this.getPlatform() === 'iOS') {
      const earlyDetectionTime = 500; // 0.5초 후 무음 재생 의심 (초고속 감지)
      console.log(`🚨 [iOS] 조기 감지 타이머 설정: ${earlyDetectionTime}ms`);
      
      this.earlyDetectionTimer = setTimeout(() => {
        // 아직 재생 중이고 onstart나 실제 음성이 나오지 않은 것으로 의심되면 재시도
        if (this.isActive && this.isPlaying && !this.isPaused && this.retryCount === 0) {
          console.log(`🚨 [iOS] 조기 감지: 무음 재생 의심 - 즉시 재시도`);
          
          // 기존 타이머들 정리
          if (this.backupTimer) {
            clearTimeout(this.backupTimer);
            this.backupTimer = null;
          }
          
          // speechSynthesis 중지 후 재시도
          if (speechSynthesis.speaking || speechSynthesis.pending) {
            speechSynthesis.cancel();
          }
          
          // 강제로 재시도 로직 실행
          this.retryCount = 0; // 재시도 카운터 초기화하여 즉시 재시도 가능하게
          
          // 현재 utterance 정리
          if (this.currentUtterance) {
            this.currentUtterance.onstart = null;
            this.currentUtterance.onend = null;
            this.currentUtterance.onerror = null;
            this.currentUtterance = null;
          }
          
          // 즉시 다음 문장 재시도 (초고속)
          setTimeout(() => {
            if (this.isActive && this.isPlaying && !this.isPaused) {
              console.log(`🔄 [iOS] 조기 감지 후 즉시 재시도`);
              this.playNextSentence();
            }
          }, 50);
        }
      }, earlyDetectionTime);
    }
  }

  /**
   * 다음 문장으로 이동
   */
  moveToNextSentence() {
    console.log(`📍 [${this.getPlatform()}] moveToNextSentence 호출: current=${this.currentIndex}, total=${this.sentences.length}`);
    console.log(`🔍 [${this.getPlatform()}] 상태 확인: isActive=${this.isActive}, isPlaying=${this.isPlaying}, isPaused=${this.isPaused}`);
    
    if (!this.isActive || !this.isPlaying || this.isPaused) {
      console.log(`❌ [${this.getPlatform()}] moveToNextSentence 취소: 상태 불만족`);
      return;
    }
    
    // 다음 문장으로 이동 시 재시도 카운터 초기화
    this.retryCount = 0;
    this.currentIndex++;
    console.log(`➡️ [${this.getPlatform()}] 다음 문장으로 이동: ${this.currentIndex}/${this.sentences.length}`);
    
    if (this.currentIndex < this.sentences.length) {
      // 모바일에서 매우 빠른 전환 시간 (절반으로 단축)
      const delay = this.getPlatform() === 'iOS' ? 25 : 50;
      console.log(`⏳ [${this.getPlatform()}] ${delay}ms 후 다음 문장 재생`);
      
      this.playTimer = setTimeout(() => {
        if (this.isActive && this.isPlaying && !this.isPaused) {
          console.log(`▶️ [${this.getPlatform()}] 지연 후 다음 문장 재생 시작`);
          this.playNextSentence();
        } else {
          console.log(`❌ [${this.getPlatform()}] 지연 후 재생 취소: 상태 변경됨`);
        }
      }, delay);
    } else {
      // 모든 문장 재생 완료
      console.log(`🏁 [${this.getPlatform()}] 모든 문장 재생 완료`);
      this.handleComplete();
    }
  }

  /**
   * 재생 완료 처리
   */
  handleComplete() {
    console.log('🏁 모든 문장 재생 완료');
    this.isPlaying = false;
    this.isPaused = false;
    
    if (this.onComplete) {
      this.onComplete();
    }
  }

  /**
   * 일시정지
   */
  pause() {
    if (!this.isActive || !this.isPlaying || this.isPaused) {
      return false;
    }
    
    console.log('⏸️ TTS 일시정지');
    this.isPaused = true;
    
    // speechSynthesis 일시정지
    if (speechSynthesis.speaking) {
      speechSynthesis.pause();
    }
    
    // 타이머 정리
    this.clearTimers();
    
    if (this.onPause) {
      this.onPause();
    }
    
    return true;
  }

  /**
   * 재생 재개
   */
  resume() {
    if (!this.isActive || !this.isPaused) {
      return false;
    }
    
    console.log('▶️ TTS 재생 재개');
    this.isPaused = false;
    
    // speechSynthesis 재개
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
    }
    
    // 현재 문장 재생 재개
    if (this.currentIndex < this.sentences.length) {
      this.playNextSentence();
    }
    
    if (this.onResume) {
      this.onResume();
    }
    
    return true;
  }

  /**
   * 완전 중지
   */
  stop() {
    console.log('🛑 TTS 완전 중지');
    
    // 즉시 모든 플래그 비활성화
    this.isActive = false;
    this.isPlaying = false;
    this.isPaused = false;
    this.retryCount = 0; // 재시도 카운터 초기화
    
    // 타이머 정리
    this.clearTimers();
    
    // speechSynthesis 중지
    try {
      if (speechSynthesis.speaking || speechSynthesis.pending) {
        speechSynthesis.cancel();
      }
    } catch (error) {
      console.error('speechSynthesis 중지 중 에러:', error);
    }
    
    // utterance 정리
    if (this.currentUtterance) {
      this.currentUtterance.onstart = null;
      this.currentUtterance.onend = null;
      this.currentUtterance.onerror = null;
      this.currentUtterance = null;
    }
    
    // 상태 초기화
    this.currentIndex = 0;
    this.sentences = [];
    
    return true;
  }

  /**
   * 모든 타이머 정리
   */
  clearTimers() {
    if (this.playTimer) {
      clearTimeout(this.playTimer);
      this.playTimer = null;
    }
    
    if (this.backupTimer) {
      clearTimeout(this.backupTimer);
      this.backupTimer = null;
    }
    
    if (this.earlyDetectionTimer) {
      clearTimeout(this.earlyDetectionTimer);
      this.earlyDetectionTimer = null;
    }
  }

  /**
   * 배속 변경
   */
  setSpeed(rate) {
    console.log('⚡ 배속 변경:', this.options.rate, '→', rate);
    this.options.rate = rate;
    
    // 재생 중인 경우 현재 문장부터 새 속도로 재시작
    if (this.isPlaying && !this.isPaused) {
      // 현재 재생 중지
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
      
      // 타이머 정리
      this.clearTimers();
      
      // 현재 문장 재시작
      setTimeout(() => {
        if (this.isActive && this.isPlaying) {
          this.playNextSentence();
        }
      }, 100);
    }
    
    return true;
  }

  /**
   * 볼륨 변경
   */
  setVolume(volume) {
    this.options.volume = Math.max(0, Math.min(1, volume));
    return true;
  }

  /**
   * 피치 변경
   */
  setPitch(pitch) {
    this.options.pitch = Math.max(0, Math.min(2, pitch));
    return true;
  }

  /**
   * 특정 문장으로 이동
   */
  seekToSentence(index) {
    if (index < 0 || index >= this.sentences.length) {
      return false;
    }
    
    // 현재 재생 중지
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    
    this.clearTimers();
    this.currentIndex = index;
    
    // 재생 중이면 해당 문장부터 재시작
    if (this.isPlaying && !this.isPaused) {
      this.playNextSentence();
    }
    
    return true;
  }

  /**
   * 현재 상태 확인
   */
  isRunning() {
    return this.isActive && this.isPlaying && !this.isPaused;
  }

  /**
   * 일시정지 상태 확인
   */
  isPausedState() {
    return this.isPaused;
  }

  /**
   * 진행률 반환
   */
  getProgress() {
    if (this.sentences.length === 0) return 0;
    return this.currentIndex / this.sentences.length;
  }

  /**
   * 현재 문장 인덱스 반환
   */
  getCurrentSentenceIndex() {
    return this.currentIndex;
  }

  /**
   * 총 문장 수 반환
   */
  getTotalSentences() {
    return this.sentences.length;
  }

  /**
   * 현재 문장 텍스트 반환
   */
  getCurrentSentenceText() {
    if (this.currentIndex >= 0 && this.currentIndex < this.sentences.length) {
      return this.sentences[this.currentIndex].text;
    }
    return '';
  }

  /**
   * 이벤트 리스너 설정
   */
  setEventListeners(listeners) {
    this.onStart = listeners.onStart || this.onStart;
    this.onProgress = listeners.onProgress || this.onProgress;
    this.onComplete = listeners.onComplete || this.onComplete;
    this.onError = listeners.onError || this.onError;
    this.onPause = listeners.onPause || this.onPause;
    this.onResume = listeners.onResume || this.onResume;
    return this;
  }

  /**
   * 디버그 정보 출력
   */
  getDebugInfo() {
    return {
      platform: this.getPlatform(),
      isActive: this.isActive,
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentIndex: this.currentIndex,
      totalSentences: this.sentences.length,
      currentSentence: this.getCurrentSentenceText(),
      progress: this.getProgress(),
      options: this.options,
      voice: this.voice ? this.voice.name : 'No voice selected'
    };
  }
}

// 전역 인스턴스 관리
let globalUnifiedTTS = null;

/**
 * 전역 TTS 인스턴스 생성
 */
export const createUnifiedTTS = (options = {}) => {
  if (globalUnifiedTTS) {
    globalUnifiedTTS.stop();
  }
  globalUnifiedTTS = new UnifiedTTS(options);
  return globalUnifiedTTS;
};

/**
 * 현재 전역 TTS 인스턴스 반환
 */
export const getCurrentUnifiedTTS = () => {
  return globalUnifiedTTS;
};

/**
 * 전역 TTS 중지
 */
export const stopCurrentUnifiedTTS = () => {
  if (globalUnifiedTTS) {
    globalUnifiedTTS.stop();
  }
};

// 전역 함수 노출 (기존 코드 호환성을 위해)
if (typeof window !== 'undefined') {
  window.createUnifiedTTS = createUnifiedTTS;
  window.getCurrentUnifiedTTS = getCurrentUnifiedTTS;
  window.stopCurrentUnifiedTTS = stopCurrentUnifiedTTS;
}

export default UnifiedTTS;