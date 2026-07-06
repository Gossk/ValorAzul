// src/context/AuthContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebaseConfig'

/**
 * Roles soportados por la aplicación.
 * - 'Cliente'        → usuario final que se registra por la web.
 * - 'Administrador'  → cuenta interna con acceso completo al sistema
 *                      (por ahora se marca manualmente en Firestore).
 */
export type Rol = 'Cliente' | 'Administrador'

export interface PerfilUsuario {
  uid: string
  email: string | null
  nombre: string
  rol: Rol
  activo: boolean
}

interface AuthContextValue {
  user: User | null
  perfil: PerfilUsuario | null
  loading: boolean
  logout: () => Promise<void>
  /** Refresca el perfil desde Firestore (útil tras editar rol/nombre). */
  refreshPerfil: () => Promise<void>
  /** true si aún no terminamos de resolver auth+perfil. */
  isReady: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/**
 * Lee el perfil del usuario desde Firestore.
 *
 * Estrategia:
 *   1. Primero se busca en la colección `usuarios/{uid}` (fuente única de rol).
 *   2. Si no existe, se busca en `clientes/{uid}` (creada al registrarse).
 *   3. Si no hay nada, se asume rol 'Cliente' por defecto.
 *
 * Un usuario se convierte en 'Administrador' cuando en Firestore el documento
 * `usuarios/{uid}` (o `clientes/{uid}`) tiene el campo `rol: 'Administrador'`.
 */
async function cargarPerfil(user: User): Promise<PerfilUsuario> {
  let nombre = user.displayName || user.email?.split('@')[0] || 'Usuario'
  let rol: Rol = 'Cliente'
  let activo = true

  try {
    // Leemos ambas colecciones. `usuarios/{uid}` es la fuente principal del rol,
    // pero algunos clientes antiguos solo tienen `clientes/{uid}` o tienen un
    // `usuarios/{uid}` parcial creado por el heartbeat sin campo `rol`.
    const usuarioRef = doc(db, 'usuarios', user.uid)
    const clienteRef = doc(db, 'clientes', user.uid)
    const [usuarioSnap, clienteSnap] = await Promise.all([
      getDoc(usuarioRef),
      getDoc(clienteRef),
    ])

    const usuarioData = usuarioSnap.exists() ? (usuarioSnap.data() as any) : null
    const clienteData = clienteSnap.exists() ? (clienteSnap.data() as any) : null

    nombre = usuarioData?.nombre || clienteData?.nombre || nombre

    if (usuarioData?.rol === 'Administrador' || usuarioData?.rol === 'Cliente') {
      rol = usuarioData.rol
    } else if (clienteData?.rol === 'Administrador' || clienteData?.rol === 'Cliente') {
      rol = clienteData.rol
    }

    if (typeof usuarioData?.activo === 'boolean') {
      activo = usuarioData.activo
    } else if (typeof clienteData?.activo === 'boolean') {
      activo = clienteData.activo
    } else if (clienteData?.estado === 'Inactivo') {
      activo = false
    }

    // Normaliza documentos parciales: si falta `usuarios/{uid}` o no tiene rol,
    // lo crea/actualiza sin borrar datos existentes. Así Cliente y Administrador
    // quedan diferenciados siempre por `usuarios.rol`.
    if (!usuarioSnap.exists() || !usuarioData?.rol) {
      await setDoc(
        usuarioRef,
        {
          uid: user.uid,
          email: user.email,
          nombre,
          rol,
          activo,
          fechaRegistro: usuarioData?.fechaRegistro || clienteData?.fechaRegistro || new Date().toLocaleDateString('es-PE'),
        },
        { merge: true },
      )
    }
  } catch (err) {
    console.warn('[AuthContext] No se pudo cargar el perfil desde Firestore:', err)
  }

  return {
    uid: user.uid,
    email: user.email,
    nombre,
    rol,
    activo,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        // Cargamos el perfil sin bajar `loading` a true de nuevo si ya
        // teníamos uno: así el sidebar/menú no "parpadea" entre navegaciones.
        const p = await cargarPerfil(u)
        setPerfil(p)
      } else {
        setPerfil(null)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  // Escucha cambios de rol en tiempo real. Si un admin promueve/degrada a un
  // usuario, la sesión abierta actualiza permisos y sidebar sin reloguear.
  useEffect(() => {
    if (!user?.uid) return
    const unsub = onSnapshot(doc(db, 'usuarios', user.uid), (snap) => {
      if (!snap.exists()) return
      const data = snap.data() as any
      setPerfil((prev) => {
        if (!prev) return prev
        const nextRol: Rol = data.rol === 'Administrador' ? 'Administrador' : 'Cliente'
        return {
          ...prev,
          nombre: data.nombre || prev.nombre,
          rol: nextRol,
          activo: typeof data.activo === 'boolean' ? data.activo : prev.activo,
        }
      })
    }, (err) => console.warn('[AuthContext] rol listener:', err))
    return () => unsub()
  }, [user?.uid])

  // ── Heartbeat de conexión ──
  // Marcamos al usuario como "en línea" mientras el navegador esté abierto
  // (ping cada 45 s + ping al cerrar/refrescar la pestaña). El estado
  // `Conectado` se calcula en el cliente comparando `ultimaConexion` con
  // el reloj: si el ping tiene < ~90 s → Conectado.
  useEffect(() => {
    if (!user?.uid) return

    const ping = async (offline: boolean = false) => {
      try {
        await setDoc(
          doc(db, 'usuarios', user.uid),
          {
            ultimaConexion:       serverTimestamp(),
            ultimaConexionMs:     Date.now(),
            online:               !offline,
          },
          { merge: true },
        )
      } catch (err) {
        console.warn('[heartbeat]', err)
      }
    }

    ping()
    const interval = window.setInterval(() => ping(false), 45_000)

    const onLeave = () => { ping(true) }
    window.addEventListener('beforeunload', onLeave)
    window.addEventListener('pagehide', onLeave)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('beforeunload', onLeave)
      window.removeEventListener('pagehide', onLeave)
      // No forzamos offline aquí porque el efecto se limpia también
      // al cambiar de página; solo lo hacemos al cerrar el tab.
    }
  }, [user?.uid])

  const refreshPerfil = async () => {
    if (!user) return
    const p = await cargarPerfil(user)
    setPerfil(p)
  }

  const logout = async () => {
    // Marcamos offline antes de cerrar la sesión
    if (user?.uid) {
      try {
        await setDoc(
          doc(db, 'usuarios', user.uid),
          { online: false, ultimaConexion: serverTimestamp(), ultimaConexionMs: Date.now() },
          { merge: true },
        )
      } catch {}
    }
    await signOut(auth)
    setUser(null)
    setPerfil(null)
  }

  const value: AuthContextValue = {
    user,
    perfil,
    loading,
    logout,
    refreshPerfil,
    isReady: !loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** Hook para consumir el contexto de autenticación. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }
  return ctx
}
