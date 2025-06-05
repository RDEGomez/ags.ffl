import { 
  Box, 
  Typography, 
  Paper, 
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  LinearProgress
} from '@mui/material';
import {
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  Timer as TimerIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon,
  CloudQueue as CloudIcon,
  Thermostat as ThermostatIcon,
  Category as CategoryIcon,
  EmojiEvents as TournamentIcon,
  Person as PersonIcon,
  Update as UpdateIcon,
  Visibility as VisibilityIcon,
  AccessTime as AccessTimeIcon,
  Place as PlaceIcon,
  SportsSoccer as SportsSoccerIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { getCategoryName } from '../../helpers/mappings';
import { useImage } from '../../hooks/useImage';

const DetallesPanel = ({ partido }) => {
  if (!partido) return null;

  // 🔥 Formatear fecha y hora
  const formatearFechaHora = (fechaHora) => {
    if (!fechaHora) return 'No especificada';
    
    const fecha = new Date(fechaHora);
    const fechaStr = fecha.toLocaleDateString('es-MX', { 
      weekday: 'long',
      day: '2-digit', 
      month: 'long',
      year: 'numeric'
    });
    const horaStr = fecha.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return `${fechaStr} a las ${horaStr}`;
  };

  // 🔥 Formatear duración
  const formatearDuracion = (minutos) => {
    if (!minutos) return 'No especificada';
    
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    
    if (horas > 0) {
      return `${horas}h ${mins}m`;
    }
    return `${mins} minutos`;
  };

  // 🔥 Formatear fecha de actualización
  const formatearFechaActualizacion = (fecha) => {
    if (!fecha) return 'No disponible';
    
    const fechaObj = new Date(fecha);
    const ahora = new Date();
    const diffMs = ahora - fechaObj;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Hace unos momentos';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    
    return fechaObj.toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: 'short',
      year: 'numeric'
    });
  };

  // 🔥 Obtener estado con color
  const getEstadoInfo = (estado) => {
    const estados = {
      'programado': { color: '#2196f3', label: 'Programado', bgColor: 'rgba(33, 150, 243, 0.1)' },
      'en_curso': { color: '#4caf50', label: 'En Curso', bgColor: 'rgba(76, 175, 80, 0.1)' },
      'medio_tiempo': { color: '#ff9800', label: 'Medio Tiempo', bgColor: 'rgba(255, 152, 0, 0.1)' },
      'finalizado': { color: '#9e9e9e', label: 'Finalizado', bgColor: 'rgba(158, 158, 158, 0.1)' },
      'suspendido': { color: '#f44336', label: 'Suspendido', bgColor: 'rgba(244, 67, 54, 0.1)' },
      'cancelado': { color: '#f44336', label: 'Cancelado', bgColor: 'rgba(244, 67, 54, 0.1)' }
    };
    
    return estados[estado] || { color: '#9e9e9e', label: 'Desconocido', bgColor: 'rgba(158, 158, 158, 0.1)' };
  };

  // 🔥 Obtener progreso del partido
  const getProgresoPartido = () => {
    const estado = partido.estado;
    const duracionTotal = partido.duracionMinutos || 50;
    const tiempoActual = partido.tiempoJuego?.tiempoActual || 0;
    
    switch (estado) {
      case 'programado':
        return { progreso: 0, label: 'No iniciado' };
      case 'en_curso':
        const porcentaje = Math.min((tiempoActual / (duracionTotal * 60)) * 100, 100);
        return { progreso: porcentaje, label: `${Math.floor(tiempoActual / 60)}:${(tiempoActual % 60).toString().padStart(2, '0')} / ${duracionTotal}min` };
      case 'medio_tiempo':
        return { progreso: 50, label: 'Medio tiempo' };
      case 'finalizado':
        return { progreso: 100, label: 'Completado' };
      case 'suspendido':
        return { progreso: Math.min((tiempoActual / (duracionTotal * 60)) * 100, 100), label: 'Suspendido' };
      case 'cancelado':
        return { progreso: 0, label: 'Cancelado' };
      default:
        return { progreso: 0, label: 'Desconocido' };
    }
  };

  const estadoInfo = getEstadoInfo(partido.estado);
  const progresoInfo = getProgresoPartido();
  const creadoPorImageUrl = useImage(partido.creadoPor?.imagen, '');

  // 🔥 Componente para información básica
  const InformacionBasica = () => (
    <Paper
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
        p: 3
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        mb: 3,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        pb: 2
      }}>
        <InfoIcon sx={{ color: '#64b5f6' }} />
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
          Información General
        </Typography>
      </Box>

      <List sx={{ p: 0 }}>
        {/* Estado del partido */}
        <ListItem sx={{ px: 0, py: 1 }}>
          <ListItemIcon>
            <VisibilityIcon sx={{ color: estadoInfo.color }} />
          </ListItemIcon>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Estado:
                </Typography>
                <Chip
                  label={estadoInfo.label}
                  size="small"
                  sx={{
                    backgroundColor: estadoInfo.bgColor,
                    color: estadoInfo.color,
                    border: `1px solid ${estadoInfo.color}40`,
                    fontWeight: 'bold'
                  }}
                />
              </Box>
            }
          />
        </ListItem>

        {/* Torneo y categoría */}
        <ListItem sx={{ px: 0, py: 1 }}>
          <ListItemIcon>
            <TournamentIcon sx={{ color: '#9c27b0' }} />
          </ListItemIcon>
          <ListItemText
            primary={
              <Box>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Torneo:
                </Typography>
                <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {partido.torneo?.nombre || 'No especificado'}
                </Typography>
              </Box>
            }
          />
        </ListItem>

        <ListItem sx={{ px: 0, py: 1 }}>
          <ListItemIcon>
            <CategoryIcon sx={{ color: '#4caf50' }} />
          </ListItemIcon>
          <ListItemText
            primary={
              <Box>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Categoría:
                </Typography>
                <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {getCategoryName(partido.categoria)}
                </Typography>
              </Box>
            }
          />
        </ListItem>

        {/* Fecha y hora */}
        <ListItem sx={{ px: 0, py: 1 }}>
          <ListItemIcon>
            <CalendarIcon sx={{ color: '#ff9800' }} />
          </ListItemIcon>
          <ListItemText
            primary={
              <Box>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Fecha y Hora:
                </Typography>
                <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {formatearFechaHora(partido.fechaHora)}
                </Typography>
              </Box>
            }
          />
        </ListItem>

        {/* Duración */}
        <ListItem sx={{ px: 0, py: 1 }}>
          <ListItemIcon>
            <TimerIcon sx={{ color: '#64b5f6' }} />
          </ListItemIcon>
          <ListItemText
            primary={
              <Box>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Duración:
                </Typography>
                <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {formatearDuracion(partido.duracionMinutos)}
                </Typography>
              </Box>
            }
          />
        </ListItem>
      </List>
    </Paper>
  );

  // 🔥 Componente para progreso del partido
  const ProgresoPartido = () => (
    <Paper
      sx={{
        backgroundColor: estadoInfo.bgColor,
        border: `1px solid ${estadoInfo.color}40`,
        borderRadius: 2,
        p: 3
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        mb: 3,
        borderBottom: `1px solid ${estadoInfo.color}40`,
        pb: 2
      }}>
        <AccessTimeIcon sx={{ color: estadoInfo.color }} />
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
          Progreso del Partido
        </Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ color: 'white' }}>
            {progresoInfo.label}
          </Typography>
          <Typography variant="body2" sx={{ color: estadoInfo.color, fontWeight: 'bold' }}>
            {Math.round(progresoInfo.progreso)}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progresoInfo.progreso}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              backgroundColor: estadoInfo.color
            }
          }}
        />
      </Box>

      {/* Información del tiempo de juego */}
      {partido.tiempoJuego && (
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" sx={{ color: estadoInfo.color, fontWeight: 'bold' }}>
                {partido.tiempoJuego.periodo || 1}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Período
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" sx={{ color: estadoInfo.color, fontWeight: 'bold' }}>
                {partido.tiempoJuego.tiemposOut?.local || 3}/{partido.tiempoJuego.tiemposOut?.visitante || 3}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Time Outs
              </Typography>
            </Box>
          </Grid>
        </Grid>
      )}
    </Paper>
  );

  // 🔥 Componente para información de sede
  const InformacionSede = () => {
    if (!partido.sede || (!partido.sede.nombre && !partido.sede.direccion)) {
      return (
        <Paper
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '2px dashed rgba(255, 255, 255, 0.2)',
            borderRadius: 2,
            p: 3,
            textAlign: 'center'
          }}
        >
          <PlaceIcon sx={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.3)', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 1 }}>
            Sede No Especificada
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.3)' }}>
            La información de la sede se agregará más adelante
          </Typography>
        </Paper>
      );
    }

    return (
      <Paper
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 2,
          p: 3
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          mb: 3,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          pb: 2
        }}>
          <LocationIcon sx={{ color: '#64b5f6' }} />
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
            Ubicación
          </Typography>
        </Box>

        <List sx={{ p: 0 }}>
          {partido.sede.nombre && (
            <ListItem sx={{ px: 0, py: 1 }}>
              <ListItemIcon>
                <PlaceIcon sx={{ color: '#4caf50' }} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box>
                    <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Sede:
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {partido.sede.nombre}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          )}

          {partido.sede.direccion && (
            <ListItem sx={{ px: 0, py: 1 }}>
              <ListItemIcon>
                <LocationIcon sx={{ color: '#ff9800' }} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box>
                    <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Dirección:
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {partido.sede.direccion}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          )}
        </List>
      </Paper>
    );
  };

  // 🔥 Componente para información climática
  const InformacionClimatica = () => {
    if (!partido.clima || (!partido.clima.temperatura && !partido.clima.condiciones)) {
      return null;
    }

    return (
      <Paper
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 2,
          p: 3
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          mb: 3,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          pb: 2
        }}>
          <CloudIcon sx={{ color: '#64b5f6' }} />
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
            Condiciones Climáticas
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {partido.clima.temperatura && (
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center' }}>
                <ThermostatIcon sx={{ fontSize: 32, color: '#ff9800', mb: 1 }} />
                <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                  {partido.clima.temperatura}°C
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Temperatura
                </Typography>
              </Box>
            </Grid>
          )}

          {partido.clima.condiciones && (
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center' }}>
                <CloudIcon sx={{ fontSize: 32, color: '#64b5f6', mb: 1 }} />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                  {partido.clima.condiciones.charAt(0).toUpperCase() + partido.clima.condiciones.slice(1)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Condiciones
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>
    );
  };

  // 🔥 Componente para metadatos
  const Metadatos = () => (
    <Paper
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
        p: 3
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        mb: 3,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        pb: 2
      }}>
        <AssessmentIcon sx={{ color: '#64b5f6' }} />
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
          Información Administrativa
        </Typography>
      </Box>

      <List sx={{ p: 0 }}>
        {/* Creado por */}
        <ListItem sx={{ px: 0, py: 1 }}>
          <ListItemIcon>
            <Avatar
              src={creadoPorImageUrl}
              sx={{ width: 24, height: 24 }}
            >
              <PersonIcon />
            </Avatar>
          </ListItemIcon>
          <ListItemText
            primary={
              <Box>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Creado por:
                </Typography>
                <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {partido.creadoPor?.nombre || 'Usuario desconocido'}
                </Typography>
              </Box>
            }
          />
        </ListItem>

        {/* Fecha de creación */}
        <ListItem sx={{ px: 0, py: 1 }}>
          <ListItemIcon>
            <CalendarIcon sx={{ color: '#4caf50' }} />
          </ListItemIcon>
          <ListItemText
            primary={
              <Box>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Creado:
                </Typography>
                <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {formatearFechaActualizacion(partido.createdAt)}
                </Typography>
              </Box>
            }
          />
        </ListItem>

        {/* Última actualización */}
        <ListItem sx={{ px: 0, py: 1 }}>
          <ListItemIcon>
            <UpdateIcon sx={{ color: '#ff9800' }} />
          </ListItemIcon>
          <ListItemText
            primary={
              <Box>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Última actualización:
                </Typography>
                <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {formatearFechaActualizacion(partido.ultimaActualizacion?.fecha || partido.updatedAt)}
                </Typography>
                {partido.ultimaActualizacion?.por && (
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block' }}>
                    por {partido.ultimaActualizacion.por.nombre || 'Usuario desconocido'}
                  </Typography>
                )}
              </Box>
            }
          />
        </ListItem>
      </List>
    </Paper>
  );

  // 🔥 Componente para observaciones
  const Observaciones = () => {
    if (!partido.observaciones) return null;

    return (
      <Paper
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 2,
          p: 3
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          mb: 3,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          pb: 2
        }}>
          <DescriptionIcon sx={{ color: '#64b5f6' }} />
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
            Observaciones
          </Typography>
        </Box>

        <Typography 
          variant="body1" 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: 1.6,
            fontStyle: 'italic',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 2,
            p: 2,
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          "{partido.observaciones}"
        </Typography>
      </Paper>
    );
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ color: 'white', mb: 3, textAlign: 'center' }}>
        Detalles del Partido
      </Typography>

      <Grid container spacing={3}>
        {/* Información básica */}
        <Grid item xs={12} md={6}>
          <InformacionBasica />
        </Grid>

        {/* Progreso del partido */}
        <Grid item xs={12} md={6}>
          <ProgresoPartido />
        </Grid>

        {/* Información de sede */}
        <Grid item xs={12} md={6}>
          <InformacionSede />
        </Grid>

        {/* Información climática */}
        {partido.clima && (partido.clima.temperatura || partido.clima.condiciones) && (
          <Grid item xs={12} md={6}>
            <InformacionClimatica />
          </Grid>
        )}

        {/* Metadatos */}
        <Grid item xs={12} md={6}>
          <Metadatos />
        </Grid>

        {/* Observaciones */}
        {partido.observaciones && (
          <Grid item xs={12} md={6}>
            <Observaciones />
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default DetallesPanel;