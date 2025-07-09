// 📁 models/Partido.js
const mongoose = require('mongoose');

const PartidoSchema = new mongoose.Schema({
  // 🏈 EQUIPOS PARTICIPANTES
  equipoLocal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipo',
    required: true
  },
  equipoVisitante: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipo',
    required: true
  },
  
  // 🏆 TORNEO Y CONTEXTO
  torneo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Torneo',
    required: true
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
  
  // ⚖️ ARBITRAJE
  arbitros: {
    principal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Arbitro'
    },
    backeador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Arbitro'
    },
    estadistico: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Arbitro'
    }
  },
  
  // 📅 PROGRAMACIÓN
  fechaHora: {
    type: Date,
    required: true
  },
  duracionMinutos: {
    type: Number,
    default: 50, // 2 tiempos de 25 minutos
    min: 20,
    max: 120
  },

  // 🔥 NUEVO CAMPO: JORNADA
  jornada: {
    type: String,
    trim: true,
    maxlength: 50,
    default: null, // Opcional inicialmente para compatibilidad con partidos existentes
    index: true // Índice para optimizar consultas por jornada
  },
  
  // 🎮 ESTADO DEL PARTIDO
  estado: {
    type: String,
    enum: ['programado', 'en_curso', 'medio_tiempo', 'finalizado', 'suspendido', 'cancelado'],
    default: 'programado'
  },
  
  // 🏟️ UBICACIÓN
  sede: {
    nombre: {
      type: String,
      trim: true
    },
    direccion: {
      type: String,
      trim: true
    },
    coordenadas: {
      lat: {
        type: Number,
        min: -90,
        max: 90
      },
      lng: {
        type: Number,
        min: -180,
        max: 180
      }
    }
  },
  
  // 📊 MARCADOR
  marcador: {
    local: {
      type: Number,
      default: 0,
      min: 0
    },
    visitante: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // ⏱️ CONTROL DE TIEMPO
  tiempoJuego: {
    tiempoActual: {
      type: Number,
      default: 0, // segundos transcurridos
      min: 0
    },
    periodo: {
      type: Number,
      enum: [1, 2], // primer tiempo, segundo tiempo
      default: 1
    },
    tiemposOut: {
      local: {
        type: Number,
        default: 3,
        min: 0,
        max: 3
      },
      visitante: {
        type: Number,
        default: 3,
        min: 0,
        max: 3
      }
    },
    // Para pausas y control temporal
    pausado: {
      type: Boolean,
      default: false
    },
    tiempoInicio: Date,
    tiempoFinalizacion: Date
  },
  
  // 📈 ESTADÍSTICAS BÁSICAS EMBEBIDAS (para consultas rápidas)
  estadisticas: {
    equipoLocal: {
      pases: {
        intentos: { type: Number, default: 0, min: 0 },
        completados: { type: Number, default: 0, min: 0 },
        touchdowns: { type: Number, default: 0, min: 0 },
        intercepciones: { type: Number, default: 0, min: 0 }
      },
      corridas: {
        intentos: { type: Number, default: 0, min: 0 },
        touchdowns: { type: Number, default: 0, min: 0 }
      },
      defensiva: {
        tackleos: { type: Number, default: 0, min: 0 },
        intercepciones: { type: Number, default: 0, min: 0 },
        sacks: { type: Number, default: 0, min: 0 },
        balonesSueltos: { type: Number, default: 0, min: 0 }
      },
      especiales: {
        conversiones1Pto: { type: Number, default: 0, min: 0 },
        conversiones2Pts: { type: Number, default: 0, min: 0 },
        safeties: { type: Number, default: 0, min: 0 }
      }
    },
    equipoVisitante: {
      pases: {
        intentos: { type: Number, default: 0, min: 0 },
        completados: { type: Number, default: 0, min: 0 },
        touchdowns: { type: Number, default: 0, min: 0 },
        intercepciones: { type: Number, default: 0, min: 0 }
      },
      corridas: {
        intentos: { type: Number, default: 0, min: 0 },
        touchdowns: { type: Number, default: 0, min: 0 }
      },
      defensiva: {
        tackleos: { type: Number, default: 0, min: 0 },
        intercepciones: { type: Number, default: 0, min: 0 },
        sacks: { type: Number, default: 0, min: 0 },
        balonesSueltos: { type: Number, default: 0, min: 0 }
      },
      especiales: {
        conversiones1Pto: { type: Number, default: 0, min: 0 },
        conversiones2Pts: { type: Number, default: 0, min: 0 },
        safeties: { type: Number, default: 0, min: 0 }
      }
    }
  },
  
  // 🎮 JUGADAS SIMPLIFICADAS (para registro rápido)
  jugadas: [{
    numero: {
      type: Number,
      required: true
    },
    tiempo: {
      minuto: {
        type: Number,
        required: true,
        min: 0,
        max: 50
      },
      segundo: {
        type: Number,
        required: true,
        min: 0,
        max: 59
      },
      periodo: {
        type: Number,
        required: true,
        enum: [1, 2]
      }
    },
    equipoEnPosesion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipo',
      required: true
    },
    tipoJugada: {
      type: String,
      enum: [
        'pase_completo', 
        'pase_incompleto', 
        'intercepcion', 
        'corrida', 
        'touchdown', 
        'conversion_1pt', 
        'conversion_2pt', 
        'safety', 
        'timeout', 
        'sack',
        'tackleo'
      ],
      required: true
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: 200
    },
    jugadorPrincipal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      default: null // Puede ser null para jugadas defensivas o de equipo
    },
    jugadorSecundario: { // Para pases (receptor) o intercepciones
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      default: null // Puede ser null si no aplica
    },
    jugadorTouchdown: { // Para cuando el anotador es diferente al jugador principal
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      default: null // Puede ser null si no hay touchdown o es el mismo que el principal
    },
    resultado: {
      touchdown: {
        type: Boolean,
        default: false
      },
      intercepcion: {
        type: Boolean,
        default: false
      },
      sack: {
        type: Boolean,
        default: false
      },
      puntos: {
        type: Number,
        default: 0,
        min: 0,
        max: 6 // 6 para TD, 1 o 2 para conversiones, 2 para safety
      }
    },
    // Para auditoria de jugadas
    registradoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    fechaRegistro: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 📝 INFORMACIÓN ADICIONAL
  observaciones: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  clima: {
    temperatura: {
      type: Number,
      min: -10,
      max: 50
    },
    condiciones: {
      type: String,
      enum: ['soleado', 'nublado', 'lluvia', 'viento', 'despejado'],
      trim: true
    }
  },
  
  // 📸 MULTIMEDIA
  imagenes: [{
    type: String,
    trim: true
  }],
  video: {
    type: String,
    trim: true
  },
  
  // 📋 METADATOS Y AUDITORIA
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  ultimaActualizacion: {
    fecha: {
      type: Date,
      default: Date.now
    },
    por: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    razon: {
      type: String,
      trim: true,
      maxlength: 200
    }
  },
  
  // 🏆 RESULTADO FINAL (se llena al finalizar)
  resultado: {
    ganador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipo'
    },
    empate: {
      type: Boolean,
      default: false
    },
    diferenciaPuntos: {
      type: Number,
      default: 0
    },
    tipoVictoria: {
      type: String,
      enum: ['normal', 'forfeit', 'walkover']
    }
  }
}, {
  timestamps: true
});

// 🔍 ÍNDICES PARA OPTIMIZACIÓN
PartidoSchema.index({ torneo: 1, categoria: 1 });
PartidoSchema.index({ fechaHora: 1 });
PartidoSchema.index({ estado: 1 });
PartidoSchema.index({ equipoLocal: 1, equipoVisitante: 1 });
PartidoSchema.index({ 'arbitros.principal': 1 });
PartidoSchema.index({ createdAt: -1 });

// 🔥 NUEVOS ÍNDICES para jornada
PartidoSchema.index({ jornada: 1 });
PartidoSchema.index({ torneo: 1, categoria: 1, jornada: 1 });

// Índice compuesto para consultas comunes
PartidoSchema.index({ 
  torneo: 1, 
  categoria: 1, 
  fechaHora: 1, 
  estado: 1 
});

// 🛠️ MÉTODOS DEL MODELO

// Verificar si el partido puede ser editado
PartidoSchema.methods.puedeSerEditado = function() {
  return ['programado', 'suspendido'].includes(this.estado);
};

// Verificar si el partido está en progreso
PartidoSchema.methods.enProgreso = function() {
  return ['en_curso', 'medio_tiempo'].includes(this.estado);
};

// Obtener ganador del partido
PartidoSchema.methods.obtenerGanador = function() {
  if (this.marcador.local > this.marcador.visitante) {
    return this.equipoLocal;
  } else if (this.marcador.visitante > this.marcador.local) {
    return this.equipoVisitante;
  }
  return null; // Empate
};

// Calcular duración real del partido
PartidoSchema.methods.obtenerDuracionReal = function() {
  if (this.tiempoJuego.tiempoInicio && this.tiempoJuego.tiempoFinalizacion) {
    return Math.round((this.tiempoJuego.tiempoFinalizacion - this.tiempoJuego.tiempoInicio) / (1000 * 60)); // minutos
  }
  return null;
};

// 🔥 NUEVO MÉTODO: Obtener nombre de jornada formateado
PartidoSchema.methods.obtenerJornadaFormateada = function() {
  if (!this.jornada) return 'Sin jornada';
  
  // Si ya contiene "Jornada" en el nombre, retornarlo tal como está
  if (this.jornada.toLowerCase().includes('jornada')) {
    return this.jornada;
  }
  
  // Si es solo un número, agregar "Jornada" al principio
  if (/^\d+$/.test(this.jornada)) {
    return `Jornada ${this.jornada}`;
  }
  
  // En otros casos, retornar tal como está
  return this.jornada;
};

// Actualizar estadísticas automáticamente
PartidoSchema.methods.actualizarEstadisticas = function() {
  // Reiniciar contadores
  const statsLocal = {
    pases: { intentos: 0, completados: 0, touchdowns: 0, intercepciones: 0 },
    corridas: { intentos: 0, touchdowns: 0 },
    defensiva: { tackleos: 0, intercepciones: 0, sacks: 0, balonesSueltos: 0 },
    especiales: { conversiones1Pto: 0, conversiones2Pts: 0, safeties: 0 }
  };
  
  const statsVisitante = { ...statsLocal };
  
  // Procesar jugadas
  this.jugadas.forEach(jugada => {
    const esLocal = jugada.equipoEnPosesion.toString() === this.equipoLocal.toString();
    const stats = esLocal ? statsLocal : statsVisitante;
    
    switch(jugada.tipoJugada) {
      case 'pase_completo':
        stats.pases.intentos++;
        stats.pases.completados++;
        if (jugada.resultado.touchdown) stats.pases.touchdowns++;
        break;
      case 'pase_incompleto':
        stats.pases.intentos++;
        break;
      case 'intercepcion':
        // La intercepción cuenta para el equipo DEFENSOR
        const statsDefensa = esLocal ? statsVisitante : statsLocal;
        statsDefensa.defensiva.intercepciones++;
        if (jugada.resultado.touchdown) statsDefensa.defensiva.touchdowns = (statsDefensa.defensiva.touchdowns || 0) + 1;
        break;
      case 'corrida':
        stats.corridas.intentos++;
        if (jugada.resultado.touchdown) stats.corridas.touchdowns++;
        break;
      case 'sack':
        const statsDefensaSack = esLocal ? statsVisitante : statsLocal;
        statsDefensaSack.defensiva.sacks++;
        break;
      case 'tackleo':
        const statsDefensaTackle = esLocal ? statsVisitante : statsLocal;
        statsDefensaTackle.defensiva.tackleos++;
        break;
      case 'conversion_1pt':
        stats.especiales.conversiones1Pto++;
        break;
      case 'conversion_2pt':
        stats.especiales.conversiones2Pts++;
        break;
      case 'safety':
        stats.especiales.safeties++;
        break;
    }
  });
  
  // Actualizar estadísticas del partido
  this.estadisticas.equipoLocal = statsLocal;
  this.estadisticas.equipoVisitante = statsVisitante;
};

// 🎯 MÉTODOS ESTÁTICOS

// 🔥 NUEVO MÉTODO ESTÁTICO: Obtener jornadas disponibles por torneo y categoría
PartidoSchema.statics.obtenerJornadasDisponibles = async function(torneoId, categoria = null) {
  const filtro = { torneo: torneoId };
  if (categoria) {
    filtro.categoria = categoria;
  }
  
  const jornadas = await this.distinct('jornada', filtro);
  
  // Filtrar valores null/undefined y ordenar
  return jornadas
    .filter(jornada => jornada != null)
    .sort((a, b) => {
      // Intentar ordenar numéricamente si ambos son números
      const numA = parseInt(a.replace(/\D/g, ''));
      const numB = parseInt(b.replace(/\D/g, ''));
      
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      
      // Ordenar alfabéticamente si no son números
      return a.localeCompare(b);
    });
};

// Buscar partidos por filtros comunes
PartidoSchema.statics.buscarConFiltros = function(filtros = {}) {
  const query = {};
  
  if (filtros.torneo) query.torneo = filtros.torneo;
  if (filtros.categoria) query.categoria = filtros.categoria;
  if (filtros.estado) query.estado = filtros.estado;
  if (filtros.equipo) {
    query.$or = [
      { equipoLocal: filtros.equipo },
      { equipoVisitante: filtros.equipo }
    ];
  }
  if (filtros.arbitro) {
    query.$or = [
      { 'arbitros.principal': filtros.arbitro },
      { 'arbitros.backeador': filtros.arbitro },
      { 'arbitros.estadistico': filtros.arbitro }
    ];
  }
  if (filtros.fechaDesde && filtros.fechaHasta) {
    query.fechaHora = {
      $gte: new Date(filtros.fechaDesde),
      $lte: new Date(filtros.fechaHasta)
    };
  }
  
  return this.find(query)
    .populate('equipoLocal', 'nombre imagen categoria')
    .populate('equipoVisitante', 'nombre imagen categoria')
    .populate('torneo', 'nombre')
    .populate('arbitros.principal arbitros.backeador arbitros.estadistico', 'usuario')
    .sort({ fechaHora: -1 });
};

// Obtener estadísticas de un torneo
PartidoSchema.statics.obtenerEstadisticasTorneo = function(torneoId, categoria = null) {
  const match = { torneo: mongoose.Types.ObjectId(torneoId) };
  if (categoria) match.categoria = categoria;
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalPartidos: { $sum: 1 },
        partidosFinalizados: {
          $sum: { $cond: [{ $eq: ['$estado', 'finalizado'] }, 1, 0] }
        },
        partidosProgramados: {
          $sum: { $cond: [{ $eq: ['$estado', 'programado'] }, 1, 0] }
        },
        partidosEnCurso: {
          $sum: { $cond: [{ $eq: ['$estado', 'en_curso'] }, 1, 0] }
        },
        totalGoles: {
          $sum: { $add: ['$marcador.local', '$marcador.visitante'] }
        },
        promedioGolesPorPartido: {
          $avg: { $add: ['$marcador.local', '$marcador.visitante'] }
        }
      }
    }
  ]);
};

// 🔄 MIDDLEWARE PRE-SAVE
PartidoSchema.pre('save', function(next) {
  // Validar que los equipos sean diferentes
  if (this.equipoLocal.toString() === this.equipoVisitante.toString()) {
    return next(new Error('Un equipo no puede jugar contra sí mismo'));
  }
  
  // Actualizar estadísticas automáticamente
  if (this.isModified('jugadas')) {
    this.actualizarEstadisticas();
  }
  
 // 🔥 REEMPLAZAR EN EL MIDDLEWARE PRE-SAVE
  if (this.isModified('jugadas')) {
    let puntosLocal = 0;
    let puntosVisitante = 0;
    
    this.jugadas.forEach(jugada => {
      if (jugada.resultado.puntos > 0) {
        const equipoEnPosesionStr = jugada.equipoEnPosesion._id?.toString() || jugada.equipoEnPosesion.toString();
        const equipoLocalStr = this.equipoLocal._id?.toString() || this.equipoLocal.toString();
        
        const esLocal = equipoEnPosesionStr === equipoLocalStr;
        
        // 🔥 LÓGICA SIMPLIFICADA - Puntos van al equipo seleccionado
        if (esLocal) {
          puntosLocal += jugada.resultado.puntos;
        } else {
          puntosVisitante += jugada.resultado.puntos;
        }
      }
    });
    
    this.marcador.local = puntosLocal;
    this.marcador.visitante = puntosVisitante;
  }
  
  // Actualizar resultado final si el partido está finalizado
  if (this.estado === 'finalizado' && this.isModified('estado')) {
    const ganador = this.obtenerGanador();
    this.resultado.ganador = ganador;
    this.resultado.empate = !ganador;
    this.resultado.diferenciaPuntos = Math.abs(this.marcador.local - this.marcador.visitante);
    this.resultado.tipoVictoria = this.resultado.tipoVictoria || 'normal';
  }
  
  // Actualizar timestamp de última modificación
  this.ultimaActualizacion.fecha = new Date();
  
  next();
});

// 🔄 MIDDLEWARE POST-SAVE
PartidoSchema.post('save', async function(doc, next) {
  // Actualizar estadísticas del torneo (si es necesario)
  if (doc.estado === 'finalizado') {
    // Aquí podríamos actualizar estadísticas del torneo
    // await Torneo.actualizarEstadisticas(doc.torneo);
  }
  next();
});

module.exports = mongoose.model('Partido', PartidoSchema);