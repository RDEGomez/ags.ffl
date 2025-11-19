import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import axiosInstance from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Paper,
  Modal,
  Backdrop,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Badge,
  Checkbox,
  FormControlLabel,
  Avatar,
  Chip,
  // 🚀 NUEVOS IMPORTS PARA CAPTURA RÁPIDA
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  Snackbar,
  CircularProgress,
  Grid,
  Collapse
} from '@mui/material';

import {
  SportsFootball as SportsFootballIcon,
  TouchApp as TouchAppIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Block as BlockIcon,
  Timer as TimerIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  SportsCricket as SportsIcon,
  DirectionsRun as RunIcon,
  PanTool as BlockHandIcon,
  StarBorder as StarIcon,
  Bolt as BoltIcon,
  Shield as ShieldIcon,
  DragIndicator as DragIcon,
  // 🚀 NUEVOS ICONOS PARA CAPTURA RÁPIDA
  FlashOn as FastCaptureIcon,
  Repeat as RepeatIcon,
  Clear as ClearIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

const RegistroJugadas = ({ partido, onActualizar }) => {
  const { usuario, puedeGestionarPartidos } = useAuth();

  // Estados principales ORIGINALES
  const [modalAbierto, setModalAbierto] = useState(false);
  const [jugadaSeleccionada, setJugadaSeleccionada] = useState(null);
  const [formularioData, setFormularioData] = useState({});
  const [loading, setLoading] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dropzoneActive, setDropzoneActive] = useState(false);
  const [touchdownMarcado, setTouchdownMarcado] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(true); // true = local, false = visitante
  const dropzoneRef = useRef(null);

  // 🚀 NUEVOS ESTADOS PARA CAPTURA RÁPIDA
  const [modoCaptura, setModoCaptura] = useState('visual'); // 'visual' | 'rapida'
  const [capturaRapidaExpandida, setCapturaRapidaExpandida] = useState(false);
  const [datosCaptura, setDatosCaptura] = useState({
    equipoEnPosesion: '',
    tipoJugada: '',
    jugadorPrincipal: '',
    jugadorSecundario: '',
    puntos: '',
    repeticiones: 1
  });
  const [historialSelecciones, setHistorialSelecciones] = useState({
    ultimoEquipo: '',
    ultimaJugada: ''
  });
  const [procesandoCaptura, setProcesandoCaptura] = useState(false);
  const [snackbar, setSnackbar] = useState({ abierto: false, mensaje: '', tipo: 'success' });

  // Verificar permisos
  const puedeRegistrar = puedeGestionarPartidos();

  // 🎯 TIPOS DE JUGADAS CON ICONOS Y CONFIGURACIÓN (ORIGINALES)
  const tiposJugada = [
  {
    id: 'pase_completo',
    label: 'Pase Completo',
    icon: <TouchAppIcon />,
    color: '#4caf50',
    gradient: 'linear-gradient(135deg, #4caf50, #66bb6a)',
    puntos: 0,
    campos: [
      { nombre: 'pasador', label: 'Pasador', requerido: true },
      { nombre: 'receptor', label: 'Receptor', requerido: true }
    ],
    tieneCheckboxTouchdown: true
  },
  {
    id: 'pase_incompleto',
    label: 'Pase Incompleto',
    icon: <BlockIcon />,
    color: '#ff9800',
    gradient: 'linear-gradient(135deg, #ff9800, #ffb74d)',
    puntos: 0,
    campos: [
      { nombre: 'pasador', label: 'Pasador', requerido: true }
    ]
  },
  {
    id: 'corrida',
    label: 'Corrida',
    icon: <RunIcon />,
    color: '#2196f3',
    gradient: 'linear-gradient(135deg, #2196f3, #42a5f5)',
    puntos: 0,
    campos: [
      { nombre: 'corredor', label: 'Corredor', requerido: true },
      { nombre: 'tackleador', label: 'Tackleador', requerido: false }
    ],
    tieneCheckboxTouchdown: true
  },
  {
    id: 'tackleo',
    label: 'Tackleo',
    icon: <SportsIcon />,
    color: '#795548',
    gradient: 'linear-gradient(135deg, #795548, #8d6e63)',
    puntos: 0,
    campos: [
      { nombre: 'tackleador', label: 'Jugador que Tacklea', requerido: true }
    ]
  },
  {
    id: 'sack',
    label: 'Sack',
    icon: <ShieldIcon />,
    color: '#9c27b0',
    gradient: 'linear-gradient(135deg, #9c27b0, #ba68c8)',
    puntos: 0,
    campos: [
      { nombre: 'tackleador', label: 'Jugador que hace Sack', requerido: true }
    ]
  },
  {
    id: 'intercepcion',
    label: 'Intercepción',
    icon: <BlockHandIcon />,
    color: '#3f51b5',
    gradient: 'linear-gradient(135deg, #3f51b5, #5c6bc0)',
    puntos: 0,
    campos: [
      { nombre: 'interceptor', label: 'Interceptor', requerido: true },
      { nombre: 'qb_interceptado', label: 'QB Interceptado (Equipo Contrario)', requerido: true }
    ],
    tieneCheckboxTouchdown: true,
    campoTouchdownExtra: { nombre: 'jugador_touchdown', label: 'Jugador que Anotó', requerido: false },
    jugadorSecundarioEsDelEquipoContrario: true
  },
  {
    id: 'conversion_1pt',
    label: 'Conversión 1pt',
    icon: <BoltIcon />,
    color: '#ff5722',
    gradient: 'linear-gradient(135deg, #ff5722, #ff7043)',
    puntos: 1,
    campos: [
      { nombre: 'pasador', label: 'Pasador', requerido: true },
      { nombre: 'receptor', label: 'Receptor', requerido: true }
    ]
  },
  {
    id: 'conversion_2pt',
    label: 'Conversión 2pt',
    icon: <BoltIcon />,
    color: '#e91e63',
    gradient: 'linear-gradient(135deg, #e91e63, #ec407a)',
    puntos: 2,
    campos: [
      { nombre: 'pasador', label: 'Pasador', requerido: true },
      { nombre: 'receptor', label: 'Receptor', requerido: true }
    ]
  },
  {
    id: 'safety',
    label: 'Safety',
    icon: <SecurityIcon />,
    color: '#607d8b',
    gradient: 'linear-gradient(135deg, #607d8b, #78909c)',
    puntos: 2,
    campos: [
      { nombre: 'tackleador', label: 'Tackleador', requerido: false }
    ]
  }
];

  // 🚀 FUNCIONES PARA CAPTURA RÁPIDA
  useEffect(() => {
    // 🔥 CARGAR MODO DE CAPTURA PERSISTIDO
    const modoGuardado = localStorage.getItem('modoCaptura');
    if (modoGuardado && (modoGuardado === 'visual' || modoGuardado === 'rapida')) {
      setModoCaptura(modoGuardado);
      if (modoGuardado === 'rapida') {
        setCapturaRapidaExpandida(true);
      }
    }

    const historial = localStorage.getItem('capturaRapida_historial');
    if (historial) {
      try {
        const parsed = JSON.parse(historial);
        setHistorialSelecciones(parsed);
        
        if (parsed.ultimoEquipo) {
          setDatosCaptura(prev => ({ ...prev, equipoEnPosesion: parsed.ultimoEquipo }));
        } else if (partido) {
          setDatosCaptura(prev => ({ ...prev, equipoEnPosesion: partido.equipoLocal._id }));
        }
        
        if (parsed.ultimaJugada) {
          setDatosCaptura(prev => ({ ...prev, tipoJugada: parsed.ultimaJugada }));
        }
      } catch (error) {
        console.error('Error cargando historial:', error);
      }
    }
  }, [partido]);

  const guardarHistorial = (equipo, jugada) => {
    const nuevoHistorial = {
      ultimoEquipo: equipo || historialSelecciones.ultimoEquipo,
      ultimaJugada: jugada || historialSelecciones.ultimaJugada,
      ultimaActualizacion: new Date().toISOString()
    };
    
    setHistorialSelecciones(nuevoHistorial);
    localStorage.setItem('capturaRapida_historial', JSON.stringify(nuevoHistorial));
  };

  const guardarModoCaptura = (nuevoModo) => {
    setModoCaptura(nuevoModo);
    localStorage.setItem('modoCaptura', nuevoModo);
  };

  const manejarCambioDatosCaptura = (campo, valor) => {
    setDatosCaptura(prev => ({ ...prev, [campo]: valor }));

    if (campo === 'equipoEnPosesion') {
      guardarHistorial(valor, datosCaptura.tipoJugada);
    } else if (campo === 'tipoJugada') {
      guardarHistorial(datosCaptura.equipoEnPosesion, valor);
      
      const jugadaInfo = tiposJugada.find(j => j.id === valor);
      if (jugadaInfo && jugadaInfo.puntos > 0) {
        setDatosCaptura(prev => ({ ...prev, puntos: jugadaInfo.puntos.toString() }));
      }
    }
  };

  const limpiarFormularioCaptura = () => {
    setDatosCaptura({
      equipoEnPosesion: historialSelecciones.ultimoEquipo || (partido ? partido.equipoLocal._id : ''),
      tipoJugada: historialSelecciones.ultimaJugada || '',
      jugadorPrincipal: '',
      jugadorSecundario: '',
      puntos: '',
      repeticiones: 1
    });
  };

  const ejecutarCapturaRapida = async () => {
    console.log('\n🚀 === INICIO CAPTURA RÁPIDA ===');
    console.log('📋 Datos del formulario:', datosCaptura);
    
    if (!datosCaptura.equipoEnPosesion || !datosCaptura.tipoJugada || !datosCaptura.jugadorPrincipal) {
      setSnackbar({
        abierto: true,
        mensaje: 'Equipo, tipo de jugada y jugador principal son obligatorios',
        tipo: 'error'
      });
      return;
    }

    setProcesandoCaptura(true);

    try {
      const repeticiones = parseInt(datosCaptura.repeticiones) || 1;
      let jugadasCreadas = 0;

      for (let i = 0; i < repeticiones; i++) {
        const jugadaData = {
          equipoEnPosesion: datosCaptura.equipoEnPosesion,
          tipoJugada: datosCaptura.tipoJugada,
          descripcion: `${datosCaptura.tipoJugada.replace('_', ' ')} - Captura rápida`,
          numeroJugadorPrincipal: parseInt(datosCaptura.jugadorPrincipal),
        };

        if (datosCaptura.jugadorSecundario) {
          jugadaData.numeroJugadorSecundario = parseInt(datosCaptura.jugadorSecundario);
        }

        // 🔥 ESTRUCTURA CORRECTA DE PUNTOS
        const tipoJugadaInfo = tiposJugada.find(j => j.id === datosCaptura.tipoJugada);
        
        let puntosFinales = 0;
        if (datosCaptura.puntos && datosCaptura.puntos !== '') {
          puntosFinales = parseInt(datosCaptura.puntos);
        } else if (tipoJugadaInfo && tipoJugadaInfo.puntos > 0) {
          puntosFinales = tipoJugadaInfo.puntos;
        }

        jugadaData.resultado = {};
        
        if (puntosFinales > 0) {
          jugadaData.resultado.puntos = puntosFinales;
        }
        
        if (datosCaptura.tipoJugada === 'intercepcion') {
          jugadaData.resultado.intercepcion = true;
          if (puntosFinales === 6) {
            jugadaData.resultado.touchdown = true;
          }
        } else if (datosCaptura.tipoJugada === 'sack') {
          jugadaData.resultado.sack = true;
        } else if (puntosFinales === 6) {
          jugadaData.resultado.touchdown = true;
        }

        console.log('📤 Enviando:', JSON.stringify(jugadaData, null, 2));

        const response = await axiosInstance.post(`/partidos/${partido._id}/jugadas`, jugadaData);
        
        if (response.status === 201) {
          jugadasCreadas++;
        }
      }

      setSnackbar({
        abierto: true,
        mensaje: `${jugadasCreadas} jugada${jugadasCreadas > 1 ? 's' : ''} registrada${jugadasCreadas > 1 ? 's' : ''} exitosamente`,
        tipo: 'success'
      });

      setDatosCaptura(prev => ({
        ...prev,
        jugadorPrincipal: '',
        jugadorSecundario: '',
        puntos: '',
        repeticiones: 1
      }));

      if (onActualizar) onActualizar();

    } catch (error) {
      console.error('Error en captura rápida:', error);
      setSnackbar({
        abierto: true,
        mensaje: 'Error al registrar jugadas: ' + (error.response?.data?.mensaje || error.message),
        tipo: 'error'
      });
    } finally {
      setProcesandoCaptura(false);
    }
  };

  // Cargar información básica del partido
  useEffect(() => {
    // Solo necesitamos la información básica del partido
  }, [partido]);

  // 🎯 DRAG & DROP HANDLERS CON SOPORTE TÁCTIL (ORIGINALES)
  const handleDragStart = (e, jugada) => {
    setDraggedItem(jugada);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedItem(null);
    setDropzoneActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setDropzoneActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (!dropzoneRef.current?.contains(e.relatedTarget)) {
      setDropzoneActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDropzoneActive(false);
    
    if (draggedItem) {
      abrirModalJugada(draggedItem);
    }
  };

  // Handlers táctiles para móviles (ORIGINALES)
  const handleTouchStart = (e, jugada) => {
    setDraggedItem(jugada);
    e.currentTarget.style.opacity = '0.5';
    e.currentTarget.style.transform = 'scale(1.05)';
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (dropzoneRef.current?.contains(elementBelow)) {
      setDropzoneActive(true);
    } else {
      setDropzoneActive(false);
    }
  };

  const handleTouchEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    e.currentTarget.style.transform = 'scale(1)';
    
    if (!draggedItem) return;
    
    const touch = e.changedTouches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (dropzoneRef.current?.contains(elementBelow)) {
      abrirModalJugada(draggedItem);
    }
    
    setDraggedItem(null);
    setDropzoneActive(false);
  };

  // Modal functions (ORIGINALES)
  const abrirModalJugada = (tipoJugada) => {
    setJugadaSeleccionada(tipoJugada);
    setTouchdownMarcado(false);
    setFormularioData({
      equipoEnPosesion: equipoSeleccionado ? partido.equipoLocal._id : partido.equipoVisitante._id,
      descripcion: '',
      touchdownMarcado: false,
      ...tipoJugada.campos.reduce((acc, campo) => ({ ...acc, [campo.nombre]: '' }), {})
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setJugadaSeleccionada(null);
    setFormularioData({});
    setTouchdownMarcado(false);
  };

  const manejarCambioFormulario = (campo, valor) => {
    setFormularioData(prev => ({ ...prev, [campo]: valor }));
  };

  const manejarCambioTouchdown = (checked) => {
    setTouchdownMarcado(checked);
    setFormularioData(prev => ({
      ...prev,
      touchdownMarcado: checked,
      ...(jugadaSeleccionada?.campoTouchdownExtra && !checked ? 
        { [jugadaSeleccionada.campoTouchdownExtra.nombre]: '' } : {})
    }));
  };

  // FUNCIONES ORIGINALES COMPLETAS (registrarJugada, eliminarJugada, etc.)
  const registrarJugada = async () => {
    if (!puedeRegistrar) {
      Swal.fire({
        icon: 'error',
        title: 'Sin permisos',
        text: 'No tienes permisos para registrar jugadas',
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white'
      });
      return;
    }

    const camposRequeridos = jugadaSeleccionada.campos.filter(campo => campo.requerido);
    const camposFaltantes = camposRequeridos.filter(campo => !formularioData[campo.nombre]);

    if (camposFaltantes.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: `Faltan completar: ${camposFaltantes.map(c => c.label).join(', ')}`,
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white'
      });
      return;
    }

    setLoading(true);

    try {
      const tieneValor = (valor) => {
        return valor !== undefined && valor !== null && valor !== '';
      };

      const jugadaData = {
        equipoEnPosesion: formularioData.equipoEnPosesion,
        tipoJugada: jugadaSeleccionada.id,
        descripcion: formularioData.descripcion || '',
        
        ...(tieneValor(formularioData[jugadaSeleccionada.campos[0]?.nombre]) && {
          numeroJugadorPrincipal: parseInt(formularioData[jugadaSeleccionada.campos[0].nombre])
        }),
        
        ...(jugadaSeleccionada.campos[1] && tieneValor(formularioData[jugadaSeleccionada.campos[1].nombre]) && {
          numeroJugadorSecundario: parseInt(formularioData[jugadaSeleccionada.campos[1].nombre])
        }),
        
        ...(touchdownMarcado && jugadaSeleccionada.campoTouchdownExtra && 
            tieneValor(formularioData[jugadaSeleccionada.campoTouchdownExtra.nombre]) && {
          numeroJugadorTouchdown: parseInt(formularioData[jugadaSeleccionada.campoTouchdownExtra.nombre])
        }),
        
        resultado: {
          puntos: touchdownMarcado ? 6 : jugadaSeleccionada.puntos,
          touchdown: touchdownMarcado || jugadaSeleccionada.id === 'touchdown',
          intercepcion: jugadaSeleccionada.id === 'intercepcion',
          sack: jugadaSeleccionada.id === 'sack'
        }
      };

      const response = await axiosInstance.post(`/partidos/${partido._id}/jugadas`, jugadaData);

      cerrarModal();
      onActualizar();

      const { warnings } = response.data;
      
      if (warnings && warnings.length > 0) {
        Swal.fire({
          icon: 'warning',
          title: '¡Jugada registrada con avisos!',
          html: `<strong>${jugadaSeleccionada.label}</strong> registrado correctamente<br><br>
                 <small style="color: #ff9800;">⚠️ ${warnings.join('<br>⚠️ ')}</small>`,
          timer: 4000,
          showConfirmButton: true
        });
      }

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

  const eliminarJugada = async (jugadaId) => {
    if (!puedeRegistrar) {
      Swal.fire({
        icon: 'error',
        title: 'Sin permisos',
        text: 'No tienes permisos para eliminar jugadas',
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white'
      });
      return;
    }

    const resultado = await Swal.fire({
      title: '¿Eliminar jugada?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white'
    });

    if (!resultado.isConfirmed) return;

    try {
      setLoading(true);

      const response = await axiosInstance.delete(`/partidos/${partido._id}/jugadas/${jugadaId}`);

      if (response.status === 200) {
        Swal.fire({
          icon: 'success',
          title: 'Jugada eliminada',
          text: 'La jugada se eliminó correctamente',
          background: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          timer: 2000,
          showConfirmButton: false
        });

        if (onActualizar) {
          onActualizar();
        }
      }

    } catch (error) {
      console.error('Error eliminando jugada:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Error al eliminar',
        text: error.response?.data?.mensaje || 'Error al eliminar la jugada',
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatearTiempo = (tiempo) => {
    if (!tiempo) return '--:--';
    
    const { minuto = 0, segundo = 0, periodo = 1 } = tiempo;
    
    return `Q${periodo} ${String(minuto).padStart(2, '0')}:${String(segundo).padStart(2, '0')}`;
  };

  const obtenerIconoPorTipo = (tipo) => {
    const jugada = tiposJugada.find(j => j.id === tipo);
    return jugada ? jugada.icon : <SportsFootballIcon />;
  };

  const obtenerColorPorTipo = (tipo) => {
    const jugada = tiposJugada.find(j => j.id === tipo);
    return jugada ? jugada.color : '#666';
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

  return (
    <Box sx={{ p: 3 }}>
      {/* 🚀 SELECTOR DE MODO */}
      <Box sx={{ mb: 3 }}>
        <ToggleButtonGroup
          value={modoCaptura}
          exclusive
          onChange={(e, nuevoModo) => {
            if (nuevoModo !== null) {
              guardarModoCaptura(nuevoModo); // 🔥 USAR FUNCIÓN PERSISTENTE
              if (nuevoModo === 'rapida') {
                setCapturaRapidaExpandida(true);
              }
            }
          }}
          sx={{ 
            mb: 2,
            '& .MuiToggleButton-root': {
              color: 'rgba(255, 255, 255, 0.7)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              },
              '&.Mui-selected': {
                backgroundColor: 'rgba(100, 181, 246, 0.2)',
                color: '#64b5f6',
                borderColor: '#64b5f6'
              }
            }
          }}
        >
          <ToggleButton value="visual">
            <TouchAppIcon sx={{ mr: 1 }} />
            Modo Visual
          </ToggleButton>
          <ToggleButton value="rapida">
            <FastCaptureIcon sx={{ mr: 1 }} />
            Captura Rápida
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* 🚀 PANEL DE CAPTURA RÁPIDA */}
      {modoCaptura === 'rapida' && (
        <Card sx={{ 
          mb: 3, 
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          border: '1px solid rgba(100, 181, 246, 0.3)'
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FastCaptureIcon sx={{ mr: 1, color: '#64b5f6' }} />
                <Typography variant="h6" sx={{ color: 'white' }}>
                  ⚡ Captura Rápida
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="Limpiar formulario">
                  <IconButton onClick={limpiarFormularioCaptura} size="small" sx={{ color: 'white' }}>
                    <ClearIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={capturaRapidaExpandida ? 'Contraer' : 'Expandir'}>
                  <IconButton 
                    onClick={() => setCapturaRapidaExpandida(!capturaRapidaExpandida)} 
                    size="small" 
                    sx={{ color: 'white' }}
                  >
                    {capturaRapidaExpandida ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <Collapse in={capturaRapidaExpandida}>
              <Grid container spacing={2} sx={{ alignItems: 'end' }}>
                {/* Primera fila: Equipo y Tipo de Jugada */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Equipo en Posesión
                    </InputLabel>
                    <Select
                      value={datosCaptura.equipoEnPosesion}
                      label="Equipo en Posesión"
                      onChange={(e) => manejarCambioDatosCaptura('equipoEnPosesion', e.target.value)}
                      sx={{
                        height: 56,
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#64b5f6' }
                      }}
                    >
                      <MenuItem value={partido.equipoLocal._id}>
                        🏠 {partido.equipoLocal.nombre}
                      </MenuItem>
                      <MenuItem value={partido.equipoVisitante._id}>
                        ✈️ {partido.equipoVisitante.nombre}
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Tipo de Jugada
                    </InputLabel>
                    <Select
                      value={datosCaptura.tipoJugada}
                      label="Tipo de Jugada"
                      onChange={(e) => manejarCambioDatosCaptura('tipoJugada', e.target.value)}
                      sx={{
                        height: 56,
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#64b5f6' }
                      }}
                    >
                      {tiposJugada.map((jugada) => (
                        <MenuItem key={jugada.id} value={jugada.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <Box sx={{ mr: 1 }}>{jugada.icon}</Box>
                            <Typography sx={{ flexGrow: 1 }}>{jugada.label}</Typography>
                            {jugada.puntos > 0 && (
                              <Chip 
                                label={`${jugada.puntos}pts`} 
                                size="small" 
                                sx={{ ml: 1, backgroundColor: jugada.color, color: 'white' }}
                              />
                            )}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Segunda fila: Campos de números + Botón */}
                <Grid item xs={6} md={2.4}>
                  <TextField
                    fullWidth
                    label="Jugador Principal #"
                    type="number"
                    value={datosCaptura.jugadorPrincipal}
                    onChange={(e) => manejarCambioDatosCaptura('jugadorPrincipal', e.target.value)}
                    inputProps={{ min: 0, max: 1000 }}
                    sx={{
                      '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                      '& .MuiInputBase-input': { 
                        color: 'white', 
                        textAlign: 'center',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        height: '24px'
                      },
                      '& .MuiOutlinedInput-root': {
                        height: 56,
                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                        '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                        '&.Mui-focused fieldset': { borderColor: '#64b5f6' }
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={6} md={2.4}>
                  <TextField
                    fullWidth
                    label="Jugador Secundario # (Opcional)"
                    type="number"
                    value={datosCaptura.jugadorSecundario}
                    onChange={(e) => manejarCambioDatosCaptura('jugadorSecundario', e.target.value)}
                    inputProps={{ min: 0, max: 1000 }}
                    sx={{
                      '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                      '& .MuiInputBase-input': { 
                        color: 'white', 
                        textAlign: 'center',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        height: '24px'
                      },
                      '& .MuiOutlinedInput-root': {
                        height: 56,
                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                        '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                        '&.Mui-focused fieldset': { borderColor: '#64b5f6' }
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={6} md={2.4}>
                  <TextField
                    fullWidth
                    label="Puntos Personalizados"
                    type="number"
                    value={datosCaptura.puntos}
                    onChange={(e) => manejarCambioDatosCaptura('puntos', e.target.value)}
                    inputProps={{ min: 0, max: 20 }}
                    sx={{
                      '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                      '& .MuiInputBase-input': { 
                        color: 'white', 
                        textAlign: 'center',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        height: '24px'
                      },
                      '& .MuiOutlinedInput-root': {
                        height: 56,
                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                        '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                        '&.Mui-focused fieldset': { borderColor: '#64b5f6' }
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={6} md={2.4}>
                  <TextField
                    fullWidth
                    label="Repeticiones"
                    type="number"
                    value={datosCaptura.repeticiones}
                    onChange={(e) => manejarCambioDatosCaptura('repeticiones', e.target.value)}
                    inputProps={{ min: 1, max: 10 }}
                    InputProps={{
                      startAdornment: <RepeatIcon sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />
                    }}
                    sx={{
                      '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                      '& .MuiInputBase-input': { 
                        color: 'white', 
                        textAlign: 'center',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        height: '24px'
                      },
                      '& .MuiOutlinedInput-root': {
                        height: 56,
                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                        '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                        '&.Mui-focused fieldset': { borderColor: '#64b5f6' }
                      }
                    }}
                  />
                </Grid>

                {/* Botón al final de la segunda fila */}
                <Grid item xs={12} md={2.4}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={ejecutarCapturaRapida}
                    disabled={procesandoCaptura || !datosCaptura.equipoEnPosesion || !datosCaptura.tipoJugada || !datosCaptura.jugadorPrincipal}
                    sx={{
                      width: '100%',
                      height: 56,
                      minWidth: 56,
                      background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
                      '&:hover': { background: 'linear-gradient(135deg, #388e3c, #4caf50)' },
                      '&:disabled': { background: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.3)' }
                    }}
                  >
                    {procesandoCaptura ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      <SaveIcon sx={{ fontSize: '1.5rem' }} />
                    )}
                  </Button>
                </Grid>

                {/* Tercera fila: Info visual */}
                <Grid item xs={12}>
                  <Box sx={{ 
                    textAlign: 'center',
                    pt: 1,
                    color: 'rgba(255, 255, 255, 0.6)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                      {datosCaptura.equipoEnPosesion && datosCaptura.tipoJugada && datosCaptura.jugadorPrincipal
                        ? `✅ Listo para registrar ${datosCaptura.repeticiones > 1 ? `${datosCaptura.repeticiones} jugadas` : 'jugada'} - Presiona el botón verde para guardar`
                        : '⚠️ Complete los campos requeridos: Equipo, Tipo de Jugada y Jugador Principal'
                      }
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Collapse>
          </CardContent>
        </Card>
      )}

      {/* UI ORIGINAL COMPLETA */}
      {modoCaptura === 'visual' && (
        <>
          {/* 🎯 ZONA DE ICONOS DE JUGADAS - ORIGINAL*/}
          <Card sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            mb: 3
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 3, display: 'flex', alignItems: 'center' }}>
                <SportsFootballIcon sx={{ mr: 2, color: '#64b5f6' }} />
                Tipos de Jugadas
                <Chip label="Arrastra al área de registro" size="small" sx={{ ml: 2, backgroundColor: 'rgba(100, 181, 246, 0.2)' }} />
              </Typography>
              
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(3, 1fr)',
                  sm: 'repeat(4, 1fr)',
                  md: 'repeat(6, 1fr)',
                  lg: 'repeat(9, 1fr)',
                  xl: 'repeat(9, 1fr)'
                },
                gap: 2,
                justifyContent: 'center'
              }}>
                {tiposJugada.map((jugada) => (
                  <motion.div
                    key={jugada.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ flex: '0 1 auto' }}
                  >
                    <Paper
                      draggable
                      onDragStart={(e) => handleDragStart(e, jugada)}
                      onDragEnd={handleDragEnd}
                      onClick={() => abrirModalJugada(jugada)}
                      onTouchStart={(e) => handleTouchStart(e, jugada)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        background: jugada.gradient,
                        color: 'white',
                        cursor: 'grab',
                        border: '2px solid transparent',
                        borderRadius: 2,
                        position: 'relative',
                        overflow: 'hidden',
                        width: '100%',
                        height: 120,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        '&:hover': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                          boxShadow: `0 8px 32px ${jugada.color}40`
                        },
                        '&:active': { cursor: 'grabbing' }
                      }}
                    >
                      <DragIcon sx={{ position: 'absolute', top: 8, right: 8, fontSize: 16, opacity: 0.7 }} />
                      <Box sx={{ fontSize: 32, mb: 1 }}>
                        {jugada.icon}
                      </Box>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 'bold', 
                        fontSize: '0.75rem',
                        lineHeight: 1.2,
                        textAlign: 'center'
                      }}>
                        {jugada.label}
                      </Typography>
                      {jugada.puntos > 0 && (
                        <Chip 
                          label={`${jugada.puntos} pts`} 
                          size="small" 
                          sx={{ 
                            mt: 1, 
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            fontSize: '0.65rem',
                            height: 20
                          }} 
                        />
                      )}
                    </Paper>
                  </motion.div>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* 🎯 DROPZONE ÉPICO - ORIGINAL */}
          <Card sx={{
            backgroundColor: dropzoneActive ? 'rgba(100, 181, 246, 0.1)' : 'rgba(0, 0, 0, 0.6)',
            borderRadius: 3,
            border: dropzoneActive ? '2px dashed #64b5f6' : '2px dashed rgba(255, 255, 255, 0.2)',
            mb: 3,
            transition: 'all 0.3s ease'
          }}>
            <CardContent
              ref={dropzoneRef}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              sx={{
                minHeight: 150,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
              }}
            >
              <motion.div
                animate={{ 
                  scale: dropzoneActive ? 1.1 : 1,
                  opacity: dropzoneActive ? 1 : 0.7
                }}
                transition={{ duration: 0.3 }}
              >
                <TouchAppIcon sx={{ 
                  fontSize: 60, 
                  color: dropzoneActive ? '#64b5f6' : 'rgba(255, 255, 255, 0.5)',
                  mb: 2 
                }} />
              </motion.div>
              
              <Typography variant="h6" sx={{ 
                color: dropzoneActive ? '#64b5f6' : 'rgba(255, 255, 255, 0.7)',
                fontWeight: 'bold',
                mb: 1
              }}>
                {dropzoneActive ? '¡Suelta la jugada aquí!' : 'Zona de Registro'}
              </Typography>
              
              <Typography variant="body2" sx={{ 
                color: dropzoneActive ? 'rgba(100, 181, 246, 0.8)' : 'rgba(255, 255, 255, 0.5)'
              }}>
                {dropzoneActive 
                  ? 'Se abrirá el formulario de captura' 
                  : 'Arrastra un tipo de jugada aquí o haz click sobre alguna'
                }
              </Typography>
            </CardContent>
          </Card>
        </>
      )}

      {/* 📊 TABLA DE JUGADAS REGISTRADAS - ORIGINAL COMPLETA */}
      <Card sx={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: 3,
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ color: 'white', display: 'flex', alignItems: 'center' }}>
              <TimerIcon sx={{ mr: 2, color: '#64b5f6' }} />
              Jugadas del Partido
            </Typography>
            <Badge 
              badgeContent={partido.jugadas?.length || 0} 
              color="primary"
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: '#64b5f6',
                  color: 'white'
                }
              }}
            >
              <SportsFootballIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
            </Badge>
          </Box>

          {partido.jugadas && partido.jugadas.length > 0 ? (
            <TableContainer sx={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 2,
              maxHeight: 400
            }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 'bold' }}>#</TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 'bold' }}>Jugada</TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 'bold' }}>Equipo</TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 'bold' }}>Jugador Principal</TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 'bold' }}>Jugador Secundario</TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 'bold' }}>Puntos</TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 'bold' }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {partido.jugadas.slice().reverse().map((jugada, index) => {
                    const tipoJugada = tiposJugada.find(t => t.id === jugada.tipoJugada);
                    return (
                      <TableRow key={jugada._id || jugada.numero}>
                        <TableCell sx={{ color: 'white' }}>{jugada.numero}</TableCell>
                        <TableCell sx={{ color: 'white' }}>
                          <Chip
                            icon={tipoJugada?.icon}
                            label={tipoJugada?.label || jugada.tipoJugada}
                            size="small"
                            sx={{
                              backgroundColor: tipoJugada?.color + '20',
                              color: tipoJugada?.color || 'white',
                              border: `1px solid ${tipoJugada?.color || 'transparent'}`
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: 'white' }}>
                          {jugada.equipoEnPosesion?.nombre || 'N/A'}
                        </TableCell>
                        <TableCell sx={{ color: 'white' }}>
                          {/* 🔥 JUGADOR PRINCIPAL - EXACTAMENTE COMO ESTABA ANTES */}
                          {(jugada.jugadorPrincipal?.numero !== undefined && 
                            jugada.jugadorPrincipal?.numero !== null && 
                            jugada.jugadorPrincipal?.nombre) ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar 
                                src={jugada.jugadorPrincipal?.imagen} 
                                sx={{ 
                                  width: 32, 
                                  height: 32, 
                                  fontSize: '0.75rem',
                                  backgroundColor: '#64b5f6'
                                }}
                              >
                                #{jugada.jugadorPrincipal.numero}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  #{jugada.jugadorPrincipal.numero}
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                  {jugada.jugadorPrincipal.nombre}
                                </Typography>
                              </Box>
                            </Box>
                          ) : (
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                              N/A
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ color: 'white' }}>
                          {/* 🔥 JUGADOR SECUNDARIO - EXACTAMENTE COMO ESTABA ANTES */}
                          {(jugada.jugadorSecundario?.numero !== undefined && 
                            jugada.jugadorSecundario?.numero !== null && 
                            jugada.jugadorSecundario?.nombre) ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar 
                                src={jugada.jugadorSecundario?.imagen} 
                                sx={{ 
                                  width: 32, 
                                  height: 32, 
                                  fontSize: '0.75rem',
                                  backgroundColor: '#ff9800'
                                }}
                              >
                                #{jugada.jugadorSecundario.numero}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  #{jugada.jugadorSecundario.numero}
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                  {jugada.jugadorSecundario.nombre}
                                </Typography>
                              </Box>
                            </Box>
                          ) : (
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                              N/A
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ color: 'white' }}>
                          <Chip 
                            label={jugada.resultado?.puntos || 0}
                            size="small"
                            sx={{
                              backgroundColor: jugada.resultado?.puntos > 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                              color: jugada.resultado?.puntos > 0 ? '#4caf50' : 'rgba(255, 255, 255, 0.7)',
                              fontWeight: 'bold'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Eliminar jugada">
                            <IconButton 
                              size="small" 
                              sx={{ color: '#f44336' }}
                              onClick={() => eliminarJugada(jugada._id || jugada.numero)}
                              disabled={loading}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <SportsFootballIcon sx={{ fontSize: 60, color: 'rgba(255, 255, 255, 0.3)', mb: 2 }} />
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                No hay jugadas registradas aún
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.3)' }}>
                Arrastra un tipo de jugada para comenzar
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 🎯 MODAL DE FORMULARIO DINÁMICO - ORIGINAL COMPLETO */}
      <Modal
        open={modalAbierto}
        onClose={cerrarModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
          sx: { backdropFilter: 'blur(10px)' }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ duration: 0.3 }}
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 600, md: 700 },
            bgcolor: 'rgba(0, 0, 0, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
            p: 4
          }}>
            {jugadaSeleccionada && (
              <>
                {/* Header del modal */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box sx={{
                    background: jugadaSeleccionada.gradient,
                    borderRadius: 2,
                    p: 1,
                    mr: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {jugadaSeleccionada.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                      Registrar {jugadaSeleccionada.label}
                    </Typography>
                    {jugadaSeleccionada.puntos > 0 && (
                      <Chip 
                        label={`${jugadaSeleccionada.puntos} puntos`} 
                        size="small" 
                        sx={{ 
                          backgroundColor: 'rgba(76, 175, 80, 0.2)',
                          color: '#4caf50',
                          fontWeight: 'bold',
                          mt: 1
                        }}
                      />
                    )}
                  </Box>
                  <IconButton 
                    onClick={cerrarModal} 
                    sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>

                {/* Formulario - TODO EL CONTENIDO ORIGINAL */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Equipo seleccionado */}
                  <Box sx={{
                    p: 2,
                    backgroundColor: 'rgba(100, 181, 246, 0.1)',
                    borderRadius: 2,
                    border: '1px solid rgba(100, 181, 246, 0.3)'
                  }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                      Equipo en posesión:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: equipoSeleccionado ? '#4caf50' : '#2196f3'
                      }} />
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        cursor: 'pointer',
                        p: 1,
                        borderRadius: 1,
                        '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' }
                      }}
                      onClick={() => setEquipoSeleccionado(!equipoSeleccionado)}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.7 }}>
                          <Typography variant="caption" sx={{
                            color: equipoSeleccionado ? 'white' : 'rgba(255, 255, 255, 0.6)',
                            fontWeight: equipoSeleccionado ? 'bold' : 'normal',
                            fontSize: '0.75rem'
                          }}>
                            Local
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', mx: 1 }}>
                          /
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.7 }}>
                          <Typography variant="caption" sx={{
                            color: !equipoSeleccionado ? 'white' : 'rgba(255, 255, 255, 0.6)',
                            fontWeight: !equipoSeleccionado ? 'bold' : 'normal',
                            fontSize: '0.75rem'
                          }}>
                            Visit.
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Typography variant="body1" sx={{ 
                        color: '#64b5f6', 
                        fontWeight: 'bold',
                        minWidth: 120
                      }}>
                        {equipoSeleccionado ? partido.equipoLocal.nombre : partido.equipoVisitante.nombre}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Checkbox touchdown */}
                  {jugadaSeleccionada.tieneCheckboxTouchdown && (
                    <Box sx={{
                      p: 2,
                      backgroundColor: 'rgba(76, 175, 80, 0.1)',
                      borderRadius: 2,
                      border: '1px solid rgba(76, 175, 80, 0.3)'
                    }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={touchdownMarcado}
                            onChange={(e) => manejarCambioTouchdown(e.target.checked)}
                            sx={{
                              color: '#4caf50',
                              '&.Mui-checked': { color: '#4caf50' }
                            }}
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <StarIcon sx={{ color: '#4caf50', fontSize: 20 }} />
                            <Typography sx={{ color: 'white', fontWeight: 'bold' }}>
                              ¿Terminó en Touchdown? (+6 pts)
                            </Typography>
                          </Box>
                        }
                      />
                    </Box>
                  )}

                  {/* Campo extra para touchdown en intercepción */}
                  {touchdownMarcado && jugadaSeleccionada.campoTouchdownExtra && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <TextField
                        type="number"
                        label={`${jugadaSeleccionada.campoTouchdownExtra.label} (Opcional)`}
                        placeholder="Ej: 15"
                        value={formularioData[jugadaSeleccionada.campoTouchdownExtra.nombre] || ''}
                        onChange={(e) => manejarCambioFormulario(jugadaSeleccionada.campoTouchdownExtra.nombre, e.target.value)}
                        inputProps={{ 
                          min: 0, 
                          max: 99,
                          style: { textAlign: 'center', fontSize: '1.1rem', fontWeight: 'bold' }
                        }}
                        sx={{ 
                          width: '100%',
                          '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                          '& .MuiInputBase-input': { 
                            color: 'white',
                            '&::placeholder': { color: 'rgba(255, 255, 255, 0.4)', opacity: 1 }
                          },
                          '& .MuiOutlinedInput-root': {
                            minHeight: 56,
                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                            '& fieldset': { borderColor: 'rgba(76, 175, 80, 0.3)' },
                            '&:hover fieldset': { borderColor: 'rgba(76, 175, 80, 0.5)' },
                            '&.Mui-focused fieldset': { borderColor: '#4caf50' }
                          }
                        }}
                      />
                    </motion.div>
                  )}

                  {/* Contenedor para campos de jugadores - INPUTS NUMÉRICOS */}
                  {jugadaSeleccionada.campos.length > 0 && (
                    <Box sx={{
                      display: 'flex',
                      flexDirection: jugadaSeleccionada.campos.length === 1 ? 'column' : 'row',
                      gap: 2,
                      flexWrap: 'wrap'
                    }}>
                      {jugadaSeleccionada.campos.map((campo) => (
                        <TextField
                          key={campo.nombre}
                          type="number"
                          label={`${campo.label} ${campo.requerido ? '*' : ''}`}
                          placeholder="Ej: 12"
                          value={formularioData[campo.nombre] || ''}
                          onChange={(e) => manejarCambioFormulario(campo.nombre, e.target.value)}
                          inputProps={{ 
                            min: 0, 
                            max: 99,
                            style: { textAlign: 'center', fontSize: '1.1rem', fontWeight: 'bold' }
                          }}
                          sx={{ 
                            flex: jugadaSeleccionada.campos.length === 1 ? '1 1 100%' : '1 1 calc(50% - 8px)',
                            minWidth: '140px',
                            '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                            '& .MuiInputBase-input': { 
                              color: 'white',
                              '&::placeholder': { color: 'rgba(255, 255, 255, 0.4)', opacity: 1 }
                            },
                            '& .MuiOutlinedInput-root': {
                              minHeight: 56,
                              '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                              '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                              '&.Mui-focused fieldset': { borderColor: '#64b5f6' }
                            }
                          }}
                        />
                      ))}
                    </Box>
                  )}

                  {/* Descripción opcional */}
                  <TextField
                    fullWidth
                    label="Descripción (opcional)"
                    value={formularioData.descripcion || ''}
                    onChange={(e) => manejarCambioFormulario('descripcion', e.target.value)}
                    multiline
                    rows={3}
                    placeholder={`Agrega detalles sobre esta ${jugadaSeleccionada.label.toLowerCase()}...`}
                    sx={{
                      '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                      '& .MuiInputBase-input': { color: 'white' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                        '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                        '&.Mui-focused fieldset': { borderColor: '#64b5f6' }
                      },
                      '& .MuiInputBase-input::placeholder': { color: 'rgba(255, 255, 255, 0.4)', opacity: 1 }
                    }}
                  />
                </Box>

                {/* Botones de acción */}
                <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                  <Button
                    variant="outlined"
                    onClick={cerrarModal}
                    fullWidth
                    sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="contained"
                    onClick={registrarJugada}
                    disabled={loading}
                    fullWidth
                    sx={{
                      background: jugadaSeleccionada.gradient,
                      '&:hover': {
                        background: jugadaSeleccionada.gradient,
                        filter: 'brightness(1.1)'
                      }
                    }}
                  >
                    <CheckCircleIcon sx={{ mr: 1 }} />
                    {loading ? 'Registrando...' : 'Registrar Jugada'}
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </motion.div>
      </Modal>

      {/* 📱 SNACKBAR PARA NOTIFICACIONES */}
      <Snackbar
        open={snackbar.abierto}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, abierto: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, abierto: false }))} 
          severity={snackbar.tipo}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.mensaje}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RegistroJugadas;