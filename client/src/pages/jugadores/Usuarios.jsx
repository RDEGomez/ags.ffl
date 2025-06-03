import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axiosInstance from '../../config/axios';
import { UsuarioCard } from './UsuarioCard';
import { FiltrosJugadores } from '../../components/FiltrosJugadores';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Box,
  IconButton,
  Typography,
  Fab,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Chip,
  Button,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Grid
} from '@mui/material';

import {
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Add as AddIcon,
  People as PeopleIcon,
  NavigateNext as NavigateNextIcon,
  PersonAdd as PersonAddIcon,
  FilterList as FilterListIcon,
  GridView as GridViewIcon,
  ViewStream as ViewStreamIcon
} from '@mui/icons-material';

import { ListaUsuariosCompacta } from './ListaUsuariosCompacta';

export const Usuarios = () => {
  // 🔥 USAR: Nuevas funciones de permisos con validación por ID
  const { usuario, puedeGestionarUsuarios, puedeEditarUsuario } = useAuth();
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [vistaCompacta, setVistaCompacta] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 🔥 AGREGADO: Función helper para imágenes (sin hook, evita error de hooks)
  const getImageUrl = (imagen) => {
    if (!imagen) return '';
    if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
      return imagen;
    }
    return `${import.meta.env.VITE_BACKEND_URL || ''}/uploads/${imagen}`;
  };

  // 🔥 NUEVA: Función para verificar si puede editar un usuario específico
  const puedeEditarEsteUsuario = (usuarioObj) => {
    return puedeEditarUsuario(usuarioObj._id, usuarioObj);
  };

  const obtenerUsuarios = async () => {
    try {
      setLoading(true);
      setError('');
      // 🔥 Por defecto la API ya excluye árbitros, pero podemos ser específicos
      const { data } = await axiosInstance.get('/usuarios');
      setUsuarios(data);
      setFiltrados(data);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      setError('Hubo un problema al cargar los usuarios. Intenta nuevamente más tarde.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerUsuarios();
  }, []);

  const eliminarUsuario = async (usuarioId) => {
    // 🔥 VALIDACIÓN: Solo mostrar si tiene permisos (doble validación)
    if (!puedeGestionarUsuarios()) {
      Swal.fire({
        icon: 'error',
        title: 'Sin permisos',
        text: 'No tienes permisos para eliminar usuarios'
      });
      return;
    }

    try {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: 'No podrás revertir esto! Se eliminará el usuario y todos sus datos.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminarlo!',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        await axiosInstance.delete(`/usuarios/${usuarioId}`);
        
        const actualizados = usuarios.filter(user => user._id !== usuarioId);
        setUsuarios(actualizados);
        setFiltrados(actualizados);

        // Si el usuario eliminado es el que está loggeado, hacer logout
        if (usuarioId === usuario._id) {
          logout();
        }
        
        Swal.fire({
          icon: 'success',
          title: 'Eliminado!',
          text: 'El usuario ha sido eliminado correctamente.',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.mensaje || 'No se pudo eliminar el usuario. Intenta nuevamente.'
      });
    }
  };

  // Obtener estadísticas de usuarios
  const obtenerEstadisticas = () => {
    const totalUsuarios = usuarios.length;
    const jugadores = usuarios.filter(u => u.rol === 'jugador').length;
    const capitanes = usuarios.filter(u => u.rol === 'capitan').length;
    const administradores = usuarios.filter(u => u.rol === 'admin').length;
    const arbitros = usuarios.filter(u => u.rol === 'arbitro').length;
    const usuariosConEquipos = usuarios.filter(u => u.equipos && u.equipos.length > 0).length;

    return {
      total: totalUsuarios,
      jugadores,
      capitanes,
      administradores,
      arbitros,
      conEquipos: usuariosConEquipos
    };
  };

  const stats = obtenerEstadisticas();

  // Animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 } 
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
        {/* Breadcrumbs */}
        <motion.div variants={itemVariants}>
          <Breadcrumbs 
            separator={<NavigateNextIcon fontSize="small" />}
            sx={{ mb: 3, color: 'rgba(255,255,255,0.7)' }}
          >
            <Typography color="primary">Gestión de Usuarios</Typography>
          </Breadcrumbs>
        </motion.div>

        {/* Header con estadísticas */}
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
              <PeopleIcon sx={{ color: '#64b5f6' }} />
              Usuarios
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FiltrosJugadores jugadores={usuarios} setFiltrados={setFiltrados} />
            </Box>
          </Box>
        </motion.div>

        {/* Tarjetas de estadísticas */}
        <motion.div variants={itemVariants}>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={cardStyle}>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <PeopleIcon sx={{ fontSize: 40, color: '#64b5f6', mb: 1 }} />
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Usuarios
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={cardStyle}>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <PersonAddIcon sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {stats.jugadores}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Jugadores
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={cardStyle}>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <PeopleIcon sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {stats.capitanes}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Capitanes
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={cardStyle}>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <PeopleIcon sx={{ fontSize: 40, color: '#f44336', mb: 1 }} />
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {stats.administradores}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Administradores
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={cardStyle}>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <PersonAddIcon sx={{ fontSize: 40, color: '#e91e63', mb: 1 }} />
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {stats.conEquipos}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Con Equipos
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </motion.div>

        {/* Controles de vista y filtros */}
        <motion.div variants={itemVariants}>
          <Card sx={{ ...cardStyle, mb: 3 }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FilterListIcon sx={{ color: '#64b5f6' }} />
                  <Typography variant="body1" sx={{ color: 'white' }}>
                    Mostrando {filtrados.length} de {usuarios.length} usuarios
                  </Typography>
                  
                  {filtrados.length !== usuarios.length && (
                    <Chip 
                      label="Filtros aplicados" 
                      color="primary" 
                      size="small" 
                      variant="outlined"
                    />
                  )}
                </Box>
                
                <ToggleButtonGroup
                  value={vistaCompacta ? 'list' : 'grid'}
                  exclusive
                  onChange={(e, newView) => {
                    if (newView !== null) {
                      setVistaCompacta(newView === 'list');
                    }
                  }}
                  size="small"
                  sx={{
                    '& .MuiToggleButton-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(100, 181, 246, 0.2)',
                        color: '#64b5f6',
                        borderColor: '#64b5f6'
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                      }
                    }
                  }}
                >
                  <ToggleButton value="grid" aria-label="vista en grid">
                    <Tooltip title="Vista en tarjetas">
                      <GridViewIcon />
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="list" aria-label="vista en lista">
                    <Tooltip title="Vista en lista">
                      <ViewStreamIcon />
                    </Tooltip>
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contenido principal */}
        {loading && usuarios.length === 0 ? (
          <motion.div variants={itemVariants}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              minHeight: '300px'
            }}>
              <CircularProgress size={60} />
            </Box>
          </motion.div>
        ) : error ? (
          <motion.div variants={itemVariants}>
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
              <Button 
                variant="contained" 
                color="primary" 
                onClick={obtenerUsuarios}
                sx={{ mt: 2, ml: 2 }}
              >
                Reintentar
              </Button>
            </Alert>
          </motion.div>
        ) : filtrados.length === 0 ? (
          <motion.div variants={itemVariants}>
            <Card sx={cardStyle}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <PeopleIcon sx={{ fontSize: 60, color: 'gray', mb: 2 }} />
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  {usuarios.length === 0 ? 'No hay usuarios registrados' : 'No se encontraron usuarios con los filtros aplicados'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'gray', mb: 3 }}>
                  {usuarios.length === 0 ? 'Crea el primer usuario para comenzar' : 'Intenta cambiar los filtros de búsqueda'}
                </Typography>
                {usuarios.length === 0 && puedeGestionarUsuarios() && (
                  <Button 
                    component={Link}
                    to="/usuarios/nuevo"
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{
                      background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                      boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                    }}
                  >
                    Crear Usuario
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : vistaCompacta ? (
          <motion.div variants={itemVariants}>
            <Card sx={cardStyle}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 2,
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  pb: 2
                }}>
                  <ViewStreamIcon sx={{ color: '#64b5f6', mr: 2 }} />
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Lista de Usuarios
                  </Typography>
                </Box>
                <ListaUsuariosCompacta usuarios={filtrados} eliminarUsuario={eliminarUsuario} />
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 3,
            justifyContent: { xs: 'center', sm: 'flex-start' }
          }}>
            <AnimatePresence>
              {filtrados.map((usuarioItem, index) => (
                <Box 
                  key={usuarioItem._id} 
                  sx={{ 
                    flexBasis: { 
                      xs: '100%',                    // Mobile: 1 por fila
                      sm: 'calc(50% - 12px)',       // Tablet: 2 por fila  
                      md: 'calc(33.333% - 16px)',   // Tablet grande: 3 por fila
                      lg: 'calc(25% - 18px)',       // Desktop: 4 por fila
                      xl: 'calc(20% - 19.2px)'      // Desktop grande: 5 por fila
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
                  <motion.div 
                    variants={itemVariants}
                    layout
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    transition={{ delay: index * 0.05 }}
                    style={{ height: '100%' }}
                  >
                    <Box sx={{ 
                      height: '100%',
                      ...cardStyle,
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 12px 20px rgba(0, 0, 0, 0.2)',
                        backgroundColor: 'rgba(0, 0, 0, 0.9)'
                      }
                    }}>
                      <UsuarioCard usuario={usuarioItem} eliminarUsuario={eliminarUsuario} />
                    </Box>
                  </motion.div>
                </Box>
              ))}
            </AnimatePresence>
          </Box>
        )}
      </motion.div>
    </Box>
  );
};