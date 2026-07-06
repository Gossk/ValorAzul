// src/pages/Historial.tsx
//
// Historial del ADMINISTRADOR: SOLO simulaciones REALES que los clientes
// guardaron desde el simulador. Sin seeds ni datos ficticios.

import { useEffect, useMemo, useState } from 'react'
import { CircleDollarSign, ClipboardList, Download, XCircle } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import './Historial.css'

type EstadoSimulacion = 'Aprobada' | 'En evaluación' | 'Rechazada' | 'Guardada'

interface RegistroFS {
  id: string
  uid?: string
  cliente: string
  vehiculo: string
  tipo: 'Nuevo' | 'Usado'
  monto: number
  cuota: number
  plazo: number
  estado: EstadoSimulacion
  fecha: string
  creadoEn?: number
  tcea?: number
  totalPagar?: number
}

const badgeClass: Record<string, string> = {
  Aprobada:        'badge-green',
  'En evaluación': 'badge-blue',
  Rechazada:       'badge-red',
  Guardada:        'badge-purple',
}

const timelineIcon: Record<string, typeof CircleDollarSign> = {
  Aprobada:        CircleDollarSign,
  'En evaluación': ClipboardList,
  Rechazada:       XCircle,
  Guardada:        ClipboardList,
}

const NOMBRES_MES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function Historial() {
  const [historial, setHistorial] = useState<RegistroFS[]>([])
  const [loading, setLoading]     = useState(true)
  const [busyId, setBusyId]       = useState<string | null>(null)

  const [desde, setDesde]       = useState('')
  const [hasta, setHasta]       = useState('')
  const [estado, setEstado]     = useState('Todos')
  const [cliente, setCliente]   = useState('Todos')

  // ---- Suscripción en tiempo real ----
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'historial'),
      (snap) => {
        const lista: RegistroFS[] = []
        snap.forEach((docSnap) => {
          const data = docSnap.data() as any
          lista.push({
            id: docSnap.id,
            uid: data.uid,
            cliente: data.cliente || '',
            vehiculo: data.vehiculo || '',
            tipo: (data.tipo as any) || 'Nuevo',
            monto: Number(data.monto) || 0,
            cuota: Number(data.cuota) || 0,
            plazo: Number(data.plazo) || 0,
            estado: (data.estado as EstadoSimulacion) || 'En evaluación',
            fecha: data.fecha || '',
            creadoEn: Number(data.creadoEn) || 0,
            tcea: Number(data.tcea) || 0,
            totalPagar: Number(data.totalPagar) || 0,
          })
        })
        lista.sort((a, b) => (b.creadoEn || 0) - (a.creadoEn || 0))
        setHistorial(lista)
        setLoading(false)
      },
      (err) => {
        console.error('Error cargando historial:', err)
        setLoading(false)
      },
    )
    return () => unsub()
  }, [])

  const clientesUnicos = useMemo(() => {
    return Array.from(new Set(historial.map((h) => h.cliente))).filter(Boolean)
  }, [historial])

  const simulacionesPorMes = useMemo(() => {
    const meses: Record<string, number> = {}
    for (const h of historial) {
      const [, m] = h.fecha.split('/').map(Number)
      if (!m) continue
      const key = NOMBRES_MES[m - 1] || 'N/A'
      meses[key] = (meses[key] || 0) + 1
    }
    return NOMBRES_MES.filter((n) => meses[n]).map((mes) => ({ mes, simulaciones: meses[mes] }))
  }, [historial])

  const parseFecha = (fecha: string) => {
    const [d, m, y] = fecha.split('/').map(Number)
    if (!d || !m || !y) return 0
    return new Date(y, m - 1, d).getTime()
  }

  const filtrados = useMemo(() => {
    return historial.filter((h) => {
      const matchEstado  = estado  === 'Todos' || h.estado  === estado
      const matchCliente = cliente === 'Todos' || h.cliente === cliente
      const fechaTime    = parseFecha(h.fecha)
      const matchDesde   = !desde || fechaTime >= new Date(desde).getTime()
      const matchHasta   = !hasta || fechaTime <= new Date(hasta).getTime()
      return matchEstado && matchCliente && matchDesde && matchHasta
    })
  }, [historial, desde, hasta, estado, cliente])

  const handleExportCSV = () => {
    const headers = ['Cliente', 'Vehículo', 'Tipo', 'Monto', 'Cuota', 'Plazo', 'TCEA', 'Estado', 'Fecha']
    const rows = filtrados.map((h) => [h.cliente, h.vehiculo, h.tipo, h.monto, h.cuota, h.plazo, h.tcea?.toFixed(2) ?? '', h.estado, h.fecha])
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'historial_valorazul.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const cambiarEstado = async (id: string, nuevo: EstadoSimulacion) => {
    setBusyId(id)
    try {
      await updateDoc(doc(db, 'historial', id), { estado: nuevo })
      // onSnapshot refresca automáticamente
    } catch (err) {
      console.error(err)
      alert('No se pudo actualizar el estado.')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return <p style={{ color: 'rgba(255,255,255,0.6)', padding: 40, textAlign: 'center' }}>Cargando historial...</p>
  }

  return (
    <>
      {/* -------- Filtros -------- */}
      <div className="historial-filters">
        <div className="filter-group">
          <label>Desde</label>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="filter-group">
          <label>Hasta</label>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
        <div className="filter-group">
          <label>Estado</label>
          <select value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option>Todos</option>
            <option>Aprobada</option>
            <option>En evaluación</option>
            <option>Rechazada</option>
            <option>Guardada</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Cliente</label>
          <select value={cliente} onChange={(e) => setCliente(e.target.value)}>
            <option>Todos</option>
            {clientesUnicos.map((c) => (<option key={c}>{c}</option>))}
          </select>
        </div>
        <button className="btn export-btn" onClick={handleExportCSV} disabled={filtrados.length === 0}>
          <Download size={15} /> Exportar CSV
        </button>
      </div>

      {/* -------- Chart -------- */}
      <div className="glass-card chart-panel">
        <h3>Volumen de simulaciones por mes</h3>
        <div className="rechart-box">
          {simulacionesPorMes.length === 0 ? (
            <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
              Aún no hay simulaciones guardadas.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={simulacionesPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="mes" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                <YAxis allowDecimals={false} stroke="rgba(255,255,255,0.4)" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: 'rgba(13,27,53,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 13 }}
                  itemStyle={{ color: '#f0f4ff' }}
                />
                <Bar dataKey="simulaciones" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* -------- Grid: Timeline + Table -------- */}
      <div className="historial-grid">
        <div className="glass-card panel">
          <h3>Actividad reciente</h3>
          <div className="timeline">
            {historial.slice(0, 8).map((item) => {
              const Icon = timelineIcon[item.estado] || ClipboardList
              const badgeCls = badgeClass[item.estado] || 'badge-blue'
              return (
                <div key={item.id} className="timeline-item">
                  <div className={`timeline-icon ${badgeCls}`}>
                    <Icon size={16} />
                  </div>
                  <div className="timeline-content">
                    <strong>{item.cliente}</strong>
                    <p>{item.vehiculo}</p>
                    <span className={`badge ${badgeCls}`}>{item.estado}</span>
                  </div>
                  <small>{item.fecha}</small>
                </div>
              )
            })}
            {historial.length === 0 && (
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', padding: 30 }}>
                Sin actividad aún.
              </p>
            )}
          </div>
        </div>

        <div className="glass-card panel">
          <h3>Historial completo ({filtrados.length})</h3>
          <div className="table-wrap">
            <table className="historial-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Vehículo</th>
                  <th>Monto</th>
                  <th>Cuota</th>
                  <th>Plazo</th>
                  <th>TCEA</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 0 ? 'row-even' : ''}>
                    <td>{item.cliente}</td>
                    <td>{item.vehiculo}</td>
                    <td>S/ {item.monto.toLocaleString('es-PE')}</td>
                    <td>S/ {item.cuota.toLocaleString('es-PE')}</td>
                    <td>{item.plazo}m</td>
                    <td>{item.tcea ? `${item.tcea.toFixed(2)}%` : '—'}</td>
                    <td>
                      <select
                        className={`badge ${badgeClass[item.estado] || 'badge-blue'}`}
                        value={item.estado}
                        disabled={busyId === item.id}
                        onChange={(e) => cambiarEstado(item.id, e.target.value as EstadoSimulacion)}
                        style={{
                          border: 'none', outline: 'none', cursor: 'pointer',
                          padding: '3px 8px', fontSize: 11.5, fontWeight: 700,
                        }}
                        title="Cambiar estado"
                      >
                        <option>Guardada</option>
                        <option>En evaluación</option>
                        <option>Aprobada</option>
                        <option>Rechazada</option>
                      </select>
                    </td>
                    <td>{item.fecha}</td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={8} className="empty-row">
                      No hay registros para los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

export default Historial
