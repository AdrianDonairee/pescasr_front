import React, { useEffect, useState, useRef } from "react";
import {
  Container, Row, Col, Button, Form, InputGroup, Card, Dropdown, ListGroup, Modal
} from "react-bootstrap";
import { FaBars, FaShoppingCart, FaSearch, FaTrashAlt, FaPlus, FaMinus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import Logout from "./Logout";
import logo from "../../img/logo.png";
import { getProducts, createOrder, saveCart, getCategories } from "../../services/api";
import "./Home.css";

function serverCartKeyForUser(user) {
  if (!user) return "cart_server";
  const idOrName = (user.id !== undefined && user.id !== null) ? String(user.id) : String(user.username || "unknown");
  return `cart_server_user_${idOrName}`;
}

export default function Home() {

  const navigate = useNavigate();
  const { user } = useAuth();

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);

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

  useEffect(() => {
    try {
      if (user) {
        // read server cart stored under user-specific key
        const serverKey = serverCartKeyForUser(user);
        const serverCart = JSON.parse(localStorage.getItem(serverKey) || "[]");
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
          try {
            const res = await saveCart(itemsWithIds);
            const serverItems = res && res.items ? res.items : null;
            const serverKey = serverCartKeyForUser(user);
            if (serverItems) {
              localStorage.setItem(serverKey, JSON.stringify(serverItems));
              prevServerCartCountRef.current = serverItems.length;
            } else {
              const serverCache = itemsWithIds.map(i => {
                const p = carrito.find(c => (c.producto_id || c.id) === i.producto_id) || {};
                return { producto: { id: i.producto_id, nombre: p.nombre, descripcion: p.descripcion, precio: p.precio, categoria: p.categoria }, cantidad: i.cantidad, total: String((Number(p.precio) || 0) * i.cantidad) };
              });
              localStorage.setItem(serverKey, JSON.stringify(serverCache));
              prevServerCartCountRef.current = serverCache.length;
            }
          } catch (e) {
            // Si el servidor devolvió 400 con "Product X not found", el saveCart ya intentó filtrar y reintentar.
            // Aquí actualizamos el estado local para eliminar items inexistentes si el error lo indica.
            try {
              const body = e.body || {};
              const msgs = JSON.stringify(body);
              const missing = [...msgs.matchAll(/Product\s+(\d+)\s+not\s+found/gi)].map(g => Number(g[1]));
              if (missing.length > 0) {
                // eliminar del carrito local los productos que no existen
                const filtered = (carrito || []).filter(it => !missing.includes(Number(it.producto_id || it.id)));
                setCarrito(filtered);
                // actualizar cart_local para que no reaparezca
                localStorage.setItem("cart_local", JSON.stringify(filtered));
                // sincronizar vacío/filtrado con servidor en segundo plano
                try {
                  const itemsToSend = filtered.map(f => ({ producto_id: f.producto_id || f.id, cantidad: f.cantidad }));
                  await saveCart(itemsToSend);
                } catch (_) { /* ignore */ }
              } else {
                console.error("Error sincronizando carrito con servidor:", e);
              }
            } catch (xx) {
              console.error("Error sincronizando carrito con servidor:", e);
            }
          }
          return;
        }

        if ((carrito || []).length === 0 && prevServerCartCountRef.current > 0) {
          await saveCart([]);
          const serverKey = serverCartKeyForUser(user);
          localStorage.setItem(serverKey, JSON.stringify([]));
          prevServerCartCountRef.current = 0;
        }
      } catch (e) {
        console.error("Error sincronizando carrito con servidor:", e);
      }
    }, 700);

    return () => { if (saveTimeout.current) clearTimeout(saveTimeout.current); };
  }, [carrito, user]);

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
      const serverKey = serverCartKeyForUser(user);
      localStorage.setItem(serverKey, JSON.stringify([]));
      localStorage.setItem("cart_local", JSON.stringify([]));
      prevServerCartCountRef.current = 0;
    } catch (err) {
      alert("Error al procesar la compra: " + (err.message || "Intente nuevamente"));
    }
  };

  // Fix: define handleCardClick to open product modal
  const handleCardClick = (prod) => {
    setSelectedProduct(prod);
    setShowProductModal(true);
  };

  return (
    <Container fluid className="futuristic-root futuristic-container">
 
      {/* Header: logo + categorias (izq), título (centro), acciones (derecha) */}
      <Row className="align-items-center mb-4 futuristic-header">
         <Col xs="auto" className="d-flex align-items-center gap-3">
          <Dropdown>
            <Dropdown.Toggle variant="link" className="text-info p-0" style={{ textDecoration: "none" }}>
              <FaBars size={22} />
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => handleCategoria(null)} active={categoriaSeleccionada === null}>Todas</Dropdown.Item>
              <Dropdown.Divider />
              {categorias.length === 0 ? (
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

          <img src={logo} alt="Logo" className="brand-logo" />
        </Col>

        <Col className="text-center d-none d-md-block">
          <div className="brand-title">Pescasr</div>
        </Col>

        <Col xs="auto" className="d-flex align-items-center justify-content-end" style={{ marginLeft: "auto", gap: 8 }}>
          {/* Futuristic action buttons (moved to top-right) */}
          {!user ? (
            <>
              <Button
                variant="light"
                onClick={() => navigate("/login")}
                style={{ borderRadius: 12, padding: "8px 14px", fontWeight: 800, background: "linear-gradient(90deg,#bff8ff,#9a6bff)", color: "#021222", boxShadow: "0 8px 30px rgba(154,107,255,0.12)" }}
              >
                Iniciar sesión
              </Button>
              <Button
                variant="outline-light"
                onClick={() => navigate("/register")}
                style={{ borderRadius: 12, padding: "8px 14px", fontWeight: 800, color: "#bff8ff", borderColor: "rgba(191,248,255,0.18)" }}
              >
                Registrarse
              </Button>
            </>
          ) : (
            <>
              <span className="hello" style={{ fontWeight: 800, color: "var(--accent-a, #00e5ff)", marginRight: 8 }}>{user.username}</span>
              <Logout />
            </>
          )}

          <Button
            variant="dark"
            onClick={() => { if (!user) setShowLoginModal(true); else setMostrarCarrito(true); }}
            style={{ marginLeft: 8, position: "relative", borderRadius: 12, background: "rgba(0,0,0,0.25)", border: "1px solid rgba(191,248,255,0.06)" }}
          >
            <FaShoppingCart />
            {carrito.length > 0 && (
              <span style={{ position: "absolute", top: -6, right: -6, background: "#ff3d00", color: "#fff", borderRadius: "50%", fontSize: "0.75rem", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                {carrito.reduce((acc, item) => acc + (item.cantidad || 0), 0)}
              </span>
            )}
          </Button>
        </Col>
      </Row>

      {/* Search */}
      <Row className="justify-content-center mb-5 position-relative">
        <Col md={8}>
          <div className="search-wrap">
            <InputGroup className="search-group">
              <InputGroup.Text className="bg-search">
                <FaSearch />
              </InputGroup.Text>
              <Form.Control
                placeholder="Buscar productos..."
                className="search-input"
                style={{ fontSize: "1.05rem", letterSpacing: 0.6 }}
                value={busqueda}
                onChange={handleBusqueda}
                autoComplete="off"
              />
            </InputGroup>
          </div>
          {sugerencias.length > 0 && (
            <ListGroup className="position-absolute w-100 z-3" style={{ marginTop: 8, boxShadow: "0 12px 40px rgba(2,18,34,0.6)", background: "linear-gradient(180deg, rgba(2,18,34,0.95), rgba(6,24,36,0.95))" }}>
              {sugerencias.map((prod) => (
                <ListGroup.Item
                  key={prod.nombre}
                  action
                  onClick={() => handleSugerenciaClick(prod.nombre)}
                  style={{ background: "transparent", color: "#e6fbff" }}
                >
                  {prod.nombre}
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Col>
      </Row>

      {/* Products grid - NO TOCAR (contenido intacto) */}
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
              <Card className="futuristic-card product-card" onClick={() => handleCardClick(prod)}>
                <Card.Body>
                  <Card.Title className="product-title">{prod.nombre}</Card.Title>
                  <Card.Text className="product-desc">{prod.descripcion ? (prod.descripcion.length > 120 ? prod.descripcion.slice(0, 120) + "..." : prod.descripcion) : "Sin descripción"}</Card.Text>
                  <div className="meta-row">
                    <span className="category-badge">{prod.categoria}</span>
                    <span className="product-price">${Number(prod.precio).toLocaleString("es-AR")}</span>
                  </div>
                  <Button
                    variant="success"
                    className="buy-btn"
                    onClick={(e) => { e.stopPropagation(); if (!user) setShowLoginModal(true); else agregarAlCarrito(prod); }}
                    disabled={!user}
                  >
                    Comprar
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          )))}
      </Row>

      {/* Product details modal */}
      <Modal
        show={showProductModal}
        onHide={() => setShowProductModal(false)}
        centered
        size="lg"
        contentClassName="border-0"
        style={{ fontFamily: "Fira Mono, monospace" }}
      >
        <Modal.Header
          closeButton
          style={{
            background: "linear-gradient(90deg, rgba(0,229,255,0.04), rgba(138,92,255,0.03))",
            borderBottom: "1px solid rgba(191,248,255,0.06)",
            color: "#e6fbff",
          }}
        >
          <Modal.Title>
            {selectedProduct?.nombre || "Detalle del producto"}
          </Modal.Title>

        </Modal.Header>
        <Modal.Body style={{ background: "linear-gradient(180deg, rgba(2,18,34,0.95), rgba(6,24,36,0.95))", color: "#e6fbff" }}>
          <p className="product-modal-desc" style={{ whiteSpace: "pre-wrap", color: "#bfefff" }}>{selectedProduct?.descripcion || "No hay descripción para este producto."}</p>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
            <div style={{ fontWeight: 800 }}>{selectedProduct ? `$ ${Number(selectedProduct.precio).toLocaleString("es-AR")}` : ""}</div>
            <div style={{ color: "var(--muted)" }}>{selectedProduct ? selectedProduct.categoria : ""} • Stock: {selectedProduct?.stock ?? "N/A"}</div>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ background: "transparent", borderTop: "none" }}>
          <Button variant="secondary" onClick={() => setShowProductModal(false)}>Cerrar</Button>
          <Button variant="success" onClick={() => { if (!user) { setShowProductModal(false); setShowLoginModal(true); } else { agregarAlCarrito(selectedProduct); setShowProductModal(false); } }}>
            Agregar al carrito
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Cart modal */}
      <Modal show={mostrarCarrito} onHide={() => setMostrarCarrito(false)} centered size="lg" contentClassName="border-0 futuristic-modal">
        <Modal.Header closeButton style={{ background: "transparent", borderBottom: "none" }}>
          <Modal.Title><FaShoppingCart className="me-2" /> Carrito de compras</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {carrito.length === 0 ? <p>El carrito está vacío.</p> : (
            <ListGroup variant="flush">
              {carrito.map((item) => (
                <ListGroup.Item key={item.nombre} className="cart-item">
                  <div>
                    <span style={{ fontWeight: "bold" }}>{item.nombre}</span>
                    <span className="badge bg-info ms-2">{item.categoria}</span>
                    <div style={{ fontSize: "0.95rem", color: "#00e5ff" }}>
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
            background: "linear-gradient(90deg, rgba(0,229,255,0.02), rgba(138,92,255,0.02))",
            borderTop: "1px solid rgba(191,248,255,0.04)",
            color: "#e6fbff",
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

      {/* Login required modal */}
      <Modal show={showLoginModal} onHide={() => setShowLoginModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Iniciar sesión requerido</Modal.Title></Modal.Header>
        <Modal.Body><p>Debes iniciar sesión para usar el carrito. ¿Querés iniciar sesión o registrarte?</p></Modal.Body>
        <Modal.Footer>
          <Button variant="outline-info" onClick={() => { setShowLoginModal(false); navigate("/register"); }}>Registrarse</Button>
          <Button variant="info" onClick={() => { setShowLoginModal(false); navigate("/login"); }}>Iniciar sesión</Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
}