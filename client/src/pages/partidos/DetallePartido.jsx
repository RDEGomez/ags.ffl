import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import axiosInstance from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Button,
  Chip,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material';

import {
  NavigateNext as NavigateNextIcon,
  SportsFootball as SportsFootballIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Gavel as GavelIcon,
  Assessment as AssessmentIcon,
  Info as InfoIcon,
  Timeline as TimelineIcon,
  Sports as SportsIcon
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
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`partido-tabpanel-${index}`}
    aria-labelledby={`partido-tab-${index}`}
    {...other}
  >
    {value === index && (
      <Box sx={{ py: 3 }}>
        {children}
      </Box>
    )}
  </div>
);

export const DetallePartido = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { puedeGestionarTorneos, usuario } = useAuth();

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
      setError('No se pudo cargar la información del partido');
      
      if (error.response?.status === 404) {
        Swal.fire({
          icon: 'error',
          title: 'Partido no encontrado',
          text: 'El partido que buscas no existe o ha sido eliminado'
        }).then(() => {
          navigate('/partidos');
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      obtenerPartido();
    }
  }, [id]);

  // Cambiar estado del partido
  const cambiarEstadoPartido = async (nuevoEstado) => {
    if (!puedeGestionarTorneos()) {
      Swal.fire({
        icon: 'error',
        title: 'Sin permisos',
        text: 'No tienes permisos para cambiar el estado del partido'
      });
      return;
    }

    try {
      const { value: motivo } = await Swal.fire({
        title: `¿Cambiar estado a "${nuevoEstado}"?`,
        input: 'textarea',
        inputLabel: 'Motivo del cambio (opcional)',
        inputPlaceholder: 'Describe el motivo del cambio de estado...',
        showCancelButton: true,
        confirmButtonText: 'Cambiar Estado',
        cancelButtonText: 'Cancelar'
      });

      if (motivo !== undefined) {
        setActualizandoEstado(true);
        
        await axiosInstance.patch(`/partidos/${id}/estado`, {
          estado: nuevoEstado,
          motivo: motivo || undefined
        });

        await obtenerPartido(); // Refrescar datos
        
        Swal.fire({
          icon: 'success',
          title: 'Estado actualizado',
          text: `El partido ahora está "${nuevoEstado}"`,
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.mensaje || 'No se pudo cambiar el estado del partido'
      });
    } finally {
      setActualizandoEstado(false);
    }
  };

  // Obtener acciones rápidas según el estado
  const getAccionesRapidas = () => {
    if (!puedeGestionarTorneos() && usuario?.rol !== 'arbitro') return [];

    const acciones = [];
    
    switch (partido?.estado) {
      case 'programado':
        acciones.push({
          label: 'Iniciar Partido',
          color: 'success',
          icon: <PlayArrowIcon />,
          action: () => cambiarEstadoPartido('en_curso')
        });
        break;
      
      case 'en_curso':
        acciones.push({
          label: 'Medio Tiempo',
          color: 'warning',
          icon: <StopIcon />,
          action: () => cambiarEstadoPartido('medio_tiempo')
        });
        acciones.push({
          label: 'Finalizar',
          color: 'info',
          icon: <StopIcon />,
          action: () => cambiarEstadoPartido('finalizado')
        });
        break;
      
      case 'medio_tiempo':
        acciones.push({
          label: 'Reanudar',
          color: 'success',
          icon: <PlayArrowIcon />,
          action: () => cambiarEstadoPartido('en_curso')
        });
        acciones.push({
          label: 'Finalizar',
          color: 'info',
          icon: <StopIcon />,
          action: () => cambiarEstadoPartido('finalizado')
        });
        break;
    }

    return acciones;
  };

  // Configuración de tabs
  const tabs = [
    { label: 'Información', icon: <InfoIcon />, index: 0 },
    { label: 'Registro Jugadas', icon: <TimelineIcon />, index: 1, requierePartidoEnCurso: true },
    { label: 'Estadísticas', icon: <AssessmentIcon />, index: 2 },
    { label: 'Árbitros', icon: <GavelIcon />, index: 3 },
    { label: 'Jugadas', icon: <SportsIcon />, index: 4 },
    { label: 'Detalles', icon: <InfoIcon />, index: 5 }
  ];

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <CircularProgress size={60} />
        <Typography sx={{ ml: 2, color: 'white' }}>
          Cargando información del partido...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={obtenerPartido}
          startIcon={<SportsFootballIcon />}
        >
          Reintentar
        </Button>
      </Box>
    );
  }

  if (!partido) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="white">
          No se encontró información del partido
        </Typography>
        <Button
          component={Link}
          to="/partidos"
          variant="outlined"
          sx={{ mt: 2 }}
          startIcon={<ArrowBackIcon />}
        >
          Volver a Partidos
        </Button>
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Breadcrumbs */}
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{ mb: 3, color: 'rgba(255,255,255,0.7)' }}
        >
          <Typography 
            component={Link}
            to="/partidos"
            sx={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', cursor: 'pointer' }}
          >
            Partidos
          </Typography>
          <Typography color="primary">
            {partido.equipoLocal?.nombre} vs {partido.equipoVisitante?.nombre}
          </Typography>
        </Breadcrumbs>

        {/* Header del partido */}
        <Card sx={{
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          mb: 3
        }}>
          <CardContent sx={{ p: 4 }}>
            {/* Título y acciones */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              mb: 3,
              flexWrap: 'wrap',
              gap: 2
            }}>
              <Box>
                <Typography variant="h4" sx={{ 
                  color: 'white', 
                  fontWeight: 'bold',
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}>
                  <SportsFootballIcon sx={{ color: '#64b5f6' }} />
                  Partido #{partido._id}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <EstadoPartido estado={partido.estado} variant="compacto" />
                  
                  {partido.torneo && (
                    <Chip
                      label={partido.torneo.nombre}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  )}
                  
                  {partido.categoria && (
                    <Chip
                      label={partido.categoria.toUpperCase()}
                      color="secondary"
                      variant="outlined"
                      size="small"
                    />
                  )}
                </Box>
              </Box>

              {/* Botones de acción */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Tooltip title="Volver a lista">
                  <IconButton
                    component={Link}
                    to="/partidos"
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)'
                      }
                    }}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                </Tooltip>

                {puedeGestionarTorneos() && (
                  <Tooltip title="Editar partido">
                    <IconButton
                      component={Link}
                      to={`/partidos/editar/${id}`}
                      sx={{
                        backgroundColor: 'rgba(33, 150, 243, 0.1)',
                        color: '#2196f3',
                        '&:hover': {
                          backgroundColor: 'rgba(33, 150, 243, 0.2)'
                        }
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                )}

                {/* Acciones rápidas de estado */}
                {getAccionesRapidas().map((accion, index) => (
                  <Button
                    key={index}
                    variant="contained"
                    color={accion.color}
                    startIcon={accion.icon}
                    onClick={accion.action}
                    disabled={actualizandoEstado}
                    sx={{ minWidth: 120 }}
                  >
                    {actualizandoEstado ? <CircularProgress size={16} /> : accion.label}
                  </Button>
                ))}
              </Box>
            </Box>

            {/* Información del enfrentamiento */}
            <Grid container spacing={3} alignItems="center">
              {/* Equipo Local */}
              <Grid item xs={12} md={4}>
                <EquipoInfo 
                  equipo={partido.equipoLocal} 
                  esLocal={true}
                  marcador={partido.marcador?.local}
                  variant="horizontal"
                />
              </Grid>

              {/* VS y marcador */}
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ 
                    color: '#64b5f6', 
                    fontWeight: 'bold',
                    mb: 1
                  }}>
                    VS
                  </Typography>
                  
                  {partido.fechaHora && (
                    <Box>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {new Date(partido.fechaHora).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long'
                        })}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {new Date(partido.fechaHora).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>

              {/* Equipo Visitante */}
              <Grid item xs={12} md={4}>
                <EquipoInfo 
                  equipo={partido.equipoVisitante} 
                  esLocal={false}
                  marcador={partido.marcador?.visitante}
                  variant="horizontal"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabs de navegación */}
        <Card sx={{
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Box sx={{ borderBottom: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <Tabs 
              value={tabActual} 
              onChange={(e, newValue) => setTabActual(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-selected': {
                    color: '#64b5f6'
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#64b5f6'
                }
              }}
            >
              {tabs.map((tab) => {
                // Deshabilitar tab de registro si el partido no está en curso
                const disabled = tab.requierePartidoEnCurso && 
                  !['en_curso', 'medio_tiempo'].includes(partido.estado);
                
                return (
                  <Tab
                    key={tab.index}
                    icon={tab.icon}
                    label={tab.label}
                    iconPosition="start"
                    disabled={disabled}
                    sx={{
                      minHeight: 64,
                      opacity: disabled ? 0.5 : 1
                    }}
                  />
                );
              })}
            </Tabs>
          </Box>

          {/* Contenido de las tabs */}
          <CardContent sx={{ p: 0 }}>
            {/* Tab 0: Información general */}
            <TabPanel value={tabActual} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <EquipoInfo 
                    equipo={partido.equipoLocal} 
                    esLocal={true}
                    marcador={partido.marcador?.local}
                    variant="detallado"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <EquipoInfo 
                    equipo={partido.equipoVisitante} 
                    esLocal={false}
                    marcador={partido.marcador?.visitante}
                    variant="detallado"
                  />
                </Grid>
              </Grid>
            </TabPanel>

            {/* Tab 1: Registro de jugadas */}
            <TabPanel value={tabActual} index={1}>
              <RegistroJugadas 
                partido={partido} 
                onActualizar={obtenerPartido}
              />
            </TabPanel>

            {/* Tab 2: Estadísticas */}
            <TabPanel value={tabActual} index={2}>
              <EstadisticasPanel partido={partido} />
            </TabPanel>

            {/* Tab 3: Árbitros */}
            <TabPanel value={tabActual} index={3}>
              <ArbitrosPanel partido={partido} />
            </TabPanel>

            {/* Tab 4: Jugadas registradas */}
            <TabPanel value={tabActual} index={4}>
              <JugadasPanel partido={partido} />
            </TabPanel>

            {/* Tab 5: Detalles */}
            <TabPanel value={tabActual} index={5}>
              <DetallesPanel partido={partido} />
            </TabPanel>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
};