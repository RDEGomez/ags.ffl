const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

console.log('\n🔧 DEBUGGING UPLOAD:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  USE_CLOUDINARY:', process.env.USE_CLOUDINARY);
console.log('  CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'NOT SET');

console.log('\n🔍 Intentando cargar uploadConfig...');
try {
  const uploadConfig = require('./helpers/uploadConfig');
  console.log('✅ uploadConfig cargado exitosamente');
} catch (error) {
  console.error('❌ ERROR cargando uploadConfig:', error.message);
  console.error('📋 Stack:', error.stack);
}

// Middlewares
const allowedOrigins = [
  'http://localhost:5173', 
  'https://ags-ffl-jyev.vercel.app',
  'https://agsffl-production.up.railway.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'], 
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Disposition'],
  credentials: true,
  maxAge: 86400 // ✅ NUEVO: Cache preflight 24h
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.ip || req.connection.remoteAddress;
  
  // Log de requests importantes
  if (method === 'POST' || url.includes('/api/')) {
    console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);
  }
  
  // Log de uploads específicamente
  if (url.includes('/importacion/')) {
    console.log(`[${timestamp}] 📁 UPLOAD REQUEST - Usuario: ${req.headers.authorization ? 'Autenticado' : 'No auth'}`);
  }
  
  next();
});

// 📝 Log de errores
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ❌ ERROR: ${err.message}`);
  console.error(`[${timestamp}] 📍 URL: ${req.method} ${req.url}`);
  console.error(`[${timestamp}] 🔍 Stack: ${err.stack}`);
  next(err);
});

// DB - Usar variable de entorno
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agsffl', { 
  useNewUrlParser: true,
  useUnifiedTopology: true 
})
  .then(() => console.log('✅ MongoDB connected to:', process.env.NODE_ENV === 'production' ? 'Atlas' : 'Local'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Rutas
const rutas = require('./routes');
app.use('/api', rutas);

// Endpoint de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 API funcionando correctamente',
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const recommendedEnvVars = ['FRONTEND_URL', 'MAX_FILE_SIZE', 'RATE_LIMIT_MAX_REQUESTS'];

// Validar variables recomendadas
const missingRecommended = recommendedEnvVars.filter(envVar => !process.env[envVar]);
if (missingRecommended.length > 0) {
  console.warn('⚠️ Variables recomendadas faltantes (usando valores por defecto):', missingRecommended.join(', '));
}

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Variables de entorno faltantes:', missingEnvVars.join(', '));
  process.exit(1);
}

// 📊 Log de configuración al inicio
console.log('🔧 CONFIGURACIÓN DEL SERVIDOR:');
console.log(`  📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
console.log(`  🌐 Puerto: ${PORT}`);
console.log(`  🗄️ MongoDB: ${process.env.NODE_ENV === 'production' ? 'Atlas' : 'Local'}`);
console.log(`  🔒 CORS habilitado para:`, allowedOrigins);
console.log(`  📁 Límite de archivo: ${Math.round((parseInt(process.env.MAX_FILE_SIZE) || 5242880) / 1024 / 1024)}MB`);
console.log(`  ⏱️ Rate limit: ${parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10} uploads/${Math.round((parseInt(process.env.RATE_LIMIT_WINDOW) || 3600000) / 60000)}min`);

// Start
app.listen(PORT, () => {
  console.log(`🌟 Servidor corriendo en el puerto ${PORT}`);
  console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
});