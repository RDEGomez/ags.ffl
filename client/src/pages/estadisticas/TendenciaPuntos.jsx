// 📁 src/pages/estadisticas/components/TendenciaPuntos.jsx

import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Divider,
  Avatar,
  Chip
} from '@mui/material';
import {
  TrendingUp,
  Timeline,
  Assessment
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
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

// 🎨 TOOLTIP PERSONALIZADO
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Box
        sx={{
          background: 'linear-gradient(145deg, rgba(64, 181, 246, 0.95), rgba(42, 165, 245, 0.9))',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(64, 181, 246, 0.3)',
          borderRadius: 2,
          p: 2,
          boxShadow: '0 8px 32px rgba(64, 181, 246, 0.3)'
        }}
      >
        <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
          Jornada {label}
        </Typography>
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 900 }}>
          {data.puntos} puntos
        </Typography>
        {data.rival && (
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            vs {data.rival.nombre}
          </Typography>
        )}
        {data.resultado && (
          <Chip
            label={data.resultado === 'victoria' ? 'Victoria' : data.resultado === 'derrota' ? 'Derrota' : 'Empate'}
            size="small"
            sx={{
              ml: 1,
              fontSize: '0.7rem',
              backgroundColor: data.resultado === 'victoria' ? 'rgba(76, 175, 80, 0.8)' : 
                              data.resultado === 'derrota' ? 'rgba(244, 67, 54, 0.8)' : 
                              'rgba(255, 193, 7, 0.8)',
              color: 'white'
            }}
          />
        )}
      </Box>
    );
  }
  return null;
};

export const TendenciaPuntos = ({ 
  tendenciaPuntos = [], 
  equipoSeleccionado, 
  loading 
}) => {
  // 📊 CALCULAR ESTADÍSTICAS
  const promedioPuntos = tendenciaPuntos.length > 0 
    ? Math.round(tendenciaPuntos.reduce((sum, j) => sum + j.puntos, 0) / tendenciaPuntos.length)
    : 0;

  const maxPuntos = tendenciaPuntos.length > 0 
    ? Math.max(...tendenciaPuntos.map(j => j.puntos))
    : 0;

  const minPuntos = tendenciaPuntos.length > 0 
    ? Math.min(...tendenciaPuntos.map(j => j.puntos))
    : 0;

  const totalJornadas = tendenciaPuntos.length;

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
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
          flexDirection: 'column',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            background: 'linear-gradient(145deg, rgba(64, 181, 246, 0.15), rgba(64, 181, 246, 0.08))',
            border: '1px solid rgba(64, 181, 246, 0.3)'
          }
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
              <Timeline sx={{ color: '#64b5f6', fontSize: '2rem' }} />
              <Typography variant="h5" sx={{ 
                fontWeight: 'bold', 
                color: 'white',
                textShadow: '0 2px 10px rgba(64, 181, 246, 0.3)'
              }}>
                Tendencia de Puntos
              </Typography>
            </Box>
            
            {equipoSeleccionado && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={getImageUrl(equipoSeleccionado.equipo.imagen)}
                  sx={{ 
                    width: 32, 
                    height: 32,
                    border: '2px solid rgba(64, 181, 246, 0.3)'
                  }}
                >
                  🏈
                </Avatar>
                <Typography variant="body1" sx={{ 
                  color: 'white',
                  fontWeight: 600,
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                }}>
                  {equipoSeleccionado.equipo.nombre}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* CONTENIDO */}
        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <AnimatePresence mode="wait">
            {loading ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                gap: 2
              }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <CircularProgress 
                    size={50} 
                    thickness={4} 
                    sx={{ 
                      color: '#64b5f6',
                      filter: 'drop-shadow(0 0 10px rgba(64, 181, 246, 0.5))'
                    }} 
                  />
                </motion.div>
                <Typography variant="body2" sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: 600
                }}>
                  Analizando tendencias...
                </Typography>
              </Box>
            ) : !equipoSeleccionado ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                style={{ height: '100%' }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  textAlign: 'center',
                  p: 3
                }}>
                  <motion.div
                    animate={{ 
                      y: [0, -10, 0],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <TrendingUp sx={{ 
                      fontSize: 64, 
                      color: 'rgba(64, 181, 246, 0.4)',
                      filter: 'drop-shadow(0 0 20px rgba(64, 181, 246, 0.3))'
                    }} />
                  </motion.div>
                  <Typography variant="h6" sx={{ 
                    color: 'white', 
                    mt: 2,
                    fontWeight: 600
                  }}>
                    Selecciona un equipo
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: 'rgba(255, 255, 255, 0.6)', 
                    mt: 1
                  }}>
                    Para visualizar su tendencia de puntos por jornada
                  </Typography>
                </Box>
              </motion.div>
            ) : tendenciaPuntos.length === 0 ? (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                p: 3
              }}>
                <Box>
                  <Assessment sx={{ fontSize: 64, color: 'rgba(64, 181, 246, 0.5)', mb: 2 }} />
                  <Typography variant="h6" sx={{ 
                    color: 'white', 
                    mb: 1,
                    fontWeight: 600
                  }}>
                    Sin datos de jornadas
                  </Typography>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Este equipo no tiene partidos finalizados
                  </Typography>
                </Box>
              </Box>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{ height: '100%' }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {/* Gráfica principal */}
                  <Box sx={{ height: '60%', p: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={tendenciaPuntos}>
                        <defs>
                          <linearGradient id="colorTendencia" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#64b5f6" stopOpacity={0.8}/>
                            <stop offset="50%" stopColor="#42a5f5" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#1e88e5" stopOpacity={0.1}/>
                          </linearGradient>
                          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#64b5f6"/>
                            <stop offset="50%" stopColor="#42a5f5"/>
                            <stop offset="100%" stopColor="#2196f3"/>
                          </linearGradient>
                        </defs>
                        
                        <CartesianGrid 
                          strokeDasharray="3 3" 
                          stroke="rgba(255,255,255,0.1)" 
                          strokeOpacity={0.3}
                        />
                        
                        <XAxis 
                          dataKey="jornada"
                          stroke="rgba(255,255,255,0.7)"
                          fontSize={12}
                          fontWeight={600}
                          axisLine={{ stroke: 'rgba(64, 181, 246, 0.3)' }}
                          tickLine={{ stroke: 'rgba(64, 181, 246, 0.3)' }}
                        />
                        
                        <YAxis 
                          stroke="rgba(255,255,255,0.7)"
                          fontSize={12}
                          fontWeight={600}
                          axisLine={{ stroke: 'rgba(64, 181, 246, 0.3)' }}
                          tickLine={{ stroke: 'rgba(64, 181, 246, 0.3)' }}
                        />
                        
                        <ChartTooltip 
                          content={<CustomTooltip />}
                          cursor={{ 
                            strokeDasharray: '3 3',
                            stroke: 'rgba(64, 181, 246, 0.5)'
                          }}
                        />
                        
                        <Area
                          type="monotone"
                          dataKey="puntos"
                          stroke="url(#lineGradient)"
                          strokeWidth={3}
                          fill="url(#colorTendencia)"
                          fillOpacity={0.6}
                          dot={{ 
                            fill: '#64b5f6', 
                            strokeWidth: 2, 
                            stroke: 'white',
                            r: 5
                          }}
                          activeDot={{ 
                            r: 8, 
                            fill: '#64b5f6',
                            stroke: 'white',
                            strokeWidth: 3,
                            filter: 'drop-shadow(0 0 8px rgba(64, 181, 246, 0.8))'
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                  
                  {/* Panel de Estadísticas */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, rgba(64, 181, 246, 0.15), rgba(64, 181, 246, 0.08))',
                    borderRadius: 2,
                    p: 2,
                    m: 2,
                    border: '1px solid rgba(64, 181, 246, 0.2)',
                    flexWrap: 'wrap',
                    gap: 1
                  }}>
                    {/* Promedio */}
                    <Box sx={{ textAlign: 'center', minWidth: '80px' }}>
                      <Typography variant="caption" sx={{ 
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        letterSpacing: '0.5px'
                      }}>
                        PROMEDIO
                      </Typography>
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            fontWeight: 900,
                            color: '#64b5f6',
                            textShadow: '0 0 15px rgba(64, 181, 246, 0.6)',
                            lineHeight: 1
                          }}
                        >
                          {promedioPuntos}
                        </Typography>
                      </motion.div>
                    </Box>

                    <Divider orientation="vertical" sx={{ 
                      borderColor: 'rgba(64, 181, 246, 0.3)',
                      height: 35
                    }} />

                    {/* Máximo */}
                    <Box sx={{ textAlign: 'center', minWidth: '80px' }}>
                      <Typography variant="caption" sx={{ 
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        letterSpacing: '0.5px'
                      }}>
                        MÁXIMO
                      </Typography>
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          fontWeight: 900,
                          color: '#4caf50',
                          textShadow: '0 0 10px rgba(76, 175, 80, 0.4)',
                          lineHeight: 1
                        }}
                      >
                        {maxPuntos}
                      </Typography>
                    </Box>

                    <Divider orientation="vertical" sx={{ 
                      borderColor: 'rgba(64, 181, 246, 0.3)',
                      height: 35
                    }} />

                    {/* Mínimo */}
                    <Box sx={{ textAlign: 'center', minWidth: '80px' }}>
                      <Typography variant="caption" sx={{ 
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        letterSpacing: '0.5px'
                      }}>
                        MÍNIMO
                      </Typography>
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          fontWeight: 900,
                          color: '#ff9800',
                          textShadow: '0 0 10px rgba(255, 152, 0, 0.4)',
                          lineHeight: 1
                        }}
                      >
                        {minPuntos}
                      </Typography>
                    </Box>

                    <Divider orientation="vertical" sx={{ 
                      borderColor: 'rgba(64, 181, 246, 0.3)',
                      height: 35
                    }} />

                    {/* Jornadas */}
                    <Box sx={{ textAlign: 'center', minWidth: '80px' }}>
                      <Typography variant="caption" sx={{ 
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        letterSpacing: '0.5px'
                      }}>
                        JORNADAS
                      </Typography>
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          fontWeight: 900,
                          color: 'white',
                          lineHeight: 1
                        }}
                      >
                        {totalJornadas}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>

        {/* FOOTER CON INFO */}
        {!loading && tendenciaPuntos.length > 0 && (
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
              📈 Evolución de puntos anotados por jornada
            </Typography>
          </Box>
        )}
      </Box>
    </motion.div>
  );
};