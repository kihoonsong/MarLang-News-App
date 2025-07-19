import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Typography, Slider, FormControlLabel, Switch, FormControl, Select, MenuItem, InputLabel, CircularProgress, Chip
} from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import PaletteIcon from '@mui/icons-material/Palette';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useData } from '../../contexts/DataContext';
import { getSupportedLanguages } from '../../utils/dictionaryApi';
import { useTranslations } from '../../hooks/useTranslations';
import { getVoiceManager } from '../../utils/VoiceManager';
import { speakText } from '../../utils/speechUtils';

const interfaceLanguageOptions = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' }
];

const UserSettings = () => {
  const { userSettings, updateSettings } = useData();
  const { t } = useTranslations();
  const [availableVoices, setAvailableVoices] = useState([]);
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [testingVoice, setTestingVoice] = useState(null);

  // VoiceManager를 통한 음성 목록 로딩
  useEffect(() => {
    const voiceManager = getVoiceManager();
    
    // 음성 변경 리스너 등록
    const removeListener = voiceManager.addListener((voices) => {
      setAvailableVoices(voices);
      setVoicesLoading(false);
      if (import.meta.env.DEV) {
        console.log('🎵 UserSettings 음성 목록 업데이트:', voices.length, '개');
      }
    });

    // 이미 로드된 경우 즉시 설정
    if (voiceManager.isVoicesLoaded()) {
      setAvailableVoices(voiceManager.getVoices());
      setVoicesLoading(false);
    }

    // 컴포넌트 언마운트 시 리스너 제거
    return removeListener;
  }, []);

  const handleSettingChange = (key, value) => {
    // TTS 음성 설정 변경 시 현재 재생 중지
    if (key === 'preferredTTSVoice') {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        console.log('🛑 TTS 음성 변경으로 인한 현재 재생 중지');
      }
    }
    
    updateSettings({
      [key]: value
    });
  };

  // 음성 테스트 함수
  const handleTestVoice = async (voiceName) => {
    if (testingVoice) return; // 이미 테스트 중이면 무시
    
    setTestingVoice(voiceName);
    
    try {
      // 현재 재생 중인 TTS 중지
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      
      // 테스트 문장
      const testText = "Hello! This is a voice test. How does this sound?";
      
      // VoiceManager를 통해 특정 음성으로 직접 테스트
      const voiceManager = getVoiceManager();
      const testVoice = voiceManager.findVoice(voiceName);
      
      if (testVoice) {
        // 직접 SpeechSynthesisUtterance 생성하여 테스트
        const utterance = new SpeechSynthesisUtterance(testText);
        utterance.voice = testVoice;
        utterance.lang = testVoice.lang;
        utterance.rate = userSettings?.ttsSpeed || 0.8;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // 테스트 완료 후 상태 초기화
        utterance.onend = () => setTestingVoice(null);
        utterance.onerror = () => setTestingVoice(null);
        
        window.speechSynthesis.speak(utterance);
      } else {
        console.warn('테스트할 음성을 찾을 수 없음:', voiceName);
        setTestingVoice(null);
      }
    } catch (error) {
      console.error('음성 테스트 오류:', error);
      setTestingVoice(null);
    }
  };

  return (
    <SettingsContainer>
      <SectionTitle>
        ⚙️ {t.settings}
      </SectionTitle>
      
      <SettingsContent>
        {/* Language Settings */}
        <SettingSection>
          <SectionHeader>
            <LanguageIcon sx={{ color: '#1976d2', mr: 1 }} />
            <Typography variant="subtitle1" fontWeight={600}>
              {t.languageSettings}
            </Typography>
          </SectionHeader>
          
          <SettingsGrid>
            <FormControl size="small" fullWidth>
              <InputLabel>{t.interfaceLanguage}</InputLabel>
              <Select
                value={userSettings?.language || 'en'}
                label={t.interfaceLanguage}
                onChange={(e) => handleSettingChange('language', e.target.value)}
              >
                {interfaceLanguageOptions.map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>
                    <LanguageOption>
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </LanguageOption>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel>{t.translationLanguage}</InputLabel>
              <Select
                value={userSettings?.translationLanguage || 'ko'}
                label={t.translationLanguage}
                onChange={(e) => handleSettingChange('translationLanguage', e.target.value)}
              >
                {getSupportedLanguages().map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>
                    <LanguageOption>
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </LanguageOption>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </SettingsGrid>
        </SettingSection>

        {/* Audio Settings */}
        <SettingSection>
          <SectionHeader>
            <VolumeUpIcon sx={{ color: '#1976d2', mr: 1 }} />
            <Typography variant="subtitle1" fontWeight={600}>
              {t.audioSettings}
            </Typography>
          </SectionHeader>
          
          <SettingsGrid>
            <SliderContainer>
              <Typography variant="body2" gutterBottom>
                {t.ttsSpeed}: {userSettings?.ttsSpeed || 0.8}x
              </Typography>
              <Slider
                value={userSettings?.ttsSpeed || 0.8}
                onChange={(e, value) => handleSettingChange('ttsSpeed', value)}
                min={0.5}
                max={2.0}
                step={0.1}
                marks={[
                  { value: 0.5, label: '0.5x' },
                  { value: 1.0, label: '1.0x' },
                  { value: 1.5, label: '1.5x' },
                  { value: 2.0, label: '2.0x' }
                ]}
                size="small"
              />
            </SliderContainer>

            <FormControlLabel
              control={
                <Switch
                  checked={userSettings?.autoPlay || false}
                  onChange={(e) => handleSettingChange('autoPlay', e.target.checked)}
                  color="primary"
                  size="small"
                />
              }
              label={t.autoPlayPronunciation}
            />

            {/* TTS Voice Selection - Temporarily Disabled */}
            {/*
            <VoiceSelectionContainer>
              <FormControl size="small" fullWidth>
                <InputLabel>TTS Voice</InputLabel>
                <Select
                  value={userSettings?.preferredTTSVoice || ''}
                  label="TTS Voice"
                  onChange={(e) => handleSettingChange('preferredTTSVoice', e.target.value)}
                  disabled={voicesLoading}
                >
                  <MenuItem value="">
                    <VoiceOption>
                      <RecordVoiceOverIcon sx={{ fontSize: 16, mr: 1 }} />
                      <span>Auto (System Default)</span>
                    </VoiceOption>
                  </MenuItem>
                  {availableVoices.map((voice) => (
                    <MenuItem key={voice.name} value={voice.name}>
                      <VoiceOption>
                        <RecordVoiceOverIcon sx={{ fontSize: 16, mr: 1 }} />
                        <VoiceInfo>
                          <VoiceNameContainer>
                            <span>{voice.name}</span>
                            <VoiceDetail>({voice.lang})</VoiceDetail>
                          </VoiceNameContainer>
                          <VoiceTestButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTestVoice(voice.name);
                            }}
                            disabled={testingVoice !== null}
                            $testing={testingVoice === voice.name}
                          >
                            {testingVoice === voice.name ? (
                              <CircularProgress size={12} />
                            ) : (
                              <PlayArrowIcon sx={{ fontSize: 14 }} />
                            )}
                          </VoiceTestButton>
                        </VoiceInfo>
                      </VoiceOption>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {voicesLoading && (
                <VoiceLoadingContainer>
                  <CircularProgress size={16} />
                  <Typography variant="caption" color="text.secondary">
                    Loading voices...
                  </Typography>
                </VoiceLoadingContainer>
              )}
              
              {!voicesLoading && availableVoices.length === 0 && (
                <VoiceErrorContainer>
                  <Typography variant="caption" color="error">
                    No English voices available
                  </Typography>
                </VoiceErrorContainer>
              )}
              
              {!voicesLoading && availableVoices.length > 0 && (
                <VoiceInfoContainer>
                  <Chip 
                    size="small" 
                    label={`${availableVoices.length} voices available`}
                    color="primary"
                    variant="outlined"
                  />
                </VoiceInfoContainer>
              )}
            </VoiceSelectionContainer>
            */}
          </SettingsGrid>
        </SettingSection>

        {/* Learning Settings */}
        <SettingSection>
          <SectionHeader>
            <PaletteIcon sx={{ color: '#1976d2', mr: 1 }} />
            <Typography variant="subtitle1" fontWeight={600}>
              {t.learningSettings}
            </Typography>
          </SectionHeader>
          
          <SettingsGrid>
            <FormControlLabel
              control={
                <Switch
                  checked={userSettings?.autoSaveWords !== false}
                  onChange={(e) => handleSettingChange('autoSaveWords', e.target.checked)}
                  color="primary"
                  size="small"
                />
              }
              label={t.autoSaveWords}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={userSettings?.highlightSavedWords !== false}
                  onChange={(e) => handleSettingChange('highlightSavedWords', e.target.checked)}
                  color="primary"
                  size="small"
                />
              }
              label={t.highlightSavedWords}
            />
          </SettingsGrid>
        </SettingSection>
      </SettingsContent>
    </SettingsContainer>
  );
};

const SettingsContainer = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
`;

const SectionTitle = styled.h3`
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  font-weight: bold;
  color: #2d3748;
`;

const SettingsContent = styled.div`
  /* Content wrapper for collapsed settings */
`;

const SettingSection = styled.div`
  margin-bottom: 2rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e9ecef;
`;

const SettingsGrid = styled.div`
  display: grid;
  gap: 1rem;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
`;

const SliderContainer = styled.div`
  padding: 0.5rem 0;
  grid-column: 1 / -1; /* 슬라이더는 전체 폭 사용 */
`;

const LanguageOption = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const VoiceSelectionContainer = styled.div`
  grid-column: 1 / -1; /* 전체 폭 사용 */
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const VoiceOption = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
`;

const VoiceInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 0.5rem;
`;

const VoiceNameContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.125rem;
  flex: 1;
`;

const VoiceDetail = styled.span`
  font-size: 0.75rem;
  color: #666;
  font-weight: 400;
`;

const VoiceTestButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: ${props => props.$testing ? '#1976d2' : '#f5f5f5'};
  color: ${props => props.$testing ? 'white' : '#666'};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: #1976d2;
    color: white;
  }
  
  &:disabled {
    opacity: 0.6;
  }
`;

const VoiceLoadingContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
`;

const VoiceErrorContainer = styled.div`
  padding: 0.5rem 0;
`;

const VoiceInfoContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 0.25rem 0;
`;

export default UserSettings;