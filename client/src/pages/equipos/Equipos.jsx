import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
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
  Alert,
  useMediaQuery,
  useTheme,
  Pagination,
  TextField,
  InputAdornment,
  Skeleton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Paper,
  Breadcrumbs,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';

import {
  CalendarMonth as CalendarMonthIcon,
  EmojiEvents as EmojiEventsIcon,
  Groups as GroupsIcon,
  Info as InfoIcon,
  SportsFootball as SportsFootballIcon,
  Sports as SportsIcon,
  Add as AddIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Sort as SortIcon,
  Refresh as RefreshIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  NavigateNext as NavigateNextIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';

import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../../config/axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getCategoryName } from '../../helpers/mappings';
import { FiltrosEquipos } from '../../components/FiltrosEquipos';
import { ListaJugadoresEquipo } from './ListaJugadoresEquipo';
import { useImage } from '../../hooks/useImage';
import Swal from 'sweetalert2';

// 🔥 CONFIGURACIÓN DE PAGINACIÓN
const ITEMS_PER_PAGE_OPTIONS = [10, 15, 20, 50];
const DEFAULT_ITEMS_PER_PAGE = 15;

// 🔥 OPCIONES DE ORDENAMIENTO
const SORT_OPTIONS = [
  { value: 'nombre_asc', label: 'Nombre A-Z', field: 'nombre', order: 'asc' },
  { value: 'nombre_desc', label: 'Nombre Z-A', field: 'nombre', order: 'desc' },
  { value: 'fecha_asc', label: 'Más antiguos', field: 'createdAt', order: 'asc' },
  { value: 'fecha_desc', label: 'Más recientes', field: 'createdAt', order: 'desc' },
  { value: 'jugadores_asc', label: 'Menos jugadores', field: 'jugadores', order: 'asc' },
  { value: 'jugadores_desc', label: 'Más jugadores', field: 'jugadores', order: 'desc' },
  { value: 'categoria_asc', label: 'Categoría A-Z', field: 'categoria', order: 'asc' },
  { value: 'categoria_desc', label: 'Categoría Z-A', field: 'categoria', order: 'desc' }
];

// 🔥 SKELETON PARA CARGA
const EquipoCardSkeleton = () => (
  <Card sx={{
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 3,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    height: 400
  }}>
    <Skeleton 
      variant="rectangular" 
      height={180} 
      sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
    />
    <CardContent>
      <Skeleton 
        variant="text" 
        height={30} 
        sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', mb: 1 }}
      />
      <Skeleton 
        variant="text" 
        height={20} 
        sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', mb: 2 }}
      />
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Skeleton 
          variant="rectangular" 
          width={80} 
          height={24} 
          sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: 1 }}
        />
        <Skeleton 
          variant="rectangular" 
          width={60} 
          height={24} 
          sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: 1 }}
        />
      </Box>
    </CardContent>
  </Card>
);

// 🔥 Componente principal de la tarjeta de equipo
const EquipoCard = ({ equipo, onAbrirDetalle, stats = {} }) => {
  const equipoImageUrl = useImage(equipo?.imagen, '');
  
  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        borderRadius: 3,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
          borderColor: 'rgba(100, 181, 246, 0.4)'
        }
      }}>
        {/* Imagen del equipo */}
        <Box sx={{ position: 'relative', overflow: 'hidden' }}>
          <CardMedia
            component="div"
            sx={{
              height: 180,
              background: equipoImageUrl 
                ? `url(${equipoImageUrl}) center/cover`
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {!equipoImageUrl && (
              <GroupsIcon sx={{ fontSize: 60, color: 'white', opacity: 0.7 }} />
            )}
          </CardMedia>
          
          {/* Badge de categoría */}
          <Chip
            label={getCategoryName(equipo.categoria)}
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              fontWeight: 'bold',
              backdropFilter: 'blur(10px)'
            }}
          />
        </Box>

        {/* Contenido */}
        <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Nombre del equipo */}
          <Typography 
            variant="h5" 
            component="h2" 
            sx={{ 
              color: 'white',
              fontWeight: 'bold',
              mb: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {equipo.nombre}
          </Typography>

          {/* Información de jugadores */}
          <Box sx={{ mb: 2, flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <PersonIcon sx={{ fontSize: 20, color: '#64b5f6' }} />
              <Typography variant="body1" sx={{ color: 'white', fontWeight: 'medium' }}>
                {equipo.jugadores?.length || 0} jugadores
              </Typography>
            </Box>
            
            {equipo.createdAt && (
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Creado: {format(new Date(equipo.createdAt), 'dd/MM/yyyy', { locale: es })}
              </Typography>
            )}
          </Box>

          {/* Estadísticas rápidas */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: 2,
            mt: 'auto'
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                {stats.partidos || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Partidos
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                {stats.victorias || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Victorias
              </Typography>
            </Box>
          </Box>
        </CardContent>

        {/* Acciones */}
        <CardActions sx={{ p: 3, pt: 0 }}>
          <Button
            variant="contained" 
            fullWidth
            startIcon={<InfoIcon />}
            onClick={() => onAbrirDetalle(equipo)}
            sx={{
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
              borderRadius: 2,
              py: 1,
              '&:hover': {
                background: 'linear-gradient(45deg, #1976D2 30%, #0277BD 90%)',
                transform: 'translateY(-1px)'
              }
            }}
          >
            Ver Detalles
          </Button>
        </CardActions>
      </Card>
    </motion.div>
  );
};

// 🔥 Componente para mostrar jugadores en el modal (2 por fila)
const JugadoresModalList = ({ jugadores, equipo }) => {
  const jugadorImageUrl = (jugador) => {
    if (!jugador.imagen) return '';
    if (jugador.imagen.startsWith('http://') || jugador.imagen.startsWith('https://')) {
      return jugador.imagen;
    }
    return `${import.meta.env.VITE_BACKEND_URL || ''}/uploads/${jugador.imagen}`;
  };

  if (jugadores.length === 0) {
    return (
      <Box sx={{ 
        p: 4, 
        textAlign: 'center',
        border: '2px dashed rgba(255,255,255,0.2)',
        borderRadius: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.02)'
      }}>
        <PersonIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)', mb: 2 }} />
        <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
          No hay jugadores registrados
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {equipo ? `${equipo.nombre} aún no tiene jugadores asignados` : 'No se encontraron jugadores'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: 2
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2,
        p: 2,
        borderRadius: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon sx={{ color: '#64b5f6' }} />
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
            Roster de {equipo?.nombre || 'Equipo'}
          </Typography>
        </Box>
        <Chip 
          label={`${jugadores.length} jugador${jugadores.length !== 1 ? 'es' : ''}`}
          color="primary"
          variant="outlined"
          size="small"
        />
      </Box>

      {/* Lista de jugadores en flexbox - 2 por fila */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 2,
        justifyContent: 'flex-start'
      }}>
        {jugadores.map((jugador, index) => (
          <motion.div
            key={jugador._id || index}
            variants={{
              hidden: { y: 20, opacity: 0 },
              visible: { 
                y: 0, 
                opacity: 1,
                transition: { duration: 0.4, ease: "easeOut", delay: index * 0.05 }
              }
            }}
            initial="hidden"
            animate="visible"
            style={{ 
              flexBasis: 'calc(50% - 8px)',
              minWidth: '250px'
            }}
          >
            <Card sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              transition: 'all 0.3s ease',
              height: '100%',
              '&:hover': {
                transform: 'translateY(-2px)',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderColor: 'rgba(100, 181, 246, 0.5)'
              }
            }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2
                }}>
                  {/* Avatar del jugador */}
                  <Avatar
                    src={jugadorImageUrl(jugador)}
                    sx={{
                      width: 50,
                      height: 50,
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      flexShrink: 0
                    }}
                  >
                    <PersonIcon />
                  </Avatar>

                  {/* Información del jugador */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        color: 'white', 
                        fontWeight: 'bold',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {jugador.nombre}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      {jugador.numero && jugador.numero !== '?' && (
                        <Chip 
                          label={`#${jugador.numero}`}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(100, 181, 246, 0.2)',
                            color: '#64b5f6',
                            fontWeight: 'bold',
                            minWidth: 40,
                            height: 20,
                            fontSize: '0.75rem'
                          }}
                        />
                      )}
                      
                      {jugador.posicion && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.7)',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            fontSize: '0.7rem'
                          }}
                        >
                          {jugador.posicion}
                        </Typography>
                      )}
                    </Box>
                    
                    {jugador.documento && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.5)',
                          display: 'block',
                          mt: 0.5,
                          fontSize: '0.7rem'
                        }}
                      >
                        Doc: {jugador.documento}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </Box>

      {/* Estadísticas del roster */}
      <Box sx={{ 
        mt: 3,
        p: 2,
        borderRadius: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Typography variant="subtitle2" sx={{ 
          color: '#64b5f6', 
          mb: 2,
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <InfoIcon sx={{ fontSize: 16 }} />
          Estadísticas del Roster
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
              {jugadores.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Jugadores
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
              {jugadores.filter(j => j.numero && j.numero !== '?').length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Con Número
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
              {jugadores.filter(j => j.posicion).length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Con Posición
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

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
  const { puedeGestionarEquipos } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Estados principales
  const [equipos, setEquipos] = useState([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [tabActivo, setTabActivo] = useState(0);

  // Estados de paginación y filtrado
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('nombre_asc');
  const [categoriaActual, setCategoriaActual] = useState(null);

  // Estados de filtros
  const [equipoRecienCreado, setEquipoRecienCreado] = useState(null);

  // 🔥 Obtener equipos de la API
  const obtenerEquipos = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      
      const { data } = await axiosInstance.get('/equipos');
      setEquipos(data);
      
      // Reset página si es necesario
      const totalPaginas = Math.ceil(data.length / itemsPerPage);
      if (currentPage > totalPaginas && totalPaginas > 0) {
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Error al obtener equipos:', error);
      setError('Hubo un problema al cargar los equipos. Intenta nuevamente más tarde.');
    } finally {
      setCargando(false);
    }
  }, [currentPage, itemsPerPage]);

  // Cargar equipos al montar el componente
  useEffect(() => {
    obtenerEquipos();
  }, [obtenerEquipos]);

  // 🔥 Aplicar filtros de búsqueda
  const equiposFiltradosPorBusqueda = useMemo(() => {
    if (!searchTerm.trim()) return equipos;
    
    const termino = searchTerm.toLowerCase().trim();
    return equipos.filter(equipo => 
      equipo.nombre?.toLowerCase().includes(termino) ||
      equipo.categoria?.toLowerCase().includes(termino) ||
      getCategoryName(equipo.categoria)?.toLowerCase().includes(termino)
    );
  }, [equipos, searchTerm]);

  // 🔥 Aplicar ordenamiento
  const equiposOrdenados = useMemo(() => {
    const sortOption = SORT_OPTIONS.find(opt => opt.value === sortBy);
    if (!sortOption) return equiposFiltradosPorBusqueda;

    return [...equiposFiltradosPorBusqueda].sort((a, b) => {
      let valueA, valueB;

      switch (sortOption.field) {
        case 'jugadores':
          valueA = a.jugadores?.length || 0;
          valueB = b.jugadores?.length || 0;
          break;
        case 'createdAt':
          valueA = new Date(a.createdAt || 0);
          valueB = new Date(b.createdAt || 0);
          break;
        default:
          valueA = (a[sortOption.field] || '').toString().toLowerCase();
          valueB = (b[sortOption.field] || '').toString().toLowerCase();
      }

      if (valueA < valueB) {
        return sortOption.order === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortOption.order === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [equiposFiltradosPorBusqueda, sortBy]);

  // 🔥 Paginación de resultados
  const equiposPaginados = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return equiposOrdenados.slice(startIndex, startIndex + itemsPerPage);
  }, [equiposOrdenados, currentPage, itemsPerPage]);

  // 🔥 Cálculos de paginación
  const totalPages = Math.ceil(equiposOrdenados.length / itemsPerPage);
  const hasResults = equiposOrdenados.length > 0;

  // 🔥 Manejar cambio de página
  const handlePageChange = useCallback((event, newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // 🔥 Manejar cambio de items por página
  const handleItemsPerPageChange = useCallback((event) => {
    const newItemsPerPage = event.target.value;
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

  // 🔥 Limpiar búsqueda
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  // 🔥 Funciones del modal
  const abrirDetalleEquipo = useCallback((equipo) => {
    setEquipoSeleccionado(equipo);
    setDetalleAbierto(true);
    setTabActivo(0);
  }, []);

  const cerrarDetalle = useCallback(() => {
    setDetalleAbierto(false);
    setEquipoSeleccionado(null);
    setTabActivo(0);
  }, []);

  // 🔥 Obtener estadísticas
  const obtenerEstadisticas = useCallback(() => {
    const totalEquipos = equipos.length;
    const equiposConJugadores = equipos.filter(e => e.jugadores && e.jugadores.length > 0).length;
    const totalJugadores = equipos.reduce((acc, equipo) => acc + (equipo.jugadores?.length || 0), 0);
    
    // Agrupar por categorías
    const categorias = {};
    equipos.forEach(equipo => {
      const categoria = getCategoryName(equipo.categoria) || 'Sin categoría';
      categorias[categoria] = (categorias[categoria] || 0) + 1;
    });

    return {
      total: totalEquipos,
      conJugadores: equiposConJugadores,
      totalJugadores,
      categorias,
      filtrados: equiposOrdenados.length,
      paginaActual: currentPage,
      totalPaginas: totalPages
    };
  }, [equipos, equiposOrdenados.length, currentPage, totalPages]);

  const stats = obtenerEstadisticas();

  // Reset página si los filtros cambian
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, categoriaActual]);

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
            <Typography color="primary">Gestión de Equipos</Typography>
          </Breadcrumbs>
        </motion.div>

        {/* Header principal */}
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
              <GroupsIcon sx={{ fontSize: { xs: 28, md: 32 } }} />
              Equipos ({stats.total})
            </Typography>

            {/* Botón crear equipo para usuarios con permisos */}
            {puedeGestionarEquipos() && (
              <Button
                component={Link}
                to="/equipos/nuevo"
                variant="contained"
                startIcon={<AddIcon />}
                sx={{
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                  fontSize: { xs: '0.8rem', md: '0.875rem' },
                  px: { xs: 2, md: 3 }
                }}
              >
                {isMobile ? 'Crear' : 'Crear Equipo'}
              </Button>
            )}
          </Box>
        </motion.div>

        {/* Estadísticas generales */}
        <motion.div variants={itemVariants}>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={cardStyle}>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <GroupsIcon sx={{ fontSize: 40, color: '#2196f3', mb: 1 }} />
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Equipos
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={cardStyle}>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <PersonAddIcon sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {stats.totalJugadores}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Jugadores
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={cardStyle}>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <SportsIcon sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {stats.conJugadores}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Con Jugadores
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={cardStyle}>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <EmojiEventsIcon sx={{ fontSize: 40, color: '#f44336', mb: 1 }} />
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {Object.keys(stats.categorias).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Categorías
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
                gap: 2,
                mb: 2,
                flexWrap: 'wrap'
              }}>
                {/* Búsqueda */}
                <TextField
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar equipos por nombre o categoría..."
                  variant="outlined"
                  size="small"
                  sx={{ 
                    minWidth: 300,
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                      '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                      '&.Mui-focused fieldset': { borderColor: '#2196f3' }
                    },
                    '& input': { color: 'white' }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                      <InputAdornment position="end">
                        <IconButton 
                          onClick={clearSearch}
                          size="small"
                          sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                        >
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />

                {/* Controles de ordenamiento y vista */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  {/* Ordenamiento */}
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      sx={{
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.3)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.5)'
                        },
                        '& .MuiSvgIcon-root': { color: 'white' }
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            backgroundColor: 'rgba(20, 20, 40, 0.95)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }
                        }
                      }}
                    >
                      {SORT_OPTIONS.map(option => (
                        <MenuItem 
                          key={option.value} 
                          value={option.value}
                          sx={{ color: 'white' }}
                        >
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Items por página */}
                  <FormControl size="small" sx={{ minWidth: 80 }}>
                    <Select
                      value={itemsPerPage}
                      onChange={handleItemsPerPageChange}
                      sx={{
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.3)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.5)'
                        },
                        '& .MuiSvgIcon-root': { color: 'white' }
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            backgroundColor: 'rgba(20, 20, 40, 0.95)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }
                        }
                      }}
                    >
                      {ITEMS_PER_PAGE_OPTIONS.map(option => (
                        <MenuItem 
                          key={option} 
                          value={option}
                          sx={{ color: 'white' }}
                        >
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Botón de refrescar */}
                  <IconButton
                    onClick={obtenerEquipos}
                    sx={{ 
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderColor: 'rgba(255, 255, 255, 0.5)'
                      }
                    }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Box>
              </Box>

              {/* Segunda fila: Información de resultados */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                pt: 2,
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {hasResults ? (
                    `Mostrando ${equiposPaginados.length} de ${stats.filtrados} equipos${searchTerm ? ` para "${searchTerm}"` : ''}`
                  ) : (
                    searchTerm ? `Sin resultados para "${searchTerm}"` : 'No hay equipos disponibles'
                  )}
                </Typography>
                
                {searchTerm && (
                  <Button
                    onClick={clearSearch}
                    size="small"
                    startIcon={<ClearIcon />}
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&:hover': { color: 'white' }
                    }}
                  >
                    Limpiar
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contenido principal - Lista de equipos */}
        {cargando ? (
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
                  <EquipoCardSkeleton />
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
                onClick={obtenerEquipos}
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
                <GroupsIcon sx={{ fontSize: 60, color: 'gray', mb: 2 }} />
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  {equipos.length === 0 ? 'No hay equipos registrados' : 'No se encontraron equipos con los filtros aplicados'}
                </Typography>
                
                {/* 🔥 FIX: Envolver todo el contenido en un Box para evitar el error de div dentro de p */}
                <Box>
                  <Typography variant="body2" sx={{ color: 'gray', mb: 3 }}>
                    {equipos.length === 0 
                      ? 'Crea el primer equipo para comenzar' 
                      : searchTerm 
                        ? `No hay resultados para "${searchTerm}". Intenta con otros términos de búsqueda.`
                        : 'Intenta cambiar los filtros de búsqueda'
                    }
                  </Typography>
                  
                  {equipos.length === 0 && puedeGestionarEquipos() && (
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
                </Box>
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
              {equiposPaginados.map((equipo, index) => (
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
                      <EquipoCard 
                        equipo={equipo} 
                        onAbrirDetalle={abrirDetalleEquipo}
                        stats={{
                          partidos: 0, // Aquí podrías agregar datos reales de partidos
                          victorias: 0 // Aquí podrías agregar datos reales de victorias
                        }}
                      />
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
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        size="small"
                        sx={{ color: 'white' }}
                      >
                        <ArrowUpwardIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Última página">
                      <IconButton
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        size="small"
                        sx={{ color: 'white' }}
                      >
                        <ArrowDownwardIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </motion.div>
        )}
      </motion.div>

      {/* Modal de detalles del equipo */}
      <Dialog 
        open={detalleAbierto} 
        onClose={cerrarDetalle}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(20, 20, 40, 0.95)',
            backgroundImage: 'linear-gradient(to bottom right, rgba(20, 20, 40, 0.95), rgba(10, 10, 30, 0.98))',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            maxHeight: '90vh'
          }
        }}
      >
      {equipoSeleccionado && (
        <>
          <DialogTitle sx={{ 
            pb: 2,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <EquipoAvatar equipo={equipoSeleccionado} size={60} />
              <Box>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {equipoSeleccionado.nombre}
                </Typography>
                <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {getCategoryName(equipoSeleccionado.categoria)}
                </Typography>
              </Box>
            </Box>
            
            <IconButton 
              onClick={cerrarDetalle}
              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 0 }}>
            {/* Tabs */}
            <Tabs 
              value={tabActivo} 
              onChange={(e, newValue) => setTabActivo(newValue)}
              sx={{ 
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                px: 3,
                '& .MuiTab-root': { 
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-selected': { color: 'white' }
                }
              }}
            >
              <Tab 
                label={`Jugadores (${equipoSeleccionado.jugadores?.length || 0})`}
                icon={<PersonIcon />} 
              />
              <Tab 
                label="Información" 
                icon={<InfoIcon />} 
              />
            </Tabs>

            {/* Contenido de tabs */}
            <Box sx={{ p: 3, maxHeight: '60vh', overflow: 'auto' }}>
              {tabActivo === 0 && (
                <JugadoresModalList 
                  jugadores={equipoSeleccionado.jugadores || []}
                  equipo={equipoSeleccionado}
                />
              )}

              {tabActivo === 1 && (
                <Box>
                  {/* Información básica */}
                  <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 'bold' }}>
                    Información del Equipo
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <Typography variant="subtitle2" sx={{ color: '#64b5f6', mb: 1 }}>
                          Nombre del Equipo
                        </Typography>
                        <Typography variant="h6" sx={{ color: 'white' }}>
                          {equipoSeleccionado.nombre}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <Typography variant="subtitle2" sx={{ color: '#64b5f6', mb: 1 }}>
                          Categoría
                        </Typography>
                        <Typography variant="h6" sx={{ color: 'white' }}>
                          {getCategoryName(equipoSeleccionado.categoria)}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    {equipoSeleccionado.createdAt && (
                      <Grid item xs={12} md={6}>
                        <Box sx={{ 
                          p: 2, 
                          borderRadius: 2, 
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          <Typography variant="subtitle2" sx={{ color: '#64b5f6', mb: 1 }}>
                            Fecha de Creación
                          </Typography>
                          <Typography variant="h6" sx={{ color: 'white' }}>
                            {format(new Date(equipoSeleccionado.createdAt), 'dd/MM/yyyy', { locale: es })}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    
                    <Grid item xs={12} md={6}>
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <Typography variant="subtitle2" sx={{ color: '#64b5f6', mb: 1 }}>
                          Total de Jugadores
                        </Typography>
                        <Typography variant="h6" sx={{ color: 'white' }}>
                          {equipoSeleccionado.jugadores?.length || 0} jugadores
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Estadísticas adicionales del equipo */}
                  {equipoSeleccionado.jugadores && equipoSeleccionado.jugadores.length > 0 && (
                    <Box sx={{ mt: 4 }}>
                      <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
                        Estadísticas del Roster
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ 
                            textAlign: 'center',
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                            border: '1px solid rgba(76, 175, 80, 0.3)'
                          }}>
                            <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                              {equipoSeleccionado.jugadores.length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Total
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ 
                            textAlign: 'center',
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: 'rgba(33, 150, 243, 0.1)',
                            border: '1px solid rgba(33, 150, 243, 0.3)'
                          }}>
                            <Typography variant="h4" sx={{ color: '#2196f3', fontWeight: 'bold' }}>
                              {equipoSeleccionado.jugadores.filter(j => j.numero && j.numero !== '?').length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Con Número
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ 
                            textAlign: 'center',
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: 'rgba(255, 152, 0, 0.1)',
                            border: '1px solid rgba(255, 152, 0, 0.3)'
                          }}>
                            <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                              {equipoSeleccionado.jugadores.filter(j => j.posicion).length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Con Posición
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ 
                            textAlign: 'center',
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: 'rgba(156, 39, 176, 0.1)',
                            border: '1px solid rgba(156, 39, 176, 0.3)'
                          }}>
                            <Typography variant="h4" sx={{ color: '#9c27b0', fontWeight: 'bold' }}>
                              {25 - equipoSeleccionado.jugadores.length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Disponibles
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </DialogContent>

          <DialogActions sx={{ 
            p: 3, 
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            gap: 2,
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {puedeGestionarEquipos() && (
              <>
                <Button
                  component={Link}
                  to={`/equipos/editar/${equipoSeleccionado._id}`}
                  variant="contained"
                  startIcon={<EditIcon />}
                  sx={{
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  }}
                >
                  Editar Equipo
                </Button>
                
                <Button
                  component={Link}
                  to={`/equipos/${equipoSeleccionado._id}/jugadores`}
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  sx={{
                    background: 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)',
                  }}
                  >
                  Registrar Jugadores
                  </Button>
                  </>
                  )}
                  <Button 
                    onClick={cerrarDetalle}
                    variant="outlined"
                    sx={{ 
                      color: 'white',
                      borderColor: 'rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    Cerrar
                  </Button>
                </DialogActions>
              </>
            )}
          </Dialog>

          {/* FAB para crear equipo en móvil */}
          {puedeGestionarEquipos() && isMobile && (
            <Fab
              color="primary"
              component={Link}
              to="/equipos/nuevo"
              sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                boxShadow: '0 4px 20px rgba(33, 150, 243, 0.4)',
                '&:hover': {
                  boxShadow: '0 6px 25px rgba(33, 150, 243, 0.6)',
                }
              }}
            >
              <AddIcon />
            </Fab>
          )}
        </Box>
        );
      }