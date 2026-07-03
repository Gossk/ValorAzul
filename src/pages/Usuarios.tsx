import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { CURRENT_USER } from '../components/Layout';
import './Usuarios.css';

// Todos los que se registran son Administradores
interface UsuarioFirestore {
  id: string; // uid de Firebase Auth
  nombre: string;
  email: string;
  rol: 'Administrador';
  usuario?: string;
  fechaRegistro?: string;
  activo: boolean;
}

function Usuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioFirestore[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar usuarios desde Firestore (colección "clientes" = los registrados)
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'clientes'));
        const lista: UsuarioFirestore[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          lista.push({
            id: docSnap.id,
            nombre: data.nombre || 'Sin nombre',
            email: data.email || '',
            rol: 'Administrador',
            usuario: data.usuario || '',
            fechaRegistro: data.fechaRegistro || '',
            activo: data.estado !== 'Inactivo',
          });
        });
        setUsuarios(lista);
      } catch (err) {
        console.error('Error cargando usuarios:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsuarios();
  }, []);

  if (CURRENT_USER.role !== 'Administrador') {
    return (
      <div className="access-denied">
        <ShieldAlert size={48} />
        <h2>Acceso restringido</h2>
        <p>Solo los usuarios con rol Administrador pueden ver esta sección.</p>
      </div>
    );
  }

  if (loading) {
    return <p style={{ color: 'rgba(255,255,255,0.6)', padding: 40, textAlign: 'center' }}>Cargando usuarios...</p>;
  }

  return (
    <>
      <div className="usuarios-header">
        <div>
          <h3>Usuarios del sistema</h3>
          <p>{usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} registrado{usuarios.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="glass-card panel">
        <table className="usuarios-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Fecha de registro</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u, idx) => (
              <tr key={u.id} className={idx % 2 === 0 ? 'row-even' : ''}>
                <td>
                  <div className="usuario-cell">
                    <div className="avatar-circle">{u.nombre.charAt(0)}</div>
                    <strong>{u.nombre}</strong>
                  </div>
                </td>
                <td>{u.email}</td>
                <td>{u.usuario || '—'}</td>
                <td><span className="badge badge-purple">{u.rol}</span></td>
                <td>{u.fechaRegistro || '—'}</td>
                <td>
                  <span className={`badge ${u.activo ? 'badge-green' : 'badge-red'}`}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.5)' }}>
                  No hay usuarios registrados aún. Regístrate en /register para aparecer aquí.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Usuarios;
