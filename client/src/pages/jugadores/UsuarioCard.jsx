import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Card,
  CardContent,
  Typography,
  CardActions,
  IconButton,
  CardMedia,
  Box,
  Collapse,
  Divider,
  Grid,
  Avatar,
  Chip,
  Button,
  Badge,
  Tooltip
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Groups as GroupsIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material'
import SportsFootballIcon from '@mui/icons-material/SportsFootball';
import { motion } from 'framer-motion'
import { getCategoryName } from '../../helpers/mappings'
import { useImage } from '../../hooks/useImage'
import { useAuth } from '../../context/AuthContext'

// 🔥 FUNCIÓN DE LOGGING PARA USUARIO CARD
const logUsuarioCard = (context, data, level = 'INFO') => {
  const timestamp = new Date().toISOString();
  const prefix = {
    'ERROR': '❌',
    'WARN': '⚠️', 
    'INFO': '✅',
    'DEBUG': '🔍'
  }[level] || '📝';
  
  console.log(`[${timestamp}] ${prefix} USUARIO_CARD | ${context}:`, data);
};

// 🔥 FUNCIÓN DEFENSIVA PARA VALIDAR EQUIPO
const validarEquipo = (equipo, context = 'GENERAL') => {
  logUsuarioCard(`VALIDAR_EQUIPO_${context}`, { equipo });
  
  if (!equipo) {
    logUsuarioCard(`EQUIPO_NULL_${context}`, { equipo }, 'WARN');
    return false;
  }
  
  if (typeof equipo !== 'object') {
    logUsuarioCard(`EQUIPO_NO_OBJECT_${context}`, { 
      equipo, 
      tipo: typeof equipo 
    }, 'WARN');
    return false;
  }
  
  if (!equipo._id) {
    logUsuarioCard(`EQUIPO_SIN_ID_${context}`, { equipo }, 'WARN');
    return false;
  }
  
  logUsuarioCard(`EQUIPO_VALIDO_${context}`, { equipoId: equipo._id });
  return true;
};

// 🔥 FUNCIÓN DEFENSIVA PARA VALIDAR RELACIÓN EQUIPO-USUARIO
const validarRelacionEquipo = (equipoObj, index, usuarioId) => {
  logUsuarioCard('VALIDAR_RELACION_EQUIPO', { 
    equipoObj, 
    index, 
    usuarioId 
  });
  
  if (!equipoObj) {
    logUsuarioCard('RELACION_EQUIPO_NULL', { 
      index, 
      usuarioId 
    }, 'WARN');
    return false;
  }
  
  if (typeof equipoObj !== 'object') {
    logUsuarioCard('RELACION_EQUIPO_NO_OBJECT', { 
      equipoObj, 
      index, 
      usuarioId,
      tipo: typeof equipoObj
    }, 'WARN');
    return false;
  }
  
  // Verificar que tenga la estructura esperada
  if (!equipoObj.equipo) {
    logUsuarioCard('RELACION_SIN_EQUIPO', { 
      equipoObj, 
      index, 
      usuarioId 
    }, 'WARN');
    return false;
  }
  
  // Validar el equipo anidado
  if (!validarEquipo(equipoObj.equipo, `RELACION_${index}`)) {
    return false;
  }
  
  logUsuarioCard('RELACION_EQUIPO_VALIDA', { 
    equipoId: equipoObj.equipo._id,
    numero: equipoObj.numero,
    index,
    usuarioId
  });
  
  return true;
};

// 🔥 FUNCIÓN PARA OBTENER EQUIPOS SEGUROS
const getEquiposSeguro = (usuario) => {
  logUsuarioCard('GET_EQUIPOS_SEGURO_INICIO', { 
    usuarioId: usuario?._id,
    equipos: usuario?.equipos
  });
  
  if (!usuario) {
    logUsuarioCard('USUARIO_NULL_GET_EQUIPOS', {}, 'WARN');
    return [];
  }
  
  if (!usuario.equipos) {
    logUsuarioCard('USUARIO_SIN_EQUIPOS', { usuarioId: usuario._id }, 'WARN');
    return [];
  }
  
  if (!Array.isArray(usuario.equipos)) {
    logUsuarioCard('EQUIPOS_NO_ARRAY', { 
      usuarioId: usuario._id,
      equipos: usuario.equipos,
      tipo: typeof usuario.equipos
    }, 'WARN');
    return [];
  }
  
  // Filtrar y validar cada equipo
  const equiposValidos = usuario.equipos.filter((equipoObj, index) => {
    try {
      return validarRelacionEquipo(equipoObj, index, usuario._id);
    } catch (error) {
      logUsuarioCard('ERROR_VALIDAR_EQUIPO_INDIVIDUAL', {
        index,
        equipoObj,
        usuarioId: usuario._id,
        error: error.message
      }, 'ERROR');
      return false;
    }
  });
  
  logUsuarioCard('EQUIPOS_SEGUROS_RESULTADO', {
    usuarioId: usuario._id,
    equiposOriginales: usuario.equipos.length,
    equiposValidos: equiposValidos.length
  });
  
  return equiposValidos;
};

// 🔥 Componente para el avatar principal del usuario CON VALIDACIÓN
const UsuarioAvatar = ({ imagen, nombre, equiposCount }) => {
  logUsuarioCard('USUARIO_AVATAR_RENDER', { imagen, nombre, equiposCount });
  
  const usuarioImageUrl = useImage(imagen, '');
  
  return (
    <Badge
      badgeContent={equiposCount || 0}
      color="primary"
      overlap="circular"
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      invisible={!equiposCount || equiposCount === 0}
    >
      <Avatar
        src={usuarioImageUrl}
        alt={`Foto de ${nombre || 'Usuario'}`}
        sx={{
          width: 80,
          height: 80,
          border: '3px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          mb: 2
        }}
      >
        <PersonIcon sx={{ fontSize: 40 }} />
      </Avatar>
    </Badge>
  );
};

// 🔥 Componente para mostrar un equipo del usuario CON VALIDACIÓN ROBUSTA
const EquipoUsuarioItem = ({ equipoObj, index, usuarioId }) => {
  logUsuarioCard('EQUIPO_USUARIO_ITEM_RENDER', { 
    equipoObj, 
    index, 
    usuarioId 
  });
  
  // Validación crítica - no renderizar si inválido
  if (!validarRelacionEquipo(equipoObj, index, usuarioId)) {
    logUsuarioCard('EQUIPO_ITEM_NO_RENDERIZADO', { 
      equipoObj, 
      index, 
      usuarioId 
    }, 'WARN');
    return null;
  }
  
  // Extraer datos de forma segura
  const equipo = equipoObj.equipo;
  const numero = equipoObj.numero;
  
  // Validaciones adicionales para el render
  const equipoNombre = equipo.nombre || 'Equipo sin nombre';
  const equipoCategoria = equipo.categoria || 'sin_categoria';
  
  let categoriaNombre;
  try {
    categoriaNombre = getCategoryName(equipoCategoria) || 'Sin categoría';
  } catch (error) {
    logUsuarioCard('ERROR_GET_CATEGORY_NAME_ITEM', {
      equipoId: equipo._id,
      categoria: equipoCategoria,
      error: error.message
    }, 'WARN');
    categoriaNombre = equipoCategoria || 'Sin categoría';
  }
  
  const equipoImageUrl = useImage(equipo.imagen, '');
  
  logUsuarioCard('EQUIPO_ITEM_DATOS_PROCESADOS', {
    equipoId: equipo._id,
    nombre: equipoNombre,
    categoria: categoriaNombre,
    numero: numero?.toString() || '?',
  });
  
  return (
    <motion.div
      key={equipo._id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 1.5,
          mb: 1,
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
          alt={`Logo de ${equipoNombre}`}
          sx={{ 
            width: 32, 
            height: 32,
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
            {equipoNombre}
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
            {categoriaNombre}
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 1
        }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.875rem',
              boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)'
            }}
          >
            {numero}
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
};

// 🔥 Componente para lista de equipos vacía
const EquiposVacios = ({ usuarioId }) => {
  logUsuarioCard('EQUIPOS_VACIOS_RENDER', { usuarioId });
  
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
        Este usuario no está inscrito en ningún equipo
      </Typography>
    </Box>
  );
};

// 🔥 Componente para lista de equipos del usuario CON VALIDACIÓN
const ListaEquiposUsuario = ({ equipos, usuarioId }) => {
  logUsuarioCard('LISTA_EQUIPOS_RENDER', { 
    equiposLength: equipos?.length || 0,
    usuarioId 
  });
  
  // Obtener equipos seguros
  const equiposSeguro = getEquiposSeguro({ _id: usuarioId, equipos });
  
  if (!equiposSeguro || equiposSeguro.length === 0) {
    return <EquiposVacios usuarioId={usuarioId} />;
  }

  return (
    <Box sx={{ 
      maxHeight: 280, 
      overflowY: 'auto',
      '&::-webkit-scrollbar': {
        width: '6px',
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: 'rgba(255,255,255,.3)',
        borderRadius: '3px',
      }
    }}>
      {equiposSeguro.map((equipoObj, index) => {
        try {
          // Doble validación para seguridad
          if (!validarRelacionEquipo(equipoObj, index, usuarioId)) {
            return null;
          }
          
          return (
            <EquipoUsuarioItem 
              key={equipoObj.equipo._id}
              equipoObj={equipoObj}
              index={index}
              usuarioId={usuarioId}
            />
          );
        } catch (error) {
          logUsuarioCard('ERROR_RENDER_EQUIPO_LISTA', {
            index,
            equipoObj,
            usuarioId,
            error: error.message
          }, 'ERROR');
          return null;
        }
      })}
    </Box>
  );
};

export const UsuarioCard = ({ usuario, eliminarUsuario }) => {
  const [expanded, setExpanded] = useState(false)
  
  const { puedeEditarUsuario, puedeGestionarUsuarios } = useAuth();
  
  // 🔥 LOGGING INICIAL DEL COMPONENTE
  logUsuarioCard('USUARIO_CARD_RENDER_INICIO', { 
    usuarioId: usuario?._id,
    usuario: usuario,
    equiposLength: usuario?.equipos?.length || 0
  });
  
  // Validación crítica del usuario
  if (!usuario) {
    logUsuarioCard('USUARIO_NULL_NO_RENDER', {}, 'ERROR');
    return null;
  }
  
  if (!usuario._id) {
    logUsuarioCard('USUARIO_SIN_ID_NO_RENDER', { usuario }, 'ERROR');
    return null;
  }
  
  const { _id, nombre, documento, imagen, equipos = [], rol } = usuario

  const handleExpandClick = () => {
    logUsuarioCard('EXPAND_CLICK', { 
      usuarioId: _id, 
      expanded: !expanded,
      equiposLength: equipos.length
    });
    setExpanded(!expanded)
  }

  // Validar permisos específicos para este usuario
  const puedeEditarEsteUsuario = puedeEditarUsuario(_id, usuario);
  const puedeEliminarEsteUsuario = puedeGestionarUsuarios();
  
  // Obtener equipos de forma segura
  const equiposSeguro = getEquiposSeguro(usuario);

  // Determinar color del rol
  const getRolColor = (rol) => {
    switch(rol) {
      case 'admin': return '#f44336'
      case 'capitan': return '#ff9800'
      case 'jugador': return '#4caf50'
      case 'arbitro': return '#9c27b0'
      default: return '#9e9e9e'
    }
  }

  // Determinar icono del rol
  const getRolIcon = (rol) => {
    switch(rol) {
      case 'admin': return <AdminIcon />
      case 'capitan': return <GroupsIcon />
      case 'jugador': return <PersonIcon />
      case 'arbitro': return <PersonIcon />
      default: return <PersonIcon />
    }
  }

  const getRolLabel = (rol) => {
    switch(rol) {
      case 'admin': return 'Administrador'
      case 'capitan': return 'Capitán'
      case 'jugador': return 'Jugador'
      case 'arbitro': return 'Árbitro'
      default: return 'Usuario'
    }
  }

  // Nombre seguro para mostrar
  const nombreSeguro = nombre && nombre.trim() ? nombre : 'Sin nombre';

  logUsuarioCard('USUARIO_CARD_DATOS_PROCESADOS', {
    usuarioId: _id,
    nombreSeguro,
    rol,
    equiposOriginales: equipos.length,
    equiposSeguro: equiposSeguro.length
  });

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
          {/* Badge del rol */}
          <Chip
            icon={getRolIcon(rol)}
            label={getRolLabel(rol)}
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              backgroundColor: getRolColor(rol),
              color: 'white',
              fontWeight: 'bold',
              '& .MuiChip-icon': {
                color: 'white'
              }
            }}
          />

          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            pt: 1
          }}>
            {/* Avatar con badge de equipos */}
            <UsuarioAvatar 
              imagen={imagen}
              nombre={nombreSeguro}
              equiposCount={equiposSeguro.length}
            />

            {/* Información del usuario */}
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
              {nombreSeguro}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'center',
                mb: 1
              }}
            >
              {documento || 'Sin documento'}
            </Typography>

            {/* Estadística de equipos */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              px: 2,
              py: 0.5
            }}>
              <SportsFootballIcon sx={{ fontSize: 16, color: '#64b5f6' }} />
              <Typography variant="caption" sx={{ color: 'white' }}>
                {equiposSeguro.length} {equiposSeguro.length === 1 ? 'equipo' : 'equipos'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Acciones principales */}
        <CardActions sx={{ 
          justifyContent: 'center', 
          gap: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {puedeEditarEsteUsuario && (
            <Tooltip title="Editar usuario">
              <IconButton
                component={Link}
                to={`/perfil/${_id}`}
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
                onClick={() => {
                  logUsuarioCard('ELIMINAR_USUARIO_CLICK', { usuarioId: _id });
                  eliminarUsuario(_id);
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
        </CardActions>

        {/* Botón para expandir equipos - Solo para jugadores y capitanes */}
        {(rol === 'jugador' || rol === 'capitan') && (
          <>
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
                <GroupsIcon sx={{ fontSize: 18 }} />
                <Typography variant="button">
                  {expanded ? 'Ocultar equipos' : 'Ver equipos'}
                </Typography>
              </Box>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Button>

            {/* Collapse con lista de equipos */}
            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <Box sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      color: 'white', 
                      fontWeight: 'bold', 
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <GroupsIcon sx={{ fontSize: 18, color: '#64b5f6' }} />
                    Equipos del Usuario
                  </Typography>

                  <ListaEquiposUsuario 
                    equipos={equipos} 
                    usuarioId={_id}
                  />
                </CardContent>
              </Box>
            </Collapse>
          </>
        )}
      </Card>
    </motion.div>
  )
}