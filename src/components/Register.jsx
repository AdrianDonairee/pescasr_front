import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Container, Card, Button } from "react-bootstrap";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const ok = register(form.username, form.password);
    if (ok) {
      navigate("/home");
    } else {
      setError("El usuario ya existe");
    }
  };

  return (
    <Container
      fluid
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        background: "#e0f7fa",
        fontFamily: "'Fira Mono', monospace",
      }}
    >
      <Card
        style={{
          minWidth: 350,
          maxWidth: 400,
          padding: "2rem",
          borderRadius: "24px",
          border: "2px solid #0097a7",
          boxShadow: "0 0 24px #0097a755",
          background: "#fff",
        }}
      >
        <h2
          style={{
            fontFamily: "'Montserrat', 'Fira Mono', monospace",
            fontWeight: 900,
            fontSize: "2rem",
            color: "#0097a7",
            letterSpacing: 2,
            textAlign: "center",
            marginBottom: "1.5rem",
          }}
        >
          Registrarse
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="Usuario"
            value={form.username}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              marginBottom: "1rem",
              padding: "0.7rem",
              borderRadius: "12px",
              border: "1px solid #0097a7",
              fontSize: "1.1rem",
            }}
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              marginBottom: "1rem",
              padding: "0.7rem",
              borderRadius: "12px",
              border: "1px solid #0097a7",
              fontSize: "1.1rem",
            }}
          />
          <Button
            type="submit"
            variant="info"
            style={{
              width: "100%",
              fontWeight: "bold",
              borderRadius: "12px",
              color: "#fff",
              background: "#0097a7",
              border: "none",
              marginBottom: "1rem",
            }}
          >
            Registrarse
          </Button>
          {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
        </form>
        <p style={{ textAlign: "center" }}>
          ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
        </p>
        <Button
          variant="outline-info"
          style={{
            width: "100%",
            fontWeight: "bold",
            borderRadius: "12px",
            color: "#0097a7",
            border: "2px solid #0097a7",
            marginTop: "0.5rem",
          }}
          onClick={() => navigate("/home")}
        >
          Volver a Home
        </Button>
      </Card>
    </Container>
  );
}