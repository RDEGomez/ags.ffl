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
      const mostrarEquiposSinPartidos = true; // 🔧 Configurable
      
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

    console.log('🔄 Ordenando tabla de posiciones...');
    // Ordenar por: 1) Victorias, 2) Diferencia de puntos, 3) Puntos a favor, 4) Nombre (para equipos sin partidos)
    tablaPosiciones.sort((a, b) => {
      if (a.victorias !== b.victorias) return b.victorias - a.victorias;
      if (a.diferenciaPuntos !== b.diferenciaPuntos) return b.diferenciaPuntos - a.diferenciaPuntos;
      if (a.puntosFavor !== b.puntosFavor) return b.puntosFavor - a.puntosFavor;
      return a.equipo.nombre.localeCompare(b.equipo.nombre); // Alfabético para empates
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

// 🏆 3. LÍDERES POR ESTADÍSTICA (TOP 3 JUGADORES DE UN EQUIPO)
exports.obtenerLideresEstadisticas = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🏆 [${timestamp}] INICIO - Obtener líderes estadísticas`);
  console.log('🏈 Equipo ID:', req.params.equipoId);
  console.log('🎯 Torneo ID:', req.params.torneoId);
  console.log('📊 Tipo estadística:', req.params.tipo);

  try {
    const { equipoId, torneoId, tipo } = req.params;

    // Validar tipo de estadística
    const tiposValidos = ['pases', 'puntos', 'tackleos', 'intercepciones', 'sacks', 'recepciones'];
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
      categoria: equipo.categoria,
      estado: 'finalizado',
      $or: [
        { equipoLocal: equipoId },
        { equipoVisitante: equipoId }
      ]
    }).populate('jugadas.jugadorPrincipal jugadas.jugadorSecundario', 'nombre imagen');

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
      const equipoData = jugador.equipos.find(e => e.equipo.toString() === equipoId.toString());
      if (equipoData) {
        numerosJugadores.set(jugador._id.toString(), equipoData.numero);
      }
    });

    // Procesar jugadas según el tipo de estadística
    partidos.forEach(partido => {
      partido.jugadas.forEach(jugada => {
        const procesarJugador = (jugador, esSecundario = false) => {
          if (!jugador) return;

          const jugadorId = jugador._id.toString();
          const numero = numerosJugadores.get(jugadorId);
          
          // Solo procesar jugadores de este equipo
          if (!numero) return;

          if (!estadisticasJugadores.has(jugadorId)) {
            estadisticasJugadores.set(jugadorId, {
              jugador: {
                _id: jugador._id,
                nombre: jugador.nombre,
                imagen: jugador.imagen,
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

          const stats = estadisticasJugadores.get(jugadorId);

          // Contabilizar según tipo de jugada
          switch (jugada.tipoJugada) {
            case 'pase_completo':
              if (!esSecundario) {
                stats.pases.intentos++;
                stats.pases.completados++;
                if (jugada.resultado.touchdown) stats.pases.touchdowns++;
              } else {
                stats.recepciones++;
              }
              break;
            case 'pase_incompleto':
              if (!esSecundario) {
                stats.pases.intentos++;
              }
              break;
            case 'intercepcion':
              if (!esSecundario) {
                stats.intercepciones++;
              } else {
                stats.pases.intercepciones++;
              }
              break;
            case 'touchdown':
              stats.puntos += 6;
              break;
            case 'conversion_1pt':
              stats.puntos += 1;
              break;
            case 'conversion_2pt':
              stats.puntos += 2;
              break;
            case 'safety':
              stats.puntos += 2;
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
          }
        };

        procesarJugador(jugada.jugadorPrincipal, false);
        procesarJugador(jugada.jugadorSecundario, true);
      });
    });

    console.log(`📈 Procesados ${estadisticasJugadores.size} jugadores`);

    // Convertir a array y ordenar según el tipo
    let jugadoresArray = Array.from(estadisticasJugadores.values());

    // Ordenar según tipo de estadística
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

    // Tomar solo el top 3
    const top3 = jugadoresArray.slice(0, 3);

    // Agregar posición y enriquecer con URLs
    const lideres = top3.map((jugadorStats, index) => ({
      posicion: index + 1,
      jugador: {
        ...jugadorStats.jugador,
        imagen: getImageUrlServer(jugadorStats.jugador.imagen, req)
      },
      estadisticas: jugadorStats,
      // 🔥 Preparado para QB Rating futuro
      qbRatingData: tipo === 'pases' ? {
        intentos: jugadorStats.pases.intentos,
        completados: jugadorStats.pases.completados,
        porcentajeComplecion: jugadorStats.pases.intentos > 0 ? 
          Math.round((jugadorStats.pases.completados / jugadorStats.pases.intentos) * 100) : 0,
        touchdowns: jugadorStats.pases.touchdowns,
        intercepciones: jugadorStats.pases.intercepciones,
        // Campos preparados para futuro cálculo de QB Rating
        yardas: 0, // Por implementar cuando tengamos distancia de pases
        rating: 0  // Por calcular con fórmula QB Rating
      } : null
    }));

    console.log('📤 Enviando líderes de estadísticas');
    console.log(`  🏆 Líder ${tipo}: ${lideres[0]?.jugador.nombre || 'N/A'} (#${lideres[0]?.jugador.numero || 'N/A'})`);
    console.log(`  📊 Total con estadísticas: ${jugadoresArray.length}`);
    console.log(`✅ [${new Date().toISOString()}] FIN - Líderes obtenidos\n`);

    res.json({
      lideres,
      tipo,
      equipo: {
        _id: equipo._id,
        nombre: equipo.nombre,
        imagen: getImageUrlServer(equipo.imagen, req)
      },
      totalJugadoresConStats: jugadoresArray.length,
      fechaConsulta: new Date().toISOString()
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al obtener líderes estadísticas:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Líderes fallido\n`);
    
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
        const equipoDelUsuario = usuario?.equipos?.find(e => 
          e.equipo.toString() === equipoId.toString()
        );
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
              
              switch (jugada.tipoJugada) {
                case 'touchdown':
                  estadisticasBasicas.touchdowns++;
                  break;
                case 'conversion_1pt':
                  estadisticasBasicas.conversiones1pt++;
                  break;
                case 'conversion_2pt':
                  estadisticasBasicas.conversiones2pt++;
                  break;
                case 'safety':
                  estadisticasBasicas.safeties++;
                  break;
                case 'pase_completo':
                  estadisticasBasicas.pasesCompletos++;
                  break;
                case 'pase_incompleto':
                  estadisticasBasicas.pasesIncompletos++;
                  break;
                case 'corrida':
                  estadisticasBasicas.corridas++;
                  break;
              }
            } else {
              // Jugadas defensivas (cuando el otro equipo tiene la posesión)
              switch (jugada.tipoJugada) {
                case 'intercepcion':
                  estadisticasBasicas.intercepciones++;
                  break;
                case 'sack':
                  estadisticasBasicas.sacks++;
                  break;
                case 'tackleo':
                  estadisticasBasicas.tackleos++;
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

exports.obtenerLideresIndividuales = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n👑 [${timestamp}] INICIO - Obtener líderes individuales generales`);
  
  try {
    const { torneoId, categoria, tipo } = req.params;
    console.log('🎯 Parámetros recibidos:', { torneoId, categoria, tipo });

    // Validar torneo
    const Torneo = require('../models/Torneo');
    const torneo = await Torneo.findById(torneoId);
    if (!torneo) {
      console.log('❌ ERROR: Torneo no encontrado');
      return res.status(404).json({ mensaje: 'Torneo no encontrado' });
    }

    // Obtener todos los partidos finalizados de la categoría en el torneo
    const Partido = require('../models/Partido');
    const partidos = await Partido.find({
      torneo: torneoId,
      categoria: categoria,
      estado: 'finalizado'
    }).populate('equipoLocal equipoVisitante', 'nombre imagen');

    if (partidos.length === 0) {
      console.log('⚠️ No hay partidos finalizados en esta categoría');
      return res.json({
        lideres: [],
        tipo,
        categoria,
        torneo: { _id: torneo._id, nombre: torneo.nombre },
        totalJugadoresConStats: 0,
        fechaConsulta: new Date().toISOString()
      });
    }

    console.log(`🔍 Procesando ${partidos.length} partidos finalizados`);

    // Objeto para acumular estadísticas por jugador
    const estadisticasJugadores = new Map();

    // Procesar cada partido
    partidos.forEach(partido => {
      if (!partido.jugadas || partido.jugadas.length === 0) return;

      // Procesar cada jugada
      partido.jugadas.forEach(jugada => {
        const equipoPosesion = jugada.equipoPosesion === 'local' ? partido.equipoLocal : partido.equipoVisitante;
        if (!equipoPosesion) return;

        // Obtener jugadores involucrados
        const jugadorPrincipal = equipoPosesion.jugadores?.find(j => j.numero === jugada.numeroJugadorPrincipal);
        const jugadorSecundario = equipoPosesion.jugadores?.find(j => j.numero === jugada.numeroJugadorSecundario);

        if (jugadorPrincipal) {
          const jugadorId = jugadorPrincipal._id.toString();
          
          // Inicializar estadísticas si no existen
          if (!estadisticasJugadores.has(jugadorId)) {
            estadisticasJugadores.set(jugadorId, {
              jugador: {
                _id: jugadorPrincipal._id,
                nombre: jugadorPrincipal.nombre,
                numero: jugadorPrincipal.numero,
                avatar: jugadorPrincipal.avatar
              },
              equipo: {
                _id: equipoPosesion._id,
                nombre: equipoPosesion.nombre,
                imagen: equipoPosesion.imagen
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

          const stats = estadisticasJugadores.get(jugadorId);

          // Acumular estadísticas según el tipo de jugada
          switch (jugada.tipoJugada) {
            case 'pase_completo':
              stats.stats.pases.intentos++;
              stats.stats.pases.completados++;
              if (jugada.touchdown) {
                stats.stats.pases.touchdowns++;
              }
              break;
            case 'pase_incompleto':
              stats.stats.pases.intentos++;
              break;
            case 'intercepcion':
              if (jugada.numeroJugadorPrincipal === jugadorPrincipal.numero) {
                // Jugador que hizo la intercepción
                stats.stats.intercepciones.total++;
              } else {
                // QB que lanzó la intercepción
                stats.stats.pases.intentos++;
                stats.stats.pases.intercepciones++;
              }
              break;
            case 'sack':
              stats.stats.sacks.total++;
              break;
            case 'tackleo':
              stats.stats.tackleos.total++;
              break;
            case 'touchdown':
              stats.stats.puntos.total += 6;
              stats.stats.puntos.touchdowns++;
              break;
          }

          // Puntos por jugada
          if (jugada.puntos) {
            stats.stats.puntos.total += jugada.puntos;
          }
        }

        // Procesar jugador secundario para recepciones
        if (jugadorSecundario && (jugada.tipoJugada === 'pase_completo' || jugada.tipoJugada === 'touchdown')) {
          const jugadorSecId = jugadorSecundario._id.toString();
          
          if (!estadisticasJugadores.has(jugadorSecId)) {
            estadisticasJugadores.set(jugadorSecId, {
              jugador: {
                _id: jugadorSecundario._id,
                nombre: jugadorSecundario.nombre,
                numero: jugadorSecundario.numero,
                avatar: jugadorSecundario.avatar
              },
              equipo: {
                _id: equipoPosesion._id,
                nombre: equipoPosesion.nombre,
                imagen: equipoPosesion.imagen
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

          const statsSecundario = estadisticasJugadores.get(jugadorSecId);
          statsSecundario.stats.recepciones.total++;
          if (jugada.touchdown) {
            statsSecundario.stats.recepciones.touchdowns++;
          }
        }
      });
    });

    // Convertir Map a Array y ordenar según el tipo solicitado
    const jugadoresArray = Array.from(estadisticasJugadores.values());
    
    let lideres = [];
    switch (tipo) {
      case 'pases':
        lideres = jugadoresArray
          .filter(j => j.stats.pases.completados > 0)
          .sort((a, b) => b.stats.pases.completados - a.stats.pases.completados);
        break;
      case 'puntos':
        lideres = jugadoresArray
          .filter(j => j.stats.puntos.total > 0)
          .sort((a, b) => b.stats.puntos.total - a.stats.puntos.total);
        break;
      case 'tackleos':
        lideres = jugadoresArray
          .filter(j => j.stats.tackleos.total > 0)
          .sort((a, b) => b.stats.tackleos.total - a.stats.tackleos.total);
        break;
      case 'intercepciones':
        lideres = jugadoresArray
          .filter(j => j.stats.intercepciones.total > 0)
          .sort((a, b) => b.stats.intercepciones.total - a.stats.intercepciones.total);
        break;
      case 'sacks':
        lideres = jugadoresArray
          .filter(j => j.stats.sacks.total > 0)
          .sort((a, b) => b.stats.sacks.total - a.stats.sacks.total);
        break;
      case 'recepciones':
        lideres = jugadoresArray
          .filter(j => j.stats.recepciones.total > 0)
          .sort((a, b) => b.stats.recepciones.total - a.stats.recepciones.total);
        break;
      default:
        lideres = jugadoresArray;
    }

    // Tomar solo los primeros 3 (top 3)
    const top3Lideres = lideres.slice(0, 3);

    // Formatear respuesta con imagen URLs
    const { getImageUrlServer } = require('../helpers/imageUrlHelper');
    const lideresFormateados = top3Lideres.map((jugador, index) => ({
      posicion: index + 1,
      jugador: {
        _id: jugador.jugador._id,
        nombre: jugador.jugador.nombre,
        numero: jugador.jugador.numero,
        avatar: getImageUrlServer(jugador.jugador.avatar, req)
      },
      equipo: {
        _id: jugador.equipo._id,
        nombre: jugador.equipo.nombre,
        imagen: getImageUrlServer(jugador.equipo.imagen, req)
      },
      valor: tipo === 'pases' ? jugador.stats.pases.completados :
             tipo === 'puntos' ? jugador.stats.puntos.total :
             tipo === 'tackleos' ? jugador.stats.tackleos.total :
             tipo === 'intercepciones' ? jugador.stats.intercepciones.total :
             tipo === 'sacks' ? jugador.stats.sacks.total :
             tipo === 'recepciones' ? jugador.stats.recepciones.total : 0,
      estadisticasCompletas: jugador.stats
    }));

    console.log('📤 Enviando líderes individuales');
    console.log(`  🏆 Líder ${tipo}: ${lideresFormateados[0]?.jugador.nombre || 'N/A'} (#${lideresFormateados[0]?.jugador.numero || 'N/A'})`);
    console.log(`  📊 Total con estadísticas: ${jugadoresArray.length}`);
    console.log(`✅ [${new Date().toISOString()}] FIN - Líderes individuales obtenidos\n`);

    res.json({
      lideres: lideresFormateados,
      tipo,
      categoria,
      torneo: {
        _id: torneo._id,
        nombre: torneo.nombre
      },
      totalJugadoresConStats: jugadoresArray.length,
      fechaConsulta: new Date().toISOString()
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al obtener líderes individuales:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Líderes individuales fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al obtener líderes individuales', 
      error: error.message 
    });
  }
};

// 🔥 NUEVA FUNCIÓN: OBTENER TODOS LOS LÍDERES INDIVIDUALES (6 TIPOS)
exports.obtenerTodosLideresIndividuales = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🏆 [${timestamp}] INICIO - Obtener todos los líderes individuales`);
  
  try {
    const { torneoId, categoria } = req.params;
    console.log('🎯 Parámetros recibidos:', { torneoId, categoria });

    // Tipos de estadísticas a obtener
    const tiposEstadisticas = ['pases', 'puntos', 'tackleos', 'intercepciones', 'sacks', 'recepciones'];
    
    // Crear array de promesas para obtener todos los tipos en paralelo
    const promesasLideres = tiposEstadisticas.map(async (tipo) => {
      // Simular llamada interna al método anterior
      try {
        // Reutilizar la lógica del método anterior
        const mockReq = { params: { torneoId, categoria, tipo }, ...req };
        const mockRes = {
          json: (data) => data,
          status: () => mockRes
        };

        // Ejecutar la función anterior internamente
        const resultado = await new Promise((resolve, reject) => {
          // Crear un mock response que capture el resultado
          const originalSend = mockRes.json;
          mockRes.json = (data) => {
            resolve(data);
            return mockRes;
          };
          
          // Llamar a la función anterior
          exports.obtenerLideresIndividuales(mockReq, mockRes).catch(reject);
        });

        return { tipo, datos: resultado };
      } catch (error) {
        console.error(`Error obteniendo líderes de ${tipo}:`, error);
        return { 
          tipo, 
          datos: { 
            lideres: [], 
            tipo, 
            categoria, 
            totalJugadoresConStats: 0 
          } 
        };
      }
    });

    // Ejecutar todas las consultas en paralelo
    const resultadosLideres = await Promise.all(promesasLideres);

    // Formatear respuesta
    const lideresIndividuales = {};
    resultadosLideres.forEach(({ tipo, datos }) => {
      lideresIndividuales[tipo] = datos;
    });

    console.log('📤 Enviando todos los líderes individuales');
    console.log(`  📊 Tipos procesados: ${tiposEstadisticas.length}`);
    console.log(`✅ [${new Date().toISOString()}] FIN - Todos los líderes individuales obtenidos\n`);

    res.json({
      mensaje: 'Líderes individuales obtenidos correctamente',
      lideresIndividuales,
      categoria,
      torneo: resultadosLideres[0]?.datos?.torneo,
      fechaConsulta: new Date().toISOString()
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al obtener todos los líderes individuales:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Todos los líderes individuales fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al obtener todos los líderes individuales', 
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
    const equipoData = jugador.equipos.find(e => e.equipo.toString() === equipoId.toString());
    if (equipoData) {
      numerosJugadores.set(jugador._id.toString(), equipoData.numero);
    }
  });

  // Procesar jugadas (lógica simplificada del método principal)
  partidos.forEach(partido => {
    partido.jugadas.forEach(jugada => {
      const procesarJugador = (jugador, esSecundario = false) => {
        if (!jugador) return;

        const jugadorId = jugador._id.toString();
        const numero = numerosJugadores.get(jugadorId);
        
        if (!numero) return; // Solo jugadores de este equipo

        if (!estadisticasJugadores.has(jugadorId)) {
          estadisticasJugadores.set(jugadorId, {
            jugador: {
              _id: jugador._id,
              nombre: jugador.nombre,
              imagen: getImageUrlServer(jugador.imagen, req),
              numero: numero
            },
            pases: { completados: 0, touchdowns: 0 },
            puntos: 0,
            tackleos: 0,
            intercepciones: 0,
            sacks: 0,
            recepciones: 0
          });
        }

        const stats = estadisticasJugadores.get(jugadorId);

        switch (jugada.tipoJugada) {
          case 'pase_completo':
            if (!esSecundario) {
              stats.pases.completados++;
              if (jugada.resultado.touchdown) stats.pases.touchdowns++;
            } else {
              stats.recepciones++;
            }
            break;
          case 'intercepcion':
            if (!esSecundario) stats.intercepciones++;
            break;
          case 'touchdown':
            stats.puntos += 6;
            break;
          case 'conversion_1pt':
            stats.puntos += 1;
            break;
          case 'conversion_2pt':
            stats.puntos += 2;
            break;
          case 'safety':
            stats.puntos += 2;
            break;
          case 'sack':
            if (!esSecundario) stats.sacks++;
            break;
          case 'tackleo':
            if (!esSecundario) stats.tackleos++;
            break;
        }
      };

      procesarJugador(jugada.jugadorPrincipal, false);
      procesarJugador(jugada.jugadorSecundario, true);
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