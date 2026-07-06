// src/pages/Perfil.tsx
import { useEffect, useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { Mail, Phone, Save, ShieldCheck, User } from 'lucide-react'
import { db } from '../firebaseConfig'
import { useAuth } from '../context/AuthContext'
import './Perfil.css'

interface DatosCliente {
  nombre: string
  dni: string
  telefono: string
  email: string
  usuario: string
  fechaRegistro?: string
  rol?: string
}

function Perfil() {
  const { perfil, user } = useAuth()

  const [datos, setDatos] = useState<DatosCliente>({
    nombre: '',
    dni: '',
    telefono: '',
    email: '',
    usuario: '',
  })
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [okMsg, setOkMsg]         = useState('')
  const [errorMsg, setErrorMsg]   = useState('')

  // Carga los datos del cliente
  useEffect(() => {
    let cancel = false
    async function cargar() {
      if (!user?.uid) return
      try {
        const snap = await getDoc(doc(db, 'clientes', user.uid))
        if (snap.exists() && !cancel) {
          const d = snap.data() as any
          setDatos({
            nombre:   d.nombre   ?? perfil?.nombre  ?? '',
            dni:      d.dni      ?? '',
            telefono: d.telefono ?? '',
            email:    d.email    ?? user.email ?? '',
            usuario:  d.usuario  ?? '',
            fechaRegistro: d.fechaRegistro,
            rol:      d.rol      ?? perfil?.rol ?? 'Cliente',
          })
        } else if (!cancel) {
          setDatos((prev) => ({
            ...prev,
            nombre: perfil?.nombre ?? '',
            email:  user.email ?? '',
            rol:    perfil?.rol ?? 'Cliente',
          }))
        }
      } catch (e) {
        console.error(e)
        setErrorMsg('No se pudieron cargar tus datos.')
      } finally {
        if (!cancel) setLoading(false)
      }
    }
    cargar()
    return () => { cancel = true }
  }, [user?.uid, perfil?.nombre, perfil?.rol])

  const handleChange = (campo: keyof DatosCliente) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setDatos({ ...datos, [campo]: e.target.value })
  }

  const guardar = async () => {
    if (!user?.uid) return
    setSaving(true)
    setOkMsg('')
    setErrorMsg('')
    try {
      // Actualiza en `clientes/{uid}`, creando el doc si no existe.
      const ref = doc(db, 'clientes', user.uid)
      const payload = {
        nombre:   datos.nombre.trim(),
        dni:      datos.dni.trim(),
        telefono: datos.telefono.trim(),
        email:    datos.email.trim(),
        usuario:  datos.usuario.trim(),
      }
      await setDoc(ref, { ...payload, rol: datos.rol || perfil?.rol || 'Cliente', uid: user.uid }, { merge: true })
      // Sincroniza el nombre en `usuarios/{uid}` (fuente de verdad del rol),
      // creando el doc si todavía no existe.
      await setDoc(doc(db, 'usuarios', user.uid), { uid: user.uid, nombre: payload.nombre }, { merge: true })

      setOkMsg('¡Datos actualizados correctamente!')
    } catch (e: any) {
      console.error(e)
      setErrorMsg('No se pudieron guardar los cambios: ' + (e?.message || ''))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="perf-loading">Cargando tu perfil…</div>
  }

  return (
    <div className="perf-wrapper">
      <div className="perf-card">
        <div className="perf-head">
          <div className="perf-avatar">{(datos.nombre || 'U').charAt(0).toUpperCase()}</div>
          <div>
            <h2 className="perf-name">{datos.nombre || 'Sin nombre'}</h2>
            <p className="perf-email">{datos.email}</p>
            <span className="perf-role">
              <ShieldCheck size={13} /> {datos.rol || 'Cliente'}
            </span>
          </div>
        </div>

        {okMsg    && <div className="perf-alert ok">{okMsg}</div>}
        {errorMsg && <div className="perf-alert err">{errorMsg}</div>}

        <div className="perf-grid">
          <Field label="Nombres completos" icon={<User size={15} />}>
            <input value={datos.nombre} onChange={handleChange('nombre')} placeholder="Nombre" />
          </Field>

          <Field label="DNI" icon={<ShieldCheck size={15} />}>
            <input value={datos.dni} onChange={handleChange('dni')} placeholder="DNI" />
          </Field>

          <Field label="Teléfono" icon={<Phone size={15} />}>
            <input value={datos.telefono} onChange={handleChange('telefono')} placeholder="Celular" />
          </Field>

          <Field label="Correo electrónico" icon={<Mail size={15} />}>
            <input value={datos.email} disabled title="El correo no se puede modificar" />
          </Field>

          <Field label="Usuario" icon={<User size={15} />}>
            <input value={datos.usuario} onChange={handleChange('usuario')} placeholder="Usuario" />
          </Field>

          {datos.fechaRegistro && (
            <Field label="Fecha de registro">
              <input value={datos.fechaRegistro} disabled />
            </Field>
          )}
        </div>

        <div className="perf-actions">
          <button className="perf-save" onClick={guardar} disabled={saving}>
            <Save size={16} /> {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  icon,
  children,
}: {
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <label className="perf-field">
      <span>
        {icon} {label}
      </span>
      {children}
    </label>
  )
}

export default Perfil
