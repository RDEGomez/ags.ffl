import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import axiosInstance from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  TextField,
  Alert,
  Chip,
  Avatar,
  Divider,
  ButtonGroup,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  LinearProgress,
  Badge
} from '@mui/material';

import {
  SportsFootball as SportsFootballIcon,
  TouchApp as TouchAppIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Block as BlockIcon,
  Timer as TimerIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Undo as UndoIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  PlayArrow as PlayArrowIcon,
  Group as GroupIcon,
  Star as StarIcon
} from '@mui/icons-material';

const RegistroJugadas = ({ partido, onActualizar }) => {
  const { usuario, puedeGestionarTorneos } = useAuth();

  // Estados principales
  const [jugadaActual, setJugadaActual] = useState({
    tipoJugada: '',
    equipoEnPosesion: '',
    jugadorPrincipal: '',
    jugadorSecundario: '',
    descripcion: '',
    resultado: {
      puntos: 0,
      touchdown: false,
      intercepcion: false,
      sack: false
    }
  });

  const [loading, setLoading] = useState(false);
  const [jugadores, setJugadores] = useState({});
  const [ultimasJugadas, setUltimasJugadas] = useState([]);

  // Verificar permisos
  const puedeRegistrar = puedeGestionarTorneos() || usuario?.rol === 'arbitro';

  // Tipos de jugadas disponibles
  const tiposJugada = [
    { 
      value: 'touchdown', 
      label: 'Touchdown', 
      puntos: 6, 
      color: '#4caf50',
      icon: <TouchAppIcon />,
      descripcion: 'Anotación de 6 puntos'
    },
    { 
      value: 'pase_completo', 
      label: 'Pase Completo', 
      puntos: 0, 
      color: '#2196f3',
      icon: <SportsFootballIcon />,
      descripcion: 'Pase exitoso'
    },
    { 
      value: 'pase_incompleto', 
      label: 'Pase Incompleto', 
      puntos: 0, 
      color: '#ff9800',
      icon: <CancelIcon />,
      descripcion: 'Pase fallido'
    },
    { 
      value: 'intercepcion', 
      label: 'Intercepción', 
      puntos: 0, 
      color: '#f44336',
      icon: <SecurityIcon />,
      descripcion: 'Balón interceptado por la defensa'
    },
    { 
      value: 'corrida', 
      label: 'Corrida', 
      puntos: 0, 
      color: '#ff5722',
      icon: <SpeedIcon />,
      descripcion: 'Avance corriendo'
    },
    { 
      value: 'sack', 
      label: 'Sack', 
      puntos: 0, 
      color: '#9c27b0',
      icon: <BlockIcon />,
      descripcion: 'Captura del quarterback'
    },
    { 
      value: 'conversion_1pt', 
      label: 'Conversión 1pt', 
      puntos: 1, 
      color: '#00bcd4',
      icon: <StarIcon />,
      descripcion: 'Punto extra'
    },
    { 
      value: 'conversion_2pt', 
      label: 'Conversión 2pts', 
      puntos: 2, 
      color: '#00bcd4',
      icon: <StarIcon />,
      descripcion: 'Conversión de 2 puntos'
    },
    { 
      value: 'safety', 
      label: 'Safety', 
      puntos: 2, 
      color: '#795548',
      icon: <SecurityIcon />,
      descripcion: 'Seguridad - 2 puntos'
    },
    { 
      value: 'tackleo', 
      label: 'Tackleo', 
      puntos: 0, 
      color: '#607d8b',
      icon: <BlockIcon />,
      descripcion: 'Derribo del portador'
    }
  ];

  // Cargar jugadores cuando se selecciona un equipo
  useEffect(() => {
    const cargarJugadores = async () => {
      if (!partido) return;

      try {
        // Los jugadores ya vienen populados en el partido desde el backend
        const jugadoresLocal = partido.equipoLocal?.jugadores || [];
        const jugadoresVisitante = partido.equipoVisitante?.jugadores || [];

        setJugadores({
          [partido.equipoLocal?._id]: jugadoresLocal,
          [partido.equipoVisitante?._id]: jugadoresVisitante
        });
      } catch (error) {
        console.error('Error al cargar jugadores:', error);
      }
    };

    cargarJugadores();
  }, [partido]);

  // Obtener últimas jugadas
  useEffect(() => {
    if (partido?.jugadas) {
      setUltimasJugadas(partido.jugadas.slice(-5).reverse());
    }
  }, [partido]);

  // Limpiar formulario
  const limpiarFormulario = () => {
    setJugadaActual({
      tipoJugada: '',
      equipoEnPosesion: '',
      jugadorPrincipal: '',
      jugadorSecundario: '',
      descripcion: '',
      resultado: {
        puntos: 0,
        touchdown: false,
        intercepcion: false,
        sack: false
      }
    });
  };

  // Registrar jugada
  const registrarJugada = async () => {
    if (!puedeRegistrar) {
      Swal.fire({
        icon: 'error',
        title: 'Sin permisos',
        text: 'No tienes permisos para registrar jugadas'
      });
      return;
    }

    try {
      setLoading(true);

      const tipoSeleccionado = tiposJugada.find(t => t.value === jugadaActual.tipoJugada);
      
      const jugadaData = {
        tipoJugada: jugadaActual.tipoJugada,
        equipoEnPosesion: jugadaActual.equipoEnPosesion,
        jugadorPrincipal: jugadaActual.jugadorPrincipal,
        jugadorSecundario: jugadaActual.jugadorSecundario || undefined,
        descripcion: jugadaActual.descripcion,
        resultado: {
          puntos: tipoSeleccionado?.puntos || 0,
          touchdown: jugadaActual.tipoJugada === 'touchdown',
          intercepcion: jugadaActual.tipoJugada === 'intercepcion',
          sack: jugadaActual.tipoJugada === 'sack'
        }
      };

      await axiosInstance.post(`/partidos/${partido._id}/jugadas`, jugadaData);

      // Limpiar formulario
      limpiarFormulario();
      
      // Refrescar datos del partido
      onActualizar();

      // Mostrar confirmación
      Swal.fire({
        icon: 'success',
        title: '¡Jugada registrada!',
        text: `${tipoSeleccionado?.label} registrado correctamente`,
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('Error al registrar jugada:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.mensaje || 'No se pudo registrar la jugada'
      });
    } finally {
      setLoading(false);
    }
  };

  // Registro rápido de jugadas comunes
  const registroRapido = async (tipo, equipoId) => {
    if (!puedeRegistrar) return;

    try {
      const tipoJugada = tiposJugada.find(t => t.value === tipo);
      
      await axiosInstance.post(`/partidos/${partido._id}/jugadas`, {
        tipoJugada: tipo,
        equipoEnPosesion: equipoId,
        descripcion: `${tipoJugada.label} - Registro rápido`,
        resultado: {
          puntos: tipoJugada.puntos || 0,
          touchdown: tipo === 'touchdown',
          intercepcion: tipo === 'intercepcion',
          sack: tipo === 'sack'
        }
      });

      onActualizar();

      Swal.fire({
        icon: 'success',
        title: `${tipoJugada.label} registrado`,
        timer: 1500,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('Error en registro rápido:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo registrar la jugada'
      });
    }
  };

  // Obtener jugadores del equipo seleccionado
  const getJugadoresEquipo = (equipoId) => {
    return jugadores[equipoId] || [];
  };

  // Verificar si necesita jugador secundario
  const necesitaJugadorSecundario = (tipo) => {
    return ['pase_completo', 'intercepcion'].includes(tipo);
  };

  // Obtener información del tipo de jugada
  const getTipoJugadaInfo = (tipo) => {
    return tiposJugada.find(t => t.value === tipo);
  };

  if (!puedeRegistrar) {
    return (
      <Paper sx={{ 
        p: 4, 
        textAlign: 'center',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        border: '1px solid rgba(244, 67, 54, 0.3)'
      }}>
        <SecurityIcon sx={{ fontSize: 60, color: '#f44336', mb: 2 }} />
        <Typography variant="h6" sx={{ color: '#f44336', mb: 2 }}>
          Sin Permisos
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Solo administradores, capitanes y árbitros pueden registrar jugadas durante el partido.
        </Typography>
      </Paper>
    );
  }

  if (!['en_curso', 'medio_tiempo'].includes(partido?.estado)) {
    return (
      <Paper sx={{ 
        p: 4, 
        textAlign: 'center',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        border: '1px solid rgba(255, 152, 0, 0.3)'
      }}>
        <TimerIcon sx={{ fontSize: 60, color: '#ff9800', mb: 2 }} />
        <Typography variant="h6" sx={{ color: '#ff9800', mb: 2 }}>
          Partido No Iniciado
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          El registro de jugadas solo está disponible cuando el partido está en curso.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={4}>
        {/* Panel de registro principal */}
        <Grid item xs={12} lg={8}>
          <Card sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ 
                color: 'white', 
                mb: 3, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2 
              }}>
                <SportsFootballIcon sx={{ color: '#64b5f6' }} />
                Registro de Jugadas
              </Typography>

              {/* Botones rápidos por equipo */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  Acciones Rápidas
                </Typography>
                
                <Grid container spacing={2}>
                  {/* Botones equipo local */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ 
                      p: 2, 
                      backgroundColor: 'rgba(33, 150, 243, 0.1)',
                      border: '1px solid rgba(33, 150, 243, 0.3)'
                    }}>
                      <Typography variant="subtitle1" sx={{ 
                        color: '#2196f3', 
                        mb: 2, 
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <Avatar 
                          src={partido.equipoLocal?.imagen} 
                          sx={{ width: 24, height: 24 }}
                        >
                          <GroupIcon />
                        </Avatar>
                        {partido.equipoLocal?.nombre}
                      </Typography>
                      
                      <ButtonGroup variant="contained" size="small" sx={{ flexWrap: 'wrap', gap: 1 }}>
                        <Button 
                          color="success"
                          onClick={() => registroRapido('touchdown', partido.equipoLocal?._id)}
                          startIcon={<TouchAppIcon />}
                        >
                          TD
                        </Button>
                        <Button 
                          color="primary"
                          onClick={() => registroRapido('pase_completo', partido.equipoLocal?._id)}
                          startIcon={<SportsFootballIcon />}
                        >
                          Pase+
                        </Button>
                        <Button 
                          color="warning"
                          onClick={() => registroRapido('pase_incompleto', partido.equipoLocal?._id)}
                          startIcon={<CancelIcon />}
                        >
                          Pase-
                        </Button>
                      </ButtonGroup>
                    </Paper>
                  </Grid>

                  {/* Botones equipo visitante */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ 
                      p: 2, 
                      backgroundColor: 'rgba(255, 152, 0, 0.1)',
                      border: '1px solid rgba(255, 152, 0, 0.3)'
                    }}>
                      <Typography variant="subtitle1" sx={{ 
                        color: '#ff9800', 
                        mb: 2, 
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <Avatar 
                          src={partido.equipoVisitante?.imagen} 
                          sx={{ width: 24, height: 24 }}
                        >
                          <GroupIcon />
                        </Avatar>
                        {partido.equipoVisitante?.nombre}
                      </Typography>
                      
                      <ButtonGroup variant="contained" size="small" sx={{ flexWrap: 'wrap', gap: 1 }}>
                        <Button 
                          color="success"
                          onClick={() => registroRapido('touchdown', partido.equipoVisitante?._id)}
                          startIcon={<TouchAppIcon />}
                        >
                          TD
                        </Button>
                        <Button 
                          color="primary"
                          onClick={() => registroRapido('pase_completo', partido.equipoVisitante?._id)}
                          startIcon={<SportsFootballIcon />}
                        >
                          Pase+
                        </Button>
                        <Button 
                          color="warning"
                          onClick={() => registroRapido('pase_incompleto', partido.equipoVisitante?._id)}
                          startIcon={<CancelIcon />}
                        >
                          Pase-
                        </Button>
                      </ButtonGroup>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

              {/* Formulario detallado */}
              <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                Registro Detallado
              </Typography>

              <Grid container spacing={3}>
                {/* Selección de equipo */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Equipo en Posesión *
                    </InputLabel>
                    <Select
                      value={jugadaActual.equipoEnPosesion}
                      label="Equipo en Posesión *"
                      onChange={(e) => setJugadaActual({
                        ...jugadaActual, 
                        equipoEnPosesion: e.target.value,
                        jugadorPrincipal: '', // Reset jugador
                        jugadorSecundario: ''
                      })}
                      sx={{
                        color: 'white',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        '.MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                        }
                      }}
                    >
                      <MenuItem value={partido.equipoLocal?._id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar 
                            src={partido.equipoLocal?.imagen} 
                            sx={{ width: 24, height: 24 }}
                          >
                            <GroupIcon />
                          </Avatar>
                          {partido.equipoLocal?.nombre}
                        </Box>
                      </MenuItem>
                      <MenuItem value={partido.equipoVisitante?._id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar 
                            src={partido.equipoVisitante?.imagen} 
                            sx={{ width: 24, height: 24 }}
                          >
                            <GroupIcon />
                          </Avatar>
                          {partido.equipoVisitante?.nombre}
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Tipo de jugada */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Tipo de Jugada *
                    </InputLabel>
                    <Select
                      value={jugadaActual.tipoJugada}
                      label="Tipo de Jugada *"
                      onChange={(e) => {
                        const tipo = getTipoJugadaInfo(e.target.value);
                        setJugadaActual({
                          ...jugadaActual,
                          tipoJugada: e.target.value,
                          resultado: {
                            ...jugadaActual.resultado,
                            puntos: tipo?.puntos || 0
                          }
                        });
                      }}
                      sx={{
                        color: 'white',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        '.MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                        }
                      }}
                    >
                      {tiposJugada.map(tipo => (
                        <MenuItem key={tipo.value} value={tipo.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ color: tipo.color }}>
                              {tipo.icon}
                            </Box>
                            <Box>
                              <Typography variant="body2">
                                {tipo.label}
                                {tipo.puntos > 0 && (
                                  <Chip 
                                    label={`+${tipo.puntos} pts`}
                                    size="small"
                                    color="success"
                                    sx={{ ml: 1, height: 20 }}
                                  />
                                )}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {tipo.descripcion}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Jugador principal */}
                {jugadaActual.equipoEnPosesion && (
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Jugador Principal *
                      </InputLabel>
                      <Select
                        value={jugadaActual.jugadorPrincipal}
                        label="Jugador Principal *"
                        onChange={(e) => setJugadaActual({
                          ...jugadaActual, 
                          jugadorPrincipal: e.target.value
                        })}
                        sx={{
                          color: 'white',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          '.MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                          }
                        }}
                      >
                        {getJugadoresEquipo(jugadaActual.equipoEnPosesion).map(jugador => (
                          <MenuItem key={jugador._id} value={jugador._id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar 
                                src={jugador.imagen} 
                                sx={{ width: 24, height: 24 }}
                              >
                                <PersonIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="body2">
                                  #{jugador.numero} {jugador.nombre}
                                </Typography>
                              </Box>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {/* Jugador secundario (opcional para pases) */}
                {jugadaActual.equipoEnPosesion && necesitaJugadorSecundario(jugadaActual.tipoJugada) && (
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Receptor/Jugador Secundario
                      </InputLabel>
                      <Select
                        value={jugadaActual.jugadorSecundario}
                        label="Receptor/Jugador Secundario"
                        onChange={(e) => setJugadaActual({
                          ...jugadaActual, 
                          jugadorSecundario: e.target.value
                        })}
                        sx={{
                          color: 'white',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          '.MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                          }
                        }}
                      >
                        {getJugadoresEquipo(jugadaActual.equipoEnPosesion).map(jugador => (
                          <MenuItem key={jugador._id} value={jugador._id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar 
                                src={jugador.imagen} 
                                sx={{ width: 24, height: 24 }}
                              >
                                <PersonIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="body2">
                                  #{jugador.numero} {jugador.nombre}
                                </Typography>
                              </Box>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {/* Descripción */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Descripción (opcional)"
                    value={jugadaActual.descripcion}
                    onChange={(e) => setJugadaActual({
                      ...jugadaActual, 
                      descripcion: e.target.value
                    })}
                    multiline
                    rows={2}
                    placeholder="Describe los detalles de la jugada..."
                    InputLabelProps={{
                      sx: { color: 'rgba(255, 255, 255, 0.7)' }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                        }
                      }
                    }}
                  />
                </Grid>

                {/* Botones de acción */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      onClick={registrarJugada}
                      disabled={!jugadaActual.tipoJugada || !jugadaActual.equipoEnPosesion || loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                      sx={{ minWidth: 160 }}
                    >
                      {loading ? 'Registrando...' : 'Registrar Jugada'}
                    </Button>
                    
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={limpiarFormulario}
                      startIcon={<UndoIcon />}
                      sx={{
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        color: 'rgba(255, 255, 255, 0.7)',
                        minWidth: 120
                      }}
                    >
                      Limpiar
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Panel lateral - Últimas jugadas */}
        <Grid item xs={12} lg={4}>
          <Card sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
            height: 'fit-content'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ 
                color: 'white', 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <TimerIcon sx={{ color: '#64b5f6' }} />
                Últimas Jugadas
                <Badge badgeContent={ultimasJugadas.length} color="primary" />
              </Typography>

              {ultimasJugadas.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <SportsFootballIcon sx={{ fontSize: 40, color: 'rgba(255, 255, 255, 0.3)', mb: 1 }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                    No hay jugadas registradas aún
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {ultimasJugadas.map((jugada, index) => {
                    const tipoInfo = getTipoJugadaInfo(jugada.tipoJugada);
                    return (
                      <ListItem key={jugada.numero || index} sx={{ 
                        px: 0, 
                        py: 1,
                        borderBottom: index < ultimasJugadas.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
                      }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Box sx={{ color: tipoInfo?.color || '#64b5f6' }}>
                            {tipoInfo?.icon || <SportsFootballIcon />}
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                                  {tipoInfo?.label || jugada.tipoJugada}
                                </Typography>
                                {jugada.resultado?.puntos > 0 && (
                                  <Chip 
                                    label={`+${jugada.resultado.puntos} pts`}
                                    size="small"
                                    color="success"
                                    sx={{ height: 18, fontSize: '0.6rem' }}
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                  #{jugada.numero} • {jugada.tiempo?.periodo ? `Período ${jugada.tiempo.periodo}` : 'En vivo'}
                                </Typography>
                                {jugada.descripcion && (
                                  <Typography variant="caption" sx={{ 
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    display: 'block',
                                    mt: 0.5
                                  }}>
                                    {jugada.descripcion.length > 50 
                                      ? `${jugada.descripcion.substring(0, 50)}...` 
                                      : jugada.descripcion
                                    }
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                )}

                {/* Marcador actual */}
                <Box sx={{ 
                  mt: 3, 
                  p: 2, 
                  backgroundColor: 'rgba(100, 181, 246, 0.1)',
                  borderRadius: 2,
                  border: '1px solid rgba(100, 181, 246, 0.2)'
                }}>
                  <Typography variant="subtitle2" sx={{ color: '#64b5f6', mb: 1, textAlign: 'center' }}>
                    Marcador Actual
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center'
                  }}>
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                      <Typography variant="h4" sx={{ color: '#2196f3', fontWeight: 'bold' }}>
                        {partido?.marcador?.local || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {partido?.equipoLocal?.nombre}
                      </Typography>
                    </Box>
                    
                    <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.5)', mx: 2 }}>
                      -
                    </Typography>
                    
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                      <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                        {partido?.marcador?.visitante || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {partido?.equipoVisitante?.nombre}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Información del partido */}
                <Box sx={{ 
                  mt: 2, 
                  p: 2, 
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <Grid container spacing={2} sx={{ textAlign: 'center' }}>
                    <Grid item xs={6}>
                      <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                        {partido?.jugadas?.length || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Jugadas
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                        {partido?.duracionMinutos || 50}min
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Duración
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>

            {/* Card de ayuda */}
            <Card sx={{
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              borderRadius: 3,
              mt: 3
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ 
                  color: '#4caf50', 
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <CheckCircleIcon />
                  Consejos
                </Typography>
                
                <List sx={{ p: 0 }}>
                  <ListItem sx={{ px: 0, py: 0.5 }}>
                    <ListItemText
                      primary={
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                          • Usa los botones rápidos para jugadas comunes
                        </Typography>
                      }
                    />
                  </ListItem>
                  
                  <ListItem sx={{ px: 0, py: 0.5 }}>
                    <ListItemText
                      primary={
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                          • El marcador se actualiza automáticamente
                        </Typography>
                      }
                    />
                  </ListItem>
                  
                  <ListItem sx={{ px: 0, py: 0.5 }}>
                    <ListItemText
                      primary={
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                          • Puedes agregar descripciones detalladas
                        </Typography>
                      }
                    />
                  </ListItem>
                  
                  <ListItem sx={{ px: 0, py: 0.5 }}>
                    <ListItemText
                      primary={
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                          • Las estadísticas se calculan automáticamente
                        </Typography>
                      }
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

export default RegistroJugadas;