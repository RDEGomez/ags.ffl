// 📁 src/context/AuthContext.jsx
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

  // 🔥 CORREGIDA - Función para verificar si puede gestionar equipos (solo admin y capitán)
  const puedeGestionarEquipos = () => {
    return usuario && ['admin', 'capitan'].includes(usuario.rol);
  };

  // 🔥 Función para verificar si puede gestionar árbitros (solo admin)
  const puedeGestionarArbitros = () => {
    return usuario && ['admin'].includes(usuario.rol);
  };

  // 🔥 NUEVA - Función para verificar si puede gestionar torneos (solo admin)
  const puedeGestionarTorneos = () => {
    return usuario && usuario.rol === 'admin';
  };

  // 🔥 NUEVA - Función para verificar si puede gestionar usuarios (admin y capitán)
  const puedeGestionarUsuarios = () => {
    return usuario && ['admin', 'capitan'].includes(usuario.rol);
  };

  // 🔥 NUEVA - Validación por ID para edición de perfiles de usuarios
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

  // 🔥 NUEVA - Validación por ID para edición de perfiles de árbitros
  const puedeEditarArbitro = (arbitroUserId) => {
    if (!usuario) return false;
    
    // Admin puede editar cualquier árbitro
    if (usuario.rol === 'admin') return true;
    
    // Árbitro solo puede editar su propio perfil
    return usuario.rol === 'arbitro' && usuario._id === arbitroUserId;
  };

  // 🔥 NUEVA - Función para verificar si puede cambiar disponibilidad de árbitros
  const puedeCambiarDisponibilidadArbitro = (arbitroUserId) => {
    if (!usuario) return false;
    
    // Admin puede cambiar disponibilidad de cualquier árbitro
    if (usuario.rol === 'admin') return true;
    
    // Capitán puede cambiar disponibilidad de árbitros
    if (usuario.rol === 'capitan') return true;
    
    // Árbitro solo puede cambiar su propia disponibilidad
    return usuario.rol === 'arbitro' && usuario._id === arbitroUserId;
  };

  // 🔥 NUEVA - Función para verificar si puede eliminar usuarios
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

  // 🔥 NUEVA - Función para verificar si puede eliminar árbitros
  const puedeEliminarArbitro = () => {
    return usuario && ['admin'].includes(usuario.rol);
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
    // Funciones de edición por ID
    puedeEditarUsuario,
    puedeEditarArbitro,
    // Funciones específicas
    puedeCambiarDisponibilidadArbitro,
    puedeEliminarUsuario,
    puedeEliminarArbitro
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);