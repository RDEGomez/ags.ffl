const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const equipoController = require('../controllers/equipoController');
const { auth, checkRole } = require('../middleware/authMiddleware');
const upload = require('../helpers/uploadImages');

// 🔒 Específicas sin parámetros

// Agregar usuario a equipo (requiere token)
router.patch('/usuarios/equipo', auth, checkRole('capitan'), usuarioController.agregarJugadorAEquipo);

// Registro
router.post('/auth/register', usuarioController.registro);

// Login
router.post('/auth/login', usuarioController.login);

// Perfil (requiere token)
router.get('/auth/perfil', auth, usuarioController.perfil);

// Obtener todos los usuarios (requiere token)
router.get('/usuarios', auth, usuarioController.obtenerUsuarios);

// Crear nuevo equipo (requiere token)
router.post('/equipos', auth, checkRole('capitan'), upload, equipoController.nuevoEquipo);

// Obtener todos los equipos (requiere token)
router.get('/equipos', auth, equipoController.obtenerEquipos);

// Registrar jugadores en un equipo (requiere token)
router.post('/equipos/registrarJugadores', auth, checkRole('capitan'), equipoController.registrarJugadores);

// Borrar jugadores de un equipo (requiere token)
router.delete('/equipos/borrarJugadores', auth, equipoController.borrarJugadores);

// 🔒 Específicas con identificadores compuestos o rutas con nombre fijo
// (No hay en tu caso, aquí irían rutas como /equipos/categoria/:categoria o /usuarios/rol/:rol)

// 🔓 Genéricas con parámetros

// Obtener usuario por ID (requiere token)
router.get('/usuarios/:id', auth, usuarioController.obtenerUsuarioId);

// Eliminar usuario (requiere token)
router.delete('/usuarios/:id', auth, usuarioController.eliminarUsuario);

// Actualizar perfil (requiere token)
router.patch('/usuarios/:id', auth, upload, usuarioController.actualizarPerfil);

// Obtener equipo por ID (requiere token)
router.get('/equipos/:id', auth, equipoController.obtenerEquipo);

// Actualizar equipo (requiere token)
router.patch('/equipos/:id', auth, checkRole('capitan'), upload, equipoController.actualizarEquipo);

// Eliminar equipo (requiere token)
router.delete('/equipos/:id', auth, checkRole('capitan'), equipoController.eliminarEquipo);

module.exports = router;
