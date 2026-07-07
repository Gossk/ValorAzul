// src/pages/Register.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebaseConfig'
import './Login.css'

/* ───────── tipos ───────── */
interface FormErrors {
  nombre?: string
  dni?: string
  celular?: string
  email?: string
  usuario?: string
  password?: string
  confirmPassword?: string
}

/* ───────── expresiones regulares ───────── */
const DNI_REGEX = /^\d{8}$/
const CELULAR_REGEX = /^\d{9}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#._\-])[A-Za-z\d@$!%*?&#._\-]{8,}$/

/* ───────── indicadores de fortaleza de contraseña ───────── */
function getPasswordStrength(pw: string) {
  const checks = {
    length: pw.length >= 8,
    lower: /[a-z]/.test(pw),
    upper: /[A-Z]/.test(pw),
    number: /\d/.test(pw),
    special: /[@$!%*?&#._\-]/.test(pw),
  }
  const passed = Object.values(checks).filter(Boolean).length
  let label = 'Muy débil'
  let color = '#ef4444'
  if (passed === 5) { label = 'Muy segura'; color = '#22c55e' }
  else if (passed === 4) { label = 'Segura'; color = '#84cc16' }
  else if (passed === 3) { label = 'Moderada'; color = '#eab308' }
  else if (passed === 2) { label = 'Débil'; color = '#f97316' }

  return { checks, passed, label, color, percent: (passed / 5) * 100 }
}

/* ───────── componente ───────── */
function Register() {
  const navigate = useNavigate()

  // Estado del formulario
  const [form, setForm] = useState({
    nombre: '',
    dni: '',
    celular: '',
    email: '',
    usuario: '',
    password: '',
    confirmPassword: '',
  })
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  /* ─── validación por campo ─── */
  const validateField = (name: string, value: string, fullForm = form): string | undefined => {
    switch (name) {
      case 'nombre':
        if (!value.trim()) return 'El nombre es obligatorio.'
        if (value.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres.'
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(value.trim())) return 'El nombre solo debe contener letras.'
        return undefined

      case 'dni':
        if (!value) return 'El DNI es obligatorio.'
        if (!DNI_REGEX.test(value)) return 'El DNI debe tener exactamente 8 dígitos.'
        return undefined

      case 'celular':
        if (!value) return 'El número de celular es obligatorio.'
        if (!CELULAR_REGEX.test(value)) return 'El celular debe tener exactamente 9 dígitos.'
        return undefined

      case 'email':
        if (!value) return 'El correo es obligatorio.'
        if (!EMAIL_REGEX.test(value)) return 'Ingrese un correo electrónico válido.'
        return undefined

      case 'usuario':
        if (!value.trim()) return 'El usuario es obligatorio.'
        if (value.trim().length < 4) return 'El usuario debe tener al menos 4 caracteres.'
        if (!/^[a-zA-Z0-9_]+$/.test(value.trim())) return 'El usuario solo puede contener letras, números y guiones bajos.'
        return undefined

      case 'password':
        if (!value) return 'La contraseña es obligatoria.'
        if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
        if (!PASSWORD_REGEX.test(value)) return 'Debe incluir mayúscula, minúscula, número y carácter especial.'
        return undefined

      case 'confirmPassword':
        if (!value) return 'Debe confirmar su contraseña.'
        if (value !== fullForm.password) return 'Las contraseñas no coinciden.'
        return undefined

      default:
        return undefined
    }
  }

  /* ─── validar todo el formulario ─── */
  const validateAll = (): FormErrors => {
    const newErrors: FormErrors = {}
    ;(Object.keys(form) as (keyof typeof form)[]).forEach((key) => {
      const err = validateField(key, form[key])
      if (err) (newErrors as any)[key] = err
    })
    return newErrors
  }

  /* ─── actualizar campos con validación en tiempo real ─── */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    // Restringir DNI y celular a solo dígitos
    let filtered = value
    if (name === 'dni') filtered = value.replace(/\D/g, '').slice(0, 8)
    if (name === 'celular') filtered = value.replace(/\D/g, '').slice(0, 9)

    const updated = { ...form, [name]: filtered }
    setForm(updated)

    // Validar campo al escribir (solo si ya fue tocado)
    if (touched[name]) {
      const err = validateField(name, filtered, updated)
      setErrors((prev) => ({ ...prev, [name]: err }))
    }

    // Si se modifica password, revalidar confirmPassword también
    if (name === 'password' && touched.confirmPassword && updated.confirmPassword) {
      const cpErr = validateField('confirmPassword', updated.confirmPassword, updated)
      setErrors((prev) => ({ ...prev, confirmPassword: cpErr }))
    }
  }

  /* ─── marcar campo como tocado al salir (blur) ─── */
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    const err = validateField(name, value)
    setErrors((prev) => ({ ...prev, [name]: err }))
  }

  /* ─── enviar formulario ─── */
  const handleSubmit = async () => {
    setError('')

    // Marcar todos los campos como tocados
    const allTouched: Record<string, boolean> = {}
    Object.keys(form).forEach((k) => (allTouched[k] = true))
    setTouched(allTouched)

    // Validar todo
    const newErrors = validateAll()
    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      setError('Por favor, corrija los errores señalados.')
      return
    }

    if (!aceptaTerminos) {
      setError('Debes aceptar los términos y condiciones sobre el uso experimental de datos.')
      return
    }

    setLoading(true)

    try {
      // 1) Crear usuario en Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password)
      const user = userCredential.user

      // 2) Guardar datos adicionales en Firestore (colección "clientes")
      await setDoc(doc(db, 'clientes', user.uid), {
        nombre: form.nombre.trim(),
        dni: form.dni,
        telefono: form.celular,
        email: form.email,
        usuario: form.usuario.trim(),
        creditosActivos: 0,
        estado: 'Pendiente',
        rol: 'Cliente',
        fechaRegistro: new Date().toLocaleDateString('es-PE'),
        uid: user.uid,
        terminosAceptados: true,
        terminosAceptadosEn: new Date().toISOString(),
        avisoUsoDatos: 'Datos experimentales usados únicamente para proyecto universitario.',
      })

      // 2.b) Fuente única de verdad para roles
      await setDoc(doc(db, 'usuarios', user.uid), {
        uid: user.uid,
        nombre: form.nombre.trim(),
        email: form.email,
        rol: 'Cliente',
        activo: true,
        fechaRegistro: new Date().toLocaleDateString('es-PE'),
        terminosAceptados: true,
        terminosAceptadosEn: new Date().toISOString(),
        avisoUsoDatos: 'Datos experimentales usados únicamente para proyecto universitario.',
      })

      // 3) Redirigir al login
      alert('¡Cuenta creada exitosamente!')
      navigate('/login')
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este correo electrónico ya está registrado.')
      } else if (err.code === 'auth/invalid-email') {
        setError('El correo electrónico no es válido.')
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña es muy débil. Usa al menos 8 caracteres con mayúsculas, minúsculas, números y un carácter especial.')
      } else {
        setError('Error al crear la cuenta: ' + err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  /* ─── helpers de render ─── */
  const strength = getPasswordStrength(form.password)

  const fieldError = (name: keyof FormErrors) =>
    touched[name] && errors[name] ? (
      <span className="field-error">{errors[name]}</span>
    ) : null

  return (
    <div className="auth-page">
      <div className="login-card register-card">
        <div className="login-logo">V</div>
        <h1 className="login-title">Registro de Usuario</h1>
        <p className="login-subtitle">
          Complete sus datos para acceder al sistema
        </p>

        {/* Mensaje de error general */}
        {error && (
          <p style={{
            color: '#f87171',
            backgroundColor: 'rgba(248,113,113,0.1)',
            border: '1px solid rgba(248,113,113,0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '13px',
            textAlign: 'center',
            marginBottom: '16px',
          }}>
            {error}
          </p>
        )}

        <div className="register-grid">
          {/* ──── Nombre ──── */}
          <div className="form-group full">
            <label>Nombres completos</label>
            <input
              type="text"
              name="nombre"
              placeholder="Ej. Juan Carlos Pérez Gómez"
              value={form.nombre}
              onChange={handleChange}
              onBlur={handleBlur}
              className={touched.nombre && errors.nombre ? 'input-error' : touched.nombre && !errors.nombre ? 'input-ok' : ''}
            />
            {fieldError('nombre')}
          </div>

          {/* ──── DNI ──── */}
          <div className="form-group">
            <label>DNI</label>
            <input
              type="text"
              name="dni"
              inputMode="numeric"
              maxLength={8}
              placeholder="8 dígitos"
              value={form.dni}
              onChange={handleChange}
              onBlur={handleBlur}
              className={touched.dni && errors.dni ? 'input-error' : touched.dni && !errors.dni ? 'input-ok' : ''}
            />
            {fieldError('dni')}
            <span className="field-hint">{form.dni.length}/8</span>
          </div>

          {/* ──── Celular ──── */}
          <div className="form-group">
            <label>Número de celular</label>
            <input
              type="text"
              name="celular"
              inputMode="numeric"
              maxLength={9}
              placeholder="9 dígitos"
              value={form.celular}
              onChange={handleChange}
              onBlur={handleBlur}
              className={touched.celular && errors.celular ? 'input-error' : touched.celular && !errors.celular ? 'input-ok' : ''}
            />
            {fieldError('celular')}
            <span className="field-hint">{form.celular.length}/9</span>
          </div>

          {/* ──── Email ──── */}
          <div className="form-group full">
            <label>Correo electrónico</label>
            <input
              type="email"
              name="email"
              placeholder="ejemplo@gmail.com"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={touched.email && errors.email ? 'input-error' : touched.email && !errors.email ? 'input-ok' : ''}
            />
            {fieldError('email')}
          </div>

          {/* ──── Usuario ──── */}
          <div className="form-group">
            <label>Usuario</label>
            <input
              type="text"
              name="usuario"
              placeholder="Mínimo 4 caracteres"
              value={form.usuario}
              onChange={handleChange}
              onBlur={handleBlur}
              className={touched.usuario && errors.usuario ? 'input-error' : touched.usuario && !errors.usuario ? 'input-ok' : ''}
            />
            {fieldError('usuario')}
          </div>

          {/* ──── Contraseña ──── */}
          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              name="password"
              placeholder="Mín. 8 caracteres"
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              className={touched.password && errors.password ? 'input-error' : touched.password && !errors.password ? 'input-ok' : ''}
            />
            {fieldError('password')}

            {/* Barra de fortaleza */}
            {form.password.length > 0 && (
              <div className="strength-wrapper">
                <div className="strength-bar-bg">
                  <div
                    className="strength-bar-fill"
                    style={{ width: `${strength.percent}%`, backgroundColor: strength.color }}
                  />
                </div>
                <span className="strength-label" style={{ color: strength.color }}>
                  {strength.label}
                </span>
                <ul className="strength-checks">
                  <li className={strength.checks.length ? 'check-ok' : 'check-fail'}>
                    {strength.checks.length ? '✓' : '✗'} Mín. 8 caracteres
                  </li>
                  <li className={strength.checks.upper ? 'check-ok' : 'check-fail'}>
                    {strength.checks.upper ? '✓' : '✗'} Mayúscula
                  </li>
                  <li className={strength.checks.lower ? 'check-ok' : 'check-fail'}>
                    {strength.checks.lower ? '✓' : '✗'} Minúscula
                  </li>
                  <li className={strength.checks.number ? 'check-ok' : 'check-fail'}>
                    {strength.checks.number ? '✓' : '✗'} Número
                  </li>
                  <li className={strength.checks.special ? 'check-ok' : 'check-fail'}>
                    {strength.checks.special ? '✓' : '✗'} Carácter especial (@$!%*?&#._-)
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* ──── Confirmar contraseña ──── */}
          <div className="form-group full">
            <label>Confirmar contraseña</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Repita su contraseña"
              value={form.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              className={touched.confirmPassword && errors.confirmPassword ? 'input-error' : touched.confirmPassword && !errors.confirmPassword ? 'input-ok' : ''}
            />
            {fieldError('confirmPassword')}
          </div>
        </div>

        <label className="terms-box">
          <input
            type="checkbox"
            checked={aceptaTerminos}
            onChange={(e) => setAceptaTerminos(e.target.checked)}
          />
          <span>
            Acepto los términos y condiciones sobre el uso de mis datos. Entiendo que la información ingresada y las simulaciones generadas son datos experimentales, usados únicamente con fines académicos para este proyecto universitario, y no serán utilizados para otros fines.
          </span>
        </label>

        <button
          className="login-button"
          onClick={handleSubmit}
          disabled={loading || !aceptaTerminos}
          style={{ opacity: loading || !aceptaTerminos ? 0.6 : 1 }}
        >
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>

        <p className="register-link">
          ¿Ya tienes cuenta?{' '}
          <span onClick={() => navigate('/login')}>
            Inicia sesión
          </span>
        </p>
      </div>
    </div>
  )
}

export default Register
