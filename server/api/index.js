// 📁 api/index.js - Punto de entrada para Vercel
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// 🔥 CONFIGURACIÓN DE CONEXIÓN DB PARA SERVERLESS
let cachedConnection = null;

const connectDB = async () => {
  if (cachedConnection) {
    console.log('✅ Usando conexión existente de MongoDB');
    return cachedConnection;
  }

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI no está definida en las variables de entorno');
    }

    console.log('🔄 Conectando a MongoDB...');
    
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      bufferCommands: false,
      bufferMaxEntries: 0,
      useFindAndModify: false,
      useCreateIndex: true,
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    cachedConnection = connection;
    console.log('✅ MongoDB conectado exitosamente');
    return connection;
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    throw error;
  }
};

// 🔥 CONFIGURACIÓN DE CORS
const allowedOrigins = [
  'http://localhost:5173',
  'https://ags-ffl-jyev.vercel.app', 
  'https://fl-jyev.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Disposition'],
  credentials: true,
  maxAge: 86400
}));

// 🔥 MIDDLEWARES BÁSICOS
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🔥 MIDDLEWARE DE LOGGING
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// 🔥 MIDDLEWARE DE CONEXIÓN DB
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('❌ Error de conexión DB en middleware:', error);
    return res.status(500).json({
      error: 'Error de conexión a base de datos',
      message: error.message
    });
  }
});

// 🔥 CARGAR RUTAS DINÁMICAMENTE
let routes;
try {
  routes = require('../src/routes/index.js');
  console.log('✅ Rutas cargadas exitosamente');
} catch (error) {
  console.error('❌ Error cargando rutas:', error);
  routes = null;
}

// 🔥 APLICAR RUTAS
if (routes) {
  app.use('/api', routes);
} else {
  app.use('/api', (req, res) => {
    res.status(500).json({
      error: 'Rutas no disponibles',
      message: 'Error interno al cargar las rutas del servidor'
    });
  });
}

// 🔥 RUTAS BÁSICAS
app.get('/', (req, res) => {
  res.json({
    message: '🚀 AGS Flag Football API - Funcionando en Vercel',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'production',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    env: process.env.NODE_ENV,
    vercel: true
  });
});

// 🔥 ENDPOINT DE STATUS DETALLADO
app.get('/status', (req, res) => {
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.json({
    api: 'AGS Flag Football API',
    status: 'operational',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    database: {
      status: dbStates[mongoose.connection.readyState] || 'unknown',
      readyState: mongoose.connection.readyState
    },
    version: '2.0.0',
    platform: 'Vercel Serverless',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    routes: routes ? 'loaded' : 'error'
  });
});

// 🔥 MANEJO DE ERRORES GLOBAL
app.use((err, req, res, next) => {
  console.error('❌ Error global capturado:', err);
  
  // No enviar stack trace en producción
  const errorResponse = {
    error: 'Error interno del servidor',
    timestamp: new Date().toISOString()
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.message = err.message;
    errorResponse.stack = err.stack;
  }

  res.status(500).json(errorResponse);
});

// 🔥 MANEJO DE RUTAS NO ENCONTRADAS
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    message: `La ruta ${req.method} ${req.originalUrl} no existe`,
    timestamp: new Date().toISOString(),
    availableRoutes: {
      base: '/',
      health: '/health', 
      status: '/status',
      api: '/api/*'
    }
  });
});

// 🔥 VALIDAR VARIABLES DE ENTORNO CRÍTICAS
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingVars.length > 0) {
  console.error('❌ Variables de entorno faltantes:', missingVars);
  
  // Middleware para responder con error de configuración
  app.use((req, res) => {
    res.status(500).json({
      error: 'Configuración incompleta del servidor',
      missingVariables: missingVars,
      message: 'Contacte al administrador del sistema'
    });
  });
}

// 🔥 LOG DE CONFIGURACIÓN
console.log('🔧 CONFIGURACIÓN CARGADA:');
console.log(`  📊 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`  🗄️ MongoDB: ${process.env.MONGODB_URI ? 'Configurado' : '❌ NO CONFIGURADO'}`);
console.log(`  🔑 JWT: ${process.env.JWT_SECRET ? 'Configurado' : '❌ NO CONFIGURADO'}`);
console.log(`  ☁️ Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? 'Configurado' : 'No configurado'}`);
console.log(`  🌐 CORS Origins: ${allowedOrigins.join(', ')}`);

// 🔥 EXPORTAR PARA VERCEL
module.exports = app;