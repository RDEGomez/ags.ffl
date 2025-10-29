// 🚀 Script para generar 464 partidos de muestra
// Ejecutar desde la raíz del proyecto: node scripts/generar_partidos_muestra.js

const mongoose = require('mongoose');
require('dotenv').config();

// Importar modelos
const Equipo = require('../src/models/Equipo');
const Torneo = require('../src/models/Torneo');
const Partido = require('../src/models/Partido');
const Usuario = require('../src/models/Usuario');

// 🔧 CONFIGURACIÓN
const CONFIG = {
  // Cambiar estos valores según tus necesidades
  TORNEO_NOMBRE: 'Jurassic Season',
  USUARIO_ADMIN_EMAIL: 'daniel_cacho@hotmail.com', // Email de un usuario admin existente
  
  // MODO DE GENERACIÓN:
  // 'todos_contra_todos' = cada equipo juega contra cada otro UNA vez
  // 'partidos_unicos' = intentar X partidos por equipo evitando duplicados
  MODO_GENERACION: 'todos_contra_todos', // Recomendado para evitar duplicados
  
  ENCUENTROS_POR_EQUIPO: 8, // Solo usado en modo 'partidos_unicos'
  DURACION_PARTIDO: 50,
  
  // Fechas del torneo (próximos 3 meses)
  FECHA_INICIO: new Date(),
  FECHA_FIN: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 días
  
  // Horarios disponibles
  HORARIOS: ['20:00', '21:00', '22:00'],
  
  // Sedes disponibles
  SEDES: [
    'IT'
  ]
};

// 🎯 FUNCIÓN PRINCIPAL
async function generarPartidosMuestra() {
  try {
    console.log('🚀 INICIO - Generador de Partidos de Muestra');
    console.log('================================================');
    
    // 1. Conectar a la base de datos
    await conectarDB();
    
    // 2. Verificar/crear torneo
    const torneo = await verificarOCrearTorneo();
    
    // 3. Obtener usuario administrador
    const usuarioAdmin = await obtenerUsuarioAdmin();
    
    // 4. Obtener equipos por categoría
    const equiposPorCategoria = await obtenerEquiposPorCategoria();
    
    // 5. Generar partidos para cada categoría
    let totalPartidosCreados = 0;
    
    for (const [categoria, equipos] of Object.entries(equiposPorCategoria)) {
      console.log(`\n⚽ Generando partidos para ${categoria.toUpperCase()} (${equipos.length} equipos)...`);
      
      const partidosCategoria = await generarPartidosCategoria(
        equipos, 
        categoria, 
        torneo._id, 
        usuarioAdmin._id
      );
      
      totalPartidosCreados += partidosCategoria;
      console.log(`  ✅ ${partidosCategoria} partidos creados`);
    }
    
    // 6. Resumen final
    console.log('\n🎉 ¡PROCESO COMPLETADO!');
    console.log('========================');
    console.log(`📊 Total de partidos creados: ${totalPartidosCreados}`);
    console.log(`🏆 Torneo: ${torneo.nombre} (ID: ${torneo._id})`);
    console.log(`📅 Fechas: ${CONFIG.FECHA_INICIO.toLocaleDateString()} - ${CONFIG.FECHA_FIN.toLocaleDateString()}`);
    
    // Mostrar distribución por categoría
    console.log('\n📋 Distribución por categoría:');
    for (const [categoria, equipos] of Object.entries(equiposPorCategoria)) {
      let partidosEsperados;
      if (CONFIG.MODO_GENERACION === 'todos_contra_todos') {
        // n equipos = n*(n-1)/2 partidos únicos
        partidosEsperados = (equipos.length * (equipos.length - 1)) / 2;
      } else {
        partidosEsperados = equipos.length * CONFIG.ENCUENTROS_POR_EQUIPO;
      }
      console.log(`  ${categoria}: ~${partidosEsperados} partidos (${equipos.length} equipos)`);
    }
    
    // 7. Obtener IDs de algunos partidos creados para las jugadas
    await mostrarPartidosEjemplo(torneo._id);
    
  } catch (error) {
    console.error('❌ ERROR en el proceso:', error);
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

// 🏆 VERIFICAR O CREAR TORNEO
async function verificarOCrearTorneo() {
  console.log('\n🔍 Verificando torneo...');
  
  let torneo = await Torneo.findOne({ nombre: CONFIG.TORNEO_NOMBRE });
  
  if (torneo) {
    console.log(`✅ Torneo encontrado: ${torneo.nombre} (ID: ${torneo._id})`);
    return torneo;
  }
  
  console.log('🆕 Creando nuevo torneo...');
  torneo = new Torneo({
    nombre: CONFIG.TORNEO_NOMBRE,
    fechaInicio: CONFIG.FECHA_INICIO,
    fechaFin: CONFIG.FECHA_FIN,
    categorias: ['mixgold', 'mixsilv', 'vargold', 'varsilv', 'femgold', 'femsilv', 'varmast', 'femmast', 'tocho7v7', 'u8', 'u10', 'u12fem', 'u12var', 'u14fem', 'u14var', 'u16fem', 'u16var', 'u17fem', 'u17var', 'u18fem', 'u18var'],
    estado: 'activo',
    equipos: [] // Se llenará automáticamente
  });
  
  await torneo.save();
  console.log(`✅ Torneo creado: ${torneo.nombre} (ID: ${torneo._id})`);
  
  return torneo;
}

// 👤 OBTENER USUARIO ADMINISTRADOR
async function obtenerUsuarioAdmin() {
  console.log('\n🔍 Buscando usuario administrador...');
  
  const usuario = await Usuario.findOne({ 
    email: CONFIG.USUARIO_ADMIN_EMAIL 
  });
  
  if (!usuario) {
    throw new Error(`Usuario administrador no encontrado: ${CONFIG.USUARIO_ADMIN_EMAIL}`);
  }
  
  console.log(`✅ Usuario admin: ${usuario.nombre || usuario.email}`);
  return usuario;
}

// 🏈 OBTENER EQUIPOS POR CATEGORÍA
async function obtenerEquiposPorCategoria() {
  console.log('\n🔍 Obteniendo equipos activos...');
  
  const equipos = await Equipo.find({ estado: 'activo' });
  
  const equiposPorCategoria = {};
  
  equipos.forEach(equipo => {
    if (!equiposPorCategoria[equipo.categoria]) {
      equiposPorCategoria[equipo.categoria] = [];
    }
    equiposPorCategoria[equipo.categoria].push(equipo);
  });
  
  console.log('📊 Equipos por categoría:');
  Object.keys(equiposPorCategoria).forEach(categoria => {
    console.log(`  ${categoria}: ${equiposPorCategoria[categoria].length} equipos`);
  });
  
  return equiposPorCategoria;
}

// ⚽ GENERAR PARTIDOS PARA UNA CATEGORÍA
async function generarPartidosCategoria(equipos, categoria, torneoId, usuarioId) {
  console.log(`  📊 ${equipos.length} equipos en ${categoria}`);
  
  // OPCIÓN 1: Generar todas las combinaciones posibles (todos contra todos)
  if (CONFIG.MODO_GENERACION === 'todos_contra_todos') {
    return await generarTodosContraTodos(equipos, categoria, torneoId, usuarioId);
  }
  
  // OPCIÓN 2: Generar X partidos únicos por equipo (evitando duplicados)
  return await generarPartidosUnicos(equipos, categoria, torneoId, usuarioId);
}

// 🔄 MODO: TODOS CONTRA TODOS (cada equipo juega contra cada otro una vez)
async function generarTodosContraTodos(equipos, categoria, torneoId, usuarioId) {
  const partidos = [];
  
  // Generar combinaciones únicas (cada par solo una vez)
  for (let i = 0; i < equipos.length; i++) {
    for (let j = i + 1; j < equipos.length; j++) {
      const equipoLocal = equipos[i];
      const equipoVisitante = equipos[j];
      
      const { fechaHora, sede } = generarFechaYSede();
      
      const partido = new Partido({
        equipoLocal: equipoLocal._id,
        equipoVisitante: equipoVisitante._id,
        torneo: torneoId,
        categoria: categoria,
        fechaHora: fechaHora,
        sede: sede,
        estado: 'programado',
        duracionMinutos: CONFIG.DURACION_PARTIDO,
        creadoPor: usuarioId,
        ultimaActualizacion: {
          fecha: new Date(),
          por: usuarioId
        }
      });
      
      partidos.push(partido);
    }
  }
  
  console.log(`  🔄 Modo todos vs todos: ${partidos.length} combinaciones únicas`);
  await Partido.insertMany(partidos);
  return partidos.length;
}

// 🎯 MODO: PARTIDOS ÚNICOS POR EQUIPO (evita duplicados)
async function generarPartidosUnicos(equipos, categoria, torneoId, usuarioId) {
  const partidos = [];
  const partidosGenerados = new Set(); // Para evitar duplicados
  
  // Para cada equipo, intentar generar los partidos solicitados
  for (const equipoLocal of equipos) {
    const equiposRivales = equipos.filter(e => e._id.toString() !== equipoLocal._id.toString());
    let partidosEquipo = 0;
    let intentos = 0;
    const maxIntentos = CONFIG.ENCUENTROS_POR_EQUIPO * 3; // Límite de intentos
    
    while (partidosEquipo < CONFIG.ENCUENTROS_POR_EQUIPO && intentos < maxIntentos) {
      const equipoVisitante = equiposRivales[Math.floor(Math.random() * equiposRivales.length)];
      
      // Crear clave única para el emparejamiento (menor ID primero)
      const id1 = equipoLocal._id.toString();
      const id2 = equipoVisitante._id.toString();
      const clavePartido = id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
      
      // Verificar si ya existe este emparejamiento
      if (!partidosGenerados.has(clavePartido)) {
        partidosGenerados.add(clavePartido);
        
        const { fechaHora, sede } = generarFechaYSede();
        
        const partido = new Partido({
          equipoLocal: equipoLocal._id,
          equipoVisitante: equipoVisitante._id,
          torneo: torneoId,
          categoria: categoria,
          fechaHora: fechaHora,
          sede: sede,
          estado: 'programado',
          duracionMinutos: CONFIG.DURACION_PARTIDO,
          creadoPor: usuarioId,
          ultimaActualizacion: {
            fecha: new Date(),
            por: usuarioId
          }
        });
        
        partidos.push(partido);
        partidosEquipo++;
      }
      
      intentos++;
    }
    
    if (partidosEquipo < CONFIG.ENCUENTROS_POR_EQUIPO) {
      console.log(`  ⚠️  ${equipoLocal.nombre}: solo ${partidosEquipo}/${CONFIG.ENCUENTROS_POR_EQUIPO} partidos (rivales limitados)`);
    }
  }
  
  console.log(`  🎯 Modo únicos: ${partidos.length} partidos sin duplicados`);
  await Partido.insertMany(partidos);
  return partidos.length;
}

// 📅 GENERAR FECHA Y SEDE ALEATORIA
function generarFechaYSede() {
  // Fecha aleatoria entre inicio y fin del torneo
  const inicioTime = CONFIG.FECHA_INICIO.getTime();
  const finTime = CONFIG.FECHA_FIN.getTime();
  const fechaAleatoria = new Date(inicioTime + Math.random() * (finTime - inicioTime));
  
  // Hora aleatoria
  const horaAleatoria = CONFIG.HORARIOS[Math.floor(Math.random() * CONFIG.HORARIOS.length)];
  
  // Combinar fecha y hora
  const [hora, minutos] = horaAleatoria.split(':');
  fechaAleatoria.setHours(parseInt(hora), parseInt(minutos), 0, 0);
  
  // Sede aleatoria
  const sede = CONFIG.SEDES[Math.floor(Math.random() * CONFIG.SEDES.length)];
  
  return { fechaHora: fechaAleatoria, sede };
}

// 📋 MOSTRAR PARTIDOS DE EJEMPLO
async function mostrarPartidosEjemplo(torneoId) {
  console.log('\n📋 Primeros 10 partidos creados (para generar jugadas):');
  console.log('=======================================================');
  
  const partidosEjemplo = await Partido.find({ torneo: torneoId })
    .populate('equipoLocal', 'nombre categoria')
    .populate('equipoVisitante', 'nombre categoria')
    .limit(10)
    .sort({ fechaHora: 1 });
  
  partidosEjemplo.forEach((partido, index) => {
    console.log(`${index + 1}. ID: ${partido._id}`);
    console.log(`   ${partido.equipoLocal.nombre} vs ${partido.equipoVisitante.nombre}`);
    console.log(`   Categoría: ${partido.categoria}`);
    console.log(`   Fecha: ${partido.fechaHora.toLocaleString()}`);
    console.log(`   Sede: ${partido.sede}`);
    console.log('');
  });
  
  console.log('💡 Usa estos IDs para generar jugadas de muestra');
}

// 🎬 FUNCIÓN DE LIMPIEZA (OPCIONAL)
async function limpiarPartidosExistentes() {
  console.log('\n🧹 Limpiando partidos existentes del torneo...');
  
  const torneo = await Torneo.findOne({ nombre: CONFIG.TORNEO_NOMBRE });
  
  if (torneo) {
    const resultado = await Partido.deleteMany({ 
      torneo: torneo._id,
      estado: 'programado' // Solo eliminar los programados
    });
    
    console.log(`✅ ${resultado.deletedCount} partidos eliminados`);
  }
}

// 🚀 EJECUTAR SCRIPT
if (require.main === module) {
  // Uncomment la siguiente línea si quieres limpiar partidos existentes primero
  // await limpiarPartidosExistentes();
  
  generarPartidosMuestra();
}

module.exports = {
  generarPartidosMuestra,
  limpiarPartidosExistentes
};

/*
📖 INSTRUCCIONES DE USO:

1. Guardar este archivo como: scripts/generar_partidos_muestra.js

2. Configurar variables en CONFIG:
   - USUARIO_ADMIN_EMAIL: Email de un usuario admin existente
   - TORNEO_NOMBRE: Nombre del torneo a crear/usar
   - Ajustar fechas, horarios y sedes según necesites

3. Ejecutar desde la raíz del proyecto:
   node scripts/generar_partidos_muestra.js

4. El script:
   ✅ Conecta a tu base de datos
   ✅ Crea/verifica el torneo
   ✅ Obtiene todos los equipos activos
   ✅ Genera 8 partidos por equipo en cada categoría
   ✅ Asigna fechas, horarios y sedes aleatorias
   ✅ Muestra IDs de partidos para las jugadas

5. Resultado esperado:
   📊 464 partidos totales
   📋 IDs de partidos listos para generar jugadas

⚠️  IMPORTANTE: 
- Ajusta USUARIO_ADMIN_EMAIL con un email real de tu sistema
- El script respeta los equipos y categorías existentes
- Los partidos se crean en estado 'programado'
*/