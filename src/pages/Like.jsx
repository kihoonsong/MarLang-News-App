import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  useMediaQuery, useTheme, Button, Select, FormControl, InputLabel, MenuItem
} from '@mui/material';
import SortIcon from '@mui/icons-material/Sort';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useArticles } from '../contexts/ArticlesContext';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import PageContainer from '../components/PageContainer';
import ArticleCard from '../components/ArticleCard';

const Like = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, isAuthenticated } = useAuth() || {};
  const { likedArticles } = useData();
  const { getArticleById } = useArticles();
  
  const [sortBy, setSortBy] = useState('dateLiked');

  // 좋아요한 기사 ID들로부터 실제 기사 데이터 가져오기
  const getLikedArticlesData = () => {
    if (!likedArticles || likedArticles.length === 0) return [];
    
    return likedArticles.map(likedItem => {
      const article = getArticleById(likedItem.articleId);
      if (article) {
        return {
          ...article,
          likedAt: likedItem.likedAt
        };
      }
      return null;
    }).filter(Boolean);
  };

  // 정렬된 기사 목록 가져오기
  const getSortedArticles = () => {
    const articles = getLikedArticlesData();
    
    switch (sortBy) {
      case 'dateLiked':
        return articles.sort((a, b) => new Date(b.likedAt) - new Date(a.likedAt));
      case 'publishedDate':
        return articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      case 'title':
        return articles.sort((a, b) => a.title.localeCompare(b.title));
      case 'category':
        return articles.sort((a, b) => a.category.localeCompare(b.category));
      default:
        return articles;
    }
  };

  const sortedArticles = getSortedArticles();

  // 로그인하지 않은 경우
  if (!isAuthenticated) {
    return (
      <>
        <MobileNavigation />
        <MobileContentWrapper>
          <PageContainer>
            <EmptyAuthState>
              <EmptyIcon>❤️</EmptyIcon>
              <EmptyText>Please sign in to view your liked articles</EmptyText>
              <EmptySubtext>Like articles while reading to save them here!</EmptySubtext>
            </EmptyAuthState>
          </PageContainer>
        </MobileContentWrapper>
      </>
    );
  }

  return (
    <>
      <MobileNavigation />
      <MobileContentWrapper>
        <PageContainer>
          <ContentHeader>
            <PageTitle>❤️ Liked Articles</PageTitle>
          </ContentHeader>

          {/* 정렬 옵션 */}
          <SortSection>
            <Button
              variant="outlined"
              sx={{
                borderColor: '#1976d2',
                color: '#1976d2',
                minWidth: '160px',
                height: '40px',
                fontSize: '0.875rem',
                fontWeight: 'medium',
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#1565c0',
                  backgroundColor: 'rgba(25, 118, 210, 0.04)'
                }
              }}
            >
              <FormControl size="small" sx={{ minWidth: 140, border: 'none' }}>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  variant="standard"
                  disableUnderline
                  sx={{
                    fontSize: '0.875rem',
                    color: '#1976d2',
                    '& .MuiSelect-icon': {
                      color: '#1976d2'
                    }
                  }}
                >
                  <MenuItem value="dateLiked">Date Liked</MenuItem>
                  <MenuItem value="publishedDate">Published Date</MenuItem>
                  <MenuItem value="title">Title A-Z</MenuItem>
                  <MenuItem value="category">Category</MenuItem>
                </Select>
              </FormControl>
            </Button>
          </SortSection>

          {/* 기사 목록 */}
          <ArticleGrid>
            {sortedArticles.length === 0 ? (
              <EmptyState>
                <EmptyIcon>💭</EmptyIcon>
                <EmptyText>No liked articles yet</EmptyText>
                <EmptySubtext>Like articles while reading to save them here!</EmptySubtext>
              </EmptyState>
            ) : (
              sortedArticles.map(article => (
                <ArticleCard 
                  key={article.id} 
                  {...article} 
                  navigate={navigate}
                />
              ))
            )}
          </ArticleGrid>
        </PageContainer>
      </MobileContentWrapper>
    </>
  );
};

// 스타일드 컴포넌트들
const ContentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const PageTitle = styled.h1`
  font-size: 1.8rem;
  font-weight: bold;
  color: #1976d2;
  margin: 0;
`;

const SortSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const ArticleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  grid-column: 1 / -1;
`;

const EmptyAuthState = styled(EmptyState)`
  padding: 6rem 2rem;
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const EmptyText = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.5rem 0;
`;

const EmptySubtext = styled.p`
  font-size: 1rem;
  color: #666;
  margin: 0;
  max-width: 400px;
`;

export default Like; 