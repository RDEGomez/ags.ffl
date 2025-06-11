// 📁 models/Arbitro.js
const mongoose = require('mongoose');

const ArbitroSchema = new mongoose.Schema({
  // 🔗 Relación con el usuario que representa este árbitro
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
    unique: true // Un usuario solo puede ser un árbitro
  },
  
  // 📋 Información profesional
  nivel: {
    type: String,
    enum: ['Local', 'Regional', 'Nacional', 'Internacional'],
    default: 'Local'
  },
  
  experiencia: {
    type: Number,
    min: 0,
    default: 0,
    required: true
  },
  
  // 📞 Información de contacto específica (puede diferir del usuario base)
  telefono: {
    type: String,
    trim: true
  },
  
  ubicacion: {
    type: String,
    trim: true
  },
  
  // 🏆 Certificaciones y especialidades
  certificaciones: [{
    type: String,
    trim: true
  }],
  
  // 🏈 Posiciones que puede desempeñar en Flag Football
  posiciones: [{
    type: String,
    enum: ['principal', 'backeador', 'estadistico'],
    required: true
  }],
  
  // 📊 Estadísticas de rendimiento
  partidosDirigidos: {
    type: Number,
    min: 0,
    default: 0
  },
  
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  
  // 🎯 Estado operativo
  disponible: {
    type: Boolean,
    default: true
  },
  
  estado: {
    type: String,
    enum: ['activo', 'inactivo', 'suspendido'],
    default: 'activo'
  },
  
  // 📅 Fechas importantes
  fechaInicioActividad: {
    type: Date,
    default: Date.now
  },
  
  fechaUltimaActividad: {
    type: Date,
    default: Date.now
  },
  
  // 📝 Notas adicionales (solo visible para admin)
  notasInternas: {
    type: String,
    trim: true
  },
  
  // 🏅 Evaluaciones detalladas
  evaluaciones: [{
    categoria: {
      type: String,
      enum: ['puntualidad', 'conocimiento_reglas', 'comunicacion', 'liderazgo', 'imparcialidad']
    },
    puntuacion: {
      type: Number,
      min: 1,
      max: 5
    },
    evaluador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    comentarios: String,
    fecha: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 📅 Historial de partidos
  historialPartidos: [{
    partido: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partido' // Modelo futuro
    },
    fecha: Date,
    equipoLocal: String,
    equipoVisitante: String,
    torneo: String,
    resultado: String,
    observaciones: String
  }]
}, {
  timestamps: true
});

// 🔍 Índices para optimizar consultas
ArbitroSchema.index({ usuario: 1 });
ArbitroSchema.index({ disponible: 1, estado: 1 });
ArbitroSchema.index({ nivel: 1 });
ArbitroSchema.index({ ubicacion: 1 });

// 🛠️ Métodos del modelo
ArbitroSchema.methods.estaDisponible = function() {
  return this.disponible && this.estado === 'activo';
};

ArbitroSchema.methods.puedeAceptarPartidos = function() {
  return this.estaDisponible() && this.posiciones.length > 0;
};

ArbitroSchema.methods.puedeArbitrarEn = function(posicion) {
  return this.posiciones.includes(posicion);
};

ArbitroSchema.methods.actualizarRating = function() {
  if (this.evaluaciones.length === 0) {
    this.rating = 0;
    return;
  }
  
  const sumaTotal = this.evaluaciones.reduce((suma, eval) => suma + eval.puntuacion, 0);
  this.rating = Math.round((sumaTotal / this.evaluaciones.length) * 10) / 10; // Redondear a 1 decimal
};

ArbitroSchema.methods.incrementarPartidosDirigidos = function() {
  this.partidosDirigidos += 1;
  this.fechaUltimaActividad = new Date();
};

// 🎯 Métodos estáticos
ArbitroSchema.statics.buscarDisponibles = function(posicion = null, ubicacion = null) {
  const filtro = { 
    disponible: true, 
    estado: 'activo' 
  };
  
  if (posicion) {
    filtro.posiciones = posicion;
  }
  
  if (ubicacion) {
    filtro.ubicacion = new RegExp(ubicacion, 'i');
  }
  
  return this.find(filtro).populate('usuario', 'nombre email imagen');
};

ArbitroSchema.statics.obtenerEstadisticasGenerales = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalArbitros: { $sum: 1 },
        disponibles: { 
          $sum: { 
            $cond: [{ $and: [{ $eq: ['$disponible', true] }, { $eq: ['$estado', 'activo'] }] }, 1, 0] 
          }
        },
        promedioExperiencia: { $avg: '$experiencia' },
        promedioRating: { $avg: '$rating' },
        totalPartidosDirigidos: { $sum: '$partidosDirigidos' }
      }
    }
  ]);
};

// 🔄 Middleware pre-save
ArbitroSchema.pre('save', function(next) {
  // Actualizar rating automáticamente antes de guardar
  if (this.isModified('evaluaciones')) {
    this.actualizarRating();
  }
  next();
});

ArbitroSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'usuario',
    select: 'nombre email imagen documento rol rolSecundario'  // ✅ INCLUIR ROLES
  });
  next();
});

module.exports = mongoose.model('Arbitro', ArbitroSchema);