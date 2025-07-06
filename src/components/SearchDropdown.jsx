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
            e.preventDefault();
            
            // 빈 검색창일 때는 아무 동작 안 함
            if (!query.trim()) {
              return;
            }
            
            // 검색 결과가 있으면 첫 번째 기사로 이동
            if (results.length > 0) {
              setIsOpen(false);
              setQuery('');
              navigate(`/article/${results[0].id}`);
            }
          }
        }}
        startAdornment={
          <SearchIcon 
            sx={{ mr: 1, color: '#666', cursor: 'pointer' }} 
            onClick={() => {
              if (!isOpen) {
                setIsOpen(true);
                if (query.trim()) {
                  doSearch(query);
                }
              }
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
                
                {results.map((article, index) => (
                  <Item 
                    key={article.id}
                    $isFirst={index === 0 && query.trim()}
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
  
  /* 풀스크린(데스크톱)에서 크기 50% 확대 */
  @media (min-width: 1024px) {
    max-width: 600px; /* 400px → 600px (50% 증가) */
  }
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
  
  /* 풀스크린에서 더 큰 패딩과 폰트 크기 */
  @media (min-width: 1024px) {
    padding: ${props => props.$compact ? '0.4rem 1rem' : '0.75rem 1.5rem'};
    font-size: 1.1rem;
    
    .MuiInputBase-input {
      font-size: 1.1rem;
    }
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
  
  /* 풀스크린에서 더 넓게 */
  @media (min-width: 1024px) {
    max-height: 400px; /* 높이도 약간 증가 */
  }
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
  position: relative;
  
  &:hover {
    background-color: #f8f9fa;
  }
  
  /* 첫 번째 아이템 하이라이트 (엔터 키 대상) */
  ${props => props.$isFirst && `
    background-color: #e3f2fd;
    border-left: 3px solid #1976d2;
    
    &:hover {
      background-color: #bbdefb;
    }
    
    &::before {
      content: '⏎';
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #1976d2;
      font-weight: bold;
      font-size: 0.8rem;
    }
  `}
  
  /* 풀스크린에서 더 큰 패딩 */
  @media (min-width: 1024px) {
    padding: 16px;
    
    ${props => props.$isFirst && `
      &::before {
        right: 16px;
      }
    `}
  }
`;

const NoResults = styled('div')`
  padding: 2rem 1rem;
  text-align: center;
`;

export default SearchDropdown; 