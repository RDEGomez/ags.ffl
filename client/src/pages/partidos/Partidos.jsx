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
  sortBy, 
  setSortBy,
  onRefresh,
  onClearFilters,
  stats,
  vistaCompacta,
  setVistaCompacta
}) => {
  const clearSearch = () => {
    setSearchTerm('');
  };

  const hasActiveFilters = searchTerm || estadoFiltro !== 'todos';

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
        alignItems: 'center',
        mb: 2
      }}>
        {/* Campo de búsqueda */}
        <TextField
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
              }
            }
          }}
          sx={{ 
            flexGrow: 1,
            minWidth: '300px',
            '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
          }}
        />

        {/* Filtro por estado */}
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Estado</InputLabel>
          <Select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            label="Estado"
            sx={{
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.3)'
              },
              '& .MuiSvgIcon-root': {
                color: 'rgba(255, 255, 255, 0.7)'
              }
            }}
          >
            {ESTADOS_PARTIDO.map(estado => (
              <MenuItem key={estado.value} value={estado.value}>
                {estado.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Ordenamiento */}
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Ordenar por</InputLabel>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            label="Ordenar por"
            sx={{
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.3)'
              },
              '& .MuiSvgIcon-root': {
                color: 'rgba(255, 255, 255, 0.7)'
              }
            }}
          >
            {OPCIONES_ORDENAMIENTO.map(opcion => (
              <MenuItem key={opcion.value} value={opcion.value}>
                {opcion.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Toggle vista */}
        <Tooltip title={vistaCompacta ? "Vista de tarjetas" : "Vista compacta"}>
          <IconButton
            onClick={() => setVistaCompacta(!vistaCompacta)}
            sx={{
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)'
              }
            }}
          >
            {vistaCompacta ? <ViewModuleIcon /> : <ViewListIcon />}
          </IconButton>
        </Tooltip>

        {/* Botón de refrescar */}
        <Tooltip title="Actualizar partidos">
          <IconButton 
            onClick={onRefresh}
            sx={{ 
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)'
              }
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>

        {/* Botón limpiar filtros */}
        {hasActiveFilters && (
          <Tooltip title="Limpiar filtros">
            <IconButton
              onClick={onClearFilters}
              sx={{
                color: '#f44336',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(244, 67, 54, 0.2)'
                }
              }}
            >
              <ClearIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Estadísticas de filtros */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        flexWrap: 'wrap'
      }}>
        <Chip 
          label={`Total: ${stats.total}`} 
          variant="outlined" 
          sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}
        />
        <Chip 
          label={`Programados: ${stats.programados}`} 
          variant="outlined" 
          sx={{ color: '#ffeb3b', borderColor: '#ffeb3b' }}
        />
        <Chip 
          label={`En Curso: ${stats.enCurso}`} 
          variant="outlined" 
          sx={{ color: '#4caf50', borderColor: '#4caf50' }}
        />
        <Chip 
          label={`Finalizados: ${stats.finalizados}`} 
          variant="outlined" 
          sx={{ color: '#2196f3', borderColor: '#2196f3' }}
        />
        <Chip 
          label={`Cancelados: ${stats.cancelados}`} 
          variant="outlined" 
          sx={{ color: '#f44336', borderColor: '#f44336' }}
        />
        {/* 🔥 NUEVO: Mostrar filtrados */}
        {stats.filtrados !== stats.total && (
          <Chip 
            label={`Mostrando: ${stats.filtrados}`} 
            variant="filled" 
            sx={{ 
              backgroundColor: '#64b5f6', 
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        )}
      </Box>
    </Paper>
  );
};

// 🔥 Componente principal OPTIMIZADO
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
        // 🔥 ELIMINAR EN BACKEND
        await axiosInstance.delete(`/partidos/${partidoId}`);
        
        // 🔥 ACTUALIZACIÓN LOCAL INMEDIATA (UX instantáneo)
        setTodosLosPartidos(prev => prev.filter(p => p._id !== partidoId));
        
        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'El partido ha sido eliminado correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('❌ Error al eliminar partido:', error);
      setError('Error al eliminar el partido');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al eliminar el partido'
      });
    }
  }, [puedeGestionarPartidos]);

  // 🔥 FILTRADO EN TIEMPO REAL (super rápido)
  const partidosFiltradosPorBusqueda = useMemo(() => {
    if (!searchTerm.trim()) return todosLosPartidos;
    
    const termino = searchTerm.toLowerCase();
    return todosLosPartidos.filter(partido => 
      partido.equipoLocal?.nombre?.toLowerCase().includes(termino) ||
      partido.equipoVisitante?.nombre?.toLowerCase().includes(termino) ||
      partido.torneo?.nombre?.toLowerCase().includes(termino) ||
      partido.sede?.nombre?.toLowerCase().includes(termino) ||
      partido.arbitros?.principal?.usuario?.nombre?.toLowerCase().includes(termino) ||
      partido.arbitros?.backeador?.usuario?.nombre?.toLowerCase().includes(termino) ||
      partido.arbitros?.estadistico?.usuario?.nombre?.toLowerCase().includes(termino)
    );
  }, [todosLosPartidos, searchTerm]);

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
  const totalPartidos = partidosOrdenados.length;
  const totalPages = Math.ceil(totalPartidos / itemsPerPage);

  // 🔥 RESETEAR PÁGINA cuando cambien filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, estadoFiltro, sortBy]);

  // 🔥 HANDLERS OPTIMIZADOS
  const handlePageChange = useCallback((event, newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleItemsPerPageChange = useCallback((event) => {
    const newItemsPerPage = event.target.value;
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setEstadoFiltro('todos');
    setCurrentPage(1);
  }, []);

  // 🔥 ESTADÍSTICAS EN TIEMPO REAL
  const stats = useMemo(() => {
    const total = todosLosPartidos.length;
    const filtrados = partidosFiltrados.length;
    
    return {
      total,
      filtrados,
      programados: todosLosPartidos.filter(p => p.estado === 'programado').length,
      enCurso: todosLosPartidos.filter(p => p.estado === 'en_curso').length,
      finalizados: todosLosPartidos.filter(p => p.estado === 'finalizado').length,
      cancelados: todosLosPartidos.filter(p => p.estado === 'cancelado').length
    };
  }, [todosLosPartidos, partidosFiltrados]);

  // 🔥 LOADING STATE
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={60} sx={{ color: '#64b5f6' }} />
        <Typography variant="h6" sx={{ color: 'white' }}>
          Cargando {todosLosPartidos.length > 0 ? `${todosLosPartidos.length} partidos...` : 'partidos...'}
        </Typography>
      </Box>
    );
  }

  // 🔥 ERROR STATE
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={obtenerTodosLosPartidos}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
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
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', md: 'center' },
            mb: 4,
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SportsFootballIcon sx={{ fontSize: 40, color: '#64b5f6' }} />
              <Box>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  Gestión de Partidos
                </Typography>
                <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {stats.total} partidos registrados
                  {stats.filtrados !== stats.total && (
                    <span style={{ color: '#64b5f6' }}> • {stats.filtrados} mostrados</span>
                  )}
                </Typography>
              </Box>
            </Box>

            {puedeGestionarPartidos() && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/partidos/crear')}
                sx={{
                  backgroundColor: '#64b5f6',
                  '&:hover': { backgroundColor: '#5a9fd8' },
                  borderRadius: 2,
                  px: 3
                }}
              >
                Nuevo Partido
              </Button>
            )}
          </Box>
        </motion.div>

        {/* Filtros */}
        <motion.div variants={itemVariants}>
          <FiltrosAvanzados
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            estadoFiltro={estadoFiltro}
            setEstadoFiltro={setEstadoFiltro}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onRefresh={obtenerTodosLosPartidos}
            onClearFilters={handleClearFilters}
            stats={stats}
            vistaCompacta={vistaCompacta}
            setVistaCompacta={setVistaCompacta}
          />
        </motion.div>

        {/* Lista de partidos */}
        <AnimatePresence mode="wait">
          {partidosPaginados.length === 0 ? (
            <motion.div
              key="no-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Paper sx={{
                p: 6,
                textAlign: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 3
              }}>
                <SportsFootballIcon sx={{ fontSize: 80, color: 'rgba(255, 255, 255, 0.3)', mb: 2 }} />
                <Typography variant="h5" sx={{ color: 'white', mb: 1 }}>
                  {searchTerm || estadoFiltro !== 'todos' ? 'No se encontraron partidos' : 'No hay partidos registrados'}
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
                  {searchTerm || estadoFiltro !== 'todos' 
                    ? 'Intenta modificar los filtros de búsqueda'
                    : 'Comienza creando tu primer partido'
                  }
                </Typography>
                {(searchTerm || estadoFiltro !== 'todos') && (
                  <Button
                    variant="outlined"
                    onClick={handleClearFilters}
                    sx={{ 
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      color: 'white',
                      '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
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
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {vistaCompacta ? (
                <ListaPartidosCompacta 
                  partidos={partidosPaginados}
                  eliminarPartido={eliminarPartido}
                />
              ) : (
                /* 🔥 Layout con Flexbox - 4 tarjetas por fila */
                <Box sx={{ 
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 3,
                  justifyContent: 'flex-start'
                }}>
                  <AnimatePresence>
                    {partidosPaginados.map((partido, index) => (
                      <Box
                        key={partido._id}
                        sx={{
                          // 🔥 FLEXBOX: 4 tarjetas por fila en desktop, responsive en móvil
                          flexBasis: {
                            xs: '100%',           // 1 por fila en móvil
                            sm: 'calc(50% - 12px)', // 2 por fila en tablet
                            md: 'calc(50% - 12px)', // 2 por fila en desktop pequeño
                            lg: 'calc(25% - 18px)', // 4 por fila en desktop grande
                            xl: 'calc(25% - 18px)'  // 4 por fila en desktop muy grande
                          },
                          // 🔥 ALTURA UNIFORME: Todas las tarjetas tienen la misma altura
                          minHeight: '400px',
                          display: 'flex'
                        }}
                      >
                        <motion.div
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          transition={{ delay: index * 0.05 }}
                          style={{ 
                            width: '100%',
                            display: 'flex'
                          }}
                        >
                          <Box sx={{ 
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column'
                          }}>
                            <PartidoCard 
                              partido={partido} 
                              eliminarPartido={eliminarPartido}
                            />
                          </Box>
                        </motion.div>
                      </Box>
                    ))}
                  </AnimatePresence>
                </Box>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🔥 Paginación FRONTEND optimizada */}
        {totalPages > 1 && (
          <motion.div
            variants={itemVariants}
            transition={{ delay: 0.3 }}
          >
            <Paper
              sx={{
                mt: 6,
                p: 4,
                background: 'linear-gradient(145deg, rgba(0,0,0,0.6), rgba(0,0,0,0.4))',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 4
              }}
            >
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 3
              }}>
                {/* Info de página */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Typography variant="body1" sx={{ 
                    color: 'white', 
                    fontWeight: 'medium',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <Badge 
                      badgeContent={totalPartidos} 
                      color="primary" 
                      sx={{ '& .MuiBadge-badge': { background: 'linear-gradient(45deg, #64b5f6, #42a5f5)' } }}
                    >
                      <SportsFootballIcon sx={{ color: '#64b5f6' }} />
                    </Badge>
                    {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalPartidos)} de {totalPartidos}
                  </Typography>
                  
                  {/* Items por página */}
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Por página</InputLabel>
                   <Select
                     value={itemsPerPage}
                     onChange={handleItemsPerPageChange}
                     label="Por página"
                     sx={{
                       color: 'white',
                       '& .MuiOutlinedInput-notchedOutline': {
                         borderColor: 'rgba(255, 255, 255, 0.3)'
                       },
                       '& .MuiSvgIcon-root': {
                         color: 'rgba(255, 255, 255, 0.7)'
                       }
                     }}
                   >
                     {ITEMS_PER_PAGE_OPTIONS.map(option => (
                       <MenuItem key={option} value={option}>{option}</MenuItem>
                     ))}
                   </Select>
                 </FormControl>
               </Box>

               {/* Paginación */}
               <Box sx={{ 
                 display: 'flex', 
                 alignItems: 'center', 
                 gap: 3,
                 flexWrap: 'wrap',
                 justifyContent: 'center'
               }}>
                 {/* Información de página */}
                 <Typography variant="body2" sx={{ color: 'white', fontWeight: 'medium' }}>
                   Página {currentPage} de {totalPages}
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
             </Box>
           </Paper>
         </motion.div>
       )}
     </motion.div>
   </Box>
 );
};