import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import './Login.css'

interface Meteor {
  x: number
  y: number
  vx: number
  vy: number
  length: number
}

function spawnMeteor(width: number): Meteor {
  const speed = 4 + Math.random() * 4
  const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.35
  return {
    x: Math.random() * width,
    y: -80 - Math.random() * 120,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    length: 80 + Math.random() * 70,
  }
}

function Login() {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let width = window.innerWidth
    let height = window.innerHeight

    canvas.width = width
    canvas.height = height

    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 0.5 + Math.random() * 1,
      opacity: 0.3 + Math.random() * 0.7,
    }))

    const meteors: Meteor[] = Array.from({ length: 15 }, () => spawnMeteor(width))

    const onResize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }
    window.addEventListener('resize', onResize)

    const draw = () => {
      // Background — nebula radial gradient
      const bg = ctx.createRadialGradient(
        width * 0.4, height * 0.35, 0,
        width * 0.5, height * 0.5, width * 0.85,
      )
      bg.addColorStop(0, '#6b21a8')
      bg.addColorStop(0.2, '#581c87')
      bg.addColorStop(0.4, '#3b0764')
      bg.addColorStop(0.6, '#1e0533')
      bg.addColorStop(0.8, '#0d0120')
      bg.addColorStop(1, '#050010')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, width, height)

      // Secondary nebula cloud
      const nebula = ctx.createRadialGradient(
        width * 0.7, height * 0.3, 0,
        width * 0.7, height * 0.3, width * 0.4,
      )
      nebula.addColorStop(0, 'rgba(139,92,246,0.3)')
      nebula.addColorStop(0.5, 'rgba(109,40,217,0.15)')
      nebula.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = nebula
      ctx.fillRect(0, 0, width, height)

      // Static stars
      for (const s of stars) {
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${s.opacity})`
        ctx.fill()
      }

      // Meteors
      for (const m of meteors) {
        const mag = Math.hypot(m.vx, m.vy)
        const nx = m.vx / mag
        const ny = m.vy / mag
        const tailX = m.x - nx * m.length
        const tailY = m.y - ny * m.length

        // Trail
        const trail = ctx.createLinearGradient(tailX, tailY, m.x, m.y)
        trail.addColorStop(0, 'rgba(180,150,255,0)')
        trail.addColorStop(1, 'rgba(220,210,255,1)')
        ctx.beginPath()
        ctx.moveTo(tailX, tailY)
        ctx.lineTo(m.x, m.y)
        ctx.strokeStyle = trail
        ctx.lineWidth = 1.5
        ctx.stroke()

        // Head glow
        const glow = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 4)
        glow.addColorStop(0, 'rgba(230,220,255,0.95)')
        glow.addColorStop(1, 'rgba(180,150,255,0)')
        ctx.beginPath()
        ctx.arc(m.x, m.y, 4, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()

        m.x += m.vx
        m.y += m.vy

        if (m.x > width + m.length || m.y > height + m.length) {
          Object.assign(m, spawnMeteor(width))
        }
      }

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <div className="login-container">
      <canvas ref={canvasRef} className="login-canvas" />

      <div className="login-glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center', marginBottom: '8px' }}>
          <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="loginLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818CF8" />
                <stop offset="50%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
            <path d="M2 4 L16 28 L30 4 L24 4 L16 18 L8 4 Z" fill="url(#loginLogoGrad)" />
          </svg>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'white', letterSpacing: '3px', lineHeight: '1' }}>VALOR</div>
            <div style={{ fontSize: '10px', fontWeight: '400', color: 'rgba(255,255,255,0.5)', letterSpacing: '5px' }}>AZUL</div>
          </div>
        </div>

        <h2 className="form-title">Bienvenido de vuelta</h2>
        <p className="form-subtitle">Ingresa tus credenciales para continuar</p>

        <div className="form-group">
          <label>Usuario</label>
          <input type="text" placeholder="Ingrese su usuario" />
        </div>

        <div className="form-group">
          <label>Contraseña</label>
          <input type="password" placeholder="Ingrese su contraseña" />
        </div>

        <button
          className="login-button"
          onClick={() => navigate('/dashboard')}
        >
          Iniciar sesión
        </button>

        <p className="secure-footer">
          <ShieldCheck size={15} /> Plataforma segura y encriptada
        </p>

        <p className="register-link">
          ¿No tienes cuenta? <span onClick={() => navigate('/register')}>Regístrate</span>
        </p>
      </div>
    </div>
  )
}

export default Login
