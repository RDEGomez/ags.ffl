import React, { useState } from 'react';
import { Box, Typography, Avatar, Chip, CircularProgress, Tabs, Tab } from '@mui/material';
import { motion } from 'framer-motion';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useImage } from '../hooks/useImage';
import TarjetaEstadisticasRadar from '../components/TarjetaEstadisticasRadar';

export const MegaTarjetaEstadisticasPersonales = ({ usuario, estadisticasPersonales, loading, error, onActualizar }) => {
  const userImageUrl = useImage(usuario?.imagen);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(0);

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
        <Box sx={{
          background: 'linear-gradient(145deg, rgba(30,30,60,0.95), rgba(50,50,80,0.95))',
          backdropFilter: 'blur(15px)',
          border: '2px solid rgba(64, 181, 246, 0.3)',
          borderRadius: 4,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px',
          textAlign: 'center'
        }}>
          <CircularProgress size={60} sx={{ color: '#64b5f6', mb: 3 }} />
          <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
            Cargando estadísticas personales...
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Obteniendo datos de rendimiento del torneo
          </Typography>
        </Box>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
        <Box sx={{
          background: 'linear-gradient(145deg, rgba(30,30,60,0.95), rgba(50,50,80,0.95))',
          backdropFilter: 'blur(15px)',
          border: '2px solid rgba(244, 67, 54, 0.3)',
          borderRadius: 4,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px',
          textAlign: 'center'
        }}>
          <ErrorIcon sx={{ fontSize: 60, color: '#f44336', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
            Error al cargar estadísticas
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
            {error}
          </Typography>
          {onActualizar && (
            <Box
              component={motion.div}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onActualizar}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 3,
                py: 1.5,
                borderRadius: 2,
                backgroundColor: 'rgba(33, 150, 243, 0.2)',
                border: '1px solid #2196f3',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(33, 150, 243, 0.3)'
                }
              }}
            >
              <RefreshIcon sx={{ color: '#2196f3' }} />
              <Typography variant="button" sx={{ color: '#2196f3' }}>
                Reintentar
              </Typography>
            </Box>
          )}
        </Box>
      </motion.div>
    );
  }

  if (!estadisticasPersonales || !estadisticasPersonales.equipos || estadisticasPersonales.equipos.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
        <Box sx={{
          background: 'linear-gradient(145deg, rgba(30,30,60,0.95), rgba(50,50,80,0.95))',
          backdropFilter: 'blur(15px)',
          border: '2px solid rgba(255, 193, 7, 0.3)',
          borderRadius: 4,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px',
          textAlign: 'center'
        }}>
          <WarningIcon sx={{ fontSize: 60, color: '#ffc107', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
            Sin estadísticas disponibles
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Aún no tienes estadísticas registradas en este torneo
          </Typography>
        </Box>
      </motion.div>
    );
  }

  const { equipos } = estadisticasPersonales;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
      <Box>
        {/* Avatar e info */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 3
        }}>
          <Avatar
            src={userImageUrl}
            sx={{
              width: 64,
              height: 64,
              border: '2px solid rgba(64, 181, 246, 0.8)',
              background: 'rgba(64, 181, 246, 0.1)',
              fontWeight: 'bold'
            }}
          >
            {usuario?.nombre?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
              Mis Estadísticas 🏆
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {usuario?.nombre}
            </Typography>
          </Box>
        </Box>

        {/* Tabs */}
        <Tabs
          value={equipoSeleccionado}
          onChange={(e, newValue) => setEquipoSeleccionado(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            mb: 2,
            '& .MuiTab-root': { color: 'rgba(255,255,255,0.5)' },
            '& .Mui-selected': { color: '#64b5f6', fontWeight: 'bold' },
            '& .MuiTabs-indicator': { backgroundColor: '#64b5f6' }
          }}
        >
          {equipos.map((eq, index) => (
            <Tab key={index} label={`${eq.equipo?.nombre} (${eq.equipo.categoria})` || `Equipo ${index + 1}`} />
          ))}
        </Tabs>

        {/* Contenido */}
        <TarjetaEstadisticasRadar
          estadisticasEquipo={{
            ...equipos[equipoSeleccionado],
            jugador: {
              nombre: usuario?.nombre,
              imagen: usuario?.imagen
            }
          }}
          equipo={equipos[equipoSeleccionado].equipo}
        />
      </Box>
    </motion.div>
  );
};
