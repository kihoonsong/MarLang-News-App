import React from 'react';
import styled from 'styled-components';
import { Paper, Typography, Box } from '@mui/material';

const AdCardContainer = styled(Paper)`
  padding: 1rem;
  border-radius: 12px;
  background-color: #f5f5f5;
  border: 1px dashed #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  min-height: 200px; /* ArticleCard와 유사한 높이 */
  box-sizing: border-box;
`;

const AdLabel = styled(Typography)`
  font-size: 0.75rem;
  color: #999;
  margin-bottom: 0.5rem;
  border: 1px solid #ddd;
  padding: 2px 8px;
  border-radius: 12px;
`;

const AdPlaceholderText = styled(Typography)`
  font-size: 1rem;
  color: #777;
  font-weight: 500;
`;

const AdCard = () => {
  return (
    <AdCardContainer variant="outlined">
      <AdLabel>Advertisement</AdLabel>
      <AdPlaceholderText>
        Ad content will be displayed here.
      </AdPlaceholderText>
    </AdCardContainer>
  );
};

export default AdCard;
