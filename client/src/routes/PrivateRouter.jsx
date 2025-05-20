// 📁 src/routes/PrivateRoutes.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const PrivateRoutes = () => {
  const { usuario, isAuthenticated, loading } = useAuth();
  
  // Agregar console.log para depuración
  console.log("PrivateRoutes - Auth state:", { usuario, isAuthenticated, loading });
  
  // Mostrar componente de carga mientras verificamos la autenticación
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }
  
  // Redireccionar a login si no está autenticado
  return (usuario || isAuthenticated) ? <Outlet /> : <Navigate to="/auth/login" />;
};