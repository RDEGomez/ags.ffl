// scripts/migrateToImageKit.js - MIGRACIÓN COMPLETA Cloudinary → ImageKit
const cloudinary = require('cloudinary').v2;
const ImageKit = require('imagekit');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();

// Configuraciones
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

// Modelos
const Usuario = require('../src/models/Usuario');
const Equipo = require('../src/models/Equipo');
const Torneo = require('../src/models/Torneo');
const Arbitro = require('../src/models/Arbitro');

async function migrarImagenes() {
  console.log('🚀 INICIANDO MIGRACIÓN COMPLETA: Cloudinary → ImageKit');
  console.log('⚠️  ATENCIÓN: Esta migración HARÁ CAMBIOS REALES');
  console.log('=' * 70);
  console.log('⏱️ Inicio:', new Date().toISOString());
  
  const resultados = {
    timestamp: new Date().toISOString(),
    estadisticas: {
      totalImagenes: 0,
      migradas: 0,
      errores: 0,
      urlsActualizadas: 0
    },
    mapeoUrls: [], // URL original → URL nueva
    errores: [],
    log: []
  };

  try {
    // PASO 1: Verificaciones previas
    console.log('\n🔍 PASO 1: Verificaciones previas');
    console.log('-'.repeat(40));
    
    await verificacionesIniciales();
    console.log('✅ Verificaciones completadas');

    // PASO 2: Conectar a MongoDB
    console.log('\n🔌 PASO 2: Conectar a base de datos');
    console.log('-'.repeat(40));
    
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL);
    console.log('✅ Conectado a MongoDB');

    // PASO 3: Crear backup de seguridad
    console.log('\n💾 PASO 3: Crear backup de seguridad');
    console.log('-'.repeat(40));
    
    await crearBackupCompleto();
    console.log('✅ Backup creado exitosamente');

    // PASO 4: Obtener lista de imágenes a migrar
    console.log('\n📊 PASO 4: Obtener imágenes de Cloudinary');
    console.log('-'.repeat(40));
    
    const imagenes = await obtenerImagenesAMigrar();
    resultados.estadisticas.totalImagenes = imagenes.length;
    console.log(`📁 ${imagenes.length} imágenes encontradas para migrar`);

    if (imagenes.length === 0) {
      console.log('⚠️ No se encontraron imágenes para migrar');
      return resultados;
    }

    // PASO 5: Migrar imágenes una por una
    console.log('\n🔄 PASO 5: Migrar imágenes');
    console.log('-'.repeat(40));
    console.log('⏱️ Iniciando migración...');
    
    for (let i = 0; i < imagenes.length; i++) {
      const imagen = imagenes[i];
      const progreso = ((i + 1) / imagenes.length * 100).toFixed(1);
      
      console.log(`\n📸 [${i + 1}/${imagenes.length}] (${progreso}%) ${imagen.public_id}`);
      
      try {
        const resultado = await migrarImagenIndividual(imagen);
        
        if (resultado.success) {
          resultados.estadisticas.migradas++;
          resultados.mapeoUrls.push({
            cloudinary: resultado.cloudinary_url,
            imagekit: resultado.imagekit_url,
            public_id: imagen.public_id,
            file_id: resultado.file_id
          });
          console.log(`   ✅ Migrada → ${resultado.file_id}`);
        } else {
          resultados.estadisticas.errores++;
          resultados.errores.push({
            public_id: imagen.public_id,
            url: imagen.secure_url,
            error: resultado.error
          });
          console.log(`   ❌ Error: ${resultado.error}`);
        }
        
      } catch (error) {
        resultados.estadisticas.errores++;
        resultados.errores.push({
          public_id: imagen.public_id,
          url: imagen.secure_url,
          error: error.message
        });
        console.error(`   💥 Error fatal: ${error.message}`);
      }
      
      // Pausa entre imágenes para no sobrecargar APIs
      if (i < imagenes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 segundos
      }
    }

    // PASO 6: Actualizar URLs en base de datos
    console.log('\n📝 PASO 6: Actualizar URLs en base de datos');
    console.log('-'.repeat(40));
    
    const urlsActualizadas = await actualizarUrlsEnBD(resultados.mapeoUrls);
    resultados.estadisticas.urlsActualizadas = urlsActualizadas;
    console.log(`✅ ${urlsActualizadas} URLs actualizadas en BD`);

    // PASO 7: Guardar reporte final
    console.log('\n📊 PASO 7: Guardar reporte');
    console.log('-'.repeat(40));
    
    await guardarReporteFinal(resultados);

    // PASO 8: Mostrar resumen
    mostrarResumenMigracion(resultados);

    await mongoose.disconnect();
    console.log('\n🎉 ¡MIGRACIÓN COMPLETADA!');
    
    return resultados;

  } catch (error) {
    console.error('\n💥 ERROR FATAL EN MIGRACIÓN:', error.message);
    resultados.errores.push({ fatal: true, error: error.message });
    
    // Intentar guardar reporte de error
    try {
      await guardarReporteFinal(resultados);
    } catch (e) {
      console.error('❌ No se pudo guardar reporte de error:', e.message);
    }
    
    throw error;
  }
}

async function verificacionesIniciales() {
  console.log('🔍 Verificando credenciales y conexiones...');
  
  // Verificar Cloudinary
  try {
    await cloudinary.api.ping();
    console.log('   ✅ Cloudinary: Conectado');
  } catch (error) {
    throw new Error(`Cloudinary no accesible: ${error.message}`);
  }
  
  // Verificar ImageKit
  try {
    await imagekit.listFiles({ limit: 1 });
    console.log('   ✅ ImageKit: Conectado');
  } catch (error) {
    throw new Error(`ImageKit no accesible: ${error.message}`);
  }
  
  // Verificar MongoDB URI
  if (!process.env.MONGODB_URI && !process.env.DATABASE_URL) {
    throw new Error('MONGODB_URI o DATABASE_URL no configurado');
  }
  console.log('   ✅ MongoDB: URI configurado');
  
  console.log('✅ Todas las verificaciones pasaron');
}

async function obtenerImagenesAMigrar() {
  console.log('🔍 Obteniendo lista de imágenes de Cloudinary...');
  
  let allImages = [];
  let nextCursor = null;
  let pageCount = 0;

  do {
    pageCount++;
    console.log(`   📄 Procesando página ${pageCount}...`);
    
    const options = {
      type: 'upload',
      max_results: 500,
      resource_type: 'image'
    };
    
    if (nextCursor) {
      options.next_cursor = nextCursor;
    }

    const result = await cloudinary.api.resources(options);
    
    // Filtrar solo imágenes del proyecto
    const projectImages = result.resources.filter(img => 
      img.public_id.includes('laces-uploads') || 
      img.folder === 'laces-uploads'
    );
    
    allImages = allImages.concat(projectImages);
    nextCursor = result.next_cursor;
    
    console.log(`      📊 ${projectImages.length} imágenes del proyecto en página ${pageCount}`);
    
  } while (nextCursor);

  console.log(`📁 Total de imágenes del proyecto: ${allImages.length}`);
  return allImages;
}

async function migrarImagenIndividual(imagen) {
  try {
    // Descargar de Cloudinary
    const buffer = await descargarImagen(imagen.secure_url);
    
    // Generar nombre para ImageKit
    const timestamp = Date.now();
    const originalName = imagen.public_id.split('/').pop();
    const fileName = `${timestamp}-${originalName}`;
    
    // Subir a ImageKit
    const uploadResult = await imagekit.upload({
      file: buffer,
      fileName: fileName,
      folder: 'laces-uploads'
    });

    return {
      success: true,
      cloudinary_url: imagen.secure_url,
      imagekit_url: uploadResult.url,
      file_id: uploadResult.fileId,
      size_original: imagen.bytes,
      size_nueva: uploadResult.size
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      cloudinary_url: imagen.secure_url
    };
  }
}

function descargarImagen(url) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout descargando imagen'));
    }, 30000); // 30 segundos timeout

    https.get(url, (response) => {
      clearTimeout(timeout);
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode} al descargar imagen`));
        return;
      }

      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function crearBackupCompleto() {
  const backupDir = path.join(process.cwd(), 'migration-reports', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  console.log('💾 Creando backup de URLs en BD...');
  
  // Backup de usuarios
  const usuarios = await Usuario.find({ imagen: { $exists: true } }, 'imagen nombre').lean();
  const equipos = await Equipo.find({ imagen: { $exists: true } }, 'imagen nombre').lean();
  const torneos = await Torneo.find({ imagen: { $exists: true } }, 'imagen nombre').lean();
  const arbitros = await Arbitro.find({}).populate('usuario', 'imagen nombre').lean();
  
  const backup = {
    timestamp: new Date().toISOString(),
    usuarios: usuarios.length,
    equipos: equipos.length,
    torneos: torneos.length,
    arbitros: arbitros.length,
    data: {
      usuarios,
      equipos,
      torneos,
      arbitros
    }
  };
  
  const backupPath = path.join(backupDir, `backup-completo-${timestamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  
  console.log(`📄 Backup guardado: ${backupPath}`);
  console.log(`📊 Respaldados: ${usuarios.length + equipos.length + torneos.length + arbitros.length} registros`);
}

async function actualizarUrlsEnBD(mapeoUrls) {
  console.log(`🔄 Actualizando ${mapeoUrls.length} URLs en base de datos...`);
  
  let totalActualizadas = 0;
  
  for (const mapeo of mapeoUrls) {
    try {
      // Actualizar en todas las colecciones
      const [usuarios, equipos, torneos, arbitros] = await Promise.all([
        Usuario.updateMany({ imagen: mapeo.cloudinary }, { imagen: mapeo.imagekit }),
        Equipo.updateMany({ imagen: mapeo.cloudinary }, { imagen: mapeo.imagekit }),
        Torneo.updateMany({ imagen: mapeo.cloudinary }, { imagen: mapeo.imagekit }),
        Usuario.updateMany(
          { imagen: mapeo.cloudinary, _id: { $in: await Arbitro.distinct('usuario') } },
          { imagen: mapeo.imagekit }
        )
      ]);
      
      const actualizacionesEsteMapeo = usuarios.modifiedCount + equipos.modifiedCount + 
                                      torneos.modifiedCount + arbitros.modifiedCount;
      totalActualizadas += actualizacionesEsteMapeo;
      
      if (actualizacionesEsteMapeo > 0) {
        console.log(`   ✅ ${mapeo.file_id}: ${actualizacionesEsteMapeo} registros actualizados`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error actualizando ${mapeo.file_id}: ${error.message}`);
    }
  }
  
  return totalActualizadas;
}

async function guardarReporteFinal(resultados) {
  const reportsDir = path.join(process.cwd(), 'migration-reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Reporte JSON completo
  const reportePath = path.join(reportsDir, `migracion-${timestamp}.json`);
  fs.writeFileSync(reportePath, JSON.stringify(resultados, null, 2));
  
  // CSV con mapeo de URLs
  if (resultados.mapeoUrls.length > 0) {
    const csvContent = [
      ['URL Cloudinary', 'URL ImageKit', 'Public ID', 'File ID'],
      ...resultados.mapeoUrls.map(m => [m.cloudinary, m.imagekit, m.public_id, m.file_id])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    const csvPath = path.join(reportsDir, `mapeo-urls-${timestamp}.csv`);
    fs.writeFileSync(csvPath, csvContent);
    console.log(`📊 Mapeo CSV: ${csvPath}`);
  }
  
  console.log(`📄 Reporte completo: ${reportePath}`);
}

function mostrarResumenMigracion(resultados) {
  console.log('\n🎯 RESUMEN FINAL DE MIGRACIÓN');
  console.log('=' * 50);
  console.log(`📊 Total de imágenes: ${resultados.estadisticas.totalImagenes}`);
  console.log(`✅ Migradas exitosamente: ${resultados.estadisticas.migradas}`);
  console.log(`❌ Errores: ${resultados.estadisticas.errores}`);
  console.log(`📝 URLs actualizadas en BD: ${resultados.estadisticas.urlsActualizadas}`);
  
  const porcentajeExito = resultados.estadisticas.totalImagenes > 0 
    ? ((resultados.estadisticas.migradas / resultados.estadisticas.totalImagenes) * 100).toFixed(1)
    : '0';
  console.log(`📈 Porcentaje de éxito: ${porcentajeExito}%`);
  
  if (resultados.errores.length > 0) {
    console.log('\n⚠️ ERRORES ENCONTRADOS:');
    resultados.errores.slice(0, 3).forEach((error, i) => {
      console.log(`   ${i + 1}. ${error.public_id || 'Unknown'}: ${error.error}`);
    });
    if (resultados.errores.length > 3) {
      console.log(`   ... y ${resultados.errores.length - 3} errores más (ver reporte completo)`);
    }
  }
  
  console.log('\n🚀 PRÓXIMOS PASOS:');
  if (resultados.estadisticas.migradas > 0) {
    console.log('   1. ✅ Migración completada - imágenes en ImageKit');
    console.log('   2. 🧪 Probar la aplicación en desarrollo');
    console.log('   3. 🔧 Activar ImageKit: USE_IMAGEKIT=true en .env');
    console.log('   4. 🚀 Deploy a producción cuando esté validado');
    console.log('   5. 🧹 Opcional: Limpiar Cloudinary tras confirmación');
  } else {
    console.log('   ❌ No se migraron imágenes exitosamente');
    console.log('   🔍 Revisar errores en el reporte');
    console.log('   🔧 Corregir problemas y volver a intentar');
  }
  
  console.log('\n🛡️ ROLLBACK DISPONIBLE:');
  console.log('   • Backup de BD creado automáticamente');
  console.log('   • Imágenes originales intactas en Cloudinary');
  console.log('   • USE_CLOUDINARY=true para rollback inmediato');
}

// Ejecutar migración si es llamado directamente
if (require.main === module) {
  console.log('🎬 MIGRACIÓN COMPLETA: CLOUDINARY → IMAGEKIT');
  console.log('⚠️ ATENCIÓN: Esta operación MODIFICARÁ tu base de datos');
  console.log('\n⏸️ Presiona Ctrl+C en los próximos 10 segundos para cancelar...\n');
  
  // Dar tiempo para cancelar
  setTimeout(() => {
    migrarImagenes()
      .then((resultados) => {
        const exito = resultados.estadisticas.errores === 0 && resultados.estadisticas.migradas > 0;
        
        if (exito) {
          console.log('\n🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!');
          console.log('💡 Activa ImageKit con: USE_IMAGEKIT=true');
          process.exit(0);
        } else {
          console.log('\n⚠️ MIGRACIÓN COMPLETADA CON PROBLEMAS');
          console.log('📋 Revisa el reporte para detalles');
          process.exit(1);
        }
      })
      .catch((error) => {
        console.error('\n💥 MIGRACIÓN FALLÓ:', error.message);
        console.error('🔧 Revisa configuración y vuelve a intentar');
        process.exit(1);
      });
  }, 10000); // 10 segundos de espera
}

module.exports = { 
  migrarImagenes,
  migrarImagenIndividual,
  obtenerImagenesAMigrar
};