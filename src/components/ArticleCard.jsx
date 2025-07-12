import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { designTokens, getShadow, getBorderRadius, getColor } from '../utils/designTokens';
import { useArticles } from '../contexts/ArticlesContext';

// 요약 트렁케이트 (중복 마침표 제거)
const truncateSummary = (text, limit = 100) => {
  if (!text) return '';
  if (text.length <= limit) return text;
  let truncated = text.substring(0, limit).trimEnd();
  if (/[.!?]$/.test(truncated)) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}...`;
};

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
  const { categories } = useArticles();
  
  // 카테고리 객체 찾기
  const categoryObj = categories.find(cat => cat.name === category) || { name: category };

  const handleClick = () => {
    if (import.meta.env.DEV) {
      console.log('Card clicked, id:', id);
    }
    if (onClick) {
      onClick();
    } else {
      if (import.meta.env.DEV) {
        console.log('Navigating to:', `/article/${id}`);
      }
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
      <CardContent $categoryObj={categoryObj}>
        <CardHeader>
          <CategoryChip>{category}</CategoryChip>
          <PublishDate>{formatDate(publishedAt)}</PublishDate>
        </CardHeader>
        
        <CardTitle>{title}</CardTitle>
        
        {summary && (
          <CardSummary>{truncateSummary(summary)}</CardSummary>
        )}
      </CardContent>
    </CardContainer>
  );
};

const CardContainer = styled.div`
  background: ${getColor('background.paper')};
  border-radius: ${getBorderRadius('large')};
  box-shadow: ${getShadow('card')};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
  cursor: pointer;
  width: 320px;
  height: 360px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${getShadow('cardHover')};
  }
  
  @media (max-width: ${designTokens.breakpoints.mobile}) {
    /* 모바일에서도 최대 크기(320x360)를 유지 */
    width: 100%;        /* 부모 폭을 따라가면서 */
    max-width: 320px;   /* 320px 이상으로 커지지 않도록 */
    height: 360px;      /* 높이 고정해 카드 사이즈 일정 */
    scroll-snap-align: start; /* 스크롤 스냅 추가 */

    /* 화면이 카드 폭보다 넓으면 가운데 정렬 */
    margin-left: auto;
    margin-right: auto;
  }
`;

const CardImage = styled.img`
  width: 100%;
  height: 180px;
  object-fit: cover;
  
  @media (max-width: ${designTokens.breakpoints.mobile}) {
    height: 160px;
  }
`;

const CardContent = styled.div`
  padding: ${designTokens.spacing.sm};
  display: flex;
  flex-direction: column;
  flex: 1;
  background: ${props => props.$categoryObj && props.$categoryObj.color ? props.$categoryObj.color : 'transparent'};
  
  @media (min-width: ${designTokens.breakpoints.mobile}) {
    padding: ${designTokens.spacing.md};
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${designTokens.spacing.xs};
`;

const CategoryChip = styled.span`
  background: ${getColor('primaryLight')};
  color: ${getColor('primary')};
  padding: 0.25rem 0.75rem;
  border-radius: ${getBorderRadius('medium')};
  font-size: 0.75rem;
  font-weight: 500;
`;

const PublishDate = styled.span`
  font-size: 0.75rem;
  color: ${getColor('text.secondary')};
`;

const CardTitle = styled.h3`
  font-size: 1rem;
  font-weight: bold;
  margin: 0 0 ${designTokens.spacing.xs} 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: ${getColor('text.primary')};
`;

const CardSummary = styled.p`
  font-size: 0.875rem;
  color: ${getColor('text.secondary')};
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export default ArticleCard; 