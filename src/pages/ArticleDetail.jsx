import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
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
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import PageContainer from '../components/PageContainer';
import { useEnhancedToast } from '../components/EnhancedToastProvider';
import PremiumContentGuard from '../components/PremiumContentGuard';



// 기사 내용에서 3개 레벨 생성 (개선된 버전)
const generateLevelsFromContent = (article) => {
  console.log('🔧 기사 레벨 생성:', article.title);
  console.log('🔧 원본 content 타입:', typeof article.content);
  console.log('🔧 원본 content:', article.content);
  
  // 새로운 3개 버전 구조를 그대로 사용
  if (article.content && typeof article.content === 'object') {
    const levels = {
      1: {
        title: 'Level 1 - Beginner',
        content: article.content.beginner || ''
      },
      2: {
        title: 'Level 2 - Intermediate', 
        content: article.content.intermediate || ''
      },
      3: {
        title: 'Level 3 - Advanced',
        content: article.content.advanced || ''
      }
    };
    console.log('✅ 객체 형태 레벨 생성 완료:', levels);
    return levels;
  } else {
    // 기존 단일 문자열 구조인 경우 모든 소스에서 콘텐츠 찾기
    const baseContent = article.content || article.summary || article.description || 'No content available';
    console.log('📝 기본 콘텐츠 사용:', baseContent.substring(0, 100), '...');
    
    const levels = {
      1: {
        title: 'Level 1 - Beginner',
        content: baseContent
      },
      2: {
        title: 'Level 2 - Intermediate',
        content: baseContent
      },
      3: {
        title: 'Level 3 - Advanced',
        content: baseContent
      }
    };
    console.log('✅ 단일 형태 레벨 생성 완료:', Object.keys(levels).map(k => ({level: k, contentLength: levels[k].content.length})));
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

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth() || {};
  const { allArticles, loading: articlesLoading } = useArticles();
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
  
  // TTS 상태
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [isTTSLoading, setIsTTSLoading] = useState(false); // 로딩 상태 추가
  const [currentSentence, setCurrentSentence] = useState(0);
  const [currentUtterance, setCurrentUtterance] = useState(null);
  const [ttsSpeed, setTtsSpeed] = useState(userSettings?.ttsSpeed || 0.8);
  const [ttsPause, setTtsPause] = useState(userSettings?.ttsPause || 200);

  // userSettings 변경 시 TTS 설정 업데이트
  useEffect(() => {
    if (userSettings?.ttsSpeed) {
      setTtsSpeed(userSettings.ttsSpeed);
    }
    if (userSettings?.ttsPause !== undefined) {
      setTtsPause(userSettings.ttsPause);
    }
  }, [userSettings?.ttsSpeed, userSettings?.ttsPause]);

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
        console.log('🔍 원본 기사 데이터 확인:', foundArticle);
        
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
        
        console.log('🔧 변환된 기사 데이터:', transformedArticle);
        setArticleData(transformedArticle);
        
        // 조회 기록 추가 및 활동 시간 업데이트 (로그인된 사용자만)
        if (user?.uid) {
          addViewRecord(foundArticle);
          updateActivityTime && updateActivityTime();
        }
      }
    }
  }, [articlesLoading, allArticles, id, user?.uid]);

  // 컴포넌트 마운트 시 좋아요 상태 확인
  useEffect(() => {
    if (isArticleLiked && articleData && user?.uid) {
      const likedStatus = isArticleLiked(articleData.id);
      console.log('💖 좋아요 상태 확인:', articleData.id, likedStatus);
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
      console.log('🌈 하이라이트 로드:', articleWords.length, '개 단어');
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
        console.log('🔄 단어장 동기화:', articleWords);
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
      
      console.log('🎨 DOM 하이라이트 업데이트:', highlightedWords.size, '개 단어');
    }
  }, [highlightedWords, articleData?.id, userSettings?.highlightSavedWords]);

  // saveHighlights 함수 제거 - 이제 Firebase에서 단어장 데이터로 하이라이트 관리

  // TTS 컨트롤러 상태
  const [ttsController, setTtsController] = useState(null);

  // ArticleDetail 전용 TTS 설정
  useEffect(() => {
    // TTS 컨트롤러 생성
    const controller = window.createTTSController ? window.createTTSController() : null;
    setTtsController(controller);
    
    // 컴포넌트별 TTS 중지 함수
    const stopArticleTTS = () => {
      try {
        if (controller) {
          controller.stop();
        }
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        setIsTTSPlaying(false);
        setCurrentSentence(-1);
        setCurrentUtterance(null);
        console.log('🔇 ArticleDetail TTS 중지됨');
      } catch (error) {
        console.error('ArticleDetail TTS 중지 오류:', error);
      }
    };

    // 전역 TTS 중지 함수에 등록
    window.stopCurrentTTS = stopArticleTTS;

    // 컴포넌트 언마운트 시 즉시 TTS 중지
    return () => {
      stopArticleTTS();
      if (window.stopCurrentTTS === stopArticleTTS) {
        delete window.stopCurrentTTS;
      }
    };
  }, []);

  // 배속 변경용 TTS 시작 함수 (무한 루프 방지)
  const startTTSWithSpeed = async (speed, controller) => {
    if (!window.speechSynthesis || !articleData || !controller) {
      console.error('❌ Speech synthesis, 기사 데이터 또는 컨트롤러 없음');
      return;
    }

    setIsTTSLoading(true);

    // 기존 재생 즉시 중지
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const currentContent = articleData?.levels?.[selectedLevel]?.content || '';
    console.log('🔍 배속 변경 - 현재 레벨:', selectedLevel);
    console.log('🔍 배속 변경 - 현재 콘텐츠:', currentContent.substring(0, 100), '...');
    
    const sentences = currentContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length === 0) {
      console.warn('⚠️ 재생할 문장이 없습니다. 레벨:', selectedLevel);
      setIsTTSLoading(false);
      return;
    }
    
    console.log('📝 배속 변경 - 문장 개수:', sentences.length);

    // TTS 상태를 미리 설정
    setIsTTSPlaying(true);
    setIsTTSLoading(false);
    setCurrentSentence(0);

    try {
      // 음성 목록을 완전히 로드될 때까지 대기
      console.log('🔊 배속 변경 - 음성 로딩 시작...');
      const englishVoice = await getEnglishVoice();
      console.log('✅ 배속 변경 - 음성 로딩 완료:', englishVoice ? englishVoice.name : 'fallback');
      
      // 음성이 로드된 후 약간의 추가 대기
      await new Promise(resolve => setTimeout(resolve, 100));
      
      let currentIndex = 0;

      const playNextSentence = () => {
        if (!controller.isRunning() || currentIndex >= sentences.length) {
          console.log('🛑 배속 변경 TTS 종료:', !controller.isRunning() ? '컨트롤러 중지' : '모든 문장 완료');
          setIsTTSPlaying(false);
          setCurrentSentence(-1);
          setCurrentUtterance(null);
          return;
        }
        
        const sentence = sentences[currentIndex].trim();
        if (!sentence) {
          currentIndex++;
          setTimeout(playNextSentence, 50);
          return;
        }

        console.log(`📢 배속 ${speed} - 문장 ${currentIndex + 1}/${sentences.length}: ${sentence.substring(0, 50)}...`);

        const utterance = new SpeechSynthesisUtterance(sentence);
        utterance.rate = speed; // 새로운 속도 사용
        utterance.volume = 1.0;
        utterance.pitch = 1.0;
        
        if (englishVoice) {
          utterance.voice = englishVoice;
          utterance.lang = englishVoice.lang;
        } else {
          utterance.lang = 'en-US';
        }

        utterance.onstart = () => {
          if (controller.isRunning()) {
            console.log(`▶️ 배속 ${speed} - 문장 ${currentIndex + 1} 재생 시작`);
            setCurrentSentence(currentIndex);
          }
        };
        
        utterance.onend = () => {
          if (controller.isRunning()) {
            console.log(`⏹️ 배속 ${speed} - 문장 ${currentIndex + 1} 재생 완료`);
            currentIndex++;
            setTimeout(playNextSentence, 200);
          }
        };
        
        utterance.onerror = (event) => {
          console.error('❌ 배속 변경 TTS Error:', event.error, '문장:', currentIndex + 1);
          if (controller.isRunning()) {
            currentIndex++;
            setTimeout(playNextSentence, 500);
          }
        };
        
        controller.currentUtterance = utterance;
        setCurrentUtterance(utterance);
        
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          setTimeout(() => window.speechSynthesis.speak(utterance), 100);
        } else {
          window.speechSynthesis.speak(utterance);
        }
      };
      
      playNextSentence();
      
    } catch (error) {
      console.error('❌ 배속 변경 TTS 시작 실패:', error);
      setIsTTSPlaying(false);
      setIsTTSLoading(false);
      setCurrentSentence(-1);
      setCurrentUtterance(null);
    }
  };

  // TTS 시작 함수 (첫 문장 문제 해결)
  const startTTS = async () => {
    if (!window.speechSynthesis || !articleData) {
      console.error('❌ Speech synthesis 또는 기사 데이터 없음');
      return;
    }

    setIsTTSLoading(true); // 로딩 시작

    if (!ttsController || !ttsController.isRunning()) {
      console.warn('⚠️ TTS 컨트롤러가 없거나 중지된 상태입니다. 새로 생성합니다.');
      const newController = window.createTTSController ? window.createTTSController() : null;
      if (!newController) {
        console.error('❌ TTS 컨트롤러 생성 실패');
        setIsTTSLoading(false);
        return;
      }
      setTtsController(newController);
      // 새 컨트롤러 생성 후 재귀 호출
      setTimeout(() => startTTS(), 50);
      return;
    }

    // 기존 재생 즉시 중지
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const currentContent = articleData?.levels?.[selectedLevel]?.content || '';
    console.log('🔍 현재 레벨:', selectedLevel);
    console.log('🔍 기사 데이터:', articleData?.levels);
    console.log('🔍 현재 콘텐츠:', currentContent.substring(0, 100), '...');
    
    const sentences = currentContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length === 0) {
      console.warn('⚠️ 재생할 문장이 없습니다. 레벨:', selectedLevel);
      console.warn('⚠️ 전체 콘텐츠:', currentContent);
      setIsTTSLoading(false);
      return;
    }
    
    console.log('📝 문장 개수:', sentences.length);

    // TTS 상태를 미리 설정
    setIsTTSPlaying(true);
    setIsTTSLoading(false); // 로딩 완료
    setCurrentSentence(0);

    try {
      // 음성 목록을 완전히 로드될 때까지 대기 (첫 접속 문제 해결)
      console.log('🔊 음성 로딩 시작...');
      const englishVoice = await getEnglishVoice();
      console.log('✅ 음성 로딩 완료:', englishVoice ? englishVoice.name : 'fallback');
      
      // 음성이 로드된 후 약간의 추가 대기 (안정성 향상)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      let currentIndex = 0;

      const playNextSentence = () => {
        // 컨트롤러가 중지되었는지 확인
        if (!ttsController.isRunning() || currentIndex >= sentences.length) {
          console.log('🛑 TTS 종료:', !ttsController.isRunning() ? '컨트롤러 중지' : '모든 문장 완료');
          setIsTTSPlaying(false);
          setCurrentSentence(-1);
          setCurrentUtterance(null);
          return;
        }
        
        const sentence = sentences[currentIndex].trim();
        if (!sentence) {
          currentIndex++;
          setTimeout(playNextSentence, 50);
          return;
        }

        console.log(`📢 문장 ${currentIndex + 1}/${sentences.length}: ${sentence.substring(0, 50)}...`);

        const utterance = new SpeechSynthesisUtterance(sentence);
        utterance.rate = ttsSpeed;
        utterance.volume = 1.0;
        utterance.pitch = 1.0;
        
        // 로드된 음성 사용
        if (englishVoice) {
          utterance.voice = englishVoice;
          utterance.lang = englishVoice.lang;
        } else {
          utterance.lang = 'en-US';
        }

        utterance.onstart = () => {
          if (ttsController.isRunning()) {
            console.log(`▶️ 문장 ${currentIndex + 1} 재생 시작`);
            setCurrentSentence(currentIndex);
          }
        };
        
        utterance.onend = () => {
          if (ttsController.isRunning()) {
            console.log(`⏹️ 문장 ${currentIndex + 1} 재생 완료`);
            currentIndex++;
            // 다음 문장 재생 전 짧은 대기
            setTimeout(playNextSentence, 200);
          }
        };
        
        utterance.onerror = (event) => {
          console.error('❌ TTS Error:', event.error, '문장:', currentIndex + 1);
          if (ttsController.isRunning()) {
            currentIndex++;
            setTimeout(playNextSentence, 500);
          }
        };
        
        ttsController.currentUtterance = utterance;
        setCurrentUtterance(utterance);
        
        // speechSynthesis가 준비되었는지 확인 후 재생
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          setTimeout(() => window.speechSynthesis.speak(utterance), 100);
        } else {
          window.speechSynthesis.speak(utterance);
        }
      };
      
      // 첫 번째 문장 재생 시작
      playNextSentence();
      
    } catch (error) {
      console.error('❌ TTS 시작 실패:', error);
      setIsTTSPlaying(false);
      setIsTTSLoading(false);
      setCurrentSentence(-1);
      setCurrentUtterance(null);
    }
  };

  const handleTTS = () => {
    if (isTTSPlaying) {
      // TTS 중지
      if (ttsController) {
        ttsController.stop();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsTTSPlaying(false);
      setIsTTSLoading(false);
      setCurrentSentence(-1);
      setCurrentUtterance(null);
    } else {
      // TTS 시작
      startTTS();
    }
  };

  const handleSpeedChange = (newSpeed) => {
    console.log('⚡ 배속 변경:', ttsSpeed, '→', newSpeed);
    setTtsSpeed(newSpeed);
    
    // 재생 중이면 현재 위치에서 새 속도로 재시작
    if (isTTSPlaying && ttsController) {
      console.log('🔄 재생 중 배속 변경 - TTS 재시작');
      
      // 기존 재생 중지 (컨트롤러는 유지)
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      
      // 컨트롤러를 중지하지 않고 새 컨트롤러 생성
      const newController = window.createTTSController ? window.createTTSController() : null;
      if (newController) {
        setTtsController(newController);
        
        setTimeout(() => {
          // 새 속도로 TTS 재시작
          startTTSWithSpeed(newSpeed, newController);
        }, 100);
      }
    }
  };

  const handleLevelChange = (level) => {
    console.log('🔄 레벨 변경:', selectedLevel, '→', level);
    
    // 기존 TTS 중지
    if (ttsController) {
      ttsController.stop();
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsTTSPlaying(false);
    setIsTTSLoading(false);
    setCurrentSentence(-1);
    setCurrentUtterance(null);
    setSelectedLevel(level);
    
    // 새로운 TTS 컨트롤러 생성 (레벨 변경 후)
    setTimeout(() => {
      if (window.createTTSController) {
        const newController = window.createTTSController();
        setTtsController(newController);
        console.log('✅ 새 TTS 컨트롤러 생성 완료');
      }
    }, 100);
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // 스와이프 핸들러 추가
  const createSwipeHandlers = () => {
    const handleStart = (e, clientX) => {
      // 단어 자체를 클릭했을 때는 스와이프를 시작하지 않음
      if (e.target.classList.contains('clickable-word-span') || 
          e.target.classList.contains('highlighted-word') ||
          e.target.closest('.clickable-word-span') ||
          e.target.closest('.highlighted-word')) {
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
      // 터치 이벤트 (passive event listener 문제 해결)
      onTouchStart: (e) => {
        // 단어 클릭 요소인지 확인
        if (e.target.classList.contains('clickable-word-span') || 
            e.target.classList.contains('highlighted-word') ||
            e.target.closest('.clickable-word-span') ||
            e.target.closest('.highlighted-word')) {
          return;
        }
        handleStart(e, e.touches[0].clientX);
      },
      onTouchMove: (e) => {
        if (swipeState.isDragging) {
          // passive event listener에서는 preventDefault 사용 안 함
          handleMove(e.touches[0].clientX);
        }
      },
      onTouchEnd: (e) => {
        // 단어 클릭 요소인지 확인
        if (e.target.classList.contains('clickable-word-span') || 
            e.target.classList.contains('highlighted-word') ||
            e.target.closest('.clickable-word-span') ||
            e.target.closest('.highlighted-word')) {
          return;
        }
        // passive event listener에서는 preventDefault 사용 안 함
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
      const newLikeStatus = toggleLike(articleData);
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
      console.error('Error toggling like:', error);
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
      console.error('Share failed:', error);
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
            new Audio(wordData.audio).play().catch(e => console.error("Audio play failed", e));
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
                  console.log('Auto-play failed, using TTS:', e);
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
                console.log('Auto-play audio failed:', error);
              }
            }, 500); // 팝업이 완전히 열린 후 재생
          }
        }
      } catch (error) {
        console.error('Error fetching word data:', error);
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
      
      console.log('🔄 자동 저장:', cleanWord);
      
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
      
      console.log('💾 단어 저장:', wordPopup.word);
      
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
      console.warn('단어 저장 실패');
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
    
    console.log('🗑️ 단어 삭제:', cleanWord);
    
    // 하이라이트된 단어 목록에서 제거
    const newHighlights = new Set([...highlightedWords]);
    newHighlights.delete(cleanWord);
    setHighlightedWords(newHighlights);
    
    // 단어장에서 해당 단어 삭제
    const wordToRemove = savedWords.find(w => w.word.toLowerCase() === cleanWord && w.articleId === articleData.id);
    if (wordToRemove) {
      console.log('📚 단어장에서 삭제:', wordToRemove);
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
        console.error('Error fetching word data:', error);
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
        console.error('Audio playback failed, falling back to TTS:', error);
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
      console.error('❌ Speech synthesis 또는 단어가 없음');
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
      console.warn('Failed to get English voice:', error);
      utterance.lang = 'en-US';
    }

    utterance.onerror = (event) => {
      console.error('TTS Error:', event.error);
    };

    window.speechSynthesis.speak(utterance);
  };



  // 로딩 중이거나 기사를 찾지 못한 경우
  if (articlesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading article...</Typography>
      </Box>
    );
  }

  if (!articleData) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography variant="h6" color="error">Article not found</Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>The article you're looking for doesn't exist.</Typography>
        <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>Go back to Home</Button>
      </Box>
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



          {/* 스와이프 카드 시스템 */}
          <SwipeCardContainer {...swipeHandlers}>
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
                const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
                
                return sentences.map((sentence, sentenceIdx) => {
                        const isCurrentSentence = currentSentence === sentenceIdx && isTTSPlaying && isActive;
                  
                  return (
                    <SentenceSpan 
                      key={sentenceIdx}
                      $isActive={isCurrentSentence}
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
                      {sentenceIdx < sentences.length - 1 && '. '}
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
  
  ${props => props.$isHighlighted ? `
    background-color: #fff9c4;
    &:hover {
      background-color: #fff59d;
    }
  ` : `
    &:hover {
      background-color: #f0f0f0;
    }
  `}
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
  transition: all 0.2s ease;
  
  ${props => props.$isActive && `
    border-bottom: 2px solid #1976d2;
    background-color: rgba(25, 118, 210, 0.1);
  `}
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
  touch-action: manipulation; /* passive event listener 호환을 위한 변경 */

  /* Desktop styles */
  height: 700px;
  overflow: visible;

  /* Mobile styles */
  @media (max-width: 768px) {
    min-height: 500px;
    height: auto;
    overflow: hidden;
    touch-action: manipulation; /* 수직 스크롤 허용, 수평 스와이프는 JavaScript로 처리 */
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
  }
`;



export default ArticleDetail;
