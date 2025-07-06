import React from 'react';
import styled from 'styled-components';

const LearningStats = ({ stats, translations }) => {
  return (
    <StatsContainer>
      <SectionTitle>{translations.learningStats}</SectionTitle>
      <StatsGrid>
        <StatCard>
          <StatIcon>📚</StatIcon>
          <StatValue>{stats.totalWords}</StatValue>
          <StatLabel>{translations.savedWords}</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatIcon>❤️</StatIcon>
          <StatValue>{stats.totalLikedArticles}</StatValue>
          <StatLabel>{translations.likedArticles}</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatIcon>🔥</StatIcon>
          <StatValue>{stats.wordsThisWeek}</StatValue>
          <StatLabel>{translations.thisWeekWords}</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatIcon>🏆</StatIcon>
          <StatValue>{stats.favoriteCategory.name || 'None'}</StatValue>
          <StatLabel>Favorite Category</StatLabel>
        </StatCard>
      </StatsGrid>
    </StatsContainer>
  );
};

const StatsContainer = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
`;

const SectionTitle = styled.h3`
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  font-weight: bold;
  color: #2d3748;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const StatCard = styled.div`
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateY(-4px);
  }
`;

const StatIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #1976d2;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
`;

export default LearningStats;