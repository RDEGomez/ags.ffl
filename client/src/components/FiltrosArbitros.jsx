// 📁 client/src/components/FiltrosArbitros.jsx

import { useEffect, useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box
} from '@mui/material';
import { 
  NIVELES_CERTIFICACION,
  ESTADOS_ARBITRO,
  ESPECIALIDADES
} from '../helpers/arbitroMappings';

export const FiltrosArbitros = ({ arbitros, setFiltrados }) => {
  const [estado, setEstado] = useState('');
  const [nivelCertificacion, setNivelCertificacion] = useState('');
  const [especialidad, setEspecialidad] = useState('');

  useEffect(() => {
    let filtrados = arbitros;

    if (estado) {
      filtrados = filtrados.filter(a => a.estado === estado);
    }

    if (nivelCertificacion) {
      filtrados = filtrados.filter(a => a.nivelCertificacion === nivelCertificacion);
    }

    if (especialidad) {
      filtrados = filtrados.filter(a => 
        a.especialidades && a.especialidades.includes(especialidad)
      );
    }

    setFiltrados(filtrados);
  }, [estado, nivelCertificacion, especialidad, arbitros, setFiltrados]);

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Estado</InputLabel>
        <Select
          value={estado}
          label="Estado"
          onChange={e => setEstado(e.target.value)}
        >
          <MenuItem value="">Todos</MenuItem>
          {ESTADOS_ARBITRO.map(e => (
            <MenuItem key={e.value} value={e.value}>
              {e.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>Nivel</InputLabel>
        <Select
          value={nivelCertificacion}
          label="Nivel"
          onChange={e => setNivelCertificacion(e.target.value)}
        >
          <MenuItem value="">Todos</MenuItem>
          {NIVELES_CERTIFICACION.map(n => (
            <MenuItem key={n.value} value={n.value}>
              {n.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Especialidad</InputLabel>
        <Select
          value={especialidad}
          label="Especialidad"
          onChange={e => setEspecialidad(e.target.value)}
        >
          <MenuItem value="">Todas</MenuItem>
          {ESPECIALIDADES.map(esp => (
            <MenuItem key={esp.value} value={esp.value}>
              {esp.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};