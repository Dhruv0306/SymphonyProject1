import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  CircularProgress, 
  Alert,
  Container
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { API_BASE_URL } from '../config';

/**
 * Admin Login Component
 * 
 * Provides secure authentication for admin users to access the dashboard
 */
const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          setCheckingSession(false);
          return;
        }
        
        const response = await fetch(`${API_BASE_URL}/api/admin/check-session`, {
          method: 'GET',
          headers: {
            'X-Auth-Token': token
          }
        });
        
        if (response.ok) {
          // Already authenticated, redirect to dashboard
          navigate('/admin/dashboard');
        } else {
          // Clear invalid token
          localStorage.removeItem('auth_token');
          localStorage.removeItem('csrf_token');
        }
      } catch (err) {
        // Session check failed, but we don't need to show an error
        console.error('Session check failed:', err);
        // Clear potentially invalid tokens
        localStorage.removeItem('auth_token');
        localStorage.removeItem('csrf_token');
      } finally {
        setCheckingSession(false);
      }
    };
    
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      // Create form data for submission
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Store tokens in localStorage
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        
        if (data.csrf_token) {
          localStorage.setItem('csrf_token', data.csrf_token);
        }
        
        // Login successful, redirect to dashboard
        navigate('/admin/dashboard');
      } else {
        const data = await response.json();
        setError(data.detail || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            width: '100%'
          }}
        >
          <Box 
            sx={{ 
              bgcolor: '#0066B3', 
              borderRadius: '50%', 
              p: 1, 
              mb: 2,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <LockOutlinedIcon sx={{ color: 'white', fontSize: 30 }} />
          </Box>
          
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            Admin Login
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, bgcolor: '#0066B3', py: 1.5 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminLogin;