import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Popover, Paper, Typography, CircularProgress, Box, Chip, IconButton, Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { fetchWordDefinitionAndTranslation, getSupportedLanguages } from '../../utils/dictionaryApi';
import { speakSentence } from '../../utils/speechUtils';

const PopoverContent = styled(Paper)`
  padding: 20px;
  max-width: 400px;
  min-width: 300px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
`;

const WordHeader = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  border-bottom: 1px solid ${props => props.theme?.palette?.divider || '#e0e0e0'};
  padding-bottom: 12px;
`;

const WordTitle = styled(Typography)`
  font-weight: 600;
  color: ${props => props.theme?.palette?.primary?.main || '#1976d2'};
  font-size: 1.2rem;
`;

const DefinitionSection = styled(Box)`
  margin-bottom: 16px;
`;

const SectionTitle = styled(Typography)`
  font-weight: 600;
  margin-bottom: 8px;
  color: ${props => props.theme?.palette?.text?.primary || '#000000'};
`;

const DefinitionText = styled(Typography)`
  margin-bottom: 8px;
  line-height: 1.6;
`;

const TranslationText = styled(Typography)`
  color: ${props => props.theme?.palette?.text?.secondary || '#666666'};
  font-style: italic;
  line-height: 1.6;
`;

const ExampleText = styled(Typography)`
  background: ${props => props.theme?.palette?.grey?.[100] || '#f5f5f5'};
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid ${props => props.theme?.palette?.primary?.main || '#1976d2'};
  margin: 8px 0;
  font-style: italic;
`;

const PartOfSpeechChip = styled(Chip)`
  margin-right: 8px;
  margin-bottom: 8px;
`;

const ActionButton = styled(Button)`
  margin: 4px;
`;

const LoadingBox = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 16px;
`;

const WordDefinitionPopover = ({ 
  anchorEl, 
  selectedWord, 
  selectedLanguage, 
  onClose,
  onAddToWordbook 
}) => {
  const [definition, setDefinition] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const open = Boolean(anchorEl && selectedWord);

  useEffect(() => {
    if (open && selectedWord) {
      fetchDefinition();
    }
  }, [open, selectedWord, selectedLanguage]);

  const fetchDefinition = async () => {
    if (!selectedWord) return;

    setIsLoading(true);
    setError(null);
    setDefinition(null);

    try {
      console.log('🔍 단어 정의 요청:', selectedWord, '언어:', selectedLanguage);
      const result = await fetchWordDefinitionAndTranslation(selectedWord, selectedLanguage);
      
      if (result) {
        console.log('✅ 단어 정의 받음:', result);
        setDefinition(result);
      } else {
        setError('Definition not found');
      }
    } catch (err) {
      console.error('❌ 단어 정의 에러:', err);
      setError(err.message || 'Failed to fetch definition');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (text) => {
    try {
      speakSentence(text);
    } catch (error) {
      console.error('음성 재생 실패:', error);
    }
  };

  const handleAddToWordbook = () => {
    if (definition && selectedWord) {
      const wordData = {
        word: selectedWord,
        definition: definition.definition,
        translation: definition.translation,
        partOfSpeech: definition.partOfSpeech,
        examples: definition.examples,
        pronunciation: definition.pronunciation,
        addedAt: new Date().toISOString()
      };
      
      onAddToWordbook(wordData);
      onClose();
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <LoadingBox>
          <CircularProgress size={32} />
          <Typography variant="body2" color="text.secondary">
            Loading definition...
          </Typography>
        </LoadingBox>
      );
    }

    if (error) {
      return (
        <Box textAlign="center" py={3}>
          <Typography variant="body1" color="error" gutterBottom>
            {error}
          </Typography>
          <ActionButton 
            variant="outlined" 
            size="small" 
            onClick={fetchDefinition}
          >
            Retry
          </ActionButton>
        </Box>
      );
    }

    if (!definition) {
      return (
        <Box textAlign="center" py={3}>
          <Typography variant="body2" color="text.secondary">
            No definition available
          </Typography>
        </Box>
      );
    }

    return (
      <>
        {definition.partOfSpeech && (
          <Box mb={2}>
            {Array.isArray(definition.partOfSpeech) ? (
              definition.partOfSpeech.map((pos, index) => (
                <PartOfSpeechChip 
                  key={index}
                  label={pos} 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                />
              ))
            ) : (
              <PartOfSpeechChip 
                label={definition.partOfSpeech} 
                size="small" 
                color="primary" 
                variant="outlined" 
              />
            )}
          </Box>
        )}

        {definition.pronunciation && (
          <DefinitionSection>
            <SectionTitle variant="subtitle2">Pronunciation</SectionTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" color="text.secondary">
                {definition.pronunciation}
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => handleSpeak(selectedWord)}
                color="primary"
              >
                <VolumeUpIcon fontSize="small" />
              </IconButton>
            </Box>
          </DefinitionSection>
        )}

        {definition.definition && (
          <DefinitionSection>
            <SectionTitle variant="subtitle2">Definition</SectionTitle>
            <DefinitionText variant="body2">
              {definition.definition}
            </DefinitionText>
          </DefinitionSection>
        )}

        {definition.translation && (
          <DefinitionSection>
            <SectionTitle variant="subtitle2">Translation</SectionTitle>
            <TranslationText variant="body2">
              {definition.translation}
            </TranslationText>
          </DefinitionSection>
        )}

        {definition.examples && definition.examples.length > 0 && (
          <DefinitionSection>
            <SectionTitle variant="subtitle2">Examples</SectionTitle>
            {definition.examples.slice(0, 2).map((example, index) => (
              <ExampleText key={index} variant="body2">
                {example}
              </ExampleText>
            ))}
          </DefinitionSection>
        )}

        <Box display="flex" justifyContent="space-between" mt={2}>
          <ActionButton 
            variant="contained" 
            size="small" 
            onClick={handleAddToWordbook}
            color="primary"
          >
            Add to Wordbook
          </ActionButton>
          <ActionButton 
            variant="outlined" 
            size="small" 
            onClick={() => handleSpeak(selectedWord)}
            startIcon={<VolumeUpIcon />}
          >
            Speak
          </ActionButton>
        </Box>
      </>
    );
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      PaperProps={{
        elevation: 8,
        sx: { borderRadius: 2 }
      }}
    >
      <PopoverContent>
        <WordHeader>
          <WordTitle>
            {selectedWord}
          </WordTitle>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </WordHeader>
        
        {renderContent()}
      </PopoverContent>
    </Popover>
  );
};

export default WordDefinitionPopover;