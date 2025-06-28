import React from 'react';
import { Typography, Box } from '@mui/material';

const HomeSimple = () => {
  return (
    <Box sx={{ padding: 4, textAlign: 'center' }}>
      <Typography variant="h3" component="h1" gutterBottom>
        🏠 Home
      </Typography>
      <Typography variant="body1">
        Welcome to MarLang News! This is a simplified home page.
      </Typography>
      <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
        If you can see this, the basic routing is working correctly.
      </Typography>
    </Box>
  );
};

export default HomeSimple;