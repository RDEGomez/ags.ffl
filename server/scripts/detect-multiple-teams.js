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
const Usuario = require('../src/models/Usuario');
const Equipo = require('../src/models/Equipo');

async function detectarJugadoresConMultiplesEquipos() {
    console.log('\n🔍 DETECTANDO JUGADORES CON MÚLTIPLES EQUIPOS EN LA MISMA CATEGORÍA');
    console.log('=' + '='.repeat(70));

    try {
        // 1. Obtener todos los usuarios con equipos
        const usuarios = await Usuario.find({
            equipos: { $exists: true, $not: { $size: 0 } }
        }).populate('equipos.equipo', 'nombre categoria estado');

        console.log(`📊 Total usuarios con equipos: ${usuarios.length}`);

        // 2. Detectar problemas
        let usuariosConProblemas = [];
        let totalConflictos = 0;

        for (const usuario of usuarios) {
            // Filtrar equipos válidos (no null)
            const equiposValidos = usuario.equipos.filter(e => e.equipo && e.equipo._id);
            
            if (equiposValidos.length <= 1) continue; // No hay conflictos posibles

            // Agrupar por categoría
            const equiposPorCategoria = {};
            
            equiposValidos.forEach(equipoRef => {
                const categoria = equipoRef.equipo.categoria;
                
                if (!equiposPorCategoria[categoria]) {
                    equiposPorCategoria[categoria] = [];
                }
                
                equiposPorCategoria[categoria].push({
                    equipo: equipoRef.equipo,
                    numero: equipoRef.numero,
                    equipoId: equipoRef.equipo._id
                });
            });

            // Detectar categorías con múltiples equipos
            const categoriasConflictivas = Object.entries(equiposPorCategoria)
                .filter(([categoria, equipos]) => equipos.length > 1);

            if (categoriasConflictivas.length > 0) {
                usuariosConProblemas.push({
                    usuario: {
                        _id: usuario._id,
                        nombre: usuario.nombre,
                        email: usuario.email,
                        documento: usuario.documento,
                        rol: usuario.rol
                    },
                    conflictos: categoriasConflictivas.map(([categoria, equipos]) => ({
                        categoria,
                        equipos,
                        cantidad: equipos.length
                    })),
                    totalEquipos: equiposValidos.length,
                    fechaCreacion: usuario.createdAt
                });

                totalConflictos += categoriasConflictivas.reduce((sum, [cat, equipos]) => sum + equipos.length, 0);
            }
        }

        // 3. Mostrar resultados
        console.log(`\n🚨 RESULTADOS DE LA AUDITORÍA:`);
        console.log(`- Usuarios con conflictos: ${usuariosConProblemas.length}`);
        console.log(`- Total equipos en conflicto: ${totalConflictos}`);

        if (usuariosConProblemas.length === 0) {
            console.log('✅ ¡Excelente! No se encontraron jugadores con múltiples equipos en la misma categoría');
            return;
        }

        // 4. Agrupar por categoría para mejor análisis
        const conflictosPorCategoria = {};
        usuariosConProblemas.forEach(usuarioProblema => {
            usuarioProblema.conflictos.forEach(conflicto => {
                if (!conflictosPorCategoria[conflicto.categoria]) {
                    conflictosPorCategoria[conflicto.categoria] = [];
                }
                conflictosPorCategoria[conflicto.categoria].push({
                    usuario: usuarioProblema.usuario,
                    equipos: conflicto.equipos,
                    fechaCreacion: usuarioProblema.fechaCreacion
                });
            });
        });

        // 5. Mostrar reporte detallado por categoría
        console.log('\n📋 REPORTE DETALLADO POR CATEGORÍA:');
        console.log('=' + '='.repeat(70));

        Object.keys(conflictosPorCategoria).sort().forEach(categoria => {
            const conflictos = conflictosPorCategoria[categoria];
            
            console.log(`\n🏈 CATEGORÍA: ${categoria.toUpperCase()}`);
            console.log(`   Jugadores afectados: ${conflictos.length}`);
            console.log('-'.repeat(50));

            conflictos.forEach((conflicto, index) => {
                const fechaCreacion = conflicto.fechaCreacion 
                    ? new Date(conflicto.fechaCreacion).toLocaleDateString() 
                    : 'Desconocida';

                console.log(`\n   ${index + 1}. 👤 ${conflicto.usuario.nombre}`);
                console.log(`      📧 Email: ${conflicto.usuario.email}`);
                console.log(`      📄 Documento: ${conflicto.usuario.documento}`);
                console.log(`      🎭 Rol: ${conflicto.usuario.rol}`);
                console.log(`      📅 Creado: ${fechaCreacion}`);
                console.log(`      🆔 User ID: ${conflicto.usuario._id}`);
                console.log(`      \n      🏈 EQUIPOS EN CONFLICTO (${conflicto.equipos.length}):`);
                
                conflicto.equipos.forEach((equipoInfo, equipoIndex) => {
                    const estado = equipoInfo.equipo.estado || 'desconocido';
                    const estadoIcon = estado === 'activo' ? '✅' : '❌';
                    
                    console.log(`         ${equipoIndex + 1}. ${estadoIcon} ${equipoInfo.equipo.nombre}`);
                    console.log(`            - ID: ${equipoInfo.equipoId}`);
                    console.log(`            - Número: ${equipoInfo.numero || 'Sin número'}`);
                    console.log(`            - Estado: ${estado}`);
                });

                console.log(`      \n      💡 INVESTIGAR:`);
                console.log(`         - ¿En cuál equipo realmente juega actualmente?`);
                console.log(`         - ¿Cuál tiene partidos registrados en el torneo actual?`);
                console.log(`         - ¿Alguno está inactivo y se puede eliminar?`);
            });
        });

        // 6. Resumen ejecutivo
        console.log('\n' + '='.repeat(70));
        console.log('📊 RESUMEN EJECUTIVO:');
        console.log('=' + '='.repeat(70));

        // Contar equipos activos vs inactivos en conflictos
        let equiposActivosEnConflicto = 0;
        let equiposInactivosEnConflicto = 0;

        usuariosConProblemas.forEach(usuarioProblema => {
            usuarioProblema.conflictos.forEach(conflicto => {
                conflicto.equipos.forEach(equipoInfo => {
                    if (equipoInfo.equipo.estado === 'activo') {
                        equiposActivosEnConflicto++;
                    } else {
                        equiposInactivosEnConflicto++;
                    }
                });
            });
        });

        console.log(`\n📈 ESTADÍSTICAS:`);
        console.log(`   - Jugadores con conflictos: ${usuariosConProblemas.length}`);
        console.log(`   - Categorías afectadas: ${Object.keys(conflictosPorCategoria).length}`);
        console.log(`   - Equipos activos en conflicto: ${equiposActivosEnConflicto}`);
        console.log(`   - Equipos inactivos en conflicto: ${equiposInactivosEnConflicto}`);

        console.log(`\n💡 RECOMENDACIONES:`);
        if (equiposInactivosEnConflicto > 0) {
            console.log(`   1. ✅ Prioridad ALTA: Eliminar los ${equiposInactivosEnConflicto} equipos inactivos primero`);
        }
        console.log(`   2. 🔍 Investigar cada caso manualmente usando los IDs proporcionados`);
        console.log(`   3. 🏈 Verificar partidos recientes para determinar el equipo actual`);
        console.log(`   4. 📞 En caso de duda, contactar directamente al jugador`);

        console.log(`\n🛠️ PRÓXIMOS PASOS:`);
        console.log(`   1. Revisar este reporte detalladamente`);
        console.log(`   2. Decidir qué equipo conservar para cada jugador`);
        console.log(`   3. Ejecutar script de limpieza (próxima herramienta)`);
        console.log(`   4. Re-habilitar validación de múltiples equipos`);

        // 7. Generar archivo de reporte (opcional)
        const reporteData = {
            fecha: new Date().toISOString(),
            totalUsuarios: usuarios.length,
            usuariosConConflictos: usuariosConProblemas.length,
            categoriasAfectadas: Object.keys(conflictosPorCategoria),
            equiposActivosEnConflicto,
            equiposInactivosEnConflicto,
            detalleConflictos: conflictosPorCategoria
        };

        console.log(`\n💾 DATOS EXPORTABLES:`);
        console.log(`   - Estructura JSON disponible para análisis programático`);
        console.log(`   - ${usuariosConProblemas.length} casos para investigación manual`);

        return reporteData;

    } catch (error) {
        console.error('❌ Error durante la detección:', error);
        throw error;
    }
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--help')) {
        console.log('\n📋 USO DEL SCRIPT:');
        console.log('node detect-multiple-teams.js [opciones]');
        console.log('\nOpciones:');
        console.log('  (sin argumentos)  # Ejecuta el análisis completo');
        console.log('  --help           # Muestra esta ayuda');
        console.log('\nDescripción:');
        console.log('Detecta jugadores que tienen múltiples equipos en la misma categoría.');
        console.log('Proporciona información detallada para investigación manual.');
        process.exit(0);
    }

    await connectDB();

    try {
        const reporte = await detectarJugadoresConMultiplesEquipos();
        
        if (reporte && reporte.usuariosConConflictos > 0) {
            console.log(`\n🔄 SIGUIENTE: Investigar los ${reporte.usuariosConConflictos} casos encontrados`);
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

module.exports = { detectarJugadoresConMultiplesEquipos };