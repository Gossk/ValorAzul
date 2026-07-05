// src/context/AuthContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
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
}

interface AuthContextValue {
  user: User | null
  perfil: PerfilUsuario | null
  loading: boolean
  logout: () => Promise<void>
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

  try {
    // 1) Colección usuarios (recomendada para admins)
    const usuarioSnap = await getDoc(doc(db, 'usuarios', user.uid))
    if (usuarioSnap.exists()) {
      const data = usuarioSnap.data() as any
      if (data.nombre) nombre = data.nombre
      if (data.rol === 'Administrador' || data.rol === 'Cliente') {
        rol = data.rol
      }
    } else {
      // 2) Colección clientes (creada por Register.tsx)
      const clienteSnap = await getDoc(doc(db, 'clientes', user.uid))
      if (clienteSnap.exists()) {
        const data = clienteSnap.data() as any
        if (data.nombre) nombre = data.nombre
        if (data.rol === 'Administrador' || data.rol === 'Cliente') {
          rol = data.rol
        }
      }
    }
  } catch (err) {
    console.warn('[AuthContext] No se pudo cargar el perfil desde Firestore:', err)
  }

  return {
    uid: user.uid,
    email: user.email,
    nombre,
    rol,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setLoading(true)
      setUser(u)
      if (u) {
        const p = await cargarPerfil(u)
        setPerfil(p)
      } else {
        setPerfil(null)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const logout = async () => {
    await signOut(auth)
    setUser(null)
    setPerfil(null)
  }

  const value: AuthContextValue = {
    user,
    perfil,
    loading,
    logout,
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
