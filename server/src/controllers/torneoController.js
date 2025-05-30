const Torneo = require('../models/Torneo');
const { validationResult } = require('express-validator');
const Usuario = require('../models/Usuario');

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
      // Si es un string, convertirlo a array
      categorias = [categorias];
    } else if (Array.isArray(req.body['categorias[]'])) {
      // Si viene como categorias[], usar ese array
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

    // Si hay imagen, agregar la ruta
    if (req.file) {
      torneoData.imagen = req.file.filename; // o la ruta donde se guarda la imagen
    }

    // Crear una instancia del nuevo torneo
    const torneo = new Torneo(torneoData);

    // Guardar el torneo en la base de datos
    await torneo.save();

    // Responder con el torneo creado
    res.status(201).json({ msg: 'Torneo creado exitosamente', torneo });
  } catch (error) {
    console.error('Error al crear torneo:', error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// En torneoController.js - obtenerTorneos corregido

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

    // 🔥 Crear array de torneos enriquecidos
    const torneosEnriquecidos = [];

    // 🔥 Procesar cada torneo individualmente
    for (let torneo of torneos) {
      const torneoObj = torneo.toObject(); // Convertir a objeto plano

      // Si el torneo tiene equipos, agregar jugadores
      if (torneoObj.equipos && torneoObj.equipos.length > 0) {
        const equipoIds = torneoObj.equipos.map(e => e._id);

        // Buscar usuarios que pertenecen a estos equipos
        const usuarios = await Usuario.find({
          'equipos.equipo': { $in: equipoIds }
        }).select('nombre documento imagen equipos');

        // Enriquecer cada equipo con sus jugadores
        torneoObj.equipos = torneoObj.equipos.map(equipo => {
          const jugadores = usuarios
            .filter(usuario =>
              usuario.equipos.some(e => e.equipo.toString() === equipo._id.toString())
            )
            .map(usuario => {
              const info = usuario.equipos.find(e =>
                e.equipo.toString() === equipo._id.toString()
              );

              return {
                _id: usuario._id,
                nombre: usuario.nombre,
                documento: usuario.documento,
                imagen: usuario.imagen,
                numero: info?.numero || null
              };
            });

          // 🔥 Retornar equipo completo con jugadores
          return {
            _id: equipo._id,
            nombre: equipo.nombre,
            imagen: equipo.imagen,
            categoria: equipo.categoria,
            jugadores
          };
        });
      }

      // Agregar torneo enriquecido al array
      torneosEnriquecidos.push(torneoObj);
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
     // Importar Usuario

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

    const torneoEnriquecido = torneo.toObject();

    // 🔥 Si hay equipos, obtener jugadores con números
    if (torneoEnriquecido.equipos && torneoEnriquecido.equipos.length > 0) {
      const equipoIds = torneoEnriquecido.equipos.map(equipo => equipo._id);
      
      // Buscar usuarios que pertenecen a estos equipos
      const usuarios = await Usuario.find({
        'equipos.equipo': { $in: equipoIds }
      }).select('nombre documento imagen equipos');
      
      // Agregar jugadores con números a cada equipo
      torneoEnriquecido.equipos = torneoEnriquecido.equipos.map(equipo => {
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
              imagen: usuario.imagen,
              numero: equipoData ? equipoData.numero : null
            };
          });

        return {
          _id: equipo._id,
          nombre: equipo.nombre,           
          imagen: equipo.imagen,           
          categoria: equipo.categoria,     
          jugadores: jugadoresDelEquipo    
        };
      });
    }

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

    // Si hay nueva imagen, actualizar
    if (req.file) {
      datosActualizados.imagen = req.file.filename;
    }

    // Actualizar el torneo
    torneo = await Torneo.findByIdAndUpdate(
      id,
      { $set: datosActualizados },
      { new: true } // Devolver el documento actualizado
    );

    const torneoEnriquecido = torneo.toObject();

    if (torneoEnriquecido.equipos && torneoEnriquecido.equipos.length > 0) {
      const equipoIds = torneoEnriquecido.equipos.map(equipo => equipo._id);
      
      // Buscar usuarios que pertenecen a estos equipos
      const usuarios = await Usuario.find({
        'equipos.equipo': { $in: equipoIds }
      }).select('nombre documento imagen equipos');
      
      // Agregar jugadores con números a cada equipo
      torneoEnriquecido.equipos = torneoEnriquecido.equipos.map(equipo => {
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
              imagen: usuario.imagen,
              numero: equipoData ? equipoData.numero : null
            };
          });

        return {
          _id: equipo._id,
          nombre: equipo.nombre,           
          imagen: equipo.imagen,           
          categoria: equipo.categoria,     
          jugadores: jugadoresDelEquipo    
        };
      });
    }

    res.json({ msg: 'Torneo actualizado exitosamente', torneo: torneoEnriquecido });
  } catch (error) {
    console.error('Error al actualizar torneo:', error);
    
    // Si el error es por un ID inválido
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
    
    // Si el error es por un ID inválido
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'ID de torneo no válido' });
    }
    
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// En torneoController.js - agregarEquipo con debug
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

    const torneoEnriquecido = torneoPopulado.toObject();

    // Si hay equipos, obtener jugadores con números
    if (torneoEnriquecido.equipos && torneoEnriquecido.equipos.length > 0) {
      const equipoIds = torneoEnriquecido.equipos.map(equipo => equipo._id);
      
      // Buscar usuarios que pertenecen a estos equipos
      const usuarios = await Usuario.find({
        'equipos.equipo': { $in: equipoIds }
      }).select('nombre documento imagen equipos');
      
      // Agregar jugadores con números a cada equipo
      torneoEnriquecido.equipos = torneoEnriquecido.equipos.map(equipo => {
        
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
              imagen: usuario.imagen,
              numero: equipoData ? equipoData.numero : null
            };
          });

        const equipoFinal = {
          _id: equipo._id,
          nombre: equipo.nombre,           
          imagen: equipo.imagen,           
          categoria: equipo.categoria,     
          jugadores: jugadoresDelEquipo    
        };
        return equipoFinal;
      });
    }
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

    // Convertir a objeto plano
    const torneoEnriquecido = torneoPopulado.toObject();

    // Si hay equipos restantes, obtener jugadores
    if (torneoEnriquecido.equipos && torneoEnriquecido.equipos.length > 0) {
      const equipoIds = torneoEnriquecido.equipos.map(equipo => equipo._id);
      
      // Buscar usuarios
      const usuarios = await Usuario.find({
        'equipos.equipo': { $in: equipoIds }
      }).select('nombre documento imagen equipos');
      
      // Mapear equipos con jugadores
      torneoEnriquecido.equipos = torneoEnriquecido.equipos.map(equipo => {
        
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
              imagen: usuario.imagen,
              numero: equipoData ? equipoData.numero : null
            };
          });

        const equipoFinal = {
          _id: equipo._id,
          nombre: equipo.nombre,           
          imagen: equipo.imagen,           
          categoria: equipo.categoria,     
          jugadores: jugadoresDelEquipo    
        };
        
        return equipoFinal;
      });
    }

    res.json({ msg: 'Equipo eliminado del torneo exitosamente', torneo: torneoEnriquecido });
  } catch (error) {
    
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
    
    // Guardar cambios
    await torneo.save();

    const torneoEnriquecido = torneo.toObject();

    if (torneoEnriquecido.equipos && torneoEnriquecido.equipos.length > 0) {
      const equipoIds = torneoEnriquecido.equipos.map(equipo => equipo._id);
      
      // Buscar usuarios que pertenecen a estos equipos
      const usuarios = await Usuario.find({
        'equipos.equipo': { $in: equipoIds }
      }).select('nombre documento imagen equipos');
      
      // Agregar jugadores con números a cada equipo
      torneoEnriquecido.equipos = torneoEnriquecido.equipos.map(equipo => {
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
              imagen: usuario.imagen,
              numero: equipoData ? equipoData.numero : null
            };
          });

        return {
          _id: equipo._id,
          nombre: equipo.nombre,           
          imagen: equipo.imagen,           
          categoria: equipo.categoria,     
          jugadores: jugadoresDelEquipo    
        };
      });
    }

    res.json({ msg: 'Resultados registrados exitosamente', torneo: torneoEnriquecido });
  } catch (error) {
    console.error('Error al registrar resultados:', error);
    
    // Si el error es por un ID inválido
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'ID no válido' });
    }
    
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

exports.obtenerTorneosActivos = async (req, res) => {
  try {
    

    const torneo = await Torneo.find({ estado: 'activo' })
      .populate('equipos', 'nombre')
      .sort({ fechaInicio: 1 });

    const torneoEnriquecido = torneo.toObject();

    if (torneoEnriquecido.equipos && torneoEnriquecido.equipos.length > 0) {
      const equipoIds = torneoEnriquecido.equipos.map(equipo => equipo._id);
      
      // Buscar usuarios que pertenecen a estos equipos
      const usuarios = await Usuario.find({
        'equipos.equipo': { $in: equipoIds }
      }).select('nombre documento imagen equipos');
      
      // Agregar jugadores con números a cada equipo
      torneoEnriquecido.equipos = torneoEnriquecido.equipos.map(equipo => {
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
              imagen: usuario.imagen,
              numero: equipoData ? equipoData.numero : null
            };
          });

        return {
          _id: equipo._id,
          nombre: equipo.nombre,           
          imagen: equipo.imagen,           
          categoria: equipo.categoria,     
          jugadores: jugadoresDelEquipo    
        };
      });
    }

    res.json({ torneo: torneoEnriquecido });
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

    const torneoEnriquecido = torneo.toObject();

    if (torneoEnriquecido.equipos && torneoEnriquecido.equipos.length > 0) {
      const equipoIds = torneoEnriquecido.equipos.map(equipo => equipo._id);
      
      // Buscar usuarios que pertenecen a estos equipos
      const usuarios = await Usuario.find({
        'equipos.equipo': { $in: equipoIds }
      }).select('nombre documento imagen equipos');
      
      // Agregar jugadores con números a cada equipo
      torneoEnriquecido.equipos = torneoEnriquecido.equipos.map(equipo => {
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
              imagen: usuario.imagen,
              numero: equipoData ? equipoData.numero : null
            };
          });

        return {
          _id: equipo._id,
          nombre: equipo.nombre,           
          imagen: equipo.imagen,           
          categoria: equipo.categoria,     
          jugadores: jugadoresDelEquipo    
        };
      });
    }

    res.json({ msg: `Torneo ${estado === 'activo' ? 'activado' : 'desactivado'} exitosamente`, torneo: torneoEnriquecido });
  } catch (error) {
    console.error('Error al cambiar estado del torneo:', error);
    
    // Si el error es por un ID inválido
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'ID de torneo no válido' });
    }
    
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};