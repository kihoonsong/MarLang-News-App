import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useEnhancedToast } from '../components/EnhancedToastProvider';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import PageContainer from '../components/PageContainer';

// Settings 컴포넌트들
import LanguageSettings from '../components/Settings/LanguageSettings';
import AudioSettings from '../components/Settings/AudioSettings';
import LearningSettings from '../components/Settings/LearningSettings';
import NotificationSettings from '../components/Settings/NotificationSettings';
import SecuritySettings from '../components/Settings/SecuritySettings';
import SettingsActions from '../components/Settings/SettingsActions';

const Settings = () => {
  const { user, isAuthenticated, changePassword } = useAuth() || {};
  const { userSettings, updateSettings } = useData();
  const toast = useEnhancedToast();

  const [localSettings, setLocalSettings] = useState({
    language: userSettings?.language || 'en',
    translationLanguage: userSettings?.translationLanguage || 'ko',
    ttsSpeed: userSettings?.ttsSpeed || 1.0,
    ttsPause: userSettings?.ttsPause || 200,
    notifications: userSettings?.notifications !== false,
    autoPlay: userSettings?.autoPlay || false,
    fontSize: userSettings?.fontSize || 'medium',
    readingGoal: userSettings?.readingGoal || 10,
    autoSaveWords: userSettings?.autoSaveWords !== false,
    showDifficulty: userSettings?.showDifficulty !== false,
    compactMode: userSettings?.compactMode || false
  });

  // userSettings 변경 시 localSettings 동기화
  useEffect(() => {
    if (userSettings) {
      setLocalSettings({
        language: userSettings.language || 'en',
        translationLanguage: userSettings.translationLanguage || 'ko',
        ttsSpeed: userSettings.ttsSpeed || 1.0,
        ttsPause: userSettings.ttsPause || 200,
        notifications: userSettings.notifications !== false,
        autoPlay: userSettings.autoPlay || false,
        fontSize: userSettings.fontSize || 'medium',
        readingGoal: userSettings.readingGoal || 10,
        autoSaveWords: userSettings.autoSaveWords !== false,
        showDifficulty: userSettings.showDifficulty !== false,
        compactMode: userSettings.compactMode || false
      });
    }
  }, [userSettings]);

  // 로그인 체크
  if (!isAuthenticated) {
    return (
      <>
        <MobileNavigation showBackButton={true} title="Settings" />
        <MobileContentWrapper>
          <PageContainer>
            <Alert severity="warning" sx={{ mt: 2 }}>
              Please log in to access settings.
            </Alert>
          </PageContainer>
        </MobileContentWrapper>
      </>
    );
  }

  const handleSettingChange = (key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = () => {
    updateSettings(localSettings);
    toast.success('Settings saved successfully!');
  };

  const resetSettings = () => {
    const defaultSettings = {
      language: 'en',
      translationLanguage: 'ko',
      ttsSpeed: 1.0,
      ttsPause: 200,
      notifications: true,
      autoPlay: false,
      fontSize: 'medium',
      readingGoal: 10,
      autoSaveWords: true,
      showDifficulty: true,
      compactMode: false
    };
    
    setLocalSettings(defaultSettings);
    updateSettings(defaultSettings);
    toast.info('Settings reset to defaults');
  };

  return (
    <>
      <MobileNavigation showBackButton={true} title="Settings" />
      <MobileContentWrapper>
        <PageContainer>
          <SettingsContainer>
            <LanguageSettings 
              settings={localSettings}
              onSettingChange={handleSettingChange}
            />
            
            <AudioSettings 
              settings={localSettings}
              onSettingChange={handleSettingChange}
            />
            
            <LearningSettings 
              settings={localSettings}
              onSettingChange={handleSettingChange}
            />
            
            <NotificationSettings 
              settings={localSettings}
              onSettingChange={handleSettingChange}
            />
            
            <SecuritySettings 
              user={user}
              onChangePassword={changePassword}
            />
            
            <SettingsActions 
              onSave={saveSettings}
              onReset={resetSettings}
            />
          </SettingsContainer>
        </PageContainer>
      </MobileContentWrapper>
    </>
  );
};

const SettingsContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
`;

export default Settings;