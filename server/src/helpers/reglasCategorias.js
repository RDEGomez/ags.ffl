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
    sexoPermitido: ['M'],
    edadMin: 35,
    edadMax: 99,
    tipoBase: 'var'
  },
  femmast: {
    sexoPermitido: ['F'],
    edadMin: 30,
    edadMax: 99,
    tipoBase: 'fem'
  }
};

module.exports = reglasCategorias;