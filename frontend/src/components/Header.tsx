import React, { useState, useEffect, useCallback } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button, 
  Box, 
  IconButton,
  Drawer, 
  List, 
  ListItem, 
  ListItemText, 
  Checkbox, 
  FormControlLabel, 
  ListItemButton,
  Chip,
  Alert,
  Pagination,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import { defaultFields } from '../data/fields';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { facilitiesAPI } from '../services/api';
import { FormTextField } from './forms';

interface SearchHistoryItem {
  id: number;
  place_type: string;
  city: string;
  country: string;
  max_results: number;
  results_count: number;
  search_query: string;
  created_at: string;
}

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = React.useState(false);
  const [tabValue, setTabValue] = React.useState(0);
  const toggle = (v: boolean) => () => setOpen(v);
  const [selected, setSelected] = React.useState<string[]>(() => {
    const saved = localStorage.getItem('selected_fields');
    return saved ? JSON.parse(saved) : defaultFields;
  });
  
  // Search history state
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [totalHistoryPages, setTotalHistoryPages] = useState(0);
  
  // Search results state
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<SearchHistoryItem | null>(null);
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<SearchHistoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Settings apply state
  const [showApplySuccess, setShowApplySuccess] = useState(false);
  const [showDataSourcesSuccess, setShowDataSourcesSuccess] = useState(false);

  const onToggleField = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.checked ? Array.from(new Set([...selected, key])) : selected.filter(k => k !== key);
    setSelected(next);
    localStorage.setItem('selected_fields', JSON.stringify(next));
  };

  const onReset = () => {
    setSelected(defaultFields);
    localStorage.setItem('selected_fields', JSON.stringify(defaultFields));
  };

  const handleApplySettings = () => {
    // Show success indication
    setShowApplySuccess(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowApplySuccess(false);
    }, 3000);
    
    // Don't close the drawer - let user continue working
  };

  const handleApplyDataSources = () => {
    // Show success indication
    setShowDataSourcesSuccess(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowDataSourcesSuccess(false);
    }, 3000);
    
    // Don't close the drawer - let user continue working
  };

  // Load search history for authenticated users with pagination
  const loadSearchHistory = useCallback(async (page: number = 0) => {
    if (!user) {
      console.log('[Search History] No user logged in, skipping history load');
      return;
    }
    
    console.log('[Search History] Loading page', page, 'for user:', user.username);
    console.log('[Search History] API URL:', process.env.REACT_APP_API_URL || 'http://localhost:8000');
    setIsLoadingHistory(true);
    try {
      const limit = 5; // Show 5 items per page
      const history = await facilitiesAPI.getHistory(page * limit, limit);
      console.log('[Search History] API Response:', history.data);
      console.log('[Search History] Received', history.data.length, 'items');
      
      if (Array.isArray(history.data) && history.data.length > 0) {
        setSearchHistory(history.data);
        
        // Check if there are more items by requesting the next page
        if (history.data.length === limit) {
          try {
            const nextPageHistory = await facilitiesAPI.getHistory((page + 1) * limit, 1);
            // If we get any results on the next page, show pagination
            const hasMorePages = nextPageHistory.data.length > 0;
            setTotalHistoryPages(hasMorePages ? page + 2 : page + 1);
          } catch {
            // If next page request fails, assume no more pages
            setTotalHistoryPages(page + 1);
          }
        } else {
          // If we got less than 5 items, this is the last page
          setTotalHistoryPages(page + 1);
        }
      } else {
        console.log('[Search History] No history items found');
        setSearchHistory([]);
        setTotalHistoryPages(1);
      }
    } catch (error: any) {
      console.error('[Search History] Failed to load:', error);
      console.error('[Search History] Error details:', error.response?.data || error.message);
      setSearchHistory([]);
      setTotalHistoryPages(1);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user]);

  // Handle pagination change
  const handleHistoryPageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setHistoryPage(page - 1); // Pagination is 1-based, but our API is 0-based
    loadSearchHistory(page - 1);
  };

  // Load search history when user changes or drawer opens
  useEffect(() => {
    if (user && open && tabValue === 1) {
      loadSearchHistory(0);
    }
  }, [user, open, tabValue, loadSearchHistory]);

  // Listen for search completion events to refresh history
  useEffect(() => {
    const handleSearchCompleted = () => {
      if (user && tabValue === 1) {
        loadSearchHistory(0);
        setHistoryPage(0);
      }
    };

    window.addEventListener('searchCompleted', handleSearchCompleted);
    return () => {
      window.removeEventListener('searchCompleted', handleSearchCompleted);
    };
  }, [user, tabValue, loadSearchHistory]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Load search history when switching to Search History tab
    if (newValue === 1 && user) {
      loadSearchHistory(0);
      setHistoryPage(0);
    }
  };

  // Handle search history item click
  const handleHistoryItemClick = async (item: SearchHistoryItem) => {
    setSelectedHistoryItem(item);
    setIsLoadingResults(true);
    setShowSearchResults(true);
    
    try {
      // Get stored facilities for this search history item (no API key needed)
      const results = await facilitiesAPI.getSearchHistoryFacilities(item.id);
      
      setSearchResults(results.data || []);
    } catch (error) {
      console.error('Failed to load stored search results:', error);
      setSearchResults([]);
    } finally {
      setIsLoadingResults(false);
    }
  };

  // Handle back to settings
  const handleBackToSettings = () => {
    setShowSearchResults(false);
    setSelectedHistoryItem(null);
    setSearchResults([]);
  };

  // Handle delete confirmation
  const handleDeleteClick = (item: SearchHistoryItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    
    setIsDeleting(true);
    try {
      await facilitiesAPI.deleteSearchHistory(itemToDelete.id);
      
      // Remove from local state
      setSearchHistory(prev => prev.filter(item => item.id !== itemToDelete.id));
      
      // Close dialog
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Failed to delete search history:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  return (
    <AppBar position="static" color="inherit" enableColorOnDark>
      <Toolbar>
        <Box sx={{ flexGrow: 1 }}>
        <Typography
            variant="h4"
          component="div"
            onClick={() => {
              // Trigger subtle giggle animation
              const element = document.getElementById('justlist-text');
              if (element) {
                element.style.animation = 'none';
                // Trigger reflow to reset animation
                void element.offsetHeight;
                element.style.animation = 'giggle 0.4s ease-in-out';
              }
              // Check if already on home page
              if (location.pathname === '/') {
                // Refresh the page if already on home
                setTimeout(() => {
                  window.location.reload();
                }, 200);
              } else {
                // Navigate to home page if on other pages
                setTimeout(() => {
                  navigate('/');
                }, 200);
              }
            }}
            id="justlist-text"
            role="button"
            tabIndex={0}
            title="Go to home page"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                // Trigger subtle giggle animation
                const element = document.getElementById('justlist-text');
                if (element) {
                  element.style.animation = 'none';
                  void element.offsetHeight;
                  element.style.animation = 'giggle 0.4s ease-in-out';
                }
                // Check if already on home page
                if (location.pathname === '/') {
                  // Refresh the page if already on home
                  setTimeout(() => {
                    window.location.reload();
                  }, 200);
                } else {
                  // Navigate to home page if on other pages
                  setTimeout(() => {
                    navigate('/');
                  }, 200);
                }
              }
            }}
          sx={{
            fontFamily: '"Shadows Into Light", cursive',
              fontSize: '2.5rem',
            cursor: 'pointer',
              transition: 'opacity 0.2s ease-in-out',
              display: 'inline-block',
              '&:hover': {
                opacity: 0.8
              },
              '&:focus': {
                outline: '2px solid transparent',
                outlineOffset: '2px',
                borderRadius: '4px'
              },
              '@keyframes giggle': {
                '0%, 100%': {
                  transform: 'rotate(0deg) scale(1)'
                },
                '20%': {
                  transform: 'rotate(-1deg) scale(1.02)'
                },
                '40%': {
                  transform: 'rotate(1deg) scale(1.02)'
                },
                '60%': {
                  transform: 'rotate(-0.5deg) scale(1.01)'
                },
                '80%': {
                  transform: 'rotate(0.5deg) scale(1.01)'
                }
              }
            }}
        >
          JustList
        </Typography>
        </Box>
        {!(location.pathname === '/login' || location.pathname === '/register') && (
          <>
            <IconButton color="inherit" onClick={toggle(true)} sx={{ mr: 1 }}>
              <SettingsIcon />
            </IconButton>
            <Box>
          {user ? (
            <>
                  <Button color="inherit" sx={{ mr: 2 }}>
                    Welcome, {user.username}
                  </Button>
                  <Button color="inherit" onClick={logout}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button color="inherit" onClick={() => navigate('/login')}>
                    Login
                  </Button>
                  <Button color="inherit" onClick={() => navigate('/register')}>
                    Register
                  </Button>
                </>
              )}
            </Box>
          </>
        )}
      </Toolbar>
      <Drawer 
        anchor="right" 
        open={open} 
        onClose={toggle(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: '20%', md: '20%', lg: '30%', xl: '30%' },
            borderRadius: 0
          }
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }} role="presentation" onKeyDown={toggle(false)}>
          {/* Mobile Header with Back Button */}
          {isMobile && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              p: 2, 
              borderBottom: 1, 
              borderColor: 'divider',
              backgroundColor: 'background.paper'
            }}>
              <IconButton onClick={toggle(false)} sx={{ mr: 1 }}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h6" fontWeight={700}>
                Settings & Help
              </Typography>
            </Box>
          )}
          
          <Box sx={{ p: 2, pb: 0 }}>
            {!isMobile && (
              <Typography variant="h6" gutterBottom fontWeight={700}>Settings & Help</Typography>
            )}
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="settings tabs"
              variant={isMobile ? "scrollable" : "standard"}
              scrollButtons={isMobile ? "auto" : false}
              allowScrollButtonsMobile
              sx={{
                minHeight: isMobile ? 48 : 'auto',
                '& .MuiTabs-scrollButtons': {
                  '&.Mui-disabled': { opacity: 0.3 }
                }
              }}
            >
              <Tab label="Listing" sx={{ minWidth: isMobile ? 90 : 'auto' }} />
              <Tab label="Search History" disabled={!user} sx={{ minWidth: isMobile ? 120 : 'auto' }} />
              <Tab label="Data Sources" disabled={!user} sx={{ minWidth: isMobile ? 120 : 'auto' }} />
              <Tab label="Help" sx={{ minWidth: isMobile ? 80 : 'auto' }} />
            </Tabs>
          </Box>
          
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            {tabValue === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                  Display Fields Configuration
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                  Select which information fields to display in your search results. 
                  Choose from Google Places API data and additional web-scraped information.
                </Typography>

                {/* Summary Stats */}
                <Box sx={{ 
                  mb: 3, 
                  p: 2, 
                  bgcolor: 'primary.50', 
                  borderRadius: 2, 
                  border: '1px solid',
                  borderColor: 'primary.200'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600} color="primary.main">
                      Selection Summary
                    </Typography>
                    <Chip 
                      label={`${selected.length} of 10 fields selected`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Essential fields are pre-selected for optimal results
                  </Typography>
                </Box>

                {/* Field Categories */}
                {Object.entries({
                  'Basic Information': { name: 'Facility Name', place_id: 'Place ID' },
                  'Contact Information': { formatted_phone_number: 'Phone', website: 'Website' },
                  'Location Details': { formatted_address: 'Address', vicinity: 'Vicinity' },
                  'Ratings & Reviews': { rating: 'Rating', user_ratings_total: 'Total Reviews' }
                }).map(([category, fields]) => (
                  <Box key={category} sx={{ mb: 3 }}>
                    {/* Category Header */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      mb: 2,
                      p: 1.5,
                      bgcolor: 'grey.50',
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: 'grey.200'
                    }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 600, 
                          fontSize: '0.9rem',
                          color: 'text.primary',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      >
                        {category}
                      </Typography>
                      <Chip 
                        label={`${Object.entries(fields).filter(([key]) => selected.includes(key)).length}/${Object.keys(fields).length}`}
                        size="small"
                        color="default"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    </Box>

                    {/* Field Items */}
                    <Box sx={{ pl: 1 }}>
                      {Object.entries(fields).map(([key, label]) => (
                        <Box key={key} sx={{ mb: 1.5 }}>
                          <FormControlLabel
                            control={
                              <Checkbox 
                                checked={selected.includes(key)} 
                                onChange={onToggleField(key)}
                                size="small"
                                sx={{
                                  '&.Mui-checked': {
                                    color: 'primary.main',
                                  },
                                  '&:hover': {
                                    backgroundColor: 'action.hover',
                                  }
                                }}
                              />
                            }
                            label={
                              <Box sx={{ flex: 1 }}>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: 'text.primary',
                                    lineHeight: 1.4,
                                    cursor: 'pointer',
                                    mb: 0.5
                                  }}
                                >
                                  {label}
                    </Typography>
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    fontSize: '0.75rem',
                                    color: 'text.secondary',
                                    lineHeight: 1.3,
                                    display: 'block',
                                    fontStyle: 'italic'
                                  }}
                                >
                                  {'Field description'}
                    </Typography>
                  </Box>
                            }
                            sx={{
                              width: '100%',
                              py: 1,
                              px: 1.5,
                              borderRadius: 1.5,
                              transition: 'all 0.2s ease-in-out',
                              border: '1px solid',
                              borderColor: selected.includes(key) ? 'primary.200' : 'transparent',
                              bgcolor: selected.includes(key) ? 'primary.50' : 'transparent',
                              '&:hover': {
                                backgroundColor: selected.includes(key) ? 'primary.100' : 'action.hover',
                                transform: 'translateX(4px)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                borderColor: selected.includes(key) ? 'primary.300' : 'grey.300'
                              }
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ))}

                {/* Success Alert */}
                {showApplySuccess && (
                  <Alert 
                    severity="success" 
                    sx={{ 
                      mb: 2,
                      borderRadius: 2,
                      '& .MuiAlert-message': {
                        fontWeight: 500
                      }
                    }}
                  >
                    Settings applied successfully! Your field selections have been saved.
                  </Alert>
                )}

                {/* Action Buttons */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: 2, 
                  mt: 4, 
                  pt: 3, 
                  borderTop: '2px solid', 
                  borderColor: 'divider',
                  bgcolor: 'grey.50',
                  p: 2,
                  borderRadius: 2
                }}>
                  <Button 
                    variant="outlined" 
                    onClick={onReset}
                    size="medium"
                    sx={{ 
                      textTransform: 'none',
                      fontWeight: 500,
                      px: 3,
                      py: 1,
                      borderRadius: 2
                    }}
                  >
                    Reset to Defaults
                  </Button>
                  <Button 
                    variant="contained" 
                    onClick={handleApplySettings}
                    size="medium"
                    sx={{ 
                      textTransform: 'none',
                      fontWeight: 500,
                      px: 3,
                      py: 1,
                      borderRadius: 2
                    }}
                  >
                    Apply Settings
                  </Button>
                </Box>
              </Box>
            )}
            
            {tabValue === 1 && (
              <Box>
                
                {!user ? (
                  <Alert severity="info">
                    Please login to view your search history.
                  </Alert>
                ) : searchHistory.length > 0 ? (
                  <Box>
                    <List dense>
                      {searchHistory.map((item, index) => (
                        <React.Fragment key={item.id}>
                          <ListItem disablePadding>
                            <ListItemButton 
                              sx={{ borderRadius: 1, mb: 0.5 }}
                              onClick={() => handleHistoryItemClick(item)}
                            >
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <Typography variant="body2" fontWeight="medium">
                                      {item.place_type}
                                    </Typography>
                                    <Chip 
                                      label={`${item.city}, ${item.country}`} 
                                      size="small" 
                                      variant="outlined"
                                    />
                                    <Chip 
                                      label={`${item.results_count} results`} 
                                      size="small" 
                                      color="primary"
                                      variant="outlined"
                                    />
                                  </Box>
                                }
                                secondary={
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(item.created_at).toLocaleDateString()} • Max: {item.max_results}
                                  </Typography>
                                }
                              />
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(item);
                                }}
                                sx={{ 
                                  color: 'error.main',
                                  '&:hover': {
                                    backgroundColor: 'error.light',
                                    color: 'error.contrastText'
                                  }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </ListItemButton>
                          </ListItem>
                          {/* Add divider between items, but not after the last item */}
                          {index < searchHistory.length - 1 && (
                            <Divider sx={{ mx: 2, my: 0.5 }} />
                          )}
                        </React.Fragment>
                      ))}
                    </List>
                    
                    {/* Pagination - only show if there are multiple pages */}
                    {totalHistoryPages > 1 && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Pagination
                          count={totalHistoryPages}
                          page={historyPage + 1}
                          onChange={handleHistoryPageChange}
                          color="primary"
                          size="small"
                        />
                      </Box>
                    )}
                  </Box>
                ) : !isLoadingHistory && (
                  <Box>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      No search history yet. Your searches will appear here.
                    </Alert>
                    {!process.env.REACT_APP_API_URL && (
                      <Alert severity="warning">
                        <strong>Backend not configured:</strong> The app is not connected to a backend server. 
                        Search history requires a backend connection. 
                        Please check the deployment documentation.
                      </Alert>
                    )}
                  </Box>
                )}
              </Box>
            )}
            
            {tabValue === 2 && (
              <Box>
                {!user ? (
                  <Alert severity="info">
                    Please login to configure data sources and scrapers.
                  </Alert>
          ) : (
            <>
                    <Typography variant="h6" gutterBottom>
                      Data Sources & Scrapers
                    </Typography>
                    
                    <Typography variant="body2" paragraph color="text.secondary">
                      Configure which data sources to use for facility enrichment. Enable/disable scrapers and manage API keys.
                    </Typography>
                
                {/* Google Places API */}
                <Box sx={{ mb: 3, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Google Places API
                    </Typography>
                    <Chip label="Always Active" color="success" size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Primary data source for basic facility information, ratings, and contact details.
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Status: Required for core functionality • Rate Limit: 1000 requests/day (free)
                  </Typography>
                </Box>

                {/* Foursquare API */}
                <Box sx={{ mb: 3, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Foursquare Places API
                    </Typography>
                    <FormControlLabel
                      control={<Checkbox size="small" />}
                      label="Enable"
                      sx={{ m: 0 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Business directory with 100M+ POIs, user reviews, photos, and detailed categories.
                  </Typography>
                  <FormTextField
                    label="Foursquare API Key"
                    type="password"
                    placeholder="Enter your Foursquare API key"
                    fullWidth
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Rate Limit: 1000 requests/day (free) • <a href="https://developer.foursquare.com/" target="_blank" rel="noopener noreferrer">Get API Key</a>
                  </Typography>
                </Box>

                {/* Yelp API */}
                <Box sx={{ mb: 3, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Yelp Fusion API
                    </Typography>
                    <FormControlLabel
                      control={<Checkbox size="small" />}
                      label="Enable"
                      sx={{ m: 0 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Business reviews, ratings, photos, and detailed business information.
                  </Typography>
                  <FormTextField
                    label="Yelp API Key"
                    type="password"
                    placeholder="Enter your Yelp API key"
                    fullWidth
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Rate Limit: 500 requests/day (free) • <a href="https://www.yelp.com/developers/" target="_blank" rel="noopener noreferrer">Get API Key</a>
                  </Typography>
                </Box>

                {/* OpenStreetMap */}
                <Box sx={{ mb: 3, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      OpenStreetMap (OSM)
                    </Typography>
                    <FormControlLabel
                      control={<Checkbox size="small" defaultChecked />}
                      label="Enable"
                      sx={{ m: 0 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Open-source global business and POI data, completely free with no API key required.
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Status: Free • No API key required • Community-maintained data
                  </Typography>
                </Box>

                {/* Web Scraping */}
                <Box sx={{ mb: 3, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Web Scraping
                    </Typography>
                    <FormControlLabel
                      control={<Checkbox size="small" defaultChecked />}
                      label="Enable"
                      sx={{ m: 0 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Extract additional contact information, social media links, and business details from websites.
                  </Typography>
                  <Alert severity="info" sx={{ mb: 1 }}>
                    <Typography variant="caption">
                      <strong>Legal & Ethical:</strong> Respects robots.txt, uses reasonable delays, and follows terms of service.
                    </Typography>
                  </Alert>
                  <Typography variant="caption" color="text.secondary">
                    Status: Free • Legal compliance enforced • Rate limited for ethical scraping
                  </Typography>
                </Box>

                {/* Social Media APIs */}
                <Typography variant="subtitle2" sx={{ mt: 3, mb: 2, fontWeight: 600, color: 'text.primary' }}>
                  Social Media APIs (Advanced)
                </Typography>

                {/* Facebook API */}
                <Box sx={{ mb: 3, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Facebook Graph API
                    </Typography>
                    <FormControlLabel
                      control={<Checkbox size="small" />}
                      label="Enable"
                      sx={{ m: 0 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Business pages, posts, reviews, hours, and contact details from Facebook.
                  </Typography>
                  <FormTextField
                    label="Facebook App ID"
                    placeholder="Enter your Facebook App ID"
                    fullWidth
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Rate Limit: Varies by endpoint • <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer">Get App ID</a>
                  </Typography>
                </Box>

                {/* Instagram API */}
                <Box sx={{ mb: 3, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Instagram Basic Display API
                    </Typography>
                    <FormControlLabel
                      control={<Checkbox size="small" />}
                      label="Enable"
                      sx={{ m: 0 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Instagram business profiles and basic information.
                  </Typography>
                  <FormTextField
                    label="Instagram App ID"
                    placeholder="Enter your Instagram App ID"
                    fullWidth
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Rate Limit: Varies by endpoint • <a href="https://developers.facebook.com/docs/instagram-basic-display-api" target="_blank" rel="noopener noreferrer">Get App ID</a>
                  </Typography>
                </Box>

                {/* Success Alert */}
                {showDataSourcesSuccess && (
                  <Alert 
                    severity="success" 
                    sx={{ 
                      mb: 2,
                      borderRadius: 2,
                      '& .MuiAlert-message': {
                        fontWeight: 500
                      }
                    }}
                  >
                    Data source settings applied successfully! Your scraper configurations have been saved.
                  </Alert>
                )}

                {/* Save Settings Button */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: 2, 
                  mt: 3, 
                  pt: 3, 
                  borderTop: '2px solid', 
                  borderColor: 'divider',
                  bgcolor: 'grey.50',
                  p: 2,
                  borderRadius: 2
                }}>
                  <Button 
                    variant="outlined" 
                    size="medium"
                    sx={{ 
                      textTransform: 'none',
                      fontWeight: 500,
                      px: 3,
                      py: 1,
                      borderRadius: 2
                    }}
                  >
                    Reset to Defaults
                  </Button>
                  <Button 
                    variant="contained" 
                    size="medium"
                    onClick={handleApplyDataSources}
                    sx={{ 
                      textTransform: 'none',
                      fontWeight: 500,
                      px: 3,
                      py: 1,
                      borderRadius: 2
                    }}
                  >
                    Save Settings
                  </Button>
                </Box>
                  </>
                )}
              </Box>
            )}
            
            {tabValue === 3 && (
              <Box sx={{ maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
                {/* Google Places API */}
                <Box sx={{ mb: 4, pb: 3, borderBottom: '2px solid', borderColor: 'divider' }}>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    1. Google Places API
                  </Typography>
                  
                  <Typography variant="body2" paragraph color="text.secondary">
                    Primary data source for finding facilities worldwide. Required for basic search functionality.
                  </Typography>
                  
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <strong>$200/month free credit</strong> - Enough for 11,000+ facility searches!
                  </Alert>
                  
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                    Setup Steps:
                  </Typography>
                  <Box component="ol" sx={{ pl: 2, mb: 2 }}>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" style={{fontWeight: 500}}>Google Cloud Console</a>
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      Create a new project or select existing one
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      Enable <strong>Places API</strong> in the API Library
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      Create an API Key in Credentials section
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Enable billing</strong> (required - you get $200 free/month)
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      Copy API key and enter it in the search form
                    </Typography>
                  </Box>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    href="https://developers.google.com/maps/documentation/places/web-service/cloud-setup"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ textTransform: 'none', fontWeight: 500 }}
                  >
                    Official Setup Guide
                  </Button>
                </Box>

                {/* Foursquare Places API */}
                <Box sx={{ mb: 4, pb: 3, borderBottom: '2px solid', borderColor: 'divider' }}>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    2. Foursquare Places API
                  </Typography>
                  
                  <Typography variant="body2" paragraph color="text.secondary">
                    Additional venue data including tips, photos, and detailed business information.
                  </Typography>
                  
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <strong>Free tier:</strong> 50,000 API calls/day
                  </Alert>
                  
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                    Setup Steps:
                  </Typography>
                  <Box component="ol" sx={{ pl: 2, mb: 2 }}>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      Go to <a href="https://foursquare.com/developers/" target="_blank" rel="noopener noreferrer" style={{fontWeight: 500}}>Foursquare Developers</a>
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      Sign up or log in
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      Create a new app
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      Get your API key from app details
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      Enter API key in Data Sources tab
                    </Typography>
                  </Box>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    href="https://foursquare.com/developers/signup"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ textTransform: 'none', fontWeight: 500 }}
                  >
                    Sign Up for Foursquare
                  </Button>
                </Box>

                {/* Yelp Fusion API */}
                <Box sx={{ mb: 4, pb: 3, borderBottom: '2px solid', borderColor: 'divider' }}>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    3. Yelp Fusion API
                  </Typography>
                  
                  <Typography variant="body2" paragraph color="text.secondary">
                    Business reviews, ratings, photos, and pricing information.
                  </Typography>
                  
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <strong>Free tier:</strong> 500 API calls/day
                  </Alert>
                  
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                    Setup Steps:
                  </Typography>
                  <Box component="ol" sx={{ pl: 2, mb: 2 }}>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      Go to <a href="https://www.yelp.com/developers/v3/manage_app" target="_blank" rel="noopener noreferrer" style={{fontWeight: 500}}>Yelp Developers</a>
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      Create a Yelp account or log in
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      Create a new app
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      Get your API key
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      Enter API key in Data Sources tab
                    </Typography>
                  </Box>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    href="https://www.yelp.com/developers"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ textTransform: 'none', fontWeight: 500 }}
                  >
                    Yelp Developers Portal
                  </Button>
                </Box>

                {/* OpenStreetMap */}
                <Box sx={{ mb: 4, pb: 3, borderBottom: '2px solid', borderColor: 'divider' }}>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    4. OpenStreetMap (OSM)
                  </Typography>
                  
                  <Typography variant="body2" paragraph color="text.secondary">
                    Open-source mapping data with global POI coverage. Completely free, no API key required!
                  </Typography>
                  
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <strong>100% Free</strong> - No API key required, no rate limits
                  </Alert>
                  
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                    How to Use:
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      Automatically enabled by default
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      No setup required
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      Provides location data and POI information
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      Community-maintained and updated regularly
                    </Typography>
                  </Box>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    href="https://www.openstreetmap.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ textTransform: 'none', fontWeight: 500 }}
                  >
                    Learn About OpenStreetMap
                  </Button>
                </Box>

                {/* Facebook Graph API */}
                <Box sx={{ mb: 4, pb: 3, borderBottom: '2px solid', borderColor: 'divider' }}>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    5. Facebook Graph API
                  </Typography>
                  
                  <Typography variant="body2" paragraph color="text.secondary">
                    Access business pages, posts, reviews, hours, and contact details from Facebook.
                  </Typography>
                  
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <strong>Advanced:</strong> Requires Facebook App creation and permissions
                  </Alert>
                  
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                    Setup Steps:
                  </Typography>
                  <Box component="ol" sx={{ pl: 2, mb: 2 }}>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      Go to <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" style={{fontWeight: 500}}>Facebook Developers</a>
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      Create or log in to your developer account
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      Create a new app (select "Business" type)
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      Add "Facebook Login" and "Pages" products
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      Get your App ID from app settings
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      Enter App ID in Data Sources tab
                    </Typography>
                  </Box>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    href="https://developers.facebook.com/apps"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ textTransform: 'none', fontWeight: 500 }}
                  >
                    Manage Facebook Apps
                  </Button>
                </Box>

                {/* Instagram Basic Display API */}
                <Box sx={{ mb: 4, pb: 3, borderBottom: '2px solid', borderColor: 'divider' }}>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    6. Instagram Basic Display API
                  </Typography>
                  
                  <Typography variant="body2" paragraph color="text.secondary">
                    Access Instagram business profiles and basic information.
                  </Typography>
                  
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <strong>Advanced:</strong> Requires Facebook App and Instagram Business account
                  </Alert>
                  
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                    Setup Steps:
                  </Typography>
                  <Box component="ol" sx={{ pl: 2, mb: 2 }}>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      First, create a Facebook App (see above)
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      Add "Instagram Basic Display" product
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      Create an Instagram App ID
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      Set up OAuth redirect URLs
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      Get your App ID from settings
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      Enter App ID in Data Sources tab
                    </Typography>
                  </Box>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    href="https://developers.facebook.com/docs/instagram-basic-display-api/getting-started"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ textTransform: 'none', fontWeight: 500 }}
                  >
                    Instagram API Guide
                  </Button>
                </Box>

                {/* General Information */}
                <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                    💡 Pro Tips
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Start with Google Places</strong> - It's the most comprehensive and easiest
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Add Foursquare & Yelp</strong> - For reviews and additional business details
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      <strong>OSM is always free</strong> - No API key needed, great for basic POI data
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Social APIs are optional</strong> - Only needed for social media enrichment
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Monitor your quotas</strong> - Check usage in each platform's dashboard
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Keep API keys secure</strong> - Never share them publicly
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mt: 3, p: 2, bgcolor: 'info.lighter', borderRadius: 2, border: 1, borderColor: 'info.main' }}>
                  <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                    📚 Need More Help?
                  </Typography>
                  <Typography variant="body2" paragraph sx={{ mb: 1 }}>
                    Visit our comprehensive documentation or check the official API documentation:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      href="https://github.com/TechYZ-Software-Solutions-Pvt-Ltd/justlist"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ textTransform: 'none', fontWeight: 500 }}
                    >
                      JustList Documentation
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Drawer>

      {/* Search Results Display */}
      <Drawer
        anchor="right"
        open={showSearchResults}
        onClose={handleBackToSettings}
                sx={{
          '& .MuiDrawer-paper': {
            width: isMobile ? '100%' : theme.breakpoints.values.lg ? '30%' : '20%',
            borderRadius: 0,
                  },
                }}
              >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <IconButton onClick={handleBackToSettings} size="small">
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h6" fontWeight={600}>
                Search Results
              </Typography>
            </Box>
            {selectedHistoryItem && (
              <Typography variant="body2" color="text.secondary">
                {selectedHistoryItem.place_type} in {selectedHistoryItem.city}, {selectedHistoryItem.country}
              </Typography>
            )}
          </Box>
          
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            {isLoadingResults ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                <CircularProgress />
              </Box>
            ) : searchResults.length > 0 ? (
              <List dense>
                {searchResults.map((result, index) => (
                  <ListItem key={index} disablePadding>
                    <ListItemButton sx={{ borderRadius: 1, mb: 0.5 }}>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight="medium">
                            {result.name || 'Unknown Facility'}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            {result.formatted_address && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {result.formatted_address}
                              </Typography>
                            )}
                            {result.rating && (
                              <Typography variant="caption" color="text.secondary">
                                Rating: {result.rating}/5
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">
                No results found for this search.
              </Alert>
          )}
        </Box>
        </Box>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Search History</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this search history item?
          </Typography>
          {itemToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight="medium">
                {itemToDelete.place_type}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {itemToDelete.city}, {itemToDelete.country} • {itemToDelete.results_count} results
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
};

export default Header;
