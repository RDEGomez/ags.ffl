// 📁 server/src/controllers/importacionController.js
const Papa = require('papaparse');
const Partido = require('../models/Partido');
const Equipo = require('../models/Equipo');
const Torneo = require('../models/Torneo');
const Usuario = require('../models/Usuario');

// 🛠️ Función helper para logging con contexto
const logWithContext = (level, message, context = {}) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${level}: ${message}`, context);
};

// 🔥 FUNCIÓN HELPER PRINCIPAL: Procesar CSV
const procesarCSV = (archivo) => {
  return new Promise((resolve, reject) => {
    const csvString = archivo.buffer.toString('utf8');
    
    console.log('📄 Procesando CSV...');
    console.log(`  📊 Tamaño: ${csvString.length} caracteres`);
    
    Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Mantener como strings para validaciones
      delimitersToGuess: [',', '\t', '|', ';'],
      transformHeader: (header) => {
        // Limpiar headers
        return header.trim().toLowerCase().replace(/\s+/g, '_');
      },
      complete: (results) => {
        console.log(`  ✅ Parseado exitoso: ${results.data.length} filas`);
        if (results.errors.length > 0) {
          console.log(`  ⚠️ Advertencias: ${results.errors.length}`);
          results.errors.forEach(error => console.log(`    - ${error.message}`));
        }
        resolve(results.data);
      },
      error: (error) => {
        console.error('❌ Error parseando CSV:', error);
        reject(new Error(`Error al procesar archivo CSV: ${error.message}`));
      }
    });
  });
};

// 🔥 FUNCIÓN HELPER PARA BUSCAR JUGADOR POR NÚMERO (como el código original)
const buscarJugadorPorNumero = (numero, equipoJugadores, tipoJugador = '') => {
  if (!numero) return { jugador: null, encontrado: false };
  
  const jugador = equipoJugadores.find(j => parseInt(j.numero) === parseInt(numero));
  const encontrado = !!jugador;
  
  if (!encontrado) {
    console.log(`❌ ${tipoJugador} #${numero} NO encontrado`);
  } else {
    console.log(`✅ ${tipoJugador} encontrado: #${jugador.numero} ${jugador.nombre}`);
  }
  
  return { jugador, encontrado };
};

// Funciones helper para partidos (sin cambios)
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
      `Especifica la categoría para evitar ambigüedades.`);
  }
  
  console.log(`✅ Equipo encontrado: ${equipos[0].nombre} - ${equipos[0].categoria}`);
  return equipos[0];
};

const buscarTorneoPorNombre = async (nombreTorneo) => {
  if (!nombreTorneo) throw new Error('Nombre de torneo requerido');
  
  const nombreLimpio = nombreTorneo.trim();
  console.log(`🔍 Buscando torneo: "${nombreLimpio}"`);
  
  const torneos = await Torneo.find({
    nombre: { $regex: nombreLimpio, $options: 'i' },
    estado: 'activo'
  });
  
  if (torneos.length === 0) {
    throw new Error(`Torneo "${nombreTorneo}" no encontrado. Verifica que esté registrado en el sistema.`);
  }
  
  if (torneos.length > 1) {
    const torneosDisponibles = torneos.map(t => `${t.nombre} (${t.categoria || 'Sin categoría'})`).join(', ');
    throw new Error(`Se encontraron ${torneos.length} torneos con nombre similar: [${torneosDisponibles}]. Usa un nombre más específico.`);
  }
  
  console.log(`✅ Torneo encontrado: ${torneos[0].nombre}`);
  return torneos[0];
};

const buscarArbitroPorNombre = async (nombreArbitro) => {
  if (!nombreArbitro) return null; // Árbitro es opcional
  
  const nombreLimpio = nombreArbitro.trim();
  console.log(`🔍 Buscando árbitro: "${nombreLimpio}"`);
  
  const arbitros = await Usuario.find({
    $or: [
      { nombre: { $regex: nombreLimpio, $options: 'i' } },
      { email: { $regex: nombreLimpio, $options: 'i' } }
    ],
    roles: 'arbitro',
    estado: 'activo'
  });
  
  if (arbitros.length === 0) {
    console.log(`⚠️ Árbitro "${nombreArbitro}" no encontrado, continuando sin árbitro`);
    return null;
  }
  
  if (arbitros.length > 1) {
    console.log(`⚠️ Se encontraron ${arbitros.length} árbitros similares, usando el primero`);
  }
  
  console.log(`✅ Árbitro encontrado: ${arbitros[0].nombre}`);
  return arbitros[0];
};

// 🎮 FUNCIÓN PRINCIPAL: IMPORTAR JUGADAS CON VALIDACIÓN INTELIGENTE
const importarJugadas = async (req, res) => {
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
        errores: 0,
        jugadasSinJugador: 0 // 🔥 NUEVO contador
      }
    };

    // Agrupar jugadas por partido para optimizar
    const jugadasPorPartido = {};
    
    for (let i = 0; i < data.length; i++) {
      const fila = data[i];
      const numeroFila = i + 2;
      
      try {
        // Campos requeridos con números de jugadores
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

    // 🔥 PROCESAR CADA PARTIDO CON VALIDACIÓN INTELIGENTE
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

            // Determinar en qué equipo buscar los jugadores según el tipo de jugada
            let equipoDelJugadorPrincipal = equipoEnPosesion;

            // Para jugadas defensivas, el jugador principal está en el equipo DEFENSOR
            const jugadasDefensivas = ['intercepcion', 'sack', 'tackleo'];
            if (jugadasDefensivas.includes(fila.tipo_jugada)) {
              equipoDelJugadorPrincipal = equipoEnPosesion.toString() === partido.equipoLocal._id.toString() 
                ? partido.equipoVisitante._id 
                : partido.equipoLocal._id;
              
              console.log(`🛡️ Jugada defensiva "${fila.tipo_jugada}" - Buscando jugador en equipo defensor`);
            }

            // 🔥 BUSCAR JUGADOR PRINCIPAL CON MANEJO DE ERRORES
            let jugadorPrincipal = null;
            if (fila.numero_jugador_principal) {
              try {
                jugadorPrincipal = await buscarJugadorPorNumero(
                  fila.numero_jugador_principal, 
                  equipoDelJugadorPrincipal
                );
                console.log(`✅ Jugador principal encontrado: #${fila.numero_jugador_principal} - ${jugadorPrincipal.nombre}`);
              } catch (error) {
                console.log(`⚠️ Jugador principal #${fila.numero_jugador_principal} no encontrado`);
                resultados.warnings.push({
                  fila: jugada.fila,
                  mensaje: `Jugador principal #${fila.numero_jugador_principal} no encontrado`,
                  datos: fila
                });
              }
            }
            
            // 🔥 BUSCAR JUGADOR SECUNDARIO CON MANEJO DE ERRORES
            let jugadorSecundario = null;
            if (fila.numero_jugador_secundario) {
              try {
                // Determinar equipo para jugador secundario según tipo de jugada
                let equipoBusquedaSecundario = equipoDelJugadorPrincipal;
                if (fila.tipo_jugada === 'intercepcion') {
                  equipoBusquedaSecundario = equipoEnPosesion;
                }
                
                jugadorSecundario = await buscarJugadorPorNumero(
                  fila.numero_jugador_secundario, 
                  equipoBusquedaSecundario
                );
                console.log(`✅ Jugador secundario encontrado: #${fila.numero_jugador_secundario} - ${jugadorSecundario.nombre}`);
              } catch (error) {
                console.log(`⚠️ Jugador secundario #${fila.numero_jugador_secundario} no encontrado`);
                resultados.warnings.push({
                  fila: jugada.fila,
                  mensaje: `Jugador secundario #${fila.numero_jugador_secundario} no encontrado`,
                  datos: fila
                });
              }
            }

            // 🔥 VALIDACIÓN INTELIGENTE: ¿Vale la pena guardar esta jugada?
            const tieneJugadorValido = jugadorPrincipal || jugadorSecundario;
            
            if (!tieneJugadorValido) {
              // ❌ Ningún jugador válido - saltar esta jugada
              console.log(`❌ SALTANDO jugada fila ${jugada.fila}: Ningún jugador válido encontrado`);
              resultados.errores.push({
                fila: jugada.fila,
                error: `Jugada descartada: Ningún jugador válido encontrado (Principal: #${fila.numero_jugador_principal || 'N/A'}, Secundario: #${fila.numero_jugador_secundario || 'N/A'})`,
                datos: fila,
                razon: 'sin_jugadores_validos'
              });
              resultados.estadisticas.errores++;
              resultados.estadisticas.jugadasSinJugador++;
              continue; // ← Saltar al siguiente
            }

            // ✅ Al menos un jugador válido - proceder con la jugada
            console.log(`✅ PROCESANDO jugada fila ${jugada.fila}: Al menos un jugador válido`);
            console.log(`  - Principal: ${jugadorPrincipal ? '✅' : '❌'} ${jugadorPrincipal?.nombre || 'N/A'}`);
            console.log(`  - Secundario: ${jugadorSecundario ? '✅' : '❌'} ${jugadorSecundario?.nombre || 'N/A'}`);

            // 🔥 CREAR JUGADA CON JUGADORES VÁLIDOS
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
              // 🔥 SOLO ASIGNAR IDS SI EXISTEN, NULL SI NO
              jugadorPrincipal: jugadorPrincipal?._id || null,
              jugadorSecundario: jugadorSecundario?._id || null,
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

            // 🔥 RESULTADO CON INFORMACIÓN DETALLADA
            const descripcionJugada = [
              fila.tipo_jugada,
              jugadorPrincipal ? `${jugadorPrincipal.nombre} (#${fila.numero_jugador_principal})` : `#${fila.numero_jugador_principal || '?'} (NO ENCONTRADO)`,
              jugadorSecundario ? `→ ${jugadorSecundario.nombre} (#${fila.numero_jugador_secundario})` : ''
            ].filter(Boolean).join(' ');

            resultados.exitosos.push({
              fila: jugada.fila,
              partidoId: partidoId,
              jugada: descripcionJugada,
              puntos: nuevaJugada.resultado.puntos,
              jugadoresValidos: {
                principal: !!jugadorPrincipal,
                secundario: !!jugadorSecundario,
                total: (jugadorPrincipal ? 1 : 0) + (jugadorSecundario ? 1 : 0)
              }
            });

            resultados.estadisticas.creados++;

          } catch (error) {
            // Error general de la jugada
            resultados.errores.push({
              fila: jugada.fila,
              error: error.message,
              datos: fila,
              razon: 'error_general'
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
            datos: jugada.datos,
            razon: 'error_partido'
          });
          resultados.estadisticas.errores++;
        });
      }
    }

    console.log('\n📊 RESUMEN DE IMPORTACIÓN DE JUGADAS:');
    console.log(`  ✅ Exitosos: ${resultados.estadisticas.creados}`);
    console.log(`  ❌ Errores: ${resultados.estadisticas.errores}`);
    console.log(`  ⚠️ Warnings: ${resultados.warnings.length}`);
    console.log(`  🚫 Sin jugadores válidos: ${resultados.estadisticas.jugadasSinJugador}`);

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
    console.error('❌ Error en importación de jugadas:', error);
    res.status(500).json({ 
      mensaje: 'Error al importar jugadas', 
      error: error.message 
    });
  }
};

// 🏈 IMPORTAR PARTIDOS (sin cambios)
const importarPartidos = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ mensaje: 'No se proporcionó archivo CSV' });
    }

    const data = await procesarCSV(req.file);
    
    if (!data || data.length === 0) {
      return res.status(400).json({ mensaje: 'El archivo CSV está vacío o no tiene datos válidos' });
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

    // Procesar cada partido
    for (let i = 0; i < data.length; i++) {
      const fila = data[i];
      const numeroFila = i + 2;
      
      try {
        // Validar campos requeridos
        const camposRequeridos = ['equipo_local', 'equipo_visitante', 'torneo', 'fecha_hora'];
        const camposFaltantes = camposRequeridos.filter(campo => !fila[campo]);
        
        if (camposFaltantes.length > 0) {
          throw new Error(`Campos requeridos faltantes: ${camposFaltantes.join(', ')}`);
        }

        // Buscar entidades relacionadas
        const equipoLocal = await buscarEquipoPorNombreYCategoria(fila.equipo_local, fila.categoria);
        const equipoVisitante = await buscarEquipoPorNombreYCategoria(fila.equipo_visitante, fila.categoria);
        const torneo = await buscarTorneoPorNombre(fila.torneo);
        const arbitroPrincipal = await buscarArbitroPorNombre(fila.arbitro_principal);

        // Validar que los equipos sean diferentes
        if (equipoLocal._id.toString() === equipoVisitante._id.toString()) {
          throw new Error('Un equipo no puede jugar contra sí mismo');
        }

        // Preparar datos del partido
        const fechaHora = new Date(fila.fecha_hora);
        if (isNaN(fechaHora.getTime())) {
          throw new Error(`Fecha inválida: ${fila.fecha_hora}`);
        }

        const datosPartido = {
          equipoLocal: equipoLocal._id,
          equipoVisitante: equipoVisitante._id,
          torneo: torneo._id,
          categoria: fila.categoria || equipoLocal.categoria,
          fechaHora: fechaHora,
          duracionMinutos: parseInt(fila.duracion_minutos) || 50,
          arbitros: {
            principal: arbitroPrincipal?._id
          },
          sede: fila.sede ? {
            nombre: fila.sede,
            direccion: fila.direccion || ''
          } : undefined,
          observaciones: fila.observaciones || ''
        };

        // Crear partido
        const partido = new Partido(datosPartido);
        await partido.save();

        resultados.exitosos.push({
          fila: numeroFila,
          partidoId: partido._id,
          equipos: `${equipoLocal.nombre} vs ${equipoVisitante.nombre}`,
          fecha: fechaHora.toISOString().split('T')[0]
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
    console.error('❌ Error en importación de partidos:', error);
    res.status(500).json({ 
      mensaje: 'Error al importar partidos', 
      error: error.message 
    });
  }
};

// 📋 DESCARGAR PLANTILLAS CSV
const descargarPlantilla = async (req, res) => {
  try {
    const { tipo } = req.params;
    
    let csvContent = '';
    let filename = '';
    
    switch (tipo) {
      case 'partidos':
        csvContent = `equipo_local,equipo_visitante,torneo,categoria,fecha_hora,sede_nombre,sede_direccion,arbitro_principal,estado,marcador_local,marcador_visitante,observaciones,duracion_minutos
Tigres,Leones,Copa Primavera,mixgold,2024-03-15 16:00,Campo Central,Av. Principal 123,Juan Pérez,finalizado,21,14,Partido emocionante,50
Águilas,Pumas,Copa Primavera,mixgold,2024-03-16 18:00,Campo Norte,Calle Secundaria 456,María López,programado,0,0,,50`;
        filename = 'plantilla-partidos.csv';
        break;
        
      case 'jugadas':
        csvContent = `partido_id,minuto,segundo,periodo,equipo_posesion,tipo_jugada,numero_jugador_principal,numero_jugador_secundario,descripcion,puntos,touchdown,intercepcion,sack
67890abcdef12345,12,30,1,Tigres,pase_completo,12,8,Pase de 15 yardas por el medio,0,false,false,false
67890abcdef12345,13,45,1,Tigres,corrida,25,,Corrida por la banda derecha de 8 yardas,0,false,false,false
67890abcdef12345,14,15,1,Tigres,touchdown,12,25,Pase de touchdown de 12 yardas,6,true,false,false
67890abcdef12345,15,20,1,Leones,intercepcion,33,12,Intercepción en zona roja,0,false,true,false
67890abcdef12345,16,10,1,Leones,sack,91,12,Sack por 5 yardas de pérdida,0,false,false,true`;
        filename = 'plantilla-jugadas.csv';
        break;
        
      default:
        return res.status(400).json({ mensaje: 'Tipo de plantilla no válido' });
    }
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\ufeff' + csvContent); // BOM para Excel
    
  } catch (error) {
    console.error('Error al generar plantilla:', error);
    res.status(500).json({ mensaje: 'Error al generar plantilla', error: error.message });
  }
};

// 📊 OBTENER ESTADÍSTICAS DE IMPORTACIÓN
const obtenerEstadisticasImportacion = async (req, res) => {
  try {
    const totalPartidos = await Partido.countDocuments();
    const partidosConJugadas = await Partido.countDocuments({ 
      'jugadas.0': { $exists: true } 
    });
    
    const resultadosJugadas = await Partido.aggregate([
      { $match: { 'jugadas.0': { $exists: true } } },
      { $project: { cantidadJugadas: { $size: '$jugadas' } } },
      { $group: { _id: null, totalJugadas: { $sum: '$cantidadJugadas' } } }
    ]);
    
    const totalJugadas = resultadosJugadas[0]?.totalJugadas || 0;

    res.json({
      mensaje: 'Estadísticas obtenidas correctamente',
      estadisticas: {
        partidos: {
          total: totalPartidos,
          conJugadas: partidosConJugadas,
          sinJugadas: totalPartidos - partidosConJugadas,
          porcentajeConJugadas: totalPartidos > 0 ? Math.round((partidosConJugadas / totalPartidos) * 100) : 0
        },
        jugadas: {
          total: totalJugadas,
          promedioPorPartido: partidosConJugadas > 0 ? Math.round(totalJugadas / partidosConJugadas) : 0
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      mensaje: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

// Funciones adicionales
const obtenerInformacionEquipos = async (req, res) => {
  try {
    const equiposPorCategoria = await Equipo.aggregate([
      { $match: { estado: 'activo' } },
      {
        $group: {
          _id: '$categoria',
          total: { $sum: 1 },
          equipos: { $push: { nombre: '$nombre', _id: '$_id' } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      mensaje: 'Información de equipos obtenida',
      datos: { equiposPorCategoria }
    });
    
  } catch (error) {
    console.error('Error al obtener información:', error);
    res.status(500).json({
      mensaje: 'Error al obtener información de equipos',
      error: error.message
    });
  }
};

const obtenerProgresoImportacion = async (req, res) => {
  try {
    const { procesoId } = req.params;
    
    res.status(200).json({
      mensaje: 'Funcionalidad de progreso en desarrollo',
      procesoId,
      estado: 'no_implementado'
    });
    
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener progreso',
      error: error.message
    });
  }
};

const validarArchivoCSV = async (req, res) => {
  try {
    const { tipo } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ mensaje: 'No se proporcionó archivo CSV' });
    }

    const data = await procesarCSV(req.file);
    
    if (!data || data.length === 0) {
      return res.status(400).json({ 
        mensaje: 'El archivo CSV está vacío o no tiene datos válidos',
        valido: false
      });
    }

    const headers = Object.keys(data[0] || {});
    const puedeImportar = headers.length > 0 && data.length > 0;

    res.status(200).json({
      mensaje: 'Validación completada',
      valido: puedeImportar,
      analisis: {
        archivo: { nombre: req.file.originalname },
        estructura: { filas: data.length, columnas: headers.length }
      }
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

// 📤 EXPORTACIONES - TODAS LAS FUNCIONES QUE ESPERAN LAS RUTAS
module.exports = {
  importarPartidos,
  importarJugadas,
  descargarPlantilla,
  obtenerEstadisticasImportacion,
  obtenerInformacionEquipos,
  obtenerProgresoImportacion,
  validarArchivoCSV
};