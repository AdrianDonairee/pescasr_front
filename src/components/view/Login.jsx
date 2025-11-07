import React, { useState } from "react";
import { useAuth } from "../../AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Container, Card, Button } from "react-bootstrap";
import "./Auth.css";

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
    if (res.ok) {
      navigate("/home");
    } else {
      setError(res.message || "Usuario o contraseña incorrectos");
    }
  };

  return (
    <Container fluid className="auth-root">
      <Card className="auth-card">
        <h2 className="auth-title">Iniciar sesión</h2>
        <form onSubmit={handleSubmit} className="auth-form">
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
          <Button type="submit" className="auth-submit">
            Ingresar
          </Button>
          {error && <p className="auth-error">{error}</p>}
        </form>
        <div className="auth-footer">
          <p>
            ¿No tenés cuenta?{" "}
            <Link to="/register" className="auth-link">
              Registrate
            </Link>
          </p>
          <Button
            variant="outline"
            className="auth-back"
            onClick={() => navigate("/home")}
          >
            Volver a Home
          </Button>
        </div>
      </Card>
    </Container>
  );
}