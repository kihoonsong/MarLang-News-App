import React from 'react';
import styled from 'styled-components';
import { Tabs, Tab, Box, Chip, Typography } from '@mui/material';

const LevelTabsContainer = styled(Box)`
  border-bottom: 1px solid ${props => props.theme.palette.divider};
  margin-bottom: 24px;
  background: ${props => props.theme.palette.background.paper};
  border-radius: 12px 12px 0 0;
  overflow: hidden;
`;

const StyledTabs = styled(Tabs)`
  & .MuiTabs-indicator {
    height: 3px;
    border-radius: 3px 3px 0 0;
  }
  
  & .MuiTab-root {
    text-transform: none;
    font-weight: 500;
    min-height: 64px;
    padding: 12px 24px;
    
    @media (max-width: 768px) {
      min-width: 0;
      padding: 12px 16px;
      font-size: 0.875rem;
    }
  }
`;

const TabContent = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const LevelChip = styled(Chip)`
  font-size: 0.75rem;
  height: 24px;
`;

const TabLabel = styled(Typography)`
  font-weight: 600;
  font-size: 0.9rem;
  
  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

const getLevelColor = (level) => {
  switch(level) {
    case 1: return 'success';
    case 2: return 'warning'; 
    case 3: return 'error';
    default: return 'default';
  }
};

const getLevelLabel = (level) => {
  switch(level) {
    case 1: return 'Beginner';
    case 2: return 'Intermediate';
    case 3: return 'Advanced';
    default: return 'Unknown';
  }
};

const LevelTabs = ({ 
  selectedLevel, 
  levels, 
  onLevelChange,
  isTTSPlaying 
}) => {
  const handleLevelChange = (event, newLevel) => {
    if (isTTSPlaying) {
      // TTS 재생 중일 때는 레벨 변경을 제한하거나 경고
      console.warn('TTS 재생 중에는 레벨을 변경할 수 없습니다');
      return;
    }
    
    onLevelChange(newLevel);
  };

  return (
    <LevelTabsContainer>
      <StyledTabs
        value={selectedLevel}
        onChange={handleLevelChange}
        variant="fullWidth"
        indicatorColor="primary"
        textColor="primary"
      >
        {Object.keys(levels).map((level) => {
          const levelNum = parseInt(level);
          const content = levels[level]?.content || '';
          const wordCount = content.split(/\s+/).filter(word => word.trim()).length;
          
          return (
            <Tab
              key={level}
              value={levelNum}
              label={
                <TabContent>
                  <TabLabel>
                    Level {level}
                  </TabLabel>
                  <LevelChip 
                    label={getLevelLabel(levelNum)}
                    color={getLevelColor(levelNum)}
                    size="small"
                    variant="outlined"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {wordCount} words
                  </Typography>
                </TabContent>
              }
              disabled={isTTSPlaying}
              sx={{
                opacity: isTTSPlaying && selectedLevel !== levelNum ? 0.5 : 1,
                transition: 'opacity 0.3s ease'
              }}
            />
          );
        })}
      </StyledTabs>
    </LevelTabsContainer>
  );
};

export default LevelTabs;