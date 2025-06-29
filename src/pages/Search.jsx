import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { 
  AppBar, Toolbar, Typography, IconButton, InputBase, Box, Card, CardMedia, 
  CardContent, Chip, Grid, FormControl, Select, MenuItem, InputLabel,
  Tabs, Tab, Paper, List, ListItem, ListItemText, ListItemIcon, Divider,
  useMediaQuery, useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import PageContainer from '../components/PageContainer';
import ArticleCard from '../components/ArticleCard';

// 샘플 기사 데이터 (검색용)
const sampleArticles = [
  {
    id: 1,
    title: 'AI Revolution in Healthcare: How Machine Learning is Transforming Patient Care',
    category: 'Technology',
    date: 'Jun 25, 2024',
    level: 'Advanced',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80',
    summary: 'Artificial Intelligence is revolutionizing the healthcare industry...',
    tags: ['AI', 'Healthcare', 'Machine Learning', 'Technology']
  },
  {
    id: 2,
    title: 'Climate Change Solutions: Renewable Energy Breakthrough',
    category: 'Environment',
    date: 'Jun 24, 2024',
    level: 'Intermediate',
    image: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=800&q=80',
    summary: 'Scientists have discovered new renewable energy technologies...',
    tags: ['Climate', 'Energy', 'Environment', 'Science']
  },
  {
    id: 3,
    title: 'Space Exploration: Mars Mission Updates',
    category: 'Science',
    date: 'Jun 23, 2024',
    level: 'Advanced',
    image: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?auto=format&fit=crop&w=800&q=80',
    summary: 'Latest updates from NASA Mars exploration missions...',
    tags: ['Space', 'Mars', 'NASA', 'Exploration']
  },
  {
    id: 4,
    title: 'Global Economy Trends in 2024',
    category: 'Business',
    date: 'Jun 22, 2024',
    level: 'Intermediate',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
    summary: 'Analysis of global economic trends and market predictions...',
    tags: ['Economy', 'Business', 'Finance', 'Markets']
  },
  {
    id: 5,
    title: 'Educational Technology in Modern Schools',
    category: 'Education',
    date: 'Jun 21, 2024',
    level: 'Beginner',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80',
    summary: 'How technology is changing the way students learn...',
    tags: ['Education', 'Technology', 'Schools', 'Learning']
  },
  {
    id: 6,
    title: 'Sports News: World Championship Results',
    category: 'Sports',
    date: 'Jun 20, 2024',
    level: 'Beginner',
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
    summary: 'Latest results from international sports championships...',
    tags: ['Sports', 'Championship', 'Athletics', 'Competition']
  }
];

const Search = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { userSettings, updateSettings } = useData();
  
  // URL에서 초기 검색어 가져오기
  const urlParams = new URLSearchParams(location.search);
  const initialQuery = urlParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [sortBy, setSortBy] = useState('relevance');
  const [activeTab, setActiveTab] = useState(0);
  
  // 검색 히스토리
  const [searchHistory, setSearchHistory] = useState([]);
  const [trendingSearches] = useState([
    'AI technology', 'Climate change', 'Space exploration', 'Economy 2024', 'Education'
  ]);

  const categories = ['All', 'Technology', 'Environment', 'Science', 'Business', 'Education', 'Sports'];
  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  // 검색 히스토리 로드
  useEffect(() => {
    const loadSearchHistory = () => {
      try {
        const stored = localStorage.getItem('marlang_search_history');
        if (stored) {
          setSearchHistory(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading search history:', error);
      }
    };
    loadSearchHistory();
  }, []);

  // 검색 히스토리 저장
  const saveSearchHistory = (query) => {
    if (!query.trim()) return;
    
    const newHistory = [
      { query: query.trim(), timestamp: new Date().toISOString() },
      ...searchHistory.filter(item => item.query !== query.trim())
    ].slice(0, 10);
    
    setSearchHistory(newHistory);
    localStorage.setItem('marlang_search_history', JSON.stringify(newHistory));
  };

  // 검색 히스토리 삭제
  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('marlang_search_history');
  };

  // 실시간 검색 필터링
  const filteredResults = useMemo(() => {
    let results = sampleArticles;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(article => 
        article.title.toLowerCase().includes(query) ||
        article.summary.toLowerCase().includes(query) ||
        article.tags.some(tag => tag.toLowerCase().includes(query)) ||
        article.category.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== 'All') {
      results = results.filter(article => article.category === selectedCategory);
    }

    if (selectedLevel !== 'All') {
      results = results.filter(article => article.level === selectedLevel);
    }

    switch (sortBy) {
      case 'date':
        results.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'title':
        results.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'category':
        results.sort((a, b) => a.category.localeCompare(b.category));
        break;
      default:
        if (searchQuery.trim()) {
          results.sort((a, b) => {
            const aScore = getRelevanceScore(a, searchQuery);
            const bScore = getRelevanceScore(b, searchQuery);
            return bScore - aScore;
          });
        }
        break;
    }

    return results;
  }, [searchQuery, selectedCategory, selectedLevel, sortBy]);

  const getRelevanceScore = (article, query) => {
    const lowerQuery = query.toLowerCase();
    let score = 0;
    
    if (article.title.toLowerCase().includes(lowerQuery)) score += 3;
    if (article.category.toLowerCase().includes(lowerQuery)) score += 2;
    if (article.summary.toLowerCase().includes(lowerQuery)) score += 1;
    article.tags.forEach(tag => {
      if (tag.toLowerCase().includes(lowerQuery)) score += 1;
    });
    
    return score;
  };

  const handleSearch = (query) => {
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      setSearchQuery(trimmedQuery);
      saveSearchHistory(trimmedQuery);
      setActiveTab(0);
      
      const newUrl = new URL(window.location);
      newUrl.searchParams.set('q', trimmedQuery);
      window.history.pushState({}, '', newUrl);
    }
  };

  const handleQueryChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
    }
  };

  const handleArticleClick = (articleId) => {
    navigate(`/article/${articleId}`);
  };

  const handleHistoryClick = (query) => {
    handleSearch(query);
  };

  useEffect(() => {
    if (initialQuery) {
      setActiveTab(0);
    }
  }, [initialQuery]);

  return (
    <>
      {/* 상단바 - 데스크톱만 표시 */}
      {!isMobile && (
        <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton color="inherit" onClick={() => navigate('/')}>
            <ArrowBackIcon />
          </IconButton>
          
          <SearchContainer>
            <SearchInput
              placeholder="Search articles, categories, topics..."
              value={searchQuery}
              onChange={handleQueryChange}
              onKeyPress={handleKeyPress}
              startAdornment={<SearchIcon sx={{ mr: 1, color: '#666' }} />}
              endAdornment={
                searchQuery && (
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <ClearIcon />
                  </IconButton>
                )
              }
            />
            <SearchButton onClick={() => handleSearch(searchQuery)}>
              Search
            </SearchButton>
          </SearchContainer>
        </Toolbar>
      </AppBar>
      )}

      {/* Home 페이지 카테고리 탭과 동일한 높이 유지 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, height: '48px' }}>
      </Box>

      <PageContainer>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
            <Tab 
              label={`Results ${searchQuery ? `(${filteredResults.length})` : ''}`} 
              icon={<SearchIcon />} 
            />
            <Tab 
              label="Search History" 
              icon={<HistoryIcon />} 
            />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <>
            <FilterSection>
              <FilterTitle>
                <FilterListIcon sx={{ mr: 1 }} />
                Filters & Sort
              </FilterTitle>
              
              <FilterControls>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    label="Category"
                  >
                    {categories.map(category => (
                      <MenuItem key={category} value={category}>{category}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Level</InputLabel>
                  <Select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    label="Level"
                  >
                    {levels.map(level => (
                      <MenuItem key={level} value={level}>{level}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Sort by</InputLabel>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    label="Sort by"
                  >
                    <MenuItem value="relevance">Relevance</MenuItem>
                    <MenuItem value="date">Date</MenuItem>
                    <MenuItem value="title">Title</MenuItem>
                    <MenuItem value="category">Category</MenuItem>
                  </Select>
                </FormControl>
              </FilterControls>
            </FilterSection>

            {searchQuery ? (
              <ResultsSection>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Search results for "{searchQuery}"
                </Typography>
                
                {filteredResults.length > 0 ? (
                  <ArticleGrid>
                    {filteredResults.map(article => (
                      <ArticleCardWrapper key={article.id}>
                        <ArticleCard 
                          {...article}
                          publishedAt={article.date}
                          onClick={() => handleArticleClick(article.id)}
                        />
                      </ArticleCardWrapper>
                    ))}
                  </ArticleGrid>
                ) : (
                  <NoResults>
                    <Typography variant="h6" color="text.secondary">
                      No articles found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Try different keywords or remove some filters
                    </Typography>
                  </NoResults>
                )}
              </ResultsSection>
            ) : (
              <NoSearchSection>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Discover Articles
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Search for articles by topic, category, or keywords
                </Typography>
                
                <Grid container spacing={3}>
                  {sampleArticles.slice(0, 6).map(article => (
                    <Grid item xs={12} sm={6} md={4} key={article.id}>
                      <ArticleCard 
                        id={article.id}
                        image={article.image}
                        title={article.title}
                        summary={article.summary}
                        category={article.category}
                        publishedAt={article.date}
                        onClick={() => handleArticleClick(article.id)}
                      />
                    </Grid>
                  ))}
                </Grid>
              </NoSearchSection>
            )}
          </>
        )}

        {activeTab === 1 && (
          <HistorySection>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon sx={{ mr: 1, color: '#f57c00' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Trending Searches
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {trendingSearches.map((search, index) => (
                  <Chip
                    key={index}
                    label={search}
                    variant="outlined"
                    onClick={() => handleHistoryClick(search)}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <HistoryIcon sx={{ mr: 1, color: '#1976d2' }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Recent Searches
                  </Typography>
                </Box>
                
                {searchHistory.length > 0 && (
                  <IconButton onClick={clearSearchHistory} size="small">
                    <ClearIcon />
                  </IconButton>
                )}
              </Box>

              {searchHistory.length > 0 ? (
                <List>
                  {searchHistory.map((item, index) => (
                    <React.Fragment key={index}>
                      <ListItem
                        button
                        onClick={() => handleHistoryClick(item.query)}
                        sx={{ borderRadius: 1, mb: 1 }}
                      >
                        <ListItemIcon>
                          <HistoryIcon color="action" />
                        </ListItemIcon>
                        <ListItemText
                          primary={item.query}
                          secondary={new Date(item.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        />
                      </ListItem>
                      {index < searchHistory.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No search history yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start searching to see your history here
                  </Typography>
                </Box>
              )}
            </Paper>
          </HistorySection>
        )}
      </PageContainer>
    </>
  );
};

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  gap: 1rem;
  margin-left: 1rem;
`;

const SearchInput = styled(InputBase)`
  flex: 1;
  background: #f5f5f5;
  border-radius: 25px;
  padding: 0.5rem 1rem;
  
  .MuiInputBase-input {
    padding: 0.5rem 0;
  }
`;

const SearchButton = styled.button`
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 0.75rem 1.5rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #1565c0;
  }
`;

const FilterSection = styled.div`
  margin-bottom: 2rem;
`;

const FilterTitle = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  font-weight: bold;
  color: #333;
`;

const FilterControls = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const ResultsSection = styled.div`
  margin-top: 2rem;
`;

const NoResults = styled.div`
  text-align: center;
  padding: 4rem 2rem;
`;

const NoSearchSection = styled.div`
  text-align: center;
  margin-top: 2rem;
`;

const HistorySection = styled.div`
  margin-top: 1rem;
`;

const ArticleGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`;

const ArticleCardWrapper = styled.div`
  flex: 1 1 calc(33.33% - 1rem);
`;

export default Search; 