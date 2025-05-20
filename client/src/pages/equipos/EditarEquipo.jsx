import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as Yup from 'yup'
import axiosInstance from '../../config/axios'
import Swal from 'sweetalert2'
import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import {
  TextField, MenuItem, Button, Box, CircularProgress,
  Typography, Paper, FormHelperText
} from '@mui/material'

export const EditarEquipo = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [previewUrl, setPreviewUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const API_URL = `${import.meta.env.VITE_BACKEND_URL}/uploads/` || '';

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
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      nombre: '',
      categoria: '',
    },
  })

  useEffect(() => {
    fetchEquipo()
  }, [])

  const fetchEquipo = async () => {
    try {
      const response = await axiosInstance.get(`/equipos/${id}`)
      const equipoData = response.data
      reset({
        nombre: equipoData.nombre,
        categoria: equipoData.categoria,
      })
      setPreviewUrl(`${API_URL}${equipoData.imagen}`) // imagen ya existente
      setIsLoading(false)
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al cargar el equipo',
        text: error.response?.data?.mensaje || 'Error desconocido',
      })
    }
  }

  const onSubmit = async (data) => {
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
      setPreviewUrl(imageUrl)
      setValue('imagen', e.target.files)
      setFileName(file.name)
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', py: 3, px: 2 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Editar Equipo
      </Typography>
      <hr />
      <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Input file oculto para cargar imagen */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleImageChange}
          />

          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
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
              <img
                src={previewUrl}
                alt="Logo del equipo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
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

          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              type="submit"
              sx={{ px: 4, py: 1 }}
            >
              Modificar Equipo
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  )
}
