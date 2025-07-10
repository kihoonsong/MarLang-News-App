import React from 'react';
import styled from 'styled-components';
import { 
  Typography, Slider, FormControlLabel, Switch, FormControl, Select, MenuItem, InputLabel
} from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import PaletteIcon from '@mui/icons-material/Palette';
import { useData } from '../../contexts/DataContext';
import { getSupportedLanguages } from '../../utils/dictionaryApi';
import { useTranslations } from '../../hooks/useTranslations';

const interfaceLanguageOptions = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' }
];

const UserSettings = () => {
  const { userSettings, updateSettings } = useData();
  const { t } = useTranslations();

  const handleSettingChange = (key, value) => {
    updateSettings({
      [key]: value
    });
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

export default UserSettings;