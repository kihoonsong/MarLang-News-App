import React from 'react';
import styled from 'styled-components';
import { Card, CardContent, Typography, FormControl, Select, MenuItem, InputLabel } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import { getSupportedLanguages } from '../../utils/dictionaryApi';

const languageOptions = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
];

const LanguageSettings = ({ settings, onSettingChange }) => {
  return (
    <SettingsCard>
      <CardHeader>
        <LanguageIcon color="primary" />
        <Typography variant="h6" component="h2">
          Language Settings
        </Typography>
      </CardHeader>
      
      <CardContent>
        <SettingsGrid>
          <FormControl fullWidth margin="normal">
            <InputLabel>Interface Language</InputLabel>
            <Select
              value={settings.language}
              label="Interface Language"
              onChange={(e) => onSettingChange('language', e.target.value)}
            >
              {languageOptions.map((lang) => (
                <MenuItem key={lang.code} value={lang.code}>
                  <LanguageOption>
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </LanguageOption>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Translation Language</InputLabel>
            <Select
              value={settings.translationLanguage}
              label="Translation Language"
              onChange={(e) => onSettingChange('translationLanguage', e.target.value)}
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
      </CardContent>
    </SettingsCard>
  );
};

const SettingsCard = styled(Card)`
  margin-bottom: 1.5rem;
  border-radius: 16px !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08) !important;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 1.5rem 0.5rem 1.5rem;
`;

const SettingsGrid = styled.div`
  display: grid;
  gap: 1rem;
`;

const LanguageOption = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export default LanguageSettings;