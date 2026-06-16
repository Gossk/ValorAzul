import { useState } from 'react';
import { Plus, ShieldAlert, X } from 'lucide-react';

import { CURRENT_USER } from '../components/Layout';
import { usuarios as initialUsuarios, type Usuario } from '../data/mockData';
import './Usuarios.css';

const rolBadge: Record<Usuario['rol'], string> = {
  Administrador: 'badge-purple',
  Supervisor: 'badge-blue',
  Asesor: 'badge-green',
};

function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>(initialUsuarios);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<{ nombre: string; email: string; rol: Usuario['rol'] }>({
    nombre: '',
    email: '',
    rol: 'Asesor',
  });

  if (CURRENT_USER.role !== 'Administrador') {
    return (
      <div className="panel glass-card access-denied fade-in">
        <ShieldAlert size={40} className="glow" />
        <h2>Acceso restringido</h2>
        <p>Solo los usuarios con rol Administrador pueden ver esta sección.</p>
      </div>
    );
  }

  const toggleActivo = (id: number) => {
    setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, activo: !u.activo } : u)));
  };

  const handleCrear = () => {
    if (!form.nombre.trim() || !form.email.trim()) return;
    const nuevo: Usuario = {
      id: Math.max(0, ...usuarios.map((u) => u.id)) + 1,
      nombre: form.nombre,
      email: form.email,
      rol: form.rol,
      ultimoAcceso: 'Nunca',
      activo: true,
    };
    setUsuarios((prev) => [nuevo, ...prev]);
    setForm({ nombre: '', email: '', rol: 'Asesor' });
    setShowModal(false);
  };

  return (
    <>
      <div className="usuarios-header fade-in">
        <div>
          <h3>Usuarios del sistema</h3>
          <p>{usuarios.length} usuarios registrados</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Nuevo Usuario
        </button>
      </div>

      <div className="panel glass-card fade-in">
        <table className="usuarios-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Último acceso</th>
              <th>Estado</th>
              <th>Activo</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u, idx) => (
              <tr key={u.id} className={idx % 2 === 0 ? 'row-even' : 'row-odd'}>
                <td>
                  <div className="usuario-cell">
                    <div className="avatar-circle">{u.nombre.charAt(0)}</div>
                    <strong>{u.nombre}</strong>
                  </div>
                </td>
                <td>{u.email}</td>
                <td><span className={`badge ${rolBadge[u.rol]}`}>{u.rol}</span></td>
                <td>{u.ultimoAcceso}</td>
                <td>
                  <span className={`badge ${u.activo ? 'badge-green' : 'badge-red'}`}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <button
                    className={`switch ${u.activo ? 'on' : ''}`}
                    onClick={() => toggleActivo(u.id)}
                    aria-label="Activar o desactivar usuario"
                  >
                    <span className="switch-handle" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="drawer-overlay" onClick={() => setShowModal(false)}>
          <div className="modal glass-card" onClick={(e) => e.stopPropagation()}>
            <button className="drawer-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            <h2>Nuevo usuario</h2>

            <div className="form-grid">
              <div className="form-group">
                <label>Nombre completo</label>
                <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej. Pedro Salinas" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Ej. correo@valorazul.com" />
              </div>
              <div className="form-group full">
                <label>Rol</label>
                <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value as Usuario['rol'] })}>
                  <option value="Administrador">Administrador</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Asesor">Asesor</option>
                </select>
              </div>
            </div>

            <div className="drawer-actions">
              <button className="btn btn-primary" onClick={handleCrear}>Crear usuario</button>
              <button className="btn" onClick={() => setShowModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Usuarios;
