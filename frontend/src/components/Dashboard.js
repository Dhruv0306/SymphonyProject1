import React, { useState, useEffect } from 'react';
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
import ProgressBar from './ProgressBar';
import BatchHistory from './BatchHistory';
import { API_BASE_URL } from '../config';

/**
 * Admin Dashboard Component
 * 
 * Main admin interface for monitoring batch processing jobs
 */
const Dashboard = () => {
  const [activeBatch, setActiveBatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [checkingSession, setCheckingSession] = useState(true);
  
  const navigate = useNavigate();

  // Check if user is authenticated
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/check-session`, {
          method: 'GET',
          credentials: 'include'
        });
        
        if (!response.ok) {
          // Not authenticated, redirect to login
          navigate('/admin/login');
        }
      } catch (err) {
        console.error('Session check failed:', err);
        navigate('/admin/login');
      } finally {
        setCheckingSession(false);
      }
    };
    
    checkSession();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/admin/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      
      navigate('/admin/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleStartBatch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/start-batch`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setActiveBatch(data.batch_id);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to start batch');
      }
    } catch (err) {
      setError('An error occurred while starting the batch');
      console.error('Start batch error:', err);
    } finally {
      setLoading(false);
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
        <ListItem button onClick={() => { setActiveTab(0); setDrawerOpen(false); }}>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button onClick={() => { setActiveTab(1); setDrawerOpen(false); }}>
          <ListItemIcon>
            <HistoryIcon />
          </ListItemIcon>
          <ListItemText primary="Batch History" />
        </ListItem>
      </List>
      <Divider />
      <List>
        <ListItem button onClick={handleLogout}>
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
                  Batch Processing Dashboard
                </Typography>
                
                {!activeBatch ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                      Start a new batch processing job to monitor progress in real-time.
                    </Typography>
                    
                    <Button
                      variant="contained"
                      onClick={handleStartBatch}
                      disabled={loading}
                      sx={{ bgcolor: '#0066B3' }}
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : 'Start New Batch'}
                    </Button>
                    
                    {error && (
                      <Typography color="error" sx={{ mt: 2 }}>
                        {error}
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Active Batch: {activeBatch}
                    </Typography>
                    
                    <ProgressBar batchId={activeBatch} total={100} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => setActiveBatch(null)}
                        sx={{ mr: 2 }}
                      >
                        Clear
                      </Button>
                      
                      <Button
                        variant="contained"
                        onClick={handleStartBatch}
                        disabled={loading}
                        sx={{ bgcolor: '#0066B3' }}
                      >
                        Start New Batch
                      </Button>
                    </Box>
                  </Box>
                )}
              </Paper>
              
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ mb: 2 }}>
                  Quick Stats
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: '#0066B3' }}>
                        24
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Batches Today
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: 'success.main' }}>
                        85%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Average Success Rate
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: 'warning.main' }}>
                        2.5s
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Avg. Processing Time
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: 'error.main' }}>
                        15%
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