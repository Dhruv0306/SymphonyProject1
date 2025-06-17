import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box 
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { Link } from 'react-router-dom';

/**
 * Application navigation bar with admin link
 */
const AppNavigation = () => {
  return (
    <AppBar position="static" sx={{ bgcolor: '#0066B3', mb: 3 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Symphony Logo Detection
        </Typography>
        
        <Button
          component={Link}
          to="/admin/login"
          color="inherit"
          startIcon={<AdminPanelSettingsIcon />}
        >
          Admin
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default AppNavigation;