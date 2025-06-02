// 📁 server/src/routes/arbitroRoutes.js
const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const arbitroController = require('../controllers/arbitroController');
const { auth, checkRole } = require('../middleware/authMiddleware');

// 📋 Obtener todos los árbitros (con filtros opcionales)
// Query params: ?disponible=true&posicion=principal&ubicacion=Aguascalientes&estado=activo
router.get('/', 
  auth, 
  arbitroController.obtenerArbitros
);

// 👤 Obtener árbitro por ID
router.get('/:id', 
  auth, 
  arbitroController.obtenerArbitroPorId
);

// ➕ Crear nuevo árbitro
router.post('/', 
  [
    auth,
    checkRole('admin', 'capitan'),
    [
      check('usuarioId', 'ID de usuario es obligatorio').isMongoId(),
      check('nivel').optional().isIn(['Local', 'Regional', 'Nacional', 'Internacional']),
      check('experiencia').optional().isNumeric({ min: 0 }),
      check('telefono').optional().isMobilePhone('es-MX').withMessage('Teléfono debe ser válido para México'),
      check('ubicacion').optional().trim().isLength({ min: 2, max: 100 }),
      check('certificaciones').optional().isArray(),
      check('certificaciones.*').optional().trim().isLength({ min: 2, max: 50 }),
      check('posiciones').optional().isArray({ min: 1 }).withMessage('Debe especificar al menos una posición'),
      check('posiciones.*').optional().isIn(['principal', 'backeador', 'estadistico']).withMessage('Posición no válida')
    ]
  ],
  arbitroController.crearArbitro
);

// ✏️ Actualizar árbitro
router.patch('/:id', 
  [
    auth,
    checkRole('admin', 'capitan', 'arbitro'), // Los árbitros pueden editar su propio perfil
    [
      check('nivel').optional().isIn(['Local', 'Regional', 'Nacional', 'Internacional']),
      check('experiencia').optional().isNumeric({ min: 0 }),
      check('telefono').optional().isMobilePhone('es-MX').withMessage('Teléfono debe ser válido para México'),
      check('ubicacion').optional().trim().isLength({ min: 2, max: 100 }),
      check('certificaciones').optional().isArray(),
      check('certificaciones.*').optional().trim().isLength({ min: 2, max: 50 }),
      check('posiciones').optional().isArray({ min: 1 }).withMessage('Debe especificar al menos una posición'),
      check('posiciones.*').optional().isIn(['principal', 'backeador', 'estadistico']).withMessage('Posición no válida'),
      check('estado').optional().isIn(['activo', 'inactivo', 'suspendido']),
      check('notasInternas').optional().trim().isLength({ max: 500 }).withMessage('Notas internas muy largas')
    ]
  ],
  arbitroController.actualizarArbitro
);

// 🔄 Cambiar disponibilidad de árbitro
router.patch('/:id/disponibilidad', 
  [
    auth,
    checkRole('admin', 'capitan', 'arbitro'), // Los árbitros pueden cambiar su propia disponibilidad
    [
      check('disponible', 'El campo disponible debe ser un valor booleano').isBoolean()
    ]
  ],
  arbitroController.cambiarDisponibilidad
);

// 🗑️ Eliminar árbitro
router.delete('/:id', 
  [
    auth,
    checkRole('admin', 'capitan') // Solo admin y capitán pueden eliminar
  ],
  arbitroController.eliminarArbitro
);

// 📊 Obtener estadísticas generales de árbitros
router.get('/estadisticas/generales', 
  auth,
  arbitroController.obtenerEstadisticas
);

// 🔍 Buscar árbitros disponibles
// Query params: ?posicion=principal&ubicacion=Aguascalientes
router.get('/buscar/disponibles', 
  auth,
  arbitroController.buscarDisponibles
);

module.exports = router;