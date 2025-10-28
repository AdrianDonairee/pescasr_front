import React, { createContext, useState, useContext, useEffect } from "react";
import { loginRequest, registerRequest, setTokens, clearAuthTokens } from "./services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Cargar user y token desde localStorage si existen
    try {
      const stored = localStorage.getItem("user");
      const access = localStorage.getItem("access_token");
      if (stored && access) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Login: llama al backend, guarda tokens y user
  const login = async (username, password) => {
    try {
      const data = await loginRequest(username, password);
      // Esperamos { access, refresh } desde backend
      if (data && data.access) {
        setTokens({ access: data.access, refresh: data.refresh });
        const usr = { username }; // no hay user completo, mínimo guardamos username
        localStorage.setItem("user", JSON.stringify(usr));
        setUser(usr);
        return { ok: true };
      }
      return { ok: false, message: "Respuesta inválida del servidor" };
    } catch (err) {
      // err.body puede contener detalles del backend (ej. validaciones)
      const message =
        (err && err.body && (err.body.detail || JSON.stringify(err.body))) ||
        err.message ||
        "Error en login";
      return { ok: false, message };
    }
  };

  // Register: si el backend devuelve tokens al registrar, los guardamos también
  const register = async (username, password, email) => {
    try {
      const data = await registerRequest(username, password, email);
      // Si la API responde con tokens al crear usuario, guardarlos
      if (data && (data.access || data.token)) {
        const access = data.access || data.token;
        const refresh = data.refresh;
        setTokens({ access, refresh });
        const usr = { username };
        localStorage.setItem("user", JSON.stringify(usr));
        setUser(usr);
        return { ok: true };
      }
      // Si registro devuelve 201 y no tokens, retorná ok para que el usuario haga login
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