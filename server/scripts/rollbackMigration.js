// server/scripts/rollbackMigration.js

const mongoose = require('mongoose');
require('dotenv').config();

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tu_db');

// Modelos
const Usuario = require('../src/models/Usuario');
const Equipo = require('../src/models/Equipo');

// 🔄 FUNCIÓN PARA REVERTIR URL A ORIGINAL
const revertToOriginalUrl = (optimizedUrl) => {
  if (!optimizedUrl || !optimizedUrl.includes('cloudinary.com')) {
    return optimizedUrl;
  }

  try {
    // Si la URL ya tiene transformaciones, extraer la URL original
    const regex = /^(https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/)([^\/]+\/)*(.+)$/;
    const match = optimizedUrl.match(regex);
    
    if (match) {
      const baseUrl = match[1];
      const pathAndFile = match[3];
      
      // Reconstruir URL original sin transformaciones
      const originalUrl = baseUrl + pathAndFile;
      
      console.log('🔄 Revirtiendo URL:', {
        optimizada: optimizedUrl.substring(0, 80) + '...',
        original: originalUrl.substring(0, 80) + '...'
      });
      
      return originalUrl;
    }
    
    return optimizedUrl;
  } catch (error) {
    console.error('❌ Error revirtiendo URL:', error);
    return optimizedUrl;
  }
};

// 🔍 FUNCIÓN PARA INSPECCIONAR URLS PROBLEMÁTICAS
const inspectProblematicUrls = async () => {
  try {
    console.log('🔍 INSPECCIONANDO URLS PROBLEMÁTICAS\n');
    
    // Buscar usuarios con URLs que parecen tener transformaciones
    const usuarios = await Usuario.find({ 
      imagen: { $regex: /w_800|f_auto|q_auto/ } 
    }).limit(5);
    
    console.log('👥 USUARIOS CON URLS OPTIMIZADAS:');
    usuarios.forEach((usuario, index) => {
      console.log(`${index + 1}. ${usuario.nombre}`);
      console.log(`   URL actual: ${usuario.imagen}`);
      console.log(`   URL original sería: ${revertToOriginalUrl(usuario.imagen)}`);
      console.log('');
    });
    
    // Buscar equipos con URLs que parecen tener transformaciones
    const equipos = await Equipo.find({ 
      imagen: { $regex: /w_800|f_auto|q_auto/ } 
    }).limit(5);
    
    console.log('🏆 EQUIPOS CON URLS OPTIMIZADAS:');
    equipos.forEach((equipo, index) => {
      console.log(`${index + 1}. ${equipo.nombre}`);
      console.log(`   URL actual: ${equipo.imagen}`);
      console.log(`   URL original sería: ${revertToOriginalUrl(equipo.imagen)}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error inspeccionando URLs:', error);
  }
};

// 🚨 FUNCIÓN DE ROLLBACK COMPLETO
const rollbackMigration = async (dryRun = true) => {
  try {
    console.log('🚨 INICIANDO ROLLBACK DE MIGRACIÓN\n');
    
    if (dryRun) {
      console.log('🔍 MODO DRY RUN - Solo simulación\n');
    } else {
      console.log('⚡ MODO APLICAR - Revirtiendo cambios reales\n');
    }
    
    // Rollback usuarios
    const usuarios = await Usuario.find({ 
      imagen: { $regex: /w_800|f_auto|q_auto/ } 
    });
    
    console.log(`📋 Usuarios a revertir: ${usuarios.length}`);
    
    for (let i = 0; i < usuarios.length; i++) {
      const usuario = usuarios[i];
      const originalUrl = revertToOriginalUrl(usuario.imagen);
      
      console.log(`🔄 [${i + 1}/${usuarios.length}] Revirtiendo: ${usuario.nombre}`);
      
      if (!dryRun) {
        await Usuario.findByIdAndUpdate(usuario._id, {
          imagen: originalUrl
        });
        console.log(`   ✅ Usuario revertido`);
      } else {
        console.log(`   🔍 DRY RUN - No se guardó cambio`);
      }
    }
    
    // Rollback equipos
    const equipos = await Equipo.find({ 
      imagen: { $regex: /w_800|f_auto|q_auto/ } 
    });
    
    console.log(`\n📋 Equipos a revertir: ${equipos.length}`);
    
    for (let i = 0; i < equipos.length; i++) {
      const equipo = equipos[i];
      const originalUrl = revertToOriginalUrl(equipo.imagen);
      
      console.log(`🔄 [${i + 1}/${equipos.length}] Revirtiendo: ${equipo.nombre}`);
      
      if (!dryRun) {
        await Equipo.findByIdAndUpdate(equipo._id, {
          imagen: originalUrl
        });
        console.log(`   ✅ Equipo revertido`);
      } else {
        console.log(`   🔍 DRY RUN - No se guardó cambio`);
      }
    }
    
    console.log(`\n✅ Rollback completado!`);
    
    if (dryRun) {
      console.log('\n💡 Para aplicar el rollback real, ejecuta:');
      console.log('   node rollbackMigration.js --apply');
    }
    
  } catch (error) {
    console.error('❌ Error en rollback:', error);
  }
};

// 🚀 FUNCIÓN PRINCIPAL
const main = async () => {
  console.log('🚨 SCRIPT DE ROLLBACK DE MIGRACIÓN\n');
  console.log('=' * 40);
  
  try {
    // Primero inspeccionar
    await inspectProblematicUrls();
    
    // Verificar argumentos
    const args = process.argv.slice(2);
    const dryRun = !args.includes('--apply');
    
    // Ejecutar rollback
    await rollbackMigration(dryRun);
    
  } catch (error) {
    console.error('💥 Error en el proceso de rollback:', error);
  } finally {
    mongoose.disconnect();
    console.log('\n📝 Proceso completado.');
  }
};

// Ejecutar script
if (require.main === module) {
  main();
}

module.exports = {
  rollbackMigration,
  revertToOriginalUrl,
  inspectProblematicUrls
};