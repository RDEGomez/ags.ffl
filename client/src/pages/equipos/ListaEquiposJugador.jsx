import { Avatar, Box, Button, CardMedia, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, List, ListItem, ListItemAvatar, ListItemText, TextField, Typography } from "@mui/material"
import SportsIcon from '@mui/icons-material/Sports';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getCategoryName } from "../../helpers/mappings";
import { useState } from "react";
import axiosInstance from "../../config/axios";
import Swal from "sweetalert2";


export const ListaEquiposJugador = ({ jugadorId = "", equipos = [], setEquipos = () => {} }) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEquipo, setSelectedEquipo] = useState(null);
  const [nuevoNumero, setNuevoNumero] = useState('');

  // Abrir diálogo para editar número
  const handleEditNumero = (equipo) => {
    setSelectedEquipo(equipo);
    setNuevoNumero(equipo.numero || '');
    setEditDialogOpen(true);
  };

  // Guardar nuevo número
  const handleGuardarNumero = async () => {
    try {
      await axiosInstance.patch(
        `/equipos/${selectedEquipo.equipo._id}/jugadores/${jugadorId}`, 
        { numero: nuevoNumero }
      );
      
      // Actualizar el estado local
      setEquipos(equipos.map(e => 
        e.equipo._id === selectedEquipo.equipo._id 
          ? { ...e, numero: nuevoNumero } 
          : e
      ));
      
      setEditDialogOpen(false);
      
      Swal.fire({
        icon: 'success',
        title: 'Número actualizado',
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.mensaje || 'No se pudo actualizar el número',
      });
    }
  };

  // Abrir diálogo para confirmar eliminación
  const handleConfirmDelete = (equipo) => {
    setSelectedEquipo(equipo);
    setDeleteDialogOpen(true);
  };

  // Eliminar jugador de un equipo
  const handleRemoveFromTeam = async () => {
    try {
      await axiosInstance.delete(`/equipos/${selectedEquipo.equipo._id}/jugadores/${jugadorId}`);
      
      // Eliminar el equipo de la lista local
      setEquipos(equipos.filter(e => e.equipo._id !== selectedEquipo.equipo._id));
      
      setDeleteDialogOpen(false);
      
      Swal.fire({
        icon: 'success',
        title: 'Jugador eliminado del equipo',
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar el jugador del equipo',
      });
    }
  };

  return (
    <>
      {equipos.length === 0 ? (
        <Typography variant="body2" color="textSecondary" sx={{ p: 2 }}>
          Este jugador no está registrado en ningún equipo
        </Typography>
      ) : (
        <>
          <List>
            {equipos.map((equipoItem) => (
              <ListItem 
                key={equipoItem.equipo._id}
                divider
                sx={{ 
                  mb: 1, 
                  border: '1px solid rgba(0, 0, 0, 0.12)', 
                  borderRadius: 1 
                }}
              >
                <ListItemAvatar>
                  <Avatar>
                    {equipoItem.equipo?.imagen ? (
                      <CardMedia
                        component="img"
                        src={`${import.meta.env.VITE_BACKEND_URL}/uploads/${equipoItem.equipo.imagen}`}
                        alt={equipoItem.equipo.nombre}
                      />
                    ) : (
                      <SportsIcon />
                    )}
                  </Avatar>
                </ListItemAvatar>
                
                <ListItemText
                  primary={equipoItem.equipo?.nombre || 'Equipo'}
                  secondary={
                    <>
                      <Typography component="span" variant="body2">
                        {equipoItem.equipo?.categoria && 
                          `Categoría: ${getCategoryName(equipoItem.equipo.categoria)}`}
                      </Typography>
                      <br />
                      <Typography component="span" variant="body2">
                        Número: {equipoItem.numero || 'No asignado'}
                      </Typography>
                    </>
                  }
                />
                
                <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                  <IconButton 
                    edge="end" 
                    aria-label="edit"
                    onClick={() => handleEditNumero(equipoItem)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    edge="end" 
                    aria-label="delete"
                    onClick={() => handleConfirmDelete(equipoItem)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </ListItem>
            ))}
          </List>
          {/* Diálogo para editar número */}
          <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
            <DialogTitle>Editar número</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Actualizar el número del jugador para el equipo {selectedEquipo?.equipo?.nombre || ''}
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                label="Número"
                type="number"
                fullWidth
                value={nuevoNumero}
                onChange={(e) => setNuevoNumero(e.target.value)}
                inputProps={{ min: 0, max: 999 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleGuardarNumero} color="primary">Guardar</Button>
            </DialogActions>
          </Dialog>
          
          {/* Diálogo para confirmar eliminación */}
          <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogContent>
              <DialogContentText>
                ¿Estás seguro de que deseas eliminar a este jugador del equipo {selectedEquipo?.equipo?.nombre || ''}?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleRemoveFromTeam} color="error">Eliminar</Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </>
  )
}