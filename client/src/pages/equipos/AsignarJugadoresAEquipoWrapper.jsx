import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { CircularProgress, Container, Typography } from '@mui/material';
import axiosInstance from '../../config/axios';
import { AsignarJugadoresAEquipo } from './AsignarJugadoresAEquipo';

const AsignarJugadoresAEquipoWrapper = () => {
  const { id } = useParams();
  const location = useLocation();
  const equipoDesdeState = location.state?.equipo;

  const [equipo, setEquipo] = useState(equipoDesdeState || null);
  const [cargando, setCargando] = useState(!equipoDesdeState);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarEquipo = async () => {
      if (equipoDesdeState) return; // Ya lo tenemos, no hace falta cargarlo

      try {
        const { data } = await axiosInstance.get(`/equipos/${id}`);
        setEquipo(data);
      } catch (err) {
        setError('No se pudo cargar el equipo');
      } finally {
        setCargando(false);
      }
    };

    cargarEquipo();
  }, [id, equipoDesdeState]);

  if (cargando) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" mt={2}>Cargando equipo...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography variant="h6" color="error">{error}</Typography>
      </Container>
    );
  }

  return <AsignarJugadoresAEquipo equipoSeleccionado={equipo} />;
};

export default AsignarJugadoresAEquipoWrapper;
