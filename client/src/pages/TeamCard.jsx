import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Chip, Avatar, Card, CardContent, 
  IconButton, List, ListItem, Stack, Collapse, Divider,
  CircularProgress, Alert
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CalendarToday as CalendarTodayIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationOnIcon,
  Groups as GroupsIcon,
  SportsTennis as TouchdownIcon
} from '@mui/icons-material';
import axiosInstance from '../config/axios';
import { getCategoryName } from '../helpers/mappings';
import { useImage } from '../hooks/useImage';

// 🏈 Tarjeta de Equipo CON ESTADÍSTICAS REALES
const TeamCardCompact = ({ equipo, usuario, torneoId = null }) => {
  console.log('🏈 TeamCard renderizado con:', {
    equipoId: equipo?._id,
    equipoNombre: equipo?.nombre,
    usuarioNumero: usuario?.numeroJugador,
    equipoNumeroUsuario: equipo?.numeroUsuario,
    torneoId: torneoId
  });

  const [expanded, setExpanded] = useState(false);
  const [partidos, setPartidos] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loadingPartidos, setLoadingPartidos] = useState(false);
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(false);
  const [error, setError] = useState(null);
  const equipoImageUrl = useImage(equipo?.imagen);

  // 🔄 Cargar estadísticas reales del equipo
  useEffect(() => {
    if (equipo?._id && torneoId) {
      console.log('🔄 Iniciando carga de estadísticas reales...');
      cargarEstadisticasReales();
    } else {
      console.log('⚠️ Faltan datos para cargar estadísticas:', {
        equipoId: equipo?._id,
        torneoId: torneoId
      });
      // Usar datos dummy si no hay torneo seleccionado
      setEstadisticasDummy();
    }
  }, [equipo?._id, torneoId]);

  const cargarEstadisticasReales = async () => {
    setLoadingEstadisticas(true);
    setError(null);
    
    try {
      const url = `/estadisticas/tarjeta-equipo/${equipo._id}/${torneoId}`;
      console.log('📡 Llamando API:', url);
      console.log('🔍 Datos de la llamada:', {
        equipoId: equipo._id,
        torneoId: torneoId,
        urlCompleta: `${axiosInstance.defaults.baseURL || 'BASE_URL_NO_DEFINIDA'}${url}`
      });
      
      const response = await axiosInstance.get(url);
      
      console.log('✅ Respuesta exitosa:', response);
      console.log('📊 Datos recibidos:', response.data);
      setEstadisticas(response.data.estadisticas);
      
    } catch (error) {
      console.error('❌ Error completo:', error);
      console.error('📡 Detalles del error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL
        }
      });
      setError(`Error: ${error.response?.status || 'NETWORK'} - ${error.response?.data?.mensaje || error.message}`);
      
      // 🔄 Fallback a datos dummy si hay error
      setEstadisticasDummy();
    } finally {
      setLoadingEstadisticas(false);
    }
  };

  const setEstadisticasDummy = () => {
    console.log('🎲 Usando estadísticas dummy...');
    const estadisticasDummy = {
      partidosJugados: Math.floor(Math.random() * 15) + 5,
      partidosGanados: Math.floor(Math.random() * 12) + 3,
      partidosPerdidos: 0,
      touchdowns: Math.floor(Math.random() * 25) + 8,
      conversiones1pt: Math.floor(Math.random() * 15) + 5,
      conversiones2pt: Math.floor(Math.random() * 8) + 2,
      safeties: Math.floor(Math.random() * 3),
      intercepciones: Math.floor(Math.random() * 12) + 3,
      sacks: Math.floor(Math.random() * 8) + 2,
      tackleos: Math.floor(Math.random() * 45) + 20,
      pasesCompletos: Math.floor(Math.random() * 80) + 40,
      pasesIncompletos: Math.floor(Math.random() * 30) + 15,
      corridas: Math.floor(Math.random() * 35) + 20,
      posicionLiga: Math.floor(Math.random() * 8) + 1,
      totalEquipos: 12,
      rachaActual: ['V', 'V', 'D', 'V', 'D']
    };

    // Calcular derivados
    estadisticasDummy.partidosPerdidos = estadisticasDummy.partidosJugados - estadisticasDummy.partidosGanados;
    const totalPases = estadisticasDummy.pasesCompletos + estadisticasDummy.pasesIncompletos;
    estadisticasDummy.porcentajePases = totalPases > 0 ? Math.round((estadisticasDummy.pasesCompletos / totalPases) * 100) : 0;
    estadisticasDummy.promedioPuntosPorPartido = estadisticasDummy.partidosJugados > 0 ? 
      Math.round(((estadisticasDummy.touchdowns * 6) + estadisticasDummy.conversiones1pt + (estadisticasDummy.conversiones2pt * 2) + (estadisticasDummy.safeties * 2)) / estadisticasDummy.partidosJugados * 10) / 10 : 0;
    estadisticasDummy.porcentajeVictorias = estadisticasDummy.partidosJugados > 0 ? 
      Math.round((estadisticasDummy.partidosGanados / estadisticasDummy.partidosJugados) * 100) : 0;

    setEstadisticas(estadisticasDummy);
  };

  // 🎨 Funciones helper
  const getPosicionColor = (posicion, total) => {
    if (!posicion || !total) return '#9e9e9e';
    const porcentaje = (posicion / total) * 100;
    if (porcentaje <= 33) return '#4caf50';
    if (porcentaje <= 66) return '#ff9800';
    return '#f44336';
  };

  const getPosicionIcon = (posicion) => {
    if (posicion === 1) return '🥇';
    if (posicion === 2) return '🥈';
    if (posicion === 3) return '🥉';
    return '🏈';
  };

  const getRachaColor = (resultado) => {
    switch (resultado) {
      case 'V': return '#4caf50';
      case 'D': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'programado': return '#2196f3';
      case 'en_curso': return '#4caf50';
      case 'finalizado': return '#9e9e9e';
      case 'cancelado': return '#f44336';
      case 'suspendido': return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  // 📊 Cargar próximos partidos del equipo
  const cargarPartidos = async () => {
    if (loadingPartidos) {
      console.log('⏳ Ya se están cargando partidos, cancelando...');
      return;
    }
    
    console.log('🔍 Iniciando carga de partidos para equipo:', equipo._id);
    setLoadingPartidos(true);
    
    try {
      const response = await axiosInstance.get(`/partidos?equipo=${equipo._id}&estado=programado&limit=3`);
      console.log('✅ Partidos cargados:', response.data.partidos?.length || 0);
      setPartidos(response.data.partidos || []);
    } catch (error) {
      console.error('❌ Error al cargar partidos:', error);
      setPartidos([]);
    } finally {
      setLoadingPartidos(false);
      console.log('🏁 Carga de partidos completada');
    }
  };

  const handleExpandClick = () => {
    console.log('🔽 Toggle expandir, estado actual:', expanded);
    setExpanded(!expanded);
    if (!expanded && partidos.length === 0) {
      console.log('📅 Cargando partidos por primera vez...');
      cargarPartidos();
    }
  };

  // 🔥 DETERMINAR NÚMERO DE JUGADOR A MOSTRAR
  const numeroJugadorMostrar = usuario?.numeroJugador || equipo?.numeroUsuario;
  console.log('🔢 Número de jugador a mostrar:', {
    usuarioNumeroJugador: usuario?.numeroJugador,
    equipoNumeroUsuario: equipo?.numeroUsuario,
    numeroFinal: numeroJugadorMostrar
  });

  // 🔄 Mostrar loading mientras carga estadísticas
  if (loadingEstadisticas) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        style={{ width: '100%', height: '100%' }}
      >
        <Card sx={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          overflow: 'hidden',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '320px'
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress sx={{ color: '#4caf50', mb: 2 }} />
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Cargando estadísticas...
            </Typography>
          </Box>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ width: '100%', height: '100%' }}
    >
      <Card sx={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        minHeight: '320px',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          border: '1px solid rgba(76, 175, 80, 0.3)'
        }
      }}>
        <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
          
          {/* Header con logo, nombre y número de jugador */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              src={equipoImageUrl}
              sx={{
                width: 64,
                height: 64,
                mr: 2,
                border: '3px solid #4caf50',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
              }}
            >
              🏈
            </Avatar>
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" sx={{
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                mb: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {equipo?.nombre || 'Equipo Sin Nombre'}
              </Typography>
              
              <Stack direction="row" spacing={1} sx={{ mb: 0.5 }}>
                <Chip
                  label={getCategoryName(equipo?.categoria) || 'Sin categoría'}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    color: '#4caf50',
                    fontSize: '0.7rem',
                    height: '22px'
                  }}
                />
                
                {/* 🔥 MOSTRAR NÚMERO DE JUGADOR */}
                {numeroJugadorMostrar && (
                  <Chip
                    label={`#${numeroJugadorMostrar}`}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(33, 150, 243, 0.2)',
                      color: '#2196f3',
                      fontSize: '0.75rem',
                      height: '22px',
                      fontWeight: 'bold'
                    }}
                  />
                )}
              </Stack>
            </Box>

            {/* 🏆 MOSTRAR POSICIÓN EN LIGA */}
            {estadisticas?.posicionLiga > 0 && (
              <Box sx={{ textAlign: 'center', ml: 1 }}>
                <Box sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: getPosicionColor(estadisticas.posicionLiga, estadisticas.totalEquipos),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 0.5
                }}>
                  <Typography variant="body2" sx={{ 
                    color: 'white', 
                    fontWeight: 'bold',
                    fontSize: '0.8rem'
                  }}>
                    {getPosicionIcon(estadisticas.posicionLiga)}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ 
                  color: 'rgba(255,255,255,0.7)', 
                  fontSize: '0.6rem' 
                }}>
                  {estadisticas.posicionLiga}°/{estadisticas.totalEquipos}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Error de carga */}
          {error && (
            <Alert severity="warning" sx={{ mb: 2, fontSize: '0.75rem' }}>
              {error}
            </Alert>
          )}

          {/* Indicador de datos dummy */}
          {!torneoId && (
            <Alert severity="info" sx={{ mb: 2, fontSize: '0.7rem' }}>
              📊 Datos de ejemplo - Selecciona un torneo para ver estadísticas reales
            </Alert>
          )}

          {/* Racha de resultados */}
          {estadisticas?.rachaActual?.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ 
                color: 'rgba(255,255,255,0.7)', 
                fontSize: '0.65rem',
                display: 'block',
                mb: 0.5
              }}>
                Últimos resultados:
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                {estadisticas.rachaActual.map((resultado, index) => (
                  <Box
                    key={index}
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      backgroundColor: getRachaColor(resultado),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.6rem',
                      fontWeight: 'bold',
                      color: 'white',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }}
                  >
                    {resultado}
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* 🔥 ESTADÍSTICAS PRINCIPALES EN GRID 3x2 MEJORADO */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: 1.5, 
            mb: 2,
            flex: 1
          }}>
            
            {/* Touchdowns */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ 
                color: '#4caf50', 
                fontWeight: 'bold', 
                fontSize: '1.2rem' 
              }}>
                {estadisticas?.touchdowns || 0}
              </Typography>
              <Typography variant="caption" sx={{ 
                color: 'rgba(255,255,255,0.7)', 
                fontSize: '0.65rem' 
              }}>
                TD
              </Typography>
            </Box>

            {/* Porcentaje de victorias */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ 
                color: '#2196f3', 
                fontWeight: 'bold', 
                fontSize: '1.2rem' 
              }}>
                {estadisticas?.porcentajeVictorias || 0}%
              </Typography>
              <Typography variant="caption" sx={{ 
                color: 'rgba(255,255,255,0.7)', 
                fontSize: '0.65rem' 
              }}>
                Victorias
              </Typography>
            </Box>

            {/* Promedio de puntos */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ 
                color: '#ff9800', 
                fontWeight: 'bold', 
                fontSize: '1.2rem' 
              }}>
                {estadisticas?.promedioPuntosPorPartido || 0}
              </Typography>
              <Typography variant="caption" sx={{ 
                color: 'rgba(255,255,255,0.7)', 
                fontSize: '0.65rem' 
              }}>
                Pts/Partido
              </Typography>
            </Box>

            {/* 🔥 NUEVAS ESTADÍSTICAS - Intercepciones defensivas */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ 
                color: '#e91e63', 
                fontWeight: 'bold', 
                fontSize: '1.2rem' 
              }}>
                {estadisticas?.intercepciones || 0}
              </Typography>
              <Typography variant="caption" sx={{ 
                color: 'rgba(255,255,255,0.7)', 
                fontSize: '0.65rem' 
              }}>
                INT
              </Typography>
            </Box>

            {/* 🔥 NUEVAS ESTADÍSTICAS - Sacks */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ 
                color: '#9c27b0', 
                fontWeight: 'bold', 
                fontSize: '1.2rem' 
              }}>
                {estadisticas?.sacks || 0}
              </Typography>
              <Typography variant="caption" sx={{ 
                color: 'rgba(255,255,255,0.7)', 
                fontSize: '0.65rem' 
              }}>
                Sacks
              </Typography>
            </Box>

            {/* 🔥 NUEVAS ESTADÍSTICAS - Porcentaje de pases */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ 
                color: '#00bcd4', 
                fontWeight: 'bold', 
                fontSize: '1.2rem' 
              }}>
                {estadisticas?.porcentajePases || 0}%
              </Typography>
              <Typography variant="caption" sx={{ 
                color: 'rgba(255,255,255,0.7)', 
                fontSize: '0.65rem' 
              }}>
                Pases
              </Typography>
            </Box>
          </Box>

          {/* 🔥 RECORD Y ESTADÍSTICAS ADICIONALES */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2,
            p: 1.5,
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: '8px'
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ 
                color: '#4caf50', 
                fontWeight: 'bold', 
                fontSize: '1rem' 
              }}>
                {estadisticas?.partidosGanados || 0}-{estadisticas?.partidosPerdidos || 0}
              </Typography>
              <Typography variant="caption" sx={{ 
                color: 'rgba(255,255,255,0.7)', 
                fontSize: '0.6rem' 
              }}>
                Ganados-Perdidos
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ 
                color: '#ff9800', 
                fontWeight: 'bold', 
                fontSize: '1rem' 
              }}>
                {estadisticas?.partidosJugados || 0}
              </Typography>
              <Typography variant="caption" sx={{ 
                color: 'rgba(255,255,255,0.7)', 
                fontSize: '0.6rem' 
              }}>
                Jugados
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ 
                color: '#2196f3', 
                fontWeight: 'bold', 
                fontSize: '1rem' 
              }}>
                {estadisticas?.tackleos || 0}
              </Typography>
              <Typography variant="caption" sx={{ 
                color: 'rgba(255,255,255,0.7)', 
                fontSize: '0.6rem' 
              }}>
                Tackleos
              </Typography>
            </Box>
          </Box>

          {/* Botón expandir/contraer */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 'auto' }}>
            <IconButton
              onClick={handleExpandClick}
              sx={{
                color: 'rgba(255,255,255,0.7)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  color: '#4caf50',
                  backgroundColor: 'rgba(76, 175, 80, 0.1)'
                }
              }}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          {/* Sección expandible con próximos partidos */}
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Divider sx={{ 
              my: 2, 
              borderColor: 'rgba(255,255,255,0.1)' 
            }} />
            
            <Typography variant="subtitle2" sx={{ 
              color: 'white', 
              mb: 1.5, 
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <CalendarTodayIcon sx={{ fontSize: '1rem' }} />
              Próximos Partidos
            </Typography>

            {loadingPartidos ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} sx={{ color: '#4caf50' }} />
              </Box>
            ) : partidos.length > 0 ? (
              <List sx={{ p: 0 }}>
                {partidos.slice(0, 3).map((partido, index) => {
                  console.log('🏈 Renderizando partido:', partido._id, partido.equipoLocal?.nombre, 'vs', partido.equipoVisitante?.nombre);
                  
                  return (
                    <ListItem key={partido._id} sx={{ 
                      p: 1, 
                      borderRadius: '8px',
                      backgroundColor: index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                      mb: 0.5
                    }}>
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          mb: 0.5
                        }}>
                          <Typography variant="body2" sx={{ 
                            color: 'white', 
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                          }}>
                            vs {partido.equipoLocal?._id === equipo._id ? 
                              partido.equipoVisitante?.nombre : 
                              partido.equipoLocal?.nombre}
                          </Typography>
                          <Chip
                            label={partido.estado}
                            size="small"
                            sx={{
                              backgroundColor: getEstadoColor(partido.estado),
                              color: 'white',
                              fontSize: '0.6rem',
                              height: '18px'
                            }}
                          />
                        </Box>
                        
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          color: 'rgba(255,255,255,0.7)',
                          fontSize: '0.7rem'
                        }}>
                          <ScheduleIcon sx={{ fontSize: '0.8rem' }} />
                          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                            {new Date(partido.fechaHora).toLocaleDateString('es-MX', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Typography>
                          
                          {partido.sede && (
                            <>
                              <LocationOnIcon sx={{ fontSize: '0.8rem', ml: 1 }} />
                              <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                {partido.sede}
                              </Typography>
                            </>
                          )}
                        </Box>
                      </Box>
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Typography variant="body2" sx={{ 
                color: 'rgba(255,255,255,0.5)', 
                textAlign: 'center',
                py: 2,
                fontSize: '0.8rem'
              }}>
                No hay próximos partidos programados
              </Typography>
            )}
          </Collapse>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TeamCardCompact;