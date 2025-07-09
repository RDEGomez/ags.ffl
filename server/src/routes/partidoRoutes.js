// 📁 routes/partidoRoutes.js
const express = require('express');
const router = express.Router();
const { check, body, param, query } = require('express-validator');
const partidoController = require('../controllers/partidoController');
const estadisticasController = require('../controllers/estadisticasController');
const { auth, checkRole } = require('../middleware/authMiddleware');
const Partido = require('../models/Partido'); // 🔥 AGREGADO para rutas inline

// ========================================
// 🎲 GENERADOR DE ROL AUTOMÁTICO
// ========================================

// 🎲 GENERAR ROL DE TORNEO
router.post('/generar-rol', 
  [
    auth,
    checkRole('admin', 'arbitro'),
    [
      // Validaciones básicas
      check('torneoId', 'ID de torneo es obligatorio y debe ser válido').isMongoId(),
      check('categoria', 'Categoría es obligatoria').isIn([
        'mixgold', 'mixsilv', 'vargold', 'varsilv', 
        'femgold', 'femsilv', 'varmast', 'femmast', 'tocho7v7', 'u8', 'u10', 'u12fam', 'u12var', 'u14fam', 'u14var', 'u16fam', 'u16var', 'u18fam', 'u18var'
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

// 🔄 REGENERAR ROL (elimina y genera nuevo)
router.post('/regenerar-rol', 
  [
    auth,
    checkRole('admin', 'arbitro'),
    [
      // Mismas validaciones que generar-rol
      check('torneoId', 'ID de torneo es obligatorio y debe ser válido').isMongoId(),
      check('categoria', 'Categoría es obligatoria').isIn([
        'mixgold', 'mixsilv', 'vargold', 'varsilv', 
        'femgold', 'femsilv', 'varmast', 'femmast', 'tocho7v7', 'u8', 'u10', 'u12fam', 'u12var', 'u14fam', 'u14var', 'u16fam', 'u16var', 'u18fam', 'u18var'
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

// 🗑️ ELIMINAR ROL DE TORNEO
router.delete('/rol/:torneoId/:categoria', 
  [
    auth,
    checkRole('admin', 'arbitro'),
    [
      param('torneoId', 'ID de torneo debe ser válido').isMongoId(),
      param('categoria', 'Categoría debe ser válida').isIn([
        'mixgold', 'mixsilv', 'vargold', 'varsilv', 
        'femgold', 'femsilv', 'varmast', 'femmast', 'tocho7v7', 'u8', 'u10', 'u12fam', 'u12var', 'u14fam', 'u14var', 'u16fam', 'u16var', 'u18fam', 'u18var'
      ])
    ]
  ],
  partidoController.eliminarRolTorneo
);

// ========================================
// 🔥 NUEVAS RUTAS: GESTIÓN DE JORNADAS
// ========================================

// 📅 OBTENER JORNADAS DISPONIBLES
router.get('/jornadas', 
  [
    auth,
    [
      query('torneo', 'ID de torneo es requerido').isMongoId(),
      query('categoria')
        .optional()
        .isIn([
          'mixgold', 'mixsilv', 'vargold', 'varsilv', 
          'femgold', 'femsilv', 'varmast', 'femmast', 'tocho7v7', 'u8',
          'u10', 'u12fem', 'u12var', 'u14fem', 'u14var',
          'u16fem', 'u16var', 'u18fem', 'u18var'
        ])
        .withMessage('Categoría debe ser válida')
    ]
  ],
  partidoController.obtenerJornadasDisponibles
);

// 📊 OBTENER PARTIDOS AGRUPADOS POR JORNADA
router.get('/agrupados-por-jornada', 
  [
    auth,
    [
      query('torneo', 'ID de torneo es requerido').isMongoId(),
      query('categoria')
        .optional()
        .isIn([
          'mixgold', 'mixsilv', 'vargold', 'varsilv', 
          'femgold', 'femsilv', 'varmast', 'femmast', 'tocho7v7', 'u8',
          'u10', 'u12fem', 'u12var', 'u14fem', 'u14var',
          'u16fem', 'u16var', 'u18fem', 'u18var'
        ])
        .withMessage('Categoría debe ser válida'),
      query('jornada')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Jornada debe tener entre 1 y 50 caracteres'),
      query('incluirSinJornada')
        .optional()
        .isBoolean()
        .withMessage('incluirSinJornada debe ser booleano')
    ]
  ],
  partidoController.obtenerPartidosAgrupadosPorJornada
);

// ========================================
// 🔥 NUEVAS RUTAS: GESTIÓN DE JORNADAS
// ========================================

// 📅 OBTENER JORNADAS DISPONIBLES
router.get('/jornadas', 
  [
    auth,
    [
      query('torneo', 'ID de torneo es requerido').isMongoId(),
      query('categoria')
        .optional()
        .isIn([
          'mixgold', 'mixsilv', 'vargold', 'varsilv', 
          'femgold', 'femsilv', 'varmast', 'femmast', 'tocho7v7', 'u8',
          'u10', 'u12fem', 'u12var', 'u14fem', 'u14var',
          'u16fem', 'u16var', 'u18fem', 'u18var'
        ])
        .withMessage('Categoría debe ser válida')
    ]
  ],
  partidoController.obtenerJornadasDisponibles
);

// 📊 OBTENER PARTIDOS AGRUPADOS POR JORNADA
router.get('/agrupados-por-jornada', 
  [
    auth,
    [
      query('torneo', 'ID de torneo es requerido').isMongoId(),
      query('categoria')
        .optional()
        .isIn([
          'mixgold', 'mixsilv', 'vargold', 'varsilv', 
          'femgold', 'femsilv', 'varmast', 'femmast', 'tocho7v7', 'u8',
          'u10', 'u12fem', 'u12var', 'u14fem', 'u14var',
          'u16fem', 'u16var', 'u18fem', 'u18var'
        ])
        .withMessage('Categoría debe ser válida'),
      query('jornada')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Jornada debe tener entre 1 y 50 caracteres'),
      query('incluirSinJornada')
        .optional()
        .isBoolean()
        .withMessage('incluirSinJornada debe ser booleano')
    ]
  ],
  partidoController.obtenerPartidosAgrupadosPorJornada
);

// ========================================
// 📅 RUTAS ESPECIALES DE CONSULTA
// ========================================

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

// ========================================
// 📋 CRUD BÁSICO DE PARTIDOS
// ========================================

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
      
      // Validaciones opcionales
      check('categoria')
        .optional()
        .isIn(['mixgold', 'mixsilv', 'vargold', 'varsilv', 'femgold', 'femsilv', 'varmast', 'femmast', 'tocho7v7', 'u8', 'u10', 'u12fem', 'u12var', 'u14fem', 'u14var', 'u16fem', 'u16var', 'u18fem', 'u18var'])
        .withMessage('Categoría no válida'),
      
      // 🔥 NUEVA VALIDACIÓN: Campo jornada
      check('jornada')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Jornada debe tener entre 1 y 50 caracteres'),
      
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
        .isIn(['mixgold', 'mixsilv', 'vargold', 'varsilv', 'femgold', 'femsilv', 'varmast', 'femmast', 'tocho7v7', 'u8', 'u10', 'u12fem', 'u12var', 'u14fem', 'u14var', 'u16fem', 'u16var', 'u18fem', 'u18var'])
        .withMessage('Categoría no válida'),
      
      query('estado')
        .optional()
        .isIn(['programado', 'en_curso', 'medio_tiempo', 'finalizado', 'suspendido', 'cancelado'])
        .withMessage('Estado no válido'),
      
      // 🔥 NUEVO FILTRO: Por jornada
      query('jornada')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Jornada debe tener entre 1 y 50 caracteres'),
      
      // 🔥 NUEVO FILTRO: Por jornada
      query('jornada')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Jornada debe tener entre 1 y 50 caracteres'),
      
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
      
      // 🔥 NUEVA VALIDACIÓN: Actualizar jornada
      check('jornada')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Jornada debe tener entre 1 y 50 caracteres'),
      
      // 🔥 NUEVA VALIDACIÓN: Actualizar jornada
      check('jornada')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Jornada debe tener entre 1 y 50 caracteres'),
      
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

// ========================================
// 🎯 GESTIÓN DE ESTADO Y CONFIGURACIÓN
// ========================================

// 🎯 CAMBIAR ESTADO DE PARTIDO
router.patch('/:id/estado', 
  [
    auth,
    checkRole('admin','arbitro'),
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

// 🔥 ACTUALIZAR JORNADA DE UN PARTIDO
router.patch('/:id/jornada', 
  [
    auth,
    checkRole('admin'),
    [
      param('id', 'ID de partido debe ser válido').isMongoId(),
      body('jornada')
        .optional({ nullable: true })
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Jornada debe tener entre 1 y 50 caracteres')
    ]
  ],
  async (req, res) => {
    try {
      const { jornada } = req.body;
      
      const partido = await Partido.findById(req.params.id);
      if (!partido) {
        return res.status(404).json({ mensaje: 'Partido no encontrado' });
      }
      
      // Actualizar jornada
      partido.jornada = jornada || null;
      partido.ultimaActualizacion = {
        fecha: new Date(),
        por: req.usuario.id,
        razon: `Jornada ${jornada ? 'actualizada a: ' + jornada : 'removida'}`
      };
      
      await partido.save();
      
      res.json({ 
        mensaje: 'Jornada actualizada exitosamente',
        partido: {
          _id: partido._id,
          jornada: partido.jornada,
          jornadaFormateada: partido.obtenerJornadaFormateada()
        }
      });
      
    } catch (error) {
      console.error('Error al actualizar jornada:', error);
      res.status(500).json({ 
        mensaje: 'Error al actualizar jornada del partido',
        error: error.message 
      });
    }
  }
);

// ⚖️ ASIGNAR ÁRBITROS
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

// ========================================
// 🎮 GESTIÓN DE JUGADAS
// ========================================

// 📝 REGISTRAR JUGADA
router.post('/:id/jugadas', 
  [
    auth,
    checkRole('admin', 'arbitro'),
    [
      // Validación de ID del partido
      param('id', 'ID de partido debe ser válido').isMongoId(),
      
      // 🔥 ACTUALIZADA: Validación del tipo de jugada SIN 'touchdown'
      check('tipoJugada', 'Tipo de jugada es obligatorio')
        .notEmpty()
        .isIn([
          'pase_completo', 'pase_incompleto', 'intercepcion', 'corrida', 
          'conversion_1pt', 'conversion_2pt', 'safety', 'timeout', 'sack', 'tackleo'
        ])
        .withMessage('Tipo de jugada no válido'),
      
      // Validación del equipo en posesión
      check('equipoEnPosesion', 'Equipo en posesión es obligatorio y debe ser válido')
        .isMongoId(),
      
      // Validación de números de jugador
      check('numeroJugadorPrincipal')
        .optional()
        .isInt({ min: 0, max: 99 })
        .withMessage('Número de jugador principal debe ser entre 0 y 99'),
      
      check('numeroJugadorSecundario')
        .optional()
        .isInt({ min: 0, max: 99 })
        .withMessage('Número de jugador secundario debe ser entre 0 y 99'),
      
      check('numeroJugadorTouchdown')
        .optional()
        .isInt({ min: 0, max: 99 })
        .withMessage('Número de jugador touchdown debe ser entre 0 y 99'),
      
      // Validación de descripción (opcional)
      check('descripcion')
        .optional()
        .isLength({ min: 1, max: 200 })
        .withMessage('Descripción debe tener entre 1 y 200 caracteres'),
      
      // 🔥 VALIDACIONES CONDICIONALES ACTUALIZADAS
      body('numeroJugadorPrincipal')
        .if(body('tipoJugada').isIn([
          'pase_completo', 'pase_incompleto', 'corrida', 'sack', 
          'intercepcion', 'conversion_1pt', 'conversion_2pt'
        ]))
        .notEmpty()
        .withMessage('Número de jugador principal es obligatorio para este tipo de jugada'),
      
      body('numeroJugadorSecundario')
        .if(body('tipoJugada').isIn(['pase_completo', 'intercepcion', 'conversion_2pt']))
        .notEmpty()
        .withMessage('Número de jugador secundario es obligatorio para este tipo de jugada'),
      
      // Validación de resultado (opcional, con valores por defecto)
      check('resultado.puntos')
        .optional()
        .isInt({ min: 0, max: 6 })
        .withMessage('Puntos deben ser entre 0 y 6'),
      
      check('resultado.touchdown')
        .optional()
        .isBoolean()
        .withMessage('Touchdown debe ser verdadero o falso'),
      
      check('resultado.intercepcion')
        .optional()
        .isBoolean()
        .withMessage('Intercepción debe ser verdadero o falso'),
      
      check('resultado.sack')
        .optional()
        .isBoolean()
        .withMessage('Sack debe ser verdadero o falso')
    ]
  ],
  partidoController.registrarJugada
);

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

// 🗑️ ELIMINAR JUGADA POR ID
router.delete('/:partidoId/jugadas/:jugadaId', 
  [
    auth,
    checkRole('admin', 'arbitro'),
    [
      param('partidoId', 'ID de partido debe ser válido').isMongoId(),
      param('jugadaId', 'ID de jugada debe ser válido').isMongoId()
    ]
  ],
  partidoController.eliminarJugada
);

// ========================================
// 🛠️ UTILIDADES PARA JUGADORES
// ========================================

// 🔥 VALIDAR NÚMEROS DE JUGADORES (ÚTIL PARA EL FRONTEND)
router.post('/:id/validar-jugadores',
  [
    auth,
    [
      param('id', 'ID de partido debe ser válido').isMongoId(),
      check('equipoId', 'ID de equipo es obligatorio').isMongoId(),
      check('numeros', 'Lista de números es obligatoria').isArray({ min: 0 }),
      check('numeros.*', 'Cada número debe ser entre 0 y 99').isInt({ min: 0, max: 99 })
    ]
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { equipoId, numeros } = req.body;
      
      const partido = await Partido.findById(id)
        .populate('equipoLocal', 'jugadores')
        .populate('equipoVisitante', 'jugadores');
      
      if (!partido) {
        return res.status(404).json({ mensaje: 'Partido no encontrado' });
      }
      
      // Determinar qué equipo usar
      let equipoJugadores = [];
      if (equipoId === partido.equipoLocal._id.toString()) {
        equipoJugadores = partido.equipoLocal.jugadores || [];
      } else if (equipoId === partido.equipoVisitante._id.toString()) {
        equipoJugadores = partido.equipoVisitante.jugadores || [];
      } else {
        return res.status(400).json({ mensaje: 'Equipo no válido para este partido' });
      }
      
      // Validar cada número
      const validacion = numeros.map(numero => {
        const jugador = equipoJugadores.find(j => j.numero === parseInt(numero));
        return {
          numero: parseInt(numero),
          valido: !!jugador,
          jugador: jugador ? {
            _id: jugador._id,
            nombre: jugador.nombre,
            numero: jugador.numero
          } : null
        };
      });
      
      const todosValidos = validacion.every(v => v.valido);
      
      res.json({
        valido: todosValidos,
        validacion,
        mensaje: todosValidos ? 'Todos los números son válidos' : 'Algunos números no son válidos'
      });
      
    } catch (error) {
      console.error('Error al validar jugadores:', error);
      res.status(500).json({ mensaje: 'Error al validar jugadores' });
    }
  }
);

// 🔥 OBTENER JUGADORES DE UN EQUIPO EN EL PARTIDO (PARA REFERENCIA)
router.get('/:id/jugadores/:equipoId',
  [
    auth,
    [
      param('id', 'ID de partido debe ser válido').isMongoId(),
      param('equipoId', 'ID de equipo debe ser válido').isMongoId()
    ]
  ],
  async (req, res) => {
    try {
      const { id, equipoId } = req.params;
      
      const partido = await Partido.findById(id)
        .populate('equipoLocal', 'nombre jugadores')
        .populate('equipoVisitante', 'nombre jugadores');
      
      if (!partido) {
        return res.status(404).json({ mensaje: 'Partido no encontrado' });
      }
      
      let equipo = null;
      let jugadores = [];
      
      if (equipoId === partido.equipoLocal._id.toString()) {
        equipo = partido.equipoLocal;
        jugadores = partido.equipoLocal.jugadores || [];
      } else if (equipoId === partido.equipoVisitante._id.toString()) {
        equipo = partido.equipoVisitante;
        jugadores = partido.equipoVisitante.jugadores || [];
      } else {
        return res.status(400).json({ mensaje: 'Equipo no válido para este partido' });
      }
      
      // Formatear respuesta
      const jugadoresFormateados = jugadores
        .sort((a, b) => a.numero - b.numero) // Ordenar por número
        .map(j => ({
          _id: j._id,
          nombre: j.nombre,
          numero: j.numero,
          posicion: j.posicion
        }));
      
      res.json({
        equipo: {
          _id: equipo._id,
          nombre: equipo.nombre
        },
        jugadores: jugadoresFormateados,
        total: jugadoresFormateados.length
      });
      
    } catch (error) {
      console.error('Error al obtener jugadores:', error);
      res.status(500).json({ mensaje: 'Error al obtener jugadores' });
    }
  }
);

module.exports = router;