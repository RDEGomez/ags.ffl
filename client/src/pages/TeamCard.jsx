import React, { useState } from 'react';
import { 
  Box, Typography, Grid, Chip, Avatar, Card, CardContent, 
  IconButton, List, ListItem, Stack, Collapse, Divider,
  CircularProgress
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

// 🏈 Tarjeta de Equipo COMPACTA con Estadísticas de Flag Football
const TeamCardCompact = ({ equipo, usuario }) => {
  const [expanded, setExpanded] = useState(false);
  const [partidos, setPartidos] = useState([]);
  const [loadingPartidos, setLoadingPartidos] = useState(false);
  const equipoImageUrl = useImage(equipo?.imagen);

  // 🔥 ESTADÍSTICAS DE FLAG FOOTBALL (datos de prueba preparados para datos reales)
  const estadisticas = {
    // Básicas del equipo (Flag Football NO tiene empates)
    partidosJugados: Math.floor(Math.random() * 15) + 5,
    partidosGanados: Math.floor(Math.random() * 12) + 3,
    partidosPerdidos: 0, // Se calculará automáticamente
    
    // 🏈 Estadísticas basadas en los tipos de jugadas reales
    touchdowns: Math.floor(Math.random() * 25) + 8, // 'touchdown'
    conversiones1pt: Math.floor(Math.random() * 15) + 5, // 'conversion_1pt'
    conversiones2pt: Math.floor(Math.random() * 8) + 2, // 'conversion_2pt'
    safeties: Math.floor(Math.random() * 3), // 'safety'
    intercepciones: Math.floor(Math.random() * 12) + 3, // 'intercepcion'
    sacks: Math.floor(Math.random() * 8) + 2, // 'sack'
    tackleos: Math.floor(Math.random() * 45) + 20, // 'tackleo'
    
    // 🎯 Estadísticas de pases (basadas en jugadas reales)
    pasesCompletos: Math.floor(Math.random() * 80) + 40, // 'pase_completo'
    pasesIncompletos: Math.floor(Math.random() * 30) + 15, // 'pase_incompleto'
    corridas: Math.floor(Math.random() * 35) + 20, // 'corrida'
    
    // 🥇 Posición en liga
    posicionLiga: Math.floor(Math.random() * 8) + 1,
    totalEquipos: 12,
    
    // 📊 Rendimiento reciente (sin empates)
    rachaActual: ['V', 'V', 'D', 'V', 'D'], // V=Victoria, D=Derrota (sin empates)
  };

  // Calcular partidos perdidos (sin empates en flag football)
  estadisticas.partidosPerdidos = estadisticas.partidosJugados - estadisticas.partidosGanados;
  const totalPases = estadisticas.pasesCompletos + estadisticas.pasesIncompletos;
  const porcentajePases = totalPases > 0 ? ((estadisticas.pasesCompletos / totalPases) * 100).toFixed(1) : 0;
  const totalPuntos = (estadisticas.touchdowns * 6) + estadisticas.conversiones1pt + (estadisticas.conversiones2pt * 2) + (estadisticas.safeties * 2);
  const promedioPuntosPorPartido = estadisticas.partidosJugados > 0 ? (totalPuntos / estadisticas.partidosJugados).toFixed(1) : 0;

  // Calcular porcentaje de victorias
  const porcentajeVictorias = estadisticas.partidosJugados > 0 
    ? ((estadisticas.partidosGanados / estadisticas.partidosJugados) * 100).toFixed(1)
    : 0;

  // 🎨 Función para obtener color según posición
  const getPosicionColor = (posicion) => {
    if (posicion <= 3) return '#4caf50'; // Verde - Top 3
    if (posicion <= 6) return '#ff9800'; // Naranja - Medio
    return '#f44336'; // Rojo - Abajo
  };

  // 🏆 Función para obtener icono de posición
  const getPosicionIcon = (posicion) => {
    if (posicion === 1) return '🥇';
    if (posicion === 2) return '🥈';
    if (posicion === 3) return '🥉';
    return '🏈';
  };

  // 🎯 Función para obtener color del estado del partido
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

  // 🔄 Función para obtener color de la racha (sin empates)
  const getRachaColor = (resultado) => {
    switch (resultado) {
      case 'V': return '#4caf50'; // Verde
      case 'D': return '#f44336'; // Rojo
      default: return '#9e9e9e';
    }
  };

  // 📊 Cargar partidos del equipo
  const cargarPartidos = async () => {
    if (loadingPartidos) return;
    
    setLoadingPartidos(true);
    try {
      const response = await axiosInstance.get(`/partidos?equipo=${equipo._id}&estado=programado&limit=3`);
      setPartidos(response.data.partidos || []);
    } catch (error) {
      console.error('Error al cargar partidos:', error);
    } finally {
      setLoadingPartidos(false);
    }
  };

  // 🔽 Toggle expandir información
  const handleExpandClick = () => {
    setExpanded(!expanded);
    if (!expanded && partidos.length === 0) {
      cargarPartidos();
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <Card sx={{
        background: 'linear-gradient(145deg, rgba(30,30,60,0.95), rgba(50,50,80,0.95))',
        backdropFilter: 'blur(15px)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 3, 
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.4s ease',
        minHeight: '280px', // Altura fija más compacta
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'translateY(-5px) scale(1.02)',
          boxShadow: '0 15px 30px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.25)'
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${getPosicionColor(estadisticas.posicionLiga)}, transparent)`,
        }
      }}>
        <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Header compacto del equipo */}
          <Box sx={{ mb: 2 }}>
            {/* Posición en la liga - esquina superior derecha */}
            <Box sx={{
              position: 'absolute',
              top: 12, right: 12,
              display: 'flex', alignItems: 'center', gap: 0.5,
              backgroundColor: 'rgba(0,0,0,0.4)',
              padding: '2px 8px',
              borderRadius: 1.5,
              backdropFilter: 'blur(10px)'
            }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.65rem' }}>
                {getPosicionIcon(estadisticas.posicionLiga)} #{estadisticas.posicionLiga}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={equipoImageUrl}
                  sx={{
                    width: 45, height: 45,
                    border: '2px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                  }}
                >
                  <GroupsIcon sx={{ fontSize: 24 }} />
                </Avatar>
                
                {/* Badge del número del equipo */}
                <Box sx={{
                  position: 'absolute',
                  bottom: -3, right: -3,
                  backgroundColor: '#4caf50',
                  color: 'white',
                  borderRadius: '50%',
                  width: 18, height: 18,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 'bold',
                  border: '1px solid rgba(255,255,255,0.9)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
                }}>
                  {equipo.numeroUsuario || '?'}
                </Box>
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'white', 
                    fontWeight: 'bold', 
                    mb: 0.5,
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                    fontSize: '1rem',
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {equipo.nombre}
                </Typography>
                
                <Chip 
                  label={getCategoryName(equipo.categoria)} 
                  size="small"
                  sx={{ 
                    backgroundColor: 'rgba(100,181,246,0.2)', 
                    color: '#64b5f6',
                    fontWeight: 'bold',
                    height: '20px',
                    fontSize: '0.7rem'
                  }}
                />
              </Box>
            </Box>

            {/* Racha actual compacta */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', mr: 0.5 }}>
                Racha:
              </Typography>
              {estadisticas.rachaActual.slice(-4).map((resultado, index) => (
                <Box
                  key={index}
                  sx={{
                    width: 16, height: 16,
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

          {/* Estadísticas principales compactas */}
          <Box sx={{ flex: 1 }}>
            <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {estadisticas.touchdowns}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem' }}>
                    TD
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ color: '#2196f3', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {porcentajeVictorias}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem' }}>
                    Victorias
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {promedioPuntosPorPartido}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem' }}>
                    Prom
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />

            {/* Record compacto */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                  {estadisticas.partidosGanados}G
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#f44336', fontWeight: 'bold' }}>
                  {estadisticas.partidosPerdidos}P
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#9c27b0', fontWeight: 'bold' }}>
                  {estadisticas.intercepciones} INT
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#e91e63', fontWeight: 'bold' }}>
                  {estadisticas.sacks} SK
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Botón expandir/contraer */}
          <Box sx={{ textAlign: 'center', mt: 'auto' }}>
            <IconButton 
              onClick={handleExpandClick}
              size="small"
              sx={{ 
                color: 'rgba(255,255,255,0.7)',
                '&:hover': { 
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: 'white'
                }
              }}
            >
              {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </Box>

          {/* Sección expandible con próximos partidos */}
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ pt: 2 }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  color: 'white', 
                  mb: 1.5, 
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontSize: '0.8rem'
                }}
              >
                🏈 Próximos Partidos
              </Typography>
              
              {loadingPartidos ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={20} sx={{ color: '#64b5f6' }} />
                </Box>
              ) : partidos.length === 0 ? (
                <Box sx={{
                  p: 2, textAlign: 'center',
                  border: '1px dashed rgba(255,255,255,0.2)',
                  borderRadius: 1,
                  backgroundColor: 'rgba(255,255,255,0.02)'
                }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    No hay partidos programados
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {partidos.slice(0, 2).map((partido, index) => (
                    <ListItem key={partido._id} sx={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: 1.5,
                      mb: 1,
                      border: '1px solid rgba(255,255,255,0.1)',
                      p: 1
                    }}>
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.75rem' }}>
                            vs {partido.equipoLocal._id === equipo._id ? 
                              partido.equipoVisitante.nombre : partido.equipoLocal.nombre}
                          </Typography>
                          <Chip
                            label={partido.estado}
                            size="small"
                            sx={{
                              backgroundColor: `${getEstadoColor(partido.estado)}20`,
                              color: getEstadoColor(partido.estado),
                              border: `1px solid ${getEstadoColor(partido.estado)}40`,
                              height: '16px',
                              fontSize: '0.6rem',
                              '& .MuiChip-label': { px: 1 }
                            }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.65rem' }}>
                          📅 {new Date(partido.fechaHora).toLocaleDateString('es-MX')} • 
                          🕐 {new Date(partido.fechaHora).toLocaleTimeString('es-MX', { 
                            hour: '2-digit', minute: '2-digit' 
                          })}
                          {partido.sede?.nombre && ` • 📍 ${partido.sede.nombre}`}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TeamCardCompact;