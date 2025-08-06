const mongoose = require('mongoose');
const Partido = require('../src/models/Partido');
const Usuario = require('../src/models/Usuario');
const Equipo = require('../src/models/Equipo');
const fs = require('fs').promises;

/**
 * Generador de Reporte TOP 15 - SIMPLE Y DIRECTO
 */
class GeneradorReporteTop15 {
  
  async generarReporteCompleto(torneoId, categoria) {
    try {
      console.log(`🏆 Generando reporte TOP 15 estadísticas`);
      console.log(`   Torneo: ${torneoId}`);
      console.log(`   Categoría: ${categoria}`);
      
      // 1. Buscar partidos en BD
      const partidos = await Partido.find({
        torneo: torneoId,
        categoria: categoria
      }).populate('jugadas.jugadorPrincipal jugadas.jugadorSecundario jugadas.jugadorTouchdown', 'nombre imagen');
      
      console.log(`📊 Partidos encontrados: ${partidos.length}`);
      
      if (partidos.length === 0) {
        return {
          metadatos: { torneoId, categoria, totalJugadores: 0 },
          rankings: {}
        };
      }
      
      // 2. Procesar jugadas y calcular estadísticas
      const estadisticas = new Map();
      
      partidos.forEach(partido => {
        if (partido.jugadas && partido.jugadas.length > 0) {
          partido.jugadas.forEach(jugada => {
            this.procesarJugada(jugada, estadisticas);
          });
        }
      });
      
      // 3. Enriquecer con datos de usuario
      await this.enriquecerDatos(estadisticas);
      
      // 4. Generar rankings
      const reporte = {
        metadatos: {
          torneoId,
          categoria,
          fechaGeneracion: new Date().toISOString(),
          totalJugadores: estadisticas.size
        },
        rankings: {
          puntos: this.generarTop15(estadisticas, 'puntos'),
          pases_completados: this.generarTop15(estadisticas, 'pases_completados'),
          pases_touchdowns: this.generarTop15(estadisticas, 'pases_touchdowns'),
          recepciones_total: this.generarTop15(estadisticas, 'recepciones_total'),
          recepciones_touchdowns: this.generarTop15(estadisticas, 'recepciones_touchdowns'),
          tackleos: this.generarTop15(estadisticas, 'tackleos'),
          intercepciones: this.generarTop15(estadisticas, 'intercepciones'),
          sacks: this.generarTop15(estadisticas, 'sacks')
        }
      };
      
      console.log(`✅ Reporte generado con ${estadisticas.size} jugadores`);
      return reporte;
      
    } catch (error) {
      console.error('❌ Error:', error);
      throw error;
    }
  }
  
  procesarJugada(jugada, estadisticas) {
    // Función para inicializar jugador
    const inicializar = (jugadorId, jugadorObj) => {
      if (!estadisticas.has(jugadorId)) {
        estadisticas.set(jugadorId, {
          jugador: {
            _id: jugadorObj._id,
            nombre: jugadorObj.nombre,
            imagen: jugadorObj.imagen
          },
          stats: {
            puntos: 0,
            pases_completados: 0,
            pases_touchdowns: 0,
            recepciones_total: 0,
            recepciones_touchdowns: 0,
            tackleos: 0,
            intercepciones: 0,
            sacks: 0
          }
        });
      }
    };
    
    // Procesar jugador principal
    if (jugada.jugadorPrincipal && jugada.jugadorPrincipal._id) {
      const id = jugada.jugadorPrincipal._id.toString();
      inicializar(id, jugada.jugadorPrincipal);
      const stats = estadisticas.get(id).stats;
      
      switch (jugada.tipoJugada) {
        case 'pase_completo':
          stats.pases_completados++;
          if (jugada.resultado?.touchdown) {
            stats.pases_touchdowns++;
          }
          break;
        case 'corrida':
          if (jugada.resultado?.touchdown) {
            stats.puntos += 6;
          }
          break;
        case 'intercepcion':
          stats.intercepciones++;
          if (jugada.resultado?.touchdown) {
            stats.puntos += 6;
          }
          break;
        case 'sack':
          stats.sacks++;
          break;
        case 'tackleo':
          stats.tackleos++;
          break;
        case 'conversion_1pt':
          stats.puntos += 1;
          break;
        case 'conversion_2pt':
          stats.puntos += 2;
          break;
      }
    }
    
    // Procesar jugador secundario
    if (jugada.jugadorSecundario && jugada.jugadorSecundario._id) {
      const id = jugada.jugadorSecundario._id.toString();
      inicializar(id, jugada.jugadorSecundario);
      const stats = estadisticas.get(id).stats;
      
      switch (jugada.tipoJugada) {
        case 'pase_completo':
          stats.recepciones_total++;
          if (jugada.resultado?.touchdown) {
            stats.recepciones_touchdowns++;
            stats.puntos += 6;
          }
          break;
        case 'corrida':
          stats.tackleos++;
          break;
      }
    }
    
    // Procesar jugador touchdown
    if (jugada.jugadorTouchdown && jugada.jugadorTouchdown._id) {
      const id = jugada.jugadorTouchdown._id.toString();
      inicializar(id, jugada.jugadorTouchdown);
      const stats = estadisticas.get(id).stats;
      
      if (jugada.resultado?.touchdown) {
        stats.puntos += 6;
      }
    }
  }
  
  async enriquecerDatos(estadisticas) {
    const jugadorIds = Array.from(estadisticas.keys());
    const usuarios = await Usuario.find({
      _id: { $in: jugadorIds }
    }).populate('equipos.equipo', 'nombre categoria'); // <--- Asegúrate de incluir "categoria"

    usuarios.forEach(usuario => {
      const jugadorId = usuario._id.toString();
      if (estadisticas.has(jugadorId)) {
        const statsJugador = estadisticas.get(jugadorId);
        
        statsJugador.jugador.curp = usuario.curp || usuario.documento || 'N/A';

        // Filtrar equipo que coincida con la categoría actual
        const equipoValido = usuario.equipos.find(eq =>
          eq && eq.equipo && eq.equipo.categoria === 'vargold'
        );

        if (equipoValido) {
          statsJugador.jugador.equipoPrincipal = equipoValido.equipo.nombre;
          statsJugador.jugador.numero = equipoValido.numero || 'N/A';
        } else {
          statsJugador.jugador.equipoPrincipal = 'N/A';
          statsJugador.jugador.numero = 'N/A';
        }
      }
    });
  }
  
  generarTop15(estadisticas, tipo) {
    const jugadores = Array.from(estadisticas.values())
      .filter(jugador => jugador.stats[tipo] > 0)
      .sort((a, b) => b.stats[tipo] - a.stats[tipo])
      .slice(0, 15);
    
    return jugadores.map((jugador, index) => ({
      posicion: index + 1,
      nombre: jugador.jugador.nombre,
      numero: jugador.jugador.numero || 'N/A',
      equipo: jugador.jugador.equipoPrincipal || 'N/A',
      curp: jugador.jugador.curp || 'N/A',
      valor: jugador.stats[tipo]
    }));
  }
  
  async guardarReporte(reporte) {
    const fechaHora = new Date().toISOString().replace(/[:.]/g, '-');
    const archivo = `./reportes/reporte_top15_${fechaHora}.json`;
    
    try {
      await fs.mkdir('./reportes', { recursive: true });
      await fs.writeFile(archivo, JSON.stringify(reporte, null, 2), 'utf8');
      console.log(`💾 Reporte guardado: ${archivo}`);
      return archivo;
    } catch (error) {
      console.error('❌ Error guardando:', error);
      throw error;
    }
  }
}

// Función principal
async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agsffl');
    console.log('✅ Conectado a MongoDB');
    
    const args = process.argv.slice(2);
    const [comando, torneoId, categoria] = args;
    
    if (comando !== 'generar' || !torneoId || !categoria) {
      console.log(`
🏆 REPORTE TOP 15 ESTADÍSTICAS
============================

USO:
  node reporte_top15.js generar <torneoId> <categoria>

EJEMPLO:
  node reporte_top15.js generar 6847830fd8999883558396b9 vargold
      `);
      process.exit(1);
    }
    
    const generador = new GeneradorReporteTop15();
    const reporte = await generador.generarReporteCompleto(torneoId, categoria);
    await generador.guardarReporte(reporte);
    
    console.log(`\n🎉 ¡Listo!`);
    console.log(`📊 Jugadores procesados: ${reporte.metadatos.totalJugadores}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { GeneradorReporteTop15 };