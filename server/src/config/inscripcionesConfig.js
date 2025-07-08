// server/src/config/inscripcionesConfig.js
// Configuración para habilitar/deshabilitar inscripciones por categoría

const inscripcionesConfig = {
  // Configuración por categoría - true = habilitada, false = deshabilitada
  categorias: {
    // Categorías Mixtas
    'mixgold': true,
    'mixsilv': false,
    
    // Categorías Varoniles
    'vargold': true,
    'varsilv': false,
    'varmast': true, // Ejemplo: inscripciones cerradas
    
    // Categorías Femeniles
    'femgold': true,
    'femsilv': false,
    'femmast': true, // Ejemplo: inscripciones cerradas
    
    // Categoría Tocho
    'tocho7v7': true,
    
    // Categorías Menores
    'u8': true,
    'u10': true,
    'u12fem': true, // Ejemplo: inscripciones cerradas
    'u12var': true,
    'u14fem': true,
    'u14var': true,
    'u16fem': true, // Ejemplo: inscripciones cerradas
    'u16var': true,
    'u18fem': true,
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