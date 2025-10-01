// server/src/config/inscripcionesConfig.js
// Configuración para habilitar/deshabilitar inscripciones por categoría

const inscripcionesConfig = {
  // Configuración por categoría - true = habilitada, false = deshabilitada
  categorias: {
    // Categorías Mixtas
    'mixgold': true,
    'mixsilv': true,
    
    // Categorías Varoniles
    'vargold': true,
    'varsilv': true,
    'varmast': true,
    
    // Categorías Femeniles
    'femgold': true,
    'femsilv': true,
    'femmast': true,
    
    // Categoría Tocho
    'tocho7v7': false,
    
    // Categorías Menores
    'u8': false,
    'u10': false,
    'u12fem': false,
    'u12var': false,
    'u14fem': false,
    'u14var': false,
    'u16fem': false,
    'u16var': false,
    'u18fem': false,
    'u18var': false, // Ejemplo: inscripciones cerradas
  },
  
  // Configuración global - permite deshabilitar todas las inscripciones
  inscripcionesGlobales: true,
  
  // Mensaje personalizado por categoría (opcional)
  mensajesPersonalizados: {
  },
  
  // Función para verificar si una categoría está habilitada
  estaHabilitada: function(categoria) {
    // Verificar primero si las inscripciones están habilitadas globalmente
    if (!this.inscripcionesGlobales) {
      return false;
    }
    
    // Verificar la configuración específica de la categoría
    return this.categorias[categoria] === true;
  },
  
  // Función para obtener el mensaje de error personalizado
  obtenerMensajeError: function(categoria, nombreCategoria) {
    // Si hay un mensaje personalizado, usarlo
    if (this.mensajesPersonalizados[categoria]) {
      return this.mensajesPersonalizados[categoria];
    }
    
    // Mensaje por defecto
    return `Las inscripciones para la categoría '${nombreCategoria}' han finalizado`;
  }
};

module.exports = inscripcionesConfig;