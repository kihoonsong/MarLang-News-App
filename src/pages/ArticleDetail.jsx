import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { 
  Box, CircularProgress, Typography, useMediaQuery, useTheme, 
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useArticles } from '../contexts/ArticlesContext';
import { useAuth } from '../contexts/AuthContext';
import { getSupportedLanguages } from '../utils/dictionaryApi';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import PageContainer from '../components/PageContainer';
import { useEnhancedToast } from '../components/EnhancedToastProvider';
import PremiumContentGuard from '../components/PremiumContentGuard';
import { ArticleDetailAdComponent, InlineAdComponent } from '../components/AdComponents';

// 분리된 컴포넌트들 import
import {
  TTSControls,
  WordDefinitionPopover,
  LevelTabs,
  ArticleHeader,
  ArticleContent,
  ArticleActions,
  generateLevelsFromContent,
  initialTTSState,
  createWordbookEntry
} from '../components/ArticleDetail';

const ArticleContainer = styled(Box)`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const LoadingContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 16px;
`;

const ControlsContainer = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const LanguageSelector = styled(FormControl)`
  min-width: 150px;
  
  @media (max-width: 768px) {
    min-width: 100%;
  }
`;

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Contexts
  const { user, isAuthenticated } = useAuth() || {};
  const { allArticles, loading: articlesLoading } = useArticles();
  const { 
    savedWords, 
    addWord, 
    likedArticles, 
    toggleLike,
    addViewRecord,
    updateActivityTime,
    userSettings
  } = useData();
  const toast = useEnhancedToast();
  
  // Local state
  const [articleData, setArticleData] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [highlightedWords, setHighlightedWords] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(userSettings?.translationLanguage || 'en');
  const [supportedLanguages, setSupportedLanguages] = useState([]);
  const [levels, setLevels] = useState({});
  
  // TTS state
  const [ttsState, setTtsState] = useState(initialTTSState);
  const [ttsSpeed, setTtsSpeed] = useState(userSettings?.ttsSpeed || 0.8);
  
  // Word definition popover state
  const [popoverState, setPopoverState] = useState({
    anchorEl: null,
    selectedWord: null
  });

  // Initialize article data
  useEffect(() => {
    if (!articlesLoading && allArticles.length > 0) {
      const article = allArticles.find(a => a.id === id);
      if (article) {
        setArticleData(article);
        const generatedLevels = generateLevelsFromContent(article);
        setLevels(generatedLevels);
        
        // Record view
        addViewRecord(article.id, article.category);
        updateActivityTime();
      } else {
        console.error('기사를 찾을 수 없습니다:', id);
      }
    }
  }, [id, allArticles, articlesLoading, addViewRecord, updateActivityTime]);

  // Load highlighted words from saved words
  useEffect(() => {
    if (savedWords.length > 0) {
      setHighlightedWords(savedWords);
    }
  }, [savedWords]);

  // Load supported languages
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const languages = await getSupportedLanguages();
        setSupportedLanguages(languages);
      } catch (error) {
        console.error('언어 목록 로드 실패:', error);
      }
    };
    loadLanguages();
  }, []);

  // TTS state management
  const handleTTSStateChange = useCallback((newState) => {
    setTtsState(prev => ({ ...prev, ...newState }));
  }, []);

  const handleSpeedChange = useCallback((newSpeed) => {
    setTtsSpeed(newSpeed);
  }, []);

  // Level change handler
  const handleLevelChange = useCallback((newLevel) => {
    if (ttsState.isPlaying) {
      console.log('🔄 레벨 변경:', selectedLevel, '→', newLevel);
      setTtsState(initialTTSState); // Reset TTS state
    }
    setSelectedLevel(newLevel);
  }, [selectedLevel, ttsState.isPlaying]);

  // Word click handler
  const handleWordClick = useCallback((event, word) => {
    const cleanedWord = word.replace(/[^\w']/g, '');
    if (cleanedWord.length < 2) return;

    setPopoverState({
      anchorEl: event.currentTarget,
      selectedWord: cleanedWord
    });
  }, []);

  const handlePopoverClose = useCallback(() => {
    setPopoverState({
      anchorEl: null,
      selectedWord: null
    });
  }, []);

  // Add word to wordbook
  const handleAddToWordbook = useCallback((wordData) => {
    try {
      const wordbookEntry = createWordbookEntry(wordData.word, wordData, selectedLanguage);
      addWord(wordbookEntry);
      toast.showSuccess(`"${wordData.word}" added to wordbook!`);
    } catch (error) {
      console.error('단어장 추가 실패:', error);
      toast.showError('Failed to add word to wordbook');
    }
  }, [addWord, selectedLanguage, toast]);

  // Like toggle
  const handleLikeToggle = useCallback((articleId, liked) => {
    toggleLike(articleId);
  }, [toggleLike]);

  // Navigation
  const handleNavigatePrev = useCallback(() => {
    const currentIndex = allArticles.findIndex(a => a.id === id);
    if (currentIndex > 0) {
      navigate(`/article/${allArticles[currentIndex - 1].id}`);
    }
  }, [allArticles, id, navigate]);

  const handleNavigateNext = useCallback(() => {
    const currentIndex = allArticles.findIndex(a => a.id === id);
    if (currentIndex < allArticles.length - 1) {
      navigate(`/article/${allArticles[currentIndex + 1].id}`);
    }
  }, [allArticles, id, navigate]);

  // Get current content for TTS
  const getCurrentContent = () => {
    if (!levels[selectedLevel]?.content) return '';
    return levels[selectedLevel].content;
  };

  // Check navigation availability
  const currentIndex = allArticles.findIndex(a => a.id === id);
  const hasPrevArticle = currentIndex > 0;
  const hasNextArticle = currentIndex < allArticles.length - 1;
  const isLiked = likedArticles.some(likedId => likedId === id);

  // Loading state
  if (articlesLoading || !articleData) {
    return (
      <PageContainer>
        <LoadingContainer>
          <CircularProgress size={40} />
          <Typography variant="body1" color="text.secondary">
            Loading article...
          </Typography>
        </LoadingContainer>
      </PageContainer>
    );
  }

  // Mobile layout
  if (isMobile) {
    return (
      <MobileNavigation>
        <MobileContentWrapper>
          <ArticleContainer>
            <ControlsContainer>
              <LanguageSelector size="small">
                <InputLabel>Translation Language</InputLabel>
                <Select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  label="Translation Language"
                >
                  {supportedLanguages.map((lang) => (
                    <MenuItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </MenuItem>
                  ))}
                </Select>
              </LanguageSelector>
            </ControlsContainer>

            <ArticleHeader article={articleData} currentLevel={selectedLevel} />
            
            <ArticleDetailAdComponent />

            <LevelTabs
              selectedLevel={selectedLevel}
              levels={levels}
              onLevelChange={handleLevelChange}
              isTTSPlaying={ttsState.isPlaying}
            />

            <TTSControls
              isTTSPlaying={ttsState.isPlaying}
              isTTSLoading={ttsState.isLoading}
              ttsSpeed={ttsSpeed}
              currentSentence={ttsState.currentSentence}
              totalSentences={ttsState.totalSentences}
              currentContent={getCurrentContent()}
              onTTSStateChange={handleTTSStateChange}
              onSpeedChange={handleSpeedChange}
            />

            <ArticleContent
              levels={levels}
              selectedLevel={selectedLevel}
              highlightedWords={highlightedWords}
              currentSentence={ttsState.currentSentence}
              isTTSPlaying={ttsState.isPlaying}
              onWordClick={handleWordClick}
            />

            <InlineAdComponent />

            <ArticleActions
              article={articleData}
              isLiked={isLiked}
              likeCount={0}
              onLikeToggle={handleLikeToggle}
              onNavigatePrev={handleNavigatePrev}
              onNavigateNext={handleNavigateNext}
              hasNextArticle={hasNextArticle}
              hasPrevArticle={hasPrevArticle}
            />

            <WordDefinitionPopover
              anchorEl={popoverState.anchorEl}
              selectedWord={popoverState.selectedWord}
              selectedLanguage={selectedLanguage}
              onClose={handlePopoverClose}
              onAddToWordbook={handleAddToWordbook}
            />
          </ArticleContainer>
        </MobileContentWrapper>
      </MobileNavigation>
    );
  }

  // Desktop layout
  return (
    <PageContainer>
      <PremiumContentGuard>
        <ArticleContainer>
          <ControlsContainer>
            <LanguageSelector size="small">
              <InputLabel>Translation Language</InputLabel>
              <Select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                label="Translation Language"
              >
                {supportedLanguages.map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </MenuItem>
                ))}
              </Select>
            </LanguageSelector>
          </ControlsContainer>

          <ArticleHeader article={articleData} currentLevel={selectedLevel} />
          
          <ArticleDetailAdComponent />

          <LevelTabs
            selectedLevel={selectedLevel}
            levels={levels}
            onLevelChange={handleLevelChange}
            isTTSPlaying={ttsState.isPlaying}
          />

          <TTSControls
            isTTSPlaying={ttsState.isPlaying}
            isTTSLoading={ttsState.isLoading}
            ttsSpeed={ttsSpeed}
            currentSentence={ttsState.currentSentence}
            totalSentences={ttsState.totalSentences}
            currentContent={getCurrentContent()}
            onTTSStateChange={handleTTSStateChange}
            onSpeedChange={handleSpeedChange}
          />

          <ArticleContent
            levels={levels}
            selectedLevel={selectedLevel}
            highlightedWords={highlightedWords}
            currentSentence={ttsState.currentSentence}
            isTTSPlaying={ttsState.isPlaying}
            onWordClick={handleWordClick}
          />

          <InlineAdComponent />

          <ArticleActions
            article={articleData}
            isLiked={isLiked}
            likeCount={0}
            onLikeToggle={handleLikeToggle}
            onNavigatePrev={handleNavigatePrev}
            onNavigateNext={handleNavigateNext}
            hasNextArticle={hasNextArticle}
            hasPrevArticle={hasPrevArticle}
          />

          <WordDefinitionPopover
            anchorEl={popoverState.anchorEl}
            selectedWord={popoverState.selectedWord}
            selectedLanguage={selectedLanguage}
            onClose={handlePopoverClose}
            onAddToWordbook={handleAddToWordbook}
          />
        </ArticleContainer>
      </PremiumContentGuard>
    </PageContainer>
  );
};

export default ArticleDetail;