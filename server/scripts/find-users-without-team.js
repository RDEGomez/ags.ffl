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
const Usuario = require('../src/models/Usuario');

async function findUsersWithoutTeams(dryRun = true) {
    console.log(`\n🔍 ${dryRun ? 'MODO CONSULTA' : 'EJECUTANDO ELIMINACIÓN'} - Buscar usuarios sin equipos`);
    console.log('=' + '='.repeat(70));

    try {
        // 1. Obtener estadísticas generales de usuarios
        const totalUsuarios = await Usuario.countDocuments();
        console.log(`\n📊 Total de usuarios en la base de datos: ${totalUsuarios}`);

        if (totalUsuarios === 0) {
            console.log('❌ No se encontraron usuarios en la base de datos');
            return;
        }

        // 2. Contar usuarios por rol
        const usuariosPorRol = await Usuario.aggregate([
            {
                $group: {
                    _id: '$rol',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        console.log('\n📈 Usuarios por rol:');
        usuariosPorRol.forEach(rolData => {
            console.log(`  ${rolData._id}: ${rolData.count}`);
        });

        // 3. Buscar usuarios sin equipos
        // Incluimos usuarios que:
        // - Tienen array de equipos vacío
        // - O no tienen el campo equipos
        // - O tienen equipos con referencias null/undefined
        const usuariosSinEquipos = await Usuario.find({
            $or: [
                { equipos: { $exists: false } },
                { equipos: { $size: 0 } },
                { equipos: null },
                { equipos: [] }
            ]
        });

        // 4. También buscar usuarios que tienen equipos pero con referencias inválidas/null
        const usuariosConEquiposInvalidos = await Usuario.find({
            'equipos.0': { $exists: true },
            'equipos.equipo': null
        });

        // 5. Combinar ambos resultados
        const todosUsuariosSinEquiposValidos = [...usuariosSinEquipos, ...usuariosConEquiposInvalidos];
        
        // Remover duplicados por ID
        const usuariosUnicos = todosUsuariosSinEquiposValidos.filter((usuario, index, self) => 
            index === self.findIndex(u => u._id.toString() === usuario._id.toString())
        );

        console.log(`\n🚫 Usuarios sin equipos válidos: ${usuariosUnicos.length}`);

        if (usuariosUnicos.length === 0) {
            console.log('✅ Todos los usuarios tienen equipos asignados.');
            return {
                totalUsuarios,
                usuariosSinEquipos: 0,
                usuariosPorRol: usuariosPorRol.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {})
            };
        }

        // 6. Agrupar usuarios sin equipos por rol
        const usuariosSinEquiposPorRol = {};
        usuariosUnicos.forEach(usuario => {
            const rol = usuario.rol || 'sin_rol';
            if (!usuariosSinEquiposPorRol[rol]) {
                usuariosSinEquiposPorRol[rol] = [];
            }
            usuariosSinEquiposPorRol[rol].push(usuario);
        });

        console.log('\nUsuarios sin equipos por rol:');
        Object.keys(usuariosSinEquiposPorRol).forEach(rol => {
            console.log(`\n👤 ${rol.toUpperCase()} (${usuariosSinEquiposPorRol[rol].length} usuarios):`);
            usuariosSinEquiposPorRol[rol].forEach((usuario, index) => {
                const nombre = usuario.nombre || 'Sin nombre';
                const email = usuario.email || 'Sin email';
                const documento = usuario.documento || 'Sin documento';
                const fechaCreacion = usuario.createdAt ? new Date(usuario.createdAt).toLocaleDateString() : 'Fecha desconocida';
                
                console.log(`  ${index + 1}. ${nombre}`);
                console.log(`     Email: ${email}`);
                console.log(`     Documento: ${documento}`);
                console.log(`     Creado: ${fechaCreacion}`);
                console.log(`     ID: ${usuario._id}`);
                
                // Verificar si tiene equipos con referencias inválidas
                if (usuario.equipos && usuario.equipos.length > 0) {
                    const equiposInvalidos = usuario.equipos.filter(e => !e.equipo);
                    if (equiposInvalidos.length > 0) {
                        console.log(`     ⚠️  Referencias inválidas: ${equiposInvalidos.length}`);
                    }
                }
                console.log('');
            });
        });

        // 7. Mostrar resumen detallado
        console.log('\n📊 RESUMEN DETALLADO:');
        console.log(`- Total de usuarios: ${totalUsuarios}`);
        console.log(`- Usuarios con equipos válidos: ${totalUsuarios - usuariosUnicos.length}`);
        console.log(`- Usuarios sin equipos: ${usuariosSinEquipos.length}`);
        console.log(`- Usuarios con referencias inválidas: ${usuariosConEquiposInvalidos.length}`);
        console.log(`- Total usuarios problemáticos: ${usuariosUnicos.length}`);

        // 8. Identificar candidatos para eliminación (solo jugadores y capitanes)
        const candidatosEliminacion = usuariosUnicos.filter(usuario => 
            ['jugador', 'capitan'].includes(usuario.rol)
        );

        console.log(`\n🎯 CANDIDATOS PARA ELIMINACIÓN:`);
        console.log(`- Usuarios que pueden eliminarse: ${candidatosEliminacion.length}`);
        console.log(`- Usuarios a conservar (admin/arbitro): ${usuariosUnicos.length - candidatosEliminacion.length}`);

        if (dryRun) {
            console.log('\n⚠️  MODO CONSULTA - Solo mostrando información');
            console.log('Para eliminar solo jugadores/capitanes sin equipos, usa: --execute');
            console.log('Para eliminar TODOS los usuarios sin equipos, usa: --execute-all');
            return {
                totalUsuarios,
                usuariosSinEquipos: usuariosUnicos.length,
                candidatosEliminacion: candidatosEliminacion.length,
                usuariosPorRol: usuariosSinEquiposPorRol
            };
        }

        // 9. Ejecutar eliminación (solo si no es dry run)
        console.log('\n🚨 INICIANDO ELIMINACIÓN...');

        const deletedUsuarios = await Usuario.deleteMany({ 
            _id: { $in: candidatosEliminacion.map(u => u._id) }
        });

        console.log(`✅ Usuarios eliminados: ${deletedUsuarios.deletedCount}`);

        // 10. Mostrar estadísticas finales
        const usuariosRestantes = await Usuario.countDocuments();
        console.log(`\n📈 ESTADÍSTICAS FINALES:`);
        console.log(`- Usuarios restantes en la base de datos: ${usuariosRestantes}`);
        console.log(`- Usuarios eliminados: ${deletedUsuarios.deletedCount}`);

        return {
            totalUsuarios,
            usuariosSinEquipos: usuariosUnicos.length,
            candidatosEliminacion: candidatosEliminacion.length,
            usuariosEliminados: deletedUsuarios.deletedCount,
            usuariosRestantes,
            executed: true
        };

    } catch (error) {
        console.error('❌ Error durante la búsqueda:', error);
        throw error;
    }
}

async function deleteAllUsersWithoutTeams(usuariosUnicos) {
    console.log('\n🚨 ELIMINANDO TODOS LOS USUARIOS SIN EQUIPOS (INCLUYENDO ADMIN/ARBITRO)...');
    
    const deletedUsuarios = await Usuario.deleteMany({ 
        _id: { $in: usuariosUnicos.map(u => u._id) }
    });

    console.log(`✅ Usuarios eliminados: ${deletedUsuarios.deletedCount}`);
    return deletedUsuarios.deletedCount;
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--help')) {
        console.log('\n📋 USO DEL SCRIPT:');
        console.log('node find-users-without-teams.js [opciones]');
        console.log('\nOpciones:');
        console.log('  (sin argumentos)  # Modo consulta - solo muestra información');
        console.log('  --execute         # Elimina solo jugadores/capitanes sin equipos');
        console.log('  --execute-all     # Elimina TODOS los usuarios sin equipos');
        console.log('  --help           # Muestra esta ayuda');
        console.log('\nEjemplos:');
        console.log('node find-users-without-teams.js                    # Solo consulta');
        console.log('node find-users-without-teams.js --execute          # Eliminar jugadores sin equipos');
        console.log('node find-users-without-teams.js --execute-all      # Eliminar todos');
        console.log('\nDescripción:');
        console.log('Encuentra usuarios que no tienen equipos asignados.');
        console.log('Útil después de limpiar equipos huérfanos.');
        process.exit(0);
    }

    const execute = args.includes('--execute');
    const executeAll = args.includes('--execute-all');

    if (execute && executeAll) {
        console.error('❌ No puedes usar --execute y --execute-all al mismo tiempo');
        process.exit(1);
    }

    await connectDB();

    try {
        if (executeAll) {
            // Primero obtener la lista en modo consulta
            const consultaResult = await findUsersWithoutTeams(true);
            
            if (consultaResult && consultaResult.usuariosSinEquipos > 0) {
                // Obtener usuarios únicos nuevamente para eliminación completa
                const usuariosSinEquipos = await Usuario.find({
                    $or: [
                        { equipos: { $exists: false } },
                        { equipos: { $size: 0 } },
                        { equipos: null },
                        { equipos: [] }
                    ]
                });

                const usuariosConEquiposInvalidos = await Usuario.find({
                    'equipos.0': { $exists: true },
                    'equipos.equipo': null
                });

                const todosUsuariosSinEquiposValidos = [...usuariosSinEquipos, ...usuariosConEquiposInvalidos];
                const usuariosUnicos = todosUsuariosSinEquiposValidos.filter((usuario, index, self) => 
                    index === self.findIndex(u => u._id.toString() === usuario._id.toString())
                );

                const eliminados = await deleteAllUsersWithoutTeams(usuariosUnicos);
                console.log(`\n🎉 Eliminación completa exitosa. Usuarios eliminados: ${eliminados}`);
            }
        } else {
            const result = await findUsersWithoutTeams(!execute);
            
            if (!execute && result && result.usuariosSinEquipos > 0) {
                console.log('\n🔄 Opciones para continuar:');
                console.log('node find-users-without-teams.js --execute     # Eliminar solo jugadores/capitanes');
                console.log('node find-users-without-teams.js --execute-all # Eliminar todos los usuarios sin equipos');
            }
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

module.exports = { findUsersWithoutTeams };