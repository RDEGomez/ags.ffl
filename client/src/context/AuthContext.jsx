// 📁 src/context/AuthContext.jsx - VERSIÓN CORREGIDA
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../config/axios';
import { setLogoutFunction } from '../helpers/logoutHelper';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 🔥 FUNCIÓN CORREGIDA - Cargar usuario desde localStorage al iniciar
  useEffect(() => {
    const checkAuth = async () => {
      console.log('\n🔍 === INICIO VERIFICACIÓN AUTH ===');
      
      const storedUser = localStorage.getItem('usuario');
      const storedToken = localStorage.getItem('token');
      setLogoutFunction(logout);
      
      console.log('📋 Datos en localStorage:');
      console.log('  👤 Usuario:', storedUser ? 'Presente' : 'Ausente');
      console.log('  🔑 Token:', storedToken ? 'Presente' : 'Ausente');
      
      if (storedToken && storedUser) {
        try {
          console.log('🔧 Configurando token en axios...');
          // 🔥 CORREGIDO: Configurar el token ANTES de hacer la petición
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

          const parsedUser = JSON.parse(storedUser);
          console.log('👤 Usuario parseado:', parsedUser);
          
          // 🔥 CORREGIDO: Verificar que el usuario tenga _id
          if (!parsedUser._id && !parsedUser.id) {
            console.log('❌ Usuario sin ID válido, reautenticando...');
            throw new Error('Usuario sin ID válido');
          }

          const userId = parsedUser._id || parsedUser.id;
          console.log(`🔍 Obteniendo datos actualizados del usuario: ${userId}`);
          
          const { data } = await axiosInstance.get(`/usuarios/${userId}`);
          console.log('✅ Datos de usuario obtenidos de la API:', data);

          // 🔥 IMPORTANTE: Establecer TANTO el usuario como el token
          setUsuario(data);
          setIsAuthenticated(true);
          
          console.log('✅ Usuario autenticado correctamente');
          console.log('  📋 Equipos del usuario:', data.equipos?.length || 0);
          
        } catch (error) {
          console.log('❌ Error en verificación de auth:', error);
          console.log('  🔍 Tipo de error:', error.response?.status || error.name);
          console.log('  📋 Mensaje:', error.response?.data?.mensaje || error.message);
          
          // 🔥 CORREGIDO: Limpiar datos en caso de error
          console.log('🧹 Limpiando datos de autenticación...');
          logout();
        }
      } else {
        console.log('❌ No hay token o usuario en localStorage');
        logout();
      }
      
      setLoading(false);
      console.log('🔚 === FIN VERIFICACIÓN AUTH ===\n');
    };

    checkAuth();
  }, []);

  // 🔥 FUNCIÓN CORREGIDA - Login
  const login = ({ usuario, token }) => {
    console.log('\n🚀 === EJECUTANDO LOGIN ===');
    console.log('👤 Usuario recibido:', usuario);
    console.log('🔑 Token recibido:', token ? 'Presente' : 'Ausente');
    
    // 🔥 CORREGIDO: Establecer estado primero
    setUsuario(usuario);
    setIsAuthenticated(true);
    
    // 🔥 CORREGIDO: Guardar en localStorage
    localStorage.setItem('usuario', JSON.stringify(usuario));
    localStorage.setItem('token', token);
    
    // 🔥 CORREGIDO: Configurar token para todas las peticiones futuras
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    console.log('✅ Login completado exitosamente');
    console.log('🔚 === FIN LOGIN ===\n');
  };

  // 🔥 FUNCIÓN CORREGIDA - Logout
  const logout = () => {
    console.log('\n🚪 === EJECUTANDO LOGOUT ===');
    
    setUsuario(null);
    setIsAuthenticated(false);
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    
    // 🔥 CORREGIDO: Eliminar el token de los headers
    delete axiosInstance.defaults.headers.common['Authorization'];

    console.log('✅ Logout completado');
    console.log('🔚 === FIN LOGOUT ===\n');
    
    navigate('/auth/login');
  };

  // Función para verificar si el usuario tiene un rol específico
  const tieneRol = (roles) => {
    if (!usuario || !usuario.rol) return false;
    
    if (Array.isArray(roles)) {
      return roles.includes(usuario.rol);
    }
    
    return usuario.rol === roles;
  };

  // 🔥 Función específica para verificar si es árbitro
  const esArbitro = () => {
    return usuario && usuario.rol === 'arbitro';
  };

  // 🔥 Función para verificar si puede gestionar equipos (admin y capitán)
  const puedeGestionarEquipos = () => {
    return usuario && ['admin', 'capitan'].includes(usuario.rol);
  };

  // 🔥 Función para verificar si puede gestionar árbitros (solo admin)
  const puedeGestionarArbitros = () => {
    return usuario && ['admin'].includes(usuario.rol);
  };

  // 🔥 Función para verificar si puede gestionar torneos (admin Y capitán)
  const puedeGestionarTorneos = () => {
    return usuario && ['admin'].includes(usuario.rol);
  };

  // 🔥 Función para verificar si puede gestionar usuarios (admin y capitán)
  const puedeGestionarUsuarios = () => {
    return usuario && ['admin', 'capitan'].includes(usuario.rol);
  };

  // 🔥 Validación por ID para edición de perfiles de usuarios
  const puedeEditarUsuario = (usuarioId, usuarioObjetivo = null) => {
    if (!usuario) return false;
    
    // Admin puede editar cualquier usuario
    if (usuario.rol === 'admin') return true;
    
    // Capitán NO puede editar admin
    if (usuario.rol === 'capitan') {
      if (usuarioObjetivo && usuarioObjetivo.rol === 'admin') return false;
      return true; // Puede editar otros usuarios
    }
    
    // Jugador y árbitro solo pueden editar su propio perfil
    return usuario._id === usuarioId;
  };

  // 🔥 Validación por ID para edición de perfiles de árbitros
  const puedeEditarArbitro = (arbitroUserId) => {
    if (!usuario) return false;
    
    // Admin puede editar cualquier árbitro
    if (usuario.rol === 'admin') return true;
    
    // Árbitro solo puede editar su propio perfil
    return usuario.rol === 'arbitro' && usuario._id === arbitroUserId;
  };

  // 🔥 Función para verificar si puede cambiar disponibilidad de árbitros
  const puedeCambiarDisponibilidadArbitro = (arbitroUserId) => {
    if (!usuario) return false;
    
    // Admin puede cambiar disponibilidad de cualquier árbitro
    if (usuario.rol === 'admin') return true;
    
    // Capitán puede cambiar disponibilidad de árbitros
    if (usuario.rol === 'capitan') return true;
    
    // Árbitro solo puede cambiar su propia disponibilidad
    return usuario.rol === 'arbitro' && usuario._id === arbitroUserId;
  };

  // 🔥 Función para verificar si puede eliminar usuarios
  const puedeEliminarUsuario = (usuarioObjetivo = null) => {
    if (!usuario) return false;
    
    // Admin puede eliminar cualquier usuario (excepto él mismo podríamos agregar)
    if (usuario.rol === 'admin') return true;
    
    // Capitán NO puede eliminar admin
    if (usuario.rol === 'capitan') {
      if (usuarioObjetivo && usuarioObjetivo.rol === 'admin') return false;
      return true;
    }
    
    return false; // Jugadores y árbitros no pueden eliminar usuarios
  };

  // 🔥 Función para verificar si puede eliminar árbitros
  const puedeEliminarArbitro = () => {
    return usuario && ['admin'].includes(usuario.rol);
  };

  const puedeInscribirseEquipo = (usuarioIdAInscribir = null) => {
    if (!usuario) return false;
    
    // Admin y capitán pueden inscribir a cualquiera
    if (['admin', 'capitan'].includes(usuario.rol)) return true;
    
    // Jugador solo puede inscribirse a sí mismo
    if (usuario.rol === 'jugador') {
      // Si no se especifica usuarioIdAInscribir, asumimos que es para sí mismo
      if (!usuarioIdAInscribir) return true;
      
      // Verificar que sea el mismo usuario
      return usuario._id === usuarioIdAInscribir || usuario.id === usuarioIdAInscribir;
    }
    
    return false;
  };

  // 🔥 Función para verificar permisos de gestión de partidos
  const puedeGestionarPartidos = () => {
    return usuario && ['admin', 'capitan'].includes(usuario.rol);
  };

  // 🔥 Función para verificar si puede operar partidos en vivo (admin y árbitro)
  const puedeOperarPartidosEnVivo = () => {
    return usuario && ['admin', 'arbitro'].includes(usuario.rol);
  };

  // 🔥 NUEVA FUNCIÓN: Obtener token del localStorage
  const getStoredToken = () => {
    return localStorage.getItem('token');
  };

  // 🔥 NUEVA FUNCIÓN: Verificar si hay token válido
  const tieneTokenValido = () => {
    const storedToken = getStoredToken();
    return !!storedToken && !!usuario;
  };

  // 🔥 Función para debugging - muestra información del usuario actual
  const debugUsuario = () => {
    const storedToken = getStoredToken();
    
    console.log('🔍 DEBUG AuthContext:');
    console.log('  Usuario:', usuario);
    console.log('  Rol:', usuario?.rol);
    console.log('  isAuthenticated:', isAuthenticated);
    console.log('  Token en localStorage:', storedToken ? 'Presente' : 'Ausente');
    console.log('  Token en axios headers:', axiosInstance.defaults.headers.common['Authorization'] ? 'Configurado' : 'No configurado');
    console.log('  puedeGestionarTorneos:', puedeGestionarTorneos());
    console.log('  puedeGestionarPartidos:', puedeGestionarPartidos());
    console.log('  puedeGestionarEquipos:', puedeGestionarEquipos());
    console.log('  puedeGestionarArbitros:', puedeGestionarArbitros());
    
    return {
      usuario,
      rol: usuario?.rol,
      isAuthenticated,
      tokenEnLocalStorage: !!storedToken,
      tokenEnAxios: !!axiosInstance.defaults.headers.common['Authorization'],
      permisos: {
        torneos: puedeGestionarTorneos(),
        partidos: puedeGestionarPartidos(),
        equipos: puedeGestionarEquipos(),
        arbitros: puedeGestionarArbitros()
      }
    };
  };

  // 🔥 FUNCIÓN ADICIONAL: Refrescar datos del usuario
  const refrescarUsuario = async () => {
    if (!usuario || !tieneTokenValido()) {
      console.log('❌ No se puede refrescar: usuario o token no válido');
      return false;
    }

    try {
      console.log('🔄 Refrescando datos del usuario...');
      const userId = usuario._id || usuario.id;
      const { data } = await axiosInstance.get(`/usuarios/${userId}`);
      
      setUsuario(data);
      localStorage.setItem('usuario', JSON.stringify(data));
      
      console.log('✅ Datos del usuario refrescados');
      return true;
    } catch (error) {
      console.error('❌ Error al refrescar usuario:', error);
      if (error.response?.status === 401) {
        logout();
      }
      return false;
    }
  };

  // Valor expuesto por el contexto
  const authContextValue = {
    usuario,
    isAuthenticated,
    loading,
    login,
    logout,
    tieneRol,
    esArbitro,
    // Funciones de gestión general
    puedeGestionarEquipos,
    puedeGestionarArbitros,
    puedeGestionarTorneos,
    puedeGestionarUsuarios,
    puedeGestionarPartidos,
    puedeOperarPartidosEnVivo,
    // Funciones de edición por ID
    puedeEditarUsuario,
    puedeEditarArbitro,
    // Funciones específicas
    puedeCambiarDisponibilidadArbitro,
    puedeEliminarUsuario,
    puedeEliminarArbitro,
    puedeInscribirseEquipo,
    // 🔥 NUEVAS FUNCIONES
    getStoredToken,
    tieneTokenValido,
    refrescarUsuario,
    // Función de debugging
    debugUsuario
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);