// 🏈 Script para simular partidos finalizados con jugadas realistas
// Ejecutar desde la raíz del proyecto: node scripts/simular_partidos_finalizados.js

const mongoose = require('mongoose');
require('dotenv').config();

// Importar modelos
const Partido = require('../src/models/Partido');
const Usuario = require('../src/models/Usuario');
const Equipo = require('../src/models/Equipo');
const Torneo = require('../src/models/Torneo'); // 🔥 AGREGAR ESTA LÍNEA

// 🔧 CONFIGURACIÓN
const CONFIG = {
  // Filtros para seleccionar partidos
  TORNEO_NOMBRE: 'Torneo Apertura 2025',
  ESTADOS_PROCESAR: ['programado'], // Solo procesar partidos programados
  
  // Configuración de jugadas
  JUGADAS_POR_PARTIDO: {
    min: 15,    // Mínimo 15 jugadas por partido
    max: 25     // Máximo 25 jugadas por partido
  },
  
  // Configuración de marcadores (para que ronden los 20 puntos)
  PUNTOS_OBJETIVO: {
    min: 12,    // Mínimo 12 puntos por equipo
    max: 28     // Máximo 28 puntos por equipo
  },
  
  // Tipos de jugadas con sus probabilidades y características
  TIPOS_JUGADAS: {
    // Jugadas ofensivas
    'pase_completo': { 
      prob: 35, 
      puntos: 0, 
      touchdown_prob: 15,  // 15% probabilidad de TD
      esOfensiva: true
    },
    'pase_incompleto': { 
      prob: 20, 
      puntos: 0, 
      esOfensiva: true
    },
    'corrida': { 
      prob: 25, 
      puntos: 0, 
      touchdown_prob: 10,  // 10% probabilidad de TD
      esOfensiva: true
    },
    
    // Jugadas defensivas
    'intercepcion': { 
      prob: 8, 
      puntos: 0, 
      touchdown_prob: 20,  // 20% probabilidad de pick-six
      esOfensiva: false    // La ejecuta el equipo DEFENSOR
    },
    'sack': { 
      prob: 7, 
      puntos: 0, 
      esOfensiva: false    // La ejecuta el equipo DEFENSOR
    },
    'tackleo': { 
      prob: 5, 
      puntos: 0, 
      esOfensiva: false    // La ejecuta el equipo DEFENSOR
    }
  },
  
  // Conversiones después de TD
  CONVERSIONES: {
    '1pt': { prob: 70 },   // 70% intentan 1 punto
    '2pt': { prob: 30 }    // 30% intentan 2 puntos
  },
  
  // Configuración de tiempo
  DURACION_PARTIDO: 50,   // 50 minutos
  PERIODOS: 2             // 2 tiempos
};

// 🎯 FUNCIÓN PRINCIPAL
async function simularPartidosFinalizados() {
  try {
    console.log('🏈 INICIO - Simulador de Partidos Finalizados');
    console.log('================================================');
    
    // 1. Conectar a la base de datos
    await conectarDB();
    
    // 2. Obtener partidos programados
    const partidos = await obtenerPartidosProgramados();
    
    if (partidos.length === 0) {
      console.log('⚠️ No hay partidos programados para simular');
      return;
    }
    
    console.log(`🎯 Procesando ${partidos.length} partidos programados...\n`);
    
    let partidosSimulados = 0;
    let totalJugadas = 0;
    
    // 3. Simular cada partido
    for (const partido of partidos) {
      console.log(`⚽ Simulando: ${partido.equipoLocal.nombre} vs ${partido.equipoVisitante.nombre}`);
      
      try {
        const jugadasCreadas = await simularPartido(partido);
        partidosSimulados++;
        totalJugadas += jugadasCreadas;
        
        console.log(`  ✅ ${jugadasCreadas} jugadas creadas`);
      } catch (error) {
        console.error(`  ❌ Error simulando partido ${partido._id}:`, error.message);
      }
      
      // Pausa pequeña para evitar sobrecarga
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // 4. Resumen final
    console.log('\n🎉 ¡SIMULACIÓN COMPLETADA!');
    console.log('============================');
    console.log(`📊 Partidos simulados: ${partidosSimulados}/${partidos.length}`);
    console.log(`⚽ Total de jugadas creadas: ${totalJugadas}`);
    console.log(`📈 Promedio de jugadas por partido: ${Math.round(totalJugadas / partidosSimulados)}`);
    
    // 5. Mostrar algunos resultados
    await mostrarResultadosEjemplo();
    
  } catch (error) {
    console.error('❌ ERROR en la simulación:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de la base de datos');
  }
}

// 🔌 CONECTAR A LA BASE DE DATOS
async function conectarDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a la base de datos MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    throw error;
  }
}

// 📋 OBTENER PARTIDOS PROGRAMADOS
async function obtenerPartidosProgramados() {
  console.log('\n🔍 Buscando partidos programados...');
  
  const filtro = {
    estado: { $in: CONFIG.ESTADOS_PROCESAR }
  };
  
  // Si se especifica un torneo, filtrar por él
  if (CONFIG.TORNEO_NOMBRE) {
    const torneo = await Torneo.findOne({ nombre: CONFIG.TORNEO_NOMBRE });
    if (torneo) {
      filtro.torneo = torneo._id;
      console.log(`🔍 Filtrando por torneo: ${CONFIG.TORNEO_NOMBRE} (ID: ${torneo._id})`);
    } else {
      console.log(`⚠️ Torneo "${CONFIG.TORNEO_NOMBRE}" no encontrado, procesando todos los partidos`);
    }
  }
  
  const partidos = await Partido.find(filtro)
    .populate('equipoLocal', 'nombre categoria')
    .populate('equipoVisitante', 'nombre categoria')
    .populate('torneo', 'nombre')
    .sort({ fechaHora: 1 });
  
  console.log(`✅ Encontrados ${partidos.length} partidos para simular`);
  
  return partidos;
}

// 🏈 SIMULAR UN PARTIDO COMPLETO
async function simularPartido(partido) {
  // 1. Obtener jugadores de ambos equipos
  const jugadoresLocal = await obtenerJugadoresEquipo(partido.equipoLocal._id);
  const jugadoresVisitante = await obtenerJugadoresEquipo(partido.equipoVisitante._id);
  
  if (jugadoresLocal.length === 0 || jugadoresVisitante.length === 0) {
    throw new Error('Uno o ambos equipos no tienen jugadores registrados');
  }
  
  // 2. Generar marcador objetivo (alrededor de 20 puntos cada uno, sin empates)
  const { puntosLocal, puntosVisitante } = generarMarcadorObjetivo();
  
  // 3. Generar jugadas para alcanzar el marcador
  const jugadas = await generarJugadasPartido(
    partido,
    jugadoresLocal,
    jugadoresVisitante,
    puntosLocal,
    puntosVisitante
  );
  
  // 4. Actualizar el partido
  await actualizarPartidoFinalizado(partido, jugadas, puntosLocal, puntosVisitante);
  
  return jugadas.length;
}

// 👥 OBTENER JUGADORES DE UN EQUIPO
async function obtenerJugadoresEquipo(equipoId) {
  const jugadores = await Usuario.find({
    'equipos.equipo': equipoId,
    'rol': 'jugador'
  }).select('nombre equipos');
  
  // Extraer números de jugador
  return jugadores.map(jugador => {
    const equipoData = jugador.equipos.find(e => e.equipo.toString() === equipoId.toString());
    return {
      id: jugador._id,
      nombre: jugador.nombre,
      numero: equipoData ? equipoData.numero : null
    };
  }).filter(j => j.numero !== null); // Solo jugadores con número
}

// 🎯 GENERAR MARCADOR OBJETIVO (SIN EMPATES)
function generarMarcadorObjetivo() {
  const puntosLocal = Math.floor(Math.random() * (CONFIG.PUNTOS_OBJETIVO.max - CONFIG.PUNTOS_OBJETIVO.min + 1)) + CONFIG.PUNTOS_OBJETIVO.min;
  let puntosVisitante = Math.floor(Math.random() * (CONFIG.PUNTOS_OBJETIVO.max - CONFIG.PUNTOS_OBJETIVO.min + 1)) + CONFIG.PUNTOS_OBJETIVO.min;
  
  // Evitar empates
  while (puntosVisitante === puntosLocal) {
    puntosVisitante = Math.floor(Math.random() * (CONFIG.PUNTOS_OBJETIVO.max - CONFIG.PUNTOS_OBJETIVO.min + 1)) + CONFIG.PUNTOS_OBJETIVO.min;
  }
  
  return { puntosLocal, puntosVisitante };
}

// 🎮 GENERAR JUGADAS DEL PARTIDO
async function generarJugadasPartido(partido, jugadoresLocal, jugadoresVisitante, puntosObjetivoLocal, puntosObjetivoVisitante) {
  const jugadas = [];
  let puntosLocal = 0;
  let puntosVisitante = 0;
  let posesionLocal = Math.random() > 0.5; // Determinar quién inicia
  
  // Generar número de jugadas
  const totalJugadas = Math.floor(Math.random() * (CONFIG.JUGADAS_POR_PARTIDO.max - CONFIG.JUGADAS_POR_PARTIDO.min + 1)) + CONFIG.JUGADAS_POR_PARTIDO.min;
  
  for (let i = 0; i < totalJugadas; i++) {
    // Determinar tiempo de la jugada
    const tiempo = generarTiempoJugada(i, totalJugadas);
    
    // Determinar tipo de jugada
    const tipoJugada = seleccionarTipoJugada();
    const configJugada = CONFIG.TIPOS_JUGADAS[tipoJugada];
    
    // Determinar equipo en posesión y equipo defensor
    const equipoEnPosesion = posesionLocal ? partido.equipoLocal._id : partido.equipoVisitante._id;
    const jugadoresEnPosesion = posesionLocal ? jugadoresLocal : jugadoresVisitante;
    const jugadoresDefensores = posesionLocal ? jugadoresVisitante : jugadoresLocal;
    
    // Seleccionar jugadores según el tipo de jugada
    let jugadorPrincipal, jugadorSecundario;
    
    if (configJugada.esOfensiva) {
      // Jugada ofensiva: jugadores del equipo en posesión
      jugadorPrincipal = seleccionarJugadorAleatorio(jugadoresEnPosesion);
      if (['pase_completo'].includes(tipoJugada)) {
        jugadorSecundario = seleccionarJugadorAleatorio(jugadoresEnPosesion, jugadorPrincipal.id);
      }
    } else {
      // Jugada defensiva: jugador principal del equipo DEFENSOR
      jugadorPrincipal = seleccionarJugadorAleatorio(jugadoresDefensores);
      if (['intercepcion'].includes(tipoJugada)) {
        // El jugador secundario es del equipo ofensivo (el QB que lanzó el pase interceptado)
        jugadorSecundario = seleccionarJugadorAleatorio(jugadoresEnPosesion);
      }
    }
    
    // Determinar si es touchdown
    const esTouchdown = Math.random() * 100 < (configJugada.touchdown_prob || 0);
    let puntosJugada = esTouchdown ? 6 : 0;
    
    // Crear jugada
    const jugada = {
      numero: i + 1,
      tiempo: tiempo,
      equipoEnPosesion: equipoEnPosesion,
      tipoJugada: tipoJugada,
      descripcion: generarDescripcionJugada(tipoJugada, jugadorPrincipal, jugadorSecundario, esTouchdown),
      jugadorPrincipal: jugadorPrincipal.id,
      jugadorSecundario: jugadorSecundario ? jugadorSecundario.id : undefined,
      resultado: {
        touchdown: esTouchdown,
        intercepcion: tipoJugada === 'intercepcion',
        sack: tipoJugada === 'sack',
        puntos: puntosJugada
      }
    };
    
    jugadas.push(jugada);
    
    // Actualizar marcador
    if (puntosJugada > 0) {
      if (configJugada.esOfensiva || tipoJugada === 'intercepcion') {
        // Puntos para el equipo en posesión (ofensiva) o el equipo defensor (pick-six)
        const equipoQueAnota = (tipoJugada === 'intercepcion') ? !posesionLocal : posesionLocal;
        if (equipoQueAnota) {
          puntosLocal += puntosJugada;
        } else {
          puntosVisitante += puntosJugada;
        }
      }
    }
    
    // Generar conversión después de touchdown
    if (esTouchdown) {
      const conversion = generarConversion(posesionLocal ? jugadoresLocal : jugadoresVisitante, equipoEnPosesion);
      if (conversion) {
        jugadas.push(conversion);
        
        // Actualizar marcador con conversión
        const equipoQueAnota = (tipoJugada === 'intercepcion') ? !posesionLocal : posesionLocal;
        if (equipoQueAnota) {
          puntosLocal += conversion.resultado.puntos;
        } else {
          puntosVisitante += conversion.resultado.puntos;
        }
      }
    }
    
    // Cambiar posesión en ciertas jugadas
    if (['intercepcion', 'touchdown'].includes(tipoJugada)) {
      posesionLocal = !posesionLocal;
    }
    
    // Cambiar posesión ocasionalmente (simulando downs)
    if (Math.random() < 0.3) { // 30% probabilidad de cambio de posesión
      posesionLocal = !posesionLocal;
    }
  }
  
  return jugadas;
}

// ⏰ GENERAR TIEMPO DE JUGADA
function generarTiempoJugada(indiceJugada, totalJugadas) {
  // Distribuir jugadas a lo largo del partido (50 minutos, 2 periodos)
  const tiempoTranscurrido = (indiceJugada / totalJugadas) * CONFIG.DURACION_PARTIDO;
  const periodo = tiempoTranscurrido < (CONFIG.DURACION_PARTIDO / 2) ? 1 : 2;
  const minutoEnPeriodo = Math.floor(tiempoTranscurrido % (CONFIG.DURACION_PARTIDO / 2));
  const segundo = Math.floor(Math.random() * 60);
  
  return {
    minuto: minutoEnPeriodo,
    segundo: segundo,
    periodo: periodo
  };
}

// 🎲 SELECCIONAR TIPO DE JUGADA
function seleccionarTipoJugada() {
  const tipos = Object.keys(CONFIG.TIPOS_JUGADAS);
  const probabilidades = Object.values(CONFIG.TIPOS_JUGADAS).map(t => t.prob);
  
  const total = probabilidades.reduce((sum, prob) => sum + prob, 0);
  const random = Math.random() * total;
  
  let acumulado = 0;
  for (let i = 0; i < tipos.length; i++) {
    acumulado += probabilidades[i];
    if (random <= acumulado) {
      return tipos[i];
    }
  }
  
  return tipos[0]; // Fallback
}

// 👤 SELECCIONAR JUGADOR ALEATORIO
function seleccionarJugadorAleatorio(jugadores, excluirId = null) {
  const jugadoresDisponibles = jugadores.filter(j => j.id.toString() !== excluirId?.toString());
  return jugadoresDisponibles[Math.floor(Math.random() * jugadoresDisponibles.length)];
}

// 📝 GENERAR DESCRIPCIÓN DE JUGADA
function generarDescripcionJugada(tipo, jugadorPrincipal, jugadorSecundario, esTouchdown) {
  const descripciones = {
    'pase_completo': [
      `Pase completo de #${jugadorPrincipal.numero} a #${jugadorSecundario?.numero}`,
      `Conexión exitosa entre #${jugadorPrincipal.numero} y #${jugadorSecundario?.numero}`,
      `Pase de ${Math.floor(Math.random() * 20) + 5} yardas completado`
    ],
    'pase_incompleto': [
      `Pase incompleto de #${jugadorPrincipal.numero}`,
      `Pase cerrado, no encontró al receptor`,
      `Pase alto, imposible de atrapar`
    ],
    'corrida': [
      `Corrida de #${jugadorPrincipal.numero} por ${Math.floor(Math.random() * 15) + 3} yardas`,
      `Acarreo efectivo de #${jugadorPrincipal.numero}`,
      `Corrida por el centro del campo`
    ],
    'intercepcion': [
      `¡Intercepción de #${jugadorPrincipal.numero}!`,
      `#${jugadorPrincipal.numero} roba el balón en el aire`,
      `Gran lectura defensiva de #${jugadorPrincipal.numero}`
    ],
    'sack': [
      `¡Sack de #${jugadorPrincipal.numero}!`,
      `#${jugadorPrincipal.numero} derriba al QB`,
      `Captura por pérdida de yardas`
    ],
    'tackleo': [
      `Tackleo sólido de #${jugadorPrincipal.numero}`,
      `#${jugadorPrincipal.numero} detiene el avance`,
      `Tackleo efectivo en la línea de scrimmage`
    ]
  };
  
  let descripcion = descripciones[tipo][Math.floor(Math.random() * descripciones[tipo].length)];
  
  if (esTouchdown) {
    descripcion += ' - ¡TOUCHDOWN!';
  }
  
  return descripcion;
}

// 🏆 GENERAR CONVERSIÓN DESPUÉS DE TD
function generarConversion(jugadores, equipoEnPosesion) {
  const intentaConversion = Math.random() < 0.9; // 90% intenta conversión
  if (!intentaConversion) return null;
  
  const es2Puntos = Math.random() < (CONFIG.CONVERSIONES['2pt'].prob / 100);
  const tipoConversion = es2Puntos ? 'conversion_2pt' : 'conversion_1pt';
  const puntosConversion = es2Puntos ? 2 : 1;
  
  // Probabilidad de éxito
  const exitoso = Math.random() < (es2Puntos ? 0.4 : 0.8); // 2pt: 40%, 1pt: 80%
  
  const jugadorPateador = seleccionarJugadorAleatorio(jugadores);
  
  return {
    numero: 999, // Se ajustará en el guardado
    tiempo: { minuto: 0, segundo: 0, periodo: 1 }, // Se ajustará
    equipoEnPosesion: equipoEnPosesion,
    tipoJugada: tipoConversion,
    descripcion: `${exitoso ? 'Exitosa' : 'Fallida'} conversión de ${puntosConversion} punto${puntosConversion > 1 ? 's' : ''}`,
    jugadorPrincipal: jugadorPateador.id,
    resultado: {
      touchdown: false,
      intercepcion: false,
      sack: false,
      puntos: exitoso ? puntosConversion : 0
    }
  };
}

// 💾 ACTUALIZAR PARTIDO FINALIZADO
async function actualizarPartidoFinalizado(partido, jugadas, puntosLocal, puntosVisitante) {
  // Ajustar números de jugada
  jugadas.forEach((jugada, index) => {
    jugada.numero = index + 1;
  });
  
  // Determinar ganador
  const ganador = puntosLocal > puntosVisitante ? partido.equipoLocal._id : partido.equipoVisitante._id;
  const diferenciaPuntos = Math.abs(puntosLocal - puntosVisitante);
  
  // Actualizar el partido
  await Partido.findByIdAndUpdate(partido._id, {
    $set: {
      estado: 'finalizado',
      'marcador.local': puntosLocal,
      'marcador.visitante': puntosVisitante,
      'resultado.ganador': ganador,
      'resultado.empate': false,
      'resultado.diferenciaPuntos': diferenciaPuntos,
      'resultado.tipoVictoria': 'normal',
      'tiempoJuego.tiempoFinalizacion': new Date(),
      jugadas: jugadas
    }
  });
  
  console.log(`    📊 Marcador final: ${puntosLocal} - ${puntosVisitante}`);
}

// 📊 MOSTRAR RESULTADOS DE EJEMPLO
async function mostrarResultadosEjemplo() {
  console.log('\n📋 Ejemplos de partidos simulados:');
  console.log('===================================');
  
  const partidosEjemplo = await Partido.find({ 
    estado: 'finalizado',
    'jugadas.0': { $exists: true }
  })
  .populate('equipoLocal', 'nombre')
  .populate('equipoVisitante', 'nombre')
  .sort({ 'tiempoJuego.tiempoFinalizacion': -1 })
  .limit(5);
  
  partidosEjemplo.forEach((partido, index) => {
    console.log(`${index + 1}. ${partido.equipoLocal.nombre} ${partido.marcador.local} - ${partido.marcador.visitante} ${partido.equipoVisitante.nombre}`);
    console.log(`   Jugadas: ${partido.jugadas.length} | Categoría: ${partido.categoria}`);
    console.log('');
  });
}

// 🚀 EJECUTAR SCRIPT
if (require.main === module) {
  simularPartidosFinalizados();
}

module.exports = {
  simularPartidosFinalizados
};

/*
📖 INSTRUCCIONES DE USO:

1. Guardar este archivo como: scripts/simular_partidos_finalizados.js

2. Configurar variables en CONFIG según necesites:
   - TORNEO_NOMBRE: Nombre del torneo a procesar
   - PUNTOS_OBJETIVO: Rango de puntos por equipo (alrededor de 20)
   - JUGADAS_POR_PARTIDO: Cantidad de jugadas por partido

3. Ejecutar desde la raíz del proyecto:
   node scripts/simular_partidos_finalizados.js

4. El script:
   ✅ Busca partidos en estado 'programado'
   ✅ Obtiene jugadores reales de cada equipo
   ✅ Genera jugadas realistas con probabilidades
   ✅ Maneja jugadas defensivas correctamente
   ✅ Crea marcadores sin empates (alrededor de 20 puntos)
   ✅ Marca partidos como 'finalizado'

5. Tipos de jugadas generadas:
   🏈 Ofensivas: pase_completo, pase_incompleto, corrida
   🛡️ Defensivas: intercepcion, sack, tackleo
   🏆 Especiales: conversion_1pt, conversion_2pt

6. Características realistas:
   ✅ Probabilidades basadas en flag football real
   ✅ Jugadas defensivas asignadas al equipo defensor
   ✅ Conversiones después de touchdowns
   ✅ Descripciones automáticas de jugadas
   ✅ Distribución temporal a lo largo del partido

⚠️  IMPORTANTE:
- Requiere que los equipos tengan jugadores registrados
- Solo procesa partidos en estado 'programado'
- Los marcadores rondan los 20 puntos sin empates
- Las jugadas defensivas se asignan correctamente al equipo defensor
*/