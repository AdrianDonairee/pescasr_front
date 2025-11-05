import React, { useState } from "react";
import { useAuth } from "../../AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Container, Button } from "react-bootstrap";
import "./Home.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await login(form.username, form.password);
    if (res && res.ok) {
      navigate("/home");
    } else {
      setError((res && res.message) || "Usuario o contraseña incorrectos");
    }
  };

  return (
    <Container
      fluid
      className="min-vh-100 d-flex align-items-center justify-content-center futuristic-container"
    >
      <div className="auth-card">
        <h2>Iniciar sesión</h2>
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
            <Button type="submit" className="solid-btn">Ingresar</Button>
            <Button variant="outline-light" className="glass-btn" onClick={() => navigate("/home")}>Volver</Button>
          </div>
        </form>

        <p style={{ textAlign: "center", marginTop: "1rem" }}>
          ¿No tenés cuenta? <Link to="/register">Registrate</Link>
        </p>
      </div>
    </Container>
  );
}