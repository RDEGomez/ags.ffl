import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  InputAdornment,
  Divider,
  Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import SearchIcon from '@mui/icons-material/Search';
import axiosInstance from '../../config/axios';

export const AsignarJugadoresAEquipo = ({ equipoSeleccionado }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [usuariosAsignados, setUsuariosAsignados] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const { data } = await axiosInstance.get('/usuarios');
        const yaAsignados = new Set(
          data
            .filter((u) => u.equipos.some((e) => e.equipo === equipoSeleccionado._id))
            .map((u) => u._id)
        );
        const disponibles = data.filter((u) => !yaAsignados.has(u._id));
        setUsuarios(disponibles);
        setUsuariosFiltrados(disponibles);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
      }
    };
    if (equipoSeleccionado) fetchUsuarios();
  }, [equipoSeleccionado]);

  const handleBuscar = (e) => {
    const texto = e.target.value;
    setBusqueda(texto);
    const filtrados = usuarios.filter((u) =>
      `${u.nombre} ${u.apellidos || ''}`.toLowerCase().includes(texto.toLowerCase())
    );
    setUsuariosFiltrados(filtrados);
  };

  const agregarUsuario = (usuario) => {
    setUsuariosAsignados([...usuariosAsignados, { ...usuario, numero: '' }]);
    setUsuarios((prev) => prev.filter((u) => u._id !== usuario._id));
    setUsuariosFiltrados((prev) => prev.filter((u) => u._id !== usuario._id));
  };

  const quitarUsuario = (usuarioId) => {
    const usuario = usuariosAsignados.find((u) => u._id === usuarioId);
    if (usuario) {
      setUsuarios((prev) => [...prev, usuario]);
      setUsuariosFiltrados((prev) => [...prev, usuario]);
      setUsuariosAsignados((prev) => prev.filter((u) => u._id !== usuarioId));
    }
  };

  const cambiarNumero = (usuarioId, nuevoNumero) => {
    setUsuariosAsignados((prev) =>
      prev.map((u) => (u._id === usuarioId ? { ...u, numero: nuevoNumero } : u))
    );
  };

  const guardarAsignaciones = async () => {
    try {
      const payload = usuariosAsignados.map((usuario) => ({
        usuarioId: usuario._id,
        equipoId: equipoSeleccionado._id,
        numero: usuario.numero
      }));
      console.log('Payload para guardar:', payload);
      // TODO: PATCH masivo cuando esté disponible
    } catch (error) {
      console.error('Error al guardar asignaciones:', error);
    }
  };

  return (
    <Grid container spacing={2}>
      {/* Card con info del equipo */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6">Equipo seleccionado</Typography>
            <Typography><strong>Nombre:</strong> {equipoSeleccionado.nombre}</Typography>
            <Typography><strong>Categoría:</strong> {equipoSeleccionado.categoria}</Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Paneles en columnas */}
      <Grid item xs={12} md={6}>
        <Card sx={{ height: 400, display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flex: 1, overflow: 'auto' }}>
            <Typography variant="subtitle1" gutterBottom>Usuarios disponibles</Typography>
            <TextField
              fullWidth
              placeholder="Buscar por nombre"
              value={busqueda}
              onChange={handleBuscar}
              size="small"
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
            <List dense>
              {usuariosFiltrados.map((usuario) => (
                <ListItem
                  key={usuario._id}
                  secondaryAction={
                    <IconButton
                      onClick={() => agregarUsuario(usuario)}
                      sx={{
                        bgcolor: 'primary.light',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.main' }
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                  }
                >
                  <ListItemText primary={usuario.nombre} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={{ height: 400, display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flex: 1, overflow: 'auto' }}>
            <Typography variant="subtitle1" gutterBottom>Usuarios asignados</Typography>
            <List dense>
              {usuariosAsignados.map((usuario) => (
                <ListItem
                  key={usuario._id}
                  secondaryAction={
                    <IconButton
                      onClick={() => quitarUsuario(usuario._id)}
                      sx={{
                        bgcolor: 'error.light',
                        color: 'white',
                        '&:hover': { bgcolor: 'error.main' }
                      }}
                    >
                      <RemoveIcon />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={usuario.nombre}
                    secondary={
                      <TextField
                        type="number"
                        label="Número"
                        size="small"
                        value={usuario.numero}
                        onChange={(e) =>
                          cambiarNumero(usuario._id, e.target.value)
                        }
                        sx={{ mt: 1, width: 100 }}
                      />
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Botón guardar */}
      <Grid item xs={12}>
        <Box textAlign="right">
          <Button
            variant="contained"
            color="success"
            onClick={guardarAsignaciones}
            disabled={usuariosAsignados.length === 0}
          >
            Guardar asignaciones
          </Button>
        </Box>
      </Grid>
    </Grid>
  );
};
