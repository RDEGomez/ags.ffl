// server/scripts/fixPublicIds.js

const mongoose = require('mongoose');
require('dotenv').config();

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tu_db');

// Modelos
const Usuario = require('../src/models/Usuario');
const Equipo = require('../src/models/Equipo');

// 🔍 FUNCIÓN PARA BUSCAR URL ORIGINAL EN BD
const findOriginalUrl = async (corruptedUrl) => {
  try {
    console.log('🔍 Buscando URL original para:', corruptedUrl.substring(0, 60) + '...');
    
    // Extraer el nombre base del archivo de la URL corrupta
    const fileMatch = corruptedUrl.match(/([^\/]+)\.(jpg|jpeg|png|webp|gif)$/i);
    if (!fileMatch) {
      console.log('❌ No se pudo extraer nombre de archivo');
      return null;
    }
    
    const fileName = fileMatch[1]; // Por ejemplo: "1749226874571-IMG_0103"
    const extension = fileMatch[2]; // Por ejemplo: "JPG"
    
    console.log('📂 Buscando archivo:', fileName, 'con extensión:', extension);
    
    // Buscar en usuarios todas las URLs que contengan ese nombre de archivo
    const usuariosConArchivo = await Usuario.find({
      imagen: { $regex: fileName, $options: 'i' }
    });
    
    // Buscar en equipos
    const equiposConArchivo = await Equipo.find({
      imagen: { $regex: fileName, $options: 'i' }
    });
    
    console.log(`📊 Encontrados: ${usuariosConArchivo.length} usuarios, ${equiposConArchivo.length} equipos`);
    
    // Revisar todas las URLs encontradas
    const todasLasUrls = [
      ...usuariosConArchivo.map(u => u.imagen),
      ...equiposConArchivo.map(e => e.imagen)
    ];
    
    for (const url of todasLasUrls) {
      console.log('🔍 Revisando URL:', url.substring(0, 80) + '...');
      
      // Si es una URL simple sin transformaciones complejas
      if (url.includes('cloudinary.com') && !url.includes('c_limit,f_auto')) {
        console.log('✅ URL original encontrada!');
        return url;
      }
    }
    
    console.log('❌ No se encontró URL original en BD');
    return null;
    
  } catch (error) {
    console.error('❌ Error buscando URL original:', error);
    return null;
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

// 🔧 FUNCIÓN PARA CORREGIR UN REGISTRO ESPECÍFICO
const fixSpecificRecord = async (collection, id, originalUrl, dryRun = true) => {
  try {
    console.log(`🔧 Corrigiendo ${collection} con ID: ${id}`);
    console.log(`   Nueva URL: ${originalUrl.substring(0, 80)}...`);
    
    if (!dryRun) {
      if (collection === 'Usuario') {
        await Usuario.findByIdAndUpdate(id, { imagen: originalUrl });
      } else if (collection === 'Equipo') {
        await Equipo.findByIdAndUpdate(id, { imagen: originalUrl });
      }
      console.log('   ✅ Registro actualizado en BD');
    } else {
      console.log('   🔍 DRY RUN - No se guardó cambio');
    }
    
  } catch (error) {
    console.error('❌ Error corrigiendo registro:', error);
  }
};

// 🚨 FUNCIÓN PRINCIPAL DE CORRECCIÓN
const fixCorruptedUrls = async (dryRun = true) => {
  try {
    console.log('🔧 CORRIGIENDO URLs CORRUPTAS DE CLOUDINARY\n');
    
    if (dryRun) {
      console.log('🔍 MODO DRY RUN - Solo simulación\n');
    } else {
      console.log('⚡ MODO APLICAR - Corrigiendo URLs reales\n');
    }

    // Buscar URLs corruptas (las que tienen transformaciones malformadas)
    const corruptPattern = /c_limit,f_auto,fl_progressive,h_800,q_auto:good,w_800/;

    // Usuarios con URLs corruptas
    const usuariosCorruptos = await Usuario.find({
      imagen: { $regex: corruptPattern }
    });

    console.log(`👥 Usuarios con URLs corruptas: ${usuariosCorruptos.length}\n`);

    for (let i = 0; i < usuariosCorruptos.length; i++) {
      const usuario = usuariosCorruptos[i];
      console.log(`🔄 [${i + 1}/${usuariosCorruptos.length}] Procesando: ${usuario.nombre}`);
      console.log(`   URL corrupta: ${usuario.imagen.substring(0, 80)}...`);
      
      // Buscar URL original
      const originalUrl = await findOriginalUrl(usuario.imagen);
      
      if (originalUrl) {
        console.log('   ✅ URL original encontrada');
        
        // Probar que funcione
        const urlWorks = await testUrl(originalUrl);
        console.log(`   🧪 URL funciona: ${urlWorks ? 'SÍ' : 'NO'}`);
        
        if (urlWorks) {
          await fixSpecificRecord('Usuario', usuario._id, originalUrl, dryRun);
        } else {
          console.log('   ❌ URL original no funciona');
        }
      } else {
        console.log('   ❌ No se pudo encontrar URL original');
      }
      
      console.log('');
    }

    // Equipos con URLs corruptas
    const equiposCorruptos = await Equipo.find({
      imagen: { $regex: corruptPattern }
    });

    console.log(`🏆 Equipos con URLs corruptas: ${equiposCorruptos.length}\n`);

    for (let i = 0; i < equiposCorruptos.length; i++) {
      const equipo = equiposCorruptos[i];
      console.log(`🔄 [${i + 1}/${equiposCorruptos.length}] Procesando: ${equipo.nombre}`);
      console.log(`   URL corrupta: ${equipo.imagen.substring(0, 80)}...`);
      
      // Buscar URL original
      const originalUrl = await findOriginalUrl(equipo.imagen);
      
      if (originalUrl) {
        console.log('   ✅ URL original encontrada');
        
        // Probar que funcione
        const urlWorks = await testUrl(originalUrl);
        console.log(`   🧪 URL funciona: ${urlWorks ? 'SÍ' : 'NO'}`);
        
        if (urlWorks) {
          await fixSpecificRecord('Equipo', equipo._id, originalUrl, dryRun);
        } else {
          console.log('   ❌ URL original no funciona');
        }
      } else {
        console.log('   ❌ No se pudo encontrar URL original');
      }
      
      console.log('');
    }

    console.log('✅ Corrección completada!');
    
    if (dryRun) {
      console.log('\n💡 Para aplicar las correcciones, ejecuta:');
      console.log('   node fixPublicIds.js --apply');
    }

  } catch (error) {
    console.error('❌ Error en el proceso de corrección:', error);
  }
};

// 🔍 FUNCIÓN PARA ANALIZAR PATRONES DE URLs
const analyzeUrlPatterns = async () => {
  try {
    console.log('🔍 ANALIZANDO PATRONES DE URLs\n');
    
    // Obtener todas las URLs de Cloudinary
    const usuarios = await Usuario.find({
      imagen: { $regex: 'cloudinary.com' }
    }).limit(20);
    
    const equipos = await Equipo.find({
      imagen: { $regex: 'cloudinary.com' }
    }).limit(20);
    
    console.log('👥 PATRONES EN USUARIOS:');
    usuarios.forEach((usuario, index) => {
      console.log(`${index + 1}. ${usuario.nombre}`);
      console.log(`   ${usuario.imagen}`);
      
      // Detectar tipo de URL
      if (usuario.imagen.includes('c_limit,f_auto')) {
        console.log('   ❌ URL CORRUPTA');
      } else if (usuario.imagen.includes('w_800') || usuario.imagen.includes('f_auto')) {
        console.log('   🟡 URL CON TRANSFORMACIONES');
      } else {
        console.log('   ✅ URL ORIGINAL');
      }
      console.log('');
    });
    
    console.log('🏆 PATRONES EN EQUIPOS:');
    equipos.forEach((equipo, index) => {
      console.log(`${index + 1}. ${equipo.nombre}`);
      console.log(`   ${equipo.imagen}`);
      
      if (equipo.imagen.includes('c_limit,f_auto')) {
        console.log('   ❌ URL CORRUPTA');
      } else if (equipo.imagen.includes('w_800') || equipo.imagen.includes('f_auto')) {
        console.log('   🟡 URL CON TRANSFORMACIONES');
      } else {
        console.log('   ✅ URL ORIGINAL');
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error analizando patrones:', error);
  }
};

// 🚀 FUNCIÓN PRINCIPAL
const main = async () => {
  console.log('🔧 SCRIPT DE CORRECCIÓN DE PUBLIC IDS\n');
  console.log('=' * 50);
  
  const args = process.argv.slice(2);
  
  if (args.includes('--analyze')) {
    await analyzeUrlPatterns();
  } else {
    const dryRun = !args.includes('--apply');
    await fixCorruptedUrls(dryRun);
  }
  
  mongoose.disconnect();
  console.log('\n📝 Proceso completado.');
};

// Ejecutar script
if (require.main === module) {
  main();
}

module.exports = {
  fixCorruptedUrls,
  findOriginalUrl,
  analyzeUrlPatterns
};