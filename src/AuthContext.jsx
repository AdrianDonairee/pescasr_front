import React, { createContext, useState, useContext, useEffect } from "react";
import { loginRequest, registerRequest, setTokens, clearAuthTokens, getCart, saveCart, getProfile } from "./services/api";

const AuthContext = createContext();

function serverCartKeyForUser(user) {
  if (!user) return "cart_server";
  // prefer id if present, fallback to username
  const idOrName = (user.id !== undefined && user.id !== null) ? String(user.id) : String(user.username || "unknown");
  return `cart_server_user_${idOrName}`;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        // 1) Try to restore tokens first (so api will send Authorization headers)
        const access = localStorage.getItem("access") || localStorage.getItem("access_token") || localStorage.getItem("token");
        const refresh = localStorage.getItem("refresh") || localStorage.getItem("refresh_token");
        if (access) {
          try { setTokens({ access, refresh }); } catch (e) { /* ignore */ }
        }

        // 2) Then try to fetch fresh profile from backend
        const profile = await getProfile();
        if (profile) {
          profile.isAdmin = !!(profile.is_superuser || profile.is_staff || profile.isAdmin || profile.role === "admin");
          setUser(profile);
          localStorage.setItem("user", JSON.stringify(profile));
          return;
        }
      } catch (e) {
        // token invalid/expired or getProfile failed — fall through to fallback
      }

      // 3) Fallback: use stored user if present (no network/token)
      try {
        const stored = localStorage.getItem("user");
        if (stored) setUser(JSON.parse(stored));
      } catch (e) { /* ignore parse errors */ }
    })();
  }, []);

  async function mergeLocalIntoServerCart() {
    try {
      // Get server cart from API (requires auth)
      const serverCartRaw = await getCart().catch(() => []);
      const serverCart = Array.isArray(serverCartRaw) ? serverCartRaw : [];

      // Read local temp cart (anonymous)
      const localCart = JSON.parse(localStorage.getItem("cart_local") || "[]") || [];

      // Merge counts by producto_id
      const map = new Map();
      (serverCart || []).forEach(it => {
        const id = it.producto?.id;
        if (id) map.set(id, (map.get(id) || 0) + (it.cantidad || 1));
      });
      (localCart || []).forEach(it => {
        const id = it.producto_id || it.id || null;
        if (id) map.set(id, (map.get(id) || 0) + (it.cantidad || 1));
      });

      const itemsToSend = Array.from(map.entries()).map(([producto_id, cantidad]) => ({ producto_id, cantidad }));

      if (itemsToSend.length > 0) {
        const res = await saveCart(itemsToSend);
        const serverItems = res && res.items ? res.items : itemsToSend.map(i => ({ producto: { id: i.producto_id }, cantidad: i.cantidad }));

        // persist server cart under per-user key
        const key = serverCartKeyForUser(await getProfile().catch(() => null) || JSON.parse(localStorage.getItem("user") || "null"));
        localStorage.setItem(key, JSON.stringify(serverItems));

        // clear the anonymous local cart after merging
        localStorage.removeItem("cart_local");
        return;
      }

      // If nothing to send, still store the current serverCart under per-user key
      const profile = await getProfile().catch(() => null);
      const key = serverCartKeyForUser(profile || JSON.parse(localStorage.getItem("user") || "null"));
      localStorage.setItem(key, JSON.stringify(serverCart || []));
      // remove cart_local to avoid leaking to next user
      localStorage.removeItem("cart_local");
    } catch (e) {
      try { localStorage.setItem("cart_server", JSON.stringify([])); } catch (err) {}
    }
  }

  const login = async (username, password) => {
    try {
      const data = await loginRequest(username, password);

      // extraer token desde varias estructuras posibles
      const access =
        (data && (data.access || data.token)) ||
        (data && data.data && (data.data.access || data.data.token)) ||
        (data && data.tokens && (data.tokens.access || data.tokens.access_token)) ||
        null;
      const refresh =
        (data && data.refresh) ||
        (data && data.tokens && (data.tokens.refresh || data.tokens.refresh_token)) ||
        null;

      if (access) {
        setTokens({ access, refresh });
      }

      // intentar obtener perfil (funciona con token o cookie de sesión)
      let profile = null;
      try { profile = await getProfile(); } catch (e) { profile = null; }

      const usr = profile
        ? (() => {
            profile.isAdmin = !!(profile.is_superuser || profile.is_staff || profile.isAdmin || profile.role === "admin");
            return profile;
          })()
        : { username, isAdmin: false };

      localStorage.setItem("user", JSON.stringify(usr));
      setUser(usr);

      // merge local temporary cart into server cart for this user
      await mergeLocalIntoServerCart();
      return { ok: true };
    } catch (err) {
      const message =
        (err && err.body && (err.body.detail || JSON.stringify(err.body))) ||
        err.message ||
        "Error en login";
      return { ok: false, message };
    }
  };

  const register = async (username, password, email) => {
    try {
      const data = await registerRequest(username, password, email);
      const access =
        (data && (data.access || data.token)) ||
        (data && data.data && (data.data.access || data.data.token)) ||
        (data && data.tokens && (data.tokens.access || data.tokens.access_token)) ||
        null;
      const refresh =
        (data && data.refresh) ||
        (data && data.tokens && (data.tokens.refresh || data.tokens.refresh_token)) ||
        null;

      if (access) {
        setTokens({ access, refresh });

        let profile = null;
        try { profile = await getProfile(); } catch (e) { /* ignore */ }

        const usr = profile
          ? (() => {
              profile.isAdmin = !!(profile.is_superuser || profile.is_staff || profile.isAdmin || profile.role === "admin");
              return profile;
            })()
          : { username, isAdmin: false };

        localStorage.setItem("user", JSON.stringify(usr));
        setUser(usr);

        await mergeLocalIntoServerCart();

        return { ok: true };
      }
      return { ok: true };
    } catch (err) {
      const message =
        (err && err.body && (err.body.detail || JSON.stringify(err.body))) ||
        err.message ||
        "Error en registro";
      return { ok: false, message };
    }
  };

  const logout = () => {
    // clear auth tokens and local anonymous cart, but keep server cart per-user intact
    clearAuthTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}