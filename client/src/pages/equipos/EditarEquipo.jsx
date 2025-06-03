import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as Yup from 'yup'
import axiosInstance from '../../config/axios'
import Swal from 'sweetalert2'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import {
  TextField, MenuItem, Button, Box, CircularProgress,
  Typography, Card, CardContent, FormHelperText, Breadcrumbs,
  Chip, Avatar, Alert
} from '@mui/material'
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  AddPhotoAlternate as AddPhotoAlternateIcon,
  NavigateNext as NavigateNextIcon,
  Groups as GroupsIcon
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { useImage } from '../../hooks/useImage' // 🔥 Importar el hook
import { useAuth } from '../../context/AuthContext' // 🔥 AGREGADO: Import useAuth

export const EditarEquipo = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  
  // 🔥 AGREGADO: Verificar permisos de gestión de equipos
  const { puedeGestionarEquipos } = useAuth();

  const [previewUrl, setPreviewUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [equipoImagen, setEquipoImagen] = useState('') // 🔥 Estado para la imagen original del equipo

  // 🔥 AGREGADO: Verificación de acceso al componente
  useEffect(() => {
    if (!puedeGestionarEquipos()) {
      Swal.fire({
        icon: 'warning',
        title: 'Acceso Denegado',
        text: 'No tienes permisos para editar equipos.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#1976d2'
      }).then(() => {
        navigate('/equipos'); // Redirigir a la lista de equipos
      });
      return;
    }
  }, [puedeGestionarEquipos, navigate]);

  // 🔥 Usar el hook para la imagen del equipo
  const equipoImageUrl = useImage(equipoImagen, '/images/equipo-default.jpg')

  const schema = Yup.object().shape({
    nombre: Yup.string().required('El nombre es obligatorio'),
    categoria: Yup.string().required('La categoría es obligatoria'),
    imagen: Yup.mixed().test('fileSize', 'El archivo es demasiado grande', (value) => {
      if (!value || !value[0]) return true
      return value[0].size <= 2000000
    }).test('fileType', 'Solo se permiten imágenes', (value) => {
      if (!value || !value[0]) return true
      return value[0].type.startsWith('image/')
    })
  })

  const {
    register,
    reset,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      nombre: '',
      categoria: '',
    },
  })

  // 🔥 Observar valores en tiempo real
  const nombreActual = watch('nombre');
  const categoriaActual = watch('categoria');

  useEffect(() => {
    // 🔥 AGREGADO: Solo cargar equipo si tiene permisos
    if (puedeGestionarEquipos()) {
      fetchEquipo();
    }
  }, [puedeGestionarEquipos]);

  const fetchEquipo = async () => {
    try {
      setIsLoading(true)
      const response = await axiosInstance.get(`/equipos/${id}`)
      const equipoData = response.data
      
      reset({
        nombre: equipoData.nombre,
        categoria: equipoData.categoria,
      })
      
      // 🔥 Actualizar el estado de la imagen
      setEquipoImagen(equipoData.imagen || '')
      
      // 🔥 El hook se encargará de construir la URL automáticamente
      // No necesitamos llamar useImage aquí
    } catch (error) {
      console.error('Error al cargar equipo:', error)
      setError('Error al cargar la información del equipo')
      Swal.fire({
        icon: 'error',
        title: 'Error al cargar el equipo',
        text: error.response?.data?.mensaje || 'Error desconocido',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data) => {
    // 🔥 AGREGADO: Verificación adicional antes de enviar
    if (!puedeGestionarEquipos()) {
      Swal.fire({
        icon: 'error',
        title: 'Acceso Denegado',
        text: 'No tienes permisos para editar equipos.'
      });
      return;
    }

    try {
      const formData = new FormData()
      formData.append('nombre', data.nombre)
      formData.append('categoria', data.categoria)

      if (data.imagen && data.imagen.length > 0) {
        formData.append('imagen', data.imagen[0])
      }

      await axiosInstance.patch(`/equipos/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      Swal.fire({
        icon: 'success',
        title: 'Equipo modificado correctamente',
        showConfirmButton: false,
        timer: 2000,
      })
      navigate('/equipos')
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al modificar el equipo',
        text: error.response?.data?.mensaje || 'Algo salió mal',
      })
    }
  }

  const handleImageClick = () => {
    fileInputRef.current.click()
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const imageUrl = URL.createObjectURL(file)
      setPreviewUrl(imageUrl) // 🔥 Esto sobrescribe la imagen original
      setValue('imagen', e.target.files)
      setFileName(file.name)
    }
  }

  // 🔥 AGREGADO: Si no tiene permisos, no renderizar el componente (redundancia de seguridad)
  if (!puedeGestionarEquipos()) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        backgroundImage: 'linear-gradient(to bottom right, rgba(20, 20, 40, 0.9), rgba(10, 10, 30, 0.95))',
        borderRadius: 2
      }}>
        <Alert severity="warning" sx={{ maxWidth: 400 }}>
          <Typography variant="h6" gutterBottom>
            Acceso Denegado
          </Typography>
          <Typography variant="body2">
            No tienes permisos para acceder a esta página.
          </Typography>
          <Button 
            component={Link} 
            to="/equipos" 
            variant="contained" 
            sx={{ mt: 2 }}
          >
            Volver a Equipos
          </Button>
        </Alert>
      </Box>
    );
  }

  // 🔥 Determinar qué imagen mostrar
  const imagenAMostrar = previewUrl || equipoImageUrl

  // Animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15 } 
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  }

  const cardStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 3,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        backgroundImage: 'linear-gradient(to bottom right, rgba(20, 20, 40, 0.9), rgba(10, 10, 30, 0.95))',
        borderRadius: 2
      }}>
        <CircularProgress size={60} />
      </Box>
    )
  }

  return (
    <Box sx={{ 
      width: '100%', 
      p: { xs: 2, md: 4 },
      backgroundImage: 'linear-gradient(to bottom right, rgba(20, 20, 40, 0.9), rgba(10, 10, 30, 0.95))',
      minHeight: 'calc(100vh - 64px)',
      borderRadius: 2
    }}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Breadcrumbs */}
        <motion.div variants={itemVariants}>
          <Breadcrumbs 
            separator={<NavigateNextIcon fontSize="small" />}
            sx={{ mb: 3, color: 'rgba(255,255,255,0.7)' }}
          >
            <Link 
              to="/equipos"
              style={{ 
                color: 'inherit', 
                textDecoration: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.color = 'white'}
              onMouseLeave={(e) => e.target.style.color = 'inherit'}
            >
              Equipos
            </Link>
            <Typography color="primary">Editar Equipo</Typography>
          </Breadcrumbs>
        </motion.div>

        {/* Header */}
        <motion.div variants={itemVariants}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 4,
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Typography variant="h4" component="h1" sx={{ 
              color: 'white',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              fontWeight: 'bold',
              borderLeft: '4px solid #3f51b5',
              pl: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <EditIcon sx={{ color: '#64b5f6' }} />
              Editar Equipo
            </Typography>
            
            <Button 
              component={Link}
              to="/equipos"
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              sx={{
                borderRadius: 2,
                borderWidth: 2,
                py: 1,
                px: 3,
                '&:hover': {
                  borderWidth: 2,
                  backgroundColor: 'rgba(255,255,255,0.05)'
                }
              }}
            >
              Volver a Equipos
            </Button>
          </Box>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div variants={itemVariants}>
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          </motion.div>
        )}

        {/* Formulario */}
        <motion.div variants={itemVariants}>
          <Card sx={cardStyle}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 3,
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                pb: 2
              }}>
                <GroupsIcon sx={{ color: '#64b5f6', mr: 2 }} />
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                  Información del Equipo
                </Typography>
                <Chip 
                  label="Editando" 
                  color="warning" 
                  variant="outlined" 
                  size="small" 
                  sx={{ ml: 'auto' }}
                />
              </Box>

              <form onSubmit={handleSubmit(onSubmit)}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
                  {/* Sección de imagen */}
                  <Box sx={{ flexBasis: { md: '40%' } }}>
                    <Card sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 3,
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb: 2,
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                          pb: 1
                        }}>
                          <AddPhotoAlternateIcon sx={{ color: '#64b5f6', mr: 1 }} />
                          <Typography variant="h6" sx={{ color: 'white' }}>
                            Logo del Equipo
                          </Typography>
                        </Box>

                        {/* Input file oculto */}
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          style={{ display: 'none' }}
                          onChange={handleImageChange}
                        />

                        {/* Preview de imagen */}
                        <Box
                          onClick={handleImageClick}
                          sx={{
                            width: '100%',
                            height: 200,
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: 2,
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px dashed rgba(255, 255, 255, 0.2)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            mb: 2,
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              borderColor: 'rgba(100, 181, 246, 0.5)',
                              transform: 'scale(1.02)'
                            }
                          }}
                        >
                          {imagenAMostrar ? (
                            <Box
                              component="img"
                              src={imagenAMostrar}
                              alt="Preview"
                              sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                borderRadius: 2
                              }}
                              onError={(e) => {
                                // 🔥 Fallback en caso de error
                                e.target.src = '/images/equipo-default.jpg'
                              }}
                            />
                          ) : (
                            <Box sx={{ textAlign: 'center', p: 3 }}>
                              <AddPhotoAlternateIcon sx={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.3)', mb: 1 }} />
                              <Typography variant="body2" color="text.secondary">
                                Haz clic para seleccionar imagen
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<AddPhotoAlternateIcon />}
                          onClick={handleImageClick}
                          fullWidth
                          sx={{
                            borderRadius: 2,
                            py: 1.5,
                            borderWidth: 2,
                            '&:hover': {
                              borderWidth: 2,
                              backgroundColor: 'rgba(255,255,255,0.05)'
                            }
                          }}
                        >
                          {imagenAMostrar ? 'Cambiar Imagen' : 'Seleccionar Imagen'}
                        </Button>

                        {errors.imagen && (
                          <FormHelperText error sx={{ mt: 1 }}>
                            {errors.imagen.message}
                          </FormHelperText>
                        )}

                        {fileName && (
                          <Typography variant="caption" sx={{ 
                            display: 'block', 
                            mt: 1, 
                            color: 'rgba(255,255,255,0.7)',
                            textAlign: 'center'
                          }}>
                            📁 {fileName}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Box>

                  {/* Sección de formulario */}
                  <Box sx={{ flexBasis: { md: '60%' } }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <TextField
                        fullWidth
                        label="Nombre del Equipo"
                        variant="outlined"
                        {...register('nombre')}
                        error={!!errors.nombre}
                        helperText={errors.nombre?.message}
                        InputProps={{
                          sx: { borderRadius: 2 }
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.3)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(100, 181, 246, 0.5)',
                            },
                          }
                        }}
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
                            variant="outlined"
                            error={!!errors.categoria}
                            helperText={errors.categoria?.message || 'Selecciona la categoría del equipo'}
                            InputProps={{
                              sx: { borderRadius: 2 }
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                  borderColor: 'rgba(255, 255, 255, 0.3)',
                                },
                                '&:hover fieldset': {
                                  borderColor: 'rgba(100, 181, 246, 0.5)',
                                },
                              }
                            }}
                          >
                            <MenuItem value="" disabled>-- Seleccione una categoría --</MenuItem>
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

                      {/* Vista previa de la categoría */}
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          👁️ Vista previa en tiempo real
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={imagenAMostrar}
                            sx={{ 
                              width: 40, 
                              height: 40,
                              border: '2px solid rgba(255, 255, 255, 0.2)'
                            }}
                          >
                            <GroupsIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body1" sx={{ 
                              color: 'white', 
                              fontWeight: 'medium',
                              minHeight: '24px'
                            }}>
                              {nombreActual || 'Nombre del equipo'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{
                              minHeight: '16px'
                            }}>
                              {categoriaActual ? 
                                {
                                  'mixgold': 'Mixto Golden',
                                  'mixsilv': 'Mixto Silver',
                                  'vargold': 'Varonil Golden',
                                  'varsilv': 'Varonil Silver',
                                  'femgold': 'Femenil Golden',
                                  'femsilv': 'Femenil Silver',
                                  'varmast': 'Varonil Master',
                                  'femmast': 'Femenil Master'
                                }[categoriaActual] : 'Categoría del equipo'
                              }
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* Botones de acción */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  gap: 2, 
                  mt: 4,
                  pt: 3,
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<CancelIcon />}
                    onClick={() => navigate('/equipos')}
                    sx={{
                      borderRadius: 2,
                      borderWidth: 2,
                      py: 1.5,
                      px: 4,
                      '&:hover': {
                        borderWidth: 2,
                        backgroundColor: 'rgba(255,255,255,0.05)'
                      }
                    }}
                  >
                    Cancelar
                  </Button>

                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    sx={{
                      py: 1.5,
                      px: 4,
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                      boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                      fontWeight: 'bold'
                    }}
                  >
                    Guardar Cambios
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </Box>
  )
}