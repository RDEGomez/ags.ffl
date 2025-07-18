// 📁 server/src/scripts/limpiarTackleosDuplicados.js

const mongoose = require('mongoose');
const Partido = require('../src/models/Partido');
const Equipo = require('../src/models/Equipo');
const Usuario = require('../src/models/Usuario');

require('dotenv').config();

// 🔄 Función principal para limpiar tackleos duplicados
const limpiarTackleosDuplicados = async (partidoId) => {
  try {
    console.log('\n🧹 === INICIANDO LIMPIEZA DE TACKLEOS DUPLICADOS ===');
    console.log(`📍 Partido ID: ${partidoId}`);
    console.log(`⏰ Fecha: ${new Date().toISOString()}\n`);

    // Validar que el ID sea válido
    if (!mongoose.Types.ObjectId.isValid(partidoId)) {
      throw new Error('ID de partido inválido');
    }

    // Buscar el partido
    console.log('🔍 Buscando partido...');
    const partido = await Partido.findById(partidoId)
      .populate('equipoLocal', 'nombre')
      .populate('equipoVisitante', 'nombre')
      .populate('jugadas.jugadorPrincipal', 'nombre')
      .populate('jugadas.jugadorSecundario', 'nombre');

    if (!partido) {
      throw new Error('Partido no encontrado');
    }

    console.log(`✅ Partido encontrado: ${partido.equipoLocal.nombre} vs ${partido.equipoVisitante.nombre}`);
    console.log(`📊 Total de jugadas: ${partido.jugadas.length}\n`);

    // Filtrar jugadas de corrida con jugadorSecundario
    const jugadasCorridaConTackleador = partido.jugadas.filter(
      jugada => jugada.tipoJugada === 'corrida' && jugada.jugadorSecundario
    );

    console.log(`🏃 Jugadas de corrida encontradas: ${partido.jugadas.filter(j => j.tipoJugada === 'corrida').length}`);
    console.log(`🛡️ Jugadas de corrida CON tackleador: ${jugadasCorridaConTackleador.length}`);

    if (jugadasCorridaConTackleador.length === 0) {
      console.log('\n✨ No hay jugadas de corrida con tackleador para limpiar');
      return {
        mensaje: 'No se encontraron jugadas de corrida con tackleador',
        jugadasModificadas: 0
      };
    }

    // Mostrar detalles de las jugadas que se van a modificar
    console.log('\n📋 JUGADAS QUE SE VAN A MODIFICAR:');
    console.log('=' .repeat(80));
    
    jugadasCorridaConTackleador.forEach((jugada, index) => {
      console.log(`\n${index + 1}. Jugada #${jugada.numero}`);
      console.log(`   - Tiempo: ${jugada.tiempo.minuto}:${jugada.tiempo.segundo} (Periodo ${jugada.tiempo.periodo})`);
      console.log(`   - Corredor: ${jugada.jugadorPrincipal?.nombre || 'N/A'}`);
      console.log(`   - Tackleador (A ELIMINAR): ${jugada.jugadorSecundario?.nombre || 'N/A'}`);
      console.log(`   - Descripción: ${jugada.descripcion || 'Sin descripción'}`);
    });
    
    console.log('\n' + '='.repeat(80));

    // Confirmar antes de proceder
    console.log('\n⚠️  ADVERTENCIA: Se eliminarán los tackleadores de las jugadas de corrida listadas arriba');
    console.log('💡 Esto NO afectará las jugadas independientes de tipo "tackleo"\n');

    // Realizar la actualización
    console.log('🔧 Actualizando jugadas...');
    
    let jugadasModificadas = 0;
    
    for (const jugada of partido.jugadas) {
      if (jugada.tipoJugada === 'corrida' && jugada.jugadorSecundario) {
        jugada.jugadorSecundario = null;
        jugadasModificadas++;
      }
    }

    // Guardar los cambios
    await partido.save();
    
    console.log(`\n✅ LIMPIEZA COMPLETADA`);
    console.log(`📊 Jugadas modificadas: ${jugadasModificadas}`);
    console.log(`🕒 Finalizado: ${new Date().toISOString()}\n`);

    return {
      mensaje: 'Limpieza completada exitosamente',
      jugadasModificadas,
      detalles: {
        partidoId: partido._id,
        equipos: `${partido.equipoLocal.nombre} vs ${partido.equipoVisitante.nombre}`,
        totalJugadas: partido.jugadas.length,
        jugadasCorridaTotal: partido.jugadas.filter(j => j.tipoJugada === 'corrida').length,
        jugadasModificadas
      }
    };

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    throw error;
  }
};

// 🚀 Función para ejecutar el script
const ejecutarScript = async () => {
  try {
    // Conectar a la base de datos
    console.log('🔌 Conectando a la base de datos...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Obtener el ID del partido desde los argumentos de línea de comandos
    const partidoId = process.argv[2];

    if (!partidoId) {
      console.error('❌ ERROR: Debes proporcionar un ID de partido');
      console.log('\n📖 USO: node limpiarTackleosDuplicados.js <ID_DEL_PARTIDO>');
      console.log('Ejemplo: node limpiarTackleosDuplicados.js 60a7b5e9c8d3f4001c8e4f5a\n');
      process.exit(1);
    }

    // Ejecutar la limpieza
    const resultado = await limpiarTackleosDuplicados(partidoId);
    
    console.log('\n📋 RESUMEN FINAL:');
    console.log(JSON.stringify(resultado, null, 2));

  } catch (error) {
    console.error('\n💥 ERROR FATAL:', error);
    process.exit(1);
  } finally {
    // Cerrar la conexión
    await mongoose.connection.close();
    console.log('\n🔌 Conexión cerrada');
    process.exit(0);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  ejecutarScript();
}

module.exports = { limpiarTackleosDuplicados };