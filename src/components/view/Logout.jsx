import React from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import "./Home.css";

export default function Logout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <Button className="glass-btn" onClick={handleLogout}>
      Cerrar sesión
    </Button>
  );
}