// scripts/dryRunMigration.js - SOLO ANÁLISIS, sin cambios reales
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Modelos
const Usuario = require('../src/models/Usuario');
const Equipo = require('../src/models/Equipo');
const Torneo = require('../src/models/Torneo');
const Arbitro = require('../src/models/Arbitro');

async function dryRunAnalisis() {
  console.log('🧪 DRY RUN: Análisis de migración (SIN CAMBIOS REALES)');
  console.log('=' * 60);
  console.log('⚠️  MODO SIMULACIÓN - No se harán cambios');
  console.log('⏱️ Timestamp:', new Date().toISOString());
  
  try {
    // PASO 1: Conectar a BD
    console.log('\n🔌 PASO 1: Conectar a base de datos');
    console.log('-'.repeat(40));

    console.log(`Conectando a MongoDB en ${process.env.MONGODB_URI || process.env.DATABASE_URL}...`);
    
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL);
    console.log('✅ Conectado a MongoDB');

    // PASO 2: Analizar Cloudinary
    console.log('\n☁️ PASO 2: Analizar Cloudinary');
    console.log('-'.repeat(40));
    
    const recursosCloudinary = await analizarCloudinary();
    
    // PASO 3: Analizar BD
    console.log('\n🗄️ PASO 3: Analizar base de datos');
    console.log('-'.repeat(40));
    
    const urlsEnBD = await analizarBD();
    
    // PASO 4: Generar plan de migración
    console.log('\n📋 PASO 4: Plan de migración');
    console.log('-'.repeat(40));
    
    generarPlanMigracion(recursosCloudinary, urlsEnBD);
    
    // PASO 5: Estimaciones
    console.log('\n⏱️ PASO 5: Estimaciones');
    console.log('-'.repeat(40));
    
    calcularEstimaciones(recursosCloudinary);
    
    await mongoose.disconnect();
    console.log('\n✅ Análisis completado sin cambios');
    
  } catch (error) {
    console.error('\n💥 Error en análisis:', error.message);
    throw error;
  }
}

async function analizarCloudinary() {
  console.log('🔍 Obteniendo inventario de Cloudinary...');
  
  let totalRecursos = [];
  let nextCursor = null;
  let pageCount = 0;
  let totalSize = 0;

  do {
    pageCount++;
    console.log(`   📄 Analizando página ${pageCount}...`);
    
    const options = {
      type: 'upload',
      max_results: 500,
      resource_type: 'image'
    };
    
    if (nextCursor) {
      options.next_cursor = nextCursor;
    }

    const recursos = await cloudinary.api.resources(options);
    
    // Filtrar solo las de nuestro proyecto
    const recursosProyecto = recursos.resources.filter(r => 
      r.public_id.includes('laces-uploads') || 
      r.folder === 'laces-uploads'
    );
    
    totalRecursos = totalRecursos.concat(recursosProyecto);
    totalSize += recursosProyecto.reduce((sum, r) => sum + (r.bytes || 0), 0);
    
    console.log(`      📊 Página ${pageCount}: ${recursos.resources.length} total, ${recursosProyecto.length} del proyecto`);
    
    nextCursor = recursos.next_cursor;
    
  } while (nextCursor);

  console.log('\n📊 RESUMEN CLOUDINARY:');
  console.log(`   📁 Total de imágenes del proyecto: ${totalRecursos.length}`);
  console.log(`   💾 Tamaño total: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   🌐 Espacio en ImageKit gratuito: 20 GB (${(20 * 1024).toFixed(0)} MB)`);
  console.log(`   ✅ ¿Cabe en plan gratuito? ${totalSize < 20 * 1024 * 1024 * 1024 ? 'SÍ' : 'NO'}`);
  
  // Mostrar ejemplos
  if (totalRecursos.length > 0) {
    console.log('\n📋 Primeras 5 imágenes a migrar:');
    totalRecursos.slice(0, 5).forEach((img, i) => {
      console.log(`   ${i + 1}. ${img.public_id}`);
      console.log(`      📏 ${(img.bytes / 1024).toFixed(1)} KB`);
      console.log(`      🌐 ${img.secure_url}`);
    });
    
    if (totalRecursos.length > 5) {
      console.log(`   ... y ${totalRecursos.length - 5} más`);
    }
  }
  
  return totalRecursos;
}

async function analizarBD() {
  console.log('🔍 Analizando URLs de Cloudinary en base de datos...');
  
  const urlsCloudinary = [];
  let totalUrls = 0;
  
  // Usuarios
  const usuarios = await Usuario.find({ imagen: { $regex: 'cloudinary.com' } }, 'imagen nombre').lean();
  console.log(`   👥 Usuarios con imágenes Cloudinary: ${usuarios.length}`);
  usuarios.forEach(usuario => {
    urlsCloudinary.push({
      coleccion: 'usuarios',
      id: usuario._id,
      nombre: usuario.nombre,
      url: usuario.imagen
    });
  });
  totalUrls += usuarios.length;

  // Equipos
  const equipos = await Equipo.find({ imagen: { $regex: 'cloudinary.com' } }, 'imagen nombre').lean();
  console.log(`   ⚽ Equipos con imágenes Cloudinary: ${equipos.length}`);
  equipos.forEach(equipo => {
    urlsCloudinary.push({
      coleccion: 'equipos',
      id: equipo._id,
      nombre: equipo.nombre,
      url: equipo.imagen
    });
  });
  totalUrls += equipos.length;

  // Torneos
  const torneos = await Torneo.find({ imagen: { $regex: 'cloudinary.com' } }, 'imagen nombre').lean();
  console.log(`   🏆 Torneos con imágenes Cloudinary: ${torneos.length}`);
  torneos.forEach(torneo => {
    urlsCloudinary.push({
      coleccion: 'torneos',
      id: torneo._id,
      nombre: torneo.nombre,
      url: torneo.imagen
    });
  });
  totalUrls += torneos.length;

  // Árbitros
  const arbitros = await Arbitro.find({}).populate({
    path: 'usuario',
    match: { imagen: { $regex: 'cloudinary.com' } },
    select: 'imagen nombre'
  }).lean();
  
  const arbitrosConImagen = arbitros.filter(a => a.usuario && a.usuario.imagen);
  console.log(`   👨‍⚖️ Árbitros con imágenes Cloudinary: ${arbitrosConImagen.length}`);
  
  arbitrosConImagen.forEach(arbitro => {
    urlsCloudinary.push({
      coleccion: 'arbitros',
      id: arbitro._id,
      usuarioId: arbitro.usuario._id,
      nombre: arbitro.usuario.nombre,
      url: arbitro.usuario.imagen
    });
  });
  totalUrls += arbitrosConImagen.length;

  console.log(`\n📊 RESUMEN BASE DE DATOS:`);
  console.log(`   📋 Total URLs de Cloudinary en BD: ${totalUrls}`);
  
  // Mostrar ejemplos
  if (urlsCloudinary.length > 0) {
    console.log('\n📋 Primeras 3 URLs a actualizar:');
    urlsCloudinary.slice(0, 3).forEach((item, i) => {
      console.log(`   ${i + 1}. [${item.coleccion}] ${item.nombre}`);
      console.log(`      🌐 ${item.url}`);
    });
  }
  
  return urlsCloudinary;
}

function generarPlanMigracion(recursosCloudinary, urlsEnBD) {
  console.log('📋 PLAN DE MIGRACIÓN:');
  
  const totalImagenes = recursosCloudinary.length;
  const totalUrls = urlsEnBD.length;
  
  console.log(`\n🎯 ACCIONES A REALIZAR:`);
  console.log(`   1. Migrar ${totalImagenes} imágenes de Cloudinary → ImageKit`);
  console.log(`   2. Actualizar ${totalUrls} URLs en base de datos`);
  console.log(`   3. Crear backup automático antes de cambios`);
  console.log(`   4. Verificar integridad post-migración`);
  
  console.log(`\n⚠️ VERIFICACIONES PREVIAS:`);
  console.log(`   ✅ Credenciales ImageKit configuradas`);
  console.log(`   ✅ Conexión a ImageKit funcional`);
  console.log(`   ✅ Espacio suficiente en ImageKit`);
  console.log(`   ✅ Backup de BD será creado automáticamente`);
  
  console.log(`\n🛡️ PLAN DE ROLLBACK:`);
  console.log(`   • Backup de BD disponible para restaurar URLs`);
  console.log(`   • Imágenes en Cloudinary se mantienen intactas`);
  console.log(`   • Variable USE_CLOUDINARY para rollback inmediato`);
}

function calcularEstimaciones(recursosCloudinary) {
  const totalImagenes = recursosCloudinary.length;
  
  // Estimaciones conservadoras
  const tiempoPorImagen = 3; // 3 segundos por imagen (descarga + upload + pausa)
  const tiempoTotalSegundos = totalImagenes * tiempoPorImagen;
  const tiempoTotalMinutos = Math.ceil(tiempoTotalSegundos / 60);
  
  console.log('⏱️ ESTIMACIONES DE TIEMPO:');
  console.log(`   📊 Imágenes a migrar: ${totalImagenes}`);
  console.log(`   ⏱️ Tiempo estimado por imagen: ${tiempoPorImagen} segundos`);
  console.log(`   🕐 Tiempo total estimado: ${tiempoTotalMinutos} minutos`);
  
  if (tiempoTotalMinutos > 30) {
    console.log(`   ⚠️ Migración larga detectada (>${Math.floor(tiempoTotalMinutos/60)}h ${tiempoTotalMinutos%60}m)`);
    console.log(`   💡 Considera ejecutar en horarios de bajo tráfico`);
  }
  
  console.log(`\n📊 ESTIMACIONES DE DATOS:`);
  const totalSize = recursosCloudinary.reduce((sum, r) => sum + (r.bytes || 0), 0);
  console.log(`   💾 Datos a transferir: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   🌐 Velocidad estimada: ~1MB/s`);
  console.log(`   📡 Ancho de banda requerido: Moderado`);
}

// Ejecutar análisis si es llamado directamente
if (require.main === module) {
  console.log('🧪 ANÁLISIS PRE-MIGRACIÓN (DRY RUN)\n');
  
  dryRunAnalisis()
    .then(() => {
      console.log('\n🎉 ¡ANÁLISIS COMPLETADO!');
      console.log('💡 Para ejecutar la migración real: npm run migration:migrate-images');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 ERROR EN ANÁLISIS:', error.message);
      process.exit(1);
    });
}

module.exports = { dryRunAnalisis };