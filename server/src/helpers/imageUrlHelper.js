// helpers/imageUrlHelper.js - Helper universal para URLs de imágenes

/**
 * Obtiene la URL completa de una imagen, sin importar si viene de local o Cloudinary
 * @param {string} imagen - Puede ser filename local o URL completa de Cloudinary
 * @param {string} baseUrl - URL base del backend (solo para imágenes locales)
 * @returns {string} - URL completa de la imagen
 */
const getImageUrl = (imagen, baseUrl = '') => {
  // Si no hay imagen, retornar string vacío
  if (!imagen) return '';
  
  // Si ya es una URL completa (Cloudinary, AWS, etc.)
  if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
    return imagen;
  }
  
  // Si es un filename local, construir la URL
  const API_URL = baseUrl || process.env.BACKEND_URL || '';
  return `${API_URL}/uploads/${imagen}`;
};

/**
 * Versión para Node.js (backend)
 * @param {string} imagen - Filename o URL de imagen  
 * @param {object} req - Request object de Express (opcional)
 * @returns {string} - URL completa
 */
const getImageUrlServer = (imagen, req = null) => {
  if (!imagen) return '';
  
  // Si ya es URL completa (Cloudinary, etc.)
  if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
    return imagen;
  }
  
  // Construir URL local - usar req si está disponible, sino variable de entorno
  let baseUrl;
  if (req) {
    baseUrl = `${req.protocol}://${req.get('host')}`;
  } else {
    baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  }
  
  return `${baseUrl}/uploads/${imagen}`;
};

/**
 * Determina si una imagen es local o de un servicio cloud
 * @param {string} imagen - Filename o URL de imagen
 * @returns {object} - Información sobre el tipo de imagen
 */
const getImageInfo = (imagen) => {
  if (!imagen) {
    return { isValid: false, type: 'none', url: '' };
  }
  
  const isCloudinary = imagen.includes('cloudinary.com');
  const isAWS = imagen.includes('amazonaws.com');
  const isExternal = imagen.startsWith('http://') || imagen.startsWith('https://');
  const isLocal = !isExternal;
  
  return {
    isValid: true,
    type: isCloudinary ? 'cloudinary' : isAWS ? 'aws' : isExternal ? 'external' : 'local',
    isLocal,
    isExternal,
    isCloudinary,
    url: isExternal ? imagen : getImageUrl(imagen)
  };
};

module.exports = {
  getImageUrl,
  getImageUrlServer,
  getImageInfo
};