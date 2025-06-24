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
  Container,
  Modal,
  Paper,
  Button
} from '@mui/material';
import {
  Refresh,
  Analytics,
  Close
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

// 🔥 COMPONENTE: MODAL PARA ESTADÍSTICAS DEL EQUIPO (Layout Actualizado)
const ModalEstadisticasEquipo = ({ open, onClose, equipoSeleccionado, lideresEstadisticas, tendenciaPuntos, loading }) => {
  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '95%', sm: '90%', md: '85%', lg: '80%' },
    maxWidth: '1400px',
    maxHeight: '90vh',
    bgcolor: 'rgba(18, 18, 18, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: 3,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    p: 0,
    overflow: 'hidden'
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      BackdropProps={{
        timeout: 500,
        sx: { backgroundColor: 'rgba(0, 0, 0, 0.8)' }
      }}
    >
      <Box sx={modalStyle}>
        {/* Header del Modal */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 3,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {equipoSeleccionado?.equipo?.imagen && (
              <Box
                component="img"
                src={equipoSeleccionado.equipo.imagen}
                alt={equipoSeleccionado.equipo.nombre}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1,
                  objectFit: 'cover'
                }}
              />
            )}
            <Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                {equipoSeleccionado?.equipo?.nombre}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Estadísticas Detalladas del Equipo
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Box>

        {/* Contenido del Modal */}
        <Box sx={{ 
          p: 3,
          maxHeight: 'calc(90vh - 120px)',
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '4px',
          },
        }}>
          
          {/* NUEVO LAYOUT: Grid de 3 columnas para líderes */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 3,
            mb: 4,
            width: '100%',
            '@media (max-width: 1024px)': {
              gridTemplateColumns: 'repeat(2, 1fr)' // 2 columnas en tablets
            },
            '@media (max-width: 768px)': {
              gridTemplateColumns: '1fr' // Una columna en móvil
            }
          }}>
            
            {/* LÍDERES ESTADÍSTICAS SIN HEADER - Se distribuyen en 3 columnas */}
            <LideresEstadisticas
              lideresEstadisticas={lideresEstadisticas}
              equipoSeleccionado={equipoSeleccionado}
              loading={loading}
              sinHeader={true} // Sin header
              layoutModal={true} // Layout especial para modal
            />
            
          </Box>

          {/* TENDENCIA AL FINAL - Ancho completo y más altura */}
          <Box sx={{ 
            width: '100%',
            height: '450px', // Altura fija más grande
            mt: 3
          }}>
            <TendenciaPuntos
              tendenciaPuntos={tendenciaPuntos}
              equipoSeleccionado={equipoSeleccionado}
              loading={loading.tendencia}
            />
          </Box>
          
        </Box>
      </Box>
    </Modal>
  );
};

export const DashboardEstadisticas = () => {
  // 🔥 HOOKS - LÓGICA ORIGINAL RESTAURADA EXACTAMENTE
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
  const [modalAbierto, setModalAbierto] = useState(false); // SOLO ESTADO NUEVO

  const { 
    torneosDisponibles = [], 
    tablaPosiciones = [], 
    tendenciaPuntos = [], 
    lideresEstadisticas = {} 
  } = data || {};

  // 🔥 LOADING STATES INDIVIDUALES - ORIGINAL
  const loading = {
    general: !data && hookLoading,
    tabla: hookLoading?.tabla || false,
    tendencia: hookLoading?.tendencia || false,
    lideres: hookLoading?.lideres || false
  };

  // 🔥 COMPUTED VALUES - LÓGICA ORIGINAL EXACTA
  const torneo = useMemo(() => 
    torneosDisponibles.find(t => t._id === torneoSeleccionado) || null,
    [torneosDisponibles, torneoSeleccionado]
  );

  const categorias = useMemo(() => 
    (torneo?.categorias || []).filter(esCategoriaValida),
    [torneo]
  );

  // 🔥 HANDLERS - LÓGICA ORIGINAL EXACTA
  const handleTorneoChange = useCallback((event) => {
    const nuevoTorneo = event.target.value;
    setTorneoSeleccionado(nuevoTorneo);
    setCategoriaSeleccionada('');
    setEquipoSeleccionado(null);
    setModalAbierto(false); // SOLO LÍNEA NUEVA
  }, []);

  const handleCategoriaChange = useCallback((event) => {
    const nuevaCategoria = event.target.value;
    setCategoriaSeleccionada(nuevaCategoria);
    setEquipoSeleccionado(null);
    setModalAbierto(false); // SOLO LÍNEA NUEVA
  }, []);

  const handleSeleccionEquipo = useCallback((equipoFila) => {
    setEquipoSeleccionado(equipoFila);
    setModalAbierto(true); // SOLO LÍNEA NUEVA
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalAbierto(false);
  }, []); // SOLO FUNCIÓN NUEVA

  const handleRefresh = useCallback(async () => {
    await refrescarTodo(torneoSeleccionado, categoriaSeleccionada, equipoSeleccionado?.equipo._id);
  }, [refrescarTodo, torneoSeleccionado, categoriaSeleccionada, equipoSeleccionado]);

  // 🔥 EFFECTS - LÓGICA ORIGINAL EXACTA
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

  // 🔥 RENDER - LÓGICA ORIGINAL DE LOADING
  if (loading.general) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh'
        }}>
          <CircularProgress sx={{ color: '#64b5f6' }} />
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
      py: 4
    }}>
      <Container maxWidth="xl">
        {/* HEADER - ORIGINAL */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  background: 'linear-gradient(45deg, #64b5f6, #42a5f5, #1e88e5)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  mb: 1
                }}
              >
                📊 Dashboard de Estadísticas
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Análisis completo de rendimiento por equipos
              </Typography>
            </Box>

            <Tooltip title="Actualizar datos">
              <IconButton
                onClick={handleRefresh}
                disabled={loading.general}
                sx={{
                  bgcolor: 'rgba(100, 181, 246, 0.1)',
                  color: '#64b5f6',
                  '&:hover': { bgcolor: 'rgba(100, 181, 246, 0.2)' }
                }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>

          {/* CONTROLES - ORIGINAL */}
          <motion.div variants={cardVariants}>
            <Box sx={{
              display: 'flex',
              gap: 3,
              mb: 4,
              flexWrap: 'wrap'
            }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&.Mui-focused': {
                      color: '#64b5f6'
                    },
                    '&.MuiFormLabel-filled': {
                      color: 'rgba(255, 255, 255, 0.7)'
                    }
                  }}
                >
                  Torneo
                </InputLabel>
                <Select
                  value={torneoSeleccionado}
                  onChange={handleTorneoChange}
                  label="Torneo"
                  sx={{
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
                  }}
                >
                  {torneosDisponibles.map((torneo) => (
                    <MenuItem key={torneo._id} value={torneo._id}>
                      {torneo.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 200 }} disabled={!torneoSeleccionado}>
                <InputLabel 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&.Mui-focused': {
                      color: '#64b5f6'
                    },
                    '&.MuiFormLabel-filled': {
                      color: 'rgba(255, 255, 255, 0.7)'
                    },
                    '&.Mui-disabled': {
                      color: 'rgba(255, 255, 255, 0.4)'
                    }
                  }}
                >
                  Categoría
                </InputLabel>
                <Select
                  value={categoriaSeleccionada}
                  onChange={handleCategoriaChange}
                  label="Categoría"
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.3)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.5)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#64b5f6'
                    },
                    '&.Mui-disabled .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.2)'
                    }
                  }}
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

          {/* ERROR - ORIGINAL */}
          {error && (
            <motion.div variants={cardVariants}>
              <Alert
                severity="error"
                sx={{
                  mb: 4,
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                  color: '#f44336',
                  border: '1px solid rgba(244, 67, 54, 0.3)'
                }}
                action={
                  <IconButton size="small" onClick={handleRefresh} sx={{ color: '#f44336' }}>
                    <Refresh />
                  </IconButton>
                }
              >
                {error}
              </Alert>
            </motion.div>
          )}

          {/* CONTENIDO PRINCIPAL - SOLO LAYOUT CAMBIADO */}
          <AnimatePresence mode="wait">
            {torneoSeleccionado && categoriaSeleccionada && (
              <motion.div
                key={`${torneoSeleccionado}-${categoriaSeleccionada}`}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                {/* NUEVO LAYOUT CON FLEXBOX */}
                <Box sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  gap: 3,
                  mb: 4
                }}>
                  
                  {/* TABLA DE POSICIONES */}
                  <Box sx={{ 
                    flex: { xs: '1', md: '1 1 50%' },
                    minWidth: 0
                  }}>
                    <TablaPosiciones
                      tablaPosiciones={tablaPosiciones}
                      torneoSeleccionado={torneoSeleccionado}
                      categoriaSeleccionada={categoriaSeleccionada}
                      loading={loading.tabla}
                      onSeleccionEquipo={handleSeleccionEquipo}
                    />
                  </Box>

                  {/* CLASIFICACIÓN GENERAL (movida aquí) */}
                  <Box sx={{ 
                    flex: { xs: '1', md: '1 1 50%' },
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <ClasificacionGeneral 
                      torneoId={torneoSeleccionado} 
                      categoria={categoriaSeleccionada} 
                    />
                  </Box>

                </Box>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MENSAJE DE SELECCIÓN - ORIGINAL */}
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

        {/* MODAL DE ESTADÍSTICAS DEL EQUIPO - NUEVO */}
        <ModalEstadisticasEquipo
          open={modalAbierto}
          onClose={handleCloseModal}
          equipoSeleccionado={equipoSeleccionado}
          lideresEstadisticas={lideresEstadisticas}
          tendenciaPuntos={tendenciaPuntos}
          loading={loading}
        />
      </Container>
    </Box>
  );
};