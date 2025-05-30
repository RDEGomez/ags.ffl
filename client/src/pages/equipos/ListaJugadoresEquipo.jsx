import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Person as PersonIcon,
  Info as InfoIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  EmojiEvents as EmojiEventsIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useImage } from '../../hooks/useImage'; // 🔥 Importar el hook

// 🔥 Componente para mostrar un jugador individual
const JugadorCard = ({ 
  jugador, 
  index, 
  showActions, 
  onJugadorClick 
}) => {
  const jugadorImageUrl = useImage(jugador.imagen, '');
  
  return (
    <Grid item xs={12} sm={6} md={4}>
      <motion.div 
        variants={{
          hidden: { y: 20, opacity: 0 },
          visible: { 
            y: 0, 
            opacity: 1,
            transition: { duration: 0.4, ease: "easeOut" }
          }
        }}
      >
        <Card sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 2,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.3s ease',
          cursor: onJugadorClick ? 'pointer' : 'default',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            transform: 'translateY(-5px)',
            border: '1px solid rgba(100, 181, 246, 0.3)',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
          }
        }}
        onClick={() => onJugadorClick && onJugadorClick(jugador)}
        >
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              mb: 2
            }}>
              <Avatar 
                src={jugadorImageUrl}
                sx={{ 
                  width: 50, 
                  height: 50,
                  border: '2px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <PersonIcon />
              </Avatar>
              
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'white', 
                    fontWeight: 'bold',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {jugador.nombre || 'Jugador'}
                </Typography>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block'
                  }}
                >
                  {jugador.documento || 'Sin documento'}
                </Typography>
              </Box>
              
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)'
                }}
              >
                {jugador.numero || '?'}
              </Box>
            </Box>
            
            {/* Información adicional y acciones */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              pt: 1,
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Typography variant="caption" color="text.secondary">
                Jugador #{jugador.numero || '?'}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label="Activo"
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ 
                    fontSize: '0.6rem',
                    height: 20
                  }}
                />
                
                {showActions && (
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Ver perfil">
                      <IconButton 
                        size="small"
                        sx={{ 
                          backgroundColor: 'rgba(33, 150, 243, 0.1)',
                          color: '#2196f3',
                          '&:hover': {
                            backgroundColor: 'rgba(33, 150, 243, 0.2)'
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Aquí puedes agregar la lógica para ver perfil
                        }}
                      >
                        <VisibilityIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Editar">
                      <IconButton 
                        size="small"
                        sx={{ 
                          backgroundColor: 'rgba(255, 152, 0, 0.1)',
                          color: '#ff9800',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 152, 0, 0.2)'
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Aquí puedes agregar la lógica para editar
                        }}
                      >
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Grid>
  );
};

// 🔥 Componente para estado de carga
const LoadingSpinner = () => (
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    minHeight: '200px'
  }}>
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    >
      <PersonIcon sx={{ fontSize: 40, color: '#64b5f6' }} />
    </motion.div>
  </Box>
);

// 🔥 Componente para estado vacío
const EstadoVacio = ({ equipo }) => (
  <motion.div 
    variants={{
      hidden: { y: 20, opacity: 0 },
      visible: { 
        y: 0, 
        opacity: 1,
        transition: { duration: 0.6, ease: "easeOut" }
      }
    }}
  >
    <Box sx={{ 
      p: 4, 
      textAlign: 'center',
      border: '2px dashed rgba(255,255,255,0.2)',
      borderRadius: 2,
      backgroundColor: 'rgba(255, 255, 255, 0.02)'
    }}>
      <PersonIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)', mb: 2 }} />
      <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
        No hay jugadores registrados
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {equipo ? `${equipo.nombre} aún no tiene jugadores asignados` : 'No se encontraron jugadores'}
      </Typography>
    </Box>
  </motion.div>
);

export const ListaJugadoresEquipo = ({ 
  jugadores = [], 
  equipo = null,
  showActions = false,
  showStats = true,
  maxJugadores = 25,
  onJugadorClick = null,
  loading = false 
}) => {
  // Animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 } 
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header de la sección */}
      <motion.div variants={itemVariants}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3,
          p: 2,
          borderRadius: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon sx={{ color: '#64b5f6' }} />
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
              {equipo ? `Roster de ${equipo.nombre}` : 'Lista de Jugadores'}
            </Typography>
          </Box>
          <Chip 
            label={`${jugadores.length} jugador${jugadores.length !== 1 ? 'es' : ''}`}
            color="primary"
            variant="outlined"
            size="small"
          />
        </Box>
      </motion.div>

      {/* Lista de jugadores o estado vacío */}
      {jugadores.length === 0 ? (
        <EstadoVacio equipo={equipo} />
      ) : (
        <Grid container spacing={2}>
          {jugadores.map((jugador, index) => (
            <JugadorCard
              key={jugador._id || index}
              jugador={jugador}
              index={index}
              showActions={showActions}
              onJugadorClick={onJugadorClick}
            />
          ))}
        </Grid>
      )}

      {/* Estadísticas del roster */}
      {showStats && jugadores.length > 0 && (
        <motion.div variants={itemVariants}>
          <Box sx={{ 
            mt: 3,
            p: 2,
            borderRadius: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Typography variant="subtitle2" sx={{ 
              color: '#64b5f6', 
              mb: 2,
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <InfoIcon sx={{ fontSize: 16 }} />
              Estadísticas del Roster
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {jugadores.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Jugadores
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                    {jugadores.filter(j => j.numero && j.numero !== '?').length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Con Número
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                    {Math.max(0, maxJugadores - jugadores.length)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Cupos Libres
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </motion.div>
      )}
    </motion.div>
  );
};