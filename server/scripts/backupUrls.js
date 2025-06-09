// server/scripts/backupUrls.js

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tu_db');

// Modelos
const Usuario = require('../src/models/Usuario');
const Equipo = require('../src/models/Equipo');

// 💾 FUNCIÓN PARA CREAR BACKUP DE URLs
const createUrlsBackup = async () => {
  try {
    console.log('💾 CREANDO BACKUP DE URLs ANTES DE OPTIMIZACIÓN\n');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../backups');
    
    // Crear directorio de backups si no existe
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log('📁 Directorio de backups creado');
    }
    
    // Obtener todas las URLs de usuarios
    const usuarios = await Usuario.find({
      imagen: { $regex: 'cloudinary.com' }
    }, { _id: 1, nombre: 1, imagen: 1 });
    
    // Obtener todas las URLs de equipos
    const equipos = await Equipo.find({
      imagen: { $regex: 'cloudinary.com' }
    }, { _id: 1, nombre: 1, imagen: 1 });
    
    const backup = {
      timestamp: new Date().toISOString(),
      created_by: 'backup_before_optimization',
      stats: {
        usuarios: usuarios.length,
        equipos: equipos.length,
        total: usuarios.length + equipos.length
      },
      usuarios: usuarios.map(u => ({
        id: u._id,
        nombre: u.nombre,
        url_original: u.imagen
      })),
      equipos: equipos.map(e => ({
        id: e._id,
        nombre: e.nombre,
        url_original: e.imagen
      }))
    };
    
    const backupFile = path.join(backupDir, `urls_backup_${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    
    console.log('✅ BACKUP CREADO EXITOSAMENTE');
    console.log(`📂 Archivo: ${backupFile}`);
    console.log(`📊 Usuarios respaldados: ${usuarios.length}`);
    console.log(`📊 Equipos respaldados: ${equipos.length}`);
    console.log(`📊 Total URLs respaldadas: ${usuarios.length + equipos.length}\n`);
    
    // También crear script de restauración
    const restoreScript = `// server/scripts/restoreFromBackup.js

const mongoose = require('mongoose');
const fs = require('fs');
const backupData = require('${backupFile}');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tu_db');

const Usuario = require('../src/models/Usuario');
const Equipo = require('../src/models/Equipo');

const restore = async () => {
  console.log('🔄 RESTAURANDO URLs DESDE BACKUP...');
  
  // Restaurar usuarios
  for (const usuario of backupData.usuarios) {
    await Usuario.findByIdAndUpdate(usuario.id, {
      imagen: usuario.url_original
    });
  }
  
  // Restaurar equipos
  for (const equipo of backupData.equipos) {
    await Equipo.findByIdAndUpdate(equipo.id, {
      imagen: equipo.url_original
    });
  }
  
  console.log('✅ RESTAURACIÓN COMPLETADA');
  mongoose.disconnect();
};

restore().catch(console.error);
`;
    
    const restoreFile = path.join(backupDir, `restore_${timestamp}.js`);
    fs.writeFileSync(restoreFile, restoreScript);
    
    console.log('🔄 SCRIPT DE RESTAURACIÓN CREADO');
    console.log(`📂 Archivo: ${restoreFile}`);
    console.log(`💡 Para restaurar: node ${restoreFile}\n`);
    
    return {
      backupFile,
      restoreFile,
      stats: backup.stats
    };
    
  } catch (error) {
    console.error('❌ Error creando backup:', error);
    throw error;
  } finally {
    mongoose.disconnect();
  }
};

// Ejecutar backup
if (require.main === module) {
  createUrlsBackup()
    .then(() => {
      console.log('🎉 BACKUP COMPLETADO - LISTO PARA OPTIMIZACIÓN');
    })
    .catch(console.error);
}

module.exports = { createUrlsBackup };