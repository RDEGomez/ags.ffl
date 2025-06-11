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
    .matches(/^[\+]?[1-9][\d]{0,15}$/, 'Formato de teléfono inválido')
    .required('El teléfono es obligatorio'),
  ubicacion: Yup.string()
    .min(2, 'La ubicación debe tener al menos 2 caracteres')
    .max(100, 'La ubicación no puede tener más de 100 caracteres')
    .required('La ubicación es obligatoria'),
  posiciones: Yup.array()
    .min(1, 'Debe seleccionar al menos una posición')
    .required('Las posiciones son obligatorias'),
  // 🔥 FIX: Certificaciones opcionales - validación más simple
  certificaciones: Yup.array().of(
    Yup.string().optional().test(
      'min-length-if-not-empty',
      'Cada certificación debe tener al menos 2 caracteres',
      function(value) {
        // Si está vacío o es undefined/null, está OK
        if (!value || typeof value !== 'string' || value.trim() === '') {
          return true;
        }
        // Si tiene contenido, debe tener al menos 2 caracteres
        return value.trim().length >= 2;
      }
    )
  ).default([])
});

export const NuevoArbitro = () => {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(true);
  const [cargandoForm, setCargandoForm] = useState(false);
  const [error, setError] = useState('');

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      usuarioId: '',
      nivel: 'Local',
      experiencia: 0,
      telefono: '',
      ubicacion: '',
      posiciones: [],
      certificaciones: [''] // Empezar con un campo vacío para UX
    }
  });

  // Observar cambios en certificaciones para agregar campo vacío solo si es necesario
  const certificaciones = watch('certificaciones');

  useEffect(() => {
    // Asegurar que certificaciones es un array válido
    const certArray = Array.isArray(certificaciones) ? certificaciones : [];
    
    // Solo agregar campo vacío si no existe uno al final
    if (certArray.length === 0 || 
        (certArray.length > 0 && 
         typeof certArray[certArray.length - 1] === 'string' && 
         certArray[certArray.length - 1].trim() !== '')) {
      setValue('certificaciones', [...certArray, '']);
    }
  }, [certificaciones, setValue]);

  // 🔥 NUEVO: Obtener usuarios con filtro híbrido de roles
  useEffect(() => {
    const obtenerUsuarios = async () => {
      try {
        setCargandoUsuarios(true);
        setError('');
        
        // 🔥 ESTRATEGIA HÍBRIDA: Dos llamadas para obtener ambos tipos de árbitros
        console.log('📡 Obteniendo usuarios con roles híbridos de árbitro...');
        
        let todosUsuarios = [];
        
        try {
          // 1️⃣ Llamada 1: Usuarios con rol principal 'arbitro'
          console.log('📡 Paso 1: Obteniendo usuarios con rol=arbitro...');
          const responseArbitrosPrincipales = await axiosInstance.get('/usuarios?rol=arbitro');
          const arbitrosPrincipales = responseArbitrosPrincipales.data.usuarios || responseArbitrosPrincipales.data || [];
          console.log(`✅ Árbitros principales encontrados: ${arbitrosPrincipales.length}`);
          
          // 2️⃣ Llamada 2: Todos los usuarios (para filtrar los secundarios)
          console.log('📡 Paso 2: Obteniendo todos los usuarios para filtrar secundarios...');
          let responseSecundarios;
          try {
            // Intentar obtener todos sin filtro
            responseSecundarios = await axiosInstance.get('/usuarios?rol=jugador');
            const jugadores = responseSecundarios.data.usuarios || responseSecundarios.data || [];
            
            // Filtrar solo los que tienen rolSecundario='arbitro'
            const arbitrosSecundarios = jugadores.filter(usuario => usuario.rolSecundario === 'arbitro');
            console.log(`✅ Árbitros secundarios encontrados: ${arbitrosSecundarios.length}`);
            
            // 3️⃣ Combinar ambos arrays sin duplicados
            const idsExistentes = new Set(arbitrosPrincipales.map(u => u._id));
            const arbitrosSecundariosFiltrados = arbitrosSecundarios.filter(u => !idsExistentes.has(u._id));
            
            todosUsuarios = [...arbitrosPrincipales, ...arbitrosSecundariosFiltrados];
            
            console.log('🔄 Combinación completada:', {
              arbitrosPrincipales: arbitrosPrincipales.length,
              arbitrosSecundarios: arbitrosSecundariosFiltrados.length,
              totalCombinado: todosUsuarios.length
            });
            
          } catch (errorSecundarios) {
            console.log('⚠️ No se pudieron obtener árbitros secundarios, solo principales');
            todosUsuarios = arbitrosPrincipales;
          }
          
        } catch (errorPrincipales) {
          console.log('❌ Error obteniendo árbitros principales:', errorPrincipales);
          // Como última opción, intentar obtener todos y filtrar manualmente
          try {
            console.log('📡 Plan C: Obteniendo todos los usuarios...');
            const responseTodos = await axiosInstance.get('/usuarios');
            const todosLosUsuarios = responseTodos.data.usuarios || responseTodos.data || [];
            
            // Filtrar manualmente
            todosUsuarios = todosLosUsuarios.filter(usuario => 
              usuario.rol === 'arbitro' || usuario.rolSecundario === 'arbitro'
            );
            
            console.log(`✅ Plan C exitoso: ${todosUsuarios.length} usuarios con roles de árbitro`);
          } catch (errorTodos) {
            throw new Error('No se pudieron obtener usuarios desde ningún endpoint');
          }
        }
        
        // 🔍 DEBUG: Revisar estructura de usuarios
        console.log('🔍 DEBUG - Estructura de usuarios:', {
          totalUsuarios: todosUsuarios.length,
          primerUsuario: todosUsuarios[0],
          camposDelPrimerUsuario: todosUsuarios[0] ? Object.keys(todosUsuarios[0]) : 'No hay usuarios',
          muestraUsuarios: todosUsuarios.slice(0, 3).map(u => ({
            _id: u._id,
            nombre: u.nombre,
            email: u.email,
            rol: u.rol,
            rolSecundario: u.rolSecundario,
            todasLasPropiedades: Object.keys(u)
          }))
        });
        
        // 2. Obtener árbitros existentes para excluir usuarios que ya tienen perfil
        let arbitros;
        try {
          const responseArbitros = await axiosInstance.get('/arbitros');
          arbitros = responseArbitros.data;
        } catch (errorArbitros) {
          arbitros = { arbitros: [] };
        }
        
        const usuariosConArbitro = arbitros.arbitros?.map(a => a.usuario?._id || a.usuario) || [];
        
        // 🔥 FILTRO HÍBRIDO MEJORADO: Usuarios que pueden ser árbitros
        const usuariosParaArbitros = todosUsuarios.filter((usuario) => {
          // Validar que el usuario tenga estructura correcta
          if (!usuario || !usuario._id || !usuario.rol) {
            console.log(`⚠️ Usuario inválido (falta estructura):`, usuario);
            return false;
          }
          
          // ❌ Excluir si ya tiene perfil de árbitro
          if (usuariosConArbitro.includes(usuario._id)) {
            console.log(`🚫 ${usuario.nombre} YA tiene perfil de árbitro - EXCLUIDO`);
            return false;
          }
          
          // 🔍 Para debug - mostrar qué usuarios estamos analizando
          console.log(`🔍 Analizando: ${usuario.nombre} (rol: ${usuario.rol}, rolSecundario: ${usuario.rolSecundario})`);
          
          // ✅ Incluir si tiene rol principal de árbitro
          if (usuario.rol === 'arbitro') {
            console.log(`✅ ${usuario.nombre} INCLUIDO (rol principal: arbitro)`);
            return true;
          }
          
          // ✅ Incluir si tiene rol secundario de árbitro (para implementación futura)
          if (usuario.rolSecundario === 'arbitro') {
            console.log(`✅ ${usuario.nombre} INCLUIDO (rol secundario: arbitro)`);
            return true;
          }
          
          // ❌ Excluir todos los demás
          console.log(`❌ ${usuario.nombre} EXCLUIDO - No tiene rol de árbitro`);
          return false;
        });
        
        // 🔥 LOG SIMPLIFICADO - Solo resultados finales
        console.log('🔍 Usuarios para árbitros encontrados:', {
          total: usuariosParaArbitros.length,
          arbitrosPrincipales: usuariosParaArbitros.filter(u => u.rol === 'arbitro').length,
          arbitrosSecundarios: usuariosParaArbitros.filter(u => u.rolSecundario === 'arbitro').length,
          usuarios: usuariosParaArbitros.map(u => ({ 
            _id: u._id,
            nombre: u.nombre || u.name || 'NOMBRE_FALTANTE', 
            email: u.email,
            rol: u.rol, 
            rolSecundario: u.rolSecundario 
          }))
        });
        
        // 🔍 DEBUG ADICIONAL: ¿Hay usuarios con rol arbitro en el total?
        const usuariosConRolArbitro = todosUsuarios.filter(u => u.rol === 'arbitro');
        console.log('🎯 DEBUG - Usuarios con rol="arbitro" en el total:', {
          cantidad: usuariosConRolArbitro.length,
          usuarios: usuariosConRolArbitro.map(u => ({
            _id: u._id,
            nombre: u.nombre || u.name || 'NOMBRE_FALTANTE',
            rol: u.rol,
            rolSecundario: u.rolSecundario,
            yaeTienePerfilArbitro: usuariosConArbitro.includes(u._id)
          }))
        });
        
        setUsuarios(usuariosParaArbitros);
        
        // 🚨 ALERTA SI NO HAY USUARIOS
        if (usuariosParaArbitros.length === 0) {
          if (todosUsuarios.length === 0) {
            setError('No se pudieron cargar los usuarios. Verifica la conexión al servidor.');
          } else {
            setError('No hay usuarios disponibles para crear perfiles de árbitro. Verifica que existan usuarios con rol de árbitro.');
          }
        }
        
      } catch (error) {
        console.error('💥 ERROR al obtener usuarios:', error);
        setError(`Error al cargar usuarios: ${error.message}`);
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
        // 🔥 FIX: Filtrar certificaciones de forma más robusta
        certificaciones: (data.certificaciones || [])
          .filter(cert => cert && typeof cert === 'string') // Solo strings válidos
          .map(cert => cert.trim()) // Quitar espacios
          .filter(cert => cert !== '') // Solo certificaciones con contenido real
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
      
      const errorMsg = error.response?.data?.mensaje || 
                      error.response?.data?.error || 
                      'Error inesperado al crear el árbitro';
      
      setError(errorMsg);
      
      Swal.fire({
        icon: 'error',
        title: 'Error al crear árbitro',
        text: errorMsg
      });
    } finally {
      setCargandoForm(false);
    }
  };

  // 🔥 NUEVO: Función para obtener el label del usuario con información de rol
  const getUserLabel = (usuario) => {
    const rolPrincipal = usuario.rol;
    const rolSecundario = usuario.rolSecundario;
    
    let label = usuario.nombre;
    
    if (rolPrincipal === 'arbitro') {
      label += ' (Árbitro)';
    } else if (rolSecundario === 'arbitro') {
      label += ` (${getRolLabel(rolPrincipal)} + Árbitro)`;
    }
    
    return label;
  };

  // Helper para obtener label de rol
  const getRolLabel = (rol) => {
    switch(rol) {
      case 'jugador': return 'Jugador';
      case 'capitan': return 'Capitán';
      case 'admin': return 'Admin';
      default: return 'Usuario';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Button
            component={Link}
            to="/arbitros"
            startIcon={<ArrowBackIcon />}
            sx={{ 
              mr: 2,
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': { color: 'white' }
            }}
          >
            Volver
          </Button>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ backgroundColor: '#2196F3' }}>
              <GavelIcon />
            </Avatar>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
              Nuevo Árbitro
            </Typography>
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Formulario */}
        <Card
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={4}>
                
                {/* Selección de Usuario */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon /> Información del Usuario
                  </Typography>
                  
                  <Controller
                    name="usuarioId"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        {...field}
                        options={usuarios}
                        getOptionLabel={getUserLabel} // 🔥 NUEVO: Usar función personalizada
                        loading={cargandoUsuarios}
                        onChange={(event, value) => {
                          field.onChange(value?._id || '');
                          handleUsuarioChange(event, value);
                        }}
                        value={usuarioSeleccionado}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Seleccionar Usuario"
                            placeholder={cargandoUsuarios ? "Cargando usuarios..." : "Buscar usuario..."}
                            error={!!errors.usuarioId}
                            helperText={errors.usuarioId?.message}
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {cargandoUsuarios ? <CircularProgress color="inherit" size={20} /> : null}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                color: 'white',
                                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                                '&.Mui-focused fieldset': { borderColor: '#2196F3' }
                              },
                              '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                            }}
                          />
                        )}
                        renderOption={(props, option) => {
                          // 🔥 FIX: Extraer key de props para evitar conflictos
                          const { key, ...otherProps } = props;
                          return (
                            <Box 
                              component="li" 
                              {...otherProps} 
                              key={`usuario-${option._id}`}
                              sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                            >
                              <Avatar src={option.imagen} sx={{ width: 32, height: 32 }}>
                                <PersonIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="body1">
                                  {option.nombre}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {option.email}
                                  {option.rolSecundario === 'arbitro' && option.rol !== 'arbitro' && (
                                    <Chip 
                                      label="Doble Rol" 
                                      size="small" 
                                      color="info" 
                                      sx={{ ml: 1, height: 16 }}
                                    />
                                  )}
                                </Typography>
                              </Box>
                            </Box>
                          );
                        }}
                        noOptionsText={
                          cargandoUsuarios 
                            ? "Cargando..." 
                            : "No hay usuarios disponibles para ser árbitros"
                        }
                      />
                    )}
                  />
                  
                  {/* 🔥 NUEVO: Información adicional sobre filtros */}
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', mt: 1, display: 'block' }}>
                    💡 Se muestran usuarios con rol de árbitro (principal o secundario) que no tengan perfil creado
                  </Typography>
                </Grid>

                {/* Vista previa del usuario seleccionado */}
                {usuarioSeleccionado && (
                  <Grid item xs={12}>
                    <Card sx={{ 
                      backgroundColor: 'rgba(33, 150, 243, 0.1)', 
                      border: '1px solid rgba(33, 150, 243, 0.3)',
                      borderRadius: 2
                    }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Avatar 
                            src={usuarioSeleccionado.imagen} 
                            sx={{ width: 60, height: 60 }}
                          >
                            <PersonIcon />
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ color: 'white' }}>
                              {usuarioSeleccionado.nombre}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              {usuarioSeleccionado.email}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                              <Chip 
                                label={getRolLabel(usuarioSeleccionado.rol)}
                                size="small"
                                color="primary"
                              />
                              {usuarioSeleccionado.rolSecundario === 'arbitro' && (
                                <Chip 
                                  label="Árbitro Secundario"
                                  size="small"
                                  color="secondary"
                                />
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                </Grid>

                {/* Información Profesional */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GradeIcon /> Información Profesional
                  </Typography>
                </Grid>

                {/* Nivel */}
                <Grid item xs={12} md={6}>
                  <Controller
                    name="nivel"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.nivel}>
                        <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          Nivel
                        </InputLabel>
                        <Select
                          {...field}
                          label="Nivel"
                          sx={{
                            color: 'white',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2196F3' }
                          }}
                        >
                          {NIVELES_ARBITRO.map((nivel) => (
                            <MenuItem key={nivel.value} value={nivel.value}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    backgroundColor: getNivelColor(nivel.value)
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
                <Grid item xs={12} md={6}>
                  <Controller
                    name="experiencia"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Años de Experiencia"
                        type="number"
                        fullWidth
                        error={!!errors.experiencia}
                        helperText={errors.experiencia?.message}
                        inputProps={{ min: 0, max: 50 }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: 'white',
                            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                            '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                            '&.Mui-focused fieldset': { borderColor: '#2196F3' }
                          },
                          '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                </Grid>

                {/* Información de Contacto */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon /> Información de Contacto
                  </Typography>
                </Grid>

                {/* Teléfono */}
                <Grid item xs={12} md={6}>
                  <Controller
                    name="telefono"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Teléfono"
                        fullWidth
                        error={!!errors.telefono}
                        helperText={errors.telefono?.message || "Formato: +52XXXXXXXXXX o XXXXXXXXXX"}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: 'white',
                            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                            '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                            '&.Mui-focused fieldset': { borderColor: '#2196F3' }
                          },
                          '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Ubicación */}
                <Grid item xs={12} md={6}>
                  <Controller
                    name="ubicacion"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Ubicación"
                        fullWidth
                        error={!!errors.ubicacion}
                        helperText={errors.ubicacion?.message || "Ciudad, Estado"}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: 'white',
                            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                            '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                            '&.Mui-focused fieldset': { borderColor: '#2196F3' }
                          },
                          '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                </Grid>

                {/* Especialización */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssignmentIcon /> Especialización
                  </Typography>
                </Grid>

                {/* Posiciones */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ color: 'white', mb: 2 }}>
                    Posiciones que puede desempeñar *
                  </Typography>
                  
                  <Controller
                    name="posiciones"
                    control={control}
                    render={({ field }) => (
                      <FormGroup row>
                        {POSICIONES_ARBITRO.map((posicion) => (
                          <FormControlLabel
                            key={posicion.value}
                            control={
                              <Checkbox
                                checked={field.value.includes(posicion.value)}
                                onChange={(e) => {
                                  const newValue = e.target.checked
                                    ? [...field.value, posicion.value]
                                    : field.value.filter(v => v !== posicion.value);
                                  field.onChange(newValue);
                                }}
                                sx={{
                                  color: 'rgba(255, 255, 255, 0.7)',
                                  '&.Mui-checked': { color: '#2196F3' }
                                }}
                              />
                            }
                            label={
                              <Box>
                                <Typography variant="body1" sx={{ color: 'white' }}>
                                  {posicion.label}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                  {posicion.descripcion}
                                </Typography>
                              </Box>
                            }
                            sx={{ 
                              mb: 1,
                              minWidth: '300px',
                              mr: 3
                            }}
                          />
                        ))}
                      </FormGroup>
                    )}
                  />
                  
                  {errors.posiciones && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                      {errors.posiciones.message}
                    </Typography>
                  )}
                </Grid>

                {/* Certificaciones */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ color: 'white', mb: 2 }}>
                    Certificaciones (opcional)
                  </Typography>
                  
                  {certificaciones.map((cert, index) => (
                    <Controller
                      key={index}
                      name={`certificaciones.${index}`}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label={`Certificación ${index + 1}`}
                          fullWidth
                          margin="normal"
                          error={!!errors.certificaciones?.[index]}
                          helperText={errors.certificaciones?.[index]?.message}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: 'white',
                              '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                              '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                              '&.Mui-focused fieldset': { borderColor: '#2196F3' }
                            },
                            '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                          }}
                        />
                      )}
                    />
                  ))}
                </Grid>

                {/* Botones */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                    <Button
                      component={Link}
                      to="/arbitros"
                      variant="outlined"
                      disabled={cargandoForm}
                      sx={{
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        color: 'white',
                        '&:hover': {
                          borderColor: 'rgba(255, 255, 255, 0.5)',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)'
                        }
                      }}
                    >
                      Cancelar
                    </Button>
                    
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={cargandoForm || !usuarioSeleccionado}
                      startIcon={cargandoForm ? <CircularProgress size={20} /> : <SaveIcon />}
                      sx={{
                        background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                        boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #1976D2 30%, #1BA8E3 90%)',
                        },
                        '&:disabled': {
                          background: 'rgba(255, 255, 255, 0.12)',
                          color: 'rgba(255, 255, 255, 0.3)'
                        }
                      }}
                    >
                      {cargandoForm ? 'Creando...' : 'Crear Árbitro'}
                    </Button>
                  </Box>
                </Grid>

              </Grid>
            </form>
          </CardContent>
        </Card>
      </Box>
    </motion.div>
  );
};