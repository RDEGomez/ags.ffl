import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Box, Typography, Paper, Grid, Chip, Avatar, Card, CardContent, 
  Divider, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Stack, Collapse, IconButton, List, ListItem,
  Badge, InputAdornment, FormControl, InputLabel, Select, MenuItem,
  Tooltip, Alert, useTheme, useMediaQuery
} from '@mui/material';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EmailIcon from '@mui/icons-material/Email';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import BadgeIcon from '@mui/icons-material/Badge';
import GroupsIcon from '@mui/icons-material/Groups';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SportsIcon from '@mui/icons-material/Sports';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ScheduleIcon from '@mui/icons-material/Schedule';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RefreshIcon from '@mui/icons-material/Refresh';
import axiosInstance from '../config/axios';
import { getCategoryName } from '../helpers/mappings';
import { useImage } from '../hooks/useImage';
import TeamCard from './TeamCard';

// FUNCIÓN HELPER UNIFICADA para URLs de imágenes
const getImageUrl = (imagen) => {
  if (!imagen) return '';
  if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
    return imagen;
  }
  return `${import.meta.env.VITE_BACKEND_URL || ''}/uploads/${imagen}`;
};

// Avatar del Usuario con Rol Overlapped
const UserProfileAvatar = ({ usuario, size = 120 }) => {
  const imagePath = useImage(usuario?.imagen);
  
  const roleColors = {
    admin: '#ff6b6b', capitan: '#4ecdc4', 
    jugador: '#45b7d1', arbitro: '#f9ca24'
  };
  
  const roleLabels = {
    admin: 'ADMIN', capitan: 'CAPITÁN', 
    jugador: 'JUGADOR', arbitro: 'ÁRBITRO'
  };

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, duration: 0.8 }}
    >
      <Box sx={{ position: 'relative', display: 'inline-block' }}>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          badgeContent={
            <Chip
              label={roleLabels[usuario?.rol] || 'USER'}
              size="small"
              sx={{
                backgroundColor: roleColors[usuario?.rol] || '#666',
                color: 'white', fontWeight: 'bold',
                fontSize: { xs: '0.6rem', md: '0.7rem' }, 
                height: { xs: '18px', md: '20px' },
                '& .MuiChip-label': { px: 1 }
              }}
            />
          }
        >
          <Avatar
            src={imagePath}
            sx={{
              width: size, height: size,
              border: `4px solid ${roleColors[usuario?.rol] || '#666'}`,
              boxShadow: `0 0 20px ${roleColors[usuario?.rol]}40`,
              background: `linear-gradient(135deg, ${roleColors[usuario?.rol]}20, ${roleColors[usuario?.rol]}40)`,
              fontSize: size * 0.4, fontWeight: 'bold',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: `0 0 30px ${roleColors[usuario?.rol]}60`
              }
            }}
          >
            {(usuario?.nombre?.charAt(0) || usuario?.email?.charAt(0) || 'U').toUpperCase()}
          </Avatar>
        </Badge>
      </Box>
    </motion.div>
  );
};

// Selector de Equipos Mejorado y User-Friendly
const EquipoSelectorImproved = ({ equipos, onSelect, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const filteredEquipos = equipos.filter(equipo => {
    const matchesSearch = equipo.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || equipo.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(equipos.map(e => e.categoria))];

  return (
    <Box>
      {/* Filtros */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        <TextField
          fullWidth variant="outlined" placeholder="Buscar equipo..."
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(255,255,255,0.5)' }} />
              </InputAdornment>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: 'white',
              '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
              '&:hover fieldset': { borderColor: 'rgba(76, 175, 80, 0.5)' },
              '&.Mui-focused fieldset': { borderColor: '#4caf50' }
            }
          }}
        />

        <FormControl fullWidth>
          <Select
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            displayEmpty
            sx={{
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(76, 175, 80, 0.5)' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4caf50' }
            }}
          >
            <MenuItem value="">Todas las categorías</MenuItem>
            {categories.map(cat => (
              <MenuItem key={cat} value={cat}>{getCategoryName(cat)}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Lista de equipos */}
      <Box sx={{ maxHeight: { xs: '300px', md: '400px' }, overflowY: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress sx={{ color: '#4caf50' }} />
          </Box>
        ) : filteredEquipos.length > 0 ? (
          <List>
            {filteredEquipos.map((equipo, index) => (
              <motion.div
                key={equipo._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ListItem
                  button
                  onClick={() => onSelect(equipo)}
                  sx={{
                    borderRadius: '12px',
                    mb: 1,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    '&:hover': {
                      backgroundColor: 'rgba(76, 175, 80, 0.1)',
                      transform: 'translateX(8px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'stretch', sm: 'center' }, 
                    width: '100%', 
                    gap: { xs: 1, sm: 2 },
                    p: 1
                  }}>
                    <Avatar 
                      src={getImageUrl(equipo.imagen)}
                      sx={{ 
                        width: { xs: 40, md: 50 }, 
                        height: { xs: 40, md: 50 },
                        border: '2px solid rgba(255,255,255,0.2)',
                        alignSelf: { xs: 'center', sm: 'flex-start' }
                      }}
                    >
                      <GroupsIcon />
                    </Avatar>
                    <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
                      <Typography variant="h6" sx={{ 
                        color: 'white', 
                        fontWeight: 'bold', 
                        mb: 0.5,
                        fontSize: { xs: '1rem', md: '1.25rem' }
                      }}>
                        {equipo.nombre}
                      </Typography>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                        <Chip
                          label={getCategoryName(equipo.categoria)}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(100,181,246,0.2)',
                            color: '#64b5f6',
                            border: '1px solid rgba(100,181,246,0.3)',
                            fontSize: { xs: '0.7rem', md: '0.75rem' }
                          }}
                        />
                        <Chip
                          label={`${equipo.jugadores?.length || 0} jugadores`}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(76,175,80,0.2)',
                            color: '#4caf50',
                            border: '1px solid rgba(76,175,80,0.3)',
                            fontSize: { xs: '0.7rem', md: '0.75rem' }
                          }}
                        />
                      </Stack>
                    </Box>
                    <PersonAddIcon sx={{ color: '#64b5f6', display: { xs: 'none', sm: 'block' } }} />
                  </Box>
                </ListItem>
              </motion.div>
            ))}
          </List>
        ) : (
          <Typography sx={{ 
            color: 'rgba(255,255,255,0.5)', 
            textAlign: 'center', 
            py: 4,
            fontSize: { xs: '0.9rem', md: '1rem' }
          }}>
            No se encontraron equipos con los filtros aplicados
          </Typography>
        )}

        {filteredEquipos.length === 0 && (
          <Box sx={{
            p: { xs: 3, md: 4 }, 
            textAlign: 'center',
            border: '2px dashed rgba(255,255,255,0.2)',
            borderRadius: 2
          }}>
            <GroupsIcon sx={{ fontSize: { xs: 40, md: 48 }, color: 'rgba(255,255,255,0.3)', mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'white', mb: 1, fontSize: { xs: '1rem', md: '1.25rem' } }}>
              No se encontraron equipos
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
              Intenta ajustar los filtros de búsqueda
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export const Home = () => {
  const { usuario, tieneTokenValido, getStoredToken, puedeInscribirseEquipo, refrescarUsuario, actualizarEquiposUsuario } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [equipos, setEquipos] = useState([]);
  const [equiposUsuario, setEquiposUsuario] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [numeroJugador, setNumeroJugador] = useState('');
  const [cargando, setCargando] = useState(false);
  const [expandidoEquipos, setExpandidoEquipos] = useState(true);
  const [loadingEquiposUsuario, setLoadingEquiposUsuario] = useState(false);
  const [loadingEquiposDisponibles, setLoadingEquiposDisponibles] = useState(false);

  // NUEVOS ESTADOS para torneos y estadísticas
  const [torneoSeleccionado, setTorneoSeleccionado] = useState(null);
  const [torneosDisponibles, setTorneosDisponibles] = useState([]);
  const [loadingTorneos, setLoadingTorneos] = useState(false);

  const tokenValido = tieneTokenValido();
  const storedToken = getStoredToken();

  // FUNCIÓN CORREGIDA - Cargar equipos del usuario usando equipos completos desde la API
  const obtenerEquiposUsuario = useCallback(async () => {
    console.log('\n🔍 === INICIO CARGA EQUIPOS USUARIO ===');
    console.log('👤 Usuario presente:', !!usuario);
    console.log('🔑 Token válido:', tokenValido);
    
    if (!usuario || !tokenValido) {
      console.log('❌ No hay usuario válido o token inválido, saliendo...');
      setEquiposUsuario([]);
      return;
    }

    if (!usuario.equipos || usuario.equipos.length === 0) {
      console.log('❌ Usuario sin equipos asignados');
      setEquiposUsuario([]);
      return;
    }

    setLoadingEquiposUsuario(true);
    
    try {
      console.log('🆔 IDs de equipos del usuario:', usuario.equipos.map(e => e.equipo));
      
      // CORREGIDO: Obtener todos los equipos y filtrar los del usuario
      const { data: todosLosEquipos } = await axiosInstance.get('/equipos');
      const equiposCompletos = todosLosEquipos || [];
      
      // Filtrar y mapear los equipos del usuario
      const equiposDelUsuario = usuario.equipos.map(equipoUsuario => {
        // Buscar el equipo completo por ID
        const equipoCompleto = equiposCompletos.find(equipo => 
          equipo._id === equipoUsuario.equipo || equipo._id === equipoUsuario.equipo?._id
        );
        
        if (equipoCompleto) {
          console.log(`✅ Equipo encontrado: ${equipoCompleto.nombre}`);
          return {
            ...equipoCompleto,
            numeroUsuario: equipoUsuario.numero // AGREGAR NÚMERO DEL USUARIO
          };
        } else {
          console.warn(`⚠️ Equipo no encontrado para ID: ${equipoUsuario.equipo}`);
          return null;
        }
      }).filter(Boolean); // Filtrar los null

      console.log('🏆 Equipos del usuario obtenidos:', equiposDelUsuario.length);
      setEquiposUsuario(equiposDelUsuario);
      
    } catch (error) {
      console.error('❌ Error al obtener equipos del usuario:', error);
      setEquiposUsuario([]);
    } finally {
      setLoadingEquiposUsuario(false);
    }
  }, [usuario, tokenValido]);

  // FUNCIÓN MEJORADA - Cargar equipos disponibles
  const obtenerEquiposDisponibles = useCallback(async () => {
    console.log('\n🔍 === INICIO CARGA EQUIPOS DISPONIBLES ===');
    
    if (!usuario || !tokenValido) {
      console.log('❌ Usuario no disponible o token inválido, saliendo...');
      setEquipos([]);
      return;
    }

    setLoadingEquiposDisponibles(true);
    
    try {
      const { data } = await axiosInstance.get('/equipos');
      console.log('📊 Total equipos de la API:', data.length);
      
      const equiposNoInscritos = data.filter(eq => {
        const usuarioYaInscrito = usuario.equipos?.some(equipoUsuario => {
          return equipoUsuario.equipo === eq._id || equipoUsuario.equipo?._id === eq._id;
        });
        return !usuarioYaInscrito;
      });

      console.log('📊 Equipos disponibles para inscripción:', equiposNoInscritos.length);
      setEquipos(equiposNoInscritos);
      
    } catch (error) {
      console.error('❌ Error al obtener equipos disponibles:', error);
      setEquipos([]);
    } finally {
      setLoadingEquiposDisponibles(false);
    }
  }, [usuario, tokenValido]);

  // NUEVA FUNCIÓN - Cargar torneos disponibles para estadísticas
  const cargarTorneosDisponibles = useCallback(async () => {
    if (!tokenValido) return;
    
    setLoadingTorneos(true);
    try {
      console.log('🔍 Cargando torneos disponibles para estadísticas...');
      const response = await axiosInstance.get('/estadisticas/torneos-categorias');
      
      const torneos = response.data.torneos || [];
      console.log('✅ Torneos disponibles:', torneos.length);
      
      setTorneosDisponibles(torneos);
      
      // Seleccionar automáticamente el torneo más reciente si no hay uno seleccionado
      if (torneos.length > 0 && !torneoSeleccionado) {
        const torneoMasReciente = torneos.sort((a, b) => 
          new Date(b.fechaUltimoPartido || b.createdAt) - new Date(a.fechaUltimoPartido || a.createdAt)
        )[0];
        setTorneoSeleccionado(torneoMasReciente._id);
        console.log('🎯 Torneo seleccionado automáticamente:', torneoMasReciente.nombre);
      }
      
    } catch (error) {
      console.error('❌ Error al cargar torneos:', error);
      setTorneosDisponibles([]);
    } finally {
      setLoadingTorneos(false);
    }
  }, [tokenValido, torneoSeleccionado]);

  useEffect(() => {
    obtenerEquiposUsuario();
    obtenerEquiposDisponibles();
    cargarTorneosDisponibles();
  }, [obtenerEquiposUsuario, obtenerEquiposDisponibles, cargarTorneosDisponibles]);

  const abrirModal = () => {
    if (puedeInscribirseEquipo()) {
      setAbierto(true);
      obtenerEquiposDisponibles();
    }
  };

  const cerrarModal = () => {
    setAbierto(false);
    setEquipoSeleccionado(null);
    setNumeroJugador('');
  };

  const seleccionarEquipo = (equipo) => {
    setEquipoSeleccionado(equipo);
  };

  const volverASeleccion = () => {
    setEquipoSeleccionado(null);
    setNumeroJugador('');
  };

  const manejarInscripcion = async () => {
    if (!equipoSeleccionado || !numeroJugador) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor completa todos los campos',
        background: '#1a1a1a',
        color: 'white',
      });
      return;
    }

    setCargando(true);
    
    try {
      // ✅ CORREGIDO: URL y estructura de datos
      const response = await axiosInstance.post('/equipos/registrarJugadores', {
        jugadores: [{
          usuarioId: usuario._id,
          equipoId: equipoSeleccionado._id,  // AGREGADO: equipoId
          numero: parseInt(numeroJugador)
        }]
      });

      Swal.fire({
        icon: 'success',
        title: '¡Inscripción exitosa!',
        text: `Te has inscrito al equipo ${equipoSeleccionado.nombre} con el número ${numeroJugador}`,
        background: '#1a1a1a',
        color: 'white',
      });

      // Actualizar equipos y cerrar modal
      actualizarEquiposUsuario();
      obtenerEquiposUsuario();
      obtenerEquiposDisponibles();
      cerrarModal();

    } catch (error) {
      console.error('❌ Error en inscripción:', error);
      
      const errorMessage = error.response?.data?.mensaje || 
                          error.message || 
                          'Error desconocido al inscribirse';
      
      Swal.fire({
        icon: 'error',
        title: 'Error en la inscripción',
        text: errorMessage,
        background: '#1a1a1a',
        color: 'white',
      });
    } finally {
      setCargando(false);
    }
  };

  // Configuración de animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        duration: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  // Estilos compartidos
  const cardStyle = {
    background: 'linear-gradient(145deg, rgba(30,30,60,0.95), rgba(50,50,80,0.95))',
    backdropFilter: 'blur(15px)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 3,
    overflow: 'hidden'
  };

  const headerStyle = {
    p: { xs: 2, md: 2 },
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.02)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.3s ease'
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 25%, #16213e 50%, #1a1a2e 75%, #0a0a0a 100%)',
        padding: { xs: '10px', md: '20px' }
      }}
    >
      {usuario ? (
        <motion.div variants={containerVariants}>
          {/* Header principal con información del usuario */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 }, mb: { xs: 3, md: 4 } }}>
            
            {/* FILA 1: Perfil del usuario y Tarjeta épica de agregar - GRID PARA MISMO TAMAÑO */}
            <Box sx={{ 
              display: 'grid',
              p: { xs: 2, md: 3 },
              gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
              gap: { xs: 2, md: 3 },
              alignItems: 'stretch'
            }}>
              
              {/* Tarjeta de perfil del usuario */}
              <motion.div variants={itemVariants}>
                <Card sx={{ ...cardStyle, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ p: { xs: 2, md: 3 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'center', sm: 'center' }, 
                      gap: { xs: 2, md: 3 }, 
                      mb: { xs: 2, md: 3 },
                      textAlign: { xs: 'center', sm: 'left' }
                    }}>
                      <UserProfileAvatar usuario={usuario} size={isMobile ? 80 : 100} />
                      
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h4" sx={{ 
                          color: 'white', 
                          fontWeight: 'bold', 
                          mb: 1,
                          background: 'linear-gradient(45deg, #64b5f6, #42a5f5)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          fontSize: { xs: '1.5rem', md: '2.125rem' }
                        }}>
                          ¡Bienvenido, {usuario.nombre}! 👋
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          color: 'rgba(255,255,255,0.8)', 
                          mb: { xs: 1, md: 2 },
                          fontSize: { xs: '1rem', md: '1.25rem' }
                        }}>
                          {getCategoryName(usuario.rol) || usuario.rol}
                        </Typography>
                      </Box>

                      <Button
                        component={NavLink}
                        to="/perfil"
                        variant="outlined"
                        startIcon={<SettingsIcon />}
                        size={isMobile ? "small" : "medium"}
                        sx={{
                          borderColor: 'rgba(100,181,246,0.5)',
                          color: '#64b5f6',
                          fontSize: { xs: '0.8rem', md: '0.875rem' },
                          px: { xs: 2, md: 3 },
                          '&:hover': {
                            borderColor: '#64b5f6',
                            backgroundColor: 'rgba(100,181,246,0.1)',
                            color: 'white'
                          }
                        }}
                      >
                        {isMobile ? 'Perfil' : 'Configurar Perfil'}
                      </Button>

                      {/* Partículas animadas de fondo */}
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          style={{
                            position: 'absolute',
                            width: '4px',
                            height: '4px',
                            backgroundColor: '#64b5f6',
                            borderRadius: '50%',
                            top: `${15 + (i * 12)}%`,
                            left: `${10 + (i * 10)}%`,
                          }}
                          animate={{
                            y: [0, -15, 0],
                            opacity: [0.3, 0.8, 0.3],
                            scale: [1, 1.3, 1]
                          }}
                          transition={{
                            duration: 2.5 + (i * 0.3),
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.2
                          }}
                        />
                      ))}
                    </Box>

                    <Divider sx={{ mb: { xs: 2, md: 3 }, borderColor: 'rgba(255,255,255,0.1)' }} />

                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: { xs: 'column', md: 'row' },
                      gap: { xs: 2, md: 3 },
                      mt: 'auto'
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        p: { xs: 1, md: 1.5 }, 
                        borderRadius: 2, 
                        bgcolor: 'rgba(255,255,255,0.03)' 
                      }}>
                        <BadgeIcon sx={{ mr: 2, color: '#64b5f6', fontSize: { xs: 20, md: 24 } }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}>
                            CURP
                          </Typography>
                          <Typography variant="body1" sx={{ 
                            fontWeight: 'medium',
                            fontSize: { xs: '0.9rem', md: '1rem' }
                          }}>
                            {usuario.documento}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Tarjeta Épica de Agregar Equipo */}
              <motion.div variants={itemVariants}>
                <Card
                  onClick={puedeInscribirseEquipo() ? abrirModal : undefined}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: puedeInscribirseEquipo() ? 'pointer' : 'default',
                    background: 'linear-gradient(145deg, rgba(100,181,246,0.15), rgba(100,181,246,0.08))',
                    backdropFilter: 'blur(10px)',
                    border: '2px dashed rgba(100,181,246,0.4)',
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.4s ease',
                    opacity: puedeInscribirseEquipo() ? 1 : 0.6,
                    '&:hover': puedeInscribirseEquipo() ? {
                      border: '2px dashed rgba(100,181,246,0.7)',
                      background: 'linear-gradient(145deg, rgba(100,181,246,0.25), rgba(100,181,246,0.15))',
                      transform: { xs: 'none', md: 'translateY(-8px) scale(1.02)' },
                      boxShadow: '0 20px 40px rgba(100,181,246,0.2)'
                    } : {},
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0, left: '-100%',
                      width: '100%', height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                      transition: 'left 0.5s ease',
                    },
                    '&:hover::before': puedeInscribirseEquipo() ? { left: '100%' } : {}
                  }}
                >
                  <CardContent sx={{ 
                    p: { xs: 3, md: 4 }, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    textAlign: 'center',
                    height: '100%',
                    flex: 1
                  }}>
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Avatar sx={{
                        width: { xs: 60, md: 80 }, 
                        height: { xs: 60, md: 80 }, 
                        mb: { xs: 2, md: 3 },
                        background: 'linear-gradient(45deg, rgba(100,181,246,0.8), rgba(100,181,246,0.4))',
                        boxShadow: '0 8px 32px rgba(100,181,246,0.3)'
                      }}>
                        <PersonAddIcon sx={{ fontSize: { xs: 30, md: 40 }, color: 'white' }} />
                      </Avatar>
                    </motion.div>
                    
                    <Typography variant="h5" sx={{ 
                      color: 'white', 
                      fontWeight: 'bold', 
                      mb: { xs: 1, md: 2 },
                      textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      fontSize: { xs: '1.1rem', md: '1.5rem' }
                    }}>
                      {puedeInscribirseEquipo() 
                       ? '🏈 ¡Únete a un Equipo!' 
                       : '🔒 Inscripciones Limitadas'
                     }
                   </Typography>
                   
                   <Typography variant="body1" sx={{ 
                     color: 'rgba(255,255,255,0.8)', 
                     mb: { xs: 2, md: 3 },
                     maxWidth: '280px',
                     fontSize: { xs: '0.9rem', md: '1rem' },
                     flex: 1,
                     display: 'flex',
                     alignItems: 'center'
                   }}>
                     {puedeInscribirseEquipo() 
                       ? 'Explora equipos disponibles y comienza tu aventura en el flag football'
                       : 'Contacta al administrador para más información sobre inscripciones'
                     }
                   </Typography>

                   {puedeInscribirseEquipo() && (
                     <Chip
                       label="Click para empezar"
                       sx={{
                         backgroundColor: 'rgba(255,255,255,0.2)',
                         color: 'white',
                         fontWeight: 'bold',
                         fontSize: { xs: '0.8rem', md: '0.875rem' },
                         '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
                       }}
                     />
                   )}
                 </CardContent>
               </Card>
             </motion.div>
           </Box>

           {/* FILA 2: Mis Equipos con TeamCard Compactas */}
           <Box sx={{ width: '100%' }}>
             <motion.div variants={itemVariants}>
               <Card sx={cardStyle}>
                 <Box 
                   sx={{
                     ...headerStyle,
                     cursor: 'pointer',
                     '&:hover': {
                       backgroundColor: 'rgba(255, 255, 255, 0.05)'
                     }
                   }}
                   onClick={() => setExpandidoEquipos(!expandidoEquipos)}
                 >
                   <Box sx={{ display: 'flex', alignItems: 'center' }}>
                     <EmojiEventsIcon sx={{ mr: 1, color: '#ffd700', fontSize: { xs: 20, md: 24 } }} />
                     <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                       Mis Equipos
                     </Typography>
                   </Box>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                     {loadingEquiposUsuario && <CircularProgress size={16} />}
                     <Chip 
                       label={loadingEquiposUsuario 
                         ? 'Cargando...' 
                         : `${equiposUsuario.length} ${equiposUsuario.length === 1 ? 'equipo' : 'equipos'}`
                       } 
                       color={loadingEquiposUsuario ? "default" : "secondary"}
                       variant="outlined" 
                       size="small" 
                       sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                     />
                     {expandidoEquipos ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                   </Box>
                 </Box>
                 
                 <Collapse in={expandidoEquipos} timeout="auto" unmountOnExit>
                   <CardContent sx={{ p: { xs: 2, md: 3 }, pt: 1 }}>
                     {loadingEquiposUsuario ? (
                       <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                         <CircularProgress size={60} sx={{ color: '#64b5f6' }} />
                       </Box>
                     ) : equiposUsuario.length === 0 ? (
                       <motion.div
                         initial={{ scale: 0.8, opacity: 0 }}
                         animate={{ scale: 1, opacity: 1 }}
                         transition={{ duration: 0.6 }}
                       >
                         <Paper sx={{
                           p: { xs: 4, md: 6 }, 
                           textAlign: 'center',
                           background: 'linear-gradient(145deg, rgba(30,30,60,0.9), rgba(50,50,80,0.9))',
                           border: '2px dashed rgba(255,255,255,0.2)',
                           borderRadius: 4
                         }}>
                           <motion.div
                             animate={{ 
                               y: [0, -10, 0],
                               rotate: [0, 5, -5, 0]
                             }}
                             transition={{ 
                               duration: 3,
                               repeat: Infinity,
                               ease: "easeInOut"
                             }}
                           >
                             <SportsIcon sx={{ 
                               fontSize: { xs: 60, md: 80 }, 
                               color: 'rgba(255,255,255,0.3)', 
                               mb: { xs: 2, md: 3 } 
                             }} />
                           </motion.div>
                           
                           <Typography variant="h5" sx={{ 
                             color: 'white', 
                             fontWeight: 'bold', 
                             mb: { xs: 1, md: 2 },
                             fontSize: { xs: '1.1rem', md: '1.5rem' }
                           }}>
                             ¡Aún no tienes equipos!
                           </Typography>
                           
                           <Typography variant="body1" sx={{ 
                             color: 'rgba(255,255,255,0.7)', 
                             mb: { xs: 3, md: 4 },
                             fontSize: { xs: '0.9rem', md: '1rem' }
                           }}>
                             Utiliza la tarjeta de arriba para inscribirte en un equipo
                           </Typography>
                         </Paper>
                       </motion.div>
                     ) : (
                       // CAMBIO DE GRID A FLEXBOX PARA 1/4 DEL ANCHO
                       <motion.div
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         transition={{ duration: 0.6 }}
                       >
                         <Box sx={{
                           display: 'flex',
                           flexWrap: 'wrap',
                           gap: { xs: 2, md: 3 },
                           justifyContent: equiposUsuario.length < 4 ? 'flex-start' : 'space-between'
                         }}>
                           {equiposUsuario.map((equipo, index) => (
                             <motion.div
                               key={equipo._id}
                               initial={{ opacity: 0, scale: 0.8, y: 30 }}
                               animate={{ opacity: 1, scale: 1, y: 0 }}
                               transition={{ 
                                 duration: 0.6, 
                                 delay: index * 0.15,
                                 type: "spring",
                                 stiffness: 120
                               }}
                               style={{
                                 width: isMobile ? '100%' : 'calc(25% - 12px)', // 1/4 del ancho menos gap
                                 minWidth: isMobile ? 'auto' : '280px', // Ancho mínimo
                                 maxWidth: '100%'
                               }}
                             >
                               <TeamCard 
                                 equipo={equipo} 
                                 usuario={{
                                   ...usuario,
                                   numeroJugador: equipo.numeroUsuario
                                 }}
                                 torneoId={torneoSeleccionado} // Pasar torneoId
                               />
                             </motion.div>
                           ))}
                         </Box>
                       </motion.div>
                     )}

                     {/* SELECTOR DE TORNEO PARA LAS ESTADÍSTICAS */}
                     <Box sx={{ mt: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 }, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                       <Stack 
                         direction={{ xs: 'column', sm: 'row' }} 
                         spacing={2} 
                         alignItems={{ xs: 'stretch', sm: 'center' }} 
                         sx={{ mb: 2 }}
                       >
                         <Typography variant="body2" sx={{ 
                           color: 'rgba(255,255,255,0.7)',
                           fontSize: { xs: '0.8rem', md: '0.875rem' }
                         }}>
                           Ver estadísticas del torneo:
                         </Typography>
                         
                         <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
                           <Select
                             value={torneoSeleccionado || ''}
                             onChange={(e) => setTorneoSeleccionado(e.target.value)}
                             displayEmpty
                             disabled={loadingTorneos}
                             sx={{
                               color: 'white',
                               fontSize: { xs: '0.8rem', md: '0.875rem' },
                               '& .MuiOutlinedInput-notchedOutline': {
                                 borderColor: 'rgba(255,255,255,0.3)'
                               },
                               '&:hover .MuiOutlinedInput-notchedOutline': {
                                 borderColor: 'rgba(76, 175, 80, 0.5)'
                               },
                               '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                 borderColor: '#4caf50'
                               }
                             }}
                           >
                             <MenuItem value="" disabled>
                               <em>{loadingTorneos ? 'Cargando torneos...' : 'Selecciona un torneo'}</em>
                             </MenuItem>
                             {torneosDisponibles.map((torneo) => (
                               <MenuItem key={torneo._id} value={torneo._id}>
                                 {torneo.nombre} ({torneo.totalPartidos || 0} partidos)
                               </MenuItem>
                             ))}
                           </Select>
                         </FormControl>

                         {torneoSeleccionado && (
                           <Tooltip title="Actualizar estadísticas">
                             <IconButton
                               onClick={() => {
                                 // Forzar recarga de estadísticas
                                 obtenerEquiposUsuario();
                                 cargarTorneosDisponibles();
                               }}
                               sx={{ 
                                 color: '#4caf50',
                                 '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.1)' }
                               }}
                               size={isMobile ? "small" : "medium"}
                             >
                               <RefreshIcon />
                             </IconButton>
                           </Tooltip>
                         )}
                       </Stack>

                       {!torneoSeleccionado && !loadingTorneos && (
                         <Alert severity="info" sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                           Selecciona un torneo para ver las estadísticas reales de tus equipos
                         </Alert>
                       )}

                       {torneoSeleccionado && (
                         <Alert severity="success" sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                           📊 Mostrando estadísticas del torneo: {torneosDisponibles.find(t => t._id === torneoSeleccionado)?.nombre}
                         </Alert>
                       )}
                     </Box>
                   </CardContent>
                 </Collapse>
               </Card>
             </motion.div>
           </Box>
         </Box>
       </motion.div>
     ) : (
       <motion.div variants={itemVariants}>
         <Paper sx={{ 
           p: { xs: 3, md: 4 }, 
           bgcolor: 'rgba(0, 0, 0, 0.7)', 
           backdropFilter: 'blur(10px)',
           borderRadius: 3,
           border: '1px solid rgba(255, 255, 255, 0.1)'
         }}>
           <Typography color="error" sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>
             No hay información de usuario disponible.
           </Typography>
           <Button 
             variant="contained" 
             color="primary" 
             sx={{ 
               mt: 2,
               background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
               boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
               fontSize: { xs: '0.8rem', md: '0.875rem' }
             }}
           >
             Volver a iniciar sesión
           </Button>
         </Paper>
       </motion.div>
     )}

     {/* Modal de inscripción mejorado */}
     <Dialog 
       open={abierto} 
       onClose={cerrarModal} 
       fullWidth 
       maxWidth="md"
       PaperProps={{
         sx: {
           background: 'linear-gradient(145deg, rgba(30,30,60,0.98), rgba(50,50,80,0.98))',
           backdropFilter: 'blur(20px)',
           border: '1px solid rgba(255,255,255,0.2)',
           borderRadius: 3,
           m: { xs: 1, md: 2 }
         }
       }}
     >
       <DialogTitle sx={{ 
         color: 'white', 
         borderBottom: '1px solid rgba(255,255,255,0.1)',
         display: 'flex',
         flexDirection: { xs: 'column', sm: 'row' },
         alignItems: { xs: 'flex-start', sm: 'center' },
         gap: 2,
         p: { xs: 2, md: 3 }
       }}>
         <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
           <PersonAddIcon sx={{ color: '#64b5f6', fontSize: { xs: 20, md: 24 } }} />
           <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
             {equipoSeleccionado ? 
               `Inscribirse en ${equipoSeleccionado.nombre}` : 
               'Seleccionar Equipo'
             }
           </Typography>
         </Box>
         <IconButton 
           onClick={cerrarModal}
           sx={{ 
             ml: { xs: 0, sm: 'auto' }, 
             alignSelf: { xs: 'flex-end', sm: 'center' },
             color: 'rgba(255,255,255,0.7)' 
           }}
           size={isMobile ? "small" : "medium"}
         >
           <CloseIcon />
         </IconButton>
       </DialogTitle>

       <DialogContent sx={{ p: { xs: 2, md: 3 } }}>
         {equipoSeleccionado ? (
           <Box>
             <Typography variant="h6" sx={{ 
               color: 'white', 
               mb: { xs: 2, md: 3 },
               fontSize: { xs: '1rem', md: '1.25rem' }
             }}>
               Número de jugador para {equipoSeleccionado.nombre}:
             </Typography>
             
             <TextField
               fullWidth
               label="Número de jugador (1-99)"
               type="number"
               value={numeroJugador}
               onChange={(e) => setNumeroJugador(e.target.value)}
               InputProps={{
                 inputProps: { min: 1, max: 99 }
               }}
               sx={{
                 mb: { xs: 2, md: 3 },
                 '& .MuiOutlinedInput-root': {
                   color: 'white',
                   '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                   '&:hover fieldset': { borderColor: 'rgba(76, 175, 80, 0.5)' },
                   '&.Mui-focused fieldset': { borderColor: '#4caf50' }
                 },
                 '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }
               }}
             />

             <Box sx={{ 
               p: { xs: 1.5, md: 2 }, 
               borderRadius: 2, 
               background: 'rgba(100,181,246,0.1)',
               border: '1px solid rgba(100,181,246,0.3)'
             }}>
               <Typography variant="body2" sx={{ 
                 color: 'rgba(255,255,255,0.8)',
                 fontSize: { xs: '0.8rem', md: '0.875rem' }
               }}>
                 📝 <strong>Importante:</strong> El número debe estar disponible y será único para este equipo.
               </Typography>
             </Box>
           </Box>
         ) : (
           <EquipoSelectorImproved
             equipos={equipos}
             onSelect={seleccionarEquipo}
             loading={loadingEquiposDisponibles}
           />
         )}
       </DialogContent>

       <DialogActions sx={{ p: { xs: 2, md: 3 }, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
         <Button
           onClick={equipoSeleccionado ? volverASeleccion : cerrarModal}
           sx={{ 
             color: 'rgba(255,255,255,0.7)',
             fontSize: { xs: '0.8rem', md: '0.875rem' }
           }}
         >
           {equipoSeleccionado ? 'Volver' : 'Cancelar'}
         </Button>
         
         {equipoSeleccionado && (
           <Button
             variant="contained"
             onClick={manejarInscripcion}
             disabled={cargando || !numeroJugador}
             startIcon={cargando ? <CircularProgress size={20} /> : <PersonAddIcon />}
             sx={{
               backgroundColor: '#64b5f6',
               '&:hover': { backgroundColor: '#42a5f5' },
               borderRadius: 2,
               px: { xs: 2, md: 3 },
               fontSize: { xs: '0.8rem', md: '0.875rem' }
             }}
           >
             {cargando ? 'Inscribiendo...' : 'Confirmar Inscripción'}
           </Button>
         )}
       </DialogActions>
     </Dialog>
   </motion.div>
 );
};