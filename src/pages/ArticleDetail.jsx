import React, { useState, useEffect, useRef } from 'react';
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
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
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import PageContainer from '../components/PageContainer';
import { useToast } from '../components/ToastProvider';



// 기사 내용에서 3개 레벨 생성
const generateLevelsFromContent = (article) => {
  // 새로운 3개 버전 구조를 그대로 사용
  if (article.content && typeof article.content === 'object') {
    return {
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
  } else {
    // 기존 단일 문자열 구조인 경우 그대로 사용
    const baseContent = article.content || article.summary || '';
    return {
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
  }
};


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
    addViewRecord,
    updateActivityTime
  } = useData();
  const toast = useToast();

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
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  
  // TTS 상태
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [currentSentence, setCurrentSentence] = useState(0);
  const [currentUtterance, setCurrentUtterance] = useState(null);
  const [ttsSpeed, setTtsSpeed] = useState(1.0);

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
        // 기사 데이터를 ArticleDetail 형태로 변환
        const transformedArticle = {
          id: foundArticle.id,
          title: foundArticle.title,
          category: foundArticle.category,
          date: new Date(foundArticle.publishedAt).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          }),
          image: foundArticle.image,
          liked: false,
          levels: generateLevelsFromContent(foundArticle)
        };
        setArticleData(transformedArticle);
        
        // 조회 기록 추가 및 활동 시간 업데이트 (로그인된 사용자만)
        if (user?.id) {
          addViewRecord(foundArticle.id);
          updateActivityTime && updateActivityTime();
        }
      }
    }
  }, [articlesLoading, allArticles, id, user?.id]);

  // 컴포넌트 마운트 시 좋아요 상태 확인
  useEffect(() => {
    if (isArticleLiked && articleData) {
      const likedStatus = isArticleLiked(articleData.id);
      setIsLiked(likedStatus);
    }
  }, [isArticleLiked, articleData?.id]);

  // 하이라이트된 단어들을 로컬스토리지에서 로드
  useEffect(() => {
    if (articleData) {
      const highlightKey = `marlang_highlights_${articleData.id}`;
      try {
        const stored = localStorage.getItem(highlightKey);
        if (stored) {
          const highlights = JSON.parse(stored);
          setHighlightedWords(new Set(highlights));
        }
      } catch (error) {
        console.error('Error loading highlights:', error);
      }
    }
  }, [articleData?.id]);

  // localStorage 변경 감지 (다른 탭/창에서 단어장 변경 시)
  useEffect(() => {
    if (!articleData) return;

    const handleStorageChange = (event) => {
      const highlightKey = `marlang_highlights_${articleData.id}`;
      if (event.key === highlightKey && event.newValue !== event.oldValue) {
        try {
          const highlights = event.newValue ? JSON.parse(event.newValue) : [];
          setHighlightedWords(new Set(highlights));
        } catch (error) {
          console.error('Error parsing highlights from storage:', error);
        }
      }
    };

    // 같은 탭 내에서 하이라이트 변경 감지
    const handleHighlightUpdate = (event) => {
      if (event.detail.articleId === articleData.id) {
        setHighlightedWords(new Set(event.detail.highlights));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('highlightUpdated', handleHighlightUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('highlightUpdated', handleHighlightUpdate);
    };
  }, [articleData?.id]);

  // 하이라이트된 단어들을 로컬스토리지에 저장
  const saveHighlights = (highlights) => {
    if (articleData) {
      const highlightKey = `marlang_highlights_${articleData.id}`;
      try {
        localStorage.setItem(highlightKey, JSON.stringify([...highlights]));
      } catch (error) {
        console.error('Error saving highlights:', error);
      }
    }
  };

  // 자연스러운 TTS 설정
  useEffect(() => {

    // 전역 TTS 중지 함수 등록
    const stopAllTTS = () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsTTSPlaying(false);
      setCurrentSentence(-1);
      setCurrentUtterance(null);
    };

    // 전역에 등록하여 어디서든 접근 가능하게
    window.stopCurrentTTS = stopAllTTS;

    // 브라우저 탭 닫기/새로고침 시 TTS 중지 (간단하게)
    const handleBeforeUnload = () => {
      stopAllTTS();
    };

    // 페이지 visibility 변경 시 TTS 중지 (네비게이션 방해 없이)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAllTTS();
      }
    };

    // React Router 네비게이션 감지 (popstate 이벤트)
    const handlePopState = () => {
      stopAllTTS();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handlePopState);

    // 컴포넌트 언마운트 시 즉시 TTS 중지
    return () => {
      stopAllTTS();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handlePopState);
      // 전역 함수도 제거
      if (window.stopCurrentTTS === stopAllTTS) {
        delete window.stopCurrentTTS;
      }
    };
  }, []);

  // TTS 시작 함수 (더 안전하게)
  const startTTS = () => {
    if (!window.speechSynthesis || !articleData) {
      console.error('❌ Speech synthesis 또는 기사 데이터 없음');
      return;
    }

    // 기존 재생 즉시 중지
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const currentContent = articleData?.levels?.[selectedLevel]?.content || '';
    const sentences = currentContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length === 0) {
      console.warn('⚠️ 재생할 문장이 없습니다');
      return;
    }

    let currentIndex = 0;
    let isPlaying = true;

    const playNextSentence = () => {
      if (!isPlaying || currentIndex >= sentences.length) {
        // 재생 완료
        setIsTTSPlaying(false);
        setCurrentSentence(-1);
        setCurrentUtterance(null);
        return;
      }

      const sentence = sentences[currentIndex].trim();
      if (!sentence) {
        currentIndex++;
        setTimeout(playNextSentence, 100);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.lang = 'en-US';
      utterance.rate = ttsSpeed;
      utterance.volume = 1.0;
      utterance.pitch = 1.0;

      // 음성 선택
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => voice.lang === 'en-US') ||
                            voices.find(voice => voice.lang === 'en-GB') ||
                            voices.find(voice => voice.lang.startsWith('en'));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        if (isPlaying) {
          setCurrentSentence(currentIndex);
        }
      };

      utterance.onend = () => {
        if (isPlaying) {
          currentIndex++;
          setTimeout(playNextSentence, 200);
        }
      };

      utterance.onerror = (event) => {
        console.error('TTS Error:', event.error);
        if (isPlaying) {
          currentIndex++;
          setTimeout(playNextSentence, 100);
        }
      };

      setCurrentUtterance(utterance);
      window.speechSynthesis.speak(utterance);
    };

    // TTS 중지 함수 등록
    const stopTTS = () => {
      isPlaying = false;
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsTTSPlaying(false);
      setCurrentSentence(-1);
      setCurrentUtterance(null);
    };

    window.stopCurrentTTS = stopTTS;
    setIsTTSPlaying(true);
    playNextSentence();
  };

  const handleTTS = () => {
    if (isTTSPlaying) {
      // TTS 중지
      if (window.stopCurrentTTS) {
        window.stopCurrentTTS();
      } else {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        setIsTTSPlaying(false);
        setCurrentSentence(-1);
        setCurrentUtterance(null);
      }
    } else {
      // TTS 시작
      startTTS();
    }
  };

  const handleSpeedChange = (newSpeed) => {
    setTtsSpeed(newSpeed);
    
    // 재생 중이면 현재 위치에서 새 속도로 재시작
    if (isTTSPlaying) {
      const currentIndex = currentSentence;
      if (window.stopCurrentTTS) {
        window.stopCurrentTTS();
      }
      
      setTimeout(() => {
        if (currentIndex >= 0) {
          // 현재 문장부터 다시 시작하는 간단한 로직
          startTTS();
        }
      }, 100);
    }
  };

  const handleLevelChange = (level) => {
    // TTS 중지
    if (window.stopCurrentTTS) {
      window.stopCurrentTTS();
    }
    setSelectedLevel(level);
  };

  // 스와이프 핸들러 추가
  const createSwipeHandlers = () => {
    const handleStart = (clientX) => {
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
        const direction = swipeState.dragOffset > threshold ? -1 : swipeState.dragOffset < -threshold ? 1 : 0;
        
        if (direction !== 0) {
          let newLevel = selectedLevel + direction;
          if (newLevel > 3) newLevel = 1;
          if (newLevel < 1) newLevel = 3;
          handleLevelChange(newLevel);
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
      // 터치 이벤트
      onTouchStart: (e) => {
        e.preventDefault();
        handleStart(e.touches[0].clientX);
      },
      onTouchMove: (e) => {
        e.preventDefault();
        if (swipeState.isDragging) {
          handleMove(e.touches[0].clientX);
        }
      },
      onTouchEnd: (e) => {
        e.preventDefault();
        handleEnd();
      },
      
      // 마우스 이벤트
      onMouseDown: (e) => {
        e.preventDefault();
        handleStart(e.clientX);
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
      alert('좋아요 기능을 사용하려면 로그인이 필요합니다.\n\n상단의 Login 버튼을 클릭하여 로그인해주세요.');
      return;
    }
    
    try {
      const newLikeStatus = toggleLike(articleData);
      setIsLiked(newLikeStatus);
      
      // 활동 시간 업데이트
      updateActivityTime && updateActivityTime();
      
      // 좋아요 상태 변경을 다른 컴포넌트에 알림
      window.dispatchEvent(new CustomEvent('likeUpdated', {
        detail: { articleId: articleData.id, isLiked: newLikeStatus }
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleWordClick = async (event, word) => {
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

  const handleSaveWord = () => {
    // 로그인 상태 확인
    if (!isAuthenticated) {
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

    // 영어 정의와 번역 모두 저장
    const englishDefinition = wordPopup.englishDefinition;
    const translatedDefinition = wordPopup.translatedDefinition;
    
    const success = addWord(
      wordPopup.word,
      englishDefinition, // 영어 정의를 메인으로
      articleData.id,
      articleData.title,
      selectedLanguage !== 'en' ? translatedDefinition : null // 번역이 있을 때만 저장
    );
    
    if (success) {
      // 활동 시간 업데이트
      updateActivityTime && updateActivityTime();
      
      // 단어 하이라이트 추가
      setSavedWords(prev => new Set([...prev, wordPopup.word]));
      
      // 하이라이트된 단어 목록에 추가하고 로컬스토리지에 저장
      const newHighlights = new Set([...highlightedWords, wordPopup.word]);
      setHighlightedWords(newHighlights);
      saveHighlights(newHighlights);
      
      // 같은 탭 내에서 하이라이트 변경 알림
      window.dispatchEvent(new CustomEvent('highlightUpdated', {
        detail: { articleId: articleData.id, highlights: [...newHighlights] }
      }));
      
      // 해당 단어에 하이라이트 클래스 추가
      if (wordPopup.selectedWord) {
        wordPopup.selectedWord.classList.add('highlighted-word');
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

  const handleRemoveWord = (event, word) => {
    event.stopPropagation();
    const cleanWord = word.trim().toLowerCase().replace(/[^\w]/g, '');
    
    // 하이라이트 제거
    setSavedWords(prev => {
      const newSet = new Set(prev);
      newSet.delete(cleanWord);
      return newSet;
    });
    
    // 하이라이트된 단어 목록에서 제거하고 로컬스토리지에 저장
    const newHighlights = new Set([...highlightedWords]);
    newHighlights.delete(cleanWord);
    setHighlightedWords(newHighlights);
    saveHighlights(newHighlights);
    
    // 단어장에서도 해당 단어 삭제
    const wordToRemove = savedWords.find(w => w.word === cleanWord && w.articleId === articleData.id);
    if (wordToRemove) {
      removeWord(wordToRemove.id);
    }
    
    // 같은 탭 내에서 하이라이트 변경 알림
    window.dispatchEvent(new CustomEvent('highlightUpdated', {
      detail: { articleId: articleData.id, highlights: [...newHighlights] }
    }));
    
    // DOM에서 하이라이트 클래스 제거
    event.target.classList.remove('highlighted-word');
  };

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

  // 음성 재생
  const playWordAudio = () => {
    if (wordPopup.audio) {
      const audio = new Audio(wordPopup.audio);
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        // TTS fallback
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(wordPopup.word);
          utterance.lang = 'en-US';
          speechSynthesis.speak(utterance);
        }
      });
    } else {
      // TTS fallback
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(wordPopup.word);
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);
      }
    }
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
        title="MarLang Eng News"
      />
      
      <MobileContentWrapper>

      {/* 기사 상세 내용 */}
      <PageContainer>
        {/* 썸네일 이미지 */}
        <ThumbnailImage src={articleData.image} alt={articleData.title} />
        
        {/* 메타 정보 */}
        <MetaInfo>
          <Chip label={articleData.category} color="primary" size="small" />
          <DateText>{articleData.date}</DateText>
        </MetaInfo>

        {/* 제목 */}
        <Title>{articleData.title}</Title>

        {/* TTS 버튼 + 하트 버튼 + 배속 버튼 + 난이도 탭 */}
        <ControlsRow>
          <LeftControls>
            <TTSButton onClick={handleTTS} $isPlaying={isTTSPlaying}>
              {isTTSPlaying ? <PauseIcon /> : <PlayArrowIcon />}
              {isTTSPlaying ? 'Pause' : 'Play'}
            </TTSButton>
            
            <SpeedControls>
              <SpeedButton 
                onClick={() => handleSpeedChange(Math.max(0.5, ttsSpeed - 0.1))}
                disabled={ttsSpeed <= 0.5}
                title="Slower"
              >
                <SpeedIcon style={{ transform: 'scaleX(-1)' }} />
              </SpeedButton>
              <SpeedDisplay>{ttsSpeed.toFixed(1)}x</SpeedDisplay>
              <SpeedButton 
                onClick={() => handleSpeedChange(Math.min(2.0, ttsSpeed + 0.1))}
                disabled={ttsSpeed >= 2.0}
                title="Faster"
              >
                <SpeedIcon />
              </SpeedButton>
            </SpeedControls>
            
            <LikeButton onClick={handleLike} $isLiked={isLiked}>
              {isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </LikeButton>
          </LeftControls>
          
          {/* 레벨 인디케이터 */}
          <LevelIndicator>
            {[1, 2, 3].map(level => (
              <IndicatorDot 
                key={level}
                $active={selectedLevel === level}
                onClick={() => handleLevelChange(level)}
              />
            ))}
          </LevelIndicator>
        </ControlsRow>

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
                onClick={(e) => handleCardClick(e, level)}
              >
                <ContentTitle>
                  Level {level} - {level === 1 ? 'Beginner' : level === 2 ? 'Intermediate' : 'Advanced'}
                </ContentTitle>
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
                            const isHighlighted = highlightedWords.has(cleanWord);
                            
                            return (
                              <WordSpan 
                                key={`${sentenceIdx}-${wordIdx}`}
                                $isHighlighted={isHighlighted}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isHighlighted) {
                                    handleRemoveWord(e, word);
                                  } else {
                                    handleWordClick(e, word);
                                  }
                                }}
                                className={isHighlighted ? 'highlighted-word' : ''}
                              >
                                {word}{' '}
                              </WordSpan>
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
          
          {/* 네비게이션 버튼 */}
          <NavButton 
            $position="left" 
            onClick={() => {
              const newLevel = selectedLevel === 1 ? 3 : selectedLevel - 1;
              handleLevelChange(newLevel);
            }}
          >
            <ArrowBackIosIcon />
          </NavButton>
          <NavButton 
            $position="right" 
            onClick={() => {
              const newLevel = selectedLevel === 3 ? 1 : selectedLevel + 1;
              handleLevelChange(newLevel);
            }}
          >
            <ArrowForwardIosIcon />
          </NavButton>
        </SwipeCardContainer>
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
              <DefinitionHeader>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 0.5 }}>
                  {selectedLanguage === 'en' ? 'Definition' : 'Translation'}
                </Typography>
              </DefinitionHeader>
              <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 1 }}>
                {selectedLanguage === 'en' ? wordPopup.englishDefinition : wordPopup.translatedDefinition}
              </Typography>
              
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

const ControlsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const LeftControls = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const SpeedControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 0.5rem;
`;

const SpeedButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: ${props => props.disabled ? '#e0e0e0' : 'white'};
  color: ${props => props.disabled ? '#999' : '#1976d2'};
  border: 1px solid ${props => props.disabled ? '#ddd' : '#1976d2'};
  border-radius: 6px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  
  &:hover {
    ${props => !props.disabled && `
      background: #e3f2fd;
      transform: scale(1.05);
    `}
  }
`;

const SpeedDisplay = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1976d2;
  min-width: 35px;
  text-align: center;
`;

const TTSButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 1.5rem;
  background: ${props => props.$isPlaying ? '#1976d2' : '#f5f5f5'};
  color: ${props => props.$isPlaying ? 'white' : '#333'};
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$isPlaying ? '#1565c0' : '#e0e0e0'};
  }
`;

const LikeButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: ${props => props.$isLiked ? '#ffebee' : '#f5f5f5'};
  color: ${props => props.$isLiked ? '#d32f2f' : '#666'};
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$isLiked ? '#ffcdd2' : '#e0e0e0'};
    transform: scale(1.05);
  }
`;

const LevelIndicator = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const IndicatorDot = styled.button`
  width: 16px;
  height: 16px;
  background: ${props => props.$active ? '#1976d2' : '#f5f5f5'};
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => props.$active ? '#1565c0' : '#e0e0e0'};
  }
`;

const ContentTitle = styled.h3`
  font-size: 1.3rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: #1976d2;
  text-align: center;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e3f2fd;
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
    
    &:hover {
      background-color: #fff59d !important;
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

const WordSpan = styled.span`
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
  height: 700px;
  overflow: visible;
  border-radius: 16px;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
`;

const SwipeCard = styled.div`
  position: absolute;
  top: 0;
  width: ${props => props.$isActive ? '80%' : '70%'};
  height: 100%;
  padding: 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: ${props => props.$isActive 
    ? '0 8px 32px rgba(0,0,0,0.15)' 
    : '0 4px 16px rgba(0,0,0,0.1)'};
  cursor: ${props => props.$isActive ? 'default' : 'pointer'};
  display: flex;
  flex-direction: column;
  opacity: ${props => props.$isActive ? 1 : 0.7};
  transform: ${props => {
    // 간소화된 position 기반 변환
    const baseTransform = props.$position === 0 ? '-50%' :   // 중앙 (메인 카드)
                         props.$position === -1 ? '-85%' :   // 왼쪽 (이전 카드)
                         props.$position === 1 ? '-15%' :    // 오른쪽 (다음 카드)
                         '-50%';                              // 기본값
    
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
`;

const NavButton = styled.button`
  position: absolute;
  top: 50%;
  ${props => props.$position}: 20px;
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(25, 118, 210, 0.2);
  border-radius: 50%;
  color: #1976d2;
  font-size: 1.2rem;
  cursor: pointer;
  transform: translateY(-50%);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(25, 118, 210, 0.1);
    border-color: #1976d2;
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0 4px 16px rgba(25, 118, 210, 0.2);
  }
  
  &:active {
    transform: translateY(-50%) scale(0.95);
  }
`;

export default ArticleDetail;