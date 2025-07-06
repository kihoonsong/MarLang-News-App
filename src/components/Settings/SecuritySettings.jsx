import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  Card, CardContent, Typography, Button, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, IconButton, InputAdornment,
  CircularProgress, Alert
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockIcon from '@mui/icons-material/Lock';

const SecuritySettings = ({ user, onChangePassword }) => {
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    setPasswordError('');

    try {
      await onChangePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordModalOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setPasswordError(error.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // 네이버 사용자는 비밀번호 변경 불가
  if (user?.isServerAuth) {
    return (
      <SettingsCard>
        <CardHeader>
          <SecurityIcon color="primary" />
          <Typography variant="h6" component="h2">
            Security Settings
          </Typography>
        </CardHeader>
        
        <CardContent>
          <Alert severity="info">
            Password changes are not available for Naver accounts. 
            Please use Naver's account management to change your password.
          </Alert>
        </CardContent>
      </SettingsCard>
    );
  }

  return (
    <>
      <SettingsCard>
        <CardHeader>
          <SecurityIcon color="primary" />
          <Typography variant="h6" component="h2">
            Security Settings
          </Typography>
        </CardHeader>
        
        <CardContent>
          <Button
            variant="outlined"
            startIcon={<LockIcon />}
            onClick={() => setPasswordModalOpen(true)}
            fullWidth
          >
            Change Password
          </Button>
        </CardContent>
      </SettingsCard>

      <Dialog
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {passwordError}
            </Alert>
          )}

          <TextField
            type={showPasswords.current ? 'text' : 'password'}
            label="Current Password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
            fullWidth
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => togglePasswordVisibility('current')}>
                    {showPasswords.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <TextField
            type={showPasswords.new ? 'text' : 'password'}
            label="New Password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
            fullWidth
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => togglePasswordVisibility('new')}>
                    {showPasswords.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <TextField
            type={showPasswords.confirm ? 'text' : 'password'}
            label="Confirm New Password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
            fullWidth
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => togglePasswordVisibility('confirm')}>
                    {showPasswords.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setPasswordModalOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handlePasswordChange}
            variant="contained"
            disabled={passwordLoading || !passwordForm.currentPassword || !passwordForm.newPassword}
          >
            {passwordLoading ? <CircularProgress size={20} /> : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const SettingsCard = styled(Card)`
  margin-bottom: 1.5rem;
  border-radius: 16px !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08) !important;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 1.5rem 0.5rem 1.5rem;
`;

export default SecuritySettings;