import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Select, MenuItem, FormControl, InputLabel, useMediaQuery, useTheme, CircularProgress,
  Button
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import ArticleIcon from '@mui/icons-material/Article';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import AuthGuard from '../components/AuthGuard';
import MainNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import PageContainer from '../components/PageContainer';
import { speakWord, isSpeechSynthesisSupported, getCurrentPlayingStatus, stopCurrentSpeech } from '../utils/speechUtils';
import { designTokens, getColor, getBorderRadius } from '../utils/designTokens';

const Wordbook = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth() || {};
  const { savedWords, removeWord } = useData();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [sortBy, setSortBy] = useState('alphabetical');
  const [isPlaying, setIsPlaying] = useState(null);

  // 인증되지 않은 경우 AuthGuard 표시
  if (!isAuthenticated) {
    return (
      <AuthGuard feature="your wordbook">
        <MainNavigation />
        <MobileContentWrapper>
          <PageContainer>
            <EmptyAuthState>
              <EmptyIcon>📚</EmptyIcon>
              <EmptyText>Please sign in to access your wordbook</EmptyText>
              <EmptySubtext>Save words from articles and build your vocabulary!</EmptySubtext>
            </EmptyAuthState>
          </PageContainer>
        </MobileContentWrapper>
      </AuthGuard>
    );
  }

  // 정렬된 단어 목록 가져오기
  const getSortedWords = () => {
    if (!savedWords || savedWords.length === 0) return [];
    
    const wordsCopy = [...savedWords];
    
    switch (sortBy) {
      case 'alphabetical':
        return wordsCopy.sort((a, b) => a.word.localeCompare(b.word));
      case 'recent':
        return wordsCopy.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
      case 'article':
        return wordsCopy.sort((a, b) => a.articleTitle.localeCompare(b.articleTitle));
      default:
        return wordsCopy;
    }
  };

  // 단어 발음 재생
  const handlePlayWord = async (word, wordId) => {
    if (!isSpeechSynthesisSupported()) {
      console.warn('Speech synthesis not supported');
      return;
    }

    if (isPlaying === wordId) {
      stopCurrentSpeech();
      setIsPlaying(null);
      return;
    }

    setIsPlaying(wordId);
    
    try {
      await speakWord(word, 'en-US', 1.0);
      setIsPlaying(null);
    } catch (error) {
      console.error('Speech synthesis error:', error);
      setIsPlaying(null);
    }
  };

  // 단어 삭제
  const handleRemoveWord = (wordId) => {
    removeWord(wordId);
  };

  // 기사로 이동
  const handleGoToArticle = (articleId) => {
    navigate(`/article/${articleId}`);
  };

  const sortedWords = getSortedWords();

  return (
    <>
      <MainNavigation />
      <MobileContentWrapper>
        <PageContainer>
          <ContentHeader>
            <PageTitle>📚 My Wordbook</PageTitle>
            <WordCount>{sortedWords.length} words saved</WordCount>
          </ContentHeader>

          {/* 정렬 옵션 */}
          <SortSection>
            <Button
              variant="outlined"
              sx={{
                borderColor: '#1976d2',
                color: '#1976d2',
                minWidth: '160px',
                height: '40px',
                fontSize: '0.875rem',
                fontWeight: 'medium',
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#1565c0',
                  backgroundColor: 'rgba(25, 118, 210, 0.04)'
                }
              }}
            >
              <FormControl size="small" sx={{ minWidth: 140, border: 'none' }}>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  variant="standard"
                  disableUnderline
                  sx={{
                    fontSize: '0.875rem',
                    color: '#1976d2',
                    '& .MuiSelect-icon': {
                      color: '#1976d2'
                    }
                  }}
                >
                  <MenuItem value="alphabetical">Alphabetical</MenuItem>
                  <MenuItem value="recent">Recently Added</MenuItem>
                  <MenuItem value="article">By Article</MenuItem>
                </Select>
              </FormControl>
            </Button>
          </SortSection>

          {/* 단어 목록 */}
          <WordList>
            {sortedWords.length === 0 ? (
              <EmptyState>
                <EmptyIcon>📖</EmptyIcon>
                <EmptyText>No words saved yet</EmptyText>
                <EmptySubtext>Click on words while reading articles to save them here!</EmptySubtext>
              </EmptyState>
            ) : (
              sortedWords.map((word) => (
                <WordCard key={word.id}>
                  <WordHeader>
                    <WordInfo>
                      <WordText>{word.word}</WordText>
                      {word.partOfSpeech && (
                        <PartOfSpeech>{word.partOfSpeech}</PartOfSpeech>
                      )}
                    </WordInfo>
                    <WordActions>
                      <ActionButton
                        onClick={() => handlePlayWord(word.word, word.id)}
                        disabled={!isSpeechSynthesisSupported()}
                        title="Play pronunciation"
                      >
                        {isPlaying === word.id ? <VolumeOffIcon /> : <VolumeUpIcon />}
                      </ActionButton>
                      <ActionButton
                        onClick={() => handleGoToArticle(word.articleId)}
                        title="Go to article"
                      >
                        <ArticleIcon />
                      </ActionButton>
                      <ActionButton
                        onClick={() => handleRemoveWord(word.id)}
                        title="Remove word"
                        $isDelete
                      >
                        <DeleteIcon />
                      </ActionButton>
                    </WordActions>
                  </WordHeader>

                  <Definition>{word.definition}</Definition>
                  
                  {word.example && (
                    <Example>
                      <strong>Example:</strong> "{word.example}"
                    </Example>
                  )}

                  <WordFooter>
                    <ArticleTitle onClick={() => handleGoToArticle(word.articleId)}>
                      📄 {word.articleTitle}
                    </ArticleTitle>
                    <SavedDate>
                      Saved {new Date(word.savedAt).toLocaleDateString()}
                    </SavedDate>
                  </WordFooter>
                </WordCard>
              ))
            )}
          </WordList>
        </PageContainer>
      </MobileContentWrapper>
    </>
  );
};

const ContentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${designTokens.spacing.lg};
`;

const PageTitle = styled.h1`
  font-size: 1.8rem;
  font-weight: bold;
  margin: 0;
  color: ${getColor('text.primary')};
`;

const WordCount = styled.span`
  font-size: 1rem;
  color: ${getColor('text.hint')};
`;

const SortSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${designTokens.spacing.sm};
`;

const WordList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${designTokens.spacing.md};
  
  @media (min-width: ${designTokens.breakpoints.mobile}) {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
  
  @media (min-width: ${designTokens.breakpoints.desktop}) {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: ${designTokens.spacing.lg};
  }
`;

const WordCard = styled.div`
  background: ${getColor('background.paper')};
  border-radius: ${getBorderRadius('large')};
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  padding: ${designTokens.spacing.md};
  transition: all 0.2s;
  cursor: pointer;
  height: fit-content;
  
  &:hover {
    box-shadow: 0 4px 24px rgba(0,0,0,0.15);
    transform: translateY(-2px);
  }
`;

const WordHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${designTokens.spacing.sm};
`;

const WordInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${designTokens.spacing.xs};
  flex: 1;
`;

const WordText = styled.h3`
  font-size: 1.2rem;
  font-weight: bold;
  margin: 0;
  color: ${getColor('primary')};
  word-break: break-word;
`;

const PartOfSpeech = styled.span`
  font-size: 0.9rem;
  color: ${getColor('text.hint')};
`;

const WordActions = styled.div`
  display: flex;
  gap: ${designTokens.spacing.xs};
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: ${designTokens.spacing.xs};
  border-radius: ${getBorderRadius('small')};
  transition: background 0.2s;
  
  &:hover {
    background: ${designTokens.colors.background.grey};
  }
`;

const Definition = styled.p`
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0 0 ${designTokens.spacing.sm} 0;
  color: ${getColor('text.primary')};
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Example = styled.p`
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0 0 ${designTokens.spacing.sm} 0;
  color: ${getColor('text.hint')};
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const WordFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: ${getColor('text.hint')};
`;

const ArticleTitle = styled.span`
  cursor: pointer;
  color: ${getColor('primary')};
  &:hover {
    text-decoration: underline;
  }
`;

const SavedDate = styled.span`
  color: ${getColor('text.hint')};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${designTokens.spacing.xxl} ${designTokens.spacing.lg};
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: ${designTokens.spacing.sm};
`;

const EmptyText = styled.h3`
  font-size: 1.5rem;
  margin: 0 0 ${designTokens.spacing.xs} 0;
  color: ${getColor('text.secondary')};
`;

const EmptySubtext = styled.p`
  font-size: 1rem;
  color: ${getColor('text.hint')};
  margin: 0;
`;

const EmptyAuthState = styled.div`
  text-align: center;
  padding: ${designTokens.spacing.xxl} ${designTokens.spacing.lg};
`;

export default Wordbook; 