import { useState, useEffect } from 'react';
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
import { useAuth } from '../../context/AuthContext'; // 🔥 AGREGADO

// 🔥 Componente para el avatar del equipo
const EquipoAvatar = ({ equipo, size = 64 }) => {
  const equipoImageUrl = useImage(equipo?.imagen, '');
  
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

// 🔥 Componente para usuario disponible
const UsuarioDisponibleItem = ({ usuario, onAgregar, index }) => {
  const usuarioImageUrl = useImage(usuario.imagen, '');
  
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
              onClick={() => onAgregar(usuario)}
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
              {usuario.nombre}
            </Typography>
          }
          secondary={
            <Typography variant="body2" color="text.secondary">
              {usuario.documento}
            </Typography>
          }
        />
      </ListItem>
    </motion.div>
  );
};

// 🔥 Componente para jugador seleccionado
const JugadorSeleccionadoItem = ({ jugador, onQuitar, onActualizarNumero, index }) => {
  const usuarioImageUrl = useImage(jugador.usuario.imagen, '');
  
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
                {jugador.usuario.nombre}
              </Typography>
            }
            secondary={
              <Typography variant="body2" color="text.secondary">
                {jugador.usuario.documento}
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
            value={jugador.numero}
            onChange={(e) => onActualizarNumero(jugador.usuario._id, e.target.value)}
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
            onClick={() => onQuitar(jugador.usuario._id)}
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

// 🔥 Componente para jugador del roster
const JugadorRosterItem = ({ jugador, onEliminar, index, deletingPlayer, jugadorAEliminar }) => {
  const jugadorImageUrl = useImage(jugador.imagen, '');
  
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
          <Typography sx={{ color: 'white' }}>{jugador.nombre}</Typography>
        </Box>
      </TableCell>
      <TableCell sx={{
        color: 'rgba(255, 255, 255, 0.7)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {jugador.documento}
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
          {jugador.numero}
        </Box>
      </TableCell>
      <TableCell align="center" sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Tooltip title="Eliminar del equipo">
          <span>
            <IconButton
              color="error"
              disabled={deletingPlayer}
              onClick={() => onEliminar(jugador._id)}
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
  
  // 🔥 CAMBIADO: Usar puedeGestionarEquipos en lugar de tieneRol
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

  // 🔥 AGREGADO: Verificar permisos al cargar el componente
  useEffect(() => {
    if (!puedeGestionarEquipos()) {
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
        setLoading(true);

        const equipoResponse = await axiosInstance.get(`/equipos/${id}`);
        setEquipo(equipoResponse.data);

        const usuariosResponse = await axiosInstance.get('/usuarios');

        const usuariosEnEquipo = [];
        const jugadoresFiltrados = usuariosResponse.data.filter(usuario => {
          const estaEnEquipo = usuario.equipos.some(e => e.equipo._id === id);
          if (estaEnEquipo) {
            const equipoData = usuario.equipos.find(e => e.equipo._id === id);
            usuariosEnEquipo.push({
              ...usuario,
              numero: equipoData.numero
            });
          }
          return !estaEnEquipo;
        });

        setJugadoresActuales(usuariosEnEquipo);
        setUsuarios(jugadoresFiltrados);
        setUsuariosFiltrados(jugadoresFiltrados);
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setErrorMessage('Error al cargar los datos. Por favor, intenta nuevamente.');
        setLoading(false);
      }
    };

    // 🔥 CAMBIADO: Solo ejecutar si tiene permisos
    if (puedeGestionarEquipos()) {
      fetchData();
    }
  }, [id, puedeGestionarEquipos]);

  // Filtrar usuarios cuando cambia el texto de búsqueda
  useEffect(() => {
    if (filtroUsuarios.trim() === '') {
      setUsuariosFiltrados(usuarios);
      return;
    }

    const filtroLowerCase = filtroUsuarios.toLowerCase();
    const resultado = usuarios.filter(
      usuario =>
        usuario.nombre.toLowerCase().includes(filtroLowerCase) ||
        usuario.documento.toLowerCase().includes(filtroLowerCase)
    );

    setUsuariosFiltrados(resultado);
  }, [filtroUsuarios, usuarios]);

  // Agregar jugador a la lista de seleccionados
  const agregarJugador = (jugador) => {
    if (jugadoresSeleccionados.some(j => j.usuario._id === jugador._id)) {
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
  };

  // Quitar jugador de la lista de seleccionados
  const quitarJugador = (jugadorId) => {
    const jugadorAQuitar = jugadoresSeleccionados.find(j => j.usuario._id === jugadorId).usuario;

    setJugadoresSeleccionados(jugadoresSeleccionados.filter(j => j.usuario._id !== jugadorId));

    setUsuarios([...usuarios, jugadorAQuitar]);
  };

  // Actualizar número de camiseta
  const actualizarNumeroCamiseta = (jugadorId, nuevoNumero) => {
    setJugadoresSeleccionados(
      jugadoresSeleccionados.map(j =>
        j.usuario._id === jugadorId ? { ...j, numero: nuevoNumero } : j
      )
    );
  };

  // Abrir diálogo para ver roster
  const handleOpenRoster = () => {
    setOpenRosterDialog(true);
  };

  // Cerrar diálogo de roster
  const handleCloseRoster = () => {
    setOpenRosterDialog(false);
  };

  // Manejar cambio en el filtro de búsqueda
  const handleFiltroChange = (e) => {
    setFiltroUsuarios(e.target.value);
  };

  // Iniciar proceso de eliminación de jugador
  const iniciarEliminarJugador = async (jugadorId) => {
    // 🔥 AGREGADO: Verificar permisos antes de eliminar
    if (!puedeGestionarEquipos()) {
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

  // Eliminar jugador del equipo
  const eliminarJugadorDelEquipo = async (jugadorId) => {
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
      }

      Swal.fire({
        icon: 'success',
        title: 'Jugador eliminado',
        text: 'El jugador ha sido eliminado del equipo correctamente',
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
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

  // Guardar jugadores en el equipo
  const guardarJugadores = async () => {
    // 🔥 AGREGADO: Verificar permisos antes de guardar
    if (!puedeGestionarEquipos()) {
      Swal.fire({
        icon: 'error',
        title: 'Sin permisos',
        text: 'No tienes permisos para registrar jugadores en equipos'
      });
      return;
    }

    const faltanNumeros = jugadoresSeleccionados.some(j => !j.numero);
    if (faltanNumeros) {
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

      await axiosInstance.post('/equipos/registrarJugadores', {
        jugadores: jugadoresDatos
      });

      Swal.fire({
        icon: 'success',
        title: 'Jugadores registrados',
        text: 'Los jugadores se han registrado correctamente en el equipo',
        showConfirmButton: false,
        timer: 2000,
      });

      navigate('/equipos');
    } catch (error) {
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

  // 🔥 AGREGADO: Si no tiene permisos, mostrar mensaje de acceso denegado
  if (!puedeGestionarEquipos()) {
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
                        {equipo.nombre}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {getCategoryName(equipo.categoria)}
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
                Roster Actual: {equipo?.nombre}
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