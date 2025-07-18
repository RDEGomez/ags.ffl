import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Tooltip,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  IconButton,
  Collapse
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  SportsFootball as FootballIcon,
  TrendingUp as TrendingUpIcon,
  SportsMma as TackleIcon,
  Timeline as TimelineIcon,
  Star as StarIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Shield as ShieldIcon 
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useLideresPartido } from '../hooks/useLideresPartido';
import { useImage } from '../hooks/useImage';

// 🎨 Configuración de categorías con íconos y colores
const categoriasConfig = {
  puntos: {
    label: 'Puntos',
    icon: <StarIcon sx={{ fontSize: 16 }} />,
    color: '#ffd700',
    bgColor: 'rgba(255, 215, 0, 0.1)',
    description: 'Jugadores con más puntos anotados'
  },
  qbrating: {
    label: 'QB Rating',
    icon: <FootballIcon sx={{ fontSize: 16 }} />,
    color: '#2196f3',
    bgColor: 'rgba(33, 150, 243, 0.1)',
    description: 'Mejor rating de quarterback'
  },
  recepciones: {
    label: 'Recepciones',
    icon: <TrophyIcon sx={{ fontSize: 16 }} />,
    color: '#ff9800',
    bgColor: 'rgba(255, 152, 0, 0.1)',
    description: 'Más recepciones completadas'
  },
  tackleos: {
    label: 'Tackleos',
    icon: <TackleIcon sx={{ fontSize: 16 }} />,
    color: '#9c27b0',
    bgColor: 'rgba(156, 39, 176, 0.1)',
    description: 'Más tackleos defensivos'
  },
  intercepciones: {
    label: 'Intercepciones',
    icon: <TimelineIcon sx={{ fontSize: 16 }} />,
    color: '#e91e63',
    bgColor: 'rgba(233, 30, 99, 0.1)',
    description: 'Más intercepciones realizadas'
  },
  sacks: {
    label: 'Sacks',
    icon: <ShieldIcon sx={{ fontSize: 16 }} />,
    color: '#f44336',
    bgColor: 'rgba(244, 67, 54, 0.1)',
    description: 'Más capturas al quarterback'
  }
};

// 🏆 Componente individual de líder
const LiderCard = ({ lider, posicion, categoria, expandido = false }) => {
  const jugadorImageUrl = useImage(lider.jugador?.imagen);
  const equipoImageUrl = useImage(lider.equipo?.imagen);
  const config = categoriasConfig[categoria];

  const esPrimero = posicion === 0;
  const esSegundo = posicion === 1;
  const esTercero = posicion === 2;

  // 🏅 Obtener color y símbolo de posición
  const getPosicionInfo = () => {
    if (esPrimero) return { color: '#ffd700', symbol: '🥇', size: expandido ? 52 : 44 };
    if (esSegundo) return { color: '#c0c0c0', symbol: '🥈', size: expandido ? 48 : 40 };
    if (esTercero) return { color: '#cd7f32', symbol: '🥉', size: expandido ? 44 : 36 };
    return { color: '#64b5f6', symbol: '', size: expandido ? 40 : 32 };
  };

  const posicionInfo = getPosicionInfo();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: posicion * 0.1 }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: expandido ? 2 : 1.5,
          p: expandido ? 2 : 1.5,
          borderRadius: 2,
          backgroundColor: esPrimero ? 'rgba(255, 215, 0, 0.05)' : 'rgba(255, 255, 255, 0.03)',
          border: `1px solid ${esPrimero ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`,
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            backgroundColor: esPrimero ? 'rgba(255, 215, 0, 0.08)' : 'rgba(255, 255, 255, 0.05)',
            transform: expandido ? 'translateY(-2px)' : 'none',
            boxShadow: expandido ? '0 4px 20px rgba(0,0,0,0.3)' : 'none'
          }
        }}
      >
        {/* 🌟 Efecto de brillo para el primer lugar */}
        {esPrimero && expandido && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.1), transparent)',
              animation: 'shimmer 2s infinite',
              '@keyframes shimmer': {
                '0%': { left: '-100%' },
                '100%': { left: '100%' }
              }
            }}
          />
        )}

        {/* 🏅 Posición */}
        <Box sx={{ 
          minWidth: expandido ? 32 : 24, 
          textAlign: 'center',
          position: 'relative'
        }}>
          <Typography
            variant={expandido ? "h5" : "body1"}
            sx={{
              color: posicionInfo.color,
              fontWeight: 'bold',
              fontSize: expandido ? '1.5rem' : '1rem'
            }}
          >
            {posicionInfo.symbol || `#${posicion + 1}`}
          </Typography>
        </Box>

        {/* 👤 Avatar del jugador */}
        <Box sx={{ position: 'relative' }}>
          <Avatar
            src={jugadorImageUrl}
            sx={{
              width: posicionInfo.size,
              height: posicionInfo.size,
              border: `2px solid ${posicionInfo.color}`,
              boxShadow: `0 2px 8px rgba(0,0,0,0.3)`,
              fontSize: expandido ? '1rem' : '0.8rem',
              backgroundColor: 'rgba(255,255,255,0.1)'
            }}
          >
            #{lider.jugador?.numero || '?'}
          </Avatar>
          
          {/* 🏈 Badge del equipo */}
          <Avatar
            src={equipoImageUrl}
            sx={{
              width: expandido ? 20 : 16,
              height: expandido ? 20 : 16,
              position: 'absolute',
              bottom: -2,
              right: -2,
              border: '1px solid rgba(255,255,255,0.3)',
              backgroundColor: 'rgba(0,0,0,0.7)'
            }}
          />
        </Box>

        {/* 📝 Información del jugador */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant={expandido ? "body1" : "body2"}
            sx={{
              color: 'white',
              fontWeight: esPrimero ? 'bold' : 'medium',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: expandido ? '1rem' : '0.875rem'
            }}
          >
            {lider.jugador?.nombre}
          </Typography>
          
          {expandido && (
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255,255,255,0.7)',
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {lider.equipo?.nombre} • #{lider.jugador?.numero}
            </Typography>
          )}
        </Box>

        {/* 📊 Valor de la estadística */}
        <Box sx={{ textAlign: 'right' }}>
          <Typography
            variant={expandido ? "h6" : "body1"}
            sx={{
              color: config.color,
              fontWeight: 'bold',
              fontSize: expandido ? '1.25rem' : '1rem'
            }}
          >
            {categoria === 'qbrating' ? lider.valor.toFixed(1) : lider.valor}
          </Typography>
          
          {expandido && (
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255,255,255,0.6)',
                display: 'block'
              }}
            >
              {config.label}
            </Typography>
          )}
        </Box>
      </Box>
    </motion.div>
  );
};

// 🏆 Componente de categoría de líderes
const CategoriaLideres = ({ categoria, lideres, expandido, onToggle }) => {
  const config = categoriasConfig[categoria];
  const tieneLideres = lideres && lideres.length > 0;

  return (
    <Paper
      sx={{
        p: 2,
        backgroundColor: config.bgColor,
        border: `1px solid ${config.color}40`,
        borderRadius: 2,
        transition: 'all 0.3s ease'
      }}
    >
      {/* 📋 Header de la categoría */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: tieneLideres ? 2 : 0,
          cursor: tieneLideres ? 'pointer' : 'default'
        }}
        onClick={tieneLideres ? onToggle : undefined}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ color: config.color }}>
            {config.icon}
          </Box>
          <Typography
            variant="h6"
            sx={{
              color: config.color,
              fontWeight: 'bold',
              fontSize: '1rem'
            }}
          >
            {config.label}
          </Typography>
        </Box>

        {tieneLideres && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={lideres.length}
              size="small"
              sx={{
                backgroundColor: config.color,
                color: 'black',
                fontWeight: 'bold',
                minWidth: 24,
                height: 20
              }}
            />
            <IconButton size="small" sx={{ color: config.color }}>
              {expandido ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        )}
      </Box>

      {/* 📊 Lista de líderes */}
      {tieneLideres ? (
        <Collapse in={expandido}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {lideres.map((lider, index) => (
              <LiderCard
                key={`${categoria}-${lider.jugador?._id}-${index}`}
                lider={lider}
                posicion={index}
                categoria={categoria}
                expandido={expandido}
              />
            ))}
          </Box>
        </Collapse>
      ) : (
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(255,255,255,0.6)',
            textAlign: 'center',
            fontStyle: 'italic'
          }}
        >
          Sin estadísticas registradas
        </Typography>
      )}
    </Paper>
  );
};

// 🎯 Componente principal - CORREGIDO PARA NUEVA ESTRUCTURA
export const LideresPartido = ({ partidoId }) => {
  const [categoriasExpandidas, setCategoriasExpandidas] = useState({
    puntos: true,
    qbrating: true, // 🔥 Expandir QB rating por defecto para testing
    recepciones: true,
    tackleos: true,
    intercepciones: true,
    sacks: true
  });

  const { lideres, loading, error, recargar } = useLideresPartido(partidoId);

  // 🔄 Toggle de categoría
  const toggleCategoria = (categoria) => {
    setCategoriasExpandidas(prev => ({
      ...prev,
      [categoria]: !prev[categoria]
    }));
  };

  // 🔄 Expandir/Colapsar todas
  const toggleTodas = (expandir) => {
    const nuevoEstado = {};
    Object.keys(categoriasConfig).forEach(cat => {
      nuevoEstado[cat] = expandir;
    });
    setCategoriasExpandidas(nuevoEstado);
  };

  // 🔍 DEBUG: Mostrar datos en consola
  React.useEffect(() => {
    if (lideres) {
      console.log('🏆 DEBUG - Líderes recibidos:', lideres);
      console.log('🔍 DEBUG - Estructura de datos:', {
        qbrating: lideres.qbrating?.length || 0,
        puntos: lideres.puntos?.length || 0,
        tackleos: lideres.tackleos?.length || 0,
        intercepciones: lideres.intercepciones?.length || 0,
        recepciones: lideres.recepciones?.length || 0
      });
    }
  }, [lideres]);

  // 🚨 Estados de carga y error
  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress sx={{ color: '#64b5f6', mb: 2 }} />
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          Cargando líderes del partido...
        </Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ 
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          color: '#f44336',
          border: '1px solid rgba(244, 67, 54, 0.3)'
        }}
        action={
          <IconButton size="small" onClick={recargar} sx={{ color: '#f44336' }}>
            <TrendingUpIcon />
          </IconButton>
        }
      >
        {error}
      </Alert>
    );
  }

  if (!lideres || Object.keys(lideres).length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <TrophyIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)', mb: 2 }} />
        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
          Sin Líderes de Estadísticas
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          Este partido aún no tiene jugadas registradas
        </Typography>
      </Paper>
    );
  }

  // 📊 Contar líderes totales
  const totalLideres = Object.values(lideres).reduce((total, categoria) => 
    total + (categoria?.length || 0), 0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Paper sx={{
        p: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 3
      }}>
        {/* 📋 Header principal */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          mb: 3 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TrophyIcon sx={{ color: '#ffd700', fontSize: 28 }} />
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
              Líderes del Partido
            </Typography>
            <Chip
              label={`${totalLideres} líderes`}
              size="small"
              sx={{
                backgroundColor: 'rgba(255, 215, 0, 0.2)',
                color: '#ffd700',
                fontWeight: 'bold'
              }}
            />
          </Box>

          {/* 🎮 Controles */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Expandir todas">
              <IconButton
                size="small"
                onClick={() => toggleTodas(true)}
                sx={{ color: 'rgba(255,255,255,0.7)' }}
              >
                <ExpandMoreIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Colapsar todas">
              <IconButton
                size="small"
                onClick={() => toggleTodas(false)}
                sx={{ color: 'rgba(255,255,255,0.7)' }}
              >
                <ExpandLessIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* 🔍 DEBUG INFO - Remover en producción */}
        {process.env.NODE_ENV === 'development' && (
          <Box sx={{ mb: 2, p: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              DEBUG: {Object.entries(lideres).map(([cat, items]) => 
                `${cat}: ${items?.length || 0}`
              ).join(', ')}
            </Typography>
          </Box>
        )}

        {/* 📊 Grid de categorías */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 2
        }}>
          {Object.entries(categoriasConfig).map(([categoria]) => (
            <CategoriaLideres
              key={categoria}
              categoria={categoria}
              lideres={lideres[categoria] || []}
              expandido={categoriasExpandidas[categoria]}
              onToggle={() => toggleCategoria(categoria)}
            />
          ))}
        </Box>

        {/* 📝 Footer informativo */}
        <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255,255,255,0.6)',
            textAlign: 'center',
            display: 'block'
          }}
        >
          Estadísticas calculadas únicamente para este partido • 
          Solo se muestran jugadores con registros positivos
        </Typography>
      </Paper>
    </motion.div>
  );
};