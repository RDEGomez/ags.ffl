// 📁 src/config/axios.js
import axios from 'axios';
import { API_URL } from './api';
import { logoutUsuarioInvalido } from '../helpers/logoutHelper';

const axiosInstance = axios.create({
  baseURL: `${API_URL}/api`
});

// Interceptor para agregar token
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      console.warn('⚠️ Token expirado o inválido, ejecutando logout...');
      logoutUsuarioInvalido(); 
    }

    return Promise.reject(error);
  }
);


export default axiosInstance;
