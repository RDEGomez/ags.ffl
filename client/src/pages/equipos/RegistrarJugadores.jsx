import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  IconButton,
  Button,
  TextField,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  CircularProgress,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useMediaQuery,
  useTheme,
  InputAdornment,
  Card,
  CardContent,
  Chip,
  Breadcrumbs,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  People as PeopleIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Groups as GroupsIcon,
  NavigateNext as NavigateNextIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import SportsFootballIcon from '@mui/icons-material/SportsFootball';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../../config/axios';
import Swal from 'sweetalert2';
import { getCategoryName } from '../../helpers/mappings';
import { useImage } from '../../hooks/useImage';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';

// 🔥 FUNCIÓN DE LOGGING MEJORADA
const debugLog = (context, data, level = 'INFO') => {
  const timestamp = new Date().toISOString();
  const prefix = {
    'ERROR': '❌',
    'WARN': '⚠️',
    'INFO': '✅',
    'DEBUG': '🔍'
  }[level] || '📝';
  
  console.log(`[${timestamp}] ${prefix} REGISTRAR_JUGADORES | ${context}:`, data);
  
  // Log adicional para errores críticos
  if (level === 'ERROR') {
    console.error(`💥 ERROR CRÍTICO en ${context}:`, data);
    if (data?.stack) {
      console.error('📋 Stack Trace:', data.stack);
    }
  }
};

// 🔥 FUNCIÓN HELPER PARA VALIDAR OBJETOS
const validateObject = (obj, expectedProps, objectName) => {
  debugLog(`VALIDANDO_OBJETO_${objectName}`, { obj, expectedProps });
  
  if (!obj) {
    debugLog(`OBJETO_NULL_${objectName}`, { obj }, 'ERROR');
    return false;
  }
  
  if (typeof obj !== 'object') {
    debugLog(`OBJETO_NO_ES_OBJECT_${objectName}`, { obj, type: typeof obj }, 'ERROR');
    return false;
  }
  
  for (const prop of expectedProps) {
    if (!(prop in obj)) {
      debugLog(`PROPIEDAD_FALTANTE_${objectName}`, { prop, obj }, 'ERROR');
      return false;
    }
    if (obj[prop] === null || obj[prop] === undefined) {
      debugLog(`PROPIEDAD_NULL_${objectName}`, { prop, value: obj[prop] }, 'ERROR');
      return false;
    }
  }
  
  debugLog(`OBJETO_VALIDO_${objectName}`, { obj }, 'INFO');
  return true;
};

// 🔥 Componente para el avatar del equipo CON VALIDACIÓN
const EquipoAvatar = ({ equipo, size = 64 }) => {
  debugLog('EQUIPO_AVATAR_RENDER', { equipo, size });
  
  // Validación segura
  if (!equipo) {
    debugLog('EQUIPO_AVATAR_NULL', { equipo }, 'WARN');
    return (
      <Avatar sx={{ width: size, height: size, border: '3px solid rgba(255, 255, 255, 0.2)' }}>
        <GroupsIcon />
      </Avatar>
    );
  }
  
  const equipoImageUrl = useImage(equipo?.imagen, '');
  debugLog('EQUIPO_AVATAR_IMAGE_URL', { equipoImageUrl, equipoImagen: equipo?.imagen });
  
  return (
    <Avatar
      src={equipoImageUrl}
      sx={{
        width: size,
        height: size,
        border: '3px solid rgba(255, 255, 255, 0.2)'
      }}
    >
      <GroupsIcon />
    </Avatar>
  );
};

// 🔥 Componente para usuario disponible CON VALIDACIÓN
const UsuarioDisponibleItem = ({ usuario, onAgregar, index }) => {
  debugLog('USUARIO_DISPONIBLE_RENDER', { usuario, index });
  
  // Validación crítica
  if (!validateObject(usuario, ['_id', 'nombre'], 'USUARIO_DISPONIBLE')) {
    debugLog('USUARIO_DISPONIBLE_INVALIDO', { usuario }, 'ERROR');
    return null; // No renderizar si el usuario es inválido
  }
  
  const usuarioImageUrl = useImage(usuario.imagen, '');
  debugLog('USUARIO_DISPONIBLE_IMAGE_URL', { usuarioImageUrl, usuarioImagen: usuario.imagen });
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.05 }}
    >
      <ListItem
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 2,
          mb: 1,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            transform: 'translateX(5px)',
            transition: 'all 0.3s ease'
          },
        }}
        secondaryAction={
          <Tooltip title="Agregar al equipo">
            <IconButton
              edge="end"
              color="primary"
              onClick={() => {
                debugLog('USUARIO_DISPONIBLE_CLICK', { usuario });
                onAgregar(usuario);
              }}
              sx={{
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(33, 150, 243, 0.2)',
                  transform: 'scale(1.1)'
                }
              }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        }
      >
        <ListItemAvatar>
          <Avatar
            src={usuarioImageUrl}
            sx={{
              border: '2px solid rgba(255, 255, 255, 0.2)'
            }}
          />
        </ListItemAvatar>
        <ListItemText
          primary={
            <Typography fontWeight="medium" sx={{ color: 'white' }}>
              {usuario.nombre || 'Sin nombre'}
            </Typography>
          }
          secondary={
            <Typography variant="body2" color="text.secondary">
              {usuario.documento || 'Sin documento'}
            </Typography>
          }
        />
      </ListItem>
    </motion.div>
  );
};

// 🔥 Componente para jugador seleccionado CON VALIDACIÓN
const JugadorSeleccionadoItem = ({ jugador, onQuitar, onActualizarNumero, index }) => {
  debugLog('JUGADOR_SELECCIONADO_RENDER', { jugador, index });
  
  // Validación crítica con logging detallado
  if (!jugador) {
    debugLog('JUGADOR_SELECCIONADO_NULL', { jugador }, 'ERROR');
    return null;
  }
  
  if (!jugador.usuario) {
    debugLog('JUGADOR_USUARIO_NULL', { jugador }, 'ERROR');
    return null;
  }
  
  if (!validateObject(jugador.usuario, ['_id', 'nombre'], 'JUGADOR_USUARIO')) {
    debugLog('JUGADOR_USUARIO_INVALIDO', { jugador }, 'ERROR');
    return null;
  }
  
  const usuarioImageUrl = useImage(jugador.usuario.imagen, '');
  debugLog('JUGADOR_SELECCIONADO_IMAGE_URL', { usuarioImageUrl, usuarioImagen: jugador.usuario.imagen });
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
    >
      <ListItem
        sx={{
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          borderRadius: 2,
          mb: 1,
          border: '1px solid rgba(76, 175, 80, 0.3)',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          p: 2,
          '&:hover': {
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            transform: 'scale(1.02)',
            transition: 'all 0.3s ease'
          },
        }}
      >
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          flex: 1,
          width: { xs: '100%', sm: 'auto' },
          mb: { xs: 2, sm: 0 }
        }}>
          <ListItemAvatar>
            <Avatar
              src={usuarioImageUrl}
              sx={{
                border: '2px solid rgba(76, 175, 80, 0.5)'
              }}
            />
          </ListItemAvatar>
          <ListItemText
            primary={
              <Typography fontWeight="medium" sx={{ color: 'white' }}>
                {jugador.usuario.nombre || 'Sin nombre'}
              </Typography>
            }
            secondary={
              <Typography variant="body2" color="text.secondary">
                {jugador.usuario.documento || 'Sin documento'}
              </Typography>
            }
          />
        </Box>

        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          width: { xs: '100%', sm: 'auto' },
          justifyContent: { xs: 'space-between', sm: 'flex-end' },
          gap: 2
        }}>
          <TextField
            label="Número"
            type="number"
            value={jugador.numero || ''}
            onChange={(e) => {
              debugLog('NUMERO_CHANGE', { 
                jugadorId: jugador.usuario._id, 
                nuevoNumero: e.target.value 
              });
              onActualizarNumero(jugador.usuario._id, e.target.value);
            }}
            size="small"
            sx={{
              width: 120,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(100, 181, 246, 0.5)',
                },
              }
            }}
            inputProps={{ min: 0, max: 99 }}
          />
          <IconButton
            color="error"
            onClick={() => {
              debugLog('QUITAR_JUGADOR_CLICK', { jugadorId: jugador.usuario._id });
              onQuitar(jugador.usuario._id);
            }}
            sx={{
              backgroundColor: 'rgba(244, 67, 54, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(244, 67, 54, 0.2)',
                transform: 'scale(1.1)'
              }
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </ListItem>
    </motion.div>
  );
};

// 🔥 Componente para jugador del roster CON VALIDACIÓN
const JugadorRosterItem = ({ jugador, onEliminar, index, deletingPlayer, jugadorAEliminar }) => {
  debugLog('JUGADOR_ROSTER_RENDER', { jugador, index });
  
  // Validación crítica
  if (!validateObject(jugador, ['_id', 'nombre'], 'JUGADOR_ROSTER')) {
    debugLog('JUGADOR_ROSTER_INVALIDO', { jugador }, 'ERROR');
    return null;
  }
  
  const jugadorImageUrl = useImage(jugador.imagen, '');
  debugLog('JUGADOR_ROSTER_IMAGE_URL', { jugadorImageUrl, jugadorImagen: jugador.imagen });
  
  return (
    <motion.tr
      key={jugador._id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      style={{
        backgroundColor: index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)'
      }}
    >
      <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            src={jugadorImageUrl}
            sx={{
              width: 40,
              height: 40,
              mr: 2,
              border: '2px solid rgba(255, 255, 255, 0.2)'
            }}
          />
          <Typography sx={{ color: 'white' }}>{jugador.nombre || 'Sin nombre'}</Typography>
        </Box>
      </TableCell>
      <TableCell sx={{
        color: 'rgba(255, 255, 255, 0.7)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {jugador.documento || 'Sin documento'}
      </TableCell>
      <TableCell align="center" sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Box sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          color: 'white',
          fontWeight: 'bold',
          boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)'
        }}>
          {jugador.numero ?? '?'}
        </Box>
      </TableCell>
      <TableCell align="center" sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Tooltip title="Eliminar del equipo">
          <span>
            <IconButton
              color="error"
              disabled={deletingPlayer}
              onClick={() => {
                debugLog('ELIMINAR_JUGADOR_ROSTER_CLICK', { jugadorId: jugador._id });
                onEliminar(jugador._id);
              }}
              sx={{
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(244, 67, 54, 0.2)',
                  transform: 'scale(1.1)'
                }
              }}
            >
              {deletingPlayer && jugadorAEliminar === jugador._id ? (
                <CircularProgress size={20} />
              ) : (
                <DeleteIcon />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </TableCell>
    </motion.tr>
  );
};

export const RegistrarJugadores = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { puedeGestionarEquipos } = useAuth();

  const [loading, setLoading] = useState(true);
  const [savingData, setSavingData] = useState(false);
  const [deletingPlayer, setDeletingPlayer] = useState(false);
  const [equipo, setEquipo] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [filtroUsuarios, setFiltroUsuarios] = useState('');
  const [jugadoresSeleccionados, setJugadoresSeleccionados] = useState([]);
  const [jugadoresActuales, setJugadoresActuales] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [openRosterDialog, setOpenRosterDialog] = useState(false);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [jugadorAEliminar, setJugadorAEliminar] = useState(null);

  const debouncedFiltroUsuarios = useDebounce(filtroUsuarios, 300);


  // 🔥 LOGGING DE ESTADOS CRÍTICOS
  useEffect(() => {
    debugLog('ESTADO_CAMBIO', {
      equipo: equipo ? { id: equipo._id, nombre: equipo.nombre } : null,
      usuarios: usuarios.length,
      usuariosFiltrados: usuariosFiltrados.length,
      jugadoresSeleccionados: jugadoresSeleccionados.length,
      jugadoresActuales: jugadoresActuales.length,
      loading,
      errorMessage
    });
  }, [equipo, usuarios, usuariosFiltrados, jugadoresSeleccionados, jugadoresActuales, loading, errorMessage]);

  // Verificar permisos al cargar el componente
  useEffect(() => {
    debugLog('VERIFICANDO_PERMISOS', { puedeGestionarEquipos: puedeGestionarEquipos() });
    
    if (!puedeGestionarEquipos()) {
      debugLog('SIN_PERMISOS_GESTIONAR_EQUIPOS', {}, 'WARN');
      Swal.fire({
        icon: 'warning',
        title: 'Acceso Denegado',
        text: 'No tienes permisos para gestionar jugadores de equipos.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#1976d2'
      }).then(() => {
        navigate('/equipos');
      });
      return;
    }
  }, [puedeGestionarEquipos, navigate]);

  // Cargar información del equipo y usuarios disponibles
  useEffect(() => {
    const fetchData = async () => {
      try {
        debugLog('FETCH_DATA_INICIO', { equipoId: id });
        setLoading(true);

        // 🔥 PASO 1: Cargar equipo
        debugLog('CARGANDO_EQUIPO', { equipoId: id });
        const equipoResponse = await axiosInstance.get(`/equipos/${id}`);
        debugLog('EQUIPO_RESPONSE', { 
          status: equipoResponse.status, 
          data: equipoResponse.data 
        });
        
        // Validar respuesta del equipo
        if (!equipoResponse.data) {
          throw new Error('Respuesta del equipo vacía');
        }
        
        if (!equipoResponse.data._id) {
          debugLog('EQUIPO_SIN_ID', { equipoData: equipoResponse.data }, 'ERROR');
          throw new Error('Equipo sin ID válido');
        }
        
        setEquipo(equipoResponse.data);
        debugLog('EQUIPO_ESTABLECIDO', equipoResponse.data);

        // 🔥 PASO 2: Cargar usuarios
        debugLog('CARGANDO_USUARIOS', {});
        const usuariosResponse = await axiosInstance.get('/usuarios');
        debugLog('USUARIOS_RESPONSE', { 
          status: usuariosResponse.status, 
          totalUsuarios: usuariosResponse.data?.length || 0,
          primeros3: usuariosResponse.data?.slice(0, 3) || []
        });

        // Validar respuesta de usuarios
        if (!Array.isArray(usuariosResponse.data)) {
          debugLog('USUARIOS_NO_ARRAY', { usuariosData: usuariosResponse.data }, 'ERROR');
          throw new Error('Respuesta de usuarios no es un array');
        }

        // 🔥 PASO 3: Procesar usuarios con validación detallada
        const usuariosEnEquipo = [];
        const jugadoresFiltrados = [];

        debugLog('PROCESANDO_USUARIOS', { totalUsuarios: usuariosResponse.data.length });

        usuariosResponse.data.forEach((usuario, index) => {
          try {
            // Validar cada usuario
            if (!validateObject(usuario, ['_id', 'equipos'], `USUARIO_${index}`)) {
              debugLog('USUARIO_INVALIDO_SKIPPED', { index, usuario }, 'WARN');
              return; // Skip usuario inválido
            }

            // Validar que equipos sea un array
            if (!Array.isArray(usuario.equipos)) {
              debugLog('USUARIO_EQUIPOS_NO_ARRAY', { 
                index, 
                usuarioId: usuario._id, 
                equipos: usuario.equipos 
              }, 'WARN');
              usuario.equipos = []; // Corregir equipos inválidos
            }

            // Verificar si está en el equipo actual
            const estaEnEquipo = usuario.equipos.some(e => {
              if (!e || !e.equipo) {
                debugLog('EQUIPO_RELACION_INVALIDA', { 
                  usuarioId: usuario._id, 
                  equipoRelacion: e 
                }, 'WARN');
                return false;
              }
              
              const equipoId = typeof e.equipo === 'object' ? e.equipo._id : e.equipo;
              return equipoId === id;
            });

            if (estaEnEquipo) {
              const equipoData = usuario.equipos.find(e => {
                if (!e || !e.equipo) return false;
                const equipoId = typeof e.equipo === 'object' ? e.equipo._id : e.equipo;
                return equipoId === id;
              });

              usuariosEnEquipo.push({
                ...usuario,
                numero: equipoData?.numero || 0
              });
              
              debugLog('USUARIO_EN_EQUIPO', { 
                usuarioId: usuario._id, 
                nombre: usuario.nombre, 
                numero: equipoData?.numero 
              });
            } else {
              jugadoresFiltrados.push(usuario);
              debugLog('USUARIO_DISPONIBLE', { 
                usuarioId: usuario._id, 
                nombre: usuario.nombre 
              });
            }
          } catch (error) {
            debugLog('ERROR_PROCESANDO_USUARIO', { 
              index, 
              usuario, 
              error: error.message 
            }, 'ERROR');
          }
        });

        debugLog('USUARIOS_PROCESADOS', {
          usuariosEnEquipo: usuariosEnEquipo.length,
          jugadoresFiltrados: jugadoresFiltrados.length
        });

        setJugadoresActuales(usuariosEnEquipo);
        setUsuarios(jugadoresFiltrados);
        setUsuariosFiltrados(jugadoresFiltrados);
        
        debugLog('FETCH_DATA_COMPLETADO', {
          equipo: equipoResponse.data.nombre,
          jugadoresActuales: usuariosEnEquipo.length,
          usuariosDisponibles: jugadoresFiltrados.length
        });

      } catch (error) {
        debugLog('ERROR_FETCH_DATA', { 
          error: error.message, 
          stack: error.stack,
          equipoId: id 
        }, 'ERROR');
        
        console.error('Error al cargar datos:', error);
        setErrorMessage('Error al cargar los datos. Por favor, intenta nuevamente.');
      } finally {
        setLoading(false);
        debugLog('LOADING_FALSE', {});
      }
    };

    if (puedeGestionarEquipos()) {
      debugLog('INICIANDO_FETCH_DATA', { equipoId: id });
      fetchData();
    } else {
      debugLog('SKIP_FETCH_DATA_SIN_PERMISOS', {});
    }
  }, [id, puedeGestionarEquipos]);

  const usuariosConIndices = useMemo(() => {
    return usuarios.map(usuario => {
      const searchIndex = [
        usuario.nombre || '',
        usuario.documento || '',
        usuario.email || ''
      ].join(' ').toLowerCase();
      
      return {
        ...usuario,
        _searchIndex: searchIndex,
        _nombreLower: (usuario.nombre || '').toLowerCase(),
        _documentoLower: (usuario.documento || '').toLowerCase()
      };
    });
  }, [usuarios]);

  // Filtrar usuarios cuando cambia el texto de búsqueda
  useEffect(() => {
    debugLog('FILTRADO_USUARIOS', { 
      filtroUsuarios: debouncedFiltroUsuarios, 
      usuariosTotal: usuarios.length 
    });
    
    if (debouncedFiltroUsuarios.trim() === '') {
      setUsuariosFiltrados(usuariosConIndices);
      return;
    }

    const filtroLowerCase = debouncedFiltroUsuarios.toLowerCase().trim();
    const resultado = usuariosConIndices.filter(usuario => 
      usuario._searchIndex.includes(filtroLowerCase)
    );

    debugLog('FILTRADO_RESULTADO', { 
      filtro: debouncedFiltroUsuarios, 
      resultados: resultado.length 
    });
    
    setUsuariosFiltrados(resultado);
  }, [debouncedFiltroUsuarios, usuariosConIndices]);

  // Agregar jugador a la lista de seleccionados
  const agregarJugador = (jugador) => {
    debugLog('AGREGAR_JUGADOR', { jugador });
    
    // Validación
    if (!validateObject(jugador, ['_id'], 'JUGADOR_A_AGREGAR')) {
      debugLog('JUGADOR_INVALIDO_NO_AGREGADO', { jugador }, 'ERROR');
      return;
    }

    if (jugadoresSeleccionados.some(j => j.usuario._id === jugador._id)) {
      debugLog('JUGADOR_YA_SELECCIONADO', { jugadorId: jugador._id }, 'WARN');
      return;
    }

    setJugadoresSeleccionados([
      ...jugadoresSeleccionados,
      {
        usuario: jugador,
        numero: ''
      }
    ]);

    setUsuarios(usuarios.filter(u => u._id !== jugador._id));
    debugLog('JUGADOR_AGREGADO_EXITOSO', { jugadorId: jugador._id });
  };

  // Quitar jugador de la lista de seleccionados
  const quitarJugador = (jugadorId) => {
    debugLog('QUITAR_JUGADOR', { jugadorId });
    
    const jugadorAQuitar = jugadoresSeleccionados.find(j => j.usuario._id === jugadorId);
    
    if (!jugadorAQuitar) {
      debugLog('JUGADOR_A_QUITAR_NO_ENCONTRADO', { jugadorId }, 'ERROR');
      return;
    }

    setJugadoresSeleccionados(jugadoresSeleccionados.filter(j => j.usuario._id !== jugadorId));
    setUsuarios([...usuarios, jugadorAQuitar.usuario]);
    
    debugLog('JUGADOR_QUITADO_EXITOSO', { jugadorId });
  };

  // Actualizar número de camiseta
  const actualizarNumeroCamiseta = (jugadorId, nuevoNumero) => {
    debugLog('ACTUALIZAR_NUMERO', { jugadorId, nuevoNumero });
    
    setJugadoresSeleccionados(
      jugadoresSeleccionados.map(j =>
        j.usuario._id === jugadorId ? { ...j, numero: nuevoNumero } : j
      )
    );
  };

  // Resto del código del componente permanece igual...
  // [Mantienes todas las demás funciones sin cambios]

  const handleOpenRoster = () => {
    debugLog('OPEN_ROSTER_DIALOG', {});
    setOpenRosterDialog(true);
  };

  const handleCloseRoster = () => {
    debugLog('CLOSE_ROSTER_DIALOG', {});
    setOpenRosterDialog(false);
  };

  const handleFiltroChange = (e) => {
    debugLog('FILTRO_CHANGE', { nuevoFiltro: e.target.value });
    setFiltroUsuarios(e.target.value);
  };

  const iniciarEliminarJugador = async (jugadorId) => {
    debugLog('INICIAR_ELIMINAR_JUGADOR', { jugadorId });
    
    if (!puedeGestionarEquipos()) {
      debugLog('SIN_PERMISOS_ELIMINAR', {}, 'ERROR');
      Swal.fire({
        icon: 'error',
        title: 'Sin permisos',
        text: 'No tienes permisos para eliminar jugadores del equipo'
      });
      return;
    }

    setJugadorAEliminar(jugadorId);
    setOpenRosterDialog(false);

    setTimeout(async () => {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "El jugador será eliminado del equipo",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        await eliminarJugadorDelEquipo(jugadorId);
      } else {
        setOpenRosterDialog(true);
      }

      setJugadorAEliminar(null);
    }, 100);
  };

  const eliminarJugadorDelEquipo = async (jugadorId) => {
    debugLog('ELIMINAR_JUGADOR_DEL_EQUIPO', { jugadorId });
    
    try {
      setDeletingPlayer(true);

      await axiosInstance.delete('/equipos/borrarJugadores', {
        data: {
          equipoId: id,
          jugadorId
        }
      });

      setJugadoresActuales(jugadoresActuales.filter(j => j._id !== jugadorId));

      const jugadorEliminado = jugadoresActuales.find(j => j._id === jugadorId);

      if (jugadorEliminado) {
        setUsuarios([...usuarios, jugadorEliminado]);
        debugLog('JUGADOR_MOVIDO_A_DISPONIBLES', { jugadorEliminado });
      }

      Swal.fire({
        icon: 'success',
        title: 'Jugador eliminado',
        text: 'El jugador ha sido eliminado del equipo correctamente',
        showConfirmButton: false,
        timer: 1500,
      });
      
      debugLog('JUGADOR_ELIMINADO_EXITOSO', { jugadorId });
    } catch (error) {
      debugLog('ERROR_ELIMINAR_JUGADOR', { 
        jugadorId, 
        error: error.message,
        response: error.response?.data 
      }, 'ERROR');
      
      console.error('Error al eliminar jugador:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.mensaje || 'Error al eliminar el jugador del equipo',
      });
    } finally {
      setDeletingPlayer(false);
    }
  };

  const guardarJugadores = async () => {
    debugLog('GUARDAR_JUGADORES_INICIO', { 
      jugadoresSeleccionados: jugadoresSeleccionados.length 
    });
    
    if (!puedeGestionarEquipos()) {
      debugLog('SIN_PERMISOS_GUARDAR', {}, 'ERROR');
      Swal.fire({
        icon: 'error',
        title: 'Sin permisos',
        text: 'No tienes permisos para registrar jugadores en equipos'
      });
      return;
    }

    // Validaciones
    const faltanNumeros = jugadoresSeleccionados.some(j => !j.numero);
    if (faltanNumeros) {
      debugLog('FALTAN_NUMEROS', { jugadoresSeleccionados }, 'WARN');
      Swal.fire({
        icon: 'error',
        title: 'Faltan datos',
        text: 'Todos los jugadores deben tener un número de camiseta',
      });
      return;
    }

    const numeros = jugadoresSeleccionados.map(j => j.numero);
    const numerosUnicos = new Set(numeros);
    if (numeros.length !== numerosUnicos.size) {
      debugLog('NUMEROS_DUPLICADOS', { numeros }, 'WARN');
      Swal.fire({
        icon: 'error',
        title: 'Números duplicados',
        text: 'No puede haber jugadores con el mismo número de camiseta',
      });
      return;
    }

    const numerosExistentes = jugadoresActuales.map(j => j.numero.toString());
    const numerosConflicto = numeros.filter(num => numerosExistentes.includes(num));

    if (numerosConflicto.length > 0) {
      debugLog('NUMEROS_EN_CONFLICTO', { numerosConflicto, numerosExistentes }, 'WARN');
      Swal.fire({
        icon: 'error',
        title: 'Números en conflicto',
        text: `Los números ${numerosConflicto.join(', ')} ya están asignados a otros jugadores del equipo`,
      });
      return;
    }

    try {
      setSavingData(true);

      const jugadoresDatos = jugadoresSeleccionados.map(j => ({
        usuarioId: j.usuario._id,
        equipoId: id,
        numero: parseInt(j.numero)
      }));

      debugLog('ENVIANDO_JUGADORES_AL_SERVIDOR', { jugadoresDatos });

      await axiosInstance.post('/equipos/registrarJugadores', {
        jugadores: jugadoresDatos
      });

      debugLog('JUGADORES_GUARDADOS_EXITOSO', {});

      Swal.fire({
        icon: 'success',
        title: 'Jugadores registrados',
        text: 'Los jugadores se han registrado correctamente en el equipo',
        showConfirmButton: false,
        timer: 2000,
      });

      navigate('/equipos');
    } catch (error) {
      debugLog('ERROR_GUARDAR_JUGADORES', { 
        error: error.message,
        response: error.response?.data 
      }, 'ERROR');
      
      console.error('Error al registrar jugadores:', error);

      if (error.response?.data?.errores && Array.isArray(error.response.data.errores)) {
        const erroresMensaje = error.response.data.errores.join('\n');
        Swal.fire({
          icon: 'error',
          title: 'No se pudieron registrar los jugadores',
          html: `<div style="text-align: left; max-height: 300px; overflow-y: auto;">
                  <p>${erroresMensaje.replace(/\n/g, '<br>')}</p>
                </div>`,
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.mensaje || 'Error al registrar jugadores',
        });
      }
    } finally {
      setSavingData(false);
    }
  };

  // Si no tiene permisos, mostrar mensaje de acceso denegado
  if (!puedeGestionarEquipos()) {
    debugLog('RENDERIZANDO_SIN_PERMISOS', {});
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh',
        flexDirection: 'column',
        gap: 2,
        backgroundImage: 'linear-gradient(to bottom right, rgba(20, 20, 40, 0.9), rgba(10, 10, 30, 0.95))',
        borderRadius: 2,
        p: 4
      }}>
        <Alert severity="warning" sx={{ maxWidth: 400 }}>
          <Typography variant="h6" gutterBottom>
            Acceso Denegado
          </Typography>
          <Typography variant="body2">
            No tienes permisos para gestionar jugadores de equipos.
          </Typography>
          <Button 
            component={Link} 
            to="/equipos" 
            variant="contained" 
            sx={{ mt: 2 }}
            startIcon={<ArrowBackIcon />}
          >
            Volver a Equipos
          </Button>
        </Alert>
      </Box>
    );
  }

  // Animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
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

  if (loading) {
    debugLog('RENDERIZANDO_LOADING', {});
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh',
        backgroundImage: 'linear-gradient(to bottom right, rgba(20, 20, 40, 0.9), rgba(10, 10, 30, 0.95))',
        borderRadius: 2
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  debugLog('RENDERIZANDO_COMPONENTE_PRINCIPAL', {
    equipoNombre: equipo?.nombre,
    usuariosDisponibles: usuariosFiltrados.length,
    jugadoresSeleccionados: jugadoresSeleccionados.length,
    jugadoresActuales: jugadoresActuales.length
  });

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
            <Link
              to="/equipos"
              style={{
                color: 'inherit',
                textDecoration: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.color = 'white'}
              onMouseLeave={(e) => e.target.style.color = 'inherit'}
            >
              Equipos
            </Link>
            <Typography color="primary">Registrar Jugadores</Typography>
          </Breadcrumbs>
        </motion.div>

        {/* Header */}
        <motion.div variants={itemVariants}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
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
              <PersonAddIcon sx={{ color: '#64b5f6' }} />
              Registrar Jugadores
            </Typography>

            <Button
              component={Link}
              to="/equipos"
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              sx={{
                borderRadius: 2,
                borderWidth: 2,
                py: 1,
                px: 3,
                '&:hover': {
                  borderWidth: 2,
                  backgroundColor: 'rgba(255,255,255,0.05)'
                }
              }}
            >
              Volver a Equipos
            </Button>
          </Box>
        </motion.div>

        {/* Error Alert */}
        {errorMessage && (
          <motion.div variants={itemVariants}>
            <Alert severity="error" sx={{ mb: 3 }}>
              {errorMessage}
            </Alert>
          </motion.div>
        )}

        {/* Información del equipo */}
        {equipo && (
          <motion.div variants={itemVariants}>
            <Card sx={{ ...cardStyle, mb: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 2
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <EquipoAvatar equipo={equipo} size={64} />
                    <Box>
                      <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                        {equipo.nombre || 'Sin nombre'}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {getCategoryName(equipo.categoria) || 'Sin categoría'}
                      </Typography>
                    </Box>
                  </Box>

                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<PeopleIcon />}
                    onClick={handleOpenRoster}
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                      px: 3,
                      background: 'linear-gradient(45deg, #ff6b35 30%, #f7931e 90%)',
                      boxShadow: '0 3px 5px 2px rgba(255, 107, 53, .3)',
                      fontWeight: 'bold'
                    }}
                  >
                    Ver Roster ({jugadoresActuales.length})
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Layout principal */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 4 }}>
          {/* Lista de jugadores disponibles */}
          <Box sx={{ flexBasis: { lg: '50%' } }}>
            <motion.div variants={itemVariants}>
              <Card sx={cardStyle}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 3,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    pb: 2
                  }}>
                    <PersonIcon sx={{ color: '#64b5f6', mr: 2 }} />
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                      Jugadores Disponibles
                    </Typography>
                    <Chip
                      label={usuariosFiltrados.length}
                      color="primary"
                      size="small"
                      sx={{ ml: 'auto' }}
                    />
                  </Box>

                  {/* Campo de búsqueda */}
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder="Buscar por nombre o documento"
                    value={filtroUsuarios}
                    onChange={handleFiltroChange}
                    sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(100, 181, 246, 0.5)',
                        },
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  {usuariosFiltrados.length === 0 ? (
                    <Box sx={{
                      p: 3,
                      textAlign: 'center',
                      border: '2px dashed rgba(255,255,255,0.2)',
                      borderRadius: 2
                    }}>
                      <PersonIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {filtroUsuarios ? 'No se encontraron jugadores con ese criterio' : 'No hay jugadores disponibles para agregar'}
                      </Typography>
                    </Box>
                  ) : (
                    <List
                      sx={{
                        width: '100%',
                        height: 350,
                        overflow: 'auto',
                        '&::-webkit-scrollbar': {
                          width: '8px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          backgroundColor: 'rgba(255,255,255,.3)',
                          borderRadius: '4px',
                        }
                      }}
                    >
                      <AnimatePresence>
                        {usuariosFiltrados.map((usuario, index) => (
                          <UsuarioDisponibleItem
                            key={usuario._id}
                            usuario={usuario}
                            onAgregar={agregarJugador}
                            index={index}
                          />
                        ))}
                      </AnimatePresence>
                    </List>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Box>

          {/* Lista de jugadores seleccionados */}
          <Box sx={{ flexBasis: { lg: '50%' } }}>
            <motion.div variants={itemVariants}>
              <Card sx={cardStyle}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 3,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    pb: 2
                  }}>
                    <SportsFootballIcon sx={{ color: '#64b5f6', mr: 2 }} />
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                      Jugadores a Registrar
                    </Typography>
                    <Chip
                      label={jugadoresSeleccionados.length}
                      color="success"
                      size="small"
                      sx={{ ml: 'auto' }}
                    />
                  </Box>

                  {jugadoresSeleccionados.length === 0 ? (
                    <Box sx={{
                      p: 3,
                      textAlign: 'center',
                      border: '2px dashed rgba(255,255,255,0.2)',
                      borderRadius: 2
                    }}>
                      <SportsFootballIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Aún no has agregado jugadores
                      </Typography>
                    </Box>
                  ) : (
                    <List
                      sx={{
                        width: '100%',
                        height: 400,
                        overflow: 'auto',
                        '&::-webkit-scrollbar': {
                          width: '8px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          backgroundColor: 'rgba(255,255,255,.3)',
                          borderRadius: '4px',
                        }
                      }}
                    >
                      <AnimatePresence>
                        {jugadoresSeleccionados.map((jugador, index) => (
                          <JugadorSeleccionadoItem
                            key={jugador.usuario._id}
                            jugador={jugador}
                            onQuitar={quitarJugador}
                            onActualizarNumero={actualizarNumeroCamiseta}
                            index={index}
                          />
                        ))}
                      </AnimatePresence>
                    </List>
                  )}

                  {/* Botón de guardar */}
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mt: 3,
                    pt: 3,
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<SaveIcon />}
                      onClick={guardarJugadores}
                      disabled={jugadoresSeleccionados.length === 0 || savingData}
                      sx={{
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                        boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
                        fontWeight: 'bold',
                        '&:disabled': {
                          background: 'rgba(255, 255, 255, 0.12)',
                          color: 'rgba(255, 255, 255, 0.3)'
                        }
                      }}
                    >
                      {savingData ? (
                        <>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Guardando...
                        </>
                      ) : (
                        'Guardar Jugadores'
                      )}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Box>
        </Box>

        {/* FAB para abrir roster */}
        <Fab
          onClick={handleOpenRoster}
          color="secondary"
          aria-label="ver roster"
          sx={{
            position: 'fixed',
            bottom: 84,
            right: 24,
            background: 'linear-gradient(45deg, #ff6b35 30%, #f7931e 90%)',
            boxShadow: '0 3px 5px 2px rgba(255, 107, 53, .3)',
            '&:hover': {
              transform: 'scale(1.1)',
              boxShadow: '0 6px 10px 4px rgba(255, 107, 53, .4)'
            },
            zIndex: 1000,
          }}
        >
          <PeopleIcon />
        </Fab>

        {/* Modal de roster actual */}
        <Dialog
          open={openRosterDialog}
          onClose={handleCloseRoster}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              backgroundColor: 'rgba(15, 15, 25, 0.95)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <DialogTitle sx={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PeopleIcon sx={{ color: '#64b5f6' }} />
              <Typography variant="h6">
                Roster Actual: {equipo?.nombre || 'Sin nombre'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={`${jugadoresActuales.length} jugadores`}
                color="primary"
                variant="outlined"
                size="small"
              />
              <IconButton onClick={handleCloseRoster} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>

          <DialogContent dividers sx={{ p: 3 }}>
            {loadingRoster ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                <CircularProgress size={40} />
              </Box>
            ) : jugadoresActuales.length === 0 ? (
              <Box sx={{
                p: 4,
                textAlign: 'center',
                border: '2px dashed rgba(255,255,255,0.2)',
                borderRadius: 2
              }}>
                <PeopleIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)', mb: 2 }} />
                <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                  Este equipo aún no tiene jugadores registrados
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Comienza agregando jugadores desde la lista de disponibles
                </Typography>
              </Box>
            ) : (
              <TableContainer sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '& th': {
                        color: 'white',
                        fontWeight: 'bold',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
                      }
                    }}>
                      <TableCell>Jugador</TableCell>
                      <TableCell>Documento</TableCell>
                      <TableCell align="center">Número</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {jugadoresActuales.map((jugador, index) => (
                      <JugadorRosterItem
                        key={jugador._id}
                        jugador={jugador}
                        onEliminar={iniciarEliminarJugador}
                        index={index}
                        deletingPlayer={deletingPlayer}
                        jugadorAEliminar={jugadorAEliminar}
                      />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Button
              onClick={handleCloseRoster}
              variant="contained"
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                fontWeight: 'bold'
              }}
            >
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Box>
  );
};