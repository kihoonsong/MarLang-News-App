// 소셜 미디어 메타데이터 테스트 페이지
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Box,
  Alert,
  Chip,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Facebook,
  Twitter,
  LinkedIn,
  Share,
  CheckCircle,
  Warning,
  Error,
  Info
} from '@mui/icons-material';
import { useArticles } from '../contexts/ArticlesContext';
import { 
  validateMetadata, 
  calculateSocialScore, 
  getSocialOptimizationSuggestions,
  generateSocialPreview,
  getSocialDebugUrls
} from '../utils/socialCacheUtils';
import SocialShareMeta from '../components/SocialShareMeta';

const SocialMetaTest = () => {
  const { articles } = useArticles();
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [testUrl, setTestUrl] = useState('');
  const [metaData, setMetaData] = useState(null);
  const [validation, setValidation] = useState(null);
  const [socialScore, setSocialScore] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  // 현재 페이지의 메타데이터 추출
  const extractCurrentMetadata = () => {
    const meta = {};
    
    // 기본 메타데이터
    meta.title = document.title;
    meta.description = document.querySelector('meta[name="description"]')?.content || '';
    
    // Open Graph
    meta.ogTitle = document.querySelector('meta[property="og:title"]')?.content || '';
    meta.ogDescription = document.querySelector('meta[property="og:description"]')?.content || '';
    meta.ogImage = document.querySelector('meta[property="og:image"]')?.content || '';
    meta.ogUrl = document.querySelector('meta[property="og:url"]')?.content || '';
    meta.ogType = document.querySelector('meta[property="og:type"]')?.content || '';
    
    // Twitter Card
    meta.twitterCard = document.querySelector('meta[name="twitter:card"]')?.content || '';
    meta.twitterTitle = document.querySelector('meta[name="twitter:title"]')?.content || '';
    meta.twitterDescription = document.querySelector('meta[name="twitter:description"]')?.content || '';
    meta.twitterImage = document.querySelector('meta[name="twitter:image"]')?.content || '';
    
    return meta;
  };

  // 기사 선택 시 분석 실행
  useEffect(() => {
    if (selectedArticle) {
      const validation = validateMetadata(selectedArticle);
      const score = calculateSocialScore(selectedArticle);
      const suggestions = getSocialOptimizationSuggestions(selectedArticle);
      
      setValidation(validation);
      setSocialScore(score);
      setSuggestions(suggestions);
      
      // 현재 메타데이터 추출
      setTimeout(() => {
        const currentMeta = extractCurrentMetadata();
        setMetaData(currentMeta);
      }, 1000); // SocialShareMeta 컴포넌트가 메타데이터를 업데이트할 시간을 줌
    }
  }, [selectedArticle]);

  const handleArticleSelect = (article) => {
    setSelectedArticle(article);
    setTestUrl(`${window.location.origin}/article/${article.id}`);
  };

  const openDebugTool = (platform) => {
    const debugUrls = getSocialDebugUrls(testUrl);
    window.open(debugUrls[platform], '_blank');
  };

  const getSeverityIcon = (type) => {
    switch (type) {
      case 'error': return <Error color="error" />;
      case 'warning': return <Warning color="warning" />;
      case 'info': return <Info color="info" />;
      default: return <CheckCircle color="success" />;
    }
  };

  const getSeverityColor = (type) => {
    switch (type) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'success';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 선택된 기사의 메타데이터 적용 */}
      {selectedArticle && <SocialShareMeta article={selectedArticle} />}
      
      <Typography variant="h4" gutterBottom>
        소셜 미디어 메타데이터 테스트
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        기사의 소셜 미디어 공유 최적화 상태를 확인하고 문제를 진단합니다.
      </Typography>

      <Grid container spacing={3}>
        {/* 기사 선택 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                테스트할 기사 선택
              </Typography>
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {articles.slice(0, 10).map((article) => (
                  <Button
                    key={article.id}
                    fullWidth
                    variant={selectedArticle?.id === article.id ? 'contained' : 'outlined'}
                    onClick={() => handleArticleSelect(article)}
                    sx={{ mb: 1, textAlign: 'left', justifyContent: 'flex-start' }}
                  >
                    <Box>
                      <Typography variant="body2" noWrap>
                        {article.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {article.category} • {new Date(article.publishedAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Button>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 분석 결과 */}
        <Grid item xs={12} md={8}>
          {selectedArticle ? (
            <Box>
              {/* 점수 카드 */}
              {socialScore && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      소셜 최적화 점수
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="h3" color="primary">
                        {socialScore.percentage}%
                      </Typography>
                      <Chip 
                        label={`등급: ${socialScore.grade}`}
                        color={socialScore.grade === 'A' ? 'success' : socialScore.grade === 'B' ? 'info' : 'warning'}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {socialScore.score} / {socialScore.maxScore} 점
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* 유효성 검사 결과 */}
              {validation && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      유효성 검사
                    </Typography>
                    {validation.isValid ? (
                      <Alert severity="success">
                        모든 메타데이터가 올바르게 설정되었습니다!
                      </Alert>
                    ) : (
                      <Alert severity="warning">
                        {validation.issues.length}개의 문제가 발견되었습니다.
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* 개선 제안 */}
              {suggestions.length > 0 && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      개선 제안
                    </Typography>
                    <List>
                      {suggestions.map((suggestion, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            {getSeverityIcon(suggestion.type)}
                          </ListItemIcon>
                          <ListItemText 
                            primary={suggestion.message}
                            secondary={`우선순위: ${suggestion.priority}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              )}

              {/* 현재 메타데이터 */}
              {metaData && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      현재 메타데이터
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            기본 메타데이터
                          </Typography>
                          <Typography variant="body2">
                            <strong>제목:</strong> {metaData.title}
                          </Typography>
                          <Typography variant="body2">
                            <strong>설명:</strong> {metaData.description}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Open Graph
                          </Typography>
                          <Typography variant="body2">
                            <strong>OG 제목:</strong> {metaData.ogTitle}
                          </Typography>
                          <Typography variant="body2">
                            <strong>OG 이미지:</strong> {metaData.ogImage ? '✅' : '❌'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>OG URL:</strong> {metaData.ogUrl}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Twitter Card
                          </Typography>
                          <Typography variant="body2">
                            <strong>카드 타입:</strong> {metaData.twitterCard}
                          </Typography>
                          <Typography variant="body2">
                            <strong>트위터 이미지:</strong> {metaData.twitterImage ? '✅' : '❌'}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {/* 디버깅 도구 */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    소셜 미디어 디버깅 도구
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    각 플랫폼의 공식 디버깅 도구로 메타데이터를 확인하세요.
                  </Typography>
                  <Box display="flex" gap={2} flexWrap="wrap">
                    <Button
                      variant="outlined"
                      startIcon={<Facebook />}
                      onClick={() => openDebugTool('facebook')}
                    >
                      Facebook 디버거
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Twitter />}
                      onClick={() => openDebugTool('twitter')}
                    >
                      Twitter 검증기
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<LinkedIn />}
                      onClick={() => openDebugTool('linkedin')}
                    >
                      LinkedIn 검사기
                    </Button>
                  </Box>
                  
                  {testUrl && (
                    <Box mt={2}>
                      <TextField
                        fullWidth
                        label="테스트 URL"
                        value={testUrl}
                        InputProps={{
                          readOnly: true,
                        }}
                        size="small"
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          ) : (
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" textAlign="center">
                  테스트할 기사를 선택해주세요
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default SocialMetaTest;