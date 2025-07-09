import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const RecentActivity = ({ recentWords, recentArticles, translations: _translations, formatTimeAgo }) => {
  const navigate = useNavigate();

  return (
    <ActivityContainer>
      <ActivitySection>
        <SectionHeader>
          <SectionTitle>📚 Recent Words</SectionTitle>
          <ViewAllButton onClick={() => navigate('/wordbook')}>
            View All
          </ViewAllButton>
        </SectionHeader>
        {recentWords.length > 0 ? (
          <ItemsList>
            {recentWords.map((word, index) => (
              <WordItem key={index}>
                <WordText>
                  <strong>{word.word}</strong>
                  <WordDefinition>{word.definition}</WordDefinition>
                </WordText>
                <TimeStamp>{formatTimeAgo(word.addedAt)}</TimeStamp>
              </WordItem>
            ))}
          </ItemsList>
        ) : (
          <EmptyState>No saved words yet</EmptyState>
        )}
      </ActivitySection>

      <ActivitySection>
        <SectionHeader>
          <SectionTitle>❤️ Recent Likes</SectionTitle>
          <ViewAllButton onClick={() => navigate('/like')}>
            View All
          </ViewAllButton>
        </SectionHeader>
        {recentArticles.length > 0 ? (
          <ItemsList>
            {recentArticles.map((article, index) => (
              <ArticleItem 
                key={index}
                onClick={() => navigate(`/articles/${article.id}`)}
              >
                <ArticleText>
                  <strong>{article.title}</strong>
                  <ArticleCategory>{article.category}</ArticleCategory>
                </ArticleText>
                <TimeStamp>{formatTimeAgo(article.likedAt)}</TimeStamp>
              </ArticleItem>
            ))}
          </ItemsList>
        ) : (
          <EmptyState>No liked articles yet</EmptyState>
        )}
      </ActivitySection>
    </ActivityContainer>
  );
};

const ActivityContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
`;

const ActivitySection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: bold;
  color: #2d3748;
`;

const ViewAllButton = styled.button`
  background: none;
  border: none;
  color: #1976d2;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ItemsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const WordItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
`;

const ArticleItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
  
  &:hover {
    background: #e9ecef;
  }
`;

const WordText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
`;

const ArticleText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
`;

const WordDefinition = styled.span`
  font-size: 0.85rem;
  color: #666;
`;

const ArticleCategory = styled.span`
  font-size: 0.8rem;
  color: #1976d2;
  font-weight: 500;
`;

const TimeStamp = styled.span`
  font-size: 0.8rem;
  color: #999;
  white-space: nowrap;
`;

const EmptyState = styled.div`
  text-align: center;
  color: #999;
  font-style: italic;
  padding: 2rem;
`;

export default RecentActivity;