const express = require('express');
const router = express.Router();

const usuarioRoutes = require('./usuarioRoutes');

// Rutas de usuario (auth)
router.use('/', usuarioRoutes);

module.exports = router;
