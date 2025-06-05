// 📁 server/src/controllers/importacionController.js
const Papa = require('papaparse');
const Partido = require('../models/Partido');
const Equipo = require('../models/Equipo');
const Torneo = require('../models/Torneo');
const Usuario = require('../models/Usuario');
const Arbitro = require('../models/Arbitro');
const { validationResult } = require('express-validator');
const { getImageUrlServer } = require('../helpers/imageUrlHelper');

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

// 🔥 Helper para procesar archivos CSV
const procesarCSV = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No se proporcionó archivo'));
    }

    const fileContent = file.buffer.toString('utf8');
    
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
      complete: (results) => {
        if (results.errors.length > 0) {
          console.log('Errores de parsing CSV:', results.errors);
        }
        resolve(results.data);
      },
      error: (error) => {
        reject(new Error(`Error al procesar CSV: ${error.message}`));
      }
    });
  });
};

// 🔍 Helper para buscar equipo por nombre (fuzzy search)
const buscarEquipoPorNombre = async (nombreEquipo) => {
  if (!nombreEquipo) throw new Error('Nombre de equipo requerido');
  
  const nombreLimpio = nombreEquipo.trim();
  
  // Búsqueda exacta primero
  let equipo = await Equipo.findOne({ 
    nombre: { $regex: `^${nombreLimpio}$`, $options: 'i' }
  });
  
  if (!equipo) {
    // Búsqueda parcial si no encuentra exacta
    equipo = await Equipo.findOne({
      nombre: { $regex: nombreLimpio, $options: 'i' }
    });
  }
  
  if (!equipo) {
    throw new Error(`Equipo "${nombreEquipo}" no encontrado. Verifica que esté registrado en el sistema.`);
  }
  
  return equipo;
};

// 🏆 Helper para buscar torneo por nombre
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

// ⚖️ Helper para buscar árbitro por nombre
const buscarArbitroPorNombre = async (nombreArbitro) => {
  if (!nombreArbitro) return null;
  
  const nombreLimpio = nombreArbitro.trim();
  
  // Buscar por nombre de usuario asociado
  const usuario = await Usuario.findOne({
    nombre: { $regex: nombreLimpio, $options: 'i' },
    rol: 'arbitro'
  });
  
  if (!usuario) return null;
  
  const arbitro = await Arbitro.findOne({ usuario: usuario._id })
    .populate('usuario', 'nombre email');
  
  return arbitro;
};

// 👥 Helper para buscar jugador por nombre y equipo
const buscarJugadorPorNombre = async (nombreJugador, equipoId) => {
  if (!nombreJugador) throw new Error('Nombre de jugador requerido');
  
  const nombreLimpio = nombreJugador.trim();
  
  // Buscar usuario que pertenezca al equipo específico
  const usuario = await Usuario.findOne({
    nombre: { $regex: nombreLimpio, $options: 'i' },
    'equipos.equipo': equipoId
  });
  
  if (!usuario) {
    throw new Error(`Jugador "${nombreJugador}" no encontrado en el equipo especificado.`);
  }
  
  return usuario;
};

// 🎯 IMPORTAR PARTIDOS MASIVAMENTE
exports.importarPartidos = async (req, res) => {
  const timestamp = new Date().toISOString();
  
  logWithContext('INFO', 'INICIO - Importación masiva de partidos', {
    usuario: req.usuario._id,
    archivo: req.file?.originalname,
    tamaño: req.file?.size
  });
  
  try {
    // Validar archivo
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

    // Procesar cada fila del CSV
    for (let i = 0; i < data.length; i++) {
      const fila = data[i];
      const numeroFila = i + 2; // +2 porque: +1 para índice base-1, +1 para header
      
      try {
        console.log(`\n🔄 Procesando fila ${numeroFila}:`, fila);

        // Validar campos requeridos
        const camposRequeridos = ['equipo_local', 'equipo_visitante', 'torneo', 'fecha_hora'];
        const camposFaltantes = camposRequeridos.filter(campo => !fila[campo]);
        
        if (camposFaltantes.length > 0) {
          throw new Error(`Campos requeridos faltantes: ${camposFaltantes.join(', ')}`);
        }

        // 1. Buscar equipos
        console.log(`🔍 Buscando equipos: "${fila.equipo_local}" vs "${fila.equipo_visitante}"`);
        const equipoLocal = await buscarEquipoPorNombre(fila.equipo_local);
        const equipoVisitante = await buscarEquipoPorNombre(fila.equipo_visitante);

        // Validar que no sea el mismo equipo
        if (equipoLocal._id.toString() === equipoVisitante._id.toString()) {
          throw new Error('Un equipo no puede jugar contra sí mismo');
        }

        // Validar que sean de la misma categoría
        if (equipoLocal.categoria !== equipoVisitante.categoria) {
          throw new Error(`Los equipos deben ser de la misma categoría. ${equipoLocal.nombre}: ${equipoLocal.categoria}, ${equipoVisitante.nombre}: ${equipoVisitante.categoria}`);
        }

        // 2. Buscar torneo
        console.log(`🏆 Buscando torneo: "${fila.torneo}"`);
        const torneo = await buscarTorneoPorNombre(fila.torneo);

        // 3. Buscar árbitro (opcional)
        let arbitro = null;
        if (fila.arbitro_principal) {
          console.log(`⚖️ Buscando árbitro: "${fila.arbitro_principal}"`);
          arbitro = await buscarArbitroPorNombre(fila.arbitro_principal);
          if (!arbitro) {
            resultados.warnings.push({
              fila: numeroFila,
              mensaje: `Árbitro "${fila.arbitro_principal}" no encontrado, se creará el partido sin árbitro`,
              datos: fila
            });
          }
        }

        // 4. Validar y formatear fecha
        const fechaHora = new Date(fila.fecha_hora);
        if (isNaN(fechaHora.getTime())) {
          throw new Error(`Fecha inválida: "${fila.fecha_hora}". Formato esperado: YYYY-MM-DD HH:MM`);
        }

        // 5. Validar estado
        const estadosValidos = ['programado', 'en_curso', 'medio_tiempo', 'finalizado', 'suspendido', 'cancelado'];
        const estado = fila.estado || 'programado';
        if (!estadosValidos.includes(estado)) {
          throw new Error(`Estado inválido: "${estado}". Estados válidos: ${estadosValidos.join(', ')}`);
        }

        // 6. Crear objeto del partido
        const partidoData = {
          equipoLocal: equipoLocal._id,
          equipoVisitante: equipoVisitante._id,
          torneo: torneo._id,
          categoria: fila.categoria || equipoLocal.categoria,
          fechaHora: fechaHora,
          estado: estado,
          duracionMinutos: parseInt(fila.duracion_minutos) || 50,
          creadoPor: req.usuario._id
        };

        // Agregar marcador si está presente
        if (fila.marcador_local !== undefined || fila.marcador_visitante !== undefined) {
          partidoData.marcador = {
            local: parseInt(fila.marcador_local) || 0,
            visitante: parseInt(fila.marcador_visitante) || 0
          };
        }

        // Agregar sede si está presente
        if (fila.sede_nombre || fila.sede_direccion) {
          partidoData.sede = {};
          if (fila.sede_nombre) partidoData.sede.nombre = fila.sede_nombre;
          if (fila.sede_direccion) partidoData.sede.direccion = fila.sede_direccion;
        }

        // Agregar árbitros si están presentes
        if (arbitro) {
          partidoData.arbitros = {
            principal: arbitro._id
          };
        }

        // Agregar observaciones si están presentes
        if (fila.observaciones) {
          partidoData.observaciones = fila.observaciones;
        }

        // 7. Crear el partido
        console.log('💾 Creando partido en base de datos...');
        const partido = new Partido(partidoData);
        await partido.save();

        console.log(`✅ Partido creado: ${partido._id}`);

        resultados.exitosos.push({
          fila: numeroFila,
          partidoId: partido._id,
          equipos: `${equipoLocal.nombre} vs ${equipoVisitante.nombre}`,
          torneo: torneo.nombre,
          fecha: fechaHora.toLocaleString('es-MX'),
          estado: estado
        });

        resultados.estadisticas.creados++;

      } catch (error) {
        console.log(`❌ Error en fila ${numeroFila}:`, error.message);
        
        resultados.errores.push({
          fila: numeroFila,
          error: error.message,
          datos: fila
        });

        resultados.estadisticas.errores++;
      }

      resultados.estadisticas.procesados++;
    }

    console.log('\n📊 RESUMEN DE IMPORTACIÓN:');
    console.log(`  ✅ Exitosos: ${resultados.estadisticas.creados}`);
    console.log(`  ❌ Errores: ${resultados.estadisticas.errores}`);
    console.log(`  ⚠️ Warnings: ${resultados.warnings.length}`);
    console.log(`  📈 Total procesado: ${resultados.estadisticas.procesados}/${resultados.estadisticas.total}`);

    // 📊 Log de éxito con métricas
    logWithContext('INFO', 'Importación de partidos completada', {
      usuario: req.usuario._id,
      archivo: req.file.originalname,
      exitosos: resultados.estadisticas.creados,
      errores: resultados.estadisticas.errores,
      duracion: `${Date.now() - Date.parse(timestamp)}ms`
    });

    console.log(`✅ [${new Date().toISOString()}] FIN - Importación completada\n`);

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

// 🎮 IMPORTAR JUGADAS MASIVAMENTE
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
        // Validar campos requeridos
        const camposRequeridos = ['partido_id', 'tipo_jugada', 'equipo_posesion', 'jugador_principal'];
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

            // Buscar jugadores
            const jugadorPrincipal = await buscarJugadorPorNombre(fila.jugador_principal, equipoEnPosesion);
            
            let jugadorSecundario = null;
            if (fila.jugador_secundario) {
              try {
                jugadorSecundario = await buscarJugadorPorNombre(fila.jugador_secundario, equipoEnPosesion);
              } catch (error) {
                // Jugador secundario es opcional, solo agregar warning
                resultados.warnings.push({
                  fila: jugada.fila,
                  mensaje: `Jugador secundario "${fila.jugador_secundario}" no encontrado`,
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
              jugada: `${fila.tipo_jugada} - ${jugadorPrincipal.nombre}`,
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

    // 📊 Log de éxito con métricas
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

// 📋 DESCARGAR PLANTILLAS CSV
exports.descargarPlantilla = async (req, res) => {
  try {
    const { tipo } = req.params;
    
    let csvContent = '';
    let filename = '';
    
    switch (tipo) {
      case 'partidos':
        csvContent = `equipo_local,equipo_visitante,torneo,categoria,fecha_hora,sede_nombre,sede_direccion,arbitro_principal,estado,marcador_local,marcador_visitante,observaciones,duracion_minutos
Tigres,Leones,Copa Primavera,mixgold,2024-03-15 16:00,Campo Central,Av. Principal 123,Juan Pérez,finalizado,21,14,Partido emocionante,50
Águilas,Pumas,Copa Primavera,mixgold,2024-03-16 18:00,Campo Norte,Calle Secundaria 456,María López,programado,0,0,,50`;
        filename = 'plantilla_partidos.csv';
        break;
        
      case 'jugadas':
        csvContent = `partido_id,minuto,segundo,periodo,equipo_posesion,tipo_jugada,jugador_principal,jugador_secundario,descripcion,puntos,touchdown,intercepcion,sack
64f7b123abc456def789,5,30,1,Tigres,pase_completo,Juan García,Pedro López,Pase de 15 yardas,0,false,false,false
64f7b123abc456def789,6,45,1,Tigres,touchdown,Pedro López,,Corrida para TD,6,true,false,false
64f7b123abc456def789,7,12,1,Leones,intercepcion,Carlos Ruiz,,Intercepción en zona roja,0,false,true,false`;
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

// 📊 OBTENER PROGRESO DE IMPORTACIÓN (para futuro uso con WebSockets)
exports.obtenerProgresoImportacion = async (req, res) => {
  try {
    const { procesoId } = req.params;
    
    // TODO: Implementar sistema de tracking de progreso
    // Por ahora, respuesta mock
    res.json({
      procesoId,
      estado: 'completado',
      progreso: {
        porcentaje: 100,
        procesados: 100,
        total: 100,
        errores: 0,
        tiempoRestante: 0
      }
    });
    
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener progreso', error: error.message });
  }
};