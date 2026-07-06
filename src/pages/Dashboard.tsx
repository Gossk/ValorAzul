// src/pages/Dashboard.tsx
//
// Dashboard del ADMINISTRADOR.
// Todos los datos vienen de Firestore en tiempo real:
//   - historial/    → cada simulación guardada por un cliente.
//   - usuarios/     → los usuarios registrados (clientes + admins).
//
// Métricas mostradas:
//   • KPIs: total de simulaciones, clientes activos, monto financiado,
//           cuota promedio, TCEA promedio.
//   • Gráfico de área: simulaciones por mes.
//   • Gráfico dona: distribución por estado (En evaluación / Aprobada / Rechazada).
//   • Gráfico barras: top vehículos simulados.
//   • Tabla: últimas 8 simulaciones.

import { useEffect, useMemo, useState } from 'react'
import {
  Calendar,
  ChartNoAxesColumn,
  CircleDollarSign,
  ClipboardList,
  RefreshCw,
  TrendingUp,
  User,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import './Dashboard.css'

type EstadoSim = 'Aprobada' | 'En evaluación' | 'Rechazada' | 'Guardada' | string

interface Simulacion {
  id: string
  uid?: string
  cliente: string
  vehiculo: string
  monto: number       // monto financiado
  cuota: number       // cuota mensual
  plazo: number       // en meses
  estado: EstadoSim
  fecha: string       // dd/mm/yyyy
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

const NOMBRES_MES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const fmtSoles = (n: number) => 'S/ ' + n.toLocaleString('es-PE', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const fmtDecimal = (n: number) => n.toLocaleString('es-PE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function Dashboard() {
  const [historial, setHistorial]     = useState<Simulacion[]>([])
  const [totalClientesRegistrados, setTotalClientesRegistrados] = useState(0)
  const [loading, setLoading]         = useState(true)
  const [refreshedAt, setRefreshedAt] = useState<Date>(new Date())

  // ─── Suscripciones en tiempo real ───
  useEffect(() => {
    const unsub1 = onSnapshot(
      collection(db, 'historial'),
      (snap) => {
        const lista: Simulacion[] = []
        snap.forEach((d) => {
          const data = d.data() as any
          lista.push({
            id: d.id,
            uid: data.uid,
            cliente: data.cliente || 'Cliente',
            vehiculo: data.vehiculo || 'Vehículo',
            monto: Number(data.monto) || 0,
            cuota: Number(data.cuota) || 0,
            plazo: Number(data.plazo) || 0,
            estado: data.estado || 'En evaluación',
            fecha: data.fecha || '',
            creadoEn: Number(data.creadoEn) || 0,
            tcea: Number(data.tcea) || 0,
            totalPagar: Number(data.totalPagar) || 0,
          })
        })
        // Más recientes primero
        lista.sort((a, b) => (b.creadoEn || 0) - (a.creadoEn || 0))
        setHistorial(lista)
        setLoading(false)
        setRefreshedAt(new Date())
      },
      (err) => {
        console.error('[Dashboard] historial:', err)
        setLoading(false)
      },
    )

    const unsub2 = onSnapshot(
      collection(db, 'usuarios'),
      (snap) => {
        let clientes = 0
        snap.forEach((d) => {
          const data = d.data() as any
          if ((data.rol || 'Cliente') === 'Cliente') clientes += 1
        })
        setTotalClientesRegistrados(clientes)
      },
      (err) => console.warn('[Dashboard] usuarios:', err),
    )

    return () => { unsub1(); unsub2() }
  }, [])

  // ─── Derivados ───
  const stats = useMemo(() => {
    const total       = historial.length
    const aprobados   = historial.filter((h) => h.estado === 'Aprobada').length
    const rechazados  = historial.filter((h) => h.estado === 'Rechazada').length
    const enEval      = historial.filter((h) => h.estado === 'En evaluación').length
    const guardados   = historial.filter((h) => h.estado === 'Guardada').length
    const clientesUnicos = new Set(historial.map((h) => h.uid || h.cliente)).size
    const montoTotal  = historial.reduce((acc, h) => acc + (h.monto || 0), 0)
    const cuotaProm   = total > 0
      ? historial.reduce((a, h) => a + (h.cuota || 0), 0) / total
      : 0
    const tceaProm    = total > 0
      ? historial.reduce((a, h) => a + (h.tcea || 0), 0) / total
      : 0
    const totalPagar  = historial.reduce((acc, h) => acc + (h.totalPagar || 0), 0)
    return { total, aprobados, rechazados, enEval, guardados, clientesUnicos, montoTotal, cuotaProm, tceaProm, totalPagar }
  }, [historial])

  const rendimientoPorMes = useMemo(() => {
    const map: Record<string, { mes: string; simulaciones: number; monto: number; cuota: number }> = {}
    for (const h of historial) {
      const [, m] = h.fecha.split('/').map(Number)
      if (!m) continue
      const key = NOMBRES_MES[m - 1]
      if (!map[key]) map[key] = { mes: key, simulaciones: 0, monto: 0, cuota: 0 }
      map[key].simulaciones += 1
      map[key].monto += h.monto || 0
      map[key].cuota += h.cuota || 0
    }
    return NOMBRES_MES
      .filter((mes) => map[mes])
      .map((mes) => ({
        ...map[mes],
        ticketPromedio: map[mes].simulaciones > 0 ? Math.round(map[mes].monto / map[mes].simulaciones) : 0,
        cuotaPromedio: map[mes].simulaciones > 0 ? Math.round(map[mes].cuota / map[mes].simulaciones) : 0,
      }))
  }, [historial])

  const gestion = useMemo(() => {
    const evaluadas = stats.aprobados + stats.rechazados
    const tasaAprobacion = evaluadas > 0 ? Math.round((stats.aprobados / evaluadas) * 100) : 0
    const tasaRechazo = evaluadas > 0 ? Math.round((stats.rechazados / evaluadas) * 100) : 0
    const pendientes = stats.enEval + stats.guardados
    const avance = stats.total > 0 ? Math.round((evaluadas / stats.total) * 100) : 0
    return { evaluadas, tasaAprobacion, tasaRechazo, pendientes, avance }
  }, [stats])

  const topVehiculos = useMemo(() => {
    const map: Record<string, number> = {}
    for (const h of historial) {
      if (!h.vehiculo) continue
      map[h.vehiculo] = (map[h.vehiculo] || 0) + 1
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [historial])

  const recientes = historial.slice(0, 8)
  const hoy = new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })

  if (loading) {
    return (
      <p style={{ color: 'rgba(255,255,255,0.6)', padding: 40, textAlign: 'center' }}>
        Cargando dashboard...
      </p>
    )
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-topbar">
        <div>
          <h2>Panel administrativo</h2>
          <p>Resumen en tiempo real de simulaciones guardadas por clientes.</p>
        </div>
        <div className="date-box" title={`Actualizado ${refreshedAt.toLocaleTimeString('es-PE')}`}>
        <Calendar size={16} /> {hoy} · <RefreshCw size={13} style={{ marginLeft: 4 }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginLeft: 4 }}>
            tiempo real
          </span>
        </div>
      </div>

      {/* KPIs primarios */}
      <div className="stats stagger">
        <div className="glass-card stat-card">
          <div className="stat-icon blue"><ChartNoAxesColumn size={24} /></div>
          <div>
            <p>Simulaciones guardadas</p>
            <h2>{stats.total}</h2>
            <span>{stats.enEval} en evaluación · {stats.aprobados} aprobadas</span>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon purple"><User size={24} /></div>
          <div>
            <p>Clientes con simulaciones</p>
            <h2>{stats.clientesUnicos}</h2>
            <span>De {totalClientesRegistrados} clientes registrados</span>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon green"><CircleDollarSign size={24} /></div>
          <div>
            <p>Monto financiado (total)</p>
            <h2 style={{ fontSize: 22 }}>{fmtSoles(stats.montoTotal)}</h2>
            <span>Cuota promedio: {fmtSoles(stats.cuotaProm)}</span>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon orange"><TrendingUp size={24} /></div>
          <div>
            <p>TCEA promedio</p>
            <h2>{stats.tceaProm.toFixed(2)}%</h2>
            <span>Todas las simulaciones</span>
          </div>
        </div>
      </div>

      <div className="dashboard-summary-row">
        <div className="summary-pill"><strong>{stats.guardados}</strong><span>Guardadas</span></div>
        <div className="summary-pill"><strong>{stats.enEval}</strong><span>En evaluación</span></div>
        <div className="summary-pill"><strong>{stats.aprobados}</strong><span>Aprobadas</span></div>
        <div className="summary-pill"><strong>{stats.rechazados}</strong><span>Rechazadas</span></div>
        <div className="summary-pill wide"><strong>{fmtSoles(stats.totalPagar)}</strong><span>Total proyectado a pagar</span></div>
      </div>

      {/* Rendimiento mensual + gestión */}
      <div className="middle-grid">
        <div className="glass-card panel">
          <h3>Rendimiento mensual de financiamiento</h3>
          <p className="panel-subtitle">Monto financiado por mes y cantidad de simulaciones guardadas.</p>
          <div className="rechart-box">
            {rendimientoPorMes.length === 0 ? (
              <EmptyChart mensaje="Aún no hay simulaciones guardadas." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={rendimientoPorMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="mes" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                  <YAxis yAxisId="money" stroke="rgba(255,255,255,0.4)" fontSize={12} tickFormatter={(v) => `S/${Math.round(Number(v) / 1000)}k`} />
                  <YAxis yAxisId="count" orientation="right" allowDecimals={false} stroke="rgba(255,255,255,0.4)" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(13,27,53,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 13 }}
                    itemStyle={{ color: '#f0f4ff' }}
                    formatter={(value, name) => {
                      if (name === 'monto') return [fmtSoles(Number(value)), 'Monto financiado']
                      if (name === 'simulaciones') return [value, 'Simulaciones']
                      if (name === 'ticketPromedio') return [fmtSoles(Number(value)), 'Ticket promedio']
                      return [value, name]
                    }}
                  />
                  <Bar yAxisId="money" dataKey="monto" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  <Line yAxisId="count" type="monotone" dataKey="simulaciones" stroke="#fbbf24" strokeWidth={3} dot={{ r: 4 }} />
                  <Line yAxisId="money" type="monotone" dataKey="ticketPromedio" stroke="#22c55e" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass-card panel gestion-panel">
          <h3>Gestión de solicitudes</h3>
          <p className="panel-subtitle">Prioriza pendientes y mide la efectividad de evaluación.</p>
          <div className="gestion-grid">
            <div className="gestion-card highlight">
              <span>Pendientes por revisar</span>
              <strong>{gestion.pendientes}</strong>
              <small>{stats.enEval} en evaluación · {stats.guardados} guardadas</small>
            </div>
            <div className="gestion-card">
              <span>Solicitudes evaluadas</span>
              <strong>{gestion.evaluadas}</strong>
              <small>{gestion.avance}% del total procesado</small>
            </div>
            <div className="gestion-card ok">
              <span>Tasa de aprobación</span>
              <strong>{gestion.tasaAprobacion}%</strong>
              <small>{stats.aprobados} aprobadas</small>
            </div>
            <div className="gestion-card danger">
              <span>Tasa de rechazo</span>
              <strong>{gestion.tasaRechazo}%</strong>
              <small>{stats.rechazados} rechazadas</small>
            </div>
          </div>
          <div className="gestion-progress">
            <div className="gestion-progress-label">
              <span>Avance de evaluación</span>
              <b>{gestion.avance}%</b>
            </div>
            <div className="gestion-progress-track">
              <div style={{ width: `${gestion.avance}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Top vehículos + tabla de recientes */}
      <div className="bottom-grid">
        <div className="glass-card panel">
          <h3>Vehículos más simulados</h3>
          <div className="rechart-box">
            {topVehiculos.length === 0 ? (
              <EmptyChart mensaje="Aún no hay vehículos simulados." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topVehiculos} layout="vertical" margin={{ left: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" allowDecimals={false} stroke="rgba(255,255,255,0.4)" fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={12}
                    width={130}
                  />
                  <Tooltip
                    contentStyle={{ background: 'rgba(13,27,53,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 13 }}
                    itemStyle={{ color: '#f0f4ff' }}
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  />
                  <Bar dataKey="value" fill="#a855f7" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass-card panel table-panel">
          <h3>Últimas simulaciones ({recientes.length})</h3>
          <div className="dashboard-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Vehículo</th>
                <th>Monto</th>
                <th>Cuota</th>
                <th>TCEA</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {recientes.map((h, idx) => (
                <tr key={h.id} className={idx % 2 === 0 ? 'row-even' : ''}>
                  <td>{h.cliente}</td>
                  <td>{h.vehiculo}</td>
                  <td>{fmtSoles(h.monto)}</td>
                  <td>{fmtSoles(h.cuota)}</td>
                  <td>{h.tcea ? `${fmtDecimal(h.tcea)}%` : '—'}</td>
                  <td><span className={`badge ${badgeClass[h.estado] || 'badge-blue'}`}>{h.estado}</span></td>
                  <td>{h.fecha}</td>
                </tr>
              ))}
              {recientes.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.5)' }}>
                    Aún no hay simulaciones. Los clientes que guarden simulaciones aparecerán aquí.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyChart({ mensaje }: { mensaje: string }) {
  return (
    <div style={{
      height: '100%', display: 'grid', placeItems: 'center',
      color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', padding: 20,
    }}>
      <div>
        <ClipboardList size={26} style={{ opacity: 0.4, marginBottom: 6 }} />
        <div>{mensaje}</div>
      </div>
    </div>
  )
}

export default Dashboard
