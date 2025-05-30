const getApiUrl = () => {
  // En desarrollo
  if (import.meta.env.DEV) {
    return `http://localhost:3000`;
  }
  
  // En producción
  return import.meta.env.VITE_BACKEND_URL || 'https://ags-ffl.vercel.app';
};

export const API_URL = getApiUrl();