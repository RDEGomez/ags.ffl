// scripts/cleanupOrphanImages.js - Eliminar imágenes huérfanas en ImageKit
const ImageKit = require('imagekit');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configurar ImageKit
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

async function limpiarImagenesHuerfanas() {
  console.log('🧹 LIMPIEZA DE IMÁGENES HUÉRFANAS EN IMAGEKIT');
  console.log('=' * 60);
  console.log('⏱️ Inicio:', new Date().toISOString());
  
  const resultados = {
    timestamp: new Date().toISOString(),
    estadisticas: {
      totalImagenesImageKit: 0,
      imagenesEnUso: 0,
      imagenesDuplicadas: 0,
      imagenesHuerfanas: 0,
      eliminadas: 0,
      errores: 0
    },
    imagenesEnUso: [], // URLs que SÍ están en BD
    imagenesDuplicadas: [], // URLs duplicadas en BD
    imagenesHuerfanas: [], // Imágenes en ImageKit que NO están en BD
    errores: []
  };

  try {
    // PASO 1: Conectar a MongoDB
    console.log('\n🔌 PASO 1: Conectar a base de datos');
    console.log('-'.repeat(40));
    
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL);
    console.log('✅ Conectado a MongoDB');

    // PASO 2: Obtener todas las URLs de ImageKit en la BD
    console.log('\n📋 PASO 2: Obtener URLs en uso desde BD');
    console.log('-'.repeat(40));
    
    const urlsEnUso = await obtenerUrlsImageKitEnBD();
    resultados.imagenesEnUso = urlsEnUso.urls;
    resultados.imagenesDuplicadas = urlsEnUso.duplicadas;
    resultados.estadisticas.imagenesEnUso = urlsEnUso.urls.length;
    resultados.estadisticas.imagenesDuplicadas = urlsEnUso.duplicadas.length;
    
    console.log(`📊 URLs únicas en uso: ${urlsEnUso.urls.length}`);
    console.log(`📊 URLs duplicadas encontradas: ${urlsEnUso.duplicadas.length}`);

    // PASO 3: Obtener todas las imágenes de ImageKit
    console.log('\n☁️ PASO 3: Obtener imágenes de ImageKit');
    console.log('-'.repeat(40));
    
    const imagenesImageKit = await obtenerTodasLasImagenesImageKit();
    resultados.estadisticas.totalImagenesImageKit = imagenesImageKit.length;
    console.log(`📁 Total imágenes en ImageKit: ${imagenesImageKit.length}`);

    // PASO 4: Identificar imágenes huérfanas
    console.log('\n🔍 PASO 4: Identificar imágenes huérfanas');
    console.log('-'.repeat(40));
    
    const huerfanas = identificarImagenesHuerfanas(imagenesImageKit, urlsEnUso.urls);
    resultados.imagenesHuerfanas = huerfanas;
    resultados.estadisticas.imagenesHuerfanas = huerfanas.length;
    
    console.log(`🗑️ Imágenes huérfanas encontradas: ${huerfanas.length}`);

    // PASO 5: Mostrar reporte antes de eliminar
    mostrarReporteDetallado(resultados);

    // PASO 6: Confirmar eliminación
    if (huerfanas.length > 0) {
      console.log('\n⚠️ CONFIRMACIÓN REQUERIDA');
      console.log('-'.repeat(40));
      console.log(`🗑️ Se eliminarán ${huerfanas.length} imágenes huérfanas de ImageKit`);
      console.log('⏸️ Presiona Ctrl+C en los próximos 15 segundos para cancelar...');
      console.log('✅ Continuando automáticamente en 15 segundos...\n');
      
      await new Promise(resolve => setTimeout(resolve, 15000));

      // PASO 7: Eliminar imágenes huérfanas
      console.log('\n🗑️ PASO 7: Eliminar imágenes huérfanas');
      console.log('-'.repeat(40));
      
      await eliminarImagenesHuerfanas(huerfanas, resultados);
    } else {
      console.log('\n🎉 No se encontraron imágenes huérfanas para eliminar');
    }

    // PASO 8: Guardar reporte
    console.log('\n📊 PASO 8: Guardar reporte');
    console.log('-'.repeat(40));
    
    await guardarReporteLimpieza(resultados);

    // PASO 9: Mostrar resumen final
    mostrarResumenFinal(resultados);

    await mongoose.disconnect();
    console.log('\n✅ Limpieza completada');
    
    return resultados;

  } catch (error) {
    console.error('\n💥 ERROR EN LIMPIEZA:', error.message);
    resultados.errores.push({ fatal: true, error: error.message });
    
    try {
      await guardarReporteLimpieza(resultados);
    } catch (e) {
      console.error('❌ No se pudo guardar reporte de error:', e.message);
    }
    
    throw error;
  }
}

async function obtenerUrlsImageKitEnBD() {
  console.log('🔍 Analizando URLs de ImageKit en base de datos...');
  
  const todasLasUrls = [];
  
  // Usuarios
  const usuarios = await Usuario.find({ imagen: { $regex: 'ik.imagekit.io' } }, 'imagen nombre').lean();
  console.log(`   👥 Usuarios con ImageKit: ${usuarios.length}`);
  usuarios.forEach(u => todasLasUrls.push({ url: u.imagen, tipo: 'usuario', nombre: u.nombre }));

  // Equipos
  const equipos = await Equipo.find({ imagen: { $regex: 'ik.imagekit.io' } }, 'imagen nombre').lean();
  console.log(`   ⚽ Equipos con ImageKit: ${equipos.length}`);
  equipos.forEach(e => todasLasUrls.push({ url: e.imagen, tipo: 'equipo', nombre: e.nombre }));

  // Torneos
  const torneos = await Torneo.find({ imagen: { $regex: 'ik.imagekit.io' } }, 'imagen nombre').lean();
  console.log(`   🏆 Torneos con ImageKit: ${torneos.length}`);
  torneos.forEach(t => todasLasUrls.push({ url: t.imagen, tipo: 'torneo', nombre: t.nombre }));

  // Árbitros
  const arbitros = await Arbitro.find({}).populate({
    path: 'usuario',
    match: { imagen: { $regex: 'ik.imagekit.io' } },
    select: 'imagen nombre'
  }).lean();
  
  const arbitrosConImageKit = arbitros.filter(a => a.usuario && a.usuario.imagen);
  console.log(`   👨‍⚖️ Árbitros con ImageKit: ${arbitrosConImageKit.length}`);
  arbitrosConImageKit.forEach(a => todasLasUrls.push({ 
    url: a.usuario.imagen, 
    tipo: 'arbitro', 
    nombre: a.usuario.nombre 
  }));

  // Detectar duplicadas
  const urlsUnicas = [...new Set(todasLasUrls.map(item => item.url))];
  const duplicadas = todasLasUrls.filter((item, index, arr) => 
    arr.findIndex(other => other.url === item.url) !== index
  );

  console.log(`   📊 URLs totales encontradas: ${todasLasUrls.length}`);
  console.log(`   📊 URLs únicas: ${urlsUnicas.length}`);
  console.log(`   📊 URLs duplicadas: ${duplicadas.length}`);

  return {
    urls: urlsUnicas,
    duplicadas: duplicadas,
    detalles: todasLasUrls
  };
}

async function obtenerTodasLasImagenesImageKit() {
  console.log('🔍 Obteniendo todas las imágenes de ImageKit...');
  
  let todasLasImagenes = [];
  let skip = 0;
  const limit = 1000;
  let hasMore = true;

  while (hasMore) {
    try {
      const response = await imagekit.listFiles({
        skip: skip,
        limit: limit
      });

      console.log(`   📄 Obtenidas ${response.length} imágenes (skip: ${skip})`);
      todasLasImagenes = todasLasImagenes.concat(response);
      
      if (response.length < limit) {
        hasMore = false;
      } else {
        skip += limit;
      }
      
    } catch (error) {
      console.error(`❌ Error obteniendo imágenes: ${error.message}`);
      hasMore = false;
    }
  }

  console.log(`📁 Total de imágenes en ImageKit: ${todasLasImagenes.length}`);
  return todasLasImagenes;
}

function identificarImagenesHuerfanas(imagenesImageKit, urlsEnUso) {
  console.log('🔍 Comparando imágenes de ImageKit con URLs en BD...');
  
  const huerfanas = [];
  
  imagenesImageKit.forEach(imagen => {
    const imagenEnUso = urlsEnUso.some(url => url.includes(imagen.fileId) || url.includes(imagen.name));
    
    if (!imagenEnUso) {
      huerfanas.push({
        fileId: imagen.fileId,
        name: imagen.name,
        url: imagen.url,
        size: imagen.size,
        createdAt: imagen.createdAt
      });
    }
  });

  return huerfanas;
}

function mostrarReporteDetallado(resultados) {
  console.log('\n📊 REPORTE DETALLADO');
  console.log('=' * 50);
  console.log(`📁 Total imágenes en ImageKit: ${resultados.estadisticas.totalImagenesImageKit}`);
  console.log(`✅ Imágenes en uso (BD): ${resultados.estadisticas.imagenesEnUso}`);
  console.log(`🔄 URLs duplicadas en BD: ${resultados.estadisticas.imagenesDuplicadas}`);
  console.log(`🗑️ Imágenes huérfanas: ${resultados.estadisticas.imagenesHuerfanas}`);

  if (resultados.imagenesDuplicadas.length > 0) {
    console.log('\n🔄 URLS DUPLICADAS ENCONTRADAS:');
    resultados.imagenesDuplicadas.slice(0, 5).forEach((dup, i) => {
      console.log(`   ${i + 1}. [${dup.tipo}] ${dup.nombre}: ${dup.url.substring(0, 80)}...`);
    });
    if (resultados.imagenesDuplicadas.length > 5) {
      console.log(`   ... y ${resultados.imagenesDuplicadas.length - 5} más`);
    }
  }

  if (resultados.imagenesHuerfanas.length > 0) {
    console.log('\n🗑️ PRIMERAS 5 IMÁGENES HUÉRFANAS A ELIMINAR:');
    resultados.imagenesHuerfanas.slice(0, 5).forEach((img, i) => {
      console.log(`   ${i + 1}. ${img.name} (${(img.size / 1024).toFixed(1)} KB)`);
      console.log(`      📅 Creada: ${img.createdAt}`);
      console.log(`      🆔 ID: ${img.fileId}`);
    });
    if (resultados.imagenesHuerfanas.length > 5) {
      console.log(`   ... y ${resultados.imagenesHuerfanas.length - 5} más`);
    }
  }
}

async function eliminarImagenesHuerfanas(huerfanas, resultados) {
  console.log(`🗑️ Eliminando ${huerfanas.length} imágenes huérfanas...`);
  
  for (let i = 0; i < huerfanas.length; i++) {
    const imagen = huerfanas[i];
    const progreso = ((i + 1) / huerfanas.length * 100).toFixed(1);
    
    console.log(`[${i + 1}/${huerfanas.length}] (${progreso}%) Eliminando: ${imagen.name}`);
    
    try {
      await imagekit.deleteFile(imagen.fileId);
      resultados.estadisticas.eliminadas++;
      console.log(`   ✅ Eliminada: ${imagen.fileId}`);
      
    } catch (error) {
      resultados.estadisticas.errores++;
      resultados.errores.push({
        fileId: imagen.fileId,
        name: imagen.name,
        error: error.message
      });
      console.error(`   ❌ Error eliminando ${imagen.fileId}: ${error.message}`);
    }
    
    // Pausa para no sobrecargar la API
    if (i < huerfanas.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 segundos
    }
  }
}

async function guardarReporteLimpieza(resultados) {
  const reportsDir = path.join(process.cwd(), 'migration-reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportePath = path.join(reportsDir, `limpieza-huerfanas-${timestamp}.json`);
  
  fs.writeFileSync(reportePath, JSON.stringify(resultados, null, 2));
  console.log(`📄 Reporte guardado: ${reportePath}`);
  
  // CSV con imágenes eliminadas
  if (resultados.imagenesHuerfanas.length > 0) {
    const csvContent = [
      ['File ID', 'Nombre', 'URL', 'Tamaño (KB)', 'Fecha Creación', 'Estado'],
      ...resultados.imagenesHuerfanas.map(img => [
        img.fileId,
        img.name,
        img.url,
        (img.size / 1024).toFixed(1),
        img.createdAt,
        resultados.estadisticas.eliminadas > 0 ? 'Eliminada' : 'Por eliminar'
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    const csvPath = path.join(reportsDir, `imagenes-huerfanas-${timestamp}.csv`);
    fs.writeFileSync(csvPath, csvContent);
    console.log(`📊 CSV de huérfanas: ${csvPath}`);
  }
}

function mostrarResumenFinal(resultados) {
  console.log('\n🎯 RESUMEN FINAL DE LIMPIEZA');
  console.log('=' * 50);
  console.log(`📁 Total imágenes en ImageKit: ${resultados.estadisticas.totalImagenesImageKit}`);
  console.log(`✅ Imágenes en uso: ${resultados.estadisticas.imagenesEnUso}`);
  console.log(`🗑️ Imágenes huérfanas: ${resultados.estadisticas.imagenesHuerfanas}`);
  console.log(`✅ Eliminadas exitosamente: ${resultados.estadisticas.eliminadas}`);
  console.log(`❌ Errores: ${resultados.estadisticas.errores}`);
  
  const espacioLiberado = resultados.imagenesHuerfanas
    .filter((_, i) => i < resultados.estadisticas.eliminadas)
    .reduce((sum, img) => sum + img.size, 0);
  
  console.log(`💾 Espacio liberado: ${(espacioLiberado / 1024 / 1024).toFixed(2)} MB`);
  
  if (resultados.estadisticas.eliminadas > 0) {
    console.log('\n🎉 ¡Limpieza completada exitosamente!');
    console.log('📊 ImageKit ahora solo contiene imágenes en uso');
  }
  
  if (resultados.estadisticas.errores > 0) {
    console.log('\n⚠️ Algunos errores ocurrieron:');
    resultados.errores.slice(0, 3).forEach((error, i) => {
      console.log(`   ${i + 1}. ${error.name}: ${error.error}`);
    });
  }
}

// Ejecutar limpieza si es llamado directamente
if (require.main === module) {
  console.log('🧹 LIMPIEZA DE IMÁGENES HUÉRFANAS EN IMAGEKIT');
  console.log('⚠️ Este script eliminará imágenes que NO estén en tu BD\n');
  
  limpiarImagenesHuerfanas()
    .then((resultados) => {
      const exito = resultados.estadisticas.errores === 0;
      
      if (exito && resultados.estadisticas.eliminadas > 0) {
        console.log('\n🎉 ¡LIMPIEZA COMPLETADA EXITOSAMENTE!');
        process.exit(0);
      } else if (resultados.estadisticas.imagenesHuerfanas === 0) {
        console.log('\n✅ No había imágenes huérfanas que limpiar');
        process.exit(0);
      } else {
        console.log('\n⚠️ LIMPIEZA COMPLETADA CON ALGUNOS ERRORES');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 LIMPIEZA FALLÓ:', error.message);
      process.exit(1);
    });
}

module.exports = { 
  limpiarImagenesHuerfanas,
  obtenerUrlsImageKitEnBD,
  identificarImagenesHuerfanas
};