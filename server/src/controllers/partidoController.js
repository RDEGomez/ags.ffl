// 📁 controllers/partidoController.js - PARTE 1/4 - CORREGIDO PARA NÚMERO 0
const Partido = require('../models/Partido');
const Torneo = require('../models/Torneo');
const Equipo = require('../models/Equipo');
const Arbitro = require('../models/Arbitro');
const Usuario = require('../models/Usuario');
const { validationResult } = require('express-validator');
const { getImageUrlServer } = require('../helpers/imageUrlHelper');
const mongoose = require('mongoose');

const usuarioTieneRol = (usuario, rolesPermitidos) => {
  if (!usuario) return false;
  return rolesPermitidos.includes(usuario.rol) || 
         (usuario.rolSecundario && rolesPermitidos.includes(usuario.rolSecundario));
};

// 🔄 Helper para enriquecer jugadas con números de jugador - CORREGIDO PARA 0
const enriquecerJugadasConNumeros = async (jugadas, equipoLocalId, equipoVisitanteId) => {
  console.log('\n🔄 === ENRIQUECIENDO JUGADAS CON NÚMEROS ===');
  console.log(`📊 Total jugadas a procesar: ${jugadas.length}`);
  console.log(`🏠 Equipo Local ID: ${equipoLocalId}`);
  console.log(`✈️ Equipo Visitante ID: ${equipoVisitanteId}`);
  
  // Helper para obtener número de jugador por equipo - CORREGIDO PARA 0
  const obtenerNumeroJugador = async (jugadorId, equipoId) => {
    try {
      const usuario = await Usuario.findById(jugadorId).select('equipos');
      if (!usuario) return null;
      
      const equipoData = usuario.equipos.find(e => e.equipo.toString() === equipoId.toString());
      
      // ✅ PERMITIR NÚMERO 0 - Solo retornar null si no hay equipoData
      return equipoData ? equipoData.numero : null;
    } catch (error) {
      console.log(`❌ Error obteniendo número jugador ${jugadorId}:`, error.message);
      return null;
    }
  };

  const jugadasEnriquecidas = await Promise.all(
    jugadas.map(async (jugada, index) => {
      const jugadaObj = jugada.toObject ? jugada.toObject() : jugada;
      
      console.log(`\n🔍 Procesando jugada #${index + 1}:`);
      console.log(`  - Tipo: ${jugadaObj.tipoJugada}`);
      
      // 🔥 EXTRAER EL ID DEL OBJETO equipoEnPosesion
      let equipoEnPosesionId;
      if (jugadaObj.equipoEnPosesion) {
        if (typeof jugadaObj.equipoEnPosesion === 'object' && jugadaObj.equipoEnPosesion._id) {
          equipoEnPosesionId = jugadaObj.equipoEnPosesion._id.toString();
        } else if (typeof jugadaObj.equipoEnPosesion === 'string') {
          equipoEnPosesionId = jugadaObj.equipoEnPosesion;
        } else {
          equipoEnPosesionId = jugadaObj.equipoEnPosesion.toString();
        }
      }
      
      console.log(`  - Equipo seleccionado ID: ${equipoEnPosesionId}`);
      console.log(`  - Equipo seleccionado objeto:`, jugadaObj.equipoEnPosesion?.nombre || 'Sin nombre');
      
      // 🏠 ENRIQUECER JUGADOR PRINCIPAL
      if (jugadaObj.jugadorPrincipal && jugadaObj.jugadorPrincipal._id) {
        console.log(`  - Jugador Principal: ${jugadaObj.jugadorPrincipal.nombre} (${jugadaObj.jugadorPrincipal._id})`);
        console.log(`  - Buscando en equipo: ${equipoEnPosesionId}`);
        
        const numeroP = await obtenerNumeroJugador(jugadaObj.jugadorPrincipal._id, equipoEnPosesionId);
        jugadaObj.jugadorPrincipal.numero = numeroP;
        console.log(`  - Número asignado: #${numeroP}`);
      }
      
      // ✈️ ENRIQUECER JUGADOR SECUNDARIO (si existe)
      if (jugadaObj.jugadorSecundario && jugadaObj.jugadorSecundario._id) {
        console.log(`  - Jugador Secundario: ${jugadaObj.jugadorSecundario.nombre} (${jugadaObj.jugadorSecundario._id})`);
        
        let equipoDelJugadorSecundario = equipoEnPosesionId;
        
        // 🔥 LÓGICA ESPECIAL PARA INTERCEPCIÓN: QB está en el equipo CONTRARIO
        if (jugadaObj.tipoJugada === 'intercepcion') {
          equipoDelJugadorSecundario = equipoEnPosesionId === equipoLocalId.toString() 
            ? equipoVisitanteId.toString() 
            : equipoLocalId.toString();
          console.log(`  - Intercepción: QB buscado en equipo contrario: ${equipoDelJugadorSecundario}`);
        } else {
          console.log(`  - Otras jugadas: Jugador secundario en mismo equipo: ${equipoDelJugadorSecundario}`);
        }
        
        const numeroS = await obtenerNumeroJugador(jugadaObj.jugadorSecundario._id, equipoDelJugadorSecundario);
        jugadaObj.jugadorSecundario.numero = numeroS;
        console.log(`  - Número secundario asignado: #${numeroS}`);
      }

      // 🏈 ENRIQUECER JUGADOR TOUCHDOWN (si existe)
      if (jugadaObj.jugadorTouchdown && jugadaObj.jugadorTouchdown._id) {
        console.log(`  - Jugador Touchdown: ${jugadaObj.jugadorTouchdown.nombre} (${jugadaObj.jugadorTouchdown._id})`);
        
        const equipoDelJugadorTouchdown = equipoEnPosesionId;
        console.log(`  - Buscando jugador touchdown en equipo: ${equipoDelJugadorTouchdown}`);
        
        const numeroT = await obtenerNumeroJugador(jugadaObj.jugadorTouchdown._id, equipoDelJugadorTouchdown);
        jugadaObj.jugadorTouchdown.numero = numeroT;
        console.log(`  - Número touchdown asignado: #${numeroT}`);
      }
      
      return jugadaObj;
    })
  );
  
  console.log(`✅ ${jugadasEnriquecidas.length} jugadas enriquecidas con números`);
  return jugadasEnriquecidas;
};

// 🔥 Helper para enriquecer partidos con URLs completas
const enriquecerPartidoConUrls = async (partido, req) => {
  const partidoObj = partido.toObject ? partido.toObject() : partido;
  
  // URLs de equipos
  if (partidoObj.equipoLocal?.imagen) {
    partidoObj.equipoLocal.imagen = getImageUrlServer(partidoObj.equipoLocal.imagen, req);
  }
  if (partidoObj.equipoVisitante?.imagen) {
    partidoObj.equipoVisitante.imagen = getImageUrlServer(partidoObj.equipoVisitante.imagen, req);
  }
  
  // URLs de torneo
  if (partidoObj.torneo?.imagen) {
    partidoObj.torneo.imagen = getImageUrlServer(partidoObj.torneo.imagen, req);
  }
  
  // 🔥 URLs DE JUGADORES EN JUGADAS
  if (partidoObj.jugadas && partidoObj.jugadas.length > 0) {
    partidoObj.jugadas = partidoObj.jugadas.map(jugada => {
      const jugadaObj = jugada.toObject ? jugada.toObject() : jugada;
      
      // URL imagen jugador principal
      if (jugadaObj.jugadorPrincipal?.imagen) {
        jugadaObj.jugadorPrincipal.imagen = getImageUrlServer(jugadaObj.jugadorPrincipal.imagen, req);
      }
      
      // URL imagen jugador secundario
      if (jugadaObj.jugadorSecundario?.imagen) {
        jugadaObj.jugadorSecundario.imagen = getImageUrlServer(jugadaObj.jugadorSecundario.imagen, req);
      }
      
      // URL imagen equipo en posesión
      if (jugadaObj.equipoEnPosesion?.imagen) {
        jugadaObj.equipoEnPosesion.imagen = getImageUrlServer(jugadaObj.equipoEnPosesion.imagen, req);
      }
      
      return jugadaObj;
    });
  }
  
  // URLs de árbitros
  if (partidoObj.arbitros) {
    ['principal', 'backeador', 'estadistico'].forEach(tipo => {
      if (partidoObj.arbitros[tipo]?.usuario?.imagen) {
        partidoObj.arbitros[tipo].usuario.imagen = getImageUrlServer(
          partidoObj.arbitros[tipo].usuario.imagen, req
        );
      }
    });
  }
  
  // URLs de usuarios de sistema
  if (partidoObj.creadoPor?.imagen) {
    partidoObj.creadoPor.imagen = getImageUrlServer(partidoObj.creadoPor.imagen, req);
  }
  if (partidoObj.ultimaActualizacion?.por?.imagen) {
    partidoObj.ultimaActualizacion.por.imagen = getImageUrlServer(
      partidoObj.ultimaActualizacion.por.imagen, req
    );
  }
  
  return partidoObj;
};

// 🎲 GENERADOR DE ROL AUTOMÁTICO - FUNCIONALIDAD PRINCIPAL
exports.generarRolTorneo = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🎲 [${timestamp}] INICIO - Generar rol de torneo`);
  console.log('📨 Body recibido:', JSON.stringify(req.body, null, 2));

  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      console.log('❌ ERROR: Errores de validación:', errores.array());
      return res.status(400).json({ errores: errores.array() });
    }

    const { torneoId, categoria, tipoRol, jornadas, fechaInicio, fechaFin, configuracion = {} } = req.body;
    
    console.log('🔐 Validando permisos...');
    if (!['admin', 'arbitro'].includes(req.usuario.rol)) {
      console.log('❌ ERROR: Sin permisos para generar rol');
      return res.status(403).json({ mensaje: 'Sin permisos para generar rol' });
    }

    console.log('🔍 Obteniendo equipos del torneo...');
    const torneo = await Torneo.findById(torneoId).populate({
      path: 'equipos',
      match: { categoria: categoria, estado: 'activo' }
    });

    if (!torneo) {
      console.log('❌ ERROR: Torneo no encontrado');
      return res.status(404).json({ mensaje: 'Torneo no encontrado' });
    }

    const equipos = torneo.equipos.filter(equipo => equipo.categoria === categoria);
    console.log(`✅ Equipos encontrados: ${equipos.length} en categoría ${categoria}`);

    if (equipos.length < 2) {
      console.log('❌ ERROR: Mínimo 2 equipos requeridos');
      return res.status(400).json({ mensaje: 'Mínimo 2 equipos requeridos para generar rol' });
    }

    console.log('🏗️ Generando combinaciones de partidos...');
    let combinaciones = [];
    
    if (tipoRol === 'todos_contra_todos') {
      console.log('🔄 Modo: Todos contra todos');
      for (let i = 0; i < equipos.length; i++) {
        for (let j = i + 1; j < equipos.length; j++) {
          combinaciones.push({
            equipoLocal: equipos[i]._id,
            equipoVisitante: equipos[j]._id
          });
        }
      }
    } else if (tipoRol === 'limitado') {
      console.log(`🎯 Modo: Limitado a ${jornadas} jornadas`);
      const todasLasCombinaciones = [];
      for (let i = 0; i < equipos.length; i++) {
        for (let j = i + 1; j < equipos.length; j++) {
          todasLasCombinaciones.push({
            equipoLocal: equipos[i]._id,
            equipoVisitante: equipos[j]._id
          });
        }
      }
      
      const combinacionesAleatorias = shuffleArray(todasLasCombinaciones);
      combinaciones = combinacionesAleatorias.slice(0, jornadas);
    }

    console.log(`✅ ${combinaciones.length} combinaciones generadas`);

    console.log('📅 Distribuyendo fechas...');
    const fechas = distribuirFechasUniformemente(
      new Date(fechaInicio), 
      new Date(fechaFin), 
      combinaciones.length,
      configuracion.diasSemana || [6, 0],
      configuracion.horariosPreferidos || ['10:00', '12:00', '14:00', '16:00']
    );

    console.log('💾 Creando partidos en base de datos...');
    const partidosACrear = combinaciones.map((combo, index) => ({
      equipoLocal: combo.equipoLocal,
      equipoVisitante: combo.equipoVisitante,
      torneo: torneoId,
      categoria: categoria,
      fechaHora: fechas[index],
      estado: 'programado',
      creadoPor: req.usuario._id,
      duracionMinutos: configuracion.duracionMinutos || 50,
      sede: configuracion.sedeDefault ? {
        nombre: configuracion.sedeDefault.nombre,
        direccion: configuracion.sedeDefault.direccion,
        coordenadas: configuracion.sedeDefault.coordenadas
      } : undefined
    }));

    const partidosCreados = await Partido.insertMany(partidosACrear);
    console.log(`✅ ${partidosCreados.length} partidos creados exitosamente`);

    console.log('🔗 Actualizando torneo con los nuevos partidos...');
    await Torneo.findByIdAndUpdate(torneoId, {
      $push: { partidos: { $each: partidosCreados.map(p => p._id) } }
    });

    console.log('📤 Enviando respuesta exitosa');
    console.log(`✅ [${new Date().toISOString()}] FIN - Rol generado exitosamente\n`);

    res.status(201).json({
      mensaje: `Rol generado exitosamente: ${partidosCreados.length} partidos creados`,
      partidos: partidosCreados,
      estadisticas: {
        totalPartidos: partidosCreados.length,
        equiposInvolucrados: equipos.length,
        periodoTorneo: `${fechaInicio} a ${fechaFin}`,
        tipoRol: tipoRol,
        categoria: categoria
      }
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al generar rol:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Generar rol fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al generar rol de partidos', 
      error: error.message 
    });
  }
};
// 📁 controllers/partidoController.js - PARTE 2/4 - CRUD DE PARTIDOS

// 📋 OBTENER PARTIDOS CON FILTROS - ACTUALIZADO CON SOPORTE PARA TEMPORADA
exports.obtenerPartidos = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n📋 [${timestamp}] INICIO - Obtener partidos`);

  try {
    const { torneo, equipo, categoria, estado, fecha, page = 1, limit = 20 } = req.query;
    
    console.log('🔍 Construyendo filtros de búsqueda...');
    const filtro = {};
    if (torneo) filtro.torneo = torneo;
    if (categoria) filtro.categoria = categoria;
    if (estado) filtro.estado = estado;
    if (equipo) {
      filtro.$or = [
        { equipoLocal: equipo },
        { equipoVisitante: equipo }
      ];
    }
    if (fecha) {
      const fechaInicio = new Date(fecha);
      const fechaFin = new Date(fecha);
      fechaFin.setDate(fechaFin.getDate() + 1);
      filtro.fechaHora = {
        $gte: fechaInicio,
        $lt: fechaFin
      };
    }

    console.log('📊 Filtros aplicados:', filtro);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    console.log('🔍 Consultando partidos en base de datos...');
    
    // 🔥 OPTIMIZACIÓN: usar .lean() y selectores específicos
    const partidos = await Partido.find(filtro)
      .populate('equipoLocal', 'nombre imagen categoria')
      .populate('equipoVisitante', 'nombre imagen categoria')
      .populate('torneo', 'nombre')
      .populate({
        path: 'arbitros.principal arbitros.backeador arbitros.estadistico',
        populate: {
          path: 'usuario',
          select: 'nombre imagen'
        }
      })
      // 🔥 CLAVE: No cargar jugadas en la lista, solo lo básico
      .select('-jugadas') // ← EXCLUIR jugadas de la lista
      .lean() // ← USAR LEAN para mejor performance
      .sort({ fechaHora: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Partido.countDocuments(filtro);

    console.log(`✅ Encontrados ${partidos.length} partidos (${total} total)`);

    // 🔥 OPTIMIZACIÓN: Enriquecer directamente sin función externa pesada
    const partidosEnriquecidos = partidos.map(partido => ({
      ...partido,
      // Agregar campos calculados si los necesitas
      duracionEstimada: partido.tiempoJuego?.duracion || 0,
      tieneMarcador: !!(partido.marcador?.local || partido.marcador?.visitante)
    }));

    console.log('📤 Enviando lista de partidos');
    console.log(`✅ [${new Date().toISOString()}] FIN - Partidos obtenidos\n`);

    res.json({
      partidos: partidosEnriquecidos,
      paginacion: {
        paginaActual: parseInt(page),
        totalPaginas: Math.ceil(total / parseInt(limit)),
        totalPartidos: total,
        partidosPorPagina: parseInt(limit)
      }
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al obtener partidos:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Obtener partidos fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al obtener partidos', 
      error: error.message 
    });
  }
};

// 🔍 OBTENER PARTIDO POR ID - CORREGIDO PARA NÚMEROS
exports.obtenerPartidoPorId = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🏈 [${timestamp}] INICIO - Obtener partido detallado`);
  console.log('🆔 Partido ID:', req.params.id);

  try {
    const partidoId = req.params.id;

    console.log('🔍 Buscando partido con populate completo...');
    const partido = await Partido.findById(partidoId)
      .populate('equipoLocal', 'nombre imagen')
      .populate('equipoVisitante', 'nombre imagen')
      .populate('torneo', 'nombre fechaInicio fechaFin')
      .populate({
        path: 'arbitros.principal arbitros.backeador arbitros.estadistico',
        populate: {
          path: 'usuario',
          select: 'nombre email imagen'
        }
      })
      // 🔥 POPULATE BÁSICO DE JUGADORES (sin número porque no está en el nivel principal)
      .populate('jugadas.jugadorPrincipal', 'nombre imagen')
      .populate('jugadas.jugadorSecundario', 'nombre imagen')
      .populate('jugadas.jugadorTouchdown', 'nombre imagen') // ← 🔥 AGREGADO
      .populate('jugadas.equipoEnPosesion', 'nombre imagen')
      .populate('creadoPor', 'nombre email')
      .populate('ultimaActualizacion.por', 'nombre');

    if (!partido) {
      console.log('❌ ERROR: Partido no encontrado');
      return res.status(404).json({ mensaje: 'Partido no encontrado' });
    }

    console.log('✅ Partido encontrado:', partido.equipoLocal?.nombre, 'vs', partido.equipoVisitante?.nombre);
    console.log('🏈 Jugadas encontradas:', partido.jugadas?.length || 0);

    // 🔥 CONVERTIR A OBJETO ANTES DE ENRIQUECER
    let partidoEnriquecido = partido.toObject();
    
    // 🔥 ENRIQUECER JUGADAS CON NÚMEROS DE JUGADOR
    if (partidoEnriquecido.jugadas && partidoEnriquecido.jugadas.length > 0) {
      console.log('🔄 Procesando números de jugadores...');
      
      partidoEnriquecido.jugadas = await enriquecerJugadasConNumeros(
        partidoEnriquecido.jugadas,
        partidoEnriquecido.equipoLocal._id,
        partidoEnriquecido.equipoVisitante._id
      );
      
      // 🔥 LOG DE MUESTRA DETALLADO
      const primeraJugada = partidoEnriquecido.jugadas[0];
      console.log('\n👤 MUESTRA DE JUGADORES ENRIQUECIDOS:');
      console.log(`  🏠 Jugador Principal: ${primeraJugada.jugadorPrincipal?.nombre} #${primeraJugada.jugadorPrincipal?.numero !== undefined ? primeraJugada.jugadorPrincipal?.numero : 'N/A'}`);
      if (primeraJugada.jugadorSecundario) {
        console.log(`  ✈️ Jugador Secundario: ${primeraJugada.jugadorSecundario?.nombre} #${primeraJugada.jugadorSecundario?.numero !== undefined ? primeraJugada.jugadorSecundario?.numero : 'N/A'}`);
      }
      
      // 🔥 LOG DE VERIFICACIÓN ADICIONAL
      console.log('\n🔍 VERIFICACIÓN DE DATOS:');
      console.log(`  - Total jugadas procesadas: ${partidoEnriquecido.jugadas.length}`);
      console.log(`  - Primera jugada tiene número principal: ${primeraJugada.jugadorPrincipal?.numero !== undefined ? 'SÍ' : 'NO'}`);
    } else {
      console.log('⚠️ No hay jugadas para procesar');
    }

    // 🔥 ENRIQUECER CON URLs DE IMÁGENES
    const partidoConUrls = await enriquecerPartidoConUrls(partidoEnriquecido, req);

    console.log('📤 Enviando partido con jugadas y números completos');
    console.log(`✅ [${new Date().toISOString()}] FIN - Partido obtenido\n`);

    res.json({ partido: partidoConUrls });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al obtener partido:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Obtener partido fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al obtener partido', 
      error: error.message 
    });
  }
};

exports.obtenerJugadasPartido = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🏈 [${timestamp}] INICIO - Obtener jugadas del partido`);
  console.log('🆔 Partido ID:', req.params.id);

  try {
    const { page = 1, limit = 50 } = req.query;
    
    // 🔥 CARGAR SOLO JUGADAS con paginación
    const partido = await Partido.findById(req.params.id)
      .select('jugadas equipoLocal equipoVisitante') // Solo jugadas y equipos
      .lean();

    if (!partido) {
      console.log('❌ ERROR: Partido no encontrado');
      return res.status(404).json({ mensaje: 'Partido no encontrado' });
    }

    // 🔥 PAGINACIÓN DE JUGADAS
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const jugadasPaginadas = partido.jugadas
      .slice(skip, skip + parseInt(limit));

    console.log(`✅ Obtenidas ${jugadasPaginadas.length} jugadas (${partido.jugadas.length} total)`);

    // 🔥 ENRIQUECER JUGADAS con números de jugador (solo las paginadas)
    let jugadasEnriquecidas = jugadasPaginadas;
    
    if (jugadasPaginadas.length > 0) {
      console.log('🔄 Enriqueciendo jugadas con números de jugador...');
      
      // Usar la función existente pero solo para las jugadas paginadas
      jugadasEnriquecidas = await enriquecerJugadasConNumeros(
        jugadasPaginadas,
        partido.equipoLocal,
        partido.equipoVisitante
      );
    }

    res.json({
      jugadas: jugadasEnriquecidas,
      paginacion: {
        paginaActual: parseInt(page),
        totalPaginas: Math.ceil(partido.jugadas.length / parseInt(limit)),
        totalJugadas: partido.jugadas.length,
        jugadasPorPagina: parseInt(limit)
      }
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al obtener jugadas:`);
    console.error('💥 Error completo:', error);
    
    res.status(500).json({ 
      mensaje: 'Error al obtener jugadas del partido', 
      error: error.message 
    });
  }
};

exports.obtenerPartidosJornada = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n📅 [${timestamp}] INICIO - Obtener partidos por jornada`);

  try {
    const { torneo, categoria, jornada, incluirSinJornada = false } = req.query;
    
    if (!torneo) {
      console.log('❌ ERROR: Parámetro torneo es requerido');
      return res.status(400).json({ 
        mensaje: 'El parámetro torneo es requerido'
      });
    }

    const filtro = { torneo: torneo };
    
    if (categoria) {
      filtro.categoria = categoria;
    }

    if (jornada) {
      filtro.jornada = jornada;
    } else if (!incluirSinJornada) {
      filtro.jornada = { $ne: null };
    }

    console.log('📊 Filtro aplicado:', filtro);
    console.log('🔍 Consultando partidos...');
    
    // 🔥 OPTIMIZACIÓN: usar lean() y excluir jugadas
    const partidos = await Partido.find(filtro)
      .populate('equipoLocal', 'nombre imagen categoria')
      .populate('equipoVisitante', 'nombre imagen categoria')
      .populate('torneo', 'nombre')
      .populate({
        path: 'arbitros.principal arbitros.backeador arbitros.estadistico',
        populate: {
          path: 'usuario',
          select: 'nombre imagen'
        }
      })
      .select('-jugadas') // ← EXCLUIR jugadas
      .sort({ jornada: 1, fechaHora: 1 })
      .lean(); // ← USAR LEAN

    console.log(`✅ Encontrados ${partidos.length} partidos`);

    // Agrupar por jornada
    const partidosAgrupados = {};
    
    partidos.forEach(partido => {
      const jornadaKey = partido.jornada || 'Sin jornada';
      
      if (!partidosAgrupados[jornadaKey]) {
        partidosAgrupados[jornadaKey] = {
          jornada: jornadaKey,
          partidos: [],
          estadisticas: {
            total: 0,
            programados: 0,
            enCurso: 0,
            finalizados: 0,
            otros: 0
          }
        };
      }
      
      partidosAgrupados[jornadaKey].partidos.push(partido);
      partidosAgrupados[jornadaKey].estadisticas.total++;
      
      // Contar por estado
      switch (partido.estado) {
        case 'programado':
          partidosAgrupados[jornadaKey].estadisticas.programados++;
          break;
        case 'en_curso':
        case 'medio_tiempo':
          partidosAgrupados[jornadaKey].estadisticas.enCurso++;
          break;
        case 'finalizado':
          partidosAgrupados[jornadaKey].estadisticas.finalizados++;
          break;
        default:
          partidosAgrupados[jornadaKey].estadisticas.otros++;
      }
    });

    // Convertir a array y ordenar
    const jornadasArray = Object.values(partidosAgrupados)
      .sort((a, b) => {
        if (a.jornada === 'Sin jornada') return 1;
        if (b.jornada === 'Sin jornada') return -1;
        
        const numA = parseInt(a.jornada.replace(/\D/g, ''));
        const numB = parseInt(b.jornada.replace(/\D/g, ''));
        
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        
        return a.jornada.localeCompare(b.jornada);
      });

    console.log('📤 Enviando partidos agrupados por jornada');
    console.log(`✅ [${new Date().toISOString()}] FIN - Partidos por jornada obtenidos\n`);

    res.json({
      jornadas: jornadasArray,
      resumen: {
        totalJornadas: jornadasArray.length,
        totalPartidos: partidos.length,
        torneo: torneo,
        categoria: categoria || 'Todas'
      }
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al obtener partidos por jornada:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Obtener partidos por jornada fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al obtener partidos por jornada', 
      error: error.message 
    });
  }
};

exports.obtenerPartidosHoy = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n📅 [${timestamp}] INICIO - Obtener partidos de hoy`);

  try {
    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);
    
    const finHoy = new Date();
    finHoy.setHours(23, 59, 59, 999);

    console.log(`📅 Buscando partidos de hoy: ${inicioHoy} a ${finHoy}`);

    // 🔥 OPTIMIZACIÓN: lean() y sin jugadas
    const partidos = await Partido.find({
      fechaHora: {
        $gte: inicioHoy,
        $lte: finHoy
      }
    })
    .populate('equipoLocal', 'nombre imagen categoria')
    .populate('equipoVisitante', 'nombre imagen categoria')
    .populate('torneo', 'nombre')
    .select('-jugadas') // ← EXCLUIR jugadas
    .lean() // ← USAR LEAN
    .sort({ fechaHora: 1 });

    console.log(`✅ Encontrados ${partidos.length} partidos para hoy`);
    console.log('📤 Enviando partidos de hoy');

    res.json({ 
      partidos: partidos,
      fecha: inicioHoy.toISOString().split('T')[0],
      total: partidos.length
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al obtener partidos de hoy:`);
    console.error('💥 Error completo:', error);
    
    res.status(500).json({ 
      mensaje: 'Error al obtener partidos de hoy', 
      error: error.message 
    });
  }
};

// ➕ CREAR PARTIDO MANUAL
exports.crearPartido = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n➕ [${timestamp}] INICIO - Crear partido`);
  console.log('📨 Body recibido:', JSON.stringify(req.body, null, 2));

  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      console.log('❌ ERROR: Errores de validación:', errores.array());
      return res.status(400).json({ errores: errores.array() });
    }

    const { 
      equipoLocal, 
      equipoVisitante, 
      torneo, 
      fechaHora, 
      categoria,
      jornada,
      sede,
      duracionMinutos,
      arbitros
    } = req.body;

    console.log('🔍 Validando equipos...');
    if (equipoLocal === equipoVisitante) {
      console.log('❌ ERROR: Un equipo no puede jugar contra sí mismo');
      return res.status(400).json({ mensaje: 'Un equipo no puede jugar contra sí mismo' });
    }

    // Verificar que los equipos existen y pertenecen a la misma categoría
    const equipoLocalObj = await Equipo.findById(equipoLocal);
    const equipoVisitanteObj = await Equipo.findById(equipoVisitante);

    if (!equipoLocalObj || !equipoVisitanteObj) {
      console.log('❌ ERROR: Uno o ambos equipos no encontrados');
      return res.status(404).json({ mensaje: 'Uno o ambos equipos no encontrados' });
    }

    if (equipoLocalObj.categoria !== equipoVisitanteObj.categoria) {
      console.log('❌ ERROR: Los equipos deben ser de la misma categoría');
      return res.status(400).json({ mensaje: 'Los equipos deben ser de la misma categoría' });
    }

    console.log('💾 Creando partido...');
    const nuevoPartido = new Partido({
      equipoLocal,
      equipoVisitante,
      torneo,
      categoria: categoria || equipoLocalObj.categoria,
      fechaHora: new Date(fechaHora),
      jornada,
      sede,
      duracionMinutos: duracionMinutos || 50,
      arbitros,
      creadoPor: req.usuario._id,
      ultimaActualizacion: {
        fecha: new Date(),
        por: req.usuario._id
      }
    });

    const partidoGuardado = await nuevoPartido.save();
    
    // Popular para la respuesta
    await partidoGuardado.populate([
      { path: 'equipoLocal', select: 'nombre imagen categoria' },
      { path: 'equipoVisitante', select: 'nombre imagen categoria' },
      { path: 'torneo', select: 'nombre' }
    ]);

    console.log('✅ Partido creado exitosamente');
    console.log(`  🆔 ID: ${partidoGuardado._id}`);

    const partidoEnriquecido = await enriquecerPartidoConUrls(partidoGuardado, req);

    console.log('📤 Enviando respuesta exitosa');
    console.log(`✅ [${new Date().toISOString()}] FIN - Partido creado\n`);

    res.status(201).json({ 
      mensaje: 'Partido creado exitosamente', 
      partido: partidoEnriquecido 
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al crear partido:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Crear partido fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al crear partido', 
      error: error.message 
    });
  }
};

// ✏️ ACTUALIZAR PARTIDO - MEJORADO PARA EDITARPARTIDO
exports.actualizarPartido = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n✏️ [${timestamp}] INICIO - Actualizar partido`);
  console.log('🆔 Partido ID:', req.params.id);
  console.log('📨 Body recibido:', JSON.stringify(req.body, null, 2));

  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      console.log('❌ ERROR: Errores de validación:', errores.array());
      return res.status(400).json({ errores: errores.array() });
    }

    const partidoId = req.params.id;
    const usuarioLogueado = req.usuario;

    console.log('🔍 Buscando partido...');
    const partido = await Partido.findById(partidoId);
    if (!partido) {
      console.log('❌ ERROR: Partido no encontrado');
      return res.status(404).json({ mensaje: 'Partido no encontrado' });
    }

    console.log('✅ Partido encontrado:', partido.equipoLocal, 'vs', partido.equipoVisitante);

    // 🔥 MEJORA: Validaciones de permisos más granulares
    const puedeEditarBasico = usuarioTieneRol(usuarioLogueado, ['admin']) || 
                          (usuarioTieneRol(usuarioLogueado, ['arbitro']) && partido.estado === 'programado');
    const puedeEditarAvanzado = usuarioTieneRol(usuarioLogueado, ['admin']);

    console.log("Puede editar básico:", puedeEditarBasico);
    console.log("Puede editar avanzado:", puedeEditarAvanzado);

    // Validar permisos según tipo de cambio
    const camposAvanzados = ['estado', 'marcador'];
    const tieneCardosAvanzados = camposAvanzados.some(campo => req.body[campo] !== undefined);

    if (!puedeEditarBasico) {
      console.log('❌ ERROR: Sin permisos básicos para editar');
      return res.status(403).json({ 
        mensaje: 'No tienes permisos para editar este partido' 
      });
    }

    if (tieneCardosAvanzados && !puedeEditarAvanzado) {
      console.log('❌ ERROR: Sin permisos avanzados para cambiar estado/marcador');
      return res.status(403).json({ 
        mensaje: 'Solo administradores pueden cambiar el estado o marcador del partido' 
      });
    }

    // 🔥 MEJORA: Validar transiciones de estado si se está cambiando
    if (req.body.estado && req.body.estado !== partido.estado) {
      const transicionesValidas = {
        'programado': ['en_curso', 'suspendido', 'cancelado'],
        'en_curso': ['medio_tiempo', 'finalizado', 'suspendido'],
        'medio_tiempo': ['en_curso', 'finalizado', 'suspendido'],
        'suspendido': ['programado', 'en_curso', 'cancelado'],
        'cancelado': [], // No se puede cambiar desde cancelado
        'finalizado': ['en_curso'] // No se puede cambiar desde finalizado
      };

      if (!transicionesValidas[partido.estado].includes(req.body.estado)) {
        console.log(`❌ ERROR: Transición no válida de ${partido.estado} a ${req.body.estado}`);
        return res.status(400).json({ 
          mensaje: `No se puede cambiar el estado de ${partido.estado} a ${req.body.estado}`,
          transicionesPermitidas: transicionesValidas[partido.estado]
        });
      }
    }

    console.log('💾 Preparando actualización...');
    
    // 🔥 MEJORA: Campos permitidos más específicos
    const camposPermitidos = [
      'equipoLocal', 'equipoVisitante', 'fechaHora', 'categoria', 
      'sede', 'duracionMinutos', 'arbitros', 'observaciones', 'estado', 'jornada'
    ];

    const datosActualizados = {};
    camposPermitidos.forEach(campo => {
      if (req.body[campo] !== undefined) {
        datosActualizados[campo] = req.body[campo];
      }
    });

    // 🔥 NUEVO: Manejar actualización de marcador por separado
    if (req.body.marcador && puedeEditarAvanzado) {
      console.log('🎯 Actualizando marcador:', req.body.marcador);
      datosActualizados.marcador = {
        local: parseInt(req.body.marcador.local) || 0,
        visitante: parseInt(req.body.marcador.visitante) || 0
      };
      
      // Registrar cambio de marcador en observaciones
      const cambioMarcador = `[${timestamp}] Marcador actualizado por ${usuarioLogueado.nombre}: ${datosActualizados.marcador.local}-${datosActualizados.marcador.visitante}`;
      datosActualizados.observaciones = partido.observaciones 
        ? `${partido.observaciones}\n${cambioMarcador}`
        : cambioMarcador;
    }

    // 🔥 MEJORA: Auditoría más detallada
    datosActualizados.ultimaActualizacion = {
      fecha: new Date(),
      por: usuarioLogueado._id,
      tipo: req.body.marcador ? 'marcador' : req.body.estado ? 'estado' : 'general'
    };

    // 🔥 MEJORA: Validación de fechas
    if (datosActualizados.fechaHora) {
      const nuevaFecha = new Date(datosActualizados.fechaHora);
      const ahora = new Date();
      
      if (nuevaFecha < ahora && partido.estado === 'programado') {
        console.log('⚠️ ADVERTENCIA: Fecha en el pasado para partido programado');
        // No bloquear, solo advertir
      }
    }

    console.log('💾 Actualizando partido en base de datos...');
    const partidoActualizado = await Partido.findByIdAndUpdate(
      partidoId,
      { $set: datosActualizados },
      { new: true, runValidators: true }
    ).populate([
      { path: 'equipoLocal', select: 'nombre imagen categoria' },
      { path: 'equipoVisitante', select: 'nombre imagen categoria' },
      { path: 'torneo', select: 'nombre temporada' },
      { path: 'ultimaActualizacion.por', select: 'nombre email' }
    ]);

    console.log('✅ Partido actualizado exitosamente');

    // 🔥 MEJORA: Respuesta más rica con información de cambios
    const cambiosRealizados = Object.keys(datosActualizados).filter(key => key !== 'ultimaActualizacion');
    
    const partidoEnriquecido = await enriquecerPartidoConUrls(partidoActualizado, req);

    console.log('📤 Enviando respuesta exitosa');
    console.log(`✅ [${timestamp}] FIN - Partido actualizado\n`);

    res.json({ 
      mensaje: 'Partido actualizado exitosamente', 
      partido: partidoEnriquecido,
      cambiosRealizados,
      actualizadoPor: {
        usuario: usuarioLogueado.nombre,
        rol: usuarioLogueado.rol,
        fecha: new Date().toISOString()
      }
    });

  } catch (error) {
    console.log(`❌ [${timestamp}] ERROR al actualizar partido:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${timestamp}] FIN - Actualizar partido fallido\n`);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ mensaje: 'ID de partido no válido' });
    }
    
    res.status(500).json({ 
      mensaje: 'Error al actualizar partido', 
      error: error.message 
    });
  }
};

// 🎯 NUEVA FUNCIÓN: ACTUALIZAR MARCADOR ESPECÍFICAMENTE
exports.actualizarMarcador = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🎯 [${timestamp}] INICIO - Actualizar marcador`);
  console.log('🆔 Partido ID:', req.params.id);
  console.log('📊 Nuevo marcador:', JSON.stringify(req.body, null, 2));

  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      console.log('❌ ERROR: Errores de validación:', errores.array());
      return res.status(400).json({ errores: errores.array() });
    }

    const partidoId = req.params.id;
    const usuarioLogueado = req.usuario;
    const { local, visitante, motivo } = req.body;

    // Solo administradores pueden actualizar marcador
    if (usuarioLogueado.rol !== 'admin') {
      console.log('❌ ERROR: Sin permisos para actualizar marcador');
      return res.status(403).json({ 
        mensaje: 'Solo administradores pueden actualizar el marcador' 
      });
    }

    console.log('🔍 Buscando partido...');
    const partido = await Partido.findById(partidoId)
      .populate('equipoLocal', 'nombre')
      .populate('equipoVisitante', 'nombre');

    if (!partido) {
      console.log('❌ ERROR: Partido no encontrado');
      return res.status(404).json({ mensaje: 'Partido no encontrado' });
    }

    console.log(`🔄 Cambiando marcador: ${partido.marcador.local}-${partido.marcador.visitante} → ${local}-${visitante}`);

    // Validar marcadores
    const marcadorLocal = parseInt(local);
    const marcadorVisitante = parseInt(visitante);

    if (isNaN(marcadorLocal) || isNaN(marcadorVisitante) || 
        marcadorLocal < 0 || marcadorVisitante < 0) {
      console.log('❌ ERROR: Marcadores inválidos');
      return res.status(400).json({ 
        mensaje: 'Los marcadores deben ser números enteros no negativos' 
      });
    }

    // Guardar marcador anterior para auditoría
    const marcadorAnterior = { ...partido.marcador };

    // Actualizar marcador
    partido.marcador = {
      local: marcadorLocal,
      visitante: marcadorVisitante
    };

    // 🔥 ACTUALIZAR ESTADÍSTICAS AUTOMÁTICAMENTE
    // Nota: En una implementación completa, aquí recalcularíamos las estadísticas
    // basándose en las jugadas registradas vs el nuevo marcador

    // Registrar cambio en observaciones
    const registroAuditoria = `[${timestamp}] MARCADOR ACTUALIZADO por ${usuarioLogueado.nombre}:\n` +
                             `Anterior: ${marcadorAnterior.local}-${marcadorAnterior.visitante}\n` +
                             `Nuevo: ${marcadorLocal}-${marcadorVisitante}` +
                             (motivo ? `\nMotivo: ${motivo}` : '');

    partido.observaciones = partido.observaciones 
      ? `${partido.observaciones}\n\n${registroAuditoria}`
      : registroAuditoria;

    // Actualizar metadatos
    partido.ultimaActualizacion = {
      fecha: new Date(),
      por: usuarioLogueado._id,
      tipo: 'marcador'
    };

    await partido.save();

    console.log(`✅ Marcador actualizado exitosamente: ${marcadorLocal}-${marcadorVisitante}`);

    const partidoEnriquecido = await enriquecerPartidoConUrls(partido, req);

    console.log('📤 Enviando respuesta exitosa');
    console.log(`✅ [${timestamp}] FIN - Marcador actualizado\n`);

    res.json({ 
      mensaje: 'Marcador actualizado exitosamente',
      partido: partidoEnriquecido,
      cambio: {
        marcadorAnterior,
        marcadorNuevo: { local: marcadorLocal, visitante: marcadorVisitante },
        actualizadoPor: usuarioLogueado.nombre,
        fecha: new Date().toISOString(),
        motivo: motivo || 'No especificado'
      }
    });

  } catch (error) {
    console.log(`❌ [${timestamp}] ERROR al actualizar marcador:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${timestamp}] FIN - Actualizar marcador fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al actualizar marcador', 
      error: error.message 
    });
  }
};

// 🔄 NUEVA FUNCIÓN: OBTENER HISTORIAL DE CAMBIOS
exports.obtenerHistorialPartido = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n📋 [${timestamp}] INICIO - Obtener historial de partido`);
  console.log('🆔 Partido ID:', req.params.id);

  try {
    const partidoId = req.params.id;

    console.log('🔍 Buscando partido con historial...');
    const partido = await Partido.findById(partidoId)
      .populate('creadoPor', 'nombre email')
      .populate('ultimaActualizacion.por', 'nombre email')
      .select('observaciones creadoPor createdAt ultimaActualizacion');

    if (!partido) {
      console.log('❌ ERROR: Partido no encontrado');
      return res.status(404).json({ mensaje: 'Partido no encontrado' });
    }

    // Parsear observaciones para extraer historial
    const observaciones = partido.observaciones || '';
    const lineasHistorial = observaciones.split('\n').filter(linea => 
      linea.includes('[2024') || linea.includes('[2025') // Filtrar líneas con timestamps
    );

    const historial = [
      {
        fecha: partido.createdAt,
        accion: 'Partido creado',
        usuario: partido.creadoPor?.nombre || 'Sistema',
        tipo: 'creacion'
      }
    ];

    // Agregar eventos del historial parseado
    lineasHistorial.forEach(linea => {
      const match = linea.match(/\[([^\]]+)\]\s*(.+)/);
      if (match) {
        historial.push({
          fecha: new Date(match[1]),
          accion: match[2],
          usuario: 'Admin', // En implementación completa, extraer del texto
          tipo: linea.includes('MARCADOR') ? 'marcador' : 'general'
        });
      }
    });

    // Agregar última actualización si existe
    if (partido.ultimaActualizacion) {
      historial.push({
        fecha: partido.ultimaActualizacion.fecha,
        accion: `Última actualización (${partido.ultimaActualizacion.tipo})`,
        usuario: partido.ultimaActualizacion.por?.nombre || 'Usuario desconocido',
        tipo: partido.ultimaActualizacion.tipo || 'general'
      });
    }

    // Ordenar por fecha
    historial.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    console.log(`✅ Historial obtenido: ${historial.length} eventos`);

    console.log('📤 Enviando historial');
    console.log(`✅ [${timestamp}] FIN - Historial obtenido\n`);

    res.json({
      mensaje: 'Historial obtenido exitosamente',
      historial,
      total: historial.length
    });

  } catch (error) {
    console.log(`❌ [${timestamp}] ERROR al obtener historial:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${timestamp}] FIN - Obtener historial fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al obtener historial del partido', 
      error: error.message 
    });
  }
};

// 🔢 HELPER: CALCULAR QB RATING (REUTILIZAR DEL CÓDIGO EXISTENTE)
const calcularQBRating = (completados, intentos, touchdowns, intercepciones) => {
  if (intentos === 0) return 0;

  const a = Math.max(0, Math.min(2.375, (completados / intentos - 0.3) * 5));
  const b = Math.max(0, Math.min(2.375, (touchdowns / intentos) * 20));
  const c = Math.max(0, Math.min(2.375, 2.375 - (intercepciones / intentos) * 25));
  const d = Math.max(0, Math.min(2.375, 2.375)); // Simplificado sin yardas

  return Math.round(((a + b + c + d) / 6) * 100 * 10) / 10;
};

// 🗑️ ELIMINAR PARTIDO
exports.eliminarPartido = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🗑️ [${timestamp}] INICIO - Eliminar partido`);
  console.log('🆔 Partido ID:', req.params.id);

  try {
    const partidoId = req.params.id;

    console.log('🔍 Buscando partido...');
    const partido = await Partido.findById(partidoId);
    if (!partido) {
      console.log('❌ ERROR: Partido no encontrado');
      return res.status(404).json({ mensaje: 'Partido no encontrado' });
    }

    // Solo permitir eliminar partidos programados
    if (partido.estado !== 'programado') {
      console.log('❌ ERROR: No se puede eliminar partido que ya comenzó');
      return res.status(400).json({ 
        mensaje: 'Solo se pueden eliminar partidos que aún no han comenzado' 
      });
    }

    console.log('🗑️ Eliminando partido...');
    await Partido.findByIdAndDelete(partidoId);

    console.log('✅ Partido eliminado exitosamente');
    console.log('📤 Enviando confirmación');
    console.log(`✅ [${new Date().toISOString()}] FIN - Partido eliminado\n`);

    res.json({ mensaje: 'Partido eliminado exitosamente' });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al eliminar partido:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Eliminar partido fallido\n`);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ mensaje: 'ID de partido no válido' });
    }
    
    res.status(500).json({ 
      mensaje: 'Error al eliminar partido', 
      error: error.message 
    });
  }
};

// 🗑️ ELIMINAR ROL DE TORNEO
exports.eliminarRolTorneo = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🗑️ [${timestamp}] INICIO - Eliminar rol de torneo`);
  console.log('🎯 Torneo ID:', req.params.torneoId);
  console.log('📂 Categoría:', req.params.categoria);

  try {
    const { torneoId, categoria } = req.params;

    console.log('🔍 Eliminando partidos programados...');
    const resultado = await Partido.deleteMany({
      torneo: torneoId,
      categoria: categoria,
      estado: 'programado' // Solo eliminar los que no han empezado
    });

    console.log(`✅ ${resultado.deletedCount} partidos eliminados`);

    console.log('🔗 Actualizando torneo...');
    // Opcional: limpiar referencias en el torneo
    await Torneo.findByIdAndUpdate(torneoId, {
      $pull: { partidos: { $in: await Partido.find({ torneo: torneoId }).distinct('_id') } }
    });

    console.log('📤 Enviando confirmación');
    console.log(`✅ [${new Date().toISOString()}] FIN - Rol eliminado\n`);

    res.json({ 
      mensaje: `${resultado.deletedCount} partidos eliminados del rol`,
      partidosEliminados: resultado.deletedCount
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al eliminar rol:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Eliminar rol fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al eliminar rol de partidos', 
      error: error.message 
    });
  }
};
// 📁 controllers/partidoController.js - PARTE 3/4 - ESTADO Y JUGADAS CORREGIDO PARA NÚMERO 0

// 🎯 CAMBIAR ESTADO DE PARTIDO (FUNCIÓN BÁSICA - FASE 1)
exports.cambiarEstado = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🎯 [${timestamp}] INICIO - Cambiar estado de partido`);
  console.log('🆔 Partido ID:', req.params.id);
  console.log('📨 Nuevo estado:', req.body.estado);

  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    const { estado, motivo } = req.body;
    const partidoId = req.params.id;

    console.log('🔍 Buscando partido...');
    const partido = await Partido.findById(partidoId)
      .populate('equipoLocal', 'nombre')
      .populate('equipoVisitante', 'nombre');

    if (!partido) {
      console.log('❌ ERROR: Partido no encontrado');
      return res.status(404).json({ mensaje: 'Partido no encontrado' });
    }

    console.log(`🔄 Cambiando estado: ${partido.estado} → ${estado}`);

    // Validaciones de transición de estados
    const transicionesValidas = {
      'programado': ['en_curso', 'suspendido', 'cancelado'],
      'en_curso': ['medio_tiempo', 'finalizado', 'suspendido'],
      'medio_tiempo': ['en_curso', 'finalizado', 'suspendido'],
      'suspendido': ['programado', 'en_curso', 'cancelado'],
      'cancelado': [], // No se puede cambiar desde cancelado
      'finalizado': ['en_curso'] // No se puede cambiar desde finalizado
    };

    if (!transicionesValidas[partido.estado].includes(estado)) {
      console.log(`❌ ERROR: Transición no válida de ${partido.estado} a ${estado}`);
      return res.status(400).json({ 
        mensaje: `No se puede cambiar el estado de ${partido.estado} a ${estado}`,
        transicionesPermitidas: transicionesValidas[partido.estado]
      });
    }

    // Actualizar estado
    partido.estado = estado;
    partido.ultimaActualizacion = {
      fecha: new Date(),
      por: req.usuario._id
    };

    // Si se proporciona motivo, agregarlo a observaciones
    if (motivo) {
      partido.observaciones = partido.observaciones 
        ? `${partido.observaciones}\n[${new Date().toISOString()}] ${motivo}`
        : motivo;
    }

    await partido.save();

    console.log(`✅ Estado cambiado exitosamente a: ${estado}`);

    const partidoEnriquecido = await enriquecerPartidoConUrls(partido, req);

    console.log('📤 Enviando respuesta exitosa');
    console.log(`✅ [${new Date().toISOString()}] FIN - Estado cambiado\n`);

    res.json({ 
      mensaje: `Estado del partido cambiado a ${estado}`, 
      partido: partidoEnriquecido 
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al cambiar estado:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Cambiar estado fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al cambiar estado del partido', 
      error: error.message 
    });
  }
};

// 📝 REGISTRAR JUGADA CON NÚMEROS Y ESTRUCTURA CORRECTA - VERSIÓN CORREGIDA PARA NÚMERO 0
exports.registrarJugada = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n📝 [${timestamp}] INICIO - Registrar jugada con números (CORREGIDO PARA 0)`);
  console.log('🆔 Partido ID:', req.params.id);
  console.log('📨 Jugada:', JSON.stringify(req.body, null, 2));

  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    const partidoId = req.params.id;
    const { 
      tipoJugada, 
      equipoEnPosesion, 
      numeroJugadorPrincipal, 
      numeroJugadorSecundario,
      numeroJugadorTouchdown,
      descripcion,
      resultado = {}
    } = req.body;

    console.log('🔍 Buscando partido...');
    const partido = await Partido.findById(partidoId)
      .populate('equipoLocal', 'nombre imagen')
      .populate('equipoVisitante', 'nombre imagen')
      .populate('torneo', 'nombre fechaInicio fechaFin')
      .populate({
        path: 'arbitros.principal arbitros.backeador arbitros.estadistico',
        populate: {
          path: 'usuario',
          select: 'nombre email imagen'
        }
      })
      .populate('jugadas.jugadorPrincipal', 'nombre imagen')
      .populate('jugadas.jugadorSecundario', 'nombre imagen')
      .populate('jugadas.jugadorTouchdown', 'nombre imagen')
      .populate('jugadas.equipoEnPosesion', 'nombre imagen')
      .populate('creadoPor', 'nombre email')
      .populate('ultimaActualizacion.por', 'nombre');
      
    if (!partido) {
      console.log('❌ ERROR: Partido no encontrado');
      return res.status(404).json({ mensaje: 'Partido no encontrado' });
    }

    if (!['en_curso', 'medio_tiempo'].includes(partido.estado)) {
      console.log('❌ ERROR: Partido no está en curso');
      return res.status(400).json({ 
        mensaje: 'Solo se pueden registrar jugadas en partidos en curso' 
      });
    }

    console.log('🔍 Buscando usuarios/jugadores por equipo...');
    
    const equipoId = equipoEnPosesion;
    let nombreEquipo = '';
    let esEquipoLocal = false;
    
    if (equipoId.toString() === partido.equipoLocal._id.toString()) {
      nombreEquipo = partido.equipoLocal.nombre;
      esEquipoLocal = true;
      console.log(`📍 Equipo: LOCAL (${nombreEquipo})`);
    } else if (equipoId.toString() === partido.equipoVisitante._id.toString()) {
      nombreEquipo = partido.equipoVisitante.nombre;
      esEquipoLocal = false;
      console.log(`📍 Equipo: VISITANTE (${nombreEquipo})`);
    } else {
      console.log('❌ ERROR: Equipo no válido');
      return res.status(400).json({ mensaje: 'Equipo no válido para este partido' });
    }

    // 🔥 BUSCAR USUARIOS QUE PERTENECEN AL EQUIPO
    console.log(`🔍 Buscando usuarios del equipo ${nombreEquipo}...`);
    
    const usuariosDelEquipo = await Usuario.find({
      'equipos.equipo': equipoId
    }).select('nombre equipos');

    console.log(`👥 Usuarios encontrados: ${usuariosDelEquipo.length}`);

    // 🔥 PROCESAR JUGADORES CON SUS NÚMEROS - PERMITIR 0
    const equipoJugadores = usuariosDelEquipo.map(usuario => {
      const equipoData = usuario.equipos.find(e => e.equipo.toString() === equipoId.toString());
      return {
        _id: usuario._id,
        nombre: usuario.nombre,
        numero: equipoData.numero,
        posicion: equipoData.posicion
      };
    }).filter(jugador => jugador.numero !== undefined && jugador.numero !== null); // ✅ PERMITIR 0

    console.log('🎯 DEBUG - Jugadores en el roster:');
    console.log(`  📊 Total jugadores: ${equipoJugadores.length}`);
    equipoJugadores.forEach((jugador, index) => {
      console.log(`  ${index + 1}. #${jugador.numero} - ${jugador.nombre} (${jugador.posicion || 'N/A'})`);
    });

    console.log('🎯 DEBUG - Números que buscamos:');
    console.log(`  🔍 Principal: "${numeroJugadorPrincipal}" (Tipo: ${typeof numeroJugadorPrincipal})`);
    if (numeroJugadorSecundario !== undefined && numeroJugadorSecundario !== null && numeroJugadorSecundario !== '') {
      console.log(`  🔍 Secundario: "${numeroJugadorSecundario}" (Tipo: ${typeof numeroJugadorSecundario})`);
    }
    if (numeroJugadorTouchdown !== undefined && numeroJugadorTouchdown !== null && numeroJugadorTouchdown !== '') {
      console.log(`  🔍 Touchdown: "${numeroJugadorTouchdown}" (Tipo: ${typeof numeroJugadorTouchdown})`);
    }

    // 🔥 FUNCIÓN DE BÚSQUEDA CORREGIDA PARA PERMITIR NÚMERO 0
    const buscarJugadorPorNumero = (numero, nombreCampo) => {
      // ✅ PERMITIR 0 - Solo rechazar undefined, null o string vacío
      if (numero === undefined || numero === null || numero === '') {
        return { jugador: null, encontrado: true };
      }
      
      console.log(`\n🔍 Buscando jugador #${numero} para ${nombreCampo}:`);
      const numeroBuscado = parseInt(numero);
      console.log(`  📝 Número convertido: ${numeroBuscado}`);
      
      // ✅ VALIDAR QUE ES UN NÚMERO VÁLIDO (incluyendo 0)
      if (isNaN(numeroBuscado) || numeroBuscado < 0) {
        console.log(`  ❌ Número inválido: ${numero}`);
        return { jugador: null, encontrado: false };
      }
      
      const jugador = equipoJugadores.find(j => {
        const numeroJugador = parseInt(j.numero);
        console.log(`  🔍 Comparando: ${numeroJugador} === ${numeroBuscado} ? ${numeroJugador === numeroBuscado}`);
        return numeroJugador === numeroBuscado;
      });
      
      const encontrado = !!jugador;
      
      if (!encontrado) {
        console.log(`  ❌ Jugador #${numero} NO encontrado en ${nombreEquipo} (${nombreCampo})`);
        console.log(`  📋 Números disponibles: [${equipoJugadores.map(j => j.numero).join(', ')}]`);
      } else {
        console.log(`  ✅ Jugador encontrado: #${jugador.numero} ${jugador.nombre} (${nombreCampo})`);
      }
      
      return { jugador: jugador || null, encontrado };
    };

    // 🔍 Buscar jugadores - LÓGICA ESPECIAL PARA INTERCEPCIÓN
    const { jugador: jugadorPrincipal, encontrado: principal_encontrado } = 
      buscarJugadorPorNumero(numeroJugadorPrincipal, 'Principal');

    let jugadorSecundario = null;
    let secundario_encontrado = true;

    if (numeroJugadorSecundario !== undefined && numeroJugadorSecundario !== null && numeroJugadorSecundario !== '') {
      if (tipoJugada === 'intercepcion') {
        // Para intercepción, buscar QB en el equipo CONTRARIO
        const equipoContrario = equipoId.toString() === partido.equipoLocal._id.toString()
          ? partido.equipoVisitante._id
          : partido.equipoLocal._id;
        
        console.log(`🔍 Buscando QB #${numeroJugadorSecundario} en equipo contrario...`);
        
        const usuariosEquipoContrario = await Usuario.find({
          'equipos.equipo': equipoContrario
        }).select('nombre equipos');

        const jugadoresEquipoContrario = usuariosEquipoContrario.map(usuario => {
          const equipoData = usuario.equipos.find(e => e.equipo.toString() === equipoContrario.toString());
          return {
            _id: usuario._id,
            nombre: usuario.nombre,
            numero: equipoData ? equipoData.numero : null,
            posicion: equipoData ? equipoData.posicion : null
          };
        }).filter(jugador => jugador.numero !== undefined && jugador.numero !== null); // ✅ PERMITIR 0

        jugadorSecundario = jugadoresEquipoContrario.find(j => parseInt(j.numero) === parseInt(numeroJugadorSecundario));
        secundario_encontrado = !!jugadorSecundario;
        
      } else if (tipoJugada === 'corrida' || tipoJugada === 'sack' || tipoJugada === 'tackleo') {
        // ✅ AGREGAR ESTA CONDICIÓN: Para jugadas defensivas, buscar en equipo CONTRARIO
        const equipoContrario = equipoId.toString() === partido.equipoLocal._id.toString()
          ? partido.equipoVisitante._id
          : partido.equipoLocal._id;
        
        console.log(`🔍 Buscando tackleador #${numeroJugadorSecundario} en equipo contrario (defensivo)...`);
        
        const usuariosEquipoContrario = await Usuario.find({
          'equipos.equipo': equipoContrario
        }).select('nombre equipos');

        const jugadoresEquipoContrario = usuariosEquipoContrario.map(usuario => {
          const equipoData = usuario.equipos.find(e => e.equipo.toString() === equipoContrario.toString());
          return {
            _id: usuario._id,
            nombre: usuario.nombre,
            numero: equipoData ? equipoData.numero : null,
            posicion: equipoData ? equipoData.posicion : null
          };
        }).filter(jugador => jugador.numero !== undefined && jugador.numero !== null); // ✅ PERMITIR 0

        jugadorSecundario = jugadoresEquipoContrario.find(j => parseInt(j.numero) === parseInt(numeroJugadorSecundario));
        secundario_encontrado = !!jugadorSecundario;
        
      } else {
        // Para todas las demás jugadas (pases), buscar en el mismo equipo
        jugadorSecundario = equipoJugadores.find(j => parseInt(j.numero) === parseInt(numeroJugadorSecundario));
        secundario_encontrado = !!jugadorSecundario;
      }
    }

    // Buscar jugador que anotó touchdown (si aplica)
    const { jugador: jugadorTouchdown, encontrado: touchdown_encontrado } = 
      buscarJugadorPorNumero(numeroJugadorTouchdown, 'Touchdown');

    console.log('📊 Resumen de búsqueda:');
    console.log(`  🎯 Principal (#${numeroJugadorPrincipal}): ${principal_encontrado ? '✅' : '❌'}`);
    if (numeroJugadorSecundario !== undefined && numeroJugadorSecundario !== null && numeroJugadorSecundario !== '') {
      console.log(`  🎯 Secundario (#${numeroJugadorSecundario}): ${secundario_encontrado ? '✅' : '❌'}`);
    }
    if (numeroJugadorTouchdown !== undefined && numeroJugadorTouchdown !== null && numeroJugadorTouchdown !== '') {
      console.log(`  🎯 Touchdown (#${numeroJugadorTouchdown}): ${touchdown_encontrado ? '✅' : '❌'}`);
    }

    console.log('⚽ Creando nueva jugada...');
    
    let puntos = 0;
    let touchdown = false;
    let intercepcion = false;
    let sack = false;

    switch (tipoJugada) {
      case 'conversion_1pt':
        puntos = 1;
        break;
      case 'conversion_2pt':
        puntos = 2;
        break;
      case 'safety':
        puntos = 2;
        break;
      case 'intercepcion':
        intercepcion = true;
        if (resultado.touchdown) {
          puntos = 6;
          touchdown = true;
        }
        break;
      case 'corrida':
        // 🚀 AQUÍ ESTÁ EL PROBLEMA - NECESITA ESTA CORRECCIÓN:
        if (resultado.touchdown) {
          puntos = 6;
          touchdown = true;
        }
        else if (resultado.puntos !== undefined && resultado.puntos == 2) {
          puntos = resultado.puntos;
          if (puntos === 2) {
            // Es una conversión de 2 puntos corriendo
            touchdown = false; // No es TD, es conversión
          }
        }
        break;
      // 🔥 NUEVO: agregar checkbox TD para pase_completo
      case 'pase_completo':
        if (resultado.touchdown) {
          puntos = 6;
          touchdown = true;
        }
        break;
      case 'pase_incompleto':
        // Sin puntos ni checkboxes
        break;
      case 'sack':
        sack = true;
        break;
      case 'tackleo':
        puntos = 0;
        break;
      default:
        puntos = 0;
    }

    console.log('\n🔍 === DEBUG JUGADOR TOUCHDOWN ===');
    console.log('📨 Request body recibido:', JSON.stringify(req.body, null, 2));
    console.log('🎯 numeroJugadorTouchdown del request:', req.body.numeroJugadorTouchdown);
    console.log('🎯 Tipo de numeroJugadorTouchdown:', typeof req.body.numeroJugadorTouchdown);

    // Debug de la búsqueda del jugador touchdown
    if (req.body.numeroJugadorTouchdown !== undefined && req.body.numeroJugadorTouchdown !== null && req.body.numeroJugadorTouchdown !== '') {
      console.log('🔍 Iniciando búsqueda de jugador touchdown...');
      const { jugador: jugadorTouchdown, encontrado: touchdown_encontrado } = 
        buscarJugadorPorNumero(req.body.numeroJugadorTouchdown, 'Touchdown');
      
      console.log('🏈 Resultado búsqueda jugadorTouchdown:');
      console.log(`   - Encontrado: ${touchdown_encontrado}`);
      console.log(`   - Jugador: ${jugadorTouchdown ? jugadorTouchdown.nombre : 'NULL'}`);
      console.log(`   - ID: ${jugadorTouchdown ? jugadorTouchdown._id : 'NULL'}`);
    } else {
      console.log('⚠️ numeroJugadorTouchdown NO viene en el request');
    }

    // Debug del objeto resultado que viene del frontend
    console.log('📊 resultado del request:', JSON.stringify(req.body.resultado, null, 2));

    // Debug antes de crear la jugada
    console.log('\n🏗️ === ANTES DE CREAR JUGADA ===');
    console.log('🏈 jugadorTouchdown final:', jugadorTouchdown ? {
      _id: jugadorTouchdown._id,
      nombre: jugadorTouchdown.nombre,
      numero: jugadorTouchdown.numero
    } : 'NULL');

    const nuevaJugada = {
      _id: new mongoose.Types.ObjectId(),
      numero: partido.jugadas.length + 1,
      tiempo: {
        minuto: Math.min(partido.jugadas.length * 2, 49),
        segundo: Math.floor(Math.random() * 60),
        periodo: partido.tiempoJuego?.periodo || 1
      },
      equipoEnPosesion,
      tipoJugada,
      descripcion,
      jugadorPrincipal: jugadorPrincipal ? jugadorPrincipal._id : null,
      jugadorSecundario: jugadorSecundario ? jugadorSecundario._id : null,
      jugadorTouchdown: jugadorTouchdown ? jugadorTouchdown._id : null, // 🔍 DEBUG ESTO
      resultado: { touchdown, intercepcion, sack, puntos },
      registradoPor: req.usuario._id,
      fechaRegistro: new Date()
    };

    console.log('\n✅ === JUGADA CREADA ===');
    console.log('🏈 nuevaJugada.jugadorTouchdown:', nuevaJugada.jugadorTouchdown);
    console.log('🏆 nuevaJugada.resultado:', JSON.stringify(nuevaJugada.resultado, null, 2));

    partido.jugadas.push(nuevaJugada);

    // Actualizar marcador - LÓGICA SIMPLIFICADA
    if (nuevaJugada.resultado.puntos > 0) {
      const equipoQueAnotaStr = equipoEnPosesion.toString(); // Ahora es "equipo al que se asigna la jugada"
      const equipoLocalStr = partido.equipoLocal._id.toString();

      // LOS PUNTOS SIEMPRE VAN AL EQUIPO AL QUE SE ASIGNA LA JUGADA
      if (equipoQueAnotaStr === equipoLocalStr) {
        partido.marcador.local += nuevaJugada.resultado.puntos;
        console.log(`🏆 +${nuevaJugada.resultado.puntos} puntos para equipo LOCAL (${nombreEquipo})`);
      } else {
        partido.marcador.visitante += nuevaJugada.resultado.puntos;
        console.log(`🏆 +${nuevaJugada.resultado.puntos} puntos para equipo VISITANTE (${nombreEquipo})`);
      }
    }

    await partido.save();

    const warnings = [];
    if (!principal_encontrado && numeroJugadorPrincipal !== undefined && numeroJugadorPrincipal !== null && numeroJugadorPrincipal !== '') {
      warnings.push(`Jugador #${numeroJugadorPrincipal} no encontrado en ${nombreEquipo}`);
    }
    if (!secundario_encontrado && numeroJugadorSecundario !== undefined && numeroJugadorSecundario !== null && numeroJugadorSecundario !== '') {
      const equipoSecundario = tipoJugada === 'intercepcion' ? 'equipo contrario' : nombreEquipo;
      warnings.push(`Jugador #${numeroJugadorSecundario} no encontrado en ${equipoSecundario}`);
    }
    if (!touchdown_encontrado && numeroJugadorTouchdown !== undefined && numeroJugadorTouchdown !== null && numeroJugadorTouchdown !== '') {
      warnings.push(`Jugador #${numeroJugadorTouchdown} no encontrado en ${nombreEquipo}`);
    }

    console.log('\n🔍 VERIFICACIÓN FINAL DE JUGADORES:');
    console.log(`  - Tipo de jugada: ${tipoJugada}`);
    console.log(`  - Equipo seleccionado: ${nombreEquipo}`);
    console.log(`  - Principal encontrado: ${principal_encontrado} -> ${jugadorPrincipal?.nombre || 'NULL'}`);
    console.log(`  - Secundario encontrado: ${secundario_encontrado} -> ${jugadorSecundario?.nombre || 'NULL'}`);
    console.log(`  - ¿Es intercepción?: ${tipoJugada === 'intercepcion'}`);

    // ✅ RESPUESTA CON NÚMEROS INCLUIDOS (INCLUYENDO 0)
    const respuesta = {
      mensaje: 'Jugada registrada exitosamente',
      warnings: warnings.length > 0 ? warnings : undefined,
      jugada: {
        ...nuevaJugada,
        jugadorPrincipal: jugadorPrincipal ? {
          _id: jugadorPrincipal._id,
          nombre: jugadorPrincipal.nombre,
          numero: jugadorPrincipal.numero // ✅ INCLUYE 0
        } : null,
        jugadorSecundario: jugadorSecundario ? {
          _id: jugadorSecundario._id,
          nombre: jugadorSecundario.nombre,
          numero: jugadorSecundario.numero // ✅ INCLUYE 0
        } : null,
        jugadorTouchdown: jugadorTouchdown ? {
          _id: jugadorTouchdown._id,
          nombre: jugadorTouchdown.nombre,
          numero: jugadorTouchdown.numero // ✅ INCLUYE 0
        } : null
      },
      marcadorActualizado: partido.marcador,
      numeroJugada: nuevaJugada.numero
    };

    console.log('📤 Enviando respuesta exitosa');
    console.log(`✅ [${new Date().toISOString()}] FIN - Jugada registrada\n`);

    res.status(201).json(respuesta);

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al registrar jugada:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Registrar jugada fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al registrar jugada', 
      error: error.message 
    });
  }
};

// 🗑️ ELIMINAR JUGADA
exports.eliminarJugada = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🗑️ [${timestamp}] INICIO - Eliminar jugada por ID`);
  
  try {
    const { partidoId, jugadaId } = req.params;
    console.log('🎯 Partido ID:', partidoId);
    console.log('🎯 Jugada ID:', jugadaId);
    
    const partido = await Partido.findById(partidoId);
    
    if (!partido) {
      console.log('❌ ERROR: Partido no encontrado');
      return res.status(404).json({ mensaje: 'Partido no encontrado' });
    }
    
    // Buscar jugada por ID
    const jugadaIndex = partido.jugadas.findIndex(
      j => j._id.toString() === jugadaId
    );
    
    if (jugadaIndex === -1) {
      console.log('❌ ERROR: Jugada no encontrada');
      return res.status(404).json({ mensaje: 'Jugada no encontrada' });
    }
    
    const jugadaEliminada = partido.jugadas[jugadaIndex];
    console.log(`🎯 Eliminando jugada: ${jugadaEliminada.tipoJugada} (${jugadaEliminada.resultado?.puntos || 0} pts)`);
    
    // Eliminar jugada específica
    partido.jugadas.splice(jugadaIndex, 1);
    
    // 🔥 RECALCULAR MARCADOR COMPLETO (más seguro)
    partido.marcador.local = 0;
    partido.marcador.visitante = 0;
    
    partido.jugadas.forEach(jugada => {
      if (jugada.resultado?.puntos > 0) {
        const esLocal = jugada.equipoEnPosesion.toString() === partido.equipoLocal.toString();
        if (esLocal) {
          partido.marcador.local += jugada.resultado.puntos;
        } else {
          partido.marcador.visitante += jugada.resultado.puntos;
        }
      }
    });
    
    // Actualizar metadatos
    partido.ultimaActualizacion = {
      fecha: new Date(),
      por: req.usuario._id
    };
    
    await partido.save();
    
    console.log(`✅ Jugada eliminada exitosamente`);
    console.log(`📊 Marcador recalculado: ${partido.marcador.local} - ${partido.marcador.visitante}`);
    
    res.json({ 
      mensaje: 'Jugada eliminada exitosamente',
      jugadaEliminada: {
        _id: jugadaEliminada._id,
        tipo: jugadaEliminada.tipoJugada,
        puntos: jugadaEliminada.resultado?.puntos || 0
      },
      marcadorActualizado: partido.marcador,
      totalJugadas: partido.jugadas.length
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al eliminar jugada:`);
    console.error('💥 Error completo:', error);
    res.status(500).json({ 
      mensaje: 'Error al eliminar jugada', 
      error: error.message 
    });
  }
};
// 📁 controllers/partidoController.js - PARTE 4/4 - ÁRBITROS, CONSULTAS Y HELPERS FINAL

// ⚖️ ASIGNAR/DESASIGNAR ÁRBITROS - ACTUALIZACIÓN CORREGIDA
exports.asignarArbitros = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n⚖️ [${timestamp}] INICIO - Asignar/Desasignar árbitros`);
  console.log('🆔 Partido ID:', req.params.id);
  console.log('📨 Árbitros:', JSON.stringify(req.body, null, 2));

  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    const partidoId = req.params.id;
    const { principal, backeador, estadistico } = req.body;

    console.log('🔍 Buscando partido...');
    const partido = await Partido.findById(partidoId);
    if (!partido) {
      console.log('❌ ERROR: Partido no encontrado');
      return res.status(404).json({ mensaje: 'Partido no encontrado' });
    }

    // 🔥 NUEVA LÓGICA: Separar asignaciones de desasignaciones
    const asignaciones = {};
    const posiciones = { principal, backeador, estadistico };
    
    for (const [posicion, arbitroId] of Object.entries(posiciones)) {
      if (arbitroId !== undefined) {
        console.log(`🔄 Procesando posición: ${posicion} con valor: ${arbitroId}`);
        
        if (arbitroId === null || arbitroId === "" || arbitroId === "null") {
          // 🔥 DESASIGNACIÓN
          console.log(`🚫 Desasignando posición: ${posicion}`);
          partido.arbitros[posicion] = null;
        } else {
          // 🔥 ASIGNACIÓN - guardar para validar después
          console.log(`✅ Preparando asignación: ${arbitroId} → ${posicion}`);
          asignaciones[posicion] = arbitroId;
        }
      }
    }

    // 🔥 VALIDAR SOLO LAS ASIGNACIONES (no las desasignaciones)
    const arbitrosAValidar = Object.values(asignaciones);
    
    if (arbitrosAValidar.length > 0) {
      console.log(`🔍 Validando ${arbitrosAValidar.length} árbitros a asignar...`);
      
      const arbitrosValidos = await Arbitro.find({
        _id: { $in: arbitrosAValidar },
        disponible: true,
        estado: 'activo'
      }).populate('usuario');

      if (arbitrosValidos.length !== arbitrosAValidar.length) {
        console.log('❌ ERROR: Uno o más árbitros no están disponibles');
        return res.status(400).json({ 
          mensaje: 'Uno o más árbitros no están disponibles o no existen' 
        });
      }

      // 🔥 VALIDAR ROLES: Verificar que los árbitros pueden arbitrar
      for (const arbitro of arbitrosValidos) {
        const puedeArbitrar = arbitro.usuario.rol === 'arbitro' || arbitro.usuario.rolSecundario === 'arbitro';
        if (!puedeArbitrar) {
          console.log(`❌ ERROR: ${arbitro.usuario.nombre} no tiene rol de árbitro`);
          return res.status(400).json({ 
            mensaje: `${arbitro.usuario.nombre} no tiene permisos para arbitrar` 
          });
        }
      }

      // Realizar las asignaciones después de validar
      for (const [posicion, arbitroId] of Object.entries(asignaciones)) {
        console.log(`✅ Asignando ${arbitroId} a posición ${posicion}`);
        partido.arbitros[posicion] = arbitroId;
      }

      console.log('✅ Todos los árbitros son válidos y asignados');
    }

    // Actualizar metadatos
    partido.ultimaActualizacion = {
      fecha: new Date(),
      por: req.usuario._id
    };

    await partido.save();

    // Popular para la respuesta
    await partido.populate({
      path: 'arbitros.principal arbitros.backeador arbitros.estadistico',
      populate: {
        path: 'usuario',
        select: 'nombre imagen email rol rolSecundario'
      }
    });

    console.log('✅ Árbitros actualizados exitosamente');
    console.log(`  📋 Principal: ${partido.arbitros.principal?.usuario?.nombre || 'No asignado'}`);
    console.log(`  📋 Backeador: ${partido.arbitros.backeador?.usuario?.nombre || 'No asignado'}`);
    console.log(`  📋 Estadístico: ${partido.arbitros.estadistico?.usuario?.nombre || 'No asignado'}`);

    const partidoEnriquecido = await enriquecerPartidoConUrls(partido, req);

    console.log('📤 Enviando respuesta exitosa');
    console.log(`✅ [${new Date().toISOString()}] FIN - Árbitros actualizados\n`);

    res.json({ 
      mensaje: 'Árbitros actualizados exitosamente', 
      partido: partidoEnriquecido,
      arbitrosAsignados: {
        principal: partido.arbitros.principal?.usuario?.nombre || null,
        backeador: partido.arbitros.backeador?.usuario?.nombre || null,
        estadistico: partido.arbitros.estadistico?.usuario?.nombre || null
      }
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al asignar/desasignar árbitros:`);
    console.error('💥 Error completo:', error);
    
    // 🔥 MEJOR MANEJO DE ERRORES
    if (error.name === 'CastError' || error.kind === 'ObjectId') {
      return res.status(400).json({ mensaje: 'ID de árbitro o partido no válido' });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ mensaje: 'Datos de validación incorrectos', detalles: error.message });
    }
    
    console.log(`❌ [${new Date().toISOString()}] FIN - Asignar árbitros fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al asignar/desasignar árbitros', 
      error: error.message 
    });
  }
};

/**
 * 📅 OBTENER JORNADAS DISPONIBLES
 * Endpoint: GET /api/partidos/jornadas
 * Query params: ?torneo={id}&categoria={cat}
 */
exports.obtenerJornadasDisponibles = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n📅 [${timestamp}] INICIO - Obtener jornadas disponibles`);

  try {
    const { torneo, categoria } = req.query;
    
    console.log('🔍 Parámetros recibidos:', { torneo, categoria });

    // Validar que al menos torneo esté presente
    if (!torneo) {
      console.log('❌ ERROR: Parámetro torneo es requerido');
      return res.status(400).json({ 
        mensaje: 'El parámetro torneo es requerido',
        ejemplo: '/api/partidos/jornadas?torneo=64f1b2c3d4e5f6789012345&categoria=mixgold'
      });
    }

    // Verificar que el torneo existe
    console.log('🏆 Verificando existencia del torneo...');
    const torneoExistente = await Torneo.findById(torneo);
    if (!torneoExistente) {
      console.log('❌ ERROR: Torneo no encontrado');
      return res.status(404).json({ mensaje: 'Torneo no encontrado' });
    }

    console.log(`✅ Torneo encontrado: ${torneoExistente.nombre}`);

    // Construir filtro para la consulta
    const filtro = { torneo: torneo };
    
    // Agregar filtro de categoría si se proporciona
    if (categoria) {
      console.log(`🏷️ Filtrando por categoría: ${categoria}`);
      filtro.categoria = categoria;
      
      // Validar que la categoría existe en el torneo
      if (!torneoExistente.categorias.includes(categoria)) {
        console.log('⚠️ WARNING: Categoría no está en el torneo, pero continuando...');
      }
    }

    console.log('📊 Filtro aplicado:', filtro);

    // Usar el método estático del modelo para obtener jornadas
    console.log('🔍 Consultando jornadas disponibles...');
    const jornadas = await Partido.obtenerJornadasDisponibles(torneo, categoria);

    console.log(`✅ Encontradas ${jornadas.length} jornadas:`);
    jornadas.forEach((jornada, index) => {
      console.log(`  ${index + 1}. ${jornada}`);
    });

    // Obtener información adicional por jornada
    console.log('📈 Obteniendo estadísticas por jornada...');
    const estadisticasPorJornada = await Promise.all(
      jornadas.map(async (jornada) => {
        const partidosJornada = await Partido.find({ ...filtro, jornada })
          .select('estado fechaHora')
          .lean();

        const estadisticas = {
          jornada: jornada,
          totalPartidos: partidosJornada.length,
          programados: partidosJornada.filter(p => p.estado === 'programado').length,
          enCurso: partidosJornada.filter(p => ['en_curso', 'medio_tiempo'].includes(p.estado)).length,
          finalizados: partidosJornada.filter(p => p.estado === 'finalizado').length,
          otros: partidosJornada.filter(p => !['programado', 'en_curso', 'medio_tiempo', 'finalizado'].includes(p.estado)).length
        };

        // Calcular fechas de la jornada
        if (partidosJornada.length > 0) {
          const fechas = partidosJornada.map(p => new Date(p.fechaHora)).sort();
          estadisticas.fechaInicio = fechas[0].toISOString().split('T')[0];
          estadisticas.fechaFin = fechas[fechas.length - 1].toISOString().split('T')[0];
        }

        return estadisticas;
      })
    );

    // Calcular totales generales
    const totales = {
      totalJornadas: jornadas.length,
      totalPartidos: estadisticasPorJornada.reduce((sum, j) => sum + j.totalPartidos, 0),
      totalProgramados: estadisticasPorJornada.reduce((sum, j) => sum + j.programados, 0),
      totalEnCurso: estadisticasPorJornada.reduce((sum, j) => sum + j.enCurso, 0),
      totalFinalizados: estadisticasPorJornada.reduce((sum, j) => sum + j.finalizados, 0)
    };

    console.log('📤 Enviando respuesta exitosa');
    console.log(`✅ [${new Date().toISOString()}] FIN - Jornadas obtenidas\n`);

    res.json({
      mensaje: 'Jornadas disponibles obtenidas exitosamente',
      torneo: {
        id: torneoExistente._id,
        nombre: torneoExistente.nombre
      },
      categoria: categoria || 'todas',
      jornadas: jornadas,
      estadisticasPorJornada: estadisticasPorJornada,
      totales: totales,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al obtener jornadas:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Obtener jornadas fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al obtener jornadas disponibles', 
      error: error.message 
    });
  }
};

// 🔥 NUEVO ENDPOINT ALTERNATIVO: OBTENER PARTIDOS AGRUPADOS POR JORNADA
// Endpoint: GET /api/partidos/agrupados-por-jornada
/**
 * 📊 OBTENER PARTIDOS AGRUPADOS POR JORNADA
 * Útil para la vista de dashboard por jornadas
 */
exports.obtenerPartidosAgrupadosPorJornada = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n📊 [${timestamp}] INICIO - Obtener partidos agrupados por jornada`);

  try {
    const { torneo, categoria, jornada, incluirSinJornada = false } = req.query;
    
    console.log('🔍 Parámetros recibidos:', { torneo, categoria, jornada, incluirSinJornada });

    // Validar que al menos torneo esté presente
    if (!torneo) {
      console.log('❌ ERROR: Parámetro torneo es requerido');
      return res.status(400).json({ 
        mensaje: 'El parámetro torneo es requerido'
      });
    }

    // Construir filtro base
    const filtro = { torneo: torneo };
    
    if (categoria) {
      filtro.categoria = categoria;
    }

    // Si se especifica una jornada, filtrar solo esa
    if (jornada) {
      filtro.jornada = jornada;
    } else if (!incluirSinJornada) {
      // Por defecto, excluir partidos sin jornada
      filtro.jornada = { $ne: null };
    }

    console.log('📊 Filtro aplicado:', filtro);

    // Obtener partidos con populate
    console.log('🔍 Consultando partidos...');
    const partidos = await Partido.find(filtro)
      .populate('equipoLocal', 'nombre imagen categoria')
      .populate('equipoVisitante', 'nombre imagen categoria')
      .populate('torneo', 'nombre')
      .populate({
        path: 'arbitros.principal arbitros.backeador arbitros.estadistico',
        populate: {
          path: 'usuario',
          select: 'nombre imagen'
        }
      })
      .sort({ jornada: 1, fechaHora: 1 })
      .lean();

    console.log(`✅ Encontrados ${partidos.length} partidos`);

    // Agrupar por jornada
    console.log('📋 Agrupando partidos por jornada...');
    const partidosAgrupados = {};
    
    partidos.forEach(partido => {
      const jornadaKey = partido.jornada || 'Sin jornada';
      
      if (!partidosAgrupados[jornadaKey]) {
        partidosAgrupados[jornadaKey] = {
          jornada: jornadaKey,
          partidos: [],
          estadisticas: {
            total: 0,
            programados: 0,
            enCurso: 0,
            finalizados: 0,
            otros: 0
          }
        };
      }
      
      partidosAgrupados[jornadaKey].partidos.push(partido);
      partidosAgrupados[jornadaKey].estadisticas.total++;
      
      // Contar por estado
      switch (partido.estado) {
        case 'programado':
          partidosAgrupados[jornadaKey].estadisticas.programados++;
          break;
        case 'en_curso':
        case 'medio_tiempo':
          partidosAgrupados[jornadaKey].estadisticas.enCurso++;
          break;
        case 'finalizado':
          partidosAgrupados[jornadaKey].estadisticas.finalizados++;
          break;
        default:
          partidosAgrupados[jornadaKey].estadisticas.otros++;
      }
    });

    // Convertir a array y ordenar
    const jornadasArray = Object.values(partidosAgrupados).sort((a, b) => {
      // Ordenar jornadas numéricamente si es posible
      const numA = parseInt(a.jornada.replace(/\D/g, ''));
      const numB = parseInt(b.jornada.replace(/\D/g, ''));
      
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      
      // Si no son números, ordenar alfabéticamente
      // Pero poner "Sin jornada" al final
      if (a.jornada === 'Sin jornada') return 1;
      if (b.jornada === 'Sin jornada') return -1;
      
      return a.jornada.localeCompare(b.jornada);
    });

    // Enriquecer con URLs de imágenes
    console.log('🖼️ Enriqueciendo con URLs de imágenes...');
    for (let grupo of jornadasArray) {
      for (let i = 0; i < grupo.partidos.length; i++) {
        grupo.partidos[i] = await enriquecerPartidoConUrls(grupo.partidos[i], req);
      }
    }

    console.log(`📤 Enviando ${jornadasArray.length} jornadas agrupadas`);
    console.log(`✅ [${new Date().toISOString()}] FIN - Partidos agrupados obtenidos\n`);

    res.json({
      mensaje: 'Partidos agrupados por jornada obtenidos exitosamente',
      filtros: { torneo, categoria, jornada, incluirSinJornada },
      totalJornadas: jornadasArray.length,
      totalPartidos: partidos.length,
      jornadas: jornadasArray,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al obtener partidos agrupados:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Obtener partidos agrupados fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al obtener partidos agrupados por jornada', 
      error: error.message 
    });
  }
};

// 📅 CONSULTAS ESPECIALES - FUNCIONES BÁSICAS

// 🗓️ PARTIDOS DE HOY
exports.obtenerPartidosHoy = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🗓️ [${timestamp}] INICIO - Obtener partidos de hoy`);

  try {
    const hoy = new Date();
    const inicioHoy = new Date(hoy.setHours(0, 0, 0, 0));
    const finHoy = new Date(hoy.setHours(23, 59, 59, 999));

    console.log(`📅 Buscando partidos entre: ${inicioHoy} y ${finHoy}`);

    const partidos = await Partido.find({
      fechaHora: {
        $gte: inicioHoy,
        $lte: finHoy
      }
    })
    .populate('equipoLocal', 'nombre imagen categoria')
    .populate('equipoVisitante', 'nombre imagen categoria')
    .populate('torneo', 'nombre')
    .sort({ fechaHora: 1 });

    console.log(`✅ Encontrados ${partidos.length} partidos para hoy`);

    const partidosEnriquecidos = [];
    for (let partido of partidos) {
      const partidoEnriquecido = await enriquecerPartidoConUrls(partido, req);
      partidosEnriquecidos.push(partidoEnriquecido);
    }

    console.log('📤 Enviando partidos de hoy');
    console.log(`✅ [${new Date().toISOString()}] FIN - Partidos de hoy obtenidos\n`);

    res.json({ 
      partidos: partidosEnriquecidos,
      fecha: inicioHoy.toISOString().split('T')[0],
      total: partidosEnriquecidos.length
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al obtener partidos de hoy:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Obtener partidos de hoy fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al obtener partidos de hoy', 
      error: error.message 
    });
  }
};

// 📊 PARTIDOS DE LA SEMANA
exports.obtenerPartidosSemana = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n📊 [${timestamp}] INICIO - Obtener partidos de la semana`);

  try {
    const hoy = new Date();
    const inicioSemana = new Date(hoy.setDate(hoy.getDate() - hoy.getDay()));
    inicioSemana.setHours(0, 0, 0, 0);
    
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(finSemana.getDate() + 6);
    finSemana.setHours(23, 59, 59, 999);

    console.log(`📅 Buscando partidos entre: ${inicioSemana} y ${finSemana}`);

    const partidos = await Partido.find({
      fechaHora: {
        $gte: inicioSemana,
        $lte: finSemana
      }
    })
    .populate('equipoLocal', 'nombre imagen categoria')
    .populate('equipoVisitante', 'nombre imagen categoria')
    .populate('torneo', 'nombre')
    .sort({ fechaHora: 1 });

    console.log(`✅ Encontrados ${partidos.length} partidos para esta semana`);

    const partidosEnriquecidos = [];
    for (let partido of partidos) {
      const partidoEnriquecido = await enriquecerPartidoConUrls(partido, req);
      partidosEnriquecidos.push(partidoEnriquecido);
    }

    console.log('📤 Enviando partidos de la semana');
    console.log(`✅ [${new Date().toISOString()}] FIN - Partidos de la semana obtenidos\n`);

    res.json({ 
      partidos: partidosEnriquecidos,
      semana: {
        inicio: inicioSemana.toISOString().split('T')[0],
        fin: finSemana.toISOString().split('T')[0]
      },
      total: partidosEnriquecidos.length
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al obtener partidos de la semana:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Obtener partidos de la semana fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al obtener partidos de la semana', 
      error: error.message 
    });
  }
};

// 🏃‍♂️ PARTIDOS EN VIVO
exports.obtenerPartidosEnVivo = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🏃‍♂️ [${timestamp}] INICIO - Obtener partidos en vivo`);

  try {
    console.log('🔍 Buscando partidos en curso...');

    const partidos = await Partido.find({
      estado: { $in: ['en_curso', 'medio_tiempo'] }
    })
    .populate('equipoLocal', 'nombre imagen categoria')
    .populate('equipoVisitante', 'nombre imagen categoria')
    .populate('torneo', 'nombre')
    .sort({ fechaHora: 1 });

    console.log(`✅ Encontrados ${partidos.length} partidos en vivo`);

    const partidosEnriquecidos = [];
    for (let partido of partidos) {
      const partidoEnriquecido = await enriquecerPartidoConUrls(partido, req);
      partidosEnriquecidos.push(partidoEnriquecido);
    }

    console.log('📤 Enviando partidos en vivo');
    console.log(`✅ [${new Date().toISOString()}] FIN - Partidos en vivo obtenidos\n`);

    res.json({ 
      partidos: partidosEnriquecidos,
      total: partidosEnriquecidos.length,
      estados: ['en_curso', 'medio_tiempo']
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al obtener partidos en vivo:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Obtener partidos en vivo fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al obtener partidos en vivo', 
      error: error.message 
    });
  }
};

// 🎯 HEALTH CHECK ESPECÍFICO PARA PARTIDOS
exports.healthCheck = async (req, res) => {
  try {
    const partidosCount = await Partido.countDocuments();
    const partidosHoy = await Partido.countDocuments({
      fechaHora: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lte: new Date(new Date().setHours(23, 59, 59, 999))
      }
    });

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        connected: true
      },
      estadisticas: {
        totalPartidos: partidosCount,
        partidosHoy: partidosHoy
      },
      // Funcionalidades nuevas disponibles
      nuevasFuncionalidades: {
        generadorRol: '✅ Disponible - Genera automáticamente calendarios de partidos',
        gestionPartidos: '✅ Disponible - CRUD completo de partidos',
        filtrosAvanzados: '✅ Disponible - Filtrado por torneo, equipo, categoría, fecha',
        estadisticasPartidos: '✅ Disponible - Registro manual de estadísticas CORREGIDO PARA NÚMERO 0',
        arbitrajeIntegrado: '✅ Disponible - Asignación de árbitros a partidos',
        partidosEnVivo: '✅ Disponible - Gestión en tiempo real'
      }
    });

  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      database: {
        status: 'error',
        connected: false
      }
    });
  }
};

// 🔄 FUNCIONES HELPER PARA EL GENERADOR
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const distribuirFechasUniformemente = (fechaInicio, fechaFin, numPartidos, diasSemana, horarios) => {
  const fechas = [];
  
  // Generar fechas válidas en el rango
  const fechasValidas = [];
  let fechaActual = new Date(fechaInicio);
  
  while (fechaActual <= fechaFin) {
    if (diasSemana.includes(fechaActual.getDay())) {
      fechasValidas.push(new Date(fechaActual));
    }
    fechaActual.setDate(fechaActual.getDate() + 1);
  }
  
  if (fechasValidas.length === 0) {
    throw new Error('No hay fechas válidas en el rango especificado');
  }
  
  // Distribuir partidos en fechas válidas
  const partidosPorFecha = Math.ceil(numPartidos / fechasValidas.length);
  let partidoIndex = 0;
  
  for (const fecha of fechasValidas) {
    for (let i = 0; i < partidosPorFecha && partidoIndex < numPartidos; i++) {
      const horario = horarios[i % horarios.length];
      const [hora, minuto] = horario.split(':');
      
      const fechaPartido = new Date(fecha);
      fechaPartido.setHours(parseInt(hora), parseInt(minuto), 0, 0);
      
      fechas.push(fechaPartido);
      partidoIndex++;
    }
  }
  
  return fechas.slice(0, numPartidos);
};

// 🔥 EXPORTAR TODAS LAS FUNCIONES
module.exports = exports;

// 📝 NOTAS FINALES DEL ARCHIVO:
/*
✅ CORRECCIONES APLICADAS PARA NÚMERO 0:

1. ✅ Helper enriquecerJugadasConNumeros: Permite número 0 en filtros
2. ✅ Función buscarJugadorPorNumero: Validación robusta que permite 0
3. ✅ registrarJugada: Lógica completa corregida para todos los tipos de jugada
4. ✅ Validaciones: Cambio de numero < 0 en lugar de numero <= 0
5. ✅ Respuestas: Incluye número 0 en todas las respuestas de jugadas
6. ✅ Filtros: Todos los filtros permiten número 0 como valor válido
7. ✅ Debug: Logs mejorados para mostrar número 0 correctamente

FUNCIONALIDADES INCLUIDAS:
- 🎲 Generador automático de roles de torneo
- 📋 CRUD completo de partidos con filtros avanzados
- 🔍 Obtener partido por ID con jugadas enriquecidas
- 🎯 Cambio de estado con validaciones
- 📝 Registro de jugadas CORREGIDO para número 0
- 🗑️ Eliminación de jugadas con recálculo de marcador
- ⚖️ Asignación/desasignación de árbitros
- 📅 Consultas especiales (hoy, semana, en vivo)
- 🎯 Health check con estadísticas

COMPATIBILIDAD:
✅ Totalmente compatible con el frontend RegistroJugadas.jsx
✅ Maneja correctamente el número 0 en todos los contextos
✅ Incluye logging detallado para debugging
✅ Validaciones robustas y manejo de errores
*/