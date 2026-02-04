const mongoose = require('mongoose');
require('dotenv').config();

// Conectar a MongoDB usando la misma configuración del proyecto
async function connectDB() {
    try {
        mongoose.Promise = global.Promise;
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://danielcachao:WWchwuZwGi5nItxh@edgcprojcluster.5w9dq9d.mongodb.net/agsffl?retryWrites=true&w=majority', { 
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
const Equipo = require('../src/models/Equipo');
const Usuario = require('../src/models/Usuario');
const Partido = require('../src/models/Partido');

async function cleanupOrphanedTeams(dryRun = true) {
    console.log(`\n🔍 ${dryRun ? 'MODO PRUEBA' : 'EJECUTANDO'} - Limpieza de equipos huérfanos (sin partidos)`);
    console.log('=' + '='.repeat(70));

    try {
        // 1. Obtener todos los equipos
        const todosLosEquipos = await Equipo.find({});
        console.log(`\n📊 Total de equipos en la base de datos: ${todosLosEquipos.length}`);

        if (todosLosEquipos.length === 0) {
            console.log('❌ No se encontraron equipos en la base de datos');
            return;
        }

        // 2. Obtener todos los IDs de equipos que SÍ tienen partidos
        const equiposConPartidos = await Partido.aggregate([
            {
                $group: {
                    _id: null,
                    equiposLocales: { $addToSet: '$equipoLocal' },
                    equiposVisitantes: { $addToSet: '$equipoVisitante' }
                }
            },
            {
                $project: {
                    todosLosEquiposConPartidos: {
                        $setUnion: ['$equiposLocales', '$equiposVisitantes']
                    }
                }
            }
        ]);

        const idsEquiposConPartidos = equiposConPartidos.length > 0 
            ? equiposConPartidos[0].todosLosEquiposConPartidos 
            : [];

        console.log(`🏈 Equipos que tienen partidos: ${idsEquiposConPartidos.length}`);

        // 3. Encontrar equipos huérfanos (que NO tienen partidos)
        const equiposHuerfanos = await Equipo.find({
            _id: { $nin: idsEquiposConPartidos }
        });

        console.log(`\n🚫 Equipos huérfanos (sin partidos): ${equiposHuerfanos.length}`);

        if (equiposHuerfanos.length === 0) {
            console.log('✅ No se encontraron equipos huérfanos. Todos los equipos tienen partidos asignados.');
            return {
                equiposTotal: todosLosEquipos.length,
                equiposConPartidos: idsEquiposConPartidos.length,
                equiposHuerfanos: 0
            };
        }

        // Mostrar equipos huérfanos por categoría
        const equiposPorCategoria = {};
        equiposHuerfanos.forEach(equipo => {
            const categoria = equipo.categoria || 'Sin categoría';
            if (!equiposPorCategoria[categoria]) {
                equiposPorCategoria[categoria] = [];
            }
            equiposPorCategoria[categoria].push(equipo);
        });

        console.log('\nEquipos huérfanos por categoría:');
        Object.keys(equiposPorCategoria).forEach(categoria => {
            console.log(`\n📂 ${categoria} (${equiposPorCategoria[categoria].length} equipos):`);
            equiposPorCategoria[categoria].forEach((equipo, index) => {
                console.log(`  ${index + 1}. ${equipo.nombre} - ID: ${equipo._id} - Estado: ${equipo.estado || 'activo'}`);
            });
        });

        // 4. Buscar usuarios que tengan estos equipos huérfanos
        const equiposHuerfanosIds = equiposHuerfanos.map(e => e._id);
        const usuariosAfectados = await Usuario.find({
            'equipos.equipo': { $in: equiposHuerfanosIds }
        }).populate('equipos.equipo', 'nombre categoria');

        console.log(`\n👥 Usuarios afectados (que tienen equipos huérfanos): ${usuariosAfectados.length}`);

        if (usuariosAfectados.length > 0) {
            console.log('Usuarios que serán afectados:');
            usuariosAfectados.forEach((usuario, index) => {
                console.log(`  ${index + 1}. ${usuario.nombre || usuario.email} (${usuario.documento})`);
                
                // Mostrar qué equipos huérfanos tiene el usuario
                const equiposHuerfanosUsuario = usuario.equipos.filter(e => 
                    e.equipo && equiposHuerfanosIds.some(id => id.toString() === e.equipo._id.toString())
                );
                
                equiposHuerfanosUsuario.forEach(eq => {
                    console.log(`     - Equipo huérfano: ${eq.equipo.nombre} (Número: ${eq.numero || 'Sin número'})`);
                });
            });
        }

        // 5. Mostrar resumen
        console.log('\n📊 RESUMEN DE LIMPIEZA:');
        console.log(`- Total de equipos: ${todosLosEquipos.length}`);
        console.log(`- Equipos con partidos: ${idsEquiposConPartidos.length}`);
        console.log(`- Equipos huérfanos a eliminar: ${equiposHuerfanos.length}`);
        console.log(`- Usuarios afectados: ${usuariosAfectados.length}`);

        // Contar registros de equipos huérfanos en usuarios
        let totalRegistrosHuerfanos = 0;
        usuariosAfectados.forEach(usuario => {
            const equiposHuerfanosUsuario = usuario.equipos.filter(e => 
                e.equipo && equiposHuerfanosIds.some(id => id.toString() === e.equipo._id.toString())
            );
            totalRegistrosHuerfanos += equiposHuerfanosUsuario.length;
        });
        console.log(`- Registros de equipos huérfanos en usuarios: ${totalRegistrosHuerfanos}`);

        if (dryRun) {
            console.log('\n⚠️  MODO PRUEBA - No se eliminó nada');
            console.log('Para ejecutar la eliminación real, usa: --execute');
            return {
                equiposTotal: todosLosEquipos.length,
                equiposConPartidos: idsEquiposConPartidos.length,
                equiposHuerfanos: equiposHuerfanos.length,
                usuariosAfectados: usuariosAfectados.length,
                registrosHuerfanos: totalRegistrosHuerfanos
            };
        }

        // 6. Ejecutar eliminaciones (solo si no es dry run)
        console.log('\n🚨 INICIANDO LIMPIEZA REAL...');

        // 6.1. Eliminar equipos huérfanos de los arrays de usuarios
        let usuariosActualizados = 0;
        for (const usuario of usuariosAfectados) {
            const equiposOriginales = usuario.equipos.length;
            
            // Filtrar equipos, removiendo los huérfanos
            usuario.equipos = usuario.equipos.filter(e => 
                !e.equipo || !equiposHuerfanosIds.some(id => id.toString() === e.equipo._id.toString())
            );
            
            if (equiposOriginales !== usuario.equipos.length) {
                await usuario.save();
                usuariosActualizados++;
                const equiposRemovidos = equiposOriginales - usuario.equipos.length;
                console.log(`  ✅ Actualizado usuario: ${usuario.nombre || usuario.email} (${equiposRemovidos} equipos huérfanos removidos)`);
            }
        }

        console.log(`✅ Usuarios actualizados: ${usuariosActualizados}`);

        // 6.2. Eliminar los equipos huérfanos
        const deletedEquipos = await Equipo.deleteMany({ _id: { $in: equiposHuerfanosIds } });
        console.log(`✅ Equipos huérfanos eliminados: ${deletedEquipos.deletedCount}`);

        console.log('\n🎉 Limpieza de equipos huérfanos completada exitosamente');

        // 7. Mostrar estadísticas finales
        const equiposRestantes = await Equipo.countDocuments();
        console.log(`\n📈 ESTADÍSTICAS FINALES:`);
        console.log(`- Equipos restantes en la base de datos: ${equiposRestantes}`);
        console.log(`- Equipos eliminados: ${deletedEquipos.deletedCount}`);

        return {
            equiposTotal: todosLosEquipos.length,
            equiposConPartidos: idsEquiposConPartidos.length,
            equiposHuerfanos: deletedEquipos.deletedCount,
            usuariosAfectados: usuariosActualizados,
            registrosHuerfanos: totalRegistrosHuerfanos,
            equiposRestantes: equiposRestantes,
            executed: true
        };

    } catch (error) {
        console.error('❌ Error durante la limpieza:', error);
        throw error;
    }
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--help')) {
        console.log('\n📋 USO DEL SCRIPT:');
        console.log('node cleanup-orphaned-teams.js [--execute]');
        console.log('\nEjemplos:');
        console.log('node cleanup-orphaned-teams.js              # Modo prueba');
        console.log('node cleanup-orphaned-teams.js --execute    # Ejecutar eliminación');
        console.log('\nDescripción:');
        console.log('Este script elimina equipos que no tienen ningún partido asignado.');
        console.log('Útil después de limpiar torneos y equipos por palabra clave.');
        process.exit(0);
    }

    const execute = args.includes('--execute');

    await connectDB();

    try {
        const result = await cleanupOrphanedTeams(!execute);
        
        if (!execute && result && result.equiposHuerfanos > 0) {
            console.log('\n🔄 Para ejecutar la eliminación real:');
            console.log('node cleanup-orphaned-teams.js --execute');
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

module.exports = { cleanupOrphanedTeams };