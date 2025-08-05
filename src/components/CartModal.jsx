import React from "react";
import { Modal, Button, Table, Form } from "react-bootstrap";

export default function CartModal({ show, handleClose, carrito, setCarrito }) {
  // Cambiar cantidad de un producto
  const handleCantidad = (idx, cantidad) => {
    const nuevoCarrito = [...carrito];
    nuevoCarrito[idx].cantidad = Math.max(1, Number(cantidad));
    setCarrito(nuevoCarrito);
  };

  // Eliminar producto
  const handleEliminar = (idx) => {
    const nuevoCarrito = carrito.filter((_, i) => i !== idx);
    setCarrito(nuevoCarrito);
  };

  // Calcular total
  const total = carrito.reduce((acc, prod) => {
    // Extraer el precio del string de descripción
    const match = prod.descripcion.match(/\$([\d.]+)/);
    const precio = match ? parseFloat(match[1].replace(".", "")) : 0;
    return acc + precio * (prod.cantidad || 1);
  }, 0);

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Carrito de compras</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {carrito.length === 0 ? (
          <p>El carrito está vacío.</p>
        ) : (
          <Table responsive>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Imagen</th>
                <th>Cantidad</th>
                <th>Precio unitario</th>
                <th>Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {carrito.map((prod, idx) => {
                const match = prod.descripcion.match(/\$([\d.]+)/);
                const precio = match ? parseFloat(match[1].replace(".", "")) : 0;
                return (
                  <tr key={idx}>
                    <td>{prod.nombre}</td>
                    <td>
                      <img src={prod.imagen} alt={prod.nombre} style={{ width: 60, height: 40, objectFit: "contain" }} />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        min={1}
                        value={prod.cantidad || 1}
                        style={{ width: 70 }}
                        onChange={e => handleCantidad(idx, e.target.value)}
                      />
                    </td>
                    <td>${precio.toLocaleString()}</td>
                    <td>${(precio * (prod.cantidad || 1)).toLocaleString()}</td>
                    <td>
                      <Button variant="danger" size="sm" onClick={() => handleEliminar(idx)}>
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
        <div className="text-end mt-3">
          <strong>Total: ${total.toLocaleString()}</strong>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cerrar
        </Button>
        <Button variant="success" disabled={carrito.length === 0}>
          Finalizar compra
        </Button>
      </Modal.Footer>
    </Modal>
  );
}