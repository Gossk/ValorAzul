import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import App from './App'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Register from './pages/Register'
import SimuladorVehicular from './pages/Simulador'

import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Login />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/clientes" element={<App />} />

        <Route path="/register" element={<Register />} />

        <Route path="/simulador" element={<SimuladorVehicular />} />

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
