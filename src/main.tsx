import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Layout from './components/Layout'
import { AuthProvider } from './context/AuthContext'
import { RequireAuth, RequireRole } from './components/RouteGuards'

import Login from './pages/Login'
import Register from './pages/Register'
import Inicio from './pages/Inicio'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Simulador from './pages/Simulador'
import Historial from './pages/Historial'
import Ayuda from './pages/Ayuda'
import Usuarios from './pages/Usuarios'
import Configuracion from './pages/Configuracion'

import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Simulador tiene su propio layout interno — va fuera del wrapper.
              Sigue requiriendo sesión (Cliente o Administrador). */}
          <Route
            path="/simulador"
            element={
              <RequireAuth>
                <Simulador />
              </RequireAuth>
            }
          />

          {/* Rutas con Layout compartido (Outlet). Todas requieren sesión. */}
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            {/* Inicio → accesible para Cliente y Administrador */}
            <Route path="/inicio" element={<Inicio />} />

            {/* Rutas restringidas a Administrador */}
            <Route
              path="/dashboard"
              element={
                <RequireRole roles={['Administrador']}>
                  <Dashboard />
                </RequireRole>
              }
            />
            <Route
              path="/clientes"
              element={
                <RequireRole roles={['Administrador']}>
                  <Clientes />
                </RequireRole>
              }
            />
            <Route
              path="/historial"
              element={
                <RequireRole roles={['Administrador']}>
                  <Historial />
                </RequireRole>
              }
            />
            <Route
              path="/ayuda"
              element={
                <RequireRole roles={['Administrador']}>
                  <Ayuda />
                </RequireRole>
              }
            />
            <Route
              path="/usuarios"
              element={
                <RequireRole roles={['Administrador']}>
                  <Usuarios />
                </RequireRole>
              }
            />
            <Route
              path="/configuracion"
              element={
                <RequireRole roles={['Administrador']}>
                  <Configuracion />
                </RequireRole>
              }
            />
          </Route>

          {/* Cualquier ruta desconocida → /inicio */}
          <Route path="*" element={<Navigate to="/inicio" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
