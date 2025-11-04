import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Header() {
  const { user } = useAuth();

  return (
    <header style={{ padding: 12 }}>
      <nav style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Link to="/home">Inicio</Link>
        {!user && <Link to="/login">Iniciar sesión</Link>}
        {!user && <Link to="/register">Registrarse</Link>}
        {user && <Link to="/logout">Cerrar sesión</Link>}

        {/* Enlace al panel admin visible solo para admins */}
        {user && (user.isAdmin || user.is_staff || user.is_superuser) && (
          <Link to="/admin/products">Panel Admin</Link>
        )}

        {/* Mostrar nombre de usuario si está logueado */}
        {user && <span style={{ marginLeft: "auto" }}>¡Hola, {user.username}!</span>}
      </nav>
    </header>
  );
}