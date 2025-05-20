import { useState, useEffect, useRef } from 'react';
import {
  Box, TextField, Button, Typography, Avatar, Grid, Paper, Container
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../config/axios';
import Swal from 'sweetalert2';
import { useParams } from 'react-router-dom';

export const EditarPerfil = () => {
  const { usuario, login } = useAuth();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    nombre: '',
    documento: '',
    email: ''
  });
  const [imagen, setImagen] = useState(null);
  const [preview, setPreview] = useState('');

  const { id } = useParams();

  // Usar un valor predeterminado para el API_URL en caso de que la variable de entorno no esté definida
  const API_URL = import.meta.env.VITE_BACKEND_URL || '';
  const imagePath = usuario?.imagen ? `${API_URL}/uploads/${usuario.imagen}` : '';
  const avatarSrc = preview || imagePath;

  useEffect(() => {
    const cargarDatos = async () => {
      if (!id) {
        if (!usuario) return;

        setForm({
          nombre: usuario.nombre || '',
          documento: usuario.documento || '',
          email: usuario.email || ''
        });

        if (usuario.imagen) {
          const url = `${API_URL}/uploads/${usuario.imagen}`;
          setPreview(url);
        }

        return;
      }

      try {
        const { data } = await axiosInstance.get(`/usuarios/${id}`);

        setForm({
          nombre: data.nombre || '',
          documento: data.documento || '',
          email: data.email || ''
        });

        if (data.imagen) {
          const url = `${API_URL}/uploads/${data.imagen}`;
          setPreview(url);
        }
      } catch (error) {
        console.error('Error al cargar el usuario:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar el perfil',
          text: 'No se pudo cargar la información del usuario.',
          confirmButtonColor: '#d32f2f'
        });
      }
    };

    cargarDatos();
  }, [id, usuario, API_URL]);



  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagen(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const formData = new FormData();
    formData.append('nombre', form.nombre);
    formData.append('documento', form.documento);
    if (imagen) formData.append('imagen', imagen);

    const userId = id || usuario._id;

    const { data } = await axiosInstance.patch(`/usuarios/${userId}`, formData);

    if (!id || id === usuario._id) {
      login({ usuario: data.usuario, token: localStorage.getItem('token') });
    }

    // 🎉 Éxito con Swal
    Swal.fire({
      icon: 'success',
      title: 'Perfil actualizado',
      text: 'Tus cambios se han guardado correctamente.',
      confirmButtonColor: '#1976d2'
    });
  } catch (error) {
    console.error(error);

    // ⚠️ Error con Swal
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Hubo un problema al actualizar tu perfil. Inténtalo más tarde.',
      confirmButtonColor: '#d32f2f'
    });
  }
};


  return (
    <Container maxWidth="sm">
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          mt: 4,
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Typography 
          variant="h5" 
          gutterBottom 
          align="center"
          sx={{ 
            mb: 3, 
            fontWeight: 'bold',
            color: 'primary.main' 
          }}
        >
          Editar Perfil
        </Typography>

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          {/* Sección de la imagen de perfil */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImagenChange}
              hidden
              ref={fileInputRef}
            />
            <Avatar
              src={avatarSrc}
              sx={{
                width: 150,
                height: 150,
                mb: 2,
                cursor: 'pointer',
                border: '3px solid #00bcd4',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 0 20px rgba(0,188,212,0.6)',
                  transform: 'scale(1.05)'
                }
              }}
              onClick={() => fileInputRef.current.click()}
            />
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Haz clic en la imagen para cambiarla
            </Typography>
          </Box>

          {/* Campos apilados verticalmente - uno encima del otro */}
          <Box sx={{ width: '100%', mb: 3 }}>
            <TextField
              fullWidth
              label="Nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              variant="outlined"
              sx={{ mb: 2 }}
              InputProps={{
                sx: { borderRadius: 2 }
              }}
            />
            
            <TextField
              fullWidth
              label="Documento"
              name="documento"
              value={form.documento}
              onChange={handleChange}
              variant="outlined"
              sx={{ mb: 2 }}
              InputProps={{
                sx: { borderRadius: 2 }
              }}
            />
            
            <TextField
              fullWidth
              label="Correo"
              name="email"
              value={form.email}
              disabled
              variant="outlined"
              InputProps={{
                sx: { borderRadius: 2 }
              }}
            />
          </Box>
          
          {/* Botón ocupando todo el ancho */}
          <Button 
            type="submit" 
            variant="contained" 
            fullWidth
            sx={{
              py: 1.5,
              borderRadius: 2,
              fontWeight: 'bold',
              textTransform: 'none',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
              '&:hover': {
                boxShadow: '0 6px 15px rgba(0, 0, 0, 0.2)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            Guardar cambios
          </Button>
        </form>
      </Paper>
    </Container>
  );
};