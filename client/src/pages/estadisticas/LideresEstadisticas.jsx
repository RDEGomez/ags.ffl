// 📁 src/pages/estadisticas/LideresEstadisticas.jsx

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
  Shield
} from '@mui/icons-material';
import SportsKabaddiIcon from '@mui/icons-material/SportsKabaddi';
import SportsHandballIcon from '@mui/icons-material/SportsHandball';
import ScoreboardIcon from '@mui/icons-material/Scoreboard';
import WavingHandIcon from '@mui/icons-material/WavingHand';
import TransferWithinAStationIcon from '@mui/icons-material/TransferWithinAStation';
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
  }
};

const LiderCard = ({ 
  tipo, 
  titulo, 
  icono, 
  color, 
  lideresDelTipo = [], // Recibir todos los líderes en lugar de solo uno
  equipoSeleccionado, 
  loading 
}) => {
  if (loading) {
    return (
      <Box
        sx={{
          background: 'linear-gradient(145deg, rgba(64, 181, 246, 0.1), rgba(64, 181, 246, 0.05))',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(64, 181, 246, 0.2)',
          borderRadius: 3,
          p: 3,
          height: '350px', // Misma altura que las tarjetas con datos
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CircularProgress sx={{ color: '#64b5f6' }} />
      </Box>
    );
  }

  if (!lideresDelTipo || lideresDelTipo.length === 0) {
    return (
      <Box
        sx={{
          background: 'linear-gradient(145deg, rgba(64, 181, 246, 0.1), rgba(64, 181, 246, 0.05))',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(64, 181, 246, 0.2)',
          borderRadius: 3,
          p: 3,
          height: '350px', // Misma altura que las otras tarjetas
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}
      >
        {icono && React.cloneElement(icono, { 
          sx: { fontSize: '2rem', color: color, mb: 2, opacity: 0.5 } 
        })}
        <Typography variant="h6" sx={{ color: color, fontWeight: 700, mb: 1 }}>
          {titulo}
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          Sin estadísticas
        </Typography>
      </Box>
    );
  }

  const lider = lideresDelTipo[0]; // Líder principal
  const topRestantes = lideresDelTipo.slice(1, 5); // Posiciones 2-5

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Box
        sx={{
          background: `linear-gradient(145deg, ${color}20, ${color}10)`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${color}30`,
          borderRadius: 3,
          p: 3,
          height: '350px', // Altura aumentada para mostrar TOP 5
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: `0 8px 25px ${color}40`,
            transform: 'translateY(-2px)'
          }
        }}
      >
        {/* Header con ícono y título */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          {icono && React.cloneElement(icono, { sx: { color } })}
          <Typography variant="h6" sx={{ color, fontWeight: 700, fontSize: '0.9rem' }}>
            {titulo}
          </Typography>
        </Box>

        {/* Líder Principal (#1) */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          mb: 2,
          p: 2,
          borderRadius: 2,
          background: `${color}20`,
          border: `1px solid ${color}40`
        }}>
          <Avatar
            src={getImageUrl(lider.jugador?.imagen)}
            sx={{
              width: 40,
              height: 40,
              border: `2px solid ${color}`,
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
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '0.9rem'
              }}
            >
              {lider.jugador?.nombre || 'Jugador'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={`#${lider.jugador?.numero || '?'}`}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  bgcolor: color,
                  color: 'white'
                }}
              />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                {lider.equipo?.nombre || equipoSeleccionado?.equipo?.nombre || 'Equipo'}
              </Typography>
            </Box>
          </Box>

          {/* Valor del líder */}
          <Typography 
            variant="h5" 
            sx={{ 
              color, 
              fontWeight: 900,
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
            }}
          >
            {tipo === 'qbrating' ? Number(lider.valor).toFixed(1) : lider.valor}
          </Typography>
        </Box>

        {/* TOP 5 (posiciones 2-5) */}
        {topRestantes.length > 0 && (
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255,255,255,0.7)', 
                fontWeight: 600, 
                mb: 1, 
                display: 'block',
                fontSize: '0.7rem'
              }}
            >
              TOP 5
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {topRestantes.map((jugador, index) => (
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
                  {/* Posición */}
                  <Chip
                    label={`#${index + 2}`}
                    size="small"
                    sx={{
                      height: 18,
                      width: 24,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      bgcolor: `${color}60`,
                      color: 'white'
                    }}
                  />

                  {/* Avatar pequeño */}
                  <Avatar
                    src={getImageUrl(jugador.jugador?.imagen)}
                    sx={{
                      width: 20,
                      height: 20,
                      fontSize: '0.6rem',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    {jugador.jugador?.nombre?.charAt(0) || '?'}
                  </Avatar>

                  {/* Información del jugador */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {jugador.jugador?.nombre || 'Jugador'}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '0.65rem',
                        display: 'block'
                      }}
                    >
                      #{jugador.jugador?.numero || '?'}
                    </Typography>
                  </Box>

                  {/* Valor */}
                  <Typography
                    variant="caption"
                    sx={{
                      color,
                      fontWeight: 700,
                      fontSize: '0.7rem'
                    }}
                  >
                    {tipo === 'qbrating' ? Number(jugador.valor).toFixed(1) : jugador.valor}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </motion.div>
  );
};

// 🏆 COMPONENTE PRINCIPAL - CON SOPORTE PARA MODAL
export const LideresEstadisticas = ({ 
  lideresEstadisticas = {}, 
  equipoSeleccionado, 
  loading,
  sinHeader = false, // Nueva prop para quitar header
  layoutModal = false // Nueva prop para layout de modal
}) => {
  // 📊 CONFIGURACIÓN DE LÍDERES
  const tiposLideres = [
    {
      tipo: 'qbrating',
      titulo: 'QB Rating',
      icono: <SportsHandballIcon sx={{ fontSize: '1.1rem' }} />,
      color: '#2196f3'
    },
    {
      tipo: 'puntos',
      titulo: 'Puntos',
      icono: <ScoreboardIcon sx={{ fontSize: '1.1rem' }} />,
      color: '#ff6b35'
    },
    {
      tipo: 'recepciones',
      titulo: 'Recepciones',
      icono: <WavingHandIcon sx={{ fontSize: '1.1rem' }} />,
      color: '#4caf50'
    },
    {
      tipo: 'tackleos',
      titulo: 'Tackleos',
      icono: <Shield sx={{ fontSize: '1.1rem' }} />,
      color: '#9c27b0'
    },
    {
      tipo: 'intercepciones',
      titulo: 'Intercepciones',
      icono: <TransferWithinAStationIcon sx={{ fontSize: '1.1rem' }} />,
      color: '#ff9800'
    },
    {
      tipo: 'sacks',
      titulo: 'Sacks',
      icono: <SportsKabaddiIcon sx={{ fontSize: '1.1rem' }} />,
      color: '#f44336'
    }
  ];

  // Determinar el grid layout basado en el contexto
  const gridColumns = layoutModal 
    ? 'repeat(3, 1fr)' // 3 columnas en modal
    : 'repeat(auto-fit, minmax(280px, 1fr))'; // Layout original para dashboard

  return (
    <Box sx={{ gridColumn: layoutModal ? 'span 3' : 'auto' }}>
      {/* Header condicional */}
      {!sinHeader && (
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
      )}

      {/* Grid de tarjetas */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: gridColumns,
          gap: 2,
          width: '100%',
          '@media (max-width: 1024px)': {
            gridTemplateColumns: layoutModal ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(280px, 1fr))'
          },
          '@media (max-width: 768px)': {
            gridTemplateColumns: '1fr' // Una columna en móvil
          }
        }}
      >
        {tiposLideres.map((config) => {
          const lideresDelTipo = lideresEstadisticas[config.tipo] || [];

          return (
            <LiderCard
              key={config.tipo}
              {...config}
              lideresDelTipo={lideresDelTipo} // Pasar todos los líderes
              equipoSeleccionado={equipoSeleccionado}
              loading={loading?.lideres || false}
            />
          );
        })}
      </Box>
    </Box>
  );
};