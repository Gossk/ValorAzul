// src/pages/Inicio.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Calculator,
  Car,
  CheckCircle2,
  FileText,
  HelpCircle,
  Sparkles,
  UserCircle,
} from 'lucide-react'
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { useAuth } from '../context/AuthContext'
import './Inicio.css'

interface Aviso {
  icon: typeof Bell
  titulo: string
  detalle: string
  tono: 'info' | 'ok' | 'warn'
}

const AVISOS_DEFAULT: Aviso[] = [
  {
    icon: Sparkles,
    titulo: '¡Bienvenido a Valor Azul!',
    detalle: 'Ya puedes simular tu crédito vehicular en pocos pasos.',
    tono: 'info',
  },
  {
    icon: CheckCircle2,
    titulo: 'Tus datos están seguros',
    detalle: 'Toda la información viaja encriptada y se almacena de forma privada.',
    tono: 'ok',
  },
  {
    icon: Bell,
    titulo: 'Tip financiero',
    detalle: 'Una cuota inicial mayor al 20% reduce significativamente los intereses.',
    tono: 'warn',
  },
]

function Inicio() {
  const navigate = useNavigate()
  const { perfil } = useAuth()

  const [totalSimulaciones, setTotalSimulaciones] = useState<number | null>(null)
  const [ultimaFecha, setUltimaFecha] = useState<string>('—')

  // Carga rápida de un pequeño resumen de las simulaciones del cliente.
  useEffect(() => {
    let cancel = false
    async function cargar() {
      if (!perfil?.uid) return
      try {
        const q1 = query(
          collection(db, 'simulaciones'),
          where('uid', '==', perfil.uid),
        )
        const snap = await getDocs(q1)
        if (cancel) return
        setTotalSimulaciones(snap.size)

        const q2 = query(
          collection(db, 'simulaciones'),
          where('uid', '==', perfil.uid),
          orderBy('creadoEn', 'desc'),
          limit(1),
        )
        try {
          const ult = await getDocs(q2)
          if (!ult.empty && !cancel) {
            const d = ult.docs[0].data() as any
            setUltimaFecha(d.fecha || '—')
          }
        } catch {
          /* si falta el índice compuesto, se ignora silenciosamente */
        }
      } catch (err) {
        console.warn('[Inicio] No se pudo leer simulaciones:', err)
        setTotalSimulaciones(0)
      }
    }
    cargar()
    return () => { cancel = true }
  }, [perfil?.uid])

  const primerNombre = perfil?.nombre?.split(' ')[0] ?? ''

  return (
    <div className="inicio-wrapper">
      <div className="inicio-hero">
        <span className="inicio-badge">
          <Sparkles size={14} /> Bienvenido a Valor Azul
        </span>
        <h1 className="inicio-title">
          ¡Hola{primerNombre ? `, ${primerNombre}` : ''}!
        </h1>
        <p className="inicio-subtitle">
          Simula tu crédito vehicular en minutos, revisa el cronograma completo
          y encuentra el plan que mejor se adapte a ti. Todo en un solo lugar.
        </p>

        <div className="inicio-actions">
          <button className="inicio-primary" onClick={() => navigate('/simulador')}>
            <Calculator size={18} /> Nueva simulación
          </button>
          <button className="inicio-secondary" onClick={() => navigate('/mis-simulaciones')}>
            <FileText size={18} /> Ver mis simulaciones
          </button>
        </div>
      </div>

      {/* Resumen rápido */}
      <div className="inicio-stats">
        <div className="inicio-stat">
          <span className="inicio-stat-label">Simulaciones realizadas</span>
          <strong className="inicio-stat-value">
            {totalSimulaciones === null ? '…' : totalSimulaciones}
          </strong>
        </div>
        <div className="inicio-stat">
          <span className="inicio-stat-label">Última simulación</span>
          <strong className="inicio-stat-value inicio-stat-small">{ultimaFecha}</strong>
        </div>
        <div className="inicio-stat">
          <span className="inicio-stat-label">Perfil</span>
          <strong className="inicio-stat-value inicio-stat-small">{perfil?.rol ?? 'Cliente'}</strong>
        </div>
      </div>

      {/* Accesos rápidos */}
      <section className="inicio-section">
        <h2 className="inicio-section-title">Accesos rápidos</h2>
        <div className="inicio-quick">
          <QuickCard
            icon={<Car size={22} />}
            title="Simulador"
            desc="Calcula cuota, TCEA y cronograma de tu crédito vehicular."
            onClick={() => navigate('/simulador')}
            color="blue"
          />
          <QuickCard
            icon={<FileText size={22} />}
            title="Mis simulaciones"
            desc="Revisa el historial de tus simulaciones anteriores."
            onClick={() => navigate('/mis-simulaciones')}
            color="green"
          />
          <QuickCard
            icon={<HelpCircle size={22} />}
            title="Ayuda (FAQ)"
            desc="Resuelve dudas sobre créditos, tasas y conceptos financieros."
            onClick={() => navigate('/ayuda')}
            color="purple"
          />
          <QuickCard
            icon={<UserCircle size={22} />}
            title="Mi perfil"
            desc="Actualiza tus datos personales y de contacto."
            onClick={() => navigate('/perfil')}
            color="orange"
          />
        </div>
      </section>

      {/* Novedades / Avisos */}
      <section className="inicio-section">
        <h2 className="inicio-section-title">Novedades y avisos</h2>
        <div className="inicio-avisos">
          {AVISOS_DEFAULT.map((a, i) => {
            const Icon = a.icon
            return (
              <div key={i} className={`inicio-aviso tono-${a.tono}`}>
                <div className="inicio-aviso-icon"><Icon size={18} /></div>
                <div>
                  <strong>{a.titulo}</strong>
                  <p>{a.detalle}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function QuickCard({
  icon,
  title,
  desc,
  onClick,
  color,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  onClick: () => void
  color: 'blue' | 'green' | 'purple' | 'orange'
}) {
  return (
    <button className={`inicio-quick-card qc-${color}`} onClick={onClick} type="button">
      <div className="inicio-quick-icon">{icon}</div>
      <div className="inicio-quick-text">
        <strong>{title}</strong>
        <span>{desc}</span>
      </div>
    </button>
  )
}

export default Inicio
