import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import { Home } from '../pages/Home';
import { Layout } from '../layout/Layout';
import { EditarPerfil } from '../pages/profile/EditarPerfil';
import { Usuarios } from '../pages/jugadores/Usuarios';
import { EditarEquipo, Equipos, NuevoEquipo, RegistrarJugadores } from '../pages/equipos';
import { Torneos } from '../pages/torneos/Torneos';
import { CrearTorneo, GestionInscripciones } from '../pages/torneos';

// Componente ProtectedRoute para proteger rutas

export const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div>Cargando...</div>;

  return isAuthenticated ? <Outlet /> : <Navigate to="/auth/login" replace />;
};


// Componente AppRouter
export const AppRouter = () => {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />

      {/* Rutas protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="equipos" element={<Equipos />} />
          <Route path="equipos/nuevo" element={<NuevoEquipo />} />
          <Route path="equipos/editar/:id" element={<EditarEquipo />} />
          <Route path="/equipos/:id/jugadores" element={<RegistrarJugadores />} />
          <Route path="torneos" element={<Torneos />} />
          <Route path="torneos/crear" element={<CrearTorneo />} />
          <Route path="/torneos/:id/inscripciones" element={<GestionInscripciones />} />
          <Route path="perfil" element={<EditarPerfil />} />
          <Route path="perfil/:id" element={<EditarPerfil />} />
        </Route>
      </Route>

      {/* Ruta catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};