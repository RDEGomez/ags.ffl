// hooks/useImage.js - Hook para manejar imágenes universalmente

import { useMemo } from 'react';

/**
 * Hook que convierte automáticamente cualquier referencia de imagen 
 * (filename local o URL de Cloudinary) en una URL completa utilizable
 */
export const useImage = (imagen, fallback = '') => {
  const imageUrl = useMemo(() => {
    if (!imagen) return fallback;
    
    // Si ya es una URL completa (Cloudinary, AWS, etc.)
    if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
      return imagen;
    }
    
    // Si es un filename local, construir la URL
    const API_URL = import.meta.env.VITE_BACKEND_URL || '';
    return `${API_URL}/uploads/${imagen}`;
  }, [imagen, fallback]);
  
  return imageUrl;
};

/**
 * Hook más avanzado que también proporciona información sobre la imagen
 */
export const useImageInfo = (imagen) => {
  const info = useMemo(() => {
    if (!imagen) {
      return { 
        url: '', 
        isValid: false, 
        type: 'none',
        isLocal: false,
        isCloudinary: false 
      };
    }
    
    const isCloudinary = imagen.includes('cloudinary.com');
    const isExternal = imagen.startsWith('http://') || imagen.startsWith('https://');
    const isLocal = !isExternal;
    
    const url = isExternal ? imagen : `${import.meta.env.VITE_BACKEND_URL}/uploads/${imagen}`;
    
    return {
      url,
      isValid: true,
      type: isCloudinary ? 'cloudinary' : isExternal ? 'external' : 'local',
      isLocal,
      isCloudinary,
      isExternal,
      originalValue: imagen
    };
  }, [imagen]);
  
  return info;
};

/**
 * Componente wrapper que maneja imágenes automáticamente
 */
export const UniversalImage = ({ 
  src, 
  alt, 
  fallback = '/images/placeholder.png',
  onError,
  ...props 
}) => {
  const imageUrl = useImage(src, fallback);
  
  const handleError = (e) => {
    if (fallback && e.target.src !== fallback) {
      e.target.src = fallback;
    }
    if (onError) onError(e);
  };
  
  return (
    <img 
      src={imageUrl} 
      alt={alt} 
      onError={handleError}
      {...props} 
    />
  );
};