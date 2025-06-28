// Dictionary and Translation API utilities

// Free Dictionary API for English definitions
export const fetchEnglishDefinition = async (word) => {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
    
    if (!response.ok) {
      throw new Error('Word not found');
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const entry = data[0];
      
      // 첫 번째 의미의 첫 번째 정의 가져오기
      const meaning = entry.meanings && entry.meanings[0];
      const definition = meaning && meaning.definitions && meaning.definitions[0];
      
      return {
        word: entry.word,
        phonetic: entry.phonetic || (entry.phonetics && entry.phonetics[0]?.text) || '',
        partOfSpeech: meaning?.partOfSpeech || '',
        definition: definition?.definition || 'Definition not available',
        example: definition?.example || '',
        audio: entry.phonetics?.find(p => p.audio)?.audio || '',
        synonyms: definition?.synonyms || [],
        antonyms: definition?.antonyms || []
      };
    }
    
    throw new Error('No definition found');
  } catch (error) {
    console.error('Error fetching English definition:', error);
    return null;
  }
};

// Enhanced translation with multiple fallback services
export const translateText = async (text, targetLang = 'ko') => {
  // Language code mapping for different APIs
  const langMap = {
    'ko': 'ko',
    'ja': 'ja', 
    'zh': 'zh',
    'es': 'es',
    'fr': 'fr',
    'de': 'de',
    'it': 'it',
    'pt': 'pt',
    'ru': 'ru',
    'ar': 'ar',
    'hi': 'hi',
    'th': 'th',
    'vi': 'vi'
  };

  const mappedLang = langMap[targetLang] || targetLang;
  
  // Try multiple translation services in order
  const translationServices = [
    // 1. MyMemory API (most reliable free option)
    async () => {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${mappedLang}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.responseStatus === 200 && data.responseData.translatedText) {
          return data.responseData.translatedText;
        }
      }
      throw new Error('MyMemory translation failed');
    },
    
    // 2. Libre Translate (backup)
    async () => {
      const response = await fetch('https://libretranslate.de/translate', {
        method: 'POST',
        body: JSON.stringify({
          q: text,
          source: 'en',
          target: mappedLang,
          format: 'text'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.translatedText;
      }
      throw new Error('LibreTranslate failed');
    },
    
    // 3. Simple hardcoded translations for common words (final fallback)
    async () => {
      const commonTranslations = {
        'ko': {
          'the': '그',
          'a': '하나의',
          'an': '하나의',
          'and': '그리고',
          'or': '또는',
          'but': '하지만',
          'in': '안에',
          'on': '위에',
          'at': '에서',
          'to': '에게',
          'for': '위해',
          'of': '의',
          'with': '함께',
          'by': '에 의해',
          'is': '이다',
          'are': '이다',
          'was': '였다',
          'were': '였다',
          'be': '이다',
          'have': '가지다',
          'has': '가지다',
          'had': '가졌다',
          'do': '하다',
          'does': '하다',
          'did': '했다',
          'will': '할 것이다',
          'would': '할 것이다',
          'can': '할 수 있다',
          'could': '할 수 있었다',
          'should': '해야 한다',
          'may': '할 수도 있다',
          'might': '할 수도 있다',
          'must': '반드시 해야 한다',
          'this': '이것',
          'that': '그것',
          'these': '이것들',
          'those': '그것들',
          'what': '무엇',
          'where': '어디',
          'when': '언제',
          'why': '왜',
          'how': '어떻게',
          'who': '누구',
          'which': '어떤',
          'good': '좋은',
          'bad': '나쁜',
          'big': '큰',
          'small': '작은',
          'new': '새로운',
          'old': '오래된',
          'long': '긴',
          'short': '짧은',
          'high': '높은',
          'low': '낮은',
          'fast': '빠른',
          'slow': '느린',
          'hot': '뜨거운',
          'cold': '차가운',
          'warm': '따뜻한',
          'cool': '시원한',
          'easy': '쉬운',
          'hard': '어려운',
          'difficult': '어려운',
          'simple': '간단한',
          'complex': '복잡한',
          'important': '중요한',
          'necessary': '필요한',
          'possible': '가능한',
          'impossible': '불가능한'
        }
      };
      
      const wordLower = text.toLowerCase().trim();
      if (commonTranslations[targetLang] && commonTranslations[targetLang][wordLower]) {
        return commonTranslations[targetLang][wordLower];
      }
      
      throw new Error('No translation available');
    }
  ];

  // Try each service in order
  for (let i = 0; i < translationServices.length; i++) {
    try {
      const result = await translationServices[i]();
      if (result && result.trim()) {
        return result;
      }
    } catch (error) {
      console.error(`Translation service ${i + 1} failed:`, error);
      if (i === translationServices.length - 1) {
        // If all services fail, return a helpful message
        return `Translation not available for "${text}"`;
      }
    }
  }
  
  return null;
};

// Combined function to get both English definition and translation
export const fetchWordDefinitionAndTranslation = async (word, targetLang = 'ko') => {
  try {
    // Get English definition first
    const englishDef = await fetchEnglishDefinition(word);
    
    if (!englishDef) {
      return {
        error: 'Word not found in English dictionary',
        word: word
      };
    }

    // Translate the definition
    const translatedDefinition = await translateText(englishDef.definition, targetLang);
    
    // Language names mapping
    const languageNames = {
      'ko': 'Korean',
      'ja': 'Japanese',
      'zh': 'Chinese',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'th': 'Thai',
      'vi': 'Vietnamese'
    };

    return {
      word: englishDef.word,
      phonetic: englishDef.phonetic,
      partOfSpeech: englishDef.partOfSpeech,
      englishDefinition: englishDef.definition,
      translatedDefinition: translatedDefinition || 'Translation not available',
      example: englishDef.example,
      audio: englishDef.audio,
      synonyms: englishDef.synonyms,
      antonyms: englishDef.antonyms,
      targetLanguage: languageNames[targetLang] || targetLang,
      targetLangCode: targetLang
    };
  } catch (error) {
    console.error('Error fetching word data:', error);
    return {
      error: 'Failed to fetch word definition',
      word: word
    };
  }
};

// Get supported languages
export const getSupportedLanguages = () => {
  return [
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'th', name: 'Thai', flag: '🇹🇭' },
    { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' }
  ];
}; 