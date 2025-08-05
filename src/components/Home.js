import React, { useState } from "react";
import { Container, Row, Col, Button, Form, InputGroup, Card, Stack, Dropdown } from "react-bootstrap";
import { FaBars, FaShoppingCart, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import Logout from "./Logout";
import CartModal from "./CartModal";
import logo from "../img/logo.png";

// Productos con nombres e imágenes actualizados y categoría
const productos = [
  {
    nombre: "Caña Caster 2,1m",
    descripcion: "Caña de pescar profesional - $25.000",
    imagen: "/img/Caña caster 2,1m.webp",
    categoria: "Cañas",
  },
  {
    nombre: "Kit de Señuelos para Pesca de Río",
    descripcion: "Señuelos flotantes y de río - $3.500",
    imagen: "/img/Kit de señuelos para pesca de rio.jpg",
    categoria: "Señuelos",
  },
  {
    nombre: "Reel Caster Ultra 7000",
    descripcion: "Reel metálico - $18.000",
    imagen: "/img/Reel caster ultra 7000.jpg",
    categoria: "Reeles",
  },
  {
    nombre: "Kit Básico de Pesca para Nivel Inicial",
    descripcion: "Kit inicial - $9.000",
    imagen: "/img/Kit basico de pesca para nivel inicial.webp",
    categoria: "Kits",
  },
];

const categorias = ["Todos", "Cañas", "Señuelos", "Reeles", "Kits"];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Estados para búsqueda, carrito, modal y categoría seleccionada
  const [busqueda, setBusqueda] = useState("");
  const [carrito, setCarrito] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todos");

  // Filtrar productos según búsqueda y categoría
  const productosFiltrados = productos.filter((prod) => {
    const coincideBusqueda = prod.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = categoriaSeleccionada === "Todos" || prod.categoria === categoriaSeleccionada;
    return coincideBusqueda && coincideCategoria;
  });

  // Agregar producto al carrito (sumar cantidad si ya existe)
  const agregarAlCarrito = (producto) => {
    const idx = carrito.findIndex((p) => p.nombre === producto.nombre);
    if (idx !== -1) {
      const nuevoCarrito = [...carrito];
      nuevoCarrito[idx].cantidad = (nuevoCarrito[idx].cantidad || 1) + 1;
      setCarrito(nuevoCarrito);
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
  };

  return (
    <Container
      fluid
      className="min-vh-100 py-4 px-2"
      style={{
        background: "#e0f7fa",
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
          <Dropdown>
            <Dropdown.Toggle
              variant="outline-info"
              style={{
                border: "none",
                fontWeight: "bold",
                borderRadius: "12px",
                color: "#0097a7",
                background: "#e0f7fa",
                marginRight: "8px",
                boxShadow: "0 2px 8px #b3e0ff55",
              }}
            >
              <FaBars size={30} />
            </Dropdown.Toggle>
            <Dropdown.Menu
              style={{
                minWidth: 180,
                borderRadius: "12px",
                fontFamily: "Fira Mono, monospace",
                fontWeight: "bold",
                fontSize: "1rem",
                background: "#e0f7fa",
                border: "2px solid #0097a7",
                boxShadow: "0 2px 8px #b3e0ff55",
              }}
            >
              {categorias.map((cat) => (
                <Dropdown.Item
                  key={cat}
                  active={categoriaSeleccionada === cat}
                  onClick={() => setCategoriaSeleccionada(cat)}
                  style={{
                    color: "#0097a7",
                    background: categoriaSeleccionada === cat ? "#b3e0ff" : "transparent",
                    fontWeight: categoriaSeleccionada === cat ? "bold" : "normal",
                    borderRadius: "8px",
                    margin: "2px 0",
                  }}
                >
                  {cat}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
          <span
            className="ms-2 small"
            style={{
              letterSpacing: 1,
              color: "#0097a7",
              fontWeight: "bold",
              fontSize: "1.1rem",
              background: "#e0f7fa",
              border: "2px solid #0097a7",
              borderRadius: "8px",
              padding: "2px 12px",
              boxShadow: "0 2px 8px #b3e0ff55",
              textTransform: "uppercase",
            }}
          >
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
                color: "#ff3d00",
                letterSpacing: 2,
                textShadow: "0 2px 8px #fff, 0 1px 0 #0097a7, 0 0 12px #ffccbc",
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
                  style={{
                    fontWeight: "bold",
                    borderRadius: "12px",
                    color: "#0097a7",
                    border: "2px solid #0097a7",
                  }}
                  onClick={() => navigate("/login")}
                >
                  Login
                </Button>
                <Button
                  variant="info"
                  style={{
                    fontWeight: "bold",
                    borderRadius: "12px",
                    color: "#fff",
                    background: "#0097a7",
                    border: "none",
                  }}
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
                <Logout style={{ marginLeft: "8px" }} />
              </>
            )}
            <Button
              variant="outline-info"
              style={{ border: "none", position: "relative" }}
              onClick={() => setShowCart(true)}
            >
              <FaShoppingCart size={30} />
              {carrito.reduce((acc, prod) => acc + (prod.cantidad || 1), 0) > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    background: "#ff3d00",
                    color: "#fff",
                    borderRadius: "50%",
                    padding: "2px 7px",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                  }}
                >
                  {carrito.reduce((acc, prod) => acc + (prod.cantidad || 1), 0)}
                </span>
              )}
            </Button>
          </Stack>
        </Col>
      </Row>

      {/* Buscador */}
      <Row className="justify-content-center mb-5" style={{ position: "relative" }}>
        <Col md={8}>
          <InputGroup>
            <InputGroup.Text className="bg-info text-dark border-0">
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              placeholder="Buscar productos..."
              className="bg-dark text-info border-0"
              style={{ fontSize: "1.2rem", letterSpacing: 1 }}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              autoComplete="off"
            />
          </InputGroup>
          {/* Sugerencias de búsqueda */}
          {busqueda.length > 0 && productos
            .filter(
              (prod) =>
                prod.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
                (categoriaSeleccionada === "Todos" || prod.categoria === categoriaSeleccionada)
            )
            .slice(0, 5).length > 0 && (
            <div
              style={{
                position: "absolute",
                zIndex: 10,
                width: "100%",
                background: "#fff",
                border: "2px solid #0097a7",
                borderRadius: "0 0 12px 12px",
                boxShadow: "0 2px 12px #b3e0ff55",
                maxHeight: "220px",
                overflowY: "auto",
              }}
            >
              {productos
                .filter(
                  (prod) =>
                    prod.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
                    (categoriaSeleccionada === "Todos" || prod.categoria === categoriaSeleccionada)
                )
                .slice(0, 5)
                .map((prod, idx) => (
                  <div
                    key={prod.nombre + idx}
                    style={{
                      padding: "10px 18px",
                      cursor: "pointer",
                      borderBottom: "1px solid #e0f7fa",
                      color: "#0097a7",
                      fontWeight: "bold",
                      background: "#e0f7fa",
                    }}
                    onClick={() => setBusqueda(prod.nombre)}
                  >
                    {prod.nombre}
                  </div>
                ))}
            </div>
          )}
        </Col>
      </Row>

      {/* Productos */}
      <Row className="justify-content-center">
        {productosFiltrados.map((prod, idx) => (
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
                {/* Imagen del producto */}
                <Card.Img
                  variant="top"
                  src={prod.imagen}
                  alt={prod.nombre}
                  style={{
                    maxHeight: "140px",
                    objectFit: "contain",
                    marginTop: "1rem",
                  }}
                />
                <Card.Body>
                  <Card.Title style={{ fontSize: "1.1rem", fontWeight: "bold", letterSpacing: 1 }}>
                    {prod.nombre}
                  </Card.Title>
                  <Card.Text style={{ fontSize: "1rem", color: "#e3f6ff" }}>{prod.descripcion}</Card.Text>
                  <Button
                    variant="info"
                    style={{
                      fontWeight: "bold",
                      borderRadius: "12px",
                      color: "#fff",
                      background: "#0097a7",
                      border: "none",
                      marginTop: "0.5rem",
                    }}
                    onClick={() => agregarAlCarrito(prod)}
                  >
                    Agregar al carrito
                  </Button>
                </Card.Body>
              </Card>
            </Button>
          </Col>
        ))}
      </Row>

      {/* Modal del carrito */}
      <CartModal show={showCart} handleClose={() => setShowCart(false)} carrito={carrito} setCarrito={setCarrito} />
    </Container>
  );
}