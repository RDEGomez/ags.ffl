// server/scripts/restoreFromBackup.js

const mongoose = require('mongoose');
const fs = require('fs');
const backupData = require('/Users/cachouse/Documents/NodeJS/ags.ffl/server/backups/urls_backup_2025-06-07T23-16-07-791Z.json');
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
