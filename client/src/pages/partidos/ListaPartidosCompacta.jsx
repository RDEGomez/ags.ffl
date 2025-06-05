import { useState } from 'react'
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Collapse,
  Divider,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tooltip,
  Badge
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Schedule as ScheduleIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  LocationOn as LocationIcon,
  Gavel as GavelIcon,
  Timer as TimerIcon,
  Group as GroupIcon,
  SportsFootball as SportsFootballIcon
} from '@mui/icons-material'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getCategoryName } from '../../helpers/mappings'
import { useImage } from '../../hooks/useImage'
import { useAuth } from '../../context/AuthContext'

// 🔥 Componente para el estado del partido
const EstadoPartidoChip = ({ estado }) => {
  const getEstadoConfig = (estado) => {
    switch(estado) {
      case 'programado':
        return { 
          color: '#2196f3', 
          icon: <ScheduleIcon sx={{ fontSize: 16 }} />, 
          label: 'Programado',
          bgColor: 'rgba(33, 150, 243, 0.1)',
          borderColor: 'rgba(33, 150, 243, 0.3)'
        };
      case 'en_curso':
        return { 
          color: '#4caf50', 
          icon: <PlayArrowIcon sx={{ fontSize: 16 }} />, 
          label: 'En Curso',
          bgColor: 'rgba(76, 175, 80, 0.1)',
          borderColor: 'rgba(76, 175, 80, 0.3)',
          pulso: true
        };
      case 'medio_tiempo':
        return { 
          color: '#ff9800', 
          icon: <PauseIcon sx={{ fontSize: 16 }} />, 
          label: 'Medio Tiempo',
          bgColor: 'rgba(255, 152, 0, 0.1)',
          borderColor: 'rgba(255, 152, 0, 0.3)'
        };
      case 'finalizado':
        return { 
          color: '#9e9e9e', 
          icon: <CheckCircleIcon sx={{ fontSize: 16 }} />, 
          label: 'Finalizado',
          bgColor: 'rgba(158, 158, 158, 0.1)',
          borderColor: 'rgba(158, 158, 158, 0.3)'
        };
      case 'suspendido':
        return { 
          color: '#f44336', 
          icon: <PauseIcon sx={{ fontSize: 16 }} />, 
          label: 'Suspendido',
          bgColor: 'rgba(244, 67, 54, 0.1)',
          borderColor: 'rgba(244, 67, 54, 0.3)'
        };
      case 'cancelado':
        return { 
          color: '#f44336', 
          icon: <CancelIcon sx={{ fontSize: 16 }} />, 
          label: 'Cancelado',
          bgColor: 'rgba(244, 67, 54, 0.1)',
          borderColor: 'rgba(244, 67, 54, 0.3)'
        };
      default:
        return { 
          color: '#9e9e9e', 
          icon: <ScheduleIcon sx={{ fontSize: 16 }} />, 
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
          fontSize: '0.7rem',
          height: '24px',
          '& .MuiChip-icon': {
            color: config.color
          }
        }}
      />
    </motion.div>
  );
};

// 🔥 Componente para mostrar el enfrentamiento
const EnfrentamientoPartido = ({ equipoLocal, equipoVisitante, marcador }) => {
  const equipoLocalImageUrl = useImage(equipoLocal?.imagen, '');
  const equipoVisitanteImageUrl = useImage(equipoVisitante?.imagen, '');

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 2,
      p: 1.5,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      minWidth: 200
    }}>
      {/* Equipo Local */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
        <Avatar
          src={equipoLocalImageUrl}
          sx={{ width: 24, height: 24 }}
        >
          <GroupIcon sx={{ fontSize: 14 }} />
        </Avatar>
        <Typography 
          variant="caption" 
          sx={{ 
            color: 'white', 
            fontWeight: 'bold',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {equipoLocal?.nombre || 'Equipo'}
        </Typography>
      </Box>

      {/* Marcador o VS */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: 0.5,
        px: 1
      }}>
        {marcador && (marcador.local !== 0 || marcador.visitante !== 0) ? (
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#64b5f6', 
              fontWeight: 'bold',
              fontSize: '0.8rem'
            }}
          >
            {marcador.local} - {marcador.visitante}
          </Typography>
        ) : (
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: 'bold'
            }}
          >
            VS
          </Typography>
        )}
      </Box>

      {/* Equipo Visitante */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0, justifyContent: 'flex-end' }}>
        <Typography 
          variant="caption" 
          sx={{ 
            color: 'white', 
            fontWeight: 'bold',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {equipoVisitante?.nombre || 'Equipo'}
        </Typography>
        <Avatar
          src={equipoVisitanteImageUrl}
          sx={{ width: 24, height: 24 }}
        >
          <GroupIcon sx={{ fontSize: 14 }} />
        </Avatar>
      </Box>
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
      backgroundColor: 'rgba(100, 181, 246, 0.1)',
      borderRadius: 1,
      px: 1.5,
      py: 0.5,
      border: '1px solid rgba(100, 181, 246, 0.2)'
    }}>
      <ScheduleIcon sx={{ fontSize: 14, color: '#64b5f6' }} />
      <Box>
        <Typography variant="caption" sx={{ color: 'white', display: 'block', fontWeight: 'bold' }}>
          {fechaStr}
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          {horaStr}
        </Typography>
      </Box>
    </Box>
  );
};

// 🔥 Componente para mostrar información del torneo
const TorneoInfo = ({ torneo, categoria }) => (
  <Box sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: 1,
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
    borderRadius: 1,
    px: 1.5,
    py: 0.5,
    border: '1px solid rgba(156, 39, 176, 0.2)'
  }}>
    <SportsFootballIcon sx={{ fontSize: 14, color: '#9c27b0' }} />
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

// 🔥 Componente para información detallada del partido
const DetallesPartido = ({ partido }) => {
  return (
    <Grid container spacing={2}>
      {/* Información de la sede */}
      {partido.sede && (partido.sede.nombre || partido.sede.direccion) && (
        <Grid item xs={12} md={6}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 2,
            p: 2
          }}>
            <LocationIcon sx={{ fontSize: 16, color: '#64b5f6' }} />
            <Box>
              {partido.sede.nombre && (
                <Typography variant="caption" sx={{ color: 'white', display: 'block', fontWeight: 'bold' }}>
                  {partido.sede.nombre}
                </Typography>
              )}
              {partido.sede.direccion && (
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {partido.sede.direccion}
                </Typography>
              )}
            </Box>
          </Box>
        </Grid>
      )}

      {/* Duración del partido */}
      <Grid item xs={12} md={6}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 2,
          p: 2
        }}>
          <TimerIcon sx={{ fontSize: 16, color: '#64b5f6' }} />
          <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
            Duración: {partido.duracionMinutos || 50} minutos
          </Typography>
        </Box>
      </Grid>

      {/* Árbitros */}
      {partido.arbitros && (partido.arbitros.principal || partido.arbitros.backeador || partido.arbitros.estadistico) && (
        <Grid item xs={12}>
          <Box sx={{ 
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            borderRadius: 2,
            p: 2,
            border: '1px solid rgba(255, 193, 7, 0.2)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <GavelIcon sx={{ fontSize: 16, color: '#ffc107' }} />
              <Typography variant="caption" sx={{ color: '#ffc107', fontWeight: 'bold' }}>
                Árbitros Asignados
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {partido.arbitros.principal && (
                <Chip
                  label={`Principal: ${partido.arbitros.principal.usuario?.nombre || 'No asignado'}`}
                  size="small"
                  sx={{ backgroundColor: 'rgba(255, 193, 7, 0.2)', color: '#ffc107' }}
                />
              )}
              {partido.arbitros.backeador && (
                <Chip
                  label={`Back Judge: ${partido.arbitros.backeador.usuario?.nombre || 'No asignado'}`}
                  size="small"
                  sx={{ backgroundColor: 'rgba(255, 193, 7, 0.2)', color: '#ffc107' }}
                />
              )}
              {partido.arbitros.estadistico && (
                <Chip
                  label={`Estadístico: ${partido.arbitros.estadistico.usuario?.nombre || 'No asignado'}`}
                  size="small"
                  sx={{ backgroundColor: 'rgba(255, 193, 7, 0.2)', color: '#ffc107' }}
                />
              )}
            </Box>
          </Box>
        </Grid>
      )}

      {/* Observaciones */}
      {partido.observaciones && (
        <Grid item xs={12}>
          <Box sx={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 2,
            p: 2,
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold', display: 'block', mb: 1 }}>
              Observaciones:
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {partido.observaciones}
            </Typography>
          </Box>
        </Grid>
      )}
    </Grid>
  );
};

// 🔥 Componente principal para cada partido - CON OVERLAY RESPONSIVO
const PartidoItem = ({ partido, index, onEliminar }) => {
  const [expandedPartidoId, setExpandedPartidoId] = useState(null);
  const [showActionOverlay, setShowActionOverlay] = useState(false);
  
  const { 
    _id, 
    equipoLocal, 
    equipoVisitante, 
    torneo, 
    categoria, 
    fechaHora, 
    estado, 
    marcador 
  } = partido;

  const { puedeGestionarTorneos } = useAuth();

  const toggleExpand = (id) => {
    setExpandedPartidoId(prev => prev === id ? null : id);
  };

  const toggleActionOverlay = () => {
    setShowActionOverlay(prev => !prev);
  };

  // Validar permisos específicos para este partido
  const puedeEditarEstePartido = puedeGestionarTorneos();
  const puedeEliminarEstePartido = puedeGestionarTorneos() && estado === 'programado';

  const isExpanded = expandedPartidoId === _id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
    >
      <Box
        sx={{
          position: 'relative',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 2,
          mb: 1,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(100, 181, 246, 0.3)',
            transform: 'translateX(5px)'
          }
        }}
      >
        <ListItem
          onClick={toggleActionOverlay}
          sx={{
            py: 2,
            px: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: { xs: 'pointer', md: 'default' },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            {/* Avatar del partido */}
            <ListItemAvatar>
              <Avatar 
                sx={{ 
                  width: 48, 
                  height: 48,
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(100, 181, 246, 0.1)'
                }}
              >
                <SportsFootballIcon sx={{ color: '#64b5f6' }} />
              </Avatar>
            </ListItemAvatar>

            {/* Información del partido */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* LÍNEA 1: Enfrentamiento */}
              <Box sx={{ mb: 1 }}>
                <EnfrentamientoPartido 
                  equipoLocal={equipoLocal} 
                  equipoVisitante={equipoVisitante} 
                  marcador={marcador}
                />
              </Box>
              
              {/* LÍNEA 2: Torneo y categoría */}
              <Box sx={{ mb: 1 }}>
                <TorneoInfo torneo={torneo} categoria={categoria} />
              </Box>

              {/* LÍNEA 3: Estado + Fecha */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                flexWrap: 'wrap'
              }}>
                <EstadoPartidoChip estado={estado} />
                <FechaHoraPartido fechaHora={fechaHora} />
              </Box>
            </Box>
          </Box>

          {/* BOTONES DESKTOP - Solo visibles en pantallas grandes */}
          <Box sx={{ 
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center', 
            gap: 1 
          }}>
            <Tooltip title={isExpanded ? "Ocultar detalles" : "Ver detalles"}>
              <IconButton 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(_id);
                }}
                sx={{
                  backgroundColor: 'rgba(100, 181, 246, 0.1)',
                  color: '#64b5f6',
                  '&:hover': {
                    backgroundColor: 'rgba(100, 181, 246, 0.2)',
                    transform: 'scale(1.1)'
                  }
                }}
              >
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Ver detalle completo">
              <IconButton 
                component={Link} 
                to={`/partidos/${_id}`} 
                onClick={(e) => e.stopPropagation()}
                sx={{
                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                  color: '#4caf50',
                  '&:hover': {
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    transform: 'scale(1.1)'
                  }
                }}
              >
                <VisibilityIcon />
              </IconButton>
            </Tooltip>
            
            {puedeEditarEstePartido && (
              <Tooltip title="Editar partido">
                <IconButton 
                  component={Link} 
                  to={`/partidos/editar/${_id}`} 
                  onClick={(e) => e.stopPropagation()}
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
            
            {puedeEliminarEstePartido && (
              <Tooltip title="Eliminar partido (solo programados)">
                <IconButton 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEliminar(_id);
                  }} 
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
          </Box>
        </ListItem>

        {/* OVERLAY DE ACCIONES MÓVIL */}
        <AnimatePresence>
          {showActionOverlay && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Box
                sx={{
                  display: { xs: 'flex', md: 'none' },
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: isExpanded ? 'auto' : 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 3,
                  zIndex: 10,
                  minHeight: '80px'
                }}
              >
                {/* Botón de cerrar */}
                <IconButton
                  onClick={toggleActionOverlay}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    width: 32,
                    height: 32,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)'
                    }
                  }}
                >
                  ×
                </IconButton>

                {/* Botones de acción en overlay */}
                <Tooltip title={isExpanded ? "Ocultar detalles" : "Ver detalles"}>
                  <IconButton 
                    onClick={() => {
                      toggleExpand(_id);
                      setShowActionOverlay(false);
                    }}
                    sx={{
                      backgroundColor: 'rgba(100, 181, 246, 0.2)',
                      color: '#64b5f6',
                      width: 48,
                      height: 48,
                      '&:hover': {
                        backgroundColor: 'rgba(100, 181, 246, 0.3)',
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Tooltip>

                <Tooltip title="Ver detalle completo">
                  <IconButton 
                    component={Link} 
                    to={`/partidos/${_id}`} 
                    sx={{
                      backgroundColor: 'rgba(76, 175, 80, 0.2)',
                      color: '#4caf50',
                      width: 48,
                      height: 48,
                      '&:hover': {
                        backgroundColor: 'rgba(76, 175, 80, 0.3)',
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
                
                {puedeEditarEstePartido && (
                  <Tooltip title="Editar partido">
                    <IconButton 
                      component={Link} 
                      to={`/partidos/editar/${_id}`} 
                      sx={{
                        backgroundColor: 'rgba(33, 150, 243, 0.2)',
                        color: '#2196f3',
                        width: 48,
                        height: 48,
                        '&:hover': {
                          backgroundColor: 'rgba(33, 150, 243, 0.3)',
                          transform: 'scale(1.1)'
                        }
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                )}
                
                {puedeEliminarEstePartido && (
                  <Tooltip title="Eliminar partido">
                    <IconButton 
                      onClick={() => {
                        onEliminar(_id);
                        setShowActionOverlay(false);
                      }} 
                      sx={{
                        backgroundColor: 'rgba(244, 67, 54, 0.2)',
                        color: '#f44336',
                        width: 48,
                        height: 48,
                        '&:hover': {
                          backgroundColor: 'rgba(244, 67, 54, 0.3)',
                          transform: 'scale(1.1)'
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapse con detalles */}
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            p: 3
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1, 
              mb: 2,
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              pb: 1
            }}>
              <SportsFootballIcon sx={{ color: '#64b5f6', fontSize: 20 }} />
              <Typography 
                variant="subtitle2" 
                fontWeight="bold" 
                sx={{ color: 'white' }}
              >
                Detalles del Partido
              </Typography>
            </Box>

            <DetallesPartido partido={partido} />
          </Box>
        </Collapse>
      </Box>
    </motion.div>
  );
};

export const ListaPartidosCompacta = ({ partidos, eliminarPartido }) => {
  return (
    <List sx={{ p: 0 }}>
      <AnimatePresence>
        {partidos.map((partido, index) => (
          <PartidoItem
            key={partido._id}
            partido={partido}
            index={index}
            onEliminar={eliminarPartido}
          />
        ))}
      </AnimatePresence>
    </List>
  )
}