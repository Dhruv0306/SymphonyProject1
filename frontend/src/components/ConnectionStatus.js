import React from 'react';
import { Box, Chip } from '@mui/material';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SyncIcon from '@mui/icons-material/Sync';

const ConnectionStatus = ({ isConnected, isReconnecting }) => {
  if (!isReconnecting && isConnected) return null; // Don't show when connected normally

  const getStatusConfig = () => {
    if (isReconnecting) {
      return {
        color: 'warning',
        icon: <SyncIcon sx={{ animation: 'spin 1s linear infinite', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />,
        label: 'Reconnecting...'
      };
    }
    if (!isConnected) {
      return {
        color: 'error',
        icon: <WifiOffIcon />,
        label: 'Disconnected'
      };
    }
    return {
      color: 'success',
      icon: <WifiIcon />,
      label: 'Connected'
    };
  };

  const { color, icon, label } = getStatusConfig();

  return (
    <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 9999 }}>
      <Chip
        icon={icon}
        label={label}
        color={color}
        size="small"
        sx={{ 
          fontWeight: 500,
          '& .MuiChip-icon': { fontSize: '1rem' }
        }}
      />
    </Box>
  );
};

export default ConnectionStatus;