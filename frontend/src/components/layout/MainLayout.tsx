import React from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import Sidebar from './Sidebar';
import Header from './Header';
import RightSidebar from './RightSidebar';
import BottomBar from './BottomBar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <Box
        sx={{
          flexGrow: 1,
          ml: { md: '240px' }, // Account for sidebar
          mr: { md: '48px' }, // Account for right sidebar
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh'
        }}
      >
        {/* Header */}
        <Header />

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            pt: 8, // Below header
            pb: { xs: 8, md: 15 }, // Above bottom bar
            px: { xs: 2, md: 3 },
            bgcolor: '#f8fafc',
            minHeight: 'calc(100vh - 64px)', // Full height minus header
            overflow: 'auto'
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Right Sidebar */}
      <RightSidebar />

      {/* Bottom Bar */}
      <BottomBar />
    </Box>
  );
};

export default MainLayout;
