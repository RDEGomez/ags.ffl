import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Modal,
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PeopleIcon from '@mui/icons-material/People';
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '../../config/axios';
import Swal from 'sweetalert2';
import { getCategoryName } from '../../helpers/mappings';

export const RegistrarJugadores = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [savingData, setSavingData] = useState(false);
  const [equipo, setEquipo] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [jugadoresSeleccionados, setJugadoresSeleccionados] = useState([]);
  const [jugadoresActuales, setJugadoresActuales] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [openRosterDialog, setOpenRosterDialog] = useState(false);
  const [loadingRoster, setLoadingRoster] = useState(false);
  
  const imagenUrlBase = import.meta.env.VITE_BACKEND_URL + '/uploads/';

  // Cargar información del equipo y usuarios disponibles
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Obtener información del equipo
        const equipoResponse = await axiosInstance.get(`/equipos/${id}`);
        setEquipo(equipoResponse.data);
        
        // Obtener todos los usuarios (jugadores)
        const usuariosResponse = await axiosInstance.get('/usuarios');
        
        // Filtrar usuarios que ya están en este equipo
        const usuariosEnEquipo = [];
        const jugadoresFiltrados = usuariosResponse.data.filter(usuario => {
          const estaEnEquipo = usuario.equipos.some(e => e.equipo._id === id);
          if (estaEnEquipo) {
            // Guardar referencia a los jugadores actuales del equipo
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
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setErrorMessage('Error al cargar los datos. Por favor, intenta nuevamente.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  // Agregar jugador a la lista de seleccionados
  const agregarJugador = (jugador) => {
    // Verificar si el jugador ya está seleccionado
    if (jugadoresSeleccionados.some(j => j.usuario._id === jugador._id)) {
      return;
    }
    
    // Agregar jugador a la lista con número de camiseta vacío
    setJugadoresSeleccionados([
      ...jugadoresSeleccionados,
      {
        usuario: jugador,
        numero: ''
      }
    ]);
    
    // Eliminar el jugador de la lista de disponibles
    setUsuarios(usuarios.filter(u => u._id !== jugador._id));
  };

  // Quitar jugador de la lista de seleccionados
  const quitarJugador = (jugadorId) => {
    // Buscar el jugador a quitar
    const jugadorAQuitar = jugadoresSeleccionados.find(j => j.usuario._id === jugadorId).usuario;
    
    // Quitar de la lista de seleccionados
    setJugadoresSeleccionados(jugadoresSeleccionados.filter(j => j.usuario._id !== jugadorId));
    
    // Devolver a la lista de disponibles
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

  // Guardar jugadores en el equipo
  const guardarJugadores = async () => {
    // Verificar que todos los jugadores tengan número de camiseta
    const faltanNumeros = jugadoresSeleccionados.some(j => !j.numero);
    if (faltanNumeros) {
      Swal.fire({
        icon: 'error',
        title: 'Faltan datos',
        text: 'Todos los jugadores deben tener un número de camiseta',
      });
      return;
    }
    
    // Verificar que no haya números duplicados
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
    
    // Verificar que no haya conflictos con números existentes
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
      
      // Crear el array de datos a enviar
      const jugadoresDatos = jugadoresSeleccionados.map(j => ({
        usuarioId: j.usuario._id,
        equipoId: id,
        numero: parseInt(j.numero)
      }));
      
      // Enviar datos al servidor
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
      
      // Redireccionar a la página del equipo
      navigate('/equipos');
    } catch (error) {
      console.error('Error al registrar jugadores:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.mensaje || 'Error al registrar jugadores',
      });
    } finally {
      setSavingData(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/equipos')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight="bold">
          Registrar Jugadores
        </Typography>
      </Box>
      
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}
      
      {equipo && (
        <Paper elevation={3} sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              src={`${imagenUrlBase}${equipo.imagen}`} 
              sx={{ width: 64, height: 64, mr: 2 }}
            />
            <Box>
              <Typography variant="h5">{equipo.nombre}</Typography>
              <Typography variant="body1" color="text.secondary">
                {getCategoryName(equipo.categoria)}
              </Typography>
            </Box>
          </Box>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<PeopleIcon />}
            onClick={handleOpenRoster}
          >
            Ver Roster ({jugadoresActuales.length})
          </Button>
        </Paper>
      )}
      
      <Grid container spacing={3}>
        {/* Lista de jugadores disponibles */}
        <Grid item xs={12} md={6} sx={{ width: '48%' }}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Jugadores Disponibles
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {usuarios.length === 0 ? (
              <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
                No hay jugadores disponibles para agregar
              </Typography>
            ) : (
              <List sx={{ width: '100%' }}>
                {usuarios.map(usuario => (
                  <ListItem
                    key={usuario._id}
                    sx={{
                      backgroundColor: 'transparent',
                      borderRadius: 1,
                      mb: 1,
                      width: '100%',
                      '&:hover': {
                        backgroundColor: '#4A4A4A',
                      },
                    }}
                    secondaryAction={
                      <Tooltip title="Agregar al equipo">
                        <IconButton 
                          edge="end" 
                          color="primary"
                          onClick={() => agregarJugador(usuario)}
                        >
                          <AddIcon />
                        </IconButton>
                      </Tooltip>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar src={`${imagenUrlBase}${usuario.imagen}`} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography fontWeight="medium">{usuario.nombre}</Typography>}
                      secondary={usuario.documento}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
        
        {/* Lista de jugadores seleccionados */}
        <Grid item xs={12} md={6} sx={{ width: '48%' }}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Jugadores a Registrar
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {jugadoresSeleccionados.length === 0 ? (
              <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
                Aún no has agregado jugadores
              </Typography>
            ) : (
              <List sx={{ width: '100%' }}>
                {jugadoresSeleccionados.map(jugador => (
                  <ListItem
                    key={jugador.usuario._id}
                    sx={{
                      backgroundColor: 'transparent',
                      borderRadius: 1,
                      mb: 1,
                      width: '100%',
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      p: 2,
                      '&:hover': {
                        backgroundColor: '#4A4A4A',
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
                        <Avatar src={`${imagenUrlBase}${jugador.usuario.imagen}`} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography fontWeight="medium">{jugador.usuario.nombre}</Typography>}
                        secondary={jugador.usuario.documento}
                      />
                    </Box>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      width: { xs: '100%', sm: 'auto' },
                      justifyContent: { xs: 'space-between', sm: 'flex-end' }
                    }}>
                      <TextField
                        label="Número"
                        type="number"
                        value={jugador.numero}
                        onChange={(e) => actualizarNumeroCamiseta(jugador.usuario._id, e.target.value)}
                        size="small"
                        sx={{ width: 120, mr: 2 }}
                        inputProps={{ min: 0, max: 99 }}
                      />
                      <IconButton 
                        color="error"
                        onClick={() => quitarJugador(jugador.usuario._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<SaveIcon />}
                onClick={guardarJugadores}
                disabled={jugadoresSeleccionados.length === 0 || savingData}
                sx={{ px: 4, py: 1 }}
              >
                {savingData ? 'Guardando...' : 'Guardar Jugadores'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Diálogo para mostrar el roster actual */}
      <Dialog
        open={openRosterDialog}
        onClose={handleCloseRoster}
        maxWidth="md"
        fullWidth
        aria-labelledby="roster-dialog-title"
      >
        <DialogTitle id="roster-dialog-title" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Roster Actual: {equipo?.nombre}
          </Typography>
          <IconButton onClick={handleCloseRoster} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {loadingRoster ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress size={40} />
            </Box>
          ) : jugadoresActuales.length === 0 ? (
            <Typography variant="body1" sx={{ textAlign: 'center', py: 2 }}>
              Este equipo aún no tiene jugadores registrados
            </Typography>
          ) : (
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Jugador</TableCell>
                    <TableCell>Documento</TableCell>
                    <TableCell align="center">Número</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {jugadoresActuales.map((jugador) => (
                    <TableRow key={jugador._id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            src={`${imagenUrlBase}${jugador.imagen}`}
                            sx={{ width: 40, height: 40, mr: 2 }}
                          />
                          <Typography>{jugador.nombre}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{jugador.documento}</TableCell>
                      <TableCell align="center">
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 'bold', 
                            bgcolor: 'primary.main', 
                            color: 'white', 
                            width: 36, 
                            height: 36, 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            mx: 'auto'
                          }}
                        >
                          {jugador.numero}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRoster} variant="contained">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};