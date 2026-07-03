import { useEffect, useMemo, useState } from 'react';
import { Eye, Plus, Search, Trash2, X } from 'lucide-react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { ensureSeedData } from '../data/firestoreSeeder';
import './Clientes.css';

type EstadoCliente = 'Activo' | 'Inactivo' | 'Pendiente';

interface ClienteFS {
  id: string;
  nombre: string;
  dni: string;
  telefono: string;
  email: string;
  creditosActivos: number;
  estado: EstadoCliente;
  fechaRegistro: string;
}

const PAGE_SIZE = 5;

const badgeClass: Record<EstadoCliente, string> = {
  Activo: 'badge-green',
  Pendiente: 'badge-yellow',
  Inactivo: 'badge-red',
};

function Clientes() {
  const [clientes, setClientes] = useState<ClienteFS[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('Todos');
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ClienteFS | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ nombre: '', dni: '', telefono: '', email: '' });

  // ---- Cargar clientes desde Firestore (con auto-seed) ----
  useEffect(() => {
    const init = async () => {
      try {
        await ensureSeedData();
        const snapshot = await getDocs(collection(db, 'clientes_negocio'));
        const lista: ClienteFS[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          lista.push({
            id: docSnap.id,
            nombre: data.nombre || '',
            dni: data.dni || '',
            telefono: data.telefono || '',
            email: data.email || '',
            creditosActivos: data.creditosActivos ?? 0,
            estado: data.estado || 'Pendiente',
            fechaRegistro: data.fechaRegistro || '',
          });
        });
        setClientes(lista);
      } catch (err) {
        console.error('Error cargando clientes:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ---- Filtros ----
  const filtrados = useMemo(() => {
    return clientes.filter((c) => {
      const matchSearch =
        c.nombre.toLowerCase().includes(search.toLowerCase()) ||
        c.dni.includes(search);
      const matchEstado = estadoFiltro === 'Todos' || c.estado === estadoFiltro;
      const matchFecha = !fechaFiltro || c.fechaRegistro === fechaFiltro;
      return matchSearch && matchEstado && matchFecha;
    });
  }, [clientes, search, estadoFiltro, fechaFiltro]);

  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const pageItems = filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ---- Eliminar cliente ----
  const handleEliminar = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'clientes_negocio', id));
      setClientes((prev) => prev.filter((c) => c.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      console.error('Error eliminando cliente:', err);
    }
  };

  // ---- Crear cliente ----
  const handleCrear = async () => {
    if (!form.nombre.trim() || !form.dni.trim()) return;

    const newId = `cliente_${Date.now()}`;
    const nuevo: ClienteFS = {
      id: newId,
      nombre: form.nombre,
      dni: form.dni,
      telefono: form.telefono,
      email: form.email,
      creditosActivos: 0,
      estado: 'Pendiente',
      fechaRegistro: new Date().toLocaleDateString('es-PE'),
    };

    try {
      await setDoc(doc(db, 'clientes_negocio', newId), {
        nombre: nuevo.nombre,
        dni: nuevo.dni,
        telefono: nuevo.telefono,
        email: nuevo.email,
        creditosActivos: 0,
        estado: 'Pendiente',
        fechaRegistro: nuevo.fechaRegistro,
      });
      setClientes((prev) => [nuevo, ...prev]);
      setForm({ nombre: '', dni: '', telefono: '', email: '' });
      setShowModal(false);
      setPage(1);
    } catch (err) {
      console.error('Error creando cliente:', err);
    }
  };

  if (loading) {
    return <p style={{ color: 'rgba(255,255,255,0.6)', padding: 40, textAlign: 'center' }}>Cargando clientes...</p>;
  }

  return (
    <>
      {/* -------- Toolbar -------- */}
      <div className="clientes-header">
        <div className="search-filters">
          <div className="search-box">
            <Search size={16} />
            <input
              placeholder="Buscar por nombre o DNI…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <select value={estadoFiltro} onChange={(e) => { setEstadoFiltro(e.target.value); setPage(1); }}>
            <option>Todos</option>
            <option>Activo</option>
            <option>Pendiente</option>
            <option>Inactivo</option>
          </select>

          <input
            type="date"
            value={fechaFiltro}
            onChange={(e) => { setFechaFiltro(e.target.value); setPage(1); }}
            className="date-filter"
          />
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Nuevo Cliente
        </button>
      </div>

      {/* -------- Table -------- */}
      <div className="glass-card panel">
        <table className="clientes-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>DNI</th>
              <th>Teléfono</th>
              <th>Créditos activos</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((cliente, idx) => (
              <tr key={cliente.id} className={idx % 2 === 0 ? 'row-even' : ''}>
                <td>
                  <div className="cliente-cell" onClick={() => setSelected(cliente)}>
                    <div className="avatar-circle">{cliente.nombre.charAt(0)}</div>
                    <div>
                      <strong>{cliente.nombre}</strong>
                      <p>{cliente.email}</p>
                    </div>
                  </div>
                </td>
                <td>{cliente.dni}</td>
                <td>{cliente.telefono}</td>
                <td>{cliente.creditosActivos}</td>
                <td><span className={`badge ${badgeClass[cliente.estado]}`}>{cliente.estado}</span></td>
                <td>
                  <div className="actions">
                    <button className="icon-action" onClick={() => setSelected(cliente)} title="Ver detalle">
                      <Eye size={16} />
                    </button>
                    <button className="icon-action danger" onClick={() => handleEliminar(cliente.id)} title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-row">
                  No se encontraron clientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="pagination">
          <span>Mostrando {pageItems.length} de {filtrados.length} clientes</span>
          <div className="pagination-buttons">
            <button className="btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</button>
            <span className="page-indicator">Página {page} de {totalPages}</span>
            <button className="btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</button>
          </div>
        </div>
      </div>

      {/* -------- Modal detalle -------- */}
      {selected && (
        <div className="drawer-overlay" onClick={() => setSelected(null)}>
          <div className="drawer glass-card" onClick={(e) => e.stopPropagation()}>
            <button className="drawer-close" onClick={() => setSelected(null)}>
              <X size={18} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div className="drawer-avatar">{selected.nombre.charAt(0)}</div>
              <h2>{selected.nombre}</h2>
              <span className={`badge ${badgeClass[selected.estado]}`}>{selected.estado}</span>
            </div>

            <div className="drawer-info">
              <div><span>DNI</span><p>{selected.dni}</p></div>
              <div><span>Teléfono</span><p>{selected.telefono}</p></div>
              <div><span>Email</span><p>{selected.email}</p></div>
              <div><span>Créditos activos</span><p>{selected.creditosActivos}</p></div>
              <div><span>Fecha de registro</span><p>{selected.fechaRegistro}</p></div>
            </div>

            <div className="drawer-actions">
              <button className="btn btn-primary">Editar cliente</button>
              <button className="btn">Ver historial</button>
            </div>
          </div>
        </div>
      )}

      {/* -------- Modal crear -------- */}
      {showModal && (
        <div className="drawer-overlay" onClick={() => setShowModal(false)}>
          <div className="modal glass-card" onClick={(e) => e.stopPropagation()}>
            <button className="drawer-close" onClick={() => setShowModal(false)}>
              <X size={18} />
            </button>

            <h2>Nuevo cliente</h2>

            <div className="form-grid">
              <div className="form-group full">
                <label>Nombre completo</label>
                <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej. Mario Quispe" />
              </div>

              <div className="form-group">
                <label>DNI</label>
                <input value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} placeholder="Ej. 45896321" />
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="Ej. 987 654 321" />
              </div>

              <div className="form-group full">
                <label>Email</label>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Ej. correo@mail.com" />
              </div>
            </div>

            <div className="drawer-actions">
              <button className="btn btn-primary" onClick={handleCrear}>Guardar cliente</button>
              <button className="btn" onClick={() => setShowModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Clientes;
