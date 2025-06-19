import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Avatar, IconButton, Collapse, Tooltip,
  CircularProgress, Alert, Divider, Chip
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  EmojiEvents as TrophyIcon,
  SportsFootball as FootballIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Star as StarIcon,
  Timeline as TimelineIcon,
  SportsMma as TackleIcon
} from '@mui/icons-material';
import axiosInstance from '../config/axios';
import { getCategoryName } from '../helpers/mappings';
import { useImage } from '../hooks/useImage';

// 🎯 TARJETA DE EQUIPO REINVENTADA CON GLASSMORPHISM - SIN FILTROS DE CATEGORÍA
const TeamCardGlass = ({ equipo, usuario, torneoId = null }) => {
  const [expanded, setExpanded] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);
  const [lideres, setLideres] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const equipoImageUrl = useImage(equipo?.imagen);

  // 🔄 Cargar estadísticas del equipo
  useEffect(() => {
    if (equipo?._id && torneoId) {
      cargarDatosEquipo();
    } else {
      setEstadisticasDummy();
    }
  }, [equipo?._id, torneoId]);

  const cargarDatosEquipo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Cargar estadísticas básicas del equipo
      const responseStats = await axiosInstance.get(
        `/estadisticas/tarjeta-equipo/${equipo._id}/${torneoId}`
      );
      setEstadisticas(responseStats.data.estadisticas);

      // Cargar líderes de estadísticas (top 3 por categoría) - SOLO TORNEO
      const categorias = ['puntos', 'qbrating', 'recepciones', 'tackleos', 'intercepciones'];
      const lideresData = {};
      
      for (const categoria of categorias) {
        try {
          const responseLideres = await axiosInstance.get(
            `/estadisticas/lideres/${equipo._id}/${torneoId}/${categoria}`
          );
          lideresData[categoria] = responseLideres.data.lideres.slice(0, 3); // Top 3
        } catch (err) {
          console.warn(`Error cargando líderes de ${categoria}:`, err);
          lideresData[categoria] = [];
        }
      }
      
      setLideres(lideresData);
      
    } catch (error) {
      console.error('Error cargando datos del equipo:', error);
      setError('Error al cargar estadísticas del equipo');
      setEstadisticasDummy();
    } finally {
      setLoading(false);
    }
  };

  const setEstadisticasDummy = () => {
    const dummyStats = {
      partidosJugados: 8,
      partidosGanados: 5,
      partidosPerdidos: 3,
      porcentajeVictorias: 62,
      puntosFavor: 156,
      puntosContra: 98,
      diferenciaPuntos: 58,
      promedioPuntosPorPartido: 19.5,
      touchdowns: 22,
      intercepciones: 4,
      sacks: 12,
      porcentajePases: 68,
      posicionLiga: 3,
      totalEquipos: 12,
      rachaActual: ['V', 'V', 'D', 'V', 'V']
    };
    setEstadisticas(dummyStats);
    
    // Líderes dummy
    setLideres({
      puntos: [
        { jugador: { nombre: 'Carlos Mendez', numero: 7, imagen: null }, valor: 48, equipo: equipo },
        { jugador: { nombre: 'Miguel Torres', numero: 23, imagen: null }, valor: 42, equipo: equipo },
        { jugador: { nombre: 'Luis García', numero: 15, imagen: null }, valor: 36, equipo: equipo }
      ],
      qbrating: [
        { jugador: { nombre: 'Roberto Silva', numero: 12, imagen: null }, valor: 85, equipo: equipo },
        { jugador: { nombre: 'Fernando López', numero: 8, imagen: null }, valor: 78, equipo: equipo }
      ],
      recepciones: [
        { jugador: { nombre: 'Daniel Ruiz', numero: 80, imagen: null }, valor: 32, equipo: equipo },
        { jugador: { nombre: 'Jorge Vega', numero: 11, imagen: null }, valor: 28, equipo: equipo }
      ],
      tackleos: [
        { jugador: { nombre: 'Alejandro Ramos', numero: 54, imagen: null }, valor: 24, equipo: equipo },
        { jugador: { nombre: 'Diego Castro', numero: 91, imagen: null }, valor: 20, equipo: equipo }
      ],
      intercepciones: [
        { jugador: { nombre: 'Santiago López', numero: 25, imagen: null }, valor: 5, equipo: equipo },
        { jugador: { nombre: 'Raúl Herrera', numero: 33, imagen: null }, valor: 3, equipo: equipo }
      ]
    });
  };

  // 🎨 Helpers para colores y efectos
  const getWinPercentageColor = (percentage) => {
    if (percentage >= 75) return '#4caf50';
    if (percentage >= 50) return '#ff9800';
    return '#f44336';
  };

  const getPositionColor = (position, total) => {
    if (!position || !total) return '#9e9e9e';
    const percentile = (position / total) * 100;
    if (percentile <= 25) return '#4caf50';
    if (percentile <= 50) return '#ff9800';
    return '#f44336';
  };

  const getStreakDisplay = (racha) => {
    return racha?.map((resultado, index) => (
      <Box
        key={index}
        sx={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          backgroundColor: resultado === 'V' ? '#4caf50' : '#f44336',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.6rem',
          fontWeight: 'bold',
          color: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}
      >
        {resultado}
      </Box>
    ));
  };

  // 🏆 Componente de Líderes por categoría
  const LideresCategoria = ({ categoria, lideresData }) => {
    if (!lideresData || lideresData.length === 0) return null;

    const iconMap = {
      puntos: <StarIcon sx={{ fontSize: 14, color: '#ffd700' }} />,
      qbrating: <FootballIcon sx={{ fontSize: 14, color: '#2196f3' }} />,
      recepciones: <TrophyIcon sx={{ fontSize: 14, color: '#ff9800' }} />,
      tackleos: <TackleIcon sx={{ fontSize: 14, color: '#9c27b0' }} />,
      intercepciones: <TimelineIcon sx={{ fontSize: 14, color: '#e91e63' }} />
    };

    const categoryLabels = {
      puntos: 'Puntos',
      qbrating: 'QB Rating',
      recepciones: 'Recepciones',
      tackleos: 'Tackleos',
      intercepciones: 'Intercepciones'
    };

    return (
      <Box sx={{ mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          {iconMap[categoria]}
          <Typography variant="caption" sx={{ 
            color: 'rgba(255,255,255,0.8)', 
            fontSize: '0.7rem',
            fontWeight: 600
          }}>
            {categoryLabels[categoria]}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {lideresData.slice(0, 3).map((lider, index) => (
            <Tooltip 
              key={index}
              title={`${lider.jugador.nombre} #${lider.jugador.numero} - ${lider.valor} ${categoryLabels[categoria]}`}
              arrow
            >
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                position: 'relative'
              }}>
                <Avatar
                  src={lider.jugador.imagen ? useImage(lider.jugador.imagen) : null}
                  sx={{
                    width: index === 0 ? 30 : 26,
                    height: index === 0 ? 30 : 26,
                    border: index === 0 ? '2px solid #ffd700' : '1px solid rgba(255,255,255,0.3)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    fontSize: '0.6rem',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }}
                >
                  {lider.jugador.numero}
                </Avatar>
                <Typography variant="caption" sx={{ 
                  color: 'rgba(255,255,255,0.9)', 
                  fontSize: '0.55rem',
                  fontWeight: 'bold',
                  mt: 0.3
                }}>
                  {lider.valor}
                </Typography>
                {index === 0 && (
                  <Box sx={{
                    position: 'absolute',
                    top: -3,
                    right: -3,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    backgroundColor: '#ffd700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.5rem'
                  }}>
                    👑
                  </Box>
                )}
              </Box>
            </Tooltip>
          ))}
        </Box>
      </Box>
    );
  };

  // 🔥 NUEVO: Mini-Card de Líder Individual (con nombre del jugador)
  const MiniCardLider = ({ categoria, lider, color, icon }) => {
    if (!lider) return null;

    return (
      <Tooltip 
        title={`${lider.jugador.nombre} #${lider.jugador.numero} - ${lider.valor} ${categoria}`}
        arrow
      >
        <Box sx={{ 
          flex: 1, // Se adapta al espacio disponible
          minWidth: 0, // Permite que se comprima
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.4,
          p: 0.8,
          borderRadius: 1.5,
          backgroundColor: 'rgba(255,255,255,0.05)',
          border: `1px solid ${color}40`,
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.08)',
            border: `1px solid ${color}60`,
            transform: 'translateY(-2px)'
          }
        }}>
          {/* Encabezado de la estadística */}
          <Typography variant="caption" sx={{ 
            color: color,
            fontSize: '0.55rem',
            fontWeight: 600,
            textAlign: 'center',
            lineHeight: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%'
          }}>
            {categoria}
          </Typography>

          {/* Avatar del líder */}
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={lider.jugador.imagen ? useImage(lider.jugador.imagen) : null}
              sx={{
                width: 26,
                height: 26,
                border: `2px solid ${color}`,
                boxShadow: `0 2px 8px ${color}40`,
                fontSize: '0.55rem',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }}
            >
              {lider.jugador.numero}
            </Avatar>
            {/* Corona para el líder */}
            <Box sx={{
              position: 'absolute',
              top: -3,
              right: -3,
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#ffd700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.5rem'
            }}>
              👑
            </Box>
          </Box>

          {/* Nombre del jugador */}
          <Typography variant="caption" sx={{ 
            color: 'white', 
            fontSize: '0.5rem',
            fontWeight: 600,
            textAlign: 'center',
            lineHeight: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%',
            maxWidth: '100%'
          }}>
            {lider.jugador.nombre.split(' ')[0]} {/* Solo primer nombre */}
          </Typography>

          {/* Valor de la estadística */}
          <Typography variant="caption" sx={{ 
            color: color, 
            fontSize: '0.65rem',
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            {lider.valor}
          </Typography>
        </Box>
      </Tooltip>
    );
  };

  // 📊 Número del usuario en el equipo
  const numeroUsuarioEquipo = usuario?.numeroJugador || equipo?.numeroUsuario || equipo?.jugadores?.find(j => j.usuario === usuario?._id)?.numero || '?';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        ease: [0.16, 1, 0.3, 1],
        delay: 0.1 
      }}
      whileHover={{ 
        y: -4,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
    >
      <Box
        sx={{
          background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 3,
          p: 2.5,
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          height: 380, // 🔥 ALTURA AUMENTADA PARA MEJOR ESPACIO
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
          }
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Efectos de fondo */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at 20% 20%, rgba(64, 181, 246, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 80% 80%, rgba(156, 39, 176, 0.1) 0%, transparent 50%)`,
            pointerEvents: 'none'
          }}
        />

        {/* Header de la tarjeta */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, position: 'relative', zIndex: 1 }}>
          {/* Avatar del equipo */}
          <Avatar
            src={equipoImageUrl}
            sx={{
              width: 50,
              height: 50,
              border: '2px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
              fontSize: '1.2rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }}
          >
            {equipo?.nombre?.charAt(0)}
          </Avatar>

          {/* Info del equipo */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ 
              color: 'white', 
              fontWeight: 700,
              fontSize: '1.1rem',
              mb: 0.5,
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              {equipo?.nombre}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={getCategoryName(equipo?.categoria)}
                size="small"
                sx={{
                  backgroundColor: 'rgba(64, 181, 246, 0.2)',
                  color: '#40b5f6',
                  fontSize: '0.65rem',
                  height: 20,
                  border: '1px solid rgba(64, 181, 246, 0.3)'
                }}
              />
              
              <Chip
                label={`#${numeroUsuarioEquipo}`}
                size="small"
                sx={{
                  backgroundColor: 'rgba(255, 193, 7, 0.2)',
                  color: '#ffc107',
                  fontSize: '0.65rem',
                  height: 20,
                  border: '1px solid rgba(255, 193, 7, 0.3)'
                }}
              />
            </Box>
          </Box>

          {/* Expand button */}
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              width: 32,
              height: 32,
              '&:hover': { 
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white'
              }
            }}
          >
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>

        {/* Estadísticas principales compactas */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
          </Box>
        ) : (
          <>
            {/* Estadísticas principales con estilo glassmorphism - UNA SOLA FILA */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 1fr)', 
              gap: 1, 
              mb: 2.5,
              position: 'relative',
              zIndex: 1
            }}>
              {/* Récord W-L */}
              <Box sx={{
                textAlign: 'center',
                p: 1,
                borderRadius: 2,
                background: `linear-gradient(145deg, ${getWinPercentageColor(estadisticas?.porcentajeVictorias || 0)}20, ${getWinPercentageColor(estadisticas?.porcentajeVictorias || 0)}10)`,
                border: `1px solid ${getWinPercentageColor(estadisticas?.porcentajeVictorias || 0)}40`,
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: `linear-gradient(145deg, ${getWinPercentageColor(estadisticas?.porcentajeVictorias || 0)}30, ${getWinPercentageColor(estadisticas?.porcentajeVictorias || 0)}15)`,
                  transform: 'translateY(-2px)'
                }
              }}>
                <Typography variant="h6" sx={{ 
                  color: getWinPercentageColor(estadisticas?.porcentajeVictorias || 0),
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  mb: 0.3
                }}>
                  {estadisticas?.partidosGanados || 0}-{estadisticas?.partidosPerdidos || 0}
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: 'rgba(255,255,255,0.9)', 
                  fontSize: '0.6rem',
                  fontWeight: 600,
                  display: 'block'
                }}>
                  Récord W-L
                </Typography>
              </Box>

              {/* Porcentaje de victorias */}
              <Box sx={{
                textAlign: 'center',
                p: 1,
                borderRadius: 2,
                background: 'linear-gradient(145deg, rgba(64, 181, 246, 0.2), rgba(64, 181, 246, 0.1))',
                border: '1px solid rgba(64, 181, 246, 0.4)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(145deg, rgba(64, 181, 246, 0.3), rgba(64, 181, 246, 0.15))',
                  transform: 'translateY(-2px)'
                }
              }}>
                <Typography variant="h6" sx={{ 
                  color: '#40b5f6',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  mb: 0.3
                }}>
                  {estadisticas?.porcentajeVictorias || 0}%
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: 'rgba(255,255,255,0.9)', 
                  fontSize: '0.6rem',
                  fontWeight: 600,
                  display: 'block'
                }}>
                  % Victorias
                </Typography>
              </Box>

              {/* Puntos promedio */}
              <Box sx={{
                textAlign: 'center',
                p: 1,
                borderRadius: 2,
                background: 'linear-gradient(145deg, rgba(255, 152, 0, 0.2), rgba(255, 152, 0, 0.1))',
                border: '1px solid rgba(255, 152, 0, 0.4)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(145deg, rgba(255, 152, 0, 0.3), rgba(255, 152, 0, 0.15))',
                  transform: 'translateY(-2px)'
                }
              }}>
                <Typography variant="h6" sx={{ 
                  color: '#ff9800',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  mb: 0.3
                }}>
                  {estadisticas?.promedioPuntosPorPartido || 0}
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: 'rgba(255,255,255,0.9)', 
                  fontSize: '0.6rem',
                  fontWeight: 600,
                  display: 'block'
                }}>
                  Pts/Juego
                </Typography>
              </Box>

              {/* Posición en liga */}
              <Box sx={{
                textAlign: 'center',
                p: 1,
                borderRadius: 2,
                background: `linear-gradient(145deg, ${getPositionColor(estadisticas?.posicionLiga, estadisticas?.totalEquipos)}20, ${getPositionColor(estadisticas?.posicionLiga, estadisticas?.totalEquipos)}10)`,
                border: `1px solid ${getPositionColor(estadisticas?.posicionLiga, estadisticas?.totalEquipos)}40`,
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: `linear-gradient(145deg, ${getPositionColor(estadisticas?.posicionLiga, estadisticas?.totalEquipos)}30, ${getPositionColor(estadisticas?.posicionLiga, estadisticas?.totalEquipos)}15)`,
                  transform: 'translateY(-2px)'
                }
              }}>
                <Typography variant="h6" sx={{ 
                  color: getPositionColor(estadisticas?.posicionLiga, estadisticas?.totalEquipos),
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  mb: 0.3
                }}>
                  {estadisticas?.posicionLiga || '?'}°
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: 'rgba(255,255,255,0.9)', 
                  fontSize: '0.6rem',
                  fontWeight: 600,
                  display: 'block'
                }}>
                  Posición Liga
                </Typography>
              </Box>
            </Box>

            {/* Racha de resultados estilizada */}
            {estadisticas?.rachaActual?.length > 0 && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: 1, 
                mb: 2,
                p: 1.5,
                borderRadius: 2,
                background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                position: 'relative',
                zIndex: 1
              }}>
                <Typography variant="caption" sx={{ 
                  color: 'rgba(255,255,255,0.8)', 
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  mr: 1
                }}>
                  Últimos resultados:
                </Typography>
                {getStreakDisplay(estadisticas.rachaActual)}
              </Box>
            )}

            {/* Error */}
            {error && (
              <Alert severity="warning" sx={{ mb: 2, fontSize: '0.65rem' }}>
                {error}
              </Alert>
            )}

            {/* Indicador de datos dummy */}
            {!torneoId && (
              <Alert severity="info" sx={{ mb: 2, fontSize: '0.65rem', opacity: 0.8 }}>
                📊 Datos de ejemplo - Selecciona un torneo para estadísticas reales
              </Alert>
            )}

            {/* 🏆 FILA HORIZONTAL DE LÍDERES - UNA SOLA FILA CON MINI-CARDS */}
            {lideres && Object.keys(lideres).some(cat => lideres[cat]?.length > 0) && (
              <Box sx={{ 
                position: 'relative', 
                zIndex: 1,
                mt: 1.5,
                flex: 1, // Toma el espacio restante
                display: 'flex',
                flexDirection: 'column'
              }}>
                <Typography variant="subtitle2" sx={{ 
                  color: 'white', 
                  mb: 1, 
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}>
                  <TrophyIcon sx={{ fontSize: 12, color: '#ffd700' }} />
                  Líderes del Equipo
                </Typography>

                {/* FILA HORIZONTAL DE MINI-CARDS */}
                <Box sx={{ 
                  display: 'flex',
                  gap: 0.8,
                  overflow: 'hidden', // Para que no se desborde
                  flex: 1
                }}>
                  {/* Mini-card Puntos */}
                  {lideres.puntos && lideres.puntos.length > 0 && (
                    <MiniCardLider 
                      categoria="Puntos"
                      lider={lideres.puntos[0]}
                      color="#ffd700"
                      icon="⭐"
                    />
                  )}
                  
                  {/* Mini-card QB Rating */}
                  {lideres.qbrating && lideres.qbrating.length > 0 && (
                    <MiniCardLider 
                      categoria="QB Rating"
                      lider={lideres.qbrating[0]}
                      color="#2196f3"
                      icon="🏈"
                    />
                  )}

                  {/* Mini-card Recepciones */}
                  {lideres.recepciones && lideres.recepciones.length > 0 && (
                    <MiniCardLider 
                      categoria="Recepciones"
                      lider={lideres.recepciones[0]}
                      color="#ff9800"
                      icon="🏆"
                    />
                  )}

                  {/* Mini-card Tackleos */}
                  {lideres.tackleos && lideres.tackleos.length > 0 && (
                    <MiniCardLider 
                      categoria="Tackleos"
                      lider={lideres.tackleos[0]}
                      color="#9c27b0"
                      icon="💪"
                    />
                  )}

                  {/* Mini-card Intercepciones */}
                  {lideres.intercepciones && lideres.intercepciones.length > 0 && (
                    <MiniCardLider 
                      categoria="Intercepciones"
                      lider={lideres.intercepciones[0]}
                      color="#e91e63"
                      icon="🛡️"
                    />
                  )}
                </Box>
              </Box>
            )}
          </>
        )}

        {/* Contenido expandible */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 10,
                background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06))',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderTop: 'none',
                borderRadius: '0 0 12px 12px',
                padding: '16px'
              }}
            >
              {/* Estadísticas adicionales */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: 1.5, 
                mb: 2
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body1" sx={{ 
                    color: '#4caf50', 
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}>
                    {estadisticas?.touchdowns || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: 'rgba(255,255,255,0.7)', 
                    fontSize: '0.6rem' 
                  }}>
                    Touchdowns
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body1" sx={{ 
                    color: '#e91e63', 
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}>
                    {estadisticas?.intercepciones || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: 'rgba(255,255,255,0.7)', 
                    fontSize: '0.6rem' 
                  }}>
                    Intercepciones
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body1" sx={{ 
                    color: '#9c27b0', 
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}>
                    {estadisticas?.sacks || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: 'rgba(255,255,255,0.7)', 
                    fontSize: '0.6rem' 
                  }}>
                    Sacks
                  </Typography>
                </Box>
              </Box>

              {/* Todos los líderes expandidos */}
              {lideres && Object.keys(lideres).some(cat => lideres[cat]?.length > 0) && (
                <Box>
                  <Typography variant="subtitle2" sx={{ 
                    color: 'white', 
                    mb: 1.5, 
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}>
                    <TrophyIcon sx={{ fontSize: 16, color: '#ffd700' }} />
                    Todos los Líderes
                  </Typography>

                  <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 1.5
                  }}>
                    {Object.entries(lideres).map(([categoria, lideresData]) => (
                      <LideresCategoria 
                        key={categoria}
                        categoria={categoria}
                        lideresData={lideresData}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </motion.div>
  );
};

export default TeamCardGlass;