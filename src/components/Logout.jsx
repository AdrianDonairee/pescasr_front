import React from "react";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";

export default function Logout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <button onClick={handleLogout}>
      Cerrar sesión
    </button>
  );
}