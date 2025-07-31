import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import styled from 'styled-components';
import {
  Typography, IconButton, Box, Button, Chip,
  Alert, Select, MenuItem, FormControl, InputLabel, CircularProgress,
  Popover, Paper, useMediaQuery, useTheme
} from '@mui/material';
// import SearchIcon from '@mui/icons-material/Search';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import CloseIcon from '@mui/icons-material/Close';
// import SpeedIcon from '@mui/icons-material/Speed';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useArticles } from '../contexts/ArticlesContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchWordDefinitionAndTranslation, getSupportedLanguages } from '../utils/dictionaryApi';
import { getEnglishVoice } from '../utils/speechUtils';
import { createUnifiedTTS } from '../utils/UnifiedTTS';
import { optimizeTextForTTS, debugTTSOptimization } from '../utils/ttsTextPatch';
import { getTTSOptimizationSettings, isIOS } from '../utils/deviceDetect';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import PageContainer from '../components/PageContainer';
import SimpleSEO from '../components/SimpleSEO';
import SocialShareMeta from '../components/SocialShareMeta';
import SocialShareButton from '../components/SocialShareButton';
import { useEnhancedToast } from '../components/EnhancedToastProvider';
import PremiumContentGuard from '../components/PremiumContentGuard';
// 광고 컴포넌트 직접 import (안정성 확보)
import ArticleBottomBanner from '../components/ads/ArticleBottomBanner';
import { useAdFit } from '../contexts/AdFitContext';
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
      console.log('✅ 단일 형태 레벨 생성 완료 (HTML 태그 제거):', Object.keys(levels).map(k => ({ level: k, contentLength: levels[k].content.length })));
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

  // 컴포넌트 레벨 에러 핸들링
  useEffect(() => {
    const handleComponentError = (error) => {
      console.error('ArticleDetail 컴포넌트 에러:', error);
      // 에러 발생 시 안전한 상태로 복구
      try {
        if (window.globalStopTTS) {
          window.globalStopTTS();
        }
      } catch (cleanupError) {
        console.warn('에러 복구 중 정리 작업 실패:', cleanupError);
      }
    };

    // 전역 에러 이벤트 리스너 등록
    window.addEventListener('error', handleComponentError);
    window.addEventListener('unhandledrejection', (event) => {
      handleComponentError(event.reason);
    });

    return () => {
      window.removeEventListener('error', handleComponentError);
      window.removeEventListener('unhandledrejection', handleComponentError);
    };
  }, []);
  
  // 안전한 Context 사용
  const articlesContext = useArticles();
  const {
    loading: articlesLoading = true,
    incrementArticleViews = () => Promise.resolve(),
    incrementArticleLikes = () => Promise.resolve(),
    getArticleById = () => null
  } = articlesContext || {};

  // Context 함수들의 안전한 래퍼
  const safeIncrementArticleViews = useCallback(async (articleId) => {
    try {
      if (incrementArticleViews && typeof incrementArticleViews === 'function') {
        return await incrementArticleViews(articleId);
      }
    } catch (error) {
      console.warn('조회수 증가 실패:', error);
    }
  }, [incrementArticleViews]);

  const safeIncrementArticleLikes = useCallback(async (articleId) => {
    try {
      if (incrementArticleLikes && typeof incrementArticleLikes === 'function') {
        return await incrementArticleLikes(articleId);
      }
    } catch (error) {
      console.warn('좋아요 수 증가 실패:', error);
    }
  }, [incrementArticleLikes]);

  const safeGetArticleById = useCallback((articleId) => {
    try {
      if (getArticleById && typeof getArticleById === 'function') {
        return getArticleById(articleId);
      }
      return null;
    } catch (error) {
      console.warn('기사 조회 실패:', error);
      return null;
    }
  }, [getArticleById]);
  
  const { resetAds } = useAdFit();
  const {
    savedWords,
    addWord,
    removeWord,
    isWordSaved,
    // likedArticles, 
    // addLikedArticle, 
    // removeLikedArticle, 
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
  const [isLoading, setIsLoading] = useState(true);
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
  
  // 안전한 초기값 설정
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [ttsSpeed, setTtsSpeed] = useState(0.8);
  const [_ttsPause, setTtsPause] = useState(false);
  const [_totalSentences, setTotalSentences] = useState(0);

  // TTS 상태 (통합)
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [isTTSLoading, setIsTTSLoading] = useState(false);
  const [currentSentence, setCurrentSentence] = useState(-1);

  // 통합 TTS 인스턴스
  const unifiedTTSRef = useRef(null);

  // iOS TTS utterance 참조
  const iosUtteranceRef = useRef(null);

  // iOS TTS 현재 재생 위치 추적
  const iosCurrentTextRef = useRef('');

  // 활성 문장 DOM 참조 (DOM 직접 조작용)
  const activeSentenceRef = useRef(null);

  // userSettings 변경 시 TTS 설정 및 번역 언어 업데이트
  useEffect(() => {
    if (userSettings?.ttsSpeed) {
      setTtsSpeed(userSettings.ttsSpeed);
    }
    if (userSettings?.ttsPause !== undefined) {
      setTtsPause(userSettings.ttsPause);
    }
    if (userSettings?.translationLanguage) {
      setSelectedLanguage(userSettings.translationLanguage);
    }
  }, [userSettings?.ttsSpeed, userSettings?.ttsPause, userSettings?.translationLanguage]);

  // 페이지 이동 시 TTS 자동 정지 및 광고 초기화 (개선된 버전)
  useEffect(() => {
    let isMounted = true;

    // 페이지 진입 시 광고 초기화
    try {
      resetAds();
    } catch (error) {
      console.warn('광고 초기화 실패:', error);
    }

    return () => {
      isMounted = false;
      
      // 컴포넌트 언마운트 시 TTS 완전 정지
      if (import.meta.env.DEV) {
        console.log('📤 ArticleDetail 언마운트 - 통합 TTS 정지');
      }

      try {
        // 상태 초기화를 try-catch로 감싸기
        if (isMounted) {
          setIsTTSPlaying(false);
          setIsTTSLoading(false);
          setCurrentSentence(-1);
          setTotalSentences(0);
        }

        // iOS 감지 후 적절한 중지 방법 사용
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);

        if (isIOSDevice) {
          // iOS에서는 speechSynthesis.cancel() 사용
          if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
          }
          // iOS utterance 참조 정리
          if (iosUtteranceRef.current) {
            iosUtteranceRef.current = null;
          }
          iosCurrentTextRef.current = '';
        } else {
          // 기존 UnifiedTTS 중지
          if (unifiedTTSRef.current) {
            try {
              unifiedTTSRef.current.stop();
            } catch (error) {
              console.warn('UnifiedTTS 정지 실패:', error);
            }
            unifiedTTSRef.current = null;
          }
        }

        // DOM 하이라이트 정리
        if (activeSentenceRef.current) {
          try {
            activeSentenceRef.current.classList.remove('active-sentence');
          } catch (error) {
            console.warn('DOM 하이라이트 정리 실패:', error);
          }
          activeSentenceRef.current = null;
        }

        // 전역 TTS 정지 함수 호출
        if (window.globalStopTTS) {
          try {
            window.globalStopTTS();
          } catch (error) {
            console.warn('전역 TTS 정지 실패:', error);
          }
        }

        if (import.meta.env.DEV) {
          console.log('✅ 언마운트 TTS 정지 완료');
        }
      } catch (error) {
        console.error('언마운트 정리 중 오류:', error);
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

  // 안전한 프리렌더 데이터 검증 함수
  const validatePrerenderedData = (data) => {
    if (!data || typeof data !== 'object') {
      return { isValid: false, reason: 'No data or invalid type' };
    }

    // 필수 필드 검증
    const requiredFields = ['id', 'title'];
    for (const field of requiredFields) {
      if (!data[field] || typeof data[field] !== 'string') {
        return { isValid: false, reason: `Missing or invalid ${field}` };
      }
    }

    // ID 일치 검증
    if (data.id !== id) {
      return { isValid: false, reason: 'ID mismatch' };
    }

    // 데이터 무결성 검증
    if (data.title.length > 500 || (data.summary && data.summary.length > 1000)) {
      return { isValid: false, reason: 'Data length validation failed' };
    }

    return { isValid: true };
  };

  // 이미지 URL 검증 함수
  const validateImageUrl = (url) => {
    if (!url || typeof url !== 'string') {
      if (import.meta.env.DEV) {
        console.log('🖼️ 이미지 URL 검증 실패: 유효하지 않은 타입', { url, type: typeof url });
      }
      return null;
    }

    const trimmedUrl = url.trim();
    if (trimmedUrl === '') {
      if (import.meta.env.DEV) {
        console.log('🖼️ 이미지 URL 검증 실패: 빈 문자열');
      }
      return null;
    }

    if (!trimmedUrl.startsWith('http')) {
      if (import.meta.env.DEV) {
        console.log('🖼️ 이미지 URL 검증 실패: HTTP(S)로 시작하지 않음', trimmedUrl);
      }
      return null;
    }

    if (import.meta.env.DEV) {
      console.log('✅ 이미지 URL 검증 성공:', trimmedUrl);
    }
    return trimmedUrl;
  };

  // 안전한 데이터 변환 함수
  const transformPrerenderedData = (prerenderedData) => {
    try {
      const transformedArticle = {
        id: prerenderedData.id,
        title: prerenderedData.title,
        summary: prerenderedData.summary || 'No summary available',
        category: prerenderedData.category || 'General',
        publishedAt: prerenderedData.publishedAt,
        date: (() => {
          try {
            return new Date(prerenderedData.publishedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
          } catch (dateError) {
            console.warn('날짜 변환 실패:', dateError);
            return 'Unknown date';
          }
        })(),
        image: validateImageUrl(prerenderedData.image),
        liked: false,
        levels: (() => {
          try {
            // 안전한 content 처리
            if (prerenderedData.hasStructuredContent && typeof prerenderedData.content === 'object') {
              return generateLevelsFromContent({ content: prerenderedData.content });
            } else if (typeof prerenderedData.content === 'string') {
              return generateLevelsFromContent({ content: prerenderedData.content });
            } else {
              // 폴백: 기본 레벨 생성
              return generateLevelsFromContent({
                content: prerenderedData.summary || 'Content not available'
              });
            }
          } catch (levelError) {
            console.warn('레벨 생성 실패:', levelError);
            // 최종 폴백
            return {
              1: { title: 'Level 1 - Beginner', content: prerenderedData.summary || 'Content not available' },
              2: { title: 'Level 2 - Intermediate', content: prerenderedData.summary || 'Content not available' },
              3: { title: 'Level 3 - Advanced', content: prerenderedData.summary || 'Content not available' }
            };
          }
        })(),
        // 메타데이터 추가 (디버깅 및 모니터링용)
        _metadata: {
          source: 'prerender',
          loadedAt: new Date().toISOString(),
          version: '1.0'
        }
      };

      return transformedArticle;
    } catch (error) {
      console.error('데이터 변환 실패:', error);
      throw error;
    }
  };

  // 기사 데이터 로드 (향상된 버전)
  useEffect(() => {
    let isMounted = true;
    let dataLoaded = false;

    const loadData = async () => {
      try {
        // 프리렌더된 데이터 우선 처리
        const prerenderedData = window.__PRERENDERED_ARTICLE__;

        if (prerenderedData && isMounted) {
          const validation = validatePrerenderedData(prerenderedData);

          if (validation.isValid) {
            try {
              if (import.meta.env.DEV) {
                console.log('🚀 프리렌더된 기사 데이터 사용:', prerenderedData);
                console.log('🖼️ 프리렌더 이미지 정보:', {
                  originalImage: prerenderedData.image,
                  imageLength: prerenderedData.image ? prerenderedData.image.length : 0,
                  imageType: typeof prerenderedData.image,
                  isValidUrl: !!validateImageUrl(prerenderedData.image)
                });
              }

              const transformedArticle = transformPrerenderedData(prerenderedData);

              if (import.meta.env.DEV) {
                console.log('🔧 변환된 기사 데이터:', {
                  id: transformedArticle.id,
                  title: transformedArticle.title,
                  image: transformedArticle.image,
                  imageExists: !!transformedArticle.image
                });
              }

              if (isMounted) {
                setArticleData(transformedArticle);
                setIsLoading(false);
                dataLoaded = true;
              }

              // 조회 기록 추가 및 활동 시간 업데이트 (로그인된 사용자만)
              if (user?.uid && isMounted) {
                try {
                  await addViewRecord(transformedArticle);
                  if (updateActivityTime) {
                    await updateActivityTime();
                  }
                } catch (recordError) {
                  console.warn('조회 기록 추가 실패:', recordError);
                  // 비치명적 오류이므로 계속 진행
                }
              }

              // 기사 조회수 증가 (로그인된 사용자만)
              if (user?.uid && isMounted) {
                await safeIncrementArticleViews(transformedArticle.id);
              }

              // 프리렌더 데이터 정리 (메모리 절약)
              setTimeout(() => {
                try {
                  delete window.__PRERENDERED_ARTICLE__;
                } catch (cleanupError) {
                  console.warn('프리렌더 데이터 정리 실패:', cleanupError);
                }
              }, 1000);

              return;
            } catch (transformError) {
              console.error('프리렌더 데이터 변환 실패:', transformError);
              // 폴백으로 기존 방식 사용
            }
          } else {
            if (import.meta.env.DEV) {
              console.warn('프리렌더 데이터 검증 실패:', validation.reason);
            }
            // 폴백으로 기존 방식 사용
          }
        }

        // 프리렌더된 데이터가 없거나 실패한 경우 기존 API 방식 사용 (폴백)
        if (!dataLoaded && !articlesLoading && id && isMounted) {
          try {
            const foundArticle = safeGetArticleById(id);

            if (foundArticle && isMounted) {
              if (import.meta.env.DEV) {
                console.log('🔍 API에서 기사 데이터 로드:', foundArticle.id);
                console.log('🔍 이미지 관련 필드 확인:', {
                  image: foundArticle.image,
                  imageUrl: foundArticle.imageUrl,
                  thumbnail: foundArticle.thumbnail,
                  hasImage: !!foundArticle.image,
                  hasImageUrl: !!foundArticle.imageUrl,
                  hasThumbnail: !!foundArticle.thumbnail,
                  allKeys: Object.keys(foundArticle)
                });
              }

              // 안전한 기사 데이터 변환
              const transformedArticle = {
                id: foundArticle.id,
                title: foundArticle.title || 'Untitled',
                summary: foundArticle.summary || foundArticle.description || foundArticle.content || 'No summary available',
                category: foundArticle.category || 'General',
                publishedAt: foundArticle.publishedAt,
                date: (() => {
                  try {
                    return new Date(foundArticle.publishedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    });
                  } catch (dateError) {
                    console.warn('API 데이터 날짜 변환 실패:', dateError);
                    return 'Unknown date';
                  }
                })(),
                image: validateImageUrl(foundArticle.image),
                liked: false,
                levels: (() => {
                  try {
                    return generateLevelsFromContent(foundArticle);
                  } catch (levelError) {
                    console.warn('API 데이터 레벨 생성 실패:', levelError);
                    // 최종 폴백
                    const fallbackContent = foundArticle.summary || foundArticle.description || 'Content not available';
                    return {
                      1: { title: 'Level 1 - Beginner', content: fallbackContent },
                      2: { title: 'Level 2 - Intermediate', content: fallbackContent },
                      3: { title: 'Level 3 - Advanced', content: fallbackContent }
                    };
                  }
                })(),
                // 메타데이터 추가
                _metadata: {
                  source: 'api',
                  loadedAt: new Date().toISOString(),
                  version: '1.0'
                }
              };

              if (import.meta.env.DEV) {
                console.log('🔧 API에서 변환된 기사 데이터:', transformedArticle);
                console.log('🔧 변환된 이미지 필드:', {
                  originalImage: foundArticle.image,
                  transformedImage: transformedArticle.image,
                  imageType: typeof transformedArticle.image,
                  imageLength: transformedArticle.image ? transformedArticle.image.length : 0
                });
              }

              if (isMounted) {
                setArticleData(transformedArticle);
                setIsLoading(false);
                dataLoaded = true;
              }

              // 조회 기록 추가 및 활동 시간 업데이트 (로그인된 사용자만)
              if (user?.uid && isMounted) {
                try {
                  await addViewRecord(foundArticle);
                  if (updateActivityTime) {
                    await updateActivityTime();
                  }
                } catch (recordError) {
                  console.warn('API 데이터 조회 기록 추가 실패:', recordError);
                }
              }

              // 기사 조회수 증가 (로그인된 사용자만)
              if (user?.uid && isMounted) {
                await safeIncrementArticleViews(foundArticle.id);
              }
            } else if (isMounted) {
              // 기사를 찾을 수 없는 경우
              if (import.meta.env.DEV) {
                console.warn(`기사를 찾을 수 없음: ${id}`);
              }

              // 404 상태를 나타내는 특별한 상태 설정
              setArticleData({
                id: id,
                title: '기사를 찾을 수 없습니다',
                summary: '요청하신 기사를 찾을 수 없습니다.',
                category: 'Error',
                publishedAt: new Date().toISOString(),
                date: 'Unknown',
                image: null,
                liked: false,
                levels: {
                  1: { title: 'Error', content: '기사를 찾을 수 없습니다.' },
                  2: { title: 'Error', content: '기사를 찾을 수 없습니다.' },
                  3: { title: 'Error', content: '기사를 찾을 수 없습니다.' }
                },
                _metadata: {
                  source: 'error',
                  loadedAt: new Date().toISOString(),
                  version: '1.0',
                  error: 'article_not_found'
                }
              });
              setIsLoading(false);
            }
          } catch (apiError) {
            console.error('API 데이터 로딩 실패:', apiError);

            // API 실패 시 최종 폴백
            if (isMounted) {
              setArticleData({
                id: id || 'unknown',
                title: '데이터 로딩 실패',
                summary: '기사 데이터를 불러오는 중 오류가 발생했습니다.',
                category: 'Error',
                publishedAt: new Date().toISOString(),
                date: 'Unknown',
                image: null,
                liked: false,
                levels: {
                  1: { title: 'Error', content: '데이터 로딩 중 오류가 발생했습니다.' },
                  2: { title: 'Error', content: '데이터 로딩 중 오류가 발생했습니다.' },
                  3: { title: 'Error', content: '데이터 로딩 중 오류가 발생했습니다.' }
                },
                _metadata: {
                  source: 'error',
                  loadedAt: new Date().toISOString(),
                  version: '1.0',
                  error: 'api_loading_failed'
                }
              });
              setIsLoading(false);
            }
          }
        }
      } catch (error) {
        console.error('데이터 로딩 중 예외 발생:', error);
        if (isMounted) {
          setArticleData({
            id: id || 'unknown',
            title: '오류 발생',
            summary: '예상치 못한 오류가 발생했습니다.',
            category: 'Error',
            publishedAt: new Date().toISOString(),
            date: 'Unknown',
            image: null,
            liked: false,
            levels: {
              1: { title: 'Error', content: '예상치 못한 오류가 발생했습니다.' },
              2: { title: 'Error', content: '예상치 못한 오류가 발생했습니다.' },
              3: { title: 'Error', content: '예상치 못한 오류가 발생했습니다.' }
            },
            _metadata: {
              source: 'error',
              loadedAt: new Date().toISOString(),
              version: '1.0',
              error: 'unexpected_error'
            }
          });
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id, articlesLoading, user?.uid, safeGetArticleById, safeIncrementArticleViews]); // 의존성 배열 최적화

  // 컴포넌트 마운트 시 좋아요 상태 확인
  useEffect(() => {
    let isMounted = true;
    
    if (isArticleLiked && articleData && user?.uid && isMounted) {
      try {
        const likedStatus = isArticleLiked(articleData.id);
        if (import.meta.env.DEV) {
          console.log('💖 좋아요 상태 확인:', articleData.id, likedStatus);
        }
        if (isMounted) {
          setIsLiked(likedStatus);
        }
      } catch (error) {
        console.warn('좋아요 상태 확인 실패:', error);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [isArticleLiked, articleData?.id, user?.uid]);

  // userSettings 변경 시 언어 설정 동기화
  useEffect(() => {
    if (userSettings?.translationLanguage) {
      setSelectedLanguage(userSettings.translationLanguage);
    }
  }, [userSettings?.translationLanguage]);

  // 하이라이트된 단어들을 사용자 단어장에서 로드 (통합된 useEffect)
  useEffect(() => {
    let isMounted = true;
    
    if (articleData && savedWords && isMounted) {
      try {
        // 현재 기사에 해당하는 저장된 단어들로 하이라이트 설정
        const articleWords = savedWords
          .filter(word => word && word.articleId === articleData.id)
          .map(word => word.word ? word.word.toLowerCase() : '')
          .filter(word => word.length > 0);

        if (isMounted) {
          setHighlightedWords(new Set(articleWords));
          if (import.meta.env.DEV) {
            console.log('🌈 하이라이트 로드:', articleWords.length, '개 단어');
          }
        }
      } catch (error) {
        console.warn('하이라이트 로드 실패:', error);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [articleData?.id, savedWords])

  // 키보드 이벤트 핸들러 (화살표 키로 레벨 변경)
  useEffect(() => {
    let isMounted = true;

    const handleKeyDown = (e) => {
      try {
        if (!isMounted) return;
        
        // 팝업이 열려있거나 input/textarea에 포커스가 있을 때는 키보드 이벤트 무시
        if (wordPopup.open ||
          document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA') {
          return;
        }

        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const newLevel = selectedLevel - 1 < 1 ? 3 : selectedLevel - 1;
          if (isMounted) {
            handleLevelChange(newLevel);
          }
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          const newLevel = selectedLevel + 1 > 3 ? 1 : selectedLevel + 1;
          if (isMounted) {
            handleLevelChange(newLevel);
          }
        }
      } catch (error) {
        console.warn('키보드 이벤트 처리 실패:', error);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      isMounted = false;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedLevel, wordPopup.open]);

  // Firebase 데이터 변경 감지 (다른 디바이스에서 단어장 변경 시 자동 동기화)
  useEffect(() => {
    if (!articleData) return;

    let isMounted = true;

    const handleWordUpdated = (event) => {
      try {
        if (event.detail && event.detail.articleId === articleData.id && isMounted) {
          // 현재 기사에 해당하는 단어들로 하이라이트 업데이트
          const updatedWords = savedWords
            .filter(word => word && word.articleId === articleData.id)
            .map(word => word.word ? word.word.toLowerCase() : '')
            .filter(word => word.length > 0);
          
          if (isMounted) {
            setHighlightedWords(new Set(updatedWords));
          }
        }
      } catch (error) {
        console.warn('단어 업데이트 이벤트 처리 실패:', error);
      }
    };

    window.addEventListener('wordUpdated', handleWordUpdated);
    
    return () => {
      isMounted = false;
      window.removeEventListener('wordUpdated', handleWordUpdated);
    };
  }, [articleData?.id, savedWords]);

  // 하이라이트 상태 변경 시 DOM 업데이트 (React 상태 기반으로 처리됨)
  // DOM 직접 조작 제거: WordSpan 컴포넌트에서 isHighlighted prop을 통해 처리
  useEffect(() => {
    // 이 useEffect는 디버깅용으로만 남겨두고 실제 DOM 조작은 제거
    if (import.meta.env.DEV && articleData) {
      console.log('🎨 하이라이트 상태 업데이트:', highlightedWords.size, '개 단어');

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

  // 향상된 TTS 시작 함수 (직접 URL 접근 호환)
  const startTTS = async () => {
    // 기사 데이터 검증 (프리렌더/API 모두 호환)
    if (!articleData) {
      if (import.meta.env.DEV) {
        console.error('❌ 기사 데이터 없음');
      }
      toast?.error('기사 데이터를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    // 데이터 소스 확인 (디버깅용)
    if (import.meta.env.DEV) {
      console.log('🎵 TTS 시작 - 데이터 소스:', articleData._metadata?.source || 'unknown');
    }

    setIsTTSLoading(true); // 로딩 시작

    // iOS 플랫폼 감지 (향상된 감지 사용)
    // const { isIOS } = await import('../utils/deviceDetect'); // 이미 상단에서 임포트됨
    const _isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // 콘텐츠 검증 (프리렌더/API 데이터 모두 호환)
    const currentContent = articleData?.levels?.[selectedLevel]?.content || '';
    if (import.meta.env.DEV) {
      console.log('🔍 현재 레벨:', selectedLevel);
      console.log('🔍 기사 데이터:', articleData?.levels);
      console.log('🔍 현재 콘텐츠:', currentContent.substring(0, 100), '...');
      console.log('🔍 데이터 메타정보:', articleData._metadata);
    }

    if (currentContent.trim().length === 0) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ 재생할 콘텐츠가 없습니다. 레벨:', selectedLevel);
        console.warn('⚠️ 전체 콘텐츠:', currentContent);
      }
      setIsTTSLoading(false);
      toast?.warning('선택한 레벨의 콘텐츠가 없습니다. 다른 레벨을 선택해주세요.');
      return;
    }

    // TTS 기능 지원 확인
    if (!window.speechSynthesis) {
      if (import.meta.env.DEV) {
        console.error('❌ TTS 기능 미지원 브라우저');
      }
      setIsTTSLoading(false);
      toast?.error('이 브라우저는 음성 읽기 기능을 지원하지 않습니다.');
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

        // TTS는 광고와 독립적으로 실행

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

        // iOS에서는 사용 가능한 영어 음성 우선 사용, 다른 플랫폼에서는 기존 로직 사용
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS) {
          const voices = window.speechSynthesis.getVoices();

          // 1순위: Alex
          const alexVoice = voices.find(v => v.name === 'Alex');
          if (alexVoice) {
            utterance.voice = alexVoice;
            utterance.lang = alexVoice.lang;
          } else {
            // 2순위: Samantha
            const samanthaVoice = voices.find(v => v.name === 'Samantha');
            if (samanthaVoice) {
              utterance.voice = samanthaVoice;
              utterance.lang = samanthaVoice.lang;
            } else {
              // 3순위: 기타 영어 음성
              const englishVoice = voices.find(v => v.lang.startsWith('en-US')) ||
                voices.find(v => v.lang.startsWith('en-GB')) ||
                voices.find(v => v.lang.startsWith('en'));
              if (englishVoice) {
                utterance.voice = englishVoice;
                utterance.lang = englishVoice.lang;
              } else {
                utterance.lang = 'en-US'; // 기본 음성
              }
            }
          }
        } else if (window.speechSynthesis) {
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
        onProgress: (sentenceIndex, totalSentences, sentenceText, _sentenceInfo) => {
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

          // iOS에서는 사용 가능한 영어 음성 우선 사용, 다른 플랫폼에서는 기존 로직 사용
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
          if (isIOS) {
            const voices = window.speechSynthesis.getVoices();

            // 1순위: Alex
            const alexVoice = voices.find(v => v.name === 'Alex');
            if (alexVoice) {
              newUtterance.voice = alexVoice;
              newUtterance.lang = alexVoice.lang;
            } else {
              // 2순위: Samantha
              const samanthaVoice = voices.find(v => v.name === 'Samantha');
              if (samanthaVoice) {
                newUtterance.voice = samanthaVoice;
                newUtterance.lang = samanthaVoice.lang;
              } else {
                // 3순위: 기타 영어 음성
                const englishVoice = voices.find(v => v.lang.startsWith('en-US')) ||
                  voices.find(v => v.lang.startsWith('en-GB')) ||
                  voices.find(v => v.lang.startsWith('en'));
                if (englishVoice) {
                  newUtterance.voice = englishVoice;
                  newUtterance.lang = englishVoice.lang;
                } else {
                  newUtterance.lang = 'en-US'; // 기본 음성
                }
              }
            }
          } else {
            const voices = window.speechSynthesis.getVoices();
            const englishVoice = voices.find(v => v.lang.startsWith('en-US')) ||
              voices.find(v => v.lang.startsWith('en-GB')) ||
              voices.find(v => v.lang.startsWith('en')) ||
              voices[0];
            if (englishVoice) {
              newUtterance.voice = englishVoice;
              newUtterance.lang = englishVoice.lang;
            }
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
        // 기존 UnifiedTTS 배속 변경 (즉시 적용)
        if (unifiedTTSRef.current) {
          unifiedTTSRef.current.setSpeed(newSpeed);
          if (import.meta.env.DEV) {
            console.log('✅ UnifiedTTS 배속 즉시 적용:', newSpeed);
          }
        }
      }
    }

    // 배속 변경 시 토스트 알림
    if (toast) {
      toast.success(`${newSpeed.toFixed(1)}× 속도로 변경되었습니다`, {
        duration: 1500,
        position: 'top'
      });
    }
  };

  const handleLevelChange = useCallback(async (level) => {
    try {
      if (import.meta.env.DEV) {
        console.log('🔄 레벨 변경:', selectedLevel, '→', level);
      }

      // 유효성 검사
      if (level < 1 || level > 3 || level === selectedLevel) {
        return;
      }

      // iOS 감지
      // const { isIOS } = await import('../utils/deviceDetect'); // 이미 상단에서 임포트됨

      // TTS 중지
      try {
        if (isIOS) {
          // iOS에서는 speechSynthesis.cancel() 사용
          if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
          }
          // iOS utterance 참조 정리
          if (iosUtteranceRef.current) {
            iosUtteranceRef.current = null;
          }
        } else {
          // 기존 UnifiedTTS 중지
          if (unifiedTTSRef.current) {
            unifiedTTSRef.current.stop();
          }
        }
      } catch (ttsError) {
        console.warn('TTS 중지 실패:', ttsError);
      }

      // 상태 초기화
      try {
        setIsTTSPlaying(false);
        setIsTTSLoading(false);
        setCurrentSentence(-1);
        setTotalSentences(0);
        setSelectedLevel(level);
      } catch (stateError) {
        console.warn('상태 초기화 실패:', stateError);
      }

      // DOM 하이라이트 정리
      try {
        if (activeSentenceRef.current) {
          activeSentenceRef.current.classList.remove('active-sentence');
          activeSentenceRef.current = null;
        }
      } catch (domError) {
        console.warn('DOM 정리 실패:', domError);
      }

      // 전역 TTS 중지
      try {
        if (window.globalStopTTS) {
          window.globalStopTTS();
        }
      } catch (globalError) {
        console.warn('전역 TTS 중지 실패:', globalError);
      }

      if (import.meta.env.DEV) {
        console.log('✅ 레벨 변경 완료');
      }
    } catch (error) {
      console.error('레벨 변경 중 오류:', error);
      // 최소한 레벨은 변경하도록 시도
      try {
        setSelectedLevel(level);
      } catch (fallbackError) {
        console.error('레벨 변경 폴백 실패:', fallbackError);
      }
    }
  }, [selectedLevel, isIOS]);

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
        onTouchStart: () => { },
        onTouchMove: () => { },
        onTouchEnd: () => { },
        onMouseDown: () => { },
        onMouseMove: () => { },
        onMouseUp: () => { },
        onMouseLeave: () => { }
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

  const handleLike = useCallback(() => {
    try {
      // 기사 데이터 검증 (프리렌더/API 모두 호환)
      if (!articleData) {
        toast?.warning('기사 데이터를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      // 데이터 무결성 확인
      if (!articleData.id) {
        console.error('기사 ID가 없습니다:', articleData);
        toast?.error('기사 정보가 올바르지 않습니다.');
        return;
      }

      // 로그인 상태 확인
      if (!isAuthenticated) {
        toast?.warning('좋아요 기능을 사용하려면 로그인이 필요합니다.');
        return;
      }

      // toggleLike 함수 존재 확인
      if (!toggleLike || typeof toggleLike !== 'function') {
        console.error('toggleLike 함수를 사용할 수 없습니다');
        toast?.error('좋아요 기능을 사용할 수 없습니다.');
        return;
      }

      if (import.meta.env.DEV) {
        console.log('💖 좋아요 토글 시작:', {
          articleId: articleData.id,
          currentStatus: isLiked,
          dataSource: articleData._metadata?.source || 'unknown'
        });
      }

      // 현재 좋아요 상태 저장
      const currentLikeStatus = isLiked;

      // 토글 실행
      const newLikeStatus = toggleLike(articleData, safeIncrementArticleLikes);
      
      // 상태 업데이트
      if (typeof newLikeStatus === 'boolean') {
        setIsLiked(newLikeStatus);
      } else {
        console.warn('toggleLike가 예상치 못한 값을 반환했습니다:', newLikeStatus);
        return;
      }

      // 활동 시간 업데이트
      try {
        if (updateActivityTime && typeof updateActivityTime === 'function') {
          updateActivityTime();
        }
      } catch (activityError) {
        console.warn('활동 시간 업데이트 실패:', activityError);
        // 비치명적 오류이므로 계속 진행
      }

      // 토스트 메시지 표시 - 현재 상태 기반으로 메시지 결정
      try {
        if (newLikeStatus && !currentLikeStatus) {
          // 좋아요 추가된 경우
          toast?.success('기사를 좋아요에 추가했습니다!');
        } else if (!newLikeStatus && currentLikeStatus) {
          // 좋아요 제거된 경우
          toast?.info('기사를 좋아요에서 제거했습니다.');
        }
      } catch (toastError) {
        console.warn('토스트 메시지 표시 실패:', toastError);
      }

      // 좋아요 상태 변경을 다른 컴포넌트에 알림
      try {
        window.dispatchEvent(new CustomEvent('likeUpdated', {
          detail: { articleId: articleData.id, isLiked: newLikeStatus }
        }));
      } catch (eventError) {
        console.warn('좋아요 이벤트 발송 실패:', eventError);
        // 비치명적 오류이므로 계속 진행
      }

      if (import.meta.env.DEV) {
        console.log('💖 좋아요 토글 완료:', {
          articleId: articleData.id,
          newStatus: newLikeStatus,
          success: true
        });
      }

    } catch (error) {
      console.error('좋아요 처리 실패:', error);
      toast?.error('좋아요 처리 중 오류가 발생했습니다.');

      // 오류 발생 시 상태 복원 시도
      try {
        if (isArticleLiked && typeof isArticleLiked === 'function' && articleData?.id) {
          const currentStatus = isArticleLiked(articleData.id);
          setIsLiked(currentStatus);
        }
      } catch (restoreError) {
        console.warn('좋아요 상태 복원 실패:', restoreError);
      }
    }
  }, [articleData, isLiked, isAuthenticated, toggleLike, safeIncrementArticleLikes, updateActivityTime, isArticleLiked, toast]);



  const onWordClick = useCallback(async (event, word, isHighlighted) => {
    // 이벤트 전파 중지 및 기본 동작 방지
    event.stopPropagation();
    event.preventDefault();

    // 기사 데이터 검증 (프리렌더/API 모두 호환)
    if (!articleData) {
      toast?.warning('기사 데이터를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    if (import.meta.env.DEV) {
      console.log('📚 단어 클릭:', {
        word: word,
        isHighlighted: isHighlighted,
        articleId: articleData.id,
        dataSource: articleData._metadata?.source || 'unknown'
      });
    }

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

          // 자동 저장 (안전한 처리)
          if (userSettings?.autoSaveWords !== false) {
            try {
              await autoSaveWord(cleanWord, wordData);
            } catch (saveError) {
              console.warn('단어 자동 저장 실패:', saveError);
              // 비치명적 오류이므로 계속 진행
            }
          }

          // 자동 재생 (안전한 처리)
          if (userSettings?.autoPlay && wordData.audio) {
            try {
              const audio = new Audio(wordData.audio);
              await audio.play();
            } catch (audioError) {
              if (import.meta.env.DEV) {
                console.warn("Audio play failed:", audioError);
              }
              // 오디오 재생 실패는 비치명적이므로 계속 진행
            }
          }
        }
      } catch (error) {
        console.warn('단어 정보 가져오기 실패:', error);
        setWordPopup(prev => ({
          ...prev,
          isLoading: false,
          error: '단어 정보를 가져오는데 실패했습니다.'
        }));
      }
    } else {
      // 너무 짧은 단어
      toast?.info('3글자 이상의 단어를 선택해주세요.');
    }
  }, [selectedLanguage, userSettings, articleData]);

  const _handleWordClick = useCallback(async (event, word) => {
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
                    console.warn('Operation failed:', error);
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
  }, [selectedLanguage, toast, articleData?.id]);

  // 향상된 자동 단어 저장 함수 (직접 URL 접근 호환)
  const autoSaveWord = async (cleanWord, wordData) => {
    // 안전한 로그인 상태 확인
    if (!user?.uid && !isAuthenticated && !window.enableGuestMode) {
      if (import.meta.env.DEV) {
        console.log('🔒 자동 저장 건너뜀: 로그인 필요');
      }
      return; // 자동 저장은 조용히 실패
    }

    // 기사 데이터 유효성 검사 (프리렌더/API 모두 호환)
    if (!articleData?.id) {
      if (import.meta.env.DEV) {
        console.log('⚠️ 자동 저장 실패: 기사 데이터 없음');
      }
      return;
    }

    // 단어 데이터 유효성 검사
    if (!cleanWord || !wordData) {
      if (import.meta.env.DEV) {
        console.log('⚠️ 자동 저장 실패: 단어 데이터 없음');
      }
      return;
    }

    if (import.meta.env.DEV) {
      console.log('📚 자동 단어 저장 시도:', {
        word: cleanWord,
        articleId: articleData.id,
        dataSource: articleData._metadata?.source || 'unknown'
      });
    }

    // 이미 저장된 단어인지 확인
    if (isWordSaved && isWordSaved(cleanWord, articleData.id)) {
      if (import.meta.env.DEV) {
        console.log('📝 자동 저장 건너뜀: 이미 저장된 단어', cleanWord);
      }
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

      // DOM 직접 조작 제거: React 상태만으로 하이라이트 처리
      // WordSpan 컴포넌트에서 isHighlighted prop을 통해 자동으로 처리됨

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

      // DOM 직접 조작 제거: React 상태만으로 하이라이트 처리
      // WordSpan 컴포넌트에서 isHighlighted prop을 통해 자동으로 처리됨

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

    // React 상태만 업데이트 (DOM 직접 조작 제거)
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
  }, [highlightedWords, savedWords, articleData?.id]); // 함수 의존성 제거

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
      {/* SEO 메타데이터 */}
      <SimpleSEO
        article={articleData}
        publishedTime={articleData?.publishedAt}
        type="article"
      />

      {/* 소셜 공유 메타데이터 */}
      <SocialShareMeta article={articleData} />

      {/* 통합 네비게이션 */}
      <MobileNavigation
        showBackButton={true}
        searchCompact={false}
      />

      <MobileContentWrapper>

        {/* 기사 상세 내용 */}
        <PageContainer style={{
          opacity: isLoading ? 0.95 : 1,
          transition: 'opacity 0.5s ease-in-out'
        }}>
          <PremiumContentGuard>
            {/* 기사 상단 - 광고는 하단에만 표시 */}

            {/* 썸네일 이미지 */}
            {articleData && articleData.image && (
              <ThumbnailImage
                src={articleData.image}
                alt={articleData.title || 'Article Image'}
                onError={(e) => {
                  console.error('이미지 로딩 실패:', e.target.src);
                  e.target.style.display = 'none';
                }}
                onLoad={() => {
                  console.log('✅ 이미지 로딩 성공:', articleData.image);
                }}
              />
            )}

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
                <SocialShareButton
                  article={articleData}
                  size="medium"
                  color="default"
                />
              </ActionButtons>
            </ControlsSection>



            {/* 콘텐츠 중간 광고 제거됨 */}

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
                        Level <LevelNumber>{level}</LevelNumber> - {level === 1 ? 'Beginner' : level === 2 ? 'Intermediate' : 'Advanced'}
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

            {/* 기사 하단 배너 광고 (네비게이션 바 위) */}
            {articleData && (
              <ArticleBottomBanner articleId={articleData.id} />
            )}
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
  
  @media (max-width: 768px) {
    height: 250px;
  }
  
  @media (max-width: 480px) {
    height: 200px;
    margin-bottom: 0.75rem;
  }
`;

const MetaInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  
  @media (max-width: 768px) {
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
`;

const DateText = styled.span`
  color: #666;
  font-size: 0.9rem;
`;

const Title = styled.h1`
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  line-height: 1.3;
  
  @media (max-width: 768px) {
    font-size: 1.6rem;
    margin-bottom: 1rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1.5rem;
    margin-bottom: 0.75rem;
  }
`;

const ControlsSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${props => props.theme.palette.background.paper};
  border-radius: 16px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  border: 1px solid #f0f0f0;
  overflow: hidden;
  min-width: 0;
  
  @media (max-width: 480px) {
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.75rem;
    justify-content: center;
  }
  
  @media (max-width: 360px) {
    gap: 0.25rem;
    padding: 0.5rem;
  }
`;

const PlaybackControls = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
  
  @media (max-width: 480px) {
    gap: 0.5rem;
  }
  
  @media (max-width: 360px) {
    gap: 0.25rem;
  }
`;

const PlayButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  
  @media (max-width: 480px) {
    width: 48px;
    height: 48px;
  }
  
  @media (max-width: 360px) {
    width: 42px;
    height: 42px;
  }
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
  flex-shrink: 0;
  
  @media (max-width: 480px) {
    gap: 0.25rem;
    padding: 0.375rem;
  }
  
  @media (max-width: 360px) {
    gap: 0.125rem;
    padding: 0.25rem;
  }
`;

const SpeedButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  
  @media (max-width: 480px) {
    width: 28px;
    height: 28px;
    font-size: 0.875rem;
  }
  
  @media (max-width: 360px) {
    width: 24px;
    height: 24px;
    font-size: 0.75rem;
  }
  background: ${props => props.disabled
    ? props.theme.palette.action.disabled
    : props.theme.palette.background.paper};
  color: ${props => props.disabled
    ? props.theme.palette.text.disabled
    : props.theme.palette.primary.main};
  border: 1px solid ${props => props.disabled
    ? props.theme.palette.divider
    : props.theme.palette.primary.light};
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
  
  @media (max-width: 480px) {
    font-size: 0.75rem;
    min-width: 32px;
    padding: 0.125rem 0.25rem;
  }
  
  @media (max-width: 360px) {
    font-size: 0.625rem;
    min-width: 28px;
    padding: 0.125rem 0.25rem;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
  
  @media (max-width: 480px) {
    gap: 0.5rem;
  }
  
  @media (max-width: 360px) {
    gap: 0.25rem;
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  
  @media (max-width: 480px) {
    width: 42px;
    height: 42px;
  }
  
  @media (max-width: 360px) {
    width: 36px;
    height: 36px;
  }
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

const _LevelTabs = styled.div`
  display: flex;
  gap: 0.1rem;
`;

const _LevelTab = styled.button`
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

const _ContentCard = styled.div`
  background: ${props => props.theme.palette.background.paper};
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
    background-color: ${props.theme.palette.mode === 'dark'
      ? 'rgba(255, 193, 7, 0.3)'
      : '#fff9c4'};
    &:hover {
      background-color: ${props.theme.palette.mode === 'dark'
      ? 'rgba(255, 193, 7, 0.4)'
      : '#fff59d'};
    }
    &:active {
      background-color: ${props.theme.palette.mode === 'dark'
      ? 'rgba(255, 193, 7, 0.5)'
      : '#fff176'};
    }
  ` : `
    &:hover {
      background-color: ${props.theme.palette.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.1)'
    : '#f0f0f0'};
    }
    &:active {
      background-color: ${props.theme.palette.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.2)'
    : '#e0e0e0'};
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
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e3f2fd;
  
  @media (max-width: 768px) {
    margin-bottom: 0.75rem;
  }
`;

const LevelChangeButton = styled.button`
  background: transparent;
  border: none;
  color: #dc3545;
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
    color: #c82333;
    background: rgba(220, 53, 69, 0.08);
    transform: scale(1.1);
  }
  
  &:focus {
    outline: 2px solid #dc3545;
    outline-offset: 2px;
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const ContentTitle = styled.h3`
  font-size: 1.3rem;
  font-weight: bold;
  color: ${props => props.theme.palette.primary.main};
  text-align: center;
  margin: 0;
  flex-grow: 1;
`;

const LevelNumber = styled.span`
  color: #dc3545;
`;

const ContentText = styled.div`
  font-size: 1.1rem;
  line-height: 1.5;
  color: ${props => props.theme.palette.text.primary};
  cursor: text;
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  max-height: calc(100% - 100px); /* 제목 영역 제외 */
  
  p {
    margin-bottom: 0.875rem;
    margin-top: 0;
  }
  
  @media (max-width: 768px) {
    font-size: 1rem;
    line-height: 1.55;
    
    p {
      margin-bottom: 1rem;
    }
  }
  
  @media (max-width: 480px) {
    font-size: 0.95rem;
    line-height: 1.6;
    
    p {
      margin-bottom: 0.875rem;
    }
  }
  
  /* 스크롤바 스타일 개선 */
  scrollbar-width: thin;
  scrollbar-color: ${props => props.theme.palette.primary.main} ${props => props.theme.palette.background.default};
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => props.theme.palette.background.default};
    border-radius: 4px;
    margin: 4px 0;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.palette.primary.main};
    border-radius: 4px;
    border: 1px solid ${props => props.theme.palette.background.default};
    
    &:hover {
      background: ${props => props.theme.palette.primary.dark};
    }
  }
  
  /* 스크롤 시 페이드 효과 */
  &:before {
    content: '';
    position: sticky;
    top: 0;
    height: 10px;
    background: linear-gradient(to bottom, ${props => props.theme.palette.background.paper}, transparent);
    z-index: 1;
    display: block;
    margin-bottom: -10px;
  }
  
  &:after {
    content: '';
    position: sticky;
    bottom: 0;
    height: 10px;
    background: linear-gradient(to top, ${props => props.theme.palette.background.paper}, transparent);
    z-index: 1;
    display: block;
    margin-top: -10px;
  }
  
  .highlighted-word {
    background-color: ${props => props.theme.palette.mode === 'dark'
    ? 'rgba(255, 193, 7, 0.3)'
    : '#fff9c4'} !important;
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
  
  /* Mobile styles - 내부 스크롤 해제 */
  @media (max-width: 768px) {
    overflow-y: visible;   /* 내부 스크롤 해제 */
    max-height: none;
    
    /* 모바일에서는 페이드 효과 제거 */
    &:before,
    &:after {
      display: none;
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

const _DefinitionHeader = styled.div`
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
    height: auto;          /* 내용 길이만큼 늘어남 → 외부 하나의 스크롤만 남음 */
    align-items: stretch;  /* 카드가 전체 폭·높이를 자연스럽게 차지 */
    overflow: visible;
    touch-action: ${props => props.$isTablet ? 'pan-y' : 'manipulation'}; /* 태블릿: 수직만, 폰: JavaScript 제어 */
  }
`;

const SwipeCard = styled.div`
  position: absolute;
  top: 0;
  background: ${props => props.theme.palette.background.paper};
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
    position: static; /* absolute → static으로 변경하여 문서 흐름에 포함 */
    width: 100%;
    padding: 1rem;
    box-sizing: border-box; /* 패딩을 너비 안에 포함 */
    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    cursor: default;
    display: ${props => props.$isActive ? 'flex' : 'none'}; /* 비활성 카드 완전히 숨김 */
    opacity: 1;
    transform: none; /* transform 제거로 자연스러운 배치 */
    transition: opacity 0.3s ease-in-out;
    z-index: ${props => props.$isActive ? 10 : 5};
    left: 0;
    filter: none;
    top: auto; /* absolute 해제 후 불필요한 속성 제거 */

    &:hover {
      opacity: 1;
      transform: none;
    }
  }

  @media (max-width: 480px) {
    padding: 0.75rem;
    box-sizing: border-box; /* 패딩을 너비 안에 포함 */
  }
`;



export default React.memo(ArticleDetail);
