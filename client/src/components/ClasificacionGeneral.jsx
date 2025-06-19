// 📁 src/components/ClasificacionGeneral.jsx

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

// 🎨 CONFIGURACIÓN DE ICONOS Y COLORES - ACTUALIZADA CON QB RATING
const CONFIGURACION_TIPOS = {
  qbrating: {
    icono: <Sports />,
    titulo: "MAESTRO QB",
    color: "#3b82f6",
    gradient: "linear-gradient(145deg, #1976d2, #42a5f5)",
    label: "QB Rating"
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

// 🎨 FUNCIÓN HELPER PARA OBTENER COLOR DEL QB RATING
const obtenerColorQBRating = (rating) => {
  if (rating >= 130) return '#4caf50'; // Verde - Excelente
  if (rating >= 110) return '#2196f3'; // Azul - Muy bueno
  if (rating >= 90) return '#ff9800';  // Naranja - Bueno
  if (rating >= 70) return '#ffeb3b';  // Amarillo - Regular
  return '#f44336'; // Rojo - Malo
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
          backdropFilter: 'blur(10px)',
          border: `1px solid ${config.color}30`,
          borderRadius: 3,
          p: 3,
          height: '320px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CircularProgress sx={{ color: config.color }} />
      </Box>
    );
  }

  if (!lider) {
    return (
      <Box
        sx={{
          background: `linear-gradient(145deg, ${config.color}20, ${config.color}10)`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${config.color}30`,
          borderRadius: 3,
          p: 3,
          height: '320px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {config.icono && React.cloneElement(config.icono, { 
          sx: { fontSize: '2rem', color: config.color, mb: 2, opacity: 0.5 } 
        })}
        <Typography variant="h6" sx={{ color: config.color, textAlign: 'center', mb: 1 }}>
          {config.titulo}
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
          Sin datos disponibles
        </Typography>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Box
        sx={{
          background: `linear-gradient(145deg, ${config.color}25, ${config.color}10)`,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${config.color}40`,
          borderRadius: 3,
          p: 3,
          // 🔧 ALTURA DE LA TARJETA - Ajustar aquí si necesitas más espacio para el Top 5
          height: '520px', // Aumentado de 320px a 420px (+100px)
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 12px 40px ${config.color}30`,
            border: `1px solid ${config.color}60`
          }
        }}
      >
        {/* 🔥 BACKGROUND DEL LOGO DEL EQUIPO - Atenuado y circular */}
        {lider.equipo?.imagen && (
          <Box
            sx={{
              position: 'absolute',
              bottom: '20px', // 🔧 POSICIÓN VERTICAL - Esquina inferior
              right: '20px',  // 🔧 POSICIÓN HORIZONTAL - Esquina derecha
              width: '120px', // 🔧 TAMAÑO DEL CÍRCULO - Ajustar entre 80px-150px
              height: '120px',
              backgroundImage: `url(${getImageUrl(lider.equipo.imagen)})`,
              backgroundSize: 'cover', // Cambiado de 'contain' a 'cover' para mejor ajuste circular
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              opacity: 0.12, // 🔧 TRANSPARENCIA - Aumentada un poco para mejor visibilidad
              filter: 'grayscale(30%)', // Reducido para mantener algo de color
              borderRadius: '50%', // 🔥 CÍRCULO PERFECTO - Elimina bordes cuadrados
              pointerEvents: 'none',
              zIndex: 0
            }}
          />
        )}

        {/* Header con ícono y título */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, position: 'relative', zIndex: 1 }}>
          {config.icono && React.cloneElement(config.icono, { 
            sx: { fontSize: '1.4rem', color: config.color } 
          })}
          <Typography 
            variant="h6" 
            sx={{ 
              color: config.color, 
              fontWeight: 800, 
              fontSize: '0.9rem',
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}
          >
            {config.titulo}
          </Typography>
        </Box>

        {/* Líder Principal (#1) */}
        <Box
          sx={{
            background: config.gradient,
            borderRadius: 2,
            p: 2,
            mb: 2,
            position: 'relative',
            overflow: 'hidden',
            zIndex: 1 // Asegurar que esté sobre el background del logo
          }}
        >
          {/* Corona para el #1 */}
          <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
            <EmojiEvents sx={{ color: '#ffd700', fontSize: '1.2rem' }} />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={getImageUrl(lider.jugador?.imagen)}
              sx={{
                width: 50,
                height: 50,
                border: '3px solid rgba(255,255,255,0.3)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
            >
              {lider.jugador?.nombre?.charAt(0) || '?'}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'white', 
                  fontWeight: 700,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {lider.jugador?.nombre || 'Jugador'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Chip
                  label={`#${lider.jugador?.numero || 0}`}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white'
                  }}
                />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  {lider.equipo?.nombre || 'Equipo'}
                </Typography>
              </Box>
            </Box>

            {/* Valor Principal - CON FORMATO ESPECIAL PARA QB RATING */}
            <Box sx={{ textAlign: 'right' }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  color: tipo === 'qbrating' ? obtenerColorQBRating(lider.valor) : 'white', 
                  fontWeight: 900,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                  fontSize: tipo === 'qbrating' ? '1.8rem' : '2rem'
                }}
              >
                {/* 🔥 FORMATO ESPECIAL PARA QB RATING */}
                {tipo === 'qbrating' ? Number(lider.valor).toFixed(1) : lider.valor}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'rgba(255,255,255,0.9)',
                  fontWeight: 600,
                  fontSize: '0.7rem'
                }}
              >
                {config.label}
              </Typography>
              
              {/* 🔥 INFORMACIÓN ADICIONAL PARA QB RATING */}
              {tipo === 'qbrating' && lider.qbRatingData && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: '0.65rem',
                    display: 'block',
                    mt: 0.5
                  }}
                >
                  {lider.qbRatingData.completados}/{lider.qbRatingData.intentos} ({lider.qbRatingData.porcentajeComplecion}%)
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* Top 2-5 */}
        {restantes.length > 0 && (
          <Box sx={{ position: 'relative', zIndex: 1 }}> {/* Asegurar que esté sobre el background */}
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255,255,255,0.7)', 
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                mb: 1,
                display: 'block'
              }}
            >
              Top {restantes.length + 1}
            </Typography>
            
            <AnimatePresence>
              {restantes.map((jugador, index) => (
                <motion.div
                  key={jugador.jugador?._id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      py: 1,
                      px: 1.5,
                      mb: 1,
                      background: `linear-gradient(90deg, ${config.color}15, transparent)`,
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: `linear-gradient(90deg, ${config.color}25, ${config.color}10)`,
                        transform: 'translateX(4px)'
                      }
                    }}
                  >
                    {/* Posición */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      minWidth: 24,
                      mr: 1
                    }}>
                      <Typography variant="caption" sx={{ 
                        color: config.color,
                        fontWeight: 900,
                        fontSize: '0.8rem'
                      }}>
                        #{index + 2}
                      </Typography>
                    </Box>

                    {/* Avatar pequeño */}
                    <Avatar
                      src={getImageUrl(jugador.jugador?.imagen)}
                      sx={{
                        width: 28,
                        height: 28,
                        mr: 1,
                        border: `1px solid ${config.color}40`
                      }}
                    >
                      {jugador.jugador?.nombre?.charAt(0) || '?'}
                    </Avatar>

                    {/* Info del jugador */}
                    <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
                      <Typography variant="caption" sx={{ 
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block'
                      }}>
                        {jugador.jugador?.nombre}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '0.65rem'
                      }}>
                        #{jugador.jugador?.numero}
                      </Typography>
                    </Box>

                    {/* Valor - CON FORMATO ESPECIAL PARA QB RATING */}
                    <Box sx={{ 
                      background: `linear-gradient(145deg, ${config.color}40, ${config.color}20)`,
                      borderRadius: '12px',
                      px: 1.5,
                      py: 0.5,
                      flexShrink: 0
                    }}>
                      <Typography variant="body2" sx={{ 
                        color: tipo === 'qbrating' ? obtenerColorQBRating(jugador.valor) : 'white',
                        fontWeight: 900,
                        fontSize: '0.85rem'
                      }}>
                        {/* 🔥 FORMATO ESPECIAL PARA QB RATING */}
                        {tipo === 'qbrating' ? Number(jugador.valor).toFixed(1) : jugador.valor}
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

  // 🔥 TIPOS DE ESTADÍSTICAS ACTUALIZADOS: 'pases' → 'qbrating'
  const tiposEstadisticas = ['qbrating', 'puntos', 'recepciones', 'tackleos', 'intercepciones', 'sacks'];

  // Cargar datos de clasificación
  useEffect(() => {
    const cargarClasificacion = async () => {
      if (!torneoId || !categoria) return;

      setLoading(true);
      setError(null);

      try {
        console.log(`🏆 Cargando clasificación general: ${torneoId}/${categoria}`);
        const response = await axiosInstance.get(`/estadisticas/clasificacion-general/${torneoId}/${categoria}`);
        
        console.log('✅ Clasificación cargada:', response.data.clasificacionGeneral);
        setClasificacion(response.data.clasificacionGeneral || {});
      } catch (error) {
        console.error('❌ Error cargando clasificación:', error);
        setError(error.response?.data?.mensaje || 'Error al cargar clasificación');
        setClasificacion({});
      } finally {
        setLoading(false);
      }
    };

    cargarClasificacion();
  }, [torneoId, categoria]);

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" sx={{ color: 'error.main', mb: 2 }}>
          Error al cargar clasificación
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 900,
            background: 'linear-gradient(45deg, #ffd700, #ffed4e)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            mb: 1
          }}
        >
          🏆 CLASIFICACIÓN GENERAL
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
          Top 5 líderes por categoría
        </Typography>
      </Box>

      {/* Grid de tarjetas */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: 3,
          width: '100%'
        }}
      >
        {tiposEstadisticas.map((tipo) => (
          <TarjetaClasificacion
            key={tipo}
            tipo={tipo}
            lideresData={clasificacion[tipo]}
            loading={loading}
          />
        ))}
      </Box>

      {/* Footer info */}
      {!loading && Object.keys(clasificacion).length > 0 && (
        <Box sx={{ textAlign: 'center', mt: 4, pt: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            🔄 Actualizado automáticamente • 📊 Basado en partidos finalizados
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ClasificacionGeneral;