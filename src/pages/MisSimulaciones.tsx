// src/pages/MisSimulaciones.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calculator,
  Calendar,
  Car,
  DollarSign,
  Eye,
  FileText,
  Trash2,
} from 'lucide-react'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { useAuth } from '../context/AuthContext'
import './MisSimulaciones.css'

interface SimulacionDoc {
  id: string
  uid: string
  fecha: string
  creadoEn: number
  precioVehiculo: number
  moneda: 'Soles' | 'Dólares'
  prestamo: number
  cuotaMensual: number
  plazoMeses: number
  tcea: number
  totalPagar: number
  estado: 'Guardada' | 'En evaluación' | 'Aprobada' | 'Rechazada'
  entrada?: any
}

const estadoBadge: Record<string, string> = {
  'Guardada':      'ms-badge ms-blue',
  'En evaluación': 'ms-badge ms-yellow',
  'Aprobada':      'ms-badge ms-green',
  'Rechazada':     'ms-badge ms-red',
}

function MisSimulaciones() {
  const navigate = useNavigate()
  const { perfil } = useAuth()

  const [items, setItems] = useState<SimulacionDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancel = false
    async function cargar() {
      if (!perfil?.uid) return
      setLoading(true)
      setError('')
      try {
        // where(uid) sin orderBy → NO requiere índice compuesto.
        const q = query(
          collection(db, 'simulaciones'),
          where('uid', '==', perfil.uid),
        )
        const snap = await getDocs(q)
        const lista: SimulacionDoc[] = []
        snap.forEach((d) => {
          const data = d.data() as any
          lista.push({
            id: d.id,
            uid: data.uid,
            fecha: data.fecha || '',
            creadoEn: data.creadoEn || 0,
            precioVehiculo: data.precioVehiculo || 0,
            moneda: data.moneda || 'Soles',
            prestamo: data.prestamo || 0,
            cuotaMensual: data.cuotaMensual || 0,
            plazoMeses: data.plazoMeses || 0,
            tcea: data.tcea || 0,
            totalPagar: data.totalPagar || 0,
            estado: data.estado || 'Guardada',
            entrada: data.entrada,
          })
        })
        // Orden en cliente por fecha de creación descendente.
        lista.sort((a, b) => b.creadoEn - a.creadoEn)
        if (!cancel) setItems(lista)
      } catch (err: any) {
        console.error(err)
        if (!cancel) setError('No se pudo cargar tus simulaciones. Intenta más tarde.')
      } finally {
        if (!cancel) setLoading(false)
      }
    }
    cargar()
    return () => { cancel = true }
  }, [perfil?.uid])

  const nuevaSimulacion = () => navigate('/simulador')

  const abrirSimulacion = (s: SimulacionDoc) => {
    // Guardamos la entrada en sessionStorage para que el Simulador la precargue.
    try {
      if (s.entrada) {
        sessionStorage.setItem('valorazul.reabrirSimulacion', JSON.stringify(s.entrada))
      }
    } catch {}
    navigate('/simulador')
  }

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar esta simulación? Esta acción no se puede deshacer.')) return
    try {
      await deleteDoc(doc(db, 'simulaciones', id))
      setItems((prev) => prev.filter((x) => x.id !== id))
    } catch (err) {
      console.error(err)
      alert('No se pudo eliminar la simulación.')
    }
  }

  const fmt = (n: number) => n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="ms-wrapper">
      <div className="ms-header">
        <div>
          <h2 className="ms-title">Mis simulaciones</h2>
          <p className="ms-sub">
            Todas las simulaciones que has realizado, ordenadas por fecha.
          </p>
        </div>
        <button className="ms-btn-primary" onClick={nuevaSimulacion}>
          <Calculator size={16} /> Nueva simulación
        </button>
      </div>

      {loading && (
        <div className="ms-empty">Cargando tus simulaciones…</div>
      )}

      {!loading && error && (
        <div className="ms-empty ms-error">{error}</div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="ms-empty">
          <FileText size={38} />
          <h3>Aún no tienes simulaciones</h3>
          <p>Cuando realices una simulación en el <strong>Simulador</strong>, aparecerá aquí.</p>
          <button className="ms-btn-primary" onClick={nuevaSimulacion}>
            <Calculator size={16} /> Ir al simulador
          </button>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="ms-grid">
          {items.map((s) => (
            <article key={s.id} className="ms-card">
              <div className="ms-card-top">
                <span className={estadoBadge[s.estado] || 'ms-badge ms-blue'}>
                  {s.estado}
                </span>
                <span className="ms-date">
                  <Calendar size={13} /> {s.fecha || '—'}
                </span>
              </div>

              <div className="ms-card-body">
                <div className="ms-line">
                  <Car size={15} />
                  <span>Vehículo</span>
                  <strong>{s.moneda === 'Dólares' ? '$' : 'S/'} {fmt(s.precioVehiculo)}</strong>
                </div>
                <div className="ms-line">
                  <DollarSign size={15} />
                  <span>Monto financiado</span>
                  <strong>S/ {fmt(s.prestamo)}</strong>
                </div>
                <div className="ms-line">
                  <Calculator size={15} />
                  <span>Cuota mensual</span>
                  <strong>S/ {fmt(s.cuotaMensual)}</strong>
                </div>
                <div className="ms-line">
                  <FileText size={15} />
                  <span>Plazo · TCEA</span>
                  <strong>{s.plazoMeses}m · {s.tcea.toFixed(2)}%</strong>
                </div>
              </div>

              <div className="ms-card-actions">
                <button className="ms-btn-ghost" onClick={() => abrirSimulacion(s)}>
                  <Eye size={14} /> Ver / reabrir
                </button>
                <button className="ms-btn-danger" onClick={() => eliminar(s.id)} title="Eliminar">
                  <Trash2 size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default MisSimulaciones
