import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Home as HomeIcon,
  Search as SearchIcon,
  ShoppingCart as SalesIcon,
  ShoppingBag as PurchasesIcon,
  AccessTime as TimeIcon,
  AccountBalance as BankingIcon,
  Folder as FolderIcon,
  Person as PersonIcon,
  BarChart as ReportsIcon,
  Description as DocumentsIcon,
  CalendarToday as CalendarIcon,
  CreditCard as PaymentIcon
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const mainNavItems = [
    { label: 'Home', icon: <HomeIcon />, path: '/', exact: true },
    { label: 'Search', icon: <SearchIcon />, path: '/search' },
    { label: 'Leads', icon: <PurchasesIcon />, path: '/leads' },
    { label: 'Reports', icon: <ReportsIcon />, path: '/reports' },
    { label: 'Documents', icon: <DocumentsIcon />, path: '/documents' }
  ];

  const appItems = [
    { label: 'Zoho Calendar', icon: <CalendarIcon />, path: '/calendar' },
    { label: 'Zoho Payments', icon: <PaymentIcon />, path: '/payments' }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  if (isMobile) {
    return null; // Hide sidebar on mobile, use drawer instead
  }

  return (
    <Box
      sx={{
        width: 240,
        height: '100vh',
        bgcolor: '#1e293b', // Dark blue-gray like Zoho
        color: 'white',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1000,
        overflowY: 'auto'
      }}
    >
      {/* Logo */}
      <Box sx={{ p: 3, borderBottom: '1px solid #334155' }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontSize: '1.25rem',
            color: 'white'
          }}
        >
          JustList
        </Typography>
      </Box>

      {/* Main Navigation */}
      <List sx={{ px: 1, py: 2 }}>
        {mainNavItems.map((item) => {
          const isActive = item.exact 
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);
            
          return (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 1,
                  bgcolor: isActive ? '#3b82f6' : 'transparent',
                  '&:hover': {
                    bgcolor: isActive ? '#2563eb' : '#334155'
                  },
                  py: 1.5,
                  px: 2
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'white' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 400
                    }
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ bgcolor: '#334155', mx: 2 }} />

      {/* Apps Section */}
      <Box sx={{ px: 3, py: 2 }}>
        <Typography
          variant="caption"
          sx={{
            color: '#94a3b8',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          Apps
        </Typography>
      </Box>

      <List sx={{ px: 1, py: 0 }}>
        {appItems.map((item) => (
          <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 1,
                '&:hover': {
                  bgcolor: '#334155'
                },
                py: 1.5,
                px: 2
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: '#94a3b8' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontSize: '0.875rem',
                    color: '#94a3b8'
                  }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Sidebar;
