import { 
  Box, 
  Typography, 
  Paper, 
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  Avatar,
  Badge
} from '@mui/material';
import {
  SportsFootball as SportsFootballIcon,
  TouchApp as TouchAppIcon,
  Block as BlockIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Timer as TimerIcon,
  Person as PersonIcon
} from '@mui/icons-material';

// Componente Timeline personalizado simple
const TimelineContainer = ({ children }) => (
  <Box sx={{ position: 'relative', pl: 4 }}>
    {/* Línea vertical */}
    <Box
      sx={{
        position: 'absolute',
        left: 16,
        top: 0,
        bottom: 0,
        width: 2,
        backgroundColor: 'rgba(100, 181, 246, 0.3)',
        borderRadius: 1
      }}
    />
    {children}
  </Box>
);

const TimelineItem = ({ children, isLast = false }) => (
  <Box sx={{ position: 'relative', pb: isLast ? 0 : 3 }}>
    {/* Punto en la línea */}
    <Box
      sx={{
        position: 'absolute',
        left: -24,
        top: 8,
        width: 12,
        height: 12,
        borderRadius: '50%',
        backgroundColor: '#64b5f6',
        border: '2px solid rgba(0, 0, 0, 0.8)',
        zIndex: 1
      }}
    />
    {children}
  </Box>
);

const JugadasPanel = ({ partido }) => {
  const jugadas = partido?.jugadas || [];

  // Helper para obtener icono según tipo de jugada
  const getJugadaIcon = (tipo) => {
    switch(tipo) {
      case 'touchdown':
        return <TouchAppIcon sx={{ color: '#4caf50' }} />;
      case 'pase_completo':
      case 'pase_incompleto':
        return <SportsFootballIcon sx={{ color: '#2196f3' }} />;
      case 'intercepcion':
        return <SecurityIcon sx={{ color: '#f44336' }} />;
      case 'corrida':
        return <SpeedIcon sx={{ color: '#ff9800' }} />;
      case 'sack':
        return <BlockIcon sx={{ color: '#9c27b0' }} />;
      case 'conversion_1pt':
      case 'conversion_2pt':
        return <TouchAppIcon sx={{ color: '#00bcd4' }} />;
      case 'safety':
        return <SecurityIcon sx={{ color: '#795548' }} />;
      default:
        return <SportsFootballIcon sx={{ color: '#9e9e9e' }} />;
    }
  };

  // Helper para obtener color según tipo de jugada
  const getJugadaColor = (tipo) => {
    switch(tipo) {
      case 'touchdown':
        return '#4caf50';
      case 'pase_completo':
        return '#2196f3';
      case 'pase_incompleto':
        return '#ff9800';
      case 'intercepcion':
        return '#f44336';
      case 'corrida':
        return '#ff9800';
      case 'sack':
        return '#9c27b0';
      case 'conversion_1pt':
      case 'conversion_2pt':
        return '#00bcd4';
      case 'safety':
        return '#795548';
      default:
        return '#9e9e9e';
    }
  };

  // Helper para obtener etiqueta legible
  const getJugadaLabel = (tipo) => {
    switch(tipo) {
      case 'touchdown':
        return 'Touchdown';
      case 'pase_completo':
        return 'Pase Completo';
      case 'pase_incompleto':
        return 'Pase Incompleto';
      case 'intercepcion':
        return 'Intercepción';
      case 'corrida':
        return 'Corrida';
      case 'sack':
        return 'Sack';
      case 'conversion_1pt':
        return 'Conversión 1pt';
      case 'conversion_2pt':
        return 'Conversión 2pts';
      case 'safety':
        return 'Safety';
      case 'tackleo':
        return 'Tackleo';
      default:
        return tipo.replace('_', ' ').toUpperCase();
    }
  };

  // Obtener nombre del equipo
  const getNombreEquipo = (equipoId) => {
    if (equipoId === partido?.equipoLocal?._id) {
      return partido.equipoLocal.nombre;
    } else if (equipoId === partido?.equipoVisitante?._id) {
      return partido.equipoVisitante.nombre;
    }
    return 'Equipo';
  };

  // Obtener color del equipo
  const getColorEquipo = (equipoId) => {
    if (equipoId === partido?.equipoLocal?._id) {
      return '#2196f3';
    } else if (equipoId === partido?.equipoVisitante?._id) {
      return '#9c27b0';
    }
    return '#9e9e9e';
  };

  if (jugadas.length === 0) {
    return (
      <Paper sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
        p: 4,
        textAlign: 'center'
      }}>
        <SportsFootballIcon sx={{ fontSize: 60, color: 'gray', mb: 2 }} />
        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
          Sin Jugadas Registradas
        </Typography>
        <Typography variant="body2" sx={{ color: 'gray' }}>
          Las jugadas aparecerán aquí una vez que inicie el partido
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ color: 'white', mb: 3, textAlign: 'center' }}>
        Registro de Jugadas
      </Typography>

      <Paper sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
        p: 3,
        maxHeight: 600,
        overflowY: 'auto',
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(255,255,255,.3)',
          borderRadius: '3px',
        }
      }}>
        <TimelineContainer>
          {jugadas
            .slice()
            .reverse() // Mostrar jugadas más recientes primero
            .map((jugada, index) => {
              const isLast = index === jugadas.length - 1;
              
              return (
                <TimelineItem key={jugada.numero || index} isLast={isLast}>
                  <Paper
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${getJugadaColor(jugada.tipoJugada)}40`,
                      borderRadius: 2,
                      p: 2,
                      ml: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        transform: 'translateX(5px)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      {/* Información principal */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                        {/* Icono de la jugada */}
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            backgroundColor: `${getJugadaColor(jugada.tipoJugada)}20`,
                            border: `2px solid ${getJugadaColor(jugada.tipoJugada)}`
                          }}
                        >
                          {getJugadaIcon(jugada.tipoJugada)}
                        </Avatar>

                        {/* Detalles de la jugada */}
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Chip
                              label={getJugadaLabel(jugada.tipoJugada)}
                              size="small"
                              sx={{
                                backgroundColor: getJugadaColor(jugada.tipoJugada),
                                color: 'white',
                                fontWeight: 'bold'
                              }}
                            />
                            
                            {jugada.resultado?.puntos > 0 && (
                              <Chip
                                label={`+${jugada.resultado.puntos} pts`}
                                size="small"
                                sx={{
                                  backgroundColor: '#4caf50',
                                  color: 'white',
                                  fontWeight: 'bold'
                                }}
                              />
                            )}
                          </Box>

                          {/* Equipo */}
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: getColorEquipo(jugada.equipoEnPosesion),
                              fontWeight: 'bold',
                              mb: 0.5
                            }}
                          >
                            {getNombreEquipo(jugada.equipoEnPosesion)}
                          </Typography>

                          {/* Descripción */}
                          {jugada.descripcion && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: 'rgba(255, 255, 255, 0.7)',
                                display: 'block'
                              }}
                            >
                              {jugada.descripcion}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/* Tiempo y número de jugada */}
                      <Box sx={{ textAlign: 'right', ml: 2 }}>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'white',
                            fontWeight: 'bold',
                            display: 'block'
                          }}
                        >
                          #{jugada.numero}
                        </Typography>
                        
                        {jugada.tiempo && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                            <TimerIcon sx={{ fontSize: 12, color: '#64b5f6' }} />
                            <Typography 
                              variant="caption" 
                              sx={{ color: '#64b5f6' }}
                            >
                              {jugada.tiempo.minuto}:{jugada.tiempo.segundo?.toString().padStart(2, '0')}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>

                    {/* Jugadores involucrados */}
                    {(jugada.jugadorPrincipal || jugada.jugadorSecundario) && (
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 2, 
                        mt: 2,
                        pt: 1,
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        {jugada.jugadorPrincipal && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon sx={{ fontSize: 16, color: '#64b5f6' }} />
                            <Typography variant="caption" sx={{ color: 'white' }}>
                              {jugada.jugadorPrincipal.nombre || 'Jugador Principal'}
                            </Typography>
                          </Box>
                        )}
                        
                        {jugada.jugadorSecundario && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon sx={{ fontSize: 16, color: '#ff9800' }} />
                            <Typography variant="caption" sx={{ color: 'white' }}>
                              {jugada.jugadorSecundario.nombre || 'Jugador Secundario'}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* Resultados especiales */}
                    {(jugada.resultado?.touchdown || jugada.resultado?.intercepcion || jugada.resultado?.sack) && (
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 1, 
                        mt: 1,
                        flexWrap: 'wrap'
                      }}>
                        {jugada.resultado.touchdown && (
                          <Chip 
                            label="Touchdown" 
                            size="small" 
                            sx={{ backgroundColor: '#4caf50', color: 'white' }} 
                          />
                        )}
                        {jugada.resultado.intercepcion && (
                          <Chip 
                            label="Intercepción" 
                            size="small" 
                            sx={{ backgroundColor: '#f44336', color: 'white' }} 
                          />
                        )}
                        {jugada.resultado.sack && (
                          <Chip 
                            label="Sack" 
                            size="small" 
                            sx={{ backgroundColor: '#9c27b0', color: 'white' }} 
                          />
                        )}
                      </Box>
                    )}
                  </Paper>
                </TimelineItem>
              );
            })}
        </TimelineContainer>
      </Paper>
    </Box>
  );
};

export default JugadasPanel;