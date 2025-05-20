import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Link
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import axios from '../../config/axios';
import Swal from 'sweetalert2';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import logo from '../../assets/agsffllogo.png';

const schema = Yup.object().shape({
  email: Yup.string().email('Correo inválido').required('Correo requerido'),
  documento: Yup.string().required('Documento requerido'),
  password: Yup.string().min(6, 'Mínimo 6 caracteres').required('Contraseña requerida'),
});

export const Register = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    try {
      Swal.fire({
        title: 'Procesando',
        text: 'Registrando usuario...',
        icon: 'info',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      await axios.post('/auth/register', data);

      Swal.fire({
        title: '¡Registro exitoso!',
        text: 'Usuario registrado correctamente',
        icon: 'success',
        confirmButtonText: 'Iniciar sesión',
        confirmButtonColor: '#1976d2'
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/auth/login');
        }
      });

      reset();

    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.mensaje || 'Error en el registro',
        icon: 'error',
        confirmButtonColor: '#1976d2'
      });
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
      <Box sx={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
        {/* Logo */}
        <Box sx={{ mb: 4 }}>
          <img src={logo} alt="Logo" style={{ height: 180, borderRadius: 100 }} />
        </Box>

        <Typography variant="h5" gutterBottom>
          Crear cuenta
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            fullWidth
            margin="normal"
            label="Correo"
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
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
            REGISTRARSE
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

        {/* Términos */}
        <Typography variant="caption" sx={{ mt: 4, display: 'block', color: 'white', opacity: 0.7 }}>
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
      </Box>
    </Box>
  );
};
