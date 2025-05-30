// 📁 src/config/axios.js
import axios from 'axios';
import { API_URL } from './api';

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

export default axiosInstance;
