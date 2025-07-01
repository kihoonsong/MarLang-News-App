import React, { useState, useEffect, useRef } from 'react';
import { InputBase, Paper, Typography, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import { useArticles } from '../contexts/ArticlesContext';

const SearchDropdown = ({ placeholder = "Search articles...", className, style, compact = false }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const { allArticles } = useArticles();

  // 간단한 검색 함수 - 무한 로딩 방지
  const doSearch = (searchQuery) => {
    console.log('🔍 검색 시작:', searchQuery);
    
    setIsLoading(true);
    
    // 즉시 검색 실행 (setTimeout 제거)
    try {
      if (!allArticles || allArticles.length === 0) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      if (!searchQuery.trim()) {
        setResults(allArticles.slice(0, 3));
        setIsLoading(false);
        return;
      }

      const searchTerm = searchQuery.toLowerCase();
      const filtered = allArticles.filter(article => 
        article?.title?.toLowerCase().includes(searchTerm)
      );
      
      setResults(filtered.slice(0, 5));
      console.log('✅ 검색 완료:', filtered.length, '개');
    } catch (error) {
      console.error('❌ 검색 오류:', error);
      setResults([]);
    }
    
    // 무조건 로딩 해제
    setIsLoading(false);
  };

  // 검색어 변경시
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      doSearch(query);
    }, 200);

    return () => clearTimeout(timer);
  }, [query, allArticles, isOpen]);

  // 외부 클릭시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <Container ref={searchRef} className={className} style={style}>
      <Input
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!isOpen) setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            setIsOpen(false);
            const url = query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : '/search';
            navigate(url);
          }
        }}
        startAdornment={
          <SearchIcon 
            sx={{ mr: 1, color: '#666', cursor: 'pointer' }} 
            onClick={() => {
              setIsOpen(false);
              const url = query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : '/search';
              navigate(url);
            }}
          />
        }
        $compact={compact}
      />
      
      {isOpen && (
        <Dropdown>
          <DropdownPaper>
            {isLoading ? (
              <Loading>
                <CircularProgress size={20} />
                <Typography variant="body2" sx={{ ml: 1 }}>Searching...</Typography>
              </Loading>
            ) : results.length > 0 ? (
              <>
                <Header>
                  <Typography variant="subtitle2" color="primary">
                    {query.trim() ? `Results (${results.length})` : 'Recent Articles'}
                  </Typography>
                </Header>
                
                {results.map((article) => (
                  <Item 
                    key={article.id}
                    onClick={() => {
                      setIsOpen(false);
                      setQuery('');
                      navigate(`/article/${article.id}`);
                    }}
                  >
                    <img 
                      src={article.image} 
                      alt={article.title}
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        marginRight: '12px'
                      }} 
                    />
                    <div>
                      <Typography variant="body2" style={{ fontWeight: 600, marginBottom: '4px' }}>
                        {article.title}
                      </Typography>
                      <Typography variant="caption" style={{ color: '#666' }}>
                        {article.category}
                      </Typography>
                    </div>
                  </Item>
                ))}
                
                <ViewAll 
                  onClick={() => {
                    setIsOpen(false);
                    const url = query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : '/search';
                    navigate(url);
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                    View all results
                  </Typography>
                </ViewAll>
              </>
            ) : query.trim() ? (
              <NoResults>
                <Typography variant="body2" color="text.secondary">
                  No results for "{query}"
                </Typography>
              </NoResults>
            ) : (
              <NoResults>
                <Typography variant="body2" color="text.secondary">
                  Start typing to search...
                </Typography>
              </NoResults>
            )}
          </DropdownPaper>
        </Dropdown>
      )}
    </Container>
  );
};

const Container = styled('div')`
  position: relative;
  width: 100%;
  max-width: 400px;
`;

const Input = styled(InputBase)`
  width: 100%;
  background: #f5f5f5;
  border-radius: ${props => props.$compact ? '8px' : '25px'};
  padding: ${props => props.$compact ? '0.25rem 0.75rem' : '0.5rem 1rem'};
  transition: all 0.2s;
  
  &:focus-within {
    background: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
`;

const Dropdown = styled('div')`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  margin-top: 4px;
`;

const DropdownPaper = styled(Paper)`
  max-height: 300px;
  overflow-y: auto;
  border-radius: 12px !important;
`;

const Loading = styled('div')`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

const Header = styled('div')`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f0f0f0;
`;

const Item = styled('div')`
  cursor: pointer;
  padding: 12px;
  display: flex;
  align-items: center;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f8f9fa;
  }
`;

const NoResults = styled('div')`
  padding: 2rem 1rem;
  text-align: center;
`;

const ViewAll = styled('div')`
  cursor: pointer;
  padding: 1rem;
  border-top: 1px solid #f0f0f0;
  text-align: center;
  background: #fafafa;
  
  &:hover {
    background: #f0f0f0;
  }
`;

export default SearchDropdown; 