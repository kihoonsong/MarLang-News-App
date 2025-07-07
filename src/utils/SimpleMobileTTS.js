// 심플한 모바일 TTS - 문장 단위 순차 재생, 밑줄 완벽 싱크

const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

class SimpleMobileTTS {
  constructor() {
    this.isActive = false;
    this.isPlaying = false;
    this.sentences = [];
    this.currentIndex = 0;
    this.currentUtterance = null;
    this.onProgress = null;
    this.onComplete = null;
    this.onError = null;
    this.onStart = null;
    this.voice = null;
    
    console.log('📱 SimpleMobileTTS 초기화됨');
    this.initializeVoice();
  }

  /**
   * 사용자 제스처 컨텍스트 보존 (TTSService에서 가져온 기능)
   */
  async initializeAudioContext() {
    try {
      // 사용자 클릭 이벤트 내에서 호출되어야 함
      // 무음 발화로 오디오 컨텍스트 활성화
      const silentUtterance = new SpeechSynthesisUtterance('');
      silentUtterance.volume = 0;
      silentUtterance.rate = 10; // 빠르게 처리
      
      const contextPromise = new Promise((resolve) => {
        silentUtterance.onend = () => {
          console.log('✅ 오디오 컨텍스트 활성화 완료');
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
   * 음성 초기화 - 즉시 로드
   */
  async initializeVoice() {
    try {
      const voices = speechSynthesis.getVoices();
      
      if (voices.length === 0) {
        // 음성이 아직 로드되지 않은 경우 대기
        await new Promise((resolve) => {
          const checkVoices = () => {
            const availableVoices = speechSynthesis.getVoices();
            if (availableVoices.length > 0) {
              resolve();
            } else {
              setTimeout(checkVoices, 100);
            }
          };
          
          speechSynthesis.onvoiceschanged = checkVoices;
          checkVoices();
        });
      }
      
      // 영어 음성 선택
      const allVoices = speechSynthesis.getVoices();
      this.voice = allVoices.find(v => v.lang.startsWith('en-US')) || 
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
   * 텍스트를 문장으로 분할 - 매우 심플하게
   */
  splitIntoSentences(text) {
    if (!text || text.trim().length === 0) return [];

    // 가장 단순한 문장 분할
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 0)
      .map((sentence, index) => ({
        text: sentence.trim(),
        index: index
      }));

    console.log(`📝 ${sentences.length}개 문장으로 분할`);
    sentences.forEach((s, i) => {
      console.log(`${i + 1}: ${s.text.substring(0, 50)}...`);
    });
    
    return sentences;
  }

  /**
   * TTS 재생 시작
   */
  async play(text, options = {}) {
    if (!text || text.trim().length === 0) {
      console.warn('⚠️ 재생할 텍스트가 없습니다');
      return false;
    }

    this.stop(); // 기존 재생 중지
    
    // 사용자 제스처 컨텍스트 보존
    await this.initializeAudioContext();
    
    this.sentences = this.splitIntoSentences(text);
    if (this.sentences.length === 0) {
      console.warn('⚠️ 분할된 문장이 없습니다');
      return false;
    }

    this.isActive = true;
    this.isPlaying = true;
    this.currentIndex = 0;

    console.log(`🎵 SimpleMobileTTS 재생 시작: ${this.sentences.length}개 문장`);

    if (this.onStart) {
      this.onStart();
    }

    // 첫 번째 문장부터 재생
    this.playNextSentence(options);
    return true;
  }

  /**
   * 다음 문장 재생 - 핵심 로직
   */
  playNextSentence(options = {}) {
    if (!this.isActive || this.currentIndex >= this.sentences.length) {
      console.log('🏁 모든 문장 재생 완료');
      this.isPlaying = false;
      if (this.onComplete) {
        this.onComplete();
      }
      return;
    }

    const sentence = this.sentences[this.currentIndex];
    console.log(`📢 문장 ${this.currentIndex + 1}/${this.sentences.length}: ${sentence.text}`);

    // 진행 상황 콜백 - 현재 문장 인덱스 정확히 전달
    if (this.onProgress) {
      this.onProgress(this.currentIndex, this.sentences.length, sentence.text, sentence);
    }

    // SpeechSynthesisUtterance 생성
    const utterance = new SpeechSynthesisUtterance(sentence.text);
    
    // 음성 설정
    utterance.rate = options.rate || 0.8;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 1.0;
    
    if (this.voice) {
      utterance.voice = this.voice;
      utterance.lang = this.voice.lang;
    } else {
      utterance.lang = 'en-US';
    }

    // 재생 시작 시간 기록
    const startTime = Date.now();
    
    utterance.onstart = () => {
      console.log(`▶️ 문장 ${this.currentIndex + 1} 재생 시작`);
    };

    utterance.onend = () => {
      const actualDuration = Date.now() - startTime;
      const words = sentence.text.split(/\s+/).length;
      const estimatedDuration = (words / 120) * 60 * 1000; // 기본 120 WPM
      
      console.log(`✅ 문장 ${this.currentIndex + 1} 재생 완료`);
      console.log(`⏱️ 실제 재생시간: ${actualDuration}ms, 예상시간: ${estimatedDuration}ms`);
      
      if (!this.isActive) {
        console.log('🛑 TTS가 중지된 상태');
        return;
      }

      // 실제 재생 시간이 너무 짧으면 의심스러운 조기 종료
      if (actualDuration < estimatedDuration * 0.3) {
        console.log(`⚠️ 재생시간이 너무 짧음 (${actualDuration}ms < ${estimatedDuration * 0.3}ms) - 조기 종료 의심`);
        // 조기 종료로 의심되므로 약간 더 대기
        setTimeout(() => {
          if (this.isActive) {
            this.moveToNext(options);
          }
        }, 500);
        return;
      }

      this.moveToNext(options);
    };
    
    // 다음 문장으로 이동하는 별도 함수
    const moveToNext = (options) => {
      // TTS가 중지된 상태인지 확인
      if (!this.isActive || !this.isPlaying) {
        console.log('⚠️ TTS가 중지된 상태 - 다음 문장 이동 취소');
        return;
      }
      
      this.currentIndex++;
      
      // 다음 문장이 있으면 계속 재생
      if (this.currentIndex < this.sentences.length) {
        console.log(`➡️ 다음 문장으로 이동: ${this.currentIndex + 1}/${this.sentences.length}`);
        
        setTimeout(() => {
          if (this.isActive && this.isPlaying) {
            this.playNextSentence(options);
          } else {
            console.log('⚠️ TTS 상태 변경으로 다음 문장 재생 취소');
          }
        }, 20); // 모바일 최적화: 빠른 전환
      } else {
        console.log('🏁 마지막 문장 완료');
        this.isPlaying = false;
        if (this.onComplete) {
          this.onComplete();
        }
      }
    };
    
    this.moveToNext = moveToNext;

    utterance.onerror = (event) => {
      console.error(`❌ 문장 ${this.currentIndex + 1} 재생 에러:`, event.error);
      
      // interrupted 에러는 중지 명령에 의한 것이므로 다음 문장으로 진행하지 않음
      if (event.error === 'interrupted') {
        console.log('🛑 interrupted 에러 - 중지 명령에 의한 것으로 추정');
        return;
      }
      
      // 다른 에러 발생 시에만 다음 문장으로 진행 (추가 체크)
      if (!this.isActive || !this.isPlaying) {
        console.log('⚠️ 에러 후 TTS가 중지된 상태 - 다음 문장 진행 취소');
        return;
      }
      
      this.currentIndex++;
      
      if (this.currentIndex < this.sentences.length && this.isActive && this.isPlaying) {
        console.log('🔄 에러 발생, 다음 문장으로 계속 진행');
        setTimeout(() => {
          if (this.isActive && this.isPlaying) {
            this.playNextSentence(options);
          } else {
            console.log('⚠️ 에러 후 TTS 상태 변경으로 다음 문장 재생 취소');
          }
        }, 1000);
      } else {
        this.isPlaying = false;
        if (this.onError) {
          this.onError(event.error);
        }
      }
    };

    // 재생 실행
    this.currentUtterance = utterance;
    
    // 안전한 재생
    try {
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
        setTimeout(() => {
          if (this.isActive) {
            speechSynthesis.speak(utterance);
          }
        }, 200);
      } else {
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('재생 실행 에러:', error);
      this.currentIndex++;
      if (this.currentIndex < this.sentences.length && this.isActive) {
        setTimeout(() => this.playNextSentence(options), 1000);
      }
    }
  }

  /**
   * TTS 중지
   */
  stop() {
    console.log('🛑 SimpleMobileTTS 중지');
    
    this.isActive = false;
    this.isPlaying = false;
    
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    
    if (this.currentUtterance) {
      this.currentUtterance.onstart = null;
      this.currentUtterance.onend = null;
      this.currentUtterance.onerror = null;
      this.currentUtterance = null;
    }

    this.currentIndex = 0;
    this.sentences = [];
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
    if (this.sentences.length === 0) return 0;
    return this.currentIndex / this.sentences.length;
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
}

// 전역 인스턴스 관리
let globalSimpleMobileTTS = null;

export const createSimpleMobileTTS = () => {
  if (globalSimpleMobileTTS) {
    globalSimpleMobileTTS.stop();
  }
  globalSimpleMobileTTS = new SimpleMobileTTS();
  return globalSimpleMobileTTS;
};

export const getCurrentSimpleMobileTTS = () => {
  return globalSimpleMobileTTS;
};

export const stopCurrentSimpleMobileTTS = () => {
  if (globalSimpleMobileTTS) {
    globalSimpleMobileTTS.stop();
  }
};

// 전역 함수 노출
if (typeof window !== 'undefined') {
  window.createSimpleMobileTTS = createSimpleMobileTTS;
  window.getCurrentSimpleMobileTTS = getCurrentSimpleMobileTTS;
  window.stopCurrentSimpleMobileTTS = stopCurrentSimpleMobileTTS;
}

export default SimpleMobileTTS;