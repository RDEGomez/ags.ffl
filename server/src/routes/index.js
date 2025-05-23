const express = require('express');
const router = express.Router();

const usuarioRoutes = require('./usuarioRoutes');
const torneoRoutes = require('./torneoRoutes');

// Rutas de usuario (auth)
router.use('/', usuarioRoutes);
router.use('/torneos', torneoRoutes);

module.exports = router;
