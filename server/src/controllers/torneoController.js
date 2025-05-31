const Torneo = require('../models/Torneo');
const { validationResult } = require('express-validator');
const Usuario = require('../models/Usuario');
const { getImageUrlServer } = require('../helpers/imageUrlHelper'); // 🔥 Agregar helper

// 🔥 Helper para enriquecer torneos con URLs completas
const enriquecerTorneoConUrls = async (torneo, req) => {
  const torneoObj = torneo.toObject ? torneo.toObject() : torneo;
  
  // URL de imagen del torneo
  torneoObj.imagen = getImageUrlServer(torneoObj.imagen, req);

  // Si hay equipos, obtener jugadores con URLs
  if (torneoObj.equipos && torneoObj.equipos.length > 0) {
    const equipoIds = torneoObj.equipos.map(equipo => equipo._id);
    
    // Buscar usuarios que pertenecen a estos equipos
    const usuarios = await Usuario.find({
      'equipos.equipo': { $in: equipoIds }
    }).select('nombre documento imagen equipos');
    
    // Agregar jugadores con URLs a cada equipo
    torneoObj.equipos = torneoObj.equipos.map(equipo => {
      const jugadoresDelEquipo = usuarios
        .filter(usuario => 
          usuario.equipos.some(e => e.equipo.toString() === equipo._id.toString())
        )
        .map(usuario => {
          const equipoData = usuario.equipos.find(e => 
            e.equipo.toString() === equipo._id.toString()
          );
          
          return {
            _id: usuario._id,
            nombre: usuario.nombre,
            documento: usuario.documento,
            imagen: getImageUrlServer(usuario.imagen, req), // 🔥 URL jugador
            numero: equipoData ? equipoData.numero : null
          };
        });

      return {
        _id: equipo._id,
        nombre: equipo.nombre,
        imagen: getImageUrlServer(equipo.imagen, req), // 🔥 URL equipo
        categoria: equipo.categoria,
        jugadores: jugadoresDelEquipo
      };
    });
  }

  return torneoObj;
};

exports.crearTorneo = async (req, res) => {
  try {
    // Validar los datos recibidos
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    // Los datos ahora vienen en req.body como campos individuales del FormData
    const { nombre, fechaInicio, fechaFin, estado } = req.body;
    
    // Manejar categorías que pueden venir como string o array
    let categorias = req.body.categorias;
    if (typeof categorias === 'string') {
      categorias = [categorias];
    } else if (Array.isArray(req.body['categorias[]'])) {
      categorias = req.body['categorias[]'];
    }

    // Crear objeto del torneo
    const torneoData = {
      nombre,
      fechaInicio,
      fechaFin,
      categorias,
      estado: estado || 'activo'
    };

    // Si hay imagen, agregar según tipo de upload
    if (req.file) {
      if (req.file.path && req.file.path.includes('cloudinary.com')) {
        // Cloudinary: guardar URL completa
        torneoData.imagen = req.file.path;
      } else {
        // Local: guardar solo filename
        torneoData.imagen = req.file.filename;
      }
    }

    // Crear una instancia del nuevo torneo
    const torneo = new Torneo(torneoData);
    await torneo.save();

    // 🔥 Enriquecer con URLs antes de responder
    const torneoEnriquecido = await enriquecerTorneoConUrls(torneo, req);

    res.status(201).json({ msg: 'Torneo creado exitosamente', torneo: torneoEnriquecido });
  } catch (error) {
    console.error('Error al crear torneo:', error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

exports.obtenerTorneos = async (req, res) => {
  try {
    // Obtener parámetros de consulta para filtrado
    const { estado, categoria } = req.query;
    
    // Construir filtro de consulta
    const filtro = {};
    if (estado) filtro.estado = estado;
    if (categoria) filtro.categorias = categoria;

    // Buscar torneos con los filtros aplicados y populate básico
    const torneos = await Torneo.find(filtro)
      .populate('equipos', 'nombre imagen categoria')
      .sort({ fechaInicio: -1 });

    // 🔥 Enriquecer cada torneo con URLs
    const torneosEnriquecidos = [];
    for (let torneo of torneos) {
      const torneoEnriquecido = await enriquecerTorneoConUrls(torneo, req);
      torneosEnriquecidos.push(torneoEnriquecido);
    }

    res.json({ torneos: torneosEnriquecidos });

  } catch (error) {
    console.error('Error al obtener torneos:', error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

exports.obtenerTorneoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar torneo básico primero
    let torneo = await Torneo.findById(id)
      .populate('equipos', 'nombre imagen categoria')
      .populate({
        path: 'resultados.campeon resultados.subcampeon resultados.tercerLugar',
        select: 'nombre'
      })
      .populate({
        path: 'resultados.lideresEstadisticas.jugador',
        select: 'nombre apellido'
      });

    if (!torneo) {
      return res.status(404).json({ msg: 'Torneo no encontrado' });
    }

    // 🔥 Enriquecer con URLs
    const torneoEnriquecido = await enriquecerTorneoConUrls(torneo, req);

    res.json({ torneo: torneoEnriquecido });
  } catch (error) {
    console.error('Error al obtener torneo:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'ID de torneo no válido' });
    }
    
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

exports.actualizarTorneo = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, fechaInicio, fechaFin, categorias, estado } = req.body;

    // Validar los datos recibidos
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    // Verificar si el torneo existe
    let torneo = await Torneo.findById(id);
    if (!torneo) {
      return res.status(404).json({ msg: 'Torneo no encontrado' });
    }

    // Construir objeto con datos actualizados
    const datosActualizados = {};
    if (nombre) datosActualizados.nombre = nombre;
    if (fechaInicio) datosActualizados.fechaInicio = fechaInicio;
    if (fechaFin) datosActualizados.fechaFin = fechaFin;
    if (categorias) datosActualizados.categorias = categorias;
    if (estado) datosActualizados.estado = estado;

    // Si hay nueva imagen, actualizar según tipo
    if (req.file) {
      if (req.file.path && req.file.path.includes('cloudinary.com')) {
        // Cloudinary: guardar URL completa
        datosActualizados.imagen = req.file.path;
      } else {
        // Local: guardar solo filename
        datosActualizados.imagen = req.file.filename;
      }
    }

    // Actualizar el torneo
    torneo = await Torneo.findByIdAndUpdate(
      id,
      { $set: datosActualizados },
      { new: true }
    ).populate('equipos', 'nombre imagen categoria');

    // 🔥 Enriquecer con URLs
    const torneoEnriquecido = await enriquecerTorneoConUrls(torneo, req);

    res.json({ msg: 'Torneo actualizado exitosamente', torneo: torneoEnriquecido });
  } catch (error) {
    console.error('Error al actualizar torneo:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'ID de torneo no válido' });
    }
    
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

exports.eliminarTorneo = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el torneo existe
    const torneo = await Torneo.findById(id);
    if (!torneo) {
      return res.status(404).json({ msg: 'Torneo no encontrado' });
    }

    // Eliminar el torneo
    await Torneo.findByIdAndRemove(id);

    res.json({ msg: 'Torneo eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar torneo:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'ID de torneo no válido' });
    }
    
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

exports.agregarEquipo = async (req, res) => {
  try {
    const { id } = req.params;
    const { equipoId } = req.body;

    // Verificar si el torneo existe
    const torneo = await Torneo.findById(id);
    if (!torneo) {
      return res.status(404).json({ msg: 'Torneo no encontrado' });
    }

    // Verificar si el equipo ya está en el torneo
    if (torneo.equipos.includes(equipoId)) {
      return res.status(400).json({ msg: 'El equipo ya está registrado en este torneo' });
    }

    // Agregar el equipo al torneo
    torneo.equipos.push(equipoId);
    await torneo.save();

    // Popular los equipos básicos
    const torneoPopulado = await Torneo.findById(id)
      .populate('equipos', 'nombre imagen categoria');

    // 🔥 Enriquecer con URLs
    const torneoEnriquecido = await enriquecerTorneoConUrls(torneoPopulado, req);

    res.json({ msg: 'Equipo agregado al torneo exitosamente', torneo: torneoEnriquecido });
  } catch (error) {
    console.error('Error al agregar equipo al torneo:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'ID no válido' });
    }
    
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

exports.eliminarEquipo = async (req, res) => {
  try {
    const { id, equipoId } = req.params;

    // Verificar si el torneo existe
    const torneo = await Torneo.findById(id);
    if (!torneo) {
      return res.status(404).json({ msg: 'Torneo no encontrado' });
    }

    // Verificar si el equipo está en el torneo
    if (!torneo.equipos.includes(equipoId)) {
      return res.status(400).json({ msg: 'El equipo no está registrado en este torneo' });
    }

    // Eliminar el equipo del torneo
    torneo.equipos = torneo.equipos.filter(
      equipo => equipo.toString() !== equipoId
    );
    await torneo.save();

    // Popular los equipos restantes
    const torneoPopulado = await Torneo.findById(id)
      .populate('equipos', 'nombre imagen categoria');

    // 🔥 Enriquecer con URLs
    const torneoEnriquecido = await enriquecerTorneoConUrls(torneoPopulado, req);

    res.json({ msg: 'Equipo eliminado del torneo exitosamente', torneo: torneoEnriquecido });
  } catch (error) {
    console.error('Error al eliminar equipo del torneo:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'ID no válido' });
    }
    
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

exports.registrarResultados = async (req, res) => {
  try {
    const { id } = req.params;
    const { campeon, subcampeon, tercerLugar, lideresEstadisticas } = req.body;

    // Verificar si el torneo existe
    const torneo = await Torneo.findById(id);
    if (!torneo) {
      return res.status(404).json({ msg: 'Torneo no encontrado' });
    }

    // Crear objeto de resultados
    const resultados = {
      campeon,
      subcampeon,
      tercerLugar,
      lideresEstadisticas
    };

    // Agregar resultados al torneo
    torneo.resultados = resultados;
    await torneo.save();

    // Popular para obtener datos completos
    const torneoPopulado = await Torneo.findById(id)
      .populate('equipos', 'nombre imagen categoria')
      .populate({
        path: 'resultados.campeon resultados.subcampeon resultados.tercerLugar',
        select: 'nombre imagen'
      })
      .populate({
        path: 'resultados.lideresEstadisticas.jugador',
        select: 'nombre apellido imagen'
      });

    // 🔥 Enriquecer con URLs
    const torneoEnriquecido = await enriquecerTorneoConUrls(torneoPopulado, req);

    // 🔥 También enriquecer las URLs en los resultados
    if (torneoEnriquecido.resultados) {
      if (torneoEnriquecido.resultados.campeon && torneoEnriquecido.resultados.campeon.imagen) {
        torneoEnriquecido.resultados.campeon.imagen = getImageUrlServer(torneoEnriquecido.resultados.campeon.imagen, req);
      }
      if (torneoEnriquecido.resultados.subcampeon && torneoEnriquecido.resultados.subcampeon.imagen) {
        torneoEnriquecido.resultados.subcampeon.imagen = getImageUrlServer(torneoEnriquecido.resultados.subcampeon.imagen, req);
      }
      if (torneoEnriquecido.resultados.tercerLugar && torneoEnriquecido.resultados.tercerLugar.imagen) {
        torneoEnriquecido.resultados.tercerLugar.imagen = getImageUrlServer(torneoEnriquecido.resultados.tercerLugar.imagen, req);
      }
      
      // Enriquecer líderes estadísticos
      if (torneoEnriquecido.resultados.lideresEstadisticas) {
        torneoEnriquecido.resultados.lideresEstadisticas = torneoEnriquecido.resultados.lideresEstadisticas.map(lider => {
          if (lider.jugador && lider.jugador.imagen) {
            lider.jugador.imagen = getImageUrlServer(lider.jugador.imagen, req);
          }
          return lider;
        });
      }
    }

    res.json({ msg: 'Resultados registrados exitosamente', torneo: torneoEnriquecido });
  } catch (error) {
    console.error('Error al registrar resultados:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'ID no válido' });
    }
    
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

exports.obtenerTorneosActivos = async (req, res) => {
  try {
    const torneos = await Torneo.find({ estado: 'activo' })
      .populate('equipos', 'nombre imagen categoria')
      .sort({ fechaInicio: 1 });

    // 🔥 Enriquecer cada torneo con URLs
    const torneosEnriquecidos = [];
    for (let torneo of torneos) {
      const torneoEnriquecido = await enriquecerTorneoConUrls(torneo, req);
      torneosEnriquecidos.push(torneoEnriquecido);
    }

    res.json({ torneos: torneosEnriquecidos });
  } catch (error) {
    console.error('Error al obtener torneos activos:', error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

exports.cambiarEstadoTorneo = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    // Validar el estado
    if (!['activo', 'inactivo'].includes(estado)) {
      return res.status(400).json({ msg: 'Estado no válido' });
    }

    // Verificar si el torneo existe
    const torneo = await Torneo.findById(id);
    if (!torneo) {
      return res.status(404).json({ msg: 'Torneo no encontrado' });
    }

    // Actualizar el estado
    torneo.estado = estado;
    await torneo.save();

    // Popular para obtener datos completos
    const torneoPopulado = await Torneo.findById(id)
      .populate('equipos', 'nombre imagen categoria');

    // 🔥 Enriquecer con URLs
    const torneoEnriquecido = await enriquecerTorneoConUrls(torneoPopulado, req);

    res.json({ 
      msg: `Torneo ${estado === 'activo' ? 'activado' : 'desactivado'} exitosamente`, 
      torneo: torneoEnriquecido 
    });
  } catch (error) {
    console.error('Error al cambiar estado del torneo:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'ID de torneo no válido' });
    }
    
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};