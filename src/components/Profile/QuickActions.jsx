import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const QuickActions = ({ translations, isAdmin }) => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: '📚',
      label: translations.viewWordbook,
      path: '/wordbook',
      color: '#1976d2'
    },
    {
      icon: '❤️',
      label: translations.viewLikedArticles,
      path: '/like',
      color: '#d32f2f'
    },
    ...(isAdmin ? [{
      icon: '🔧',
      label: translations.adminDashboard,
      path: '/dashboard',
      color: '#ed6c02'
    }] : [])
  ];

  return (
    <ActionsContainer>
      <SectionTitle>{translations.quickActions}</SectionTitle>
      <ActionsGrid>
        {actions.map((action, index) => (
          <ActionCard 
            key={index}
            onClick={() => navigate(action.path)}
            $color={action.color}
          >
            <ActionIcon>{action.icon}</ActionIcon>
            <ActionLabel>{action.label}</ActionLabel>
          </ActionCard>
        ))}
      </ActionsGrid>
    </ActionsContainer>
  );
};

const ActionsContainer = styled.div`
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

const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const ActionCard = styled.button`
  background: white;
  border: 2px solid ${props => props.$color || '#1976d2'};
  color: ${props => props.$color || '#1976d2'};
  padding: 1.5rem;
  border-radius: 12px;
  cursor: pointer;
  text-align: center;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: ${props => props.$color || '#1976d2'};
    color: white;
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
`;

const ActionIcon = styled.div`
  font-size: 2rem;
`;

const ActionLabel = styled.div`
  font-weight: 600;
  font-size: 0.9rem;
`;

export default QuickActions;