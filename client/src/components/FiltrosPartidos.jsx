import { useEffect, useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  Button
} from '@mui/material';
import {
  Clear as ClearIcon,
  CalendarToday as CalendarIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axiosInstance from '../config/axios';
import { getCategoryName } from '../helpers/mappings';

// 🔥 Opciones de estados de partido con colores
const estadosPartido = [
  { value: 'programado', label: 'Programado', color: '#2196f3' },
  { value: 'en_curso', label: 'En Curso', color: '#4caf50' },
  { value: 'medio_tiempo', label: 'Medio Tiempo', color: '#ff9800' },
  { value: 'finalizado', label: 'Finalizado', color: '#9e9e9e' },
  { value: 'suspendido', label: 'Suspendido', color: '#f44336' },
  { value: 'cancelado', label: 'Cancelado', color: '#f44336' }
];

// 🔥 Opciones de categorías
const categorias = [
  { value: 'mixgold', label: 'Mixto Golden' },
  { value: 'mixsilv', label: 'Mixto Silver' },
  { value: 'vargold', label: 'Varonil Golden' },
  { value: 'varsilv', label: 'Varonil Silver' },
  { value: 'femgold', label: 'Femenil Golden' },
  { value: 'femsilv', label: 'Femenil Silver' },
  { value: 'varmast', label: 'Varonil Master' },
  { value: 'femmast', label: 'Femenil Master' }
];

// 🔥 Opciones de filtros rápidos por fecha
const filtrosFechaRapidos = [
  { value: 'hoy', label: 'Hoy' },
  { value: 'manana', label: 'Mañana' },
  { value: 'esta_semana', label: 'Esta Semana' },
  { value: 'proximo_mes', label: 'Próximo Mes' }
];

export const FiltrosPartidos = ({ partidos, setFiltrados }) => {
  // Estados de filtros
  const [torneoId, setTorneoId] = useState('');
  const [equipoId, setEquipoId] = useState('');
  const [categoria, setCategoria] = useState('');
  const [estado, setEstado] = useState('');
  const [fecha, setFecha] = useState('');
  const [filtroFechaRapido, setFiltroFechaRapido] = useState('');

  // Estados de datos
  const [torneosDisponibles, setTorneosDisponibles] = useState([]);
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔥 Cargar torneos disponibles
  useEffect(() => {
    const cargarTorneos = async () => {
      try {
        const { data } = await axiosInstance.get('/torneos');
        setTorneosDisponibles(data.torneos || []);
      } catch (error) {
        console.error('Error al cargar torneos:', error);
      }
    };
    cargarTorneos();
  }, []);

  // 🔥 Cargar equipos disponibles
  useEffect(() => {
    const cargarEquipos = async () => {
      try {
        const { data } = await axiosInstance.get('/equipos');
        setEquiposDisponibles(data || []);
      } catch (error) {
        console.error('Error al cargar equipos:', error);
      }
    };
    cargarEquipos();
  }, []);

  // 🔥 Función helper para obtener fecha según filtro rápido
  const obtenerFechaPorFiltroRapido = (filtro) => {
    const hoy = new Date();
    
    switch (filtro) {
      case 'hoy':
        return hoy.toISOString().split('T')[0];
      case 'manana':
        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);
        return manana.toISOString().split('T')[0];
      case 'esta_semana':
        // Retorna el rango de la semana actual (lunes a domingo)
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay() + 1);
        return inicioSemana.toISOString().split('T')[0];
      case 'proximo_mes':
        const proximoMes = new Date(hoy);
        proximoMes.setMonth(proximoMes.getMonth() + 1);
        proximoMes.setDate(1);
        return proximoMes.toISOString().split('T')[0];
      default:
        return '';
    }
  };

  // 🔥 Función de filtrado avanzado
  useEffect(() => {
    let filtrados = [...partidos];

    // Filtro por torneo
    if (torneoId) {
      filtrados = filtrados.filter(partido => 
        partido.torneo && partido.torneo._id === torneoId
      );
    }

    // Filtro por equipo (local o visitante)
    if (equipoId) {
      filtrados = filtrados.filter(partido =>
        (partido.equipoLocal && partido.equipoLocal._id === equipoId) ||
        (partido.equipoVisitante && partido.equipoVisitante._id === equipoId)
      );
    }

    // Filtro por categoría
    if (categoria) {
      filtrados = filtrados.filter(partido => 
        partido.categoria === categoria
      );
    }

    // Filtro por estado
    if (estado) {
      filtrados = filtrados.filter(partido => 
        partido.estado === estado
      );
    }

    // Filtro por fecha específica
    if (fecha) {
      filtrados = filtrados.filter(partido => {
        if (!partido.fechaHora) return false;
        const fechaPartido = new Date(partido.fechaHora).toISOString().split('T')[0];
        return fechaPartido === fecha;
      });
    }

    // Filtro por fecha rápida
    if (filtroFechaRapido && !fecha) {
      const hoy = new Date();
      
      filtrados = filtrados.filter(partido => {
        if (!partido.fechaHora) return false;
        const fechaPartido = new Date(partido.fechaHora);
        
        switch (filtroFechaRapido) {
          case 'hoy':
            return fechaPartido.toDateString() === hoy.toDateString();
          case 'manana':
            const manana = new Date(hoy);
            manana.setDate(manana.getDate() + 1);
            return fechaPartido.toDateString() === manana.toDateString();
          case 'esta_semana':
            const inicioSemana = new Date(hoy);
            inicioSemana.setDate(hoy.getDate() - hoy.getDay() + 1);
            inicioSemana.setHours(0, 0, 0, 0);
            const finSemana = new Date(inicioSemana);
            finSemana.setDate(finSemana.getDate() + 6);
            finSemana.setHours(23, 59, 59, 999);
            return fechaPartido >= inicioSemana && fechaPartido <= finSemana;
          case 'proximo_mes':
            const proximoMes = new Date(hoy);
            proximoMes.setMonth(proximoMes.getMonth() + 1);
            return fechaPartido.getMonth() === proximoMes.getMonth() && 
                   fechaPartido.getFullYear() === proximoMes.getFullYear();
          default:
            return true;
        }
      });
    }

    setFiltrados(filtrados);
  }, [torneoId, equipoId, categoria, estado, fecha, filtroFechaRapido, partidos, setFiltrados]);

  // 🔥 Función para limpiar todos los filtros
  const limpiarFiltros = () => {
    setTorneoId('');
    setEquipoId('');
    setCategoria('');
    setEstado('');
    setFecha('');
    setFiltroFechaRapido('');
  };

  // 🔥 Verificar si hay filtros activos
  const hayFiltrosActivos = torneoId || equipoId || categoria || estado || fecha || filtroFechaRapido;

  // 🔥 Filtrar equipos según la categoría seleccionada (si hay)
  const equiposFiltrados = categoria
    ? equiposDisponibles.filter(equipo => equipo.categoria === categoria)
    : equiposDisponibles;

  return (
    <Box sx={{ 
      display: 'flex', 
      gap: 2, 
      alignItems: 'center',
      flexWrap: 'wrap',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 2,
      p: 2,
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      {/* Icono de filtros */}
      <FilterListIcon sx={{ color: '#64b5f6', mr: 1 }} />

      {/* Filtro por torneo */}
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Torneo</InputLabel>
        <Select
          value={torneoId}
          label="Torneo"
          onChange={(e) => setTorneoId(e.target.value)}
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
          <MenuItem value="">Todos los torneos</MenuItem>
          {torneosDisponibles.map(torneo => (
            <MenuItem key={torneo._id} value={torneo._id}>
              {torneo.nombre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Filtro por categoría */}
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Categoría</InputLabel>
        <Select
          value={categoria}
          label="Categoría"
          onChange={(e) => {
            setCategoria(e.target.value);
            setEquipoId(''); // Limpiar equipo cuando cambia categoría
          }}
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
          <MenuItem value="">Todas las categorías</MenuItem>
          {categorias.map(cat => (
            <MenuItem key={cat.value} value={cat.value}>
              {cat.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Filtro por equipo */}
      <FormControl 
        size="small" 
        sx={{ minWidth: 200 }}
        disabled={categoria && equiposFiltrados.length === 0}
      >
        <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Equipo</InputLabel>
        <Select
          value={equipoId}
          label="Equipo"
          onChange={(e) => setEquipoId(e.target.value)}
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
          <MenuItem value="">Todos los equipos</MenuItem>
          {equiposFiltrados.map(equipo => (
            <MenuItem key={equipo._id} value={equipo._id}>
              {`${equipo.nombre} (${getCategoryName(equipo.categoria)})`}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Filtro por estado */}
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Estado</InputLabel>
        <Select
          value={estado}
          label="Estado"
          onChange={(e) => setEstado(e.target.value)}
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
          <MenuItem value="">Todos los estados</MenuItem>
          {estadosPartido.map(est => (
            <MenuItem key={est.value} value={est.value}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box 
                  sx={{ 
                    width: 12, 
                    height: 12, 
                    borderRadius: '50%', 
                    backgroundColor: est.color 
                  }} 
                />
                {est.label}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Filtros rápidos de fecha */}
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Fecha Rápida</InputLabel>
        <Select
          value={filtroFechaRapido}
          label="Fecha Rápida"
          onChange={(e) => {
            setFiltroFechaRapido(e.target.value);
            setFecha(''); // Limpiar fecha específica
          }}
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
          <MenuItem value="">Sin filtro</MenuItem>
          {filtrosFechaRapidos.map(filtro => (
            <MenuItem key={filtro.value} value={filtro.value}>
              {filtro.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Filtro por fecha específica */}
      <TextField
        label="Fecha Específica"
        type="date"
        size="small"
        value={fecha}
        onChange={(e) => {
          setFecha(e.target.value);
          setFiltroFechaRapido(''); // Limpiar filtro rápido
        }}
        InputLabelProps={{
          shrink: true,
          sx: { color: 'rgba(255, 255, 255, 0.7)' }
        }}
        sx={{
          minWidth: 160,
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
          startAdornment: <CalendarIcon sx={{ color: '#64b5f6', mr: 1 }} />
        }}
      />

      {/* Botón de limpiar filtros */}
      {hayFiltrosActivos && (
        <Tooltip title="Limpiar todos los filtros">
          <IconButton
            onClick={limpiarFiltros}
            sx={{
              backgroundColor: 'rgba(244, 67, 54, 0.1)',
              color: '#f44336',
              '&:hover': {
                backgroundColor: 'rgba(244, 67, 54, 0.2)',
                transform: 'scale(1.1)'
              }
            }}
          >
            <ClearIcon />
          </IconButton>
        </Tooltip>
      )}

      {/* Indicador de filtros activos */}
      {hayFiltrosActivos && (
        <Chip
          label={`${partidos.length - (setFiltrados.length || 0)} filtros activos`}
          size="small"
          color="primary"
          variant="outlined"
          sx={{
            borderColor: '#64b5f6',
            color: '#64b5f6'
          }}
        />
      )}
    </Box>
  );
};