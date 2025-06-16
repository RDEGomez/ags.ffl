// 📁 client/src/pages/auth/Register.jsx - ACTUALIZADO
import React, { useState } from 'react';
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
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axios from '../../config/axios';
import logo from '../../assets/agsffllogo.png';

const schema = Yup.object().shape({
  email: Yup.string().email('Correo inválido').required('Correo requerido'),
  documento: Yup.string().required('Documento requerido'),
  password: Yup.string().min(6, 'Mínimo 6 caracteres').required('Contraseña requerida'),
  nombre: Yup.string().trim(),
});

export const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registroExitoso, setRegistroExitoso] = useState(false);
  const [emailRegistrado, setEmailRegistrado] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.post('/auth/register', data);

      // Registro exitoso
      setEmailRegistrado(data.email);
      setRegistroExitoso(true);
      reset();

    } catch (error) {
      console.error('Error en registro:', error);
      setError(error.response?.data?.mensaje || 'Error en el registro');
    } finally {
      setLoading(false);
    }
  };

  if (registroExitoso) {
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
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', maxWidth: 500, textAlign: 'center' }}
        >
          {/* Logo */}
          <Box sx={{ mb: 4 }}>
            <img src={logo} alt="Logo" style={{ height: 120, borderRadius: 60 }} />
          </Box>

          <CheckCircleIcon sx={{ fontSize: 80, color: '#4caf50', mb: 3 }} />

          <Typography variant="h4" gutterBottom sx={{ color: '#4caf50' }}>
            ¡Registro Exitoso!
          </Typography>

          <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
            <Typography variant="body1" gutterBottom>
              Tu cuenta ha sido creada exitosamente.
            </Typography>
            <Typography variant="body2">
              Hemos enviado un email de verificación a:<br />
              <strong>{emailRegistrado}</strong>
            </Typography>
          </Alert>

          <Box sx={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.1)', 
            borderRadius: 2, 
            p: 3, 
            mb: 3 
          }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#ffd700' }}>
              📧 Próximos pasos:
            </Typography>
            <Stack spacing={1} sx={{ textAlign: 'left' }}>
              <Typography variant="body2">
                1. Revisa tu bandeja de entrada
              </Typography>
              <Typography variant="body2">
                2. También revisa la carpeta de spam
              </Typography>
              <Typography variant="body2">
                3. Haz clic en el link de verificación
              </Typography>
              <Typography variant="body2">
                4. ¡Ya podrás iniciar sesión!
              </Typography>
            </Stack>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Importante:</strong> El link de verificación expira en 24 horas.
              Si no lo recibes, puedes solicitar uno nuevo desde la página de login.
            </Typography>
          </Alert>

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              onClick={() => {
                setRegistroExitoso(false);
                setEmailRegistrado('');
              }}
              variant="outlined"
              sx={{
                borderColor: '#ffd700',
                color: '#ffd700',
                '&:hover': { 
                  borderColor: '#f5c400', 
                  backgroundColor: 'rgba(255, 215, 0, 0.1)' 
                }
              }}
            >
              Registrar Otro Usuario
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}
      >
        {/* Logo */}
        <Box sx={{ mb: 4 }}>
          <img src={logo} alt="Logo" style={{ height: 180, borderRadius: 100 }} />
        </Box>

        <Typography variant="h5" gutterBottom>
          Crear cuenta
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
            label="Nombre (Opcional)"
            {...register('nombre')}
            error={!!errors.nombre}
            helperText={errors.nombre?.message}
            disabled={loading}
            InputProps={{ style: { color: 'white' } }}
            InputLabelProps={{ style: { color: 'white' } }}
            variant="standard"
          />

          <TextField
            fullWidth
            margin="normal"
            label="Documento"
            {...register('documento')}
            error={!!errors.documento}
            helperText={errors.documento?.message}
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
              'REGISTRARSE'
            )}
          </Button>
        </form>

        {/* Link a login */}
        <Typography variant="body2" sx={{ mt: 3, color: 'white' }}>
          ¿Ya tienes una cuenta?{' '}
          <Link
            component={RouterLink}
            to="/auth/login"
            underline="hover"
            sx={{ color: '#ffd700', fontWeight: 'bold' }}
          >
            Iniciar sesión
          </Link>
        </Typography>

        {/* Información sobre verificación */}
        <Box sx={{ 
          mt: 4, 
          p: 2, 
          backgroundColor: 'rgba(255, 255, 255, 0.1)', 
          borderRadius: 2 
        }}>
          <Typography variant="caption" sx={{ color: 'white', opacity: 0.9 }}>
            💡 <strong>Importante:</strong> Después del registro recibirás un email de verificación. 
            Debes verificar tu email antes de poder iniciar sesión.
          </Typography>
        </Box>

        {/* Términos */}
        <Typography variant="caption" sx={{ mt: 2, display: 'block', color: 'white', opacity: 0.7 }}>
          Al registrarte aceptas nuestros{' '}
          <Link href="#" underline="hover" sx={{ color: '#ffd700' }}>
            Términos y Condiciones
          </Link>{' '}
          y{' '}
          <Link href="#" underline="hover" sx={{ color: '#ffd700' }}>
            Política de Privacidad
          </Link>
          .
        </Typography>
      </motion.div>
    </Box>
  );
};