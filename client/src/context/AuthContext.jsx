// 📁 src/context/AuthContext.jsx - VERSIÓN SIMPLE FINAL
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

  // 🔥 FUNCIÓN DE VERIFICACIÓN AL INICIAR
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
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

          const parsedUser = JSON.parse(storedUser);
          console.log('👤 Usuario del localStorage:', parsedUser.email);
          console.log('🏆 Equipos del localStorage:', parsedUser.equipos?.length || 0);
          
          // 🔥 VERIFICAR CON /auth/perfil PARA DATOS FRESCOS
          console.log('🔍 Verificando con /auth/perfil...');
          const { data } = await axiosInstance.get('/auth/perfil');
          console.log('✅ Perfil verificado con equipos:', data.equipos?.length || 0);

          setUsuario(data);
          setIsAuthenticated(true);
          localStorage.setItem('usuario', JSON.stringify(data));
          
          console.log('✅ Usuario autenticado correctamente');
          
        } catch (error) {
          console.log('❌ Error en verificación de auth:', error);
          console.log('🧹 Limpiando datos de autenticación...');
          setUsuario(null);
          setIsAuthenticated(false);
          localStorage.removeItem('usuario');
          localStorage.removeItem('token');
          delete axiosInstance.defaults.headers.common['Authorization'];
        }
      } else {
        console.log('❌ No hay token o usuario en localStorage');
        setUsuario(null);
        setIsAuthenticated(false);
      }
      
      setLoading(false);
      console.log('🔚 === FIN VERIFICACIÓN AUTH ===\n');
    };

    checkAuth();
  }, []);

  // 🔥 FUNCIÓN DE LOGIN SIMPLE (el backend ya incluye equipos)
  const login = ({ usuario, token }) => {
    console.log('\n🚀 === EJECUTANDO LOGIN ===');
    console.log('👤 Usuario recibido:', usuario.email);
    console.log('🏆 Equipos incluidos en login:', usuario.equipos?.length || 0);
    
    if (usuario.equipos?.length > 0) {
      console.log('📋 Equipos recibidos:');
      usuario.equipos.forEach((eq, i) => {
        console.log(`  ${i + 1}. ${eq.equipo?.nombre || 'Sin nombre'} - #${eq.numero}`);
      });
    }
    
    // Establecer estado
    setUsuario(usuario);
    setIsAuthenticated(true);
    
    // Guardar en localStorage
    localStorage.setItem('usuario', JSON.stringify(usuario));
    localStorage.setItem('token', token);
    
    // Configurar token para futuras peticiones
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    console.log('✅ Login completado con', usuario.equipos?.length || 0, 'equipos');
    console.log('🔚 === FIN LOGIN ===\n');
  };

  // 🔥 FUNCIÓN DE LOGOUT
  const logout = () => {
    console.log('\n🚪 === EJECUTANDO LOGOUT ===');
    
    setUsuario(null);
    setIsAuthenticated(false);
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    delete axiosInstance.defaults.headers.common['Authorization'];

    console.log('✅ Logout completado');
    navigate('/auth/login');
  };

  // 🔥 FUNCIONES DE UTILIDAD
  const getStoredToken = () => localStorage.getItem('token');
  
  const tieneTokenValido = () => {
    const token = getStoredToken();
    return !!(token && usuario);
  };

  // 🔥 FUNCIONES DE ROLES
  const tieneRol = (rol) => usuario?.rol === rol;
  const esArbitro = () => tieneRol('arbitro');
  const puedeGestionarEquipos = () => ['admin', 'capitan'].includes(usuario?.rol);
  const puedeGestionarArbitros = () => ['admin'].includes(usuario?.rol);
  const puedeGestionarTorneos = () => ['admin'].includes(usuario?.rol);
  const puedeGestionarUsuarios = () => ['admin','capitan'].includes(usuario?.rol);
  const puedeGestionarPartidos = () => {
    if (!usuario) return false;
    // Verificar rol principal O rol secundario
    console.log(`puedeGestionarPartidos - usuario:`, usuario);
    return ['admin', 'arbitro'].includes(usuario.rol) || usuario.rolSecundario === 'arbitro';
  };

  const puedeOperarPartidosEnVivo = () => {
    if (!usuario) return false;
    // Verificar rol principal O rol secundario
    console.log("puedeOperarPartidosEnVivo - usuario:", usuario);
    return ['admin', 'arbitro'].includes(usuario.rol) || usuario.rolSecundario === 'arbitro';
  };
  const puedeEditarUsuario = (usuarioId) => {
    if (!usuario) return false;
    return usuario.rol === 'admin' || (usuario._id || usuario.id) === usuarioId;
  };
  const puedeEditarArbitro = (arbitroId) => {
    if (!usuario) return false;
    return usuario.rol === 'admin' || (usuario._id || usuario.id) === arbitroId;
  };
  const puedeCambiarDisponibilidadArbitro = (arbitroId) => {
    if (!usuario) return false;
    return usuario.rol === 'admin' || (usuario._id || usuario.id) === arbitroId;
  };
  const puedeEliminarUsuario = () => ['admin', 'capitan'].includes(usuario?.rol);
  const puedeEliminarArbitro = () => usuario?.rol === 'admin';
  const puedeInscribirseEquipo = () => ['jugador', 'capitan'].includes(usuario?.rol);

  // 🔥 FUNCIONES DE EQUIPOS

  // Obtener equipos del usuario (directo desde usuario.equipos)
  const obtenerEquiposUsuario = () => {
    console.log('\n🏆 === OBTENIENDO EQUIPOS DEL USUARIO ===');
    console.log('👤 Usuario presente:', !!usuario);
    console.log('📋 Usuario.equipos:', usuario?.equipos?.length || 0);
    
    if (!usuario?.equipos || usuario.equipos.length === 0) {
      console.log('❌ No hay equipos');
      return [];
    }
    
    const equipos = usuario.equipos.map((equipoUsuario, index) => {
      console.log(`🔍 Equipo ${index + 1}:`, {
        equipoId: equipoUsuario.equipo?._id,
        nombre: equipoUsuario.equipo?.nombre,
        numero: equipoUsuario.numero
      });
      
      return {
        equipoId: equipoUsuario.equipo?._id || equipoUsuario.equipo,
        numero: equipoUsuario.numero,
        equipoData: equipoUsuario.equipo // Ya viene populado desde el backend
      };
    });
    
    console.log('✅ Equipos procesados:', equipos.length);
    return equipos;
  };

  // Verificar si está inscrito en un equipo específico
  const estaInscritoEnEquipo = (equipoId) => {
    if (!usuario?.equipos) return false;
    return usuario.equipos.some(eq => 
      (eq.equipo?._id || eq.equipo) === equipoId
    );
  };

  // Obtener equipos disponibles para inscripción
  const obtenerEquiposDisponibles = async () => {
    console.log('\n📊 === OBTENIENDO EQUIPOS DISPONIBLES ===');
    
    try {
      const { data } = await axiosInstance.get('/equipos?estado=activo');
      const equiposDisponibles = data.equipos || data || [];
      
      // Filtrar equipos donde el usuario NO esté inscrito
      const equiposFiltrados = equiposDisponibles.filter(equipo => {
        return !estaInscritoEnEquipo(equipo._id);
      });
      
      console.log('✅ Equipos disponibles:', equiposFiltrados.length);
      return equiposFiltrados;
    } catch (error) {
      console.error('❌ Error obteniendo equipos disponibles:', error);
      return [];
    }
  };

  // Actualizar equipos del usuario (refrescar desde la API)
  const actualizarEquiposUsuario = async () => {
    console.log('\n🔄 === ACTUALIZANDO EQUIPOS USUARIO ===');
    
    try {
      const { data } = await axiosInstance.get('/auth/perfil');
      console.log('✅ Perfil actualizado con equipos:', data.equipos?.length || 0);
      
      // Actualizar estado y localStorage
      setUsuario(data);
      localStorage.setItem('usuario', JSON.stringify(data));
      
      console.log('✅ Equipos actualizados correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error actualizando equipos:', error);
      if (error.response?.status === 401) {
        logout();
      }
      return false;
    }
  };

  // Función de debugging
  const debugUsuario = () => {
    console.log('\n🐛 === DEBUG USUARIO ===');
    console.log('👤 Usuario:', !!usuario);
    console.log('📧 Email:', usuario?.email);
    console.log('🏆 Equipos:', usuario?.equipos?.length || 0);
    console.log('🔑 Token válido:', tieneTokenValido());
    console.log('🔐 Rol:', usuario?.rol);
    
    if (usuario?.equipos) {
      usuario.equipos.forEach((eq, i) => {
        console.log(`  Equipo ${i + 1}:`, {
          nombre: eq.equipo?.nombre,
          numero: eq.numero
        });
      });
    }
    
    return {
      usuario: !!usuario,
      email: usuario?.email,
      equipos: usuario?.equipos?.length || 0,
      rol: usuario?.rol,
      isAuthenticated,
      tokenValido: tieneTokenValido()
    };
  };

  // 🔥 REFRESCAR USUARIO
  const refrescarUsuario = async () => {
    try {
      console.log('🔄 Refrescando usuario...');
      const { data } = await axiosInstance.get('/auth/perfil');
      
      setUsuario(data);
      localStorage.setItem('usuario', JSON.stringify(data));
      
      console.log('✅ Usuario refrescado con equipos:', data.equipos?.length || 0);
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
    
    // 🔥 FUNCIONES DE EQUIPOS
    obtenerEquiposUsuario,
    estaInscritoEnEquipo,
    obtenerEquiposDisponibles,
    actualizarEquiposUsuario,
    
    // 🔥 FUNCIONES DE UTILIDAD
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