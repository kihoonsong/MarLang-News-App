import React from 'react';
import styled from 'styled-components';
import { Typography, Box, Chip, Avatar } from '@mui/material';

const HeaderContainer = styled(Box)`
  margin-bottom: 32px;
  text-align: center;
`;

const ArticleTitle = styled(Typography)`
  font-weight: 700;
  margin-bottom: 16px;
  line-height: 1.3;
  color: ${props => props.theme?.palette?.text?.primary || '#000000'};
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const MetaInfo = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    gap: 8px;
  }
`;

const CategoryChip = styled(Chip)`
  font-weight: 600;
  border-radius: 16px;
`;

const LevelChip = styled(Chip)`
  font-weight: 600;
  border-radius: 16px;
`;

const SourceInfo = styled(Box)`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${props => props.theme?.palette?.text?.secondary || '#666666'};
`;

const ArticleImage = styled.img`
  width: 100%;
  max-width: 600px;
  height: 300px;
  object-fit: cover;
  border-radius: 16px;
  margin: 20px auto;
  display: block;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  
  @media (max-width: 768px) {
    height: 200px;
    border-radius: 12px;
  }
`;

const getSummary = (article) => {
  return article.summary || article.description || '';
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
};

const getCategoryColor = (category) => {
  const colors = {
    'Technology': 'primary',
    'Science': 'success',
    'Business': 'warning',
    'Culture': 'secondary',
    'Sports': 'error',
    'Education': 'info'
  };
  return colors[category] || 'default';
};

const getLevelColor = (level) => {
  switch(level) {
    case 'Beginner': return 'success';
    case 'Intermediate': return 'warning';
    case 'Advanced': return 'error';
    default: return 'default';
  }
};

const ArticleHeader = ({ article, currentLevel }) => {
  if (!article) return null;

  const summary = getSummary(article);
  const publishedDate = formatDate(article.publishedAt);

  return (
    <HeaderContainer>
      <ArticleTitle variant="h4" component="h1">
        {article.title}
      </ArticleTitle>

      <MetaInfo>
        {article.category && (
          <CategoryChip
            label={article.category}
            color={getCategoryColor(article.category)}
            variant="filled"
            size="small"
          />
        )}
        
        {article.level && (
          <LevelChip
            label={article.level}
            color={getLevelColor(article.level)}
            variant="outlined"
            size="small"
          />
        )}

        {article.readingTime && (
          <Typography variant="body2" color="text.secondary">
            {article.readingTime} min read
          </Typography>
        )}

        {article.wordCount && (
          <Typography variant="body2" color="text.secondary">
            {article.wordCount} words
          </Typography>
        )}
      </MetaInfo>

      <SourceInfo>
        {article.source && (
          <>
            <Avatar 
              sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
              src={article.sourceImage}
            >
              {article.source.charAt(0)}
            </Avatar>
            <Typography variant="body2">
              {article.source}
            </Typography>
          </>
        )}
        
        {publishedDate && (
          <>
            <Typography variant="body2">•</Typography>
            <Typography variant="body2">
              {publishedDate}
            </Typography>
          </>
        )}
      </SourceInfo>

      {article.image && (
        <ArticleImage 
          src={article.image} 
          alt={article.title}
          loading="lazy"
        />
      )}

      {summary && (
        <Typography 
          variant="h6" 
          color="text.secondary" 
          sx={{ 
            fontStyle: 'italic', 
            lineHeight: 1.6, 
            mt: 2,
            fontSize: { xs: '1rem', md: '1.1rem' }
          }}
        >
          {summary}
        </Typography>
      )}
    </HeaderContainer>
  );
};

export default ArticleHeader;