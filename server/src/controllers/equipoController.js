const upload = require('../helpers/uploadConfig');
const Usuario = require('../models/Usuario');
const Equipo = require('../models/Equipo');
const reglasCategorias = require('../helpers/reglasCategorias');
const { getCategoryName } = require('../../../client/src/helpers/mappings');
const { getImageUrlServer } = require('../helpers/imageUrlHelper'); // 🔥 Agregar helper

exports.nuevoEquipo = async (req, res) => {
  const equipo = new Equipo(req.body);

  try {
    if (req.file) {
      if (req.file.url) {
        equipo.imagen = req.file.url; // ← Guarda URL de ImageKit
      } else if (req.file.path && req.file.path.includes('cloudinary.com')) {
        equipo.imagen = req.file.path;
      } else if (req.file.filename) {
        equipo.imagen = req.file.filename;
      }
    }    

    const resultado = await equipo.save();
    
    // 🔥 Convertir y agregar URL completa en respuesta
    const equipoObj = resultado.toObject();
    equipoObj.imagen = getImageUrlServer(equipoObj.imagen, req);
    
    res.json({ mensaje: 'Equipo creado correctamente', equipo: equipoObj });
    return;
  } catch (error) {
    console.error('Error al crear equipo:', error);
    if (!res.headersSent) {
      res.status(400).json({ mensaje: 'Error al crear el equipo', error });
    }
  }
}

exports.obtenerEquipos = async (req, res) => {
  try {
    const equipos = await Equipo.find().lean();
    const equipoIds = equipos.map(e => e._id);

    // Buscar usuarios que están en cualquiera de esos equipos
    const usuarios = await Usuario.find({
      'equipos.equipo': { $in: equipoIds }
    }).select('nombre documento imagen equipos');

    // Enriquecer cada equipo con sus jugadores
    const equiposEnriquecidos = equipos.map(equipo => {
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
            imagen: getImageUrlServer(usuario.imagen, req), // 🔥 URL completa para jugador
            numero: info?.numero ?? null
          };
        });

      return {
        ...equipo,
        imagen: getImageUrlServer(equipo.imagen, req), // 🔥 URL completa para equipo
        jugadores
      };
    });

    res.json(equiposEnriquecidos);
  } catch (error) {
    console.error('Error al obtener los equipos:', error);
    res.status(500).json({ mensaje: 'Error al obtener los equipos', error });
  }
};

exports.obtenerEquipo = async (req, res) => {
  try {
    const equipo = await Equipo.findById(req.params.id);
    if (!equipo) {
      return res.status(404).json({ mensaje: 'Equipo no encontrado' });
    }

    // 🔥 Convertir y agregar URL completa
    const equipoObj = equipo.toObject();
    equipoObj.imagen = getImageUrlServer(equipoObj.imagen, req);

    res.json(equipoObj);
  } catch (error) {
      res.status(500).json({ mensaje: 'Error al obtener el equipo', error });
  }
}

// Controlador para actualizar un equipo
exports.actualizarEquipo = async (req, res) => {
  try {
    // Obtener el equipo actual primero
    const equipo = await Equipo.findById(req.params.id);

    if (!equipo) {
      return res.status(404).json({ mensaje: 'Equipo no encontrado' });
    }

    // Verificar si se está cambiando la categoría
    if (req.body.categoria && req.body.categoria !== equipo.categoria) {
      // Buscar jugadores asociados a este equipo
      const jugadoresAsociados = await Usuario.find({
        'equipos.equipo': equipo._id
      });

      // Si hay jugadores asociados, no permitir el cambio de categoría
      if (jugadoresAsociados.length > 0) {
        return res.status(400).json({
          mensaje: 'No se puede cambiar la categoría del equipo porque tiene jugadores asignados',
          jugadoresAsociados: jugadoresAsociados.length
        });
      }
    }

    // Actualizar los campos del equipo
    Object.keys(req.body).forEach(key => {
      equipo[key] = req.body[key];
    });

    // Actualizar la imagen si se proporciona una nueva
    if (req.file) {
      if (req.file.url) {
        equipo.imagen = req.file.url; // ← Detecta ImageKit primero
      } else {
        // Local: guardar solo filename
        equipo.imagen = req.file.filename;
      }
    }

    // Guardar los cambios
    await equipo.save();

    // 🔥 Convertir y agregar URL completa en respuesta
    const equipoObj = equipo.toObject();
    equipoObj.imagen = getImageUrlServer(equipoObj.imagen, req);

    res.json({ mensaje: 'Equipo actualizado correctamente', equipo: equipoObj });
  } catch (error) {
    console.error('Error al actualizar equipo:', error);
    res.status(400).json({ mensaje: 'Error al actualizar el equipo', error: error.message });
  }
}

exports.eliminarEquipo = async (req, res) => {
  try {
    const equipo = await Equipo.findOneAndDelete({ _id: req.params.id });
    if (!equipo) {
      return res.status(404).json({ mensaje: 'Equipo no encontrado' });
    }
    res.json({ mensaje: 'Equipo eliminado correctamente' });
  } catch (error) {
      res.status(500).json({ mensaje: 'Error al eliminar el equipo', error });
  }
}

exports.subirImagen = (req, res, next) => {
  upload(req, res, function(error) {
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    return next();
  });
}

exports.registrarJugadores = async (req, res) => {
  try {
    const { jugadores } = req.body;
    
    if (!jugadores || !Array.isArray(jugadores) || jugadores.length === 0) {
      return res.status(400).json({ mensaje: 'No se proporcionó una lista válida de jugadores' });
    }

    // Validamos primero todos los jugadores antes de hacer cambios
    const errores = [];
    const validaciones = [];

    for (const [index, jugadorData] of jugadores.entries()) {
      const { usuarioId, equipoId, numero } = jugadorData;
      
      // Validación básica de parámetros
      if (!usuarioId || !equipoId || numero === undefined) {
        errores.push(`Jugador #${index + 1}: Faltan datos requeridos (usuarioId, equipoId, numero)`);
        continue;
      }

      try {
        // Encuentra al jugador
        const jugador = await Usuario.findById(usuarioId);
        if (!jugador) {
          errores.push(`Jugador #${index + 1}: No encontrado (ID: ${usuarioId})`);
          continue;
        }

        // Encuentra el equipo
        const equipo = await Equipo.findById(equipoId);
        if (!equipo) {
          errores.push(`Jugador #${index + 1}: Equipo no encontrado (ID: ${equipoId})`);
          continue;
        }

        // Validación: jugador ya inscrito
        const yaInscrito = jugador.equipos.some(p => p.equipo.toString() === equipoId);
        if (yaInscrito) {
          errores.push(`Jugador #${index + 1} (${jugador.nombre}): Ya está inscrito en este equipo`);
          continue;
        }

        // Validación: número duplicado en el equipo
        const numeroExistente = await Usuario.findOne({
          equipos: {
            $elemMatch: {
              equipo: equipoId,
              numero: numero
            }
          }
        });
        
        if (numeroExistente) {
          errores.push(`Jugador #${index + 1} (${jugador.nombre}): El número ${numero} ya está en uso por otro jugador en el equipo`);
          continue;
        }

        // Obtener la regla de la categoría del equipo nuevo
        const reglaNueva = reglasCategorias[equipo.categoria];
        if (!reglaNueva) {
          errores.push(`Jugador #${index + 1} (${jugador.nombre}): Categoría del equipo no válida`);
          continue;
        }

        // Validación: verificar si ya está en un equipo con el mismo tipo base
        const equiposJugador = jugador.equipos.map(e => e.equipo);
        const equiposDelJugador = await Equipo.find({ _id: { $in: equiposJugador } });
        
        // Buscar si hay equipos con el mismo tipo base
        for (const equipoActual of equiposDelJugador) {
          const reglaActual = reglasCategorias[equipoActual.categoria];
          
          if (reglaActual && reglaActual.tipoBase === reglaNueva.tipoBase) {
            throw new Error(`No puede inscribirse a ${equipo.categoria} porque ya está inscrito en ${equipoActual.categoria}. Ambas pertenecen al mismo tipo base (${reglaNueva.tipoBase}).`);
          }
        }

        // --- Extraer sexo y edad desde CURP ---
        const curp = jugador.documento;
        if (!curp || curp.length < 11) {
          errores.push(`Jugador #${index + 1} (${jugador.nombre}): CURP inválida o incompleta para validaciones`);
          continue;
        }

        const ano = curp.substring(4, 6);
        const mes = curp.substring(6, 8);
        const dia = curp.substring(8, 10);

        const currentYear = new Date().getFullYear() % 100;
        const fullYear = parseInt(ano) > currentYear ? 1900 + parseInt(ano) : 2000 + parseInt(ano);

        const fechaNacimiento = new Date(fullYear, parseInt(mes) - 1, parseInt(dia));

        function calcularEdad(fecha) {
          const hoy = new Date();
          let edad = hoy.getFullYear() - fecha.getFullYear();
          const mes = hoy.getMonth() - fecha.getMonth();
          if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) {
            edad--;
          }
          return edad;
        }
        const edadJugador = calcularEdad(fechaNacimiento);

        // Sexo en CURP: H=Hombre (M), M=Mujer (F)
        const sexoCurp = curp.charAt(10).toUpperCase();
        const sexoJugador = sexoCurp === 'H' ? 'M' : sexoCurp === 'M' ? 'F' : null;

        // --- Validación con reglas desde helper ---
        if (reglaNueva) {
          if (!reglaNueva.sexoPermitido.includes(sexoJugador)) {
            throw new Error(`No puede inscribirse a la categoría ${getCategoryName(equipo.categoria)} por restricción de sexo.`);
          }
          if (edadJugador < reglaNueva.edadMin) {
            throw new Error(`Debe tener al menos ${reglaNueva.edadMin} años para inscribirse en la categoría ${getCategoryName(equipo.categoria)}.`);
          }
          if (reglaNueva.edadMax !== null && edadJugador > reglaNueva.edadMax) {
            throw new Error(`No puede inscribirse en la categoría ${getCategoryName(equipo.categoria)} por restricción de edad máxima.`);
          }
        }

        // Si pasa todas las validaciones, agregamos a la lista para procesar
        validaciones.push({
          jugador,
          equipoId,
          numero
        });
      } catch (error) {
        console.error(`Error al validar jugador #${index + 1}:`, error);
        errores.push(`Jugador #${index + 1}: ${error.message || 'Error en la validación'}`);
      }
    }

    // Si hay errores, detenemos el proceso y devolvemos la lista de errores
    if (errores.length > 0) {
      return res.status(400).json({ 
        mensaje: 'Hay errores que impiden registrar a los jugadores', 
        errores 
      });
    }

    // Si todas las validaciones pasan, realizamos la operación
    const resultados = [];
    for (const validacion of validaciones) {
      const { jugador, equipoId, numero } = validacion;
      
      // Agregamos el jugador al equipo
      jugador.equipos.push({ equipo: equipoId, numero });
      await jugador.save();
      
      resultados.push({
        nombre: jugador.nombre,
        documento: jugador.documento,
        imagen: getImageUrlServer(jugador.imagen, req), // 🔥 URL completa para jugador
        numero: numero
      });
    }

    return res.status(200).json({ 
      mensaje: `${resultados.length} jugador(es) agregado(s) al equipo correctamente`,
      jugadoresRegistrados: resultados
    });

  } catch (error) {
    console.error('Error al registrar jugadores:', error);
    res.status(500).json({ mensaje: 'Error al registrar jugadores en el equipo', error: error.message });
  }
};

exports.borrarJugadores = async (req, res) => {
  try {
    const { equipoId, jugadorId } = req.body;

    // Encuentra al jugador
    const jugador = await Usuario.findById(jugadorId);
    if (!jugador) {
      return res.status(404).json({ mensaje: 'Jugador no encontrado' });
    }

    // Encuentra la relación del jugador con el equipo
    const indiceEquipo = jugador.equipos.findIndex(p => p.equipo.toString() === equipoId);
    if (indiceEquipo === -1) {
      return res.status(400).json({ mensaje: 'El jugador no está inscrito en este equipo' });
    }

    // Elimina la relación jugador-equipo
    jugador.equipos.splice(indiceEquipo, 1);
    await jugador.save();

    return res.status(200).json({ mensaje: 'Jugador eliminado del equipo correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar jugador del equipo', error });
  }
}