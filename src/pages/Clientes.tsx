import { useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Search, Trash2, X } from 'lucide-react';

import { clientes as initialClientes, type Cliente, type EstadoCliente } from '../data/mockData';
import './Clientes.css';

const PAGE_SIZE = 5;

const badgeClass: Record<EstadoCliente, string> = {
  Activo: 'badge-green',
  Pendiente: 'badge-yellow',
  Inactivo: 'badge-red',
};

function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>(initialClientes);
  const [search, setSearch] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('Todos');
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Cliente | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ nombre: '', dni: '', telefono: '', email: '' });

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

  const handleEliminar = (id: number) => {
    setClientes((prev) => prev.filter((c) => c.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const handleCrear = () => {
    if (!form.nombre.trim() || !form.dni.trim()) return;
    const nuevo: Cliente = {
      id: Math.max(0, ...clientes.map((c) => c.id)) + 1,
      nombre: form.nombre,
      dni: form.dni,
      telefono: form.telefono,
      email: form.email,
      creditosActivos: 0,
      estado: 'Pendiente',
      fechaRegistro: '15/06/2026',
    };
    setClientes((prev) => [nuevo, ...prev]);
    setForm({ nombre: '', dni: '', telefono: '', email: '' });
    setShowModal(false);
    setPage(1);
  };

  return (
    <>
      <div className="clientes-header fade-in">
        <div className="search-filters">
          <div className="search-box">
            <Search size={18} />
            <input
              placeholder="Buscar por nombre o DNI..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <select value={estadoFiltro} onChange={(e) => { setEstadoFiltro(e.target.value); setPage(1); }}>
            <option value="Todos">Todos los estados</option>
            <option value="Activo">Activo</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Inactivo">Inactivo</option>
          </select>

          <input
            type="text"
            placeholder="dd/mm/aaaa"
            value={fechaFiltro}
            onChange={(e) => { setFechaFiltro(e.target.value); setPage(1); }}
            className="date-filter"
          />
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Nuevo Cliente
        </button>
      </div>

      <div className="panel glass-card fade-in">
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
              <tr key={cliente.id} className={idx % 2 === 0 ? 'row-even' : 'row-odd'}>
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
                    <button className="icon-action" title="Editar">
                      <Pencil size={16} />
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
                <td colSpan={6} className="empty-row">No se encontraron clientes.</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="pagination">
          <span>Mostrando {pageItems.length} de {filtrados.length} clientes</span>
          <div className="pagination-buttons">
            <button className="btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Anterior</button>
            <span className="page-indicator">Página {page} de {totalPages}</span>
            <button className="btn" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</button>
          </div>
        </div>
      </div>

      {selected && (
        <div className="drawer-overlay" onClick={() => setSelected(null)}>
          <div className="drawer glass-card" onClick={(e) => e.stopPropagation()}>
            <button className="drawer-close" onClick={() => setSelected(null)}><X size={20} /></button>

            <div className="drawer-avatar glow">{selected.nombre.charAt(0)}</div>
            <h2>{selected.nombre}</h2>
            <span className={`badge ${badgeClass[selected.estado]}`}>{selected.estado}</span>

            <div className="drawer-info">
              <div>
                <span>DNI</span>
                <p>{selected.dni}</p>
              </div>
              <div>
                <span>Teléfono</span>
                <p>{selected.telefono}</p>
              </div>
              <div>
                <span>Email</span>
                <p>{selected.email}</p>
              </div>
              <div>
                <span>Créditos activos</span>
                <p>{selected.creditosActivos}</p>
              </div>
              <div>
                <span>Fecha de registro</span>
                <p>{selected.fechaRegistro}</p>
              </div>
            </div>

            <div className="drawer-actions">
              <button className="btn btn-primary">Editar cliente</button>
              <button className="btn">Ver historial</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="drawer-overlay" onClick={() => setShowModal(false)}>
          <div className="modal glass-card" onClick={(e) => e.stopPropagation()}>
            <button className="drawer-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            <h2>Nuevo cliente</h2>

            <div className="form-grid">
              <div className="form-group">
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
              <div className="form-group">
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
