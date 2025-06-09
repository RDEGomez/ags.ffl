// client/src/components/ImageUpload.jsx

import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  LinearProgress,
  Typography,
  Alert,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Compress as CompressIcon
} from '@mui/icons-material';
import { useImageCompression } from '../hooks/useImageCompression';

export const ImageUpload = ({ 
  onImageSelect, 
  currentImage, 
  onImageRemove,
  disabled = false,
  size = 120,
  label = "Seleccionar imagen"
}) => {
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(currentImage || '');
  const [error, setError] = useState('');
  
  const { compressImage, compressing, compressionProgress } = useImageCompression();

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError('');

    try {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Por favor selecciona una imagen válida');
      }

      // Validar tamaño (20MB máximo antes de compresión)
      if (file.size > 20 * 1024 * 1024) {
        throw new Error('La imagen es demasiado grande (máximo 20MB)');
      }

      // Comprimir imagen
      const compressedFile = await compressImage(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(compressedFile);

      // Notificar al componente padre
      onImageSelect(compressedFile);

    } catch (error) {
      console.error('Error procesando imagen:', error);
      setError(error.message);
      setPreviewUrl('');
    }

    // Limpiar input
    event.target.value = '';
  };

  const handleRemoveImage = () => {
    setPreviewUrl('');
    setError('');
    onImageRemove?.();
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      gap: 2,
      p: 2,
      border: '2px dashed rgba(255, 255, 255, 0.2)',
      borderRadius: 2,
      backgroundColor: 'rgba(255, 255, 255, 0.02)'
    }}>
      {/* Preview de imagen */}
      {previewUrl && (
        <Box sx={{ position: 'relative' }}>
          <Avatar
            src={previewUrl}
            sx={{ 
              width: size, 
              height: size,
              border: '3px solid rgba(255, 255, 255, 0.2)'
            }}
          />
          <Tooltip title="Eliminar imagen">
            <IconButton
              onClick={handleRemoveImage}
              disabled={disabled || compressing}
              sx={{
                position: 'absolute',
                top: -10,
                right: -10,
                backgroundColor: 'rgba(244, 67, 54, 0.9)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(244, 67, 54, 1)',
                }
              }}
              size="small"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Botón de selección */}
      <Button
        variant="outlined"
        component="label"
        startIcon={compressing ? <CompressIcon /> : <CloudUploadIcon />}
        disabled={disabled || compressing}
        sx={{
          color: 'white',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.5)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)'
          }
        }}
      >
        {compressing ? 'Comprimiendo...' : (previewUrl ? 'Cambiar imagen' : label)}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </Button>

      {/* Progreso de compresión */}
      {compressing && (
        <Box sx={{ width: '100%' }}>
          <LinearProgress 
            variant="determinate" 
            value={compressionProgress}
            sx={{ 
              mb: 1,
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#64b5f6'
              }
            }}
          />
          <Typography variant="caption" color="text.secondary" textAlign="center">
            Comprimiendo: {compressionProgress}%
          </Typography>
        </Box>
      )}

      {/* Mensaje de error */}
      {error && (
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      )}

      {/* Información útil */}
      <Typography variant="caption" color="text.secondary" textAlign="center">
        Formatos: JPG, PNG, WebP<br/>
        Tamaño máximo: 20MB (se comprimirá automáticamente)
      </Typography>
    </Box>
  );
};