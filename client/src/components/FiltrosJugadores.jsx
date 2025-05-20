import { useEffect, useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box
} from '@mui/material';
import axiosInstance from '../config/axios';
import { getCategoryName } from '../helpers/mappings';

const categorias = [
  { value: 'mixgold', label: 'Mixto Golden' },
  { value: 'mixsilv', label: 'Mixto Silver' },
  { value: 'vargold', label: 'Varonil Golden' },
  { value: 'varsilv', label: 'Varonil Silver' },
  { value: 'femgold', label: 'Femenil Golden' },
  { value: 'femsilv', label: 'Femenil Silver' },
  { value: 'varmast', label: 'Varonil Master' },
  { value: 'femmast', label: 'Femenil Master' }
];

export const FiltrosJugadores = ({ jugadores, setFiltrados }) => {
  const [equipoId, setEquipoId] = useState('');
  const [categoria, setCategoria] = useState('');
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);

  useEffect(() => {
    axiosInstance.get('/equipos')
      .then(res => setEquiposDisponibles(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    let filtrados = jugadores;

    if (equipoId) {
      filtrados = filtrados.filter(j =>
        j.equipos.some(e => e.equipo._id === equipoId)
      );
    }

    if (categoria) {
      filtrados = filtrados.filter(j =>
        j.equipos.some(e => e.equipo.categoria === categoria)
      );
    }

    setFiltrados(filtrados);
  }, [equipoId, categoria, jugadores]);

  const equiposFiltrados = categoria
    ? equiposDisponibles.filter(e => e.categoria === categoria)
    : equiposDisponibles;

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Categoría</InputLabel>
        <Select
          value={categoria}
          label="Categoría"
          onChange={e => {
            setCategoria(e.target.value);
            setEquipoId('');
          }}
        >
          <MenuItem value="">Todas</MenuItem>
          {categorias.map(c => (
            <MenuItem key={c.value} value={c.value}>
              {c.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl
        size="small"
        sx={{ minWidth: 200 }}
        disabled={categoria && equiposFiltrados.length === 0}
      >
        <InputLabel>Equipo</InputLabel>
        <Select
          value={equipoId}
          label="Equipo"
          onChange={e => setEquipoId(e.target.value)}
        >
          <MenuItem value="">Todos</MenuItem>
          {equiposFiltrados.map(e => (
            <MenuItem key={e._id} value={e._id}>
              {`${e.nombre} (${getCategoryName(e.categoria)})`}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};
