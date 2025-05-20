// 📁 src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../config/axios'; // Asegúrate de tener la ruta correcta

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

  // Valor expuesto por el contexto
  const authContextValue = {
    usuario,
    isAuthenticated,
    loading,
    login,
    logout,
    tieneRol // Exportamos la nueva función
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
