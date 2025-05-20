import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import axiosInstance from '../../config/axios';
import { UsuarioCard } from './UsuarioCard'; // este reemplaza a Jugador
import { FiltrosJugadores } from '../../components/FiltrosJugadores'; // Renómbralo después si quieres
import { useAuth } from '../../context/AuthContext';

import {
  Box,
  IconButton,
  Typography
} from '@mui/material';

import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { ListaUsuariosCompacta } from './ListaUsuariosCompacta';

export const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [vistaCompacta, setVistaCompacta] = useState(false);
  const { usuario, logout } = useAuth();

  const obtenerUsuarios = async () => {
    try {
      const { data } = await axiosInstance.get('/usuarios');
      setUsuarios(data);
      setFiltrados(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    obtenerUsuarios();
  }, []);

  const eliminarUsuario = (_id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esto!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminarlo!'
    }).then((result) => {
      if (result.isConfirmed) {
        axiosInstance.delete(`/usuarios/${_id}`)
          .then(() => {
            Swal.fire('Eliminado!', 'El usuario ha sido eliminado.', 'success');

            const actualizados = usuarios.filter(user => user._id !== _id);
            setUsuarios(actualizados);
            setFiltrados(actualizados);

            // Si el usuario eliminado es el que está loggeado, hacer logout
            if (_id === usuario._id) {
              logout();
            }
          });
      }
    });
  };


  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" component="h1">
          Usuarios
        </Typography>
        <FiltrosJugadores jugadores={usuarios} setFiltrados={setFiltrados} /> {/* A futuro podrías renombrarlo */}
      </Box>

      <hr />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={() => setVistaCompacta(!vistaCompacta)}>
          {vistaCompacta ? <ViewModuleIcon /> : <ViewListIcon />}
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          Mostrando {filtrados.length} usuarios
        </Typography>
      </Box>

      {vistaCompacta
      ? <ListaUsuariosCompacta usuarios={filtrados} eliminarUsuario={eliminarUsuario} />
      : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)'
            },
            gap: 3
          }}
        >
          {filtrados.map(usuario => (
            <Box key={usuario._id} sx={{ width: '100%' }}>
              <UsuarioCard usuario={usuario} eliminarUsuario={eliminarUsuario} />
            </Box>
          ))}
        </Box>
      )}
    </>
  );
};
