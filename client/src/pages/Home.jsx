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
  Stack,
  IconButton
} from '@mui/material';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EmailIcon from '@mui/icons-material/Email';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import BadgeIcon from '@mui/icons-material/Badge';
import GroupsIcon from '@mui/icons-material/Groups';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import axiosInstance from '../config/axios';
import { getCategoryName } from '../helpers/mappings';
import { useImage } from '../hooks/useImage';

export const Home = () => {
  const { usuario, token } = useAuth();
  const API_URL = import.meta.env.VITE_BACKEND_URL || '';

  const [equipos, setEquipos] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState('');
  const [numeroJugador, setNumeroJugador] = useState('');
  const [cargando, setCargando] = useState(false);

  const imagePath = useImage(usuario?.imagen)

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

  // Estilos consistentes para las tarjetas
  const cardStyle = {
    backdropFilter: 'blur(10px)', 
    backgroundColor: 'rgba(0, 0, 0, 0.7)', 
    borderRadius: 3,
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 12px 20px rgba(0, 0, 0, 0.2)'
    }
  };

  const headerStyle = {
    p: 2, 
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'white', 
    display: 'flex', 
    alignItems: 'center',
    justifyContent: 'space-between'
  };

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
        <motion.div variants={itemVariants}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ 
            color: 'white',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            mb: 5,
            fontWeight: 'bold',
            borderLeft: '4px solid #3f51b5',
            pl: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            Dashboard
            <Chip 
              label={usuario?.nombre ? `Bienvenido, ${usuario.nombre.split(' ')[0]}` : 'Bienvenido'} 
              color="primary" 
              size="small" 
              sx={{ ml: 2, fontWeight: 'medium' }}
            />
          </Typography>
        </motion.div>

        {usuario ? (
          <Grid container spacing={4}>
            {/* Tarjeta de perfil */}
            <Grid item xs={12} md={6}>
              <motion.div variants={itemVariants}>
                <Card sx={cardStyle}>
                  <Box sx={headerStyle}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccountCircleIcon sx={{ mr: 1, color: '#64b5f6' }} />
                      <Typography variant="h6">Perfil de Usuario</Typography>
                    </Box>
                    <Chip 
                      icon={<VerifiedUserIcon />} 
                      label="Verificado" 
                      color="success" 
                      variant="outlined" 
                      size="small" 
                    />
                  </Box>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 3,
                      p: 2,
                      borderRadius: 2,
                      background: 'linear-gradient(145deg, rgba(25,118,210,0.1) 0%, rgba(25,118,210,0.05) 100%)'
                    }}>
                      <Avatar
                        src={imagePath}
                        sx={{ 
                          width: 80, 
                          height: 80, 
                          bgcolor: 'primary.main',
                          border: '3px solid rgba(255,255,255,0.2)',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                        }}
                      >
                        {(usuario.nombre?.charAt(0) || usuario.email?.charAt(0) || 'U').toUpperCase()}
                      </Avatar>
                      <Box sx={{ ml: 3 }}>
                        <Typography variant="h5" gutterBottom sx={{ color: 'white', fontWeight: 'medium' }}>
                          {usuario.nombre || usuario.email}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 3, opacity: 0.2 }} />

                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: 2
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)' }}>
                        <EmailIcon sx={{ mr: 2, color: '#64b5f6' }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">Email</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{usuario.email}</Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)' }}>
                        <BadgeIcon sx={{ mr: 2, color: '#64b5f6' }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">CURP</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{usuario.documento}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* Acciones rápidas + botón de inscripción */}
            <Grid item xs={12} md={6}>
              <motion.div variants={itemVariants}>
                <Card sx={cardStyle}>
                  <Box sx={headerStyle}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <GroupsIcon sx={{ mr: 1, color: '#64b5f6' }} />
                      <Typography variant="h6">Acciones Rápidas</Typography>
                    </Box>
                    <Chip 
                      label={`${equipos.length} equipos disponibles`} 
                      color="primary" 
                      variant="outlined" 
                      size="small" 
                    />
                  </Box>
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <Button 
                          variant="contained" 
                          color="primary" 
                          fullWidth 
                          size="large"
                          startIcon={<PersonAddIcon />}
                          onClick={abrirModal}
                          disabled={equipos.length === 0}
                          sx={{
                            py: 2,
                            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                            borderRadius: 2,
                            mb: 2,
                            fontWeight: 'bold'
                          }}
                        >
                          Inscribirme a un Equipo
                        </Button>
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 1, mb: 3 }}>
                          {equipos.length > 0 
                            ? `Tienes ${equipos.length} equipos disponibles para inscribirse` 
                            : 'No hay equipos disponibles para inscripción'}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Button 
                          variant="outlined" 
                          fullWidth 
                          component={NavLink}
                          to="/perfil"
                          startIcon={<SettingsIcon />}
                          sx={{
                            py: 1.5,
                            borderRadius: 2,
                            borderWidth: 2,
                            '&:hover': {
                              borderWidth: 2,
                              backgroundColor: 'rgba(255,255,255,0.05)'
                            }
                          }}
                        >
                          Perfil
                        </Button>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Button 
                          variant="outlined" 
                          color="secondary"
                          fullWidth 
                          component={NavLink}
                          to="/calendario"
                          startIcon={<CalendarIcon />}
                          sx={{
                            py: 1.5,
                            borderRadius: 2,
                            borderWidth: 2,
                            '&:hover': {
                              borderWidth: 2,
                              backgroundColor: 'rgba(255,255,255,0.05)'
                            }
                          }}
                        >
                          Calendario
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
            <Paper sx={{ 
              p: 4, 
              bgcolor: 'rgba(0, 0, 0, 0.7)', 
              backdropFilter: 'blur(10px)',
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Typography color="error">No hay información de usuario disponible.</Typography>
              <Button 
                variant="contained" 
                color="primary" 
                sx={{ 
                  mt: 2,
                  background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                  boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)'
                }}
              >
                Volver a iniciar sesión
              </Button>
            </Paper>
          </motion.div>
        )}
      </motion.div>

      {/* Modal de inscripción */}
      <Dialog 
        open={abierto} 
        onClose={cerrarModal} 
        fullWidth 
        maxWidth="sm"
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
          alignItems: 'center',
          gap: 1
        }}>
          <PersonAddIcon sx={{ color: '#64b5f6' }} />
          Inscribirme a un equipo
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            select
            label="Selecciona un equipo"
            fullWidth
            value={equipoSeleccionado}
            onChange={(e) => setEquipoSeleccionado(e.target.value)}
            sx={{ 
              mt: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          >
            {equipos.map((equipo) => (
              <MenuItem key={equipo._id || equipo.id} value={equipo._id || equipo.id}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar
                    src={`${API_URL}/uploads/${equipo.imagen}`}
                    alt={equipo.nombre}
                    sx={{ width: 30, height: 30 }}
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
            sx={{ 
              mt: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
            value={numeroJugador}
            onChange={(e) => setNumeroJugador(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
          <Button 
            onClick={cerrarModal}
            variant="outlined"
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={manejarInscripcion} 
            variant="contained" 
            color="primary" 
            disabled={cargando}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            }}
          >
            {cargando ? <CircularProgress size={24} /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Icono de calendario para el botón de calendario
const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);