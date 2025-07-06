import React from 'react';
import styled from 'styled-components';
import { 
  Card, CardContent, Typography, Slider, FormControlLabel, Switch 
} from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';

const AudioSettings = ({ settings, onSettingChange }) => {
  return (
    <SettingsCard>
      <CardHeader>
        <VolumeUpIcon color="primary" />
        <Typography variant="h6" component="h2">
          Audio & TTS Settings
        </Typography>
      </CardHeader>
      
      <CardContent>
        <SettingsGrid>
          <SliderContainer>
            <Typography gutterBottom>
              TTS Speed: {settings.ttsSpeed}x
            </Typography>
            <Slider
              value={settings.ttsSpeed}
              onChange={(e, value) => onSettingChange('ttsSpeed', value)}
              min={0.5}
              max={2.0}
              step={0.1}
              marks={[
                { value: 0.5, label: '0.5x' },
                { value: 1.0, label: '1.0x' },
                { value: 1.5, label: '1.5x' },
                { value: 2.0, label: '2.0x' }
              ]}
              valueLabelDisplay="auto"
            />
          </SliderContainer>

          <SliderContainer>
            <Typography gutterBottom>
              TTS Pause: {settings.ttsPause}ms
            </Typography>
            <Slider
              value={settings.ttsPause}
              onChange={(e, value) => onSettingChange('ttsPause', value)}
              min={100}
              max={1000}
              step={50}
              marks={[
                { value: 100, label: '100ms' },
                { value: 300, label: '300ms' },
                { value: 500, label: '500ms' },
                { value: 1000, label: '1000ms' }
              ]}
              valueLabelDisplay="auto"
            />
          </SliderContainer>

          <FormControlLabel
            control={
              <Switch
                checked={settings.autoPlay}
                onChange={(e) => onSettingChange('autoPlay', e.target.checked)}
                color="primary"
              />
            }
            label="Auto-play word pronunciation"
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
  gap: 1.5rem;
`;

const SliderContainer = styled.div`
  padding: 0 1rem;
`;

export default AudioSettings;