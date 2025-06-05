// 📁 controllers/partidoController.js
const Partido = require('../models/Partido');
const Torneo = require('../models/Torneo');
const Equipo = require('../models/Equipo');
const Arbitro = require('../models/Arbitro');
const Usuario = require('../models/Usuario');
const { validationResult } = require('express-validator');
const { getImageUrlServer } = require('../helpers/imageUrlHelper');

// 🔥 Helper para enriquecer partidos con URLs completas
const enriquecerPartidoConUrls = async (partido, req) => {
  const partidoObj = partido.toObject ? partido.toObject() : partido;
  
  // URLs de imágenes de equipos
  if (partidoObj.equipoLocal && partidoObj.equipoLocal.imagen) {
    partidoObj.equipoLocal.imagen = getImageUrlServer(partidoObj.equipoLocal.imagen, req);
  }
  if (partidoObj.equipoVisitante && partidoObj.equipoVisitante.imagen) {
    partidoObj.equipoVisitante.imagen = getImageUrlServer(partidoObj.equipoVisitante.imagen, req);
  }

  // URLs de imágenes de árbitros
  if (partidoObj.arbitros) {
    if (partidoObj.arbitros.principal && partidoObj.arbitros.principal.usuario && partidoObj.arbitros.principal.usuario.imagen) {
      partidoObj.arbitros.principal.usuario.imagen = getImageUrlServer(partidoObj.arbitros.principal.usuario.imagen, req);
    }
    if (partidoObj.arbitros.backeador && partidoObj.arbitros.backeador.usuario && partidoObj.arbitros.backeador.usuario.imagen) {
      partidoObj.arbitros.backeador.usuario.imagen = getImageUrlServer(partidoObj.arbitros.backeador.usuario.imagen, req);
    }
    if (partidoObj.arbitros.estadistico && partidoObj.arbitros.estadistico.usuario && partidoObj.arbitros.estadistico.usuario.imagen) {
      partidoObj.arbitros.estadistico.usuario.imagen = getImageUrlServer(partidoObj.arbitros.estadistico.usuario.imagen, req);
    }
  }

  return partidoObj;
};

// 🎲 GENERADOR DE ROL AUTOMÁTICO - FUNCIONALIDAD PRINCIPAL
exports.generarRolTorneo = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🎲 [${timestamp}] INICIO - Generar rol de torneo`);
  console.log('📨 Body recibido:', JSON.stringify(req.body, null, 2));

  try {
    // Validar datos de entrada
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      console.log('❌ ERROR: Errores de validación:', errores.array());
      return res.status(400).json({ errores: errores.array() });
    }

    const { torneoId, categoria, tipoRol, jornadas, fechaInicio, fechaFin, configuracion = {} } = req.body;
    
    console.log('🔐 Validando permisos...');
    if (!['admin', 'capitan'].includes(req.usuario.rol)) {
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
      configuracion.diasSemana || [6, 0], // Sábados y domingos por defecto
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

// 📋 OBTENER PARTIDOS CON FILTROS
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
      .sort({ fechaHora: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Partido.countDocuments(filtro);

    console.log(`✅ Encontrados ${partidos.length} partidos (${total} total)`);

    // Enriquecer con URLs
    const partidosEnriquecidos = [];
    for (let partido of partidos) {
      const partidoEnriquecido = await enriquecerPartidoConUrls(partido, req);
      partidosEnriquecidos.push(partidoEnriquecido);
    }

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

// 🔍 OBTENER PARTIDO POR ID
exports.obtenerPartidoPorId = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🔍 [${timestamp}] INICIO - Obtener partido por ID`);
  console.log('🆔 Partido ID:', req.params.id);

  try {
    const partido = await Partido.findById(req.params.id)
      .populate('equipoLocal', 'nombre imagen categoria jugadores')
      .populate('equipoVisitante', 'nombre imagen categoria jugadores')
      .populate('torneo', 'nombre fechaInicio fechaFin')
      .populate({
        path: 'arbitros.principal arbitros.backeador arbitros.estadistico',
        populate: {
          path: 'usuario',
          select: 'nombre email imagen'
        }
      })
      .populate('creadoPor', 'nombre email')
      .populate('ultimaActualizacion.por', 'nombre');

    if (!partido) {
      console.log('❌ ERROR: Partido no encontrado');
      return res.status(404).json({ mensaje: 'Partido no encontrado' });
    }

    console.log('✅ Partido encontrado:', partido.equipoLocal.nombre, 'vs', partido.equipoVisitante.nombre);

    const partidoEnriquecido = await enriquecerPartidoConUrls(partido, req);

    console.log('📤 Enviando partido');
    console.log(`✅ [${new Date().toISOString()}] FIN - Partido obtenido\n`);

    res.json({ partido: partidoEnriquecido });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al obtener partido:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Obtener partido fallido\n`);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ mensaje: 'ID de partido no válido' });
    }
    
    res.status(500).json({ 
      mensaje: 'Error al obtener partido', 
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

// ✏️ ACTUALIZAR PARTIDO
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

    // Validar permisos para editar según estado
    if (['en_curso', 'finalizado'].includes(partido.estado)) {
      if (usuarioLogueado.rol !== 'admin') {
        console.log('❌ ERROR: Sin permisos para editar partido en curso/finalizado');
        return res.status(403).json({ 
          mensaje: 'Solo administradores pueden editar partidos que ya comenzaron o finalizaron' 
        });
      }
    }

    console.log('💾 Actualizando partido...');
    const camposPermitidos = [
      'equipoLocal', 'equipoVisitante', 'fechaHora', 'categoria', 
      'sede', 'duracionMinutos', 'arbitros', 'observaciones'
    ];

    const datosActualizados = {};
    camposPermitidos.forEach(campo => {
      if (req.body[campo] !== undefined) {
        datosActualizados[campo] = req.body[campo];
      }
    });

    // Actualizar metadatos
    datosActualizados.ultimaActualizacion = {
      fecha: new Date(),
      por: usuarioLogueado._id
    };

    const partidoActualizado = await Partido.findByIdAndUpdate(
      partidoId,
      { $set: datosActualizados },
      { new: true, runValidators: true }
    ).populate([
      { path: 'equipoLocal', select: 'nombre imagen categoria' },
      { path: 'equipoVisitante', select: 'nombre imagen categoria' },
      { path: 'torneo', select: 'nombre' }
    ]);

    console.log('✅ Partido actualizado exitosamente');

    const partidoEnriquecido = await enriquecerPartidoConUrls(partidoActualizado, req);

    console.log('📤 Enviando respuesta exitosa');
    console.log(`✅ [${new Date().toISOString()}] FIN - Partido actualizado\n`);

    res.json({ 
      mensaje: 'Partido actualizado exitosamente', 
      partido: partidoEnriquecido 
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al actualizar partido:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Actualizar partido fallido\n`);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ mensaje: 'ID de partido no válido' });
    }
    
    res.status(500).json({ 
      mensaje: 'Error al actualizar partido', 
      error: error.message 
    });
  }
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
      'finalizado': [] // No se puede cambiar desde finalizado
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

// 📝 REGISTRAR JUGADA MANUAL (FUNCIÓN BÁSICA - FASE 1)
exports.registrarJugada = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n📝 [${timestamp}] INICIO - Registrar jugada manual`);
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
      jugadorPrincipal, 
      jugadorSecundario, 
      descripcion,
      resultado = {}
    } = req.body;

    console.log('🔍 Buscando partido...');
    const partido = await Partido.findById(partidoId);
    if (!partido) {
      console.log('❌ ERROR: Partido no encontrado');
      return res.status(404).json({ mensaje: 'Partido no encontrado' });
    }

    // Solo permitir registro en partidos en curso
    if (!['en_curso', 'medio_tiempo'].includes(partido.estado)) {
      console.log('❌ ERROR: Partido no está en curso');
      return res.status(400).json({ 
        mensaje: 'Solo se pueden registrar jugadas en partidos en curso' 
      });
    }

    console.log('⚽ Creando nueva jugada...');
    
    // Determinar puntos según tipo de jugada
    let puntos = 0;
    let touchdown = false;
    let intercepcion = false;
    let sack = false;

    switch (tipoJugada) {
      case 'touchdown':
        puntos = 6;
        touchdown = true;
        break;
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
        break;
      case 'sack':
        sack = true;
        break;
      case 'tackleo':  // 🔥 AGREGAR ESTAS 3 LÍNEAS
        puntos = 0;
        break;
      default:
        puntos = 0;
    }

    // Crear objeto de jugada
    const nuevaJugada = {
      numero: partido.jugadas.length + 1,
      tiempo: {
        minuto: Math.floor(Date.now() / 60000) % 60, // Tiempo mock por ahora
        segundo: Math.floor(Date.now() / 1000) % 60,
        periodo: partido.tiempoJuego.periodo
      },
      equipoEnPosesion,
      tipoJugada,
      descripcion,
      jugadorPrincipal,
      jugadorSecundario,
      resultado: {
        touchdown,
        intercepcion,
        sack,
        puntos: resultado.puntos !== undefined ? resultado.puntos : puntos
      }
    };

    // Agregar jugada al partido
    partido.jugadas.push(nuevaJugada);

    // Actualizar marcador si hay puntos
    if (nuevaJugada.resultado.puntos > 0) {
      if (equipoEnPosesion.toString() === partido.equipoLocal.toString()) {
        partido.marcador.local += nuevaJugada.resultado.puntos;
      } else {
        partido.marcador.visitante += nuevaJugada.resultado.puntos;
      }
    }

    // Actualizar estadísticas básicas del partido
    const esEquipoLocal = equipoEnPosesion.toString() === partido.equipoLocal.toString();
    const equipoStats = esEquipoLocal ? partido.estadisticas.equipoLocal : partido.estadisticas.equipoVisitante;

    switch (tipoJugada) {
      case 'pase_completo':
        equipoStats.pases.intentos++;
        equipoStats.pases.completados++;
        break;
      case 'pase_incompleto':
        equipoStats.pases.intentos++;
        break;
      case 'touchdown':
        if (tipoJugada.includes('pase') || descripcion?.includes('pase')) {
          equipoStats.pases.touchdowns++;
        } else {
          equipoStats.corridas.touchdowns++;
        }
        break;
      case 'intercepcion':
        // La intercepción cuenta para el equipo defensivo
        const equipoDefensivo = esEquipoLocal ? partido.estadisticas.equipoVisitante : partido.estadisticas.equipoLocal;
        equipoDefensivo.defensiva.intercepciones++;
        break;
      case 'sack':
        const equipoDefensivoSack = esEquipoLocal ? partido.estadisticas.equipoVisitante : partido.estadisticas.equipoLocal;
        equipoDefensivoSack.defensiva.sacks++;
        break;
      case 'tackleo':  
        const equipoDefensivoTackleo = esEquipoLocal ? partido.estadisticas.equipoVisitante : partido.estadisticas.equipoLocal;
        equipoDefensivoTackleo.defensiva.tackleos++;
        break;
    }

    // Actualizar metadatos
    partido.ultimaActualizacion = {
      fecha: new Date(),
      por: req.usuario._id
    };

    await partido.save();

    console.log(`✅ Jugada registrada: ${tipoJugada} (${nuevaJugada.resultado.puntos} pts)`);
    console.log(`📊 Marcador actualizado: ${partido.marcador.local} - ${partido.marcador.visitante}`);

    // Respuesta simplificada
    const respuesta = {
      mensaje: 'Jugada registrada exitosamente',
      jugada: nuevaJugada,
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

// ⚖️ ASIGNAR ÁRBITROS
exports.asignarArbitros = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n⚖️ [${timestamp}] INICIO - Asignar árbitros`);
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

    // Validar que los árbitros existen y están disponibles
    const arbitrosIds = [principal, backeador, estadistico].filter(Boolean);
    
    if (arbitrosIds.length > 0) {
      console.log('🔍 Validando árbitros...');
      const arbitrosValidos = await Arbitro.find({
        _id: { $in: arbitrosIds },
        disponible: true,
        estado: 'activo'
      });

      if (arbitrosValidos.length !== arbitrosIds.length) {
        console.log('❌ ERROR: Uno o más árbitros no están disponibles');
        return res.status(400).json({ 
          mensaje: 'Uno o más árbitros no están disponibles o no existen' 
        });
      }
    }

    console.log('⚖️ Asignando árbitros...');
    
    // Actualizar árbitros del partido
    if (principal) partido.arbitros.principal = principal;
    if (backeador) partido.arbitros.backeador = backeador;
    if (estadistico) partido.arbitros.estadistico = estadistico;

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
        select: 'nombre imagen'
      }
    });

    console.log('✅ Árbitros asignados exitosamente');

    const partidoEnriquecido = await enriquecerPartidoConUrls(partido, req);

    console.log('📤 Enviando respuesta exitosa');
    console.log(`✅ [${new Date().toISOString()}] FIN - Árbitros asignados\n`);

    res.json({ 
      mensaje: 'Árbitros asignados exitosamente', 
      partido: partidoEnriquecido 
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al asignar árbitros:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Asignar árbitros fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al asignar árbitros', 
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

// 🔍 ENDPOINT DE STATUS DE LA API
exports.obtenerStatus = async (req, res) => {
  try {
    res.json({
      message: '🚀 API AGS Flag Football funcionando correctamente',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      modules: {
        usuarios: '✅ Activo',
        equipos: '✅ Activo', 
        torneos: '✅ Activo',
        arbitros: '✅ Activo',
        partidos: '🔥 NUEVO - Activo'
      },
      endpoints: {
        auth: '/auth/*',
        usuarios: '/usuarios/*',
        equipos: '/equipos/*', 
        torneos: '/torneos/*',
        arbitros: '/arbitros/*',
        partidos: '/partidos/*'
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error en el status',
      error: error.message
    });
  }
};

// 📊 ENDPOINT DE ESTADÍSTICAS GENERALES DEL SISTEMA
exports.obtenerEstadisticasSistema = async (req, res) => {
  try {
    // 📈 Conteos básicos
    const [
      totalUsuarios,
      totalEquipos, 
      totalTorneos,
      totalArbitros,
      totalPartidos,
      partidosHoy,
      partidosEnVivo
    ] = await Promise.all([
      Usuario.countDocuments(),
      Equipo.countDocuments(),
      Torneo.countDocuments(),
      Arbitro.countDocuments(),
      Partido.countDocuments(),
      Partido.countDocuments({
        fechaHora: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }),
      Partido.countDocuments({ estado: 'en_curso' })
    ]);

    // 👥 Distribución de usuarios por rol
    const distribucionRoles = await Usuario.aggregate([
      {
        $group: {
          _id: '$rol',
          cantidad: { $sum: 1 }
        }
      }
    ]);

    // 🏆 Distribución de equipos por categoría
    const distribucionCategorias = await Equipo.aggregate([
      {
        $group: {
          _id: '$categoria',
          cantidad: { $sum: 1 }
        }
      }
    ]);

    // ⚖️ Estados de árbitros
    const estadosArbitros = await Arbitro.aggregate([
      {
        $group: {
          _id: '$estado',
          cantidad: { $sum: 1 }
        }
      }
    ]);

    // ⚽ Estados de partidos
    const estadosPartidos = await Partido.aggregate([
      {
        $group: {
          _id: '$estado',
          cantidad: { $sum: 1 }
        }
      }
    ]);

    // 🎯 Partidos por categoría
    const partidosPorCategoria = await Partido.aggregate([
      {
        $group: {
          _id: '$categoria',
          cantidad: { $sum: 1 }
        }
      }
    ]);

    // 📅 Actividad reciente (últimos 7 días)
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);

    const actividadReciente = await Promise.all([
      Usuario.countDocuments({ createdAt: { $gte: hace7Dias } }),
      Equipo.countDocuments({ createdAt: { $gte: hace7Dias } }),
      Partido.countDocuments({ createdAt: { $gte: hace7Dias } })
    ]);

    res.json({
      mensaje: '📊 Estadísticas generales del sistema',
      timestamp: new Date().toISOString(),
      
      // 📈 Totales generales
      totales: {
        usuarios: totalUsuarios,
        equipos: totalEquipos,
        torneos: totalTorneos,
        arbitros: totalArbitros,
        partidos: totalPartidos
      },

      // ⚽ Estadísticas de partidos
      partidosEstadisticas: {
        total: totalPartidos,
        hoy: partidosHoy,
        enVivo: partidosEnVivo,
        porEstado: estadosPartidos.reduce((acc, item) => {
          acc[item._id] = item.cantidad;
          return acc;
        }, {}),
        porCategoria: partidosPorCategoria.reduce((acc, item) => {
          acc[item._id] = item.cantidad;
          return acc;
        }, {})
      },

      // 👥 Distribuciones existentes
      distribuciones: {
        usuariosPorRol: distribucionRoles.reduce((acc, item) => {
          acc[item._id] = item.cantidad;
          return acc;
        }, {}),
        
        equiposPorCategoria: distribucionCategorias.reduce((acc, item) => {
          acc[item._id] = item.cantidad;
          return acc;
        }, {}),
        
        arbitrosPorEstado: estadosArbitros.reduce((acc, item) => {
          acc[item._id] = item.cantidad;
          return acc;
        }, {})
      },

      // 📅 Actividad reciente (últimos 7 días)
      actividadReciente: {
        nuevosUsuarios: actividadReciente[0],
        nuevosEquipos: actividadReciente[1],
        nuevosPartidos: actividadReciente[2]
      },

      // 🔗 Enlaces útiles
      enlaces: {
        documentacion: '/api/status',
        usuarios: '/api/usuarios',
        equipos: '/api/equipos',
        torneos: '/api/torneos',
        arbitros: '/api/arbitros',
        partidos: '/api/partidos',
        partidosHoy: '/api/partidos/especiales/hoy',
        partidosEnVivo: '/api/partidos/especiales/en-vivo'
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas del sistema:', error);
    res.status(500).json({
      mensaje: 'Error al obtener estadísticas del sistema',
      error: error.message
    });
  }
};

// 🔍 ENDPOINT DE SALUD DETALLADO
exports.obtenerHealth = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    // 🔌 Estado de la base de datos
    const dbState = mongoose.connection.readyState;
    const dbStates = {
      0: 'disconnected',
      1: 'connected', 
      2: 'connecting',
      3: 'disconnecting'
    };

    // ⏱️ Tiempo de respuesta de la DB
    const startTime = Date.now();
    await mongoose.connection.db.admin().ping();
    const dbResponseTime = Date.now() - startTime;

    // 💾 Información del servidor
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      
      // 🔌 Base de datos
      database: {
        status: dbStates[dbState] || 'unknown',
        responseTime: `${dbResponseTime}ms`,
        connected: dbState === 1
      },

      // 💾 Servidor
      server: {
        uptime: `${Math.floor(uptime)}s`,
        memoryUsage: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
        },
        nodeVersion: process.version,
        platform: process.platform
      },

      // 🎯 Módulos del sistema
      modules: {
        usuarios: '✅ Operativo',
        equipos: '✅ Operativo',
        torneos: '✅ Operativo', 
        arbitros: '✅ Operativo',
        partidos: '🔥 Operativo - NUEVO'
      },

      // 🔥 Funcionalidades nuevas disponibles
      nuevasFuncionalidades: {
        generadorRol: '✅ Disponible - Genera automáticamente calendarios de partidos',
        gestionPartidos: '✅ Disponible - CRUD completo de partidos',
        filtrosAvanzados: '✅ Disponible - Filtrado por torneo, equipo, categoría, fecha',
        estadisticasPartidos: '⏳ Preparado - Para registro manual de estadísticas',
        arbitrajeIntegrado: '✅ Disponible - Asignación de árbitros a partidos',
        partidosEnVivo: '⏳ Preparado - Para gestión en tiempo real (Fase 2/3)'
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