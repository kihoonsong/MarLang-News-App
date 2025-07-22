// 소셜 메타데이터 디버깅 페이지
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Box,
  Alert,
  Divider,
  Chip
} from '@mui/material';
import { useArticles } from '../contexts/ArticlesContext';
import SocialShareMeta from '../components/SocialShareMeta';
import HomeSocialMeta from '../components/HomeSocialMeta';
import CategorySocialMeta from '../components/CategorySocialMeta';

const SocialMetaDebug = () => {
  const { articles, categories } = useArticles();
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [metaMode, setMetaMode] = useState('home'); // 'home', 'article', 'category'

  // 첫 번째 기사와 카테고리 선택
  useEffect(() => {
    if (articles && articles.length > 0 && !selectedArticle) {
      setSelectedArticle(articles[0]);
    }
    if (categories && categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [articles, categories]);

  const getCurrentMetaTags = () => {
    const metaTags = {};
    
    // 기본 메타 태그들
    metaTags.title = document.title;
    metaTags.description = document.querySelector('meta[name="description"]')?.content || '';
    
    // Open Graph 태그들
    metaTags.ogTitle = document.querySelector('meta[property="og:title"]')?.content || '';
    metaTags.ogDescription = document.querySelector('meta[property="og:description"]')?.content || '';
    metaTags.ogImage = document.querySelector('meta[property="og:image"]')?.content || '';
    metaTags.ogUrl = document.querySelector('meta[property="og:url"]')?.content || '';
    metaTags.ogType = document.querySelector('meta[property="og:type"]')?.content || '';
    
    // Twitter Card 태그들
    metaTags.twitterCard = document.querySelector('meta[name="twitter:card"]')?.content || '';
    metaTags.twitterTitle = document.querySelector('meta[name="twitter:title"]')?.content || '';
    metaTags.twitterDescription = document.querySelector('meta[name="twitter:description"]')?.content || '';
    metaTags.twitterImage = document.querySelector('meta[name="twitter:image"]')?.content || '';
    
    return metaTags;
  };

  const [currentMeta, setCurrentMeta] = useState({});

  const refreshMetaTags = () => {
    setCurrentMeta(getCurrentMetaTags());
  };

  useEffect(() => {
    // 메타 태그 변경 감지를 위한 타이머
    const interval = setInterval(refreshMetaTags, 1000);
    return () => clearInterval(interval);
  }, []);

  const testUrls = {
    facebook: `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(window.location.href)}`,
    threads: `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(window.location.href)}`,
    twitter: 'https://cards-dev.twitter.com/validator',
    linkedin: `https://www.linkedin.com/post-inspector/inspect/${encodeURIComponent(window.location.href)}`
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 현재 적용된 메타데이터 컴포넌트 */}
      {metaMode === 'home' && <HomeSocialMeta />}
      {metaMode === 'article' && selectedArticle && <SocialShareMeta article={selectedArticle} />}
      {metaMode === 'category' && selectedCategory && <CategorySocialMeta category={selectedCategory} />}

      <Typography variant="h4" gutterBottom>
        소셜 메타데이터 디버깅 도구
      </Typography>

      {/* 모드 선택 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>메타데이터 모드 선택:</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip 
            label="홈페이지" 
            color={metaMode === 'home' ? 'primary' : 'default'}
            onClick={() => setMetaMode('home')}
            clickable
          />
          <Chip 
            label="개별 기사" 
            color={metaMode === 'article' ? 'primary' : 'default'}
            onClick={() => setMetaMode('article')}
            clickable
          />
          <Chip 
            label="카테고리" 
            color={metaMode === 'category' ? 'primary' : 'default'}
            onClick={() => setMetaMode('category')}
            clickable
          />
        </Box>
      </Box>

      {/* 기사 선택 (기사 모드일 때) */}
      {metaMode === 'article' && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>테스트할 기사 선택:</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {articles?.slice(0, 5).map((article) => (
                <Chip
                  key={article.id}
                  label={article.title.substring(0, 30) + '...'}
                  color={selectedArticle?.id === article.id ? 'primary' : 'default'}
                  onClick={() => setSelectedArticle(article)}
                  clickable
                />
              ))}
            </Box>
            {selectedArticle && (
              <Alert severity="info">
                선택된 기사: {selectedArticle.title}
                <br />
                이미지: {selectedArticle.image || '없음'}
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* 카테고리 선택 (카테고리 모드일 때) */}
      {metaMode === 'category' && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>테스트할 카테고리 선택:</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {categories?.map((category) => (
                <Chip
                  key={category.id}
                  label={category.name}
                  color={selectedCategory?.id === category.id ? 'primary' : 'default'}
                  onClick={() => setSelectedCategory(category)}
                  clickable
                />
              ))}
            </Box>
            {selectedCategory && (
              <Alert severity="info">
                선택된 카테고리: {selectedCategory.name}
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* 현재 메타 태그 상태 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">현재 메타 태그 상태</Typography>
            <Button variant="outlined" onClick={refreshMetaTags}>
              새로고침
            </Button>
          </Box>
          
          <Box sx={{ display: 'grid', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" color="primary">페이지 제목:</Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                {currentMeta.title || '없음'}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" color="primary">설명:</Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                {currentMeta.description || '없음'}
              </Typography>
            </Box>
            
            <Divider />
            
            <Box>
              <Typography variant="subtitle2" color="primary">Open Graph 이미지:</Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                {currentMeta.ogImage || '없음'}
              </Typography>
              {currentMeta.ogImage && (
                <Box sx={{ mt: 1 }}>
                  <img 
                    src={currentMeta.ogImage} 
                    alt="OG Image Preview" 
                    style={{ maxWidth: '200px', maxHeight: '100px', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </Box>
              )}
            </Box>
            
            <Box>
              <Typography variant="subtitle2" color="primary">Open Graph URL:</Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                {currentMeta.ogUrl || '없음'}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" color="primary">Open Graph Type:</Typography>
              <Typography variant="body2">
                {currentMeta.ogType || '없음'}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 소셜 플랫폼 테스트 링크 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>소셜 플랫폼 테스트 도구</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            아래 링크를 통해 각 플랫폼에서 메타데이터가 올바르게 표시되는지 확인하세요.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button 
              variant="outlined" 
              color="primary"
              onClick={() => window.open(testUrls.facebook, '_blank')}
            >
              Facebook 디버거
            </Button>
            <Button 
              variant="outlined" 
              color="primary"
              onClick={() => window.open(testUrls.threads, '_blank')}
            >
              Threads 디버거
            </Button>
            <Button 
              variant="outlined" 
              color="info"
              onClick={() => window.open(testUrls.twitter, '_blank')}
            >
              Twitter Card 검증
            </Button>
            <Button 
              variant="outlined" 
              color="secondary"
              onClick={() => window.open(testUrls.linkedin, '_blank')}
            >
              LinkedIn 검사기
            </Button>
          </Box>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>참고:</strong> 메타데이터 변경 후 소셜 플랫폼에서 캐시가 업데이트되기까지 시간이 걸릴 수 있습니다.
              <br />
              • <strong>Facebook & Threads:</strong> 디버거 도구를 사용하여 강제로 캐시를 새로고침할 수 있습니다.
              <br />
              • <strong>Threads:</strong> Facebook과 동일한 Open Graph 메타데이터를 사용하므로 Facebook 디버거로 테스트 가능합니다.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Container>
  );
};

export default SocialMetaDebug;