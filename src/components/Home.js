import React from "react";
import { Container, Row, Col, Button, Form, InputGroup, Card, Stack } from "react-bootstrap";
import { FaBars, FaShoppingCart, FaSearch } from "react-icons/fa";

const productos = [
  { nombre: "Caña Pro", descripcion: "Caña de pescar profesional - $25.000" },
  { nombre: "Señuelo X", descripcion: "Señuelo flotante - $3.500" },
  { nombre: "Reel Ultra", descripcion: "Reel metálico - $18.000" },
  { nombre: "Kit Básico", descripcion: "Kit inicial - $9.000" },
];

export default function Home() {
  return (
    <Container
      fluid
      className="min-vh-100 py-4 px-2"
      style={{
        background: "linear-gradient(135deg, #232526 0%, #414345 100%)",
        border: "2px solid #b3e0ff",
        borderRadius: "24px",
        boxShadow: "0 0 24px #0008",
        color: "#e3f6ff",
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
          <Button
            variant="info"
            size="lg"
            style={{
              borderRadius: "18px",
              fontWeight: "bold",
              fontSize: "2.2rem",
              padding: "0.5em 2.5em",
              color: "#232526",
              boxShadow: "0 2px 12px #b3e0ff55",
              border: "none",
              letterSpacing: 2,
              pointerEvents: "none",
            }}
            disabled
          >
            Pescasr
          </Button>
        </Col>
        <Col xs="auto" className="d-flex align-items-center justify-content-end">
          <Stack direction="horizontal" gap={2}>
            <Button variant="outline-light" style={{ fontWeight: "bold", borderRadius: "12px" }}>
              Login
            </Button>
            <Button variant="info" style={{ fontWeight: "bold", borderRadius: "12px", color: "#232526" }}>
              Registro
            </Button>
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