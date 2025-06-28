import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  AppBar, Toolbar, Typography, IconButton, InputBase, Tabs, Tab, Box, 
  Select, MenuItem, FormControl, InputLabel, Avatar, Menu, ListItemIcon, 
  ListItemText, useMediaQuery, useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import ArticleIcon from '@mui/icons-material/Article';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import AuthGuard from '../components/AuthGuard';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';

const navigationTabs = ['Home', 'Date', 'Wordbook', 'Like', 'Profile', 'Dashboard'];

// 샘플 저장된 단어 데이터
const savedWords = [
  {
    id: 1,
    word: 'artificial',
    meaning: 'made by humans, not natural',
    translation: '인공의',
    language: 'Korean',
    articleId: 1,
    articleTitle: 'AI Revolution in Healthcare',
    savedDate: '2024-06-25',
    category: 'Technology'
  },
  {
    id: 2,
    word: 'revolutionizing',
    meaning: 'changing something completely',
    translation: '혁신하는',
    language: 'Korean',
    articleId: 1,
    articleTitle: 'AI Revolution in Healthcare',
    savedDate: '2024-06-24',
    category: 'Technology'
  },
  {
    id: 3,
    word: 'algorithm',
    meaning: 'a set of rules or instructions for solving a problem',
    translation: '알고리즘',
    language: 'Korean',
    articleId: 1,
    articleTitle: 'AI Revolution in Healthcare',
    savedDate: '2024-06-23',
    category: 'Technology'
  }
];

const Wordbook = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, isAuthenticated, signOut } = useAuth() || {};
  const { savedWords, removeWord, sortWords } = useData();
  const [navTab, setNavTab] = useState(2); // Wordbook 탭 활성화
  const [sortBy, setSortBy] = useState('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);

  const handleSort = (value) => {
    setSortBy(value);
    sortWords(value);
  };

  const handleDeleteWord = (wordId) => {
    removeWord(wordId);
  };

  const handleGoToArticle = (articleId) => {
    navigate(`/article/${articleId}`);
  };

  // 네비게이션 바 관련 함수들
  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    signOut();
    handleUserMenuClose();
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <AuthGuard feature="your wordbook">
      <MobileNavigation />
      <MobileContentWrapper>
        {/* 상단바 - 항상 표시 */}
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold', color: '#23408e' }}>
              MarLang Eng News
            </Typography>
            <InputBase
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              onClick={() => navigate('/search')}
              startAdornment={<SearchIcon sx={{ mr: 1 }} />}
              sx={{ background: '#f5f5f5', borderRadius: 2, px: 2, mr: 2, cursor: 'pointer' }}
            />
            
            {/* 사용자 프로필 메뉴 또는 로그인 버튼 */}
            {isAuthenticated ? (
              <IconButton
                size="large"
                onClick={handleUserMenuOpen}
                color="inherit"
              >
                <Avatar 
                  src={user?.picture} 
                  alt={user?.name}
                  sx={{ width: 32, height: 32 }}
                >
                  {!user?.picture && <AccountCircleIcon />}
                </Avatar>
              </IconButton>
            ) : (
              <IconButton
                size="large"
                onClick={handleLoginClick}
                color="inherit"
                sx={{ 
                  border: '1px solid #1976d2', 
                  borderRadius: 2,
                  padding: '6px 12px',
                  fontSize: '0.875rem'
                }}
              >
                <AccountCircleIcon sx={{ mr: 0.5 }} />
                Login
              </IconButton>
            )}
            
            {isAuthenticated && (
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleUserMenuClose}
                onClick={handleUserMenuClose}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                    mt: 1.5,
                    '& .MuiAvatar-root': {
                      width: 32,
                      height: 32,
                      ml: -0.5,
                      mr: 1,
                    },
                    '&:before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 0,
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={() => navigate('/profile')}>
                  <ListItemIcon>
                    <Avatar src={user?.picture} sx={{ width: 24, height: 24 }}>
                      <AccountCircleIcon fontSize="small" />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {user?.name || 'Guest User'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user?.email || 'guest@marlang.com'}
                    </Typography>
                  </ListItemText>
                </MenuItem>
                
                <MenuItem onClick={() => navigate('/settings')}>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Settings</ListItemText>
                </MenuItem>
                
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Logout</ListItemText>
                </MenuItem>
              </Menu>
            )}
          </Toolbar>
        </AppBar>
        
        {/* 네비게이션 바 - 데스크톱만 */}
        {!isMobile && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
            <Tabs value={navTab} onChange={(_, v) => setNavTab(v)}>
              {navigationTabs.map((nav, idx) => (
                <Tab 
                  key={nav} 
                  label={nav} 
                  onClick={() => {
                    setNavTab(idx);
                    switch(nav) {
                      case 'Home':
                        navigate('/');
                        break;
                      case 'Date':
                        navigate('/date');
                        break;
                      case 'Wordbook':
                        // 현재 페이지이므로 아무것도 하지 않음
                        break;
                      case 'Like':
                        navigate('/like');
                        break;
                      case 'Profile':
                        navigate('/profile');
                        break;
                      case 'Dashboard':
                        navigate('/dashboard');
                        break;
                      default:
                        break;
                    }
                  }}
                />
              ))}
            </Tabs>
          </Box>
        )}

        {/* Home과 높이 맞추기 위한 빈 공간 */}
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider', 
          px: 2, 
          height: '64px',
          display: 'flex',
          alignItems: 'center'
        }}>
          {/* 빈 공간 - Home의 카테고리 탭과 동일한 높이 */}
        </Box>

        {/* 단어장 내용 */}
        <Container>
          <Header>
            <Title>📚 My Wordbook</Title>
            <SortContainer>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort by"
                  onChange={(e) => handleSort(e.target.value)}
                >
                  <MenuItem value="alphabetical">Alphabetical</MenuItem>
                  <MenuItem value="recent">Recently Added</MenuItem>
                  <MenuItem value="article">By Article</MenuItem>
                </Select>
              </FormControl>
            </SortContainer>
          </Header>

          <WordList>
            {savedWords.map(word => (
              <WordCard key={word.id}>
                <WordHeader>
                  <WordText>{word.word}</WordText>
                  <ActionButtons>
                    <ActionButton onClick={() => handleGoToArticle(word.articleId)}>
                      <ArticleIcon sx={{ fontSize: 18 }} />
                    </ActionButton>
                    <ActionButton onClick={() => handleDeleteWord(word.id)}>
                      <DeleteIcon sx={{ fontSize: 18, color: '#f44336' }} />
                    </ActionButton>
                  </ActionButtons>
                </WordHeader>
                
                <Meaning>{word.definition}</Meaning>
                
                <WordMeta>
                  <ArticleInfo onClick={() => handleGoToArticle(word.articleId)}>
                    From: {word.articleTitle}
                  </ArticleInfo>
                  <SavedDate>Added: {new Date(word.addedAt).toLocaleDateString()}</SavedDate>
                </WordMeta>
              </WordCard>
            ))}
          </WordList>

          {savedWords.length === 0 && (
            <EmptyState>
              <EmptyIcon>📝</EmptyIcon>
              <EmptyText>No saved words yet.</EmptyText>
              <EmptySubtext>Start reading articles and save words to build your vocabulary!</EmptySubtext>
            </EmptyState>
          )}
        </Container>
      </MobileContentWrapper>
    </AuthGuard>
  );
};

const Container = styled.div`
  padding: 0 1rem 2rem 1rem;
  
  @media (min-width: 768px) {
    padding: 0 2rem 2rem 2rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
`;

const Title = styled.h1`
  font-size: 1.8rem;
  font-weight: bold;
  margin: 0;
`;

const SortContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const WordList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const WordCard = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  padding: 1.5rem;
  transition: box-shadow 0.2s;
  
  &:hover {
    box-shadow: 0 4px 24px rgba(0,0,0,0.15);
  }
`;

const WordHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const WordText = styled.h3`
  font-size: 1.4rem;
  font-weight: bold;
  margin: 0;
  color: #1976d2;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background 0.2s;
  
  &:hover {
    background: #f5f5f5;
  }
`;

const Meaning = styled.p`
  font-size: 1rem;
  line-height: 1.5;
  margin: 0 0 0.5rem 0;
  color: #333;
`;

const Translation = styled.p`
  font-size: 1rem;
  line-height: 1.5;
  margin: 0 0 1rem 0;
  color: #666;
  font-style: italic;
`;

const WordMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: #888;
`;

const ArticleInfo = styled.span`
  cursor: pointer;
  color: #1976d2;
  
  &:hover {
    text-decoration: underline;
  }
`;

const SavedDate = styled.span`
  color: #888;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const EmptyText = styled.h3`
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
  color: #666;
`;

const EmptySubtext = styled.p`
  font-size: 1rem;
  color: #888;
  margin: 0;
`;

export default Wordbook; 