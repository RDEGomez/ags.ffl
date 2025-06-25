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
  { value: 'femmast', label: 'Femenil Master' },
  { value: 'tocho7v7', label: 'Tocho 7v7' },
  { value: 'U-8', label: 'U-8' },
  { value: 'U-10', label: 'U-10' },
  { value: 'U-12', label: 'U-12' },
  { value: 'U-14', label: 'U-14' },
  { value: 'U-16', label: 'U-16' },
  { value: 'U-18', label: 'U-18' }
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
