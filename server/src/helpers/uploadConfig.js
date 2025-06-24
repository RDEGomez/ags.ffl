// server/src/helpers/uploadConfig.js
// Configuración universal de upload - Actualizada para soportar ImageKit

const isProduction = process.env.NODE_ENV === 'production';
const useCloudinary = process.env.USE_CLOUDINARY === 'true';
const useImageKit = process.env.USE_IMAGEKIT === 'true';

console.log('\n🔍 UPLOAD CONFIGURATION DEBUG (MULTI-PROVIDER):');
console.log('  📊 NODE_ENV:', process.env.NODE_ENV);
console.log('  ☁️ USE_CLOUDINARY:', process.env.USE_CLOUDINARY);
console.log('  🖼️ USE_IMAGEKIT:', process.env.USE_IMAGEKIT);
console.log('  🏭 isProduction:', isProduction);

// Verificar configuraciones disponibles
const cloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET
);

const imagekitConfigured = !!(
  process.env.IMAGEKIT_URL_ENDPOINT && 
  process.env.IMAGEKIT_PUBLIC_KEY && 
  process.env.IMAGEKIT_PRIVATE_KEY
);

console.log('  🔑 Cloudinary configurado:', cloudinaryConfigured ? '✅' : '❌');
console.log('  🔑 ImageKit configurado:', imagekitConfigured ? '✅' : '❌');

// Determinar proveedor de upload basado en prioridades
let uploadProvider = 'local';
let uploadConfig = null;

// Lógica de selección de proveedor
if (useImageKit && imagekitConfigured) {
  // ImageKit tiene prioridad si está explícitamente habilitado
  uploadProvider = 'imagekit';
  console.log('🎯 Proveedor seleccionado: IMAGEKIT (explícitamente habilitado)');
  
} else if (useCloudinary && cloudinaryConfigured) {
  // Cloudinary como segunda opción
  uploadProvider = 'cloudinary';
  console.log('🎯 Proveedor seleccionado: CLOUDINARY (explícitamente habilitado)');
  
} else if (isProduction) {
  // En producción, intentar usar algún servicio cloud disponible
  if (imagekitConfigured) {
    uploadProvider = 'imagekit';
    console.log('🎯 Proveedor seleccionado: IMAGEKIT (producción - ImageKit disponible)');
  } else if (cloudinaryConfigured) {
    uploadProvider = 'cloudinary';
    console.log('🎯 Proveedor seleccionado: CLOUDINARY (producción - Cloudinary disponible)');
  } else {
    uploadProvider = 'local';
    console.log('⚠️ Proveedor seleccionado: LOCAL (producción sin servicios cloud configurados)');
  }
} else {
  // En desarrollo, usar local por defecto
  uploadProvider = 'local';
  console.log('🎯 Proveedor seleccionado: LOCAL (desarrollo)');
}

// Cargar configuración según el proveedor seleccionado
try {
  switch (uploadProvider) {
    case 'imagekit':
      console.log('✅ Cargando configuración OPTIMIZADA de IMAGEKIT...');
      const { upload: imagekitUpload, logImageKitResult } = require('./uploadImageKit');
      
      uploadConfig = (req, res, next) => {
        imagekitUpload(req, res, (err) => {
          if (err) {
            console.error('❌ Error en upload de ImageKit:', err);
            // Fallback a Cloudinary si está disponible
            if (cloudinaryConfigured && !useImageKit) {
              console.log('🔄 Intentando fallback a Cloudinary...');
              return loadCloudinaryFallback(req, res, next);
            }
            return next(err);
          }
          logImageKitResult(req, res, next);
        });
      };
      
      // Agregar metadata del proveedor
      uploadConfig.provider = 'imagekit';
      uploadConfig.features = ['webp', 'compression', 'resize', 'progressive'];
      break;

    case 'cloudinary':
      console.log('✅ Cargando configuración OPTIMIZADA de CLOUDINARY...');
      const { upload: cloudinaryUpload, logCloudinaryResult } = require('./uploadCloudinary');
      
      uploadConfig = (req, res, next) => {
        cloudinaryUpload(req, res, (err) => {
          if (err) {
            console.error('❌ Error en upload de Cloudinary:', err);
            // Fallback a ImageKit si está disponible
            if (imagekitConfigured && !useCloudinary) {
              console.log('🔄 Intentando fallback a ImageKit...');
              return loadImageKitFallback(req, res, next);
            }
            return next(err);
          }
          logCloudinaryResult(req, res, next);
        });
      };
      
      uploadConfig.provider = 'cloudinary';
      uploadConfig.features = ['webp', 'compression', 'resize', 'progressive'];
      break;

    case 'local':
    default:
      console.log('✅ Cargando configuración OPTIMIZADA LOCAL con Sharp...');
      const { upload: localUpload, processImageWithSharp } = require('./uploadImagesOptimized');
      
      uploadConfig = (req, res, next) => {
        localUpload(req, res, (err) => {
          if (err) {
            console.error('❌ Error en upload local:', err);
            return next(err);
          }
          processImageWithSharp(req, res, next);
        });
      };
      
      uploadConfig.provider = 'local';
      uploadConfig.features = ['webp', 'compression', 'resize', 'sharp'];
      break;
  }

  console.log('  📁 Sistema de optimización:', uploadConfig.provider.toUpperCase());
  console.log('  🎯 Optimizaciones activas:', uploadConfig.features.join(', '));
  console.log('  🔧 Fallbacks disponibles:', getFallbackOptions());

} catch (error) {
  console.error('❌ Error cargando configuración de upload:', error.message);
  
  // Fallback de emergencia a local
  console.log('🚨 Cargando configuración LOCAL de emergencia...');
  const { upload: emergencyUpload } = require('./uploadImagesOptimized');
  uploadConfig = emergencyUpload;
  uploadConfig.provider = 'local-emergency';
  uploadConfig.features = ['basic'];
}

// Función para cargar Cloudinary como fallback
function loadCloudinaryFallback(req, res, next) {
  try {
    const { upload: cloudinaryUpload, logCloudinaryResult } = require('./uploadCloudinary');
    cloudinaryUpload(req, res, (err) => {
      if (err) {
        console.error('❌ Fallback a Cloudinary también falló:', err);
        return next(err);
      }
      console.log('✅ Fallback a Cloudinary exitoso');
      logCloudinaryResult(req, res, next);
    });
  } catch (error) {
    console.error('❌ Error cargando fallback de Cloudinary:', error);
    next(error);
  }
}

// Función para cargar ImageKit como fallback
function loadImageKitFallback(req, res, next) {
  try {
    const { upload: imagekitUpload, logImageKitResult } = require('./uploadImageKit');
    imagekitUpload(req, res, (err) => {
      if (err) {
        console.error('❌ Fallback a ImageKit también falló:', err);
        return next(err);
      }
      console.log('✅ Fallback a ImageKit exitoso');
      logImageKitResult(req, res, next);
    });
  } catch (error) {
    console.error('❌ Error cargando fallback de ImageKit:', error);
    next(error);
  }
}

// Función helper para obtener opciones de fallback disponibles
function getFallbackOptions() {
  const options = ['local'];
  if (cloudinaryConfigured) options.push('cloudinary');
  if (imagekitConfigured) options.push('imagekit');
  return options;
}

// Función para obtener información del proveedor actual
function getCurrentProviderInfo() {
  return {
    provider: uploadConfig?.provider || 'unknown',
    features: uploadConfig?.features || [],
    fallbacks: getFallbackOptions(),
    configuration: {
      cloudinary: cloudinaryConfigured,
      imagekit: imagekitConfigured,
      local: true
    }
  };
}

// Función para cambiar proveedor en runtime (útil para testing)
function switchProvider(newProvider) {
  if (!['imagekit', 'cloudinary', 'local'].includes(newProvider)) {
    throw new Error(`Proveedor no válido: ${newProvider}`);
  }

  console.log(`🔄 Cambiando proveedor de ${uploadConfig?.provider || 'unknown'} a ${newProvider}`);
  
  // Actualizar variables de entorno temporalmente
  process.env.USE_IMAGEKIT = newProvider === 'imagekit' ? 'true' : 'false';
  process.env.USE_CLOUDINARY = newProvider === 'cloudinary' ? 'true' : 'false';
  
  // Recargar configuración
  delete require.cache[require.resolve('./uploadConfig')];
  return require('./uploadConfig');
}

// Exportar configuración principal y funciones helper
module.exports = uploadConfig;

// Exportar funciones adicionales como propiedades
module.exports.getCurrentProviderInfo = getCurrentProviderInfo;
module.exports.switchProvider = switchProvider;
module.exports.getFallbackOptions = getFallbackOptions;

// Log final de configuración
console.log(`\n🚀 Upload configurado exitosamente con ${uploadConfig.provider.toUpperCase()}`);
console.log('=' * 60 + '\n');