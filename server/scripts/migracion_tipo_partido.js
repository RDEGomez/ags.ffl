// 📁 server/scripts/migracion_tipo_partido.js
// Script para agregar el campo tipoPartido a partidos existentes

const mongoose = require('mongoose');
require('dotenv').config();

async function migrarTipoPartido() {
  try {
    console.log('🚀 Iniciando migración de tipo de partido...');
    
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Obtener la colección de partidos
    const db = mongoose.connection.db;
    const partidosCollection = db.collection('partidos');
    
    // Contar partidos sin el campo tipoPartido
    const partidosSinTipo = await partidosCollection.countDocuments({
      tipoPartido: { $exists: false }
    });
    
    console.log(`📊 Partidos sin tipoPartido: ${partidosSinTipo}`);
    
    if (partidosSinTipo === 0) {
      console.log('✅ Todos los partidos ya tienen el campo tipoPartido');
      return;
    }
    
    // Actualizar partidos existentes con valores por defecto
    const resultado = await partidosCollection.updateMany(
      { tipoPartido: { $exists: false } },
      { 
        $set: {
          "tipoPartido.equipoLocal": "oficial",
          "tipoPartido.equipoVisitante": "oficial"
        }
      }
    );
    
    console.log(`✅ Migración completada: ${resultado.modifiedCount} partidos actualizados`);
    
    // Verificar la actualización
    const partidosActualizados = await partidosCollection.countDocuments({
      "tipoPartido.equipoLocal": { $exists: true },
      "tipoPartido.equipoVisitante": { $exists: true }
    });
    
    console.log(`📊 Partidos con tipoPartido después de la migración: ${partidosActualizados}`);
    
  } catch (error) {
    console.error('❌ Error en la migración:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📴 Desconectado de MongoDB');
  }
}

// Ejecutar migración si el script se ejecuta directamente
if (require.main === module) {
  migrarTipoPartido();
}

module.exports = migrarTipoPartido;

// 📝 INSTRUCCIONES DE USO:
// 1. Ejecutar desde la raíz del proyecto backend:
//    node server/scripts/migracion_tipo_partido.js
// 
// 2. O desde el package.json agregar script:
//    "scripts": {
//      "migrate:tipo-partido": "node server/scripts/migracion_tipo_partido.js"
//    }
//    Y ejecutar: npm run migrate:tipo-partido