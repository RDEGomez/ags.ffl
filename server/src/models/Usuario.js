// 📁 models/Usuario.js
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
    enum: ['admin', 'jugador'],
    default: 'jugador'
  },
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

module.exports = mongoose.model('Usuario', UsuarioSchema);
