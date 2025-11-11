const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";
const USE_CREDENTIALS = (process.env.REACT_APP_API_USE_CREDENTIALS === "true");

function buildUrl(path) {
  return `${API_URL}${path.startsWith("/") ? path : "/" + path}`;
}

async function request(path, options = {}) {
  const url = buildUrl(path);
  const headers = { ...(options.headers || {}) };

  if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const AUTH_PREFIX = process.env.REACT_APP_AUTH_PREFIX || "Bearer"; // set to "Token" if backend expects "Token <key>"
  let access = localStorage.getItem("access_token") || localStorage.getItem("token") || localStorage.getItem("accessToken") || "";
  access = typeof access === "string" ? access.trim() : (access ? String(access) : "");
  if (access && !["", "null", "undefined"].includes(access.toLowerCase())) {
    const low = access.toLowerCase();
    if (low.startsWith("bearer ") || low.startsWith("token ")) {
      headers["Authorization"] = access; // already has prefix
    } else {
      headers["Authorization"] = `${AUTH_PREFIX} ${access}`; // add configured prefix
    }
  }
  const creds = options.credentials ?? (USE_CREDENTIALS ? "include" : "omit");

  const opts = {
    method: options.method || "GET",
    headers,
    credentials: creds,
    ...options,
  };

  if (opts.body && !(opts.body instanceof FormData) && typeof opts.body !== "string") {
    opts.body = JSON.stringify(opts.body);
  }

  try {
    const masked = access ? `${access.toString().slice(0, 8)}...` : "NONE";
    // eslint-disable-next-line no-console
    console.debug(`[API] ${opts.method} ${url} credentials=${creds} token=${masked}`, { headers: Object.keys(headers) });
  } catch (e) {}

  const res = await fetch(url, opts);
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }

  if (!res.ok) {
    const message = (data && (data.detail || data.message)) || res.statusText || JSON.stringify(data);
    const err = new Error(message);
    err.status = res.status;
    err.body = data;
    // If 401 and token looks invalid, clear stored tokens to avoid sending the same bad token
    if (res.status === 401) {
      try {
        const msg = typeof message === "string" ? message.toLowerCase() : JSON.stringify(message).toLowerCase();
        if (msg.includes("token") || msg.includes("no válido") || msg.includes("invalid") || msg.includes("no valido")) {
          // clear tokens cached in localStorage (uses the exported helper below)
          try { clearAuthTokens(); } catch (e) { /* ignore */ }
          // eslint-disable-next-line no-console
          console.warn("[API] cleared stored auth token due to 401 response:", message);
        }
      } catch (e) {}
    }
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

function unwrapResults(data) {
  if (!data) return data;
  if (Array.isArray(data)) return data;
  if (typeof data === "object" && data.results && Array.isArray(data.results)) return data.results;
  return data;
}

/* Auth */
export async function loginRequest(username, password) {

  // SimpleJWT TokenObtainPairView está en /api/token/
  return request("/token/", { method: "POST", body: { username, password } });

}
export async function registerRequest(username, password, email) {
  const body = email ? { username, password, email } : { username, password };
  return request("/users/register/", { method: "POST", body });
}
export async function getProfile() {
  return request("/users/me/", { method: "GET" });
}

/* Cart */
export async function getCart() {
  return request("/cart/", { method: "GET" });
}
export async function saveCart(items) {
  return request("/cart/", { method: "POST", body: { items } });
}

/* Productos / Categorias */
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

/* Orders */
export async function createOrder(order) {
  return request("/orders/", { method: "POST", body: order });
}