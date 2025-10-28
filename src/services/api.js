const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

function buildUrl(path) {
  // asegúrate de que path empiece con '/'
  return `${API_URL}${path.startsWith("/") ? path : "/" + path}`;
}

async function request(path, options = {}) {
  const url = buildUrl(path);
  const headers = { ...(options.headers || {}) };

  // Content-Type por defecto para JSON, salvo que se pase otro
  if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Authorization si existe access_token
  const access = localStorage.getItem("access_token");
  if (access) headers["Authorization"] = `Bearer ${access}`;

  const opts = { ...options, headers };

  if (opts.body && !(opts.body instanceof FormData) && typeof opts.body !== "string") {
    opts.body = JSON.stringify(opts.body);
  }

  const res = await fetch(url, opts);
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = (data && (data.detail || data.message || JSON.stringify(data))) || res.statusText;
    const err = new Error(message);
    err.status = res.status;
    err.body = data;
    throw err;
  }

  return data;
}

// Auth related helpers
export function setTokens({ access, refresh }) {
  if (access) localStorage.setItem("access_token", access);
  if (refresh) localStorage.setItem("refresh_token", refresh);
}

export function clearAuthTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
}

// Requests
export async function loginRequest(username, password) {
  // backend: POST /users/login/ -> { access, refresh }
  return request("/users/login/", { method: "POST", body: { username, password } });
}

export async function registerRequest(username, password, email) {
  // Ajustá los campos según backend; si no pide email, no lo envíes.
  const body = email ? { username, password, email } : { username, password };
  return request("/users/register/", { method: "POST", body });
}

export async function getProducts() {
  // Ajustá la ruta si es distinta en backend (ej. /ventas/products/)
  return request("/products/", { method: "GET" });
}

export async function createOrder(order) {
  return request("/orders/", { method: "POST", body: order });
}