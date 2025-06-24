// server/src/helpers/imageUrlHelper.js
// Helper universal para URLs de imágenes - Actualizado con soporte ImageKit

/**
 * Obtiene la URL completa de una imagen, detectando automáticamente el tipo
 * @param {string} imagen - Puede ser filename local, URL de Cloudinary, URL de ImageKit
 * @param {string} baseUrl - URL base del backend (solo para imágenes locales)
 * @returns {string} - URL completa de la imagen
 */
const getImageUrl = (imagen, baseUrl = '') => {
  // Si no hay imagen, retornar string vacío
  if (!imagen) return '';
  
  // Si ya es una URL completa (Cloudinary, ImageKit, AWS, etc.)
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
  
  // Si ya es URL completa (Cloudinary, ImageKit, etc.)
  if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
    return imagen;
  }
  
  // Construir URL local - usar req si está disponible, sino variable de entorno
  let baseUrl;
  if (req) {
    baseUrl = `${req.protocol}://${req.get('host')}`;
  } else {
    baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  }
  
  return `${baseUrl}/uploads/${imagen}`;
};

/**
 * Determina el tipo y características de una imagen
 * @param {string} imagen - Filename o URL de imagen
 * @returns {object} - Información detallada sobre el tipo de imagen
 */
const getImageInfo = (imagen) => {
  if (!imagen) {
    return { 
      isValid: false, 
      type: 'none', 
      url: '',
      provider: null
    };
  }
  
  const isCloudinary = imagen.includes('cloudinary.com');
  const isImageKit = imagen.includes('ik.imagekit.io');
  const isAWS = imagen.includes('amazonaws.com');
  const isExternal = imagen.startsWith('http://') || imagen.startsWith('https://');
  const isLocal = !isExternal;
  
  // Determinar el proveedor específico
  let provider = null;
  let type = 'local';
  
  if (isCloudinary) {
    provider = 'cloudinary';
    type = 'cloudinary';
  } else if (isImageKit) {
    provider = 'imagekit';
    type = 'imagekit';
  } else if (isAWS) {
    provider = 'aws';
    type = 'aws';
  } else if (isExternal) {
    provider = 'external';
    type = 'external';
  } else {
    provider = 'local';
    type = 'local';
  }
  
  return {
    isValid: true,
    type,
    provider,
    isLocal,
    isExternal,
    isCloudinary,
    isImageKit,
    isAWS,
    url: isExternal ? imagen : getImageUrl(imagen),
    originalValue: imagen
  };
};

/**
 * Convierte una URL de Cloudinary a ImageKit (para migración)
 * @param {string} cloudinaryUrl - URL de Cloudinary
 * @param {string} imagekitEndpoint - Endpoint base de ImageKit
 * @returns {string} - URL equivalente en ImageKit
 */
const convertCloudinaryToImageKit = (cloudinaryUrl, imagekitEndpoint = null) => {
  if (!cloudinaryUrl || !cloudinaryUrl.includes('cloudinary.com')) {
    return cloudinaryUrl; // No es URL de Cloudinary
  }
  
  try {
    const endpoint = imagekitEndpoint || process.env.IMAGEKIT_URL_ENDPOINT;
    if (!endpoint) {
      console.warn('⚠️ IMAGEKIT_URL_ENDPOINT no configurado para conversión');
      return cloudinaryUrl;
    }
    
    // Extraer el path del archivo de la URL de Cloudinary
    const urlObj = new URL(cloudinaryUrl);
    const pathParts = urlObj.pathname.split('/');
    
    // Encontrar el índice donde empieza el path del archivo
    const uploadIndex = pathParts.findIndex(part => part === 'upload');
    if (uploadIndex === -1) {
      console.warn('⚠️ No se pudo parsear URL de Cloudinary:', cloudinaryUrl);
      return cloudinaryUrl;
    }
    
    // Extraer el path real del archivo (saltando transformaciones)
    let filePath = pathParts.slice(uploadIndex + 1);
    
    // Si hay transformaciones, saltarlas (buscar versión v1234567)
    const versionIndex = filePath.findIndex(part => part.startsWith('v') && /^\d+$/.test(part.substring(1)));
    if (versionIndex !== -1) {
      filePath = filePath.slice(versionIndex + 1);
    }
    
    // Reconstruir el path
    const finalPath = filePath.join('/');
    
    // Construir URL de ImageKit equivalente
    const imagekitUrl = `${endpoint}/laces-uploads/${finalPath}`;
    
    console.log('🔄 Conversión Cloudinary → ImageKit:', {
      original: cloudinaryUrl,
      converted: imagekitUrl,
      filePath: finalPath
    });
    
    return imagekitUrl;
    
  } catch (error) {
    console.error('❌ Error convirtiendo URL Cloudinary → ImageKit:', error.message);
    return cloudinaryUrl; // Retornar original si falla
  }
};

/**
 * Convierte una URL de ImageKit a Cloudinary (para rollback)
 * @param {string} imagekitUrl - URL de ImageKit
 * @param {string} cloudinaryCloudName - Cloud name de Cloudinary
 * @returns {string} - URL equivalente en Cloudinary
 */
const convertImageKitToCloudinary = (imagekitUrl, cloudinaryCloudName = null) => {
  if (!imagekitUrl || !imagekitUrl.includes('ik.imagekit.io')) {
    return imagekitUrl; // No es URL de ImageKit
  }
  
  try {
    const cloudName = cloudinaryCloudName || process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      console.warn('⚠️ CLOUDINARY_CLOUD_NAME no configurado para conversión');
      return imagekitUrl;
    }
    
    // Extraer el path del archivo de la URL de ImageKit
    const urlObj = new URL(imagekitUrl);
    const pathParts = urlObj.pathname.split('/');
    
    // Remover las partes iniciales y la carpeta 'laces-uploads'
    const folderIndex = pathParts.findIndex(part => part === 'laces-uploads');
    if (folderIndex === -1) {
      console.warn('⚠️ No se pudo parsear URL de ImageKit:', imagekitUrl);
      return imagekitUrl;
    }
    
    // Extraer el path real del archivo
    const filePath = pathParts.slice(folderIndex + 1).join('/');
    
    // Construir URL de Cloudinary equivalente
    const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/image/upload/laces-uploads/${filePath}`;
    
    console.log('🔄 Conversión ImageKit → Cloudinary:', {
      original: imagekitUrl,
      converted: cloudinaryUrl,
      filePath: filePath
    });
    
    return cloudinaryUrl;
    
  } catch (error) {
    console.error('❌ Error convirtiendo URL ImageKit → Cloudinary:', error.message);
    return imagekitUrl; // Retornar original si falla
  }
};

/**
 * Obtiene información detallada de una URL de imagen
 * @param {string} imageUrl - URL de imagen
 * @returns {object} - Metadatos de la imagen
 */
const getImageMetadata = (imageUrl) => {
  const info = getImageInfo(imageUrl);
  
  if (!info.isValid) {
    return null;
  }
  
  const metadata = {
    ...info,
    fileExtension: null,
    fileName: null,
    transformations: null
  };
  
  try {
    const urlObj = new URL(info.url);
    const pathname = urlObj.pathname;
    
    // Extraer nombre del archivo y extensión
    const pathParts = pathname.split('/');
    const fileWithParams = pathParts[pathParts.length - 1];
    const fileName = fileWithParams.split('?')[0]; // Remover query params
    
    metadata.fileName = fileName;
    metadata.fileExtension = fileName.split('.').pop()?.toLowerCase();
    
    // Detectar transformaciones según el proveedor
    if (info.isCloudinary) {
      // Cloudinary: transformaciones en el path
      const transformIndex = pathParts.findIndex(part => part.includes('w_') || part.includes('h_') || part.includes('f_'));
      if (transformIndex !== -1) {
        metadata.transformations = pathParts[transformIndex];
      }
    } else if (info.isImageKit) {
      // ImageKit: transformaciones en query parameters
      const params = new URLSearchParams(urlObj.search);
      const transforms = {};
      
      // Parámetros comunes de ImageKit
      if (params.get('tr')) transforms.tr = params.get('tr');
      if (params.get('w')) transforms.width = params.get('w');
      if (params.get('h')) transforms.height = params.get('h');
      if (params.get('f')) transforms.format = params.get('f');
      if (params.get('q')) transforms.quality = params.get('q');
      
      if (Object.keys(transforms).length > 0) {
        metadata.transformations = transforms;
      }
    }
    
  } catch (error) {
    console.warn('⚠️ Error extrayendo metadata de URL:', error.message);
  }
  
  return metadata;
};

/**
 * Valida si una URL de imagen es accesible
 * @param {string} imageUrl - URL de imagen a validar
 * @returns {Promise<boolean>} - true si la imagen es accesible
 */
const validateImageUrl = async (imageUrl) => {
  if (!imageUrl) return false;
  
  try {
    const info = getImageInfo(imageUrl);
    
    // Para URLs locales, verificar si el archivo existe
    if (info.isLocal) {
      const fs = require('fs');
      const path = require('path');
      
      const filePath = path.join(process.cwd(), 'uploads', imageUrl);
      return fs.existsSync(filePath);
    }
    
    // Para URLs externas, hacer un HEAD request
    const https = require('https');
    const http = require('http');
    const url = require('url');
    
    return new Promise((resolve) => {
      const urlObj = url.parse(info.url);
      const protocol = urlObj.protocol === 'https:' ? https : http;
      
      const req = protocol.request({
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.path,
        method: 'HEAD',
        timeout: 5000
      }, (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 400);
      });
      
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      
      req.end();
    });
    
  } catch (error) {
    console.warn('⚠️ Error validando URL de imagen:', error.message);
    return false;
  }
};

/**
 * Genera una URL optimizada para diferentes dispositivos
 * @param {string} imagen - URL o filename de imagen
 * @param {object} options - Opciones de optimización
 * @returns {object} - URLs optimizadas para diferentes tamaños
 */
const generateResponsiveUrls = (imagen, options = {}) => {
  const info = getImageInfo(imagen);
  
  if (!info.isValid || info.isLocal) {
    // Para imágenes locales, retornar la URL base
    return {
      original: info.url,
      thumbnail: info.url,
      medium: info.url,
      large: info.url
    };
  }
  
  const baseUrl = info.url;
  const urls = { original: baseUrl };
  
  try {
    if (info.isCloudinary) {
      // Generar URLs responsivas para Cloudinary
      const urlParts = baseUrl.split('/upload/');
      const baseCloudinary = urlParts[0] + '/upload';
      const imagePath = urlParts[1];
      
      urls.thumbnail = `${baseCloudinary}/w_150,h_150,c_fill,f_auto,q_auto/${imagePath}`;
      urls.medium = `${baseCloudinary}/w_400,h_400,c_limit,f_auto,q_auto/${imagePath}`;
      urls.large = `${baseCloudinary}/w_800,h_800,c_limit,f_auto,q_auto/${imagePath}`;
      
    } else if (info.isImageKit) {
      // Generar URLs responsivas para ImageKit
      const urlObj = new URL(baseUrl);
      const baseImageKit = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
      
      urls.thumbnail = `${baseImageKit}?tr=w-150,h-150,c-maintain_ratio,f-auto,q-80`;
      urls.medium = `${baseImageKit}?tr=w-400,h-400,c-at_max,f-auto,q-80`;
      urls.large = `${baseImageKit}?tr=w-800,h-800,c-at_max,f-auto,q-80`;
    }
    
  } catch (error) {
    console.warn('⚠️ Error generando URLs responsivas:', error.message);
  }
  
  return urls;
};

/**
 * Migra una URL de un proveedor a otro
 * @param {string} sourceUrl - URL origen
 * @param {string} targetProvider - Proveedor destino ('cloudinary', 'imagekit', 'local')
 * @param {object} options - Opciones de migración
 * @returns {string} - URL migrada
 */
const migrateImageUrl = (sourceUrl, targetProvider, options = {}) => {
  const info = getImageInfo(sourceUrl);
  
  if (!info.isValid) {
    return sourceUrl;
  }
  
  switch (targetProvider) {
    case 'imagekit':
      if (info.isCloudinary) {
        return convertCloudinaryToImageKit(sourceUrl, options.imagekitEndpoint);
      }
      break;
      
    case 'cloudinary':
      if (info.isImageKit) {
        return convertImageKitToCloudinary(sourceUrl, options.cloudinaryCloudName);
      }
      break;
      
    case 'local':
      // Para migrar a local, necesitaríamos descargar el archivo
      console.warn('⚠️ Migración a local requiere descarga del archivo');
      return sourceUrl;
      
    default:
      console.warn('⚠️ Proveedor de migración no válido:', targetProvider);
      return sourceUrl;
  }
  
  return sourceUrl;
};

// Exportar todas las funciones
module.exports = {
  getImageUrl,
  getImageUrlServer,
  getImageInfo,
  getImageMetadata,
  validateImageUrl,
  generateResponsiveUrls,
  migrateImageUrl,
  convertCloudinaryToImageKit,
  convertImageKitToCloudinary
};

// Funciones de utilidad para debugging
module.exports.debug = {
  /**
   * Analiza una URL y muestra información detallada
   */
  analyzeUrl: (imageUrl) => {
    console.log('🔍 Análisis de URL:', imageUrl);
    const info = getImageInfo(imageUrl);
    const metadata = getImageMetadata(imageUrl);
    const responsive = generateResponsiveUrls(imageUrl);
    
    console.log('📊 Información:', info);
    console.log('📋 Metadata:', metadata);
    console.log('📱 URLs Responsivas:', responsive);
    
    return { info, metadata, responsive };
  },
  
  /**
   * Prueba conversiones entre proveedores
   */
  testConversions: (imageUrl) => {
    console.log('🔄 Probando conversiones para:', imageUrl);
    
    const toImageKit = convertCloudinaryToImageKit(imageUrl);
    const toCloudinary = convertImageKitToCloudinary(imageUrl);
    
    console.log('→ ImageKit:', toImageKit);
    console.log('→ Cloudinary:', toCloudinary);
    
    return { toImageKit, toCloudinary };
  }
};