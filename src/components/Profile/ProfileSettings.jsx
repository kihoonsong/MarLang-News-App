import React from 'react';
import styled from 'styled-components';

const ProfileSettings = ({ 
  userSettings, 
  translations, 
  languageOptions, 
  saveMessage, 
  onSettingChange 
}) => {
  return (
    <SettingsContainer>
      <SectionTitle>{translations.settings}</SectionTitle>
      {saveMessage && <SaveMessage>{saveMessage}</SaveMessage>}
      
      <SettingsGrid>
        {/* Interface Language */}
        <SettingGroup>
          <SettingLabel>
            {translations.interfaceLanguage}
            <SettingDescription>{translations.interfaceLanguageDesc}</SettingDescription>
          </SettingLabel>
          <LanguageSelect
            value={userSettings?.language || 'en'}
            onChange={(e) => onSettingChange('language', e.target.value)}
          >
            {languageOptions.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </LanguageSelect>
        </SettingGroup>

        {/* Translation Language */}
        <SettingGroup>
          <SettingLabel>
            {translations.translationLanguage}
            <SettingDescription>{translations.translationLanguageDesc}</SettingDescription>
          </SettingLabel>
          <LanguageSelect
            value={userSettings?.translationLanguage || 'ko'}
            onChange={(e) => onSettingChange('translationLanguage', e.target.value)}
          >
            {languageOptions.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </LanguageSelect>
        </SettingGroup>

        {/* TTS Speed */}
        <SettingGroup>
          <SettingLabel>
            {translations.ttsSpeed}
            <SettingDescription>Current: {userSettings?.ttsSpeed || 0.8}x</SettingDescription>
          </SettingLabel>
          <SpeedSlider
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={userSettings?.ttsSpeed || 0.8}
            onChange={(e) => onSettingChange('ttsSpeed', parseFloat(e.target.value))}
          />
        </SettingGroup>

        {/* Auto Save Words */}
        <SettingGroup>
          <ToggleContainer>
            <SettingLabel>
              {translations.autoSaveWords || 'Auto Save Words'}
              <SettingDescription>Automatically save clicked words</SettingDescription>
            </SettingLabel>
            <Toggle
              type="checkbox"
              checked={userSettings?.autoSaveWords !== false}
              onChange={(e) => onSettingChange('autoSaveWords', e.target.checked)}
            />
          </ToggleContainer>
        </SettingGroup>

        {/* Auto Play */}
        <SettingGroup>
          <ToggleContainer>
            <SettingLabel>
              {translations.autoPlay || 'Auto Play'}
              <SettingDescription>Auto play word pronunciation</SettingDescription>
            </SettingLabel>
            <Toggle
              type="checkbox"
              checked={userSettings?.autoPlay || false}
              onChange={(e) => onSettingChange('autoPlay', e.target.checked)}
            />
          </ToggleContainer>
        </SettingGroup>

        {/* Highlight Saved Words */}
        <SettingGroup>
          <ToggleContainer>
            <SettingLabel>
              {translations.highlightSavedWords || 'Highlight Saved Words'}
              <SettingDescription>Highlight saved words in articles</SettingDescription>
            </SettingLabel>
            <Toggle
              type="checkbox"
              checked={userSettings?.highlightSavedWords !== false}
              onChange={(e) => onSettingChange('highlightSavedWords', e.target.checked)}
            />
          </ToggleContainer>
        </SettingGroup>
      </SettingsGrid>
    </SettingsContainer>
  );
};

const SettingsContainer = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
`;

const SectionTitle = styled.h3`
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  font-weight: bold;
  color: #2d3748;
`;

const SaveMessage = styled.div`
  background: #d4edda;
  color: #155724;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
`;

const SettingsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const SettingGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ToggleContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const SettingLabel = styled.label`
  font-weight: 600;
  color: #2d3748;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const SettingDescription = styled.span`
  font-weight: normal;
  font-size: 0.85rem;
  color: #666;
`;

const LanguageSelect = styled.select`
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #1976d2;
  }
`;

const SpeedSlider = styled.input`
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e2e8f0;
  outline: none;
  
  &::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #1976d2;
    cursor: pointer;
  }
  
  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #1976d2;
    cursor: pointer;
    border: none;
  }
`;

const Toggle = styled.input`
  width: 50px;
  height: 25px;
  background: #ccc;
  border-radius: 25px;
  outline: none;
  cursor: pointer;
  appearance: none;
  position: relative;
  transition: background 0.3s ease;
  
  &:checked {
    background: #1976d2;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 21px;
    height: 21px;
    background: white;
    border-radius: 50%;
    transition: transform 0.3s ease;
  }
  
  &:checked::before {
    transform: translateX(25px);
  }
`;

export default ProfileSettings;