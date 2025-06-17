import React from "react";
import Home from "./components/Home";
import Login from "./components/Login";
import Register from "./components/Register";
//import ProtectedRoute from "./components/ProtectedRoute";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<Home />} />
          {/* Podés agregar más rutas aquí */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;