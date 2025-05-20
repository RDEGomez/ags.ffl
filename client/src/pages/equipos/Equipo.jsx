import { Link } from 'react-router-dom'
import {
  Card,
  CardContent,
  Typography,
  CardActions,
  IconButton,
  CardMedia,
  Box,
  Tooltip
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import { getCategoryName } from '../../helpers/mappings'
import { useAuth } from '../../context/AuthContext'

export const Equipo = ({ equipo, eliminarEquipo }) => {
  const { _id, nombre, categoria, imagen } = equipo
  const imagenUrl = `${import.meta.env.VITE_BACKEND_URL}/uploads/${imagen}`
  const { tieneRol } = useAuth()
  const isAdmin = tieneRol('capitan')

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        borderRadius: 2,
        boxShadow: 2,
        minHeight: 160,
      }}
    >
      {/* Imagen */}
      <CardMedia
        component="img"
        image={imagenUrl}
        alt={`Logo de ${nombre}`}
        sx={{
          width: { xs: 140, sm: 150 },
          height: { xs: 140, sm: 150 }, 
          objectFit: 'contain', 
          paddingTop: { xs: 3, sm: 2}, 
          paddingLeft: 4,
          backgroundColor: 'background.paper',
          borderRadius: '8px 0 0 8px'
        }}
      />

      {/* Contenido centrado */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 2,
          textAlign: 'center'
        }}
      >
        <Typography variant="h6">{nombre}</Typography>
        <Typography variant="body2" mt={1} mb={2}>
          {getCategoryName(categoria)}
        </Typography>
          <Box>
            <IconButton
              component={Link}
              to={`/Equipos/editar/${_id}`}
              color="primary"
            >
              <EditIcon />
            </IconButton>
            <IconButton color="error" onClick={() => eliminarEquipo(_id)}>
              <DeleteIcon />
            </IconButton>
            <Tooltip title="Agregar jugadores">
              <IconButton
                component={Link}
                to={`/equipos/${_id}/jugadores`}
                state={{ equipo }}
                color="success"
              >
                <PersonAddIcon />
              </IconButton>
            </Tooltip>
          </Box>
      </Box>
    </Card>
  )
}
