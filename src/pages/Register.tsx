// src/pages/Register.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebaseConfig'
import './Login.css'

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

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Actualizar campos
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Enviar formulario
  const handleSubmit = async () => {
    setError('')

    // Validar que todos los campos estén completos
    if (!form.nombre || !form.dni || !form.celular || !form.email || !form.usuario || !form.password || !form.confirmPassword) {
      setError('Por favor, complete todos los campos.')
      return
    }

    // Validar que las contraseñas coincidan
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    // Validar longitud mínima de contraseña (Firebase exige 6+)
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
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
      //    Todo usuario que se registra desde la web es SIEMPRE "Cliente".
      //    Los administradores se crean manualmente en la colección `usuarios`
      //    (ver README → sección "Crear un administrador").
      await setDoc(doc(db, 'clientes', user.uid), {
        nombre: form.nombre,
        dni: form.dni,
        telefono: form.celular,
        email: form.email,
        usuario: form.usuario,
        creditosActivos: 0,
        estado: 'Pendiente',
        rol: 'Cliente',
        fechaRegistro: new Date().toLocaleDateString('es-PE'),
        uid: user.uid,
        terminosAceptados: true,
        terminosAceptadosEn: new Date().toISOString(),
        avisoUsoDatos: 'Datos experimentales usados únicamente para proyecto universitario.',
      })

      // 2.b) Fuente única de verdad para roles: colección `usuarios/{uid}`.
      await setDoc(doc(db, 'usuarios', user.uid), {
        uid: user.uid,
        nombre: form.nombre,
        email: form.email,
        rol: 'Cliente',
        activo: true,
        fechaRegistro: new Date().toLocaleDateString('es-PE'),
        terminosAceptados: true,
        terminosAceptadosEn: new Date().toISOString(),
        avisoUsoDatos: 'Datos experimentales usados únicamente para proyecto universitario.',
      })

      // 3) Redirigir al login tras registro exitoso
      alert('¡Cuenta creada exitosamente!')
      navigate('/login')
    } catch (err: any) {
      // Errores comunes de Firebase Auth
      if (err.code === 'auth/email-already-in-use') {
        setError('Este correo electrónico ya está registrado.')
      } else if (err.code === 'auth/invalid-email') {
        setError('El correo electrónico no es válido.')
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña es muy débil. Usa al menos 6 caracteres.')
      } else {
        setError('Error al crear la cuenta: ' + err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="login-card register-card">
        <div className="login-logo">V</div>
        <h1 className="login-title">Registro de Usuario</h1>
        <p className="login-subtitle">
          Complete sus datos para acceder al sistema
        </p>

        {/* Mensaje de error */}
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
          <div className="form-group full">
            <label>Nombres completos</label>
            <input
              type="text"
              name="nombre"
              placeholder="Ej. Juan Carlos Pérez Gómez"
              value={form.nombre}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>DNI</label>
            <input
              type="text"
              name="dni"
              placeholder="Ingrese su DNI"
              value={form.dni}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Número de celular</label>
            <input
              type="text"
              name="celular"
              placeholder="Ej. 999 999 999"
              value={form.celular}
              onChange={handleChange}
            />
          </div>

          <div className="form-group full">
            <label>Correo electrónico</label>
            <input
              type="email"
              name="email"
              placeholder="ejemplo@gmail.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Usuario</label>
            <input
              type="text"
              name="usuario"
              placeholder="Cree un usuario"
              value={form.usuario}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              name="password"
              placeholder="Ingrese su contraseña"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <div className="form-group full">
            <label>Confirmar contraseña</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Repita su contraseña"
              value={form.confirmPassword}
              onChange={handleChange}
            />
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