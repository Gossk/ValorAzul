import { useState, useRef, useEffect, useCallback } from 'react'
import '../pages/Login.css'

interface Props {
  onVerify: (verified: boolean) => void
}

/* ───────── tipos ───────── */
interface CaptchaChallenge {
  a: number
  b: number
  op: '+' | '-' | '×'
  answer: number
}

/* ───────── helpers ───────── */
function generateChallenge(): CaptchaChallenge {
  const ops: Array<'+' | '-' | '×'> = ['+', '-', '×']
  const op = ops[Math.floor(Math.random() * ops.length)]
  let a = 0, b = 0, answer = 0

  switch (op) {
    case '+':
      a = Math.floor(Math.random() * 20) + 1
      b = Math.floor(Math.random() * 20) + 1
      answer = a + b
      break
    case '-':
      a = Math.floor(Math.random() * 20) + 10
      b = Math.floor(Math.random() * 10) + 1
      answer = a - b
      break
    case '×':
      a = Math.floor(Math.random() * 9) + 2
      b = Math.floor(Math.random() * 9) + 2
      answer = a * b
      break
  }

  return { a, b, op, answer }
}

/* ───────── Dibujar captcha distorsionado en canvas ───────── */
function drawCaptcha(canvas: HTMLCanvasElement, challenge: CaptchaChallenge) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const W = canvas.width
  const H = canvas.height

  // Limpiar canvas
  ctx.clearRect(0, 0, W, H)

  // Fondo con gradiente
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#1a1f3a')
  bg.addColorStop(1, '#0f1629')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Ruido: puntos aleatorios
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, ${0.15 + Math.random() * 0.2})`
    ctx.beginPath()
    ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 2 + 0.5, 0, Math.PI * 2)
    ctx.fill()
  }

  // Líneas de ruido
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = `rgba(${100 + Math.random() * 155}, ${100 + Math.random() * 155}, ${200 + Math.random() * 55}, ${0.2 + Math.random() * 0.15})`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(Math.random() * W, Math.random() * H)
    ctx.bezierCurveTo(
      Math.random() * W, Math.random() * H,
      Math.random() * W, Math.random() * H,
      Math.random() * W, Math.random() * H,
    )
    ctx.stroke()
  }

  // Texto del captcha
  const text = `${challenge.a} ${challenge.op} ${challenge.b} = ?`
  const baseX = 20
  const baseY = H / 2 + 8

  // Dibujar cada carácter con rotación y posición aleatoria
  const chars = text.split('')
  let offsetX = baseX

  for (const char of chars) {
    ctx.save()
    const fontSize = 22 + Math.random() * 6
    const rotation = (Math.random() - 0.5) * 0.5
    const offsetY = baseY + (Math.random() - 0.5) * 12

    ctx.translate(offsetX, offsetY)
    ctx.rotate(rotation)

    // Sombra
    ctx.shadowColor = 'rgba(96, 165, 250, 0.4)'
    ctx.shadowBlur = 4

    ctx.font = `bold ${fontSize}px 'Courier New', monospace`
    ctx.fillStyle = `hsl(${210 + Math.random() * 40}, 80%, ${65 + Math.random() * 20}%)`
    ctx.fillText(char, 0, 0)

    ctx.restore()

    // Medir el ancho del carácter para el siguiente offset
    ctx.font = `bold ${fontSize}px 'Courier New', monospace`
    offsetX += ctx.measureText(char).width + 2
  }
}

/* ───────── componente ───────── */
function SimpleCaptcha({ onVerify }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [challenge, setChallenge] = useState<CaptchaChallenge>(() => generateChallenge())
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const onVerifyRef = useRef(onVerify)
  useEffect(() => {
    onVerifyRef.current = onVerify
  }, [onVerify])

  /* Dibujar el canvas cuando cambia challenge o al montar */
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      drawCaptcha(canvas, challenge)
    }
  }, [challenge])

  /* Refresh: genera nuevo challenge */
  const refresh = useCallback(() => {
    setChallenge(generateChallenge())
    setInput('')
    setStatus('idle')
    if (onVerifyRef.current) {
      onVerifyRef.current(false)
    }
  }, [])

  /* Verificar respuesta */
  const handleCheck = () => {
    const val = parseInt(input.trim(), 10)
    if (isNaN(val)) return

    if (val === challenge.answer) {
      setStatus('success')
      if (onVerifyRef.current) onVerifyRef.current(true)
    } else {
      setStatus('error')
      if (onVerifyRef.current) onVerifyRef.current(false)
      // Generar nuevo captcha tras error
      setTimeout(() => refresh(), 800)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCheck()
    }
  }

  return (
    <div className="captcha-wrapper">
      <label className="captcha-label">Verificación de seguridad</label>

      <div className="captcha-row">
        {/* Canvas con el captcha */}
        <canvas
          ref={canvasRef}
          width={200}
          height={56}
          className="captcha-canvas"
        />

        {/* Botón refrescar */}
        <button
          type="button"
          className="captcha-refresh"
          onClick={refresh}
          title="Generar nuevo captcha"
          aria-label="Nuevo captcha"
        >
          ↻
        </button>
      </div>

      <div className="captcha-input-row">
        <input
          type="text"
          inputMode="numeric"
          className={`captcha-input ${
            status === 'success' ? 'input-ok' : status === 'error' ? 'input-error' : ''
          }`}
          placeholder="Resuelve la operación"
          value={input}
          onChange={(e) => {
            const cleanVal = e.target.value.replace(/\D/g, '')
            setInput(cleanVal)
            if (status === 'error') setStatus('idle')

            const numVal = parseInt(cleanVal, 10)
            if (!isNaN(numVal) && numVal === challenge.answer) {
              setStatus('success')
              if (onVerifyRef.current) onVerifyRef.current(true)
            } else if (status === 'success') {
              setStatus('idle')
              if (onVerifyRef.current) onVerifyRef.current(false)
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={status === 'success'}
        />
        <button
          type="button"
          className="captcha-verify-btn"
          onClick={handleCheck}
          disabled={!input || status === 'success'}
        >
          {status === 'success' ? '✓' : 'Verificar'}
        </button>
      </div>

      {/* Mensajes */}
      {status === 'success' && (
        <span className="captcha-msg captcha-msg-ok">
          ✓ Verificación completada
        </span>
      )}
      {status === 'error' && (
        <span className="captcha-msg captcha-msg-err">
          ✗ Respuesta incorrecta. Se generó un nuevo captcha.
        </span>
      )}
    </div>
  )
}

export default SimpleCaptcha
