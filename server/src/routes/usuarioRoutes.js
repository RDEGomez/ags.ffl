const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const equipoController = require('../controllers/equipoController');
const { protegerRuta } = require('../middleware/authMiddleware');
const upload = require('../helpers/uploadImages');

// 🔒 Específicas sin parámetros

// Agregar usuario a equipo (requiere token)
router.patch('/usuarios/equipo', protegerRuta, usuarioController.agregarJugadorAEquipo);

// Registro
router.post('/auth/register', usuarioController.registro);

// Login
router.post('/auth/login', usuarioController.login);

// Perfil (requiere token)
router.get('/auth/perfil', protegerRuta, usuarioController.perfil);

// Obtener todos los usuarios (requiere token)
router.get('/usuarios', protegerRuta, usuarioController.obtenerUsuarios);

// Crear nuevo equipo (requiere token)
router.post('/equipos', protegerRuta, upload, equipoController.nuevoEquipo);

// Obtener todos los equipos (requiere token)
router.get('/equipos', protegerRuta, equipoController.obtenerEquipos);

// 🔒 Específicas con identificadores compuestos o rutas con nombre fijo
// (No hay en tu caso, aquí irían rutas como /equipos/categoria/:categoria o /usuarios/rol/:rol)

// 🔓 Genéricas con parámetros

// Obtener usuario por ID (requiere token)
router.get('/usuarios/:id', protegerRuta, usuarioController.obtenerUsuarioId);

// Eliminar usuario (requiere token)
router.delete('/usuarios/:id', protegerRuta, usuarioController.eliminarUsuario);

// Actualizar perfil (requiere token)
router.patch('/usuarios/:id', protegerRuta, upload, usuarioController.actualizarPerfil);

// Obtener equipo por ID (requiere token)
router.get('/equipos/:id', protegerRuta, equipoController.obtenerEquipo);

// Actualizar equipo (requiere token)
router.patch('/equipos/:id', protegerRuta, upload, equipoController.actualizarEquipo);

// Eliminar equipo (requiere token)
router.delete('/equipos/:id', protegerRuta, equipoController.eliminarEquipo);

module.exports = router;
