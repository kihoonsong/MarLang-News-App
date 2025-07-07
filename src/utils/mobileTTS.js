// 모바일 전용 TTS 유틸리티 - 청크 기반 처리로 모바일 브라우저 제약 해결

import { getEnglishVoice } from './speechUtils';

// 모바일 환경 감지
const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

/**
 * 모바일용 청크 기반 TTS 시스템
 * - 모바일 브라우저의 600단어 제한 문제 해결
 * - iOS Safari의 불안정한 TTS API 대응
 * - 사용자 상호작용 요구사항 충족
 */
export class MobileTTSController {
  constructor() {
    this.isActive = true;
    this.currentUtterance = null;
    this.isPlaying = false;
    this.chunks = [];
    this.currentChunkIndex = 0;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.onProgress = null;
    this.onComplete = null;
    this.onError = null;
    
    // 무한 루프 방지용 카운터
    this.totalOperations = 0;
    this.maxOperations = 1000;
    
    console.log('🎵 MobileTTSController 생성됨');
  }

  /**
   * 텍스트를 모바일 친화적 청크로 분할
   * @param {string} text - 분할할 텍스트
   * @returns {Array} 청크 배열
   */
  splitIntoChunks(text) {
    if (!text || text.trim().length === 0) return [];

    if (isMobile) {
      // 모바일: 단어 수 기준 청크 분할 (150단어 = 약 500자)
      const words = text.split(/\s+/);
      const chunkSize = 120; // 더 작은 청크로 안정성 확보
      const chunks = [];

      for (let i = 0; i < words.length; i += chunkSize) {
        const chunk = words.slice(i, i + chunkSize).join(' ');
        if (chunk.trim()) {
          // 청크 끝이 문장 중간에서 끊어지지 않도록 조정
          let adjustedChunk = chunk;
          if (i + chunkSize < words.length) {
            // 마지막 문장이 완성되도록 조정
            const lastSentenceEnd = Math.max(
              adjustedChunk.lastIndexOf('.'),
              adjustedChunk.lastIndexOf('!'),
              adjustedChunk.lastIndexOf('?')
            );
            
            if (lastSentenceEnd > adjustedChunk.length * 0.7) {
              adjustedChunk = adjustedChunk.substring(0, lastSentenceEnd + 1);
            }
          }
          
          chunks.push({
            text: adjustedChunk.trim(),
            index: chunks.length,
            wordCount: adjustedChunk.split(/\s+/).length
          });
        }
      }

      console.log(`📱 모바일 청크 분할: ${chunks.length}개 청크, 평균 ${Math.round(chunks.reduce((acc, c) => acc + c.wordCount, 0) / chunks.length)}단어`);
      return chunks;
    } else {
      // 데스크톱: 문장 단위 분할
      const sentences = text
        .split(/(?<=[.!?])\s+(?=[A-Z])/)
        .filter(s => s.trim().length > 0);

      return sentences.map((sentence, index) => ({
        text: sentence.trim(),
        index: index,
        wordCount: sentence.split(/\s+/).length
      }));
    }
  }

  /**
   * TTS 재생 시작
   * @param {string} text - 재생할 텍스트
   * @param {Object} options - 재생 옵션
   */
  async play(text, options = {}) {
    if (!text || text.trim().length === 0) {
      console.warn('⚠️ 재생할 텍스트가 없습니다.');
      return false;
    }

    // 기존 재생 중지
    this.stop();
    
    this.isActive = true;
    this.isPlaying = true;
    this.chunks = this.splitIntoChunks(text);
    this.currentChunkIndex = 0;
    this.retryCount = 0;

    if (this.chunks.length === 0) {
      console.warn('⚠️ 생성된 청크가 없습니다.');
      this.isPlaying = false;
      return false;
    }

    console.log(`🎵 모바일 TTS 시작: ${this.chunks.length}개 청크`);

    try {
      // 음성 로딩 및 준비
      const voice = await getEnglishVoice();
      
      // 모바일에서는 더 긴 초기 대기
      const initialWait = isMobile ? 1000 : 200;
      await new Promise(resolve => setTimeout(resolve, initialWait));

      // 청크 순차 재생 시작 (await 하지 않고 백그라운드에서 실행)
      this.playNextChunk(voice, options).catch(error => {
        console.error('❌ 청크 재생 중 에러:', error);
        this.isPlaying = false;
        if (this.onError) this.onError(error);
      });
      
      // 재생 시작 성공으로 즉시 반환
      console.log('✅ 모바일 TTS 재생 시작 성공');
      return true;
    } catch (error) {
      console.error('❌ 모바일 TTS 에러:', error);
      this.isPlaying = false;
      if (this.onError) this.onError(error);
      return false;
    }
  }

  /**
   * 다음 청크 재생 (무한 루프 방지 강화)
   * @param {SpeechSynthesisVoice} voice - 사용할 음성
   * @param {Object} options - 재생 옵션
   */
  async playNextChunk(voice, options = {}) {
    // 무한 루프 방지: 총 작업 수 제한
    this.totalOperations++;
    if (this.totalOperations > this.maxOperations) {
      console.error('❌ 최대 작업 수 초과! TTS 강제 종료');
      this.stop();
      return;
    }

    // 안전장치: 상태 검증
    if (!this.isActive || !this.isPlaying || this.currentChunkIndex >= this.chunks.length) {
      console.log('🛑 모바일 TTS 종료');
      this.isPlaying = false;
      if (this.onComplete) this.onComplete();
      return;
    }

    // 무한 루프 방지: 최대 청크 수 제한
    if (this.currentChunkIndex > this.chunks.length * 2) {
      console.error('❌ 무한 루프 감지! TTS 강제 종료');
      this.stop();
      return;
    }

    const chunk = this.chunks[this.currentChunkIndex];
    if (!chunk || !chunk.text) {
      console.warn('⚠️ 유효하지 않은 청크, 다음으로 이동');
      this.currentChunkIndex++;
      
      // 재귀 호출 대신 setTimeout으로 안전한 비동기 호출
      setTimeout(() => {
        if (this.isActive && this.currentChunkIndex < this.chunks.length) {
          this.playNextChunk(voice, options);
        }
      }, 100);
      return;
    }

    console.log(`📢 청크 ${this.currentChunkIndex + 1}/${this.chunks.length}: ${chunk.text.substring(0, 50)}...`);

    // 진행 상황 콜백
    if (this.onProgress) {
      this.onProgress(this.currentChunkIndex, this.chunks.length, chunk.text);
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(chunk.text);
      
      // 음성 설정
      utterance.rate = options.rate || 0.8;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;
      
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = 'en-US';
      }

      let hasStarted = false;
      let hasEnded = false;
      let timeoutId = null;

      // 성공 처리
      const handleSuccess = () => {
        if (hasEnded) return;
        hasEnded = true;
        
        if (timeoutId) clearTimeout(timeoutId);
        this.retryCount = 0; // 성공 시 재시도 카운트 리셋
        this.currentChunkIndex++;
        
        // 다음 청크 재생
        if (this.isActive && this.currentChunkIndex < this.chunks.length) {
          const delay = isMobile ? 800 : 300; // 청크 간 대기시간
          setTimeout(() => {
            this.playNextChunk(voice, options).then(resolve).catch(reject);
          }, delay);
        } else {
          resolve();
        }
      };

      // 에러 처리 (무한 루프 방지)
      const handleError = (error) => {
        if (hasEnded) return;
        hasEnded = true;
        
        if (timeoutId) clearTimeout(timeoutId);
        console.error('❌ 청크 재생 에러:', error);

        // 모바일에서는 재시도 로직 (무한 루프 방지)
        if (isMobile && this.retryCount < this.maxRetries && error !== 'canceled' && error !== 'timeout') {
          this.retryCount++;
          console.log(`🔄 청크 재시도 ${this.retryCount}/${this.maxRetries}`);
          
          // 재시도 시에는 같은 청크를 다시 시도 (인덱스 증가 안함)
          setTimeout(() => {
            // 새로운 Promise로 재시도 (무한 루프 방지)
            const retryUtterance = new SpeechSynthesisUtterance(chunk.text);
            retryUtterance.rate = utterance.rate;
            retryUtterance.pitch = utterance.pitch;
            retryUtterance.volume = utterance.volume;
            retryUtterance.voice = utterance.voice;
            retryUtterance.lang = utterance.lang;
            
            retryUtterance.onend = () => {
              this.retryCount = 0;
              this.currentChunkIndex++;
              
              if (this.isActive && this.currentChunkIndex < this.chunks.length) {
                setTimeout(() => {
                  this.playNextChunk(voice, options).then(resolve).catch(reject);
                }, 800);
              } else {
                resolve();
              }
            };
            
            retryUtterance.onerror = () => {
              // 재시도도 실패하면 다음 청크로 이동
              this.retryCount = 0;
              this.currentChunkIndex++;
              
              if (this.currentChunkIndex < this.chunks.length) {
                setTimeout(() => {
                  this.playNextChunk(voice, options).then(resolve).catch(reject);
                }, 500);
              } else {
                reject(new Error('재시도 실패 후 종료'));
              }
            };
            
            speechSynthesis.speak(retryUtterance);
          }, 1000);
        } else {
          // 재시도 한계 도달, timeout, canceled 또는 데스크톱 - 다음 청크로 이동
          this.retryCount = 0; // 카운트 리셋
          this.currentChunkIndex++;
          
          if (this.currentChunkIndex < this.chunks.length && this.isActive) {
            setTimeout(() => {
              this.playNextChunk(voice, options).then(resolve).catch(reject);
            }, 500);
          } else {
            resolve(); // 에러로 종료하지 말고 정상 종료
          }
        }
      };

      // 이벤트 리스너 설정
      utterance.onstart = () => {
        hasStarted = true;
        console.log(`▶️ 청크 ${this.currentChunkIndex + 1} 재생 시작`);
      };

      utterance.onend = handleSuccess;
      utterance.onerror = (event) => handleError(event.error);

      // 모바일용 타임아웃 설정 (무한 대기 방지)
      if (isMobile) {
        const timeoutDuration = Math.max(10000, chunk.wordCount * 100); // 단어당 100ms, 최소 10초
        timeoutId = setTimeout(() => {
          if (!hasStarted) {
            console.warn('⏰ 청크 재생 타임아웃');
            handleError('timeout');
          }
        }, timeoutDuration);
      }

      // 재생 실행
      this.currentUtterance = utterance;
      
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
        setTimeout(() => {
          speechSynthesis.speak(utterance);
        }, isMobile ? 300 : 100);
      } else {
        speechSynthesis.speak(utterance);
      }
    });
  }

  /**
   * TTS 중지
   */
  stop() {
    this.isActive = false;
    this.isPlaying = false;
    
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    
    if (this.currentUtterance) {
      this.currentUtterance = null;
    }

    // 모바일에서는 추가적인 정리
    if (isMobile) {
      setTimeout(() => {
        speechSynthesis.cancel();
      }, 100);
    }
  }

  /**
   * 현재 상태 확인
   */
  isRunning() {
    return this.isActive && this.isPlaying;
  }

  /**
   * 진행률 반환 (0-1)
   */
  getProgress() {
    if (this.chunks.length === 0) return 0;
    return this.currentChunkIndex / this.chunks.length;
  }

  /**
   * 이벤트 리스너 설정
   */
  setEventListeners({ onProgress, onComplete, onError }) {
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.onError = onError;
  }
}

// 전역 컨트롤러 관리
let globalMobileTTSController = null;

export const createMobileTTSController = () => {
  if (globalMobileTTSController) {
    globalMobileTTSController.stop();
  }
  globalMobileTTSController = new MobileTTSController();
  return globalMobileTTSController;
};

export const getCurrentMobileTTSController = () => {
  return globalMobileTTSController;
};

export const stopCurrentMobileTTS = () => {
  if (globalMobileTTSController) {
    globalMobileTTSController.stop();
  }
};

// 전역 함수로 노출
if (typeof window !== 'undefined') {
  window.createMobileTTSController = createMobileTTSController;
  window.getCurrentMobileTTSController = getCurrentMobileTTSController;
  window.stopCurrentMobileTTS = stopCurrentMobileTTS;
}

export default MobileTTSController;