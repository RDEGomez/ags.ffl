// 📁 api/index.js - Punto de entrada principal para Vercel
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// 🔥 MANEJO DE CONEXIÓN DB PARA SERVERLESS
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('✅ MongoDB ya conectado');
    return;
  }

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI no definida');
    }

    await mongoose.connect(process.env.MONGODB_URI, { 
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 1, // Importante para serverless
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    isConnected = true;
    console.log('✅ MongoDB conectado');
  } catch (err) {
    console.error('❌ Error MongoDB:', err);
    throw err;
  }
};

// Middlewares
const allowedOrigins = [
  'http://localhost:5173', 
  'https://ags-ffl-jyev.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'], 
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Disposition'],
  credentials: true,
  maxAge: 86400
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 MIDDLEWARE: Conectar DB en cada request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('❌ Error conectando DB:', error);
    res.status(500).json({ 
      error: 'Error de conexión a base de datos',
      message: error.message 
    });
  }
});

// 🔥 IMPORTAR RUTAS DESDE SRC
try {
  const rutas = require('../src/routes');
  app.use('/api', rutas); // Todas las rutas van bajo /api
} catch (error) {
  console.error('❌ Error cargando rutas:', error);
  app.use('/api', (req, res) => {
    res.status(500).json({ 
      error: 'Error cargando rutas',
      message: error.message 
    });
  });
}

// 🔥 RUTA RAÍZ
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 AGS Flag Football API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// 🔥 HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    mongodb: isConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// 🔥 MANEJO DE ERRORES GLOBAL
app.use((err, req, res, next) => {
  console.error('❌ Error global:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
  });
});

// 🔥 RUTA 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method
  });
});

// 🔥 EXPORTAR PARA VERCEL
module.exports = app;