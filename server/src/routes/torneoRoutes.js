const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const torneoController = require('../controllers/torneoController');
const { auth, checkRole } = require('../middleware/authMiddleware');
const upload = require('../helpers/uploadConfig');

router.post('/', 
  [
    auth,           
    checkRole('admin'),
    upload,
    [
      check('nombre', 'El nombre del torneo es obligatorio').not().isEmpty(),
      check('fechaInicio')
        .not().isEmpty().withMessage('La fecha de inicio es obligatoria')
        .custom((value) => {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            throw new Error('La fecha de inicio no es válida');
          }
          return true;
        }),
      check('fechaFin')
        .not().isEmpty().withMessage('La fecha de fin es obligatoria')
        .custom((value) => {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            throw new Error('La fecha de fin no es válida');
          }
          return true;
        })
        .custom((value, { req }) => {
          const fechaInicio = new Date(req.body.fechaInicio);
          const fechaFin = new Date(value);
          if (fechaFin < fechaInicio) {
            throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
          }
          return true;
        }),
      check('categorias', 'La categoría es obligatoria').exists()
    ]
  ],
  torneoController.crearTorneo
);

router.get('/', torneoController.obtenerTorneos);

router.get('/activos', torneoController.obtenerTorneosActivos);

router.get('/:id', torneoController.obtenerTorneoPorId);

router.put('/:id', 
  [
    auth,
    checkRole('admin'),
    upload,
    [
      check('nombre', 'El nombre del torneo es obligatorio').not().isEmpty(),
      check('fechaInicio')
        .not().isEmpty().withMessage('La fecha de inicio es obligatoria')
        .custom((value) => {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            throw new Error('La fecha de inicio no es válida');
          }
          return true;
        }),
      check('fechaFin')
        .not().isEmpty().withMessage('La fecha de fin es obligatoria')
        .custom((value) => {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            throw new Error('La fecha de fin no es válida');
          }
          return true;
        })
        .custom((value, { req }) => {
          const fechaInicio = new Date(req.body.fechaInicio);
          const fechaFin = new Date(value);
          if (fechaFin < fechaInicio) {
            throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
          }
          return true;
        }),
      check('categorias', 'La categoría es obligatoria').exists()
    ],
    [
      check('nombre', 'El nombre no puede estar vacío si se proporciona').optional().not().isEmpty(),
      check('fechaInicio', 'Formato de fecha inválido').optional().isDate(),
      check('fechaFin', 'Formato de fecha inválido').optional().isDate(),
      check('categorias', 'Categoría no válida').optional().isIn([
        'mixgold', 'mixsilv', 'vargold', 'varsilv', 
        'femgold', 'femsilv', 'varmast', 'femmast', 'tocho7v7', 'u8',
        'u10', 'u12fem', 'u12var', 'u14fem', 'u14var', 
        'u16fem', 'u16var', 'u18fem', 'u18var'
      ]),
      check('estado', 'Estado no válido').optional().isIn(['activo', 'inactivo'])
    ]
  ],
  torneoController.actualizarTorneo
);

router.delete('/:id', auth, checkRole('capitan'), torneoController.eliminarTorneo);

router.patch('/:id/estado', 
  [
    auth,
    checkRole('admin'),
    check('estado', 'El estado es obligatorio').isIn(['activo', 'inactivo'])
  ],
  torneoController.cambiarEstadoTorneo
);

router.post('/:id/equipos', 
  [
    auth,
    checkRole('admin'),
    check('equipoId', 'El ID del equipo es obligatorio').isMongoId()
  ],
  torneoController.agregarEquipo
);

router.delete('/:id/equipos/:equipoId', 
  auth,
  checkRole('admin'),
  torneoController.eliminarEquipo
);

router.post('/:id/resultados', 
  [
    auth,
    checkRole('admin'),
    check('campeon', 'El ID del equipo campeón es obligatorio').isMongoId(),
    check('subcampeon', 'El ID del equipo subcampeón es obligatorio').isMongoId(),
    check('tercerLugar', 'El ID del equipo en tercer lugar es obligatorio').isMongoId(),
    check('lideresEstadisticas', 'Los líderes estadísticos deben ser un arreglo').isArray()
  ],
  torneoController.registrarResultados
);

module.exports = router;