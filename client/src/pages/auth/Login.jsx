// client/src/pages/auth/Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link as RouterLink } from 'react-router-dom';
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
  Lock
} from '@mui/icons-material';
import axiosInstance from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/agsffllogo.png';

// Componente de partículas flotantes
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

export const Login = () => {
  const { isAuthenticated, login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { data } = await axiosInstance.post('/auth/login', form);
      await login({ usuario: data.usuario, token: data.token });
      navigate('/');
    } catch (err) {
      console.error('Error en login:', err);
      setError(err.response?.data?.mensaje || 'Error al iniciar sesión');
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
          <Box sx={{ textAlign: 'center', mb: 5 }}>
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
              Login
            </Typography>
            
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: 15
              }}
            >
              Accede a tu cuenta
            </Typography>
          </Box>

          {/* Alerta de error */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                backgroundColor: 'rgba(244, 67, 54, 0.15)',
                border: '1px solid rgba(244, 67, 54, 0.3)',
                color: '#ff6b6b',
                borderRadius: 3,
                animation: 'shake 0.5s ease-in-out',
                '@keyframes shake': {
                  '0%, 100%': { transform: 'translateX(0)' },
                  '25%': { transform: 'translateX(-5px)' },
                  '75%': { transform: 'translateX(5px)' }
                }
              }}
            >
              {error}
            </Alert>
          )}

          {/* Formulario */}
          <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
            {/* Campo Email */}
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
                Email
              </Typography>
              <TextField
                fullWidth
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder=" "
                sx={{
                  '& .MuiInput-root': {
                    color: 'white',
                    fontSize: 16,
                    '&:before': {
                      borderBottomColor: 'rgba(255, 255, 255, 0.2)',
                      borderBottomWidth: 2
                    },
                    '&:hover:before': {
                      borderBottomColor: 'rgba(255, 255, 255, 0.4)'
                    },
                    '&:after': {
                      borderBottomColor: '#64b5f6',
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
                      <Email sx={{ color: '#64b5f6', mr: 1 }} />
                    </InputAdornment>
                  )
                }}
                variant="standard"
              />
            </Box>

            {/* Campo Password */}
            <Box sx={{ mb: 5 }}>
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
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                required
                placeholder=" "
                sx={{
                  '& .MuiInput-root': {
                    color: 'white',
                    fontSize: 16,
                    '&:before': {
                      borderBottomColor: 'rgba(255, 255, 255, 0.2)',
                      borderBottomWidth: 2
                    },
                    '&:hover:before': {
                      borderBottomColor: 'rgba(255, 255, 255, 0.4)'
                    },
                    '&:after': {
                      borderBottomColor: '#64b5f6',
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
                      <Lock sx={{ color: '#64b5f6', mr: 1 }} />
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
            </Box>

            {/* Forgot Password Link */}
            <Box sx={{ textAlign: 'right', mb: 4 }}>
              <Link
                href="#"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  textDecoration: 'none',
                  fontSize: 14,
                  transition: 'color 0.3s ease',
                  '&:hover': {
                    color: '#64b5f6',
                    textDecoration: 'underline'
                  }
                }}
              >
                Forgot Password
              </Link>
            </Box>

            {/* Botón de login */}
            <Button
              type="submit"
              fullWidth
              disabled={isSubmitting || loading}
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
              {isSubmitting || loading ? 'Logging in...' : 'Log In'}
            </Button>
          </Box>

          {/* Enlaces de registro */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                mb: 0.5,
                fontSize: 14
              }}
            >
              ¿Aún no tienes cuenta?
            </Typography>
            <Link
              component={RouterLink}
              to="/auth/register"
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
              Regístrate
            </Link>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};