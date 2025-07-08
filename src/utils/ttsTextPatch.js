/**
 * TTS 전용 텍스트 최적화 유틸리티
 * 시각적 표시에는 영향을 주지 않고 TTS 음성 출력만 최적화
 */

/**
 * iOS TTS 최적화: 얇은 공백으로 치환하여 문장 간 긴 간격 해결
 * @param {string} text - 원본 텍스트
 * @returns {string} - TTS 최적화된 텍스트
 */
export const patchForIOSTTS = (text) => {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // iOS TTS 엔진이 문장부호 뒤 공백을 길게 해석하는 문제 해결
  // 얇은 공백(thin space, U+2009)으로 치환하여 자연스러운 텀 생성
  return text
    .replace(/\. /g, '.\u2009')    // 마침표 뒤 공백
    .replace(/! /g, '!\u2009')     // 느낌표 뒤 공백
    .replace(/\? /g, '?\u2009')    // 물음표 뒤 공백
    .replace(/; /g, ';\u2009')     // 세미콜론 뒤 공백
    .replace(/: /g, ':\u2009');    // 콜론 뒤 공백
};

/**
 * 긴 문장을 자연스럽게 세분화하여 TTS 리듬 개선
 * @param {string} text - 원본 텍스트
 * @param {number} maxWords - 문장당 최대 단어 수 (기본 30)
 * @returns {string} - 세분화된 텍스트
 */
export const splitLongSentencesForTTS = (text, maxWords = 30) => {
  if (!text || typeof text !== 'string') {
    return text;
  }

  return text
    .split(/(?<=[.!?])\s+/)
    .map(sentence => {
      const words = sentence.split(/\s+/);
      if (words.length <= maxWords) {
        return sentence;
      }

      // 긴 문장을 쉼표, 세미콜론, 대시 등으로 분할
      const subSentences = sentence
        .split(/([,;:—-])\s+/)
        .map(s => s.trim())
        .filter(Boolean);

      return subSentences.join(' ');
    })
    .join(' ');
};

/**
 * 종합 TTS 텍스트 최적화 함수
 * @param {string} text - 원본 텍스트
 * @param {Object} options - 최적화 옵션
 * @returns {string} - 최적화된 텍스트
 */
export const optimizeTextForTTS = (text, options = {}) => {
  if (!text || typeof text !== 'string') {
    return text;
  }

  const {
    enableIOSPatch = true,
    enableLongSentenceSplit = true,
    maxWordsPerSentence = 30
  } = options;

  let optimizedText = text;

  // 1단계: 긴 문장 세분화
  if (enableLongSentenceSplit) {
    optimizedText = splitLongSentencesForTTS(optimizedText, maxWordsPerSentence);
  }

  // 2단계: iOS TTS 최적화
  if (enableIOSPatch) {
    optimizedText = patchForIOSTTS(optimizedText);
  }

  console.log('🎵 TTS 텍스트 최적화 완료:', {
    originalLength: text.length,
    optimizedLength: optimizedText.length,
    enableIOSPatch,
    enableLongSentenceSplit
  });

  return optimizedText;
};

/**
 * 디버깅용: 최적화 전후 비교 출력
 * @param {string} originalText - 원본 텍스트
 * @param {string} optimizedText - 최적화된 텍스트
 */
export const debugTTSOptimization = (originalText, optimizedText) => {
  if (import.meta.env.DEV) {
    console.group('🔍 TTS 최적화 디버깅');
    console.log('원본 텍스트:', originalText.substring(0, 100) + '...');
    console.log('최적화된 텍스트:', optimizedText.substring(0, 100) + '...');
    console.log('문장 수 변화:', {
      original: originalText.split(/[.!?]+/).length,
      optimized: optimizedText.split(/[.!?]+/).length
    });
    console.groupEnd();
  }
};