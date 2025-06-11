import { 
  Box, 
  Typography, 
  Paper, 
  Grid,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Rating,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Autocomplete,
  Fade,
  Zoom,
  Tooltip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  Badge,
  Divider,
  IconButton
} from '@mui/material';
import {
  Gavel as GavelIcon,
  Person as PersonIcon,
  Star as StarIcon,
  WorkspacePremium as WorkspacePremiumIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Assignment as AssignmentIcon,
  Verified as VerifiedIcon,
  EmojiEvents as EmojiEventsIcon,
  Edit as EditIcon,
  RemoveCircle as RemoveCircleIcon, // 🔥 NUEVO icono para desasignar
  SwapHoriz as SwapHorizIcon // 🔥 NUEVO icono para cambiar
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../../config/axios';
import { useImage } from '../../hooks/useImage';
import { 
  getNivelArbitroName, 
  getPosicionName, 
  getEstadoArbitroName,
  getNivelColor
} from '../../helpers/arbitroMappings';
import Swal from 'sweetalert2';

const ArbitrosPanel = ({ partido, onActualizar }) => {
  const [arbitrosLocales, setArbitrosLocales] = useState(partido?.arbitros || {});
  const arbitros = arbitrosLocales;
  
  // Estados para gestión de árbitros
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [arbitrosDisponibles, setArbitrosDisponibles] = useState([]);
  const [cargandoArbitros, setCargandoArbitros] = useState(false);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('');
  const [posicionSeleccionada, setPosicionSeleccionada] = useState('');
  const [arbitroSeleccionado, setArbitroSeleccionado] = useState(null);
  const [asignando, setAsignando] = useState(false);
  const [desasignando, setDesasignando] = useState(false);

  // 🔥 NUEVO: Sync arbitros cuando cambie el partido
  useEffect(() => {
    console.log('🔄 Actualizando árbitros locales del partido:', partido?.arbitros);
    setArbitrosLocales(partido?.arbitros || {});
  }, [partido?.arbitros]);

  // Cargar árbitros disponibles
  const cargarArbitrosDisponibles = async () => {
    try {
      setCargandoArbitros(true);
      console.log('🔍 Cargando árbitros disponibles...');
      
      const { data } = await axiosInstance.get('/arbitros');
      console.log('📦 Datos recibidos del servidor:', data);
      
      // 🔥 CORRECCIÓN: Filtrar árbitros que pueden arbitrar
      const arbitrosFiltrados = data.arbitros.filter(arbitro => {
        console.log('🧪 Analizando árbitro:', {
          nombre: arbitro.usuario?.nombre,
          rolPrincipal: arbitro.usuario?.rol,
          rolSecundario: arbitro.usuario?.rolSecundario,
          estadoArbitro: arbitro.estado,
          disponible: arbitro.disponible,
          nivel: arbitro.nivel
        });
        
        // 🔥 LÓGICA CORREGIDA: Verificar AMBOS roles correctamente
        const esArbitroPrincipal = arbitro.usuario?.rol === 'arbitro';
        const esArbitroSecundario = arbitro.usuario?.rolSecundario === 'arbitro';
        const puedeArbitrar = esArbitroPrincipal || esArbitroSecundario;
        const estaDisponible = arbitro.estado === 'activo' && arbitro.disponible === true;
        
        const resultado = puedeArbitrar && estaDisponible;
        
        console.log(`${arbitro.usuario?.nombre}: esArbitroPrincipal=${esArbitroPrincipal}, esArbitroSecundario=${esArbitroSecundario}, puedeArbitrar=${puedeArbitrar}, disponible=${estaDisponible} → ${resultado ? '✅' : '❌'}`);
        
        return resultado;
      });
      
      console.log(`✅ ${arbitrosFiltrados.length} árbitros disponibles encontrados después del filtro`);
      setArbitrosDisponibles(arbitrosFiltrados);
      
    } catch (error) {
      console.error('❌ Error al cargar árbitros:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los árbitros disponibles'
      });
    } finally {
      setCargandoArbitros(false);
    }
  };

  // Filtrar árbitros según criterios MEJORADO
  const arbitrosFiltrados = arbitrosDisponibles.filter(arbitro => {
    // 1. Filtros básicos de texto y nivel
    const coincideTexto = !filtroTexto || 
      arbitro.usuario?.nombre.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      arbitro.usuario?.email.toLowerCase().includes(filtroTexto.toLowerCase());
    
    const coincideNivel = !filtroNivel || arbitro.nivel === filtroNivel;
    
    // 2. 🔥 CORRECCIÓN: Filtrar por posición del ARBITRO, no del usuario
    let puedeArbitrarPosicion = true;
    if (posicionSeleccionada && arbitro.posiciones && arbitro.posiciones.length > 0) {
      puedeArbitrarPosicion = arbitro.posiciones.includes(posicionSeleccionada);
      console.log(`🔍 ${arbitro.usuario?.nombre}: posiciones [${arbitro.posiciones.join(', ')}], buscando "${posicionSeleccionada}" → ${puedeArbitrarPosicion ? '✅' : '❌'}`);
    }
    
    // 3. 🔥 No mostrar árbitros ya asignados al partido
    const arbitrosYaAsignados = [
      partido?.arbitros?.principal?._id,
      partido?.arbitros?.backeador?._id,
      partido?.arbitros?.estadistico?._id
    ].filter(Boolean);
    
    const noEstaAsignado = !arbitrosYaAsignados.includes(arbitro._id);
    
    const resultado = coincideTexto && coincideNivel && puedeArbitrarPosicion && noEstaAsignado;
    
    if (!resultado) {
      console.log(`❌ ${arbitro.usuario?.nombre} filtrado por: texto=${coincideTexto}, nivel=${coincideNivel}, posición=${puedeArbitrarPosicion}, noAsignado=${noEstaAsignado}`);
    }
    
    return resultado;
  });

  // Asignar árbitro al partido
  const asignarArbitro = async () => {
    if (!arbitroSeleccionado || !posicionSeleccionada) {
      Swal.fire({
        icon: 'warning',
        title: 'Datos incompletos',
        text: 'Selecciona un árbitro y una posición'
      });
      return;
    }

    try {
      setAsignando(true);
      console.log(`⚖️ Asignando árbitro ${arbitroSeleccionado._id} como ${posicionSeleccionada}`);
      
      const datosAsignacion = {
        [posicionSeleccionada]: arbitroSeleccionado._id
      };
      
      await axiosInstance.post(`/partidos/${partido._id}/arbitros`, datosAsignacion);
      
      // 🔥 ACTUALIZACIÓN OPTIMISTA: Actualizar inmediatamente sin esperar
      const nuevoArbitro = arbitroSeleccionado;
      setArbitrosLocales(prev => ({
        ...prev,
        [posicionSeleccionada]: nuevoArbitro
      }));
      
      // 🔥 CORRECCIÓN: Limpiar estados y cerrar dialog
      setDialogAbierto(false);
      setArbitroSeleccionado(null);
      setPosicionSeleccionada('');
      setFiltroTexto('');
      setFiltroNivel('');
      
      // 🔥 CORRECCIÓN: Forzar actualización del componente padre
      if (onActualizar) {
        console.log('🔄 Forzando actualización del partido...');
        await onActualizar();
        console.log('✅ Partido actualizado en la interfaz');
      }
      
      Swal.fire({
        icon: 'success',
        title: '¡Árbitro asignado!',
        text: `${arbitroSeleccionado.usuario.nombre} ha sido asignado como ${getPosicionName(posicionSeleccionada)}`,
        timer: 3000,
        showConfirmButton: false
      });
      
    } catch (error) {
      console.error('❌ Error al asignar árbitro:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.mensaje || 'No se pudo asignar el árbitro'
      });
    } finally {
      setAsignando(false);
    }
  };

  // 🔥 NUEVA FUNCIÓN: Desasignar árbitro
  const desasignarArbitro = async (posicion, nombreArbitro) => {
    const confirmacion = await Swal.fire({
      title: '¿Confirmar desasignación?',
      text: `Se removerá a ${nombreArbitro} de la posición ${getPosicionName(posicion)}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f44336',
      cancelButtonColor: '#2196f3',
      confirmButtonText: 'Sí, desasignar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    try {
      setDesasignando(true);
      console.log(`🚫 Desasignando árbitro de posición: ${posicion}`);
      
      // 🔥 MÉTODO DIRECTO: Ahora podemos usar null gracias a las validaciones corregidas
      console.log('🔄 Desasignando con null (validaciones corregidas)...');
      
      const response = await axiosInstance.post(`/partidos/${partido._id}/arbitros`, {
        [posicion]: null
      });
      
      // 🔥 ACTUALIZACIÓN OPTIMISTA: Remover inmediatamente sin esperar
      setArbitrosLocales(prev => ({
        ...prev,
        [posicion]: null
      }));
      
      // Actualizar partido
      if (onActualizar) {
        console.log('🔄 Actualizando partido después de desasignación...');
        await onActualizar();
        console.log('✅ Partido actualizado');
      }
      
      Swal.fire({
        icon: 'success',
        title: 'Árbitro desasignado',
        text: `${nombreArbitro} ha sido removido de la posición ${getPosicionName(posicion)}`,
        timer: 3000,
        showConfirmButton: false
      });
      
    } catch (error) {
      console.error('❌ Error al desasignar árbitro:', error);
      console.error('📋 Error completo:', error.response?.data);
      
      Swal.fire({
        icon: 'error',
        title: 'Error al desasignar',
        text: `${error.response?.data?.mensaje || error.message || 'No se pudo desasignar el árbitro'}`,
        footer: `Detalles técnicos: ${error.response?.status} - ${error.response?.statusText}`
      });
    } finally {
      setDesasignando(false);
    }
  };

  // Abrir dialog de asignación
  const abrirDialogAsignacion = (posicion = '') => {
    setPosicionSeleccionada(posicion);
    setDialogAbierto(true);
    cargarArbitrosDisponibles();
  };

  // 🔥 COMPONENTE ÉPICO - Card de árbitro con diseño increíble
  const ArbitroCard = ({ arbitro }) => {
    const arbitroImageUrl = useImage(arbitro.usuario?.imagen, '');
    const nivelColor = getNivelColor(arbitro.nivel);
    const isSelected = arbitroSeleccionado?._id === arbitro._id;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Card 
          sx={{ 
            cursor: 'pointer',
            position: 'relative',
            width: '100%', // 🔥 NUEVO: Ancho completo
            minHeight: '140px', // 🔥 NUEVO: Altura mínima consistente
            display: 'flex', // 🔥 NUEVO: Flex para el contenido interno
            flexDirection: 'column',
            background: isSelected 
              ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))',
            border: isSelected 
              ? '2px solid #4caf50' 
              : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
            overflow: 'hidden',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            backdropFilter: 'blur(20px)',
            '&:hover': {
              background: isSelected 
                ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(139, 195, 74, 0.15))'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(100, 181, 246, 0.05))',
              transform: 'translateY(-4px)',
              boxShadow: isSelected 
                ? '0 12px 40px rgba(76, 175, 80, 0.3)'
                : '0 12px 40px rgba(100, 181, 246, 0.2)',
              '& .arbitro-glow': {
                opacity: 1
              }
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: `linear-gradient(90deg, ${nivelColor}, ${nivelColor}80)`,
              opacity: isSelected ? 1 : 0.7
            }
          }}
          onClick={() => setArbitroSeleccionado(arbitro)}
        >
          {/* Efecto de brillo */}
          <Box
            className="arbitro-glow"
            sx={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
              opacity: 0,
              transition: 'all 0.6s ease',
              '&:hover': {
                left: '100%'
              }
            }}
          />

          <CardContent sx={{ p: 3, position: 'relative', width: '100%', flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, width: '100%' }}>
              {/* Avatar con efectos */}
              <Box sx={{ position: 'relative' }}>
                <Avatar 
                  src={arbitroImageUrl} 
                  sx={{ 
                    width: 64, 
                    height: 64,
                    border: `3px solid ${isSelected ? '#4caf50' : nivelColor}`,
                    boxShadow: `0 0 20px ${isSelected ? 'rgba(76, 175, 80, 0.4)' : `${nivelColor}40`}`,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <PersonIcon sx={{ fontSize: 32 }} />
                </Avatar>
                
                {/* Badge de nivel */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: nivelColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid rgba(0, 0, 0, 0.8)',
                    boxShadow: `0 0 10px ${nivelColor}80`
                  }}
                >
                  <GavelIcon sx={{ fontSize: 12, color: 'white' }} />
                </Box>
              </Box>
              
              <Box sx={{ flex: 1, minWidth: 0 }}> {/* 🔥 NUEVO: minWidth: 0 para permitir flex shrink */}
                {/* Nombre con efecto */}
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'white', 
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                    mb: 0.5
                  }}
                >
                  {arbitro.usuario?.nombre}
                </Typography>
                
                {/* 🔥 NUEVO: Mostrar rol del usuario */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    label={getNivelArbitroName(arbitro.nivel)}
                    size="small"
                    icon={<StarIcon sx={{ fontSize: 14 }} />}
                    sx={{ 
                      background: `linear-gradient(45deg, ${nivelColor}, ${nivelColor}dd)`,
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      boxShadow: `0 2px 8px ${nivelColor}40`,
                      '& .MuiChip-icon': { color: 'white' }
                    }}
                  />
                  
                  {/* 🔥 NUEVO: Chip para mostrar rol del usuario */}
                  <Chip 
                    label={arbitro.usuario?.rol === 'arbitro' ? 'Árbitro' : `${arbitro.usuario?.rol} + Árbitro`}
                    size="small"
                    sx={{ 
                      backgroundColor: arbitro.usuario?.rol === 'arbitro' ? 'rgba(156, 39, 176, 0.2)' : 'rgba(33, 150, 243, 0.2)',
                      color: arbitro.usuario?.rol === 'arbitro' ? '#ab47bc' : '#2196f3',
                      border: `1px solid ${arbitro.usuario?.rol === 'arbitro' ? 'rgba(156, 39, 176, 0.5)' : 'rgba(33, 150, 243, 0.5)'}`,
                      fontWeight: 500,
                      fontSize: '0.7rem'
                    }}
                  />
                  
                  {arbitro.experiencia && (
                    <Chip 
                      label={`${arbitro.experiencia} años`}
                      size="small"
                      icon={<ScheduleIcon sx={{ fontSize: 14 }} />}
                      sx={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        fontWeight: 500,
                        '& .MuiChip-icon': { color: 'rgba(255, 255, 255, 0.7)' }
                      }}
                    />
                  )}

                  {/* Mostrar posiciones disponibles */}
                  {arbitro.posiciones && arbitro.posiciones.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {arbitro.posiciones.map((pos, index) => (
                        <Chip
                          key={index}
                          label={getPosicionName(pos)}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontSize: '0.7rem',
                            height: 20,
                            borderColor: posicionSeleccionada === pos 
                              ? '#4caf50' 
                              : 'rgba(255, 255, 255, 0.3)',
                            color: posicionSeleccionada === pos 
                              ? '#4caf50' 
                              : 'rgba(255, 255, 255, 0.6)',
                            backgroundColor: posicionSeleccionada === pos 
                              ? 'rgba(76, 175, 80, 0.1)' 
                              : 'transparent'
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
                
                {/* Email con icono */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon sx={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.5)' }} />
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.7)', 
                      fontSize: '0.85rem',
                      fontWeight: 400
                    }}
                  >
                    {arbitro.usuario?.email}
                  </Typography>
                </Box>
              </Box>
              
              {/* Indicador de selección con animación */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'linear-gradient(45deg, #4caf50, #66bb6a)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 16px rgba(76, 175, 80, 0.4)'
                      }}
                    >
                      <CheckIcon sx={{ color: 'white', fontSize: 24, fontWeight: 'bold' }} />
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // 🔥 Componente para información detallada de árbitro - MEJORADO CON BOTÓN DESASIGNAR
  const ArbitroDetallado = ({ arbitro, posicion, esPrincipal = false }) => {
    if (!arbitro) return null;

    const arbitroImageUrl = useImage(arbitro.usuario?.imagen, '');
    const nivelColor = getNivelColor(arbitro.nivel);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Paper
          sx={{
            backgroundColor: esPrincipal 
              ? 'rgba(255, 193, 7, 0.1)' 
              : 'rgba(255, 255, 255, 0.05)',
            border: esPrincipal 
              ? '2px solid #ffc107' 
              : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
            p: 3,
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            '&::before': esPrincipal ? {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #ffc107, #ff9800)',
            } : {}
          }}
        >
          {esPrincipal && (
            <Box
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}
            >
              <WorkspacePremiumIcon sx={{ color: '#ffc107', fontSize: 20 }} />
              <Typography variant="caption" sx={{ color: '#ffc107', fontWeight: 600 }}>
                PRINCIPAL
              </Typography>
            </Box>
          )}

          {/* 🔥 NUEVO: Botones de acción en la esquina superior derecha */}
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: esPrincipal ? 120 : 12,
              display: 'flex',
              gap: 1
            }}
          >
            {/* Botón para cambiar árbitro */}
            <Tooltip title={`Cambiar ${getPosicionName(posicion)}`}>
              <IconButton
                size="small"
                onClick={() => abrirDialogAsignacion(posicion)}
                sx={{
                  backgroundColor: 'rgba(33, 150, 243, 0.2)',
                  color: '#2196f3',
                  '&:hover': {
                    backgroundColor: 'rgba(33, 150, 243, 0.3)',
                    transform: 'scale(1.1)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <SwapHorizIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>

            {/* Botón para desasignar árbitro */}
            <Tooltip title={`Desasignar ${getPosicionName(posicion)}`}>
              <IconButton
                size="small"
                onClick={() => desasignarArbitro(posicion, arbitro.usuario?.nombre)}
                disabled={desasignando}
                sx={{
                  backgroundColor: 'rgba(244, 67, 54, 0.2)',
                  color: '#f44336',
                  '&:hover': {
                    backgroundColor: 'rgba(244, 67, 54, 0.3)',
                    transform: 'scale(1.1)'
                  },
                  '&:disabled': {
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    color: 'rgba(244, 67, 54, 0.5)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {desasignando ? (
                  <CircularProgress size={16} sx={{ color: '#f44336' }} />
                ) : (
                  <RemoveCircleIcon sx={{ fontSize: 16 }} />
                )}
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <Avatar sx={{ width: 20, height: 20, backgroundColor: nivelColor }}>
                  <GavelIcon sx={{ fontSize: 12 }} />
                </Avatar>
              }
            >
              <Avatar 
                src={arbitroImageUrl}
                sx={{ width: 60, height: 60 }}
              >
                <PersonIcon />
              </Avatar>
            </Badge>

            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                {arbitro.usuario?.nombre}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {getPosicionName(posicion)}
              </Typography>
              
              {/* 🔥 NUEVO: Mostrar rol del usuario */}
              <Chip 
                label={arbitro.usuario?.rol === 'arbitro' ? 'Árbitro' : `${arbitro.usuario?.rol} + Árbitro`}
                size="small"
                sx={{ 
                  mt: 0.5,
                  backgroundColor: arbitro.usuario?.rol === 'arbitro' ? 'rgba(156, 39, 176, 0.2)' : 'rgba(33, 150, 243, 0.2)',
                  color: arbitro.usuario?.rol === 'arbitro' ? '#ab47bc' : '#2196f3',
                  border: `1px solid ${arbitro.usuario?.rol === 'arbitro' ? 'rgba(156, 39, 176, 0.5)' : 'rgba(33, 150, 243, 0.5)'}`,
                  fontWeight: 500,
                  fontSize: '0.7rem'
                }}
              />
            </Box>
          </Box>

          <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <WorkspacePremiumIcon sx={{ fontSize: 16, color: nivelColor }} />
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                  Nivel: {getNivelArbitroName(arbitro.nivel)}
                </Typography>
              </Box>
            </Grid>

            {arbitro.experiencia && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ScheduleIcon sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.5)' }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {arbitro.experiencia} años de experiencia
                  </Typography>
                </Box>
              </Grid>
            )}

            {arbitro.usuario?.email && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.5)' }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {arbitro.usuario.email}
                  </Typography>
                </Box>
              </Grid>
            )}

            {/* 🔥 NUEVO: Mostrar posiciones que puede arbitrar */}
            {arbitro.posiciones && arbitro.posiciones.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 1, display: 'block' }}>
                  Posiciones disponibles:
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {arbitro.posiciones.map((pos, index) => (
                    <Chip
                      key={index}
                      label={getPosicionName(pos)}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontSize: '0.7rem',
                        height: 20,
                        borderColor: pos === posicion 
                          ? '#4caf50' 
                          : 'rgba(255, 255, 255, 0.3)',
                        color: pos === posicion 
                          ? '#4caf50' 
                          : 'rgba(255, 255, 255, 0.6)',
                        backgroundColor: pos === posicion 
                          ? 'rgba(76, 175, 80, 0.1)' 
                          : 'transparent'
                      }}
                    />
                  ))}
                </Box>
              </Grid>
            )}
          </Grid>
        </Paper>
      </motion.div>
    );
  };

  // 🔥 Componente para árbitro no asignado con botón de asignación
  const ArbitroVacio = ({ posicion }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Paper
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: '2px dashed rgba(255, 255, 255, 0.2)',
          borderRadius: 3,
          p: 3,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.4)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)'
          }
        }}
      >
        <Avatar
          sx={{ 
            width: 60, 
            height: 60,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            mb: 2
          }}
        >
          <PersonIcon sx={{ fontSize: 30, color: 'rgba(255, 255, 255, 0.3)' }} />
        </Avatar>
        
        <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 1 }}>
          {getPosicionName(posicion)}
        </Typography>
        
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.3)', mb: 2 }}>
          No asignado
        </Typography>

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => abrirDialogAsignacion(posicion)}
          sx={{
            borderColor: 'rgba(255, 255, 255, 0.3)',
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': {
              borderColor: '#64b5f6',
              color: '#64b5f6',
              backgroundColor: 'rgba(100, 181, 246, 0.1)'
            }
          }}
        >
          Asignar
        </Button>
      </Paper>
    </motion.div>
  );

  // 🔥 Panel de estadísticas de arbitraje
  const EstadisticasArbitraje = () => {
    const arbitrosAsignados = Object.values(arbitros).filter(Boolean);
    const promedioExperiencia = arbitrosAsignados.length > 0 
      ? arbitrosAsignados.reduce((sum, arb) => sum + (arb.experiencia || 0), 0) / arbitrosAsignados.length
      : 0;
    const promedioRating = arbitrosAsignados.length > 0 
      ? arbitrosAsignados.reduce((sum, arb) => sum + (arb.rating || 0), 0) / arbitrosAsignados.length
      : 0;

    return (
      <Paper sx={{ p: 2, backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentIcon sx={{ color: '#64b5f6' }} />
          Estado del Arbitraje
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                {arbitrosAsignados.length}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                de 3 árbitros asignados
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(arbitrosAsignados.length / 3) * 100}
                sx={{ 
                  mt: 1, 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#4caf50' }
                }}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#ffc107', fontWeight: 'bold' }}>
                {promedioExperiencia.toFixed(1)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                años promedio experiencia
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Rating 
                value={promedioRating} 
                readOnly 
                precision={0.1}
                sx={{ color: '#ff9800' }}
              />
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                rating promedio
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  return (
    <Box>
      <EstadisticasArbitraje />
      
      {/* 🔥 NUEVO: Flexbox para 3 árbitros en una fila */}
      <Box sx={{ 
        display: 'flex',
        gap: 3,
        flexWrap: 'wrap', // Para responsive en pantallas pequeñas
        '@media (max-width: 1200px)': {
          flexDirection: 'column' // Stack vertical en pantallas pequeñas
        }
      }}>
        {/* Árbitro Principal */}
        <Box sx={{ flex: 1, minWidth: '300px' }}>
          {arbitros.principal ? (
            <ArbitroDetallado 
              arbitro={arbitros.principal} 
              posicion="principal" 
              esPrincipal={true}
            />
          ) : (
            <ArbitroVacio posicion="principal" />
          )}
        </Box>

        {/* Back Judge */}
        <Box sx={{ flex: 1, minWidth: '300px' }}>
          {arbitros.backeador ? (
            <ArbitroDetallado 
              arbitro={arbitros.backeador} 
              posicion="backeador"
            />
          ) : (
            <ArbitroVacio posicion="backeador" />
          )}
        </Box>

        {/* Estadístico */}
        <Box sx={{ flex: 1, minWidth: '300px' }}>
          {arbitros.estadistico ? (
            <ArbitroDetallado 
              arbitro={arbitros.estadistico} 
              posicion="estadistico"
            />
          ) : (
            <ArbitroVacio posicion="estadistico" />
          )}
        </Box>
      </Box>

      {/* Dialog ÉPICO para asignar árbitro */}
      <Dialog 
        open={dialogAbierto} 
        onClose={() => setDialogAbierto(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(145deg, rgba(18, 18, 18, 0.98), rgba(32, 32, 32, 0.95))',
            backdropFilter: 'blur(30px)',
            borderRadius: 4,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 32px 64px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden'
          }
        }}
        TransitionComponent={Zoom}
        TransitionProps={{ timeout: 400 }}
      >
        {/* Header épico con gradiente */}
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #1976d2, #42a5f5, #64b5f6)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 3,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
            animation: 'shimmer 3s infinite'
          },
          '@keyframes shimmer': {
            '0%': { transform: 'translateX(-100%)' },
            '100%': { transform: 'translateX(100%)' }
          }
        }}>
          <motion.div
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.6, type: "spring" }}
          >
            <GavelIcon sx={{ fontSize: 28 }} />
          </motion.div>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              {arbitros[posicionSeleccionada] ? 'Cambiar Árbitro' : 'Asignar Árbitro'}
            </Typography>
            {posicionSeleccionada && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Typography variant="subtitle1" sx={{ opacity: 0.9, fontWeight: 500 }}>
                  Posición: {getPosicionName(posicionSeleccionada)}
                </Typography>
                <Chip 
                  label={getPosicionName(posicionSeleccionada)}
                  size="small"
                  sx={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 600
                  }}
                />
              </Box>
            )}
          </Box>
          
          <IconButton
            onClick={() => setDialogAbierto(false)}
            sx={{ 
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 4, background: 'transparent' }}>
          {/* 🔥 NUEVO: Mostrar árbitro actual si existe */}
          {arbitros[posicionSeleccionada] && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Paper sx={{ 
                p: 3, 
                mb: 3, 
                background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(255, 193, 7, 0.05))',
                border: '1px solid rgba(255, 152, 0, 0.3)',
                borderRadius: 2
              }}>
                <Typography variant="h6" sx={{ color: '#ff9800', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WorkspacePremiumIcon />
                  Árbitro Actual
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar 
                    src={useImage(arbitros[posicionSeleccionada].usuario?.imagen, '')}
                    sx={{ width: 50, height: 50 }}
                  >
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ color: 'white' }}>
                      {arbitros[posicionSeleccionada].usuario?.nombre}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {getNivelArbitroName(arbitros[posicionSeleccionada].nivel)} • {arbitros[posicionSeleccionada].experiencia} años
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </motion.div>
          )}

          {/* Filtros mejorados */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Paper sx={{ 
              p: 3, 
              mb: 4, 
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              backdropFilter: 'blur(10px)'
            }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterListIcon sx={{ color: '#64b5f6' }} />
                Filtros de Búsqueda
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Buscar árbitro"
                    placeholder="Nombre o email..."
                    value={filtroTexto}
                    onChange={(e) => setFiltroTexto(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: '#64b5f6' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                        '&:hover fieldset': { borderColor: '#64b5f6' },
                        '&.Mui-focused fieldset': { borderColor: '#64b5f6', borderWidth: 2 }
                      },
                      '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={['Local', 'Regional', 'Nacional', 'Internacional']}
                    value={filtroNivel}
                    onChange={(_, value) => setFiltroNivel(value || '')}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Filtrar por nivel"
                        placeholder="Seleccionar nivel..."
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: 'white',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                            '&:hover fieldset': { borderColor: '#64b5f6' },
                            '&.Mui-focused fieldset': { borderColor: '#64b5f6', borderWidth: 2 }
                          },
                          '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                        }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Paper>
          </motion.div>

          {/* Lista de árbitros con animaciones */}
          {cargandoArbitros ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
              <CircularProgress size={60} sx={{ color: '#64b5f6', mb: 2 }} />
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Cargando árbitros...
              </Typography>
            </Box>
          ) : arbitrosFiltrados.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Alert 
                severity="info" 
                sx={{ 
                  backgroundColor: 'rgba(33, 150, 243, 0.1)',
                  border: '1px solid rgba(33, 150, 243, 0.3)',
                  color: 'white',
                  '& .MuiAlert-icon': { color: '#64b5f6' }
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                  No se encontraron árbitros disponibles
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {posicionSeleccionada 
                    ? `• No hay árbitros disponibles para la posición "${getPosicionName(posicionSeleccionada)}"` 
                    : '• No hay árbitros disponibles'
                  }
                  <br />
                  • Los árbitros ya asignados al partido no se muestran
                  <br />
                  • Prueba ajustando los filtros de búsqueda
                </Typography>
              </Alert>
            </motion.div>
          ) : (
            <Box sx={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              maxHeight: 500, 
              overflow: 'auto', 
              pr: 1 
            }}>
              {arbitrosFiltrados.map((arbitro, index) => (
                <motion.div
                  key={arbitro._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  style={{ width: '100%' }} // 🔥 NUEVO: Forzar ancho completo
                >
                  <ArbitroCard arbitro={arbitro} />
                </motion.div>
              ))}
            </Box>
          )}
        </DialogContent>

        {/* Footer con botones épicos */}
        <DialogActions sx={{ 
          p: 4, 
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.05))',
          gap: 2,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Button
            variant="outlined"
            onClick={() => setDialogAbierto(false)}
            sx={{ 
              px: 4,
              py: 1.5,
              color: 'white', 
              borderColor: 'rgba(255, 255, 255, 0.3)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Cancelar
          </Button>
          
          <Button
            variant="contained"
            onClick={asignarArbitro}
            disabled={!arbitroSeleccionado || !posicionSeleccionada || asignando}
            startIcon={asignando ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <CheckIcon />}
            sx={{
              px: 4,
              py: 1.5,
              background: arbitroSeleccionado && posicionSeleccionada 
                ? 'linear-gradient(45deg, #4caf50, #66bb6a)' 
                : 'linear-gradient(45deg, #424242, #616161)',
              boxShadow: arbitroSeleccionado && posicionSeleccionada 
                ? '0 8px 24px rgba(76, 175, 80, 0.3)' 
                : 'none',
              '&:hover': {
                background: arbitroSeleccionado && posicionSeleccionada 
                  ? 'linear-gradient(45deg, #388e3c, #4caf50)' 
                  : 'linear-gradient(45deg, #424242, #616161)',
                transform: arbitroSeleccionado && posicionSeleccionada ? 'translateY(-2px)' : 'none',
                boxShadow: arbitroSeleccionado && posicionSeleccionada 
                  ? '0 12px 32px rgba(76, 175, 80, 0.4)' 
                  : 'none'
              },
              '&:disabled': {
                background: 'linear-gradient(45deg, #424242, #616161)',
                color: 'rgba(255, 255, 255, 0.5)'
              },
              transition: 'all 0.3s ease',
              fontWeight: 600
            }}
          >
            {asignando ? 'Asignando...' : (arbitros[posicionSeleccionada] ? 'Cambiar Árbitro' : 'Asignar Árbitro')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ArbitrosPanel;