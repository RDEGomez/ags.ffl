// server/scripts/optimizeWorkingUrls.js

const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tu_db');

// Modelos
const Usuario = require('../src/models/Usuario');
const Equipo = require('../src/models/Equipo');

// 🔥 FUNCIÓN PARA GENERAR URL OPTIMIZADA
const generateOptimizedUrl = (functionalUrl) => {
  try {
    console.log(`🔧 Optimizando: ${functionalUrl.substring(0, 80)}...`);
    
    // Extraer public_id de la URL funcional
    // Ejemplo: https://res.cloudinary.com/dwviy7ft4/image/upload/v1749227285/laces-uploads/1749227284911-IMG_1670.jpeg.png
    const match = functionalUrl.match(/\/upload\/v(\d+)\/(.+)$/);
    if (!match) {
      console.log('❌ No se pudo extraer public_id');
      return functionalUrl;
    }
    
    const [, version, publicId] = match;
    console.log(`📂 Version: ${version}, Public ID: ${publicId.substring(0, 50)}...`);
    
    // Generar URL optimizada con transformaciones correctas
    const optimizedUrl = cloudinary.url(publicId, {
      version: version,
      transformation: [
        {
          width: 800,
          height: 800,
          crop: 'limit',           // Solo redimensionar si es más grande
          quality: 'auto:good',    // Calidad automática optimizada  
          fetch_format: 'auto',    // WebP automático cuando sea posible
          flags: 'progressive'     // Carga progresiva
        }
      ],
      secure: true
    });
    
    console.log(`✅ Optimizada: ${optimizedUrl.substring(0, 80)}...`);
    return optimizedUrl;
    
  } catch (error) {
    console.error('❌ Error generando URL optimizada:', error);
    return functionalUrl; // Devolver original si falla
  }
};

// 🧪 FUNCIÓN PARA PROBAR UNA URL
const testUrl = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
};

// 🔍 FUNCIÓN PARA VERIFICAR SI UNA URL YA ESTÁ OPTIMIZADA
const isAlreadyOptimized = (url) => {
  return url.includes('w_800') || 
         url.includes('f_auto') || 
         url.includes('q_auto') ||
         url.includes('c_limit');
};

// 🚀 FUNCIÓN PRINCIPAL DE OPTIMIZACIÓN
const optimizeWorkingUrls = async (dryRun = true) => {
  try {
    console.log('🚀 OPTIMIZANDO URLs FUNCIONALES\n');
    
    if (dryRun) {
      console.log('🔍 MODO DRY RUN - Solo simulación\n');
    } else {
      console.log('⚡ MODO APLICAR - Optimizando URLs reales\n');
    }

    let usuariosOptimizados = 0;
    let equiposOptimizados = 0;
    let usuariosYaOptimizados = 0;
    let equiposYaOptimizados = 0;

    // OPTIMIZAR USUARIOS
    const usuarios = await Usuario.find({
      imagen: { $regex: 'cloudinary.com' }
    });

    console.log(`👥 PROCESANDO ${usuarios.length} USUARIOS:\n`);

    for (let i = 0; i < usuarios.length; i++) {
      const usuario = usuarios[i];
      console.log(`🔄 [${i + 1}/${usuarios.length}] ${usuario.nombre}`);
      console.log(`   URL actual: ${usuario.imagen.substring(0, 70)}...`);
      
      // Verificar si ya está optimizada
      if (isAlreadyOptimized(usuario.imagen)) {
        console.log('   ✅ Ya está optimizada - saltando');
        usuariosYaOptimizados++;
        console.log('');
        continue;
      }
      
      // Generar URL optimizada
      const optimizedUrl = generateOptimizedUrl(usuario.imagen);
      
      if (optimizedUrl !== usuario.imagen) {
        console.log('   🧪 Probando URL optimizada...');
        const urlWorks = await testUrl(optimizedUrl);
        console.log(`   ${urlWorks ? '✅' : '❌'} URL optimizada ${urlWorks ? 'FUNCIONA' : 'NO funciona'}`);
        
        if (urlWorks && !dryRun) {
          await Usuario.findByIdAndUpdate(usuario._id, {
            imagen: optimizedUrl
          });
          console.log('   💾 Usuario actualizado con URL optimizada');
          usuariosOptimizados++;
        } else if (urlWorks && dryRun) {
          usuariosOptimizados++;
        } else {
          console.log('   ⚠️  Manteniendo URL original (optimizada no funciona)');
        }
      } else {
        console.log('   ⚠️  No se pudo generar URL optimizada');
      }
      
      console.log('');
      
      // Pausa cada 5 para no sobrecargar
      if (i % 5 === 4) {
        console.log('   ⏸️  Pausa cada 5...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // OPTIMIZAR EQUIPOS
    const equipos = await Equipo.find({
      imagen: { $regex: 'cloudinary.com' }
    });

    console.log(`🏆 PROCESANDO ${equipos.length} EQUIPOS:\n`);

    for (let i = 0; i < equipos.length; i++) {
      const equipo = equipos[i];
      console.log(`🔄 [${i + 1}/${equipos.length}] ${equipo.nombre}`);
      console.log(`   URL actual: ${equipo.imagen.substring(0, 70)}...`);
      
      // Verificar si ya está optimizada
      if (isAlreadyOptimized(equipo.imagen)) {
        console.log('   ✅ Ya está optimizada - saltando');
        equiposYaOptimizados++;
        console.log('');
        continue;
      }
      
      // Generar URL optimizada
      const optimizedUrl = generateOptimizedUrl(equipo.imagen);
      
      if (optimizedUrl !== equipo.imagen) {
        console.log('   🧪 Probando URL optimizada...');
        const urlWorks = await testUrl(optimizedUrl);
        console.log(`   ${urlWorks ? '✅' : '❌'} URL optimizada ${urlWorks ? 'FUNCIONA' : 'NO funciona'}`);
        
        if (urlWorks && !dryRun) {
          await Equipo.findByIdAndUpdate(equipo._id, {
            imagen: optimizedUrl
          });
          console.log('   💾 Equipo actualizado con URL optimizada');
          equiposOptimizados++;
        } else if (urlWorks && dryRun) {
          equiposOptimizados++;
        } else {
          console.log('   ⚠️  Manteniendo URL original (optimizada no funciona)');
        }
      } else {
        console.log('   ⚠️  No se pudo generar URL optimizada');
      }
      
      console.log('');
      
      // Pausa cada 5 para no sobrecargar
      if (i % 5 === 4) {
        console.log('   ⏸️  Pausa cada 5...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // RESUMEN FINAL
    console.log('📊 RESUMEN DE OPTIMIZACIÓN:');
    console.log('=' * 50);
    console.log(`👥 Usuarios:`);
    console.log(`   ✅ Optimizados: ${usuariosOptimizados}`);
    console.log(`   🔄 Ya optimizados: ${usuariosYaOptimizados}`);
    console.log(`   📊 Total procesados: ${usuarios.length}`);
    
    console.log(`🏆 Equipos:`);
    console.log(`   ✅ Optimizados: ${equiposOptimizados}`);
    console.log(`   🔄 Ya optimizados: ${equiposYaOptimizados}`);
    console.log(`   📊 Total procesados: ${equipos.length}`);
    
    const totalOptimizados = usuariosOptimizados + equiposOptimizados;
    const totalYaOptimizados = usuariosYaOptimizados + equiposYaOptimizados;
    const totalProcesados = usuarios.length + equipos.length;
    
    console.log(`\n🎯 RESULTADO GENERAL:`);
    console.log(`   ✅ Nuevas optimizaciones: ${totalOptimizados}`);
    console.log(`   🔄 Ya optimizadas: ${totalYaOptimizados}`);
    console.log(`   📊 Total imágenes: ${totalProcesados}`);
    
    if (dryRun) {
      console.log('\n💡 Para aplicar las optimizaciones, ejecuta:');
      console.log('   node optimizeWorkingUrls.js --apply');
    } else {
      console.log('\n🎉 ¡OPTIMIZACIÓN COMPLETADA!');
      console.log('💡 Las imágenes ahora cargarán más rápido y en formato WebP cuando sea posible.');
    }

  } catch (error) {
    console.error('❌ Error en optimización:', error);
  }
};

// 🧪 FUNCIÓN PARA PROBAR OPTIMIZACIÓN CON EJEMPLOS
const testOptimization = async () => {
  console.log('🧪 PROBANDO OPTIMIZACIÓN CON EJEMPLOS\n');
  
  const functionalExamples = [
    'https://res.cloudinary.com/dwviy7ft4/image/upload/v1748664126/laces-uploads/1748664125802-IMG_0103.JPG.png',
    'https://res.cloudinary.com/dwviy7ft4/image/upload/v1749227285/laces-uploads/1749227284911-IMG_1670.jpeg.png',
    'https://res.cloudinary.com/dwviy7ft4/image/upload/v1749224505/laces-uploads/1749224505076-WhatsApp%20Image%202025-06-06%20at%209.39.48%20AM.jpeg.png'
  ];
  
  for (let i = 0; i < functionalExamples.length; i++) {
    const functionalUrl = functionalExamples[i];
    console.log(`📝 EJEMPLO ${i + 1}:`);
    console.log(`   Original: ${functionalUrl.substring(0, 80)}...`);
    
    const optimizedUrl = generateOptimizedUrl(functionalUrl);
    console.log(`   Optimizada: ${optimizedUrl.substring(0, 80)}...`);
    
    console.log('   🧪 Probando URL optimizada...');
    const works = await testUrl(optimizedUrl);
    console.log(`   ${works ? '✅ FUNCIONA' : '❌ NO funciona'}`);
    
    if (works) {
      console.log('   🎯 ¡Lista para usar!');
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};

// 🚀 FUNCIÓN PRINCIPAL
const main = async () => {
  console.log('🚀 SCRIPT DE OPTIMIZACIÓN DE URLs FUNCIONALES\n');
  console.log('=' * 60);
  
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    await testOptimization();
  } else {
    const dryRun = !args.includes('--apply');
    await optimizeWorkingUrls(dryRun);
  }
  
  mongoose.disconnect();
  console.log('\n📝 Proceso completado.');
};

// Ejecutar script
if (require.main === module) {
  main();
}

module.exports = {
  optimizeWorkingUrls,
  generateOptimizedUrl,
  testOptimization
};