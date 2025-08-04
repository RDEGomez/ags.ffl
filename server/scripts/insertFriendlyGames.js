// 🧪 SCRIPT DE PRUEBA AUTOMÁTICO: Partidos con Equipos Aleatorios
// Ejecutar en MongoDB Compass o mongosh

print("🚀 Iniciando script de partidos de prueba automático...\n");

// 🔥 PASO 1: Buscar torneo activo automáticamente
print("🔍 Buscando torneo activo...");
const torneo = db.torneos.findOne({estado: "activo"}) || db.torneos.findOne();

if (!torneo) {
  print("❌ ERROR: No se encontró ningún torneo. Crea un torneo primero.");
  quit();
}

print(`✅ Torneo encontrado: "${torneo.nombre}" (${torneo._id})`);

// 🔥 PASO 2: Buscar equipos por categorías automáticamente
print("\n🔍 Buscando equipos disponibles por categorías...");

const categorias = ['mixgold', 'mixsilv', 'vargold', 'varsilv', 'femgold', 'femsilv'];
let equiposDisponibles = [];
let categoriaSeleccionada = null;

for (const categoria of categorias) {
  const equiposCategoria = db.equipos.find({
    categoria: categoria,
    estado: 'activo'
  }).toArray();
  
  if (equiposCategoria.length >= 4) {
    equiposDisponibles = equiposCategoria;
    categoriaSeleccionada = categoria;
    print(`✅ Usando categoría: ${categoria} (${equiposCategoria.length} equipos disponibles)`);
    break;
  }
}

if (equiposDisponibles.length < 4) {
  print("❌ ERROR: Se necesitan al menos 4 equipos activos en la misma categoría.");
  print("📋 Equipos por categoría encontrados:");
  
  categorias.forEach(cat => {
    const count = db.equipos.countDocuments({categoria: cat, estado: 'activo'});
    print(`   ${cat}: ${count} equipos`);
  });
  
  quit();
}

// 🔥 PASO 3: Seleccionar 4 equipos aleatorios
const equiposSeleccionados = [];
const indicesUsados = new Set();

while (equiposSeleccionados.length < 4) {
  const indiceAleatorio = Math.floor(Math.random() * equiposDisponibles.length);
  if (!indicesUsados.has(indiceAleatorio)) {
    indicesUsados.add(indiceAleatorio);
    equiposSeleccionados.push(equiposDisponibles[indiceAleatorio]);
  }
}

print("\n🏈 Equipos seleccionados:");
equiposSeleccionados.forEach((equipo, index) => {
  print(`   ${index + 1}. ${equipo.nombre} (${equipo._id})`);
});

// 🔥 PASO 4: Crear partidos con diferentes combinaciones
const fechaBase = new Date();
const partidosPrueba = [
  // 🟢 CASO 1: OFICIAL para ambos equipos
  {
    equipoLocal: equiposSeleccionados[0]._id,
    equipoVisitante: equiposSeleccionados[1]._id,
    torneo: torneo._id,
    categoria: categoriaSeleccionada,
    fechaHora: new Date(fechaBase.getTime() + (1 * 24 * 60 * 60 * 1000)), // +1 día
    estado: "finalizado",
    tipoPartido: "oficial", // OFICIAL para ambos
    marcador: { 
      local: Math.floor(Math.random() * 35) + 7,    // 7-41 puntos
      visitante: Math.floor(Math.random() * 35) + 7  // 7-41 puntos
    },
    sede: {
      nombre: "Campo Central",
      direccion: "Av. Principal 123"
    },
    jugadas: [
      {
        numero: 1,
        tiempo: { minuto: 5, segundo: 30, periodo: 1 },
        equipoEnPosesion: equiposSeleccionados[0]._id,
        tipoJugada: "pase_completo",
        descripcion: "Pase completo de 15 yardas",
        resultado: { touchdown: false, puntos: 0 }
      },
      {
        numero: 2,
        tiempo: { minuto: 12, segundo: 45, periodo: 1 },
        equipoEnPosesion: equiposSeleccionados[0]._id,
        tipoJugada: "pase_completo",
        descripcion: "Touchdown por pase",
        resultado: { touchdown: true, puntos: 6 }
      },
      {
        numero: 3,
        tiempo: { minuto: 8, segundo: 20, periodo: 2 },
        equipoEnPosesion: equiposSeleccionados[1]._id,
        tipoJugada: "corrida",
        descripcion: "Touchdown por corrida",
        resultado: { touchdown: true, puntos: 6 }
      }
    ],
    observaciones: "🟢 Partido OFICIAL para ambos equipos",
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // 🟡 CASO 2: OFICIAL para equipo local, AMISTOSO para visitante
  {
    equipoLocal: equiposSeleccionados[0]._id,
    equipoVisitante: equiposSeleccionados[2]._id,
    torneo: torneo._id,
    categoria: categoriaSeleccionada,
    fechaHora: new Date(fechaBase.getTime() + (2 * 24 * 60 * 60 * 1000)), // +2 días
    estado: "finalizado",
    tipoPartido: "oficial", // Será OFICIAL para local, AMISTOSO para visitante
    marcador: { 
      local: Math.floor(Math.random() * 28) + 14,    // 14-41 puntos
      visitante: Math.floor(Math.random() * 42) + 7   // 7-48 puntos
    },
    sede: {
      nombre: "Campo Norte",
      direccion: "Av. Deportiva 456"
    },
    jugadas: [
      {
        numero: 1,
        tiempo: { minuto: 3, segundo: 15, periodo: 1 },
        equipoEnPosesion: equiposSeleccionados[2]._id,
        tipoJugada: "corrida",
        descripcion: "Corrida de 25 yardas",
        resultado: { touchdown: false, puntos: 0 }
      },
      {
        numero: 2,
        tiempo: { minuto: 8, segundo: 20, periodo: 1 },
        equipoEnPosesion: equiposSeleccionados[2]._id,
        tipoJugada: "pase_completo",
        descripcion: "Touchdown por pase largo",
        resultado: { touchdown: true, puntos: 6 }
      },
      {
        numero: 3,
        tiempo: { minuto: 15, segundo: 10, periodo: 1 },
        equipoEnPosesion: equiposSeleccionados[0]._id,
        tipoJugada: "intercepcion",
        descripcion: "Intercepción defensiva",
        resultado: { touchdown: false, puntos: 0 }
      }
    ],
    observaciones: "🟡 OFICIAL para local, AMISTOSO para visitante",
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // 🟡 CASO 3: AMISTOSO para equipo local, OFICIAL para visitante  
  {
    equipoLocal: equiposSeleccionados[1]._id,
    equipoVisitante: equiposSeleccionados[3]._id,
    torneo: torneo._id,
    categoria: categoriaSeleccionada,
    fechaHora: new Date(fechaBase.getTime() + (3 * 24 * 60 * 60 * 1000)), // +3 días
    estado: "finalizado",
    tipoPartido: "oficial", // Será AMISTOSO para local, OFICIAL para visitante
    marcador: { 
      local: Math.floor(Math.random() * 21) + 0,     // 0-20 puntos
      visitante: Math.floor(Math.random() * 35) + 21  // 21-55 puntos
    },
    sede: {
      nombre: "Campo Sur",
      direccion: "Av. Los Deportes 789"
    },
    jugadas: [
      {
        numero: 1,
        tiempo: { minuto: 2, segundo: 10, periodo: 1 },
        equipoEnPosesion: equiposSeleccionados[3]._id,
        tipoJugada: "intercepcion",
        descripcion: "Intercepción y regreso",
        resultado: { touchdown: false, puntos: 0 }
      },
      {
        numero: 2,
        tiempo: { minuto: 15, segundo: 5, periodo: 2 },
        equipoEnPosesion: equiposSeleccionados[3]._id,
        tipoJugada: "pase_completo",
        descripcion: "Pase de touchdown",
        resultado: { touchdown: true, puntos: 6 }
      },
      {
        numero: 3,
        tiempo: { minuto: 10, segundo: 30, periodo: 2 },
        equipoEnPosesion: equiposSeleccionados[1]._id,
        tipoJugada: "sack",
        descripcion: "Sack de 12 yardas",
        resultado: { touchdown: false, puntos: 0 }
      }
    ],
    observaciones: "🟡 AMISTOSO para local, OFICIAL para visitante",
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // 🔴 CASO 4: AMISTOSO para ambos equipos
  {
    equipoLocal: equiposSeleccionados[2]._id,
    equipoVisitante: equiposSeleccionados[3]._id,
    torneo: torneo._id,
    categoria: categoriaSeleccionada,
    fechaHora: new Date(fechaBase.getTime() + (4 * 24 * 60 * 60 * 1000)), // +4 días
    estado: "finalizado",
    tipoPartido: "amistoso", // AMISTOSO para ambos
    marcador: { 
      local: Math.floor(Math.random() * 28) + 14,    // 14-41 puntos
      visitante: Math.floor(Math.random() * 28) + 14  // 14-41 puntos
    },
    sede: {
      nombre: "Campo de Entrenamiento",
      direccion: "Complejo Deportivo 321"
    },
    jugadas: [
      {
        numero: 1,
        tiempo: { minuto: 6, segundo: 25, periodo: 1 },
        equipoEnPosesion: equiposSeleccionados[2]._id,
        tipoJugada: "sack",
        descripcion: "Sack de 8 yardas",
        resultado: { touchdown: false, puntos: 0 }
      },
      {
        numero: 2,
        tiempo: { minuto: 11, segundo: 40, periodo: 1 },
        equipoEnPosesion: equiposSeleccionados[3]._id,
        tipoJugada: "tackleo",
        descripcion: "Tackleo en línea de scrimmage",
        resultado: { touchdown: false, puntos: 0 }
      },
      {
        numero: 3,
        tiempo: { minuto: 5, segundo: 15, periodo: 2 },
        equipoEnPosesion: equiposSeleccionados[2]._id,
        tipoJugada: "conversion_2pt",
        descripcion: "Conversión de 2 puntos exitosa",
        resultado: { touchdown: false, puntos: 2 }
      }
    ],
    observaciones: "🔴 Partido AMISTOSO para ambos equipos",
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // 🟢 CASO 5: Otro OFICIAL para validar múltiples oficiales
  {
    equipoLocal: equiposSeleccionados[1]._id,
    equipoVisitante: equiposSeleccionados[2]._id,
    torneo: torneo._id,
    categoria: categoriaSeleccionada,
    fechaHora: new Date(fechaBase.getTime() + (5 * 24 * 60 * 60 * 1000)), // +5 días
    estado: "finalizado",
    tipoPartido: "oficial", // OFICIAL para ambos
    marcador: { 
      local: Math.floor(Math.random() * 42) + 14,    // 14-55 puntos
      visitante: Math.floor(Math.random() * 35) + 7   // 7-41 puntos
    },
    sede: {
      nombre: "Estadio Principal",
      direccion: "Plaza Central 555"
    },
    jugadas: [
      {
        numero: 1,
        tiempo: { minuto: 4, segundo: 50, periodo: 1 },
        equipoEnPosesion: equiposSeleccionados[1]._id,
        tipoJugada: "conversion_2pt",
        descripcion: "Conversión de 2 puntos exitosa",
        resultado: { touchdown: false, puntos: 2 }
      },
      {
        numero: 2,
        tiempo: { minuto: 9, segundo: 35, periodo: 2 },
        equipoEnPosesion: equiposSeleccionados[2]._id,
        tipoJugada: "tackleo",
        descripcion: "Tackleo tras pérdida de 3 yardas",
        resultado: { touchdown: false, puntos: 0 }
      }
    ],
    observaciones: "🟢 Segundo partido OFICIAL para validar múltiples",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// 🔥 PASO 5: Insertar partidos y mostrar resumen
print("\n📝 Insertando partidos de prueba...");
const resultadoInsercion = db.partidos.insertMany(partidosPrueba);

// 🔥 PASO 6: Mostrar resumen detallado
print("\n🎯 ========== RESUMEN DE PARTIDOS INSERTADOS ==========");
print(`✅ Total partidos creados: ${resultadoInsercion.insertedIds.length}`);
print(`🏆 Torneo: ${torneo.nombre}`);
print(`📂 Categoría: ${categoriaSeleccionada}`);
print(`👥 Equipos involucrados: ${equiposSeleccionados.length}`);

print("\n📋 EQUIPOS PARTICIPANTES:");
equiposSeleccionados.forEach((equipo, index) => {
  print(`   ${index + 1}. ${equipo.nombre} (${equipo._id})`);
});

print("\n📋 DETALLES POR PARTIDO:\n");

// Obtener los partidos insertados
const partidosInsertados = db.partidos.find({
  _id: { $in: resultadoInsercion.insertedIds }
}).sort({fechaHora: 1}).toArray();

partidosInsertados.forEach((partido, index) => {
  const equipoLocal = equiposSeleccionados.find(e => e._id.toString() === partido.equipoLocal.toString());
  const equipoVisitante = equiposSeleccionados.find(e => e._id.toString() === partido.equipoVisitante.toString());
  
  print(`🏈 PARTIDO ${index + 1}:`);
  print(`   📅 Fecha: ${partido.fechaHora.toISOString().split('T')[0]}`);
  print(`   🏠 Local: ${equipoLocal.nombre}`);
  print(`   ✈️  Visitante: ${equipoVisitante.nombre}`);
  print(`   📊 Marcador: ${partido.marcador.local} - ${partido.marcador.visitante}`);
  print(`   🎲 tipoPartido: "${partido.tipoPartido}"`);
  print(`   🏟️ Sede: ${partido.sede.nombre}`);
  
  // 🔥 MOSTRAR CÓMO SE INTERPRETA PARA CADA EQUIPO SEGÚN LAS REGLAS
  print(`   📋 INTERPRETACIÓN SEGÚN REGLAS DEL FILTRADO:`);
  
  if (partido.tipoPartido === "oficial") {
    print(`      🟢 Para ${equipoLocal.nombre}: OFICIAL (partido.esOficialPara() = true)`);
    print(`      🟢 Para ${equipoVisitante.nombre}: OFICIAL (partido.esOficialPara() = true)`);
  } else if (partido.tipoPartido === "amistoso") {
    print(`      🔴 Para ${equipoLocal.nombre}: AMISTOSO (partido.esOficialPara() = false)`);
    print(`      🔴 Para ${equipoVisitante.nombre}: AMISTOSO (partido.esOficialPara() = false)`);
  }
  
  print(`   💬 Observación: ${partido.observaciones}`);
  print(`   🎮 Jugadas creadas: ${partido.jugadas.length}`);
  print(`   🆔 ID: ${partido._id}`);
  print("   " + "─".repeat(60));
});

print("\n🔍 ========== VALIDACIÓN DE TIPOS ==========");
const oficiales = db.partidos.countDocuments({
  _id: { $in: resultadoInsercion.insertedIds },
  tipoPartido: 'oficial'
});
const amistosos = db.partidos.countDocuments({
  _id: { $in: resultadoInsercion.insertedIds },
  tipoPartido: 'amistoso'
});

print(`🟢 Partidos OFICIALES insertados: ${oficiales}`);
print(`🔴 Partidos AMISTOSOS insertados: ${amistosos}`);

print("\n📊 COMANDOS DE VALIDACIÓN:");
print("// Ver todos los partidos insertados:");
print(`db.partidos.find({_id: {$in: [${resultadoInsercion.insertedIds.map(id => `ObjectId("${id}")`).join(', ')}]}}, {equipoLocal: 1, equipoVisitante: 1, tipoPartido: 1, marcador: 1}).pretty();\n`);

print("// Probar el filtrado con tu API usando estos IDs:");
equiposSeleccionados.forEach((equipo, index) => {
  print(`// Equipo ${index + 1} (${equipo.nombre}): ${equipo._id}`);
});
print(`// Torneo: ${torneo._id}`);
print(`// Categoría: ${categoriaSeleccionada}\n`);

print("🎯 ========== CASOS DE PRUEBA CREADOS ==========");
print("✅ Caso 1: Ambos equipos - OFICIAL");
print("✅ Caso 2: Local OFICIAL, Visitante AMISTOSO");
print("✅ Caso 3: Local AMISTOSO, Visitante OFICIAL");
print("✅ Caso 4: Ambos equipos - AMISTOSO");
print("✅ Caso 5: Ambos equipos - OFICIAL (validación múltiple)");

print("\n🧪 ========== PRUEBAS SUGERIDAS ==========");
print("1. Probar estadísticas de cada equipo individualmente");
print("2. Verificar que los partidos amistosos se excluyen correctamente");
print("3. Validar que los logs muestran partidos excluidos");
print("4. Comparar estadísticas antes/después del filtrado");

print("\n🧹 ========== COMANDO DE LIMPIEZA ==========");
print("Para ELIMINAR estos partidos de prueba después:");
print(`db.partidos.deleteMany({_id: {$in: [${resultadoInsercion.insertedIds.map(id => `ObjectId("${id}")`).join(', ')}]}});`);

print("\n🚀 ¡Partidos de prueba con equipos aleatorios insertados exitosamente!");
print("📋 Revisa los logs de tu API al llamar las funciones de estadísticas para ver el filtrado en acción.");