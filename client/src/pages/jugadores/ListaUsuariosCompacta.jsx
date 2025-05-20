import { useState } from 'react'
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Collapse,
  Divider,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tooltip
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { Link } from 'react-router-dom'
import { getCategoryName } from '../../helpers/mappings'

export const ListaUsuariosCompacta = ({ usuarios, eliminarUsuario }) => {
  const [expandedJugadorId, setExpandedJugadorId] = useState(null)
  const imagenUrlBase = import.meta.env.VITE_BACKEND_URL + '/uploads/'

  const toggleExpand = (id) => {
    setExpandedJugadorId(prev => prev === id ? null : id)
  }

  return (
    <List>
      {usuarios.map(jugador => {
        const { _id, nombre, documento, imagen, equipos = [] } = jugador
        const isExpanded = expandedJugadorId === _id

        console.log(equipos);

        return (
          <Box key={_id}
            sx={{
              backgroundColor: '#222',
              borderRadius: 2,
            }}
          >
            <ListItem
              sx={{
                py: 1.5,
                px: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.04)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ListItemAvatar>
                  <Avatar src={`${imagenUrlBase}${imagen}`} />
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography fontWeight="bold">{nombre}</Typography>}
                  secondary={documento}
                />
              </Box>

              <Box>
                <Tooltip title={isExpanded ? "Ocultar equipos" : "Ver equipos"}>
                  <IconButton onClick={() => toggleExpand(_id)}>
                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Tooltip>
                <IconButton component={Link} to={`/usuario/editar/${_id}`} color="primary">
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => eliminarUsuario(_id)} color="error">
                  <DeleteIcon />
                </IconButton>
              </Box>
            </ListItem>

            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box sx={{ pl: 8, pr: 2, pb: 1, pt: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Equipos:
                </Typography>

                {equipos.length > 0 ? (
                  equipos.map(equipoObj => (
                    <Grid
                      container
                      key={equipoObj.equipo._id}
                      spacing={1}
                      alignItems="center"
                      sx={{ mb: 1 }}
                    >
                      <Grid item>
                        <Avatar
                          src={`${imagenUrlBase}${equipoObj.equipo.imagen}`}
                          sx={{ width: 28, height: 28 }}
                        />
                      </Grid>
                      <Grid item>
                        <Typography variant="body2">
                          {equipoObj.equipo.nombre} <span style={{ color: '#aaa' }}>(#{equipoObj.numero})</span>
                        </Typography>
                      </Grid>
                      <Grid item>
                        <Chip
                          label={getCategoryName(equipoObj.equipo.categoria)}
                          size="small"
                          color="secondary"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </Grid>
                    </Grid>
                  ))
                ) : (
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    No está en ningún equipo
                  </Typography>
                )}
              </Box>
              <Divider />
            </Collapse>
          </Box>
        )
      })}
    </List>
  )
}
