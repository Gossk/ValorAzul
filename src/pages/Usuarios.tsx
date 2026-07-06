// src/pages/Usuarios.tsx
import { useEffect, useMemo, useState } from 'react'
import {
  Loader2,
  Plus,
  Search,
  ShieldAlert,
  UserPlus,
  X,
} from 'lucide-react'
import { collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { useAuth } from '../context/AuthContext'
import {
  cambiarEstadoActivo,
  crearAdministrador,
} from '../lib/adminUsers'
import './Usuarios.css'

type Rol = 'Cliente' | 'Administrador'

interface UsuarioRow {
  id: string
  nombre: string
  email: string
  rol: Rol
  activo: boolean
  fechaRegistro: string
  usuario?: string
  fuente: 'usuarios' | 'clientes'
}

function Usuarios() {
  const { perfil } = useAuth()

  const [rows, setRows]         = useState<UsuarioRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [busqueda, setBusqueda] = useState('')

  // Modal de creación
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ nombre: '', email: '', password: '' })
  const [creando, setCreando]     = useState(false)
  const [creadoOk, setCreadoOk]   = useState('')
  const [creadoErr, setCreadoErr] = useState('')

  // Acciones por fila
  const [busyId, setBusyId] = useState<string | null>(null)
  const [rowMsg, setRowMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null)

  const cargar = async () => {
    setLoading(true)
    setError('')
    try {
      // 1) Colección `usuarios` = fuente de verdad del rol.
      const usuariosSnap = await getDocs(collection(db, 'usuarios'))
      const byUid = new Map<string, UsuarioRow>()
      usuariosSnap.forEach((d) => {
        const data = d.data() as any
        byUid.set(d.id, {
          id:            d.id,
          nombre:        data.nombre || 'Sin nombre',
          email:         data.email  || '',
          rol:           data.rol === 'Administrador' ? 'Administrador' : 'Cliente',
          activo:        typeof data.activo === 'boolean' ? data.activo : true,
          fechaRegistro: data.fechaRegistro || '',
          fuente:        'usuarios',
        })
      })

      // 2) Colección `clientes` = usuarios registrados desde /register.
      //    Si no tienen doc en `usuarios` los agregamos (rol default: Cliente).
      try {
        const clientesSnap = await getDocs(collection(db, 'clientes'))
        clientesSnap.forEach((d) => {
          if (byUid.has(d.id)) return
          const data = d.data() as any
          byUid.set(d.id, {
            id:            d.id,
            nombre:        data.nombre || 'Sin nombre',
            email:         data.email  || '',
            rol:           data.rol === 'Administrador' ? 'Administrador' : 'Cliente',
            activo:        data.estado !== 'Inactivo',
            fechaRegistro: data.fechaRegistro || '',
            usuario:       data.usuario || '',
            fuente:        'clientes',
          })
        })
      } catch { /* clientes puede no existir aún */ }

      const list = Array.from(byUid.values()).sort((a, b) =>
        a.nombre.localeCompare(b.nombre),
      )
      setRows(list)
    } catch (err: any) {
      console.error(err)
      setError('No se pudo cargar la lista de usuarios: ' + (err?.message ?? ''))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  // -------- Guard visual --------
  if (perfil && perfil.rol !== 'Administrador') {
    return (
      <div className="access-denied">
        <ShieldAlert size={48} />
        <h2>Acceso restringido</h2>
        <p>Solo los usuarios con rol Administrador pueden ver esta sección.</p>
      </div>
    )
  }

  // -------- Filtro por búsqueda --------
  const filtered = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.nombre.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q),
    )
  }, [rows, busqueda])

  const stats = useMemo(() => {
    const total  = rows.length
    const admins = rows.filter((r) => r.rol === 'Administrador').length
    const clientes = total - admins
    const activos  = rows.filter((r) => r.activo).length
    return { total, admins, clientes, activos }
  }, [rows])

  // -------- Acciones de fila --------
  const onCambiarRol = async (row: UsuarioRow, nuevoRol: Rol) => {
    if (row.rol === nuevoRol) return
    // No permitir que un admin se despromocione a sí mismo (evita quedar sin admins)
    if (row.id === perfil?.uid && nuevoRol === 'Cliente') {
      const admins = rows.filter((r) => r.rol === 'Administrador').length
      if (admins <= 1) {
        setRowMsg({ id: row.id, text: 'No puedes degradarte: eres el único administrador.', ok: false })
        return
      }
      const ok = confirm('¿Seguro que quieres bajarte a Cliente? Perderás el acceso al panel de administración.')
      if (!ok) return
    }
    setBusyId(row.id)
    setRowMsg(null)
    try {
      // setDoc + merge CREA `usuarios/{uid}` si no existe. No usar updateDoc aquí,
      // porque clientes antiguos pueden existir solo en `clientes/{uid}`.
      await setDoc(
        doc(db, 'usuarios', row.id),
        {
          uid: row.id,
          nombre: row.nombre,
          email: row.email,
          fechaRegistro: row.fechaRegistro || new Date().toLocaleDateString('es-PE'),
          rol: nuevoRol,
          activo: true,
          actualizadoEnServer: serverTimestamp(),
        },
        { merge: true },
      )
      try {
        await setDoc(
          doc(db, 'clientes', row.id),
          {
            uid: row.id,
            nombre: row.nombre,
            email: row.email,
            rol: nuevoRol,
            estado: 'Activo',
            actualizadoEnServer: serverTimestamp(),
          },
          { merge: true },
        )
      } catch (syncErr) {
        console.warn('[Usuarios] No se pudo sincronizar clientes:', syncErr)
      }
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, rol: nuevoRol, activo: true, fuente: 'usuarios' } : r)))
      setRowMsg({ id: row.id, text: `Rol actualizado a ${nuevoRol}. El cambio aplicará en el siguiente inicio de sesión del usuario.`, ok: true })
    } catch (err: any) {
      setRowMsg({ id: row.id, text: err?.message || 'No se pudo cambiar el rol.', ok: false })
    } finally {
      setBusyId(null)
    }
  }

  const onCambiarEstado = async (row: UsuarioRow) => {
    if (row.id === perfil?.uid && row.activo) {
      const ok = confirm('¿Desactivar tu propia cuenta? Podrías perder acceso.')
      if (!ok) return
    }
    setBusyId(row.id)
    setRowMsg(null)
    try {
      await cambiarEstadoActivo(row.id, !row.activo)
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, activo: !row.activo, fuente: 'usuarios' } : r)))
      setRowMsg({ id: row.id, text: `Cuenta ${!row.activo ? 'activada' : 'desactivada'}.`, ok: true })
    } catch (err: any) {
      setRowMsg({ id: row.id, text: err?.message || 'No se pudo cambiar el estado.', ok: false })
    } finally {
      setBusyId(null)
    }
  }

  // -------- Modal crear admin --------
  const abrirModal = () => {
    setForm({ nombre: '', email: '', password: '' })
    setCreadoErr(''); setCreadoOk('')
    setModalOpen(true)
  }

  const submitCrear = async () => {
    setCreadoErr(''); setCreadoOk('')
    setCreando(true)
    try {
      await crearAdministrador(form)
      setCreadoOk(`Administrador "${form.nombre}" creado correctamente.`)
      await cargar()  // refresca lista
      setForm({ nombre: '', email: '', password: '' })
    } catch (err: any) {
      setCreadoErr(err?.message || 'No se pudo crear el administrador.')
    } finally {
      setCreando(false)
    }
  }

  return (
    <>
      <div className="usuarios-header">
        <div>
          <h3>Usuarios del sistema</h3>
          <p>
            {stats.total} usuario{stats.total !== 1 ? 's' : ''} · {stats.admins} administrador{stats.admins !== 1 ? 'es' : ''} · {stats.clientes} cliente{stats.clientes !== 1 ? 's' : ''} · {stats.activos} activo{stats.activos !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="usuarios-actions">
          <div className="usuarios-search">
            <Search size={15} />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <button className="btn-primary-users" onClick={abrirModal}>
            <UserPlus size={16} /> Nuevo administrador
          </button>
        </div>
      </div>

      {error && (
        <div className="usuarios-alert error">{error}</div>
      )}

      <div className="glass-card panel usuarios-table-panel">
        {loading ? (
          <p style={{ color: 'rgba(255,255,255,0.6)', padding: 40, textAlign: 'center' }}>
            <Loader2 size={16} className="spin" style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Cargando usuarios...
          </p>
        ) : (
          <div className="responsive-table-wrap">
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Registro</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, idx) => {
                const esYo = u.id === perfil?.uid
                return (
                  <tr key={u.id} className={idx % 2 === 0 ? 'row-even' : ''}>
                    <td>
                      <div className="usuario-cell">
                        <div className={`avatar-circle ${u.rol === 'Administrador' ? 'is-admin' : ''}`}>
                          {u.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{u.nombre}</strong>
                          {esYo && <span className="tag-you">tú</span>}
                          {u.fuente === 'clientes' && (
                            <p className="usuario-sub">Sin doc en <code>usuarios/</code></p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{u.email || '—'}</td>
                    <td>
                      <div className="role-control">
                        <select
                          className={u.rol === 'Administrador' ? 'role-select is-admin' : 'role-select is-client'}
                          value={u.rol}
                          disabled={busyId === u.id}
                          onChange={(e) => onCambiarRol(u, e.target.value as Rol)}
                          title="Cambiar rol del usuario"
                        >
                          <option value="Cliente">Cliente</option>
                          <option value="Administrador">Administrador</option>
                        </select>
                        {busyId === u.id && <Loader2 size={12} className="spin" />}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.activo ? 'badge-green' : 'badge-red'}`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>{u.fechaRegistro || '—'}</td>
                    <td>
                      <div className="usuarios-row-actions">
                        <button
                          className={`btn-mini ${u.activo ? 'ghost-red' : 'ghost-green'}`}
                          disabled={busyId === u.id}
                          onClick={() => onCambiarEstado(u)}
                          title={u.activo ? 'Desactivar cuenta' : 'Reactivar cuenta'}
                        >
                          {u.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                      {rowMsg?.id === u.id && (
                        <div className={`usuarios-inline ${rowMsg.ok ? 'ok' : 'err'}`}>
                          {rowMsg.text}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.55)' }}>
                    {busqueda
                      ? 'No hay usuarios que coincidan con tu búsqueda.'
                      : 'No hay usuarios registrados aún. Los que se registren desde /register aparecerán aquí.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* ── Modal: crear administrador ── */}
      {modalOpen && (
        <div className="usuarios-modal-backdrop" onClick={() => !creando && setModalOpen(false)}>
          <div className="usuarios-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="usuarios-modal-close"
              onClick={() => !creando && setModalOpen(false)}
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
            <h3 className="usuarios-modal-title">
              <UserPlus size={18} /> Nuevo administrador
            </h3>
            <p className="usuarios-modal-desc">
              Se creará una cuenta en Firebase Authentication y un documento
              con <code>rol: 'Administrador'</code> en <code>usuarios/{'{uid}'}</code>.
              Tu sesión actual no se cerrará.
            </p>

            <div className="usuarios-modal-form">
              <label>
                <span>Nombre completo</span>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Ana Martínez"
                  disabled={creando}
                />
              </label>
              <label>
                <span>Correo electrónico</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="admin@valorazul.com"
                  disabled={creando}
                />
              </label>
              <label>
                <span>Contraseña temporal (mín. 6)</span>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Se la darás al nuevo admin"
                  disabled={creando}
                />
              </label>

              {creadoErr && <div className="usuarios-alert error">{creadoErr}</div>}
              {creadoOk  && <div className="usuarios-alert ok">{creadoOk}</div>}

              <div className="usuarios-modal-actions">
                <button
                  className="btn-secondary-users"
                  onClick={() => setModalOpen(false)}
                  disabled={creando}
                >
                  Cerrar
                </button>
                <button
                  className="btn-primary-users"
                  onClick={submitCrear}
                  disabled={creando}
                >
                  {creando
                    ? (<><Loader2 size={14} className="spin" /> Creando...</>)
                    : (<><Plus size={14} /> Crear administrador</>)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Usuarios
