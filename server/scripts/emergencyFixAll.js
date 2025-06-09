// server/scripts/emergencyFixAll.js

const mongoose = require('mongoose');
require('dotenv').config();

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tu_db');

// Modelos
const Usuario = require('../src/models/Usuario');
const Equipo = require('../src/models/Equipo');

// 🚨 FUNCIÓN PARA RECONSTRUIR URL ORIGINAL
const reconstructOriginalUrl = (corruptedUrl) => {
  try {
    // Extraer solo el nombre del archivo de la URL corrupta
    const match = corruptedUrl.match(/w_800\/(.+)$/);
    if (!match) {
      console.log('❌ No se pudo extraer archivo de:', corruptedUrl);
      return null;
    }
    
    const fileName = match[1];
    console.log('📂 Archivo extraído:', fileName);
    
    // Extraer timestamp del nombre del archivo
    const timestampMatch = fileName.match(/^(\d{13})/);
    if (!timestampMatch) {
      console.log('❌ No se pudo extraer timestamp');
      return null;
    }
    
    const timestamp = timestampMatch[1];
    
    // Construir URL original estimada
    const reconstructedUrl = `https://res.cloudinary.com/dwviy7ft4/image/upload/v${timestamp}/laces-uploads/${fileName}`;
    
    console.log('🔧 URL reconstruida:', reconstructedUrl);
    return reconstructedUrl;
    
  } catch (error) {
    console.error('❌ Error reconstruyendo URL:', error);
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

// 🚨 FUNCIÓN DE REPARACIÓN MASIVA
const emergencyFixAll = async (dryRun = true) => {
  try {
    console.log('🚨 REPARACIÓN DE EMERGENCIA - TODAS LAS URLs\n');
    
    if (dryRun) {
      console.log('🔍 MODO DRY RUN - Solo simulación\n');
    } else {
      console.log('⚡ MODO APLICAR - Reparando URLs reales\n');
    }

    let usuariosReparados = 0;
    let equiposReparados = 0;

    // REPARAR USUARIOS
    const usuarios = await Usuario.find({
      imagen: { $regex: 'c_limit,f_auto,fl_progressive,h_800,q_auto:good,w_800' }
    });

    console.log(`👥 REPARANDO ${usuarios.length} USUARIOS:\n`);

    for (let i = 0; i < usuarios.length; i++) {
      const usuario = usuarios[i];
      console.log(`🔄 [${i + 1}/${usuarios.length}] ${usuario.nombre}`);
      console.log(`   URL corrupta: ${usuario.imagen.substring(0, 70)}...`);
      
      const reconstructedUrl = reconstructOriginalUrl(usuario.imagen);
      
      if (reconstructedUrl) {
        console.log(`   URL reconstruida: ${reconstructedUrl.substring(0, 70)}...`);
        
        // Probar la URL reconstruida
        console.log('   🧪 Probando URL...');
        const urlWorks = await testUrl(reconstructedUrl);
        console.log(`   ${urlWorks ? '✅' : '❌'} URL ${urlWorks ? 'FUNCIONA' : 'NO funciona'}`);
        
        if (urlWorks && !dryRun) {
          await Usuario.findByIdAndUpdate(usuario._id, {
            imagen: reconstructedUrl
          });
          console.log('   💾 Usuario actualizado');
          usuariosReparados++;
        } else if (urlWorks && dryRun) {
          usuariosReparados++;
        }
      } else {
        console.log('   ❌ No se pudo reconstruir URL');
      }
      
      console.log('');
      
      // Pausa cada 5 para no sobrecargar
      if (i % 5 === 4) {
        console.log('   ⏸️  Pausa cada 5...\n');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // REPARAR EQUIPOS
    const equipos = await Equipo.find({
      imagen: { $regex: 'c_limit,f_auto,fl_progressive,h_800,q_auto:good,w_800' }
    });

    console.log(`🏆 REPARANDO ${equipos.length} EQUIPOS:\n`);

    for (let i = 0; i < equipos.length; i++) {
      const equipo = equipos[i];
      console.log(`🔄 [${i + 1}/${equipos.length}] ${equipo.nombre}`);
      console.log(`   URL corrupta: ${equipo.imagen.substring(0, 70)}...`);
      
      const reconstructedUrl = reconstructOriginalUrl(equipo.imagen);
      
      if (reconstructedUrl) {
        console.log(`   URL reconstruida: ${reconstructedUrl.substring(0, 70)}...`);
        
        // Probar la URL reconstruida
        console.log('   🧪 Probando URL...');
        const urlWorks = await testUrl(reconstructedUrl);
        console.log(`   ${urlWorks ? '✅' : '❌'} URL ${urlWorks ? 'FUNCIONA' : 'NO funciona'}`);
        
        if (urlWorks && !dryRun) {
          await Equipo.findByIdAndUpdate(equipo._id, {
            imagen: reconstructedUrl
          });
          console.log('   💾 Equipo actualizado');
          equiposReparados++;
        } else if (urlWorks && dryRun) {
          equiposReparados++;
        }
      } else {
        console.log('   ❌ No se pudo reconstruir URL');
      }
      
      console.log('');
      
      // Pausa cada 5 para no sobrecargar
      if (i % 5 === 4) {
        console.log('   ⏸️  Pausa cada 5...\n');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // RESUMEN FINAL
    console.log('📊 RESUMEN DE REPARACIÓN:');
    console.log('=' * 40);
    console.log(`👥 Usuarios reparados: ${usuariosReparados}/${usuarios.length}`);
    console.log(`🏆 Equipos reparados: ${equiposReparados}/${equipos.length}`);
    console.log(`🎯 Total reparado: ${usuariosReparados + equiposReparados}/${usuarios.length + equipos.length}`);
    
    const porcentajeExito = usuarios.length + equipos.length > 0 ? 
      ((usuariosReparados + equiposReparados) / (usuarios.length + equipos.length) * 100).toFixed(1) : 0;
    
    console.log(`📈 Porcentaje de éxito: ${porcentajeExito}%`);
    
    if (dryRun) {
      console.log('\n💡 Para aplicar las reparaciones, ejecuta:');
      console.log('   node emergencyFixAll.js --apply');
    } else {
      console.log('\n🎉 ¡REPARACIÓN COMPLETADA!');
      console.log('💡 Revisa tu sitio web - las imágenes deberían funcionar ahora.');
    }

  } catch (error) {
    console.error('❌ Error en reparación de emergencia:', error);
  }
};

// 🧪 FUNCIÓN PARA PROBAR UN EJEMPLO
const testExample = async () => {
  console.log('🧪 PROBANDO RECONSTRUCCIÓN DE EJEMPLO\n');
  
  const corruptedExample = 'https://res.cloudinary.com/dwviy7ft4/image/upload/c_limit,f_auto,fl_progressive,h_800,q_auto:good,w_800/1749226874571-IMG_0103';
  
  console.log('❌ URL corrupta:');
  console.log(corruptedExample);
  
  const reconstructed = reconstructOriginalUrl(corruptedExample);
  
  if (reconstructed) {
    console.log('\n✅ URL reconstruida:');
    console.log(reconstructed);
    
    console.log('\n🧪 Probando URL reconstruida...');
    const works = await testUrl(reconstructed);
    console.log(`Resultado: ${works ? '✅ FUNCIONA' : '❌ NO funciona'}`);
    
    if (works) {
      console.log('\n🎉 ¡La reconstrucción funciona! Puedes proceder con --apply');
    } else {
      console.log('\n⚠️  La URL reconstruida no funciona. Puede necesitar ajustes.');
    }
  } else {
    console.log('\n❌ No se pudo reconstruir la URL');
  }
};

// 🚀 FUNCIÓN PRINCIPAL
const main = async () => {
  console.log('🚨 SCRIPT DE REPARACIÓN DE EMERGENCIA\n');
  console.log('=' * 50);
  
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    await testExample();
  } else {
    const dryRun = !args.includes('--apply');
    await emergencyFixAll(dryRun);
  }
  
  mongoose.disconnect();
  console.log('\n📝 Proceso completado.');
};

// Ejecutar script
if (require.main === module) {
  main();
}

module.exports = {
  emergencyFixAll,
  reconstructOriginalUrl,
  testUrl
};