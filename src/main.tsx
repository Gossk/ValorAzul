import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Layout from './components/Layout'
import { AuthProvider, useAuth } from './context/AuthContext'
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
import MisSimulaciones from './pages/MisSimulaciones'
import Perfil from './pages/Perfil'

import './index.css'

/**
 * Redirige al "home" apropiado según el rol.
 *   Admin   → /dashboard
 *   Cliente → /inicio
 * Se usa como fallback de rutas desconocidas y del catch-all.
 */
function HomeRedirect() {
  const { perfil, loading, user } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={perfil?.rol === 'Administrador' ? '/dashboard' : '/inicio'} replace />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Simulador tiene su propio layout interno — va fuera del wrapper. */}
          <Route
            path="/simulador"
            element={
              <RequireAuth>
                <RequireRole roles={['Cliente', 'Administrador']}>
                  <Simulador />
                </RequireRole>
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
            {/* Mi Perfil → accesible para Cliente y Administrador */}
            <Route path="/perfil" element={<Perfil />} />

            {/* Sólo Cliente */}
            <Route
              path="/inicio"
              element={
                <RequireRole roles={['Cliente']}>
                  <Inicio />
                </RequireRole>
              }
            />
            <Route
              path="/mis-simulaciones"
              element={
                <RequireRole roles={['Cliente']}>
                  <MisSimulaciones />
                </RequireRole>
              }
            />
            <Route
              path="/ayuda"
              element={
                <RequireRole roles={['Cliente']}>
                  <Ayuda />
                </RequireRole>
              }
            />

            {/* Sólo Administrador */}
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
              path="/usuarios"
              element={
                <RequireRole roles={['Administrador']}>
                  <Usuarios />
                </RequireRole>
              }
            />
          </Route>

          {/* Cualquier ruta desconocida → home según rol */}
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
