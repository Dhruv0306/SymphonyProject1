import React from 'react';
import { 
  Box, 
  TextField,
  FormControlLabel,
  Checkbox,
  Typography
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';

/**
 * Email notification field component for batch processing
 */
const EmailNotificationField = ({ email, setEmail, enabled, setEnabled }) => {
  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <FormControlLabel
        control={
          <Checkbox 
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            color="primary"
          />
        }
        label="Email me when processing completes"
      />
      
      {enabled && (
        <TextField
          fullWidth
          margin="normal"
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          InputProps={{
            startAdornment: <EmailIcon sx={{ color: '#0066B3', mr: 1 }} />,
          }}
          helperText="We'll notify you when your batch processing is complete"
        />
      )}
    </Box>
  );
};

export default EmailNotificationField;