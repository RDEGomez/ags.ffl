
export const CATEGORY_NAMES = {
  mixsilv: "Mixto Silver",
  mixgold: "Mixto Golden",
  varsilv: "Varonil Silver",
  vargold: "Varonil Golden",
  femsilv: "Femenil Silver",
  femgold: "Femenil Golden",
  varmast: "Varonil Master",
  femmast: "Femenil Master",
  tocho7v7: "Tocho 7v7"
};

// Si necesitas la operación inversa:
export const CATEGORY_CODES = Object.entries(CATEGORY_NAMES).reduce(
  (acc, [code, name]) => {
    acc[name] = code;
    return acc;
  }, 
  {}
);

// También puedes agregar funciones de utilidad
export const getCategoryName = (code) => CATEGORY_NAMES[code] || code;
export const getCategoryCode = (name) => CATEGORY_CODES[name] || name;