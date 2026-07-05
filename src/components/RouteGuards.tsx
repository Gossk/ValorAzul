// src/components/RouteGuards.tsx
import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth, type Rol } from '../context/AuthContext'

/**
 * Bloquea rutas para usuarios no autenticados.
 * Mientras se resuelve el estado de auth, muestra un placeholder.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{ color: 'rgba(255,255,255,0.7)', padding: 40, textAlign: 'center' }}>
        Cargando sesión...
      </div>
    )
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}

/**
 * Restringe una ruta a uno o varios roles.
 * Si el usuario no tiene el rol, se le redirige a /inicio.
 */
export function RequireRole({
  roles,
  children,
}: {
  roles: Rol[]
  children: ReactNode
}) {
  const { perfil, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ color: 'rgba(255,255,255,0.7)', padding: 40, textAlign: 'center' }}>
        Verificando permisos...
      </div>
    )
  }
  if (!perfil || !roles.includes(perfil.rol)) {
    return <Navigate to="/inicio" replace />
  }
  return <>{children}</>
}
