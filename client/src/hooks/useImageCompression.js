// client/src/hooks/useImageCompression.js

import { useState, useCallback } from 'react';
import imageCompression from 'browser-image-compression';

export const useImageCompression = () => {
  const [compressing, setCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);

  const compressImage = useCallback(async (file, options = {}) => {
    if (!file || !file.type.startsWith('image/')) {
      throw new Error('El archivo debe ser una imagen');
    }

    setCompressing(true);
    setCompressionProgress(0);

    try {
      const defaultOptions = {
        maxSizeMB: 0.5,              // 500KB máximo
        maxWidthOrHeight: 800,       // 800px máximo
        useWebWorker: true,          // Usar web worker para mejor performance
        fileType: 'image/jpeg',      // Convertir todo a JPEG (mejor compresión)
        initialQuality: 0.8,         // Calidad inicial 80%
        alwaysKeepResolution: false, // Permitir reducir resolución
        onProgress: (progress) => {
          setCompressionProgress(Math.round(progress));
        },
        ...options
      };

      console.log('🖼️ Comprimiendo imagen:', {
        nombre: file.name,
        tamaño_original: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        tipo: file.type
      });

      const compressedFile = await imageCompression(file, defaultOptions);

      console.log('✅ Imagen comprimida:', {
        tamaño_comprimido: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
        reducción: `${(((file.size - compressedFile.size) / file.size) * 100).toFixed(1)}%`,
        tipo_final: compressedFile.type
      });

      return compressedFile;
    } catch (error) {
      console.error('❌ Error comprimiendo imagen:', error);
      throw error;
    } finally {
      setCompressing(false);
      setCompressionProgress(0);
    }
  }, []);

  return {
    compressImage,
    compressing,
    compressionProgress
  };
};