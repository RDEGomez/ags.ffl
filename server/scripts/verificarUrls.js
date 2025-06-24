// scripts/verificarUrls.js
const mongoose = require('mongoose');
require('dotenv').config();

// Modelos (ajusta las rutas según tu estructura)
const Usuario = require('../src/models/Usuario');
const Equipo = require('../src/models/Equipo');
const Torneo = require('../src/models/Torneo');
const Arbitro = require('../src/models/Arbitro');

async function verificarUrls() {
  try {
    console.log('🔍 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL);
    console.log('✅ Conectado a:', mongoose.connection.db.databaseName);
    console.log('📍 Host:', mongoose.connection.host);
    
    console.log('\n📊 ANÁLISIS DE URLs EN BASE DE DATOS');
    console.log('=' * 50);
    
    // Verificar usuarios
    const usuarios = await Usuario.find({ imagen: { $exists: true } });
    const usuariosCloudinary = usuarios.filter(u => u.imagen && u.imagen.includes('cloudinary'));
    const usuariosImageKit = usuarios.filter(u => u.imagen && u.imagen.includes('imagekit'));
    
    console.log(`👥 USUARIOS:`);
    console.log(`   Total con imagen: ${usuarios.length}`);
    console.log(`   Con Cloudinary: ${usuariosCloudinary.length}`);
    console.log(`   Con ImageKit: ${usuariosImageKit.length}`);
    
    if (usuariosCloudinary.length > 0) {
      console.log(`   Ejemplos Cloudinary:`);
      usuariosCloudinary.slice(0, 3).forEach(u => {
        console.log(`     - ${u.nombre || u._id}: ${u.imagen.substring(0, 80)}...`);
      });
    }
    
    if (usuariosImageKit.length > 0) {
      console.log(`   Ejemplos ImageKit:`);
      usuariosImageKit.slice(0, 3).forEach(u => {
        console.log(`     - ${u.nombre || u._id}: ${u.imagen.substring(0, 80)}...`);
      });
    }
    
    // Verificar equipos
    const equipos = await Equipo.find({ imagen: { $exists: true } });
    const equiposCloudinary = equipos.filter(e => e.imagen && e.imagen.includes('cloudinary'));
    const equiposImageKit = equipos.filter(e => e.imagen && e.imagen.includes('imagekit'));
    
    console.log(`\n⚽ EQUIPOS:`);
    console.log(`   Total con imagen: ${equipos.length}`);
    console.log(`   Con Cloudinary: ${equiposCloudinary.length}`);
    console.log(`   Con ImageKit: ${equiposImageKit.length}`);
    
    // Verificar torneos
    const torneos = await Torneo.find({ imagen: { $exists: true } });
    const torneosCloudinary = torneos.filter(t => t.imagen && t.imagen.includes('cloudinary'));
    const torneosImageKit = torneos.filter(t => t.imagen && t.imagen.includes('imagekit'));
    
    console.log(`\n🏆 TORNEOS:`);
    console.log(`   Total con imagen: ${torneos.length}`);
    console.log(`   Con Cloudinary: ${torneosCloudinary.length}`);
    console.log(`   Con ImageKit: ${torneosImageKit.length}`);
    
    // Verificar árbitros (a través de usuarios)
    const arbitros = await Arbitro.find({}).populate('usuario', 'imagen nombre');
    const arbitrosConImagen = arbitros.filter(a => a.usuario && a.usuario.imagen);
    const arbitrosCloudinary = arbitrosConImagen.filter(a => a.usuario.imagen.includes('cloudinary'));
    const arbitrosImageKit = arbitrosConImagen.filter(a => a.usuario.imagen.includes('imagekit'));
    
    console.log(`\n👨‍⚖️ ÁRBITROS (vía usuarios):`);
    console.log(`   Total con imagen: ${arbitrosConImagen.length}`);
    console.log(`   Con Cloudinary: ${arbitrosCloudinary.length}`);
    console.log(`   Con ImageKit: ${arbitrosImageKit.length}`);
    
    // Resumen total
    const totalCloudinary = usuariosCloudinary.length + equiposCloudinary.length + 
                           torneosCloudinary.length + arbitrosCloudinary.length;
    const totalImageKit = usuariosImageKit.length + equiposImageKit.length + 
                         torneosImageKit.length + arbitrosImageKit.length;
    
    console.log(`\n📈 RESUMEN TOTAL:`);
    console.log(`   🟡 URLs de Cloudinary: ${totalCloudinary}`);
    console.log(`   🟢 URLs de ImageKit: ${totalImageKit}`);
    
    if (totalCloudinary > 0) {
      console.log(`\n⚠️  ATENCIÓN: Aún tienes ${totalCloudinary} URLs de Cloudinary en tu BD`);
      console.log(`   Esto podría indicar:`);
      console.log(`   1. La migración no se ejecutó completamente`);
      console.log(`   2. Estás viendo una BD diferente a la que se migró`);
      console.log(`   3. Hay imágenes nuevas agregadas después de la migración`);
    } else {
      console.log(`\n🎉 ¡Perfecto! Todas las URLs están migradas a ImageKit`);
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  verificarUrls();
}

module.exports = { verificarUrls };