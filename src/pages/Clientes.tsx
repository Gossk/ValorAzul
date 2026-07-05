import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, Plus, Search, Trash2, X, History, AlertTriangle, CheckCircle } from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
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

interface HistorialItem {
  id: string;
  vehiculo: string;
  tipo: string;
  monto: number;
  cuota: number;
  plazo: number;
  estado: string;
  fecha: string;
}

const PAGE_SIZE = 5;

const badgeClass: Record<EstadoCliente, string> = {
  Activo: 'badge-green',
  Pendiente: 'badge-yellow',
  Inactivo: 'badge-red',
};

const historialBadgeClass: Record<string, string> = {
  Aprobada: 'badge-green',
  'En evaluación': 'badge-blue',
  Rechazada: 'badge-red',
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatFecha() {
  const d = new Date();
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function Clientes() {
  const navigate = useNavigate();

  const [clientes, setClientes] = useState<ClienteFS[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('Todos');
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ClienteFS | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [historialCliente, setHistorialCliente] = useState<HistorialItem[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [form, setForm] = useState({ nombre: '', dni: '', telefono: '', email: '' });
  const [editForm, setEditForm] = useState<ClienteFS | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // ---- Toast auto-dismiss ----
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ---- Escuchar clientes en TIEMPO REAL con onSnapshot ----
  useEffect(() => {
    let seedReady = false;

    // Primero aseguramos el seed, luego abrimos el listener en tiempo real
    ensureSeedData()
      .then(() => {
        seedReady = true;
      })
      .catch((err) => {
        console.error('Error en seed:', err);
        seedReady = true; // Intentamos igual
      });

    // Listener en tiempo real: se ejecuta CADA VEZ que cambia algo en la colección
    const unsubscribe = onSnapshot(
      collection(db, 'clientes_negocio'),
      (snapshot) => {
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

        // Ordenar por fecha de registro (más reciente primero)
        lista.sort((a, b) => {
          const parseF = (f: string) => {
            const parts = f.split('/').map(Number);
            if (parts.length < 3) return 0;
            const [d, m, y] = parts;
            return new Date(y, m - 1, d).getTime();
          };
          return parseF(b.fechaRegistro) - parseF(a.fechaRegistro);
        });

        setClientes(lista);
        setLoading(false);
      },
      (err) => {
        console.error('Error en onSnapshot clientes:', err);
        setLoading(false);
        setToast({ message: 'Error al sincronizar clientes con la base de datos', type: 'error' });
      }
    );

    return () => unsubscribe();
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

  // ---- Eliminar cliente (con confirmación) ----
  const handleEliminar = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'clientes_negocio', id));
      // No necesitamos actualizar el estado local: onSnapshot lo hará automáticamente
      if (selected?.id === id) setSelected(null);
      setShowDeleteConfirm(null);
      setToast({ message: 'Cliente eliminado correctamente', type: 'success' });
    } catch (err) {
      console.error('Error eliminando cliente:', err);
      setToast({ message: 'Error al eliminar el cliente', type: 'error' });
    }
  };

  // ---- Crear cliente ----
  const handleCrear = async () => {
    if (!form.nombre.trim() || !form.dni.trim()) return;

    const newId = `cliente_${Date.now()}`;
    const fechaReg = formatFecha();

    setSaving(true);
    try {
      await setDoc(doc(db, 'clientes_negocio', newId), {
        nombre: form.nombre.trim(),
        dni: form.dni.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim(),
        creditosActivos: 0,
        estado: 'Pendiente',
        fechaRegistro: fechaReg,
      });
      // No necesitamos actualizar el estado local: onSnapshot lo hará automáticamente
      setForm({ nombre: '', dni: '', telefono: '', email: '' });
      setShowModal(false);
      setPage(1);
      setToast({ message: 'Cliente guardado correctamente', type: 'success' });
    } catch (err) {
      console.error('Error creando cliente:', err);
      setToast({ message: 'Error al guardar el cliente. Verifica permisos.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // ---- Editar cliente ----
  const handleOpenEdit = (cliente: ClienteFS) => {
    setEditForm({ ...cliente });
    setShowEditModal(true);
  };

  const handleEditar = async () => {
    if (!editForm || !editForm.nombre.trim() || !editForm.dni.trim()) return;

    setSaving(true);
    try {
      const clienteRef = doc(db, 'clientes_negocio', editForm.id);
      await updateDoc(clienteRef, {
        nombre: editForm.nombre.trim(),
        dni: editForm.dni.trim(),
        telefono: editForm.telefono.trim(),
        email: editForm.email.trim(),
        estado: editForm.estado,
      });
      // onSnapshot actualizará el estado automáticamente
      if (selected?.id === editForm.id) {
        setSelected({ ...editForm });
      }
      setShowEditModal(false);
      setEditForm(null);
      setToast({ message: 'Cliente actualizado correctamente', type: 'success' });
    } catch (err) {
      console.error('Error editando cliente:', err);
      setToast({ message: 'Error al actualizar el cliente', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // ---- Cambiar estado del cliente ----
  const handleCambiarEstado = async (cliente: ClienteFS, nuevoEstado: EstadoCliente) => {
    try {
      const clienteRef = doc(db, 'clientes_negocio', cliente.id);
      await updateDoc(clienteRef, { estado: nuevoEstado });
      // onSnapshot actualizará el estado automáticamente
      const updated = { ...cliente, estado: nuevoEstado };
      if (selected?.id === cliente.id) setSelected(updated);
      if (editForm?.id === cliente.id) setEditForm(updated);
    } catch (err) {
      console.error('Error cambiando estado:', err);
      setToast({ message: 'Error al cambiar el estado', type: 'error' });
    }
  };

  // ---- Ver historial del cliente ----
  const handleVerHistorial = async (cliente: ClienteFS) => {
    setSelected(cliente);
    setLoadingHistorial(true);
    setShowHistorialModal(true);

    try {
      const snapshot = await collection(db, 'historial');
      // Usar onSnapshot también para el historial para tener datos frescos
      const unsub = onSnapshot(
        collection(db, 'historial'),
        (snap) => {
          const registros: HistorialItem[] = [];
          snap.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.cliente === cliente.nombre) {
              registros.push({
                id: docSnap.id,
                vehiculo: data.vehiculo || '',
                tipo: data.tipo || '',
                monto: data.monto || 0,
                cuota: data.cuota || 0,
                plazo: data.plazo || 0,
                estado: data.estado || '',
                fecha: data.fecha || '',
              });
            }
          });
          registros.sort((a, b) => {
            const parseF = (f: string) => {
              const parts = f.split('/').map(Number);
              if (parts.length < 3) return 0;
              const [d, m, y] = parts;
              return new Date(y, m - 1, d).getTime();
            };
            return parseF(b.fecha) - parseF(a.fecha);
          });
          setHistorialCliente(registros);
          setLoadingHistorial(false);
        },
        (err) => {
          console.error('Error cargando historial:', err);
          setLoadingHistorial(false);
        }
      );

      // Cleanup: cerrar el listener cuando se cierre el modal
      // Lo guardamos en una variable para limpiar después
      return () => unsub();
    } catch (err) {
      console.error('Error cargando historial del cliente:', err);
      setLoadingHistorial(false);
    }
  };

  // ---- Ir a Historial global ----
  const handleIrHistorial = () => {
    navigate('/historial');
  };

  if (loading) {
    return <p style={{ color: 'rgba(255,255,255,0.6)', padding: 40, textAlign: 'center' }}>Cargando clientes...</p>;
  }

  return (
    <>
      {/* -------- Toast -------- */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{toast.message}</span>
          <button className="toast-close" onClick={() => setToast(null)}>
            <X size={14} />
          </button>
        </div>
      )}

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

      {/* -------- Resumen rápido -------- */}
      <div className="clientes-summary">
        <div className="summary-item">
          <span className="summary-number">{clientes.length}</span>
          <span className="summary-label">Total clientes</span>
        </div>
        <div className="summary-item">
          <span className="summary-number green">{clientes.filter(c => c.estado === 'Activo').length}</span>
          <span className="summary-label">Activos</span>
        </div>
        <div className="summary-item">
          <span className="summary-number yellow">{clientes.filter(c => c.estado === 'Pendiente').length}</span>
          <span className="summary-label">Pendientes</span>
        </div>
        <div className="summary-item">
          <span className="summary-number red">{clientes.filter(c => c.estado === 'Inactivo').length}</span>
          <span className="summary-label">Inactivos</span>
        </div>
      </div>

      {/* -------- Indicador de sincronización -------- */}
      <div className="sync-indicator">
        <span className="sync-dot"></span>
        <span>Sincronizado en tiempo real</span>
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
                <td>
                  <span
                    className={`badge ${badgeClass[cliente.estado]}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      const cycle: EstadoCliente[] = ['Activo', 'Pendiente', 'Inactivo'];
                      const currentIdx = cycle.indexOf(cliente.estado);
                      const nextEstado = cycle[(currentIdx + 1) % cycle.length];
                      handleCambiarEstado(cliente, nextEstado);
                    }}
                    title="Clic para cambiar estado"
                  >
                    {cliente.estado}
                  </span>
                </td>
                <td>
                  <div className="actions">
                    <button className="icon-action" onClick={() => setSelected(cliente)} title="Ver detalle">
                      <Eye size={16} />
                    </button>
                    <button className="icon-action edit" onClick={() => handleOpenEdit(cliente)} title="Editar">
                      <Pencil size={16} />
                    </button>
                    <button className="icon-action hist" onClick={() => handleVerHistorial(cliente)} title="Ver historial">
                      <History size={16} />
                    </button>
                    <button className="icon-action danger" onClick={() => setShowDeleteConfirm(cliente.id)} title="Eliminar">
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

      {/* -------- Modal detalle (drawer) -------- */}
      {selected && !showHistorialModal && (
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
              <button className="btn btn-primary" onClick={() => handleOpenEdit(selected)}>
                <Pencil size={16} /> Editar cliente
              </button>
              <button className="btn" onClick={() => handleVerHistorial(selected)}>
                <History size={16} /> Ver historial
              </button>
            </div>

            {/* Cambio rápido de estado en el drawer */}
            <div className="drawer-status-section">
              <span className="drawer-status-label">Cambiar estado</span>
              <div className="drawer-status-buttons">
                {(['Activo', 'Pendiente', 'Inactivo'] as EstadoCliente[]).map((est) => (
                  <button
                    key={est}
                    className={`status-toggle ${est === selected.estado ? 'active' : ''} ${badgeClass[est]}`}
                    onClick={() => handleCambiarEstado(selected, est)}
                  >
                    {est}
                  </button>
                ))}
              </div>
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
                <label>Nombre completo *</label>
                <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej. Mario Quispe" />
              </div>

              <div className="form-group">
                <label>DNI *</label>
                <input value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} placeholder="Ej. 45896321" maxLength={8} />
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="Ej. 987 654 321" />
              </div>

              <div className="form-group full">
                <label>Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Ej. correo@mail.com" />
              </div>
            </div>

            <div className="drawer-actions">
              <button className="btn btn-primary" onClick={handleCrear} disabled={saving || !form.nombre.trim() || !form.dni.trim()}>
                {saving ? 'Guardando...' : 'Guardar cliente'}
              </button>
              <button className="btn" onClick={() => setShowModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* -------- Modal editar -------- */}
      {showEditModal && editForm && (
        <div className="drawer-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal glass-card" onClick={(e) => e.stopPropagation()}>
            <button className="drawer-close" onClick={() => setShowEditModal(false)}>
              <X size={18} />
            </button>

            <h2>Editar cliente</h2>

            <div className="form-grid">
              <div className="form-group full">
                <label>Nombre completo *</label>
                <input value={editForm.nombre} onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })} />
              </div>

              <div className="form-group">
                <label>DNI *</label>
                <input value={editForm.dni} onChange={(e) => setEditForm({ ...editForm, dni: e.target.value })} maxLength={8} />
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <input value={editForm.telefono} onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Estado</label>
                <select
                  value={editForm.estado}
                  onChange={(e) => setEditForm({ ...editForm, estado: e.target.value as EstadoCliente })}
                >
                  <option value="Activo">Activo</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
            </div>

            <div className="drawer-actions">
              <button className="btn btn-primary" onClick={handleEditar} disabled={saving || !editForm.nombre.trim() || !editForm.dni.trim()}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button className="btn" onClick={() => setShowEditModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* -------- Modal historial del cliente -------- */}
      {showHistorialModal && selected && (
        <div className="drawer-overlay" onClick={() => setShowHistorialModal(false)}>
          <div className="modal glass-card historial-modal" onClick={(e) => e.stopPropagation()}>
            <button className="drawer-close" onClick={() => setShowHistorialModal(false)}>
              <X size={18} />
            </button>

            <div className="historial-modal-header">
              <div className="drawer-avatar small">{selected.nombre.charAt(0)}</div>
              <div>
                <h2>Historial de {selected.nombre}</h2>
                <p className="historial-subtitle">{historialCliente.length} registro{historialCliente.length !== 1 ? 's' : ''} encontrado{historialCliente.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {loadingHistorial ? (
              <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: 30 }}>
                Cargando historial...
              </p>
            ) : historialCliente.length === 0 ? (
              <div className="historial-empty">
                <History size={40} />
                <p>Este cliente no tiene registros en el historial</p>
                <button className="btn" onClick={handleIrHistorial}>Ver historial general</button>
              </div>
            ) : (
              <div className="historial-list">
                {historialCliente.map((item) => (
                  <div key={item.id} className="historial-item">
                    <div className="historial-item-top">
                      <div>
                        <strong>{item.vehiculo}</strong>
                        <span className={`badge ${historialBadgeClass[item.estado] || 'badge-blue'}`}>{item.estado}</span>
                      </div>
                      <span className="historial-fecha">{item.fecha}</span>
                    </div>
                    <div className="historial-item-details">
                      <div><span>Tipo</span><p>{item.tipo}</p></div>
                      <div><span>Monto</span><p>S/ {item.monto.toLocaleString('es-PE')}</p></div>
                      <div><span>Cuota</span><p>S/ {item.cuota.toLocaleString('es-PE')}</p></div>
                      <div><span>Plazo</span><p>{item.plazo} meses</p></div>
                    </div>
                  </div>
                ))}
                <button className="btn" style={{ marginTop: 16, width: '100%' }} onClick={handleIrHistorial}>
                  Ver historial completo →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------- Modal confirmar eliminación -------- */}
      {showDeleteConfirm && (
        <div className="drawer-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal glass-card delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-icon">
              <AlertTriangle size={48} />
            </div>
            <h2>¿Eliminar cliente?</h2>
            <p className="delete-confirm-text">
              Esta acción no se puede deshacer. El cliente será eliminado permanentemente del sistema.
            </p>
            <div className="drawer-actions">
              <button className="btn btn-danger" onClick={() => handleEliminar(showDeleteConfirm)}>
                <Trash2 size={16} /> Sí, eliminar
              </button>
              <button className="btn" onClick={() => setShowDeleteConfirm(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Clientes;
