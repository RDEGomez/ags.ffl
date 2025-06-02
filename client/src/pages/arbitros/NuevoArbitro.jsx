// 📁 client/src/pages/arbitros/NuevoArbitro.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Gavel as GavelIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  Grade as GradeIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import axiosInstance from '../../config/axios';
import { useImage } from '../../hooks/useImage';
import { 
  NIVELES_ARBITRO, 
  POSICIONES_ARBITRO,
  getNivelColor 
} from '../../helpers/arbitroMappings';

// Esquema de validación
const schema = Yup.object().shape({
  usuarioId: Yup.string().required('Debe seleccionar un usuario'),
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
  )
});

// Función helper simple para obtener URL de imagen (sin hooks)
const getImageUrl = (imagen) => {
  if (!imagen) return '';
  if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
    return imagen;
  }
  return `${import.meta.env.VITE_BACKEND_URL || ''}/uploads/${imagen}`;
};

export const NuevoArbitro = () => {
  const navigate = useNavigate();
  
  // Estados locales
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(true);
  const [cargandoForm, setCargandoForm] = useState(false);
  const [error, setError] = useState('');

  // React Hook Form
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      usuarioId: '',
      nivel: 'Local',
      experiencia: 0,
      telefono: '',
      ubicacion: '',
      posiciones: [],
      certificaciones: []
    }
  });

  // Cargar usuarios disponibles para ser árbitros
  useEffect(() => {
    const obtenerUsuarios = async () => {
      try {
        setCargandoUsuarios(true);
        // Obtener solo usuarios que YA TIENEN rol 'arbitro'
        const { data: todosUsuarios } = await axiosInstance.get('/usuarios?rol=arbitro');
        
        // Filtrar usuarios que:
        // 1. SÍ tengan rol 'arbitro' 
        // 2. NO tengan ya un perfil de árbitro creado
        const { data: arbitros } = await axiosInstance.get('/arbitros');
        const usuariosConArbitro = arbitros.arbitros?.map(a => a.usuario._id) || [];
        
        const usuariosArbitrosDisponibles = todosUsuarios.filter(usuario => 
          usuario.rol === 'arbitro' && // 🔥 SOLO usuarios con rol árbitro
          !usuariosConArbitro.includes(usuario._id) // 🔥 Que NO tengan perfil creado
        );
        
        setUsuarios(usuariosArbitrosDisponibles);
      } catch (error) {
        console.error('Error al obtener usuarios:', error);
        setError('Error al cargar la lista de usuarios');
      } finally {
        setCargandoUsuarios(false);
      }
    };

    obtenerUsuarios();
  }, []);

  // Manejar selección de usuario
  const handleUsuarioChange = (event, nuevoUsuario) => {
    setUsuarioSeleccionado(nuevoUsuario);
    
    // Pre-llenar algunos campos si están disponibles
    if (nuevoUsuario) {
      if (nuevoUsuario.telefono) setValue('telefono', nuevoUsuario.telefono);
    } else {
      setValue('telefono', '');
    }
  };

  // Manejar envío del formulario
  const onSubmit = async (data) => {
    try {
      setCargandoForm(true);
      setError('');

      const payload = {
        usuarioId: data.usuarioId,
        nivel: data.nivel,
        experiencia: Number(data.experiencia),
        telefono: data.telefono,
        ubicacion: data.ubicacion,
        posiciones: data.posiciones,
        certificaciones: data.certificaciones.filter(cert => cert.trim() !== '')
      };

      await axiosInstance.post('/arbitros', payload);

      Swal.fire({
        icon: 'success',
        title: 'Árbitro creado',
        text: `${usuarioSeleccionado.nombre} ha sido registrado como árbitro exitosamente`,
        confirmButtonText: 'Ver árbitros',
        showCancelButton: true,
        cancelButtonText: 'Crear otro'
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/arbitros');
        } else {
          // Resetear formulario para crear otro
          reset();
          setUsuarioSeleccionado(null);
        }
      });

    } catch (error) {
      console.error('Error al crear árbitro:', error);
      setError(error.response?.data?.mensaje || 'Error al crear el árbitro');
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.mensaje || 'No se pudo crear el árbitro'
      });
    } finally {
      setCargandoForm(false);
    }
  };

  // Valores observados
  const posicionesSeleccionadas = watch('posiciones');
  const certificacionesActuales = watch('certificaciones');

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
              Nuevo Árbitro
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
            {/* Selección de Usuario */}
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
                        Seleccionar Usuario
                      </Typography>
                    </Box>

                    <Controller
                      name="usuarioId"
                      control={control}
                      render={({ field: { onChange, value, ...field } }) => (
                        <Autocomplete
                          {...field}
                          options={usuarios}
                          getOptionLabel={(option) => `${option.nombre} (${option.email})`}
                          value={usuarioSeleccionado}
                          onChange={(event, newValue) => {
                            handleUsuarioChange(event, newValue);
                            onChange(newValue?._id || '');
                          }}
                          loading={cargandoUsuarios}
                          isOptionEqualToValue={(option, value) => option._id === value?._id}
                          renderOption={(props, option) => {
                            const { key, ...listItemProps } = props;
                            return (
                              <Box component="li" key={key} {...listItemProps} sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 2,
                                p: 1
                              }}>
                                <Avatar
                                  src={getImageUrl(option.imagen)}
                                  sx={{ width: 32, height: 32 }}
                                >
                                  <PersonIcon />
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {option.nombre}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {option.email} • {option.rol}
                                  </Typography>
                                </Box>
                              </Box>
                            );
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Buscar usuario"
                              placeholder="Escriba para buscar..."
                              error={!!errors.usuarioId}
                              helperText={errors.usuarioId?.message}
                              InputProps={{
                                ...params.InputProps,
                                sx: { borderRadius: 2 },
                                endAdornment: (
                                  <>
                                    {cargandoUsuarios ? <CircularProgress size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                  </>
                                ),
                              }}
                            />
                          )}
                          noOptionsText="No se encontraron usuarios disponibles"
                        />
                      )}
                    />

                    {usuarioSeleccionado && (
                      <Box sx={{ 
                        mt: 3, 
                        p: 2, 
                        borderRadius: 2, 
                        bgcolor: 'rgba(100, 181, 246, 0.1)',
                        border: '1px solid rgba(100, 181, 246, 0.3)'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Avatar
                            src={getImageUrl(usuarioSeleccionado.imagen)}
                            sx={{ width: 48, height: 48 }}
                          >
                            <PersonIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'white' }}>
                              {usuarioSeleccionado.nombre}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {usuarioSeleccionado.email}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip 
                          label={usuarioSeleccionado.rol} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </Box>
                    )}
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
                                  Certificaciones (opcional)
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
                    disabled={cargandoForm || !usuarioSeleccionado}
                    sx={{
                      py: 1.5,
                      px: 4,
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                      boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                      fontWeight: 'bold'
                    }}
                  >
                    {cargandoForm ? 'Creando...' : 'Crear Árbitro'}
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