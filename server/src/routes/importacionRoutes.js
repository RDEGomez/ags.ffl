// 📁 server/src/routes/importacionRoutes.js - MODIFICADO PARA NÚMEROS DE JUGADORES
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

// 🏈 IMPORTAR PARTIDOS MASIVAMENTE (sin cambios - mantiene nombres de equipos)
router.post('/partidos', 
  [
    uploadLimiter,
    auth,
    checkRole('admin', 'arbitro'),
    upload.single('archivo'),
    handleMulterError,
    [
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

// 🎮 FUNCIÓN MODIFICADA: IMPORTAR JUGADAS MASIVAMENTE - AHORA USA NÚMEROS
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

// 🔍 FUNCIÓN MODIFICADA: VALIDAR ARCHIVO CSV SIN IMPORTAR (preview) - AHORA RECONOCE NÚMEROS
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

      // 🔥 MODIFICADO: Campos esperados según el tipo - AHORA USA NÚMEROS
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
          // 🔥 CAMBIADO: De nombres a números de jugadores
          { key: 'numero_jugador_principal', required: true, description: 'Número del jugador principal (ej: 12)' },
          { key: 'numero_jugador_secundario', required: false, description: 'Número del jugador secundario (ej: 25)' },
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

      // 🔥 NUEVA VALIDACIÓN: Verificar si se están usando nombres en lugar de números
      const camposObsoletos = [];
      if (req.body.tipo === 'jugadas') {
        // Verificar si están usando los campos antiguos (nombres)
        if (headers.includes('jugador_principal')) {
          camposObsoletos.push({
            campoEncontrado: 'jugador_principal',
            campoNuevo: 'numero_jugador_principal',
            mensaje: 'Ahora se debe usar el número del jugador en lugar del nombre'
          });
        }
        if (headers.includes('jugador_secundario')) {
          camposObsoletos.push({
            campoEncontrado: 'jugador_secundario',
            campoNuevo: 'numero_jugador_secundario',
            mensaje: 'Ahora se debe usar el número del jugador en lugar del nombre'
          });
        }
      }

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
          camposObsoletos: camposObsoletos, // 🔥 NUEVO
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

      // 🔥 NUEVO: Errores por campos obsoletos
      if (camposObsoletos.length > 0) {
        camposObsoletos.forEach(obsoleto => {
          analisis.validacion.erroresEstructura.push({
            tipo: 'error',
            mensaje: `Campo obsoleto encontrado: "${obsoleto.campoEncontrado}". ${obsoleto.mensaje}. Use "${obsoleto.campoNuevo}" en su lugar.`
          });
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

      // 🔥 VALIDACIÓN ADICIONAL: Verificar formato de números de jugadores
      if (req.body.tipo === 'jugadas' && data.length > 0) {
        let erroresNumeros = 0;
        const primerasFilas = data.slice(0, 3); // Verificar solo las primeras 3 filas para el preview
        
        primerasFilas.forEach((fila, index) => {
          // Verificar jugador principal
          if (fila.numero_jugador_principal) {
            const numero = parseInt(fila.numero_jugador_principal);
            if (isNaN(numero) || numero <= 0) {
              erroresNumeros++;
              if (erroresNumeros <= 2) { // Solo mostrar los primeros 2 errores
                analisis.validacion.erroresEstructura.push({
                  tipo: 'error',
                  mensaje: `Fila ${index + 2}: "numero_jugador_principal" debe ser un número positivo, encontrado: "${fila.numero_jugador_principal}"`
                });
              }
            }
          }
          
          // Verificar jugador secundario (si existe)
          if (fila.numero_jugador_secundario) {
            const numero = parseInt(fila.numero_jugador_secundario);
            if (isNaN(numero) || numero <= 0) {
              erroresNumeros++;
              if (erroresNumeros <= 2) { // Solo mostrar los primeros 2 errores
                analisis.validacion.erroresEstructura.push({
                  tipo: 'error',
                  mensaje: `Fila ${index + 2}: "numero_jugador_secundario" debe ser un número positivo, encontrado: "${fila.numero_jugador_secundario}"`
                });
              }
            }
          }
        });
        
        if (erroresNumeros > 2) {
          analisis.validacion.erroresEstructura.push({
            tipo: 'warning',
            mensaje: `Se encontraron ${erroresNumeros} errores de formato en números de jugadores. Revisa todos los valores.`
          });
        }
      }

      // Determinar si se puede procesar
      const puedeImportar = camposFaltantes.length === 0 && 
                           camposObsoletos.length === 0 && 
                           data.length > 0 &&
                           analisis.validacion.erroresEstructura.filter(e => e.tipo === 'error').length === 0;

      console.log('✅ Validación completada');
      console.log(`  📊 Filas: ${data.length}`);
      console.log(`  📋 Columnas: ${headers.length}`);
      console.log(`  ❌ Errores estructura: ${analisis.validacion.erroresEstructura.filter(e => e.tipo === 'error').length}`);
      console.log(`  ⚠️ Warnings: ${analisis.validacion.erroresEstructura.filter(e => e.tipo === 'warning').length}`);
      console.log(`  🔄 Campos obsoletos: ${camposObsoletos.length}`);

      res.json({
        mensaje: 'Validación completada',
        puedeImportar,
        analisis,
        // 🔥 NUEVO: Sugerencias específicas para el cambio a números
        sugerencias: puedeImportar ? [] : [
          ...(camposFaltantes.length > 0 ? [`Agrega los campos requeridos: ${camposFaltantes.join(', ')}`] : []),
          ...(camposObsoletos.length > 0 ? [
            'IMPORTANTE: El sistema ahora usa números de jugadores en lugar de nombres',
            'Cambia "jugador_principal" por "numero_jugador_principal"',
            'Cambia "jugador_secundario" por "numero_jugador_secundario"',
            'Los valores deben ser números enteros positivos (ej: 12, 25, 8)'
          ] : []),
          'Descarga la plantilla actualizada si tienes dudas'
        ]
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

// 📊 OBTENER ESTADÍSTICAS DE IMPORTACIÓN
router.get('/estadisticas',
  [auth],
  async (req, res) => {
    try {
      console.log('📊 Obteniendo estadísticas de importación...');
      
      const Partido = require('../models/Partido');
      
      // Estadísticas de partidos
      const totalPartidos = await Partido.countDocuments();
      const partidosConJugadas = await Partido.countDocuments({ 
        'jugadas.0': { $exists: true } 
      });
      
      // Partidos recientes (últimos 30 días)
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - 30);
      
      const partidosRecientes = await Partido.countDocuments({
        fechaHora: { $gte: fechaLimite }
      });
      
      // Promedio de jugadas por partido
      const resultadosJugadas = await Partido.aggregate([
        { $match: { 'jugadas.0': { $exists: true } } },
        { $project: { cantidadJugadas: { $size: '$jugadas' } } },
        { $group: { _id: null, totalJugadas: { $sum: '$cantidadJugadas' } } }
      ]);
      
      const totalJugadas = resultadosJugadas[0]?.totalJugadas || 0;

      res.json({
        mensaje: 'Estadísticas obtenidas correctamente',
        estadisticas: {
          partidos: {
            total: totalPartidos,
            conJugadas: partidosConJugadas,
            sinJugadas: totalPartidos - partidosConJugadas,
            porcentajeConJugadas: totalPartidos > 0 ? Math.round((partidosConJugadas / totalPartidos) * 100) : 0
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

// 📊 OBTENER INFORMACIÓN DE EQUIPOS Y CATEGORÍAS
router.get('/equipos-info',
  auth,
  importacionController.obtenerInfoEquiposYCategorias
);

// 🔍 VALIDAR CONFLICTOS DE EQUIPOS ANTES DE IMPORTAR
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
      const equiposActivos = await Equipo.countDocuments({ estado: 'activo' });
      
      // Extraer equipos únicos del CSV
      const equiposEnCSV = new Set();
      data.forEach(fila => {
        if (fila[mappings.equipo_local]) equiposEnCSV.add(fila[mappings.equipo_local]);
        if (fila[mappings.equipo_visitante]) equiposEnCSV.add(fila[mappings.equipo_visitante]);
      });

      const analisis = {
        archivo: {
          nombre: req.file.originalname,
          filas: data.length,
          equiposUnicos: equiposEnCSV.size
        },
        sistema: {
          equiposActivos: equiposActivos,
          categoriaIncluida: !!mappings.categoria
        },
        conflictos: {
          detectados: conflictosPotenciales.length,
          detalles: conflictosPotenciales
        },
        recomendaciones: []
      };

      if (conflictosPotenciales.length > 0 && !mappings.categoria) {
        analisis.recomendaciones.push({
          tipo: 'warning',
          mensaje: 'Se detectaron equipos con nombres similares',
          accion: 'Agregar columna "categoria" al CSV para resolver ambigüedades'
        });
      }

      if (!mappings.categoria) {
        analisis.recomendaciones.push({
          tipo: 'info',
          mensaje: 'Columna "categoria" no encontrada',
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
        const filtro = limite ? 
          { creadoPor: req.usuario._id } : // Si hay límite, solo los del usuario
          {}; // Sin límite, todos (solo admin)
          
        const partidosEliminados = await Partido.deleteMany(filtro);
        resultados.partidosEliminados = partidosEliminados.deletedCount;
      }

      if (tipo === 'jugadas' || tipo === 'todo') {
        // Para jugadas, actualizar partidos removiendo todas las jugadas
        const partidosActualizados = await Partido.updateMany(
          {}, 
          { $set: { jugadas: [] } }
        );
        resultados.jugadasEliminadas = partidosActualizados.modifiedCount;
      }

      console.log(`✅ Limpieza completada: ${JSON.stringify(resultados)}`);

      res.json({
        mensaje: 'Limpieza completada exitosamente',
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

module.exports = router;