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
  u8: {
    sexoPermitido: ['M', 'F'],  // mixto
    edadMin: 0,
    edadMax: 8,
    tipoBase: 'u8'
  },
  u10: {
    sexoPermitido: ['M', 'F'],  // mixto
    edadMin: 0,
    edadMax: 10,
    tipoBase: 'u10'
  },
  u12fem: {
    sexoPermitido: ['F'],
    edadMin: 0,
    edadMax: 12,
    tipoBase: 'u12fem'
  },
  u12var: {
    sexoPermitido: ['M'],
    edadMin: 0,
    edadMax: 12,
    tipoBase: 'u12var'
  },
  u14fem: {
    sexoPermitido: ['F'],
    edadMin: 0,
    edadMax: 14,
    tipoBase: 'u14fem'
  },
  u14var: {
    sexoPermitido: ['M'],
    edadMin: 0,
    edadMax: 14,
    tipoBase: 'u14var'
  },
  u16fem: {
    sexoPermitido: ['F'],
    edadMin: 0,
    edadMax: 16,
    tipoBase: 'u16fem'
  },
  u16var: {
    sexoPermitido: ['M'],
    edadMin: 0,
    edadMax: 16,
    tipoBase: 'u16var'
  },
  u18fem: {
    sexoPermitido: ['F'],
    edadMin: 0,
    edadMax: 18,
    tipoBase: 'u18fem'
  },
  u18var: {
    sexoPermitido: ['M'],
    edadMin: 0,
    edadMax: 18,
    tipoBase: 'u18var'
  }
};

module.exports = reglasCategorias;