let logoutFn = null;

export const setLogoutFunction = (fn) => {
  logoutFn = fn;
};

export const logoutUsuarioInvalido = () => {
  if (logoutFn) {
    logoutFn();
  } else {
    console.warn('❌ No se pudo ejecutar logout: función no registrada');
  }
};
