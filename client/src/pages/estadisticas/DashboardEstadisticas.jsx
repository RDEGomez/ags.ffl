// 📁 src/pages/estadisticas/DashboardEstadisticas.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Container
} from '@mui/material';
import {
  Refresh,
  Analytics
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// 🔥 IMPORTS
import { useEstadisticas } from '../../hooks/useEstadisticas';
import { 
  obtenerNombreCategoria, 
  esCategoriaValida
} from '../../helpers/categoriasUtils';

// 🔥 COMPONENTES MODULARES
import { TablaPosiciones } from './TablaPosiciones';
import { TendenciaPuntos } from './TendenciaPuntos';
import { LideresEstadisticas } from './LideresEstadisticas';
import ClasificacionGeneral from '../../components/ClasificacionGeneral';

// 🎨 ANIMACIONES
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      duration: 0.3
    }
  }
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
      duration: 0.6
    }
  }
};

export const DashboardEstadisticas = () => {
  // 🔥 HOOKS
  const estadisticasHook = useEstadisticas();
  const {
    loading: hookLoading,
    error,
    data,
    obtenerTorneosDisponibles,
    obtenerTablaPosiciones,
    obtenerTendenciaPuntos,
    obtenerTodosLideres,
    limpiarDatos,
    refrescarTodo
  } = estadisticasHook;

  const [torneoSeleccionado, setTorneoSeleccionado] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);

  const { 
    torneosDisponibles = [], 
    tablaPosiciones = [], 
    tendenciaPuntos = [], 
    lideresEstadisticas = {} 
  } = data || {};

  // 🔥 LOADING STATES INDIVIDUALES
  const loading = {
    general: !data && hookLoading,
    tabla: hookLoading?.tabla || false,
    tendencia: hookLoading?.tendencia || false,
    lideres: hookLoading?.lideres || false
  };

  // 🔥 COMPUTED VALUES
  const torneo = useMemo(() => 
    torneosDisponibles.find(t => t._id === torneoSeleccionado) || null,
    [torneosDisponibles, torneoSeleccionado]
  );

  const categorias = useMemo(() => 
    (torneo?.categorias || []).filter(esCategoriaValida),
    [torneo]
  );

  // 🔥 HANDLERS
  const handleTorneoChange = useCallback((event) => {
    const nuevoTorneo = event.target.value;
    setTorneoSeleccionado(nuevoTorneo);
    setCategoriaSeleccionada('');
    setEquipoSeleccionado(null);
  }, []);

  const handleCategoriaChange = useCallback((event) => {
    const nuevaCategoria = event.target.value;
    setCategoriaSeleccionada(nuevaCategoria);
    setEquipoSeleccionado(null);
  }, []);

  const handleSeleccionEquipo = useCallback((equipoFila) => {
    setEquipoSeleccionado(equipoFila);
  }, []);

  const handleRefresh = useCallback(async () => {
    await refrescarTodo(torneoSeleccionado, categoriaSeleccionada, equipoSeleccionado?.equipo._id);
  }, [refrescarTodo, torneoSeleccionado, categoriaSeleccionada, equipoSeleccionado]);

  // 🔥 EFFECTS
  useEffect(() => {
    obtenerTorneosDisponibles();
    return () => limpiarDatos();
  }, [obtenerTorneosDisponibles, limpiarDatos]);

  useEffect(() => {
    if (torneosDisponibles.length === 1 && !torneoSeleccionado) {
      setTorneoSeleccionado(torneosDisponibles[0]._id);
    }
  }, [torneosDisponibles, torneoSeleccionado]);

  useEffect(() => {
    if (categorias.length === 1 && torneoSeleccionado && !categoriaSeleccionada) {
      setCategoriaSeleccionada(categorias[0]);
    }
  }, [categorias, torneoSeleccionado, categoriaSeleccionada]);

  useEffect(() => {
    if (torneoSeleccionado && categoriaSeleccionada) {
      obtenerTablaPosiciones(torneoSeleccionado, categoriaSeleccionada);
      setEquipoSeleccionado(null);
    }
  }, [torneoSeleccionado, categoriaSeleccionada, obtenerTablaPosiciones]);

  useEffect(() => {
    if (equipoSeleccionado && torneoSeleccionado) {
      Promise.all([
        obtenerTendenciaPuntos(equipoSeleccionado.equipo._id, torneoSeleccionado),
        obtenerTodosLideres(equipoSeleccionado.equipo._id, torneoSeleccionado)
      ]);
    }
  }, [equipoSeleccionado, torneoSeleccionado, obtenerTendenciaPuntos, obtenerTodosLideres]);

  // 🔥 RENDER
  if (loading.general) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh' 
        }}>
          <CircularProgress size={60} sx={{ color: '#64b5f6' }} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert 
          severity="error" 
          sx={{ 
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            border: '1px solid rgba(244, 67, 54, 0.3)',
            color: 'white'
          }}
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
      py: { xs: 2, md: 4 },
      px: { xs: 1, md: 2 }
    }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* HEADER */}
          <motion.div variants={cardVariants}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 4,
              background: 'linear-gradient(145deg, rgba(64, 181, 246, 0.1), rgba(64, 181, 246, 0.05))',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(64, 181, 246, 0.2)',
              borderRadius: 3,
              p: 3
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Analytics sx={{ color: '#64b5f6', fontSize: 32 }} />
                <Typography variant="h4" sx={{ 
                  color: 'white', 
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #64b5f6, #42a5f5)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Estadísticas del Torneo
                </Typography>
              </Box>
              
              <Tooltip title="Actualizar datos">
                <IconButton 
                  onClick={handleRefresh}
                  disabled={loading.general || loading.tabla || loading.tendencia || loading.lideres}
                  sx={{ 
                    color: '#64b5f6',
                    '&:hover': { 
                      backgroundColor: 'rgba(64, 181, 246, 0.1)',
                      transform: 'rotate(180deg)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          </motion.div>

          {/* CONTROLES DE SELECCIÓN */}
          <motion.div variants={cardVariants}>
            <Box sx={{ 
              display: 'flex', 
              gap: 3, 
              mb: 4,
              flexWrap: 'wrap'
            }}>
              {/* Selector de Torneo */}
              <FormControl 
                sx={{ 
                  minWidth: 300,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'rgba(64, 181, 246, 0.3)' },
                    '&:hover fieldset': { borderColor: 'rgba(64, 181, 246, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#64b5f6' }
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                  '& .MuiSelect-icon': { color: '#64b5f6' }
                }}
              >
                <InputLabel>Seleccionar Torneo</InputLabel>
                <Select
                  value={torneoSeleccionado}
                  onChange={handleTorneoChange}
                  label="Seleccionar Torneo"
                  sx={{ color: 'white' }}
                >
                  {torneosDisponibles.map((torneo) => (
                    <MenuItem key={torneo._id} value={torneo._id}>
                      {torneo.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Selector de Categoría */}
              <FormControl 
                sx={{ 
                  minWidth: 250,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'rgba(64, 181, 246, 0.3)' },
                    '&:hover fieldset': { borderColor: 'rgba(64, 181, 246, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#64b5f6' }
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                  '& .MuiSelect-icon': { color: '#64b5f6' }
                }}
                disabled={!torneoSeleccionado || categorias.length === 0}
              >
                <InputLabel>Seleccionar Categoría</InputLabel>
                <Select
                  value={categoriaSeleccionada}
                  onChange={handleCategoriaChange}
                  label="Seleccionar Categoría"
                  sx={{ color: 'white' }}
                >
                  {categorias.map((categoria) => (
                    <MenuItem key={categoria} value={categoria}>
                      {obtenerNombreCategoria(categoria)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </motion.div>

          {/* CONTENIDO PRINCIPAL */}
          <AnimatePresence mode="wait">
            {torneoSeleccionado && categoriaSeleccionada && (
              <motion.div
                key={`${torneoSeleccionado}-${categoriaSeleccionada}`}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <Box sx={{ 
                  display: 'flex',
                  gap: 4,
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  '@media (max-width: 768px)': {
                    flexDirection: 'column',
                    gap: 3
                  }
                }}>
                  {/* TABLA DE POSICIONES - 50% del ancho */}
                  <Box sx={{ 
                    flex: '1 1 500px',
                    minWidth: { xs: '100%', md: '450px' },
                    maxWidth: '100%'
                  }}>
                    <TablaPosiciones
                      tablaPosiciones={tablaPosiciones}
                      categoriaSeleccionada={categoriaSeleccionada}
                      loading={loading.tabla}
                      onSeleccionEquipo={handleSeleccionEquipo}
                    />
                  </Box>

                  {/* PANEL DE ESTADÍSTICAS - 50% del ancho */}
                  <Box sx={{ 
                    flex: '1 1 500px',
                    minWidth: { xs: '100%', md: '450px' },
                    maxWidth: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3
                  }}>
                    {/* Tendencia de puntos */}
                    <Box sx={{ height: '350px' }}>
                      <TendenciaPuntos
                        tendenciaPuntos={tendenciaPuntos}
                        equipoSeleccionado={equipoSeleccionado}
                        loading={loading.tendencia}
                      />
                    </Box>
                    
                    {/* Grid de líderes */}
                    <Box sx={{ 
                      width: '100%'
                    }}>
                      <LideresEstadisticas
                        lideresEstadisticas={lideresEstadisticas}
                        equipoSeleccionado={equipoSeleccionado}
                        loading={loading.lideres}
                      />
                    </Box>
                  </Box>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MENSAJE DE SELECCIÓN */}
          {(!torneoSeleccionado || !categoriaSeleccionada) && (
            <motion.div variants={cardVariants}>
              <Box sx={{
                textAlign: 'center',
                py: 8,
                background: 'linear-gradient(145deg, rgba(64, 181, 246, 0.1), rgba(64, 181, 246, 0.05))',
                backdropFilter: 'blur(10px)',
                border: '2px dashed rgba(64, 181, 246, 0.3)',
                borderRadius: 3
              }}>
                <Analytics sx={{ fontSize: 64, color: 'rgba(64, 181, 246, 0.5)', mb: 2 }} />
                <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
                  Selecciona un torneo y categoría
                </Typography>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Para ver las estadísticas detalladas del torneo
                </Typography>
              </Box>
            </motion.div>
          )}
        </motion.div>
        <hr />
        <ClasificacionGeneral 
          torneoId={torneoSeleccionado} 
          categoria={categoriaSeleccionada} 
        />
      </Container>
    </Box>
  );
};