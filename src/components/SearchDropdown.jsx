import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import {
  InputBase,
  Paper,
  List,
  ListItem,
  ListItemText,
  Typography,
  Chip,
  Box,
  Avatar,
  Divider,
  CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';

// 샘플 기사 데이터 (실제로는 props나 context에서 가져와야 함)
const sampleArticles = [
  {
    id: 1,
    title: "AI Revolution in Healthcare: How Machine Learning is Transforming Medical Diagnosis",
    content: "Artificial intelligence and machine learning technologies are revolutionizing the healthcare industry. From early disease detection to personalized treatment plans, AI is helping doctors make more accurate diagnoses and improve patient outcomes. Recent studies show that AI-powered diagnostic tools can identify certain conditions with higher accuracy than traditional methods.",
    category: "Technology",
    level: "Intermediate",
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=400&q=80",
    publishedAt: "2024-06-25"
  },
  {
    id: 2,
    title: "Climate Change Research: Scientists Discover New Solutions for Carbon Capture",
    content: "Environmental scientists have made breakthrough discoveries in carbon capture technology. These innovative solutions could significantly reduce atmospheric CO2 levels and help combat climate change. The research focuses on natural and artificial methods to capture and store carbon dioxide from industrial emissions.",
    category: "Science",
    level: "Advanced",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
    publishedAt: "2024-06-24"
  },
  {
    id: 3,
    title: "Global Economy: Tech Giants Report Record Quarterly Earnings",
    content: "Major technology companies have reported unprecedented quarterly earnings, driven by increased demand for digital services and cloud computing solutions. The strong financial performance reflects the ongoing digital transformation across industries and the growing reliance on technology infrastructure.",
    category: "Business",
    level: "Intermediate",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=400&q=80",
    publishedAt: "2024-06-23"
  },
  {
    id: 4,
    title: "Mental Health Awareness: New Study Reveals Impact of Social Media",
    content: "Recent psychological research has uncovered significant correlations between social media usage patterns and mental health outcomes. The comprehensive study examined thousands of participants and provides insights into healthy digital habits and the importance of mindful technology use.",
    category: "Health",
    level: "Beginner",
    image: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&w=400&q=80",
    publishedAt: "2024-06-22"
  },
  {
    id: 5,
    title: "Space Exploration: NASA's Latest Mars Mission Discovers Ancient Water Evidence",
    content: "NASA's Mars rover has uncovered compelling evidence of ancient water activity on the Red Planet. The discovery includes mineral formations and geological structures that suggest Mars once had a more Earth-like environment capable of supporting microbial life.",
    category: "Science",
    level: "Advanced",
    image: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?auto=format&fit=crop&w=400&q=80",
    publishedAt: "2024-06-21"
  }
];

const SearchDropdown = ({ placeholder = "Search articles...", className, style, compact = false }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // 검색 실행
  const performSearch = (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    // 실제 환경에서는 API 호출, 여기서는 시뮬레이션
    setTimeout(() => {
      const filteredResults = sampleArticles.filter(article => {
        const searchTerm = searchQuery.toLowerCase();
        const titleMatch = article.title.toLowerCase().includes(searchTerm);
        const contentMatch = article.content.toLowerCase().includes(searchTerm);
        return titleMatch || contentMatch;
      });

      // 관련도 점수 계산 및 정렬
      const scoredResults = filteredResults.map(article => {
        const searchTerm = searchQuery.toLowerCase();
        let score = 0;
        
        // 제목에서 매치되면 높은 점수
        if (article.title.toLowerCase().includes(searchTerm)) {
          score += 10;
        }
        
        // 본문에서 매치되면 낮은 점수
        if (article.content.toLowerCase().includes(searchTerm)) {
          score += 5;
        }
        
        return { ...article, score };
      }).sort((a, b) => b.score - a.score);

      setResults(scoredResults.slice(0, 5)); // 최대 5개 결과만 표시
      setIsLoading(false);
    }, 300);
  };

  // 검색어 변경 시 디바운싱 적용
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleArticleClick = (articleId) => {
    setIsOpen(false);
    setQuery('');
    navigate(`/article/${articleId}`);
  };



  const highlightText = (text, searchQuery) => {
    if (!searchQuery.trim()) return text;
    
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <HighlightedText key={index}>{part}</HighlightedText>
      ) : (
        part
      )
    );
  };

  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <SearchContainer ref={searchRef} className={className} style={style}>
      <SearchInput
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        startAdornment={<SearchIcon sx={{ mr: 1, color: '#666' }} />}
        $compact={compact}
      />
      
      {isOpen && (query.trim() || isLoading) && (
        <DropdownContainer>
          <DropdownPaper elevation={8}>
            {isLoading ? (
              <LoadingContainer>
                <CircularProgress size={20} />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  Searching...
                </Typography>
              </LoadingContainer>
            ) : results.length > 0 ? (
              <>
                <DropdownHeader>
                  <Typography variant="subtitle2" color="primary">
                    Search Results ({results.length})
                  </Typography>
                </DropdownHeader>
                
                <ResultsList>
                  {results.map((article, index) => (
                    <React.Fragment key={article.id}>
                      <ResultItem onClick={() => handleArticleClick(article.id)}>
                        <ArticleImage>
                          <img src={article.image} alt={article.title} />
                        </ArticleImage>
                        
                        <ArticleContent>
                          <ArticleHeader>
                            <ArticleTitle>
                              {highlightText(article.title, query)}
                            </ArticleTitle>
                            <ArticleMeta>
                              <Chip 
                                label={article.category} 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                              />
                              <Chip 
                                label={article.level} 
                                size="small" 
                                variant="outlined"
                              />
                            </ArticleMeta>
                          </ArticleHeader>
                          
                          <ArticleExcerpt>
                            {highlightText(truncateText(article.content), query)}
                          </ArticleExcerpt>
                          
                          <ArticleDate>
                            {new Date(article.publishedAt).toLocaleDateString()}
                          </ArticleDate>
                        </ArticleContent>
                      </ResultItem>
                      
                      {index < results.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </ResultsList>
              </>
            ) : query.trim() ? (
              <NoResultsContainer>
                <Typography variant="body2" color="text.secondary">
                  No articles found for "{query}"
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Try different keywords or check spelling
                </Typography>
              </NoResultsContainer>
            ) : null}
          </DropdownPaper>
        </DropdownContainer>
      )}
    </SearchContainer>
  );
};

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 400px;
`;

const SearchInput = styled(InputBase)`
  width: 100%;
  background: #f5f5f5;
  border-radius: ${props => props.$compact ? '8px' : '25px'};
  padding: ${props => props.$compact ? '0.25rem 0.75rem' : '0.5rem 1rem'};
  transition: all 0.2s;
  
  &:focus-within {
    background: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .MuiInputBase-input {
    padding: ${props => props.$compact ? '0.25rem 0' : '0.5rem 0'};
    font-size: ${props => props.$compact ? '0.875rem' : '1rem'};
  }
`;

const DropdownContainer = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  margin-top: 4px;
`;

const DropdownPaper = styled(Paper)`
  max-height: 400px;
  overflow-y: auto;
  border-radius: 12px !important;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
    
    &:hover {
      background: #a8a8a8;
    }
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

const DropdownHeader = styled.div`
  padding: 0.75rem 1rem 0.5rem 1rem;
  border-bottom: 1px solid #f0f0f0;
`;

const ResultsList = styled(List)`
  padding: 0 !important;
`;

const ResultItem = styled(ListItem)`
  cursor: pointer !important;
  padding: 1rem !important;
  transition: background-color 0.2s !important;
  display: flex !important;
  align-items: flex-start !important;
  
  &:hover {
    background-color: #f8f9fa !important;
  }
`;

const ArticleImage = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 1rem;
  flex-shrink: 0;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ArticleContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ArticleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  gap: 0.5rem;
`;

const ArticleTitle = styled(Typography)`
  font-weight: 600 !important;
  font-size: 0.9rem !important;
  line-height: 1.3 !important;
  display: -webkit-box !important;
  -webkit-line-clamp: 2 !important;
  -webkit-box-orient: vertical !important;
  overflow: hidden !important;
  flex: 1;
`;

const ArticleMeta = styled.div`
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
`;

const ArticleExcerpt = styled(Typography)`
  font-size: 0.8rem !important;
  color: #666 !important;
  line-height: 1.4 !important;
  display: -webkit-box !important;
  -webkit-line-clamp: 2 !important;
  -webkit-box-orient: vertical !important;
  overflow: hidden !important;
  margin-bottom: 0.5rem !important;
`;

const ArticleDate = styled(Typography)`
  font-size: 0.75rem !important;
  color: #999 !important;
`;

const HighlightedText = styled.span`
  background-color: #fff59d;
  font-weight: 600;
  border-radius: 2px;
  padding: 0 2px;
`;



const NoResultsContainer = styled.div`
  padding: 2rem 1rem;
  text-align: center;
`;

export default SearchDropdown; 