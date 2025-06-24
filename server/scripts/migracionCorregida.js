// scripts/migracionCorregida.js - Migración para URLs con transformaciones
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Modelos
const Usuario = require('../src/models/Usuario');
const Equipo = require('../src/models/Equipo');
const Torneo = require('../src/models/Torneo');

function normalizarUrlCloudinary(url) {
  try {
    if (!url || typeof url !== 'string') {
      console.log(`      ⚠️ URL inválida: ${url}`);
      return null;
    }
    
    // Remover transformaciones complejas si las tiene
    let urlLimpia = url.replace(/\/c_[^\/]+\//, '/');
    
    console.log(`      🔧 URL original: ${url.substring(0, 100)}...`);
    console.log(`      🔧 URL limpia: ${urlLimpia.substring(0, 100)}...`);
    
    // Extraer componentes principales
    const match = urlLimpia.match(/https:\/\/res\.cloudinary\.com\/([^\/]+)\/image\/upload\/(v\d+)\/(.+)/);
    if (!match) {
      console.log(`      ⚠️ URL no coincide con patrón Cloudinary: ${urlLimpia}`);
      return null;
    }
    
    const [, cloudName, version, path] = match;
    
    // El path contiene: laces-uploads/timestamp-filename.ext.ext
    const pathParts = path.split('/');
    if (!pathParts || pathParts.length < 2) {
      console.log(`      ⚠️ Path insuficiente: ${path}`);
      return null;
    }
    
    const folder = pathParts[0]; // laces-uploads
    const filename = pathParts.slice(1).join('/'); // timestamp-filename.ext.ext
    
    // Extraer timestamp del filename
    const versionNumber = version.replace('v', '');
    
    const timestampMatch = filename.match(/^(\d+)-(.+)/);
    if (!timestampMatch) {
      console.log(`      ⚠️ No se pudo extraer timestamp de: ${filename}`);
      return null;
    }
    
    const [, timestamp, resto] = timestampMatch;
    
    console.log(`      🔍 Version: ${versionNumber}, Timestamp: ${timestamp}`);
    
    return {
      originalUrl: url,
      urlLimpia,
      cloudName,
      version,
      versionNumber,
      folder,
      timestamp,
      filename,
      restoFilename: resto
    };
  } catch (error) {
    console.log(`      ❌ Error procesando URL ${url}: ${error.message}`);
    return null;
  }
}

function buscarEnMapeo(urlInfo, mapeoUrls) {
  if (!urlInfo || !mapeoUrls || !Array.isArray(mapeoUrls)) {
    console.log(`      ⚠️ Datos inválidos para búsqueda`);
    return { encontrado: null, estrategia: 'error_datos' };
  }
  
  const { timestamp, restoFilename, versionNumber } = urlInfo;
  
  if (!timestamp || !restoFilename) {
    console.log(`      ⚠️ Timestamp o filename faltante`);
    return { encontrado: null, estrategia: 'datos_incompletos' };
  }
  
  try {
    console.log(`      🔍 Buscando: timestamp=${timestamp}, version=${versionNumber}, archivo=${restoFilename}`);
    
    // Estrategia 1: Buscar por timestamp exacto + nombre de archivo
    let encontrado = mapeoUrls.find(mapeo => {
      return mapeo && mapeo.cloudinary && 
             mapeo.cloudinary.includes(timestamp) && 
             mapeo.cloudinary.includes(restoFilename);
    });
    
    if (encontrado) {
      console.log(`      ✅ Encontrado con timestamp exacto`);
      return { encontrado, estrategia: 'timestamp_exacto_y_nombre' };
    }
    
    // Estrategia 2: Buscar por timestamp parcial
    const timestampCorto = timestamp.substring(0, 10);
    encontrado = mapeoUrls.find(mapeo => {
      return mapeo && mapeo.cloudinary && 
             mapeo.cloudinary.includes(timestampCorto) && 
             mapeo.cloudinary.includes(restoFilename);
    });
    
    if (encontrado) {
      console.log(`      ✅ Encontrado con timestamp parcial`);
      return { encontrado, estrategia: 'timestamp_parcial_y_nombre' };
    }
    
    // Estrategia 3: Buscar solo por timestamp exacto
    encontrado = mapeoUrls.find(mapeo => {
      return mapeo && mapeo.cloudinary && mapeo.cloudinary.includes(timestamp);
    });
    
    if (encontrado) {
      console.log(`      ✅ Encontrado solo por timestamp`);
      return { encontrado, estrategia: 'solo_timestamp' };
    }
    
    // Estrategia 4: Buscar por nombre de archivo
    const nombreBase = restoFilename.split('.')[0];
    if (nombreBase && nombreBase.length > 3) {
      encontrado = mapeoUrls.find(mapeo => {
        return mapeo && mapeo.cloudinary && mapeo.cloudinary.includes(nombreBase);
      });
      
      if (encontrado) {
        console.log(`      ✅ Encontrado por nombre de archivo`);
        return { encontrado, estrategia: 'solo_nombre' };
      }
    }
    
    // Estrategia 5: Buscar por version number
    if (versionNumber) {
      encontrado = mapeoUrls.find(mapeo => {
        return mapeo && mapeo.cloudinary && mapeo.cloudinary.includes(`v${versionNumber}`);
      });
      
      if (encontrado) {
        console.log(`      ✅ Encontrado por version number`);
        return { encontrado, estrategia: 'version_number' };
      }
    }
    
    return { encontrado: null, estrategia: 'no_encontrado' };
  } catch (error) {
    console.log(`      ❌ Error en búsqueda: ${error.message}`);
    return { encontrado: null, estrategia: 'error_busqueda' };
  }
}

function aplicarTransformacionesImageKit(urlImageKit, urlCloudinaryOriginal) {
  const match = urlCloudinaryOriginal.match(/\/c_([^\/]+)\//);
  if (!match) return urlImageKit;
  
  const transformaciones = match[1];
  console.log(`      🎨 Transformaciones originales: ${transformaciones}`);
  
  // Convertir transformaciones específicas:
  // c_limit,f_auto,fl_progressive,h_800,q_auto:good,w_800
  let transformacionesImageKit = transformaciones
    .replace(/c_limit/g, 'c-at_max')
    .replace(/c_fill/g, 'c-maintain_ratio')
    .replace(/c_fit/g, 'c-at_max')
    .replace(/w_(\d+)/g, 'w-$1')
    .replace(/h_(\d+)/g, 'h-$1')
    .replace(/q_auto:good/g, 'q-80')
    .replace(/q_auto/g, 'q-auto')
    .replace(/f_auto/g, 'f-auto')
    .replace(/fl_progressive/g, 'pr-true');
  
  console.log(`      🎨 Transformaciones ImageKit: ${transformacionesImageKit}`);
  
  // Insertar transformaciones en ImageKit
  const partes = urlImageKit.split('/');
  const baseIndex = partes.findIndex(parte => parte === 'laces-uploads');
  
  if (baseIndex > 0) {
    partes.splice(baseIndex, 0, `tr:${transformacionesImageKit}`);
    return partes.join('/');
  }
  
  return urlImageKit;
}

async function migracionCorregida() {
  try {
    console.log('🔄 MIGRACIÓN CORREGIDA PARA URLs CON TRANSFORMACIONES');
    console.log('=' * 60);
    
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL);
    console.log('✅ Conectado a:', mongoose.connection.db.databaseName);
    
    // Cargar mapeo del archivo correcto
    const reportesDir = path.join(process.cwd(), 'migration-reports');
    
    if (!fs.existsSync(reportesDir)) {
      throw new Error(`❌ Directorio migration-reports no existe: ${reportesDir}\n💡 Debes ejecutar primero: node scripts/migrateToImageKit.js`);
    }
    
    const reportFiles = fs.readdirSync(reportesDir)
      .filter(f => f.startsWith('migracion-') && f.endsWith('.json') && !f.includes('transformaciones'))
      .sort()
      .reverse();
    
    if (reportFiles.length === 0) {
      throw new Error('❌ No se encontró el reporte original de migración\n💡 Debes ejecutar primero: node scripts/migrateToImageKit.js');
    }
    
    const reportePath = path.join(reportesDir, reportFiles[0]);
    console.log(`📄 Usando reporte: ${reportFiles[0]}`);
    
    const reporte = JSON.parse(fs.readFileSync(reportePath, 'utf8'));
    const mapeoUrls = reporte.mapeoUrls;
    
    if (!mapeoUrls || !Array.isArray(mapeoUrls)) {
      throw new Error('❌ El reporte no contiene mapeoUrls válido');
    }
    
    console.log(`🔗 Mapeo disponible: ${mapeoUrls.length} URLs`);
    
    let totalActualizadas = 0;
    let estrategias = {
      timestamp_exacto_y_nombre: 0,
      timestamp_parcial_y_nombre: 0,
      solo_timestamp: 0,
      solo_nombre: 0,
      version_number: 0,
      no_encontrado: 0,
      error_datos: 0,
      datos_incompletos: 0,
      error_busqueda: 0
    };
    let noEncontradas = [];
    
    async function procesarModelo(modelo, nombreModelo) {
      console.log(`\n🔄 Procesando ${nombreModelo.toUpperCase()}...`);
      
      const documentos = await modelo.find({ imagen: { $regex: 'cloudinary' } });
      console.log(`   📊 ${documentos.length} documentos con URLs de Cloudinary`);
      
      for (const doc of documentos) {
        try {
          console.log(`\n   👤 ${doc.nombre || doc._id}`);
          console.log(`      URL original: ${doc.imagen}`);
          
          if (!doc.imagen) {
            console.log(`      ⚠️ Documento sin imagen, saltando...`);
            continue;
          }
          
          // Normalizar la URL
          const urlInfo = normalizarUrlCloudinary(doc.imagen);
          
          if (!urlInfo) {
            console.log(`      ❌ No se pudo normalizar la URL, saltando...`);
            noEncontradas.push({
              modelo: nombreModelo,
              id: doc._id,
              nombre: doc.nombre || 'Sin nombre',
              url: doc.imagen,
              error: 'url_no_normalizable'
            });
            continue;
          }
          
          console.log(`      Timestamp extraído: ${urlInfo.timestamp}`);
          console.log(`      Archivo: ${urlInfo.restoFilename}`);
          
          // Buscar en mapeo
          const { encontrado, estrategia } = buscarEnMapeo(urlInfo, mapeoUrls);
          estrategias[estrategia] = (estrategias[estrategia] || 0) + 1;
          
          if (encontrado) {
            console.log(`      ✅ Encontrado (${estrategia})`);
            console.log(`      Mapeo: ${encontrado.cloudinary.substring(0, 80)}...`);
            
            let nuevaUrl = encontrado.imagekit;
            
            if (!nuevaUrl) {
              console.log(`      ❌ URL de ImageKit faltante en mapeo`);
              continue;
            }
            
            // Aplicar transformaciones si las tenía
            const tieneTransformaciones = /\/c_[^\/]+\//.test(doc.imagen);
            if (tieneTransformaciones) {
              nuevaUrl = aplicarTransformacionesImageKit(nuevaUrl, doc.imagen);
              console.log(`      🎨 Transformaciones aplicadas`);
            }
            
            console.log(`      Nueva URL: ${nuevaUrl.substring(0, 80)}...`);
            
            // Actualizar documento
            const resultado = await modelo.findByIdAndUpdate(
              doc._id,
              { imagen: nuevaUrl },
              { new: true }
            );
            
            if (resultado) {
              totalActualizadas++;
              console.log(`      ✅ ACTUALIZADO`);
            } else {
              console.log(`      ❌ Error en actualización de BD`);
            }
          } else {
            console.log(`      ❌ NO ENCONTRADO (${estrategia})`);
            noEncontradas.push({
              modelo: nombreModelo,
              id: doc._id,
              nombre: doc.nombre || 'Sin nombre',
              url: doc.imagen,
              timestamp: urlInfo.timestamp,
              archivo: urlInfo.restoFilename,
              estrategia
            });
          }
        } catch (error) {
          console.log(`      💥 Error procesando documento ${doc._id}: ${error.message}`);
          noEncontradas.push({
            modelo: nombreModelo,
            id: doc._id,
            nombre: doc.nombre || 'Sin nombre',
            url: doc.imagen || 'URL faltante',
            error: error.message
          });
        }
      }
    }
    
    // Procesar todos los modelos
    await procesarModelo(Usuario, 'usuarios');
    await procesarModelo(Equipo, 'equipos');
    await procesarModelo(Torneo, 'torneos');
    
    // Verificación final
    console.log('\n📊 RESUMEN FINAL');
    console.log('=' * 40);
    
    const usuariosCloudinaryFinal = await Usuario.countDocuments({ imagen: { $regex: 'cloudinary' } });
    const equiposCloudinaryFinal = await Equipo.countDocuments({ imagen: { $regex: 'cloudinary' } });
    const torneosCloudinaryFinal = await Torneo.countDocuments({ imagen: { $regex: 'cloudinary' } });
    
    const usuariosImageKitFinal = await Usuario.countDocuments({ imagen: { $regex: 'imagekit' } });
    const equiposImageKitFinal = await Equipo.countDocuments({ imagen: { $regex: 'imagekit' } });
    const torneosImageKitFinal = await Torneo.countDocuments({ imagen: { $regex: 'imagekit' } });
    
    console.log(`📈 Estadísticas finales:`);
    console.log(`   👥 Usuarios    - Cloudinary: ${usuariosCloudinaryFinal} | ImageKit: ${usuariosImageKitFinal}`);
    console.log(`   ⚽ Equipos     - Cloudinary: ${equiposCloudinaryFinal} | ImageKit: ${equiposImageKitFinal}`);
    console.log(`   🏆 Torneos     - Cloudinary: ${torneosCloudinaryFinal} | ImageKit: ${torneosImageKitFinal}`);
    
    console.log(`\n🎯 Estrategias utilizadas:`);
    Object.entries(estrategias).forEach(([estrategia, count]) => {
      console.log(`   ${estrategia}: ${count}`);
    });
    
    console.log(`\n📊 Resultados:`);
    console.log(`   ✅ URLs actualizadas: ${totalActualizadas}`);
    console.log(`   ❌ URLs no encontradas: ${noEncontradas.length}`);
    
    // Guardar reporte
    if (noEncontradas.length > 0 || totalActualizadas > 0) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reporteCorregido = {
        timestamp: new Date().toISOString(),
        estadisticas: {
          actualizadas: totalActualizadas,
          estrategias,
          noEncontradas: noEncontradas.length
        },
        urlsNoEncontradas: noEncontradas
      };
      
      const reportePath = path.join(reportesDir, `migracion-corregida-${timestamp}.json`);
      fs.writeFileSync(reportePath, JSON.stringify(reporteCorregido, null, 2));
      console.log(`\n📄 Reporte guardado: ${reportePath}`);
    }
    
    console.log('\n🎉 Migración corregida completada');
    
    const totalCloudinary = usuariosCloudinaryFinal + equiposCloudinaryFinal + torneosCloudinaryFinal;
    if (totalCloudinary === 0) {
      console.log('🏆 ¡ÉXITO TOTAL! Todas las URLs han sido migradas a ImageKit');
      console.log('💡 Ahora puedes activar ImageKit con: USE_IMAGEKIT=true');
    } else {
      console.log(`⚠️  Quedan ${totalCloudinary} URLs de Cloudinary`);
      
      if (noEncontradas.length > 0) {
        console.log('\n🔍 URLs no encontradas - posibles causas:');
        console.log('   - Imágenes agregadas después de la migración original');
        console.log('   - Diferencias en nombres de archivos');
        console.log('   - Timestamps que no coinciden');
      }
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack completo:', error.stack);
    
    try {
      await mongoose.disconnect();
    } catch (e) {
      // Ignorar errores de desconexión
    }
    
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  console.log('🔧 MIGRACIÓN CORREGIDA PARA URLs CON TRANSFORMACIONES');
  console.log('⚠️  Este script actualiza URLs que tienen transformaciones aplicadas');
  console.log('\n⏸️ Presiona Ctrl+C en los próximos 5 segundos para cancelar...\n');
  
  setTimeout(() => {
    migracionCorregida();
  }, 5000);
}

module.exports = { 
  migracionCorregida,
  normalizarUrlCloudinary,
  buscarEnMapeo,
  aplicarTransformacionesImageKit
};