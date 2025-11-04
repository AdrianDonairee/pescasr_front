import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../AuthContext";

/**
 * ProtectedRoute:
 * - Si se le pasan children, renderiza children.
 * - Si no se le pasan children, renderiza <Outlet/> (uso como parent route).
 * - adminOnly: requiere además que el user sea admin.
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user } = useAuth();

  // no autenticado -> login
  if (!user) return <Navigate to="/login" replace />;

  // comprobar admin si hace falta
  if (adminOnly) {
    const isAdmin = !!(
      user.is_superuser ||
      user.is_staff ||
      user.isAdmin ||
      user.role === "admin"
    );
    if (!isAdmin) return <Navigate to="/" replace />;
  }

  // soporte both: children (direct) o Outlet (nested routes)
  if (children) return <>{children}</>;
  return <Outlet />;
}