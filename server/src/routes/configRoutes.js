// server/src/routes/configRoutes.js
// Nuevas rutas para gestionar la configuración de inscripciones

const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const { auth } = require('../middleware/authMiddleware');

// Middleware para verificar autenticación en todas las rutas
router.use(auth);

// 📋 Obtener configuración actual de inscripciones
router.get('/inscripciones', configController.obtenerConfigInscripciones);

// 📊 Obtener estado de inscripciones por categoría (para dashboard)
router.get('/inscripciones/estado', configController.obtenerEstadoInscripciones);

// 🔄 Actualizar inscripciones globales (habilitar/deshabilitar todas)
router.put('/inscripciones/globales', configController.actualizarInscripcionesGlobales);

// 🔄 Actualizar configuración de una categoría específica
router.put('/inscripciones/categoria/:categoria', configController.actualizarCategoria);

// 🔄 Actualizar múltiples categorías de una vez
router.put('/inscripciones/categorias/multiple', configController.actualizarMultiplesCategorias);

module.exports = router;