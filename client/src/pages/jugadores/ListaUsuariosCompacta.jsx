import { useState } from 'react'
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Collapse,
  Divider,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tooltip,
  Badge
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Groups as GroupsIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  SportsSoccer as SportsIcon
} from '@mui/icons-material'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getCategoryName } from '../../helpers/mappings'
import { useImage } from '../../hooks/useImage'
import { useAuth } from '../../context/AuthContext' // 🔥 ASEGURAR: Import del AuthContext

// 🔥 Componente para el avatar del usuario
const UsuarioAvatar = ({ imagen, nombre, equiposCount }) => {
  const usuarioImageUrl = useImage(imagen, '');
  
  return (
    <ListItemAvatar>
      <Badge
        badgeContent={equiposCount}
        color="primary"
        overlap="circular"
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        invisible={equiposCount === 0}
      >
        <Avatar 
          src={usuarioImageUrl}
          sx={{ 
            width: 48, 
            height: 48,
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <PersonIcon />
        </Avatar>
      </Badge>
    </ListItemAvatar>
  );
};

// 🔥 Componente para mostrar un equipo del usuario
const EquipoUsuarioItem = ({ equipoObj, index }) => {
  const equipoImageUrl = useImage(equipoObj.equipo?.imagen, '');
  
  return (
    <Grid item xs={12} key={equipoObj.equipo._id}>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 2,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              transform: 'translateX(5px)'
            }
          }}
        >
          <Avatar
            src={equipoImageUrl}
            sx={{ 
              width: 36, 
              height: 36,
              border: '2px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <GroupsIcon />
          </Avatar>
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'white', 
                fontWeight: 'medium',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {equipoObj.equipo.nombre}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.6)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block'
              }}
            >
              {getCategoryName(equipoObj.equipo.categoria)}
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 1
          }}>
            <Chip
              label={`#${equipoObj.numero}`}
              size="small"
              sx={{
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                color: 'white',
                fontWeight: 'bold',
                minWidth: '44px'
              }}
            />
          </Box>
        </Box>
      </motion.div>
    </Grid>
  );
};

// 🔥 Componente para lista de equipos del usuario
const EquiposUsuario = ({ equipos }) => {
  if (equipos.length === 0) {
    return (
      <Box sx={{ 
        textAlign: 'center',
        p: 3,
        border: '2px dashed rgba(255, 255, 255, 0.2)',
        borderRadius: 2
      }}>
        <GroupsIcon sx={{ 
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
          No está en ningún equipo
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {equipos.map((equipoObj, equipoIndex) => (
        <EquipoUsuarioItem 
          key={equipoObj.equipo._id}
          equipoObj={equipoObj}
          index={equipoIndex}
        />
      ))}
    </Grid>
  );
};

// 🔥 Componente principal para cada usuario - CON OVERLAY RESPONSIVO
const UsuarioItem = ({ jugador, index, onEliminar }) => {
  const [expandedJugadorId, setExpandedJugadorId] = useState(null);
  const [showActionOverlay, setShowActionOverlay] = useState(false); // 🔥 NUEVO: Estado para overlay
  const { _id, nombre, documento, imagen, equipos = [], rol } = jugador;

  // 🔥 AGREGADO: Importar funciones de validación por ID
  const { puedeEditarUsuario, puedeGestionarUsuarios } = useAuth();

  const toggleExpand = (id) => {
    setExpandedJugadorId(prev => prev === id ? null : id);
  };

  // 🔥 NUEVO: Toggle para overlay de acciones
  const toggleActionOverlay = () => {
    setShowActionOverlay(prev => !prev);
  };

  // 🔥 NUEVO: Validar permisos específicos para este usuario
  const puedeEditarEsteUsuario = puedeEditarUsuario(_id, jugador);
  const puedeEliminarEsteUsuario = puedeGestionarUsuarios();

  // Determinar color del rol
  const getRolColor = (rol) => {
    switch(rol) {
      case 'admin': return '#f44336'
      case 'capitan': return '#ff9800'
      case 'jugador': return '#4caf50'
      case 'arbitro': return '#9c27b0'
      default: return '#9e9e9e'
    }
  };

  // Determinar icono del rol
  const getRolIcon = (rol) => {
    switch(rol) {
      case 'admin': return <AdminIcon />
      case 'capitan': return <GroupsIcon />
      case 'jugador': return <PersonIcon />
      case 'arbitro': return <PersonIcon />
      default: return <PersonIcon />
    }
  };

  const getRolLabel = (rol) => {
    switch(rol) {
      case 'admin': return 'Admin'
      case 'capitan': return 'Capitán'
      case 'jugador': return 'Jugador'
      case 'arbitro': return 'Árbitro'
      default: return 'Usuario'
    }
  };

  const isExpanded = expandedJugadorId === _id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
    >
      <Box
        sx={{
          position: 'relative', // 🔥 NUEVO: Para el overlay
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 2,
          mb: 1,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(100, 181, 246, 0.3)',
            transform: 'translateX(5px)'
          }
        }}
      >
        <ListItem
          onClick={toggleActionOverlay} // 🔥 NUEVO: Click para overlay en móvil
          sx={{
            py: 2,
            px: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: { xs: 'pointer', md: 'default' }, // 🔥 NUEVO: Cursor pointer en móvil
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            {/* Avatar con badge de equipos */}
            <UsuarioAvatar 
              imagen={imagen}
              nombre={nombre}
              equiposCount={equipos.length}
            />

            {/* Información del usuario */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* 🔥 LÍNEA 1: Solo nombre */}
              <Box sx={{ mb: 0.5 }}>
                <Typography 
                  fontWeight="bold" 
                  sx={{ 
                    color: 'white',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '1rem',
                    lineHeight: 1.2
                  }}
                >
                  {nombre}
                </Typography>
              </Box>
              
              {/* 🔥 LÍNEA 2: Solo documento */}
              <Box sx={{ mb: 1 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '0.875rem',
                    lineHeight: 1.2
                  }}
                >
                  {documento}
                </Typography>
              </Box>

              {/* 🔥 LÍNEA 3: Chip de rol + contador de equipos */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                flexWrap: 'wrap' // 🔥 Permite wrapping en pantallas muy pequeñas
              }}>
                {/* Chip de rol */}
                <Chip
                  icon={getRolIcon(rol)}
                  label={getRolLabel(rol)}
                  size="small"
                  sx={{
                    backgroundColor: getRolColor(rol),
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.7rem',
                    height: '24px',
                    '& .MuiChip-icon': {
                      color: 'white',
                      fontSize: '14px'
                    }
                  }}
                />
                
                {/* Contador de equipos */}
                {equipos.length > 0 && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5,
                    backgroundColor: 'rgba(100, 181, 246, 0.1)',
                    borderRadius: 1,
                    px: 1,
                    py: 0.25,
                    border: '1px solid rgba(100, 181, 246, 0.2)' // 🔥 Agregado: borde sutil
                  }}>
                    <SportsIcon sx={{ fontSize: 14, color: '#64b5f6' }} />
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: '#64b5f6', 
                        fontWeight: 'medium',
                        fontSize: '0.75rem' // 🔥 Slightly larger for better readability
                      }}
                    >
                      {equipos.length} {equipos.length === 1 ? 'equipo' : 'equipos'}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

          {/* 🔥 BOTONES DESKTOP - Solo visibles en pantallas grandes */}
          <Box sx={{ 
            display: { xs: 'none', md: 'flex' }, // 🔥 OCULTO en móvil, visible en desktop
            alignItems: 'center', 
            gap: 1 
          }}>
            {equipos.length > 0 && (
              <Tooltip title={isExpanded ? "Ocultar equipos" : "Ver equipos"}>
                <IconButton 
                  onClick={(e) => {
                    e.stopPropagation(); // 🔥 NUEVO: Evitar trigger del overlay
                    toggleExpand(_id);
                  }}
                  sx={{
                    backgroundColor: 'rgba(100, 181, 246, 0.1)',
                    color: '#64b5f6',
                    '&:hover': {
                      backgroundColor: 'rgba(100, 181, 246, 0.2)',
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Tooltip>
            )}
            
            {puedeEditarEsteUsuario && (
              <Tooltip title="Editar usuario">
                <IconButton 
                  component={Link} 
                  to={`/perfil/${_id}`} 
                  onClick={(e) => e.stopPropagation()} // 🔥 NUEVO: Evitar trigger del overlay
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
            
            {puedeEliminarEsteUsuario && (
              <Tooltip title="Eliminar usuario">
                <IconButton 
                  onClick={(e) => {
                    e.stopPropagation(); // 🔥 NUEVO: Evitar trigger del overlay
                    onEliminar(_id);
                  }} 
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
          </Box>
        </ListItem>

        {/* 🔥 OVERLAY DE ACCIONES MÓVIL - Solo visible en pantallas pequeñas */}
        <AnimatePresence>
          {showActionOverlay && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Box
                sx={{
                  display: { xs: 'flex', md: 'none' }, // 🔥 SOLO en móvil
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: isExpanded ? 'auto' : 0, // 🔥 Ajuste si está expandido
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 3,
                  zIndex: 10,
                  minHeight: '80px'
                }}
              >
                {/* Botón de cerrar */}
                <IconButton
                  onClick={toggleActionOverlay}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    width: 32,
                    height: 32,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)'
                    }
                  }}
                >
                  ×
                </IconButton>

                {/* Botones de acción en overlay */}
                {equipos.length > 0 && (
                  <Tooltip title={isExpanded ? "Ocultar equipos" : "Ver equipos"}>
                    <IconButton 
                      onClick={() => {
                        toggleExpand(_id);
                        setShowActionOverlay(false);
                      }}
                      sx={{
                        backgroundColor: 'rgba(100, 181, 246, 0.2)',
                        color: '#64b5f6',
                        width: 48,
                        height: 48,
                        '&:hover': {
                          backgroundColor: 'rgba(100, 181, 246, 0.3)',
                          transform: 'scale(1.1)'
                        }
                      }}
                    >
                      {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Tooltip>
                )}
                
                {puedeEditarEsteUsuario && (
                  <Tooltip title="Editar usuario">
                    <IconButton 
                      component={Link} 
                      to={`/perfil/${_id}`} 
                      sx={{
                        backgroundColor: 'rgba(33, 150, 243, 0.2)',
                        color: '#2196f3',
                        width: 48,
                        height: 48,
                        '&:hover': {
                          backgroundColor: 'rgba(33, 150, 243, 0.3)',
                          transform: 'scale(1.1)'
                        }
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                )}
                
                {puedeEliminarEsteUsuario && (
                  <Tooltip title="Eliminar usuario">
                    <IconButton 
                      onClick={() => {
                        onEliminar(_id);
                        setShowActionOverlay(false);
                      }} 
                      sx={{
                        backgroundColor: 'rgba(244, 67, 54, 0.2)',
                        color: '#f44336',
                        width: 48,
                        height: 48,
                        '&:hover': {
                          backgroundColor: 'rgba(244, 67, 54, 0.3)',
                          transform: 'scale(1.1)'
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapse con equipos - sin cambios */}
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            p: 3
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1, 
              mb: 2,
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              pb: 1
            }}>
              <GroupsIcon sx={{ color: '#64b5f6', fontSize: 20 }} />
              <Typography 
                variant="subtitle2" 
                fontWeight="bold" 
                sx={{ color: 'white' }}
              >
                Equipos del Usuario
              </Typography>
            </Box>

            <EquiposUsuario equipos={equipos} />
          </Box>
        </Collapse>
      </Box>
    </motion.div>
  );
};

export const ListaUsuariosCompacta = ({ usuarios, eliminarUsuario }) => {
  return (
    <List sx={{ p: 0 }}>
      <AnimatePresence>
        {usuarios.map((jugador, index) => (
          <UsuarioItem
            key={jugador._id}
            jugador={jugador}
            index={index}
            onEliminar={eliminarUsuario}
          />
        ))}
      </AnimatePresence>
    </List>
  )
}