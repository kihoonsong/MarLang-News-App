import React from 'react';
import styled from 'styled-components';
import { Card, CardContent, Typography, FormControlLabel, Switch } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';

const NotificationSettings = ({ settings, onSettingChange }) => {
  return (
    <SettingsCard>
      <CardHeader>
        <NotificationsIcon color="primary" />
        <Typography variant="h6" component="h2">
          Notifications
        </Typography>
      </CardHeader>
      
      <CardContent>
        <SettingsGrid>
          <FormControlLabel
            control={
              <Switch
                checked={settings.notifications}
                onChange={(e) => onSettingChange('notifications', e.target.checked)}
                color="primary"
              />
            }
            label="Enable notifications"
          />
          
          <SettingDescription>
            Get notified about new articles, learning progress, and reminders
          </SettingDescription>
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

const SettingDescription = styled(Typography)`
  color: #666 !important;
  font-size: 0.875rem !important;
  margin-top: 0.5rem !important;
`;

export default NotificationSettings;