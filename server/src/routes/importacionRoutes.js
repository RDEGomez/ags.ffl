// 📁 server/src/routes/importacionRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { check } = require('express-validator');
const importacionController = require('../controllers/importacionController');
const { auth, checkRole } = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

const uploadLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 60 * 60 * 1000, // 1 hora
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // uploads por hora por IP
  message: {
    mensaje: `Demasiados uploads, intenta en ${Math.round((parseInt(process.env.RATE_LIMIT_WINDOW) || 3600000) / 60000)} minutos`,
    codigo: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🔧 Configuración de Multer para archivos CSV
const storage = multer.memoryStorage(); // Almacenar en memoria para procesamiento directo

const fileFilter = (req, file, cb) => {
  console.log('📁 Archivo recibido:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });

  // Aceptar archivos CSV y de texto
  const allowedTypes = [
    'text/csv',
    'application/csv',
    'text/plain',
    'application/vnd.ms-excel', // Excel CSV
    'application/octet-stream'  // Algunos browsers envían CSV así
  ];

  const allowedExtensions = ['.csv', '.txt'];
  const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));

  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    console.log('✅ Tipo de archivo aceptado');
    cb(null, true);
  } else {
    console.log('❌ Tipo de archivo rechazado:', file.mimetype, fileExtension);
    cb(new Error(`Tipo de archivo no permitido. Solo se aceptan archivos CSV (.csv). Recibido: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // MB máximo desde env
    files: 1
  }
});

// 🔥 Middleware para manejo de errores de Multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          mensaje: 'Archivo demasiado grande',
          error: 'El archivo no debe superar los 10MB',
          codigo: 'FILE_TOO_LARGE'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          mensaje: 'Demasiados archivos',
          error: 'Solo se permite un archivo por importación',
          codigo: 'TOO_MANY_FILES'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          mensaje: 'Campo de archivo inesperado',
          error: 'El campo debe llamarse "archivo"',
          codigo: 'UNEXPECTED_FIELD'
        });
      default:
        return res.status(400).json({
          mensaje: 'Error de archivo',
          error: error.message,
          codigo: 'MULTER_ERROR'
        });
    }
  } else if (error) {
    return res.status(400).json({
      mensaje: 'Error al procesar archivo',
      error: error.message,
      codigo: 'FILE_PROCESSING_ERROR'
    });
  }
  next();
};

// 🏈 IMPORTAR PARTIDOS MASIVAMENTE
router.post('/partidos', 
  [
    uploadLimiter,
    auth,
    checkRole('admin', 'arbitro'),
    upload.single('archivo'),
    handleMulterError,
    [
      // Validaciones adicionales si es necesario
      check('crearEntidadesFaltantes')
        .optional()
        .isBoolean()
        .withMessage('crearEntidadesFaltantes debe ser un booleano'),
      
      check('sobrescribirExistentes')
        .optional()
        .isBoolean()
        .withMessage('sobrescribirExistentes debe ser un booleano')
    ]
  ],
  importacionController.importarPartidos
);

// 🎮 IMPORTAR JUGADAS MASIVAMENTE
router.post('/jugadas',
  [
    uploadLimiter,
    auth,
    checkRole('admin', 'arbitro'),
    upload.single('archivo'),
    handleMulterError,
    [
      check('actualizarMarcadores')
        .optional()
        .isBoolean()
        .withMessage('actualizarMarcadores debe ser un booleano'),
        
      check('validarJugadores')
        .optional()
        .isBoolean()
        .withMessage('validarJugadores debe ser un booleano')
    ]
  ],
  importacionController.importarJugadas
);

// 📋 DESCARGAR PLANTILLAS CSV
router.get('/plantillas/:tipo',
  [
    [
      check('tipo')
        .isIn(['partidos', 'jugadas'])
        .withMessage('Tipo debe ser "partidos" o "jugadas"')
    ]
  ],
  importacionController.descargarPlantilla
);

// 📊 OBTENER PROGRESO DE IMPORTACIÓN (para futuras implementaciones con WebSockets)
router.get('/progreso/:procesoId',
  [
    auth,
    [
      check('procesoId')
        .isMongoId()
        .withMessage('ID de proceso debe ser válido')
    ]
  ],
  importacionController.obtenerProgresoImportacion
);

// 🔍 VALIDAR ARCHIVO CSV SIN IMPORTAR (preview)
router.post('/validar',
  [
    uploadLimiter,
    auth,
    checkRole('admin', 'arbitro'),
    upload.single('archivo'),
    handleMulterError,
    [
      check('tipo')
        .isIn(['partidos', 'jugadas'])
        .withMessage('Tipo debe ser "partidos" o "jugadas"')
    ]
  ],
  async (req, res) => {
    try {
      console.log('\n🔍 VALIDANDO ARCHIVO CSV - MODO PREVIEW');
      
      if (!req.file) {
        return res.status(400).json({ mensaje: 'No se proporcionó archivo CSV' });
      }

      const Papa = require('papaparse');
      const fileContent = req.file.buffer.toString('utf8');
      
      // Parsear CSV
      const parseResult = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_')
      });

      const data = parseResult.data;
      const headers = Object.keys(data[0] || {});

      // Campos esperados según el tipo
      const camposEsperados = {
        partidos: [
          { key: 'equipo_local', required: true, description: 'Nombre del equipo local' },
          { key: 'equipo_visitante', required: true, description: 'Nombre del equipo visitante' },
          { key: 'torneo', required: true, description: 'Nombre del torneo' },
          { key: 'fecha_hora', required: true, description: 'Fecha y hora (YYYY-MM-DD HH:MM)' },
          { key: 'categoria', required: false, description: 'Categoría del partido' },
          { key: 'sede_nombre', required: false, description: 'Nombre de la sede' },
          { key: 'sede_direccion', required: false, description: 'Dirección de la sede' },
          { key: 'arbitro_principal', required: false, description: 'Nombre del árbitro principal' },
          { key: 'estado', required: false, description: 'Estado del partido (programado, finalizado, etc.)' },
          { key: 'marcador_local', required: false, description: 'Puntos del equipo local' },
          { key: 'marcador_visitante', required: false, description: 'Puntos del equipo visitante' },
          { key: 'observaciones', required: false, description: 'Comentarios adicionales' },
          { key: 'duracion_minutos', required: false, description: 'Duración en minutos (default: 50)' }
        ],
        jugadas: [
          { key: 'partido_id', required: true, description: 'ID del partido (ObjectId)' },
          { key: 'minuto', required: false, description: 'Minuto de la jugada' },
          { key: 'segundo', required: false, description: 'Segundo de la jugada' },
          { key: 'periodo', required: false, description: 'Período del partido (1 o 2)' },
          { key: 'equipo_posesion', required: true, description: 'Nombre del equipo en posesión' },
          { key: 'tipo_jugada', required: true, description: 'Tipo de jugada (pase_completo, touchdown, etc.)' },
          { key: 'jugador_principal', required: true, description: 'Nombre del jugador principal' },
          { key: 'jugador_secundario', required: false, description: 'Nombre del jugador secundario' },
          { key: 'descripcion', required: false, description: 'Descripción de la jugada' },
          { key: 'puntos', required: false, description: 'Puntos obtenidos' },
          { key: 'touchdown', required: false, description: 'Es touchdown (true/false)' },
          { key: 'intercepcion', required: false, description: 'Es intercepción (true/false)' },
          { key: 'sack', required: false, description: 'Es sack (true/false)' }
        ]
      };

      const campos = camposEsperados[req.body.tipo] || camposEsperados.partidos;

      // Validar estructura
      const camposRequeridos = campos.filter(c => c.required).map(c => c.key);
      const camposFaltantes = camposRequeridos.filter(campo => !headers.includes(campo));
      const camposExtra = headers.filter(header => !campos.find(c => c.key === header));

      // Análisis de datos
      const analisis = {
        archivo: {
          nombre: req.file.originalname,
          tamaño: `${Math.round(req.file.size / 1024)}KB`,
          tipo: req.file.mimetype
        },
        estructura: {
          filas: data.length,
          columnas: headers.length,
          headers: headers
        },
        validacion: {
          camposFaltantes: camposFaltantes,
          camposExtra: camposExtra,
          erroresEstructura: []
        },
        preview: data.slice(0, 5), // Primeras 5 filas como preview
        mapeoCampos: campos
      };

      // Agregar errores de estructura
      if (camposFaltantes.length > 0) {
        analisis.validacion.erroresEstructura.push({
          tipo: 'error',
          mensaje: `Campos requeridos faltantes: ${camposFaltantes.join(', ')}`
        });
      }

      if (camposExtra.length > 0) {
        analisis.validacion.erroresEstructura.push({
          tipo: 'warning',
          mensaje: `Campos adicionales encontrados: ${camposExtra.join(', ')} (serán ignorados)`
        });
      }

      if (data.length === 0) {
        analisis.validacion.erroresEstructura.push({
          tipo: 'error',
          mensaje: 'El archivo no contiene datos válidos'
        });
      }

      // Determinar si se puede procesar
      const puedeImportar = camposFaltantes.length === 0 && data.length > 0;

      console.log('✅ Validación completada');
      console.log(`  📊 Filas: ${data.length}`);
      console.log(`  📋 Columnas: ${headers.length}`);
      console.log(`  ❌ Errores estructura: ${analisis.validacion.erroresEstructura.filter(e => e.tipo === 'error').length}`);
      console.log(`  ⚠️ Warnings: ${analisis.validacion.erroresEstructura.filter(e => e.tipo === 'warning').length}`);

      res.json({
        mensaje: 'Validación completada',
        puedeImportar,
        analisis
      });

    } catch (error) {
      console.error('Error en validación:', error);
      res.status(500).json({
        mensaje: 'Error al validar archivo',
        error: error.message
      });
    }
  }
);

// 🗑️ LIMPIAR IMPORTACIONES (para testing y desarrollo)
router.delete('/limpiar/:tipo',
  [
    auth,
    checkRole('admin'), // Solo admin puede limpiar
    [
      check('tipo')
        .isIn(['partidos', 'jugadas', 'todo'])
        .withMessage('Tipo debe ser "partidos", "jugadas" o "todo"'),
        
      check('confirmar')
        .equals('SI_ESTOY_SEGURO')
        .withMessage('Debe confirmar con "SI_ESTOY_SEGURO"')
    ]
  ],
  async (req, res) => {
    try {
      const { tipo } = req.params;
      const { limite } = req.body; // Opcional: límite de registros a eliminar
      
      console.log(`\n🗑️ LIMPIEZA DE DATOS - Tipo: ${tipo}`);
      
      let resultados = {
        partidosEliminados: 0,
        jugadasEliminadas: 0
      };

      if (tipo === 'partidos' || tipo === 'todo') {
        const filtro = limite ? {} : { creadoPor: req.usuario._id }; // Si hay límite, eliminar todos, sino solo los del usuario
        const partidos = await require('../models/Partido').find(filtro).limit(limite || 0);
        
        // Contar jugadas antes de eliminar partidos
        const totalJugadas = partidos.reduce((sum, partido) => sum + partido.jugadas.length, 0);
        
        const deleteResult = await require('../models/Partido').deleteMany(filtro);
        resultados.partidosEliminados = deleteResult.deletedCount;
        resultados.jugadasEliminadas += totalJugadas;
      }

      if (tipo === 'jugadas' && tipo !== 'todo') {
        // Limpiar solo jugadas, mantener partidos
        const partidos = await require('../models/Partido').find({ creadoPor: req.usuario._id });
        
        for (const partido of partidos) {
          resultados.jugadasEliminadas += partido.jugadas.length;
          partido.jugadas = [];
          partido.marcador = { local: 0, visitante: 0 };
          await partido.save();
        }
      }

      console.log('✅ Limpieza completada:', resultados);

      res.json({
        mensaje: `Limpieza de ${tipo} completada`,
        resultados,
        advertencia: 'Esta acción no se puede deshacer'
      });

    } catch (error) {
      console.error('Error en limpieza:', error);
      res.status(500).json({
        mensaje: 'Error al limpiar datos',
        error: error.message
      });
    }
  }
);

// 📊 ESTADÍSTICAS DE IMPORTACIÓN
router.get('/estadisticas',
  auth,
  async (req, res) => {
    try {
      const Partido = require('../models/Partido');
      
      const estadisticas = await Promise.all([
        // Total de partidos
        Partido.countDocuments(),
        
        // Partidos creados por importación (últimos 30 días)
        Partido.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }),
        
        // Partidos con jugadas
        Partido.countDocuments({
          'jugadas.0': { $exists: true }
        }),
        
        // Total de jugadas
        Partido.aggregate([
          { $project: { jugadasCount: { $size: '$jugadas' } } },
          { $group: { _id: null, total: { $sum: '$jugadasCount' } } }
        ])
      ]);

      const [totalPartidos, partidosRecientes, partidosConJugadas, totalJugadasResult] = estadisticas;
      const totalJugadas = totalJugadasResult[0]?.total || 0;

      res.json({
        mensaje: 'Estadísticas de importación',
        estadisticas: {
          partidos: {
            total: totalPartidos,
            recientes: partidosRecientes,
            conJugadas: partidosConJugadas,
            sinJugadas: totalPartidos - partidosConJugadas
          },
          jugadas: {
            total: totalJugadas,
            promedioPorPartido: partidosConJugadas > 0 ? Math.round(totalJugadas / partidosConJugadas) : 0
          },
          rendimiento: {
            cobertura: partidosConJugadas > 0 ? Math.round((partidosConJugadas / totalPartidos) * 100) : 0,
            actividad: partidosRecientes
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        mensaje: 'Error al obtener estadísticas',
        error: error.message
      });
    }
  }
);

// 📋 DESCARGAR PLANTILLAS CSV
router.get('/plantillas/:tipo',
  [
    [
      check('tipo')
        .isIn(['partidos', 'jugadas'])
        .withMessage('Tipo debe ser "partidos" o "jugadas"')
    ]
  ],
  importacionController.descargarPlantilla
);

// 📊 NUEVO: Obtener información de equipos y categorías para importación
router.get('/equipos-info',
  auth,
  importacionController.obtenerInfoEquiposYCategorias
);

// 🔍 NUEVO: Validar conflictos de equipos antes de importar
router.post('/validar-equipos',
  [
    uploadLimiter,
    auth,
    checkRole('admin', 'arbitro'),
    upload.single('archivo'),
    handleMulterError,
    [
      check('mostrarConflictos')
        .optional()
        .isBoolean()
        .withMessage('mostrarConflictos debe ser un booleano')
    ]
  ],
  async (req, res) => {
    try {
      console.log('\n🔍 VALIDANDO CONFLICTOS DE EQUIPOS - MODO PREVIEW');
      
      if (!req.file) {
        return res.status(400).json({ mensaje: 'No se proporcionó archivo CSV' });
      }

      const Papa = require('papaparse');
      const fileContent = req.file.buffer.toString('utf8');
      
      // Parsear CSV
      const parseResult = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_')
      });

      const data = parseResult.data;
      const headers = Object.keys(data[0] || {});

      // Detectar mapeo automático
      const detectarMapeoAutomatico = (headers) => {
        const mappings = {};
        
        const camposEsperados = {
          equipo_local: ['equipo_local', 'local', 'home', 'casa', 'equipo1'],
          equipo_visitante: ['equipo_visitante', 'visitante', 'away', 'visita', 'equipo2'],
          categoria: ['categoria', 'category', 'division', 'clase']
        };
        
        Object.entries(camposEsperados).forEach(([campo, alternativas]) => {
          const header = headers.find(h => {
            const headerNormalizado = h.toLowerCase().replace(/[_\s-]/g, '');
            return alternativas.some(alt => 
              headerNormalizado === alt.replace(/[_\s-]/g, '') ||
              headerNormalizado.includes(alt.replace(/[_\s-]/g, '')) ||
              alt.replace(/[_\s-]/g, '').includes(headerNormalizado)
            );
          });
          
          if (header) {
            mappings[campo] = header;
          }
        });
        
        return mappings;
      };

      const mappings = detectarMapeoAutomatico(headers);
      
      // Validar equipos y detectar conflictos
      const { validarEquiposEnCSV } = require('../controllers/importacionController');
      const conflictosPotenciales = await validarEquiposEnCSV(data, mappings);
      
      // Obtener estadísticas de equipos
      const Equipo = require('../models/Equipo');
      const equiposPorCategoria = await Equipo.aggregate([
        {
          $match: { estado: 'activo' }
        },
        {
          $group: {
            _id: '$categoria',
            equipos: {
              $push: {
                nombre: '$nombre',
                id: '$_id'
              }
            },
            total: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      // Análisis de datos del CSV
      const equiposEnCSV = new Set();
      data.forEach(fila => {
        if (fila[mappings.equipo_local]) equiposEnCSV.add(fila[mappings.equipo_local]);
        if (fila[mappings.equipo_visitante]) equiposEnCSV.add(fila[mappings.equipo_visitante]);
      });

      const analisis = {
        archivo: {
          nombre: req.file.originalname,
          filas: data.length,
          headers: headers
        },
        mapeo: mappings,
        equipos: {
          enCSV: Array.from(equiposEnCSV),
          totalEnCSV: equiposEnCSV.size,
          enSistema: equiposPorCategoria
        },
        conflictos: {
          detectados: conflictosPotenciales.length,
          detalles: conflictosPotenciales,
          requiereCategoría: conflictosPotenciales.length > 0 && !mappings.categoria
        },
        recomendaciones: []
      };

      // Generar recomendaciones
      if (conflictosPotenciales.length > 0) {
        if (!mappings.categoria) {
          analisis.recomendaciones.push({
            tipo: 'error',
            titulo: 'Agregar columna de categoría',
            mensaje: `Se detectaron ${conflictosPotenciales.length} equipos con nombres ambiguos. Agrega una columna "categoria" a tu CSV.`,
            accion: 'Incluir columna: categoria'
          });
        } else {
          analisis.recomendaciones.push({
            tipo: 'warning',
            titulo: 'Verificar categorías',
            mensaje: 'Se detectaron conflictos pero tienes columna de categoría. Verifica que las categorías sean correctas.',
            accion: 'Revisar valores de categoría'
          });
        }
      } else {
        analisis.recomendaciones.push({
          tipo: 'success',
          titulo: 'Sin conflictos detectados',
          mensaje: 'Los nombres de equipos en tu CSV son únicos o están bien categorizados.',
          accion: 'Continuar con la importación'
        });
      }

      if (!mappings.categoria) {
        analisis.recomendaciones.push({
          tipo: 'info',
          titulo: 'Categoría recomendada',
          mensaje: 'Aunque no se detectaron conflictos, es recomendable incluir la categoría para mayor precisión.',
          accion: 'Opcional: agregar columna categoria'
        });
      }

      console.log('✅ Validación de conflictos completada');
      console.log(`  📊 Equipos en CSV: ${equiposEnCSV.size}`);
      console.log(`  ⚠️ Conflictos: ${conflictosPotenciales.length}`);
      console.log(`  📋 Categoría incluida: ${mappings.categoria ? 'SÍ' : 'NO'}`);

      res.json({
        mensaje: 'Validación de conflictos completada',
        puedeImportar: conflictosPotenciales.length === 0 || mappings.categoria,
        analisis
      });

    } catch (error) {
      console.error('Error en validación de conflictos:', error);
      res.status(500).json({
        mensaje: 'Error al validar conflictos de equipos',
        error: error.message
      });
    }
  }
);

module.exports = router;