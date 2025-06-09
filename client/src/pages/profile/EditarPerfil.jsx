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
  Divider,
  LinearProgress
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
  AccountCircle as AccountCircleIcon,
  Delete as DeleteIcon,
  Compress as CompressIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../config/axios';
import Swal from 'sweetalert2';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useImage } from '../../hooks/useImage';
import { useImageCompression } from '../../hooks/useImageCompression';

// 🔥 Componente para vista previa de avatar con compresión
const AvatarPreview = ({ src, alt, onClick, size = 150, compressing, compressionProgress }) => {
  return (
    <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
      <Avatar
        src={src}
        sx={{
          width: size,
          height: size,
          cursor: 'pointer',
          border: '3px solid rgba(100, 181, 246, 0.3)',
          transition: 'all 0.3s ease',
          '&:hover': {
            border: '3px solid #64b5f6',
            boxShadow: '0 0 20px rgba(100, 181, 246, 0.6)',
            transform: 'scale(1.05)'
          }
        }}
        onClick={onClick}
      >
        <PersonIcon sx={{ fontSize: size / 2.5 }} />
      </Avatar>
      
      {/* Botón flotante para cambiar imagen */}
      <IconButton
        onClick={onClick}
        sx={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          backgroundColor: compressing ? '#ff9800' : '#2196f3',
          color: 'white',
          width: 40,
          height: 40,
          '&:hover': {
            backgroundColor: compressing ? '#f57c00' : '#1976d2',
            transform: 'scale(1.1)'
          }
        }}
      >
        {compressing ? <CompressIcon /> : <PhotoCameraIcon />}
      </IconButton>

      {/* Progreso de compresión */}
      {compressing && (
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderRadius: '50%',
          padding: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: size * 0.8,
          height: size * 0.8,
        }}>
          <CircularProgress 
            variant="determinate" 
            value={compressionProgress} 
            size={40}
            sx={{ color: '#64b5f6', mb: 1 }}
          />
          <Typography variant="caption" sx={{ color: 'white', textAlign: 'center' }}>
            Comprimiendo<br/>{compressionProgress}%
          </Typography>
        </Box>
      )}
    </Box>
  );
};

// 🔥 Componente para vista previa de información
const VistaPrevia = ({ form, avatarSrc }) => {
  return (
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
  );
};

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
  
  // 🔥 Estados para compresión de imagen
  const [imagenComprimida, setImagenComprimida] = useState(null);
  const [preview, setPreview] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 🔥 NUEVO: Estado para el usuario que se está editando
  const [usuarioEditando, setUsuarioEditando] = useState(null);

  // 🔥 Hook de compresión de imágenes
  const { compressImage, compressing, compressionProgress } = useImageCompression();

  // 🔥 CORREGIDO: Usar la imagen del usuario que se está editando
  const usuarioImageUrl = useImage(usuarioEditando?.imagen || usuario?.imagen, '');
  
  // 🔥 Determinar qué imagen mostrar: preview (nueva) o imagen del usuario editando
  const avatarSrc = preview || usuarioImageUrl;

  useEffect(() => {
    const cargarDatos = async () => {
      if (!id) {
        // Editando perfil propio
        if (!usuario) return;

        setForm({
          nombre: usuario.nombre || '',
          documento: usuario.documento || '',
          email: usuario.email || ''
        });
        
        // 🔥 NUEVO: Establecer usuario editando
        setUsuarioEditando(usuario);

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
        
        // 🔥 NUEVO: Establecer usuario editando
        setUsuarioEditando(data);

      } catch (error) {
        console.error('Error al cargar el usuario:', error);
        setError('No se pudo cargar la información del usuario.');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [id, usuario]);

  // 🔥 NUEVA función para manejar selección de imagen con compresión
  const handleImagenChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');

    try {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Por favor selecciona una imagen válida');
      }

      // Validar tamaño (20MB máximo antes de compresión)
      if (file.size > 20 * 1024 * 1024) {
        throw new Error('La imagen es demasiado grande (máximo 20MB)');
      }

      // Comprimir imagen
      const compressedFile = await compressImage(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(compressedFile);

      // Guardar imagen comprimida
      setImagenComprimida(compressedFile);

    } catch (error) {
      console.error('Error procesando imagen:', error);
      setError(error.message);
      setPreview('');
      setImagenComprimida(null);
    }

    // Limpiar input
    e.target.value = '';
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
      
      // 🔥 CAMBIADO: Usar imagen comprimida
      if (imagenComprimida) {
        formData.append('imagen', imagenComprimida);
      }

      const userId = id || usuario._id;

      const { data } = await axiosInstance.patch(`/usuarios/${userId}`, formData);

      // Solo actualizar contexto si es el usuario loggeado
      if (!id || id === usuario._id) {
        login({ usuario: data.usuario, token: localStorage.getItem('token') });
      }

      setSuccess('Perfil actualizado correctamente');
      
      Swal.fire({
        icon: 'success',
        title: 'Perfil actualizado',
        text: 'Los cambios se han guardado correctamente.',
        confirmButtonText: 'Continuar',
        confirmButtonColor: '#1976d2',
        timer: 3000,
        timerProgressBar: true
      });

    } catch (error) {
      console.error(error);
      setError(error.response?.data?.mensaje || 'Hubo un problema al actualizar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = () => {
    if (!compressing) {
      fileInputRef.current.click();
    }
  };

  // 🔥 Función para remover imagen
  const handleRemoveImage = () => {
    setPreview('');
    setImagenComprimida(null);
    setError('');
  };

  return (
    <Container maxWidth="lg" sx={{ 
      py: 4, 
      backgroundImage: 'linear-gradient(to bottom right, rgba(20, 20, 40, 0.9), rgba(10, 10, 30, 0.95))',
      borderRadius: 2,
      minHeight: 'calc(100vh - 64px)'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Breadcrumbs */}
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{ mb: 3, color: 'rgba(255,255,255,0.7)' }}
        >
          <Typography color="primary">Usuarios</Typography>
          <Typography color="primary">
            {id ? `Editar: ${usuarioEditando?.nombre || 'Usuario'}` : 'Mi Perfil'}
          </Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
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
            <AccountCircleIcon sx={{ color: '#64b5f6' }} />
            {id ? `Editando: ${usuarioEditando?.nombre || 'Usuario'}` : 'Mi Perfil'}
          </Typography>
          
          <Button
            component={Link}
            to="/usuarios"
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            sx={{
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }
            }}
          >
            Volver a Usuarios
          </Button>
        </Box>

        {loading && !usuarioEditando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={4}>
            {/* Sección de imagen */}
            <Grid item xs={12} md={4}>
              <Card sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                borderRadius: 3,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                overflow: 'hidden'
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

                  {/* Avatar con vista previa */}
                  <AvatarPreview 
                    src={avatarSrc}
                    alt={`Foto de ${usuarioEditando?.nombre || form.nombre}`}
                    onClick={handleImageClick}
                    size={150}
                    compressing={compressing}
                    compressionProgress={compressionProgress}
                  />

                  {/* Botón para remover imagen */}
                  {(preview || imagenComprimida) && (
                    <Tooltip title="Eliminar imagen">
                      <IconButton
                        onClick={handleRemoveImage}
                        disabled={compressing}
                        sx={{
                          mb: 2,
                          backgroundColor: 'rgba(244, 67, 54, 0.1)',
                          color: '#f44336',
                          '&:hover': {
                            backgroundColor: 'rgba(244, 67, 54, 0.2)',
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  )}

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {compressing ? 'Comprimiendo imagen...' : 'Haz clic en la imagen para cambiarla'}
                  </Typography>
                  
                  <Typography variant="caption" sx={{ 
                    color: 'rgba(255,255,255,0.6)',
                    display: 'block'
                  }}>
                    Formatos: JPG, PNG, WebP<br/>
                    Tamaño máximo: 20MB (se comprimirá automáticamente)
                  </Typography>
                </CardContent>
              </Card>

              {/* Vista previa */}
              <Box sx={{ mt: 3 }}>
                <VistaPrevia form={form} avatarSrc={avatarSrc} />
              </Box>
            </Grid>

            {/* Sección de formulario */}
            <Grid item xs={12} md={8}>
              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                    disabled={loading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.5)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#64b5f6',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&.Mui-focused': {
                          color: '#64b5f6',
                        },
                      },
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
                    disabled={loading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.5)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#64b5f6',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&.Mui-focused': {
                          color: '#64b5f6',
                        },
                      },
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <EmailIcon sx={{ color: '#64b5f6' }} />
                  <TextField
                    fullWidth
                    label="Correo electrónico"
                    name="email"
                    type="email"
                    value={form.email}
                    variant="outlined"
                    disabled
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'rgba(255, 255, 255, 0.6)',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.5)',
                      },
                    }}
                  />
                </Box>

                {/* Mostrar errores */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Alert severity="error">{error}</Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Mostrar éxito */}
                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Alert severity="success" icon={<CheckCircleIcon />}>
                        {success}
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Botones de acción */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={loading || compressing}
                    sx={{
                      flex: 1,
                      minWidth: 150,
                      background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                      boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                    }}
                  >
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>

                  <Button
                    component={Link}
                    to="/usuarios"
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    disabled={loading}
                    sx={{
                      color: 'white',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)'
                      }
                    }}
                  >
                    Cancelar
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        )}
      </motion.div>
    </Container>
  );
};