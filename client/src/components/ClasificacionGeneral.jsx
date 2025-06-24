// 📁 src/components/ClasificacionGeneral.jsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  EmojiEvents,
  Star as StarIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  SportsTennis as TennisIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axiosInstance from '../config/axios';
import { useImage } from '../hooks/useImage';

// 🎯 TIPOS DE ESTADÍSTICAS DISPONIBLES
const tiposEstadisticas = ['puntos', 'qbrating', 'recepciones', 'tackleos', 'intercepciones'];

// 🎨 CONFIGURACIÓN DE TIPOS
const CONFIGURACION_TIPOS = {
  puntos: {
    icono: <StarIcon />,
    color: '#ffd700',
    bgColor: 'rgba(255, 215, 0, 0.05)',
    gradient: "linear-gradient(145deg, #ffd700, #ffed4e)",
    titulo: "Rey de Puntos",
    label: "Puntos Totales"
  },
  qbrating: {
    icono: <SpeedIcon />,
    color: '#2196f3',
    bgColor: 'rgba(33, 150, 243, 0.05)',
    gradient: "linear-gradient(145deg, #2196f3, #64b5f6)",
    titulo: "Maestro QB",
    label: "QB Rating"
  },
  tackleos: {
    icono: <SecurityIcon />,
    color: '#9c27b0',
    bgColor: 'rgba(156, 39, 176, 0.05)',
    gradient: "linear-gradient(145deg, #9c27b0, #ba68c8)",
    titulo: "Muro Defensivo",
    label: "Tackleos"
  },
  intercepciones: {
    icono: <TimelineIcon />,
    color: '#e91e63',
    bgColor: 'rgba(233, 30, 99, 0.05)',
    gradient: "linear-gradient(145deg, #e91e63, #f48fb1)",
    titulo: "Interceptor",
    label: "Intercepciones"
  },
  recepciones: {
    icono: <TennisIcon />,
    color: '#f57c00',
    bgColor: 'rgba(245, 124, 0, 0.05)',
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
          height: '420px', // Altura aumentada para mostrar TOP 5
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
          height: '420px', // Altura aumentada
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {config.icono && React.cloneElement(config.icono, { 
          sx: { fontSize: '2rem', color: config.color, mb: 2, opacity: 0.5 } 
        })}
        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
          Sin estadísticas
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
          No hay datos de {config.label.toLowerCase()}
        </Typography>
      </Box>
    );
  }

  // 🖼️ URLs de imágenes con hook
  const liderImageUrl = useImage(lider.jugador?.imagen);
  const equipoImageUrl = useImage(lider.equipo?.imagen);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Box
        sx={{
          position: 'relative',
          background: `linear-gradient(145deg, ${config.color}20, ${config.color}10)`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${config.color}30`,
          borderRadius: 3,
          p: 3,
          height: '420px', // Altura aumentada para mostrar TOP 5
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-2px)',
            transition: 'transform 0.3s ease',
            boxShadow: `0 8px 25px ${config.color}40`
          }
        }}
      >
        {/* Background sutil del logo del equipo - ESQUINA INFERIOR DERECHA */}
        {equipoImageUrl && (
          <Box
            component="img"
            src={equipoImageUrl}
            sx={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              width: '80px',
              height: '80px',
              opacity: 0.08,
              filter: 'grayscale(30%)',
              borderRadius: '50%',
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
              src={liderImageUrl}
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
                  label={`#${lider.jugador?.numero || '?'}`}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    minWidth: 28
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
                mb: 1, 
                display: 'block',
                textTransform: 'uppercase',
                fontSize: '0.7rem'
              }}
            >
              TOP 5
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {restantes.map((jugador, index) => {
                const jugadorImageUrl = useImage(jugador.jugador?.imagen);
                const posicion = index + 2; // Posiciones 2, 3, 4, 5
                
                return (
                  <Box
                    key={`${tipo}-${jugador.jugador?._id}-${index}`}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 1,
                      borderRadius: 1,
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    {/* Posición con más ancho */}
                    <Chip
                      label={posicion}
                      size="small"
                      sx={{
                        height: 20,
                        width: 32, // Ancho aumentado
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        bgcolor: config.color,
                        color: 'white',
                        '& .MuiChip-label': {
                          px: 0.5 // Padding reducido para centrar mejor
                        }
                      }}
                    />

                    {/* Avatar */}
                    <Avatar
                      src={jugadorImageUrl}
                      sx={{
                        width: 24,
                        height: 24,
                        fontSize: '0.7rem',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)'
                      }}
                    >
                      {jugador.jugador?.nombre?.charAt(0) || '?'}
                    </Avatar>

                    {/* Información con más espacio */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          lineHeight: 1.2
                        }}
                      >
                        {jugador.jugador?.nombre}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'rgba(255,255,255,0.6)',
                          fontSize: '0.65rem',
                          display: 'block',
                          lineHeight: 1
                        }}
                      >
                        #{jugador.jugador?.numero || '?'}
                      </Typography>
                    </Box>

                    {/* Valor con más espacio */}
                    <Box sx={{ minWidth: 40, textAlign: 'right' }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: config.color,
                          fontWeight: 700,
                          fontSize: '0.75rem'
                        }}
                      >
                        {tipo === 'qbrating' ? Number(jugador.valor).toFixed(1) : jugador.valor}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Box>
    </motion.div>
  );
};

// 🏆 COMPONENTE PRINCIPAL
const ClasificacionGeneral = ({ torneoId, categoria }) => {
  const [clasificacion, setClasificacion] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      {/* Grid de tarjetas - SIN HEADER */}
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