// 📁 models/Usuario.js - VERSIÓN ACTUALIZADA
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UsuarioSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  nombre: {
    type: String,
    trim: true
  },
  documento: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  imagen: {
    type: String // Ruta de imagen
  },
  rol: {
    type: String,
    enum: ['admin', 'jugador', 'capitan', 'arbitro'],
    default: 'jugador'
  },
  rolSecundario: {
    type: String,
    enum: ['arbitro', 'admin'],
  },
  
  // 🔥 NUEVOS CAMPOS PARA VERIFICACIÓN EMAIL
  emailVerificado: {
    type: Boolean,
    default: false
  },
  tokenVerificacion: {
    type: String,
    select: false // No incluir en consultas por defecto
  },
  tokenVerificacionExpira: {
    type: Date,
    select: false
  },
  
  // 🔥 NUEVOS CAMPOS PARA RECUPERACIÓN DE CONTRASEÑA
  tokenRecuperacion: {
    type: String,
    select: false
  },
  tokenRecuperacionExpira: {
    type: Date,
    select: false
  },
  
  // 🔥 CAMPOS DE SEGUIMIENTO
  fechaUltimaVerificacion: {
    type: Date
  },
  intentosVerificacion: {
    type: Number,
    default: 0
  },
  
  // Este campo solo aplica para usuarios con rol 'jugador' o 'capitan'
  equipos: [
    {
      equipo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Equipo'
      },
      numero: {
        type: Number
      }
    }
  ]
}, {
  timestamps: true
});

// Encriptar password antes de guardar
UsuarioSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// 🔥 MÉTODOS PARA VERIFICACIÓN
UsuarioSchema.methods.crearTokenVerificacion = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.tokenVerificacion = crypto.createHash('sha256').update(token).digest('hex');
  this.tokenVerificacionExpira = Date.now() + 24 * 60 * 60 * 1000; // 24 horas
  
  return token; // Retornamos el token sin encriptar para enviar por email
};

// 🔥 MÉTODOS PARA RECUPERACIÓN
UsuarioSchema.methods.crearTokenRecuperacion = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.tokenRecuperacion = crypto.createHash('sha256').update(token).digest('hex');
  this.tokenRecuperacionExpira = Date.now() + 10 * 60 * 1000; // 10 minutos
  
  return token;
};

// 🔥 MÉTODO PARA VERIFICAR SI PUEDE HACER LOGIN
UsuarioSchema.methods.puedeHacerLogin = function() {
  return this.emailVerificado;
};

UsuarioSchema.methods.puedeArbitrar = function() {
  return this.rol === 'arbitro' || this.rolSecundario === 'arbitro';
};

UsuarioSchema.methods.puedeEstarEnEquipos = function() {
  return ['jugador', 'capitan'].includes(this.rol);
};

module.exports = mongoose.model('Usuario', UsuarioSchema);