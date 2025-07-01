// client/src/pages/auth/Register.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Link,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Badge,
  Person
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import axios from '../../config/axios';
import Swal from 'sweetalert2';
import logo from '../../assets/agsffllogo.png';

const schema = Yup.object().shape({
  email: Yup.string().email('Correo inválido').required('Correo requerido'),
  documento: Yup.string().required('Documento requerido'),
  password: Yup.string().min(6, 'Mínimo 6 caracteres').required('Contraseña requerida'),
});

// Componente de partículas flotantes (mismo que Login)
const FloatingParticles = () => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const generateParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 30; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 3 + 1,
          delay: Math.random() * 12,
          duration: Math.random() * 4 + 8
        });
      }
      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 2
      }}
    >
      {particles.map((particle) => (
        <Box
          key={particle.id}
          sx={{
            position: 'absolute',
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: '#64b5f6',
            borderRadius: '50%',
            opacity: 0.2,
            animation: `floatParticle ${particle.duration}s ease-in-out infinite`,
            animationDelay: `${particle.delay}s`,
            '@keyframes floatParticle': {
              '0%, 100%': {
                transform: 'translateY(0px) translateX(0px)',
                opacity: 0.2
              },
              '33%': {
                transform: 'translateY(-20px) translateX(10px)',
                opacity: 0.4
              },
              '66%': {
                transform: 'translateY(-10px) translateX(-5px)',
                opacity: 0.3
              }
            }
          }}
        />
      ))}
    </Box>
  );
};

export const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm({ resolver: yupResolver(schema) });

  // Watch form values para limpiar errores
  const watchedFields = watch();

  const onSubmit = async (data) => {
    setIsSubmitting(true);

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
        confirmButtonColor: '#ffd700',
        background: 'rgba(15, 20, 25, 0.95)',
        color: 'white'
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
        confirmButtonColor: '#ffd700',
        background: 'rgba(15, 20, 25, 0.95)',
        color: 'white'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `
          radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 215, 0, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(64, 181, 246, 0.2) 0%, transparent 50%),
          linear-gradient(135deg, #0f1419 0%, #1a237e 50%, #000051 100%)
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: 2
      }}
    >
      {/* Overlay para background image si se necesita */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 20, 25, 0.7)',
          zIndex: 1
        }}
      />

      {/* Partículas de fondo */}
      <FloatingParticles />

      {/* Contenedor principal */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 440,
          position: 'relative',
          zIndex: 10,
          animation: 'slideIn 0.8s ease-out',
          '@keyframes slideIn': {
            '0%': {
              opacity: 0,
              transform: 'translateY(50px)'
            },
            '100%': {
              opacity: 1,
              transform: 'translateY(0)'
            }
          }
        }}
      >
        {/* Card principal con glassmorphism */}
        <Box
          sx={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(25px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 6,
            padding: { xs: '40px 30px', md: '50px 40px' },
            boxShadow: `
              0 20px 40px rgba(0, 0, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #64b5f6, transparent)',
              animation: 'shimmer 3s ease-in-out infinite',
              '@keyframes shimmer': {
                '0%': { left: '-100%' },
                '100%': { left: '100%' }
              }
            }
          }}
        >
          {/* Header con logo */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            {/* Logo container */}
            <Box
              sx={{
                width: 160,
                height: 160,
                background: 'linear-gradient(135deg, #ffd700 0%, #f5c400 100%)',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: `
                  0 8px 20px rgba(255, 215, 0, 0.3),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2)
                `,
                animation: 'logoFloat 3s ease-in-out infinite',
                '@keyframes logoFloat': {
                  '0%, 100%': { transform: 'translateY(0px)' },
                  '50%': { transform: 'translateY(-3px)' }
                }
              }}
            >
              <img 
                src={logo} 
                alt="AGS Flag Football" 
                style={{ 
                  width: '150px', 
                  height: '150px', 
                  borderRadius: '12px',
                  objectFit: 'cover'
                }} 
              />
            </Box>
            
            {/* Título */}
            <Typography 
              variant="h4" 
              sx={{ 
                color: 'white',
                fontWeight: 300,
                mb: 1,
                letterSpacing: 1
              }}
            >
              Registro
            </Typography>
            
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: 15
              }}
            >
              Crea tu cuenta nueva
            </Typography>
          </Box>

          {/* Formulario */}
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mb: 4 }}>
            {/* Campo Email */}
            <Box sx={{ mb: 3 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: 500,
                  mb: 1,
                  fontSize: 14
                }}
              >
                Email
              </Typography>
              <TextField
                fullWidth
                {...register('email')}
                error={!!errors.email}
                placeholder=" "
                sx={{
                  '& .MuiInput-root': {
                    color: 'white',
                    fontSize: 16,
                    '&:before': {
                      borderBottomColor: errors.email ? '#f44336' : 'rgba(255, 255, 255, 0.2)',
                      borderBottomWidth: 2
                    },
                    '&:hover:before': {
                      borderBottomColor: errors.email ? '#f44336' : 'rgba(255, 255, 255, 0.4)'
                    },
                    '&:after': {
                      borderBottomColor: errors.email ? '#f44336' : '#64b5f6',
                      borderBottomWidth: 2
                    }
                  },
                  '& .MuiInput-input': {
                    padding: '16px 0',
                    '&::placeholder': {
                      color: 'rgba(255, 255, 255, 0.4)'
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: errors.email ? '#f44336' : '#64b5f6', mr: 1 }} />
                    </InputAdornment>
                  )
                }}
                variant="standard"
              />
              {errors.email && (
                <Typography variant="caption" sx={{ color: '#f44336', mt: 0.5, display: 'block' }}>
                  {errors.email.message}
                </Typography>
              )}
            </Box>

            {/* Campo Documento */}
            <Box sx={{ mb: 3 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: 500,
                  mb: 1,
                  fontSize: 14
                }}
              >
                Documento
              </Typography>
              <TextField
                fullWidth
                {...register('documento')}
                error={!!errors.documento}
                placeholder=" "
                sx={{
                  '& .MuiInput-root': {
                    color: 'white',
                    fontSize: 16,
                    '&:before': {
                      borderBottomColor: errors.documento ? '#f44336' : 'rgba(255, 255, 255, 0.2)',
                      borderBottomWidth: 2
                    },
                    '&:hover:before': {
                      borderBottomColor: errors.documento ? '#f44336' : 'rgba(255, 255, 255, 0.4)'
                    },
                    '&:after': {
                      borderBottomColor: errors.documento ? '#f44336' : '#64b5f6',
                      borderBottomWidth: 2
                    }
                  },
                  '& .MuiInput-input': {
                    padding: '16px 0',
                    '&::placeholder': {
                      color: 'rgba(255, 255, 255, 0.4)'
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Badge sx={{ color: errors.documento ? '#f44336' : '#64b5f6', mr: 1 }} />
                    </InputAdornment>
                  )
                }}
                variant="standard"
              />
              {errors.documento && (
                <Typography variant="caption" sx={{ color: '#f44336', mt: 0.5, display: 'block' }}>
                  {errors.documento.message}
                </Typography>
              )}
            </Box>

            {/* Campo Password */}
            <Box sx={{ mb: 4 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: 500,
                  mb: 1,
                  fontSize: 14
                }}
              >
                Password
              </Typography>
              <TextField
                fullWidth
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                error={!!errors.password}
                placeholder=" "
                sx={{
                  '& .MuiInput-root': {
                    color: 'white',
                    fontSize: 16,
                    '&:before': {
                      borderBottomColor: errors.password ? '#f44336' : 'rgba(255, 255, 255, 0.2)',
                      borderBottomWidth: 2
                    },
                    '&:hover:before': {
                      borderBottomColor: errors.password ? '#f44336' : 'rgba(255, 255, 255, 0.4)'
                    },
                    '&:after': {
                      borderBottomColor: errors.password ? '#f44336' : '#64b5f6',
                      borderBottomWidth: 2
                    }
                  },
                  '& .MuiInput-input': {
                    padding: '16px 0',
                    '&::placeholder': {
                      color: 'rgba(255, 255, 255, 0.4)'
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: errors.password ? '#f44336' : '#64b5f6', mr: 1 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={togglePasswordVisibility}
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.6)',
                          '&:hover': { color: '#64b5f6' }
                        }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                variant="standard"
              />
              {errors.password && (
                <Typography variant="caption" sx={{ color: '#f44336', mt: 0.5, display: 'block' }}>
                  {errors.password.message}
                </Typography>
              )}
            </Box>

            {/* Botón de registro */}
            <Button
              type="submit"
              fullWidth
              disabled={isSubmitting}
              sx={{
                py: 2.5,
                borderRadius: '50px',
                background: 'linear-gradient(135deg, #ffd700 0%, #f5c400 100%)',
                color: '#000',
                fontSize: 16,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 1,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 6px 20px rgba(255, 215, 0, 0.4)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(255, 215, 0, 0.5)',
                  background: 'linear-gradient(135deg, #f5c400 0%, #ffd700 100%)'
                },
                '&:active': {
                  transform: 'translateY(0)'
                },
                '&:disabled': {
                  background: 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)',
                  color: '#666',
                  transform: 'none',
                  boxShadow: 'none'
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                  transition: 'left 0.6s ease'
                },
                '&:hover::before': {
                  left: '100%'
                }
              }}
            >
              {isSubmitting ? 'Registrando...' : 'Register'}
            </Button>
          </Box>

          {/* Enlaces de login */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                mb: 0.5,
                fontSize: 14
              }}
            >
              ¿Ya tienes una cuenta?
            </Typography>
            <Link
              component={RouterLink}
              to="/auth/login"
              sx={{
                color: '#64b5f6',
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'all 0.3s ease',
                '&:hover': {
                  color: '#ffd700',
                  textDecoration: 'underline'
                }
              }}
            >
              Iniciar sesión
            </Link>
          </Box>

          {/* Footer con términos */}
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block',
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.5)',
              mt: 4,
              lineHeight: 1.4,
              fontSize: 12
            }}
          >
            Al registrarte aceptas nuestros{' '}
            <Link 
              href="#" 
              sx={{ 
                color: '#64b5f6',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              Términos y Condiciones
            </Link>
            {' '}y{' '}
            <Link 
              href="#" 
              sx={{ 
                color: '#64b5f6',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              Política de Privacidad
            </Link>
            .
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};