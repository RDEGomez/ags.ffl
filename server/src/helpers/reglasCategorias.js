// reglasCategorias.js

const reglasCategorias = {
  mixgold: {
    sexoPermitido: ['M', 'F'],  // mixto
    edadMin: 0,
    edadMax: 99,
    tipoBase: 'mix'
  },
  mixsilv: {
    sexoPermitido: ['M', 'F'],  // mixto
    edadMin: 0,
    edadMax: 99,
    tipoBase: 'mix'
  },
  femsilv: {
    sexoPermitido: ['F'],
    edadMin: 0,
    edadMax: 99,
    tipoBase: 'fem'
  },
  varsilv: {
    sexoPermitido: ['M'],
    edadMin: 0,
    edadMax: 99,
    tipoBase: 'var'
  },
  femgold: {
    sexoPermitido: ['F'],
    edadMin: 0,
    edadMax: 99,
    tipoBase: 'fem'
  },
  vargold: {
    sexoPermitido: ['M'],
    edadMin: 0,
    edadMax: 99,
    tipoBase: 'var'
  },
  varmast: {
    sexoPermitido: ['M', 'F'],
    edadMin: 33,
    edadMax: 99,
    tipoBase: 'varmas'
  },
  femmast: {
    sexoPermitido: ['F'],
    edadMin: 30,
    edadMax: 99,
    tipoBase: 'femmas'
  },
  tocho7v7: {
    sexoPermitido: ['M', 'F'],  // mixto
    edadMin: 0,
    edadMax: 99,
    tipoBase: 'tocho7v7'
  },
  'U-8': {
    sexoPermitido: ['M', 'F'],  // mixto
    edadMin: 0,
    edadMax: 8,
    tipoBase: 'u8'
  },
  'U-10': {
    sexoPermitido: ['M', 'F'],  // mixto
    edadMin: 0,
    edadMax: 10,
    tipoBase: 'u10'
  },
  'U-12': {
    sexoPermitido: ['M', 'F'],  // mixto
    edadMin: 0,
    edadMax: 12,
    tipoBase: 'u12'
  },
  'U-14': {
    sexoPermitido: ['M', 'F'],  // mixto
    edadMin: 0,
    edadMax: 14,
    tipoBase: 'u14'
  },
  'U-16': {
    sexoPermitido: ['M', 'F'],  // mixto
    edadMin: 0,
    edadMax: 16,
    tipoBase: 'u16'
  },
  'U-18': {
    sexoPermitido: ['M', 'F'],  // mixto
    edadMin: 0,
    edadMax: 18,
    tipoBase: 'u18'
  }
};

module.exports = reglasCategorias;