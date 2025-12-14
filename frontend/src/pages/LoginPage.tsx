import React, { useState } from 'react';
import { Container, Alert, InputAdornment, IconButton, Box, Typography, Paper } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  FormTextField, 
  FormButton, 
  FormLink 
} from '../components/forms';
import { validateUsername, validatePassword } from '../utils/formValidation';
import { Login as LoginIcon } from '@mui/icons-material';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleFieldChange = (field: string, value: string) => {
    if (field === 'username') {
      setUsername(value);
      const error = validateUsername(value) || '';
      setFieldErrors(prev => ({ ...prev, username: error }));
    } else if (field === 'password') {
      setPassword(value);
      const error = validatePassword(value) || '';
      setFieldErrors(prev => ({ ...prev, password: error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate fields
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);
    
    if (usernameError || passwordError) {
      setFieldErrors({
        username: usernameError || '',
        password: passwordError || ''
      });
      return;
    }

    setIsLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f8fafc',
        backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={4}
          sx={{
            p: 4,
            borderRadius: 2,
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
          }}
        >
          {/* Logo/Title Section */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2
              }}
            >
              <LoginIcon sx={{ fontSize: 32, color: 'white' }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
              Welcome Back
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Sign in to access JustList
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <FormTextField
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => handleFieldChange('username', e.target.value)}
              error={!!fieldErrors.username}
              helperText={fieldErrors.username}
              required
              sx={{ mb: 3 }}
            />
            
            <FormTextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => handleFieldChange('password', e.target.value)}
              error={!!fieldErrors.password}
              helperText={fieldErrors.password}
              required
              sx={{ mb: 3 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton aria-label="toggle password visibility" onClick={() => setShowPassword(v => !v)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            <FormButton
              type="submit"
              fullWidth
              disabled={isLoading}
              position="center"
              sx={{ 
                mb: 2,
                bgcolor: '#3b82f6',
                '&:hover': { bgcolor: '#2563eb' },
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
              {isLoading ? 'Logging in...' : 'Sign In'}
            </FormButton>
            
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <FormLink to="/register">
                Don't have an account? <strong>Register here</strong>
              </FormLink>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;