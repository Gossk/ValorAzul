import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Register from './pages/Register'
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
      <Routes>

        <Route path="/" element={<Login />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/clientes" element={<Clientes />} />

        <Route path="/simulador" element={<Simulador />} />

        <Route path="/historial" element={<Historial />} />

        <Route path="/ayuda" element={<Ayuda />} />

        <Route path="/usuarios" element={<Usuarios />} />

        <Route path="/configuracion" element={<Configuracion />} />

        <Route path="/register" element={<Register />} />

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
