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
  const [stats, setStats] = useState({
    batchesToday: 0,
    successRate: 0,
    processingTime: 0,
    errorRate: 0
  });
  const [uploadStatus, setUploadStatus] = useState(null);
  
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

  const handleStartBatch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_BASE_URL}/api/start-batch`, {
        method: 'POST',
        headers: {
          'X-Auth-Token': token
        }
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
                    
                    <ProgressBar batchId={activeBatch} />
                    
                    <Box sx={{ mt: 3, p: 2, border: '1px dashed #ccc', borderRadius: 1 }}>
                      <Typography variant="subtitle1" sx={{ mb: 2 }}>
                        Use this batch:
                      </Typography>
                      
                      <Box sx={{ display: 'flex', mb: 2 }}>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            navigator.clipboard.writeText(activeBatch);
                            alert('Batch ID copied to clipboard!');
                          }}
                          size="small"
                        >
                          Copy Batch ID
                        </Button>
                      </Box>
                      
                      <Box sx={{ mt: 2 }}>
                        {uploadStatus && (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              mb: 2, 
                              color: uploadStatus === 'uploading' ? 'warning.main' : 
                                     uploadStatus === 'Upload failed' ? 'error.main' : 'success.main'
                            }}
                          >
                            {uploadStatus === 'uploading' ? 'Uploading files...' : uploadStatus}
                          </Typography>
                        )}
                        <input
                          accept="image/*"
                          style={{ display: 'none' }}
                          id="batch-file-upload"
                          multiple
                          type="file"
                          onChange={async (e) => {
                            if (e.target.files.length === 0) return;
                            
                            // Check if the number of files is 1000 or more
                            if (e.target.files.length >= 1000) {
                              alert("Please upload less than 1000 images");
                              e.target.value = '';
                              return;
                            }
                            
                            setUploadStatus('uploading');
                            const formData = new FormData();
                            for (let i = 0; i < e.target.files.length; i++) {
                              formData.append('files', e.target.files[i]);
                            }
                            formData.append('batch_id', activeBatch);
                            
                            try {
                              const token = localStorage.getItem('auth_token');
                              const response = await fetch(`${API_BASE_URL}/api/check-logo/batch/`, {
                                method: 'POST',
                                headers: {
                                  'X-Auth-Token': token
                                },
                                body: formData
                              });
                              
                              if (response.ok) {
                                const result = await response.json();
                                setUploadStatus(`Uploaded ${result.total_processed} files (${result.valid_count} valid, ${result.invalid_count} invalid)`);
                              } else {
                                setUploadStatus('Upload failed');
                              }
                            } catch (err) {
                              console.error('Upload error:', err);
                              setUploadStatus('Upload failed');
                            }
                            
                            // Reset the file input
                            e.target.value = '';
                          }}
                        />
                        <label htmlFor="batch-file-upload">
                          <Button variant="contained" component="span" sx={{ bgcolor: '#0066B3' }}>
                            Upload Images to Batch
                          </Button>
                        </label>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
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