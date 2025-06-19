// 📁 server/src/routes/estadisticasRoutes.js
const express = require('express');
const router = express.Router();
const { param, query } = require('express-validator');
const estadisticasController = require('../controllers/estadisticasController');
const { auth } = require('../middleware/authMiddleware');

// 🔒 MIDDLEWARE: Todas las rutas requieren autenticación
// Nota: Todos los usuarios pueden ver estadísticas según los requerimientos

// 📊 1. TABLA DE POSICIONES GENERAL POR CATEGORÍA
router.get('/tabla-posiciones/:torneoId/:categoria',
  [
    auth,
    [
      param('torneoId', 'ID de torneo debe ser válido').isMongoId(),
      param('categoria', 'Categoría debe ser válida').isIn([
        'mixgold', 'mixsilv', 'vargold', 'varsilv', 
        'femgold', 'femsilv', 'varmast', 'femmast', 'tocho7v7'
      ])
    ]
  ],
  estadisticasController.obtenerTablaPosiciones
);

// 📈 2. TENDENCIA DE PUNTOS POR JORNADAS (EQUIPO ESPECÍFICO)
router.get('/tendencia-puntos/:equipoId/:torneoId',
  [
    auth,
    [
      param('equipoId', 'ID de equipo debe ser válido').isMongoId(),
      param('torneoId', 'ID de torneo debe ser válido').isMongoId()
    ]
  ],
  estadisticasController.obtenerTendenciaPuntos
);

// 🏆 3. LÍDERES POR ESTADÍSTICA (TOP 3 JUGADORES DE UN EQUIPO)
router.get('/lideres/:equipoId/:torneoId/:tipo',
  [
    auth,
    [
      param('equipoId', 'ID de equipo debe ser válido').isMongoId(),
      param('torneoId', 'ID de torneo debe ser válido').isMongoId(),
      param('tipo', 'Tipo de estadística debe ser válido').isIn([
        'pases', 'puntos', 'tackleos', 'intercepciones', 'sacks', 'recepciones'
      ])
    ]
  ],
  estadisticasController.obtenerLideresEstadisticas
);

// 📊 4. ESTADÍSTICAS COMPLETAS DE UN EQUIPO (PARA DASHBOARD)
router.get('/equipo/:equipoId/:torneoId',
  [
    auth,
    [
      param('equipoId', 'ID de equipo debe ser válido').isMongoId(),
      param('torneoId', 'ID de torneo debe ser válido').isMongoId()
    ]
  ],
  estadisticasController.obtenerEstadisticasEquipo
);

// 🔍 5. RUTAS ADICIONALES DE CONSULTA RÁPIDA

// 📊 OBTENER RESUMEN DE TORNEOS DISPONIBLES PARA ESTADÍSTICAS
router.get('/torneos-disponibles',
  auth,
  async (req, res) => {
    try {
      const Torneo = require('../models/Torneo');
      const Partido = require('../models/Partido');
      
      console.log('🔍 Obteniendo torneos con partidos finalizados...');
      
      // Obtener torneos que tengan al menos un partido finalizado
      const torneosConPartidos = await Partido.aggregate([
        {
          $match: { estado: 'finalizado' }
        },
        {
          $group: {
            _id: '$torneo',
            totalPartidos: { $sum: 1 },
            categorias: { $addToSet: '$categoria' },
            fechaUltimoPartido: { $max: '$fechaHora' }
          }
        },
        {
          $lookup: {
            from: 'torneos',
            localField: '_id',
            foreignField: '_id',
            as: 'torneo'
          }
        },
        {
          $unwind: '$torneo'
        },
        {
          $project: {
            _id: '$torneo._id',
            nombre: '$torneo.nombre',
            fechaInicio: '$torneo.fechaInicio',
            fechaFin: '$torneo.fechaFin',
            estado: '$torneo.estado',
            totalPartidos: 1,
            categorias: 1,
            fechaUltimoPartido: 1
          }
        },
        {
          $sort: { fechaUltimoPartido: -1 }
        }
      ]);

      console.log(`✅ Encontrados ${torneosConPartidos.length} torneos con estadísticas`);

      res.json({
        torneos: torneosConPartidos,
        total: torneosConPartidos.length,
        mensaje: torneosConPartidos.length === 0 ? 
          'No hay torneos con partidos finalizados para mostrar estadísticas' : 
          'Torneos disponibles para consulta de estadísticas'
      });

    } catch (error) {
      console.error('❌ Error al obtener torneos disponibles:', error);
      res.status(500).json({ 
        mensaje: 'Error al obtener torneos disponibles', 
        error: error.message 
      });
    }
  }
);

// 📋 OBTENER EQUIPOS DE UN TORNEO CON ESTADÍSTICAS
router.get('/equipos-torneo/:torneoId/:categoria',
  [
    auth,
    [
      param('torneoId', 'ID de torneo debe ser válido').isMongoId(),
      param('categoria', 'Categoría debe ser válida').isIn([
        'mixgold', 'mixsilv', 'vargold', 'varsilv', 
        'femgold', 'femsilv', 'varmast', 'femmast', 'tocho7v7'
      ])
    ]
  ],
  async (req, res) => {
    try {
      const { torneoId, categoria } = req.params;
      const Torneo = require('../models/Torneo');
      const Equipo = require('../models/Equipo');
      const Partido = require('../models/Partido');
      const { getImageUrlServer } = require('../helpers/imageUrlHelper');
      
      console.log(`🔍 Obteniendo equipos del torneo ${torneoId} categoría ${categoria}...`);
      
      // Verificar que el torneo existe
      const torneo = await Torneo.findById(torneoId);
      if (!torneo) {
        return res.status(404).json({ mensaje: 'Torneo no encontrado' });
      }

      // Obtener equipos de la categoría que tienen partidos en este torneo
      const equiposConPartidos = await Partido.aggregate([
        {
          $match: {
            torneo: torneoId,
            categoria: categoria,
            estado: 'finalizado'
          }
        },
        {
          $group: {
            _id: null,
            equiposLocales: { $addToSet: '$equipoLocal' },
            equiposVisitantes: { $addToSet: '$equipoVisitante' }
          }
        }
      ]);

      if (!equiposConPartidos.length) {
        return res.json({
          equipos: [],
          mensaje: 'No hay equipos con partidos finalizados en esta categoría'
        });
      }

      // Combinar equipos locales y visitantes
      const equiposIds = [
        ...equiposConPartidos[0].equiposLocales,
        ...equiposConPartidos[0].equiposVisitantes
      ];
      const equiposUnicos = [...new Set(equiposIds.map(id => id.toString()))];

      // Obtener información completa de los equipos
      const equipos = await Equipo.find({
        _id: { $in: equiposUnicos },
        categoria: categoria,
        estado: 'activo'
      }).select('nombre imagen categoria');

      // Enriquecer con URLs
      const equiposEnriquecidos = equipos.map(equipo => ({
        _id: equipo._id,
        nombre: equipo.nombre,
        imagen: getImageUrlServer(equipo.imagen, req),
        categoria: equipo.categoria
      }));

      console.log(`✅ Encontrados ${equiposEnriquecidos.length} equipos con estadísticas`);

      res.json({
        equipos: equiposEnriquecidos,
        torneo: {
          _id: torneo._id,
          nombre: torneo.nombre
        },
        categoria,
        total: equiposEnriquecidos.length
      });

    } catch (error) {
      console.error('❌ Error al obtener equipos del torneo:', error);
      res.status(500).json({ 
        mensaje: 'Error al obtener equipos del torneo', 
        error: error.message 
      });
    }
  }
);

// 🎯 VALIDAR DISPONIBILIDAD DE ESTADÍSTICAS
router.get('/validar/:torneoId/:categoria',
  [
    auth,
    [
      param('torneoId', 'ID de torneo debe ser válido').isMongoId(),
      param('categoria', 'Categoría debe ser válida').isIn([
        'mixgold', 'mixsilv', 'vargold', 'varsilv', 
        'femgold', 'femsilv', 'varmast', 'femmast', 'tocho7v7'
      ])
    ]
  ],
  async (req, res) => {
    try {
      const { torneoId, categoria } = req.params;
      const Partido = require('../models/Partido');
      
      console.log(`🔍 Validando disponibilidad de estadísticas...`);
      
      const estadisticas = await Partido.aggregate([
        {
          $match: {
            torneo: torneoId,
            categoria: categoria
          }
        },
        {
          $group: {
            _id: null,
            totalPartidos: { $sum: 1 },
            partidosFinalizados: {
              $sum: { $cond: [{ $eq: ['$estado', 'finalizado'] }, 1, 0] }
            },
            partidosConJugadas: {
              $sum: { $cond: [{ $gt: [{ $size: '$jugadas' }, 0] }, 1, 0] }
            },
            equiposUnicos: {
              $addToSet: {
                $cond: [
                  { $ne: ['$equipoLocal', null] },
                  ['$equipoLocal', '$equipoVisitante'],
                  []
                ]
              }
            }
          }
        }
      ]);

      const stats = estadisticas[0] || {
        totalPartidos: 0,
        partidosFinalizados: 0,
        partidosConJugadas: 0,
        equiposUnicos: []
      };

      const equiposCount = stats.equiposUnicos.length > 0 ? 
        [...new Set(stats.equiposUnicos.flat())].length : 0;

      const disponible = stats.partidosFinalizados > 0 && equiposCount >= 2;

      console.log(`✅ Validación completada: ${disponible ? 'DISPONIBLE' : 'NO DISPONIBLE'}`);

      res.json({
        disponible,
        estadisticas: {
          totalPartidos: stats.totalPartidos,
          partidosFinalizados: stats.partidosFinalizados,
          partidosConJugadas: stats.partidosConJugadas,
          equiposParticipantes: equiposCount,
          porcentajeCompletitud: stats.totalPartidos > 0 ? 
            Math.round((stats.partidosFinalizados / stats.totalPartidos) * 100) : 0
        },
        recomendaciones: disponible ? 
          ['Las estadísticas están disponibles para consulta'] :
          [
            ...(stats.partidosFinalizados === 0 ? ['Necesitas al menos un partido finalizado'] : []),
            ...(equiposCount < 2 ? ['Necesitas al menos 2 equipos con partidos'] : []),
            ...(stats.partidosConJugadas === 0 ? ['Considera agregar jugadas para estadísticas detalladas'] : [])
          ]
      });

    } catch (error) {
      console.error('❌ Error al validar estadísticas:', error);
      res.status(500).json({ 
        mensaje: 'Error al validar disponibilidad de estadísticas', 
        error: error.message 
      });
    }
  }
);

// 📊 NUEVO - ESTADÍSTICAS GENERALES DEL DASHBOARD
router.get('/dashboard',
  auth,
  async (req, res) => {
    try {
      console.log('📊 Obteniendo estadísticas del dashboard general...');
      
      // Importar modelos
      const Usuario = require('../models/Usuario');
      const Equipo = require('../models/Equipo');
      const Torneo = require('../models/Torneo');
      const Partido = require('../models/Partido');
      
      // Obtener conteos básicos
      const [totalUsuarios, totalEquipos, totalTorneos, totalPartidos] = await Promise.all([
        Usuario.countDocuments(),
        Equipo.countDocuments(),
        Torneo.countDocuments(),
        Partido.countDocuments()
      ]);

      // Actividad hoy
      const hoy = new Date();
      const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);
      
      const partidosHoy = await Partido.countDocuments({
        fechaHora: { $gte: inicioHoy, $lte: finHoy }
      });

      const partidosEnVivo = await Partido.countDocuments({ estado: 'en_curso' });

      // Próximos partidos (7 días)
      const proximaSemana = new Date();
      proximaSemana.setDate(proximaSemana.getDate() + 7);
      
      const proximosPartidos = await Partido.countDocuments({
        fechaHora: { $gte: new Date(), $lte: proximaSemana },
        estado: 'programado'
      });

      // Actividad últimos 7 días
      const hace7Dias = new Date();
      hace7Dias.setDate(hace7Dias.getDate() - 7);

      const [nuevosUsuarios7d, nuevosEquipos7d, nuevosPartidos7d] = await Promise.all([
        Usuario.countDocuments({ createdAt: { $gte: hace7Dias } }),
        Equipo.countDocuments({ createdAt: { $gte: hace7Dias } }),
        Partido.countDocuments({ createdAt: { $gte: hace7Dias } })
      ]);

      // Distribuciones
      const usuariosPorRol = await Usuario.aggregate([
        { $group: { _id: '$rol', cantidad: { $sum: 1 } } }
      ]);

      const equiposPorCategoria = await Equipo.aggregate([
        { $group: { _id: '$categoria', cantidad: { $sum: 1 } } }
      ]);

      const partidosPorEstado = await Partido.aggregate([
        { $group: { _id: '$estado', cantidad: { $sum: 1 } } }
      ]);

      // Equipos más activos
      const equiposMasActivos = await Partido.aggregate([
        {
          $facet: {
            locales: [
              { $group: { _id: '$equipoLocal', partidos: { $sum: 1 } } },
              { $lookup: { from: 'equipos', localField: '_id', foreignField: '_id', as: 'equipo' } },
              { $unwind: '$equipo' },
              { $project: { nombre: '$equipo.nombre', categoria: '$equipo.categoria', partidos: 1 } }
            ],
            visitantes: [
              { $group: { _id: '$equipoVisitante', partidos: { $sum: 1 } } },
              { $lookup: { from: 'equipos', localField: '_id', foreignField: '_id', as: 'equipo' } },
              { $unwind: '$equipo' },
              { $project: { nombre: '$equipo.nombre', categoria: '$equipo.categoria', partidos: 1 } }
            ]
          }
        }
      ]);

      // Procesar equipos más activos
      const equiposActividad = {};
      
      if (equiposMasActivos[0]?.locales) {
        equiposMasActivos[0].locales.forEach(item => {
          const equipoId = item._id.toString();
          equiposActividad[equipoId] = equiposActividad[equipoId] || {
            nombre: item.nombre,
            categoria: item.categoria,
            partidos: 0
          };
          equiposActividad[equipoId].partidos += item.partidos;
        });
      }

      if (equiposMasActivos[0]?.visitantes) {
        equiposMasActivos[0].visitantes.forEach(item => {
          const equipoId = item._id.toString();
          equiposActividad[equipoId] = equiposActividad[equipoId] || {
            nombre: item.nombre,
            categoria: item.categoria,
            partidos: 0
          };
          equiposActividad[equipoId].partidos += item.partidos;
        });
      }

      const topEquipos = Object.values(equiposActividad)
        .sort((a, b) => b.partidos - a.partidos)
        .slice(0, 5);

      console.log('✅ Estadísticas del dashboard calculadas correctamente');

      res.json({
        mensaje: '📊 Estadísticas del dashboard obtenidas correctamente',
        timestamp: new Date().toISOString(),
        
        metricas: {
          totalUsuarios,
          totalEquipos,
          totalTorneos,
          totalArbitros: 0, // Por si no tienes modelo Arbitro aún
          totalPartidos,
          partidosHoy,
          partidosEnVivo,
          proximosPartidos
        },

        actividad: {
          ultimosSieteDias: {
            nuevosUsuarios: nuevosUsuarios7d,
            nuevosEquipos: nuevosEquipos7d,
            nuevosPartidos: nuevosPartidos7d
          },
          hoy: {
            partidos: partidosHoy,
            enVivo: partidosEnVivo
          }
        },

        distribuciones: {
          usuariosPorRol: usuariosPorRol.reduce((acc, item) => {
            acc[item._id] = item.cantidad;
            return acc;
          }, {}),
          equiposPorCategoria: equiposPorCategoria.reduce((acc, item) => {
            acc[item._id] = item.cantidad;
            return acc;
          }, {}),
          partidosPorEstado: partidosPorEstado.reduce((acc, item) => {
            acc[item._id] = item.cantidad;
            return acc;
          }, {})
        },

        rankings: {
          equiposMasActivos: topEquipos,
          torneosActivos: await Torneo.countDocuments({ estado: 'activo' })
        },

        rendimiento: {
          coberturaEquipos: totalEquipos > 0 ? (totalPartidos / totalEquipos) : 0,
          actividadReciente: nuevosUsuarios7d + nuevosEquipos7d + nuevosPartidos7d
        }
      });

    } catch (error) {
      console.error('❌ Error al obtener estadísticas del dashboard:', error);
      res.status(500).json({
        mensaje: 'Error al obtener estadísticas del dashboard',
        error: error.message
      });
    }
  }
);

// 📊 OBTENER TORNEOS CON CATEGORÍAS DISPONIBLES PARA ESTADÍSTICAS  
router.get('/torneos-categorias',
  auth,
  estadisticasController.obtenerTorneosConCategorias
);

// 🃏 5. ESTADÍSTICAS BÁSICAS PARA TARJETA DE EQUIPO (OPTIMIZADO)
router.get('/tarjeta-equipo/:equipoId/:torneoId',
  [
    auth,
    [
      param('equipoId', 'ID de equipo debe ser válido').isMongoId(),
      param('torneoId', 'ID de torneo debe ser válido').isMongoId()
    ]
  ],
  estadisticasController.obtenerEstadisticasTarjetaEquipo
);

// 🏆 OBTENER CLASIFICACIÓN GENERAL TOP 5 (NUEVO ENDPOINT)
router.get('/clasificacion-general/:torneoId/:categoria',
  [
    auth,
    [
      param('torneoId', 'ID de torneo debe ser válido').isMongoId(),
      param('categoria', 'Categoría es requerida').notEmpty()
    ]
  ],
  estadisticasController.obtenerClasificacionGeneral
);

router.get('/debug-jugador/:partidoId/:numeroJugador',
  [
    auth,
    [
      param('partidoId', 'ID de partido debe ser válido').isMongoId(),
      param('numeroJugador', 'Número de jugador debe ser válido').isInt({ min: 1, max: 99 })
    ]
  ],
  estadisticasController.debugJugadorJugadas
);

module.exports = router;