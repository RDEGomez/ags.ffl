// 📁 client/src/helpers/arbitroMappings.js

export const NIVEL_ARBITRO_NAMES = {
  'Local': "Local",
  'Regional': "Regional", 
  'Nacional': "Nacional",
  'Internacional': "Internacional"
};

export const POSICION_NAMES = {
  principal: "Árbitro Principal",
  backeador: "Back Judge",
  estadistico: "Estadístico"
};

export const ESTADO_ARBITRO_NAMES = {
  activo: "Activo",
  inactivo: "Inactivo",
  suspendido: "Suspendido"
};

export const DISPONIBILIDAD_NAMES = {
  true: "Disponible",
  false: "Ocupado"
};

// Funciones de utilidad
export const getNivelArbitroName = (nivel) => NIVEL_ARBITRO_NAMES[nivel] || nivel;
export const getPosicionName = (posicion) => POSICION_NAMES[posicion] || posicion;
export const getEstadoArbitroName = (estado) => ESTADO_ARBITRO_NAMES[estado] || estado;
export const getDisponibilidadName = (disponible) => DISPONIBILIDAD_NAMES[disponible] || 'Desconocido';

// Obtener color para estados
export const getEstadoColor = (estado) => {
  switch(estado) {
    case 'activo': return 'success';
    case 'inactivo': return 'default';
    case 'suspendido': return 'error';
    default: return 'default';
  }
};

// Obtener color para niveles
export const getNivelColor = (nivel) => {
  switch(nivel) {
    case 'Local': return '#4caf50';
    case 'Regional': return '#ff9800';
    case 'Nacional': return '#f44336';
    case 'Internacional': return '#9c27b0';
    default: return '#9e9e9e';
  }
};

// Obtener color para disponibilidad
export const getDisponibilidadColor = (disponible) => {
  return disponible ? 'success' : 'warning';
};

// Arrays para formularios - ESTOS SON LOS QUE FALTAN
export const NIVELES_ARBITRO = Object.keys(NIVEL_ARBITRO_NAMES).map(key => ({
  value: key,
  label: NIVEL_ARBITRO_NAMES[key]
}));

export const POSICIONES_ARBITRO = Object.keys(POSICION_NAMES).map(key => ({
  value: key,
  label: POSICION_NAMES[key]
}));

export const ESTADOS_ARBITRO = Object.keys(ESTADO_ARBITRO_NAMES).map(key => ({
  value: key,
  label: ESTADO_ARBITRO_NAMES[key]
}));