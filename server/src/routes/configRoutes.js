// server/src/routes/configRoutes.js
// Nuevas rutas para gestionar la configuración de inscripciones

const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Middleware para verificar autenticación en todas las rutas
router.use(authenticateToken);

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

// =======================================================================
// Instrucciones para agregar las rutas al app principal:

// En server/src/app.js o donde configures las rutas, agregar:

/*
// Importar las rutas de configuración
const configRoutes = require('./routes/configRoutes');

// Usar las rutas de configuración
app.use('/api/config', configRoutes);
*/

// =======================================================================
// Ejemplos de uso de las rutas:

/*
// 1. Obtener configuración actual
GET /api/config/inscripciones

// 2. Obtener estado de todas las categorías
GET /api/config/inscripciones/estado

// 3. Deshabilitar todas las inscripciones
PUT /api/config/inscripciones/globales
{
  "habilitadas": false
}

// 4. Deshabilitar inscripciones para una categoría específica
PUT /api/config/inscripciones/categoria/varmast
{
  "habilitada": false,
  "mensajePersonalizado": "Las inscripciones para Varonil Master han finalizado hasta nuevo aviso"
}

// 5. Habilitar inscripciones para una categoría
PUT /api/config/inscripciones/categoria/u16var
{
  "habilitada": true
}

// 6. Actualizar múltiples categorías
PUT /api/config/inscripciones/categorias/multiple
{
  "actualizaciones": [
    {
      "categoria": "varmast",
      "habilitada": false,
      "mensajePersonalizado": "Inscripciones cerradas por límite de equipos"
    },
    {
      "categoria": "femmast", 
      "habilitada": false,
      "mensajePersonalizado": "Inscripciones cerradas por límite de equipos"
    },
    {
      "categoria": "u18var",
      "habilitada": true
    }
  ]
}
*/