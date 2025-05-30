const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'https://ags-ffl-jyev.vercel.app/'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Disposition'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// DB
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/agsffl', { useNewUrlParser: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Rutas
const rutas = require('./routes');
app.use('/api', rutas);

// Start
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
