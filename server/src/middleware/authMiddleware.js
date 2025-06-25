// 📁 server/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

/**
 * Middleware para verificar la autenticación del usuario
 */
exports.auth = async (req, res, next) => {
  try {
    // Extraer el token del header Authorization
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        estado: false, 
        mensaje: 'Acceso denegado. Token no proporcionado.' 
      });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'miSecreto');
    
    // Buscar el usuario correspondiente
    const usuario = await Usuario.findById(decoded.id).select('-password');
    
    if (!usuario) {
      return res.status(401).json({ 
        estado: false, 
        mensaje: 'Usuario no encontrado.' 
      });
    }

    // Adjuntar el usuario a la solicitud para uso posterior
    req.usuario = usuario;
    next();
  } catch (error) {
    console.error('Error de autenticación:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        estado: false, 
        mensaje: 'Token inválido.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        estado: false, 
        mensaje: 'El token ha expirado.' 
      });
    }
    
    res.status(500).json({ 
      estado: false, 
      mensaje: 'Error en la autenticación.' 
    });
  }
};

/**
 * Middleware para verificar roles - acepta uno o varios roles permitidos
 * Roles disponibles: 'admin', 'jugador', 'capitan', 'arbitro'
 */
exports.checkRole = (...roles) => {
  return (req, res, next) => {
    // Asegurar que el usuario esté autenticado
    if (!req.usuario) {
      return res.status(401).json({ 
        estado: false, 
        mensaje: 'Usuario no autenticado.' 
      });
    }

    const usuario = req.usuario;

    console.log("🔐 Verificando roles del usuario:", usuario.rol);
    
    // Verificar rol principal Y rol secundario
    const tieneRol = roles.includes(usuario.rol) || 
                    (usuario.rolSecundario && roles.includes(usuario.rolSecundario));
    
    if (!tieneRol) {
      return res.status(403).json({ 
        estado: false, 
        mensaje: 'Acceso denegado. No tienes permisos suficientes.'
      });
    }

    next();
  };
};

/**
 * 🔥 NUEVO - Middleware para validar edición de usuarios
 * Reglas:
 * - Admin: puede editar cualquier usuario
 * - Capitán: puede editar cualquier usuario EXCEPTO otros admins
 * - Jugador: solo puede editar su propio perfil
 * - Árbitro: solo puede editar su propio perfil
 */
exports.checkUserEditPermission = async (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🔐 [${timestamp}] INICIO - Validación permisos edición usuario`);
  console.log('👤 Usuario logueado:', req.usuario.email, '| Rol:', req.usuario.rol);
  console.log('🎯 Usuario objetivo ID:', req.params.id);

  try {
    const usuarioLogueado = req.usuario;
    const usuarioId = req.params.id;

    // Admin puede editar cualquier usuario
    if (usuarioLogueado.rol === 'admin') {
      console.log('✅ ADMIN - Acceso total autorizado');
      console.log(`✅ [${new Date().toISOString()}] FIN - Permisos validados\n`);
      return next();
    }

    // Buscar el usuario objetivo para verificar su rol
    console.log('🔍 Buscando usuario objetivo...');
    const usuarioObjetivo = await Usuario.findById(usuarioId).select('rol email');
    if (!usuarioObjetivo) {
      console.log('❌ ERROR: Usuario objetivo no encontrado');
      console.log(`❌ [${new Date().toISOString()}] FIN - Usuario no encontrado\n`);
      return res.status(404).json({ 
        estado: false,
        mensaje: 'Usuario no encontrado' 
      });
    }

    console.log('✅ Usuario objetivo encontrado:', usuarioObjetivo.email, '| Rol:', usuarioObjetivo.rol);

    // Capitán NO puede editar admin
    if (usuarioLogueado.rol === 'capitan' && usuarioObjetivo.rol === 'admin') {
      console.log('❌ ERROR: Capitán intentando editar admin - DENEGADO');
      console.log(`❌ [${new Date().toISOString()}] FIN - Capitán no puede editar admin\n`);
      return res.status(403).json({ 
        estado: false,
        mensaje: 'No tienes permisos para editar administradores' 
      });
    }

    // Capitán puede editar otros usuarios (excepto admin)
    if (usuarioLogueado.rol === 'capitan') {
      console.log('✅ CAPITÁN - Puede editar usuario objetivo');
      console.log(`✅ [${new Date().toISOString()}] FIN - Permisos validados\n`);
      return next();
    }

    // Jugador y árbitro solo pueden editar su propio perfil
    if (usuarioLogueado._id.toString() === usuarioId) {
      console.log('✅ USUARIO PROPIO - Editando su propio perfil');
      console.log(`✅ [${new Date().toISOString()}] FIN - Permisos validados\n`);
      return next();
    }

    console.log('❌ ERROR: Usuario sin permisos para editar este perfil');
    console.log(`❌ [${new Date().toISOString()}] FIN - Acceso denegado\n`);
    return res.status(403).json({ 
      estado: false,
      mensaje: 'Solo puedes editar tu propio perfil.' 
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR en validación permisos:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Error en validación\n`);
    
    return res.status(500).json({ 
      estado: false,
      mensaje: 'Error al verificar permisos.' 
    });
  }
};

/**
 * 🔥 NUEVO - Middleware para validar edición de árbitros  
 * Reglas:
 * - Admin: puede editar cualquier árbitro
 * - Árbitro: solo puede editar su propio perfil de árbitro
 * - Otros roles: sin acceso
 */
exports.checkArbitroEditPermission = async (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n⚖️ [${timestamp}] INICIO - Validación permisos edición árbitro`);
  console.log('👤 Usuario logueado:', req.usuario.email, '| Rol:', req.usuario.rol);
  console.log('🎯 Árbitro ID:', req.params.id);

  try {
    const usuarioLogueado = req.usuario;
    const arbitroId = req.params.id;

    // Admin puede editar cualquier árbitro
    if (usuarioLogueado.rol === 'admin') {
      console.log('✅ ADMIN - Acceso total a árbitros autorizado');
      console.log(`✅ [${new Date().toISOString()}] FIN - Permisos validados\n`);
      return next();
    }

    // Árbitro solo puede editar su propio perfil
    if (usuarioLogueado.rol === 'arbitro') {
      console.log('🔍 Validando que árbitro edite su propio perfil...');
      
      const Arbitro = require('../models/Arbitro');
      const arbitro = await Arbitro.findById(arbitroId);
      
      if (!arbitro) {
        console.log('❌ ERROR: Perfil de árbitro no encontrado');
        console.log(`❌ [${new Date().toISOString()}] FIN - Árbitro no encontrado\n`);
        return res.status(404).json({ 
          estado: false,
          mensaje: 'Árbitro no encontrado.' 
        });
      }

      console.log('🔍 Árbitro encontrado - Usuario asociado:', arbitro.usuario);

      // Verificar que el usuario logueado sea el dueño del perfil de árbitro
      if (usuarioLogueado._id.toString() === arbitro.usuario.toString()) {
        console.log('✅ ÁRBITRO - Editando su propio perfil');
        console.log(`✅ [${new Date().toISOString()}] FIN - Permisos validados\n`);
        return next();
      }

      console.log('❌ ERROR: Árbitro intentando editar perfil de otro árbitro');
      console.log(`❌ [${new Date().toISOString()}] FIN - Acceso denegado\n`);
      return res.status(403).json({ 
        estado: false,
        mensaje: 'Solo puedes editar tu propio perfil de árbitro.' 
      });
    }

    console.log('❌ ERROR: Usuario sin rol autorizado para editar árbitros');
    console.log(`❌ [${new Date().toISOString()}] FIN - Rol no autorizado\n`);
    return res.status(403).json({ 
      estado: false,
      mensaje: 'No tienes permisos para editar perfiles de árbitros.' 
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR en validación permisos árbitro:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Error en validación\n`);
    
    return res.status(500).json({ 
      estado: false,
      mensaje: 'Error al verificar permisos.' 
    });
  }
};

/**
 * Middleware especializado para recursos de árbitros (EXISTENTE - mantenido para compatibilidad)
 * Permite acceso a admin o al propio árbitro
 */
exports.checkArbitroAccess = () => {
  return async (req, res, next) => {
    try {
      const usuarioLogueado = req.usuario;
      const arbitroId = req.params.id;

      // Admin tiene acceso total
      if (usuarioLogueado.rol === 'admin') {
        return next();
      }

      // Si es árbitro, verificar que sea su propio perfil
      if (usuarioLogueado.rol === 'arbitro') {
        const Arbitro = require('../models/Arbitro');
        const arbitro = await Arbitro.findById(arbitroId);
        
        if (!arbitro) {
          return res.status(404).json({ 
            estado: false, 
            mensaje: 'Árbitro no encontrado.' 
          });
        }

        // Verificar que el usuario logueado sea el dueño del perfil de árbitro
        if (usuarioLogueado._id.toString() === arbitro.usuario.toString()) {
          return next();
        }
      }

      return res.status(403).json({ 
        estado: false, 
        mensaje: 'No tienes permisos para acceder a este recurso.' 
      });

    } catch (error) {
      console.error('Error en checkArbitroAccess:', error);
      return res.status(500).json({ 
        estado: false, 
        mensaje: 'Error al verificar permisos.' 
      });
    }
  };
};

/**
 * Middleware para validar que un usuario pueda ser árbitro (EXISTENTE)
 * Solo admin puede crear árbitros según nuestras reglas
 */
exports.checkCanBeArbitro = () => {
  return (req, res, next) => {
    const usuarioLogueado = req.usuario;

    // Solo admin puede crear árbitros (quitamos capitán según nuestras reglas)
    if (usuarioLogueado.rol !== 'admin') {
      return res.status(403).json({ 
        estado: false, 
        mensaje: 'Solo administradores pueden gestionar árbitros.' 
      });
    }

    next();
  };
};