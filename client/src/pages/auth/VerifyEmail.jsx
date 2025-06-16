// 📁 client/src/pages/auth/VerifyEmail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Alert,
  Paper,
  Stack
} from '@mui/material';
import { motion } from 'framer-motion';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import EmailIcon from '@mui/icons-material/Email';
import axios from '../../config/axios';
import logo from '../../assets/agsffllogo.png';

export const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [estado, setEstado] = useState('verificando'); // verificando, exitoso, error
  const [mensaje, setMensaje] = useState('');
  const [tokenExpirado, setTokenExpirado] = useState(false);

  useEffect(() => {
    verificarEmail();
  }, [token]);

  const verificarEmail = async () => {
    try {
      setEstado('verificando');
      
      const response = await axios.get(`/auth/verify-email/${token}`);
      
      setEstado('exitoso');
      setMensaje(response.data.mensaje);
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate('/auth/login', {
          state: { 
            mensaje: 'Email verificado correctamente. Ya puedes iniciar sesión.' 
          }
        });
      }, 3000);

    } catch (error) {
      console.error('Error verificando email:', error);
      setEstado('error');
      setMensaje(error.response?.data?.mensaje || 'Error al verificar email');
      setTokenExpirado(error.response?.data?.tokenExpirado || false);
    }
  };

  const renderContenido = () => {
    switch (estado) {
      case 'verificando':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Stack spacing={3} alignItems="center">
              <CircularProgress size={60} sx={{ color: '#ffd700' }} />
              <Typography variant="h5" textAlign="center">
                Verificando tu email...
              </Typography>
              <Typography variant="body1" textAlign="center" sx={{ opacity: 0.8 }}>
                Por favor espera mientras confirmamos tu cuenta
              </Typography>
            </Stack>
          </motion.div>
        );

      case 'exitoso':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Stack spacing={3} alignItems="center">
              <CheckCircleIcon sx={{ fontSize: 80, color: '#4caf50' }} />
              <Typography variant="h4" textAlign="center" sx={{ color: '#4caf50' }}>
                ¡Email Verificado!
              </Typography>
              <Typography variant="h6" textAlign="center">
                {mensaje}
              </Typography>
              <Alert severity="success" sx={{ width: '100%' }}>
                Tu cuenta ha sido activada exitosamente. Serás redirigido al login en unos segundos...
              </Alert>
              <Button
                variant="contained"
                onClick={() => navigate('/auth/login')}
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
        );

      case 'error':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Stack spacing={3} alignItems="center">
              <ErrorIcon sx={{ fontSize: 80, color: '#f44336' }} />
              <Typography variant="h4" textAlign="center" sx={{ color: '#f44336' }}>
                Error de Verificación
              </Typography>
              <Typography variant="h6" textAlign="center">
                {mensaje}
              </Typography>
              
              {tokenExpirado && (
                <Alert severity="warning" sx={{ width: '100%' }}>
                  Tu link de verificación ha expirado. Puedes solicitar uno nuevo desde la página de login.
                </Alert>
              )}

              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  component={RouterLink}
                  to="/auth/login"
                  sx={{
                    borderColor: '#ffd700',
                    color: '#ffd700',
                    '&:hover': { borderColor: '#f5c400', backgroundColor: 'rgba(255, 215, 0, 0.1)' }
                  }}
                >
                  Ir al Login
                </Button>
                <Button
                  variant="contained"
                  component={RouterLink}
                  to="/auth/register"
                  sx={{
                    backgroundColor: '#ffd700',
                    color: 'black',
                    fontWeight: 'bold',
                    '&:hover': { backgroundColor: '#f5c400' }
                  }}
                >
                  Registrarse de Nuevo
                </Button>
              </Stack>
            </Stack>
          </motion.div>
        );

      default:
        return null;
    }
  };

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
          maxWidth: 500,
          p: 4,
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <img src={logo} alt="Logo" style={{ height: 120, borderRadius: 60 }} />
          <Typography variant="h6" sx={{ mt: 2, color: '#ffd700' }}>
            AGS Flag Football League
          </Typography>
        </Box>

        {renderContenido()}
      </Paper>
    </Box>
  );
};