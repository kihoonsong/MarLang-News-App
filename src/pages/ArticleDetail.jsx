import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  AppBar, Toolbar, Typography, IconButton, InputBase, Tabs, Tab, Box, Button, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert,
  Select, MenuItem, FormControl, InputLabel, CircularProgress, Popover, Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TranslateIcon from '@mui/icons-material/Translate';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import CloseIcon from '@mui/icons-material/Close';
import SpeedIcon from '@mui/icons-material/Speed';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useArticles } from '../contexts/ArticlesContext';
import { fetchWordDefinitionAndTranslation, getSupportedLanguages } from '../utils/dictionaryApi';

const navigationTabs = ['Home', 'Date', 'Wordbook', 'Like', 'Profile'];

// 기사 내용에서 3개 레벨 생성
const generateLevelsFromContent = (article) => {
  const baseContent = article.summary || article.title;
  
  return {
    1: {
      title: 'Level 1 - Beginner',
      content: `${article.title}

${baseContent}

This article discusses important developments in ${article.category.toLowerCase()}. The information presented here helps us understand current trends and future possibilities in this field.

Key points include new research findings, practical applications, and potential impact on society. This topic is relevant for anyone interested in ${article.category.toLowerCase()} and its effects on our daily lives.`
    },
    2: {
      title: 'Level 2 - Intermediate',
      content: `${article.title}

${baseContent}

This comprehensive analysis explores the significant developments and implications within the ${article.category.toLowerCase()} sector. Recent advances have demonstrated substantial progress in addressing key challenges and opportunities.

The research methodology employed in this study incorporates both quantitative and qualitative approaches, providing a balanced perspective on current market conditions and future projections. Industry experts suggest that these findings will influence policy decisions and strategic planning across multiple sectors.

Furthermore, the interdisciplinary nature of this research highlights the importance of collaboration between various stakeholders, including academic institutions, government agencies, and private sector organizations.`
    },
    3: {
      title: 'Level 3 - Advanced',
      content: `${article.title}

${baseContent}

This sophisticated examination presents a comprehensive analysis of the multifaceted dynamics influencing contemporary ${article.category.toLowerCase()} paradigms. The research synthesizes empirical data from longitudinal studies, cross-sectional analyses, and meta-analytical frameworks to establish robust theoretical foundations.

The methodological approach incorporates advanced statistical modeling techniques, including multivariate regression analysis, structural equation modeling, and machine learning algorithms to identify significant correlations and predictive patterns within the dataset.

The implications of these findings extend beyond immediate practical applications, contributing to the theoretical discourse surrounding epistemological frameworks and ontological considerations within the broader academic community. The research establishes new benchmarks for future investigations and provides a foundation for interdisciplinary collaboration.

Moreover, the study's innovative approach to data interpretation challenges conventional assumptions and introduces novel perspectives that may revolutionize current understanding of ${article.category.toLowerCase()} phenomena and their societal implications.`
    }
  };
};


const ArticleDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addWord, toggleLike, isArticleLiked, userSettings, updateSettings } = useData();
  const { allArticles, loading: articlesLoading } = useArticles();
  
  // 실제 기사 데이터 찾기
  const [articleData, setArticleData] = useState(null);
  const [navTab, setNavTab] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [currentSentence, setCurrentSentence] = useState(-1);
  const [savedWords, setSavedWords] = useState(new Set());
  const [highlightedWords, setHighlightedWords] = useState(new Set());
  
  // 단어 팝업 상태
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
  
  // 언어 설정 다이얼로그
  const [languageDialog, setLanguageDialog] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(userSettings.translationLanguage || 'ko');
  
  // 알림 상태
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // 음성 합성 설정
  const [speechSynthesis, setSpeechSynthesis] = useState(null);
  const [currentUtterance, setCurrentUtterance] = useState(null);
  const [ttsSpeed, setTtsSpeed] = useState(0.8);
  const [isRestarting, setIsRestarting] = useState(false);

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
            year: '2-digit' 
          }),
          image: foundArticle.image,
          liked: false,
          levels: generateLevelsFromContent(foundArticle)
        };
        setArticleData(transformedArticle);
      }
    }
  }, [articlesLoading, allArticles, id]);

  // 컴포넌트 마운트 시 좋아요 상태 확인
  useEffect(() => {
    if (isArticleLiked && articleData) {
      setIsLiked(isArticleLiked(articleData.id));
    }
  }, [isArticleLiked, articleData]);

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
  }, [articleData]);

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
    if ('speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
    }
  }, []);

  const startTTS = () => {
    const text = articleData.levels[selectedLevel].content;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    const speakSentence = (index) => {
      if (index >= sentences.length) {
        setIsTTSPlaying(false);
        setCurrentSentence(-1);
        setCurrentUtterance(null);
        return;
      }
      
      setCurrentSentence(index);
      const utterance = new SpeechSynthesisUtterance(sentences[index].trim());
      
      // 현재 속도 적용
      utterance.rate = ttsSpeed;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      // 영어 음성 찾기
      const voices = speechSynthesis.getVoices();
      const englishVoice = voices.find(voice => 
        voice.lang.includes('en-US') || voice.lang.includes('en-GB')
      );
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      
      utterance.onend = () => {
        speakSentence(index + 1);
      };
      
      utterance.onerror = (event) => {
        // Don't reset state if we're restarting (speed change)
        if (!isRestarting) {
          setIsTTSPlaying(false);
          setCurrentSentence(-1);
          setCurrentUtterance(null);
        }
      };
      
      setCurrentUtterance(utterance);
      speechSynthesis.speak(utterance);
    };
    
    setIsTTSPlaying(true);
    speakSentence(0);
  };

  const handleTTS = () => {
    if (isTTSPlaying) {
      // TTS 일시정지
      if (speechSynthesis && currentUtterance) {
        setIsRestarting(false); // 일시정지는 재시작 아님
        speechSynthesis.cancel();
        setIsTTSPlaying(false);
        setCurrentSentence(-1);
        setCurrentUtterance(null);
      }
    } else {
      // TTS 재생
      setIsRestarting(false); // 새로 시작할 때는 재시작 플래그 초기화
      startTTS();
    }
  };

  // 속도 변경시 재생 중이면 재시작
  const handleSpeedChange = (newSpeed) => {
    setTtsSpeed(newSpeed);
    
    if (isTTSPlaying && speechSynthesis) {
      // 현재 재생 중인 문장 인덱스 저장
      const currentIndex = currentSentence;
      
      // 재시작 플래그 설정
      setIsRestarting(true);
      
      // 현재 재생 중지
      if (currentUtterance) {
        speechSynthesis.cancel();
      }
      
      // 새로운 속도로 현재 문장부터 재시작
      setTimeout(() => {
        if (currentIndex >= 0 && isTTSPlaying) {
          const text = articleData.levels[selectedLevel].content;
          const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
          
          const speakFromIndex = (index) => {
            if (index >= sentences.length || !isTTSPlaying) {
              setIsTTSPlaying(false);
              setCurrentSentence(-1);
              setCurrentUtterance(null);
              setIsRestarting(false);
              return;
            }
            
            setCurrentSentence(index);
            const utterance = new SpeechSynthesisUtterance(sentences[index].trim());
            
            utterance.rate = newSpeed;
            utterance.pitch = 1;
            utterance.volume = 1;
            
            const voices = speechSynthesis.getVoices();
            const englishVoice = voices.find(voice => 
              voice.lang.includes('en-US') || voice.lang.includes('en-GB')
            );
            if (englishVoice) {
              utterance.voice = englishVoice;
            }
            
            utterance.onstart = () => {
              setIsRestarting(false); // 재시작 완료
            };
            
            utterance.onend = () => {
              if (isTTSPlaying) {
                speakFromIndex(index + 1);
              }
            };
            
            utterance.onerror = (event) => {
              console.log('TTS error during speed change:', event);
              setIsRestarting(false);
            };
            
            setCurrentUtterance(utterance);
            speechSynthesis.speak(utterance);
          };
          
          speakFromIndex(currentIndex);
        } else {
          setIsRestarting(false);
        }
      }, 200);
    }
  };

  const handleLevelChange = (level) => {
    // TTS 중지
    if (isTTSPlaying) {
      setIsRestarting(false); // 레벨 변경시에는 재시작 아님
      speechSynthesis.cancel();
      setIsTTSPlaying(false);
      setCurrentSentence(-1);
      setCurrentUtterance(null);
    }
    setSelectedLevel(level);
  };

  const handleLike = () => {
    const newLikeStatus = toggleLike(articleData);
    setIsLiked(newLikeStatus);
    setSnackbar({
      open: true,
      message: newLikeStatus ? 'Article added to favorites!' : 'Article removed from favorites!',
      severity: 'success'
    });
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
    // 깔끔한 정의만 저장 (불필요한 라벨 제거)
    const finalDefinition = selectedLanguage === 'en' 
      ? wordPopup.englishDefinition
      : wordPopup.translatedDefinition;
    
    const success = addWord(
      wordPopup.word,
      finalDefinition,
      articleData.id,
      articleData.title
    );
    
    if (success) {
      // 단어 하이라이트 추가
      setSavedWords(prev => new Set([...prev, wordPopup.word]));
      
      // 하이라이트된 단어 목록에 추가하고 로컬스토리지에 저장
      const newHighlights = new Set([...highlightedWords, wordPopup.word]);
      setHighlightedWords(newHighlights);
      saveHighlights(newHighlights);
      
      // 해당 단어에 하이라이트 클래스 추가
      if (wordPopup.selectedWord) {
        wordPopup.selectedWord.classList.add('highlighted-word');
      }
      
      setSnackbar({
        open: true,
        message: `"${wordPopup.word}" saved to wordbook!`,
        severity: 'success'
      });
    } else {
      setSnackbar({
        open: true,
        message: `"${wordPopup.word}" is already in your wordbook!`,
        severity: 'warning'
      });
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
    
    // DOM에서 하이라이트 클래스 제거
    event.target.classList.remove('highlighted-word');
    
    setSnackbar({
      open: true,
      message: `"${cleanWord}" removed from highlights`,
      severity: 'info'
    });
  };

  // 언어 설정 저장
  const handleLanguageChange = () => {
    updateSettings({ translationLanguage: selectedLanguage });
    setLanguageDialog(false);
    setSnackbar({
      open: true,
      message: 'Language preference updated!',
      severity: 'success'
    });
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
      {/* 상단바 */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton color="inherit" onClick={() => navigate('/')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold', color: '#23408e' }}>
            MarLang Eng News
          </Typography>
          <InputBase
            placeholder="Search articles..."
            startAdornment={<SearchIcon sx={{ mr: 1 }} />}
            sx={{ background: '#f5f5f5', borderRadius: 2, px: 2, mr: 2 }}
          />
          <IconButton 
            color="inherit" 
            onClick={() => setLanguageDialog(true)}
            sx={{ mr: 1 }}
            title="Language Settings"
          >
            <TranslateIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      
      {/* 네비게이션 바 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
        <Tabs value={navTab} onChange={(_, v) => setNavTab(v)}>
          {navigationTabs.map((nav, idx) => (
            <Tab 
              key={nav} 
              label={nav} 
              onClick={() => {
                setNavTab(idx);
                switch(nav) {
                  case 'Home':
                    navigate('/');
                    break;
                  case 'Date':
                    navigate('/date');
                    break;
                  case 'Wordbook':
                    navigate('/wordbook');
                    break;
                  case 'Like':
                    navigate('/like');
                    break;
                  case 'Profile':
                    navigate('/profile');
                    break;
                  default:
                    break;
                }
              }}
            />
          ))}
        </Tabs>
      </Box>

      {/* 기사 상세 내용 */}
      <Container>
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
                <SpeedIcon sx={{ transform: 'scaleX(-1)' }} />
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
          
          <LevelTabs>
            {[1, 2, 3].map(level => (
              <LevelTab 
                key={level}
                $active={selectedLevel === level}
                onClick={() => handleLevelChange(level)}
              >
                {level}
              </LevelTab>
            ))}
          </LevelTabs>
        </ControlsRow>

        {/* 카드형 본문 */}
        <ContentCard>
          <ContentTitle>{articleData.levels[selectedLevel].title}</ContentTitle>
          <ContentText>
            {(() => {
              const content = articleData.levels[selectedLevel].content;
              const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
              
              return sentences.map((sentence, sentenceIdx) => {
                const isCurrentSentence = currentSentence === sentenceIdx && isTTSPlaying;
                
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
        </ContentCard>
      </Container>

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
              {wordPopup.phonetic && (
                <Phonetic>{wordPopup.phonetic}</Phonetic>
              )}
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
                onChange={(e) => setSelectedLanguage(e.target.value)}
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

      {/* 언어 설정 다이얼로그 */}
      <Dialog
        open={languageDialog}
        onClose={() => setLanguageDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            Word Lookup Language
          </Typography>
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Select Language</InputLabel>
            <Select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              label="Select Language"
            >
              <MenuItem value="en">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>🇺🇸</span>
                  <Box>
                    <Typography variant="body2">English</Typography>
                    <Typography variant="caption" color="text.secondary">Dictionary definitions</Typography>
                  </Box>
                </Box>
              </MenuItem>
              {getSupportedLanguages().map((lang) => (
                <MenuItem key={lang.code} value={lang.code}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{lang.flag}</span>
                    <Box>
                      <Typography variant="body2">{lang.name}</Typography>
                      <Typography variant="caption" color="text.secondary">Word translations</Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="body2" sx={{ mt: 2, color: '#666' }}>
            English provides detailed dictionary definitions. Other languages show word translations in your preferred language.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLanguageDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleLanguageChange} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* 알림 스낵바 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
`;

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

const LevelTabs = styled.div`
  display: flex;
  gap: 0.8rem;
`;

const LevelTab = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid ${props => props.$active ? '#1976d2' : '#ddd'};
  background: ${props => props.$active ? '#1976d2' : 'white'};
  color: ${props => props.$active ? 'white' : '#666'};
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
  
  &:hover {
    border-color: #1976d2;
  }
`;

const ContentCard = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  padding: 2rem;
`;

const ContentTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #1976d2;
`;

const ContentText = styled.div`
  font-size: 1.1rem;
  line-height: 1.8;
  cursor: text;
  
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

const Phonetic = styled.div`
  font-size: 0.85rem;
  color: #666;
  font-style: italic;
  font-weight: normal;
  margin-top: 2px;
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

export default ArticleDetail;