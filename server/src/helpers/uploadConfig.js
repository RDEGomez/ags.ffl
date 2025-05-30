// uploadConfig.js
const isProduction = process.env.NODE_ENV === 'production';
const useCloudinary = process.env.USE_CLOUDINARY === 'true';

// Usar Cloudinary en producción O si está habilitado manualmente
if (isProduction || useCloudinary) {
  module.exports = require('./uploadCloudinary');
} else {
  module.exports = require('./uploadImages');
}