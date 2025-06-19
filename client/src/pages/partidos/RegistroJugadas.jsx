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
  Chip
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
  DragIndicator as DragIcon
} from '@mui/icons-material';

const RegistroJugadas = ({ partido, onActualizar }) => {
  const { usuario, puedeGestionarTorneos } = useAuth();

  // Estados principales
  const [modalAbierto, setModalAbierto] = useState(false);
  const [jugadaSeleccionada, setJugadaSeleccionada] = useState(null);
  const [formularioData, setFormularioData] = useState({});
  const [loading, setLoading] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dropzoneActive, setDropzoneActive] = useState(false);
  const [touchdownMarcado, setTouchdownMarcado] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(true); // true = local, false = visitante
  const dropzoneRef = useRef(null);

  // Verificar permisos
  const puedeRegistrar = puedeGestionarTorneos() || usuario?.rol === 'arbitro';

  // 🎯 TIPOS DE JUGADAS CON ICONOS Y CONFIGURACIÓN
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
    // 🔥 NUEVO: checkbox touchdown para pase completo
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
    tieneCheckboxTouchdown: true // ✅ YA EXISTÍA
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
    tieneCheckboxTouchdown: true, // ✅ YA EXISTÍA
    campoTouchdownExtra: { nombre: 'jugador_touchdown', label: 'Jugador que Anotó', requerido: false },
    jugadorSecundarioEsDelEquipoContrario: true // ✅ YA EXISTÍA
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

  // Cargar información básica del partido
  useEffect(() => {
    // Solo necesitamos la información básica del partido
    // Los números de jugadores se validarán en el backend
  }, [partido]);

  // 🎯 DRAG & DROP HANDLERS CON SOPORTE TÁCTIL
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

  // 🔥 NUEVOS HANDLERS TÁCTILES PARA MÓVILES
  const handleTouchStart = (e, jugada) => {
    setDraggedItem(jugada);
    e.currentTarget.style.opacity = '0.5';
    e.currentTarget.style.transform = 'scale(1.05)';
  };

  const handleTouchMove = (e) => {
    e.preventDefault(); // Prevenir scroll
    const touch = e.touches[0];
    
    // Encontrar elemento bajo el dedo
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // Verificar si está sobre la zona de drop
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
    
    // Verificar si se soltó sobre la zona de drop
    if (dropzoneRef.current?.contains(elementBelow)) {
      abrirModalJugada(draggedItem);
    }
    
    setDraggedItem(null);
    setDropzoneActive(false);
  };

  // 🔥 TAMBIÉN AGREGA ESTOS HANDLERS TÁCTILES PARA LA ZONA DE DROP
  const handleDropzoneTouchStart = (e) => {
    e.preventDefault();
  };

  const handleDropzoneTouchMove = (e) => {
    e.preventDefault();
    setDropzoneActive(true);
  };

  const handleDropzoneTouchEnd = (e) => {
    e.preventDefault();
    if (draggedItem) {
      abrirModalJugada(draggedItem);
    }
    setDropzoneActive(false);
  };

  // 🎯 MODAL Y FORMULARIO
  const abrirModalJugada = (tipoJugada) => {
    setJugadaSeleccionada(tipoJugada);
    setTouchdownMarcado(false);
    setFormularioData({
      equipoEnPosesion: equipoSeleccionado ? partido.equipoLocal._id : partido.equipoVisitante._id,
      descripcion: '',
      touchdownMarcado: false,
      ...tipoJugada.campos.reduce((acc, campo) => ({
        ...acc,
        [campo.nombre]: ''
      }), {})
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
    setFormularioData(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const manejarCambioTouchdown = (checked) => {
    setTouchdownMarcado(checked);
    setFormularioData(prev => ({
      ...prev,
      touchdownMarcado: checked,
      // Limpiar campo de jugador touchdown si se desmarca
      ...(jugadaSeleccionada?.campoTouchdownExtra && !checked ? { [jugadaSeleccionada.campoTouchdownExtra.nombre]: '' } : {})
    }));
  };

  const manejarCambioEquipo = (esLocal) => {
    setEquipoSeleccionado(esLocal);
    setFormularioData(prev => ({
      ...prev,
      equipoEnPosesion: esLocal ? partido.equipoLocal._id : partido.equipoVisitante._id
    }));
  };

  // Función eliminar jugada con Swal
  const eliminarJugada = async (jugadaId) => {
    // 🔥 Usar Swal para la confirmación (como en el resto de la página)
    const result = await Swal.fire({
      title: '¿Eliminar jugada?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f44336',
      cancelButtonColor: '#64b5f6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await axiosInstance.delete(`/partidos/${partido._id}/jugadas/${jugadaId}`);
      
      // Usar onActualizar para recargar el partido completo
      if (onActualizar) {
        await onActualizar();
      }
      
      // Mostrar mensaje de éxito con Swal
      Swal.fire({
        icon: 'success',
        title: 'Jugada eliminada',
        html: `
          <p>La jugada se eliminó correctamente</p>
          <p><strong>Marcador actualizado: ${response.data.marcadorActualizado?.local || 0} - ${response.data.marcadorActualizado?.visitante || 0}</strong></p>
        `,
        timer: 3000,
        showConfirmButton: false
      });
      
    } catch (error) {
      console.error('Error al eliminar jugada:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.mensaje || 'Error al eliminar jugada'
      });
    } finally {
      setLoading(false);
    }
  };

  // 🎯 REGISTRAR JUGADA
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

      // ✅ VALIDACIÓN CORRECTA POR TIPO DE JUGADA:
      // Validar campos requeridos según el tipo específico de jugada
      let camposFaltantes = [];

      switch (jugadaSeleccionada.id) {
        case 'pase_completo':
        case 'touchdown':
        case 'conversion_1pt':
        case 'conversion_2pt':
          // Requieren pasador Y receptor
          if (!formularioData.pasador) camposFaltantes.push('Pasador');
          if (!formularioData.receptor) camposFaltantes.push('Receptor');
          break;
          
        case 'pase_incompleto':
          // Solo requiere pasador
          if (!formularioData.pasador) camposFaltantes.push('Pasador');
          break;
          
        case 'intercepcion':
          // Requiere interceptor Y QB interceptado
          if (!formularioData.interceptor) camposFaltantes.push('Interceptor');
          if (!formularioData.qb_interceptado) camposFaltantes.push('QB Interceptado');
          break;
          
        case 'corrida':
          // Solo requiere corredor (tackleador es opcional)
          if (!formularioData.corredor) camposFaltantes.push('Corredor');
          break;
          
        case 'sack':
          // Solo requiere tackleador
          if (!formularioData.tackleador) camposFaltantes.push('Jugador que hace Sack');
          break;

        case 'tackleo':
          // Solo requiere tackleador
          if (!formularioData.tackleador) camposFaltantes.push('Jugador que Tacklea');
          break;
          
        case 'safety':
          // Tackleador es opcional para safety
          break;
          
        default:
          // Para otros tipos, usar validación genérica
          const camposRequeridosGenericos = jugadaSeleccionada.campos.filter(c => c.requerido);
          camposFaltantes = camposRequeridosGenericos.filter(c => !formularioData[c.nombre] || formularioData[c.nombre] === '').map(c => c.label);
      }

      // 🔥 NUEVA VALIDACIÓN: No permitir tackleador si hay touchdown
      if ((jugadaSeleccionada.id === 'intercepcion' || jugadaSeleccionada.id === 'corrida') && 
          touchdownMarcado && formularioData.tackleador) {
        Swal.fire({
          icon: 'warning',
          title: 'Jugada inconsistente',
          text: 'No se puede especificar un tackleador si la jugada terminó en touchdown'
        });
        return;
      }

      if (camposFaltantes.length > 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Campos requeridos',
          text: `Faltan: ${camposFaltantes.join(', ')}`
        });
        return;
      }

      // Preparar datos de la jugada
      const jugadaData = {
        tipoJugada: jugadaSeleccionada.id,
        equipoEnPosesion: formularioData.equipoEnPosesion,
        descripcion: formularioData.descripcion || `${jugadaSeleccionada.label}`,
        
        // Enviar números de jugadores en lugar de IDs
        numeroJugadorPrincipal: parseInt(formularioData.pasador) || parseInt(formularioData.corredor) || 
                              parseInt(formularioData.interceptor) || parseInt(formularioData.tackleador),
        
        // 🔥 SOLO enviar jugador secundario si existe y tiene valor
        ...(formularioData.receptor && { numeroJugadorSecundario: parseInt(formularioData.receptor) }),
        ...(formularioData.qb_interceptado && { numeroJugadorSecundario: parseInt(formularioData.qb_interceptado) }),
        
        // 🔥 NUEVO: Campo extra para touchdown en intercepción
        ...(touchdownMarcado && jugadaSeleccionada.campoTouchdownExtra && formularioData[jugadaSeleccionada.campoTouchdownExtra.nombre] && {
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

      // Cerrar modal y actualizar
      cerrarModal();
      onActualizar();

      // Mostrar confirmación con warnings si los hay
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
      {/* 🎯 ZONA DE ICONOS DE JUGADAS */}
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
              xs: 'repeat(3, 1fr)', // 📱 Móvil: 3 columnas
              sm: 'repeat(4, 1fr)', // 🖥️ Tablet: 4 columnas  
              md: 'repeat(6, 1fr)', // 🖥️ Desktop: 6 columnas
              lg: 'repeat(9, 1fr)', // 🖥️ Desktop grande: 9 columnas
              xl: 'repeat(9, 1fr)'  // 🖥️ Desktop extra grande: 9 columnas
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
                    '&:active': {
                      cursor: 'grabbing'
                    }
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

      {/* 🎯 DROPZONE ÉPICO */}
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
            mb: 1
          }}>
            {dropzoneActive ? '¡Suelta para registrar!' : 'Zona de Registro'}
          </Typography>
          
          <Typography variant="body2" sx={{ 
            color: 'rgba(255, 255, 255, 0.5)' 
          }}>
            Arrastra un tipo de jugada aquí para comenzar el registro
          </Typography>
        </CardContent>
      </Card>

      {/* 🎯 TABLA DE JUGADAS RECIENTES - VERSION ACTUALIZADA */}
      <Card sx={{
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: 3,
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center' }}>
            <TimerIcon sx={{ mr: 2, color: '#64b5f6' }} />
            Jugadas del Partido
            <Badge badgeContent={partido?.jugadas?.length || 0} color="primary" sx={{ ml: 2 }} />
          </Typography>
          
          {partido?.jugadas && partido.jugadas.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 'bold' }}>#</TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 'bold' }}>Jugada</TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 'bold' }}>Equipo</TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 'bold' }}>Jugador Principal</TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 'bold' }}>Jugador Secundario</TableCell> {/* 🔥 NUEVA COLUMNA */}
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 'bold' }}>Puntos</TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 'bold' }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {partido.jugadas.slice(-10).reverse().map((jugada, index) => {
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
                          {(jugada.jugadorPrincipal?.numero && jugada.jugadorPrincipal?.nombre) ? (
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
                          {(jugada.jugadorSecundario?.numero && jugada.jugadorSecundario?.nombre) ? (
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

      {/* 🎯 MODAL DE FORMULARIO DINÁMICO */}
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
                          color: '#4caf50'
                        }} 
                      />
                    )}
                  </Box>
                  <IconButton onClick={cerrarModal} sx={{ color: 'white' }}>
                    <CloseIcon />
                  </IconButton>
                </Box>

                {/* 🎮 SWITCH ÉPICO CON LOGOS DE EQUIPOS */}
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 3,
                  mt: 2
                }}>
                  {/* Switch personalizado con logos */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: 2,
                    p: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', minWidth: 80 }}>
                      Equipo en Posesión:
                    </Typography>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      p: 1,
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: 3,
                      position: 'relative',
                      width: 200,
                      height: 60
                    }}>
                      {/* Background del switch */}
                      <motion.div
                        animate={{
                          x: equipoSeleccionado ? 0 : 100
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        style={{
                          position: 'absolute',
                          top: 4,
                          left: 4,
                          width: 92,
                          height: 52,
                          backgroundColor: 'rgba(100, 181, 246, 0.3)',
                          borderRadius: 20,
                          border: '2px solid #64b5f6'
                        }}
                      />
                      
                      {/* Equipo Local */}
                      <Box
                        onClick={() => manejarCambioEquipo(true)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1,
                          width: 92,
                          height: 52,
                          cursor: 'pointer',
                          borderRadius: 20,
                          zIndex: 2,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            backgroundColor: equipoSeleccionado ? 'transparent' : 'rgba(255, 255, 255, 0.1)'
                          }
                        }}
                      >
                        <Avatar 
                          src={partido.equipoLocal.imagen} 
                          sx={{ 
                            width: 24, 
                            height: 24,
                            border: equipoSeleccionado ? '2px solid white' : 'none'
                          }}
                        />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: equipoSeleccionado ? 'white' : 'rgba(255, 255, 255, 0.6)',
                            fontWeight: equipoSeleccionado ? 'bold' : 'normal',
                            fontSize: '0.75rem'
                          }}
                        >
                          Local
                        </Typography>
                      </Box>
                      
                      {/* Equipo Visitante */}
                      <Box
                        onClick={() => manejarCambioEquipo(false)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1,
                          width: 92,
                          height: 52,
                          cursor: 'pointer',
                          borderRadius: 20,
                          zIndex: 2,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            backgroundColor: !equipoSeleccionado ? 'transparent' : 'rgba(255, 255, 255, 0.1)'
                          }
                        }}
                      >
                        <Avatar 
                          src={partido.equipoVisitante.imagen} 
                          sx={{ 
                            width: 24, 
                            height: 24,
                            border: !equipoSeleccionado ? '2px solid white' : 'none'
                          }}
                        />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: !equipoSeleccionado ? 'white' : 'rgba(255, 255, 255, 0.6)',
                            fontWeight: !equipoSeleccionado ? 'bold' : 'normal',
                            fontSize: '0.75rem'
                          }}
                        >
                          Visit.
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Nombre del equipo seleccionado */}
                    <Typography variant="body1" sx={{ 
                      color: '#64b5f6', 
                      fontWeight: 'bold',
                      minWidth: 120
                    }}>
                      {equipoSeleccionado ? partido.equipoLocal.nombre : partido.equipoVisitante.nombre}
                    </Typography>
                  </Box>

                  {/* ✅ CHECKBOX TOUCHDOWN (para intercepción y corrida) */}
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
                              '&.Mui-checked': {
                                color: '#4caf50'
                              }
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

                  {/* 🎯 CAMPO EXTRA PARA TOUCHDOWN EN INTERCEPCIÓN */}
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
                          min: 1, 
                          max: 99,
                          style: { textAlign: 'center', fontSize: '1.1rem', fontWeight: 'bold' }
                        }}
                        sx={{ 
                          width: '100%',
                          '& .MuiInputLabel-root': { 
                            color: 'rgba(255, 255, 255, 0.7)' 
                          },
                          '& .MuiInputBase-input': { 
                            color: 'white',
                            '&::placeholder': {
                              color: 'rgba(255, 255, 255, 0.4)',
                              opacity: 1
                            }
                          },
                          '& .MuiOutlinedInput-root': {
                            minHeight: 56,
                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                            '& fieldset': {
                              borderColor: 'rgba(76, 175, 80, 0.3)'
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(76, 175, 80, 0.5)'
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#4caf50'
                            }
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
                            min: 1, 
                            max: 99,
                            style: { textAlign: 'center', fontSize: '1.1rem', fontWeight: 'bold' }
                          }}
                          sx={{ 
                            flex: jugadaSeleccionada.campos.length === 1 ? '1 1 100%' : '1 1 calc(50% - 8px)',
                            minWidth: '140px',
                            '& .MuiInputLabel-root': { 
                              color: 'rgba(255, 255, 255, 0.7)' 
                            },
                            '& .MuiInputBase-input': { 
                              color: 'white',
                              '&::placeholder': {
                                color: 'rgba(255, 255, 255, 0.4)',
                                opacity: 1
                              }
                            },
                            '& .MuiOutlinedInput-root': {
                              minHeight: 56,
                              '& fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.2)'
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.4)'
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#64b5f6'
                              }
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
                      '& .MuiInputLabel-root': { 
                        color: 'rgba(255, 255, 255, 0.7)' 
                      },
                      '& .MuiInputBase-input': { 
                        color: 'white' 
                      },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.2)'
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.4)'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#64b5f6'
                        }
                      },
                      '& .MuiInputBase-input::placeholder': {
                        color: 'rgba(255, 255, 255, 0.4)',
                        opacity: 1
                      }
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
    </Box>
  );
};

export default RegistroJugadas;