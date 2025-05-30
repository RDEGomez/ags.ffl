import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Search as SearchIcon,
  Groups as GroupsIcon,
  EmojiEvents as EmojiEventsIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../../config/axios';
import { getCategoryName } from '../../helpers/mappings';
import { useImage } from '../../hooks/useImage'; // 🔥 Importar el hook
import Swal from 'sweetalert2';

// 🔥 Componente para equipo inscrito
const EquipoInscrito = ({ equipo, onDesinscribir, cargando }) => {
  const equipoImageUrl = useImage(equipo.imagen, '');
  
  return (
    <ListItem sx={{ 
      bgcolor: 'rgba(255,255,255,0.05)', 
      borderRadius: 2,
      mb: 1
    }}>
      <ListItemAvatar>
        <Avatar 
          src={equipoImageUrl}
          sx={{ bgcolor: 'primary.main' }}
        >
          {equipo.nombre?.charAt(0)}
        </Avatar>
      </ListItemAvatar>
      <ListItemText 
        primary={equipo.nombre}
        secondary={`${equipo.jugadores?.length || 0} jugadores`}
      />
      <ListItemSecondaryAction>
        <Tooltip title="Desinscribir equipo">
          <IconButton 
            edge="end" 
            color="error"
            onClick={() => onDesinscribir(equipo)}
            disabled={cargando}
          >
            <PersonRemoveIcon />
          </IconButton>
        </Tooltip>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

// 🔥 Componente para equipo disponible
const EquipoDisponible = ({ equipo, onInscribir, cargando }) => {
  const equipoImageUrl = useImage(equipo.imagen, '');
  
  return (
    <ListItem sx={{ 
      bgcolor: 'rgba(255,255,255,0.05)', 
      borderRadius: 2,
      mb: 1,
      '&:hover': {
        bgcolor: 'rgba(255,255,255,0.1)'
      }
    }}>
      <ListItemAvatar>
        <Avatar 
          src={equipoImageUrl}
          sx={{ bgcolor: 'secondary.main' }}
        >
          {equipo.nombre?.charAt(0)}
        </Avatar>
      </ListItemAvatar>
      <ListItemText 
        primary={equipo.nombre}
        secondary={
          <>
            <Typography variant="caption" component="span">
              {equipo.jugadores?.length || 0} jugadores
            </Typography>
            <Box component="span" sx={{ ml: 1 }}>
              <Chip 
                label={getCategoryName([equipo.categoria])}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.6rem', height: 20 }}
              />
            </Box>
          </>
        }
        secondaryTypographyProps={{
          component: 'div',
          sx: { display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }
        }}
      />
      <ListItemSecondaryAction>
        <Tooltip title="Inscribir equipo">
          <IconButton 
            edge="end" 
            color="primary"
            onClick={() => onInscribir(equipo)}
            disabled={cargando}
          >
            <PersonAddIcon />
          </IconButton>
        </Tooltip>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

// 🔥 Componente para el modal de confirmación
const ModalConfirmacion = ({ 
  open, 
  onClose, 
  equipoSeleccionado, 
  torneo, 
  onConfirmar, 
  cargando 
}) => {
  const equipoImageUrl = useImage(equipoSeleccionado?.imagen, '');
  
  if (!equipoSeleccionado) return null;
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: 'rgba(15, 15, 25, 0.95)',
          backdropFilter: 'blur(10px)'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <EmojiEventsIcon sx={{ color: '#FFD700' }} />
        Confirmar Inscripción
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar 
              src={equipoImageUrl}
              sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}
            >
              {equipoSeleccionado.nombre?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h6">{equipoSeleccionado.nombre}</Typography>
              <Typography variant="body2" color="text.secondary">
                {getCategoryName([equipoSeleccionado.categoria])}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {equipoSeleccionado.jugadores?.length || 0} jugadores
              </Typography>
            </Box>
          </Box>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            ¿Estás seguro de que deseas inscribir este equipo en el torneo "{torneo?.nombre}"?
          </Alert>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          startIcon={<CancelIcon />}
          disabled={cargando}
        >
          Cancelar
        </Button>
        <Button 
          onClick={() => onConfirmar(equipoSeleccionado)}
          variant="contained"
          startIcon={cargando ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          disabled={cargando}
          sx={{
            background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)'
          }}
        >
          {cargando ? 'Inscribiendo...' : 'Confirmar Inscripción'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const InscripcionesTorneo = ({ torneo, onEquiposActualizados }) => {
  // Estados
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);
  const [equiposInscritos, setEquiposInscritos] = useState(torneo?.equipos || []);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [modalInscripcion, setModalInscripcion] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);

  // Cargar equipos disponibles
  useEffect(() => {
    if (torneo) {
      obtenerEquiposDisponibles();
    }
  }, [torneo]);

  // Actualizar equipos inscritos cuando cambia el torneo
  useEffect(() => {
    if (torneo?.equipos) {
      setEquiposInscritos(torneo.equipos);
      // 🔥 IMPORTANTE: Pasar los equipos actualizados directamente
      obtenerEquiposDisponibles(torneo.equipos);
    }
  }, [torneo?.equipos]);

  const obtenerEquiposDisponibles = async (equiposActuales = equiposInscritos) => {
    try {
      setCargando(true);
      const { data } = await axiosInstance.get('/equipos');
      
      // Filtrar equipos que no estén ya inscritos y que tengan categorías compatibles
      const equiposCompatibles = data.filter(equipo => {
        const yaInscrito = equiposActuales.some(inscrito => inscrito._id === equipo._id);
        const categoriaCompatible = torneo?.categorias?.includes(equipo.categoria);
        return !yaInscrito && categoriaCompatible;
      });
      
      setEquiposDisponibles(equiposCompatibles);
    } catch (error) {
      console.error('Error al obtener equipos:', error);
      setError('Error al cargar los equipos disponibles');
    } finally {
      setCargando(false);
    }
  };

  // Filtrar equipos por búsqueda y categoría
  const equiposFiltrados = equiposDisponibles.filter(equipo => {
    const coincideBusqueda = equipo.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = !filtroCategoria || equipo.categoria === filtroCategoria;
    return coincideBusqueda && coincideCategoria;
  });

  // Agrupar equipos inscritos por categoría
  const equiposInscritosPorCategoria = equiposInscritos.reduce((acc, equipo) => {
    const categoria = equipo.categoria;
    if (!acc[categoria]) {
      acc[categoria] = [];
    }
    acc[categoria].push(equipo);
    return acc;
  }, {});

  // Inscribir equipo
  const inscribirEquipo = async (equipo) => {
    try {
      setCargando(true);
      
      const response = await axiosInstance.post(`/torneos/${torneo._id}/equipos`, {
        equipoId: equipo._id
      });

      // Si el backend devuelve el torneo populado, usarlo
      if (response.data.torneo && response.data.torneo.equipos) {
        // Notificar al componente padre con el torneo actualizado
        if (onEquiposActualizados) {
          onEquiposActualizados(response.data.torneo);
        }
      } else {
        // Fallback: recargar el torneo desde el servidor
        try {
          const torneoActualizado = await axiosInstance.get(`/torneos/${torneo._id}`);
          if (onEquiposActualizados) {
            onEquiposActualizados(torneoActualizado.data.torneo);
          }
        } catch (error) {
          console.error('Error al recargar torneo:', error);
          // Como último recurso, actualizar localmente
          setEquiposInscritos(prev => [...prev, equipo]);
          setEquiposDisponibles(prev => prev.filter(e => e._id !== equipo._id));
        }
      }

      Swal.fire({
        icon: 'success',
        title: 'Equipo inscrito',
        text: `${equipo.nombre} ha sido inscrito exitosamente`,
        timer: 2000,
        showConfirmButton: false
      });

      setModalInscripcion(false);
      setEquipoSeleccionado(null);
    } catch (error) {
      console.error('Error al inscribir equipo:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.msg || 'Error al inscribir el equipo'
      });
    } finally {
      setCargando(false);
    }
  };

  // Desinscribir equipo
  const desinscribirEquipo = async (equipo) => {
    try {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: `¿Deseas desinscribir a ${equipo.nombre} del torneo?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, desinscribir',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        setCargando(true);
        
        // En InscripcionesTorneo.jsx, en desinscribirEquipo, después de la llamada:
        const response = await axiosInstance.delete(`/torneos/${torneo._id}/equipos/${equipo._id}`);
        
        // Notificar al componente padre
        if (onEquiposActualizados) {
          onEquiposActualizados(response.data.torneo);
        }

        Swal.fire({
          icon: 'success',
          title: 'Equipo desinscrito',
          text: `${equipo.nombre} ha sido desinscrito del torneo`,
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error al desinscribir equipo:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.msg || 'Error al desinscribir el equipo'
      });
    } finally {
      setCargando(false);
    }
  };

  // Abrir modal de inscripción
  const abrirModalInscripcion = (equipo) => {
    setEquipoSeleccionado(equipo);
    setModalInscripcion(true);
  };

  // Cerrar modal
  const cerrarModal = () => {
    setModalInscripcion(false);
    setEquipoSeleccionado(null);
  };

  // Animaciones
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -100 }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* Panel de equipos inscritos */}
        <Box sx={{ flexBasis: { md: '50%' } }}>
          <Card sx={{ 
            bgcolor: 'rgba(0, 0, 0, 0.7)', 
            borderRadius: 3,
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircleIcon sx={{ color: '#4caf50', mr: 1 }} />
                <Typography variant="h6" sx={{ color: 'white' }}>
                  Equipos Inscritos
                </Typography>
                <Chip 
                  label={equiposInscritos.length} 
                  color="primary" 
                  size="small" 
                  sx={{ ml: 2 }}
                />
              </Box>

              {Object.keys(equiposInscritosPorCategoria).length === 0 ? (
                <Box sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  border: '2px dashed rgba(255,255,255,0.2)',
                  borderRadius: 2
                }}>
                  <GroupsIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No hay equipos inscritos aún
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ 
                  height: 500, 
                  overflow: 'auto',
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(255,255,255,.3)',
                    borderRadius: '4px',
                  }
                }}>
                  {Object.entries(equiposInscritosPorCategoria).map(([categoria, equipos]) => (
                    <Box key={categoria} sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ 
                        color: '#64b5f6', 
                        mb: 1,
                        fontWeight: 'bold'
                      }}>
                        {getCategoryName([categoria])} ({equipos.length})
                      </Typography>
                      
                      <List dense>
                        <AnimatePresence>
                          {equipos.map((equipo) => (
                            <motion.div
                              key={equipo._id}
                              variants={cardVariants}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              layout
                            >
                              <EquipoInscrito 
                                equipo={equipo}
                                onDesinscribir={desinscribirEquipo}
                                cargando={cargando}
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </List>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Panel de equipos disponibles */}
        <Box sx={{ flexBasis: { md: '50%' } }}>
          <Card sx={{ 
            bgcolor: 'rgba(0, 0, 0, 0.7)', 
            borderRadius: 3,
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonAddIcon sx={{ color: '#2196f3', mr: 1 }} />
                <Typography variant="h6" sx={{ color: 'white' }}>
                  Equipos Disponibles
                </Typography>
                <Chip 
                  label={equiposFiltrados.length} 
                  color="secondary" 
                  size="small" 
                  sx={{ ml: 2 }}
                />
              </Box>

              {/* Filtros */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Buscar equipo..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: 'rgba(255,255,255,0.5)' }} />
                        </InputAdornment>
                      ),
                      sx: { borderRadius: 2 }
                    }}
                  />
                  <FormControl fullWidth size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Categoría</InputLabel>
                    <Select
                      value={filtroCategoria}
                      onChange={(e) => setFiltroCategoria(e.target.value)}
                      label="Categoría"
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="">Todas</MenuItem>
                      {torneo?.categorias?.map(categoria => (
                        <MenuItem key={categoria} value={categoria}>
                          {getCategoryName([categoria])}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              {cargando ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : equiposFiltrados.length === 0 ? (
                <Box sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  border: '2px dashed rgba(255,255,255,0.2)',
                  borderRadius: 2
                }}>
                  <GroupsIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {busqueda || filtroCategoria ? 'No se encontraron equipos' : 'No hay equipos disponibles'}
                  </Typography>
                </Box>
              ) : (
                <List sx={{ 
                  height: 400, 
                  overflow: 'auto',
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(255,255,255,.3)',
                    borderRadius: '4px',
                  }
                }}>
                  <AnimatePresence>
                    {equiposFiltrados.map((equipo) => (
                      <motion.div
                        key={equipo._id}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        layout
                      >
                        <EquipoDisponible 
                          equipo={equipo}
                          onInscribir={abrirModalInscripcion}
                          cargando={cargando}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </List>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Modal de confirmación de inscripción */}
      <ModalConfirmacion 
        open={modalInscripcion}
        onClose={cerrarModal}
        equipoSeleccionado={equipoSeleccionado}
        torneo={torneo}
        onConfirmar={inscribirEquipo}
        cargando={cargando}
      />
    </Box>
  );
};