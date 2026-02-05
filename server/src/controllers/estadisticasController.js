// 📁 server/src/controllers/estadisticasController.js
const mongoose = require('mongoose');
const Partido = require('../models/Partido');
const Torneo = require('../models/Torneo');
const Equipo = require('../models/Equipo');
const Usuario = require('../models/Usuario');
const { getImageUrlServer } = require('../helpers/imageUrlHelper');

// 🔥 Helper para enriquecer datos con URLs completas
const enriquecerConUrls = (datos, req) => {
  if (Array.isArray(datos)) {
    return datos.map(item => enriquecerItemConUrls(item, req));
  }
  return enriquecerItemConUrls(datos, req);
};

const enriquecerItemConUrls = (item, req) => {
  const itemObj = item.toObject ? item.toObject() : { ...item };
  
  // URLs de equipos
  if (itemObj.equipo?.imagen) {
    itemObj.equipo.imagen = getImageUrlServer(itemObj.equipo.imagen, req);
  }
  
  // URLs de jugadores
  if (itemObj.jugador?.imagen) {
    itemObj.jugador.imagen = getImageUrlServer(itemObj.jugador.imagen, req);
  }
  
  return itemObj;
};

// 📊 1. TABLA DE POSICIONES - VERSIÓN HÍBRIDA
exports.obtenerTablaPosiciones = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n📊 [${timestamp}] INICIO - Obtener tabla de posiciones HÍBRIDA`);
  console.log('🎯 Torneo ID:', req.params.torneoId);
  console.log('📂 Categoría:', req.params.categoria);

  try {
    const { torneoId, categoria } = req.params;

    console.log('🔍 Validando torneo...');
    const torneo = await Torneo.findById(torneoId);
    if (!torneo) {
      console.log('❌ ERROR: Torneo no encontrado');
      return res.status(404).json({ mensaje: 'Torneo no encontrado' });
    }

    console.log('🔍 Obteniendo TODOS los equipos activos de la categoría...');
    // 🔥 CAMBIO HÍBRIDO: No filtrar por torneo.equipos
    const equipos = await Equipo.find({ 
      categoria: categoria, 
      estado: 'activo'
      // _id: { $in: torneo.equipos } ← REMOVIDO para mostrar todos
    });

    if (equipos.length === 0) {
      console.log('⚠️ No se encontraron equipos activos en esta categoría');
      return res.json({ 
        tablaPosiciones: [],
        mensaje: 'No hay equipos activos en esta categoría',
        enfoque: 'hibrido'
      });
    }

    console.log(`✅ Encontrados ${equipos.length} equipos activos en categoría ${categoria}`);

    console.log('📊 Calculando estadísticas por equipo...');
    const tablaPosiciones = [];

    for (const equipo of equipos) {
      console.log(`\n🔄 Procesando equipo: ${equipo.nombre}`);

      // Obtener TODOS los partidos del equipo en este torneo y categoría
      const partidos = await Partido.find({
        torneo: torneoId,
        categoria: categoria,
        $or: [
          { equipoLocal: equipo._id },
          { equipoVisitante: equipo._id }
        ]
      }).populate('equipoLocal equipoVisitante', 'nombre');

      console.log(`📋 Partidos del equipo: ${partidos.length}`);

      // Separar partidos por estado
      const partidosFinalizados = partidos.filter(p => p.estado === 'finalizado');
      const partidosProgramados = partidos.filter(p => p.estado === 'programado');
      const partidosEnCurso = partidos.filter(p => p.estado === 'en_curso');

      console.log(`  📋 Finalizados: ${partidosFinalizados.length}`);
      console.log(`  📋 Programados: ${partidosProgramados.length}`);
      console.log(`  📋 En curso: ${partidosEnCurso.length}`);

      let victorias = 0;
      let derrotas = 0;
      let puntosFavor = 0;
      let puntosContra = 0;

      // Solo calcular estadísticas de partidos finalizados
      partidosFinalizados.forEach(partido => {
        const esLocal = partido.equipoLocal._id.toString() === equipo._id.toString();
        const puntosEquipo = esLocal ? partido.marcador.local : partido.marcador.visitante;
        const puntosRival = esLocal ? partido.marcador.visitante : partido.marcador.local;

        puntosFavor += puntosEquipo;
        puntosContra += puntosRival;

        if (puntosEquipo > puntosRival) {
          victorias++;
        } else if (puntosEquipo < puntosRival) {
          derrotas++;
        }
      });

      const partidosJugados = partidosFinalizados.length;
      const totalPartidos = partidos.length;
      const diferenciaPuntos = puntosFavor - puntosContra;
      const promedioPuntos = partidosJugados > 0 ? (puntosFavor / partidosJugados) : 0;

      // 🔥 DECISIÓN HÍBRIDA: ¿Mostrar equipos sin partidos?
      const tienePartidos = totalPartidos > 0;
      
      // Solo agregar a la tabla si tiene partidos O si queremos mostrar todos
      const mostrarEquiposSinPartidos = false; // 🔧 Configurable
      
      if (tienePartidos || mostrarEquiposSinPartidos) {
        console.log(`  📈 Stats: ${victorias}V-${derrotas}D, ${puntosFavor}PF-${puntosContra}PC`);
        console.log(`  📊 Partidos: ${partidosJugados}/${totalPartidos} (jugados/totales)`);

        tablaPosiciones.push({
          equipo: {
            _id: equipo._id,
            nombre: equipo.nombre,
            imagen: equipo.imagen,
            categoria: equipo.categoria
          },
          victorias,
          derrotas,
          partidosJugados,
          totalPartidos,
          partidosPendientes: partidosProgramados.length + partidosEnCurso.length,
          puntosFavor,
          puntosContra,
          diferenciaPuntos,
          promedioPuntos: Math.round(promedioPuntos * 10) / 10,
          porcentajeVictorias: partidosJugados > 0 ? Math.round((victorias / partidosJugados) * 100) : 0,
          // 🔥 METADATA HÍBRIDA
          tienePartidos,
          estaInscrito: torneo.equipos?.some(equipoId => equipoId.toString() === equipo._id.toString()) || false
        });
      }
    }

    console.log('🔄 Ordenando tabla de posiciones con criterios NFL...');
    // Ordenar por: 1) Porcentaje de Victorias (NFL), 2) Diferencia de puntos, 3) Puntos a favor, 4) Nombre
    tablaPosiciones.sort((a, b) => {
      // 1. PORCENTAJE DE VICTORIAS (criterio principal NFL)
      if (a.porcentajeVictorias !== b.porcentajeVictorias) {
        return b.porcentajeVictorias - a.porcentajeVictorias;
      }
      
      // 2. DIFERENCIA DE PUNTOS (tiebreaker similar a NFL)
      if (a.diferenciaPuntos !== b.diferenciaPuntos) {
        return b.diferenciaPuntos - a.diferenciaPuntos;
      }
      
      // 3. PUNTOS A FAVOR (tiebreaker adicional)
      if (a.puntosFavor !== b.puntosFavor) {
        return b.puntosFavor - a.puntosFavor;
      }
      
      // 4. NOMBRE ALFABÉTICO (para equipos con estadísticas idénticas)
      return a.equipo.nombre.localeCompare(b.equipo.nombre);
    });

    // Agregar posición final
    tablaPosiciones.forEach((item, index) => {
      item.posicion = index + 1;
    });

    console.log('🔥 Enriqueciendo con URLs...');
    const tablaEnriquecida = enriquecerConUrls(tablaPosiciones, req);

    console.log('📤 Enviando tabla de posiciones HÍBRIDA');
    console.log(`  🏆 Líder: ${tablaEnriquecida[0]?.equipo.nombre || 'N/A'}`);
    console.log(`  📊 Total equipos: ${tablaEnriquecida.length}`);
    console.log(`  🎯 Con partidos: ${tablaEnriquecida.filter(e => e.tienePartidos).length}`);
    console.log(`  📋 Inscritos: ${tablaEnriquecida.filter(e => e.estaInscrito).length}`);
    console.log(`✅ [${new Date().toISOString()}] FIN - Tabla híbrida obtenida\n`);

    res.json({
      tablaPosiciones: tablaEnriquecida,
      torneo: {
        _id: torneo._id,
        nombre: torneo.nombre
      },
      categoria,
      fechaConsulta: new Date().toISOString(),
      totalEquipos: tablaEnriquecida.length,
      enfoque: 'hibrido',
      estadisticas: {
        equiposConPartidos: tablaEnriquecida.filter(e => e.tienePartidos).length,
        equiposConPartidosJugados: tablaEnriquecida.filter(e => e.partidosJugados > 0).length,
        equiposInscritos: tablaEnriquecida.filter(e => e.estaInscrito).length,
        totalPartidosProgramados: tablaEnriquecida.reduce((sum, e) => sum + e.partidosPendientes, 0),
        totalPartidosFinalizados: tablaEnriquecida.reduce((sum, e) => sum + e.partidosJugados, 0)
      }
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al obtener tabla híbrida:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Tabla híbrida fallida\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al obtener tabla de posiciones', 
      error: error.message 
    });
  }
};

// 📈 2. TENDENCIA DE PUNTOS POR JORNADAS (EQUIPO ESPECÍFICO)
exports.obtenerTendenciaPuntos = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n📈 [${timestamp}] INICIO - Obtener tendencia de puntos`);
  console.log('🏈 Equipo ID:', req.params.equipoId);
  console.log('🎯 Torneo ID:', req.params.torneoId);

  try {
    const { equipoId, torneoId } = req.params;

    console.log('🔍 Validando equipo y torneo...');
    const [equipo, torneo] = await Promise.all([
      Equipo.findById(equipoId),
      Torneo.findById(torneoId)
    ]);

    if (!equipo || !torneo) {
      console.log('❌ ERROR: Equipo o torneo no encontrado');
      return res.status(404).json({ mensaje: 'Equipo o torneo no encontrado' });
    }

    console.log(`✅ Procesando: ${equipo.nombre} en ${torneo.nombre}`);

    console.log('🔍 Obteniendo partidos del equipo ordenados por fecha...');
    const partidos = await Partido.find({
      torneo: torneoId,
      categoria: equipo.categoria,
      estado: 'finalizado',
      $or: [
        { equipoLocal: equipoId },
        { equipoVisitante: equipoId }
      ]
    })
    .populate('equipoLocal equipoVisitante', 'nombre imagen')
    .sort({ fechaHora: 1 }); // Ordenar por fecha ascendente (jornadas)

    console.log(`📋 Partidos encontrados: ${partidos.length}`);

    if (partidos.length === 0) {
      console.log('⚠️ No se encontraron partidos finalizados');
      return res.json({
        tendencia: [],
        equipo: {
          _id: equipo._id,
          nombre: equipo.nombre,
          imagen: getImageUrlServer(equipo.imagen, req)
        },
        mensaje: 'No hay partidos finalizados para mostrar tendencia'
      });
    }

    console.log('📊 Procesando tendencia por jornadas...');
    const tendencia = [];

    partidos.forEach((partido, index) => {
      const esLocal = partido.equipoLocal._id.toString() === equipoId.toString();
      const puntosEquipo = esLocal ? partido.marcador.local : partido.marcador.visitante;
      const puntosRival = esLocal ? partido.marcador.visitante : partido.marcador.local;
      const equipoRival = esLocal ? partido.equipoVisitante : partido.equipoLocal;
      
      const resultado = puntosEquipo > puntosRival ? 'victoria' : 
                       puntosEquipo < puntosRival ? 'derrota' : 'empate';

      console.log(`  J${index + 1}: ${puntosEquipo} pts vs ${equipoRival.nombre} (${resultado})`);

      tendencia.push({
        jornada: index + 1,
        fecha: partido.fechaHora.toISOString().split('T')[0],
        puntos: puntosEquipo,
        puntosRival: puntosRival,
        rival: {
          _id: equipoRival._id,
          nombre: equipoRival.nombre,
          imagen: getImageUrlServer(equipoRival.imagen, req)
        },
        resultado,
        esLocal,
        diferencia: puntosEquipo - puntosRival
      });
    });

    // Calcular estadísticas adicionales
    const totalPuntos = tendencia.reduce((sum, j) => sum + j.puntos, 0);
    const promedioPuntos = Math.round((totalPuntos / tendencia.length) * 10) / 10;
    const maxPuntos = Math.max(...tendencia.map(j => j.puntos));
    const minPuntos = Math.min(...tendencia.map(j => j.puntos));

    console.log('📤 Enviando tendencia de puntos');
    console.log(`  📊 Jornadas: ${tendencia.length}`);
    console.log(`  📈 Promedio: ${promedioPuntos} pts`);
    console.log(`  🔝 Máximo: ${maxPuntos} pts, 🔻 Mínimo: ${minPuntos} pts`);
    console.log(`✅ [${new Date().toISOString()}] FIN - Tendencia obtenida\n`);

    res.json({
      tendencia,
      equipo: {
        _id: equipo._id,
        nombre: equipo.nombre,
        imagen: getImageUrlServer(equipo.imagen, req),
        categoria: equipo.categoria
      },
      estadisticas: {
        totalJornadas: tendencia.length,
        promedioPuntos,
        maxPuntos,
        minPuntos,
        totalPuntos
      },
      fechaConsulta: new Date().toISOString()
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al obtener tendencia de puntos:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Tendencia fallida\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al obtener tendencia de puntos', 
      error: error.message 
    });
  }
};

// 🏆 LÍDERES POR ESTADÍSTICA (TOP 3 JUGADORES DE UN EQUIPO) - VERSIÓN SIMPLIFICADA CON LÓGICA DE CLASIFICACIÓN GENERAL
exports.obtenerLideresEstadisticas = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🏆 [${timestamp}] INICIO - Obtener líderes estadísticas`);
  console.log('🏈 Equipo ID:', req.params.equipoId);
  console.log('🎯 Torneo ID:', req.params.torneoId);
  console.log('📊 Tipo estadística:', req.params.tipo);

  try {
    const { equipoId, torneoId, tipo } = req.params;

    // 🔥 TIPOS VÁLIDOS CON QB RATING (NO PASES)
    const tiposValidos = ['qbrating', 'puntos', 'tackleos', 'intercepciones', 'sacks', 'recepciones'];
    if (!tiposValidos.includes(tipo)) {
      console.log('❌ ERROR: Tipo de estadística no válido');
      return res.status(400).json({ 
        mensaje: 'Tipo de estadística no válido',
        tiposValidos 
      });
    }

    console.log('🔍 Validando equipo y torneo...');
    const [equipo, torneo] = await Promise.all([
      Equipo.findById(equipoId),
      Torneo.findById(torneoId)
    ]);

    if (!equipo || !torneo) {
      console.log('❌ ERROR: Equipo o torneo no encontrado');
      return res.status(404).json({ mensaje: 'Equipo o torneo no encontrado' });
    }

    console.log(`✅ Procesando estadísticas de ${tipo} para ${equipo.nombre}`);

    console.log('🔍 Obteniendo partidos finalizados del equipo...');
    
    const partidos = await Partido.find({
      torneo: torneoId,
      estado: 'finalizado',
      $or: [
        { equipoLocal: equipoId },
        { equipoVisitante: equipoId }
      ]
    }).populate({
      path: 'jugadas.jugadorPrincipal jugadas.jugadorSecundario jugadas.jugadorTouchdown',
      select: 'nombre imagen'
    }).populate('equipoLocal equipoVisitante', 'nombre');

    console.log(`📋 Partidos encontrados: ${partidos.length}`);

    if (partidos.length === 0) {
      console.log('⚠️ No se encontraron partidos finalizados');
      return res.json({
        lideres: [],
        tipo,
        mensaje: 'No hay partidos finalizados para calcular estadísticas'
      });
    }

    console.log(`📊 Calculando estadísticas de ${tipo}...`);
    const estadisticasJugadores = new Map();

    // Obtener jugadores del equipo con sus números
    const jugadoresEquipo = await Usuario.find({
      'equipos.equipo': equipoId
    }).select('nombre imagen equipos');

    // Crear mapa de jugador -> número
    const numerosJugadores = new Map();
    jugadoresEquipo.forEach(jugador => {
      const equipoData = jugador.equipos.find(e => {
        if (!e.equipo) {
          console.warn(`⚠️  ADVERTENCIA: El jugador '${jugador.nombre}' (ID: ${jugador._id}) tiene una referencia de equipo NULL y podría causar problemas`);
          return false;
        }
        return e.equipo.toString() === equipoId.toString();
      });
      
      if (equipoData) {
        numerosJugadores.set(jugador._id.toString(), equipoData.numero);
      }
    });

    console.log(`📊 Procesando ${partidos.length} partidos para equipo: ${equipoId}`);

    let totalPuntosCalculados = 0;

    // 🔥 PROCESAR TODOS LOS PARTIDOS CON LÓGICA EXACTA DE CLASIFICACIÓN GENERAL
    partidos.forEach(partido => {
      if (!partido.jugadas || partido.jugadas.length === 0) return;

      partido.jugadas.forEach(jugada => {
        // 🔥 FUNCIÓN PARA PROCESAR CADA JUGADOR - EXACTA DE CLASIFICACIÓN GENERAL
        const procesarJugador = (jugador, esSecundario) => {
          if (!jugador || !jugador._id) return;

          const jugadorId = jugador._id.toString();
          
          // Solo procesar jugadores que pertenecen al equipo seleccionado
          if (!numerosJugadores.has(jugadorId)) return;

          // Inicializar si no existe
          if (!estadisticasJugadores.has(jugadorId)) {
            estadisticasJugadores.set(jugadorId, {
              jugador: {
                _id: jugador._id,
                nombre: jugador.nombre,
                numero: numerosJugadores.get(jugadorId) || 0,
                imagen: jugador.imagen
              },
              pases: { intentos: 0, completados: 0, touchdowns: 0, intercepciones: 0 },
              puntos: 0,
              tackleos: 0,
              intercepciones: 0,
              sacks: 0,
              recepciones: 0,
              qbRating: 0
            });
          }

          const stats = estadisticasJugadores.get(jugadorId);

          // 🔥 SWITCH EXACTO DE CLASIFICACIÓN GENERAL
          switch (jugada.tipoJugada) {
            case 'pase_completo':
              if (!esSecundario) {
                stats.pases.intentos++;
                stats.pases.completados++;
                if (jugada.resultado?.touchdown) {
                  stats.pases.touchdowns++;
                }
              } else {
                stats.recepciones++;
                if (jugada.resultado?.touchdown) {
                  stats.puntos += 6;
                  totalPuntosCalculados += 6;
                }
              }
              break;
              
            case 'corrida':
              if (!esSecundario) {
                if (jugada.resultado?.touchdown) {
                  stats.puntos += 6;
                  totalPuntosCalculados += 6;
                }
              } else {
                // 🔥 TACKLEADOR en corrida - EXACTO DE CLASIFICACIÓN GENERAL
                stats.tackleos++;
              }
              break;
              
            case 'intercepcion':
              if (!esSecundario) {
                stats.intercepciones++;
                if (jugada.resultado?.touchdown) {
                  stats.puntos += 6;
                  totalPuntosCalculados += 6;
                }
              } else {
                // QB interceptado
                stats.pases.intentos++;
                stats.pases.intercepciones++;
              }
              break;
              
            case 'tackleo':
              if (!esSecundario) {
                stats.tackleos++;
              }
              break;
              
            case 'sack':
              if (!esSecundario) {
                stats.sacks++;
              }
              break;
              
            case 'pase_incompleto':
              if (!esSecundario) {
                stats.pases.intentos++;
              }
              break;
              
            case 'conversion_1pt':
            case 'conversion_2pt':
              const puntosConversion = jugada.tipoJugada === 'conversion_1pt' ? 1 : 2;
              if (!esSecundario) {
                stats.pases.intentos++;
                stats.pases.completados++;
              } else {
                stats.recepciones++;
                stats.puntos += puntosConversion;
                totalPuntosCalculados += puntosConversion;
              }
              break;
              
            case 'safety':
              if (!esSecundario) {
                stats.puntos += 2;
                totalPuntosCalculados += 2;
              }
              break;
          }
        };

        // Procesar jugador principal y secundario
        if (jugada.jugadorPrincipal) {
          procesarJugador(jugada.jugadorPrincipal, false);
        }
        if (jugada.jugadorSecundario) {
          procesarJugador(jugada.jugadorSecundario, true);
        }
        
        // 🔥 PROCESAR jugadorTouchdown si existe (para intercepción y otros TDs)
        if (jugada.jugadorTouchdown && jugada.resultado.touchdown) {
          const jugadorTouchdownId = jugada.jugadorTouchdown._id.toString();
          if (numerosJugadores.has(jugadorTouchdownId)) {
            if (!estadisticasJugadores.has(jugadorTouchdownId)) {
              estadisticasJugadores.set(jugadorTouchdownId, {
                jugador: {
                  _id: jugada.jugadorTouchdown._id,
                  nombre: jugada.jugadorTouchdown.nombre,
                  numero: numerosJugadores.get(jugadorTouchdownId) || 0,
                  imagen: jugada.jugadorTouchdown.imagen
                },
                pases: { intentos: 0, completados: 0, touchdowns: 0, intercepciones: 0 },
                puntos: 0,
                tackleos: 0,
                intercepciones: 0,
                sacks: 0,
                recepciones: 0,
                qbRating: 0
              });
            }

            const statsAnotador = estadisticasJugadores.get(jugadorTouchdownId);
            statsAnotador.puntos += 6;
            totalPuntosCalculados += 6;
          }
        }
      });
    });

    console.log(`📈 Procesados ${estadisticasJugadores.size} jugadores del equipo`);
    console.log(`💰 Total puntos calculados: ${totalPuntosCalculados}`);

    // 🔥 CALCULAR QB RATING PARA CADA JUGADOR
    console.log('\n🏈 === CALCULANDO QB RATING ===');
    estadisticasJugadores.forEach((stats, jugadorId) => {
      const { intentos, completados, touchdowns, intercepciones } = stats.pases;
      stats.qbRating = calcularQBRating(completados, intentos, touchdowns, intercepciones);
      
      if (intentos > 0) {
        console.log(`🏈 ${stats.jugador.nombre}: ${completados}/${intentos}, ${touchdowns} TDs, ${intercepciones} INTs → Rating: ${stats.qbRating}`);
      }
    });

    // Convertir a array y filtrar según el tipo
    let jugadoresArray = Array.from(estadisticasJugadores.values());

    // 🔥 FILTRAR JUGADORES CON ESTADÍSTICAS DEL TIPO
    if (tipo === 'qbrating') {
      // Solo QBs con al menos 5 intentos para evitar ratings engañosos
      jugadoresArray = jugadoresArray.filter(jugador => jugador.pases.intentos >= 5);
      console.log(`🏈 QBs elegibles (min 5 intentos): ${jugadoresArray.length}`);
    } else {
      // Filtros existentes para otros tipos
      jugadoresArray = jugadoresArray.filter(jugador => {
        const stat = tipo === 'puntos' ? jugador.puntos :
                    tipo === 'tackleos' ? jugador.tackleos :
                    tipo === 'intercepciones' ? jugador.intercepciones :
                    tipo === 'sacks' ? jugador.sacks :
                    tipo === 'recepciones' ? jugador.recepciones : 0;
        return stat > 0;
      });
    }

    // 🔥 ORDENAR SEGÚN TIPO DE ESTADÍSTICA
    switch (tipo) {
      case 'qbrating':
        jugadoresArray.sort((a, b) => {
          if (a.qbRating !== b.qbRating) {
            return b.qbRating - a.qbRating;
          }
          return b.pases.completados - a.pases.completados;
        });
        break;
      case 'puntos':
        jugadoresArray.sort((a, b) => b.puntos - a.puntos);
        break;
      case 'tackleos':
        jugadoresArray.sort((a, b) => b.tackleos - a.tackleos);
        break;
      case 'intercepciones':
        jugadoresArray.sort((a, b) => b.intercepciones - a.intercepciones);
        break;
      case 'sacks':
        jugadoresArray.sort((a, b) => b.sacks - a.sacks);
        break;
      case 'recepciones':
        jugadoresArray.sort((a, b) => b.recepciones - a.recepciones);
        break;
    }

    // Tomar solo el top 3
    const top3 = jugadoresArray.slice(0, 3);

    // 🔥 FORMATEAR RESPUESTA
    const lideres = top3.map((jugadorStats, index) => ({
      posicion: index + 1,
      jugador: {
        ...jugadorStats.jugador,
        imagen: getImageUrlServer(jugadorStats.jugador.imagen, req)
      },
      estadisticas: jugadorStats,
      valor: tipo === 'qbrating' ? jugadorStats.qbRating :
            tipo === 'puntos' ? jugadorStats.puntos :
            tipo === 'tackleos' ? jugadorStats.tackleos :
            tipo === 'intercepciones' ? jugadorStats.intercepciones :
            tipo === 'sacks' ? jugadorStats.sacks :
            tipo === 'recepciones' ? jugadorStats.recepciones : 0,
      qbRatingData: {
        intentos: jugadorStats.pases.intentos,
        completados: jugadorStats.pases.completados,
        porcentajeComplecion: jugadorStats.pases.intentos > 0 ?
          Math.round((jugadorStats.pases.completados / jugadorStats.pases.intentos) * 100) : 0,
        touchdowns: jugadorStats.pases.touchdowns,
        intercepciones: jugadorStats.pases.intercepciones,
        rating: jugadorStats.qbRating
      }
    }));

    console.log(`🏆 Top 3 ${tipo}:`);
    lideres.forEach((lider, index) => {
      console.log(`  ${index + 1}. ${lider.jugador.nombre} (#${lider.jugador.numero}) - ${lider.valor} ${tipo}`);
    });

    console.log('📤 Enviando líderes de estadísticas');
    console.log(`✅ [${new Date().toISOString()}] FIN - Líderes obtenidos\n`);

    res.json({
      mensaje: 'Líderes de estadísticas obtenidos correctamente',
      lideres,
      tipo,
      equipo: {
        _id: equipo._id,
        nombre: equipo.nombre,
        imagen: getImageUrlServer(equipo.imagen, req)
      },
      torneo: {
        _id: torneo._id,
        nombre: torneo.nombre
      },
      totalJugadores: jugadoresArray.length,
      fechaConsulta: new Date().toISOString()
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al obtener líderes estadísticas:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Líderes estadísticas fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al obtener líderes de estadísticas', 
      error: error.message 
    });
  }
};

// 📊 4. ESTADÍSTICAS COMPLETAS DE UN EQUIPO (PARA DASHBOARD)
exports.obtenerEstadisticasEquipo = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n📊 [${timestamp}] INICIO - Obtener estadísticas completas de equipo`);
  console.log('🏈 Equipo ID:', req.params.equipoId);
  console.log('🎯 Torneo ID:', req.params.torneoId);

  try {
    const { equipoId, torneoId } = req.params;

    console.log('🔍 Validando equipo y torneo...');
    const [equipo, torneo] = await Promise.all([
      Equipo.findById(equipoId),
      Torneo.findById(torneoId)
    ]);

    if (!equipo || !torneo) {
      console.log('❌ ERROR: Equipo o torneo no encontrado');
      return res.status(404).json({ mensaje: 'Equipo o torneo no encontrado' });
    }

    console.log(`✅ Procesando estadísticas completas para ${equipo.nombre}`);

    // Ejecutar consultas en paralelo para mejor rendimiento
    console.log('🔄 Ejecutando consultas paralelas...');
    const [tablaPosiciones, tendencia, lideresPases, lideresPromes, lideresTackleos, lideresInts, lideresSacks, lideresRec] = await Promise.all([
      // Tabla de posiciones (solo este equipo)
      obtenerPosicionEquipo(equipoId, torneoId, equipo.categoria, req),
      
      // Tendencia de puntos
      obtenerTendenciaEquipo(equipoId, torneoId, equipo.categoria, req),
      
      // Líderes por tipo
      obtenerLideresEquipo(equipoId, torneoId, 'pases', req),
      obtenerLideresEquipo(equipoId, torneoId, 'puntos', req),
      obtenerLideresEquipo(equipoId, torneoId, 'tackleos', req),
      obtenerLideresEquipo(equipoId, torneoId, 'intercepciones', req),
      obtenerLideresEquipo(equipoId, torneoId, 'sacks', req),
      obtenerLideresEquipo(equipoId, torneoId, 'recepciones', req)
    ]);

    console.log('✅ Todas las consultas completadas');

    const estadisticasCompletas = {
      equipo: {
        _id: equipo._id,
        nombre: equipo.nombre,
        imagen: getImageUrlServer(equipo.imagen, req),
        categoria: equipo.categoria
      },
      torneo: {
        _id: torneo._id,
        nombre: torneo.nombre
      },
      posicion: tablaPosiciones,
      tendenciaPuntos: tendencia,
      lideres: {
        pases: lideresPases,
        puntos: lideresPromes,
        tackleos: lideresTackleos,
        intercepciones: lideresInts,
        sacks: lideresSacks,
        recepciones: lideresRec
      },
      fechaConsulta: new Date().toISOString()
    };

    console.log('📤 Enviando estadísticas completas');
    console.log(`  📊 Posición en tabla: ${tablaPosiciones?.posicion || 'N/A'}`);
    console.log(`  📈 Jornadas jugadas: ${tendencia?.length || 0}`);
    console.log(`  👥 Líderes calculados: 6 categorías`);
    console.log(`✅ [${new Date().toISOString()}] FIN - Estadísticas completas obtenidas\n`);

    res.json(estadisticasCompletas);

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al obtener estadísticas completas:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Estadísticas completas fallidas\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al obtener estadísticas completas del equipo', 
      error: error.message 
    });
  }
};

exports.obtenerTorneosConCategorias = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🏆 [${timestamp}] INICIO - Obtener torneos con categorías`);

  try {
    const Partido = require('../models/Partido');
    const Torneo = require('../models/Torneo');
    
    console.log('🔍 Obteniendo torneos con partidos (finalizados O programados)...');
    
    // 🔥 CAMBIO: Incluir partidos programados también
    const torneosConPartidos = await Partido.aggregate([
      {
        $match: { 
          estado: { $in: ['finalizado', 'programado', 'en_curso'] } // Incluir todos los estados
        }
      },
      {
        $group: {
          _id: '$torneo',
          totalPartidos: { $sum: 1 },
          partidosFinalizados: {
            $sum: { $cond: [{ $eq: ['$estado', 'finalizado'] }, 1, 0] }
          },
          partidosProgramados: {
            $sum: { $cond: [{ $eq: ['$estado', 'programado'] }, 1, 0] }
          },
          partidosEnCurso: {
            $sum: { $cond: [{ $eq: ['$estado', 'en_curso'] }, 1, 0] }
          },
          categorias: { $addToSet: '$categoria' },
          fechaUltimoPartido: { $max: '$fechaHora' },
          fechaPrimerPartido: { $min: '$fechaHora' }
        }
      },
      {
        $lookup: {
          from: 'torneos',
          localField: '_id',
          foreignField: '_id',
          as: 'torneo'
        }
      },
      {
        $unwind: '$torneo'
      },
      {
        $match: {
          'torneo.estado': { $in: ['activo', 'finalizado', 'programado'] }
        }
      },
      {
        $project: {
          _id: '$torneo._id',
          nombre: '$torneo.nombre',
          fechaInicio: '$torneo.fechaInicio',
          fechaFin: '$torneo.fechaFin',
          estado: '$torneo.estado',
          totalPartidos: 1,
          partidosFinalizados: 1,
          partidosProgramados: 1,
          partidosEnCurso: 1,
          categorias: 1,
          fechaUltimoPartido: 1,
          fechaPrimerPartido: 1,
          progreso: {
            $round: [
              { 
                $multiply: [
                  { $divide: ['$partidosFinalizados', '$totalPartidos'] }, 
                  100
                ]
              }, 
              1
            ]
          }
        }
      },
      {
        $sort: { fechaUltimoPartido: -1 }
      }
    ]);

    console.log(`✅ Encontrados ${torneosConPartidos.length} torneos con partidos`);

    // Si no hay torneos con partidos, obtener torneos activos
    if (torneosConPartidos.length === 0) {
      console.log('⚠️ No hay torneos con partidos, obteniendo torneos activos...');
      
      const torneosActivos = await Torneo.find({ 
        estado: { $in: ['activo', 'programado'] } 
      }).select('nombre fechaInicio fechaFin estado').sort({ fechaInicio: -1 });

      const torneosFormateados = torneosActivos.map(torneo => ({
        _id: torneo._id,
        nombre: torneo.nombre,
        fechaInicio: torneo.fechaInicio,
        fechaFin: torneo.fechaFin,
        estado: torneo.estado,
        totalPartidos: 0,
        partidosFinalizados: 0,
        partidosProgramados: 0,
        partidosEnCurso: 0,
        categorias: [],
        fechaUltimoPartido: null,
        fechaPrimerPartido: null,
        progreso: 0
      }));

      return res.json({
        torneos: torneosFormateados,
        total: torneosFormateados.length,
        mensaje: 'Torneos disponibles (sin partidos aún)',
        tienePartidos: false
      });
    }

    console.log('📤 Enviando torneos con partidos');
    console.log(`✅ [${new Date().toISOString()}] FIN - Torneos obtenidos\n`);

    res.json({
      torneos: torneosConPartidos,
      total: torneosConPartidos.length,
      mensaje: torneosConPartidos.every(t => t.partidosFinalizados === 0) 
        ? 'Torneos con partidos programados (sin estadísticas aún)'
        : 'Torneos con estadísticas disponibles',
      tienePartidos: true,
      tieneEstadisticas: torneosConPartidos.some(t => t.partidosFinalizados > 0)
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al obtener torneos:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Torneos fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al obtener torneos con estadísticas', 
      error: error.message,
      torneos: []
    });
  }
};

// 🎯 ESTADÍSTICAS PARA TARJETA DE EQUIPO - VERSIÓN CORREGIDA
exports.obtenerEstadisticasTarjetaEquipo = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🎯 [${timestamp}] INICIO - Estadísticas para tarjeta de equipo`);
  console.log('🏈 Equipo ID:', req.params.equipoId);
  console.log('🎯 Torneo ID:', req.params.torneoId);

  try {
    const { equipoId, torneoId } = req.params;

    // 🔥 VALIDACIÓN DE MONGOOSE IDS
    if (!mongoose.Types.ObjectId.isValid(equipoId) || !mongoose.Types.ObjectId.isValid(torneoId)) {
      console.log('❌ ERROR: IDs inválidos');
      return res.status(400).json({ mensaje: 'IDs de equipo o torneo inválidos' });
    }

    // Validación básica
    const [equipo, torneo] = await Promise.all([
      Equipo.findById(equipoId).select('nombre imagen categoria'),
      Torneo.findById(torneoId).select('nombre')
    ]);

    if (!equipo || !torneo) {
      console.log('❌ ERROR: Equipo o torneo no encontrado');
      return res.status(404).json({ mensaje: 'Equipo o torneo no encontrado' });
    }

    console.log(`✅ Procesando tarjeta para ${equipo.nombre} en ${torneo.nombre}`);

    // 🔥 CONSULTA OPTIMIZADA: Solo partidos finalizados del equipo
    const partidos = await Partido.find({
      torneo: new mongoose.Types.ObjectId(torneoId), // 🔥 CORRECCIÓN AQUÍ
      categoria: equipo.categoria,
      estado: 'finalizado',
      $or: [
        { equipoLocal: new mongoose.Types.ObjectId(equipoId) }, // 🔥 Y AQUÍ
        { equipoVisitante: new mongoose.Types.ObjectId(equipoId) }
      ]
    }).select('marcador equipoLocal equipoVisitante jugadas fechaHora')
      .sort({ fechaHora: 1 });

    console.log(`📊 Partidos finalizados encontrados: ${partidos.length}`);

    // 🏆 CÁLCULOS BÁSICOS PARA LA TARJETA
    let estadisticasBasicas = {
      partidosJugados: partidos.length,
      partidosGanados: 0,
      partidosPerdidos: 0,
      puntosFavor: 0,
      puntosContra: 0,
      touchdowns: 0,
      conversiones1pt: 0,
      conversiones2pt: 0,
      safeties: 0,
      intercepciones: 0,
      sacks: 0,
      tackleos: 0,
      pasesCompletos: 0,
      pasesIncompletos: 0,
      corridas: 0
    };

    // 🎯 OBTENER NÚMERO DE JUGADOR DEL USUARIO
    let numeroJugador = null;
    if (req.usuario) {
      try {
        const usuario = await Usuario.findById(req.usuario._id).select('equipos');
        const equipoDelUsuario = usuario?.equipos?.find(e => {
          if (!e.equipo) {
            console.warn(`⚠️  ADVERTENCIA: El usuario actual '${usuario.nombre || 'Sin nombre'}' (ID: ${usuario._id}) tiene una referencia de equipo NULL en su perfil`);
            return false;
          }
          return e.equipo.toString() === equipoId.toString();
        });
        numeroJugador = equipoDelUsuario?.numero || null;
      } catch (userError) {
        console.log('⚠️ Error al obtener número de jugador:', userError.message);
        // No fallar por esto
      }
    }

    // 📊 PROCESAR CADA PARTIDO
    const rachaResultados = [];
    
    partidos.forEach((partido, index) => {
      const esLocal = partido.equipoLocal.toString() === equipoId.toString();
      const puntosEquipo = esLocal ? partido.marcador.local : partido.marcador.visitante;
      const puntosRival = esLocal ? partido.marcador.visitante : partido.marcador.local;

      // Acumular puntos
      estadisticasBasicas.puntosFavor += puntosEquipo;
      estadisticasBasicas.puntosContra += puntosRival;

      // Determinar resultado
      if (puntosEquipo > puntosRival) {
        estadisticasBasicas.partidosGanados++;
        rachaResultados.push('V');
      } else if (puntosEquipo < puntosRival) {
        estadisticasBasicas.partidosPerdidos++;
        rachaResultados.push('D');
      }

      // 🎮 PROCESAR JUGADAS DEL PARTIDO (OPTIMIZADO)
      if (partido.jugadas && partido.jugadas.length > 0) {
        partido.jugadas.forEach(jugada => {
          try {
            // Solo contar jugadas del equipo en posesión
            if (jugada.equipoEnPosesion && jugada.equipoEnPosesion.toString() === equipoId.toString()) {
              
              // 🔧 LÓGICA CORREGIDA PARA ESTADÍSTICAS
              switch (jugada.tipoJugada) {
                case 'pase_completo':
                  if (!esSecundario) {
                    // QB: Contabilizar pase
                    stats.pases.intentos++;
                    stats.pases.completados++;
                  } else {
                    // RECEPTOR: Contabilizar recepción
                    stats.recepciones++;
                  }
                  break;
                  
                case 'touchdown':
                  if (!esSecundario) {
                    // QB: Contabilizar pase de TD
                    stats.pases.intentos++;
                    stats.pases.completados++;
                    stats.pases.touchdowns++;
                  } else {
                    // 🔥 RECEPTOR: Recibe los puntos Y la recepción
                    stats.recepciones++;
                    stats.puntos += 6; // Los puntos van al receptor
                  }
                  break;
                  
                case 'conversion_1pt':
                case 'conversion_2pt':
                  const puntosConversion = jugada.tipoJugada === 'conversion_1pt' ? 1 : 2;
                  if (!esSecundario) {
                    // QB: Contabilizar pase de conversión
                    stats.pases.intentos++;
                    stats.pases.completados++;
                  } else {
                    // 🔥 RECEPTOR: Recibe los puntos Y la recepción
                    stats.recepciones++;
                    stats.puntos += puntosConversion;
                  }
                  break;
                  
                case 'corrida':
                  if (!esSecundario) {
                    // 🔥 CORREDOR (jugador principal)
                    stats.corridas = (stats.corridas || 0) + 1;
                    // stats.yardasCorrida = (stats.yardasCorrida || 0) + (jugada.yardas || 0); // Si tienes yardas
                    
                    if (jugada.resultado.touchdown) {
                      stats.puntos += 6;
                      stats.touchdownsCorrida = (stats.touchdownsCorrida || 0) + 1;
                    }
                  } else {
                    // 🔥 TACKLEADOR (jugador secundario en corrida)
                    stats.tackleos = (stats.tackleos || 0) + 1;
                  }
                  break;
                  
                case 'intercepcion':
                  if (!esSecundario) {
                    // 🔥 INTERCEPTOR: Estadística defensiva + posibles puntos
                    stats.intercepciones++;
                    if (jugada.resultado.touchdown) {
                      stats.puntos += 6;
                    }
                  } else {
                    // 🔥 QB INTERCEPTADO: Cuenta como intercepción lanzada
                    stats.pases.intentos++;
                    stats.pases.intercepciones++;
                  }
                  break;
                  
                case 'pase_incompleto':
                  if (!esSecundario) {
                    stats.pases.intentos++;
                  }
                  break;
                  
                case 'sack':
                  if (!esSecundario) {
                    stats.sacks++;
                  }
                  break;
                  
                case 'tackleo':
                  if (!esSecundario) {
                    stats.tackleos++;
                  }
                  break;
                  
                case 'safety':
                  // Safety: Puntos van al equipo defensor
                  if (!esSecundario) {
                    stats.puntos += 2;
                  }
                  break;
              }
            }
          } catch (jugadaError) {
            console.log('⚠️ Error procesando jugada:', jugadaError.message);
            // Continuar con la siguiente jugada
          }
        });
      }
    });

    // 🔢 CÁLCULOS DERIVADOS
    const totalPases = estadisticasBasicas.pasesCompletos + estadisticasBasicas.pasesIncompletos;
    const porcentajePases = totalPases > 0 ? 
      Math.round((estadisticasBasicas.pasesCompletos / totalPases) * 100) : 0;
    
    const totalPuntos = (estadisticasBasicas.touchdowns * 6) + 
                       estadisticasBasicas.conversiones1pt + 
                       (estadisticasBasicas.conversiones2pt * 2) + 
                       (estadisticasBasicas.safeties * 2);
    
    const promedioPuntosPorPartido = estadisticasBasicas.partidosJugados > 0 ? 
      Math.round((estadisticasBasicas.puntosFavor / estadisticasBasicas.partidosJugados) * 10) / 10 : 0;
    
    const porcentajeVictorias = estadisticasBasicas.partidosJugados > 0 ? 
      Math.round((estadisticasBasicas.partidosGanados / estadisticasBasicas.partidosJugados) * 100) : 0;

    // 🏅 CALCULAR POSICIÓN EN LA TABLA (CONSULTA LIGERA) - VERSIÓN SIMPLIFICADA
    let totalEquiposCategoria = 12; // Default
    let posicionAproximada = 1;
    
    try {
      const equiposCategoria = await Partido.aggregate([
        {
          $match: {
            torneo: new mongoose.Types.ObjectId(torneoId),
            categoria: equipo.categoria,
            estado: 'finalizado'
          }
        },
        {
          $group: {
            _id: null,
            equiposUnicos: {
              $addToSet: {
                $cond: [
                  { $ne: ['$equipoLocal', null] },
                  '$equipoLocal',
                  '$equipoVisitante'
                ]
              }
            }
          }
        }
      ]);

      totalEquiposCategoria = equiposCategoria[0]?.equiposUnicos?.length || 12;
      
      // Posición aproximada basada en porcentaje de victorias
      posicionAproximada = Math.ceil(totalEquiposCategoria * ((100 - porcentajeVictorias) / 100)) || totalEquiposCategoria;
    } catch (posicionError) {
      console.log('⚠️ Error calculando posición:', posicionError.message);
      // Usar valores por defecto
    }

    // 📦 RESPUESTA OPTIMIZADA PARA TEAMCARD
    const respuesta = {
      equipo: {
        _id: equipo._id,
        nombre: equipo.nombre,
        imagen: getImageUrlServer(equipo.imagen, req),
        categoria: equipo.categoria
      },
      torneo: {
        _id: torneo._id,
        nombre: torneo.nombre
      },
      usuario: {
        numeroJugador: numeroJugador
      },
      estadisticas: {
        // Básicas de rendimiento
        partidosJugados: estadisticasBasicas.partidosJugados,
        partidosGanados: estadisticasBasicas.partidosGanados,
        partidosPerdidos: estadisticasBasicas.partidosPerdidos,
        porcentajeVictorias: porcentajeVictorias,
        
        // Puntos
        puntosFavor: estadisticasBasicas.puntosFavor,
        puntosContra: estadisticasBasicas.puntosContra,
        diferenciaPuntos: estadisticasBasicas.puntosFavor - estadisticasBasicas.puntosContra,
        promedioPuntosPorPartido: promedioPuntosPorPartido,
        totalPuntosCalculados: totalPuntos,
        
        // Estadísticas ofensivas
        touchdowns: estadisticasBasicas.touchdowns,
        conversiones1pt: estadisticasBasicas.conversiones1pt,
        conversiones2pt: estadisticasBasicas.conversiones2pt,
        safeties: estadisticasBasicas.safeties,
        
        // Pases
        pasesCompletos: estadisticasBasicas.pasesCompletos,
        pasesIncompletos: estadisticasBasicas.pasesIncompletos,
        totalPases: totalPases,
        porcentajePases: porcentajePases,
        
        // Corridas
        corridas: estadisticasBasicas.corridas,
        
        // Estadísticas defensivas
        intercepciones: estadisticasBasicas.intercepciones,
        sacks: estadisticasBasicas.sacks,
        tackleos: estadisticasBasicas.tackleos,
        
        // Posición y ranking
        posicionLiga: posicionAproximada,
        totalEquipos: totalEquiposCategoria,
        
        // Racha (últimos 5 partidos)
        rachaActual: rachaResultados.slice(-5)
      },
      metadatos: {
        fechaConsulta: new Date().toISOString(),
        tiempoRespuesta: Date.now() - new Date(timestamp).getTime(),
        optimizado: true
      }
    };

    console.log('📤 Enviando estadísticas optimizadas para tarjeta');
    console.log(`  🏆 Partidos: ${estadisticasBasicas.partidosJugados} | Victorias: ${porcentajeVictorias}%`);
    console.log(`  ⚡ TD: ${estadisticasBasicas.touchdowns} | Promedio: ${promedioPuntosPorPartido} pts`);
    console.log(`  📊 Posición: ${posicionAproximada}/${totalEquiposCategoria}`);
    console.log(`✅ [${new Date().toISOString()}] FIN - Tarjeta optimizada\n`);

    res.json(respuesta);

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al obtener estadísticas tarjeta:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Tarjeta fallida\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al obtener estadísticas para tarjeta de equipo', 
      error: error.message 
    });
  }
};

// 🏆 FUNCIÓN COMPLETA: OBTENER CLASIFICACIÓN GENERAL (TOP 5 POR CADA TIPO) - ACTUALIZADA PARA QB RATING
exports.obtenerClasificacionGeneral = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🏆 [${timestamp}] INICIO - Obtener clasificación general Top 5`);
  
  try {
    const { torneoId, categoria } = req.params;
    console.log('🎯 Parámetros recibidos:', { torneoId, categoria });

    // Verificar que el torneo existe
    const torneo = await Torneo.findById(torneoId);
    if (!torneo) {
      console.log('❌ ERROR: Torneo no encontrado');
      return res.status(404).json({ mensaje: 'Torneo no encontrado' });
    }

    // 🔥 TIPOS DE ESTADÍSTICAS ACTUALIZADOS: 'pases' → 'qbrating'
    const tiposEstadisticas = ['qbrating', 'puntos', 'recepciones', 'tackleos', 'intercepciones', 'sacks'];
    console.log('📊 Tipos de estadísticas a procesar:', tiposEstadisticas);

    // Obtener TODOS los partidos finalizados del torneo y categoría
    console.log('🔍 Buscando partidos finalizados...');
    const partidos = await Partido.find({
      torneo: torneoId,
      categoria: categoria,
      estado: 'finalizado'
    }).populate('equipoLocal equipoVisitante', 'nombre imagen')
      .populate('jugadas.jugadorPrincipal jugadas.jugadorSecundario jugadas.jugadorTouchdown', 'nombre imagen');

    if (partidos.length === 0) {
      console.log('⚠️ No hay partidos finalizados');
      const clasificacionVacia = {};
      tiposEstadisticas.forEach(tipo => {
        clasificacionVacia[tipo] = { lideres: [], totalJugadoresConStats: 0, tipo: tipo };
      });

      return res.json({
        mensaje: 'No hay partidos finalizados para generar clasificación',
        clasificacionGeneral: clasificacionVacia,
        categoria, 
        torneo: { _id: torneo._id, nombre: torneo.nombre },
        tiposDisponibles: tiposEstadisticas, 
        fechaConsulta: new Date().toISOString()
      });
    }

    console.log(`📊 Partidos encontrados: ${partidos.length}`);

    // 🔍 AUDITORÍA PREVENTIVA: Verificar integridad de datos antes del procesamiento
    console.log('\n🔍 === AUDITORÍA DE INTEGRIDAD DE DATOS ===');
    
    const allUsuarios = await Usuario.find({}).select('nombre equipos');
    let totalUsuarios = allUsuarios.length;
    let usuariosConProblemas = 0;
    let totalReferenciasInvalidas = 0;
    
    allUsuarios.forEach(usuario => {
      const referenciasInvalidas = usuario.equipos?.filter(e => !e.equipo) || [];
      if (referenciasInvalidas.length > 0) {
        usuariosConProblemas++;
        totalReferenciasInvalidas += referenciasInvalidas.length;
      }
    });
    
    console.log(`📊 Total usuarios en sistema: ${totalUsuarios}`);
    console.log(`⚠️  Usuarios con referencias inválidas: ${usuariosConProblemas}`);
    console.log(`🚨 Total referencias NULL encontradas: ${totalReferenciasInvalidas}`);
    
    if (usuariosConProblemas > 0) {
      console.warn(`\n🚨 ADVERTENCIA: Se detectaron ${usuariosConProblemas} usuarios con datos corruptos`);
      console.warn(`💡 RECOMENDACIÓN: Ejecuta el script 'find-users-without-teams.js' para limpiar estos datos`);
    } else {
      console.log('✅ Integridad de datos: OK - No se encontraron referencias inválidas');
    }
    console.log('='.repeat(50));

    // 🔥 USAR LA MISMA LÓGICA EXACTA DEL DEBUG PARA TODOS LOS JUGADORES
    const estadisticasJugadores = new Map(); // jugadorId -> stats completas

    // Procesar TODOS los partidos y TODAS las jugadas
    partidos.forEach(partido => {
      if (!partido.jugadas || partido.jugadas.length === 0) return;

      partido.jugadas.forEach(jugada => {
        // 🔥 EXACTAMENTE IGUAL QUE EN DEBUG: Analizar cada jugador involucrado
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

          // 🔥 EXACTAMENTE LA MISMA LÓGICA DEL DEBUG QUE FUNCIONA
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
    console.log('\n🏈 === CALCULANDO QB RATING PARA CLASIFICACIÓN GENERAL ===');
    estadisticasJugadores.forEach((stats, jugadorId) => {
      const { intentos, completados, touchdowns, intercepciones, conversiones } = stats.stats.pases;
      stats.qbRating = calcularQBRating(completados, intentos, touchdowns, intercepciones, conversiones);
      
      if (intentos > 0) {
        console.log(`🏈 ${stats.jugador.nombre}: ${completados}/${intentos}, ${touchdowns} TDs, ${intercepciones} INTs, ${conversiones} Conv → Rating: ${stats.qbRating}`);
      }
    });

    // 🔥 CORREGIR EQUIPOS DESPUÉS DEL PROCESAMIENTO
    console.log('🔄 Corrigiendo equipos de jugadores...');
    const jugadoresIds = Array.from(estadisticasJugadores.keys());
    const equiposIds = [
      ...new Set(partidos.flatMap(p => [p.equipoLocal._id.toString(), p.equipoVisitante._id.toString()]))
    ];

    // 🔥 CORREGIDO: Solo obtener usuarios que REALMENTE tienen jugadas
    console.log(`🔍 Buscando información de ${jugadoresIds.length} jugadores que tienen estadísticas...`);
    const usuarios = await Usuario.find({
      '_id': { $in: jugadoresIds }  // 🔥 SOLO los jugadores que aparecen en jugadas
    }).select('nombre imagen equipos');
    
    console.log(`✅ Encontrados ${usuarios.length} usuarios con jugadas registradas`);
    
    // 🔍 DEBUG: Verificar si hay discrepancia entre jugadores esperados y usuarios encontrados
    if (usuarios.length !== jugadoresIds.length) {
      console.warn(`⚠️  DISCREPANCIA: Se esperaban ${jugadoresIds.length} usuarios pero se encontraron ${usuarios.length}`);
      
      const usuariosEncontradosIds = usuarios.map(u => u._id.toString());
      const jugadoresFaltantes = jugadoresIds.filter(id => !usuariosEncontradosIds.includes(id));
      
      if (jugadoresFaltantes.length > 0) {
        console.warn(`❌ Jugadores con estadísticas pero sin datos de usuario (posiblemente eliminados):`);
        jugadoresFaltantes.slice(0, 5).forEach(id => {
          const stats = estadisticasJugadores.get(id);
          console.warn(`  - ${stats?.jugador?.nombre || 'Nombre desconocido'} (ID: ${id})`);
        });
        if (jugadoresFaltantes.length > 5) {
          console.warn(`  ... y ${jugadoresFaltantes.length - 5} más`);
        }
      }
    }

    // Crear mapa de equipos para acceso rápido
    const equiposMap = new Map();
    partidos.forEach(partido => {
      equiposMap.set(partido.equipoLocal._id.toString(), partido.equipoLocal);
      equiposMap.set(partido.equipoVisitante._id.toString(), partido.equipoVisitante);
    });

    // Actualizar cada jugador con su equipo correcto
    let jugadoresConProblemas = 0;
    usuarios.forEach(usuario => {
      if (estadisticasJugadores.has(usuario._id.toString())) {
        const stats = estadisticasJugadores.get(usuario._id.toString());
        
        // 🔍 AUDITORÍA: Revisar TODOS los equipos del usuario
        const equiposInvalidos = usuario.equipos.filter(e => !e.equipo);
        if (equiposInvalidos.length > 0) {
          console.warn(`⚠️  ADVERTENCIA: El jugador '${usuario.nombre}' (ID: ${usuario._id}) tiene ${equiposInvalidos.length} referencia(s) de equipo NULL y podría causar problemas`);
          jugadoresConProblemas++;
        }
        
        // 🔥 BUSCAR EL EQUIPO CON VALIDACIÓN NULL Y LOGGING DETALLADO
        const equipoData = usuario.equipos.find(e => {
          if (!e.equipo) {
            return false; // Ya logueado arriba
          }
          try {
            return equiposIds.includes(e.equipo.toString());
          } catch (error) {
            console.error(`❌ ERROR: El jugador '${usuario.nombre}' (ID: ${usuario._id}) tiene equipo con ID inválido que no se puede convertir a string: ${e.equipo}`);
            return false;
          }
        });
        
        if (equipoData) {
          const equipoInfo = equiposMap.get(equipoData.equipo.toString());
          if (equipoInfo) {
            stats.equipo = {
              _id: equipoInfo._id,
              nombre: equipoInfo.nombre,
              imagen: equipoInfo.imagen
            };
            stats.jugador.numero = equipoData.numero;
          } else {
            console.warn(`⚠️  ADVERTENCIA: El jugador '${usuario.nombre}' está asignado al equipo ID: ${equipoData.equipo} pero ese equipo no existe en este torneo/categoría`);
          }
        } else {
          console.warn(`⚠️  ADVERTENCIA: El jugador '${usuario.nombre}' no tiene ningún equipo válido para este torneo/categoría (equipos en torneo: ${equiposIds.length})`);
          
          // 🔍 DEBUG: Mostrar de qué partidos/jugadas viene este jugador
          const statsDelJugador = estadisticasJugadores.get(usuario._id.toString());
          if (statsDelJugador) {
            console.log(`🔍 DEBUG: Este jugador tiene estadísticas registradas:`);
            console.log(`   - Pases: ${statsDelJugador.stats.pases.intentos} intentos, ${statsDelJugador.stats.pases.completados} completados`);
            console.log(`   - Puntos: ${statsDelJugador.stats.puntos.total}`);
            console.log(`   - Recepciones: ${statsDelJugador.stats.recepciones.total}`);
            console.log(`   - Tackleos: ${statsDelJugador.stats.tackleos.total}`);
            
            // 🔍 NUEVO: Rastrear exactamente de qué partidos vienen sus estadísticas
            console.log(`\n🏈 RASTREANDO ORIGEN DE LAS ESTADÍSTICAS:`);
            let partidosConJugadas = [];
            
            partidos.forEach(partido => {
              let jugadasEnEstePartido = 0;
              let equiposEncontrados = new Set();
              
              if (partido.jugadas) {
                partido.jugadas.forEach(jugada => {
                  const esJugadorPrincipal = jugada.jugadorPrincipal && jugada.jugadorPrincipal._id.toString() === usuario._id.toString();
                  const esJugadorSecundario = jugada.jugadorSecundario && jugada.jugadorSecundario._id.toString() === usuario._id.toString();
                  const esJugadorTouchdown = jugada.jugadorTouchdown && jugada.jugadorTouchdown._id.toString() === usuario._id.toString();
                  
                  if (esJugadorPrincipal || esJugadorSecundario || esJugadorTouchdown) {
                    jugadasEnEstePartido++;
                    
                    // Determinar en qué equipo estaba jugando
                    let equipoJugando = null;
                    if (jugada.equipoEnPosesion) {
                      const equipoId = jugada.equipoEnPosesion.toString();
                      if (equipoId === partido.equipoLocal._id.toString()) {
                        equipoJugando = partido.equipoLocal.nombre;
                        equiposEncontrados.add(`${partido.equipoLocal.nombre} (Local)`);
                      } else if (equipoId === partido.equipoVisitante._id.toString()) {
                        equipoJugando = partido.equipoVisitante.nombre;
                        equiposEncontrados.add(`${partido.equipoVisitante.nombre} (Visitante)`);
                      }
                    }
                    
                    console.log(`     📝 Jugada: ${jugada.tipoJugada} - Rol: ${esJugadorPrincipal ? 'Principal' : esJugadorSecundario ? 'Secundario' : 'Touchdown'} - Equipo en posesión: ${equipoJugando || 'Desconocido'}`);
                  }
                });
              }
              
              if (jugadasEnEstePartido > 0) {
                partidosConJugadas.push({
                  partidoId: partido._id,
                  equipoLocal: partido.equipoLocal.nombre,
                  equipoVisitante: partido.equipoVisitante.nombre,
                  fecha: partido.fechaHora,
                  jugadas: jugadasEnEstePartido,
                  equipos: Array.from(equiposEncontrados)
                });
              }
            });
            
            console.log(`\n📊 RESUMEN DE PARTIDOS CON ESTADÍSTICAS:`);
            partidosConJugadas.forEach((partidoInfo, index) => {
              const fechaFormateada = partidoInfo.fecha ? new Date(partidoInfo.fecha).toLocaleDateString() : 'Sin fecha';
              console.log(`   ${index + 1}. ${partidoInfo.equipoLocal} vs ${partidoInfo.equipoVisitante}`);
              console.log(`      - Partido ID: ${partidoInfo.partidoId}`);
              console.log(`      - Fecha: ${fechaFormateada}`);
              console.log(`      - Jugadas del jugador: ${partidoInfo.jugadas}`);
              console.log(`      - Equipos donde jugó: ${partidoInfo.equipos.join(', ') || 'No determinado'}`);
            });
            
            console.log(`💡 CAUSA: Este jugador participó en ${partidosConJugadas.length} partido(s) pero después se le eliminaron los equipos`);
          }
          
          // 🔍 DEBUG: Mostrar sus equipos actuales (incluso si son inválidos)
          console.log(`\n🔍 DEBUG: Equipos actuales del jugador '${usuario.nombre}':`);
          if (!usuario.equipos || usuario.equipos.length === 0) {
            console.log(`   - No tiene equipos asignados (array vacío o null)`);
          } else {
            usuario.equipos.forEach((equipoRef, index) => {
              console.log(`   - Equipo ${index + 1}: ${equipoRef.equipo ? equipoRef.equipo.toString() : 'NULL'} (Número: ${equipoRef.numero || 'Sin número'})`);
            });
          }
          
          console.log(`\n💡 SOLUCIÓN RECOMENDADA: Ejecutar 'node find-users-without-teams.js --execute' para limpiar este usuario\n`);
        }
      }
    });

    if (jugadoresConProblemas > 0) {
      console.warn(`\n🚨 RESUMEN DE PROBLEMAS: Se encontraron ${jugadoresConProblemas} jugadores con referencias de equipos inválidas`);
      console.warn(`💡 RECOMENDACIÓN: Considera ejecutar el script de limpieza de usuarios sin equipos válidos`);
      
      // 🔥 OPCIÓN: Filtrar jugadores sin equipos válidos de las estadísticas
      console.log(`\n🧹 LIMPIEZA AUTOMÁTICA: Removiendo jugadores sin equipos válidos de las estadísticas...`);
      let jugadoresRemovidos = 0;
      
      for (const [jugadorId, stats] of estadisticasJugadores.entries()) {
        if (!stats.equipo || !stats.equipo._id) {
          estadisticasJugadores.delete(jugadorId);
          jugadoresRemovidos++;
          console.log(`   - Removido: ${stats.jugador.nombre} (sin equipo válido)`);
        }
      }
      
      console.log(`✅ Removidos ${jugadoresRemovidos} jugadores sin equipos válidos`);
      console.log(`📊 Jugadores restantes para clasificación: ${estadisticasJugadores.size}`);
    }

    console.log('✅ Equipos corregidos');

    // Generar clasificación para cada tipo
    const clasificacionGeneral = {};

    tiposEstadisticas.forEach(tipo => {
      // 🔥 FILTRAR JUGADORES CON ESTADÍSTICAS DEL TIPO Y EQUIPOS VÁLIDOS
      const jugadoresArray = Array.from(estadisticasJugadores.values()).filter(jugador => {
        // 🔥 VERIFICAR QUE EL JUGADOR TENGA EQUIPO VÁLIDO
        if (!jugador.equipo || !jugador.equipo._id) {
          console.log(`⚠️ Jugador ${jugador.jugador.nombre} sin equipo válido - excluido`);
          return false;
        }

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

      // 🔥 ORDENAR POR ESTADÍSTICA ESPECÍFICA (INCLUYE QB RATING)
      const top5Jugadores = jugadoresArray
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
        .slice(0, 5);

      // 🔥 FORMATEAR DATOS CON QB RATING
      const lideresFormateados = top5Jugadores.map((jugador, index) => ({
        posicion: index + 1,
        jugador: {
          _id: jugador.jugador._id,
          nombre: jugador.jugador.nombre,
          numero: jugador.jugador.numero,
          imagen: jugador.jugador.imagen
        },
        equipo: jugador.equipo ? {
          _id: jugador.equipo._id,
          nombre: jugador.equipo.nombre,
          imagen: jugador.equipo.imagen
        } : {
          _id: null,
          nombre: 'Sin equipo',
          imagen: null
        },
        valor: tipo === 'qbrating' ? jugador.qbRating :
              tipo === 'puntos' ? jugador.stats.puntos.total :
              tipo === 'tackleos' ? jugador.stats.tackleos.total :
              tipo === 'intercepciones' ? jugador.stats.intercepciones.total :
              tipo === 'sacks' ? jugador.stats.sacks.total :
              tipo === 'recepciones' ? jugador.stats.recepciones.total : 0,
        estadisticasCompletas: jugador.stats,
        // 🔥 QB RATING DATA PARA FRONTEND
        qbRatingData: tipo === 'qbrating' ? {
          intentos: jugador.stats.pases.intentos,
          completados: jugador.stats.pases.completados,
          touchdowns: jugador.stats.pases.touchdowns,
          intercepciones: jugador.stats.pases.intercepciones,
          conversiones: jugador.stats.pases.conversiones, // 🔥 NUEVO
          rating: jugador.qbRating,
          porcentajeComplecion: jugador.stats.pases.intentos > 0 ? 
            Math.round((jugador.stats.pases.completados / jugador.stats.pases.intentos) * 100) : 0
        } : null
      }));

      clasificacionGeneral[tipo] = {
        lideres: lideresFormateados,
        totalJugadoresConStats: jugadoresArray.length,
        tipo: tipo
      };

      console.log(`✅ ${tipo}: ${lideresFormateados.length} líderes, total con stats: ${jugadoresArray.length}`);
    });

    console.log('📤 Enviando clasificación general Top 5');
    console.log(`✅ [${new Date().toISOString()}] FIN - Clasificación general Top 5 obtenida\n`);

    res.json({
      mensaje: 'Clasificación general Top 5 obtenida correctamente',
      clasificacionGeneral,
      categoria,
      torneo: {
        _id: torneo._id,
        nombre: torneo.nombre
      },
      tiposDisponibles: tiposEstadisticas,
      fechaConsulta: new Date().toISOString()
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al obtener clasificación general:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Clasificación general fallida\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al obtener clasificación general', 
      error: error.message 
    });
  }
};

// 🔍 DEBUG JUGADOR TEMPORADA - FUNCIÓN NUEVA DESDE CERO
exports.debugJugadorTemporada = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🔍 [${timestamp}] INICIO - Debug jugador temporada`);
  console.log('🎯 Torneo ID:', req.params.torneoId);
  console.log('🏈 Equipo ID:', req.params.equipoId);
  console.log('👤 Número de jugador:', req.params.numeroJugador);

  try {
    const { torneoId, equipoId, numeroJugador } = req.params;

    // 🔍 1. VALIDACIONES BÁSICAS
    console.log('🔍 Validando parámetros...');
    if (!mongoose.Types.ObjectId.isValid(torneoId) || 
        !mongoose.Types.ObjectId.isValid(equipoId) || 
        !numeroJugador) {
      console.log('❌ ERROR: Parámetros inválidos');
      return res.status(400).json({ 
        mensaje: 'Parámetros inválidos. Se requiere torneoId, equipoId y numeroJugador válidos.' 
      });
    }

    // 🔍 2. OBTENER DATOS BÁSICOS
    console.log('🔍 Obteniendo datos básicos...');
    const [equipo, torneo] = await Promise.all([
      Equipo.findById(equipoId).select('nombre imagen categoria'),
      Torneo.findById(torneoId).select('nombre')
    ]);

    if (!equipo || !torneo) {
      console.log('❌ ERROR: Equipo o torneo no encontrado');
      return res.status(404).json({ mensaje: 'Equipo o torneo no encontrado' });
    }

    // 🔍 3. BUSCAR JUGADOR POR NÚMERO EN EL EQUIPO
    console.log(`🔍 Buscando jugador #${numeroJugador} en equipo ${equipo.nombre}...`);
    const jugador = await Usuario.findOne({
      'equipos': {
        $elemMatch: {
          'equipo': equipoId,
          'numero': parseInt(numeroJugador)
        }
      }
    }).select('nombre imagen equipos');

    if (!jugador) {
      console.log('❌ ERROR: Jugador no encontrado');
      return res.status(404).json({ 
        mensaje: `No se encontró jugador con número ${numeroJugador} en el equipo ${equipo.nombre}` 
      });
    }

    const jugadorId = jugador._id.toString();
    console.log(`✅ Jugador encontrado: ${jugador.nombre} (#${numeroJugador})`);

    // 🔍 4. OBTENER TODOS LOS PARTIDOS DEL EQUIPO EN EL TORNEO
    console.log('🔍 Obteniendo partidos del equipo...');
    const todosLosPartidos = await Partido.find({
      torneo: torneoId,
      categoria: equipo.categoria,
      $or: [
        { equipoLocal: equipoId },
        { equipoVisitante: equipoId }
      ]
    })
    .populate('equipoLocal equipoVisitante', 'nombre imagen')
    .populate({
      path: 'jugadas.jugadorPrincipal jugadas.jugadorSecundario jugadas.jugadorTouchdown',
      select: 'nombre imagen'
    })
    .sort({ fechaHora: 1 });

    console.log(`📊 Total partidos del equipo: ${todosLosPartidos.length}`);

    // Separar por estado
    const partidosFinalizados = todosLosPartidos.filter(p => p.estado === 'finalizado');
    const partidosProgramados = todosLosPartidos.filter(p => p.estado === 'programado');
    const partidosEnCurso = todosLosPartidos.filter(p => p.estado === 'en_curso');

    console.log(`  📋 Finalizados: ${partidosFinalizados.length}`);
    console.log(`  📋 Programados: ${partidosProgramados.length}`);
    console.log(`  📋 En curso: ${partidosEnCurso.length}`);

    // 🔍 5. INICIALIZAR ESTADÍSTICAS DEL JUGADOR
    console.log(`🔍 Inicializando estadísticas para ${jugador.nombre}...`);
    const estadisticasJugador = {
      pases: { intentos: 0, completados: 0, touchdowns: 0, intercepciones: 0 },
      recepciones: { 
        total: 0, 
        touchdowns: 0, 
        conversiones1pt: 0, 
        conversiones2pt: 0, 
        normales: 0 
      },
      puntos: 0,
      tackleos: 0,
      intercepciones: 0,
      sacks: 0,
      qbRating: 0
    };

    // 🔍 6. PROCESAR PARTIDOS FINALIZADOS Y BUSCAR JUGADAS DEL JUGADOR
    console.log('🔍 Procesando partidos finalizados...');
    const partidosConJugadas = [];
    const todasLasJugadas = [];
    let totalJugadasInvolucrado = 0;

    partidosFinalizados.forEach((partido, partidoIndex) => {
      const esLocal = partido.equipoLocal._id.toString() === equipoId.toString();
      const equipoRival = esLocal ? partido.equipoVisitante : partido.equipoLocal;

      const partidoInfo = {
        numero: partidoIndex + 1,
        _id: partido._id,
        fecha: partido.fechaHora.toISOString().split('T')[0],
        equipoLocal: partido.equipoLocal.nombre,
        equipoVisitante: partido.equipoVisitante.nombre,
        marcadorFinal: `${partido.marcador.local} - ${partido.marcador.visitante}`,
        esLocal: esLocal,
        rival: equipoRival.nombre,
        resultado: esLocal 
          ? (partido.marcador.local > partido.marcador.visitante ? 'Victoria' : 
             partido.marcador.local < partido.marcador.visitante ? 'Derrota' : 'Empate')
          : (partido.marcador.visitante > partido.marcador.local ? 'Victoria' : 
             partido.marcador.visitante < partido.marcador.local ? 'Derrota' : 'Empate'),
        jugadasDelJugador: 0,
        puntosAnotadosEnPartido: 0
      };

      // 🔍 7. PROCESAR JUGADAS DEL PARTIDO (LÓGICA IDÉNTICA A obtenerLideresEstadisticas)
      if (partido.jugadas && partido.jugadas.length > 0) {
        partido.jugadas.forEach((jugada, jugadaIndex) => {
          // Verificar si el jugador está involucrado
          const esPrincipal = jugada.jugadorPrincipal?._id?.toString() === jugadorId;
          const esSecundario = jugada.jugadorSecundario?._id?.toString() === jugadorId;
          const esJugadorTouchdown = jugada.jugadorTouchdown?._id?.toString() === jugadorId;

          if (esPrincipal || esSecundario || esJugadorTouchdown) {
            const jugadaDetalle = {
              partidoNumero: partidoIndex + 1,
              partidoId: partido._id,
              jugadaId: jugada._id,
              numeroJugada: jugadaIndex + 1,
              tipo: jugada.tipoJugada,
              descripcion: jugada.descripcion,
              equipoEnPosesion: jugada.equipoEnPosesion?.toString(),
              rival: equipoRival.nombre,
              fecha: partido.fechaHora.toISOString().split('T')[0],
              rol: esPrincipal ? 'Principal' : esSecundario ? 'Secundario' : 'JugadorTouchdown',
              estadisticasModificadas: [],
              puntosObtenidos: 0
            };

            totalJugadasInvolucrado++;
            partidoInfo.jugadasDelJugador++;

            // 🔥 LÓGICA EXACTA DE obtenerLideresEstadisticas
            switch (jugada.tipoJugada) {
              case 'pase_completo':
                if (esPrincipal) {
                  estadisticasJugador.pases.intentos++;
                  estadisticasJugador.pases.completados++;
                  jugadaDetalle.estadisticasModificadas.push('pases.intentos++', 'pases.completados++');
                  
                  if (jugada.resultado?.touchdown) {
                    estadisticasJugador.pases.touchdowns++;
                    jugadaDetalle.estadisticasModificadas.push('pases.touchdowns++');
                  }
                } else if (esSecundario) {
                  estadisticasJugador.recepciones.total++;
                  jugadaDetalle.estadisticasModificadas.push('recepciones.total++');
                  
                  if (jugada.resultado?.touchdown) {
                    estadisticasJugador.recepciones.touchdowns++;
                    estadisticasJugador.puntos += 6;
                    jugadaDetalle.puntosObtenidos = 6;
                    partidoInfo.puntosAnotadosEnPartido += 6;
                    jugadaDetalle.estadisticasModificadas.push('recepciones.touchdowns++', 'puntos += 6');
                  } else {
                    estadisticasJugador.recepciones.normales++;
                    jugadaDetalle.estadisticasModificadas.push('recepciones.normales++');
                  }
                } else if (esJugadorTouchdown && jugada.resultado?.touchdown) {
                  estadisticasJugador.puntos += 6;
                  jugadaDetalle.puntosObtenidos = 6;
                  partidoInfo.puntosAnotadosEnPartido += 6;
                  jugadaDetalle.estadisticasModificadas.push('puntos += 6 (JugadorTouchdown)');
                }
                break;

              case 'corrida':
                if (esPrincipal) {
                  if (jugada.resultado?.touchdown) {
                    estadisticasJugador.puntos += 6;
                    jugadaDetalle.puntosObtenidos = 6;
                    partidoInfo.puntosAnotadosEnPartido += 6;
                    jugadaDetalle.estadisticasModificadas.push('puntos += 6 (corrida TD)');
                  }
                } else if (esSecundario) {
                  estadisticasJugador.tackleos++;
                  jugadaDetalle.estadisticasModificadas.push('tackleos++');
                }
                break;

              case 'intercepcion':
                if (esPrincipal) {
                  estadisticasJugador.intercepciones++;
                  jugadaDetalle.estadisticasModificadas.push('intercepciones++');
                  
                  if (jugada.resultado?.touchdown) {
                    estadisticasJugador.puntos += 6;
                    jugadaDetalle.puntosObtenidos = 6;
                    partidoInfo.puntosAnotadosEnPartido += 6;
                    jugadaDetalle.estadisticasModificadas.push('puntos += 6 (pick-6)');
                  }
                } else if (esSecundario) {
                  estadisticasJugador.pases.intentos++;
                  estadisticasJugador.pases.intercepciones++;
                  jugadaDetalle.estadisticasModificadas.push('pases.intentos++', 'pases.intercepciones++');
                }
                break;

              case 'tackleo':
                if (esPrincipal) {
                  estadisticasJugador.tackleos++;
                  jugadaDetalle.estadisticasModificadas.push('tackleos++');
                }
                break;

              case 'sack':
                if (esPrincipal) {
                  estadisticasJugador.sacks++;
                  jugadaDetalle.estadisticasModificadas.push('sacks++');
                }
                break;

              case 'pase_incompleto':
                if (esPrincipal) {
                  estadisticasJugador.pases.intentos++;
                  jugadaDetalle.estadisticasModificadas.push('pases.intentos++');
                }
                break;

              case 'conversion_1pt':
              case 'conversion_2pt':
                const puntosConversion = jugada.tipoJugada === 'conversion_1pt' ? 1 : 2;
                if (esPrincipal) {
                  estadisticasJugador.pases.intentos++;
                  estadisticasJugador.pases.completados++;
                  estadisticasJugador.pases.touchdowns++;
                  jugadaDetalle.estadisticasModificadas.push(
                    'pases.intentos++', 'pases.completados++', 'pases.touchdowns++'
                  );
                } else if (esSecundario) {
                  estadisticasJugador.recepciones.total++;
                  estadisticasJugador.puntos += puntosConversion;
                  jugadaDetalle.puntosObtenidos = puntosConversion;
                  partidoInfo.puntosAnotadosEnPartido += puntosConversion;
                  
                  // 🔥 NUEVO: Clasificar tipo de conversión
                  if (jugada.tipoJugada === 'conversion_1pt') {
                    estadisticasJugador.recepciones.conversiones1pt++;
                    jugadaDetalle.estadisticasModificadas.push(
                      'recepciones.total++', 'recepciones.conversiones1pt++', 'puntos += 1'
                    );
                  } else {
                    estadisticasJugador.recepciones.conversiones2pt++;
                    jugadaDetalle.estadisticasModificadas.push(
                      'recepciones.total++', 'recepciones.conversiones2pt++', 'puntos += 2'
                    );
                  }
                } else if (esJugadorTouchdown) {
                  estadisticasJugador.puntos += puntosConversion;
                  jugadaDetalle.puntosObtenidos = puntosConversion;
                  partidoInfo.puntosAnotadosEnPartido += puntosConversion;
                  jugadaDetalle.estadisticasModificadas.push(`puntos += ${puntosConversion} (JugadorTouchdown)`);
                }
                break;

              case 'safety':
                if (esPrincipal) {
                  estadisticasJugador.puntos += 2;
                  jugadaDetalle.puntosObtenidos = 2;
                  partidoInfo.puntosAnotadosEnPartido += 2;
                  jugadaDetalle.estadisticasModificadas.push('puntos += 2 (safety)');
                }
                break;
            }

            // 🔥 PROCESAR jugadorTouchdown si existe
            if (jugada.jugadorTouchdown && jugada.resultado?.touchdown && esJugadorTouchdown) {
              if (!jugadaDetalle.puntosObtenidos) { // Evitar doble conteo
                estadisticasJugador.puntos += 6;
                jugadaDetalle.puntosObtenidos = 6;
                partidoInfo.puntosAnotadosEnPartido += 6;
                jugadaDetalle.estadisticasModificadas.push('puntos += 6 (JugadorTouchdown específico)');
              }
            }

            todasLasJugadas.push(jugadaDetalle);
          }
        });
      }

      // Solo agregar partidos donde el jugador tuvo jugadas
      if (partidoInfo.jugadasDelJugador > 0) {
        partidosConJugadas.push(partidoInfo);
      }
    });

    // 🔍 8. CALCULAR QB RATING
    console.log('🔍 Calculando QB Rating...');
    const { intentos, completados, touchdowns, intercepciones } = estadisticasJugador.pases;
    estadisticasJugador.qbRating = calcularQBRating(completados, intentos, touchdowns, intercepciones);

    // 🔍 9. CALCULAR MÉTRICAS ADICIONALES
    const porcentajeComplecion = intentos > 0 ? Math.round((completados / intentos) * 100) : 0;
    const promedioPuntosPorPartido = partidosConJugadas.length > 0 ? 
      Math.round((estadisticasJugador.puntos / partidosConJugadas.length) * 10) / 10 : 0;

    // 🔍 10. PREPARAR RESPUESTA DE DEBUG
    console.log('🔍 Preparando respuesta de debug...');
    const respuestaDebug = {
      mensaje: 'Debug completo del jugador en la temporada',
      
      // 👤 INFORMACIÓN DEL JUGADOR
      informacionJugador: {
        _id: jugador._id,
        nombre: jugador.nombre,
        numero: parseInt(numeroJugador),
        imagen: getImageUrlServer(jugador.imagen, req),
        equipo: {
          _id: equipo._id,
          nombre: equipo.nombre,
          categoria: equipo.categoria,
          imagen: getImageUrlServer(equipo.imagen, req)
        }
      },

      // 🏆 INFORMACIÓN DEL TORNEO
      informacionTorneo: {
        _id: torneo._id,
        nombre: torneo.nombre,
        categoria: equipo.categoria
      },

      // 📊 RESUMEN DE LA TEMPORADA
      resumenTemporada: {
        totalPartidosEquipo: todosLosPartidos.length,
        partidosFinalizados: partidosFinalizados.length,
        partidosProgramados: partidosProgramados.length,
        partidosEnCurso: partidosEnCurso.length,
        partidosConJugadasDelJugador: partidosConJugadas.length,
        totalJugadasInvolucrado: totalJugadasInvolucrado,
        totalPuntosAnotados: estadisticasJugador.puntos,
        promedioPuntosPorPartido: promedioPuntosPorPartido
      },

      // 📈 ESTADÍSTICAS CALCULADAS
      estadisticasCalculadas: {
        pases: {
          intentos: estadisticasJugador.pases.intentos,
          completados: estadisticasJugador.pases.completados,
          incompletos: estadisticasJugador.pases.intentos - estadisticasJugador.pases.completados,
          touchdowns: estadisticasJugador.pases.touchdowns,
          intercepciones: estadisticasJugador.pases.intercepciones,
          porcentajeComplecion: porcentajeComplecion
        },
        recepciones: {
          total: estadisticasJugador.recepciones.total,
          touchdowns: estadisticasJugador.recepciones.touchdowns,
          conversiones1pt: estadisticasJugador.recepciones.conversiones1pt,
          conversiones2pt: estadisticasJugador.recepciones.conversiones2pt,
          normales: estadisticasJugador.recepciones.normales,
          // 🔥 NUEVOS: Porcentajes útiles para análisis
          porcentajeTouchdowns: estadisticasJugador.recepciones.total > 0 ? 
            Math.round((estadisticasJugador.recepciones.touchdowns / estadisticasJugador.recepciones.total) * 100) : 0,
          porcentajeConversiones: estadisticasJugador.recepciones.total > 0 ? 
            Math.round(((estadisticasJugador.recepciones.conversiones1pt + estadisticasJugador.recepciones.conversiones2pt) / estadisticasJugador.recepciones.total) * 100) : 0
        },
        puntos: estadisticasJugador.puntos,
        tackleos: estadisticasJugador.tackleos,
        intercepciones: estadisticasJugador.intercepciones,
        sacks: estadisticasJugador.sacks,
        qbRating: estadisticasJugador.qbRating
      },

      // 🏟️ PARTIDOS CON JUGADAS DEL JUGADOR
      partidosConJugadas: partidosConJugadas,

      // 📝 COMPILADO DE TODAS LAS JUGADAS
      compiladoJugadas: todasLasJugadas.sort((a, b) => 
        a.partidoNumero - b.partidoNumero || a.numeroJugada - b.numeroJugada
      ),

      // 🕒 METADATOS
      metadatos: {
        fechaConsulta: new Date().toISOString(),
        tiempoRespuesta: Date.now() - new Date(timestamp).getTime()
      }
    };

    console.log('📤 Enviando respuesta de debug...');
    console.log(`  👤 Jugador: ${jugador.nombre} (#${numeroJugador})`);
    console.log(`  📊 Partidos con jugadas: ${partidosConJugadas.length}/${partidosFinalizados.length}`);
    console.log(`  🎮 Total jugadas: ${totalJugadasInvolucrado}`);
    console.log(`  ⚡ Puntos totales: ${estadisticasJugador.puntos}`);
    console.log(`  🏈 QB Rating: ${estadisticasJugador.qbRating}`);
    console.log(`  📡 Recepciones: ${estadisticasJugador.recepciones.total} (${estadisticasJugador.recepciones.touchdowns} TDs, ${estadisticasJugador.recepciones.conversiones1pt + estadisticasJugador.recepciones.conversiones2pt} conversiones, ${estadisticasJugador.recepciones.normales} normales)`);
    console.log(`✅ [${new Date().toISOString()}] FIN - Debug completado\n`);

    res.json(respuestaDebug);

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR en debug jugador temporada:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Debug fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al generar debug del jugador en la temporada', 
      error: error.message 
    });
  }
};

// 🏆 LÍDERES DE ESTADÍSTICAS POR PARTIDO - LÓGICA CORREGIDA PARA equipoEnPosesion
exports.obtenerLideresPartido = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🏆 [${timestamp}] INICIO - Obtener líderes de partido específico`);
  console.log('⚽ Partido ID:', req.params.partidoId);

  try {
    const { partidoId } = req.params;

    console.log('🔍 Buscando partido...');
    const partido = await Partido.findById(partidoId)
      .populate('equipoLocal equipoVisitante', 'nombre imagen')
      .populate('jugadas.jugadorPrincipal jugadas.jugadorSecundario jugadas.jugadorTouchdown', 'nombre imagen');

    if (!partido) {
      console.log('❌ ERROR: Partido no encontrado');
      return res.status(404).json({ mensaje: 'Partido no encontrado' });
    }

    console.log(`✅ Partido encontrado: ${partido.equipoLocal.nombre} vs ${partido.equipoVisitante.nombre}`);

    if (!partido.jugadas || partido.jugadas.length === 0) {
      console.log('⚠️ ADVERTENCIA: Partido sin jugadas registradas');
      return res.json({
        mensaje: 'Partido sin jugadas registradas',
        partido: {
          _id: partido._id,
          equipoLocal: {
            _id: partido.equipoLocal._id,
            nombre: partido.equipoLocal.nombre,
            imagen: getImageUrlServer(partido.equipoLocal.imagen, req)
          },
          equipoVisitante: {
            _id: partido.equipoVisitante._id,
            nombre: partido.equipoVisitante.nombre,
            imagen: getImageUrlServer(partido.equipoVisitante.imagen, req)
          }
        },
        lideres: {
          puntos: [],
          qbrating: [],
          recepciones: [],
          tackleos: [],
          intercepciones: []
        }
      });
    }

    console.log(`📊 Procesando ${partido.jugadas.length} jugadas del partido...`);

    // 🔥 USAR LA MISMA LÓGICA DE obtenerEstadisticasGenerales PERO CON ENFOQUE CORREGIDO
    const tiposEstadisticas = ['qbrating', 'puntos', 'recepciones', 'tackleos', 'intercepciones', 'sacks'];
    const partidos = [partido]; // Array de un solo partido
    const estadisticasJugadores = new Map();

    // 🔥 LÓGICA CORREGIDA: equipoEnPosesion = equipo que EJECUTÓ la jugada
    partidos.forEach(partido => {
      if (!partido.jugadas || partido.jugadas.length === 0) return;

      partido.jugadas.forEach(jugada => {
        console.log(`📝 Procesando jugada: ${jugada.tipoJugada}, equipoEnPosesion: ${jugada.equipoEnPosesion}`);
        
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
                pases: { intentos: 0, completados: 0, touchdowns: 0, intercepciones: 0 },
                recepciones: { total: 0, touchdowns: 0 },
                tackleos: { total: 0 },
                intercepciones: { total: 0 },
                sacks: { total: 0 },
                puntos: { total: 0, touchdowns: 0 }
              }
            });
          }

          const playerStats = estadisticasJugadores.get(jugadorId);
          const esPrincipal = rol === 'principal';
          const esSecundario = rol === 'secundario';
          const esJugadorTouchdown = rol === 'touchdown';

          // 🔥 LÓGICA CORREGIDA CON NUEVO ENFOQUE
          switch (jugada.tipoJugada) {
            case 'pase_completo':
              // equipoEnPosesion = equipo ofensivo que ejecutó el pase
              if (esPrincipal) {
                // Quarterback que lanzó
                playerStats.stats.pases.intentos++;
                playerStats.stats.pases.completados++;
                if (jugada.resultado?.touchdown) {
                  playerStats.stats.pases.touchdowns++;
                }
                console.log(`🏈 QB: ${jugador.nombre} - pase completo`);
              } else if (esSecundario) {
                // Receptor que recibió
                playerStats.stats.recepciones.total++;
                if (jugada.resultado?.touchdown) {
                  playerStats.stats.recepciones.touchdowns++;
                  playerStats.stats.puntos.total += 6;
                  playerStats.stats.puntos.touchdowns++;
                }
                console.log(`📡 Receptor: ${jugador.nombre} - recepción`);
              } else if (esJugadorTouchdown && jugada.resultado?.touchdown) {
                playerStats.stats.puntos.total += 6;
                playerStats.stats.puntos.touchdowns++;
                console.log(`🏆 TD: ${jugador.nombre} - anotó TD`);
              }
              break;

            case 'pase_incompleto':
              // equipoEnPosesion = equipo ofensivo que ejecutó el pase
              if (esPrincipal) {
                playerStats.stats.pases.intentos++;
                console.log(`🏈 QB: ${jugador.nombre} - pase incompleto`);
              }
              break;

            case 'intercepcion':
              if (esPrincipal) {
                playerStats.stats.intercepciones.total++;
                if (jugada.resultado?.touchdown) {
                  playerStats.stats.puntos.total += 6;
                  playerStats.stats.puntos.touchdowns++;
                }
              } else if (esSecundario) {
                playerStats.stats.pases.intentos++;
                playerStats.stats.pases.intercepciones++;
              }
              break;

            case 'tackleo':
              // 🔥 CAMBIO CLAVE: equipoEnPosesion = equipo DEFENSIVO que tackleó
              if (esPrincipal) {
                // Jugador que tackleó (del equipo defensivo)
                playerStats.stats.tackleos.total++;
                console.log(`🛡️ Tackleador: ${jugador.nombre} - tackleo`);
              }
              break;

            case 'sack':
              // 🔥 CAMBIO CLAVE: equipoEnPosesion = equipo DEFENSIVO que hizo sack
              if (esPrincipal) {
                // Jugador que hizo sack (del equipo defensivo)
                playerStats.stats.sacks.total++;
                console.log(`🛡️ Sacker: ${jugador.nombre} - sack`);
              }
              break;

            case 'recepcion':
              // equipoEnPosesion = equipo ofensivo que ejecutó la recepción
              if (esPrincipal) {
                playerStats.stats.recepciones.total++;
                if (jugada.resultado?.touchdown) {
                  playerStats.stats.recepciones.touchdowns++;
                  playerStats.stats.puntos.total += 6;
                  playerStats.stats.puntos.touchdowns++;
                }
                console.log(`📡 Receptor: ${jugador.nombre} - recepción directa`);
              }
              break;

            case 'conversion_1pt':
              // equipoEnPosesion = equipo que ejecutó la conversión
              if (esPrincipal) {
                // QB: Solo stats de pase, NO puntos
                playerStats.stats.pases.intentos++;
                playerStats.stats.pases.completados++;
              } else if (esSecundario) {
                // Receptor: Recepción + PUNTOS
                playerStats.stats.recepciones.total++;
                playerStats.stats.puntos.total += 1;
              } else if (esJugadorTouchdown) {
                playerStats.stats.puntos.total += 1;
              }
              break;

            case 'conversion_2pt':
              // equipoEnPosesion = equipo que ejecutó la conversión
              if (esPrincipal) {
                // QB: Solo stats de pase, NO puntos
                playerStats.stats.pases.intentos++;
                playerStats.stats.pases.completados++;
              } else if (esSecundario) {
                // Receptor: Recepción + PUNTOS
                playerStats.stats.recepciones.total++;
                playerStats.stats.puntos.total += 2;
              } else if (esJugadorTouchdown) {
                playerStats.stats.puntos.total += 2;
              }
              break;

            case 'safety':
              // equipoEnPosesion = equipo que forzó el safety (defensivo)
              if (esPrincipal) {
                playerStats.stats.puntos.total += 2;
                console.log(`🛡️ Safety: ${jugador.nombre} - forzó safety`);
              }
              break;

            case 'corrida':
              if (esPrincipal) {
                // Jugador principal = Corredor
                if (jugada.resultado?.touchdown) {
                  playerStats.stats.puntos.total += 6;
                  playerStats.stats.puntos.touchdowns++;
                }
                console.log(`🏃 Corredor: ${jugador.nombre} - corrida`);
              } else if (esSecundario) {
                // Jugador secundario = Tackleador
                playerStats.stats.tackleos.total++;
                console.log(`🛡️ Tackleador: ${jugador.nombre} - tackleo en corrida`);
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
    console.log('\n🏈 === CALCULANDO QB RATING ===');
    estadisticasJugadores.forEach((stats, jugadorId) => {
      const { intentos, completados, touchdowns, intercepciones } = stats.stats.pases;
      stats.qbRating = calcularQBRating(completados, intentos, touchdowns, intercepciones);
      
      if (intentos > 0) {
        console.log(`🏈 ${stats.jugador.nombre}: ${completados}/${intentos}, ${touchdowns} TDs, ${intercepciones} INTs → Rating: ${stats.qbRating}`);
      }

      console.log(`🏈 QB RATING DEBUG - ${stats.jugador.nombre}:`);
      console.log(`  Intentos: ${stats.stats.pases.intentos}`);
      console.log(`  Completados: ${stats.stats.pases.completados}`);
      console.log(`  TDs: ${stats.stats.pases.touchdowns}`);
      console.log(`  INTs: ${stats.stats.pases.intercepciones}`);
      console.log(`  Rating calculado: ${stats.qbRating}`);
    });

    // 🔥 CORREGIR EQUIPOS DESPUÉS DEL PROCESAMIENTO
    console.log('🔄 Corrigiendo equipos de jugadores...');
    const jugadoresIds = Array.from(estadisticasJugadores.keys());
    const equiposIds = [partido.equipoLocal._id.toString(), partido.equipoVisitante._id.toString()];

    const usuarios = await Usuario.find({
      '_id': { $in: jugadoresIds },
      'equipos.equipo': { $in: equiposIds }
    }).select('nombre imagen equipos');

    const equiposMap = new Map();
    equiposMap.set(partido.equipoLocal._id.toString(), partido.equipoLocal);
    equiposMap.set(partido.equipoVisitante._id.toString(), partido.equipoVisitante);

    usuarios.forEach(usuario => {
      if (estadisticasJugadores.has(usuario._id.toString())) {
        const stats = estadisticasJugadores.get(usuario._id.toString());
        
        const equipoData = usuario.equipos.find(e => {
          if (!e.equipo) {
            console.warn(`⚠️  ADVERTENCIA: El jugador '${usuario.nombre}' (ID: ${usuario._id}) tiene una referencia de equipo NULL y podría causar problemas`);
            return false;
          }
          return equiposIds.includes(e.equipo.toString());
        });
        
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

    console.log('✅ Equipos corregidos');

    // 🔥 GENERAR CLASIFICACIÓN PARA CADA TIPO
    const clasificacionGeneral = {};
    tiposEstadisticas.forEach(tipo => {
      console.log(`\n🏆 === PROCESANDO ${tipo.toUpperCase()} ===`);
      
      const jugadoresArray = Array.from(estadisticasJugadores.values()).filter(jugador => {
        if (tipo === 'qbrating') {
          return jugador.stats.pases.intentos >= 1;
        }

        // 🔥 CALCULAR QB RATING PARA CADA JUGADOR - CON DEBUG COMPLETO
        console.log('\n🏈 === CALCULANDO QB RATING CON DEBUG DETALLADO ===');
        estadisticasJugadores.forEach((stats, jugadorId) => {
          const { intentos, completados, touchdowns, intercepciones } = stats.stats.pases;
          
          // 🎯 DEBUG DETALLADO ANTES DEL CÁLCULO
          if (intentos > 0) {
            console.log(`\n🏈 === DEBUG QB RATING: ${stats.jugador.nombre} ===`);
            console.log(`jugador: "${stats.jugador.nombre}"`);
            console.log(`intentos: ${intentos}`);
            console.log(`completos: ${completados}`);
            console.log(`touchdowns: ${touchdowns}`);
            console.log(`intercepciones: ${intercepciones}`);
            
            // 🔍 MOSTRAR LA FÓRMULA PASO A PASO
            if (intentos === 0) {
              console.log(`Rating: 0 (sin intentos)`);
              stats.qbRating = 0;
            } else {
              const FE = completados / intentos;
              const PC_FE = completados * FE;
              const rating = PC_FE + (intercepciones * -2) + (touchdowns * 3);
              
              console.log(`📊 Cálculo paso a paso:`);
              console.log(`   FE (Eficiencia) = ${completados}/${intentos} = ${FE.toFixed(4)}`);
              console.log(`   PC_FE = ${completados} * ${FE.toFixed(4)} = ${PC_FE.toFixed(4)}`);
              console.log(`   Penalización INTs = ${intercepciones} * -2 = ${intercepciones * -2}`);
              console.log(`   Bonus TDs = ${touchdowns} * 3 = ${touchdowns * 3}`);
              console.log(`   Rating = ${PC_FE.toFixed(4)} + (${intercepciones * -2}) + (${touchdowns * 3}) = ${rating.toFixed(4)}`);
              console.log(`   Rating final = ${Math.round(rating * 10) / 10}`);
              
              stats.qbRating = Math.round(rating * 10) / 10;
            }
            
            console.log(`qbRating final: ${stats.qbRating}`);
            console.log(`=== FIN DEBUG: ${stats.jugador.nombre} ===\n`);
          } else {
            stats.qbRating = 0;
          }
        });
        
        const stat = tipo === 'puntos' ? jugador.stats.puntos.total :
                    tipo === 'tackleos' ? jugador.stats.tackleos.total :
                    tipo === 'intercepciones' ? jugador.stats.intercepciones.total :
                    tipo === 'sacks' ? jugador.stats.sacks.total :
                    tipo === 'recepciones' ? jugador.stats.recepciones.total : 0;
        return stat > 0;
      });

      console.log(`📊 Jugadores con ${tipo}: ${jugadoresArray.length}`);

      const top3Jugadores = jugadoresArray
        .sort((a, b) => {
          if (tipo === 'qbrating') {
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
        .slice(0, 3);

      const lideresFormateados = top3Jugadores.map((jugador, index) => ({
        posicion: index + 1,
        jugador: {
          _id: jugador.jugador._id,
          nombre: jugador.jugador.nombre,
          numero: jugador.jugador.numero,
          imagen: getImageUrlServer(jugador.jugador.imagen, req)
        },
        equipo: {
          _id: jugador.equipo._id,
          nombre: jugador.equipo.nombre,
          imagen: getImageUrlServer(jugador.equipo.imagen, req)
        },
        valor: tipo === 'qbrating' ? jugador.qbRating :
              tipo === 'puntos' ? jugador.stats.puntos.total :
              tipo === 'tackleos' ? jugador.stats.tackleos.total :
              tipo === 'intercepciones' ? jugador.stats.intercepciones.total :
              tipo === 'sacks' ? jugador.stats.sacks.total :
              tipo === 'recepciones' ? jugador.stats.recepciones.total : 0,
        estadisticasCompletas: jugador.stats,
        qbRatingData: tipo === 'qbrating' ? {
          intentos: jugador.stats.pases.intentos,
          completados: jugador.stats.pases.completados,
          touchdowns: jugador.stats.pases.touchdowns,
          intercepciones: jugador.stats.pases.intercepciones,
          rating: jugador.qbRating,
          porcentajeComplecion: jugador.stats.pases.intentos > 0 ? 
            Math.round((jugador.stats.pases.completados / jugador.stats.pases.intentos) * 100) : 0
        } : null
      }));

      clasificacionGeneral[tipo] = lideresFormateados;

      console.log(`🏆 Top 3 ${tipo}:`);
      lideresFormateados.forEach((lider, index) => {
        console.log(`  ${index + 1}. ${lider.jugador.nombre} (#${lider.jugador.numero}) - ${lider.valor} ${tipo}`);
      });
    });

    console.log('📤 Enviando líderes del partido');
    console.log(`✅ [${timestamp}] FIN - Líderes del partido obtenidos\n`);

    res.json({
      mensaje: 'Líderes del partido obtenidos exitosamente',
      partido: {
        _id: partido._id,
        equipoLocal: {
          _id: partido.equipoLocal._id,
          nombre: partido.equipoLocal.nombre,
          imagen: getImageUrlServer(partido.equipoLocal.imagen, req)
        },
        equipoVisitante: {
          _id: partido.equipoVisitante._id,
          nombre: partido.equipoVisitante.nombre,
          imagen: getImageUrlServer(partido.equipoVisitante.imagen, req)
        },
        torneo: partido.torneo,
        marcador: partido.marcador,
        estado: partido.estado,
        fecha: partido.fechaHora
      },
      lideres: clasificacionGeneral,
      estadisticas: {
        totalJugadas: partido.jugadas.length,
        jugadoresConEstadisticas: estadisticasJugadores.size,
        fechaConsulta: new Date().toISOString()
      }
    });

  } catch (error) {
    console.log(`❌ [${timestamp}] ERROR al obtener líderes del partido:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${timestamp}] FIN - Líderes del partido fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al obtener líderes del partido', 
      error: error.message 
    });
  }
};

// 🔧 FUNCIONES HELPER INTERNAS

// Helper para obtener posición de un equipo específico
const obtenerPosicionEquipo = async (equipoId, torneoId, categoria, req) => {
  // Reutilizar lógica de tabla de posiciones pero filtrar solo este equipo
  const equipo = await Equipo.findById(equipoId);
  
  const partidos = await Partido.find({
    torneo: torneoId,
    categoria: categoria,
    estado: 'finalizado',
    $or: [
      { equipoLocal: equipoId },
      { equipoVisitante: equipoId }
    ]
  });

  let victorias = 0, derrotas = 0, puntosFavor = 0, puntosContra = 0;

  partidos.forEach(partido => {
    const esLocal = partido.equipoLocal.toString() === equipoId.toString();
    const puntosEquipo = esLocal ? partido.marcador.local : partido.marcador.visitante;
    const puntosRival = esLocal ? partido.marcador.visitante : partido.marcador.local;

    puntosFavor += puntosEquipo;
    puntosContra += puntosRival;

    if (puntosEquipo > puntosRival) victorias++;
    else if (puntosEquipo < puntosRival) derrotas++;
  });

  const partidosJugados = victorias + derrotas;
  
  return {
    victorias,
    derrotas,
    partidosJugados,
    puntosFavor,
    puntosContra,
    diferenciaPuntos: puntosFavor - puntosContra,
    promedioPuntos: partidosJugados > 0 ? Math.round((puntosFavor / partidosJugados) * 10) / 10 : 0,
    porcentajeVictorias: partidosJugados > 0 ? Math.round((victorias / partidosJugados) * 100) : 0
  };
};

// 🔢 HELPER: CALCULAR QB RATING (IGUAL QUE EN obtenerEstadisticasGenerales)

// 🏈 FUNCIÓN CALCULAR QB RATING MEJORADA - CON CONVERSIONES
const calcularQBRating = (completados, intentos, touchdowns, intercepciones) => {
  if (intentos === 0) return 0;
  const FE = completados / intentos;
  const PC_FE = completados * FE;
  const rating = PC_FE + (intercepciones * -2) + (touchdowns * 3);
  return Math.round(rating * 10) / 10;
};

// Helper para obtener tendencia simplificada
const obtenerTendenciaEquipo = async (equipoId, torneoId, categoria, req) => {
  const partidos = await Partido.find({
    torneo: torneoId,
    categoria: categoria,
    estado: 'finalizado',
    $or: [
      { equipoLocal: equipoId },
      { equipoVisitante: equipoId }
    ]
  }).sort({ fechaHora: 1 });

  return partidos.map((partido, index) => {
    const esLocal = partido.equipoLocal.toString() === equipoId.toString();
    const puntosEquipo = esLocal ? partido.marcador.local : partido.marcador.visitante;
    const puntosRival = esLocal ? partido.marcador.visitante : partido.marcador.local;
    
    return {
      jornada: index + 1,
      fecha: partido.fechaHora.toISOString().split('T')[0],
      puntos: puntosEquipo,
      puntosRival: puntosRival,
      resultado: puntosEquipo > puntosRival ? 'victoria' : puntosEquipo < puntosRival ? 'derrota' : 'empate'
    };
  });
};

// Helper para obtener líderes simplificado
const obtenerLideresEquipo = async (equipoId, torneoId, tipo, req) => {
  const partidos = await Partido.find({
    torneo: torneoId,
    estado: 'finalizado',
    $or: [
      { equipoLocal: equipoId },
      { equipoVisitante: equipoId }
    ]
  }).populate('jugadas.jugadorPrincipal jugadas.jugadorSecundario', 'nombre imagen');

  if (partidos.length === 0) return [];

  const estadisticasJugadores = new Map();
  
  // Obtener jugadores del equipo con sus números
  const jugadoresEquipo = await Usuario.find({
    'equipos.equipo': equipoId
  }).select('nombre imagen equipos');

  const numerosJugadores = new Map();
  jugadoresEquipo.forEach(jugador => {
    const equipoData = jugador.equipos.find(e => {
      if (!e.equipo) {
        console.warn(`⚠️  ADVERTENCIA: El jugador '${jugador.nombre}' (ID: ${jugador._id}) tiene una referencia de equipo NULL y podría causar problemas`);
        return false;
      }
      return e.equipo.toString() === equipoId.toString();
    });
    if (equipoData) {
      numerosJugadores.set(jugador._id.toString(), equipoData.numero);
    }
  });

  // Procesar jugadas (lógica simplificada del método principal)
  partidos.forEach(partido => {
    partido.jugadas.forEach(jugada => {
      try {
        // Solo contar jugadas del equipo en posesión
        if (jugada.equipoEnPosesion && jugada.equipoEnPosesion.toString() === equipoId.toString()) {
          
          const procesarJugador = (jugadorObj, esSecundario) => {
            if (jugadorObj && jugadorObj._id) {
              const jugadorId = jugadorObj._id.toString();
              const numero = numerosJugadores.get(jugadorId) || null; // ✅ Usar el Map correcto
              
              if (!estadisticasJugadores.has(jugadorId)) {
                estadisticasJugadores.set(jugadorId, {
                  jugador: {
                    _id: jugadorObj._id,
                    nombre: jugadorObj.nombre,
                    imagen: jugadorObj.imagen,
                    numero: numero
                  },
                  pases: { intentos: 0, completados: 0, touchdowns: 0, intercepciones: 0 },
                  puntos: 0,        // ✅ Número simple
                  tackleos: 0,      // ✅ Número simple
                  intercepciones: 0,
                  sacks: 0,
                  recepciones: 0,
                  corridas: 0       // ✅ Agregar corridas
                });
              }

              const stats = estadisticasJugadores.get(jugadorId);

              // 🔧 LÓGICA CORREGIDA PARA ESTADÍSTICAS
              switch (jugada.tipoJugada) {
                case 'pase_completo':
                  if (!esSecundario) {
                    stats.pases.intentos++;
                    stats.pases.completados++;
                    if (jugada.resultado.touchdown) {
                      stats.pases.touchdowns++;
                      stats.puntos += 6;
                    }
                  } else {
                    stats.recepciones++;
                    if (jugada.resultado.touchdown) {
                      stats.puntos += 6;
                    }
                  }
                  break;
                  
                case 'corrida':
                  if (!esSecundario) {  // ✅ Usar !esSecundario (corredor = principal)
                    stats.corridas++;
                    
                    if (jugada.resultado?.touchdown) {
                      stats.puntos += 6;  // ✅ Número simple
                    }
                  } else {
                    // 🔥 TACKLEADOR en corrida - AQUÍ ESTÁ EL FIX PARA TU PROBLEMA
                    stats.tackleos++;
                  }
                  break;
                  
                case 'intercepcion':
                  if (!esSecundario) {
                    stats.intercepciones++;
                    // Los puntos van al jugadorTouchdown, no al interceptor
                  } else {
                    // QB interceptado
                    stats.pases.intentos++;
                    stats.pases.intercepciones++;
                  }
                  break;
                  
                case 'tackleo':
                  if (!esSecundario) {
                    stats.tackleos++;
                  }
                  break;
                  
                case 'sack':
                  if (!esSecundario) {
                    stats.sacks++;
                  }
                  break;
                  
                case 'pase_incompleto':
                  if (!esSecundario) {
                    stats.pases.intentos++;
                  }
                  break;
                  
                case 'conversion_1pt':
                case 'conversion_2pt':
                  const puntosConversion = jugada.tipoJugada === 'conversion_1pt' ? 1 : 2;
                  if (!esSecundario) {
                    stats.pases.intentos++;
                    stats.pases.completados++;
                  } else {
                    stats.recepciones++;
                    stats.puntos += puntosConversion;
                  }
                  break;
                  
                case 'safety':
                  if (!esSecundario) {
                    stats.puntos += 2;
                  }
                  break;
              }
            }
          };

          // Procesar jugador principal y secundario
          procesarJugador(jugada.jugadorPrincipal, false);
          procesarJugador(jugada.jugadorSecundario, true);
          
          // 🔥 NUEVO: Procesar jugadorTouchdown si existe (para intercepción y otros TDs)
          if (jugada.jugadorTouchdown && jugada.resultado.touchdown) {
            const jugadorTouchdownId = jugada.jugadorTouchdown._id.toString();
            const numero = obtenerNumeroJugador(jugada.jugadorTouchdown._id, equipoId) || null;
            
            if (!estadisticasJugadores.has(jugadorTouchdownId)) {
              estadisticasJugadores.set(jugadorTouchdownId, {
                jugador: {
                  _id: jugada.jugadorTouchdown._id,
                  nombre: jugada.jugadorTouchdown.nombre,
                  imagen: jugada.jugadorTouchdown.imagen,
                  numero: numero
                },
                pases: { intentos: 0, completados: 0, touchdowns: 0, intercepciones: 0 },
                puntos: 0,
                tackleos: 0,
                intercepciones: 0,
                sacks: 0,
                recepciones: 0
              });
            }

            const statsAnotador = estadisticasJugadores.get(jugadorTouchdownId);
            
            // 🔥 ANOTADOR RECIBE LOS PUNTOS DEL TOUCHDOWN
            statsAnotador.puntos += 6;
            
            console.log(`🏆 Puntos TD asignados a: ${jugada.jugadorTouchdown.nombre} (#${numero}) por ${jugada.tipoJugada}`);
          }
        }
      } catch (jugadaError) {
        console.log('⚠️ Error procesando jugada:', jugadaError.message);
      }
    });
  });

  // Convertir a array y ordenar
  let jugadoresArray = Array.from(estadisticasJugadores.values());

  switch (tipo) {
    case 'pases':
      jugadoresArray.sort((a, b) => {
        if (a.pases.completados !== b.pases.completados) {
          return b.pases.completados - a.pases.completados;
        }
        return b.pases.touchdowns - a.pases.touchdowns;
      });
      break;
    case 'puntos':
      jugadoresArray.sort((a, b) => b.puntos - a.puntos);
      break;
    case 'tackleos':
      jugadoresArray.sort((a, b) => b.tackleos - a.tackleos);
      break;
    case 'intercepciones':
      jugadoresArray.sort((a, b) => b.intercepciones - a.intercepciones);
      break;
    case 'sacks':
      jugadoresArray.sort((a, b) => b.sacks - a.sacks);
      break;
    case 'recepciones':
      jugadoresArray.sort((a, b) => b.recepciones - a.recepciones);
      break;
  }

  return jugadoresArray.slice(0, 3).map((jugadorStats, index) => ({
    posicion: index + 1,
    jugador: jugadorStats.jugador,
    estadisticas: jugadorStats
  }));
};