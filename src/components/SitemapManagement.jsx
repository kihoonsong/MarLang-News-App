// 사이트맵 관리 컴포넌트
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Link,
  Paper
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Launch as LaunchIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  Map as MapIcon
} from '@mui/icons-material';
import { 
  requestSitemapUpdate, 
  checkSitemapStatus, 
  getSearchConsoleSubmissionUrl,
  debugSitemapInfo 
} from '../utils/sitemapUtils';

const SitemapManagement = ({ setSnackbar }) => {
  const [loading, setLoading] = useState(false);
  const [sitemapStatus, setSitemapStatus] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [updateHistory, setUpdateHistory] = useState([]);

  // 컴포넌트 마운트 시 사이트맵 상태 확인
  useEffect(() => {
    checkCurrentSitemapStatus();
  }, []);

  // 현재 사이트맵 상태 확인
  const checkCurrentSitemapStatus = async () => {
    try {
      setLoading(true);
      const status = await checkSitemapStatus();
      setSitemapStatus(status);
      
      if (status.exists && status.lastModified) {
        setLastUpdate(status.lastModified);
      }
    } catch (error) {
      console.error('사이트맵 상태 확인 실패:', error);
      setSnackbar({
        open: true,
        message: '사이트맵 상태 확인에 실패했습니다.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // 수동 사이트맵 업데이트
  const handleManualUpdate = async () => {
    try {
      setLoading(true);
      
      const result = await requestSitemapUpdate();
      
      if (result.success) {
        setSnackbar({
          open: true,
          message: `사이트맵이 성공적으로 업데이트되었습니다. (${result.stats?.totalUrls || 0}개 URL)`,
          severity: 'success'
        });
        
        // 업데이트 기록 추가
        const newUpdate = {
          timestamp: new Date(),
          type: 'manual',
          success: true,
          stats: result.stats
        };
        setUpdateHistory(prev => [newUpdate, ...prev.slice(0, 4)]); // 최근 5개만 유지
        
        // 상태 새로고침
        await checkCurrentSitemapStatus();
      } else {
        setSnackbar({
          open: true,
          message: `사이트맵 업데이트에 실패했습니다: ${result.message}`,
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('사이트맵 업데이트 실패:', error);
      setSnackbar({
        open: true,
        message: '사이트맵 업데이트 중 오류가 발생했습니다.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Google Search Console 열기
  const openSearchConsole = () => {
    const url = getSearchConsoleSubmissionUrl();
    window.open(url, '_blank');
  };

  // 사이트맵 파일 열기
  const openSitemapFile = () => {
    window.open('https://marlang-app.web.app/sitemap.xml', '_blank');
  };

  // 디버깅 정보 출력
  const handleDebugInfo = async () => {
    try {
      await debugSitemapInfo();
      setSnackbar({
        open: true,
        message: '디버깅 정보가 콘솔에 출력되었습니다.',
        severity: 'info'
      });
    } catch (error) {
      console.error('디버깅 실패:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        🗺️ 사이트맵 관리
      </Typography>

      <Grid container spacing={3}>
        {/* 사이트맵 상태 카드 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 현재 상태
              </Typography>
              
              {loading ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress size={24} />
                </Box>
              ) : sitemapStatus ? (
                <Box>
                  <Box display="flex" alignItems="center" mb={2}>
                    {sitemapStatus.exists ? (
                      <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                    ) : (
                      <ErrorIcon color="error" sx={{ mr: 1 }} />
                    )}
                    <Typography variant="body1">
                      {sitemapStatus.exists ? '사이트맵 존재함' : '사이트맵 없음'}
                    </Typography>
                  </Box>
                  
                  {sitemapStatus.exists && (
                    <Box>
                      {sitemapStatus.lastModified && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          마지막 수정: {sitemapStatus.lastModified.toLocaleString('ko-KR')}
                        </Typography>
                      )}
                      {sitemapStatus.size && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          파일 크기: {Math.round(sitemapStatus.size / 1024)}KB
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              ) : (
                <Alert severity="warning">
                  사이트맵 상태를 확인할 수 없습니다.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 빠른 액션 카드 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🚀 빠른 액션
              </Typography>
              
              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
                  onClick={handleManualUpdate}
                  disabled={loading}
                  fullWidth
                >
                  사이트맵 수동 업데이트
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<LaunchIcon />}
                  onClick={openSearchConsole}
                  fullWidth
                >
                  Google Search Console 열기
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<MapIcon />}
                  onClick={openSitemapFile}
                  fullWidth
                >
                  사이트맵 파일 보기
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 자동 업데이트 정보 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ⚙️ 자동 업데이트 설정
              </Typography>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                사이트맵은 다음 상황에서 자동으로 업데이트됩니다:
              </Alert>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="기사 발행 시" 
                    secondary="새 기사가 'published' 상태로 변경될 때 자동 업데이트"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="기사 삭제 시" 
                    secondary="발행된 기사가 삭제될 때 자동 업데이트"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <ScheduleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="일일 스케줄 업데이트" 
                    secondary="매일 오전 2시 (한국시간) 자동 업데이트"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* 업데이트 기록 */}
        {updateHistory.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📝 최근 업데이트 기록
                </Typography>
                
                <List>
                  {updateHistory.map((update, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemIcon>
                          {update.success ? (
                            <CheckCircleIcon color="success" />
                          ) : (
                            <ErrorIcon color="error" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={`${update.type === 'manual' ? '수동' : '자동'} 업데이트`}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {update.timestamp.toLocaleString('ko-KR')}
                              </Typography>
                              {update.stats && (
                                <Typography variant="body2" color="text.secondary">
                                  총 {update.stats.totalUrls}개 URL (기사: {update.stats.articles}개)
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < updateHistory.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* 도움말 및 링크 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="h6" gutterBottom>
              💡 도움말 및 유용한 링크
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>
                  SEO 도구
                </Typography>
                <List dense>
                  <ListItem disablePadding>
                    <Link 
                      href="https://search.google.com/search-console" 
                      target="_blank" 
                      rel="noopener"
                    >
                      Google Search Console
                    </Link>
                  </ListItem>
                  <ListItem disablePadding>
                    <Link 
                      href="https://www.xml-sitemaps.com/" 
                      target="_blank" 
                      rel="noopener"
                    >
                      XML Sitemap Validator
                    </Link>
                  </ListItem>
                </List>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>
                  개발자 도구
                </Typography>
                <List dense>
                  <ListItem disablePadding>
                    <Button 
                      size="small" 
                      onClick={handleDebugInfo}
                      startIcon={<InfoIcon />}
                    >
                      콘솔 디버깅 정보
                    </Button>
                  </ListItem>
                  <ListItem disablePadding>
                    <Button 
                      size="small" 
                      onClick={checkCurrentSitemapStatus}
                      startIcon={<RefreshIcon />}
                    >
                      상태 새로고침
                    </Button>
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SitemapManagement;