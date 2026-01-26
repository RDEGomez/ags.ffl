// 🔍 SCRIPT PARA VERIFICAR TORNEOS Y CATEGORÍAS DISPONIBLES
// Uso: node verificar_torneos.js

const mongoose = require('mongoose');
require('dotenv').config();

// Importar modelos (ajusta las rutas según tu estructura)
const Partido = require('../src/models/Partido');
const Torneo = require('../src/models/Torneo');

async function verificarTorneos() {
  console.log('🔍 VERIFICANDO TORNEOS DISPONIBLES');
  console.log('=' .repeat(50));

  try {
    // Obtener todos los torneos
    const torneos = await Torneo.find({}).select('_id nombre fechaInicio fechaFin estado');
    
    if (torneos.length === 0) {
      console.log('❌ No se encontraron torneos en la base de datos');
      return;
    }

    console.log(`✅ Se encontraron ${torneos.length} torneos:\n`);

    for (let i = 0; i < torneos.length; i++) {
      const torneo = torneos[i];
      console.log(`📋 ${i + 1}. ${torneo.nombre}`);
      console.log(`   🆔 ID: ${torneo._id}`);
      console.log(`   📅 Inicio: ${torneo.fechaInicio ? torneo.fechaInicio.toDateString() : 'No definida'}`);
      console.log(`   🏁 Fin: ${torneo.fechaFin ? torneo.fechaFin.toDateString() : 'No definida'}`);
      console.log(`   🎯 Estado: ${torneo.estado || 'No definido'}`);

      // Buscar categorías disponibles en este torneo
      const categorias = await Partido.distinct('categoria', { 
        torneo: torneo._id,
        estado: 'finalizado'
      });

      if (categorias.length > 0) {
        console.log(`   📊 Categorías con partidos finalizados: ${categorias.join(', ')}`);
        
        // Contar partidos por categoría
        for (const categoria of categorias) {
          const count = await Partido.countDocuments({
            torneo: torneo._id,
            categoria: categoria,
            estado: 'finalizado'
          });
          console.log(`      - ${categoria}: ${count} partidos finalizados`);
        }
      } else {
        console.log('   ⚠️ No hay categorías con partidos finalizados');
      }
      console.log('');
    }

    // Verificar el ID específico que mencionaste
    console.log('🎯 VERIFICANDO ID ESPECÍFICO: 68dc8bf2ec4c288602c7eea7');
    console.log('-'.repeat(50));
    
    const torneoEspecifico = await Torneo.findById('68dc8bf2ec4c288602c7eea7');
    
    if (torneoEspecifico) {
      console.log('✅ El torneo SÍ existe:');
      console.log(`   📋 Nombre: ${torneoEspecifico.nombre}`);
      console.log(`   🆔 ID: ${torneoEspecifico._id}`);
      console.log(`   🎯 Estado: ${torneoEspecifico.estado || 'No definido'}`);
      
      // Buscar sus categorías
      const categoriasEspecificas = await Partido.distinct('categoria', { 
        torneo: torneoEspecifico._id 
      });
      
      console.log(`   📊 Categorías disponibles: ${categoriasEspecificas.join(', ') || 'Ninguna'}`);
      
      // Contar partidos por estado
      const partidosTotal = await Partido.countDocuments({ torneo: torneoEspecifico._id });
      const partidosFinalizados = await Partido.countDocuments({ 
        torneo: torneoEspecifico._id, 
        estado: 'finalizado' 
      });
      
      console.log(`   📈 Total de partidos: ${partidosTotal}`);
      console.log(`   ✅ Partidos finalizados: ${partidosFinalizados}`);
      
      if (partidosFinalizados === 0) {
        console.log('   ⚠️ ADVERTENCIA: No hay partidos finalizados para generar estadísticas');
      }
      
    } else {
      console.log('❌ El torneo NO existe en la base de datos');
      console.log('💡 Posibles causas:');
      console.log('   - El ID es incorrecto');
      console.log('   - El torneo fue eliminado');
      console.log('   - Problema de conexión a la base de datos');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.name === 'CastError') {
      console.log('💡 El ID no tiene un formato válido de MongoDB ObjectId');
    }
  }
}

// Función principal
async function main() {
  try {
    // Conectar a MongoDB
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flag_football_db');
    console.log('✅ Conectado a MongoDB\n');

    await verificarTorneos();

  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.log('💡 Verifica:');
    console.log('   - Que MongoDB esté ejecutándose');
    console.log('   - Que la variable MONGODB_URI sea correcta');
    console.log('   - Que tengas permisos de lectura en la base de datos');
  } finally {
    await mongoose.disconnect();
    console.log('\n📱 Desconectado de MongoDB');
  }
}

// Ejecutar
if (require.main === module) {
  main();
}

module.exports = { verificarTorneos };