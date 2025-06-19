import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Sports,
  EmojiEvents,
  Shield,
  Bolt,
  PanTool,
  SportsFootball,
  Star,
  AutoAwesome,
  TrendingUp
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../config/axios';

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

// 🎨 CONFIGURACIÓN DE ICONOS Y COLORES POR TIPO
const CONFIGURACION_TIPOS = {
  pases: {
    icono: <Sports />,
    titulo: "MAESTRO DEL PASE",
    color: "#3b82f6",
    gradient: "linear-gradient(145deg, #1976d2, #42a5f5)",
    label: "Pases Completados"
  },
  puntos: {
    icono: <EmojiEvents />,
    titulo: "REY DE PUNTOS", 
    color: "#fbbf24",
    gradient: "linear-gradient(145deg, #f57c00, #ffb74d)",
    label: "Puntos Totales"
  },
  tackleos: {
    icono: <Shield />,
    titulo: "MURO DEFENSIVO",
    color: "#10b981", 
    gradient: "linear-gradient(145deg, #388e3c, #66bb6a)",
    label: "Tackleos Exitosos"
  },
  intercepciones: {
    icono: <PanTool />,
    titulo: "CAZADOR DE PASES",
    color: "#ef4444",
    gradient: "linear-gradient(145deg, #d84315, #ff7043)", 
    label: "Intercepciones"
  },
  sacks: {
    icono: <Bolt />,
    titulo: "DEMOLEDOR QB",
    color: "#8b5cf6",
    gradient: "linear-gradient(145deg, #7b1fa2, #ba68c8)",
    label: "Sacks Realizados"
  },
  recepciones: {
    icono: <SportsFootball />,
    titulo: "MANOS SEGURAS",
    color: "#f97316",
    gradient: "linear-gradient(145deg, #f57c00, #ffb74d)",
    label: "Recepciones"
  }
};

// 🔥 COMPONENTE: TARJETA INDIVIDUAL DE LÍDER CON TOP 5
const TarjetaClasificacion = ({ tipo, lideresData, loading }) => {
  const config = CONFIGURACION_TIPOS[tipo];
  const lideres = lideresData?.lideres || [];
  const lider = lideres[0];
  const restantes = lideres.slice(1, 5); // Posiciones 2-5

  if (loading) {
    return (
      <Box
        sx={{
          background: `linear-gradient(145deg, ${config.color}20, ${config.color}10)`,
          backdropFilter: 'blur(25px)',
          border: `1px solid ${config.color}40`,
          borderRadius: '20px',
          p: 3,
          height: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CircularProgress sx={{ color: config.color }} size={60} />
      </Box>
    );
  }

  if (!lider) {
    return (
      <Box
        sx={{
          background: `linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))`,
          backdropFilter: 'blur(25px)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '20px',
          p: 3,
          height: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.6)' }}>
          Sin datos disponibles
        </Typography>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      whileHover={{ y: -8 }}
    >
      <Box
        sx={{
          background: `linear-gradient(145deg, ${config.color}20, ${config.color}10)`,
          backdropFilter: 'blur(25px)',
          border: `1px solid ${config.color}40`,
          borderRadius: '20px',
          overflow: 'hidden',
          height: '400px',
          position: 'relative',
          boxShadow: `
            0 8px 32px rgba(0,0,0,0.3),
            0 0 0 1px rgba(255,255,255,0.1),
            inset 0 1px 0 rgba(255,255,255,0.2)
          `,
          '&:hover': {
            boxShadow: `
              0 12px 40px rgba(0,0,0,0.4),
              0 0 0 1px rgba(255,255,255,0.2),
              inset 0 1px 0 rgba(255,255,255,0.3)
            `,
          }
        }}
      >
        {/* HEADER CON ICONO Y TÍTULO */}
        <Box
          sx={{
            p: 2,
            background: config.gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, zIndex: 2 }}>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {React.cloneElement(config.icono, { 
                sx: { 
                  color: 'white', 
                  fontSize: '2rem',
                  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))'
                } 
              })}
            </motion.div>
            <Typography variant="h6" sx={{ 
              color: 'white',
              fontWeight: 900,
              fontSize: '0.9rem',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
            }}>
              {config.titulo}
            </Typography>
          </Box>
          
          <Chip
            label={config.label}
            sx={{
              height: 22,
              fontSize: '0.65rem',
              fontWeight: 700,
              background: 'rgba(255, 255, 255, 0.25)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              zIndex: 2
            }}
          />

          {/* Efecto de brillo animado */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              transform: 'skewX(-12deg)',
              animation: 'shimmer 3s infinite',
              '@keyframes shimmer': {
                '0%': { left: '-100%' },
                '100%': { left: '100%' }
              }
            }}
          />
        </Box>

        {/* LÍDER PRINCIPAL */}
        <Box sx={{ p: 3, textAlign: 'center' }}>
          {/* Avatar con corona */}
          <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Avatar
                src={getImageUrl(lider.jugador.imagen)}
                sx={{
                  width: 70,
                  height: 70,
                  border: '3px solid white',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
                }}
              >
                {lider.jugador.nombre?.charAt(0)}
              </Avatar>
            </motion.div>
            
            {/* Corona dorada */}
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  width: 32,
                  height: 32,
                  background: 'linear-gradient(145deg, #ffd700, #ffb300)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)'
                }}
              >
                <EmojiEvents sx={{ color: 'white', fontSize: '1.2rem' }} />
              </Box>
            </motion.div>
          </Box>

          {/* Nombre del líder */}
          <Typography variant="h6" sx={{ 
            color: 'white',
            fontWeight: 900,
            mb: 0.5,
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
          }}>
            {lider.jugador.nombre}
          </Typography>
          
          <Typography variant="body2" sx={{ 
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: 600,
            mb: 2
          }}>
            #{lider.jugador.numero} • {lider.equipo.nombre}
          </Typography>

          {/* Valor principal animado */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Typography variant="h2" sx={{ 
              color: 'white',
              fontWeight: 900,
              textShadow: `0 0 20px ${config.color}80`,
              fontSize: '3rem',
              lineHeight: 1
            }}>
              {lider.valor}
            </Typography>
          </motion.div>
        </Box>

        {/* MINI TABLA CON LOS RESTANTES 4 */}
        {restantes.length > 0 && (
          <Box sx={{ 
            px: 2, 
            pb: 2,
            background: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(10px)'
          }}>
            <Divider sx={{ 
              borderColor: 'rgba(255, 255, 255, 0.2)', 
              mb: 1.5 
            }} />
            
            <AnimatePresence>
              {restantes.map((jugador, index) => (
                <motion.div
                  key={jugador.jugador._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    py: 1,
                    px: 1,
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}>
                    {/* Posición */}
                    <Box sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: `linear-gradient(145deg, ${config.color}60, ${config.color}40)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Typography variant="caption" sx={{ 
                        color: 'white',
                        fontWeight: 900,
                        fontSize: '0.7rem'
                      }}>
                        {jugador.posicion}
                      </Typography>
                    </Box>

                    {/* Avatar pequeño */}
                    <Avatar
                      src={getImageUrl(jugador.jugador.imagen)}
                      sx={{
                        width: 32,
                        height: 32,
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        flexShrink: 0
                      }}
                    >
                      {jugador.jugador.nombre?.charAt(0)}
                    </Avatar>

                    {/* Información del jugador */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ 
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {jugador.jugador.nombre}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '0.65rem'
                      }}>
                        #{jugador.jugador.numero}
                      </Typography>
                    </Box>

                    {/* Valor */}
                    <Box sx={{ 
                      background: `linear-gradient(145deg, ${config.color}40, ${config.color}20)`,
                      borderRadius: '12px',
                      px: 1.5,
                      py: 0.5,
                      flexShrink: 0
                    }}>
                      <Typography variant="body2" sx={{ 
                        color: 'white',
                        fontWeight: 900,
                        fontSize: '0.85rem'
                      }}>
                        {jugador.valor}
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </AnimatePresence>
          </Box>
        )}

        {/* Efecto de brillo sutil en el borde superior */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${config.color}80, transparent)`,
            animation: 'glow 3s infinite',
            '@keyframes glow': {
              '0%': { transform: 'translateX(-100%)' },
              '100%': { transform: 'translateX(100%)' }
            }
          }}
        />
      </Box>
    </motion.div>
  );
};

// 🔥 COMPONENTE PRINCIPAL: CLASIFICACIÓN GENERAL
export const ClasificacionGeneral = ({ torneoId, categoria }) => {
  const [clasificacion, setClasificacion] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Tipos de estadísticas a mostrar
  const tiposEstadisticas = ['puntos', 'pases', 'recepciones', 'tackleos', 'intercepciones', 'sacks'];

  // Cargar datos de clasificación
  useEffect(() => {
    const cargarClasificacion = async () => {
      if (!torneoId || !categoria) return;

      setLoading(true);
      setError(null);

      try {
        console.log('🏆 Cargando clasificación general...');
        const response = await axiosInstance.get(
          `/estadisticas/clasificacion-general/${torneoId}/${categoria}`
        );

        if (response.data?.clasificacionGeneral) {
          setClasificacion(response.data.clasificacionGeneral);
          console.log('✅ Clasificación cargada correctamente');
        }
      } catch (error) {
        console.error('❌ Error al cargar clasificación:', error);
        setError(error.response?.data?.mensaje || 'Error al cargar la clasificación');
      } finally {
        setLoading(false);
      }
    };

    cargarClasificacion();
  }, [torneoId, categoria]);

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <Box sx={{ mb: 6 }}>
        {/* Header de la sección */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          mb: 4,
          justifyContent: 'center'
        }}>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <TrendingUp sx={{ 
              color: '#ffd700', 
              fontSize: '3rem',
              filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.6))'
            }} />
          </motion.div>

          {/* ENCABEZADO CLASIFICACIÓN GENERAL - CAMBIAR POR ESTE CÓDIGO */}
          <Box sx={{ 
            mb: 4, 
            textAlign: 'center',
            position: 'relative'
          }}>
            {/* Efecto de fondo dinámico */}
            <motion.div
              animate={{
                background: [
                  'radial-gradient(ellipse at center, rgba(255,215,0,0.15) 0%, transparent 50%)',
                  'radial-gradient(ellipse at center, rgba(76,175,80,0.15) 0%, transparent 50%)',
                  'radial-gradient(ellipse at center, rgba(63,81,181,0.15) 0%, transparent 50%)',
                  'radial-gradient(ellipse at center, rgba(255,215,0,0.15) 0%, transparent 50%)'
                ]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: 'absolute',
                inset: -20,
                borderRadius: '50%',
                filter: 'blur(20px)'
              }}
            />
            
            {/* Título principal */}
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 900,
                  background: `
                    linear-gradient(145deg, 
                      #ffd700 0%,
                      #ffeb3b 25%,
                      #4caf50 50%,
                      #2196f3 75%,
                      #9c27b0 100%
                    )
                  `,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 4px 20px rgba(255, 215, 0, 0.3)',
                  mb: 1,
                  fontSize: { xs: '2.5rem', sm: '3rem' },
                  position: 'relative',
                  zIndex: 1
                }}
              >
                Clasificación General
              </Typography>
            </motion.div>
            
            {/* Subtítulo con animación */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Typography variant="h6" sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: 600,
                position: 'relative',
                zIndex: 1
              }}>
                🏆 Posiciones y estadísticas por categoría
              </Typography>
            </motion.div>
            
            {/* Línea decorativa animada */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              style={{
                height: '3px',
                background: 'linear-gradient(90deg, transparent, #ffd700, #4caf50, #2196f3, transparent)',
                marginTop: '16px',
                borderRadius: '2px',
                position: 'relative',
                zIndex: 1
              }}
            />
          </Box>
          
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <AutoAwesome sx={{ color: '#ffd700', fontSize: '2rem' }} />
          </motion.div>
        </Box>

        {/* Grid de tarjetas */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 3,
          maxWidth: '1400px',
          mx: 'auto'
        }}>
          {tiposEstadisticas.map((tipo, index) => (
            <motion.div
              key={tipo}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
            >
              <TarjetaClasificacion 
                tipo={tipo}
                lideresData={clasificacion[tipo]}
                loading={loading}
              />
            </motion.div>
          ))}
        </Box>

        {/* Indicador de carga global */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999
            }}
          >
            <Box sx={{
              background: 'linear-gradient(145deg, rgba(0,0,0,0.9), rgba(0,0,0,0.7))',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '20px',
              p: 4,
              textAlign: 'center'
            }}>
              <CircularProgress sx={{ color: '#ffd700', mb: 2 }} size={60} />
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                Cargando clasificación...
              </Typography>
            </Box>
          </motion.div>
        )}
      </Box>
    </motion.div>
  );
};

export default ClasificacionGeneral;