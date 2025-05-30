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
  Fab,
  Alert
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';
import InfoIcon from '@mui/icons-material/Info';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import SportsIcon from '@mui/icons-material/Sports';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import axiosInstance from '../../config/axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getCategoryName } from '../../helpers/mappings';
import { FiltrosEquipos } from '../../components/FiltrosEquipos';
import { ListaJugadoresEquipo } from './ListaJugadoresEquipo';
import { useImage } from '../../hooks/useImage'; // 🔥 Importar el hook
import Swal from 'sweetalert2';

// 🔥 Componente para tarjeta de equipo individual
const EquipoCard = ({ equipo, onAbrirDetalle, stats }) => {
  // 🔥 Usar el hook para la imagen del equipo
  const equipoImageUrl = useImage(equipo.imagen, '/images/equipo-default.jpg');

  return (
    <motion.div 
      variants={{
        hidden: { y: 20, opacity: 0 },
        visible: { 
          y: 0, 
          opacity: 1,
          transition: { duration: 0.6, ease: "easeOut" }
        }
      }}
      layout
      initial="hidden"
      animate="visible"
      exit="hidden"
      style={{ height: '100%' }}
    >
      <Card sx={{
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        borderRadius: 3,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        width: '100%',
        height: '400px',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 12px 20px rgba(0, 0, 0, 0.2)',
          backgroundColor: 'rgba(0, 0, 0, 0.9)'
        }
      }}>
        <CardMedia
          component="img"
          height="140"
          image={equipoImageUrl} // 🔥 Usar la URL del hook
          alt={equipo.nombre}
          sx={{ 
            objectFit: 'contain',
            borderTopLeftRadius: 3,
            borderTopRightRadius: 3,
            backgroundColor: 'rgba(255,255,255,0.05)',
            p: 2
          }}
        />
        <CardContent sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" component="div" sx={{ 
              fontWeight: 'bold', 
              color: 'white',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              mr: 1,
              minHeight: '1.5em'
            }}>
              {equipo.nombre}
            </Typography>
            <Chip
              label={getCategoryName(equipo.categoria)}
              size="small"
              color="primary"
              variant="outlined"
              sx={{
                fontSize: '0.7rem',
                height: '24px',
                minWidth: '80px'
              }}
            />
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 1.5,
            mb: 2,
            p: 1.5, 
            borderRadius: 2, 
            bgcolor: 'rgba(255,255,255,0.03)',
            minHeight: '120px',
            maxHeight: '120px',
            overflow: 'hidden'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: '24px' }}>
              <PersonIcon sx={{ color: '#64b5f6', fontSize: 20 }} />
              <Typography variant="body2" sx={{ 
                color: '#aaa',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {stats.jugadores} jugadores registrados
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: '24px' }}>
              <EmojiEventsIcon sx={{ color: '#64b5f6', fontSize: 20 }} />
              <Typography variant="body2" sx={{ 
                color: '#aaa',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {stats.torneos} torneos participados
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: '24px' }}>
              <SportsIcon sx={{ color: '#64b5f6', fontSize: 20 }} />
              <Typography variant="body2" sx={{ 
                color: '#aaa',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                Categoría: {getCategoryName(equipo.categoria)}
              </Typography>
            </Box>
          </Box>
        </CardContent>
        <CardActions sx={{ 
          p: 2, 
          gap: 1,
          mt: 'auto',
          minHeight: '60px'
        }}>
          <Button 
            variant="contained" 
            fullWidth
            startIcon={<InfoIcon />}
            onClick={() => onAbrirDetalle(equipo)}
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
    </motion.div>
  );
};

// 🔥 Componente para el avatar del equipo en el modal
const EquipoAvatar = ({ equipo, size = 120 }) => {
  const equipoImageUrl = useImage(equipo?.imagen, '');
  
  return (
    <Avatar
      src={equipoImageUrl}
      sx={{ 
        width: size, 
        height: size, 
        mx: 'auto', 
        mb: 3,
        border: '3px solid rgba(255, 255, 255, 0.2)'
      }}
    >
      <GroupsIcon sx={{ fontSize: size / 2 }} />
    </Avatar>
  );
};

export const Equipos = () => {
  const { tieneRol } = useAuth();
  const esCapitan = tieneRol('capitan');

  const [equipos, setEquipos] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [tabActivo, setTabActivo] = useState(0);

  useEffect(() => {
    obtenerEquipos();
  }, []);

  const obtenerEquipos = async () => {
    try {
      setCargando(true);
      setError(null);
      const { data } = await axiosInstance.get('/equipos');
      setEquipos(data);
      setFiltrados(data);
    } catch (error) {
      console.error('Error al obtener equipos:', error);
      setError('Hubo un problema al cargar los equipos. Intenta nuevamente más tarde.');
    } finally {
      setCargando(false);
    }
  };

  // Abrir detalle de equipo
  const abrirDetalleEquipo = async (equipo) => {
    try {
      setCargando(true);
      setEquipoSeleccionado(equipo);
      setDetalleAbierto(true);
    } catch (error) {
      console.error('Error al obtener detalle del equipo:', error);
    } finally {
      setCargando(false);
    }
  };

  // Cerrar detalle
  const cerrarDetalle = () => {
    setDetalleAbierto(false);
    setEquipoSeleccionado(null);
    setTabActivo(0);
  };

  // Cambiar tab en detalle
  const cambiarTab = (event, nuevoValor) => {
    setTabActivo(nuevoValor);
  };

  const eliminarEquipo = async (equipoId) => {
    try {
      setDetalleAbierto(false);
      setEquipoSeleccionado(null);
      
      setTimeout(async () => {
        const result = await Swal.fire({
          title: '¿Estás seguro?',
          text: 'No podrás revertir esto! Se eliminará el equipo y todas sus relaciones.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Sí, eliminarlo!',
          cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
          await axiosInstance.delete(`/equipos/${equipoId}`);
          
          Swal.fire({
            icon: 'success',
            title: 'Eliminado!',
            text: 'El equipo ha sido eliminado correctamente.',
            timer: 2000,
            showConfirmButton: false
          });
          
          setEquipos(prev => prev.filter(equipo => equipo._id !== equipoId));
          setFiltrados(prev => prev.filter(equipo => equipo._id !== equipoId));
          
        } else {
          setTimeout(() => {
            const equipoEncontrado = equipos.find(e => e._id === equipoId);
            if (equipoEncontrado) {
              setEquipoSeleccionado(equipoEncontrado);
              setDetalleAbierto(true);
            }
          }, 100);
        }
      }, 300);
      
    } catch (error) {
      console.error('Error al eliminar equipo:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar el equipo. Intenta nuevamente.'
      });
      
      setTimeout(() => {
        const equipoEncontrado = equipos.find(e => e._id === equipoId);
        if (equipoEncontrado) {
          setEquipoSeleccionado(equipoEncontrado);
          setDetalleAbierto(true);
        }
      }, 100);
    }
  };

  // Obtener estadísticas del equipo
  const obtenerEstadisticasEquipo = (equipo) => {
    return {
      jugadores: equipo.jugadores?.length || 0,
      torneos: 0,
      victorias: 0
    };
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
        {/* Header con filtros */}
        <motion.div variants={itemVariants}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 4,
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Typography variant="h4" component="h1" sx={{ 
              color: 'white',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              fontWeight: 'bold',
              borderLeft: '4px solid #3f51b5',
              pl: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <GroupsIcon sx={{ color: '#64b5f6' }} />
              Equipos
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FiltrosEquipos equipos={equipos} setFiltrados={setFiltrados} />
            </Box>
          </Box>
        </motion.div>

        {/* Lista de equipos */}
        {cargando && equipos.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={60} />
          </Box>
        ) : error ? (
          <motion.div variants={itemVariants}>
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
              <Button 
                variant="contained" 
                color="primary" 
                onClick={obtenerEquipos}
                sx={{ mt: 2, ml: 2 }}
              >
                Reintentar
              </Button>
            </Alert>
          </motion.div>
        ) : filtrados.length === 0 ? (
          <motion.div variants={itemVariants}>
            <Box sx={{ 
              p: 4, 
              bgcolor: 'rgba(0, 0, 0, 0.7)', 
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center'
            }}>
              <GroupsIcon sx={{ fontSize: 60, color: 'gray', mb: 2 }} />
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                {equipos.length === 0 ? 'No hay equipos registrados' : 'No se encontraron equipos con los filtros aplicados'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'gray', mb: 3 }}>
                {equipos.length === 0 ? 'Crea tu primer equipo para comenzar' : 'Intenta cambiar los filtros de búsqueda'}
              </Typography>
              {equipos.length === 0 && esCapitan && (
                <Button 
                  component={Link}
                  to="/equipos/nuevo"
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                  }}
                >
                  Crear Equipo
                </Button>
              )}
            </Box>
          </motion.div>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 3,
            justifyContent: { xs: 'center', sm: 'flex-start' }
          }}>
            <AnimatePresence>
              {filtrados.map((equipo) => {
                const stats = obtenerEstadisticasEquipo(equipo);
                
                return (
                  <Box 
                    key={equipo._id} 
                    sx={{ 
                      flexBasis: { 
                        xs: '100%',
                        sm: 'calc(50% - 12px)',
                        md: 'calc(33.333% - 16px)',
                        lg: 'calc(25% - 18px)',
                        xl: 'calc(20% - 19.2px)'
                      },
                      maxWidth: { 
                        xs: '100%', 
                        sm: 'calc(50% - 12px)', 
                        md: 'calc(33.333% - 16px)',
                        lg: 'calc(25% - 18px)',
                        xl: 'calc(20% - 19.2px)'
                      }
                    }}
                  >
                    <EquipoCard 
                      equipo={equipo} 
                      onAbrirDetalle={abrirDetalleEquipo}
                      stats={stats}
                    />
                  </Box>
                );
              })}
            </AnimatePresence>
          </Box>
        )}
      </motion.div>

      {/* FAB para agregar equipo */}
      {esCapitan && (
        <Fab 
          component={Link}
          to="/equipos/nuevo"
          color="primary"
          aria-label="agregar equipo"
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

      {/* Modal de detalle de equipo */}
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
        {equipoSeleccionado ? (
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
                <GroupsIcon sx={{ color: '#64b5f6' }} />
                <Typography variant="h6">{equipoSeleccionado.nombre}</Typography>
              </Box>
              <Chip
                label={getCategoryName(equipoSeleccionado.categoria)}
                color="primary"
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
                <Tab label="Jugadores" icon={<PersonIcon />} iconPosition="start" />
                <Tab label="Estadísticas" icon={<EmojiEventsIcon />} iconPosition="start" />
              </Tabs>
            </Box>
            
            <DialogContent sx={{ pt: 3 }}>
              {/* Tab 1: Información general */}
              {tabActivo === 0 && (
                <Box sx={{ textAlign: 'center' }}>
                  {/* 🔥 Usar el componente EquipoAvatar */}
                  <EquipoAvatar equipo={equipoSeleccionado} size={120} />
                  
                  <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {equipoSeleccionado.nombre}
                  </Typography>
                  
                  <Chip 
                    label={getCategoryName(equipoSeleccionado.categoria)}
                    color="primary"
                    sx={{ mb: 3 }}
                  />
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        bgcolor: 'rgba(255,255,255,0.05)',
                        textAlign: 'center'
                      }}>
                        <PersonIcon sx={{ fontSize: 32, color: '#64b5f6', mb: 1 }} />
                        <Typography variant="h6">
                          {obtenerEstadisticasEquipo(equipoSeleccionado).jugadores}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Jugadores
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        bgcolor: 'rgba(255,255,255,0.05)',
                        textAlign: 'center'
                      }}>
                        <EmojiEventsIcon sx={{ fontSize: 32, color: '#64b5f6', mb: 1 }} />
                        <Typography variant="h6">
                          {obtenerEstadisticasEquipo(equipoSeleccionado).torneos}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Torneos
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        bgcolor: 'rgba(255,255,255,0.05)',
                        textAlign: 'center'
                      }}>
                        <SportsIcon sx={{ fontSize: 32, color: '#64b5f6', mb: 1 }} />
                        <Typography variant="h6">
                          {obtenerEstadisticasEquipo(equipoSeleccionado).victorias}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Victorias
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}
              
              {/* Tab 2: Jugadores */}
              {tabActivo === 1 && (
                <ListaJugadoresEquipo 
                  jugadores={equipoSeleccionado?.jugadores || []}
                  equipo={equipoSeleccionado}
                  showActions={false}
                  showStats={true}
                  loading={cargando}
                  onJugadorClick={(jugador) => {
                    console.log('Jugador seleccionado:', jugador);
                  }}
                />
              )}
              
              {/* Tab 3: Estadísticas */}
              {tabActivo === 2 && (
                <Box>
                  <Typography variant="body1" sx={{ textAlign: 'center', p: 3 }}>
                    Estadísticas detalladas aparecerán aquí.
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
                {esCapitan && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      component={Link}
                      to={`/equipos/${equipoSeleccionado._id}/jugadores`}
                      state={{ equipo: equipoSeleccionado }}
                      variant="contained"
                      startIcon={<PersonAddIcon />}
                      color="secondary"
                      sx={{
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                        background: 'linear-gradient(45deg, #ff6b35 30%, #f7931e 90%)',
                        boxShadow: '0 3px 5px 2px rgba(255, 107, 53, .3)',
                      }}
                    >
                      Jugadores
                    </Button>
                    
                    <Button
                      component={Link}
                      to={`/equipos/editar/${equipoSeleccionado._id}`}
                      variant="outlined"
                      startIcon={<EditIcon />}
                      sx={{
                        borderRadius: 2,
                        px: 2,
                        py: 1
                      }}
                    >
                      Editar
                    </Button>
                    
                    <Button
                      onClick={() => eliminarEquipo(equipoSeleccionado._id)}
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      sx={{
                        borderRadius: 2,
                        px: 2,
                        py: 1
                      }}
                    >
                      Eliminar
                    </Button>
                  </Box>
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