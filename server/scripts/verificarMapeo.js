// scripts/verificarMapeo.js
const fs = require('fs');
const path = require('path');

function verificarMapeo() {
  try {
    console.log('🔍 VERIFICANDO MAPEO DE MIGRACIÓN');
    console.log('=' * 40);
    
    const reportesDir = path.join(process.cwd(), 'migration-reports');
    console.log(`📁 Directorio de reportes: ${reportesDir}`);
    console.log(`📁 Existe directorio: ${fs.existsSync(reportesDir)}`);
    
    if (!fs.existsSync(reportesDir)) {
      console.log('❌ El directorio migration-reports no existe');
      return;
    }
    
    const archivos = fs.readdirSync(reportesDir);
    console.log(`📄 Archivos en directorio: ${archivos.length}`);
    
    archivos.forEach((archivo, index) => {
      console.log(`   ${index + 1}. ${archivo}`);
    });
    
    const reportFiles = archivos.filter(f => f.startsWith('migracion-') && f.endsWith('.json'));
    console.log(`\n📊 Archivos de migración JSON: ${reportFiles.length}`);
    
    if (reportFiles.length === 0) {
      console.log('❌ No se encontraron archivos de migración JSON');
      console.log('💡 Buscar archivos que contengan "mapeo" o "urls":');
      
      const posiblesArchivos = archivos.filter(f => 
        f.toLowerCase().includes('mapeo') || 
        f.toLowerCase().includes('urls') || 
        f.toLowerCase().includes('migration') ||
        f.endsWith('.json')
      );
      
      posiblesArchivos.forEach(archivo => {
        console.log(`   🔍 ${archivo}`);
        try {
          const contenido = JSON.parse(fs.readFileSync(path.join(reportesDir, archivo), 'utf8'));
          console.log(`      Claves: ${Object.keys(contenido).join(', ')}`);
          if (contenido.mapeoUrls) {
            console.log(`      ✅ Contiene mapeoUrls: ${contenido.mapeoUrls.length} URLs`);
          }
        } catch (e) {
          console.log(`      ❌ Error leyendo: ${e.message}`);
        }
      });
      
      return;
    }
    
    // Analizar el archivo más reciente
    const archivoReciente = reportFiles.sort().reverse()[0];
    const rutaArchivo = path.join(reportesDir, archivoReciente);
    
    console.log(`\n📄 Archivo más reciente: ${archivoReciente}`);
    console.log(`📍 Ruta completa: ${rutaArchivo}`);
    
    const contenido = fs.readFileSync(rutaArchivo, 'utf8');
    const reporte = JSON.parse(contenido);
    
    console.log(`\n📊 Estructura del reporte:`);
    console.log(`   Claves principales: ${Object.keys(reporte).join(', ')}`);
    
    if (reporte.mapeoUrls) {
      console.log(`   ✅ mapeoUrls encontrado: ${reporte.mapeoUrls.length} URLs`);
      
      // Mostrar ejemplo de URL
      if (reporte.mapeoUrls.length > 0) {
        const ejemplo = reporte.mapeoUrls[0];
        console.log(`\n🔍 Ejemplo de mapeo:`);
        console.log(`   Cloudinary: ${ejemplo.cloudinary}`);
        console.log(`   ImageKit: ${ejemplo.imagekit}`);
        console.log(`   Public ID: ${ejemplo.public_id}`);
        
        // Verificar si alguna URL del mapeo tiene las transformaciones que vemos en BD
        const conTransformacionesCompletas = reporte.mapeoUrls.filter(url => 
          url.cloudinary.includes('c_limit,f_auto,fl_progressive')
        );
        
        console.log(`\n🎨 URLs con transformaciones completas en mapeo: ${conTransformacionesCompletas.length}`);
        
        if (conTransformacionesCompletas.length > 0) {
          console.log(`   Ejemplo: ${conTransformacionesCompletas[0].cloudinary}`);
        }
      }
    } else {
      console.log(`   ❌ No se encontró mapeoUrls en el reporte`);
      console.log(`   📋 Claves disponibles: ${Object.keys(reporte).join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Error verificando mapeo:', error.message);
    console.error('Stack:', error.stack);
  }
}

if (require.main === module) {
  verificarMapeo();
}

module.exports = { verificarMapeo };