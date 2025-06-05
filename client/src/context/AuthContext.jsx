// 📁 src/context/AuthContext.jsx - CORRECCIÓN DE PERMISOS
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../config/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Cargar usuario desde localStorage al iniciar
  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('usuario');
      const storedToken = localStorage.getItem('token');
      
      if (storedToken) {
        try {
          var parsedUser = JSON.parse(storedUser);
          // Configurar el token en los headers para todas las peticiones
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

          const { data } = await axiosInstance.get(`/usuarios/${parsedUser._id}`);

          setUsuario(data);
          setIsAuthenticated(true);
          console.log("AuthContext - Usuario autenticado:", data);
        } catch (error) {
          logout();
        }
      } else {
        logout();
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = ({ usuario, token }) => {
    setUsuario(usuario);
    setIsAuthenticated(true);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    localStorage.setItem('token', token);
    // Configurar el token para todas las peticiones futuras
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    setUsuario(null);
    setIsAuthenticated(false);
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    // Eliminar el token de los headers
    delete axiosInstance.defaults.headers.common['Authorization'];

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

  // 🔥 CORREGIDA - Función para verificar si puede gestionar torneos (admin Y capitán)
  const puedeGestionarTorneos = () => {
    return usuario && ['admin', 'capitan'].includes(usuario.rol);
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

  // 🔥 NUEVA - Función para verificar permisos de gestión de partidos
  const puedeGestionarPartidos = () => {
    return usuario && ['admin', 'capitan'].includes(usuario.rol);
  };

  // 🔥 NUEVA - Función para verificar si puede operar partidos en vivo (admin y árbitro)
  const puedeOperarPartidosEnVivo = () => {
    return usuario && ['admin', 'arbitro'].includes(usuario.rol);
  };

  // 🔥 NUEVA - Función para debugging - muestra información del usuario actual
  const debugUsuario = () => {
    console.log('🔍 DEBUG AuthContext:');
    console.log('  Usuario:', usuario);
    console.log('  Rol:', usuario?.rol);
    console.log('  isAuthenticated:', isAuthenticated);
    console.log('  puedeGestionarTorneos:', puedeGestionarTorneos());
    console.log('  puedeGestionarPartidos:', puedeGestionarPartidos());
    console.log('  puedeGestionarEquipos:', puedeGestionarEquipos());
    console.log('  puedeGestionarArbitros:', puedeGestionarArbitros());
    return {
      usuario,
      rol: usuario?.rol,
      isAuthenticated,
      permisos: {
        torneos: puedeGestionarTorneos(),
        partidos: puedeGestionarPartidos(),
        equipos: puedeGestionarEquipos(),
        arbitros: puedeGestionarArbitros()
      }
    };
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
    puedeGestionarPartidos, // 🔥 NUEVA
    puedeOperarPartidosEnVivo, // 🔥 NUEVA
    // Funciones de edición por ID
    puedeEditarUsuario,
    puedeEditarArbitro,
    // Funciones específicas
    puedeCambiarDisponibilidadArbitro,
    puedeEliminarUsuario,
    puedeEliminarArbitro,
    puedeInscribirseEquipo,
    // 🔥 Función de debugging
    debugUsuario
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);