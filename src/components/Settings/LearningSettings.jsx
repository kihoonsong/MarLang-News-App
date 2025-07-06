import React from 'react';
import styled from 'styled-components';
import { 
  Card, CardContent, Typography, FormControlLabel, Switch, 
  TextField, FormControl, Select, MenuItem, InputLabel
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';

const LearningSettings = ({ settings, onSettingChange }) => {
  return (
    <SettingsCard>
      <CardHeader>
        <SettingsIcon color="primary" />
        <Typography variant="h6" component="h2">
          Learning Preferences
        </Typography>
      </CardHeader>
      
      <CardContent>
        <SettingsGrid>
          <FormControlLabel
            control={
              <Switch
                checked={settings.autoSaveWords}
                onChange={(e) => onSettingChange('autoSaveWords', e.target.checked)}
                color="primary"
              />
            }
            label="Auto-save clicked words"
          />

          <FormControlLabel
            control={
              <Switch
                checked={settings.showDifficulty}
                onChange={(e) => onSettingChange('showDifficulty', e.target.checked)}
                color="primary"
              />
            }
            label="Show difficulty indicators"
          />

          <TextField
            type="number"
            label="Daily Reading Goal (articles)"
            value={settings.readingGoal}
            onChange={(e) => onSettingChange('readingGoal', parseInt(e.target.value) || 10)}
            InputProps={{
              inputProps: { min: 1, max: 100 }
            }}
            fullWidth
            margin="normal"
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Font Size</InputLabel>
            <Select
              value={settings.fontSize}
              label="Font Size"
              onChange={(e) => onSettingChange('fontSize', e.target.value)}
            >
              <MenuItem value="small">Small</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="large">Large</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={settings.compactMode}
                onChange={(e) => onSettingChange('compactMode', e.target.checked)}
                color="primary"
              />
            }
            label="Compact mode (less spacing)"
          />
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

export default LearningSettings;