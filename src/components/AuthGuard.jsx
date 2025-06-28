import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Container,
  Card,
  CardContent,
  CardActions,
  Divider
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LockIcon from '@mui/icons-material/Lock';

const AuthGuard = ({ children, feature = 'this feature' }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();

  console.log('AuthGuard:', { isAuthenticated, user, isLoading, feature });

  // 로딩 중일 때는 로딩 표시
  if (isLoading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h6">Loading...</Typography>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (isAuthenticated) {
    return children;
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Card elevation={3} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ textAlign: 'center', p: 4 }}>
          <Box sx={{ mb: 3 }}>
            <LockIcon sx={{ fontSize: 60, color: '#1976d2', mb: 2 }} />
            <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Authentication Required
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Please sign in to access {feature}
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Get Started Today
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Join MarLang to save articles, track your vocabulary, and personalize your learning experience.
            </Typography>
          </Box>
        </CardContent>

        <CardActions sx={{ p: 3, pt: 0, flexDirection: 'column', gap: 2 }}>
          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={<LoginIcon />}
            onClick={() => navigate('/login')}
            sx={{ 
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}
          >
            Sign In
          </Button>
          
          <Button
            variant="outlined"
            fullWidth
            size="large"
            startIcon={<PersonAddIcon />}
            onClick={() => navigate('/signup')}
            sx={{ 
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}
          >
            Create Account
          </Button>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Free to join • No credit card required
          </Typography>
        </CardActions>
      </Card>
    </Container>
  );
};

export default AuthGuard;