
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
  u12fem: "U-12 Femenil",
  u12var: "U-12 Varonil",
  u14fem: "U-14 Femenil",
  u14var: "U-14 Varonil",
  u16fem: "U-16 Femenil",
  u16var: "U-16 Varonil",
  u18fem: "U-18 Femenil",
  u18var: "U-18 Varonil"
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