// server/src/helpers/uploadCloudinary.js

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'laces-uploads',
    // 🔥 OPTIMIZACIONES AUTOMÁTICAS
    format: async (req, file) => 'webp', // WebP para mejor compresión
    public_id: (req, file) => `${Date.now()}-${file.originalname.split('.')[0]}`,
    // 🔥 TRANSFORMACIONES AUTOMÁTICAS
    transformation: [
      {
        width: 800,           // Ancho máximo 800px
        height: 800,          // Alto máximo 800px
        crop: 'limit',        // Solo redimensionar si es más grande
        quality: 'auto:good', // Calidad automática optimizada
        fetch_format: 'auto', // Formato automático (WebP cuando sea posible)
        flags: 'progressive', // Carga progresiva
      }
    ],
  },
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB límite (antes de compresión)
  },
  fileFilter: (req, file, cb) => {
    console.log('📁 Archivo recibido en Cloudinary:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`
    });

    // Solo imágenes
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'), false);
    }
  }
}).single('imagen');

// Middleware para logging de resultados
const logCloudinaryResult = (req, res, next) => {
  if (req.file) {
    console.log('☁️ Imagen subida a Cloudinary:', {
      url: req.file.path,
      format: req.file.format,
      bytes: req.file.bytes,
      width: req.file.width,
      height: req.file.height,
      public_id: req.file.public_id
    });
  }
  next();
};

module.exports = { upload, logCloudinaryResult };