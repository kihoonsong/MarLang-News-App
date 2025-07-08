import React, { useState, useEffect, useRef } from 'react';
import { InputBase, Paper, Typography, CircularProgress, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
    <Container ref={searchRef} className={className} style={style} $isFocused={isOpen && isMobile}>
      <SearchInputWrapper $isFocused={isOpen && isMobile}>
        {isMobile && isOpen && (
          <CloseButton onClick={() => {
            setIsOpen(false);
            setQuery('');
          }}>
            <CloseIcon />
          </CloseButton>
        )}
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
          $isFocused={isOpen && isMobile}
        />
      </SearchInputWrapper>
      
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
  max-width: 500px;
  
  /* 스마트폰에서 더 넓게 */
  @media (max-width: 767px) {
    max-width: 100%;
    flex: 1;
    
    /* 포커스 상태일 때 전체 헤더를 덮도록 확장 */
    ${props => props.$isFocused && `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1100;
      background: white;
      padding: 1rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      max-width: none;
      width: 100vw;
    `}
  }
  
  /* 풀스크린(데스크톱)에서 크기 50% 확대 */
  @media (min-width: 1024px) {
    max-width: 600px; /* 400px → 600px (50% 증가) */
  }
`;

const SearchInputWrapper = styled('div')`
  display: flex;
  align-items: center;
  position: relative;
  
  @media (max-width: 767px) {
    ${props => props.$isFocused && `
      gap: 0.5rem;
    `}
  }
`;

const CloseButton = styled(IconButton)`
  color: #666 !important;
  padding: 8px !important;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.04) !important;
  }
`;

const Input = styled(InputBase)`
  width: 100%;
  background: #f5f5f5;
  border-radius: ${props => props.$compact ? '8px' : '25px'};
  padding: ${props => props.$compact ? '0.5rem 1rem' : '1rem 1.5rem'};
  transition: all 0.2s;
  
  &:focus-within {
    background: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  /* 스마트폰에서 검색창 크기 2배로 확대 */
  @media (max-width: 767px) {
    padding: ${props => props.$compact ? '0.8rem 1.2rem' : '1.2rem 1.8rem'};
    font-size: 1.1rem;
    
    .MuiInputBase-input {
      font-size: 1.1rem;
    }
    
    /* 포커스 상태일 때 더 큰 스타일 */
    ${props => props.$isFocused && `
      background: white;
      box-shadow: none;
      border-radius: 12px;
      flex: 1;
    `}
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
  
  /* 모바일 포커스 상태에서 드롭다운 조정 */
  @media (max-width: 767px) {
    /* 컨테이너가 fixed일 때를 위한 추가 스타일 */
    ${props => props.theme && `
      max-height: calc(100vh - 120px);
      overflow-y: auto;
    `}
  }
`;

const DropdownPaper = styled(Paper)`
  max-height: 300px;
  overflow-y: auto;
  border-radius: 12px !important;
  
  /* 모바일에서 더 큰 검색 결과 */
  @media (max-width: 767px) {
    max-height: calc(100vh - 140px);
    border-radius: 0 0 12px 12px !important;
  }
  
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