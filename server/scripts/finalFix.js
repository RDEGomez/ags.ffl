// server/scripts/finalFix.js

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

// 🔧 FUNCIÓN PARA RECONSTRUIR URL BASADA EN PATRONES REALES
const reconstructUrl = (corruptedUrl) => {
  try {

    const specialMatch = corruptedUrl.match(/w_800\/(v\d+\/laces-uploads\/.+)$/);
    if (specialMatch) {
      const pathWithoutExtension = specialMatch[1];
      console.log(`📂 Patrón especial detectado: ${pathWithoutExtension}`);
  
  // Generar URLs candidatas agregando extensiones
  const specialUrls = ['.png', '.webp', '.jpg'].map(ext => 
    `https://res.cloudinary.com/dwviy7ft4/image/upload/${pathWithoutExtension}${ext}`
  );
  
  return specialUrls;
}
    // Extraer timestamp y nombre de la URL corrupta
    const match = corruptedUrl.match(/w_800\/(\d+)-(.+)$/);
    if (!match) {
      console.log('❌ No se pudo extraer timestamp y nombre');
      return [];
    }
    
    const [, timestamp, baseName] = match;
    console.log(`📂 Timestamp: ${timestamp}, Nombre: ${baseName}`);
    
    // Generar posibles URLs basadas en el patrón observado
    const possibleUrls = [];
    
    // Opción 1: Timestamp exacto + extensiones comunes
    const extensions = [
      '.JPG.png', 
      '.jpeg.png', 
      '.jpg.png', 
      '.webp.png',    // <- NUEVO
      '.JPEG.png',    // <- NUEVO  
      '.WebP.png',    // <- NUEVO
      '.png', 
      '.PNG.png'
    ];
    for (const ext of extensions) {
      possibleUrls.push(
        `https://res.cloudinary.com/dwviy7ft4/image/upload/v${timestamp}/laces-uploads/${timestamp}-${baseName}${ext}`
      );
    }
    
    // Opción 2: Timestamp +1 segundo (caso del ejemplo 1)
    const timestampPlus1 = (parseInt(timestamp) + 1).toString();
    for (const ext of extensions) {
      possibleUrls.push(
        `https://res.cloudinary.com/dwviy7ft4/image/upload/v${timestampPlus1}/laces-uploads/${timestamp}-${baseName}${ext}`
      );
    }
    
    // Opción 3: Timestamp -1 segundo (por si acaso)
    const timestampMinus1 = (parseInt(timestamp) - 1).toString();
    for (const ext of extensions) {
      possibleUrls.push(
        `https://res.cloudinary.com/dwviy7ft4/image/upload/v${timestampMinus1}/laces-uploads/${timestamp}-${baseName}${ext}`
      );
    }
    
    console.log(`🎯 Generadas ${possibleUrls.length} URLs candidatas`);
    return possibleUrls;
    
  } catch (error) {
    console.error('❌ Error reconstruyendo URL:', error);
    return [];
  }
};

// 🔍 FUNCIÓN MEJORADA PARA ENCONTRAR URL FUNCIONAL
const findWorkingUrl = async (corruptedUrl) => {
  try {
    console.log(`🔍 Procesando: ${corruptedUrl.substring(0, 80)}...`);
    
    // Generar URLs candidatas basadas en patrones
    const candidates = reconstructUrl(corruptedUrl);
    
    // Probar cada candidata hasta encontrar una que funcione
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      console.log(`   🧪 [${i + 1}/${candidates.length}] Probando: ${candidate.substring(0, 80)}...`);
      
      const works = await testUrl(candidate);
      if (works) {
        console.log(`   ✅ ¡ENCONTRADA! URL funcional`);
        return candidate;
      } else {
        console.log(`   ❌ No funciona`);
      }
      
      // Pequeña pausa entre pruebas
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`   ❌ Ninguna URL candidata funcionó`);
    return null;
    
  } catch (error) {
    console.error('❌ Error buscando URL funcional:', error);
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

// 🔧 FUNCIÓN PARA EXTRAER NOMBRE BASE DEL ARCHIVO
const extractFileName = (corruptedUrl) => {
  try {
    // Extraer el nombre del archivo de la URL corrupta
    const match = corruptedUrl.match(/w_800\/(.+)$/);
    if (!match) return null;
    
    const fullName = match[1];
    
    // Limpiar el nombre para la búsqueda
    // Ejemplo: "1749227284911-IMG_1670" -> "IMG_1670"
    const baseNameMatch = fullName.match(/^\d+-(.+)$/);
    if (baseNameMatch) {
      return baseNameMatch[1]; // Solo la parte después del timestamp
    }
    
    return fullName;
  } catch (error) {
    console.error('❌ Error extrayendo nombre:', error);
    return null;
  }
};

// 🚨 FUNCIÓN DE REPARACIÓN INTELIGENTE
const smartFix = async (dryRun = true) => {
  try {
    console.log('🔧 REPARACIÓN INTELIGENTE CON CLOUDINARY API\n');
    
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
    }) // Limitar para testing inicial

    console.log(`👥 PROCESANDO ${usuarios.length} USUARIOS:\n`);

    for (let i = 0; i < usuarios.length; i++) {
      const usuario = usuarios[i];
      console.log(`🔄 [${i + 1}/${usuarios.length}] ${usuario.nombre}`);
      console.log(`   URL corrupta: ${usuario.imagen.substring(0, 70)}...`);
      
      const fileName = extractFileName(usuario.imagen);
      console.log(`   Nombre archivo: ${fileName}`);
      
      if (fileName) {
        const functionalUrl = await findWorkingUrl(usuario.imagen);
        
        if (functionalUrl) {
          console.log(`   ✅ URL reparada encontrada`);
          
          if (!dryRun) {
            await Usuario.findByIdAndUpdate(usuario._id, {
              imagen: functionalUrl
            });
            console.log('   💾 Usuario actualizado');
            usuariosReparados++;
          } else {
            usuariosReparados++;
          }
        } else {
          console.log('   ❌ No se pudo reparar URL');
        }
      } else {
        console.log('   ❌ No se pudo extraer nombre de archivo');
      }
      
      console.log('');
      
      // Pausa para no sobrecargar Cloudinary API
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // REPARAR EQUIPOS (mismo proceso)
    const equipos = await Equipo.find({
      imagen: { $regex: 'c_limit,f_auto,fl_progressive,h_800,q_auto:good,w_800' }
    });

    console.log(`🏆 PROCESANDO ${equipos.length} EQUIPOS:\n`);

    for (let i = 0; i < equipos.length; i++) {
      const equipo = equipos[i];
      console.log(`🔄 [${i + 1}/${equipos.length}] ${equipo.nombre}`);
      console.log(`   URL corrupta: ${equipo.imagen.substring(0, 70)}...`);
      
      const fileName = extractFileName(equipo.imagen);
      console.log(`   Nombre archivo: ${fileName}`);
      
      if (fileName) {
        const functionalUrl = await findWorkingUrl(equipo.imagen);
        
        if (functionalUrl) {
          console.log(`   ✅ URL reparada encontrada`);
          
          if (!dryRun) {
            await Equipo.findByIdAndUpdate(equipo._id, {
              imagen: functionalUrl
            });
            console.log('   💾 Equipo actualizado');
            equiposReparados++;
          } else {
            equiposReparados++;
          }
        } else {
          console.log('   ❌ No se pudo reparar URL');
        }
      } else {
        console.log('   ❌ No se pudo extraer nombre de archivo');
      }
      
      console.log('');
      
      // Pausa para no sobrecargar Cloudinary API
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // RESUMEN
    console.log('📊 RESUMEN DE REPARACIÓN:');
    console.log('=' * 40);
    console.log(`👥 Usuarios reparados: ${usuariosReparados}/${usuarios.length}`);
    console.log(`🏆 Equipos reparados: ${equiposReparados}/${equipos.length}`);
    
    if (dryRun) {
      console.log('\n💡 Si los resultados se ven bien, ejecuta:');
      console.log('   node finalFix.js --apply');
      console.log('   node finalFix.js --all  (para procesar todos, no solo 5)');
    } else {
      console.log('\n🎉 ¡REPARACIÓN COMPLETADA!');
    }

  } catch (error) {
    console.error('❌ Error en reparación inteligente:', error);
  }
};

// 🧪 FUNCIÓN PARA PROBAR LOS 5 EJEMPLOS
const testExamples = async () => {
  console.log('🧪 PROBANDO LOS 5 EJEMPLOS REALES\n');
  
  const examples = [
    {
      corrupted: 'https://res.cloudinary.com/dwviy7ft4/image/upload/c_limit,f_auto,fl_progressive,h_800,q_auto:good,w_800/1749226874571-IMG_0103',
      expected: 'https://res.cloudinary.com/dwviy7ft4/image/upload/v1748664126/laces-uploads/1748664125802-IMG_0103.JPG.png'
    },
    {
      corrupted: 'https://res.cloudinary.com/dwviy7ft4/image/upload/c_limit,f_auto,fl_progressive,h_800,q_auto:good,w_800/1749227284911-IMG_1670',
      expected: 'https://res.cloudinary.com/dwviy7ft4/image/upload/v1749227285/laces-uploads/1749227284911-IMG_1670.jpeg.png'
    },
    {
      corrupted: 'https://res.cloudinary.com/dwviy7ft4/image/upload/c_limit,f_auto,fl_progressive,h_800,q_auto:good,w_800/1749224505076-WhatsApp%20Image%202025-06-06%20at%209.39.48%20AM',
      expected: 'https://res.cloudinary.com/dwviy7ft4/image/upload/v1749224505/laces-uploads/1749224505076-WhatsApp%20Image%202025-06-06%20at%209.39.48%20AM.jpeg.png'
    },
    {
      corrupted: 'https://res.cloudinary.com/dwviy7ft4/image/upload/c_limit,f_auto,fl_progressive,h_800,q_auto:good,w_800/1749227124159-050570B9-0BE2-4495-95FD-87AEFB755EBA',
      expected: 'https://res.cloudinary.com/dwviy7ft4/image/upload/v1749227125/laces-uploads/1749227124159-050570B9-0BE2-4495-95FD-87AEFB755EBA.jpeg.png'
    },
    {
      corrupted: 'https://res.cloudinary.com/dwviy7ft4/image/upload/c_limit,f_auto,fl_progressive,h_800,q_auto:good,w_800/1749226217028-Imagen%20de%20WhatsApp%202025-06-06%20a%20las%2010.08.13_cd1a2e4e',
      expected: 'https://res.cloudinary.com/dwviy7ft4/image/upload/v1749226217/laces-uploads/1749226217028-Imagen%20de%20WhatsApp%202025-06-06%20a%20las%2010.08.13_cd1a2e4e.jpg.png'
    }
  ];
  
  let successCount = 0;
  
  for (let i = 0; i < examples.length; i++) {
    const example = examples[i];
    console.log(`📝 EJEMPLO ${i + 1}:`);
    console.log(`   Corrupta: ${example.corrupted.substring(0, 80)}...`);
    console.log(`   Esperada: ${example.expected.substring(0, 80)}...`);
    
    console.log(`   🔍 Buscando automáticamente...`);
    const found = await findWorkingUrl(example.corrupted);
    
    if (found) {
      console.log(`   ✅ Encontrada: ${found.substring(0, 80)}...`);
      
      // Comparar con la esperada
      if (found === example.expected) {
        console.log(`   🎯 ¡COINCIDE EXACTAMENTE CON LA ESPERADA!`);
        successCount++;
      } else {
        console.log(`   ⚠️  Diferente a la esperada pero funciona`);
        console.log(`       Encontrada: ${found}`);
        console.log(`       Esperada:   ${example.expected}`);
        successCount++;
      }
    } else {
      console.log(`   ❌ No encontrada automáticamente`);
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`📊 RESUMEN: ${successCount}/${examples.length} ejemplos reparados exitosamente`);
  
  if (successCount === examples.length) {
    console.log('🎉 ¡PERFECTO! Todos los ejemplos funcionan. El script está listo.');
  } else if (successCount >= examples.length * 0.8) {
    console.log('✅ Muy bien! La mayoría funciona. Puedes proceder.');
  } else {
    console.log('⚠️  Necesita más ajustes antes de procesar todos.');
  }
};

// 🚀 FUNCIÓN PRINCIPAL
const main = async () => {
  console.log('🔧 SCRIPT FINAL DE REPARACIÓN\n');
  console.log('=' * 50);
  
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    await testExamples();
  } else {
    const dryRun = !args.includes('--apply');
    await smartFix(dryRun);
  }
  
  mongoose.disconnect();
  console.log('\n📝 Proceso completado.');
};

// Ejecutar script
if (require.main === module) {
  main();
}

module.exports = {
  smartFix,
  extractFileName
};