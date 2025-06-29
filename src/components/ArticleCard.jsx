import React from 'react';
import styled from 'styled-components';
import { Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const ArticleCard = ({ 
  id, 
  image, 
  title, 
  summary, 
  category, 
  publishedAt,
  onClick
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    console.log('Card clicked, id:', id);
    if (onClick) {
      onClick();
    } else {
      console.log('Navigating to:', `/article/${id}`);
      navigate(`/article/${id}`);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <CardContainer onClick={handleClick}>
      <CardImage 
        src={image} 
        alt={title}
        onError={(e) => {
          e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80';
        }}
      />
      <CardContent>
        <CardHeader>
          <CategoryChip>{category}</CategoryChip>
          <PublishDate>{formatDate(publishedAt)}</PublishDate>
        </CardHeader>
        
        <CardTitle>{title}</CardTitle>
        
        {summary && (
          <CardSummary>
            {summary.length > 100 ? `${summary.substring(0, 100)}...` : summary}
          </CardSummary>
        )}
      </CardContent>
    </CardContainer>
  );
};

const CardContainer = styled.div`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
  cursor: pointer;
  width: 320px;
  height: 360px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0,0,0,0.12);
  }
`;

const CardImage = styled.img`
  width: 100%;
  height: 180px;
  object-fit: cover;
`;

const CardContent = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const CategoryChip = styled.span`
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const PublishDate = styled.span`
  font-size: 0.75rem;
  color: #666;
`;

const CardTitle = styled.h3`
  font-size: 1rem;
  font-weight: bold;
  margin: 0 0 0.75rem 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: #333;
`;

const CardSummary = styled.p`
  font-size: 0.875rem;
  color: #666;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export default ArticleCard; 