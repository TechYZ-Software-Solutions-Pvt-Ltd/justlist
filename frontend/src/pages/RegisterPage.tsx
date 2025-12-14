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
import { validateEmail, validatePassword, validateUsername, validateFullName, validatePasswordMatch } from '../utils/formValidation';
import { PersonAdd as RegisterIcon } from '@mui/icons-material';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    let error = '';
    switch (field) {
      case 'email':
        error = validateEmail(value) || '';
        break;
      case 'username':
        error = validateUsername(value) || '';
        break;
      case 'password':
        error = validatePassword(value) || '';
        break;
      case 'confirmPassword':
        error = validatePasswordMatch(formData.password, value) || '';
        break;
      case 'fullName':
        error = validateFullName(value) || '';
        break;
    }
    
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate all fields
    const emailError = validateEmail(formData.email);
    const usernameError = validateUsername(formData.username);
    const passwordError = validatePassword(formData.password);
    const confirmError = validatePasswordMatch(formData.password, formData.confirmPassword);
    const fullNameError = validateFullName(formData.fullName);

    if (emailError || usernameError || passwordError || confirmError || fullNameError) {
      setFieldErrors({
        email: emailError || '',
        username: usernameError || '',
        password: passwordError || '',
        confirmPassword: confirmError || '',
        fullName: fullNameError || ''
      });
      return;
    }

    setIsLoading(true);

    try {
      await register(formData.email, formData.username, formData.password, formData.fullName);
      setSuccess(true);
      setError('');
      // Redirect to login after showing success message
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      const backend = err?.response?.data?.detail;
      // Map common backend messages to friendlier hints
      let message = backend || err.message || 'Registration failed';
      if (/72 bytes/i.test(String(backend))) {
        message = 'Your password is too long. Please use up to 72 characters and avoid emoji or unusual symbols.';
      }
      setError(message);
      setSuccess(false);
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
              <RegisterIcon sx={{ fontSize: 32, color: 'white' }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
              Create Account
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Join JustList to get started
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              <strong>Registration Successful!</strong>
              <br />
              Your account has been created. Redirecting to login page...
            </Alert>
          )}

        <form onSubmit={handleSubmit}>
          <FormTextField
            fullWidth
            label="Full Name"
            value={formData.fullName}
            onChange={(e) => handleFieldChange('fullName', e.target.value)}
            error={!!fieldErrors.fullName}
            helperText={fieldErrors.fullName}
            required
            sx={{ mb: 3 }}
          />
          
          <FormTextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            error={!!fieldErrors.email}
            helperText={fieldErrors.email}
            required
            sx={{ mb: 3 }}
          />
          
          <FormTextField
            fullWidth
            label="Username"
            value={formData.username}
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
            value={formData.password}
            onChange={(e) => handleFieldChange('password', e.target.value)}
            inputProps={{ maxLength: 72, minLength: 8 }}
            error={!!fieldErrors.password}
            helperText={fieldErrors.password || 'Password must be 8–72 characters. Avoid emoji or unusual symbols.'}
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
          
          <FormTextField
            fullWidth
            label="Confirm Password"
            type={showConfirm ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
            inputProps={{ maxLength: 72, minLength: 8 }}
            error={!!fieldErrors.confirmPassword}
            helperText={fieldErrors.confirmPassword}
            required
            sx={{ mb: 3 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton aria-label="toggle confirm password visibility" onClick={() => setShowConfirm(v => !v)} edge="end">
                    {showConfirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          <FormButton
            type="submit"
            fullWidth
            disabled={isLoading || success}
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
            {isLoading ? 'Creating Account...' : success ? 'Registration Successful!' : 'Create Account'}
          </FormButton>
          
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <FormLink to="/login">
              Already have an account? <strong>Sign in here</strong>
            </FormLink>
          </Box>
        </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default RegisterPage;