import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Card, CardContent, useMediaQuery, useTheme, 
  Button, Grid, TextField, FormControl, InputLabel, Select, Switch, FormControlLabel,
  Chip, Divider, Paper, Alert, Snackbar, MenuItem
} from '@mui/material';
import { 
  AccountCircle, Edit, MenuBook, Favorite, Save, PhotoCamera,
  Person, CalendarToday, Language, Speed, VolumeUp, Notifications, Security, History
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import AuthGuard from '../components/AuthGuard';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import PageContainer from '../components/PageContainer';

const Profile = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, isAuthenticated } = useAuth() || {};
  const { userSettings, updateUserSettings, savedWords, likedArticles, viewHistory } = useData();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedSettings, setEditedSettings] = useState(userSettings);
  const [showSuccess, setShowSuccess] = useState(false);

  // 사용자 설정이 변경될 때 편집 상태 업데이트
  useEffect(() => {
    setEditedSettings(userSettings);
  }, [userSettings]);

  // 로그인하지 않은 경우
  if (!isAuthenticated) {
    return (
      <AuthGuard feature="your profile">
        <MobileNavigation />
        <MobileContentWrapper>
          <PageContainer>
            <EmptyAuthState>
              <EmptyIcon>👤</EmptyIcon>
              <EmptyText>Please sign in to view your profile</EmptyText>
              <EmptySubtext>Track your learning progress and manage your account!</EmptySubtext>
            </EmptyAuthState>
          </PageContainer>
        </MobileContentWrapper>
      </AuthGuard>
    );
  }

  const handleSaveSettings = () => {
    updateUserSettings(editedSettings);
    setIsEditing(false);
    setShowSuccess(true);
  };

  const handleCancelEdit = () => {
    setEditedSettings(userSettings);
    setIsEditing(false);
  };

  const handleSettingChange = (key, value) => {
    setEditedSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <>
      <MobileNavigation />
      <MobileContentWrapper>
        <PageContainer>
          <ContentHeader>
            <PageTitle>👤 My Profile</PageTitle>
            <EditButton 
              variant={isEditing ? "outlined" : "contained"}
              onClick={() => setIsEditing(!isEditing)}
              startIcon={<Edit />}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </EditButton>
          </ContentHeader>

          <Grid container spacing={3}>
            {/* 프로필 정보 카드 */}
            <Grid item xs={12} md={4}>
              <ProfileCard>
                <CardContent>
                  <ProfileSection>
                    <ProfileImageSection>
                      {user?.picture ? (
                        <ProfileAvatar src={user.picture} alt={user.name} />
                      ) : (
                        <DefaultAvatar>
                          <AccountCircle sx={{ fontSize: 60 }} />
                        </DefaultAvatar>
                      )}
                      {isEditing && (
                        <ImageUploadButton size="small">
                          <PhotoCamera />
                        </ImageUploadButton>
                      )}
                    </ProfileImageSection>

                    <ProfileInfo>
                      {isEditing ? (
                        <TextField
                          fullWidth
                          label="Nickname"
                          value={editedSettings.nickname || ''}
                          onChange={(e) => handleSettingChange('nickname', e.target.value)}
                          margin="normal"
                          size="small"
                        />
                      ) : (
                        <UserName>{editedSettings.nickname || user?.name || 'User'}</UserName>
                      )}
                      <UserEmail>{user?.email}</UserEmail>
                      
                      {isEditing ? (
                        <>
                          <TextField
                            fullWidth
                            label="Birth Date"
                            type="date"
                            value={editedSettings.birthDate || ''}
                            onChange={(e) => handleSettingChange('birthDate', e.target.value)}
                            margin="normal"
                            size="small"
                            InputLabelProps={{ shrink: true }}
                          />
                          <FormControl fullWidth margin="normal" size="small">
                            <InputLabel>Gender</InputLabel>
                            <Select
                              value={editedSettings.gender || ''}
                              onChange={(e) => handleSettingChange('gender', e.target.value)}
                              label="Gender"
                            >
                              <MenuItem value="male">Male</MenuItem>
                              <MenuItem value="female">Female</MenuItem>
                              <MenuItem value="other">Other</MenuItem>
                              <MenuItem value="prefer-not-to-say">Prefer not to say</MenuItem>
                            </Select>
                          </FormControl>
                          <TextField
                            fullWidth
                            label="Bio"
                            multiline
                            rows={3}
                            value={editedSettings.bio || ''}
                            onChange={(e) => handleSettingChange('bio', e.target.value)}
                            margin="normal"
                            size="small"
                          />
                        </>
                      ) : (
                        <>
                          {editedSettings.birthDate && (
                            <UserInfo>
                              <CalendarToday sx={{ fontSize: 16, mr: 1 }} />
                              Born {new Date(editedSettings.birthDate).toLocaleDateString()}
                            </UserInfo>
                          )}
                          {editedSettings.bio && (
                            <UserBio>{editedSettings.bio}</UserBio>
                          )}
                        </>
                      )}
                    </ProfileInfo>
                  </ProfileSection>

                  {isEditing && (
                    <ActionButtons>
                      <Button
                        variant="contained"
                        onClick={handleSaveSettings}
                        startIcon={<Save />}
                        fullWidth
                        sx={{ mb: 1 }}
                      >
                        Save Changes
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={handleCancelEdit}
                        fullWidth
                      >
                        Cancel
                      </Button>
                    </ActionButtons>
                  )}
                </CardContent>
              </ProfileCard>
            </Grid>

            {/* 학습 설정 카드 */}
            <Grid item xs={12} md={4}>
              <SettingsCard>
                <CardContent>
                  <SectionTitle>
                    <Language sx={{ mr: 1 }} />
                    Learning Settings
                  </SectionTitle>

                  <SettingItem>
                    <FormControl fullWidth size="small">
                      <InputLabel>Preferred Language</InputLabel>
                      <Select
                        value={isEditing ? editedSettings.preferredLanguage || 'en' : userSettings.preferredLanguage || 'en'}
                        onChange={(e) => handleSettingChange('preferredLanguage', e.target.value)}
                        label="Preferred Language"
                        disabled={!isEditing}
                      >
                        <MenuItem value="en">English</MenuItem>
                        <MenuItem value="ko">한국어</MenuItem>
                        <MenuItem value="ja">日本語</MenuItem>
                        <MenuItem value="zh">中文</MenuItem>
                      </Select>
                    </FormControl>
                  </SettingItem>

                  <SettingItem>
                    <FormControl fullWidth size="small">
                      <InputLabel>Reading Level</InputLabel>
                      <Select
                        value={isEditing ? editedSettings.readingLevel || 'intermediate' : userSettings.readingLevel || 'intermediate'}
                        onChange={(e) => handleSettingChange('readingLevel', e.target.value)}
                        label="Reading Level"
                        disabled={!isEditing}
                      >
                        <MenuItem value="beginner">Beginner</MenuItem>
                        <MenuItem value="intermediate">Intermediate</MenuItem>
                        <MenuItem value="advanced">Advanced</MenuItem>
                      </Select>
                    </FormControl>
                  </SettingItem>

                  <SettingItem>
                    <SettingLabel>
                      <Speed sx={{ mr: 1 }} />
                      TTS Speed: {(isEditing ? editedSettings.ttsSpeed : userSettings.ttsSpeed) || 1.0}x
                    </SettingLabel>
                    <SliderContainer>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={(isEditing ? editedSettings.ttsSpeed : userSettings.ttsSpeed) || 1.0}
                        onChange={(e) => handleSettingChange('ttsSpeed', parseFloat(e.target.value))}
                        disabled={!isEditing}
                      />
                    </SliderContainer>
                  </SettingItem>

                  <SettingItem>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={(isEditing ? editedSettings.autoTTS : userSettings.autoTTS) || false}
                          onChange={(e) => handleSettingChange('autoTTS', e.target.checked)}
                          disabled={!isEditing}
                        />
                      }
                      label="Auto TTS"
                    />
                  </SettingItem>

                  <SettingItem>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={(isEditing ? editedSettings.notifications : userSettings.notifications) || false}
                          onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                          disabled={!isEditing}
                        />
                      }
                      label="Notifications"
                    />
                  </SettingItem>
                </CardContent>
              </SettingsCard>
            </Grid>

            {/* 학습 통계 카드 */}
            <Grid item xs={12} md={4}>
              <StatsCard>
                <CardContent>
                  <SectionTitle>
                    <History sx={{ mr: 1 }} />
                    Learning Stats
                  </SectionTitle>

                  <StatItem>
                    <StatIcon><MenuBook /></StatIcon>
                    <StatContent>
                      <StatNumber>{savedWords?.length || 0}</StatNumber>
                      <StatLabel>Saved Words</StatLabel>
                    </StatContent>
                  </StatItem>

                  <StatItem>
                    <StatIcon><Favorite color="error" /></StatIcon>
                    <StatContent>
                      <StatNumber>{likedArticles?.length || 0}</StatNumber>
                      <StatLabel>Liked Articles</StatLabel>
                    </StatContent>
                  </StatItem>

                  <StatItem>
                    <StatIcon><History /></StatIcon>
                    <StatContent>
                      <StatNumber>{viewHistory?.length || 0}</StatNumber>
                      <StatLabel>Articles Read</StatLabel>
                    </StatContent>
                  </StatItem>

                  <StatItem>
                    <StatIcon><CalendarToday /></StatIcon>
                    <StatContent>
                      <StatNumber>{calculateActiveDays()}</StatNumber>
                      <StatLabel>Active Days</StatLabel>
                    </StatContent>
                  </StatItem>
                </CardContent>
              </StatsCard>
            </Grid>
          </Grid>

          {/* 성공 메시지 */}
          <Snackbar
            open={showSuccess}
            autoHideDuration={3000}
            onClose={() => setShowSuccess(false)}
          >
            <Alert severity="success" onClose={() => setShowSuccess(false)}>
              Profile updated successfully!
            </Alert>
          </Snackbar>
        </PageContainer>
      </MobileContentWrapper>
    </>
  );

  function calculateActiveDays() {
    if (!viewHistory || viewHistory.length === 0) return 0;
    
    const dates = new Set();
    viewHistory.forEach(record => {
      const date = new Date(record.viewedAt).toDateString();
      dates.add(date);
    });
    
    return dates.size;
  }
};

// 스타일드 컴포넌트들
const ContentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const PageTitle = styled.h1`
  font-size: 1.8rem;
  font-weight: bold;
  color: #1976d2;
  margin: 0;
`;

const EditButton = styled(Button)`
  && {
    min-width: 120px;
  }
`;

const ProfileCard = styled(Card)`
  && {
    height: fit-content;
  }
`;

const SettingsCard = styled(Card)`
  && {
    height: fit-content;
  }
`;

const StatsCard = styled(Card)`
  && {
    height: fit-content;
  }
`;

const ProfileSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const ProfileImageSection = styled.div`
  position: relative;
  margin-bottom: 1rem;
`;

const ProfileAvatar = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #e3f2fd;
`;

const DefaultAvatar = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: #f5f5f5;
  border: 4px solid #e3f2fd;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1976d2;
`;

const ImageUploadButton = styled(Button)`
  && {
    position: absolute;
    bottom: 0;
    right: 0;
    min-width: 36px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #1976d2;
    color: white;
    
    &:hover {
      background: #1565c0;
    }
  }
`;

const ProfileInfo = styled.div`
  width: 100%;
`;

const UserName = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  margin: 0 0 0.5rem 0;
`;

const UserEmail = styled.p`
  font-size: 1rem;
  color: #666;
  margin: 0 0 1rem 0;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  color: #666;
  margin: 0.5rem 0;
`;

const UserBio = styled.p`
  font-size: 0.9rem;
  color: #555;
  line-height: 1.5;
  margin: 1rem 0;
`;

const ActionButtons = styled.div`
  margin-top: 1.5rem;
`;

const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
  margin: 0 0 1.5rem 0;
`;

const SettingItem = styled.div`
  margin-bottom: 1.5rem;
`;

const SettingLabel = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
  margin-bottom: 0.5rem;
`;

const SliderContainer = styled.div`
  input[type="range"] {
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: #e0e0e0;
    outline: none;
    
    &::-webkit-slider-thumb {
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #1976d2;
      cursor: pointer;
    }
    
    &::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #1976d2;
      cursor: pointer;
      border: none;
    }
  }
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
`;

const StatIcon = styled.div`
  margin-right: 1rem;
  color: #1976d2;
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatNumber = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
`;

const EmptyAuthState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rem 2rem;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const EmptyText = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.5rem 0;
`;

const EmptySubtext = styled.p`
  font-size: 1rem;
  color: #666;
  margin: 0;
  max-width: 400px;
`;

export default Profile; 