// src/components/RouteGuards.tsx
import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth, type Rol } from '../context/AuthContext'

/**
 * Bloquea rutas para usuarios no autenticados.
 *
 * Diferencias importantes respecto a la versión anterior:
 *   - No mostramos un placeholder mientras `loading` es true si YA hay
 *     un `user` en memoria (evita que el layout desaparezca al navegar).
 *   - Sólo mostramos el placeholder inicial en el primer arranque
 *     (loading && !user).
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Arranque en frío: aún no sabemos si hay sesión → placeholder discreto
  if (loading && !user) {
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
 *
 * Mientras el perfil aún no cargó, mostramos los children (el propio Layout
 * se encarga de mostrar el sidebar con un default seguro). La página en sí
 * será re-evaluada cuando `perfil` esté disponible.
 */
export function RequireRole({
  roles,
  children,
}: {
  roles: Rol[]
  children: ReactNode
}) {
  const { perfil, loading } = useAuth()

  // Todavía no sabemos el rol: renderizamos placeholder ligero
  if (loading || !perfil) {
    return (
      <div style={{ color: 'rgba(255,255,255,0.7)', padding: 40, textAlign: 'center' }}>
        Verificando permisos...
      </div>
    )
  }
  if (!roles.includes(perfil.rol)) {
    const destino = perfil.rol === 'Administrador' ? '/dashboard' : '/inicio'
    return <Navigate to={destino} replace />
  }
  return <>{children}</>
}
