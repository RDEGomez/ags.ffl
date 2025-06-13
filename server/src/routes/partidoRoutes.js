// 📁 routes/partidoRoutes.js
const express = require('express');
const router = express.Router();
const { check, body, param, query } = require('express-validator');
const partidoController = require('../controllers/partidoController');
const { auth, checkRole } = require('../middleware/authMiddleware');

// 🎲 GENERADOR DE ROL AUTOMÁTICO - FUNCIONALIDAD PRINCIPAL
router.post('/generar-rol', 
  [
    auth,
    checkRole('admin', 'arbitro'),
    [
      // Validaciones básicas
      check('torneoId', 'ID de torneo es obligatorio y debe ser válido').isMongoId(),
      check('categoria', 'Categoría es obligatoria').isIn([
        'mixgold', 'mixsilv', 'vargold', 'varsilv', 
        'femgold', 'femsilv', 'varmast', 'femmast', 'tocho7v7'
      ]),
      check('tipoRol', 'Tipo de rol es obligatorio').isIn(['todos_contra_todos', 'limitado']),
      check('fechaInicio', 'Fecha de inicio es obligatoria y debe ser válida').isISO8601(),
      check('fechaFin', 'Fecha de fin es obligatoria y debe ser válida').isISO8601(),
      
      // Validación de fechas lógicas
      body('fechaFin').custom((value, { req }) => {
        const fechaInicio = new Date(req.body.fechaInicio);
        const fechaFin = new Date(value);
        
        if (fechaFin <= fechaInicio) {
          throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
        }
        
        // Verificar que no sea muy lejana (máximo 1 año)
        const unAñoEnMillisegundos = 365 * 24 * 60 * 60 * 1000;
        if (fechaFin.getTime() - fechaInicio.getTime() > unAñoEnMillisegundos) {
          throw new Error('El rango de fechas no puede ser mayor a un año');
        }
        
        return true;
      }),
      
      // Validación condicional para tipo limitado
      body('jornadas')
        .if(body('tipoRol').equals('limitado'))
        .isInt({ min: 1, max: 50 })
        .withMessage('Para rol limitado, las jornadas deben ser entre 1 y 50'),
      
      // Validaciones opcionales de configuración
      body('configuracion.duracionMinutos')
        .optional()
        .isInt({ min: 30, max: 120 })
        .withMessage('La duración debe estar entre 30 y 120 minutos'),
      
      body('configuracion.diasSemana')
        .optional()
        .isArray({ min: 1, max: 7 })
        .withMessage('Debe especificar al menos un día de la semana'),
      
      body('configuracion.diasSemana.*')
        .optional()
        .isInt({ min: 0, max: 6 })
        .withMessage('Los días de la semana deben ser números del 0 (domingo) al 6 (sábado)'),
      
      body('configuracion.horariosPreferidos')
        .optional()
        .isArray({ min: 1 })
        .withMessage('Debe especificar al menos un horario'),
      
      body('configuracion.horariosPreferidos.*')
        .optional()
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Los horarios deben tener formato HH:MM (24 horas)')
    ]
  ],
  partidoController.generarRolTorneo
);

// 🗑️ ELIMINACIÓN DE ROL
router.delete('/rol/:torneoId/:categoria', 
  [
    auth,
    checkRole('admin', 'arbitro'),
    [
      param('torneoId', 'ID de torneo debe ser válido').isMongoId(),
      param('categoria', 'Categoría debe ser válida').isIn([
        'mixgold', 'mixsilv', 'vargold', 'varsilv', 
        'femgold', 'femsilv', 'varmast', 'femmast', 'tocho7v7'
      ])
    ]
  ],
  partidoController.eliminarRolTorneo
);

// 🔄 REGENERACIÓN DE ROL (elimina y genera nuevo)
router.post('/regenerar-rol', 
  [
    auth,
    checkRole('admin', 'arbitro'),
    [
      // Mismas validaciones que generar-rol
      check('torneoId', 'ID de torneo es obligatorio y debe ser válido').isMongoId(),
      check('categoria', 'Categoría es obligatoria').isIn([
        'mixgold', 'mixsilv', 'vargold', 'varsilv', 
        'femgold', 'femsilv', 'varmast', 'femmast', 'tocho7v7'
      ]),
      check('tipoRol', 'Tipo de rol es obligatorio').isIn(['todos_contra_todos', 'limitado']),
      check('fechaInicio', 'Fecha de inicio es obligatoria y debe ser válida').isISO8601(),
      check('fechaFin', 'Fecha de fin es obligatoria y debe ser válida').isISO8601(),
      
      body('fechaFin').custom((value, { req }) => {
        if (new Date(value) <= new Date(req.body.fechaInicio)) {
          throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
        }
        return true;
      }),
      
      body('jornadas')
        .if(body('tipoRol').equals('limitado'))
        .isInt({ min: 1, max: 50 })
        .withMessage('Para rol limitado, las jornadas deben ser entre 1 y 50')
    ]
  ],
  partidoController.generarRolTorneo
);

// 📋 CRUD BÁSICO DE PARTIDOS

// ➕ CREAR PARTIDO INDIVIDUAL
router.post('/', 
  [
    auth,
    checkRole('admin', 'arbitro'),
    [
      check('equipoLocal', 'Equipo local es obligatorio y debe ser válido').isMongoId(),
      check('equipoVisitante', 'Equipo visitante es obligatorio y debe ser válido').isMongoId(),
      check('torneo', 'Torneo es obligatorio y debe ser válido').isMongoId(),
      check('fechaHora', 'Fecha y hora son obligatorias y deben ser válidas').isISO8601(),
      
      // Validación personalizada: equipos diferentes
      body(['equipoLocal', 'equipoVisitante']).custom((value, { req }) => {
        if (req.body.equipoLocal === req.body.equipoVisitante) {
          throw new Error('Un equipo no puede jugar contra sí mismo');
        }
        return true;
      }),
      
      // Validación de fecha futura
      body('fechaHora').custom((value) => {
        const fechaPartido = new Date(value);
        const ahora = new Date();
        
        if (fechaPartido <= ahora) {
          throw new Error('La fecha del partido debe ser futura');
        }
        
        return true;
      }),
      
      // Validaciones opcionales
      check('categoria')
        .optional()
        .isIn(['mixgold', 'mixsilv', 'vargold', 'varsilv', 'femgold', 'femsilv', 'varmast', 'femmast', 'tocho7v7'])
        .withMessage('Categoría no válida'),
      
      check('duracionMinutos')
        .optional()
        .isInt({ min: 30, max: 120 })
        .withMessage('La duración debe estar entre 30 y 120 minutos'),
      
      // Validaciones de sede
      check('sede.nombre')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre de la sede debe tener entre 2 y 100 caracteres'),
      
      check('sede.direccion')
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('La dirección debe tener entre 5 y 200 caracteres'),
      
      // Validaciones de árbitros
      check('arbitros.principal')
        .optional()
        .isMongoId()
        .withMessage('ID de árbitro principal debe ser válido'),
      
      check('arbitros.backeador')
        .optional()
        .isMongoId()
        .withMessage('ID de árbitro backeador debe ser válido'),
      
      check('arbitros.estadistico')
        .optional()
        .isMongoId()
        .withMessage('ID de árbitro estadístico debe ser válido')
    ]
  ],
  partidoController.crearPartido
);

// 📄 OBTENER TODOS LOS PARTIDOS (con filtros y paginación)
router.get('/', 
  [
    auth,
    [
      // Validaciones de filtros (opcionales)
      query('torneo')
        .optional()
        .isMongoId()
        .withMessage('ID de torneo debe ser válido'),
      
      query('equipo')
        .optional()
        .isMongoId()
        .withMessage('ID de equipo debe ser válido'),
      
      query('categoria')
        .optional()
        .isIn(['mixgold', 'mixsilv', 'vargold', 'varsilv', 'femgold', 'femsilv', 'varmast', 'femmast', 'tocho7v7'])
        .withMessage('Categoría no válida'),
      
      query('estado')
        .optional()
        .isIn(['programado', 'en_curso', 'medio_tiempo', 'finalizado', 'suspendido', 'cancelado'])
        .withMessage('Estado no válido'),
      
      query('fecha')
        .optional()
        .isISO8601()
        .withMessage('Formato de fecha no válido'),
      
      // Validaciones de paginación
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('La página debe ser un número mayor a 0'),
      
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('El límite debe estar entre 1 y 100')
    ]
  ],
  partidoController.obtenerPartidos
);

// 🔍 OBTENER PARTIDO POR ID
router.get('/:id', 
  [
    auth,
    [
      param('id', 'ID de partido debe ser válido').isMongoId()
    ]
  ],
  partidoController.obtenerPartidoPorId
);

// ✏️ ACTUALIZAR PARTIDO
router.put('/:id', 
  [
    auth,
    checkRole('admin', 'arbitro'),
    [
      param('id', 'ID de partido debe ser válido').isMongoId(),
      
      // Validaciones opcionales para actualización
      check('equipoLocal')
        .optional()
        .isMongoId()
        .withMessage('ID de equipo local debe ser válido'),
      
      check('equipoVisitante')
        .optional()
        .isMongoId()
        .withMessage('ID de equipo visitante debe ser válido'),
      
      check('fechaHora')
        .optional()
        .isISO8601()
        .withMessage('Formato de fecha no válido'),
      
      check('estado')
        .optional()
        .isIn(['programado', 'en_curso', 'medio_tiempo', 'finalizado', 'suspendido', 'cancelado'])
        .withMessage('Estado no válido'),
      
      // Validación personalizada: no actualizar si ya empezó
      body('*').custom(async (value, { req }) => {
        const Partido = require('../models/Partido');
        try {
          const partido = await Partido.findById(req.params.id);
          if (partido && ['en_curso', 'finalizado'].includes(partido.estado)) {
            // Solo admin puede editar partidos en curso o finalizados
            if (req.usuario.rol !== 'admin') {
              throw new Error('No se puede editar un partido que ya comenzó o finalizó');
            }
          }
        } catch (error) {
          // Si hay error al buscar, lo manejará el controlador
        }
        return true;
      })
    ]
  ],
  partidoController.actualizarPartido
);

// 🗑️ ELIMINAR PARTIDO
router.delete('/:id', 
  [
    auth,
    checkRole('admin'), // Solo admin puede eliminar partidos
    [
      param('id', 'ID de partido debe ser válido').isMongoId()
    ]
  ],
  partidoController.eliminarPartido
);

// ⚽ GESTIÓN EN VIVO - FASE 2/3 (preparado para futuro)

// // 🎮 INICIAR PARTIDO
// router.patch('/:id/iniciar', 
//   [
//     auth,
//     checkRole('admin', 'arbitro'),
//     [
//       param('id', 'ID de partido debe ser válido').isMongoId()
//     ]
//   ],
//   partidoController.iniciarPartido
// );

// // 📝 REGISTRAR JUGADA
// router.post('/:id/jugadas', 
//   [
//     auth,
//     checkRole('admin', 'arbitro'),
//     [
//       param('id', 'ID de partido debe ser válido').isMongoId(),
      
//       check('tipoJugada', 'Tipo de jugada es obligatorio').isIn([
//         'pase_completo', 'pase_incompleto', 'intercepcion', 'corrida', 
//         'touchdown', 'conversion_1pt', 'conversion_2pt', 'safety', 
//         'timeout', 'sack', 'tackleo'
//       ]),
      
//       check('equipoEnPosesion', 'Equipo en posesión es obligatorio').isMongoId(),
//       check('jugadorPrincipal', 'Jugador principal es obligatorio').isMongoId(),
      
//       check('jugadorSecundario')
//         .optional()
//         .isMongoId()
//         .withMessage('ID de jugador secundario debe ser válido'),
      
//       check('descripcion')
//         .optional()
//         .trim()
//         .isLength({ max: 200 })
//         .withMessage('La descripción no puede exceder 200 caracteres'),
      
//       check('resultado.puntos')
//         .optional()
//         .isInt({ min: 0, max: 6 })
//         .withMessage('Los puntos deben estar entre 0 y 6')
//     ]
//   ],
//   partidoController.registrarJugada
// );

// // 🏁 FINALIZAR PARTIDO
// router.patch('/:id/finalizar', 
//   [
//     auth,
//     checkRole('admin', 'arbitro'),
//     [
//       param('id', 'ID de partido debe ser válido').isMongoId(),
      
//       // Validaciones opcionales para datos finales
//       check('observaciones')
//         .optional()
//         .trim()
//         .isLength({ max: 500 })
//         .withMessage('Las observaciones no pueden exceder 500 caracteres'),
      
//       check('clima.temperatura')
//         .optional()
//         .isFloat({ min: -10, max: 50 })
//         .withMessage('La temperatura debe estar entre -10 y 50 grados'),
      
//       check('clima.condiciones')
//         .optional()
//         .trim()
//         .isLength({ max: 100 })
//         .withMessage('Las condiciones climáticas no pueden exceder 100 caracteres')
//     ]
//   ],
//   partidoController.finalizarPartido
// );

// // 📊 ESTADÍSTICAS Y REPORTES

// // 📈 OBTENER ESTADÍSTICAS DE PARTIDO
// router.get('/:id/estadisticas', 
//   [
//     auth,
//     [
//       param('id', 'ID de partido debe ser válido').isMongoId()
//     ]
//   ],
//   partidoController.obtenerEstadisticasPartido
// );

// // 🏆 OBTENER HISTORIAL ENTRE EQUIPOS
// router.get('/equipos/:equipoId/historial', 
//   [
//     auth,
//     [
//       param('equipoId', 'ID de equipo debe ser válido').isMongoId(),
      
//       query('vsEquipo')
//         .optional()
//         .isMongoId()
//         .withMessage('ID del equipo rival debe ser válido'),
      
//       query('limite')
//         .optional()
//         .isInt({ min: 1, max: 50 })
//         .withMessage('El límite debe estar entre 1 y 50 partidos')
//     ]
//   ],
//   partidoController.obtenerHistorialEquipo
// );

// 🔄 GESTIÓN DE ESTADO

// 🎯 CAMBIAR ESTADO DE PARTIDO
router.patch('/:id/estado', 
  [
    auth,
    checkRole('admin'),
    [
      param('id', 'ID de partido debe ser válido').isMongoId(),
      check('estado', 'Estado es obligatorio y debe ser válido').isIn([
        'programado', 'en_curso', 'medio_tiempo', 'finalizado', 'suspendido', 'cancelado'
      ]),
      
      check('motivo')
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('El motivo debe tener entre 5 y 200 caracteres')
    ]
  ],
  partidoController.cambiarEstado
);

// ⚖️ ASIGNAR ÁRBITROS - VALIDACIONES CORREGIDAS
router.post('/:id/arbitros', 
  [
    auth,
    checkRole('admin'),
    [
      param('id', 'ID de partido debe ser válido').isMongoId(),
      
      // 🔥 VALIDACIONES CORREGIDAS: Permitir null para desasignar
      body('principal')
        .optional({ nullable: true })
        .custom((value) => {
          // Permitir null, string vacío para desasignación
          if (value === null || value === "" || value === "null") {
            return true;
          }
          // Si no es desasignación, debe ser ObjectId válido
          if (typeof value === 'string' && value.match(/^[0-9a-fA-F]{24}$/)) {
            return true;
          }
          throw new Error('ID de árbitro principal debe ser válido o null para desasignar');
        }),
      
      body('backeador')
        .optional({ nullable: true })
        .custom((value) => {
          if (value === null || value === "" || value === "null") {
            return true;
          }
          if (typeof value === 'string' && value.match(/^[0-9a-fA-F]{24}$/)) {
            return true;
          }
          throw new Error('ID de árbitro backeador debe ser válido o null para desasignar');
        }),
      
      body('estadistico')
        .optional({ nullable: true })
        .custom((value) => {
          if (value === null || value === "" || value === "null") {
            return true;
          }
          if (typeof value === 'string' && value.match(/^[0-9a-fA-F]{24}$/)) {
            return true;
          }
          throw new Error('ID de árbitro estadístico debe ser válido o null para desasignar');
        }),
      
      // Validación personalizada: árbitros diferentes (solo válidos, no nulls)
      body(['principal', 'backeador', 'estadistico']).custom((value, { req }) => {
        const arbitros = [req.body.principal, req.body.backeador, req.body.estadistico]
          .filter(id => id && id !== null && id !== "" && id !== "null");
        
        const arbitrosUnicos = new Set(arbitros);
        
        if (arbitros.length !== arbitrosUnicos.size) {
          throw new Error('No se puede asignar el mismo árbitro a múltiples posiciones');
        }
        
        return true;
      })
    ]
  ],
  partidoController.asignarArbitros
);

// 📅 RUTAS ESPECIALES DE CONSULTA

// 🗓️ PARTIDOS DE HOY
router.get('/especiales/hoy', 
  auth,
  partidoController.obtenerPartidosHoy
);

// 📊 PARTIDOS DE LA SEMANA
router.get('/especiales/semana', 
  auth,
  partidoController.obtenerPartidosSemana
);

// 🏃‍♂️ PARTIDOS EN VIVO
router.get('/especiales/en-vivo', 
  auth,
  partidoController.obtenerPartidosEnVivo
);

// 📝 REGISTRAR JUGADA MANUAL (FUNCIÓN BÁSICA - FASE 1)
router.post('/:id/jugadas', 
  [
    auth,
    checkRole('admin', 'arbitro', 'capitan'), // 🔥 Permitir también capitanes
    [
      param('id', 'ID de partido debe ser válido').isMongoId(),
      
      check('tipoJugada', 'Tipo de jugada es obligatorio').isIn([
        'pase_completo', 'pase_incompleto', 'intercepcion', 'corrida', 
        'touchdown', 'conversion_1pt', 'conversion_2pt', 'safety', 
        'timeout', 'sack', 'tackleo'
      ]),
      
      check('equipoEnPosesion', 'Equipo en posesión es obligatorio').isMongoId(),
      check('jugadorPrincipal', 'Jugador principal es obligatorio').isMongoId(),
      
      check('jugadorSecundario')
        .optional()
        .isMongoId()
        .withMessage('ID de jugador secundario debe ser válido'),
      
      check('descripcion')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('La descripción no puede exceder 200 caracteres'),
      
      check('resultado.puntos')
        .optional()
        .isInt({ min: 0, max: 6 })
        .withMessage('Los puntos deben estar entre 0 y 6')
    ]
  ],
  partidoController.registrarJugada
);

// 🔥 TAMBIÉN AGREGAR ESTAS RUTAS ÚTILES SI NO LAS TIENES:

// 📊 OBTENER JUGADAS DE UN PARTIDO
router.get('/:id/jugadas', 
  [
    auth,
    [
      param('id', 'ID de partido debe ser válido').isMongoId()
    ]
  ],
  async (req, res) => {
    try {
      const partido = await Partido.findById(req.params.id)
        .populate('jugadas.jugadorPrincipal', 'nombre numero')
        .populate('jugadas.jugadorSecundario', 'nombre numero')
        .populate('jugadas.equipoEnPosesion', 'nombre');
      
      if (!partido) {
        return res.status(404).json({ mensaje: 'Partido no encontrado' });
      }
      
      res.json({ 
        jugadas: partido.jugadas || [],
        total: partido.jugadas?.length || 0,
        marcador: partido.marcador
      });
    } catch (error) {
      console.error('Error al obtener jugadas:', error);
      res.status(500).json({ mensaje: 'Error al obtener jugadas' });
    }
  }
);

// 🗑️ ELIMINAR ÚLTIMA JUGADA (PARA CORREGIR ERRORES)
router.delete('/:id/jugadas/ultima', 
  [
    auth,
    checkRole('admin', 'arbitro'),
    [
      param('id', 'ID de partido debe ser válido').isMongoId()
    ]
  ],
  async (req, res) => {
    try {
      const partido = await Partido.findById(req.params.id);
      
      if (!partido) {
        return res.status(404).json({ mensaje: 'Partido no encontrado' });
      }
      
      if (!partido.jugadas || partido.jugadas.length === 0) {
        return res.status(400).json({ mensaje: 'No hay jugadas para eliminar' });
      }
      
      // Eliminar última jugada
      const jugadaEliminada = partido.jugadas.pop();
      
      // Actualizar marcador si la jugada tenía puntos
      if (jugadaEliminada.resultado?.puntos > 0) {
        const esLocal = jugadaEliminada.equipoEnPosesion.toString() === partido.equipoLocal.toString();
        if (esLocal) {
          partido.marcador.local = Math.max(0, partido.marcador.local - jugadaEliminada.resultado.puntos);
        } else {
          partido.marcador.visitante = Math.max(0, partido.marcador.visitante - jugadaEliminada.resultado.puntos);
        }
      }
      
      await partido.save();
      
      res.json({ 
        mensaje: 'Última jugada eliminada exitosamente',
        jugadaEliminada,
        marcadorActualizado: partido.marcador
      });
    } catch (error) {
      console.error('Error al eliminar jugada:', error);
      res.status(500).json({ mensaje: 'Error al eliminar jugada' });
    }
  }
);

module.exports = router;