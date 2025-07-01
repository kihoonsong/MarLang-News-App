import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  AppBar, Toolbar, Typography, IconButton, Box, Card, CardContent,
  Switch, FormControlLabel, Select, MenuItem, FormControl, InputLabel,
  Slider, Button, Divider, Alert, useMediaQuery, useTheme, TextField,
  InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LanguageIcon from '@mui/icons-material/Language';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import PaletteIcon from '@mui/icons-material/Palette';
import SecurityIcon from '@mui/icons-material/Security';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useEnhancedToast } from '../components/EnhancedToastProvider';
import { getSupportedLanguages } from '../utils/dictionaryApi';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import PageContainer from '../components/PageContainer';

const Settings = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, changePassword } = useAuth() || {};
  const { userSettings, updateSettings } = useData();
  const toast = useEnhancedToast();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [localSettings, setLocalSettings] = useState({
    language: userSettings.language || 'en',
    translationLanguage: userSettings.translationLanguage || 'ko',
    ttsSpeed: userSettings.ttsSpeed || 1.0,
    notifications: userSettings.notifications !== false,
    autoPlay: userSettings.autoPlay || false,
    fontSize: userSettings.fontSize || 'medium',
    readingGoal: userSettings.readingGoal || 10,
    autoSaveWords: userSettings.autoSaveWords !== false,
    showDifficulty: userSettings.showDifficulty !== false,
    compactMode: userSettings.compactMode || false
  });

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

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

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('새 비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast.success('비밀번호가 성공적으로 변경되었습니다.');
      setPasswordModalOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.message || '비밀번호 변경에 실패했습니다.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePasswordModalClose = () => {
    setPasswordModalOpen(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswords({ current: false, new: false, confirm: false });
  };



  if (!isAuthenticated) {
    return (
      <>
        <MobileNavigation />
        <MobileContentWrapper>
          <Container>
            <Alert severity="warning" sx={{ mt: 4 }}>
              Please log in to access settings.
            </Alert>
          </Container>
        </MobileContentWrapper>
      </>
    );
  }

  return (
    <>
      {/* <MobileNavigation /> */}
      <MobileContentWrapper>
        {/* 상단바 - 데스크톱만 표시 */}
        {!isMobile && (
          <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <IconButton color="inherit" onClick={() => navigate(-1)}>
              <ArrowBackIcon />
            </IconButton>
            <SettingsIcon sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              Settings
            </Typography>
          </Toolbar>
        </AppBar>
        )}

        {/* Home 페이지 카테고리 탭과 동일한 높이 유지 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, height: '48px' }}>
        </Box>

        <PageContainer>
          <Header>
            <Title>⚙️ Settings</Title>
            <HeaderActions>
              <Button variant="contained" onClick={saveSettings}>
                Save Changes
              </Button>
            </HeaderActions>
          </Header>

          {/* 보안 설정 */}
          {user?.provider === 'email' && (
            <SettingsSection>
              <SectionHeader>
                <SecurityIcon sx={{ mr: 1, color: '#1976d2' }} />
                <Typography variant="h6">Security</Typography>
              </SectionHeader>
              
              <SettingsCard>
                <CardContent>
                  <SettingRow>
                    <SettingLabel>
                      <Typography variant="subtitle1">Password</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Change your account password
                      </Typography>
                    </SettingLabel>
                    <Button
                      variant="outlined"
                      startIcon={<LockIcon />}
                      onClick={() => setPasswordModalOpen(true)}
                    >
                      Change Password
                    </Button>
                  </SettingRow>
                </CardContent>
              </SettingsCard>
            </SettingsSection>
          )}

          {/* 언어 및 번역 설정 */}
          <SettingsSection>
            <SectionHeader>
              <LanguageIcon sx={{ mr: 1, color: '#1976d2' }} />
              <Typography variant="h6">Language & Translation</Typography>
            </SectionHeader>
            
            <SettingsCard>
              <CardContent>
                <SettingRow>
                  <SettingLabel>
                    <Typography variant="subtitle1">Interface Language</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Language for app interface
                    </Typography>
                  </SettingLabel>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <Select
                      value={localSettings.language}
                      onChange={(e) => handleSettingChange('language', e.target.value)}
                    >
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="ko">한국어</MenuItem>
                      <MenuItem value="ja">日本語</MenuItem>
                    </Select>
                  </FormControl>
                </SettingRow>

                <SettingRow>
                  <SettingLabel>
                    <Typography variant="subtitle1">Translation Language</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Language for word definitions
                    </Typography>
                  </SettingLabel>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <Select
                      value={localSettings.translationLanguage}
                      onChange={(e) => handleSettingChange('translationLanguage', e.target.value)}
                    >
                      {getSupportedLanguages().map((lang) => (
                        <MenuItem key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </SettingRow>
              </CardContent>
            </SettingsCard>
          </SettingsSection>

          {/* 읽기 및 음성 설정 */}
          <SettingsSection>
            <SectionHeader>
              <VolumeUpIcon sx={{ mr: 1, color: '#1976d2' }} />
              <Typography variant="h6">Reading & Audio</Typography>
            </SectionHeader>
            
            <SettingsCard>
              <CardContent>
                <SettingRow>
                  <SettingLabel>
                    <Typography variant="subtitle1">TTS Speed</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Text-to-speech reading speed
                    </Typography>
                  </SettingLabel>
                  <SliderContainer>
                    <Slider
                      value={localSettings.ttsSpeed}
                      onChange={(_, value) => handleSettingChange('ttsSpeed', value)}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                      marks={[
                        { value: 0.5, label: 'Slow' },
                        { value: 1.0, label: 'Normal' },
                        { value: 2.0, label: 'Fast' }
                      ]}
                      sx={{ width: 200 }}
                    />
                  </SliderContainer>
                </SettingRow>

                <SettingRow>
                  <SettingLabel>
                    <Typography variant="subtitle1">Auto Play Audio</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Automatically play word pronunciation
                    </Typography>
                  </SettingLabel>
                  <Switch
                    checked={localSettings.autoPlay}
                    onChange={(e) => handleSettingChange('autoPlay', e.target.checked)}
                  />
                </SettingRow>

                <SettingRow>
                  <SettingLabel>
                    <Typography variant="subtitle1">Font Size</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Article text size
                    </Typography>
                  </SettingLabel>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={localSettings.fontSize}
                      onChange={(e) => handleSettingChange('fontSize', e.target.value)}
                    >
                      <MenuItem value="small">Small</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="large">Large</MenuItem>
                    </Select>
                  </FormControl>
                </SettingRow>
              </CardContent>
            </SettingsCard>
          </SettingsSection>

          {/* 학습 설정 */}
          <SettingsSection>
            <SectionHeader>
              <NotificationsIcon sx={{ mr: 1, color: '#1976d2' }} />
              <Typography variant="h6">Learning Preferences</Typography>
            </SectionHeader>
            
            <SettingsCard>
              <CardContent>
                <SettingRow>
                  <SettingLabel>
                    <Typography variant="subtitle1">Daily Reading Goal</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Number of articles to read per day
                    </Typography>
                  </SettingLabel>
                  <SliderContainer>
                    <Slider
                      value={localSettings.readingGoal}
                      onChange={(_, value) => handleSettingChange('readingGoal', value)}
                      min={1}
                      max={20}
                      step={1}
                      marks={[
                        { value: 1, label: '1' },
                        { value: 10, label: '10' },
                        { value: 20, label: '20' }
                      ]}
                      sx={{ width: 200 }}
                      valueLabelDisplay="on"
                    />
                  </SliderContainer>
                </SettingRow>

                <SettingRow>
                  <SettingLabel>
                    <Typography variant="subtitle1">Auto-save Words</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Automatically save clicked words
                    </Typography>
                  </SettingLabel>
                  <Switch
                    checked={localSettings.autoSaveWords}
                    onChange={(e) => handleSettingChange('autoSaveWords', e.target.checked)}
                  />
                </SettingRow>

                <SettingRow>
                  <SettingLabel>
                    <Typography variant="subtitle1">Show Difficulty Levels</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Display article difficulty badges
                    </Typography>
                  </SettingLabel>
                  <Switch
                    checked={localSettings.showDifficulty}
                    onChange={(e) => handleSettingChange('showDifficulty', e.target.checked)}
                  />
                </SettingRow>

                <SettingRow>
                  <SettingLabel>
                    <Typography variant="subtitle1">Notifications</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Enable learning reminders
                    </Typography>
                  </SettingLabel>
                  <Switch
                    checked={localSettings.notifications}
                    onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                  />
                </SettingRow>
              </CardContent>
            </SettingsCard>
          </SettingsSection>

          {/* 표시 설정 */}
          <SettingsSection>
            <SectionHeader>
              <PaletteIcon sx={{ mr: 1, color: '#1976d2' }} />
              <Typography variant="h6">Display</Typography>
            </SectionHeader>
            
            <SettingsCard>
              <CardContent>
                <SettingRow>
                  <SettingLabel>
                    <Typography variant="subtitle1">Compact Mode</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Show more content in less space
                    </Typography>
                  </SettingLabel>
                  <Switch
                    checked={localSettings.compactMode}
                    onChange={(e) => handleSettingChange('compactMode', e.target.checked)}
                  />
                </SettingRow>
              </CardContent>
            </SettingsCard>
          </SettingsSection>



          {/* 정보 섹션 */}
          <SettingsSection>
            <SectionHeader>
              <SecurityIcon sx={{ mr: 1, color: '#1976d2' }} />
              <Typography variant="h6">About</Typography>
            </SectionHeader>
            
            <SettingsCard>
              <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Version:</strong> 1.0.0
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>User:</strong> {user?.name || 'Guest'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Build:</strong> {new Date().toLocaleDateString()}
                </Typography>
              </CardContent>
            </SettingsCard>
          </SettingsSection>
        </PageContainer>

        {/* 비밀번호 변경 모달 */}
        <Dialog
          open={passwordModalOpen}
          onClose={handlePasswordModalClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LockIcon sx={{ mr: 1 }} />
              비밀번호 변경
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="현재 비밀번호"
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                        edge="end"
                      >
                        {showPasswords.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ mb: 2 }}
                required
              />

              <TextField
                fullWidth
                label="새 비밀번호"
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                        edge="end"
                      >
                        {showPasswords.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                helperText="8자 이상, 영문/숫자/특수문자 포함"
                sx={{ mb: 2 }}
                required
              />

              <TextField
                fullWidth
                label="새 비밀번호 확인"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                        edge="end"
                      >
                        {showPasswords.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                error={passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword}
                helperText={passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword ? '비밀번호가 일치하지 않습니다' : ''}
                required
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handlePasswordModalClose}>
              취소
            </Button>
            <Button
              onClick={handlePasswordChange}
              variant="contained"
              disabled={passwordLoading || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
            >
              {passwordLoading ? <CircularProgress size={20} /> : '변경'}
            </Button>
          </DialogActions>
        </Dialog>
      </MobileContentWrapper>
    </>
  );
};

const Container = styled.div`
  padding: 0 1rem 2rem 1rem;
  
  
  @media (min-width: 768px) {
    padding: 0 4rem 2rem 4rem;
  }
  
  @media (min-width: 1200px) {
    padding: 0 8rem 2rem 8rem;
  }
  
  @media (min-width: 1600px) {
    padding: 0 12rem 2rem 12rem;
  }
  
  @media (min-width: 2000px) {
    padding: 0 16rem 2rem 16rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const Title = styled.h1`
  font-size: 1.8rem;
  font-weight: bold;
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
`;

const SettingsSection = styled.div`
  margin-bottom: 2rem;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
`;

const SettingsCard = styled(Card)`
  border-radius: 12px !important;
`;

const SettingRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  
  &:not(:last-child) {
    border-bottom: 1px solid #f0f0f0;
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const SettingLabel = styled.div`
  flex: 1;
`;

const SliderContainer = styled.div`
  width: 200px;
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

  

export default Settings;