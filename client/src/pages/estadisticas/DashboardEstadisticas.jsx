// 📁 src/pages/estadisticas/DashboardEstadisticas.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Avatar,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Badge,
  Paper,
  Container
} from '@mui/material';
import {
  EmojiEvents,
  TrendingUp,
  Sports,
  Shield,
  Bolt,
  PanTool,
  SportsFootball,
  Refresh,
  Analytics,
  Timeline,
  Star,
  Speed,
  Assessment,
  FlashOn,
  Whatshot,
  LocalFireDepartment,
  Cyclone,
  AutoAwesome
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// 🔥 IMPORTS
import { useEstadisticas } from '../../hooks/useEstadisticas';
import { 
  obtenerNombreCategoria, 
  obtenerColorCategoria,
  obtenerIconoCategoria,
  esCategoriaValida
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

// 🎨 ANIMACIONES ÉPICAS
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      duration: 0.3
    }
  }
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 50,
    scale: 0.9,
    rotateX: -15
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      duration: 0.6
    }
  },
  hover: {
    scale: 1.02,
    rotateY: 5,
    z: 100,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  }
};

const glowVariants = {
  animate: {
    boxShadow: [
      "0 0 20px rgba(100, 181, 246, 0.3)",
      "0 0 40px rgba(100, 181, 246, 0.6)",
      "0 0 20px rgba(100, 181, 246, 0.3)"
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const pulseVariants = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export const DashboardEstadisticas = () => {
  // 🔥 HOOKS
  const {
    loading,
    error,
    data,
    obtenerTorneosDisponibles,
    obtenerTablaPosiciones,
    obtenerTendenciaPuntos,
    obtenerTodosLideres,
    limpiarDatos,
    refrescarTodo
  } = useEstadisticas();

  const [torneoSeleccionado, setTorneoSeleccionado] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);

  const { 
    torneosDisponibles = [], 
    tablaPosiciones = [], 
    tendenciaPuntos = [], 
    lideresEstadisticas = {} 
  } = data || {};

  // 🔥 COMPUTED VALUES
  const torneo = useMemo(() => 
    torneosDisponibles.find(t => t._id === torneoSeleccionado) || null,
    [torneosDisponibles, torneoSeleccionado]
  );

  const categorias = useMemo(() => 
    (torneo?.categorias || []).filter(esCategoriaValida),
    [torneo]
  );

  // 🔥 HANDLERS
  const handleTorneoChange = useCallback((event) => {
    const nuevoTorneo = event.target.value;
    setTorneoSeleccionado(nuevoTorneo);
    setCategoriaSeleccionada('');
    setEquipoSeleccionado(null);
  }, []);

  const handleCategoriaChange = useCallback((event) => {
    const nuevaCategoria = event.target.value;
    setCategoriaSeleccionada(nuevaCategoria);
    setEquipoSeleccionado(null);
  }, []);

  const handleSeleccionEquipo = useCallback((equipoFila) => {
    setEquipoSeleccionado(equipoFila);
  }, []);

  const handleRefresh = useCallback(async () => {
    await refrescarTodo(torneoSeleccionado, categoriaSeleccionada, equipoSeleccionado?.equipo._id);
  }, [refrescarTodo, torneoSeleccionado, categoriaSeleccionada, equipoSeleccionado]);

  // 🔥 EFFECTS
  useEffect(() => {
    obtenerTorneosDisponibles();
    return () => limpiarDatos();
  }, [obtenerTorneosDisponibles, limpiarDatos]);

  useEffect(() => {
    if (torneosDisponibles.length === 1 && !torneoSeleccionado) {
      setTorneoSeleccionado(torneosDisponibles[0]._id);
    }
  }, [torneosDisponibles, torneoSeleccionado]);

  useEffect(() => {
    if (categorias.length === 1 && torneoSeleccionado && !categoriaSeleccionada) {
      setCategoriaSeleccionada(categorias[0]);
    }
  }, [categorias, torneoSeleccionado, categoriaSeleccionada]);

  useEffect(() => {
    if (torneoSeleccionado && categoriaSeleccionada) {
      obtenerTablaPosiciones(torneoSeleccionado, categoriaSeleccionada);
      setEquipoSeleccionado(null);
    }
  }, [torneoSeleccionado, categoriaSeleccionada, obtenerTablaPosiciones]);

  useEffect(() => {
    if (equipoSeleccionado && torneoSeleccionado) {
      Promise.all([
        obtenerTendenciaPuntos(equipoSeleccionado.equipo._id, torneoSeleccionado),
        obtenerTodosLideres(equipoSeleccionado.equipo._id, torneoSeleccionado)
      ]);
    }
  }, [equipoSeleccionado, torneoSeleccionado, obtenerTendenciaPuntos, obtenerTodosLideres]);

  // 🔥 COMPONENTE: TENDENCIA ÉPICA
  const TendenciaEpica = () => {
    return (
      <motion.div
        variants={cardVariants}
        whileHover="hover"
        style={{ height: '100%' }}
      >
        <Box
          sx={{
            height: '100%',
            background: `
              linear-gradient(145deg, 
                rgba(0, 188, 212, 0.15) 0%,
                rgba(0, 150, 136, 0.1) 50%,
                rgba(0, 121, 107, 0.05) 100%
              )
            `,
            backdropFilter: 'blur(25px)',
            border: '1px solid rgba(0, 188, 212, 0.3)',
            borderRadius: '24px',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              background: `
                linear-gradient(145deg, 
                  rgba(0, 188, 212, 0.25) 0%,
                  rgba(0, 150, 136, 0.15) 50%,
                  rgba(0, 121, 107, 0.1) 100%
                )
              `,
              border: '1px solid rgba(0, 188, 212, 0.5)',
              boxShadow: `
                0 20px 60px rgba(0, 188, 212, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.1)
              `
            }
          }}
        >
          {/* Efectos de fondo */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `
                radial-gradient(circle at 20% 20%, rgba(0, 188, 212, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(0, 150, 136, 0.08) 0%, transparent 50%)
              `,
              pointerEvents: 'none'
            }}
          />
          
          {/* Header con icono flotante */}
          <Box sx={{
            p: 3,
            background: `
              linear-gradient(135deg, 
                rgba(0, 188, 212, 0.2) 0%,
                rgba(0, 188, 212, 0.1) 100%
              )
            `,
            borderBottom: '1px solid rgba(0, 188, 212, 0.2)',
            position: 'relative'
          }}>
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              style={{ display: 'inline-block' }}
            >
              <Timeline sx={{ 
                color: '#00bcd4', 
                fontSize: '1.5rem',
                filter: 'drop-shadow(0 0 8px rgba(0, 188, 212, 0.6))'
              }} />
            </motion.div>
            <Typography 
              variant="h6" 
              sx={{
                ml: 2,
                display: 'inline-block',
                fontWeight: 900,
                color: 'white',
                textShadow: '0 2px 10px rgba(0, 188, 212, 0.5)',
                fontSize: '1.1rem',
                letterSpacing: '0.5px'
              }}
            >
              TENDENCIA DE RENDIMIENTO
            </Typography>
          </Box>

          <Box sx={{ p: 3, height: 'calc(100% - 80px)' }}>
            {!equipoSeleccionado ? (
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
                  textAlign: 'center'
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
                      fontSize: 60, 
                      color: 'rgba(0, 188, 212, 0.4)',
                      filter: 'drop-shadow(0 0 20px rgba(0, 188, 212, 0.3))'
                    }} />
                  </motion.div>
                  <Typography variant="h6" sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)', 
                    mt: 2,
                    fontWeight: 600
                  }}>
                    Selecciona un equipo
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: 'rgba(255, 255, 255, 0.5)', 
                    mt: 1
                  }}>
                    Para visualizar su tendencia de puntos
                  </Typography>
                </Box>
              </motion.div>
            ) : loading.tendencia ? (
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
                      color: '#00bcd4',
                      filter: 'drop-shadow(0 0 10px rgba(0, 188, 212, 0.5))'
                    }} 
                  />
                </motion.div>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Analizando tendencias...
                </Typography>
              </Box>
            ) : tendenciaPuntos?.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{ height: '100%' }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {/* Gráfica principal */}
                  <Box sx={{ height: '60%', mb: 3 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={tendenciaPuntos}>
                        <defs>
                          <linearGradient id="colorTendencia" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00bcd4" stopOpacity={0.8}/>
                            <stop offset="50%" stopColor="#00acc1" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#0097a7" stopOpacity={0.1}/>
                          </linearGradient>
                          <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feMerge> 
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis 
                          dataKey="jornada" 
                          stroke="rgba(255,255,255,0.6)"
                          fontSize={12}
                        />
                        <YAxis 
                          stroke="rgba(255,255,255,0.6)"
                          fontSize={12}
                        />
                        <ChartTooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            border: '1px solid rgba(0, 188, 212, 0.5)',
                            borderRadius: '12px',
                            backdropFilter: 'blur(10px)'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="puntos" 
                          stroke="#00bcd4" 
                          strokeWidth={3}
                          fill="url(#colorTendencia)"
                          filter="url(#glow)"
                          dot={{
                            fill: '#00bcd4',
                            strokeWidth: 2,
                            r: 6,
                            filter: 'drop-shadow(0 0 6px rgba(0, 188, 212, 0.8))'
                          }}
                          activeDot={{
                            r: 8,
                            fill: '#00bcd4',
                            stroke: '#fff',
                            strokeWidth: 2,
                            filter: 'drop-shadow(0 0 10px rgba(0, 188, 212, 1))'
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                  
                  {/* Estadísticas */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    background: 'rgba(0, 188, 212, 0.1)',
                    borderRadius: '16px',
                    p: 2,
                    border: '1px solid rgba(0, 188, 212, 0.2)'
                  }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontWeight: 600
                      }}>
                        PROMEDIO
                      </Typography>
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Typography 
                          variant="h4" 
                          sx={{ 
                            fontWeight: 900,
                            color: '#00bcd4',
                            textShadow: '0 0 20px rgba(0, 188, 212, 0.8)',
                            lineHeight: 1
                          }}
                        >
                          {tendenciaPuntos.length > 0 
                            ? Math.round(tendenciaPuntos.reduce((sum, j) => sum + j.puntos, 0) / tendenciaPuntos.length)
                            : 0}
                        </Typography>
                      </motion.div>
                    </Box>
                    <Divider orientation="vertical" sx={{ 
                      borderColor: 'rgba(0, 188, 212, 0.3)',
                      height: 40
                    }} />
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontWeight: 600
                      }}>
                        JORNADAS
                      </Typography>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          fontWeight: 900,
                          color: 'white',
                          lineHeight: 1
                        }}
                      >
                        {tendenciaPuntos.length}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </motion.div>
            ) : (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center'
              }}>
                <Typography variant="h6" sx={{ 
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontWeight: 600
                }}>
                  Sin datos disponibles
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </motion.div>
    );
  };

  // 🔥 COMPONENTE: LÍDER SÚPER ÉPICO
  const LiderSuperEpico = ({ tipo, titulo, icono, color, gradient }) => {
    const lider = lideresEstadisticas?.[tipo]?.[0];
    
    return (
      <motion.div
        variants={cardVariants}
        whileHover="hover"
        style={{ height: '100%' }}
      >
        <Box
          sx={{
            height: '100%',
            background: `linear-gradient(145deg, ${gradient[0]}, ${gradient[1]})`,
            backdropFilter: 'blur(25px)',
            border: `1px solid ${color}40`,
            borderRadius: '24px',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              border: `1px solid ${color}80`,
              boxShadow: `
                0 20px 60px ${color}30,
                inset 0 1px 0 rgba(255, 255, 255, 0.1)
              `,
              transform: 'translateY(-8px) scale(1.02)'
            }
          }}
        >
          {/* Efectos de fondo dinámicos */}
          <motion.div
            animate={{
              background: [
                `radial-gradient(circle at 30% 30%, ${color}15 0%, transparent 50%)`,
                `radial-gradient(circle at 70% 70%, ${color}20 0%, transparent 50%)`,
                `radial-gradient(circle at 30% 30%, ${color}15 0%, transparent 50%)`
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
          
          {/* Header con efectos */}
          <Box sx={{
            p: 3,
            background: `linear-gradient(135deg, ${color}25, ${color}15)`,
            borderBottom: `1px solid ${color}30`,
            position: 'relative'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
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
                    fontSize: '1.8rem',
                    filter: `drop-shadow(0 0 10px ${color}80)`
                  }
                })}
              </motion.div>
              <Typography 
                variant="h6" 
                sx={{
                  fontWeight: 900,
                  color: 'white',
                  textShadow: `0 2px 10px ${color}50`,
                  fontSize: '1rem',
                  letterSpacing: '0.5px'
                }}
              >
                {titulo}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ p: 3, height: 'calc(100% - 80px)' }}>
            {!equipoSeleccionado ? (
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
                  textAlign: 'center'
                }}>
                  <motion.div
                    animate={{ 
                      y: [0, -8, 0],
                      opacity: [0.3, 0.7, 0.3]
                    }}
                    transition={{ 
                      duration: 2.5, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    {React.cloneElement(icono, {
                      sx: {
                        fontSize: 50,
                        color: `${color}60`,
                        filter: `drop-shadow(0 0 15px ${color}40)`
                      }
                    })}
                  </motion.div>
                  <Typography variant="body1" sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)', 
                    mt: 2,
                    fontWeight: 600
                  }}>
                    Esperando datos...
                  </Typography>
                </Box>
              </motion.div>
            ) : loading.lideres ? (
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
                    size={40} 
                    thickness={4} 
                    sx={{ 
                      color: color,
                      filter: `drop-shadow(0 0 8px ${color}60)`
                    }} 
                  />
                </motion.div>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Cargando líder...
                </Typography>
              </Box>
            ) : lider ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{ height: '100%' }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {/* Avatar y datos del jugador */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Avatar 
                        src={getImageUrl(lider.jugador?.imagen)} 
                        sx={{ 
                          width: 60, 
                          height: 60,
                          border: `3px solid ${color}60`,
                          boxShadow: `
                            0 0 20px ${color}40,
                            inset 0 0 20px rgba(255, 255, 255, 0.1)
                          `,
                          background: `linear-gradient(145deg, ${color}20, ${color}10)`
                        }}
                      >
                        {lider.jugador?.nombre?.charAt(0) || '?'}
                      </Avatar>
                    </motion.div>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 900,
                          color: 'white',
                          textShadow: `0 2px 8px ${color}50`,
                          fontSize: '1.1rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          mb: 0.5
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
                            height: 24,
                            fontSize: '0.8rem',
                            fontWeight: 900,
                            background: `linear-gradient(45deg, ${color}40, ${color}20)`,
                            color: 'white',
                            border: `1px solid ${color}60`,
                            boxShadow: `0 2px 8px ${color}30`
                          }}
                        />
                      </motion.div>
                    </Box>
                  </Box>
                  
                  {/* Línea divisoria con efecto */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    <Divider sx={{ 
                      borderColor: `${color}40`, 
                      mb: 3,
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '1px',
                        background: `linear-gradient(90deg, transparent, ${color}80, transparent)`
                      }
                    }} />
                  </motion.div>
                  
                  {/* Estadística principal */}
                  <Box sx={{ 
                    textAlign: 'center',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <Typography variant="caption" sx={{ 
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      mb: 1
                    }}>
                      {tipo === 'pases' ? 'Pases Completados' :
                       tipo === 'puntos' ? 'Puntos Totales' :
                       tipo === 'tackleos' ? 'Tackleos Exitosos' :
                       tipo === 'intercepciones' ? 'Intercepciones' :
                       tipo === 'sacks' ? 'Sacks Realizados' :
                       tipo === 'recepciones' ? 'Recepciones' : 'Estadística'}
                    </Typography>
                    <motion.div
                      animate={{ 
                        scale: [1, 1.05, 1],
                        textShadow: [
                          `0 0 20px ${color}60`,
                          `0 0 30px ${color}80`,
                          `0 0 20px ${color}60`
                        ]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Typography 
                        variant="h2" 
                        sx={{ 
                          fontWeight: 900,
                          color: 'white',
                          textShadow: `0 0 25px ${color}80`,
                          lineHeight: 1,
                          fontSize: { xs: '2.5rem', sm: '3rem' }
                        }}
                      >
                        {tipo === 'pases' ? lider.estadisticas?.pases?.completados || 0 :
                         tipo === 'puntos' ? lider.estadisticas?.puntos || 0 :
                         tipo === 'tackleos' ? lider.estadisticas?.tackleos || 0 :
                         tipo === 'intercepciones' ? lider.estadisticas?.intercepciones || 0 :
                         tipo === 'sacks' ? lider.estadisticas?.sacks || 0 :
                         tipo === 'recepciones' ? lider.estadisticas?.recepciones || 0 : 0}
                      </Typography>
                    </motion.div>
                    {tipo === 'pases' && lider.estadisticas?.pases?.touchdowns && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Chip 
                          label={`${lider.estadisticas.pases.touchdowns} TDs`}
                          size="small"
                          sx={{
                            mt: 1,
                            fontWeight: 800,
                            background: `linear-gradient(45deg, #ffd700, #ffed4e)`,
                            color: '#000',
                            boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)'
                          }}
                        />
                      </motion.div>
                    )}
                  </Box>
                </Box>
              </motion.div>
            ) : (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center'
              }}>
                <Typography variant="h6" sx={{ 
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontWeight: 600
                }}>
                  Sin datos disponibles
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </motion.div>
    );
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `
        linear-gradient(135deg, 
          #0a0e1a 0%, 
          #1a1f2e 25%, 
          #2d1b69 50%, 
          #1a202c 75%, 
          #0f1419 100%
        )
      `,
      backgroundAttachment: 'fixed',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Efectos de fondo animados */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 10% 20%, rgba(100, 181, 246, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 90% 80%, rgba(156, 39, 176, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(0, 188, 212, 0.05) 0%, transparent 50%)
          `,
          pointerEvents: 'none',
          zIndex: 0
        }}
      />
      
      {/* Partículas flotantes */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 100 - 50, 0],
            opacity: [0, 0.6, 0]
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            delay: Math.random() * 2
          }}
          style={{
            position: 'fixed',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            background: `radial-gradient(circle, ${
              ['#64b5f6', '#9c27b0', '#00bcd4', '#4caf50'][Math.floor(Math.random() * 4)]
            }80, transparent)`,
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: 1
          }}
        />
      ))}

      <Container maxWidth={false} sx={{ position: 'relative', zIndex: 2, py: 4 }}>
        {/* HEADER ÉPICO */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            mb: 6,
            position: 'relative'
          }}>
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Analytics sx={{ 
                fontSize: '4rem', 
                color: '#64b5f6',
                filter: 'drop-shadow(0 0 20px rgba(100, 181, 246, 0.8))',
                mr: 3
              }} />
            </motion.div>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography 
                variant="h2" 
                component="h1" 
                sx={{ 
                  color: 'white',
                  fontWeight: 900,
                  textShadow: '0 4px 20px rgba(100, 181, 246, 0.5)',
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  letterSpacing: '2px',
                  mb: 1,
                  background: 'linear-gradient(45deg, #64b5f6, #9c27b0)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent'
                }}
              >
                ESTADÍSTICAS
              </Typography>
            </Box>
          </Box>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Alert 
              severity="error" 
              sx={{ 
                mb: 4,
                background: 'rgba(244, 67, 54, 0.1)',
                backdropFilter: 'blur(15px)',
                border: '1px solid rgba(244, 67, 54, 0.3)',
                borderRadius: '16px',
                color: 'white',
                '& .MuiAlert-icon': {
                  color: '#f44336'
                }
              }}
            >
              {error}
            </Alert>
          </motion.div>
        )}

        {/* FILTROS ÉPICOS */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={cardVariants}>
            <Box
              sx={{
                background: `
                  linear-gradient(145deg, 
                    rgba(0, 0, 0, 0.4) 0%,
                    rgba(0, 0, 0, 0.2) 100%
                  )
                `,
                backdropFilter: 'blur(25px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '24px',
                overflow: 'hidden',
                mb: 6,
                position: 'relative'
              }}
            >
              {/* Header de filtros */}
              <Box sx={{
                p: 4,
                background: `
                  linear-gradient(135deg, 
                    rgba(100, 181, 246, 0.15) 0%,
                    rgba(100, 181, 246, 0.08) 100%
                  )
                `,
                borderBottom: '1px solid rgba(100, 181, 246, 0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Assessment sx={{ 
                      color: '#64b5f6', 
                      fontSize: '2rem',
                      filter: 'drop-shadow(0 0 10px rgba(100, 181, 246, 0.6))'
                    }} />
                  </motion.div>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 900, 
                    color: 'white',
                    textShadow: '0 2px 10px rgba(100, 181, 246, 0.5)'
                  }}>
                    Centro de Control
                  </Typography>
                </Box>
                
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Tooltip title="Refrescar todos los datos">
                    <IconButton
                      onClick={handleRefresh}
                      disabled={loading.torneos || loading.tabla}
                      sx={{
                        background: 'linear-gradient(45deg, rgba(100, 181, 246, 0.3), rgba(100, 181, 246, 0.1))',
                        border: '1px solid rgba(100, 181, 246, 0.4)',
                        width: 56,
                        height: 56,
                        '&:hover': {
                          background: 'linear-gradient(45deg, rgba(100, 181, 246, 0.4), rgba(100, 181, 246, 0.2))',
                          boxShadow: '0 8px 25px rgba(100, 181, 246, 0.4)'
                        }
                      }}
                    >
                      <Refresh sx={{ 
                        color: '#64b5f6', 
                        fontSize: '1.5rem',
                        filter: 'drop-shadow(0 0 8px rgba(100, 181, 246, 0.6))'
                      }} />
                    </IconButton>
                  </Tooltip>
                </motion.div>
              </Box>
              
              {/* Controles */}
              <Box sx={{ p: 4 }}>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 4, 
                  alignItems: 'flex-start',
                  flexWrap: 'wrap'
                }}>
                  {/* SELECTOR DE TORNEO */}
                  <Box sx={{ flex: '1 1 350px', minWidth: '300px' }}>
                    <FormControl fullWidth size="large">
                      <InputLabel sx={{ 
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontWeight: 600,
                        '&.Mui-focused': {
                          color: '#64b5f6'
                        }
                      }}>
                        🏆 Seleccionar Torneo
                      </InputLabel>
                      <Select
                        value={torneoSeleccionado}
                        onChange={handleTorneoChange}
                        label="🏆 Seleccionar Torneo"
                        disabled={loading.torneos}
                        sx={{ 
                          color: 'white',
                          background: 'rgba(255, 255, 255, 0.05)',
                          backdropFilter: 'blur(10px)',
                          borderRadius: '16px',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            borderWidth: '2px'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(100, 181, 246, 0.5)'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#64b5f6',
                            boxShadow: '0 0 20px rgba(100, 181, 246, 0.3)'
                          }
                        }}
                      >
                        {loading.torneos ? (
                          <MenuItem disabled>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                              <CircularProgress size={20} sx={{ color: '#64b5f6' }} />
                              <Typography>Cargando torneos...</Typography>
                            </Box>
                          </MenuItem>
                        ) : torneosDisponibles.length === 0 ? (
                          <MenuItem disabled>
                            <Typography sx={{ color: 'text.secondary', py: 2 }}>
                              No hay torneos disponibles
                            </Typography>
                          </MenuItem>
                        ) : (
                          torneosDisponibles.map((torneo) => (
                            <MenuItem 
                              key={torneo._id} 
                              value={torneo._id} 
                              sx={{ 
                                py: 2,
                                background: 'rgba(0, 0, 0, 0.8)',
                                '&:hover': {
                                  background: 'rgba(100, 181, 246, 0.1)'
                                }
                              }}
                            >
                              <Box>
                                <Typography variant="h6" sx={{ 
                                  fontWeight: 700, 
                                  color: 'white',
                                  mb: 1 
                                }}>
                                  {torneo.nombre}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                  <Chip 
                                    label={`📊 ${torneo.totalPartidos} partidos`}
                                    size="small"
                                    sx={{ 
                                      background: 'rgba(76, 175, 80, 0.2)',
                                      color: '#4caf50',
                                      border: '1px solid rgba(76, 175, 80, 0.3)'
                                    }}
                                  />
                                  <Chip 
                                    label={`📂 ${torneo.categorias?.length || 0} categorías`}
                                    size="small"
                                    sx={{ 
                                      background: 'rgba(255, 152, 0, 0.2)',
                                      color: '#ff9800',
                                      border: '1px solid rgba(255, 152, 0, 0.3)'
                                    }}
                                  />
                                  {torneo.progreso !== undefined && (
                                    <Chip 
                                      label={`⚡ ${torneo.progreso}% completado`}
                                      size="small"
                                      sx={{ 
                                        background: 'rgba(100, 181, 246, 0.2)',
                                        color: '#64b5f6',
                                        border: '1px solid rgba(100, 181, 246, 0.3)'
                                      }}
                                    />
                                  )}
                                </Box>
                              </Box>
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>
                  </Box>
                  
                  {/* SELECTOR DE CATEGORÍA */}
                  <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                    <FormControl fullWidth size="large">
                      <InputLabel sx={{ 
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontWeight: 600,
                        '&.Mui-focused': {
                          color: '#9c27b0'
                        }
                      }}>
                        🏈 Seleccionar Categoría
                      </InputLabel>
                      <Select
                        value={categoriaSeleccionada}
                        onChange={handleCategoriaChange}
                        label="⚽ Seleccionar Categoría"
                        disabled={!torneoSeleccionado || loading.tabla}
                        sx={{ 
                          color: 'white',
                          background: 'rgba(255, 255, 255, 0.05)',
                          backdropFilter: 'blur(10px)',
                          borderRadius: '16px',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            borderWidth: '2px'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(156, 39, 176, 0.5)'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#9c27b0',
                            boxShadow: '0 0 20px rgba(156, 39, 176, 0.3)'
                          }
                        }}
                      >
                        {loading.tabla ? (
                          <MenuItem disabled>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                              <CircularProgress size={20} sx={{ color: '#9c27b0' }} />
                              <Typography>Cargando categorías...</Typography>
                            </Box>
                          </MenuItem>
                        ) : categorias.length === 0 ? (
                          <MenuItem disabled>
                            <Typography sx={{ color: 'text.secondary', py: 2 }}>
                              {torneoSeleccionado ? 'No hay categorías disponibles' : 'Selecciona un torneo primero'}
                            </Typography>
                          </MenuItem>
                        ) : (
                          categorias.map((categoria) => (
                            <MenuItem 
                              key={categoria} 
                              value={categoria} 
                              sx={{ 
                                py: 2,
                                background: 'rgba(0, 0, 0, 0.8)',
                                '&:hover': {
                                  background: 'rgba(156, 39, 176, 0.1)'
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                <Chip 
                                  label={obtenerNombreCategoria(categoria)} 
                                  sx={{ 
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    background: `${obtenerColorCategoria(categoria)}20`,
                                    color: obtenerColorCategoria(categoria),
                                    border: `2px solid ${obtenerColorCategoria(categoria)}40`,
                                    minWidth: '160px',
                                    boxShadow: `0 4px 15px ${obtenerColorCategoria(categoria)}20`
                                  }}
                                />
                                <Typography sx={{ 
                                  color: 'rgba(255, 255, 255, 0.7)',
                                  ml: 'auto',
                                  fontSize: '1.2rem'
                                }}>
                                  {obtenerIconoCategoria(categoria)}
                                </Typography>
                              </Box>
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>
                  </Box>

                  {/* LOADING INDICATOR */}
                  <AnimatePresence>
                    {(loading.torneos || loading.tabla || loading.tendencia || loading.lideres) && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 2,
                          background: 'rgba(100, 181, 246, 0.1)',
                          border: '1px solid rgba(100, 181, 246, 0.3)',
                          borderRadius: '16px',
                          p: 3,
                          minWidth: '200px'
                        }}>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <CircularProgress 
                              size={32} 
                              sx={{ 
                                color: '#64b5f6',
                                filter: 'drop-shadow(0 0 8px rgba(100, 181, 246, 0.6))'
                              }} 
                            />
                          </motion.div>
                          <Typography variant="body1" sx={{ 
                            color: 'white',
                            fontWeight: 600
                          }}>
                            {loading.torneos ? '🔄 Cargando torneos...' :
                             loading.tabla ? '📊 Procesando tabla...' :
                             loading.tendencia ? '📈 Analizando tendencia...' :
                             loading.lideres ? '🏆 Buscando líderes...' : '⚡ Cargando...'}
                          </Typography>
                        </Box>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Box>

                {/* Mensaje informativo */}
                <AnimatePresence>
                  {torneoSeleccionado && categoriaSeleccionada && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Box sx={{
                        mt: 4, 
                        p: 3, 
                        textAlign: 'center',
                        background: `
                          linear-gradient(145deg, 
                            rgba(255, 215, 0, 0.15) 0%,
                            rgba(76, 175, 80, 0.1) 100%
                          )
                        `,
                        border: '1px solid rgba(255, 215, 0, 0.3)',
                        borderRadius: '20px',
                        backdropFilter: 'blur(15px)'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                          <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Star sx={{ color: '#ffd700', fontSize: '2rem' }} />
                          </motion.div>
                          <Typography variant="h6" sx={{ 
                            color: 'white', 
                            fontWeight: 700,
                            textShadow: '0 2px 10px rgba(255, 215, 0, 0.3)'
                          }}>
                            💡 ¡Haz clic en cualquier equipo para ver sus estadísticas épicas!
                          </Typography>
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <AutoAwesome sx={{ color: '#ffd700', fontSize: '1.5rem' }} />
                          </motion.div>
                        </Box>
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Box>
            </Box>
          </motion.div>
        </motion.div>

        {/* DASHBOARD PRINCIPAL CON FLEXBOX */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Box sx={{ 
            display: 'flex',
            gap: 4,
            alignItems: 'flex-start',
            flexWrap: 'wrap'
          }}>
            {/* TABLA DE POSICIONES - 50% del ancho */}
            <Box sx={{ 
              flex: '1 1 500px',
              minWidth: '450px',
              maxWidth: '100%'
            }}>
              <motion.div variants={cardVariants} whileHover="hover">
                <Box
                  sx={{
                    background: `
                      linear-gradient(145deg, 
                        rgba(0, 0, 0, 0.6) 0%,
                        rgba(0, 0, 0, 0.3) 100%
                      )
                    `,
                    backdropFilter: 'blur(25px)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  {/* Header de tabla */}
                  <Box sx={{
                    p: 4,
                    background: `
                      linear-gradient(135deg, 
                        rgba(255, 215, 0, 0.2) 0%,
                        rgba(255, 215, 0, 0.1) 100%
                      )
                    `,
                    borderBottom: '1px solid rgba(255, 215, 0, 0.3)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <motion.div
                        animate={{ rotate: [0, 15, -15, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <EmojiEvents sx={{ 
                          color: '#ffd700', 
                          fontSize: '2.5rem',
                          filter: 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.8))'
                        }} />
                      </motion.div>
                      <Typography variant="h4" sx={{ 
                        fontWeight: 900, 
                        color: 'white',
                        textShadow: '0 3px 15px rgba(255, 215, 0, 0.5)'
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
                            fontWeight: 800,
                            fontSize: '1rem',
                            height: 40,
                            background: `${obtenerColorCategoria(categoriaSeleccionada)}30`,
                            color: obtenerColorCategoria(categoriaSeleccionada),
                            border: `2px solid ${obtenerColorCategoria(categoriaSeleccionada)}60`,
                            boxShadow: `0 6px 20px ${obtenerColorCategoria(categoriaSeleccionada)}30`
                          }}
                        />
                      </motion.div>
                    )}
                  </Box>
                  
                  {/* Contenido de tabla */}
                  <Box sx={{ minHeight: '600px' }}>
                    {loading.tabla ? (
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: 600,
                        gap: 3
                      }}>
                        <motion.div
                          animate={{ 
                            rotate: 360,
                            scale: [1, 1.1, 1]
                          }}
                          transition={{ 
                            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                            scale: { duration: 1.5, repeat: Infinity }
                          }}
                        >
                          <CircularProgress 
                            size={80} 
                            thickness={4}
                            sx={{ 
                              color: '#ffd700',
                              filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.6))'
                            }} 
                          />
                        </motion.div>
                        <Typography variant="h5" sx={{ 
                          color: 'white',
                          fontWeight: 600,
                          textShadow: '0 2px 10px rgba(255, 215, 0, 0.3)'
                        }}>
                          🔄 Cargando clasificación épica...
                        </Typography>
                      </Box>
                    ) : tablaPosiciones.length === 0 ? (
                      <Box sx={{ 
                        textAlign: 'center', 
                        py: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 3
                      }}>
                        <motion.div
                          animate={{ 
                            y: [0, -20, 0],
                            opacity: [0.5, 1, 0.5]
                          }}
                          transition={{ 
                            duration: 3, 
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <EmojiEvents sx={{ 
                            fontSize: 120, 
                            color: 'rgba(255, 215, 0, 0.3)',
                            filter: 'drop-shadow(0 0 30px rgba(255, 215, 0, 0.2))'
                          }} />
                        </motion.div>
                        <Typography variant="h4" sx={{ 
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontWeight: 700
                        }}>
                          {torneoSeleccionado && categoriaSeleccionada 
                            ? '🏆 No hay equipos en esta categoría'
                            : '🏈 Selecciona torneo y categoría para comenzar'
                          }
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ p: 3 }}>
                        {/* Headers de tabla */}
                        <motion.div
                          initial={{ opacity: 0, x: -50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.6 }}
                        >
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            p: 3, 
                            mb: 2,
                            background: `
                              linear-gradient(135deg, 
                                rgba(255, 215, 0, 0.15) 0%,
                                rgba(255, 193, 7, 0.1) 100%
                              )
                            `, 
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 215, 0, 0.3)'
                          }}>
                            <Box sx={{ width: 80, textAlign: 'center', flexShrink: 0 }}>
                              <Typography variant="h6" sx={{ 
                                fontWeight: 900, 
                                color: '#ffd700',
                                textShadow: '0 2px 8px rgba(255, 215, 0, 0.5)'
                              }}>
                                POS
                              </Typography>
                            </Box>
                            <Box sx={{ flex: 1, ml: 2 }}>
                              <Typography variant="h6" sx={{ 
                                fontWeight: 900, 
                                color: 'white',
                                textShadow: '0 2px 8px rgba(255, 255, 255, 0.3)'
                              }}>
                                EQUIPO
                              </Typography>
                            </Box>
                            {[
                              { label: 'V', color: '#4caf50', width: 60 },
                              { label: 'D', color: '#f44336', width: 60 },
                              { label: 'PF', color: '#2196f3', width: 70 },
                              { label: 'PC', color: '#ff9800', width: 70 },
                              { label: 'DIF', color: '#9c27b0', width: 80 }
                            ].map((col, index) => (
                              <Box key={index} sx={{ width: col.width, textAlign: 'center', flexShrink: 0 }}>
                                <Typography variant="h6" sx={{ 
                                  fontWeight: 900, 
                                  color: col.color,
                                  textShadow: `0 2px 8px ${col.color}50`
                                }}>
                                  {col.label}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </motion.div>

                        {/* Filas de equipos */}
                        <AnimatePresence>
                          {tablaPosiciones.map((fila, index) => (
                            <motion.div
                              key={fila.equipo._id}
                              initial={{ opacity: 0, x: -100 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ 
                                duration: 0.6, 
                                delay: index * 0.1,
                                type: "spring",
                                stiffness: 100
                              }}
                              whileHover={{ 
                                scale: 1.02,
                                x: 10,
                                transition: { type: "spring", stiffness: 300 }
                              }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Box
                                onClick={() => handleSeleccionEquipo(fila)}
                                sx={{
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  p: 3, 
                                  mb: 2,
                                  background: equipoSeleccionado?.equipo._id === fila.equipo._id 
                                    ? `
                                        linear-gradient(135deg, 
                                          rgba(100, 181, 246, 0.3) 0%,
                                          rgba(100, 181, 246, 0.15) 100%
                                        )
                                      `
                                    : `
                                        linear-gradient(135deg, 
                                          rgba(255, 255, 255, 0.08) 0%,
                                          rgba(255, 255, 255, 0.03) 100%
                                        )
                                      `,
                                  borderRadius: '20px',
                                  border: equipoSeleccionado?.equipo._id === fila.equipo._id 
                                    ? '2px solid #64b5f6' 
                                    : '1px solid rgba(255, 255, 255, 0.1)',
                                  cursor: 'pointer',
                                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                  backdropFilter: 'blur(15px)',
                                  '&:hover': {
                                    background: `
                                      linear-gradient(135deg, 
                                        rgba(100, 181, 246, 0.2) 0%,
                                        rgba(156, 39, 176, 0.1) 100%
                                      )
                                    `,
                                    border: '2px solid rgba(100, 181, 246, 0.5)',
                                    boxShadow: '0 15px 40px rgba(100, 181, 246, 0.25)'
                                  }
                                }}
                              >
                                {/* Posición con efectos especiales */}
                                <Box sx={{ width: 80, textAlign: 'center', flexShrink: 0 }}>
                                  <motion.div
                                    whileHover={{ scale: 1.2, rotate: 10 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                  >
                                    <Chip 
                                      label={fila.posicion}
                                      sx={{
                                        width: 50, 
                                        height: 50, 
                                        fontSize: '1.2rem', 
                                        fontWeight: 900,
                                        ...(fila.posicion === 1 && {
                                          background: `
                                            linear-gradient(45deg, 
                                              #ffd700 0%, 
                                              #ffed4e 50%, 
                                              #ffd700 100%
                                            )
                                          `,
                                          color: '#000', 
                                          boxShadow: `
                                            0 0 30px rgba(255, 215, 0, 0.8),
                                            0 6px 20px rgba(255, 215, 0, 0.4)
                                          `,
                                          border: '2px solid #fff'
                                        }),
                                        ...(fila.posicion === 2 && {
                                          background: `
                                            linear-gradient(45deg, 
                                              #c0c0c0 0%, 
                                              #e8e8e8 50%, 
                                              #c0c0c0 100%
                                            )
                                          `, 
                                          color: '#000',
                                          boxShadow: '0 0 20px rgba(192, 192, 192, 0.6)'
                                        }),
                                        ...(fila.posicion === 3 && {
                                          background: `
                                            linear-gradient(45deg, 
                                              #cd7f32 0%, 
                                              #deb887 50%, 
                                              #cd7f32 100%
                                            )
                                          `, 
                                          color: '#000',
                                          boxShadow: '0 0 20px rgba(205, 127, 50, 0.6)'
                                        }),
                                        ...(fila.posicion > 3 && {
                                          background: `
                                            linear-gradient(45deg, 
                                              rgba(100, 181, 246, 0.3) 0%, 
                                              rgba(100, 181, 246, 0.1) 100%
                                            )
                                          `, 
                                          color: 'white',
                                          border: '1px solid rgba(100, 181, 246, 0.5)'
                                        })
                                      }}
                                    />
                                  </motion.div>
                                </Box>
                                
                                {/* Información del equipo */}
                                <Box sx={{ 
                                  flex: 1, 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 3, 
                                  ml: 2, 
                                  minWidth: 0 
                                }}>
                                  <motion.div
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                  >
                                    <Avatar 
                                      src={getImageUrl(fila.equipo.imagen)}
                                      sx={{ 
                                        width: 60, 
                                        height: 60,
                                        border: '3px solid rgba(100, 181, 246, 0.4)',
                                        boxShadow: `
                                          0 0 25px rgba(100, 181, 246, 0.3),
                                          inset 0 0 20px rgba(255, 255, 255, 0.1)
                                        `,
                                        background: `
                                          linear-gradient(145deg, 
                                            rgba(100, 181, 246, 0.2) 0%, 
                                            rgba(100, 181, 246, 0.05) 100%
                                          )
                                        `,
                                        backdropFilter: 'blur(10px)',
                                        flexShrink: 0
                                      }}
                                    >
                                      {fila.equipo.nombre?.charAt(0)}
                                    </Avatar>
                                  </motion.div>
                                  <Box sx={{ minWidth: 0, overflow: 'hidden', flex: 1 }}>
                                    <Typography variant="h5" sx={{ 
                                      fontWeight: 900, 
                                      color: 'white',
                                      textShadow: '0 2px 10px rgba(100, 181, 246, 0.5)',
                                      fontSize: '1.3rem',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      mb: 0.5
                                    }}>
                                      {fila.equipo.nombre}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                      <Typography variant="caption" sx={{ 
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        fontSize: '0.9rem',
                                        fontWeight: 600
                                      }}>
                                        📊 {fila.partidosJugados}/{fila.totalPartidos || fila.partidosJugados} partidos
                                      </Typography>
                                      {fila.posicion <= 3 && (
                                        <motion.div
                                          animate={{ rotate: [0, 10, -10, 0] }}
                                          transition={{ duration: 2, repeat: Infinity }}
                                        >
                                          <Chip 
                                            label="🔥 TOP 3"
                                            size="small"
                                            sx={{
                                              background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
                                              color: 'white',
                                              fontWeight: 800,
                                              fontSize: '0.7rem',
                                              boxShadow: '0 4px 12px rgba(255, 107, 107, 0.4)'
                                            }}
                                          />
                                        </motion.div>
                                      )}
                                    </Box>
                                  </Box>
                                </Box>
                                
                                {/* Estadísticas */}
                                {[
                                  { value: fila.victorias, color: '#4caf50', width: 60 },
                                  { value: fila.derrotas, color: '#f44336', width: 60 },
                                  { value: fila.puntosFavor, color: '#2196f3', width: 70 },
                                  { value: fila.puntosContra, color: '#ff9800', width: 70 },
                                  { 
                                    value: `${fila.diferenciaPuntos >= 0 ? '+' : ''}${fila.diferenciaPuntos}`, 
                                    color: fila.diferenciaPuntos >= 0 ? '#4caf50' : '#f44336', 
                                    width: 80 
                                  }
                                ].map((stat, index) => (
                                  <Box key={index} sx={{ width: stat.width, textAlign: 'center', flexShrink: 0 }}>
                                    <motion.div
                                      whileHover={{ scale: 1.15 }}
                                      transition={{ type: "spring", stiffness: 300 }}
                                    >
                                      <Typography variant="h5" sx={{ 
                                        fontWeight: 900,
                                        color: stat.color,
                                        textShadow: `0 0 15px ${stat.color}60`,
                                        fontSize: '1.4rem'
                                      }}>
                                        {stat.value}
                                      </Typography>
                                    </motion.div>
                                  </Box>
                                ))}
                              </Box>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </Box>
                    )}
                  </Box>
                </Box>
              </motion.div>
            </Box>

            {/* PANEL DE ESTADÍSTICAS - 50% del ancho */}
            <Box sx={{ 
              flex: '1 1 500px',
              minWidth: '450px',
              maxWidth: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 3
            }}>
              {/* Tendencia de puntos */}
              <Box sx={{ height: '350px' }}>
                <TendenciaEpica />
              </Box>
              
              {/* Grid de líderes */}
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 3,
                flex: 1
              }}>
                <LiderSuperEpico 
                  tipo="pases" 
                  titulo="MAESTRO DEL PASE" 
                  icono={<Sports />}
                  color="#1976d2"
                  gradient={['rgba(25, 118, 210, 0.25)', 'rgba(33, 150, 243, 0.1)']}
                />
                
                <LiderSuperEpico 
                  tipo="puntos" 
                  titulo="REY DE PUNTOS" 
                  icono={<LocalFireDepartment />}
                  color="#ff9800"
                  gradient={['rgba(255, 152, 0, 0.25)', 'rgba(255, 193, 7, 0.1)']}
                />
                
                <LiderSuperEpico 
                  tipo="tackleos" 
                  titulo="MURALLA DEFENSIVA" 
                  icono={<Shield />}
                  color="#4caf50"
                  gradient={['rgba(76, 175, 80, 0.25)', 'rgba(139, 195, 74, 0.1)']}
                />
                
                <LiderSuperEpico 
                  tipo="intercepciones" 
                  titulo="CAZADOR DE PASES" 
                  icono={<PanTool />}
                  color="#00bcd4"
                  gradient={['rgba(0, 188, 212, 0.25)', 'rgba(38, 198, 218, 0.1)']}
                />
                
                <LiderSuperEpico 
                  tipo="sacks" 
                  titulo="DESTRUCTOR QB" 
                  icono={<Bolt />}
                  color="#f44336"
                  gradient={['rgba(244, 67, 54, 0.25)', 'rgba(229, 57, 53, 0.1)']}
                />
                
                <LiderSuperEpico 
                  tipo="recepciones" 
                  titulo="MANOS SEGURAS" 
                  icono={<SportsFootball />}
                  color="#9c27b0"
                  gradient={['rgba(156, 39, 176, 0.25)', 'rgba(142, 36, 170, 0.1)']}
                />
              </Box>
            </Box>
          </Box>
        </motion.div>

        {/* RESUMEN DETALLADO DEL EQUIPO SELECCIONADO */}
        <AnimatePresence>
          {equipoSeleccionado && (
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -100, scale: 0.8 }}
              transition={{ 
                duration: 0.8, 
                type: "spring", 
                stiffness: 100,
                damping: 20
              }}
            >
              <Box
                sx={{
                  mt: 6,
                  background: `
                    linear-gradient(145deg, 
                      rgba(0, 0, 0, 0.7) 0%,
                      rgba(0, 0, 0, 0.4) 100%
                    )
                  `,
                  backdropFilter: 'blur(25px)',
                  border: '1px solid rgba(100, 181, 246, 0.3)',
                  borderRadius: '32px',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                {/* Efectos de fondo para el resumen */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `
                      radial-gradient(circle at 25% 25%, rgba(100, 181, 246, 0.15) 0%, transparent 50%),
                      radial-gradient(circle at 75% 75%, rgba(156, 39, 176, 0.1) 0%, transparent 50%)
                    `,
                    pointerEvents: 'none'
                  }}
                />
                
                {/* Header del resumen */}
                <Box sx={{
                  p: 5,
                  background: `
                    linear-gradient(135deg, 
                      rgba(100, 181, 246, 0.2) 0%,
                      rgba(156, 39, 176, 0.1) 100%
                    )
                  `,
                  borderBottom: '1px solid rgba(100, 181, 246, 0.2)',
                  position: 'relative'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 10 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Avatar 
                        src={getImageUrl(equipoSeleccionado.equipo.imagen)} 
                        sx={{ 
                          width: 100, 
                          height: 100,
                          border: '4px solid rgba(100, 181, 246, 0.4)',
                          boxShadow: `
                            0 0 40px rgba(100, 181, 246, 0.4),
                            inset 0 0 30px rgba(255, 255, 255, 0.1)
                          `,
                          background: `
                            linear-gradient(145deg, 
                              rgba(100, 181, 246, 0.2) 0%, 
                              rgba(100, 181, 246, 0.05) 100%
                            )
                          `
                        }}
                      >
                        {equipoSeleccionado.equipo.nombre?.charAt(0)}
                      </Avatar>
                    </motion.div>
                    <Box sx={{ flex: 1 }}>
                      <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Typography variant="h2" sx={{ 
                          fontWeight: 900, 
                          color: 'white',
                          textShadow: '0 4px 20px rgba(100, 181, 246, 0.5)',
                          fontSize: { xs: '2rem', md: '3rem' },
                          mb: 1
                        }}>
                          📊 ANÁLISIS COMPLETO
                        </Typography>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <Typography variant="h3" sx={{ 
                          color: '#64b5f6',
                          fontWeight: 800,
                          textShadow: '0 2px 15px rgba(100, 181, 246, 0.4)',
                          fontSize: { xs: '1.5rem', md: '2rem' }
                        }}>
                          {equipoSeleccionado.equipo.nombre}
                        </Typography>
                      </motion.div>
                    </Box>
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Chip 
                        label={`🏆 POSICIÓN #${equipoSeleccionado.posicion}`}
                        sx={{ 
                          background: 'linear-gradient(45deg, #ffd700, #ffed4e)',
                          color: '#000',
                          fontWeight: 900,
                          fontSize: '1.2rem',
                          height: 50,
                          boxShadow: '0 8px 25px rgba(255, 215, 0, 0.5)',
                          border: '2px solid rgba(255, 255, 255, 0.3)'
                        }}
                      />
                    </motion.div>
                  </Box>
                </Box>
                
                {/* Estadísticas del resumen */}
                <Box sx={{ p: 5 }}>
                  <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 4
                  }}>
                    {[
                      { 
                        label: '🏆 Posición Final',
                        value: `#${equipoSeleccionado.posicion}`,
                        color: '#ffd700',
                        gradient: ['rgba(255, 215, 0, 0.25)', 'rgba(255, 193, 7, 0.1)'],
                        icon: <EmojiEvents />
                      },
                      { 
                        label: '✅ Victorias Conseguidas',
                        value: equipoSeleccionado.victorias || 0,
                        color: '#4caf50',
                        gradient: ['rgba(76, 175, 80, 0.25)', 'rgba(139, 195, 74, 0.1)'],
                        icon: <Speed />
                      },
                      { 
                        label: '📊 Promedio de Puntos',
                        value: (equipoSeleccionado.promedioPuntos || 0).toFixed(1),
                        color: '#ff9800',
                        gradient: ['rgba(255, 152, 0, 0.25)', 'rgba(255, 193, 7, 0.1)'],
                        icon: <TrendingUp />
                      },
                      { 
                        label: '⚡ Diferencia Total',
                        value: `${(equipoSeleccionado.diferenciaPuntos || 0) >= 0 ? '+' : ''}${equipoSeleccionado.diferenciaPuntos || 0}`,
                        color: (equipoSeleccionado.diferenciaPuntos || 0) >= 0 ? '#4caf50' : '#f44336',
                        gradient: (equipoSeleccionado.diferenciaPuntos || 0) >= 0 
                          ? ['rgba(76, 175, 80, 0.25)', 'rgba(139, 195, 74, 0.1)']
                          : ['rgba(244, 67, 54, 0.25)', 'rgba(229, 57, 53, 0.1)'],
                        icon: <Whatshot />
                      }
                    ].map((stat, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 50, rotateX: -90 }}
                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                        transition={{ 
                          delay: index * 0.2,
                          duration: 0.8,
                          type: "spring",
                          stiffness: 100
                        }}
                        whileHover={{
                          scale: 1.05,
                          rotateY: 10,
                          transition: { type: "spring", stiffness: 300 }
                        }}
                      >
                        <Box
                          sx={{
                            textAlign: 'center',
                            p: 4,
                            background: `linear-gradient(145deg, ${stat.gradient[0]}, ${stat.gradient[1]})`,
                            border: `2px solid ${stat.color}40`,
                            borderRadius: '24px',
                            backdropFilter: 'blur(15px)',
                            position: 'relative',
                            overflow: 'hidden',
                            '&:hover': {
                              border: `2px solid ${stat.color}80`,
                              boxShadow: `0 15px 40px ${stat.color}30`
                            }
                          }}
                        >
                          {/* Efecto de brillo en hover */}
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: '-100%',
                              width: '100%',
                              height: '100%',
                              background: `linear-gradient(90deg, transparent, ${stat.color}20, transparent)`,
                              transition: 'left 0.6s',
                              '.MuiBox-root:hover &': {
                                left: '100%'
                              }
                            }}
                          />
                          
                          <motion.div
                            animate={{ 
                              rotate: [0, 10, -10, 0],
                              scale: [1, 1.1, 1]
                            }}
                            transition={{ 
                              duration: 4, 
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          >
                            {React.cloneElement(stat.icon, {
                              sx: {
                                fontSize: '3rem',
                                color: stat.color,
                                filter: `drop-shadow(0 0 15px ${stat.color}60)`,
                                mb: 2
                              }
                            })}
                          </motion.div>
                          
                          <Typography variant="h2" sx={{ 
                            fontWeight: 900,
                            color: stat.color,
                            textShadow: `0 0 25px ${stat.color}60`,
                            mb: 2,
                            fontSize: { xs: '2.5rem', md: '3.5rem' }
                          }}>
                            {stat.value}
                          </Typography>
                          
                          <Typography variant="h6" sx={{ 
                            color: 'rgba(255, 255, 255, 0.9)',
                            fontWeight: 700,
                            textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
                          }}>
                            {stat.label}
                          </Typography>
                        </Box>
                      </motion.div>
                    ))}
                  </Box>
                </Box>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </Box>
  );
};