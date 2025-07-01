// 📁 client/src/pages/Home.jsx - REDISEÑO ÉPICO CON ESTADÍSTICAS PERSONALES

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Box, Typography, Paper, Grid, Chip, Avatar, Card, CardContent, 
  Divider, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Stack, Collapse, IconButton, List, ListItem,
  Badge, InputAdornment, FormControl, InputLabel, Select, MenuItem,
  Tooltip, Alert, useTheme, useMediaQuery
} from '@mui/material';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EmailIcon from '@mui/icons-material/Email';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import BadgeIcon from '@mui/icons-material/Badge';
import GroupsIcon from '@mui/icons-material/Groups';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SportsIcon from '@mui/icons-material/Sports';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ScheduleIcon from '@mui/icons-material/Schedule';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RefreshIcon from '@mui/icons-material/Refresh';
import axiosInstance from '../config/axios';
import { getCategoryName } from '../helpers/mappings';
import { useImage } from '../hooks/useImage';
import TeamCardGlass from '../components/TeamCardGlass';

// 🎯 NUEVOS ICONOS PARA ESTADÍSTICAS
import {
  Timeline as TimelineIcon,
  SportsFootball as FootballIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  SportsMma as TackleIcon,
  Security as InterceptionIcon,
  FlashOn as FlashOnIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';

// 🔥 IMPORTAR NUEVO COMPONENTE DE GRÁFICAS RADAR
import TarjetaEstadisticasRadar from '../components/TarjetaEstadisticasRadar';

// FUNCIÓN HELPER UNIFICADA para URLs de imágenes
const getImageUrl = (imagen) => {
  if (!imagen) return '';
  if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
    return imagen;
  }
  return `${import.meta.env.VITE_BACKEND_URL || ''}/uploads/${imagen}`;
};

// 🔥 COMPONENTE: Avatar del Usuario con Rol Overlapped
const UserProfileAvatar = ({ usuario, size = 120 }) => {
  const imagePath = useImage(usuario?.imagen);
  
  const roleColors = {
    admin: '#ff6b6b', capitan: '#4ecdc4', 
    jugador: '#45b7d1', arbitro: '#f9ca24'
  };
  
  const roleLabels = {
    admin: 'ADMIN', capitan: 'CAPITÁN', 
    jugador: 'JUGADOR', arbitro: 'ÁRBITRO'
  };

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, duration: 0.8 }}
    >
      <Box sx={{ position: 'relative', display: 'inline-block' }}>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          badgeContent={
            <Chip
              label={roleLabels[usuario?.rol] || 'USER'}
              size="small"
              sx={{
                backgroundColor: roleColors[usuario?.rol] || '#666',
                color: 'white', fontWeight: 'bold',
                fontSize: { xs: '0.6rem', md: '0.7rem' }, 
                height: { xs: '18px', md: '20px' },
                '& .MuiChip-label': { px: 1 }
              }}
            />
          }
        >
          <Avatar
            src={imagePath}
            sx={{
              width: size, height: size,
              border: `4px solid ${roleColors[usuario?.rol] || '#666'}`,
              boxShadow: `0 0 20px ${roleColors[usuario?.rol]}40`,
              background: `linear-gradient(135deg, ${roleColors[usuario?.rol]}20, ${roleColors[usuario?.rol]}40)`,
              fontSize: size * 0.4, fontWeight: 'bold',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: `0 0 30px ${roleColors[usuario?.rol]}60`
              }
            }}
          >
            {(usuario?.nombre?.charAt(0) || usuario?.email?.charAt(0) || 'U').toUpperCase()}
          </Avatar>
        </Badge>
      </Box>
    </motion.div>
  );
};

// 🔥 COMPONENTE: Estadística Individual con Estilo LideresEstadisticas
const EstadisticaItem = ({ icono, label, valor, color, descripcion, formato = 'numero' }) => {
  const formatearValor = (val, fmt) => {
    switch (fmt) {
      case 'porcentaje':
        return `${val}%`;
      case 'decimal':
        return val.toFixed(1);
      case 'rating':
        return val.toFixed(2);
      default:
        return val;
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Box
        sx={{
          background: `linear-gradient(145deg, ${color}20, ${color}10)`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${color}30`,
          borderRadius: 2,
          p: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: `0 8px 25px ${color}40`,
            transform: 'translateY(-2px)'
          }
        }}
      >
        {/* Ícono */}
        <Box sx={{ color, mb: 1 }}>
          {React.cloneElement(icono, { sx: { fontSize: 24 } })}
        </Box>

        {/* Valor principal */}
        <Typography 
          variant="h5" 
          sx={{ 
            color, 
            fontWeight: 700,
            textAlign: 'center',
            mb: 0.5
          }}
        >
          {formatearValor(valor, formato)}
        </Typography>

        {/* Label */}
        <Typography 
          variant="caption" 
          sx={{ 
            color: 'rgba(255,255,255,0.8)',
            textAlign: 'center',
            fontSize: '0.75rem',
            fontWeight: 500
          }}
        >
          {label}
        </Typography>

        {/* Descripción adicional si existe */}
        {descripcion && (
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'rgba(255,255,255,0.6)',
              textAlign: 'center',
              fontSize: '0.65rem',
              mt: 0.5
            }}
          >
            {descripcion}
          </Typography>
        )}
      </Box>
    </motion.div>
  );
};

// 🔥 COMPONENTE: Tarjeta de Estadísticas por Equipo
const TarjetaEstadisticasEquipo = ({ estadisticasEquipo, equipo }) => {
  const equipoImageUrl = useImage(equipo?.imagen);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        sx={{
          background: 'linear-gradient(145deg, rgba(30,30,60,0.95), rgba(50,50,80,0.95))',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 3,
          p: 3,
          position: 'relative',
          overflow: 'hidden',
          mb: 2,
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.3)'
          },
          transition: 'all 0.3s ease'
        }}
      >
        {/* Imagen del equipo como marca de agua */}
        {equipoImageUrl && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              width: 60,
              height: 60,
              borderRadius: '50%',
              overflow: 'hidden',
              opacity: 0.15,
              zIndex: 0,
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <img
              src={equipoImageUrl}
              alt={equipo?.nombre}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </Box>
        )}

        {/* Header del equipo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, zIndex: 1, position: 'relative' }}>
          <Avatar
            src={equipoImageUrl}
            sx={{
              width: 40,
              height: 40,
              border: '2px solid rgba(64, 181, 246, 0.5)',
              backgroundColor: 'rgba(64, 181, 246, 0.1)'
            }}
          >
            {equipo?.nombre?.charAt(0)}
          </Avatar>
          
          <Box>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>
              {equipo?.nombre}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={getCategoryName(equipo?.categoria)}
                size="small"
                sx={{
                  backgroundColor: 'rgba(64, 181, 246, 0.2)',
                  color: '#40b5f6',
                  fontSize: '0.65rem',
                  height: 18
                }}
              />
              <Chip
                label={`#${estadisticasEquipo?.numero || '?'}`}
                size="small"
                sx={{
                  backgroundColor: 'rgba(255, 193, 7, 0.2)',
                  color: '#ffc107',
                  fontSize: '0.65rem',
                  height: 18
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Grid de estadísticas - USANDO FLEXBOX */}
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 1.5,
          zIndex: 1,
          position: 'relative'
        }}>
          {/* Pases */}
          <Box sx={{ flex: '1 1 calc(50% - 6px)', minWidth: '120px' }}>
            <EstadisticaItem
              icono={<FootballIcon />}
              label="Pases Completos"
              valor={estadisticasEquipo?.pases?.completados || 0}
              color="#4caf50"
              descripcion={`${estadisticasEquipo?.pases?.intentos || 0} intentos`}
            />
          </Box>

          <Box sx={{ flex: '1 1 calc(50% - 6px)', minWidth: '120px' }}>
            <EstadisticaItem
              icono={<CancelIcon />}
              label="Pases Incompletos"
              valor={(estadisticasEquipo?.pases?.intentos || 0) - (estadisticasEquipo?.pases?.completados || 0)}
              color="#f44336"
            />
          </Box>

          <Box sx={{ flex: '1 1 calc(50% - 6px)', minWidth: '120px' }}>
            <EstadisticaItem
              icono={<TrophyIcon />}
              label="Pases TD"
              valor={estadisticasEquipo?.pases?.touchdowns || 0}
              color="#ff9800"
            />
          </Box>

          <Box sx={{ flex: '1 1 calc(50% - 6px)', minWidth: '120px' }}>
            <EstadisticaItem
              icono={<StarIcon />}
              label="Carreras TD"
              valor={estadisticasEquipo?.carreras?.touchdowns || 0}
              color="#9c27b0"
            />
          </Box>

          <Box sx={{ flex: '1 1 calc(50% - 6px)', minWidth: '120px' }}>
            <EstadisticaItem
              icono={<CheckCircleIcon />}
              label="Recepciones TD"
              valor={estadisticasEquipo?.recepciones?.touchdowns || 0}
              color="#2196f3"
            />
          </Box>

          <Box sx={{ flex: '1 1 calc(50% - 6px)', minWidth: '120px' }}>
            <EstadisticaItem
              icono={<FlashOnIcon />}
              label="Recepciones"
              valor={estadisticasEquipo?.recepciones?.total || 0}
              color="#00bcd4"
            />
          </Box>

          <Box sx={{ flex: '1 1 calc(50% - 6px)', minWidth: '120px' }}>
            <EstadisticaItem
              icono={<TrendingUpIcon />}
              label="Conv. Lanzadas"
              valor={estadisticasEquipo?.conversiones?.lanzadas || 0}
              color="#4caf50"
            />
          </Box>

          <Box sx={{ flex: '1 1 calc(50% - 6px)', minWidth: '120px' }}>
            <EstadisticaItem
              icono={<CheckCircleIcon />}
              label="Conv. Atrapadas"
              valor={estadisticasEquipo?.conversiones?.atrapadas || 0}
              color="#8bc34a"
            />
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
};

// 🔥 COMPONENTE: Mega Tarjeta de Estadísticas Personales
const MegaTarjetaEstadisticasPersonales = ({ usuario, estadisticasPersonales, loading, error, onActualizar }) => {
  const userImageUrl = useImage(usuario?.imagen);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Box
          sx={{
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
          }}
        >
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
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Box
          sx={{
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
          }}
        >
          <Box sx={{ color: '#f44336', mb: 2 }}>
            <Alert severity="error" sx={{ 
              backgroundColor: 'rgba(244, 67, 54, 0.1)',
              color: '#f44336',
              '& .MuiAlert-icon': { color: '#f44336' }
            }}>
              {error}
            </Alert>
          </Box>
          <Button
            onClick={onActualizar}
            variant="outlined"
            startIcon={<RefreshIcon />}
            sx={{
              borderColor: '#f44336',
              color: '#f44336',
              '&:hover': {
                borderColor: '#f44336',
                backgroundColor: 'rgba(244, 67, 54, 0.1)'
              }
            }}
          >
            Reintentar
          </Button>
        </Box>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        sx={{
          background: 'linear-gradient(145deg, rgba(30,30,60,0.95), rgba(50,50,80,0.95))',
          backdropFilter: 'blur(15px)',
          border: '2px solid rgba(64, 181, 246, 0.3)',
          borderRadius: 4,
          p: { xs: 3, md: 4 },
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 20px 50px rgba(64, 181, 246, 0.2)'
          },
          transition: 'all 0.3s ease'
        }}
      >
        {/* Efectos de fondo decorativos */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 20% 20%, rgba(64, 181, 246, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(156, 39, 176, 0.1) 0%, transparent 50%)
            `,
            pointerEvents: 'none',
            zIndex: 0
          }}
        />

        {/* Header con avatar gigante */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center', 
          gap: { xs: 3, md: 4 }, 
          mb: 4,
          zIndex: 1,
          position: 'relative'
        }}>
          {/* Avatar Gigante */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          >
            <Avatar
              src={userImageUrl}
              sx={{
                width: { xs: 120, md: 160 },
                height: { xs: 120, md: 160 },
                border: '6px solid rgba(64, 181, 246, 0.8)',
                boxShadow: '0 0 40px rgba(64, 181, 246, 0.6)',
                background: 'linear-gradient(135deg, rgba(64, 181, 246, 0.2), rgba(156, 39, 176, 0.2))',
                fontSize: { xs: '3rem', md: '4rem' },
                fontWeight: 'bold'
              }}
            >
              {usuario?.nombre?.charAt(0)?.toUpperCase()}
            </Avatar>
          </motion.div>

          {/* Info del usuario */}
          <Box sx={{ 
            flex: 1, 
            textAlign: { xs: 'center', md: 'left' },
            minWidth: 0
          }}>
            <Typography 
              variant="h3" 
              sx={{ 
                color: 'white', 
                fontWeight: 700,
                mb: 1,
                background: 'linear-gradient(45deg, #64b5f6, #9c27b0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '1.8rem', md: '2.5rem' }
              }}
            >
              Mis Estadísticas 🏆
            </Typography>
            
            <Typography 
              variant="h5" 
              sx={{ 
                color: 'rgba(255,255,255,0.9)', 
                mb: 2,
                fontSize: { xs: '1.2rem', md: '1.5rem' }
              }}
            >
              {usuario?.nombre}
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: { xs: 'center', md: 'flex-start' } }}>
              <Chip
                label={getCategoryName(usuario?.rol) || usuario?.rol}
                sx={{
                  backgroundColor: 'rgba(64, 181, 246, 0.2)',
                  color: '#64b5f6',
                  fontWeight: 600,
                  fontSize: '0.8rem'
                }}
              />
              <Chip
                label={`${estadisticasPersonales?.equipos?.length || 0} Equipos`}
                sx={{
                  backgroundColor: 'rgba(156, 39, 176, 0.2)',
                  color: '#9c27b0',
                  fontWeight: 600,
                  fontSize: '0.8rem'
                }}
              />
            </Box>
          </Box>

          {/* Botón de actualizar */}
          <Button
            onClick={onActualizar}
            variant="outlined"
            startIcon={<RefreshIcon />}
            sx={{
              borderColor: 'rgba(76, 175, 80, 0.5)',
              color: '#4caf50',
              '&:hover': {
                borderColor: '#4caf50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)'
              }
            }}
          >
            Actualizar
          </Button>
        </Box>

        {/* Contenido de estadísticas por equipo */}
        {estadisticasPersonales?.equipos && estadisticasPersonales.equipos.length > 0 ? (
          <Box sx={{ zIndex: 1, position: 'relative' }}>
            {estadisticasPersonales.equipos.map((equipoStats, index) => (
              <TarjetaEstadisticasRadar
                key={`${equipoStats.equipo?._id}-${index}`}
                estadisticasEquipo={{
                  ...equipoStats,
                  jugador: {
                    nombre: usuario?.nombre,
                    imagen: usuario?.imagen
                  }
                }}
                equipo={equipoStats.equipo}
              />
            ))}

            {/* 🔍 DEBUG INFO - Solo en desarrollo */}
            {/* {process.env.NODE_ENV === 'development' && (
              <Box sx={{ 
                mt: 3, 
                p: 2, 
                background: 'rgba(0,0,0,0.3)', 
                borderRadius: 2,
                fontSize: '0.75rem',
                fontFamily: 'monospace'
              }}>
                <Typography variant="caption" sx={{ color: '#ffd700', fontWeight: 'bold' }}>
                  🔍 DEBUG INFO:
                </Typography>
                <pre style={{ color: 'rgba(255,255,255,0.8)', margin: '8px 0' }}>
                  {JSON.stringify({
                    equiposConEstadisticas: estadisticasPersonales.equipos.length,
                    equiposDetalle: estadisticasPersonales.equipos.map(eq => ({
                      nombre: eq.equipo?.nombre,
                      numero: eq.numero,
                      tieneError: eq.error || false,
                      puntos: eq.puntos,
                      totalJugadas: eq.totalJugadas,
                      partidosJugados: eq.partidosJugados,
                      pases: eq.pases,
                      recepciones: eq.recepciones,
                      tackleos: eq.tackleos,
                      intercepciones: eq.intercepciones
                    }))
                  }, null, 2)}
                </pre>
              </Box>
            )} */}
          </Box>
        ) : (
          <Box
            sx={{
              textAlign: 'center',
              py: 6,
              zIndex: 1,
              position: 'relative'
            }}
          >
            <EmojiEventsIcon sx={{ fontSize: 60, color: 'rgba(255,255,255,0.3)', mb: 2 }} />
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'rgba(255,255,255,0.6)',
                mb: 1
              }}
            >
              Sin estadísticas registradas
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255,255,255,0.5)',
                mb: 2
              }}
            >
              Únete a un equipo para empezar a acumular estadísticas
            </Typography>
            <Button
              onClick={onActualizar}
              variant="outlined"
              startIcon={<RefreshIcon />}
              sx={{
                borderColor: 'rgba(64, 181, 246, 0.5)',
                color: '#64b5f6',
                '&:hover': {
                  borderColor: '#64b5f6',
                  backgroundColor: 'rgba(64, 181, 246, 0.1)'
                }
              }}
            >
              Cargar Estadísticas
            </Button>
          </Box>
        )}
      </Box>
    </motion.div>
  );
};

// Selector de Equipos Mejorado y User-Friendly
const EquipoSelectorImproved = ({ equipos, onSelect, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const filteredEquipos = equipos.filter(equipo => {
    const matchesSearch = equipo.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || equipo.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(equipos.map(e => e.categoria))];

  return (
    <Box>
      {/* Filtros */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Buscar equipo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(255,255,255,0.5)' }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton onClick={() => setSearchTerm('')} size="small">
                  <CloseIcon sx={{ color: 'rgba(255,255,255,0.5)' }} />
                </IconButton>
              </InputAdornment>
            ),
            sx: {
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,0.3)'
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,0.5)'
              }
            }
          }}
        />

        <FormControl fullWidth>
          <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Filtrar por categoría
          </InputLabel>
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            sx={{
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,0.3)'
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,0.5)'
              }
            }}
          >
            <MenuItem value="">Todas las categorías</MenuItem>
            {categories.map(categoria => (
              <MenuItem key={categoria} value={categoria}>
                {getCategoryName(categoria)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Lista de equipos */}
      <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredEquipos.length > 0 ? (
          <List>
            {filteredEquipos.map(equipo => (
              <ListItem 
                key={equipo._id}
                onClick={() => onSelect(equipo)}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 2,
                  mb: 1,
                  background: 'rgba(255,255,255,0.05)',
                  '&:hover': {
                    background: 'rgba(255,255,255,0.1)',
                    transform: 'translateX(8px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <Avatar 
                  src={getImageUrl(equipo.imagen)}
                  sx={{ mr: 2, width: 40, height: 40 }}
                >
                  {equipo.nombre.charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600 }}>
                    {equipo.nombre}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    {getCategoryName(equipo.categoria)} • {equipo.jugadores?.length || 0} jugadores
                  </Typography>
                </Box>
                <Chip 
                  label={getCategoryName(equipo.categoria)}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(64, 181, 246, 0.2)',
                    color: '#64b5f6'
                  }}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', py: 4 }}>
            No se encontraron equipos
          </Typography>
        )}
      </Box>
    </Box>
  );
};

// 🔥 COMPONENTE PRINCIPAL - HOME REDISEÑADO
export const Home = () => {
  const { usuario } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // 🔥 ESTADOS
  const [equiposUsuario, setEquiposUsuario] = useState([]);
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);
  const [torneoActivo, setTorneoActivo] = useState(null);
  const [torneos, setTorneos] = useState([]);
  const [proximosPartidos, setProximosPartidos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [numeroJugador, setNumeroJugador] = useState('');
  const [mostrarTodosEquipos, setMostrarTodosEquipos] = useState(false);
  const [mostrarTodosPartidos, setMostrarTodosPartidos] = useState(false);
  const [filtroTorneo, setFiltroTorneo] = useState('');

  // 🔥 NUEVO: Estados para estadísticas personales
  const [estadisticasPersonales, setEstadisticasPersonales] = useState(null);
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(false);
  const [errorEstadisticas, setErrorEstadisticas] = useState(null);

  // 🔥 FUNCIÓN: Cargar estadísticas personales del usuario
  const cargarEstadisticasPersonales = useCallback(async () => {
    if (!usuario?._id || !torneoActivo?._id || !equiposUsuario || equiposUsuario.length === 0) {
      console.log('⚠️ No se pueden cargar estadísticas:', {
        usuario: !!usuario?._id,
        torneo: !!torneoActivo?._id,
        equipos: equiposUsuario?.length || 0
      });
      return;
    }

    console.log('🔄 Iniciando carga de estadísticas personales...');
    console.log('📊 Parámetros:', {
      usuario: usuario._id,
      torneo: torneoActivo._id,
      equipos: equiposUsuario.length
    });

    setCargandoEstadisticas(true);
    setErrorEstadisticas(null);
    
    try {
      // Obtener estadísticas para cada equipo del usuario
      const equiposConEstadisticas = [];
      
      for (const equipoUsuario of equiposUsuario) {
        try {
          console.log(`🔍 Buscando estadísticas para:`, {
            torneo: torneoActivo._id,
            equipo: equipoUsuario.equipo._id,
            nombre: equipoUsuario.equipo.nombre,
            numero: equipoUsuario.numero
          });

          const response = await axiosInstance.get(
            `/estadisticas/debug/${torneoActivo._id}/${equipoUsuario.equipo._id}/${equipoUsuario.numero}`
          );
          
          console.log('✅ Respuesta de estadísticas:', response.data);
          
          // 🔥 FIX: Los datos están en estadisticasCalculadas, no estadisticasResumen
          if (response.data && response.data.estadisticasCalculadas) {
            const stats = response.data.estadisticasCalculadas;
            
            console.log('📊 Estadísticas encontradas:', stats);
            
            equiposConEstadisticas.push({
              equipo: equipoUsuario.equipo,
              numero: equipoUsuario.numero,
              // Mapear datos para que coincidan con la estructura esperada
              pases: {
                completados: stats.pases?.completados || 0,
                intentos: stats.pases?.intentos || 0,
                touchdowns: stats.pases?.touchdowns || 0,
                conversiones: stats.pases?.conversiones || 0
              },
              recepciones: {
                total: stats.recepciones?.total || 0,
                touchdowns: stats.recepciones?.touchdowns || 0,
                normales: stats.recepciones?.normales || 0,
                conversiones1pt: stats.recepciones?.conversiones1pt || 0,
                conversiones2pt: stats.recepciones?.conversiones2pt || 0
              },
              carreras: { 
                touchdowns: stats.carreras?.touchdowns || 0 
              },
              conversiones: {
                lanzadas: stats.pases?.conversiones || 0,
                atrapadas: (stats.recepciones?.conversiones1pt || 0) + (stats.recepciones?.conversiones2pt || 0)
              },
              puntos: stats.puntos || 0,
              qbRating: stats.qbRating || 0,
              tackleos: stats.tackleos || 0,
              intercepciones: stats.intercepciones || 0,
              sacks: stats.sacks || 0,
              // Agregar datos extra para debug
              totalJugadas: response.data.compiladoJugadas?.length || 0,
              partidosJugados: response.data.partidosConJugadas?.length || 0
            });

            console.log(`✅ Estadísticas procesadas para ${equipoUsuario.equipo.nombre}:`, {
              puntos: stats.puntos,
              pases: stats.pases,
              recepciones: stats.recepciones,
              tackleos: stats.tackleos,
              intercepciones: stats.intercepciones
            });
          } else {
            console.log(`⚠️ No hay estadísticas calculadas para ${equipoUsuario.equipo.nombre}`);
          }
        } catch (error) {
          console.warn(`❌ Error cargando estadísticas para equipo ${equipoUsuario.equipo.nombre}:`, error);
          
          // Agregar equipo con estadísticas vacías para mostrar que existe pero sin datos
          equiposConEstadisticas.push({
            equipo: equipoUsuario.equipo,
            numero: equipoUsuario.numero,
            pases: { completados: 0, intentos: 0, touchdowns: 0, conversiones: 0 },
            recepciones: { total: 0, touchdowns: 0, normales: 0, conversiones1pt: 0, conversiones2pt: 0 },
            carreras: { touchdowns: 0 },
            conversiones: { lanzadas: 0, atrapadas: 0 },
            puntos: 0,
            qbRating: 0,
            tackleos: 0,
            intercepciones: 0,
            sacks: 0,
            error: true
          });
        }
      }

      console.log('📊 Total equipos con estadísticas:', equiposConEstadisticas.length);

      setEstadisticasPersonales({
        equipos: equiposConEstadisticas,
        totales: calcularTotales(equiposConEstadisticas)
      });

    } catch (error) {
      console.error('❌ Error general cargando estadísticas personales:', error);
      setErrorEstadisticas('Error al cargar las estadísticas personales');
    } finally {
      setCargandoEstadisticas(false);
    }
  }, [usuario?._id, torneoActivo?._id, equiposUsuario]);

  // 🔥 FUNCIÓN: Calcular totales de estadísticas
  const calcularTotales = (equiposStats) => {
    return equiposStats.reduce((totales, equipo) => {
      return {
        pasesCompletos: totales.pasesCompletos + (equipo.pases?.completados || 0),
        pasesIntentos: totales.pasesIntentos + (equipo.pases?.intentos || 0),
        pasesTD: totales.pasesTD + (equipo.pases?.touchdowns || 0),
        recepcionesTotales: totales.recepcionesTotales + (equipo.recepciones?.total || 0),
        recepcionesTD: totales.recepcionesTD + (equipo.recepciones?.touchdowns || 0),
        carrerasTD: totales.carrerasTD + (equipo.carreras?.touchdowns || 0),
        conversionesLanzadas: totales.conversionesLanzadas + (equipo.conversiones?.lanzadas || 0),
        conversionesAtrapadas: totales.conversionesAtrapadas + (equipo.conversiones?.atrapadas || 0)
      };
    }, {
      pasesCompletos: 0,
      pasesIntentos: 0,
      pasesTD: 0,
      recepcionesTotales: 0,
      recepcionesTD: 0,
      carrerasTD: 0,
      conversionesLanzadas: 0,
      conversionesAtrapadas: 0
    });
  };

  // 🔥 FUNCIONES EXISTENTES (mantener toda la lógica original)
  const obtenerTorneos = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/torneos');
      // 🔥 FIX: El endpoint devuelve { torneos: [...] }, no un array directamente
      const torneosData = response.data.torneos || response.data || [];
      setTorneos(torneosData);
      
      const activo = torneosData.find(t => t.estado === 'activo');
      if (activo) {
        setTorneoActivo(activo);
        setFiltroTorneo(activo._id);
      }
    } catch (error) {
      console.error('Error al obtener torneos:', error);
    }
  }, []);

  const obtenerEquiposUsuario = useCallback(async () => {
    if (!usuario?._id) return;
    
    try {
      // 🔥 ESTRATEGIA: Primero intentar usar los equipos del contexto si están disponibles
      if (usuario.equipos && usuario.equipos.length > 0) {
        console.log('✅ Usando equipos del contexto de usuario');
        
        // Verificar si los equipos tienen la info completa necesaria
        const equiposCompletos = usuario.equipos.filter(eq => 
          eq.equipo && (typeof eq.equipo === 'object') && eq.equipo.nombre
        );
        
        if (equiposCompletos.length > 0) {
          const equiposFormateados = equiposCompletos.map(eq => ({
            equipo: eq.equipo,
            numero: eq.numero
          }));
          setEquiposUsuario(equiposFormateados);
          return;
        }
      }
      
      // 🔥 USAR EL NUEVO ENDPOINT ESPECÍFICO PARA EQUIPOS
      console.log('⚡ Obteniendo equipos del usuario via endpoint específico...');
      const response = await axiosInstance.get(`/usuarios/${usuario._id}/equipos`);
      
      if (response.data.equipos && response.data.equipos.length > 0) {
        setEquiposUsuario(response.data.equipos);
      } else {
        setEquiposUsuario([]);
      }
    } catch (error) {
      console.error('Error al obtener equipos del usuario:', error);
      
      // 🔥 FALLBACK: Si el endpoint específico falla, intentar con perfil
      try {
        console.log('🔄 Fallback: Intentando obtener via perfil...');
        const profileResponse = await axiosInstance.get('/auth/perfil');
        if (profileResponse.data.equipos) {
          const equiposFormateados = profileResponse.data.equipos.map(eq => ({
            equipo: eq.equipo,
            numero: eq.numero
          }));
          setEquiposUsuario(equiposFormateados);
        } else {
          setEquiposUsuario([]);
        }
      } catch (fallbackError) {
        console.error('Error en fallback:', fallbackError);
        setEquiposUsuario([]);
      }
    }
  }, [usuario]);

  const obtenerEquiposDisponibles = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/equipos');
      setEquiposDisponibles(response.data);
    } catch (error) {
      console.error('Error al obtener equipos disponibles:', error);
    }
  }, []);

  const obtenerProximosPartidos = useCallback(async () => {
    if (!filtroTorneo || !equiposUsuario || equiposUsuario.length === 0) return;
    
    try {
      // 🔥 OBTENER IDS DE LOS EQUIPOS DEL USUARIO
      const idsEquiposUsuario = equiposUsuario.map(equipoUsuario => equipoUsuario.equipo._id);
      console.log('🔍 Buscando partidos para equipos del usuario:', idsEquiposUsuario);
      
      // 🔥 OBTENER TODOS LOS PARTIDOS PROGRAMADOS DEL TORNEO
      const response = await axiosInstance.get(`/partidos?torneo=${filtroTorneo}&estado=programado&limit=50`);
      const todosLosPartidos = response.data.partidos || [];
      
      console.log('📊 Total partidos programados en torneo:', todosLosPartidos.length);
      
      // 🔥 FILTRAR SOLO PARTIDOS DE LOS EQUIPOS DEL USUARIO
      const partidosDelUsuario = todosLosPartidos.filter(partido => {
        const equipoLocalId = partido.equipoLocal?._id;
        const equipoVisitanteId = partido.equipoVisitante?._id;
        
        return idsEquiposUsuario.includes(equipoLocalId) || idsEquiposUsuario.includes(equipoVisitanteId);
      });
      
      console.log('🎯 Partidos filtrados del usuario:', partidosDelUsuario.length);
      
      // 🔥 ORDENAR POR FECHA MÁS PRÓXIMA Y LIMITAR A 5
      const partidosOrdenados = partidosDelUsuario
        .sort((a, b) => new Date(a.fecha || a.fechaHora) - new Date(b.fecha || b.fechaHora))
        .slice(0, 5);
      
      console.log('📅 Próximos partidos del usuario:', partidosOrdenados.map(p => ({
        fecha: p.fecha || p.fechaHora,
        local: p.equipoLocal?.nombre,
        visitante: p.equipoVisitante?.nombre
      })));
      
      setProximosPartidos(partidosOrdenados);
    } catch (error) {
      console.error('Error al obtener próximos partidos del usuario:', error);
    }
  }, [filtroTorneo, equiposUsuario]);

  const abrirModal = (equipo) => {
    setEquipoSeleccionado(equipo);
    setNumeroJugador('');
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEquipoSeleccionado(null);
    setNumeroJugador('');
  };

  const actualizarEquiposUsuario = () => {
    obtenerEquiposUsuario();
    obtenerEquiposDisponibles();
  };

  const manejarInscripcion = async () => {
    if (!equipoSeleccionado || !numeroJugador) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor selecciona un equipo y un número de jugador',
        background: '#1a1a1a',
        color: 'white',
      });
      return;
    }

    setCargando(true);

    try {
      const response = await axiosInstance.patch('/usuarios/equipo', {
        usuarioId: usuario._id,
        equipoId: equipoSeleccionado._id,
        numero: parseInt(numeroJugador)
      });

      Swal.fire({
        icon: 'success',
        title: '¡Inscripción exitosa!',
        text: `Te has inscrito al equipo ${equipoSeleccionado.nombre} con el número ${numeroJugador}`,
        background: '#1a1a1a',
        color: 'white',
      });

      actualizarEquiposUsuario();
      obtenerEquiposUsuario();
      obtenerEquiposDisponibles();
      cerrarModal();

    } catch (error) {
      console.error('❌ Error en inscripción:', error);
      
      const errorMessage = error.response?.data?.mensaje || 
                          error.message || 
                          'Error desconocido al inscribirse';
      
      Swal.fire({
        icon: 'error',
        title: 'Error en la inscripción',
        text: errorMessage,
        background: '#1a1a1a',
        color: 'white',
      });
    } finally {
      setCargando(false);
    }
  };

  // 🔥 EFECTOS - Cargar datos iniciales
  useEffect(() => {
    if (usuario) {
      obtenerTorneos();
      obtenerEquiposUsuario();
      obtenerEquiposDisponibles();
    }
  }, [usuario, obtenerTorneos, obtenerEquiposUsuario, obtenerEquiposDisponibles]);

  useEffect(() => {
    obtenerProximosPartidos();
  }, [obtenerProximosPartidos]);

  // 🔥 NUEVO: Cargar estadísticas cuando cambie el torneo activo o equipos del usuario
  useEffect(() => {
    cargarEstadisticasPersonales();
  }, [cargarEstadisticasPersonales]);

  // Configuración de animaciones
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

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  // Estilos compartidos
  const cardStyle = {
    background: 'linear-gradient(145deg, rgba(30,30,60,0.95), rgba(50,50,80,0.95))',
    backdropFilter: 'blur(15px)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 3,
    overflow: 'hidden'
  };

  const headerStyle = {
    p: { xs: 2, md: 2 },
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.02)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.3s ease'
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 25%, #16213e 50%, #1a1a2e 75%, #0a0a0a 100%)',
        padding: { xs: '10px', md: '20px' }
      }}
    >
      {usuario ? (
        <motion.div variants={containerVariants}>
          
          {/* 🔥 NUEVO LAYOUT CON FLEXBOX - Header con Perfil */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: { xs: 2, md: 3 }, 
            mb: { xs: 3, md: 4 },
            p: { xs: 2, md: 3 }
          }}>
            
            {/* FILA 1: Perfil del usuario y selector de torneo */}
            <Box sx={{ 
              display: 'flex',
              flexDirection: { xs: 'column', lg: 'row' },
              gap: { xs: 2, md: 3 },
              alignItems: { xs: 'stretch', lg: 'stretch' }
            }}>
              
              {/* Tarjeta de perfil del usuario */}
              <motion.div variants={itemVariants} style={{ flex: '2 1 auto' }}>
                <Card sx={{ ...cardStyle, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ p: { xs: 2, md: 3 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'center', sm: 'center' }, 
                      gap: { xs: 2, md: 3 }, 
                      mb: { xs: 2, md: 3 },
                      textAlign: { xs: 'center', sm: 'left' }
                    }}>
                      <UserProfileAvatar usuario={usuario} size={isMobile ? 80 : 100} />
                      
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h4" sx={{ 
                          color: 'white', 
                          fontWeight: 'bold', 
                          mb: 1,
                          background: 'linear-gradient(45deg, #64b5f6, #42a5f5)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          fontSize: { xs: '1.5rem', md: '2.125rem' }
                        }}>
                          ¡Bienvenido, {usuario.nombre}! 👋
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          color: 'rgba(255,255,255,0.8)', 
                          mb: { xs: 1, md: 2 },
                          fontSize: { xs: '1rem', md: '1.25rem' }
                        }}>
                          {getCategoryName(usuario.rol) || usuario.rol}
                        </Typography>
                      </Box>

                      <Button
                        component={NavLink}
                        to="/perfil"
                        variant="outlined"
                        startIcon={<SettingsIcon />}
                        size={isMobile ? 'small' : 'medium'}
                        sx={{
                          borderColor: 'rgba(255,255,255,0.3)',
                          color: 'white',
                          '&:hover': {
                            borderColor: 'rgba(255,255,255,0.7)',
                            backgroundColor: 'rgba(255,255,255,0.1)'
                          }
                        }}
                      >
                        Perfil
                      </Button>
                    </Box>

                    {/* Información adicional del usuario */}
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: 2, 
                      flex: 1,
                      alignItems: { xs: 'stretch', sm: 'flex-start' }
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 1,
                        flex: 1
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }} />
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                            {usuario.email}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <VerifiedUserIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }} />
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                            Cuenta verificada
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'row', sm: 'column' }, 
                        gap: 1,
                        justifyContent: { xs: 'center', sm: 'flex-start' }
                      }}>
                        <Chip
                          icon={<GroupsIcon />}
                          label={`${equiposUsuario.length} ${equiposUsuario.length === 1 ? 'Equipo' : 'Equipos'}`}
                          variant="outlined"
                          size="small"
                          sx={{
                            borderColor: 'rgba(255,255,255,0.3)',
                            color: 'white',
                            '& .MuiChip-icon': { color: 'rgba(255,255,255,0.7)' }
                          }}
                        />
                        
                        <Chip
                          icon={<EmojiEventsIcon />}
                          label={torneoActivo ? torneoActivo.nombre : 'Sin torneo activo'}
                          variant="outlined"
                          size="small"
                          sx={{
                            borderColor: 'rgba(255,255,255,0.3)',
                            color: 'white',
                            '& .MuiChip-icon': { color: 'rgba(255,255,255,0.7)' }
                          }}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>

              {/* 🔥 NUEVO: Selector de Torneo y Acciones */}
              <motion.div 
                variants={itemVariants} 
                style={{ flex: '1 1 auto', minWidth: { xs: '100%', lg: '350px' } }}
              >
                <Card sx={{ 
                  ...cardStyle, 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <CardContent sx={{ 
                    p: { xs: 2, md: 3 }, 
                    flex: 1,
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 2
                  }}>
                    {/* Selector de Torneo */}
                    <Box>
                      <Typography variant="h6" sx={{ 
                        color: 'white', 
                        fontWeight: 'bold',
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <EmojiEventsIcon sx={{ color: '#ffd700' }} />
                        Temporada Activa
                      </Typography>
                      
                      <FormControl fullWidth>
                        <InputLabel 
                          sx={{ 
                            color: 'rgba(255,255,255,0.7)',
                            '&.Mui-focused': {
                              color: '#ffd700'
                            },
                            '&.MuiInputLabel-shrink': {
                              color: '#ffd700'
                            }
                          }}
                        >
                          Seleccionar Torneo
                        </InputLabel>
                        <Select
                          value={torneoActivo?._id || ''}
                          onChange={(e) => {
                            const torneoSeleccionado = torneos.find(t => t._id === e.target.value);
                            setTorneoActivo(torneoSeleccionado);
                            setFiltroTorneo(e.target.value);
                          }}
                          sx={{
                            color: 'white',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255,255,255,0.3)'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255,255,255,0.5)'
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#ffd700'
                            },
                            '& .MuiSelect-select': {
                              paddingTop: '14px',
                              paddingBottom: '14px'
                            }
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                bgcolor: 'rgba(30,30,60,0.95)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                '& .MuiMenuItem-root': {
                                  color: 'white',
                                  '&:hover': {
                                    backgroundColor: 'rgba(255,255,255,0.1)'
                                  },
                                  '&.Mui-selected': {
                                    backgroundColor: 'rgba(255, 215, 0, 0.2)',
                                    '&:hover': {
                                      backgroundColor: 'rgba(255, 215, 0, 0.3)'
                                    }
                                  }
                                }
                              }
                            }
                          }}
                        >
                          {torneos.map(torneo => (
                            <MenuItem key={torneo._id} value={torneo._id}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                    {torneo.nombre}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    {torneo.estado === 'activo' ? '🟢 Activo' : '🔴 Finalizado'}
                                  </Typography>
                                </Box>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

                    {/* Botón para agregar equipos */}
                    <Box 
                      onClick={() => setModalAbierto(true)}
                      sx={{
                        background: 'linear-gradient(145deg, rgba(64, 181, 246, 0.1), rgba(156, 39, 176, 0.1))',
                        border: '1px solid rgba(64, 181, 246, 0.3)',
                        borderRadius: 2,
                        p: 2,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        textAlign: 'center',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(64, 181, 246, 0.3)',
                          border: '1px solid rgba(64, 181, 246, 0.5)'
                        }
                      }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 180 }}
                        transition={{ duration: 0.3 }}
                      >
                        <PersonAddIcon sx={{ 
                          fontSize: 40, 
                          color: '#64b5f6', 
                          mb: 1 
                        }} />
                      </motion.div>
                      
                      <Typography variant="h6" sx={{ 
                        color: 'white', 
                        fontWeight: 'bold', 
                        mb: 1
                      }}>
                        Únete a un Equipo
                      </Typography>
                      
                      <Typography variant="body2" sx={{ 
                        color: 'rgba(255,255,255,0.8)' 
                      }}>
                        Explora equipos disponibles
                      </Typography>
                    </Box>

                    {/* Botón de actualizar estadísticas */}
                    <Button
                      onClick={cargarEstadisticasPersonales}
                      disabled={cargandoEstadisticas || !torneoActivo}
                      variant="outlined"
                      startIcon={cargandoEstadisticas ? <CircularProgress size={20} /> : <RefreshIcon />}
                      sx={{
                        borderColor: 'rgba(76, 175, 80, 0.5)',
                        color: '#4caf50',
                        '&:hover': {
                          borderColor: '#4caf50',
                          backgroundColor: 'rgba(76, 175, 80, 0.1)'
                        },
                        '&:disabled': {
                          borderColor: 'rgba(255,255,255,0.2)',
                          color: 'rgba(255,255,255,0.4)'
                        }
                      }}
                    >
                      {cargandoEstadisticas ? 'Actualizando...' : 'Actualizar Estadísticas'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </Box>

            {/* 🔥 FILA 2: MEGA TARJETA DE ESTADÍSTICAS PERSONALES */}
            <motion.div variants={itemVariants}>
              <MegaTarjetaEstadisticasPersonales
                usuario={usuario}
                estadisticasPersonales={estadisticasPersonales}
                loading={cargandoEstadisticas}
                error={errorEstadisticas}
                onActualizar={cargarEstadisticasPersonales}
              />
            </motion.div>

            {/* FILA 3: Tarjetas de equipos del usuario */}
            {equiposUsuario.length > 0 && (
              <motion.div variants={itemVariants}>
                <Card sx={cardStyle}>
                  <Box sx={headerStyle}>
                    <Typography variant="h6" sx={{ 
                      color: 'white', 
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <GroupsIcon sx={{ color: '#64b5f6' }} />
                      Mis Equipos ({equiposUsuario.length})
                    </Typography>
                    
                    {equiposUsuario.length > 3 && (
                      <Button
                        onClick={() => setMostrarTodosEquipos(!mostrarTodosEquipos)}
                        endIcon={mostrarTodosEquipos ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        sx={{ color: 'rgba(255,255,255,0.8)' }}
                      >
                        {mostrarTodosEquipos ? 'Mostrar menos' : 'Ver todos'}
                      </Button>
                    )}
                  </Box>
                  
                  <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    <Box sx={{ 
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: { xs: 2, md: 3 }
                    }}>
                      {(mostrarTodosEquipos ? equiposUsuario : equiposUsuario.slice(0, 3)).map((equipoUsuario, index) => (
                        <Box 
                          key={`${equipoUsuario.equipo._id}-${index}`}
                          sx={{ 
                            flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', lg: '1 1 calc(33.333% - 16px)' },
                            minWidth: '280px'
                          }}
                        >
                          <TeamCardGlass 
                            equipo={equipoUsuario.equipo} 
                            usuario={usuario}
                            torneoId={torneoActivo?._id}
                          />
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* FILA 4: Próximos partidos del usuario - SIEMPRE MOSTRAR */}
            <motion.div variants={itemVariants}>
              <Card sx={cardStyle}>
                <Box sx={headerStyle}>
                  <Typography variant="h6" sx={{ 
                    color: 'white', 
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <ScheduleIcon sx={{ color: '#4caf50' }} />
                    Mis Próximos Partidos ({proximosPartidos.length})
                  </Typography>
                  
                  {proximosPartidos.length > 3 && (
                    <Button
                      onClick={() => setMostrarTodosPartidos(!mostrarTodosPartidos)}
                      endIcon={mostrarTodosPartidos ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      sx={{ color: 'rgba(255,255,255,0.8)' }}
                    >
                      {mostrarTodosPartidos ? 'Mostrar menos' : 'Ver todos'}
                    </Button>
                  )}
                </Box>
                
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  {proximosPartidos.length > 0 ? (
                    <Box sx={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2
                    }}>
                      {(mostrarTodosPartidos ? proximosPartidos : proximosPartidos.slice(0, 3)).map((partido) => {
                        // 🔥 IDENTIFICAR CUÁL ES EL EQUIPO DEL USUARIO
                        const idsEquiposUsuario = equiposUsuario.map(eq => eq.equipo._id);
                        const esEquipoLocal = idsEquiposUsuario.includes(partido.equipoLocal?._id);
                        const esEquipoVisitante = idsEquiposUsuario.includes(partido.equipoVisitante?._id);
                        const equipoDelUsuario = esEquipoLocal ? partido.equipoLocal : partido.equipoVisitante;
                        const equipoRival = esEquipoLocal ? partido.equipoVisitante : partido.equipoLocal;
                        
                        return (
                          <motion.div
                            key={partido._id}
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Paper sx={{
                              background: 'rgba(255,255,255,0.05)',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: 2,
                              p: 2,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                background: 'rgba(255,255,255,0.08)',
                                transform: 'translateX(8px)'
                              }
                            }}>
                              <Box sx={{ 
                                display: 'flex', 
                                flexDirection: { xs: 'column', sm: 'row' },
                                justifyContent: 'space-between',
                                alignItems: { xs: 'flex-start', sm: 'center' },
                                gap: 2
                              }}>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
                                    <Box component="span" sx={{ color: '#4caf50', fontWeight: 700 }}>
                                      {equipoDelUsuario?.nombre}
                                    </Box>
                                    {' vs '}
                                    <Box component="span" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                      {equipoRival?.nombre}
                                    </Box>
                                  </Typography>
                                  
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                                    <Chip
                                      icon={<CalendarTodayIcon />}
                                      label={new Date(partido.fecha || partido.fechaHora).toLocaleDateString()}
                                      size="small"
                                      variant="outlined"
                                      sx={{ 
                                        borderColor: 'rgba(255,255,255,0.3)', 
                                        color: 'white',
                                        '& .MuiChip-icon': { color: 'rgba(255,255,255,0.7)' }
                                      }}
                                    />
                                    
                                    <Chip
                                      icon={<ScheduleIcon />}
                                      label={new Date(partido.fecha || partido.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      size="small"
                                      variant="outlined"
                                      sx={{ 
                                        borderColor: 'rgba(255,255,255,0.3)', 
                                        color: 'white',
                                        '& .MuiChip-icon': { color: 'rgba(255,255,255,0.7)' }
                                      }}
                                    />
                                    
                                    {partido.campo && (
                                      <Chip
                                        icon={<LocationOnIcon />}
                                        label={partido.campo}
                                        size="small"
                                        variant="outlined"
                                        sx={{ 
                                          borderColor: 'rgba(255,255,255,0.3)', 
                                          color: 'white',
                                          '& .MuiChip-icon': { color: 'rgba(255,255,255,0.7)' }
                                        }}
                                      />
                                    )}

                                    <Chip
                                      label={esEquipoLocal ? 'LOCAL' : 'VISITANTE'}
                                      size="small"
                                      sx={{
                                        backgroundColor: esEquipoLocal ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 152, 0, 0.2)',
                                        color: esEquipoLocal ? '#4caf50' : '#ff9800',
                                        fontSize: '0.65rem',
                                        fontWeight: 700
                                      }}
                                    />
                                  </Box>
                                </Box>
                                
                                <Button
                                  component={NavLink}
                                  to={`/partidos/${partido._id}`}
                                  variant="outlined"
                                  size="small"
                                  startIcon={<SportsIcon />}
                                  sx={{
                                    borderColor: 'rgba(76, 175, 80, 0.5)',
                                    color: '#4caf50',
                                    '&:hover': {
                                      borderColor: '#4caf50',
                                      backgroundColor: 'rgba(76, 175, 80, 0.1)'
                                    }
                                  }}
                                >
                                  Ver Detalles
                                </Button>
                              </Box>
                            </Paper>
                          </motion.div>
                        );
                      })}
                    </Box>
                  ) : (
                    // 🔥 ESTADO VACÍO - MENSAJE INFORMATIVO
                    <Box
                      sx={{
                        textAlign: 'center',
                        py: 6,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2
                      }}
                    >
                      <ScheduleIcon sx={{ fontSize: 60, color: 'rgba(255,255,255,0.3)' }} />
                      
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: 'rgba(255,255,255,0.7)',
                          fontWeight: 600
                        }}
                      >
                        No hay partidos programados
                      </Typography>
                      
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'rgba(255,255,255,0.5)',
                          maxWidth: 400,
                          lineHeight: 1.6
                        }}
                      >
                        {equiposUsuario.length > 0 
                          ? `Actualmente no tienes partidos programados para ${equiposUsuario.map(eq => eq.equipo.nombre).join(', ')} en este torneo.`
                          : 'Únete a un equipo para ver tus próximos partidos aquí.'
                        }
                      </Typography>

                      {equiposUsuario.length > 0 && (
                        <Button
                          component={NavLink}
                          to="/partidos"
                          variant="outlined"
                          startIcon={<SportsIcon />}
                          sx={{
                            borderColor: 'rgba(76, 175, 80, 0.5)',
                            color: '#4caf50',
                            mt: 1,
                            '&:hover': {
                              borderColor: '#4caf50',
                              backgroundColor: 'rgba(76, 175, 80, 0.1)'
                            }
                          }}
                        >
                          Ver Todos los Partidos
                        </Button>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Box>

          {/* 🔥 MODAL PARA AGREGAR EQUIPO */}
          <Dialog 
            open={modalAbierto} 
            onClose={cerrarModal}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: {
                background: 'linear-gradient(145deg, rgba(30,30,60,0.95), rgba(50,50,80,0.95))',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 3
              }
            }}
          >
            <DialogTitle sx={{ 
              color: 'white', 
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <PersonAddIcon sx={{ color: '#64b5f6' }} />
              Unirse a un Equipo
            </DialogTitle>
            
            <DialogContent sx={{ pt: 3 }}>
              {equipoSeleccionado ? (
                <Box>
                  <Alert 
                    severity="info" 
                    sx={{ 
                      mb: 3,
                      backgroundColor: 'rgba(64, 181, 246, 0.1)',
                      border: '1px solid rgba(64, 181, 246, 0.3)',
                      color: 'white',
                      '& .MuiAlert-icon': { color: '#64b5f6' }
                    }}
                  >
                    Te unirás al equipo <strong>{equipoSeleccionado.nombre}</strong> 
                    ({getCategoryName(equipoSeleccionado.categoria)})
                  </Alert>
                  
                  <TextField
                    fullWidth
                    label="Número de jugador"
                    type="number"
                    value={numeroJugador}
                    onChange={(e) => setNumeroJugador(e.target.value)}
                    inputProps={{ min: 1, max: 99 }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                        '&.Mui-focused fieldset': { borderColor: '#64b5f6' }
                      },
                      '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }
                    }}
                  />
                </Box>
              ) : (
                <EquipoSelectorImproved
                  equipos={equiposDisponibles}
                  onSelect={setEquipoSeleccionado}
                  loading={false}
                />
              )}
            </DialogContent>
            
            <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <Button 
                onClick={cerrarModal}
                sx={{ color: 'rgba(255,255,255,0.7)' }}
              >
                Cancelar
              </Button>
              
              {equipoSeleccionado && (
                <Button
                  onClick={manejarInscripcion}
                  disabled={cargando || !numeroJugador}
                  variant="contained"
                  sx={{
                    background: 'linear-gradient(45deg, #64b5f6, #9c27b0)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #42a5f5, #7b1fa2)',
                    }
                  }}
                  startIcon={cargando ? <CircularProgress size={20} /> : <PersonAddIcon />}
                >
                  {cargando ? 'Inscribiendo...' : 'Unirse al Equipo'}
                </Button>
              )}
              
              {equipoSeleccionado && (
                <Button
                  onClick={() => setEquipoSeleccionado(null)}
                  sx={{ color: 'rgba(255,255,255,0.7)' }}
                >
                  Cambiar Equipo
                </Button>
              )}
            </DialogActions>
          </Dialog>

        </motion.div>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh' 
        }}>
          <CircularProgress size={60} sx={{ color: '#64b5f6' }} />
        </Box>
      )}
    </motion.div>
  );
};