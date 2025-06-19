import React from 'react';
import { 
  TextField,
  Box,
  Typography
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';

/**
 * Email input component for batch processing notifications
 */
const EmailInput = ({ email, setEmail }) => {
  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Enter your email to receive results when processing completes
      </Typography>
      
      <TextField
        fullWidth
        margin="normal"
        label="Email Address (Optional)"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email address"
        InputProps={{
          startAdornment: <EmailIcon sx={{ color: '#0066B3', mr: 1 }} />,
        }}
        size="small"
      />
    </Box>
  );
};

export default EmailInput;