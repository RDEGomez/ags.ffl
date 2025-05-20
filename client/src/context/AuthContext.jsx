// 📁 src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Cargar usuario desde localStorage al iniciar
  useEffect(() => {
    const checkAuth = () => {
      console.log("AuthContext - Verificando autenticación...");
      const storedUser = localStorage.getItem('usuario');
      const storedToken = localStorage.getItem('token');
      
      if (storedUser && storedToken) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUsuario(parsedUser);
          setIsAuthenticated(true);
          console.log("AuthContext - Usuario autenticado:", parsedUser);
        } catch (error) {
          console.error('Error al parsear usuario:', error);
          localStorage.removeItem('usuario');
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        }
      } else {
        console.log("AuthContext - No hay usuario almacenado");
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = ({ usuario, token }) => {
    console.log("AuthContext - Login:", usuario);
    setUsuario(usuario);
    setIsAuthenticated(true);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    localStorage.setItem('token', token);
  };

  const logout = () => {
    console.log("AuthContext - Logout");
    setUsuario(null);
    setIsAuthenticated(false);
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    navigate('/auth/login');
  };

  // Valor expuesto por el contexto
  const authContextValue = {
    usuario,
    isAuthenticated,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);