import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Tab,
  Tabs,
  Fab,
  Alert,
  Rating,
  LinearProgress,
  Switch,
  FormControlLabel,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Info as InfoIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  EmojiEvents as EmojiEventsIcon,
  Grade as GradeIcon,
  History as HistoryIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationOnIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon,
  People as PeopleIcon,
  Gavel as GavelIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import SportsFootballIcon from '@mui/icons-material/SportsFootball';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import axiosInstance from '../../config/axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useImage } from '../../hooks/useImage';
import { ArbitroCard } from './ArbitroCard';
import Swal from 'sweetalert2';

// Componente para el avatar del árbitro en el modal
const ArbitroAvatar = ({ arbitro, size = 120 }) => {
  const arbitroImageUrl = useImage(arbitro?.usuario?.imagen, '');
  
  return (
    <Avatar
      src={arbitroImageUrl}
      sx={{ 
        width: size, 
        height: size, 
        mx: 'auto', 
        mb: 3,
        border: '3px solid rgba(255, 255, 255, 0.2)'
      }}
    >
      <GavelIcon sx={{ fontSize: size / 2 }} />
    </Avatar>
  );
};

// Componente para lista de partidos del árbitro
const PartidosArbitro = ({ partidos }) => {
  if (!partidos || partidos.length === 0) {
    return (
      <Box sx={{ 
        textAlign: 'center',
        p: 3,
        border: '2px dashed rgba(255, 255, 255, 0.2)',
        borderRadius: 2
      }}>
        <SportsFootballIcon sx={{ 
          fontSize: 48, 
          color: 'rgba(255, 255, 255, 0.3)', 
          mb: 2 
        }} />
        <Typography variant="body1">
          No ha dirigido partidos aún.
        </Typography>
      </Box>
    );
  }

  return (
    <List>
      {partidos.slice(0, 5).map((partido, index) => (
        <ListItem key={index} sx={{ 
          bgcolor: 'rgba(255,255,255,0.05)', 
          borderRadius: 2,
          mb: 1
        }}>
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <SportsFootballIcon />
            </Avatar>
          </ListItemAvatar>
          <ListItemText 
            primary={`${partido.equipoLocal} vs ${partido.equipoVisitante}`}
            secondary={
              <>
                <Typography component="span" variant="body2">
                  {partido.torneo}
                </Typography>
                <br />
                <Typography component="span" variant="body2">
                  {format(new Date(partido.fecha), "d 'de' MMMM, yyyy", { locale: es })}
                </Typography>
              </>
            }
          />
          <Chip 
            label={partido.estado}
            size="small"
            color={partido.estado === 'finalizado' ? 'success' : 'warning'}
          />
        </ListItem>
      ))}
      {partidos.length > 5 && (
        <Typography variant="caption" sx={{ 
          display: 'block', 
          textAlign: 'center', 
          mt: 2, 
          color: 'text.secondary' 
        }}>
          ... y {partidos.length - 5} partidos más
        </Typography>
      )}
    </List>
  );
};

export const Arbitros = () => {
  const { puedeGestionarArbitros } = useAuth();
  const navigate = useNavigate();

  const [arbitros, setArbitros] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [arbitroSeleccionado, setArbitroSeleccionado] = useState(null);
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [tabActivo, setTabActivo] = useState(0);
  const [filtroDisponibilidad, setFiltroDisponibilidad] = useState('todos');

  useEffect(() => {
    obtenerArbitros();
  }, []);

  const obtenerArbitros = async () => {
    try {
      setCargando(true);
      setError(null);
      
      const { data } = await axiosInstance.get('/arbitros');
      setArbitros(data.arbitros || []);
      setFiltrados(data.arbitros || []);
    } catch (error) {
      console.error('Error al obtener árbitros:', error);
      setError('Hubo un problema al cargar los árbitros. Intenta nuevamente más tarde.');
    } finally {
      setCargando(false);
    }
  };

  // Filtrar árbitros por disponibilidad
  useEffect(() => {
    let resultado = arbitros;
    
    if (filtroDisponibilidad === 'disponibles') {
      resultado = arbitros.filter(a => a.disponible && a.estado === 'activo');
    } else if (filtroDisponibilidad === 'ocupados') {
      resultado = arbitros.filter(a => !a.disponible && a.estado === 'activo');
    } else if (filtroDisponibilidad === 'inactivos') {
      resultado = arbitros.filter(a => a.estado === 'inactivo');
    }
    
    setFiltrados(resultado);
  }, [arbitros, filtroDisponibilidad]);

  // Abrir detalle de árbitro
  const abrirDetalleArbitro = async (arbitro) => {
    try {
      setCargando(true);
      setArbitroSeleccionado(arbitro);
      setDetalleAbierto(true);
    } catch (error) {
      console.error('Error al obtener detalle del árbitro:', error);
    } finally {
      setCargando(false);
    }
  };

  // Cerrar detalle
  const cerrarDetalle = () => {
    setDetalleAbierto(false);
    setArbitroSeleccionado(null);
    setTabActivo(0);
  };

  // Cambiar tab en detalle
  const cambiarTab = (event, nuevoValor) => {
    setTabActivo(nuevoValor);
  };

  // Cambiar disponibilidad de árbitro
  const cambiarDisponibilidad = async (arbitroId, nuevaDisponibilidad) => {
    try {
      await axiosInstance.patch(`/arbitros/${arbitroId}/disponibilidad`, {
        disponible: nuevaDisponibilidad
      });

      setArbitros(prev => 
        prev.map(arbitro => 
          arbitro._id === arbitroId 
            ? { ...arbitro, disponible: nuevaDisponibilidad }
            : arbitro
        )
      );

      Swal.fire({
        icon: 'success',
        title: 'Disponibilidad actualizada',
        text: `El árbitro ahora está ${nuevaDisponibilidad ? 'disponible' : 'ocupado'}`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error al cambiar disponibilidad:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.mensaje || 'No se pudo actualizar la disponibilidad'
      });
    }
  };

  // Eliminar árbitro
  const eliminarArbitro = async (arbitroId) => {
    try {
      setDetalleAbierto(false);
      setArbitroSeleccionado(null);
      
      setTimeout(async () => {
        const result = await Swal.fire({
          title: '¿Estás seguro?',
          text: 'No podrás revertir esto! Se eliminará el árbitro permanentemente.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Sí, eliminarlo!',
          cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
          await axiosInstance.delete(`/arbitros/${arbitroId}`);
          
          setArbitros(prev => prev.filter(arbitro => arbitro._id !== arbitroId));
          setFiltrados(prev => prev.filter(arbitro => arbitro._id !== arbitroId));
          
          Swal.fire({
            icon: 'success',
            title: 'Eliminado!',
            text: 'El árbitro ha sido eliminado correctamente.',
            timer: 2000,
            showConfirmButton: false
          });
        }
      }, 300);
      
    } catch (error) {
      console.error('Error al eliminar árbitro:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.mensaje || 'No se pudo eliminar el árbitro. Intenta nuevamente.'
      });
    }
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

  const cardStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 3,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
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
              <GavelIcon sx={{ color: '#64b5f6' }} />
              Árbitros
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant={filtroDisponibilidad === 'todos' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setFiltroDisponibilidad('todos')}
                >
                  Todos
                </Button>
                <Button
                  variant={filtroDisponibilidad === 'disponibles' ? 'contained' : 'outlined'}
                  size="small"
                  color="success"
                  onClick={() => setFiltroDisponibilidad('disponibles')}
                >
                  Disponibles
                </Button>
                <Button
                  variant={filtroDisponibilidad === 'ocupados' ? 'contained' : 'outlined'}
                  size="small"
                  color="warning"
                  onClick={() => setFiltroDisponibilidad('ocupados')}
                >
                  Ocupados
                </Button>
              </Box>
            </Box>
          </Box>
        </motion.div>

        {/* Tarjetas de estadísticas */}
        <motion.div variants={itemVariants}>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={cardStyle}>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <PeopleIcon sx={{ fontSize: 40, color: '#64b5f6', mb: 1 }} />
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {arbitros.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Árbitros
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={cardStyle}>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <CheckCircleIcon sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {arbitros.filter(a => a.disponible && a.estado === 'activo').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Disponibles
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={cardStyle}>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <AccessTimeIcon sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {arbitros.filter(a => !a.disponible && a.estado === 'activo').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ocupados
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={cardStyle}>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <EmojiEventsIcon sx={{ fontSize: 40, color: '#e91e63', mb: 1 }} />
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {arbitros.reduce((total, a) => total + (a.partidosDirigidos || 0), 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Partidos Dirigidos
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </motion.div>

        {/* Lista de árbitros */}
        {cargando && arbitros.length === 0 ? (
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
                onClick={obtenerArbitros}
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
              <GavelIcon sx={{ fontSize: 60, color: 'gray', mb: 2 }} />
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                {arbitros.length === 0 ? 'No hay árbitros registrados' : 'No se encontraron árbitros con los filtros aplicados'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'gray', mb: 3 }}>
                {arbitros.length === 0 ? 'Registra el primer árbitro para comenzar' : 'Intenta cambiar los filtros de búsqueda'}
              </Typography>
              {arbitros.length === 0 && puedeGestionarArbitros() && (
                <Button 
                  component={Link}
                  to="/arbitros/nuevo"
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                  }}
                >
                  Registrar Árbitro
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
              {filtrados.map((arbitro) => (
                <Box 
                  key={arbitro._id} 
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
                  <ArbitroCard 
                    arbitro={arbitro}
                    onEliminar={eliminarArbitro}
                    onCambiarDisponibilidad={cambiarDisponibilidad}
                  />
                </Box>
              ))}
            </AnimatePresence>
          </Box>
        )}
      </motion.div>

      {/* FAB para agregar árbitro */}
      {puedeGestionarArbitros() && (
        <Fab 
          component={Link}
          to="/arbitros/nuevo"
          color="primary"
          aria-label="agregar arbitro"
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

      {/* Modal de detalle de árbitro */}
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
        {arbitroSeleccionado ? (
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
                <GavelIcon sx={{ color: '#64b5f6' }} />
                <Typography variant="h6">{arbitroSeleccionado.usuario?.nombre || 'Árbitro'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={arbitroSeleccionado.nivel}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
                {puedeGestionarArbitros() && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={arbitroSeleccionado.disponible}
                        onChange={(e) => cambiarDisponibilidad(arbitroSeleccionado._id, e.target.checked)}
                        color="success"
                      />
                    }
                    label="Disponible"
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
              <IconButton onClick={cerrarDetalle}>
                <CloseIcon />
              </IconButton>
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
                <Tab label="Historial" icon={<HistoryIcon />} iconPosition="start" />
                <Tab label="Estadísticas" icon={<GradeIcon />} iconPosition="start" />
              </Tabs>
            </Box>
            
            <DialogContent sx={{ pt: 3 }}>
              {/* Tab 1: Información general */}
              {tabActivo === 0 && (
                <Box sx={{ textAlign: 'center' }}>
                  <ArbitroAvatar arbitro={arbitroSeleccionado} size={120} />
                  
                  <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {arbitroSeleccionado.usuario?.nombre || 'Nombre no disponible'}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
                    <Chip 
                      label={arbitroSeleccionado.nivel}
                      color="primary"
                    />
                    <Chip 
                      label={arbitroSeleccionado.disponible ? 'Disponible' : 'Ocupado'}
                      color={arbitroSeleccionado.disponible ? 'success' : 'warning'}
                    />
                  </Box>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        bgcolor: 'rgba(255,255,255,0.05)',
                        mb: 2
                      }}>
                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: '#64b5f6' }}>
                          Información de Contacto
                        </Typography>
                        
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          gap: 2
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmailIcon sx={{ color: '#64b5f6' }} />
                            <Box>
                              <Typography variant="body2" color="text.secondary">Email</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                {arbitroSeleccionado.usuario?.email || 'No disponible'}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PhoneIcon sx={{ color: '#64b5f6' }} />
                            <Box>
                              <Typography variant="body2" color="text.secondary">Teléfono</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                {arbitroSeleccionado.telefono || 'No disponible'}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationOnIcon sx={{ color: '#64b5f6' }} />
                            <Box>
                              <Typography variant="body2" color="text.secondary">Ubicación</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                {arbitroSeleccionado.ubicacion || 'No especificada'}
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
                          Experiencia y Certificaciones
                        </Typography>
                        
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          gap: 2
                        }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Años de experiencia</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {arbitroSeleccionado.experiencia} años
                            </Typography>
                          </Box>
                          
                          <Box>
                            <Typography variant="body2" color="text.secondary">Partidos dirigidos</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {arbitroSeleccionado.partidosDirigidos} partidos
                            </Typography>
                          </Box>
                          
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Certificaciones</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {arbitroSeleccionado.certificaciones?.map((cert, index) => (
                                <Chip
                                  key={index}
                                  label={cert}
                                  size="small"
                                  variant="outlined"
                                  color="secondary"
                                />
                              ))}
                            </Box>
                          </Box>
                          
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Posiciones</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {arbitroSeleccionado.posiciones?.map((posicion, index) => (
                                <Chip
                                  key={index}
                                  label={posicion}
                                  size="small"
                                  color="primary"
                                />
                              ))}
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}
              
              {/* Tab 2: Historial de partidos */}
              {tabActivo === 1 && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#64b5f6' }}>
                    Últimos Partidos Dirigidos
                  </Typography>
                  <PartidosArbitro partidos={[
                    {
                      equipoLocal: 'Águilas Rojas',
                      equipoVisitante: 'Leones Azules',
                      torneo: 'Liga Aguascalientes 2024',
                      fecha: '2024-05-15',
                      estado: 'finalizado'
                    },
                    {
                      equipoLocal: 'Tigres Dorados',
                      equipoVisitante: 'Halcones Negros',
                      torneo: 'Copa Regional',
                      fecha: '2024-05-10',
                      estado: 'finalizado'
                    }
                  ]} />
                </Box>
              )}
              
              {/* Tab 3: Estadísticas */}
              {tabActivo === 2 && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#64b5f6' }}>
                    Estadísticas de Rendimiento
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ 
                        textAlign: 'center',
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.05)'
                      }}>
                        <EmojiEventsIcon sx={{ fontSize: 32, color: '#64b5f6', mb: 1 }} />
                        <Typography variant="h6">
                          {arbitroSeleccionado.partidosDirigidos}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Partidos Dirigidos
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ 
                        textAlign: 'center',
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.05)'
                      }}>
                        <StarIcon sx={{ fontSize: 32, color: '#FFD700', mb: 1 }} />
                        <Typography variant="h6">
                          {arbitroSeleccionado.rating}/5
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Calificación Promedio
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ 
                        textAlign: 'center',
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.05)'
                      }}>
                        <AccessTimeIcon sx={{ fontSize: 32, color: '#64b5f6', mb: 1 }} />
                        <Typography variant="h6">
                          {arbitroSeleccionado.experiencia}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Años de Experiencia
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                      Calificación por Categorías
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Puntualidad</Typography>
                        <Typography variant="body2">4.8/5</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={96} 
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: '#4caf50'
                          }
                        }} 
                      />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Conocimiento de Reglas</Typography>
                        <Typography variant="body2">4.5/5</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={90} 
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: '#2196f3'
                          }
                        }} 
                      />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Comunicación</Typography>
                        <Typography variant="body2">4.2/5</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={84} 
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: '#ff9800'
                          }
                        }} 
                      />
                    </Box>
                  </Box>
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
                {puedeGestionarArbitros() && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      onClick={() => navigate(`/arbitros/editar/${arbitroSeleccionado._id}`)}
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
                      onClick={() => eliminarArbitro(arbitroSeleccionado._id)}
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