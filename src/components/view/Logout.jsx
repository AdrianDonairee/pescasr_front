import React from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import "./Auth.css";


export default function Logout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");

  };

  return (
    <Button
      variant="outline-info"
      style={{
        fontWeight: "bold",
        borderRadius: "12px",
        color: "#0097a7",
        border: "2px solid #0097a7",

      }}
      onClick={handleLogout}
    >

      Cerrar sesión
    </Button>
  );
}