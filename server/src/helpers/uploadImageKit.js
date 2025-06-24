// server/src/helpers/uploadImageKit.js
// Helper para manejo de uploads con ImageKit - Optimizado y compatible

const ImageKit = require('imagekit');
const multer = require('multer');
const path = require('path');

// Configuración de ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

// Validar configuración al cargar el módulo
if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
  console.warn('⚠️ ADVERTENCIA: Credenciales de ImageKit no configuradas completamente');
  console.warn('   Verifica IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT en .env');
}

// Storage personalizado para ImageKit
const imagekitStorage = {
  _handleFile: async (req, file, cb) => {
    console.log('📁 Procesando archivo en ImageKit:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size ? `${(file.size / 1024 / 1024).toFixed(2)}MB` : 'Desconocido'
    });

    try {
      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const extension = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, extension);
      const fileName = `${timestamp}-${baseName}${extension}`;
      const folderPath = 'laces-uploads'; // Misma estructura que Cloudinary

      // Convertir stream a buffer para ImageKit
      const chunks = [];
      file.stream.on('data', chunk => chunks.push(chunk));
      file.stream.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          
          console.log('☁️ Subiendo a ImageKit...');
          
          // Upload a ImageKit con transformaciones automáticas
          const uploadResponse = await imagekit.upload({
            file: buffer,
            fileName: fileName,
            folder: folderPath
            // ✅ Sin transformaciones por ahora - se pueden aplicar después via URL
          });

          console.log('✅ Upload exitoso a ImageKit:', {
            fileId: uploadResponse.fileId,
            url: uploadResponse.url,
            size: uploadResponse.size,
            name: uploadResponse.name
          });

          // 🔥 CONFIGURAR req.file COMPATIBLE CON CONTROLADORES
          cb(null, {
            fieldname: file.fieldname,
            originalname: file.originalname,
            encoding: file.encoding,
            mimetype: uploadResponse.fileType || file.mimetype,
            filename: uploadResponse.name,
            path: uploadResponse.url,          // ← CRÍTICO: URL completa de ImageKit
            size: uploadResponse.size,
            fileId: uploadResponse.fileId,
            url: uploadResponse.url,           // Alias para compatibilidad
            width: uploadResponse.width,
            height: uploadResponse.height,
            format: uploadResponse.fileType?.split('/')[1] || 'webp',
            type: 'imagekit'                   // Identificador del tipo
          });

        } catch (uploadError) {
          console.error('❌ Error subiendo a ImageKit:', uploadError);
          cb(uploadError);
        }
      });

      file.stream.on('error', (streamError) => {
        console.error('❌ Error en stream:', streamError);
        cb(streamError);
      });

    } catch (error) {
      console.error('❌ Error procesando archivo:', error);
      cb(error);
    }
  },

  _removeFile: async (req, file, cb) => {
    // Función para eliminar archivo de ImageKit si es necesario
    try {
      if (file.fileId) {
        await imagekit.deleteFile(file.fileId);
        console.log('🗑️ Archivo eliminado de ImageKit:', file.fileId);
      }
      cb();
    } catch (error) {
      console.error('⚠️ Error eliminando archivo de ImageKit:', error);
      cb(); // No fallar si no se puede eliminar
    }
  }
};

// Configuración de multer con storage personalizado
const upload = multer({
  storage: imagekitStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB límite (antes de compresión)
    files: 1                     // Solo 1 archivo por request
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 Validando archivo:', {
      originalname: file.originalname,
      mimetype: file.mimetype
    });

    // Solo permitir imágenes
    if (file.mimetype.startsWith('image/')) {
      // Formatos permitidos
      const formatosPermitidos = [
        'image/jpeg',
        'image/jpg', 
        'image/png', 
        'image/gif', 
        'image/webp',
        'image/svg+xml'
      ];

      if (formatosPermitidos.includes(file.mimetype)) {
        console.log('✅ Archivo válido aceptado');
        cb(null, true);
      } else {
        console.log('❌ Formato de imagen no permitido:', file.mimetype);
        cb(new Error(`Formato ${file.mimetype} no permitido. Usa: JPG, PNG, GIF, WebP, SVG`), false);
      }
    } else {
      console.log('❌ Archivo no es una imagen:', file.mimetype);
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
}).single('imagen');

// Middleware para logging de resultados
const logImageKitResult = (req, res, next) => {
  if (req.file) {
    console.log('🖼️ Upload completado en ImageKit:', {
      url: req.file.url,
      format: req.file.format,
      size: req.file.size,
      width: req.file.width,
      height: req.file.height,
      fileId: req.file.fileId,
      type: req.file.type
    });

    // Agregar headers útiles para debugging
    res.set('X-Upload-Service', 'ImageKit');
    res.set('X-File-ID', req.file.fileId);
  }
  next();
};

// Función helper para eliminar archivos de ImageKit
const deleteImageKitFile = async (fileIdOrUrl) => {
  try {
    let fileId = fileIdOrUrl;
    
    // Si es una URL, extraer el fileId
    if (typeof fileIdOrUrl === 'string' && fileIdOrUrl.includes('ik.imagekit.io')) {
      // Extraer fileId de la URL de ImageKit
      const urlParts = fileIdOrUrl.split('/');
      const fileWithParams = urlParts[urlParts.length - 1];
      fileId = fileWithParams.split('?')[0]; // Remover parámetros de transformación
    }

    if (fileId) {
      await imagekit.deleteFile(fileId);
      console.log('🗑️ Archivo eliminado de ImageKit:', fileId);
      return true;
    } else {
      console.warn('⚠️ No se pudo determinar fileId para eliminar');
      return false;
    }
  } catch (error) {
    console.error('❌ Error eliminando archivo de ImageKit:', error.message);
    return false;
  }
};

// Función helper para obtener información de un archivo
const getImageKitFileInfo = async (fileId) => {
  try {
    const fileDetails = await imagekit.getFileDetails(fileId);
    return {
      fileId: fileDetails.fileId,
      name: fileDetails.name,
      url: fileDetails.url,
      filePath: fileDetails.filePath,
      size: fileDetails.size,
      fileType: fileDetails.fileType,
      width: fileDetails.width,
      height: fileDetails.height,
      createdAt: fileDetails.createdAt,
      updatedAt: fileDetails.updatedAt
    };
  } catch (error) {
    console.error('❌ Error obteniendo información del archivo:', error.message);
    return null;
  }
};

// Función para generar URLs con transformaciones dinámicas
const generateImageKitUrl = (filePath, transformations = {}) => {
  try {
    const url = imagekit.url({
      path: filePath,
      transformation: [transformations]
    });
    return url;
  } catch (error) {
    console.error('❌ Error generando URL de ImageKit:', error.message);
    return filePath; // Retornar URL original si falla
  }
};

// Función para verificar conexión con ImageKit
const testImageKitConnection = async () => {
  try {
    console.log('🔍 Probando conexión con ImageKit...');
    
    // Intentar listar archivos para verificar credenciales
    const result = await imagekit.listFiles({
      limit: 1
    });
    
    console.log('✅ Conexión con ImageKit exitosa');
    return {
      success: true,
      message: 'Conexión exitosa',
      totalFiles: result.length
    };
  } catch (error) {
    console.error('❌ Error conectando con ImageKit:', error.message);
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
};

// Exportar funciones y configuraciones
module.exports = {
  upload,
  logImageKitResult,
  deleteImageKitFile,
  getImageKitFileInfo,
  generateImageKitUrl,
  testImageKitConnection,
  imagekit // Instancia de ImageKit para uso avanzado
};

// Auto-test de conexión al cargar el módulo (solo en desarrollo)
if (process.env.NODE_ENV !== 'production' && process.env.IMAGEKIT_PUBLIC_KEY) {
  testImageKitConnection()
    .then(result => {
      if (result.success) {
        console.log('🔗 ImageKit helper cargado y conectado exitosamente');
      } else {
        console.warn('⚠️ ImageKit helper cargado pero con problemas de conexión');
      }
    })
    .catch(error => {
      console.warn('⚠️ No se pudo probar conexión de ImageKit al cargar helper');
    });
}