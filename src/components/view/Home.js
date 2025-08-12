import React, { useState } from "react";
import {
  Container, Row, Col, Button, Form, InputGroup, Card, Stack, Dropdown, ListGroup, Modal
} from "react-bootstrap";
import { FaBars, FaShoppingCart, FaSearch, FaTrashAlt, FaPlus, FaMinus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext"; // 
import Logout from "./Logout";
import logo from "../../img/logo.png"; // 

const productos = [
  { nombre: "Caña Pro", descripcion: "Caña de pescar profesional - $25.000", categoria: "Cañas", precio: 25000 },
  { nombre: "Caña Básica", descripcion: "Caña para principiantes - $10.000", categoria: "Cañas", precio: 10000 },
  { nombre: "Reel Ultra", descripcion: "Reel metálico - $18.000", categoria: "Reels", precio: 18000 },
  { nombre: "Reel Compacto", descripcion: "Reel compacto - $12.000", categoria: "Reels", precio: 12000 },
  { nombre: "Señuelo X", descripcion: "Señuelo flotante - $3.500", categoria: "Señuelos", precio: 3500 },
  { nombre: "Señuelo Y", descripcion: "Señuelo hundido - $4.000", categoria: "Señuelos", precio: 4000 },
  { nombre: "Kit Básico", descripcion: "Kit inicial - $9.000", categoria: "Kits", precio: 9000 },
  { nombre: "Kit Pro", descripcion: "Kit profesional - $20.000", categoria: "Kits", precio: 20000 },
];

const categorias = ["Cañas", "Reels", "Señuelos", "Kits"];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);

  // Filtrar productos por categoría
  const productosFiltrados = categoriaSeleccionada
    ? productos.filter((p) => p.categoria === categoriaSeleccionada)
    : productos;

  // Filtrar sugerencias de búsqueda
  const handleBusqueda = (e) => {
    const valor = e.target.value;
    setBusqueda(valor);
    if (valor.length > 0) {
      const sugeridos = productos.filter((p) =>
        p.nombre.toLowerCase().includes(valor.toLowerCase())
      );
      setSugerencias(sugeridos);
    } else {
      setSugerencias([]);
    }
  };

  // Al hacer click en sugerencia
  const handleSugerenciaClick = (nombre) => {
    setBusqueda(nombre);
    setSugerencias([]);
    setCategoriaSeleccionada(null);
  };

  // Al seleccionar categoría
  const handleCategoria = (cat) => {
    setCategoriaSeleccionada(cat);
    setBusqueda("");
    setSugerencias([]);
  };

  // Productos a mostrar (por búsqueda o por categoría)
  const productosAMostrar =
    busqueda.length > 0
      ? productos.filter((p) =>
          p.nombre.toLowerCase().includes(busqueda.toLowerCase())
        )
      : productosFiltrados;

  // Carrito
  const agregarAlCarrito = (producto) => {
    setCarrito((prev) => {
      const existe = prev.find((item) => item.nombre === producto.nombre);
      if (existe) {
        return prev.map((item) =>
          item.nombre === producto.nombre
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      } else {
        return [...prev, { ...producto, cantidad: 1 }];
      }
    });
  };

  const quitarDelCarrito = (nombre) => {
    setCarrito((prev) => prev.filter((item) => item.nombre !== nombre));
  };

  const cambiarCantidad = (nombre, delta) => {
    setCarrito((prev) =>
      prev
        .map((item) =>
          item.nombre === nombre
            ? { ...item, cantidad: Math.max(1, item.cantidad + delta) }
            : item
        )
        .filter((item) => item.cantidad > 0)
    );
  };

  const totalCarrito = carrito.reduce(
    (acc, item) => acc + item.precio * item.cantidad,
    0
  );

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
            <Dropdown.Toggle variant="outline-info" style={{ border: "none" }}>
              <FaBars size={30} />
              <span className="ms-2 small text-info" style={{ letterSpacing: 1 }}>
                Categorías
              </span>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {categorias.map((cat) => (
                <Dropdown.Item
                  key={cat}
                  onClick={() => handleCategoria(cat)}
                  active={categoriaSeleccionada === cat}
                >
                  {cat}
                </Dropdown.Item>
              ))}
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => setCategoriaSeleccionada(null)}>
                Todas
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
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
            <Button
              variant="outline-info"
              style={{ border: "none", position: "relative" }}
              onClick={() => setMostrarCarrito(true)}
            >
              <FaShoppingCart size={30} />
              {carrito.length > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    background: "#ff3d00",
                    color: "#fff",
                    borderRadius: "50%",
                    fontSize: "0.8rem",
                    width: 20,
                    height: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {carrito.reduce((acc, item) => acc + item.cantidad, 0)}
                </span>
              )}
            </Button>
          </Stack>
        </Col>
      </Row>

      {/* Buscador */}
      <Row className="justify-content-center mb-5 position-relative">
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
              onChange={handleBusqueda}
              autoComplete="off"
            />
          </InputGroup>
          {sugerencias.length > 0 && (
            <ListGroup className="position-absolute w-100 z-3">
              {sugerencias.map((prod) => (
                <ListGroup.Item
                  key={prod.nombre}
                  action
                  onClick={() => handleSugerenciaClick(prod.nombre)}
                >
                  {prod.nombre}
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Col>
      </Row>

      {/* Productos */}
      <Row className="justify-content-center">
        {productosAMostrar.length === 0 ? (
          <Col>
            <p>No se encontraron productos.</p>
          </Col>
        ) : (
          productosAMostrar.map((prod, idx) => (
            <Col key={idx} xs={12} sm={6} md={3} className="mb-4 d-flex justify-content-center">
              <Card
                bg="dark"
                text="info"
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
                <Card.Body>
                  <Card.Title style={{ fontSize: "1.6rem", fontWeight: "bold", letterSpacing: 1 }}>
                    {prod.nombre}
                  </Card.Title>
                  <Card.Text style={{ fontSize: "1.1rem", color: "#e3f6ff" }}>{prod.descripcion}</Card.Text>
                  <Card.Text>
                    <span className="badge bg-info">{prod.categoria}</span>
                  </Card.Text>
                  <Button
                    variant="success"
                    style={{ borderRadius: "12px", fontWeight: "bold" }}
                    onClick={() => agregarAlCarrito(prod)}
                  >
                    Comprar
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>

      {/* Modal Carrito */}
      <Modal
        show={mostrarCarrito}
        onHide={() => setMostrarCarrito(false)}
        centered
        size="lg"
        contentClassName="border-0"
        style={{ fontFamily: "Fira Mono, monospace" }}
      >
        <Modal.Header
          closeButton
          style={{
            background: "#e0f7fa",
            borderBottom: "2px solid #0097a7",
            color: "#01579b",
          }}
        >
          <Modal.Title>
            <FaShoppingCart className="me-2" />
            Carrito de compras
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            background: "#e0f7fa",
            color: "#01579b",
            borderRadius: "0 0 24px 24px",
          }}
        >
          {carrito.length === 0 ? (
            <p>El carrito está vacío.</p>
          ) : (
            <ListGroup variant="flush">
              {carrito.map((item) => (
                <ListGroup.Item
                  key={item.nombre}
                  style={{
                    background: "#e0f7fa",
                    border: "none",
                    borderBottom: "1px solid #b3e0ff",
                  }}
                  className="d-flex align-items-center justify-content-between"
                >
                  <div>
                    <span style={{ fontWeight: "bold" }}>{item.nombre}</span>
                    <span className="badge bg-info ms-2">{item.categoria}</span>
                    <div style={{ fontSize: "0.95rem", color: "#0097a7" }}>
                      ${item.precio.toLocaleString("es-AR")}
                    </div>
                  </div>
                  <div className="d-flex align-items-center">
                    <Button
                      variant="outline-info"
                      size="sm"
                      className="me-2"
                      onClick={() => cambiarCantidad(item.nombre, -1)}
                      disabled={item.cantidad === 1}
                    >
                      <FaMinus />
                    </Button>
                    <span style={{ minWidth: 32, textAlign: "center" }}>{item.cantidad}</span>
                    <Button
                      variant="outline-info"
                      size="sm"
                      className="ms-2"
                      onClick={() => cambiarCantidad(item.nombre, 1)}
                    >
                      <FaPlus />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="ms-3"
                      onClick={() => quitarDelCarrito(item.nombre)}
                    >
                      <FaTrashAlt />
                    </Button>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Modal.Body>
        <Modal.Footer
          style={{
            background: "#e0f7fa",
            borderTop: "2px solid #0097a7",
            color: "#01579b",
            borderRadius: "0 0 24px 24px",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
            Total: ${totalCarrito.toLocaleString("es-AR")}
          </div>
          <Button
            variant="success"
            style={{ borderRadius: "12px", fontWeight: "bold" }}
            disabled={carrito.length === 0}
            onClick={() => alert("¡Gracias por tu compra!")}
          >
            Finalizar compra
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}