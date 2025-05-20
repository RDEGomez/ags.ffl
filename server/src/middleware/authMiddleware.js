// 📁 middleware/authMiddleware.js
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
        mensaje: 'Acceso denegado. No tienes permisos suficientes.' 
      });
    }

    next();
  };
};
