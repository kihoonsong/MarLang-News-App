import React from 'react';
import { 
  Typography, Grid, Box, Chip, Card, LinearProgress
} from '@mui/material';
// import {
//   Visibility, Book
// } from '@mui/icons-material';
import { 
  WelcomeCard, StatCard, StatIcon, StatInfo, StatNumber, StatLabel 
} from './DashboardStyles';

const DashboardStats = ({ 
  user, 
  stats = {}, 
  categoryStats = [],
  userAnalytics = {},
  lastUpdate = new Date()
}) => {
  // 기본값 설정
  const defaultStats = {
    totalArticles: 0,
    totalViews: 0,
    totalLikes: 0,
    totalMembers: 0,
    todayArticles: 0,
    todayMembers: 0,
    currentUsers: 0,
    categories: 0,
    totalWords: 0,
    avgReadArticles: 0,
    avgSavedWords: 0,
    ...stats
  };

  const defaultUserAnalytics = {
    usersByReadingFrequency: { high: 0, medium: 0, low: 0 },
    usersByLearningActivity: { active: 0, moderate: 0, passive: 0 },
    ...userAnalytics
  };

  const formatTime = (date) => {
    try {
      return new Intl.DateTimeFormat('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(new Date(date));
    } catch (_formatError) {
      return new Date().toLocaleTimeString('ko-KR');
    }
  };

  return (
    <Box>
      {/* 환영 메시지 */}
      <WelcomeCard>
        <Grid container alignItems="center" spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              👋 안녕하세요, {user?.name || '관리자'}님!
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              NewStep 관리자 대시보드에 오신 것을 환영합니다.
            </Typography>
            <Typography variant="body1" color="text.secondary">
              📊 실시간 통계와 관리 도구를 통해 효율적으로 콘텐츠를 관리하세요.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box textAlign="center">
              <Typography variant="caption" color="text.secondary">
                마지막 업데이트
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="primary">
                {formatTime(lastUpdate)}
              </Typography>
              <Chip 
                label="실시간" 
                color="success" 
                size="small" 
                sx={{ mt: 1 }}
              />
            </Box>
          </Grid>
        </Grid>
      </WelcomeCard>

      {/* 주요 통계 카드들 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard>
            <StatIcon>📰</StatIcon>
            <StatInfo>
              <StatNumber>{defaultStats.totalArticles}</StatNumber>
              <StatLabel>총 기사 수</StatLabel>
            </StatInfo>
          </StatCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard>
            <StatIcon>👀</StatIcon>
            <StatInfo>
              <StatNumber>{defaultStats.totalViews.toLocaleString()}</StatNumber>
              <StatLabel>총 조회수</StatLabel>
            </StatInfo>
          </StatCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard>
            <StatIcon>❤️</StatIcon>
            <StatInfo>
              <StatNumber>{defaultStats.totalLikes.toLocaleString()}</StatNumber>
              <StatLabel>총 좋아요</StatLabel>
            </StatInfo>
          </StatCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard>
            <StatIcon>👥</StatIcon>
            <StatInfo>
              <StatNumber>{defaultStats.totalMembers}</StatNumber>
              <StatLabel>총 회원 수</StatLabel>
            </StatInfo>
          </StatCard>
        </Grid>
      </Grid>

      {/* 오늘의 통계 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, borderRadius: '16px' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              📅 오늘의 활동
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box textAlign="center" sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {defaultStats.todayArticles}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    새 기사
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center" sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {defaultStats.todayMembers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    신규 회원
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, borderRadius: '16px' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              📊 운영 지표
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box textAlign="center" sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {defaultStats.categories}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    카테고리
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center" sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {defaultStats.totalMembers > 0 ? Math.round((defaultStats.totalLikes / defaultStats.totalMembers) * 100) / 100 : 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    회원당 평균 좋아요
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>

      {/* 학습 통계 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, borderRadius: '16px' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              📚 학습 통계
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                총 저장된 단어
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {defaultStats.totalWords}
                </Typography>
                <Chip label="words" size="small" color="primary" />
              </Box>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                평균 읽은 기사 수
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {defaultStats.avgReadArticles}
                </Typography>
                <Chip label="articles" size="small" color="success" />
              </Box>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                평균 저장 단어 수
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {defaultStats.avgSavedWords}
                </Typography>
                <Chip label="words/user" size="small" color="warning" />
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, borderRadius: '16px' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              📊 사용자 활동 분석
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                읽기 활동 수준
              </Typography>
              <Box sx={{ mb: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">높음 (15+ 기사)</Typography>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    {defaultUserAnalytics.usersByReadingFrequency.high}명
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={defaultStats.totalMembers > 0 ? (defaultUserAnalytics.usersByReadingFrequency.high / defaultStats.totalMembers) * 100 : 0}
                  color="success"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              
              <Box sx={{ mb: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">보통 (5-14 기사)</Typography>
                  <Typography variant="body2" fontWeight="bold" color="warning.main">
                    {defaultUserAnalytics.usersByReadingFrequency.medium}명
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={defaultStats.totalMembers > 0 ? (defaultUserAnalytics.usersByReadingFrequency.medium / defaultStats.totalMembers) * 100 : 0}
                  color="warning"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">낮음 (5개 미만)</Typography>
                  <Typography variant="body2" fontWeight="bold" color="error.main">
                    {defaultUserAnalytics.usersByReadingFrequency.low}명
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={defaultStats.totalMembers > 0 ? (defaultUserAnalytics.usersByReadingFrequency.low / defaultStats.totalMembers) * 100 : 0}
                  color="error"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                학습 활동 수준
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Chip 
                  label={`활발: ${defaultUserAnalytics.usersByLearningActivity.active}명`}
                  color="success" 
                  size="small"
                />
                <Chip 
                  label={`보통: ${defaultUserAnalytics.usersByLearningActivity.moderate}명`}
                  color="warning" 
                  size="small"
                />
                <Chip 
                  label={`소극적: ${defaultUserAnalytics.usersByLearningActivity.passive}명`}
                  color="default" 
                  size="small"
                />
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* 추가 운영 지표 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, borderRadius: '16px' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              🎯 참여도 지표
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                전체 참여율
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {defaultStats.totalMembers > 0 ? Math.round((defaultStats.totalLikes / (defaultStats.totalMembers * defaultStats.totalArticles)) * 100) || 0 : 0}%
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                활성 사용자 비율
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {defaultStats.totalMembers > 0 ? Math.round((defaultUserAnalytics.usersByLearningActivity.active / defaultStats.totalMembers) * 100) || 0 : 0}%
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, borderRadius: '16px' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              📈 성장 지표
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                일일 성장률
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {defaultStats.totalMembers > 0 ? Math.round((defaultStats.todayMembers / defaultStats.totalMembers) * 100) || 0 : 0}%
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                콘텐츠 증가율
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="info.main">
                {defaultStats.totalArticles > 0 ? Math.round((defaultStats.todayArticles / defaultStats.totalArticles) * 100) || 0 : 0}%
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, borderRadius: '16px' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              🔍 사용자 인사이트
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                고성과 사용자 비율
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {defaultStats.totalMembers > 0 ? Math.round((defaultUserAnalytics.usersByReadingFrequency.high / defaultStats.totalMembers) * 100) || 0 : 0}%
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                평균 학습 완료도
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {defaultStats.avgSavedWords > 0 ? Math.min(Math.round((defaultStats.avgSavedWords / 100) * 100), 100) : 0}%
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* 카테고리별 통계 */}
      <Card sx={{ p: 3, borderRadius: '16px', mb: 4 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          📂 카테고리별 성과
        </Typography>
        <Grid container spacing={2}>
          {categoryStats.length > 0 ? categoryStats.map((category, index) => (
            <Grid item xs={12} sm={6} md={4} key={category.id}>
              <Card 
                sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: index % 2 === 0 ? '#f8f9fa' : '#fff',
                  border: '1px solid #e0e0e0'
                }}
              >
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {category.name}
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">기사 수</Typography>
                  <Typography variant="body2" fontWeight="bold">{category.count}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">조회수</Typography>
                  <Typography variant="body2" fontWeight="bold">{(category.totalViews || 0).toLocaleString()}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">좋아요</Typography>
                  <Typography variant="body2" fontWeight="bold">{(category.totalLikes || 0).toLocaleString()}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">참여율</Typography>
                  <Chip 
                    label={`${category.avgEngagement || 0}%`}
                    size="small"
                    color={(category.avgEngagement || 0) > 5 ? 'success' : (category.avgEngagement || 0) > 2 ? 'warning' : 'default'}
                  />
                </Box>
              </Card>
            </Grid>
          )) : (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                카테고리 데이터가 없습니다.
              </Typography>
            </Grid>
          )}
        </Grid>
      </Card>
    </Box>
  );
};

export default DashboardStats; 