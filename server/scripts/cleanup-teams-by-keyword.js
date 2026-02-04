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

async function cleanupTeamsByKeyword(keyword, dryRun = true) {
    console.log(`\n🔍 ${dryRun ? 'MODO PRUEBA' : 'EJECUTANDO'} - Limpieza por palabra clave: "${keyword}"`);
    console.log('=' + '='.repeat(70));

    try {
        // 1. Buscar todos los equipos que contengan la palabra clave en el nombre
        const equiposConPalabraClave = await Equipo.find({
            nombre: { 
                $regex: keyword, 
                $options: 'i' // Case insensitive
            }
        });

        console.log(`\n🏈 Equipos encontrados con "${keyword}": ${equiposConPalabraClave.length}`);

        if (equiposConPalabraClave.length === 0) {
            console.log('❌ No se encontraron equipos con esa palabra clave');
            return;
        }

        // Mostrar equipos encontrados
        console.log('Equipos que contienen la palabra clave:');
        equiposConPalabraClave.forEach((equipo, index) => {
            console.log(`  ${index + 1}. ${equipo.nombre} (${equipo.categoria || 'Sin categoría'}) - ID: ${equipo._id}`);
        });

        // 2. Obtener los IDs de los equipos a eliminar
        const equipoIds = equiposConPalabraClave.map(e => e._id);

        // 3. Buscar usuarios que tengan estos equipos en su array de equipos
        const usuariosAfectados = await Usuario.find({
            'equipos.equipo': { $in: equipoIds }
        }).populate('equipos.equipo', 'nombre categoria');

        console.log(`\n👥 Usuarios afectados: ${usuariosAfectados.length}`);

        if (usuariosAfectados.length > 0) {
            console.log('Usuarios que tienen estos equipos:');
            usuariosAfectados.forEach((usuario, index) => {
                console.log(`  ${index + 1}. ${usuario.nombre || usuario.email} (${usuario.documento})`);
                
                // Mostrar qué equipos tiene el usuario que serán eliminados
                // Filtrar primero los equipos que no son null (por si hay referencias huérfanas)
                const equiposAEliminar = usuario.equipos.filter(e => 
                    e.equipo && // 🔥 AGREGADO: Verificar que equipo no sea null
                    equipoIds.some(id => id.toString() === e.equipo._id.toString())
                );
                
                equiposAEliminar.forEach(eq => {
                    console.log(`     - Equipo: ${eq.equipo.nombre} (Número: ${eq.numero || 'Sin número'})`);
                });

                // 🔥 NUEVO: Detectar y reportar referencias huérfanas
                const referenciasHuerfanas = usuario.equipos.filter(e => !e.equipo);
                if (referenciasHuerfanas.length > 0) {
                    console.log(`     ⚠️  Referencias huérfanas detectadas: ${referenciasHuerfanas.length}`);
                }
            });
        }

        // 4. Mostrar resumen
        console.log('\n📊 RESUMEN DE LIMPIEZA:');
        console.log(`- Equipos a eliminar: ${equiposConPalabraClave.length}`);
        console.log(`- Usuarios afectados: ${usuariosAfectados.length}`);

        // Contar total de registros de equipos en usuarios que se eliminarán
        let totalRegistrosEquipos = 0;
        let totalReferenciasHuerfanas = 0;
        usuariosAfectados.forEach(usuario => {
            const equiposAEliminar = usuario.equipos.filter(e => 
                e.equipo && // 🔥 AGREGADO: Verificar que equipo no sea null
                equipoIds.some(id => id.toString() === e.equipo._id.toString())
            );
            totalRegistrosEquipos += equiposAEliminar.length;

            // 🔥 NUEVO: Contar referencias huérfanas
            const referenciasHuerfanas = usuario.equipos.filter(e => !e.equipo);
            totalReferenciasHuerfanas += referenciasHuerfanas.length;
        });
        
        console.log(`- Registros de equipos en usuarios a eliminar: ${totalRegistrosEquipos}`);
        if (totalReferenciasHuerfanas > 0) {
            console.log(`⚠️  Referencias huérfanas detectadas: ${totalReferenciasHuerfanas}`);
        }

        if (dryRun) {
            console.log('\n⚠️  MODO PRUEBA - No se eliminó nada');
            console.log('Para ejecutar la eliminación real, usa: --execute');
            return {
                equipos: equiposConPalabraClave.length,
                usuarios: usuariosAfectados.length,
                registrosEquipos: totalRegistrosEquipos
            };
        }

        // 5. Ejecutar eliminaciones (solo si no es dry run)
        console.log('\n🚨 INICIANDO LIMPIEZA REAL...');

        // 5.1. Eliminar equipos de los arrays de usuarios
        let usuariosActualizados = 0;
        let referenciasHuerfanasLimpiadas = 0;
        
        for (const usuario of usuariosAfectados) {
            // Filtrar el array de equipos, removiendo los que coinciden con los IDs a eliminar
            const equiposOriginales = usuario.equipos.length;
            
            // 🔥 MEJORADO: Remover tanto los equipos objetivo como las referencias huérfanas
            usuario.equipos = usuario.equipos.filter(e => {
                // Si el equipo es null (referencia huérfana), también lo removemos
                if (!e.equipo) {
                    referenciasHuerfanasLimpiadas++;
                    return false;
                }
                // Si el equipo está en la lista de IDs a eliminar, lo removemos
                return !equipoIds.some(id => id.toString() === e.equipo._id.toString());
            });
            
            if (equiposOriginales !== usuario.equipos.length) {
                await usuario.save();
                usuariosActualizados++;
                const equiposRemovidos = equiposOriginales - usuario.equipos.length;
                console.log(`  ✅ Actualizado usuario: ${usuario.nombre || usuario.email} (${equiposRemovidos} registros removidos)`);
            }
        }

        console.log(`✅ Usuarios actualizados: ${usuariosActualizados}`);
        if (referenciasHuerfanasLimpiadas > 0) {
            console.log(`🧹 Referencias huérfanas limpiadas: ${referenciasHuerfanasLimpiadas}`);
        }

        // 5.2. Eliminar los equipos
        const deletedEquipos = await Equipo.deleteMany({ _id: { $in: equipoIds } });
        console.log(`✅ Equipos eliminados: ${deletedEquipos.deletedCount}`);

        console.log('\n🎉 Limpieza completada exitosamente');

        return {
            equipos: deletedEquipos.deletedCount,
            usuarios: usuariosActualizados,
            registrosEquipos: totalRegistrosEquipos,
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
        console.log('node cleanup-teams-by-keyword.js <palabra_clave> [--execute]');
        console.log('\nEjemplos:');
        console.log('node cleanup-teams-by-keyword.js "test"              # Modo prueba');
        console.log('node cleanup-teams-by-keyword.js "prueba" --execute  # Ejecutar eliminación');
        console.log('node cleanup-teams-by-keyword.js "demo"              # Buscar equipos con "demo"');
        console.log('\nNOTA: La búsqueda no distingue entre mayúsculas y minúsculas');
        process.exit(0);
    }

    const keyword = args[0];
    const execute = args.includes('--execute');

    // Validar que la palabra clave no esté vacía
    if (!keyword || keyword.trim().length === 0) {
        console.error('❌ La palabra clave no puede estar vacía');
        process.exit(1);
    }

    // Validar que la palabra clave tenga al menos 2 caracteres para evitar eliminaciones masivas accidentales
    if (keyword.trim().length < 2) {
        console.error('❌ La palabra clave debe tener al menos 2 caracteres para evitar eliminaciones accidentales');
        process.exit(1);
    }

    await connectDB();

    try {
        const result = await cleanupTeamsByKeyword(keyword.trim(), !execute);
        
        if (!execute && result) {
            console.log('\n🔄 Para ejecutar la eliminación real:');
            console.log(`node cleanup-teams-by-keyword.js "${keyword}" --execute`);
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

module.exports = { cleanupTeamsByKeyword };