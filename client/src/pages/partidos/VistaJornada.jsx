// 📁 client/src/pages/partidos/VistaJornada.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Chip,
  Badge,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CalendarToday as CalendarTodayIcon,
  Group as GroupIcon,
  Schedule as ScheduleIcon,
  SportsFootball as SportsFootballIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCategoryName } from '../../helpers/mappings';
import axiosInstance from '../../config/axios';

// 🔥 Función helper para formatear fecha
const formatearFecha = (fecha) => {
  if (!fecha) return 'Fecha no definida';
  try {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Fecha inválida';
  }
};

// 🔥 Función helper para obtener color del estado
const obtenerColorEstado = (estado) => {
  const colores = {
    'programado': '#2196f3',
    'en_curso': '#4caf50', 
    'medio_tiempo': '#ff9800',
    'finalizado': '#9c27b0',
    'suspendido': '#f44336',
    'cancelado': '#757575'
  };
  return colores[estado] || '#757575';
};

// 🔥 Función helper para obtener label del estado
const obtenerLabelEstado = (estado) => {
  const labels = {
    'programado': 'Programado',
    'en_curso': 'En Curso',
    'medio_tiempo': 'Medio T.',
    'finalizado': 'Final',
    'suspendido': 'Suspendido',
    'cancelado': 'Cancelado'
  };
  return labels[estado] || estado;
};

// 🔥 Componente para tarjeta ultra compacta de partido (estilo TV con efectos dinámicos)
const PartidoCompactoCard = ({ partido, onEliminar }) => {
  const navigate = useNavigate();
  const { puedeGestionarPartidos } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  
  const handleEliminar = async (e) => {
    e.stopPropagation();
    if (onEliminar) {
      await onEliminar(partido._id);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    navigate(`/partidos/editar/${partido._id}`);
  };

  const handleView = () => {
    navigate(`/partidos/${partido._id}`);
  };

  // 🎨 Efectos dinámicos según el estado
  const getEstadoEffects = (estado) => {
    switch(estado) {
      case 'en_curso':
        return {
          borderColor: '#4caf50',
          glow: '0 0 20px rgba(76, 175, 80, 0.4)',
          backgroundGradient: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(30, 30, 35, 0.95) 50%)'
        };
      case 'medio_tiempo':
        return {
          borderColor: '#ff9800',
          glow: '0 0 15px rgba(255, 152, 0, 0.3)',
          backgroundGradient: 'linear-gradient(135deg, rgba(255, 152, 0, 0.08) 0%, rgba(30, 30, 35, 0.95) 50%)'
        };
      case 'finalizado':
        return {
          borderColor: '#9c27b0',
          glow: '0 0 10px rgba(156, 39, 176, 0.2)',
          backgroundGradient: 'linear-gradient(135deg, rgba(156, 39, 176, 0.05) 0%, rgba(30, 30, 35, 0.95) 50%)'
        };
      default:
        return {
          borderColor: 'rgba(255, 255, 255, 0.08)',
          glow: 'none',
          backgroundGradient: 'rgba(30, 30, 35, 0.95)'
        };
    }
  };

  const efectos = getEstadoEffects(partido.estado);

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Paper 
        sx={{
          p: 1.5,
          background: isHovered ? 
            `linear-gradient(135deg, rgba(100, 181, 246, 0.12) 0%, rgba(40, 40, 45, 0.95) 50%)` :
            efectos.backgroundGradient,
          backdropFilter: 'blur(15px)',
          border: `1px solid ${isHovered ? 'rgba(100, 181, 246, 0.3)' : efectos.borderColor}`,
          borderRadius: 2,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          minHeight: '85px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: isHovered ? 
            `0 8px 25px rgba(0,0,0,0.4), ${efectos.glow}` : 
            `0 2px 8px rgba(0,0,0,0.2), ${efectos.glow}`,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: isHovered ? 
              'linear-gradient(90deg, transparent, #64b5f6, transparent)' :
              `linear-gradient(90deg, transparent, ${efectos.borderColor}, transparent)`,
            opacity: isHovered ? 1 : 0.7,
            transition: 'all 0.3s ease'
          }
        }}
        onClick={handleView}
      >
        {/* Efecto de partículas para partidos en vivo */}
        {partido.estado === 'en_curso' && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 80%, rgba(76, 175, 80, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(76, 175, 80, 0.05) 0%, transparent 50%)',
            pointerEvents: 'none',
            opacity: 0.6
          }} />
        )}

        {/* Header: Categoría y Estado */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 1,
          position: 'relative',
          zIndex: 1
        }}>
          <Typography variant="caption" sx={{ 
            color: '#64b5f6',
            fontWeight: 'bold',
            fontSize: '0.65rem',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
          }}>
            {getCategoryName(partido.categoria)}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {/* Estado como badge pequeño con animación */}
            <motion.div
              animate={partido.estado === 'en_curso' ? {
                scale: [1, 1.05, 1],
                opacity: [1, 0.8, 1]
              } : {}}
              transition={{ duration: 2, repeat: partido.estado === 'en_curso' ? Infinity : 0 }}
            >
              <Chip
                label={obtenerLabelEstado(partido.estado)}
                size="small"
                sx={{
                  backgroundColor: obtenerColorEstado(partido.estado),
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.6rem',
                  height: '18px',
                  boxShadow: `0 2px 8px ${obtenerColorEstado(partido.estado)}40`,
                  '& .MuiChip-label': {
                    px: 0.8
                  }
                }}
              />
            </motion.div>
            
            {/* Menú de acciones con animación */}
            {puedeGestionarPartidos() && (
              <motion.div
                whileHover={{ scale: 1.2, rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                <IconButton
                  size="small"
                  onClick={(e) => e.stopPropagation()}
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.5)',
                    width: 20,
                    height: 20,
                    '&:hover': { 
                      color: '#64b5f6',
                      backgroundColor: 'rgba(100, 181, 246, 0.1)'
                    }
                  }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </motion.div>
            )}
          </Box>
        </Box>

        {/* Enfrentamiento Principal - Optimizado para más espacio */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 1.5,
          position: 'relative',
          zIndex: 1,
          gap: 0.5
        }}>
          {/* Equipo Local - Más espacio */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.8, 
            flex: '1 1 35%',
            minWidth: 0
          }}>
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.2 }}
            >
              <Avatar
                src={partido.equipoLocal?.imagen}
                sx={{ 
                  width: 26, 
                  height: 26,
                  backgroundColor: 'rgba(100, 181, 246, 0.2)',
                  border: '2px solid rgba(100, 181, 246, 0.3)',
                  boxShadow: '0 2px 8px rgba(100, 181, 246, 0.2)'
                }}
              >
                <SportsFootballIcon sx={{ fontSize: 12, color: '#64b5f6' }} />
              </Avatar>
            </motion.div>
            <Typography variant="body2" sx={{ 
              color: 'white', 
              fontWeight: '600',
              fontSize: '0.8rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textShadow: '0 1px 2px rgba(0,0,0,0.7)',
              flex: 1
            }}>
              {partido.equipoLocal?.nombre || 'Local'}
            </Typography>
          </Box>

          {/* Marcador Central - Más compacto */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.3,
            px: 1.2,
            py: 0.4,
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.4) 100%)',
            borderRadius: 1.5,
            border: '1px solid rgba(100, 181, 246, 0.2)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
            flex: '0 0 auto'
          }}>
            <Typography variant="h6" sx={{ 
              color: '#64b5f6', 
              fontWeight: 'bold',
              fontSize: '1.1rem',
              minWidth: '18px',
              textAlign: 'center',
              fontFamily: 'monospace',
              textShadow: '0 0 8px rgba(100, 181, 246, 0.5)'
            }}>
              {partido.marcador?.local || 0}
            </Typography>
            <Typography variant="body2" sx={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.7rem',
              mx: 0.2,
              fontWeight: 'bold'
            }}>
              -
            </Typography>
            <Typography variant="h6" sx={{ 
              color: '#64b5f6', 
              fontWeight: 'bold',
              fontSize: '1.1rem',
              minWidth: '18px',
              textAlign: 'center',
              fontFamily: 'monospace',
              textShadow: '0 0 8px rgba(100, 181, 246, 0.5)'
            }}>
              {partido.marcador?.visitante || 0}
            </Typography>
          </Box>

          {/* Equipo Visitante - Más espacio */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.8, 
            flex: '1 1 35%',
            justifyContent: 'flex-end',
            minWidth: 0
          }}>
            <Typography variant="body2" sx={{ 
              color: 'white', 
              fontWeight: '600',
              fontSize: '0.8rem',
              textAlign: 'right',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textShadow: '0 1px 2px rgba(0,0,0,0.7)',
              flex: 1
            }}>
              {partido.equipoVisitante?.nombre || 'Visitante'}
            </Typography>
            <motion.div
              whileHover={{ scale: 1.1, rotate: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Avatar
                src={partido.equipoVisitante?.imagen}
                sx={{ 
                  width: 26, 
                  height: 26,
                  backgroundColor: 'rgba(255, 152, 0, 0.2)',
                  border: '2px solid rgba(255, 152, 0, 0.3)',
                  boxShadow: '0 2px 8px rgba(255, 152, 0, 0.2)'
                }}
              >
                <SportsFootballIcon sx={{ fontSize: 12, color: '#ff9800' }} />
              </Avatar>
            </motion.div>
          </Box>
        </Box>

        {/* Footer: Fecha/Hora con efecto */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <Typography variant="caption" sx={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.65rem',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            fontWeight: '500',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
          }}>
            <ScheduleIcon sx={{ fontSize: 10 }} />
            {formatearFecha(partido.fechaHora)}
          </Typography>
        </Box>
      </Paper>
    </motion.div>
  );
};

// 🔥 Componente principal VistaJornada
export const VistaJornada = ({ partidos, onEliminar }) => {
  const [jornadas, setJornadas] = useState([]);
  const [jornadaSeleccionada, setJornadaSeleccionada] = useState('todas');
  const [loadingJornadas, setLoadingJornadas] = useState(false);
  const [expandedJornadas, setExpandedJornadas] = useState(new Set());

  // 🔥 Obtener jornadas disponibles
  const obtenerJornadasDisponibles = useCallback(async () => {
    if (!partidos || partidos.length === 0) return;

    try {
      setLoadingJornadas(true);
      
      // Extraer jornadas de los partidos actuales
      const jornadasLocales = [...new Set(partidos.map(p => p.jornada).filter(Boolean))];
      setJornadas(jornadasLocales.sort());
      
    } catch (error) {
      console.error('Error al obtener jornadas:', error);
    } finally {
      setLoadingJornadas(false);
    }
  }, [partidos]);

  useEffect(() => {
    obtenerJornadasDisponibles();
  }, [obtenerJornadasDisponibles]);

  // 🔥 Agrupar partidos por jornada
  const partidosAgrupados = useMemo(() => {
    if (!partidos || partidos.length === 0) return {};

    const grupos = {};
    
    partidos.forEach(partido => {
      const jornada = partido.jornada || 'Sin jornada';
      if (!grupos[jornada]) {
        grupos[jornada] = [];
      }
      grupos[jornada].push(partido);
    });

    // Ordenar partidos dentro de cada jornada por fecha
    Object.keys(grupos).forEach(jornada => {
      grupos[jornada].sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));
    });

    return grupos;
  }, [partidos]);

  // 🔥 Filtrar por jornada seleccionada
  const partidosFiltrados = useMemo(() => {
    if (jornadaSeleccionada === 'todas') {
      return partidosAgrupados;
    }
    
    if (partidosAgrupados[jornadaSeleccionada]) {
      return { [jornadaSeleccionada]: partidosAgrupados[jornadaSeleccionada] };
    }
    
    return {};
  }, [partidosAgrupados, jornadaSeleccionada]);

  // 🔥 Manejar expansión de jornadas
  const toggleJornada = (jornada) => {
    const newExpanded = new Set(expandedJornadas);
    if (newExpanded.has(jornada)) {
      newExpanded.delete(jornada);
    } else {
      newExpanded.add(jornada);
    }
    setExpandedJornadas(newExpanded);
  };

  // Expandir automáticamente si hay pocas jornadas
  useEffect(() => {
    const jornadasDisponibles = Object.keys(partidosFiltrados);
    if (jornadasDisponibles.length <= 3) {
      setExpandedJornadas(new Set(jornadasDisponibles));
    }
  }, [partidosFiltrados]);

  // 🔥 Calcular estadísticas por jornada
  const calcularEstadisticasJornada = (partidosJornada) => {
    const total = partidosJornada.length;
    const programados = partidosJornada.filter(p => p.estado === 'programado').length;
    const enCurso = partidosJornada.filter(p => ['en_curso', 'medio_tiempo'].includes(p.estado)).length;
    const finalizados = partidosJornada.filter(p => p.estado === 'finalizado').length;

    return { total, programados, enCurso, finalizados };
  };

  const jornadasOrdenadas = Object.keys(partidosFiltrados).sort((a, b) => {
    // Ordenar jornadas numéricamente si es posible
    const numA = parseInt(a.replace(/\D/g, ''));
    const numB = parseInt(b.replace(/\D/g, ''));
    
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    
    // Si no son números, poner "Sin jornada" al final
    if (a === 'Sin jornada') return 1;
    if (b === 'Sin jornada') return -1;
    
    return a.localeCompare(b);
  });

  if (!partidos || partidos.length === 0) {
    return (
      <Paper sx={{
        p: 6,
        textAlign: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 3
      }}>
        <CalendarTodayIcon sx={{ fontSize: 80, color: 'rgba(255, 255, 255, 0.3)', mb: 2 }} />
        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
          No hay partidos para mostrar por jornada
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Los partidos se agruparán automáticamente cuando tengan asignada una jornada
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Filtro de jornadas */}
      <Paper sx={{
        p: 2.5,
        mb: 3,
        backgroundColor: 'rgba(20, 25, 30, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 2
      }}>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="h6" sx={{ 
            color: 'white', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            fontSize: '1.1rem',
            fontWeight: 'bold'
          }}>
            <CalendarTodayIcon sx={{ color: '#64b5f6', fontSize: 20 }} />
            Vista por Jornada
          </Typography>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Jornada
            </InputLabel>
            <Select
              value={jornadaSeleccionada}
              label="Jornada"
              onChange={(e) => setJornadaSeleccionada(e.target.value)}
              disabled={loadingJornadas}
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
              <MenuItem value="todas">📅 Todas las jornadas</MenuItem>
              {jornadas.map(jornada => (
                <MenuItem key={jornada} value={jornada}>
                  🏈 {jornada}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="body2" sx={{ 
            color: 'rgba(255, 255, 255, 0.6)', 
            ml: 'auto',
            fontSize: '0.8rem'
          }}>
            {Object.keys(partidosFiltrados).length} jornada(s) • {Object.values(partidosFiltrados).flat().length} partidos
          </Typography>
        </Box>
      </Paper>

      {/* Lista de jornadas */}
      <AnimatePresence>
        {jornadasOrdenadas.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert 
              severity="info" 
              sx={{ 
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                border: '1px solid rgba(33, 150, 243, 0.3)',
                '& .MuiAlert-message': { color: 'white' }
              }}
            >
              No se encontraron partidos para la jornada seleccionada
            </Alert>
          </motion.div>
        ) : (
          jornadasOrdenadas.map((jornada, index) => {
            const partidosJornada = partidosFiltrados[jornada];
            const stats = calcularEstadisticasJornada(partidosJornada);
            const isExpanded = expandedJornadas.has(jornada);

            return (
              <motion.div
                key={jornada}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Accordion
                  expanded={isExpanded}
                  onChange={() => toggleJornada(jornada)}
                  sx={{
                    mb: 2,
                    backgroundColor: 'rgba(20, 25, 30, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px !important',
                    overflow: 'hidden',
                    '&:before': { display: 'none' },
                    '&.Mui-expanded': {
                      margin: '0 0 16px 0'
                    }
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}
                    sx={{
                      backgroundColor: 'rgba(30, 35, 40, 0.9)',
                      borderBottom: isExpanded ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                      minHeight: '56px',
                      '&:hover': {
                        backgroundColor: 'rgba(40, 45, 50, 0.9)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Typography variant="h6" sx={{ 
                        color: 'white', 
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        fontSize: '1rem'
                      }}>
                        <SportsFootballIcon sx={{ color: '#64b5f6', fontSize: 20 }} />
                        {jornada}
                      </Typography>

                      <Badge 
                        badgeContent={stats.total} 
                        color="primary"
                        sx={{ 
                          '& .MuiBadge-badge': { 
                            backgroundColor: '#64b5f6',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.7rem'
                          }
                        }}
                      >
                        <GroupIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 18 }} />
                      </Badge>

                      <Box sx={{ display: 'flex', gap: 1, ml: 'auto', mr: 2 }}>
                        {stats.programados > 0 && (
                          <Chip
                            label={`${stats.programados} Prog.`}
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(33, 150, 243, 0.2)',
                              color: '#2196f3',
                              fontSize: '0.65rem',
                              height: '20px'
                            }}
                          />
                        )}
                        {stats.enCurso > 0 && (
                          <Chip
                            label={`${stats.enCurso} Activos`}
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(76, 175, 80, 0.2)',
                              color: '#4caf50',
                              fontSize: '0.65rem',
                              height: '20px'
                            }}
                          />
                        )}
                        {stats.finalizados > 0 && (
                          <Chip
                            label={`${stats.finalizados} Final`}
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(156, 39, 176, 0.2)',
                              color: '#9c27b0',
                              fontSize: '0.65rem',
                              height: '20px'
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails sx={{ p: 2 }}>
                    <Box sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)',
                        lg: 'repeat(4, 1fr)',
                        xl: 'repeat(5, 1fr)'
                      },
                      gap: 1.5
                    }}>
                      {partidosJornada.map((partido, partidoIndex) => (
                        <motion.div
                          key={partido._id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: partidoIndex * 0.05 }}
                        >
                          <PartidoCompactoCard
                            partido={partido}
                            onEliminar={onEliminar}
                          />
                        </motion.div>
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </motion.div>
            );
          })
        )}
      </AnimatePresence>
    </Box>
  );
};