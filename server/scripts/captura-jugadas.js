#!/usr/bin/env node

/**
 * 🏈 SCRIPT DE CAPTURA MASIVA DE JUGADAS
 * 
 * Este script facilita la captura de jugadas utilizando un formato de string delimitado
 * para agilizar la carga de datos en el sistema de gestión de football americano.
 * 
 * Formato del string:
 * equipo|tipo_jugada|jugadorPrincipal|jugadorSecundario|puntos|numero_repeticiones
 * 
 * Ejemplo:
 * Lobos|pase_completo|12|8|0|3
 * 
 * Author: Sistema de captura automatizada
 * Date: 2025
 */

const readline = require('readline');
const axios = require('axios');
const colors = require('colors');
const fs = require('fs');
const path = require('path');

// 🔧 CONFIGURACIÓN - MODIFICAR AQUÍ TUS DATOS
const CONFIG = {
  // 🌐 URL base de tu API (SIN la ruta /auth/login al final)
  API_BASE_URL: 'https://agsffl-575f8.ondigitalocean.app/api',
  
  // 📝 Ejemplos de configuraciones comunes:
  // 'http://localhost:5000/api'        ← Login en: /auth/login
  // 'http://localhost:5000'            ← Login en: /api/auth/login  
  // 'http://localhost:5000/api/auth'   ← Login en: /login
  // 'http://localhost:3000/api'        ← Puerto diferente
  
  TIMEOUT: 30000,
  // 🔐 CONFIGURACIÓN DE AUTENTICACIÓN
  REQUIRE_AUTH: true, // Cambiar a false si no necesitas autenticación
  TOKEN_FILE: '.auth_token' // Archivo donde se guarda el token temporalmente
};

// 🎨 COLORES Y EMOJIS
const UI = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  football: '🏈',
  trophy: '🏆',
  loading: '⏳'
};

// 📝 TIPOS DE JUGADA VÁLIDOS
const TIPOS_JUGADA = [
  'pase_completo',
  'pase_incompleto', 
  'corrida',
  'intercepcion',
  'touchdown',
  'conversion_1pt',
  'conversion_2pt',
  'safety',
  'sack',
  'tackleo'
];

// 🏗️ CLASE PRINCIPAL
class CapturaJugadas {
  constructor() {
    this.partidoId = null;
    this.partidoInfo = null;
    this.token = null;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // Configurar axios
    this.api = axios.create({
      baseURL: CONFIG.API_BASE_URL,
      timeout: CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 🔐 Interceptor para agregar token automáticamente
    this.api.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
        console.log(`🔍 DEBUG - Agregando token a request: ${config.method.toUpperCase()} ${config.url}`.gray);
      } else {
        console.log(`🔍 DEBUG - Sin token para request: ${config.method.toUpperCase()} ${config.url}`.gray);
      }
      return config;
    });

    // 🔐 Interceptor para manejar errores de autenticación
    this.api.interceptors.response.use(
      (response) => {
        console.log(`🔍 DEBUG - Response exitosa: ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`.gray);
        return response;
      },
      (error) => {
        console.log(`🔍 DEBUG - Error response: ${error.response?.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`.gray);
        if (error.response?.data) {
          console.log(`🔍 DEBUG - Error data:`, error.response.data);
        }
        
        if (error.response && error.response.status === 401) {
          this.mostrarError('Token de autenticación inválido o expirado');
          this.token = null;
          this.eliminarTokenGuardado();
        }
        return Promise.reject(error);
      }
    );
  }

  // 🎬 MÉTODO PRINCIPAL
  async iniciar() {
    console.clear();
    this.mostrarBanner();
    
    try {
      // 🔐 Manejar autenticación si es requerida
      if (CONFIG.REQUIRE_AUTH) {
        await this.manejarAutenticacion();
      }
      
      await this.solicitarPartidoId();
      await this.mostrarMenuPrincipal();
    } catch (error) {
      this.mostrarError(`Error fatal: ${error.message}`);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  // 🎨 BANNER DE BIENVENIDA
  mostrarBanner() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    ${UI.football} CAPTURA DE JUGADAS ${UI.football}                   ║
║                                                              ║
║              Sistema de carga masiva de jugadas             ║
║                     Football Americano                      ║
╚══════════════════════════════════════════════════════════════╝
    `.cyan);
  }

  // 🔐 MANEJO DE AUTENTICACIÓN
  async manejarAutenticacion() {
    console.log(`\n🔐 AUTENTICACIÓN REQUERIDA`.yellow);
    console.log(`${'─'.repeat(50)}`);
    console.log(`🌐 API: ${CONFIG.API_BASE_URL}`.gray);

    // Intentar cargar token guardado
    await this.cargarTokenGuardado();

    if (this.token) {
      console.log(`${UI.info} Verificando token guardado...`.blue);
      
      try {
        // Verificar si el token sigue siendo válido
        const response = await this.api.get('/status');
        this.mostrarExito('Token válido - autenticación exitosa');
        console.log(`🔍 DEBUG - Token verificado correctamente`.gray);
        return;
      } catch (error) {
        console.log(`🔍 DEBUG - Token expirado/inválido: ${error.response?.status}`.gray);
        this.mostrarWarning('Token guardado ha expirado');
        this.token = null;
      }
    }

    // Solicitar nuevas credenciales
    await this.solicitarCredenciales();
  }

  // 🔑 SOLICITAR CREDENCIALES DE LOGIN
  async solicitarCredenciales() {
    console.log(`\n📧 Ingrese sus credenciales:`);
    
    const email = await this.pregunta('Email: ');
    const password = await this.pregunta('Contraseña: '); // Simplificado - sin ocultar

    if (!email.trim() || !password.trim()) {
      this.mostrarError('Email y contraseña son requeridos');
      await this.solicitarCredenciales();
      return;
    }

    console.log(`${UI.loading} Autenticando...`.yellow);

    try {
      const response = await this.api.post('/auth/login', {
        email: email.trim(),
        password: password.trim()
      });

      if (response.data.token) {
        this.token = response.data.token;
        await this.guardarToken();
        
        this.mostrarExito('¡Autenticación exitosa!');
        
        // Mostrar información del usuario si está disponible
        if (response.data.usuario) {
          console.log(`👤 Bienvenido: ${response.data.usuario.nombre || email}`.green);
        }
      } else {
        throw new Error('No se recibió token de autenticación');
      }

    } catch (error) {
      console.log('🔍 DEBUG - Error completo:', error.response?.data || error.message);
      
      if (error.response && error.response.status === 401) {
        this.mostrarError('Credenciales inválidas');
      } else if (error.response && error.response.status === 403) {
        this.mostrarError('Acceso prohibido (403)');
        console.log('💡 Posibles causas:'.yellow);
        console.log('   • Usuario bloqueado o inactivo');
        console.log('   • API requiere campos adicionales (rol, etc.)');
        console.log('   • Restricciones de acceso');
        console.log('   • Middleware de validación');
      } else if (error.response) {
        this.mostrarError(`Error ${error.response.status}: ${error.response.data?.mensaje || error.message}`);
        if (error.response.data) {
          console.log('🔍 DEBUG - Respuesta del servidor:', JSON.stringify(error.response.data, null, 2));
        }
      } else {
        this.mostrarError(`Error de conexión: ${error.message}`);
      }
      
      const reintentar = await this.pregunta('\n¿Desea intentar nuevamente? (s/N): ');
      if (reintentar.toLowerCase() === 's') {
        await this.solicitarCredenciales();
      } else {
        throw new Error('Autenticación requerida para continuar');
      }
    }
  }

  // 💾 GUARDAR TOKEN EN ARCHIVO TEMPORAL
  async guardarToken() {
    try {
      const tokenData = {
        token: this.token,
        timestamp: Date.now(),
        api_url: CONFIG.API_BASE_URL
      };
      
      fs.writeFileSync(CONFIG.TOKEN_FILE, JSON.stringify(tokenData, null, 2));
      console.log(`${UI.info} Token guardado para futuras sesiones`.gray);
    } catch (error) {
      this.mostrarWarning('No se pudo guardar el token para futuras sesiones');
    }
  }

  // 📖 CARGAR TOKEN GUARDADO
  async cargarTokenGuardado() {
    try {
      if (!fs.existsSync(CONFIG.TOKEN_FILE)) {
        return;
      }

      const tokenData = JSON.parse(fs.readFileSync(CONFIG.TOKEN_FILE, 'utf8'));
      
      // Verificar que el token sea para la misma API
      if (tokenData.api_url === CONFIG.API_BASE_URL) {
        // Verificar que no sea muy antiguo (24 horas)
        const horasTranscurridas = (Date.now() - tokenData.timestamp) / (1000 * 60 * 60);
        
        if (horasTranscurridas < 24) {
          this.token = tokenData.token;
          console.log(`${UI.info} Token anterior encontrado`.gray);
        } else {
          this.eliminarTokenGuardado();
        }
      }
    } catch (error) {
      // Si hay error leyendo el archivo, simplemente ignorarlo
      this.eliminarTokenGuardado();
    }
  }

  // 🗑️ ELIMINAR TOKEN GUARDADO
  eliminarTokenGuardado() {
    try {
      if (fs.existsSync(CONFIG.TOKEN_FILE)) {
        fs.unlinkSync(CONFIG.TOKEN_FILE);
      }
    } catch (error) {
      // Ignorar errores al eliminar
    }
  }

  // 🆔 SOLICITAR ID DEL PARTIDO
  async solicitarPartidoId() {
    while (!this.partidoId) {
      const partidoId = await this.pregunta('\n📋 Ingrese el ID del partido: ');
      
      if (!partidoId.trim()) {
        this.mostrarError('El ID del partido es requerido');
        continue;
      }

      console.log(`${UI.loading} Validando partido...`.yellow);
      
      try {
        const response = await this.api.get(`/partidos/${partidoId.trim()}`);
        
        // 🔥 CORREGIR: La respuesta viene con estructura { partido: {...} }
        if (response.data.partido) {
          this.partidoInfo = response.data.partido;
        } else {
          // Fallback si viene directo
          this.partidoInfo = response.data;
        }
        
        this.partidoId = partidoId.trim();
        
        console.log(`🔍 DEBUG - Estructura de partidoInfo:`, JSON.stringify(this.partidoInfo, null, 2));
        
        this.mostrarExito('¡Partido encontrado!');
        this.mostrarInfoPartido();
        
      } catch (error) {
        console.log(`🔍 DEBUG - Error al buscar partido:`, error.response?.data || error.message);
        if (error.response && error.response.status === 404) {
          this.mostrarError('Partido no encontrado. Verifique el ID.');
        } else if (error.response && error.response.status === 401) {
          this.mostrarError('Token de autenticación inválido. Cerrando sesión...');
          this.token = null;
          this.eliminarTokenGuardado();
          throw new Error('Autenticación requerida');
        } else {
          this.mostrarError(`Error al buscar partido: ${error.message}`);
        }
      }
    }
  }

  // 📊 MOSTRAR INFORMACIÓN DEL PARTIDO
  mostrarInfoPartido() {
    if (!this.partidoInfo) {
      console.log('❌ No hay información del partido disponible');
      return;
    }

    const { equipoLocal, equipoVisitante, marcador, estado, fechaHora } = this.partidoInfo;
    
    // Nombres seguros de los equipos
    const nombreLocal = equipoLocal?.nombre || equipoLocal?.name || 'Equipo Local';
    const nombreVisitante = equipoVisitante?.nombre || equipoVisitante?.name || 'Equipo Visitante';
    
    // Marcador seguro
    const marcadorLocal = marcador?.local ?? 0;
    const marcadorVisitante = marcador?.visitante ?? 0;
    
    // Fecha segura
    let fechaFormateada = 'Fecha no disponible';
    if (fechaHora) {
      try {
        fechaFormateada = new Date(fechaHora).toLocaleDateString('es-ES');
      } catch (error) {
        fechaFormateada = fechaHora.toString();
      }
    }
    
    console.log(`
${'═'.repeat(60).blue}
${UI.football} INFORMACIÓN DEL PARTIDO
${'═'.repeat(60).blue}
🏠 Local: ${nombreLocal.green} (${marcadorLocal.toString().bold})
✈️  Visitante: ${nombreVisitante.cyan} (${marcadorVisitante.toString().bold})
📅 Fecha: ${fechaFormateada.yellow}
🔴 Estado: ${(estado || 'Sin estado').toUpperCase().magenta}
📊 Jugadas registradas: ${(this.partidoInfo.jugadas?.length || 0).toString().bold}

📋 IDs para usar en las jugadas:
   🏠 Local (${nombreLocal}): ${equipoLocal?._id || equipoLocal || 'ID no disponible'}
   ✈️  Visitante (${nombreVisitante}): ${equipoVisitante?._id || equipoVisitante || 'ID no disponible'}
${'═'.repeat(60).blue}
    `);
  }

  // 🔄 MENÚ PRINCIPAL
  async mostrarMenuPrincipal() {
    while (true) {
      const menuAuth = CONFIG.REQUIRE_AUTH ? `4. 🔓 Cerrar sesión
5. ${UI.error} Salir` : `3. ${UI.error} Salir`;
      
      console.log(`
${UI.football} MENÚ PRINCIPAL
${'─'.repeat(40)}
1. ${UI.success} Capturar nueva jugada
2. 🔄 Cambiar partido
3. 📊 Ver info del partido
${menuAuth}
      `.white);

      const opcion = await this.pregunta('Seleccione una opción: ');
      
      switch (opcion.trim()) {
        case '1':
          await this.capturarJugada();
          break;
        case '2':
          await this.cambiarPartido();
          break;
        case '3':
          this.mostrarInfoPartido();
          break;
        case '4':
          if (CONFIG.REQUIRE_AUTH) {
            await this.cerrarSesion();
            break;
          } else {
            console.log(`\n${UI.success} ¡Hasta luego! ${UI.football}`.green);
            return;
          }
        case '5':
          if (CONFIG.REQUIRE_AUTH) {
            console.log(`\n${UI.success} ¡Hasta luego! ${UI.football}`.green);
            return;
          }
          // Fall through para opción inválida
        default:
          const maxOpcion = CONFIG.REQUIRE_AUTH ? 5 : 3;
          this.mostrarError(`Opción inválida. Seleccione 1-${maxOpcion}.`);
      }
    }
  }

  // 🔓 CERRAR SESIÓN
  async cerrarSesion() {
    this.token = null;
    this.eliminarTokenGuardado();
    this.mostrarExito('Sesión cerrada correctamente');
    
    const continuar = await this.pregunta('\n¿Desea iniciar sesión nuevamente? (s/N): ');
    if (continuar.toLowerCase() === 's') {
      await this.manejarAutenticacion();
    } else {
      console.log(`\n${UI.success} ¡Hasta luego! ${UI.football}`.green);
      process.exit(0);
    }
  }

  // ⚡ CAPTURAR NUEVA JUGADA
  async capturarJugada() {
    console.log(`
${UI.football} CAPTURA DE JUGADA
${'─'.repeat(50)}
📝 FORMATO OPCIÓN 1 (por nombre): equipo|tipo_jugada|jugadorPrincipal|jugadorSecundario|puntos|repeticiones
📝 FORMATO OPCIÓN 2 (por ID): equipoID|tipo_jugada|jugadorPrincipal|jugadorSecundario|puntos|repeticiones

${UI.info} Ejemplo por nombre: ${`Lobos|pase_completo|12|8|0|3`.yellow}
${UI.info} Ejemplo por ID: ${`507f1f77bcf86cd799439011|pase_completo|12|8|0|3`.yellow}

💡 Si los nombres de equipo aparecen como "undefined", usa el formato por ID.

📋 IDs de equipos en este partido:
   Local: ${this.partidoInfo.equipoLocal?._id || this.partidoInfo.equipoLocal || 'No disponible'}
   Visitante: ${this.partidoInfo.equipoVisitante?._id || this.partidoInfo.equipoVisitante || 'No disponible'}

📋 Tipos de jugada válidos:
${TIPOS_JUGADA.map((tipo, i) => `   ${(i + 1).toString().padStart(2)}. ${tipo}`).join('\n').gray}
    `);

    const stringJugada = await this.pregunta('\n🏈 Ingrese la jugada: ');
    
    if (!stringJugada.trim()) {
      this.mostrarError('No se ingresó ninguna jugada');
      return;
    }

    try {
      const jugadaParseada = this.parsearJugada(stringJugada.trim());
      await this.validarYProcesarJugada(jugadaParseada);
    } catch (error) {
      this.mostrarError(error.message);
    }
  }

  // 🔍 PARSEAR STRING DE JUGADA
  parsearJugada(stringJugada) {
    const partes = stringJugada.split('|');
    
    if (partes.length !== 6) {
      throw new Error(`Formato incorrecto. Se esperan 6 campos separados por |, se recibieron ${partes.length}`);
    }

    const [equipo, tipoJugada, jugadorPrincipal, jugadorSecundario, puntos, repeticiones] = partes;

    // Validaciones básicas
    if (!equipo.trim()) throw new Error('El nombre del equipo es requerido');
    if (!tipoJugada.trim()) throw new Error('El tipo de jugada es requerido');
    if (!jugadorPrincipal.trim()) throw new Error('El jugador principal es requerido');
    
    if (!TIPOS_JUGADA.includes(tipoJugada.trim())) {
      throw new Error(`Tipo de jugada inválido: ${tipoJugada}. Tipos válidos: ${TIPOS_JUGADA.join(', ')}`);
    }

    const puntosNum = puntos.trim() ? parseInt(puntos.trim()) : 0;
    const repeticionesNum = repeticiones.trim() ? parseInt(repeticiones.trim()) : 1;

    if (isNaN(puntosNum) || puntosNum < 0) {
      throw new Error('Los puntos deben ser un número mayor o igual a 0');
    }

    if (isNaN(repeticionesNum) || repeticionesNum < 1) {
      throw new Error('El número de repeticiones debe ser mayor a 0');
    }

    return {
      equipo: equipo.trim(),
      tipoJugada: tipoJugada.trim(),
      jugadorPrincipal: jugadorPrincipal.trim(),
      jugadorSecundario: jugadorSecundario.trim() || null,
      puntos: puntosNum,
      repeticiones: repeticionesNum
    };
  }

  // ✅ VALIDAR Y PROCESAR JUGADA
  async validarYProcesarJugada(jugada) {
    console.log(`\n${UI.loading} Validando jugada...`.yellow);
    
    try {
      // 1. Validar que el equipo existe en el partido
      console.log(`🔍 DEBUG - Validando equipo: "${jugada.equipo}"`);
      console.log(`🔍 DEBUG - Equipos disponibles:`);
      console.log(`   Local: ${this.partidoInfo.equipoLocal?.nombre || 'undefined'}`);
      console.log(`   Visitante: ${this.partidoInfo.equipoVisitante?.nombre || 'undefined'}`);
      
      const equipoId = this.validarEquipo(jugada.equipo);
      console.log(`✅ Equipo validado - ID: ${equipoId}`);
      
      // 2. Mostrar resumen de la jugada
      this.mostrarResumenJugada(jugada);
      
      // 3. Confirmar antes de procesar
      const confirmar = await this.pregunta(`\n❓ ¿Confirma la captura de ${jugada.repeticiones} jugada(s)? (s/N): `);
      
      if (confirmar.toLowerCase() !== 's') {
        this.mostrarInfo('Captura cancelada');
        return;
      }

      // 4. Procesar las repeticiones
      console.log(`\n${UI.loading} Procesando ${jugada.repeticiones} jugada(s)...`.yellow);
      
      let exitosas = 0;
      let errores = 0;
      
      for (let i = 1; i <= jugada.repeticiones; i++) {
        try {
          await this.registrarJugadaEnAPI(jugada, equipoId);
          exitosas++;
          
          if (jugada.repeticiones > 1) {
            process.stdout.write(`${UI.success}`.green);
          }
          
        } catch (error) {
          errores++;
          process.stdout.write(`${UI.error}`.red);
          console.error(`\nError en jugada ${i}: ${error.message}`.red);
          console.log(`🔍 DEBUG - Error detallado:`, error.response?.data || error);
        }
        
        // Pequeña pausa entre requests para no sobrecargar la API
        if (i < jugada.repeticiones) {
          await this.esperar(100);
        }
      }
      
      // 5. Mostrar resultado final
      console.log(`\n\n${UI.trophy} RESULTADO:`);
      console.log(`   ${UI.success} Exitosas: ${exitosas.toString().green}`);
      if (errores > 0) {
        console.log(`   ${UI.error} Con errores: ${errores.toString().red}`);
      }
      
      // 6. Actualizar información del partido
      if (exitosas > 0) {
        await this.actualizarInfoPartido();
      }
      
    } catch (error) {
      console.log(`🔍 DEBUG - Error completo en validarYProcesarJugada:`);
      console.log(`   Mensaje: ${error.message}`);
      console.log(`   Stack:`, error.stack);
      if (error.response) {
        console.log(`   Response status: ${error.response.status}`);
        console.log(`   Response data:`, error.response.data);
      }
      
      this.mostrarError(`Error al procesar jugada: ${error.message}`);
    }
  }

  // 🏟️ VALIDAR QUE EL EQUIPO EXISTE EN EL PARTIDO (NOMBRES O IDS)
  validarEquipo(equipoInput) {
    console.log(`🔍 DEBUG - Iniciando validación de equipo: "${equipoInput}"`);
    
    if (!this.partidoInfo) {
      throw new Error('No hay información del partido cargada');
    }
    
    const { equipoLocal, equipoVisitante } = this.partidoInfo;
    
    console.log(`🔍 DEBUG - Información de equipos:`);
    console.log(`   Local:`, equipoLocal);
    console.log(`   Visitante:`, equipoVisitante);
    
    if (!equipoLocal || !equipoVisitante) {
      throw new Error('Información de equipos incompleta en el partido');
    }
    
    // Extraer IDs
    const localId = equipoLocal._id || equipoLocal.id || equipoLocal;
    const visitanteId = equipoVisitante._id || equipoVisitante.id || equipoVisitante;
    
    // Extraer nombres (si están disponibles)
    const localNombre = equipoLocal.nombre || equipoLocal.name || null;
    const visitanteNombre = equipoVisitante.nombre || equipoVisitante.name || null;
    
    console.log(`🔍 DEBUG - IDs extraídos:`);
    console.log(`   Local ID: ${localId}`);
    console.log(`   Visitante ID: ${visitanteId}`);
    console.log(`   Local Nombre: ${localNombre}`);
    console.log(`   Visitante Nombre: ${visitanteNombre}`);
    
    // OPCIÓN 1: Buscar por ID exacto
    if (equipoInput === localId || equipoInput === localId.toString()) {
      console.log(`✅ Equipo encontrado por ID como LOCAL`);
      return localId;
    }
    
    if (equipoInput === visitanteId || equipoInput === visitanteId.toString()) {
      console.log(`✅ Equipo encontrado por ID como VISITANTE`);
      return visitanteId;
    }
    
    // OPCIÓN 2: Buscar por nombre (si están disponibles)
    if (localNombre && visitanteNombre) {
      const inputNormalizado = equipoInput.toLowerCase().trim();
      const localNormalizado = localNombre.toLowerCase().trim();
      const visitanteNormalizado = visitanteNombre.toLowerCase().trim();
      
      if (localNormalizado === inputNormalizado) {
        console.log(`✅ Equipo encontrado por NOMBRE como LOCAL`);
        return localId;
      }
      
      if (visitanteNormalizado === inputNormalizado) {
        console.log(`✅ Equipo encontrado por NOMBRE como VISITANTE`);
        return visitanteId;
      }
    }
    
    // Si no encuentra match, mostrar opciones disponibles
    console.log(`❌ No se encontró equipo para "${equipoInput}"`);
    
    let mensaje = `El equipo "${equipoInput}" no se encuentra en este partido.\n\n`;
    
    if (localNombre && visitanteNombre) {
      mensaje += `📋 Equipos válidos (por nombre):\n`;
      mensaje += `  • ${localNombre}\n`;
      mensaje += `  • ${visitanteNombre}\n\n`;
    }
    
    mensaje += `📋 Equipos válidos (por ID):\n`;
    mensaje += `  • ${localId} ${localNombre ? `(${localNombre})` : '(Local)'}\n`;
    mensaje += `  • ${visitanteId} ${visitanteNombre ? `(${visitanteNombre})` : '(Visitante)'}\n\n`;
    mensaje += `💡 Tip: Copia y pega exactamente uno de los IDs o nombres de arriba.`;
    
    throw new Error(mensaje);
  }

  // 📋 MOSTRAR RESUMEN DE LA JUGADA
  mostrarResumenJugada(jugada) {
    // Intentar obtener nombre del equipo o mostrar ID
    let nombreEquipo = jugada.equipo;
    
    try {
      const equipoId = jugada.equipo;
      const { equipoLocal, equipoVisitante } = this.partidoInfo;
      
      const localId = equipoLocal._id || equipoLocal.id || equipoLocal;
      const visitanteId = equipoVisitante._id || equipoVisitante.id || equipoVisitante;
      
      if (equipoId === localId || equipoId === localId.toString()) {
        nombreEquipo = equipoLocal.nombre || equipoLocal.name || `Local (${localId})`;
      } else if (equipoId === visitanteId || equipoId === visitanteId.toString()) {
        nombreEquipo = equipoVisitante.nombre || equipoVisitante.name || `Visitante (${visitanteId})`;
      }
    } catch (error) {
      // Si hay error, mantener el nombre/ID original
    }
    
    console.log(`
${UI.football} RESUMEN DE LA JUGADA
${'─'.repeat(40)}
🏟️  Equipo: ${nombreEquipo.toString().green}
🎯 Tipo: ${jugada.tipoJugada.cyan}
👤 Principal: #${jugada.jugadorPrincipal.toString().bold}
👥 Secundario: ${jugada.jugadorSecundario ? `#${jugada.jugadorSecundario}` : 'N/A'.gray}
🏆 Puntos: ${jugada.puntos.toString().yellow}
🔄 Repeticiones: ${jugada.repeticiones.toString().magenta}
${'─'.repeat(40)}
    `);
  }

  // 🌐 REGISTRAR JUGADA EN LA API
  async registrarJugadaEnAPI(jugada, equipoId) {
    const jugadaData = {
      tipoJugada: jugada.tipoJugada,
      equipoEnPosesion: equipoId,
      numeroJugadorPrincipal: parseInt(jugada.jugadorPrincipal),
      ...(jugada.jugadorSecundario && { 
        numeroJugadorSecundario: parseInt(jugada.jugadorSecundario) 
      }),
      resultado: {
        puntos: jugada.puntos,
        touchdown: jugada.tipoJugada === 'touchdown' || jugada.puntos === 6,
        intercepcion: jugada.tipoJugada === 'intercepcion',
        sack: jugada.tipoJugada === 'sack'
      },
      descripcion: this.generarDescripcionJugada(jugada)
    };

    console.log(`🔍 DEBUG - Enviando jugada a API:`, JSON.stringify(jugadaData, null, 2));

    // Usar el endpoint estándar de registro de jugadas (no necesitamos uno especial para masivo)
    const response = await this.api.post(
      `/partidos/${this.partidoId}/jugadas`, 
      jugadaData
    );
    
    console.log(`✅ Respuesta de API:`, response.data);
    return response.data;
  }

  // 📝 GENERAR DESCRIPCIÓN AUTOMÁTICA DE LA JUGADA
  generarDescripcionJugada(jugada) {
    const principal = `#${jugada.jugadorPrincipal}`;
    const secundario = jugada.jugadorSecundario ? ` a #${jugada.jugadorSecundario}` : '';
    
    switch (jugada.tipoJugada) {
      case 'pase_completo':
        return `Pase completo de ${principal}${secundario}`;
      case 'pase_incompleto':
        return `Pase incompleto de ${principal}`;
      case 'corrida':
        return `Corrida de ${principal}`;
      case 'intercepcion':
        return `Intercepción de ${principal}${secundario ? ` sobre pase de${secundario}` : ''}`;
      case 'touchdown':
        return `Touchdown de ${principal}${secundario}`;
      case 'sack':
        return `Sack de ${principal}`;
      case 'tackleo':
        return `Tackleo de ${principal}`;
      default:
        return `${jugada.tipoJugada} - ${principal}${secundario}`;
    }
  }

  // 🔄 CAMBIAR PARTIDO
  async cambiarPartido() {
    this.partidoId = null;
    this.partidoInfo = null;
    console.log(`\n${UI.info} Cambiando partido...`.blue);
    await this.solicitarPartidoId();
  }

  // 🔄 ACTUALIZAR INFORMACIÓN DEL PARTIDO
  async actualizarInfoPartido() {
    try {
      console.log(`🔄 Actualizando información del partido...`.gray);
      const response = await this.api.get(`/partidos/${this.partidoId}`);
      
      // 🔥 CORREGIR: La respuesta viene con estructura { partido: {...} }
      if (response.data.partido) {
        this.partidoInfo = response.data.partido;
      } else {
        // Fallback si viene directo
        this.partidoInfo = response.data;
      }
      
      console.log(`✅ Información actualizada`.gray);
    } catch (error) {
      console.log(`🔍 DEBUG - Error al actualizar partido:`, error.response?.data || error.message);
      this.mostrarWarning('No se pudo actualizar la información del partido');
    }
  }

  // 🛠️ UTILIDADES
  pregunta(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  mostrarExito(mensaje) {
    console.log(`\n${UI.success} ${mensaje}`.green);
  }

  mostrarError(mensaje) {
    console.log(`\n${UI.error} ${mensaje}`.red);
  }

  mostrarWarning(mensaje) {
    console.log(`\n${UI.warning} ${mensaje}`.yellow);
  }

  mostrarInfo(mensaje) {
    console.log(`\n${UI.info} ${mensaje}`.blue);
  }
}

// 🚀 EJECUCIÓN
async function main() {
  try {
    const captura = new CapturaJugadas();
    await captura.iniciar();
  } catch (error) {
    console.error(`\n${UI.error} Error fatal:`.red, error.message);
    process.exit(1);
  }
}

// Verificar dependencias
try {
  require('axios');
  require('colors');
} catch (error) {
  console.error(`
❌ DEPENDENCIAS FALTANTES

Para usar este script, instala las dependencias requeridas:

npm install axios colors

O si usas yarn:

yarn add axios colors
  `.red);
  process.exit(1);
}

// Solo ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = CapturaJugadas;