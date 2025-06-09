import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Box, Typography, Paper, Grid, Chip, Avatar, Card, CardContent, 
  Divider, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Stack, Collapse, IconButton, List, ListItem,
  Badge, InputAdornment, FormControl, InputLabel, Select, MenuItem
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
import axiosInstance from '../config/axios';
import { getCategoryName } from '../helpers/mappings';
import { useImage } from '../hooks/useImage';
import TeamCard from './TeamCard';

// 🔥 FUNCIÓN HELPER UNIFICADA para URLs de imágenes
const getImageUrl = (imagen) => {
  if (!imagen) return '';
  if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
    return imagen;
  }
  return `${import.meta.env.VITE_BACKEND_URL || ''}/uploads/${imagen}`;
};

// 🎨 Avatar del Usuario con Rol Overlapped
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
                fontSize: '0.7rem', height: '20px',
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

// 🏈 Nota: Usamos el TeamCard importado que está súper épico

// 🎯 Selector de Equipos Mejorado y User-Friendly
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
              backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2,
              color: 'white',
              '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
              '&:hover fieldset': { borderColor: 'rgba(100,181,246,0.5)' },
              '&.Mui-focused fieldset': { borderColor: '#64b5f6' }
            },
            '& .MuiInputBase-input::placeholder': { 
              color: 'rgba(255,255,255,0.7)', opacity: 1 
            }
          }}
        />
        
        <FormControl fullWidth>
          <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Filtrar por categoría</InputLabel>
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            label="Filtrar por categoría"
            sx={{
              backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2,
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': { 
                borderColor: 'rgba(255,255,255,0.3)' 
              },
              '&:hover .MuiOutlinedInput-notchedOutline': { 
                borderColor: 'rgba(100,181,246,0.5)' 
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { 
                borderColor: '#64b5f6' 
              }
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
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{
          maxHeight: 400, overflow: 'auto',
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '4px'
          }
        }}>
          <AnimatePresence>
            {filteredEquipos.map((equipo, index) => (
              <motion.div
                key={equipo._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  onClick={() => onSelect(equipo)}
                  sx={{
                    mb: 2,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 2, cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(100,181,246,0.1)',
                      border: '1px solid rgba(100,181,246,0.3)',
                      transform: 'translateX(10px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        src={getImageUrl(equipo.imagen)}
                        sx={{
                          width: 50, height: 50,
                          border: '2px solid rgba(255,255,255,0.2)'
                        }}
                      >
                        <GroupsIcon />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ 
                          color: 'white', fontWeight: 'bold', mb: 0.5
                        }}>
                          {equipo.nombre}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Chip
                            label={getCategoryName(equipo.categoria)}
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(100,181,246,0.2)',
                              color: '#64b5f6',
                              border: '1px solid rgba(100,181,246,0.3)'
                            }}
                          />
                          <Chip
                            label={`${equipo.jugadores?.length || 0} jugadores`}
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(76,175,80,0.2)',
                              color: '#4caf50',
                              border: '1px solid rgba(76,175,80,0.3)'
                            }}
                          />
                        </Stack>
                      </Box>
                      <PersonAddIcon sx={{ color: '#64b5f6' }} />
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredEquipos.length === 0 && (
            <Box sx={{
              p: 4, textAlign: 'center',
              border: '2px dashed rgba(255,255,255,0.2)',
              borderRadius: 2
            }}>
              <GroupsIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)', mb: 2 }} />
              <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                No se encontraron equipos
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Intenta ajustar los filtros de búsqueda
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export const Home = () => {
  const { usuario, tieneTokenValido, getStoredToken, puedeInscribirseEquipo, refrescarUsuario } = useAuth();

  const [equipos, setEquipos] = useState([]);
  const [equiposUsuario, setEquiposUsuario] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [numeroJugador, setNumeroJugador] = useState('');
  const [cargando, setCargando] = useState(false);
  const [expandidoEquipos, setExpandidoEquipos] = useState(true);
  const [loadingEquiposUsuario, setLoadingEquiposUsuario] = useState(false);
  const [loadingEquiposDisponibles, setLoadingEquiposDisponibles] = useState(false);

  const tokenValido = tieneTokenValido();
  const storedToken = getStoredToken();

  // 🔥 FUNCIÓN CORREGIDA - Cargar equipos del usuario usando equipos completos desde la API
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
      
      // 🔥 CORREGIDO: Obtener todos los equipos y filtrar los del usuario
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
            numeroUsuario: equipoUsuario.numero
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

  // 🔥 FUNCIÓN MEJORADA - Cargar equipos disponibles
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

  // 🔥 EFECTOS MEJORADOS
  useEffect(() => {
    if (usuario && tokenValido) {
      obtenerEquiposUsuario();
    }
  }, [obtenerEquiposUsuario]);

  useEffect(() => {
    if (usuario && tokenValido) {
      obtenerEquiposDisponibles();
    }
  }, [obtenerEquiposDisponibles]);

  const abrirModal = () => {
    setAbierto(true);
  };

  const cerrarModal = () => {
    setAbierto(false);
    setEquipoSeleccionado(null);
    setNumeroJugador('');
  };

  const handleSelectEquipo = (equipo) => {
    setEquipoSeleccionado(equipo);
  };

  // 🔥 FUNCIÓN DE INSCRIPCIÓN CORREGIDA
  const manejarInscripcion = async () => {
    if (!equipoSeleccionado || !numeroJugador) {
      Swal.fire({
        icon: 'warning',
        title: 'Datos incompletos',
        text: 'Selecciona un equipo y asigna un número de camiseta'
      });
      return;
    }

    setCargando(true);
    
    try {
      const datosInscripcion = {
        equipoId: equipoSeleccionado._id,
        numero: numeroJugador,
        usuarioId: usuario.id || usuario._id
      };

      console.log('🚀 Enviando inscripción:', datosInscripcion);

      await axiosInstance.patch('/usuarios/equipo/', datosInscripcion);
      
      console.log('✅ Inscripción exitosa, cerrando modal...');
      
      // Cerrar modal ANTES del SweetAlert de éxito
      cerrarModal();
      setCargando(false);

      Swal.fire({
        icon: 'success',
        title: '¡Inscripción exitosa!',
        text: `Te has inscrito en ${equipoSeleccionado.nombre}`,
        showConfirmButton: false,
        timer: 2000
      });

      // Refrescar datos
      console.log('🔄 Refrescando datos del usuario...');
      const refreshExitoso = await refrescarUsuario();
      
      if (refreshExitoso) {
        console.log('✅ Usuario refrescado, recargando listas...');
        
        // Cargar equipos directamente
        await Promise.all([
          obtenerEquiposUsuario(),
          obtenerEquiposDisponibles()
        ]);
        
        console.log('✅ Listas actualizadas correctamente');
      } else {
        console.log('⚠️ Error refrescando usuario, recargando página...');
        window.location.reload();
      }
      
    } catch (error) {
      console.error('❌ Error en inscripción:', error);
      
      // Cerrar modal ANTES de mostrar error
      cerrarModal();
      setCargando(false);
      
      // Pequeño delay para asegurar que el modal se cierre
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Mejor manejo de errores
      let mensaje = 'Error al inscribirse en el equipo';
      
      if (error.response?.data?.mensaje) {
        mensaje = error.response.data.mensaje;
      } else if (error.response?.data?.errores) {
        mensaje = error.response.data.errores[0] || mensaje;
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Error en la inscripción',
        text: mensaje,
        confirmButtonText: 'Entendido'
      });
    }
  };

  // Estilos consistentes para las tarjetas
  const cardStyle = {
    backdropFilter: 'blur(10px)', 
    backgroundColor: 'rgba(0, 0, 0, 0.7)', 
    borderRadius: 3,
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 12px 20px rgba(0, 0, 0, 0.2)'
    }
  };

  const headerStyle = {
    p: 2, 
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'white', 
    display: 'flex', 
    alignItems: 'center',
    justifyContent: 'space-between'
  };

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
      {/* 🔥 ALERTA MEJORADA: Solo si hay problemas con el token */}
      {usuario && !tokenValido && (
        <Box sx={{ mb: 2 }}>
          <Paper sx={{ 
            p: 2, 
            bgcolor: 'rgba(255, 193, 7, 0.1)', 
            border: '1px solid rgba(255, 193, 7, 0.3)',
            borderRadius: 2
          }}>
            <Typography variant="body2" sx={{ color: '#ffa726' }}>
              ⚠️ <strong>Problema de autenticación detectado:</strong> 
              {!storedToken && ' No hay token guardado.'} 
              {storedToken && !tokenValido && ' Token inválido o expirado.'} 
              {' '}
              <Button 
                size="small" 
                onClick={() => window.location.reload()}
                sx={{ ml: 1, color: '#ffa726' }}
              >
                Recargar página
              </Button>
            </Typography>
          </Paper>
        </Box>
      )}

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ 
            color: 'white',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            mb: 5,
            fontWeight: 'bold',
            borderLeft: '4px solid #3f51b5',
            pl: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            Dashboard
            <Chip 
              label={usuario?.nombre ? `Bienvenido, ${usuario.nombre.split(' ')[0]}` : 'Bienvenido'} 
              color="primary" 
              size="small" 
              sx={{ ml: 2, fontWeight: 'medium' }}
            />
          </Typography>
        </motion.div>

        {usuario ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* FILA 1: Perfil + Tarjeta Épica de Agregar Equipo */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' }, 
              gap: 4 
            }}>
              {/* Tarjeta de Perfil con Avatar Mejorado */}
              <Box sx={{ flex: 1 }}>
                <motion.div variants={itemVariants}>
                  <Card sx={cardStyle}>
                    <Box sx={headerStyle}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccountCircleIcon sx={{ mr: 1, color: '#64b5f6' }} />
                        <Typography variant="h6">Perfil de Usuario</Typography>
                      </Box>
                      <Chip 
                        icon={<VerifiedUserIcon />} 
                        label={tokenValido ? "Verificado" : "Sin autenticación"} 
                        color={tokenValido ? "success" : "warning"}
                        variant="outlined" 
                        size="small" 
                      />
                    </Box>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 3,
                        p: 2,
                        borderRadius: 2,
                        background: 'linear-gradient(145deg, rgba(25,118,210,0.1) 0%, rgba(25,118,210,0.05) 100%)'
                      }}>
                        <UserProfileAvatar usuario={usuario} size={80} />
                        <Box sx={{ ml: 3 }}>
                          <Typography variant="h5" gutterBottom sx={{ color: 'white', fontWeight: 'medium' }}>
                            {usuario.nombre || usuario.email}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            {usuario.rol === 'admin' && '👑 Administrador'}
                            {usuario.rol === 'capitan' && '⚽ Capitán'}
                            {usuario.rol === 'jugador' && '🏃‍♂️ Jugador'}
                            {usuario.rol === 'arbitro' && '👨‍⚖️ Árbitro'}
                          </Typography>
                        </Box>
                      </Box>

                      <Divider sx={{ my: 3, opacity: 0.2 }} />

                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: 2
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)' }}>
                          <EmailIcon sx={{ mr: 2, color: '#64b5f6' }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary">Email</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{usuario.email}</Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)' }}>
                          <BadgeIcon sx={{ mr: 2, color: '#64b5f6' }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary">CURP</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{usuario.documento}</Typography>
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Box>

              {/* Tarjeta Épica de Agregar Equipo (movida desde la sección de equipos) */}
              <Box sx={{ flex: 1 }}>
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
                        transform: 'translateY(-8px) scale(1.02)',
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
                      '&:hover::before': puedeInscribirseEquipo() ? {
                        left: '100%'
                      } : {}
                    }}
                  >
                    <CardContent sx={{ 
                      flex: 1,
                      display: 'flex',
                     flexDirection: 'column',
                     alignItems: 'center',
                     justifyContent: 'center',
                     p: 4,
                     position: 'relative',
                     zIndex: 1
                   }}>
                     <motion.div
                       animate={{ 
                         scale: [1, 1.1, 1],
                         rotate: [0, 5, -5, 0]
                       }}
                       transition={{ 
                         duration: 2,
                         repeat: Infinity,
                         ease: "easeInOut"
                       }}
                     >
                       <Box sx={{
                         backgroundColor: 'rgba(100,181,246,0.2)',
                         borderRadius: '50%',
                         width: 80, height: 80,
                         display: 'flex', alignItems: 'center', justifyContent: 'center',
                         mb: 3, mx: 'auto',
                         boxShadow: '0 8px 20px rgba(100,181,246,0.3)',
                         border: '3px solid rgba(100,181,246,0.4)'
                       }}>
                         <PersonAddIcon sx={{ 
                           fontSize: 40, 
                           color: '#64b5f6',
                           filter: 'drop-shadow(0 4px 8px rgba(100,181,246,0.5))'
                         }} />
                       </Box>
                     </motion.div>
                     
                     <Typography variant="h4" sx={{ 
                       color: '#64b5f6', 
                       fontWeight: 'bold',
                       mb: 2,
                       textAlign: 'center',
                       textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                     }}>
                       {puedeInscribirseEquipo() ? '¡Únete a un Equipo!' : 'Inscripción no disponible'}
                     </Typography>
                     
                     <Typography variant="body1" sx={{ 
                       color: 'rgba(255,255,255,0.8)',
                       mb: 3,
                       textAlign: 'center',
                       fontSize: '1.1rem'
                     }}>
                       {puedeInscribirseEquipo() 
                         ? 'Inscríbete en un equipo y comienza tu aventura deportiva' 
                         : 'Solo jugadores y capitanes pueden inscribirse en equipos'}
                     </Typography>

                     <Box sx={{
                       backgroundColor: 'rgba(0,0,0,0.3)',
                       borderRadius: 2, p: 2, mb: 3,
                       border: '1px solid rgba(100,181,246,0.3)',
                       backdropFilter: 'blur(5px)',
                       width: '100%'
                     }}>
                       <Stack direction="row" spacing={3} justifyContent="center">
                         <Box sx={{ textAlign: 'center' }}>
                           <Typography variant="h5" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                             {loadingEquiposDisponibles ? '...' : equipos.length}
                           </Typography>
                           <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                             Equipos Disponibles
                           </Typography>
                         </Box>
                         <Box sx={{ textAlign: 'center' }}>
                           <Typography variant="h5" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                             {loadingEquiposUsuario ? '...' : equiposUsuario.length}
                           </Typography>
                           <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                             Mis Equipos
                           </Typography>
                         </Box>
                       </Stack>
                     </Box>

                     {/* Botón de Configurar Perfil */}
                     <Button 
                       variant="outlined" 
                       fullWidth 
                       component={NavLink}
                       to="/perfil"
                       startIcon={<SettingsIcon />}
                       onClick={(e) => e.stopPropagation()} // Evitar que se active el modal
                       sx={{
                         py: 1.5,
                         borderRadius: 2,
                         borderWidth: 2,
                         borderColor: 'rgba(255,255,255,0.3)',
                         color: 'rgba(255,255,255,0.8)',
                         '&:hover': {
                           borderWidth: 2,
                           backgroundColor: 'rgba(255,255,255,0.1)',
                           borderColor: 'rgba(255,255,255,0.5)',
                           color: 'white'
                         }
                       }}
                     >
                       Configurar Perfil
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
                   </CardContent>
                 </Card>
               </motion.div>
             </Box>
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
                     <EmojiEventsIcon sx={{ mr: 1, color: '#ffd700' }} />
                     <Typography variant="h6">Mis Equipos</Typography>
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
                     />
                     {expandidoEquipos ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                   </Box>
                 </Box>
                 
                 <Collapse in={expandidoEquipos} timeout="auto" unmountOnExit>
                   <CardContent sx={{ p: 3, pt: 1 }}>
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
                           p: 6, textAlign: 'center',
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
                             <SportsIcon sx={{ fontSize: 80, color: 'rgba(255,255,255,0.3)', mb: 3 }} />
                           </motion.div>
                           
                           <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
                             ¡Aún no tienes equipos!
                           </Typography>
                           
                           <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 4 }}>
                             Utiliza la tarjeta de arriba para inscribirte en un equipo
                           </Typography>
                         </Paper>
                       </motion.div>
                     ) : (
                       <Grid container spacing={2}>
                         <AnimatePresence>
                           {equiposUsuario.map((equipo, index) => (
                             <Grid item xs={12} sm={6} md={4} lg={3} key={equipo._id}>
                               <TeamCard equipo={equipo} usuario={usuario} />
                             </Grid>
                           ))}
                         </AnimatePresence>
                       </Grid>
                     )}
                   </CardContent>
                 </Collapse>
               </Card>
             </motion.div>
           </Box>
         </Box>
       ) : (
         <motion.div variants={itemVariants}>
           <Paper sx={{ 
             p: 4, 
             bgcolor: 'rgba(0, 0, 0, 0.7)', 
             backdropFilter: 'blur(10px)',
             borderRadius: 3,
             border: '1px solid rgba(255, 255, 255, 0.1)'
           }}>
             <Typography color="error">No hay información de usuario disponible.</Typography>
             <Button 
               variant="contained" 
               color="primary" 
               sx={{ 
                 mt: 2,
                 background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                 boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)'
               }}
             >
               Volver a iniciar sesión
             </Button>
           </Paper>
         </motion.div>
       )}
     </motion.div>

     {/* Modal de inscripción mejorado */}
     <Dialog 
       open={abierto} 
       onClose={cerrarModal} 
       fullWidth 
       maxWidth="md"
       PaperProps={{
         sx: {
           borderRadius: 3,
           background: 'linear-gradient(145deg, rgba(20,20,40,0.98), rgba(40,40,80,0.98))',
           backdropFilter: 'blur(20px)',
           border: '1px solid rgba(255,255,255,0.1)',
           color: 'white'
         }
       }}
     >
       <DialogTitle sx={{ 
         pb: 1, 
         borderBottom: '1px solid rgba(255,255,255,0.1)',
         display: 'flex',
         justifyContent: 'space-between',
         alignItems: 'center'
       }}>
         <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
           <PersonAddIcon sx={{ color: '#64b5f6', fontSize: 32 }} />
           <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white' }}>
             Inscribirme a un Equipo
           </Typography>
         </Box>
         <IconButton onClick={cerrarModal} sx={{ color: 'white' }}>
           <CloseIcon />
         </IconButton>
       </DialogTitle>
       
       <DialogContent sx={{ pt: 3 }}>
         {!equipoSeleccionado ? (
           <Box>
             <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 'bold' }}>
               Selecciona un equipo disponible:
             </Typography>
             <EquipoSelectorImproved
               equipos={equipos}
               onSelect={handleSelectEquipo}
               loading={loadingEquiposDisponibles}
             />
           </Box>
         ) : (
           <Box>
             <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 'bold' }}>
               Confirmar inscripción:
             </Typography>
             
             {/* Equipo seleccionado */}
             <Paper sx={{
               p: 3, mb: 3,
               background: 'linear-gradient(145deg, rgba(100,181,246,0.1), rgba(100,181,246,0.05))',
               border: '1px solid rgba(100,181,246,0.3)',
               borderRadius: 2
             }}>
               <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                 <Avatar
                   src={getImageUrl(equipoSeleccionado.imagen)}
                   sx={{ width: 60, height: 60 }}
                 >
                   <GroupsIcon />
                 </Avatar>
                 <Box>
                   <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                     {equipoSeleccionado.nombre}
                   </Typography>
                   <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                     {getCategoryName(equipoSeleccionado.categoria)}
                   </Typography>
                 </Box>
               </Box>
             </Paper>

             {/* Número de camiseta */}
             <TextField
               fullWidth
               label="Número de camiseta"
               type="number"
               value={numeroJugador}
               onChange={(e) => setNumeroJugador(e.target.value)}
               placeholder="Ej: 10"
               inputProps={{ min: 1, max: 99 }}
               sx={{
                 '& .MuiOutlinedInput-root': {
                   backgroundColor: 'rgba(255,255,255,0.1)',
                   borderRadius: 2,
                   color: 'white',
                   '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                   '&:hover fieldset': { borderColor: 'rgba(100,181,246,0.5)' },
                   '&.Mui-focused fieldset': { borderColor: '#64b5f6' }
                 },
                 '& .MuiInputLabel-root': { 
                   color: 'rgba(255,255,255,0.7)',
                   '&.Mui-focused': { color: '#64b5f6' }
                 }
               }}
             />
             
             <Typography variant="caption" sx={{ 
               color: 'rgba(255,255,255,0.6)', 
               mt: 1, 
               display: 'block' 
             }}>
               * Elige un número del 1 al 99 que no esté ocupado en el equipo
             </Typography>
           </Box>
         )}
       </DialogContent>
       
       <DialogActions sx={{ 
         p: 3, 
         borderTop: '1px solid rgba(255,255,255,0.1)',
         gap: 2
       }}>
         <Button
           onClick={equipoSeleccionado ? () => setEquipoSeleccionado(null) : cerrarModal}
           sx={{ 
             color: 'rgba(255,255,255,0.7)',
             '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
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
               px: 3
             }}
           >
             {cargando ? 'Inscribiendo...' : 'Confirmar Inscripción'}
           </Button>
         )}
       </DialogActions>
     </Dialog>
   </Box>
 );
};