// 📁 client/src/pages/auth/Login.jsx - ACTUALIZADO
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Link,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import EmailIcon from '@mui/icons-material/Email';
import axios from '../../config/axios';
import logo from '../../assets/agsffllogo.png';

const schema = Yup.object().shape({
  email: Yup.string().email('Correo inválido').required('Correo requerido'),
  password: Yup.string().required('Contraseña requerida'),
});

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificacionDialog, setVerificacionDialog] = useState(false);
  const [emailNoVerificado, setEmailNoVerificado] = useState('');
  const [reenviandoVerificacion, setReenviandoVerificacion] = useState(false);

  // Mensaje de éxito si viene de verificación o reset
  const mensajeExito = location.state?.mensaje;

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

      const response = await axios.post('/auth/login', data);
      
      // Login exitoso
      login(response.data);
      navigate('/home');

    } catch (error) {
      console.error('Error en login:', error);
      const errorData = error.response?.data;
      
      if (errorData?.requiereVerificacion) {
        // Email no verificado
        setEmailNoVerificado(errorData.email || data.email);
        setVerificacionDialog(true);
      } else {
        setError(errorData?.mensaje || 'Error en el login');
      }
    } finally {
      setLoading(false);
    }
  };

  const reenviarVerificacion = async () => {
    try {
      setReenviandoVerificacion(true);

      await axios.post('/auth/resend-verification', {
        email: emailNoVerificado
      });

      setVerificacionDialog(false);
      setError('');
      // Mostrar mensaje de éxito
      setError('Email de verificación reenviado. Revisa tu bandeja de entrada.');

    } catch (error) {
      console.error('Error reenviando verificación:', error);
      setError(error.response?.data?.mensaje || 'Error al reenviar email de verificación');
    } finally {
      setReenviandoVerificacion(false);
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 400 }}
      >
        <Box sx={{ textAlign: 'center' }}>
          {/* Logo */}
          <Box sx={{ mb: 4 }}>
            <img src={logo} alt="Logo" style={{ height: 180, borderRadius: 100 }} />
          </Box>

          <Typography variant="h5" gutterBottom>
            Iniciar sesión
          </Typography>

          {/* Mensaje de éxito */}
          {mensajeExito && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {mensajeExito}
            </Alert>
          )}

          {/* Error */}
          {error && (
            <Alert 
              severity={error.includes('reenviado') ? 'success' : 'error'} 
              sx={{ mb: 2 }}
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              fullWidth
              margin="normal"
              label="Correo"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              disabled={loading}
              InputProps={{ style: { color: 'white' } }}
              InputLabelProps={{ style: { color: 'white' } }}
              variant="standard"
            />

            <TextField
              fullWidth
              margin="normal"
              label="Contraseña"
              type="password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              disabled={loading}
              InputProps={{ style: { color: 'white' } }}
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
                'INICIAR SESIÓN'
              )}
            </Button>
          </form>

          {/* Links */}
          <Stack spacing={2} sx={{ mt: 3 }}>
            <Link
              component={RouterLink}
              to="/auth/forgot-password"
              underline="hover"
              sx={{ color: '#ffd700', fontWeight: 'bold' }}
            >
              ¿Olvidaste tu contraseña?
            </Link>

            <Typography variant="body2" sx={{ color: 'white' }}>
              ¿No tienes una cuenta?{' '}
              <Link
                component={RouterLink}
                to="/auth/register"
                underline="hover"
                sx={{ color: '#ffd700', fontWeight: 'bold' }}
              >
                Registrarse
              </Link>
            </Typography>
          </Stack>
        </Box>
      </motion.div>

      {/* Dialog para email no verificado */}
      <Dialog 
        open={verificacionDialog} 
        onClose={() => setVerificacionDialog(false)}
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #0f4c81, #3f2b96)',
            color: 'white',
            border: '1px solid rgba(255, 215, 0, 0.3)'
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          <EmailIcon sx={{ fontSize: 48, color: '#ffd700', mb: 1 }} />
          <Typography variant="h6">
            Email No Verificado
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Debes verificar tu email antes de poder iniciar sesión.
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Email: <strong>{emailNoVerificado}</strong>
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
            ¿No recibiste el email de verificación?
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Stack direction="row" spacing={2}>
            <Button
              onClick={() => setVerificacionDialog(false)}
              sx={{ color: 'white' }}
            >
              Cancelar
            </Button>
            <Button
              onClick={reenviarVerificacion}
              disabled={reenviandoVerificacion}
              variant="contained"
              sx={{
                backgroundColor: '#ffd700',
                color: 'black',
                '&:hover': { backgroundColor: '#f5c400' }
              }}
            >
              {reenviandoVerificacion ? (
                <CircularProgress size={20} sx={{ color: 'black' }} />
              ) : (
                'Reenviar Email'
              )}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </Box>
  );
};