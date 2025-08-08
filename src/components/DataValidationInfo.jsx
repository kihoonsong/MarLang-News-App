import React from 'react';
import { 
  Card, Typography, Box, Chip, Alert, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const DataValidationInfo = ({ stats = {} }) => {
  // 개발 환경에서만 표시
  if (!import.meta.env.DEV || !stats._debug) {
    return null;
  }

  const { _debug } = stats;
  const {
    totalArticleViews = 0,
    totalUserViewRecords = 0,
    viewsDataSource = 'unknown'
  } = _debug;

  const difference = Math.abs(totalArticleViews - totalUserViewRecords);
  const isDataConsistent = difference === 0;
  const discrepancyPercentage = totalArticleViews > 0 
    ? ((difference / totalArticleViews) * 100).toFixed(1) 
    : 0;

  return (
    <Card sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6" fontWeight="bold">
              🔍 데이터 검증 정보 (개발용)
            </Typography>
            <Chip 
              label={isDataConsistent ? "데이터 일치" : "데이터 불일치"} 
              color={isDataConsistent ? "success" : "warning"}
              size="small"
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            {/* 데이터 소스 정보 */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                📊 현재 대시보드 데이터 소스
              </Typography>
              <Chip 
                label={`조회수 데이터: ${viewsDataSource}`}
                color="primary"
                size="small"
              />
            </Box>

            {/* 데이터 비교 */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                📈 데이터 비교
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    기사별 조회수 합계
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    {totalArticleViews.toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    사용자 조회 기록 합계
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="secondary">
                    {totalUserViewRecords.toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    차이
                  </Typography>
                  <Typography 
                    variant="h6" 
                    fontWeight="bold" 
                    color={isDataConsistent ? "success.main" : "warning.main"}
                  >
                    {difference.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* 일치성 분석 */}
            {!isDataConsistent && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  데이터 불일치 분석 ({discrepancyPercentage}% 차이)
                </Typography>
                {totalArticleViews > totalUserViewRecords ? (
                  <Typography variant="body2">
                    • 기사 조회수가 사용자 기록보다 {difference.toLocaleString()}개 많습니다.<br/>
                    • 가능한 원인: 비로그인 사용자 조회, 중복 조회, 프리렌더링 조회수
                  </Typography>
                ) : (
                  <Typography variant="body2">
                    • 사용자 기록이 기사 조회수보다 {difference.toLocaleString()}개 많습니다.<br/>
                    • 가능한 원인: 삭제된 기사의 조회 기록, 데이터 동기화 지연
                  </Typography>
                )}
              </Alert>
            )}

            {isDataConsistent && (
              <Alert severity="success">
                <Typography variant="body2">
                  ✅ 데이터가 완벽히 일치합니다. 대시보드가 정확한 데이터를 표시하고 있습니다.
                </Typography>
              </Alert>
            )}

            {/* 권장사항 */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                💡 조회수 계산 방식
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 현재 대시보드는 실제 기사 조회수(articles.views)를 기반으로 계산됩니다.<br/>
                • <strong>로그인/비로그인 사용자 모두 포함</strong>된 정확한 데이터입니다.<br/>
                • 세션 기반 중복 방지로 같은 세션에서 중복 조회는 제외됩니다.<br/>
                • 봇 트래픽은 자동으로 필터링됩니다.<br/>
                • 사용자별 분석은 개별 조회 기록(viewRecords)을 사용합니다.
              </Typography>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Card>
  );
};

export default DataValidationInfo;