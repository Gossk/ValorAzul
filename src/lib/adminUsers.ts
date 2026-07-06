// src/lib/adminUsers.ts
//
// Helpers para que un Administrador cree y gestione otras cuentas de
// Administrador desde la propia UI (pestaña "Usuarios").
//
// Cómo se evita perder la sesión actual:
//   Firebase Auth solo permite un usuario "activo" por instancia de app.
//   Para crear otro usuario sin desloguear al admin actual, inicializamos
//   una app secundaria (`initializeApp` con un nombre), creamos ahí la
//   cuenta y luego llamamos `signOut` sobre esa app secundaria.
//   El admin actual permanece intacto en la app principal.

import { initializeApp, deleteApp, getApps } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, firebaseConfig } from '../firebaseConfig'

const SECONDARY_APP_NAME = 'valorazul-admin-worker'

function getSecondaryApp() {
  const existing = getApps().find((a) => a.name === SECONDARY_APP_NAME)
  if (existing) return existing
  return initializeApp(firebaseConfig, SECONDARY_APP_NAME)
}

/**
 * Crea una nueva cuenta con rol "Administrador".
 *
 * @returns UID del nuevo administrador.
 * @throws  Error con mensaje legible si algo falla.
 */
export async function crearAdministrador(params: {
  nombre: string
  email: string
  password: string
}): Promise<string> {
  const { nombre, email, password } = params
  const nombreTrim = nombre.trim()
  const emailTrim  = email.trim().toLowerCase()

  if (!nombreTrim) throw new Error('Ingresa un nombre.')
  if (!emailTrim)  throw new Error('Ingresa un correo electrónico.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
    throw new Error('El correo electrónico no es válido.')
  }
  if (password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres.')
  }

  // 1) Crear el usuario en Firebase Auth usando la app secundaria
  const secondary = getSecondaryApp()
  const secondaryAuth = getAuth(secondary)

  let newUid = ''
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, emailTrim, password)
    newUid = cred.user.uid
    try {
      await updateProfile(cred.user, { displayName: nombreTrim })
    } catch { /* opcional */ }

    // 2) Crear el documento con rol Administrador en Firestore
    await setDoc(doc(db, 'usuarios', newUid), {
      uid:            newUid,
      nombre:         nombreTrim,
      email:          emailTrim,
      rol:            'Administrador',
      activo:         true,
      fechaRegistro:  new Date().toLocaleDateString('es-PE'),
      creadoEnServer: serverTimestamp(),
    })

    return newUid
  } catch (err: any) {
    // Traducir códigos de Firebase Auth a mensajes en español
    const code = err?.code ?? ''
    if (code === 'auth/email-already-in-use')
      throw new Error('Ya existe una cuenta con ese correo electrónico.')
    if (code === 'auth/invalid-email')
      throw new Error('El correo electrónico no es válido.')
    if (code === 'auth/weak-password')
      throw new Error('La contraseña es muy débil (mínimo 6 caracteres).')
    throw new Error(err?.message || 'No se pudo crear el administrador.')
  } finally {
    // 3) Cerrar sesión en la app secundaria SIN afectar la principal.
    try { await signOut(secondaryAuth) } catch {}
    try { await deleteApp(secondary)   } catch {}
  }
}

/** Cambia el rol de un usuario existente ('Cliente' ⇄ 'Administrador').
 * Usa setDoc + merge porque algunos clientes antiguos solo existen en
 * `clientes/{uid}` y todavía no tienen espejo en `usuarios/{uid}`.
 */
export async function cambiarRol(
  uid: string,
  nuevoRol: 'Cliente' | 'Administrador',
  datos?: { nombre?: string; email?: string; fechaRegistro?: string },
) {
  const payload = {
    uid,
    ...(datos?.nombre ? { nombre: datos.nombre } : {}),
    ...(datos?.email ? { email: datos.email } : {}),
    ...(datos?.fechaRegistro ? { fechaRegistro: datos.fechaRegistro } : {}),
    rol: nuevoRol,
    activo: true,
    actualizadoEnServer: serverTimestamp(),
  }

  // Importante: setDoc con merge CREA el documento si no existe.
  // Esto soluciona clientes antiguos que solo existen en `clientes/{uid}`.
  await setDoc(doc(db, 'usuarios', uid), payload, { merge: true })

  // Mantiene sincronizado el rol visible en la colección de clientes.
  // Si reglas antiguas no permiten tocar `clientes`, no bloqueamos el cambio principal.
  try {
    await setDoc(
      doc(db, 'clientes', uid),
      {
        uid,
        ...(datos?.nombre ? { nombre: datos.nombre } : {}),
        ...(datos?.email ? { email: datos.email } : {}),
        rol: nuevoRol,
        estado: 'Activo',
        actualizadoEnServer: serverTimestamp(),
      },
      { merge: true },
    )
  } catch (err) {
    console.warn('[cambiarRol] No se pudo sincronizar clientes:', err)
  }
}

/** Activa o desactiva la cuenta (visualmente y para bloqueo posterior). */
export async function cambiarEstadoActivo(uid: string, activo: boolean) {
  await setDoc(
    doc(db, 'usuarios', uid),
    {
      uid,
      activo,
      actualizadoEnServer: serverTimestamp(),
    },
    { merge: true },
  )
  try {
    await setDoc(
      doc(db, 'clientes', uid),
      {
        uid,
        estado: activo ? 'Activo' : 'Inactivo',
        actualizadoEnServer: serverTimestamp(),
      },
      { merge: true },
    )
  } catch (err) {
    console.warn('[cambiarEstadoActivo] No se pudo sincronizar clientes:', err)
  }
}
