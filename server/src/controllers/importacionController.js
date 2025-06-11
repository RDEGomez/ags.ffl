// 📁 server/src/controllers/importacionController.js - MODIFICADO PARA NÚMEROS DE JUGADORES
const Papa = require('papaparse');
const Partido = require('../models/Partido');
const Equipo = require('../models/Equipo');
const Torneo = require('../models/Torneo');
const Usuario = require('../models/Usuario');
const Arbitro = require('../models/Arbitro');
const { validationResult } = require('express-validator');

// 📝 Función de logging mejorado para producción
const logWithContext = (level, message, context = {}) => {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    level,
    message,
    ...context
  };
  
  if (level === 'ERROR') {
    console.error(`[${timestamp}] ❌ ${message}`, context);
  } else if (level === 'WARN') {
    console.warn(`[${timestamp}] ⚠️ ${message}`, context);
  } else {
    console.log(`[${timestamp}] ✅ ${message}`, context);
  }
};

// 🔧 Función para procesar CSV desde buffer
const procesarCSV = async (file) => {
  return new Promise((resolve, reject) => {
    const fileContent = file.buffer.toString('utf8');
    
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.log('⚠️ Errores en CSV:', results.errors);
        }
        resolve(results.data);
      },
      error: (error) => {
        reject(new Error(`Error al parsear CSV: ${error.message}`));
      }
    });
  });
};

// 🗺️ Función para detectar mapeo automático de campos
const detectarMapeoAutomatico = (headers) => {
  const mappings = {};
  
  const camposEsperados = {
    equipo_local: ['equipo_local', 'local', 'home', 'casa', 'home_team'],
    equipo_visitante: ['equipo_visitante', 'visitante', 'away', 'visita', 'away_team'],
    torneo: ['torneo', 'tournament', 'liga', 'league', 'championship'],
    fecha_hora: ['fecha_hora', 'fecha', 'date', 'datetime', 'when', 'hora', 'fechahora'],
    categoria: ['categoria', 'category', 'division', 'clase'],
    sede_nombre: ['sede_nombre', 'sede', 'venue', 'lugar', 'campo', 'stadium'],
    sede_direccion: ['sede_direccion', 'direccion', 'address', 'ubicacion'],
    arbitro_principal: ['arbitro_principal', 'arbitro', 'referee', 'juez'],
    estado: ['estado', 'status', 'state'],
    marcador_local: ['marcador_local', 'goles_local', 'puntos_casa', 'score_home'],
    marcador_visitante: ['marcador_visitante', 'goles_visitante', 'puntos_visita', 'score_away'],
    observaciones: ['observaciones', 'notas', 'comments', 'notes'],
    duracion_minutos: ['duracion_minutos', 'duracion', 'duration', 'minutos']
  };
  
  Object.entries(camposEsperados).forEach(([campo, alternativas]) => {
    const header = headers.find(h => {
      const headerNormalizado = h.toLowerCase().replace(/[_\s-]/g, '');
      return alternativas.some(alt => 
        headerNormalizado === alt.replace(/[_\s-]/g, '') ||
        headerNormalizado.includes(alt.replace(/[_\s-]/g, '')) ||
        alt.replace(/[_\s-]/g, '').includes(headerNormalizado)
      );
    });
    
    if (header) {
      mappings[campo] = header;
    }
  });
  
  return mappings;
};

// 🔥 NUEVO: Helper para buscar jugador por número y equipo (REEMPLAZA buscarJugadorPorNombre)
const buscarJugadorPorNumero = async (numeroJugador, equipoId) => {
  if (!numeroJugador) throw new Error('Número de jugador requerido');
  
  // Convertir a número y validar
  const numero = parseInt(numeroJugador);
  if (isNaN(numero) || numero <= 0) {
    throw new Error(`Número de jugador inválido: "${numeroJugador}". Debe ser un número positivo.`);
  }
  
  console.log(`🔍 Buscando jugador #${numero} en equipo ${equipoId}`);
  
  // Buscar usuario que pertenezca al equipo específico con el número dado
  const usuario = await Usuario.findOne({
    'equipos.equipo': equipoId,
    'equipos.numero': numero
  });
  
  if (!usuario) {
    throw new Error(`Jugador #${numero} no encontrado en el equipo especificado. Verifica que el número esté registrado correctamente.`);
  }
  
  console.log(`✅ Jugador encontrado: #${numero} - ${usuario.nombre}`);
  return usuario;
};

// 🔥 MANTENEMOS LAS FUNCIONES ORIGINALES PARA PARTIDOS (sin cambios)
const buscarEquipoPorNombreYCategoria = async (nombreEquipo, categoria = null) => {
  if (!nombreEquipo) throw new Error('Nombre de equipo requerido');
  
  const nombreLimpio = nombreEquipo.trim();
  console.log(`🔍 Buscando equipo: "${nombreLimpio}"${categoria ? ` en categoría: ${categoria}` : ''}`);
  
  let query = {
    nombre: { $regex: nombreLimpio, $options: 'i' },
    estado: 'activo'
  };
  
  if (categoria) {
    query.categoria = categoria;
  }
  
  const equipos = await Equipo.find(query);
  
  if (equipos.length === 0) {
    throw new Error(
      `Equipo "${nombreEquipo}"${categoria ? ` en categoría "${categoria}"` : ''} no encontrado. ` +
      `Verifica que esté registrado en el sistema.`);
  }
  
  if (equipos.length > 1) {
    const categoriasDisponibles = equipos.map(e => `${e.nombre} (${e.categoria})`).join(', ');
    throw new Error(
      `Se encontraron ${equipos.length} equipos con nombre similar: [${categoriasDisponibles}]. ` +
      `Especifica la categoría en tu CSV para una búsqueda más precisa.`
    );
  }
  
  const equipo = equipos[0];
  console.log(`✅ Equipo encontrado (único): ${equipo.nombre} - ${equipo.categoria}`);
  return equipo;
};

const buscarTorneoPorNombre = async (nombreTorneo) => {
  if (!nombreTorneo) throw new Error('Nombre de torneo requerido');
  
  const nombreLimpio = nombreTorneo.trim();
  
  let torneo = await Torneo.findOne({ 
    nombre: { $regex: `^${nombreLimpio}$`, $options: 'i' }
  });
  
  if (!torneo) {
    torneo = await Torneo.findOne({
      nombre: { $regex: nombreLimpio, $options: 'i' }
    });
  }
  
  if (!torneo) {
    throw new Error(`Torneo "${nombreTorneo}" no encontrado. Crea el torneo primero o verifica el nombre.`);
  }
  
  return torneo;
};

const buscarArbitroPorNombre = async (nombreArbitro) => {
  if (!nombreArbitro) return null;
  
  const nombreLimpio = nombreArbitro.trim();
  
  const usuario = await Usuario.findOne({
    nombre: { $regex: nombreLimpio, $options: 'i' },
    rol: 'arbitro'
  });
  
  if (!usuario) return null;
  
  const arbitro = await Arbitro.findOne({ usuario: usuario._id })
    .populate('usuario', 'nombre email');
  
  return arbitro;
};

// 🔥 FUNCIÓN MODIFICADA: Validación previa para detectar posibles conflictos
const validarEquiposEnCSV = async (csvData, mappings) => {
  console.log('🔍 Validando equipos en CSV para detectar posibles conflictos...');
  
  const equiposEnCSV = new Set();
  const conflictosPotenciales = [];
  
  csvData.forEach((fila, index) => {
    const equipoLocal = fila[mappings.equipo_local];
    const equipoVisitante = fila[mappings.equipo_visitante];
    const categoria = fila[mappings.categoria];
    
    if (equipoLocal) {
      equiposEnCSV.add({
        nombre: equipoLocal.trim(),
        categoria: categoria ? categoria.trim() : null,
        fila: index + 2
      });
    }
    
    if (equipoVisitante) {
      equiposEnCSV.add({
        nombre: equipoVisitante.trim(),
        categoria: categoria ? categoria.trim() : null,
        fila: index + 2
      });
    }
  });
  
  for (const equipoCSV of equiposEnCSV) {
    try {
      await buscarEquipoPorNombreYCategoria(equipoCSV.nombre, equipoCSV.categoria);
    } catch (error) {
      if (error.message.includes('Se encontraron') && error.message.includes('equipos con nombre similar')) {
        const equiposEncontrados = await Equipo.find({
          nombre: { $regex: equipoCSV.nombre, $options: 'i' },
          estado: 'activo'
        });
        
        conflictosPotenciales.push({
          nombreCSV: equipoCSV.nombre,
          categoriaCSV: equipoCSV.categoria,
          filaCSV: equipoCSV.fila,
          equiposEncontrados: equiposEncontrados.map(e => ({
            nombre: e.nombre,
            categoria: e.categoria
          }))
        });
      }
    }
  }
  
  return conflictosPotenciales;
};

// 🎯 IMPORTAR PARTIDOS MASIVAMENTE (sin cambios - mantiene nombres)
exports.importarPartidos = async (req, res) => {
  const timestamp = new Date().toISOString();
  
  logWithContext('INFO', 'INICIO - Importación masiva de partidos', {
    usuario: req.usuario._id,
    archivo: req.file?.originalname,
    tamaño: req.file?.size
  });
  
  try {
    if (!req.file) {
      return res.status(400).json({ mensaje: 'No se proporcionó archivo CSV' });
    }

    const data = await procesarCSV(req.file);

    logWithContext('INFO', 'Procesando archivo CSV', {
      filas: data?.length || 0,
      usuario: req.usuario._id
    });
    
    if (!data || data.length === 0) {
      return res.status(400).json({ mensaje: 'El archivo CSV está vacío o no tiene datos válidos' });
    }

    console.log(`📊 Procesando ${data.length} filas de datos`);

    const headers = Object.keys(data[0] || {});
    const mappings = detectarMapeoAutomatico(headers);
    
    console.log('🗺️ Mapeo detectado:', mappings);

    console.log('🔍 Ejecutando validación previa de equipos...');
    const conflictosPotenciales = await validarEquiposEnCSV(data, mappings);
    
    if (conflictosPotenciales.length > 0) {
      console.log(`⚠️ Detectados ${conflictosPotenciales.length} conflictos potenciales de equipos`);
      
      return res.status(400).json({
        mensaje: 'Detectados conflictos de equipos con nombres similares',
        conflictos: conflictosPotenciales,
        sugerencia: 'Incluye la columna "categoria" en tu CSV para resolver ambigüedades, o revisa los nombres de equipos.',
        detalles: conflictosPotenciales.map(conflicto => ({
          problema: `Equipo "${conflicto.nombreCSV}" en fila ${conflicto.filaCSV}`,
          opciones: conflicto.equiposEncontrados.map(e => `${e.nombre} (${e.categoria})`).join(', '),
          solucion: conflicto.categoriaCSV 
            ? `Categoría especificada: ${conflicto.categoriaCSV}` 
            : 'Agregar columna "categoria" al CSV'
        }))
      });
    }

    const resultados = {
      exitosos: [],
      errores: [],
      warnings: [],
      estadisticas: {
        total: data.length,
        procesados: 0,
        creados: 0,
        errores: 0
      }
    };

    // Procesar cada fila del CSV (lógica de partidos sin cambios)
    for (let i = 0; i < data.length; i++) {
      const fila = data[i];
      const numeroFila = i + 2;
      
      try {
        console.log(`\n🔄 Procesando fila ${numeroFila}:`, fila);

        const camposRequeridos = ['equipo_local', 'equipo_visitante', 'torneo', 'fecha_hora'];
        const camposFaltantes = camposRequeridos.filter(campo => !fila[mappings[campo]]);
        
        if (camposFaltantes.length > 0) {
          throw new Error(`Campos requeridos faltantes: ${camposFaltantes.join(', ')}`);
        }

        const categoria = fila[mappings.categoria] || null;
        
        console.log(`🔍 Buscando equipos con categoría: ${categoria || 'NO ESPECIFICADA'}`);
        
        const equipoLocal = await buscarEquipoPorNombreYCategoria(
          fila[mappings.equipo_local], 
          categoria
        );
        
        const equipoVisitante = await buscarEquipoPorNombreYCategoria(
          fila[mappings.equipo_visitante], 
          categoria
        );

        if (equipoLocal._id.toString() === equipoVisitante._id.toString()) {
          throw new Error('Un equipo no puede jugar contra sí mismo');
        }

        if (equipoLocal.categoria !== equipoVisitante.categoria) {
          throw new Error(
            `Los equipos deben ser de la misma categoría. ` +
            `${equipoLocal.nombre}: ${equipoLocal.categoria}, ` +
            `${equipoVisitante.nombre}: ${equipoVisitante.categoria}. ` +
            `${categoria ? `Categoría especificada en CSV: ${categoria}` : 'Considera agregar la columna "categoria" al CSV.'}`
          );
        }

        const categoriaFinal = categoria || equipoLocal.categoria;
        
        if (!categoria && equipoLocal.categoria === equipoVisitante.categoria) {
          resultados.warnings.push({
            fila: numeroFila,
            mensaje: `Categoría auto-detectada como "${equipoLocal.categoria}" basada en los equipos`,
            datos: fila
          });
        }

        console.log(`🏆 Buscando torneo: "${fila[mappings.torneo]}"`);
        const torneo = await buscarTorneoPorNombre(fila[mappings.torneo]);

        let arbitro = null;
        if (fila[mappings.arbitro_principal]) {
          console.log(`⚖️ Buscando árbitro: "${fila[mappings.arbitro_principal]}"`);
          arbitro = await buscarArbitroPorNombre(fila[mappings.arbitro_principal]);
          if (!arbitro) {
            resultados.warnings.push({
              fila: numeroFila,
              mensaje: `Árbitro "${fila[mappings.arbitro_principal]}" no encontrado, se creará el partido sin árbitro`,
              datos: fila
            });
          }
        }

        const fechaHora = new Date(fila[mappings.fecha_hora]);
        if (isNaN(fechaHora.getTime())) {
          throw new Error(`Fecha inválida: "${fila[mappings.fecha_hora]}". Formato esperado: YYYY-MM-DD HH:MM`);
        }

        const estadosValidos = ['programado', 'en_curso', 'medio_tiempo', 'finalizado', 'suspendido', 'cancelado'];
        const estado = fila[mappings.estado] || 'programado';
        if (!estadosValidos.includes(estado)) {
          throw new Error(`Estado inválido: "${estado}". Estados válidos: ${estadosValidos.join(', ')}`);
        }

        const nuevoPartido = new Partido({
          equipoLocal: equipoLocal._id,
          equipoVisitante: equipoVisitante._id,
          torneo: torneo._id,
          categoria: categoriaFinal,
          fechaHora: fechaHora,
          sede: {
            nombre: fila[mappings.sede_nombre] || 'Por definir',
            direccion: fila[mappings.sede_direccion] || 'Por definir'
          },
          arbitros: {
            principal: arbitro?._id
          },
          estado: estado,
          marcador: {
            local: parseInt(fila[mappings.marcador_local]) || 0,
            visitante: parseInt(fila[mappings.marcador_visitante]) || 0
          },
          observaciones: fila[mappings.observaciones] || '',
          duracionMinutos: parseInt(fila[mappings.duracion_minutos]) || 50,
          creadoPor: req.usuario._id
        });

        await nuevoPartido.save();

        resultados.exitosos.push({
          fila: numeroFila,
          partido: `${equipoLocal.nombre} vs ${equipoVisitante.nombre}`,
          fecha: fechaHora.toISOString(),
          torneo: torneo.nombre,
          categoria: categoriaFinal,
          id: nuevoPartido._id
        });

        resultados.estadisticas.creados++;

      } catch (error) {
        resultados.errores.push({
          fila: numeroFila,
          error: error.message,
          datos: fila
        });
        resultados.estadisticas.errores++;
      }
      
      resultados.estadisticas.procesados++;
    }

    console.log('\n📊 RESUMEN DE IMPORTACIÓN DE PARTIDOS:');
    console.log(`  ✅ Exitosos: ${resultados.estadisticas.creados}`);
    console.log(`  ❌ Errores: ${resultados.estadisticas.errores}`);
    console.log(`  ⚠️ Warnings: ${resultados.warnings.length}`);

    logWithContext('INFO', 'Importación de partidos completada', {
      usuario: req.usuario._id,
      archivo: req.file.originalname,
      exitosos: resultados.estadisticas.creados,
      errores: resultados.estadisticas.errores
    });

    console.log(`✅ [${new Date().toISOString()}] FIN - Importación de partidos completada\n`);

    res.status(200).json({
      mensaje: 'Importación de partidos completada',
      resultados,
      resumen: {
        archivo: req.file.originalname,
        procesadoPor: req.usuario.nombre || req.usuario.email,
        fechaProceso: new Date().toISOString()
      }
    });

  } catch (error) {
    logWithContext('ERROR', 'ERROR en importación de partidos', {
      usuario: req.usuario._id,
      archivo: req.file?.originalname,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      mensaje: 'Error al importar partidos', 
      error: error.message 
    });
  }
};

// 🎮 FUNCIÓN MODIFICADA: IMPORTAR JUGADAS MASIVAMENTE - AHORA USA NÚMEROS
exports.importarJugadas = async (req, res) => {
  const timestamp = new Date().toISOString();
  
  logWithContext('INFO', 'INICIO - Importación masiva de jugadas', {
    usuario: req.usuario._id,
    archivo: req.file?.originalname,
    tamaño: req.file?.size
  });
  
  try {
    if (!req.file) {
      return res.status(400).json({ mensaje: 'No se proporcionó archivo CSV' });
    }

    console.log('📁 Procesando archivo CSV de jugadas...');
    const data = await procesarCSV(req.file);
    
    if (!data || data.length === 0) {
      return res.status(400).json({ mensaje: 'El archivo CSV está vacío o no tiene datos válidos' });
    }

    console.log(`📊 Procesando ${data.length} jugadas`);

    const resultados = {
      exitosos: [],
      errores: [],
      warnings: [],
      estadisticas: {
        total: data.length,
        procesados: 0,
        creados: 0,
        errores: 0
      }
    };

    // Agrupar jugadas por partido para optimizar
    const jugadasPorPartido = {};
    
    for (let i = 0; i < data.length; i++) {
      const fila = data[i];
      const numeroFila = i + 2;
      
      try {
        // 🔥 MODIFICADO: Campos requeridos ahora incluyen números en lugar de nombres
        const camposRequeridos = ['partido_id', 'tipo_jugada', 'equipo_posesion', 'numero_jugador_principal'];
        const camposFaltantes = camposRequeridos.filter(campo => !fila[campo]);
        
        if (camposFaltantes.length > 0) {
          throw new Error(`Campos requeridos faltantes: ${camposFaltantes.join(', ')}`);
        }

        const partidoId = fila.partido_id.toString();
        
        if (!jugadasPorPartido[partidoId]) {
          jugadasPorPartido[partidoId] = [];
        }
        
        jugadasPorPartido[partidoId].push({
          fila: numeroFila,
          datos: fila
        });

      } catch (error) {
        resultados.errores.push({
          fila: numeroFila,
          error: error.message,
          datos: fila
        });
        resultados.estadisticas.errores++;
      }
      
      resultados.estadisticas.procesados++;
    }

    // Procesar cada partido
    for (const [partidoId, jugadas] of Object.entries(jugadasPorPartido)) {
      try {
        console.log(`\n🏈 Procesando partido ${partidoId} con ${jugadas.length} jugadas`);
        
        const partido = await Partido.findById(partidoId)
          .populate('equipoLocal', 'nombre')
          .populate('equipoVisitante', 'nombre');
        
        if (!partido) {
          throw new Error(`Partido ${partidoId} no encontrado`);
        }

        for (const jugada of jugadas) {
          try {
            const fila = jugada.datos;
            
            // Validar equipo en posesión
            let equipoEnPosesion;
            if (fila.equipo_posesion.toLowerCase().includes(partido.equipoLocal.nombre.toLowerCase())) {
              equipoEnPosesion = partido.equipoLocal._id;
            } else if (fila.equipo_posesion.toLowerCase().includes(partido.equipoVisitante.nombre.toLowerCase())) {
              equipoEnPosesion = partido.equipoVisitante._id;
            } else {
              throw new Error(`Equipo en posesión "${fila.equipo_posesion}" no coincide con los equipos del partido`);
            }

            // 🔥 MODIFICADO: Buscar jugadores por número en lugar de nombre
            console.log(`🔍 Buscando jugador principal #${fila.numero_jugador_principal} en equipo ${equipoEnPosesion}`);
            const jugadorPrincipal = await buscarJugadorPorNumero(fila.numero_jugador_principal, equipoEnPosesion);
            
            let jugadorSecundario = null;
            if (fila.numero_jugador_secundario) {
              try {
                console.log(`🔍 Buscando jugador secundario #${fila.numero_jugador_secundario} en equipo ${equipoEnPosesion}`);
                jugadorSecundario = await buscarJugadorPorNumero(fila.numero_jugador_secundario, equipoEnPosesion);
              } catch (error) {
                // Jugador secundario es opcional, solo agregar warning
                resultados.warnings.push({
                  fila: jugada.fila,
                  mensaje: `Jugador secundario #${fila.numero_jugador_secundario} no encontrado`,
                  datos: fila
                });
              }
            }

            // Crear objeto de jugada
            const nuevaJugada = {
              numero: partido.jugadas.length + 1,
              tiempo: {
                minuto: parseInt(fila.minuto) || 0,
                segundo: parseInt(fila.segundo) || 0,
                periodo: parseInt(fila.periodo) || 1
              },
              equipoEnPosesion: equipoEnPosesion,
              tipoJugada: fila.tipo_jugada,
              descripcion: fila.descripcion || '',
              jugadorPrincipal: jugadorPrincipal._id,
              jugadorSecundario: jugadorSecundario?._id,
              resultado: {
                touchdown: fila.touchdown === 'true' || fila.touchdown === true,
                intercepcion: fila.intercepcion === 'true' || fila.intercepcion === true,
                sack: fila.sack === 'true' || fila.sack === true,
                puntos: parseInt(fila.puntos) || 0
              },
              registradoPor: req.usuario._id,
              fechaRegistro: new Date()
            };

            // Agregar jugada al partido
            partido.jugadas.push(nuevaJugada);

            resultados.exitosos.push({
              fila: jugada.fila,
              partidoId: partidoId,
              jugada: `${fila.tipo_jugada} - #${fila.numero_jugador_principal} ${jugadorPrincipal.nombre}`,
              puntos: nuevaJugada.resultado.puntos
            });

            resultados.estadisticas.creados++;

          } catch (error) {
            resultados.errores.push({
              fila: jugada.fila,
              error: error.message,
              datos: jugada.datos
            });
            resultados.estadisticas.errores++;
          }
        }

        // Guardar partido con todas las jugadas
        await partido.save();
        console.log(`✅ Partido ${partidoId} actualizado con ${jugadas.length} jugadas`);

      } catch (error) {
        console.log(`❌ Error procesando partido ${partidoId}:`, error.message);
        
        // Marcar todas las jugadas del partido como errores
        jugadas.forEach(jugada => {
          resultados.errores.push({
            fila: jugada.fila,
            error: `Error en partido: ${error.message}`,
            datos: jugada.datos
          });
          resultados.estadisticas.errores++;
        });
      }
    }

    console.log('\n📊 RESUMEN DE IMPORTACIÓN DE JUGADAS:');
    console.log(`  ✅ Exitosos: ${resultados.estadisticas.creados}`);
    console.log(`  ❌ Errores: ${resultados.estadisticas.errores}`);
    console.log(`  ⚠️ Warnings: ${resultados.warnings.length}`);

    logWithContext('INFO', 'Importación de jugadas completada', {
      usuario: req.usuario._id,
      archivo: req.file.originalname,
      exitosos: resultados.estadisticas.creados,
      errores: resultados.estadisticas.errores,
      partidosProcesados: Object.keys(jugadasPorPartido).length
    });

    console.log(`✅ [${new Date().toISOString()}] FIN - Importación de jugadas completada\n`);

    res.status(200).json({
      mensaje: 'Importación de jugadas completada',
      resultados,
      resumen: {
        archivo: req.file.originalname,
        procesadoPor: req.usuario.nombre || req.usuario.email,
        fechaProceso: new Date().toISOString()
      }
    });

  } catch (error) {
    logWithContext('ERROR', 'ERROR en importación de jugadas', {
      usuario: req.usuario._id,
      archivo: req.file?.originalname,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      mensaje: 'Error al importar jugadas', 
      error: error.message 
    });
  }
};

// 📋 FUNCIÓN MODIFICADA: DESCARGAR PLANTILLAS CSV - AHORA USA NÚMEROS
exports.descargarPlantilla = async (req, res) => {
  try {
    const { tipo } = req.params;
    
    let csvContent = '';
    let filename = '';
    
    switch (tipo) {
      case 'partidos':
        // Plantilla de partidos sin cambios (sigue usando nombres de equipos)
        csvContent = `equipo_local,equipo_visitante,torneo,categoria,fecha_hora,sede_nombre,sede_direccion,arbitro_principal,estado,marcador_local,marcador_visitante,observaciones,duracion_minutos
Tigres,Leones,Copa Primavera,mixgold,2024-03-15 16:00,Campo Central,Av. Principal 123,Juan Pérez,finalizado,21,14,Partido emocionante,50
Águilas,Pumas,Copa Primavera,mixgold,2024-03-16 18:00,Campo Norte,Calle Secundaria 456,María López,programado,0,0,,50
Halcones,Lobos,Liga Regular,varsilv,2024-03-17 16:30,Campo Sur,Blvd. Deportivo 789,Carlos Ruiz,finalizado,14,7,Gran defensa,50
Panteras,Jaguares,Copa Primavera,femgold,2024-03-18 15:00,Campo Central,Av. Principal 123,Ana García,programado,0,0,Clásico femenil,50`;
        filename = 'plantilla_partidos.csv';
        break;
        
      case 'jugadas':
        // 🔥 MODIFICADO: Plantilla de jugadas ahora usa números en lugar de nombres
        csvContent = `partido_id,minuto,segundo,periodo,equipo_posesion,tipo_jugada,numero_jugador_principal,numero_jugador_secundario,descripcion,puntos,touchdown,intercepcion,sack
64f7b123abc456def789,5,30,1,Tigres,pase_completo,12,25,Pase de 15 yardas,0,false,false,false
64f7b123abc456def789,6,45,1,Tigres,touchdown,25,,Corrida para TD,6,true,false,false
64f7b123abc456def789,7,12,1,Leones,intercepcion,8,,Intercepción en zona roja,0,false,true,false
64f7b123abc456def789,8,30,1,Tigres,conversion_1pt,10,,Conversión de 1 punto,1,false,false,false
64f7b123abc456def789,12,15,2,Leones,sack,92,,Sack del QB,0,false,false,true`;
        filename = 'plantilla_jugadas.csv';
        break;
        
      default:
        return res.status(400).json({ mensaje: 'Tipo de plantilla no válido' });
    }
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
    
  } catch (error) {
    console.error('Error al generar plantilla:', error);
    res.status(500).json({ mensaje: 'Error al generar plantilla', error: error.message });
  }
};

// 🔥 FUNCIÓN HELPER: Obtener información de equipos y categorías
exports.obtenerInfoEquiposYCategorias = async (req, res) => {
  try {
    console.log('📊 Obteniendo información de equipos y categorías...');
    
    // Obtener todos los equipos agrupados por categoría
    const equiposPorCategoria = await Equipo.aggregate([
      {
        $match: { estado: 'activo' }
      },
      {
        $group: {
          _id: '$categoria',
          equipos: {
            $push: {
              id: '$_id',
              nombre: '$nombre',
              imagen: '$imagen'
            }
          },
          total: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Obtener estadísticas generales
    const estadisticas = {
      totalEquipos: await Equipo.countDocuments({ estado: 'activo' }),
      categorias: equiposPorCategoria.map(cat => ({
        categoria: cat._id,
        equipos: cat.total,
        nombres: cat.equipos.map(e => e.nombre)
      }))
    };
    
    console.log('✅ Información obtenida exitosamente');
    
    res.status(200).json({
      mensaje: 'Información de equipos y categorías obtenida',
      datos: {
        equiposPorCategoria,
        estadisticas,
        recomendaciones: [
          'Incluye la columna "categoria" en tu CSV para evitar ambigüedades',
          'Verifica que los nombres de equipos coincidan exactamente',
          'Los equipos deben estar activos en el sistema'
        ]
      }
    });
    
  } catch (error) {
    console.error('Error al obtener información:', error);
    res.status(500).json({
      mensaje: 'Error al obtener información de equipos',
      error: error.message
    });
  }
};

// 🔥 FUNCIÓN ADICIONAL: Obtener progreso de importación (placeholder para futuras implementaciones)
exports.obtenerProgresoImportacion = async (req, res) => {
  try {
    const { procesoId } = req.params;
    
    // Placeholder - en el futuro se podría implementar con Redis o WebSockets
    res.status(200).json({
      mensaje: 'Funcionalidad de progreso en desarrollo',
      procesoId,
      estado: 'no_implementado',
      sugerencia: 'Usa las respuestas síncronas por ahora'
    });
    
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener progreso',
      error: error.message
    });
  }
};

// 🔥 FUNCIÓN ADICIONAL: Validar archivo CSV sin procesar (preview)
exports.validarArchivoCSV = async (req, res) => {
  try {
    const { tipo } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ mensaje: 'No se proporcionó archivo CSV' });
    }

    console.log(`🔍 Validando archivo CSV de tipo: ${tipo}`);
    
    const data = await procesarCSV(req.file);
    
    if (!data || data.length === 0) {
      return res.status(400).json({ 
        mensaje: 'El archivo CSV está vacío o no tiene datos válidos',
        valido: false
      });
    }

    const headers = Object.keys(data[0] || {});
    
    // Definir campos esperados según el tipo
    const camposEsperados = {
      partidos: [
        { key: 'equipo_local', required: true, description: 'Nombre del equipo local' },
        { key: 'equipo_visitante', required: true, description: 'Nombre del equipo visitante' },
        { key: 'torneo', required: true, description: 'Nombre del torneo' },
        { key: 'fecha_hora', required: true, description: 'Fecha y hora del partido' },
        { key: 'categoria', required: false, description: 'Categoría de los equipos' },
        { key: 'sede_nombre', required: false, description: 'Nombre de la sede' },
        { key: 'sede_direccion', required: false, description: 'Dirección de la sede' },
        { key: 'arbitro_principal', required: false, description: 'Nombre del árbitro principal' },
        { key: 'estado', required: false, description: 'Estado del partido' },
        { key: 'marcador_local', required: false, description: 'Marcador del equipo local' },
        { key: 'marcador_visitante', required: false, description: 'Marcador del equipo visitante' },
        { key: 'observaciones', required: false, description: 'Observaciones del partido' },
        { key: 'duracion_minutos', required: false, description: 'Duración en minutos' }
      ],
      jugadas: [
        { key: 'partido_id', required: true, description: 'ID del partido' },
        { key: 'minuto', required: false, description: 'Minuto de la jugada' },
        { key: 'segundo', required: false, description: 'Segundo de la jugada' },
        { key: 'periodo', required: false, description: 'Período del juego' },
        { key: 'equipo_posesion', required: true, description: 'Equipo en posesión' },
        { key: 'tipo_jugada', required: true, description: 'Tipo de jugada' },
        { key: 'numero_jugador_principal', required: true, description: 'Número del jugador principal' },
        { key: 'numero_jugador_secundario', required: false, description: 'Número del jugador secundario' },
        { key: 'descripcion', required: false, description: 'Descripción de la jugada' },
        { key: 'puntos', required: false, description: 'Puntos obtenidos' },
        { key: 'touchdown', required: false, description: 'Es touchdown (true/false)' },
        { key: 'intercepcion', required: false, description: 'Es intercepción (true/false)' },
        { key: 'sack', required: false, description: 'Es sack (true/false)' }
      ]
    };

    const campos = camposEsperados[tipo] || camposEsperados.partidos;

    // Validar estructura
    const camposRequeridos = campos.filter(c => c.required).map(c => c.key);
    const camposFaltantes = camposRequeridos.filter(campo => !headers.includes(campo));
    const camposExtra = headers.filter(header => !campos.find(c => c.key === header));

    // Análisis de datos
    const analisis = {
      archivo: {
        nombre: req.file.originalname,
        tamaño: `${Math.round(req.file.size / 1024)}KB`,
        tipo: req.file.mimetype
      },
      estructura: {
        filas: data.length,
        columnas: headers.length,
        headers: headers
      },
      validacion: {
        camposFaltantes: camposFaltantes,
        camposExtra: camposExtra,
        erroresEstructura: []
      },
      preview: data.slice(0, 5), // Primeras 5 filas como preview
      mapeoCampos: campos
    };

    // Agregar errores de estructura
    if (camposFaltantes.length > 0) {
      analisis.validacion.erroresEstructura.push({
        tipo: 'error',
        mensaje: `Campos requeridos faltantes: ${camposFaltantes.join(', ')}`
      });
    }

    if (camposExtra.length > 0) {
      analisis.validacion.erroresEstructura.push({
        tipo: 'warning',
        mensaje: `Campos adicionales encontrados: ${camposExtra.join(', ')} (serán ignorados)`
      });
    }

    if (data.length === 0) {
      analisis.validacion.erroresEstructura.push({
        tipo: 'error',
        mensaje: 'El archivo no contiene datos válidos'
      });
    }

    // Determinar si se puede procesar
    const puedeImportar = camposFaltantes.length === 0 && data.length > 0;

    console.log('✅ Validación completada');
    console.log(`  📊 Filas: ${data.length}`);
    console.log(`  📋 Columnas: ${headers.length}`);
    console.log(`  ❌ Errores estructura: ${analisis.validacion.erroresEstructura.length}`);
    console.log(`  ✅ Puede importar: ${puedeImportar}`);

    res.status(200).json({
      mensaje: 'Validación completada',
      valido: puedeImportar,
      analisis,
      recomendaciones: puedeImportar 
        ? ['El archivo está listo para importar']
        : ['Corrige los errores antes de importar', 'Verifica que todos los campos requeridos estén presentes']
    });

  } catch (error) {
    console.error('Error al validar archivo:', error);
    res.status(500).json({
      mensaje: 'Error al validar archivo CSV',
      error: error.message,
      valido: false
    });
  }
};