// Ultra Simple TTS - 모바일 문제 완전 해결을 위한 최종 버전
// onend 이벤트 의존성 제거, 타이머 기반 제어

const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

class UltraSimpleTTS {
  constructor() {
    this.isActive = false;
    this.isPlaying = false;
    this.isMoving = false; // 중복 이동 방지 플래그
    this.sentences = [];
    this.currentIndex = 0;
    this.currentUtterance = null;
    this.onProgress = null;
    this.onComplete = null;
    this.onError = null;
    this.onStart = null;
    this.voice = null;
    this.playTimer = null;
    this.forceNextTimer = null;
    
    console.log('🚀 UltraSimpleTTS 초기화됨 - 모바일 최적화');
    this.initializeVoice();
  }

  /**
   * 음성 초기화
   */
  async initializeVoice() {
    try {
      const voices = speechSynthesis.getVoices();
      
      if (voices.length === 0) {
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
   * 텍스트를 문장으로 분할
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
    sentences.forEach((s, i) => {
      console.log(`${i + 1}: ${s.text.substring(0, 50)}...`);
    });
    
    return sentences;
  }

  /**
   * 문장의 예상 재생 시간 계산 (더 정확하게)
   */
  calculatePlayTime(text, rate = 0.8) {
    const words = text.split(/\s+/).length;
    
    // 더 정확한 WPM 계산 (실제 TTS 속도 반영)
    const baseWPM = 100; // 기본 WPM을 더 느리게 (실제 TTS 속도)
    const wordsPerMinute = baseWPM * rate;
    const timeInSeconds = (words / wordsPerMinute) * 60;
    
    // 문자 수 기반 계산 (더 보수적)
    const charBasedTime = text.length * 0.08; // 글자당 0.08초 (약간 줄임)
    const wordBasedTime = timeInSeconds;
    
    // 둘 중 더 긴 시간 사용
    const estimatedTime = Math.max(wordBasedTime, charBasedTime);
    
    // 최소 3초, 최대 20초 (더 넉넉하게)
    const finalTime = Math.max(Math.min(estimatedTime, 20), 3);
    
    console.log(`⏱️ 예상 재생 시간: ${finalTime.toFixed(1)}초 (${words}단어, ${text.length}글자)`);
    return finalTime * 1000; // 밀리초로 변환
  }

  /**
   * TTS 재생 시작
   */
  async play(text, options = {}) {
    if (!text || text.trim().length === 0) {
      console.warn('⚠️ 재생할 텍스트가 없습니다');
      return false;
    }

    this.stop(); // 기존 재생 완전 중지
    
    this.sentences = this.splitIntoSentences(text);
    if (this.sentences.length === 0) {
      console.warn('⚠️ 분할된 문장이 없습니다');
      return false;
    }

    this.isActive = true;
    this.isPlaying = true;
    this.currentIndex = 0;

    console.log(`🎵 UltraSimpleTTS 재생 시작: ${this.sentences.length}개 문장`);

    if (this.onStart) {
      this.onStart();
    }

    // 첫 번째 문장부터 재생
    this.playNextSentence(options);
    return true;
  }

  /**
   * 다음 문장 재생 - 안정적인 제어
   */
  playNextSentence(options = {}) {
    // 기존 타이머들 정리
    if (this.playTimer) {
      clearTimeout(this.playTimer);
      this.playTimer = null;
    }

    // 상태 확인 (중복 호출 방지)
    if (!this.isActive || !this.isPlaying || this.currentIndex >= this.sentences.length || this.isMoving) {
      console.log('🏁 재생 조건 불만족 - 종료', {
        isActive: this.isActive,
        isPlaying: this.isPlaying,
        currentIndex: this.currentIndex,
        totalSentences: this.sentences.length,
        isMoving: this.isMoving
      });
      if (this.currentIndex >= this.sentences.length) {
        this.isPlaying = false;
        if (this.onComplete) {
          this.onComplete();
        }
      }
      return;
    }

    const sentence = this.sentences[this.currentIndex];
    console.log(`📢 문장 ${this.currentIndex + 1}/${this.sentences.length}: ${sentence.text}`);

    // 진행 상황 콜백 (먼저 호출)
    if (this.onProgress) {
      this.onProgress(this.currentIndex, this.sentences.length, sentence.text, sentence);
    }

    // SpeechSynthesisUtterance 생성
    const utterance = new SpeechSynthesisUtterance(sentence.text);
    
    utterance.rate = options.rate || 0.8;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 1.0;
    
    if (this.voice) {
      utterance.voice = this.voice;
      utterance.lang = this.voice.lang;
    } else {
      utterance.lang = 'en-US';
    }

    // 간단한 onend 이벤트 처리
    utterance.onend = () => {
      console.log(`✅ onend 이벤트: 문장 ${this.currentIndex + 1} 완료`);
      
      // 타이머들 정리
      if (this.playTimer) {
        clearTimeout(this.playTimer);
        this.playTimer = null;
      }
      
      // 상태 체크 후 다음 문장으로 이동
      if (this.isActive && this.isPlaying && !this.isMoving) {
        console.log('→ onend에서 다음 문장으로 이동');
        this.moveToNextSentence(options);
      } else {
        console.log(`onend 다음 문장 이동 취소 - isActive: ${this.isActive}, isPlaying: ${this.isPlaying}, isMoving: ${this.isMoving}`);
      }
    };

    utterance.onerror = (event) => {
      console.error(`❌ 문장 ${this.currentIndex + 1} 에러:`, event.error);
      
      // interrupted 에러는 중지 명령에 의한 것이므로 다음 문장으로 진행하지 않음
      if (event.error === 'interrupted') {
        console.log('🛑 interrupted 에러 - 중지 명령에 의한 것으로 추정');
        return;
      }
      
      // 타이머들 정리
      if (this.playTimer) {
        clearTimeout(this.playTimer);
        this.playTimer = null;
      }
      if (this.forceNextTimer) {
        clearTimeout(this.forceNextTimer);
        this.forceNextTimer = null;
      }
      
      // 다른 에러 시에만 다음 문장으로 진행 (추가 체크)
      if (this.isActive && this.isPlaying && !this.isMoving) {
        console.log('🔄 에러 발생으로 다음 문장으로 진행');
        this.moveToNextSentence(options);
      } else {
        console.log(`에러 후 다음 문장 이동 취소 - isActive: ${this.isActive}, isPlaying: ${this.isPlaying}, isMoving: ${this.isMoving}`);
      }
    };

    // 재생 실행 - 안전한 방식
    this.currentUtterance = utterance;
    
    try {
      // speechSynthesis 상태 확인 및 정리
      if (speechSynthesis.speaking || speechSynthesis.pending) {
        console.log('🔄 기존 재생 중지 후 새 문장 시작');
        speechSynthesis.cancel();
        
        // 충분한 시간 대기 후 재생
        setTimeout(() => {
          if (this.isActive && this.currentUtterance === utterance) {
            console.log(`🎵 문장 ${this.currentIndex + 1} 재생 시작 (지연 후)`);
            speechSynthesis.speak(utterance);
          }
        }, 200);
      } else {
        console.log(`🎵 문장 ${this.currentIndex + 1} 재생 시작 (즉시)`);
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('재생 실행 에러:', error);
      if (this.isActive && !this.isMoving) {
        this.moveToNextSentence(options);
      }
      return;
    }

    // 안전한 백업 타이머 (onend 이벤트 실패 시에만)
    const expectedDuration = this.calculatePlayTime(sentence.text, utterance.rate);
    this.playTimer = setTimeout(() => {
      if (this.isActive && this.isPlaying && !this.isMoving) {
        console.log(`⏰ 백업 타이머: 문장 ${this.currentIndex + 1} 완료 (onend 실패 추정)`);
        this.moveToNextSentence(options);
      } else {
        console.log(`⏰ 백업 타이머 취소 - TTS 중지됨`);
      }
    }, expectedDuration + 500); // 예상 시간 + 500ms 여유
  }

  /**
   * 다음 문장으로 이동 (중복 호출 방지)
   */
  moveToNextSentence(options) {
    // 이미 이동 중이거나 비활성 상태면 무시
    if (!this.isActive || this.isMoving) {
      console.log('⚠️ 중복 이동 요청 무시 - isActive:', this.isActive, 'isMoving:', this.isMoving);
      return;
    }
    
    // TTS가 중지된 상태인지 추가 확인
    if (!this.isPlaying) {
      console.log('⚠️ TTS가 중지된 상태 - 다음 문장 이동 취소');
      return;
    }
    
    this.isMoving = true; // 이동 플래그 설정
    
    // 타이머들 정리
    if (this.playTimer) {
      clearTimeout(this.playTimer);
      this.playTimer = null;
    }
    if (this.forceNextTimer) {
      clearTimeout(this.forceNextTimer);
      this.forceNextTimer = null;
    }
    
    this.currentIndex++;
    
    if (this.currentIndex < this.sentences.length && this.isActive) {
      console.log(`➡️ 다음 문장으로 이동: ${this.currentIndex + 1}/${this.sentences.length}`);
      
      // 즉시 다음 문장 재생 (지연 없음)
      this.isMoving = false; // 이동 플래그 해제
      
      // 환경별 최적화된 지연 시간
      const delay = isMobile ? 20 : 50; // 모바일에서 더 빠른 전환
      setTimeout(() => {
        if (this.isActive && this.isPlaying) {
          this.playNextSentence(options);
        }
      }, delay);
    } else {
      console.log('🏁 마지막 문장 완료');
      this.isMoving = false; // 이동 플래그 해제
      this.isPlaying = false;
      if (this.onComplete) {
        this.onComplete();
      }
    }
  }

  /**
   * TTS 완전 중지 (즉시 중지 버전)
   */
  stop() {
    console.log('🛑 UltraSimpleTTS 즉시 완전 중지 시작');
    
    // 즉시 모든 플래그 비활성화
    this.isActive = false;
    this.isPlaying = false;
    this.isMoving = false;
    
    // 모든 타이머 즉시 정리
    if (this.playTimer) {
      clearTimeout(this.playTimer);
      this.playTimer = null;
    }
    if (this.forceNextTimer) {
      clearTimeout(this.forceNextTimer);
      this.forceNextTimer = null;
    }
    
    // speechSynthesis 즉시 중지 (이벤트 정리 전에)
    try {
      if (speechSynthesis.speaking || speechSynthesis.pending) {
        console.log('🔇 speechSynthesis 즉시 중지');
        speechSynthesis.cancel();
      }
    } catch (error) {
      console.error('speechSynthesis 중지 중 에러:', error);
    }
    
    // 현재 utterance 완전 정리 (speechSynthesis 중지 후)
    if (this.currentUtterance) {
      this.currentUtterance.onstart = null;
      this.currentUtterance.onend = null;
      this.currentUtterance.onerror = null;
      this.currentUtterance.onpause = null;
      this.currentUtterance.onresume = null;
      this.currentUtterance.onmark = null;
      this.currentUtterance.onboundary = null;
      this.currentUtterance = null;
    }

    // 상태 완전 초기화
    this.currentIndex = 0;
    this.sentences = [];
    
    console.log('✅ UltraSimpleTTS 즉시 완전 중지 완료');
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
let globalUltraSimpleTTS = null;

export const createUltraSimpleTTS = () => {
  if (globalUltraSimpleTTS) {
    globalUltraSimpleTTS.stop();
  }
  globalUltraSimpleTTS = new UltraSimpleTTS();
  return globalUltraSimpleTTS;
};

export const getCurrentUltraSimpleTTS = () => {
  return globalUltraSimpleTTS;
};

export const stopCurrentUltraSimpleTTS = () => {
  if (globalUltraSimpleTTS) {
    globalUltraSimpleTTS.stop();
  }
};

// 전역 함수 노출
if (typeof window !== 'undefined') {
  window.createUltraSimpleTTS = createUltraSimpleTTS;
  window.getCurrentUltraSimpleTTS = getCurrentUltraSimpleTTS;
  window.stopCurrentUltraSimpleTTS = stopCurrentUltraSimpleTTS;
}

export default UltraSimpleTTS;