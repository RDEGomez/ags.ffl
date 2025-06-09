// server/src/helpers/uploadConfig.js

const isProduction = process.env.NODE_ENV === 'production';
const useCloudinary = process.env.USE_CLOUDINARY === 'true';

console.log('\n🔍 UPLOAD CONFIGURATION DEBUG (OPTIMIZADO):');
console.log('  📊 NODE_ENV:', process.env.NODE_ENV);
console.log('  ☁️ USE_CLOUDINARY:', process.env.USE_CLOUDINARY);
console.log('  🏷️ CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ Configurado' : '❌ NO CONFIGURADO');
console.log('  🔑 CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✅ Configurado' : '❌ NO CONFIGURADO');
console.log('  🔐 CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✅ Configurado' : '❌ NO CONFIGURADO');
console.log('  🏭 isProduction:', isProduction);
console.log('  ☁️ useCloudinary:', useCloudinary);

// Usar Cloudinary en producción O si está habilitado manualmente
if (isProduction || useCloudinary) {
  console.log('✅ Cargando configuración OPTIMIZADA de CLOUDINARY...');
  const { upload, logCloudinaryResult } = require('./uploadCloudinary');
  
  // Exportar con middleware de logging
  module.exports = (req, res, next) => {
    upload(req, res, (err) => {
      if (err) {
        console.error('❌ Error en upload de Cloudinary:', err);
        return next(err);
      }
      logCloudinaryResult(req, res, next);
    });
  };
} else {
  console.log('✅ Cargando configuración OPTIMIZADA LOCAL con Sharp...');
  const { upload, processImageWithSharp } = require('./uploadImagesOptimized');
  
  // Exportar con procesamiento de Sharp
  module.exports = (req, res, next) => {
    upload(req, res, (err) => {
      if (err) {
        console.error('❌ Error en upload local:', err);
        return next(err);
      }
      processImageWithSharp(req, res, next);
    });
  };
}

console.log('  📁 Sistema de optimización:', (isProduction || useCloudinary) ? 'CLOUDINARY + WebP' : 'LOCAL + Sharp + WebP');
console.log('  🎯 Optimizaciones activas: ✅ Compresión, ✅ Redimensionamiento, ✅ WebP\n');