// uploadConfig.js con debugging
const isProduction = process.env.NODE_ENV === 'production';
const useCloudinary = process.env.USE_CLOUDINARY === 'true';

// 🔥 LOGS DE DEBUGGING
console.log('\n🔍 UPLOAD CONFIGURATION DEBUG:');
console.log('  📊 NODE_ENV:', process.env.NODE_ENV);
console.log('  ☁️ USE_CLOUDINARY:', process.env.USE_CLOUDINARY);
console.log('  🏷️ CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ Configurado' : '❌ NO CONFIGURADO');
console.log('  🔑 CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✅ Configurado' : '❌ NO CONFIGURADO');
console.log('  🔐 CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✅ Configurado' : '❌ NO CONFIGURADO');
console.log('  🏭 isProduction:', isProduction);
console.log('  ☁️ useCloudinary:', useCloudinary);
console.log('  📁 Resultado: Usando', (isProduction || useCloudinary) ? 'CLOUDINARY' : 'LOCAL');

// Usar Cloudinary en producción O si está habilitado manualmente
if (isProduction || useCloudinary) {
  console.log('✅ Cargando configuración de CLOUDINARY...');
  module.exports = require('./uploadCloudinary');
} else {
  console.log('✅ Cargando configuración LOCAL...');
  module.exports = require('./uploadImages');
}