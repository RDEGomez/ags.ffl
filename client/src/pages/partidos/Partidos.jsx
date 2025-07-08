import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Badge,
  Pagination,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  SportsFootball as SportsFootballIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../config/axios';
import { PartidoCard } from './PartidoCard';
import { ListaPartidosCompacta } from './ListaPartidosCompacta';
import Swal from 'sweetalert2';

// 🔥 Constantes para paginación FRONTEND
const DEFAULT_ITEMS_PER_PAGE = 8; // 2 filas de 4 tarjetas
const ITEMS_PER_PAGE_OPTIONS = [4, 8, 12, 16, 20, 24];

// 🔥 Constantes de filtros
const ESTADOS_PARTIDO = [
  { value: 'todos', label: 'Todos los estados' },
  { value: 'programado', label: 'Programado' },
  { value: 'en_curso', label: 'En Curso' },
  { value: 'medio_tiempo', label: 'Medio Tiempo' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'suspendido', label: 'Suspendido' },
  { value: 'cancelado', label: 'Cancelado' }
];

// 🔥 Categorías disponibles
const CATEGORIAS = [
  { value: 'mixgold', label: 'Mixto Golden' },
  { value: 'mixsilv', label: 'Mixto Silver' },
  { value: 'vargold', label: 'Varonil Golden' },
  { value: 'varsilv', label: 'Varonil Silver' },
  { value: 'femgold', label: 'Femenil Golden' },
  { value: 'femsilv', label: 'Femenil Silver' },
  { value: 'varmast', label: 'Varonil Master' },
  { value: 'femmast', label: 'Femenil Master' },
  { value: 'tocho7v7', label: 'Tocho 7v7' },
  { value: 'u8', label: 'U-8' },
  { value: 'u10', label: 'U-10' },
  { value: 'u12fem', label: 'U-12 Femenil' },
  { value: 'u12var', label: 'U-12 Varonil' },
  { value: 'u14fem', label: 'U-14 Femenil' },
  { value: 'u14var', label: 'U-14 Varonil' },
  { value: 'u16fem', label: 'U-16 Femenil' },
  { value: 'u16var', label: 'U-16 Varonil' },
  { value: 'u18fem', label: 'U-18 Femenil' },
  { value: 'u18var', label: 'U-18 Varonil' }
];

const OPCIONES_ORDENAMIENTO = [
  { value: 'fecha_desc', label: 'Fecha (Más reciente)' },
  { value: 'fecha_asc', label: 'Fecha (Más antigua)' },
  { value: 'equipo_local_asc', label: 'Equipo Local (A-Z)' },
  { value: 'equipo_local_desc', label: 'Equipo Local (Z-A)' },
  { value: 'estado_asc', label: 'Estado (A-Z)' },
  { value: 'estado_desc', label: 'Estado (Z-A)' },
  { value: 'torneo_asc', label: 'Torneo (A-Z)' },
  { value: 'torneo_desc', label: 'Torneo (Z-A)' }
];

// 🔥 Variantes de animación
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
    transition: { duration: 0.5 }
  }
};

// 🔥 Componente de filtros optimizado
const FiltrosAvanzados = ({ 
  searchTerm, 
  setSearchTerm, 
  estadoFiltro, 
  setEstadoFiltro, 
  categoriaFiltro,
  setCategoriaFiltro,
  sortBy, 
  setSortBy,
  onRefresh,
  onClearFilters,
  stats,
  vistaCompacta,
  setVistaCompacta,
  obtenerCategoriasDisponibles
}) => {
  const clearSearch = () => {
    setSearchTerm('');
  };

  const hasActiveFilters = searchTerm || estadoFiltro !== 'todos' || categoriaFiltro;

  return (
    <Paper sx={{
      p: 3,
      mb: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: 3
    }}>
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        flexWrap: 'wrap',
        alignItems: 'stretch', // Cambiar a stretch para misma altura
        justifyContent: 'flex-start', // Distribuir uniformemente
        mb: 2,
        width: '100%' // Usar todo el ancho disponible
      }}>
        {/* Campo de búsqueda */}
        <TextField
          size="small" // Cambiar a size="small" para consistencia
          placeholder="Buscar por equipos, torneo, sede o árbitro..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton onClick={clearSearch} size="small">
                  <ClearIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                </IconButton>
              </InputAdornment>
            ),
            sx: {
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.3)'
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.5)'
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#64b5f6'
              }
            }
          }}
          sx={{
            flex: 1, // Usar flex para que se expanda
            minWidth: 250, // Ancho mínimo
            '& .MuiInputLabel-root': {
              color: 'rgba(255, 255, 255, 0.7)'
            }
          }}
        />

        {/* 🔥 Filtro por Categoría */}
        <FormControl size="small" sx={{ minWidth: 160, flex: '0 0 auto' }}>
          <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Categoría</InputLabel>
          <Select
            value={categoriaFiltro}
            label="Categoría"
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            sx={{
              color: 'white',
              '.MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.3)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#64b5f6',
              },
              '.MuiSelect-icon': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
            }}
          >
            <MenuItem value="">Todas las categorías</MenuItem>
            {obtenerCategoriasDisponibles.map(categoria => (
              <MenuItem key={categoria.value} value={categoria.value}>
                {categoria.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Filtro por Estado */}
        <FormControl size="small" sx={{ minWidth: 160, flex: '0 0 auto' }}>
          <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Estado</InputLabel>
          <Select
            value={estadoFiltro}
            label="Estado"
            onChange={(e) => setEstadoFiltro(e.target.value)}
            sx={{
              color: 'white',
              '.MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.3)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#64b5f6',
              },
              '.MuiSelect-icon': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
            }}
          >
            {ESTADOS_PARTIDO.map(estado => (
              <MenuItem key={estado.value} value={estado.value}>
                {estado.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Filtro de ordenamiento */}
        <FormControl size="small" sx={{ minWidth: 160, flex: '0 0 auto' }}>
          <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Ordenar por</InputLabel>
          <Select
            value={sortBy}
            label="Ordenar por"
            onChange={(e) => setSortBy(e.target.value)}
            sx={{
              color: 'white',
              '.MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.3)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#64b5f6',
              },
              '.MuiSelect-icon': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
            }}
          >
            {OPCIONES_ORDENAMIENTO.map(opcion => (
              <MenuItem key={opcion.value} value={opcion.value}>
                {opcion.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Botón para limpiar filtros */}
        {hasActiveFilters && (
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={onClearFilters}
            sx={{
              color: '#ff5722',
              borderColor: '#ff5722',
              '&:hover': {
                borderColor: '#ff7043',
                backgroundColor: 'rgba(255, 87, 34, 0.1)',
              },
            }}
          >
            Limpiar filtros
          </Button>
        )}
      </Box>

      {/* Chips de filtros activos */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
        {searchTerm && (
          <Chip
            label={`Búsqueda: ${searchTerm}`}
            onDelete={() => setSearchTerm('')}
            sx={{
              backgroundColor: 'rgba(100, 181, 246, 0.2)',
              color: '#64b5f6',
              '& .MuiChip-deleteIcon': {
                color: '#64b5f6',
              },
            }}
          />
        )}
        {categoriaFiltro && (
          <Chip
            label={`Categoría: ${CATEGORIAS.find(c => c.value === categoriaFiltro)?.label || categoriaFiltro}`}
            onDelete={() => setCategoriaFiltro('')}
            sx={{
              backgroundColor: 'rgba(156, 39, 176, 0.2)',
              color: '#9c27b0',
              '& .MuiChip-deleteIcon': {
                color: '#9c27b0',
              },
            }}
          />
        )}
        {estadoFiltro !== 'todos' && (
          <Chip
            label={`Estado: ${ESTADOS_PARTIDO.find(e => e.value === estadoFiltro)?.label || estadoFiltro}`}
            onDelete={() => setEstadoFiltro('todos')}
            sx={{
              backgroundColor: 'rgba(76, 175, 80, 0.2)',
              color: '#4caf50',
              '& .MuiChip-deleteIcon': {
                color: '#4caf50',
              },
            }}
          />
        )}
      </Box>

      {/* Estadísticas */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mt: 2,
        pt: 2,
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Mostrando {stats.filtrados} de {stats.total} partidos
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Actualizar">
            <IconButton onClick={onRefresh} size="small" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={vistaCompacta ? "Vista normal" : "Vista compacta"}>
            <IconButton onClick={() => setVistaCompacta(!vistaCompacta)} size="small" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {vistaCompacta ? <ViewListIcon /> : <ViewModuleIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Paper>
  );
};

// 🔥 Componente principal
export const Partidos = () => {
  const navigate = useNavigate();
  const { puedeGestionarPartidos } = useAuth();

  // Estados principales
  const [todosLosPartidos, setTodosLosPartidos] = useState([]); // 🔥 TODOS los partidos
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vistaCompacta, setVistaCompacta] = useState(false);

  // Estados de paginación FRONTEND
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);

  // Estados de filtrado FRONTEND
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('fecha_desc');
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [categoriaFiltro, setCategoriaFiltro] = useState(''); // 🔥 NUEVO

  // 🔥 Función para obtener categorías disponibles
  const obtenerCategoriasDisponibles = useMemo(() => {
    if (!todosLosPartidos || todosLosPartidos.length === 0) return [];
    
    const categoriasEncontradas = [...new Set(todosLosPartidos.map(partido => partido.categoria))].filter(Boolean);
    return CATEGORIAS.filter(cat => categoriasEncontradas.includes(cat.value));
  }, [todosLosPartidos]);

  // 🔥 FUNCIÓN OPTIMIZADA: Obtener TODOS los partidos una sola vez
  const obtenerTodosLosPartidos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Obteniendo TODOS los partidos para paginación frontend...');
      
      // 🔥 OBTENER TODOS LOS PARTIDOS (límite alto)
      const { data } = await axiosInstance.get('/partidos?limit=2000');
      
      console.log(`✅ Obtenidos ${data.partidos?.length || 0} partidos total`);
      setTodosLosPartidos(data.partidos || []);
      
    } catch (error) {
      console.error('❌ Error al obtener partidos:', error);
      setError('Hubo un problema al cargar los partidos. Intenta nuevamente más tarde.');
    } finally {
      setLoading(false);
    }
  }, []); // 🔥 SIN DEPENDENCIAS - Solo se ejecuta una vez

  // 🔥 Cargar datos al montar el componente
  useEffect(() => {
    obtenerTodosLosPartidos();
  }, [obtenerTodosLosPartidos]);

  // 🔥 OPTIMIZACIÓN: Eliminar partido (actualización local)
  const eliminarPartido = useCallback(async (partidoId) => {
    if (!puedeGestionarPartidos()) {
      Swal.fire({
        icon: 'error',
        title: 'Sin permisos',
        text: 'No tienes permisos para eliminar partidos'
      });
      return;
    }

    try {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: 'No podrás revertir esto! Se eliminará el partido y todos sus datos.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        await axiosInstance.delete(`/partidos/${partidoId}`);
        
        // 🔥 ACTUALIZACIÓN LOCAL - No recargar todos los datos
        setTodosLosPartidos(prev => prev.filter(p => p._id !== partidoId));
        
        Swal.fire({
          title: 'Eliminado!',
          text: 'El partido ha sido eliminado exitosamente.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error al eliminar partido:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al eliminar el partido. Intenta nuevamente.'
      });
    }
  }, [puedeGestionarPartidos]);

  // 🔥 FILTRADO POR BÚSQUEDA Y CATEGORÍA (instantáneo)
  const partidosFiltradosPorBusqueda = useMemo(() => {
    const termino = searchTerm.toLowerCase();
    return todosLosPartidos.filter(partido => {
      const matchesSearch = 
        partido.equipoLocal?.nombre?.toLowerCase().includes(termino) ||
        partido.equipoVisitante?.nombre?.toLowerCase().includes(termino) ||
        partido.torneo?.nombre?.toLowerCase().includes(termino) ||
        partido.sede?.nombre?.toLowerCase().includes(termino) ||
        partido.arbitros?.principal?.usuario?.nombre?.toLowerCase().includes(termino) ||
        partido.arbitros?.backeador?.usuario?.nombre?.toLowerCase().includes(termino) ||
        partido.arbitros?.estadistico?.usuario?.nombre?.toLowerCase().includes(termino);
      
      const matchesCategory = !categoriaFiltro || partido.categoria === categoriaFiltro;
      
      return matchesSearch && matchesCategory;
    });
  }, [todosLosPartidos, searchTerm, categoriaFiltro]);

  // 🔥 FILTRADO POR ESTADO (instantáneo)
  const partidosFiltrados = useMemo(() => {
    if (estadoFiltro === 'todos') return partidosFiltradosPorBusqueda;
    return partidosFiltradosPorBusqueda.filter(partido => partido.estado === estadoFiltro);
  }, [partidosFiltradosPorBusqueda, estadoFiltro]);

  // 🔥 ORDENAMIENTO (instantáneo)
  const partidosOrdenados = useMemo(() => {
    return [...partidosFiltrados].sort((a, b) => {
      switch (sortBy) {
        case 'fecha_desc':
          return new Date(b.fechaHora) - new Date(a.fechaHora);
        case 'fecha_asc':
          return new Date(a.fechaHora) - new Date(b.fechaHora);
        case 'equipo_local_asc':
          return (a.equipoLocal?.nombre || '').localeCompare(b.equipoLocal?.nombre || '');
        case 'equipo_local_desc':
          return (b.equipoLocal?.nombre || '').localeCompare(a.equipoLocal?.nombre || '');
        case 'estado_asc':
          return (a.estado || '').localeCompare(b.estado || '');
        case 'estado_desc':
          return (b.estado || '').localeCompare(a.estado || '');
        case 'torneo_asc':
          return (a.torneo?.nombre || '').localeCompare(b.torneo?.nombre || '');
        case 'torneo_desc':
          return (b.torneo?.nombre || '').localeCompare(a.torneo?.nombre || '');
        default:
          return 0;
      }
    });
  }, [partidosFiltrados, sortBy]);

  // 🔥 PAGINACIÓN FRONTEND (instantánea)
  const partidosPaginados = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return partidosOrdenados.slice(startIndex, startIndex + itemsPerPage);
  }, [partidosOrdenados, currentPage, itemsPerPage]);

  // 🔥 CÁLCULOS DE PAGINACIÓN
  const totalPages = Math.ceil(partidosOrdenados.length / itemsPerPage);
  const hasResults = partidosOrdenados.length > 0;

  // 🔥 FUNCIÓN PARA LIMPIAR FILTROS
  const limpiarFiltros = useCallback(() => {
    setSearchTerm('');
    setEstadoFiltro('todos');
    setCategoriaFiltro('');
    setCurrentPage(1);
  }, []);

  // 🔥 VERIFICAR SI HAY FILTROS ACTIVOS
  const hasActiveFilters = searchTerm || estadoFiltro !== 'todos' || categoriaFiltro;

  // 🔥 RESETEAR PÁGINA CUANDO CAMBIAN LOS FILTROS
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, estadoFiltro, categoriaFiltro]);

  // 🔥 MANEJAR CAMBIO DE PÁGINA
  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 🔥 MANEJAR CAMBIO DE ITEMS POR PÁGINA
  const handleItemsPerPageChange = (event) => {
    setItemsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  // 🔥 RENDERIZADO CONDICIONAL
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} sx={{ color: '#64b5f6' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={obtenerTodosLosPartidos}
          startIcon={<RefreshIcon />}
          sx={{ mt: 2 }}
        >
          Reintentar
        </Button>
      </Box>
    );
  }

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
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SportsFootballIcon sx={{ fontSize: 40, color: '#64b5f6' }} />
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
              Partidos
            </Typography>
            <Badge 
              badgeContent={partidosOrdenados.length} 
              color="primary"
              sx={{ 
                '& .MuiBadge-badge': { 
                  backgroundColor: '#64b5f6',
                  color: 'white',
                  fontWeight: 'bold'
                }
              }}
            />
          </Box>
          
          {puedeGestionarPartidos() && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/partidos/crear')}
              sx={{
                backgroundColor: '#64b5f6',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#5a9fd8'
                }
              }}
            >
              Crear Partido
            </Button>
          )}
        </Box>

        {/* Filtros */}
        <FiltrosAvanzados
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          estadoFiltro={estadoFiltro}
          setEstadoFiltro={setEstadoFiltro}
          categoriaFiltro={categoriaFiltro}
          setCategoriaFiltro={setCategoriaFiltro}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onRefresh={obtenerTodosLosPartidos}
          onClearFilters={limpiarFiltros}
          stats={{
            total: todosLosPartidos.length,
            filtrados: partidosOrdenados.length,
            programados: todosLosPartidos.filter(p => p.estado === 'programado').length,
            enCurso: todosLosPartidos.filter(p => p.estado === 'en_curso').length,
            finalizados: todosLosPartidos.filter(p => p.estado === 'finalizado').length
          }}
          vistaCompacta={vistaCompacta}
          setVistaCompacta={setVistaCompacta}
          obtenerCategoriasDisponibles={obtenerCategoriasDisponibles}
        />

        {/* Contenido principal */}
        <AnimatePresence mode="wait">
          {!hasResults ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Paper sx={{
                p: 6,
                textAlign: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 3
              }}>
                <SportsFootballIcon sx={{ fontSize: 80, color: 'rgba(255, 255, 255, 0.3)', mb: 2 }} />
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  {hasActiveFilters ? 'No se encontraron partidos con los filtros aplicados' : 'No hay partidos disponibles'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
                  {hasActiveFilters ? 'Prueba ajustando los filtros para encontrar más resultados' : 'Comienza creando tu primer partido'}
                </Typography>
                {hasActiveFilters && (
                  <Button
                    variant="outlined"
                    onClick={limpiarFiltros}
                    sx={{
                      color: '#64b5f6',
                      borderColor: '#64b5f6',
                      '&:hover': {
                        borderColor: '#5a9fd8',
                        backgroundColor: 'rgba(100, 181, 246, 0.1)'
                      }
                    }}
                  >
                    Limpiar filtros
                  </Button>
                )}
              </Paper>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Lista de partidos */}
              {vistaCompacta ? (
                <ListaPartidosCompacta
                  partidos={partidosPaginados}
                  onEliminar={eliminarPartido}
                />
              ) : (
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(auto-fit, minmax(350px, 1fr))',
                    md: 'repeat(auto-fit, minmax(400px, 1fr))',
                    lg: 'repeat(auto-fit, minmax(450px, 1fr))'
                  },
                  gap: 3,
                  mb: 4
                }}>
                  <AnimatePresence>
                    {partidosPaginados.map((partido, index) => (
                      <motion.div
                        key={partido._id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        transition={{ delay: index * 0.1 }}
                      >
                        <PartidoCard
                          partido={partido}
                          eliminarPartido={eliminarPartido}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </Box>
              )}

              {/* Paginación */}
              {totalPages > 1 && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  gap: 3,
                  mt: 4,
                  p: 3,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  {/* Información de página */}
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 'medium' }}>
                    Página {currentPage} de {totalPages} - Mostrando {partidosPaginados.length} de {partidosOrdenados.length} partidos
                  </Typography>

                  {/* Paginación */}
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
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

                  {/* Selector de items por página */}
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
                        '.MuiSelect-icon': {
                          color: 'rgba(255, 255, 255, 0.7)',
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
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Box>
  );
};