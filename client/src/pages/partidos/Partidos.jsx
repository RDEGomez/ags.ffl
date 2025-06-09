import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axiosInstance from '../../config/axios';
import { PartidoCard } from './PartidoCard';
import { FiltrosPartidos } from '../../components/FiltrosPartidos';
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
  SportsFootball as SportsFootballIcon,
  NavigateNext as NavigateNextIcon,
  FilterList as FilterListIcon,
  GridView as GridViewIcon,
  ViewStream as ViewStreamIcon,
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';

import { ListaPartidosCompacta } from './ListaPartidosCompacta';

export const Partidos = () => {
  // 🔥 USAR: Funciones de permisos para partidos
  const { usuario, puedeGestionarTorneos } = useAuth();
  const navigate = useNavigate();

  const [partidos, setPartidos] = useState([]);
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

  const obtenerPartidos = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await axiosInstance.get('/partidos');
      setPartidos(data.partidos || []);
      setFiltrados(data.partidos || []);
    } catch (error) {
      console.error('Error al obtener partidos:', error);
      setError('Hubo un problema al cargar los partidos. Intenta nuevamente más tarde.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerPartidos();
  }, []);

  const eliminarPartido = async (partidoId) => {
    // 🔥 VALIDACIÓN: Solo mostrar si tiene permisos (doble validación)
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
        confirmButtonText: 'Sí, eliminarlo!',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        await axiosInstance.delete(`/partidos/${partidoId}`);
        
        const actualizados = partidos.filter(partido => partido._id !== partidoId);
        setPartidos(actualizados);
        setFiltrados(actualizados);
        
        Swal.fire({
          icon: 'success',
          title: 'Eliminado!',
          text: 'El partido ha sido eliminado correctamente.',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error al eliminar partido:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.mensaje || 'No se pudo eliminar el partido. Intenta nuevamente.'
      });
    }
  };

  // Obtener estadísticas de partidos
  const obtenerEstadisticas = () => {
    const totalPartidos = partidos.length;
    const programados = partidos.filter(p => p.estado === 'programado').length;
    const enCurso = partidos.filter(p => p.estado === 'en_curso').length;
    const finalizados = partidos.filter(p => p.estado === 'finalizado').length;
    const suspendidos = partidos.filter(p => p.estado === 'suspendido').length;
    const cancelados = partidos.filter(p => p.estado === 'cancelado').length;
    
    // Partidos de hoy
    const hoy = new Date().toISOString().split('T')[0];
    const partidosHoy = partidos.filter(p => 
      p.fechaHora && p.fechaHora.startsWith(hoy)
    ).length;

    return {
      total: totalPartidos,
      programados,
      enCurso,
      finalizados,
      suspendidos,
      cancelados,
      hoy: partidosHoy
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
            <Typography color="primary">Gestión de Partidos</Typography>
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
              <SportsFootballIcon sx={{ color: '#64b5f6' }} />
              Partidos
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FiltrosPartidos partidos={partidos} setFiltrados={setFiltrados} />
            </Box>
          </Box>
        </motion.div>

        {/* Tarjetas de estadísticas */}
        <motion.div variants={itemVariants}>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={2}>
              <Card sx={cardStyle}>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <SportsFootballIcon sx={{ fontSize: 40, color: '#64b5f6', mb: 1 }} />
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Partidos
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <Card sx={cardStyle}>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <CalendarIcon sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {stats.hoy}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hoy
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <Card sx={cardStyle}>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <ScheduleIcon sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {stats.programados}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Programados
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Card sx={cardStyle}>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <PlayArrowIcon sx={{ fontSize: 40, color: '#f44336', mb: 1 }} />
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {stats.enCurso}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    En Curso
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <Card sx={cardStyle}>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <CheckCircleIcon sx={{ fontSize: 40, color: '#e91e63', mb: 1 }} />
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {stats.finalizados}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Finalizados
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Card sx={cardStyle}>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <AutoAwesomeIcon sx={{ fontSize: 40, color: '#9c27b0', mb: 1 }} />
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {stats.suspendidos + stats.cancelados}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Suspendidos/Cancelados
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
                    Mostrando {filtrados.length} de {partidos.length} partidos
                  </Typography>
                  
                  {filtrados.length !== partidos.length && (
                    <Chip 
                      label="Filtros aplicados" 
                      color="primary" 
                      size="small" 
                      variant="outlined"
                    />
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {/* Botones de acción rápida */}
                  {puedeGestionarTorneos() && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Crear partido manual">
                        <Button
                          component={Link}
                          to="/partidos/crear"
                          variant="contained"
                          size="small"
                          startIcon={<AddIcon />}
                          sx={{
                            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                          }}
                        >
                          Crear Partido
                        </Button>
                      </Tooltip>
                      
                      <Tooltip title="Generar rol automático">
                        <Button
                          component={Link}
                          to="/partidos/generar-rol"
                          variant="contained"
                          size="small"
                          startIcon={<AutoAwesomeIcon />}
                          sx={{
                            background: 'linear-gradient(45deg, #FF6B35 30%, #F7931E 90%)',
                            boxShadow: '0 3px 5px 2px rgba(255, 107, 53, .3)',
                          }}
                        >
                          Generar Rol
                        </Button>
                      </Tooltip>
                    </Box>
                  )}
                
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
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contenido principal */}
        {loading && partidos.length === 0 ? (
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
                onClick={obtenerPartidos}
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
                <SportsFootballIcon sx={{ fontSize: 60, color: 'gray', mb: 2 }} />
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  {partidos.length === 0 ? 'No hay partidos registrados' : 'No se encontraron partidos con los filtros aplicados'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'gray', mb: 3 }}>
                  {partidos.length === 0 ? 'Crea el primer partido para comenzar' : 'Intenta cambiar los filtros de búsqueda'}
                </Typography>
                {partidos.length === 0 && puedeGestionarTorneos() && (
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button 
                      component={Link}
                      to="/partidos/crear"
                      variant="contained"
                      startIcon={<AddIcon />}
                      sx={{
                        background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                        boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                      }}
                    >
                      Crear Partido
                    </Button>
                    <Button 
                      component={Link}
                      to="/partidos/generar-rol"
                      variant="contained"
                      startIcon={<AutoAwesomeIcon />}
                      sx={{
                        background: 'linear-gradient(45deg, #FF6B35 30%, #F7931E 90%)',
                        boxShadow: '0 3px 5px 2px rgba(255, 107, 53, .3)',
                      }}
                    >
                      Generar Rol Automático
                    </Button>
                  </Box>
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
                    Lista de Partidos
                  </Typography>
                </Box>
                <ListaPartidosCompacta partidos={filtrados} eliminarPartido={eliminarPartido} />
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
              {filtrados.map((partido, index) => (
                <Box 
                  key={partido._id} 
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
                      <PartidoCard partido={partido} eliminarPartido={eliminarPartido} />
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