import React, { useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import MainLayout from '../components/layout/MainLayout';
import SearchForm from '../components/SearchForm';
import ResultsDisplay from '../components/ResultsDisplay';
import { Search as SearchIcon } from '@mui/icons-material';

const MainPage: React.FC = () => {
  const [searchResults, setSearchResults] = useState(null);

  const handleSearch = (results: any) => {
    setSearchResults(results);
  };

  return (
    <MainLayout>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <SearchIcon sx={{ fontSize: 32, color: '#3b82f6' }} />
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              color: '#1e293b',
              fontSize: { xs: '1.5rem', md: '1.75rem' }
            }}
          >
            Facility Search
          </Typography>
        </Box>
        <Typography variant="body2" color="textSecondary">
          Search for facilities using multiple providers
        </Typography>
      </Box>

      {/* Search Form */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <SearchForm onSearch={handleSearch} />
      </Paper>

      {/* Results Display */}
      <ResultsDisplay results={searchResults} />
    </MainLayout>
  );
};

export default MainPage;