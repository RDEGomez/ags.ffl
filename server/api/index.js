const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const serverless = require('serverless-http');
require('dotenv').config();

const app = express();

// --- Mongoose (solo conecta si aún no hay conexión)
if (mongoose.connection.readyState === 0) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agsffl', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ MongoDB error:', err));
}

// --- CORS
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

// --- Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// --- Logging (puedes conservarlo igual)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// --- Rutas
const rutas = require('../src/routes');
app.use('/api', rutas);

// --- Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: '🚀 API en Vercel funcionando correctamente' });
});

// --- Exportar como serverless function
module.exports = app;
module.exports.handler = serverless(app);
