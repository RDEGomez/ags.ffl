import { useState, useEffect, useRef } from 'react';
import {
  Box, 
  TextField, 
  Button, 
  Typography, 
  Avatar, 
  Grid, 
  Paper, 
  Container,
  Card,
  CardContent,
  Breadcrumbs,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  Person as PersonIcon,
  NavigateNext as NavigateNextIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  AccountCircle as AccountCircleIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../config/axios';
import Swal from 'sweetalert2';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const EditarPerfil = () => {
  const { usuario, login } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    nombre: '',
    documento: '',
    email: ''
  });
  const [imagen, setImagen] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Usar un valor predeterminado para el API_URL en caso de que la variable de entorno no esté definida
  const API_URL = import.meta.env.VITE_BACKEND_URL || '';
  const imagePath = usuario?.imagen ? `${API_URL}/uploads/${usuario.imagen}` : '';
  const avatarSrc = preview || imagePath;

  useEffect(() => {
    const cargarDatos = async () => {
      if (!id) {
        if (!usuario) return;

        setForm({
          nombre: usuario.nombre || '',
          documento: usuario.documento || '',
          email: usuario.email || ''
        });

        if (usuario.imagen) {
          const url = `${API_URL}/uploads/${usuario.imagen}`;
          setPreview(url);
        }

        return;
      }

      try {
        setLoading(true);
        const { data } = await axiosInstance.get(`/usuarios/${id}`);

        setForm({
          nombre: data.nombre || '',
          documento: data.documento || '',
          email: data.email || ''
        });

        if (data.imagen) {
          const url = `${API_URL}/uploads/${data.imagen}`;
          setPreview(url);
        }
      } catch (error) {
        console.error('Error al cargar el usuario:', error);
        setError('No se pudo cargar la información del usuario.');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [id, usuario, API_URL]);

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño de archivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen debe ser menor a 5MB');
        return;
      }

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten archivos de imagen');
        return;
      }

      setImagen(file);
      setPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    
    if (!form.documento.trim()) {
      setError('El documento es obligatorio');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const formData = new FormData();
      formData.append('nombre', form.nombre);
      formData.append('documento', form.documento);
      if (imagen) formData.append('imagen', imagen);

      const userId = id || usuario._id;

      const { data } = await axiosInstance.patch(`/usuarios/${userId}`, formData);

      if (!id || id === usuario._id) {
        login({ usuario: data.usuario, token: localStorage.getItem('token') });
      }

      setSuccess('Perfil actualizado correctamente');
      
      // Mostrar SweetAlert de éxito
      Swal.fire({
        icon: 'success',
        title: 'Perfil actualizado',
        text: 'Tus cambios se han guardado correctamente.',
        confirmButtonText: 'Continuar',
        confirmButtonColor: '#1976d2',
        timer: 3000,
        timerProgressBar: true
      });

    } catch (error) {
      console.error(error);
      setError(error.response?.data?.mensaje || 'Hubo un problema al actualizar tu perfil. Inténtalo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleCancel = () => {
    if (id) {
      navigate('/usuarios');
    } else {
      navigate('/');
    }
  };

  // Animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15 } 
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const cardStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 3,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
    }
  };

  if (loading && !form.nombre) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        backgroundImage: 'linear-gradient(to bottom right, rgba(20, 20, 40, 0.9), rgba(10, 10, 30, 0.95))',
        borderRadius: 2
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%', 
      p: { xs: 2, md: 4 },
      backgroundImage: 'linear-gradient(to bottom right, rgba(20, 20, 40, 0.9), rgba(10, 10, 30, 0.95))',
      minHeight: 'calc(100vh - 64px)',
      borderRadius: 2
    }}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Breadcrumbs */}
        <motion.div variants={itemVariants}>
          <Breadcrumbs 
            separator={<NavigateNextIcon fontSize="small" />}
            sx={{ mb: 3, color: 'rgba(255,255,255,0.7)' }}
          >
            {id ? (
              <Link 
                to="/usuarios"
                style={{ 
                  color: 'inherit', 
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.target.style.color = 'white'}
                onMouseLeave={(e) => e.target.style.color = 'inherit'}
              >
                Usuarios
              </Link>
            ) : (
              <Link 
                to="/"
                style={{ 
                  color: 'inherit', 
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.target.style.color = 'white'}
                onMouseLeave={(e) => e.target.style.color = 'inherit'}
              >
                Inicio
              </Link>
            )}
            <Typography color="primary">Editar Perfil</Typography>
          </Breadcrumbs>
        </motion.div>

        {/* Header */}
        <motion.div variants={itemVariants}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 4,
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Typography variant="h4" component="h1" sx={{ 
              color: 'white',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              fontWeight: 'bold',
              borderLeft: '4px solid #3f51b5',
              pl: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <EditIcon sx={{ color: '#64b5f6' }} />
              Editar Perfil
            </Typography>
            
            <Button 
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleCancel}
              sx={{
                borderRadius: 2,
                borderWidth: 2,
                py: 1,
                px: 3,
                '&:hover': {
                  borderWidth: 2,
                  backgroundColor: 'rgba(255,255,255,0.05)'
                }
              }}
            >
              Volver
            </Button>
          </Box>
        </motion.div>

        {/* Alertas */}
        <AnimatePresence>
          {error && (
            <motion.div 
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                {error}
              </Alert>
            </motion.div>
          )}
          
          {success && (
            <motion.div 
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
                {success}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Formulario */}
        <Container maxWidth="md">
          <motion.div variants={itemVariants}>
            <Card sx={cardStyle}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 4,
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  pb: 2
                }}>
                  <AccountCircleIcon sx={{ color: '#64b5f6', mr: 2 }} />
                  <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Información Personal
                  </Typography>
                  <Chip 
                    label="Editando" 
                    color="warning" 
                    variant="outlined" 
                    size="small" 
                    sx={{ ml: 'auto' }}
                  />
                </Box>

                <form onSubmit={handleSubmit} encType="multipart/form-data">
                  <Grid container spacing={4}>
                    {/* Sección de imagen */}
                    <Grid item xs={12} md={4}>
                      <Card sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: 3,
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <CardContent sx={{ p: 3, textAlign: 'center' }}>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            mb: 2,
                            justifyContent: 'center',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            pb: 1
                          }}>
                            <PhotoCameraIcon sx={{ color: '#64b5f6', mr: 1 }} />
                            <Typography variant="h6" sx={{ color: 'white' }}>
                              Foto de Perfil
                            </Typography>
                          </Box>

                          {/* Input file oculto */}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImagenChange}
                            hidden
                            ref={fileInputRef}
                          />

                          {/* Avatar */}
                          <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
                            <Avatar
                              src={avatarSrc}
                              sx={{
                                width: 150,
                                height: 150,
                                cursor: 'pointer',
                                border: '3px solid rgba(100, 181, 246, 0.3)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  border: '3px solid #64b5f6',
                                  boxShadow: '0 0 20px rgba(100, 181, 246, 0.6)',
                                  transform: 'scale(1.05)'
                                }
                              }}
                              onClick={handleImageClick}
                            >
                              <PersonIcon sx={{ fontSize: 60 }} />
                            </Avatar>
                            
                            {/* Botón flotante para cambiar imagen */}
                            <IconButton
                              onClick={handleImageClick}
                              sx={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                backgroundColor: '#2196f3',
                                color: 'white',
                                width: 40,
                                height: 40,
                                '&:hover': {
                                  backgroundColor: '#1976d2',
                                  transform: 'scale(1.1)'
                                }
                              }}
                            >
                              <PhotoCameraIcon />
                            </IconButton>
                          </Box>

                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Haz clic en la imagen para cambiarla
                          </Typography>
                          
                          <Typography variant="caption" sx={{ 
                            color: 'rgba(255,255,255,0.6)',
                            display: 'block'
                          }}>
                            Formatos: JPG, PNG, SVG<br/>
                            Tamaño máximo: 5MB
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Sección de formulario */}
                    <Grid item xs={12} md={8}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <PersonIcon sx={{ color: '#64b5f6' }} />
                          <TextField
                            fullWidth
                            label="Nombre completo"
                            name="nombre"
                            value={form.nombre}
                            onChange={handleChange}
                            variant="outlined"
                            required
                            InputProps={{
                              sx: { borderRadius: 2 }
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                  borderColor: 'rgba(255, 255, 255, 0.3)',
                                },
                                '&:hover fieldset': {
                                  borderColor: 'rgba(100, 181, 246, 0.5)',
                                },
                              }
                            }}
                          />
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <BadgeIcon sx={{ color: '#64b5f6' }} />
                          <TextField
                            fullWidth
                            label="Documento de identidad"
                            name="documento"
                            value={form.documento}
                            onChange={handleChange}
                            variant="outlined"
                            required
                            InputProps={{
                              sx: { borderRadius: 2 }
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                  borderColor: 'rgba(255, 255, 255, 0.3)',
                                },
                                '&:hover fieldset': {
                                  borderColor: 'rgba(100, 181, 246, 0.5)',
                                },
                              }
                            }}
                          />
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <EmailIcon sx={{ color: '#64b5f6' }} />
                          <TextField
                            fullWidth
                            label="Correo electrónico"
                            name="email"
                            value={form.email}
                            disabled
                            variant="outlined"
                            InputProps={{
                              sx: { borderRadius: 2 }
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                  borderColor: 'rgba(255, 255, 255, 0.2)',
                                },
                              }
                            }}
                            helperText="El correo electrónico no se puede modificar"
                          />
                        </Box>

                        {/* Vista previa de información */}
                        <Box sx={{ 
                          p: 2, 
                          borderRadius: 2, 
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            👁️ Vista previa
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              src={avatarSrc}
                              sx={{ 
                                width: 40, 
                                height: 40,
                                border: '2px solid rgba(255, 255, 255, 0.2)'
                              }}
                            >
                              <PersonIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="body1" sx={{ 
                                color: 'white', 
                                fontWeight: 'medium'
                              }}>
                                {form.nombre || 'Nombre del usuario'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {form.documento || 'Documento de identidad'}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Botones de acción */}
                  <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    gap: 2,
                    flexWrap: 'wrap'
                  }}>
                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<CancelIcon />}
                      onClick={handleCancel}
                      disabled={loading}
                      sx={{
                        borderRadius: 2,
                        borderWidth: 2,
                        py: 1.5,
                        px: 4,
                        '&:hover': {
                          borderWidth: 2,
                          backgroundColor: 'rgba(255,255,255,0.05)'
                        }
                      }}
                    >
                      Cancelar
                    </Button>

                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                      disabled={loading}
                      sx={{
                        py: 1.5,
                        px: 4,
                        borderRadius: 2,
                        background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                        boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                        fontWeight: 'bold',
                        '&:disabled': {
                          background: 'rgba(255, 255, 255, 0.12)',
                          color: 'rgba(255, 255, 255, 0.3)'
                        }
                      }}
                    >
                      {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                  </Box>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </Container>
      </motion.div>
    </Box>
  );
};