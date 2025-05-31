const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

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
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'https://ags-ffl-jyev.vercel.app',
    'agsffl-production.up.railway.app',
  ],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Disposition'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// Start
app.listen(PORT, () => {
  console.log(`🌟 Servidor corriendo en el puerto ${PORT}`);
  console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
});