import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Card,
  CardContent,
  Typography,
  CardActions,
  IconButton,
  CardMedia,
  Box,
  Collapse,
  Divider,
  Grid,
  Avatar,
  Chip,
  Button
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import { getCategoryName } from '../../helpers/mappings'

export const UsuarioCard = ({ usuario, eliminarUsuario }) => {
  const [expanded, setExpanded] = useState(false)
  const { _id, nombre, documento, imagen, equipos = [], rol } = usuario
  const imagenUrl = `${import.meta.env.VITE_BACKEND_URL}/uploads/`

  const handleExpandClick = () => {
    setExpanded(!expanded)
  }

  return (
    <Card
      variant="outlined"
      sx={{
        height: 'auto',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        boxShadow: 2,
        width: '100%',
        maxWidth: '100%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          minHeight: 160,
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Imagen */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 2,
            flexShrink: 0,
            width: { xs: 120, sm: 140 },
          }}
        >
          <CardMedia
            component="img"
            image={`${imagenUrl}${imagen}`}
            alt={`Foto de ${nombre}`}
            sx={{
              width: { xs: 100, sm: 120 },
              height: { xs: 100, sm: 120 },
              objectFit: 'contain',
              backgroundColor: 'background.paper',
              borderRadius: '50%',
              overflow: 'hidden',
              padding: 1,
              boxShadow: '0 3px 5px rgba(0, 0, 0, 0.2)',
            }}
          />
        </Box>

        {/* Contenido */}
        <Box
          sx={{
            flex: '1 1 0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            p: 2,
            textAlign: 'center',
            overflow: 'hidden',
            width: 0,
          }}
        >
          <Typography
            variant="h6"
            noWrap
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
              maxWidth: '100%',
              display: 'block',
            }}
          >
            {nombre}
          </Typography>

          <Typography
            variant="body2"
            noWrap
            mt={1}
            mb={2}
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
              maxWidth: '100%',
              display: 'block',
            }}
          >
            {documento}
          </Typography>

          <Box>
            <IconButton
              component={Link}
              to={`/perfil/${_id}`}
              color="primary"
            >
              <EditIcon />
            </IconButton>
            <IconButton color="error" onClick={() => eliminarUsuario(_id)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {(rol === 'jugador' || rol === 'capitan') && (
        <>
          <Button
            onClick={handleExpandClick}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              py: 1,
              borderTop: '1px solid rgba(0, 0, 0, 0.12)',
            }}
          >
            <Typography variant="button" color="primary">
              {expanded ? 'Ocultar equipos' : 'Ver equipos'}
            </Typography>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Button>

          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Divider />
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Equipos del Jugador
              </Typography>

              {equipos && equipos.length > 0 ? (
                <Box sx={{ overflowY: 'auto', maxHeight: 200 }}>
                  {equipos.map((equipoObj) => (
                    <Grid
                      container
                      key={equipoObj.equipo._id || equipoObj.equipo.id}
                      alignItems="center"
                      spacing={1}
                      justifyContent={'space-between'}
                      sx={(theme) => ({
                        mb: 1,
                        px: 1,
                        py: 0.5,
                        '&:hover': { backgroundColor: theme.palette.primary.main },
                      })}
                    >
                      <Grid item xs={2}>
                        <Avatar
                          src={`${imagenUrl}${equipoObj.equipo.imagen}`}
                          alt={`Logo de ${equipoObj.equipo.nombre}`}
                          variant="circular"
                          sx={{ width: 30, height: 30 }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          {equipoObj.equipo.nombre}
                          <Typography component="span" variant="body2" color="text.secondary">
                            {` (#${equipoObj.numero})`}
                          </Typography>
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Chip
                          label={getCategoryName(equipoObj.equipo.categoria)}
                          size="small"
                          color="secondary"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </Grid>
                    </Grid>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Este jugador no está inscrito en ningún equipo.
                </Typography>
              )}
            </Box>
          </Collapse>
        </>
      )}
    </Card>
  )
}
