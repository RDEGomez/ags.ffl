// scripts/diagnosticoSimple.js
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Usuario = require('../src/models/Usuario');

async function diagnosticoSimple() {
  try {
    console.log('🔍 DIAGNÓSTICO SIMPLE');
    console.log('=' * 30);
    
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL);
    
    // Obtener algunos usuarios con Cloudinary
    const usuarios = await Usuario.find({ 
      imagen: { $regex: 'cloudinary' } 
    }).select('_id nombre imagen').limit(5);
    
    console.log(`📊 Encontrados ${usuarios.length} usuarios con Cloudinary`);
    
    usuarios.forEach((usuario, index) => {
      console.log(`\n${index + 1}. Usuario: ${usuario.nombre || 'Sin nombre'}`);
      console.log(`   ID: ${usuario._id}`);
      console.log(`   Imagen: ${usuario.imagen || 'IMAGEN FALTANTE'}`);
      console.log(`   Tipo de imagen: ${typeof usuario.imagen}`);
      console.log(`   Longitud: ${usuario.imagen ? usuario.imagen.length : 'N/A'}`);
    });
    
    // Verificar mapeo
    const reportesDir = path.join(process.cwd(), 'migration-reports');
    const reportFiles = fs.readdirSync(reportesDir)
      .filter(f => f.startsWith('migracion-') && f.endsWith('.json'))
      .sort()
      .reverse();
    
    if (reportFiles.length > 0) {
      const reportePath = path.join(reportesDir, reportFiles[0]);
      const reporte = JSON.parse(fs.readFileSync(reportePath, 'utf8'));
      const mapeoUrls = reporte.mapeoUrls;
      
      console.log(`\n📄 Mapeo cargado: ${mapeoUrls ? mapeoUrls.length : 'MAPEO FALTANTE'} URLs`);
      
      if (mapeoUrls && mapeoUrls.length > 0) {
        console.log(`\n🔍 Ejemplo de mapeo:`);
        const ejemplo = mapeoUrls[0];
        console.log(`   Cloudinary: ${ejemplo.cloudinary || 'FALTANTE'}`);
        console.log(`   ImageKit: ${ejemplo.imagekit || 'FALTANTE'}`);
        console.log(`   Public ID: ${ejemplo.public_id || 'FALTANTE'}`);
      }
    } else {
      console.log(`\n❌ No se encontraron reportes de migración`);
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Diagnóstico completado');
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  diagnosticoSimple();
}

module.exports = { diagnosticoSimple };