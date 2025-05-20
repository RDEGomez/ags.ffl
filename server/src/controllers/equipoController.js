const Equipos = require('../models/Equipo');
const upload = require('../helpers/uploadImages');

exports.nuevoEquipo = async (req, res) => {
  const equipo = new Equipos(req.body);

  console.log(equipo);

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
    const equipos = await Equipos.find();
    res.json(equipos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener los equipos', error });
  }
}
exports.obtenerEquipo = async (req, res) => {
  try {
    const equipo = await Equipos.findById(req.params.id);
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
    const equipo = await Equipos.findById(req.params.id);

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
    const equipo = await Equipos.findOneAndDelete({ _id: req.params.id });
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