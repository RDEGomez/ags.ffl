// 🔥 DetallePartido.jsx - CON GESTIÓN COMPLETA INTEGRADA
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import axiosInstance from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LideresPartido } from '../../components/LideresPartido';

import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Button,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';

import {
  NavigateNext as NavigateNextIcon,
  SportsFootball as SportsFootballIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Pause as PauseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Gavel as GavelIcon,
  Assessment as AssessmentIcon,
  Info as InfoIcon,
  Timeline as TimelineIcon,
  LocalFireDepartment as Fire,
  Sports as SportsIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';

// Importar los paneles existentes
import EquipoInfo from './EquipoInfo';
import ArbitrosPanel from './ArbitrosPanel';
import EstadisticasPanel from './EstadisticasPanel';
import JugadasPanel from './JugadasPanel';
import DetallesPanel from './DetallesPanel';
import EstadoPartido from './EstadoPartido';
import RegistroJugadas from './RegistroJugadas';

const TabPanel = ({ children, value, index, ...other }) => (
  <motion.div
    role="tabpanel"
    hidden={value !== index}
    id={`partido-tabpanel-${index}`}
    aria-labelledby={`partido-tab-${index}`}
    {...other}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: value === index ? 1 : 0, y: value === index ? 0 : 20 }}
    transition={{ duration: 0.4 }}
    style={{ width: '100%' }}
  >
    {value === index && (
      <Box sx={{ 
        py: { xs: 2, md: 3 },
        width: '100%',
        overflow: 'hidden'
      }}>
        {children}
      </Box>
    )}
  </motion.div>
);

// 🔥 COMPONENTE: Header con navegación mejorado
const NavigationHeader = ({ partidoId, navigate, puedeGestionarPartidos, onEdit }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ 
      mb: 4,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      px: { xs: 2, md: 0 }
    }}>
      {/* Breadcrumbs */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <IconButton
            onClick={() => navigate('/partidos')}
            sx={{ 
              background: 'linear-gradient(135deg, rgba(100, 181, 246, 0.2) 0%, rgba(100, 181, 246, 0.1) 100%)',
              border: '1px solid rgba(100, 181, 246, 0.3)',
              color: '#64b5f6',
              '&:hover': {
                background: 'linear-gradient(135deg, rgba(100, 181, 246, 0.3) 0%, rgba(100, 181, 246, 0.2) 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(100, 181, 246, 0.3)'
              }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        </motion.div>

        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />}
        >
          <Link 
            to="/partidos" 
            style={{ 
              color: '#64b5f6', 
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 500
            }}
          >
            Partidos
          </Link>
          <Typography sx={{ color: 'white', fontSize: '0.9rem', fontWeight: 600 }}>
            #{partidoId?.slice(-8)}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Botón de editar */}
      {puedeGestionarPartidos && (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={onEdit}
            sx={{
              background: 'linear-gradient(135deg, #9c27b0 0%, #673ab7 100%)',
              color: 'white',
              borderRadius: '12px',
              px: 3,
              py: 1,
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 4px 15px rgba(156, 39, 176, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #ad32c4 0%, #7c4dff 100%)',
                boxShadow: '0 6px 20px rgba(156, 39, 176, 0.4)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            {isMobile ? 'Editar' : 'Editar Partido'}
          </Button>
        </motion.div>
      )}
    </Box>
  );
};

// 🔥 COMPONENTE: Información principal del partido - FLEXBOX CENTRADO
const PartidoMainInfo = ({ partido }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatearHora = (fecha) => {
    return new Date(fecha).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <Card sx={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        mb: 4,
        overflow: 'hidden',
        width: '100%'
      }}>
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          {/* 🔥 LAYOUT PRINCIPAL CON FLEXBOX */}
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            alignItems: 'center',
            justifyContent: 'center',
            gap: { xs: 4, lg: 6 },
            width: '100%'
          }}>
            
            {/* 🔥 EQUIPO LOCAL */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              flex: { xs: 'none', lg: 1 },
              width: { xs: '100%', lg: 'auto' },
              maxWidth: { xs: '300px', lg: '400px' }
            }}>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Avatar
                  src={partido.equipoLocal?.imagen}
                  alt={`Logo de ${partido.equipoLocal?.nombre}`}
                  sx={{ 
                    width: { xs: 100, md: 140 }, 
                    height: { xs: 100, md: 140 },
                    mb: 2,
                    border: '4px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)'
                  }}
                >
                  <GroupIcon sx={{ fontSize: { xs: 50, md: 70 }, color: '#64b5f6' }} />
                </Avatar>
              </motion.div>

              <Typography 
                variant="h4" 
                sx={{ 
                  color: 'white', 
                  fontWeight: 700,
                  mb: 1,
                  fontSize: { xs: '1.5rem', md: '2rem' },
                  textAlign: 'center',
                  lineHeight: 1.2,
                  wordBreak: 'break-word'
                }}
              >
                {partido.equipoLocal?.nombre || 'Equipo Local'}
              </Typography>

              <Chip
                label="Local"
                sx={{
                  backgroundColor: 'rgba(76, 175, 80, 0.2)',
                  color: '#4caf50',
                  border: '1px solid rgba(76, 175, 80, 0.3)',
                  fontWeight: 600,
                  mb: 2
                }}
              />

              {/* Marcador Local */}
              <motion.div
                animate={{ 
                  scale: partido.estado === 'en_curso' ? [1, 1.05, 1] : 1,
                  textShadow: partido.estado === 'en_curso' ? 
                    ['0 0 10px #64b5f6', '0 0 20px #64b5f6', '0 0 10px #64b5f6'] : 
                    '0 0 10px #64b5f6'
                }}
                transition={{ duration: 2, repeat: partido.estado === 'en_curso' ? Infinity : 0 }}
              >
                <Typography 
                  variant="h1" 
                  sx={{ 
                    fontSize: { xs: '4rem', md: '6rem' },
                    fontWeight: 900,
                    color: '#64b5f6',
                    lineHeight: 1,
                    textShadow: '0 0 20px rgba(100, 181, 246, 0.5)',
                    fontFamily: 'monospace'
                  }}
                >
                  {partido.marcador?.local || 0}
                </Typography>
              </motion.div>
            </Box>

            {/* 🔥 SECCIÓN CENTRAL VS */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              flex: { xs: 'none', lg: 0 },
              width: { xs: '100%', lg: 'auto' },
              order: { xs: isMobile ? 1 : 0, lg: 0 }
            }}>
              <Typography 
                variant="h3" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.3)',
                  fontWeight: 300,
                  fontSize: { xs: '2rem', md: '3rem' },
                  letterSpacing: '0.1em'
                }}
              >
                VS
              </Typography>
              
              <EstadoPartido estado={partido.estado} />
            </Box>

            {/* 🔥 EQUIPO VISITANTE */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              flex: { xs: 'none', lg: 1 },
              width: { xs: '100%', lg: 'auto' },
              maxWidth: { xs: '300px', lg: '400px' }
            }}>
              <motion.div
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Avatar
                  src={partido.equipoVisitante?.imagen}
                  alt={`Logo de ${partido.equipoVisitante?.nombre}`}
                  sx={{ 
                    width: { xs: 100, md: 140 }, 
                    height: { xs: 100, md: 140 },
                    mb: 2,
                    border: '4px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)'
                  }}
                >
                  <GroupIcon sx={{ fontSize: { xs: 50, md: 70 }, color: '#64b5f6' }} />
                </Avatar>
              </motion.div>

              <Typography 
                variant="h4" 
                sx={{ 
                  color: 'white', 
                  fontWeight: 700,
                  mb: 1,
                  fontSize: { xs: '1.5rem', md: '2rem' },
                  textAlign: 'center',
                  lineHeight: 1.2,
                  wordBreak: 'break-word'
                }}
              >
                {partido.equipoVisitante?.nombre || 'Equipo Visitante'}
              </Typography>

              <Chip
                label="Visitante"
                sx={{
                  backgroundColor: 'rgba(255, 152, 0, 0.2)',
                  color: '#ff9800',
                  border: '1px solid rgba(255, 152, 0, 0.3)',
                  fontWeight: 600,
                  mb: 2
                }}
              />

              {/* Marcador Visitante */}
              <motion.div
                animate={{ 
                  scale: partido.estado === 'en_curso' ? [1, 1.05, 1] : 1,
                  textShadow: partido.estado === 'en_curso' ? 
                    ['0 0 10px #64b5f6', '0 0 20px #64b5f6', '0 0 10px #64b5f6'] : 
                    '0 0 10px #64b5f6'
                }}
                transition={{ duration: 2, repeat: partido.estado === 'en_curso' ? Infinity : 0, delay: 0.1 }}
              >
                <Typography 
                  variant="h1" 
                  sx={{ 
                    fontSize: { xs: '4rem', md: '6rem' },
                    fontWeight: 900,
                    color: '#64b5f6',
                    lineHeight: 1,
                    textShadow: '0 0 20px rgba(100, 181, 246, 0.5)',
                    fontFamily: 'monospace'
                  }}
                >
                  {partido.marcador?.visitante || 0}
                </Typography>
              </motion.div>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// 🔥 COMPONENTE: Información adicional con flexbox
const InfoAdicional = ({ partido }) => {
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatearHora = (fecha) => {
    return new Date(fecha).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <Card sx={{
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        p: 3,
        mb: 4,
        width: '100%'
      }}>
        {/* 🔥 FLEXBOX PARA INFO ADICIONAL */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'center',
          alignItems: 'center',
          gap: { xs: 3, md: 6 },
          flexWrap: 'wrap'
        }}>
          {/* Fecha */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            textAlign: 'center',
            minWidth: '150px'
          }}>
            <CalendarIcon sx={{ fontSize: 32, color: '#64b5f6' }} />
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
              {formatearFecha(partido.fechaHora)}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {formatearHora(partido.fechaHora)}
            </Typography>
          </Box>

          {/* Torneo */}
          {partido.torneo && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              textAlign: 'center',
              minWidth: '150px'
            }}>
              <TrophyIcon sx={{ fontSize: 32, color: '#9c27b0' }} />
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                {partido.torneo.nombre}
              </Typography>
              <Chip
                label="Torneo"
                size="small"
                sx={{
                  backgroundColor: 'rgba(156, 39, 176, 0.2)',
                  color: '#9c27b0',
                  border: '1px solid rgba(156, 39, 176, 0.3)'
                }}
              />
            </Box>
          )}

          {/* Sede */}
          {partido.sede && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              textAlign: 'center',
              minWidth: '150px'
            }}>
              <LocationIcon sx={{ fontSize: 32, color: '#ff9800' }} />
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                {partido.sede.nombre || 'Sede TBD'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {partido.sede.direccion || 'Dirección pendiente'}
              </Typography>
            </Box>
          )}

          {/* Categoría */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            textAlign: 'center',
            minWidth: '150px'
          }}>
            <SportsFootballIcon sx={{ fontSize: 32, color: '#4caf50' }} />
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
              {partido.categoria?.toUpperCase() || 'CATEGORÍA'}
            </Typography>
            <Chip
              label="Categoría"
              size="small"
              sx={{
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                color: '#4caf50',
                border: '1px solid rgba(76, 175, 80, 0.3)'
              }}
            />
          </Box>
        </Box>
      </Card>
    </motion.div>
  );
};

// 🔥 COMPONENTE PRINCIPAL MEJORADO
export const DetallePartido = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { puedeGestionarPartidos, usuario } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Estados
  const [partido, setPartido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabActual, setTabActual] = useState(0);
  const [actualizandoEstado, setActualizandoEstado] = useState(false);

  // Obtener partido
  const obtenerPartido = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get(`/partidos/${id}`);
      setPartido(data.partido);
      setError('');
    } catch (error) {
      console.error('Error al obtener partido:', error);
      setError(error.response?.data?.mensaje || 'Error al cargar el partido');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FUNCIÓN PARA CAMBIAR ESTADO DEL PARTIDO
  const cambiarEstadoPartido = async (nuevoEstado) => {
    try {
      setActualizandoEstado(true);
      
      // Configurar el diálogo según la acción
      const configuraciones = {
        'en_curso': { title: '¿Iniciar el partido?', text: 'El partido cambiará a "En Curso"', color: '#4caf50' },
        'medio_tiempo': { title: '¿Ir a medio tiempo?', text: 'El partido entrará en descanso', color: '#ff9800' },
        'finalizado': { title: '¿Finalizar el partido?', text: 'El partido terminará definitivamente', color: '#9c27b0' },
        'suspendido': { title: '¿Suspender el partido?', text: 'El partido se pausará temporalmente', color: '#f44336' },
        'cancelado': { title: '¿Cancelar el partido?', text: 'El partido se cancelará definitivamente', color: '#9e9e9e' },
        'programado': { title: '¿Reprogramar el partido?', text: 'El partido volverá a estado programado', color: '#2196f3' }
      };

      const config = configuraciones[nuevoEstado] || { title: '¿Cambiar estado?', text: `El partido cambiará a "${nuevoEstado}"`, color: '#64b5f6' };

      // Solicitar motivo opcional
      const { value: motivo } = await Swal.fire({
        title: config.title,
        input: 'textarea',
        inputLabel: 'Motivo del cambio (opcional)',
        inputPlaceholder: 'Describe el motivo del cambio de estado...',
        text: config.text,
        showCancelButton: true,
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: config.color,
        cancelButtonColor: '#f44336',
        background: '#1a1a2e',
        color: 'white',
        inputAttributes: {
          style: 'background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.3); border-radius: 8px;'
        }
      });

      if (motivo !== undefined) { // Usuario confirmó (incluso con motivo vacío)
        await axiosInstance.patch(`/partidos/${partido._id}/estado`, {
          estado: nuevoEstado,
          motivo: motivo || undefined
        });
        
        Swal.fire({
          icon: 'success',
          title: 'Estado actualizado',
          text: `El partido ahora está "${nuevoEstado}"`,
          timer: 2500,
          showConfirmButton: false,
          background: '#1a1a2e',
          color: 'white',
          iconColor: config.color
        });
        
        // Recargar datos del partido
        await obtenerPartido();
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.mensaje || 'No se pudo actualizar el estado',
        background: '#1a1a2e',
        color: 'white'
      });
    } finally {
      setActualizandoEstado(false);
    }
  };

  // Obtener acciones disponibles según el estado del partido
  const getAccionesDisponibles = () => {
    if (!puedeGestionarPartidos) return [];

    switch (partido?.estado) {
      case 'programado':
        return [
          { action: 'en_curso', label: 'Iniciar Partido', icon: <PlayArrowIcon />, color: '#4caf50', gradient: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)' },
          { action: 'suspendido', label: 'Suspender', icon: <StopIcon />, color: '#f44336', gradient: 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)' },
          { action: 'cancelado', label: 'Cancelar', icon: <CancelIcon />, color: '#9e9e9e', gradient: 'linear-gradient(135deg, #9e9e9e 0%, #bdbdbd 100%)' }
        ];
      case 'en_curso':
        return [
          { action: 'medio_tiempo', label: 'Medio Tiempo', icon: <PauseIcon />, color: '#ff9800', gradient: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)' },
          { action: 'finalizado', label: 'Finalizar', icon: <CheckCircleIcon />, color: '#9c27b0', gradient: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)' },
          { action: 'suspendido', label: 'Suspender', icon: <StopIcon />, color: '#f44336', gradient: 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)' }
        ];
      case 'medio_tiempo':
        return [
          { action: 'en_curso', label: 'Reanudar', icon: <PlayArrowIcon />, color: '#4caf50', gradient: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)' },
          { action: 'finalizado', label: 'Finalizar', icon: <CheckCircleIcon />, color: '#9c27b0', gradient: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)' },
          { action: 'suspendido', label: 'Suspender', icon: <StopIcon />, color: '#f44336', gradient: 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)' }
        ];
      case 'suspendido':
        return [
          { action: 'programado', label: 'Reprogramar', icon: <ScheduleIcon />, color: '#2196f3', gradient: 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)' },
          { action: 'en_curso', label: 'Reanudar', icon: <PlayArrowIcon />, color: '#4caf50', gradient: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)' },
          { action: 'cancelado', label: 'Cancelar', icon: <CancelIcon />, color: '#9e9e9e', gradient: 'linear-gradient(135deg, #9e9e9e 0%, #bdbdbd 100%)' }
        ];
      default:
        return [];
    }
  };

  const accionesDisponibles = getAccionesDisponibles();

  useEffect(() => {
    obtenerPartido();
  }, [id]);

  // Configuración de tabs modernos
  const tabs = [
    { label: 'Info', icon: <InfoIcon />, index: 0, color: '#64b5f6' },
    { label: 'Registro', icon: <TimelineIcon />, index: 1, color: '#4caf50', requierePartidoEnCurso: true },
    { label: 'Stats', icon: <AssessmentIcon />, index: 2, color: '#ff9800' },
    { label: 'Árbitros', icon: <GavelIcon />, index: 3, color: '#9c27b0' },
    { label: 'Jugadas', icon: <SportsIcon />, index: 4, color: '#f44336' },
    { label: 'Líderes', icon: <Fire />, index: 5, color: '#ff5722' }
  ];

  if (loading) {
   return (
     <Box sx={{ 
       display: 'flex', 
       justifyContent: 'center', 
       alignItems: 'center',
       minHeight: '100vh',
       flexDirection: 'column',
       gap: 3
     }}>
       <motion.div
         animate={{ rotate: 360 }}
         transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
       >
         <SportsFootballIcon sx={{ fontSize: 60, color: '#64b5f6' }} />
       </motion.div>
       <Typography sx={{ color: 'white', fontSize: '1.2rem' }}>
         Cargando información del partido...
       </Typography>
     </Box>
   );
 }

 if (error) {
   return (
     <Box sx={{ 
       maxWidth: '600px', 
       mx: 'auto', 
       py: 8, 
       px: 2,
       display: 'flex',
       flexDirection: 'column',
       alignItems: 'center'
     }}>
       <motion.div
         initial={{ opacity: 0, scale: 0.9 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ duration: 0.5 }}
         style={{ width: '100%' }}
       >
         <Alert 
           severity="error" 
           sx={{ 
             mb: 3,
             borderRadius: '16px',
             backgroundColor: 'rgba(244, 67, 54, 0.1)',
             border: '1px solid rgba(244, 67, 54, 0.3)'
           }}
         >
           {error}
         </Alert>
         <Button
           variant="contained"
           onClick={obtenerPartido}
           startIcon={<SportsFootballIcon />}
           fullWidth
           sx={{
             borderRadius: '12px',
             py: 1.5,
             fontSize: '1.1rem',
             background: 'linear-gradient(135deg, #64b5f6 0%, #42a5f5 100%)'
           }}
         >
           Reintentar
         </Button>
       </motion.div>
     </Box>
   );
 }

 if (!partido) {
   return (
     <Box sx={{ 
       maxWidth: '600px', 
       mx: 'auto', 
       py: 8, 
       textAlign: 'center',
       px: 2
     }}>
       <Typography variant="h5" color="white" sx={{ mb: 2 }}>
         No se encontró información del partido
       </Typography>
       <Button
         variant="outlined"
         onClick={() => navigate('/partidos')}
         sx={{ color: '#64b5f6', borderColor: '#64b5f6' }}
       >
         Volver a Partidos
       </Button>
     </Box>
   );
 }

 return (
   <Box sx={{ 
     minHeight: '100vh',
     background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
     py: { xs: 2, md: 4 },
     px: { xs: 1, md: 2 },
     width: '100%',
     overflow: 'hidden'
   }}>
     {/* 🔥 CONTENEDOR PRINCIPAL CENTRADO CON FLEXBOX */}
     <Box sx={{
       display: 'flex',
       flexDirection: 'column',
       alignItems: 'center',
       width: '100%',
       maxWidth: '1400px',
       mx: 'auto'
     }}>
       <motion.div
         initial={{ opacity: 0, y: 30 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.8 }}
         style={{ width: '100%' }}
       >
         {/* Header de navegación */}
         <NavigationHeader 
           partidoId={partido._id}
           navigate={navigate}
           puedeGestionarPartidos={puedeGestionarPartidos}
           onEdit={() => navigate(`/partidos/${partido._id}/editar`)}
         />

         {/* Información principal del partido */}
         <PartidoMainInfo partido={partido} />

         {/* Información adicional */}
         <InfoAdicional partido={partido} />

         {/* 🔥 BOTONES DE GESTIÓN PARA DESKTOP */}
         {!isMobile && accionesDisponibles.length > 0 && (
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6, delay: 0.8 }}
             style={{ width: '100%' }}
           >
             <Card sx={{
               background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 100%)',
               backdropFilter: 'blur(20px)',
               border: '1px solid rgba(255, 255, 255, 0.1)',
               borderRadius: '20px',
               p: 3,
               mb: 4,
               width: '100%'
             }}>
               <Box sx={{
                 display: 'flex',
                 flexDirection: 'column',
                 alignItems: 'center',
                 gap: 3
               }}>
                 <Typography 
                   variant="h6" 
                   sx={{ 
                     color: 'white',
                     fontWeight: 700,
                     display: 'flex',
                     alignItems: 'center',
                     gap: 1
                   }}
                 >
                   <GavelIcon sx={{ color: '#64b5f6' }} />
                   Gestión del Partido
                 </Typography>

                 <Box sx={{
                   display: 'flex',
                   flexWrap: 'wrap',
                   justifyContent: 'center',
                   gap: 2,
                   width: '100%'
                 }}>
                   {accionesDisponibles.map((accion, index) => (
                     <motion.div
                       key={accion.action}
                       whileHover={{ scale: 1.05 }}
                       whileTap={{ scale: 0.95 }}
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: index * 0.1 }}
                     >
                       <Button
                         variant="contained"
                         startIcon={actualizandoEstado ? <CircularProgress size={20} color="inherit" /> : accion.icon}
                         onClick={() => cambiarEstadoPartido(accion.action)}
                         disabled={actualizandoEstado}
                         sx={{
                           background: accion.gradient,
                           color: 'white',
                           borderRadius: '12px',
                           px: 4,
                           py: 1.5,
                           fontWeight: 600,
                           textTransform: 'none',
                           fontSize: '1rem',
                           minWidth: '140px',
                           boxShadow: `0 4px 15px ${accion.color}30`,
                           '&:hover': {
                             background: accion.gradient,
                             transform: 'translateY(-2px)',
                             boxShadow: `0 6px 20px ${accion.color}40`,
                           },
                           '&:disabled': {
                             background: 'rgba(255, 255, 255, 0.1)',
                             color: 'rgba(255, 255, 255, 0.5)',
                             transform: 'none',
                             boxShadow: 'none'
                           }
                         }}
                       >
                         {accion.label}
                       </Button>
                     </motion.div>
                   ))}
                 </Box>

                 {/* Información adicional */}
                 <Box sx={{
                   display: 'flex',
                   alignItems: 'center',
                   gap: 1,
                   opacity: 0.7
                 }}>
                   <InfoIcon sx={{ fontSize: 16, color: '#64b5f6' }} />
                   <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                     Estado actual: <strong style={{ color: 'white' }}>{partido?.estado?.toUpperCase()}</strong>
                   </Typography>
                 </Box>
               </Box>
             </Card>
           </motion.div>
         )}

         {/* 🔥 TABS CONTAINER CON FLEXBOX COMPLETO */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6, delay: 0.6 }}
           style={{ width: '100%' }}
         >
           <Card sx={{
             background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
             backdropFilter: 'blur(20px)',
             border: '1px solid rgba(255, 255, 255, 0.2)',
             borderRadius: '24px',
             overflow: 'hidden',
             boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
             width: '100%'
           }}>
             {/* Tabs Header */}
             <Box sx={{ 
               borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
               background: 'rgba(0, 0, 0, 0.2)',
               width: '100%'
             }}>
               <Tabs 
                 value={tabActual} 
                 onChange={(e, newValue) => setTabActual(newValue)}
                 variant="fullWidth"
                 sx={{
                   width: '100%',
                   '& .MuiTabs-indicator': {
                     background: 'linear-gradient(90deg, #64b5f6 0%, #42a5f5 100%)',
                     height: 3,
                     borderRadius: '2px'
                   },
                   '& .MuiTabs-flexContainer': {
                     display: 'flex',
                     width: '100%'
                   },
                   '& .MuiTab-root': {
                     color: 'rgba(255, 255, 255, 0.6)',
                     fontSize: { xs: '0.75rem', md: '0.9rem' },
                     fontWeight: 600,
                     py: { xs: 2, md: 2.5 },
                     px: { xs: 1, md: 2 },
                     textTransform: 'none',
                     transition: 'all 0.3s ease',
                     flex: 1,
                     '&.Mui-selected': {
                       color: 'white',
                       background: 'linear-gradient(135deg, rgba(100, 181, 246, 0.2) 0%, rgba(100, 181, 246, 0.1) 100%)',
                       borderRadius: '12px 12px 0 0'
                     },
                     '&:hover': {
                       color: 'white',
                       background: 'rgba(255, 255, 255, 0.05)'
                     }
                   },
                   '& .MuiTab-iconWrapper': {
                     marginBottom: { xs: 0.5, md: 0 },
                     marginRight: { xs: 0, md: 1 }
                   }
                 }}
               >
                 {tabs.map((tab) => {
                   const disabled = tab.requierePartidoEnCurso && 
                     !['en_curso', 'medio_tiempo'].includes(partido.estado);
                   
                   return (
                     <Tab
                       key={tab.index}
                       icon={isMobile ? tab.icon : undefined}
                       label={isMobile ? undefined : tab.label}
                       iconPosition={isMobile ? "top" : "start"}
                       disabled={disabled}
                       sx={{
                         opacity: disabled ? 0.4 : 1,
                         '& .MuiTab-iconWrapper': {
                           color: tab.color,
                           marginBottom: { xs: 0.5, md: 0 },
                           marginRight: { xs: 0, md: 1 }
                         }
                       }}
                     />
                   );
                 })}
               </Tabs>
             </Box>

             {/* 🔥 CONTENIDO DE TABS CON WRAPPER CONTROLADO */}
             <Box sx={{ 
               width: '100%',
               overflow: 'hidden',
               minHeight: '400px'
             }}>
               {/* Tab 0: Información general */}
               {tabActual === 0 && (
                 <TabPanel value={tabActual} index={0} key="tab-info">
                   <Box sx={{ 
                     px: { xs: 2, md: 4 },
                     width: '100%',
                     display: 'flex',
                     flexDirection: { xs: 'column', md: 'row' },
                     gap: 3,
                     justifyContent: 'center'
                   }}>
                     <Box sx={{ flex: 1, width: '100%' }}>
                       <EquipoInfo 
                         equipo={partido.equipoLocal} 
                         esLocal={true}
                         marcador={partido.marcador?.local}
                         variant="detallado"
                       />
                     </Box>
                     <Box sx={{ flex: 1, width: '100%' }}>
                       <EquipoInfo 
                         equipo={partido.equipoVisitante} 
                         esLocal={false}
                         marcador={partido.marcador?.visitante}
                         variant="detallado"
                       />
                     </Box>
                   </Box>
                 </TabPanel>
               )}

               {/* Tab 1: Registro de jugadas */}
               {tabActual === 1 && (
                 <TabPanel value={tabActual} index={1} key="tab-registro">
                   <Box sx={{ 
                     px: { xs: 2, md: 4 },
                     width: '100%'
                   }}>
                     <RegistroJugadas 
                       partido={partido} 
                       onActualizar={obtenerPartido}
                     />
                   </Box>
                 </TabPanel>
               )}

               {/* Tab 2: Estadísticas */}
               {tabActual === 2 && (
                 <TabPanel value={tabActual} index={2} key="tab-stats">
                   <Box sx={{ 
                     px: { xs: 1, md: 2 },
                     width: '100%',
                     maxWidth: '100%',
                     overflow: 'hidden'
                   }}>
                     <Box sx={{
                       width: '100%',
                       maxWidth: '100%',
                       overflow: 'auto',
                       boxSizing: 'border-box',
                       '& > *': {
                         maxWidth: '100% !important',
                         overflow: 'hidden !important',
                         boxSizing: 'border-box !important'
                       },
                       '& .MuiGrid-container': {
                         maxWidth: '100% !important',
                         overflow: 'hidden !important'
                       },
                       '& .MuiGrid-item': {
                         maxWidth: '100% !important',
                         overflow: 'hidden !important'
                       },
                       '& .MuiCard-root': {
                         maxWidth: '100% !important',
                         overflow: 'hidden !important'
                       },
                       '& .MuiBox-root': {
                         maxWidth: '100% !important',
                         overflow: 'hidden !important'
                       },
                       '&::-webkit-scrollbar': {
                         width: '8px',
                         height: '8px'
                       },
                       '&::-webkit-scrollbar-track': {
                         backgroundColor: 'rgba(255, 255, 255, 0.1)',
                         borderRadius: '4px'
                       },
                       '&::-webkit-scrollbar-thumb': {
                         backgroundColor: 'rgba(255, 152, 0, 0.6)',
                         borderRadius: '4px',
                         '&:hover': {
                           backgroundColor: 'rgba(255, 152, 0, 0.8)'
                         }
                       },
                       '&::-webkit-scrollbar-corner': {
                         backgroundColor: 'rgba(255, 255, 255, 0.1)'
                       }
                     }}>
                       <Box sx={{ 
                         minWidth: 0,
                         width: '100%',
                         maxWidth: '100%',
                         overflow: 'hidden'
                       }}>
                         <EstadisticasPanel partido={partido} />
                       </Box>
                     </Box>
                   </Box>
                 </TabPanel>
               )}

               {/* Tab 3: Árbitros */}
               {tabActual === 3 && (
                 <TabPanel value={tabActual} index={3} key="tab-arbitros">
                   <Box sx={{ 
                     px: { xs: 2, md: 4 },
                     width: '100%'
                   }}>
                     <ArbitrosPanel partido={partido} />
                   </Box>
                 </TabPanel>
               )}

               {/* Tab 4: Jugadas registradas */}
               {tabActual === 4 && (
                 <TabPanel value={tabActual} index={4} key="tab-jugadas">
                   <Box sx={{ 
                     px: { xs: 2, md: 4 },
                     width: '100%',
                     overflow: 'hidden'
                   }}>
                     <Box sx={{
                       width: '100%',
                       maxWidth: '100%',
                       overflow: 'auto',
                       '& > *': {
                         maxWidth: '100% !important'
                       },
                       '&::-webkit-scrollbar': {
                         width: '8px'
                       },
                       '&::-webkit-scrollbar-track': {
                         backgroundColor: 'rgba(255, 255, 255, 0.1)',
                         borderRadius: '4px'
                       },
                       '&::-webkit-scrollbar-thumb': {
                         backgroundColor: 'rgba(244, 67, 54, 0.6)',
                         borderRadius: '4px',
                         '&:hover': {
                           backgroundColor: 'rgba(244, 67, 54, 0.8)'
                         }
                       }
                     }}>
                       <JugadasPanel partido={partido} />
                     </Box>
                   </Box>
                 </TabPanel>
               )}

               {/* Tab 5: Líderes del partido */}
               {tabActual === 5 && (
                 <TabPanel value={tabActual} index={5} key="tab-lideres">
                   <Box sx={{ 
                     px: { xs: 1, md: 2 },
                     width: '100%',
                     maxWidth: '100%',
                     overflow: 'hidden'
                   }}>
                     {partido && (partido.estado === 'finalizado' || partido.jugadas?.length > 0) ? (
                       <Box sx={{
                         width: '100%',
                         maxWidth: '100%',
                         overflow: 'auto',
                         boxSizing: 'border-box',
                         '& *': {
                           maxWidth: '100% !important',
                           overflow: 'hidden !important',
                           boxSizing: 'border-box !important'
                         },
                         '& .MuiGrid-container': {
                           maxWidth: '100% !important',
                           width: '100% !important',
                           margin: '0 !important',
                           overflow: 'hidden !important'
                         },
                         '& .MuiGrid-item': {
                           maxWidth: '100% !important',
                           paddingLeft: '8px !important',
                           paddingRight: '8px !important',
                           overflow: 'hidden !important'
                         },
                         '& .MuiCard-root': {
                           maxWidth: '100% !important',
                           overflow: 'hidden !important',
                           wordBreak: 'break-word !important'
                         },
                         '& .MuiBox-root': {
                           maxWidth: '100% !important',
                           overflow: 'hidden !important'
                         },
                         '& .MuiTypography-root': {
                           maxWidth: '100% !important',
                           overflow: 'hidden !important',
                           textOverflow: 'ellipsis !important',
                           whiteSpace: 'nowrap !important'
                         },
                         '& .MuiAvatar-root': {
                           flexShrink: '0 !important'
                         },
                         '& > div': {
                           display: 'flex !important',
                           flexDirection: 'column !important',
                           maxWidth: '100% !important',
                           overflow: 'hidden !important'
                         },
                         '& .MuiGrid-container > .MuiGrid-item': {
                           flexBasis: {
                             xs: '100% !important',
                             sm: '50% !important', 
                             md: '33.333% !important',
                             lg: '25% !important'
                           },
                           maxWidth: {
                             xs: '100% !important',
                             sm: '50% !important',
                             md: '33.333% !important', 
                             lg: '25% !important'
                           },
                           width: {
                             xs: '100% !important',
                             sm: '50% !important',
                             md: '33.333% !important',
                             lg: '25% !important'
                           }
                         },
                         '&::-webkit-scrollbar': {
                           width: '8px',
                           height: '8px'
                         },
                         '&::-webkit-scrollbar-track': {
                           backgroundColor: 'rgba(255, 255, 255, 0.1)',
                           borderRadius: '4px'
                         },
                         '&::-webkit-scrollbar-thumb': {
                           backgroundColor: 'rgba(255, 87, 34, 0.6)',
                           borderRadius: '4px',
                           '&:hover': {
                             backgroundColor: 'rgba(255, 87, 34, 0.8)'
                           }
                         },
                         '&::-webkit-scrollbar-corner': {
                           backgroundColor: 'rgba(255, 255, 255, 0.1)'
                         }
                       }}>
                         <Box sx={{ 
                           minWidth: 0,
                           width: '100%',
                           maxWidth: '100%',
                           overflow: 'hidden',
                           display: 'flex',
                           flexDirection: 'column'
                         }}>
                           <LideresPartido partidoId={partido._id} />
                         </Box>
                       </Box>
                     ) : (
                       <Box sx={{ 
                         textAlign: 'center', 
                         py: 8,
                         color: 'rgba(255, 255, 255, 0.6)',
                         display: 'flex',
                         flexDirection: 'column',
                         alignItems: 'center',
                         justifyContent: 'center'
                       }}>
                         <Fire sx={{ fontSize: 60, mb: 2, opacity: 0.3 }} />
                         <Typography variant="h6" sx={{ mb: 1 }}>
                           Sin datos de líderes
                         </Typography>
                         <Typography variant="body2">
                           Los líderes se mostrarán cuando el partido esté finalizado o tenga jugadas registradas
                         </Typography>
                       </Box>
                     )}
                   </Box>
                 </TabPanel>
               )}
             </Box>
           </Card>
         </motion.div>

         {/* 🔥 BOTONES FLOTANTES PARA MÓVIL */}
         {isMobile && accionesDisponibles.length > 0 && (
           <motion.div
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 0.5, delay: 1 }}
             style={{
               position: 'fixed',
               bottom: 20,
               right: 20,
               zIndex: 1000
             }}
           >
             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
               {accionesDisponibles.slice(0, 3).map((accion, index) => (
                 <motion.div 
                   key={accion.action}
                   whileHover={{ scale: 1.1 }} 
                   whileTap={{ scale: 0.9 }}
                   initial={{ opacity: 0, x: 50 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: index * 0.1 }}
                 >
                   <Tooltip title={`${accion.label} - Estado: ${partido?.estado}`} placement="left">
                     <IconButton
                       onClick={() => cambiarEstadoPartido(accion.action)}
                       disabled={actualizandoEstado}
                       sx={{
                         background: accion.gradient,
                         color: 'white',
                         width: 56,
                         height: 56,
                         boxShadow: `0 8px 25px ${accion.color}40`,
                         '&:hover': {
                           background: accion.gradient,
                           transform: 'translateY(-2px)',
                           boxShadow: `0 12px 35px ${accion.color}60`,
                         },
                         '&:disabled': {
                           background: 'rgba(255, 255, 255, 0.2)',
                           color: 'rgba(255, 255, 255, 0.5)'
                         }
                       }}
                     >
                       {actualizandoEstado ? <CircularProgress size={24} color="inherit" /> : accion.icon}
                     </IconButton>
                   </Tooltip>
                 </motion.div>
               ))}
             </Box>
           </motion.div>
         )}
       </motion.div>
     </Box>
   </Box>
 );
};