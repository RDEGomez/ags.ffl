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

export const ListaUsuariosCompacta = ({ usuarios, eliminarUsuario }) => {
  const [expandedJugadorId, setExpandedJugadorId] = useState(null)
  const imagenUrlBase = import.meta.env.VITE_BACKEND_URL + '/uploads/'

  const toggleExpand = (id) => {
    setExpandedJugadorId(prev => prev === id ? null : id)
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
      case 'admin': return 'Admin'
      case 'capitan': return 'Capitán'
      case 'jugador': return 'Jugador'
      default: return 'Usuario'
    }
  }

  return (
    <List sx={{ p: 0 }}>
      <AnimatePresence>
        {usuarios.map((jugador, index) => {
          const { _id, nombre, documento, imagen, equipos = [], rol } = jugador
          const isExpanded = expandedJugadorId === _id

          return (
            <motion.div
              key={_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <Box
                sx={{
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
                  sx={{
                    py: 2,
                    px: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                    {/* Avatar con badge de equipos */}
                    <ListItemAvatar>
                      <Badge
                        badgeContent={equipos.length}
                        color="primary"
                        overlap="circular"
                        anchorOrigin={{
                          vertical: 'bottom',
                          horizontal: 'right',
                        }}
                        invisible={equipos.length === 0}
                      >
                        <Avatar 
                          src={`${imagenUrlBase}${imagen}`}
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

                    {/* Información del usuario */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                        <Typography 
                          fontWeight="bold" 
                          sx={{ 
                            color: 'white',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1
                          }}
                        >
                          {nombre}
                        </Typography>
                        
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
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.7)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {documento}
                        </Typography>
                        
                        {equipos.length > 0 && (
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 0.5,
                            backgroundColor: 'rgba(100, 181, 246, 0.1)',
                            borderRadius: 1,
                            px: 1,
                            py: 0.25
                          }}>
                            <SportsIcon sx={{ fontSize: 14, color: '#64b5f6' }} />
                            <Typography 
                              variant="caption" 
                              sx={{ color: '#64b5f6', fontWeight: 'medium' }}
                            >
                              {equipos.length} {equipos.length === 1 ? 'equipo' : 'equipos'}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>

                  {/* Acciones */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {equipos.length > 0 && (
                      <Tooltip title={isExpanded ? "Ocultar equipos" : "Ver equipos"}>
                        <IconButton 
                          onClick={() => toggleExpand(_id)}
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
                  </Box>
                </ListItem>

                {/* Collapse con equipos */}
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

                    {equipos.length > 0 ? (
                      <Grid container spacing={2}>
                        {equipos.map((equipoObj, equipoIndex) => (
                          <Grid item xs={12} key={equipoObj.equipo._id}>
                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: equipoIndex * 0.1 }}
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
                                  src={`${imagenUrlBase}${equipoObj.equipo.imagen}`}
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
                        ))}
                      </Grid>
                    ) : (
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
                    )}
                  </Box>
                </Collapse>
              </Box>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </List>
  )
}