// reglasCategorias.js

const reglasCategorias = {
  mixgold: {
    sexoPermitido: ['M', 'F'],  // mixto
    edadMin: 0,
    edadMax: 99,
  },
  mixsilv: {
    sexoPermitido: ['M', 'F'],  // mixto
    edadMin: 0,
    edadMax: 99,
  },
  femsilv: {
    sexoPermitido: ['F'],
    edadMin: 0,
    edadMax: 99,
  },
  varsilv: {
    sexoPermitido: ['M'],
    edadMin: 0,
    edadMax: 99,
  },
  femgold: {
    sexoPermitido: ['F'],
    edadMin: 0,
    edadMax: 99,
  },
  vargold: {
    sexoPermitido: ['M'],
    edadMin: 0,
    edadMax: 99,
  },
  varmast: {
    sexoPermitido: ['M'],
    edadMin: 35,
    edadMax: 99,
  },
  femmast: {
    sexoPermitido: ['F'],
    edadMin: 30,
    edadMax: 99,
  }
};

module.exports = reglasCategorias;
