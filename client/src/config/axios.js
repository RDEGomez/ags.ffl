// 📁 src/config/axios.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api` || 'http://localhost:3000/api',
});

// Interceptor para agregar token
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log('[Auth Token]', token); // 👀 Verifica si se está obteniendo
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
