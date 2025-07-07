import React, { useState, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { 
  Button, IconButton, Slider, Box, Typography, Select, MenuItem, FormControl, InputLabel, CircularProgress
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SpeedIcon from '@mui/icons-material/Speed';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { createUnifiedTTS } from '../../utils/UnifiedTTS';

const TTSControlsContainer = styled(Box)`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  background: ${props => props.theme.palette.background.paper};
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin: 16px 0;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
  }
`;

const TTSButton = styled(Button)`
  min-width: 120px;
  border-radius: 8px;
`;

const SpeedControl = styled(Box)`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 150px;
`;

const TTSControls = ({ 
  isTTSPlaying, 
  isTTSLoading, 
  ttsSpeed, 
  currentSentence, 
  totalSentences,
  currentContent,
  onTTSStateChange,
  onSpeedChange 
}) => {
  const unifiedTTSRef = useRef(null);

  const startTTS = useCallback(async () => {
    if (!currentContent || currentContent.trim().length === 0) {
      console.warn('⚠️ 재생할 텍스트가 없습니다');
      return;
    }

    try {
      console.log('🚀 UnifiedTTS 서비스로 재생 시작 (모든 플랫폼)');
      
      // UnifiedTTS 인스턴스 생성
      if (unifiedTTSRef.current) {
        unifiedTTSRef.current.stop();
      }
      
      unifiedTTSRef.current = createUnifiedTTS({
        rate: ttsSpeed,
        onStart: () => {
          console.log('🎵 TTS 재생 시작됨');
          onTTSStateChange({
            isLoading: false,
            isPlaying: true,
            currentSentence: 0,
            totalSentences: 0
          });
        },
        onProgress: (sentenceIndex, totalSentences, sentenceText, sentenceInfo) => {
          console.log(`📊 진행률: ${sentenceIndex + 1}/${totalSentences}`);
          onTTSStateChange({
            currentSentence: sentenceIndex,
            totalSentences: totalSentences
          });
        },
        onComplete: () => {
          console.log('✅ TTS 재생 완료');
          onTTSStateChange({
            isLoading: false,
            isPlaying: false,
            currentSentence: -1,
            totalSentences: 0
          });
        },
        onError: (error) => {
          console.error('❌ TTS 에러:', error);
          onTTSStateChange({
            isLoading: false,
            isPlaying: false,
            currentSentence: -1,
            totalSentences: 0
          });
        }
      });
      
      // TTS 재생 시작
      const success = await unifiedTTSRef.current.play(currentContent);
      
      if (!success) {
        console.error('❌ TTS 재생 실패');
        onTTSStateChange({
          isLoading: false,
          isPlaying: false,
          currentSentence: -1,
          totalSentences: 0
        });
      }
      
    } catch (error) {
      console.error('❌ TTS 시작 실패:', error);
      onTTSStateChange({
        isLoading: false,
        isPlaying: false,
        currentSentence: -1,
        totalSentences: 0
      });
    }
  }, [currentContent, ttsSpeed, onTTSStateChange]);

  const handleTTS = useCallback(() => {
    if (isTTSPlaying) {
      // TTS 중지
      console.log('🛑 TTS 중지 버튼 클릭');
      
      if (unifiedTTSRef.current) {
        unifiedTTSRef.current.stop();
      }
      
      onTTSStateChange({
        isPlaying: false,
        isLoading: false,
        currentSentence: -1,
        totalSentences: 0
      });
      
      console.log('✅ TTS 중지 완료');
    } else {
      // TTS 시작
      onTTSStateChange({ isLoading: true });
      startTTS();
    }
  }, [isTTSPlaying, startTTS, onTTSStateChange]);

  const handleSpeedChange = useCallback((newSpeed) => {
    console.log('⚡ 배속 변경:', ttsSpeed, '→', newSpeed);
    onSpeedChange(newSpeed);
    
    // 재생 중이면 새 속도로 업데이트
    if (unifiedTTSRef.current && isTTSPlaying) {
      console.log('🔄 재생 중 배속 변경');
      unifiedTTSRef.current.setSpeed(newSpeed);
    }
  }, [ttsSpeed, isTTSPlaying, onSpeedChange]);

  return (
    <TTSControlsContainer>
      <TTSButton
        variant="contained"
        startIcon={isTTSLoading ? (
          <CircularProgress size={16} color="inherit" />
        ) : isTTSPlaying ? (
          <PauseIcon />
        ) : (
          <PlayArrowIcon />
        )}
        onClick={handleTTS}
        disabled={isTTSLoading}
        color={isTTSPlaying ? "secondary" : "primary"}
      >
        {isTTSLoading ? 'Loading...' : isTTSPlaying ? 'Pause' : 'Play'}
      </TTSButton>

      {isTTSPlaying && totalSentences > 0 && (
        <Typography variant="body2" color="text.secondary">
          {currentSentence + 1} / {totalSentences}
        </Typography>
      )}

      <SpeedControl>
        <SpeedIcon color="action" />
        <FormControl size="small" sx={{ minWidth: 80 }}>
          <Select
            value={ttsSpeed}
            onChange={(e) => handleSpeedChange(e.target.value)}
            size="small"
          >
            <MenuItem value={0.5}>0.5x</MenuItem>
            <MenuItem value={0.75}>0.75x</MenuItem>
            <MenuItem value={0.8}>0.8x</MenuItem>
            <MenuItem value={1.0}>1.0x</MenuItem>
            <MenuItem value={1.25}>1.25x</MenuItem>
            <MenuItem value={1.5}>1.5x</MenuItem>
          </Select>
        </FormControl>
      </SpeedControl>
    </TTSControlsContainer>
  );
};

export default TTSControls;