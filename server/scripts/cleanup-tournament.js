const mongoose = require('mongoose');
require('dotenv').config();

// Conectar a MongoDB usando la misma configuración del proyecto
async function connectDB() {
    try {
        mongoose.Promise = global.Promise;
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agsffl', { 
            useNewUrlParser: true,
            useUnifiedTopology: true 
        });
        console.log('✅ Conectado a MongoDB:', process.env.NODE_ENV === 'production' ? 'Atlas' : 'Local');
    } catch (error) {
        console.error('❌ Error conectando a MongoDB:', error);
        process.exit(1);
    }
}

// Usar los modelos reales del proyecto
// NOTA: Ajustar las rutas según donde coloques este script
// Si está en la raíz del proyecto: './src/models/'
// Si está en src/: './models/'
const Torneo = require('../src/models/Torneo');
const Equipo = require('../src/models/Equipo'); 
const Partido = require('../src/models/Partido');

async function cleanupTournament(tournamentId, dryRun = true) {
    console.log(`\n🔍 ${dryRun ? 'MODO PRUEBA' : 'EJECUTANDO'} - Limpieza del torneo: ${tournamentId}`);
    console.log('=' + '='.repeat(60));

    try {
        // 1. Verificar que el torneo existe
        const torneo = await Torneo.findById(tournamentId);
        if (!torneo) {
            console.log('❌ El torneo no existe');
            return;
        }

        console.log(`📋 Torneo encontrado: ${torneo.nombre || 'Sin nombre'}`);
        console.log(`📅 Fecha: ${torneo.fechaInicio || 'No definida'} - ${torneo.fechaFin || 'No definida'}`);
        console.log(`🏆 Categorías: ${torneo.categorias?.join(', ') || 'No definidas'}`);

        // 2. Buscar todos los partidos del torneo
        const partidos = await Partido.find({ torneo: tournamentId })
            .populate('equipoLocal', 'nombre categoria')
            .populate('equipoVisitante', 'nombre categoria');
            
        console.log(`\n🏈 Partidos encontrados: ${partidos.length}`);

        if (partidos.length > 0) {
            console.log('Partidos a eliminar:');
            partidos.forEach((partido, index) => {
                const local = partido.equipoLocal?.nombre || 'Equipo sin nombre';
                const visitante = partido.equipoVisitante?.nombre || 'Equipo sin nombre';
                const fecha = partido.fechaHora ? new Date(partido.fechaHora).toLocaleDateString() : 'Sin fecha';
                console.log(`  ${index + 1}. ${local} vs ${visitante} - ${fecha} (${partido.categoria})`);
            });
        }

        // 3. Buscar equipos que tienen partidos en este torneo
        // const equiposConPartidos = await Equipo.find({
        //     $or: [
        //         { _id: { $in: partidos.map(p => p.equipoLocal) } },
        //         { _id: { $in: partidos.map(p => p.equipoVisitante) } }
        //     ]
        // });

        // console.log(`\n👥 Equipos con partidos en este torneo: ${equiposConPartidos.length}`);
        
        // if (equiposConPartidos.length > 0) {
        //     console.log('Equipos a eliminar:');
        //     equiposConPartidos.forEach((equipo, index) => {
        //         console.log(`  ${index + 1}. ${equipo.nombre || 'Sin nombre'} (${equipo.categoria || 'Sin categoría'})`);
        //     });
        // }

        // 4. Mostrar resumen
        console.log('\n📊 RESUMEN DE ELIMINACIÓN:');
        console.log(`- Torneo: 1`);
        console.log(`- Partidos: ${partidos.length}`);
        // console.log(`- Equipos: ${equiposConPartidos.length}`);

        if (dryRun) {
            console.log('\n⚠️  MODO PRUEBA - No se eliminó nada');
            console.log('Para ejecutar la eliminación real, usa: --execute');
            return {
                torneo: 1,
                partidos: partidos.length,
                // equipos: equiposConPartidos.length
            };
        }

        // 5. Ejecutar eliminaciones (solo si no es dry run)
        console.log('\n🚨 INICIANDO ELIMINACIÓN REAL...');
        
        // Eliminar equipos que tienen partidos en este torneo
        // if (equiposConPartidos.length > 0) {
        //     const equipoIds = equiposConPartidos.map(e => e._id);
        //     const deletedEquipos = await Equipo.deleteMany({ _id: { $in: equipoIds } });
        //     console.log(`✅ Equipos eliminados: ${deletedEquipos.deletedCount}`);
        // }

        // Eliminar partidos del torneo
        if (partidos.length > 0) {
            const deletedPartidos = await Partido.deleteMany({ torneo: tournamentId });
            console.log(`✅ Partidos eliminados: ${deletedPartidos.deletedCount}`);
        }

        // Eliminar torneo
        const deletedTorneo = await Torneo.deleteOne({ _id: tournamentId });
        console.log(`✅ Torneo eliminado: ${deletedTorneo.deletedCount}`);

        console.log('\n🎉 Eliminación completada exitosamente');

        return {
            torneo: deletedTorneo.deletedCount,
            partidos: partidos.length,
            // equipos: equiposConPartidos.length,
            executed: true
        };

    } catch (error) {
        console.error('❌ Error durante la limpieza:', error);
        throw error;
    }
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('\n📋 USO DEL SCRIPT:');
        console.log('node cleanup-tournament.js <tournamentId> [--execute]');
        console.log('\nEjemplos:');
        console.log('node cleanup-tournament.js 507f1f77bcf86cd799439011              # Modo prueba');
        console.log('node cleanup-tournament.js 507f1f77bcf86cd799439011 --execute    # Ejecutar eliminación');
        process.exit(0);
    }

    const tournamentId = args[0];
    const execute = args.includes('--execute');

    // Validar ObjectId
    if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
        console.error('❌ El ID del torneo no es válido');
        process.exit(1);
    }

    await connectDB();

    try {
        const result = await cleanupTournament(tournamentId, !execute);
        
        if (!execute && result) {
            console.log('\n🔄 Para ejecutar la eliminación real:');
            console.log(`node cleanup-tournament.js ${tournamentId} --execute`);
        }

    } catch (error) {
        console.error('💥 Error fatal:', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n📡 Conexión a MongoDB cerrada');
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main();
}

module.exports = { cleanupTournament };