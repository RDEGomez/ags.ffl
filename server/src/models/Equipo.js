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
      'varmast', 'femmast',
      'tocho7v7', 'u8',
      'u10', 'u12fem', 'u12var',
      'u14fem', 'u14var',
      'u16fem', 'u16var',
      'u18fem', 'u18var'
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
