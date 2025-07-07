// 단순하고 안정적인 TTS 시스템 (모바일/데스크톱 통합)

import { getEnglishVoice } from './speechUtils';

export const createSimpleTTSController = () => {
  return {
    isActive: true,
    stop() {
      this.isActive = false;
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
    },
    isRunning() {
      return this.isActive;
    }
  };
};

export const playSimpleTTS = async (text, options = {}, callbacks = {}) => {
  console.log('🎵 Simple TTS 시작');
  
  // 기존 재생 중지
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }

  if (!text || text.trim().length === 0) {
    console.warn('⚠️ 재생할 텍스트가 없습니다.');
    return false;
  }

  // 단순한 문장 분할
  const sentences = text
    .split(/[.!?]+/)
    .filter(s => s.trim().length > 0)
    .map(s => s.trim());
  
  if (sentences.length === 0) {
    console.warn('⚠️ 재생할 문장이 없습니다.');
    return false;
  }
  
  console.log('📝 문장 개수:', sentences.length);

  try {
    // 음성 로딩
    const englishVoice = await getEnglishVoice();
    console.log('✅ 음성 로딩 완료');
    
    // 즉시 성공 반환 (로딩 해제용)
    if (callbacks.onStart) {
      callbacks.onStart();
    }
    
    let currentIndex = 0;
    const controller = options.controller;

    const playNextSentence = () => {
      if (!controller?.isRunning() || currentIndex >= sentences.length) {
        console.log('🛑 Simple TTS 종료');
        if (callbacks.onComplete) {
          callbacks.onComplete();
        }
        return;
      }
      
      const sentence = sentences[currentIndex].trim();
      if (!sentence) {
        currentIndex++;
        setTimeout(playNextSentence, 100);
        return;
      }

      console.log(`📢 문장 ${currentIndex + 1}/${sentences.length}: ${sentence.substring(0, 50)}...`);

      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.rate = options.rate || 0.8;
      utterance.volume = options.volume || 1.0;
      utterance.pitch = options.pitch || 1.0;
      
      if (englishVoice) {
        utterance.voice = englishVoice;
        utterance.lang = englishVoice.lang;
      } else {
        utterance.lang = 'en-US';
      }

      utterance.onstart = () => {
        console.log(`▶️ 문장 ${currentIndex + 1} 재생 시작`);
        if (callbacks.onProgress) {
          callbacks.onProgress(currentIndex, sentences.length);
        }
      };
      
      utterance.onend = () => {
        console.log(`⏹️ 문장 ${currentIndex + 1} 재생 완료`);
        currentIndex++;
        
        // 모바일에서 더 긴 대기
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        const delay = isMobile ? 1000 : 300;
        setTimeout(playNextSentence, delay);
      };
      
      utterance.onerror = (event) => {
        console.error('❌ TTS Error:', event.error);
        currentIndex++;
        
        if (callbacks.onError) {
          callbacks.onError(event.error);
        }
        
        setTimeout(playNextSentence, 1000);
      };
      
      speechSynthesis.speak(utterance);
    };
    
    // 첫 번째 문장 재생 시작
    setTimeout(playNextSentence, 100);
    
    return true;
    
  } catch (error) {
    console.error('❌ Simple TTS 에러:', error);
    if (callbacks.onError) {
      callbacks.onError(error);
    }
    return false;
  }
};

// 전역 함수로 노출
if (typeof window !== 'undefined') {
  window.createSimpleTTSController = createSimpleTTSController;
  window.playSimpleTTS = playSimpleTTS;
}