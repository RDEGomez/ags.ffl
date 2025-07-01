// 📁 server/scripts/cambiarCapitanesAJugadores.js
// 🔄 Script para cambiar todos los capitanes a jugadores con respaldo automático

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// 🔥 FIX: Cargar .env desde el directorio raíz del server
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// 📋 Modelo de Usuario (simplificado para el script)
const usuarioSchema = new mongoose.Schema({
  nombre: String,
  email: String,
  documento: String,
  rol: {
    type: String,
    enum: ['admin', 'jugador', 'capitan', 'arbitro'],
    default: 'jugador'
  },
  equipos: [{
    equipo: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipo' },
    numero: Number
  }],
  imagen: String,
  fechaRegistro: { type: Date, default: Date.now }
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

// 🎯 FUNCIÓN PRINCIPAL
async function cambiarCapitanesAJugadores() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  console.log('🚀 === INICIO DEL SCRIPT ===');
  console.log(`📅 Fecha: ${new Date().toLocaleString()}`);
  
  // 🔥 VALIDAR MONGODB_URI
  if (!process.env.MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI no encontrada en las variables de entorno');
    console.log('💡 Ubicaciones verificadas:');
    console.log(`   📁 .env esperado en: ${path.join(__dirname, '../.env')}`);
    console.log(`   📁 Directorio actual: ${__dirname}`);
    console.log(`   📋 Variables disponibles: ${Object.keys(process.env).filter(k => k.includes('MONGO')).join(', ') || 'Ninguna con MONGO'}`);
    return;
  }

  console.log(`🔗 Conectando a: ${process.env.MONGODB_URI.substring(0, 50)}...`);

  try {
    // 🔌 CONECTAR A MONGODB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conexión a MongoDB establecida');

    // 🔍 OBTENER TODOS LOS CAPITANES
    console.log('\n🔍 === BÚSQUEDA DE CAPITANES ===');
    const capitanes = await Usuario.find({ rol: 'capitan' }).lean();
    
    console.log(`📊 Capitanes encontrados: ${capitanes.length}`);
    
    if (capitanes.length === 0) {
      console.log('⚠️  No se encontraron usuarios con rol "capitan"');
      await mongoose.disconnect();
      return;
    }

    // 📝 MOSTRAR LISTA DE CAPITANES
    console.log('\n📋 === LISTA DE CAPITANES ===');
    capitanes.forEach((capitan, index) => {
      console.log(`${index + 1}. ${capitan.nombre} (${capitan.email}) - ID: ${capitan._id}`);
    });

    // 💾 CREAR RESPALDO
    console.log('\n💾 === CREANDO RESPALDO ===');
    const backupDir = path.join(__dirname, '../backups');
    const backupFile = path.join(backupDir, `capitanes_backup_${timestamp}.json`);
    
    // Asegurar que existe el directorio backups
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log('📁 Directorio backups creado');
    }

    const backupData = {
      timestamp: new Date().toISOString(),
      totalCapitanes: capitanes.length,
      capitanes: capitanes.map(cap => ({
        _id: cap._id,
        nombre: cap.nombre,
        email: cap.email,
        documento: cap.documento,
        rol: cap.rol,
        equipos: cap.equipos,
        imagen: cap.imagen,
        fechaRegistro: cap.fechaRegistro
      })),
      metadata: {
        scriptVersion: '1.0',
        mongoUri: process.env.MONGODB_URI?.substring(0, 50) + '...',
        nodeVersion: process.version
      }
    };

    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`✅ Respaldo creado: ${backupFile}`);
    console.log(`📊 Respaldo contiene ${capitanes.length} usuarios`);

    // 🔄 ACTUALIZAR ROLES
    console.log('\n🔄 === ACTUALIZANDO ROLES ===');
    
    const idsCapitanes = capitanes.map(cap => cap._id);
    
    const resultado = await Usuario.updateMany(
      { _id: { $in: idsCapitanes } },
      { $set: { rol: 'jugador' } }
    );

    console.log(`✅ Actualización completada:`);
    console.log(`   📊 Documentos coincidentes: ${resultado.matchedCount}`);
    console.log(`   🔄 Documentos modificados: ${resultado.modifiedCount}`);

    // 🔍 VERIFICAR CAMBIOS
    console.log('\n🔍 === VERIFICACIÓN FINAL ===');
    const capitanesRestantes = await Usuario.find({ rol: 'capitan' }).lean();
    const exCapitanesAhora = await Usuario.find({ 
      _id: { $in: idsCapitanes },
      rol: 'jugador' 
    }).lean();

    console.log(`📊 Capitanes restantes: ${capitanesRestantes.length}`);
    console.log(`✅ Ex-capitanes ahora jugadores: ${exCapitanesAhora.length}`);

    if (exCapitanesAhora.length === capitanes.length) {
      console.log('🎉 ¡ÉXITO! Todos los capitanes fueron convertidos a jugadores');
    } else {
      console.log('⚠️  ADVERTENCIA: Algunos capitanes no fueron convertidos');
    }

    // 📋 RESUMEN FINAL
    console.log('\n📋 === RESUMEN FINAL ===');
    console.log(`✅ Capitanes procesados: ${capitanes.length}`);
    console.log(`✅ Respaldo creado en: backups/capitanes_backup_${timestamp}.json`);
    console.log(`✅ Roles actualizados: ${resultado.modifiedCount}`);
    console.log(`⏰ Duración: ${Date.now() - Date.now()} ms`);

  } catch (error) {
    console.error('\n❌ === ERROR ===');
    console.error('💥 Error en el script:', error.message);
    console.error('📋 Stack trace:', error.stack);
  } finally {
    // 🔌 DESCONECTAR
    console.log('\n🔌 Desconectando de MongoDB...');
    await mongoose.disconnect();
    console.log('✅ Desconexión completada');
    console.log('🚀 === FIN DEL SCRIPT ===\n');
  }
}

// 🎯 FUNCIÓN DE DEBUG
function debugConfiguracion() {
  console.log('🔍 === DEBUG DE CONFIGURACIÓN ===');
  console.log(`📁 Directorio del script: ${__dirname}`);
  console.log(`📁 Directorio actual: ${process.cwd()}`);
  console.log(`📁 Archivo .env esperado: ${path.join(__dirname, '../.env')}`);
  console.log(`📋 ¿Existe .env?: ${fs.existsSync(path.join(__dirname, '../.env')) ? '✅ SÍ' : '❌ NO'}`);
  console.log(`🔗 MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Configurada' : '❌ No encontrada'}`);
  
  if (process.env.MONGODB_URI) {
    console.log(`📡 URI (primeros 50 chars): ${process.env.MONGODB_URI.substring(0, 50)}...`);
  }
  
  // Buscar otros archivos .env posibles
  const posiblesEnv = [
    path.join(__dirname, '../.env'),
    path.join(__dirname, '../../.env'),
    path.join(__dirname, '.env'),
    path.join(process.cwd(), '.env')
  ];
  
  console.log('\n📂 Búsqueda de archivos .env:');
  posiblesEnv.forEach(ruta => {
    console.log(`   ${fs.existsSync(ruta) ? '✅' : '❌'} ${ruta}`);
  });
}

// 🔄 FUNCIÓN DE RESTAURACIÓN (BONUS)
async function restaurarCapitanes(backupFileName) {
  console.log('🔄 === RESTAURACIÓN DE CAPITANES ===');
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI no encontrada');
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const backupFile = path.join(__dirname, '../backups', backupFileName);
    
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Archivo de respaldo no encontrado: ${backupFile}`);
    }

    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    const idsARestaurar = backupData.capitanes.map(cap => cap._id);

    const resultado = await Usuario.updateMany(
      { _id: { $in: idsARestaurar } },
      { $set: { rol: 'capitan' } }
    );

    console.log(`✅ Restauración completada: ${resultado.modifiedCount} usuarios`);
    
  } catch (error) {
    console.error('❌ Error en restauración:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// 🎯 EJECUTAR SCRIPT
if (require.main === module) {
  // Verificar argumentos
  const args = process.argv.slice(2);
  
  if (args[0] === '--restore' && args[1]) {
    // Modo restauración: node cambiarCapitanesAJugadores.js --restore nombre_archivo.json
    restaurarCapitanes(args[1]);
  } else if (args[0] === '--debug') {
    // Modo debug: verificar configuración
    debugConfiguracion();
  } else if (args[0] === '--help') {
    // Ayuda
    console.log(`
🎯 SCRIPT DE GESTIÓN DE CAPITANES

📖 Uso:
  node cambiarCapitanesAJugadores.js                    # Cambiar capitanes a jugadores
  node cambiarCapitanesAJugadores.js --restore file.json # Restaurar desde respaldo
  node cambiarCapitanesAJugadores.js --debug             # Verificar configuración
  node cambiarCapitanesAJugadores.js --help              # Mostrar esta ayuda

📋 Funciones:
  ✅ Busca todos los usuarios con rol "capitan"
  ✅ Crea respaldo automático con timestamp
  ✅ Cambia el rol a "jugador"
  ✅ Verifica los cambios
  ✅ Permite restauración desde respaldo

📂 Archivos:
  📁 Respaldos: server/backups/capitanes_backup_*.json
  📁 Script: server/scripts/cambiarCapitanesAJugadores.js
  📁 Configuración: server/.env (MONGODB_URI requerida)

⚠️  IMPORTANTE: 
  - Siempre verifica el respaldo antes de ejecutar
  - Usa --debug si tienes problemas de conexión
  - El archivo .env debe estar en server/.env
    `);
  } else {
    // Modo normal: cambiar capitanes a jugadores
    cambiarCapitanesAJugadores();
  }
}

module.exports = { cambiarCapitanesAJugadores, restaurarCapitanes };