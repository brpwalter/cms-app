import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    // Nicht eingeloggt -> Weiterleitung zum Login
    return <Navigate to="/login" replace />;
  }

  // Prüfen, ob der User mindestens eine der erlaubten Rollen besitzt
  const hasAccess = allowedRoles.some(role => user.roles.includes(role));

  if (!hasAccess) {
    // Eingeloggt, aber falsche Rolle -> Zugriff verweigert
    return <Navigate to="/unauthorized" replace />;
  }

  // Zugriff erlaubt -> Kindkomponenten rendern (über Outlet)
  return <Outlet />;
};

export default ProtectedRoute;
