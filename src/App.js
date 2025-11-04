import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext";

import Home from "./components/view/Home";
import Login from "./components/view/Login";
import Register from "./components/view/Register";
import Logout from "./components/view/Logout";
import AdminProducts from "./components/admin/AdminProducts";
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/Header";

import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/logout" element={<Logout />} />

            {/* Opción A: usar ProtectedRoute como wrapper con children */}
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminProducts />
                </ProtectedRoute>
              }
            />

            {/* Opción B (alternativa): usar ProtectedRoute como parent route con Outlet
                <Route element={<ProtectedRoute adminOnly={true} />}>
                  <Route path="/admin/products" element={<AdminProducts />} />
                </Route>
            */}
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  );
}

export default App;