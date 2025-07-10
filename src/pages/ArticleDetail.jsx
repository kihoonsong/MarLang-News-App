import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import styled from 'styled-components';
import { 
  AppBar, Toolbar, Typography, IconButton, Tabs, Tab, Box, Button, Chip,
  Snackbar, Alert, Select, MenuItem, FormControl, InputLabel, CircularProgress, 
  Popover, Paper, Avatar, Menu, ListItemIcon, ListItemText, useMediaQuery, useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShareIcon from '@mui/icons-material/Share';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import CloseIcon from '@mui/icons-material/Close';
import SpeedIcon from '@mui/icons-material/Speed';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useArticles } from '../contexts/ArticlesContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchWordDefinitionAndTranslation, getSupportedLanguages } from '../utils/dictionaryApi';
import { speakSentence, getEnglishVoice, isSpeechSynthesisSupported, getAvailableVoices } from '../utils/speechUtils';
import { createUnifiedTTS } from '../utils/UnifiedTTS';
import { optimizeTextForTTS, debugTTSOptimization } from '../utils/ttsTextPatch';
import { getTTSOptimizationSettings, isIOS } from '../utils/deviceDetect';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import PageContainer from '../components/PageContainer';
import { useEnhancedToast } from '../components/EnhancedToastProvider';
import PremiumContentGuard from '../components/PremiumContentGuard';
import { ArticleDetailAdComponent, InlineAdComponent } from '../components/AdComponents';
import DOMPurify from 'dompurify';

// HTML 엔티티 디코딩 함수
const decodeHtmlEntities = (html) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.documentElement.textContent;
};

// HTML 태그 제거 및 텍스트 정리 함수
const cleanHtmlContent = (htmlContent) => {
  if (!htmlContent) return '';
  
  // HTML 태그를 모두 제거하고 텍스트만 추출
  const cleanHtml = DOMPurify.sanitize(htmlContent, {
    ALLOWED_TAGS: [],        // 모든 태그 제거
    ALLOWED_ATTR: []         // 모든 속성 제거
  });
  
  // HTML 엔티티 디코딩 (&nbsp; 등을 실제 문자로 변환)
  const decodedHtml = decodeHtmlEntities(cleanHtml);
  
  // 여러 공백을 하나로 정리하고 줄바꿈 정리
  return decodedHtml
    .replace(/\s+/g, ' ')     // 여러 공백을 하나로
    .replace(/\n\s*\n/g, '\n\n') // 여러 줄바꿈을 최대 2개로
    .trim();
};

// 기사 내용에서 3개 레벨 생성 (개선된 버전)
const generateLevelsFromContent = (article) => {
  if (import.meta.env.DEV) {
    console.log('🔧 기사 레벨 생성:', article.title);
    console.log('🔧 원본 content 타입:', typeof article.content);
    console.log('🔧 원본 content:', article.content);
  }
  
  // 새로운 3개 버전 구조를 그대로 사용
  if (article.content && typeof article.content === 'object') {
    const levels = {
      1: {
        title: 'Level 1 - Beginner',
        content: cleanHtmlContent(article.content.beginner || '')
      },
      2: {
        title: 'Level 2 - Intermediate', 
        content: cleanHtmlContent(article.content.intermediate || '')
      },
      3: {
        title: 'Level 3 - Advanced',
        content: cleanHtmlContent(article.content.advanced || '')
      }
    };
    if (import.meta.env.DEV) {
      console.log('✅ 객체 형태 레벨 생성 완료 (HTML 태그 제거):', levels);
    }
    return levels;
  } else {
    // 기존 단일 문자열 구조인 경우 모든 소스에서 콘텐츠 찾기
    const baseContent = article.content || article.summary || article.description || 'No content available';
    const cleanContent = cleanHtmlContent(baseContent);
    if (import.meta.env.DEV) {
      console.log('📝 기본 콘텐츠 사용 (HTML 태그 제거):', cleanContent.substring(0, 100), '...');
    }
    
    const levels = {
      1: {
        title: 'Level 1 - Beginner',
        content: cleanContent
      },
      2: {
        title: 'Level 2 - Intermediate',
        content: cleanContent
      },
      3: {
        title: 'Level 3 - Advanced',
        content: cleanContent
      }
    };
    if (import.meta.env.DEV) {
      console.log('✅ 단일 형태 레벨 생성 완료 (HTML 태그 제거):', Object.keys(levels).map(k => ({level: k, contentLength: levels[k].content.length})));
    }
    return levels;
  }
};


const WordSpan = memo(({ word, isHighlighted, onWordClick }) => {
  return (
    <StyledWordSpan
      $isHighlighted={isHighlighted}
      onClick={(e) => {
        e.stopPropagation();
        onWordClick(e, word, isHighlighted);
      }}
      className={`clickable-word-span ${isHighlighted ? 'highlighted-word' : ''}`}
    >
      {word}{' '}
    </StyledWordSpan>
  );
});

WordSpan.displayName = 'WordSpan';

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth() || {};
  const { allArticles, loading: articlesLoading, incrementArticleViews, incrementArticleLikes } = useArticles();
  const { 
    savedWords, 
    addWord, 
    removeWord, 
    isWordSaved, 
    likedArticles, 
    addLikedArticle, 
    removeLikedArticle, 
    isArticleLiked,
    toggleLike,
    addViewRecord,
    updateActivityTime,
    updateSettings,
    userSettings
  } = useData();
  const toast = useEnhancedToast();
  
  // Remove unused navigation state
  const [articleData, setArticleData] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [highlightedWords, setHighlightedWords] = useState(new Set());
  const [isLiked, setIsLiked] = useState(false);
  const [wordPopup, setWordPopup] = useState({
    open: false,
    anchorEl: null,
    word: '',
    englishDefinition: '',
    translatedDefinition: '',
    phonetic: '',
    partOfSpeech: '',
    example: '',
    audio: '',
    isLoading: false,
    error: null,
    selectedWord: null
  });
  const [selectedLanguage, setSelectedLanguage] = useState(userSettings?.translationLanguage || 'en');
  
  // TTS 상태 (통합)
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [isTTSLoading, setIsTTSLoading] = useState(false);
  const [currentSentence, setCurrentSentence] = useState(-1);
  const [ttsSpeed, setTtsSpeed] = useState(userSettings?.ttsSpeed || 0.8);
  const [ttsPause, setTtsPause] = useState(userSettings?.ttsPause || false);
  const [totalSentences, setTotalSentences] = useState(0);
  
  // 통합 TTS 인스턴스
  const unifiedTTSRef = useRef(null);
  
  // iOS TTS utterance 참조
  const iosUtteranceRef = useRef(null);
  
  // iOS TTS 현재 재생 위치 추적
  const iosCurrentTextRef = useRef('');
  
  // 활성 문장 DOM 참조 (DOM 직접 조작용)
  const activeSentenceRef = useRef(null);

  // userSettings 변경 시 TTS 설정 업데이트
  useEffect(() => {
    if (userSettings?.ttsSpeed) {
      setTtsSpeed(userSettings.ttsSpeed);
    }
    if (userSettings?.ttsPause !== undefined) {
      setTtsPause(userSettings.ttsPause);
    }
  }, [userSettings?.ttsSpeed, userSettings?.ttsPause]);

  // 페이지 이동 시 TTS 자동 정지 (개선된 버전)
  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 TTS 완전 정지
      if (import.meta.env.DEV) {
        console.log('📤 ArticleDetail 언마운트 - 통합 TTS 정지');
      }
      
      // 즉시 상태 초기화
      setIsTTSPlaying(false);
      setIsTTSLoading(false);
      setCurrentSentence(-1);
      setTotalSentences(0);
      
      // iOS 감지 후 적절한 중지 방법 사용
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      if (isIOSDevice) {
        // iOS에서는 speechSynthesis.cancel() 사용
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        // iOS utterance 참조 정리
        iosUtteranceRef.current = null;
        iosCurrentTextRef.current = '';
      } else {
        // 기존 UnifiedTTS 중지
        if (unifiedTTSRef.current) {
          unifiedTTSRef.current.stop();
          unifiedTTSRef.current = null;
        }
      }
      
      // DOM 하이라이트 정리
      if (activeSentenceRef.current) {
        activeSentenceRef.current.classList.remove('active-sentence');
        activeSentenceRef.current = null;
      }
      
      if (import.meta.env.DEV) {
        console.log('✅ 언마운트 TTS 정지 완료');
      }
    };
  }, []); // 빈 배열로 마운트/언마운트에만 실행

  // 스와이프 상태 추가
  const [swipeState, setSwipeState] = useState({
    isDragging: false,
    dragStart: 0,
    dragOffset: 0,
    isTransitioning: false
  });

  // 기사 데이터 로드
  useEffect(() => {
    if (!articlesLoading && allArticles && id) {
      const foundArticle = allArticles.find(article => article.id === id);
      if (foundArticle) {
        if (import.meta.env.DEV) {
          console.log('🔍 원본 기사 데이터 확인:', foundArticle);
        }
        
        // 기사 데이터를 ArticleDetail 형태로 변환
        const transformedArticle = {
          id: foundArticle.id,
          title: foundArticle.title,
          summary: foundArticle.summary || foundArticle.description || foundArticle.content || 'No summary available',
          category: foundArticle.category,
          publishedAt: foundArticle.publishedAt,
          date: new Date(foundArticle.publishedAt).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          }),
          image: foundArticle.image,
          liked: false,
          levels: generateLevelsFromContent(foundArticle)
        };
        
        if (import.meta.env.DEV) {
          console.log('🔧 변환된 기사 데이터:', transformedArticle);
        }
        setArticleData(transformedArticle);
        
        // 조회 기록 추가 및 활동 시간 업데이트 (로그인된 사용자만)
        if (user?.uid) {
          addViewRecord(foundArticle);
          updateActivityTime && updateActivityTime();
        }
        
        // 기사 조회수 증가 (로그인 여부와 관계없이)
        if (incrementArticleViews) {
          incrementArticleViews(foundArticle.id);
        }
      }
    }
  }, [articlesLoading, allArticles, id, user?.uid]);

  // 컴포넌트 마운트 시 좋아요 상태 확인
  useEffect(() => {
    if (isArticleLiked && articleData && user?.uid) {
      const likedStatus = isArticleLiked(articleData.id);
      if (import.meta.env.DEV) {
        console.log('💖 좋아요 상태 확인:', articleData.id, likedStatus);
      }
      setIsLiked(likedStatus);
    }
  }, [isArticleLiked, articleData?.id, user?.uid]);

  // userSettings 변경 시 언어 설정 동기화
  useEffect(() => {
    if (userSettings?.translationLanguage) {
      setSelectedLanguage(userSettings.translationLanguage);
    }
  }, [userSettings?.translationLanguage]);

  // 하이라이트된 단어들을 사용자 단어장에서 로드
  useEffect(() => {
    if (articleData && savedWords) {
      // 현재 기사에 해당하는 저장된 단어들로 하이라이트 설정
      const articleWords = savedWords
        .filter(word => word.articleId === articleData.id)
        .map(word => word.word.toLowerCase());
      
      setHighlightedWords(new Set(articleWords));
      if (import.meta.env.DEV) {
        console.log('🌈 하이라이트 로드:', articleWords.length, '개 단어');
      }
    }
  }, [articleData?.id, savedWords]);

  // 단어장과 하이라이트 초기 동기화 (한 번만 실행)
  useEffect(() => {
    if (articleData && savedWords && savedWords.length > 0) {
      // 현재 기사에 해당하는 저장된 단어들 찾기
      const articleWords = savedWords
        .filter(word => word.articleId === articleData.id)
        .map(word => word.word.toLowerCase());
      
      if (articleWords.length > 0) {
        if (import.meta.env.DEV) {
          console.log('🔄 단어장 동기화:', articleWords);
        }
        setHighlightedWords(new Set(articleWords));
      }
    }
  }, [articleData?.id]); // savedWords 제거하여 무한 루프 방지

  // 키보드 이벤트 핸들러 (화살표 키로 레벨 변경)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 팝업이 열려있거나 input/textarea에 포커스가 있을 때는 키보드 이벤트 무시
      if (wordPopup.open || 
          document.activeElement.tagName === 'INPUT' || 
          document.activeElement.tagName === 'TEXTAREA') {
        return;
      }
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleLevelChange(selectedLevel - 1 < 1 ? 3 : selectedLevel - 1);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleLevelChange(selectedLevel + 1 > 3 ? 1 : selectedLevel + 1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedLevel, wordPopup.open]);

  // Firebase 데이터 변경 감지 (다른 디바이스에서 단어장 변경 시 자동 동기화)
  useEffect(() => {
    if (!articleData) return;

    const handleWordUpdated = (event) => {
      if (event.detail && event.detail.articleId === articleData.id) {
        // 현재 기사에 해당하는 단어들로 하이라이트 업데이트
        const updatedWords = savedWords
          .filter(word => word.articleId === articleData.id)
          .map(word => word.word.toLowerCase());
        setHighlightedWords(new Set(updatedWords));
      }
    };

    window.addEventListener('wordUpdated', handleWordUpdated);
    return () => window.removeEventListener('wordUpdated', handleWordUpdated);
  }, [articleData?.id, savedWords]);

  // 하이라이트 상태 변경 시 DOM 업데이트
  useEffect(() => {
    if (articleData) {
      // 모든 clickable-word 요소 찾기
      const clickableWords = document.querySelectorAll('.clickable-word');
      
      clickableWords.forEach(element => {
        const word = element.textContent.trim().toLowerCase().replace(/[^\w]/g, '');
        if (word && word.length > 2) {
          // highlightSavedWords 설정이 켜져 있을 때만 하이라이트 적용
          if ((userSettings?.highlightSavedWords !== false) && highlightedWords.has(word)) {
            element.classList.add('highlighted-word');
          } else {
            element.classList.remove('highlighted-word');
          }
        }
      });
      
      if (import.meta.env.DEV) {
        console.log('🎨 DOM 하이라이트 업데이트:', highlightedWords.size, '개 단어');
      }
    }
  }, [highlightedWords, articleData?.id, userSettings?.highlightSavedWords]);

  // saveHighlights 함수 제거 - 이제 Firebase에서 단어장 데이터로 하이라이트 관리

  // 이전 UltraSimpleTTS 관련 코드 제거 - UnifiedTTS만 사용

  // DOM 직접 조작으로 문장 하이라이트 (iOS/iPad 최적화)
  const highlightSentence = (sentenceIdx) => {
    // iOS에서는 문장 하이라이트 비활성화
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOSDevice) {
      if (import.meta.env.DEV) {
        console.log('🍎 iOS 문장 하이라이트 비활성화');
      }
      return;
    }
    
    // 현재 활성 카드 찾기
    const activeCard = document.querySelector('[data-active="true"]');
    if (!activeCard) return;

    // 이전 하이라이트 제거 (활성 카드 범위 내에서만)
    if (activeSentenceRef.current) {
      activeSentenceRef.current.classList.remove('active-sentence');
    }

    // 활성 카드 범위 내에서 문장 찾기
    const targetElement = activeCard.querySelector(`[data-sentence="${sentenceIdx}"]`);
    
    if (targetElement) {
      targetElement.classList.add('active-sentence');
      activeSentenceRef.current = targetElement;
      
      // iOS Safari 최적화된 스크롤 (수평 이동 최소화)
      try {
        targetElement.scrollIntoView({ 
          block: 'nearest', 
          behavior: 'smooth',
          inline: 'nearest' // 수평 이동 최소화
        });
      } catch (error) {
        // 스크롤 실패 시 조용히 무시
        if (import.meta.env.DEV) {
          console.log('스크롤 실패:', error);
        }
      }
    }
  };

  // 단순화된 TTS 시작 함수
  const startTTS = async () => {
    if (!articleData) {
      if (import.meta.env.DEV) {
        console.error('❌ 기사 데이터 없음');
      }
      return;
    }

    setIsTTSLoading(true); // 로딩 시작

    // iOS 플랫폼 감지 (향상된 감지 사용)
    // const { isIOS } = await import('../utils/deviceDetect'); // 이미 상단에서 임포트됨
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const currentContent = articleData?.levels?.[selectedLevel]?.content || '';
    if (import.meta.env.DEV) {
      console.log('🔍 현재 레벨:', selectedLevel);
      console.log('🔍 기사 데이터:', articleData?.levels);
      console.log('🔍 현재 콘텐츠:', currentContent.substring(0, 100), '...');
    }
    
    if (currentContent.trim().length === 0) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ 재생할 콘텐츠가 없습니다. 레벨:', selectedLevel);
        console.warn('⚠️ 전체 콘텐츠:', currentContent);
      }
      setIsTTSLoading(false);
      return;
    }

    try {
      if (import.meta.env.DEV) {
        console.log('🚀 TTS 재생 시작 - 플랫폼:', isIOS ? 'iOS' : 'Other');
      }
      
      // iOS에서 A안 적용: 문장 분할·밑줄 OFF, 단어 하이라이트 유지
      if (isIOS) {
        if (import.meta.env.DEV) {
          console.log('🍎 iOS 감지 - A안 적용: 전체 기사 한 번에 재생');
        }
        
        // 1) 광고 push 차단 (선택적)
        if (window.adsbygoogle) {
          window.adsbygoogle = [];
        }
        
        // 2) 정제된 기사 전체 문자열 준비 (HTML 태그 제거)
        const cleanContent = cleanHtmlContent(currentContent);
        if (import.meta.env.DEV) {
          console.log('🧹 HTML 태그 제거 완료:', cleanContent.substring(0, 100), '...');
        }
        
        // iOS 현재 재생 텍스트 저장
        iosCurrentTextRef.current = cleanContent;
        
        // 3) SpeechSynthesisUtterance로 직접 재생
        const utterance = new SpeechSynthesisUtterance(cleanContent);
        utterance.rate = ttsSpeed;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // 기존 음성 설정 적용
        if (window.speechSynthesis) {
          const voices = window.speechSynthesis.getVoices();
          const englishVoice = voices.find(v => v.lang.startsWith('en-US')) || 
                              voices.find(v => v.lang.startsWith('en-GB')) || 
                              voices.find(v => v.lang.startsWith('en')) || 
                              voices[0];
          if (englishVoice) {
            utterance.voice = englishVoice;
            utterance.lang = englishVoice.lang;
          }
        }
        
        // 이벤트 핸들러 설정
        utterance.onstart = () => {
          if (import.meta.env.DEV) {
            console.log('🎵 iOS TTS 재생 시작됨');
          }
          setIsTTSLoading(false);
          setIsTTSPlaying(true);
        };
        
        utterance.onend = () => {
          if (import.meta.env.DEV) {
            console.log('✅ iOS TTS 재생 완료');
          }
          setIsTTSLoading(false);
          setIsTTSPlaying(false);
          setCurrentSentence(-1);
          setTotalSentences(0);
        };
        
        utterance.onerror = (error) => {
          if (import.meta.env.DEV) {
            console.error('❌ iOS TTS 에러:', error);
          }
          setIsTTSLoading(false);
          setIsTTSPlaying(false);
          setCurrentSentence(-1);
          setTotalSentences(0);
        };
        
        // 기존 재생 중지 후 새로 시작
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
          
          // iOS utterance 참조 저장
          iosUtteranceRef.current = utterance;
          
          // iOS에서 즉시 상태 업데이트 (onstart 이벤트가 신뢰할 수 없음)
          setTimeout(() => {
            setIsTTSLoading(false);
            setIsTTSPlaying(true);
          }, 100);
          
          window.speechSynthesis.speak(utterance);
        }
        
        // 4) 상태 플래그 업데이트 (문장 밑줄 OFF)
        setCurrentSentence(-1);    // 문장 밑줄 OFF
        
        return; // 이하 문장 분할 로직 스킵
      }
      
      // 기존 UnifiedTTS 로직 (Android·데스크탑)
      if (import.meta.env.DEV) {
        console.log('🚀 UnifiedTTS 서비스로 재생 시작 (Android·데스크탑)');
      }
      
      // 플랫폼별 TTS 최적화 설정 가져오기
      const ttsSettings = getTTSOptimizationSettings();
      if (import.meta.env.DEV) {
        console.log('📱 TTS 최적화 설정:', ttsSettings);
      }
      
      // 텍스트 최적화 (시각적 변화 없이 TTS만 최적화)
      const optimizedContent = optimizeTextForTTS(currentContent, ttsSettings);
      
      // 개발 환경에서 최적화 결과 디버깅
      if (import.meta.env.DEV) {
        debugTTSOptimization(currentContent, optimizedContent);
      }
      
      // UnifiedTTS 인스턴스 생성
      if (unifiedTTSRef.current) {
        unifiedTTSRef.current.stop();
      }
      
      unifiedTTSRef.current = createUnifiedTTS({
        rate: ttsSpeed,
        onStart: () => {
          if (import.meta.env.DEV) {
            console.log('🎵 TTS 재생 시작됨');
          }
          setIsTTSLoading(false);
          setIsTTSPlaying(true);
        },
        onProgress: (sentenceIndex, totalSentences, sentenceText, sentenceInfo) => {
          if (import.meta.env.DEV) {
            console.log(`📊 진행률: ${sentenceIndex + 1}/${totalSentences}`);
            console.log(`📢 현재 재생 중인 문장: "${sentenceText.substring(0, 50)}..."`);  
          }
          
          // DOM 직접 조작으로 변경 (React 상태 업데이트 제거)
          requestAnimationFrame(() => {
            highlightSentence(sentenceIndex);
          });
          
          // 진행률 표시용 상태는 유지 (UI 영향 최소화)
          setCurrentSentence(sentenceIndex);
          setTotalSentences(totalSentences);
        },
        onComplete: () => {
          if (import.meta.env.DEV) {
            console.log('✅ TTS 재생 완료');
          }
          setIsTTSLoading(false);
          setIsTTSPlaying(false);
          setCurrentSentence(-1);
          setTotalSentences(0);
          
          // DOM 하이라이트 정리
          if (activeSentenceRef.current) {
            activeSentenceRef.current.classList.remove('active-sentence');
            activeSentenceRef.current = null;
          }
        },
        onError: (error) => {
          if (import.meta.env.DEV) {
            console.error('❌ TTS 에러:', error);
          }
          setIsTTSLoading(false);
          setIsTTSPlaying(false);
          setCurrentSentence(-1);
          setTotalSentences(0);
          
          // DOM 하이라이트 정리
          if (activeSentenceRef.current) {
            activeSentenceRef.current.classList.remove('active-sentence');
            activeSentenceRef.current = null;
          }
        }
      });
      
      // TTS 재생 시작 (최적화된 텍스트 사용)
      const success = await unifiedTTSRef.current.play(optimizedContent);
      
      if (!success) {
        if (import.meta.env.DEV) {
          console.error('❌ TTS 재생 실패');
        }
        setIsTTSLoading(false);
        setIsTTSPlaying(false);
        setCurrentSentence(-1);
        setTotalSentences(0);
      }
      
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('❌ TTS 시작 실패:', error);
      }
      setIsTTSPlaying(false);
      setIsTTSLoading(false);
      setCurrentSentence(-1);
      setTotalSentences(0);
    }
  };

  const handleTTS = async () => {
    if (isTTSPlaying) {
      // TTS 중지
      if (import.meta.env.DEV) {
        console.log('🛑 TTS 중지 버튼 클릭');
      }
      
      // iOS 감지
      // const { isIOS } = await import('../utils/deviceDetect'); // 이미 상단에서 임포트됨
      
      if (isIOS) {
        // iOS에서는 speechSynthesis.cancel() 사용
        if (import.meta.env.DEV) {
          console.log('🍎 iOS TTS 중지');
        }
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        // iOS utterance 참조 정리
        iosUtteranceRef.current = null;
        iosCurrentTextRef.current = '';
      } else {
        // 기존 UnifiedTTS 중지
        if (unifiedTTSRef.current) {
          unifiedTTSRef.current.stop();
        }
      }
      
      setIsTTSPlaying(false);
      setIsTTSLoading(false);
      setCurrentSentence(-1);
      setTotalSentences(0);
      
      // DOM 하이라이트 정리
      if (activeSentenceRef.current) {
        activeSentenceRef.current.classList.remove('active-sentence');
        activeSentenceRef.current = null;
      }
      
      if (import.meta.env.DEV) {
        console.log('✅ TTS 중지 완료');
      }
    } else {
      // TTS 시작
      startTTS();
    }
  };

  // 구 통합 TTS 중지 함수 (호환성을 위해 유지)
  const stopAllTTS = () => {
    if (unifiedTTSRef.current) {
      unifiedTTSRef.current.stop();
    }
  };

  const handleSpeedChange = async (newSpeed) => {
    if (import.meta.env.DEV) {
      console.log('⚡ 배속 변경:', ttsSpeed, '→', newSpeed);
    }
    setTtsSpeed(newSpeed);
    
    // iOS 감지
    // const { isIOS } = await import('../utils/deviceDetect'); // 이미 상단에서 임포트됨
    
    // 재생 중이면 새 속도로 업데이트
    if (isTTSPlaying) {
      if (import.meta.env.DEV) {
        console.log('🔄 재생 중 배속 변경');
      }
      
      if (isIOS) {
        // iOS에서는 부드럽게 재시작하여 배속 변경 적용
        if (import.meta.env.DEV) {
          console.log('🍎 iOS 배속 변경: 부드럽게 재시작');
        }
        if (iosCurrentTextRef.current && window.speechSynthesis.speaking) {
          // 현재 재생 중지
          window.speechSynthesis.cancel();
          
          // 새 배속으로 utterance 생성
          const newUtterance = new SpeechSynthesisUtterance(iosCurrentTextRef.current);
          newUtterance.rate = newSpeed;
          newUtterance.pitch = 1.0;
          newUtterance.volume = 1.0;
          
          // 음성 설정 적용
          const voices = window.speechSynthesis.getVoices();
          const englishVoice = voices.find(v => v.lang.startsWith('en-US')) || 
                              voices.find(v => v.lang.startsWith('en-GB')) || 
                              voices.find(v => v.lang.startsWith('en')) || 
                              voices[0];
          if (englishVoice) {
            newUtterance.voice = englishVoice;
            newUtterance.lang = englishVoice.lang;
          }
          
          // 이벤트 핸들러 설정
          newUtterance.onend = () => {
            if (import.meta.env.DEV) {
              console.log('✅ iOS TTS 재생 완료 (배속 변경 후)');
            }
            setIsTTSLoading(false);
            setIsTTSPlaying(false);
            setCurrentSentence(-1);
            setTotalSentences(0);
            iosUtteranceRef.current = null;
          };
          
          newUtterance.onerror = (error) => {
            if (import.meta.env.DEV) {
              console.error('❌ iOS TTS 에러 (배속 변경 후):', error);
            }
            setIsTTSLoading(false);
            setIsTTSPlaying(false);
            setCurrentSentence(-1);
            setTotalSentences(0);
            iosUtteranceRef.current = null;
          };
          
          // 새 utterance 참조 저장 및 재생
          iosUtteranceRef.current = newUtterance;
          
          // 짧은 지연 후 재생 시작
          setTimeout(() => {
            if (window.speechSynthesis && iosUtteranceRef.current) {
              window.speechSynthesis.speak(iosUtteranceRef.current);
              if (import.meta.env.DEV) {
                console.log('✅ iOS 배속 변경 후 재생 시작:', newSpeed);
              }
            }
          }, 100);
        } else {
          // 재생 중이 아니면 다음 재생 시 적용
          if (import.meta.env.DEV) {
            console.log('📝 iOS 다음 재생 시 새 배속 적용');
          }
        }
      } else {
        // 기존 UnifiedTTS 배속 변경
        if (unifiedTTSRef.current) {
          unifiedTTSRef.current.setSpeed(newSpeed);
        }
      }
    }
  };

  const handleLevelChange = async (level) => {
    if (import.meta.env.DEV) {
      console.log('🔄 레벨 변경:', selectedLevel, '→', level);
    }
    
    // iOS 감지
    // const { isIOS } = await import('../utils/deviceDetect'); // 이미 상단에서 임포트됨
    
    // TTS 중지
    if (isIOS) {
      // iOS에서는 speechSynthesis.cancel() 사용
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      // iOS utterance 참조 정리
      iosUtteranceRef.current = null;
    } else {
      // 기존 UnifiedTTS 중지
      if (unifiedTTSRef.current) {
        unifiedTTSRef.current.stop();
      }
    }
    
    // 상태 초기화
    setIsTTSPlaying(false);
    setIsTTSLoading(false);
    setCurrentSentence(-1);
    setTotalSentences(0);
    setSelectedLevel(level);
    
    // DOM 하이라이트 정리
    if (activeSentenceRef.current) {
      activeSentenceRef.current.classList.remove('active-sentence');
      activeSentenceRef.current = null;
    }
    try {
      stopAllTTS();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('레벨 변경 시 TTS 중지 오류:', error);
      }
    }
    
    if (import.meta.env.DEV) {
      console.log('✅ 레벨 변경 완료');
    }
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // iPad/태블릿 감지 (더 정확한 감지)
  const isTablet = useMemo(() => {
    const userAgent = navigator.userAgent;
    const isIPad = /iPad|Macintosh/.test(userAgent) && 'ontouchend' in document;
    const isAndroidTablet = /Android/i.test(userAgent) && !/Mobile/i.test(userAgent);
    const isLargeScreen = window.innerWidth >= 768 && window.innerWidth <= 1024;
    return isIPad || isAndroidTablet || (isLargeScreen && 'ontouchend' in document);
  }, []);

  // Visual Viewport 높이 관리 (Safari PWA 대응)
  const [viewportHeight, setViewportHeight] = useState(
    window.visualViewport?.height || window.innerHeight
  );

  // Visual Viewport 리사이즈 대응
  useEffect(() => {
    const handleViewportResize = () => {
      const newHeight = window.visualViewport?.height || window.innerHeight;
      setViewportHeight(newHeight);
      if (import.meta.env.DEV) {
        console.log('📱 Viewport 높이 변경:', newHeight);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
      return () => {
        window.visualViewport.removeEventListener('resize', handleViewportResize);
      };
    } else {
      // Fallback for browsers without visual viewport support
      window.addEventListener('resize', handleViewportResize);
      return () => {
        window.removeEventListener('resize', handleViewportResize);
      };
    }
  }, []);

  // 스와이프 핸들러 추가 (iPad/태블릿 최적화)
  const createSwipeHandlers = () => {
    // iPad/태블릿에서는 스와이프 비활성화
    if (isTablet) {
      return {
        onTouchStart: () => {},
        onTouchMove: () => {},
        onTouchEnd: () => {},
        onMouseDown: () => {},
        onMouseMove: () => {},
        onMouseUp: () => {},
        onMouseLeave: () => {}
      };
    }

    const handleStart = (e, clientX) => {
      // 단어 클릭 요소나 UI 컨트롤에서는 스와이프 비활성화
      if (e.target.classList.contains('clickable-word-span') || 
          e.target.classList.contains('highlighted-word') ||
          e.target.closest('.clickable-word-span') ||
          e.target.closest('.highlighted-word') ||
          e.target.closest('[role="button"]') ||
          e.target.closest('button') ||
          e.target.closest('input') ||
          e.target.closest('textarea')) {
        e.stopPropagation();
        return;
      }
      
      setSwipeState(prev => ({
        ...prev,
        isDragging: true,
        dragStart: clientX,
        dragOffset: 0,
        isTransitioning: false
      }));
    };

    const handleMove = (clientX) => {
      if (swipeState.isDragging) {
        const offset = clientX - swipeState.dragStart;
        setSwipeState(prev => ({
          ...prev,
          dragOffset: Math.max(-200, Math.min(200, offset)) // 드래그 제한
        }));
            }
    };

    const handleEnd = () => {
      if (swipeState.isDragging) {
        const threshold = 80;
        const dragDistance = Math.abs(swipeState.dragOffset);
        
        if (dragDistance > threshold) {
          const direction = swipeState.dragOffset > 0 ? -1 : 1;
          let newLevel = selectedLevel + direction;
          if (newLevel > 3) newLevel = 1;
          if (newLevel < 1) newLevel = 3;
          handleLevelChange(newLevel);
        } else {
          // 드래그 거리가 짧으면 탭으로 간주 (아무것도 안 함)
        }

        setSwipeState(prev => ({
          ...prev,
          isDragging: false,
          dragOffset: 0,
          isTransitioning: true
        }));

        setTimeout(() => {
          setSwipeState(prev => ({ ...prev, isTransitioning: false }));
        }, 300);
      }
    };

    return {
      // 터치 이벤트 (iPad/태블릿 최적화)
      onTouchStart: (e) => {
        // 단어 클릭이나 UI 요소 터치시 스와이프 방지
        if (e.target.classList.contains('clickable-word-span') || 
            e.target.classList.contains('highlighted-word') ||
            e.target.closest('.clickable-word-span') ||
            e.target.closest('.highlighted-word') ||
            e.target.closest('[role="button"]') ||
            e.target.closest('button')) {
          return;
        }
        // 터치 시작 지연으로 의도적인 스와이프만 처리
        setTimeout(() => {
          if (e.touches && e.touches.length === 1) {
            handleStart(e, e.touches[0].clientX);
          }
        }, 50);
      },
      onTouchMove: (e) => {
        if (swipeState.isDragging && e.touches && e.touches.length === 1) {
          handleMove(e.touches[0].clientX);
        }
      },
      onTouchEnd: (e) => {
        // 단어 클릭이나 UI 요소 터치시 스와이프 종료 방지
        if (e.target.classList.contains('clickable-word-span') || 
            e.target.classList.contains('highlighted-word') ||
            e.target.closest('.clickable-word-span') ||
            e.target.closest('.highlighted-word') ||
            e.target.closest('[role="button"]') ||
            e.target.closest('button')) {
          return;
        }
        handleEnd();
      },
      
      // 마우스 이벤트
      onMouseDown: (e) => {
        e.preventDefault();
        handleStart(e, e.clientX);
      },
      onMouseMove: (e) => {
        if (swipeState.isDragging) {
          handleMove(e.clientX);
        }
      },
      onMouseUp: handleEnd,
      onMouseLeave: handleEnd
    };
  };

  const swipeHandlers = createSwipeHandlers();

  // 카드 클릭 핸들러
  const handleCardClick = (e, level) => {
    e.stopPropagation();
    if (level !== selectedLevel) {
      handleLevelChange(level);
    }
  };

  const handleLike = () => {
    if (!articleData) {
      return;
    }
    
    // 로그인 상태 확인
    if (!isAuthenticated) {
      toast.warning('좋아요 기능을 사용하려면 로그인이 필요합니다.');
      return;
    }
    
    try {
      const newLikeStatus = toggleLike(articleData, incrementArticleLikes);
      setIsLiked(newLikeStatus);
      
      // 활동 시간 업데이트
      updateActivityTime && updateActivityTime();
      
      // 토스트 메시지 표시
      if (newLikeStatus) {
        toast.success('기사를 좋아요에 추가했습니다!');
      } else {
        toast.info('기사를 좋아요에서 제거했습니다.');
      }
      
      // 좋아요 상태 변경을 다른 컴포넌트에 알림
      window.dispatchEvent(new CustomEvent('likeUpdated', {
        detail: { articleId: articleData.id, isLiked: newLikeStatus }
      }));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error toggling like:', error);
      }
      toast.error('좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: articleData.title,
      text: `Check out this article: ${articleData.title}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success('기사가 공유되었습니다');
      } else {
        // 공유 API가 지원되지 않는 경우 클립보드에 복사
        await navigator.clipboard.writeText(window.location.href);
        toast.success('링크가 클립보드에 복사되었습니다');
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Share failed:', error);
      }
      if (error.name !== 'AbortError') {
        toast.error('공유에 실패했습니다');
      }
    }
  };

  const onWordClick = useCallback(async (event, word, isHighlighted) => {
    // 이벤트 전파 중지 및 기본 동작 방지
    event.stopPropagation();
    event.preventDefault();
    
    if (isHighlighted) {
      handleRemoveWord(event, word);
      return;
    }

    const cleanWord = word.trim().toLowerCase().replace(/[^\w]/g, '');
    if (cleanWord.length > 2) {
      setWordPopup({
        open: true,
        anchorEl: event.currentTarget,
        word: cleanWord,
        isLoading: true,
        error: null,
      });

      try {
        const wordData = await fetchWordDefinitionAndTranslation(cleanWord, selectedLanguage);
        if (wordData.error) {
          setWordPopup(prev => ({ ...prev, isLoading: false, error: wordData.error }));
        } else {
          setWordPopup(prev => ({ ...prev, isLoading: false, ...wordData }));
          if (userSettings?.autoSaveWords !== false) {
            await autoSaveWord(cleanWord, wordData);
          }
          if (userSettings?.autoPlay && wordData.audio) {
            new Audio(wordData.audio).play().catch(e => {
              if (import.meta.env.DEV) {
                console.error("Audio play failed", e);
              }
            });
          }
        }
      } catch (error) {
        setWordPopup(prev => ({ ...prev, isLoading: false, error: 'Failed to fetch definition' }));
      }
    }
  }, [selectedLanguage, userSettings, articleData]);

  const handleWordClick = async (event, word) => {
    // 이벤트 전파 중지 및 기본 동작 방지
    event.stopPropagation();
    event.preventDefault();
    
    const cleanWord = word.trim().toLowerCase().replace(/[^\w]/g, '');
    if (cleanWord.length > 2) {
      // 팝업 열기 및 로딩 상태 설정
      setWordPopup({
        open: true,
        anchorEl: event.currentTarget,
        word: cleanWord,
        englishDefinition: '',
        translatedDefinition: '',
        phonetic: '',
        partOfSpeech: '',
        example: '',
        audio: '',
        isLoading: true,
        error: null,
        selectedWord: event.currentTarget
      });

      try {
        // 실제 API에서 단어 정의와 번역 가져오기
        const wordData = await fetchWordDefinitionAndTranslation(
          cleanWord, 
          selectedLanguage === 'en' ? 'en' : selectedLanguage
        );

        if (wordData.error) {
          setWordPopup(prev => ({
            ...prev,
            isLoading: false,
            error: wordData.error,
            englishDefinition: `Definition not found for "${cleanWord}"`,
            translatedDefinition: selectedLanguage === 'en' 
              ? `Definition not found for "${cleanWord}"`
              : `"${cleanWord}"에 대한 정의를 찾을 수 없습니다.`
          }));
        } else {
          setWordPopup(prev => ({
            ...prev,
            isLoading: false,
            englishDefinition: wordData.englishDefinition,
            translatedDefinition: selectedLanguage === 'en' 
              ? wordData.englishDefinition 
              : wordData.translatedDefinition,
            phonetic: wordData.phonetic,
            partOfSpeech: wordData.partOfSpeech,
            example: wordData.example,
            audio: wordData.audio,
            error: null
          }));

          // 자동 저장 설정이 켜져 있으면 자동으로 저장
          if (userSettings?.autoSaveWords !== false) {
            await autoSaveWord(cleanWord, wordData);
          }

          // 자동 재생 설정이 켜져 있으면 자동으로 발음 재생
          if (userSettings?.autoPlay && wordData.audio) {
            setTimeout(async () => {
              try {
                const audio = new Audio(wordData.audio);
                audio.volume = 0.7;
                audio.play().catch(async (e) => {
                  if (import.meta.env.DEV) {
                    console.log('Auto-play failed, using TTS:', e);
                  }
                  // API 오디오 실패 시 TTS로 폴백
                  const utterance = new SpeechSynthesisUtterance(cleanWord);
                  utterance.rate = userSettings?.ttsSpeed || 0.8;
                  
                  try {
                    const englishVoice = await getEnglishVoice();
                    if (englishVoice) {
                      utterance.voice = englishVoice;
                      utterance.lang = englishVoice.lang;
                    } else {
                      utterance.lang = 'en-US';
                    }
                  } catch (error) {
                    utterance.lang = 'en-US';
                  }
                  
                  window.speechSynthesis.speak(utterance);
                });
              } catch (error) {
                if (import.meta.env.DEV) {
                  console.log('Auto-play audio failed:', error);
                }
              }
            }, 500); // 팝업이 완전히 열린 후 재생
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error fetching word data:', error);
        }
        setWordPopup(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to fetch word definition',
          englishDefinition: `Error loading definition for "${cleanWord}"`,
          translatedDefinition: selectedLanguage === 'en'
            ? `Error loading definition for "${cleanWord}"`
            : `"${cleanWord}"의 정의를 불러오는데 실패했습니다.`
        }));
      }
    }
  };

  // 자동 단어 저장 함수
  const autoSaveWord = async (cleanWord, wordData) => {
    // 로그인 상태 확인 (임시로 완화)
    if (!isAuthenticated && !window.enableGuestMode) {
      return; // 자동 저장은 조용히 실패
    }

    // 이미 저장된 단어인지 확인
    if (isWordSaved && isWordSaved(cleanWord, articleData.id)) {
      return; // 이미 저장된 경우 저장하지 않음
    }

    // 현재 사용자가 보고 있는 언어의 정의를 저장
    const englishDefinition = wordData.englishDefinition;
    const translatedDefinition = wordData.translatedDefinition;
    
    // 현재 선택된 언어에 따라 메인 정의 결정
    const currentViewingDefinition = selectedLanguage === 'en' 
      ? englishDefinition 
      : translatedDefinition;
    
    // 보조 정의 (반대 언어의 정의)
    const secondaryDefinition = selectedLanguage === 'en' 
      ? null  // 영어를 보고 있으면 보조 정의는 없음
      : englishDefinition; // 다른 언어를 보고 있으면 영어 정의를 보조로
    
    const success = addWord(
      cleanWord,
      currentViewingDefinition, // 현재 보고 있는 언어의 정의를 메인으로
      articleData.id,
      articleData.title,
      secondaryDefinition, // 보조 정의 (영어가 아닌 경우 영어 정의 포함)
      wordData.example, // 예문 추가
      wordData.partOfSpeech // 품사 추가
    );
    
    if (success) {
      // 활동 시간 업데이트
      updateActivityTime && updateActivityTime();
      
      if (import.meta.env.DEV) {
        console.log('🔄 자동 저장:', cleanWord);
      }
      
      // 하이라이트된 단어 목록에 추가하고 로컬스토리지에 저장
      const newHighlights = new Set([...highlightedWords, cleanWord]);
      setHighlightedWords(newHighlights);
      
      // 같은 탭 내에서 하이라이트 변경 알림
      window.dispatchEvent(new CustomEvent('highlightUpdated', {
        detail: { articleId: articleData.id, highlights: [...newHighlights] }
      }));
      
      // DOM에서 해당 단어의 모든 인스턴스에 하이라이트 클래스 추가 (설정이 켜져 있을 때만)
      if (userSettings?.highlightSavedWords !== false) {
        const allWordElements = document.querySelectorAll('.clickable-word');
        allWordElements.forEach(element => {
          const elementWord = element.textContent.trim().toLowerCase().replace(/[^\w]/g, '');
          if (elementWord === cleanWord.toLowerCase()) {
            element.classList.add('highlighted-word');
          }
        });
      }
      
      // 조용한 토스트 메시지 (자동 저장이므로 덜 눈에 띄게)
      if (toast && toast.info) {
        toast.info(`"${cleanWord}" auto-saved`, { autoClose: 2000 });
      }
    }
  };

  const handleSaveWord = () => {
    // 로그인 상태 확인 (임시로 완화)
    if (!isAuthenticated && !window.enableGuestMode) {
      // 게스트 모드 활성화 제안
      const enableGuest = confirm('단어 저장 기능을 테스트하려면 게스트 모드를 활성화하시겠습니까?\n\n게스트 모드에서는 브라우저 종료 시 데이터가 삭제됩니다.');
      if (enableGuest) {
        window.enableGuestMode = true;
        // 임시 사용자 정보 설정
        if (!user) {
          window.tempUser = { id: 'guest_' + Date.now(), name: 'Guest User' };
        }
      } else {
      alert('단어 저장 기능을 사용하려면 로그인이 필요합니다.\n\n상단의 Login 버튼을 클릭하여 로그인해주세요.');
      setWordPopup({
        open: false,
        anchorEl: null,
        word: '',
        englishDefinition: '',
        translatedDefinition: '',
        phonetic: '',
        partOfSpeech: '',
        example: '',
        audio: '',
        isLoading: false,
        error: null,
        selectedWord: null
      });
      return;
      }
    }

    // 현재 사용자가 보고 있는 언어의 정의를 저장
    const englishDefinition = wordPopup.englishDefinition;
    const translatedDefinition = wordPopup.translatedDefinition;
    
    // 현재 선택된 언어에 따라 메인 정의 결정
    const currentViewingDefinition = selectedLanguage === 'en' 
      ? englishDefinition 
      : translatedDefinition;
    
    // 보조 정의 (반대 언어의 정의)
    const secondaryDefinition = selectedLanguage === 'en' 
      ? null  // 영어를 보고 있으면 보조 정의는 없음
      : englishDefinition; // 다른 언어를 보고 있으면 영어 정의를 보조로
    
    const success = addWord(
      wordPopup.word,
      currentViewingDefinition, // 현재 보고 있는 언어의 정의를 메인으로
      articleData.id,
      articleData.title,
      secondaryDefinition, // 보조 정의 (영어가 아닌 경우 영어 정의 포함)
      wordPopup.example, // 예문 추가
      wordPopup.partOfSpeech // 품사 추가
    );
    
    if (success) {
      // 활동 시간 업데이트
      updateActivityTime && updateActivityTime();
      
      if (import.meta.env.DEV) {
        console.log('💾 단어 저장:', wordPopup.word);
      }
      
      // 하이라이트된 단어 목록에 추가 (단어장 동기화는 위에서 자동 처리)
      const cleanWord = wordPopup.word.toLowerCase();
      const newHighlights = new Set([...highlightedWords, cleanWord]);
      setHighlightedWords(newHighlights);
      
      // 단어 업데이트 이벤트 발생
      window.dispatchEvent(new CustomEvent('wordUpdated', {
        detail: { type: 'add', articleId: articleData.id, word: cleanWord }
      }));
      
      // DOM에서 해당 단어의 모든 인스턴스에 하이라이트 클래스 추가 (설정이 켜져 있을 때만)
      if (userSettings?.highlightSavedWords !== false) {
        const allWordElements = document.querySelectorAll('.clickable-word');
        allWordElements.forEach(element => {
          const elementWord = element.textContent.trim().toLowerCase().replace(/[^\w]/g, '');
          if (elementWord === wordPopup.word.toLowerCase()) {
            element.classList.add('highlighted-word');
          }
        });
      }
      
      // 토스트 메시지 표시 (언어별)
      if (toast && toast.success) {
        const languageNames = {
          'en': 'English',
          'ko': '한국어',
          'ja': '日本語',
          'zh': '中文',
          'es': 'Español',
          'fr': 'Français',
          'de': 'Deutsch',
          'it': 'Italiano',
          'pt': 'Português',
          'ru': 'Русский',
          'ar': 'العربية',
          'hi': 'हिन्दी',
          'th': 'ไทย',
          'vi': 'Tiếng Việt'
        };
        
        const currentLanguageName = languageNames[selectedLanguage] || selectedLanguage;
        const message = selectedLanguage === 'en' 
          ? `"${wordPopup.word}" saved with English definition!`
          : `"${wordPopup.word}" 단어가 ${currentLanguageName} 뜻으로 저장되었습니다!`;
        
        toast.success(message);
      }
    } else {
      if (import.meta.env.DEV) {
        console.warn('단어 저장 실패');
      }
      if (toast && toast.error) {
        toast.error('단어 저장에 실패했습니다.');
      }
    }
    
    setWordPopup({
      open: false,
      anchorEl: null,
      word: '',
      englishDefinition: '',
      translatedDefinition: '',
      phonetic: '',
      partOfSpeech: '',
      example: '',
      audio: '',
      isLoading: false,
      error: null,
      selectedWord: null
    });
  };

  const handleRemoveWord = useCallback((event, word) => {
    event.preventDefault();
    event.stopPropagation();
    const cleanWord = word.trim().toLowerCase().replace(/[^\w]/g, '');
    
    if (import.meta.env.DEV) {
      console.log('🗑️ 단어 삭제:', cleanWord);
    }
    
    // 하이라이트된 단어 목록에서 제거
    const newHighlights = new Set([...highlightedWords]);
    newHighlights.delete(cleanWord);
    setHighlightedWords(newHighlights);
    
    // 단어장에서 해당 단어 삭제
    const wordToRemove = savedWords.find(w => w.word.toLowerCase() === cleanWord && w.articleId === articleData.id);
    if (wordToRemove) {
      if (import.meta.env.DEV) {
        console.log('📚 단어장에서 삭제:', wordToRemove);
      }
      removeWord(wordToRemove.id);
    }
    
    // 활동 시간 업데이트
    updateActivityTime && updateActivityTime();
    
    // 단어 업데이트 이벤트 발생
    window.dispatchEvent(new CustomEvent('wordUpdated', {
      detail: { type: 'remove', articleId: articleData.id, word: cleanWord }
    }));
    
    // DOM에서 해당 단어의 모든 인스턴스에서 하이라이트 클래스 제거
    const allWordElements = document.querySelectorAll('.clickable-word');
    allWordElements.forEach(element => {
      const elementWord = element.textContent.trim().toLowerCase().replace(/[^\w]/g, '');
      if (elementWord === cleanWord) {
        element.classList.remove('highlighted-word');
      }
    });
  }, [highlightedWords, savedWords, articleData, removeWord, updateActivityTime]);

  // 단어 팝업에서 언어 변경 처리
  const handlePopupLanguageChange = async (newLanguage) => {
    setSelectedLanguage(newLanguage);
    updateSettings({ translationLanguage: newLanguage });
    
    // 현재 단어가 있으면 새로운 언어로 다시 검색
    if (wordPopup.word && wordPopup.open) {
      setWordPopup(prev => ({
        ...prev,
        isLoading: true,
        error: null
      }));
    
    try {
        const wordData = await fetchWordDefinitionAndTranslation(
          wordPopup.word, 
          newLanguage === 'en' ? 'en' : newLanguage
      );
      
        if (wordData.error) {
      setWordPopup(prev => ({
        ...prev,
            isLoading: false,
            error: wordData.error,
            englishDefinition: `Definition not found for "${wordPopup.word}"`,
            translatedDefinition: newLanguage === 'en' 
              ? `Definition not found for "${wordPopup.word}"`
              : `"${wordPopup.word}"에 대한 정의를 찾을 수 없습니다.`
          }));
        } else {
          setWordPopup(prev => ({
            ...prev,
            isLoading: false,
            englishDefinition: wordData.englishDefinition,
            translatedDefinition: newLanguage === 'en' 
              ? wordData.englishDefinition 
              : wordData.translatedDefinition,
            phonetic: wordData.phonetic,
            partOfSpeech: wordData.partOfSpeech,
            example: wordData.example,
            audio: wordData.audio,
            error: null
      }));
        }
    } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error fetching word data:', error);
        }
      setWordPopup(prev => ({
        ...prev,
          isLoading: false,
          error: 'Failed to fetch word definition',
          englishDefinition: `Error loading definition for "${wordPopup.word}"`,
          translatedDefinition: newLanguage === 'en'
            ? `Error loading definition for "${wordPopup.word}"`
            : `"${wordPopup.word}"의 정의를 불러오는데 실패했습니다.`
        }));
      }
    }
  };

  // 음성 재생 (성별 설정 적용)
  const playWordAudio = () => {
    if (wordPopup.audio) {
      // API에서 제공된 오디오 파일 재생
      const audio = new Audio(wordPopup.audio);
      audio.play().catch(error => {
        if (import.meta.env.DEV) {
          console.error('Audio playback failed, falling back to TTS:', error);
        }
        playWordTTS();
      });
    } else {
      // API 오디오가 없으면 TTS 사용
      playWordTTS();
    }
  };

  // 단어 TTS 재생 (성별 설정 적용)
  const playWordTTS = async () => {
    if (!window.speechSynthesis || !wordPopup.word) {
      if (import.meta.env.DEV) {
        console.error('❌ Speech synthesis 또는 단어가 없음');
      }
      return;
    }

    // 기존 재생 중지
    window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(wordPopup.word);
    utterance.rate = 0.8; // 단어는 천천히
    utterance.volume = 1.0;
    utterance.pitch = 1.0;

    // Siri 음성 우선 선택 (단어장과 동일한 로직)
    try {
      const englishVoice = await getEnglishVoice();
      if (englishVoice) {
        utterance.voice = englishVoice;
        utterance.lang = englishVoice.lang;
      } else {
        utterance.lang = 'en-US'; // 기본값
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Failed to get English voice:', error);
      }
      utterance.lang = 'en-US';
    }

    utterance.onerror = (event) => {
      if (import.meta.env.DEV) {
        console.error('TTS Error:', event.error);
      }
    };

    window.speechSynthesis.speak(utterance);
  };



  // 로딩 중이거나 기사를 찾지 못한 경우 - 광고 표시 안함
  if (articlesLoading) {
    return (
      <>
        <MobileNavigation showBackButton={true} searchCompact={false} />
        <MobileContentWrapper>
          <PageContainer>
            {/* 로딩 중일 때는 광고 표시 안함 */}
            <ArticleDetailAdComponent hasContent={false} />
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
              <Typography>Loading article...</Typography>
            </Box>
          </PageContainer>
        </MobileContentWrapper>
      </>
    );
  }

  if (!articleData) {
    return (
      <>
        <MobileNavigation showBackButton={true} searchCompact={false} />
        <MobileContentWrapper>
          <PageContainer>
            {/* 기사가 없을 때는 광고 표시 안함 */}
            <ArticleDetailAdComponent hasContent={false} />
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
              <Typography variant="h6" color="error">Article not found</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>The article you're looking for doesn't exist.</Typography>
              <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>Go back to Home</Button>
            </Box>
          </PageContainer>
        </MobileContentWrapper>
      </>
    );
  }

  return (
    <>
      {/* 통합 네비게이션 */}
      <MobileNavigation 
        showBackButton={true}
        searchCompact={false}
      />
      
      <MobileContentWrapper>

      {/* 기사 상세 내용 */}
      <PageContainer>
        <PremiumContentGuard>
          {/* 기사가 있을 때만 광고 표시 */}
          <ArticleDetailAdComponent hasContent={!!articleData} />
          
          {/* 썸네일 이미지 */}
          <ThumbnailImage 
            src={articleData.image} 
            alt={articleData.title}
            onError={(e) => {
              e.target.onerror = null; 
              e.target.src='https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80';
            }} 
          />
          
          {/* 메타 정보 */}
          <MetaInfo>
            <Chip label={articleData.category} color="primary" size="small" />
            <DateText>{articleData.date}</DateText>
          </MetaInfo>

          {/* 제목 */}
          <Title>{articleData.title}</Title>

          {/* 새로운 컨트롤 레이아웃 */}
          <ControlsSection>
            <PlaybackControls>
              <PlayButton 
                onClick={handleTTS} 
                $isPlaying={isTTSPlaying}
                $isLoading={isTTSLoading}
                disabled={isTTSLoading}
              >
                {isTTSLoading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : isTTSPlaying ? (
                  <PauseIcon />
                ) : (
                  <PlayArrowIcon />
                )}
              </PlayButton>
              
              <SpeedControlGroup>
                <SpeedButton 
                  onClick={() => handleSpeedChange(Math.max(0.5, ttsSpeed - 0.1))}
                  disabled={ttsSpeed <= 0.5}
                  title="Slower"
                >
                  -
                </SpeedButton>
                <SpeedDisplay>{ttsSpeed.toFixed(1)}x</SpeedDisplay>
                <SpeedButton 
                  onClick={() => handleSpeedChange(Math.min(2.0, ttsSpeed + 0.1))}
                  disabled={ttsSpeed >= 2.0}
                  title="Faster"
                >
                  +
                </SpeedButton>
              </SpeedControlGroup>
            </PlaybackControls>
              
            <ActionButtons>
              <ActionButton onClick={handleLike} $isLiked={isLiked} title="좋아요">
                {isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </ActionButton>
              <ActionButton onClick={handleShare} title="공유">
                <ShareIcon />
              </ActionButton>
            </ActionButtons>
          </ControlsSection>



          {/* 콘텐츠 중간 광고 */}
          <InlineAdComponent hasContent={!!articleData} />

          {/* 스와이프 카드 시스템 */}
          <SwipeCardContainer $isTablet={isTablet} {...(!isTablet ? swipeHandlers : {})}>
            {[1, 2, 3].map(level => {
              // 순환 구조를 위한 position 계산 (3→1→2→3)
              let position = level - selectedLevel;
              
              // 순환 로직: 1번 카드 좌측에 3번 카드가 보이도록
              if (selectedLevel === 1 && level === 3) {
                position = -1; // 3번 카드를 왼쪽에 표시
              } else if (selectedLevel === 2 && level === 1) {
                position = -1; // 1번 카드를 왼쪽에 표시
              } else if (selectedLevel === 3 && level === 2) {
                position = -1; // 2번 카드를 왼쪽에 표시
              } else if (selectedLevel === 1 && level === 2) {
                position = 1; // 2번 카드를 오른쪽에 표시
              } else if (selectedLevel === 2 && level === 3) {
                position = 1; // 3번 카드를 오른쪽에 표시
              } else if (selectedLevel === 3 && level === 1) {
                position = 1; // 1번 카드를 오른쪽에 표시
              }
              
              const isActive = level === selectedLevel;
              
              return (
                <SwipeCard
                  key={level}
                  $position={position}
                  $isDragging={swipeState.isDragging}
                  $dragOffset={swipeState.dragOffset}
                  $isTransitioning={swipeState.isTransitioning}
                  $isActive={isActive}
                  data-active={isActive}
                  onClick={(e) => !isMobile && handleCardClick(e, level)}
                >
                  <ContentHeader>
                    <LevelChangeButton 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLevelChange(selectedLevel - 1 < 1 ? 3 : selectedLevel - 1);
                      }}
                      title="Previous Level (Left Arrow Key)"
                      aria-label="Previous Level"
                      tabIndex={0}
                    >
                      <ArrowBackIosIcon fontSize="inherit" />
                    </LevelChangeButton>
                    <ContentTitle>
                      Level {level} - {level === 1 ? 'Beginner' : level === 2 ? 'Intermediate' : 'Advanced'}
                    </ContentTitle>
                    <LevelChangeButton 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLevelChange(selectedLevel + 1 > 3 ? 1 : selectedLevel + 1);
                      }}
                      title="Next Level (Right Arrow Key)"
                      aria-label="Next Level"
                      tabIndex={0}
                    >
                      <ArrowForwardIosIcon fontSize="inherit" />
                    </LevelChangeButton>
                  </ContentHeader>
            <ContentText>
              {(() => {
                      const content = articleData.levels[level].content;
                // HTML 태그가 이미 제거된 텍스트를 사용하여 문장 분할
                const sentences = content.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
                
                if (import.meta.env.DEV) {
                  console.log(`🎨 렌더링 레벨 ${level}: 총 ${sentences.length}개 문장, currentSentence=${currentSentence}, isTTSPlaying=${isTTSPlaying}, isActive=${isActive}, selectedLevel=${selectedLevel}`);
                }
                
                return sentences.map((sentence, sentenceIdx) => {
                        // iOS에서는 문장 하이라이팅 비활성화
                        const useSentenceHighlight = !window.navigator.userAgent.match(/(iPad|iPhone|iPod)/);
                        
                        // 현재 선택된 레벨에서만 하이라이팅 활성화 (iOS 제외)
                        const isCurrentSentence = useSentenceHighlight && 
                                                 currentSentence === sentenceIdx && 
                                                 isTTSPlaying && 
                                                 isActive && 
                                                 level === selectedLevel;
                        
                        if (isCurrentSentence && import.meta.env.DEV) {
                          console.log(`🔥 현재 활성 문장: 레벨 ${level}, 인덱스 ${sentenceIdx} - "${sentence.substring(0, 30)}..."`);
                        }
                  
                  return (
                    <SentenceSpan 
                      key={sentenceIdx}
                      data-sentence={sentenceIdx}
                      $isActive={false}
                    >
                      {sentence.trim().split(' ').map((word, wordIdx) => {
                        const cleanWord = word.trim().toLowerCase().replace(/[^\w]/g, '');
                                                            const isHighlighted = (userSettings?.highlightSavedWords !== false) && highlightedWords.has(cleanWord);
                        
                        return (
                          <WordSpan 
                            key={`${sentenceIdx}-${wordIdx}`}
                            word={word}
                            isHighlighted={isHighlighted}
                            onWordClick={onWordClick}
                          />
                        );
                      })}
                      {sentenceIdx < sentences.length - 1 && ' '}
                    </SentenceSpan>
                  );
                });
              })()}
            </ContentText>
                </SwipeCard>
              );
            })}
            

          </SwipeCardContainer>
        </PremiumContentGuard>
      </PageContainer>

      {/* 단어 팝업 */}
      <Popover
        open={wordPopup.open}
        anchorEl={wordPopup.anchorEl}
        onClose={() => setWordPopup({
          open: false,
          anchorEl: null,
          word: '',
          englishDefinition: '',
          translatedDefinition: '',
          phonetic: '',
          partOfSpeech: '',
          example: '',
          audio: '',
          isLoading: false,
          error: null,
          selectedWord: null
        })}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        disablePortal={isTablet} // iPad에서 위치 문제 최소화
        slotProps={{
          paper: {
            style: {
              maxHeight: viewportHeight * 0.6, // 뷰포트 높이의 60%로 제한
              marginTop: isTablet ? 12 : 8, // iPad에서 여유 공간 확보
              touchAction: 'pan-y', // 수직 스크롤만 허용
            }
          }
        }}
        sx={{
          '& .MuiPopover-paper': {
            overflow: 'auto',
            ...(isTablet && {
              maxWidth: '90vw', // 태블릿에서 너비 제한
              transform: 'translateY(8px) !important', // 강제 오프셋
            })
          }
        }}
      >
        <WordPopupContent>
          <PopupHeader>
            <WordSection>
              <WordTitle>
                {wordPopup.word}
                <IconButton 
                  onClick={playWordAudio} 
                  size="small" 
                  title="Play pronunciation"
                  sx={{ ml: 1, p: 0.5 }}
                >
                  <VolumeUpIcon fontSize="small" />
                </IconButton>
              </WordTitle>
              {wordPopup.partOfSpeech && (
                <Chip 
                  label={wordPopup.partOfSpeech} 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                  sx={{ mt: 0.5 }}
                />
              )}
            </WordSection>
            <IconButton 
              onClick={() => setWordPopup({
                open: false,
                anchorEl: null,
                word: '',
                englishDefinition: '',
                translatedDefinition: '',
                phonetic: '',
                partOfSpeech: '',
                example: '',
                audio: '',
                isLoading: false,
                error: null,
                selectedWord: null
              })} 
              size="small" 
              title="Close"
              sx={{ color: '#666' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </PopupHeader>

          {/* 언어 선택 */}
          <LanguageSelector>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Language</InputLabel>
              <Select
                value={selectedLanguage}
                onChange={(e) => handlePopupLanguageChange(e.target.value)}
                label="Language"
              >
                <MenuItem value="en">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>🇺🇸</span>
                    <Box>
                      <Typography variant="body2">English</Typography>
                      <Typography variant="caption" color="text.secondary">Definition</Typography>
                    </Box>
                  </Box>
                </MenuItem>
                {getSupportedLanguages().map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{lang.flag}</span>
                      <Box>
                        <Typography variant="body2">{lang.name}</Typography>
                        <Typography variant="caption" color="text.secondary">Translation</Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </LanguageSelector>

          {/* 로딩 및 에러 상태 */}
          {wordPopup.isLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
              <CircularProgress size={16} />
              <Typography variant="body2">Loading...</Typography>
            </Box>
          )}

          {wordPopup.error && (
            <Alert severity="error" sx={{ m: 1 }}>
              {wordPopup.error}
            </Alert>
          )}

          {/* 정의/번역 표시 */}
          {!wordPopup.isLoading && !wordPopup.error && (
            <DefinitionArea>
              {selectedLanguage === 'en' ? (
                // 영어인 경우: 영영사전 정의만 표시
                <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 1 }}>
                  {wordPopup.englishDefinition}
                </Typography>
              ) : (
                // 다른 언어인 경우: 단어 번역만 표시
                <Typography variant="h6" sx={{ lineHeight: 1.6, mb: 2, fontSize: '1.2rem', fontWeight: 'bold', color: '#1976d2' }}>
                  {wordPopup.translatedDefinition}
                </Typography>
              )}
              
              {wordPopup.example && (
                <ExampleText>
                  Example: "{wordPopup.example}"
                </ExampleText>
              )}
            </DefinitionArea>
          )}

          {/* 저장 버튼 */}
          <PopupActions>
            <Button 
              onClick={handleSaveWord} 
              variant="contained"
              size="small"
              disabled={wordPopup.isLoading}
              fullWidth
            >
              Save Word
            </Button>
          </PopupActions>
        </WordPopupContent>
      </Popover>

      </MobileContentWrapper>
    </>
  );
};

const ThumbnailImage = styled.img`
  width: 100%;
  height: 300px;
  object-fit: cover;
  border-radius: 16px;
  margin-bottom: 1rem;
`;

const MetaInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const DateText = styled.span`
  color: #666;
  font-size: 0.9rem;
`;

const Title = styled.h1`
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 2rem;
  line-height: 1.4;
`;

const ControlsSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 16px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  border: 1px solid #f0f0f0;
`;

const PlaybackControls = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const PlayButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: ${props => 
    props.$isLoading ? '#ccc' :
    props.$isPlaying ? '#1976d2' : 'linear-gradient(135deg, #1976d2, #42a5f5)'
  };
  color: white;
  border: none;
  border-radius: 50%;
  cursor: ${props => props.$isLoading ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
  opacity: ${props => props.$isLoading ? 0.7 : 1};
  
  &:hover {
    transform: ${props => props.$isLoading ? 'none' : 'scale(1.1)'};
    box-shadow: ${props => props.$isLoading ? '0 4px 12px rgba(25, 118, 210, 0.3)' : '0 6px 20px rgba(25, 118, 210, 0.4)'};
  }
  
  &:active {
    transform: ${props => props.$isLoading ? 'none' : 'scale(0.95)'};
  }
  
  &:disabled {
    cursor: not-allowed;
  }
`;

const SpeedControlGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 0.5rem;
`;

const SpeedButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: ${props => props.disabled ? '#e9ecef' : '#fff'};
  color: ${props => props.disabled ? '#adb5bd' : '#1976d2'};
  border: 1px solid ${props => props.disabled ? '#dee2e6' : '#e3f2fd'};
  border-radius: 8px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  font-weight: 600;
  font-size: 1rem;
  
  &:hover {
    ${props => !props.disabled && `
      background: #e3f2fd;
      border-color: #1976d2;
      transform: scale(1.05);
    `}
  }
`;

const SpeedDisplay = styled.div`
  font-size: 0.875rem;
  font-weight: 700;
  color: #1976d2;
  min-width: 40px;
  text-align: center;
  background: #e3f2fd;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: ${props => props.$isLiked ? '#ffebee' : '#f8f9fa'};
  color: ${props => props.$isLiked ? '#d32f2f' : '#666'};
  border: 1px solid ${props => props.$isLiked ? '#ffcdd2' : '#e9ecef'};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$isLiked ? '#ffcdd2' : '#e3f2fd'};
    color: ${props => props.$isLiked ? '#c62828' : '#1976d2'};
    border-color: ${props => props.$isLiked ? '#ef9a9a' : '#bbdefb'};
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const LevelTabs = styled.div`
  display: flex;
  gap: 0.1rem;
`;

const LevelTab = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.$active ? '#1976d2' : '#999'};
  cursor: pointer;
  font-size: 1.5rem;
  font-weight: normal;
  transition: all 0.3s ease;
  padding: 0.5rem;
  border-radius: 8px;
  min-width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #1976d2;
    background: rgba(25, 118, 210, 0.08);
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const ContentCard = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  padding: 2rem;
`;

const StyledWordSpan = styled.span`
  cursor: pointer;
  transition: background-color 0.2s;
  border-radius: 3px;
  padding: 1px 2px;
  touch-action: manipulation; /* 터치 동작 최적화 */
  -webkit-tap-highlight-color: transparent; /* iOS 터치 하이라이트 제거 */
  
  ${props => props.$isHighlighted ? `
    background-color: #fff9c4;
    &:hover {
      background-color: #fff59d;
    }
    &:active {
      background-color: #fff176;
    }
  ` : `
    &:hover {
      background-color: #f0f0f0;
    }
    &:active {
      background-color: #e0e0e0;
    }
  `}
  
  /* 터치 디바이스에서 더 큰 터치 영역 제공 */
  @media (pointer: coarse) {
    padding: 3px 4px;
    margin: 1px;
  }
`;



const ContentHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e3f2fd;
`;

const LevelChangeButton = styled.button`
  background: transparent;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.3s ease;
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  min-height: 40px;
  
  &:hover {
    color: #1976d2;
    background: rgba(25, 118, 210, 0.08);
    transform: scale(1.1);
  }
  
  &:focus {
    outline: 2px solid #1976d2;
    outline-offset: 2px;
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const ContentTitle = styled.h3`
  font-size: 1.3rem;
  font-weight: bold;
  color: #1976d2;
  text-align: center;
  margin: 0;
  flex-grow: 1;
`;

const ContentText = styled.div`
  font-size: 1.1rem;
  line-height: 1.8;
  cursor: text;
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  max-height: calc(100% - 100px); /* 제목 영역 제외 */
  
  /* 스크롤바 스타일 개선 */
  scrollbar-width: thin;
  scrollbar-color: #1976d2 #f0f0f0;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f0f0f0;
    border-radius: 4px;
    margin: 4px 0;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #1976d2;
    border-radius: 4px;
    border: 1px solid #f0f0f0;
    
    &:hover {
      background: #1565c0;
    }
  }
  
  /* 스크롤 시 페이드 효과 */
  &:before {
    content: '';
    position: sticky;
    top: 0;
    height: 10px;
    background: linear-gradient(to bottom, white, transparent);
    z-index: 1;
    display: block;
    margin-bottom: -10px;
  }
  
  &:after {
    content: '';
    position: sticky;
    bottom: 0;
    height: 10px;
    background: linear-gradient(to top, white, transparent);
    z-index: 1;
    display: block;
    margin-top: -10px;
  }
  
  .highlighted-word {
    background-color: #fff9c4 !important;
    border-radius: 3px;
    padding: 1px 3px;
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
    
    &:hover {
      background-color: #fff59d !important;
    }
  }
  
  .clickable-word-span {
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
    
    &:hover {
      background-color: rgba(25, 118, 210, 0.08);
      border-radius: 3px;
    }
  }
`;

const SentenceSpan = styled.span`
  display: inline;
  
  /* React 상태 기반 스타일 제거 - DOM 클래스로 대체 */
  ${props => props.$isActive && `
    border-bottom: 2px solid #1976d2;
    background-color: rgba(25, 118, 210, 0.1);
  `}
  
  /* CSS 클래스 기반 하이라이트 (DOM 직접 조작용) */
  &.active-sentence {
    border-bottom: 2px solid #1976d2;
    background-color: rgba(25, 118, 210, 0.1);
    transition: border-bottom-color 0.05s linear; /* 트랜지션 최소화 */
  }
`;

const WordPopupContent = styled(Paper)`
  padding: 0;
  max-width: 320px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15) !important;
`;

const PopupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
`;

const WordSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const WordTitle = styled.div`
  font-weight: bold;
  font-size: 1.1rem;
  color: #1976d2;
  display: flex;
  align-items: center;
`;

const LanguageSelector = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
`;

const DefinitionArea = styled.div`
  padding: 16px;
  max-height: 240px;
  overflow-y: auto;
`;

const DefinitionHeader = styled.div`
  margin-bottom: 8px;
`;

const ExampleText = styled.div`
  font-size: 0.9rem;
  color: #666;
  font-style: italic;
  margin-top: 8px;
  padding-left: 12px;
  border-left: 3px solid #e0e0e0;
`;

const PopupActions = styled.div`
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
`;

const SwipeCardContainer = styled.div`
  position: relative;
  width: 100%;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  touch-action: ${props => props.$isTablet ? 'pan-y' : 'manipulation'}; /* 태블릿에서는 수직 스크롤만 허용 */

  /* Desktop styles */
  height: 700px;
  overflow: visible;

  /* Mobile styles */
  @media (max-width: 768px) {
    min-height: 500px;
    height: auto;
    overflow: hidden;
    touch-action: ${props => props.$isTablet ? 'pan-y' : 'manipulation'}; /* 태블릿: 수직만, 폰: JavaScript 제어 */
  }
`;

const SwipeCard = styled.div`
  position: absolute;
  top: 0;
  background: white;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  
  /* Desktop styles */
  width: ${props => props.$isActive ? '80%' : '70%'};
  height: 100%;
  padding: 2rem;
  box-shadow: ${props => props.$isActive 
    ? '0 8px 32px rgba(0,0,0,0.15)' 
    : '0 4px 16px rgba(0,0,0,0.1)'};
  cursor: ${props => props.$isActive ? 'default' : 'pointer'};
  opacity: ${props => props.$isActive ? 1 : 0.7};
  transform: ${props => {
    const baseTransform = props.$position === 0 ? '-50%' :
                         props.$position === -1 ? '-85%' :
                         props.$position === 1 ? '-15%' :
                         '-50%';
    
    const dragOffset = props.$isDragging ? props.$dragOffset : 0;
    const scaleTransform = props.$isActive ? 'scale(1)' : 'scale(0.9)';
    
    return `translateX(calc(${baseTransform} + ${dragOffset}px)) ${scaleTransform}`;
  }};
  transition: ${props => props.$isDragging || props.$isTransitioning ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'};
  z-index: ${props => props.$isActive ? 10 : 5};
  filter: ${props => props.$isActive ? 'brightness(1)' : 'brightness(0.8)'};
  left: 50%;
  
  &:hover {
    ${props => !props.$isActive && `
      opacity: 0.85;
      transform: translateX(calc(${props.$position === 0 ? '-50%' : 
                  props.$position === -1 ? '-83%' : 
                  props.$position === 1 ? '-17%' : 
                  '-50%'} + ${props.$isDragging ? props.$dragOffset : 0}px)) scale(0.92);
    `}
  }

  /* Mobile styles */
  @media (max-width: 768px) {
    width: 100%;
    padding: 1.5rem;
    box-sizing: border-box; /* 패딩을 너비 안에 포함 */
    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    cursor: default;
    opacity: ${props => props.$isActive ? 1 : 0};
    transform: translateX(${props => props.$isActive ? '0' : (props.$position < 0 ? '-100%' : '100%')});
    transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
    z-index: ${props => props.$isActive ? 10 : 5};
    left: 0;
    filter: none;

    &:hover {
      opacity: ${props => props.$isActive ? 1 : 0};
      transform: translateX(${props => props.$isActive ? '0' : (props.$position < 0 ? '-100%' : '100%')});
    }
  }

  @media (max-width: 600px) {
    padding: 1rem;
    box-sizing: border-box; /* 패딩을 너비 안에 포함 */
  }
`;



export default ArticleDetail;
