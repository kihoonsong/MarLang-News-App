import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper 
        elevation={3} 
        sx={{ 
          width: '100%', 
          p: 4, 
          textAlign: 'center',
          borderRadius: 3
        }}
      >
        <ErrorOutlineIcon 
          sx={{ 
            fontSize: 80, 
            color: 'error.main', 
            mb: 2 
          }} 
        />
        
        <Typography variant="h1" component="h1" sx={{ fontSize: '4rem', fontWeight: 'bold', color: 'error.main', mb: 1 }}>
          404
        </Typography>
        
        <Typography variant="h5" component="h2" sx={{ mb: 2, color: 'text.primary' }}>
          페이지를 찾을 수 없습니다
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
          <br />
          URL을 확인하시거나 홈페이지로 돌아가세요.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
            sx={{ minWidth: '140px' }}
          >
            홈으로 이동
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ minWidth: '140px' }}
          >
            이전 페이지
          </Button>
        </Box>
        
        <Typography variant="caption" sx={{ display: 'block', mt: 3, color: 'text.disabled' }}>
          NEWStep Eng News - 매일 뉴스로 배우는 영어
        </Typography>
      </Paper>
    </Container>
  );
};

export default NotFound;