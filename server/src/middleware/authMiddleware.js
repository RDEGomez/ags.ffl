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

    // Verificar si el rol del usuario está entre los permitidos
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ 
        estado: false, 
        mensaje: 'Acceso denegado. No tienes permisos suficientes.',
        rolRequerido: roles,
        rolActual: req.usuario.rol
      });
    }

    next();
  };
};

/**
 * Middleware especializado para recursos de árbitros
 * Permite acceso a admin o al propio árbitro
 */
exports.checkArbitroAccess = () => {
  return async (req, res, next) => {
    try {
      const usuarioLogueado = req.usuario;
      const arbitroId = req.params.id;

      // Admin y capitán tienen acceso total
      if (['admin'].includes(usuarioLogueado.rol)) {
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
 * Middleware para validar que un usuario pueda ser árbitro
 */
exports.checkCanBeArbitro = () => {
  return (req, res, next) => {
    const usuarioLogueado = req.usuario;

    // Solo admin y capitán pueden crear árbitros
    if (!['admin', 'capitan'].includes(usuarioLogueado.rol)) {
      return res.status(403).json({ 
        estado: false, 
        mensaje: 'Solo administradores y capitanes pueden gestionar árbitros.' 
      });
    }

    next();
  };
};