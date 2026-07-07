
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Calculator,
  Car,
  FileText,
  Gauge,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  TrendingUp,
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

const TIPS = [
  {
    icon: Lightbulb,
    titulo: 'Cuota inicial mayor, intereses menores',
    detalle:
      'Subir la cuota inicial por encima del 20% puede reducir de forma notable lo que pagas de intereses.',
    tono: 'info' as const,
  },
  {
    icon: ShieldCheck,
    titulo: 'Tus datos están seguros',
    detalle:
      'Toda tu información viaja encriptada y se guarda de forma privada en tu cuenta.',
    tono: 'ok' as const,
  },
  {
    icon: TrendingUp,
    titulo: 'Compara antes de decidir',
    detalle:
      'Prueba distintos plazos y tasas: cada simulación se guarda para que la revises cuando quieras.',
    tono: 'warn' as const,
  },
]

const PASOS = [
  {
    n: 1,
    icon: Car,
    title: 'Elige tu vehículo',
    desc: 'Busca tu modelo y fija el precio. Toyota, Hyundai, Kia, Mazda y muchas marcas más disponibles.',
  },
  {
    n: 2,
    icon: Calculator,
    title: 'Simula tu crédito',
    desc: 'Ingresa cuota inicial, plazo y tasa. Obtén al instante tu cuota mensual, TCEA y cronograma completo.',
  },
  {
    n: 3,
    icon: FileText,
    title: 'Guarda y revisa',
    desc: 'Tu simulación se guarda en "Mis Simulaciones". Vuelve cuando quieras para comparar o retomarla.',
  },
]

const FEATURES = [
  {
    icon: Calculator,
    title: 'Simulador inteligente',
    desc: 'Calcula cuota, TCEA, TEM y cronograma de pagos en segundos, con o sin período de gracia.',
  },
  {
    icon: FileText,
    title: 'Mis Simulaciones',
    desc: 'Tu historial personal de simulaciones, guardado y organizado para comparar escenarios.',
  },
  {
    icon: TrendingUp,
    title: 'Compara escenarios',
    desc: 'Prueba plazos, monedas y tasas distintas para encontrar el plan que mejor se ajuste a tu bolsillo.',
  },
  {
    icon: ShieldCheck,
    title: 'Claro y transparente',
    desc: 'Entiende cada número: intereses, seguros y costos, sin letra pequeña que esconder.',
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
    return () => {
      cancel = true
    }
  }, [perfil?.uid])

  const primerNombre = perfil?.nombre?.split(' ')[0] ?? ''

  return (
    <div className="inicio-wrapper">
      {/* ---------- HERO ---------- */}
      <section className="inicio-hero">
        <div className="inicio-hero-glow" aria-hidden="true" />
        <div className="inicio-hero-spark inicio-hero-spark-1" aria-hidden="true" />
        <div className="inicio-hero-spark inicio-hero-spark-2" aria-hidden="true" />

        <span className="inicio-badge">
          <Sparkles size={14} /> Bienvenido a Valor Azul
        </span>

        <h1 className="inicio-title">
          {primerNombre ? `¡Hola, ${primerNombre}! ` : '¡Hola! '}
          <span className="inicio-title-accent">
            Descubre cuánto cuesta tu auto soñado.
          </span>
        </h1>

        <p className="inicio-subtitle">
          Valor Azul es tu simulador de crédito vehicular. En minutos conoces tu
          cuota mensual, la TCEA y el cronograma completo de pagos — y guardas
          cada simulación para comparar cuando quieras.
        </p>

        <div className="inicio-actions">
          <button className="inicio-primary" onClick={() => navigate('/simulador')}>
            <Calculator size={18} /> Simular mi crédito
          </button>
          <button
            className="inicio-secondary"
            onClick={() => navigate('/mis-simulaciones')}
          >
            <FileText size={18} /> Ver mis simulaciones
            <ArrowRight size={15} />
          </button>
        </div>

        {/* Escena animada: un auto recorriendo la ruta hacia tu auto */}
        <div className="inicio-road" aria-hidden="true">
          <div className="inicio-road-line" />
          <span className="inicio-road-dot d1" />
          <span className="inicio-road-dot d2" />
          <span className="inicio-road-dot d3" />
          <div className="inicio-road-car">
            <Car size={22} />
          </div>
        </div>
      </section>

      {/* ---------- ESTADÍSTICAS PERSONALIZADAS ---------- */}
      <section className="inicio-stats">
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
          <span className="inicio-stat-label">Tu perfil</span>
          <strong className="inicio-stat-value inicio-stat-small">
            {perfil?.rol ?? 'Cliente'}
          </strong>
        </div>
      </section>

      {/* ---------- CÓMO FUNCIONA (3 PASOS) ---------- */}
      <section className="inicio-section">
        <h2 className="inicio-section-title">Así de fácil es empezar</h2>
        <div className="inicio-steps">
          {PASOS.map((p, i) => {
            const Icon = p.icon
            return (
              <div className="inicio-step" key={p.n}>
                <div className="inicio-step-num">{p.n}</div>
                <div className="inicio-step-icon">
                  <Icon size={22} />
                </div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
                {i < PASOS.length - 1 && (
                  <div className="inicio-step-arrow" aria-hidden="true">
                    <ArrowRight size={18} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ---------- ¿DE QUÉ TRATA VALOR AZUL? (FEATURES) ---------- */}
      <section className="inicio-section">
        <h2 className="inicio-section-title">¿De qué trata Valor Azul?</h2>
        <div className="inicio-features">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <div className="inicio-feature" key={f.title}>
                <div className="inicio-feature-icon">
                  <Icon size={22} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ---------- TIPS ---------- */}
      <section className="inicio-section">
        <h2 className="inicio-section-title">
          <Lightbulb size={16} style={{ verticalAlign: '-3px', marginRight: 6 }} />
          Tip financiero
        </h2>
        <div className="inicio-avisos">
          {TIPS.map((a, i) => {
            const Icon = a.icon
            return (
              <div key={i} className={`inicio-aviso tono-${a.tono}`}>
                <div className="inicio-aviso-icon">
                  <Icon size={18} />
                </div>
                <div>
                  <strong>{a.titulo}</strong>
                  <p>{a.detalle}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ---------- CTA FINAL ---------- */}
      <section className="inicio-cta">
        <div className="inicio-cta-text">
          <h2>¿Listo para conocer tu cuota?</h2>
          <p>
            Simula tu crédito ahora y guarda el resultado en "Mis Simulaciones".
          </p>
        </div>
        <button className="inicio-primary" onClick={() => navigate('/simulador')}>
          <Gauge size={18} /> Empezar simulación
        </button>
      </section>
    </div>
  )
}

export default Inicio
