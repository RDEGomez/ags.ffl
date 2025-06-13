const mongoose = require('mongoose');

const TorneoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  fechaInicio: {
    type: Date,
    required: true
  },
  fechaFin: {
    type: Date,
    required: true
  },
  categorias: [{
    type: String,
    required: true,
    enum: [
      'mixgold', 'mixsilv',
      'vargold', 'varsilv',
      'femgold', 'femsilv',
      'varmast', 'femmast',
      'tocho7v7'
    ]
  }],
  imagen: {
    type: String 
  },
  estado: {
    type: String,
    enum: ['activo', 'inactivo'],
    default: 'activo'
  },
  equipos: [{ //! Cacho: Cambiar el tipo a objeto equipo
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipo'
  }],
  resultados: [{
    categoria: {
      type: String,
      required: true,
      enum: [
        'mixgold', 'mixsilv',
        'vargold', 'varsilv',
        'femgold', 'femsilv',
        'varmast', 'femmast',
        'tocho7v7'
      ]
    },
    campeon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipo'
    },
    subcampeon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipo'
    },
    tercerLugar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipo'
    },
    lideresEstadisticas: [{
      tipo: {
        type: String,
        enum: ['pases', 'puntos', 'tackleos', 'intercepciones', 'sacks', 'recepciones'],
      },
      jugador: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
      }
    }]
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Torneo', TorneoSchema);