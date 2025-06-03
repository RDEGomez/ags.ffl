// 📁 server/src/routes/arbitroRoutes.js
const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const arbitroController = require('../controllers/arbitroController');
const { auth, checkRole, checkArbitroEditPermission } = require('../middleware/authMiddleware'); // 🔥 AGREGADO: checkArbitroEditPermission

// 📋 Obtener todos los árbitros (con filtros opcionales - todos pueden ver)
// Query params: ?disponible=true&posicion=principal&ubicacion=Aguascalientes&estado=activo
router.get('/', 
  auth, 
  arbitroController.obtenerArbitros
);

// 👤 Obtener árbitro por ID (todos pueden ver)
router.get('/:id', 
  auth, 
  arbitroController.obtenerArbitroPorId
);

// ➕ Crear nuevo árbitro (Solo Admin)
router.post('/', 
  [
    auth,
    checkRole('admin'), // 🔥 CAMBIADO: Solo admin (quitamos 'capitan' según nuestras reglas)
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

// ✏️ Actualizar árbitro (Admin + validación por ID para árbitros)
router.patch('/:id', 
  [
    auth,
    checkArbitroEditPermission, // 🔥 CAMBIADO: Usar nuevo middleware en lugar de checkRole
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

// 🔄 Cambiar disponibilidad de árbitro (Admin + validación por ID para árbitros)
router.patch('/:id/disponibilidad', 
  [
    auth,
    checkArbitroEditPermission, // 🔥 CAMBIADO: Usar nuevo middleware para consistencia
    [
      check('disponible', 'El campo disponible debe ser un valor booleano').isBoolean()
    ]
  ],
  arbitroController.cambiarDisponibilidad
);

// 🗑️ Eliminar árbitro (Solo Admin)
router.delete('/:id', 
  [
    auth,
    checkRole('admin') // 🔥 CAMBIADO: Solo admin (quitamos 'capitan' según nuestras reglas)
  ],
  arbitroController.eliminarArbitro
);

// 📊 Obtener estadísticas generales de árbitros (todos pueden ver)
router.get('/estadisticas/generales', 
  auth,
  arbitroController.obtenerEstadisticas
);

// 🔍 Buscar árbitros disponibles (todos pueden ver)
// Query params: ?posicion=principal&ubicacion=Aguascalientes
router.get('/buscar/disponibles', 
  auth,
  arbitroController.buscarDisponibles
);

module.exports = router;