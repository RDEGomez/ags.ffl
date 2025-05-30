import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia,
  CardActions,
  Button,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  Fab
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';
import InfoIcon from '@mui/icons-material/Info';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import SportsIcon from '@mui/icons-material/Sports';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axiosInstance from '../../config/axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getCategoryName } from '../../helpers/mappings';
import { useImage } from '../../hooks/useImage'; // 🔥 Importar el hook

// 🔥 Componente para tarjeta de torneo individual
const TorneoCard = ({ torneo, onAbrirDetalle }) => {
  const torneoImageUrl = useImage(torneo.imagen, '/images/torneo-default.jpg');
  
  // Obtener estado del torneo basado en fechas
  const obtenerEstadoTorneo = (torneo) => {
    const ahora = new Date();
    const inicio = new Date(torneo.fechaInicio);
    const fin = new Date(torneo.fechaFin);
    
    if (ahora < inicio) {
      return { texto: 'Próximamente', color: 'warning' };
    } else if (ahora >= inicio && ahora <= fin) {
      return { texto: 'En curso', color: 'success' };
    } else {
      return { texto: 'Finalizado', color: 'default' };
    }
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    return format(new Date(fecha), "d 'de' MMMM, yyyy", { locale: es });
  };

  // Función para calcular partidos totales (placeholder)
  const calcularPartidosTotales = (torneo) => {
    const equiposPorCategoria = Math.ceil((torneo.equipos?.length || 0) / (torneo.categorias?.length || 1));
    const partidosPorCategoria = equiposPorCategoria > 1 ? equiposPorCategoria * 2 : 0;
    return (torneo.categorias?.length || 0) * partidosPorCategoria;
  };

  const estadoTorneo = obtenerEstadoTorneo(torneo);
  const partidosEstimados = calcularPartidosTotales(torneo);

  return (
    <Card sx={{
      backdropFilter: 'blur(10px)', 
      backgroundColor: 'rgba(0, 0, 0, 0.7)', 
      borderRadius: 3,
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 12px 20px rgba(0, 0, 0, 0.2)'
      }
    }}>
      <CardMedia
        component="img"
        height="140"
        image={torneoImageUrl} // 🔥 Usar la URL del hook
        alt={torneo.nombre}
        sx={{ 
          objectFit: 'cover',
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3
        }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" component="div" sx={{ 
            fontWeight: 'bold', 
            color: 'white',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            mr: 1
          }}>
            {torneo.nombre}
          </Typography>
          <Chip
            label={estadoTorneo.texto}
            size="small"
            color={estadoTorneo.color}
            variant="outlined"
          />
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: 1.5,
          mb: 2,
          p: 1.5, 
          borderRadius: 2, 
          bgcolor: 'rgba(255,255,255,0.03)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarMonthIcon sx={{ color: '#64b5f6', fontSize: 20 }} />
            <Typography variant="body2" sx={{ color: '#aaa' }}>
              {formatearFecha(torneo.fechaInicio)} - {formatearFecha(torneo.fechaFin)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GroupsIcon sx={{ color: '#64b5f6', fontSize: 20 }} />
            <Typography variant="body2" sx={{ color: '#aaa' }}>
              {torneo.equipos?.length || 0} equipos registrados
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SportsIcon sx={{ color: '#64b5f6', fontSize: 20 }} />
            <Typography variant="body2" sx={{ color: '#aaa' }}>
              {torneo.categorias?.length || 0} categorías
            </Typography>
          </Box>
          
          {partidosEstimados > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SportsSoccerIcon sx={{ color: '#64b5f6', fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: '#aaa' }}>
                ~{partidosEstimados} partidos estimados
              </Typography>
            </Box>
          )}
        </Box>
        
        {/* Chips de categorías */}
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 0.5,
          mt: 1
        }}>
          {torneo.categorias?.slice(0, 3).map((categoria, index) => (
            <Chip
              key={categoria}
              label={getCategoryName([categoria])}
              size="small"
              variant="outlined"
              sx={{ 
                fontSize: '0.7rem',
                height: 24,
                '& .MuiChip-label': {
                  px: 1
                }
              }}
            />
          ))}
          {torneo.categorias?.length > 3 && (
            <Chip
              label={`+${torneo.categorias.length - 3}`}
              size="small"
              variant="filled"
              color="primary"
              sx={{ 
                fontSize: '0.7rem',
                height: 24,
                '& .MuiChip-label': {
                  px: 1
                }
              }}
            />
          )}
        </Box>
      </CardContent>
      <CardActions sx={{ p: 2 }}>
        <Button 
          variant="contained" 
          fullWidth
          startIcon={<InfoIcon />}
          onClick={() => onAbrirDetalle(torneo._id)}
          sx={{
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
            borderRadius: 2,
            py: 1
          }}
        >
          Ver Detalles
        </Button>
      </CardActions>
    </Card>
  );
};

// 🔥 Componente para el avatar del torneo en el modal
const TorneoAvatar = ({ torneo }) => {
  const torneoImageUrl = useImage(torneo?.imagen, '/images/torneo-default.jpg');
  
  return (
    <CardMedia
      component="img"
      height="200"
      image={torneoImageUrl}
      alt={torneo?.nombre}
      sx={{ 
        borderRadius: 2,
        objectFit: 'cover',
        mb: 3
      }}
    />
  );
};

// 🔥 Componente para lista de equipos en el modal
const EquipoListItem = ({ equipo, index }) => {
  const equipoImageUrl = useImage(equipo.imagen, '');
  
  return (
    <ListItem 
      sx={{ 
        borderRadius: 2, 
        mb: 1, 
        bgcolor: 'rgba(255,255,255,0.05)',
        '&:hover': {
          bgcolor: 'rgba(255,255,255,0.1)'
        }
      }}
    >
      <ListItemAvatar>
        <Avatar 
          src={equipoImageUrl}
          alt={equipo.nombre}
          sx={{ 
            bgcolor: 'primary.main',
            border: '2px solid rgba(255,255,255,0.2)'
          }}
        >
          {equipo.nombre?.charAt(0) || 'E'}
        </Avatar>
      </ListItemAvatar>
      <ListItemText 
        primary={equipo.nombre} 
        secondary={`${equipo.jugadores?.length || 0} jugadores`} 
      />
      <Tooltip title="Ver equipo">
        <IconButton edge="end" color="primary">
          <InfoIcon />
        </IconButton>
      </Tooltip>
    </ListItem>
  );
};

export const Torneos = () => {
  const { usuario, tieneRol } = useAuth();
  const esCapitan = tieneRol('capitan');

  const [torneos, setTorneos] = useState([]);
  const [torneoSeleccionado, setTorneoSeleccionado] = useState(null);
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [tabActivo, setTabActivo] = useState(0);

  // Cargar torneos (sin filtros de categoría)
  useEffect(() => {
    const obtenerTorneos = async () => {
      try {
        setCargando(true);
        setError(null);
        
        // Solo filtrar por estado activo
        const { data } = await axiosInstance.get('/torneos?estado=activo');
        setTorneos(data.torneos);
      } catch (error) {
        console.error('Error al obtener torneos:', error);
        setError('Hubo un problema al cargar los torneos. Intenta nuevamente más tarde.');
      } finally {
        setCargando(false);
      }
    };
    
    obtenerTorneos();
  }, []);

  // Abrir detalle de torneo
  const abrirDetalleTorneo = async (id) => {
    try {
      setCargando(true);
      const { data } = await axiosInstance.get(`/torneos/${id}`);
      setTorneoSeleccionado(data.torneo);
      setDetalleAbierto(true);
    } catch (error) {
      console.error('Error al obtener detalle del torneo:', error);
    } finally {
      setCargando(false);
    }
  };

  // Cerrar detalle
  const cerrarDetalle = () => {
    setDetalleAbierto(false);
    setTorneoSeleccionado(null);
  };

  // Cambiar tab en detalle
  const cambiarTab = (event, nuevoValor) => {
    setTabActivo(nuevoValor);
  };

  // Animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15 } 
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

  return (
    <Box sx={{ 
      width: '100%', 
      p: { xs: 2, md: 4 },
      backgroundImage: 'linear-gradient(to bottom right, rgba(20, 20, 40, 0.9), rgba(10, 10, 30, 0.95))',
      minHeight: 'calc(100vh - 64px)',
      borderRadius: 2
    }}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ 
            color: 'white',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            mb: 3,
            fontWeight: 'bold',
            borderLeft: '4px solid #3f51b5',
            pl: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <EmojiEventsIcon sx={{ color: '#FFD700' }} />
            Torneos
          </Typography>
        </motion.div>

        {/* Lista de torneos */}
        {cargando && torneos.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={60} />
          </Box>
        ) : error ? (
          <motion.div variants={itemVariants}>
            <Box sx={{ 
              p: 3, 
              bgcolor: 'rgba(255, 0, 0, 0.1)', 
              borderRadius: 2,
              border: '1px solid rgba(255, 0, 0, 0.3)'
            }}>
              <Typography color="error">{error}</Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => window.location.reload()}
                sx={{ mt: 2 }}
              >
                Reintentar
              </Button>
            </Box>
          </motion.div>
        ) : torneos.length === 0 ? (
          <motion.div variants={itemVariants}>
            <Box sx={{ 
              p: 4, 
              bgcolor: 'rgba(0, 0, 0, 0.7)', 
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center'
            }}>
              <SportsSoccerIcon sx={{ fontSize: 60, color: 'gray', mb: 2 }} />
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                No hay torneos disponibles
              </Typography>
              <Typography variant="body2" sx={{ color: 'gray', mb: 3 }}>
                Crea tu primer torneo para comenzar
              </Typography>
              {esCapitan && (
                <Button 
                  component={Link}
                  to="/torneos/crear"
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                  }}
                >
                  Crear Torneo
                </Button>
              )}
            </Box>
          </motion.div>
        ) : (
          <Grid container spacing={3}>
            {torneos.map((torneo) => (
              <Grid item xs={12} sm={6} md={4} key={torneo._id}>
                <motion.div variants={itemVariants}>
                  <TorneoCard 
                    torneo={torneo}
                    onAbrirDetalle={abrirDetalleTorneo}
                  />
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
      </motion.div>

      {/* FAB para agregar torneo - Solo para capitanes */}
      {esCapitan && (
        <Fab 
          component={Link}
          to="/torneos/crear"
          color="primary"
          aria-label="agregar torneo"
          sx={{ 
            position: 'fixed',
            bottom: 84,
            right: 24,
            backgroundColor: 'primary.main',
            '&:hover': { backgroundColor: 'primary.dark' },
            zIndex: 1000,
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Modal de detalle de torneo */}
      <Dialog 
        open={detalleAbierto} 
        onClose={cerrarDetalle} 
        fullWidth 
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: 'rgba(15, 15, 25, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }
        }}
      >
        {torneoSeleccionado ? (
          <>
            <DialogTitle sx={{ 
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              pb: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmojiEventsIcon sx={{ color: '#FFD700' }} />
                <Typography variant="h6">{torneoSeleccionado.nombre}</Typography>
              </Box>
              <Chip
                label="En curso" // Placeholder - agregar lógica de estado
                color="success"
                variant="outlined"
                size="small"
              />
            </DialogTitle>
            
            <Box sx={{ px: 3, py: 2 }}>
              <Tabs 
                value={tabActivo} 
                onChange={cambiarTab}
                variant="fullWidth"
                textColor="primary"
                indicatorColor="primary"
                sx={{
                  '& .MuiTab-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&.Mui-selected': {
                      color: 'primary.main',
                      fontWeight: 'bold'
                    }
                  }
                }}
              >
                <Tab label="Información" icon={<InfoIcon />} iconPosition="start" />
                <Tab label="Equipos" icon={<GroupsIcon />} iconPosition="start" />
                <Tab 
                  label="Resultados" 
                  icon={<EmojiEventsIcon />} 
                  iconPosition="start" 
                  disabled={!torneoSeleccionado.resultados || !torneoSeleccionado.resultados.length} 
                />
              </Tabs>
            </Box>
            
            <DialogContent sx={{ pt: 3 }}>
              {/* Tab 1: Información general */}
              {tabActivo === 0 && (
                <Box>
                  <Box sx={{ mb: 3 }}>
                    {/* 🔥 Usar el componente TorneoAvatar */}
                    <TorneoAvatar torneo={torneoSeleccionado} />
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ 
                          p: 2, 
                          borderRadius: 2, 
                          bgcolor: 'rgba(255,255,255,0.05)',
                          mb: 2
                        }}>
                          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: '#64b5f6' }}>
                            Periodo del Torneo
                          </Typography>
                          
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            gap: 2
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CalendarMonthIcon sx={{ color: '#64b5f6' }} />
                              <Box>
                                <Typography variant="body2" color="text.secondary">Fecha de inicio</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                  {format(new Date(torneoSeleccionado.fechaInicio), "d 'de' MMMM, yyyy", { locale: es })}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CalendarMonthIcon sx={{ color: '#64b5f6' }} />
                              <Box>
                                <Typography variant="body2" color="text.secondary">Fecha de finalización</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                  {format(new Date(torneoSeleccionado.fechaFin), "d 'de' MMMM, yyyy", { locale: es })}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Box sx={{ 
                          p: 2, 
                          borderRadius: 2, 
                          bgcolor: 'rgba(255,255,255,0.05)',
                          mb: 2
                        }}>
                          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: '#64b5f6' }}>
                            Información de participación
                          </Typography>
                          
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            gap: 2
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <GroupsIcon sx={{ color: '#64b5f6' }} />
                              <Box>
                                <Typography variant="body2" color="text.secondary">Equipos registrados</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                  {torneoSeleccionado.equipos?.length || 0} equipos
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <SportsIcon sx={{ color: '#64b5f6' }} />
                              <Box>
                                <Typography variant="body2" color="text.secondary">Categorías</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                  {torneoSeleccionado.categorias?.length || 0} categorías
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                    
                    {/* Lista de todas las categorías */}
                    <Box sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      bgcolor: 'rgba(255,255,255,0.05)',
                      mt: 2
                    }}>
                      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: '#64b5f6' }}>
                        Categorías del Torneo
                      </Typography>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 1
                      }}>
                        {torneoSeleccionado.categorias?.map((categoria) => (
                          <Chip
                            key={categoria}
                            label={getCategoryName([categoria])}
                            variant="outlined"
                            color="primary"
                            sx={{ 
                              borderWidth: 2,
                              '&:hover': {
                                backgroundColor: 'rgba(33, 150, 243, 0.1)'
                              }
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}
              
              {/* Tab 2: Equipos */}
              {tabActivo === 1 && (
                <Box>
                  {torneoSeleccionado.equipos && torneoSeleccionado.equipos.length > 0 ? (
                    <List>
                      {torneoSeleccionado.equipos.map((equipo, index) => (
                        <React.Fragment key={equipo._id || index}>
                          <EquipoListItem equipo={equipo} index={index} />
                          {index < torneoSeleccionado.equipos.length - 1 && (
                            <Divider variant="inset" component="li" sx={{ opacity: 0.2 }} />
                          )}
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ 
                      p: 3, 
                      borderRadius: 2, 
                      bgcolor: 'rgba(255,255,255,0.03)',
                      textAlign: 'center'
                    }}>
                      <GroupsIcon sx={{ fontSize: 60, color: 'gray', mb: 2 }} />
                      <Typography variant="body1">
                        No hay equipos registrados en este torneo.
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
              
              {/* Tab 3: Resultados */}
              {tabActivo === 2 && torneoSeleccionado.resultados && (
                <Box>
                  <Typography variant="body1" sx={{ textAlign: 'center', p: 3 }}>
                    Los resultados aparecerán aquí una vez finalizadas las competencias.
                  </Typography>
                </Box>
              )}
            </DialogContent>
            
            <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                width: '100%',
                gap: 2
              }}>
                {/* Botón de inscripciones solo para capitanes */}
                {esCapitan && (
                  <Button
                    component={Link}
                    to={`/torneos/${torneoSeleccionado._id}/inscripciones`}
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    color="secondary"
                    sx={{
                      borderRadius: 2,
                      px: 3,
                      py: 1,
                      background: 'linear-gradient(45deg, #ff6b35 30%, #f7931e 90%)',
                      boxShadow: '0 3px 5px 2px rgba(255, 107, 53, .3)',
                    }}
                  >
                    Gestionar Inscripciones
                  </Button>
                )}
                
                <Box sx={{ marginLeft: 'auto' }}>
                  <Button 
                    onClick={cerrarDetalle}
                    variant="outlined"
                    sx={{
                      borderRadius: 2,
                      px: 3,
                      py: 1
                    }}
                  >
                    Cerrar
                  </Button>
                </Box>
              </Box>
            </DialogActions>
          </>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress size={40} />
            <Typography sx={{ mt: 2 }}>Cargando detalles...</Typography>
          </Box>
        )}
      </Dialog>
    </Box>
  );
};