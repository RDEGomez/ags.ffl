import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Chip, 
  Avatar, 
  Card, 
  CardContent, 
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  TextField,
  CircularProgress,
  ListItem,
  ListItemButton,
  Stack
} from '@mui/material';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EmailIcon from '@mui/icons-material/Email';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import BadgeIcon from '@mui/icons-material/Badge';
import axiosInstance from '../config/axios';
import { getCategoryName } from '../helpers/mappings';

export const Home = () => {
  const { usuario, token } = useAuth();
  const API_URL = import.meta.env.VITE_BACKEND_URL || '';

  const [equipos, setEquipos] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState('');
  const [numeroJugador, setNumeroJugador] = useState('');
  const [cargando, setCargando] = useState(false);

  const imagePath = usuario?.imagen ? `${API_URL}/uploads/${usuario.imagen}` : '';

  useEffect(() => {
    const obtenerEquipos = async () => {
      try {
        const { data } = await axiosInstance.get('/equipos');
        // Filtra equipos donde el usuario ya esté inscrito
        const equiposNoInscritos = data.filter(eq => 
          !eq.jugadores?.some(j => j.usuario === usuario.id || j.usuario === usuario._id)
        );
        setEquipos(equiposNoInscritos);
      } catch (error) {
        console.error('Error al obtener equipos:', error);
      }
    };
    if (usuario) {
      obtenerEquipos();
    }
  }, [usuario, token]);

  const abrirModal = () => {
    setAbierto(true);
  };

  const cerrarModal = () => {
    setAbierto(false);
    setEquipoSeleccionado('');
    setNumeroJugador('');
  };

  const manejarInscripcion = async () => {
    if (!equipoSeleccionado || !numeroJugador) return;

    // Guardamos los datos antes de cerrar
    const datosInscripcion = {
      equipoId: equipoSeleccionado,
      numero: numeroJugador,
      usuarioId: usuario.id || usuario._id
    };

    // Cerramos el modal para evitar que se interponga
    cerrarModal();

    // Esperamos un pequeño delay para asegurar que el modal desaparezca visualmente
    await new Promise((resolve) => setTimeout(resolve, 200));

    const resultado = await Swal.fire({
      title: '¿Deseas inscribirte en este equipo?',
      text: `Número a registrar: ${numeroJugador}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, inscribirme',
    });

    if (resultado.isConfirmed) {
      setCargando(true);
      try {
        await axiosInstance.patch('/usuarios/equipo/', datosInscripcion);

        Swal.fire('¡Inscripción exitosa!', 'Te has inscrito en el equipo.', 'success');
      } catch (error) {
        const mensaje = error.response?.data?.mensaje || 'Error al inscribir al jugador';

        Swal.fire('Error', mensaje, 'error');
      } finally {
        setCargando(false);
      }
    }
  };


  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 } 
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <Box sx={{ width: '100%', p: { xs: 1, md: 3 } }}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ 
            color: 'white',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            mb: 4,
            fontWeight: 'bold'
          }}>
            Dashboard
          </Typography>
        </motion.div>

        {usuario ? (
          <Grid container spacing={3}>
            {/* Tarjeta de perfil */}
            <Grid item xs={12} md={6}>
              <motion.div variants={itemVariants}>
                <Card sx={{ backdropFilter: 'blur(10px)', backgroundColor: 'rgba(43, 43, 45, 0.8)', borderRadius: 2 }}>
                  <Box sx={{ p: 2, backgroundColor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center' }}>
                    <AccountCircleIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">Perfil de Usuario</Typography>
                  </Box>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar
                        src={imagePath}
                        sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}
                      >
                        {(usuario.nombre?.charAt(0) || usuario.email?.charAt(0) || 'U').toUpperCase()}
                      </Avatar>
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="h5" gutterBottom>{usuario.nombre || usuario.email}</Typography>
                        <Chip icon={<VerifiedUserIcon />} label="Autenticado" color="success" size="small" />
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                      <EmailIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="body1"><strong>Email:</strong> {usuario.email}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <BadgeIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="body1"><strong>CURP:</strong> {usuario.documento}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* Acciones rápidas + botón de inscripción */}
            <Grid item xs={12} md={6}>
              <motion.div variants={itemVariants}>
                <Card sx={{ backdropFilter: 'blur(10px)', backgroundColor: 'rgba(43, 43, 45, 0.8)', borderRadius: 2 }}>
                  <Box sx={{ p: 2, backgroundColor: 'secondary.main', color: 'white' }}>
                    <Typography variant="h6">Acciones Rápidas</Typography>
                  </Box>
                  <CardContent>
                    <Grid container spacing={2}>
                      
                      <Grid item xs={6}>
                        <Button 
                          variant="outlined" 
                          fullWidth 
                          component={NavLink}
                          to="/perfil"
                        >
                          Configuración
                        </Button>
                      </Grid>
                      <Grid item xs={12}>
                        <Button 
                          variant="contained" 
                          color="success" 
                          fullWidth 
                          onClick={abrirModal}
                          disabled={equipos.length === 0}
                        >
                          Inscribirme a un Equipo
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        ) : (
          <motion.div variants={itemVariants}>
            <Paper sx={{ p: 3, bgcolor: 'warning.light', borderRadius: 2 }}>
              <Typography>No hay información de usuario disponible.</Typography>
              <Button variant="contained" color="warning" sx={{ mt: 2 }}>Volver a iniciar sesión</Button>
            </Paper>
          </motion.div>
        )}
      </motion.div>

      {/* Modal de inscripción */}
      <Dialog open={abierto} onClose={cerrarModal} fullWidth maxWidth="sm">
        <DialogTitle>Inscribirme a un equipo</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Selecciona un equipo"
            fullWidth
            value={equipoSeleccionado}
            onChange={(e) => setEquipoSeleccionado(e.target.value)}
            sx={{ mt: 2 }}
          >
            {equipos.map((equipo) => (
              <MenuItem key={equipo._id || equipo.id} value={equipo._id || equipo.id}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar
                    src={`${API_URL}/uploads/${equipo.imagen}`}
                    alt={equipo.nombre}
                    sx={{ width: 24, height: 24 }}
                  />
                  <Typography variant="body2">
                    {equipo.nombre} ({getCategoryName(equipo.categoria)})
                  </Typography>
                </Stack>
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Número de camiseta"
            type="number"
            fullWidth
            sx={{ mt: 3 }}
            value={numeroJugador}
            onChange={(e) => setNumeroJugador(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarModal}>Cancelar</Button>
          <Button onClick={manejarInscripcion} variant="contained" color="primary" disabled={cargando}>
            {cargando ? <CircularProgress size={24} /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
