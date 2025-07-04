import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Select, MenuItem, FormControl, InputLabel, useMediaQuery, useTheme, CircularProgress,
  Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import AuthGuard from '../components/AuthGuard';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import PageContainer from '../components/PageContainer';
import AdCard from '../components/AdCard';
import { useAdInjector } from '../hooks/useAdInjector';
import { speakWord, isSpeechSynthesisSupported, getCurrentPlayingStatus, stopCurrentSpeech } from '../utils/speechUtils';
import { designTokens, getColor, getBorderRadius } from '../utils/designTokens';

const Wordbook = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth() || {};
  const { savedWords, removeWord } = useData();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [sortBy, setSortBy] = useState('recent');
  const [sortedWords, setSortedWords] = useState([]);
  const [isPlaying, setIsPlaying] = useState(null);

  // 광고가 포함된 단어 목록 생성
  const { itemsWithAds, shouldShowAds } = useAdInjector(sortedWords);

  useEffect(() => {
    if (savedWords) {
      const wordsCopy = [...savedWords];
      
      // 어떤 형태의 타임스탬프든 안전하게 Date 객체로 변환하는 강화된 함수
      const toDate = (timestamp) => {
        if (!timestamp) return new Date(0); // null 또는 undefined 처리

        // Firestore Timestamp 객체 직접 처리
        if (typeof timestamp.toDate === 'function') {
          return timestamp.toDate();
        }

        // JSON 직렬화된 Timestamp 객체 처리 (seconds, nanoseconds)
        if (typeof timestamp === 'object' && timestamp.seconds !== undefined && timestamp.nanoseconds !== undefined) {
          return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
        }

        // ISO 문자열 및 기타 날짜 형식 처리
        const d = new Date(timestamp);
        if (!isNaN(d.getTime())) {
          return d;
        }

        // 모든 변환 실패 시 기본값 반환
        return new Date(0);
      };

      switch (sortBy) {
        case 'alphabetical':
          wordsCopy.sort((a, b) => a.word.localeCompare(b.word));
          break;
        case 'recent':
          wordsCopy.sort((a, b) => toDate(b.addedAt) - toDate(a.addedAt));
          break;
        case 'article':
          wordsCopy.sort((a, b) => (a.articleTitle || '').localeCompare(b.articleTitle || ''));
          break;
        default:
          break;
      }
      setSortedWords(wordsCopy);
    }
  }, [savedWords, sortBy]);

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

  return (
    <AuthGuard>
      <MobileNavigation />
      <MobileContentWrapper>
        <PageContainer>
            {/* 헤더 - 정렬 기능을 우측 상단에 배치 */}
            <Header>
              <HeaderContent>
                {/* 빈 공간 */}
              </HeaderContent>
              <SortContainer>
                <FilterListIcon sx={{ mr: 1, color: '#666' }} />
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Sort by</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort by"
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <MenuItem value="alphabetical">Alphabetical</MenuItem>
                    <MenuItem value="recent">Recently Added</MenuItem>
                    <MenuItem value="article">By Article</MenuItem>
                  </Select>
                </FormControl>
              </SortContainer>
            </Header>

          {/* 단어 목록 */}
          <WordList>
            {sortedWords.length === 0 ? (
              <EmptyState>
                <EmptyIcon>📖</EmptyIcon>
                <EmptyText>No words saved yet</EmptyText>
                <EmptySubtext>Click on words while reading articles to save them here!</EmptySubtext>
              </EmptyState>
            ) : (
              itemsWithAds.map((item) => {
                if (item.type === 'ad') {
                  return (
                    <WordbookAdCard key={item.id}>
                      <AdLabel>광고</AdLabel>
                      <AdContent>
                        <AdCard 
                          adSlot="wordbook"
                          minHeight="130px"
                          showLabel={false}
                          style={{ 
                            background: 'transparent',
                            border: 'none',
                            padding: '0',
                            margin: '0',
                            boxShadow: 'none',
                            borderRadius: '0',
                            width: '100%',
                            height: '100%'
                          }}
                        />
                      </AdContent>
                    </WordbookAdCard>
                  );
                }
                
                const word = item;
                return (
                  <WordCard 
                    key={word.id}
                    onClick={() => handleGoToArticle(word.articleId)}
                  >
                    {/* 단어+스피커 (상단), 품사 (하단) | 삭제 버튼 (우측) */}
                    <WordHeader>
                      <LeftGroup>
                        <WordColumn>
                          <WordRow>
                            <WordText>{word.word}</WordText>
                            <PronunciationButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlayWord(word.word, word.id);
                              }}
                              disabled={!isSpeechSynthesisSupported()}
                              title="Play pronunciation"
                            >
                              {isPlaying === word.id ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
                            </PronunciationButton>
                          </WordRow>
                          {word.partOfSpeech && (
                            <PartOfSpeech>{word.partOfSpeech}</PartOfSpeech>
                          )}
                        </WordColumn>
                      </LeftGroup>
                      <DeleteButton 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveWord(word.id);
                        }}
                        title="Remove word"
                      >
                        <CloseIcon fontSize="small" />
                      </DeleteButton>
                    </WordHeader>
                  
                    {/* 정의 */}
                    <Definition>{word.definition}</Definition>
                    
                    {/* 예문 (있는 경우만) */}
                    {word.example && (
                      <Example>
                        <strong>Example:</strong> "{word.example}"
                      </Example>
                    )}
                  </WordCard>
                );
              })
            )}
          </WordList>
        </PageContainer>
      </MobileContentWrapper>
    </AuthGuard>
  );
};

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 0 1rem;
  min-height: 56px;
  
  @media (max-width: 768px) {
    margin-bottom: 1.5rem;
    padding: 0 0.5rem;
    min-height: 48px;
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  @media (max-width: 480px) {
    margin-bottom: 1rem;
    padding: 0 0.25rem;
    min-height: 44px;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
`;

const SortContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
  min-width: 180px;
  
  @media (max-width: 768px) {
    gap: 0.25rem;
    min-width: 160px;
  }
  
  @media (max-width: 480px) {
    gap: 0.25rem;
    min-width: 140px;
    width: 100%;
    justify-content: flex-end;
  }
  
  .MuiFormControl-root {
    min-width: 120px !important;
    
    @media (max-width: 480px) {
      min-width: 100px !important;
      flex: 1;
    }
  }
  
  .MuiSvgIcon-root {
    @media (max-width: 480px) {
      font-size: 1rem;
    }
  }
`;

const WordList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-top: 24px;
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
  }
`;

const WordbookAdCard = styled.div`
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #f0f0f0;
  padding: 20px;
  transition: all 0.25s ease;
  cursor: default;
  height: 180px;
  position: relative;
  display: flex;
  flex-direction: column;
  
  /* 단어카드와 완전히 동일한 호버 효과 */
  &:hover {
    border-color: #1976d2;
    box-shadow: 0 8px 32px rgba(25, 118, 210, 0.12);
    transform: translateY(-4px);
  }
`;

const AdLabel = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 0.7rem;
  color: #666;
  background: #f8f9fa;
  padding: 1px 4px;
  border-radius: 8px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.2;
  z-index: 1;
`;

const AdContent = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
  overflow: hidden;
  
  /* 구글 애드센스 컨테이너 스타일 조정 */
  .adsbygoogle {
    width: 100% !important;
    height: 100% !important;
    max-height: 140px !important;
  }
`;

const WordCard = styled.div`
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #f0f0f0;
  padding: 20px;
  transition: all 0.25s ease;
  cursor: pointer;
  height: 180px;
  position: relative;
  display: flex;
  flex-direction: column;
  
  &:hover {
    border-color: #1976d2;
    box-shadow: 0 8px 32px rgba(25, 118, 210, 0.12);
    transform: translateY(-4px);
  }
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #999;
  border-radius: 50%;
  flex-shrink: 0;
  font-weight: bold;
  
  & .MuiSvgIcon-root {
    font-weight: bold;
    stroke-width: 2;
  }
  
  &:hover {
    color: #f44336;
    transform: scale(1.15);
  }
`;

const WordHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  width: 100%;
`;

const LeftGroup = styled.div`
  display: flex;
  align-items: flex-start;
  flex: 0 1 auto;
  min-width: 0;
`;

const WordColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const WordRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const WordText = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  color: #333;
  word-break: break-word;
  line-height: 1.2;
`;

const PronunciationButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s ease;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  min-height: 28px;
  flex-shrink: 0;
  
  & .MuiSvgIcon-root {
    font-size: 1rem;
  }
  
  &:hover {
    background: #f5f5f5;
    color: #1976d2;
  }
  
  &:disabled {
    color: #ccc;
    cursor: not-allowed;
    
    &:hover {
      background: none;
      color: #ccc;
    }
  }
`;

const PartOfSpeech = styled.span`
  font-size: 0.7rem;
  color: #666;
  background: #f8f9fa;
  padding: 1px 4px;
  border-radius: 8px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
  white-space: nowrap;
  line-height: 1.2;
  align-self: flex-start;
`;

const Definition = styled.p`
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
  color: #555;
  flex: 1;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  font-weight: 400;
`;

const Example = styled.p`
  font-size: 0.8rem;
  line-height: 1.4;
  margin: 12px 0 0 0;
  color: #666;
  padding: 8px 12px;
  background: #f8fbff;
  border-radius: 8px;
  border-left: 3px solid #1976d2;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  font-style: normal;
  
  strong {
    color: #1976d2;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
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