const express = require('express');
const router = express.Router();

const usuarioRoutes = require('./usuarioRoutes');
const torneoRoutes = require('./torneoRoutes');
const arbitroRoutes = require('./arbitroRoutes'); // 🔥 NUEVO

// Rutas de usuario (auth)
router.use('/', usuarioRoutes);

// Rutas de torneos
router.use('/torneos', torneoRoutes);

// Rutas de árbitros 🔥 NUEVO
router.use('/arbitros', arbitroRoutes);

module.exports = router;