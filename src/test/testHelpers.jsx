import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';

const theme = createTheme();

// Custom render helpers for common providers
export const renderWithRouter = (ui, options = {}) => {
  return render(ui, {
    wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
    ...options,
  });
};

export const renderWithTheme = (ui, options = {}) => {
  return render(ui, {
    wrapper: ({ children }) => (
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    ),
    ...options,
  });
};

export const renderWithProviders = (ui, options = {}) => {
  return render(ui, {
    wrapper: ({ children }) => (
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          {children}
        </ThemeProvider>
      </BrowserRouter>
    ),
    ...options,
  });
};