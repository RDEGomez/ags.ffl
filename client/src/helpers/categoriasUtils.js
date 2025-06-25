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
  'u12fem': '👧 U-12 Femenil',
  'u12var': '👦 U-12 Varonil',
  'u14fem': '👧 U-14 Femenil',
  'u14var': '👦 U-14 Varonil',
  'u16fem': '👧 U-16 Femenil',
  'u16var': '👦 U-16 Varonil',
  'u18fem': '👧 U-18 Femenil',
  'u18var': '👦 U-18 Varonil'
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
  'u8': '#64B5F6',
  'u10': '#42A5F5',
  'u12fem': '#AB47BC',
  'u12var': '#7E57C2',
  'u14fem': '#5C6BC0',
  'u14var': '#42A5F5',
  'u16fem': '#29B6F6',
  'u16var': '#26C6DA',
  'u18fem': '#26A69A',
  'u18var': '#66BB6A'
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
  'u12fem': '👧',
  'u12var': '👦',
  'u14fem': '👧',
  'u14var': '👦',
  'u16fem': '👧',
  'u16var': '👦',
  'u18fem': '👧',
  'u18var': '👦'
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
      { codigo: 'u12fem', nombre: CATEGORY_NAMES.u12fem },
      { codigo: 'u12var', nombre: CATEGORY_NAMES.u12var },
      { codigo: 'u14fem', nombre: CATEGORY_NAMES.u14fem },
      { codigo: 'u14var', nombre: CATEGORY_NAMES.u14var },
      { codigo: 'u16fem', nombre: CATEGORY_NAMES.u16fem },
      { codigo: 'u16var', nombre: CATEGORY_NAMES.u16var },
      { codigo: 'u18fem', nombre: CATEGORY_NAMES.u18fem },
      { codigo: 'u18var', nombre: CATEGORY_NAMES.u18var }
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