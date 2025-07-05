import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Button, 
  CircularProgress,
  Grid,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tab,
  Tabs
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';
import BatchHistory from './BatchHistory';
import { API_BASE_URL } from '../config';

/**
 * Admin Dashboard Component
 * 
 * Main admin interface for monitoring system statistics and batch history
 */
const Dashboard = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [checkingSession, setCheckingSession] = useState(true);
  const [stats, setStats] = useState({
    batchesToday: 0,
    successRate: 0,
    processingTime: 0,
    errorRate: 0
  });
  
  const navigate = useNavigate();

  // Check if user is authenticated
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          navigate('/admin/login');
          return;
        }
        
        const response = await fetch(`${API_BASE_URL}/api/admin/check-session`, {
          method: 'GET',
          headers: {
            'X-Auth-Token': token
          }
        });
        
        if (!response.ok) {
          // Not authenticated, redirect to login
          localStorage.removeItem('auth_token');
          localStorage.removeItem('csrf_token');
          navigate('/admin/login');
        }
      } catch (err) {
        console.error('Session check failed:', err);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('csrf_token');
        navigate('/admin/login');
      } finally {
        setCheckingSession(false);
      }
    };
    
    checkSession();
  }, [navigate]);
  
  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    if (checkingSession) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard-stats`, {
        method: 'GET',
        headers: {
          'X-Auth-Token': token
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats({
          batchesToday: data.batches_today || 0,
          successRate: data.success_rate || 0,
          processingTime: data.avg_processing_time || 0,
          errorRate: data.error_rate || 0
        });
      } else {
        console.error('Failed to fetch dashboard stats');
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    }
  }, [checkingSession]);
  
  useEffect(() => {
    fetchStats();
    
    // Refresh stats every 5 minutes
    const intervalId = setInterval(fetchStats, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [checkingSession, fetchStats]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const csrfToken = localStorage.getItem('csrf_token');
      
      if (!token || !csrfToken) {
        navigate('/admin/login');
        return;
      }
      
      await fetch(`${API_BASE_URL}/api/admin/logout`, {
        method: 'POST',
        headers: {
          'X-Auth-Token': token,
          'X-CSRF-Token': csrfToken
        }
      });
      
      // Clear tokens
      localStorage.removeItem('auth_token');
      localStorage.removeItem('csrf_token');
      navigate('/admin/login');
    } catch (err) {
      console.error('Logout error:', err);
      // Still redirect to login on error
      localStorage.removeItem('auth_token');
      localStorage.removeItem('csrf_token');
      navigate('/admin/login');
    }
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (checkingSession) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const drawerContent = (
    <Box sx={{ width: 250 }} role="presentation">
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
        <Typography variant="h6" sx={{ color: '#0066B3' }}>
          Admin Dashboard
        </Typography>
      </Box>
      <Divider />
      <List>
        <ListItem component="button" onClick={() => { setActiveTab(0); setDrawerOpen(false); }}>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem component="button" onClick={() => { setActiveTab(1); setDrawerOpen(false); }}>
          <ListItemIcon>
            <HistoryIcon />
          </ListItemIcon>
          <ListItemText primary="Batch History" />
        </ListItem>
      </List>
      <Divider />
      <List>
        <ListItem component="button" onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ bgcolor: '#0066B3' }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Symphony Admin Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
        hideBackdrop
        ModalProps={{
          disableEnforceFocus: true,
          disableAutoFocus: true
        }}
      >
        {drawerContent}
      </Drawer>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          mt: 8
        }}
      >
        <Container maxWidth="lg">
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="Dashboard" />
            <Tab label="Batch History" />
          </Tabs>
          
          {activeTab === 0 && (
            <Box>
              <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" sx={{ mb: 2 }}>
                  System Overview
                </Typography>
                
                <Typography variant="body1" sx={{ mb: 3 }}>
                  Monitor system performance and batch processing statistics.
                </Typography>
              </Paper>
              
              <Paper elevation={2} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h5">
                    Quick Stats
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={fetchStats}
                    startIcon={<RefreshIcon />}
                  >
                    Refresh
                  </Button>
                </Box>
                
                <Grid container spacing={3}>
                  <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
                    <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: '#0066B3' }}>
                        {stats.batchesToday}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Batches Today
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
                    <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: 'success.main' }}>
                        {stats.successRate}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Average Success Rate
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
                    <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: 'warning.main' }}>
                        {stats.processingTime}s
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Avg. Processing Time
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
                    <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: 'error.main' }}>
                        {stats.errorRate}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Error Rate
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}
          
          {activeTab === 1 && (
            <BatchHistory />
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard;