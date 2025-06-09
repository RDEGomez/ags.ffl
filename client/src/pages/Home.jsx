import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Chip, 
  Avatar, 
  Card, 
  CardContent, 
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  TextField,
  CircularProgress,
  Stack,
  Collapse
} from '@mui/material';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';
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
import axiosInstance from '../config/axios';
import { getCategoryName } from '../helpers/mappings';
import { useImage } from '../hooks/useImage';
import { ListaEquiposUsuario } from './EquipoCard';

export const Home = () => {
  const { usuario, tieneTokenValido, getStoredToken, puedeInscribirseEquipo, refrescarUsuario } = useAuth();

  const [equipos, setEquipos] = useState([]);
  const [equiposUsuario, setEquiposUsuario] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState('');
  const [numeroJugador, setNumeroJugador] = useState('');
  const [cargando, setCargando] = useState(false);
  const [expandidoEquipos, setExpandidoEquipos] = useState(true);
  const [loadingEquiposUsuario, setLoadingEquiposUsuario] = useState(false);
  const [loadingEquiposDisponibles, setLoadingEquiposDisponibles] = useState(false);

  const imagePath = useImage(usuario?.imagen);
  const tokenValido = tieneTokenValido();
  const storedToken = getStoredToken();

  // 🔥 FUNCIÓN HELPER para URLs de imágenes
  const getImageUrl = (imagen) => {
    if (!imagen) return '';
    if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
      return imagen;
    }
    return `${import.meta.env.VITE_BACKEND_URL || ''}/uploads/${imagen}`;
  };

  // 🔥 FUNCIÓN CORREGIDA - Usar equipos que ya vienen en usuario
  const obtenerEquiposUsuario = useCallback(async () => {
    console.log('\n🔍 === INICIO CARGA EQUIPOS USUARIO ===');
    console.log('👤 Usuario presente:', !!usuario);
    console.log('🔑 Token válido:', tokenValido);
    
    if (!usuario || !tokenValido) {
      console.log('❌ No hay usuario válido o token inválido, saliendo...');
      setEquiposUsuario([]);
      return;
    }

    // 🔥 NUEVO: Obtener usuario completo con equipos populados
    setLoadingEquiposUsuario(true);
    
    try {
      console.log('🔄 Obteniendo perfil completo del usuario...');
      const { data: perfilCompleto } = await axiosInstance.get('/auth/perfil');
      
      console.log('📋 Perfil obtenido:', {
        email: perfilCompleto.email,
        equipos: perfilCompleto.equipos?.length || 0
      });

      if (!perfilCompleto.equipos || perfilCompleto.equipos.length === 0) {
        console.log('❌ Usuario sin equipos asignados');
        setEquiposUsuario([]);
        return;
      }

      // 🔥 PROCESAMIENTO DIRECTO: Los equipos ya vienen populados desde el backend
      const equiposConNumero = perfilCompleto.equipos.map(equipoUsuario => {
        console.log('🔍 Procesando equipo:', {
          equipoId: equipoUsuario.equipo?._id,
          nombre: equipoUsuario.equipo?.nombre,
          numero: equipoUsuario.numero
        });

        return {
          ...equipoUsuario.equipo, // Ya viene populado desde el backend
          numeroUsuario: equipoUsuario.numero // Agregar el número del usuario
        };
      }).filter(equipo => equipo._id); // Filtrar equipos inválidos

      console.log('🏆 Equipos procesados:', equiposConNumero.length);
      console.log('📋 Lista final:', equiposConNumero.map(e => ({
        id: e._id,
        nombre: e.nombre,
        categoria: e.categoria,
        numero: e.numeroUsuario
      })));
      
      setEquiposUsuario(equiposConNumero);
      console.log('✅ Estado equiposUsuario actualizado');
      
    } catch (error) {
      console.error('❌ Error al obtener equipos del usuario:', error);
      
      if (error.response?.status === 401) {
        console.log('🔄 Error 401 - Intentando refrescar usuario...');
        try {
          await refrescarUsuario();
        } catch (refreshError) {
          console.error('❌ Error al refrescar usuario:', refreshError);
        }
      } else {
        console.error('📋 Error completo:', error.response?.data || error.message);
      }
      setEquiposUsuario([]);
    } finally {
      setLoadingEquiposUsuario(false);
      console.log('🔚 === FIN CARGA EQUIPOS USUARIO ===\n');
    }
  }, [usuario, tokenValido, refrescarUsuario]);

  // 🔥 FUNCIÓN MEJORADA - Cargar equipos disponibles
  const obtenerEquiposDisponibles = useCallback(async () => {
    console.log('\n🔍 === INICIO CARGA EQUIPOS DISPONIBLES ===');
    console.log('👤 Usuario presente:', !!usuario);
    console.log('🔑 Token válido:', tokenValido);
    
    if (!usuario || !tokenValido) {
      console.log('❌ Usuario no disponible o token inválido, saliendo...');
      setEquipos([]);
      return;
    }

    setLoadingEquiposDisponibles(true);
    
    try {
      const { data } = await axiosInstance.get('/equipos');
      console.log('📊 Total equipos de la API:', data.length);
      
      // 🔥 LÓGICA CORREGIDA DE FILTRADO
      const equiposNoInscritos = data.filter(eq => {
        // Verificar si el usuario ya está inscrito usando los equipos del estado
        const usuarioYaInscrito = equiposUsuario.some(equipoUsuario => {
          const match = equipoUsuario._id === eq._id;
          if (match) {
            console.log(`  ⚠️ Usuario YA INSCRITO en equipo ${eq.nombre} (ID: ${eq._id})`);
          }
          return match;
        });

        // También verificar en el array de jugadores del equipo (por si acaso)
        const inscritoEnJugadores = eq.jugadores?.some(j => {
          const match = j._id === usuario._id || j._id === usuario.id;
          if (match) {
            console.log(`  ⚠️ Usuario encontrado en jugadores de ${eq.nombre}`);
          }
          return match;
        });

        const disponible = !usuarioYaInscrito && !inscritoEnJugadores;
        
        console.log(`  🔍 Equipo ${eq.nombre}:`, {
          usuarioYaInscrito,
          inscritoEnJugadores,
          disponible,
          equipoId: eq._id
        });

        return disponible;
      });

      console.log('📊 Equipos disponibles para inscripción:', equiposNoInscritos.length);
      console.log('📋 Equipos disponibles:', equiposNoInscritos.map(e => e.nombre));
      setEquipos(equiposNoInscritos);
      console.log('✅ Estado equipos disponibles actualizado');
      
    } catch (error) {
      console.error('❌ Error al obtener equipos disponibles:', error);
      
      if (error.response?.status === 401) {
        console.log('🔄 Error 401 en equipos disponibles - intentando refrescar...');
        try {
          await refrescarUsuario();
        } catch (refreshError) {
          console.error('❌ Error al refrescar usuario:', refreshError);
        }
      } else {
        console.error('📋 Error completo:', error.response?.data || error.message);
      }
      setEquipos([]);
    } finally {
      setLoadingEquiposDisponibles(false);
      console.log('🔚 === FIN CARGA EQUIPOS DISPONIBLES ===\n');
    }
  }, [usuario, tokenValido, equiposUsuario, refrescarUsuario]); // 🔥 DEPENDENCIA AGREGADA: equiposUsuario

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

  // 🔥 DEBUGGING MEJORADO
  useEffect(() => {
    console.log('\n📊 === ESTADO GENERAL ===');
    console.log('👤 Usuario:', usuario ? 'Presente' : 'Ausente');
    console.log('🔑 Token válido:', tokenValido);
    console.log('🗄️ Token en localStorage:', !!storedToken);
    console.log('🏆 Equipos del usuario:', equiposUsuario.length);
    console.log('📋 Equipos disponibles:', equipos.length);
    console.log('🔄 Loading equipos usuario:', loadingEquiposUsuario);
    console.log('🔄 Loading equipos disponibles:', loadingEquiposDisponibles);
    
    if (usuario?.equipos) {
      console.log('📝 Equipos en usuario.equipos:', usuario.equipos.map(e => ({
        equipoId: e.equipo?._id || e.equipo,
        numero: e.numero
      })));
    }
    
    if (equiposUsuario.length > 0) {
      console.log('📝 Equipos cargados en estado:', equiposUsuario.map(e => ({
        id: e._id,
        nombre: e.nombre,
        categoria: e.categoria,
        numero: e.numeroUsuario
      })));
    }
    
    console.log('========================\n');
  }, [usuario, tokenValido, storedToken, equiposUsuario, equipos, loadingEquiposUsuario, loadingEquiposDisponibles]);

  const abrirModal = () => {
    setAbierto(true);
  };

  const cerrarModal = () => {
    setAbierto(false);
    setEquipoSeleccionado('');
    setNumeroJugador('');
  };

  const manejarInscripcion = async () => {
    if (!equipoSeleccionado || !numeroJugador) return;

    const datosInscripcion = {
      equipoId: equipoSeleccionado,
      numero: numeroJugador,
      usuarioId: usuario.id || usuario._id
    };

    cerrarModal();
    await new Promise((resolve) => setTimeout(resolve, 200));

    const resultado = await Swal.fire({
      title: '¿Deseas inscribirte en este equipo?',
      text: `Número a registrar: ${numeroJugador}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, inscribirme',
    });

    if (resultado.isConfirmed) {
      setCargando(true);
      try {
        await axiosInstance.patch('/usuarios/equipo/', datosInscripcion);
        Swal.fire('¡Inscripción exitosa!', 'Te has inscrito en el equipo.', 'success');
        
        // 🔥 MEJORADO: Refrescar datos y recargar listas
        await refrescarUsuario();
        
        // Recargar ambas listas
        setTimeout(() => {
          obtenerEquiposUsuario();
          obtenerEquiposDisponibles();
        }, 500);
        
      } catch (error) {
        const mensaje = error.response?.data?.mensaje || 'Error al inscribir al jugador';
        Swal.fire('Error', mensaje, 'error');
      } finally {
        setCargando(false);
      }
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
            {/* FILA 1: Perfil + Acciones Rápidas */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' }, 
              gap: 4 
            }}>
              {/* Tarjeta de Perfil */}
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
                        <Avatar
                          src={imagePath}
                          sx={{ 
                            width: 80, 
                            height: 80, 
                            bgcolor: 'primary.main',
                            border: '3px solid rgba(255,255,255,0.2)',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                          }}
                        >
                          {(usuario.nombre?.charAt(0) || usuario.email?.charAt(0) || 'U').toUpperCase()}
                        </Avatar>
                        <Box sx={{ ml: 3 }}>
                          <Typography variant="h5" gutterBottom sx={{ color: 'white', fontWeight: 'medium' }}>
                            {usuario.nombre || usuario.email}
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

              {/* Tarjeta de Acciones Rápidas */}
              <Box sx={{ flex: 1 }}>
                <motion.div variants={itemVariants}>
                  <Card sx={cardStyle}>
                    <Box sx={headerStyle}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <GroupsIcon sx={{ mr: 1, color: '#64b5f6' }} />
                        <Typography variant="h6">Acciones Rápidas</Typography>
                      </Box>
                      <Chip 
                        label={loadingEquiposDisponibles ? 'Cargando...' : `${equipos.length} equipos disponibles`} 
                        color={loadingEquiposDisponibles ? "default" : "primary"}
                        variant="outlined" 
                        size="small" 
                      />
                    </Box>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Box>
                          <Button 
                            variant="contained" 
                            color="primary" 
                            fullWidth 
                            size="large"
                            startIcon={loadingEquiposDisponibles ? <CircularProgress size={20} /> : <PersonAddIcon />}
                            onClick={abrirModal}
                            disabled={equipos.length === 0 || !puedeInscribirseEquipo() || loadingEquiposDisponibles}
                            sx={{
                              py: 2,
                              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                              boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                              borderRadius: 2,
                              mb: 2,
                              fontWeight: 'bold'
                            }}
                          >
                            {loadingEquiposDisponibles ? 'Cargando equipos...' : 'Inscribirme a un Equipo'}
                          </Button>
                          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 1, mb: 3 }}>
                            {loadingEquiposDisponibles 
                              ? 'Obteniendo equipos disponibles...'
                              : equipos.length > 0 
                                ? `Tienes ${equipos.length} equipos disponibles para inscribirse` 
                                : 'No hay equipos disponibles para inscripción'}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: { xs: 'column', sm: 'row' }, 
                          gap: 2 
                        }}>
                          <Button 
                            variant="outlined" 
                            fullWidth 
                            component={NavLink}
                            to="/perfil"
                            startIcon={<SettingsIcon />}
                            sx={{
                              py: 1.5,
                              borderRadius: 2,
                              borderWidth: 2,
                              '&:hover': {
                                borderWidth: 2,
                                backgroundColor: 'rgba(255,255,255,0.05)'
                              }
                            }}
                          >
                            Perfil
                          </Button>
                          
                          <Button 
                            variant="outlined" 
                            color="secondary"
                            fullWidth 
                            component={NavLink}
                            to="/calendario"
                            startIcon={<CalendarIcon />}
                            sx={{
                              py: 1.5,
                              borderRadius: 2,
                              borderWidth: 2,
                              '&:hover': {
                                borderWidth: 2,
                                backgroundColor: 'rgba(255,255,255,0.05)'
                              }
                            }}
                          >
                            Calendario
                          </Button>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Box>
            </Box>

            {/* FILA 2: Mis Equipos */}
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
                      <SportsIcon sx={{ mr: 1, color: '#64b5f6' }} />
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
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                          <CircularProgress />
                        </Box>
                      ) : (
                        <ListaEquiposUsuario 
                          equipos={equiposUsuario}
                          usuario={usuario}
                          titulo=""
                          showEmptyState={true}
                        />
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

      {/* Modal de inscripción */}
      <Dialog 
        open={abierto} 
        onClose={cerrarModal} 
        fullWidth 
        maxWidth="sm"
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
        <DialogTitle sx={{ 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <PersonAddIcon sx={{ color: '#64b5f6' }} />
          Inscribirme a un equipo
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            select
            label="Selecciona un equipo"
            fullWidth
            value={equipoSeleccionado}
            onChange={(e) => setEquipoSeleccionado(e.target.value)}
            sx={{ 
              mt: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          >
            {equipos.map((equipo) => (
              <MenuItem key={equipo._id || equipo.id} value={equipo._id || equipo.id}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar
                    src={getImageUrl(equipo.imagen)}
                    alt={equipo.nombre}
                    sx={{ width: 30, height: 30 }}
                  >
                    <GroupsIcon sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Typography variant="body2">
                    {equipo.nombre} ({getCategoryName(equipo.categoria)})
                  </Typography>
                </Stack>
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Número de camiseta"
            type="number"
            fullWidth
            sx={{ 
              mt: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
            value={numeroJugador}
            onChange={(e) => setNumeroJugador(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
          <Button 
            onClick={cerrarModal}
            variant="outlined"
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={manejarInscripcion} 
            variant="contained" 
            color="primary" 
            disabled={cargando}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            }}
          >
            {cargando ? <CircularProgress size={24} /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Icono de calendario para el botón de calendario
const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);