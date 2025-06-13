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
  // Agregar otros posibles valores que uses
  'mixta': '🏈 Mixta',
  'femenil': '👩 Femenil',
  'varonil': '👨 Varonil',
  'libre': '🆓 Libre'
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
  // Colores para categorías adicionales
  'mixta': '#2196F3',
  'femenil': '#E91E63',
  'varonil': '#4CAF50',
  'libre': '#9E9E9E'
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
  // Iconos para categorías adicionales
  'mixta': '🏈',
  'femenil': '👩',
  'varonil': '👨',
  'libre': '🆓'
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
      { codigo: 'tocho7v7', nombre: CATEGORY_NAMES.tocho7v7 },
      { codigo: 'libre', nombre: CATEGORY_NAMES.libre }
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