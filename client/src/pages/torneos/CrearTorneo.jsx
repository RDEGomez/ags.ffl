import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import { 
  Box, 
  Typography, 
  Grid, 
  Chip, 
  Card, 
  CardContent, 
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  FormHelperText,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Stack
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import { NavLink, useNavigate } from 'react-router-dom';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CategoryIcon from '@mui/icons-material/Category';
import axiosInstance from '../../config/axios';

export const CrearTorneo = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_BACKEND_URL || '';

  // Estados para UI
  const [imagen, setImagen] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Mapeo de categorías para mostrar nombres legibles
  const categoriasMapping = {
    'mixgold': 'Mixto Gold',
    'mixsilv': 'Mixto Silver',
    'vargold': 'Varonil Gold',
    'varsilv': 'Varonil Silver',
    'femgold': 'Femenil Gold',
    'femsilv': 'Femenil Silver',
    'varmast': 'Varonil Master',
    'femmast': 'Femenil Master',
    'tocho7v7': 'Tocho 7 v 7',
    'u8': 'U-8',
    'u10': 'U-10',
    'u12': 'U-12',
    'u14': 'U-14',
    'u16': 'U-16',
    'u18': 'U-18'
  };

  // Esquema de validación con Yup
  const schema = Yup.object().shape({
    nombre: Yup.string().required('El nombre del torneo es obligatorio'),
    fechaInicio: Yup.date()
      .required('La fecha de inicio es obligatoria')
      .typeError('Fecha de inicio no válida'),
    fechaFin: Yup.date()
      .required('La fecha de fin es obligatoria')
      .typeError('Fecha de fin no válida')
      .min(
        Yup.ref('fechaInicio'), 
        'La fecha de fin debe ser posterior a la fecha de inicio'
      ),
    categorias: Yup.array()
      .min(1, 'Selecciona al menos una categoría')
      .required('Selecciona al menos una categoría'),
    estado: Yup.string()
      .oneOf(['activo', 'inactivo'], 'Estado no válido')
      .required('El estado es obligatorio')
  });

  // Configurar React Hook Form
  const { 
    register, 
    handleSubmit, 
    control, 
    formState: { errors }, 
    watch, 
    setValue 
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      nombre: '',
      fechaInicio: null,
      fechaFin: null,
      categorias: [],
      estado: 'activo'
    }
  });

  // Función para manejar la selección de imagen
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagen(file);
      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl);
    }
  };

  // Valores observados para cálculos de UI
  const fechaInicio = watch('fechaInicio');
  const fechaFin = watch('fechaFin');
  
  // Función para manejar el envío del formulario
  const onSubmit = async (data) => {
    setCargando(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('nombre', data.nombre);
      
      // Asegurarse de que las fechas son válidas antes de convertirlas
      if (data.fechaInicio instanceof Date && !isNaN(data.fechaInicio)) {
        formData.append('fechaInicio', data.fechaInicio.toISOString());
      }
      
      if (data.fechaFin instanceof Date && !isNaN(data.fechaFin)) {
        formData.append('fechaFin', data.fechaFin.toISOString());
      }
      
      // Manejar las categorías correctamente
      data.categorias.forEach(categoria => {
        formData.append('categorias[]', categoria);
      });
      
      formData.append('estado', data.estado);
      
      if (imagen) {
        formData.append('imagen', imagen);
      }

      const response = await axiosInstance.post('/torneos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      Swal.fire({
        icon: 'success',
        title: 'Torneo creado',
        text: 'El torneo se ha creado correctamente',
        confirmButtonText: 'Ver torneos',
        showCancelButton: true,
        cancelButtonText: 'Crear otro'
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/torneos');
        }
      });
    } catch (error) {
      console.error('Error al crear torneo:', error);
      setError(error.response?.data?.msg || 'Error al crear el torneo');
    } finally {
      setCargando(false);
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

  // Estilos consistentes para las tarjetas
  const cardStyle = {
    backdropFilter: 'blur(10px)', 
    backgroundColor: 'rgba(0, 0, 0, 0.7)', 
    borderRadius: 3,
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 12px 20px rgba(0, 0, 0, 0.2)'
    }
  };

  const headerStyle = {
    p: 2, 
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'white', 
    display: 'flex', 
    alignItems: 'center',
    justifyContent: 'space-between'
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
        <motion.div variants={itemVariants}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 4 
          }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ 
              color: 'white',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              fontWeight: 'bold',
              borderLeft: '4px solid #3f51b5',
              pl: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <EmojiEventsIcon sx={{ fontSize: 32 }} />
              Crear Nuevo Torneo
            </Typography>
            
            <Button 
              component={NavLink}
              to="/torneos"
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              sx={{
                borderRadius: 2,
                borderWidth: 2,
                py: 1,
                px: 2,
                '&:hover': {
                  borderWidth: 2,
                  backgroundColor: 'rgba(255,255,255,0.05)'
                }
              }}
            >
              Volver a Torneos
            </Button>
          </Box>
        </motion.div>

        {error && (
          <motion.div variants={itemVariants}>
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3, 
                borderRadius: 2,
                bgcolor: 'rgba(211, 47, 47, 0.15)',
                '& .MuiAlert-icon': {
                  color: '#f44336'
                }
              }}
            >
              {error}
            </Alert>
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={4}>
            {/* Información básica del torneo */}
            <Grid item xs={12} md={8}>
              <motion.div variants={itemVariants}>
                <Card sx={cardStyle}>
                  <Box sx={headerStyle}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EmojiEventsIcon sx={{ mr: 1, color: '#64b5f6' }} />
                      <Typography variant="h6">Información del Torneo</Typography>
                    </Box>
                    <Chip 
                      label="Nuevo" 
                      color="primary" 
                      variant="outlined" 
                      size="small" 
                    />
                  </Box>
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <TextField
                          label="Nombre del Torneo"
                          variant="outlined"
                          fullWidth
                          {...register('nombre')}
                          error={!!errors.nombre}
                          helperText={errors.nombre?.message}
                          InputProps={{
                            sx: { borderRadius: 2 }
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name="fechaInicio"
                          control={control}
                          render={({ field }) => (
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                              <DatePicker
                                label="Fecha de Inicio"
                                value={field.value}
                                onChange={(date) => field.onChange(date)}
                                slotProps={{
                                  textField: {
                                    fullWidth: true,
                                    variant: 'outlined',
                                    error: !!errors.fechaInicio,
                                    helperText: errors.fechaInicio?.message,
                                    sx: { 
                                      '& .MuiOutlinedInput-root': {
                                        borderRadius: 2
                                      }
                                    }
                                  }
                                }}
                              />
                            </LocalizationProvider>
                          )}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name="fechaFin"
                          control={control}
                          render={({ field }) => (
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                              <DatePicker
                                label="Fecha de Finalización"
                                value={field.value}
                                onChange={(date) => field.onChange(date)}
                                slotProps={{
                                  textField: {
                                    fullWidth: true,
                                    variant: 'outlined',
                                    error: !!errors.fechaFin,
                                    helperText: errors.fechaFin?.message,
                                    sx: { 
                                      '& .MuiOutlinedInput-root': {
                                        borderRadius: 2
                                      }
                                    }
                                  }
                                }}
                              />
                            </LocalizationProvider>
                          )}
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <FormControl fullWidth error={!!errors.categorias}>
                          <FormGroup>
                            <Typography variant="subtitle1" gutterBottom sx={{ 
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              color: !!errors.categorias ? '#f44336' : 'inherit'
                            }}>
                              <CategoryIcon fontSize="small" />
                              Categorías disponibles
                            </Typography>
                            
                            <Grid container spacing={2}>
                              {Object.entries(categoriasMapping).map(([value, label]) => (
                                <Grid item xs={12} sm={6} key={value}>
                                  <Controller
                                    name="categorias"
                                    control={control}
                                    render={({ field }) => {
                                      // Para manejar múltiples checkboxes con el mismo nombre 'categorias'
                                      const onChange = (e) => {
                                        const checked = e.target.checked;
                                        const currentValues = field.value || [];
                                        
                                        // Agregar o quitar del array según el estado del checkbox
                                        const newValues = checked
                                          ? [...currentValues, value]
                                          : currentValues.filter(val => val !== value);
                                        
                                        field.onChange(newValues);
                                      };
                                      
                                      // Verificar si este checkbox específico debe estar checked
                                      const isChecked = Array.isArray(field.value) && field.value.includes(value);
                                      
                                      return (
                                        <FormControlLabel
                                          control={
                                            <Checkbox 
                                              checked={isChecked}
                                              onChange={onChange}
                                              value={value}
                                              sx={{
                                                color: '#64b5f6',
                                                '&.Mui-checked': {
                                                  color: '#2196f3',
                                                }
                                              }}
                                            />
                                          }
                                          label={label}
                                          sx={{
                                            backgroundColor: isChecked ? 'rgba(33, 150, 243, 0.1)' : 'transparent',
                                            padding: '6px 12px',
                                            borderRadius: 2,
                                            width: '100%',
                                            m: 0,
                                            transition: 'background-color 0.2s'
                                          }}
                                        />
                                      );
                                    }}
                                  />
                                </Grid>
                              ))}
                            </Grid>
                            
                            {errors.categorias && (
                              <FormHelperText error>{errors.categorias.message}</FormHelperText>
                            )}
                          </FormGroup>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Controller
                          name="estado"
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth error={!!errors.estado}>
                              <InputLabel id="estado-label">Estado del Torneo</InputLabel>
                              <Select
                                {...field}
                                labelId="estado-label"
                                label="Estado del Torneo"
                                sx={{ borderRadius: 2 }}
                              >
                                <MenuItem value="activo">Activo</MenuItem>
                                <MenuItem value="inactivo">Inactivo</MenuItem>
                              </Select>
                              {errors.estado ? (
                                <FormHelperText error>{errors.estado.message}</FormHelperText>
                              ) : (
                                <FormHelperText>
                                  Define si el torneo estará disponible inmediatamente o no
                                </FormHelperText>
                              )}
                            </FormControl>
                          )}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* Sección de imagen y fechas */}
            <Grid item xs={12} md={4}>
              <Stack spacing={4}>
                <motion.div variants={itemVariants}>
                  <Card sx={cardStyle}>
                    <Box sx={headerStyle}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AddPhotoAlternateIcon sx={{ mr: 1, color: '#64b5f6' }} />
                        <Typography variant="h6">Imagen del Torneo</Typography>
                      </Box>
                    </Box>
                    <CardContent sx={{ p: 3 }}>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center',
                          gap: 2
                        }}
                      >
                        <Box 
                          sx={{ 
                            width: '100%',
                            height: 150,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px dashed rgba(255, 255, 255, 0.2)',
                            borderRadius: 2,
                            mb: 2,
                            overflow: 'hidden',
                            backgroundImage: previewImage ? `url(${previewImage})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            position: 'relative'
                          }}
                        >
                          {!previewImage && (
                            <Box sx={{ textAlign: 'center', p: 3 }}>
                              <AddPhotoAlternateIcon sx={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.3)' }} />
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Imagen del torneo (opcional)
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<AddPhotoAlternateIcon />}
                          sx={{
                            borderRadius: 2,
                            py: 1.5,
                            width: '100%',
                            borderWidth: 2,
                            '&:hover': {
                              borderWidth: 2,
                              backgroundColor: 'rgba(255,255,255,0.05)'
                            }
                          }}
                        >
                          {previewImage ? 'Cambiar Imagen' : 'Seleccionar Imagen'}
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card sx={cardStyle}>
                    <Box sx={headerStyle}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarMonthIcon sx={{ mr: 1, color: '#64b5f6' }} />
                        <Typography variant="h6">Resumen de Fechas</Typography>
                      </Box>
                    </Box>
                    <CardContent sx={{ p: 3 }}>
                      {fechaInicio && fechaFin ? (
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: 2,
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: 'rgba(255, 255, 255, 0.05)'
                        }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Inicio</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {fechaInicio.toLocaleDateString('es-ES', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Finalización</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {fechaFin.toLocaleDateString('es-ES', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Duración</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24))} días
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={{ 
                          p: 2, 
                          textAlign: 'center', 
                          color: 'text.secondary',
                          border: '1px dashed rgba(255, 255, 255, 0.1)',
                          borderRadius: 2
                        }}>
                          <CalendarMonthIcon sx={{ fontSize: 40, opacity: 0.5, mb: 1 }} />
                          <Typography variant="body2">
                            Selecciona las fechas de inicio y fin para ver el resumen
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </Stack>
            </Grid>

            {/* Botones de acción */}
            <Grid item xs={12}>
              <motion.div variants={itemVariants}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  gap: 2, 
                  mt: 2,
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<CancelIcon />}
                    onClick={() => navigate('/torneos')}
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
                    startIcon={cargando ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
                    disabled={cargando}
                    sx={{
                      py: 1.5,
                      px: 4,
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                      boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                      fontWeight: 'bold'
                    }}
                  >
                    {cargando ? 'Guardando...' : 'Crear Torneo'}
                  </Button>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </form>
      </motion.div>
    </Box>
  );
};