import React from 'react';
import styled from 'styled-components';
import { Card, CardContent, Button, Box } from '@mui/material';

const SettingsActions = ({ onSave, onReset }) => {
  return (
    <ActionsCard>
      <CardContent>
        <ButtonContainer>
          <SaveButton
            variant="contained"
            onClick={onSave}
            size="large"
          >
            Save Settings
          </SaveButton>
          
          <ResetButton
            variant="outlined"
            onClick={onReset}
            size="large"
          >
            Reset to Defaults
          </ResetButton>
        </ButtonContainer>
      </CardContent>
    </ActionsCard>
  );
};

const ActionsCard = styled(Card)`
  margin-top: 2rem;
  border-radius: 16px !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08) !important;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
`;

const ButtonContainer = styled(Box)`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const SaveButton = styled(Button)`
  background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%) !important;
  color: white !important;
  padding: 0.75rem 2rem !important;
  border-radius: 12px !important;
  font-weight: 600 !important;
  text-transform: none !important;
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3) !important;
  
  &:hover {
    background: linear-gradient(135deg, #1565c0 0%, #1976d2 100%) !important;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(25, 118, 210, 0.4) !important;
  }
`;

const ResetButton = styled(Button)`
  border: 2px solid #dc3545 !important;
  color: #dc3545 !important;
  padding: 0.75rem 2rem !important;
  border-radius: 12px !important;
  font-weight: 600 !important;
  text-transform: none !important;
  
  &:hover {
    background: #dc3545 !important;
    color: white !important;
    transform: translateY(-2px);
  }
`;

export default SettingsActions;