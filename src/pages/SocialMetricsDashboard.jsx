import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';
import { getFunctions, httpsCallable } from 'firebase/functions';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const SocialMetricsDashboard = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState(7);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`https://generatesocialreport-tdblwekz3q-uc.a.run.app?days=${period}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setReportData(data);
    } catch (err) {
      console.error('소셜 리포트 로드 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [period]);

  const handlePeriodChange = (event) => {
    setPeriod(event.target.value);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          소셜 메트릭 데이터를 불러오는 중...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          데이터를 불러오는 중 오류가 발생했습니다: {error}
        </Alert>
      </Container>
    );
  }

  if (!reportData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">
          데이터가 없습니다.
        </Alert>
      </Container>
    );
  }

  // 차트 데이터 준비
  const shareChartData = Object.entries(reportData.sharesByPlatform || {}).map(([platform, count]) => ({
    platform,
    shares: count
  }));

  const crawlerChartData = Object.entries(reportData.crawlersByType || {}).map(([type, count]) => ({
    type,
    accesses: count
  }));

  const pieChartData = Object.entries(reportData.sharesByPlatform || {}).map(([platform, count]) => ({
    name: platform,
    value: count
  }));

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          📊 소셜 미디어 메트릭 대시보드
        </Typography>
        
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>기간</InputLabel>
          <Select
            value={period}
            label="기간"
            onChange={handlePeriodChange}
          >
            <MenuItem value={1}>1일</MenuItem>
            <MenuItem value={7}>7일</MenuItem>
            <MenuItem value={30}>30일</MenuItem>
            <MenuItem value={90}>90일</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* 요약 카드들 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                총 공유 수
              </Typography>
              <Typography variant="h4" component="div">
                {reportData.summary.totalShares}
              </Typography>
              <Typography variant="body2">
                {reportData.period}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                크롤러 접근
              </Typography>
              <Typography variant="h4" component="div">
                {reportData.summary.totalCrawlerAccess}
              </Typography>
              <Typography variant="body2">
                소셜 플랫폼 크롤러
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                공유된 기사
              </Typography>
              <Typography variant="h4" component="div">
                {reportData.summary.uniqueArticles}
              </Typography>
              <Typography variant="body2">
                고유 기사 수
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                평균 공유율
              </Typography>
              <Typography variant="h4" component="div">
                {reportData.summary.uniqueArticles > 0 
                  ? (reportData.summary.totalShares / reportData.summary.uniqueArticles).toFixed(1)
                  : '0'
                }
              </Typography>
              <Typography variant="body2">
                기사당 평균
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 차트들 */}
      <Grid container spacing={3}>
        {/* 플랫폼별 공유 수 바 차트 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                플랫폼별 공유 수
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={shareChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="platform" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="shares" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 크롤러 타입별 접근 수 바 차트 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                크롤러 타입별 접근 수
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={crawlerChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="accesses" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 공유 플랫폼 분포 파이 차트 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                공유 플랫폼 분포
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 인기 기사 목록 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                인기 기사 TOP 10
              </Typography>
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {reportData.topArticles.map((article, index) => (
                  <Box
                    key={article.articleId}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1,
                      borderBottom: index < reportData.topArticles.length - 1 ? '1px solid #eee' : 'none'
                    }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        #{index + 1}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {article.articleId.substring(0, 8)}...
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={`공유 ${article.shares}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={`크롤러 ${article.crawlers}`}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          마지막 업데이트: {new Date(reportData.generated).toLocaleString('ko-KR')}
        </Typography>
      </Box>
    </Container>
  );
};

export default SocialMetricsDashboard;