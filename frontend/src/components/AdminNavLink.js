import React from 'react';
import { Button } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { Link } from 'react-router-dom';

/**
 * Admin navigation link component
 */
const AdminNavLink = () => {
  return (
    <Button
      component={Link}
      to="/admin/login"
      variant="outlined"
      startIcon={<AdminPanelSettingsIcon />}
      sx={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        color: '#0066B3',
        borderColor: '#0066B3',
        '&:hover': {
          backgroundColor: 'rgba(0, 102, 179, 0.1)',
          borderColor: '#0066B3',
        }
      }}
    >
      Admin
    </Button>
  );
};

export default AdminNavLink;