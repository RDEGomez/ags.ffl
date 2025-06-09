// server/src/helpers/uploadImagesOptimized.js

const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Crear directorio si no existe
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Directorio de uploads creado:', uploadsDir);
}

const storage = multer.memoryStorage(); // Usar memoria para procesar con Sharp

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB límite
  },
  fileFilter: (req, file, cb) => {
    console.log('📁 Archivo recibido localmente:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`
    });

    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'), false);
    }
  }
}).single('imagen');

// 🔥 Middleware para procesar imagen con Sharp
const processImageWithSharp = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const filename = `${crypto.randomUUID()}.webp`;
    const filepath = path.join(uploadsDir, filename);

    console.log('🖼️ Procesando imagen con Sharp:', {
      original_size: `${(req.file.size / 1024 / 1024).toFixed(2)}MB`,
      original_type: req.file.mimetype
    });

    // Procesar imagen con Sharp
    await sharp(req.file.buffer)
      .resize(800, 800, { 
        fit: 'inside',        // Mantener aspecto, no exceder dimensiones
        withoutEnlargement: true // No agrandar imágenes pequeñas
      })
      .webp({ 
        quality: 80,          // Calidad 80%
        effort: 6             // Máximo esfuerzo de compresión
      })
      .toFile(filepath);

    // Obtener estadísticas del archivo final
    const stats = fs.statSync(filepath);
    const compressionRatio = ((req.file.size - stats.size) / req.file.size * 100).toFixed(1);

    console.log('✅ Imagen procesada con Sharp:', {
      compressed_size: `${(stats.size / 1024 / 1024).toFixed(2)}MB`,
      compression: `${compressionRatio}% reducción`,
      format: 'WebP',
      filename
    });

    // Agregar información del archivo procesado al request
    req.file.filename = filename;
    req.file.path = filepath;
    req.file.size = stats.size;
    req.file.mimetype = 'image/webp';

    next();
  } catch (error) {
    console.error('❌ Error procesando imagen con Sharp:', error);
    return res.status(500).json({
      mensaje: 'Error procesando imagen',
      error: error.message
    });
  }
};

module.exports = { upload, processImageWithSharp };