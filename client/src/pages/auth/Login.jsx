import { useState } from 'react';
import { useNavigate, Navigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Link
} from '@mui/material';
import axiosInstance from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/agsffllogo.png';

export const Login = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await axiosInstance.post('/auth/login', form);
      login({ usuario: data.usuario, token: data.token });
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.mensaje || 'Error al iniciar sesión');
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
      <Box
        sx={{
          width: '100%',
          maxWidth: 400,
          textAlign: 'center'
        }}
      >
        {/* Logo */}
        <Box sx={{ mb: 4 }}>
          <img src={logo} alt="Logo" style={{ height: 180, borderRadius: 100 }} />
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            margin="normal"
            label="Correo"
            name="email"
            value={form.email}
            onChange={handleChange}
            InputProps={{ style: { color: 'white' } }}
            InputLabelProps={{ style: { color: 'white' } }}
            variant="standard"
          />

          <TextField
            fullWidth
            margin="normal"
            label="Contraseña"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            InputProps={{ style: { color: 'white' } }}
            InputLabelProps={{ style: { color: 'white' } }}
            variant="standard"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 4,
              backgroundColor: '#ffd700',
              color: 'black',
              fontWeight: 'bold',
              borderRadius: 8,
              '&:hover': {
                backgroundColor: '#f5c400'
              }
            }}
          >
            INICIAR SESIÓN
          </Button>
        </form>

        {/* Link a registro */}
        <Typography variant="body2" sx={{ mt: 3, color: 'white' }}>
          ¿No tienes una cuenta?{' '}
          <Link
            component={RouterLink}
            to="/auth/register"
            underline="hover"
            sx={{ color: '#ffd700', fontWeight: 'bold' }}
          >
            Crear cuenta
          </Link>
        </Typography>

        {/* Términos */}
        <Typography variant="caption" sx={{ mt: 4, display: 'block', color: 'white', opacity: 0.7 }}>
          Al iniciar sesión aceptas nuestros{' '}
          <Link href="#" underline="hover" sx={{ color: '#ffd700' }}>
            Términos y Condiciones
          </Link>{' '}
          y{' '}
          <Link href="#" underline="hover" sx={{ color: '#ffd700' }}>
            Política de Privacidad
          </Link>
          .
        </Typography>
      </Box>
    </Box>
  );
};
