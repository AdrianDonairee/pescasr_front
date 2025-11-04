import React, { createContext, useState, useContext, useEffect } from "react";
import { loginRequest, registerRequest, setTokens, clearAuthTokens, getCart, saveCart, getProfile } from "./services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // intentar recuperar user almacenado y refrescar perfil desde servidor (cookie o token)
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) { /* ignore parse errors */ }

    (async () => {
      try {
        const profile = await getProfile();
        if (profile) {
          // normalizar campo isAdmin
          profile.isAdmin = !!(profile.is_superuser || profile.is_staff || profile.isAdmin || profile.role === "admin");
          setUser(profile);
          localStorage.setItem("user", JSON.stringify(profile));
        }
      } catch (e) {
        // no autenticado o sesión inválida -> mantener null o stored user
      }
    })();
  }, []);

  async function mergeLocalIntoServerCart() {
    try {
      const serverCartRaw = await getCart().catch(() => []);
      const serverCart = Array.isArray(serverCartRaw) ? serverCartRaw : [];
      const localCart = JSON.parse(localStorage.getItem("cart_local") || "[]") || [];

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
        localStorage.setItem("cart_server", JSON.stringify(serverItems));
        const leftover = (localCart || []).filter(it => !(it.producto_id || it.id));
        localStorage.setItem("cart_local", JSON.stringify(leftover));
      } else {
        localStorage.setItem("cart_server", JSON.stringify(serverCart || []));
      }
    } catch (e) {
      try { localStorage.setItem("cart_server", JSON.stringify([])); } catch (err) {}
    }
  }

  const login = async (username, password) => {
    try {
      const data = await loginRequest(username, password);
      // si el backend devuelve tokens, guardarlos
      if (data && (data.access || data.token || data.refresh)) {
        const access = data.access || data.token || null;
        const refresh = data.refresh || null;
        setTokens({ access, refresh });
      }

      // pedir perfil actualizado (funciona con token o cookie de sesión)
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
      if (data && (data.access || data.token)) {
        const access = data.access || data.token;
        const refresh = data.refresh;
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