import { useState } from 'react';
import {
  Bell,
  Building2,
  Camera,
  KeyRound,
  Laptop,
  Smartphone,
  Shield,
  User,
} from 'lucide-react';

import { CURRENT_USER } from '../components/Layout';
import './Configuracion.css';

type Tab = 'perfil' | 'empresa' | 'notificaciones' | 'seguridad';

const tabs: { id: Tab; label: string; icon: typeof User }[] = [
  { id: 'perfil', label: 'Perfil', icon: User },
  { id: 'empresa', label: 'Empresa', icon: Building2 },
  { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
  { id: 'seguridad', label: 'Seguridad', icon: Shield },
];

const notificacionesIniciales = [
  { id: 'nuevos-clientes', label: 'Nuevos clientes registrados', activo: true },
  { id: 'simulaciones', label: 'Simulaciones creadas', activo: true },
  { id: 'creditos-aprobados', label: 'Créditos aprobados o rechazados', activo: true },
  { id: 'reportes', label: 'Reportes semanales por correo', activo: false },
  { id: 'alertas-seguridad', label: 'Alertas de seguridad', activo: true },
];

const sesiones = [
  { id: 1, dispositivo: 'Windows · Chrome', ubicacion: 'Lima, Perú', activa: true, icon: Laptop },
  { id: 2, dispositivo: 'Android · App móvil', ubicacion: 'Lima, Perú', activa: false, icon: Smartphone },
];

function Configuracion() {
  const [tab, setTab] = useState<Tab>('perfil');
  const [perfil, setPerfil] = useState({ nombre: CURRENT_USER.name, email: CURRENT_USER.email, cargo: 'Administrador del sistema' });
  const [empresa, setEmpresa] = useState({ nombre: 'Valor Azul S.A.C.', ruc: '20458963214', direccion: 'Av. Javier Prado 1234, San Isidro, Lima' });
  const [notificaciones, setNotificaciones] = useState(notificacionesIniciales);
  const [passwords, setPasswords] = useState({ actual: '', nueva: '', confirmar: '' });

  const toggleNotificacion = (id: string) => {
    setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, activo: !n.activo } : n)));
  };

  return (
    <>
      <div className="config-tabs fade-in">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              className={`config-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'perfil' && (
        <div className="panel glass-card fade-in">
          <h3>Perfil</h3>
          <div className="profile-row">
            <div className="profile-photo">
              <div className="avatar-circle big glow">{perfil.nombre.charAt(0)}</div>
              <button className="btn"><Camera size={14} /> Cambiar foto</button>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Nombre completo</label>
                <input value={perfil.nombre} onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input value={perfil.email} onChange={(e) => setPerfil({ ...perfil, email: e.target.value })} />
              </div>
              <div className="form-group full">
                <label>Cargo</label>
                <input value={perfil.cargo} onChange={(e) => setPerfil({ ...perfil, cargo: e.target.value })} />
              </div>
            </div>
          </div>
          <button className="btn btn-primary save-btn">Guardar cambios</button>
        </div>
      )}

      {tab === 'empresa' && (
        <div className="panel glass-card fade-in">
          <h3>Empresa</h3>
          <div className="profile-row">
            <div className="profile-photo">
              <div className="avatar-circle big logo glow">VA</div>
              <button className="btn"><Camera size={14} /> Cambiar logo</button>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Nombre de la empresa</label>
                <input value={empresa.nombre} onChange={(e) => setEmpresa({ ...empresa, nombre: e.target.value })} />
              </div>
              <div className="form-group">
                <label>RUC</label>
                <input value={empresa.ruc} onChange={(e) => setEmpresa({ ...empresa, ruc: e.target.value })} />
              </div>
              <div className="form-group full">
                <label>Dirección</label>
                <input value={empresa.direccion} onChange={(e) => setEmpresa({ ...empresa, direccion: e.target.value })} />
              </div>
            </div>
          </div>
          <button className="btn btn-primary save-btn">Guardar cambios</button>
        </div>
      )}

      {tab === 'notificaciones' && (
        <div className="panel glass-card fade-in">
          <h3>Notificaciones</h3>
          <div className="notif-list">
            {notificaciones.map((n) => (
              <div className="notif-item" key={n.id}>
                <span>{n.label}</span>
                <button className={`switch ${n.activo ? 'on' : ''}`} onClick={() => toggleNotificacion(n.id)}>
                  <span className="switch-handle" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'seguridad' && (
        <div className="seguridad-grid">
          <div className="panel glass-card fade-in">
            <h3><KeyRound size={16} /> Cambiar contraseña</h3>
            <div className="form-grid">
              <div className="form-group full">
                <label>Contraseña actual</label>
                <input type="password" value={passwords.actual} onChange={(e) => setPasswords({ ...passwords, actual: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Nueva contraseña</label>
                <input type="password" value={passwords.nueva} onChange={(e) => setPasswords({ ...passwords, nueva: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Confirmar contraseña</label>
                <input type="password" value={passwords.confirmar} onChange={(e) => setPasswords({ ...passwords, confirmar: e.target.value })} />
              </div>
            </div>
            <button className="btn btn-primary save-btn">Actualizar contraseña</button>
          </div>

          <div className="panel glass-card fade-in">
            <h3>Sesiones activas</h3>
            <div className="sesiones-list">
              {sesiones.map((s) => {
                const Icon = s.icon;
                return (
                  <div className="sesion-item" key={s.id}>
                    <div className="sesion-icon"><Icon size={20} /></div>
                    <div>
                      <strong>{s.dispositivo}</strong>
                      <p>{s.ubicacion}</p>
                    </div>
                    {s.activa ? (
                      <span className="badge badge-green">Activa</span>
                    ) : (
                      <button className="btn">Cerrar sesión</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Configuracion;
