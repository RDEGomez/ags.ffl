// 📁 controllers/arbitroController.js
const Arbitro = require('../models/Arbitro');
const Usuario = require('../models/Usuario');
const { validationResult } = require('express-validator');
const { getImageUrlServer } = require('../helpers/imageUrlHelper');

// 🔥 Helper para enriquecer árbitros con URLs completas
const enriquecerArbitroConUrls = async (arbitro, req) => {
  const arbitroObj = arbitro.toObject ? arbitro.toObject() : arbitro;
  
  // URL de imagen del usuario
  if (arbitroObj.usuario && arbitroObj.usuario.imagen) {
    arbitroObj.usuario.imagen = getImageUrlServer(arbitroObj.usuario.imagen, req);
  }

  return arbitroObj;
};

// 📋 Obtener todos los árbitros - VERSIÓN SÚPER SIMPLE
exports.obtenerArbitros = async (req, res) => {
  console.log('\n🔍 [SIMPLE] Obteniendo árbitros...');

  try {
    // 1. Obtener TODOS los árbitros sin filtros
    console.log('📊 Paso 1: Obteniendo todos los árbitros de la BD...');
    const todosLosArbitros = await Arbitro.find({})
      .populate('usuario', 'nombre email imagen documento rol rolSecundario') // 🔥 ESPECIFICAR CAMPOS
      .sort({ createdAt: -1 });

    console.log(`📦 Total árbitros en BD: ${todosLosArbitros.length}`);

    // 2. Mostrar información detallada de cada uno
    console.log('\n🧪 ANÁLISIS DETALLADO:');
    todosLosArbitros.forEach((arbitro, index) => {
      console.log(`\n  ${index + 1}. ==========================================`);
      console.log(`     Nombre: ${arbitro.usuario?.nombre || 'SIN NOMBRE'}`);
      console.log(`     Email: ${arbitro.usuario?.email || 'SIN EMAIL'}`);
      console.log(`     Rol usuario: ${arbitro.usuario?.rol || 'UNDEFINED'}`);
      console.log(`     Rol secundario: ${arbitro.usuario?.rolSecundario || 'UNDEFINED'}`);
      console.log(`     Estado árbitro: ${arbitro.estado || 'UNDEFINED'}`);
      console.log(`     Disponible: ${arbitro.disponible}`);
      console.log(`     Nivel: ${arbitro.nivel || 'UNDEFINED'}`);
      console.log(`     Posiciones: [${arbitro.posiciones?.join(', ') || 'NINGUNA'}]`);
      console.log(`     Usuario existe: ${arbitro.usuario ? 'SÍ' : 'NO'}`);
    });

    // 3. FILTRAR POR ROLES CORRECTAMENTE
    console.log('\n🔍 Aplicando filtros de roles...');
    
    const arbitrosFiltrados = todosLosArbitros.filter((arbitro, index) => {
      if (!arbitro.usuario) {
        console.log(`  ${index + 1}. SIN USUARIO - EXCLUIDO`);
        return false;
      }

      // 🔥 LÓGICA CORREGIDA PARA AMBOS ROLES
      const esArbitroPrincipal = arbitro.usuario.rol === 'arbitro';
      const esArbitroSecundario = arbitro.usuario.rolSecundario === 'arbitro';
      const puedeArbitrar = esArbitroPrincipal || esArbitroSecundario;

      const estaDisponible = arbitro.estado === 'activo' && arbitro.disponible === true;
      
      const esValido = puedeArbitrar && estaDisponible;
      
      console.log(`  ${index + 1}. ${arbitro.usuario.nombre}:`);
      console.log(`     - Rol principal: ${arbitro.usuario.rol} (es arbitro: ${esArbitroPrincipal})`);
      console.log(`     - Rol secundario: ${arbitro.usuario.rolSecundario} (es arbitro: ${esArbitroSecundario})`);
      console.log(`     - Puede arbitrar: ${puedeArbitrar ? '✅' : '❌'}`);
      console.log(`     - Está disponible: ${estaDisponible ? '✅' : '❌'}`);
      console.log(`     - RESULTADO: ${esValido ? '✅ INCLUIDO' : '❌ EXCLUIDO'}`);
      
      return esValido;
    });

    console.log(`\n✅ Árbitros después del filtro: ${arbitrosFiltrados.length} de ${todosLosArbitros.length}`);

    // Enriquecer con URLs
    const arbitrosEnriquecidos = [];
    for (let arbitro of arbitrosFiltrados) {
      const arbitroEnriquecido = await enriquecerArbitroConUrls(arbitro, req);
      arbitrosEnriquecidos.push(arbitroEnriquecido);
    }

    console.log(`📤 Enviando ${arbitrosEnriquecidos.length} árbitros al frontend`);

    res.json({ 
      arbitros: arbitrosEnriquecidos,
      total: arbitrosEnriquecidos.length,
      debug: {
        mensaje: "FILTRADO POR ESTADO Y ROL FLEXIBLE",
        totalEncontrados: todosLosArbitros.length,
        filtrados: arbitrosFiltrados.length,
        enviados: arbitrosEnriquecidos.length
      }
    });

  } catch (error) {
    console.error('❌ ERROR en obtenerArbitros:', error);
    res.status(500).json({ 
      mensaje: 'Error al obtener árbitros', 
      error: error.message 
    });
  }
};

// 👤 Obtener árbitro por ID
exports.obtenerArbitroPorId = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n👤 [${timestamp}] INICIO - Obtener árbitro por ID`);
  console.log('🆔 Árbitro ID:', req.params.id);

  try {
    const arbitro = await Arbitro.findById(req.params.id)
      .populate('usuario', 'nombre email imagen documento')
      .populate('evaluaciones.evaluador', 'nombre');

    if (!arbitro) {
      console.log('❌ ERROR: Árbitro no encontrado');
      return res.status(404).json({ mensaje: 'Árbitro no encontrado' });
    }

    console.log('✅ Árbitro encontrado:', arbitro.usuario.nombre);
    
    const arbitroEnriquecido = await enriquecerArbitroConUrls(arbitro, req);

    console.log('📤 Enviando árbitro');
    console.log(`✅ [${new Date().toISOString()}] FIN - Árbitro obtenido\n`);

    res.json({ arbitro: arbitroEnriquecido });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al obtener árbitro:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Obtener árbitro fallido\n`);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ mensaje: 'ID de árbitro no válido' });
    }
    
    res.status(500).json({ 
      mensaje: 'Error al obtener árbitro', 
      error: error.message 
    });
  }
};

// ➕ Crear nuevo árbitro
exports.crearArbitro = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n➕ [${timestamp}] INICIO - Crear árbitro`);
  console.log('📨 Body recibido:', JSON.stringify(req.body, null, 2));

  try {
    // Validar datos de entrada
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      console.log('❌ ERROR: Errores de validación');
      return res.status(400).json({ errores: errores.array() });
    }

    const { 
      usuarioId, 
      nivel, 
      experiencia, 
      telefono, 
      ubicacion, 
      certificaciones, 
      posiciones 
    } = req.body;

    console.log('🔍 Validando usuario objetivo...');
    
    // Verificar que el usuario existe y es árbitro
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      console.log('❌ ERROR: Usuario no encontrado');
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    if (usuario.rol !== 'arbitro' && usuario.rolSecundario !== 'arbitro') {
      console.log('❌ ERROR: Usuario no tiene rol de árbitro');
      return res.status(400).json({ 
        mensaje: 'El usuario debe tener rol de árbitro (principal o secundario) para crear un perfil' 
      });
    }

    // Verificar si ya existe un perfil de árbitro para este usuario
    const arbitroExistente = await Arbitro.findOne({ usuario: usuarioId });
    if (arbitroExistente) {
      console.log('❌ ERROR: Ya existe perfil de árbitro');
      return res.status(400).json({ 
        mensaje: 'Ya existe un perfil de árbitro para este usuario' 
      });
    }

    console.log('💾 Creando perfil de árbitro...');

    // Crear el perfil de árbitro
    const nuevoArbitro = new Arbitro({
      usuario: usuarioId,
      nivel: nivel || 'Local',
      experiencia: experiencia || 0,
      telefono,
      ubicacion,
      certificaciones: certificaciones || [],
      posiciones: posiciones || []
    });

    const arbitroGuardado = await nuevoArbitro.save();
    
    // Popular el usuario para la respuesta
    await arbitroGuardado.populate('usuario', 'nombre email imagen documento');

    console.log('✅ Árbitro creado exitosamente');
    console.log(`  🆔 ID: ${arbitroGuardado._id}`);
    console.log(`  👤 Usuario: ${arbitroGuardado.usuario.nombre}`);

    const arbitroEnriquecido = await enriquecerArbitroConUrls(arbitroGuardado, req);

    console.log('📤 Enviando respuesta exitosa');
    console.log(`✅ [${new Date().toISOString()}] FIN - Árbitro creado\n`);

    res.status(201).json({ 
      mensaje: 'Árbitro creado exitosamente', 
      arbitro: arbitroEnriquecido 
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al crear árbitro:`);
    console.error('💥 Error completo:', error);
    console.error('📋 Stack trace:', error.stack);
    console.log(`❌ [${new Date().toISOString()}] FIN - Crear árbitro fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al crear árbitro', 
      error: error.message 
    });
  }
};

// ✏️ Actualizar árbitro
exports.actualizarArbitro = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n✏️ [${timestamp}] INICIO - Actualizar árbitro`);
  console.log('🆔 Árbitro ID:', req.params.id);
  console.log('📨 Body recibido:', JSON.stringify(req.body, null, 2));

  try {
    // Validar datos de entrada
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    const arbitroId = req.params.id;
    const usuarioLogueado = req.usuario;

    // Buscar el árbitro
    const arbitro = await Arbitro.findById(arbitroId).populate('usuario');
    if (!arbitro) {
      console.log('❌ ERROR: Árbitro no encontrado');
      return res.status(404).json({ mensaje: 'Árbitro no encontrado' });
    }

    console.log('🔐 Validando permisos...');
    
    // Validar permisos: admin, capitán, o el propio árbitro
    const puedeEditar = usuarioLogueado.rol === 'admin' || 
                       usuarioLogueado.rol === 'capitan' || 
                       usuarioLogueado._id.toString() === arbitro.usuario._id.toString();

    if (!puedeEditar) {
      console.log('❌ ERROR: Sin permisos para editar');
      return res.status(403).json({ 
        mensaje: 'No tienes permisos para editar este árbitro' 
      });
    }

    console.log('✅ Permisos validados');
    console.log('💾 Actualizando árbitro...');

    // Actualizar campos permitidos
    const camposPermitidos = [
      'nivel', 'experiencia', 'telefono', 'ubicacion', 
      'certificaciones', 'posiciones', 'notasInternas'
    ];

    const datosActualizados = {};
    camposPermitidos.forEach(campo => {
      if (req.body[campo] !== undefined) {
        datosActualizados[campo] = req.body[campo];
      }
    });

    // Solo admin puede cambiar estado y notas internas
    if (usuarioLogueado.rol === 'admin') {
      if (req.body.estado !== undefined) {
        datosActualizados.estado = req.body.estado;
      }
    } else {
      // No admin no puede modificar notas internas
      delete datosActualizados.notasInternas;
    }

    console.log('📝 Datos a actualizar:', datosActualizados);

    const arbitroActualizado = await Arbitro.findByIdAndUpdate(
      arbitroId,
      { $set: datosActualizados },
      { new: true, runValidators: true }
    ).populate('usuario', 'nombre email imagen documento');

    console.log('✅ Árbitro actualizado exitosamente');

    const arbitroEnriquecido = await enriquecerArbitroConUrls(arbitroActualizado, req);

    console.log('📤 Enviando respuesta exitosa');
    console.log(`✅ [${new Date().toISOString()}] FIN - Árbitro actualizado\n`);

    res.json({ 
      mensaje: 'Árbitro actualizado exitosamente', 
      arbitro: arbitroEnriquecido 
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al actualizar árbitro:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Actualizar árbitro fallido\n`);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ mensaje: 'ID de árbitro no válido' });
    }
    
    res.status(500).json({ 
      mensaje: 'Error al actualizar árbitro', 
      error: error.message 
    });
  }
};

// 🔄 Cambiar disponibilidad de árbitro
exports.cambiarDisponibilidad = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🔄 [${timestamp}] INICIO - Cambiar disponibilidad`);
  console.log('🆔 Árbitro ID:', req.params.id);
  console.log('📨 Nueva disponibilidad:', req.body.disponible);

  try {
    const arbitroId = req.params.id;
    const { disponible } = req.body;
    const usuarioLogueado = req.usuario;

    if (typeof disponible !== 'boolean') {
      return res.status(400).json({ 
        mensaje: 'El campo disponible debe ser un valor booleano' 
      });
    }

    // Buscar el árbitro
    const arbitro = await Arbitro.findById(arbitroId).populate('usuario');
    if (!arbitro) {
      console.log('❌ ERROR: Árbitro no encontrado');
      return res.status(404).json({ mensaje: 'Árbitro no encontrado' });
    }

    console.log('🔐 Validando permisos para cambiar disponibilidad...');
    
    // Validar permisos: admin, capitán, o el propio árbitro
    const puedeEditarDisponibilidad = usuarioLogueado.rol === 'admin' || 
                                     usuarioLogueado.rol === 'capitan' || 
                                     usuarioLogueado._id.toString() === arbitro.usuario._id.toString();

    if (!puedeEditarDisponibilidad) {
      console.log('❌ ERROR: Sin permisos para cambiar disponibilidad');
      return res.status(403).json({ 
        mensaje: 'No tienes permisos para cambiar la disponibilidad de este árbitro' 
      });
    }

    console.log('✅ Permisos validados');
    console.log('🔄 Cambiando disponibilidad...');

    // Actualizar disponibilidad
    arbitro.disponible = disponible;
    await arbitro.save();

    console.log(`✅ Disponibilidad cambiada a: ${disponible}`);

    const arbitroEnriquecido = await enriquecerArbitroConUrls(arbitro, req);

    console.log('📤 Enviando respuesta exitosa');
    console.log(`✅ [${new Date().toISOString()}] FIN - Disponibilidad cambiada\n`);

    res.json({ 
      mensaje: `Disponibilidad actualizada a ${disponible ? 'disponible' : 'no disponible'}`, 
      arbitro: arbitroEnriquecido 
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al cambiar disponibilidad:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Cambiar disponibilidad fallido\n`);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ mensaje: 'ID de árbitro no válido' });
    }
    
    res.status(500).json({ 
      mensaje: 'Error al cambiar disponibilidad', 
      error: error.message 
    });
  }
};

// 🗑️ Eliminar árbitro
exports.eliminarArbitro = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🗑️ [${timestamp}] INICIO - Eliminar árbitro`);
  console.log('🆔 Árbitro ID:', req.params.id);

  try {
    const arbitroId = req.params.id;
    const usuarioLogueado = req.usuario;

    // Solo admin y capitán pueden eliminar árbitros
    if (!['admin', 'capitan'].includes(usuarioLogueado.rol)) {
      console.log('❌ ERROR: Sin permisos para eliminar');
      return res.status(403).json({ 
        mensaje: 'No tienes permisos para eliminar árbitros' 
      });
    }

    console.log('🔍 Buscando árbitro...');
    const arbitro = await Arbitro.findById(arbitroId).populate('usuario');
    
    if (!arbitro) {
      console.log('❌ ERROR: Árbitro no encontrado');
      return res.status(404).json({ mensaje: 'Árbitro no encontrado' });
    }

    console.log('✅ Árbitro encontrado:', arbitro.usuario.nombre);

    // TODO: Verificar si tiene partidos asignados antes de eliminar
    // if (arbitro.partidosDirigidos > 0) {
    //   return res.status(400).json({
    //     mensaje: 'No se puede eliminar un árbitro que ha dirigido partidos'
    //   });
    // }

    console.log('🗑️ Eliminando árbitro...');
    await Arbitro.findByIdAndDelete(arbitroId);

    console.log('✅ Árbitro eliminado exitosamente');
    console.log('📤 Enviando confirmación');
    console.log(`✅ [${new Date().toISOString()}] FIN - Árbitro eliminado\n`);

    res.json({ mensaje: 'Árbitro eliminado exitosamente' });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al eliminar árbitro:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Eliminar árbitro fallido\n`);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ mensaje: 'ID de árbitro no válido' });
    }
    
    res.status(500).json({ 
      mensaje: 'Error al eliminar árbitro', 
      error: error.message 
    });
  }
};

// 📊 Obtener estadísticas generales
exports.obtenerEstadisticas = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n📊 [${timestamp}] INICIO - Obtener estadísticas`);

  try {
    const estadisticas = await Arbitro.obtenerEstadisticasGenerales();
    
    console.log('✅ Estadísticas calculadas');
    console.log('📤 Enviando estadísticas');
    console.log(`✅ [${new Date().toISOString()}] FIN - Estadísticas obtenidas\n`);

    res.json({ 
      estadisticas: estadisticas[0] || {
        totalArbitros: 0,
        disponibles: 0,
        promedioExperiencia: 0,
        promedioRating: 0,
        totalPartidosDirigidos: 0
      }
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al obtener estadísticas:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Obtener estadísticas fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al obtener estadísticas', 
      error: error.message 
    });
  }
};

// 🔍 Buscar árbitros disponibles (método específico)
exports.buscarDisponibles = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🔍 [${timestamp}] INICIO - Buscar árbitros disponibles`);

  try {
    const { posicion, ubicacion } = req.query;
    
    console.log('🔍 Parámetros de búsqueda:', { posicion, ubicacion });

    const arbitrosDisponibles = await Arbitro.buscarDisponibles(posicion, ubicacion);
    
    console.log(`✅ Encontrados ${arbitrosDisponibles.length} árbitros disponibles`);

    // Enriquecer con URLs
    const arbitrosEnriquecidos = [];
    for (let arbitro of arbitrosDisponibles) {
      const arbitroEnriquecido = await enriquecerArbitroConUrls(arbitro, req);
      arbitrosEnriquecidos.push(arbitroEnriquecido);
    }

    console.log('📤 Enviando árbitros disponibles');
    console.log(`✅ [${new Date().toISOString()}] FIN - Búsqueda completada\n`);

    res.json({ arbitros: arbitrosEnriquecidos });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR en búsqueda:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Búsqueda fallida\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al buscar árbitros disponibles', 
      error: error.message 
    });
  }
};