// 📁 client/src/pages/auth/ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  Stack,
  CircularProgress
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import LockResetIcon from '@mui/icons-material/LockReset';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { IconButton, InputAdornment } from '@mui/material';
import axios from '../../config/axios';
import logo from '../../assets/agsffllogo.png';

const schema = Yup.object().shape({
  password: Yup.string()
    .min(6, 'Mínimo 6 caracteres')
    .required('Contraseña requerida'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Las contraseñas deben coincidir')
    .required('Confirmar contraseña es requerido')
});

export const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exitoso, setExitoso] = useState(false);
  const [tokenValido, setTokenValido] = useState(true);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmPassword, setMostrarConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm({ resolver: yupResolver(schema) });

  const password = watch('password');

  useEffect(() => {
    // Verificar si el token es válido al cargar el componente
    if (!token) {
      setTokenValido(false);
    }
  }, [token]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');

      await axios.post(`/auth/reset-password/${token}`, {
        password: data.password
      });
      
      setExitoso(true);
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate('/auth/login', {
          state: { 
            mensaje: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.' 
          }
        });
      }, 3000);

    } catch (error) {
      console.error('Error restableciendo contraseña:', error);
      setError(error.response?.data?.mensaje || 'Error al restablecer contraseña');
      
      if (error.response?.data?.tokenExpirado) {
        setTokenValido(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderFortalezaPassword = () => {
    if (!password) return null;

    const criterios = [
      { test: password.length >= 6, texto: 'Al menos 6 caracteres' },
      { test: /[A-Z]/.test(password), texto: 'Una mayúscula' },
      { test: /[0-9]/.test(password), texto: 'Un número' },
      { test: /[^A-Za-z0-9]/.test(password), texto: 'Un carácter especial' }
    ];

    const cumplidos = criterios.filter(c => c.test).length;
    const porcentaje = (cumplidos / criterios.length) * 100;

    const getColor = () => {
      if (porcentaje < 50) return '#f44336';
      if (porcentaje < 75) return '#ff9800';
      return '#4caf50';
    };

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" sx={{ color: 'white', opacity: 0.8 }}>
          Fortaleza de la contraseña:
        </Typography>
        <Box sx={{ 
          width: '100%', 
          height: 4, 
          backgroundColor: 'rgba(255,255,255,0.2)', 
          borderRadius: 2,
          mt: 0.5,
          mb: 1
        }}>
          <Box sx={{
            width: `${porcentaje}%`,
            height: '100%',
            backgroundColor: getColor(),
            borderRadius: 2,
            transition: 'all 0.3s ease'
          }} />
        </Box>
        <Stack spacing={0.5}>
          {criterios.map((criterio, index) => (
            <Typography 
              key={index}
              variant="caption" 
              sx={{ 
                color: criterio.test ? '#4caf50' : 'rgba(255,255,255,0.6)',
                fontSize: '0.75rem'
              }}
            >
              {criterio.test ? '✓' : '○'} {criterio.texto}
            </Typography>
          ))}
        </Stack>
      </Box>
    );
  };

  if (!tokenValido) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(to bottom right, #0f4c81, #3f2b96)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          px: 2
        }}
      >
        <Paper
          elevation={6}
          sx={{
            width: '100%',
            maxWidth: 450,
            p: 4,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'center'
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Box sx={{ mb: 3 }}>
              <img src={logo} alt="Logo" style={{ height: 100, borderRadius: 50 }} />
            </Box>

            <ErrorIcon sx={{ fontSize: 60, color: '#f44336', mb: 2 }} />
            
            <Typography variant="h5" gutterBottom>
              Link Inválido
            </Typography>
            
            <Alert severity="error" sx={{ mb: 3 }}>
              El link de recuperación es inválido o ha expirado. 
              Los links de recuperación solo son válidos por 10 minutos.
            </Alert>

            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                component={RouterLink}
                to="/auth/forgot-password"
                variant="outlined"
                sx={{
                  borderColor: '#ffd700',
                  color: '#ffd700',
                  '&:hover': { borderColor: '#f5c400', backgroundColor: 'rgba(255, 215, 0, 0.1)' }
                }}
              >
                Solicitar Nuevo Link
              </Button>
              <Button
                component={RouterLink}
                to="/auth/login"
                variant="contained"
                sx={{
                  backgroundColor: '#ffd700',
                  color: 'black',
                  fontWeight: 'bold',
                  '&:hover': { backgroundColor: '#f5c400' }
                }}
              >
                Ir al Login
              </Button>
            </Stack>
          </motion.div>
        </Paper>
      </Box>
    );
  }

  if (exitoso) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(to bottom right, #0f4c81, #3f2b96)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          px: 2
        }}
      >
        <Paper
          elevation={6}
          sx={{
            width: '100%',
            maxWidth: 450,
            p: 4,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'center'
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Box sx={{ mb: 3 }}>
              <img src={logo} alt="Logo" style={{ height: 100, borderRadius: 50 }} />
            </Box>

            <CheckCircleIcon sx={{ fontSize: 60, color: '#4caf50', mb: 2 }} />
            
            <Typography variant="h5" gutterBottom>
              ¡Contraseña Restablecida!
            </Typography>
            
            <Alert severity="success" sx={{ mb: 3 }}>
              Tu contraseña ha sido restablecida exitosamente. 
              Serás redirigido al login en unos segundos...
            </Alert>

            <Button
              component={RouterLink}
              to="/auth/login"
              variant="contained"
              sx={{
                backgroundColor: '#ffd700',
                color: 'black',
                fontWeight: 'bold',
                '&:hover': { backgroundColor: '#f5c400' }
              }}
            >
              Ir al Login
            </Button>
          </motion.div>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #0f4c81, #3f2b96)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        px: 2
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: '100%',
          maxWidth: 450,
          p: 4,
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <img src={logo} alt="Logo" style={{ height: 120, borderRadius: 60 }} />
          </Box>

          <Typography variant="h5" gutterBottom textAlign="center">
            Nueva Contraseña
          </Typography>

          <Typography variant="body2" sx={{ mb: 3, opacity: 0.8, textAlign: 'center' }}>
            Ingresa tu nueva contraseña para restablecer el acceso a tu cuenta
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              fullWidth
              margin="normal"
              label="Nueva Contraseña"
              type={mostrarPassword ? 'text' : 'password'}
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              disabled={loading}
              InputProps={{
                style: { color: 'white' },
                startAdornment: <LockResetIcon sx={{ color: '#ffd700', mr: 1 }} />,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setMostrarPassword(!mostrarPassword)}
                      edge="end"
                      sx={{ color: '#ffd700' }}
                    >
                      {mostrarPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              InputLabelProps={{ style: { color: 'white' } }}
              variant="standard"
            />

            {renderFortalezaPassword()}

            <TextField
              fullWidth
              margin="normal"
              label="Confirmar Contraseña"
              type={mostrarConfirmPassword ? 'text' : 'password'}
              {...register('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              disabled={loading}
              InputProps={{
                style: { color: 'white' },
                startAdornment: <LockResetIcon sx={{ color: '#ffd700', mr: 1 }} />,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setMostrarConfirmPassword(!mostrarConfirmPassword)}
                      edge="end"
                      sx={{ color: '#ffd700' }}
                    >
                      {mostrarConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              InputLabelProps={{ style: { color: 'white' } }}
              variant="standard"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 4,
                backgroundColor: '#ffd700',
                color: 'black',
                fontWeight: 'bold',
                borderRadius: 8,
                '&:hover': {
                  backgroundColor: '#f5c400'
                },
                '&:disabled': {
                  backgroundColor: 'rgba(255, 215, 0, 0.5)'
                }
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: 'black' }} />
              ) : (
                'Restablecer Contraseña'
              )}
            </Button>
          </form>

          {/* Link al login */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button
              component={RouterLink}
              to="/auth/login"
              variant="text"
              sx={{ color: '#ffd700' }}
            >
              Volver al Login
            </Button>
          </Box>
        </motion.div>
      </Paper>
    </Box>
  );
};