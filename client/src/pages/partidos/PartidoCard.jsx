import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Card,
  CardContent,
  Typography,
  CardActions,
  IconButton,
  Box,
  Collapse,
  Divider,
  Grid,
  Avatar,
  Chip,
  Button,
  Badge,
  Tooltip
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PlayArrow as PlayArrowIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pause as PauseIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Timer as TimerIcon,
  Sports as SportsIcon,
  Group as GroupIcon,
  Gavel as GavelIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { getCategoryName } from '../../helpers/mappings'
import { useImage } from '../../hooks/useImage'
import { useAuth } from '../../context/AuthContext'

// 🔥 Componente para el estado del partido con animaciones
const EstadoPartido = ({ estado }) => {
  const getEstadoConfig = (estado) => {
    switch(estado) {
      case 'programado':
        return { 
          color: '#2196f3', 
          icon: <ScheduleIcon />, 
          label: 'Programado',
          bgColor: 'rgba(33, 150, 243, 0.1)',
          borderColor: 'rgba(33, 150, 243, 0.3)'
        };
      case 'en_curso':
        return { 
          color: '#4caf50', 
          icon: <PlayArrowIcon />, 
          label: 'En Curso',
          bgColor: 'rgba(76, 175, 80, 0.1)',
          borderColor: 'rgba(76, 175, 80, 0.3)',
          pulso: true
        };
      case 'medio_tiempo':
        return { 
          color: '#ff9800', 
          icon: <PauseIcon />, 
          label: 'Medio Tiempo',
          bgColor: 'rgba(255, 152, 0, 0.1)',
          borderColor: 'rgba(255, 152, 0, 0.3)'
        };
      case 'finalizado':
        return { 
          color: '#9e9e9e', 
          icon: <CheckCircleIcon />, 
          label: 'Finalizado',
          bgColor: 'rgba(158, 158, 158, 0.1)',
          borderColor: 'rgba(158, 158, 158, 0.3)'
        };
      case 'suspendido':
        return { 
          color: '#f44336', 
          icon: <PauseIcon />, 
          label: 'Suspendido',
          bgColor: 'rgba(244, 67, 54, 0.1)',
          borderColor: 'rgba(244, 67, 54, 0.3)'
        };
      case 'cancelado':
        return { 
          color: '#f44336', 
          icon: <CancelIcon />, 
          label: 'Cancelado',
          bgColor: 'rgba(244, 67, 54, 0.1)',
          borderColor: 'rgba(244, 67, 54, 0.3)'
        };
      default:
        return { 
          color: '#9e9e9e', 
          icon: <ScheduleIcon />, 
          label: 'Desconocido',
          bgColor: 'rgba(158, 158, 158, 0.1)',
          borderColor: 'rgba(158, 158, 158, 0.3)'
        };
    }
  };

  const config = getEstadoConfig(estado);

  return (
    <motion.div
      animate={config.pulso ? { scale: [1, 1.05, 1] } : {}}
      transition={config.pulso ? { duration: 2, repeat: Infinity } : {}}
    >
      <Chip
        icon={config.icon}
        label={config.label}
        size="small"
        sx={{
          backgroundColor: config.bgColor,
          color: config.color,
          border: `1px solid ${config.borderColor}`,
          fontWeight: 'bold',
          '& .MuiChip-icon': {
            color: config.color
          }
        }}
      />
    </motion.div>
  );
};

// 🔥 Componente para mostrar el marcador
const MarcadorPartido = ({ marcador, estado }) => {
  if (!marcador || (marcador.local === 0 && marcador.visitante === 0 && estado === 'programado')) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 2,
        px: 2,
        py: 0.5
      }}>
        <SportsIcon sx={{ fontSize: 16, color: '#64b5f6' }} />
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Sin iniciar
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1,
      backgroundColor: 'rgba(100, 181, 246, 0.1)',
      borderRadius: 2,
      px: 2,
      py: 0.5,
      border: '1px solid rgba(100, 181, 246, 0.2)'
    }}>
      <SportsIcon sx={{ fontSize: 16, color: '#64b5f6' }} />
      <Typography 
        variant="h6" 
        sx={{ 
          color: '#64b5f6', 
          fontWeight: 'bold',
          fontSize: '1.1rem'
        }}
      >
        {marcador.local} - {marcador.visitante}
      </Typography>
    </Box>
  );
};

// 🔥 Componente para mostrar información del equipo
const EquipoInfo = ({ equipo, esLocal }) => {
  const equipoImageUrl = useImage(equipo?.imagen, '');
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      flex: 1
    }}>
      <Avatar
        src={equipoImageUrl}
        alt={`Logo de ${equipo?.nombre}`}
        sx={{ 
          width: 50, 
          height: 50,
          border: '3px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          mb: 1
        }}
      >
        <GroupIcon sx={{ fontSize: 30 }} />
      </Avatar>
      
      <Typography 
        variant="body1" 
        sx={{ 
          color: 'white', 
          fontWeight: 'bold',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          width: '100%',
          maxWidth: '120px'
        }}
      >
        {equipo?.nombre || 'Equipo'}
      </Typography>
      
      <Typography 
        variant="caption" 
        sx={{ 
          color: 'rgba(255, 255, 255, 0.6)',
          fontStyle: 'italic'
        }}
      >
        {esLocal ? 'Local' : 'Visitante'}
      </Typography>
    </Box>
  );
};

// 🔥 Componente para mostrar fecha y hora
const FechaHoraPartido = ({ fechaHora }) => {
  if (!fechaHora) return null;

  const fecha = new Date(fechaHora);
  const fechaStr = fecha.toLocaleDateString('es-MX', { 
    day: '2-digit', 
    month: 'short',
    year: 'numeric'
  });
  const horaStr = fecha.toLocaleTimeString('es-MX', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 2,
      px: 2,
      py: 1
    }}>
      <CalendarIcon sx={{ fontSize: 16, color: '#64b5f6' }} />
      <Box>
        <Typography variant="caption" sx={{ color: 'white', display: 'block' }}>
          {fechaStr}
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          {horaStr}
        </Typography>
      </Box>
    </Box>
  );
};

// 🔥 Componente para información del torneo
const TorneoInfo = ({ torneo, categoria }) => (
  <Box sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: 1,
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
    borderRadius: 2,
    px: 2,
    py: 0.5,
    border: '1px solid rgba(156, 39, 176, 0.2)'
  }}>
    <SportsIcon sx={{ fontSize: 16, color: '#9c27b0' }} />
    <Box>
      <Typography variant="caption" sx={{ color: 'white', display: 'block', fontWeight: 'bold' }}>
        {torneo?.nombre || 'Torneo'}
      </Typography>
      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
        {getCategoryName(categoria)}
      </Typography>
    </Box>
  </Box>
);

// 🔥 Componente para mostrar árbitros
const ArbitrosInfo = ({ arbitros }) => {
  if (!arbitros || (!arbitros.principal && !arbitros.backeador && !arbitros.estadistico)) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 2,
        px: 2,
        py: 1
      }}>
        <GavelIcon sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.5)' }} />
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          Sin árbitros asignados
        </Typography>
      </Box>
    );
  }

  const arbitrosCount = [arbitros.principal, arbitros.backeador, arbitros.estadistico].filter(Boolean).length;

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1,
      backgroundColor: 'rgba(255, 193, 7, 0.1)',
      borderRadius: 2,
      px: 2,
      py: 1,
      border: '1px solid rgba(255, 193, 7, 0.2)'
    }}>
      <GavelIcon sx={{ fontSize: 16, color: '#ffc107' }} />
      <Typography variant="caption" sx={{ color: '#ffc107', fontWeight: 'bold' }}>
        {arbitrosCount} árbitro{arbitrosCount !== 1 ? 's' : ''}
      </Typography>
    </Box>
  );
};

// 🔥 Componente principal de la tarjeta
export const PartidoCard = ({ partido, eliminarPartido }) => {
  const [expanded, setExpanded] = useState(false)
  
  // 🔥 AGREGADO: Importar funciones de validación por ID
  const { puedeGestionarTorneos } = useAuth();
  
  const { 
    _id, 
    equipoLocal, 
    equipoVisitante, 
    torneo, 
    categoria, 
    fechaHora, 
    estado, 
    marcador, 
    arbitros,
    sede
  } = partido

  const handleExpandClick = () => {
    setExpanded(!expanded)
  }

  // 🔥 NUEVO: Validar permisos específicos para este partido
  const puedeEditarEstePartido = puedeGestionarTorneos();
  const puedeEliminarEstePartido = puedeGestionarTorneos() && estado === 'programado';

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      style={{ height: '100%' }}
    >
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(100, 181, 246, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }
        }}
      >
        {/* Header con estado del partido */}
        <Box sx={{ 
          position: 'relative',
          background: 'linear-gradient(135deg, rgba(100, 181, 246, 0.1) 0%, rgba(100, 181, 246, 0.05) 100%)',
          p: 2
        }}>
          {/* Estado del partido */}
          <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
            <EstadoPartido estado={estado} />
          </Box>

          {/* Información del torneo */}
          <TorneoInfo torneo={torneo} categoria={categoria} />
        </Box>

        {/* Equipos y marcador */}
        <CardContent sx={{ flex: 1, p: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2
          }}>
            {/* Equipo Local */}
            <EquipoInfo equipo={equipoLocal} esLocal={true} />
            
            {/* VS y Marcador */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontWeight: 'bold'
                }}
              >
                VS
              </Typography>
              <MarcadorPartido marcador={marcador} estado={estado} />
            </Box>
            
            {/* Equipo Visitante */}
            <EquipoInfo equipo={equipoVisitante} esLocal={false} />
          </Box>

          {/* Información adicional compacta */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 1
          }}>
            <FechaHoraPartido fechaHora={fechaHora} />
            
            {sede && sede.nombre && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 2,
                px: 2,
                py: 0.5
              }}>
                <LocationIcon sx={{ fontSize: 16, color: '#64b5f6' }} />
                <Typography variant="caption" sx={{ color: 'white' }}>
                  {sede.nombre}
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>

        {/* Acciones principales */}
        <CardActions sx={{ 
          justifyContent: 'center', 
          gap: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {/* Botón de ver detalle */}
          <Tooltip title="Ver detalle">
            <IconButton
              component={Link}
              to={`/partidos/${_id}`}
              sx={{
                backgroundColor: 'rgba(100, 181, 246, 0.1)',
                color: '#64b5f6',
                '&:hover': {
                  backgroundColor: 'rgba(100, 181, 246, 0.2)',
                  transform: 'scale(1.1)'
                }
              }}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>

          {/* 🔥 CORREGIDO: Solo mostrar botón de editar si tiene permisos */}
          {puedeEditarEstePartido && (
            <Tooltip title="Editar partido">
              <IconButton
                component={Link}
                to={`/partidos/editar/${_id}`}
                sx={{
                  backgroundColor: 'rgba(33, 150, 243, 0.1)',
                  color: '#2196f3',
                  '&:hover': {
                    backgroundColor: 'rgba(33, 150, 243, 0.2)',
                    transform: 'scale(1.1)'
                  }
                }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
          
          {/* 🔥 CORREGIDO: Solo mostrar botón de eliminar si tiene permisos */}
          {puedeEliminarEstePartido && (
            <Tooltip title="Eliminar partido (solo programados)">
              <IconButton 
                onClick={() => eliminarPartido(_id)}
                sx={{
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                  color: '#f44336',
                  '&:hover': {
                    backgroundColor: 'rgba(244, 67, 54, 0.2)',
                    transform: 'scale(1.1)'
                  }
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </CardActions>

        {/* Botón para expandir información adicional */}
        <Button
          onClick={handleExpandClick}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: 1.5,
            px: 2,
            color: 'white',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GavelIcon sx={{ fontSize: 18 }} />
            <Typography variant="button">
              {expanded ? 'Ocultar detalles' : 'Ver detalles'}
            </Typography>
          </Box>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Button>

        {/* Collapse con información detallada */}
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <CardContent sx={{ p: 2 }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  color: 'white', 
                  fontWeight: 'bold', 
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <GavelIcon sx={{ fontSize: 18, color: '#64b5f6' }} />
                Información Detallada
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <ArbitrosInfo arbitros={arbitros} />
                </Grid>
                
                {sede && sede.direccion && (
                  <Grid item xs={12}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 2,
                      px: 2,
                      py: 1
                    }}>
                      <LocationIcon sx={{ fontSize: 16, color: '#64b5f6' }} />
                      <Typography variant="caption" sx={{ color: 'white' }}>
                        {sede.direccion}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 2,
                    px: 2,
                    py: 1
                  }}>
                    <TimerIcon sx={{ fontSize: 16, color: '#64b5f6' }} />
                    <Typography variant="caption" sx={{ color: 'white' }}>
                      Duración: {partido.duracionMinutos || 50} minutos
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Box>
        </Collapse>
      </Card>
    </motion.div>
  )
}