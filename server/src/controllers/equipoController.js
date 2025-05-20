const upload = require('../helpers/uploadImages');
const Usuario = require('../models/Usuario');
const Equipo = require('../models/Equipo');
const reglasCategorias = require('../helpers/reglasCategorias');

exports.nuevoEquipo = async (req, res) => {
  const equipo = new Equipo(req.body);

  try {
    if (req.file && req.file.filename) {
      equipo.imagen = req.file.filename;
    }    

    const resultado = await equipo.save();
    res.json({ mensaje: 'Equipo creado correctamente', equipo: resultado });
    return;
  } catch (error) {
    console.error('Error al crear equipo:', error); // ayuda a depurar
    if (!res.headersSent) {
      res.status(400).json({ mensaje: 'Error al crear el equipo', error });
    }
  }
}
exports.obtenerEquipos = async (req, res) => {
  try {
    const equipos = await Equipo.find();
    res.json(equipos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener los equipos', error });
  }
}
exports.obtenerEquipo = async (req, res) => {
  try {
    const equipo = await Equipo.findById(req.params.id);
    if (!equipo) {
      return res.status(404).json({ mensaje: 'Equipo no encontrado' });
    }
    res.json(equipo);
  } catch (error) {
      res.status(500).json({ mensaje: 'Error al obtener el equipo', error });
  }
}
exports.actualizarEquipo = async (req, res) => {
  try {
    // Obtener el equipo actual primero
    const equipo = await Equipo.findById(req.params.id);

    if (!equipo) {
      return res.status(404).json({ mensaje: 'Equipo no encontrado' });
    }

    Object.keys(req.body).forEach(key => {
      equipo[key] = req.body[key];
    });

    if (req.file && req.file.filename) {
      equipo.imagen = req.file.filename;
    }

    await equipo.save();

    res.json({ mensaje: 'Equipo actualizado correctamente', equipo });
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al actualizar el equipo', error });
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
    // Esto ayuda a implementar un enfoque "todo o nada"
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
          'equipos.equipo': equipoId,
          'equipos.numero': numero
        });
        if (numeroExistente) {
          errores.push(`Jugador #${index + 1} (${jugador.nombre}): El número ${numero} ya está en uso por otro jugador en el equipo`);
          continue;
        }

        // Validación: ya está en un equipo de la misma categoría
        const equiposJugador = jugador.equipos.map(e => e.equipo);
        const equipos = await Equipo.find({ _id: { $in: equiposJugador } });
        const yaEstaEnCategoria = equipos.some(e => e.categoria === equipo.categoria);
        if (yaEstaEnCategoria) {
          errores.push(`Jugador #${index + 1} (${jugador.nombre}): Ya participa en un equipo de la categoría ${equipo.categoria}`);
          continue;
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
        const regla = reglasCategorias[equipo.categoria];
        if (regla) {
          if (!regla.sexoPermitido.includes(sexoJugador)) {
            errores.push(`Jugador #${index + 1} (${jugador.nombre}): No puede inscribirse a la categoría ${getCategoryName(equipo.categoria)} por restricción de sexo.`);
            continue;
          }
          if (edadJugador < regla.edadMin) {
            errores.push(`Jugador #${index + 1} (${jugador.nombre}): Debe tener al menos ${regla.edadMin} años para inscribirse en la categoría ${getCategoryName(equipo.categoria)}.`);
            continue;
          }
          if (regla.edadMax !== null && edadJugador > regla.edadMax) {
            errores.push(`Jugador #${index + 1} (${jugador.nombre}): No puede inscribirse en la categoría ${getCategoryName(equipo.categoria)} por restricción de edad máxima.`);
            continue;
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
        errores.push(`Jugador #${index + 1}: Error en la validación`);
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

    console.log("Jugador encontrado:", jugador);

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