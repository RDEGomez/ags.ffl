// 📁 client/src/pages/auth/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
import EmailIcon from '@mui/icons-material/Email';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import axios from '../../config/axios';
import logo from '../../assets/agsffllogo.png';

const schema = Yup.object().shape({
  email: Yup.string().email('Correo inválido').required('Correo requerido')
});

export const ForgotPassword = () => {
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');

      await axios.post('/auth/forgot-password', data);
      
      setEnviado(true);

    } catch (error) {
      console.error('Error solicitando recuperación:', error);
      setError(error.response?.data?.mensaje || 'Error al enviar email de recuperación');
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
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

            <EmailIcon sx={{ fontSize: 60, color: '#ffd700', mb: 2 }} />
            
            <Typography variant="h5" gutterBottom>
              ¡Email Enviado!
            </Typography>
            
            <Alert severity="success" sx={{ mb: 3 }}>
              Si existe una cuenta con el email <strong>{getValues('email')}</strong>, 
              recibirás instrucciones para recuperar tu contraseña.
            </Alert>
            
            <Typography variant="body2" sx={{ mb: 3, opacity: 0.8 }}>
              Revisa tu bandeja de entrada y la carpeta de spam. 
              El link expira en 10 minutos.
            </Typography>

            <Button
              component={RouterLink}
              to="/auth/login"
              variant="contained"
              startIcon={<ArrowBackIcon />}
              sx={{
                backgroundColor: '#ffd700',
                color: 'black',
                fontWeight: 'bold',
                '&:hover': { backgroundColor: '#f5c400' }
              }}
            >
              Volver al Login
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
          maxWidth: 400,
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
            Recuperar Contraseña
          </Typography>

          <Typography variant="body2" sx={{ mb: 3, opacity: 0.8, textAlign: 'center' }}>
            Ingresa tu email y te enviaremos un link para restablecer tu contraseña
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
              label="Correo Electrónico"
              type="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              disabled={loading}
              InputProps={{ 
                style: { color: 'white' },
                startAdornment: <EmailIcon sx={{ color: '#ffd700', mr: 1 }} />
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
                'Enviar Link de Recuperación'
              )}
            </Button>
          </form>

          {/* Links */}
          <Stack direction="row" justifyContent="center" spacing={2} sx={{ mt: 3 }}>
            <Button
              component={RouterLink}
              to="/auth/login"
              variant="text"
              startIcon={<ArrowBackIcon />}
              sx={{ color: '#ffd700' }}
            >
              Volver al Login
            </Button>
          </Stack>
        </motion.div>
      </Paper>
    </Box>
  );
};