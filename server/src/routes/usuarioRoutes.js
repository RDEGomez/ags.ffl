// 📁 server/src/routes/usuarioRoutes.js - RUTAS ACTUALIZADAS
const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const equipoController = require('../controllers/equipoController');
const { auth, checkRole, checkUserEditPermission } = require('../middleware/authMiddleware');
const upload = require('../helpers/uploadConfig');

// 🔒 RUTAS DE AUTENTICACIÓN (PÚBLICAS)

// Registro (público)
router.post('/auth/register', usuarioController.registro);

// Login (público)
router.post('/auth/login', usuarioController.login);

// 🔥 NUEVAS RUTAS DE VERIFICACIÓN EMAIL
router.get('/auth/verify-email/:token', usuarioController.verificarEmail);
router.post('/auth/resend-verification', usuarioController.reenviarVerificacion);

// 🔥 NUEVAS RUTAS DE RECUPERACIÓN CONTRASEÑA
router.post('/auth/forgot-password', usuarioController.solicitarRecuperacion);
router.post('/auth/reset-password/:token', usuarioController.restablecerContrasena);

// Perfil (requiere token)
router.get('/auth/perfil', auth, usuarioController.perfil);

// 🔒 RUTAS ESPECÍFICAS SIN PARÁMETROS (REQUIEREN TOKEN)

// Agregar usuario a equipo (Admin + Capitán)
router.patch('/usuarios/equipo', auth, usuarioController.agregarJugadorAEquipo);

// Obtener todos los usuarios (requiere token - todos pueden ver)
router.get('/usuarios', auth, usuarioController.obtenerUsuarios);

// Crear nuevo equipo (Admin + Capitán)
router.post('/equipos', auth, checkRole('admin', 'capitan'), upload, equipoController.nuevoEquipo);

// Obtener todos los equipos (requiere token - todos pueden ver)
router.get('/equipos', auth, equipoController.obtenerEquipos);

// Registrar jugadores en un equipo (Admin + Capitán)
router.post('/equipos/registrarJugadores', auth, checkRole('admin', 'capitan'), equipoController.registrarJugadores);

// Borrar jugadores de un equipo (Admin + Capitán)
router.delete('/equipos/borrarJugadores', auth, checkRole('admin', 'capitan'), equipoController.borrarJugadores);

// 🔒 RUTAS GENÉRICAS CON PARÁMETROS

// Obtener usuario por ID (requiere token - todos pueden ver)
router.get('/usuarios/:id', auth, usuarioController.obtenerUsuarioId);

// Eliminar usuario (requiere token - necesita permisos administrativos)
router.delete('/usuarios/:id', auth, checkRole('admin', 'capitan'), usuarioController.eliminarUsuario);

// Actualizar perfil (Con validación por ID usando middleware)
router.patch('/usuarios/:id', auth, checkUserEditPermission, upload, usuarioController.actualizarPerfil);

// Obtener equipo por ID (requiere token - todos pueden ver)
router.get('/equipos/:id', auth, equipoController.obtenerEquipo);

// Actualizar equipo (Admin + Capitán)
router.patch('/equipos/:id', auth, checkRole('admin', 'capitan'), upload, equipoController.actualizarEquipo);

// Eliminar equipo (Admin + Capitán)
router.delete('/equipos/:id', auth, checkRole('admin', 'capitan'), equipoController.eliminarEquipo);

module.exports = router;