// 🔥 SCRIPT DE MIGRACIÓN DE IMÁGENES EXISTENTES
// server/scripts/migrateCloudinaryImages.js

const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
require('dotenv').config();

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tu_db');

// Modelos (ajusta según tus modelos)
const Usuario = require('../src/models/Usuario');
const Equipo = require('../src/models/Equipo');

// 🎯 CONFIGURACIÓN DE OPTIMIZACIONES
const OPTIMIZATIONS = {
  width: 800,
  height: 800,
  crop: 'limit',
  quality: 'auto:good',
  fetch_format: 'auto', // WebP automático
  flags: 'progressive'
};

// 🔍 FUNCIÓN PARA DETECTAR SI UNA IMAGEN YA ESTÁ OPTIMIZADA
const isImageOptimized = (imageUrl) => {
  if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
    return false;
  }
  
  // Verificar si ya tiene transformaciones aplicadas
  return imageUrl.includes('w_800') || 
         imageUrl.includes('f_auto') || 
         imageUrl.includes('q_auto');
};

// 🔄 FUNCIÓN PARA GENERAR URL OPTIMIZADA
const generateOptimizedUrl = (originalUrl) => {
  if (!originalUrl || !originalUrl.includes('cloudinary.com')) {
    return originalUrl;
  }

  try {
    // Extraer public_id de la URL
    const urlParts = originalUrl.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    const pathAfterUpload = urlParts.slice(uploadIndex + 1).join('/');
    
    // Remover extensión si existe
    const publicId = pathAfterUpload.replace(/\.[^/.]+$/, '');
    
    // Generar URL optimizada
    const optimizedUrl = cloudinary.url(publicId, {
      transformation: [OPTIMIZATIONS],
      secure: true
    });

    console.log('🔄 URL transformada:', {
      original: originalUrl.substring(0, 50) + '...',
      optimized: optimizedUrl.substring(0, 50) + '...'
    });

    return optimizedUrl;
  } catch (error) {
    console.error('❌ Error generando URL optimizada:', error);
    return originalUrl;
  }
};

// 📊 FUNCIÓN PARA OBTENER ESTADÍSTICAS
const getImageStats = async () => {
  try {
    console.log('📊 Obteniendo estadísticas de imágenes...\n');

    // Contar usuarios con imágenes
    const usuariosConImagen = await Usuario.countDocuments({ 
      imagen: { $exists: true, $ne: '', $ne: null } 
    });
    
    // Contar equipos con imágenes
    const equiposConImagen = await Equipo.countDocuments({ 
      imagen: { $exists: true, $ne: '', $ne: null } 
    });

    // Obtener usuarios con imágenes de Cloudinary no optimizadas
    const usuariosCloudinary = await Usuario.find({ 
      imagen: { $regex: 'cloudinary.com' } 
    });

    const usuariosNoOptimizados = usuariosCloudinary.filter(user => 
      !isImageOptimized(user.imagen)
    );

    // Obtener equipos con imágenes de Cloudinary no optimizadas
    const equiposCloudinary = await Equipo.find({ 
      imagen: { $regex: 'cloudinary.com' } 
    });

    const equiposNoOptimizados = equiposCloudinary.filter(equipo => 
      !isImageOptimized(equipo.imagen)
    );

    const stats = {
      usuarios: {
        total: usuariosConImagen,
        cloudinary: usuariosCloudinary.length,
        noOptimizados: usuariosNoOptimizados.length,
        yaOptimizados: usuariosCloudinary.length - usuariosNoOptimizados.length
      },
      equipos: {
        total: equiposConImagen,
        cloudinary: equiposCloudinary.length,
        noOptimizados: equiposNoOptimizados.length,
        yaOptimizados: equiposCloudinary.length - equiposNoOptimizados.length
      }
    };

    console.log('📈 ESTADÍSTICAS ACTUALES:');
    console.log('  👥 Usuarios:');
    console.log(`    Total con imagen: ${stats.usuarios.total}`);
    console.log(`    En Cloudinary: ${stats.usuarios.cloudinary}`);
    console.log(`    ❌ No optimizados: ${stats.usuarios.noOptimizados}`);
    console.log(`    ✅ Ya optimizados: ${stats.usuarios.yaOptimizados}`);
    
    console.log('  🏆 Equipos:');
    console.log(`    Total con imagen: ${stats.equipos.total}`);
    console.log(`    En Cloudinary: ${stats.equipos.cloudinary}`);
    console.log(`    ❌ No optimizados: ${stats.equipos.noOptimizados}`);
    console.log(`    ✅ Ya optimizados: ${stats.equipos.yaOptimizados}\n`);

    return stats;
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return null;
  }
};

// 🔄 FUNCIÓN PARA MIGRAR USUARIOS
const migrateUsuarios = async (dryRun = true) => {
  try {
    console.log('🔄 Iniciando migración de usuarios...\n');

    const usuarios = await Usuario.find({ 
      imagen: { $regex: 'cloudinary.com' } 
    });

    const usuariosToMigrate = usuarios.filter(user => !isImageOptimized(user.imagen));

    console.log(`📋 Usuarios a migrar: ${usuariosToMigrate.length}`);

    if (usuariosToMigrate.length === 0) {
      console.log('✅ Todos los usuarios ya están optimizados!\n');
      return;
    }

    for (let i = 0; i < usuariosToMigrate.length; i++) {
      const usuario = usuariosToMigrate[i];
      const optimizedUrl = generateOptimizedUrl(usuario.imagen);
      
      console.log(`🔄 [${i + 1}/${usuariosToMigrate.length}] Procesando: ${usuario.nombre}`);
      
      if (!dryRun) {
        await Usuario.findByIdAndUpdate(usuario._id, {
          imagen: optimizedUrl
        });
        console.log(`   ✅ Usuario actualizado`);
      } else {
        console.log(`   🔍 DRY RUN - No se guardó cambio`);
      }

      // Pequeña pausa para no sobrecargar
      if (i % 10 === 0 && i > 0) {
        console.log(`   ⏸️  Pausa cada 10 registros...\n`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`✅ Migración de usuarios completada!\n`);
  } catch (error) {
    console.error('❌ Error migrando usuarios:', error);
  }
};

// 🔄 FUNCIÓN PARA MIGRAR EQUIPOS
const migrateEquipos = async (dryRun = true) => {
  try {
    console.log('🔄 Iniciando migración de equipos...\n');

    const equipos = await Equipo.find({ 
      imagen: { $regex: 'cloudinary.com' } 
    });

    const equiposToMigrate = equipos.filter(equipo => !isImageOptimized(equipo.imagen));

    console.log(`📋 Equipos a migrar: ${equiposToMigrate.length}`);

    if (equiposToMigrate.length === 0) {
      console.log('✅ Todos los equipos ya están optimizados!\n');
      return;
    }

    for (let i = 0; i < equiposToMigrate.length; i++) {
      const equipo = equiposToMigrate[i];
      const optimizedUrl = generateOptimizedUrl(equipo.imagen);
      
      console.log(`🔄 [${i + 1}/${equiposToMigrate.length}] Procesando: ${equipo.nombre}`);
      
      if (!dryRun) {
        await Equipo.findByIdAndUpdate(equipo._id, {
          imagen: optimizedUrl
        });
        console.log(`   ✅ Equipo actualizado`);
      } else {
        console.log(`   🔍 DRY RUN - No se guardó cambio`);
      }

      // Pequeña pausa para no sobrecargar
      if (i % 10 === 0 && i > 0) {
        console.log(`   ⏸️  Pausa cada 10 registros...\n`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`✅ Migración de equipos completada!\n`);
  } catch (error) {
    console.error('❌ Error migrando equipos:', error);
  }
};

// 🚀 FUNCIÓN PRINCIPAL
const main = async () => {
  console.log('🚀 INICIANDO MIGRACIÓN DE IMÁGENES CLOUDINARY\n');
  console.log('='*50);

  try {
    // Obtener estadísticas iniciales
    const initialStats = await getImageStats();
    
    if (!initialStats) {
      console.log('❌ No se pudieron obtener estadísticas. Abortando.');
      return;
    }

    const totalToMigrate = initialStats.usuarios.noOptimizados + initialStats.equipos.noOptimizados;
    
    if (totalToMigrate === 0) {
      console.log('🎉 ¡Todas las imágenes ya están optimizadas! No hay nada que migrar.');
      return;
    }

    // Verificar argumentos de línea de comandos
    const args = process.argv.slice(2);
    const dryRun = !args.includes('--apply');
    
    if (dryRun) {
      console.log('🔍 MODO DRY RUN - Solo simulación, no se guardarán cambios');
      console.log('   Para aplicar cambios reales, ejecuta: node migrateCloudinaryImages.js --apply\n');
    } else {
      console.log('⚡ MODO APLICAR - Se guardarán los cambios reales\n');
    }

    // Confirmar antes de proceder
    if (!dryRun) {
      console.log('⚠️  ADVERTENCIA: Esto modificará URLs en la base de datos.');
      console.log('   Asegúrate de tener un backup antes de continuar.\n');
      
      // En producción, podrías agregar una confirmación manual aquí
      // const readline = require('readline'); // etc...
    }

    // Ejecutar migraciones
    await migrateUsuarios(dryRun);
    await migrateEquipos(dryRun);

    // Estadísticas finales
    if (!dryRun) {
      console.log('📊 Obteniendo estadísticas finales...\n');
      await getImageStats();
    }

    console.log('🎉 ¡MIGRACIÓN COMPLETADA!\n');
    
    if (dryRun) {
      console.log('💡 Para aplicar los cambios reales, ejecuta:');
      console.log('   node migrateCloudinaryImages.js --apply\n');
    }

  } catch (error) {
    console.error('💥 Error en el proceso de migración:', error);
  } finally {
    mongoose.disconnect();
    console.log('📝 Conexión a base de datos cerrada.');
  }
};

// Ejecutar script
if (require.main === module) {
  main();
}

module.exports = {
  getImageStats,
  migrateUsuarios,
  migrateEquipos,
  generateOptimizedUrl,
  isImageOptimized
};

// ==============================================
// 🔧 INSTRUCCIONES DE USO:

/*
1. Crear el archivo en: server/scripts/migrateCloudinaryImages.js

2. Desde la carpeta server/, ejecutar:

   # Modo simulación (solo muestra qué haría)
   node scripts/migrateCloudinaryImages.js

   # Modo real (aplica cambios)
   node scripts/migrateCloudinaryImages.js --apply

3. El script hará lo siguiente:
   - ✅ Detectar imágenes no optimizadas en Cloudinary
   - ✅ Generar URLs optimizadas (WebP, 800px, calidad automática)
   - ✅ Actualizar base de datos con nuevas URLs
   - ✅ Mostrar progreso y estadísticas
   - ✅ No tocar imágenes ya optimizadas

4. Beneficios:
   - 🚀 Sin re-subir archivos (instantáneo)
   - 💾 Cloudinary genera optimizaciones automáticamente
   - 🔄 Se puede ejecutar múltiples veces (es idempotente)
   - 📊 Estadísticas detalladas del proceso
*/