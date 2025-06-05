import React from 'react';
import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Box,
  Chip,
  Badge,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Sports as SportsIcon,
  Group as GroupIcon,
  EmojiEvents as TrophyIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { getCategoryName } from '../helpers/mappings';
import { useImage } from '../hooks/useImage';

// 🎯 Componente para el avatar con overlay de usuario
const AvatarConUsuario = ({ equipoImagen, usuarioImagen, numeroJugador }) => {
  const equipoImageUrl = useImage(equipoImagen, '');
  const usuarioImageUrl = useImage(usuarioImagen, '');

  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      {/* Avatar principal del equipo */}
      <Avatar
        src={equipoImageUrl}
        sx={{
          width: 64,
          height: 64,
          bgcolor: 'primary.main',
          border: '3px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}
      >
        <GroupIcon sx={{ fontSize: 32, color: 'white' }} />
      </Avatar>

      {/* Badge con foto del usuario - MÁS ENCIMADO */}
      <Avatar
        src={usuarioImageUrl}
        sx={{
          position: 'absolute',
          bottom: -4,      // 🔥 Más encimado (-4 en lugar de usar Badge)
          right: -4,       // 🔥 Más encimado (-4 en lugar de usar Badge)
          width: 28,       // 🔥 Ligeramente más grande
          height: 28,      // 🔥 Ligeramente más grande
          border: '3px solid white', // 🔥 Borde más grueso para destacar
          backgroundColor: '#64b5f6',
          fontSize: '12px',
          fontWeight: 'bold',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)', // 🔥 Sombra para separar
          zIndex: 1
        }}
      >
        {numeroJugador || '?'}
      </Avatar>
    </Box>
  );
};

// 🏆 Componente para información de categoría
const InfoCategoria = ({ categoria }) => {
  const getCategoryConfig = (cat) => {
    if (cat.includes('gold')) return { color: '#ffc107', bg: 'rgba(255, 193, 7, 0.1)', icon: '🏆' };
    if (cat.includes('silv')) return { color: '#9e9e9e', bg: 'rgba(158, 158, 158, 0.1)', icon: '🥈' };
    if (cat.includes('mast')) return { color: '#9c27b0', bg: 'rgba(156, 39, 176, 0.1)', icon: '👑' };
    return { color: '#2196f3', bg: 'rgba(33, 150, 243, 0.1)', icon: '⚽' };
  };

  const config = getCategoryConfig(categoria);

  return (
    <Chip
      label={`${config.icon} ${getCategoryName(categoria)}`}
      size="small"
      sx={{
        backgroundColor: config.bg,
        color: config.color,
        fontWeight: 'bold',
        border: `1px solid ${config.color}40`,
        '& .MuiChip-label': {
          fontSize: '0.75rem'
        }
      }}
    />
  );
};

// 📊 Componente para estadísticas rápidas del equipo
const EstadisticasEquipo = ({ totalJugadores = 0, partidosJugados = 0 }) => (
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'space-around',
    mt: 2,
    pt: 2,
    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
  }}>
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ color: '#64b5f6', fontWeight: 'bold', fontSize: '1.1rem' }}>
        {totalJugadores}
      </Typography>
      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
        Jugadores
      </Typography>
    </Box>
    
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 'bold', fontSize: '1.1rem' }}>
        {partidosJugados}
      </Typography>
      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
        Partidos
      </Typography>
    </Box>
  </Box>
);

// 🎯 Componente principal de la tarjeta de equipo
export const EquipoCard = ({ 
  equipo, 
  numeroJugador, 
  usuario,
  index = 0,
  onClick = null,
  showActions = true 
}) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        delay: index * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
    >
      <Card
        onClick={onClick}
        sx={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'visible',
          '&:hover': {
            border: '1px solid rgba(100, 181, 246, 0.3)',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
            '& .equipo-actions': {
              opacity: 1,
              transform: 'translateY(0)'
            }
          }
        }}
      >
        <CardContent sx={{ p: 3, pb: 2 }}>
          {/* Header con avatar y acciones */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            mb: 2
          }}>
            <AvatarConUsuario
              equipoImagen={equipo.imagen}
              usuarioImagen={usuario?.imagen}
              numeroJugador={numeroJugador}
            />

            {/* Acciones flotantes */}
            {showActions && (
              <Box 
                className="equipo-actions"
                sx={{
                  opacity: 0,
                  transform: 'translateY(-10px)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  gap: 1
                }}
              >
                <Tooltip title="Ver equipo completo">
                  <IconButton
                    component={NavLink}
                    to={`/equipos/${equipo._id}`}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(100, 181, 246, 0.2)',
                      color: '#64b5f6',
                      '&:hover': {
                        backgroundColor: 'rgba(100, 181, 246, 0.3)',
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    <VisibilityIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>

          {/* Información del equipo */}
          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'white',
                fontWeight: 'bold',
                mb: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {equipo.nombre}
            </Typography>

            <InfoCategoria categoria={equipo.categoria} />
          </Box>

          {/* Número del jugador destacado */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 2,
            p: 1.5,
            backgroundColor: 'rgba(100, 181, 246, 0.1)',
            borderRadius: 2,
            border: '1px solid rgba(100, 181, 246, 0.2)'
          }}>
            <SportsIcon sx={{ color: '#64b5f6', fontSize: 20 }} />
            <Box>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Tu número
              </Typography>
              <Typography variant="h5" sx={{ color: '#64b5f6', fontWeight: 'bold', lineHeight: 1 }}>
                #{numeroJugador || '?'}
              </Typography>
            </Box>
          </Box>

          {/* Estadísticas del equipo */}
          <EstadisticasEquipo 
            totalJugadores={equipo.jugadores?.length || 0}
            partidosJugados={equipo.partidosJugados || 0}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
};

// 📋 Componente contenedor para lista de equipos
export const ListaEquiposUsuario = ({ 
  equipos = [], 
  usuario, 
  titulo = "Mis Equipos",
  showEmptyState = true 
}) => {
  if (equipos.length === 0 && showEmptyState) {
    return (
      <Card sx={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        p: 4,
        textAlign: 'center'
      }}>
        <TrophyIcon sx={{ fontSize: 60, color: 'gray', mb: 2 }} />
        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
          No estás inscrito en ningún equipo
        </Typography>
        <Typography variant="body2" sx={{ color: 'gray' }}>
          Inscríbete en un equipo para empezar a jugar
        </Typography>
      </Card>
    );
  }

  return (
    <Box>
      <Typography 
        variant="h6" 
        sx={{ 
          color: 'white', 
          mb: 3, 
          fontWeight: 'bold',
          borderLeft: '4px solid #64b5f6',
          pl: 2
        }}
      >
        {titulo} ({equipos.length})
      </Typography>
      
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          lg: 'repeat(3, 1fr)'
        },
        gap: 3
      }}>
        {equipos.map((equipoData, index) => {
          // Buscar el número del jugador en este equipo
          const numeroJugador = usuario?.equipos?.find(
            e => e.equipo === equipoData._id || e.equipo === equipoData.id
          )?.numero;

          return (
            <EquipoCard
              key={equipoData._id || equipoData.id}
              equipo={equipoData}
              numeroJugador={numeroJugador}
              usuario={usuario}
              index={index}
            />
          );
        })}
      </Box>
    </Box>
  );
};