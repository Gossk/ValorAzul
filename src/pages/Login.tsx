import { useNavigate } from 'react-router-dom'
import './Login.css'

function Login() {
  const navigate = useNavigate()

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">V</div>

        <h1 className="login-title">Valor Azul</h1>

        <p className="login-subtitle">
          Gestión de créditos vehiculares
        </p>

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

        <p className="login-footer">
          Plataforma segura y encriptada.
        </p>
        <p className="register-link">
         ¿No tienes cuenta? <span onClick={() => navigate('/register')}>Regístrate</span>
       </p>
      </div>
    </div>
  )
}

export default Login