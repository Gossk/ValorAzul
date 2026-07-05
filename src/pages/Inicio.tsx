// src/pages/Inicio.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Car, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Inicio.css'

/**
 * Pantalla de bienvenida.
 * - Muestra un saludo personalizado.
 * - Ofrece un botón para ir al simulador.
 * - Redirige automáticamente al /simulador tras unos segundos
 *   (se puede cancelar pulsando cualquier botón).
 */
function Inicio() {
  const navigate = useNavigate()
  const { perfil } = useAuth()
  const [segundos, setSegundos] = useState(5)
  const [autoRedirect, setAutoRedirect] = useState(true)

  useEffect(() => {
    if (!autoRedirect) return
    if (segundos <= 0) {
      navigate('/simulador')
      return
    }
    const t = setTimeout(() => setSegundos((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [segundos, autoRedirect, navigate])

  return (
    <div className="inicio-wrapper">
      <div className="inicio-card">
        <div className="inicio-logo">
          <svg width="56" height="56" viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="inicioLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818CF8" />
                <stop offset="50%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
            <path d="M2 4 L16 28 L30 4 L24 4 L16 18 L8 4 Z" fill="url(#inicioLogoGrad)" />
          </svg>
        </div>

        <span className="inicio-badge">
          <Sparkles size={14} /> Bienvenido a Valor Azul
        </span>

        <h1 className="inicio-title">
          ¡Hola{perfil?.nombre ? `, ${perfil.nombre.split(' ')[0]}` : ''}!
        </h1>

        <p className="inicio-subtitle">
          Simula tu crédito vehicular en minutos. Descubre cuánto podrías pagar,
          revisa el cronograma completo y encuentra el plan que mejor se adapte a ti.
        </p>

        <div className="inicio-actions">
          <button className="inicio-primary" onClick={() => navigate('/simulador')}>
            <Car size={18} /> Ir al Simulador
          </button>

          {autoRedirect ? (
            <button
              className="inicio-secondary"
              onClick={() => setAutoRedirect(false)}
              type="button"
            >
              Cancelar redirección ({segundos}s)
            </button>
          ) : (
            <span className="inicio-hint">Redirección automática cancelada</span>
          )}
        </div>

        <div className="inicio-features">
          <div className="feature">
            <strong>Rápido</strong>
            <span>Resultados al instante</span>
          </div>
          <div className="feature">
            <strong>Seguro</strong>
            <span>Datos encriptados</span>
          </div>
          <div className="feature">
            <strong>Preciso</strong>
            <span>Cálculo con TEA real</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Inicio
