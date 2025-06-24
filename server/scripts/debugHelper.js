// scripts/debugHelper.js - Diagnosticar el helper de ImageKit
const fs = require('fs');
const path = require('path');

function diagnosticarHelper() {
  console.log('🔍 DIAGNÓSTICO DEL HELPER IMAGEKIT');
  console.log('=' * 50);
  
  const helperPath = path.join(process.cwd(), 'server', 'src', 'helpers', 'uploadImageKit.js');
  
  console.log('📁 Ruta esperada:', helperPath);
  console.log('📂 ¿Archivo existe?', fs.existsSync(helperPath));
  
  if (fs.existsSync(helperPath)) {
    try {
      const contenido = fs.readFileSync(helperPath, 'utf8');
      
      console.log('\n📊 ANÁLISIS DEL CONTENIDO:');
      console.log('📏 Tamaño del archivo:', contenido.length, 'caracteres');
      
      // Verificar palabras clave que el script busca
      const palabrasClave = [
        'ImageKit',
        'transformation',
        'upload',
        'testImageKitConnection',
        'logImageKitResult'
      ];
      
      console.log('\n🔍 PALABRAS CLAVE ENCONTRADAS:');
      palabrasClave.forEach(palabra => {
        const encontrada = contenido.includes(palabra);
        console.log(`   ${encontrada ? '✅' : '❌'} ${palabra}: ${encontrada ? 'SÍ' : 'NO'}`);
      });
      
      // Verificar exports
      console.log('\n📤 EXPORTS VERIFICADOS:');
      const exportsEsperados = [
        'module.exports',
        'upload',
        'logImageKitResult',
        'testImageKitConnection'
      ];
      
      exportsEsperados.forEach(exp => {
        const encontrado = contenido.includes(exp);
        console.log(`   ${encontrado ? '✅' : '❌'} ${exp}: ${encontrado ? 'SÍ' : 'NO'}`);
      });
      
      // Mostrar primeras y últimas líneas
      const lineas = contenido.split('\n');
      console.log('\n📋 PRIMERAS 3 LÍNEAS:');
      lineas.slice(0, 3).forEach((linea, i) => {
        console.log(`   ${i + 1}: ${linea}`);
      });
      
      console.log('\n📋 ÚLTIMAS 3 LÍNEAS:');
      const ultimasLineas = lineas.slice(-3);
      ultimasLineas.forEach((linea, i) => {
        console.log(`   ${lineas.length - 3 + i + 1}: ${linea}`);
      });
      
      // Intentar requerir el módulo
      console.log('\n🔧 PRUEBA DE REQUIRE:');
      try {
        delete require.cache[helperPath]; // Limpiar cache
        const helper = require(helperPath);
        
        console.log('✅ Helper se puede requerir exitosamente');
        console.log('📋 Exports disponibles:', Object.keys(helper));
        
        // Verificar funciones específicas
        const funcionesEsperadas = ['upload', 'logImageKitResult', 'testImageKitConnection'];
        funcionesEsperadas.forEach(func => {
          const existe = typeof helper[func] === 'function';
          console.log(`   ${existe ? '✅' : '❌'} ${func}: ${existe ? 'función' : 'no encontrada'}`);
        });
        
      } catch (requireError) {
        console.error('❌ Error al requerir el helper:', requireError.message);
        console.log('🔧 Esto podría ser el problema. Revisar sintaxis del archivo.');
      }
      
    } catch (readError) {
      console.error('❌ Error leyendo el archivo:', readError.message);
    }
  } else {
    console.log('❌ El archivo no existe en la ruta esperada');
    console.log('\n💡 SOLUCIONES:');
    console.log('   1. Verificar que la ruta sea correcta');
    console.log('   2. Crear el archivo manualmente');
    console.log('   3. Verificar permisos de archivo');
  }
  
  // Verificar estructura de directorios
  console.log('\n📂 ESTRUCTURA DE DIRECTORIOS:');
  const serverDir = path.join(process.cwd(), 'server');
  const srcDir = path.join(serverDir, 'src');
  const helpersDir = path.join(srcDir, 'helpers');
  
  console.log(`   server/: ${fs.existsSync(serverDir) ? '✅' : '❌'}`);
  console.log(`   server/src/: ${fs.existsSync(srcDir) ? '✅' : '❌'}`);
  console.log(`   server/src/helpers/: ${fs.existsSync(helpersDir) ? '✅' : '❌'}`);
  
  if (fs.existsSync(helpersDir)) {
    const archivos = fs.readdirSync(helpersDir);
    console.log('   📁 Archivos en helpers/:');
    archivos.forEach(archivo => {
      console.log(`      - ${archivo}`);
    });
  }
}

// Ejecutar diagnóstico
if (require.main === module) {
  diagnosticarHelper();
}

module.exports = { diagnosticarHelper };