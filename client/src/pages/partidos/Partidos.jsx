import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axiosInstance from '../../config/axios';
import { PartidoCard } from './PartidoCard';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { getCategoryName } from '../../helpers/mappings';

import {
  Box,
  IconButton,
  Typography,
  Fab,
  Alert,
  Breadcrumbs,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Grid,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Skeleton,
  Card,
  CardContent,
  TextField,
  Chip,
  Stack,
  Badge,
  Avatar,
  Divider
} from '@mui/material';

import {
  Add as AddIcon,
  SportsFootball as SportsFootballIcon,
  GridView as GridViewIcon,
  ViewStream as ViewStreamIcon,
  Refresh as RefreshIcon,
  NavigateNext as NavigateNextIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  Stadium as StadiumIcon,
  Groups as GroupsIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pause as PauseIcon,
  LocationOn as LocationIcon,
  Gavel as GavelIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';

import { ListaPartidosCompacta } from './ListaPartidosCompacta';

const ITEMS_PER_PAGE_OPTIONS = [10, 15, 20, 50];

// 🎨 Configuración de estados con colores épicos
const estadosConfig = {
  programado: { 
    color: '#2196f3', 
    bgColor: 'rgba(33, 150, 243, 0.1)', 
    label: 'Programado',
    icon: <ScheduleIcon />,
    borderColor: 'rgba(33, 150, 243, 0.3)'
  },
  en_curso: { 
    color: '#4caf50', 
    bgColor: 'rgba(76, 175, 80, 0.1)', 
    label: 'En Curso',
    icon: <PlayArrowIcon />,
    borderColor: 'rgba(76, 175, 80, 0.3)'
  },
  medio_tiempo: { 
    color: '#ff9800', 
    bgColor: 'rgba(255, 152, 0, 0.1)', 
    label: 'Medio Tiempo',
    icon: <PauseIcon />,
    borderColor: 'rgba(255, 152, 0, 0.3)'
  },
  finalizado: { 
    color: '#9e9e9e', 
    bgColor: 'rgba(158, 158, 158, 0.1)', 
    label: 'Finalizado',
    icon: <CheckCircleIcon />,
    borderColor: 'rgba(158, 158, 158, 0.3)'
  },
  suspendido: { 
    color: '#f44336', 
    bgColor: 'rgba(244, 67, 54, 0.1)', 
    label: 'Suspendido',
    icon: <CancelIcon />,
    borderColor: 'rgba(244, 67, 54, 0.3)'
  },
  cancelado: { 
    color: '#f44336', 
    bgColor: 'rgba(244, 67, 54, 0.1)', 
    label: 'Cancelado',
    icon: <CancelIcon />,
    borderColor: 'rgba(244, 67, 54, 0.3)'
  }
};

// 🔥 Opciones de categorías con colores
const categorias = [
  { value: 'mixgold', label: 'Mixto Golden', color: '#ffd700' },
  { value: 'mixsilv', label: 'Mixto Silver', color: '#c0c0c0' },
  { value: 'vargold', label: 'Varonil Golden', color: '#ffd700' },
  { value: 'varsilv', label: 'Varonil Silver', color: '#c0c0c0' },
  { value: 'femgold', label: 'Femenil Golden', color: '#ffd700' },
  { value: 'femsilv', label: 'Femenil Silver', color: '#c0c0c0' },
  { value: 'varmast', label: 'Varonil Master', color: '#8e24aa' },
  { value: 'femmast', label: 'Femenil Master', color: '#8e24aa' },
  { value: 'tocho7v7', label: 'Tocho 7v7', color: '#ff5722' }
];

// 🎯 Componente épico de tarjeta de partido
const EpicPartidoCard = ({ partido, onEliminar }) => {
  const { puedeGestionarTorneos } = useAuth();
  const estadoConfig = estadosConfig[partido.estado] || estadosConfig.programado;
  
  const formatearFecha = (fecha) => {
    if (!fecha) return 'Fecha TBD';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', { 
      weekday: 'short',
      day: '2-digit', 
      month: 'short',
      year: 'numeric'
    });
  };

  const formatearHora = (fecha) => {
    if (!fecha) return 'Hora TBD';
    const date = new Date(fecha);
    return date.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getImageUrl = (imagen) => {
    if (!imagen) return '';
    if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
      return imagen;
    }
    return `${import.meta.env.VITE_BACKEND_URL || ''}/uploads/${imagen}`;
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card
        sx={{
          height: '100%',
          minHeight: 360,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(145deg, rgba(100,181,246,0.12), rgba(100,181,246,0.06))',
          backdropFilter: 'blur(15px)',
          border: '2px dashed rgba(100,181,246,0.4)',
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.4s ease',
          '&:hover': {
            border: '2px dashed rgba(100,181,246,0.8)',
            background: 'linear-gradient(145deg, rgba(100,181,246,0.25), rgba(100,181,246,0.15))',
            boxShadow: '0 20px 40px rgba(100,181,246,0.25)',
            '&::before': {
              left: '100%'
            }
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
            transition: 'left 0.6s ease',
            zIndex: 1
          }
        }}
      >
        {/* Badge de estado con efectos épicos */}
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, 1, -1, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 2
          }}
        >
          <Box
            sx={{
              backgroundColor: estadoConfig.bgColor,
              border: `2px solid ${estadoConfig.borderColor}`,
              borderRadius: 2,
              px: 1.5,
              py: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              boxShadow: `0 4px 15px ${estadoConfig.color}40`,
              backdropFilter: 'blur(10px)'
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              style={{ color: estadoConfig.color, fontSize: 16 }}
            >
              {estadoConfig.icon}
            </motion.div>
            <Typography variant="caption" sx={{ color: estadoConfig.color, fontWeight: 'bold' }}>
              {estadoConfig.label}
            </Typography>
          </Box>
        </motion.div>

        <CardContent sx={{ p: 3, position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
          {/* Partículas animadas de fondo */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              style={{
                position: 'absolute',
                width: '3px',
                height: '3px',
                backgroundColor: '#64b5f6',
                borderRadius: '50%',
                top: `${20 + (i * 15)}%`,
                left: `${15 + (i * 12)}%`,
                zIndex: -1
              }}
              animate={{
                y: [0, -10, 0],
                opacity: [0.2, 0.6, 0.2],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 2 + (i * 0.3),
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2
              }}
            />
          ))}

          {/* Header con torneo con efectos */}
          <Box sx={{ mb: 2 }}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <TrophyIcon sx={{ color: '#64b5f6', fontSize: 18 }} />
                </motion.div>
                <Typography variant="caption" sx={{ 
                  color: '#64b5f6', 
                  fontWeight: 'bold',
                  textShadow: '0 0 10px rgba(100,181,246,0.5)'
                }}>
                  {partido.torneo?.nombre || 'Torneo TBD'}
                </Typography>
              </Box>
            </motion.div>
            <Typography variant="h6" sx={{ 
              color: 'white', 
              fontWeight: 'bold', 
              mb: 1,
              background: 'linear-gradient(45deg, #ffffff, #e3f2fd)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {getCategoryName(partido.categoria)}
            </Typography>
          </Box>

          {/* Equipos enfrentados */}
          <Box sx={{ mb: 3, flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              {/* Equipo Local con efectos */}
              <motion.div
                whileHover={{ scale: 1.08, x: 5 }}
                transition={{ duration: 0.2 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <Avatar
                      src={getImageUrl(partido.equipoLocal?.imagen)}
                      sx={{ 
                        width: 50, 
                        height: 50,
                        border: '3px solid rgba(76, 175, 80, 0.5)',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        boxShadow: '0 0 20px rgba(76, 175, 80, 0.3)'
                      }}
                    >
                      <GroupsIcon sx={{ color: '#4caf50' }} />
                    </Avatar>
                  </motion.div>
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="body1" sx={{ 
                      color: 'white', 
                      fontWeight: 'bold',
                      textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}>
                      {partido.equipoLocal?.nombre || 'TBD'}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: 'rgba(76, 175, 80, 0.8)',
                      fontWeight: 'medium'
                    }}>
                      Local
                    </Typography>
                  </Box>
                </Box>
              </motion.div>

              {/* VS con efectos épicos */}
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  textShadow: [
                    '0 0 10px rgba(100,181,246,0.5)',
                    '0 0 20px rgba(100,181,246,0.8)',
                    '0 0 10px rgba(100,181,246,0.5)'
                  ]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{ margin: '0 16px' }}
              >
                <Typography variant="h6" sx={{ 
                  color: '#64b5f6', 
                  fontWeight: 'bold',
                  textShadow: '0 0 15px rgba(100,181,246,0.8)',
                  background: 'linear-gradient(45deg, #64b5f6, #42a5f5)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  VS
                </Typography>
              </motion.div>

              {/* Equipo Visitante con efectos */}
              <motion.div
                whileHover={{ scale: 1.08, x: -5 }}
                transition={{ duration: 0.2 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'flex-end' }}>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body1" sx={{ 
                      color: 'white', 
                      fontWeight: 'bold',
                      textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}>
                      {partido.equipoVisitante?.nombre || 'TBD'}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: 'rgba(255, 152, 0, 0.8)',
                      fontWeight: 'medium'
                    }}>
                      Visitante
                    </Typography>
                  </Box>
                  <motion.div
                    whileHover={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <Avatar
                      src={getImageUrl(partido.equipoVisitante?.imagen)}
                      sx={{ 
                        width: 50, 
                        height: 50,
                        border: '3px solid rgba(255, 152, 0, 0.5)',
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        boxShadow: '0 0 20px rgba(255, 152, 0, 0.3)'
                      }}
                    >
                      <GroupsIcon sx={{ color: '#ff9800' }} />
                    </Avatar>
                  </motion.div>
                </Box>
              </motion.div>
            </Box>

            {/* Marcador si existe */}
            {partido.estado === 'finalizado' && partido.marcador && (
              <Box sx={{ 
                textAlign: 'center', 
                p: 2, 
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: 2,
                mb: 2
              }}>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {partido.marcador.local} - {partido.marcador.visitante}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Resultado Final
                </Typography>
              </Box>
            )}
          </Box>

          {/* Información del partido */}
          <Box sx={{ mt: 'auto' }}>
            <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
            
            <Stack spacing={1}>
              {/* Fecha y hora */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon sx={{ color: '#64b5f6', fontSize: 16 }} />
                <Typography variant="body2" sx={{ color: 'white' }}>
                  {formatearFecha(partido.fechaHora)}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  • {formatearHora(partido.fechaHora)}
                </Typography>
              </Box>

              {/* Sede */}
              {partido.sede?.nombre && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationIcon sx={{ color: '#ff9800', fontSize: 16 }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    {partido.sede.nombre}
                  </Typography>
                </Box>
              )}

              {/* Árbitros */}
              {partido.arbitros && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GavelIcon sx={{ color: '#9c27b0', fontSize: 16 }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    {[partido.arbitros.principal, partido.arbitros.backeador, partido.arbitros.estadistico]
                      .filter(Boolean).length} árbitro(s)
                  </Typography>
                </Box>
              )}
            </Stack>

            {/* Acciones */}
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button
                component={Link}
                to={`/partidos/${partido._id}`}
                variant="contained"
                size="small"
                fullWidth
                sx={{
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1976D2 30%, #0277BD 90%)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                Ver Detalles
              </Button>
              
              {puedeGestionarTorneos() && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEliminar(partido._id);
                  }}
                  sx={{
                    borderColor: 'rgba(244, 67, 54, 0.5)',
                    color: '#f44336',
                    '&:hover': {
                      backgroundColor: 'rgba(244, 67, 54, 0.1)',
                      borderColor: '#f44336'
                    }
                  }}
                >
                  Eliminar
                </Button>
              )}
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// 🎯 Componente de filtros épicos
const FiltrosEpicos = ({ onFiltrosChange }) => {
  const [torneos, setTorneos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [filtros, setFiltros] = useState({
    torneo: '',
    categoria: '',
    estado: '',
    equipo: '',
    fecha: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const [torneosRes, equiposRes] = await Promise.all([
          axiosInstance.get('/torneos'),
          axiosInstance.get('/equipos')
        ]);
        setTorneos(torneosRes.data.torneos || []);
        setEquipos(equiposRes.data || []);
      } catch (error) {
        console.error('Error cargando datos para filtros:', error);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, []);

  const handleFiltroChange = (key, value) => {
    const nuevosFiltros = { ...filtros, [key]: value };
    if (key === 'categoria') {
      nuevosFiltros.equipo = ''; // Limpiar equipo al cambiar categoría
    }
    setFiltros(nuevosFiltros);
    onFiltrosChange(nuevosFiltros);
  };

  const limpiarFiltros = () => {
    const filtrosVacios = {
      torneo: '',
      categoria: '',
      estado: '',
      equipo: '',
      fecha: ''
    };
    setFiltros(filtrosVacios);
    onFiltrosChange(filtrosVacios);
  };

  const hayFiltrosActivos = Object.values(filtros).some(v => v && v.trim() !== '');
  const equiposFiltrados = filtros.categoria
    ? equipos.filter(equipo => equipo.categoria === filtros.categoria)
    : equipos;

  return (
    <Paper
      sx={{
        p: 3,
        background: 'linear-gradient(145deg, rgba(0,0,0,0.8), rgba(0,0,0,0.6))',
        backdropFilter: 'blur(15px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 3,
        mb: 3
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <FilterListIcon sx={{ color: '#64b5f6' }} />
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
          Filtros de Búsqueda
        </Typography>
        {hayFiltrosActivos && (
          <Chip
            label="Filtros activos"
            size="small"
            color="primary"
            variant="outlined"
          />
        )}
      </Box>

      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 3,
        justifyContent: 'flex-start',
        alignItems: 'flex-start'
      }}>
        {/* Torneo */}
        <Box sx={{ 
          flexBasis: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(16.666% - 16px)' },
          minWidth: '200px'
        }}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem' }}>Torneo</InputLabel>
            <Select
              value={filtros.torneo}
              label="Torneo"
              onChange={(e) => handleFiltroChange('torneo', e.target.value)}
              disabled={loading}
              sx={{
                color: 'white',
                minHeight: '56px',
                fontSize: '1rem',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.2)'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.4)'
                },
                '& .MuiSelect-select': {
                  padding: '16px 14px'
                }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    '& .MuiMenuItem-root': {
                      color: 'white',
                      padding: '12px 16px',
                      fontSize: '1rem',
                      '&:hover': {
                        backgroundColor: 'rgba(100,181,246,0.1)'
                      }
                    }
                  }
                }
              }}
            >
              <MenuItem value="">Todos los torneos</MenuItem>
              {torneos.map(torneo => (
                <MenuItem key={torneo._id} value={torneo._id}>
                  {torneo.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Categoría */}
        <Box sx={{ 
          flexBasis: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(16.666% - 16px)' },
          minWidth: '200px'
        }}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem' }}>Categoría</InputLabel>
            <Select
              value={filtros.categoria}
              label="Categoría"
              onChange={(e) => handleFiltroChange('categoria', e.target.value)}
              sx={{
                color: 'white',
                minHeight: '56px',
                fontSize: '1rem',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.2)'
                },
                '& .MuiSelect-select': {
                  padding: '16px 14px'
                }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    '& .MuiMenuItem-root': {
                      color: 'white',
                      padding: '12px 16px',
                      fontSize: '1rem',
                      '&:hover': {
                        backgroundColor: 'rgba(100,181,246,0.1)'
                      }
                    }
                  }
                }
              }}
            >
              <MenuItem value="">Todas las categorías</MenuItem>
              {categorias.map(cat => (
                <MenuItem key={cat.value} value={cat.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box 
                      sx={{ 
                        width: 14, 
                        height: 14, 
                        borderRadius: '50%', 
                        backgroundColor: cat.color 
                      }} 
                    />
                    {cat.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Equipo */}
        <Box sx={{ 
          flexBasis: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(16.666% - 16px)' },
          minWidth: '200px'
        }}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem' }}>Equipo</InputLabel>
            <Select
              value={filtros.equipo}
              label="Equipo"
              onChange={(e) => handleFiltroChange('equipo', e.target.value)}
              disabled={loading}
              sx={{
                color: 'white',
                minHeight: '56px',
                fontSize: '1rem',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.2)'
                },
                '& .MuiSelect-select': {
                  padding: '16px 14px'
                }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    '& .MuiMenuItem-root': {
                      color: 'white',
                      padding: '12px 16px',
                      fontSize: '1rem',
                      '&:hover': {
                        backgroundColor: 'rgba(100,181,246,0.1)'
                      }
                    }
                  }
                }
              }}
            >
              <MenuItem value="">Todos los equipos</MenuItem>
              {equiposFiltrados.map(equipo => (
                <MenuItem key={equipo._id} value={equipo._id}>
                  {equipo.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Estado */}
        <Box sx={{ 
          flexBasis: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(16.666% - 16px)' },
          minWidth: '200px'
        }}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem' }}>Estado</InputLabel>
            <Select
              value={filtros.estado}
              label="Estado"
              onChange={(e) => handleFiltroChange('estado', e.target.value)}
              sx={{
                color: 'white',
                minHeight: '56px',
                fontSize: '1rem',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.2)'
                },
                '& .MuiSelect-select': {
                  padding: '16px 14px'
                }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    '& .MuiMenuItem-root': {
                      color: 'white',
                      padding: '12px 16px',
                      fontSize: '1rem',
                      '&:hover': {
                        backgroundColor: 'rgba(100,181,246,0.1)'
                      }
                    }
                  }
                }
              }}
            >
              <MenuItem value="">Todos los estados</MenuItem>
              {Object.entries(estadosConfig).map(([key, config]) => (
                <MenuItem key={key} value={key}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ color: config.color, fontSize: 18 }}>
                      {config.icon}
                    </Box>
                    {config.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Fecha */}
        <Box sx={{ 
          flexBasis: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(16.666% - 16px)' },
          minWidth: '200px'
        }}>
          <TextField
            fullWidth
            type="date"
            label="Fecha"
            value={filtros.fecha}
            onChange={(e) => handleFiltroChange('fecha', e.target.value)}
            InputLabelProps={{ 
              shrink: true, 
              sx: { color: 'rgba(255,255,255,0.7)', fontSize: '1rem' } 
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                minHeight: '56px',
                fontSize: '1rem',
                '& fieldset': {
                  borderColor: 'rgba(255,255,255,0.2)'
                },
                '& input': {
                  padding: '16px 14px'
                }
              }
            }}
          />
        </Box>

        {/* Botón Limpiar */}
        <Box sx={{ 
          flexBasis: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(16.666% - 16px)' },
          minWidth: '200px'
        }}>
          {hayFiltrosActivos ? (
            <Button
              fullWidth
              startIcon={<ClearIcon />}
              onClick={limpiarFiltros}
              variant="outlined"
              sx={{
                height: '56px',
                fontSize: '1rem',
                borderColor: 'rgba(244, 67, 54, 0.5)',
                color: '#f44336',
                '&:hover': {
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                  borderColor: '#f44336'
                }
              }}
            >
              Limpiar Filtros
            </Button>
          ) : (
            <Box sx={{ height: '56px' }} />
          )}
        </Box>
      </Box>
    </Paper>
  );
};

// 🚀 Componente principal
export const Partidos = () => {
  const { usuario, puedeGestionarTorneos } = useAuth();
  const navigate = useNavigate();

  // Estados principales
  const [partidos, setPartidos] = useState([]);
  const [vistaCompacta, setVistaCompacta] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPartidos, setTotalPartidos] = useState(0);

  // Estados de filtros
  const [filtrosActivos, setFiltrosActivos] = useState({});

  // Obtener partidos
  const obtenerPartidos = async (page = 1, limit = 12, filtros = {}) => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      Object.entries(filtros).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          params.append(key, value);
        }
      });

      const { data } = await axiosInstance.get(`/partidos?${params.toString()}`);
      
      setPartidos(data.partidos || []);
      setTotalPages(data.paginacion?.totalPaginas || 1);
      setTotalPartidos(data.paginacion?.totalPartidos || 0);
      setCurrentPage(data.paginacion?.paginaActual || page);
      
    } catch (error) {
      console.error('Error al obtener partidos:', error);
      setError('Hubo un problema al cargar los partidos.');
      setPartidos([]);
    } finally {
      setLoading(false);
    }
  };

  // Efectos
  useEffect(() => {
    obtenerPartidos(1, itemsPerPage);
  }, []);

  // Handlers
  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage);
    obtenerPartidos(newPage, itemsPerPage, filtrosActivos);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (event) => {
    const newLimit = event.target.value;
    setItemsPerPage(newLimit);
    setCurrentPage(1);
    obtenerPartidos(1, newLimit, filtrosActivos);
  };

  const handleFiltrosChange = (nuevosFiltros) => {
    setFiltrosActivos(nuevosFiltros);
    setCurrentPage(1);
    obtenerPartidos(1, itemsPerPage, nuevosFiltros);
  };

  const refrescarDatos = () => {
    obtenerPartidos(currentPage, itemsPerPage, filtrosActivos);
  };

  const eliminarPartido = async (partidoId) => {
    if (!puedeGestionarTorneos()) {
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
        
        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'El partido ha sido eliminado correctamente',
          timer: 2000,
          showConfirmButton: false
        });

        refrescarDatos();
      }
    } catch (error) {
      console.error('Error al eliminar partido:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al eliminar el partido'
      });
    }
  };

  // Animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.08 } 
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  // Skeletons épicos
  const PartidosSkeletons = () => (
    <Grid container spacing={3}>
      {Array.from({ length: itemsPerPage }).map((_, index) => (
        <Grid item xs={12} sm={6} lg={vistaCompacta ? 12 : 4} key={index}>
          <Card sx={{ 
            height: vistaCompacta ? 160 : 400,
            background: 'linear-gradient(145deg, rgba(0,0,0,0.3), rgba(0,0,0,0.1))',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Skeleton variant="rectangular" width="40%" height={20} sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.1)' }} />
              <Skeleton variant="text" width="80%" height={28} sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.1)' }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Skeleton variant="circular" width={50} height={50} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                  <Box>
                    <Skeleton variant="text" width={80} height={20} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                    <Skeleton variant="text" width={60} height={16} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box>
                    <Skeleton variant="text" width={80} height={20} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                    <Skeleton variant="text" width={60} height={16} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                  </Box>
                  <Skeleton variant="circular" width={50} height={50} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                </Box>
              </Box>
              <Skeleton variant="rectangular" width="100%" height={40} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #0f3460 100%)',
      p: { xs: 2, md: 4 }
    }}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Breadcrumbs épicos */}
        <motion.div variants={itemVariants}>
          <Breadcrumbs 
            separator={<NavigateNextIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.5)' }} />}
            sx={{ mb: 3 }}
          >
            <Typography sx={{ 
              color: 'rgba(255,255,255,0.7)',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}>
              AGS Flag Football
            </Typography>
            <Typography sx={{ 
              color: 'white', 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}>
              <SportsFootballIcon fontSize="small" />
              Partidos
            </Typography>
          </Breadcrumbs>
        </motion.div>

        {/* Header épico */}
        <motion.div variants={itemVariants}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 3,
            mb: 4
          }}>
            <Box>
              <Typography 
                variant="h3" 
                sx={{ 
                  color: 'white', 
                  fontWeight: 'bold', 
                  mb: 1,
                  background: 'linear-gradient(45deg, #64b5f6, #42a5f5)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 30px rgba(100,181,246,0.3)'
                }}
              >
                Gestión de Partidos
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 300 }}>
                {totalPartidos > 0 
                  ? `Mostrando ${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, totalPartidos)} de ${totalPartidos} partidos`
                  : 'No hay partidos disponibles'
                }
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Botón refrescar */}
              <Tooltip title="Refrescar datos">
                <IconButton 
                  onClick={refrescarDatos}
                  disabled={loading}
                  sx={{ 
                    color: 'white',
                    background: 'linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    '&:hover': { 
                      background: 'linear-gradient(45deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
                      transform: 'scale(1.05)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>

              {/* Toggle vista */}
              <ToggleButtonGroup
                value={vistaCompacta ? 'compacta' : 'tarjetas'}
                exclusive
                onChange={(e, value) => value && setVistaCompacta(value === 'compacta')}
                sx={{
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  '& .MuiToggleButton-root': {
                    color: 'rgba(255,255,255,0.7)',
                    border: 'none',
                    '&.Mui-selected': {
                      background: 'linear-gradient(45deg, #64b5f6, #42a5f5)',
                      color: 'white',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #5a9fd8, #378bc4)'
                      }
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }
                }}
              >
                <ToggleButton value="tarjetas">
                  <GridViewIcon />
                </ToggleButton>
                <ToggleButton value="compacta">
                  <ViewStreamIcon />
                </ToggleButton>
              </ToggleButtonGroup>

              {/* Botón crear partido */}
              {puedeGestionarTorneos() && (
                <Button
                  component={Link}
                  to="/partidos/crear"
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{
                    background: 'linear-gradient(45deg, #4caf50, #8bc34a)',
                    padding: '12px 24px',
                    borderRadius: 3,
                    fontWeight: 'bold',
                    boxShadow: '0 8px 25px rgba(76, 175, 80, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #45a049, #7cb342)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 35px rgba(76, 175, 80, 0.4)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Crear Partido
                </Button>
              )}
            </Box>
          </Box>
        </motion.div>

        {/* Filtros épicos */}
        <motion.div variants={itemVariants}>
          <FiltrosEpicos onFiltrosChange={handleFiltrosChange} />
        </motion.div>

        {/* Error handling */}
        {error && (
          <motion.div variants={itemVariants}>
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                background: 'linear-gradient(145deg, rgba(244,67,54,0.1), rgba(244,67,54,0.05))',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(244,67,54,0.3)',
                color: 'white',
                '& .MuiAlert-icon': {
                  color: '#f44336'
                }
              }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={refrescarDatos}
                  sx={{ color: '#f44336' }}
                >
                  Reintentar
                </Button>
              }
            >
              {error}
            </Alert>
          </motion.div>
        )}

        {/* Contenido principal */}
        <motion.div variants={itemVariants}>
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <PartidosSkeletons />
              </motion.div>
            ) : partidos.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.5 }}
              >
                <Paper
                  sx={{
                    p: 8,
                    textAlign: 'center',
                    background: 'linear-gradient(145deg, rgba(0,0,0,0.4), rgba(0,0,0,0.2))',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 4,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'radial-gradient(circle at center, rgba(100,181,246,0.1) 0%, transparent 70%)',
                      pointerEvents: 'none'
                    }
                  }}
                >
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <SportsFootballIcon 
                      sx={{ 
                        fontSize: 120, 
                        color: 'rgba(100,181,246,0.3)', 
                        mb: 3,
                        filter: 'drop-shadow(0 0 20px rgba(100,181,246,0.2))'
                      }} 
                    />
                  </motion.div>
                  
                  <Typography variant="h4" sx={{ 
                    color: 'white', 
                    mb: 2, 
                    fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #64b5f6, #42a5f5)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    No hay partidos disponibles
                  </Typography>
                  
                  <Typography variant="h6" sx={{ 
                    color: 'rgba(255,255,255,0.7)', 
                    mb: 4,
                    maxWidth: 500,
                    mx: 'auto'
                  }}>
                    {Object.values(filtrosActivos).some(v => v && v.trim() !== '')
                      ? 'No se encontraron partidos con los filtros aplicados. Intenta ajustar los criterios de búsqueda.'
                      : 'Aún no se han creado partidos en el sistema. ¡Sé el primero en crear uno!'
                    }
                  </Typography>
                  
                  {puedeGestionarTorneos() && (
                    <Button
                      component={Link}
                      to="/partidos/crear"
                      variant="contained"
                      size="large"
                      startIcon={<AddIcon />}
                      sx={{
                        background: 'linear-gradient(45deg, #4caf50, #8bc34a)',
                        padding: '16px 32px',
                        borderRadius: 3,
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        boxShadow: '0 12px 30px rgba(76, 175, 80, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #45a049, #7cb342)',
                          transform: 'translateY(-3px)',
                          boxShadow: '0 16px 40px rgba(76, 175, 80, 0.4)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Crear Primer Partido
                    </Button>
                  )}
                </Paper>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                {vistaCompacta ? (
                  <ListaPartidosCompacta 
                    partidos={partidos}
                    onEliminar={eliminarPartido}
                  />
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 3,
                    justifyContent: { xs: 'center', sm: 'flex-start' }
                  }}>
                    <AnimatePresence>
                      {partidos.map((partido, index) => (
                        <Box 
                          key={partido._id} 
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
                            },
                            minWidth: { xs: '280px', sm: '300px' }
                          }}
                        >
                          <motion.div
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            transition={{ delay: index * 0.05 }}
                          >
                            <EpicPartidoCard 
                              partido={partido}
                              onEliminar={eliminarPartido}
                            />
                          </motion.div>
                        </Box>
                      ))}
                    </AnimatePresence>
                  </Box>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Paginación épica */}
        {!loading && partidos.length > 0 && (
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
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Por página</InputLabel>
                    <Select
                      value={itemsPerPage}
                      onChange={handleItemsPerPageChange}
                      label="Por página"
                      sx={{
                        color: 'white',
                        background: 'rgba(255,255,255,0.05)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,255,255,0.2)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,255,255,0.4)'
                        }
                      }}
                    >
                      {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {/* Paginación central */}
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
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderColor: 'rgba(255, 255, 255, 0.4)',
                        transform: 'scale(1.05)'
                      },
                      '&.Mui-selected': {
                        background: 'linear-gradient(45deg, #64b5f6, #42a5f5)',
                        color: 'white',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 15px rgba(100,181,246,0.3)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #5a9fd8, #378bc4)'
                        }
                      },
                      transition: 'all 0.3s ease'
                    }
                  }}
                />

                {/* Estadísticas rápidas */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2,
                  color: 'rgba(255,255,255,0.7)'
                }}>
                  <Typography variant="body2">
                    Página {currentPage} de {totalPages}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </motion.div>
        )}
      </motion.div>

      {/* FAB épico para móvil */}
      {puedeGestionarTorneos() && (
        <Fab
          component={Link}
          to="/partidos/crear"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(45deg, #4caf50, #8bc34a)',
            width: 64,
            height: 64,
            boxShadow: '0 8px 25px rgba(76, 175, 80, 0.4)',
            '&:hover': {
              background: 'linear-gradient(45deg, #45a049, #7cb342)',
              transform: 'scale(1.1)',
              boxShadow: '0 12px 35px rgba(76, 175, 80, 0.5)'
            },
            zIndex: 1000,
            display: { xs: 'flex', md: 'none' },
            transition: 'all 0.3s ease'
          }}
        >
          <AddIcon sx={{ fontSize: 32 }} />
        </Fab>
      )}
    </Box>
  );
};