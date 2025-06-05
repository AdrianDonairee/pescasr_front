import React, { createContext, useState, useContext } from "react";

// Usuarios hardcodeados de ejemplo
const initialUsers = [
  { username: "admin", password: "admin123" },
  { username: "user", password: "user123" }
];

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(initialUsers);
  const [user, setUser] = useState(null);

  // Login
  const login = (username, password) => {
    const found = users.find(
      (u) => u.username === username && u.password === password
    );
    if (found) {
      setUser(found);
      return true;
    }
    return false;
  };

  // Logout
  const logout = () => setUser(null);

  // Register
  const register = (username, password) => {
    if (users.some((u) => u.username === username)) return false;
    const newUser = { username, password };
    setUsers([...users, newUser]);
    setUser(newUser);
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar el contexto
export function useAuth() {
  return useContext(AuthContext);
}