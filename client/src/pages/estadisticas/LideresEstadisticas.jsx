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

// 🏆 COMPONENTE INDIVIDUAL DE LÍDER - ACTUALIZADO PARA QB RATING
const LiderCard = ({ tipo, titulo, icono, color, lider, equipoSeleccionado, loading }) => {
  // 📊 OBTENER VALOR Y UNIDAD SEGÚN TIPO - ACTUALIZADO CON QB RATING
  const obtenerValorYUnidad = () => {
    if (!lider?.estadisticas && !lider?.qbRatingData) return { valor: 0, unidad: '', extra: null };
    
    const stats = lider.estadisticas;
    
    switch (tipo) {
      case 'qbrating':
        // 🔥 NUEVO: QB Rating en lugar de pases
        return { 
          valor: lider.qbRatingData?.rating || lider.valor || 0, 
          unidad: 'rating',
          extra: lider.qbRatingData ? {
            completados: lider.qbRatingData.completados,
            intentos: lider.qbRatingData.intentos,
            porcentaje: lider.qbRatingData.porcentajeComplecion,
            touchdowns: lider.qbRatingData.touchdowns,
            intercepciones: lider.qbRatingData.intercepciones
          } : null
        };
      case 'puntos':
        return { 
          valor: stats?.puntos || lider.valor || 0, 
          unidad: 'puntos' 
        };
      case 'tackleos':
        return { 
          valor: stats?.tackleos || lider.valor || 0, 
          unidad: 'tackleos' 
        };
      case 'intercepciones':
        return { 
          valor: stats?.intercepciones || lider.valor || 0, 
          unidad: 'ints' 
        };
      case 'sacks':
        return { 
          valor: stats?.sacks || lider.valor || 0, 
          unidad: 'sacks' 
        };
      case 'recepciones':
        return { 
          valor: stats?.recepciones || lider.valor || 0, 
          unidad: 'rec' 
        };
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

  // 🎨 OBTENER COLOR DEL QB RATING
  const obtenerColorQBRating = (rating) => {
    if (rating >= 130) return '#4caf50'; // Verde - Excelente
    if (rating >= 110) return '#2196f3'; // Azul - Muy bueno
    if (rating >= 90) return '#ff9800';  // Naranja - Bueno
    if (rating >= 70) return '#ffeb3b';  // Amarillo - Regular
    return '#f44336'; // Rojo - Malo
  };

  const valorInfo = obtenerValorYUnidad();

  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      style={{ height: '100%' }}
    >
      <Box
        sx={{
          height: '180px',
          width: '100%',
          background: `linear-gradient(145deg, ${color}15, ${color}08)`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${color}30`,
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: `0 8px 32px ${color}25`,
            border: `1px solid ${color}50`,
          }
        }}
      >
        {/* Patrón de fondo */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 100,
            height: 100,
            opacity: 0.1,
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          }}
        />

        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            pb: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {icono}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: '0.9rem',
                color: color,
                textTransform: 'uppercase',
                letterSpacing: 0.5
              }}
            >
              {titulo}
            </Typography>
          </Box>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.7rem'
            }}
          >
            {equipoSeleccionado?.nombre || 'Equipo'}
          </Typography>
        </Box>

        {/* Contenido */}
        <Box sx={{ px: 2, pb: 2, height: 'calc(100% - 60px)' }}>
          <AnimatePresence mode="wait">
            {loading ? (
              <Box
                key="loading"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%'
                }}
              >
                <CircularProgress size={40} sx={{ color }} />
              </Box>
            ) : !lider ? (
              <Box
                key="no-data"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  textAlign: 'center'
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontStyle: 'italic'
                  }}
                >
                  Sin datos
                </Typography>
              </Box>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{ height: '100%' }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%'
                  }}
                >
                  {/* Avatar */}
                  <Avatar
                    src={getImageUrl(lider.jugador?.imagen)}
                    sx={{
                      width: 45,
                      height: 45,
                      mr: 2,
                      border: `2px solid ${color}40`,
                      boxShadow: `0 4px 12px ${color}30`
                    }}
                  >
                    {lider.jugador?.nombre?.charAt(0) || '?'}
                  </Avatar>

                  {/* Info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      {obtenerIconoPosicion(lider.posicion)}
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          color: 'white',
                          fontSize: '0.8rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {lider.jugador?.nombre || 'Jugador'}
                      </Typography>
                      <Chip
                        label={`#${lider.jugador?.numero || 0}`}
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          bgcolor: `${color}20`,
                          color: color,
                          minWidth: 'auto'
                        }}
                      />
                    </Box>

                    {/* Valor principal */}
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 900,
                        color: tipo === 'qbrating' ? obtenerColorQBRating(valorInfo.valor) : color,
                        fontSize: '1.4rem',
                        lineHeight: 1,
                        mb: 0.5
                      }}
                    >
                      {tipo === 'qbrating' ? Number(valorInfo.valor).toFixed(1) : valorInfo.valor}
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{
                          ml: 0.5,
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontSize: '0.6rem',
                          fontWeight: 400
                        }}
                      >
                        {valorInfo.unidad}
                      </Typography>
                    </Typography>

                    {/* Información específica para QB Rating */}
                    {tipo === 'qbrating' && valorInfo.extra && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Typography variant="caption" sx={{ 
                          color: 'rgba(255, 255, 255, 0.8)',
                          fontSize: '0.65rem',
                          display: 'block',
                          mb: 0.5
                        }}>
                          {valorInfo.extra.completados}/{valorInfo.extra.intentos} ({valorInfo.extra.porcentaje}%)
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
                          {valorInfo.extra.touchdowns > 0 && (
                            <Chip 
                              label={`${valorInfo.extra.touchdowns} TDs`}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.6rem',
                                height: 16,
                                background: 'linear-gradient(45deg, #4caf50, #81c784)',
                                color: '#fff',
                                boxShadow: '0 2px 6px rgba(76, 175, 80, 0.4)'
                              }}
                            />
                          )}
                          
                          {valorInfo.extra.intercepciones > 0 && (
                            <Chip 
                              label={`${valorInfo.extra.intercepciones} INTs`}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.6rem',
                                height: 16,
                                background: 'linear-gradient(45deg, #f44336, #ef5350)',
                                color: '#fff',
                                boxShadow: '0 2px 6px rgba(244, 67, 54, 0.4)'
                              }}
                            />
                          )}
                        </Box>
                      </motion.div>
                    )}

                    {/* Información adicional para puntos */}
                    {tipo === 'puntos' && lider.estadisticas?.puntos > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Chip 
                          label="Anotador"
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.6rem',
                            height: 18,
                            background: 'linear-gradient(45deg, #ff6b35, #f7931e)',
                            color: '#fff',
                            boxShadow: '0 2px 6px rgba(255, 107, 53, 0.4)',
                            mb: 1
                          }}
                        />
                      </motion.div>
                    )}

                    {/* Información adicional para recepciones */}
                    {tipo === 'recepciones' && lider.estadisticas?.recepciones > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Typography variant="caption" sx={{ 
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontSize: '0.6rem',
                          mb: 3
                        }}>
                          Receptor
                        </Typography>
                      </motion.div>
                    )}

                    {/* Espaciador para mantener altura consistente */}
                    {!(['qbrating', 'puntos', 'recepciones'].includes(tipo)) && (
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

// 🏆 COMPONENTE PRINCIPAL - CONFIGURACIÓN ACTUALIZADA CON QB RATING
export const LideresEstadisticas = ({ 
  lideresEstadisticas = {}, 
  equipoSeleccionado, 
  loading 
}) => {
  // 📊 CONFIGURACIÓN DE LÍDERES - ACTUALIZADA CON QB RATING
  const tiposLideres = [
    {
      tipo: 'qbrating',
      titulo: 'QB Rating',
      icono: <Sports sx={{ color: '#2196f3', fontSize: '1.1rem' }} />,
      color: '#2196f3'
    },
    {
      tipo: 'puntos',
      titulo: 'Puntos',
      icono: <LocalFireDepartment sx={{ color: '#ff6b35', fontSize: '1.1rem' }} />,
      color: '#ff6b35'
    },
    {
      tipo: 'recepciones',
      titulo: 'Recepciones',
      icono: <SportsFootball sx={{ color: '#4caf50', fontSize: '1.1rem' }} />,
      color: '#4caf50'
    },
    {
      tipo: 'tackleos',
      titulo: 'Tackleos',
      icono: <Shield sx={{ color: '#9c27b0', fontSize: '1.1rem' }} />,
      color: '#9c27b0'
    },
    {
      tipo: 'intercepciones',
      titulo: 'Intercepciones',
      icono: <PanTool sx={{ color: '#ff9800', fontSize: '1.1rem' }} />,
      color: '#ff9800'
    },
    {
      tipo: 'sacks',
      titulo: 'Sacks',
      icono: <Bolt sx={{ color: '#f44336', fontSize: '1.1rem' }} />,
      color: '#f44336'
    }
  ];

  return (
    <Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color: 'white',
          mb: 3,
          textAlign: 'center'
        }}
      >
        Líderes de Estadísticas
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 2,
          width: '100%'
        }}
      >
        {tiposLideres.map((config) => {
          const lideresDelTipo = lideresEstadisticas[config.tipo] || [];
          const lider = lideresDelTipo[0]; // Mostrar solo el #1

          return (
            <motion.div
              key={config.tipo}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              style={{ width: '100%' }}
            >
              <LiderCard
                {...config}
                lider={lider}
                equipoSeleccionado={equipoSeleccionado}
                loading={loading?.lideres || false}
              />
            </motion.div>
          );
        })}
      </Box>
    </Box>
  );
};