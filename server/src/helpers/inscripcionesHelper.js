// server/src/helpers/inscripcionesHelper.js
const inscripcionesConfig = require('../config/inscripcionesConfig');

// Función para obtener el nombre legible de la categoría
const getCategoryName = (categoria) => {
  const nombres = {
    'mixgold': 'Mixto Golden',
    'mixsilv': 'Mixto Silver',
    'vargold': 'Varonil Golden',
    'varsilv': 'Varonil Silver',
    'femgold': 'Femenil Golden',
    'femsilv': 'Femenil Silver',
    'varmast': 'Varonil Master',
    'femmast': 'Femenil Master',
    'tocho7v7': 'Tocho 7v7',
    'u8': 'U-8',
    'u10': 'U-10',
    'u12fem': 'U-12 Femenil',
    'u12var': 'U-12 Varonil',
    'u14fem': 'U-14 Femenil',
    'u14var': 'U-14 Varonil',
    'u16fem': 'U-16 Femenil',
    'u16var': 'U-16 Varonil',
    'u17fem': 'U-17 Femenil',
    'u17var': 'U-17 Varonil',
    'u18fem': 'U-18 Femenil',
    'u18var': 'U-18 Varonil',
  };
  
  return nombres[categoria] || categoria;
};

/**
 * Valida si las inscripciones están habilitadas para una categoría específica
 * @param {string} categoria - La categoría del equipo
 * @returns {Object} - { esValida: boolean, mensaje?: string }
 */
const validarInscripcionHabilitada = (categoria) => {
  console.log(`🔍 Validando inscripciones para categoría: ${categoria}`);
  
  // Verificar si las inscripciones están habilitadas globalmente
  if (!inscripcionesConfig.inscripcionesGlobales) {
    console.log('❌ Inscripciones deshabilitadas globalmente');
    return {
      esValida: false,
      mensaje: 'Las inscripciones están temporalmente deshabilitadas'
    };
  }
  
  // Verificar si la categoría específica está habilitada
  if (!inscripcionesConfig.estaHabilitada(categoria)) {
    const nombreCategoria = getCategoryName(categoria);
    const mensaje = inscripcionesConfig.obtenerMensajeError(categoria, nombreCategoria);
    
    console.log(`❌ Inscripciones deshabilitadas para categoría: ${categoria}`);
    return {
      esValida: false,
      mensaje: mensaje
    };
  }
  
  console.log(`✅ Inscripciones habilitadas para categoría: ${categoria}`);
  return {
    esValida: true
  };
};

/**
 * Middleware para validar inscripciones antes de procesar
 * Uso: app.use('/api/inscripciones', validarInscripcionesMiddleware);
 */
const validarInscripcionesMiddleware = async (req, res, next) => {
  try {
    const { equipoId } = req.body;
    
    if (!equipoId) {
      return res.status(400).json({ mensaje: 'ID de equipo requerido' });
    }
    
    // Buscar el equipo para obtener su categoría
    const Equipo = require('../models/Equipo');
    const equipo = await Equipo.findById(equipoId);
    
    if (!equipo) {
      return res.status(404).json({ mensaje: 'Equipo no encontrado' });
    }
    
    // Validar si las inscripciones están habilitadas
    const validacion = validarInscripcionHabilitada(equipo.categoria);
    
    if (!validacion.esValida) {
      return res.status(403).json({ mensaje: validacion.mensaje });
    }
    
    // Si pasa la validación, continuar con el siguiente middleware
    next();
    
  } catch (error) {
    console.error('Error en validación de inscripciones:', error);
    res.status(500).json({ mensaje: 'Error al validar inscripciones' });
  }
};

module.exports = {
  validarInscripcionHabilitada,
  validarInscripcionesMiddleware,
  getCategoryName
};