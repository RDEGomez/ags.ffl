// 🏆 SCRIPT QUE REPLICA TU FUNCIÓN EXACTA PARA TOP 15
// Uso: node top15_exacto.js [torneoId] [categoria]

const mongoose = require('mongoose');
require('dotenv').config();

// Importar modelos
const Partido = require('../src/models/Partido');
const Usuario = require('../src/models/Usuario');
const Torneo = require('../src/models/Torneo');
const Equipo = require('../src/models/Equipo');

// Función calcular QB Rating - EXACTA DE TU CÓDIGO
function calcularQBRating(completados, intentos, touchdowns, intercepciones) {
  if (intentos === 0) return 0;
  const FE = completados / intentos;
  const PC_FE = completados * FE;
  const rating = PC_FE + (intercepciones * -2) + (touchdowns * 3);
  return Math.round(rating * 10) / 10;
}

async function obtenerClasificacionTop15(torneoId, categoria) {
  console.log('\n🏆 OBTENIENDO CLASIFICACIÓN GENERAL TOP 15 - LÓGICA EXACTA');
  console.log('=' .repeat(70));

  try {
    console.log('🎯 Parámetros:', { torneoId, categoria });

    // Verificar que el torneo existe
    const torneo = await Torneo.findById(torneoId);
    if (!torneo) {
      console.log('❌ ERROR: Torneo no encontrado');
      return;
    }
    console.log(`✅ Torneo: ${torneo.nombre}`);

    // 🔥 TIPOS DE ESTADÍSTICAS EXACTOS DE TU FUNCIÓN
    const tiposEstadisticas = ['qbrating', 'puntos', 'recepciones', 'tackleos', 'intercepciones', 'sacks'];

    // Obtener TODOS los partidos finalizados del torneo y categoría
    const partidos = await Partido.find({
      torneo: torneoId,
      categoria: categoria,
      estado: 'finalizado'
    }).populate('equipoLocal equipoVisitante', 'nombre imagen')
      .populate('jugadas.jugadorPrincipal jugadas.jugadorSecundario jugadas.jugadorTouchdown', 'nombre imagen');

    if (partidos.length === 0) {
      console.log('⚠️ No hay partidos finalizados');
      return;
    }

    console.log(`📊 Partidos encontrados: ${partidos.length}`);

    // 🔥 TU LÓGICA EXACTA: USAR LA MISMA LÓGICA EXACTA DEL DEBUG PARA TODOS LOS JUGADORES
    const estadisticasJugadores = new Map(); // jugadorId -> stats completas

    // Procesar TODOS los partidos y TODAS las jugadas
    partidos.forEach(partido => {
      if (!partido.jugadas || partido.jugadas.length === 0) return;

      partido.jugadas.forEach(jugada => {
        // 🔥 EXACTAMENTE IGUAL QUE EN TU FUNCIÓN: Analizar cada jugador involucrado
        const procesarJugador = (jugador, rol) => {
          if (!jugador) return;

          const jugadorId = jugador._id?.toString();
          if (!jugadorId) return;

          // Inicializar estadísticas si no existen
          if (!estadisticasJugadores.has(jugadorId)) {
            estadisticasJugadores.set(jugadorId, {
              jugador: {
                _id: jugador._id,
                nombre: jugador.nombre,
                numero: 0, // Se actualizará después
                imagen: jugador.imagen
              },
              equipo: {
                _id: null, // Se actualizará después
                nombre: 'Temporal',
                imagen: null
              },
              stats: {
                pases: { 
                  intentos: 0, 
                  completados: 0, 
                  touchdowns: 0, 
                  intercepciones: 0,
                  conversiones: 0  // 🔥 NUEVO CAMPO
                },
                recepciones: { total: 0, touchdowns: 0 },
                tackleos: { total: 0 },
                intercepciones: { total: 0 },
                sacks: { total: 0 },
                puntos: { total: 0, touchdowns: 0 }
              }
            });
          }

          const playerStats = estadisticasJugadores.get(jugadorId);

          // 🔥 TU LÓGICA EXACTA
          const esPrincipal = rol === 'principal';
          const esSecundario = rol === 'secundario';
          const esJugadorTouchdown = rol === 'touchdown';

          switch (jugada.tipoJugada) {
            case 'pase_completo':
              if (esPrincipal) {
                playerStats.stats.pases.intentos++;
                playerStats.stats.pases.completados++;
                if (jugada.resultado?.touchdown) {
                  playerStats.stats.pases.touchdowns++;
                }
              } else if (esSecundario) {
                playerStats.stats.recepciones.total++;
                if (jugada.resultado?.touchdown) {
                  playerStats.stats.recepciones.touchdowns++;
                  playerStats.stats.puntos.total += 6;
                  playerStats.stats.puntos.touchdowns++;
                }
              } else if (esJugadorTouchdown && jugada.resultado?.touchdown) {
                playerStats.stats.puntos.total += 6;
                playerStats.stats.puntos.touchdowns++;
              }
              break;

            case 'pase_incompleto':
              if (esPrincipal) {
                playerStats.stats.pases.intentos++;
              }
              break;

            case 'recepcion':
              if (esPrincipal) {
                playerStats.stats.recepciones.total++;
                if (jugada.resultado?.touchdown) {
                  playerStats.stats.recepciones.touchdowns++;
                  playerStats.stats.puntos.total += 6;
                  playerStats.stats.puntos.touchdowns++;
                }
              } else if (esJugadorTouchdown && jugada.resultado?.touchdown) {
                playerStats.stats.puntos.total += 6;
                playerStats.stats.puntos.touchdowns++;
              }
              break;

            case 'corrida':
              if (esPrincipal) {
                playerStats.stats.corridas = (playerStats.stats.corridas || 0) + 1;
                
                if (jugada.resultado?.touchdown) {
                  playerStats.stats.puntos.total += 6;
                  playerStats.stats.puntos.touchdowns++;
                }
              } else if (esSecundario) {
                playerStats.stats.tackleos.total++;
              }
              break;

            case 'intercepcion':
              if (esPrincipal) {
                // INTERCEPTOR: Solo estadística defensiva + posibles puntos de Pick-6
                playerStats.stats.intercepciones.total++;
                if (jugada.resultado?.touchdown) {
                  playerStats.stats.puntos.total += 6;
                  playerStats.stats.puntos.touchdowns++;
                }
              } else if (esSecundario) {
                // QB INTERCEPTADO: Cuenta como intercepción lanzada
                playerStats.stats.pases.intentos++;
                playerStats.stats.pases.intercepciones++;
              }
              // 🏆 PICK-6: Si hay jugadorTouchdown específico
              if (esJugadorTouchdown && jugada.resultado?.touchdown) {
                playerStats.stats.puntos.total += 6;
                playerStats.stats.puntos.touchdowns++;
              }
              break;

            case 'sack':
              if (esPrincipal) {
                playerStats.stats.sacks.total++;
              }
              break;

            case 'tackleo':
              if (esPrincipal) {
                playerStats.stats.tackleos.total++;
              }
              break;

            case 'safety':
              if (esPrincipal) {
                playerStats.stats.puntos.total += 2;
              }
              break;

            case 'touchdown':
              if (esPrincipal || esJugadorTouchdown) {
                playerStats.stats.puntos.total += 6;
                playerStats.stats.puntos.touchdowns++;
              }
              break;

            case 'conversion_1pt':
            case 'conversion_2pt':
              if (esPrincipal) {
                // QB: Solo stats de pase, NO puntos
                playerStats.stats.pases.intentos++;
                playerStats.stats.pases.completados++;
                playerStats.stats.pases.conversiones++; // 🔥 NUEVO: Trackear conversiones
              } else if (esSecundario) {
                // Receptor: Recepción + PUNTOS
                playerStats.stats.recepciones.total++;
                playerStats.stats.puntos.total += jugada.tipoJugada === 'conversion_1pt' ? 1 : 2;
              } else if (esJugadorTouchdown) {
                playerStats.stats.puntos.total += jugada.tipoJugada === 'conversion_1pt' ? 1 : 2;
              }
              break;
          }
        };

        // Procesar cada jugador según su rol en la jugada
        if (jugada.jugadorPrincipal) {
          procesarJugador(jugada.jugadorPrincipal, 'principal');
        }
        if (jugada.jugadorSecundario) {
          procesarJugador(jugada.jugadorSecundario, 'secundario');
        }
        if (jugada.jugadorTouchdown) {
          procesarJugador(jugada.jugadorTouchdown, 'touchdown');
        }
      });
    });

    console.log(`📈 Total jugadores procesados: ${estadisticasJugadores.size}`);

    // 🔥 CALCULAR QB RATING PARA CADA JUGADOR
    estadisticasJugadores.forEach((stats, jugadorId) => {
      const { intentos, completados, touchdowns, intercepciones } = stats.stats.pases;
      stats.qbRating = calcularQBRating(completados, intentos, touchdowns, intercepciones);
    });

    // 🔥 CORREGIR EQUIPOS DESPUÉS DEL PROCESAMIENTO - TU LÓGICA EXACTA
    const jugadoresIds = Array.from(estadisticasJugadores.keys());
    const equiposIds = [
      ...new Set(partidos.flatMap(p => [p.equipoLocal._id.toString(), p.equipoVisitante._id.toString()]))
    ];

    // Obtener usuarios con sus equipos reales
    const usuarios = await Usuario.find({
      '_id': { $in: jugadoresIds },
      'equipos.equipo': { $in: equiposIds }
    }).select('nombre imagen equipos');

    // Crear mapa de equipos para acceso rápido
    const equiposMap = new Map();
    partidos.forEach(partido => {
      equiposMap.set(partido.equipoLocal._id.toString(), partido.equipoLocal);
      equiposMap.set(partido.equipoVisitante._id.toString(), partido.equipoVisitante);
    });

    // Actualizar cada jugador con su equipo correcto
    usuarios.forEach(usuario => {
      if (estadisticasJugadores.has(usuario._id.toString())) {
        const stats = estadisticasJugadores.get(usuario._id.toString());
        
        // Buscar el equipo correcto del jugador
        const equipoData = usuario.equipos.find(e => 
          equiposIds.includes(e.equipo.toString())
        );
        
        if (equipoData) {
          const equipoInfo = equiposMap.get(equipoData.equipo.toString());
          if (equipoInfo) {
            stats.equipo = {
              _id: equipoInfo._id,
              nombre: equipoInfo.nombre,
              imagen: equipoInfo.imagen
            };
            stats.jugador.numero = equipoData.numero;
          }
        }
      }
    });

    // Generar clasificación para cada tipo - CAMBIO SOLO AQUÍ: TOP 15
    console.log('\n🏆 GENERANDO TOP 15 POR CATEGORÍA');
    console.log('=' .repeat(70));

    tiposEstadisticas.forEach(tipo => {
      // 🔥 FILTRAR JUGADORES CON ESTADÍSTICAS DEL TIPO
      const jugadoresArray = Array.from(estadisticasJugadores.values()).filter(jugador => {
        if (tipo === 'qbrating') {
          // Solo QBs con al menos 5 intentos
          return jugador.stats.pases.intentos >= 5;
        }
        
        const stat = tipo === 'puntos' ? jugador.stats.puntos.total :
                    tipo === 'tackleos' ? jugador.stats.tackleos.total :
                    tipo === 'intercepciones' ? jugador.stats.intercepciones.total :
                    tipo === 'sacks' ? jugador.stats.sacks.total :
                    tipo === 'recepciones' ? jugador.stats.recepciones.total : 0;
        return stat > 0;
      });

      // 🔥 ORDENAR POR ESTADÍSTICA ESPECÍFICA Y TOMAR TOP 15
      const top15Jugadores = jugadoresArray
        .sort((a, b) => {
          if (tipo === 'qbrating') {
            // Ordenar por QB Rating
            if (a.qbRating !== b.qbRating) {
              return b.qbRating - a.qbRating;
            }
            return b.stats.pases.completados - a.stats.pases.completados;
          }
          
          const statA = tipo === 'puntos' ? a.stats.puntos.total :
                       tipo === 'tackleos' ? a.stats.tackleos.total :
                       tipo === 'intercepciones' ? a.stats.intercepciones.total :
                       tipo === 'sacks' ? a.stats.sacks.total :
                       tipo === 'recepciones' ? a.stats.recepciones.total : 0;
          
          const statB = tipo === 'puntos' ? b.stats.puntos.total :
                       tipo === 'tackleos' ? b.stats.tackleos.total :
                       tipo === 'intercepciones' ? b.stats.intercepciones.total :
                       tipo === 'sacks' ? b.stats.sacks.total :
                       tipo === 'recepciones' ? b.stats.recepciones.total : 0;
          
          return statB - statA;
        })
        .slice(0, 15); // 🔥 ÚNICO CAMBIO: TOP 15 EN LUGAR DE TOP 5

      // Mostrar resultados
      console.log(`\n🏅 TOP 15 - ${tipo.toUpperCase()}`);
      console.log('─'.repeat(80));
      
      if (top15Jugadores.length === 0) {
        console.log('   ⚠️ No hay jugadores con estadísticas para esta categoría');
        return;
      }

      top15Jugadores.forEach((jugador, index) => {
        const valor = tipo === 'qbrating' ? jugador.qbRating :
                     tipo === 'puntos' ? jugador.stats.puntos.total :
                     tipo === 'tackleos' ? jugador.stats.tackleos.total :
                     tipo === 'intercepciones' ? jugador.stats.intercepciones.total :
                     tipo === 'sacks' ? jugador.stats.sacks.total :
                     tipo === 'recepciones' ? jugador.stats.recepciones.total : 0;

        const equipo = jugador.equipo ? jugador.equipo.nombre : 'Sin equipo';
        const numero = jugador.jugador.numero || 'S/N';
        const nombre = jugador.jugador.nombre || 'Sin nombre';
        
        console.log(`   ${(index + 1).toString().padStart(2, '0')}. ${nombre.padEnd(20)} #${numero.toString().padStart(2)} ${equipo.padEnd(15)} ${tipo === 'qbrating' ? valor.toFixed(1) : valor}`);
        
        // Mostrar detalles para QB Rating
        if (tipo === 'qbrating' && jugador.stats.pases.intentos > 0) {
          const pct = Math.round((jugador.stats.pases.completados / jugador.stats.pases.intentos) * 100);
          console.log(`       ${jugador.stats.pases.completados}/${jugador.stats.pases.intentos} (${pct}%), ${jugador.stats.pases.touchdowns} TD, ${jugador.stats.pases.intercepciones} INT, ${jugador.stats.pases.conversiones} Conv`);
        }
      });
      
      console.log(`\n   📊 Total de jugadores con ${tipo}: ${jugadoresArray.length}`);
    });

    console.log('\n✅ ¡TOP 15 generado con tu lógica exacta!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Función principal
async function main() {
  const torneoId = process.argv[2];
  const categoria = process.argv[3];

  if (!torneoId || !categoria) {
    console.log('❌ Uso: node top15_exacto.js [torneoId] [categoria]');
    console.log('Ejemplo: node top15_exacto.js 68dc8bf2ec4c288602c7eea7 varonil');
    process.exit(1);
  }

  try {
    await mongoose.connect('mongodb+srv://danielcachao:WWchwuZwGi5nItxh@edgcprojcluster.5w9dq9d.mongodb.net/agsffl?retryWrites=true&w=majority');
    console.log('✅ Conectado a MongoDB');

    await obtenerClasificacionTop15(torneoId, categoria);

  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📱 Desconectado de MongoDB');
  }
}

if (require.main === module) {
  main();
}