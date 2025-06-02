// 📁 client/src/pages/arbitros/EditarArbitro.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Chip,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Autocomplete,
  Avatar,
  Alert,
  CircularProgress,
  Switch
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Gavel as GavelIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  Grade as GradeIcon,
  Assignment as AssignmentIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import axiosInstance from '../../config/axios';
import { useImage } from '../../hooks/useImage';
import { useAuth } from '../../context/AuthContext';
import { 
  NIVELES_ARBITRO, 
  POSICIONES_ARBITRO,
  ESTADOS_ARBITRO,
  getNivelColor,
  getEstadoColor
} from '../../helpers/arbitroMappings';

// Esquema de validación
const schema = Yup.object().shape({
  nivel: Yup.string().required('El nivel es obligatorio'),
  experiencia: Yup.number()
    .min(0, 'La experiencia no puede ser negativa')
    .max(50, 'La experiencia no puede ser mayor a 50 años')
    .required('La experiencia es obligatoria'),
  telefono: Yup.string()
    .matches(/^[\+]?[0-9\s\-\(\)]+$/, 'Formato de teléfono inválido')
    .min(10, 'Teléfono muy corto')
    .max(15, 'Teléfono muy largo'),
  ubicacion: Yup.string().max(100, 'Ubicación muy larga'),
  posiciones: Yup.array()
    .min(1, 'Debe seleccionar al menos una posición')
    .required('Las posiciones son obligatorias'),
  certificaciones: Yup.array().of(
    Yup.string().min(2, 'Certificación muy corta').max(50, 'Certificación muy larga')
  ),
  estado: Yup.string().oneOf(['activo', 'inactivo', 'suspendido']),
  notasInternas: Yup.string().max(500, 'Notas muy largas')
});

// Función helper simple para obtener URL de imagen (sin hooks)
const getImageUrl = (imagen) => {
  if (!imagen) return '';
  if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
    return imagen;
  }
  return `${import.meta.env.VITE_BACKEND_URL || ''}/uploads/${imagen}`;
};

export const EditarArbitro = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario, tieneRol } = useAuth();
  const esAdmin = tieneRol('admin');
  
  // Estados locales
  const [arbitro, setArbitro] = useState(null);
  const [cargandoArbitro, setCargandoArbitro] = useState(true);
  const [cargandoForm, setCargandoForm] = useState(false);
  const [error, setError] = useState('');

  // React Hook Form
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      nivel: 'Local',
      experiencia: 0,
      telefono: '',
      ubicacion: '',
      posiciones: [],
      certificaciones: [],
      estado: 'activo',
      notasInternas: ''
    }
  });

  // Cargar datos del árbitro
  useEffect(() => {
    const obtenerArbitro = async () => {
      try {
        setCargandoArbitro(true);
        const { data } = await axiosInstance.get(`/arbitros/${id}`);
        const arbitroData = data.arbitro;
        
        setArbitro(arbitroData);
        
        // Llenar formulario con datos existentes
        reset({
          nivel: arbitroData.nivel || 'Local',
          experiencia: arbitroData.experiencia || 0,
          telefono: arbitroData.telefono || '',
          ubicacion: arbitroData.ubicacion || '',
          posiciones: arbitroData.posiciones || [],
          certificaciones: arbitroData.certificaciones || [],
          estado: arbitroData.estado || 'activo',
          notasInternas: arbitroData.notasInternas || ''
        });
        
      } catch (error) {
        console.error('Error al obtener árbitro:', error);
        setError('Error al cargar los datos del árbitro');
        
        // Si no se encuentra o no tiene permisos, redirigir
        if (error.response?.status === 404 || error.response?.status === 403) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se encontró el árbitro o no tienes permisos para editarlo'
          }).then(() => {
            navigate('/arbitros');
          });
        }
      } finally {
        setCargandoArbitro(false);
      }
    };

    if (id) {
      obtenerArbitro();
    }
  }, [id, reset, navigate]);

  // Verificar permisos de edición
  const puedeEditar = () => {
    if (!arbitro || !usuario) return false;
    
    // Admin puede editar cualquier árbitro
    if (esAdmin) return true;
    
    // El propio árbitro puede editar su perfil
    if (usuario._id === arbitro.usuario._id) return true;
    
    return false;
  };

  // Manejar envío del formulario
  const onSubmit = async (data) => {
    try {
      setCargandoForm(true);
      setError('');

      const payload = {
        nivel: data.nivel,
        experiencia: Number(data.experiencia),
        telefono: data.telefono,
        ubicacion: data.ubicacion,
        posiciones: data.posiciones,
        certificaciones: data.certificaciones.filter(cert => cert.trim() !== '')
      };

      // Solo admin puede cambiar estado y notas internas
      if (esAdmin) {
        payload.estado = data.estado;
        payload.notasInternas = data.notasInternas;
      }

      await axiosInstance.patch(`/arbitros/${id}`, payload);

      Swal.fire({
        icon: 'success',
        title: 'Árbitro actualizado',
        text: 'Los datos han sido actualizados correctamente',
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        navigate('/arbitros');
      });

    } catch (error) {
      console.error('Error al actualizar árbitro:', error);
      setError(error.response?.data?.mensaje || 'Error al actualizar el árbitro');
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.mensaje || 'No se pudo actualizar el árbitro'
      });
    } finally {
      setCargandoForm(false);
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

  // Si está cargando
  if (cargandoArbitro) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh' 
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Si no se encontró el árbitro
  if (!arbitro) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          Árbitro no encontrado
        </Alert>
      </Box>
    );
  }

  // Si no tiene permisos
  if (!puedeEditar()) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          No tienes permisos para editar este árbitro
        </Alert>
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
        {/* Header */}
        <motion.div variants={itemVariants}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 4 
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
              <GavelIcon sx={{ fontSize: 32, color: '#64b5f6' }} />
              Editar Árbitro
            </Typography>
            
            <Button 
              component={Link}
              to="/arbitros"
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
              Volver a Árbitros
            </Button>
          </Box>
        </motion.div>

        {/* Error Alert */}
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
            {/* Información del Usuario */}
            <Grid item xs={12} md={4}>
              <motion.div variants={itemVariants}>
                <Card sx={{
                  backdropFilter: 'blur(10px)', 
                  backgroundColor: 'rgba(0, 0, 0, 0.7)', 
                  borderRadius: 3,
                  height: 'fit-content'
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1, 
                      mb: 3,
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      pb: 2
                    }}>
                      <PersonIcon sx={{ color: '#64b5f6' }} />
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                        Usuario Asociado
                      </Typography>
                    </Box>

                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      textAlign: 'center'
                    }}>
                      <Avatar
                        src={getImageUrl(arbitro.usuario?.imagen)}
                        sx={{ 
                          width: 80, 
                          height: 80, 
                          mb: 2,
                          border: '3px solid rgba(255, 255, 255, 0.2)'
                        }}
                      >
                        <PersonIcon sx={{ fontSize: 40 }} />
                      </Avatar>
                      
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}>
                        {arbitro.usuario?.nombre || 'Nombre no disponible'}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {arbitro.usuario?.email || 'Email no disponible'}
                      </Typography>
                      
                      <Chip 
                        label={arbitro.usuario?.rol || 'arbitro'} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </Box>

                    {/* Estadísticas rápidas */}
                    <Box sx={{ 
                      mt: 3, 
                      p: 2, 
                      borderRadius: 2, 
                      bgcolor: 'rgba(255, 255, 255, 0.05)'
                    }}>
                      <Typography variant="subtitle2" sx={{ 
                        color: '#64b5f6', 
                        mb: 1, 
                        fontWeight: 'bold' 
                      }}>
                        Estadísticas
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Partidos dirigidos:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {arbitro.partidosDirigidos || 0}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Rating promedio:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {arbitro.rating?.toFixed(1) || '0.0'}/5
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* Información del Árbitro */}
            <Grid item xs={12} md={8}>
              <motion.div variants={itemVariants}>
                <Card sx={{
                  backdropFilter: 'blur(10px)', 
                  backgroundColor: 'rgba(0, 0, 0, 0.7)', 
                  borderRadius: 3
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1, 
                      mb: 3,
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      pb: 2
                    }}>
                      <GavelIcon sx={{ color: '#64b5f6' }} />
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                        Información del Árbitro
                      </Typography>
                    </Box>

                    <Grid container spacing={3}>
                      {/* Nivel */}
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name="nivel"
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth error={!!errors.nivel}>
                              <InputLabel>Nivel</InputLabel>
                              <Select
                                {...field}
                                label="Nivel"
                                sx={{ borderRadius: 2 }}
                              >
                                {NIVELES_ARBITRO.map((nivel) => (
                                  <MenuItem key={nivel.value} value={nivel.value}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Box
                                        sx={{
                                          width: 12,
                                          height: 12,
                                          borderRadius: '50%',
                                          bgcolor: getNivelColor(nivel.value)
                                        }}
                                      />
                                      {nivel.label}
                                    </Box>
                                  </MenuItem>
                                ))}
                              </Select>
                              {errors.nivel && (
                                <FormHelperText>{errors.nivel.message}</FormHelperText>
                              )}
                            </FormControl>
                          )}
                        />
                      </Grid>

                      {/* Experiencia */}
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name="experiencia"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="Años de experiencia"
                              type="number"
                              fullWidth
                              error={!!errors.experiencia}
                              helperText={errors.experiencia?.message}
                              InputProps={{
                                sx: { borderRadius: 2 },
                                inputProps: { min: 0, max: 50 }
                              }}
                            />
                          )}
                        />
                      </Grid>

                      {/* Estado (solo admin) */}
                      {esAdmin && (
                        <Grid item xs={12} sm={6}>
                          <Controller
                            name="estado"
                            control={control}
                            render={({ field }) => (
                              <FormControl fullWidth error={!!errors.estado}>
                                <InputLabel>Estado</InputLabel>
                                <Select
                                  {...field}
                                  label="Estado"
                                  sx={{ borderRadius: 2 }}
                                >
                                  {ESTADOS_ARBITRO.map((estado) => (
                                    <MenuItem key={estado.value} value={estado.value}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box
                                          sx={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: '50%',
                                            bgcolor: getEstadoColor(estado.value)
                                          }}
                                        />
                                        {estado.label}
                                      </Box>
                                    </MenuItem>
                                  ))}
                                </Select>
                                {errors.estado && (
                                  <FormHelperText>{errors.estado.message}</FormHelperText>
                                )}
                              </FormControl>
                            )}
                          />
                        </Grid>
                      )}

                      {/* Teléfono */}
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name="telefono"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="Teléfono"
                              placeholder="+52 449 123 4567"
                              fullWidth
                              error={!!errors.telefono}
                              helperText={errors.telefono?.message}
                              InputProps={{
                                sx: { borderRadius: 2 },
                                startAdornment: <PhoneIcon sx={{ mr: 1, color: 'rgba(255,255,255,0.5)' }} />
                              }}
                            />
                          )}
                        />
                      </Grid>

                      {/* Ubicación */}
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name="ubicacion"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="Ubicación"
                              placeholder="Aguascalientes, AGS"
                              fullWidth
                              error={!!errors.ubicacion}
                              helperText={errors.ubicacion?.message}
                              InputProps={{
                                sx: { borderRadius: 2 },
                                startAdornment: <LocationOnIcon sx={{ mr: 1, color: 'rgba(255,255,255,0.5)' }} />
                              }}
                            />
                          )}
                        />
                      </Grid>

                      {/* Posiciones */}
                      <Grid item xs={12}>
                        <Controller
                          name="posiciones"
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth error={!!errors.posiciones}>
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1, 
                                mb: 2
                              }}>
                                <GradeIcon sx={{ color: '#64b5f6', fontSize: 20 }} />
                                <Typography variant="subtitle1" sx={{ 
                                  color: errors.posiciones ? '#f44336' : 'white',
                                  fontWeight: 'medium'
                                }}>
                                  Posiciones que puede desempeñar *
                                </Typography>
                              </Box>
                              
                              <FormGroup>
                                <Grid container spacing={1}>
                                  {POSICIONES_ARBITRO.map((posicion) => (
                                    <Grid item xs={12} sm={4} key={posicion.value}>
                                      <FormControlLabel
                                        control={
                                          <Checkbox
                                            checked={field.value.includes(posicion.value)}
                                            onChange={(e) => {
                                              const nuevasPosiciones = e.target.checked
                                                ? [...field.value, posicion.value]
                                                : field.value.filter(p => p !== posicion.value);
                                              field.onChange(nuevasPosiciones);
                                            }}
                                            sx={{
                                              color: '#64b5f6',
                                              '&.Mui-checked': { color: '#2196f3' }
                                            }}
                                          />
                                        }
                                        label={posicion.label}
                                        sx={{
                                          backgroundColor: field.value.includes(posicion.value) 
                                            ? 'rgba(33, 150, 243, 0.1)' 
                                            : 'transparent',
                                          borderRadius: 2,
                                          p: 1,
                                          m: 0,
                                          width: '100%',
                                          transition: 'background-color 0.2s'
                                        }}
                                      />
                                    </Grid>
                                  ))}
                                </Grid>
                              </FormGroup>
                              
                              {errors.posiciones && (
                                <FormHelperText>{errors.posiciones.message}</FormHelperText>
                              )}
                            </FormControl>
                          )}
                        />
                      </Grid>

                      {/* Certificaciones */}
                      <Grid item xs={12}>
                        <Controller
                          name="certificaciones"
                          control={control}
                          render={({ field }) => (
                            <Box>
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1, 
                                mb: 2
                              }}>
                                <AssignmentIcon sx={{ color: '#64b5f6', fontSize: 20 }} />
                                <Typography variant="subtitle1" sx={{ 
                                  color: 'white',
                                  fontWeight: 'medium'
                                }}>
                                  Certificaciones
                                </Typography>
                              </Box>

                              <Autocomplete
                                multiple
                                freeSolo
                                options={['FIFA', 'FMF', 'ONEFA', 'Curso Básico', 'Curso Avanzado']}
                                value={field.value}
                                onChange={(event, newValue) => {
                                  field.onChange(newValue);
                                }}
                                renderTags={(value, getTagProps) =>
                                  value.map((option, index) => (
                                    <Chip
                                      variant="outlined"
                                      label={option}
                                      color="secondary"
                                      {...getTagProps({ index })}
                                      key={index}
                                    />
                                  ))
                                }
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    placeholder={field.value.length === 0 ? "Agregar certificaciones..." : ""}
                                    InputProps={{
                                      ...params.InputProps,
                                      sx: { borderRadius: 2 }
                                    }}
                                  />
                                )}
                              />
                            </Box>
                          )}
                        />
                      </Grid>

                      {/* Notas internas (solo admin) */}
                      {esAdmin && (
                        <Grid item xs={12}>
                          <Controller
                            name="notasInternas"
                            control={control}
                            render={({ field }) => (
                              <Box>
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 1, 
                                  mb: 2
                                }}>
                                  <AdminIcon sx={{ color: '#f44336', fontSize: 20 }} />
                                  <Typography variant="subtitle1" sx={{ 
                                    color: 'white',
                                    fontWeight: 'medium'
                                  }}>
                                    Notas Internas (Solo Admin)
                                  </Typography>
                                </Box>

                                <TextField
                                  {...field}
                                  multiline
                                  rows={3}
                                  fullWidth
                                  placeholder="Notas internas sobre el árbitro..."
                                  error={!!errors.notasInternas}
                                  helperText={errors.notasInternas?.message || 'Máximo 500 caracteres'}
                                  InputProps={{
                                    sx: { borderRadius: 2 }
                                  }}
                                />
                              </Box>
                            )}
                          />
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </motion.div>
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
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/arbitros')}
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
                    startIcon={cargandoForm ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
                    disabled={cargandoForm}
                    sx={{
                      py: 1.5,
                      px: 4,
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                      boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                      fontWeight: 'bold'
                    }}
                  >
                    {cargandoForm ? 'Guardando...' : 'Guardar Cambios'}
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