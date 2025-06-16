// 📁 src/pages/estadisticas/components/LideresEstadisticas.jsx

import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Sports,
  Shield,
  Bolt,
  PanTool,
  SportsFootball,
  LocalFireDepartment,
  Star,
  EmojiEvents
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// 🔥 FUNCIÓN HELPER PARA IMÁGENES
const getImageUrl = (imagen) => {
  if (!imagen) return '';
  if (typeof imagen !== 'string') return '';
  
  if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
    return imagen;
  }
  
  const API_URL = import.meta.env.VITE_BACKEND_URL || '';
  return `${API_URL}/uploads/${imagen}`;
};

// 🎨 ANIMACIONES
const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
      duration: 0.6
    }
  },
  hover: {
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  }
};

// 🏆 COMPONENTE INDIVIDUAL DE LÍDER
const LiderCard = ({ tipo, titulo, icono, color, lider, equipoSeleccionado, loading }) => {
  // 📊 OBTENER VALOR Y UNIDAD SEGÚN TIPO
  const obtenerValorYUnidad = () => {
    if (!lider?.estadisticas) return { valor: 0, unidad: '' };
    
    switch (tipo) {
      case 'pases':
        return { valor: lider.estadisticas.pases?.completados || 0, unidad: 'pases' };
      case 'puntos':
        return { valor: lider.estadisticas.puntos || 0, unidad: 'puntos' };
      case 'tackleos':
        return { valor: lider.estadisticas.tackleos || 0, unidad: 'tackleos' };
      case 'intercepciones':
        return { valor: lider.estadisticas.intercepciones || 0, unidad: 'ints' };
      case 'sacks':
        return { valor: lider.estadisticas.sacks || 0, unidad: 'sacks' };
      case 'recepciones':
        return { valor: lider.estadisticas.recepciones || 0, unidad: 'rec' };
      default:
        return { valor: 0, unidad: '' };
    }
  };

  // 🏆 OBTENER ICONO DE POSICIÓN
  const obtenerIconoPosicion = (posicion) => {
    switch (posicion) {
      case 1:
        return <EmojiEvents sx={{ color: '#ffd700', fontSize: '1.2rem' }} />;
      case 2:
        return <EmojiEvents sx={{ color: '#c0c0c0', fontSize: '1.2rem' }} />;
      case 3:
        return <EmojiEvents sx={{ color: '#cd7f32', fontSize: '1.2rem' }} />;
      default:
        return <Star sx={{ color: '#64b5f6', fontSize: '1.2rem' }} />;
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      style={{ height: '100%' }}
    >
      <Box
        sx={{
          height: '180px',
          width: '100%', // Asegurar que tome el ancho completo
          background: `linear-gradient(145deg, ${color}15, ${color}08)`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${color}30`,
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            border: `1px solid ${color}60`,
            background: `linear-gradient(145deg, ${color}25, ${color}12)`,
            boxShadow: `0 8px 32px ${color}20`
          }
        }}
      >
        {/* Efectos de fondo animados */}
        <motion.div
          animate={{
            background: [
              `radial-gradient(circle at 30% 30%, ${color}10 0%, transparent 50%)`,
              `radial-gradient(circle at 70% 70%, ${color}15 0%, transparent 50%)`,
              `radial-gradient(circle at 30% 30%, ${color}10 0%, transparent 50%)`
            ]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none'
          }}
        />
        
        {/* Header */}
        <Box sx={{
          p: 1.5,
          background: `linear-gradient(135deg, ${color}20, ${color}10)`,
          borderBottom: `1px solid ${color}25`,
          position: 'relative'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <motion.div
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {React.cloneElement(icono, {
                  sx: {
                    color: color,
                    fontSize: '1.1rem',
                    filter: `drop-shadow(0 0 6px ${color}60)`
                  }
                })}
              </motion.div>
              <Typography 
                variant="caption" 
                sx={{
                  fontWeight: 700,
                  color: 'white',
                  textShadow: `0 1px 4px ${color}40`,
                  fontSize: '0.65rem',
                  letterSpacing: '0.3px'
                }}
              >
                {titulo}
              </Typography>
            </Box>
            
            {lider && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {obtenerIconoPosicion(lider.posicion)}
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.6rem'
                  }}
                >
                  #{lider.posicion}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Contenido */}
        <Box sx={{ 
          p: 2, 
          pb: 3, // Padding bottom específico más grande
          height: 'calc(100% - 50px)', 
          position: 'relative', 
          display: 'flex', 
          flexDirection: 'column' 
        }}>
          <AnimatePresence mode="wait">
            {loading ? (
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: 1
              }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <CircularProgress 
                    size={30} 
                    thickness={4} 
                    sx={{ color: color }} 
                  />
                </motion.div>
                <Typography variant="caption" sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.6rem'
                }}>
                  Buscando...
                </Typography>
              </Box>
            ) : !equipoSeleccionado ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ height: '100%' }}
              >
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  textAlign: 'center'
                }}>
                  <motion.div
                    animate={{ 
                      opacity: [0.3, 0.7, 0.3],
                      scale: [0.9, 1, 0.9]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Star sx={{ 
                      fontSize: 32, 
                      color: `${color}60`,
                      filter: `drop-shadow(0 0 8px ${color}30)`
                    }} />
                  </motion.div>
                  <Typography variant="caption" sx={{ 
                    color: 'rgba(255, 255, 255, 0.6)', 
                    mt: 1,
                    fontSize: '0.65rem'
                  }}>
                    Selecciona un equipo
                  </Typography>
                </Box>
              </motion.div>
            ) : !lider ? (
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center'
              }}>
                <Typography variant="caption" sx={{ 
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.65rem'
                }}>
                  Sin datos
                </Typography>
              </Box>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{ height: '100%' }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {/* Avatar y datos del jugador */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Avatar 
                        src={getImageUrl(lider.jugador?.imagen)} 
                        sx={{ 
                          width: 36, 
                          height: 36,
                          border: `2px solid ${color}60`,
                          boxShadow: `0 0 8px ${color}30`,
                          background: `linear-gradient(145deg, ${color}20, ${color}10)`
                        }}
                      >
                        {lider.jugador?.nombre?.charAt(0) || '?'}
                      </Avatar>
                    </motion.div>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 700,
                          color: 'white',
                          textShadow: `0 1px 3px ${color}40`,
                          fontSize: '0.8rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          mb: 0.5,
                          lineHeight: 1.2
                        }}
                      >
                        {lider.jugador?.nombre || 'Sin nombre'}
                      </Typography>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                      >
                        <Chip 
                          label={`#${lider.jugador?.numero || '0'}`}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.6rem',
                            height: 18,
                            background: `${color}40`,
                            color: 'white',
                            border: `1px solid ${color}60`,
                            '& .MuiChip-label': { px: 0.5 }
                          }}
                        />
                      </motion.div>
                    </Box>
                  </Box>
                  
                  {/* Estadística principal */}
                  <Box sx={{ 
                    textAlign: 'center', 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center'
                  }}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          fontWeight: 900,
                          color: color,
                          textShadow: `0 0 12px ${color}60`,
                          fontSize: '2rem',
                          lineHeight: 1,
                          mb: 0.5
                        }}
                      >
                        {obtenerValorYUnidad().valor}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.8)',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase',
                          display: 'block',
                          mb: 1.5
                        }}
                      >
                        {obtenerValorYUnidad().unidad}
                      </Typography>
                    </motion.div>
                    
                    {/* Información adicional según tipo */}
                    {tipo === 'pases' && lider.estadisticas?.pases?.touchdowns > 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Chip 
                          label={`${lider.estadisticas.pases.touchdowns} TDs`}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.6rem',
                            height: 18,
                            background: 'linear-gradient(45deg, #ffd700, #ffed4e)',
                            color: '#000',
                            boxShadow: '0 2px 6px rgba(255, 215, 0, 0.4)',
                            mb: 1
                          }}
                        />
                      </motion.div>
                    ) : (
                      // Para tarjetas sin TDs, agregar espaciador
                      <Box sx={{ mb: 1 }} />
                    )}
                    
                    {tipo === 'pases' && lider.estadisticas?.pases && lider.estadisticas.pases.intentos > 0 ? (
                      <Typography variant="caption" sx={{ 
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '0.6rem',
                        mb: 3 // Margin bottom grande en el último elemento
                      }}>
                        {Math.round((lider.estadisticas.pases.completados / lider.estadisticas.pases.intentos) * 100)}% precisión
                      </Typography>
                    ) : (
                      // Si no hay texto de precisión, agregar espaciador invisible para todas las tarjetas
                      <Box sx={{ mb: 3 }} />
                    )}
                  </Box>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </Box>
    </motion.div>
  );
};

// 🏆 COMPONENTE PRINCIPAL
export const LideresEstadisticas = ({ 
  lideresEstadisticas = {}, 
  equipoSeleccionado, 
  loading 
}) => {
  // 📊 CONFIGURACIÓN DE LÍDERES
  const tiposLideres = [
    {
      tipo: 'pases',
      titulo: 'MAESTRO DEL PASE',
      icono: <Sports />,
      color: '#64b5f6'
    },
    {
      tipo: 'puntos',
      titulo: 'REY DE PUNTOS',
      icono: <LocalFireDepartment />,
      color: '#ff9800'
    },
    {
      tipo: 'tackleos',
      titulo: 'MURALLA DEFENSIVA',
      icono: <Shield />,
      color: '#4caf50'
    },
    {
      tipo: 'intercepciones',
      titulo: 'CAZADOR DE PASES',
      icono: <PanTool />,
      color: '#00bcd4'
    },
    {
      tipo: 'sacks',
      titulo: 'DESTRUCTOR QB',
      icono: <Bolt />,
      color: '#f44336'
    },
    {
      tipo: 'recepciones',
      titulo: 'MANOS SEGURAS',
      icono: <SportsFootball />,
      color: '#9c27b0'
    }
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.05
          }
        }
      }}
      style={{ height: '100%' }}
    >
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        height: '100%',
        '@media (min-width: 600px)': {
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignContent: 'flex-start'
        }
      }}>
        {tiposLideres.map((config) => (
          <Box 
            key={config.tipo}
            sx={{
              width: '100%',
              '@media (min-width: 600px)': {
                width: 'calc(50% - 8px)', // 2 columnas en tablet
                flexShrink: 0
              },
              '@media (min-width: 900px)': {
                width: 'calc(33.333% - 12px)', // 3 columnas en desktop
                flexShrink: 0
              }
            }}
          >
            <LiderCard
              tipo={config.tipo}
              titulo={config.titulo}
              icono={config.icono}
              color={config.color}
              lider={lideresEstadisticas[config.tipo]?.[0]}
              equipoSeleccionado={equipoSeleccionado}
              loading={loading}
            />
          </Box>
        ))}
      </Box>
    </motion.div>
  );
};