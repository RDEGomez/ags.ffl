// fix-jugada.js
// Script para corregir jugada específica - intercambiar jugadorPrincipal y jugadorSecundario

const mongoose = require('mongoose');
require('dotenv').config();

// Modelo de Partido (ajusta la ruta según tu estructura)
const Partido = require('../src/models/Partido'); // Ajusta esta ruta

async function corregirJugada() {
  try {
    console.log('🔧 Iniciando corrección de jugada...');
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const jugadaId = '68523b63ff5761b7ec49b699';
    
    // Buscar el partido que contiene la jugada
    const partido = await Partido.findOne({
      'jugadas._id': jugadaId
    });
    
    if (!partido) {
      console.log(`❌ No se encontró ningún partido con la jugada ID: ${jugadaId}`);
      return;
    }

    console.log(`📋 Partido encontrado: ${partido._id}`);
    
    // Encontrar la jugada específica dentro del arreglo
    const jugada = partido.jugadas.find(j => j._id.toString() === jugadaId);
    
    if (!jugada) {
      console.log(`❌ No se encontró la jugada con ID: ${jugadaId} en el partido`);
      return;
    }

    console.log('📋 Jugada encontrada:');
    console.log(`   ID: ${jugada._id}`);
    console.log(`   Tipo: ${jugada.tipoJugada}`);
    console.log(`   Jugador Principal actual: ${jugada.jugadorPrincipal}`);
    console.log(`   Jugador Secundario actual: ${jugada.jugadorSecundario}`);
    
    // Intercambiar los jugadores
    const tempJugadorPrincipal = jugada.jugadorPrincipal;
    jugada.jugadorPrincipal = jugada.jugadorSecundario;
    jugada.jugadorSecundario = tempJugadorPrincipal;
    
    // Guardar los cambios del partido
    await partido.save();
    
    console.log('✅ Jugada corregida exitosamente:');
    console.log(`   Jugador Principal nuevo: ${jugada.jugadorPrincipal}`);
    console.log(`   Jugador Secundario nuevo: ${jugada.jugadorSecundario}`);
    
  } catch (error) {
    console.error('❌ Error al corregir la jugada:', error);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
  }
}

// Ejecutar el script
corregirJugada();

// Para ejecutar:
// node fix-jugada.js