import { Box, Grid, Typography, Avatar, Chip } from '@mui/material'

const categorias = {
  'mixgold': 'Mixto Golden',
  'mixsilv': 'Mixto Silver',
  'vargold': 'Varonil Golden',
  'varsilv': 'Varonil Silver',
  'femgold': 'Femenil Golden',
  'femsilv': 'Femenil Silver',
  'varmast': 'Varonil Master',
  'femmast': 'Femenil Master'
}

const getCategoriaLabel = (value) => categorias[value] || value

export const ListaEquipos = ({ equipos = [] }) => {
  if (equipos.length === 0) {
    return <Typography>No hay equipos registrados</Typography>
  }

  const imagenUrl = `${import.meta.env.VITE_BACKEND_URL}/uploads/`

  return (
    <Box sx={{ overflowY: 'auto', maxHeight: 500 }}>
      {equipos.map((equipo) => (
        <Grid
          container
          key={equipo.id || equipo._id}
          alignItems="center"
          spacing={2}
          justifyContent="space-between"
          sx={{ mb: 1, px: 1, py: 0.5, '&:hover': { backgroundColor: '#f5f5f5' } }}
        >
          <Grid item xs={2} sx={{ flexFlow: 1}}>
            <Avatar
              src={`${imagenUrl}${equipo.imagen}`}
              alt={`Logo de ${equipo.nombre}`}
              variant="square"
              sx={{ width: 20, height: 20 }}
            />
          </Grid>
          <Grid item xs={6} sx={{ flexGrow: 5 }}>
            <Typography variant="body1">{equipo.nombre}</Typography>
          </Grid>
          <Grid item xs={4} sx={{ flexGrow: 1 }}>
            <Chip
              label={getCategoriaLabel(equipo.categoria)}
              size="small"
              color="primary"
              sx={{ color: 'white', fontWeight: 'bolder' }}
            />
          </Grid>
        </Grid>
      ))}
    </Box>
  )
}
