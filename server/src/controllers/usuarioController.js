// 📁 controllers/usuarioController.js
const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const Equipo = require('../models/Equipo');
const reglasCategorias = require('../helpers/reglasCategorias');
const { getCategoryName } = require('../../../client/src/helpers/mappings');


// 🔐 Generar token
const generarToken = (usuario) => {
  return jwt.sign(
    {
      id: usuario._id,
      documento: usuario.documento,
      rol: usuario.rol
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d'
    }
  );
};

// 🎯 Registro de usuario
exports.registro = async (req, res) => {
  try {
    const { documento, email, password } = req.body;

    const existe = await Usuario.findOne({ $or: [{ documento }, { email }] });
    if (existe) {
      return res.status(400).json({ mensaje: 'Ya existe un usuario con ese documento o email' });
    }

    const nuevoUsuario = new Usuario({ documento, email, password });
    await nuevoUsuario.save();

    const token = generarToken(nuevoUsuario);

    res.status(201).json({
      usuario: {
        id: nuevoUsuario._id,
        documento: nuevoUsuario.documento,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol
      },
      token
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al registrar usuario', error });
  }
};

// 🔓 Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
    }

    const token = generarToken(usuario);

    res.json({
      usuario: {
        _id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        documento: usuario.documento,
        imagen: usuario.imagen,
        rol: usuario.rol
      },
      token
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al iniciar sesión', error });
  }
};

// 🔐 Obtener perfil
exports.perfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select('-password');
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener el perfil', error });
  }
};

// PATCH /usuarios/:id
exports.actualizarPerfil = async (req, res) => {
  try {
    const { nombre, documento } = req.body;
    const usuarioId = req.params.id;

    const datosActualizados = {
      ...(nombre && { nombre }),
      ...(documento && { documento })
    };

    if (req.file) {
      const usuarioExistente = await Usuario.findById(usuarioId);

      // Eliminar imagen antigua si existe
      if (usuarioExistente && usuarioExistente.imagen) {
        const oldImagePath = path.join(__dirname, `../uploads/${usuarioExistente.imagen}`);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      datosActualizados.imagen = req.file.filename;
    }

    const usuario = await Usuario.findByIdAndUpdate(
      usuarioId,
      datosActualizados,
      { new: true, runValidators: true }
    );

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.json({ mensaje: 'Perfil actualizado correctamente', usuario });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al actualizar perfil', error });
  }
};
exports.obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find().select('-password').populate('equipos.equipo', 'nombre categoria imagen');
    res.json(usuarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener usuarios', error });
  }
}
exports.obtenerUsuarioId = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findById(id).select('-password');
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener usuario', error });
  }
}
exports.eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByIdAndDelete(id);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al eliminar usuario', error });
  }
}
exports.agregarJugadorAEquipo = async (req, res) => {
  try {
    const { usuarioId, numero, equipoId } = req.body;

    // Encuentra al jugador
    const jugador = await Usuario.findById(usuarioId);
    if (!jugador) {
      return res.status(404).json({ mensaje: 'Jugador no encontrado' });
    }

    // Encuentra el equipo
    const equipo = await Equipo.findById(equipoId);
    if (!equipo) {
      return res.status(404).json({ mensaje: 'Equipo no encontrado' });
    }

    // Validaciones previas: jugador ya inscrito, número duplicado, categoría repetida...
    const yaInscrito = jugador.equipos.some(p => p.equipo.toString() === equipoId);
    if (yaInscrito) {
      return res.status(400).json({ mensaje: 'El jugador ya está inscrito en este equipo' });
    }

    const numeroExistente = await Usuario.findOne({
      'equipos.equipo': equipoId,
      'equipos.numero': numero
    });
    if (numeroExistente) {
      return res.status(400).json({ mensaje: 'El número ya está en uso por otro jugador en el equipo' });
    }

    const equiposJugador = jugador.equipos.map(e => e.equipo);
    const equipos = await Equipo.find({ _id: { $in: equiposJugador } });
    const yaEstaEnCategoria = equipos.some(e => e.categoria === equipo.categoria);
    if (yaEstaEnCategoria) {
      return res.status(400).json({ mensaje: `El jugador ya participa en un equipo de la categoría ${equipo.categoria}` });
    }

    // --- Extraer sexo y edad desde CURP ---
    const curp = jugador.documento;
    if (!curp || curp.length < 11) {
      return res.status(400).json({ mensaje: 'CURP inválida o incompleta para validaciones' });
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
        return res.status(400).json({ mensaje: `No puedes inscribirte a la categoría ${getCategoryName(equipo.categoria)} por restricción de sexo.` });
      }
      if (edadJugador < regla.edadMin) {
        return res.status(400).json({ mensaje: `Debes tener al menos ${regla.edadMin} años para inscribirte en la categoría ${getCategoryName(equipo.categoria)}.` });
      }
      if (regla.edadMax !== null && edadJugador > regla.edadMax) {
        return res.status(400).json({ mensaje: `No puedes inscribirte en la categoría ${getCategoryName(equipo.categoria)} por restricción de edad máxima.` });
      }
    }

    // Agrega el jugador al equipo
    jugador.equipos.push({ equipo: equipoId, numero });
    await jugador.save();

    return res.status(200).json({ mensaje: 'Jugador agregado al equipo correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al agregar jugador al equipo', error });
  }
}
