import { useNavigate } from 'react-router-dom'
import './Login.css'

function Register() {
  const navigate = useNavigate()

  return (
    <div className="auth-page">
      <div className="login-card register-card">
        <div className="login-logo">V</div>

        <h1 className="login-title">Registro de Usuario</h1>

        <p className="login-subtitle">
          Complete sus datos para acceder al sistema
        </p>

        <div className="register-grid">
          <div className="form-group full">
            <label>Nombres completos</label>
            <input type="text" placeholder="Ej. Juan Carlos Pérez Gómez" />
          </div>

          <div className="form-group">
            <label>DNI</label>
            <input type="text" placeholder="Ingrese su DNI" />
          </div>

          <div className="form-group">
            <label>Número de celular</label>
            <input type="text" placeholder="Ej. 999 999 999" />
          </div>

          <div className="form-group full">
            <label>Correo electrónico</label>
            <input type="email" placeholder="ejemplo@gmail.com" />
          </div>

          <div className="form-group">
            <label>Usuario</label>
            <input type="text" placeholder="Cree un usuario" />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input type="password" placeholder="Ingrese su contraseña" />
          </div>

          <div className="form-group full">
            <label>Confirmar contraseña</label>
            <input type="password" placeholder="Repita su contraseña" />
          </div>
        </div>

        <button className="login-button">
          Crear cuenta
        </button>

        <p className="register-link">
          ¿Ya tienes cuenta?{' '}
          <span onClick={() => navigate('/')}>
            Inicia sesión
          </span>
        </p>
      </div>
    </div>
  )
}

export default Register