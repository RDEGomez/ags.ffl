import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axiosInstance from '../../config/axios';
import { UsuarioCard } from './UsuarioCard';
import { FiltrosJugadores } from '../../components/FiltrosJugadores';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Box,
  Typography,
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
  Grid,
  Pagination,
  TextField,
  InputAdornment,
  Skeleton,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Paper
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
  ViewStream as ViewStreamIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Sort as SortIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

import { ListaUsuariosCompacta } from './ListaUsuariosCompacta';

// 🔥 CONFIGURACIÓN DE PAGINACIÓN
const ITEMS_PER_PAGE_OPTIONS = [10, 15, 20, 50];
const DEFAULT_ITEMS_PER_PAGE = 15;

// 🔥 OPCIONES DE ORDENAMIENTO
const SORT_OPTIONS = [
  { value: 'nombre_asc', label: 'Nombre A-Z', field: 'nombre', order: 'asc' },
  { value: 'nombre_desc', label: 'Nombre Z-A', field: 'nombre', order: 'desc' },
  { value: 'fecha_asc', label: 'Más antiguos', field: 'createdAt', order: 'asc' },
  { value: 'fecha_desc', label: 'Más recientes', field: 'createdAt', order: 'desc' },
  { value: 'equipos_asc', label: 'Menos equipos', field: 'equipos', order: 'asc' },
  { value: 'equipos_desc', label: 'Más equipos', field: 'equipos', order: 'desc' },
  { value: 'rol_asc', label: 'Rol A-Z', field: 'rol', order: 'asc' },
  { value: 'rol_desc', label: 'Rol Z-A', field: 'rol', order: 'desc' }
];

// 🔥 SKELETON PARA CARGA
const UsuarioCardSkeleton = () => (
  <Card sx={{
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden'
  }}>
    <CardContent sx={{ p: 3, textAlign: 'center' }}>
      <Skeleton variant="circular" width={80} height={80} sx={{ mx: 'auto', mb: 2 }} />
      <Skeleton variant="text" width="80%" height={24} sx={{ mx: 'auto', mb: 1 }} />
      <Skeleton variant="text" width="60%" height={20} sx={{ mx: 'auto', mb: 2 }} />
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton variant="circular" width={40} height={40} />
      </Box>
    </CardContent>
  </Card>
);

export const Usuarios = () => {
  const { usuario, puedeGestionarUsuarios, puedeEditarUsuario } = useAuth();
  const navigate = useNavigate();

  // Estados principales
  const [usuarios, setUsuarios] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados de UI
  const [vistaCompacta, setVistaCompacta] = useState(false);
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);

  // Estados de búsqueda y filtrado
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('nombre_asc');
  
  // Estados de menús
  const [sortMenuAnchor, setSortMenuAnchor] = useState(null);

  // 🔥 Función helper para imágenes
  const getImageUrl = useCallback((imagen) => {
    if (!imagen) return '';
    if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
      return imagen;
    }
    return `${import.meta.env.VITE_BACKEND_URL || ''}/uploads/${imagen}`;
  }, []);

  // 🔥 Función para verificar permisos
  const puedeEditarEsteUsuario = useCallback((usuarioObj) => {
    return puedeEditarUsuario(usuarioObj._id, usuarioObj);
  }, [puedeEditarUsuario]);

  // 🔥 Obtener usuarios de la API
  const obtenerUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const { data } = await axiosInstance.get('/usuarios');
      setUsuarios(data);
      setFiltrados(data);
      
      // Reset página si es necesario
      const totalPaginas = Math.ceil(data.length / itemsPerPage);
      if (currentPage > totalPaginas && totalPaginas > 0) {
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      setError('Hubo un problema al cargar los usuarios. Intenta nuevamente más tarde.');
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage, currentPage]);

  useEffect(() => {
    obtenerUsuarios();
  }, [obtenerUsuarios]);

  // 🔥 Función de búsqueda optimizada
  const usuariosFiltradosPorBusqueda = useMemo(() => {
    if (!searchTerm.trim()) return filtrados;
    
    const term = searchTerm.toLowerCase().trim();
    
    return filtrados.filter(usuario => {
      // Búsqueda por nombre
      if (usuario.nombre?.toLowerCase().includes(term)) return true;
      
      // Búsqueda por documento
      if (usuario.documento?.toLowerCase().includes(term)) return true;
      
      // Búsqueda por email
      if (usuario.email?.toLowerCase().includes(term)) return true;
      
      // Búsqueda por rol
      if (usuario.rol?.toLowerCase().includes(term)) return true;
      
      // Búsqueda por nombres de equipos
      if (usuario.equipos?.some(equipoRelacion => 
        equipoRelacion.equipo?.nombre?.toLowerCase().includes(term)
      )) return true;
      
      return false;
    });
  }, [filtrados, searchTerm]);

  // 🔥 Función de ordenamiento optimizada
  const usuariosOrdenados = useMemo(() => {
    const sortOption = SORT_OPTIONS.find(option => option.value === sortBy);
    if (!sortOption) return usuariosFiltradosPorBusqueda;
    
    return [...usuariosFiltradosPorBusqueda].sort((a, b) => {
      let valueA, valueB;
      
      switch (sortOption.field) {
        case 'nombre':
          valueA = a.nombre?.toLowerCase() || '';
          valueB = b.nombre?.toLowerCase() || '';
          break;
        case 'createdAt':
          valueA = new Date(a.createdAt || 0);
          valueB = new Date(b.createdAt || 0);
          break;
        case 'equipos':
          valueA = a.equipos?.length || 0;
          valueB = b.equipos?.length || 0;
          break;
        case 'rol':
          valueA = a.rol?.toLowerCase() || '';
          valueB = b.rol?.toLowerCase() || '';
          break;
        default:
          valueA = a[sortOption.field] || '';
          valueB = b[sortOption.field] || '';
      }
      
      if (valueA < valueB) {
        return sortOption.order === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortOption.order === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [usuariosFiltradosPorBusqueda, sortBy]);

  // 🔥 Paginación de resultados
  const usuariosPaginados = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return usuariosOrdenados.slice(startIndex, startIndex + itemsPerPage);
  }, [usuariosOrdenados, currentPage, itemsPerPage]);

  // 🔥 Cálculos de paginación
  const totalPages = Math.ceil(usuariosOrdenados.length / itemsPerPage);
  const hasResults = usuariosOrdenados.length > 0;

  // 🔥 Manejar cambio de página
  const handlePageChange = useCallback((event, newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // 🔥 Manejar cambio de items por página
  const handleItemsPerPageChange = useCallback((event) => {
    const newItemsPerPage = event.target.value;
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset a la primera página
  }, []);

  // 🔥 Limpiar búsqueda
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  // 🔥 Eliminar usuario con confirmación
  const eliminarUsuario = useCallback(async (usuarioId) => {
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
        
        // Ajustar página si es necesario
        const nuevoTotal = Math.ceil(actualizados.length / itemsPerPage);
        if (currentPage > nuevoTotal && nuevoTotal > 0) {
          setCurrentPage(nuevoTotal);
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
  }, [usuarios, puedeGestionarUsuarios, usuario._id, itemsPerPage, currentPage]);

  // 🔥 Obtener estadísticas
  const obtenerEstadisticas = useCallback(() => {
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
      conEquipos: usuariosConEquipos,
      filtrados: usuariosOrdenados.length,
      paginaActual: currentPage,
      totalPaginas: totalPages
    };
  }, [usuarios, usuariosOrdenados.length, currentPage, totalPages]);

  const stats = obtenerEstadisticas();

  // Animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.05 } 
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.4, ease: "easeOut" }
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
              Usuarios ({stats.filtrados})
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Tooltip title="Actualizar lista">
                <IconButton
                  onClick={obtenerUsuarios}
                  disabled={loading}
                  sx={{
                    backgroundColor: 'rgba(100, 181, 246, 0.1)',
                    color: '#64b5f6',
                    '&:hover': {
                      backgroundColor: 'rgba(100, 181, 246, 0.2)',
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>

              {puedeGestionarUsuarios() && (
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
                  Nuevo Usuario
                </Button>
              )}
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

        {/* Barra de búsqueda y controles */}
        <motion.div variants={itemVariants}>
          <Card sx={{ ...cardStyle, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              {/* Primera fila: Búsqueda y controles principales */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
                mb: 2
              }}>
                {/* Búsqueda */}
                <TextField
                  placeholder="Buscar por nombre, documento, email o equipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="small"
                  sx={{
                    minWidth: 300,
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.4)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#64b5f6',
                      },
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#64b5f6' }} />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={clearSearch}
                          size="small"
                          sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                        >
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />

                {/* Controles de vista */}
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

              {/* Segunda fila: Filtros y ordenamiento */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2
              }}>
                {/* Filtros */}
                <FiltrosJugadores jugadores={usuarios} setFiltrados={setFiltrados} />

                {/* Ordenamiento */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<SortIcon />}
                    onClick={(e) => setSortMenuAnchor(e.currentTarget)}
                    sx={{
                      color: 'white',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 0.4)',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                  >
                    {SORT_OPTIONS.find(opt => opt.value === sortBy)?.label || 'Ordenar'}
                  </Button>

                  <Menu
                    anchorEl={sortMenuAnchor}
                    open={Boolean(sortMenuAnchor)}
                    onClose={() => setSortMenuAnchor(null)}
                  >
                    {SORT_OPTIONS.map((option) => (
                      <MenuItem
                        key={option.value}
                        selected={sortBy === option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setSortMenuAnchor(null);
                        }}
                      >
                        {option.label}
                      </MenuItem>
                    ))}
                  </Menu>

                  {/* Items por página */}
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Por página
                    </InputLabel>
                    <Select
                      value={itemsPerPage}
                      label="Por página"
                      onChange={handleItemsPerPageChange}
                      sx={{
                        color: 'white',
                        '.MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.4)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#64b5f6',
                        },
                      }}
                    >
                      {ITEMS_PER_PAGE_OPTIONS.map(option => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              {/* Información de resultados */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mt: 2,
                pt: 2,
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" sx={{ color: 'white' }}>
                    Mostrando {usuariosPaginados.length} de {stats.filtrados} usuarios
                    {searchTerm && (
                      <Chip 
                        label={`Búsqueda: "${searchTerm}"`} 
                        color="primary" 
                        size="small" 
                        variant="outlined"
                        sx={{ ml: 1 }}
                        onDelete={clearSearch}
                      />
                    )}
                  </Typography>
                </Box>

                {/* Paginación info */}
                {totalPages > 1 && (
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Página {currentPage} de {totalPages}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contenido principal */}
        {loading && usuarios.length === 0 ? (
          <motion.div variants={itemVariants}>
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 3,
              justifyContent: { xs: 'center', sm: 'flex-start' }
            }}>
              {Array.from({ length: itemsPerPage }).map((_, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    flexBasis: { 
                      xs: '100%',
                      sm: 'calc(50% - 12px)',
                      md: 'calc(33.333% - 16px)',
                      lg: 'calc(25% - 18px)',
                      xl: 'calc(20% - 19.2px)'
                    }
                  }}
                >
                  <UsuarioCardSkeleton />
                </Box>
              ))}
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
        ) : !hasResults ? (
          <motion.div variants={itemVariants}>
            <Card sx={cardStyle}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <PeopleIcon sx={{ fontSize: 60, color: 'gray', mb: 2 }} />
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  {usuarios.length === 0 ? 'No hay usuarios registrados' : 'No se encontraron usuarios con los filtros aplicados'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'gray', mb: 3 }}>
                  {usuarios.length === 0 
                    ? 'Crea el primer usuario para comenzar' 
                    : searchTerm 
                      ? `No hay resultados para "${searchTerm}". Intenta con otros términos de búsqueda.`
                      : 'Intenta cambiar los filtros de búsqueda'
                  }
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
                {searchTerm && (
                  <Button 
                    onClick={clearSearch}
                    variant="outlined"
                    startIcon={<ClearIcon />}
                    sx={{ 
                      mt: 2,
                      color: 'white',
                      borderColor: 'rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    Limpiar búsqueda
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
                <ListaUsuariosCompacta 
                  usuarios={usuariosPaginados} 
                  eliminarUsuario={eliminarUsuario} 
                />
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
              {usuariosPaginados.map((usuarioItem, index) => (
                <Box 
                  key={usuarioItem._id} 
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
                  <motion.div 
                    variants={itemVariants}
                    layout
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    transition={{ delay: index * 0.02 }}
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

        {/* Paginación */}
        {totalPages > 1 && (
          <motion.div variants={itemVariants}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              alignItems: 'center',
              mt: 4,
              gap: 2,
              flexWrap: 'wrap'
            }}>
              <Paper
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 2,
                  p: 2
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 3,
                  flexWrap: 'wrap',
                  justifyContent: 'center'
                }}>
                  {/* Información de página */}
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 'medium' }}>
                    {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, stats.filtrados)} de {stats.filtrados}
                  </Typography>

                  {/* Paginación */}
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    size="medium"
                    showFirstButton
                    showLastButton
                    sx={{
                      '& .MuiPagination-ul': {
                        gap: 1
                      },
                      '& .MuiPaginationItem-root': {
                        color: 'white',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          borderColor: 'rgba(255, 255, 255, 0.4)'
                        },
                        '&.Mui-selected': {
                          backgroundColor: '#64b5f6',
                          color: 'white',
                          fontWeight: 'bold',
                          '&:hover': {
                            backgroundColor: '#5a9fd8'
                          }
                        }
                      }
                    }}
                  />

                  {/* Navegación rápida */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Tooltip title="Primera página">
                      <IconButton
                        onClick={() => handlePageChange(null, 1)}
                        disabled={currentPage === 1}
                        size="small"
                        sx={{
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)'
                          }
                        }}
                      >
                        <ArrowUpwardIcon sx={{ transform: 'rotate(-90deg)' }} />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Última página">
                      <IconButton
                        onClick={() => handlePageChange(null, totalPages)}
                        disabled={currentPage === totalPages}
                        size="small"
                        sx={{
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)'
                          }
                        }}
                      >
                        <ArrowDownwardIcon sx={{ transform: 'rotate(-90deg)' }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </motion.div>
        )}

        {/* Información adicional */}
        {!loading && (
          <motion.div variants={itemVariants}>
            <Box sx={{ 
              mt: 4, 
              p: 2, 
              textAlign: 'center',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                Sistema optimizado con paginación • Mostrando resultados de forma eficiente
                {searchTerm && ` • Filtrado por: "${searchTerm}"`}
              </Typography>
            </Box>
          </motion.div>
        )}
      </motion.div>
    </Box>
  );
};