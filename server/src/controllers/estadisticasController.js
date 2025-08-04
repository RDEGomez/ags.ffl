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

// 📊 1. TABLA DE POSICIONES - VERSIÓN HÍBRIDA MODIFICADA PARA TIPO PARTIDO
exports.obtenerTablaPosiciones = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n📊 [${timestamp}] INICIO - Obtener tabla de posiciones HÍBRIDA con filtro tipo partido`);
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

      // 🔥 FILTRAR SOLO PARTIDOS OFICIALES PARA ESTE EQUIPO
      const partidosOficiales = partidos.filter(partido => {
        const esOficial = partido.esOficialPara(equipo._id);
        if (!esOficial) {
          console.log(`⚠️ Partido ${partido._id} excluido de tabla (${partido.obtenerTipoParaEquipo(equipo._id)} para ${equipo.nombre})`);
        }
        return esOficial;
      });

      console.log(`📋 Partidos oficiales para ${equipo.nombre}: ${partidosOficiales.length}/${partidos.length}`);

      // Separar partidos oficiales por estado
      const partidosFinalizados = partidosOficiales.filter(p => p.estado === 'finalizado');
      const partidosProgramados = partidosOficiales.filter(p => p.estado === 'programado');
      const partidosEnCurso = partidosOficiales.filter(p => p.estado === 'en_curso');

      console.log(`  📋 Oficiales finalizados: ${partidosFinalizados.length}`);
      console.log(`  📋 Oficiales programados: ${partidosProgramados.length}`);
      console.log(`  📋 Oficiales en curso: ${partidosEnCurso.length}`);

      let victorias = 0;
      let derrotas = 0;
      let puntosFavor = 0;
      let puntosContra = 0;

      // Solo calcular estadísticas de partidos oficiales finalizados
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
        // Empates no se cuentan en victorias ni derrotas
      });

      // Información de estado del equipo
      const tienePartidos = partidos.length > 0;
      const tienePartidosOficiales = partidosOficiales.length > 0;
      const partidosJugados = partidosFinalizados.length;
      const partidosPendientes = partidosProgramados.length + partidosEnCurso.length;

      // Calcular estadísticas derivadas
      const diferenciaPuntos = puntosFavor - puntosContra;
      const promedioPuntosFavor = partidosJugados > 0 ? 
        Math.round((puntosFavor / partidosJugados) * 10) / 10 : 0;
      const promedioPuntosContra = partidosJugados > 0 ? 
        Math.round((puntosContra / partidosJugados) * 10) / 10 : 0;

      console.log(`  📊 ${equipo.nombre}: ${victorias}V-${derrotas}D, ${puntosFavor}-${puntosContra} pts, Dif: ${diferenciaPuntos > 0 ? '+' : ''}${diferenciaPuntos}`);

      tablaPosiciones.push({
        equipo: {
          _id: equipo._id,
          nombre: equipo.nombre,
          imagen: equipo.imagen, // Se enriquecerá después
          categoria: equipo.categoria
        },
        // Estadísticas principales
        victorias,
        derrotas,
        puntosFavor,
        puntosContra,
        diferenciaPuntos,
        partidosJugados, // Solo partidos oficiales finalizados
        partidosPendientes, // Solo partidos oficiales pendientes

        // Estadísticas derivadas
        promedioPuntosFavor,
        promedioPuntosContra,
        porcentajeVictorias: partidosJugados > 0 ? 
          Math.round((victorias / partidosJugados) * 100) : 0,
        
        // 🔥 METADATA HÍBRIDA CON INFO DE FILTRADO
        tienePartidos,
        tienePartidosOficiales, // Nuevo
        partidosInfo: {
          total: partidos.length,
          oficiales: partidosOficiales.length,
          excluidos: partidos.length - partidosOficiales.length
        },
        estaInscrito: torneo.equipos?.some(equipoId => equipoId.toString() === equipo._id.toString()) || false
      });
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

    console.log('📤 Enviando tabla de posiciones HÍBRIDA con filtro tipo partido');
    console.log(`  🏆 Líder: ${tablaEnriquecida[0]?.equipo.nombre || 'N/A'}`);
    console.log(`  📊 Total equipos: ${tablaEnriquecida.length}`);
    console.log(`  🎯 Con partidos: ${tablaEnriquecida.filter(e => e.tienePartidos).length}`);
    console.log(`  🎯 Con partidos oficiales: ${tablaEnriquecida.filter(e => e.tienePartidosOficiales).length}`);
    console.log(`  📋 Inscritos: ${tablaEnriquecida.filter(e => e.estaInscrito).length}`);
    console.log(`✅ [${new Date().toISOString()}] FIN - Tabla híbrida con filtro obtenida\n`);

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
        equiposConPartidosOficiales: tablaEnriquecida.filter(e => e.tienePartidosOficiales).length,
        equiposConPartidosJugados: tablaEnriquecida.filter(e => e.partidosJugados > 0).length,
        equiposInscritos: tablaEnriquecida.filter(e => e.estaInscrito).length,
        totalPartidosProgramados: tablaEnriquecida.reduce((sum, e) => sum + e.partidosPendientes, 0),
        totalPartidosFinalizados: tablaEnriquecida.reduce((sum, e) => sum + e.partidosJugados, 0),
        partidosExcluidosPorTipo: tablaEnriquecida.reduce((sum, e) => sum + e.partidosInfo.excluidos, 0)
      },
      metadatos: {
        filtradoPorTipoPartido: true,
        soloPartidosOficiales: true,
        fechaConsulta: new Date().toISOString()
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

// 📈 2. TENDENCIA DE PUNTOS POR JORNADAS (EQUIPO ESPECÍFICO) - MODIFICADO
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

    // 🔥 FILTRAR SOLO PARTIDOS OFICIALES
    const partidosOficiales = partidos.filter(partido => {
      const esOficial = partido.esOficialPara(equipoId);
      if (!esOficial) {
        console.log(`⚠️ Tendencia - Partido ${partido._id} excluido (${partido.obtenerTipoParaEquipo(equipoId)})`);
      }
      return esOficial;
    });

    console.log(`🔥 Partidos oficiales tras filtrado: ${partidosOficiales.length}`);

    if (partidosOficiales.length === 0) {
      console.log('⚠️ No se encontraron partidos oficiales finalizados');
      return res.json({
        tendencia: [],
        equipo: {
          _id: equipo._id,
          nombre: equipo.nombre,
          imagen: getImageUrlServer(equipo.imagen, req),
          categoria: equipo.categoria
        },
        estadisticas: {
          totalJornadas: 0,
          promedioPuntos: 0,
          maxPuntos: 0,
          minPuntos: 0,
          totalPuntos: 0
        },
        mensaje: 'No hay partidos oficiales finalizados para mostrar tendencia',
        fechaConsulta: new Date().toISOString()
      });
    }

    console.log('📊 Procesando tendencia por jornadas de partidos oficiales...');
    const tendencia = [];

    // 🔥 PROCESAR SOLO PARTIDOS OFICIALES
    partidosOficiales.forEach((partido, index) => {
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
// 🏆 LÍDERES DE ESTADÍSTICAS POR EQUIPO - VERSIÓN SIMPLIFICADA CON LÓGICA DE CLASIFICACIÓN GENERAL
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

    // 🔥 FILTRAR SOLO PARTIDOS OFICIALES PARA ESTE EQUIPO
    const partidosOficiales = partidos.filter(partido => {
      const esOficial = partido.esOficialPara(equipoId);
      if (!esOficial) {
        console.log(`⚠️ Partido ${partido._id} excluido (${partido.obtenerTipoParaEquipo(equipoId)} para ${equipo.nombre})`);
      }
      return esOficial;
    });

    console.log(`📋 Partidos encontrados: ${partidos.length}, Oficiales: ${partidosOficiales.length}`);

    if (partidosOficiales.length === 0) {
      console.log('⚠️ No se encontraron partidos oficiales finalizados');
      return res.json({
        lideres: [],
        tipo,
        mensaje: 'No hay partidos oficiales finalizados para calcular estadísticas',
        partidosInfo: {
          total: partidos.length,
          oficiales: 0,
          excluidos: partidos.length
        }
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

    console.log(`📊 Procesando ${partidosOficiales.length} partidos oficiales para equipo: ${equipoId}`);

    let totalPuntosCalculados = 0;

    // 🔥 PROCESAR SOLO PARTIDOS OFICIALES CON LÓGICA EXACTA DE CLASIFICACIÓN GENERAL
    partidosOficiales.forEach(partido => {
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

            case 'pase_incompleto':
              if (!esSecundario) {
                stats.pases.intentos++;
              }
              break;

            case 'intercepcion':
              if (!esSecundario) {
                stats.intercepciones++;
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
              } else if (esSecundario) {
                stats.tackleos++;
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

            case 'conversion_1pt':
              if (jugada.resultado?.puntos > 0) {
                stats.puntos += jugada.resultado.puntos;
                totalPuntosCalculados += jugada.resultado.puntos;
              }
              if (!esSecundario) {
                stats.recepciones++;
              }
              break;

            case 'conversion_2pt':
              if (jugada.resultado?.puntos > 0) {
                stats.puntos += jugada.resultado.puntos;
                totalPuntosCalculados += jugada.resultado.puntos;
              }
              if (!esSecundario) {
                stats.recepciones++;
              }
              break;

            case 'safety':
              if (jugada.resultado?.puntos > 0) {
                stats.puntos += jugada.resultado.puntos;
                totalPuntosCalculados += jugada.resultado.puntos;
              }
              break;

            default:
              if (jugada.resultado?.puntos > 0) {
                stats.puntos += jugada.resultado.puntos;
                totalPuntosCalculados += jugada.resultado.puntos;
              }
              break;
          }
        };

        // Procesar jugadores principal y secundario
        if (jugada.jugadorPrincipal) procesarJugador(jugada.jugadorPrincipal, false);
        if (jugada.jugadorSecundario) procesarJugador(jugada.jugadorSecundario, true);
        if (jugada.jugadorTouchdown) procesarJugador(jugada.jugadorTouchdown, false);
      });
    });

    // 🔥 CÁLCULO DE QB RATING EXACTO
    estadisticasJugadores.forEach((stats, jugadorId) => {
      if (stats.pases.intentos > 0) {
        const porcentajeCompletado = (stats.pases.completados / stats.pases.intentos) * 100;
        const porcentajeTouchdowns = (stats.pases.touchdowns / stats.pases.intentos) * 100;
        const porcentajeIntercepciones = (stats.pases.intercepciones / stats.pases.intentos) * 100;

        // Fórmula simplificada de QB Rating
        const a = Math.max(0, Math.min(2.375, (porcentajeCompletado - 30) * 0.05));
        const b = Math.max(0, Math.min(2.375, (porcentajeTouchdowns) * 0.05));
        const c = Math.max(0, Math.min(2.375, 2.375 - (porcentajeIntercepciones * 0.25)));

        stats.qbRating = Math.round(((a + b + c) / 6) * 100 * 10) / 10;
      } else {
        stats.qbRating = 0;
      }
    });

    console.log(`✅ Total puntos calculados: ${totalPuntosCalculados}`);

    // Convertir a array y ordenar por tipo de estadística
    const estadisticasArray = Array.from(estadisticasJugadores.values());
    
    let estadisticasOrdenadas;
    switch (tipo) {
      case 'puntos':
        estadisticasOrdenadas = estadisticasArray
          .filter(stats => stats.puntos > 0)
          .sort((a, b) => b.puntos - a.puntos);
        break;
      case 'qbrating':
        estadisticasOrdenadas = estadisticasArray
          .filter(stats => stats.qbRating > 0)
          .sort((a, b) => b.qbRating - a.qbRating);
        break;
      case 'recepciones':
        estadisticasOrdenadas = estadisticasArray
          .filter(stats => stats.recepciones > 0)
          .sort((a, b) => b.recepciones - a.recepciones);
        break;
      case 'tackleos':
        estadisticasOrdenadas = estadisticasArray
          .filter(stats => stats.tackleos > 0)
          .sort((a, b) => b.tackleos - a.tackleos);
        break;
      case 'intercepciones':
        estadisticasOrdenadas = estadisticasArray
          .filter(stats => stats.intercepciones > 0)
          .sort((a, b) => b.intercepciones - a.intercepciones);
        break;
      case 'sacks':
        estadisticasOrdenadas = estadisticasArray
          .filter(stats => stats.sacks > 0)
          .sort((a, b) => b.sacks - a.sacks);
        break;
      default:
        estadisticasOrdenadas = estadisticasArray;
    }

    // Tomar top 10 líderes
    const lideresTop = estadisticasOrdenadas.slice(0, 10);

    console.log(`📤 Enviando ${lideresTop.length} líderes de ${tipo}`);
    console.log(`✅ [${new Date().toISOString()}] FIN - Líderes obtenidos\n`);

    res.json({
      lideres: lideresTop,
      tipo,
      equipo: {
        _id: equipo._id,
        nombre: equipo.nombre,
        imagen: equipo.imagen,
        categoria: equipo.categoria
      },
      torneo: {
        _id: torneo._id,
        nombre: torneo.nombre
      },
      partidosInfo: {
        total: partidos.length,
        oficiales: partidosOficiales.length,
        excluidos: partidos.length - partidosOficiales.length
      },
      totalJugadoresConStats: estadisticasOrdenadas.length,
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

// 📊 4. ESTADÍSTICAS COMPLETAS DE UN EQUIPO (PARA DASHBOARD) - MODIFICADO
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

    // Ejecutar consultas en paralelo para mejor rendimiento - TODAS MODIFICADAS
    console.log('🔄 Ejecutando consultas paralelas...');
    const [tablaPosiciones, tendencia, lideresPases, lideresPromes, lideresTackleos, lideresInts, lideresSacks, lideresRec] = await Promise.all([
      // Tabla de posiciones (solo este equipo) - MODIFICADA
      obtenerPosicionEquipoModificada(equipoId, torneoId, equipo.categoria, req),
      
      // Tendencia de puntos - MODIFICADA
      obtenerTendenciaEquipoModificada(equipoId, torneoId, equipo.categoria, req),
      
      // Líderes por tipo - MODIFICADAS
      obtenerLideresEquipoModificado(equipoId, torneoId, 'pases', req),
      obtenerLideresEquipoModificado(equipoId, torneoId, 'puntos', req),
      obtenerLideresEquipoModificado(equipoId, torneoId, 'tackleos', req),
      obtenerLideresEquipoModificado(equipoId, torneoId, 'intercepciones', req),
      obtenerLideresEquipoModificado(equipoId, torneoId, 'sacks', req),
      obtenerLideresEquipoModificado(equipoId, torneoId, 'recepciones', req)
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

// 🔧 FUNCIONES HELPER INTERNAS - TODAS MODIFICADAS

// 🔥 Helper para obtener posición de un equipo específico - MODIFICADA
const obtenerPosicionEquipoModificada = async (equipoId, torneoId, categoria, req) => {
  console.log('🏅 Calculando posición del equipo (solo partidos oficiales)...');
  
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

  // 🔥 FILTRAR SOLO PARTIDOS OFICIALES
  const partidosOficiales = partidos.filter(partido => {
    const esOficial = partido.esOficialPara(equipoId);
    if (!esOficial) {
      console.log(`⚠️ Posición - Partido ${partido._id} excluido (${partido.obtenerTipoParaEquipo(equipoId)})`);
    }
    return esOficial;
  });

  console.log(`🔥 Partidos oficiales para posición: ${partidosOficiales.length}`);

  let victorias = 0, derrotas = 0, puntosFavor = 0, puntosContra = 0;

  // 🔥 PROCESAR SOLO PARTIDOS OFICIALES
  partidosOficiales.forEach(partido => {
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

// 🔥 Helper para obtener tendencia simplificada - MODIFICADA
const obtenerTendenciaEquipoModificada = async (equipoId, torneoId, categoria, req) => {
  console.log('📈 Calculando tendencia de puntos (solo partidos oficiales)...');
  
  const partidos = await Partido.find({
    torneo: torneoId,
    categoria: categoria,
    estado: 'finalizado',
    $or: [
      { equipoLocal: equipoId },
      { equipoVisitante: equipoId }
    ]
  }).sort({ fechaHora: 1 });

  // 🔥 FILTRAR SOLO PARTIDOS OFICIALES
  const partidosOficiales = partidos.filter(partido => {
    const esOficial = partido.esOficialPara(equipoId);
    if (!esOficial) {
      console.log(`⚠️ Tendencia - Partido ${partido._id} excluido (${partido.obtenerTipoParaEquipo(equipoId)})`);
    }
    return esOficial;
  });

  console.log(`🔥 Partidos oficiales para tendencia: ${partidosOficiales.length}`);

  // 🔥 PROCESAR SOLO PARTIDOS OFICIALES
  return partidosOficiales.map((partido, index) => {
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

// 🔥 Helper para obtener líderes simplificado - MODIFICADA
const obtenerLideresEquipoModificado = async (equipoId, torneoId, tipo, req) => {
  console.log(`🏆 Calculando líderes ${tipo} (solo partidos oficiales)...`);
  
  const partidos = await Partido.find({
    torneo: torneoId,
    estado: 'finalizado',
    $or: [
      { equipoLocal: equipoId },
      { equipoVisitante: equipoId }
    ]
  }).populate('jugadas.jugadorPrincipal jugadas.jugadorSecundario', 'nombre imagen');

  // 🔥 FILTRAR SOLO PARTIDOS OFICIALES
  const partidosOficiales = partidos.filter(partido => {
    const esOficial = partido.esOficialPara(equipoId);
    if (!esOficial) {
      console.log(`⚠️ Líderes ${tipo} - Partido ${partido._id} excluido (${partido.obtenerTipoParaEquipo(equipoId)})`);
    }
    return esOficial;
  });

  console.log(`🔥 Partidos oficiales para líderes ${tipo}: ${partidosOficiales.length}`);

  if (partidosOficiales.length === 0) return [];

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

  // 🔥 PROCESAR SOLO JUGADAS DE PARTIDOS OFICIALES
  partidosOficiales.forEach(partido => {
    partido.jugadas.forEach(jugada => {
      try {
        // Solo contar jugadas del equipo en posesión
        if (jugada.equipoEnPosesion && jugada.equipoEnPosesion.toString() === equipoId.toString()) {
          
          const procesarJugador = (jugadorObj, esSecundario) => {
            if (jugadorObj && jugadorObj._id) {
              const jugadorId = jugadorObj._id.toString();
              const numero = numerosJugadores.get(jugadorId) || null;
              
              if (!estadisticasJugadores.has(jugadorId)) {
                estadisticasJugadores.set(jugadorId, {
                  jugador: {
                    _id: jugadorObj._id,
                    nombre: jugadorObj.nombre,
                    numero: numero,
                    imagen: jugadorObj.imagen
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

              // Lógica de procesamiento de jugadas (simplificada)
              switch (jugada.tipoJugada) {
                case 'pase_completo':
                  if (!esSecundario) {
                    stats.pases.intentos++;
                    stats.pases.completados++;
                    if (jugada.resultado?.touchdown) stats.pases.touchdowns++;
                  } else {
                    stats.recepciones++;
                    if (jugada.resultado?.touchdown) stats.puntos += 6;
                  }
                  break;
                case 'pase_incompleto':
                  if (!esSecundario) stats.pases.intentos++;
                  break;
                case 'intercepcion':
                  if (!esSecundario) {
                    stats.intercepciones++;
                    if (jugada.resultado?.touchdown) stats.puntos += 6;
                  } else {
                    stats.pases.intercepciones++;
                  }
                  break;
                case 'sack':
                  if (!esSecundario) stats.sacks++;
                  break;
                case 'tackleo':
                  if (!esSecundario) stats.tackleos++;
                  break;
                case 'corrida':
                  if (!esSecundario && jugada.resultado?.touchdown) stats.puntos += 6;
                  else if (esSecundario) stats.tackleos++;
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
              }
            }
          };

          if (jugada.jugadorPrincipal) procesarJugador(jugada.jugadorPrincipal, false);
          if (jugada.jugadorSecundario) procesarJugador(jugada.jugadorSecundario, true);
        }
      } catch (jugadaError) {
        console.log('⚠️ Error procesando jugada:', jugadaError.message);
      }
    });
  });

  // 🔥 CALCULAR QB RATING
  estadisticasJugadores.forEach((stats, jugadorId) => {
    const { intentos, completados, touchdowns, intercepciones } = stats.pases;
    stats.qbRating = calcularQBRating(completados, intentos, touchdowns, intercepciones);
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

// 🔧 FUNCIONES HELPER MODIFICADAS PARA TIPO DE PARTIDO

// 🔥 Helper para obtener posición de un equipo específico - MODIFICADO
const obtenerPosicionEquipoModificado = async (equipoId, torneoId, categoria, req) => {
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

  // 🔥 FILTRAR SOLO PARTIDOS OFICIALES
  const partidosOficiales = partidos.filter(partido => {
    const esOficial = partido.esOficialPara(equipoId);
    if (!esOficial) {
      console.log(`⚠️ Posición - Partido ${partido._id} excluido (${partido.obtenerTipoParaEquipo(equipoId)})`);
    }
    return esOficial;
  });

  let victorias = 0, derrotas = 0, puntosFavor = 0, puntosContra = 0;

  partidosOficiales.forEach(partido => {
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
    porcentajeVictorias: partidosJugados > 0 ? Math.round((victorias / partidosJugados) * 100) : 0,
    partidosInfo: {
      total: partidos.length,
      oficiales: partidosOficiales.length,
      excluidos: partidos.length - partidosOficiales.length
    }
  };
};

// 🔥 Helper para obtener tendencia simplificada - MODIFICADO
const obtenerTendenciaEquipoModificado = async (equipoId, torneoId, categoria, req) => {
  const partidos = await Partido.find({
    torneo: torneoId,
    categoria: categoria,
    estado: 'finalizado',
    $or: [
      { equipoLocal: equipoId },
      { equipoVisitante: equipoId }
    ]
  }).sort({ fechaHora: 1 });

  // 🔥 FILTRAR SOLO PARTIDOS OFICIALES
  const partidosOficiales = partidos.filter(partido => {
    const esOficial = partido.esOficialPara(equipoId);
    if (!esOficial) {
      console.log(`⚠️ Tendencia - Partido ${partido._id} excluido (${partido.obtenerTipoParaEquipo(equipoId)})`);
    }
    return esOficial;
  });

  return partidosOficiales.map((partido, index) => {
    const esLocal = partido.equipoLocal.toString() === equipoId.toString();
    const puntosEquipo = esLocal ? partido.marcador.local : partido.marcador.visitante;
    const puntosRival = esLocal ? partido.marcador.visitante : partido.marcador.local;
    
    return {
      jornada: index + 1,
      fecha: partido.fechaHora.toISOString().split('T')[0],
      puntos: puntosEquipo,
      puntosRival: puntosRival,
      resultado: puntosEquipo > puntosRival ? 'victoria' : puntosEquipo < puntosRival ? 'derrota' : 'empate',
      tipoPartido: 'oficial' // Todos son oficiales ya filtrados
    };
  });
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

// 🃏 5. ESTADÍSTICAS BÁSICAS PARA TARJETA DE EQUIPO (OPTIMIZADO) - MODIFICADO
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
      torneo: new mongoose.Types.ObjectId(torneoId),
      categoria: equipo.categoria,
      estado: 'finalizado',
      $or: [
        { equipoLocal: new mongoose.Types.ObjectId(equipoId) },
        { equipoVisitante: new mongoose.Types.ObjectId(equipoId) }
      ]
    }).select('marcador equipoLocal equipoVisitante jugadas fechaHora tipoPartido')
      .sort({ fechaHora: 1 });

    console.log(`📊 Partidos finalizados encontrados: ${partidos.length}`);

    // 🔥 FILTRAR SOLO PARTIDOS OFICIALES
    const partidosOficiales = partidos.filter(partido => {
      const esOficial = partido.esOficialPara(equipoId);
      if (!esOficial) {
        console.log(`⚠️ Tarjeta - Partido ${partido._id} excluido (${partido.obtenerTipoParaEquipo(equipoId)})`);
      }
      return esOficial;
    });

    console.log(`🔥 Partidos oficiales tras filtrado: ${partidosOficiales.length}`);

    // 🏆 CÁLCULOS BÁSICOS PARA LA TARJETA
    let estadisticasBasicas = {
      partidosJugados: partidosOficiales.length,
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

    // 📊 PROCESAR CADA PARTIDO OFICIAL
    const rachaResultados = [];
    
    partidosOficiales.forEach((partido, index) => {
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

      // 🎮 PROCESAR JUGADAS DEL PARTIDO OFICIAL (CORREGIDO)
      if (partido.jugadas && partido.jugadas.length > 0) {
        partido.jugadas.forEach(jugada => {
          try {
            // Solo contar jugadas del equipo en posesión
            if (jugada.equipoEnPosesion && jugada.equipoEnPosesion.toString() === equipoId.toString()) {
              
              // 🔧 LÓGICA CORREGIDA PARA ESTADÍSTICAS DE EQUIPO
              switch (jugada.tipoJugada) {
                case 'pase_completo':
                  estadisticasBasicas.pasesCompletos++;
                  if (jugada.resultado?.touchdown) {
                    estadisticasBasicas.touchdowns++;
                  }
                  break;
                  
                case 'pase_incompleto':
                  estadisticasBasicas.pasesIncompletos++;
                  break;
                  
                case 'corrida':
                  estadisticasBasicas.corridas++;
                  if (jugada.resultado?.touchdown) {
                    estadisticasBasicas.touchdowns++;
                  }
                  break;
                  
                case 'intercepcion':
                  // Intercepción a favor (defensiva)
                  estadisticasBasicas.intercepciones++;
                  if (jugada.resultado?.touchdown) {
                    estadisticasBasicas.touchdowns++;
                  }
                  break;
                  
                case 'sack':
                  estadisticasBasicas.sacks++;
                  break;
                  
                case 'tackleo':
                  estadisticasBasicas.tackleos++;
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

// 🏆 FUNCIÓN COMPLETA: OBTENER CLASIFICACIÓN GENERAL (TOP 5 POR CADA TIPO) - MODIFICADA PARA TIPO PARTIDO
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

    // 🔥 OBTENER TODOS LOS EQUIPOS ÚNICOS DE LOS PARTIDOS
    const equiposSet = new Set();
    partidos.forEach(partido => {
      equiposSet.add(partido.equipoLocal._id.toString());
      equiposSet.add(partido.equipoVisitante._id.toString());
    });
    const equiposIds = Array.from(equiposSet);

    // 🔥 CREAR MAPAS DE NÚMEROS DE JUGADORES POR EQUIPO
    const equiposConJugadores = await Promise.all(
      equiposIds.map(async (equipoId) => {
        const jugadores = await Usuario.find({
          'equipos.equipo': equipoId
        }).select('nombre imagen equipos');
        
        const numerosJugadores = new Map();
        jugadores.forEach(jugador => {
          const equipoData = jugador.equipos.find(e => e.equipo.toString() === equipoId.toString());
          if (equipoData) {
            numerosJugadores.set(jugador._id.toString(), equipoData.numero);
          }
        });
        
        return { equipoId, numerosJugadores };
      })
    );

    const numerosJugadoresPorEquipo = new Map();
    equiposConJugadores.forEach(({ equipoId, numerosJugadores }) => {
      numerosJugadoresPorEquipo.set(equipoId, numerosJugadores);
    });

    // 🔥 USAR LA MISMA LÓGICA EXACTA DEL DEBUG PARA TODOS LOS JUGADORES
    const estadisticasJugadores = new Map(); // jugadorId -> stats completas

    // 🔥 PROCESAR PARTIDOS CONSIDERANDO TIPO DE PARTIDO
    partidos.forEach(partido => {
      if (!partido.jugadas || partido.jugadas.length === 0) return;

      partido.jugadas.forEach(jugada => {
        // 🔥 EXACTAMENTE IGUAL QUE EN DEBUG: Analizar cada jugador involucrado
        const procesarJugador = (jugador, rol) => {
          if (!jugador) return;

          const jugadorId = jugador._id?.toString();
          if (!jugadorId) return;

          // 🔥 VERIFICAR A QUÉ EQUIPO PERTENECE Y SI EL PARTIDO ES OFICIAL PARA ESE EQUIPO
          let debeContarEstadistica = false;
          let equipoDelJugador = null;

          // Buscar en qué equipo está el jugador
          for (const [equipoId, numerosJugadores] of numerosJugadoresPorEquipo) {
            if (numerosJugadores.has(jugadorId)) {
              equipoDelJugador = equipoId;
              // Verificar si el partido es oficial para este equipo
              debeContarEstadistica = partido.esOficialPara(equipoId);
              break;
            }
          }
          
          // Solo procesar si debe contar la estadística
          if (!debeContarEstadistica || !equipoDelJugador) {
            if (!debeContarEstadistica) {
              console.log(`⚠️ Jugada de ${jugador.nombre} no cuenta (partido ${partido.obtenerTipoParaEquipo(equipoDelJugador)} para su equipo)`);
            }
            return;
          }

          // Obtener número del jugador
          const numeroJugador = numerosJugadoresPorEquipo.get(equipoDelJugador).get(jugadorId) || 0;

          // Inicializar estadísticas si no existen
          if (!estadisticasJugadores.has(jugadorId)) {
            estadisticasJugadores.set(jugadorId, {
              jugador: {
                _id: jugador._id,
                nombre: jugador.nombre,
                numero: numeroJugador,
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

            case 'corrida':
              if (esPrincipal) {
                if (jugada.resultado?.touchdown) {
                  playerStats.stats.puntos.total += 6;
                  playerStats.stats.puntos.touchdowns++;
                }
              } else if (esSecundario) {
                playerStats.stats.tackleos.total++;
              }
              break;

            case 'conversion_1pt':
              if (esPrincipal) {
                playerStats.stats.pases.intentos++;
                playerStats.stats.pases.completados++;
                playerStats.stats.pases.conversiones++;
              } else if (esSecundario) {
                playerStats.stats.recepciones.total++;
                playerStats.stats.puntos.total += 1;
              } else if (esJugadorTouchdown) {
                playerStats.stats.puntos.total += 1;
              }
              break;

            case 'conversion_2pt':
              if (esPrincipal) {
                playerStats.stats.pases.intentos++;
                playerStats.stats.pases.completados++;
                playerStats.stats.pases.conversiones++;
              } else if (esSecundario) {
                playerStats.stats.recepciones.total++;
                playerStats.stats.puntos.total += 2;
              } else if (esJugadorTouchdown) {
                playerStats.stats.puntos.total += 2;
              }
              break;

            case 'safety':
              if (esPrincipal) {
                playerStats.stats.puntos.total += 2;
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
      
      if (intentos > 0) {
        const porcentajeCompletado = (completados / intentos) * 100;
        const porcentajeTouchdowns = (touchdowns / intentos) * 100;
        const porcentajeIntercepciones = (intercepciones / intentos) * 100;

        // Fórmula simplificada de QB Rating
        const a = Math.max(0, Math.min(2.375, (porcentajeCompletado - 30) * 0.05));
        const b = Math.max(0, Math.min(2.375, (porcentajeTouchdowns) * 0.05));
        const c = Math.max(0, Math.min(2.375, 2.375 - (porcentajeIntercepciones * 0.25)));

        stats.qbRating = Math.round(((a + b + c) / 6) * 100 * 10) / 10;
        
        console.log(`🏈 ${stats.jugador.nombre}: ${completados}/${intentos}, ${touchdowns} TDs, ${intercepciones} INTs, ${conversiones} Conv → Rating: ${stats.qbRating}`);
      } else {
        stats.qbRating = 0;
      }
    });

    // 🔥 CORREGIR EQUIPOS DESPUÉS DEL PROCESAMIENTO
    console.log('🔄 Corrigiendo equipos de jugadores...');
    const jugadoresIds = Array.from(estadisticasJugadores.keys());

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

    console.log('✅ Equipos corregidos');

    // Generar clasificación para cada tipo
    const clasificacionGeneral = {};

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

      // 🔥 FORMATEAR LÍDERES CON INFORMACIÓN COMPLETA
      const lideresFormateados = top5Jugadores.map((jugador, index) => ({
        posicion: index + 1,
        jugador: jugador.jugador,
        equipo: jugador.equipo,
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
      metadatos: {
        partidosTotal: partidos.length,
        partidosOficialesProcesados: 'variable por equipo',
        jugadoresProcesados: estadisticasJugadores.size,
        equiposProcesados: equiposIds.length,
        filtradoPorTipoPartido: true
      },
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

// 🔍 DEBUG JUGADOR TEMPORADA - FUNCIÓN MODIFICADA
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

    // 🔍 2. BUSCAR INFORMACIÓN BÁSICA
    console.log('🔍 Buscando información del equipo, torneo y jugador...');
    const [equipo, torneo] = await Promise.all([
      Equipo.findById(equipoId).select('nombre imagen categoria'),
      Torneo.findById(torneoId).select('nombre')
    ]);

    if (!equipo || !torneo) {
      console.log('❌ ERROR: Equipo o torneo no encontrado');
      return res.status(404).json({ mensaje: 'Equipo o torneo no encontrado' });
    }

    // 🔍 3. BUSCAR JUGADOR CON EL NÚMERO ESPECÍFICO EN EL EQUIPO
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
        mensaje: `Jugador con número ${numeroJugador} no encontrado en el equipo ${equipo.nombre}` 
      });
    }

    const jugadorId = jugador._id.toString();
    console.log(`✅ Jugador encontrado: ${jugador.nombre} (#${numeroJugador})`);

    // 🔍 4. OBTENER TODOS LOS PARTIDOS DEL EQUIPO EN EL TORNEO
    console.log('🔍 Obteniendo partidos del equipo en el torneo...');
    const todosLosPartidos = await Partido.find({
      torneo: torneoId,
      categoria: equipo.categoria,
      $or: [
        { equipoLocal: equipoId },
        { equipoVisitante: equipoId }
      ]
    })
    .populate('equipoLocal equipoVisitante', 'nombre imagen')
    .populate('jugadas.jugadorPrincipal jugadas.jugadorSecundario jugadas.jugadorTouchdown', 'nombre imagen')
    .sort({ fechaHora: 1 });

    console.log(`📊 Total partidos del equipo: ${todosLosPartidos.length}`);

    // 🔍 5. SEPARAR PARTIDOS POR ESTADO
    const partidosFinalizados = todosLosPartidos.filter(p => p.estado === 'finalizado');
    const partidosProgramados = todosLosPartidos.filter(p => p.estado === 'programado');
    const partidosEnCurso = todosLosPartidos.filter(p => ['en_curso', 'medio_tiempo'].includes(p.estado));

    console.log(`  📊 Finalizados: ${partidosFinalizados.length}`);
    console.log(`  📊 Programados: ${partidosProgramados.length}`);
    console.log(`  📊 En curso: ${partidosEnCurso.length}`);

    // 🔥 FILTRAR SOLO PARTIDOS OFICIALES FINALIZADOS
    const partidosOficialesFinalizados = partidosFinalizados.filter(partido => {
      const esOficial = partido.esOficialPara(equipoId);
      if (!esOficial) {
        console.log(`⚠️ Debug - Partido ${partido._id} excluido (${partido.obtenerTipoParaEquipo(equipoId)})`);
      }
      return esOficial;
    });

    console.log(`🔥 Partidos oficiales finalizados tras filtrado: ${partidosOficialesFinalizados.length}`);

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

    // 🔍 6. PROCESAR SOLO PARTIDOS OFICIALES FINALIZADOS Y BUSCAR JUGADAS DEL JUGADOR
    console.log('🔍 Procesando partidos oficiales finalizados...');
    const partidosConJugadas = [];
    const todasLasJugadas = [];
    let totalJugadasInvolucrado = 0;

    // 🔥 PROCESAR SOLO PARTIDOS OFICIALES
    partidosOficialesFinalizados.forEach((partido, partidoIndex) => {
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
        puntosAnotadosEnPartido: 0,
        tipoPartido: partido.obtenerTipoParaEquipo(equipoId), // ✅ NUEVO: Info del tipo de partido
        esOficial: true // ✅ NUEVO: Todos son oficiales ya que están filtrados
      };

      // 🔍 7. PROCESAR JUGADAS DEL PARTIDO OFICIAL (LÓGICA IDÉNTICA A obtenerLideresEstadisticas)
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
              rol: esPrincipal ? 'Principal' : esSecundario ? 'Secundario' : 'Touchdown',
              puntos: 0,
              touchdown: jugada.resultado?.touchdown || false,
              tipoPartido: partido.obtenerTipoParaEquipo(equipoId) // ✅ NUEVO
            };

            // 🔍 8. LÓGICA PARA ACUMULAR ESTADÍSTICAS (IDÉNTICA A obtenerLideresEstadisticas)
            const equipoEnPosesionId = jugada.equipoEnPosesion?.toString();
            const esEquipoEnPosesion = equipoEnPosesionId === equipoId.toString();

            if (esEquipoEnPosesion) {
              switch (jugada.tipoJugada) {
                case 'pase_completo':
                  if (esPrincipal) {
                    estadisticasJugador.pases.intentos++;
                    estadisticasJugador.pases.completados++;
                    if (jugada.resultado?.touchdown) {
                      estadisticasJugador.pases.touchdowns++;
                    }
                  } else if (esSecundario) {
                    estadisticasJugador.recepciones.total++;
                    estadisticasJugador.recepciones.normales++;
                    if (jugada.resultado?.touchdown) {
                      estadisticasJugador.recepciones.touchdowns++;
                      estadisticasJugador.puntos += 6;
                      jugadaDetalle.puntos = 6;
                    }
                  }
                  break;

                case 'pase_incompleto':
                  if (esPrincipal) {
                    estadisticasJugador.pases.intentos++;
                  }
                  break;

                case 'corrida':
                  if (esPrincipal && jugada.resultado?.touchdown) {
                    estadisticasJugador.puntos += 6;
                    jugadaDetalle.puntos = 6;
                  } else if (esSecundario) {
                    estadisticasJugador.tackleos++;
                  }
                  break;

                case 'intercepcion':
                  if (esPrincipal) {
                    estadisticasJugador.intercepciones++;
                    if (jugada.resultado?.touchdown) {
                      estadisticasJugador.puntos += 6;
                      jugadaDetalle.puntos = 6;
                    }
                  } else if (esSecundario) {
                    estadisticasJugador.pases.intentos++;
                    estadisticasJugador.pases.intercepciones++;
                  }
                  break;

                case 'sack':
                  if (esPrincipal) {
                    estadisticasJugador.sacks++;
                  }
                  break;

                case 'tackleo':
                  if (esPrincipal) {
                    estadisticasJugador.tackleos++;
                  }
                  break;

                case 'conversion_1pt':
                  if (esPrincipal) {
                    estadisticasJugador.pases.intentos++;
                    estadisticasJugador.pases.completados++;
                  } else if (esSecundario) {
                    estadisticasJugador.recepciones.total++;
                    estadisticasJugador.recepciones.conversiones1pt++;
                    estadisticasJugador.puntos += 1;
                    jugadaDetalle.puntos = 1;
                  }
                  break;

                case 'conversion_2pt':
                  if (esPrincipal) {
                    estadisticasJugador.pases.intentos++;
                    estadisticasJugador.pases.completados++;
                  } else if (esSecundario) {
                    estadisticasJugador.recepciones.total++;
                    estadisticasJugador.recepciones.conversiones2pt++;
                    estadisticasJugador.puntos += 2;
                    jugadaDetalle.puntos = 2;
                  }
                  break;
              }
            }

            // Agregar jugada al compilado
            todasLasJugadas.push(jugadaDetalle);
            partidoInfo.jugadasDelJugador++;
            partidoInfo.puntosAnotadosEnPartido += jugadaDetalle.puntos;
            totalJugadasInvolucrado++;
          }
        });
      }

      // Solo agregar a partidosConJugadas si el jugador tuvo jugadas en este partido
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
      mensaje: 'Debug completo del jugador en la temporada (solo partidos oficiales)',
      
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
        partidosOficialesFinalizados: partidosOficialesFinalizados.length, // ✅ NUEVO
        partidosProgramados: partidosProgramados.length,
        partidosEnCurso: partidosEnCurso.length,
        partidosConJugadasDelJugador: partidosConJugadas.length,
        totalJugadasInvolucrado: totalJugadasInvolucrado,
        totalPuntosAnotados: estadisticasJugador.puntos,
        promedioPuntosPorPartido: promedioPuntosPorPartido,
        partidosExcluidosAmistosos: partidosFinalizados.length - partidosOficialesFinalizados.length // ✅ NUEVO
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

      // 🏟️ PARTIDOS CON JUGADAS DEL JUGADOR (SOLO OFICIALES)
      partidosConJugadas: partidosConJugadas,

      // 📝 COMPILADO DE TODAS LAS JUGADAS (SOLO DE PARTIDOS OFICIALES)
      compiladoJugadas: todasLasJugadas.sort((a, b) => 
        a.partidoNumero - b.partidoNumero || a.numeroJugada - b.numeroJugada
      ),

      // 🕒 METADATOS
      metadatos: {
        fechaConsulta: new Date().toISOString(),
        tiempoRespuesta: Date.now() - new Date(timestamp).getTime(),
        soloPartidosOficiales: true, // ✅ NUEVO
        filtroAplicado: 'Excluye partidos amistosos según tipoPartido'
      }
    };

    console.log('📤 Enviando respuesta de debug...');
    console.log(`  👤 Jugador: ${jugador.nombre} (#${numeroJugador})`);
    console.log(`  📊 Partidos con jugadas: ${partidosConJugadas.length}/${partidosOficialesFinalizados.length}`);
    console.log(`  🎮 Total jugadas: ${totalJugadasInvolucrado}`);
    console.log(`  ⚡ Puntos totales: ${estadisticasJugador.puntos}`);
    console.log(`  🏈 QB Rating: ${estadisticasJugador.qbRating}`);
    console.log(`  📡 Recepciones: ${estadisticasJugador.recepciones.total} (${estadisticasJugador.recepciones.touchdowns} TDs, ${estadisticasJugador.recepciones.conversiones1pt + estadisticasJugador.recepciones.conversiones2pt} conversiones, ${estadisticasJugador.recepciones.normales} normales)`);
    console.log(`  🔥 Partidos excluidos (amistosos): ${partidosFinalizados.length - partidosOficialesFinalizados.length}`);
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
                playerStats.stats.pases.touchdowns++;
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
                playerStats.stats.pases.touchdowns++;
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

    console.log('✅ Equipos corregidos');

    // 🔥 GENERAR CLASIFICACIÓN PARA CADA TIPO
    const clasificacionGeneral = {};
    tiposEstadisticas.forEach(tipo => {
      console.log(`\n🏆 === PROCESANDO ${tipo.toUpperCase()} ===`);
      
      const jugadoresArray = Array.from(estadisticasJugadores.values()).filter(jugador => {
        if (tipo === 'qbrating') {
          return jugador.stats.pases.intentos >= 1;
        }
        
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
    const equipoData = jugador.equipos.find(e => e.equipo.toString() === equipoId.toString());
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
                    stats.pases.touchdowns++;
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