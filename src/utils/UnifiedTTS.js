// 통합 TTS 엔진 - 모든 기능을 하나로 통합
// 밑줄 하이라이팅, 배속 조절, 정지 등 모든 기존 기능 유지

const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isAndroid = /Android/i.test(navigator.userAgent);

class UnifiedTTS {
  constructor(options = {}) {
    // 기본 설정
    this.options = {
      rate: 1.0,
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
    
    if (import.meta.env.DEV) {
      console.log('🎵 UnifiedTTS 초기화 - 플랫폼:', this.getPlatform());
      console.log('🔍 모바일 감지:', isMobile, 'iOS:', isIOS, 'Android:', isAndroid);
      console.log('🔍 User Agent:', navigator.userAgent);
    }
    
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
    if (!window.speechSynthesis) return;
    
    // iOS에서는 음성 로딩 대기
    if (isIOS) {
      const loadVoices = () => {
        return new Promise((resolve) => {
          const voices = window.speechSynthesis.getVoices();
          if (voices.length > 0) {
            resolve(voices);
          } else {
            window.speechSynthesis.onvoiceschanged = () => {
              resolve(window.speechSynthesis.getVoices());
            };
          }
        });
      };
      
      const voices = await loadVoices();
      // 영어 음성 우선 선택 (Siri 등)
      this.voice = voices.find(v => v.lang.startsWith('en-US') && v.name.includes('Siri')) ||
                   voices.find(v => v.lang.startsWith('en-US')) ||
                   voices.find(v => v.lang.startsWith('en')) ||
                   voices[0];
    } else {
      // 다른 플랫폼에서는 즉시 음성 설정
      const voices = window.speechSynthesis.getVoices();
      this.voice = voices.find(v => v.lang.startsWith('en-US')) ||
                   voices.find(v => v.lang.startsWith('en')) ||
                   voices[0];
    }
    
    if (this.voice && import.meta.env.DEV) {
      console.log('✅ 선택된 음성:', this.voice.name, this.voice.lang);
    }
  }

  /**
   * 텍스트를 문장으로 분할
   */
  splitIntoSentences(text) {
    // 기본 문장 분할 (마침표, 느낌표, 물음표)
    const sentences = text.split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 0)
      .map((text, index) => ({
        text: text.trim(),
        index,
        duration: this.estimateDuration(text.trim())
      }));
    
    if (import.meta.env.DEV) {
      console.log(`📝 ${sentences.length}개 문장으로 분할`);
    }
    
    return sentences;
  }

  /**
   * 재생 시간 추정 (개선된 버전)
   */
  estimateDuration(text) {
    if (!text) return 1000;
    
    const words = text.split(/\s+/).length;
    const characters = text.length;
    
    // 플랫폼별 시간 계산
    let baseTime;
    const rate = this.options.rate || 1.0;
    
    if (this.getPlatform() === 'iOS') {
      // iOS는 더 빠른 경향
      baseTime = (words * 400) + (characters * 50);
    } else {
      // Android/Desktop
      baseTime = (words * 500) + (characters * 60);
    }
    
    // 배속 적용
    const finalTime = Math.max(baseTime / rate, 1000);
    
    if (import.meta.env.DEV) {
      console.log(`⏱️ 예상 재생 시간: ${finalTime.toFixed(1)}초 (단어: ${words}, 문자: ${characters}, 플랫폼: ${this.getPlatform()})`);
    }
    
    return finalTime;
  }

  /**
   * TTS 재생 시작
   */
  async play(text) {
    if (import.meta.env.DEV) {
      console.log('🎯 [TTS] play 함수 시작 - 플랫폼:', this.getPlatform());
      console.log('🎯 [TTS] speechSynthesis 지원:', !!window.speechSynthesis);
      console.log('🎯 [TTS] 텍스트 길이:', text?.length);
    }
    
    if (!window.speechSynthesis || !text) {
      return false;
    }

    // 기존 재생 중지
    this.stop();
    
    // 상태 초기화
    this.isActive = true;
    this.isPlaying = true;
    this.isPaused = false;
    this.currentIndex = 0;
    this.retryCount = 0;
    
    // 텍스트 분할
    this.sentences = this.splitIntoSentences(text);
    
    if (this.sentences.length === 0) {
      return false;
    }

    // 시작 콜백
    if (this.onStart) {
      this.onStart();
    }

    if (import.meta.env.DEV) {
      console.log(`🎵 TTS 재생 시작: ${this.sentences.length}개 문장`);
    }
    
    // 첫 번째 문장 재생 시작
    this.playNextSentence();
    
    return true;
  }

  /**
   * 다음 문장 재생
   */
  playNextSentence() {
    if (import.meta.env.DEV) {
      console.log(`🎬 [${this.getPlatform()}] playNextSentence 시작`);
      console.log(`🔍 [${this.getPlatform()}] 상태 - isActive: ${this.isActive}, isPlaying: ${this.isPlaying}, isPaused: ${this.isPaused}`);
      console.log(`🔍 [${this.getPlatform()}] 인덱스 - current: ${this.currentIndex}, total: ${this.sentences.length}`);
    }
    
    // 상태 확인
    if (!this.isActive || !this.isPlaying || this.isPaused || this.currentIndex >= this.sentences.length) {
      if (import.meta.env.DEV) {
        console.log(`⏹️ [${this.getPlatform()}] playNextSentence 중단 - 조건 불만족`);
      }
      if (this.currentIndex >= this.sentences.length && this.isActive) {
        this.handleComplete();
      }
      return;
    }

    const sentence = this.sentences[this.currentIndex];
    
    // 새 문장 시작할 때 재시도 카운터 초기화
    if (this.retryCount === 0) {
      if (import.meta.env.DEV) {
        console.log(`📢 문장 ${this.currentIndex + 1}/${this.sentences.length}: ${sentence.text}`);
      }
    } else {
      if (import.meta.env.DEV) {
        console.log(`🔄 [${this.getPlatform()}] 문장 ${this.currentIndex + 1} 재시도 ${this.retryCount}회`);
      }
    }

    // 진행률 콜백 (밑줄 하이라이팅용)
    if (this.onProgress) {
      if (import.meta.env.DEV) {
        console.log(`🎯 [${this.getPlatform()}] Progress callback: sentence ${this.currentIndex + 1}/${this.sentences.length}`);
      }
      
      this.onProgress(
        this.currentIndex,
        this.sentences.length,
        sentence.text,
        {
          platform: this.getPlatform(),
          retryCount: this.retryCount,
          estimatedDuration: sentence.duration
        }
      );
    }

    // SpeechSynthesisUtterance 생성
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
      if (import.meta.env.DEV) {
        console.log(`▶️ 문장 ${this.currentIndex + 1} 재생 시작`);
      }
      // 실제 재생 시작 플래그 설정
      if (this.currentUtterance) {
        this.currentUtterance._hasStarted = true;
      }
    };

    utterance.onend = () => {
      const actualDuration = Date.now() - startTime;
      if (import.meta.env.DEV) {
        console.log(`✅ [${this.getPlatform()}] 문장 ${this.currentIndex + 1} 재생 완료 (${actualDuration}ms)`);
        console.log(`🔍 [${this.getPlatform()}] onend 상태: isActive=${this.isActive}, isPlaying=${this.isPlaying}, isPaused=${this.isPaused}`);
      }
      
      // 타이머 정리
      this.clearTimers();
      
      // 상태 확인 후 다음 문장으로 이동
      if (this.isActive && this.isPlaying && !this.isPaused) {
        if (import.meta.env.DEV) {
          console.log(`➡️ [${this.getPlatform()}] onend에서 다음 문장으로 이동`);
        }
        this.moveToNextSentence();
      } else {
        if (import.meta.env.DEV) {
          console.log(`❌ [${this.getPlatform()}] onend 이동 취소: isActive=${this.isActive}, isPlaying=${this.isPlaying}, isPaused=${this.isPaused}`);
        }
      }
    };

    utterance.onerror = (event) => {
      if (import.meta.env.DEV) {
        console.error(`❌ [${this.getPlatform()}] 문장 ${this.currentIndex + 1} 재생 에러:`, event.error);
      }
      
      // interrupted 에러는 중지 명령에 의한 것이므로 무시
      if (event.error === 'interrupted') {
        if (import.meta.env.DEV) {
          console.log(`🛑 [${this.getPlatform()}] 중지 명령에 의한 interrupted 에러`);
        }
        return;
      }
      
      // iOS의 canceled 에러 처리 - 재시도 우선
      if (event.error === 'canceled' && this.getPlatform() === 'iOS') {
        // 조기 감지에서 온 경우 _startTime 사용, 아니면 실제 startTime 사용
        const actualStartTime = this.currentUtterance?._startTime || startTime;
        const elapsedTime = Date.now() - actualStartTime;
        const maxRetries = 2; // 최대 2회 재시도
        
        if (import.meta.env.DEV) {
          console.log(`🍎 [iOS] canceled 에러 감지 - 경과 시간: ${elapsedTime}ms, 재시도: ${this.retryCount}/${maxRetries}`);
        }
        
        // 재시도 횟수가 남아있으면 재시도
        if (this.retryCount < maxRetries) {
          this.retryCount++;
          if (import.meta.env.DEV) {
            console.log(`🔄 [iOS] 음성 재시도 시작 (${this.retryCount}/${maxRetries})`);
          }
          
          // iOS는 speechSynthesis 초기화 후 재시도가 더 안정적
          setTimeout(() => {
            if (this.isActive && this.isPlaying && !this.isPaused) {
              if (import.meta.env.DEV) {
                console.log(`🔄 [iOS] speechSynthesis 초기화 후 재시도`);
              }
              // speechSynthesis 정리 후 재시도
              window.speechSynthesis.cancel();
              setTimeout(() => {
                this.playNextSentence();
              }, 100);
            }
          }, 200);
          return;
        } else {
          // 최대 재시도 횟수 초과시 다음 문장으로
          if (import.meta.env.DEV) {
            console.log(`🍎 [iOS] 최대 재시도 횟수 초과 - 다음 문장으로 진행`);
          }
        }
      }
      
      // 타이머 정리
      this.clearTimers();
      
      // 에러 발생 시 다음 문장으로 이동 (상태 확인)
      if (this.isActive && this.isPlaying && !this.isPaused) {
        if (import.meta.env.DEV) {
          console.log(`🔄 [${this.getPlatform()}] 에러 후 다음 문장으로 진행`);
        }
        this.moveToNextSentence();
      } else {
        if (import.meta.env.DEV) {
          console.log(`❌ [${this.getPlatform()}] 에러 후 이동 취소: isActive=${this.isActive}, isPlaying=${this.isPlaying}, isPaused=${this.isPaused}`);
        }
      }
    };

    // 현재 utterance 참조 저장
    this.currentUtterance = utterance;
    this.currentUtterance._startTime = startTime; // iOS 조기 감지용
    
    // 플랫폼별 안전한 재생 시작
    try {
      // iOS에서 더 안정적인 speechSynthesis 상태 관리
      if (speechSynthesis.speaking || speechSynthesis.pending) {
        if (import.meta.env.DEV) {
          console.log(`🔄 [${this.getPlatform()}] 기존 재생 중지 후 새 문장 시작 (speaking: ${speechSynthesis.speaking}, pending: ${speechSynthesis.pending})`);
        }
        speechSynthesis.cancel();
        
        // iOS에서는 cancel 후 초고속 정리
        const waitTime = this.getPlatform() === 'iOS' ? 100 : 50;
        setTimeout(() => {
          if (this.isActive && this.isPlaying && !this.isPaused) {
            if (import.meta.env.DEV) {
              console.log(`🎵 [${this.getPlatform()}] 문장 ${this.currentIndex + 1} 재생 시작 (상태 정리 후)`);
              console.log(`🔊 [${this.getPlatform()}] speechSynthesis.speak() 호출중...`);
            }
            speechSynthesis.speak(utterance);
            setTimeout(() => {
              if (import.meta.env.DEV) {
                console.log(`✅ [${this.getPlatform()}] speechSynthesis.speak() 성공`);
              }
            }, 10);
            
            // 백업 타이머 설정
            this.setBackupTimer(sentence.duration);
            
            // iOS 조기 감지 타이머 설정
            if (this.getPlatform() === 'iOS') {
              this.setEarlyDetectionTimer(sentence);
            }
          }
        }, waitTime);
      } else {
        // 즉시 재생 가능
        if (import.meta.env.DEV) {
          console.log(`🎵 [${this.getPlatform()}] 문장 ${this.currentIndex + 1} 재생 시작 (즉시)`);
          console.log(`🔊 [${this.getPlatform()}] speechSynthesis.speak() 호출중...`);
        }
        speechSynthesis.speak(utterance);
        setTimeout(() => {
          if (import.meta.env.DEV) {
            console.log(`✅ [${this.getPlatform()}] speechSynthesis.speak() 성공`);
          }
        }, 10);
        
        // 백업 타이머 설정
        this.setBackupTimer(sentence.duration);
        
        // iOS 조기 감지 타이머 설정
        if (this.getPlatform() === 'iOS') {
          this.setEarlyDetectionTimer(sentence);
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(`❌ [${this.getPlatform()}] speechSynthesis.speak() 실행 에러:`, error);
      }
      this.moveToNextSentence();
    }
  }

  /**
   * 백업 타이머 설정 (onend 이벤트가 발생하지 않을 때 대비)
   */
  setBackupTimer(expectedDuration) {
    const bufferTime = 2000; // 2초 여유시간
    const timerDuration = expectedDuration + bufferTime;
    
    if (import.meta.env.DEV) {
      console.log(`⏰ [${this.getPlatform()}] 백업 타이머 설정: ${timerDuration}ms (예상: ${expectedDuration}ms + 여유: ${bufferTime}ms)`);
    }
    
    this.backupTimer = setTimeout(() => {
      if (this.isActive && this.isPlaying && !this.isPaused) {
        if (import.meta.env.DEV) {
          console.log(`⏰ [${this.getPlatform()}] 백업 타이머 실행: 문장 ${this.currentIndex + 1} 강제 완료`);
        }
        this.moveToNextSentence();
      } else {
        if (import.meta.env.DEV) {
          console.log(`⏰ [${this.getPlatform()}] 백업 타이머 취소: TTS 중지됨`);
        }
      }
    }, timerDuration);
  }

  /**
   * iOS 조기 감지 타이머 설정
   */
  setEarlyDetectionTimer(sentence) {
    // 단어 수에 따라 조기 감지 시간 조정
    const wordCount = sentence.text.split(/\s+/).length;
    const earlyDetectionTime = Math.min(wordCount * 100, 1000); // 최대 1초
    
    if (import.meta.env.DEV) {
      console.log(`🚨 [iOS] 조기 감지 타이머 설정: ${earlyDetectionTime}ms (단어수: ${wordCount})`);
    }
    
    this.earlyDetectionTimer = setTimeout(() => {
      if (this.currentUtterance && this.isActive && this.isPlaying && !this.isPaused) {
        const isSpeaking = speechSynthesis.speaking;
        const hasStarted = this.currentUtterance._hasStarted;
        
        // 실제로 무음으로 재생된 경우 감지
        if (!isSpeaking && !hasStarted) {
          if (import.meta.env.DEV) {
            console.log(`🚨 [iOS] 조기 감지: 실제 무음 재생 감지 - 재시도 (speaking: ${isSpeaking}, started: ${hasStarted})`);
          }
          
          // 재시도 횟수 확인
          const maxRetries = 2;
          if (this.retryCount < maxRetries) {
            this.retryCount++;
            
            // speechSynthesis 초기화 후 재시도
            speechSynthesis.cancel();
            
            setTimeout(() => {
              if (this.isActive && this.isPlaying && !this.isPaused) {
                if (import.meta.env.DEV) {
                  console.log(`🔄 [iOS] 조기 감지 후 재시도`);
                }
                this.playNextSentence();
              }
            }, 150);
          }
        } else {
          if (import.meta.env.DEV) {
            console.log(`🚨 [iOS] 조기 감지 건너뜀: speaking=${isSpeaking}, started=${hasStarted}, retryCount=${this.retryCount}`);
          }
        }
      }
    }, earlyDetectionTime);
  }

  /**
   * 다음 문장으로 이동
   */
  moveToNextSentence() {
    if (import.meta.env.DEV) {
      console.log(`📍 [${this.getPlatform()}] moveToNextSentence 호출: current=${this.currentIndex}, total=${this.sentences.length}`);
      console.log(`🔍 [${this.getPlatform()}] 상태 확인: isActive=${this.isActive}, isPlaying=${this.isPlaying}, isPaused=${this.isPaused}`);
    }
    
    if (!this.isActive || !this.isPlaying || this.isPaused) {
      if (import.meta.env.DEV) {
        console.log(`❌ [${this.getPlatform()}] moveToNextSentence 취소: 상태 불만족`);
      }
      return;
    }

    this.retryCount = 0; // 다음 문장으로 이동할 때 재시도 카운터 초기화
    this.currentIndex++;
    
    if (import.meta.env.DEV) {
      console.log(`➡️ [${this.getPlatform()}] 다음 문장으로 이동: ${this.currentIndex}/${this.sentences.length}`);
    }

    if (this.currentIndex < this.sentences.length) {
      // 문장 간 짧은 지연 (자연스러운 흐름)
      const delay = this.getPlatform() === 'iOS' ? 200 : 100;
      if (import.meta.env.DEV) {
        console.log(`⏳ [${this.getPlatform()}] ${delay}ms 후 다음 문장 재생`);
      }
      
      this.playTimer = setTimeout(() => {
        if (this.isActive && this.isPlaying && !this.isPaused) {
          if (import.meta.env.DEV) {
            console.log(`▶️ [${this.getPlatform()}] 지연 후 다음 문장 재생 시작`);
          }
          this.playNextSentence();
        } else {
          if (import.meta.env.DEV) {
            console.log(`❌ [${this.getPlatform()}] 지연 후 재생 취소: 상태 변경됨`);
          }
        }
      }, delay);
    } else {
      if (import.meta.env.DEV) {
        console.log(`🏁 [${this.getPlatform()}] 모든 문장 재생 완료`);
      }
      this.handleComplete();
    }
  }

  /**
   * 재생 완료 처리
   */
  handleComplete() {
    if (import.meta.env.DEV) {
      console.log('🏁 모든 문장 재생 완료');
    }
    
    this.stop();
    
    if (this.onComplete) {
      this.onComplete();
    }
  }

  /**
   * 일시정지
   */
  pause() {
    if (import.meta.env.DEV) {
      console.log('⏸️ TTS 일시정지');
    }
    
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      if (window.speechSynthesis.pause) {
        window.speechSynthesis.pause();
      } else {
        // pause가 지원되지 않는 경우 cancel 사용
        window.speechSynthesis.cancel();
      }
    }
    
    this.isPaused = true;
    this.clearTimers();
    
    if (this.onPause) {
      this.onPause();
    }
  }

  /**
   * 재생 재개
   */
  resume() {
    if (import.meta.env.DEV) {
      console.log('▶️ TTS 재생 재개');
    }
    
    if (this.isPaused) {
      this.isPaused = false;
      
      if (window.speechSynthesis && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else {
        // resume이 안되거나 paused 상태가 아닌 경우 현재 문장부터 다시 시작
        this.playNextSentence();
      }
      
      if (this.onResume) {
        this.onResume();
      }
    }
  }

  /**
   * 완전 중지
   */
  stop() {
    if (import.meta.env.DEV) {
      console.log('🛑 TTS 완전 중지');
    }
    
    this.isActive = false;
    this.isPlaying = false;
    this.isPaused = false;
    this.currentIndex = 0;
    this.retryCount = 0;
    
    // speechSynthesis 중지
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    // 현재 utterance 정리
    this.currentUtterance = null;
    
    // 모든 타이머 정리
    this.clearTimers();
  }

  /**
   * 타이머 정리
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
   * 재생 속도 변경
   */
  setSpeed(rate) {
    if (import.meta.env.DEV) {
      console.log('⚡ 배속 변경:', this.options.rate, '→', rate);
    }
    
    this.options.rate = rate;
    
    // 현재 재생 중인 경우 즉시 적용
    if (this.isRunning()) {
      if (import.meta.env.DEV) {
        console.log('🔄 재생 중 배속 변경 - 현재 문장 중단 후 새 속도로 재시작');
      }
      
      // 현재 문장 중단
      this.clearTimers();
      window.speechSynthesis.cancel();
      
      // 짧은 지연 후 새 속도로 재시작
      setTimeout(() => {
        if (this.isActive && this.isPlaying && !this.isPaused) {
          this.playNextSentence();
        }
      }, 100);
    }
  }

  /**
   * 현재 재생 중인지 확인
   */
  isRunning() {
    return this.isActive && this.isPlaying && !this.isPaused;
  }

  /**
   * 현재 상태 반환
   */
  getStatus() {
    return {
      isActive: this.isActive,
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentIndex: this.currentIndex,
      totalSentences: this.sentences.length,
      progress: this.sentences.length > 0 ? (this.currentIndex / this.sentences.length) * 100 : 0,
      platform: this.getPlatform(),
      retryCount: this.retryCount
    };
  }
}

// 팩토리 함수
export function createUnifiedTTS(options = {}) {
  return new UnifiedTTS(options);
}

export default UnifiedTTS;