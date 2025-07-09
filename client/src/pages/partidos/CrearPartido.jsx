import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axiosInstance from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Autocomplete,
  Avatar,
  Chip,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Stack
} from '@mui/material';

import {
  NavigateNext as NavigateNextIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  SportsFootball as SportsFootballIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Group as GroupIcon,
  Gavel as GavelIcon,
  Info as InfoIcon,
  EmojiEvents as EmojiEventsIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  CalendarToday as CalendarTodayIcon
} from '@mui/icons-material';

import { getCategoryName } from '../../helpers/mappings';

// Opciones de categorías
const categorias = [
  { value: 'mixgold', label: 'Mixto Golden' },
  { value: 'mixsilv', label: 'Mixto Silver' },
  { value: 'vargold', label: 'Varonil Golden' },
  { value: 'varsilv', label: 'Varonil Silver' },
  { value: 'femgold', label: 'Femenil Golden' },
  { value: 'femsilv', label: 'Femenil Silver' },
  { value: 'varmast', label: 'Varonil Master' },
  { value: 'femmast', label: 'Femenil Master' },
  { value: 'tocho7v7', label: 'Tocho 7v7' },
  { value: 'u8', label: 'U-8' },
  { value: 'u10', label: 'U-10' },
  { value: 'u12fem', label: 'U-12 Femenil' },
  { value: 'u12var', label: 'U-12 Varonil' },
  { value: 'u14fem', label: 'U-14 Femenil' },
  { value: 'u14var', label: 'U-14 Varonil' },
  { value: 'u16fem', label: 'U-16 Femenil' },
  { value: 'u16var', label: 'U-16 Varonil' },
  { value: 'u18fem', label: 'U-18 Femenil' },
  { value: 'u18var', label: 'U-18 Varonil' }
];

// Duraciones predefinidas
const duracionesComunes = [
  { value: 30, label: '30 minutos' },
  { value: 40, label: '40 minutos' },
  { value: 50, label: '50 minutos (estándar)' },
  { value: 60, label: '60 minutos' }
];

// Steps del formulario
const steps = [
  'Información Básica',
  'Equipos',
  'Programación',
  'Árbitros',
  'Ubicación'
];

// Componente para selección de equipos con preview mejorado
const EquipoSelector = ({ 
  label, 
  value, 
  onChange, 
  equipos, 
  categoria, 
  equipoOpuesto, 
  error 
}) => {
  const equiposFiltrados = categoria 
    ? equipos.filter(e => e.categoria === categoria && e._id !== equipoOpuesto)
    : equipos.filter(e => e._id !== equipoOpuesto);

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3, 
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 3,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        width: '100%',
        minHeight: '280px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ mb: 2 }}>
        <FormControl fullWidth error={error}>
          <Autocomplete
            value={equipos.find(e => e._id === value) || null}
            onChange={(event, newValue) => onChange(newValue?._id || '')}
            options={equiposFiltrados}
            getOptionLabel={(option) => option.nombre || ''}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                error={error}
                helperText={error ? 'Selecciona un equipo' : 'Busca y selecciona un equipo'}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    minHeight: '56px',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#64b5f6',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiInputBase-input': {
                    color: 'white',
                  }
                }}
              />
            )}
            renderOption={(props, option) => {
              // 🔥 CORRECCIÓN: Extraer key de props
              const { key, ...otherProps } = props;
              return (
                <Box 
                  component="li" 
                  key={key} // 🔥 Pasar key como prop separada
                  {...otherProps} // 🔥 Solo pasar las otras props
                  sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}
                >
                  <Avatar 
                    src={option.imagen || ''} 
                    sx={{ width: 40, height: 40 }}
                  >
                    <GroupIcon />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" fontWeight="bold">
                      {option.nombre}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {getCategoryName(option.categoria)} • {option.jugadores?.length || 0} jugadores
                    </Typography>
                  </Box>
                  <Chip 
                    label={getCategoryName(option.categoria)}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                </Box>
              );
            }}
            noOptionsText="No hay equipos disponibles"
            placeholder="Buscar equipo..."
          />
        </FormControl>
      </Box>
      
      {/* El resto del código permanece igual */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {value ? (
          (() => {
            const equipoSeleccionado = equipos.find(e => e._id === value);
            return equipoSeleccionado ? (
              <Box sx={{ 
                p: 2, 
                backgroundColor: 'rgba(100, 181, 246, 0.1)', 
                borderRadius: 2,
                width: '100%',
                textAlign: 'center'
              }}>
                <Avatar 
                  src={equipoSeleccionado.imagen || ''} 
                  sx={{ width: 60, height: 60, mx: 'auto', mb: 2 }}
                >
                  <GroupIcon />
                </Avatar>
                <Typography variant="h6" color="white" sx={{ mb: 1 }}>
                  {equipoSeleccionado.nombre}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {getCategoryName(equipoSeleccionado.categoria)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {equipoSeleccionado.jugadores?.length || 0} jugadores registrados
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                  <CheckCircleIcon sx={{ color: '#4caf50' }} />
                </Box>
              </Box>
            ) : null;
          })()
        ) : (
          <Box sx={{ 
            textAlign: 'center', 
            color: 'rgba(255, 255, 255, 0.5)',
            p: 2
          }}>
            <GroupIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
            <Typography variant="body2">
              Selecciona un equipo para ver la información
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

// Componente para selección de árbitros mejorado
const ArbitroSelector = ({ 
  label, 
  value, 
  onChange, 
  arbitros, 
  arbitrosSeleccionados,
  opcional = false,
  error 
}) => {
  const arbitrosDisponibles = arbitros.filter(a => 
    a.disponible && 
    a.estado === 'activo' && 
    (!arbitrosSeleccionados.includes(a._id) || a._id === value)
  );

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3, 
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 3,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        width: '100%',
        minHeight: '280px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ mb: 2 }}>
        <FormControl fullWidth error={error}>
          <Autocomplete
            value={arbitros.find(a => a._id === value) || null}
            onChange={(event, newValue) => onChange(newValue?._id || '')}
            options={arbitrosDisponibles}
            getOptionLabel={(option) => option.usuario?.nombre || ''}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            renderInput={(params) => (
              <TextField
                {...params}
                label={`${label} ${opcional ? '(Opcional)' : ''}`}
                error={error}
                helperText={error ? `Selecciona ${label.toLowerCase()}` : opcional ? 'Campo opcional' : 'Busca y selecciona un árbitro'}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    minHeight: '56px',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#64b5f6',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiInputBase-input': {
                    color: 'white',
                  }
                }}
              />
            )}
            renderOption={(props, option) => {
              // 🔥 CORRECCIÓN: Extraer key de props
              const { key, ...otherProps } = props;
              return (
                <Box 
                  component="li" 
                  key={key} // 🔥 Pasar key como prop separada
                  {...otherProps} // 🔥 Solo pasar las otras props
                  sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}
                >
                  <Avatar 
                    src={option.usuario?.imagen || ''} 
                    sx={{ width: 40, height: 40 }}
                  >
                    <GavelIcon />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" fontWeight="bold">
                      {option.usuario?.nombre}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.nivel} • {option.experiencia} años de experiencia
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      {option.posiciones?.slice(0, 2).map((pos, idx) => (
                        <Chip 
                          key={idx}
                          label={pos} 
                          size="small" 
                          variant="outlined"
                          sx={{ fontSize: '0.6rem', height: 18 }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
              );
            }}
            noOptionsText="No hay árbitros disponibles"
            placeholder="Buscar árbitro..."
          />
        </FormControl>
      </Box>
      
      {/* El resto del preview permanece igual... */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {value ? (
          (() => {
            const arbitroSeleccionado = arbitros.find(a => a._id === value);
            return arbitroSeleccionado ? (
              <Box sx={{ 
                p: 2, 
                backgroundColor: 'rgba(100, 181, 246, 0.1)', 
                borderRadius: 2,
                width: '100%',
                textAlign: 'center'
              }}>
                <Avatar 
                  src={arbitroSeleccionado.usuario?.imagen || ''} 
                  sx={{ width: 60, height: 60, mx: 'auto', mb: 2 }}
                >
                  <GavelIcon />
                </Avatar>
                <Typography variant="h6" color="white" sx={{ mb: 1 }}>
                  {arbitroSeleccionado.usuario?.nombre}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {arbitroSeleccionado.nivel} • {arbitroSeleccionado.experiencia} años
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                  {arbitroSeleccionado.posiciones?.map((pos, idx) => (
                    <Chip 
                      key={idx}
                      label={pos} 
                      size="small" 
                      color="primary"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  ))}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                  <CheckCircleIcon sx={{ color: '#4caf50' }} />
                </Box>
              </Box>
            ) : null;
          })()
        ) : (
          <Box sx={{ 
            textAlign: 'center', 
            color: 'rgba(255, 255, 255, 0.5)',
            p: 2
          }}>
            <GavelIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
            <Typography variant="body2">
              {opcional ? 'Campo opcional' : 'Selecciona un árbitro para ver la información'}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

// Componente principal
export const CrearPartido = () => {
  const { puedeGestionarPartidos } = useAuth();
  const navigate = useNavigate();

  // Estados del formulario
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    equipoLocal: '',
    equipoVisitante: '',
    torneo: '',
    categoria: '',
    fechaHora: '',
    duracionMinutos: 50,
    jornada: '', // 🔥 NUEVO CAMPO
    sede: {
      nombre: '',
      direccion: ''
    },
    arbitros: {
      principal: '',
      backeador: '',
      estadistico: ''
    },
    observaciones: ''
  });

  // Estados de datos
  const [torneos, setTorneos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [arbitros, setArbitros] = useState([]);
  const [estadisticasEquipos, setEstadisticasEquipos] = useState({});
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(false);
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState({});

  // Validación de permisos
  useEffect(() => {
    if (!puedeGestionarPartidos()) {
      Swal.fire({
        icon: 'error',
        title: 'Sin permisos',
        text: 'No tienes permisos para crear partidos'
      }).then(() => {
        navigate('/partidos');
      });
    }
  }, [puedeGestionarPartidos, navigate]);

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoadingData(true);
        
        const [torneosRes, equiposRes, arbitrosRes] = await Promise.all([
          axiosInstance.get('/torneos'),
          axiosInstance.get('/equipos'),
          axiosInstance.get('/arbitros?disponible=true&estado=activo')
        ]);

        setTorneos(torneosRes.data.torneos || []);
        setEquipos(equiposRes.data || []);
        setArbitros(arbitrosRes.data.arbitros || []);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los datos necesarios'
        });
      } finally {
        setLoadingData(false);
      }
    };

    cargarDatos();
  }, []);

  useEffect(() => {
    const cargarEstadisticas = async () => {
      if (formData.equipoLocal && formData.equipoVisitante && formData.torneo) {
        setLoadingEstadisticas(true);
        try {
          const [estadisticasLocal, estadisticasVisitante] = await Promise.all([
            obtenerEstadisticasEquipo(formData.equipoLocal, formData.torneo),
            obtenerEstadisticasEquipo(formData.equipoVisitante, formData.torneo)
          ]);
          
          setEstadisticasEquipos({
            [formData.equipoLocal]: estadisticasLocal,
            [formData.equipoVisitante]: estadisticasVisitante
          });
        } catch (error) {
          console.error('Error al cargar estadísticas:', error);
        } finally {
          setLoadingEstadisticas(false);
        }
      }
    };

    cargarEstadisticas();
  }, [formData.equipoLocal, formData.equipoVisitante, formData.torneo]);

  const obtenerEstadisticasEquipo = async (equipoId, torneoId) => {
    try {
      const response = await axiosInstance.get(`/estadisticas/tarjeta-equipo/${equipoId}/${torneoId}`);
      return response.data.estadisticas;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return {
        partidosJugados: 0,
        partidosGanados: 0,
        partidosPerdidos: 0,
        porcentajeVictorias: 0,
        puntosFavor: 0,
        puntosContra: 0,
        promedioPuntosPorPartido: 0
      };
    }
  };

  // 🔥 HELPERS PARA FORMATEAR DATOS - Solo W-L (sin empates)
  const formatearRecord = (estadisticas) => {
    if (!estadisticas) return '0-0';
    
    const ganados = estadisticas.partidosGanados || 0;
    const perdidos = estadisticas.partidosPerdidos || 0;
    
    return `${ganados}-${perdidos}`;
  };
  
  const calcularPorcentajeVictorias = (estadisticas) => {
    if (!estadisticas || !estadisticas.partidosJugados) return '0.0';
    return estadisticas.porcentajeVictorias?.toFixed(1) || '0.0';
  };

  // Validación del formulario
  const validarFormulario = () => {
    const newErrors = {};

    if (!formData.equipoLocal) newErrors.equipoLocal = true;
    if (!formData.equipoVisitante) newErrors.equipoVisitante = true;
    if (!formData.torneo) newErrors.torneo = true;
    if (!formData.fechaHora) newErrors.fechaHora = true;

    if (formData.equipoLocal && formData.equipoLocal === formData.equipoVisitante) {
      newErrors.equipoVisitante = true;
      newErrors.general = 'Un equipo no puede jugar contra sí mismo';
    }

    if (!formData.arbitros.principal) {
      newErrors.arbitroPrincipal = true;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🔥 NUEVA FUNCIÓN: Validar step específico
  const validarStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 0: // Información Básica
        if (!formData.torneo) newErrors.torneo = true;
        break;
      case 1: // Equipos
        if (!formData.equipoLocal) newErrors.equipoLocal = true;
        if (!formData.equipoVisitante) newErrors.equipoVisitante = true;
        if (formData.equipoLocal === formData.equipoVisitante) {
          newErrors.equipoVisitante = true;
          newErrors.general = 'Un equipo no puede jugar contra sí mismo';
        }
        break;
      case 2: // Programación
        if (!formData.fechaHora) newErrors.fechaHora = true;
        break;
      case 3: // Árbitros
        if (!formData.arbitros.principal) newErrors.arbitroPrincipal = true;
        break;
      case 4: // Ubicación - Opcional
        // No hay campos obligatorios en este step
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en el formulario
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        delete newErrors.general;
        return newErrors;
      });
    }
  };

  // Manejar cambios en árbitros
  const handleArbitroChange = (posicion, value) => {
    setFormData(prev => ({
      ...prev,
      arbitros: {
        ...prev.arbitros,
        [posicion]: value
      }
    }));

    const errorKey = `arbitro${posicion.charAt(0).toUpperCase() + posicion.slice(1)}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  // Manejar cambios en sede
  const handleSedeChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      sede: {
        ...prev.sede,
        [field]: value
      }
    }));
  };

  // Auto-detectar categoría
  useEffect(() => {
    if (formData.equipoLocal && formData.equipoVisitante) {
      const equipoLocal = equipos.find(e => e._id === formData.equipoLocal);
      const equipoVisitante = equipos.find(e => e._id === formData.equipoVisitante);
      
      if (equipoLocal && equipoVisitante && equipoLocal.categoria === equipoVisitante.categoria) {
        handleInputChange('categoria', equipoLocal.categoria);
      }
    }
  }, [formData.equipoLocal, formData.equipoVisitante, equipos]);

  // 🔥 CORREGIR: Navegación del stepper con validación
  const handleNext = () => {
    // 🔥 VALIDAR STEP ACTUAL ANTES DE AVANZAR
    if (!validarStep(activeStep)) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: errors.general || 'Por favor completa todos los campos requeridos antes de continuar'
      });
      return;
    }

    // 🔥 EVITAR SALTAR EL ÚLTIMO STEP
    if (activeStep < steps.length - 1) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      Swal.fire({
        icon: 'error',
        title: 'Formulario incompleto',
        text: errors.general || 'Por favor completa todos los campos requeridos'
      });
      return;
    }

    try {
      setLoading(true);

      const partidoData = {
        equipoLocal: formData.equipoLocal,
        equipoVisitante: formData.equipoVisitante,
        torneo: formData.torneo,
        categoria: formData.categoria,
        fechaHora: formData.fechaHora,
        duracionMinutos: formData.duracionMinutos,
        jornada: formData.jornada || undefined, // 🔥 NUEVO CAMPO
        sede: {
          nombre: formData.sede.nombre,
          direccion: formData.sede.direccion
        },
        arbitros: {
          principal: formData.arbitros.principal,
          backeador: formData.arbitros.backeador || undefined,
          estadistico: formData.arbitros.estadistico || undefined
        }
      };

      if (!partidoData.sede.nombre && !partidoData.sede.direccion) {
        delete partidoData.sede;
      }

      await axiosInstance.post('/partidos', partidoData);

      Swal.fire({
        icon: 'success',
        title: '¡Partido creado!',
        text: 'El partido ha sido creado exitosamente',
        timer: 2000,
        showConfirmButton: false
      });

      navigate('/partidos');
    } catch (error) {
      console.error('Error al crear partido:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.mensaje || 'No se pudo crear el partido'
      });
    } finally {
      setLoading(false);
    }
  };

  // Obtener árbitros seleccionados
  const arbitrosSeleccionados = Object.values(formData.arbitros).filter(Boolean);

  // Renderizar contenido del step
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Stack spacing={4}>
            <Typography variant="h5" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <EmojiEventsIcon sx={{ color: '#64b5f6' }} />
              Información Básica
            </Typography>
            
            {/* 🔥 CORREGIR CSS: Cambiar de Grid a Flexbox */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Paper elevation={0} sx={{ 
                p: 4, 
                backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                borderRadius: 3 
              }}>
                {/* 🔥 USAR FLEXBOX PARA MEJOR DISTRIBUCIÓN */}
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 3,
                  alignItems: 'center'
                }}>
                  {/* Campo Torneo */}
                  <Box sx={{ width: '100%', maxWidth: '600px' }}>
                    <FormControl fullWidth error={errors.torneo} sx={{ mb: 3 }}>
                      <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                       Torneo *
                     </InputLabel>
                     <Select
                       value={formData.torneo}
                       label="Torneo *"
                       onChange={(e) => handleInputChange('torneo', e.target.value)}
                       sx={{
                         color: 'white',
                         backgroundColor: 'rgba(255, 255, 255, 0.05)',
                         minHeight: '56px',
                         '.MuiOutlinedInput-notchedOutline': {
                           borderColor: 'rgba(255, 255, 255, 0.2)',
                         },
                         '&:hover .MuiOutlinedInput-notchedOutline': {
                           borderColor: 'rgba(255, 255, 255, 0.4)',
                         },
                         '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                           borderColor: '#64b5f6',
                         },
                       }}
                     >
                       {torneos.map(torneo => (
                         <MenuItem key={torneo._id} value={torneo._id}>
                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                             <EmojiEventsIcon sx={{ color: '#FFD700' }} />
                             <Box>
                               <Typography variant="body1">{torneo.nombre}</Typography>
                               <Typography variant="caption" color="text.secondary">
                                 {torneo.equipos?.length || 0} equipos • {torneo.categorias?.length || 0} categorías
                               </Typography>
                             </Box>
                           </Box>
                         </MenuItem>
                       ))}
                     </Select>
                   </FormControl>
                 </Box>

                 {/* Campo Categoría */}
                 <Box sx={{ width: '100%', maxWidth: '600px' }}>
                   <FormControl fullWidth>
                     <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                       Categoría
                     </InputLabel>
                     <Select
                       value={formData.categoria}
                       label="Categoría"
                       onChange={(e) => handleInputChange('categoria', e.target.value)}
                       sx={{
                         color: 'white',
                         backgroundColor: 'rgba(255, 255, 255, 0.05)',
                         minHeight: '56px',
                         '.MuiOutlinedInput-notchedOutline': {
                           borderColor: 'rgba(255, 255, 255, 0.2)',
                         },
                         '&:hover .MuiOutlinedInput-notchedOutline': {
                           borderColor: 'rgba(255, 255, 255, 0.4)',
                         },
                         '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                           borderColor: '#64b5f6',
                         },
                       }}
                     >
                       {categorias.map(categoria => (
                         <MenuItem key={categoria.value} value={categoria.value}>
                           {categoria.label}
                         </MenuItem>
                       ))}
                     </Select>
                   </FormControl>
                 </Box>
               </Box>
             </Paper>
           </Box>
         </Stack>
       );

     case 1:
       return (
         <Stack spacing={4}>
           <Typography variant="h5" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
             <GroupIcon sx={{ color: '#64b5f6' }} />
             Equipos Enfrentados
           </Typography>
           
           {/* 🔥 NUEVO: Contenedor flexbox con altura fija */}
           <Box sx={{ 
             display: 'flex',
             gap: 3,
             minHeight: '400px', // Altura fija para consistencia
             flexDirection: { xs: 'column', md: 'row' }, // Responsive
             alignItems: 'stretch' // Hace que todos los elementos tengan la misma altura
           }}>
             {/* Equipo Local */}
             <Box sx={{ 
               flex: formData.equipoLocal && formData.equipoVisitante ? '1 1 300px' : '1 1 0',
               minWidth: '280px',
               display: 'flex',
               flexDirection: 'column',
               alignItems: 'center'
             }}>
               <Typography variant="h6" sx={{ 
                 color: 'white', 
                 mb: 3, 
                 textAlign: 'center',
                 height: '32px', // Altura fija para el título
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center'
               }}>
                 Equipo Local
               </Typography>
               <Box sx={{ 
                 width: '100%', 
                 flex: 1, // Ocupa todo el espacio disponible
                 display: 'flex',
                 justifyContent: 'center'
               }}>
                 <EquipoSelector
                   label="Seleccionar Equipo Local *"
                   value={formData.equipoLocal}
                   onChange={(value) => handleInputChange('equipoLocal', value)}
                   equipos={equipos}
                   categoria={formData.categoria}
                   equipoOpuesto={formData.equipoVisitante}
                   error={errors.equipoLocal}
                 />
               </Box>
             </Box>

             {/* Equipo Visitante */}
             <Box sx={{ 
               flex: formData.equipoLocal && formData.equipoVisitante ? '1 1 300px' : '1 1 0',
               minWidth: '280px',
               display: 'flex',
               flexDirection: 'column',
               alignItems: 'center'
             }}>
               <Typography variant="h6" sx={{ 
                 color: 'white', 
                 mb: 3, 
                 textAlign: 'center',
                 height: '32px', // Altura fija para el título
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center'
               }}>
                 Equipo Visitante
               </Typography>
               <Box sx={{ 
                 width: '100%', 
                 flex: 1, // Ocupa todo el espacio disponible
                 display: 'flex',
                 justifyContent: 'center'
               }}>
                 <EquipoSelector
                   label="Seleccionar Equipo Visitante *"
                   value={formData.equipoVisitante}
                   onChange={(value) => handleInputChange('equipoVisitante', value)}
                   equipos={equipos}
                   categoria={formData.categoria}
                   equipoOpuesto={formData.equipoLocal}
                   error={errors.equipoVisitante}
                 />
               </Box>
             </Box>
             {/* Preview mejorado - Solo aparece cuando ambos equipos están seleccionados */}
             {formData.equipoLocal && formData.equipoVisitante && (
               <Box sx={{ 
                 flex: '1 1 350px',
                 minWidth: '320px',
                 display: 'flex',
                 flexDirection: 'column',
                 alignItems: 'center'
               }}>
                 <Typography variant="h6" sx={{ 
                   color: '#4caf50', 
                   mb: 3, 
                   textAlign: 'center',
                   height: '32px',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   gap: 1
                 }}>
                   <CheckCircleIcon />
                   Vista Previa del Partido
                 </Typography>
                 
                 <Paper 
                   elevation={0}
                   sx={{ 
                     p: 3, 
                     backgroundColor: 'rgba(76, 175, 80, 0.1)',
                     borderRadius: 3,
                     border: '1px solid rgba(76, 175, 80, 0.3)',
                     width: '100%',
                     flex: 1,
                     display: 'flex',
                     flexDirection: 'column',
                     overflow: 'hidden'
                   }}
                 >
                   {(() => {
                     const equipoLocal = equipos.find(e => e._id === formData.equipoLocal);
                     const equipoVisitante = equipos.find(e => e._id === formData.equipoVisitante);
                     const torneoSeleccionado = torneos.find(t => t._id === formData.torneo);
                     const recordLocal = estadisticasEquipos[formData.equipoLocal] || { partidosGanados: 0, partidosPerdidos: 0 };
                     const recordVisitante = estadisticasEquipos[formData.equipoVisitante] || { partidosGanados: 0, partidosPerdidos: 0 };
                     
                     // Calcular porcentaje de victorias
                     const calcularPorcentaje = (record) => {
                       const total = record.ganados + record.perdidos + record.empates;
                       return total > 0 ? ((record.ganados / total) * 100).toFixed(1) : '0.0';
                     };
                     
                     return (
                       <Box sx={{ 
                         display: 'flex', 
                         flexDirection: 'column',
                         height: '100%',
                         gap: 2
                       }}>
                         {/* Información del Torneo */}
                         {torneoSeleccionado && (
                           <Box sx={{ 
                             backgroundColor: 'rgba(100, 181, 246, 0.15)',
                             borderRadius: 2,
                             p: 1.5,
                             textAlign: 'center',
                             borderLeft: '4px solid #64b5f6'
                           }}>
                             <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
                               <EmojiEventsIcon sx={{ color: '#FFD700', fontSize: 18 }} />
                               <Typography variant="subtitle2" sx={{ color: '#64b5f6', fontWeight: 'bold' }}>
                                 {torneoSeleccionado.nombre}
                               </Typography>
                             </Box>
                             <Typography variant="caption" color="text.secondary">
                               {torneoSeleccionado.equipos?.length || 0} equipos participantes
                             </Typography>
                           </Box>
                         )}

                         {/* Información de Categoría */}
                         {(equipoLocal?.categoria || formData.categoria) && (
                           <Box sx={{ 
                             backgroundColor: 'rgba(156, 39, 176, 0.15)',
                             borderRadius: 2,
                             p: 1.5,
                             textAlign: 'center'
                           }}>
                             <Typography variant="subtitle2" sx={{ color: '#ab47bc', fontWeight: 'bold', mb: 0.5 }}>
                               Categoría
                             </Typography>
                             <Chip 
                               label={getCategoryName(equipoLocal?.categoria || formData.categoria)}
                               size="small"
                               sx={{ 
                                 backgroundColor: '#ab47bc',
                                 color: 'white',
                                 fontWeight: 'bold'
                               }}
                             />
                           </Box>
                         )}

                         {/* 🔥 ENFRENTAMIENTO HORIZONTAL */}
                         <Box sx={{ 
                           flex: 1,
                           display: 'flex', 
                           alignItems: 'center', 
                           justifyContent: 'center',
                           gap: 2,
                           backgroundColor: 'rgba(255, 255, 255, 0.03)',
                           borderRadius: 2,
                           p: 2
                         }}>
                           {/* Equipo Local */}
                           <Box sx={{ 
                             flex: 1,
                             textAlign: 'center',
                             backgroundColor: 'rgba(33, 150, 243, 0.1)',
                             borderRadius: 2,
                             p: 2,
                             border: '2px solid rgba(33, 150, 243, 0.3)'
                           }}>
                             <Avatar 
                               src={equipoLocal?.imagen} 
                               sx={{ 
                                 width: 60, 
                                 height: 60, 
                                 mx: 'auto', 
                                 mb: 1,
                                 border: '2px solid #2196f3',
                                 boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)'
                               }}
                             >
                               <GroupIcon sx={{ fontSize: 30 }} />
                             </Avatar>
                             <Typography variant="subtitle2" color="white" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                               {equipoLocal?.nombre}
                             </Typography>
                             <Chip 
                               label="LOCAL" 
                               size="small" 
                               color="primary"
                               sx={{ fontSize: '0.65rem', mb: 1, height: 20 }}
                             />
                             
                             {/* Récord del Equipo Local */}
                             <Box sx={{ 
                               backgroundColor: 'rgba(33, 150, 243, 0.2)',
                               borderRadius: 1,
                               p: 1,
                               border: '1px solid rgba(33, 150, 243, 0.4)'
                             }}>
                               <Typography variant="subtitle1" sx={{ 
                                 color: '#2196f3', 
                                 fontWeight: 'bold',
                                 fontFamily: 'monospace',
                                 fontSize: '1rem'
                               }}>
                                 {loadingEstadisticas ? '...' : formatearRecord(recordLocal)}
                               </Typography>
                               <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                 {loadingEstadisticas ? '...' : `${calcularPorcentajeVictorias(recordLocal)}% victorias`}
                               </Typography>
                             </Box>
                           </Box>
                           
                           {/* VS Central */}
                           <Box sx={{ 
                             display: 'flex',
                             flexDirection: 'column',
                             alignItems: 'center',
                             justifyContent: 'center',
                             px: 1
                           }}>
                             <Typography variant="h5" sx={{ 
                               color: '#64b5f6', 
                               fontWeight: 'bold',
                               textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                               mb: 0.5
                             }}>
                               VS
                             </Typography>
                             
                             {/* 🔥 ANÁLISIS RÁPIDO EN EL CENTRO */}
                             {(() => {
                               const diferencia = Math.abs(recordLocal.porcentajeVictorias - recordVisitante.porcentajeVictorias);
                               
                               let analisis = "";
                               let color = "#64b5f6";
                               
                               if (diferencia < 10) {
                                 analisis = "🔥 Parejo";
                                 color = "#ff9800";
                               } else if (diferencia < 25) {
                                 analisis = "⚖️ Favorito";
                                 color = "#2196f3";
                               } else {
                                 analisis = "🎯 Claro";
                                 color = "#4caf50";
                               }
                               
                               return (
                                 <Typography variant="caption" sx={{ 
                                   color: color, 
                                   fontWeight: 'bold',
                                   textAlign: 'center',
                                   fontSize: '0.7rem'
                                 }}>
                                   {analisis}
                                 </Typography>
                               );
                             })()}
                           </Box>
                           
                           {/* Equipo Visitante */}
                           <Box sx={{ 
                             flex: 1,
                             textAlign: 'center',
                             backgroundColor: 'rgba(255, 152, 0, 0.1)',
                             borderRadius: 2,
                             p: 2,
                             border: '2px solid rgba(255, 152, 0, 0.3)'
                           }}>
                             <Avatar 
                               src={equipoVisitante?.imagen} 
                               sx={{ 
                                 width: 60, 
                                 height: 60, 
                                 mx: 'auto', 
                                 mb: 1,
                                 border: '2px solid #ff9800',
                                 boxShadow: '0 2px 8px rgba(255, 152, 0, 0.3)'
                               }}
                             >
                               <GroupIcon sx={{ fontSize: 30 }} />
                             </Avatar>
                             <Typography variant="subtitle2" color="white" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                               {equipoVisitante?.nombre}
                             </Typography>
                             <Chip 
                               label="VISITANTE" 
                               size="small" 
                               sx={{ 
                                 fontSize: '0.65rem', 
                                 mb: 1,
                                 height: 20,
                                 backgroundColor: '#ff9800',
                                 color: 'white'
                               }}
                             />
                             
                             {/* Récord del Equipo Visitante */}
                             <Box sx={{ 
                               backgroundColor: 'rgba(255, 152, 0, 0.2)',
                               borderRadius: 1,
                               p: 1,
                               border: '1px solid rgba(255, 152, 0, 0.4)'
                             }}>
                               <Typography variant="subtitle1" sx={{ 
                                 color: '#ff9800', 
                                 fontWeight: 'bold',
                                 fontFamily: 'monospace',
                                 fontSize: '1rem'
                               }}>
                                 {loadingEstadisticas ? '...' : formatearRecord(recordVisitante)}
                               </Typography>
                               <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                 {loadingEstadisticas ? '...' : `${calcularPorcentajeVictorias(recordVisitante)}% victorias`}
                               </Typography>
                             </Box>
                           </Box>
                         </Box>

                         {/* Estado de validación */}
                         <Box sx={{ 
                           display: 'flex',
                           justifyContent: 'center'
                         }}>
                           <Chip 
                             icon={<CheckCircleIcon />}
                             label="Equipos listos" 
                             color="success"
                             size="small"
                             sx={{ fontWeight: 'bold' }}
                           />
                         </Box>
                       </Box>
                     );
                   })()}
                 </Paper>
               </Box>
             )}
         </Box>
       </Stack>
     );

      case 2:
        return (
          <Stack spacing={4}>
            <Typography variant="h5" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <ScheduleIcon sx={{ color: '#64b5f6' }} />
              Programación del Partido
            </Typography>
            
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 4, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 3 }}>
                  <Grid container spacing={4}>
                    <Grid item xs={12} md={8}>
                      <TextField
                        fullWidth
                        type="datetime-local"
                        label="Fecha y Hora del Partido *"
                        value={formData.fechaHora}
                        onChange={(e) => handleInputChange('fechaHora', e.target.value)}
                        error={errors.fechaHora}
                        helperText={errors.fechaHora ? 'Selecciona fecha y hora válidas' : 'Selecciona cuándo se jugará el partido'}
                        InputLabelProps={{
                          shrink: true,
                          sx: { color: 'rgba(255, 255, 255, 0.7)' }
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: 'white',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            '& fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.2)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.4)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#64b5f6',
                            },
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          Duración
                        </InputLabel>
                        <Select
                          value={formData.duracionMinutos}
                          label="Duración"
                          onChange={(e) => handleInputChange('duracionMinutos', e.target.value)}
                          sx={{
                            color: 'white',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            '.MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255, 255, 255, 0.2)',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255, 255, 255, 0.4)',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#64b5f6',
                            },
                          }}
                        >
                          {duracionesComunes.map(duracion => (
                            <MenuItem key={duracion.value} value={duracion.value}>
                              {duracion.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* 🔥 NUEVO CAMPO: Jornada */}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Jornada"
                        value={formData.jornada}
                        onChange={(e) => handleInputChange('jornada', e.target.value)}
                        placeholder="Ej: Jornada 1, Semifinal, Final, etc."
                        helperText="Escribe el nombre de la jornada. Campo opcional."
                        InputProps={{
                          startAdornment: (
                            <CalendarTodayIcon sx={{ color: '#64b5f6', mr: 1 }} />
                          )
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: 'white',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            '& fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.2)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.4)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#64b5f6',
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: 'rgba(255, 255, 255, 0.7)',
                          },
                          '& .MuiFormHelperText-root': {
                            color: 'rgba(255, 255, 255, 0.5)',
                          }
                        }}
                      />
                    </Grid>
                  </Grid>

                  {(formData.fechaHora || formData.jornada) && (
                    <Box sx={{ mt: 3, p: 2, backgroundColor: 'rgba(100, 181, 246, 0.1)', borderRadius: 2 }}>
                      <Typography variant="subtitle1" sx={{ color: '#64b5f6', mb: 1 }}>
                        Resumen de Programación
                      </Typography>
                      {formData.fechaHora && (
                        <>
                          <Typography variant="body2" color="text.secondary">
                            Fecha: {new Date(formData.fechaHora).toLocaleDateString('es-ES', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Hora: {new Date(formData.fechaHora).toLocaleTimeString('es-ES', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Duración: {formData.duracionMinutos} minutos
                          </Typography>
                        </>
                      )}
                      {formData.jornada && (
                        <Typography variant="body2" color="text.secondary">
                          Jornada: {formData.jornada}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Stack>
        );

      case 3:
       return (
         <Stack spacing={4}>
           <Typography variant="h5" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
             <GavelIcon sx={{ color: '#64b5f6' }} />
             Asignación de Árbitros
           </Typography>
           
           {/* 🔥 NUEVO: Contenedor flexbox principal */}
           <Box sx={{ 
             display: 'flex',
             flexDirection: 'column',
             gap: 4,
             minHeight: '500px' // Altura mínima para consistencia
           }}>
             {/* Árbitro Principal - Ocupa todo el ancho */}
             <Box sx={{ 
               display: 'flex',
               justifyContent: 'center',
               width: '100%'
             }}>
               <Box sx={{ 
                 width: '100%', 
                 maxWidth: '600px', // Ancho máximo para centrar
                 display: 'flex',
                 flexDirection: 'column',
                 alignItems: 'center'
               }}>
                 <Typography variant="h6" sx={{ 
                   color: 'white', 
                   mb: 3, 
                   textAlign: 'center',
                   height: '32px',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center'
                 }}>
                   Árbitro Principal *
                 </Typography>
                 <ArbitroSelector
                   label="Árbitro Principal"
                   value={formData.arbitros.principal}
                   onChange={(value) => handleArbitroChange('principal', value)}
                   arbitros={arbitros}
                   arbitrosSeleccionados={arbitrosSeleccionados}
                   error={errors.arbitroPrincipal}
                 />
               </Box>
             </Box>

             {/* Árbitros opcionales - Lado a lado */}
             <Box sx={{ 
               display: 'flex',
               gap: 3,
               flexDirection: { xs: 'column', md: 'row' }, // Responsive
               alignItems: 'stretch' // Misma altura
             }}>
               {/* Back Judge */}
               <Box sx={{ 
                 flex: '1 1 0',
                 minWidth: '280px',
                 display: 'flex',
                 flexDirection: 'column',
                 alignItems: 'center'
               }}>
                 <Typography variant="h6" sx={{ 
                   color: 'white', 
                   mb: 3, 
                   textAlign: 'center',
                   height: '32px',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center'
                 }}>
                   Back Judge (Opcional)
                 </Typography>
                 <Box sx={{ width: '100%', flex: 1 }}>
                   <ArbitroSelector
                     label="Back Judge"
                     value={formData.arbitros.backeador}
                     onChange={(value) => handleArbitroChange('backeador', value)}
                     arbitros={arbitros}
                     arbitrosSeleccionados={arbitrosSeleccionados}
                     opcional={true}
                   />
                 </Box>
               </Box>

               {/* Estadístico */}
               <Box sx={{ 
                 flex: '1 1 0',
                 minWidth: '280px',
                 display: 'flex',
                 flexDirection: 'column',
                 alignItems: 'center'
               }}>
                 <Typography variant="h6" sx={{ 
                   color: 'white', 
                   mb: 3, 
                   textAlign: 'center',
                   height: '32px',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center'
                 }}>
                   Estadístico (Opcional)
                 </Typography>
                 <Box sx={{ width: '100%', flex: 1 }}>
                   <ArbitroSelector
                     label="Estadístico"
                     value={formData.arbitros.estadistico}
                     onChange={(value) => handleArbitroChange('estadistico', value)}
                     arbitros={arbitros}
                     arbitrosSeleccionados={arbitrosSeleccionados}
                     opcional={true}
                   />
                 </Box>
               </Box>
             </Box>
           </Box>
         </Stack>
       );

     case 4:
       return (
         <Stack spacing={4}>
           <Typography variant="h5" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
             <LocationIcon sx={{ color: '#64b5f6' }} />
             Ubicación del Partido
           </Typography>
           
           <Grid container spacing={4}>
             <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 4, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 3 }}>
                 <Grid container spacing={4}>
                   <Grid item xs={12} md={6}>
                     <TextField
                       fullWidth
                       label="Nombre de la Sede"
                       value={formData.sede.nombre}
                       onChange={(e) => handleSedeChange('nombre', e.target.value)}
                       placeholder="Ej: Campo de Fútbol Central"
                       helperText="Nombre del lugar donde se jugará (opcional)"
                       InputLabelProps={{
                         sx: { color: 'rgba(255, 255, 255, 0.7)' }
                       }}
                       sx={{
                         '& .MuiOutlinedInput-root': {
                           color: 'white',
                           backgroundColor: 'rgba(255, 255, 255, 0.05)',
                           '& fieldset': {
                             borderColor: 'rgba(255, 255, 255, 0.2)',
                           },
                           '&:hover fieldset': {
                             borderColor: 'rgba(255, 255, 255, 0.4)',
                           },
                           '&.Mui-focused fieldset': {
                             borderColor: '#64b5f6',
                           },
                         }
                       }}
                     />
                   </Grid>

                   <Grid item xs={12} md={6}>
                     <TextField
                       fullWidth
                       label="Dirección"
                       value={formData.sede.direccion}
                       onChange={(e) => handleSedeChange('direccion', e.target.value)}
                       placeholder="Ej: Av. Principal #123, Colonia Centro"
                       helperText="Dirección completa del lugar (opcional)"
                       InputLabelProps={{
                         sx: { color: 'rgba(255, 255, 255, 0.7)' }
                       }}
                       sx={{
                         '& .MuiOutlinedInput-root': {
                           color: 'white',
                           backgroundColor: 'rgba(255, 255, 255, 0.05)',
                           '& fieldset': {
                             borderColor: 'rgba(255, 255, 255, 0.2)',
                           },
                           '&:hover fieldset': {
                             borderColor: 'rgba(255, 255, 255, 0.4)',
                           },
                           '&.Mui-focused fieldset': {
                             borderColor: '#64b5f6',
                           },
                         }
                       }}
                     />
                   </Grid>

                   <Grid item xs={12}>
                     <TextField
                       fullWidth
                       multiline
                       rows={4}
                       label="Observaciones"
                       value={formData.observaciones}
                       onChange={(e) => handleInputChange('observaciones', e.target.value)}
                       placeholder="Información adicional sobre el partido, instrucciones especiales, etc."
                       helperText="Cualquier información adicional que sea útil para los equipos y árbitros"
                       InputLabelProps={{
                         sx: { color: 'rgba(255, 255, 255, 0.7)' }
                       }}
                       sx={{
                         '& .MuiOutlinedInput-root': {
                           color: 'white',
                           backgroundColor: 'rgba(255, 255, 255, 0.05)',
                           '& fieldset': {
                             borderColor: 'rgba(255, 255, 255, 0.2)',
                           },
                           '&:hover fieldset': {
                             borderColor: 'rgba(255, 255, 255, 0.4)',
                           },
                           '&.Mui-focused fieldset': {
                             borderColor: '#64b5f6',
                           },
                         }
                       }}
                     />
                   </Grid>
                 </Grid>

                 {(formData.sede.nombre || formData.sede.direccion) && (
                   <Box sx={{ mt: 3, p: 2, backgroundColor: 'rgba(100, 181, 246, 0.1)', borderRadius: 2 }}>
                     <Typography variant="subtitle1" sx={{ color: '#64b5f6', mb: 1 }}>
                       Información de la Sede
                     </Typography>
                     {formData.sede.nombre && (
                       <Typography variant="body2" color="text.secondary">
                         Sede: {formData.sede.nombre}
                       </Typography>
                     )}
                     {formData.sede.direccion && (
                       <Typography variant="body2" color="text.secondary">
                         Dirección: {formData.sede.direccion}
                       </Typography>
                     )}
                   </Box>
                 )}
               </Paper>
             </Grid>
           </Grid>
         </Stack>
       );

     default:
       return 'Unknown step';
  }
};

// Animaciones
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 } 
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

if (loadingData) {
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      minHeight: '400px' 
    }}>
      <CircularProgress size={60} />
      <Typography sx={{ ml: 2, color: 'white' }}>Cargando datos...</Typography>
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
          <Typography 
            component="span" 
            sx={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
            onClick={() => navigate('/partidos')}
          >
            Partidos
          </Typography>
          <Typography color="primary">Crear Partido</Typography>
        </Breadcrumbs>
      </motion.div>

      {/* Header */}
      <motion.div variants={itemVariants}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
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
            <SportsFootballIcon sx={{ color: '#64b5f6' }} />
            Crear Nuevo Partido
          </Typography>
          
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/partidos')}
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.3)',
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }
            }}
          >
            Volver
          </Button>
        </Box>
      </motion.div>

      {/* Stepper */}
      <motion.div variants={itemVariants}>
        <Card sx={{ ...cardStyle, mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel sx={{ 
                    '& .MuiStepLabel-label': { 
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&.Mui-active': {
                        color: '#64b5f6'
                      },
                      '&.Mui-completed': {
                        color: '#4caf50'
                      }
                    }
                  }}>
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>
      </motion.div>

      {/* Formulario */}
      <motion.div variants={itemVariants}>
        <Card sx={cardStyle}>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <form onSubmit={handleSubmit}>
              {/* Contenido del step actual */}
              <Box sx={{ minHeight: '400px', mb: 4 }}>
                {renderStepContent(activeStep)}
              </Box>

              {/* Error General */}
              {errors.general && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {errors.general}
                </Alert>
              )}

              {/* Botones de navegación */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                pt: 3,
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  variant="outlined"
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)'
                    },
                    '&:disabled': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.3)'
                    }
                  }}
                >
                  Anterior
                </Button>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InfoIcon sx={{ color: '#64b5f6', fontSize: 20 }} />
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Paso {activeStep + 1} de {steps.length}
                  </Typography>
                </Box>

                {activeStep === steps.length - 1 ? (
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    disabled={loading}
                    onClick={handleSubmit} // 🔥 AGREGAR onClick para el último step
                    sx={{
                      background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                      boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #388e3c 30%, #4caf50 90%)',
                      },
                      '&:disabled': {
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.3)'
                      },
                      px: 4,
                      py: 1.5
                    }}
                  >
                    {loading ? 'Creando...' : 'Crear Partido'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{
                      background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                      boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                      px: 4,
                      py: 1.5
                    }}
                  >
                    Siguiente
                  </Button>
                )}
              </Box>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Información de Ayuda */}
      <motion.div variants={itemVariants}>
        <Card sx={{ ...cardStyle, mt: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              mb: 2
            }}>
              <InfoIcon sx={{ color: '#64b5f6' }} />
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                Consejos para Crear Partidos
              </Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2,
                  backgroundColor: 'rgba(100, 181, 246, 0.1)',
                  borderRadius: 2,
                  p: 2
                }}>
                  <ScheduleIcon sx={{ color: '#64b5f6' }} />
                  <Box>
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                      Programación
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Programa con al menos 24 horas de anticipación
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2,
                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                  borderRadius: 2,
                  p: 2
                }}>
                  <GavelIcon sx={{ color: '#4caf50' }} />
                  <Box>
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                      Árbitros
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Verifica disponibilidad antes de asignar
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2,
                  backgroundColor: 'rgba(255, 152, 0, 0.1)',
                  borderRadius: 2,
                  p: 2
                }}>
                  <LocationIcon sx={{ color: '#ff9800' }} />
                  <Box>
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                      Ubicación
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Incluye direcciones claras
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  </Box>
);
};