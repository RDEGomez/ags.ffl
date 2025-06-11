// 📁 client/src/pages/partidos/JugadasPanel.jsx - MEJORADO CON AVATARES
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
  Badge,
  AvatarGroup,
  Tooltip
} from '@mui/material';
import {
  SportsFootball as SportsFootballIcon,
  TouchApp as TouchAppIcon,
  Block as BlockIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Timer as TimerIcon,
  Person as PersonIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { useImage } from '../../hooks/useImage';

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

// 🔥 NUEVO: Componente para mostrar información de jugador con avatar
const JugadorInfo = ({ jugador, tipo = 'principal', colorJugada = '#64b5f6' }) => {
  const jugadorImageUrl = useImage(jugador?.imagen, '');
  
  if (!jugador) return null;

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1.5,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 2,
      p: 1.5,
      border: `1px solid ${colorJugada}40`,
      minWidth: 0 // Para permitir text overflow
    }}>
      {/* Avatar del jugador */}
      <Avatar
        src={jugadorImageUrl}
        alt={`Foto de ${jugador.nombre}`}
        sx={{ 
          width: 32, 
          height: 32,
          border: `2px solid ${colorJugada}`,
          backgroundColor: `${colorJugada}20`
        }}
      >
        <PersonIcon sx={{ fontSize: 16 }} />
      </Avatar>
      
      {/* Información del jugador */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          {/* Número de camiseta */}
          <Chip
            label={`#${jugador.numero || '?'}`}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.75rem',
              fontWeight: 'bold',
              backgroundColor: colorJugada,
              color: 'white',
              minWidth: 32
            }}
          />
          
          {/* Tipo de jugador */}
          <Chip
            label={tipo === 'principal' ? 'Principal' : 'Secundario'}
            size="small"
            variant="outlined"
            sx={{
              height: 18,
              fontSize: '0.7rem',
              borderColor: colorJugada,
              color: colorJugada,
              backgroundColor: `${colorJugada}10`
            }}
          />
        </Box>
        
        {/* Nombre del jugador */}
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.875rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {jugador.nombre || 'Jugador'}
        </Typography>
      </Box>
    </Box>
  );
};

// 🔥 NUEVO: Componente para mostrar equipo en posesión
const EquipoPosesion = ({ equipo, colorJugada = '#64b5f6' }) => {
  const equipoImageUrl = useImage(equipo?.imagen, '');
  
  if (!equipo) return null;

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1,
      backgroundColor: `${colorJugada}15`,
      borderRadius: 1.5,
      px: 2,
      py: 0.5,
      border: `1px solid ${colorJugada}40`
    }}>
      <Avatar
        src={equipoImageUrl}
        alt={`Logo de ${equipo.nombre}`}
        sx={{ 
          width: 20, 
          height: 20,
          backgroundColor: `${colorJugada}30`
        }}
      >
        <GroupIcon sx={{ fontSize: 12 }} />
      </Avatar>
      
      <Typography 
        variant="caption" 
        sx={{ 
          color: 'white',
          fontWeight: 'bold',
          fontSize: '0.75rem'
        }}
      >
        {equipo.nombre}
      </Typography>
    </Box>
  );
};

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

  // Helper para obtener equipo por ID
  const getEquipoById = (equipoId) => {
    if (equipoId === partido?.equipoLocal?._id) {
      return partido.equipoLocal;
    } else if (equipoId === partido?.equipoVisitante?._id) {
      return partido.equipoVisitante;
    }
    return null;
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
        📋 Registro de Jugadas ({jugadas.length})
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
              const colorJugada = getJugadaColor(jugada.tipoJugada);
              const equipoEnPosesion = getEquipoById(jugada.equipoEnPosesion);
              
              return (
                <TimelineItem key={jugada.numero || index} isLast={isLast}>
                  <Paper
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${colorJugada}40`,
                      borderRadius: 2,
                      p: 2.5,
                      ml: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        transform: 'translateX(5px)',
                        border: `1px solid ${colorJugada}60`
                      }
                    }}
                  >
                    {/* Header de la jugada */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      {/* Información principal */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                        {/* Icono de la jugada */}
                        <Avatar
                          sx={{
                            width: 44,
                            height: 44,
                            backgroundColor: `${colorJugada}20`,
                            border: `2px solid ${colorJugada}`
                          }}
                        >
                          {getJugadaIcon(jugada.tipoJugada)}
                        </Avatar>

                        {/* Detalles de la jugada */}
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                            <Chip
                              label={getJugadaLabel(jugada.tipoJugada)}
                              sx={{
                                backgroundColor: colorJugada,
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '0.875rem'
                              }}
                            />
                            
                            {/* Equipo en posesión */}
                            <EquipoPosesion 
                              equipo={equipoEnPosesion} 
                              colorJugada={colorJugada}
                            />
                          </Box>

                          {/* Descripción de la jugada */}
                          {jugada.descripcion && (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontStyle: 'italic',
                                mt: 0.5
                              }}
                            >
                              "{jugada.descripcion}"
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/* Información de tiempo y número de jugada */}
                      <Box sx={{ textAlign: 'right', ml: 2 }}>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'white',
                            fontWeight: 'bold',
                            display: 'block',
                            fontSize: '0.9rem'
                          }}
                        >
                          #{jugada.numero}
                        </Typography>
                        
                        {jugada.tiempo && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end', mt: 0.5 }}>
                            <TimerIcon sx={{ fontSize: 14, color: '#64b5f6' }} />
                            <Typography 
                              variant="caption" 
                              sx={{ color: '#64b5f6', fontWeight: 'bold' }}
                            >
                              {jugada.tiempo.minuto}:{jugada.tiempo.segundo?.toString().padStart(2, '0')}
                            </Typography>
                          </Box>
                        )}
                        
                        {/* Mostrar puntos si los hay */}
                        {jugada.resultado?.puntos > 0 && (
                          <Chip
                            label={`+${jugada.resultado.puntos} pts`}
                            size="small"
                            sx={{
                              backgroundColor: '#4caf50',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.75rem',
                              mt: 0.5
                            }}
                          />
                        )}
                      </Box>
                    </Box>

                    {/* 🔥 NUEVA SECCIÓN: Jugadores involucrados con avatares */}
                    {(jugada.jugadorPrincipal || jugada.jugadorSecundario) && (
                      <Box sx={{ 
                        mt: 2,
                        pt: 2,
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontWeight: 'bold',
                            display: 'block',
                            mb: 1.5,
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}
                        >
                          👥 Jugadores Involucrados
                        </Typography>
                        
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          gap: 1.5
                        }}>
                          {/* Jugador Principal */}
                          {jugada.jugadorPrincipal && (
                            <JugadorInfo 
                              jugador={jugada.jugadorPrincipal}
                              tipo="principal"
                              colorJugada={colorJugada}
                            />
                          )}
                          
                          {/* Jugador Secundario */}
                          {jugada.jugadorSecundario && (
                            <JugadorInfo 
                              jugador={jugada.jugadorSecundario}
                              tipo="secundario"
                              colorJugada={colorJugada}
                            />
                          )}
                        </Box>
                      </Box>
                    )}

                    {/* Resultados especiales */}
                    {(jugada.resultado?.touchdown || jugada.resultado?.intercepcion || jugada.resultado?.sack) && (
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 1, 
                        mt: 2,
                        pt: 1.5,
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        flexWrap: 'wrap'
                      }}>
                        {jugada.resultado.touchdown && (
                          <Chip 
                            label="🏈 Touchdown" 
                            size="small" 
                            sx={{ 
                              backgroundColor: '#4caf50', 
                              color: 'white',
                              fontWeight: 'bold'
                            }} 
                          />
                        )}
                        {jugada.resultado.intercepcion && (
                          <Chip 
                            label="🛡️ Intercepción" 
                            size="small" 
                            sx={{ 
                              backgroundColor: '#f44336', 
                              color: 'white',
                              fontWeight: 'bold'
                            }} 
                          />
                        )}
                        {jugada.resultado.sack && (
                          <Chip 
                            label="💥 Sack" 
                            size="small" 
                            sx={{ 
                              backgroundColor: '#9c27b0', 
                              color: 'white',
                              fontWeight: 'bold'
                            }} 
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