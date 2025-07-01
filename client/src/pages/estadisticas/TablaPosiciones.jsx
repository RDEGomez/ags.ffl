// 📁 src/pages/estadisticas/TablaPosiciones.jsx

import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  EmojiEvents,
  Star
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// 🔥 IMPORTS
import { 
  obtenerNombreCategoria, 
  obtenerColorCategoria
} from '../../helpers/categoriasUtils';

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
  }
};

const filaVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  },
  hover: {
    scale: 1.02,
    backgroundColor: 'rgba(64, 181, 246, 0.08)',
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  }
};

export const TablaPosiciones = ({ 
  tablaPosiciones = [], 
  categoriaSeleccionada, 
  loading, 
  onSeleccionEquipo 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // 🏆 FUNCIÓN PARA OBTENER ICONO DE POSICIÓN
  const obtenerIconoPosicion = (posicion) => {
    switch (posicion) {
      case 1:
        return <EmojiEvents sx={{ color: '#ffd700', fontSize: '1.5rem' }} />;
      case 2:
        return <EmojiEvents sx={{ color: '#c0c0c0', fontSize: '1.5rem' }} />;
      case 3:
        return <EmojiEvents sx={{ color: '#cd7f32', fontSize: '1.5rem' }} />;
      default:
        return null;
    }
  };

  // 🎨 FUNCIÓN PARA OBTENER COLOR DE FONDO DE POSICIÓN
  const obtenerColorPosicion = (posicion) => {
    switch (posicion) {
      case 1:
        return 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 215, 0, 0.05))';
      case 2:
        return 'linear-gradient(135deg, rgba(192, 192, 192, 0.15), rgba(192, 192, 192, 0.05))';
      case 3:
        return 'linear-gradient(135deg, rgba(205, 127, 50, 0.15), rgba(205, 127, 50, 0.05))';
      default:
        return 'linear-gradient(135deg, rgba(64, 181, 246, 0.08), rgba(64, 181, 246, 0.03))';
    }
  };

  // 📱 COLUMNAS RESPONSIVAS - SIMPLIFICADAS
  const columnas = isMobile 
  ? [
      { key: 'posicion', label: '#', width: 60, align: 'center' },
      { key: 'equipo', label: 'Equipo', width: '1fr', align: 'left' }
    ]
  : [
      { key: 'posicion', label: '#', width: 60, align: 'center' },
      { key: 'equipo', label: 'Equipo', width: '2fr', align: 'left' },
      { key: 'victorias', label: 'G', width: 60, align: 'center' },
      { key: 'derrotas', label: 'P', width: 60, align: 'center' },
      { key: 'partidos', label: 'PJ', width: 70, align: 'center' },
      { key: 'puntosFavor', label: 'PF', width: 70, align: 'center' },
      { key: 'puntosContra', label: 'PC', width: 70, align: 'center' },
      { key: 'diferencia', label: 'DIF', width: 80, align: 'center' }
    ];

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      style={{ height: '100%' }}
    >
      <Box
        sx={{
          height: '100%',
          background: 'linear-gradient(145deg, rgba(64, 181, 246, 0.1), rgba(64, 181, 246, 0.05))',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(64, 181, 246, 0.2)',
          borderRadius: 3,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* HEADER */}
        <Box sx={{ 
          p: 3,
          borderBottom: '1px solid rgba(64, 181, 246, 0.2)',
          background: 'linear-gradient(135deg, rgba(64, 181, 246, 0.15), rgba(64, 181, 246, 0.08))'
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Star sx={{ color: '#64b5f6', fontSize: '2rem' }} />
              <Typography variant="h5" sx={{ 
                fontWeight: 'bold', 
                color: 'white',
                textShadow: '0 2px 10px rgba(64, 181, 246, 0.3)'
              }}>
                Tabla de Posiciones
              </Typography>
            </Box>
            {categoriaSeleccionada && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Chip 
                  label={obtenerNombreCategoria(categoriaSeleccionada)}
                  sx={{ 
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    height: 32,
                    background: `${obtenerColorCategoria(categoriaSeleccionada)}20`,
                    color: obtenerColorCategoria(categoriaSeleccionada),
                    border: `1px solid ${obtenerColorCategoria(categoriaSeleccionada)}40`,
                    boxShadow: `0 4px 12px ${obtenerColorCategoria(categoriaSeleccionada)}20`
                  }}
                />
              </motion.div>
            )}
          </Box>
        </Box>

        {/* CONTENIDO */}
        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: '300px'
            }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <CircularProgress size={60} sx={{ color: '#64b5f6' }} />
              </motion.div>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)', 
                  ml: 3,
                  fontWeight: 600 
                }}
              >
                Procesando tabla...
              </Typography>
            </Box>
          ) : tablaPosiciones.length === 0 ? (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: '300px',
              textAlign: 'center'
            }}>
              <Box>
                <Star sx={{ fontSize: 64, color: 'rgba(64, 181, 246, 0.5)', mb: 2 }} />
                <Typography variant="h6" sx={{ 
                  color: 'white', 
                  mb: 1,
                  fontWeight: 600
                }}>
                  Sin equipos registrados
                </Typography>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  No hay equipos en esta categoría
                </Typography>
              </Box>
            </Box>
          ) : (
            <>
              {/* HEADER DE COLUMNAS */}
              <Box sx={{ 
                px: 2,
                py: 1.5,
                borderBottom: '1px solid rgba(64, 181, 246, 0.1)',
                background: 'rgba(64, 181, 246, 0.05)'
              }}>
                <Box sx={{ 
                  display: 'flex',
                  gap: 2,
                  alignItems: 'center',
                  width: '100%'
                }}>
                  {columnas.map((columna) => (
                    <Box 
                      key={columna.key}
                      sx={{ 
                        width: columna.width,
                        flexShrink: columna.width === '1fr' || columna.width === '2fr' ? 1 : 0,
                        flexGrow: columna.width === '1fr' ? 1 : columna.width === '2fr' ? 2 : 0,
                        textAlign: columna.align,
                        minWidth: typeof columna.width === 'number' ? `${columna.width}px` : 'auto'
                      }}
                    >
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.8)',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          letterSpacing: '0.5px'
                        }}
                      >
                        {columna.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* FILAS DE EQUIPOS */}
              <Box sx={{ 
                flex: 1, 
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                  width: '6px'
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(64, 181, 246, 0.1)'
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(64, 181, 246, 0.3)',
                  borderRadius: '3px'
                }
              }}>
                <AnimatePresence>
                  {tablaPosiciones.map((fila, index) => (
                    <motion.div
                      key={fila.equipo._id}
                      variants={filaVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      transition={{ delay: index * 0.05 }}
                      onClick={() => onSeleccionEquipo && onSeleccionEquipo(fila)}
                      style={{
                        cursor: onSeleccionEquipo ? 'pointer' : 'default'
                      }}
                    >
                      <Box
                        sx={{
                          p: 2,
                          borderBottom: '1px solid rgba(64, 181, 246, 0.08)',
                          background: obtenerColorPosicion(fila.posicion),
                          transition: 'all 0.3s ease',
                          '&:hover': onSeleccionEquipo ? {
                            background: 'linear-gradient(135deg, rgba(64, 181, 246, 0.15), rgba(64, 181, 246, 0.08))',
                            transform: 'translateX(4px)'
                          } : {}
                        }}
                      >
                        <Box sx={{ 
                          display: 'flex',
                          gap: 2,
                          alignItems: 'center',
                          width: '100%'
                        }}>
                          {/* POSICIÓN */}
                          <Box sx={{ 
                            width: 60,
                            flexShrink: 0,
                            textAlign: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1,
                            minWidth: '60px'
                          }}>
                            {obtenerIconoPosicion(fila.posicion)}
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 900,
                                color: fila.posicion <= 3 ? '#ffd700' : '#64b5f6',
                                textShadow: fila.posicion <= 3 ? '0 0 10px rgba(255, 215, 0, 0.3)' : 'none'
                              }}
                            >
                              {fila.posicion}
                            </Typography>
                          </Box>

                          {/* EQUIPO */}
                          <Box sx={{ 
                            width: isMobile ? '1fr' : '2fr',
                            flexGrow: isMobile ? 1 : 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            minWidth: 0,
                            overflow: 'hidden'
                          }}>
                            <Avatar
                              src={getImageUrl(fila.equipo.imagen)}
                              sx={{ 
                                width: 40, 
                                height: 40,
                                border: '2px solid rgba(64, 181, 246, 0.3)',
                                boxShadow: '0 4px 12px rgba(64, 181, 246, 0.2)',
                                flexShrink: 0
                              }}
                            >
                              🏈
                            </Avatar>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography 
                                variant="body1" 
                                sx={{ 
                                  fontWeight: 600,
                                  color: 'white',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  fontSize: '0.95rem'
                                }}
                              >
                                {fila.equipo.nombre}
                              </Typography>
                              {isMobile && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      color: '#4caf50',
                                      fontSize: '0.7rem',
                                      fontWeight: 700
                                    }}
                                  >
                                    {fila.victorias}G
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      color: '#f44336',
                                      fontSize: '0.7rem',
                                      fontWeight: 700
                                    }}
                                  >
                                    {fila.derrotas}P
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      color: 'rgba(255, 255, 255, 0.6)',
                                      fontSize: '0.7rem'
                                    }}
                                  >
                                    •
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      color: 'rgba(255, 255, 255, 0.6)',
                                      fontSize: '0.7rem'
                                    }}
                                  >
                                    {fila.partidosJugados > 0 
                                      ? `${fila.promedioPuntos} pts/juego`
                                      : 'Sin partidos'
                                    }
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>

                          {/* ESTADÍSTICAS - Solo en Desktop */}
                          {!isMobile && (
                            [
                              { value: fila.victorias, color: '#4caf50', width: 60 },
                              { value: fila.derrotas, color: '#f44336', width: 60 },
                              { value: fila.partidosJugados, color: '#64b5f6', width: 70 },
                              { value: fila.puntosFavor, color: '#ff9800', width: 70 },
                              { value: fila.puntosContra, color: '#e91e63', width: 70 },
                              { 
                                value: `${fila.diferenciaPuntos >= 0 ? '+' : ''}${fila.diferenciaPuntos}`, 
                                color: fila.diferenciaPuntos >= 0 ? '#4caf50' : '#f44336', 
                                width: 80 
                              }
                            ].map((stat, statIndex) => (
                              <Box 
                                key={statIndex} 
                                sx={{ 
                                  width: stat.width, 
                                  textAlign: 'center', 
                                  flexShrink: 0,
                                  minWidth: `${stat.width}px`
                                }}
                              >
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  transition={{ type: "spring", stiffness: 300 }}
                                >
                                  <Typography 
                                    variant="h6" 
                                    sx={{ 
                                      fontWeight: 900,
                                      color: stat.color,
                                      textShadow: `0 0 10px ${stat.color}30`,
                                      fontSize: '1.1rem'
                                    }}
                                  >
                                    {stat.value}
                                  </Typography>
                                </motion.div>
                              </Box>
                            ))
                          )}
                        </Box>
                      </Box>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Box>
            </>
          )}
        </Box>

        {/* FOOTER CON INFO */}
        {!loading && tablaPosiciones.length > 0 && (
          <Box sx={{ 
            p: 2,
            borderTop: '1px solid rgba(64, 181, 246, 0.1)',
            background: 'rgba(64, 181, 246, 0.05)',
            textAlign: 'center'
          }}>
            <Typography variant="caption" sx={{ 
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.7rem'
            }}>
              💡 {isMobile 
                ? 'Haz clic en cualquier equipo para ver detalles • G: Ganados | P: Perdidos'
                : 'Haz clic en cualquier equipo para ver detalles • G: Ganados | P: Perdidos | PJ: Partidos Jugados | PF: Puntos a Favor | PC: Puntos en Contra | DIF: Diferencia'
              }
            </Typography>
          </Box>
        )}
      </Box>
    </motion.div>
  );
};