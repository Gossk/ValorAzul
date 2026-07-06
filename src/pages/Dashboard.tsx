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
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
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

const ESTADO_COLORS: Record<string, string> = {
  Aprobada:        '#22c55e',
  'En evaluación': '#3b82f6',
  Rechazada:       '#ef4444',
  Guardada:        '#a855f7',
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
  const [totalUsuarios, setTotalUsuarios] = useState(0)
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
      (snap) => setTotalUsuarios(snap.size),
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

  const porMes = useMemo(() => {
    const map: Record<string, number> = {}
    for (const h of historial) {
      const [, m] = h.fecha.split('/').map(Number)
      if (!m) continue
      const key = NOMBRES_MES[m - 1]
      map[key] = (map[key] || 0) + 1
    }
    return NOMBRES_MES
      .filter((mes) => map[mes])
      .map((mes) => ({ mes, simulaciones: map[mes] }))
  }, [historial])

  const porEstado = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const h of historial) counts[h.estado] = (counts[h.estado] || 0) + 1
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: ESTADO_COLORS[name] || '#94a3b8',
    }))
  }, [historial])
  const totalEstados = porEstado.reduce((a, x) => a + x.value, 0)

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
    <>
      <div className="date-box" title={`Actualizado ${refreshedAt.toLocaleTimeString('es-PE')}`}>
        <Calendar size={16} /> {hoy} · <RefreshCw size={13} style={{ marginLeft: 4 }} />
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginLeft: 4 }}>
          tiempo real
        </span>
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
            <span>De {totalUsuarios} usuarios registrados</span>
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

      {/* Gráficos: simulaciones por mes + estados */}
      <div className="middle-grid">
        <div className="glass-card panel">
          <h3>Simulaciones por mes</h3>
          <div className="rechart-box">
            {porMes.length === 0 ? (
              <EmptyChart mensaje="Aún no hay simulaciones guardadas." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={porMes}>
                  <defs>
                    <linearGradient id="colorSim" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="mes" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="rgba(255,255,255,0.4)" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(13,27,53,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 13 }}
                    itemStyle={{ color: '#f0f4ff' }}
                  />
                  <Area type="monotone" dataKey="simulaciones" stroke="#3b82f6" fill="url(#colorSim)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass-card panel">
          <h3>Distribución por estado</h3>
          <div className="status-content">
            <div className="donut-chart">
              {totalEstados === 0 ? (
                <EmptyChart mensaje="Sin datos aún." />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={porEstado} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" stroke="none">
                        {porEstado.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="donut-center">
                    <strong>{totalEstados}</strong>
                    <span>Total</span>
                  </div>
                </>
              )}
            </div>

            <div className="legend">
              {porEstado.map((item) => (
                <p key={item.name}>
                  <span className="dot" style={{ background: item.color }} />
                  {item.name}
                  <b>{totalEstados > 0 ? Math.round((item.value / totalEstados) * 100) : 0}% ({item.value})</b>
                </p>
              ))}
              {porEstado.length === 0 && (
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                  Sin simulaciones aún.
                </p>
              )}
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
    </>
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
