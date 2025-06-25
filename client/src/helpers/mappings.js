
export const CATEGORY_NAMES = {
  mixsilv: "Mixto Silver",
  mixgold: "Mixto Golden",
  varsilv: "Varonil Silver",
  vargold: "Varonil Golden",
  femsilv: "Femenil Silver",
  femgold: "Femenil Golden",
  varmast: "Varonil Master",
  femmast: "Femenil Master",
  tocho7v7: "Tocho 7v7",
  u8: "U-8",
  u10: "U-10",
  u12: "U-12",
  u14: "U-14",
  u16: "U-16",
  u18: "U-18"
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