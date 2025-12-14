import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import { theme } from './theme';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Determine basename based on environment
// Use "/justlist" for GitHub Pages, empty for local development
const isGitHubPages = window.location.hostname === 'techyz-software-solutions-pvt-ltd.github.io' ||
                      window.location.hostname.includes('github.io');
const basename = isGitHubPages ? '/justlist' : '';

console.log('🌐 Router Configuration:', {
  hostname: window.location.hostname,
  isGitHubPages,
  basename,
  pathname: window.location.pathname
});

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter basename={basename}>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

