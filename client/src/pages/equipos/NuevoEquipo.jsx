import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as Yup from 'yup'
import axiosInstance from '../../config/axios'
import Swal from 'sweetalert2'
import { useNavigate, Link } from 'react-router-dom'
import { 
  Box, 
  Button, 
  CircularProgress,
  Divider,
  FormControl, 
  FormHelperText, 
  MenuItem, 
  TextField, 
  Typography,
  Card,
  CardContent,
  Breadcrumbs,
  Chip,
  Avatar,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar
} from '@mui/material'
import {
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  AddPhotoAlternate as AddPhotoAlternateIcon,
  NavigateNext as NavigateNextIcon,
  Groups as GroupsIcon,
  Preview as PreviewIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import { getCategoryName } from '../../helpers/mappings'
import { useImage } from '../../hooks/useImage' // 🔥 Importar el hook
import { useAuth } from '../../context/AuthContext' // 🔥 AGREGADO: Import useAuth
import { ImageUpload } from '../../components/ImageUpload' // 🔥 AGREGADO: Import del componente ImageUpload

// 🔥 Componente para mostrar equipos existentes
const EquipoListItem = ({ equipo, index }) => {
  const equipoImageUrl = useImage(equipo.imagen, '');
  
  return (
    <motion.div
      key={equipo._id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <ListItem sx={{ 
        bgcolor: 'rgba(255,255,255,0.05)', 
        borderRadius: 2,
        mb: 1,
        '&:hover': {
          bgcolor: 'rgba(255,255,255,0.1)'
        }
      }}>
        <ListItemAvatar>
          <Avatar 
            src={equipoImageUrl}
            sx={{ 
              border: '2px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <GroupsIcon />
          </Avatar>
        </ListItemAvatar>
        <ListItemText 
          primary={
            <Typography variant="body1" sx={{ color: 'white', fontWeight: 'medium' }}>
              {equipo.nombre}
            </Typography>
          }
          secondary={
            <Typography variant="caption" color="text.secondary">
              {getCategoryName(equipo.categoria)}
            </Typography>
          }
        />
        {equipo._id === 0 && ( // Placeholder para el primer equipo recién creado
          <Chip 
            label="Recién creado" 
            color="success" 
            size="small"
            icon={<CheckCircleIcon />}
            sx={{ ml: 1 }}
          />
        )}
      </ListItem>
    </motion.div>
  );
};

export const NuevoEquipo = () => {
  // 🔥 AGREGADO: Verificar permisos de gestión de equipos
  const { puedeGestionarEquipos } = useAuth();
  const navigate = useNavigate();

  // 🔥 AGREGADO: Verificación de acceso al componente
  useEffect(() => {
    if (!puedeGestionarEquipos()) {
      Swal.fire({
        icon: 'warning',
        title: 'Acceso Denegado',
        text: 'No tienes permisos para crear equipos.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#1976d2'
      }).then(() => {
        navigate('/equipos'); // Redirigir a la lista de equipos
      });
      return;
    }
  }, [puedeGestionarEquipos, navigate]);

  // 🔥 CAMBIADO: Estados para manejo de imagen con ImageUpload
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [equipoRecienCreado, setEquipoRecienCreado] = useState(null);

  // 🔥 CAMBIADO: Esquema de validación sin validación de imagen (se maneja en ImageUpload)
  const schema = Yup.object().shape({
    nombre: Yup.string().required('El nombre es obligatorio'),
    categoria: Yup.string().required('La categoría es obligatoria'),
  })

  const {
    register,
    reset,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      nombre: '',
      categoria: '',
    },
  })

  // Observar valores para vista previa
  const nombreActual = watch('nombre');
  const categoriaActual = watch('categoria');

  // Cargar equipos existentes
  useEffect(() => {
    const fetchEquipos = async () => {
      try {
        const response = await axiosInstance.get('/equipos');
        setEquipos(response.data);
      } catch (error) {
        console.error('Error al cargar equipos:', error);
        setError('Error al cargar la lista de equipos');
      } finally {
        setLoading(false);
      }
    };

    // 🔥 AGREGADO: Solo cargar equipos si tiene permisos
    if (puedeGestionarEquipos()) {
      fetchEquipos();
    }
  }, [puedeGestionarEquipos]);

  // 🔥 NUEVO: Funciones para manejar selección de imagen
  const handleImageSelect = (file) => {
    setImagenSeleccionada(file);
  };

  const handleImageRemove = () => {
    setImagenSeleccionada(null);
  };

  const onSubmit = async (data) => {
    // 🔥 AGREGADO: Verificación adicional antes de enviar
    if (!puedeGestionarEquipos()) {
      Swal.fire({
        icon: 'error',
        title: 'Acceso Denegado',
        text: 'No tienes permisos para crear equipos.'
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('nombre', data.nombre);
      formData.append('categoria', data.categoria);
      
      // 🔥 CAMBIADO: Usar imagenSeleccionada del componente ImageUpload
      if (imagenSeleccionada) {
        console.log('🔍 DEBUG: Archivo a enviar:', {
          name: imagenSeleccionada.name,
          type: imagenSeleccionada.type,
          size: imagenSeleccionada.size,
          isFile: imagenSeleccionada instanceof File
        });
        formData.append('imagen', imagenSeleccionada);
      }

      const response = await axiosInstance.post('/equipos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // 🔥 Agregar el nuevo equipo a la lista y marcarlo como recién creado
      const nuevoEquipo = response.data.equipo;
      setEquipoRecienCreado(nuevoEquipo);
      setEquipos([nuevoEquipo, ...equipos]);

      Swal.fire({
        icon: 'success',
        title: 'Equipo creado correctamente',
        showConfirmButton: false,
        timer: 2000,
      })

      // 🔥 CAMBIADO: Limpiar formulario incluyendo imagen seleccionada
      reset();
      setImagenSeleccionada(null);
    } catch (error) {
      console.error(error)
      Swal.fire({
        icon: 'error',
        title: 'Error al crear el equipo',
        text: error.response?.data?.mensaje || 'Algo salió mal',
      })
    }
  }

  // 🔥 AGREGADO: Si no tiene permisos, no renderizar el componente (redundancia de seguridad)
  if (!puedeGestionarEquipos()) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        backgroundImage: 'linear-gradient(to bottom right, rgba(20, 20, 40, 0.9), rgba(10, 10, 30, 0.95))',
        borderRadius: 2
      }}>
        <Alert severity="warning" sx={{ maxWidth: 400 }}>
          <Typography variant="h6" gutterBottom>
            Acceso Denegado
          </Typography>
          <Typography variant="body2">
            No tienes permisos para acceder a esta página.
          </Typography>
          <Button 
            component={Link} 
            to="/equipos" 
            variant="contained" 
            sx={{ mt: 2 }}
          >
            Volver a Equipos
          </Button>
        </Alert>
      </Box>
    );
  }

  // Filtrar equipos por categoría seleccionada
  const equiposFiltrados = categoriaActual 
    ? equipos.filter(equipo => equipo.categoria === categoriaActual)
    : equipos;

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
            <Link 
              to="/equipos"
              style={{ 
                color: 'inherit', 
                textDecoration: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.color = 'white'}
              onMouseLeave={(e) => e.target.style.color = 'inherit'}
            >
              Equipos
            </Link>
            <Typography color="primary">Nuevo Equipo</Typography>
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
              <AddIcon sx={{ color: '#64b5f6' }} />
              Crear Nuevo Equipo
            </Typography>
            
            <Button 
              component={Link}
              to="/equipos"
              variant="outlined"
              startIcon={<ArrowBackIcon />}
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
              Volver a Equipos
            </Button>
          </Box>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div variants={itemVariants}>
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          </motion.div>
        )}

        {/* Layout principal */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 4 }}>
          {/* Formulario - 60% */}
          <Box sx={{ flexBasis: { lg: '60%' } }}>
            <motion.div variants={itemVariants}>
              <Card sx={cardStyle}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 3,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    pb: 2
                  }}>
                    <GroupsIcon sx={{ color: '#64b5f6', mr: 2 }} />
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                      Información del Nuevo Equipo
                    </Typography>
                    <Chip 
                      label="Nuevo" 
                      color="success" 
                      variant="outlined" 
                      size="small" 
                      sx={{ ml: 'auto' }}
                    />
                  </Box>

                  <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
                      {/* 🔥 CAMBIADO: Sección de imagen usando ImageUpload */}
                      <Box sx={{ flexBasis: { md: '40%' } }}>
                        <Card sx={{
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: 3,
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          <CardContent sx={{ p: 3 }}>
                            <ImageUpload
                              onImageSelect={handleImageSelect}
                              onImageRemove={handleImageRemove}
                              size={200}
                              label="Seleccionar logo del equipo"
                            />
                          </CardContent>
                        </Card>
                      </Box>

                      {/* Sección de formulario */}
                      <Box sx={{ flexBasis: { md: '60%' } }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <TextField
                            fullWidth
                            label="Nombre del Equipo"
                            variant="outlined"
                            {...register('nombre')}
                            error={!!errors.nombre}
                            helperText={errors.nombre?.message}
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

                          <Controller
                            name="categoria"
                            control={control}
                            defaultValue=""
                            render={({ field }) => (
                              <TextField
                                {...field}
                                select
                                fullWidth
                                label="Categoría"
                                variant="outlined"
                                error={!!errors.categoria}
                                helperText={errors.categoria?.message || 'Selecciona la categoría del equipo'}
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
                              >
                                <MenuItem value="" disabled>-- Seleccione una categoría --</MenuItem>
                                <MenuItem value="mixgold">Mixto Golden</MenuItem>
                                <MenuItem value="mixsilv">Mixto Silver</MenuItem>
                                <MenuItem value="vargold">Varonil Golden</MenuItem>
                                <MenuItem value="varsilv">Varonil Silver</MenuItem>
                                <MenuItem value="femgold">Femenil Golden</MenuItem>
                                <MenuItem value="femsilv">Femenil Silver</MenuItem>
                                <MenuItem value="varmast">Varonil Master</MenuItem>
                                <MenuItem value="femmast">Femenil Master</MenuItem>
                                <MenuItem value="tocho7v7">Tocho 7 v 7</MenuItem>
                                <MenuItem value="u8">U-8</MenuItem>
                                <MenuItem value="u10">U-10</MenuItem>
                                <MenuItem value="u12fem">U-12 Femenil</MenuItem>
                                <MenuItem value="u12var">U-12 Varonil</MenuItem>
                                <MenuItem value="u14fem">U-14 Femenil</MenuItem>
                                <MenuItem value="u14var">U-14 Varonil</MenuItem>
                                <MenuItem value="u16fem">U-16 Femenil</MenuItem>
                                <MenuItem value="u16var">U-16 Varonil</MenuItem>
                                <MenuItem value="u18fem">U-18 Femenil</MenuItem>
                                <MenuItem value="u18var">U-18 Varonil</MenuItem>
                              </TextField>
                            )}
                          />

                          {/* 🔥 CAMBIADO: Vista previa usando imagenSeleccionada */}
                          <Box sx={{ 
                            p: 2, 
                            borderRadius: 2, 
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              👁️ Vista previa en tiempo real
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar
                                src={imagenSeleccionada ? URL.createObjectURL(imagenSeleccionada) : ''}
                                sx={{ 
                                  width: 40, 
                                  height: 40,
                                  border: '2px solid rgba(255, 255, 255, 0.2)'
                                }}
                              >
                                <GroupsIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="body1" sx={{ 
                                  color: 'white', 
                                  fontWeight: 'medium',
                                  minHeight: '24px'
                                }}>
                                  {nombreActual || 'Nombre del equipo'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{
                                  minHeight: '16px'
                                }}>
                                  {categoriaActual ? getCategoryName(categoriaActual) : 'Categoría del equipo'}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    </Box>

                    {/* Botones de acción */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'flex-end', 
                      gap: 2, 
                      mt: 4,
                      pt: 3,
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<CancelIcon />}
                        onClick={() => {
                          reset();
                          setImagenSeleccionada(null);
                        }}
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
                        Limpiar
                      </Button>

                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        sx={{
                          py: 1.5,
                          px: 4,
                          borderRadius: 2,
                          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                          boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                          fontWeight: 'bold'
                        }}
                      >
                        Crear Equipo
                      </Button>
                    </Box>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </Box>

          {/* Lista de equipos existentes - 40% */}
          <Box sx={{ flexBasis: { lg: '40%' } }}>
            <motion.div variants={itemVariants}>
              <Card sx={cardStyle}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 2,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    pb: 2
                  }}>
                    <PreviewIcon sx={{ color: '#64b5f6', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: 'white' }}>
                      Equipos Registrados
                    </Typography>
                    <Chip 
                      label={categoriaActual ? equiposFiltrados.length : equipos.length} 
                      color="primary" 
                      size="small" 
                      sx={{ ml: 'auto' }}
                    />
                  </Box>

                  {categoriaActual && (
                    <Box sx={{ mb: 2 }}>
                      <Chip 
                        label={`Filtrando por: ${getCategoryName(categoriaActual)}`}
                        color="secondary"
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                  )}

                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : equiposFiltrados.length === 0 ? (
                    <Box sx={{ 
                      p: 3, 
                      textAlign: 'center',
                      border: '2px dashed rgba(255,255,255,0.2)',
                      borderRadius: 2
                    }}>
                      <GroupsIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {categoriaActual 
                          ? `No hay equipos en la categoría ${getCategoryName(categoriaActual)}`
                          : 'No hay equipos registrados aún'
                        }
                      </Typography>
                    </Box>
                  ) : (
                    <List sx={{ 
                      maxHeight: 400, 
                      overflow: 'auto',
                      '&::-webkit-scrollbar': {
                        width: '8px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(255,255,255,.3)',
                        borderRadius: '4px',
                      }
                    }}>
                      <AnimatePresence>
                        {equiposFiltrados.map((equipo, index) => (
                          <EquipoListItem 
                            key={equipo._id}
                            equipo={{
                              ...equipo,
                              // 🔥 Marcar como recién creado si coincide
                              _id: equipoRecienCreado && equipoRecienCreado._id === equipo._id ? 0 : equipo._id
                            }}
                            index={index}
                          />
                        ))}
                      </AnimatePresence>
                    </List>
                  )}

                  <Box sx={{ textAlign: 'center', mt: 3, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <Button 
                      component={Link}
                      to="/equipos"
                      variant="outlined" 
                      startIcon={<PreviewIcon />}
                      sx={{
                        borderRadius: 2,
                        borderWidth: 2,
                        px: 3,
                        '&:hover': {
                          borderWidth: 2,
                          backgroundColor: 'rgba(255,255,255,0.05)'
                        }
                      }}
                    >
                      Ver Todos los Equipos
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Box>
        </Box>
      </motion.div>
    </Box>
  )
}