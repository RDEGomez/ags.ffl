// scripts/cloudinaryInventory.js
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function inventarioCloudinary() {
  console.log('📊 Iniciando inventario de Cloudinary...');
  
  try {
    // Obtener información de usage
    const usage = await cloudinary.api.usage();
    console.log('💾 Uso actual:', {
      transformaciones: usage.transformations,
      almacenamiento: `${(usage.storage.total_usage / 1024 / 1024).toFixed(2)} MB`,
      bandwidth: `${(usage.bandwidth.total_usage / 1024 / 1024).toFixed(2)} MB`,
      creditos: usage.credits
    });

    // Listar todos los recursos
    const recursos = await cloudinary.api.resources({
      type: 'upload',
      max_results: 500
    });

    console.log(`📁 Total de archivos: ${recursos.resources.length}`);
    
    let totalSize = 0;
    const estructura = {};

    recursos.resources.forEach(recurso => {
      totalSize += recurso.bytes;
      
      // Agrupar por carpeta
      const folder = recurso.public_id.includes('/') 
        ? recurso.public_id.split('/')[0] 
        : 'root';
      
      if (!estructura[folder]) {
        estructura[folder] = { count: 0, size: 0 };
      }
      estructura[folder].count++;
      estructura[folder].size += recurso.bytes;
    });

    console.log(`📏 Tamaño total: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log('📂 Estructura de carpetas:', estructura);

    // Verificar si cabe en ImageKit gratuito (20GB = 20,480 MB)
    const totalMB = totalSize / 1024 / 1024;
    const cabeEnImageKit = totalMB < 20000; // 20GB en MB
    
    console.log(`✅ ¿Cabe en ImageKit gratuito? ${cabeEnImageKit ? 'SÍ' : 'NO'}`);
    
    if (!cabeEnImageKit) {
      console.log('⚠️ ATENCIÓN: El contenido actual excede el plan gratuito de ImageKit');
      console.log('💡 Opciones:');
      console.log('   1. Upgrade a plan paid de ImageKit');
      console.log('   2. Limpiar archivos no utilizados en Cloudinary');
      console.log('   3. Migración selectiva de archivos activos');
    }

    // Generar reporte detallado
    const reporte = {
      timestamp: new Date().toISOString(),
      totalArchivos: recursos.resources.length,
      totalSizeMB: totalMB,
      cabeEnImageKitGratuito: cabeEnImageKit,
      estructura,
      recursos: recursos.resources.map(r => ({
        public_id: r.public_id,
        url: r.secure_url,
        size: r.bytes,
        format: r.format,
        created_at: r.created_at
      }))
    };

    // Guardar reporte
    const fs = require('fs');
    fs.writeFileSync('cloudinary-inventory.json', JSON.stringify(reporte, null, 2));
    console.log('💾 Reporte guardado en cloudinary-inventory.json');

    return reporte;

  } catch (error) {
    console.error('❌ Error en inventario:', error);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  inventarioCloudinary();
}

module.exports = { inventarioCloudinary };