import React from "react";
import { useAuth } from "../../AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";

export default function Logout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Button
      variant="outline-info"
      style={{
        fontWeight: "bold",
        borderRadius: "12px",
        color: "#0097a7",
        border: "2px solid #0097a7",
        fontFamily: "Fira Mono, monospace",
        background: "white",
      }}
      onClick={handleLogout}
    >
      Cerrar sesión
    </Button>
  );
}