// helpers/universalUploadHandler.js - Handler universal mejorado

/**
 * Procesa el archivo subido y retorna la información de manera consistente
 */
const processUploadedFile = (req) => {
  if (!req.file) return null;
  
  // Detectar el tipo de upload
  const isCloudinary = !!req.file.path && req.file.path.includes('cloudinary.com');
  
  if (isCloudinary) {
    // Cloudinary upload
    return {
      filename: req.file.filename || req.file.public_id,
      path: req.file.path,           // URL completa de Cloudinary
      url: req.file.path,            // Alias para consistencia
      size: req.file.bytes,
      format: req.file.format,
      type: 'cloudinary',
      publicId: req.file.public_id
    };
  } else {
    // Local upload - construir URL base dinámicamente
    const baseUrl = req ? `${req.protocol}://${req.get('host')}` : process.env.BACKEND_URL || 'http://localhost:3000';
    return {
      filename: req.file.filename,
      path: req.file.filename,       // Solo filename para local
      url: `${baseUrl}/uploads/${req.file.filename}`, // URL completa construida
      size: req.file.size,
      format: req.file.mimetype.split('/')[1],
      type: 'local',
      publicId: null
    };
  }
};

/**
 * Función helper para obtener la URL/path que se debe guardar en la BD
 * Retorna el path completo para Cloudinary, solo filename para local
 */
const getStoragePath = (req) => {
  const fileInfo = processUploadedFile(req);
  if (!fileInfo) return null;
  
  // Para Cloudinary, guardar la URL completa
  // Para local, guardar solo el filename (para mantener flexibilidad)
  return fileInfo.type === 'cloudinary' ? fileInfo.url : fileInfo.filename;
};

/**
 * Función helper para eliminar archivos (funciona con ambos tipos)
 */
const deleteFile = async (filePath) => {
  if (!filePath) return;
  
  try {
    // Si es URL de Cloudinary
    if (filePath.includes('cloudinary.com')) {
      const cloudinary = require('cloudinary').v2;
      
      // Extraer public_id de la URL
      const urlParts = filePath.split('/');
      const fileWithExtension = urlParts[urlParts.length - 1];
      const publicId = fileWithExtension.split('.')[0];
      const folder = 'laces-uploads';
      
      await cloudinary.uploader.destroy(`${folder}/${publicId}`);
      console.log('🗑️ Archivo eliminado de Cloudinary:', publicId);
    } else {
      // Es archivo local
      const fs = require('fs');
      const path = require('path');
      const fullPath = path.join(__dirname, '../uploads', filePath);
      
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log('🗑️ Archivo local eliminado:', filePath);
      }
    }
  } catch (error) {
    console.error('❌ Error eliminando archivo:', error);
  }
};

/**
 * Middleware universal que añade información procesada al request
 */
const universalUploadMiddleware = (req, res, next) => {
  if (req.file) {
    req.fileInfo = processUploadedFile(req);
    console.log(`📁 Archivo procesado [${req.fileInfo.type}]:`, {
      filename: req.fileInfo.filename,
      url: req.fileInfo.url,
      size: `${Math.round(req.fileInfo.size / 1024)}KB`
    });
  }
  next();
};

module.exports = {
  processUploadedFile,
  universalUploadMiddleware,
  getStoragePath,
  deleteFile
};