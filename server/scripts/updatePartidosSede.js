// server/scripts/updatePartidosSede.js
// Script para actualizar la sede de todos los partidos

const mongoose = require('mongoose');
require('dotenv').config();

// Conectar a MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

// Esquema del modelo Partido (copia el esquema de tu modelo)
const partidoSchema = new mongoose.Schema({
  equipoLocal: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipo', required: true },
  equipoVisitante: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipo', required: true },
  torneo: { type: mongoose.Schema.Types.ObjectId, ref: 'Torneo', required: true },
  categoria: { type: String, required: true },
  fechaHora: { type: Date, required: true },
  sede: {
    nombre: { type: String },
    direccion: { type: String }
  },
  // ... otros campos que tengas
}, { timestamps: true });

const Partido = mongoose.model('Partido', partidoSchema);

// Función principal para actualizar partidos
const updatePartidosSede = async () => {
  console.log('🏟️ Iniciando actualización masiva de sedes...\n');

  try {
    // Obtener todos los partidos
    console.log('📋 Obteniendo todos los partidos...');
    const partidos = await Partido.find({});
    console.log(`✅ Encontrados ${partidos.length} partidos\n`);

    if (partidos.length === 0) {
      console.log('⚠️ No hay partidos para actualizar');
      return;
    }

    // Mostrar algunos ejemplos antes de actualizar
    console.log('📄 Ejemplos de sedes actuales:');
    partidos.slice(0, 3).forEach((partido, index) => {
      console.log(`  ${index + 1}. Sede: ${partido.sede?.nombre || 'Sin nombre'} - ${partido.sede?.direccion || 'Sin dirección'}`);
    });
    console.log();

    // Actualizar todos los partidos
    console.log('🔄 Actualizando sedes...');
    const resultado = await Partido.updateMany(
      {}, // Filtro vacío = todos los documentos
      {
        $set: {
          'sede.nombre': 'IT Innovation School Campus',
          'sede.direccion': 'Libramiento Pocitos'
        }
      }
    );

    console.log('✅ Actualización completada:');
    console.log(`   📊 Documentos modificados: ${resultado.modifiedCount}`);
    console.log(`   📊 Documentos encontrados: ${resultado.matchedCount}`);
    console.log();

    // Verificar algunos resultados
    console.log('🔍 Verificando actualización...');
    const partidosActualizados = await Partido.find({}).limit(3);
    partidosActualizados.forEach((partido, index) => {
      console.log(`  ${index + 1}. Nueva sede: ${partido.sede?.nombre} - ${partido.sede?.direccion}`);
    });

    console.log('\n🎉 ¡Actualización masiva completada exitosamente!');

  } catch (error) {
    console.error('❌ Error durante la actualización:', error);
    throw error;
  }
};

// Función para ejecutar el script
const ejecutarScript = async () => {
  try {
    await connectDB();
    await updatePartidosSede();
  } catch (error) {
    console.error('💥 Error fatal:', error);
  } finally {
    console.log('\n🔌 Desconectando de MongoDB...');
    await mongoose.disconnect();
    console.log('✅ Desconectado');
    process.exit(0);
  }
};

// Ejecutar si es llamado directamente
if (require.main === module) {
  console.log('🚀 SCRIPT DE ACTUALIZACIÓN MASIVA DE SEDES');
  console.log('==========================================\n');
  
  // Confirmación de seguridad
  console.log('⚠️ ADVERTENCIA: Este script actualizará TODOS los partidos');
  console.log('Nueva sede: IT Innovation School Campus');
  console.log('Nueva dirección: Libramiento Pocitos\n');
  
  ejecutarScript();
}

module.exports = { updatePartidosSede };