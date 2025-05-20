import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axiosInstance from '../../config/axios'
import {Equipo} from './Equipo'
import Swal from 'sweetalert2'
import { Box, Fab, IconButton } from '@mui/material'
import ViewListIcon from '@mui/icons-material/ViewList'
import ViewModuleIcon from '@mui/icons-material/ViewModule'

// Material UI
import { Typography, Grid, Button } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { ListaEquiposCompacta } from './ListaEquipoCompacta'
import { FiltrosEquipos } from '../../components/FiltrosEquipos'

export const Equipos = () => {
  const [equipos, setEquipos] = useState([])
  const [filtrados, setFiltrados] = useState([]);
  const [vistaLista, setVistaLista] = useState(false)

  const obtenerEquipos = async () => {
    try {
      const { data } = await axiosInstance.get('/equipos')
      setEquipos(data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    obtenerEquipos()
  }, [])

  const eliminarEquipo = (_id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esto!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminarlo!'
    }).then((result) => {
      if (result.isConfirmed) {
        axiosInstance.delete(`/Equipos/${_id}`)
          .then(() => {
            Swal.fire('Eliminado!', 'El Equipo ha sido eliminado.', 'success')
            setEquipos(prev => prev.filter(Equipo => Equipo._id !== _id))
          })
      }
    })
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" component="h1">
          Equipos
        </Typography>
        <FiltrosEquipos equipos={equipos} setFiltrados={setFiltrados} />
      </Box>
      <hr />
      <Fab 
        component={Link}
        to="/equipos/nuevo"
        color="primary"
        aria-label="añadir Equipo"
        sx={{ 
          position: 'fixed',
          bottom: 84,
          right: 24,
          backgroundColor: 'primary.main',
          '&:hover': { backgroundColor: 'primary.dark' },
          zIndex: 1000,
        }}
      >
        <AddIcon />
      </Fab>
      <IconButton onClick={() => setVistaLista(!vistaLista)}>
        {vistaLista ? <ViewModuleIcon /> : <ViewListIcon />}
      </IconButton>

      {vistaLista ? (
        <ListaEquiposCompacta equipos={filtrados} eliminarEquipo={eliminarEquipo} />
      ) : (
        <Grid container spacing={3}>
          {filtrados.map((equipo) => (
            <Grid item xs={12} sm={4} md={3} key={equipo._id}>
              <Equipo equipo={equipo} eliminarEquipo={eliminarEquipo} />
            </Grid>
          ))}
        </Grid>
      )}
    </>
  )
}
