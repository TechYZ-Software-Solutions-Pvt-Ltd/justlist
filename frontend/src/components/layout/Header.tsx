import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Avatar,
  Box,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        bgcolor: '#1e293b', // Dark blue-gray like Zoho
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        zIndex: 1100,
        left: { md: 240 }, // Account for sidebar
        width: { md: 'calc(100% - 240px)' }
      }}
    >
      <Toolbar sx={{ px: { xs: 2, md: 3 }, minHeight: 64 }}>
        {/* Search Bar */}
        <Box
          component="form"
          onSubmit={handleSearch}
          sx={{
            flexGrow: 1,
            maxWidth: { xs: '100%', md: 400 },
            mr: { xs: 2, md: 3 }
          }}
        >
          <TextField
            fullWidth
            placeholder="Search in Leads (/)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                </InputAdornment>
              ),
              sx: {
                bgcolor: 'white',
                borderRadius: 1,
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none'
                },
                '& .MuiInputBase-input': {
                  py: 1.5,
                  fontSize: '0.875rem'
                }
              }
            }}
          />
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Add Button */}
          <IconButton
            onClick={() => navigate('/search')}
            sx={{
              bgcolor: '#3b82f6',
              color: 'white',
              '&:hover': {
                bgcolor: '#2563eb'
              },
              width: 36,
              height: 36
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>

          {/* Notifications */}
          <IconButton
            sx={{
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            <NotificationsIcon />
          </IconButton>

          {/* Settings */}
          <IconButton
            onClick={() => navigate('/settings')}
            sx={{
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            <SettingsIcon />
          </IconButton>

          {/* User Menu */}
          <IconButton
            onClick={handleMenuOpen}
            sx={{
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: '#3b82f6',
                fontSize: '0.75rem',
                fontWeight: 600
              }}
            >
              {user ? getInitials(user.full_name || user.username) : 'U'}
            </Avatar>
          </IconButton>

          {/* User Info */}
          {!isMobile && user && (
            <Typography
              variant="body2"
              sx={{
                color: 'white',
                ml: 1,
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            >
              {user.full_name || user.username}
            </Typography>
          )}

          {/* More Menu */}
          <IconButton
            sx={{
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            <MoreIcon />
          </IconButton>
        </Box>

        {/* User Dropdown Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 200,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }
          }}
        >
          <MenuItem onClick={() => navigate('/profile')}>
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {user?.full_name || user?.username}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {user?.email}
              </Typography>
            </Box>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => navigate('/settings')}>
            Settings
          </MenuItem>
          <MenuItem onClick={() => navigate('/help')}>
            Help & Support
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
