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
      const equipoData = jugador.equipos.find(e => e.equipo.toString() === equipoId.toString());
      if (equipoData) {
        numerosJugadores.set(jugador._id.toString(), equipoData.numero);
      }
    });

    console.log('\n🔍 === DEBUG ESTADÍSTICAS ===');
    console.log(`📊 Procesando ${partidos.length} partidos para equipo: ${equipoId}`);

    let totalJugadasProcesadas = 0;
    let intercepcionesEncontradas = 0;

    partidos.forEach((partido, partidoIndex) => {
      console.log(`\n🏈 Partido ${partidoIndex + 1}: ${partido.equipoLocal.nombre} vs ${partido.equipoVisitante.nombre}`);
      console.log(`   📅 Fecha: ${partido.fechaHora}`);
      console.log(`   🎮 Jugadas: ${partido.jugadas.length}`);
      
      partido.jugadas.forEach((jugada, jugadaIndex) => {
        totalJugadasProcesadas++;
        
        // 🔍 DEBUG ESPECÍFICO PARA INTERCEPCIÓN
        if (jugada.tipoJugada === 'intercepcion') {
          intercepcionesEncontradas++;
          console.log(`\n🛡️ === INTERCEPCIÓN #${intercepcionesEncontradas} (Jugada ${jugadaIndex + 1}) ===`);
          console.log(`   📋 Tipo: ${jugada.tipoJugada}`);
          console.log(`   🏆 Resultado TD: ${jugada.resultado?.touchdown || false}`);
          console.log(`   🎯 Puntos en resultado: ${jugada.resultado?.puntos || 0}`);
          console.log(`   👤 Jugador Principal: ${jugada.jugadorPrincipal?.nombre || 'NULL'} (${jugada.jugadorPrincipal?._id})`);
          console.log(`   👤 Jugador Secundario: ${jugada.jugadorSecundario?.nombre || 'NULL'} (${jugada.jugadorSecundario?._id})`);
          console.log(`   🏈 Jugador Touchdown: ${jugada.jugadorTouchdown?.nombre || 'NULL'} (${jugada.jugadorTouchdown?._id})`);
          console.log(`   📍 Equipo en posesión: ${jugada.equipoEnPosesion}`);
          console.log(`   🎯 ¿Equipo coincide?: ${jugada.equipoEnPosesion?.toString() === equipoId.toString()}`);
        }
        
        const procesarJugador = (jugador, esSecundario = false, tipoJugador = '') => {
          if (!jugador) return;

          const jugadorId = jugador._id.toString();
          const numero = numerosJugadores.get(jugadorId);
          
          // 🔍 DEBUG PARA INTERCEPCIÓN
          if (jugada.tipoJugada === 'intercepcion') {
            console.log(`     🔍 Procesando ${tipoJugador}: ${jugador.nombre} (#${numero || 'N/A'})`);
            console.log(`        - ID: ${jugadorId}`);
            console.log(`        - ¿Tiene número en equipo?: ${!!numero}`);
            console.log(`        - Es secundario: ${esSecundario}`);
          }
          
          if (!numero) {
            if (jugada.tipoJugada === 'intercepcion') {
              console.log(`        ❌ SKIP: No tiene número en este equipo`);
            }
            return; // Solo jugadores de este equipo
          }

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
            
            if (jugada.tipoJugada === 'intercepcion') {
              console.log(`        ✅ NUEVO: Jugador creado en estadísticas`);
            }
          }

          const stats = estadisticasJugadores.get(jugadorId);
          const puntosAntes = stats.puntos;

          switch (jugada.tipoJugada) {
            case 'pase_completo':
              if (!esSecundario) {
                stats.pases.completados++;
                if (jugada.resultado.touchdown) {
                  stats.pases.touchdowns++;
                  stats.puntos += 6;
                }
              } else {
                stats.recepciones++;
              }
              break;
            case 'intercepcion':
              if (!esSecundario) {
                stats.intercepciones++;
                if (jugada.resultado.touchdown) {
                  stats.puntos += 6; // ¿Este se está ejecutando?
                }
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
              if (!esSecundario) stats.sacks++;
              break;
            case 'tackleo':
              if (!esSecundario) stats.tackleos++;
              break;
          }
          
          // 🔍 DEBUG CAMBIOS EN PUNTOS
          if (jugada.tipoJugada === 'intercepcion' && puntosAntes !== stats.puntos) {
            console.log(`        📈 PUNTOS: ${puntosAntes} → ${stats.puntos} (+${stats.puntos - puntosAntes})`);
          }
        };

        procesarJugador(jugada.jugadorPrincipal, false, 'Principal');
        procesarJugador(jugada.jugadorSecundario, true, 'Secundario');
        
        // 🔥 PROCESAR JUGADOR TOUCHDOWN
        if (jugada.jugadorTouchdown && jugada.resultado.touchdown) {
          if (jugada.tipoJugada === 'intercepcion') {
            console.log(`     🏈 Procesando ANOTADOR especial: ${jugada.jugadorTouchdown.nombre}`);
          }
          
          procesarJugador(jugada.jugadorTouchdown, false, 'Anotador TD');
          
          // Agregar puntos específicos al anotador
          const anotadorId = jugada.jugadorTouchdown._id.toString();
          if (estadisticasJugadores.has(anotadorId)) {
            const statsAnotador = estadisticasJugadores.get(anotadorId);
            const puntosAntesAnotador = statsAnotador.puntos;
            statsAnotador.puntos += 6;
            
            if (jugada.tipoJugada === 'intercepcion') {
              console.log(`        🏆 ANOTADOR: ${puntosAntesAnotador} → ${statsAnotador.puntos} (+6 por TD)`);
            }
          }
        }
        
        // 🔍 RESUMEN FINAL DE INTERCEPCIÓN
        if (jugada.tipoJugada === 'intercepcion') {
          console.log(`   📊 Estado final de jugadores:`);
          [jugada.jugadorPrincipal, jugada.jugadorSecundario, jugada.jugadorTouchdown]
            .filter(Boolean)
            .forEach(jugador => {
              const stats = estadisticasJugadores.get(jugador._id.toString());
              if (stats) {
                console.log(`      - ${jugador.nombre}: ${stats.puntos} puntos, ${stats.intercepciones} INT`);
              }
            });
        }
      });
    });

    console.log(`\n📊 === RESUMEN PROCESSING ===`);
    console.log(`🎮 Total jugadas procesadas: ${totalJugadasProcesadas}`);
    console.log(`🛡️ Intercepciones encontradas: ${intercepcionesEncontradas}`);
    console.log(`👥 Jugadores con estadísticas: ${estadisticasJugadores.size}`);

    // Mostrar jugadores con puntos
    console.log(`\n🏆 === JUGADORES CON PUNTOS ===`);
    Array.from(estadisticasJugadores.values())
      .filter(stats => stats.puntos > 0)
      .forEach(stats => {
        console.log(`   ${stats.jugador.nombre} (#${stats.jugador.numero}): ${stats.puntos} puntos`);
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
                    stats.pases.touchdowns++;
                  } else {
                    // 🔥 RECEPTOR: Recibe los puntos Y la recepción
                    stats.recepciones++;
                    stats.puntos += puntosConversion;
                  }
                  break;
                  
                case 'corrida':
                  if (!esSecundario) {
                    // CORREDOR: Si hay TD, recibe los puntos
                    if (jugada.resultado.touchdown) {
                      stats.puntos += 6;
                    }
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

// 🏆 FUNCIÓN FINAL: OBTENER CLASIFICACIÓN GENERAL (TOP 5 POR CADA TIPO)
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

    // Tipos de estadísticas para la clasificación general
    const tiposEstadisticas = ['pases', 'puntos', 'tackleos', 'intercepciones', 'sacks', 'recepciones'];
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
        categoria, torneo: { _id: torneo._id, nombre: torneo.nombre },
        tiposDisponibles: tiposEstadisticas, fechaConsulta: new Date().toISOString()
      });
    }

    console.log(`📊 Partidos encontrados: ${partidos.length}`);

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
              if (esPrincipal && jugada.resultado?.touchdown) {
                playerStats.stats.puntos.total += 6;
                playerStats.stats.puntos.touchdowns++;
              } else if (esJugadorTouchdown && jugada.resultado?.touchdown) {
                playerStats.stats.puntos.total += 6;
                playerStats.stats.puntos.touchdowns++;
              }
              break;

            case 'tackleo':
              if (esPrincipal) {
                playerStats.stats.tackleos.total++;
              }
              break;

            case 'intercepcion':
              if (esPrincipal) {
                playerStats.stats.intercepciones.total++;
              } else if (esSecundario) {
                playerStats.stats.pases.intentos++;
                playerStats.stats.pases.intercepciones++;
              }
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

            case 'touchdown':
              if (esPrincipal || esJugadorTouchdown) {
                playerStats.stats.puntos.total += 6;
                playerStats.stats.puntos.touchdowns++;
              }
              break;

            case 'conversion_1pt':
              if (esPrincipal) {
                playerStats.stats.pases.intentos++;
                playerStats.stats.pases.completados++;
                playerStats.stats.pases.touchdowns++;
              } else if (esSecundario) {
                playerStats.stats.puntos.total += 1;
                playerStats.stats.recepciones.total++;
              } else if (esJugadorTouchdown) {
                playerStats.stats.puntos.total += 1;
              }
              break;

            case 'conversion_2pt':
              if (esPrincipal) {
                playerStats.stats.pases.intentos++;
                playerStats.stats.pases.completados++;
                playerStats.stats.pases.touchdowns++;
              } else if (esSecundario) {
                playerStats.stats.puntos.total += 2;
                playerStats.stats.recepciones.total++;
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

    // 🔥 CORREGIR EQUIPOS DESPUÉS DEL PROCESAMIENTO
    console.log('🔄 Corrigiendo equipos de jugadores...');
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

    console.log('✅ Equipos corregidos');

    // Generar clasificación para cada tipo
    const clasificacionGeneral = {};

    tiposEstadisticas.forEach(tipo => {
      // Convertir a array y filtrar jugadores con estadísticas del tipo
      const jugadoresArray = Array.from(estadisticasJugadores.values()).filter(jugador => {
        const stat = tipo === 'pases' ? jugador.stats.pases.completados :
                    tipo === 'puntos' ? jugador.stats.puntos.total :
                    tipo === 'tackleos' ? jugador.stats.tackleos.total :
                    tipo === 'intercepciones' ? jugador.stats.intercepciones.total :
                    tipo === 'sacks' ? jugador.stats.sacks.total :
                    tipo === 'recepciones' ? jugador.stats.recepciones.total : 0;
        return stat > 0;
      });

      // Ordenar por estadística específica (descendente) y tomar top 5
      const top5Jugadores = jugadoresArray
        .sort((a, b) => {
          const statA = tipo === 'pases' ? a.stats.pases.completados :
                       tipo === 'puntos' ? a.stats.puntos.total :
                       tipo === 'tackleos' ? a.stats.tackleos.total :
                       tipo === 'intercepciones' ? a.stats.intercepciones.total :
                       tipo === 'sacks' ? a.stats.sacks.total :
                       tipo === 'recepciones' ? a.stats.recepciones.total : 0;
          
          const statB = tipo === 'pases' ? b.stats.pases.completados :
                       tipo === 'puntos' ? b.stats.puntos.total :
                       tipo === 'tackleos' ? b.stats.tackleos.total :
                       tipo === 'intercepciones' ? b.stats.intercepciones.total :
                       tipo === 'sacks' ? b.stats.sacks.total :
                       tipo === 'recepciones' ? b.stats.recepciones.total : 0;
          
          return statB - statA;
        })
        .slice(0, 5);

      // Formatear datos para la respuesta
      const lideresFormateados = top5Jugadores.map((jugador, index) => ({
        posicion: index + 1,
        jugador: {
          _id: jugador.jugador._id,
          nombre: jugador.jugador.nombre,
          numero: jugador.jugador.numero,
          imagen: jugador.jugador.imagen
        },
        equipo: {
          _id: jugador.equipo._id,
          nombre: jugador.equipo.nombre,
          imagen: jugador.equipo.imagen
        },
        valor: tipo === 'pases' ? jugador.stats.pases.completados :
              tipo === 'puntos' ? jugador.stats.puntos.total :
              tipo === 'tackleos' ? jugador.stats.tackleos.total :
              tipo === 'intercepciones' ? jugador.stats.intercepciones.total :
              tipo === 'sacks' ? jugador.stats.sacks.total :
              tipo === 'recepciones' ? jugador.stats.recepciones.total : 0,
        estadisticasCompletas: jugador.stats
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

exports.debugJugadorJugadas = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🔍 [${timestamp}] INICIO - Debug jugadas de jugador`);
  
  try {
    const { partidoId, numeroJugador } = req.params;
    console.log('🎯 Parámetros:', { partidoId, numeroJugador });

    // Obtener el partido con todos los datos
    const partido = await Partido.findById(partidoId)
      .populate('equipoLocal equipoVisitante', 'nombre imagen')
      .populate('jugadas.jugadorPrincipal jugadas.jugadorSecundario', 'nombre imagen');

    if (!partido) {
      return res.status(404).json({ mensaje: 'Partido no encontrado' });
    }

    // Obtener IDs de equipos
    const equipoLocalId = partido.equipoLocal._id.toString();
    const equipoVisitanteId = partido.equipoVisitante._id.toString();

    // Buscar al jugador #34 en ambos equipos
    console.log(`🔍 Buscando jugador #${numeroJugador}...`);
    
    const jugadoresLocal = await Usuario.find({
      'equipos.equipo': equipoLocalId,
      'equipos.numero': parseInt(numeroJugador)
    }).select('nombre imagen equipos');

    const jugadoresVisitante = await Usuario.find({
      'equipos.equipo': equipoVisitanteId,
      'equipos.numero': parseInt(numeroJugador)
    }).select('nombre imagen equipos');

    const jugadorEncontrado = jugadoresLocal[0] || jugadoresVisitante[0];
    
    if (!jugadorEncontrado) {
      return res.status(404).json({ 
        mensaje: `Jugador #${numeroJugador} no encontrado en ningún equipo de este partido`,
        equipos: {
          local: partido.equipoLocal.nombre,
          visitante: partido.equipoVisitante.nombre
        }
      });
    }

    const jugadorId = jugadorEncontrado._id.toString();
    const equipoDelJugador = jugadoresLocal[0] ? equipoLocalId : equipoVisitanteId;
    
    console.log(`✅ Jugador encontrado: ${jugadorEncontrado.nombre} (#${numeroJugador})`);
    console.log(`🏟️ Equipo: ${jugadoresLocal[0] ? partido.equipoLocal.nombre : partido.equipoVisitante.nombre}`);

    // Analizar todas las jugadas del partido
    const jugadasInvolucrado = [];
    let totalPuntosCalculados = 0;

    partido.jugadas.forEach((jugada, index) => {
      const jugadaAnalisis = {
        numero: index + 1,
        tipo: jugada.tipoJugada,
        descripcion: jugada.descripcion,
        equipoEnPosesion: jugada.equipoEnPosesion?.toString() === equipoLocalId ? 'Local' : 'Visitante',
        jugadorPrincipal: jugada.jugadorPrincipal ? {
          id: jugada.jugadorPrincipal._id?.toString(),
          nombre: jugada.jugadorPrincipal.nombre
        } : null,
        jugadorSecundario: jugada.jugadorSecundario ? {
          id: jugada.jugadorSecundario._id?.toString(),
          nombre: jugada.jugadorSecundario.nombre
        } : null,
        resultado: jugada.resultado,
        involucrado: false,
        rol: null,
        puntosOtorgados: 0,
        estadisticasOtorgadas: []
      };

      // Verificar si el jugador está involucrado
      const esPrincipal = jugada.jugadorPrincipal?._id?.toString() === jugadorId;
      const esSecundario = jugada.jugadorSecundario?._id?.toString() === jugadorId;
      // 🔥 NUEVO: Verificar si es jugadorTouchdown
      const esJugadorTouchdown = jugada.jugadorTouchdown?._id?.toString() === jugadorId;

      if (esPrincipal || esSecundario || esJugadorTouchdown) {
        jugadaAnalisis.involucrado = true;
        jugadaAnalisis.rol = esPrincipal ? 'Principal' : 
                           esSecundario ? 'Secundario' : 
                           'JugadorTouchdown';

        // Calcular puntos y estadísticas según la lógica actual
        switch (jugada.tipoJugada) {
          case 'pase_completo':
            if (esPrincipal) {
              jugadaAnalisis.estadisticasOtorgadas.push('pases.intentos++', 'pases.completados++');
              if (jugada.resultado?.touchdown) {
                jugadaAnalisis.estadisticasOtorgadas.push('pases.touchdowns++');
                jugadaAnalisis.estadisticasOtorgadas.push('⚠️ NO PUNTOS AL QB');
              }
            } else if (esSecundario) {
              jugadaAnalisis.estadisticasOtorgadas.push('recepciones.total++');
              if (jugada.resultado?.touchdown) {
                jugadaAnalisis.estadisticasOtorgadas.push('recepciones.touchdowns++');
                jugadaAnalisis.puntosOtorgados = 6;
                totalPuntosCalculados += 6;
                jugadaAnalisis.estadisticasOtorgadas.push('puntos.total += 6', 'puntos.touchdowns++');
              }
            } else if (esJugadorTouchdown && jugada.resultado?.touchdown) {
              // Si hay un jugadorTouchdown diferente al QB y receptor
              jugadaAnalisis.puntosOtorgados = 6;
              totalPuntosCalculados += 6;
              jugadaAnalisis.estadisticasOtorgadas.push('🎯 PUNTOS AL JUGADOR_TOUCHDOWN', 'puntos.total += 6', 'puntos.touchdowns++');
            }
            break;

          case 'pase_incompleto':
            if (esPrincipal) {
              jugadaAnalisis.estadisticasOtorgadas.push('pases.intentos++');
            }
            break;

          case 'recepcion':
            if (esPrincipal) {
              jugadaAnalisis.estadisticasOtorgadas.push('recepciones.total++');
              if (jugada.resultado?.touchdown) {
                jugadaAnalisis.estadisticasOtorgadas.push('recepciones.touchdowns++');
                jugadaAnalisis.puntosOtorgados = 6;
                totalPuntosCalculados += 6;
                jugadaAnalisis.estadisticasOtorgadas.push('puntos.total += 6', 'puntos.touchdowns++');
              }
            } else if (esJugadorTouchdown && jugada.resultado?.touchdown) {
              jugadaAnalisis.puntosOtorgados = 6;
              totalPuntosCalculados += 6;
              jugadaAnalisis.estadisticasOtorgadas.push('🎯 PUNTOS AL JUGADOR_TOUCHDOWN', 'puntos.total += 6', 'puntos.touchdowns++');
            }
            break;

          case 'corrida':
            if (esPrincipal && jugada.resultado?.touchdown) {
              jugadaAnalisis.puntosOtorgados = 6;
              totalPuntosCalculados += 6;
              jugadaAnalisis.estadisticasOtorgadas.push('puntos.total += 6', 'puntos.touchdowns++');
            } else if (esJugadorTouchdown && jugada.resultado?.touchdown) {
              jugadaAnalisis.puntosOtorgados = 6;
              totalPuntosCalculados += 6;
              jugadaAnalisis.estadisticasOtorgadas.push('🎯 PUNTOS AL JUGADOR_TOUCHDOWN', 'puntos.total += 6', 'puntos.touchdowns++');
            }
            break;

          case 'tackleo':
            if (esPrincipal) {
              jugadaAnalisis.estadisticasOtorgadas.push('tackleos.total++');
            }
            break;

          case 'intercepcion':
            if (esPrincipal) {
              jugadaAnalisis.estadisticasOtorgadas.push('intercepciones.total++');
            } else if (esSecundario) {
              jugadaAnalisis.estadisticasOtorgadas.push('pases.intentos++', 'pases.intercepciones++');
            }
            // 🔥 NUEVO: Si eres el jugadorTouchdown de la intercepción (Pick-6)
            if (esJugadorTouchdown && jugada.resultado?.touchdown) {
              jugadaAnalisis.puntosOtorgados = 6;
              totalPuntosCalculados += 6;
              jugadaAnalisis.estadisticasOtorgadas.push('🏆 PICK-6 TOUCHDOWN!', 'puntos.total += 6', 'puntos.touchdowns++');
            }
            break;

          case 'sack':
            if (esPrincipal) {
              jugadaAnalisis.estadisticasOtorgadas.push('sacks.total++');
            }
            break;

          case 'touchdown':
            if (esPrincipal || esJugadorTouchdown) {
              jugadaAnalisis.puntosOtorgados = 6;
              totalPuntosCalculados += 6;
              jugadaAnalisis.estadisticasOtorgadas.push('puntos.total += 6', 'puntos.touchdowns++');
            }
            break;

          case 'conversion_1pt':
            // ✅ Conversiones = Pases Completos + TD (misma lógica)
            if (esPrincipal) {
              // QB: Solo stats de pase, NO puntos
              jugadaAnalisis.estadisticasOtorgadas.push('pases.intentos++', 'pases.completados++', 'pases.touchdowns++');
              jugadaAnalisis.estadisticasOtorgadas.push('⚠️ NO PUNTOS AL QB');
            } else if (esSecundario) {
              // Receptor: Recepción + PUNTOS
              jugadaAnalisis.puntosOtorgados = 1;
              totalPuntosCalculados += 1;
              jugadaAnalisis.estadisticasOtorgadas.push('recepciones.total++', 'puntos.total += 1');
            } else if (esJugadorTouchdown) {
              jugadaAnalisis.puntosOtorgados = 1;
              totalPuntosCalculados += 1;
              jugadaAnalisis.estadisticasOtorgadas.push('puntos.total += 1 (como JugadorTouchdown)');
            }
            break;

          case 'conversion_2pt':
            // ✅ Conversiones = Pases Completos + TD (misma lógica)
            if (esPrincipal) {
              // QB: Solo stats de pase, NO puntos
              jugadaAnalisis.estadisticasOtorgadas.push('pases.intentos++', 'pases.completados++', 'pases.touchdowns++');
              jugadaAnalisis.estadisticasOtorgadas.push('⚠️ NO PUNTOS AL QB');
            } else if (esSecundario) {
              // Receptor: Recepción + PUNTOS
              jugadaAnalisis.puntosOtorgados = 2;
              totalPuntosCalculados += 2;
              jugadaAnalisis.estadisticasOtorgadas.push('recepciones.total++', 'puntos.total += 2');
            } else if (esJugadorTouchdown) {
              jugadaAnalisis.puntosOtorgados = 2;
              totalPuntosCalculados += 2;
              jugadaAnalisis.estadisticasOtorgadas.push('puntos.total += 2 (como JugadorTouchdown)');
            }
            break;

          case 'safety':
            if (esPrincipal) {
              jugadaAnalisis.puntosOtorgados = 2;
              totalPuntosCalculados += 2;
              jugadaAnalisis.estadisticasOtorgadas.push('puntos.total += 2');
            }
            break;
        }

        jugadasInvolucrado.push(jugadaAnalisis);
      }
    });

    console.log(`📊 Análisis completado: ${jugadasInvolucrado.length} jugadas encontradas`);
    console.log(`💰 Total puntos calculados: ${totalPuntosCalculados}`);

    res.json({
      mensaje: 'Análisis de jugadas completado',
      jugador: {
        id: jugadorId,
        nombre: jugadorEncontrado.nombre,
        numero: parseInt(numeroJugador),
        equipo: jugadoresLocal[0] ? partido.equipoLocal.nombre : partido.equipoVisitante.nombre
      },
      partido: {
        id: partido._id,
        equipos: `${partido.equipoLocal.nombre} vs ${partido.equipoVisitante.nombre}`,
        totalJugadas: partido.jugadas.length
      },
      resumen: {
        jugadasInvolucrado: jugadasInvolucrado.length,
        totalPuntosCalculados: totalPuntosCalculados,
        distribuccion: {
          comoPrincipal: jugadasInvolucrado.filter(j => j.rol === 'Principal').length,
          comoSecundario: jugadasInvolucrado.filter(j => j.rol === 'Secundario').length,
          comoJugadorTouchdown: jugadasInvolucrado.filter(j => j.rol === 'JugadorTouchdown').length
        }
      },
      jugadasDetalle: jugadasInvolucrado,
      fechaAnalisis: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error en debug de jugadas:', error);
    res.status(500).json({ 
      mensaje: 'Error al analizar jugadas del jugador', 
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
      try {
        // Solo contar jugadas del equipo en posesión
        if (jugada.equipoEnPosesion && jugada.equipoEnPosesion.toString() === equipoId.toString()) {
          
          const procesarJugador = (jugadorObj, esSecundario) => {
            if (jugadorObj && jugadorObj._id) {
              const jugadorId = jugadorObj._id.toString();
              const numero = obtenerNumeroJugador(jugadorObj._id, equipoId) || null;
              
              if (!estadisticasJugadores.has(jugadorId)) {
                estadisticasJugadores.set(jugadorId, {
                  jugador: {
                    _id: jugadorObj._id,
                    nombre: jugadorObj.nombre,
                    imagen: jugadorObj.imagen,
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

              // 🔧 LÓGICA CORREGIDA PARA ESTADÍSTICAS
              switch (jugada.tipoJugada) {
                case 'pase_completo':
                  if (!esSecundario) {
                    stats.pases.intentos++;
                    stats.pases.completados++;
                    if (jugada.resultado.touchdown) {
                      stats.puntos += 6;
                    }
                  } else {
                    stats.recepciones++;
                  }
                  break;
                  
                case 'corrida':
                  if (!esSecundario) {
                    if (jugada.resultado.touchdown) {
                      stats.puntos += 6;
                    }
                  }
                  break;
                  
                case 'intercepcion':
                  if (!esSecundario) {
                    // INTERCEPTOR: Solo estadística defensiva
                    stats.intercepciones++;
                    // ❌ NO AGREGAR PUNTOS AQUÍ - van al jugadorTouchdown
                  } else {
                    // QB INTERCEPTADO: Cuenta como intercepción lanzada
                    stats.pases.intercepciones++;
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