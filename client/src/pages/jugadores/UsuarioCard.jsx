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
import { useImage } from '../../hooks/useImage' // 🔥 Importar el hook

// 🔥 Componente para el avatar principal del usuario
const UsuarioAvatar = ({ imagen, nombre, equiposCount }) => {
  const usuarioImageUrl = useImage(imagen, '');
  
  return (
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
        alt={`Foto de ${nombre}`}
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

// 🔥 Componente para mostrar un equipo del usuario
const EquipoUsuarioItem = ({ equipoObj, index }) => {
  const equipoImageUrl = useImage(equipoObj.equipo?.imagen, '');
  
  return (
    <motion.div
      key={equipoObj.equipo._id || equipoObj.equipo.id}
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
          alt={`Logo de ${equipoObj.equipo.nombre}`}
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
            {equipoObj.equipo.nombre}
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
            {getCategoryName(equipoObj.equipo.categoria)}
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
            {equipoObj.numero}
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
};

// 🔥 Componente para lista de equipos vacía
const EquiposVacios = () => (
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

// 🔥 Componente para lista de equipos del usuario
const ListaEquiposUsuario = ({ equipos }) => {
  if (!equipos || equipos.length === 0) {
    return <EquiposVacios />;
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
      {equipos.map((equipoObj, index) => (
        <EquipoUsuarioItem 
          key={equipoObj.equipo._id || equipoObj.equipo.id}
          equipoObj={equipoObj}
          index={index}
        />
      ))}
    </Box>
  );
};

export const UsuarioCard = ({ usuario, eliminarUsuario }) => {
  const [expanded, setExpanded] = useState(false)
  const { _id, nombre, documento, imagen, equipos = [], rol } = usuario

  const handleExpandClick = () => {
    setExpanded(!expanded)
  }

  // Determinar color del rol
  const getRolColor = (rol) => {
    switch(rol) {
      case 'admin': return '#f44336'
      case 'capitan': return '#ff9800'
      case 'jugador': return '#4caf50'
      default: return '#9e9e9e'
    }
  }

  // Determinar icono del rol
  const getRolIcon = (rol) => {
    switch(rol) {
      case 'admin': return <AdminIcon />
      case 'capitan': return <GroupsIcon />
      case 'jugador': return <PersonIcon />
      default: return <PersonIcon />
    }
  }

  const getRolLabel = (rol) => {
    switch(rol) {
      case 'admin': return 'Administrador'
      case 'capitan': return 'Capitán'
      case 'jugador': return 'Jugador'
      default: return 'Usuario'
    }
  }

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
              nombre={nombre}
              equiposCount={equipos.length}
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
              {documento}
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
                {equipos.length} {equipos.length === 1 ? 'equipo' : 'equipos'}
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
          
          <Tooltip title="Eliminar usuario">
            <IconButton 
              onClick={() => eliminarUsuario(_id)}
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
        </CardActions>

        {/* Botón para expandir equipos */}
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

                  <ListaEquiposUsuario equipos={equipos} />
                </CardContent>
              </Box>
            </Collapse>
          </>
        )}
      </Card>
    </motion.div>
  )
}