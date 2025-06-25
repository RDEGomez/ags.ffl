// 📁 utils/categoriasUtils.js - Utilidades para manejo de categorías

// 🔥 MAPEO REAL DE CATEGORÍAS (basado en tu sistema)
export const CATEGORY_NAMES = {
  'mixgold': '🥇 Mixto Gold',
  'mixsilv': '🥈 Mixto Silver', 
  'vargold': '🥇 Varonil Gold',
  'varsilv': '🥈 Varonil Silver',
  'femgold': '🥇 Femenil Gold',
  'femsilv': '🥈 Femenil Silver',
  'varmast': '👑 Varonil Master',
  'femmast': '👑 Femenil Master',
  'tocho7v7': '⚡ Tocho 7v7',
  'u8': '👶 U-8',
  'u10': '👦 U-10',
  'u12': '👧 U-12',
  'u14': '👦 U-14',
  'u16': '👧 U-16',
  'u18': '👦 U-18',
};

// 🔥 COLORES POR CATEGORÍA
export const CATEGORY_COLORS = {
  'mixgold': '#ffd700',
  'mixsilv': '#c0c0c0',
  'vargold': '#4CAF50',
  'varsilv': '#81C784',
  'femgold': '#E91E63',
  'femsilv': '#F06292',
  'varmast': '#FF9800',
  'femmast': '#FF7043',
  'tocho7v7': '#9C27B0',
  'u8': '#64b5f6',
  'u10': '#42a5f5',
  'u12': '#2196F3',
  'u14': '#1E88E5',
  'u16': '#1976D2',
  'u18': '#1565C0'
};

// 🔥 ICONOS POR CATEGORÍA
export const CATEGORY_ICONS = {
  'mixgold': '👑',
  'mixsilv': '⭐',
  'vargold': '🏆',
  'varsilv': '🥈',
  'femgold': '💎',
  'femsilv': '✨',
  'varmast': '🔥',
  'femmast': '💫',
  'tocho7v7': '⚡',
  'u8': '👶',
  'u10': '👦',
  'u12': '👧',
  'u14': '👦',
  'u16': '👧',
  'u18': '👦'
};

// 🔥 FUNCIÓN: Obtener nombre formateado de categoría
export const obtenerNombreCategoria = (codigo) => {
  if (!codigo) return 'Sin categoría';
  return CATEGORY_NAMES[codigo] || codigo.toUpperCase();
};

// 🔥 FUNCIÓN: Obtener color de categoría
export const obtenerColorCategoria = (codigo) => {
  if (!codigo) return '#64b5f6';
  return CATEGORY_COLORS[codigo] || '#64b5f6';
};

// 🔥 FUNCIÓN: Obtener icono de categoría
export const obtenerIconoCategoria = (codigo) => {
  if (!codigo) return '🏈';
  return CATEGORY_ICONS[codigo] || '🏈';
};

// 🔥 FUNCIÓN: Validar si una categoría es válida
export const esCategoriaValida = (codigo) => {
  return Object.keys(CATEGORY_NAMES).includes(codigo);
};

// 🔥 FUNCIÓN: Obtener todas las categorías como array
export const obtenerTodasCategorias = () => {
  return Object.entries(CATEGORY_NAMES).map(([codigo, nombre]) => ({
    codigo,
    nombre,
    color: CATEGORY_COLORS[codigo],
    icono: CATEGORY_ICONS[codigo]
  }));
};

// 🔥 FUNCIÓN: Agrupar categorías por tipo
export const agruparCategoriasPorTipo = () => {
  return {
    mixto: [
      { codigo: 'mixgold', nombre: CATEGORY_NAMES.mixgold },
      { codigo: 'mixsilv', nombre: CATEGORY_NAMES.mixsilv },
      { codigo: 'mixta', nombre: CATEGORY_NAMES.mixta }
    ],
    varonil: [
      { codigo: 'vargold', nombre: CATEGORY_NAMES.vargold },
      { codigo: 'varsilv', nombre: CATEGORY_NAMES.varsilv },
      { codigo: 'varmast', nombre: CATEGORY_NAMES.varmast },
      { codigo: 'varonil', nombre: CATEGORY_NAMES.varonil }
    ],
    femenil: [
      { codigo: 'femgold', nombre: CATEGORY_NAMES.femgold },
      { codigo: 'femsilv', nombre: CATEGORY_NAMES.femsilv },
      { codigo: 'femmast', nombre: CATEGORY_NAMES.femmast },
      { codigo: 'femenil', nombre: CATEGORY_NAMES.femenil }
    ],
    especial: [
      { codigo: 'tocho7v7', nombre: CATEGORY_NAMES.tocho7v7 }
    ],
    infantil: [
      { codigo: 'u8', nombre: CATEGORY_NAMES.u8 },
      { codigo: 'u10', nombre: CATEGORY_NAMES.u10 },
      { codigo: 'u12', nombre: CATEGORY_NAMES.u12 },
      { codigo: 'u14', nombre: CATEGORY_NAMES.u14 },
      { codigo: 'u16', nombre: CATEGORY_NAMES.u16 },
      { codigo: 'u18', nombre: CATEGORY_NAMES.u18 }
    ]
  };
};

// 🔥 FUNCIÓN: Obtener categorías disponibles basado en un torneo
export const obtenerCategoriasDisponibles = (torneo) => {
  if (!torneo?.categorias) return [];
  
  return torneo.categorias
    .filter(cat => esCategoriaValida(cat))
    .map(codigo => ({
      codigo,
      nombre: obtenerNombreCategoria(codigo),
      color: obtenerColorCategoria(codigo),
      icono: obtenerIconoCategoria(codigo)
    }));
};

// 🔥 FUNCIÓN: Debug - Mostrar categorías no reconocidas
export const debugCategoriaNoReconocida = (codigo) => {
  if (!esCategoriaValida(codigo)) {
    console.warn(`⚠️ Categoría no reconocida: "${codigo}". Agregar a CATEGORY_NAMES si es válida.`);
  }
};