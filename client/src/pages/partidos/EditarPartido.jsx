import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  History as HistoryIcon,
  SportsSoccer as SoccerIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { usePartidoEdit } from '../../hooks/usePartidoEdit';
import { getCategoryName } from '../../helpers/mappings';

// 🎨 Variantes de animación
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

// 🎯 Estados de partido disponibles
const estadosPartido = [
  { value: 'programado', label: 'Programado', color: '#2196f3' },
  { value: 'en_curso', label: 'En Curso', color: '#4caf50' },
  { value: 'medio_tiempo', label: 'Medio Tiempo', color: '#ff9800' },
  { value: 'finalizado', label: 'Finalizado', color: '#9e9e9e' },
  { value: 'suspendido', label: 'Suspendido', color: '#f44336' },
  { value: 'cancelado', label: 'Cancelado', color: '#f44336' }
];

export const EditarPartido = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { puedeGestionarPartidos, tieneRol, usuario } = useAuth();
  
  // Estados locales
  const [mostrarMarcador, setMostrarMarcador] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [confirmacionGuardar, setConfirmacionGuardar] = useState(false);

  // Hook personalizado para manejo de partido
  const {
    partido,
    loading,
    error,
    guardando,
    cambios,
    historial,
    setCampo,
    guardarCambios,
    cargarHistorial,
    resetearCambios
  } = usePartidoEdit(id);

  // 🔐 Verificar permisos
  const esAdmin = tieneRol('admin');
  const puedeEditarBasico = esAdmin || (puedeGestionarPartidos && partido?.estado === 'programado');
  const puedeEditarAvanzado = esAdmin;

  // 🔄 Efectos
  useEffect(() => {
    if (partido && puedeEditarAvanzado) {
      setMostrarMarcador(true);
    }
  }, [partido, puedeEditarAvanzado]);

  // 📅 Formatear fecha para input datetime-local
  const formatearFechaParaInput = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toISOString().slice(0, 16);
  };

  // 🎨 Obtener color del estado
  const getEstadoColor = (estado) => {
    const estadoInfo = estadosPartido.find(e => e.value === estado);
    return estadoInfo?.color || '#9e9e9e';
  };

  // 🔙 Volver atrás
  const handleVolver = () => {
    if (Object.keys(cambios).length > 0) {
      if (window.confirm('¿Seguro que quieres salir? Los cambios no guardados se perderán.')) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  // 💾 Guardar cambios
  const handleGuardar = async () => {
    setConfirmacionGuardar(false);
    const exito = await guardarCambios();
    if (exito) {
      navigate(`/partidos/${id}`);
    }
  };

  // 📋 Cargar historial
  const handleMostrarHistorial = async () => {
    await cargarHistorial();
    setMostrarHistorial(true);
  };

  // 🚨 Loading y errores
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
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
        <Button onClick={handleVolver} startIcon={<ArrowBackIcon />}>
          Volver
        </Button>
      </Box>
    );
  }

  if (!partido) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Partido no encontrado
        </Alert>
      </Box>
    );
  }

  // 🚫 Sin permisos
  if (!puedeEditarBasico) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tienes permisos para editar este partido
        </Alert>
        <Button onClick={handleVolver} startIcon={<ArrowBackIcon />} sx={{ mt: 2 }}>
          Volver
        </Button>
      </Box>
    );
  }

  const tieneCambios = Object.keys(cambios).length > 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Box sx={{ p: 3, maxWidth: '1200px', mx: 'auto' }}>
        {/* 📋 Header */}
        <motion.div variants={itemVariants}>
          <Paper sx={{
            p: 3,
            mb: 3,
            background: 'linear-gradient(135deg, rgba(100, 181, 246, 0.1) 0%, rgba(3, 169, 244, 0.05) 100%)',
            border: '1px solid rgba(100, 181, 246, 0.2)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={handleVolver} sx={{ color: '#64b5f6' }}>
                  <ArrowBackIcon />
                </IconButton>
                <SoccerIcon sx={{ color: '#64b5f6', fontSize: 32 }} />
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  Editar Partido
                </Typography>
              </Box>
              
              {/* 🎯 Estado actual */}
              <Chip
                label={estadosPartido.find(e => e.value === partido.estado)?.label || partido.estado}
                sx={{
                  backgroundColor: getEstadoColor(partido.estado),
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            </Box>

            {/* 📊 Info del partido */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ color: 'white' }}>
                {partido.equipoLocal?.nombre} vs {partido.equipoVisitante?.nombre}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                {getCategoryName(partido.categoria)} • {partido.torneo?.nombre}
              </Typography>
              {mostrarMarcador && (
                <Typography variant="body1" sx={{ color: '#ffd700', fontWeight: 'bold' }}>
                  {partido.marcador?.local || 0} - {partido.marcador?.visitante || 0}
                </Typography>
              )}
            </Box>
          </Paper>
        </motion.div>

        <Grid container spacing={3}>
          {/* 📅 Información básica */}
          <Grid item xs={12} md={6}>
            <motion.div variants={itemVariants}>
              <Paper sx={{ p: 3, height: 'fit-content' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <ScheduleIcon sx={{ color: '#64b5f6', mr: 1 }} />
                  <Typography variant="h6" sx={{ color: 'white' }}>
                    Información del Partido
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  {/* 📅 Fecha y hora */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="datetime-local"
                      label="Fecha y Hora"
                      value={formatearFechaParaInput(cambios.fechaHora || partido.fechaHora)}
                      onChange={(e) => setCampo('fechaHora', e.target.value)}
                      disabled={!puedeEditarBasico}
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                          '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                          '&.Mui-focused fieldset': { borderColor: '#64b5f6' }
                        },
                        '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                      }}
                    />
                  </Grid>

                  {/* ⏱️ Duración */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Duración (minutos)"
                      value={cambios.duracionMinutos ?? partido.duracionMinutos ?? 50}
                      onChange={(e) => setCampo('duracionMinutos', parseInt(e.target.value))}
                      disabled={!puedeEditarBasico}
                      inputProps={{ min: 20, max: 120 }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                          '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                          '&.Mui-focused fieldset': { borderColor: '#64b5f6' }
                        },
                        '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                      }}
                    />
                  </Grid>

                  {/* 🏟️ Sede */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Sede"
                      value={cambios.sede?.nombre || partido.sede?.nombre || ''}
                      onChange={(e) => setCampo('sede', { ...partido.sede, nombre: e.target.value })}
                      disabled={!puedeEditarBasico}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                          '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                          '&.Mui-focused fieldset': { borderColor: '#64b5f6' }
                        },
                        '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                      }}
                    />
                  </Grid>

                  {/* 📝 Observaciones */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Observaciones"
                      value={cambios.observaciones ?? partido.observaciones ?? ''}
                      onChange={(e) => setCampo('observaciones', e.target.value)}
                      disabled={!puedeEditarBasico}
                      placeholder="Agregar observaciones sobre el partido..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                          '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                          '&.Mui-focused fieldset': { borderColor: '#64b5f6' }
                        },
                        '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </motion.div>
          </Grid>

          {/* 🎯 Configuración avanzada */}
          <Grid item xs={12} md={6}>
            <motion.div variants={itemVariants}>
              <Paper sx={{ p: 3, height: 'fit-content' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <PersonIcon sx={{ color: '#64b5f6', mr: 1 }} />
                  <Typography variant="h6" sx={{ color: 'white' }}>
                    Configuración Avanzada
                  </Typography>
                  {!puedeEditarAvanzado && (
                    <Tooltip title="Solo administradores">
                      <WarningIcon sx={{ color: '#ff9800', ml: 1, fontSize: 20 }} />
                    </Tooltip>
                  )}
                </Box>

                <Grid container spacing={2}>
                  {/* 🎯 Estado del partido */}
                  <Grid item xs={12}>
                    <FormControl fullWidth disabled={!puedeEditarAvanzado}>
                      <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Estado del Partido
                      </InputLabel>
                      <Select
                        value={cambios.estado || partido.estado}
                        label="Estado del Partido"
                        onChange={(e) => setCampo('estado', e.target.value)}
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
                        {estadosPartido.map(estado => (
                          <MenuItem key={estado.value} value={estado.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  backgroundColor: estado.color
                                }}
                              />
                              {estado.label}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* 📊 Control de marcador */}
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={mostrarMarcador}
                          onChange={(e) => setMostrarMarcador(e.target.checked)}
                          disabled={!puedeEditarAvanzado}
                        />
                      }
                      label="Mostrar editor de marcador"
                      sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    />
                  </Grid>

                  {/* 🥅 Marcador */}
                  {mostrarMarcador && puedeEditarAvanzado && (
                    <>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          type="number"
                          label={`${partido.equipoLocal?.nombre} (Local)`}
                          value={cambios.marcador?.local ?? partido.marcador?.local ?? 0}
                          onChange={(e) => setCampo('marcador', {
                            ...partido.marcador,
                            local: parseInt(e.target.value) || 0
                          })}
                          inputProps={{ min: 0, max: 99 }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: 'white',
                              '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                              '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                              '&.Mui-focused fieldset': { borderColor: '#64b5f6' }
                            },
                            '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                          }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          type="number"
                          label={`${partido.equipoVisitante?.nombre} (Visitante)`}
                          value={cambios.marcador?.visitante ?? partido.marcador?.visitante ?? 0}
                          onChange={(e) => setCampo('marcador', {
                            ...partido.marcador,
                            visitante: parseInt(e.target.value) || 0
                          })}
                          inputProps={{ min: 0, max: 99 }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: 'white',
                              '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                              '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                              '&.Mui-focused fieldset': { borderColor: '#64b5f6' }
                            },
                            '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                          }}
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>

        {/* 🔄 Botones de acción */}
        <motion.div variants={itemVariants}>
          <Paper sx={{ p: 3, mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  onClick={handleVolver}
                  startIcon={<ArrowBackIcon />}
                  sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={resetearCambios}
                  disabled={!tieneCambios}
                  sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                >
                  Resetear
                </Button>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  onClick={handleMostrarHistorial}
                  startIcon={<HistoryIcon />}
                  variant="outlined"
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    '&:hover': { borderColor: '#64b5f6' }
                  }}
                >
                  Historial
                </Button>
                <Button
                  onClick={() => setConfirmacionGuardar(true)}
                  disabled={!tieneCambios || guardando}
                  startIcon={guardando ? <CircularProgress size={20} /> : <SaveIcon />}
                  variant="contained"
                  sx={{
                    backgroundColor: '#4caf50',
                    '&:hover': { backgroundColor: '#45a049' },
                    '&:disabled': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                  }}
                >
                  {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </Box>
            </Box>

            {/* 📝 Resumen de cambios */}
            {tieneCambios && (
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                  Cambios pendientes:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {Object.keys(cambios).map(campo => (
                    <Chip
                      key={campo}
                      label={campo}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(100, 181, 246, 0.2)',
                        color: '#64b5f6'
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
        </motion.div>

        {/* 💬 Diálogo de confirmación */}
        <Dialog
          open={confirmacionGuardar}
          onClose={() => setConfirmacionGuardar(false)}
          PaperProps={{
            sx: { backgroundColor: '#1a1a1a', color: 'white' }
          }}
        >
          <DialogTitle>Confirmar Cambios</DialogTitle>
          <DialogContent>
            <Typography>
              ¿Estás seguro de que quieres guardar estos cambios en el partido?
            </Typography>
            {Object.keys(cambios).length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Campos modificados: {Object.keys(cambios).join(', ')}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmacionGuardar(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGuardar} variant="contained" color="primary">
              Confirmar
            </Button>
          </DialogActions>
        </Dialog>

        {/* 📋 Diálogo de historial */}
        <Dialog
          open={mostrarHistorial}
          onClose={() => setMostrarHistorial(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { backgroundColor: '#1a1a1a', color: 'white' }
          }}
        >
          <DialogTitle>Historial del Partido</DialogTitle>
          <DialogContent>
            {historial.length > 0 ? (
              <Box sx={{ mt: 1 }}>
                {historial.map((evento, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      mb: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 1,
                      borderLeft: `3px solid ${evento.tipo === 'marcador' ? '#4caf50' : '#64b5f6'}`
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {evento.accion}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {new Date(evento.fecha).toLocaleString()} • {evento.usuario}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                No hay historial disponible
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMostrarHistorial(false)}>
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </motion.div>
  );
};