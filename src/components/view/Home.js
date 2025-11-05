import React, { useEffect, useState, useRef } from "react";
import {
  Container, Row, Col, Button, Form, InputGroup, Card, Stack, Dropdown, ListGroup, Modal
} from "react-bootstrap";
import { FaBars, FaShoppingCart, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import Logout from "./Logout";
import logo from "../../img/logo.png";
import { getProducts, createOrder, saveCart, getCategories } from "../../services/api";
import "./Home.css";

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

  // nuevo: detalle producto
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

  // nuevo: abrir modal detalle
  const openProductDetail = (prod) => {
    setSelectedProduct(prod);
    setShowProductModal(true);
  };
  const closeProductDetail = () => {
    setSelectedProduct(null);
    setShowProductModal(false);
  };

  return (
    <Container fluid className="min-vh-100 py-4 px-2 futuristic-container">
      <Row className="align-items-center mb-4">
        <Col xs="auto" className="d-flex align-items-center">
          <Dropdown>
            <Dropdown.Toggle variant="outline-info" className="transparent-toggle">
              <FaBars size={26} />
              <span className="ms-2 small text-info categories-label">Categorías</span>
            </Dropdown.Toggle>
            <Dropdown.Menu className="futuristic-dropdown">
              <Dropdown.Item key="todas" onClick={() => handleCategoria(null)} active={categoriaSeleccionada === null}>Todas</Dropdown.Item>
              <Dropdown.Divider />
              {categorias.length === 0 ? (
                ["Cañas", "Reels", "Señuelos", "Kits"].map((cat) => (
                  <Dropdown.Item key={cat} onClick={() => handleCategoria(cat)} active={categoriaSeleccionada === cat}>{cat}</Dropdown.Item>
                ))
              ) : (
                categorias.map((cat) => (
                  <Dropdown.Item key={cat.id} onClick={() => handleCategoria(cat.id)} active={categoriaSeleccionada === cat.id}>
                    {cat.nombre ?? cat.name}
                  </Dropdown.Item>
                ))
              )}
            </Dropdown.Menu>
          </Dropdown>
        </Col>

        <Col className="text-center">
          <div className="brand-row">
            <img src={logo} alt="Logo" className="brand-logo" />
            <span className="brand-title">Pescasr</span>
          </div>
        </Col>

        <Col xs="auto" className="d-flex align-items-center justify-content-end">
          <Stack direction="horizontal" gap={2} className="header-controls">
            {!user ? (
              <>
                <Button variant="outline-info" className="glass-btn" onClick={() => navigate("/login")}>Iniciar sesión</Button>
                <Button variant="info" className="solid-btn" onClick={() => navigate("/register")}>Registrarse</Button>
              </>
            ) : (
              <>
                <span className="greeting">¡Hola, {user.username}!</span>
                <Logout />
              </>
            )}
            <Button variant="outline-info" className="floating-cart-btn" onClick={() => { if (!user) setShowLoginModal(true); else setMostrarCarrito(true); }} disabled={!user}>
              <FaShoppingCart size={20} />
              {carrito.length > 0 && (<span className="cart-count-badge">{carrito.reduce((acc, item) => acc + (item.cantidad || 0), 0)}</span>)}
            </Button>
          </Stack>
        </Col>
      </Row>

      <Row className="justify-content-center mb-5 position-relative">
        <Col md={8}>
          <InputGroup className="search-group">
            <InputGroup.Text className="bg-search"><FaSearch /></InputGroup.Text>
            <Form.Control placeholder="Buscar productos..." className="search-input" value={busqueda} onChange={handleBusqueda} autoComplete="off" />
          </InputGroup>
          {sugerencias.length > 0 && (
            <ListGroup className="position-absolute w-100 suggestions-list">
              {sugerencias.map((prod) => (
                <ListGroup.Item key={prod.nombre} action onClick={() => handleSugerenciaClick(prod.nombre)}>{prod.nombre}</ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Col>
      </Row>

      <Row className="justify-content-center">
        {cargando ? (
          <Col><p>Cargando productos...</p></Col>
        ) : productosAMostrar.length === 0 ? (
          <Col><p>No se encontraron productos.</p></Col>
        ) : (
          productosAMostrar.map((prod, idx) => (
            <Col key={idx} xs={12} sm={6} md={3} className="mb-4 d-flex justify-content-center">
              <Card className="futuristic-card text-center">
                <Card.Body onClick={() => openProductDetail(prod)} style={{ cursor: "pointer" }}>
                  <Card.Title className="product-title">{prod.nombre}</Card.Title>
                  <Card.Text className="product-desc">{prod.descripcion ? prod.descripcion.substring(0,80) + (prod.descripcion.length>80?"...":"") : ""}</Card.Text>
                  <div className="product-price">Precio: ${Number(prod.precio || 0).toFixed(2)}</div>
                  <div style={{ height: 12 }}></div>
                  <div className="category-badge">{prod.categoria}</div>
                  <div style={{ marginTop: 10 }}>
                    <Button variant="success" className="buy-btn" onClick={(e) => { e.stopPropagation(); if (!user) setShowLoginModal(true); else agregarAlCarrito(prod); }} disabled={!user}>Comprar</Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>

      {/* Product detail modal */}
      <Modal show={showProductModal} onHide={closeProductDetail} centered contentClassName="futuristic-modal">
        <Modal.Header closeButton>
          <Modal.Title>{selectedProduct?.nombre}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p style={{ fontWeight: 700, color: "#00e5ff" }}>Precio: ${selectedProduct ? Number(selectedProduct.precio).toFixed(2) : "0.00"}</p>
          <p>{selectedProduct?.descripcion || "Sin descripción"}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-info" onClick={closeProductDetail}>Cerrar</Button>
          <Button variant="success" onClick={() => { if (!user) { setShowLoginModal(true); } else { agregarAlCarrito(selectedProduct); closeProductDetail(); } }}>Agregar al carrito</Button>
        </Modal.Footer>
      </Modal>

      {/* Carrito modal */}
      <Modal show={mostrarCarrito} onHide={() => setMostrarCarrito(false)} centered size="lg" contentClassName="futuristic-modal">
        <Modal.Header closeButton><Modal.Title>Carrito</Modal.Title></Modal.Header>
        <Modal.Body>
          {carrito.length === 0 ? <p>El carrito está vacío.</p> : (
            <ListGroup>
              {carrito.map((item) => (
                <ListGroup.Item key={item.nombre} className="d-flex justify-content-between align-items-center cart-item">
                  <div>
                    <strong>{item.nombre}</strong>
                    <div className="text-muted">{item.categoria}</div>
                  </div>
                  <div className="d-flex align-items-center">
                    <Button size="sm" variant="outline-secondary" onClick={() => cambiarCantidad(item.nombre, -1)}>-</Button>
                    <span className="mx-2">{item.cantidad}</span>
                    <Button size="sm" variant="outline-secondary" onClick={() => cambiarCantidad(item.nombre, 1)}>+</Button>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div style={{ marginRight: "auto", fontWeight: "bold" }}>Total: ${totalCarrito.toFixed(2)}</div>
          <Button variant="success" onClick={handleFinalizarCompra} disabled={carrito.length === 0}>Finalizar</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showLoginModal} onHide={() => setShowLoginModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Iniciar sesión requerido</Modal.Title></Modal.Header>
        <Modal.Body>Debes iniciar sesión para usar el carrito.</Modal.Body>
        <Modal.Footer>
          <Button variant="outline-info" onClick={() => { setShowLoginModal(false); navigate("/register"); }}>Registrarse</Button>
          <Button variant="info" onClick={() => { setShowLoginModal(false); navigate("/login"); }}>Iniciar sesión</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}