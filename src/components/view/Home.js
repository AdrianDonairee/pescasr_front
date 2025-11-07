import React, { useEffect, useState, useRef } from "react";
import {
  Container, Row, Col, Button, Form, InputGroup, Card, Stack, Dropdown, ListGroup, Modal
} from "react-bootstrap";
import { FaBars, FaShoppingCart, FaSearch, FaTrashAlt, FaPlus, FaMinus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import Logout from "./Logout";
import logo from "../../img/logo.png";
import { getProducts, createOrder, saveCart, getCategories } from "../../services/api";


export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null); // guardará category id o null
  const [busqueda, setBusqueda] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const saveTimeout = useRef(null);
  const prevServerCartCountRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      setCargando(true);
      try {
        const [dataProducts, dataCats] = await Promise.all([getProducts(), getCategories()]);
        const cats = Array.isArray(dataCats) ? dataCats : [];
        if (!mounted) return;

        setCategorias(cats);

        const mapped = (Array.isArray(dataProducts) ? dataProducts : []).map((p) => {
          const categoriaObj = p.categoria && typeof p.categoria === "object" ? p.categoria : null;
          const categoriaNombre = categoriaObj ? (categoriaObj.nombre || categoriaObj.name) : (p.categoria || p.category || p.categoria_producto || "Otros");
          const categoria_id = categoriaObj ? categoriaObj.id : (p.categoria_id ?? null);
          return {
            id: p.id ?? p.pk ?? null,
            nombre: p.nombre || p.name || p.title || p.titulo || p.producto || "",
            descripcion: p.descripcion || p.description || p.desc || p.detail || "",
            categoria: categoriaNombre,
            categoria_id: categoria_id,
            precio: Number(p.precio ?? p.price ?? p.valor ?? 0) || 0,
            stock: p.stock ?? p.cantidad ?? 0,
          };
        });

        setProductos(mapped);
      } catch (err) {
        console.error("Error cargando productos/categorias:", err);
        setProductos([]); setCategorias([]);
      } finally {
        if (mounted) setCargando(false);
      }
    };
    fetchAll();
    return () => { mounted = false; };
  }, []);

  // carrito init (igual que antes)
  useEffect(() => {
    try {
      if (user) {
        const serverCart = JSON.parse(localStorage.getItem("cart_server") || "[]");
        prevServerCartCountRef.current = Array.isArray(serverCart) ? serverCart.length : 0;
        if (Array.isArray(serverCart) && serverCart.length > 0) {
          const mapped = serverCart.map((it) => ({
            nombre: it.producto?.nombre || it.producto?.name || "",
            descripcion: it.producto?.descripcion || it.producto?.description || "",
            categoria: it.producto?.categoria && typeof it.producto.categoria === "object" ? (it.producto.categoria.nombre || it.producto.categoria.name) : (it.producto?.categoria || "Otros"),
            precio: Number(it.producto?.precio ?? it.producto?.price ?? 0) || 0,
            cantidad: it.cantidad || 1,
            producto_id: it.producto?.id || null,
            id: it.producto?.id || null,
          }));
          setCarrito(mapped);
          return;
        }
      }
      const local = JSON.parse(localStorage.getItem("cart_local") || "[]");
      setCarrito(Array.isArray(local) ? local : []);
    } catch (e) {
      setCarrito([]);
    }
  }, [user]);

  useEffect(() => {
    try { localStorage.setItem("cart_local", JSON.stringify(carrito || [])); } catch (e) {}
    if (!user) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try {
        const itemsWithIds = (carrito || []).map((c) => ({
          producto_id: c.producto_id || c.id || null,
          cantidad: c.cantidad || 1,
        })).filter(i => i.producto_id);

        if (itemsWithIds.length > 0) {
          const res = await saveCart(itemsWithIds);
          const serverItems = res && res.items ? res.items : null;
          if (serverItems) {
            localStorage.setItem("cart_server", JSON.stringify(serverItems));
            prevServerCartCountRef.current = serverItems.length;
          } else {
            const serverCache = itemsWithIds.map(i => {
              const p = carrito.find(c => (c.producto_id || c.id) === i.producto_id) || {};
              return { producto: { id: i.producto_id, nombre: p.nombre, descripcion: p.descripcion, precio: p.precio, categoria: p.categoria }, cantidad: i.cantidad, total: String((Number(p.precio) || 0) * i.cantidad) };
            });
            localStorage.setItem("cart_server", JSON.stringify(serverCache));
            prevServerCartCountRef.current = serverCache.length;
          }
          return;
        }

        if ((carrito || []).length === 0 && prevServerCartCountRef.current > 0) {
          await saveCart([]);
          localStorage.setItem("cart_server", JSON.stringify([]));
          prevServerCartCountRef.current = 0;
        }
      } catch (e) {
        console.error("Error sincronizando carrito con servidor:", e);
      }
    }, 700);

    return () => { if (saveTimeout.current) clearTimeout(saveTimeout.current); };
  }, [carrito, user]);

  // filtrado por categoria: ahora categoriaSeleccionada guarda id (number) o null
  const productosFiltrados = categoriaSeleccionada
    ? productos.filter((p) => Number(p.categoria_id) === Number(categoriaSeleccionada))
    : productos;


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


  const handleSugerenciaClick = (nombre) => {
    setBusqueda(nombre);
    setSugerencias([]);
    setCategoriaSeleccionada(null);
  };

  const handleCategoria = (catId) => {
    setCategoriaSeleccionada(catId);

    setBusqueda("");
    setSugerencias([]);
  };


  const productosAMostrar =
    busqueda.length > 0
      ? productos.filter((p) =>
          p.nombre.toLowerCase().includes(busqueda.toLowerCase())
        )
      : productosFiltrados;

  const agregarAlCarrito = (producto) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setCarrito((prev) => {
      const existe = prev.find((item) => (item.producto_id ?? item.id) === (producto.producto_id ?? producto.id));
      if (existe) {
        return prev.map((item) =>
          (item.producto_id ?? item.id) === (producto.producto_id ?? producto.id)
            ? { ...item, cantidad: (item.cantidad || 0) + 1 }
            : item
        );
      } else {
        return [...prev, {
          ...producto,
          cantidad: 1,
          producto_id: producto.id ?? producto.producto_id ?? null
        }];

      }
    });
  };

  const quitarDelCarrito = (nombre) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    setCarrito((prev) => prev.filter((item) => item.nombre !== nombre));
  };

  const cambiarCantidad = (nombre, delta) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    setCarrito((prev) =>
      prev
        .map((item) =>
          item.nombre === nombre
            ? { ...item, cantidad: Math.max(1, (item.cantidad || 0) + delta) }

            : item
        )
        .filter((item) => item.cantidad > 0)
    );
  };

  const totalCarrito = carrito.reduce(
    (acc, item) => acc + (Number(item.precio) || 0) * (item.cantidad || 0),
    0
  );

  const handleFinalizarCompra = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (carrito.length === 0) return;
    try {
      const order = {
        items: carrito.map((c) => ({ producto_id: c.producto_id || c.id, cantidad: c.cantidad, precio: c.precio })),
        total: totalCarrito,
        user: user ? user.username : undefined,
        date: new Date().toISOString(),
      };
      await createOrder(order);
      setCarrito([]);
      setMostrarCarrito(false);
      alert("¡Gracias por tu compra!");
      localStorage.setItem("cart_server", JSON.stringify([]));
      localStorage.setItem("cart_local", JSON.stringify([]));
      prevServerCartCountRef.current = 0;
    } catch (err) {
      alert("Error al procesar la compra: " + (err.message || "Intente nuevamente"));
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
              <Dropdown.Item
                key="todas"
                onClick={() => handleCategoria(null)}
                active={categoriaSeleccionada === null}
              >
                Todas
              </Dropdown.Item>
              <Dropdown.Divider />
              {categorias.length === 0 ? (
                // fallback: mostrar algunas categorias hardcode si no hay backend
                ["Cañas", "Reels", "Señuelos", "Kits"].map((cat) => (
                  <Dropdown.Item
                    key={cat}
                    onClick={() => handleCategoria(cat)}
                    active={categoriaSeleccionada === cat}
                  >
                    {cat}
                  </Dropdown.Item>
                ))
              ) : (
                categorias.map((cat) => (
                  <Dropdown.Item
                    key={cat.id}
                    onClick={() => handleCategoria(cat.id)}
                    active={categoriaSeleccionada === cat.id}
                  >
                    {cat.nombre ?? cat.name}
                  </Dropdown.Item>
                ))
              )}

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
                  Iniciar sesion

                </Button>
                <Button
                  variant="info"
                  style={{ fontWeight: "bold", borderRadius: "12px", color: "#fff", background: "#0097a7", border: "none" }}
                  onClick={() => navigate("/register")}
                >
                  Registrarse

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
              onClick={() => {
                if (!user) setShowLoginModal(true);
                else setMostrarCarrito(true);
              }}
              disabled={!user}

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
                  {carrito.reduce((acc, item) => acc + (item.cantidad || 0), 0)}

                </span>
              )}
            </Button>
          </Stack>
        </Col>
      </Row>


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

      <Row className="justify-content-center">
        {cargando ? (
          <Col>
            <p>Cargando productos...</p>
          </Col>
        ) : productosAMostrar.length === 0 ? (

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
                    onClick={() => {
                      if (!user) setShowLoginModal(true);
                      else agregarAlCarrito(prod);
                    }}
                    disabled={!user}

                  >
                    Comprar
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>


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
                      ${Number(item.precio).toLocaleString("es-AR")}

                    </div>
                  </div>
                  <div className="d-flex align-items-center">
                    <Button
                      variant="outline-info"
                      size="sm"
                      className="me-2"
                      onClick={() => cambiarCantidad(item.nombre, -1)}
                      disabled={!user || item.cantidad === 1}

                    >
                      <FaMinus />
                    </Button>
                    <span style={{ minWidth: 32, textAlign: "center" }}>{item.cantidad}</span>
                    <Button
                      variant="outline-info"
                      size="sm"
                      className="ms-2"
                      onClick={() => cambiarCantidad(item.nombre, 1)}
                      disabled={!user}

                    >
                      <FaPlus />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="ms-3"
                      onClick={() => quitarDelCarrito(item.nombre)}
                      disabled={!user}

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
            disabled={carrito.length === 0 || !user}
            onClick={handleFinalizarCompra}

          >
            Finalizar compra
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showLoginModal} onHide={() => setShowLoginModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Iniciar sesión requerido</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Debes iniciar sesión para usar el carrito. ¿Querés iniciar sesión o registrarte?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-info" onClick={() => { setShowLoginModal(false); navigate("/register"); }}>
            Registrarse
          </Button>
          <Button variant="info" onClick={() => { setShowLoginModal(false); navigate("/login"); }}>
            Iniciar sesión
          </Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
}