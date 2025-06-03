import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  CardActions,
  IconButton,
  Box,
  Collapse,
  Grid,
  Avatar,
  Chip,
  Button,
  Badge,
  Tooltip,
  Rating,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
  Star as StarIcon,
  EmojiEvents as EmojiEventsIcon,
  Grade as GradeIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationOnIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Gavel as GavelIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useImage } from '../../hooks/useImage';
import { useAuth } from '../../context/AuthContext';

// Componente para mostrar certificaciones del árbitro
const CertificacionesArbitro = ({ certificaciones }) => {
  if (!certificaciones || certificaciones.length === 0) {
    return (
      <Box sx={{ 
        textAlign: 'center',
        p: 2,
        border: '2px dashed rgba(255, 255, 255, 0.2)',
        borderRadius: 2
      }}>
        <AssignmentIcon sx={{ 
          fontSize: 32, 
          color: 'rgba(255, 255, 255, 0.3)', 
          mb: 1 
        }} />
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.5)',
            fontStyle: 'italic'
          }}
        >
          Sin certificaciones registradas
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      maxHeight: 200, 
      overflowY: 'auto',
      '&::-webkit-scrollbar': {
        width: '6px',
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: 'rgba(255,255,255,.3)',
        borderRadius: '3px',
      }
    }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {certificaciones.map((cert, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Chip
              label={cert}
              size="small"
              variant="outlined"
              color="secondary"
              sx={{
                backgroundColor: 'rgba(156, 39, 176, 0.1)',
                borderColor: 'rgba(156, 39, 176, 0.3)',
                color: '#ba68c8',
                fontWeight: 'medium'
              }}
            />
          </motion.div>
        ))}
      </Box>
    </Box>
  );
};

// Componente para mostrar posiciones del árbitro
const PosicionesArbitro = ({ posiciones }) => {
  if (!posiciones || posiciones.length === 0) {
    return (
      <Box sx={{ 
        textAlign: 'center',
        p: 2,
        border: '2px dashed rgba(255, 255, 255, 0.2)',
        borderRadius: 2
      }}>
        <GradeIcon sx={{ 
          fontSize: 32, 
          color: 'rgba(255, 255, 255, 0.3)', 
          mb: 1 
        }} />
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.5)',
            fontStyle: 'italic'
          }}
        >
          Sin posiciones definidas
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {posiciones.map((posicion, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Chip
            label={posicion}
            size="small"
            color="primary"
            sx={{
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
              borderColor: 'rgba(33, 150, 243, 0.3)',
              fontWeight: 'medium'
            }}
          />
        </motion.div>
      ))}
    </Box>
  );
};

export const ArbitroCard = ({ arbitro, onEliminar, onCambiarDisponibilidad }) => {
  const [expanded, setExpanded] = useState(false);
  
  // 🔥 CORREGIDO: Usar las funciones específicas de validación por ID
  const { puedeGestionarArbitros, puedeEditarArbitro, puedeCambiarDisponibilidadArbitro } = useAuth();
  const navigate = useNavigate();
  
  const { 
    _id, 
    usuario, // Datos del usuario vienen poblados
    nivel, 
    experiencia,
    telefono,
    ubicacion,
    certificaciones = [], 
    posiciones = [], // Actualizado según nuevo modelo
    partidosDirigidos = 0,
    rating = 0,
    disponible,
    estado
  } = arbitro;

  // Extraer datos del usuario poblado
  const nombre = usuario?.nombre || 'Nombre no disponible';
  const email = usuario?.email || 'Email no disponible';
  const imagen = usuario?.imagen || '';

  const arbitroImageUrl = useImage(imagen, '');

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  // 🔥 NUEVO: Validar permisos específicos para este árbitro
  const puedeEditarEsteArbitro = puedeEditarArbitro(usuario?._id);
  const puedeEliminarEsteArbitro = puedeGestionarArbitros(); // Solo admin puede eliminar
  const puedeCambiarDisponibilidad = puedeCambiarDisponibilidadArbitro(usuario?._id);

  // Determinar color del nivel
  const getNivelColor = (nivel) => {
    switch(nivel?.toLowerCase()) {
      case 'nacional': return '#f44336';
      case 'regional': return '#ff9800';
      case 'local': return '#4caf50';
      case 'internacional': return '#9c27b0';
      default: return '#9e9e9e';
    }
  };

  // Obtener estado del árbitro
  const obtenerEstadoArbitro = () => {
    if (estado === 'inactivo') {
      return { texto: 'Inactivo', color: 'default', icon: <CancelIcon /> };
    } else if (disponible) {
      return { texto: 'Disponible', color: 'success', icon: <CheckCircleIcon /> };
    } else {
      return { texto: 'Ocupado', color: 'warning', icon: <AccessTimeIcon /> };
    }
  };

  const estadoArbitro = obtenerEstadoArbitro();

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      style={{ height: '100%' }}
    >
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(100, 181, 246, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }
        }}
      >
        {/* Header con imagen y información básica */}
        <Box sx={{ 
          position: 'relative',
          background: 'linear-gradient(135deg, rgba(100, 181, 246, 0.1) 0%, rgba(100, 181, 246, 0.05) 100%)',
          p: 3
        }}>
          {/* Badge del nivel */}
          <Chip
            icon={<GradeIcon />}
            label={nivel || 'No definido'}
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              backgroundColor: getNivelColor(nivel),
              color: 'white',
              fontWeight: 'bold',
              '& .MuiChip-icon': {
                color: 'white'
              }
            }}
          />

          {/* Switch de disponibilidad para usuarios autorizados */}
          {puedeCambiarDisponibilidad && (
            <FormControlLabel
              control={
                <Switch
                  checked={disponible}
                  onChange={(e) => onCambiarDisponibilidad && onCambiarDisponibilidad(_id, e.target.checked)}
                  color="success"
                  size="small"
                />
              }
              label="Disponible"
              sx={{
                position: 'absolute',
                top: 40,
                right: 8,
                fontSize: '0.75rem',
                margin: 0,
                '& .MuiFormControlLabel-label': {
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  marginLeft: '4px'
                }
              }}
            />
          )}

          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            pt: puedeCambiarDisponibilidad ? 2 : 1
          }}>
            {/* Avatar */}
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: estadoArbitro.color === 'success' ? '#4caf50' : 
                                   estadoArbitro.color === 'warning' ? '#ff9800' : '#757575',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid white'
                  }}
                >
                  {React.cloneElement(estadoArbitro.icon, { 
                    sx: { fontSize: 12, color: 'white' } 
                  })}
                </Box>
              }
            >
              <Avatar
                src={arbitroImageUrl}
                sx={{
                  width: 80,
                  height: 80,
                  border: '3px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  mb: 2
                }}
              >
                <GavelIcon sx={{ fontSize: 40 }} />
              </Avatar>
            </Badge>

            {/* Información del árbitro */}
            <Typography
              variant="h6"
              component="h3"
              sx={{
                color: 'white',
                fontWeight: 'bold',
                textAlign: 'center',
                mb: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%',
                maxWidth: '200px'
              }}
            >
              {nombre}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'center',
                mb: 1
              }}
            >
              {email}
            </Typography>

            {/* Estado y estadísticas */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              mb: 1
            }}>
              <Chip 
                icon={estadoArbitro.icon}
                label={estadoArbitro.texto}
                size="small"
                color={estadoArbitro.color}
                variant="outlined"
                sx={{ 
                  fontSize: '0.7rem',
                  height: 24
                }}
              />
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
                px: 1.5,
                py: 0.5
              }}>
                <EmojiEventsIcon sx={{ fontSize: 14, color: '#64b5f6' }} />
                <Typography variant="caption" sx={{ color: 'white', fontWeight: 'medium' }}>
                  {partidosDirigidos} partidos
                </Typography>
              </Box>
            </Box>

            {/* Rating */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              px: 2,
              py: 0.5
            }}>
              <Rating 
                value={rating} 
                readOnly 
                size="small"
                sx={{ color: '#FFD700' }}
              />
              <Typography variant="caption" sx={{ color: 'white' }}>
                ({rating.toFixed(1)})
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Información de contacto compacta */}
        <CardContent sx={{ px: 2, py: 1.5, flexGrow: 1 }}>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <PhoneIcon sx={{ fontSize: 14, color: '#64b5f6' }} />
                <Typography variant="caption" sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {telefono || 'N/A'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccessTimeIcon sx={{ fontSize: 14, color: '#64b5f6' }} />
                <Typography variant="caption" sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {experiencia} años
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>

        {/* Acciones principales */}
        <CardActions sx={{ 
          justifyContent: 'center', 
          gap: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {/* 🔥 CORREGIDO: Usar validación específica por ID */}
          {puedeEditarEsteArbitro && (
            <Tooltip title="Editar árbitro">
              <IconButton
                onClick={() => navigate(`/arbitros/editar/${_id}`)}
                sx={{
                  backgroundColor: 'rgba(33, 150, 243, 0.1)',
                  color: '#2196f3',
                  '&:hover': {
                    backgroundColor: 'rgba(33, 150, 243, 0.2)',
                    transform: 'scale(1.1)'
                  }
                }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
          
          {/* Solo admin puede eliminar árbitros */}
          {puedeEliminarEsteArbitro && (
            <Tooltip title="Eliminar árbitro">
              <IconButton 
                onClick={() => onEliminar && onEliminar(_id)}
                sx={{
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                  color: '#f44336',
                  '&:hover': {
                    backgroundColor: 'rgba(244, 67, 54, 0.2)',
                    transform: 'scale(1.1)'
                  }
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </CardActions>

        {/* Botón para expandir detalles */}
        <Button
          onClick={handleExpandClick}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: 1.5,
            px: 2,
            color: 'white',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon sx={{ fontSize: 18 }} />
            <Typography variant="button">
              {expanded ? 'Ocultar detalles' : 'Ver detalles'}
            </Typography>
          </Box>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Button>

        {/* Collapse con detalles adicionales */}
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <CardContent sx={{ p: 2 }}>
              {/* Ubicación */}
              {ubicacion && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    mb: 1
                  }}>
                    <LocationOnIcon sx={{ color: '#64b5f6', fontSize: 18 }} />
                    <Typography 
                      variant="subtitle2" 
                      sx={{ color: 'white', fontWeight: 'bold' }}
                    >
                      Ubicación
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', pl: 3 }}>
                    {ubicacion}
                  </Typography>
                </Box>
              )}

              {/* Certificaciones */}
              <Box sx={{ mb: 2 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    color: 'white', 
                    fontWeight: 'bold', 
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <AssignmentIcon sx={{ fontSize: 18, color: '#64b5f6' }} />
                  Certificaciones
                </Typography>
                <CertificacionesArbitro certificaciones={certificaciones} />
              </Box>

              {/* Posiciones */}
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    color: 'white', 
                    fontWeight: 'bold', 
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <GradeIcon sx={{ fontSize: 18, color: '#64b5f6' }} />
                  Posiciones
                </Typography>
                <PosicionesArbitro posiciones={posiciones} />
              </Box>
            </CardContent>
          </Box>
        </Collapse>
      </Card>
    </motion.div>
  );
};