// server/scripts/fixCloudinaryUrls.js

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

// 🔧 FUNCIÓN PARA CORREGIR URL DE CLOUDINARY
const fixCloudinaryUrl = (brokenUrl) => {
  if (!brokenUrl || !brokenUrl.includes('cloudinary.com')) {
    return brokenUrl;
  }

  try {
    // Extraer el public_id y version de la URL rota
    const regex = /https:\/\/res\.cloudinary\.com\/([^\/]+)\/image\/upload\/([^\/]+)\/v(\d+)\/(.+)$/;
    const match = brokenUrl.match(regex);
    
    if (!match) {
      console.log('⚠️  No se pudo parsear URL:', brokenUrl);
      return brokenUrl;
    }

    const [, cloudName, transformations, version, pathAndFile] = match;
    
    // Construir public_id correcto (incluye la carpeta)
    const publicId = pathAndFile;
    
    console.log('🔍 Parseando URL:', {
      cloudName,
      publicId,
      version,
      transformaciones_originales: transformations
    });

    // Generar URL correcta con transformaciones en orden correcto
    const fixedUrl = cloudinary.url(publicId, {
      version: version,
      transformation: [
        {
          width: 800,
          height: 800,
          crop: 'limit',
          quality: 'auto:good',
          fetch_format: 'auto',
          flags: 'progressive'
        }
      ],
      secure: true
    });

    console.log('✅ URL corregida generada');
    return fixedUrl;

  } catch (error) {
    console.error('❌ Error corrigiendo URL:', error);
    // Si falla, intentar generar URL original sin transformaciones
    return generateOriginalUrl(brokenUrl);
  }
};

// 🔄 FUNCIÓN PARA GENERAR URL ORIGINAL (sin transformaciones)
const generateOriginalUrl = (brokenUrl) => {
  try {
    const regex = /https:\/\/res\.cloudinary\.com\/([^\/]+)\/image\/upload\/[^\/]+\/v(\d+)\/(.+)$/;
    const match = brokenUrl.match(regex);
    
    if (match) {
      const [, cloudName, version, pathAndFile] = match;
      return `https://res.cloudinary.com/${cloudName}/image/upload/v${version}/${pathAndFile}`;
    }
    
    return brokenUrl;
  } catch (error) {
    console.error('❌ Error generando URL original:', error);
    return brokenUrl;
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

// 🔍 FUNCIÓN PARA INSPECCIONAR Y CORREGIR
const inspectAndFix = async (dryRun = true) => {
  try {
    console.log('🔍 INSPECCIONANDO Y CORRIGIENDO URLS DE CLOUDINARY\n');
    
    if (dryRun) {
      console.log('🔍 MODO DRY RUN - Solo simulación\n');
    } else {
      console.log('⚡ MODO APLICAR - Corrigiendo URLs reales\n');
    }

    // Buscar URLs problemáticas (las que tienen transformaciones en orden incorrecto)
    const problematicUrlPattern = /c_limit,f_auto,fl_progressive,h_800,q_auto:good,w_800/;

    // Usuarios con URLs problemáticas
    const usuarios = await Usuario.find({
      imagen: { $regex: problematicUrlPattern }
    });

    console.log(`👥 Usuarios con URLs problemáticas: ${usuarios.length}\n`);

    for (let i = 0; i < usuarios.length; i++) {
      const usuario = usuarios[i];
      console.log(`🔄 [${i + 1}/${usuarios.length}] Procesando: ${usuario.nombre}`);
      console.log(`   URL problemática: ${usuario.imagen.substring(0, 80)}...`);
      
      const fixedUrl = fixCloudinaryUrl(usuario.imagen);
      console.log(`   URL corregida: ${fixedUrl.substring(0, 80)}...`);
      
      // Probar que la URL funcione
      console.log('   🧪 Probando URL corregida...');
      const urlWorks = await testUrl(fixedUrl);
      console.log(`   ${urlWorks ? '✅' : '❌'} URL ${urlWorks ? 'funciona' : 'NO funciona'}`);
      
      if (urlWorks && !dryRun) {
        await Usuario.findByIdAndUpdate(usuario._id, {
          imagen: fixedUrl
        });
        console.log(`   💾 Usuario actualizado en BD`);
      } else if (!dryRun && !urlWorks) {
        // Si la URL corregida no funciona, usar la original sin transformaciones
        const originalUrl = generateOriginalUrl(usuario.imagen);
        await Usuario.findByIdAndUpdate(usuario._id, {
          imagen: originalUrl
        });
        console.log(`   💾 Usuario actualizado con URL original (sin optimizaciones)`);
      }
      
      console.log('');
    }

    // Equipos con URLs problemáticas
    const equipos = await Equipo.find({
      imagen: { $regex: problematicUrlPattern }
    });

    console.log(`🏆 Equipos con URLs problemáticas: ${equipos.length}\n`);

    for (let i = 0; i < equipos.length; i++) {
      const equipo = equipos[i];
      console.log(`🔄 [${i + 1}/${equipos.length}] Procesando: ${equipo.nombre}`);
      console.log(`   URL problemática: ${equipo.imagen.substring(0, 80)}...`);
      
      const fixedUrl = fixCloudinaryUrl(equipo.imagen);
      console.log(`   URL corregida: ${fixedUrl.substring(0, 80)}...`);
      
      // Probar que la URL funcione
      console.log('   🧪 Probando URL corregida...');
      const urlWorks = await testUrl(fixedUrl);
      console.log(`   ${urlWorks ? '✅' : '❌'} URL ${urlWorks ? 'funciona' : 'NO funciona'}`);
      
      if (urlWorks && !dryRun) {
        await Equipo.findByIdAndUpdate(equipo._id, {
          imagen: fixedUrl
        });
        console.log(`   💾 Equipo actualizado en BD`);
      } else if (!dryRun && !urlWorks) {
        const originalUrl = generateOriginalUrl(equipo.imagen);
        await Equipo.findByIdAndUpdate(equipo._id, {
          imagen: originalUrl
        });
        console.log(`   💾 Equipo actualizado con URL original (sin optimizaciones)`);
      }
      
      console.log('');
    }

    console.log('✅ Inspección y corrección completada!');
    
    if (dryRun) {
      console.log('\n💡 Para aplicar las correcciones, ejecuta:');
      console.log('   node fixCloudinaryUrls.js --apply');
    }

  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
};

// 🧪 FUNCIÓN PARA PROBAR LA URL DE EJEMPLO
const testExampleUrl = async () => {
  console.log('🧪 PROBANDO URL DE EJEMPLO\n');
  
  const brokenUrl = 'https://res.cloudinary.com/dwviy7ft4/image/upload/c_limit,f_auto,fl_progressive,h_800,q_auto:good,w_800/v1749226875/laces-uploads/1749226874571-IMG_0103.JPG';
  
  console.log('❌ URL problemática:');
  console.log(brokenUrl);
  
  const fixedUrl = fixCloudinaryUrl(brokenUrl);
  
  console.log('\n✅ URL corregida:');
  console.log(fixedUrl);
  
  console.log('\n🧪 Probando URLs...');
  
  const brokenWorks = await testUrl(brokenUrl);
  const fixedWorks = await testUrl(fixedUrl);
  
  console.log(`❌ URL problemática funciona: ${brokenWorks ? 'SÍ' : 'NO'}`);
  console.log(`✅ URL corregida funciona: ${fixedWorks ? 'SÍ' : 'NO'}`);
  
  console.log('\n💡 Copia y pega la URL corregida en tu navegador para probarla!');
};

// 🚀 FUNCIÓN PRINCIPAL
const main = async () => {
  console.log('🔧 SCRIPT DE CORRECCIÓN DE URLS DE CLOUDINARY\n');
  console.log('=' * 50);
  
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    await testExampleUrl();
  } else {
    const dryRun = !args.includes('--apply');
    await inspectAndFix(dryRun);
  }
  
  mongoose.disconnect();
  console.log('\n📝 Proceso completado.');
};

// Ejecutar script
if (require.main === module) {
  main();
}

module.exports = {
  fixCloudinaryUrl,
  generateOriginalUrl,
  testUrl
};