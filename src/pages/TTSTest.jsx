import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Container, Typography, Button, TextField, Card, CardContent, 
  List, ListItem, ListItemText, ListItemSecondaryAction, IconButton,
  Chip, CircularProgress, Alert
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getVoiceManager } from '../utils/VoiceManager';
import { speakText, stopCurrentSpeech } from '../utils/speechUtils';
import { useData } from '../contexts/DataContext';

const TTSTest = () => {
  const { userSettings } = useData();
  const [testText, setTestText] = useState("Hello! This is a test of the text-to-speech system. How does this sound?");
  const [availableVoices, setAvailableVoices] = useState([]);
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [voiceManager, setVoiceManager] = useState(null);

  useEffect(() => {
    const manager = getVoiceManager();
    setVoiceManager(manager);

    // 음성 변경 리스너 등록
    const removeListener = manager.addListener((voices) => {
      setAvailableVoices(voices);
      setVoicesLoading(false);
      console.log('🎵 TTSTest 음성 목록 업데이트:', voices.length, '개');
    });

    // 이미 로드된 경우 즉시 설정
    if (manager.isVoicesLoaded()) {
      setAvailableVoices(manager.getVoices());
      setVoicesLoading(false);
    }

    return removeListener;
  }, []);

  const handleTestVoice = async (voice = null) => {
    if (currentlyPlaying) {
      stopCurrentSpeech();
      setCurrentlyPlaying(null);
      return;
    }

    const voiceToTest = voice ? voice.name : 'default';
    setCurrentlyPlaying(voiceToTest);

    try {
      if (voice) {
        // 특정 음성으로 테스트
        await speakText(testText, { 
          rate: userSettings?.ttsSpeed || 0.8,
          voice: voice
        });
      } else {
        // 현재 설정된 음성으로 테스트
        await speakText(testText, { 
          rate: userSettings?.ttsSpeed || 0.8
        });
      }
    } catch (error) {
      console.error('TTS 테스트 오류:', error);
    } finally {
      setCurrentlyPlaying(null);
    }
  };

  const handleRefreshVoices = () => {
    setVoicesLoading(true);
    // VoiceManager 재초기화
    if (voiceManager) {
      voiceManager.initializeVoices();
    }
  };

  const getCurrentVoice = () => {
    if (!voiceManager) return null;
    return voiceManager.getBestEnglishVoice(userSettings?.preferredTTSVoice);
  };

  const currentVoice = getCurrentVoice();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        🎵 TTS System Test
      </Typography>

      {/* 현재 설정 정보 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Current Settings
          </Typography>
          <SettingsInfo>
            <div>
              <strong>Platform:</strong> {voiceManager?.getPlatform() || 'Unknown'}
            </div>
            <div>
              <strong>TTS Speed:</strong> {userSettings?.ttsSpeed || 0.8}x
            </div>
            <div>
              <strong>Preferred Voice:</strong> {userSettings?.preferredTTSVoice || 'Auto'}
            </div>
            <div>
              <strong>Current Voice:</strong> {currentVoice ? `${currentVoice.name} (${currentVoice.lang})` : 'None'}
            </div>
          </SettingsInfo>
        </CardContent>
      </Card>

      {/* 테스트 텍스트 입력 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Test Text
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Enter text to test..."
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            startIcon={currentlyPlaying === 'default' ? <StopIcon /> : <PlayArrowIcon />}
            onClick={() => handleTestVoice()}
            disabled={!testText.trim()}
          >
            {currentlyPlaying === 'default' ? 'Stop' : 'Test Current Voice'}
          </Button>
        </CardContent>
      </Card>

      {/* 음성 목록 */}
      <Card>
        <CardContent>
          <VoiceListHeader>
            <Typography variant="h6">
              Available Voices
            </Typography>
            <div>
              <IconButton onClick={handleRefreshVoices} disabled={voicesLoading}>
                <RefreshIcon />
              </IconButton>
              {!voicesLoading && (
                <Chip 
                  size="small" 
                  label={`${availableVoices.length} voices`}
                  color="primary"
                  variant="outlined"
                />
              )}
            </div>
          </VoiceListHeader>

          {voicesLoading ? (
            <LoadingContainer>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                Loading voices...
              </Typography>
            </LoadingContainer>
          ) : availableVoices.length === 0 ? (
            <Alert severity="warning">
              No English voices available. Please check your system settings.
            </Alert>
          ) : (
            <List>
              {availableVoices.map((voice, index) => (
                <ListItem key={voice.name} divider={index < availableVoices.length - 1}>
                  <ListItemText
                    primary={voice.name}
                    secondary={
                      <VoiceSecondary>
                        <span>{voice.lang}</span>
                        {voice.default && <Chip size="small" label="Default" color="primary" />}
                        {userSettings?.preferredTTSVoice === voice.name && (
                          <Chip size="small" label="Selected" color="success" />
                        )}
                      </VoiceSecondary>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleTestVoice(voice)}
                      disabled={!testText.trim()}
                      color={currentlyPlaying === voice.name ? "secondary" : "default"}
                    >
                      {currentlyPlaying === voice.name ? <StopIcon /> : <PlayArrowIcon />}
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

const SettingsInfo = styled.div`
  display: grid;
  gap: 0.5rem;
  font-family: monospace;
  font-size: 0.9rem;
`;

const VoiceListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
`;

const VoiceSecondary = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

export default TTSTest;