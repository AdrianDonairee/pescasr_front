import React, { useEffect, useState } from "react";
import { Table, Button, Form, InputGroup, Alert } from "react-bootstrap";
import { getProducts, createProduct, updateProduct, deleteProduct, getCategories } from "../../services/api";
import { useAuth } from "../../AuthContext";
import { useNavigate } from "react-router-dom";

export default function AdminProducts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    precio: 0,
    descripcion: "",
    stock: 0,
    categoria_id: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    if (!user.isAdmin && !(user.is_staff || user.is_superuser)) {
      navigate("/home");
      return;
    }
    loadAll();
    // eslint-disable-next-line
  }, [user]);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [p, c] = await Promise.all([getProducts(), getCategories()]);
      console.log("API productos:", p);
      console.log("API categorias:", c);
      setProducts(Array.isArray(p) ? p : []);
      setCategories(Array.isArray(c) ? c : []);
      setForm((prev) => ({
        ...prev,
        categoria_id: prev.categoria_id ?? ((Array.isArray(c) && c[0] && c[0].id) || null),
      }));
    } catch (e) {
      console.error(e);
      setError("Error cargando productos/categorías desde el servidor");
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm({
      nombre: "",
      precio: 0,
      descripcion: "",
      stock: 0,
      categoria_id: (categories[0] && categories[0].id) || null,
    });
  }

  function openEdit(prod) {
    setEditingId(prod.id);
    setForm({
      nombre: prod.nombre ?? prod.title ?? "",
      precio: prod.precio ?? prod.price ?? 0,
      descripcion: prod.descripcion ?? prod.description ?? "",
      stock: prod.stock ?? prod.cantidad ?? 0,
      categoria_id: (prod.categoria && prod.categoria.id) ?? prod.categoria_id ?? null,
    });
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        nombre: String(form.nombre).trim(),
        precio: Number(form.precio) || 0,
        descripcion: String(form.descripcion || ""),
        stock: Number(form.stock) || 0,
        categoria_id: form.categoria_id === "" ? null : (form.categoria_id ?? null),
      };
      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await createProduct(payload);
      }
      await loadAll();
      setEditingId(null);
    } catch (err) {
      console.error(err);
      setError((err && err.message) || "Error al guardar el producto");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar producto?")) return;
    try {
      await deleteProduct(id);
      await loadAll();
    } catch (e) {
      console.error(e);
      setError("Error eliminando producto");
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Cargando panel admin...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Panel Admin - Productos</h2>
      <div style={{ marginBottom: 12 }}>
        <Button variant="success" onClick={openCreate}>Nuevo producto</Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 6, marginBottom: 18 }}>
        <Form onSubmit={handleSave} style={{ display: "grid", gap: 8 }}>
          <Form.Group className="mb-2">
            <Form.Label>Nombre</Form.Label>
            <Form.Control value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Precio</Form.Label>
            <InputGroup>
              <InputGroup.Text>$</InputGroup.Text>
              <Form.Control type="number" value={form.precio} onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })} required />
            </InputGroup>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Stock</Form.Label>
            <Form.Control type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} required />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Descripción</Form.Label>
            <Form.Control as="textarea" rows={2} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Categoría</Form.Label>
            <Form.Select
              value={form.categoria_id ?? ""}
              onChange={(e) => setForm({ ...form, categoria_id: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">Sin categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre ?? cat.name}
                </option>
              ))}
            </Form.Select>
            {categories.length === 0 && (
              <div style={{ marginTop: 6, color: "#6c757d", fontSize: 13 }}>
                No se encontraron categorías (revisá /api/categorias/ o DevTools → Network).
              </div>
            )}
          </Form.Group>

          <div>
            <Button variant="primary" type="submit">Guardar</Button>{" "}
            {editingId && <Button variant="secondary" type="button" onClick={() => { setEditingId(null); openCreate(); }}>Cancelar</Button>}
          </div>
        </Form>
      </div>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th><th>Nombre</th><th>Precio</th><th>Stock</th><th>Categoria</th><th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.nombre ?? p.title ?? p.name}</td>
              <td>{p.precio ?? p.price}</td>
              <td>{p.stock ?? (p.cantidad ?? "—")}</td>
              <td>{(p.categoria && (p.categoria.nombre ?? p.categoria.name)) || (p.categoria_id ? `#${p.categoria_id}` : "—")}</td>
              <td>
                <Button size="sm" variant="outline-primary" onClick={() => openEdit(p)} className="me-2">Editar</Button>
                <Button size="sm" variant="outline-danger" onClick={() => handleDelete(p.id)}>Borrar</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
