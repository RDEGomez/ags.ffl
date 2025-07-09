// 📁 scripts/migrarJornadas.js
// Script para asignar jornadas a partidos existentes basado en fechas

const mongoose = require('mongoose');
const Partido = require('../../server/src/models/Partido'); // Ajustar la ruta según tu estructura
require('dotenv').config(); // Para variables de entorno

// 🔥 Función helper para obtener el lunes de una semana específica
function obtenerLunesDeSemanaa(fecha) {
  const fechaCopia = new Date(fecha);
  const diaSemana = fechaCopia.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
  const diasAtras = (diaSemana === 0 ? 6 : diaSemana - 1); // Convertir domingo a 6
  fechaCopia.setDate(fechaCopia.getDate() - diasAtras);
  fechaCopia.setHours(0, 0, 0, 0); // Inicio del día
  return fechaCopia;
}

// 🔥 Función helper para obtener el domingo de una semana específica
function obtenerDomingoDeSemanaa(fecha) {
  const fechaCopia = new Date(fecha);
  const diaSemana = fechaCopia.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
  const diasAdelante = (diaSemana === 0 ? 0 : 7 - diaSemana); // Si es domingo, queda igual
  fechaCopia.setDate(fechaCopia.getDate() + diasAdelante);
  fechaCopia.setHours(23, 59, 59, 999); // Final del día
  return fechaCopia;
}

// 🔥 Función principal para migrar jornadas
async function migrarJornadas(categoria, fechaInicioTorneo) {
  const timestamp = new Date().toISOString();
  console.log(`\n🚀 [${timestamp}] INICIO - Migración de jornadas`);
  console.log(`📂 Categoría: ${categoria}`);
  console.log(`📅 Fecha inicio torneo: ${fechaInicioTorneo}`);
  
  try {
    // Conectar a MongoDB si no está conectado
    if (mongoose.connection.readyState !== 1) {
      console.log('🔌 Conectando a MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tu-database', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('✅ Conectado a MongoDB');
    }

    // Validar parámetros
    if (!categoria) {
      throw new Error('❌ La categoría es requerida');
    }

    const fechaInicio = new Date(fechaInicioTorneo);
    if (isNaN(fechaInicio.getTime())) {
      throw new Error('❌ La fecha de inicio del torneo no es válida');
    }

    console.log(`🔍 Buscando partidos de categoría "${categoria}"...`);
    
    // Obtener todos los partidos de la categoría especificada, ordenados por fecha
    const partidos = await Partido.find({ 
      categoria: categoria 
    }).sort({ fechaHora: 1 });

    if (partidos.length === 0) {
      console.log(`⚠️ No se encontraron partidos para la categoría "${categoria}"`);
      return {
        exito: true,
        mensaje: 'No hay partidos para procesar',
        estadisticas: {
          total: 0,
          actualizados: 0,
          jornadas: 0
        }
      };
    }

    console.log(`📊 Encontrados ${partidos.length} partidos`);

    // Calcular la primera semana del torneo (lunes a domingo)
    const primerLunes = obtenerLunesDeSemanaa(fechaInicio);
    console.log(`📅 Primera semana inicia: ${primerLunes.toLocaleDateString('es-ES')}`);

    // Agrupar partidos por semanas y asignar jornadas
    const partidosActualizados = [];
    const estadisticasPorJornada = {};
    
    for (const partido of partidos) {
      const fechaPartido = new Date(partido.fechaHora);
      
      // Calcular el lunes de la semana del partido
      const lunesPartido = obtenerLunesDeSemanaa(fechaPartido);
      
      // Calcular diferencia en días desde el primer lunes
      const diferenciaMs = lunesPartido.getTime() - primerLunes.getTime();
      const diferenciaDias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
      const numeroSemana = Math.floor(diferenciaDias / 7) + 1;
      
      // Solo procesar partidos que están en semanas válidas (>= 1)
      if (numeroSemana >= 1) {
        const jornada = `Jornada ${numeroSemana}`;
        
        // Actualizar el partido
        partido.jornada = jornada;
        await partido.save();
        
        partidosActualizados.push({
          _id: partido._id,
          equipoLocal: partido.equipoLocal,
          equipoVisitante: partido.equipoVisitante,
          fechaHora: partido.fechaHora,
          jornadaAnterior: partido.jornada || 'Sin jornada',
          jornadaNueva: jornada
        });

        // Estadísticas
        if (!estadisticasPorJornada[jornada]) {
          estadisticasPorJornada[jornada] = 0;
        }
        estadisticasPorJornada[jornada]++;

        console.log(`✅ ${partido._id} → ${jornada} (${fechaPartido.toLocaleDateString('es-ES')})`);
      } else {
        console.log(`⚠️ Partido ${partido._id} fuera del rango de jornadas (semana ${numeroSemana})`);
      }
    }

    const totalJornadas = Object.keys(estadisticasPorJornada).length;
    
    console.log('\n📊 ESTADÍSTICAS DE MIGRACIÓN:');
    console.log(`  📋 Total partidos encontrados: ${partidos.length}`);
    console.log(`  ✅ Partidos actualizados: ${partidosActualizados.length}`);
    console.log(`  🗓️ Total jornadas creadas: ${totalJornadas}`);
    
    console.log('\n📅 PARTIDOS POR JORNADA:');
    Object.entries(estadisticasPorJornada)
      .sort(([a], [b]) => {
        const numA = parseInt(a.replace('Jornada ', ''));
        const numB = parseInt(b.replace('Jornada ', ''));
        return numA - numB;
      })
      .forEach(([jornada, cantidad]) => {
        console.log(`  ${jornada}: ${cantidad} partidos`);
      });

    console.log(`\n✅ [${new Date().toISOString()}] MIGRACIÓN COMPLETADA EXITOSAMENTE`);
    
    return {
      exito: true,
      mensaje: 'Migración completada exitosamente',
      estadisticas: {
        total: partidos.length,
        actualizados: partidosActualizados.length,
        jornadas: totalJornadas,
        detalleJornadas: estadisticasPorJornada
      },
      partidosActualizados
    };

  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] ERROR en la migración:`);
    console.error('💥 Error completo:', error);
    
    return {
      exito: false,
      mensaje: 'Error en la migración',
      error: error.message
    };
  }
}

// 🔥 Función para ejecutar desde línea de comandos
async function ejecutarMigracion() {
  // Obtener argumentos de línea de comandos
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('\n❌ USO INCORRECTO');
    console.log('📝 Uso: node scripts/migrarJornadas.js <categoria> <fechaInicioTorneo>');
    console.log('📝 Ejemplo: node scripts/migrarJornadas.js mixgold 2024-01-15');
    console.log('\n📋 CATEGORÍAS VÁLIDAS:');
    console.log('  - mixgold, mixsilv, vargold, varsilv');
    console.log('  - femgold, femsilv, varmast, femmast');
    console.log('  - tocho7v7, u8, u10, u12fem, u12var');
    console.log('  - u14fem, u14var, u16fem, u16var, u18fem, u18var');
    console.log('\n📅 FORMATO DE FECHA: YYYY-MM-DD');
    process.exit(1);
  }

  const categoria = args[0];
  const fechaInicioTorneo = args[1];

  console.log('🚀 INICIANDO MIGRACIÓN DE JORNADAS');
  console.log('=' .repeat(50));
  
  const resultado = await migrarJornadas(categoria, fechaInicioTorneo);
  
  if (resultado.exito) {
    console.log('\n🎉 MIGRACIÓN EXITOSA!');
    process.exit(0);
  } else {
    console.log('\n💥 MIGRACIÓN FALLIDA!');
    console.log(`❌ Error: ${resultado.error}`);
    process.exit(1);
  }
}

// 🔥 Función para vista previa (sin modificar datos)
async function previsualizarMigracion(categoria, fechaInicioTorneo) {
  console.log(`\n👁️ MODO PREVISUALIZACIÓN - No se modificarán datos`);
  
  try {
    // Conectar a MongoDB si no está conectado
    if (mongoose.connection.readyState !== 1) {
      console.log('🔌 Conectando a MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tu-database', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }

    const fechaInicio = new Date(fechaInicioTorneo);
    const partidos = await Partido.find({ categoria }).sort({ fechaHora: 1 });
    
    if (partidos.length === 0) {
      console.log(`⚠️ No se encontraron partidos para la categoría "${categoria}"`);
      return;
    }

    const primerLunes = obtenerLunesDeSemanaa(fechaInicio);
    const previsualizacion = {};
    
    for (const partido of partidos) {
      const fechaPartido = new Date(partido.fechaHora);
      const lunesPartido = obtenerLunesDeSemanaa(fechaPartido);
      const diferenciaMs = lunesPartido.getTime() - primerLunes.getTime();
      const diferenciaDias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
      const numeroSemana = Math.floor(diferenciaDias / 7) + 1;
      
      if (numeroSemana >= 1) {
        const jornada = `Jornada ${numeroSemana}`;
        if (!previsualizacion[jornada]) {
          previsualizacion[jornada] = [];
        }
        previsualizacion[jornada].push({
          fecha: fechaPartido.toLocaleDateString('es-ES'),
          equipos: `${partido.equipoLocal} vs ${partido.equipoVisitante}`
        });
      }
    }

    console.log('\n📅 PREVISUALIZACIÓN DE JORNADAS:');
    Object.entries(previsualizacion)
      .sort(([a], [b]) => {
        const numA = parseInt(a.replace('Jornada ', ''));
        const numB = parseInt(b.replace('Jornada ', ''));
        return numA - numB;
      })
      .forEach(([jornada, partidos]) => {
        console.log(`\n${jornada} (${partidos.length} partidos):`);
        partidos.forEach(partido => {
          console.log(`  📅 ${partido.fecha} - ${partido.equipos}`);
        });
      });

  } catch (error) {
    console.error('❌ Error en previsualización:', error.message);
  }
}

// 🔥 Exportar funciones para uso en otros módulos
module.exports = {
  migrarJornadas,
  previsualizarMigracion,
  obtenerLunesDeSemanaa,
  obtenerDomingoDeSemanaa
};

// 🔥 Ejecutar si se llama directamente desde línea de comandos
if (require.main === module) {
  // Verificar si es modo previsualización
  if (process.argv.includes('--preview') || process.argv.includes('-p')) {
    const args = process.argv.slice(2).filter(arg => !arg.startsWith('-'));
    if (args.length >= 2) {
      previsualizarMigracion(args[0], args[1]).then(() => {
        process.exit(0);
      });
    } else {
      console.log('❌ Uso para previsualización: node scripts/migrarJornadas.js --preview <categoria> <fechaInicio>');
      process.exit(1);
    }
  } else {
    ejecutarMigracion();
  }
}