import { useState, useEffect, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as Yup from 'yup'
import axiosInstance from '../../config/axios'
import Swal from 'sweetalert2'
import { useNavigate } from 'react-router-dom'
import { ListaEquipos } from './ListaEquipos'
import { 
  Box, 
  Button, 
  CircularProgress,
  Divider,
  FormControl, 
  FormHelperText, 
  Input, 
  InputLabel, 
  MenuItem, 
  Paper, 
  TextField, 
  Typography 
} from '@mui/material'

export const NuevoEquipo = () => {
  const [fileName, setFileName] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const fileInputRef = useRef(null);

  // Actualizado el esquema para un equipo
  const schema = Yup.object().shape({
    nombre: Yup.string().required('El nombre es obligatorio'),
    categoria: Yup.string().required('La categoría es obligatoria'),
    imagen: Yup.mixed()
      .test('fileSize', 'El archivo es demasiado grande', (value) => {
        if (!value || !value[0]) return true;
        return value[0].size <= 2000000; // Limitar a 2MB
      })
      .test('fileType', 'Solo se permiten imágenes', (value) => {
        if (!value || !value[0]) return true;
        return value[0].type.startsWith('image/');
      })
  })

  const {
    register,
    reset,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      nombre: '',
      categoria: '',
      imagen: null
    },
  })

  const navigate = useNavigate()

  // Cargar la lista de equipos al montar el componente
  useEffect(() => {
    const fetchEquipos = async () => {
      try {
        const response = await axiosInstance.get('/equipos');
        setEquipos(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar equipos:', error);
        setLoading(false);
      }
    };

    fetchEquipos();
  }, []);

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPreviewUrl(imageUrl);
      setValue('imagen', e.target.files);
      setFileName(file.name);
    }
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append('nombre', data.nombre);
      formData.append('categoria', data.categoria);
      
      if (data.imagen && data.imagen.length > 0) {
        formData.append('imagen', data.imagen[0]);
      }

      const response = await axiosInstance.post('/equipos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Agregar el nuevo equipo a la lista
      setEquipos([...equipos, response.data.equipo]);

      Swal.fire({
        icon: 'success',
        title: 'Equipo creado correctamente',
        showConfirmButton: false,
        timer: 2000,
      })
      reset();
      setFileName('');
      setPreviewUrl('');
    } catch (error) {
      console.error(error)
      Swal.fire({
        icon: 'error',
        title: 'Error al crear el equipo',
        text: error.response?.data?.mensaje || 'Algo salió mal',
      })
    }
  }

  return (
    <Box
      sx={{
        maxWidth: {
          xs: '100%', // Teléfonos
          sm: '90%',  // Tablets pequeñas
          md: '80%',  // Tablets grandes
          lg: '60%'   // Escritorio
        },
        margin: '0 auto',
        padding: 2
      }}
    >
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Gestión de Equipos
      </Typography>
      <hr />
      
      {/* Cambiamos el contenedor principal a display: flex en lugar de usar Grid */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          gap: 3, 
          mt: 2
        }}
      >
        {/* Formulario para crear nuevo equipo */}
        <Box sx={{ flex: '0 0 60%' }}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Nuevo Equipo
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* Input file oculto para cargar imagen */}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />

              <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mb: 2 }}>
                <Box
                  onClick={handleImageClick}
                  sx={{
                    width: 140,
                    height: 140,
                    backgroundColor: 'background.paper',
                    borderRadius: 2,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '3px solid #1976d2',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.05)',
                    },
                    pt: { xs: 2, sm: 2 }, // padding-top responsivo
                  }}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Logo del equipo"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  ) : (
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ textAlign: 'center', p: 1 }}
                    >
                      Haz clic para seleccionar logo del equipo
                    </Typography>
                  )}
                </Box>
              </Box>

              {errors.imagen && (
                <FormHelperText error sx={{ textAlign: 'center', mb: 2 }}>
                  {errors.imagen.message}
                </FormHelperText>
              )}

              {fileName && (
                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mb: 2 }}>
                  Archivo seleccionado: {fileName}
                </Typography>
              )}

              <TextField
                fullWidth
                label="Nombre"
                margin="normal"
                {...register('nombre')}
                error={!!errors.nombre}
                helperText={errors.nombre?.message}
              />

              <Controller
                name="categoria"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Categoría"
                    margin="normal"
                    error={!!errors.categoria}
                    helperText={errors.categoria?.message}
                    onChange={(e) => {
                      field.onChange(e);
                      setCategoriaFiltro(e.target.value);
                    }}
                  >
                    <MenuItem value="" disabled>-- Seleccione --</MenuItem>
                    <MenuItem value="mixgold">Mixto Golden</MenuItem>
                    <MenuItem value="mixsilv">Mixto Silver</MenuItem>
                    <MenuItem value="vargold">Varonil Golden</MenuItem>
                    <MenuItem value="varsilv">Varonil Silver</MenuItem>
                    <MenuItem value="femgold">Femenil Golden</MenuItem>
                    <MenuItem value="femsilv">Femenil Silver</MenuItem>
                    <MenuItem value="varmast">Varonil Master</MenuItem>
                    <MenuItem value="femmast">Femenil Master</MenuItem>
                  </TextField>
                )}
              />

              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="large" 
                  type="submit"
                  sx={{ px: 4, py: 1 }}
                >
                  Crear Equipo
                </Button>
              </Box>
            </form>
          </Paper>
        </Box>

        {/* Lista de equipos registrados */}
        <Box sx={{ 
          flex: '0 0 40%',
          position: { md: 'sticky' },
          top: { md: '20px' },
          alignSelf: { md: 'flex-start' }
        }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Equipos Registrados
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress />
              </Box>
            ) : (
              <ListaEquipos equipos={
                categoriaFiltro 
                ? equipos.filter(equipo => equipo.categoria === categoriaFiltro) 
                : equipos
              } />
            )}
            
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/equipos')}
                sx={{ px: 3 }}
              >
                Ver todos los equipos
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  )
}