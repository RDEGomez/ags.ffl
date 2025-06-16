// 📁 server/src/controllers/usuarioController.js - PARTE 1/3
const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const Equipo = require('../models/Equipo');
const reglasCategorias = require('../helpers/reglasCategorias');
const { getCategoryName } = require('../../../client/src/helpers/mappings');
const { getImageUrlServer } = require('../helpers/imageUrlHelper');
const emailService = require('../services/emailService'); // 🔥 NUEVO
const crypto = require('crypto'); // 🔥 NUEVO

// 🔐 Generar token
const generarToken = (usuario) => {
  console.log('🔑 Generando token para usuario:', usuario._id);
  return jwt.sign(
    {
      id: usuario._id,
      documento: usuario.documento,
      rol: usuario.rol
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '1h'
    }
  );
};

// 🎯 REGISTRO ACTUALIZADO - CON VERIFICACIÓN EMAIL
exports.registro = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🚀 [${timestamp}] INICIO - Registro de usuario`);
  console.log('📨 Body recibido:', JSON.stringify(req.body, null, 2));
  
  try {
    const { documento, email, password, nombre } = req.body;
    
    console.log('🔍 Validando datos de entrada...');
    console.log(`  📧 Email: ${email}`);
    console.log(`  📄 Documento: ${documento}`);
    console.log(`  👤 Nombre: ${nombre || 'no provisto'}`);
    console.log(`  🔒 Password: ${password ? '***provisto***' : 'NO PROVISTO'}`);

    // Validación básica
    if (!documento || !email || !password) {
      console.log('❌ ERROR: Faltan campos requeridos');
      return res.status(400).json({ 
        mensaje: 'Todos los campos son requeridos',
        faltantes: {
          documento: !documento,
          email: !email, 
          password: !password
        }
      });
    }

    console.log('🔍 Verificando si usuario ya existe...');
    const existe = await Usuario.findOne({ $or: [{ documento }, { email }] });
    
    if (existe) {
      console.log('❌ ERROR: Usuario ya existe');
      console.log(`  📄 Documento coincide: ${existe.documento === documento}`);
      console.log(`  📧 Email coincide: ${existe.email === email}`);
      return res.status(400).json({ mensaje: 'Ya existe un usuario con ese documento o email' });
    }

    console.log('✅ Usuario no existe, procediendo a crear...');
    console.log('💾 Creando nuevo usuario en base de datos...');
    
    // 🔥 CREAR USUARIO SIN VERIFICACIÓN INICIAL
    const nuevoUsuario = new Usuario({ 
      documento, 
      email, 
      password,
      nombre: nombre || '',
      emailVerificado: false // 🔥 Por defecto NO verificado
    });

    const usuarioGuardado = await nuevoUsuario.save();
    
    console.log('✅ Usuario guardado exitosamente');
    console.log(`  🆔 ID: ${usuarioGuardado._id}`);
    console.log(`  📧 Email: ${usuarioGuardado.email}`);
    console.log(`  📄 Documento: ${usuarioGuardado.documento}`);

    // 🔥 GENERAR TOKEN DE VERIFICACIÓN
    console.log('🔑 Generando token de verificación...');
    const tokenVerificacion = usuarioGuardado.crearTokenVerificacion();
    await usuarioGuardado.save();

    // 🔥 ENVIAR EMAIL DE VERIFICACIÓN
    console.log('📧 Enviando email de verificación...');
    const emailResult = await emailService.enviarEmailVerificacion(
      usuarioGuardado.email, 
      tokenVerificacion,
      usuarioGuardado.nombre
    );

    if (!emailResult.success) {
      console.log('⚠️ WARNING: Error enviando email, pero usuario creado');
      // No fallar el registro si no se puede enviar el email
    }

    console.log('📤 Enviando respuesta exitosa');
    const respuesta = {
      mensaje: 'Usuario registrado exitosamente. Revisa tu email para verificar tu cuenta.',
      usuario: {
        id: usuarioGuardado._id,
        documento: usuarioGuardado.documento,
        email: usuarioGuardado.email,
        nombre: usuarioGuardado.nombre,
        emailVerificado: usuarioGuardado.emailVerificado,
        rol: usuarioGuardado.rol
      },
      requiereVerificacion: true
    };

    console.log('📋 Respuesta:', JSON.stringify(respuesta, null, 2));
    console.log(`✅ [${new Date().toISOString()}] FIN - Registro exitoso\n`);

    res.status(201).json(respuesta);

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR en registro:`);
    console.error('💥 Error completo:', error);
    
    // Errores específicos de MongoDB
    if (error.code === 11000) {
      console.log('🔍 Error de duplicado detectado:', error.keyPattern);
      return res.status(400).json({ 
        mensaje: 'Ya existe un usuario con esos datos',
        campo_duplicado: Object.keys(error.keyPattern)[0]
      });
    }

    // Errores de validación
    if (error.name === 'ValidationError') {
      console.log('🔍 Error de validación:', error.errors);
      return res.status(400).json({ 
        mensaje: 'Error de validación',
        errores: Object.keys(error.errors).map(key => ({
          campo: key,
          mensaje: error.errors[key].message
        }))
      });
    }

    console.log(`❌ [${new Date().toISOString()}] FIN - Registro fallido\n`);
    res.status(500).json({ 
      mensaje: 'Error al registrar usuario', 
      error: error.message,
      tipo_error: error.name
    });
  }
};

// 🔓 LOGIN ACTUALIZADO - CON VERIFICACIÓN EMAIL
exports.login = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🔑 [${timestamp}] INICIO - Login de usuario`);
  console.log('📨 Body recibido:', JSON.stringify(req.body, null, 2));

  try {
    const { email, password } = req.body;
    
    console.log('🔍 Validando credenciales...');
    console.log(`  📧 Email: ${email}`);
    console.log(`  🔒 Password: ${password ? '***provisto***' : 'NO PROVISTO'}`);

    console.log('🔍 Buscando usuario en base de datos...');
    const usuario = await Usuario.findOne({ email }).populate('equipos.equipo', 'nombre categoria imagen');
    
    if (!usuario) {
      console.log('❌ ERROR: Usuario no encontrado');
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    console.log('✅ Usuario encontrado:', usuario.email);
    
    console.log('🔍 Verificando contraseña...');
    const passwordValido = await bcrypt.compare(password, usuario.password);
    
    if (!passwordValido) {
      console.log('❌ ERROR: Contraseña incorrecta');
      return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
    }

    console.log('✅ Contraseña válida');

    // 🔥 VERIFICAR SI EMAIL ESTÁ VERIFICADO
    if (!usuario.emailVerificado) {
      console.log('❌ ERROR: Email no verificado');
      return res.status(403).json({ 
        mensaje: 'Debes verificar tu email antes de poder iniciar sesión',
        requiereVerificacion: true,
        email: usuario.email
      });
    }

    console.log('✅ Email verificado');
    console.log('🔑 Generando token...');
    
    const token = generarToken(usuario);
    console.log('✅ Token generado');

    // 🔥 PROCESAMIENTO DE EQUIPOS CON URLs
    let equiposConUrls = [];
    if (usuario.equipos && usuario.equipos.length > 0) {
      console.log('🔄 Procesando equipos del usuario...');
      equiposConUrls = usuario.equipos.map(equipoUsuario => {
        const equipoObj = {
          equipo: equipoUsuario.equipo ? {
            _id: equipoUsuario.equipo._id,
            nombre: equipoUsuario.equipo.nombre,
            categoria: equipoUsuario.equipo.categoria,
            imagen: getImageUrlServer(equipoUsuario.equipo.imagen, req)
          } : null,
          numero: equipoUsuario.numero,
          _id: equipoUsuario._id
        };
        return equipoObj;
      });
    }

    const respuesta = {
      usuario: {
        id: usuario._id,
        documento: usuario.documento,
        email: usuario.email,
        nombre: usuario.nombre,
        imagen: getImageUrlServer(usuario.imagen, req),
        rol: usuario.rol,
        rolSecundario: usuario.rolSecundario,
        emailVerificado: usuario.emailVerificado,
        equipos: equiposConUrls
      },
      token
    };

    console.log('📤 Enviando respuesta exitosa');
    console.log(`✅ [${new Date().toISOString()}] FIN - Login exitoso\n`);

    res.json(respuesta);

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR en login:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Login fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error en el login', 
      error: error.message 
    });
  }
};
// 🔥 NUEVA FUNCIÓN: VERIFICAR EMAIL
exports.verificarEmail = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n✅ [${timestamp}] INICIO - Verificar email`);
  console.log('🔗 Token recibido:', req.params.token);

  try {
    const { token } = req.params;

    if (!token) {
      console.log('❌ ERROR: Token no proporcionado');
      return res.status(400).json({ mensaje: 'Token de verificación requerido' });
    }

    // Hash del token para comparar con BD
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    console.log('🔍 Buscando usuario con token...');
    const usuario = await Usuario.findOne({
      tokenVerificacion: hashedToken,
      tokenVerificacionExpira: { $gt: Date.now() }
    });

    if (!usuario) {
      console.log('❌ ERROR: Token inválido o expirado');
      return res.status(400).json({ 
        mensaje: 'Token de verificación inválido o expirado',
        tokenExpirado: true
      });
    }

    console.log('✅ Token válido, verificando usuario...');
    
    // Verificar cuenta
    usuario.emailVerificado = true;
    usuario.fechaUltimaVerificacion = new Date();
    usuario.tokenVerificacion = undefined;
    usuario.tokenVerificacionExpira = undefined;

    await usuario.save();

    console.log('✅ Email verificado exitosamente');

    // 🔥 ENVIAR EMAIL DE BIENVENIDA
    console.log('📧 Enviando email de bienvenida...');
    await emailService.enviarEmailBienvenida(usuario.email, usuario.nombre);

    console.log('📤 Enviando respuesta exitosa');
    console.log(`✅ [${new Date().toISOString()}] FIN - Verificación exitosa\n`);

    res.json({
      mensaje: 'Email verificado exitosamente. Ya puedes iniciar sesión.',
      emailVerificado: true
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR en verificación:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Verificación fallida\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al verificar email', 
      error: error.message 
    });
  }
};

// 🔥 NUEVA FUNCIÓN: REENVIAR VERIFICACIÓN
exports.reenviarVerificacion = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🔄 [${timestamp}] INICIO - Reenviar verificación`);
  console.log('📨 Body recibido:', JSON.stringify(req.body, null, 2));

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ mensaje: 'Email requerido' });
    }

    console.log('🔍 Buscando usuario...');
    const usuario = await Usuario.findOne({ email });

    if (!usuario) {
      console.log('❌ ERROR: Usuario no encontrado');
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    if (usuario.emailVerificado) {
      console.log('❌ ERROR: Email ya verificado');
      return res.status(400).json({ mensaje: 'El email ya está verificado' });
    }

    // Verificar límite de intentos (máximo 3 por hora)
    const horaAtras = new Date(Date.now() - 60 * 60 * 1000);
    if (usuario.intentosVerificacion >= 3 && usuario.updatedAt > horaAtras) {
      console.log('❌ ERROR: Demasiados intentos');
      return res.status(429).json({ 
        mensaje: 'Demasiados intentos de reenvío. Intenta de nuevo en una hora.',
        intentosRestantes: 0
      });
    }

    console.log('🔑 Generando nuevo token...');
    const tokenVerificacion = usuario.crearTokenVerificacion();
    
    // Resetear contador si ha pasado más de una hora
    if (usuario.updatedAt <= horaAtras) {
      usuario.intentosVerificacion = 1;
    } else {
      usuario.intentosVerificacion += 1;
    }

    await usuario.save();

    console.log('📧 Reenviando email de verificación...');
    const emailResult = await emailService.reenviarVerificacion(
      usuario.email, 
      tokenVerificacion,
      usuario.nombre
    );

    if (!emailResult.success) {
      console.log('❌ ERROR: No se pudo enviar el email');
      return res.status(500).json({ mensaje: 'Error al enviar email de verificación' });
    }

    console.log('✅ Email reenviado exitosamente');
    console.log(`✅ [${new Date().toISOString()}] FIN - Reenvío exitoso\n`);

    res.json({
      mensaje: 'Email de verificación reenviado. Revisa tu bandeja de entrada.',
      intentosRestantes: Math.max(0, 3 - usuario.intentosVerificacion)
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR en reenvío:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Reenvío fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al reenviar verificación', 
      error: error.message 
    });
  }
};

// 🔥 NUEVA FUNCIÓN: SOLICITAR RECUPERACIÓN
exports.solicitarRecuperacion = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🔐 [${timestamp}] INICIO - Solicitar recuperación`);
  console.log('📨 Body recibido:', JSON.stringify(req.body, null, 2));

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ mensaje: 'Email requerido' });
    }

    console.log('🔍 Buscando usuario...');
    const usuario = await Usuario.findOne({ email });

    if (!usuario) {
      console.log('❌ ERROR: Usuario no encontrado');
      // Por seguridad, no revelar si el email existe o no
      return res.json({ 
        mensaje: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña.' 
      });
    }

    if (!usuario.emailVerificado) {
      console.log('❌ ERROR: Email no verificado');
      return res.status(400).json({ 
        mensaje: 'Debes verificar tu email antes de poder recuperar tu contraseña' 
      });
    }

    console.log('🔑 Generando token de recuperación...');
    const tokenRecuperacion = usuario.crearTokenRecuperacion();
    await usuario.save();

    console.log('📧 Enviando email de recuperación...');
    const emailResult = await emailService.enviarEmailRecuperacion(
      usuario.email, 
      tokenRecuperacion,
      usuario.nombre
    );

    if (!emailResult.success) {
      console.log('❌ ERROR: No se pudo enviar el email');
      return res.status(500).json({ mensaje: 'Error al enviar email de recuperación' });
    }

    console.log('✅ Email de recuperación enviado');
    console.log(`✅ [${new Date().toISOString()}] FIN - Solicitud exitosa\n`);

    res.json({
      mensaje: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña.'
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR en solicitud:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Solicitud fallida\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al solicitar recuperación', 
      error: error.message 
    });
  }
};

// 🔥 NUEVA FUNCIÓN: RESTABLECER CONTRASEÑA
exports.restablecerContrasena = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🔄 [${timestamp}] INICIO - Restablecer contraseña`);
  console.log('🔗 Token:', req.params.token);
  console.log('📨 Body recibido:', JSON.stringify({ password: req.body.password ? '***' : undefined }, null, 2));

  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({ mensaje: 'Token de recuperación requerido' });
    }

    if (!password) {
      return res.status(400).json({ mensaje: 'Nueva contraseña requerida' });
    }

    if (password.length < 6) {
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Hash del token para comparar con BD
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    console.log('🔍 Buscando usuario con token...');
    const usuario = await Usuario.findOne({
      tokenRecuperacion: hashedToken,
      tokenRecuperacionExpira: { $gt: Date.now() }
    });

    if (!usuario) {
      console.log('❌ ERROR: Token inválido o expirado');
      return res.status(400).json({ 
        mensaje: 'Token de recuperación inválido o expirado',
        tokenExpirado: true
      });
    }

    console.log('✅ Token válido, actualizando contraseña...');
    
    // Actualizar contraseña
    usuario.password = password; // Se encriptará automáticamente por el pre-save hook
    usuario.tokenRecuperacion = undefined;
    usuario.tokenRecuperacionExpira = undefined;

    await usuario.save();

    console.log('✅ Contraseña actualizada exitosamente');
    console.log('📤 Enviando respuesta exitosa');
    console.log(`✅ [${new Date().toISOString()}] FIN - Restablecimiento exitoso\n`);

    res.json({
      mensaje: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.'
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR en restablecimiento:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Restablecimiento fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al restablecer contraseña', 
      error: error.message 
    });
  }
};

// 🔐 Obtener perfil
exports.perfil = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n👤 [${timestamp}] INICIO - Obtener perfil`);
  console.log('🆔 Usuario ID:', req.usuario.id);

  try {
    console.log('🔍 Buscando usuario en base de datos...');
    // 🔥 AGREGADO: populate para traer equipos completos
    const usuario = await Usuario.findById(req.usuario.id).select('-password').populate('equipos.equipo', 'nombre categoria imagen');
    
    if (!usuario) {
      console.log('❌ ERROR: Usuario no encontrado');
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    console.log('✅ Usuario encontrado:', usuario.email);
    console.log('🏆 Equipos del usuario:', usuario.equipos?.length || 0);

    // 🔥 PROCESAMIENTO DE EQUIPOS CON URLs
    let equiposConUrls = [];
    if (usuario.equipos && usuario.equipos.length > 0) {
      console.log('🔄 Procesando equipos del usuario...');
      equiposConUrls = usuario.equipos.map(equipoUsuario => {
        const equipoObj = {
          equipo: equipoUsuario.equipo ? {
            _id: equipoUsuario.equipo._id,
            nombre: equipoUsuario.equipo.nombre,
            categoria: equipoUsuario.equipo.categoria,
            imagen: getImageUrlServer(equipoUsuario.equipo.imagen, req)
          } : null,
          numero: equipoUsuario.numero,
          _id: equipoUsuario._id
        };
        return equipoObj;
      });
    }

    const usuarioObj = {
      _id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      documento: usuario.documento,
      imagen: getImageUrlServer(usuario.imagen, req),
      rol: usuario.rol,
      rolSecundario: usuario.rolSecundario,
      emailVerificado: usuario.emailVerificado,
      equipos: equiposConUrls
    };

    console.log('📤 Enviando perfil de usuario');
    console.log(`✅ [${new Date().toISOString()}] FIN - Perfil obtenido\n`);

    res.json(usuarioObj);

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al obtener perfil:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Obtener perfil fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al obtener el perfil', 
      error: error.message 
    });
  }
};
// PATCH /usuarios/:id
exports.actualizarPerfil = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n✏️ [${timestamp}] INICIO - Actualizar perfil`);
  console.log('🆔 Usuario ID:', req.params.id);
  console.log('📨 Body recibido:', JSON.stringify(req.body, null, 2));
  console.log('📎 Archivo recibido:', req.file ? `${req.file.filename} (${req.file.size} bytes)` : 'ninguno');

  try {
    const { id } = req.params;
    const { nombre, documento, email } = req.body;
    
    console.log('🔍 Buscando usuario en base de datos...');
    const usuario = await Usuario.findById(id);
    
    if (!usuario) {
      console.log('❌ ERROR: Usuario no encontrado');
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    console.log('✅ Usuario encontrado:', usuario.email);
    console.log('💾 Actualizando campos...');

    // Actualizar campos si se proporcionan
    if (nombre !== undefined) {
      console.log(`  👤 Nombre: "${usuario.nombre}" → "${nombre}"`);
      usuario.nombre = nombre;
    }
    
    if (documento !== undefined) {
      console.log(`  📄 Documento: "${usuario.documento}" → "${documento}"`);
      usuario.documento = documento;
    }
    
    if (email !== undefined) {
      console.log(`  📧 Email: "${usuario.email}" → "${email}"`);
      usuario.email = email;
    }

    // Manejar imagen si se subió una nueva
    if (req.file) {
      console.log('🖼️ Nueva imagen detectada');
      console.log(`  📁 Archivo: ${req.file.filename}`);
      console.log(`  📊 Tamaño: ${req.file.size} bytes`);
      
      // Eliminar imagen anterior si existe
      if (usuario.imagen) {
        const imagenAnterior = path.join(__dirname, '../uploads', usuario.imagen);
        if (fs.existsSync(imagenAnterior)) {
          fs.unlinkSync(imagenAnterior);
          console.log('🗑️ Imagen anterior eliminada:', usuario.imagen);
        }
      }
      
      usuario.imagen = req.file.filename;
      console.log('✅ Nueva imagen asignada:', req.file.filename);
    }

    console.log('💾 Guardando cambios...');
    await usuario.save();

    console.log('✅ Usuario actualizado exitosamente');
    
    const usuarioObj = usuario.toObject();
    usuarioObj.imagen = getImageUrlServer(usuarioObj.imagen, req);

    console.log('📤 Enviando respuesta exitosa');
    console.log(`✅ [${new Date().toISOString()}] FIN - Actualización exitosa\n`);

    res.json({ mensaje: 'Perfil actualizado correctamente', usuario: usuarioObj });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al actualizar perfil:`);
    console.error('💥 Error completo:', error);
    console.error('📋 Stack trace:', error.stack);
    console.log(`❌ [${new Date().toISOString()}] FIN - Actualización fallida\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al actualizar perfil', 
      error: error.message 
    });
  }
};

exports.obtenerUsuarios = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n👥 [${timestamp}] INICIO - Obtener usuarios`);

  try {
    const { rol } = req.query; // 🔥 Parámetro opcional para filtrar por rol
    
    console.log('🔍 Consultando usuarios en base de datos...');
    console.log(`📋 Filtro de rol: ${rol || 'todos'}`);
    
    // Construir filtro
    let filtro = {};
    if (rol) {
      // Validar que el rol sea válido
      const rolesValidos = ['admin', 'jugador', 'capitan', 'arbitro'];
      if (!rolesValidos.includes(rol)) {
        return res.status(400).json({ 
          mensaje: 'Rol no válido',
          rolesValidos 
        });
      }
      filtro.rol = rol;
    } else {
      // Por defecto, excluir árbitros de la lista general de usuarios
      // (los árbitros se gestionan en su propia sección)
      filtro.rol = { $nin: ['arbitro','admin'] };
    }
    
    const usuarios = await Usuario.find(filtro).select('-password').populate('equipos.equipo', 'nombre categoria imagen');
    
    console.log(`✅ Encontrados ${usuarios.length} usuarios (filtro: ${rol || 'no árbitros'})`);
    
    const usuariosConUrls = usuarios.map(usuario => {
      const usuarioObj = usuario.toObject();
      usuarioObj.imagen = getImageUrlServer(usuarioObj.imagen, req);
      
      if (usuarioObj.equipos) {
        usuarioObj.equipos = usuarioObj.equipos.map(equipo => {
          if (equipo.equipo && equipo.equipo.imagen) {
            equipo.equipo.imagen = getImageUrlServer(equipo.equipo.imagen, req);
          }
          return equipo;
        });
      }
      
      return usuarioObj;
    });

    console.log('📤 Enviando lista de usuarios');
    console.log(`✅ [${new Date().toISOString()}] FIN - Usuarios obtenidos\n`);

    res.json(usuariosConUrls);

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al obtener usuarios:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Obtener usuarios fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al obtener usuarios', 
      error: error.message 
    });
  }
};

exports.obtenerUsuarioId = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n👤 [${timestamp}] INICIO - Obtener usuario por ID`);
  console.log('🆔 Usuario ID:', req.params.id);

  try {
    const { id } = req.params;
    
    console.log('🔍 Buscando usuario en base de datos...');
    const usuario = await Usuario.findById(id).select('-password');
    
    if (!usuario) {
      console.log('❌ ERROR: Usuario no encontrado');
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    console.log('✅ Usuario encontrado:', usuario.email);
    
    const usuarioObj = usuario.toObject();
    usuarioObj.imagen = getImageUrlServer(usuarioObj.imagen, req);

    console.log('📤 Enviando usuario');
    console.log(`✅ [${new Date().toISOString()}] FIN - Usuario obtenido\n`);

    res.json(usuarioObj);

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al obtener usuario:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Obtener usuario fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al obtener usuario', 
      error: error.message 
    });
  }
};

exports.eliminarUsuario = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🗑️ [${timestamp}] INICIO - Eliminar usuario`);
  console.log('🆔 Usuario ID:', req.params.id);

  try {
    const { id } = req.params;
    
    console.log('🔍 Buscando y eliminando usuario...');
    const usuario = await Usuario.findByIdAndDelete(id);
    
    if (!usuario) {
      console.log('❌ ERROR: Usuario no encontrado');
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    console.log('✅ Usuario eliminado:', usuario.email);
    console.log('📤 Enviando confirmación');
    console.log(`✅ [${new Date().toISOString()}] FIN - Usuario eliminado\n`);

    res.json({ mensaje: 'Usuario eliminado correctamente' });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al eliminar usuario:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Eliminar usuario fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al eliminar usuario', 
      error: error.message 
    });
  }
};

// 🔥 FUNCIÓN COMPLETA CON TODAS LAS VALIDACIONES
exports.agregarJugadorAEquipo = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n⚽ [${timestamp}] INICIO - Agregar jugador a equipo`);
  console.log('📨 Body recibido:', JSON.stringify(req.body, null, 2));

  try {
    const { usuarioId, numero, equipoId } = req.body;
    const usuarioLogueado = req.usuario;

    console.log('🔍 Validando parámetros...');
    console.log(`  👤 Usuario ID: ${usuarioId}`);
    console.log(`  🏈 Equipo ID: ${equipoId}`);
    console.log(`  🔢 Número: ${numero}`);

    console.log('🔐 Validando permisos...');
    
    const puedeAgregar = usuarioLogueado.rol === 'admin' || 
                        usuarioLogueado.rol === 'capitan' || 
                        usuarioLogueado._id.toString() === usuarioId;

    if (!puedeAgregar) {
      console.log('❌ ERROR: Sin permisos para agregar jugador');
      return res.status(403).json({ 
        mensaje: 'No tienes permisos para agregar este jugador al equipo' 
      });
    }

    console.log('✅ Permisos validados');
    console.log(`👤 Usuario logueado: ${usuarioLogueado.nombre} (${usuarioLogueado.rol})`);

    console.log('🔍 Buscando jugador...');
    const jugador = await Usuario.findById(usuarioId);
    if (!jugador) {
      console.log('❌ ERROR: Jugador no encontrado');
      return res.status(404).json({ mensaje: 'Jugador no encontrado' });
    }

    console.log('🔍 Buscando equipo...');
    const equipo = await Equipo.findById(equipoId);
    if (!equipo) {
      console.log('❌ ERROR: Equipo no encontrado');
      return res.status(404).json({ mensaje: 'Equipo no encontrado' });
    }

    console.log('✅ Jugador y equipo encontrados');
    console.log(`  👤 Jugador: ${jugador.nombre} (${jugador.email})`);
    console.log(`  🏈 Equipo: ${equipo.nombre} (${equipo.categoria})`);

    // Validar que el jugador puede estar en equipos
    if (!jugador.puedeEstarEnEquipos()) {
      console.log('❌ ERROR: El usuario no puede estar en equipos');
      return res.status(400).json({ 
        mensaje: 'Este usuario no puede formar parte de equipos' 
      });
    }

    // Validar reglas de la categoría
    console.log('🔍 Validando reglas de categoría...');
    const puedeUnirse = reglasCategorias.puedeUnirseACategoria(jugador, equipo.categoria);
    if (!puedeUnirse.puede) {
      console.log('❌ ERROR: No cumple reglas de categoría');
      return res.status(400).json({ mensaje: puedeUnirse.razon });
    }

    // Verificar si ya está en el equipo
    const yaEstaEnEquipo = jugador.equipos.some(eq => eq.equipo.toString() === equipoId);
    if (yaEstaEnEquipo) {
      console.log('❌ ERROR: Jugador ya está en el equipo');
      return res.status(400).json({ mensaje: 'El jugador ya está en este equipo' });
    }

    // Verificar si el número ya está ocupado en el equipo
    if (numero) {
      const numeroOcupado = await Usuario.findOne({
        'equipos.equipo': equipoId,
        'equipos.numero': numero
      });
      
      if (numeroOcupado) {
        console.log('❌ ERROR: Número ya ocupado');
        return res.status(400).json({ 
          mensaje: `El número ${numero} ya está ocupado en este equipo` 
        });
      }
    }

    console.log('💾 Agregando jugador al equipo...');
    
    // Agregar al equipo
    jugador.equipos.push({
      equipo: equipoId,
      numero: numero || null
    });

    await jugador.save();

    console.log('✅ Jugador agregado exitosamente');
    console.log('📤 Enviando respuesta exitosa');
    console.log(`✅ [${new Date().toISOString()}] FIN - Agregado exitoso\n`);

    res.json({ 
      mensaje: 'Jugador agregado al equipo exitosamente',
      jugador: {
        id: jugador._id,
        nombre: jugador.nombre,
        email: jugador.email,
        numero: numero
      },
      equipo: {
        id: equipo._id,
        nombre: equipo.nombre,
        categoria: equipo.categoria
      }
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al agregar jugador:`);
    console.error('💥 Error completo:', error);
    console.log(`❌ [${new Date().toISOString()}] FIN - Agregar jugador fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al agregar jugador al equipo', 
      error: error.message 
    });
  }
};