import React, { useState } from "react";
import { useAuth } from "../../AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "react-bootstrap";
import "./Home.css";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await register(form.username, form.password);
    if (res && res.ok) {
      navigate("/home");
    } else {
      setError((res && res.message) || "El usuario ya existe");
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center futuristic-container">
      <div className="auth-card">
        <h2>Registrarse</h2>
        <form onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="text"
            name="username"
            placeholder="Usuario"
            value={form.username}
            onChange={handleChange}
            required
          />
          <input
            className="auth-input"
            type="password"
            name="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={handleChange}
            required
          />
          {error && <p style={{ color: "#ff7b7b", textAlign: "center" }}>{error}</p>}
          <div className="auth-actions">
            <Button type="submit" className="solid-btn">Registrarse</Button>
            <Button variant="outline-light" className="glass-btn" onClick={() => navigate("/home")}>Volver</Button>
          </div>
        </form>

        <p style={{ textAlign: "center", marginTop: "1rem" }}>
          ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
        </p>
      </div>
    </div>
  );
}