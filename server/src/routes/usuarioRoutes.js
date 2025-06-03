const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const equipoController = require('../controllers/equipoController');
const { auth, checkRole, checkUserEditPermission } = require('../middleware/authMiddleware'); // 🔥 AGREGADO: checkUserEditPermission
const upload = require('../helpers/uploadConfig');

// 🔒 Específicas sin parámetros

// 🔥 ACTUALIZADO: Agregar usuario a equipo (Admin + Capitán)
router.patch('/usuarios/equipo', auth, checkRole('admin', 'capitan'), usuarioController.agregarJugadorAEquipo);

// Registro (público)
router.post('/auth/register', usuarioController.registro);

// Login (público)
router.post('/auth/login', usuarioController.login);

// Perfil (requiere token)
router.get('/auth/perfil', auth, usuarioController.perfil);

// Obtener todos los usuarios (requiere token - todos pueden ver)
router.get('/usuarios', auth, usuarioController.obtenerUsuarios);

// 🔥 ACTUALIZADO: Crear nuevo equipo (Admin + Capitán)
router.post('/equipos', auth, checkRole('admin', 'capitan'), upload, equipoController.nuevoEquipo);

// Obtener todos los equipos (requiere token - todos pueden ver)
router.get('/equipos', auth, equipoController.obtenerEquipos);

// 🔥 ACTUALIZADO: Registrar jugadores en un equipo (Admin + Capitán)
router.post('/equipos/registrarJugadores', auth, checkRole('admin', 'capitan'), equipoController.registrarJugadores);

// 🔥 ACTUALIZADO: Borrar jugadores de un equipo (Admin + Capitán)
router.delete('/equipos/borrarJugadores', auth, checkRole('admin', 'capitan'), equipoController.borrarJugadores);

// 🔒 Específicas con identificadores compuestos o rutas con nombre fijo
// (No hay en tu caso, aquí irían rutas como /equipos/categoria/:categoria o /usuarios/rol/:rol)

// 🔓 Genéricas con parámetros

// Obtener usuario por ID (requiere token - todos pueden ver)
router.get('/usuarios/:id', auth, usuarioController.obtenerUsuarioId);

// Eliminar usuario (requiere token - necesita permisos administrativos)
router.delete('/usuarios/:id', auth, checkRole('admin', 'capitan'), usuarioController.eliminarUsuario);

// 🔥 ACTUALIZADO: Actualizar perfil (Con validación por ID usando nuevo middleware)
router.patch('/usuarios/:id', auth, checkUserEditPermission, upload, usuarioController.actualizarPerfil);

// Obtener equipo por ID (requiere token - todos pueden ver)
router.get('/equipos/:id', auth, equipoController.obtenerEquipo);

// 🔥 ACTUALIZADO: Actualizar equipo (Admin + Capitán)
router.patch('/equipos/:id', auth, checkRole('admin', 'capitan'), upload, equipoController.actualizarEquipo);

// 🔥 ACTUALIZADO: Eliminar equipo (Admin + Capitán)
router.delete('/equipos/:id', auth, checkRole('admin', 'capitan'), equipoController.eliminarEquipo);

module.exports = router;