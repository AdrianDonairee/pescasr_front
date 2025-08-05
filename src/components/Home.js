import React from "react";
import { Container, Row, Col, Button, Form, InputGroup, Card, Stack } from "react-bootstrap";
import { FaBars, FaShoppingCart, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import Logout from "./Logout";
import logo from "../img/logo.png"; // Ajustá la ruta si es necesario

const productos = [
  { nombre: "Caña Pro", descripcion: "Caña de pescar profesional - $25.000" },
  { nombre: "Señuelo X", descripcion: "Señuelo flotante - $3.500" },
  { nombre: "Reel Ultra", descripcion: "Reel metálico - $18.000" },
  { nombre: "Kit Básico", descripcion: "Kit inicial - $9.000" },
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth(); // Obtené el usuario logueado

  return (
    <Container
      fluid
      className="min-vh-100 py-4 px-2"
      style={{
        background: "#e0f7fa", // Fondo celeste claro como el logo
        border: "2px solid #0097a7",
        borderRadius: "24px",
        boxShadow: "0 0 24px #0097a755",
        color: "#01579b",
        fontFamily: "Fira Mono, monospace",
      }}
    >
      {/* Navbar superior */}
      <Row className="align-items-center mb-4">
        <Col xs="auto" className="d-flex align-items-center">
          <Button variant="outline-info" style={{ border: "none" }}>
            <FaBars size={30} />
          </Button>
          <span className="ms-2 small text-info" style={{ letterSpacing: 1 }}>
            Categorías
          </span>
        </Col>
        <Col className="text-center">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img
              src={logo}
              alt="Logo"
              style={{
                height: "54px",
                marginRight: "16px",
                filter: "drop-shadow(0 2px 6px #0097a7aa)",
              }}
            />
            <span
  style={{
    fontFamily: "'Montserrat', 'Fira Mono', monospace",
    fontWeight: 900,
    fontSize: "2.8rem",
    color: "#ff3d00", // Naranja fuerte para resaltar
    letterSpacing: 2,
    textShadow: "0 2px 8px #fff, 0 1px 0 #0097a7, 0 0 12px #ffccbc",
    // Quitamos el gradiente y el WebkitTextFillColor
  }}
>
              Pescasr
            </span>
          </div>
        </Col>
        <Col xs="auto" className="d-flex align-items-center justify-content-end">
          <Stack direction="horizontal" gap={2}>
            {!user ? (
              <>
                <Button
                  variant="outline-info"
                  style={{ fontWeight: "bold", borderRadius: "12px", color: "#0097a7", border: "2px solid #0097a7" }}
                  onClick={() => navigate("/login")}
                >
                  Login
                </Button>
                <Button
                  variant="info"
                  style={{ fontWeight: "bold", borderRadius: "12px", color: "#fff", background: "#0097a7", border: "none" }}
                  onClick={() => navigate("/register")}
                >
                  Registro
                </Button>
              </>
            ) : (
              <>
                <span style={{ fontWeight: "bold", color: "#0097a7" }}>
                  ¡Hola, {user.username}!
                </span>
                <Logout />
              </>
            )}
            <Button variant="outline-info" style={{ border: "none" }}>
              <FaShoppingCart size={30} />
            </Button>
          </Stack>
        </Col>
      </Row>

      {/* Buscador */}
      <Row className="justify-content-center mb-5">
        <Col md={8}>
          <InputGroup>
            <InputGroup.Text className="bg-info text-dark border-0">
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              placeholder="Buscar productos..."
              className="bg-dark text-info border-0"
              style={{ fontSize: "1.2rem", letterSpacing: 1 }}
            />
          </InputGroup>
        </Col>
      </Row>

      {/* Productos */}
      <Row className="justify-content-center">
        {productos.map((prod, idx) => (
          <Col key={idx} xs={12} sm={6} md={3} className="mb-4 d-flex justify-content-center">
            <Button
              variant="outline-info"
              style={{
                width: "15rem",
                borderRadius: "28px",
                border: "2px solid #b3e0ff",
                background: "rgba(35,37,38,0.95)",
                color: "#b3e0ff",
                boxShadow: "0 2px 12px #b3e0ff22",
                padding: 0,
                transition: "transform 0.1s",
              }}
              className="text-center p-0 product-btn"
            >
              <Card
                bg="dark"
                text="info"
                style={{ border: "none", borderRadius: "28px", background: "transparent" }}
                className="w-100 h-100"
              >
                <Card.Body>
                  <Card.Title style={{ fontSize: "1.6rem", fontWeight: "bold", letterSpacing: 1 }}>
                    {prod.nombre}
                  </Card.Title>
                  <Card.Text style={{ fontSize: "1.1rem", color: "#e3f6ff" }}>{prod.descripcion}</Card.Text>
                </Card.Body>
              </Card>
            </Button>
          </Col>
        ))}
      </Row>
    </Container>
  );
}