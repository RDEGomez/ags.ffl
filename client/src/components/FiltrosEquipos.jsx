import { useEffect, useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box
} from '@mui/material';

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

export const FiltrosEquipos = ({ equipos, setFiltrados }) => {
  const [categoria, setCategoria] = useState('');

  useEffect(() => {
    let filtrados = equipos;

    if (categoria) {
      filtrados = filtrados.filter(e =>
        e.categoria === categoria
      );
    }

    setFiltrados(filtrados);
  }, [equipos, categoria]);

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Categoría</InputLabel>
        <Select
          value={categoria}
          label="Categoría"
          onChange={e => {
            setCategoria(e.target.value);
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
    </Box>
  );
};
