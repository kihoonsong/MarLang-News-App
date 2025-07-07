import React, { memo } from 'react';
import styled from 'styled-components';
import { Box, Typography } from '@mui/material';

const ContentContainer = styled(Box)`
  line-height: 1.8;
  font-size: 1.1rem;
  color: ${props => props.theme.palette.text.primary};
  margin-bottom: 32px;
  
  @media (max-width: 768px) {
    font-size: 1rem;
    line-height: 1.7;
  }
`;

const StyledWordSpan = styled.span`
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: inline;
  
  &:hover {
    background-color: ${props => props.theme.palette.action.hover};
  }
  
  ${props => props.$isHighlighted && `
    background-color: ${props.theme.palette.primary.main};
    color: ${props.theme.palette.primary.contrastText};
    font-weight: 600;
    animation: pulse 1s ease-in-out;
  `}
  
  ${props => props.$isCurrentSentence && `
    background-color: ${props.theme.palette.warning.light};
    color: ${props.theme.palette.warning.contrastText};
    box-shadow: 0 0 8px rgba(255, 193, 7, 0.4);
  `}
  
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
`;

const SentenceContainer = styled.span`
  ${props => props.$isCurrentSentence && `
    background: linear-gradient(120deg, ${props.theme.palette.primary.light}20 0%, ${props.theme.palette.primary.light}40 100%);
    border-radius: 8px;
    padding: 4px 8px;
    margin: 0 2px;
    border-left: 4px solid ${props.theme.palette.primary.main};
    display: inline-block;
    animation: highlight 0.5s ease-in-out;
  `}
  
  @keyframes highlight {
    0% { opacity: 0.7; transform: translateX(-2px); }
    100% { opacity: 1; transform: translateX(0); }
  }
`;

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

const ArticleContent = ({ 
  levels, 
  selectedLevel, 
  highlightedWords, 
  currentSentence, 
  isTTSPlaying, 
  onWordClick 
}) => {
  if (!levels || !levels[selectedLevel]) {
    return (
      <ContentContainer>
        <Typography variant="body1" color="text.secondary" align="center">
          No content available for this level.
        </Typography>
      </ContentContainer>
    );
  }

  const content = levels[selectedLevel].content;
  
  if (!content || content.trim().length === 0) {
    return (
      <ContentContainer>
        <Typography variant="body1" color="text.secondary" align="center">
          Content is not available.
        </Typography>
      </ContentContainer>
    );
  }

  // TTS와 동일한 문장 분할 방식 사용
  const sentences = content.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  
  console.log(`🎨 렌더링 레벨 ${selectedLevel}: 총 ${sentences.length}개 문장, currentSentence=${currentSentence}, isTTSPlaying=${isTTSPlaying}, selectedLevel=${selectedLevel}`);
  
  return (
    <ContentContainer>
      {sentences.map((sentence, sentenceIdx) => {
        // 현재 선택된 레벨에서만 하이라이팅 활성화
        const isCurrentSentence = currentSentence === sentenceIdx && isTTSPlaying && selectedLevel === selectedLevel;
        
        if (isCurrentSentence) {
          console.log(`🔥 현재 활성 문장: 레벨 ${selectedLevel}, 인덱스 ${sentenceIdx} - "${sentence.substring(0, 30)}..."`);
        }

        return (
          <SentenceContainer 
            key={sentenceIdx} 
            $isCurrentSentence={isCurrentSentence}
          >
            {sentence.split(/(\s+)/).map((part, partIdx) => {
              const trimmedPart = part.trim();
              
              // 공백이나 빈 문자열은 그대로 렌더링
              if (!trimmedPart || /^\s+$/.test(part)) {
                return part;
              }
              
              // 구두점 제거하여 단어 추출
              const cleanWord = trimmedPart.replace(/[^\w']/g, '').toLowerCase();
              
              if (!cleanWord) {
                return part;
              }
              
              const isHighlighted = highlightedWords.some(
                hw => hw.word.toLowerCase() === cleanWord
              );
              
              return (
                <WordSpan
                  key={`${sentenceIdx}-${partIdx}`}
                  word={trimmedPart}
                  isHighlighted={isHighlighted}
                  onWordClick={onWordClick}
                />
              );
            })}
          </SentenceContainer>
        );
      })}
    </ContentContainer>
  );
};

export default memo(ArticleContent);