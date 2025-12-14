import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Chat as ChatIcon,
  Contacts as ContactsIcon,
  Send as SendIcon,
  Email as EmailIcon,
  KeyboardArrowUp as CollapseIcon
} from '@mui/icons-material';

const BottomBar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      // Handle send message
      console.log('Sending message:', chatMessage);
      setChatMessage('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  if (isMobile && isCollapsed) {
    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: '#f1f5f9',
          borderTop: '1px solid #e2e8f0',
          p: 1,
          zIndex: 1000
        }}
      >
        <IconButton
          onClick={() => setIsCollapsed(false)}
          sx={{ color: '#64748b' }}
        >
          <CollapseIcon />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: { md: 240 }, // Account for sidebar
        right: { md: 48 }, // Account for right sidebar
        bgcolor: '#f1f5f9',
        borderTop: '1px solid #e2e8f0',
        zIndex: 1000,
        height: isCollapsed ? 48 : 120
      }}
    >
      {/* Collapse Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
        <IconButton
          onClick={() => setIsCollapsed(!isCollapsed)}
          sx={{ color: '#64748b' }}
        >
          <CollapseIcon sx={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </IconButton>
      </Box>

      {!isCollapsed && (
        <>
          {/* Tabs */}
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              minHeight: 40,
              '& .MuiTab-root': {
                minHeight: 40,
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#64748b'
              },
              '& .Mui-selected': {
                color: '#1e293b !important'
              },
              '& .MuiTabs-indicator': {
                bgcolor: '#3b82f6',
                height: 2
              }
            }}
          >
            <Tab
              icon={<ChatIcon />}
              iconPosition="start"
              label="Chats"
              sx={{ minWidth: 100 }}
            />
            <Tab
              icon={<ContactsIcon />}
              iconPosition="start"
              label="Contacts"
              sx={{ minWidth: 100 }}
            />
          </Tabs>

          {/* Chat Input */}
          <Box sx={{ p: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder="Here is your Smart Chat (Ctrl+Space)"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleSendMessage}
                      disabled={!chatMessage.trim()}
                      size="small"
                    >
                      <SendIcon />
                    </IconButton>
                  </InputAdornment>
                ),
                sx: {
                  bgcolor: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: '1px solid #e2e8f0'
                  }
                }
              }}
            />
            <Button
              variant="contained"
              startIcon={<EmailIcon />}
              sx={{
                bgcolor: '#3b82f6',
                '&:hover': { bgcolor: '#2563eb' },
                textTransform: 'none',
                fontWeight: 500,
                minWidth: 140
              }}
            >
              Contact Support
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default BottomBar;
