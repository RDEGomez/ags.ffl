// 📁 models/Equipo.js
const mongoose = require('mongoose');

const EquipoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  categoria: {
    type: String,
    required: true,
    enum: [
      'mixgold', 'mixsilv',
      'vargold', 'varsilv',
      'femgold', 'femsilv',
      'varmast', 'femmast'
    ]
  },
  imagen: {
    type: String // Ruta a la imagen/logo del equipo
  },
  estado: {
    type: String,
    enum: ['activo', 'inactivo'],
    default: 'activo'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Equipo', EquipoSchema);
