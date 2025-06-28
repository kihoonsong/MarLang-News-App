import React from 'react';
import { Typography } from '@mui/material';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';

const DateSimple = () => {
  return (
    <>
      <MobileNavigation />
      <MobileContentWrapper>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Typography variant="h3" component="h1" gutterBottom>
            📅 Date Page
          </Typography>
          <Typography variant="body1">
            This is a simple date page to test if the route works.
          </Typography>
          <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
            <Typography variant="h6">
              If you can see this, the Date route is working!
            </Typography>
          </div>
        </div>
      </MobileContentWrapper>
    </>
  );
};

export default DateSimple;