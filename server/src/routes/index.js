const express = require('express');
const router = express.Router();

const usuarioRoutes = require('./usuarioRoutes');
const torneoRoutes = require('./torneoRoutes');
const arbitroRoutes = require('./arbitroRoutes');
const partidoRoutes = require('./partidoRoutes');
const importacionRoutes = require('./importacionRoutes');
const estadisticasRoutes = require('./estadisticasRoutes');
const configRoutes = require('./configRoutes');

// Rutas de usuario (auth)
router.use('/', usuarioRoutes);

// Rutas de torneos
router.use('/torneos', torneoRoutes);

router.use('/arbitros', arbitroRoutes);

router.use('/partidos', partidoRoutes);

router.use('/importacion', importacionRoutes);

router.use('/estadisticas', estadisticasRoutes);

router.use('/config', configRoutes);

module.exports = router;

// // 📁 routes/index.js - Índice principal de rutas
// const express = require('express');
// const router = express.Router();

// // 📋 Importar todas las rutas
// const usuarioRoutes = require('./usuarioRoutes');
// const torneoRoutes = require('./torneoRoutes');
// const arbitroRoutes = require('./arbitroRoutes');
// const partidoRoutes = require('./partidoRoutes'); // 🔥 NUEVO - Rutas de partidos

// // 🔐 Rutas de autenticación y usuarios (base)
// router.use('/', usuarioRoutes);

// // 🏆 Rutas de torneos
// router.use('/torneos', torneoRoutes);

// // ⚖️ Rutas de árbitros
// router.use('/arbitros', arbitroRoutes);

// // ⚽ Rutas de partidos 🔥 NUEVO
// router.use('/partidos', partidoRoutes);

// // 🔍 Endpoint de estado de la API
// router.get('/status', (req, res) => {
//   res.json({
//     message: '🚀 API AGS Flag Football funcionando correctamente',
//     version: '2.0.0',
//     timestamp: new Date().toISOString(),
//     environment: process.env.NODE_ENV || 'development',
//     modules: {
//       usuarios: '✅ Activo',
//       equipos: '✅ Activo', 
//       torneos: '✅ Activo',
//       arbitros: '✅ Activo',
//       partidos: '🔥 NUEVO - Activo' // 🔥 AGREGADO
//     },
//     endpoints: {
//       auth: '/auth/*',
//       usuarios: '/usuarios/*',
//       equipos: '/equipos/*', 
//       torneos: '/torneos/*',
//       arbitros: '/arbitros/*',
//       partidos: '/partidos/*' // 🔥 AGREGADO
//     }
//   });
// });

// // 📊 Endpoint de estadísticas generales del sistema
// router.get('/estadisticas-sistema', async (req, res) => {
//   try {
//     const Usuario = require('../models/Usuario');
//     const Equipo = require('../models/Equipo');
//     const Torneo = require('../models/Torneo');
//     const Arbitro = require('../models/Arbitro');
//     const Partido = require('../models/Partido'); // 🔥 AGREGADO

//     // 📈 Conteos básicos
//     const [
//       totalUsuarios,
//       totalEquipos, 
//       totalTorneos,
//       totalArbitros,
//       totalPartidos, // 🔥 AGREGADO
//       partidosHoy, // 🔥 AGREGADO
//       partidosEnVivo // 🔥 AGREGADO
//     ] = await Promise.all([
//       Usuario.countDocuments(),
//       Equipo.countDocuments(),
//       Torneo.countDocuments(),
//       Arbitro.countDocuments(),
//       Partido.countDocuments(), // 🔥 AGREGADO
//       Partido.countDocuments({ // 🔥 AGREGADO - Partidos de hoy
//         fechaHora: {
//           $gte: new Date(new Date().setHours(0, 0, 0, 0)),
//           $lt: new Date(new Date().setHours(23, 59, 59, 999))
//         }
//       }),
//       Partido.countDocuments({ estado: 'en_curso' }) // 🔥 AGREGADO - Partidos en vivo
//     ]);

//     // 👥 Distribución de usuarios por rol
//     const distribucionRoles = await Usuario.aggregate([
//       {
//         $group: {
//           _id: '$rol',
//           cantidad: { $sum: 1 }
//         }
//       }
//     ]);

//     // 🏆 Distribución de equipos por categoría
//     const distribucionCategorias = await Equipo.aggregate([
//       {
//         $group: {
//           _id: '$categoria',
//           cantidad: { $sum: 1 }
//         }
//       }
//     ]);

//     // ⚖️ Estados de árbitros
//     const estadosArbitros = await Arbitro.aggregate([
//       {
//         $group: {
//           _id: '$estado',
//           cantidad: { $sum: 1 }
//         }
//       }
//     ]);

//     // ⚽ Estados de partidos 🔥 AGREGADO
//     const estadosPartidos = await Partido.aggregate([
//       {
//         $group: {
//           _id: '$estado',
//           cantidad: { $sum: 1 }
//         }
//       }
//     ]);

//     // 🎯 Partidos por categoría 🔥 AGREGADO
//     const partidosPorCategoria = await Partido.aggregate([
//       {
//         $group: {
//           _id: '$categoria',
//           cantidad: { $sum: 1 }
//         }
//       }
//     ]);

//     // 📅 Actividad reciente (últimos 7 días) 🔥 AGREGADO
//     const hace7Dias = new Date();
//     hace7Dias.setDate(hace7Dias.getDate() - 7);

//     const actividadReciente = await Promise.all([
//       Usuario.countDocuments({ createdAt: { $gte: hace7Dias } }),
//       Equipo.countDocuments({ createdAt: { $gte: hace7Dias } }),
//       Partido.countDocuments({ createdAt: { $gte: hace7Dias } })
//     ]);

//     res.json({
//       mensaje: '📊 Estadísticas generales del sistema',
//       timestamp: new Date().toISOString(),
      
//       // 📈 Totales generales
//       totales: {
//         usuarios: totalUsuarios,
//         equipos: totalEquipos,
//         torneos: totalTorneos,
//         arbitros: totalArbitros,
//         partidos: totalPartidos // 🔥 AGREGADO
//       },

//       // ⚽ Estadísticas de partidos 🔥 AGREGADO
//       partidosEstadisticas: {
//         total: totalPartidos,
//         hoy: partidosHoy,
//         enVivo: partidosEnVivo,
//         porEstado: estadosPartidos.reduce((acc, item) => {
//           acc[item._id] = item.cantidad;
//           return acc;
//         }, {}),
//         porCategoria: partidosPorCategoria.reduce((acc, item) => {
//           acc[item._id] = item.cantidad;
//           return acc;
//         }, {})
//       },

//       // 👥 Distribuciones existentes
//       distribuciones: {
//         usuariosPorRol: distribucionRoles.reduce((acc, item) => {
//           acc[item._id] = item.cantidad;
//           return acc;
//         }, {}),
        
//         equiposPorCategoria: distribucionCategorias.reduce((acc, item) => {
//           acc[item._id] = item.cantidad;
//           return acc;
//         }, {}),
        
//         arbitrosPorEstado: estadosArbitros.reduce((acc, item) => {
//           acc[item._id] = item.cantidad;
//           return acc;
//         }, {})
//       },

//       // 📅 Actividad reciente (últimos 7 días) 🔥 ACTUALIZADO
//       actividadReciente: {
//         nuevosUsuarios: actividadReciente[0],
//         nuevosEquipos: actividadReciente[1],
//         nuevosPartidos: actividadReciente[2] // 🔥 AGREGADO
//       },

//       // 🔗 Enlaces útiles
//       enlaces: {
//         documentacion: '/api/status',
//         usuarios: '/api/usuarios',
//         equipos: '/api/equipos',
//         torneos: '/api/torneos',
//         arbitros: '/api/arbitros',
//         partidos: '/api/partidos', // 🔥 AGREGADO
//         partidosHoy: '/api/partidos/especiales/hoy', // 🔥 AGREGADO
//         partidosEnVivo: '/api/partidos/especiales/en-vivo' // 🔥 AGREGADO
//       }
//     });

//   } catch (error) {
//     console.error('Error al obtener estadísticas del sistema:', error);
//     res.status(500).json({
//       mensaje: 'Error al obtener estadísticas del sistema',
//       error: error.message
//     });
//   }
// });

// // 🔍 Endpoint de salud detallado
// router.get('/health', async (req, res) => {
//   try {
//     const mongoose = require('mongoose');
    
//     // 🔌 Estado de la base de datos
//     const dbState = mongoose.connection.readyState;
//     const dbStates = {
//       0: 'disconnected',
//       1: 'connected', 
//       2: 'connecting',
//       3: 'disconnecting'
//     };

//     // ⏱️ Tiempo de respuesta de la DB
//     const startTime = Date.now();
//     await mongoose.connection.db.admin().ping();
//     const dbResponseTime = Date.now() - startTime;

//     // 💾 Información del servidor
//     const memoryUsage = process.memoryUsage();
//     const uptime = process.uptime();

//     res.json({
//       status: 'healthy',
//       timestamp: new Date().toISOString(),
      
//       // 🔌 Base de datos
//       database: {
//         status: dbStates[dbState] || 'unknown',
//         responseTime: `${dbResponseTime}ms`,
//         connected: dbState === 1
//       },

//       // 💾 Servidor
//       server: {
//         uptime: `${Math.floor(uptime)}s`,
//         memoryUsage: {
//           rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
//           heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
//           heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
//         },
//         nodeVersion: process.version,
//         platform: process.platform
//       },

//       // 🎯 Módulos del sistema
//       modules: {
//         usuarios: '✅ Operativo',
//         equipos: '✅ Operativo',
//         torneos: '✅ Operativo', 
//         arbitros: '✅ Operativo',
//         partidos: '🔥 Operativo - NUEVO' // 🔥 AGREGADO
//       },

//       // 🔥 Funcionalidades nuevas disponibles
//       nuevasFuncionalidades: {
//         generadorRol: '✅ Disponible - Genera automáticamente calendarios de partidos',
//         gestionPartidos: '✅ Disponible - CRUD completo de partidos',
//         filtrosAvanzados: '✅ Disponible - Filtrado por torneo, equipo, categoría, fecha',
//         estadisticasPartidos: '⏳ Preparado - Para registro manual de estadísticas',
//         arbitrajeIntegrado: '✅ Disponible - Asignación de árbitros a partidos',
//         partidosEnVivo: '⏳ Preparado - Para gestión en tiempo real (Fase 2/3)'
//       }
//     });

//   } catch (error) {
//     res.status(503).json({
//       status: 'unhealthy',
//       timestamp: new Date().toISOString(),
//       error: error.message,
//       database: {
//         status: 'error',
//         connected: false
//       }
//     });
//   }
// });

// // 🎯 Middleware de manejo de rutas no encontradas (404)
// router.use('*', (req, res) => {
//   res.status(404).json({
//     error: 'Endpoint no encontrado',
//     message: `La ruta ${req.method} ${req.originalUrl} no existe`,
//     timestamp: new Date().toISOString(),
//     availableEndpoints: {
//       auth: 'POST /api/auth/login, POST /api/auth/register',
//       usuarios: 'GET /api/usuarios, GET/PATCH/DELETE /api/usuarios/:id',
//       equipos: 'GET/POST /api/equipos, GET/PATCH/DELETE /api/equipos/:id',
//       torneos: 'GET/POST /api/torneos, GET/PUT/DELETE /api/torneos/:id',
//       arbitros: 'GET/POST /api/arbitros, GET/PATCH/DELETE /api/arbitros/:id',
//       partidos: 'GET/POST /api/partidos, GET/PUT/DELETE /api/partidos/:id', // 🔥 AGREGADO
//       generadorRol: 'POST /api/partidos/generar-rol', // 🔥 AGREGADO
//       status: 'GET /api/status, GET /api/health, GET /api/estadisticas-sistema'
//     },
//     documentation: 'Consulta la documentación para más detalles sobre cada endpoint'
//   });
// });

// module.exports = router;