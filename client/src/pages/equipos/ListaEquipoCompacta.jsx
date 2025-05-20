import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { Link } from 'react-router-dom';
import { getCategoryName } from '../../helpers/mappings';

export const ListaEquiposCompacta = ({ equipos, eliminarEquipo }) => {
  return (
    <Box component="ul" sx={{ 
      listStyle: 'none', 
      padding: 0, 
      backgroundColor: '#222', 
      borderRadius: 2,
      paddingTop: 2,
      paddingLeft: 2,
      paddingRight: 2,
      paddingBottom: 2
    }}>
      {equipos.map((equipo) => (
        <Box
          key={equipo._id}
          component="li"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #444',
            paddingY: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              component="img"
              src={`${import.meta.env.VITE_BACKEND_URL}/uploads/${equipo.imagen}`}
              alt={`Logo de ${equipo.nombre}`}
              sx={{ width: 40, height: 40, objectFit: 'contain' }}
            />
            <Typography variant="body1">{equipo.nombre}</Typography>
            <Typography variant="caption" sx={{ color: 'gray' }}>
              {getCategoryName(equipo.categoria)}
            </Typography>
          </Box>
          <Box>
            <IconButton component={Link} to={`/Equipos/editar/${equipo._id}`} color="primary">
              <EditIcon />
            </IconButton>
            <IconButton color="error" onClick={() => eliminarEquipo(equipo._id)}>
              <DeleteIcon />
            </IconButton>
            <Tooltip title="Agregar jugadores">
              <IconButton component={Link} to={`/equipos/${equipo._id}/jugadores`} color="success">
                <PersonAddIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      ))}
    </Box>
  );
};