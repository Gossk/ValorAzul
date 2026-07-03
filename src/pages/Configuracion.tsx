import { useEffect, useState } from 'react';
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
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, updatePassword, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';

import './Configuracion.css';

type Tab = 'perfil' | 'empresa' | 'notificaciones' | 'seguridad';

const tabs: { id: Tab; label: string; icon: typeof User }[] = [
  { id: 'perfil', label: 'Perfil', icon: User },
  { id: 'empresa', label: 'Empresa', icon: Building2 },
  { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
  { id: 'seguridad', label: 'Seguridad', icon: Shield },
];

const sesiones = [
  { id: 1, dispositivo: 'Windows · Chrome', ubicacion: 'Lima, Perú', activa: true, icon: Laptop },
  { id: 2, dispositivo: 'Android · App móvil', ubicacion: 'Lima, Perú', activa: false, icon: Smartphone },
];

function Configuracion() {
  const [tab, setTab] = useState<Tab>('perfil');

  // --- Perfil del usuario logueado (desde Firestore colección "clientes") ---
  const [perfil, setPerfil] = useState({ nombre: '', email: '', cargo: 'Administrador del sistema' });
  const [perfilLoading, setPerfilLoading] = useState(true);
  const [perfilMsg, setPerfilMsg] = useState('');

  // --- Empresa (configuración global compartida) ---
  const [empresa, setEmpresa] = useState({ nombre: '', ruc: '', direccion: '' });
  const [empresaMsg, setEmpresaMsg] = useState('');

  // --- Notificaciones (configuración global compartida) ---
  const [notificaciones, setNotificaciones] = useState([
    { id: 'nuevos-clientes', label: 'Nuevos clientes registrados', activo: true },
    { id: 'simulaciones', label: 'Simulaciones creadas', activo: true },
    { id: 'creditos-aprobados', label: 'Créditos aprobados o rechazados', activo: true },
    { id: 'reportes', label: 'Reportes semanales por correo', activo: false },
    { id: 'alertas-seguridad', label: 'Alertas de seguridad', activo: true },
  ]);

  // --- Seguridad ---
  const [passwords, setPasswords] = useState({ actual: '', nueva: '', confirmar: '' });
  const [passMsg, setPassMsg] = useState('');

  const [currentUid, setCurrentUid] = useState<string | null>(null);

  // ---- Cargar datos al montar ----
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (!user) return;
      setCurrentUid(user.uid);

      // Perfil del usuario (colección "clientes", documento = uid)
      const profileDoc = await getDoc(doc(db, 'clientes', user.uid));
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        setPerfil({
          nombre: data.nombre || '',
          email: data.email || user.email || '',
          cargo: 'Administrador del sistema',
        });
      } else {
        setPerfil({
          nombre: user.displayName || 'Administrador',
          email: user.email || '',
          cargo: 'Administrador del sistema',
        });
      }

      // Configuración global (compartida entre todos los administradores)
      const configDoc = await getDoc(doc(db, 'configuracion', 'global'));
      if (configDoc.exists()) {
        const data = configDoc.data();
        if (data.empresa) {
          setEmpresa({
            nombre: data.empresa.nombre || '',
            ruc: data.empresa.ruc || '',
            direccion: data.empresa.direccion || '',
          });
        }
        if (data.notificaciones) {
          setNotificaciones((prev) =>
            prev.map((n) => ({
              ...n,
              activo: data.notificaciones[n.id] ?? n.activo,
            }))
          );
        }
      }

      setPerfilLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ---- Guardar perfil ----
  const guardarPerfil = async () => {
    if (!currentUid) return;
    setPerfilMsg('');
    try {
      await setDoc(
        doc(db, 'clientes', currentUid),
        { nombre: perfil.nombre, email: perfil.email },
        { merge: true }
      );
      setPerfilMsg('✅ Perfil guardado correctamente.');
    } catch (err: any) {
      setPerfilMsg('❌ Error: ' + err.message);
    }
  };

  // ---- Guardar empresa (global) ----
  const guardarEmpresa = async () => {
    setEmpresaMsg('');
    try {
      await setDoc(
        doc(db, 'configuracion', 'global'),
        { empresa: { nombre: empresa.nombre, ruc: empresa.ruc, direccion: empresa.direccion } },
        { merge: true }
      );
      setEmpresaMsg('✅ Datos de empresa guardados.');
    } catch (err: any) {
      setEmpresaMsg('❌ Error: ' + err.message);
    }
  };

  // ---- Toggle notificación (global) ----
  const toggleNotificacion = async (id: string) => {
    const updated = notificaciones.map((n) => (n.id === id ? { ...n, activo: !n.activo } : n));
    setNotificaciones(updated);

    // Guardar en Firestore
    const notifMap: Record<string, boolean> = {};
    updated.forEach((n) => { notifMap[n.id] = n.activo; });
    try {
      await setDoc(
        doc(db, 'configuracion', 'global'),
        { notificaciones: notifMap },
        { merge: true }
      );
    } catch (err) {
      console.error('Error guardando notificaciones:', err);
    }
  };

  // ---- Cambiar contraseña ----
  const cambiarPassword = async () => {
    setPassMsg('');
    if (!passwords.nueva || !passwords.confirmar) {
      setPassMsg('❌ Complete todos los campos.');
      return;
    }
    if (passwords.nueva !== passwords.confirmar) {
      setPassMsg('❌ Las contraseñas no coinciden.');
      return;
    }
    if (passwords.nueva.length < 6) {
      setPassMsg('❌ La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No hay usuario autenticado');
      await updatePassword(user, passwords.nueva);
      setPassMsg('✅ Contraseña actualizada correctamente.');
      setPasswords({ actual: '', nueva: '', confirmar: '' });
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        setPassMsg('❌ Por seguridad, cierra sesión y vuelve a iniciar para cambiar la contraseña.');
      } else {
        setPassMsg('❌ Error: ' + err.message);
      }
    }
  };

  if (perfilLoading) {
    return <p style={{ color: 'rgba(255,255,255,0.6)', padding: 40, textAlign: 'center' }}>Cargando configuración...</p>;
  }

  return (
    <>
      <div className="config-tabs">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              className={`config-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="glass-card">
        {tab === 'perfil' && (
          <div className="panel">
            <h3><User size={18} /> Perfil</h3>
            <div className="profile-row">
              <div className="profile-photo">
                <div className="avatar-circle big">{perfil.nombre.charAt(0)}</div>
                <button className="btn-outline btn-sm"><Camera size={14} /> Cambiar foto</button>
              </div>
              <div>
                <div className="form-group">
                  <label>Nombre completo</label>
                  <input value={perfil.nombre} onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input value={perfil.email} onChange={(e) => setPerfil({ ...perfil, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Cargo</label>
                  <input value={perfil.cargo} onChange={(e) => setPerfil({ ...perfil, cargo: e.target.value })} disabled />
                </div>
              </div>
            </div>
            {perfilMsg && <p style={{ fontSize: 13, marginTop: 8 }}>{perfilMsg}</p>}
            <button className="btn-primary save-btn" onClick={guardarPerfil}>Guardar cambios</button>
          </div>
        )}

        {tab === 'empresa' && (
          <div className="panel">
            <h3><Building2 size={18} /> Empresa</h3>
            <div className="profile-row">
              <div className="profile-photo">
                <div className="avatar-circle big logo">VA</div>
                <button className="btn-outline btn-sm"><Camera size={14} /> Cambiar logo</button>
              </div>
              <div>
                <div className="form-group">
                  <label>Nombre de la empresa</label>
                  <input value={empresa.nombre} onChange={(e) => setEmpresa({ ...empresa, nombre: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>RUC</label>
                  <input value={empresa.ruc} onChange={(e) => setEmpresa({ ...empresa, ruc: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Dirección</label>
                  <input value={empresa.direccion} onChange={(e) => setEmpresa({ ...empresa, direccion: e.target.value })} />
                </div>
              </div>
            </div>
            {empresaMsg && <p style={{ fontSize: 13, marginTop: 8 }}>{empresaMsg}</p>}
            <button className="btn-primary save-btn" onClick={guardarEmpresa}>Guardar cambios</button>
          </div>
        )}

        {tab === 'notificaciones' && (
          <div className="panel">
            <h3><Bell size={18} /> Notificaciones</h3>
            <div className="notif-list">
              {notificaciones.map((n) => (
                <div key={n.id} className="notif-item">
                  <span>{n.label}</span>
                  <button className={`toggle ${n.activo ? 'on' : ''}`} onClick={() => toggleNotificacion(n.id)}>
                    <span className="toggle-knob" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'seguridad' && (
          <div className="panel seguridad-grid">
            <div>
              <h3><KeyRound size={18} /> Cambiar contraseña</h3>
              <div className="form-group">
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
              {passMsg && <p style={{ fontSize: 13, marginTop: 8 }}>{passMsg}</p>}
              <button className="btn-primary" onClick={cambiarPassword}>Actualizar contraseña</button>
            </div>
            <div>
              <h3><Shield size={18} /> Sesiones activas</h3>
              <div className="sesiones-list">
                {sesiones.map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.id} className="sesion-item">
                      <div className="sesion-icon"><Icon size={20} /></div>
                      <div>
                        <strong>{s.dispositivo}</strong>
                        <p>{s.ubicacion}</p>
                      </div>
                      {s.activa ? (
                        <span className="badge badge-green">Activa</span>
                      ) : (
                        <button className="btn-outline btn-sm">Cerrar sesión</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Configuracion;
