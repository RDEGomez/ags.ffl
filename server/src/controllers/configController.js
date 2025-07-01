// server/src/controllers/configController.js
// Nuevo controlador para gestionar la configuración de inscripciones

const fs = require('fs').promises;
const path = require('path');
const inscripcionesConfig = require('../config/inscripcionesConfig');

// Ruta del archivo de configuración
const CONFIG_FILE_PATH = path.join(__dirname, '../config/inscripcionesConfig.js');

/**
 * Obtener la configuración actual de inscripciones
 */
exports.obtenerConfigInscripciones = async (req, res) => {
  try {
    console.log('📋 Obteniendo configuración de inscripciones...');
    
    const config = {
      inscripcionesGlobales: inscripcionesConfig.inscripcionesGlobales,
      categorias: inscripcionesConfig.categorias,
      mensajesPersonalizados: inscripcionesConfig.mensajesPersonalizados
    };

    res.json({
      mensaje: 'Configuración obtenida correctamente',
      configuracion: config
    });

  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({ 
      mensaje: 'Error al obtener configuración de inscripciones',
      error: error.message 
    });
  }
};

/**
 * Actualizar configuración de inscripciones globales
 */
exports.actualizarInscripcionesGlobales = async (req, res) => {
  try {
    const { habilitadas } = req.body;

    if (typeof habilitadas !== 'boolean') {
      return res.status(400).json({ 
        mensaje: 'El parámetro "habilitadas" debe ser un booleano' 
      });
    }

    console.log(`🔄 Actualizando inscripciones globales a: ${habilitadas}`);
    
    // Actualizar en memoria
    inscripcionesConfig.inscripcionesGlobales = habilitadas;

    res.json({
      mensaje: `Inscripciones globales ${habilitadas ? 'habilitadas' : 'deshabilitadas'} correctamente`,
      inscripcionesGlobales: inscripcionesConfig.inscripcionesGlobales
    });

  } catch (error) {
    console.error('Error al actualizar inscripciones globales:', error);
    res.status(500).json({ 
      mensaje: 'Error al actualizar inscripciones globales',
      error: error.message 
    });
  }
};

/**
 * Actualizar configuración de una categoría específica
 */
exports.actualizarCategoria = async (req, res) => {
  try {
    const { categoria } = req.params;
    const { habilitada, mensajePersonalizado } = req.body;

    if (typeof habilitada !== 'boolean') {
      return res.status(400).json({ 
        mensaje: 'El parámetro "habilitada" debe ser un booleano' 
      });
    }

    // Verificar que la categoría existe
    if (!(categoria in inscripcionesConfig.categorias)) {
      return res.status(404).json({ 
        mensaje: `La categoría "${categoria}" no existe en la configuración` 
      });
    }

    console.log(`🔄 Actualizando categoría ${categoria} a: ${habilitada}`);
    
    // Actualizar en memoria
    inscripcionesConfig.categorias[categoria] = habilitada;
    
    // Actualizar mensaje personalizado si se proporciona
    if (mensajePersonalizado) {
      inscripcionesConfig.mensajesPersonalizados[categoria] = mensajePersonalizado;
    } else if (!habilitada && !inscripcionesConfig.mensajesPersonalizados[categoria]) {
      // Si se deshabilita y no hay mensaje, crear uno por defecto
      const { getCategoryName } = require('../helpers/inscripcionesHelper');
      const nombreCategoria = getCategoryName(categoria);
      inscripcionesConfig.mensajesPersonalizados[categoria] = 
        `Las inscripciones para la categoría '${nombreCategoria}' han finalizado`;
    }

    res.json({
      mensaje: `Categoría ${categoria} actualizada correctamente`,
      categoria: categoria,
      habilitada: inscripcionesConfig.categorias[categoria],
      mensajePersonalizado: inscripcionesConfig.mensajesPersonalizados[categoria]
    });

  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    res.status(500).json({ 
      mensaje: 'Error al actualizar configuración de categoría',
      error: error.message 
    });
  }
};

/**
 * Obtener estado de inscripciones por categoría (para frontend)
 */
exports.obtenerEstadoInscripciones = async (req, res) => {
  try {
    const { validarInscripcionHabilitada, getCategoryName } = require('../helpers/inscripcionesHelper');
    
    const estadoPorCategoria = {};
    
    // Obtener todas las categorías disponibles
    const categorias = [
      'mixgold', 'mixsilv', 'vargold', 'varsilv', 'femgold', 'femsilv',
      'varmast', 'femmast', 'tocho7v7', 'u8', 'u10', 'u12fem', 'u12var',
      'u14fem', 'u14var', 'u16fem', 'u16var', 'u18fem', 'u18var'
    ];

    for (const categoria of categorias) {
      const validacion = validarInscripcionHabilitada(categoria);
      estadoPorCategoria[categoria] = {
        nombre: getCategoryName(categoria),
        habilitada: validacion.esValida,
        mensaje: validacion.mensaje || null
      };
    }

    res.json({
      mensaje: 'Estado de inscripciones obtenido correctamente',
      inscripcionesGlobales: inscripcionesConfig.inscripcionesGlobales,
      categorias: estadoPorCategoria
    });

  } catch (error) {
    console.error('Error al obtener estado de inscripciones:', error);
    res.status(500).json({ 
      mensaje: 'Error al obtener estado de inscripciones',
      error: error.message 
    });
  }
};

/**
 * Habilitar/deshabilitar múltiples categorías
 */
exports.actualizarMultiplesCategorias = async (req, res) => {
  try {
    const { actualizaciones } = req.body;

    if (!Array.isArray(actualizaciones)) {
      return res.status(400).json({ 
        mensaje: 'Se esperaba un array de actualizaciones' 
      });
    }

    const resultados = [];
    const errores = [];

    for (const actualizacion of actualizaciones) {
      const { categoria, habilitada, mensajePersonalizado } = actualizacion;

      try {
        // Verificar que la categoría existe
        if (!(categoria in inscripcionesConfig.categorias)) {
          errores.push(`La categoría "${categoria}" no existe`);
          continue;
        }

        // Actualizar categoría
        inscripcionesConfig.categorias[categoria] = habilitada;
        
        // Actualizar mensaje personalizado si se proporciona
        if (mensajePersonalizado) {
          inscripcionesConfig.mensajesPersonalizados[categoria] = mensajePersonalizado;
        }

        resultados.push({
          categoria,
          habilitada,
          actualizada: true
        });

      } catch (error) {
        errores.push(`Error en categoría ${categoria}: ${error.message}`);
      }
    }

    res.json({
      mensaje: `${resultados.length} categorías actualizadas correctamente`,
      resultados,
      errores: errores.length > 0 ? errores : undefined
    });

  } catch (error) {
    console.error('Error al actualizar múltiples categorías:', error);
    res.status(500).json({ 
      mensaje: 'Error al actualizar múltiples categorías',
      error: error.message 
    });
  }
};