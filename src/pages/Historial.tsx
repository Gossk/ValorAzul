import { useEffect, useMemo, useState } from 'react';
import { CircleDollarSign, ClipboardList, Download, XCircle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { ensureSeedData } from '../data/firestoreSeeder';
import './Historial.css';

type EstadoSimulacion = 'Aprobada' | 'En evaluación' | 'Rechazada';

interface RegistroFS {
  id: string;
  cliente: string;
  vehiculo: string;
  tipo: 'Nuevo' | 'Usado';
  monto: number;
  cuota: number;
  plazo: number;
  estado: EstadoSimulacion;
  fecha: string;
}

const badgeClass: Record<EstadoSimulacion, string> = {
  Aprobada: 'badge-green',
  'En evaluación': 'badge-blue',
  Rechazada: 'badge-red',
};

const timelineIcon: Record<EstadoSimulacion, typeof CircleDollarSign> = {
  Aprobada: CircleDollarSign,
  'En evaluación': ClipboardList,
  Rechazada: XCircle,
};

function Historial() {
  const [historial, setHistorial] = useState<RegistroFS[]>([]);
  const [loading, setLoading] = useState(true);

  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [estado, setEstado] = useState('Todos');
  const [cliente, setCliente] = useState('Todos');

  // ---- Cargar historial desde Firestore (con auto-seed) ----
  useEffect(() => {
    const init = async () => {
      try {
        await ensureSeedData();
        const snapshot = await getDocs(collection(db, 'historial'));
        const lista: RegistroFS[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          lista.push({
            id: docSnap.id,
            cliente: data.cliente || '',
            vehiculo: data.vehiculo || '',
            tipo: data.tipo || 'Nuevo',
            monto: data.monto || 0,
            cuota: data.cuota || 0,
            plazo: data.plazo || 0,
            estado: data.estado || 'En evaluación',
            fecha: data.fecha || '',
          });
        });
        setHistorial(lista);
      } catch (err) {
        console.error('Error cargando historial:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ---- Clientes únicos para filtro ----
  const clientesUnicos = useMemo(() => {
    return Array.from(new Set(historial.map((h) => h.cliente)));
  }, [historial]);

  // ---- Simular datos por mes ----
  const simulacionesPorMes = useMemo(() => {
    const meses: Record<string, number> = {};
    const nombresMes = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    for (const h of historial) {
      const [, m] = h.fecha.split('/').map(Number);
      const key = nombresMes[m - 1] || 'N/A';
      meses[key] = (meses[key] || 0) + 1;
    }
    return nombresMes
      .filter((n) => meses[n])
      .map((mes) => ({ mes, simulaciones: meses[mes] }));
  }, [historial]);

  // ---- Parsear fecha dd/mm/yyyy ----
  const parseFecha = (fecha: string) => {
    const [d, m, y] = fecha.split('/').map(Number);
    return new Date(y, m - 1, d).getTime();
  };

  // ---- Filtrar ----
  const filtrados = useMemo(() => {
    return historial.filter((h) => {
      const matchEstado = estado === 'Todos' || h.estado === estado;
      const matchCliente = cliente === 'Todos' || h.cliente === cliente;
      const fechaTime = parseFecha(h.fecha);
      const matchDesde = !desde || fechaTime >= new Date(desde).getTime();
      const matchHasta = !hasta || fechaTime <= new Date(hasta).getTime();
      return matchEstado && matchCliente && matchDesde && matchHasta;
    });
  }, [historial, desde, hasta, estado, cliente]);

  // ---- Exportar CSV ----
  const handleExportCSV = () => {
    const headers = ['Cliente', 'Vehículo', 'Tipo', 'Monto', 'Cuota', 'Plazo', 'Estado', 'Fecha'];
    const rows = filtrados.map((h) => [h.cliente, h.vehiculo, h.tipo, h.monto, h.cuota, h.plazo, h.estado, h.fecha]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'historial_valorazul.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <p style={{ color: 'rgba(255,255,255,0.6)', padding: 40, textAlign: 'center' }}>Cargando historial...</p>;
  }

  return (
    <>
      {/* -------- Filtros -------- */}
      <div className="historial-filters">
        <div className="filter-group">
          <label>Desde</label>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="filter-group">
          <label>Hasta</label>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
        <div className="filter-group">
          <label>Estado</label>
          <select value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option>Todos</option>
            <option>Aprobada</option>
            <option>En evaluación</option>
            <option>Rechazada</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Cliente</label>
          <select value={cliente} onChange={(e) => setCliente(e.target.value)}>
            <option>Todos</option>
            {clientesUnicos.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <button className="btn export-btn" onClick={handleExportCSV}>
          <Download size={15} /> Exportar CSV
        </button>
      </div>

      {/* -------- Chart -------- */}
      <div className="glass-card chart-panel">
        <h3>Volumen de simulaciones por mes</h3>
        <div className="rechart-box">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={simulacionesPorMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="mes" stroke="rgba(255,255,255,0.4)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} />
              <Tooltip
                contentStyle={{ background: 'rgba(13,27,53,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 13 }}
                itemStyle={{ color: '#f0f4ff' }}
              />
              <Bar dataKey="simulaciones" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* -------- Grid: Timeline + Table -------- */}
      <div className="historial-grid">
        <div className="glass-card panel">
          <h3>Actividad reciente</h3>
          <div className="timeline">
            {historial.slice(0, 8).map((item) => {
              const Icon = timelineIcon[item.estado];
              return (
                <div key={item.id} className="timeline-item">
                  <div className={`timeline-icon ${item.estado === 'Aprobada' ? 'badge-green' : item.estado === 'Rechazada' ? 'badge-red' : 'badge-blue'}`}>
                    <Icon size={16} />
                  </div>
                  <div className="timeline-content">
                    <strong>{item.cliente}</strong>
                    <p>{item.vehiculo}</p>
                    <span className={`badge ${badgeClass[item.estado]}`}>{item.estado}</span>
                  </div>
                  <small>{item.fecha}</small>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card panel">
          <h3>Historial completo ({filtrados.length})</h3>
          <div className="table-wrap">
            <table className="historial-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Vehículo</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                  <th>Cuota</th>
                  <th>Plazo</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 0 ? 'row-even' : ''}>
                    <td>{item.cliente}</td>
                    <td>{item.vehiculo}</td>
                    <td>{item.tipo}</td>
                    <td>S/ {item.monto.toLocaleString('es-PE')}</td>
                    <td>S/ {item.cuota.toLocaleString('es-PE')}</td>
                    <td>{item.plazo}m</td>
                    <td><span className={`badge ${badgeClass[item.estado]}`}>{item.estado}</span></td>
                    <td>{item.fecha}</td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={8} className="empty-row">
                      No hay registros para los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default Historial;
