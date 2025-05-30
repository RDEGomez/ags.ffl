import { Avatar, Box, Button, CardMedia, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, List, ListItem, ListItemAvatar, ListItemText, TextField, Typography } from "@mui/material"
import SportsIcon from '@mui/icons-material/Sports';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getCategoryName } from "../../helpers/mappings";
import { useState } from "react";
import axiosInstance from "../../config/axios";
import Swal from "sweetalert2";
import { useImage } from '../../hooks/useImage'; // 🔥 Importar el hook

// 🔥 Componente para mostrar un equipo individual del jugador
const EquipoJugadorItem = ({ equipoItem, jugadorId, onActualizar, onEliminar }) => {
  const equipoImageUrl = useImage(equipoItem.equipo?.imagen, '');
  
  return (
    <ListItem 
      divider
      sx={{ 
        mb: 1, 
        border: '1px solid rgba(0, 0, 0, 0.12)', 
        borderRadius: 1,
        transition: 'all 0.3s ease',
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
          transform: 'translateX(5px)'
        }
      }}
    >
      <ListItemAvatar>
        <Avatar>
          {equipoImageUrl ? (
            <Box
              component="img"
              src={equipoImageUrl}
              alt={equipoItem.equipo?.nombre}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '50%'
              }}
              onError={(e) => {
                // 🔥 Fallback en caso de error
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
              }}
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
          onClick={() => onActualizar(equipoItem)}
          sx={{
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            color: '#2196f3',
            '&:hover': {
              backgroundColor: 'rgba(33, 150, 243, 0.2)',
              transform: 'scale(1.1)'
            }
          }}
        >
          <EditIcon />
        </IconButton>
        <IconButton 
          edge="end" 
          aria-label="delete"
          onClick={() => onEliminar(equipoItem)}
          sx={{
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            color: '#f44336',
            '&:hover': {
              backgroundColor: 'rgba(244, 67, 54, 0.2)',
              transform: 'scale(1.1)'
            }
          }}
        >
          <DeleteIcon />
        </IconButton>
      </Box>
    </ListItem>
  );
};

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
        <Box sx={{ 
          p: 3, 
          textAlign: 'center',
          border: '2px dashed rgba(0, 0, 0, 0.12)',
          borderRadius: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.02)'
        }}>
          <SportsIcon sx={{ 
            fontSize: 48, 
            color: 'rgba(0, 0, 0, 0.3)', 
            mb: 1 
          }} />
          <Typography variant="body2" color="textSecondary">
            Este jugador no está registrado en ningún equipo
          </Typography>
        </Box>
      ) : (
        <>
          <List>
            {equipos.map((equipoItem) => (
              <EquipoJugadorItem
                key={equipoItem.equipo._id}
                equipoItem={equipoItem}
                jugadorId={jugadorId}
                onActualizar={handleEditNumero}
                onEliminar={handleConfirmDelete}
              />
            ))}
          </List>
          
          {/* Diálogo para editar número */}
          <Dialog 
            open={editDialogOpen} 
            onClose={() => setEditDialogOpen(false)}
            PaperProps={{
              sx: {
                borderRadius: 2,
                minWidth: 300
              }
            }}
          >
            <DialogTitle sx={{ 
              borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <EditIcon sx={{ color: '#2196f3' }} />
              Editar número
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <DialogContentText sx={{ mb: 2 }}>
                Actualizar el número del jugador para el equipo <strong>{selectedEquipo?.equipo?.nombre || ''}</strong>
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                label="Número"
                type="number"
                fullWidth
                variant="outlined"
                value={nuevoNumero}
                onChange={(e) => setNuevoNumero(e.target.value)}
                inputProps={{ min: 0, max: 999 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 1 }}>
              <Button 
                onClick={() => setEditDialogOpen(false)}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleGuardarNumero} 
                variant="contained"
                color="primary"
                sx={{ 
                  borderRadius: 2,
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
                }}
              >
                Guardar
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* Diálogo para confirmar eliminación */}
          <Dialog 
            open={deleteDialogOpen} 
            onClose={() => setDeleteDialogOpen(false)}
            PaperProps={{
              sx: {
                borderRadius: 2,
                minWidth: 350
              }
            }}
          >
            <DialogTitle sx={{ 
              borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: '#f44336'
            }}>
              <DeleteIcon />
              Confirmar eliminación
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <DialogContentText>
                ¿Estás seguro de que deseas eliminar a este jugador del equipo <strong>{selectedEquipo?.equipo?.nombre || ''}</strong>?
              </DialogContentText>
              <Box sx={{ 
                mt: 2, 
                p: 2, 
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                borderRadius: 2,
                border: '1px solid rgba(244, 67, 54, 0.2)'
              }}>
                <Typography variant="body2" color="error">
                  ⚠️ Esta acción no se puede deshacer
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 1 }}>
              <Button 
                onClick={() => setDeleteDialogOpen(false)}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleRemoveFromTeam} 
                variant="contained"
                color="error"
                sx={{ borderRadius: 2 }}
              >
                Eliminar
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </>
  )
}