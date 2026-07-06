// src/pages/Clientes.tsx
//
// Vista del ADMINISTRADOR con los CLIENTES reales del sistema.
// No hay creación / edición / eliminación: eso vive en "Usuarios".
// Aquí sólo se muestra:
//   • Nombre / email / fecha de registro.
//   • Estado en tiempo real: Conectado / Desconectado + "última conexión".
//   • Nº de simulaciones que ha guardado cada cliente.
//
// El estado Conectado se calcula comparando `ultimaConexion` del documento
// `usuarios/{uid}` con el reloj actual: si el ping tiene < 90 s → online.

import { useEffect, useMemo, useState } from 'react'
import { Search, Wifi, WifiOff } from 'lucide-react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import './Clientes.css'

interface UsuarioFS {
  id: string
  nombre: string
  email: string
  rol: 'Cliente' | 'Administrador'
  fechaRegistro: string
  ultimaConexionMs: number
  online: boolean
  activo: boolean
}

interface Fila extends UsuarioFS {
  conectado: boolean
  simulaciones: number
}

// Umbral: si el último ping tiene menos de este tiempo → sigue conectado
const ONLINE_MS = 90_000

function tiempoRelativo(msDelta: number): string {
  if (msDelta < 60_000)     return 'hace unos segundos'
  const min = Math.floor(msDelta / 60_000)
  if (min < 60)             return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24)               return `hace ${h} h`
  const d = Math.floor(h / 24)
  if (d < 30)               return `hace ${d} día${d !== 1 ? 's' : ''}`
  const meses = Math.floor(d / 30)
  return `hace ${meses} mes${meses !== 1 ? 'es' : ''}`
}

function formatearFechaHora(ms: number): string {
  if (!ms) return '—'
  return new Date(ms).toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function Clientes() {
  const [usuarios, setUsuarios] = useState<UsuarioFS[]>([])
  const [simCount, setSimCount] = useState<Record<string, number>>({})
  const [loading, setLoading]   = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [now, setNow]           = useState(Date.now())

  // ---- Suscripción: usuarios con rol Cliente ----
  useEffect(() => {
    const q = query(collection(db, 'usuarios'), where('rol', '==', 'Cliente'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const lista: UsuarioFS[] = []
        snap.forEach((d) => {
          const data = d.data() as any
          lista.push({
            id:               d.id,
            nombre:           data.nombre || 'Sin nombre',
            email:            data.email  || '',
            rol:              data.rol   === 'Administrador' ? 'Administrador' : 'Cliente',
            fechaRegistro:    data.fechaRegistro || '',
            ultimaConexionMs: Number(data.ultimaConexionMs) || 0,
            online:           !!data.online,
            activo:           typeof data.activo === 'boolean' ? data.activo : true,
          })
        })
        // Los activos primero, después alfabético
        lista.sort((a, b) => {
          if (a.activo !== b.activo) return a.activo ? -1 : 1
          return a.nombre.localeCompare(b.nombre)
        })
        setUsuarios(lista)
        setLoading(false)
      },
      (err) => {
        console.error('[Clientes] error:', err)
        setLoading(false)
      },
    )
    return () => unsub()
  }, [])

  // ---- Suscripción: simulaciones (para contar por cliente) ----
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'simulaciones'),
      (snap) => {
        const counts: Record<string, number> = {}
        snap.forEach((d) => {
          const uid = (d.data() as any).uid
          if (!uid) return
          counts[uid] = (counts[uid] || 0) + 1
        })
        setSimCount(counts)
      },
      (err) => console.warn('[Clientes] simulaciones:', err),
    )
    return () => unsub()
  }, [])

  // ---- Tick cada 20 s para refrescar el "hace X minutos" ----
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 20_000)
    return () => window.clearInterval(id)
  }, [])

  // ---- Derivados ----
  const filas: Fila[] = useMemo(() => {
    return usuarios.map((u) => {
      const conectado = u.online && u.ultimaConexionMs > 0 && (now - u.ultimaConexionMs) < ONLINE_MS
      return {
        ...u,
        conectado,
        simulaciones: simCount[u.id] || 0,
      }
    })
  }, [usuarios, simCount, now])

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return filas
    return filas.filter(
      (r) => r.nombre.toLowerCase().includes(q) || r.email.toLowerCase().includes(q),
    )
  }, [filas, busqueda])

  const stats = useMemo(() => {
    const total     = filas.length
    const online    = filas.filter((r) => r.conectado).length
    const activos   = filas.filter((r) => r.activo).length
    const inactivos = total - activos
    return { total, online, activos, inactivos }
  }, [filas])

  if (loading) {
    return <p style={{ color: 'rgba(255,255,255,0.6)', padding: 40, textAlign: 'center' }}>Cargando clientes...</p>
  }

  return (
    <>
      <div className="clientes-header">
        <div>
          <h3>Clientes registrados</h3>
          <p>
            {stats.total} cliente{stats.total !== 1 ? 's' : ''} · <b style={{ color: '#86efac' }}>{stats.online} conectado{stats.online !== 1 ? 's' : ''}</b> · {stats.activos} activo{stats.activos !== 1 ? 's' : ''} · {stats.inactivos} inactivo{stats.inactivos !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="clientes-search">
          <Search size={15} />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-card panel">
        <table className="clientes-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Email</th>
              <th>Simulaciones</th>
              <th>Estado</th>
              <th>Última conexión</th>
              <th>Registro</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((r, idx) => (
              <tr key={r.id} className={idx % 2 === 0 ? 'row-even' : ''} data-inactivo={!r.activo || undefined}>
                <td>
                  <div className="cliente-cell">
                    <div className="cliente-avatar">
                      {r.nombre.charAt(0).toUpperCase()}
                      <span className={`presence-dot ${r.conectado ? 'on' : 'off'}`} />
                    </div>
                    <div>
                      <strong>{r.nombre}</strong>
                      {!r.activo && <span className="tag-off">Cuenta inactiva</span>}
                    </div>
                  </div>
                </td>
                <td>{r.email || '—'}</td>
                <td>
                  <span className="badge badge-blue">{r.simulaciones}</span>
                </td>
                <td>
                  {r.conectado ? (
                    <span className="badge badge-green">
                      <Wifi size={11} style={{ marginRight: 4 }} /> Conectado
                    </span>
                  ) : (
                    <span className="badge badge-gray">
                      <WifiOff size={11} style={{ marginRight: 4 }} /> Desconectado
                    </span>
                  )}
                </td>
                <td>
                  {r.ultimaConexionMs > 0 ? (
                    <div>
                      <div style={{ fontSize: 13 }}>{tiempoRelativo(now - r.ultimaConexionMs)}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                        {formatearFechaHora(r.ultimaConexionMs)}
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>Nunca</span>
                  )}
                </td>
                <td>{r.fechaRegistro || '—'}</td>
              </tr>
            ))}
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.5)' }}>
                  {busqueda
                    ? 'No hay clientes que coincidan con la búsqueda.'
                    : 'Aún no hay clientes registrados. Los que se registren en /register aparecerán aquí.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default Clientes
