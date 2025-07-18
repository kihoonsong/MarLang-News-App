import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import {
  Select, MenuItem, FormControl, InputLabel, CircularProgress, useMediaQuery, useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import SimpleSEO from '../components/SimpleSEO';
import PageContainer from '../components/PageContainer';
// AdCard와 useAdInjector 제거 - 단어장은 기능적 화면으로 애드센스 정책상 광고 금지
import { speakWord, isSpeechSynthesisSupported, stopCurrentSpeech } from '../utils/speechUtils';
import { designTokens, getColor } from '../utils/designTokens';

const Wordbook = () => {
  const navigate = useNavigate();
  const { isAuthenticated, signInWithGoogle } = useAuth() || {};
  const { savedWords, removeWord } = useData();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // md 이하는 모바일로 간주

  const [sortBy, setSortBy] = useState('recent');
  const [sortedWords, setSortedWords] = useState([]);
  const [isPlaying, setIsPlaying] = useState(null);

  // 페이지네이션 상태 - 반응형으로 설정
  const [currentPage, setCurrentPage] = useState(1);
  const wordsPerPage = isMobile ? 10 : 30;

  // 뜻 가리기/보이기 상태 (localStorage 연동) - 기본값 false로 강제 설정
  const [showMeaning, setShowMeaning] = useState(() => {
    const saved = localStorage.getItem('wordbook_showMeaning');
    // 강제로 false 기본값 적용 (뜻 숨기기가 기본)
    return saved !== null ? JSON.parse(saved) : false;
  });
  // 전체 가리기 상태에서도 개별 단어의 뜻을 볼 수 있도록 관리하는 Set (word.id 기반)
  const [revealedIds, setRevealedIds] = useState(new Set());

  // 개별 카드 토글 함수
  const toggleWordMeaning = (wordId) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(wordId)) {
        next.delete(wordId);
      } else {
        next.add(wordId);
      }
      return next;
    });
  };

  // 안전한 네비게이션 함수
  const safeNavigate = (path) => {
    navigate(path);
  };

  // 페이지네이션 계산 (단어만 기준으로)
  const totalWords = sortedWords.length;
  const totalPages = Math.ceil(totalWords / wordsPerPage);
  const startIndex = (currentPage - 1) * wordsPerPage;
  const endIndex = startIndex + wordsPerPage;
  const currentPageWords = sortedWords.slice(startIndex, endIndex);

  // 단어장은 사용자 생성 콘텐츠로 애드센스 정책상 광고 표시 불가
  // 게시자 콘텐츠가 아닌 기능적 화면이므로 광고 제거
  const currentPageItems = currentPageWords;

  // 페이지 변경 함수
  const handlePageChange = (page, event) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    setCurrentPage(page);
    // 페이지 변경 시 스크롤을 맨 위로 이동
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 화면 크기 변경 시 페이지 범위 조정
  useEffect(() => {
    const newTotalPages = Math.ceil(totalWords / wordsPerPage);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(1);
    }
  }, [isMobile, totalWords, wordsPerPage, currentPage]);

  // showMeaning 상태 변경 시 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('wordbook_showMeaning', JSON.stringify(showMeaning));
  }, [showMeaning]);

  // 뜻 가리기/보이기 토글 함수
  const toggleMeaningVisibility = () => {
    setShowMeaning(!showMeaning);
  };

  // 정렬 변경 시에만 페이지를 1로 리셋하는 useRef 추가
  const prevSortBy = useRef(sortBy);

  useEffect(() => {
    if (isAuthenticated && savedWords) {
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
    } else if (!isAuthenticated) {
      // 비로그인 사용자는 빈 배열
      setSortedWords([]);
    }

    // 정렬이 변경된 경우에만 첫 페이지로 이동
    if (prevSortBy.current !== sortBy) {
      setCurrentPage(1);
      prevSortBy.current = sortBy;
    }
  }, [savedWords, sortBy, isAuthenticated]);

  // 단어 발음 재생
  const handlePlayWord = async (word, wordId) => {
    if (!isSpeechSynthesisSupported()) {
      if (import.meta.env.DEV) {
        console.warn('Speech synthesis not supported');
      }
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
      if (import.meta.env.DEV) {
        console.error('Speech synthesis error:', error);
      }
      setIsPlaying(null);
    }
  };

  // 단어 삭제
  const handleRemoveWord = (wordId) => {
    if (isAuthenticated && removeWord) {
      removeWord(wordId);
    }
  };

  // 기사로 이동
  const handleGoToArticle = (articleId) => {
    safeNavigate(`/article/${articleId}`);
  };

  return (
    <>
      {/* SEO 메타데이터 */}
      <SimpleSEO />
      
      <MobileNavigation />
      <MobileContentWrapper>
        <PageContainer>
          {/* 헤더 - 정렬 기능을 우측 상단에 배치 */}
          <Header>
            <HeaderContent>
              {/* 빈 공간 */}
            </HeaderContent>
            <HeaderControls>
              {/* 뜻 가리기/보이기 토글 버튼 */}
              <MeaningToggleButton
                onClick={toggleMeaningVisibility}
                $showMeaning={showMeaning}
                aria-pressed={showMeaning}
                aria-label={showMeaning ? "Hide word meanings" : "Show word meanings"}
                title={showMeaning ? "Hide meanings" : "Show meanings"}
              >
                {showMeaning ? <VisibilityIcon /> : <VisibilityOffIcon />}
              </MeaningToggleButton>

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
            </HeaderControls>
          </Header>

          {/* 단어 목록 */}
          <WordList>
            {!isAuthenticated ? (
              <GuestContent>
                <GuestHeader>
                  <GuestIcon>📚</GuestIcon>
                  <GuestTitle>개인 단어장</GuestTitle>
                  <GuestSubtitle>영어 학습을 위한 나만의 단어 저장소</GuestSubtitle>
                </GuestHeader>

                <FeatureList>
                  <FeatureItem>
                    <FeatureIcon>🔖</FeatureIcon>
                    <FeatureText>
                      <FeatureTitle>단어 저장 기능</FeatureTitle>
                      <FeatureDesc>기사를 읽으며 모르는 단어를 클릭하면 자동으로 단어장에 저장됩니다</FeatureDesc>
                    </FeatureText>
                  </FeatureItem>

                  <FeatureItem>
                    <FeatureIcon>🔊</FeatureIcon>
                    <FeatureText>
                      <FeatureTitle>발음 듣기</FeatureTitle>
                      <FeatureDesc>저장된 단어의 정확한 발음을 음성으로 들을 수 있습니다</FeatureDesc>
                    </FeatureText>
                  </FeatureItem>

                  <FeatureItem>
                    <FeatureIcon>📖</FeatureIcon>
                    <FeatureText>
                      <FeatureTitle>뜻과 예문</FeatureTitle>
                      <FeatureDesc>단어의 뜻과 함께 실제 기사에서 사용된 문맥을 확인할 수 있습니다</FeatureDesc>
                    </FeatureText>
                  </FeatureItem>

                  <FeatureItem>
                    <FeatureIcon>🎯</FeatureIcon>
                    <FeatureText>
                      <FeatureTitle>맞춤형 학습</FeatureTitle>
                      <FeatureDesc>저장한 단어들을 다양한 방식으로 정렬하고 체계적으로 학습할 수 있습니다</FeatureDesc>
                    </FeatureText>
                  </FeatureItem>
                </FeatureList>

                <LoginPrompt>
                  <LoginText>개인 단어장을 사용하려면 로그인이 필요합니다</LoginText>
                  <LoginButton onClick={signInWithGoogle}>
                    Google로 로그인하기
                  </LoginButton>
                </LoginPrompt>
              </GuestContent>
            ) : totalWords === 0 ? (
              <EmptyState>
                <EmptyIcon>📖</EmptyIcon>
                <EmptyText>No words saved yet</EmptyText>
                <EmptySubtext>Click on words while reading articles to save them here!</EmptySubtext>
              </EmptyState>
            ) : (
              <>
                {/* 페이지네이션 적용된 단어 목록 */}
                {currentPageItems.map((word, index) => {
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
                              {/* 개별 뜻 가리기/보이기 아이콘 (전체 가리기 모드에서만 표시) */}
                              {!showMeaning && (
                                <RevealButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleWordMeaning(word.id);
                                  }}
                                  aria-pressed={revealedIds.has(word.id)}
                                  title={revealedIds.has(word.id) ? 'Hide meaning' : 'Show meaning'}
                                >
                                  {revealedIds.has(word.id) ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                                </RevealButton>
                              )}
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
                      <Definition $showMeaning={showMeaning || revealedIds.has(word.id)}>
                        {word.definition}
                      </Definition>

                      {/* 예문 (있는 경우만) */}
                      {word.example && (
                        <Example>
                          <strong>Example:</strong> "{word.example}"
                        </Example>
                      )}
                    </WordCard>
                  );
                })}
              </>
            )}
          </WordList>

          {/* 페이지네이션 - WordList 밖으로 이동 */}
          {isAuthenticated && totalWords > 0 && totalPages > 1 && (
            <PaginationContainer>
              <PaginationInfo>
                Showing {startIndex + 1}-{Math.min(endIndex, totalWords)} of {totalWords} words (Page {currentPage} of {totalPages})
              </PaginationInfo>
              <PaginationControls>
                <PageButton
                  onClick={(e) => handlePageChange(currentPage - 1, e)}
                  disabled={currentPage === 1}
                >
                  Previous
                </PageButton>

                {[...Array(totalPages)].map((_, index) => {
                  const pageNum = index + 1;
                  const isCurrentPage = pageNum === currentPage;

                  // 현재 페이지 주변 페이지만 표시 (1, 2, 3 페이지까지)
                  if (pageNum <= 3 || Math.abs(pageNum - currentPage) <= 1 || pageNum === totalPages) {
                    return (
                      <PageNumber
                        key={pageNum}
                        onClick={(e) => handlePageChange(pageNum, e)}
                        $isActive={isCurrentPage}
                      >
                        {pageNum}
                      </PageNumber>
                    );
                  } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return <PageEllipsis key={pageNum}>...</PageEllipsis>;
                  }
                  return null;
                })}

                <PageButton
                  onClick={(e) => handlePageChange(currentPage + 1, e)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </PageButton>
              </PaginationControls>
            </PaginationContainer>
          )}
        </PageContainer>
      </MobileContentWrapper>
    </>
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
    padding: 0 0.5rem;
    min-height: 44px;
    flex-wrap: nowrap;
    gap: 0.5rem;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
`;

const HeaderControls = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    gap: 0.5rem;
  }
  
  @media (max-width: 480px) {
    gap: 0.25rem;
    width: 100%;
    justify-content: space-between;
  }
`;

const MeaningToggleButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: ${getColor('text.secondary')};
  border-radius: 4px;
  
  &:hover {
    background: ${getColor('background.grey')};
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  .MuiSvgIcon-root {
    font-size: 1.2rem;
    transition: all 0.3s ease;
  }
  
  @media (max-width: 480px) {
    padding: 6px;
    
    .MuiSvgIcon-root {
      font-size: 1rem;
    }
  }
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
    min-width: auto;
    flex: 1;
  }
  
  .MuiFormControl-root {
    min-width: 120px !important;
    
    @media (max-width: 480px) {
      min-width: 80px !important;
      width: 100%;
    }
  }
  
  .MuiSvgIcon-root {
    @media (max-width: 480px) {
      font-size: 0.9rem;
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

// 단어장 광고 관련 스타일드 컴포넌트 제거 - 애드센스 정책 준수

const WordCard = styled.div`
  background: ${getColor('background.paper')};
  border-radius: 16px;
  border: 1px solid ${getColor('border')};
  padding: 20px;
  transition: all 0.25s ease;
  cursor: pointer;
  height: 180px;
  position: relative;
  display: flex;
  flex-direction: column;
  
  &:hover {
    border-color: ${getColor('primary')};
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
  color: ${getColor('text.hint')};
  border-radius: 50%;
  flex-shrink: 0;
  font-weight: bold;
  
  & .MuiSvgIcon-root {
    font-weight: bold;
    stroke-width: 2;
  }
  
  &:hover {
    color: ${getColor('error')};
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
  color: ${getColor('text.primary')};
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
  color: ${getColor('text.secondary')};
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
    background: ${getColor('background.grey')};
    color: ${getColor('primary')};
  }
  
  &:disabled {
    color: ${getColor('text.hint')};
    cursor: not-allowed;
    
    &:hover {
      background: none;
      color: ${getColor('text.hint')};
    }
  }
`;

const RevealButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s ease;
  color: ${getColor('text.secondary')};
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
    background: ${getColor('background.grey')};
    color: ${getColor('primary')};
  }
`;

const PartOfSpeech = styled.span`
  font-size: 0.7rem;
  color: ${getColor('text.secondary')};
  background: ${getColor('background.grey')};
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
  color: ${getColor('text.secondary')};
  flex: 1;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  font-weight: 400;
  transition: filter 0.3s ease, opacity 0.3s ease;
  word-break: break-word;
  
  ${props => !props.$showMeaning && `
    filter: blur(4px);
    opacity: 0.4;
    user-select: none;
    pointer-events: none;
  `}
`;

const Example = styled.p`
  font-size: 0.8rem;
  line-height: 1.4;
  margin: 12px 0 0 0;
  color: ${getColor('text.secondary')};
  padding: 8px 12px;
  background: ${getColor('background.grey')};
  border-radius: 8px;
  border-left: 3px solid ${getColor('primary')};
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  font-style: normal;
  
  strong {
    color: ${getColor('primary')};
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


const GuestContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
`;

const GuestHeader = styled.div`
  margin-bottom: 3rem;
`;

const GuestIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const GuestTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: ${getColor('text.primary')};
  margin: 0 0 0.5rem 0;
`;

const GuestSubtitle = styled.p`
  font-size: 1.1rem;
  color: ${getColor('text.secondary')};
  margin: 0;
`;

const FeatureList = styled.div`
  display: grid;
  gap: 2rem;
  margin-bottom: 3rem;
  text-align: left;
  
  @media (max-width: 768px) {
    gap: 1.5rem;
  }
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  background: ${getColor('background.grey')};
  border-radius: 12px;
  border: 1px solid ${getColor('border')};
`;

const FeatureIcon = styled.div`
  font-size: 2rem;
  flex-shrink: 0;
`;

const FeatureText = styled.div`
  flex: 1;
`;

const FeatureTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${getColor('text.primary')};
  margin: 0 0 0.5rem 0;
`;

const FeatureDesc = styled.p`
  font-size: 0.95rem;
  color: ${getColor('text.secondary')};
  margin: 0;
  line-height: 1.5;
`;

const LoginPrompt = styled.div`
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
  text-align: center;
`;

const LoginText = styled.p`
  font-size: 1.1rem;
  margin: 0 0 1.5rem 0;
  opacity: 0.9;
`;

const LoginButton = styled.button`
  background: ${getColor('background')};
  color: ${getColor('text.primary')};
  border: none;
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${getColor('background.grey')};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin: 40px auto 20px auto;
  padding: 20px;
  max-width: 1200px;
  width: 100%;
  
  @media (min-width: 768px) {
    margin: 60px auto 40px auto;
    padding: 30px 20px;
  }
  
  @media (max-width: 480px) {
    margin: 30px auto 20px auto;
    padding: 15px 10px;
    gap: 15px;
  }
`;

const PaginationInfo = styled.div`
  color: ${getColor('text.secondary')};
  font-size: 14px;
  text-align: center;
`;

const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
`;

const PageButton = styled.button`
  padding: 8px 16px;
  border: 1px solid ${getColor('border')};
  background: ${getColor('background')};
  color: ${getColor('text.primary')};
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: ${getColor('background.grey')};
    border-color: ${getColor('primary')};
  }
  
  &:disabled {
    background: ${getColor('background.grey')};
    color: ${getColor('text.hint')};
    cursor: not-allowed;
  }
`;

const PageNumber = styled.button`
  padding: 8px 12px;
  border: 1px solid ${getColor('border')};
  background: ${props => props.$isActive ? getColor('primary') : getColor('background')};
  color: ${props => props.$isActive ? getColor('background') : getColor('text.primary')};
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  min-width: 40px;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: ${props => props.$isActive ? getColor('primaryDark') : getColor('background.grey')};
    border-color: ${getColor('primary')};
  }
`;

const PageEllipsis = styled.span`
  padding: 8px 4px;
  color: ${getColor('text.hint')};
  font-size: 14px;
`;

export default Wordbook; 