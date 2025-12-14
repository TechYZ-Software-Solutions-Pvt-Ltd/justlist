import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Help as HelpIcon,
  PlayArrow as VideoIcon,
  Chat as ChatIcon,
  CheckCircle as CheckIcon,
  Description as DocumentIcon,
  Menu as MenuIcon,
  Settings as SettingsIcon,
  KeyboardArrowRight as ArrowIcon
} from '@mui/icons-material';

const RightSidebar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (isMobile) {
    return null; // Hide on mobile
  }

  const utilityItems = [
    { icon: <HelpIcon />, tooltip: 'Help' },
    { icon: <VideoIcon />, tooltip: 'Tutorials' },
    { icon: <ChatIcon />, tooltip: 'Chat Support' },
    { icon: <CheckIcon />, tooltip: 'Quick Actions' },
    { icon: <DocumentIcon />, tooltip: 'Documents' },
    { icon: <MenuIcon />, tooltip: 'More Options' },
    { icon: <SettingsIcon />, tooltip: 'Settings' }
  ];

  return (
    <Box
      sx={{
        position: 'fixed',
        right: 0,
        top: 64, // Below header
        width: 48,
        height: 'calc(100vh - 64px)',
        bgcolor: '#f8fafc',
        borderLeft: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 2,
        gap: 1,
        zIndex: 1000
      }}
    >
      {utilityItems.map((item, index) => (
        <Tooltip key={index} title={item.tooltip} placement="left">
          <IconButton
            sx={{
              width: 36,
              height: 36,
              color: '#64748b',
              '&:hover': {
                bgcolor: '#e2e8f0',
                color: '#1e293b'
              }
            }}
          >
            {item.icon}
          </IconButton>
        </Tooltip>
      ))}
      
      {/* Bottom Arrow */}
      <Box sx={{ mt: 'auto', mb: 1 }}>
        <IconButton
          sx={{
            width: 36,
            height: 36,
            color: '#64748b',
            '&:hover': {
              bgcolor: '#e2e8f0',
              color: '#1e293b'
            }
          }}
        >
          <ArrowIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default RightSidebar;
