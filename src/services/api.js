const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";

function buildUrl(path) {
  return `${API_URL}${path.startsWith("/") ? path : "/" + path}`;
}

async function request(path, options = {}) {
  const url = buildUrl(path);
  const headers = { ...(options.headers || {}) };

  if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const access = localStorage.getItem("access_token") || localStorage.getItem("token");
  if (access) headers["Authorization"] = `Bearer ${access}`;

  const opts = {
    method: options.method || "GET",
    headers,
    credentials: options.credentials ?? "include",
    ...options,
  };

  if (opts.body && !(opts.body instanceof FormData) && typeof opts.body !== "string") {
    opts.body = JSON.stringify(opts.body);
  }

  const res = await fetch(url, opts);
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }

  if (!res.ok) {
    const message = (data && (data.detail || data.message)) || res.statusText || JSON.stringify(data);
    const err = new Error(message);
    err.status = res.status;
    err.body = data;
    throw err;
  }

  return data;
}

export function setTokens({ access, refresh }) {
  if (access) localStorage.setItem("access_token", access);
  if (refresh) localStorage.setItem("refresh_token", refresh);
}

export function clearAuthTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  localStorage.removeItem("cart_local");
  localStorage.removeItem("cart_server");
}

// Helper to unwrap DRF pagination objects
function unwrapResults(data) {
  if (!data) return data;
  if (Array.isArray(data)) return data;
  if (typeof data === "object" && data.results && Array.isArray(data.results)) return data.results;
  return data;
}

// auth
export async function loginRequest(username, password) {
  return request("/users/login/", { method: "POST", body: { username, password } });
}
export async function registerRequest(username, password, email) {
  const body = email ? { username, password, email } : { username, password };
  return request("/users/register/", { method: "POST", body });
}
export async function getProfile() {
  return request("/users/me/", { method: "GET" });
}

// cart
export async function getCart() {
  return request("/cart/", { method: "GET" });
}
export async function saveCart(items) {
  return request("/cart/", { method: "POST", body: { items } });
}

// productos / categorias
export async function getProducts(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const data = await request(`/productos/${qs ? `?${qs}` : ""}`, { method: "GET" });
  return unwrapResults(data);
}
export async function getCategories() {
  const data = await request("/categorias/", { method: "GET" });
  return unwrapResults(data);
}
export async function createProduct(product) {
  const body = { ...product };
  if (body.categoria && typeof body.categoria === "object") {
    body.categoria_id = body.categoria.id;
    delete body.categoria;
  }
  if (body.categoria_id === "") body.categoria_id = null;
  if (body.stock !== undefined) body.stock = Number(body.stock) || 0;
  return request("/productos/", { method: "POST", body });
}
export async function updateProduct(productId, product) {
  const body = { ...product };
  if (body.categoria && typeof body.categoria === "object") {
    body.categoria_id = body.categoria.id;
    delete body.categoria;
  }
  if (body.categoria_id === "") body.categoria_id = null;
  if (body.stock !== undefined) body.stock = Number(body.stock) || 0;
  return request(`/productos/${productId}/`, { method: "PUT", body });
}
export async function deleteProduct(productId) {
  return request(`/productos/${productId}/`, { method: "DELETE" });
}

export async function createOrder(order) {
  return request("/orders/", { method: "POST", body: order });
}