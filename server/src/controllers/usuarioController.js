// 📁 controllers/usuarioController.js
const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const Equipo = require('../models/Equipo');
const reglasCategorias = require('../helpers/reglasCategorias');
const { getCategoryName } = require('../../../client/src/helpers/mappings');
const { getImageUrlServer } = require('../helpers/imageUrlHelper');

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

// 🎯 Registro de usuario
exports.registro = async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🚀 [${timestamp}] INICIO - Registro de usuario`);
  console.log('📨 Body recibido:', JSON.stringify(req.body, null, 2));
  
  try {
    const { documento, email, password } = req.body;
    
    console.log('🔍 Validando datos de entrada...');
    console.log(`  📧 Email: ${email}`);
    console.log(`  📄 Documento: ${documento}`);
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
    
    const nuevoUsuario = new Usuario({ documento, email, password });
    const usuarioGuardado = await nuevoUsuario.save();
    
    console.log('✅ Usuario guardado exitosamente');
    console.log(`  🆔 ID: ${usuarioGuardado._id}`);
    console.log(`  📧 Email: ${usuarioGuardado.email}`);
    console.log(`  📄 Documento: ${usuarioGuardado.documento}`);
    console.log(`  👤 Rol: ${usuarioGuardado.rol}`);

    console.log('🔑 Generando token de autenticación...');
    const token = generarToken(usuarioGuardado);
    console.log('✅ Token generado exitosamente');

    const respuesta = {
      usuario: {
        id: usuarioGuardado._id,
        documento: usuarioGuardado.documento,
        email: usuarioGuardado.email,
        imagen: getImageUrlServer(usuarioGuardado.imagen, req),
        rol: usuarioGuardado.rol
      },
      token
    };

    console.log('📤 Enviando respuesta exitosa');
    console.log('📋 Respuesta:', JSON.stringify(respuesta, null, 2));
    console.log(`✅ [${new Date().toISOString()}] FIN - Registro exitoso\n`);

    res.status(201).json(respuesta);

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR en registro:`);
    console.error('💥 Error completo:', error);
    console.error('📋 Stack trace:', error.stack);
    console.error('🔍 Nombre del error:', error.name);
    console.error('💬 Mensaje del error:', error.message);
    
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

// 🔓 Login CORREGIDO - Incluye equipos populados
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
    // 🔥 AGREGADO: populate para traer equipos completos
    const usuario = await Usuario.findOne({ email }).populate('equipos.equipo', 'nombre categoria imagen');
    
    if (!usuario) {
      console.log('❌ ERROR: Usuario no encontrado');
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    console.log('✅ Usuario encontrado:', usuario.email);
    console.log('🏆 Equipos del usuario:', usuario.equipos?.length || 0);
    
    console.log('🔍 Verificando contraseña...');
    
    const passwordValido = await bcrypt.compare(password, usuario.password);
    
    if (!passwordValido) {
      console.log('❌ ERROR: Contraseña incorrecta');
      return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
    }

    console.log('✅ Contraseña válida');
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
            ...equipoUsuario.equipo.toObject(),
            imagen: getImageUrlServer(equipoUsuario.equipo.imagen, req)
          } : equipoUsuario.equipo,
          numero: equipoUsuario.numero
        };
        
        console.log(`  📋 Equipo procesado: ${equipoObj.equipo?.nombre || 'Sin nombre'} - #${equipoObj.numero}`);
        return equipoObj;
      });
    }

    const respuesta = {
      usuario: {
        _id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        documento: usuario.documento,
        imagen: getImageUrlServer(usuario.imagen, req),
        rol: usuario.rol,
        equipos: equiposConUrls // 🔥 AGREGADO: Incluir equipos completos
      },
      token
    };

    console.log('📤 Enviando respuesta exitosa');
    console.log(`🏆 Respuesta incluye ${equiposConUrls.length} equipos`);
    console.log(`✅ [${new Date().toISOString()}] FIN - Login exitoso\n`);

    res.json(respuesta);

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR en login:`);
    console.error('💥 Error completo:', error);
    console.error('📋 Stack trace:', error.stack);
    console.log(`❌ [${new Date().toISOString()}] FIN - Login fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al iniciar sesión', 
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
    const usuario = await Usuario.findById(req.usuario.id).select('-password');
    
    if (!usuario) {
      console.log('❌ ERROR: Usuario no encontrado');
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    console.log('✅ Usuario encontrado:', usuario.email);
    
    const usuarioObj = usuario.toObject();
    usuarioObj.imagen = getImageUrlServer(usuarioObj.imagen, req);

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
  console.log('📎 Archivo recibido:', req.file ? 'SÍ' : 'NO');

  try {
    const { nombre, documento } = req.body;
    const usuarioId = req.params.id;

    console.log('🔍 Preparando datos para actualización...');
    const datosActualizados = {
      ...(nombre && { nombre }),
      ...(documento && { documento })
    };
    console.log('📝 Datos a actualizar:', datosActualizados);

    if (req.file) {
      console.log('🖼️ Procesando imagen subida...');
      console.log('📎 Información del archivo:', {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      });

      console.log('🔍 Detectando tipo de upload...');
      if (req.file.path && req.file.path.includes('cloudinary.com')) {
        console.log('☁️ CLOUDINARY detectado - Imagen subida a Cloudinary');
        console.log('🌐 URL de Cloudinary:', req.file.path);
        datosActualizados.imagen = req.file.path;
      } else {
        console.log('💾 LOCAL detectado - Imagen subida localmente');
        console.log('📁 Path local:', req.file.path);
        datosActualizados.imagen = req.file.filename;
      }

      const usuarioExistente = await Usuario.findById(usuarioId);

      // Eliminar imagen antigua si existe (solo si es local)
      if (usuarioExistente && usuarioExistente.imagen && !usuarioExistente.imagen.startsWith('http')) {
        console.log('🗑️ Eliminando imagen anterior...');
        const oldImagePath = path.join(__dirname, `../uploads/${usuarioExistente.imagen}`);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log('✅ Imagen anterior eliminada');
        }
      }

      // Guardar según el tipo de upload
      if (req.file.path && req.file.path.includes('cloudinary.com')) {
        console.log('☁️ Imagen subida a Cloudinary');
        datosActualizados.imagen = req.file.path;
      } else {
        console.log('💾 Imagen subida localmente');
        datosActualizados.imagen = req.file.filename;
      }
    }

    console.log('💾 Actualizando usuario en base de datos...');
    const usuario = await Usuario.findByIdAndUpdate(
      usuarioId,
      datosActualizados,
      { new: true, runValidators: true }
    );

    if (!usuario) {
      console.log('❌ ERROR: Usuario no encontrado');
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

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
}

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
}

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
}

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
    console.log('✅ Jugador encontrado:', jugador.email);

    console.log('🔍 Buscando equipo...');
    const equipo = await Equipo.findById(equipoId);
    if (!equipo) {
      console.log('❌ ERROR: Equipo no encontrado');
      return res.status(404).json({ mensaje: 'Equipo no encontrado' });
    }
    console.log('✅ Equipo encontrado:', equipo.nombre);
    console.log('📋 Categoría del equipo:', equipo.categoria);

    // 🔥 VALIDACIÓN 1: Verificar si jugador ya está inscrito
    console.log('🔍 Verificando si jugador ya está inscrito...');
    const yaInscrito = jugador.equipos.some(p => p.equipo.toString() === equipoId);
    if (yaInscrito) {
      console.log('❌ ERROR: Jugador ya está inscrito');
      return res.status(400).json({ mensaje: 'El jugador ya está inscrito en este equipo' });
    }

    // 🔥 VALIDACIÓN 2: Verificar número disponible
    console.log('🔍 Verificando número disponible...');
    const numeroExistente = await Usuario.findOne({
      'equipos.equipo': equipoId,
      'equipos.numero': numero
    });
    if (numeroExistente) {
      console.log('❌ ERROR: Número ya en uso');
      return res.status(400).json({ mensaje: 'El número ya está en uso por otro jugador en el equipo' });
    }

    // 🔥 VALIDACIÓN 3: Verificar reglas de categoría
    console.log('🔍 Validando reglas de categoría...');
    const reglaNueva = reglasCategorias[equipo.categoria];
    if (!reglaNueva) {
      console.log('❌ ERROR: Categoría no válida');
      return res.status(400).json({ mensaje: 'Categoría no válida' });
    }

    console.log('📋 Reglas de la categoría:', {
      sexoPermitido: reglaNueva.sexoPermitido,
      edadMin: reglaNueva.edadMin,
      edadMax: reglaNueva.edadMax
    });

    // 🔥 VALIDACIÓN 4: Extraer datos del CURP
    console.log('🔍 Extrayendo datos del CURP...');
    const curp = jugador.documento;
    
    if (!curp || curp.length !== 18) {
      console.log('❌ ERROR: CURP inválido');
      return res.status(400).json({ mensaje: 'CURP inválido' });
    }

    const fechaNacimientoCurp = curp.substring(4, 10);
    const siglo = fechaNacimientoCurp.substring(0, 2);
    const año = parseInt(siglo) <= 22 ? `20${siglo}` : `19${siglo}`;
    const mes = fechaNacimientoCurp.substring(2, 4);
    const dia = fechaNacimientoCurp.substring(4, 6);
    const fechaNacimiento = new Date(`${año}-${mes}-${dia}`);
    
    const sexoCurp = curp.charAt(10);
    const sexoJugador = sexoCurp === 'H' ? 'M' : sexoCurp === 'M' ? 'F' : null;

    if (!sexoJugador) {
      console.log('❌ ERROR: No se pudo determinar el sexo del CURP');
      return res.status(400).json({ mensaje: 'No se pudo determinar el sexo del CURP' });
    }

    const hoy = new Date();
    const edadJugador = hoy.getFullYear() - fechaNacimiento.getFullYear() - 
                      ((hoy.getMonth() < fechaNacimiento.getMonth() || 
                        (hoy.getMonth() === fechaNacimiento.getMonth() && hoy.getDate() < fechaNacimiento.getDate())) ? 1 : 0);

    console.log('📋 Datos extraídos del CURP:', {
      fechaNacimiento: fechaNacimiento.toISOString().split('T')[0],
      sexo: sexoJugador,
      edad: edadJugador
    });

    // 🔥 VALIDACIÓN 5: Verificar sexo permitido
    if (!reglaNueva.sexoPermitido.includes(sexoJugador)) {
      console.log('❌ ERROR: Sexo no permitido para esta categoría');
      return res.status(400).json({ 
        mensaje: `No puede inscribirse a la categoría ${getCategoryName(equipo.categoria)} por restricción de sexo.` 
      });
    }

    // 🔥 VALIDACIÓN 6: Verificar edad mínima
    if (edadJugador < reglaNueva.edadMin) {
      console.log('❌ ERROR: Edad menor a la mínima permitida');
      return res.status(400).json({ 
        mensaje: `Debe tener al menos ${reglaNueva.edadMin} años para inscribirse en la categoría ${getCategoryName(equipo.categoria)}.` 
      });
    }

    // 🔥 VALIDACIÓN 7: Verificar edad máxima (si aplica)
    if (reglaNueva.edadMax !== null && edadJugador > reglaNueva.edadMax) {
      console.log('❌ ERROR: Edad mayor a la máxima permitida');
      return res.status(400).json({ 
        mensaje: `No puede inscribirse en la categoría ${getCategoryName(equipo.categoria)} por restricción de edad máxima.` 
      });
    }

    // 🔥 VALIDACIÓN 8: Verificar que no esté en otro equipo de la misma categoría
    console.log('🔍 Verificando conflictos de categoría...');
    const equiposJugador = await Usuario.findById(usuarioId).populate('equipos.equipo', 'categoria nombre');
    
    if (equiposJugador && equiposJugador.equipos) {
      const equipoMismaCategoria = equiposJugador.equipos.find(eq => 
        eq.equipo && eq.equipo.categoria === equipo.categoria
      );
      
      if (equipoMismaCategoria) {
        console.log('❌ ERROR: Ya inscrito en equipo de la misma categoría');
        return res.status(400).json({ 
          mensaje: `Ya estás inscrito en el equipo "${equipoMismaCategoria.equipo.nombre}" de la categoría ${getCategoryName(equipo.categoria)}. No puedes estar en dos equipos de la misma categoría.` 
        });
      }
    }

    console.log('✅ Todas las validaciones pasaron');

    // 🔥 AGREGAR JUGADOR AL EQUIPO
    console.log('💾 Agregando jugador al equipo...');
    jugador.equipos.push({ equipo: equipoId, numero });
    await jugador.save();

    console.log('✅ Jugador agregado exitosamente');
    console.log(`🎉 ${jugador.nombre} agregado al equipo ${equipo.nombre} con número #${numero}`);
    console.log('📤 Enviando confirmación');
    console.log(`✅ [${new Date().toISOString()}] FIN - Jugador agregado\n`);

    return res.status(200).json({ 
      mensaje: 'Jugador agregado al equipo correctamente',
      jugador: {
        nombre: jugador.nombre,
        email: jugador.email,
        numero: numero
      },
      equipo: {
        nombre: equipo.nombre,
        categoria: getCategoryName(equipo.categoria)
      }
    });

  } catch (error) {
    console.log(`❌ [${new Date().toISOString()}] ERROR al agregar jugador:`);
    console.error('💥 Error completo:', error);
    console.error('📋 Stack trace:', error.stack);
    console.log(`❌ [${new Date().toISOString()}] FIN - Agregar jugador fallido\n`);
    
    res.status(500).json({ 
      mensaje: 'Error al agregar jugador al equipo', 
      error: error.message 
    });
  }
};